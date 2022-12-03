// 云函数入口文件
const cloud = require('wx-server-sdk')

cloud.init({
  env: cloud.DYNAMIC_CURRENT_ENV
}) // 使用当前云环境
const db = cloud.database({
  throwOnNotFound: false,
})

// 在在服务器上启动抓包，然后刷卡（扫码），将会获得这样的数据：
// GET /data/Acs.aspx?method=SearchCardAcs&type=9&Reader=1&DataLen=24&Index=15319&
// Serial=R12034&Status=03&Input=0000&Ver=135&ID=R12034&MAC=0004A33CCCB2&Card=ODIwNDM0MjE3NDQwMDIwNA== HTTP/1.1
// Host:192.168.1.230:83
// User-Agent: Chrome/61.0.3163.100 Safari/537.36
// Content-Type: application/octet-stream
// Connection: keep-Alive

// 自己写代码接收，向控制器应答以下字符串即可(请抓包确认)
// {"ActIndex":"0","AcsRes":"1","Time":"1"}
// 控制器的首页会显示允许进出，可以多次测试。
// 根据业务调整对应的AcsRes值，1开启，0不开启；
// 如果是控制闸机，则Time=1；
// 参数ActIndex=Reader&0x01, Reader是刷卡后获得的字段, 0进，1出。

const ALLOW = {
  "AcsRes": "1",
  "Time": "1",
  "NOTE": ''
}

const REJECT = {
  "AcsRes": "0",
  "Time": "1"
}

// 云函数入口函数
exports.main = async (event, context) => {
  const wxContext = cloud.getWXContext()
  const reader = event.queryStringParameters.Reader
  console.log('event: ', event.queryStringParameters)
  if (reader === '1') { // 离场
    return ALLOW
  }
  const card = event.queryStringParameters.Card
  if (!card || card.length === 0) {
    REJECT.NOTE = '未传入二维码参数'
    return REJECT
  }
  // 二维码格式 "type_id"，type=0表示是个人二维码，type=1表示场地二维码
  console.log("开始识别二维码")
  const type = card[0]
  const code_id = card.substring(2)
  try {
    if (type === '0') { // 识别散客码
      console.log('散客二维码')
      const getMember = await db.collection('members').where({
        _openid: code_id
      }).get()
      console.log(getMember)
      if (getMember.data.length === 0) {
        REJECT.NOTE = "该用户不存在"
        return REJECT
      }
      const member = getMember.data[0]
      if (member.validTimes <= 0) {
        REJECT.NOTE = "散客卡次数不足"
        return REJECT
      }
      console.log("次卡充足，允许入场")
      await db.collection('admissions').add({
        data: {
          created: new Date().getTime(),
          _openid: code_id
        }
      })
      await db.collection('members').where({
        _openid: code_id,
      }).update({
        data: {
          validTimes: db.command.inc(-1)
        }
      })
      ALLOW.NOTE = '散客入场'
      return ALLOW
    } else if (type=== '1') { // 识别场地二维码
      console.log("场地二维码")
      const getCourtOrder = await db.collection('court_orders').doc(code_id).get()
      if (!getCourtOrder.data) {
        console.log('查询订单信息失败',getCourtOrder)
        REJECT.NOTE = "查询订单失败"
        return REJECT
      }
      const order = getCourtOrder.data
      if (order.status !== 1) {
        REJECT.NOTE = "订单未支付"
        return REJECT
      }
      const currentTS = new Date().getTime()
      console.log(currentTS)
      if (order.start - currentTS > 1000 * 60 * 30) { // 开场前30分钟以上
        REJECT.NOTE = "未到入场时间"
        return REJECT
      } else if(currentTS > order.end) { // 已过期
        REJECT.NOTE = "已过期"
        return REJECT
      }
      ALLOW.NOTE = '包场入场'
      return ALLOW
    }
  } catch (error) {
    REJECT.NOTE = '未知异常'
    return REJECT
  }
  REJECT.NOTE = '未知异常'
  return REJECT
}
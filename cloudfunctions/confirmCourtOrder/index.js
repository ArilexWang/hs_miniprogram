// 云函数入口文件
const cloud = require('wx-server-sdk')

cloud.init({
  env: cloud.DYNAMIC_CURRENT_ENV
}) // 使用当前云环境
const db = cloud.database({
  throwOnNotFound: false,
})
// 云函数入口函数
exports.main = async (event, context) => {
  const wxContext = cloud.getWXContext()
  console.log(wxContext)
  if (!event.orderId) {
    return {
      errorMsg: "未传入订单号"
    }
  }
  const orderId = event.orderId
  const transaction = await db.startTransaction()
  var errorMsg = ''
  try {
    const courtOrderTransaction = transaction.collection('court_orders')
    const memberTransaction = transaction.collection('members')
    const getOrder = await courtOrderTransaction.doc(orderId).get()
    if (!getOrder.data) {
      errorMsg = '未查询到对应订单'
      return
    }
    const order = getOrder.data
    console.log("order", order)
    if (order.status === 1) {
      errorMsg = "已是有效订单"
      return
    }
    const getMember = await memberTransaction.where({
      phoneNum: order.phoneNum
    }).get()
    if (getMember.data.length === 0) {
      errorMsg = '未查询到用户'
    }
    const member = getMember.data[0]

    if (order.price > 0) { // 价格大于0
      if (event.payBy === 0) { // 余额支付
        if (member.cash < order.price) {
          errorMsg = '余额不足'
          return
        }
        console.log('member', member)
        const updateMemberCash = await memberTransaction.doc(member._id).update({
          data: {
            cash: member.cash - order.price
          }
        })
        if (updateMemberCash.stats.updated !== 1 && updateMemberCash.stats.updated !== 0) {
          console.log(updateMemberCash)
          errorMsg = "扣除余额失败"
          return
        }
        // 扣除余额成功，修改为有效订单
        const updateCourtOrder = await courtOrderTransaction.doc(order._id).update({
          data: {
            payMsg: {
              transactionId: '余额支付'
            },
            status: 1
          }
        })
        if (updateCourtOrder.stats.updated !== 1) {
          errorMsg = '更新订单状态失败'
          return
        }
      } else { // 微信支付

      }
    } else if (order.price === 0) { // 直接修改订单为有效订单
      const updateCourtOrder = await courtOrderTransaction.doc(order._id).update({
        data: {
          status: 1
        }
      })
      if (updateCourtOrder.stats.updated !== 1) {
        errorMsg = '更新订单状态失败'
        return
      }
    }
  } catch (error) {
    console.log(error)
    errorMsg = error
  } finally {
    if (errorMsg.length === 0) {
      await transaction.commit()
    }
    return {
      errorMsg: errorMsg
    }
  }

  return {
    event,
    openid: wxContext.OPENID,
    appid: wxContext.APPID,
    unionid: wxContext.UNIONID,
  }
}
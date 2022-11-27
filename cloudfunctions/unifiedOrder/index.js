// 云函数入口文件
const cloud = require('wx-server-sdk')
const dateFormat = require('dateformat')

cloud.init({
  env: cloud.DYNAMIC_CURRENT_ENV
}) // 使用当前云环境
const db = cloud.database({
  throwOnNotFound: false,
})
// 云函数入口函数
exports.main = async (event, context) => {
  const wxContext = cloud.getWXContext()
  console.log(event, wxContext)
  var ip = wxContext.CLIENTIP
  if (wxContext.CLIENTIP == "" || wxContext.CLIENTIP == undefined) {
    ip = "127.0.0.1"
  }
  var collection = ''
  switch (event.orderType) {
    case 0:
      collection = 'court_orders'
      break;
    case 1:
      collection = 'recharge_orders'
      break;
    case 2:
      collection = 'cash_orders'
    default:
      break;
  }
  const getOrder = await db.collection(collection).doc(event.orderid).get()
  console.log(getOrder)
  if (!getOrder.data) {
    return {
      errMsg: '查询订单失败'
    }
  }
  const order = getOrder.data
  const getMember = await db.collection('members').where({
    _openid: order._openid
  }).get()
  if (getMember.data.length !== 1) {
    return {
      errorMsg: '查询用户失败'
    }
  }
  const member = getMember.data[0]
  console.log(member)
  var actualPrice = order.price
  var costIntegral = 0
  if (order.useIntegral && member.integral >= 500) { // 使用积分
    if (member.integral > order.price * 100) { // 用积分可以完成支付
      costIntegral = order.price * 100
      actualPrice = 0
    } else {
      costIntegral = member.integral
      actualPrice = order.price - (costIntegral / 100)
    }
  }
  const updateOrder = await db.collection(collection).doc(order._id).update({
    data: {
      payBy: 1,
      costIntegral: costIntegral,
      actualPrice: actualPrice
    }
  })
  console.log('更新订单', updateOrder)
  if (updateOrder.stats.updated !== 1) {
    return {
      errorMsg: '更新订单状态失败'
    }
  }
  console.log('实际支付', actualPrice)
  const res = await cloud.cloudPay.unifiedOrder({
    "envId": wxContext.ENV,
    "functionName": 'payCallback',
    "subMchId": "1635247742",
    "nonceStr": Math.random().toString(32),
    "body": "荟晟篮球中心-小程序",
    "outTradeNo": order._id,
    "totalFee": wxContext.ENV === 'cloudbase-baas-6giq7e77eb05e71c' ? 1 : actualPrice,
    "spbillCreateIp": ip,
    "tradeType": "JSAPI",
    "timeStart": dateFormat(new Date(), "yyyyMMddHHmmss"),
    "attach": JSON.stringify(event.orderType)
  })
  return {
    errMsg: 'success',
    res,
  }
}
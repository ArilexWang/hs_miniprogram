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
  if (event.returnCode !== 'SUCCESS' || event.resultCode !== 'SUCCESS') {
    return { "errcode": 0, errmsg: '支付失败,' + JSON.stringify(event) }
  }
  var collection = ''
  if (event.attach === '0') {
    collection = 'court_orders'
  } else if(event.attach === '1') {
    collection = 'recharge_orders'
  } else if(event.arrach === '2') {
    collection = 'cash_orders'
  }
  const orderId = event.outTradeNo
  const getOrder = await db.collection(collection).doc(orderId).get()
  const order = getOrder.data
  if (collection === 'recharge_orders') { // 散客订单
    const updateMember = await db.collection('members').where({
      _openid: order._openid
    }).update({
      data: {
        integral: db.command.inc(0 - order.costIntegral + parseInt(order.actualPrice)),
        validTimes: db.command.inc(order.value)
      }
    })
    if (updateMember.stats.updated !== 1 && updateMember.stats.updated !== 0) {
      return {
        errcode: 0,
        errmsg: '更新用户信息失败,' + JSON.stringify(updateMember)
      }
    }
  }
  
  const updateOrder = await db.collection(collection).doc(order._id).update({
    data: {
      transactionId: event.transactionId,
      status: 1,
    }
  })
  if (updateOrder.stats.updated !== 1 && updateOrder.stats.updated !== 0) {
    return {
      errcode: 0,
      errmsg: '更新订单状态失败,' + JSON.stringify(updateOrder)
    }
  }
  return { "errcode": 0, errmsg: JSON.stringify(event) }
}
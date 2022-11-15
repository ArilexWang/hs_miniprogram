// 云函数入口文件
const { get } = require('http')
const cloud = require('wx-server-sdk')

cloud.init({ env: cloud.DYNAMIC_CURRENT_ENV }) // 使用当前云环境
const db = cloud.database({
  throwOnNotFound: false,
})
// 云函数入口函数
exports.main = async (event, context) => {
  // event: { orderType, orderid, openid }
  var collection = ''
  switch (event.orderType) {
    case 0:
      collection = 'court_orders'
      break;
    default:
      break;
  }
  if (collection.length === 0) {
    return { errorMsg: '无对应类型订单' }
  }
  const transaction = await db.startTransaction()
  const orderTransaction = transaction.collection(collection)
  const memberTransaction = transaction.collection('members')
  const getOrder = await orderTransaction.doc(event.orderid).get()
  console.log(getOrder)
  if (getOrder.data._id.length === 0) {
    return { errorMsg: '查询场地订单失败' }
  }
  const order = getOrder.data
  const getMember = await memberTransaction.where({
    _openid: event.openid
  }).get()
  if (getMember.data.length !== 1) {
    return { errorMsg: '查询用户失败' }
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
  if (member.cash < actualPrice) { // 余额不足
    return { errorMsg: '余额不足，支付失败' }
  }
  console.log(member.cash, actualPrice)
  const updateMember = await memberTransaction.doc(member._id).update({
    data: {
      cash: member.cash - actualPrice,
      intergal: member.integral - costIntegral
    }
  })
  console.log(updateMember)
  if(updateMember.stats.updated !== 1) {
    return { errorMsg: '更新用户余额失败' }
  }
  const updateOrder = await orderTransaction.doc(order._id).update({
    data:{
      status: 1,
      payBy: 0,
      costIntegral: costIntegral,
      actualPrice: actualPrice
    }
  })
  if(updateOrder.stats.updated !== 1) {
    return { errorMsg: '更新订单状态失败' }
  }
  await transaction.commit()
  return { errorMsg: 'success' }
}
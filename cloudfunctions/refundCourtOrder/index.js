// 云函数入口文件
const cloud = require('wx-server-sdk')

cloud.init({ env: cloud.DYNAMIC_CURRENT_ENV }) // 使用当前云环境
const db = cloud.database({
  throwOnNotFound: false,
})
// 云函数入口函数
exports.main = async (event, context) => {
  const orderid = event.orderid
  const transaction = await db.startTransaction()
  const orderTransaction = transaction.collection('court_orders')
  const memberTransaction = transaction.collection('members')
  const getOrder = await orderTransaction.doc(orderid).get()
  console.log(getOrder)
  if (!getOrder.data._id) {
    return { errorMsg: '查询场地订单失败' }
  }
  const order = getOrder.data
  const getMember = await memberTransaction.where({
    _openid: order._openid
  }).get()
  if (getMember.data.length !== 1) {
    return { errorMsg: '查询用户失败' }
  }
  const member = getMember.data[0]
  if (order.payBy === 0 && order.status === 1) { // 余额支付
    console.log("使用余额支付")
    const updateOrder = await orderTransaction.doc(order._id).update({
      data: {
        status: 2,
      }
    })
    if(updateOrder.stats.updated !== 1) {
      return { errorMsg: '更新订单状态失败' }
    }
    const updateMember = await memberTransaction.doc(member._id).update({
      data: {
        cash: member.cash + order.actualPrice,
      }
    })
    if(updateMember.stats.updated !== 1) {
      return { errorMsg: '更新用户余额失败' }
    }
    await transaction.commit()
    return { errorMsg: 'success' }
  }
  return {
    event,
  }
}
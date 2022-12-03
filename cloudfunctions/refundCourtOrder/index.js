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
  const orderid = event.orderid
  const transaction = await db.startTransaction()
  const orderTransaction = transaction.collection('court_orders')
  const memberTransaction = transaction.collection('members')
  const getOrder = await orderTransaction.doc(orderid).get()
  console.log(getOrder)
  if (!getOrder.data._id) {
    return {
      errorMsg: '查询场地订单失败'
    }
  }
  const order = getOrder.data
  const getMember = await memberTransaction.where({
    _openid: order._openid
  }).get()
  if (getMember.data.length !== 1) {
    return {
      errorMsg: '查询用户失败'
    }
  }
  const member = getMember.data[0]
  if (order.payBy === 0 && order.status === 1) { // 余额支付
    console.log("使用余额支付")
    const updateMember = await memberTransaction.doc(member._id).update({
      data: {
        cash: member.cash + order.actualPrice,
      }
    })
    if (updateMember.stats.updated !== 1) {
      return {
        errorMsg: '更新用户余额失败'
      }
    }
  } else if (order.payBy === 1 && order.status === 1 && event.handleBy !== 'backend') { // 非后台操作微信支付
    if (member.integral < order.actualPrice) {
      return {
        errorMsg: '积分不足，无法完成退款'
      }
    }
    console.log('微信支付退款', order)
    const res = await cloud.cloudPay.refund({
      "envId": wxContext.ENV,
      "functionName": 'refundCallback',
      "sub_mch_id": '1635247742',
      "transaction_id": order.transactionId,
      "nonceStr": Math.random().toString(32),
      "totalFee": order.totalFee,
      "refund_fee": order.totalFee,
      "out_refund_no": order._id,
    })
    console.log('退款结果', res)
    if (res.returnCode === 'SUCCESS' && res.returnMsg === 'OK') { // 退款成功
      console.log('扣除积分，剩余积分：', member.integral - order.actualPrice)
      const updateMember = await memberTransaction.doc(member._id).update({
        data: {
          integral: member.integral - order.actualPrice,
        }
      })
      if (updateMember.stats.updated !== 1 && updateMember.stats.updated !== 0) {
        console.log(updateMember)
        return {
          errorMsg: '更新用户余额失败'
        }
      }
    } else {
      return {
        errorMsg: '退款失败'
      }
    }
  }
  const updateOrder = await orderTransaction.doc(order._id).update({
    data: {
      status: 2,
    }
  })
  if (updateOrder.stats.updated !== 1) {
    return {
      errorMsg: '更新订单状态失败'
    }
  }
  await transaction.commit()
  return {
    errorMsg: 'success'
  }
}
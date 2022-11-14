// 云函数入口文件
const { get } = require('http')
const cloud = require('wx-server-sdk')

cloud.init({ env: cloud.DYNAMIC_CURRENT_ENV }) // 使用当前云环境
const db = cloud.database({
  throwOnNotFound: false,
})
// 云函数入口函数
exports.main = async (event, context) => {
  const wxContext = cloud.getWXContext()
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
  var actualPrice = order.price
  var needIntegal = 0
  if (order.useIntegral && member.integral >= 500) { // 使用积分
    if (member.integral > order.price * 100) { // 用积分可以完成支付
      needIntegal = order.price * 100
      actualPrice = 0
    } else {
      needIntegal = member.integral
      actualPrice = order.price - (needIntegal / 100)
    }
  }
  if (member.cash < actualPrice) { // 余额不足
    return { errorMsg: '余额不足，支付失败' }
  }

  const updateMember = await memberTransaction.doc(member.id).update({
    data: {
      cash: member.cash - actualPrice,
      intergal: member.integral - needIntegal
    }
  })
  console.log(updateMember)
  
  return {
    event,
    openid: wxContext.OPENID,
    appid: wxContext.APPID,
    unionid: wxContext.UNIONID,
  }
}
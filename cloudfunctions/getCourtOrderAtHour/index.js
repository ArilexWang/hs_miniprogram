// 云函数入口文件
const cloud = require('wx-server-sdk')

cloud.init({ env: cloud.DYNAMIC_CURRENT_ENV }) // 使用当前云环境
const db = cloud.database({
  throwOnNotFound: false,
})
// 云函数入口函数
exports.main = async (event, context) => {
  const wxContext = cloud.getWXContext()
  console.log(event)
  const getOrders = await db.collection('court_orders').where({
    start: event.start
  }).get()
  console.log(getOrders)
  if (getOrders.data.length === 0) {
      return {
        orders: [],
        courts: []
      }
  }
  const orders = getOrders.data
  var courts = []
  orders.forEach(element => {
    console.log(element.courts)
    courts = courts.concat(element.courts)
  });
  console.log(courts)
  return {
    orders: orders,
    courts: courts
  }
  return {
    event,
    openid: wxContext.OPENID,
    appid: wxContext.APPID,
    unionid: wxContext.UNIONID,
  }
}
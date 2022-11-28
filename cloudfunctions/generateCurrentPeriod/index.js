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
  const currentPeriod = {}
  const period = event.period
  const date = new Date(event.date)
  const setDate = (hourDate, date) => {
    hourDate.setFullYear(date.getFullYear())
    hourDate.setMonth(date.getMonth())
    hourDate.setDate(date.getDate())
  }
  const start = new Date(period.start)
  setDate(start, date)
  const end = new Date(period.end)
  setDate(end, date)
  const middle = new Date(start)
  middle.setHours(start.getHours() + 1)
  // 设置起始时间，中间时间，结束时间
  currentPeriod.start = start.getTime()
  currentPeriod.middle = middle.getTime()
  currentPeriod.end = end.getTime()

  const getOrder = await db.collection('court_orders').where({
    start: start.getTime()
  }).get()
  const orders = getOrder.data
  currentPeriod.orders = orders
  var existCourts = []
  const currentTimestamp = new Date().getTime()
  currentPeriod.canOrderFirstShoot = true
  currentPeriod.canOrderSecondShoot = true
  orders.forEach(element => {
    if (element.status === 2) {
      // 已退款订单
      console.log("已退款订单")
      return
    }
    if (element.status === 0 && currentTimestamp - element.created > 1000 * 60 * 5) {
      return // 未支付，且过去5分钟，无效订单
    }
    console.log('element', element)
    existCourts = existCourts.concat(element.selectedCourts)
    if (element.firstShoot) {
      currentPeriod.canOrderFirstShoot = false
    }
    if (element.secondShoot) {
      currentPeriod.canOrderSecondShoot = false
    }
  });
  console.log('exist', existCourts)
  const getCourts = await db.collection('courts').where({
    _id: db.command.lt(7)
  }).get()
  const originCourts = getCourts.data

  const courts = originCourts.map((court) => {
    const occured = existCourts.find(item => item._id === court._id)
    const valid = period.courts.find(item => item === court._id)
    if (occured || !valid) {
      court.status = 0
    } else {
      court.status = 1
    }
    return court
  })
  currentPeriod.courts = courts
  currentPeriod.avaliable = 2
  courts.forEach(element => {
    if (element.status === 1) {
      currentPeriod.avaliable = 1
    }
  });
  // 若当前时间已经超过结束时间，则无法预定
  if(currentPeriod.end < new Date().getTime()) {
    currentPeriod.avaliable = 0
  }
  return currentPeriod
}
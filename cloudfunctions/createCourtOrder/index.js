// 云函数入口文件
const { start } = require('repl')
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
  console.log(event)
  var newOrderId = ''
  if (!event.params) {
    return { errorMsg: '未携带参数'}
  }
  const params = event.params
  params.status = 0
  const getMember = await db.collection('members').where({
    _openid: params._openid
  }).get()
  if (getMember.data.length === 0) {
    return { errorMsg: '用户不存在'}
  }
  const transaction = await db.startTransaction()
  var errorMsg = ''
  try {
    const courtOrderTransaction = transaction.collection('court_orders')
    const getOrders = await courtOrderTransaction.where({
      "start": params.start
    }).get()
    const creatNewOrder = async (orderParams) => {
      orderParams.created = new Date().getTime()
      const newOrderRes = await courtOrderTransaction.add({
        data: params
      })
      if (newOrderRes._id.length > 0) {
        console.log("新建订单成功", newOrderRes)
        return newOrderRes._id
      }
      errorMsg = "新建订单失败"
      return ''
    }

    if (getOrders.data.length == 0) { // 2.1 该时间段没有场地被预定，直接执行新建订单逻辑  
      newOrderId = await creatNewOrder(params)
      return
    }

    // 2.2 该时间段已有订单，检查场地或投篮机是否被占用
    const existOrders = getOrders.data
    const exist = courtHasExist(params, existOrders)
    if (exist) {
      errorMsg = "预定失败，场地或投篮机已被占用"
      return
    }
    newOrderId = await creatNewOrder(params)
  } catch (error) {
    console.log(error)
  } finally {
    await transaction.commit()
    console.log('newOrderId', newOrderId)
    if (newOrderId.length > 0) {
      const res = await db.collection('court_orders').doc(newOrderId).get()
      console.log("新建订单成功：", res.data)
      return res.data
    }
    return { errorMsg: errorMsg }
  }
}

courtHasExist = (orderParams, existOrders) => {
  const existCourts = []
  var firstShoot = false
  var secondShoot = false
  existOrders.forEach((order) => {
    if (!isValidOrder(order)) { // 不检查无效订单
      return
    }
    console.log("有效订单：", order)
    existCourts.push(...order.selectedCourts)
    if (order.firstShoot) {
      firstShoot = true
    }
    if (order.secondShoot) {
      secondShoot = true
    }
  })
  // 1，检查场地是否被占用
  var exist = false
  orderParams.selectedCourts.forEach(court => {
    const target = existCourts.find(item => {
      return item._id === court._id
    })
    if (target !== undefined) {
      console.log("场地被占用：", target)
      exist = true
    }
  });
  if (exist) return true
  if (orderParams.firstShoot && firstShoot) {
    console.log("前一小时投篮机被占用")
    return true
  }
  if (orderParams.secondShoot && secondShoot) {
    console.log("后一小时投篮机被占用")
    return true
  }
  return false
}

isValidOrder = (order) => {
  if (order.status === 1) { // 1.1 订单已支付，
    return true
  } else if (order.status === 0) { // 1.2 订单未支付
    const current = new Date().getTime()
    if (current - order.created < 60000) { // 还在生效中
      return true
    } else {
      console.log("距离订单创建已过去：", current - order.created)
    }
  }
  console.log("无效订单：", order)
  return false
}
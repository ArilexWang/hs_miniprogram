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
  const courts = event.selectedCourts
  var totalCost = 0;
  const getOriginCourts = await db.collection('courts').get()
  const originCourts = getOriginCourts.data
  console.log('origin', originCourts)
  const tempCourts = JSON.parse(
    JSON.stringify(courts)
  );
  tempCourts.sort(function (a, b) {
    return a._id - b._id
  })
  const findNum = (search, array) => {
    for (var i in array) {
      if (array[i]._id == search) {
        return true;
      }
    }
    return false;
  }
  if (findNum(1, tempCourts) && findNum(2, tempCourts)) {
    const target = originCourts.find(item => item._id === 7)
    totalCost += target.price
    for (let index = 0; index < 2; index++) {
      tempCourts.map((item, index) => {
        if (item._id === 1 || item._id === 2) {
          tempCourts.splice(index, 1)
        }
      })
    }
  }
  if (findNum(3, tempCourts) && findNum(4, tempCourts)) {
    const target = originCourts.find(item => item._id === 9)
    totalCost += target.price
    for (let index = 0; index < 2; index++) {
      tempCourts.map((item, index) => {
        if (item._id === 3 || item._id === 4) {
          tempCourts.splice(index, 1)
        }
      })
    }
  }
  if (findNum(5, tempCourts) && findNum(6, tempCourts)) {
    const target = originCourts.find(item => item._id === 13)
    totalCost += target.price
    for (let index = 0; index < 2; index++) {
      tempCourts.map((item, index) => {
        if (item._id === 5 || item._id === 6) {
          tempCourts.splice(index, 1)
        }
      })
    }
  }
  tempCourts.forEach(element => {
    console.log(element)
    totalCost += element.price
  })
  if (event.firstShoot) {
    totalCost += 180
  }
  if (event.secondShoot) {
    totalCost += 180
  }
  console.log(totalCost)
  return {
    price: totalCost,
  }
}
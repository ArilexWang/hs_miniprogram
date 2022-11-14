// pages/courtOrder/courtOrder.js
var dateFormat = require('dateformat');
const app = getApp()

Page({

  /**
   * 页面的初始数据
   */
  data: {
    period: {}
  },

  /**
   * 生命周期函数--监听页面加载
   */
  async onLoad(options) {
    // const eventChannel = this.getOpenerEventChannel()
    // eventChannel.on('acceptDataFromOpenerPage', function(data) {
    //   console.log(JSON.stringify(data))
    // })
    const data = {"data":{"start":1668823200000,"middle":1668826800000,"end":1668830400000,"orders":[{"_id":"f80c64da63705bd90096820a05ef5e26","courts":[{"_id":2,"name":"A2","price":260}],"date":1668787200000,"member":{"_id":"4e51c636636f50ea003aa2136b895882","_openid":"ootUG4_x-ypBrAAKbAZiJt8S-aeE","avatarUrl":"https://thirdwx.qlogo.cn/mmopen/vi_32/Q0j4TwGTfTLEjk9w6ibSplRD14OKicC3hOGNJbh6zRWB0qicqf2miclxNh4PgIaNNbZXEhaGpWScIQd65ccnu43Pxw/132","cash":220,"created":"2022-11-12T07:53:14.446Z","integral":0,"nickName":"Alex王振","phoneNum":"1","validTimes":0},"period":{"_id":"c03e44456366556300a2a2b47c25d0c0","courts":[2,3,4,5,6],"day":6,"end":1668139200000,"endHour":12,"endMinute":0,"format":"10:00 - 12:00","start":1668132000000,"startHour":10,"startMinute":0},"phoneNum":"1","price":0,"status":1,"start":1668823200000,"end":1668830400000,"created":1668307929194}],"canOrderFirstShoot":true,"canOrderSecondShoot":true,"courts":[{"_id":1,"name":"A1","price":260,"status":0,"imageUrl":"../../src/A1-0.jpg"},{"_id":2,"name":"A2","price":260,"status":0,"imageUrl":"../../src/A2-0.jpg"},{"_id":3,"name":"B1","price":160,"status":2,"imageUrl":"../../src/B1-2.jpg"},{"_id":4,"name":"B2","price":160,"status":2,"imageUrl":"../../src/B2-2.jpg"},{"_id":5,"name":"C1","price":160,"status":1,"imageUrl":"../../src/C1-1.jpg"},{"_id":6,"name":"C2","price":160,"status":1,"imageUrl":"../../src/C2-1.jpg"}],"avaliable":1,"format":"2022-11-19 10:00 - 12:00","hourFormat":"10:00 - 12:00","firstFormat":"10:00-11:00","lastFormat":"11:00-12:00","needReferee":true,"firstShoot":false,"secondShoot":false}}
    console.log(data.data)
    this.setData({
      options: data.data
    })
  },
  async onLoadLogin() {
    const userInfo = app.globalData.userInfo
    this.setData({
      userInfo: userInfo
    })
    const period = this.data.options
    period._openid = userInfo._openid
    const selectedCourts = []
    period.courts.forEach(element => {
      if (element.status === 2) {
        selectedCourts.push(element)
      }
    });
    period.selectedCourts = selectedCourts
    const selectedCourtNames = selectedCourts.map((item) => {
      return item.name
    })
    const selectedCourtsFormat = selectedCourtNames.join(',')
    period.selectedCourtsFormat = selectedCourtsFormat
    period.dateFormat = dateFormat(period.start, 'yyyy-mm-dd')
    const res = await wx.cloud.callFunction({
      name: 'calculateCourtPrice',
      data: {
        courts: selectedCourts
      }
    })
    period.price = res.result.price
    period.actualPrice = res.result.price
    this.setData({
      period: period
    })
  },
  checkBoxChanged(e) {
    console.log(e.detail)
    const period = this.data.period
    if (e.detail.value.length > 0) {
      period.actualPrice -= (this.data.userInfo.integral / 100)
      period.useIntegral = true
    } else {
      period.actualPrice = period.price
      period.useIntegral = false
    }
    this.setData({
      period: period
    })
  },
  async confirmOrder() {
    
  },
  async onConfirmClick(){
    const res111 = await wx.cloud.callFunction({
      name: 'payByCash',
      data: {
        openid: app.globalData.userInfo._openid,
        orderType: 0,
        orderid: '84f7894263724bab009f34a06dc9bf9e'
      }
    })
    return
    const that = this
    wx.showModal({
      title: '是否确认预约场地？',
      content: "订单确认后会优先扣除账户余额。若使用微信支付，请在5分钟内支付完成，否则订单将失效。",
      success (res) {
        if (res.confirm) {
          that.confirmOrder()
          console.log('用户点击确定')
        } else if (res.cancel) {
          console.log('用户点击取消')
        }
      }
    })
    return
    wx.showLoading({
      title: '订单创建中',
    })
    const res = await wx.cloud.callFunction({
      name: 'createCourtOrder',
      data: {
        params: this.data.period
      }
    })
    wx.hideLoading({
      success: (res) => {},
    })
    if (!res.result._id) {
      console.log(res.result.errorMsg)
      wx.showModal({
        title: '提示',
        content: res.result.errorMsg,
        showCancel: false,
        success (res) {
          if (res.confirm) {
            console.log('用户点击确定')
          } else if (res.cancel) {
            console.log('用户点击取消')
          }
        }
      })
      return
    }
    console.log("创建订单成功")
    const newOrder = res.result
    if (this.data.userInfo.cash > newOrder.price) {
      console.log("用户余额充足")
      // 订单创建成功，弹出使用余额支付的确认弹窗
      const confirmRes = await wx.cloud.callFunction({
        name: 'confirmCourtOrder',
        data: {
          params: this.data.period
        }
      })
      return
    }
    // 余额不足，调用微信支付
    console.log("余额不足，调用微信支付")
  },
  /**
   * 生命周期函数--监听页面初次渲染完成
   */
  onReady() {

  },

  /**
   * 生命周期函数--监听页面显示
   */
  onShow() {

  },

  /**
   * 生命周期函数--监听页面隐藏
   */
  onHide() {

  },

  /**
   * 生命周期函数--监听页面卸载
   */
  onUnload() {

  },

  /**
   * 页面相关事件处理函数--监听用户下拉动作
   */
  onPullDownRefresh() {

  },

  /**
   * 页面上拉触底事件的处理函数
   */
  onReachBottom() {

  },

  /**
   * 用户点击右上角分享
   */
  onShareAppMessage() {

  }
})
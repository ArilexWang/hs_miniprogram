// pages/courtOrder/courtOrder.js
var dateFormat = require('dateformat');
const app = getApp()
Page({
  /**
   * 页面的初始数据
   */
  data: {
    period: {},
    options: {}
  },

  /**
   * 生命周期函数--监听页面加载
   */
  async onLoad(options) {
    const eventChannel = this.getOpenerEventChannel()
    const that = this
    eventChannel.on('acceptDataFromOpenerPage', async function (data) {
      const period = data.data
      const userInfo = app.globalData.userInfo
      console.log(userInfo)
      that.setData({
        userInfo: userInfo
      })
      period._openid = userInfo._openid
      const tempSelectedCourts = []
      period.courts.forEach(element => {
        if (element.status === 2) {
          tempSelectedCourts.push(element)
        }
      });
      period.selectedCourts = tempSelectedCourts
      const selectedCourtNames = tempSelectedCourts.map((item) => {
        return item.name
      })
      const selectedCourtsFormat = selectedCourtNames.join(',')
      period.selectedCourtsFormat = selectedCourtsFormat
      period.dateFormat = dateFormat(period.start, 'yyyy-mm-dd')
      const {
        start,
        middle,
        end,
        needReferee,
        firstShoot,
        secondShoot,
        selectedCourts,
        _openid
      } = period
      const params = {
        start,
        middle,
        end,
        needReferee,
        firstShoot,
        secondShoot,
        selectedCourts,
        _openid
      }
      const res = await wx.cloud.callFunction({
        name: 'calculateOrderPrice',
        data: params
      })
      period.price = res.result.price
      period.actualPrice = res.result.price
      that.setData({
        period: period
      })
    })
  },
  async onLoadLogin() {

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
    wx.showLoading({
      title: '订单创建中',
    })
    const {
      start,
      middle,
      end,
      needReferee,
      firstShoot,
      secondShoot,
      selectedCourts,
      _openid,
      price,
      useIntegral
    } = this.data.period
    const params = {
      start,
      middle,
      end,
      needReferee,
      firstShoot,
      secondShoot,
      selectedCourts,
      _openid,
      price,
      useIntegral
    }
    const res = await wx.cloud.callFunction({
      name: 'createCourtOrder',
      data: {
        params: params
      }
    })
    console.log(res)
    if (!res.result._id) { // 订单创建失败
      console.log(res.result.errorMsg)
      wx.hideLoading({
        success: (res) => {},
      })
      wx.showModal({
        title: '提示',
        content: res.result.errorMsg,
        showCancel: false,
        success(res) {
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
    try {
      const newOrder = res.result
      const payByCash = await wx.cloud.callFunction({
        name: 'payByCash',
        data: {
          orderType: 0,
          orderid: newOrder._id,
          openid: app.globalData.userInfo._openid
        }
      })
      console.log(payByCash)
      if (payByCash.result.errorMsg === 'success') {
        wx.hideLoading({
          success: (res) => {},
        })
        // 余额支付成功
        console.log("使用余额支付成功")
        wx.showModal({
          title: '预约成功',
          content: "已自动扣除余额",
          showCancel: false,
          success(res) {
            if (res.confirm) {
              console.log('用户点击确定')
              wx.navigateBack({
                delta: 100,
              })
            }
          }
        })
        return
      }
      wx.hideLoading({
        success: (res) => {},
      })
    } catch (error) {
      console.log("调用余额支付云函数失败")
      wx.hideLoading({
        success: (res) => {},
      })
      wx.showToast({
        title: '预定失败，请联系客服进行预定',
      })
    }
    console.log("余额不足，调用微信支付")
    // 调用微信支付
    wx.showToast({
      title: '余额不足',
      icon: 'error'
    })
  },
  async onConfirmClick() {
    const that = this
    wx.showModal({
      title: '是否确认预约场地？',
      content: "订单确认后会优先扣除账户余额。若使用微信支付，请在5分钟内支付完成，否则订单将失效。",
      success(res) {
        if (res.confirm) {
          console.log('用户点击确定')
          that.confirmOrder()
        } else if (res.cancel) {}
      }
    })
    return
  },
  onCancelClick() {
    wx.navigateBack({
      delta: 1,
    })
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
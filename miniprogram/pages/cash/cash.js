// pages/cash/cash.js
const db = wx.cloud.database()
const app = getApp()
Page({

  /**
   * 页面的初始数据
   */
  data: {
    shouldCost: 0
  },

  /**
   * 生命周期函数--监听页面加载
   */
  async onLoad(options) {
    wx.showLoading({
      title: '加载中',
    })
    const getCash = await db.collection('cash').get()
    console.log(getCash)
    wx.hideLoading({
      success: (res) => {},
    })
    this.setData({
      cash: getCash.data
    })
  },
  onLoadLogin() {
    this.setData({
      userInfo: app.globalData.userInfo,
    })
  },
  checkBoxChanged(e) {
    var useIntegral = false
    var shouldCost = 0
    if (e.detail.value.length > 0) {
      useIntegral = true
      shouldCost = this.data.selectedCash.value - this.data.userInfo.integral / 100 >= 0 ? (this.data.selectedCash.value - this.data.userInfo.integral / 100) : 0
    } else {
      useIntegral = false
    }
    this.setData({
      useIntegral: useIntegral,
      shouldCost: shouldCost.toFixed(2)
    })
  },
  onItemClick(e) {
    if (!app.globalData.userInfo._id) {
      wx.showToast({
        title: '请先登录',
        icon: 'error'
      })
      return
    }
    this.setData({
      selectedCash: this.data.cash[e.currentTarget.id]
    })
    this.setData({
      showDialog: true
    })
  },
  async onConfirm() {
    wx.showLoading({
      title: '订单生成中',
    })
    const newOrder = await db.collection('cash_orders').add({
      data: {
        created: new Date().getTime(),
        name: this.data.selectedCash.name,
        value: this.data.selectedCash.value,
        useIntegral: this.data.useIntegral,
        price: this.data.selectedCash.value,
        extra: this.data.selectedCash.extra,
        status: 0 // 测试直接设置为1
      }
    })
    console.log(newOrder)
    if (!newOrder._id) {
      console.log("生成订单失败")
      wx.hideLoading({
        success: (res) => {},
      })
      return
    }
    wx.hideLoading({
      success: (res) => {},
    })
    await this.payByWechat(newOrder)
  },

  async payByWechat(order) {
    console.log(order)
    wx.showLoading({
      title: '正在唤起微信支付',
    })
    const res = await wx.cloud.callFunction({
      name: 'unifiedOrder',
      data: {
        orderid: order._id,
        orderType: 2,
      }
    })
    console.log(res)
    if (res.result.errMsg !== 'success') {
      wx.hideLoading({
        success: (res) => {},
      })
      wx.showToast({
        title: '支付失败，请联系客服',
      })
      return
    }
    wx.hideLoading({
      success: (res) => {},
    })
    const payment = res.result.res.payment
    wx.requestPayment({
      ...payment,
      success(res) {
        console.log('支付成功', res)
        wx.showModal({
          title: '提示',
          content: '支付成功',
          showCancel: false,
          success(res) {
            if (res.confirm) {
              console.log('用户点击确定')
              wx.redirectTo({
                url: '../main/main',
              })
            } else if (res.cancel) {
              console.log('用户点击取消')
            }
          }
        })
        
      },
      fail(err) {
        console.log('支付失败', err)
      }
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
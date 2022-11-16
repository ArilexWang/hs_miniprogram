// pages/recharge/recharge.js
const db = wx.cloud.database()
const app = getApp()
Page({
  /**
   * 页面的初始数据
   */
  data: {
    showDialog: false
  },

  /**
   * 生命周期函数--监听页面加载
   */
  onLoad(options) {
    wx.showLoading({
      title: '加载中',
    })
    db.collection('recharge').orderBy('price', 'asc').get().then(res => {
      console.log('recharge', res)
      this.setData({
        recharges: res.data
      })
      wx.hideLoading({
        success: (res) => {},
      })
    })
  },
  onLoadLogin() {
    console.log(app.globalData.userInfo)
    this.setData({
      userInfo: app.globalData.userInfo,
    })
  },
  onItemClick(e) {
    if (!app.globalData.userInfo._id) {
      wx.showToast({
        title: '请先登录',
        icon: 'error'
      })
    }
    this.setData({
      selectedRecharge: this.data.recharges[e.currentTarget.id]
    })
    this.setData({
      showDialog: true
    })
  },
  checkBoxChanged(e) {
    console.log(e.detail)
    var useIntegral = false
    if (e.detail.value.length > 0) {
      useIntegral = true
    } else {
      useIntegral = false
    }
    console.log(useIntegral)
    this.setData({
      useIntegral: useIntegral
    })
  },
  async onConfirm() {
    console.log("confirm")
    wx.showLoading({
      title: '订单生成中',
    })
    const newOrder = await db.collection('recharge_orders').add({
      data: {
        created: new Date().getTime(),
        name: this.data.selectedRecharge.name,
        value: this.data.selectedRecharge.value,
        useIntegral: this.data.useIntegral,
        price: this.data.selectedRecharge.price,
        status: 0
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
    const payByCash = await wx.cloud.callFunction({
      name: 'payByCash',
      data: {
        orderType: 1,
        orderid: newOrder._id,
        openid: app.globalData.userInfo._openid
      }
    })
    if (payByCash.result.errorMsg === 'success') { // 余额支付成功
      console.log(payByCash)
      const updateRes = await db.collection('members').where({
        _openid: this.data.userInfo._openid
      }).update({
        data: {
          validTimes: db.command.inc(this.data.selectedRecharge.value)
        }
      })
      console.log(updateRes)
      if (updateRes.stats.updated === 1) {
        wx.hideLoading({
          success: (res) => {},
        })
        wx.showToast({
          title: '购买成功',
        })
      }
    } else {
      // 余额支付失败
      wx.showToast({
        title: '余额不足',
        icon: 'error'
      })
    }
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
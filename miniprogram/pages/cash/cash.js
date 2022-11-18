// pages/cash/cash.js
const db = wx.cloud.database()
const app = getApp()
Page({

  /**
   * 页面的初始数据
   */
  data: {

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
        status: 1 // 测试直接设置为1
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
    const updateRes = await db.collection('members').where({
      _openid: this.data.userInfo._openid
    }).update({
      data: {
        cash: db.command.inc(this.data.selectedCash.value + this.data.selectedCash.extra)
      }
    })
    console.log(updateRes)
    if (updateRes.stats.updated === 1) {
      wx.hideLoading({
        success: (res) => {},
      })
      wx.showToast({
        title: '直接充值成功！',
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
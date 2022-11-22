const app = getApp()
import drawQrcode from 'weapp-qrcode'

// pages/main/main.js
Page({

  /**
   * 页面的初始数据
   */
  data: {
    showDialog: false,
  },

  /**
   * 生命周期函数--监听页面加载
   */
  onLoad(options) {

  },

  onLoadLogin() {
    console.log("首页的onLoadLogin")
    this.setData({
      userInfo: app.globalData.userInfo
    })
  },
  onRechargeClick() {
    wx.navigateTo({
      url: '../recharge/recharge',
    })
  },
  async onCashClick() {
    wx.navigateTo({
      url: '../cash/cash',
    })
  },
  onCourtClick() {
    wx.switchTab({
      url: '../stadium/stadium',
    })
  },
  qrCodeClick() {
    const code = {
      type: 0,
      id: app.globalData.userInfo._id
    }
    drawQrcode({
      width: 230,
      height: 230,
      x: 10,
      y: 10,
      canvasId: 'mainQRCode',
      text: JSON.stringify(code)
    })
    this.setData({
      showQRCode: true
    })
  },
  onHideMask() {
    this.setData({
      showQRCode: false
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
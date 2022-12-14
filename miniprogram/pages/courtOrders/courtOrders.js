// pages/courtOrders/courtOrders.js
const app = getApp()
const db = wx.cloud.database()
var dateFormat = require('dateformat');
import drawQrcode from 'weapp-qrcode'

Page({

  /**
   * 页面的初始数据
   */
  data: {
    activeTab: 0,
  },

  /**
   * 生命周期函数--监听页面加载
   */
  onLoad(options) {

  },

  async onLoadLogin() {
    console.log(app.globalData)
    await this.reloadData()
  },

  async reloadData() {
    const getOrders = await db.collection('court_orders').where({
      _openid: app.globalData.userInfo._openid
    }).get()
    console.log(getOrders)
    const orders = getOrders.data.map((item) => {
      item.dateFormat = dateFormat(item.start, 'yyyy-mm-dd')
      item.hourFormat = dateFormat(item.start, 'HH:MM') + ' - ' + dateFormat(item.end, 'HH:MM')
      item.firstFormat = dateFormat(item.start, 'HH:MM') + ' - ' + dateFormat(item.middle, 'HH:MM')
      item.lastFormat = dateFormat(item.middle, 'HH:MM') + ' - ' + dateFormat(item.end, 'HH:MM')
      return item
    })
    this.handleOrders(orders)
    this.setData({
      courtOrders: this.data.validOrders
    })
  },
  handleOrders(orders) {
    const validOrders = []
    const refundOrders = []
    const invalidOrders = []
    for (let index = 0; index < orders.length; index++) {
      const element = orders[index];
      if (element.status === 2) {
        refundOrders.push(element)
        continue
      }
      if (element.status === 1) {
        const current = new Date().getTime()
        if (current < element.end) {
          validOrders.push(element)
        } else {
          element.status = 3
          invalidOrders.push(element)
        }
      }
    }
    console.log(validOrders, refundOrders, invalidOrders)
    this.setData({
      validOrders: validOrders,
      refundOrders: refundOrders,
      invalidOrders: invalidOrders
    })
  },

  onTabChange(e) {
    this.setData({
      activeTab: e.detail.index
    })
    switch (e.detail.index) {
      case 0:
        this.setData({
          courtOrders: this.data.validOrders,
        })
        break;
      case 1:
        this.setData({
          courtOrders: this.data.refundOrders,
        })
        break;
      case 2:
        this.setData({
          courtOrders: this.data.invalidOrders,
        })
        break;
      default:
        break;
    }
  },

  async onRefundClick(e) {
    const order = this.data.courtOrders[e.currentTarget.id]
    // 1， 判断当前时间是否违规
    const current = new Date().getTime()
    if (order.start - current < 8 * 60 * 60 * 1000) { // 8小时前才能
      wx.showToast({
        title: '距离开场已不足8小时，不能完成退款',
        icon: 'none'
      })
      return
    }
    // 2，调用退款接口
    const that = this
    wx.showModal({
      title: '是否确认退款',
      content: "退款仅退还实际支付的价格，积分无法退回原账户",
      success(res) {
        if (res.confirm) {
          console.log('用户点击确定')
          that.confirmRefund(order)
        } else if (res.cancel) {}
      }
    })
  },
  async confirmRefund(order) {
    wx.showLoading({
      title: '退款中',
    })
    const res = await wx.cloud.callFunction({
      name: 'refundCourtOrder',
      data: {
        orderid: order._id
      }
    })
    console.log(res)
    if (res.result.errorMsg !== 'success') {
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
    wx.hideLoading({
      success: (res) => {},
    })
    wx.showToast({
      title: '退款成功',
    })
    await this.reloadData()
  },

  qrCodeClick(e) {
    console.log(this.data.courtOrders[e.currentTarget.id])
    const order = this.data.courtOrders[e.currentTarget.id]
    const code = "1_" + order._id
    drawQrcode({
      width: 230,
      height: 230,
      x: 10,
      y: 10,
      canvasId: 'courtQRCode',
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
  async onPullDownRefresh() {
    console.log("pulldown")
    await this.reloadData()
    wx.stopPullDownRefresh({
      success: (res) => {},
    })
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
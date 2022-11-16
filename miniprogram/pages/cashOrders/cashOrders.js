
var dateFormat = require('dateformat');
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
  onLoad(options) {
    
  },

  async onLoadLogin() {
    const getOrders = await db.collection('cash_orders').where({
      _openid: app.globalData.userInfo._openid,
    }).orderBy('created', 'acs').get()
    console.log(getOrders)
    const orders = getOrders.data.map((item) => {
      item.format = dateFormat(item.created, 'yyyy-mm-dd HH:MM:ss')
      return item
    })
    this.setData({
      orders: orders,
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
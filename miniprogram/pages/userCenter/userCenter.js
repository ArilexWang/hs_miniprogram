// pages/userCenter/userCenter.js
var log = require('../../utils/log.js')
const app = getApp()
const db = wx.cloud.database()
import {
  LastLoginKey
} from '../../utils/const'
import drawQrcode from 'weapp-qrcode-canvas-2d'

Page({
  /**
   * 页面的初始数据
   */
  data: {
    hasLogin: false,
    showOverlay: false,
    showQRCode: false
  },

  /**
   * 生命周期函数--监听页面加载
   */
  onLoad(options) {

  },
  onLoadLogin() { // 已登录
    console.log('登录页的onLoadLogin', app.globalData.userInfo, app.globalData.userInfo._id.length);
    if (app.globalData.userInfo._id.length <= 0) {
      console.log("未登录")
      this.setData({
        hasLogin: false,
        userInfo: app.globalData.userInfo
      })
      return
    }
    this.setData({
      hasLogin: true,
      userInfo: app.globalData.userInfo
    })
  },
  getPhoneNumber(e) {
    console.log(e)
  },
  getUserProfile() {
    wx.getUserProfile({
      desc: 'desc',
      success: async function (res) {
        if (app.globalData._openid.length <= 0) {
          log.error("getUserProfile 未获取openid")
          return
        }
        const _openid = app.globalData._openid
        const getUser = await db.collection('members').where({
          _openid: _openid
        }).get()
        if (getUser.data.length > 0) {
          console.log("用户已注册")
          const user = getUser.data[0]
          app.globalData.userInfo = user
          wx.setStorageSync(_openid, user)
          wx.setStorageSync(LastLoginKey, new Date())
        } else {
          console.log("用户未注册")
          const newUser = await db.collection('members').add({
            data: {
              created: new Date(),
              nickName: res.userInfo.nickName,
              avatarUrl: res.userInfo.avatarUrl,
              validTimes: 0,
              cash: 0,
              integral: 0
            }
          })
          if (newUser._id.length > 0) {
            // 创建用户成功
            const getUser = await db.collection('members').doc(newUser._id).get()
            if (getUser.data) {
              const user = getUser.data
              wx.setStorageSync(_openid, user)
              wx.setStorageSync(LastLoginKey, new Date())
              log.info("创建用户成功，用户名：" + user.nickName)
              app.globalData.userInfo = user
            }
          }
        }
      }
    })
  },
  qcCodeClick() {
    this.setData({
      showQRCode: true
    })
    const query = wx.createSelectorQuery()
    query.select('#myQRCode')
      .fields({
        node: true,
        size: true
      })
      .exec((res) => {
        var canvas = res[0].node
        // 调用方法drawQrcode生成二维码
        drawQrcode({
          canvas: canvas,
          canvasId: 'myQRCode',
          width: 260,
          height: 260,
          padding: 30,
          background: '#ffffff',
          foreground: '#000000',
          text: '大王顶真帅',
        })

        // 获取临时路径（得到之后，想干嘛就干嘛了）
        // wx.canvasToTempFilePath({
        //     canvasId: 'myQrcode',
        //     canvas: canvas,
        //     x: 0,
        //     y: 0,
        //     width: 260,
        //     height: 260,
        //     destWidth: 260,
        //     destHeight: 260,
        //     success(res) {
        //         console.log('二维码临时路径：', res.tempFilePath)
        //     },
        //     fail(res) {
        //         console.error(res)
        //     }
        // })
      })
  },
  onClickOverlay() {
    this.setData({
      showQRCode: false
    })
  },
  onLogoutClick() {
    console.log("点击logout")
    wx.clearStorageSync()
    app.globalData.userInfo._id = ""
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
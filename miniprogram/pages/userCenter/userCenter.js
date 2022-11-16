// pages/userCenter/userCenter.js
var log = require('../../utils/log.js')
const app = getApp()
const db = wx.cloud.database()
import {
  LastLoginKey
} from '../../utils/const'
import drawQrcode from 'weapp-qrcode'

Page({
  /**
   * 页面的初始数据
   */
  data: {
    hasRegister: false,
    hasLogin: false,
    showOverlay: false,
    showQRCode: false,
    phoneNum: '',
    switchChecked: false,
  },

  /**
   * 生命周期函数--监听页面加载
   */
  onLoad(options) {

  },
  onLoadRegister() {
    console.log("登录页的onLoadRegister")
    this.setData({
      hasRegister: true
    })
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
  async getPhoneNumber(e) {
    if (e.detail.errMsg !== "getPhoneNumber:ok") {
      console.log("授权失败")
      return
    }
    wx.showLoading({
      title: '加载中',
    })
    const res = await wx.cloud.callFunction({
      name: 'getPhoneNum',
      data: {
        phoneData: wx.cloud.CloudID(e.detail.cloudID),
      }
    })
    wx.hideLoading({
      success: () => {},
    })
    console.log(res)
    const phoneNum = res.result.event.phoneData.data.phoneNumber
    if (phoneNum.length === 0) {
      console.log("获取手机号失败")
      return
    }
    console.log(phoneNum)
    this.setData({
      phoneNum: phoneNum
    })
  },
  switchChanged(e) {
    this.setData({
      switchChecked: e.detail.value
    })
  },
  async onLoginClick() {
    if (!this.data.switchChecked) {
      wx.showToast({
        title: '未同意免责说明',
        icon: "error"
      })
      return
    }
    if (app.globalData._openid.length === 0) {
      console.log("登录失败，openid为空")
      return
    }
    const getMember = await db.collection('members').where({
      _openid: app.globalData._openid
    }).get()
    if (getMember.data.length !== 1) {
      console.log("获取用户信息失败")
    }
    const member = getMember.data[0]
    wx.setStorageSync(LastLoginKey, new Date())
    app.globalData.userInfo = member
  },
  async onRegisterClick() {
    if (this.data.phoneNum.length === 0) {
      wx.showToast({
        title: '未获取正确手机号',
        icon: "error"
      })
      return
    }
    if (!this.data.switchChecked) {
      wx.showToast({
        title: '未同意免责说明',
        icon: "error"
      })
      return
    }
    const that = this
    wx.getUserProfile({
      desc: 'desc',
      success: async function (res) {
        const user = res.userInfo
        console.log(res)
        const newMember = {
          created: new Date(),
          phoneNum: that.data.phoneNum,
          nickName: user.nickName,
          avatarUrl: user.avatarUrl,
          cash:0,
          validTimes:0,
          integral: 0,
        }
        console.log(newMember)
        const addMember = await db.collection('members').add({
          data: newMember
        })
        console.log(addMember)
        if (addMember._id.length === 0) {
          wx.showToast({
            title: '注册失败，请联系客服',
            icon: 'error'
          })
          return
        }
        newMember._id = addMember._id
        app.globalData.userInfo = newMember
      },
      fail: function (error) {
        console.log("获取用户信息失败", error)
      },
    })
  },
  async reloadUserInfo() {
    if (!app.globalData.userInfo._id) {
      return
    }
    wx.showLoading({
      title: '更新中',
    })
    const getMember = await db.collection('members').where({
      _openid: app.globalData.userInfo._openid
    }).get()
    const member = getMember.data[0]
    app.globalData.userInfo = member
    this.setData({
      userInfo: member
    })
    wx.hideLoading({
      success: (res) => {},
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
      canvasId: 'myQrcode',
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
  onClickOverlay() {
    this.setData({
      showQRCode: false
    })
  },
  onCourtOrderClick() {
    wx.navigateTo({
      url: '../courtOrders/courtOrders',
    })
  },
  onRechargeOrderClick() {
    wx.navigateTo({
      url: '../rechargeOrders/rechargeOrders'
    })
  },
  onCashOrdersClick() {
    wx.navigateTo({
      url: '../cashOrders/cashOrders'
    })
  },
  onLogoutClick() {
    console.log("点击logout")
    wx.clearStorageSync()
    app.globalData.userInfo = {}
    this.setData({
      hasLogin: false
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
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
  testCloudFunction() {
    const params = {
      "phoneNum": "1",
      "courts": [{
        "_id": 2,
        "name": "A2",
        "price": 260
      }],
      "date": 1668182400000,
      "period": {
        "_id": "c03e44456366556300a2a2b47c25d0c0",
        "courts": [2, 3, 4, 5, 6],
        "day": 6,
        "end": 1668139200000,
        "start": 1668132000000,
        "format": "10:00 - 12:00"
      },
      "price": 260,
      "member": {
        "_id": "649330e263690e68006c528b3f95fa1a",
        "_openid": "ootUG4_x-ypBrAAKbAZiJt8S-aeE",
        "avatarUrl": "https://thirdwx.qlogo.cn/mmopen/vi_32/Q0j4TwGTfTLEjk9w6ibSplRD14OKicC3hOGNJbh6zRWB0qicqf2miclxNh4PgIaNNbZXEhaGpWScIQd65ccnu43Pxw/132",
        "cash": 1000,
        "created": "2022-11-07T13:55:51.867Z",
        "integral": 0,
        "nickName": "Alex王振",
        "phoneNum": "1",
        "validTimes": 0
      },
      "status": 0
    }
    wx.cloud.callFunction({
      name: "confirmCourtOrder",
      data: {
        orderId: '30ed8da3636f4b32007eafd029e3dc92',
        payBy: 0
      },
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
      }
    })
  },
  qcCodeClick() {
    this.setData({
      showQRCode: true
    })
    const query = wx.createSelectorQuery()
    const that = this
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
          width: 300,
          height: 300,
          padding: 30,
          background: '#ffffff',
          foreground: '#000000',
          text: app.globalData.userInfo._id,
        })

        // 获取临时路径（得到之后，想干嘛就干嘛了）
        wx.canvasToTempFilePath({
          canvasId: 'myQRCode',
          canvas: canvas,
          x: 0,
          y: 0,
          width: 300,
          height: 300,
          destWidth: 300,
          destHeight: 300,
          success(res) {
            if (res.tempFilePath.length > 0) {
              that.setData({
                qrCodeImgUrl: res.tempFilePath
              })
            }
          },
          fail(res) {
            console.error(res)
          }
        })
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
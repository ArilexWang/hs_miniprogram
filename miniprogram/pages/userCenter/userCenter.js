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
    // wx.cloud.callFunction({
    //   name: "createCourtOrder",
    //   data: {
    //     params: params
    //   },
    // })

    wx.cloud.callFunction({
      name: "confirmCourtOrder",
      data: {
        orderId: '30ed8da3636f4b32007eafd029e3dc92',
        payBy: 0
      },
    })
  },
  async getUserProfile() {
    // this.testCloudFunction()
    // return
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
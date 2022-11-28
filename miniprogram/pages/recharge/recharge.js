// pages/recharge/recharge.js
const db = wx.cloud.database()
const app = getApp()
Page({
  /**
   * 页面的初始数据
   */
  data: {
    showDialog: false,
    shouldCost: 0,
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
      return
    }
    this.setData({
      selectedRecharge: this.data.recharges[e.currentTarget.id]
    })
    this.setData({
      showDialog: true
    })
  },
  checkBoxChanged(e) {
    var useIntegral = false
    var shouldCost = 0
    if (e.detail.value.length > 0) {
      useIntegral = true
      shouldCost = this.data.selectedRecharge.price - this.data.userInfo.integral / 100 >= 0 ? (this.data.selectedRecharge.price - this.data.userInfo.integral / 100) : 0
    } else {
      useIntegral = false
    }
    console.log(useIntegral)

    this.setData({
      useIntegral: useIntegral,
      shouldCost: shouldCost.toFixed(2)
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
      }
    } else {
      // 余额支付失败, 使用微信支付
      console.log('调用微信支付')
      wx.hideLoading({
        success: (res) => {},
      })
      await this.payByWechat(newOrder)
    }
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
        orderType: 1,
      }
    })
    console.log(res)
    wx.hideLoading({
      success: (res) => {},
    })
    if (res.result.errMsg !== 'success') {
      wx.showToast({
        title: '支付失败，请联系客服',
      })
    }
    
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
            }
          }
        }) 
      },
      fail(err) {
        wx.showToast({
          title: '取消支付',
          icon: 'error'
        })
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
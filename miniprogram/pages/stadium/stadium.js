// pages/stadium/stadium.js
const app = getApp()
const db = wx.cloud.database()
var dateFormat = require('dateformat');

Page({
  /**
   * 页面的初始数据
   */
  data: {
    options: [],
    selectedIndex: 0,
    banners: ['cloud://test-7ggypkpn0dd471ba.7465-test-7ggypkpn0dd471ba-1314769302/banners/WechatIMG254.jpeg','cloud://test-7ggypkpn0dd471ba.7465-test-7ggypkpn0dd471ba-1314769302/banners/WechatIMG253.jpeg', 'cloud://test-7ggypkpn0dd471ba.7465-test-7ggypkpn0dd471ba-1314769302/banners/WechatIMG249.jpeg'],
  },

  /**
   * 生命周期函数--监听页面加载
   */
  async onLoad(options) {
    await this.reloadData()
  },

  async reloadData() {
    const validDays = this.calculateAvaliableDay()
    this.setData({
      options: validDays
    })
    const getShoot = await db.collection('shoot').limit(1).get()
    const shootPrice = getShoot.data[0].price
    this.setData({
      shootPrice: shootPrice
    })
    console.log(getShoot)
    wx.showLoading({
      title: '加载中',
    })
    const getCourts = await db.collection('courts').where({
      _id: db.command.lt(7)
    }).orderBy('_id', 'asc').get()
    this.setData({
      courts: getCourts.data
    })
    const selectedDate = this.data.options[this.data.selectedIndex].date
    const periods = await this.getPeriods(selectedDate)
    console.log('aaaaa', periods)
    wx.hideLoading({
      success: (res) => {},
    })
    this.setData({
      periods: periods
    })
  },

  onLoadLogin(val) {
    console.log("场馆页的onLoadLogin", app.globalData)
  },

  //计算可选日期
  calculateAvaliableDay() {
    const options = []
    for (var i = 0; i < 7; i++) {
      var temp = new Date()
      temp.setDate(temp.getDate() + i);
      const formatStr = dateFormat(temp, "yyyy-mm-dd") + '    星期' + '日一二三四五六'.charAt(temp.getDay());
      options.push({
        text: formatStr,
        value: i,
        date: temp
      })
    }
    return options
  },

  async onDayItemClick(e) {
    this.setData({
      selectedIndex: e.detail
    })
    wx.showLoading({
      title: '加载中',
    })
    const selectedDate = this.data.options[e.detail].date
    const periods = await this.getPeriods(selectedDate)
    this.setData({
      periods: periods
    })
    wx.hideLoading({
      success: (res) => {},
    })
  },

  async getPeriods(date) {
    // 1, 获取当天所有时间段
    const getPeriod = await db.collection('periods').where({
      day: date.getDay()
    }).get()
    const periods = []
    for (let index = 0; index < getPeriod.data.length; index++) {
      const element = getPeriod.data[index];
      const res = await wx.cloud.callFunction({
        name: "generateCurrentPeriod",
        data: {
          period: element,
          date: date.getTime()
        },
      })
      const period = res.result
      period.format = dateFormat(period.start, 'yyyy-mm-dd HH:MM') + ' - ' + dateFormat(period.end, 'HH:MM')
      period.hourFormat = dateFormat(period.start, 'HH:MM') + ' - ' + dateFormat(period.end, 'HH:MM')
      period.firstFormat = dateFormat(period.start, 'HH:MM') + '-' + dateFormat(period.middle, 'HH:MM')
      period.lastFormat = dateFormat(period.middle, 'HH:MM') + '-' + dateFormat(period.end, 'HH:MM')
      periods.push(period)
    }
    return periods
  },

  async onSelectedClicked(e) {
    if (app.globalData.userInfo._id.length === 0) {
      console.log("未登录")
      wx.showToast({
        title: '请先登录',
        icon: 'error'
      })
      return
    }
    const period = this.data.periods[e.currentTarget.id]
    console.log('bbbbbb', period)
    if (period.avaliable !== 1) {
      wx.showToast({
        title: '不可预订',
        icon:'error'
      })
      return
    }
    period.courts = period.courts.map((item) => {
      item.imageUrl = '../../src/' + item.name + '-' + item.status + '.jpg'
      return item
    })
    this.setData({
      selectedPeriod: period
    })
  },
  checkBoxChanged(e) {
    const values = e.detail.value
    const period = this.data.selectedPeriod
    period.needReferee = values.includes("0")
    period.firstShoot = values.includes("1")
    period.secondShoot = values.includes("2")
    this.setData({
      selectedPeriod: period
    })
  },
  onCourtClick(e) {
    const court = this.data.selectedPeriod.courts[e.currentTarget.id]
    switch (court.status) {
      case 0:
        wx.showToast({
          title: '该场地不可预定',
          icon: 'none'
        })
        break;
      case 1:
        court.status = 2
        court.imageUrl = '../../src/' + court.name + '-' + '2.jpg'
        this.setData({
          selectedPeriod: this.data.selectedPeriod
        })
        break;
      case 2:
        court.status = 1
        court.imageUrl = '../../src/' + court.name + '-' + '1.jpg'
        this.setData({
          selectedPeriod: this.data.selectedPeriod
        })
      default:
        break;
    }
  },
  onCancelClick() {
    console.log('onCancelClick')
    this.setData({
      selectedPeriod: null
    })
  },
  onConfirmClick() {
    console.log(this.data.selectedPeriod)
    const period = this.data.selectedPeriod
    var selected = false
    period.courts.forEach(element => {
      if(element.status === 2) {
        selected = true
      }
    });
    if (!selected) {
      wx.showToast({
        title: '未选择场地',
        icon: 'error',
      })
      return
    }
    if (period.firstShoot || period.secondShoot) {
      var validCourts = false
      period.courts.forEach(court => {
        if (court.status === 2 && (court._id === 1 || court._id === 2)) {
          validCourts = true
        }
      });
      var validDate = true
      const start = new Date(period.start)
      if (start.getDay() === 0 || start.getDay() === 6) { // 周末
        const startHour = start.getHours()
        if (startHour < 18) {
          validDate = false
        }
      }
      if (!validCourts || !validDate) {
        wx.showToast({
          title: '投篮机不可用',
          icon: "error"
        })
        return
      }
    }
    wx.navigateTo({
      url: '../courtOrder/courtOrder',
      success: function(res) {
        // 通过 eventChannel 向被打开页面传送数据
        res.eventChannel.emit('acceptDataFromOpenerPage', { data: period })
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
  async onShow() {
    console.log("onShow")
    this.setData({
      selectedPeriod: null,
    })
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
    this.setData({
      selectedPeriod: null
    })
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
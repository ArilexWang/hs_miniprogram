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
    selectedIndex: 6,
    banners: ['https://huiwan-1304067511.cos.ap-guangzhou.myqcloud.com/IMG_0437.JPG ', '	https://huiwan-1304067511.cos.ap-guangzhou.myqcloud.com/IMG_0436.JPG'],
  },

  /**
   * 生命周期函数--监听页面加载
   */
  async onLoad(options) {
    console.log(this.calculateAvaliableDay())
    const validDays = this.calculateAvaliableDay()
    this.setData({
      options: validDays
    })
    const getCourts = await db.collection('courts').where({
      _id: db.command.lt(7)
    }).orderBy('_id', 'asc').get()
    this.setData({
      courts: getCourts.data
    })
    const selectedDate = this.data.options[this.data.selectedIndex].date
    const periods = await this.getPeriods(selectedDate)
    this.setData({
      periods: periods
    })
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
    const selectedDate = this.data.options[e.detail].date
    const periods = await this.getPeriods(selectedDate)
    this.setData({
      periods: periods
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
      period.format = dateFormat(period.start, 'yyyy-mm-dd hh:MM') + ' - ' + dateFormat(period.end, 'hh:MM')
      period.hourFormat = dateFormat(period.start, 'hh:MM') + ' - ' + dateFormat(period.end, 'hh:MM')
      period.firstFormat = dateFormat(period.start, 'hh:MM') + '-' + dateFormat(period.middle, 'hh:MM')
      period.lastFormat = dateFormat(period.middle, 'hh:MM') + '-' + dateFormat(period.end, 'hh:MM')
      periods.push(period)
    }
    return periods
  },

  async onSelectedClicked(e) {
    const period = this.data.periods[e.currentTarget.id]
    period.courts = period.courts.map((item) => {
      item.imageUrl = '../../src/' + item.name + '-' + item.status + '.jpg'
      return item
    })
    console.log(period)
    this.setData({
      selectedPeriod: period
    })
  },
  checkBoxChanged(e) {
    console.log(e)
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
    this.setData({
      selectedPeriod: null
    })
  },
  onConfirmClick() {
    console.log(this.data.selectedPeriod)
    const period = this.data.selectedPeriod
    if (period.firstShoot || period.secondShoot) {
      var valid = false
      period.courts.forEach(element => {
        if (element.status === 2 && (element._id === 1 || element._id === 2)) {
          valid = true
        }
      });
      if (!valid) {
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
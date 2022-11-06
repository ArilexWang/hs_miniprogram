// app.js
import CustomHook from 'spa-custom-hooks';
let globalData = {
  // 是否已拿到token
  token: '',
  // 用户信息
  userInfo: {
    userId: '',
    head: '',
    userType: 0,
  },
  env:'test-7ggypkpn0dd471ba'
}
CustomHook.install({
  'Login': {
    name: 'Login',
    watchKey: 'token',
    onUpdate(val) {
      //有token则触发此钩子
      return !!val;
    }
  },
  'User': {
    name: 'User',
    watchKey: 'userInfo.userId',
    onUpdate(val) {
      //获取到userinfo里的userId则触发此钩子
      return !!val;
    }
  },
}, globalData || 'globalData')

App({
  globalData,
  onLaunch: function () {
    if (!wx.cloud) {
      console.error('请使用 2.2.3 或以上的基础库以使用云能力');
    } else {
      wx.cloud.init({
        env: 'test-7ggypkpn0dd471ba',
        traceUser: true,
      });
    }
    wx.cloud.callFunction({
      name: 'quickstartFunctions',
      config: {
        env: this.globalData.env
      },
      data: {
        type: 'getOpenId'
      }
    }).then((resp) => {
      console.log(resp.result)
      const openid = resp.result.openid
      const userInfo = wx.getStorageSync(openid)
      if(userInfo) {
        console.log("有用户信息缓存",userInfo)
      } else {
        console.log("无用户信息缓存缓存")
      }
      wx.hideLoading();
    }).catch((e) => {
      this.setData({
        showUploadTip: true
      });
      wx.hideLoading();
    });
  }
});
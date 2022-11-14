// app.js
import CustomHook from 'spa-custom-hooks';
import {
  LastLoginKey
} from './utils/const'

let globalData = {
  // 是否已拿到token
  _openid: '',
  // 用户信息
  userInfo: {
    _id: '',
    _openid: '',
    nickName: '',
    avatarUrl: '',
  },
  hasRegister: false,
  env: 'test-7ggypkpn0dd471ba'
}
CustomHook.install({
  'GetOpenid': {
    name: 'GetOpenid',
    watchKey: '_openid',
    onUpdate(val) {
      //有token则触发此钩子
      return !!val;
    }
  },
  'Login': {
    name: 'Login',
    watchKey: 'userInfo',
    onUpdate(val) {
      //获取到userinfo里的_id则触发此钩子
      return !!val._id;
    }
  },
  'Register': {
    name: 'Register',
    watchKey: 'hasRegister',
    onUpdate(val) {
      //获取到userinfo里的_id则触发此钩子
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
    const db = wx.cloud.database()
    wx.cloud.callFunction({
      name: 'quickstartFunctions',
      config: {
        env: this.globalData.env
      },
      data: {
        type: 'getOpenId'
      }
    }).then(async (resp) => {
      const _openid = resp.result.openid
      this.globalData._openid = _openid
      const getUser = await db.collection('members').where({
        _openid: _openid
      }).get()
      if (getUser.data.length === 0) {
        // 用户不存在
        return
      }
      console.log('用户已注册', getUser)
      this.globalData.hasRegister = true

      const lastLogin = wx.getStorageSync(LastLoginKey)
      if (!lastLogin) {
        console.log("上次登录未保存时间")
        return
      }
      const current = new Date()
      // 一个月 2592000000 ms
      if (current.getTime() - lastLogin.getTime() > 2592000000) {
        console.log("距离上次登录已经超过一个月")
        return
      }
      wx.setStorageSync(LastLoginKey, current)
      this.globalData.userInfo = getUser.data[0]
    }).catch((e) => {
      console.log(e)
    });
  }
});
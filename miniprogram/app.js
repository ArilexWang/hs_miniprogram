// app.js
import CustomHook from 'spa-custom-hooks';
import { LastLoginKey } from './utils/const'

let globalData = {
  // 是否已拿到token
  _openid: '',
  // 用户信息
  userInfo: {
    _id:'',
    _openid: '',
    nickName: '',
    avatarUrl: '',
  },
  env:'test-7ggypkpn0dd471ba'
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
      const userInfo = wx.getStorageSync(_openid)
      this.globalData._openid = _openid
      if(userInfo) {
        const lastLogin = wx.getStorageSync(LastLoginKey)
        if (!lastLogin) {
          console.log("上次登录未保存时间")
          return
        }
        const current = new Date()
        // 一个月 2592000000 ms
        if(current.getTime() - lastLogin.getTime() > 2592000000) {
          console.log("距离上次登录已经超过一个月")
          return
        }
        const getUser = await db.collection('members').where({
          _openid: _openid
        }).get()
        if(getUser.data.length > 0) {  // 用户确认存在
          const user = getUser.data[0]
          console.log(user)
          this.globalData.userInfo = userInfo
        }
      } else {
        console.log("无用户信息缓存缓存")
      }
    }).catch((e) => {
      console.log(e)
    });
  }
});
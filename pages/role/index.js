const ICONS = require('../../utils/icons.js');
const app = getApp();

Page({
  data: {
    icons: ICONS,
    session: null,
    roles: [
      {
        key: 'customer',
        n: '客户',
        en: 'CUSTOMER',
        d: '查看本人货物运输状态',
        tip: '账号密码任意输入即注册登录',
        icon: ICONS.box[1],
        glow: 'glow-g'
      },
      {
        key: 'staff',
        n: '员工',
        en: 'STAFF',
        d: '调度客户货物 · 管理运输资源',
        tip: '调度账号 yuanshen / 5408',
        icon: ICONS.user[1],
        glow: 'glow-b'
      }
    ]
  },

  onShow() {
    this.setData({ session: app.getSession() });
  },

  goAuth(e) {
    wx.navigateTo({ url: '/pages/auth/index?role=' + e.currentTarget.dataset.role });
  },

  goWorkbench() {
    const s = this.data.session;
    if (!s) return;
    wx.navigateTo({
      url: s.role === 'staff' ? '/pages/staff/index' : '/pages/client/index'
    });
  },

  logout() {
    app.clearSession();
    this.setData({ session: null });
    wx.showToast({ title: '已退出登录', icon: 'none' });
  },

  goHome() {
    wx.reLaunch({ url: '/pages/index/index' });
  }
});

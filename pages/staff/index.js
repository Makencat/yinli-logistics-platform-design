const ICONS = require('../../utils/icons.js');
const app = getApp();

Page({
  data: {
    icons: ICONS,
    iconUser: ICONS.user[1],
    iconNotice: ICONS.message[1],
    session: null,
    clients: [],
    totalActive: 0,
    totalDelivered: 0
  },

  onShow() {
    this.refresh();
  },

  refresh() {
    const session = app.getSession();
    if (!session || session.role !== 'staff') {
      wx.redirectTo({ url: '/pages/role/index' });
      return;
    }
    const clients = app.clientOverview();
    this.setData({
      session,
      clients,
      totalActive: clients.reduce((a, c) => a + c.active, 0),
      totalDelivered: clients.reduce((a, c) => a + c.delivered, 0)
    });
  },

  goDetail(e) {
    wx.navigateTo({ url: '/pages/staff/detail?id=' + e.currentTarget.dataset.id });
  },

  notifyAll() {
    const n = app.notifyAllClients();
    wx.showToast({ title: '已通知 ' + n + ' 位客户', icon: 'success' });
    this.refresh();
  },

  logout() {
    app.clearSession();
    wx.reLaunch({ url: '/pages/index/index' });
  }
});

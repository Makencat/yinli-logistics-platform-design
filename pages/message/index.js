const ICONS = require('../../utils/icons.js');
const app = getApp();

Page({
  data: {
    icons: ICONS,
    list: [],
    role: '',
    typeText: { dock: '月台', reserve: '预约', notice: '调度推送', demand: '需求' }
  },

  onShow() {
    this.load();
  },

  load() {
    const session = app.getSession();
    const role = session ? session.role : '';
    let list = [];
    if (role === 'customer' && session.clientId) {
      list = app.clientMessages(session.clientId).slice();
      this.setData({ list, role });
      app.readClientMessages(session.clientId);
    } else {
      list = app.getStore().messages.slice().reverse();
      this.setData({ list, role });
      app.markAllRead();
    }
  },

  readAll() {
    const session = app.getSession();
    if (session && session.role === 'customer' && session.clientId) {
      app.readClientMessages(session.clientId);
    } else {
      app.markAllRead();
    }
    wx.showToast({ title: '已全部标记为已读', icon: 'none' });
    this.load();
  },

  resetData() {
    wx.showModal({
      title: '重置演示数据',
      content: '将清空所有操作记录，恢复初始协同演示数据。该操作不可恢复，确认继续？',
      confirmColor: '#f87171',
      success: (res) => {
        if (!res.confirm) return;
        app.reset();
        wx.showToast({ title: '已重置为初始演示状态', icon: 'none' });
        this.load();
      }
    });
  }
});

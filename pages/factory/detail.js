const ICONS = require('../../utils/icons.js');
const app = getApp();
const SM = app.globalData.statusMap.reserve;

Page({
  data: {
    icons: ICONS,
    demand: null,
    reserve: null
  },

  onLoad(options) {
    this.demandId = options.id;
  },

  onShow() {
    const store = app.getStore();
    const d = store.demands.find((x) => x.id === this.demandId);
    if (!d) {
      wx.showToast({ title: '需求单不存在', icon: 'none' });
      setTimeout(() => wx.navigateBack(), 600);
      return;
    }
    const sm = app.globalData.statusMap.demand;
    const demand = {
      ...d,
      statusText: sm[d.status] ? sm[d.status].text : d.status,
      color: sm[d.status] ? sm[d.status].color : '#8fa3c0'
    };
    const r = store.reservations.find((x) => !x._empty && x.demandId === d.id);
    let reserve = null;
    if (r) {
      reserve = {
        ...r,
        statusText: SM[r.status] ? SM[r.status].text : r.status,
        color: SM[r.status] ? SM[r.status].color : '#8fa3c0'
      };
    }
    this.setData({ demand, reserve });
  },

  goReserve() {
    if (this.data.reserve) {
      wx.navigateTo({ url: '/pages/logistics/detail?id=' + this.data.reserve.id });
    }
  },

  withdraw() {
    wx.showModal({
      title: '撤回需求单',
      content: '该需求单尚未被物流方承接，确认撤回并移除吗？',
      confirmColor: '#f87171',
      success: (res) => {
        if (!res.confirm) return;
        const store = app.getStore();
        store.demands = store.demands.filter((x) => x.id !== this.demandId);
        app.save();
        wx.showToast({ title: '已撤回', icon: 'none' });
        setTimeout(() => wx.navigateBack(), 500);
      }
    });
  }
});

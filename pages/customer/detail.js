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
      wx.showToast({ title: '需求不存在', icon: 'none' });
      setTimeout(() => wx.navigateBack(), 600);
      return;
    }
    const r = store.reservations.find((x) => !x._empty && x.demandId === d.id);
    const reserve = r
      ? { ...r, statusText: SM[r.status].text, color: SM[r.status].color }
      : null;
    this.setData({
      demand: { ...d, qtyText: d.qty + (d.unit || '') },
      reserve
    });
  }
});

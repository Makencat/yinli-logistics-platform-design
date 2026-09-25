const ICONS = require('../../utils/icons.js');
const app = getApp();
const SM = app.globalData.statusMap.reserve;

Page({
  data: {
    icons: ICONS,
    head: [
      { k: '进行中', v: 0, color: 'c-cyan' },
      { k: '已完成', v: 0, color: 'c-green' }
    ],
    shown: []
  },

  onShow() {
    this.refresh();
  },

  refresh() {
    const store = app.getStore();
    // 客户只能看到已生成预约的批次
    const items = store.demands
      .filter((d) => d.status !== 'pending')
      .map((d) => {
        const r = store.reservations.find((x) => !x._empty && x.demandId === d.id);
        return {
          ...d,
          qtyText: d.qty + (d.unit || ''),
          reserve: r ? { ...r, statusText: SM[r.status].text, color: SM[r.status].color } : null,
          progress: r ? SM[r.status].progress : 0
        };
      })
      .reverse();
    this.setData({
      head: [
        { k: '进行中', v: items.filter((x) => x.reserve && x.reserve.status !== 'done').length, color: 'c-cyan' },
        { k: '已完成', v: items.filter((x) => x.reserve && x.reserve.status === 'done').length, color: 'c-green' }
      ],
      shown: items
    });
  },

  goDetail(e) {
    wx.navigateTo({ url: '/pages/customer/detail?id=' + e.currentTarget.dataset.id });
  }
});

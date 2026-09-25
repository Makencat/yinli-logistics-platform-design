const ICONS = require('../../utils/icons.js');
const app = getApp();
const SM = app.globalData.statusMap.demand;

Page({
  data: {
    icons: ICONS,
    tabs: [
      { k: 'all', t: '全部' },
      { k: 'pending', t: '待预约' },
      { k: 'reserved', t: '已预约' },
      { k: 'done', t: '已提货' }
    ],
    activeTab: 'all',
    head: [
      { k: '总数', v: 0, color: 'c-blue' },
      { k: '待预约', v: 0, color: 'c-warn' },
      { k: '已预约', v: 0, color: 'c-cyan' },
      { k: '已提货', v: 0, color: 'c-green' }
    ],
    list: [],
    transporters: []
  },

  onShow() {
    this.refresh();
  },

  refresh() {
    const store = app.getStore();
    const list = store.demands.map((d) => ({
      ...d,
      statusText: SM[d.status] ? SM[d.status].text : d.status,
      statusColor: SM[d.status] ? SM[d.status].color : '#8fa3c0',
      qtyText: d.qty + (d.unit || '')
    }));
    const head = [
      { k: '总数', v: list.length, color: 'c-blue' },
      { k: '待预约', v: list.filter((d) => d.status === 'pending').length, color: 'c-warn' },
      { k: '已预约', v: list.filter((d) => d.status === 'reserved').length, color: 'c-cyan' },
      { k: '已提货', v: list.filter((d) => d.status === 'done').length, color: 'c-green' }
    ];
    this.setData({ head, list, transporters: store.transporters || [] });
    this.applyTab();
  },

  onTapTab(e) {
    this.setData({ activeTab: e.currentTarget.dataset.k });
    this.applyTab();
  },

  applyTab() {
    const { list, activeTab } = this.data;
    let shown = list;
    if (activeTab !== 'all') shown = list.filter((d) => d.status === activeTab);
    this.setData({ shown });
  },

  goCreate() {
    wx.navigateTo({ url: '/pages/factory/create' });
  },

  goDetail(e) {
    wx.navigateTo({ url: '/pages/factory/detail?id=' + e.currentTarget.dataset.id });
  }
});

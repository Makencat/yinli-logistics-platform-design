const ICONS = require('../../utils/icons.js');
const app = getApp();
const SM = app.globalData.statusMap.reserve;

Page({
  data: {
    icons: ICONS,
    tabs: [
      { k: 'open', t: '可承接' },
      { k: 'transit', t: '在途/待提' },
      { k: 'done', t: '已完成' }
    ],
    activeTab: 'open',
    head: [
      { k: '可承接', v: 0, color: 'c-warn' },
      { k: '在途', v: 0, color: 'c-cyan' },
      { k: '已完成', v: 0, color: 'c-green' }
    ],
    openList: [],
    shown: []
  },

  onShow() {
    this.refresh();
  },

  refresh() {
    const store = app.getStore();
    const reserves = store.reservations.filter((r) => !r._empty);
    const open = store.demands.filter((d) => d.status === 'pending');
    const transit = reserves.filter((r) => r.status !== 'done');
    const done = reserves.filter((r) => r.status === 'done');

    const openList = open.map((d) => ({
      ...d,
      demandId: d.id,
      qtyText: d.qty + (d.unit || ''),
      eta: d.window
    }));

    const transitList = transit.map((r) => this.decorate(r));
    const doneList = done.map((r) => this.decorate(r));

    const head = [
      { k: '可承接', v: openList.length, color: 'c-warn' },
      { k: '在途', v: transitList.length, color: 'c-cyan' },
      { k: '已完成', v: doneList.length, color: 'c-green' }
    ];
    this.setData({
      head,
      openList,
      transitList,
      doneList,
      openCount: openList.length,
      transitCount: transitList.length,
      doneCount: doneList.length
    });
    this.applyTab();
  },

  decorate(r) {
    const store = app.getStore();
    const d = store.demands.find((x) => x.id === r.demandId) || {};
    return {
      ...r,
      ...d,
      qtyText: (r.qty || d.qty || '') + (d.unit || ''),
      statusText: SM[r.status] ? SM[r.status].text : r.status,
      color: SM[r.status] ? SM[r.status].color : '#8fa3c0'
    };
  },

  onTapTab(e) {
    this.setData({ activeTab: e.currentTarget.dataset.k });
    this.applyTab();
  },

  applyTab() {
    const { activeTab, openList, transitList, doneList } = this.data;
    let shown = [];
    if (activeTab === 'open') shown = openList;
    else if (activeTab === 'transit') shown = transitList;
    else shown = doneList;
    this.setData({ shown });
  },

  goVehicles() {
    wx.navigateTo({ url: '/pages/logistics/vehicles' });
  },

  takeOrder(e) {
    // 承接：进入预约创建页
    wx.navigateTo({ url: '/pages/logistics/detail?demandId=' + e.currentTarget.dataset.demand });
  },

  goDetail(e) {
    wx.navigateTo({ url: '/pages/logistics/detail?id=' + e.currentTarget.dataset.id });
  }
});

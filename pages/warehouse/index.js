const ICONS = require('../../utils/icons.js');
const app = getApp();
const SM = app.globalData.statusMap.reserve;

Page({
  data: {
    icons: ICONS,
    head: [
      { k: '待审核', v: 0, color: 'c-warn' },
      { k: '备货中', v: 0, color: 'c-purple' },
      { k: '占用月台', v: 0, color: 'c-blue' },
      { k: '已完成', v: 0, color: 'c-green' }
    ],
    pendingList: [],
    dockList: [],
    timeline: []
  },

  onShow() {
    this.refresh();
  },

  refresh() {
    const store = app.getStore();
    const reserves = store.reservations.filter((r) => !r._empty);

    const pendingList = reserves
      .filter((r) => r.status === 'pending')
      .map((r) => this.decorate(r));

    // 月台占用情况
    const active = reserves.filter((r) => ['approved', 'loading', 'ready'].includes(r.status));
    const dockList = store.dockList.map((dock) => {
      const occ = active.find((r) => r.dock === dock);
      return {
        dock,
        used: !!occ,
        busy: occ ? SM[occ.status].text : '',
        color: occ ? SM[occ.status].color : '#5c6e8c',
        rid: occ ? occ.id : ''
      };
    });

    // 今日车辆时间轴
    const sorted = reserves
      .filter((r) => r.status !== 'done' && r.eta)
      .sort((a, b) => a.eta.localeCompare(b.eta));
    const timeline = sorted.map((r) => {
      const d = store.demands.find((x) => x.id === r.demandId) || {};
      return {
        ...r,
        product: d.product || '-',
        qtyText: (r.qty || '') + (d.unit || ''),
        color: SM[r.status].color,
        statusText: SM[r.status].text
      };
    });

    const head = [
      { k: '待审核', v: pendingList.length, color: 'c-warn' },
      { k: '备货中', v: reserves.filter((r) => r.status === 'loading' || r.status === 'ready').length, color: 'c-purple' },
      { k: '占用月台', v: dockList.filter((d) => d.used).length, color: 'c-blue' },
      { k: '已完成', v: reserves.filter((r) => r.status === 'done').length, color: 'c-green' }
    ];
    this.setData({ pendingList, dockList, timeline, head, scan: true });
  },

  decorate(r) {
    const store = app.getStore();
    const d = store.demands.find((x) => x.id === r.demandId) || {};
    return {
      ...r,
      product: d.product || '-',
      qtyText: (r.qty || d.qty || '') + (d.unit || ''),
      statusText: SM[r.status] ? SM[r.status].text : r.status,
      color: SM[r.status] ? SM[r.status].color : '#8fa3c0'
    };
  },

  goDetail(e) {
    wx.navigateTo({ url: '/pages/warehouse/detail?id=' + e.currentTarget.dataset.id });
  }
});

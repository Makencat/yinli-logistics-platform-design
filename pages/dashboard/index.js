const ICONS = require('../../utils/icons.js');
const app = getApp();
const SM = app.globalData.statusMap.reserve;

Page({
  data: {
    icons: ICONS,
    kpi: [],
    demandStats: [],
    reserveStats: [],
    timeline: [],
    dateText: '',
    roles: [
      { n: '生产厂家', d: '下发货源需求', url: '/pages/factory/index', icon: 'flag', glow: 'glow-b' },
      { n: '物流运输', d: '承接预约到厂', url: '/pages/logistics/index', icon: 'truck', glow: 'glow-c' },
      { n: '仓库管理', d: '审核派台备货', url: '/pages/warehouse/index', icon: 'dock', glow: 'glow-p' },
      { n: '客户门户', d: '提货进度跟踪', url: '/pages/customer/index', icon: 'box', glow: 'glow-g' }
    ]
  },

  onShow() {
    const store = app.getStore();
    const demands = store.demands;
    const reserves = store.reservations.filter((r) => !r._empty);

    const byDemand = {};
    demands.forEach((d) => {
      byDemand[d.status] = (byDemand[d.status] || 0) + 1;
    });
    const D = app.globalData.statusMap.demand;
    const demandStats = ['pending', 'reserved', 'done'].map((k) => ({
      k: D[k] ? D[k].text : k,
      v: byDemand[k] || 0,
      color: D[k] ? D[k].color : '#8fa3c0'
    }));

    const byReserve = {};
    reserves.forEach((r) => {
      byReserve[r.status] = (byReserve[r.status] || 0) + 1;
    });
    const reserveStats = ['pending', 'approved', 'loading', 'ready', 'done'].map((k) => ({
      k: SM[k].text,
      v: byReserve[k] || 0,
      color: SM[k].color
    }));

    const kpi = [
      { k: '货源需求', v: demands.length, icon: ICONS.flag[1], color: 'c-warn' },
      { k: '提货预约', v: reserves.length, icon: ICONS.bill[1], color: 'c-cyan' },
      { k: '在册运力', v: (store.vehicles || []).length, icon: ICONS.truck[1], color: 'c-blue' },
      { k: '完成闭环', v: reserves.filter((r) => r.status === 'done').length, icon: ICONS.check[1], color: 'c-green' }
    ];

    const max = Math.max(...reserveStats.map((s) => s.v), 1);
    const reserveStats2 = reserveStats.map((s) => ({
      ...s,
      pct: Math.round((s.v / max) * 100)
    }));

    const timeline = reserves
      .filter((r) => r.status !== 'done' && r.eta)
      .sort((a, b) => a.eta.localeCompare(b.eta))
      .slice(0, 5)
      .map((r) => {
        const d = store.demands.find((x) => x.id === r.demandId) || {};
        return {
          ...r,
          product: d.product || '-',
          qtyText: (r.qty || '') + (d.unit || ''),
          color: SM[r.status].color,
          statusText: SM[r.status].text
        };
      });

    const now = new Date();
    const pad = (n) => (n < 10 ? '0' + n : '' + n);
    const dateText = `${now.getFullYear()}-${pad(now.getMonth() + 1)}-${pad(now.getDate())}`;

    const roles = this.data.roles.map((r) => ({ ...r, icon: ICONS[r.icon][1] }));

    this.setData({ kpi, demandStats, reserveStats: reserveStats2, timeline, dateText, roles });
  },

  goRole(e) {
    wx.navigateTo({ url: e.currentTarget.dataset.url });
  }
});

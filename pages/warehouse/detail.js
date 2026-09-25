const ICONS = require('../../utils/icons.js');
const app = getApp();
const SM = app.globalData.statusMap.reserve;

Page({
  data: {
    icons: ICONS,
    reserve: null,
    demand: null,
    dockList: [],
    dockIdx: 0,
    canApprove: false,
    canStart: false,
    canFinish: false,
    canDone: false
  },

  onLoad(options) {
    this.resId = options.id;
  },

  onShow() {
    this.refresh();
  },

  refresh() {
    const store = app.getStore();
    const r = store.reservations.find((x) => !x._empty && x.id === this.resId);
    if (!r) {
      wx.showToast({ title: '预约不存在', icon: 'none' });
      setTimeout(() => wx.navigateBack(), 600);
      return;
    }
    const d = store.demands.find((x) => x.id === r.demandId) || {};
    const reserve = {
      ...r,
      statusText: SM[r.status].text,
      color: SM[r.status].color
    };
    const demand = d.id ? { ...d, qtyText: d.qty + (d.unit || '') } : null;
    const dockIdx = r.dock ? store.dockList.indexOf(r.dock) : 0;
    this.setData({
      reserve,
      demand,
      dockList: store.dockList,
      dockIdx: dockIdx < 0 ? 0 : dockIdx,
      canApprove: r.status === 'pending',
      canStart: r.status === 'approved',
      canFinish: r.status === 'loading',
      canDone: r.status === 'ready'
    });
  },

  onDock(e) {
    this.setData({ dockIdx: Number(e.detail.value) });
  },

  pushTrack(r, text) {
    r.track.push({ time: app.globalData.now(), text });
  },

  approve() {
    const store = app.getStore();
    const r = store.reservations.find((x) => x.id === this.resId);
    const dock = store.dockList[this.data.dockIdx];
    if (r) {
      r.status = 'approved';
      r.dock = dock;
      this.pushTrack(r, `仓库审核通过，分配 ${dock}`);
      app.save();
      app.pushMessage('dock', '审核通过 · 月台已派', `${r.id} 已分配 ${dock}`);
      wx.showToast({ title: '已审核，月台分配完成', icon: 'success' });
    }
    this.refresh();
  },

  startLoading() {
    const store = app.getStore();
    const r = store.reservations.find((x) => x.id === this.resId);
    if (r) {
      r.status = 'loading';
      this.pushTrack(r, '开始备货');
      app.save();
      app.pushMessage('notice', '开始备货', `${r.id} 备货作业进行中`);
      wx.showToast({ title: '备货中', icon: 'none' });
    }
    this.refresh();
  },

  finishLoading() {
    const store = app.getStore();
    const r = store.reservations.find((x) => x.id === this.resId);
    if (r) {
      r.status = 'ready';
      this.pushTrack(r, '备货完成，等待车辆到厂');
      app.save();
      app.pushMessage('notice', '备货完成', `${r.id} 已备好，等待车辆到厂装货`);
      wx.showToast({ title: '备货完成', icon: 'success' });
    }
    this.refresh();
  },

  confirmDone() {
    wx.showModal({
      title: '确认提货离场',
      content: '车辆已完成装货并离场，确认闭环该运单？',
      confirmColor: '#34d399',
      success: (res) => {
        if (!res.confirm) return;
        const store = app.getStore();
        const r = store.reservations.find((x) => x.id === this.resId);
        if (r) {
          r.status = 'done';
          this.pushTrack(r, '装货完成，提货离场');
          const d = store.demands.find((x) => x.id === r.demandId);
          if (d) d.status = 'done';
          app.save();
          app.pushMessage('notice', '运单闭环', `${r.id} 提货离场，流程完成`);
          wx.showToast({ title: '已确认离场', icon: 'success' });
        }
        this.refresh();
      }
    });
  }
});

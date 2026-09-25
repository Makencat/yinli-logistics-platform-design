const ICONS = require('../../utils/icons.js');
const app = getApp();
const SM = app.globalData.statusMap.reserve;

Page({
  data: {
    icons: ICONS,
    mode: 'create', // create | manage
    demand: null,
    reserve: null,
    vehicles: [],
    vehicleIdx: 0,
    winIdx: 0,
    windows: ['07:30-08:30', '08:30-09:30', '09:30-10:30', '10:30-11:30', '11:00-12:00', '13:00-14:00', '14:00-15:00', '15:00-16:00'],
    canSign: false,
    canCancel: false
  },

  onLoad(options) {
    if (options.id) {
      this.mode = 'manage';
      this.resId = options.id;
    } else {
      this.mode = 'create';
      this.demandId = options.demandId;
    }
  },

  onShow() {
    this.refresh();
  },

  refresh() {
    const store = app.getStore();
    const vehicles = store.vehicles || [];
    if (this.mode === 'create') {
      const d = store.demands.find((x) => x.id === this.demandId);
      if (!d) {
        wx.showToast({ title: '货源不存在', icon: 'none' });
        setTimeout(() => wx.navigateBack(), 600);
        return;
      }
      this.setData({
        mode: 'create',
        demand: { ...d, qtyText: d.qty + (d.unit || '') },
        vehicles,
        vehicleIdx: 0,
        winIdx: 0
      });
      return;
    }

    // manage 模式
    const r = store.reservations.find((x) => !x._empty && x.id === this.resId);
    if (!r) {
      wx.showToast({ title: '预约不存在', icon: 'none' });
      setTimeout(() => wx.navigateBack(), 600);
      return;
    }
    const d = store.demands.find((x) => x.id === r.demandId) || {};
    const reserve = {
      ...r,
      statusText: SM[r.status] ? SM[r.status].text : r.status,
      color: SM[r.status] ? SM[r.status].color : '#8fa3c0'
    };
    this.setData({
      mode: 'manage',
      demand: d.id ? { ...d, qtyText: d.qty + (d.unit || '') } : null,
      reserve,
      vehicles,
      canSign: r.status === 'ready',
      canCancel: r.status === 'pending' || r.status === 'approved',
      canResched: r.status === 'pending' || r.status === 'approved'
    });
  },

  onPickVehicle(e) {
    const idx = Number(e.detail.value);
    const v = this.data.vehicles[idx];
    this.setData({ vehicleIdx: idx });
    if (v && this.data.demand) {
      this.setData({
        'vehicle': v.plate,
        'driver': v.driver,
        'phone': v.phone,
        'draftPlate': v.plate,
        'draftDriver': v.driver,
        'draftPhone': v.phone
      });
    }
  },

  onWin(e) {
    this.setData({ winIdx: Number(e.detail.value) });
  },

  submitReserve() {
    const { vehicles, vehicleIdx, demand, winIdx, windows } = this.data;
    if (!vehicles.length) {
      wx.showToast({ title: '请先在车辆管理中登记车辆', icon: 'none' });
      setTimeout(() => wx.navigateTo({ url: '/pages/logistics/vehicles' }), 700);
      return;
    }
    const v = vehicles[vehicleIdx];
    const store = app.getStore();
    const now = app.globalData.now();
    const eta = windows[winIdx] || '09:30-11:30';
    const reserve = {
      id: app.nextId('R'),
      demandId: demand.id,
      eta,
      plate: v.plate,
      driver: v.driver,
      phone: v.phone,
      qty: demand.qty + (demand.unit || ''),
      dock: '',
      status: 'pending',
      track: [{ time: now, text: `提交提货预约（预计到达 ${eta}）` }]
    };
    store.reservations.push(reserve);
    const d = store.demands.find((x) => x.id === demand.id);
    if (d) d.status = 'reserved';
    app.save();
    app.pushMessage('reserve', '提货预约已提交', `${reserve.id} 待仓库审核，预计 ${eta} 到厂`);
    wx.showToast({ title: '预约已提交', icon: 'success' });
    setTimeout(() => wx.navigateBack(), 600);
  },

  resched() {
    const windows = this.data.windows;
    wx.showActionSheet({
      itemList: windows,
      success: (res) => {
        const newEta = windows[res.tapIndex];
        const store = app.getStore();
        const r = store.reservations.find((x) => x.id === this.resId);
        if (r) {
          r.eta = newEta;
          r.track.push({ time: app.globalData.now(), text: `改期至 ${newEta}` });
          app.save();
          app.pushMessage('reserve', '提货时间已调整', `${r.id} 更新为预计到达 ${newEta}`);
          wx.showToast({ title: '已更新预计到达', icon: 'none' });
          this.refresh();
        }
      }
    });
  },

  cancelReserve() {
    wx.showModal({
      title: '取消提货预约',
      content: '取消后货源将重新进入可承接池，确定取消吗？',
      confirmColor: '#f87171',
      success: (res) => {
        if (!res.confirm) return;
        const store = app.getStore();
        const r = store.reservations.find((x) => x.id === this.resId);
        if (r) {
          const d = store.demands.find((x) => x.id === r.demandId);
          if (d) d.status = 'pending';
          store.reservations = store.reservations.filter((x) => x.id !== this.resId);
          app.save();
          app.pushMessage('reserve', '预约已取消', `${r.id} 已取消，货源重新进入协同池`);
        }
        wx.showToast({ title: '已取消', icon: 'none' });
        setTimeout(() => wx.navigateBack(), 500);
      }
    });
  },

  signIn() {
    wx.showModal({
      title: '车辆到厂签到',
      content: '确认车辆已到厂，开始装货并提货离场？',
      confirmColor: '#34d399',
      success: (res) => {
        if (!res.confirm) return;
        const store = app.getStore();
        const r = store.reservations.find((x) => x.id === this.resId);
        if (r) {
          r.status = 'done';
          r.track.push({ time: app.globalData.now(), text: '车辆到厂签到，装货完成提货离场' });
          const d = store.demands.find((x) => x.id === r.demandId);
          if (d) d.status = 'done';
          app.save();
          app.pushMessage('notice', '提货完成', `${r.id} 已完成提货，协同闭环收尾`);
          wx.showToast({ title: '签到成功，提货完成', icon: 'success' });
          this.refresh();
        }
      }
    });
  },

  goVehicles() {
    wx.navigateTo({ url: '/pages/logistics/vehicles' });
  }
});

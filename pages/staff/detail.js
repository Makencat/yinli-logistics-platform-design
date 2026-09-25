const ICONS = require('../../utils/icons.js');
const app = getApp();

Page({
  data: {
    icons: ICONS,
    clientId: '',
    client: null,
    ships: [],
    picker: { show: false, type: '', shipId: '', title: '', current: '', options: [] }
  },

  onLoad(options) {
    this.setData({ clientId: (options && options.id) || '' });
  },

  onShow() {
    this.refresh();
  },

  refresh() {
    const session = app.getSession();
    if (!session || session.role !== 'staff') {
      wx.redirectTo({ url: '/pages/role/index' });
      return;
    }
    const client = app.getClient(this.data.clientId);
    if (!client) {
      wx.showToast({ title: '客户不存在', icon: 'none' });
      setTimeout(() => wx.navigateBack(), 600);
      return;
    }
    this.setData({ client, ships: client.shipments.map((s) => app.mapShipment(s)) });
  },

  shipsOf() {
    return this.data.client ? this.data.client.shipments.map((s) => app.mapShipment(s)) : [];
  },

  openWarehouse(e) {
    const shipId = e.currentTarget.dataset.id;
    const ship = this.shipsOf().find((s) => s.id === shipId);
    this.setData({
      picker: {
        show: true, type: 'warehouse', shipId,
        title: '更改货物分配仓库',
        current: ship ? ship.warehouseId : '',
        options: app.globalData.warehouses.map((w) => ({ id: w.id, name: w.name, sub: w.addr }))
      }
    });
  },

  openDriver(e) {
    const shipId = e.currentTarget.dataset.id;
    const ship = this.shipsOf().find((s) => s.id === shipId);
    this.setData({
      picker: {
        show: true, type: 'driver', shipId,
        title: '挑选 / 指派运输师傅',
        current: ship ? ship.driverId : '',
        options: app.globalData.drivers.map((d) => ({
          id: d.id,
          name: d.name + ' · ' + d.plate,
          sub: d.type + ' · 驾龄 ' + d.years + ' 年 · ' + d.phone
        }))
      }
    });
  },

  closePicker() {
    this.setData({ 'picker.show': false });
  },

  choose(e) {
    const id = e.currentTarget.dataset.id;
    const p = this.data.picker;
    const res = p.type === 'warehouse'
      ? app.assignWarehouse(this.data.clientId, p.shipId, id)
      : app.assignDriver(this.data.clientId, p.shipId, id);
    this.setData({ 'picker.show': false });
    wx.showToast({ title: res.ok ? '已更新为 ' + res.name : res.msg, icon: 'none' });
    this.refresh();
  },

  nextStage(e) {
    const shipId = e.currentTarget.dataset.id;
    const ship = this.shipsOf().find((s) => s.id === shipId);
    if (!ship) return;
    const order = app.globalData.stageOrder;
    const idx = order.indexOf(ship.stage);
    if (idx >= order.length - 1) {
      wx.showToast({ title: '已到最终节点', icon: 'none' });
      return;
    }
    const res = app.advanceStage(this.data.clientId, shipId, order[idx + 1]);
    wx.showToast({ title: res.ok ? '已更新为 ' + res.text : res.msg, icon: 'none' });
    this.refresh();
  },

  notifyThis() {
    const client = this.data.client;
    if (!client) return;
    const ships = this.shipsOf();
    const active = ships.filter((s) => !s.arrived).length;
    const text = ships.length + ' 单货物状态已同步' + (active ? '，其中 ' + active + ' 单运输中' : '，全部已送达');
    app.notifyClient(client.id, '运输状态通知', text);
    wx.showToast({ title: '已通知 ' + client.name, icon: 'success' });
    this.refresh();
  }
});

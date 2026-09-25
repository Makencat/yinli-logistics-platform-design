const ICONS = require('../../utils/icons.js');
const app = getApp();

Page({
  data: {
    icons: ICONS,
    list: [],
    showForm: false,
    form: { plate: '', driver: '', phone: '', type: '普通货车' },
    types: ['重型厢式', '平板车', '冷藏/冷链车', '普通货车', '厢式货车']
  },

  onShow() {
    this.setData({ list: app.getStore().vehicles || [] });
  },

  toggleForm() {
    this.setData({ showForm: !this.data.showForm });
  },

  onInput(e) {
    this.setData({ ['form.' + e.currentTarget.dataset.k]: e.detail.value });
  },

  onType(e) {
    this.setData({ 'form.type': this.data.types[Number(e.detail.value)] });
  },

  addVehicle() {
    const f = this.data.form;
    if (!f.plate.trim() || !f.driver.trim()) {
      wx.showToast({ title: '请填写车牌与司机', icon: 'none' });
      return;
    }
    const store = app.getStore();
    if (store.vehicles.some((v) => v.plate === f.plate.trim())) {
      wx.showToast({ title: '该车牌已登记', icon: 'none' });
      return;
    }
    store.vehicles.push({
      plate: f.plate.trim(),
      driver: f.driver.trim(),
      phone: f.phone.trim() || '—',
      type: f.type
    });
    app.save();
    app.pushMessage('notice', '车辆登记完成', `${f.plate.trim()} 已加入运力池`);
    this.setData({
      showForm: false,
      form: { plate: '', driver: '', phone: '', type: '普通货车' },
      list: store.vehicles
    });
    wx.showToast({ title: '登记成功', icon: 'success' });
  },

  removeVehicle(e) {
    const plate = e.currentTarget.dataset.plate;
    wx.showModal({
      title: '移除车辆',
      content: `确认将车辆 ${plate} 移出运力池？`,
      confirmColor: '#f87171',
      success: (res) => {
        if (!res.confirm) return;
        const store = app.getStore();
        store.vehicles = store.vehicles.filter((v) => v.plate !== plate);
        app.save();
        this.setData({ list: store.vehicles });
      }
    });
  }
});

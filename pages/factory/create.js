const ICONS = require('../../utils/icons.js');
const app = getApp();

Page({
  data: {
    icons: ICONS,
    categories: ['工业原料', '包装耗材', '食品饮料', '冷链生鲜', '电子数码'],
    units: ['桶', '箱', '袋', '只', '件', '吨', 'L', 'kg'],
    windows: ['07:30-08:30', '08:30-09:30', '09:30-10:30', '10:30-11:30', '11:00-12:00', '13:00-14:00', '14:00-15:00', '15:00-16:00'],
    cateIdx: 0,
    unitIdx: 0,
    winIdx: 0,
    form: {
      product: '',
      qty: '',
      lot: '',
      customer: '',
      note: '',
      urgent: false
    }
  },

  onInput(e) {
    const k = e.currentTarget.dataset.k;
    this.setData({ ['form.' + k]: e.detail.value });
  },

  onCate(e) {
    this.setData({ cateIdx: Number(e.detail.value) });
  },
  onUnit(e) {
    this.setData({ unitIdx: Number(e.detail.value) });
  },
  onWin(e) {
    this.setData({ winIdx: Number(e.detail.value) });
  },
  toggleUrgent() {
    this.setData({ 'form.urgent': !this.data.form.urgent });
  },

  submit() {
    const f = this.data.form;
    if (!f.product.trim()) {
      wx.showToast({ title: '请填写产品名称', icon: 'none' });
      return;
    }
    if (!f.qty) {
      wx.showToast({ title: '请填写数量', icon: 'none' });
      return;
    }
    const store = app.getStore();
    const demand = {
      id: app.nextId('D'),
      product: f.product.trim(),
      category: this.data.categories[this.data.cateIdx] || '',
      qty: f.qty,
      unit: this.data.units[this.data.unitIdx] || '',
      lot: f.lot.trim() || '待定',
      customer: f.customer.trim() || '待定',
      urgent: f.urgent,
      window: this.data.windows[this.data.winIdx] || '09:30-11:30',
      note: f.note.trim(),
      status: 'pending',
      createTime: app.globalData.now()
    };
    store.demands.unshift(demand);
    app.save();
    app.pushMessage('demand', '新需求单已创建', `${demand.id} ${demand.product} 已进入待预约队列`);
    wx.showToast({ title: '需求单已提交', icon: 'success' });
    setTimeout(() => wx.navigateBack(), 600);
  }
});

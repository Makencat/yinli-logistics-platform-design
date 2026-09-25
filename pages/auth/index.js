const ICONS = require('../../utils/icons.js');
const app = getApp();

Page({
  data: {
    icons: ICONS,
    role: 'customer',
    meta: {},
    account: '',
    password: '',
    showPwd: false,
    error: '',
    locked: false,
    focusKey: ''
  },

  onLoad(options) {
    const role = options && options.role === 'staff' ? 'staff' : 'customer';
    this.setData({ role, meta: this.metaOf(role) });
  },

  metaOf(role) {
    if (role === 'staff') {
      return {
        navTitle: '员工登录',
        en: 'STAFF ACCESS',
        title: '员工工作台登录',
        sub: '银犁调度中心 · 月台与运力协同调度',
        tip: '演示账号 yuanshen / 密码 5408',
        userPh: '请输入员工账号',
        pwdPh: '请输入密码',
        btn: '登录员工工作台',
        icon: ICONS.user[1],
        glow: 'glow-b'
      };
    }
    return {
      navTitle: '客户登录',
      en: 'CUSTOMER ACCESS',
      title: '客户账号登录',
      sub: '查看货物运输状态 · 全程可视化',
      tip: '首次输入任意账号密码即自动注册',
      userPh: '请输入账号（任意）',
      pwdPh: '请输入密码（任意）',
      btn: '登录 / 注册并进入',
      icon: ICONS.box[1],
      glow: 'glow-g'
    };
  },

  onAccount(e) {
    this.setData({ account: e.detail.value, error: '' });
  },

  onPassword(e) {
    this.setData({ password: e.detail.value, error: '' });
  },

  togglePwd() {
    this.setData({ showPwd: !this.data.showPwd });
  },

  onFocus(e) {
    this.setData({ focusKey: (e.currentTarget.dataset && e.currentTarget.dataset.k) || '' });
  },

  onBlur() {
    this.setData({ focusKey: '' });
  },

  focusPwd() {
    this.setData({ focusKey: 'password' });
  },

  quickFill() {
    if (this.data.role === 'staff') {
      this.setData({ account: 'yuanshen', password: '5408', error: '' });
    } else {
      const rnd = Math.floor(Math.random() * 900 + 100);
      this.setData({ account: 'kehu' + rnd, password: '123456', error: '' });
    }
  },

  submit() {
    if (this.data.locked) return;
    const role = this.data.role;
    const account = (this.data.account || '').trim();
    const password = this.data.password || '';

    if (!account) {
      this.setData({ error: role === 'staff' ? '请输入员工账号' : '请输入账号' });
      return;
    }
    if (!password) {
      this.setData({ error: '请输入密码' });
      return;
    }

    this.setData({ locked: true });

    if (role === 'staff') {
      const res = app.loginStaff(account, password);
      if (!res.ok) {
        this.setData({ error: res.msg, locked: false });
        return;
      }
      wx.showToast({ title: '登录成功', icon: 'success' });
      setTimeout(() => {
        wx.redirectTo({ url: '/pages/staff/index' });
      }, 600);
      return;
    }

    const res = app.loginCustomer(account, password);
    wx.showToast({ title: res.isNew ? '注册并登录成功' : '登录成功', icon: 'success' });
    setTimeout(() => {
      wx.redirectTo({ url: '/pages/client/index' });
    }, 600);
  },

  goBack() {
    wx.navigateBack();
  }
});

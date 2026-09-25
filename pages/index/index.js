const ICONS = require('../../utils/icons.js');
const app = getApp();

Page({
  data: {
    icons: ICONS,
    todayText: '',
    unread: 0,
    reservedCount: 0,
    activeCount: 0,
    doneCount: 0,
    flowSteps: ['需求发布', '预约提货', '月台派单', '备货作业', '提货离场'],
    chain: [
      { t: '生产厂家发布提货需求', d: '录入物料批次、数量与期望窗口' },
      { t: '物流公司承接并预约', d: '登记车辆，提交提货预约与到厂时段' },
      { t: '仓库审核并分配月台', d: '审核通过，锁定装卸月台开始备货' },
      { t: '备货完成，车辆到厂', d: '装货核验，生成提货单' },
      { t: '提货离场，协同闭环', d: '客户端实时查看全程进度' }
    ]
  },

  onShow() {
    this.refresh();
  },

  refresh() {
    const store = app.getStore();
    const reserves = store.reservations.filter((r) => !r._empty);
    const d = new Date();
    const pad = (n) => (n < 10 ? '0' + n : '' + n);
    this.setData({
      todayText: `${d.getFullYear()}.${pad(d.getMonth() + 1)}.${pad(d.getDate())}`,
      unread: app.unreadCount(),
      reservedCount: store.demands.filter((x) => x.status !== 'pending').length,
      activeCount: reserves.filter((r) => r.status !== 'done').length,
      doneCount: reserves.filter((r) => r.status === 'done').length
    });
  },

  goDashboard() {
    wx.navigateTo({ url: '/pages/role/index' });
  },

  goMessages() {
    wx.navigateTo({ url: '/pages/message/index' });
  }
});

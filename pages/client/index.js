const ICONS = require('../../utils/icons.js');
const app = getApp();

Page({
  data: {
    icons: ICONS,
    iconBox: ICONS.box[1],
    session: null,
    client: null,
    ships: [],
    stats: [],
    menus: [],
    notices: [],
    unread: 0,
    greeting: ''
  },

  onShow() {
    this.refresh();
  },

  refresh() {
    const session = app.getSession();
    if (!session || session.role !== 'customer') {
      wx.redirectTo({ url: '/pages/role/index' });
      return;
    }
    const client = app.getClient(session.clientId) || app.getClientByAccount(session.account);
    if (!client) {
      wx.redirectTo({ url: '/pages/role/index' });
      return;
    }

    const ships = client.shipments.map((s) => app.mapShipment(s));
    const active = ships.filter((s) => !s.arrived).length;
    const loaded = ships.filter((s) => s.loaded && !s.departed).length;
    const departed = ships.filter((s) => s.departed && !s.arrived).length;
    const delivered = ships.filter((s) => s.arrived).length;
    const unread = app.clientUnread(client.id);
    const h = new Date().getHours();

    this.setData({
      session,
      client,
      ships,
      unread,
      greeting: h < 6 ? '凌晨好' : h < 12 ? '上午好' : h < 18 ? '下午好' : '晚上好',
      stats: [
        { k: '运输中', v: active },
        { k: '已装车', v: loaded },
        { k: '已出发', v: departed },
        { k: '已送达', v: delivered }
      ],
      notices: app.clientMessages(client.id).slice(0, 2),
      menus: [
        {
          key: 'track', icon: ICONS.box[1], glow: 'glow-g',
          n: '运输状态预览', d: '仓库位置 · 是否装车 / 出发 · 全程时间轴'
        },
        {
          key: 'batch', icon: ICONS.order[1], glow: 'glow-b',
          n: '提货批次总览', d: '查看全部提货单与预约记录'
        },
        {
          key: 'message', icon: ICONS.message[1], glow: 'glow-c',
          n: '消息通知', d: '仓库调度推送 · 状态变更提醒', badge: unread
        },
        {
          key: 'logout', icon: ICONS.signin[1], glow: 'glow-d',
          n: '退出登录', d: '返回首页重新选择角色'
        }
      ]
    });
  },

  onMenu(e) {
    const key = e.currentTarget.dataset.key;
    if (key === 'track') {
      wx.navigateTo({ url: '/pages/client/track' });
    } else if (key === 'batch') {
      wx.navigateTo({ url: '/pages/customer/index' });
    } else if (key === 'message') {
      wx.navigateTo({ url: '/pages/message/index' });
    } else if (key === 'logout') {
      app.clearSession();
      wx.reLaunch({ url: '/pages/index/index' });
    }
  },

  goTrack() {
    wx.navigateTo({ url: '/pages/client/track' });
  },

  goHome() {
    wx.reLaunch({ url: '/pages/index/index' });
  }
});

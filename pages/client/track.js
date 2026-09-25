const ICONS = require('../../utils/icons.js');
const app = getApp();

Page({
  data: {
    icons: ICONS,
    iconBox: ICONS.box[1],
    client: null,
    ships: [],
    expanded: ''
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
    let expanded = this.data.expanded;
    if (!expanded || !ships.some((s) => s.id === expanded)) {
      expanded = ships.length ? ships[0].id : '';
    }
    this.setData({ client, ships, expanded });
  },

  toggle(e) {
    const id = e.currentTarget.dataset.id;
    this.setData({ expanded: this.data.expanded === id ? '' : id });
  },

  goHome() {
    wx.reLaunch({ url: '/pages/index/index' });
  }
});

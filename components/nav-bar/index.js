const ICONS = require('../../utils/icons.js');

Component({
  properties: {
    title: { type: String, value: '' },
    showBack: { type: Boolean, value: true }
  },
  data: {
    icons: ICONS,
    statusBarHeight: 20
  },
  lifetimes: {
    attached() {
      let info = {};
      try {
        info = wx.getWindowInfo ? wx.getWindowInfo() : wx.getSystemInfoSync();
      } catch (e) {}
      this.setData({ statusBarHeight: info.statusBarHeight || 20 });
    }
  },
  methods: {
    onBack() {
      const pages = getCurrentPages();
      if (pages.length > 1) {
        wx.navigateBack();
      } else {
        wx.reLaunch({ url: '/pages/index/index' });
      }
    }
  }
});

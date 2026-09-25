// 提货预约协同小程序 v7 —— 全局入口 + 数据中心（客户 / 员工 双端 · 深空驾驶舱版）
const STORE_KEY = 'warehouse_reserve_store_v7';
const SESSION_KEY = 'warehouse_reserve_session_v7';

/* ==================== 状态字典 ==================== */

// 需求单状态
const DEMAND_STATUS = {
  pending: { text: '待预约', color: '#f59e0b' },
  reserved: { text: '已预约', color: '#3b82f6' },
  done: { text: '已提货', color: '#34d399' }
};

// 预约单状态
const RESERVE_STATUS = {
  pending: { text: '待审核', color: '#f59e0b', progress: 20 },
  approved: { text: '已派月台', color: '#3b82f6', progress: 40 },
  loading: { text: '备货中', color: '#a78bfa', progress: 60 },
  ready: { text: '备货完成', color: '#22d3ee', progress: 80 },
  done: { text: '已提货', color: '#34d399', progress: 100 }
};

// 货物运输阶段轴（客户 / 员工两端统一口径）
const SHIP_STAGES = [
  { key: 'inbound', text: '货物到仓', color: '#f59e0b', progress: 15 },
  { key: 'stored', text: '入库上架', color: '#4d8dff', progress: 35 },
  { key: 'allocated', text: '分配仓库', color: '#a78bfa', progress: 50 },
  { key: 'loading', text: '装车中', color: '#22d3ee', progress: 70 },
  { key: 'loaded', text: '已装车', color: '#22d3ee', progress: 85 },
  { key: 'departed', text: '已出发', color: '#34d399', progress: 95 },
  { key: 'arrived', text: '已送达', color: '#34d399', progress: 100 }
];

// 员工端可调度的仓库池
const WAREHOUSE_POOL = [
  { id: 'WH-A', name: 'A 区 · 常温仓 3 号位', addr: '成都市双流区物流大道 88 号 · 银犁基地 A 库' },
  { id: 'WH-B', name: 'B 区 · 恒温仓 5 号位', addr: '成都市双流区物流大道 88 号 · 银犁基地 B 库' },
  { id: 'WH-C', name: 'C 区 · 冷链仓 1 号位', addr: '成都市双流区物流大道 88 号 · 银犁冷链 C 库' },
  { id: 'WH-D', name: 'D 区 · 危化专区 2 号位', addr: '成都市双流区物流大道 90 号 · 银犁专用库 D 库' }
];

// 员工端可指派的运输师傅池
const DRIVER_POOL = [
  { id: 'DV-1', name: '王师傅', phone: '138****5201', plate: '川A·8K231', type: '重型厢式货车', years: 12 },
  { id: 'DV-2', name: '李师傅', phone: '139****3320', plate: '川H·3T779', type: '平板货车', years: 8 },
  { id: 'DV-3', name: '赵师傅', phone: '188****9012', plate: '川B·6M015', type: '冷链保温车', years: 15 },
  { id: 'DV-4', name: '孙师傅', phone: '137****6688', plate: '川C·9L203', type: '厢式货车', years: 6 }
];

// 运输阶段推进顺序
const STAGE_ORDER = ['inbound', 'stored', 'allocated', 'loading', 'loaded', 'departed', 'arrived'];

/* ==================== 工具函数 ==================== */
function pad(n) {
  return n < 10 ? '0' + n : '' + n;
}
function nowTime() {
  const d = new Date();
  return `${d.getFullYear()}-${pad(d.getMonth() + 1)}-${pad(d.getDate())} ${pad(d.getHours())}:${pad(d.getMinutes())}`;
}
function today() {
  const d = new Date();
  return `${d.getFullYear()}-${pad(d.getMonth() + 1)}-${pad(d.getDate())}`;
}
function stageIndex(key) {
  const i = STAGE_ORDER.indexOf(key);
  return i < 0 ? 0 : i;
}
function stageMeta(key) {
  return SHIP_STAGES.find((s) => s.key === key) || SHIP_STAGES[0];
}

/* ==================== 演示数据构造 ==================== */

// 依据当前阶段生成运输流水
function buildTimeline(stageKey, wh, drv, t, qtyText) {
  const upto = stageIndex(stageKey);
  const list = [];
  STAGE_ORDER.slice(0, upto + 1).forEach((key) => {
    let text = stageMeta(key).text;
    if (key === 'inbound') text = '货物已到仓 · ' + wh.addr;
    else if (key === 'stored') text = '完成入库上架 · ' + wh.name;
    else if (key === 'allocated') text = '调度分配仓库 · ' + wh.name;
    else if (key === 'loading') text = '月台装车中 · ' + drv.name + '（' + drv.plate + '）';
    else if (key === 'loaded') text = '装车完成 · ' + qtyText + ' 已装载';
    else if (key === 'departed') text = '车辆已出发 · ' + drv.plate + ' 驶离园区';
    else if (key === 'arrived') text = '货物已送达目的地，运输闭环';
    list.push({ time: t, text });
  });
  return list;
}

function makeShipment(opt) {
  const wh = WAREHOUSE_POOL.find((w) => w.id === opt.wh) || WAREHOUSE_POOL[0];
  const drv = DRIVER_POOL.find((d) => d.id === opt.driver) || DRIVER_POOL[0];
  const t = opt.time;
  const qtyText = opt.qty + (opt.unit || '');
  return {
    id: opt.id,
    orderNo: opt.orderNo,
    product: opt.product,
    qty: opt.qty,
    unit: opt.unit || '',
    lot: opt.lot,
    category: opt.category,
    warehouseId: wh.id,
    warehouseName: wh.name,
    warehouseAddr: wh.addr,
    driverId: drv.id,
    driverName: drv.name,
    driverPhone: drv.phone,
    plate: drv.plate,
    vehicleType: drv.type,
    stage: opt.stage,
    etaText: opt.etaText || '',
    updatedAt: t,
    timeline: buildTimeline(opt.stage, wh, drv, t, qtyText)
  };
}

function initMock() {
  const t = nowTime();
  const d = today();
  return {
    seq: 20,
    dockList: ['月台 1', '月台 2', '月台 3', '月台 4', '冷链月台 1', '冷链月台 2'],
    categories: ['工业原料', '包装耗材', '食品饮料', '冷链生鲜', '电子数码'],
    demands: [
      {
        id: 'D001', product: '工业润滑油 200L桶', category: '工业原料', qty: '1200', unit: 'L',
        lot: 'A-01', customer: '华南商贸有限公司', logistics: '顺捷物流',
        urgent: false, window: '09:30-11:30', note: '桶装摆放，需叉车作业',
        status: 'reserved', createTime: t, date: d
      },
      {
        id: 'D002', product: '包装纸箱 60×40×40', category: '包装耗材', qty: '5000', unit: '只',
        lot: 'B-03', customer: '汇通包装连锁', logistics: '安达货运',
        urgent: true, window: '11:00-12:00', note: '',
        status: 'reserved', createTime: t, date: d
      },
      {
        id: 'D003', product: '面粉 25kg/袋', category: '食品饮料', qty: '800', unit: '袋',
        lot: 'C-02', customer: '金穗食品', logistics: '顺捷物流',
        urgent: false, window: '13:00-15:00', note: '防潮，请勿叠高超过8层',
        status: 'pending', createTime: t, date: d
      },
      {
        id: 'D004', product: '冷冻肉品 10kg/箱', category: '冷链生鲜', qty: '300', unit: '箱',
        lot: '冷链1区', customer: '每日鲜生鲜', logistics: '安达货运',
        urgent: false, window: '07:30-08:30', note: '',
        status: 'done', createTime: t, date: d
      }
    ],
    reservations: [
      {
        id: 'R001', demandId: 'D001', eta: '09:30', plate: '鲁A·8K231',
        driver: '王师傅', phone: '138****5201', qty: '1200L', dock: '月台 2',
        status: 'ready',
        track: [
          { time: t, text: '提交提货预约（预计到达 09:30）' },
          { time: t, text: '仓库审核通过，分配月台 2' },
          { time: t, text: '开始备货' },
          { time: t, text: '备货完成，等待车辆到厂' }
        ]
      },
      {
        id: 'R002', demandId: 'D002', eta: '11:00', plate: '鲁H·3T779',
        driver: '李师傅', phone: '139****3320', qty: '5000只', dock: '',
        status: 'pending', track: [{ time: t, text: '提交提货预约（预计到达 11:00）' }]
      },
      {
        id: 'R003', demandId: 'D001', eta: '', plate: '', driver: '', phone: '', qty: '', dock: '',
        status: '', track: [], _empty: true
      },
      {
        id: 'R004', demandId: 'D004', eta: '07:40', plate: '鲁B·6M015',
        driver: '赵师傅', phone: '188****9012', qty: '300箱', dock: '冷链月台 1',
        status: 'done',
        track: [
          { time: t, text: '提交提货预约（预计到达 07:40）' },
          { time: t, text: '仓库审核通过，分配冷链月台 1' },
          { time: t, text: '开始备货' },
          { time: t, text: '备货完成，等待车辆到厂' },
          { time: t, text: '车辆到厂提货完成，顺利离场' }
        ]
      }
    ],
    vehicles: [
      { plate: '鲁A·8K231', driver: '王师傅', phone: '138****5201', type: '重型厢式' },
      { plate: '鲁H·3T779', driver: '李师傅', phone: '139****3320', type: '平板车' },
      { plate: '鲁B·6M015', driver: '赵师傅', phone: '188****9012', type: '冷链车' }
    ],
    messages: [
      { id: 'M1', type: 'reserve', title: '预约提交成功', text: 'R002 已提交提货预约，等待仓库审核', time: t, read: false, clientId: null },
      { id: 'M2', type: 'dock', title: '月台分配完成', text: 'R001 已通过审核并分配月台 2', time: t, read: false, clientId: null },
      { id: 'M3', type: 'notice', title: '备货完成提醒', text: 'R001 备货完成，等待车辆到厂', time: t, read: true, clientId: null }
    ],
    // ===== 客户账户体系（员工端列表 / 客户端登录后可见的数据源）=====
    clients: [
      {
        id: 'C001', account: 'huashang', password: '123456',
        name: '华南商贸有限公司', contact: '陈经理', phone: '138****5201',
        createdAt: t,
        shipments: [
          makeShipment({
            id: 'SP1001', orderNo: 'PO-2024-0871', product: '工业润滑油 200L 桶',
            qty: '1200', unit: 'L', lot: 'A-01', category: '工业原料',
            wh: 'WH-A', driver: 'DV-1', stage: 'loading',
            etaText: '预计今日 15:30 送达', time: t
          }),
          makeShipment({
            id: 'SP1002', orderNo: 'PO-2024-0866', product: '冷链生鲜礼盒 6 箱装',
            qty: '180', unit: '件', lot: '冷链2区', category: '冷链生鲜',
            wh: 'WH-C', driver: 'DV-3', stage: 'departed',
            etaText: '车辆已出发，预计 2 小时内送达', time: t
          })
        ]
      },
      {
        id: 'C002', account: 'huitong', password: '123456',
        name: '汇通包装连锁', contact: '刘主管', phone: '139****3320',
        createdAt: t,
        shipments: [
          makeShipment({
            id: 'SP1003', orderNo: 'PO-2024-0859', product: '包装纸箱 60×40×40',
            qty: '5000', unit: '只', lot: 'B-03', category: '包装耗材',
            wh: 'WH-B', driver: 'DV-2', stage: 'stored',
            etaText: '待到仓配载', time: t
          })
        ]
      },
      {
        id: 'C003', account: 'jinsui', password: '123456',
        name: '金穗食品', contact: '周经理', phone: '137****6688',
        createdAt: t,
        shipments: [
          makeShipment({
            id: 'SP1004', orderNo: 'PO-2024-0842', product: '面粉 25kg/袋',
            qty: '800', unit: '袋', lot: 'C-02', category: '食品饮料',
            wh: 'WH-A', driver: 'DV-4', stage: 'arrived',
            etaText: '已于 09:20 签收', time: t
          })
        ]
      }
    ]
  };
}

App({
  globalData: {
    store: null,
    statusMap: { demand: DEMAND_STATUS, reserve: RESERVE_STATUS },
    shipStages: SHIP_STAGES,
    stageOrder: STAGE_ORDER,
    warehouses: WAREHOUSE_POOL,
    drivers: DRIVER_POOL,
    staff: { account: 'yuanshen', password: '5408', name: '银犁调度中心', title: '月台调度员' },
    session: null,
    now: nowTime,
    today
  },

  onLaunch() {
    let store = null;
    try {
      store = wx.getStorageSync(STORE_KEY);
    } catch (e) {
      store = null;
    }
    if (!store || !store.demands || !store.clients || !store.clients.length) {
      store = initMock();
      wx.setStorageSync(STORE_KEY, store);
    }
    this.globalData.store = store;
  },

  getStore() {
    if (!this.globalData.store) {
      this.onLaunch();
    }
    return this.globalData.store;
  },

  save() {
    try {
      wx.setStorageSync(STORE_KEY, this.globalData.store);
    } catch (e) {
      // 忽略
    }
  },

  reset() {
    this.globalData.store = initMock();
    wx.setStorageSync(STORE_KEY, this.globalData.store);
    this.clearSession();
  },

  nextId(prefix) {
    const store = this.getStore();
    store.seq += 1;
    return prefix + (store.seq < 10 ? '00' + store.seq : '0' + store.seq);
  },

  /* ==================== 会话（登录态） ==================== */
  getSession() {
    if (this.globalData.session) return this.globalData.session;
    let s = null;
    try {
      s = wx.getStorageSync(SESSION_KEY);
    } catch (e) {
      s = null;
    }
    this.globalData.session = s || null;
    return this.globalData.session;
  },

  setSession(session) {
    this.globalData.session = session;
    try {
      wx.setStorageSync(SESSION_KEY, session);
    } catch (e) {
      // 忽略
    }
  },

  clearSession() {
    this.globalData.session = null;
    try {
      wx.removeStorageSync(SESSION_KEY);
    } catch (e) {
      // 忽略
    }
  },

  /* ==================== 登录 ==================== */

  // 客户端：账号密码任意输入即注册 / 登录
  loginCustomer(account, password) {
    const acc = (account || '').trim();
    const store = this.getStore();
    let client = store.clients.find((c) => c.account === acc);
    let isNew = false;
    if (!client) {
      client = this.createClient(acc, password);
      isNew = true;
    }
    const session = {
      role: 'customer',
      account: client.account,
      clientId: client.id,
      name: client.name,
      loginAt: nowTime()
    };
    this.setSession(session);
    return { ok: true, isNew, session };
  },

  // 客户端新账号：自动建档并预置一条在途运输单，保证登录后即可看到状态
  createClient(account, password) {
    const store = this.getStore();
    const t = nowTime();
    const idx = store.clients.length;
    const tpl = [
      { product: '包装纸箱 60×40×40', qty: '5000', unit: '只', lot: 'B-03', category: '包装耗材', wh: 'WH-B', stage: 'stored' },
      { product: '面粉 25kg/袋', qty: '800', unit: '袋', lot: 'C-02', category: '食品饮料', wh: 'WH-A', stage: 'allocated' },
      { product: '冷冻肉品 10kg/箱', qty: '300', unit: '箱', lot: '冷链1区', category: '冷链生鲜', wh: 'WH-C', stage: 'loading' },
      { product: '电子元器件 盒装', qty: '240', unit: '盒', lot: 'E-07', category: '电子数码', wh: 'WH-A', stage: 'inbound' }
    ];
    const pick = tpl[idx % tpl.length];
    const drv = DRIVER_POOL[idx % DRIVER_POOL.length];
    const client = {
      id: 'C' + (100 + idx + 1),
      account,
      password: password || '123456',
      name: account + ' 的提货账户',
      contact: '本人',
      phone: '—',
      isNew: true,
      createdAt: t,
      shipments: [
        makeShipment({
          id: 'SP' + (2000 + idx + 1),
          orderNo: 'PO-' + today().replace(/-/g, '') + '-' + (900 + idx),
          product: pick.product,
          qty: pick.qty,
          unit: pick.unit,
          lot: pick.lot,
          category: pick.category,
          wh: pick.wh,
          driver: drv.id,
          stage: pick.stage,
          etaText: '状态实时同步中',
          time: t
        })
      ]
    };
    store.clients.push(client);
    this.save();
    return client;
  },

  // 员工端：固定账号
  loginStaff(account, password) {
    const staff = this.globalData.staff;
    if ((account || '').trim() === staff.account && password === staff.password) {
      const session = {
        role: 'staff',
        account: staff.account,
        name: staff.name,
        title: staff.title,
        loginAt: nowTime()
      };
      this.setSession(session);
      return { ok: true, session };
    }
    return { ok: false, msg: '账号或密码不正确，请使用调度账号 yuanshen / 5408' };
  },

  /* ==================== 客户数据 ==================== */
  getClient(id) {
    return this.getStore().clients.find((c) => c.id === id) || null;
  },

  getClientByAccount(account) {
    return this.getStore().clients.find((c) => c.account === account) || null;
  },

  // 运输单视图（客户 / 员工通用）
  mapShipment(s) {
    const cur = stageIndex(s.stage);
    return {
      ...s,
      stageText: stageMeta(s.stage).text,
      stageColor: stageMeta(s.stage).color,
      progress: stageMeta(s.stage).progress,
      loaded: cur >= stageIndex('loaded'),
      departed: cur >= stageIndex('departed'),
      arrived: cur >= stageIndex('arrived'),
      stages: SHIP_STAGES.map((st, i) => ({
        key: st.key,
        text: st.text,
        state: i < cur ? 'done' : i === cur ? 'active' : 'ghost'
      }))
    };
  },

  // 员工端客户列表（含聚合状态）
  clientOverview() {
    const store = this.getStore();
    return store.clients.map((c) => {
      const ships = c.shipments.map((s) => this.mapShipment(s));
      const active = ships.filter((s) => !s.arrived).length;
      const delivered = ships.filter((s) => s.arrived).length;
      const unread = this.clientUnread(c.id);
      return {
        id: c.id,
        account: c.account,
        name: c.name,
        contact: c.contact,
        phone: c.phone,
        count: ships.length,
        active,
        delivered,
        unread,
        summary: active ? active + ' 单运输中 · ' + delivered + ' 单已送达' : '全部 ' + delivered + ' 单已送达',
        ships
      };
    });
  },

  /* ==================== 消息 ==================== */
  pushMessage(type, title, text) {
    const store = this.getStore();
    store.messages.unshift({
      id: this.nextId('M'), type, title, text, time: nowTime(), read: false, clientId: null
    });
    this.save();
  },

  // 向指定客户推送站内通知
  notifyClient(clientId, title, text) {
    const store = this.getStore();
    store.messages.unshift({
      id: this.nextId('M'), type: 'notice', title, text, time: nowTime(), read: false, clientId
    });
    this.save();
  },

  clientMessages(clientId) {
    return this.getStore().messages.filter((m) => m.clientId === clientId);
  },

  clientUnread(clientId) {
    return this.getStore().messages.filter((m) => m.clientId === clientId && !m.read).length;
  },

  readClientMessages(clientId) {
    const store = this.getStore();
    store.messages.forEach((m) => {
      if (m.clientId === clientId) m.read = true;
    });
    this.save();
  },

  markAllRead() {
    const store = this.getStore();
    store.messages.forEach((m) => (m.read = true));
    this.save();
  },

  unreadCount() {
    return this.getStore().messages.filter((m) => !m.read).length;
  },

  /* ==================== 员工调度操作 ==================== */

  _findShipment(clientId, shipId) {
    const client = this.getClient(clientId);
    if (!client) return { client: null, ship: null };
    return { client, ship: client.shipments.find((s) => s.id === shipId) || null };
  },

  // 更改货物分配仓库
  assignWarehouse(clientId, shipId, whId) {
    const { ship } = this._findShipment(clientId, shipId);
    const wh = WAREHOUSE_POOL.find((w) => w.id === whId);
    if (!ship || !wh) return { ok: false, msg: '未找到对应货物或仓库' };
    ship.warehouseId = wh.id;
    ship.warehouseName = wh.name;
    ship.warehouseAddr = wh.addr;
    if (stageIndex(ship.stage) < stageIndex('allocated')) ship.stage = 'allocated';
    ship.updatedAt = nowTime();
    ship.timeline.push({ time: nowTime(), text: '调度员调整分配仓库 · ' + wh.name });
    this.notifyClient(clientId, '仓库分配变更', ship.product + ' 的提货仓库已调整为 ' + wh.name);
    this.save();
    return { ok: true, name: wh.name };
  },

  // 挑选 / 指派运输师傅
  assignDriver(clientId, shipId, drvId) {
    const { ship } = this._findShipment(clientId, shipId);
    const drv = DRIVER_POOL.find((d) => d.id === drvId);
    if (!ship || !drv) return { ok: false, msg: '未找到对应货物或师傅' };
    ship.driverId = drv.id;
    ship.driverName = drv.name;
    ship.driverPhone = drv.phone;
    ship.plate = drv.plate;
    ship.vehicleType = drv.type;
    ship.updatedAt = nowTime();
    ship.timeline.push({ time: nowTime(), text: '调度员指派运输师傅 · ' + drv.name + '（' + drv.plate + '）' });
    this.notifyClient(clientId, '运输师傅指派', ship.product + ' 已指派 ' + drv.name + '（' + drv.plate + '）负责运输');
    this.save();
    return { ok: true, name: drv.name, plate: drv.plate };
  },

  // 推进运输阶段（员工端手动同步节点）
  advanceStage(clientId, shipId, stageKey) {
    const { ship } = this._findShipment(clientId, shipId);
    if (!ship || STAGE_ORDER.indexOf(stageKey) < 0) return { ok: false, msg: '参数有误' };
    if (stageIndex(stageKey) <= stageIndex(ship.stage)) return { ok: false, msg: '该节点已同步' };
    ship.stage = stageKey;
    ship.updatedAt = nowTime();
    const meta = stageMeta(stageKey);
    ship.timeline.push({ time: nowTime(), text: '运输节点更新 · ' + meta.text });
    this.notifyClient(clientId, '运输节点更新', ship.product + ' 最新状态：' + meta.text);
    this.save();
    return { ok: true, text: meta.text };
  },

  // 一键通知全部客户
  notifyAllClients() {
    const store = this.getStore();
    const t = nowTime();
    store.clients.forEach((c) => {
      const ships = c.shipments.map((s) => this.mapShipment(s));
      const active = ships.filter((s) => !s.arrived).length;
      const text = ships.length + ' 单货物状态已同步' + (active ? '，其中 ' + active + ' 单运输中' : '，全部已送达');
      store.messages.unshift({
        id: this.nextId('M'), type: 'notice', clientId: c.id,
        title: '运输状态通知', text, time: t, read: false
      });
    });
    this.save();
    return store.clients.length;
  }
});

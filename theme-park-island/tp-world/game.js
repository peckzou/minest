/* The park as a game (2026-11-24).
 * An opening: four travellers walk up to the gates together. Then quests instead of buttons — buy a ticket at the
 * booth, become an Imagineer at the Minest Imagineer Building, walk in through the gates, and after that whatever the
 * guest chooses from the quest board (fly the Falcon, build a lightsaber, build a droid, small world, Rise of the
 * Resistance, Flight of Passage, set something of your own down in the park). A beam of light stands at the quest
 * being followed; a small card says what and how far. Everything else the park's bars used to offer is behind one ⚙.
 * Progress is kept on this device ('tp.game'). Tab (or the card) opens the board; ⚙ the settings. */
(function (root) {
  'use strict';
  var API = null, T = null, K = root.TPRideKit, G = { done: {}, track: 'ticket', intro: 0 }, hud = null, beam = null, clock = 0, cine = null, rideT = 0;
  try { G = Object.assign(G, JSON.parse(localStorage.getItem('tp.game') || '{}')); } catch (e) {}
  function save() { try { localStorage.setItem('tp.game', JSON.stringify(G)); } catch (e) {} }
  var BOOTH = { x: 265.5, z: 502 };
  var Q = [
    { id: 'ticket', icon: '🎟', name: '买一张门票', tip: '去大门左边的售票亭', at: function () { return [BOOTH.x + 1.6, BOOTH.z + 2.4]; } },
    { id: 'imagineer', icon: '🎩', name: '成为小小 Imagineer', tip: '走进造梦大楼', need: 'ticket', at: function () { var d = root.MinestImagineerBuilding && root.MinestImagineerBuilding.door; return d ? [d.x - 3, d.z] : [297, 545]; }, test: function () { return root.MinestImagineerBuilding && root.MinestImagineerBuilding.isOpen(); } },
    { id: 'gate', icon: '🏰', name: '走进乐园', tip: '穿过大门到小镇广场', need: 'imagineer', at: function () { return [272.5, 432]; }, near: 9 },
    { id: 'falcon', icon: '🚀', name: '驾驶千年隼', tip: '巴图星 5 号停机坪', need: 'gate', ride: 'falcon_flight' },
    { id: 'saber', icon: '⚔️', name: '亲手造一把光剑', tip: '萨维的工坊', need: 'gate', at: function () { var a = root.TPSWSavi && root.TPSWSavi.at; return a ? [a.x, a.z + 22] : [198, 126]; }, test: function () { var s = root.TPStarWarsWorkshops && root.TPStarWarsWorkshops.state(); return s && s.saber && s.saber.theme; } },
    { id: 'droid', icon: '🤖', name: '造一个机器人伙伴', tip: '机器人工坊', need: 'gate', at: function () { var a = root.TPStarWarsBuildings && root.TPStarWarsBuildings.depot; return a ? [a.x, a.z + 8] : [164, 120]; }, test: function () { var s = root.TPStarWarsWorkshops && root.TPStarWarsWorkshops.state(); return s && s.droid && s.droid.parts; } },
    { id: 'rise', icon: '🪖', name: '逃出歼星舰', tip: '抵抗组织崛起', need: 'gate', ride: 'rise_resistance' },
    { id: 'world', icon: '⛵', name: '坐船看小小世界', tip: "it's a small world", need: 'gate', ride: 'small_world_boat' },
    { id: 'flight', icon: '🪽', name: '骑伊卡兰飞越潘多拉', tip: '飞越潘多拉', need: 'gate', ride: 'flight_of_passage' },
    { id: 'build', icon: '🧱', name: '在乐园里放下自己的作品', tip: '⚙ 里的「放模型」', need: 'imagineer', test: function () { return root.MinestImagineerPark && root.MinestImagineerPark.placed().length > 0; } }
  ];
  var RANKS = [[0, '游客'], [1, '持票游客'], [2, '小小 Imagineer'], [4, '探险家'], [7, '造梦大师'], [10, '传奇 Imagineer']];
  function stars() { return Q.filter(function (q) { return G.done[q.id]; }).length; }
  function rank() { var s = stars(), r = RANKS[0][1]; RANKS.forEach(function (x) { if (s >= x[0]) r = x[1]; }); return r; }
  function open(q) { return !G.done[q.id] && (!q.need || G.done[q.need]); }
  function target(q) { if (q.at) return q.at(); if (q.ride) { var r = API.getProps().rides[q.ride]; if (r) return [r.boardPos.x, r.boardPos.z]; } return null; }
  function complete(q) {
    if (G.done[q.id]) return; G.done[q.id] = Date.now(); if (K) [523, 659, 784, 1047].forEach(function (f, i) { K.tone(f, 0.7 - i * 0.08, 'triangle', 0.09, 0, i * 0.12); });
    banner('⭐ ' + q.icon + ' ' + q.name, rank()); try { if (stars() % 3 === 0) API.launchFireworks(); } catch (e) {}
    var nx = Q.filter(open)[0]; G.track = nx ? nx.id : ''; save(); render();
  }
  function banner(a, b) { var el = document.createElement('div'); el.className = 'gm-banner'; el.innerHTML = '<b>' + a + '</b><span>' + b + '</span>'; document.body.appendChild(el); setTimeout(function () { el.classList.add('out'); }, 2600); setTimeout(function () { el.remove(); }, 3400); }

  /* ---------------------------------------------------------------- the HUD: one card, one cog */
  function ensureHud() {
    if (hud) return; var css = document.createElement('style');
    css.textContent = 'body.game-on #title,body.game-on #mn-pav-btns,body.game-on #mmWrap,body.game-on #hint,body.game-on #hotbar,body.game-on #mip-fab,body.game-on .tp-quick-bar{display:none!important}' +
      'body.ride-on #gm,body.savi-on #gm,body.swx-on #gm,body.cine-on #gm{display:none}#gm{position:fixed;inset:0;z-index:60;pointer-events:none;font-family:-apple-system,"PingFang SC",sans-serif}' +
      '#gm-card{pointer-events:auto;position:absolute;left:16px;top:16px;display:flex;align-items:center;gap:12px;padding:10px 16px 10px 12px;border-radius:16px;background:rgba(10,14,26,.72);border:1.5px solid rgba(253,224,71,.6);color:#fff;cursor:pointer;backdrop-filter:blur(6px)}#gm-card .ic{font-size:30px}#gm-card b{display:block;font-size:15px;color:#fde68a}#gm-card span{font-size:12px;color:#cbd5e1}#gm-arrow{font-size:20px;color:#fde047;transition:transform .1s;display:inline-block}' +
      '#gm-rank{position:absolute;left:16px;top:86px;padding:4px 12px;border-radius:999px;background:rgba(10,14,26,.6);color:#fde68a;font-size:12px;font-weight:700}' +
      '#gm-cog{pointer-events:auto;position:absolute;right:16px;top:16px;width:48px;height:48px;border-radius:50%;border:1.5px solid rgba(255,255,255,.4);background:rgba(10,14,26,.72);color:#fff;font-size:22px;cursor:pointer}' +
      '.gm-panel{pointer-events:auto;position:absolute;left:50%;top:50%;transform:translate(-50%,-50%);width:min(560px,92vw);max-height:82vh;overflow:auto;padding:18px 20px;border-radius:20px;background:rgba(12,16,28,.94);border:1.5px solid rgba(253,224,71,.6);color:#fff;box-shadow:0 20px 60px rgba(0,0,0,.6)}.gm-panel h3{margin:0 0 12px;font-size:18px;color:#fde68a}.gm-panel .x{position:absolute;right:14px;top:12px;background:none;border:none;color:#fff;font-size:20px;cursor:pointer}' +
      '.gm-q{display:flex;align-items:center;gap:12px;padding:10px 12px;margin:6px 0;border-radius:14px;background:rgba(255,255,255,.06);border:1.5px solid transparent;cursor:pointer}.gm-q .ic{font-size:26px}.gm-q b{display:block;font-size:14.5px}.gm-q span{font-size:12px;color:#94a3b8}.gm-q.on{border-color:#fde047;background:rgba(253,224,71,.12)}.gm-q.done{opacity:.55;cursor:default}.gm-q.lock{opacity:.35;cursor:default}.gm-q em{margin-left:auto;font-style:normal;font-size:18px}' +
      '.gm-set{display:grid;grid-template-columns:repeat(3,1fr);gap:10px}.gm-set button{padding:14px 6px;border-radius:14px;border:1.5px solid rgba(255,255,255,.2);background:rgba(255,255,255,.07);color:#fff;font-size:13px;font-weight:700;cursor:pointer}.gm-set button i{display:block;font-style:normal;font-size:26px;margin-bottom:4px}' +
      '.gm-banner{position:fixed;left:50%;top:22%;transform:translateX(-50%);z-index:95;padding:14px 34px;border-radius:18px;background:linear-gradient(135deg,rgba(30,27,75,.95),rgba(88,28,135,.95));border:2px solid #fde047;color:#fff;text-align:center;animation:gmIn .5s;pointer-events:none}.gm-banner b{display:block;font-size:22px;color:#fde68a}.gm-banner span{font-size:14px}.gm-banner.out{opacity:0;transition:opacity .8s}@keyframes gmIn{from{transform:translateX(-50%) scale(.6);opacity:0}}' +
      '#cine{position:fixed;inset:0;z-index:96;pointer-events:auto;display:none}body.cine-on #cine{display:block}#cine i{position:absolute;left:0;right:0;height:11vh;background:#000}#cine i.t{top:0}#cine i.b{bottom:0}#cine h1{position:absolute;left:0;right:0;top:30%;margin:0;text-align:center;font:900 64px Georgia,"PingFang SC",serif;color:#fff;text-shadow:0 4px 30px rgba(0,0,0,.7);letter-spacing:.12em;opacity:0;transition:opacity 1.6s}#cine h1 small{display:block;font:600 20px sans-serif;letter-spacing:.4em;margin-top:10px;color:#fde68a}#cine p{position:absolute;left:0;right:0;bottom:13vh;margin:0;text-align:center;color:#fff;font:600 17px "PingFang SC",sans-serif;text-shadow:0 2px 8px #000}#cine u{position:absolute;right:20px;bottom:3vh;color:#cbd5e1;font:600 12px sans-serif;text-decoration:none}body.cine-on #title,body.cine-on #mn-pav-btns,body.cine-on #mmWrap,body.cine-on #hint,body.cine-on #hotbar,body.cine-on #mip-fab,body.cine-on #crosshair,body.cine-on #toast,body.cine-on #tp-action-prompt,body.cine-on #sw-saber-btn{display:none!important}';
    document.head.appendChild(css);
    var el = document.createElement('div'); el.id = 'gm'; el.innerHTML = '<div id="gm-card"><span class="ic"></span><div><b></b><span></span></div><span id="gm-arrow">▲</span></div><div id="gm-rank"></div><button type="button" id="gm-cog" title="设置">⚙</button>'; document.body.appendChild(el);
    hud = { el: el, card: el.querySelector('#gm-card'), ic: el.querySelector('#gm-card .ic'), name: el.querySelector('#gm-card b'), tip: el.querySelector('#gm-card div span'), arrow: el.querySelector('#gm-arrow'), rank: el.querySelector('#gm-rank'), panel: null };
    hud.card.onclick = function (e) { e.stopPropagation(); board(); }; el.querySelector('#gm-cog').onclick = function (e) { e.stopPropagation(); settings(); };
    ['mousedown', 'touchstart'].forEach(function (ev) { el.addEventListener(ev, function (e) { if (e.target !== el) e.stopPropagation(); }, ev === 'touchstart' ? { passive: true } : false); });
    document.body.classList.add('game-on');
  }
  function render() { var q = Q.filter(function (x) { return x.id === G.track; })[0]; if (!q || !open(q)) { q = Q.filter(open)[0]; G.track = q ? q.id : ''; } hud.ic.textContent = q ? q.icon : '🌟'; hud.name.textContent = q ? q.name : '所有任务完成！'; hud.tip.textContent = q ? q.tip : '自由探索乐园吧'; hud.rank.textContent = '⭐ ' + stars() + ' · ' + rank(); }
  function closePanel() { if (hud.panel) { hud.panel.remove(); hud.panel = null; try { API.setUI(false); } catch (e) {} } }
  function panel(title, html) { closePanel(); try { if (document.pointerLockElement) document.exitPointerLock(); API.setUI(true); } catch (e) {} var p = document.createElement('div'); p.className = 'gm-panel'; p.innerHTML = '<button type="button" class="x">✕</button><h3>' + title + '</h3>' + html; hud.el.appendChild(p); hud.panel = p; p.querySelector('.x').onclick = closePanel; return p; }
  function board() { var p = panel('📋 任务板 · ⭐ ' + stars() + ' · ' + rank(), Q.map(function (q) { var d = G.done[q.id], l = !d && !open(q); return '<div class="gm-q' + (d ? ' done' : l ? ' lock' : '') + (G.track === q.id ? ' on' : '') + '" data-q="' + q.id + '"><span class="ic">' + q.icon + '</span><div><b>' + q.name + '</b><span>' + q.tip + '</span></div><em>' + (d ? '⭐' : l ? '🔒' : G.track === q.id ? '📍' : '') + '</em></div>'; }).join(''));
    [].forEach.call(p.querySelectorAll('.gm-q'), function (el) { el.onclick = function () { var q = Q.filter(function (x) { return x.id === el.dataset.q; })[0]; if (!open(q)) return; G.track = q.id; save(); render(); closePanel(); }; }); }
  function settings() {
    var items = [['🗺', '导览图', function () { var b = document.getElementById('guide-top-btn'); if (b) b.click(); }], ['🧱', '放模型', function () { if (root.MinestImagineerPark) root.MinestImagineerPark.openDrawer(); }], ['🛠', '造乐园', function () { if (root.MinestParkBuilder) root.MinestParkBuilder.setBrush('p'); }],
      ['🏛', '幻想展馆', function () { if (root.MinestPavilion) root.MinestPavilion.open(); }], ['🌐', '中 / EN', function () { var b = document.getElementById('tp-lang-btn'); if (b) b.click(); }], ['⛶', '全屏', function () { try { var d = document; if (d.fullscreenElement) d.exitFullscreen(); else d.documentElement.requestFullscreen(); } catch (e) {} }],
      ['🌗', '昼夜', function () { root.dispatchEvent(new KeyboardEvent('keydown', { code: 'KeyT', key: 't', bubbles: true })); }], ['🎥', '视角', function () { if (root.TPGame2) root.TPGame2.view(); }], ['🎒', '背包', function () { if (root.TPGame2) root.TPGame2.bag(); }], ['🎬', '重看开场', function () { intro(); }], ['♻️', '重新开始', function () { if (root.confirm('清空任务进度，从头开始？')) { G = { done: {}, track: 'ticket', intro: 0 }; save(); render(); spawn(); } }]];
    var p = panel('⚙ 设置', '<div class="gm-set">' + items.map(function (it, i) { return '<button type="button" data-i="' + i + '"><i>' + it[0] + '</i>' + it[1] + '</button>'; }).join('') + '</div>');
    [].forEach.call(p.querySelectorAll('[data-i]'), function (b) { b.onclick = function () { closePanel(); items[+b.dataset.i][2](); }; });
  }
  function spawn() { API.teleport({ mode: 'walk', p: [272.5, API.groundY(272.5, 522, 62), 522], t: [272.5, 46, 470] }); }

  /* ---------------------------------------------------------------- the ticket booth */
  function booth() {
    var gy = API.groundY(BOOTH.x, BOOTH.z, 62), g = new T.Group(); g.position.set(BOOTH.x, gy, BOOTH.z); g.rotation.y = 0.5; API.scene.add(g);
    var L = function (c) { return new T.MeshLambertMaterial({ color: c }); }, add = function (geo, m, x, y, z) { var o = new T.Mesh(geo, m); o.position.set(x, y, z); g.add(o); return o; };
    add(new T.BoxGeometry(3, 1.1, 2.2), L(0xb3202a), 0, 0.55, 0); add(new T.BoxGeometry(3.1, 0.1, 2.3), L(0xfde68a), 0, 1.15, 0); [[-1.4, -1], [1.4, -1], [-1.4, 1], [1.4, 1]].forEach(function (q) { add(new T.BoxGeometry(0.14, 1.9, 0.14), L(0xf8fafc), q[0], 2.1, q[1]); });
    for (var i = 0; i < 6; i++) add(new T.BoxGeometry(0.56, 0.12, 2.9), L(i % 2 ? 0xf8fafc : 0xb3202a), -1.4 + i * 0.56, 3.1 + (i % 2) * 0.001, 0); add(new T.ConeGeometry(0.2, 0.5, 8), L(0xfde047), 0, 3.5, 0);
    var c = document.createElement('canvas'); c.width = 256; c.height = 96; var x = c.getContext('2d'); x.fillStyle = '#1e2a4a'; x.fillRect(0, 0, 256, 96); x.strokeStyle = '#fde047'; x.lineWidth = 6; x.strokeRect(3, 3, 250, 90); x.fillStyle = '#fff'; x.font = '700 44px "PingFang SC",sans-serif'; x.textAlign = 'center'; x.fillText('🎟 售票', 128, 64); add(new T.PlaneGeometry(2, 0.75), new T.MeshBasicMaterial({ map: new T.CanvasTexture(c) }), 0, 2.6, 1.12);
    if (root.TPSWSavi && root.TPSWSavi.traveler) { try { var clerk = root.TPSWSavi.traveler({ tunic: 0xf8fafc, vest: 0xb3202a, scarf: 0xfde047, hair: 0x6b4a2a, long: 1 }); clerk.position.set(0, 0, -0.3); g.add(clerk); } catch (e) {} }
    var e = { id: 'gm-ticket', name: '售票亭 · 买一张门票', x: BOOTH.x + 1.6, z: BOOTH.z + 2.4 }; Object.defineProperty(e, 'msg', { get: function () { var q = Q[0]; if (!G.done.ticket) { setTimeout(function () { complete(q); }, 0); return '🎟 给你，一张奇想乐园的门票！祝你玩得开心。'; } return '🎟 你已经有门票啦，快进去吧！'; } }); API.getProps().interactables.push(e);
  }
  /* ---------------------------------------------------------------- the opening: four travellers walk up to the gates */
  function intro() {
    if (cine || !root.TPSWSavi || !root.TPSWSavi.traveler) { spawn(); return; }
    var el = document.getElementById('cine'); if (!el) { el = document.createElement('div'); el.id = 'cine'; el.innerHTML = '<i class="t"></i><i class="b"></i><h1>奇想乐园<small>MINEST WONDER PARK</small></h1><p></p><u>点击 / 任意键 跳过</u>'; document.body.appendChild(el); }
    try { if (document.pointerLockElement) document.exitPointerLock(); } catch (e) {} API.setUI(true); document.body.classList.add('cine-on'); var h1 = el.querySelector('h1'), cap = el.querySelector('p'); h1.style.opacity = 0; cap.textContent = '';
    var looks = [{}, { tunic: 0x8fa3b8, vest: 0x3a4a5a, scarf: 0xd97706, hair: 0x191514, skin: 0xc98f62 }, { tunic: 0xf0b8c8, vest: 0x7c3aed, scarf: 0xfde047, hair: 0x6b4a2a, long: 1 }, { tunic: 0x9ad0a0, vest: 0x2f6b5a, scarf: 0xb3202a, hair: 0xc9a24a, skin: 0xf0c8a0, long: 1 }], gy = API.groundY(272.5, 540, 62);
    var crew = looks.map(function (o, i) { var a = root.TPSWSavi.traveler(o); a.scale.setScalar(i === 2 ? 0.8 : i === 3 ? 0.86 : 1); a.rotation.y = Math.PI; a.userData.off = [(i - 1.5) * 1.3, i % 2 ? 0.9 : 0]; API.scene.add(a); return a; });
    cine = { t: 0, crew: crew, el: el, h1: h1, cap: cap, gy: gy }; if (K) cine.music = K.seq([392, 494, 587, 784, 659, 587, 494, 587, 440, 523, 659, 880, 784, 659, 523, 659], 0.36, 'triangle', 0.05);
    var skip = function () { if (cine && cine.t > 1) endIntro(); }; cine.skip = skip; el.addEventListener('pointerdown', skip); root.addEventListener('keydown', skip, true);
  }
  var crewLeft = [];
  function endIntro() { var c = cine; cine = null; if (c) crewLeft = c.crew.slice(1); if (!c) return; if (c.music) c.music.stop(); c.el.removeEventListener('pointerdown', c.skip); root.removeEventListener('keydown', c.skip, true); document.body.classList.remove('cine-on');
    c.crew.forEach(function (a, i) { if (!i) { API.scene.remove(a); return; } a.position.set(268.5 + i * 1.5, c.gy, 509 + (i % 2)); a.rotation.y = 0.4 - i * 0.3; a.userData.mode = ''; root.TPSWSavi.animate(a, 0.016, 0); }); G.friends = 1; G.intro = 1; save(); API.setUI(false); spawn(); banner('🎟 第一个任务', '去售票亭买一张门票'); }
  function cineTick(dt) {
    var c = cine, t = (c.t += dt), P = API.player, gz = 546 - Math.max(0, t - 4.5) * 3.0, sm = function (k) { k = Math.max(0, Math.min(1, k)); return k * k * (3 - 2 * k); }, cam, look;
    c.crew.forEach(function (a) { a.position.set(272.5 + a.userData.off[0], c.gy, gz + a.userData.off[1]); root.TPSWSavi.animate(a, dt, t > 4.5 ? 3 : 0); a.userData.rig.head.rotation.y = Math.sin(t * 0.8 + a.userData.off[0]) * 0.4; });
    if (t < 5) { var k = sm(t / 5); cam = [272.5 + 40 * (1 - k), 92 - k * 44, 640 - k * 76]; look = [272.5, 52, 300 + k * 160]; c.h1.style.opacity = t > 0.8 && t < 4.2 ? 1 : 0; }
    else if (t < 11) { var k2 = sm((t - 5) / 6); cam = [272.5 + 7 - k2 * 10, c.gy + 2.2 + k2 * 0.6, gz + 8 - k2 * 2]; look = [272.5, c.gy + 1.4, gz - 3]; c.cap.textContent = '和伙伴们一起出发 —— 今天，我们要成为 Imagineer'; }
    else { var k3 = sm((t - 11) / 2.5); cam = [272.5 - 3 + k3 * 3, c.gy + 2.8 - k3 * 1.1, gz + 6 - k3 * 5.5]; look = [272.5, c.gy + 3 + k3 * 3, gz - 30]; c.cap.textContent = ''; }
    var dx = look[0] - cam[0], dy = look[1] - cam[1], dz = look[2] - cam[2]; P.pos.set(cam[0], cam[1] - 1.62, cam[2]); if (P.vel) P.vel.set(0, 0, 0); P.yaw = Math.atan2(-dx, -dz); P.pitch = Math.atan2(dy, Math.hypot(dx, dz)); if (!API.state.ui) API.setUI(true);
    if (t > 13.5) endIntro();
  }
  /* ---------------------------------------------------------------- every frame: the beam, the card, what is done */
  function tick(now) {
    requestAnimationFrame(tick); var dt = Math.min(0.05, (now - (tick.last || now)) / 1000); tick.last = now; clock += dt; if (!API) return; if (cine) { cineTick(dt); return; }
    var P = API.player, q = Q.filter(function (x) { return x.id === G.track; })[0], tg = q && open(q) ? target(q) : null;
    if (!beam) { beam = new T.Group(); var m = new T.Mesh(new T.CylinderGeometry(0.7, 1.1, 60, 16, 1, true), new T.MeshBasicMaterial({ color: 0xfde047, transparent: true, opacity: 0.22, side: T.DoubleSide, depthWrite: false, fog: false })); m.position.y = 30; beam.add(m); var d = new T.Mesh(new T.OctahedronGeometry(0.6, 0), new T.MeshBasicMaterial({ color: 0xfde047, fog: false })); beam.add(d); API.scene.add(beam); }
    beam.visible = !!tg && !API.state.activeRide; if (tg) { beam.position.set(tg[0], API.groundY(tg[0], tg[1], 62), tg[1]); beam.children[1].position.y = 3 + Math.sin(clock * 3) * 0.4; beam.children[1].rotation.y = clock * 2; beam.children[0].material.opacity = 0.16 + Math.sin(clock * 2) * 0.06;
      var dx = tg[0] - P.pos.x, dz = tg[1] - P.pos.z, dist = Math.hypot(dx, dz), rel = Math.atan2(dx, -dz) + P.yaw; hud.arrow.style.transform = 'rotate(' + rel + 'rad)'; hud.arrow.textContent = '▲'; hud.tip.textContent = q.tip + ' · ' + Math.round(dist) + ' 米'; if (q.near && dist < q.near) complete(q); } else hud.arrow.textContent = '';
    Q.forEach(function (x) { if (!open(x)) return; if (x.test && x.test()) complete(x); if (x.ride) { if (API.state.activeRide === x.ride) { x._t = (x._t || 0) + dt; if (x._t > 15) complete(x); } else x._t = 0; } });
    void rideT;
  }
  function attach(api) { if (API || !api) return; API = api; T = api.THREE; ensureHud(); render();
    var go = function (n) { if ((!root.TPSWSavi || !root.TPSWSavi.traveler || !root.TPSWSavi._amb.ring) && n < 40) return setTimeout(function () { go(n + 1); }, 250); try { booth(); } catch (e) {} if (/[?&]goto=/.test(location.search)) return; if (/[?&]nointro/.test(location.search)) { spawn(); return; } intro(); }; go(0);
    root.addEventListener('keydown', function (e) { if (cine || /INPUT|TEXTAREA/.test((e.target && e.target.tagName) || '')) return; if (e.code === 'Tab') { e.preventDefault(); if (hud.panel) closePanel(); else if (!API.state.activeRide) board(); } else if (e.key === 'Escape' && hud.panel) closePanel(); });
    requestAnimationFrame(tick); }
  if (root.TPParkAPI) attach(root.TPParkAPI); else root.addEventListener('tp:park-ready', function (e) { attach(e.detail || root.TPParkAPI); });
  root.TPGame = { save: save, banner: banner, quests: Q, render: function () { if (hud) render(); }, panel: function (t, h) { return panel(t, h); }, closePanel: function () { closePanel(); }, open: open, track: function (id) { G.track = id; save(); render(); }, crew: function () { return crewLeft; }, state: function () { return G; }, board: board, settings: settings, intro: intro, complete: function (id) { var q = Q.filter(function (x) { return x.id === id; })[0]; if (q) complete(q); }, cine: function () { return cine; } };
})(window);

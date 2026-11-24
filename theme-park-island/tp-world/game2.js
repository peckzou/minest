/* The park as a game, part two (2026-11-24): the guest is a traveller seen from behind (V switches to first person),
 * the three friends from the opening walk along and can be talked to (E beside one: where next, a fact, a photo),
 * gold stars to collect all over the park, coins (for stars and quests), a souvenir cart on Town Square where coins
 * buy things the traveller wears, and a backpack (B) that shows what has been earned. */
(function (root) {
  'use strict';
  var API = null, T = null, GM = null, SV = null, K = root.TPRideKit, av = null, tp = true, friends = [], stars = [], clock = 0, hud = null, wear = {}, camD = 4.2, sab = null;
  var FACTS = ['迪士尼乐园 1955 年开幕，第一天的门票是 1 美元。', '城堡用了“强迫透视”：越往上砖越小，所以看起来比实际更高。', '小镇大街的路面是红色的——红色能让草地看起来更绿。', '“Imagineer”是 imagination（想象）加 engineer（工程师）拼成的词。', '小小世界的歌，用很多种语言唱的是同一段旋律。', '千年隼号的驾驶舱，是照着电影里的布景一比一做的。'];
  var SHOP = [['ears', '🐭', '米奇耳朵', 30], ['balloon', '🎈', '红气球', 20], ['cape', '🦸', '英雄披风', 60], ['hat', '🎩', '魔法礼帽', 45]];
  function G() { return GM.state(); }
  function coins(n) { var g = G(); g.coins = (g.coins || 0) + n; GM.save(); draw(); }
  function draw() { if (!hud) return; var g = G(); hud.textContent = '🪙 ' + (g.coins || 0) + '  ⭐ ' + ((g.got || []).length); }
  function hidden() { var c = document.body.classList; return !!API.state.activeRide || c.contains('savi-on') || c.contains('swx-on') || c.contains('cine-on') || (root.MinestImagineerBuilding && root.MinestImagineerBuilding.isOpen()) || (root.MinestPavilion && root.MinestPavilion.isOpen && root.MinestPavilion.isOpen()); }
  function dress() {   /* what was bought is worn */
    var g = G(), it = g.items || [], rig = av.userData.rig, L = function (c) { return new T.MeshLambertMaterial({ color: c, side: T.DoubleSide }); }, add = function (p, geo, m, x, y, z) { var o = new T.Mesh(geo, m); o.position.set(x, y, z); p.add(o); return o; };
    Object.keys(wear).forEach(function (k) { wear[k].forEach(function (o) { o.parent.remove(o); }); }); wear = {};
    if (it.indexOf('ears') >= 0) wear.ears = [-1, 1].map(function (s) { return add(rig.head, new T.SphereGeometry(0.09, 10, 8), L(0x111111), s * 0.14, 0.36, -0.02); });
    if (it.indexOf('hat') >= 0) wear.hat = [add(rig.head, new T.CylinderGeometry(0.13, 0.13, 0.22, 14), L(0x1e1b4b), 0, 0.46, 0), add(rig.head, new T.CylinderGeometry(0.22, 0.22, 0.02, 14), L(0x1e1b4b), 0, 0.35, 0), add(rig.head, new T.CylinderGeometry(0.132, 0.132, 0.04, 14), L(0xfde047), 0, 0.38, 0)];
    if (it.indexOf('cape') >= 0) { var c = add(rig.body, new T.PlaneGeometry(0.5, 0.8), L(0xb3202a), 0, 1.02, -0.33); c.rotation.x = 0.12; wear.cape = [c]; }
    if (it.indexOf('balloon') >= 0) wear.balloon = [add(rig.handL, new T.CylinderGeometry(0.005, 0.005, 1.5, 4), L(0xffffff), 0, 0.8, 0), add(rig.handL, new T.SphereGeometry(0.2, 12, 10), L(0xe11d48), 0, 1.7, 0)];
  }
  function shop() { var g = G(), own = g.items || [], p = GM.panel('🎁 纪念品车 · 🪙 ' + (g.coins || 0), '<div class="gm-set">' + SHOP.map(function (s, i) { var has = own.indexOf(s[0]) >= 0; return '<button type="button" data-i="' + i + '"' + (has ? ' style="opacity:.5"' : '') + '><i>' + s[1] + '</i>' + s[2] + '<br>' + (has ? '已拥有' : '🪙 ' + s[3]) + '</button>'; }).join('') + '</div>');
    [].forEach.call(p.querySelectorAll('[data-i]'), function (b) { b.onclick = function () { var s = SHOP[+b.dataset.i], g2 = G(); g2.items = g2.items || []; if (g2.items.indexOf(s[0]) >= 0) return; if ((g2.coins || 0) < s[3]) { API.toast('🪙 金币不够——去收集金星、完成任务吧'); return; } g2.coins -= s[3]; g2.items.push(s[0]); GM.save(); dress(); draw(); if (K) K.tone(880, 0.3, 'triangle', 0.1); GM.closePanel(); GM.banner(s[1] + ' ' + s[2], '已经穿戴上了'); }; }); }
  function bag() { var g = G(), W = root.TPStarWarsWorkshops, ws = W ? W.state() : {}, rows = [['🎟', '门票', g.done && g.done.ticket], ['🎩', 'Imagineer 徽章', g.done && g.done.imagineer], ['⚔️', '亲手造的光剑', ws.saber && ws.saber.theme], ['🤖', '机器人伙伴', ws.droid && ws.droid.parts]].concat(SHOP.map(function (s) { return [s[1], s[2], (g.items || []).indexOf(s[0]) >= 0]; }));
    GM.panel('🎒 背包 · 🪙 ' + (g.coins || 0) + ' · ⭐ 金星 ' + ((g.got || []).length) + '/' + stars.length, '<div class="gm-set">' + rows.map(function (r) { return '<button type="button" style="cursor:default' + (r[2] ? '' : ';opacity:.28') + '"><i>' + r[0] + '</i>' + r[1] + '</button>'; }).join('') + '</div>'); }
  function talk(f) { var g = G(); g.chat = 1; GM.save(); var p = GM.panel(f.icon + ' ' + f.name, '<div class="gm-q" data-o="next"><span class="ic">🧭</span><div><b>接下来去哪？</b></div></div><div class="gm-q" data-o="fact"><span class="ic">📖</span><div><b>讲个小知识</b></div></div><div class="gm-q" data-o="photo"><span class="ic">📸</span><div><b>我们合个影吧！</b></div></div>');
    [].forEach.call(p.querySelectorAll('[data-o]'), function (el) { el.onclick = function () { GM.closePanel(); var o = el.dataset.o;
      if (o === 'next') { var q = GM.quests.filter(function (x) { return GM.open(x) && x.id !== G().track; })[0] || GM.quests.filter(GM.open)[0]; if (q) { GM.track(q.id); say(f, '我想去「' + q.name + '」！跟着金色的光柱走。'); } else say(f, '我们把任务都做完啦，随便逛逛吧！'); }
      else if (o === 'fact') say(f, FACTS[Math.floor(Math.random() * FACTS.length)]);
      else { say(f, '三、二、一——茄子！'); try { API.launchFireworks(); } catch (e) {} friends.forEach(function (q) { q.wave = clock; }); coins(5); } }; }); }
  function say(f, t) { API.toast(f.icon + ' ' + f.name + '：' + t); try { var ss = root.speechSynthesis; if (ss && root.SpeechSynthesisUtterance) { ss.cancel(); var u = new root.SpeechSynthesisUtterance(t); u.lang = 'zh-CN'; u.pitch = f.pitch; ss.speak(u); } } catch (e) {} }
  function attach(api) {
    if (API || !api) return; API = api; T = api.THREE;
    var go = function (n) { GM = root.TPGame; SV = root.TPSWSavi; if ((!GM || !SV || !SV.traveler) && n < 60) return setTimeout(function () { go(n + 1); }, 250); if (!GM || !SV) return; try { build(); } catch (e) { if (root.console) console.warn('[game2]', e); } }; go(0);
  }
  function build() {
    av = SV.traveler(); API.scene.add(av); dress();
    var looks = [{ tunic: 0x8fa3b8, vest: 0x3a4a5a, scarf: 0xd97706, hair: 0x191514, skin: 0xc98f62 }, { tunic: 0xf0b8c8, vest: 0x7c3aed, scarf: 0xfde047, hair: 0x6b4a2a, long: 1 }, { tunic: 0x9ad0a0, vest: 0x2f6b5a, scarf: 0xb3202a, hair: 0xc9a24a, skin: 0xf0c8a0, long: 1 }], NAMES = [['🧢', '阿杰', 0.8], ['🎀', '小米', 1.5], ['🌿', '朵朵', 1.3]], list = API.getProps().interactables;
    looks.forEach(function (o, i) { var m = SV.traveler(o); m.scale.setScalar(i === 1 ? 0.8 : i === 2 ? 0.86 : 1); m.visible = false; API.scene.add(m); var f = { m: m, icon: NAMES[i][0], name: NAMES[i][1], pitch: NAMES[i][2], off: [[-2.3, -0.6], [2.3, -0.4], [3.7, 0.5]][i]   /* beside the traveller, never between them and the camera */, x: 0, z: 0, on: false, sp: 0 }; friends.push(f);
      var e = { id: 'gm-friend' + i, name: '和' + f.name + '聊聊', x: 1e6, z: 1e6 }; Object.defineProperty(e, 'msg', { get: function () { setTimeout(function () { talk(f); }, 0); return f.icon + ' ' + f.name; } }); list.push(e); f.e = e; });
    /* gold stars, one near every land */
    var gm = new T.MeshBasicMaterial({ color: 0xfde047 }), got = G().got || []; API.getWorld().LANDS.forEach(function (l, i) { var x = l.x - 5 + (i % 3) * 5, z = l.z - 6 + (i % 2) * 12, y = API.groundY(x, z, 62); if (y > 60 || y < 37) return; var s = new T.Mesh(new T.OctahedronGeometry(0.42, 0), gm); s.position.set(x, y + 1.5, z); s.scale.set(1, 1.3, 0.5); s.visible = got.indexOf(l.id) < 0; API.scene.add(s); stars.push({ m: s, id: l.id, x: x, z: z }); });
    /* the souvenir cart on Town Square */
    var cx = 281, cz = 438, cy = API.groundY(cx, cz, 62), c = new T.Group(); c.position.set(cx, cy, cz); API.scene.add(c); var L = function (col) { return new T.MeshLambertMaterial({ color: col }); }, add = function (geo, m, x, y, z) { var o = new T.Mesh(geo, m); o.position.set(x, y, z); c.add(o); return o; };
    add(new T.BoxGeometry(2.2, 0.9, 1.1), L(0x16a34a), 0, 0.75, 0); add(new T.BoxGeometry(2.4, 0.08, 1.3), L(0xfde68a), 0, 1.24, 0); [-0.8, 0.8].forEach(function (x) { add(new T.CylinderGeometry(0.35, 0.35, 0.1, 14), L(0x3a2616), x, 0.35, 0.6).rotation.x = Math.PI / 2; add(new T.BoxGeometry(0.08, 1.4, 0.08), L(0xf8fafc), x * 1.3, 1.95, 0); }); add(new T.BoxGeometry(2.6, 0.1, 1.5), L(0xdc2626), 0, 2.7, 0);
    [0xe11d48, 0x2563eb, 0xfde047].forEach(function (col, i) { add(new T.SphereGeometry(0.22, 10, 8), L(col), -0.6 + i * 0.6, 3.5 + (i % 2) * 0.3, 0); add(new T.CylinderGeometry(0.006, 0.006, 0.8, 4), L(0xffffff), -0.6 + i * 0.6, 3.0, 0); }); [-0.5, 0.5].forEach(function (x) { add(new T.SphereGeometry(0.12, 8, 6), L(0x111111), x - 0.12, 1.5, 0.2); add(new T.SphereGeometry(0.12, 8, 6), L(0x111111), x + 0.12, 1.5, 0.2); });
    var se = { id: 'gm-shop', name: '纪念品车 · 用金币买纪念品', x: cx, z: cz + 1.6 }; Object.defineProperty(se, 'msg', { get: function () { setTimeout(shop, 0); return '🎁'; } }); list.push(se);
    /* a work of one's own, set down in the park, is a place to visit: a quest, and the friends have something to say */
    var mine = function () { var l = root.MinestImagineerPark ? root.MinestImagineerPark.placed() : []; return l.filter(function (it) { return it.full; })[0] || null; }, seen = {};
    GM.quests.push({ id: 'myworld', icon: '🌟', name: '去看看我造的世界', tip: '先在造梦大楼把作品放进乐园', need: 'imagineer', at: function () { var m = mine(); return m ? [m.x, m.z + 18] : null; }, test: function () { var m = mine(), P = API.player.pos; if (!m || Math.hypot(P.x - m.x, P.z - m.z) > 22) return false; if (!seen[m.id]) { seen[m.id] = 1; setTimeout(function () { say(friends[1], '哇——这是你造的「' + (m.title || '世界') + '」！它真的立在乐园里了！'); friends.forEach(function (q) { q.wave = clock; }); }, 600); } return true; } });
    GM.quests.push({ id: 'chat', icon: '💬', name: '和伙伴聊聊', tip: '走到伙伴身边按 E', need: 'ticket', test: function () { return G().chat; } }, { id: 'stars10', icon: '⭐', name: '收集 10 颗金星', tip: '乐园各处都有', need: 'gate', test: function () { return (G().got || []).length >= 10; } }, { id: 'shop', icon: '🎁', name: '买一件纪念品', tip: '小镇广场的纪念品车', need: 'gate', at: function () { return [cx, cz + 1.6]; }, test: function () { return (G().items || []).length > 0; } });
    hud = document.createElement('div'); hud.style.cssText = 'position:absolute;left:16px;top:118px;padding:4px 12px;border-radius:999px;background:rgba(10,14,26,.6);color:#fde68a;font:700 12px -apple-system,"PingFang SC",sans-serif;pointer-events:auto;cursor:pointer'; hud.onclick = function (e) { e.stopPropagation(); bag(); }; (document.getElementById('gm') || document.body).appendChild(hud); draw(); GM.render();
    /* third person: the camera steps back behind the traveller just for the drawing of each frame */
    var R = API.renderer, r0 = R.render.bind(R), fw = new T.Vector3(), keep = new T.Vector3();
    R.render = function (scene, cam) { if (!tp || cam !== API.camera || hidden() || !av.visible) return r0(scene, cam); keep.copy(cam.position); cam.getWorldDirection(fw); var d = camD; for (; d > 0.9; d -= 0.5) { var x = keep.x - fw.x * d, y = keep.y - fw.y * d + 0.5, z = keep.z - fw.z * d; if (API.groundY(x, z, Math.min(62, Math.floor(y))) <= y - 0.25) break; }
      cam.position.set(keep.x - fw.x * d, Math.max(keep.y - fw.y * d + 0.5, API.groundY(keep.x - fw.x * d, keep.z - fw.z * d, 62) > 60 ? keep.y : 0), keep.z - fw.z * d); cam.updateMatrixWorld(true); av.visible = d > 1.2; r0(scene, cam); av.visible = true; cam.position.copy(keep); cam.updateMatrixWorld(true); };
    root.addEventListener('keydown', function (e) { if (/INPUT|TEXTAREA/.test((e.target && e.target.tagName) || '') || hidden()) return; if (e.code === 'KeyV') view(); else if (e.code === 'KeyB') bag(); });
    /* F is the balloon now (before the park's own free-flight key hears it) */
    root.addEventListener('keydown', function (e) { if (e.code !== 'KeyF' || /INPUT|TEXTAREA/.test((e.target && e.target.tagName) || '')) return; e.stopImmediatePropagation(); e.preventDefault(); if (!e.repeat) setFly(!fly); }, true);
    GM.quests.push({ id: 'balloon', icon: '🎈', name: '坐热气球俯瞰乐园', tip: '按 F 或 ⚙ 里的热气球', need: 'gate', test: function () { return fly && API.player.pos.y > 62; } });
    var last = performance.now(), paid = Object.keys(G().done || {}).length;
    (function tick(now) { requestAnimationFrame(tick); var dt = Math.min(0.05, (now - last) / 1000); last = now; clock += dt; var P = API.player, hide = hidden(), g = G();
      av.visible = tp && !hide; var W = root.TPStarWarsWorkshops; if (W && W.third) W.third(tp && !hide); var ch = document.getElementById('crosshair'); if (ch) ch.style.opacity = tp ? 0 : 1;
      if (av.visible) { var sp = P.vel ? Math.hypot(P.vel.x, P.vel.z) : 0; av.position.set(P.pos.x, P.pos.y, P.pos.z); av.rotation.y = P.yaw + Math.PI; var ws = W ? W.state().saber : null; if (ws && ws.theme && !sab && root.TPSWParts) { sab = root.TPSWParts.saber(ws); sab.position.set(0, 0.1, 0); av.userData.rig.handR.add(sab); } av.userData.mode = sab ? 'saber' : ''; SV.animate(av, dt, sp); if (sab) sab.rotation.x = -av.userData.rig.armR.rotation.x + 0.12; }
      /* the friends: once the opening is over they walk along, a little behind */
      var joined = g.intro || (GM.crew && GM.crew().length); if (joined && !friends[0].on) { friends.forEach(function (f, i) { f.on = true; var c0 = GM.crew()[i]; if (c0) { f.x = c0.position.x; f.z = c0.position.z; API.scene.remove(c0); } else { f.x = P.pos.x + f.off[0]; f.z = P.pos.z + f.off[1]; } }); }
      try { flyTick(dt); } catch (e) {} if (fly) camD += (9 - camD) * Math.min(1, dt * 2); else camD += (4.2 - camD) * Math.min(1, dt * 2);
      friends.forEach(function (f) { if (fly) return; f.m.visible = f.on && !hide; if (!f.m.visible) { f.e.x = 1e6; return; } var s = Math.sin(P.yaw), c2 = Math.cos(P.yaw), tx = P.pos.x + c2 * f.off[0] + s * f.off[1], tz = P.pos.z - s * f.off[0] + c2 * f.off[1], dx = tx - f.x, dz = tz - f.z, d = Math.hypot(dx, dz);
        if (d > 45) { f.x = tx; f.z = tz; d = 0; } var v = d > 0.5 ? Math.min(d * 2.2, d > 6 ? 9 : 5.2) : 0; if (v) { f.x += dx / d * v * dt; f.z += dz / d * v * dt; f.m.rotation.y = Math.atan2(dx, dz); } else f.m.rotation.y += Math.atan2(Math.sin(P.yaw + Math.PI - f.m.rotation.y), Math.cos(P.yaw + Math.PI - f.m.rotation.y)) * Math.min(1, dt * 2);
        f.m.position.set(f.x, API.groundY(f.x, f.z, Math.min(62, Math.floor(P.pos.y + 6))), f.z); SV.animate(f.m, dt, v); if (f.wave && clock - f.wave < 2.5) f.m.userData.rig.armR.rotation.set(-2.6, 0, -0.3 + Math.sin(clock * 9) * 0.3); f.e.x = f.x; f.e.z = f.z; });
      /* gold stars */
      stars.forEach(function (s2, i) { if (!s2.m.visible) return; s2.m.rotation.y = clock * 2 + i; s2.m.position.y += Math.sin(clock * 2 + i) * 0.004; if (!hide && Math.hypot(P.pos.x - s2.x, P.pos.z - s2.z) < 2.2) { s2.m.visible = false; g.got = g.got || []; g.got.push(s2.id); coins(10); if (K) { K.tone(1047, 0.2, 'triangle', 0.1); K.tone(1568, 0.4, 'triangle', 0.09, 0, 0.1); } API.toast('⭐ 金星 +1 · 🪙 +10'); } });
      var n = Object.keys(g.done || {}).length; if (n > paid) { coins((n - paid) * 50); paid = n; } else if (n < paid) { paid = n; (g.got || []).length || stars.forEach(function (s3) { s3.m.visible = true; }); dress(); draw(); }
    })(last);
  }
  /* ---------------------------------------------------------------- the hot-air balloon: flying is a balloon ride
   * F (or ⚙ → 热气球): the balloon inflates round the traveller and lifts off; the friends climb into the basket.
   * Space (or the burner button) fires the burner and it rises; C lets it sink; WASD drifts it. F again brings it down. */
  var landing = false, bal = null, fly = false, burn = 0, hiss = null, hot = { up: false, dn: false }, pad = null;
  function balloon() {
    var g = new T.Group(), L = function (c, o) { return new T.MeshLambertMaterial(Object.assign({ color: c }, o || {})); }, add = function (p, geo, m, x, y, z) { var o = new T.Mesh(geo, m); o.position.set(x || 0, y || 0, z || 0); p.add(o); return o; };
    var env = new T.Group(); env.position.y = 7.4; g.add(env); var cols = [0xe11d48, 0xfde047, 0x2563eb, 0xf8fafc, 0x16a34a, 0xf97316, 0x7c3aed, 0xfde047];
    for (var i = 0; i < 16; i++) { var gore = add(env, new T.SphereGeometry(3.4, 4, 18, i * Math.PI / 8, Math.PI / 8), L(cols[i % 8], { side: T.DoubleSide })); gore.scale.y = 1.22; }
    add(env, new T.CylinderGeometry(1.25, 0.75, 1.5, 16, 1, true), L(0xb3202a, { side: T.DoubleSide }), 0, -4.3, 0); var band = add(env, new T.TorusGeometry(3.42, 0.09, 6, 40), L(0xfde047), 0, 0.2, 0); band.rotation.x = Math.PI / 2; add(env, new T.SphereGeometry(0.3, 10, 8), L(0xfde047), 0, 4.2, 0);
    [0, 1, 2, 3].forEach(function (k) { var a = k * Math.PI / 2 + Math.PI / 4, r = add(g, new T.CylinderGeometry(0.02, 0.02, 2.4, 4), L(0x3a2616), Math.cos(a) * 0.72, 2.2, Math.sin(a) * 0.72); r.rotation.z = -Math.cos(a) * 0.07; r.rotation.x = Math.sin(a) * 0.07; add(g, new T.CylinderGeometry(0.04, 0.04, 1.05, 6), L(0x4a3220), Math.cos(a) * 0.92, 0.52, Math.sin(a) * 0.92); });
    var wick = L(0xa5713a, { side: T.DoubleSide }); add(g, new T.BoxGeometry(1.9, 0.1, 1.9), L(0x7a4f24), 0, 0.0, 0); [[0, 0.95, 1.9, 0.08], [0, -0.95, 1.9, 0.08], [0.95, 0, 0.08, 1.9], [-0.95, 0, 0.08, 1.9]].forEach(function (q) { add(g, new T.BoxGeometry(q[2], 0.9, q[3]), wick, q[0], 0.5, q[1]); add(g, new T.BoxGeometry(q[2] + 0.06, 0.08, q[3] + 0.06), L(0x4a3220), q[0], 0.98, q[1]); });
    [-1, 1].forEach(function (s) { add(g, new T.SphereGeometry(0.2, 8, 6), L(0xd9c8a0), s * 1.08, 0.4, 0.5).scale.y = 1.5; });
    add(g, new T.BoxGeometry(0.5, 0.12, 0.5), L(0x4b5563), 0, 2.55, 0); add(g, new T.CylinderGeometry(0.1, 0.14, 0.3, 8), L(0x9aa3ad), 0, 2.75, 0);
    var fl = add(g, new T.ConeGeometry(0.28, 1.3, 10), new T.MeshBasicMaterial({ color: 0xffb020, transparent: true, opacity: 0.9 }), 0, 3.5, 0), fl2 = add(g, new T.ConeGeometry(0.14, 0.9, 8), new T.MeshBasicMaterial({ color: 0xfff7c2 }), 0, 3.3, 0); fl.visible = fl2.visible = false;
    g.userData = { env: env, fl: fl, fl2: fl2, k: 0 }; g.visible = false; API.scene.add(g); return g;
  }
  function sound(on) { try { if (!K) return; var a = K.ac(); if (!a) return; if (on && !hiss) { K.noise(0.01, 500, 500, 0.0001); var s = a.createBufferSource(); s.buffer = K._nb; s.loop = true; var f = a.createBiquadFilter(); f.type = 'lowpass'; f.frequency.value = 900; var gn = a.createGain(); gn.gain.value = 0; s.connect(f); f.connect(gn); gn.connect(a.destination); s.start(); hiss = { s: s, g: gn }; } if (hiss) hiss.g.gain.setTargetAtTime(on ? 0.22 : 0, a.currentTime, 0.08); } catch (e) {} }
  function setFly(on) {
    if (on === fly || !API) return; if (on && (hidden() || API.state.mode === 'tour')) return; fly = on; bal = bal || balloon();
    if (on) { API.player.fly = true; API.state.mode = 'fly'; API.toast('🎈 热气球升空！空格（或 🔥）点火上升 · C 下降 · WASD 飘行 · 再按 F 降落'); if (K) K.noise(1.2, 300, 1400, 0.2, 0.5); G().flown = 1; GM.save(); }
    else { landing = true; sound(false); API.toast('🎈 热气球正在降落…'); }
    if (!pad) { pad = document.createElement('div'); pad.style.cssText = 'position:absolute;right:18px;bottom:22px;display:none;flex-direction:column;gap:10px;pointer-events:auto'; pad.innerHTML = '<button type="button" data-k="up">🔥</button><button type="button" data-k="dn">⬇️</button><button type="button" data-k="land">🪂</button>'; (document.getElementById('gm') || document.body).appendChild(pad);
      [].forEach.call(pad.querySelectorAll('button'), function (b) { b.style.cssText = 'width:62px;height:62px;border-radius:50%;border:2px solid #fde047;background:rgba(10,14,26,.75);font-size:26px;cursor:pointer;touch-action:none'; var k = b.dataset.k; if (k === 'land') { b.onclick = function (e) { e.stopPropagation(); setFly(false); }; return; } b.addEventListener('pointerdown', function (e) { e.preventDefault(); e.stopPropagation(); hot[k] = true; }); ['pointerup', 'pointerleave', 'pointercancel'].forEach(function (ev) { b.addEventListener(ev, function () { hot[k] = false; }); }); }); }
    pad.style.display = on ? 'flex' : 'none';
  }
  function flyTick(dt) {
    if (!bal) return; var P = API.player, u = bal.userData, gy = API.groundY(P.pos.x, P.pos.z, 62);
    if (fly && (hidden() || API.state.mode === 'tour')) { fly = false; sound(false); if (pad) pad.style.display = 'none'; }
    var aloft = fly || (landing && API.state.mode === 'fly'); u.k += ((aloft ? 1 : 0) - u.k) * Math.min(1, dt * 1.6);   /* it stays full until the basket is on the ground */ bal.visible = u.k > 0.02 && !hidden(); if (!bal.visible) return;
    if (fly) { if (!P.fly || API.state.mode !== 'fly') { if (API.state.mode === 'walk') { fly = false; sound(false); if (pad) pad.style.display = 'none'; } else { P.fly = true; } }
      var up = !!(hot.up || keysDown.Space), dn = !!(hot.dn || keysDown.KeyC); burn += ((up ? 1 : 0) - burn) * Math.min(1, dt * 8); sound(up);
      if (hot.up) P.vel.y += (7 - P.vel.y) * Math.min(1, dt * 4); if (hot.dn) P.vel.y += (-6 - P.vel.y) * Math.min(1, dt * 4); if (!up && !dn) P.vel.y += (Math.sin(clock * 0.9) * 0.25 - 0.15 - P.vel.y) * Math.min(1, dt * 1.5);   /* it bobs, and sinks a little when the burner is off */
      var lim = 4.2; if (Math.hypot(P.vel.x, P.vel.z) > lim) { var q = lim / Math.hypot(P.vel.x, P.vel.z); P.vel.x *= q; P.vel.z *= q; }                                              /* a balloon drifts: no faster than a breeze */
      if (P.pos.y < gy + 0.4) { P.pos.y = gy + 0.4; if (P.vel.y < 0) P.vel.y = 0; } if (P.pos.y > 150) { P.pos.y = 150; if (P.vel.y > 0) P.vel.y = 0; } }
    else { burn = 0; if (landing && API.state.mode === 'fly') { P.vel.y = 0; P.pos.y = Math.max(gy, P.pos.y - 6 * dt); P.vel.x *= 0.9; P.vel.z *= 0.9; if (P.pos.y <= gy + 0.3) {   /* straight down, whatever the park's own flight would do */ P.fly = false; API.state.mode = 'walk'; landing = false; } } else landing = false; }
    bal.position.set(P.pos.x, P.pos.y - 0.12, P.pos.z); bal.rotation.y = Math.sin(clock * 0.3) * 0.3; bal.rotation.z = -P.vel.x * 0.018 + Math.sin(clock * 0.8) * 0.012; bal.rotation.x = P.vel.z * 0.018;
    u.env.scale.set(u.k, 0.25 + u.k * 0.75, u.k); u.env.position.y = 3.2 + u.k * 4.2; u.fl.visible = u.fl2.visible = burn > 0.08; u.fl.scale.set(1, burn * (0.8 + Math.random() * 0.5), 1); u.fl2.scale.y = burn;
    /* the friends ride in the basket */
    friends.forEach(function (f, i) { if (!fly || !f.on) return; var o = [[-0.55, -0.5], [0.55, -0.5], [0, 0.6]][i]; f.x = P.pos.x + o[0]; f.z = P.pos.z + o[1]; f.m.position.set(f.x, P.pos.y, f.z); f.m.rotation.y = P.yaw + Math.PI + (i - 1) * 0.5; f.m.visible = true; SV.animate(f.m, dt, 0); f.m.userData.rig.head.rotation.y = Math.sin(clock * 0.7 + i * 2) * 0.6; f.e.x = 1e6; });
  }
  var keysDown = {}; root.addEventListener('keydown', function (e) { keysDown[e.code] = true; }); root.addEventListener('keyup', function (e) { keysDown[e.code] = false; });
  function view() { tp = !tp; API.toast(tp ? '🎥 第三人称' : '👁 第一人称'); }
  if (root.TPParkAPI) attach(root.TPParkAPI); else root.addEventListener('tp:park-ready', function (e) { attach(e.detail || root.TPParkAPI); });
  root.TPGame2 = { fly: function (v) { setFly(v == null ? !fly : v); }, flying: function () { return fly; }, view: view, bag: function () { bag(); }, shop: function () { shop(); }, friends: friends, stars: stars, third: function () { return tp; } };
})(window);

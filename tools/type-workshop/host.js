/* Minest · Magic Type Workshop — the host side (tools/type-workshop/patch_type_workshop.py puts it in the pages).
   · The workshop itself is a page of its own (type3d/workshop.html) shown full screen in an iframe over Minest.
   · It asks Minest for its data over postMessage ({mtw:1, id, op, args} → {mtw:1, id, ok, result|error}):
       lists / createList → Minest's teacher word lists (MinestTeachingSets: column id = Source List ID, card id = Source Entry ID)
       items / saveItem / removeItem → one MinestKnowledge key per item, 'mtw:item:<id>' (My World's synced per-key store;
       a removed item stays as a tombstone {deleted:true} so another device's copy cannot bring it back)
       close → the overlay closes; you are where you were (the workshop room)
   · The way in: in the Santorini voxel town one house is the workshop ('mtw:entrance' {world, vox}; the first time, the
     white house nearest the arrival point). Its 🚪 door offers 🖋 Type Workshop: that house gets a workshop room (a
     typewriter desk, a lamp, an armchair) as its first room and you walk into it. Walk up to the typewriter →
     🖋 进入 Type Workshop; in the 2D room view, double-tap the typewriter. */
(function () {
  'use strict';
  if (window.MinestTypeWorkshop) return;
  var SITE = 'https://minest-app.vercel.app/', PAGE = 'type3d/workshop.html', VERSION = '0.1.0';
  var KN = function () { return window.MinestKnowledge || null; };
  var ov = null, frame = null, from = null;

  /* ---------------------------------------------------------------- the overlay */
  var css = document.createElement('style'); css.id = 'mn-mtw-style';
  css.textContent = [
    '.mn-mtw{position:fixed;inset:0;z-index:2147483565;background:#120c08}',
    '.mn-mtw[hidden]{display:none}',
    '.mn-mtw iframe{position:absolute;inset:0;width:100%;height:100%;border:0;display:block}',
    'html.mn-mtw-on #minest-mini-pet-p0{visibility:hidden!important}',
    '#oia-root .oial button.mtw{background:linear-gradient(180deg,#7a4a1f,#5a3414);border-color:#d8a467 #3b220c #3b220c #d8a467}',
    '#oia-root .oial button.mtw small{opacity:.9}',
    '.mn-mtw-chip{position:fixed;z-index:2147483301;left:50%;top:calc(12px + env(safe-area-inset-top));transform:translateX(-50%);display:flex;gap:8px;align-items:center;padding:8px 14px;border-radius:999px;',
    '  font:800 13px/1.2 system-ui;color:#fff;background:linear-gradient(180deg,rgba(122,74,31,.95),rgba(90,52,20,.95));border:1px solid #d8a467;box-shadow:0 6px 20px rgba(0,0,0,.35);cursor:pointer}',
    '.mn-mtw-chip[hidden]{display:none}',
  ].join('\n');
  document.head.appendChild(css);

  function src() { return /^https?:$/.test(location.protocol) ? new URL(PAGE, location.href).href : SITE + PAGE; }
  function open(opts) {
    opts = opts || {}; from = opts.from || null;
    if (!ov) {
      ov = document.createElement('div'); ov.className = 'mn-mtw'; ov.setAttribute('role', 'dialog'); ov.setAttribute('aria-label', 'Magic Type Workshop');
      frame = document.createElement('iframe'); frame.title = 'Magic Type Workshop'; frame.setAttribute('allow', 'autoplay; fullscreen');
      var q = []; if (opts.list) q.push('list=' + encodeURIComponent(opts.list)); if (opts.view) q.push('view=' + encodeURIComponent(opts.view));
      frame.src = src() + (q.length ? '?' + q.join('&') : '');
      ov.appendChild(frame); document.body.appendChild(ov);
      ['pointerdown', 'touchstart', 'wheel', 'keydown', 'click'].forEach(function (t) { ov.addEventListener(t, function (e) { e.stopPropagation(); }, { passive: true }); });
    }
    ov.hidden = false; document.documentElement.classList.add('mn-mtw-on');
    try { frame.focus(); } catch (e) {}
    try { if (window.MinestSfx) MinestSfx.play('door'); } catch (e) {}
  }
  function close() {
    if (!ov) return; document.documentElement.classList.remove('mn-mtw-on');
    try { frame.src = 'about:blank'; } catch (e) {}
    ov.remove(); ov = null; frame = null;
  }
  function isOpen() { return !!(ov && !ov.hidden); }

  /* ---------------------------------------------------------------- the data the workshop asks for */
  function teach() { var T = window.MinestTeachingSets; if (!T) throw new Error('词表功能不可用（MinestTeachingSets）'); return T; }
  function lists() {
    var b = teach().read();
    return (b.columns || []).map(function (c) { return { id: c.id, title: c.title || '词表', entries: (c.cards || []).map(function (k) { return { id: k.id, text: k.title || '' }; }).filter(function (e) { return e.text; }) }; });
  }
  function createList(title, words) {
    words = (words || []).map(function (w) { return String(w || '').trim(); }).filter(Boolean);
    if (!words.length) throw new Error('词表是空的');
    var T = teach(), before = {}; (T.read().columns || []).forEach(function (c) { before[c.id] = 1; });
    var r = T.create(String(title || '').trim() || 'Type Workshop', words.join('\n'));
    var id = (r && (r.listId || r.id)) || null;
    var all = lists(), L = all.filter(function (c) { return id ? c.id === id : !before[c.id]; })[0];
    if (!L) throw new Error('词表没有建成');
    return L;
  }
  var IK = 'mtw:item:';
  function items() {
    var K = KN(); if (!K) throw new Error('存储不可用（MinestKnowledge）');
    return K.keys(IK).map(function (k) { return K.get(k); }).filter(function (it) { return it && it.id && !it.deleted; })
      .sort(function (a, b) { return (a.made || 0) - (b.made || 0); });
  }
  function saveItem(it) {
    var K = KN(); if (!K) throw new Error('存储不可用（MinestKnowledge）');
    if (!it || !/^mtw_[\w-]{4,64}$/.test(String(it.id || ''))) throw new Error('作品记录无效');
    if (typeof it.word !== 'string' || !it.word.trim() || it.word.length > 64) throw new Error('作品文字无效');
    var rec = JSON.parse(JSON.stringify(it)); rec.updated = Date.now();
    K.set(IK + rec.id, rec);
    return rec;
  }
  function removeItem(id) { var K = KN(); if (!K) throw new Error('存储不可用'); K.set(IK + id, { id: id, deleted: true, updated: Date.now() }); return true; }
  /* ---- showing items outside the workshop: City Knowledge Run shop signs.
     An item with use 'displayed' and loc {kind:'city', shop:<shop id> | null} hangs as a neon sign over that knowledge
     shop (null → the first shop without one) every time the City opens. The record is the truth; the sign is redrawn. */
  var cityInst = null, citySigns = [];
  function cityItems() { try { return items().filter(function (it) { return it.use === 'displayed' && it.loc && it.loc.kind === 'city'; }); } catch (e) { return []; } }
  function hangCity(inst) {
    citySigns.forEach(function (off) { try { off(); } catch (e) {} }); citySigns = [];
    if (!inst || !inst.addSign || !window.MinestNeonWord || !window.THREE) return [];
    var slots = inst.signSlots(), taken = {}, out = [];
    cityItems().forEach(function (it) {
      var id = it.loc.shop && slots.some(function (s) { return s.id === it.loc.shop; }) && !taken[it.loc.shop] ? it.loc.shop
        : (slots.filter(function (s) { return !taken[s.id]; })[0] || {}).id;
      if (!id) return;
      var g = MinestNeonWord.build(THREE, it.word, { gas: it.look && it.look.gas, height: 1 });
      var off = inst.addSign(id, g); if (!off) return;
      taken[id] = 1; citySigns.push(off); out.push({ item: it.id, shop: id, word: it.word });
      (function spin() { if (!g.parent) return; g.userData.tick(performance.now() / 1000); requestAnimationFrame(spin); })();
    });
    return out;
  }
  function wrapCity() {
    var C = window.MinestCity; if (!C || C.__mtw) return; C.__mtw = 1;
    var o = C.open; C.open = function () { var inst = o.apply(this, arguments); cityInst = inst; try { hangCity(inst); } catch (e) { console.warn('[mtw] city signs', e); } return inst; };
  }
  wrapCity(); window.addEventListener('load', wrapCity);
  function cityShops() { return cityInst && cityInst.signSlots ? cityInst.signSlots() : null; }
  /* ---- the My World room (3D walk-in): items with loc {kind:'room', room:<room id> | 'mtw'} hang on the back wall of that
     room ('mtw' = the workshop room of whichever house holds it). Called by the walk-in while it builds a room. */
  function roomShow(T, S, r0, lb, at) {
    if (!r0 || !window.MinestNeonWord) return 0;
    var list = items().filter(function (it) { return it.use === 'displayed' && it.loc && it.loc.kind === 'room' && (it.loc.room === r0.id || (it.loc.room === 'mtw' && r0.mtw)); });
    if (!list.length) return 0;
    // one band above the doors (walls are 3.2 high, door signs reach ~2.5): back wall first, then the left and right walls
    var W = Math.max(2, lb.x1 - lb.x0), D = Math.max(2, lb.y1 - lb.y0), slots = [];
    var nb = Math.max(1, Math.floor(W / 2.4)), ns = Math.max(1, Math.floor(D / 2.4));
    for (var i = 0; i < nb; i++) slots.push({ x: lb.x0 + W / nb * (i + .5), z: lb.y0 + .08, ry: 0, cw: W / nb });
    for (i = 0; i < ns; i++) slots.push({ x: lb.x0 + .08, z: lb.y0 + D / ns * (i + .5), ry: Math.PI / 2, cw: D / ns });
    for (i = 0; i < ns; i++) slots.push({ x: lb.x1 - .08, z: lb.y0 + D / ns * (i + .5), ry: -Math.PI / 2, cw: D / ns });
    list.slice(0, slots.length).forEach(function (it, i) {
      var sl = slots[i], g = MinestNeonWord.build(T, it.word, { gas: it.look && it.look.gas, height: .4, light: list.length <= 4 });
      g.scale.setScalar(Math.min(1, (sl.cw * .86) / Math.max(.3, g.userData.w)));
      g.position.set(sl.x, 2.7, sl.z); g.rotation.y = sl.ry;
      S.add(g); (function spin() { if (!g.parent) return; g.userData.tick(performance.now() / 1000); requestAnimationFrame(spin); })();
    });
    return list.length;
  }
  function display(a) {   // {id, where:'city'|'room'|'shelf', shop?, room?} → the record changes; an open City is redrawn
    var it = items().filter(function (x) { return x.id === (a && a.id); })[0]; if (!it) throw new Error('找不到这件作品');
    if (a.where === 'city') { it.use = 'displayed'; it.loc = { kind: 'city', shop: a.shop || null }; }
    else if (a.where === 'room') { it.use = 'displayed'; it.loc = { kind: 'room', room: a.room || 'mtw' }; }
    else { it.use = 'stored'; it.loc = a.loc || { kind: 'shelf', shelf: 'main', slot: null }; }
    var rec = saveItem(it); if (cityInst) hangCity(cityInst); return rec;
  }
  var OPS = {
    hello: function () { var u = null; try { u = window.firebase && firebase.auth && firebase.auth().currentUser; } catch (e) {}
      /* honest: items go to MinestKnowledge, which pushes to the cloud only when signed in; that it ARRIVED is not known here */
      return { host: 'minest', version: VERSION, store: 'MinestKnowledge', signedIn: !!u, cloudConfirmed: false }; },
    lists: lists, createList: createList, items: items, saveItem: saveItem, removeItem: removeItem,
    display: display, cityShops: cityShops,
  };
  window.addEventListener('message', function (e) {
    var d = e.data; if (!d || d.mtw !== 1 || !frame || e.source !== frame.contentWindow) return;
    if (d.op === 'close') return close();
    var f = OPS[d.op], reply = function (m) { try { e.source.postMessage(Object.assign({ mtw: 1, id: d.id }, m), '*'); } catch (x) {} };
    if (!f) return reply({ ok: false, error: 'unknown op ' + d.op });
    try { reply({ ok: true, result: f.apply(null, d.args || []) }); } catch (err) { reply({ ok: false, error: String((err && err.message) || err) }); }
  });

  /* ---------------------------------------------------------------- the house in Santorini */
  function MD() { return window.MinestDisplay || null; }
  function islandBid() { try { var p = window.MinestUniverse && MinestUniverse.path && MinestUniverse.path(); var w = p && p.filter(function (x) { return x.bid; }).pop(); if (w) return w.bid; } catch (e) {} return null; }
  function entrance() {
    var K = KN(), bid = islandBid(), e = K && K.get('mtw:entrance');
    if (e && e.vox && (!bid || e.world === bid)) return e;
    var W = window.MinestOia && MinestOia.world && MinestOia.world(), S = window.__santorini;
    if (!W || !W.buildings) return e || null;
    var P = (S && S.player && S.player.pos) || { x: 150, z: 100 }, best = null, bd = 1e9;
    W.buildings.forEach(function (b) { if (b.kind !== 'house') return; var d = Math.hypot((b.x0 + b.x1) / 2 - P.x, (b.z0 + b.z1) / 2 - P.z); if (d < bd) { bd = d; best = b; } });
    if (!best) return null;
    e = { world: bid, vox: best.id, at: { x: best.x0, y: best.y, z: best.z0 }, t: Date.now() };
    try { K && K.set('mtw:entrance', e); } catch (x) {}
    return e;
  }
  var WROOM = 'Type Workshop · 文字工坊';
  function uid(p) { return p + Date.now().toString(36) + Math.random().toString(36).slice(2, 7); }
  function ensureRoom(vox) {   // the workshop room, first in the house: a typewriter desk, a lamp, an armchair
    var md = MD(); if (!md || !md.mtwEdit) return false;
    var done = false;
    md.mtwEdit(function (d) {
      var p = (d.pc || []).filter(function (q) { return q.vox === vox; })[0]; if (!p) return;
      p.rooms = p.rooms || [];
      var r = p.rooms.filter(function (x) { return x.mtw; })[0];
      if (!r) {
        r = { id: uid('r'), k: 'study', n: WROOM, mtw: 1, seeded: 1, d: { pc: [] } };
        p.rooms.unshift(r);
      } else if (p.rooms[0] !== r) { p.rooms.splice(p.rooms.indexOf(r), 1); p.rooms.unshift(r); }
      r.d = r.d || {}; r.d.pc = r.d.pc || [];
      var has = function (k) { return r.d.pc.some(function (q) { return q.k === k; }); };
      if (!has('f_typewriter')) r.d.pc.push({ id: uid('p'), k: 'f_typewriter', x: 3, y: 2, s: 1, f: 0, it: [], label: '🖋 Typewriter' });
      if (!has('f_lamp')) r.d.pc.push({ id: uid('p'), k: 'f_lamp', x: 5.2, y: 1.2, s: 1, f: 0, it: [], label: '' });
      if (!has('f_armchair')) r.d.pc.push({ id: uid('p'), k: 'f_armchair', x: 1, y: 4.5, s: 1, f: 0, it: [], label: '' });
      if (!has('f_fireplace')) r.d.pc.push({ id: uid('p'), k: 'f_fireplace', x: 1, y: 0.4, s: 1, f: 0, it: [], label: '' });
      done = true;
    });
    return done;
  }
  // the 🚪 chooser of that house offers the workshop
  function decorate(c) {
    if (!c || c.hidden || c.querySelector('[data-mtw]')) return;
    var e = entrance(), bid = c.getAttribute('data-bid'); if (!e || bid !== e.vox) return;
    var b = document.createElement('button'); b.type = 'button'; b.className = 'mtw go'; b.setAttribute('data-mtw', '1');
    b.innerHTML = '🖋 魔法文字工坊 · Type Workshop<small>走进工坊房间 · 走到打字机前点它，进入 Type Workshop：词表 → 霓虹灯管字 → 装箱入库</small>';
    var first = c.querySelector('button'); c.insertBefore(b, first);
    b.addEventListener('click', function (ev) {
      ev.stopPropagation();
      if (!ensureRoom(bid)) { var w = c.querySelector('[data-oial="walk"]'); if (w) w.click(); setTimeout(function () { ensureRoom(bid); }, 1500); return; }
      var walk = c.querySelector('[data-oial="walk"]'); if (walk) walk.click();
      setTimeout(function () { toast('🖋 走到打字机前，点「进入 Type Workshop」'); }, 1600);
    }, true);
  }
  function toast(t) { try { if (window.toast) window.toast(t); } catch (e) {} }
  new MutationObserver(function () { var c = document.querySelector('#oia-root .oial'); if (c && !c.hidden) decorate(c); })
    .observe(document.documentElement, { subtree: true, childList: true, attributes: true, attributeFilter: ['hidden'] });
  // a chip in Santorini: straight to the workshop's door
  var chip = null;
  function drawChip() {
    var on = !!(window.MinestOia && MinestOia.isOpen && MinestOia.isOpen()) && !isOpen() && !(document.querySelector('#oia-root .oial') && !document.querySelector('#oia-root .oial').hidden);
    if (!on) { if (chip) chip.hidden = true; return; }
    if (!chip) {
      chip = document.createElement('button'); chip.type = 'button'; chip.className = 'mn-mtw-chip'; chip.textContent = '🖋 Type Workshop · 文字工坊';
      chip.addEventListener('click', function (ev) { ev.stopPropagation(); var e = entrance(); if (!e) return toast('先打开圣托里尼小镇');
        try { MinestOiaLink.choose(e.vox, e.at); } catch (x) { toast('工坊的门暂时打不开'); } });
      var root = document.getElementById('oia-root'); (root || document.body).appendChild(chip);
    }
    chip.hidden = false;
  }
  setInterval(drawChip, 700);
  // the 2D room view: a double-tap on the typewriter
  var last = 0;
  document.addEventListener('dblclick', function (e) {
    var el = e.target && e.target.closest && e.target.closest('.mn-dsp-scene [data-pc]'); if (!el) return;
    var md = MD(), d = md && md.state && md.state(); if (!d || d.scene !== 'room') return;
    var p = (d.pc || []).filter(function (q) { return q.id === el.getAttribute('data-pc'); })[0];
    if (p && p.k === 'f_typewriter' && Date.now() - last > 800) { last = Date.now(); e.preventDefault(); e.stopPropagation(); open({ from: 'room' }); }
  }, true);

  window.MinestTypeWorkshop = { open: open, close: close, isOpen: isOpen, entrance: entrance, ensureRoom: ensureRoom, version: VERSION,
    hangCity: function () { return hangCity(cityInst); }, roomShow: roomShow, _ops: OPS };
})();

/* Minest · 全息操作台 2.0 · 资源库 MEDIA LIBRARY — a mode that projects the island's media library (../media/library.js,
   window.PIMedia: the thinking-model GIFs, the model collection, the word-root GIFs, the EC-6 unit charts…) as a curved
   holographic gallery over the console. The pictures are real <img> elements on a CSS 3D cylinder, so GIFs play as they
   are; only the tiles facing you carry a src. Drag or scroll to turn it, pick a set and a category in the tool row, tap a
   tile to see it large with its name, line and credit. ?mode=media&set=<id>&focus=<item id> opens on one picture.
   Registered with HL.register before HL.start(), like Obsidian. */
(function () {
  'use strict';
  var HL = window.HL, LIB = window.PIMedia; if (!HL || !HL.register || !LIB) return;
  var BASE = '../', PAGE = 40, Q = new URLSearchParams(location.search);
  var M = { id: 'media', zh: '资源库', en: 'MEDIA LIBRARY', wrap: null, set: Q.get('set') || 'thinking', group: '', page: 0, rot: 0, vel: 0, spin: true, list: [], tiles: [] };
  if (!LIB.sets.some(function (s) { return s.id === M.set; })) M.set = LIB.sets[0].id;
  var KEY = 'minest.holoLab2.media'; try { var sv = JSON.parse(localStorage.getItem(KEY) || 'null'); if (sv && !Q.get('set')) { if (sv.set && LIB.sets.some(function (s) { return s.id === sv.set; })) M.set = sv.set; M.spin = sv.spin !== false; } } catch (e) {}
  function save() { try { localStorage.setItem(KEY, JSON.stringify({ set: M.set, spin: M.spin })); } catch (e) {} }
  function esc(s) { return String(s == null ? '' : s).replace(/[&<>"]/g, function (c) { return { '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;' }[c]; }); }
  function style() {
    if (document.getElementById('medCss')) return;
    var st = document.createElement('style'); st.id = 'medCss';
    st.textContent =
      '#medWrap{position:fixed;z-index:3;left:calc(env(safe-area-inset-left) + 8px);right:calc(env(safe-area-inset-right) + 8px);top:calc(env(safe-area-inset-top) + 52px);bottom:calc(env(safe-area-inset-bottom) + 120px);perspective:1100px;cursor:grab;touch-action:none;overflow:hidden}' +
      '#medWrap:active{cursor:grabbing}#medRing{position:absolute;left:50%;top:50%;width:0;height:0;transform-style:preserve-3d}' +
      '.medT{position:absolute;left:0;top:0;border-radius:10px;overflow:hidden;background:rgba(6,40,56,.35);border:1px solid rgba(120,230,255,.55);box-shadow:0 0 18px rgba(80,210,255,.35),inset 0 0 12px rgba(80,210,255,.2);backface-visibility:hidden;-webkit-backface-visibility:hidden;cursor:pointer;transition:box-shadow .2s,border-color .2s}' +
      '.medT img{display:block;width:100%;height:calc(100% - 30px);object-fit:contain;background:#f6f4ee;opacity:.94;filter:saturate(.9) contrast(1.02);pointer-events:none}' +
      '.medT::after{content:"";position:absolute;inset:0;background:repeating-linear-gradient(0deg,rgba(120,230,255,.07) 0 1px,transparent 1px 3px);pointer-events:none}' +
      '.medT b{display:block;height:30px;line-height:30px;padding:0 9px;font:600 12px/30px "PingFang SC",system-ui,sans-serif;color:#dff8ff;white-space:nowrap;overflow:hidden;text-overflow:ellipsis;background:rgba(4,22,32,.85)}' +
      '.medT:hover{border-color:#ffe7a3;box-shadow:0 0 26px rgba(255,214,120,.55)}' +
      '#medInfo{position:fixed;z-index:6;left:50%;top:50%;transform:translate(-50%,-50%);width:min(680px,92vw);max-height:84vh;overflow:auto;display:none;padding:14px;border-radius:14px;background:rgba(4,18,28,.92);border:1px solid rgba(120,230,255,.6);box-shadow:0 0 50px rgba(80,210,255,.35);color:#e6f9ff;font:14px/1.6 "PingFang SC",system-ui,sans-serif}' +
      '#medInfo.on{display:block}#medInfo img{display:block;width:100%;border-radius:8px;background:#f6f4ee}#medInfo h3{margin:10px 0 2px;font-size:20px}#medInfo .z{color:#9fe8ff}#medInfo p{margin:6px 0}#medInfo small{color:#8fb8c8}' +
      '#medInfo .r{display:flex;gap:8px;margin-top:10px;flex-wrap:wrap}#medInfo button{font:inherit;font-size:13px;padding:6px 14px;border-radius:999px;border:1px solid rgba(120,230,255,.6);background:rgba(120,230,255,.1);color:#e6f9ff;cursor:pointer}' +
      '#medCount{position:fixed;z-index:4;left:50%;transform:translateX(-50%);top:calc(env(safe-area-inset-top) + 56px);font:600 12px system-ui;letter-spacing:.12em;color:#9fe8ff;text-shadow:0 0 8px rgba(80,210,255,.8);pointer-events:none}';
    document.head.appendChild(st);
  }
  function title(on) { var e = document.getElementById('v2Title'); if (!e) return; if (!M.t0) M.t0 = e.textContent; e.textContent = on ? '全息操作台 2.0 · 资源库' : M.t0; }
  function pool() { return LIB.set(M.set).filter(function (it) { return !M.group || it.group === M.group; }); }
  function build() {
    var all = pool(), pages = Math.max(1, Math.ceil(all.length / PAGE)); if (M.page >= pages) M.page = 0;
    M.list = all.slice(M.page * PAGE, M.page * PAGE + PAGE);
    var ring = M.wrap.querySelector('#medRing'); ring.innerHTML = ''; M.tiles = [];
    var n = Math.max(M.list.length, 10), rows = n > 24 ? 2 : 1, per = Math.ceil(n / rows), H = M.wrap.clientHeight || 500, W = Math.min(260, Math.max(150, (H - 40) / rows * 0.95 * 16 / 11)), TH = W * 9 / 16 + 30, R = Math.max(380, per * (W + 18) / (2 * Math.PI));
    M.R = R;
    M.list.forEach(function (it, i) {
      var r = Math.floor(i / per), k = i % per, a = k / per * Math.PI * 2, y = rows === 1 ? 0 : (r - (rows - 1) / 2) * (TH + 16);
      var d = document.createElement('div'); d.className = 'medT'; d.style.width = W + 'px'; d.style.height = TH + 'px'; d.style.marginLeft = (-W / 2) + 'px'; d.style.marginTop = (-TH / 2 + y) + 'px';
      d.style.transform = 'rotateY(' + a + 'rad) translateZ(' + R + 'px)'; d.innerHTML = '<img alt=""><b>' + esc(it.zh || it.title) + (it.zh && it.title !== it.zh ? ' · ' + esc(it.title) : '') + '</b>';
      d.addEventListener('click', function () { if (!M.moved) info(it); }); ring.appendChild(d); M.tiles.push({ d: d, img: d.firstChild, it: it, a: a, on: false });
    });
    var cnt = document.getElementById('medCount'); if (cnt) cnt.textContent = (LIB.sets.filter(function (s) { return s.id === M.set; })[0] || {}).name + (M.group ? ' · ' + M.group : '') + ' · ' + all.length + ' 张' + (pages > 1 ? ' · 第 ' + (M.page + 1) + ' / ' + pages + ' 组' : '');
    load(true);
  }
  function load(force) { M.tiles.forEach(function (t) { var z = Math.cos(t.a + M.rot); if (z > -0.15 && !t.on) { t.img.src = LIB.url(t.it, BASE); t.on = true; } else if (z < -0.55 && t.on && t.it.kind === 'gif') { t.img.removeAttribute('src'); t.on = false; } }); }
  function info(it) {
    var b = document.getElementById('medInfo'); if (!b) { b = document.createElement('div'); b.id = 'medInfo'; document.body.appendChild(b); b.addEventListener('pointerdown', function (e) { e.stopPropagation(); }); }
    var set = LIB.sets.filter(function (s) { return s.id === it.set; })[0] || {};
    b.innerHTML = '<img alt="" src="' + esc(LIB.url(it, BASE)) + '"><h3>' + esc(it.zh || it.title) + '</h3><div class="z">' + esc(it.title) + ' · ' + esc(set.name || '') + ' · ' + esc(it.group) + '</div>' + (it.line ? '<p>' + esc(it.line) + '</p>' : '') + (it.credit ? '<small>' + esc(it.credit) + '</small>' : '') +
      '<div class="r"><button data-a="say">🔊 朗读</button><button data-a="x">合上</button></div>';
    b.classList.add('on');
    b.querySelector('[data-a="x"]').onclick = function () { b.classList.remove('on'); };
    b.querySelector('[data-a="say"]').onclick = function () { try { speechSynthesis.cancel(); var u = new SpeechSynthesisUtterance(it.title); u.lang = 'en-US'; speechSynthesis.speak(u); } catch (e) {} };
    if (HL.EMBED && HL.post) HL.post({ holo: 1, op: 'mediaSeen', id: it.id, title: it.zh || it.title, set: set.name || '' });
  }
  function show() {
    if (M.wrap) return;
    var w = M.wrap = document.createElement('div'); w.id = 'medWrap'; w.innerHTML = '<div id="medRing"></div>'; document.body.appendChild(w);
    var c = document.createElement('div'); c.id = 'medCount'; document.body.appendChild(c);
    var drag = null;
    w.addEventListener('pointerdown', function (e) { e.stopPropagation(); drag = { x: e.clientX, r: M.rot }; M.moved = false; M.vel = 0; });
    window.addEventListener('pointermove', M.onMove = function (e) { if (!drag) return; var dx = e.clientX - drag.x; if (Math.abs(dx) > 4) M.moved = true; var r = drag.r + dx / (M.R || 500); M.vel = r - M.rot; M.rot = r; });
    window.addEventListener('pointerup', M.onUp = function () { drag = null; });
    w.addEventListener('wheel', function (e) { e.preventDefault(); e.stopPropagation(); M.rot += (e.deltaX || e.deltaY) * 0.002; }, { passive: false });
    build();
    var f = Q.get('focus'); if (f) { var it = LIB.byId(f); if (it) { if (it.set !== M.set) { M.set = it.set; M.group = ''; build(); } setTimeout(function () { info(it); }, 300); } }
  }
  M.enter = function () { style(); title(true); HL.empty(''); show(); };
  M.exit = function () { title(false); if (M.wrap) M.wrap.remove(); M.wrap = null; ['medCount', 'medInfo'].forEach(function (id) { var e = document.getElementById(id); if (e) e.remove(); });
    if (M.onMove) window.removeEventListener('pointermove', M.onMove); if (M.onUp) window.removeEventListener('pointerup', M.onUp); M.tiles = []; HL.home(); };
  M.onContent = function () {};
  M.update = function (dt) {
    if (!M.wrap) return; if (M.spin && Math.abs(M.vel) < 1e-4) M.rot -= dt * 0.06; M.vel *= 0.9;
    var ring = M.wrap.querySelector('#medRing'); ring.style.transform = 'translateZ(' + (-(M.R || 500)) + 'px) rotateY(' + M.rot + 'rad)';
    M.lt = (M.lt || 0) + dt; if (M.lt > 0.3) { M.lt = 0; load(); }
  };
  M.tools = function (box) {
    LIB.sets.forEach(function (s) { HL.ui.chip(box, s.name, M.set === s.id && !M.group, function () { M.set = s.id; M.group = ''; M.page = 0; save(); build(); HL.refreshTools(); }, s.note); });
    var gs = (LIB.sets.filter(function (s) { return s.id === M.set; })[0] || {}).groups || [];
    if (gs.length > 1) { HL.ui.sep(box); gs.forEach(function (g) { HL.ui.chip(box, g, M.group === g, function () { M.group = M.group === g ? '' : g; M.page = 0; build(); HL.refreshTools(); }); }); }
    HL.ui.sep(box);
    if (pool().length > PAGE) HL.ui.chip(box, '下一组 ▸', false, function () { M.page++; build(); HL.refreshTools(); }, '每次投影 ' + PAGE + ' 张');
    HL.ui.chip(box, '自转', M.spin, function () { M.spin = !M.spin; save(); HL.refreshTools(); }, '画廊缓慢自转');
  };
  HL.media = M;
  HL.register(M);
})();

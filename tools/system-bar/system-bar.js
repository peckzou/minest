/* Minest · System buttons (2026-11-19; moved into the Dock the same day after the user's marked-up screenshot).
   The Dock is one capsule: the four system buttons at its head, a hairline, then the tools of the screen in use.
     1 ✕ close  — the Dock's own close (the module / panel on top closes); in the room: back to the full Minest
     2 ‹ back   — the Dock's own back (Escape, then the page's history, then close)
     3 ⛶ full   — reading mode: the Dock, every tool button on the page and inside its open frames are hidden; one
                  "exit full screen" button stays, bottom-left. Esc also leaves. Native full screen where allowed.
     4 = tools  — Apple's two-bar "=": folds the tools away, the bars turning into "||"; again, and they come back.
   The tools follow the screen: on the board the Dock's apps; in Spatial Home the room's own tools (Explore / Desk,
   backpack, places, window view, sit, first / third person, settings — the room's pixel icons, each pressing the
   room's button, whose own top bar then gives way) and "Dock", which brings every Minest entry in. In Spatial Home
   and My World the whole Dock takes the room's Minecraft look (square bevelled slots, green for the one in use). Outside reading mode the Dock no longer slides away when idle (it holds the system keys).
   window.MinestSystemBar = { reading(on), tools(on), state() }. */
(function () {
  'use strict';
  if (window.MinestSystemBar) return;
  var R = document.documentElement, KEY = 'mn_sys_tools_v1', reading = false, nativeFull = false, lastFocus = null, ctx = 'board';
  function svg(p) { return '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.1" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true">' + p + '</svg>'; }
  var ICON = {
    close: '<path d="M6 6l12 12M18 6L6 18"/>', back: '<path d="M15 5l-7 7 7 7"/>',
    full: '<path d="M8 3H3v5M16 3h5v5M3 16v5h5M21 16v5h-5"/>', exit: '<path d="M3 8h5V3M16 3v5h5M8 21v-5H3M21 16h-5v5"/>',
    walk: '<circle cx="13" cy="4.5" r="1.8"/><path d="M10 21l2-6-2.5-2.5L11 8l3 3 3 1M12 15l3 2 1 4M11 8l-3 2-1 3"/>',
    desk: '<path d="M3 10h18M5 10v9M19 10v9M5 14h14M9 6h6v4H9z"/>',
    pack: '<path d="M8 6V5a4 4 0 0 1 8 0v1"/><rect x="5" y="6" width="14" height="15" rx="4"/><path d="M9 12h6v4H9z"/>',
    env: '<circle cx="12" cy="12" r="9"/><path d="M3 12h18M12 3c3 3.5 3 14.5 0 18M12 3c-3 3.5-3 14.5 0 18"/>',
    views: '<rect x="4" y="3" width="16" height="18" rx="2"/><path d="M12 3v18M4 12h16"/>',
    sit: '<path d="M7 3v10h10M7 13v8M17 13v8M17 9V3"/>',
    view: '<circle cx="12" cy="8" r="4"/><path d="M4 21c1.5-4 4.5-6 8-6s6.5 2 8 6"/>',
    set: '<circle cx="12" cy="12" r="3"/><path d="M19.4 15a1.7 1.7 0 0 0 .3 1.8l.1.1a2 2 0 1 1-2.8 2.8l-.1-.1a1.7 1.7 0 0 0-2.9 1.2V21a2 2 0 1 1-4 0v-.1a1.7 1.7 0 0 0-2.9-1.2l-.1.1a2 2 0 1 1-2.8-2.8l.1-.1A1.7 1.7 0 0 0 3.1 14H3a2 2 0 1 1 0-4h.1a1.7 1.7 0 0 0 1.2-2.9l-.1-.1a2 2 0 1 1 2.8-2.8l.1.1A1.7 1.7 0 0 0 10 3.1V3a2 2 0 1 1 4 0v.1a1.7 1.7 0 0 0 2.9 1.2l.1-.1a2 2 0 1 1 2.8 2.8l-.1.1A1.7 1.7 0 0 0 20.9 10H21a2 2 0 1 1 0 4h-.1a1.7 1.7 0 0 0-1.5 1z"/>'
  };
  function haptic() { try { if (window.MinestNative && MinestNative.haptic) MinestNative.haptic('light'); } catch (e) {} }
  function key(cls, label, inner, fn) {
    var b = document.createElement('button'); b.type = 'button'; b.className = 'mn-bapp mn-sys-key ' + cls;
    b.setAttribute('aria-label', label); b.title = label; b.innerHTML = inner;
    b.setAttribute('data-spatial-home-dock', '');   // not an app: the room must not leave for the Minest page when it is pressed
    b.addEventListener('click', function (e) { e.stopPropagation(); e.preventDefault(); haptic(); fn(b); }, true);
    return b;
  }
  /* the room (Spatial Home) is the screen in use: open, and not showing a Minest feature over it */
  function inRoom() {
    try { var H = window.MinestSpatialHome; if (!H || !H.isOpen || !H.isOpen()) return false; var st = H.api && H.api().state(); return !(st && st.inFeature); } catch (e) { return false; }
  }
  function press(id) { var b = document.getElementById(id); if (b) { b.click(); return true; } return false; }
  /* 1, 2 */
  function dockKey(sel) { var b = document.querySelector('.mn-bdock ' + sel); if (b) { b.click(); return true; } return false; }
  function esc() { return document.dispatchEvent(new KeyboardEvent('keydown', { key: 'Escape', code: 'Escape', keyCode: 27, bubbles: true, cancelable: true })); }
  function close() { if (ctx === 'room' && press('sh-exitBtn')) return; if (!dockKey('.mn-sys-exit')) esc(); }
  function back() { if (ctx === 'room') { if (esc() && !press('sh-exitBtn')) {} return; } if (!dockKey('.mn-sys-back') && esc() && location.hash.length > 1) history.back(); }
  /* 3: reading mode, here and in every open frame of the same site */
  var HIDE = 'button,[role="button"],[role="toolbar"],header.iphone-topbar,.ios-bottom-tab-bar,.mn-bdock,#minest-mini-pet-p0,#cs-btn,' +
    '#sh-top,#sh-labels,#sh-stick,#sh-hint,#sh-credit,#sh-pill,#sh-reading-enter,#sh-dock,#sh-settings,#sh-pack,#sh-edit,#sh-card,#sh-toast,#sh-skip,.clun-entry,.mn-start-control';
  var FRAME_CSS = HIDE.split(',').map(function (s) { return 'html.mn-sys-reading ' + s; }).join(',') + '{visibility:hidden!important;pointer-events:none!important}' +
    'html.mn-sys-reading body .mn-bdock.mn-bdock{display:none!important}#mn-start-full,#sh-reading-enter{display:none!important}';
  function frames(doc, out) {
    out = out || [];
    try { [].forEach.call(doc.querySelectorAll('iframe'), function (f) { try { var d = f.contentDocument; if (d && d.documentElement) { out.push(d); frames(d, out); } } catch (e) {} }); } catch (e) {}
    return out;
  }
  function syncFrames() {
    frames(document).forEach(function (d) {
      try {
        if (!d.getElementById('mn-sys-frame-css')) { var s = d.createElement('style'); s.id = 'mn-sys-frame-css'; s.textContent = FRAME_CSS; (d.head || d.documentElement).appendChild(s); }
        d.documentElement.classList.toggle('mn-sys-reading', reading);
        if (!d.__mnSysKeys) { d.__mnSysKeys = 1; d.addEventListener('keydown', onKey, true); }
      } catch (e) {}
    });
  }
  function setReading(on) {
    on = !!on; if (on === reading) return;
    reading = on; R.classList.toggle('mn-sys-reading', on); syncFrames();
    try { if (window.SpatialBridge && SpatialBridge.setReading) SpatialBridge.setReading(false); } catch (e) {}
    try { if (window.MinestStartControls && MinestStartControls.setReading) MinestStartControls.setReading(false); } catch (e) {}
    if (on) {
      lastFocus = document.activeElement; exitKey.focus({ preventScroll: true });
      if (!document.fullscreenElement && R.requestFullscreen) {
        try { var p = R.requestFullscreen(); if (p && p.then) p.then(function () { nativeFull = true; if (!reading && document.exitFullscreen) document.exitFullscreen().catch(function () {}); }).catch(function () {}); } catch (e) {}
      }
    } else {
      if (nativeFull && document.fullscreenElement && document.exitFullscreen) { try { document.exitFullscreen().catch(function () {}); } catch (e) {} }
      nativeFull = false;
      if (lastFocus && lastFocus.isConnected) try { lastFocus.focus({ preventScroll: true }); } catch (e) {}
    }
    try { window.dispatchEvent(new CustomEvent('minest:reading', { detail: { on: on } })); } catch (e) {}
  }
  function onKey(e) { if (reading && e.key === 'Escape') { e.preventDefault(); e.stopPropagation(); setReading(false); } }
  /* 4: "=" folds the tools away, turning into "||" */
  function toolsOn() { try { return localStorage.getItem(KEY) !== '0'; } catch (e) { return true; } }
  function setTools(on) {
    R.classList.toggle('mn-sys-tools-off', !on);
    try { localStorage.setItem(KEY, on ? '1' : '0'); } catch (e) {}
    var l = on ? '收起工具' : '展开工具'; toolsKey.setAttribute('aria-label', l); toolsKey.title = l; toolsKey.setAttribute('aria-expanded', on ? 'true' : 'false');
  }

  var sysKeys = [
    key('mn-sk-close', '系统 · 关闭', svg(ICON.close), close),   // (not "Close ·": the Dock's own close looks for those)
    key('mn-sk-back', '系统 · 返回', svg(ICON.back), back),
    key('mn-sk-full', '全屏 · 阅览模式', svg(ICON.full), function () { setReading(true); })
  ];
  var toolsKey = key('mn-sk-tools', '收起工具', '<span class="mn-eq" aria-hidden="true"><i></i><i></i></span>', function () { setTools(R.classList.contains('mn-sys-tools-off')); });
  sysKeys.push(toolsKey);
  var sep = document.createElement('span'); sep.className = 'mn-sys-sep'; sep.setAttribute('aria-hidden', 'true');
  var exitKey = document.createElement('button'); exitKey.type = 'button'; exitKey.id = 'mn-sys-exit'; exitKey.setAttribute('aria-label', '退出全屏'); exitKey.title = '退出全屏';
  exitKey.innerHTML = svg(ICON.exit); exitKey.addEventListener('click', function (e) { e.stopPropagation(); haptic(); setReading(false); });

  /* the room's tools, in the Dock while the room is the screen */
  function deskMode() { var d = document.querySelector('#sh-modeSeg [data-mode="desk"]'); return !!(d && d.classList.contains('on')); }
  var ROOM = [
    ['mode', 'Explore · Desk', function () { return deskMode() ? ICON.desk : ICON.walk; },
      function () { var s = document.querySelectorAll('#sh-modeSeg [data-mode]'); for (var i = 0; i < s.length; i++) if (!s[i].classList.contains('on')) { s[i].click(); return; } }],
    ['pack', '背包 · 布置', ICON.pack, 'sh-packBtn'], ['env', '切换环境', ICON.env, 'sh-envBtn'], ['views', '窗外风景', ICON.views, 'sh-viewsBtn'],
    ['sit', '坐下 · 起立', ICON.sit, 'sh-sitBtn'], ['view', '第一 · 第三人称', ICON.view, 'sh-viewBtn'], ['set', '设置', ICON.set, 'sh-setBtn']
  ];
  var roomKeys = ROOM.map(function (q) {
    var b = key('mn-ctx-key mn-ctx-' + q[0], q[1], svg(typeof q[2] === 'function' ? q[2]() : q[2]), function () {
      if (typeof q[3] === 'function') q[3](); else press(q[3]);
      if (typeof q[2] === 'function') setTimeout(function () { modeLabel(b); }, 150);
    });
    b.classList.remove('mn-sys-key'); b.dataset.ctx = 'room'; return b;
  });
  /* the mode key shows the mode the room is in (its icon, and its name in the lens) */
  function modeLabel(b) { var desk = deskMode(), l = desk ? 'Desk · 办公桌前' : 'Explore · 行走探索'; if (b.dataset.desk === String(desk)) return; b.dataset.desk = String(desk); b.innerHTML = svg(desk ? ICON.desk : ICON.walk); b.setAttribute('aria-label', l); b.title = l; }
  /* the room's own pixel icons, once the room has drawn them */
  function pixelIcons() {
    ROOM.forEach(function (q, i) { if (typeof q[3] !== 'string') return; var o = document.getElementById(q[3]), b = roomKeys[i]; if (o && b.dataset.px !== '1' && o.querySelector('svg')) { b.innerHTML = o.innerHTML; b.dataset.px = '1'; } });
  }
  /* "Dock": every entry of the Minest Dock, from inside the room (again: back to the room's tools) */
  var dockAll = key('mn-ctx-key mn-ctx-dock', 'Dock · 全部入口', svg('<rect x="4" y="4" width="6" height="6"/><rect x="14" y="4" width="6" height="6"/><rect x="4" y="14" width="6" height="6"/><rect x="14" y="14" width="6" height="6"/>'),
    function () { var on = !R.classList.contains('mn-ctx-apps'); R.classList.toggle('mn-ctx-apps', on); dockAll.setAttribute('aria-pressed', on ? 'true' : 'false'); });
  dockAll.classList.remove('mn-sys-key'); dockAll.dataset.ctx = 'room'; dockAll.setAttribute('aria-pressed', 'false'); roomKeys.push(dockAll);
  function inWorld() { try { return !!(window.MinestMyWorld && MinestMyWorld.isOpen && MinestMyWorld.isOpen()); } catch (e) { return false; } }

  function dock() { return document.querySelector('.mn-bdock'); }
  function mount() {
    var d = dock(); if (!d) return;
    var at = d.firstElementChild, i;
    for (i = 0; i < sysKeys.length; i++) { if (at !== sysKeys[i]) d.insertBefore(sysKeys[i], at); at = sysKeys[i].nextElementSibling; }
    if (at !== sep) d.insertBefore(sep, at);
    var anchor = sep.nextElementSibling;
    roomKeys.forEach(function (b) { if (b.parentNode !== d) d.insertBefore(b, anchor); });
    if (!exitKey.isConnected && document.body) document.body.appendChild(exitKey);
    R.classList.add('mn-sysbar');
  }
  /* the Dock's shape on screen: standing (right) or lying (top / bottom, and the opening's own row) — and every key
     sized so the whole Dock fits the screen */
  function fit() {
    var d = dock(); if (!d) return;
    var cs = getComputedStyle(d), h = /^row/.test(cs.flexDirection);
    R.classList.toggle('mn-dock-h', h); R.classList.toggle('mn-dock-v', !h);
    var mc = ctx === 'room' || ctx === 'world', keys = 0, seps = 0;
    [].forEach.call(d.children, function (c) { if (getComputedStyle(c).display === 'none') return; if (c.classList.contains('mn-sys-sep')) seps++; else keys++; });
    var lens = mc ? 0 : (h ? 1.6 : 1.35), room = (h ? innerWidth : innerHeight) - 28 - (h ? 0 : 20);
    var k = Math.floor((room - 10 - seps * 10 - Math.max(0, keys - 1) * 4) / (keys + lens));
    k = Math.max(22, Math.min(mc ? 38 : 40, k));
    if (R.style.getPropertyValue('--mn-key') !== k + 'px') R.style.setProperty('--mn-key', k + 'px');
  }
  /* where the Dock may sit: Right, Top or Bottom (not the left) — Top is the bottom row moved up under the title bar */
  var TOP = 'mn_dock_top_v1';
  function isTop() { try { return localStorage.getItem(TOP) === '1'; } catch (e) { return false; } }
  function sides() {
    if (R.getAttribute('data-mn-bd') === 'left') { R.setAttribute('data-mn-bd', 'right'); try { localStorage.setItem('minest.iphone.dockPos', 'right'); } catch (e) {} }
    R.classList.toggle('mn-dock-top', isTop() && R.getAttribute('data-mn-bd') === 'bottom');
  }
  function menu(m) {
    if (m.__mnSides) return; m.__mnSides = 1;
    var items = m.querySelectorAll('button[role="menuitemradio"]'), left = null, bottom = null, top = isTop() && R.getAttribute('data-mn-bd') === 'bottom';
    [].forEach.call(items, function (b) { var t = b.textContent.replace(/[✓\s]/g, ''); if (t === 'Left') left = b; if (t === 'Bottom') bottom = b; });
    if (!left || !bottom) return;
    m.insertBefore(left, m.querySelector('button'));   // Right · Top · Bottom, top first
    left.innerHTML = '<i>' + (top ? '✓' : '') + '</i>Top'; left.setAttribute('aria-checked', String(top));
    if (top) { bottom.setAttribute('aria-checked', 'false'); var i = bottom.querySelector('i'); if (i) i.textContent = ''; }
    left.addEventListener('click', function (e) { e.stopImmediatePropagation(); e.preventDefault(); try { localStorage.setItem(TOP, '1'); } catch (er) {} bottom.click(); sides(); }, true);
    [].forEach.call(items, function (b) { if (b !== left) b.addEventListener('click', function () { try { localStorage.setItem(TOP, '0'); } catch (er) {} setTimeout(sides, 0); }, true); });
  }
  function context() {
    var c = inRoom() ? 'room' : inWorld() ? 'world' : 'board';
    if (c === 'room') { modeLabel(roomKeys[0]); pixelIcons(); } else if (R.classList.contains('mn-ctx-apps')) { R.classList.remove('mn-ctx-apps'); dockAll.setAttribute('aria-pressed', 'false'); }
    if (c !== ctx) { ctx = c; R.setAttribute('data-mn-ctx', c); }
    else if (R.getAttribute('data-mn-ctx') !== c) R.setAttribute('data-mn-ctx', c);
  }
  document.addEventListener('keydown', onKey, true);
  document.addEventListener('fullscreenchange', function () { if (reading && nativeFull && !document.fullscreenElement) setReading(false); });
  var queued = false;
  new MutationObserver(function () {
    if (queued) return; queued = true;
    requestAnimationFrame(function () { queued = false; var d = dock(); if (d && (d.firstElementChild !== sysKeys[0] || sep.parentNode !== d || roomKeys[0].parentNode !== d)) mount(); context(); sides(); fit(); var m = document.querySelector('.mn-bd-menu'); if (m) menu(m); if (reading) syncFrames(); });
  }).observe(document.body || R, { childList: true, subtree: true });
  new MutationObserver(function () { sides(); fit(); }).observe(R, { attributes: true, attributeFilter: ['data-mn-bd'] });
  window.addEventListener('resize', function () { fit(); });
  setInterval(function () { context(); fit(); syncFrames(); }, 900);   // frames that load later (the opening) get the style too
  window.addEventListener('load', function () { setTimeout(syncFrames, 300); }, true);
  function start() { mount(); setTools(toolsOn()); context(); sides(); fit(); }
  if (document.body) start(); else document.addEventListener('DOMContentLoaded', start);
  window.MinestSystemBar = { reading: setReading, tools: setTools, state: function () { return { reading: reading, tools: !R.classList.contains('mn-sys-tools-off'), ctx: ctx }; } };
})();

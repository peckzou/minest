/* Minest · System buttons (2026-11-19, after Codex's opening controls and Spatial Home's clean reading).
   Four system buttons on every screen, in one small glass capsule in the bottom corner away from the Dock:
     1 ✕ close  — the Dock's own close (the module / panel on top closes)
     2 ‹ back   — the Dock's own back (Escape, then the page's history, then close)
     3 ⛶ full   — reading mode: every tool button on the page, the Dock, the room's toolbars and the buttons inside
                  open frames are hidden; only one "exit full screen" button stays, in that corner. Esc also leaves.
                  Where the browser allows it, the page also goes native full screen.
     4 ▤ tools  — fold the tools away (the Dock and the room's tool clusters) or bring them back; remembered.
   The Dock's own ✕ / ‹ and the older ⛶ buttons (Spatial Home's, the opening's) are hidden, so nothing is doubled.
   window.MinestSystemBar = { reading(on), tools(on), state() }. */
(function () {
  'use strict';
  if (window.MinestSystemBar) return;
  var R = document.documentElement, KEY = 'mn_sys_tools_v1', reading = false, nativeFull = false, lastFocus = null;
  var ICON = {
    close: '<path d="M6 6l12 12M18 6L6 18"/>',
    back: '<path d="M15 5l-7 7 7 7"/>',
    full: '<path d="M8 3H3v5M16 3h5v5M3 16v5h5M21 16v5h-5"/>',
    exit: '<path d="M3 8h5V3M16 3v5h5M8 21v-5H3M21 16h-5v5"/>',
    toolsOn: '<rect x="3.5" y="4" width="17" height="16" rx="3.5"/><path d="M15 4v16M18 9h0M18 12h0M18 15h0"/>',
    toolsOff: '<rect x="3.5" y="4" width="17" height="16" rx="3.5"/><path d="M15 4v16M11 9l-3 3 3 3"/>'
  };
  function svg(p) { return '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.2" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true">' + p + '</svg>'; }
  function haptic() { try { if (window.MinestNative && MinestNative.haptic) MinestNative.haptic('light'); } catch (e) {} }
  function btn(id, label, icon, fn) {
    var b = document.createElement('button'); b.type = 'button'; b.id = id; b.className = 'mn-sys-key';
    b.setAttribute('aria-label', label); b.title = label; b.innerHTML = svg(icon);
    b.addEventListener('click', function (e) { e.stopPropagation(); e.preventDefault(); haptic(); fn(); });
    return b;
  }
  /* 1, 2: the Dock's own ✕ and ‹ (they stay in the Dock, hidden, and do the work) */
  function dockKey(sel) { var b = document.querySelector('.mn-bdock ' + sel); if (b) { b.click(); return true; } return false; }
  function close() {
    if (dockKey('.mn-sys-exit')) return;
    document.dispatchEvent(new KeyboardEvent('keydown', { key: 'Escape', code: 'Escape', keyCode: 27, bubbles: true, cancelable: true }));
  }
  function back() {
    if (dockKey('.mn-sys-back')) return;
    var esc = new KeyboardEvent('keydown', { key: 'Escape', code: 'Escape', keyCode: 27, bubbles: true, cancelable: true });
    if (document.dispatchEvent(esc) && location.hash.length > 1) history.back();
  }
  /* 3: reading mode, in this page and in every open frame of the same site */
  var HIDE = 'button,[role="button"],[role="toolbar"],header.iphone-topbar,.ios-bottom-tab-bar,.mn-bdock,#minest-mini-pet-p0,#cs-btn,' +
    '#sh-top,#sh-labels,#sh-stick,#sh-hint,#sh-credit,#sh-pill,#sh-reading-enter,#sh-dock,#sh-settings,#sh-pack,#sh-edit,#sh-card,#sh-toast,#sh-skip,.clun-entry,.mn-start-control';
  var FRAME_CSS = HIDE.split(',').map(function (s) { return 'html.mn-sys-reading ' + s; }).join(',') + '{visibility:hidden!important;pointer-events:none!important}' +
    'html.mn-sys-reading body .mn-bdock.mn-bdock{display:none!important}' +
    '#mn-start-full,#sh-reading-enter{display:none!important}';   // the older full-screen buttons: this one replaces them
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
    try { if (window.SpatialBridge && SpatialBridge.setReading) SpatialBridge.setReading(false); } catch (e) {}       // one reading mode, not two
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
  /* 4: the tools folded away or shown */
  function toolsOn() { try { return localStorage.getItem(KEY) !== '0'; } catch (e) { return true; } }
  function setTools(on) {
    R.classList.toggle('mn-sys-tools-off', !on);
    try { localStorage.setItem(KEY, on ? '1' : '0'); } catch (e) {}
    toolsKey.innerHTML = svg(on ? ICON.toolsOn : ICON.toolsOff);
    var l = on ? '收起工具' : '展开工具'; toolsKey.setAttribute('aria-label', l); toolsKey.title = l; toolsKey.setAttribute('aria-pressed', on ? 'false' : 'true');
  }

  var bar = document.createElement('div'); bar.id = 'mn-sysbar'; bar.setAttribute('role', 'toolbar'); bar.setAttribute('aria-label', '系统按钮');
  var toolsKey = btn('mn-sys-tools', '收起工具', ICON.toolsOn, function () { setTools(R.classList.contains('mn-sys-tools-off')); });
  bar.appendChild(btn('mn-sys-close', '系统 · 关闭', ICON.close, close));   // (not "Close ·": the Dock's close looks for those)
  bar.appendChild(btn('mn-sys-back', '系统 · 返回', ICON.back, back));
  bar.appendChild(btn('mn-sys-full', '全屏 · 阅览模式', ICON.full, function () { setReading(true); }));
  bar.appendChild(toolsKey);
  var exitKey = btn('mn-sys-exit', '退出全屏', ICON.exit, function () { setReading(false); });

  /* the bar sits in the bottom corner away from the Dock, above the room's walking stick when that is on screen */
  function place() {
    var d = R.getAttribute('data-mn-bd'); R.classList.toggle('mn-sys-right', d === 'left');
    var st = document.getElementById('sh-stick'), lift = 0;
    if (st && !R.classList.contains('mn-sys-right')) { var r = st.getBoundingClientRect(); if (r.width && r.height && getComputedStyle(st).display !== 'none' && r.left < 160) lift = Math.max(0, innerHeight - r.top + 6 - 14); }
    R.style.setProperty('--mn-sys-lift', lift + 'px');
  }
  window.addEventListener('resize', place);
  function mount() {
    if (!document.body) return;
    if (!bar.isConnected) document.body.appendChild(bar);
    if (!exitKey.isConnected) document.body.appendChild(exitKey);
    R.classList.add('mn-sysbar'); place(); setTools(toolsOn());
  }
  document.addEventListener('keydown', onKey, true);
  document.addEventListener('fullscreenchange', function () { if (reading && nativeFull && !document.fullscreenElement) setReading(false); });
  var queued = false;
  new MutationObserver(function () {
    if (queued) return; queued = true;
    requestAnimationFrame(function () { queued = false; place(); if (!bar.isConnected || !exitKey.isConnected) mount(); if (reading) syncFrames(); });
  }).observe(R, { attributes: true, attributeFilter: ['data-mn-bd'], childList: true, subtree: true });
  window.addEventListener('load', function () { setTimeout(syncFrames, 300); }, true);   // frames that load later get the style too
  if (document.body) mount(); else document.addEventListener('DOMContentLoaded', mount);
  window.MinestSystemBar = { reading: setReading, tools: setTools, state: function () { return { reading: reading, tools: !R.classList.contains('mn-sys-tools-off') }; } };
})();

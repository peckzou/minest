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
    world: '<circle cx="10.5" cy="10.5" r="6.5"/><path d="m20 20-4.6-4.6"/><path d="M18.5 3.2v3.4M16.8 4.9h3.4"/>',
    set: '<circle cx="12" cy="12" r="3"/><path d="M19.4 15a1.7 1.7 0 0 0 .3 1.8l.1.1a2 2 0 1 1-2.8 2.8l-.1-.1a1.7 1.7 0 0 0-2.9 1.2V21a2 2 0 1 1-4 0v-.1a1.7 1.7 0 0 0-2.9-1.2l-.1.1a2 2 0 1 1-2.8-2.8l.1-.1A1.7 1.7 0 0 0 3.1 14H3a2 2 0 1 1 0-4h.1a1.7 1.7 0 0 0 1.2-2.9l-.1-.1a2 2 0 1 1 2.8-2.8l.1.1A1.7 1.7 0 0 0 10 3.1V3a2 2 0 1 1 4 0v.1a1.7 1.7 0 0 0 2.9 1.2l.1-.1a2 2 0 1 1 2.8 2.8l-.1.1A1.7 1.7 0 0 0 20.9 10H21a2 2 0 1 1 0 4h-.1a1.7 1.7 0 0 0-1.5 1z"/>'
  };
  function haptic() { try { if (window.MinestNative && MinestNative.haptic) MinestNative.haptic('light'); } catch (e) {} }
  function key(cls, label, inner, fn) {
    var b = document.createElement('button'); b.type = 'button'; b.className = 'mn-bapp mn-sys-key ' + cls;
    b.setAttribute('aria-label', label); b.title = label; b.innerHTML = inner;
    b.setAttribute('data-spatial-home-dock', '');   // not an app: the room must not leave for the Minest page when it is pressed
    /* a tap is read from the finger (pointer down → up, a little drift allowed): a click was lost when the finger
       moved a hair or the Dock resized under it (2026-11-20, the user: the keys sometimes did nothing) */
    var dn = null, done = 0;
    function fire() { done = Date.now(); haptic(); pressFx(b, 'up'); fn(b); }
    b.addEventListener('pointerdown', function (e) { if (e.button > 0) return; dn = { x: e.clientX, y: e.clientY, t: Date.now(), id: e.pointerId }; pressFx(b, 'down'); }, true);
    b.addEventListener('pointerup', function (e) { var d = dn; dn = null; if (!d || d.id !== e.pointerId) return; if (Math.abs(e.clientX - d.x) + Math.abs(e.clientY - d.y) > 28 || Date.now() - d.t > 900) { pressFx(b, 'cancel'); return; } e.stopPropagation(); fire(); }, true);
    b.addEventListener('pointercancel', function () { if (dn) { dn = null; pressFx(b, 'cancel'); } }, true);
    b.addEventListener('click', function (e) { e.stopPropagation(); e.preventDefault(); if (Date.now() - done < 700) return; fire(); }, true);   // keyboard, or a click with no pointer before it
    return b;
  }
  /* ---- micro-motion (2026-11-20, the user: every key's own little animation; the ring stayed on screen — Web
     Animations could stay pending forever here, so every motion is drawn per frame, and a timer always lands it) ---- */
  function tween(dur, fn, done, delay) {
    var t0 = 0, over = false;
    function land() { if (over) return; over = true; try { fn(1); } catch (e) {} if (done) try { done(); } catch (e) {} }
    function step() { if (over) return; var k = Math.min(1, (performance.now() - t0) / dur); if (k >= 1) { land(); return; } try { fn(k); } catch (e) {} requestAnimationFrame(step); }
    setTimeout(function () { t0 = performance.now(); try { fn(0); } catch (e) {} requestAnimationFrame(step); setTimeout(land, dur + 160); }, delay || 0);
  }
  var EZ = {
    out: function (k) { return 1 - Math.pow(1 - k, 3); },
    inn: function (k) { return k * k * k; },
    io: function (k) { return k < .5 ? 4 * k * k * k : 1 - Math.pow(-2 * k + 2, 3) / 2; },
    spring: function (k) { return 1 - Math.exp(-6.5 * k) * Math.cos(10.5 * k); },
    bell: function (k) { return Math.sin(Math.PI * k); },
    shake: function (k) { return Math.sin(k * Math.PI * 5) * (1 - k); }
  };
  function tf(el, v) { if (el) el.style.transform = v || ''; }
  /* the key under the finger: sinks, then springs back */
  function sink(b) { if (b.__down) return; b.__down = 1; var s0 = b.__sc || 1; tween(110, function (k) { b.__sc = s0 + (0.84 - s0) * EZ.out(k); tf(b, 'scale(' + b.__sc.toFixed(3) + ')'); }); }
  function rise(b) { b.__down = 0; var s0 = b.__sc || .84; tween(460, function (k) { b.__sc = s0 + (1 - s0) * EZ.spring(k); tf(b, 'scale(' + b.__sc.toFixed(3) + ')'); }, function () { b.__sc = 1; tf(b, ''); }); }
  /* a soft bloom of light behind the icon, always gone at the end */
  function bloom(b) {
    var r = document.createElement('i'); r.className = 'mn-sk-ring'; b.appendChild(r);
    tween(420, function (k) { var e = EZ.out(k); r.style.transform = 'scale(' + (0.5 + e * 0.8).toFixed(3) + ')'; r.style.opacity = (0.5 * (1 - k)).toFixed(3); }, function () { r.remove(); });
  }
  function sparks(b, n) {
    var r = b.getBoundingClientRect();
    for (var i = 0; i < n; i++) (function (i) {
      var s = document.createElement('i'); s.className = 'mn-sk-spark'; b.appendChild(s);
      var a = (-120 + i * (240 / Math.max(1, n - 1))) * Math.PI / 180, d = r.width * (0.45 + (i % 2) * 0.15);
      tween(520, function (k) { var e = EZ.out(k); s.style.transform = 'translate(' + (Math.cos(a) * d * e).toFixed(1) + 'px,' + (Math.sin(a) * d * e).toFixed(1) + 'px) scale(' + (1 - k * 0.6).toFixed(2) + ')'; s.style.opacity = (k < .2 ? k * 5 : 1 - (k - .2) / .8).toFixed(2); }, function () { s.remove(); }, i * 30);
    })(i);
  }
  /* each key's own motion, on its icon */
  function iconFx(b) {
    var sv = b.querySelector('svg'), c = b.className, l = (b.getAttribute('aria-label') || '').toLowerCase();
    if (/mn-sk-tools/.test(c)) return;   // "=" morphs itself (eqMorph)
    if (!sv) return;
    sv.style.transformOrigin = '50% 50%';
    var done = function () { tf(sv, ''); };
    if (/mn-sk-close/.test(c) || /close|关闭/.test(l)) return tween(480, function (k) { tf(sv, 'rotate(' + (EZ.spring(k) * 90).toFixed(1) + 'deg) scale(' + (1 - EZ.bell(k) * .18).toFixed(3) + ')'); }, done);
    if (/mn-sk-back/.test(c) || /back|返回/.test(l)) {
      var g = sv.cloneNode(true); g.classList.add('mn-sk-ghost'); b.appendChild(g);
      tween(420, function (k) { g.style.transform = 'translateX(' + (-10 * EZ.out(k)).toFixed(1) + 'px)'; g.style.opacity = (0.55 * (1 - k)).toFixed(2); }, function () { g.remove(); });
      return tween(460, function (k) { tf(sv, 'translateX(' + (-6 * EZ.bell(Math.min(1, k * 1.6)) + (k > .62 ? 2 * EZ.shake((k - .62) / .38) : 0)).toFixed(2) + 'px)'); }, done);
    }
    if (/mn-sk-full/.test(c)) return tween(520, function (k) { var e = k < .35 ? EZ.out(k / .35) * .32 : .32 * (1 - EZ.spring((k - .35) / .65)); tf(sv, 'scale(' + (1 + e).toFixed(3) + ')'); }, done);
    if (/spatial home|我的房间/.test(l)) return tween(520, function (k) { var y = k < .45 ? -6 * EZ.bell(k / .45 / 2 + 0) : 0, q = k >= .45 ? EZ.bell((k - .45) / .55) * .16 * (1 - (k - .45) / .55 * .5) : 0; tf(sv, 'translateY(' + y.toFixed(2) + 'px) scale(' + (1 + q).toFixed(3) + ',' + (1 - q).toFixed(3) + ')'); }, done);
    if (/my world|世界/.test(l)) return tween(700, function (k) { tf(sv, 'rotate(' + (EZ.io(k) * 360).toFixed(1) + 'deg)'); }, done);
    if (/views|视图/.test(l)) return tween(520, function (k) { tf(sv, 'translateY(' + (-5 * EZ.bell(Math.min(1, k * 1.5)) + (k > .66 ? 1.5 * EZ.shake((k - .66) / .34) : 0)).toFixed(2) + 'px)'); }, done);
    if (/arcade|游戏/.test(l)) return tween(560, function (k) { tf(sv, 'rotate(' + (14 * EZ.shake(k)).toFixed(2) + 'deg)'); }, done);
    if (/routine|liquid/.test(l)) return tween(560, function (k) { var q = EZ.shake(k) * .22; tf(sv, 'scale(' + (1 - q).toFixed(3) + ',' + (1 + q).toFixed(3) + ')'); }, done);
    if (/hermes|打字/.test(l)) return tween(460, function (k) { tf(sv, 'translateY(' + (2.5 * Math.abs(Math.sin(k * Math.PI * 3)) * (1 - k * .4)).toFixed(2) + 'px)'); }, done);
    if (/looks|外观/.test(l)) { sparks(b, 5); return tween(560, function (k) { tf(sv, 'rotate(' + (-26 * EZ.bell(Math.min(1, k * 1.4)) + (k > .7 ? 6 * EZ.shake((k - .7) / .3) : 0)).toFixed(1) + 'deg)'); }, done); }
    if (/more|更多/.test(l)) { var dots = sv.children; [].forEach.call(dots, function (d, i) { d.style.transformBox = 'fill-box'; d.style.transformOrigin = 'center'; tween(420, function (k) { d.style.transform = 'translateY(' + (-3.5 * EZ.bell(k)).toFixed(2) + 'px)'; }, function () { d.style.transform = ''; }, i * 70); }); return; }
    if (/dock|全部入口/.test(l)) return tween(460, function (k) { tf(sv, 'rotate(' + (EZ.spring(k) * 90).toFixed(1) + 'deg)'); }, done);
    if (/mn-page-key/.test(c)) return tween(420, function (k) { tf(sv, 'scale(' + (1 + EZ.bell(k) * .22).toFixed(3) + ')'); }, done);
    return tween(420, function (k) { tf(sv, 'scale(' + (1 + EZ.bell(k) * .18).toFixed(3) + ')'); }, done);
  }
  function pressFx(b, ph) {
    if (ph === 'down') { sink(b); return; }
    rise(b); if (ph === 'cancel') return;
    bloom(b); iconFx(b);
  }
  /* "=": the two bars turn into "||" (and back) with a liquid squeeze, the second a beat behind */
  var EQ = { on: [[0, -3.6, 0, 1], [0, 3.6, 0, 1]], off: [[-3.6, 0, 90, .82], [3.6, 0, 90, .82]] };
  function eqMorph(on) {
    var bars = toolsKey.querySelectorAll('.mn-eq i'), from = on ? EQ.off : EQ.on, to = on ? EQ.on : EQ.off;
    [].forEach.call(bars, function (bar, i) {
      var f = from[i], t = to[i];
      tween(620, function (k) {
        var e = EZ.io(Math.min(1, k * 1.25)), sp = EZ.spring(k), sq = EZ.bell(Math.min(1, k * 1.25)) * .38;
        var x = f[0] + (t[0] - f[0]) * e, y = f[1] + (t[1] - f[1]) * e, r = f[2] + (t[2] - f[2]) * sp, sx = (f[3] + (t[3] - f[3]) * e) * (1 - sq);
        bar.style.transform = 'translate(' + x.toFixed(2) + 'px,' + y.toFixed(2) + 'px) rotate(' + r.toFixed(1) + 'deg) scaleX(' + sx.toFixed(3) + ')';
      }, function () { bar.style.transform = ''; }, i * 70);
    });
  }
  /* "=": the tools fold into the key, the Dock closing round them — and come out of it one by one */
  var toolsBusy = false;
  function shownTools(d) { var out = [], past = false; [].forEach.call(d.children, function (c) { if (c === sep) { past = true; return; } if (past && getComputedStyle(c).display !== 'none') { if (c.classList.contains('mn-page')) [].forEach.call(c.children, function (k) { if (getComputedStyle(k).display !== 'none') out.push(k); }); else out.push(c); } }); return out; }
  function dockSize(d, from, done) {
    var v = R.classList.contains('mn-dock-v'), P = v ? 'height' : 'width', to = v ? d.getBoundingClientRect().height : d.getBoundingClientRect().width;
    if (Math.abs(to - from) < 2) { if (done) done(); return; }
    d.classList.add('mn-dock-anim');
    tween(560, function (k) { d.style.setProperty(P, (from + (to - from) * EZ.spring(k)).toFixed(1) + 'px', 'important'); }, function () { d.style.removeProperty(P); d.classList.remove('mn-dock-anim'); if (done) done(); });
  }
  function toggleTools() {
    var d = dock(), on = R.classList.contains('mn-sys-tools-off');
    if (!d || toolsBusy) { setTools(on); return; }
    toolsBusy = true; eqMorph(on);
    var v = R.classList.contains('mn-dock-v'), r0 = d.getBoundingClientRect(), from = v ? r0.height : r0.width, kr = toolsKey.getBoundingClientRect(), kx = kr.left + kr.width / 2, ky = kr.top + kr.height / 2;
    if (!on) {
      var apps = shownTools(d), n = apps.length;
      apps.forEach(function (a, i) {
        var r = a.getBoundingClientRect(), dx = kx - (r.left + r.width / 2), dy = ky - (r.top + r.height / 2);
        tween(240, function (k) { var e = EZ.inn(k); a.style.transform = 'translate(' + (dx * e).toFixed(1) + 'px,' + (dy * e).toFixed(1) + 'px) scale(' + (1 - .65 * e).toFixed(3) + ')'; a.style.opacity = (1 - e).toFixed(3); }, null, (n - 1 - i) * 16);
      });
      setTimeout(function () {
        apps.forEach(function (a) { a.style.transform = ''; a.style.opacity = ''; });
        setTools(false); fit(); dockSize(d, from, function () { toolsBusy = false; });
      }, 240 + n * 16 + 20);
    } else {
      setTools(true); fit();
      var apps2 = shownTools(d);
      apps2.forEach(function (a) { a.style.opacity = '0'; });
      dockSize(d, from);
      requestAnimationFrame(function () {
        apps2.forEach(function (a, i) {
          var r = a.getBoundingClientRect(), dx = kx - (r.left + r.width / 2), dy = ky - (r.top + r.height / 2);
          tween(520, function (k) { var e = EZ.spring(k), o = Math.min(1, k * 3); a.style.transform = 'translate(' + (dx * (1 - e)).toFixed(1) + 'px,' + (dy * (1 - e)).toFixed(1) + 'px) scale(' + (.35 + .65 * e).toFixed(3) + ')'; a.style.opacity = o.toFixed(3); }, function () { a.style.transform = ''; a.style.opacity = ''; if (i === apps2.length - 1) toolsBusy = false; }, i * 28);
        });
        if (!apps2.length) toolsBusy = false;
      });
      setTimeout(function () { toolsBusy = false; }, 1600);
    }
  }
  /* every other key in the Dock (apps, the room's tools, the page's keys) gets the same press and its own motion */
  document.addEventListener('pointerdown', function (e) { var b = e.target.closest && e.target.closest('.mn-bdock .mn-bapp'); if (!b || b.classList.contains('mn-sys-key')) return; b.__pd = { x: e.clientX, y: e.clientY, t: Date.now() }; sink(b); }, true);
  document.addEventListener('pointerup', function (e) { var b = e.target.closest && e.target.closest('.mn-bdock .mn-bapp'); [].forEach.call(document.querySelectorAll('.mn-bdock .mn-bapp'), function (x) { if (x.__down && x !== b && !x.classList.contains('mn-sys-key')) { x.__pd = null; pressFx(x, 'cancel'); } }); if (!b || b.classList.contains('mn-sys-key') || !b.__pd) return; var d = b.__pd; b.__pd = null; pressFx(b, Math.abs(e.clientX - d.x) + Math.abs(e.clientY - d.y) > 28 ? 'cancel' : 'up'); }, true);
  document.addEventListener('pointercancel', function () { [].forEach.call(document.querySelectorAll('.mn-bdock .mn-bapp'), function (x) { if (x.__down && !x.classList.contains('mn-sys-key')) { x.__pd = null; pressFx(x, 'cancel'); } }); }, true);
  /* nothing to go back to / close: the key shakes its head, and says so */
  function nothing(b, txt) {
    var sv = b.querySelector('svg'); tween(420, function (k) { tf(sv, 'translateX(' + (5 * EZ.shake(k)).toFixed(2) + 'px)'); }, function () { tf(sv, ''); });
    var t = document.getElementById('mn-sk-toast'); if (!t) { t = document.createElement('div'); t.id = 'mn-sk-toast'; document.body.appendChild(t); }
    t.textContent = txt; var r = b.getBoundingClientRect(), v = R.classList.contains('mn-dock-v');
    t.style.left = (v ? r.left - 12 : r.left + r.width / 2) + 'px'; t.style.top = (v ? r.top + r.height / 2 : r.top - 12) + 'px'; t.className = v ? 'v' : '';
    var id = (t.__id || 0) + 1; t.__id = id;
    tween(1500, function (k) { if (t.__id !== id) return; var o = k < .12 ? k / .12 : k < .8 ? 1 : 1 - (k - .8) / .2, y = k < .12 ? 6 * (1 - EZ.out(k / .12)) : k > .8 ? -2 * (k - .8) / .2 : 0; t.style.opacity = o.toFixed(3); t.style.translate = '0 ' + y.toFixed(1) + 'px'; }, function () { if (t.__id === id) t.style.opacity = '0'; });
  }
  /* did a step back / a close change anything on screen? (the page's own Esc handlers say nothing back) */
  function snap() { var b = document.body; return location.href + '|' + b.className + '|' + R.className.replace(/\bmn-(dock-[hv]|sys-\S+)\b/g, '') + '|' + b.childElementCount + '|' + document.querySelectorAll('[role=dialog],[class*=modal],[class*=overlay],[class*=popover],[class*=sheet]').length; }
  function orNothing(b, before, txt) { setTimeout(function () { if (snap() === before) nothing(b, txt); }, 280); }
  /* the room (Spatial Home) is the screen in use: open, and not showing a Minest feature over it */
  function inRoom() {
    try { var H = window.MinestSpatialHome; if (!H || !H.isOpen || !H.isOpen()) return false; var st = H.api && H.api().state(); return !(st && st.inFeature); } catch (e) { return false; }
  }
  function press(id) { var b = document.getElementById(id); if (b) { b.click(); return true; } return false; }
  /* 1, 2 */
  function dockKey(sel) { var b = document.querySelector('.mn-bdock ' + sel); if (b) { b.click(); return true; } return false; }
  function esc() { return document.dispatchEvent(new KeyboardEvent('keydown', { key: 'Escape', code: 'Escape', keyCode: 27, bubbles: true, cancelable: true })); }
  function close(b) { var s0 = snap(); if (ctx === 'room' && press('sh-exitBtn')) return; if (!dockKey('.mn-sys-exit')) esc(); orNothing(b, s0, '没有可关闭的'); }
  function back(b) { var s0 = snap(); if (ctx === 'room') { if (esc() && !press('sh-exitBtn')) {} return; } if (!dockKey('.mn-sys-back') && esc() && location.hash.length > 1) history.back(); orNothing(b, s0, '已经是最前一页'); }
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
  /* 2026-11-22 (the user: "默认 dock 只要显示系统级的 4 个按钮，搜索按钮放到展开里，展开后就不用显示系统按钮"): every start is
     folded — only ✕ ‹ ⛶ = ; unfolded, the tools (search first) take the Dock and ✕ ‹ ⛶ step aside, "||" folds back */
  function toolsOn() { return false; }
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
  var searchKey = key('mn-sk-world', 'My World · 搜索或搭建世界 (⌘K)', svg(ICON.world), function () { if (window.MinestOmni) MinestOmni.toggle(); });   // tools/toolkit/omni.js — the first of the unfolded tools
  var toolsKey = key('mn-sk-tools', '收起工具', '<span class="mn-eq" aria-hidden="true"><i></i><i></i></span>', function () { toggleTools(); });
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
  /* the study's sliding board: each panel up or down — the EC–6 board, blackboard 1, blackboard 2 (Victorian Study only) */
  var slideKeys = [['布告栏 · 上下推拉', '<rect x="4" y="9" width="16" height="11" rx="1"/><path d="M8 13h8M8 16h5M12 2v5M9.5 4.5 12 2l2.5 2.5"/>'],
    ['黑板 1 · 上下推拉', '<rect x="4" y="9" width="16" height="11" rx="1"/><path d="M12 2v5M9.5 4.5 12 2l2.5 2.5M11 12v5"/>'],
    ['黑板 2 · 上下推拉', '<rect x="4" y="9" width="16" height="11" rx="1"/><path d="M12 2v5M9.5 4.5 12 2l2.5 2.5M10 12h3.5v2.4H10V17h3.5"/>']].map(function (q, i) {
      var k = key('mn-ctx-key mn-ctx-slide', q[0], svg(q[1]), function () { var b = window.MinestStudyBoard; if (b && b.slide) b.slide(i); });
      k.classList.remove('mn-sys-key'); k.dataset.ctx = 'off'; roomKeys.push(k); return k; });
  function study() { try { var e = window.MinestSpatialHome.api().env(); return !!(e && e.envId === 'victorian' && window.MinestStudyBoard && window.MinestStudyBoard.slide); } catch (er) { return false; } }
  function inWorld() { try { return !!(window.MinestMyWorld && MinestMyWorld.isOpen && MinestMyWorld.isOpen()); } catch (e) { return false; } }

  /* the page's own keys (2026-11-20, the user: the right of the Dock holds only what the page in use needs — its top
     bar moves down here): a page hands over one group of keys; while it is there, the board's apps give way (the
     "Dock" key brings them back) */
  var pageEl = null;
  function setPage(el) {
    if (pageEl === el) return; if (pageEl && pageEl.parentNode && pageEl !== el) pageEl.remove();
    pageEl = el || null; R.classList.toggle('mn-ctx-page', !!pageEl);
    if (!pageEl && ctx !== 'room') { R.classList.remove('mn-ctx-apps'); dockAll.setAttribute('aria-pressed', 'false'); }
    mount(); fit();
  }
  function dock() { return document.querySelector('.mn-bdock'); }
  function mount() {
    var d = dock(); if (!d) return;
    var at = d.firstElementChild, i;
    for (i = 0; i < sysKeys.length; i++) { if (at !== sysKeys[i]) d.insertBefore(sysKeys[i], at); at = sysKeys[i].nextElementSibling; }
    if (at !== sep) d.insertBefore(sep, at);
    if (sep.nextElementSibling !== searchKey) d.insertBefore(searchKey, sep.nextElementSibling);
    var anchor = searchKey.nextElementSibling;
    roomKeys.forEach(function (b) { if (b.parentNode !== d) d.insertBefore(b, anchor); });
    if (pageEl && pageEl.parentNode !== d) d.insertBefore(pageEl, searchKey.nextElementSibling);
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
    [].forEach.call(d.children, function (c) { if (c === pageEl) { [].forEach.call(c.children, function (k) { if (getComputedStyle(k).display !== 'none') keys++; }); return; } if (getComputedStyle(c).display === 'none') return; if (c.classList.contains('mn-sys-sep')) seps++; else keys++; });
    var lens = mc ? 0 : (h ? 1.6 : 1.35), room = (h ? innerWidth : innerHeight) - 28 - (h ? 0 : 20);
    if (R.classList.contains('mn-dock-free')) room = (h ? innerWidth : innerHeight) - 24;   // placed freely: the whole screen is the limit
    else if (R.classList.contains('duo-dockpin') || R.classList.contains('duo-docktop')) {   // the Duo's pinned Dock starts at its own place: the room left from there
      var dr = d.getBoundingClientRect(); room = h ? innerWidth - Math.max(0, dr.left) - 16 : innerHeight - Math.max(0, dr.top) - 16;
    }
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
  /* drag the Dock anywhere (2026-11-22, the user: "长按拖着移动" → then "拉着它就要可以拖到"): press and move — no hold
     needed; the Dock follows the finger and stays where it is let go (kept on this device as a fraction of the screen).
     A tap still presses a key, a hold without moving still opens the Dock menu, which also has 复位 Reset position. */
  var FREE = 'minest.dockFree.v1', dg = null;
  function freeGet() { try { return JSON.parse(localStorage.getItem(FREE) || 'null'); } catch (e) { return null; } }
  function freeApply() {
    if (dg && dg.on) return;   // mid-drag: the finger owns the position (the page's re-layouts must not snap it back)
    var f = freeGet(), d = dock(); R.classList.toggle('mn-dock-free', !!f); if (!f || !d) return;
    var r = d.getBoundingClientRect(), w = r.width || 60, h = r.height || 60;
    R.style.setProperty('--mn-fx', Math.round(Math.max(6, Math.min(innerWidth - w - 6, f.x * innerWidth))) + 'px');
    R.style.setProperty('--mn-fy', Math.round(Math.max(6, Math.min(innerHeight - h - 6, f.y * innerHeight))) + 'px');
  }
  function freeReset() { try { localStorage.removeItem(FREE); } catch (e) {} R.classList.remove('mn-dock-free'); R.style.removeProperty('--mn-fx'); R.style.removeProperty('--mn-fy'); fit(); haptic(); }
  function closeDockMenu() { [].forEach.call(document.querySelectorAll('.mn-bd-menu'), function (m) { m.remove(); }); }
  document.addEventListener('pointerdown', function (e) {
    var d = dock(); if (!d || !d.contains(e.target) || (e.button && e.button !== 0)) return;
    if (dg) clearTimeout(dg.tm);
    dg = { x: e.clientX, y: e.clientY, id: e.pointerId, d: d, held: false, on: false };
    dg.tm = setTimeout(function () { if (dg) { dg.held = true; d.classList.add('mn-dock-ready'); } }, 450);
  }, true);
  // on window, capture, registered at load: ahead of the board's own swipe handlers (added per press), which would
  // otherwise take the move as a lane scroll and stop it before the Dock sees it
  window.addEventListener('pointermove', function (e) {
    if (!dg || e.pointerId !== dg.id) return;
    if (!dg.on) {
      if (Math.hypot(e.clientX - dg.x, e.clientY - dg.y) < 6) return;
      var r0 = dg.d.getBoundingClientRect(); dg.ox = r0.left - dg.x; dg.oy = r0.top - dg.y; dg.on = true;   // measured from where the finger went down, so the Dock keeps up with it
      R.classList.add('mn-dock-free', 'mn-dock-moving'); closeDockMenu(); haptic();
    }
    e.preventDefault(); e.stopImmediatePropagation();
    var r = dg.d.getBoundingClientRect();
    R.style.setProperty('--mn-fx', Math.round(Math.max(6, Math.min(innerWidth - r.width - 6, e.clientX + dg.ox))) + 'px');
    R.style.setProperty('--mn-fy', Math.round(Math.max(6, Math.min(innerHeight - r.height - 6, e.clientY + dg.oy))) + 'px');
  }, { capture: true, passive: false });
  function dockDragEnd(e) {
    if (!dg || e.pointerId !== dg.id) return; clearTimeout(dg.tm); dg.d.classList.remove('mn-dock-ready');
    if (dg.on) {
      e.preventDefault(); e.stopImmediatePropagation(); closeDockMenu();
      var x = parseFloat(R.style.getPropertyValue('--mn-fx')) || 0, y = parseFloat(R.style.getPropertyValue('--mn-fy')) || 0;
      try { localStorage.setItem(FREE, JSON.stringify({ x: x / innerWidth, y: y / innerHeight })); } catch (er) {}
      R.classList.remove('mn-dock-moving');
      var kill = function (ev) { ev.stopPropagation(); ev.preventDefault(); window.removeEventListener('click', kill, true); };   // the release is not a key press
      window.addEventListener('click', kill, true); setTimeout(function () { window.removeEventListener('click', kill, true); }, 400);
      fit();
    }
    dg = null;
  }
  window.addEventListener('pointerup', dockDragEnd, true); window.addEventListener('pointercancel', dockDragEnd, true);
  function freeMenu(m) {
    if (m.__mnFree || !freeGet()) return; m.__mnFree = 1;
    var b = document.createElement('button'); b.type = 'button'; b.innerHTML = '<i>⤺</i>复位 Reset position';
    b.addEventListener('click', function (e) { e.stopPropagation(); freeReset(); closeDockMenu(); });
    m.appendChild(b);
  }
  window.addEventListener('resize', freeApply);
  /* Octo can be hidden (2026-11-20, the user): "隐藏" in its quick ring; the Dock's long-press menu shows / hides it */
  var OCTO = 'minest.octoHidden';
  function octoHidden() { try { return localStorage.getItem(OCTO) === '1'; } catch (e) { return false; } }
  function setOcto(hide) { R.classList.toggle('mn-octo-off', !!hide); try { localStorage.setItem(OCTO, hide ? '1' : '0'); } catch (e) {} haptic(); }
  setOcto(octoHidden());
  function octoRing(m) {
    if (m.__mnOcto) return; m.__mnOcto = 1;
    var c = window.__miniPetCtl, ctr = c && c.center ? c.center() : null; if (!ctr) return;
    var n = m.querySelectorAll('button').length, right = ctr.x < innerWidth / 2, a = (-84 + n * 28) * Math.PI / 180, Rr = 118;
    var x = Math.max(32, Math.min(innerWidth - 32, ctr.x + (right ? 1 : -1) * Math.cos(a) * Rr)), y = Math.max(40, Math.min(innerHeight - 40, ctr.y + Math.sin(a) * Rr));
    var b = document.createElement('button'); b.type = 'button'; b.className = 'mn-glass mn-octo-hide'; b.setAttribute('aria-label', '隐藏 Octo');
    b.innerHTML = '<svg viewBox="0 0 24 24" width="22" height="22" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true"><path d="M3 3l18 18"/><path d="M10.6 5.1A10 10 0 0 1 12 5c6 0 9.5 7 9.5 7a17 17 0 0 1-2.6 3.4M6.4 6.4C3.9 8.2 2.5 12 2.5 12s3.5 7 9.5 7a9.6 9.6 0 0 0 5.6-1.8"/><path d="M9.9 9.9a3 3 0 0 0 4.2 4.2"/></svg><i>隐藏</i>';
    b.style.left = x + 'px'; b.style.top = y + 'px'; b.style.setProperty('--fx', (ctr.x - x) + 'px'); b.style.setProperty('--fy', (ctr.y - y) + 'px'); b.style.setProperty('--dl', (n * 35) + 'ms');
    b.addEventListener('click', function (e) { e.stopPropagation(); m.classList.remove('open'); setTimeout(function () { m.remove(); }, 0); setOcto(true); });
    m.appendChild(b);
  }
  function octoMenu(m) {
    if (m.__mnOcto) return; m.__mnOcto = 1;
    var h0 = m.offsetHeight, h = document.createElement('h6'); h.textContent = 'Octo'; h.style.marginTop = '10px';
    var hid = octoHidden(), b = document.createElement('button'); b.type = 'button'; b.setAttribute('role', 'menuitemcheckbox'); b.setAttribute('aria-checked', String(!hid));
    b.innerHTML = '<i>' + (hid ? '' : '✓') + '</i>显示 Octo';
    b.addEventListener('click', function (e) { e.stopPropagation(); setOcto(!octoHidden()); m.remove(); });
    m.appendChild(h); m.appendChild(b);
    var grow = m.offsetHeight - h0, r = m.getBoundingClientRect();   // a menu over the Dock grows upward, never onto it
    if (R.getAttribute('data-mn-bd') === 'bottom' && !R.classList.contains('mn-dock-top')) m.style.top = Math.max(8, r.top - grow) + 'px';
    else if (r.bottom > innerHeight - 8) m.style.top = Math.max(8, innerHeight - 8 - m.offsetHeight) + 'px';
  }
  function context() {
    var c = inRoom() ? 'room' : inWorld() ? 'world' : 'board';
    if (c === 'room') { modeLabel(roomKeys[0]); pixelIcons(); var fl = study() ? 'room' : 'off'; slideKeys.forEach(function (k) { if (k.dataset.ctx !== fl) k.dataset.ctx = fl; }); } else if (!pageEl && R.classList.contains('mn-ctx-apps')) { R.classList.remove('mn-ctx-apps'); dockAll.setAttribute('aria-pressed', 'false'); }
    if (c !== ctx) { ctx = c; R.setAttribute('data-mn-ctx', c); }
    else if (R.getAttribute('data-mn-ctx') !== c) R.setAttribute('data-mn-ctx', c);
  }
  /* an app key pressed in the room (Dock · 全部入口): its panel opens on the board, under the room's canvas — it looked
     dead (2026-11-20, the user). Leave the room first, then press it again on the board. */
  document.addEventListener('click', function (e) {
    if (ctx !== 'room') return;
    var b = e.target.closest && e.target.closest('.mn-bdock .mn-bapp');
    if (!b || b.__mnReplay || b.classList.contains('mn-sys-key') || b.classList.contains('mn-ctx-key') || b.classList.contains('mn-page-key') || b.hasAttribute('data-spatial-home-dock')) return;
    e.preventDefault(); e.stopImmediatePropagation();
    try { if (window.MinestSpatialHome && MinestSpatialHome.close) MinestSpatialHome.close(); else press('sh-exitBtn'); } catch (er) { press('sh-exitBtn'); }
    var t0 = Date.now();
    (function again() {
      if (!inRoom() || Date.now() - t0 > 2500) { setTimeout(function () { b.__mnReplay = 1; try { b.click(); } finally { b.__mnReplay = 0; } }, 120); return; }
      setTimeout(again, 80);
    })();
  }, true);
  document.addEventListener('keydown', onKey, true);
  document.addEventListener('fullscreenchange', function () { if (reading && nativeFull && !document.fullscreenElement) setReading(false); });
  var queued = false;
  new MutationObserver(function () {
    if (queued) return; queued = true;
    requestAnimationFrame(function () { queued = false; var d = dock(); if (d && (d.firstElementChild !== sysKeys[0] || sep.parentNode !== d || searchKey.parentNode !== d || roomKeys[0].parentNode !== d || (pageEl && pageEl.parentNode !== d))) mount(); context(); sides(); fit(); freeApply(); var m = document.querySelector('.mn-bd-menu'); if (m) freeMenu(m); if (m) { menu(m); octoMenu(m); } var pr = document.querySelector('.mpet-menu'); if (pr) octoRing(pr); if (reading) syncFrames(); });
  }).observe(document.body || R, { childList: true, subtree: true });
  new MutationObserver(function () { sides(); fit(); }).observe(R, { attributes: true, attributeFilter: ['data-mn-bd'] });
  window.addEventListener('resize', function () { fit(); });
  setInterval(function () { context(); fit(); syncFrames(); }, 900);   // frames that load later (the opening) get the style too
  window.addEventListener('load', function () { setTimeout(syncFrames, 300); }, true);
  function start() { mount(); setTools(toolsOn()); context(); sides(); fit(); freeApply(); }
  if (document.body) start(); else document.addEventListener('DOMContentLoaded', start);
  window.MinestSystemBar = { page: setPage, reading: setReading, tools: setTools, state: function () { return { reading: reading, tools: !R.classList.contains('mn-sys-tools-off'), ctx: ctx }; } };
})();

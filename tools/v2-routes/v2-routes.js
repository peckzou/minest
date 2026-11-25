/* Minest · 2.0 routes — the app's own entries open the 2.0 pages in place of 1.0 (tools/v2-routes/patch_v2_routes.py).
   Holo Lab, 3D Type and Clun were already pages in a frame: the patch points their addresses at holo-lab-2/, type3d-2/
   and spatial-home/clun-2/. The three below were drawn by Minest itself; here their entries open the 2.0 page full screen:
     · 动态卡片   the board's 3D Cover view, when you switch to it          → cards-2/      (on the board you are on)
     · 动态呈现   MinestDrive.gallery() (the 🚗 entries) and the presentations' own open()  → dynamic-2/ (?mode= that one)
     · EC–6 布告栏 the Spatial Home board's panel                         → ec6-board-2/
   The 2.0 pages ask this page for their data and send their changes back (v2-bridge/bridge.js on their side, answer() here):
   in the app this page runs from the app's files and the 2.0 page from the web site, so they share no storage.
   The 2.0 pages load the 1.0 scripts as they are, so nothing of 1.0 is removed. World Search and 卡片风格 stay 1.0
   (their 2.0 pages keep data of their own). */
(function () {
  'use strict';
  if (window.MinestV2Routes) return;
  var SITE = 'https://minest-app.vercel.app/', ov = null, frame = null, onClose = null;
  /* where each page's ✕ sits, clear of the page's own controls */
  var XPOS = { 'cards-2/': 'top', 'dynamic-2/': 'top', 'ec6-board-2/': 'top-left' };
  var LS_SYNC = { 'minest.ec6board.v1': 1, 'minest.gptstudy.v1': 1 };

  function url(path) { return /^https?:$/.test(location.protocol) ? new URL(path, location.href).href : SITE + path; }
  function css() {
    if (document.getElementById('mn-v2r-css')) return;
    var s = document.createElement('style'); s.id = 'mn-v2r-css';
    s.textContent = '.mn-v2r{position:fixed;inset:0;z-index:2147483646;background:#05070f}' +
      '.mn-v2r iframe{position:absolute;inset:0;width:100%;height:100%;border:0;display:block}' +
      '.mn-v2r-x{position:absolute;top:calc(env(safe-area-inset-top,0px) + 8px);left:50%;transform:translateX(-50%);z-index:2;width:34px;height:34px;border-radius:17px;border:1px solid rgba(255,255,255,.28);' +
      'background:rgba(20,22,30,.55);color:#fff;display:flex;align-items:center;justify-content:center;cursor:pointer;-webkit-backdrop-filter:blur(10px);backdrop-filter:blur(10px);padding:0;opacity:.8}' +
      '.mn-v2r-x.top-left{left:calc(env(safe-area-inset-left,0px) + 10px);transform:none}' +
      '.mn-v2r-x:hover{opacity:1}.mn-v2r-x svg{width:16px;height:16px}html.mn-v2r-on{overflow:hidden}html.mn-v2r-on .mn-bdock{visibility:hidden!important}';
    document.head.appendChild(s);
  }
  /* one page at a time; closing (✕, Esc, the page asking through the bridge, or the page leaving itself for another
     address) calls back with what the page asked for */
  function open(path, title, done) {
    close(null, true); css(); onClose = done || null;
    ov = document.createElement('div'); ov.className = 'mn-v2r'; ov.setAttribute('role', 'dialog'); ov.setAttribute('aria-label', title || '2.0');
    var fr = frame = document.createElement('iframe'); fr.title = title || '2.0';
    fr.setAttribute('allow', 'autoplay; fullscreen; camera; microphone; clipboard-write');
    var want = url(path);
    fr.addEventListener('load', function () {
      /* same site only (the web): the 2.0 page went to another address of its own accord — that means "close" here.
         In the app the page is on another site and cannot be read; it closes through the bridge instead. */
      var p = null; try { p = fr.contentWindow.location.href; } catch (e) {}
      if (p && p !== 'about:blank' && new URL(p).pathname !== new URL(want).pathname) close();
    });
    fr.src = want;
    var x = document.createElement('button'); x.type = 'button'; x.className = 'mn-v2r-x';
    var pos = Object.keys(XPOS).filter(function (k) { return path.indexOf(k) === 0; })[0]; if (pos && XPOS[pos] !== 'top') x.classList.add(XPOS[pos]);
    x.title = '关闭 · Close'; x.setAttribute('aria-label', '关闭 · Close');
    x.innerHTML = '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.3" stroke-linecap="round" aria-hidden="true"><path d="M6 6l12 12M18 6L6 18"/></svg>';
    /* on press, not click: Minest's page-wide touch handlers take the pointer between down and up, so a click never lands */
    var shut = function (e) { e.stopPropagation(); e.preventDefault(); close(); };
    x.addEventListener('pointerdown', shut); x.addEventListener('click', shut);
    ov.appendChild(fr); ov.appendChild(x); document.body.appendChild(ov);
    ['pointerdown', 'touchstart', 'wheel', 'keydown', 'click'].forEach(function (t) { ov.addEventListener(t, function (e) { e.stopPropagation(); }, { passive: true }); });
    document.documentElement.classList.add('mn-v2r-on');
    try { fr.focus(); } catch (e) {}
  }
  function close(result, silent) {
    if (!ov) return;
    var o = ov, f = onClose; ov = null; frame = null; onClose = null;
    try { o.querySelector('iframe').src = 'about:blank'; } catch (e) {}
    o.remove(); document.documentElement.classList.remove('mn-v2r-on');
    if (f && !silent) try { f(result || null); } catch (e) {}
  }
  document.addEventListener('keydown', function (e) { if (ov && e.key === 'Escape') close(); });

  /* ---- the bridge: answers only the page in our own frame */
  function AI() { return window.MinestAI || null; }
  function activeId() {
    try { var b = AI() && AI().board && AI().board(); if (b && b.id) return b.id; } catch (e) {}
    try { return localStorage.getItem('focusboard_active_id_v7_2') || ''; } catch (e) { return ''; }
  }
  function ec6Reload(v) {   // Minest's own 1.0 board keeps its state in memory: it takes the page's copy, then paints
    try { var E = window.SpatialEC6, S = E && E._ && E._.S(); if (!S) return; var n = JSON.parse(v);
      Object.keys(S).forEach(function (k) { delete S[k]; }); Object.keys(n || {}).forEach(function (k) { S[k] = n[k]; }); E.paint(); } catch (e) {}
  }
  window.addEventListener('message', function (e) {
    var m = e.data; if (!frame || e.source !== frame.contentWindow || !m || m.type !== 'minest-v2') return;
    var A = AI(), d = m.data || {};
    var reply = function (data) { try { e.source.postMessage({ type: 'minest-v2', re: m.id, data: data }, e.origin && e.origin !== 'null' ? e.origin : '*'); } catch (x) {} };
    try {
      if (m.op === 'hello') {
        var ls = {}; Object.keys(LS_SYNC).forEach(function (k) { try { ls[k] = localStorage.getItem(k); } catch (x) { ls[k] = null; } });
        var boards = []; try { boards = A && A.boards ? A.boards() || [] : []; } catch (x) {}
        reply({ boards: boards, active: activeId(), ls: ls });
      }
      else if (m.op === 'patchCard' && A && A.patchCard) A.patchCard(d.id, d.patch || {});
      else if (m.op === 'rateCard' && A && A.rateCard) A.rateCard(d.id, d.m);
      else if (m.op === 'setBoard' && A && A.updateBoard && d.board && d.board.id) A.updateBoard(d.board.id, function () { return d.board; });
      else if (m.op === 'ls' && LS_SYNC[d.key] && typeof d.value === 'string') {
        localStorage.setItem(d.key, d.value);
        if (d.key === 'minest.ec6board.v1') ec6Reload(d.value);
      }
      else if (m.op === 'close') close(d);
    } catch (x) {}
  });

  /* ---- 动态呈现: the 🚗 entries (MinestDrive.gallery) and each presentation's own open() go to 2.0, that presentation
     already running (?mode=). gallery1 / open1 keep 1.0 for code that needs it. */
  var DYN = { drive: 'MinestDrive', train: 'MinestTrain', metro: 'MinestMetro', tower: 'MinestTower', rack: 'MinestRack', library: 'MinestLibrary',
    museum: 'MinestMuseum', city: 'MinestCity', galaxy: 'MinestGalaxy', balloon: 'MinestBalloon' };
  function dyn(mode) { open('dynamic-2/index.html' + (mode ? '?mode=' + mode : ''), '动态呈现 2.0'); return { close: function () { close(); } }; }
  function hookDyn() {
    var all = true;
    Object.keys(DYN).forEach(function (mode) {
      var M = window[DYN[mode]]; if (!M) { all = false; return; } if (M.__v2) return; M.__v2 = true;
      if (M.open) { M.open1 = M.open; M.open = function (o) { var trip = mode === 'drive' && o && o.style && (M.trips || []).some(function (t) { return t.id === o.style; }); return dyn(trip ? 'roadtrip' : mode); }; }
      if (mode === 'drive' && M.gallery) { M.gallery1 = M.gallery; M.gallery = function () { dyn(''); }; }
    });
    return all;
  }

  /* ---- EC–6 布告栏: the room's board panel (o.panel, set by SpatialEC6.attach) opens 2.0; a card or the Kanban asked
     for there comes back as 1.0's own answer, so the room hands over to the Kanban the way it always has */
  function hookEC6() {
    var E = window.SpatialEC6; if (!E || E.__v2) return !!E;
    var a0 = E.attach; E.__v2 = true;
    E.attach = function (o) {
      var r = a0.apply(this, arguments);
      if (o) o.panel = function () { return new Promise(function (res) {
        open('ec6-board-2/index.html', 'EC–6 布告栏 2.0', function (d) {
          try { E.paint(); } catch (e) {}
          if (d && d.openCard) { var id = d.openCard; res({ feature: 'kanban', after: function (w) { setTimeout(function () { try { w.MinestAI.openCard(id); } catch (e) {} }, 120); } }); }
          else if (d && d.kanban) res({ feature: 'kanban' });
          else res(null);
        });
      }); };
      return r;
    };
    return true;
  }

  /* ---- 动态卡片: switching the board to its 3D Cover view yourself opens 2.0 on the same board; closing returns to the
     board view. Only a switch you made (a tap or a key just before) counts: a view restored at start goes back to the
     board, and one the Duo's fold makes later stays 1.0's own. Student mode keeps its own 3D Cover (its whole screen). */
  var coverWas = false, lastInput = 0, t0 = Date.now();
  ['pointerdown', 'keydown'].forEach(function (t) { document.addEventListener(t, function () { lastInput = Date.now(); }, true); });
  function student() { try { return !!(window.isStudentMode && window.isStudentMode()); } catch (e) { return false; } }
  function toBoardView() { try { if (window.__setViewMode) window.__setViewMode('board'); else if (window.MinestAI && MinestAI.setViewMode) MinestAI.setViewMode('board'); } catch (e) {} }
  function watchCover() {
    var on = !!(document.body && document.body.classList.contains('mode-coverflow'));
    if (on && !coverWas && !student() && !ov) {
      var mine = Date.now() - lastInput < 2500;
      if (mine) open('cards-2/index.html', '动态卡片 2.0', toBoardView);
      else if (Date.now() - t0 < 15000) toBoardView();
    }
    coverWas = on;
  }

  function boot() {
    hookDyn(); hookEC6();
    /* 2026-11-25: the 3D Cover view is 1.0's own iTunes-style Cover Flow again; cards-2/ no longer takes it over (watchCover is kept, unused) */
    watchCover();
  }
  /* the modules come later in the page than some entries, and Spatial Home builds its room later still: retry a while */
  var tries = 0, t = setInterval(function () { var d = hookDyn(), e = hookEC6(); if ((d && e) || ++tries > 120) clearInterval(t); }, 500);
  if (document.readyState === 'loading') document.addEventListener('DOMContentLoaded', boot); else boot();

  window.MinestV2Routes = { open: open, close: function () { close(); }, isOpen: function () { return !!ov; }, dyn: dyn, version: '1.1' };
})();

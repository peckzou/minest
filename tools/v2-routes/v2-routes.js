/* Minest · 2.0 routes — the app's own entries open the 2.0 pages in place of 1.0 (tools/v2-routes/patch_v2_routes.py).
   Holo Lab, 3D Type and Clun were already pages in a frame: the patch points their addresses at holo-lab-2/, type3d-2/
   and spatial-home/clun-2/. The three below were drawn by Minest itself; here their entries open the 2.0 page full screen:
     · 动态卡片   the board's 3D Cover view (body.mode-coverflow)  → cards-2/      (on the board you are on)
     · 动态呈现   MinestDrive.gallery() (the 🚗 entries)           → dynamic-2/
     · EC–6 布告栏 the Spatial Home board's panel                  → ec6-board-2/
   The 2.0 pages load the 1.0 scripts as they are, so nothing of 1.0 is removed. World Search and 卡片风格 stay 1.0
   (their 2.0 pages keep data of their own). On the web the pages come from this site; in the app (file:) from the live site. */
(function () {
  'use strict';
  if (window.MinestV2Routes) return;
  var SITE = 'https://minest-app.vercel.app/', ov = null, onClose = null;

  function url(path) { return /^https?:$/.test(location.protocol) ? new URL(path, location.href).href : SITE + path; }
  function css() {
    if (document.getElementById('mn-v2r-css')) return;
    var s = document.createElement('style'); s.id = 'mn-v2r-css';
    s.textContent = '.mn-v2r{position:fixed;inset:0;z-index:2147483646;background:#05070f}' +
      '.mn-v2r iframe{position:absolute;inset:0;width:100%;height:100%;border:0;display:block}' +
      '.mn-v2r-x{position:absolute;left:50%;transform:translateX(-50%);top:calc(env(safe-area-inset-top,0px) + 8px);z-index:2;width:34px;height:34px;border-radius:17px;border:1px solid rgba(255,255,255,.28);' +
      'background:rgba(20,22,30,.55);color:#fff;display:flex;align-items:center;justify-content:center;cursor:pointer;-webkit-backdrop-filter:blur(10px);backdrop-filter:blur(10px);padding:0;opacity:.8}' +
      '.mn-v2r-x:hover{opacity:1}.mn-v2r-x svg{width:16px;height:16px}html.mn-v2r-on{overflow:hidden}html.mn-v2r-on .mn-bdock{visibility:hidden!important}';
    document.head.appendChild(s);
  }
  /* one page at a time; closing (✕, Esc, or the page leaving itself for another address) calls back */
  function open(path, title, done) {
    close(true); css(); onClose = done || null;
    ov = document.createElement('div'); ov.className = 'mn-v2r'; ov.setAttribute('role', 'dialog'); ov.setAttribute('aria-label', title || '2.0');
    var fr = document.createElement('iframe'); fr.title = title || '2.0';
    fr.setAttribute('allow', 'autoplay; fullscreen; camera; microphone; clipboard-write');
    var loads = 0, want = url(path);
    fr.addEventListener('load', function () {
      loads++;
      var p = null; try { p = fr.contentWindow.location.href; } catch (e) {}
      if (p === 'about:blank' && loads === 1) return;
      /* the 2.0 page's own "back" goes to another address (../ or history.back): that means "close" here */
      if (p ? new URL(p).pathname !== new URL(want).pathname : loads > 1) close();
    });
    fr.src = want;
    var x = document.createElement('button'); x.type = 'button'; x.className = 'mn-v2r-x'; x.title = '关闭 · Close'; x.setAttribute('aria-label', '关闭 · Close');
    x.innerHTML = '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.3" stroke-linecap="round" aria-hidden="true"><path d="M6 6l12 12M18 6L6 18"/></svg>';
    /* on press, not click: Minest's page-wide touch handlers take the pointer between down and up, so a click never lands */
    var shut = function (e) { e.stopPropagation(); e.preventDefault(); close(); };
    x.addEventListener('pointerdown', shut); x.addEventListener('click', shut);
    ov.appendChild(fr); ov.appendChild(x); document.body.appendChild(ov);
    ['pointerdown', 'touchstart', 'wheel', 'keydown', 'click'].forEach(function (t) { ov.addEventListener(t, function (e) { e.stopPropagation(); }, { passive: true }); });
    document.documentElement.classList.add('mn-v2r-on');
    try { fr.focus(); } catch (e) {}
  }
  function close(silent) {
    if (!ov) return;
    var o = ov, f = onClose; ov = null; onClose = null;
    try { o.querySelector('iframe').src = 'about:blank'; } catch (e) {}
    o.remove(); document.documentElement.classList.remove('mn-v2r-on');
    if (f && !silent) try { f(); } catch (e) {}
  }
  document.addEventListener('keydown', function (e) { if (ov && e.key === 'Escape') close(); });

  /* ---- 动态呈现: the 🚗 entries call MinestDrive.gallery(); a direct MinestDrive.open(...) from code stays 1.0 */
  function hookDrive() {
    var D = window.MinestDrive; if (!D || D.__v2) return !!D;
    var g0 = D.gallery; D.__v2 = true;
    D.gallery = function () { open('dynamic-2/index.html', '动态呈现 2.0'); };
    D.gallery1 = g0;
    return true;
  }

  /* ---- EC–6 布告栏: the room's board panel (o.panel, set by SpatialEC6.attach) opens 2.0 */
  function hookEC6() {
    var E = window.SpatialEC6; if (!E || E.__v2) return !!E;
    var a0 = E.attach; E.__v2 = true;
    E.attach = function (o) {
      var r = a0.apply(this, arguments);
      if (o) o.panel = function () { return new Promise(function (res) { open('ec6-board-2/index.html', 'EC–6 布告栏 2.0', function () { try { E.paint(); } catch (e) {} res(null); }); }); };
      return r;
    };
    return true;
  }

  /* ---- 动态卡片: the board's 3D Cover view opens 2.0 on the same board; closing returns to the board view.
     Student mode keeps its own 3D Cover (it is that mode's whole screen). */
  var coverWas = false;
  function student() { try { return !!(window.isStudentMode && window.isStudentMode()); } catch (e) { return false; } }
  function setBoard() { try { var b = localStorage.getItem('focusboard_active_id_v7_2'); if (b) localStorage.setItem('minest.cards2.board', JSON.stringify({ b: b, l: '' })); } catch (e) {} }
  function toBoardView() { try { if (window.__setViewMode) window.__setViewMode('board'); else if (window.MinestAI && MinestAI.setViewMode) MinestAI.setViewMode('board'); } catch (e) {} }
  function watchCover() {
    var on = document.body && document.body.classList.contains('mode-coverflow');
    if (on && !coverWas && !student() && !ov) { setBoard(); open('cards-2/index.html', '动态卡片 2.0', toBoardView); }
    coverWas = !!on;
  }

  function boot() {
    hookDrive(); hookEC6();
    if (document.body) new MutationObserver(watchCover).observe(document.body, { attributes: true, attributeFilter: ['class'] });
    watchCover();
  }
  /* the modules come later in the page than some entries, and Spatial Home builds its room later still: retry a while */
  var tries = 0, t = setInterval(function () { var d = hookDrive(), e = hookEC6(); if ((d && e) || ++tries > 120) clearInterval(t); }, 500);
  if (document.readyState === 'loading') document.addEventListener('DOMContentLoaded', boot); else boot();

  window.MinestV2Routes = { open: open, close: close, isOpen: function () { return !!ov; }, version: '1.0' };
})();

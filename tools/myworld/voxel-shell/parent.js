/* 71 · third-party voxel worlds in My World's own shell (tools/myworld/build_world_shells.py): they open straight into
   their engine page — no wrapper nav bar, no overlay back pill — where the Santorini console runs; that console's
   返回 / 一键世界 / 体素世界 reach back here. */
(function () {
  'use strict';
  if (window.MinestWorldShell) return;
  var SHELL = { 'bibury.html': 'bibury/bibury.html', 'downton.html': 'downton/downton.html', 'neuschwanstein.html': 'neuschwanstein/neuschwanstein.html', 'hallstatt.html': 'hallstatt/hallstatt.html', 'venice.html': 'venice.html',
    'hobbiton.html': 'hobbiton.html', 'giethoorn.html': 'giethoorn/index.html', 'lauterbrunnen.html': 'lauterbrunnen/index.html' };
  var SITE = 'https://minest-app.vercel.app/';
  function base() { return /^https?:$/.test(location.protocol) ? '' : SITE; }   // the app's own copy (file://) has no world pages: they load from the site
  var INNER = {}; Object.keys(SHELL).forEach(function (k) { INNER[SHELL[k]] = 1; });
  var PAGE = { hobbiton: ['hobbiton.html', '霍比屯'], bibury: ['bibury.html', '拜伯里'], downton: ['downton.html', '唐顿庄园'], giethoorn: ['giethoorn.html', '羊角村'], hallstatt: ['hallstatt.html', '哈尔施塔特'], lauterbrunnen: ['lauterbrunnen.html', '劳特布龙嫩'], neuschwanstein: ['neuschwanstein.html', '新天鹅堡'], venice: ['venice.html', '威尼斯'] };
  var NATIVE = { alpchalet: 'MinestAlps', admont: 'MinestAdmont', trinity: 'MinestTrinity', study: 'MinestStudy' };
  function adopt(ov) {
    var f = ov.querySelector('iframe'); if (!f || ov.__shell71) return; ov.__shell71 = 1;
    var src = (f.getAttribute('src') || '').split('?')[0].replace(SITE, ''), to = SHELL[src] || (INNER[src] ? src : null);
    if (!to) return;
    ov.classList.add('mn-shelled'); f.setAttribute('src', base() + to + '?myworld=1');
  }
  new MutationObserver(function (list) {
    list.forEach(function (m) { m.addedNodes.forEach(function (n) { if (n.nodeType === 1 && (n.classList.contains('mn-world-3d-overlay') || n.classList.contains('wf-venice'))) adopt(n); }); });
  }).observe(document.body, { childList: true });
  function closeOverlays() { document.querySelectorAll('.mn-world-3d-overlay, .wf-venice').forEach(function (o) { o.remove(); }); }
  function fromWorld(src) { return Array.prototype.some.call(document.querySelectorAll('.mn-world-3d-overlay iframe, .wf-venice iframe'), function (f) { return f.contentWindow === src; }); }
  function openWorld(id, query) {
    closeOverlays();
    var q = query ? (query.charAt(0) === '?' ? query : '?' + query) : '';
    if (PAGE[id] && window.openWorldOverlay3D) return openWorldOverlay3D(PAGE[id][0] + q, PAGE[id][1]);
    if (id === 'santorini') { if (window.MinestEnterSantorini3D) return MinestEnterSantorini3D(); if (window.MinestOia) return MinestOia.open(); }
    var g = NATIVE[id] && window[NATIVE[id]]; if (g && g.open) return g.open();
  }
  window.addEventListener('message', function (e) {
    var d = e.data; if (!d || typeof d !== 'object' || !fromWorld(e.source)) return;   // only the world page open in My World
    if (d.action === 'closeMinest3DOverlay') { document.querySelectorAll('.wf-venice').forEach(function (o) { o.remove(); }); return; }   // the 3D overlay closes itself
    if (d.action === 'minestOpenWorld' && typeof d.id === 'string') openWorld(d.id, d.query);
    if (d.action === 'minestOpenDynamic') {
      closeOverlays();
      if (window.MinestDrive && MinestDrive.gallery) MinestDrive.gallery();
      return;
    }
    if (d.action === 'minestRunData?') { try { e.source.postMessage(runData(), '*'); } catch (x) {} }   // 72 · Knowledge Run: the cards of the board you are on
    if (d.action === 'minestOpenVoxel') {
      closeOverlays();
      if (window.MinestOiaEditor) MinestOiaEditor.ensureContext();
      if (window.MinestVoxel62) Promise.resolve(MinestVoxel62.open({ forceVoxel: true })).catch(function () {});
    }
  });
  function runData() {   // the current board, as the Dynamic presentations read it: its lists, their cards (and a card's stack as its points)
    var A = window.MinestAI, b = null; try { b = (A && A.board && A.board()) || (A && A.boards && A.boards()[0]) || null; } catch (x) {}
    var PAL = ['#3b82f6', '#10b981', '#f59e0b', '#ef4444', '#8b5cf6', '#06b6d4', '#ec4899', '#84cc16'];
    var lists = []; ((b && b.columns) || []).forEach(function (col) {
      if (!col || col.archived) return;
      var items = (col.cards || []).filter(function (c) { return c && !c.archived; }).slice(0, 24).map(function (c) {
        var cv = c.cover && typeof c.cover.value === 'string' && c.cover.value.length < 400000 && !/^(color|gradient)$/.test(c.cover.type) ? c.cover.value : '';
        return { title: c.title || c.term || '', zh: c.titleZh || '', text: c.meaning || c.desc || '', img: cv, sub: (c.stack || []).filter(function (s) { return s && s.title; }).slice(0, 8).map(function (s) { return s.title; }) };
      });
      if (items.length) lists.push({ title: col.title || 'Untitled', color: /^#[0-9a-f]{6}$/i.test(col.color || '') ? col.color : PAL[lists.length % PAL.length], items: items });
    });
    return { action: 'minestRunData', title: (b && b.title) || 'Board', lists: lists.slice(0, 10) };
  }
  var st = document.createElement('style'); st.id = 'mn-world-shell-71-css';
  st.textContent = '.mn-world-3d-overlay.mn-shelled > .mn-back-myworld-btn, .wf-venice.mn-shelled > .wf-venice-x { display:none !important; }';
  document.head.appendChild(st);
  window.MinestWorldShell = { version: '71.1', open: openWorld, closeOverlays: closeOverlays, shelled: function () { return Object.keys(SHELL); } };
})();

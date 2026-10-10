/* Pet Raising — compact motion panel (44.2)
   The motion control sheet used most of the screen (104 motions + sequences + clips + eye + expression,
   ~2,800 px tall). Now: a 340 px drawer at most half the screen high, a search box, collapsible
   sections (closed by default, Expression first and open), and a dense 3-column grid. */
(function () {
  'use strict';
  if (window.__octoPanel2) return;
  window.__octoPanel2 = true;
  var css = [
    '.avatar-control-panel{left:auto!important;right:10px!important;width:min(340px,calc(100vw - 20px))!important;max-height:min(52vh,430px)!important;padding:10px 10px 8px!important;border-radius:18px!important;font-size:12px!important;overflow-y:auto!important;-webkit-overflow-scrolling:touch}',
    '.avatar-control-panel .debug-note{display:none!important}',
    '.avatar-control-panel .avatar-control-header{margin-bottom:6px!important}',
    '.avatar-control-panel .avatar-control-header strong{font-size:13px!important}',
    '.avatar-control-panel .animation-toggle{padding:6px 8px!important;margin:4px 0!important;font-size:11px!important}',
    '.apc-search{width:100%;box-sizing:border-box;margin:2px 0 6px;padding:7px 10px;border-radius:10px;border:1px solid rgba(255,255,255,.14);background:rgba(255,255,255,.07);color:inherit;font:12px -apple-system,system-ui,sans-serif;outline:none}',
    '.avatar-control-panel .debug-section,.avatar-control-panel [data-v6-eye-section]{margin:4px 0!important;padding:0!important;border-top:1px solid rgba(255,255,255,.08)!important}',
    '.avatar-control-panel .debug-section > span:first-child,.avatar-control-panel [data-v6-eye-section] > span:first-child{display:flex!important;justify-content:space-between;align-items:center;cursor:pointer;padding:7px 2px!important;margin:0!important;font-size:10.5px!important;user-select:none;-webkit-user-select:none}',
    '.avatar-control-panel .debug-section > span:first-child:after,.avatar-control-panel [data-v6-eye-section] > span:first-child:after{content:"▾";opacity:.6;transition:transform .2s}',
    '.avatar-control-panel .apc-closed > span:first-child:after{transform:rotate(-90deg)}',
    '.avatar-control-panel .apc-closed > :not(span:first-child){display:none!important}',
    '.avatar-control-panel .debug-grid{display:grid!important;grid-template-columns:repeat(3,minmax(0,1fr))!important;gap:4px!important}',
    '.avatar-control-panel .debug-grid button,.avatar-control-panel [data-v6-eye-row] button{min-height:26px!important;padding:3px 4px!important;font-size:10.5px!important;border-radius:8px!important;line-height:1.15!important}',
    '.avatar-control-panel [data-v6-eye-row]{grid-template-columns:repeat(3,minmax(0,1fr))!important;gap:4px!important}',
    '.avatar-control-panel .apc-hide{display:none!important}',
    'body:has(.avatar-control-panel) #octo-cc-btn,body:has(.avatar-control-panel) #octo-cc-panel{opacity:0!important;pointer-events:none!important}',
    '.avatar-control-panel:not(.apc-dev) .debug-section{display:none!important}',
    '.apc-dev-toggle{display:block;width:100%;margin:8px 0 2px;padding:6px;border:0;border-radius:10px;background:rgba(255,255,255,.06);color:inherit;opacity:.65;font:600 10.5px -apple-system,system-ui,sans-serif}'
  ].join('\n');
  var st = document.createElement('style'); st.textContent = css; (document.head || document.documentElement).appendChild(st);

  function sections(p) { return Array.prototype.slice.call(p.querySelectorAll('.debug-section, [data-v6-eye-section]')); }

  // 44.2 final motion list: one curated set (the raw 104-motion lists had duplicates and debug variants)
  function A() { return window.__octopusAvatar; }
  var backTimer = 0;
  function gesture(id) {               // a one-off body motion, then back to swimming
    var av = A(); if (!av) return;
    if (av.playReferenceMotion) av.playReferenceMotion(id);
    clearTimeout(backTimer); backTimer = setTimeout(function () { var a = A(); if (a && a.playAction) a.playAction('free_swim_aquarium'); }, 3000);
  }
  function swimClip(id) {              // swim styles keep the swim path going
    var av = A(); if (!av) return;
    if (!av.freeSwimActive && av.playAction) av.playAction('free_swim_aquarium');
    try { av.referenceMotion.play(id); } catch (e) {}
  }
  function mouth(c) { var m = window.__octoMouth; if (m && m.play) m.play(c); }
  function lids(c) { var l = window.__octoLids; if (l && l.play) l.play(c); }
  function spin(k) { var m = window.__motionV4; if (m && m.spin) m.spin(k); }
  var FINAL = [
    ['Swim', [['Free swim', function () { var a = A(); a && a.playAction && a.playAction('free_swim_aquarium'); }], ['Glide', function () { swimClip('swim_glide'); }], ['Dash', function () { swimClip('swim_dash'); }],
      ['Roll swim', function () { swimClip('swim_roll'); }], ['Zigzag', function () { swimClip('swim_zigzag'); }], ['Hover', function () { swimClip('swim_hover'); }], ['Backstroke', function () { swimClip('swim_backstroke'); }], ['Brake', function () { swimClip('swim_brake'); }]]],
    ['Spin', [['Pirouette', function () { spin('pirouette'); }], ['Barrel roll', function () { spin('barrel'); }], ['Corkscrew', function () { spin('corkscrew'); }], ['Loop', function () { spin('loop'); }], ['Wiggle', function () { spin('wiggle'); }]]],
    ['Gestures', [['Wave', function () { gesture('tip_wave_right'); }], ['Peek', function () { gesture('peek_around'); }], ['Double take', function () { gesture('double_take'); }], ['Nod', function () { gesture('agree_nod'); }],
      ['Shake head', function () { gesture('no_shake'); }], ['Tentacle fan', function () { gesture('tentacle_fan'); }], ['Big bounce', function () { gesture('big_bounce'); }], ['Tiny bounce', function () { gesture('tiny_bounce'); }],
      ['Stretch', function () { gesture('stretch_release'); }], ['Deep breath', function () { gesture('breath_deep'); }], ['Shiver', function () { gesture('shiver'); }], ['Shy', function () { gesture('tentacle_fold'); }], ['Proud', function () { gesture('settle_proud'); }]]],
    ['Life', [['Happy', function () { gesture('happy'); }], ['Petted', function () { gesture('petted'); }], ['Curious', function () { gesture('curious'); }], ['Sleepy', function () { gesture('sleepy'); }],
      ['Wake up', function () { gesture('wake'); }], ['Eat', function () { gesture('fed'); }], ['Sad', function () { gesture('sad'); }], ['Go home to sleep', function () { var h = window.__octoHouse; h && h.goHome(); }]]],
    ['Mouth', [['Giggle', function () { mouth('giggle'); }], ['Wheee', function () { mouth('wheee'); }], ['Yawn', function () { mouth('yawn'); lids('yawn'); }], ['Puff', function () { mouth('puff'); }],
      ['Hum', function () { mouth('hum'); }], ['Gasp', function () { mouth('gasp'); lids('gasp'); }], ['Munch', function () { mouth('munch'); }], ['Pout', function () { mouth('pout'); }]]],
    ['Eyes', [['Blink', function () { lids('blink'); }], ['Wink', function () { lids('wink'); }], ['Happy eyes', function () { lids('happy'); }], ['Sleepy eyes', function () { lids('sleepy'); }],
      ['Wide eyes', function () { lids('gasp'); }], ['Dizzy', function () { lids('dizzy'); }], ['Love', function () { lids('love'); }]]]
  ];
  function buildFinal(p) {
    var anchor = p.querySelector('[data-expr-section]') || p.querySelector('.apc-search');
    var frag = document.createDocumentFragment();
    FINAL.forEach(function (grp, gi) {
      var sec = document.createElement('div'); sec.className = 'apc-final'; sec.setAttribute('data-v6-eye-section', 'true'); sec.__apcInit = true;
      if (gi > 0) sec.classList.add('apc-closed');
      var t = document.createElement('span'); t.textContent = grp[0] + ' · ' + grp[1].length; sec.appendChild(t);
      var row = document.createElement('div'); row.setAttribute('data-v6-eye-row', 'final');
      grp[1].forEach(function (it) {
        var b = document.createElement('button'); b.type = 'button'; b.textContent = it[0];
        b.addEventListener('click', function (e) { e.preventDefault(); e.stopPropagation(); it[1](); });
        row.appendChild(b);
      });
      sec.appendChild(row); frag.appendChild(sec);
    });
    if (anchor && anchor.nextSibling) p.insertBefore(frag, anchor.nextSibling); else p.appendChild(frag);
    var dev = document.createElement('button'); dev.type = 'button'; dev.className = 'apc-dev-toggle'; dev.textContent = 'Developer: all motions ▸';
    dev.addEventListener('click', function (e) { e.preventDefault(); e.stopPropagation(); p.classList.toggle('apc-dev'); dev.textContent = p.classList.contains('apc-dev') ? 'Developer: all motions ▾' : 'Developer: all motions ▸'; });
    p.appendChild(dev);
  }
  function setup(p) {
    if (p.__apc) { order(p); return; }
    p.__apc = true;
    var header = p.querySelector('.avatar-control-header');
    var search = document.createElement('input'); search.className = 'apc-search'; search.type = 'search'; search.placeholder = 'Search motions';
    search.addEventListener('input', function () { filter(p, search.value.trim().toLowerCase()); });
    ['pointerdown', 'keydown'].forEach(function (ev) { search.addEventListener(ev, function (e) { e.stopPropagation(); }); });
    if (header && header.nextSibling) p.insertBefore(search, header.nextSibling); else p.appendChild(search);
    p.addEventListener('click', function (e) {
      var t = e.target && e.target.closest ? e.target.closest('.debug-section > span:first-child, [data-v6-eye-section] > span:first-child') : null;
      if (!t || !p.contains(t)) return;
      t.parentElement.classList.toggle('apc-closed');
    });
    order(p);
    buildFinal(p);
  }
  // Expression first and open; everything else closed until opened (remembered while the panel lives)
  function order(p) {
    var search = p.querySelector('.apc-search');
    sections(p).forEach(function (s) {
      if (s.__apcInit) return;
      s.__apcInit = true;
      var isExpr = s.hasAttribute('data-expr-section');
      if (!isExpr) s.classList.add('apc-closed');
      else if (search) p.insertBefore(s, search.nextSibling);
    });
  }
  function filter(p, q) {
    sections(p).forEach(function (s) {
      var any = false;
      s.querySelectorAll('button').forEach(function (b) {
        var hit = !q || (b.textContent || '').toLowerCase().indexOf(q) >= 0;
        b.classList.toggle('apc-hide', !hit); if (hit) any = true;
      });
      s.classList.toggle('apc-hide', !!q && !any);
      if (q && any) s.classList.remove('apc-closed');
    });
  }
  new MutationObserver(function () { var p = document.querySelector('.avatar-control-panel'); if (p) setup(p); })
    .observe(document.documentElement, { childList: true, subtree: true });
})();

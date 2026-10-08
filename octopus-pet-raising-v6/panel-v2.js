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
    ['游动', [['自由游', function () { var a = A(); a && a.playAction && a.playAction('free_swim_aquarium'); }], ['滑行', function () { swimClip('swim_glide'); }], ['冲刺', function () { swimClip('swim_dash'); }],
      ['翻滚游', function () { swimClip('swim_roll'); }], ['之字游', function () { swimClip('swim_zigzag'); }], ['悬停', function () { swimClip('swim_hover'); }], ['仰泳', function () { swimClip('swim_backstroke'); }], ['急停', function () { swimClip('swim_brake'); }]]],
    ['自转', [['转圈', function () { spin('pirouette'); }], ['侧滚翻', function () { spin('barrel'); }], ['螺旋转', function () { spin('corkscrew'); }], ['空翻', function () { spin('loop'); }], ['扭身', function () { spin('wiggle'); }]]],
    ['动作', [['挥手', function () { gesture('tip_wave_right'); }], ['张望', function () { gesture('peek_around'); }], ['回头看', function () { gesture('double_take'); }], ['点头', function () { gesture('agree_nod'); }],
      ['摇头', function () { gesture('no_shake'); }], ['触手扇', function () { gesture('tentacle_fan'); }], ['大跳', function () { gesture('big_bounce'); }], ['小跳', function () { gesture('tiny_bounce'); }],
      ['伸懒腰', function () { gesture('stretch_release'); }], ['深呼吸', function () { gesture('breath_deep'); }], ['发抖', function () { gesture('shiver'); }], ['害羞', function () { gesture('tentacle_fold'); }], ['得意', function () { gesture('settle_proud'); }]]],
    ['生活', [['开心', function () { gesture('happy'); }], ['被摸', function () { gesture('petted'); }], ['好奇', function () { gesture('curious'); }], ['困了', function () { gesture('sleepy'); }],
      ['醒来', function () { gesture('wake'); }], ['吃东西', function () { gesture('fed'); }], ['难过', function () { gesture('sad'); }], ['回家睡觉', function () { var h = window.__octoHouse; h && h.goHome(); }]]],
    ['嘴巴', [['咯咯笑', function () { mouth('giggle'); }], ['哇——', function () { mouth('wheee'); }], ['打哈欠', function () { mouth('yawn'); lids('yawn'); }], ['吐泡泡', function () { mouth('puff'); }],
      ['哼歌', function () { mouth('hum'); }], ['吃惊', function () { mouth('gasp'); lids('gasp'); }], ['嚼嚼', function () { mouth('munch'); }], ['嘟嘴', function () { mouth('pout'); }]]],
    ['眼睛', [['眨眼', function () { lids('blink'); }], ['单眼眨', function () { lids('wink'); }], ['笑眯眼', function () { lids('happy'); }], ['困眼', function () { lids('sleepy'); }],
      ['瞪大', function () { lids('gasp'); }], ['晕乎乎', function () { lids('dizzy'); }], ['喜欢你', function () { lids('love'); }]]]
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
    var dev = document.createElement('button'); dev.type = 'button'; dev.className = 'apc-dev-toggle'; dev.textContent = '开发者：全部动作 ▸';
    dev.addEventListener('click', function (e) { e.preventDefault(); e.stopPropagation(); p.classList.toggle('apc-dev'); dev.textContent = p.classList.contains('apc-dev') ? '开发者：全部动作 ▾' : '开发者：全部动作 ▸'; });
    p.appendChild(dev);
  }
  function setup(p) {
    if (p.__apc) { order(p); return; }
    p.__apc = true;
    var header = p.querySelector('.avatar-control-header');
    var search = document.createElement('input'); search.className = 'apc-search'; search.type = 'search'; search.placeholder = '搜索动作 · Search motions';
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

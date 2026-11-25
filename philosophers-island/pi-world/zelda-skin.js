/* Philosophers' Island HUD in the same look as the park's (theme-park-island/tp-world/zelda-keys.js), 2026-11-25:
 * every key is a dark glass disc in a cream double ring with a line icon (no emoji), panels are dark glass with a thin
 * cream rule, and a small fold key tucks the journey panel and the bottom bar away (the interact key, the joystick
 * and the map stay; remembered on the device). Only the look and the places change; what each key does is app.js's. */
(function (root) {
  'use strict';
  var C = '#f3ecd6', R = document.documentElement;
  var I = {
    up: '<path d="M5 4h14M12 20V8M7 13l5-5 5 5"/>',
    down: '<path d="M5 20h14M12 4v12M7 11l5 5 5-5"/>',
    fly: '<path d="M3 10c3-3.6 15-3.6 18 0"/><path d="M3 10l9 7 9-7M8.5 10.6 12 17l3.5-6.4"/><path d="M12 17v3.5"/>',
    spark: '<path d="M12 3l1.8 5.2L19 10l-5.2 1.8L12 17l-1.8-5.2L5 10l5.2-1.8z"/><path d="M19 15.5l.8 2.2 2.2.8-2.2.8-.8 2.2-.8-2.2-2.2-.8 2.2-.8z"/>',
    compass: '<circle cx="12" cy="12" r="8.5"/><path d="M15.5 8.5l-2 5-5 2 2-5z"/><circle cx="12" cy="12" r=".6"/>',
    walk: '<circle cx="13" cy="4.5" r="1.8"/><path d="M10 21l2-6 2.5 2V21M9 11.5l2-4 3 1 2 3.5M11 7.5 9.5 13.5"/>',
    bird: '<path d="M3 13c3 0 5-2 7-5 1 3 3 5 6 5l5-3-2 5c-2 3-6 4-9 3l-3 3v-4c-2-1-3-2-4-4z"/>',
    tour: '<rect x="3" y="7.5" width="13" height="10" rx="2"/><path d="M16 11l5-3v9l-5-3"/>',
    sun: '<circle cx="12" cy="12" r="4"/><path d="M12 2.5v2.5M12 19v2.5M2.5 12H5M19 12h2.5M5.3 5.3l1.8 1.8M16.9 16.9l1.8 1.8M5.3 18.7l1.8-1.8M16.9 7.1l1.8-1.8"/>',
    scales: '<path d="M12 4v16M8 20h8M5 7h14M12 4.5l-.01 0"/><path d="M5 7l-3 6a3 3 0 0 0 6 0zM19 7l-3 6a3 3 0 0 0 6 0z"/>',
    mark: '<path d="M7 3.5h10v17l-5-3.5-5 3.5z"/>',
    help: '<circle cx="12" cy="12" r="8.5"/><path d="M9.6 9.3a2.5 2.5 0 1 1 3.4 2.3c-.7.3-1 .8-1 1.5v.6M12 16.6v.2"/>',
    temple: '<path d="M3 9.5 12 4l9 5.5M4 20h16M5.5 17.5h13M6.5 10.5v7M10 10.5v7M14 10.5v7M17.5 10.5v7"/>',
    board: '<rect x="5" y="4.5" width="14" height="16" rx="2"/><path d="M9 3.5h6v3H9zM8.5 11h7M8.5 14.5h7M8.5 18h4"/>',
    note: '<path d="M6 3.5h11a1 1 0 0 1 1 1v15a1 1 0 0 1-1 1H6z"/><path d="M6 3.5v17M9.5 8h5.5M9.5 11.5h5.5"/>',
    book: '<path d="M4 5.5c3-1.5 6-1.5 8 .5 2-2 5-2 8-.5V19c-3-1.5-6-1.5-8 .5-2-2-5-2-8-.5z"/><path d="M12 6v13.5"/>',
    go: '<path d="M5 6l7 6-7 6zM12 6l7 6-7 6z"/>',
    again: '<path d="M4 12a8 8 0 1 0 2.4-5.7M4 4v4.5h4.5"/>',
    fold: '<path d="M14 6l-6 6 6 6"/>'
  };
  function ic(k) { return '<svg viewBox="0 0 24 24" aria-hidden="true">' + I[k] + '</svg>'; }
  var SLOT = ['compass', 'walk', 'bird', 'tour', 'sun', 'scales', 'mark', 'help'];
  var QB = { board: 'board', book: 'note', hb: 'book', go: 'go', again: 'again' };
  var GLASS = 'background:radial-gradient(circle at 50% 30%,rgba(34,38,40,.66),rgba(6,8,10,.76))!important;border:1px solid rgba(243,236,214,.55)!important;box-shadow:inset 0 0 0 2px rgba(6,8,10,.5),inset 0 0 0 3px rgba(243,236,214,.14),0 6px 22px rgba(0,0,0,.4)!important;color:' + C + '!important';
  var KEY = 'border-radius:50%!important;border:1.5px solid rgba(243,236,214,.85)!important;background:radial-gradient(circle at 50% 38%,rgba(40,44,46,.62),rgba(6,8,10,.72))!important;' +
    'box-shadow:inset 0 0 0 3px rgba(6,8,10,.55),inset 0 0 0 4px rgba(243,236,214,.22),0 3px 12px rgba(0,0,0,.45)!important;color:' + C + '!important;display:flex!important;align-items:center;justify-content:center;flex-direction:column;padding:0!important';
  var PRESS = 'transform:scale(.93);border-color:#ffe7a3!important;color:#fff3cc!important;box-shadow:inset 0 0 0 3px rgba(6,8,10,.55),inset 0 0 0 4px rgba(255,231,163,.45),0 0 14px rgba(255,214,120,.55)!important';
  var SVG = 'fill:none;stroke:currentColor;stroke-width:1.7;stroke-linecap:round;stroke-linejoin:round;filter:drop-shadow(0 1px 1.5px rgba(0,0,0,.8))';
  var F = '"Avenir Next","Helvetica Neue","PingFang SC",sans-serif';
  var css = document.createElement('style'); css.id = 'pi-zelda-css';
  css.textContent =
    /* panels */
    '#title-card{' + GLASS + ';border-radius:12px!important;padding:6px 12px!important;font-family:' + F + '}#title b{color:' + C + '!important;letter-spacing:.06em!important;font-weight:600!important}' +
    '#title-card .zs-i{display:inline-flex;width:18px;height:18px;vertical-align:-3px}#title-card svg,#pi-quest button svg{width:100%;height:100%;' + SVG + '}' +
    '#title-card [id*="journal"],#title-card .pill,#title-card button{font-family:' + F + '}' +
    '#pi-quest{' + GLASS + ';border-radius:12px!important;font-family:' + F + ';text-shadow:0 1px 2px rgba(0,0,0,.8)}' +
    '#pi-quest .q-step{color:#e9d9a6!important;letter-spacing:.16em!important}#pi-quest .q-title{color:' + C + ';letter-spacing:.04em}#pi-quest .q-desc{color:rgba(243,236,214,.78)!important}#pi-quest .q-nav{color:#e9d9a6!important}' +
    '#pi-quest .q-dots span{background:rgba(243,236,214,.18)!important}#pi-quest .q-dots span.on{background:#e9c46a!important}' +
    '#pi-quest button{display:inline-flex;align-items:center;justify-content:center;gap:6px;background:rgba(243,236,214,.05)!important;border:1px solid rgba(243,236,214,.35)!important;border-radius:6px!important;color:' + C + '!important;font-weight:500!important;letter-spacing:.06em}' +
    '#pi-quest button:active,#pi-quest button:hover{border-color:#ffe7a3!important;background:rgba(255,231,163,.12)!important}#pi-quest button .zs-i{display:inline-flex;width:15px;height:15px;flex:none}' +
    '#pi-quest button *,#hotbar .slot svg,.tbtn *{pointer-events:none}' +
    '#pi-quest button{white-space:nowrap;padding:5px 6px!important;font-size:11.5px!important}#pi-quest .q-tools{gap:5px!important}' +
    '#compass-top-btn{background:rgba(233,196,106,.14)!important;border:1px solid rgba(233,196,106,.85)!important;color:#f6e7b8!important;box-shadow:none!important;text-shadow:0 1px 2px #000;font-family:' + F + '!important;font-weight:600!important;letter-spacing:.06em}' +
    '#pi-quest .q-fold{border:0!important;background:transparent!important;color:#e9d9a6!important}' +
    '#mmWrap{' + GLASS + ';border-radius:12px!important}#mmWrap canvas{border-radius:8px}#timeBox{color:' + C + '!important;font-family:' + F + '}#timeBox input{accent-color:#e9c46a!important}' +
    /* the bottom bar */
    '#hotbar{background:rgba(6,8,10,.5)!important;border:1px solid rgba(243,236,214,.35)!important;padding:5px 8px!important;gap:7px!important;box-shadow:0 6px 22px rgba(0,0,0,.35)}' +
    '#hotbar .slot{width:40px;height:40px;' + KEY + ';font-size:0!important;transition:transform .12s,border-color .15s,box-shadow .15s}#hotbar .slot svg{width:54%;height:54%;' + SVG + '}' +
    '#hotbar .slot:hover{transform:translateY(-2px)}#hotbar .slot.on{' + PRESS + ';transform:none}#hotbar .slot em{font-size:11px!important;background:rgba(6,8,10,.88)!important;color:' + C + '!important;border-color:rgba(243,236,214,.4)!important}' +
    /* touch keys: right-hand cluster, the interact key the largest */
    '#joy{background:rgba(8,10,12,.4)!important;border:1.5px solid rgba(243,236,214,.7)!important;box-shadow:0 0 0 4px rgba(0,0,0,.2)}#joy i{background:radial-gradient(circle at 40% 35%,#fbf6e6,#cfc6aa)!important;box-shadow:0 2px 8px rgba(0,0,0,.5)}' +
    '.tbtn{' + KEY + ';font-size:0!important;width:46px!important;height:46px!important}.tbtn svg{width:52%;height:52%;' + SVG + '}.tbtn:active,.tbtn.on{' + PRESS + '}' +
    '#tUse{width:62px!important;height:62px!important;border-width:2px!important;border-color:rgba(255,214,150,.95)!important;background:radial-gradient(circle at 50% 38%,rgba(70,46,24,.72),rgba(20,10,4,.8))!important;right:calc(22px + env(safe-area-inset-right))!important;bottom:calc(104px + env(safe-area-inset-bottom))!important}' +
    '#tUse svg{width:46%;height:46%}#tUse span{font:600 10px/1 ' + F + ';letter-spacing:.12em;margin-top:2px;text-shadow:0 1px 2px #000}' +
    '#tJump{right:calc(98px + env(safe-area-inset-right))!important;bottom:calc(150px + env(safe-area-inset-bottom))!important}' +
    '#tFly{right:calc(106px + env(safe-area-inset-right))!important;bottom:calc(96px + env(safe-area-inset-bottom))!important}' +
    '#tDown{right:calc(92px + env(safe-area-inset-right))!important;bottom:calc(42px + env(safe-area-inset-bottom))!important}' +
    '#zs-fold{position:fixed;z-index:30;width:30px;height:30px;right:calc(36px + env(safe-area-inset-right));bottom:calc(186px + env(safe-area-inset-bottom));' + KEY + ';pointer-events:auto;cursor:pointer;transition:transform .2s}' +
    '#zs-fold svg{width:58%;height:58%;' + SVG + ';transition:transform .25s}html.zs-min #zs-fold svg{transform:rotate(180deg)}#zs-fold:active{' + PRESS + '}' +
    'body:not(.touch) #zs-fold{right:calc(16px + env(safe-area-inset-right));bottom:calc(14px + env(safe-area-inset-bottom))}' +
    /* tucked away */
    '#pi-quest,#hotbar{transition:opacity .2s,transform .2s}html.zs-min #pi-quest,html.zs-min #hotbar{opacity:0!important;pointer-events:none!important}html.zs-min #hotbar{transform:translateX(-50%) translateY(20px)!important}' +
    'html.zs-min #tJump,html.zs-min #tDown,html.zs-min #tFly{opacity:0!important;pointer-events:none!important}.tbtn{transition:opacity .2s,transform .12s}' +
    'body.pi-cine #zs-fold{display:none}';
  document.head.appendChild(css);

  var min = false; try { min = localStorage.getItem('pi.hud.min') === '1'; } catch (e) {} R.classList.toggle('zs-min', min);
  var EMO = /^[\s←-⯿☀-➿️‍]*(?:[\uD83C-\uD83E][\uDC00-\uDFFF][️‍]*)*\s*/;
  function strip(t) { return String(t || '').replace(EMO, '').trim(); }
  function dressQuest() {
    var q = document.getElementById('pi-quest'); if (!q) return;
    [].forEach.call(q.querySelectorAll('button[data-q]'), function (b) {
      var k = QB[b.dataset.q]; if (!k || b.dataset.zs) return; b.dataset.zs = '1';
      b.innerHTML = '<span class="zs-i">' + ic(k) + '</span>' + strip(b.textContent);
    });
  }
  function dressTitle() {
    var t = document.getElementById('title-card'); if (!t || t.dataset.zs) return;
    var w = document.createTreeWalker(t, NodeFilter.SHOW_TEXT), n, hit = 0;
    while ((n = w.nextNode())) {
      var v = n.nodeValue, k = /🏛/.test(v) ? 'temple' : /🧭/.test(v) ? 'compass' : null; if (!k) continue;
      var s = document.createElement('span'); s.className = 'zs-i'; s.innerHTML = ic(k); var rest = v.replace(/🏛️?|🧭/g, '');
      n.parentNode.insertBefore(s, n); n.nodeValue = rest; hit++;
    }
    if (hit) t.dataset.zs = '1';
  }
  function dressBar() {
    var hb = document.getElementById('hotbar'); if (!hb) return;
    [].forEach.call(hb.querySelectorAll('.slot'), function (el, i) {
      if (el.dataset.zs || !SLOT[i]) return; el.dataset.zs = '1';
      var em = el.querySelector('em'), sm = el.querySelector('small');
      el.innerHTML = ''; if (sm) el.appendChild(sm); el.insertAdjacentHTML('beforeend', ic(SLOT[i])); if (em) el.appendChild(em);
    });
  }
  function dressTouch() {
    var map = { tJump: 'up', tDown: 'down', tFly: 'fly', tUse: 'spark' };
    Object.keys(map).forEach(function (id) { var b = document.getElementById(id); if (!b || b.dataset.zs) return; b.dataset.zs = '1'; b.innerHTML = ic(map[id]) + (id === 'tUse' ? '<span>互动</span>' : ''); });
    if (!document.getElementById('zs-fold')) {
      var f = document.createElement('button'); f.type = 'button'; f.id = 'zs-fold'; f.setAttribute('aria-label', '收起 / 展开面板'); f.title = '收起面板'; f.innerHTML = ic('fold');
      ['mousedown', 'touchstart', 'pointerdown'].forEach(function (ev) { f.addEventListener(ev, function (e) { e.stopPropagation(); }, { passive: true }); });
      f.addEventListener('click', function (e) { e.stopPropagation(); min = !R.classList.contains('zs-min'); R.classList.toggle('zs-min', min); f.title = min ? '展开面板' : '收起面板'; try { localStorage.setItem('pi.hud.min', min ? '1' : '0'); } catch (x) {} });
      document.body.appendChild(f);
    }
  }
  function run() { try { dressTitle(); dressQuest(); dressBar(); dressTouch(); } catch (e) {} }
  var q = false; function tick() { if (q) return; q = true; requestAnimationFrame(function () { q = false; run(); }); }
  run(); if (root.MutationObserver) new MutationObserver(tick).observe(document.body, { childList: true, subtree: true });
})(window);

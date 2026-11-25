/* The park's quick buttons in one look (2026-11-25): the touch keys (rise, descend, fly, day/night, interact) and the
 * HUD's quick keys (balloon, bag, view, log) and its menu key all become the same round key — a dark glass disc in a
 * cream double ring with a line icon of its own (no emoji, no letters) — and sit in two arcs round the round map in
 * the bottom-right corner, so they take only that corner. A small fold key tucks them away: the map, the interact
 * key and the joystick stay (remembered on the device). Only the layout of the full screen is changed here; the iPhone
 * Duo's cover screen and half-folded layouts (duo.js) keep their own places and get the new look. */
(function (root) {
  'use strict';
  var C = '#f3ecd6', R = document.documentElement;
  var I = {
    up: '<path d="M5 4h14M12 20V8M7 13l5-5 5 5"/>',
    down: '<path d="M5 20h14M12 4v12M7 11l5 5 5-5"/>',
    fly: '<path d="M3 10c3-3.6 15-3.6 18 0"/><path d="M3 10l9 7 9-7M8.5 10.6 12 17l3.5-6.4"/><path d="M12 17v3.5"/>',
    sun: '<circle cx="12" cy="12" r="4"/><path d="M12 2.5v2.5M12 19v2.5M2.5 12H5M19 12h2.5M5.3 5.3l1.8 1.8M16.9 16.9l1.8 1.8M5.3 18.7l1.8-1.8M16.9 7.1l1.8-1.8"/>',
    hand: '<path d="M8 13V6.5a1.5 1.5 0 0 1 3 0V11M11 11V4.5a1.5 1.5 0 0 1 3 0V11M14 11V6.5a1.5 1.5 0 0 1 3 0V14c0 4-2.6 7-6.2 7-2.6 0-4.3-1.4-5.6-3.6L3.4 14a1.6 1.6 0 0 1 2.5-1.9L8 14.2"/>',
    balloon: '<path d="M12 3a6 6 0 0 1 6 6c0 4-3.3 7.2-6 7.2S6 13 6 9a6 6 0 0 1 6-6z"/><path d="M11 16.2h2l-.6 1.8h-.8zM12 18v3.5"/><path d="M9.2 6.4c-.9 1-1.2 2.2-1 3.4"/>',
    bag: '<path d="M6 9h12l-1 11H7z"/><path d="M9 9V7a3 3 0 0 1 6 0v2M9.5 13h5"/>',
    view: '<rect x="3" y="7.5" width="13" height="10" rx="2"/><path d="M16 11l5-3v9l-5-3"/>',
    log: '<path d="M6 4h9a3 3 0 0 1 3 3v13H9a3 3 0 0 1-3-3z"/><path d="M6 17a3 3 0 0 1 3-3h9M9.5 8h5M9.5 11h4"/>',
    plus: '<path d="M12 5v14M5 12h14"/>',
    fold: '<path d="M14 6l-6 6 6 6"/>'
  };
  function ic(k) { return '<svg viewBox="0 0 24 24" aria-hidden="true">' + I[k] + '</svg>'; }

  /* where each key sits: on arcs round the map's centre (right 94px, bottom 94px from the corner), angle from the left
     horizontal upwards; [radius, angle°, size] */
  var AT = { use: [120, -10, 62], up: [110, 26, 44], down: [110, 51, 44], fly: [110, 76, 44], sun: [110, 101, 44],
    balloon: [170, 18, 40], bag: [170, 37, 40], view: [170, 56, 40], log: [170, 75, 40], menu: [170, 94, 40], fold: [170, 113, 30] };
  function at(k) { var a = AT[k], t = a[1] * Math.PI / 180, r = 94 + a[0] * Math.cos(t) - a[2] / 2, b = 94 + a[0] * Math.sin(t) - a[2] / 2;
    return 'right:calc(env(safe-area-inset-right,0px) + ' + r.toFixed(0) + 'px)!important;bottom:calc(env(safe-area-inset-bottom,0px) + ' + b.toFixed(0) + 'px)!important;width:' + a[2] + 'px!important;height:' + a[2] + 'px!important'; }
  var FULL = 'html:not(.duo-outer):not(.duo-halfopen) ';
  var css = document.createElement('style'); css.id = 'zl-keys-css';
  css.textContent =
    /* the one key */
    '.zk{border-radius:50%!important;border:1.5px solid rgba(243,236,214,.85)!important;background:radial-gradient(circle at 50% 38%,rgba(40,44,46,.62),rgba(6,8,10,.72))!important;' +
    'box-shadow:inset 0 0 0 3px rgba(6,8,10,.55),inset 0 0 0 4px rgba(243,236,214,.22),0 3px 12px rgba(0,0,0,.45)!important;color:' + C + '!important;padding:0!important;display:flex!important;align-items:center;justify-content:center;flex-direction:column;' +
    'font:600 10px/1 "Avenir Next","PingFang SC",sans-serif!important;letter-spacing:.08em;text-shadow:0 1px 2px #000;cursor:pointer;-webkit-tap-highlight-color:transparent;transition:transform .12s,border-color .15s,box-shadow .15s;line-height:1!important}' +
    '.zk svg{width:52%;height:52%;fill:none;stroke:currentColor;stroke-width:1.7;stroke-linecap:round;stroke-linejoin:round;filter:drop-shadow(0 1px 1.5px rgba(0,0,0,.8))}' +
    '.zk:active,.zk.on{transform:scale(.93);border-color:#ffe7a3!important;color:#fff3cc!important;box-shadow:inset 0 0 0 3px rgba(6,8,10,.55),inset 0 0 0 4px rgba(255,231,163,.45),0 0 14px rgba(255,214,120,.55)!important}' +
    '.zk.zk-use{border-width:2px!important;background:radial-gradient(circle at 50% 38%,rgba(70,40,30,.7),rgba(20,8,6,.78))!important;border-color:rgba(255,214,150,.95)!important}.zk.zk-use svg{width:44%;height:44%;margin-bottom:2px}' +
    '.zk.zk-use span{font-size:10px;letter-spacing:.12em}' +
    '.zk.zk-fold svg{width:58%;height:58%;transition:transform .25s}html.zl-min .zk.zk-fold svg{transform:rotate(180deg)}' +
    /* the HUD's own menu key: a key now, with no word beside it */
    '#zl-plus.zk span,#zl-plus.zk > i{display:none!important}' +
    /* the full screen: two arcs round the map */
    FULL + 'body.game-on #mnt-btns{position:fixed!important;right:0!important;bottom:0!important;width:0!important;height:0!important;display:block!important}' +
    FULL + '#mnt-btns .zk,' + FULL + '#zl-pad .zk,' + FULL + '#zl .zk-pos{position:fixed!important;left:auto!important;top:auto!important;margin:0!important;grid-column:auto!important}' +
    FULL + '#zl-pad{position:fixed!important;right:0!important;bottom:0!important;width:0!important;height:0!important}' +
    FULL + '#zl-plus{position:fixed!important;left:auto!important;top:auto!important;gap:0!important}' +
    Object.keys(AT).map(function (k) { return FULL + '.zk[data-zk="' + k + '"]{' + at(k) + '}'; }).join('') +
    /* tucked away: only the map, interact, the fold key and the joystick */
    'html.zl-min .zk:not([data-zk="use"]):not([data-zk="fold"]){opacity:0!important;pointer-events:none!important;transform:scale(.6)!important}' +
    '.zk{transition:transform .2s,opacity .2s,border-color .15s,box-shadow .15s}' +
    'html.duo-outer .zk[data-zk="fold"],html.duo-halfopen .zk[data-zk="fold"]{display:none!important}html.duo-outer.zl-min .zk,html.duo-halfopen.zl-min .zk{opacity:1!important;pointer-events:auto!important;transform:none!important}' +
    'body.ride-on .zk[data-zk="fold"],body.cine-on .zk[data-zk="fold"],body.zm-on .zk[data-zk="fold"]{display:none!important}';
  document.head.appendChild(css);

  var min = false; try { min = localStorage.getItem('tp.keys.min') === '1'; } catch (e) {} R.classList.toggle('zl-min', min);
  function dress(el, k, label, extra) { if (!el || el.dataset.zk) return; el.dataset.zk = k; el.classList.add('zk'); if (extra) el.classList.add(extra); el.innerHTML = ic(k === 'use' ? 'hand' : k === 'menu' ? 'plus' : k) + (label ? '<span>' + label + '</span>' : ''); }
  function run() {
    var b = document.getElementById('mnt-btns');
    if (b) { var L = b.querySelectorAll('button'); dress(L[0], 'up'); dress(L[1], 'down'); dress(L[2], 'fly'); dress(L[3], 'sun'); var u = b.querySelector('button.use') || L[4]; dress(u, 'use', '互动', 'zk-use'); }
    var p = document.getElementById('zl-pad');
    if (p) { dress(p.querySelector('[data-a="fly"]'), 'balloon'); dress(p.querySelector('[data-a="bag"]'), 'bag'); dress(p.querySelector('[data-a="view"]'), 'view'); dress(p.querySelector('[data-a="log"]'), 'log'); }
    var m = document.getElementById('zl-plus'); if (m && !m.dataset.zk) { m.dataset.zk = 'menu'; m.classList.add('zk', 'zk-pos'); m.insertAdjacentHTML('afterbegin', ic('plus')); m.setAttribute('aria-label', '菜单'); m.title = '菜单 (+)'; }
    var hud = document.getElementById('zl');
    if (hud && !document.getElementById('zl-fold')) {
      var f = document.createElement('button'); f.type = 'button'; f.id = 'zl-fold'; f.className = 'zk zk-pos zk-fold'; f.dataset.zk = 'fold'; f.setAttribute('aria-label', '收起 / 展开按钮'); f.title = '收起按钮'; f.innerHTML = ic('fold');
      f.style.pointerEvents = 'auto';
      f.addEventListener('click', function (e) { e.stopPropagation(); min = !R.classList.contains('zl-min'); R.classList.toggle('zl-min', min); f.title = min ? '展开按钮' : '收起按钮'; try { localStorage.setItem('tp.keys.min', min ? '1' : '0'); } catch (x) {} });
      hud.appendChild(f);
    }
    return b && p && m && document.getElementById('zl-fold');
  }
  var n = 0, t = setInterval(function () { if (run() || ++n > 120) clearInterval(t); }, 250);
})(window);

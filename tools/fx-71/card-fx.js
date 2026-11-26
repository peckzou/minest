/* Minest · board Card FX 71 — holo · float · wave (tools/fx-71).
   The board's card-mode switch writes the mode to <html data-cfx="…"> and fires `minest:cardfx`;
   this block gives every board card a foil layer and drives the three looks:
     holo  — a holographic foil on every card; the card under the pointer tilts toward it
     float — the cards hover, each on its own slow beat
     wave  — a wave of lift and light runs across the lists; tap a card to send one out from it
   The look itself is in the stylesheet beside this file. */
(function () {
  'use strict';
  if (window.MinestCardFX) return;
  var root = document.documentElement, MODES = ['holo', 'float', 'wave'];
  var SEL = '.fb-board-stage article.kanban-card[data-card-id], .board-swimlane-scroll article.kanban-card[data-card-id]';
  var mode = 'none', timer = 0, hot = null, raf = 0, pend = null;
  var calm = !!(window.matchMedia && window.matchMedia('(prefers-reduced-motion: reduce)').matches);

  function hash(s) { var x = 2166136261; for (var i = 0; i < s.length; i++) { x ^= s.charCodeAt(i); x = Math.imul(x, 16777619); } return x >>> 0; }
  function cardOf(t) { return t && t.closest ? t.closest('article.kanban-card[data-card-id]') : null; }
  function inBoard(el) { return !!(el && el.closest('.fb-board-stage, .board-swimlane-scroll')); }

  function sync() {
    var els = document.querySelectorAll(SEL), cols = [], count = [];
    for (var i = 0; i < els.length; i++) {
      var el = els[i], f = el.__cfxFoil;
      if (!f || f.parentNode !== el) {
        f = document.createElement('i');
        f.className = 'cfx-foil';
        f.setAttribute('aria-hidden', 'true');
        el.appendChild(f);
        el.__cfxFoil = f;
      }
      if (el.__cfxMode === mode) {
        if (mode === 'wave') { var c0 = el.closest('.kanban-cards-scroll') || el.parentNode, k0 = cols.indexOf(c0); if (k0 < 0) { k0 = cols.push(c0) - 1; count[k0] = 0; } count[k0]++; }
        continue;
      }
      el.__cfxMode = mode;
      var h = hash(el.getAttribute('data-card-id') || String(i));
      if (mode === 'float') {
        el.style.setProperty('--cfx-dur', (3.4 + (h % 7) * 0.28).toFixed(2) + 's');
        el.style.setProperty('--cfx-dl', (-((h >>> 4) % 4000) / 1000).toFixed(2) + 's');
        el.style.setProperty('--cfx-r', (((h >>> 9) % 2 ? 1 : -1) * (0.2 + ((h >>> 11) % 5) * 0.07)).toFixed(2) + 'deg');
      } else if (mode === 'wave') {
        // the wave runs list by list, top to bottom: the delay comes from the card's place on the board
        var col = el.closest('.kanban-cards-scroll') || el.parentNode, k = cols.indexOf(col);
        if (k < 0) { k = cols.push(col) - 1; count[k] = 0; }
        el.style.setProperty('--cfx-wd', ((k * 0.24 + count[k] * 0.085) % 4.4).toFixed(2) + 's');
        count[k]++;
      } else if (mode === 'holo') {
        el.style.setProperty('--cfx-dl', (-((h >>> 4) % 7000) / 1000).toFixed(2) + 's');
      }
    }
  }
  function clear() {
    var fs = document.querySelectorAll('.cfx-foil');
    for (var i = 0; i < fs.length; i++) {
      var el = fs[i].parentNode;
      if (el) { el.__cfxFoil = null; el.__cfxMode = null; el.classList.remove('cfx-hot'); ['--cfx-dur', '--cfx-dl', '--cfx-r', '--cfx-wd', '--cfx-rx', '--cfx-ry', '--cfx-mx', '--cfx-my'].forEach(function (p) { el.style.removeProperty(p); }); el.removeChild(fs[i]); }
    }
    hot = null;
  }
  function cool() { if (hot) { hot.classList.remove('cfx-hot'); hot = null; } }

  function set(m) {
    m = MODES.indexOf(m) >= 0 ? m : 'none';
    if (m === mode) return;
    mode = m;
    cool();
    clearInterval(timer); timer = 0;
    if (m === 'none') { clear(); return; }
    sync();
    timer = setInterval(sync, 700);
  }
  function read() { set(root.getAttribute('data-cfx') || 'none'); }

  // holo: the card under the pointer tilts toward it and its glare follows
  function tilt() {
    raf = 0;
    var e = pend; pend = null;
    if (!e || mode !== 'holo') return;
    var el = cardOf(e.t);
    if (!el || !inBoard(el)) { cool(); return; }
    if (el !== hot) { cool(); hot = el; el.classList.add('cfx-hot'); }
    var r = el.getBoundingClientRect();
    if (!r.width || !r.height) return;
    var u = Math.min(1, Math.max(0, (e.x - r.left) / r.width)), v = Math.min(1, Math.max(0, (e.y - r.top) / r.height));
    // (a wide, short card needs less turn about its long axis to read the same)
    var kx = calm ? 0 : Math.min(9, 520 / r.width * 4), ky = calm ? 0 : 7;
    el.style.setProperty('--cfx-ry', ((u - 0.5) * 2 * kx).toFixed(2) + 'deg');
    el.style.setProperty('--cfx-rx', ((0.5 - v) * 2 * ky).toFixed(2) + 'deg');
    el.style.setProperty('--cfx-mx', (u * 100).toFixed(1) + '%');
    el.style.setProperty('--cfx-my', (v * 100).toFixed(1) + '%');
  }
  var onMove = function (e) {
    if (mode !== 'holo') return;
    pend = { t: e.target, x: e.clientX, y: e.clientY };
    if (!raf) raf = requestAnimationFrame(tilt);
  };
  document.addEventListener('pointermove', onMove, { passive: true, capture: true });
  document.addEventListener('pointerdown', onMove, { passive: true, capture: true });
  ['pointerup', 'pointercancel'].forEach(function (n) {
    document.addEventListener(n, function (e) { if (mode === 'holo' && e.pointerType !== 'mouse') cool(); }, { passive: true, capture: true });
  });
  document.addEventListener('pointerleave', cool, true);

  // wave: a tap on a card sends a ring of lift out from it
  document.addEventListener('click', function (e) {
    if (mode !== 'wave' || calm) return;
    var from = cardOf(e.target);
    if (!from || !inBoard(from) || !from.animate) return;
    var fr = from.getBoundingClientRect(), fx = fr.left + fr.width / 2, fy = fr.top + fr.height / 2;
    var els = document.querySelectorAll(SEL), vh = window.innerHeight, vw = window.innerWidth;
    for (var i = 0; i < els.length; i++) {
      var r = els[i].getBoundingClientRect();
      if (!r.width || r.bottom < 0 || r.top > vh || r.right < 0 || r.left > vw) continue;
      var d = Math.hypot(r.left + r.width / 2 - fx, r.top + r.height / 2 - fy), k = Math.max(0.25, 1 - d / 900);
      try {
        els[i].animate([
          { translate: '0 0', scale: '1' },
          { translate: '0 ' + (-8 * k).toFixed(1) + 'px', scale: (1 + 0.05 * k).toFixed(3), offset: 0.35 },
          { translate: '0 0', scale: '1' }
        ], { duration: 560, delay: d * 0.9, easing: 'cubic-bezier(.2,.8,.2,1)' });
      } catch (err) {}
    }
  }, true);

  window.addEventListener('minest:cardfx', read);
  window.MinestCardFX = { set: set, sync: sync, get mode() { return mode; }, modes: MODES.slice() };
  read();
})();

/* Minest · Light FX 1-Click Popover Picker (tools/fx-71).
   Tapping any Light FX button opens a sleek popover menu to pick any FX directly. */
(function () {
  'use strict';
  if (window.MinestLightFXPicker) return;

  var ITEMS = [
    { id: 'gallery', zh: '美术馆夜灯', en: 'Art Gallery · 拉绳与手电筒', ico: '◒', col: '#facc15', wide: true, badge: 'NEW' },
    { id: 'lasers',  zh: '激光秀',     en: 'Lasers',    ico: '⟡', col: '#c084fc' },
    { id: 'firework',zh: '烟花',       en: 'Firework',  ico: '✺', col: '#fbbf24' },
    { id: 'spotlight',zh: '聚光灯',    en: 'Spotlight', ico: '◎', col: '#f1f5f9' },
    { id: 'neon',    zh: '霓虹灯箱',   en: 'Neon',      ico: '◈', col: '#fb7185' },
    { id: 'aurora',  zh: '极光',       en: 'Aurora',    ico: '≈', col: '#34e3a4' },
    { id: 'meteor',  zh: '流星雨',     en: 'Meteor',    ico: '☄', col: '#7db8ff' },
    { id: 'disco',   zh: '迪斯科',     en: 'Disco',     ico: '❖', col: '#ff5fc4' }
  ];

  var menuEl = null, anchorNow = null, closeTimer = 0;

  function curMode() {
    return (window.FBFX && window.FBFX.mode) || 'none';
  }

  function syncButtons() {
    try { if (typeof window.__syncFxTab === 'function') window.__syncFxTab(); } catch (e) {}
    try {
      var cmLfx = document.querySelector('#cm-bar .lfx-k');
      if (cmLfx) cmLfx.classList.toggle('on', curMode() !== 'none');
    } catch (e) {}
  }

  function applyPick(id) {
    if (!window.FBFX) return;
    var target = (id === curMode() && id !== 'none') ? 'none' : id;
    window.FBFX.setMode(target);
    try { if (window.SoundEngine && SoundEngine.play) SoundEngine.play('click'); } catch (e) {}
    try { if (window.MinestNative && MinestNative.haptic) MinestNative.haptic('selection'); } catch (e) {}
    syncButtons();
    renderState();
    closeMenu();
  }

  function ensureMenu() {
    if (menuEl && menuEl.parentNode) return menuEl;
    menuEl = document.createElement('div');
    menuEl.id = 'fbfx-picker-menu';
    menuEl.className = 'fbfx-picker fbfx-gal-ui';
    menuEl.setAttribute('role', 'menu');
    menuEl.setAttribute('aria-label', '选择 Light FX 光效');

    var head = document.createElement('div');
    head.className = 'fbfx-pk-head';
    head.innerHTML = '<span>✦ Light FX · 选择光效</span>';
    var offBtn = document.createElement('button');
    offBtn.type = 'button';
    offBtn.className = 'fbfx-pk-off fbfx-gal-ui';
    offBtn.textContent = '关闭 Off';
    offBtn.addEventListener('click', function (e) {
      e.preventDefault(); e.stopPropagation();
      applyPick('none');
    });
    head.appendChild(offBtn);
    menuEl.appendChild(head);

    var grid = document.createElement('div');
    grid.className = 'fbfx-pk-grid';
    ITEMS.forEach(function (it) {
      var b = document.createElement('button');
      b.type = 'button';
      b.className = 'fbfx-pk-item fbfx-gal-ui' + (it.wide ? ' wide' : '');
      b.setAttribute('data-fx-pick', it.id);
      b.setAttribute('role', 'menuitemradio');
      b.style.setProperty('--pk-col', it.col);
      b.innerHTML =
        '<span class="fbfx-pk-ico">' + it.ico + '</span>' +
        '<span class="fbfx-pk-txt"><b>' + it.zh + '</b><small>' + it.en + '</small></span>' +
        (it.badge ? '<span class="fbfx-pk-badge">' + it.badge + '</span>' : '');
      b.addEventListener('click', function (e) {
        e.preventDefault(); e.stopPropagation();
        applyPick(it.id);
      });
      grid.appendChild(b);
    });
    menuEl.appendChild(grid);

    ['pointerdown', 'click', 'touchstart'].forEach(function (evName) {
      menuEl.addEventListener(evName, function (e) { e.stopPropagation(); });
    });

    document.body.appendChild(menuEl);
    return menuEl;
  }

  function renderState() {
    if (!menuEl) return;
    var m = curMode();
    var offBtn = menuEl.querySelector('.fbfx-pk-off');
    if (offBtn) {
      offBtn.classList.toggle('is-off', m === 'none');
      offBtn.textContent = m === 'none' ? '已关闭' : '关闭 Off';
    }
    var btns = menuEl.querySelectorAll('.fbfx-pk-item');
    for (var i = 0; i < btns.length; i++) {
      var on = btns[i].getAttribute('data-fx-pick') === m;
      btns[i].classList.toggle('active', on);
      btns[i].setAttribute('aria-checked', on ? 'true' : 'false');
    }
  }

  function positionMenu(anchor) {
    var el = ensureMenu();
    renderState();
    var r = anchor && anchor.getBoundingClientRect ? anchor.getBoundingClientRect() : null;
    if (!r || (!r.width && !r.height)) {
      var fallback = document.querySelector('.mn-looks-btn, .bar-fx-btn[aria-label="Light FX"], .dock-fx-tab, .fbfx-btn');
      r = fallback ? fallback.getBoundingClientRect() : { left: innerWidth / 2 - 20, right: innerWidth / 2 + 20, top: innerHeight - 70, bottom: innerHeight - 30, width: 40, height: 40 };
    }
    var mw = 284, mh = el.offsetHeight || 276;
    var cx = r.left + r.width / 2;
    var left = Math.max(10, Math.min(innerWidth - mw - 10, Math.round(cx - mw / 2)));
    var openAbove = r.top > innerHeight * 0.52 || (innerHeight - r.bottom < mh + 18 && r.top > mh + 12);
    var top = openAbove ? Math.max(10, Math.round(r.top - mh - 10)) : Math.min(innerHeight - mh - 10, Math.round(r.bottom + 10));
    el.style.left = left + 'px';
    el.style.top = top + 'px';
  }

  function openMenu(anchor) {
    clearTimeout(closeTimer);
    var el = ensureMenu();
    if (el.classList.contains('open') && anchorNow === anchor) {
      closeMenu();
      return;
    }
    anchorNow = anchor || null;
    positionMenu(anchor);
    void el.offsetWidth;
    el.classList.add('open');
  }

  function closeMenu() {
    anchorNow = null;
    if (!menuEl || !menuEl.classList.contains('open')) return;
    menuEl.classList.remove('open');
  }

  function findLightFxTrigger(target) {
    if (!target || !target.closest) return null;
    if (target.closest('#fbfx-picker-menu')) return null;
    return target.closest(
      '.bar-fx-btn[aria-label="Light FX"], ' +
      '.ios-tab-item.dock-fx-tab:not([title^="Card"]):not([aria-label^="Card"]), ' +
      '.fbfx-btn, ' +
      '.mn-bapp[aria-label^="Light FX"], ' +
      '.student-game-float-btn[title^="Light FX"], ' +
      '#cm-bar .lfx-k'
    );
  }

  // Intercept clicks on any Light FX button in capture phase to open the popover menu instead of cycling!
  window.addEventListener('click', function (e) {
    var btn = findLightFxTrigger(e.target);
    if (!btn) return;
    if (btn.classList.contains('fbfx-btn') && (e.shiftKey || e.altKey)) return; // Preserve Shift+click intro replay
    e.preventDefault();
    e.stopImmediatePropagation();
    openMenu(btn);
  }, true);

  document.addEventListener('pointerdown', function (e) {
    if (!menuEl || !menuEl.classList.contains('open')) return;
    if (menuEl.contains(e.target) || findLightFxTrigger(e.target)) return;
    closeMenu();
  }, true);

  document.addEventListener('keydown', function (e) {
    if (e.key === 'Escape') closeMenu();
  });

  window.addEventListener('resize', function () {
    if (menuEl && menuEl.classList.contains('open')) positionMenu(anchorNow);
  });
  window.addEventListener('fbfx:mode', renderState);

  window.MinestLightFXPicker = { open: openMenu, close: closeMenu, pick: applyPick };
})();

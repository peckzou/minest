/* web31 · a new top bar, the iPhone 45.x way. The old bar is gone from sight (it stays in the page, hidden, so
   every tool, menu and popover keeps working); the new bar has the iPhone dock's buttons, laid out across:
     board name · search · + · 3D/Board · theme · stats · iPhone ⇄ Desktop · lists · wallpaper · Arcade · Octo ·
     Light FX · Card FX · ink · settings · Cloud (far right)
   Each new button presses the old one; a menu that drops from an old button is moved under the new one.
   The bar slides away and comes back with the pointer at the top edge or a two-finger pinch.
   A right-click (or a long press on a touch screen) on empty space opens Appearance (wallpaper).
   Teacher / Join live in the Study Arcade's own top bar. The two floating FX buttons in the corner are gone. */
(function () {
  'use strict';
  if (window.__mn31TopBar || /[?&]learn=/.test(location.search)) return;
  window.__mn31TopBar = true;
  var root = document.documentElement;
  function oldBar() { return document.querySelector('header'); }
  function q(sel) { var h = oldBar(); return h ? h.querySelector(sel) : null; }

  // ---------------------------------------------------------------- icons (the iPhone dock's, lucide-style)
  var I = function (d) { return '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">' + d + '</svg>'; };
  var ICON = {
    search: I('<circle cx="11" cy="11" r="7"/><path d="m20 20-3.5-3.5"/>'),
    plus: I('<path d="M12 5v14M5 12h14"/>'),
    cover: I('<path d="m12 2 9 5-9 5-9-5 9-5z"/><path d="m3 12 9 5 9-5"/><path d="m3 17 9 5 9-5"/>'),
    board: I('<rect x="3" y="4" width="5" height="16" rx="1.5"/><rect x="10" y="4" width="5" height="11" rx="1.5"/><rect x="17" y="4" width="4" height="7" rx="1.5"/>'),
    sun: I('<circle cx="12" cy="12" r="4"/><path d="M12 2v2M12 20v2M4.9 4.9l1.4 1.4M17.7 17.7l1.4 1.4M2 12h2M20 12h2M4.9 19.1l1.4-1.4M17.7 6.3l1.4-1.4"/>'),
    moon: I('<path d="M21 12.8A9 9 0 1 1 11.2 3a7 7 0 0 0 9.8 9.8z"/>'),
    rings: I('<circle cx="12" cy="12" r="9"/><path d="M12 7a5 5 0 1 1-4.6 3"/>'),
    phone: I('<rect x="7" y="2.5" width="10" height="19" rx="2.4"/><path d="M11 18.5h2"/>'),
    list: I('<path d="M9 6h11M9 12h11M9 18h11"/><circle cx="4.5" cy="6" r="1"/><circle cx="4.5" cy="12" r="1"/><circle cx="4.5" cy="18" r="1"/>'),
    palette: I('<circle cx="13.5" cy="6.5" r="1"/><circle cx="17.5" cy="10.5" r="1"/><circle cx="8.5" cy="7.5" r="1"/><circle cx="6.5" cy="12.5" r="1"/><path d="M12 2a10 10 0 0 0 0 20c1.1 0 2-.9 2-2 0-.5-.2-1-.5-1.3-.3-.4-.5-.8-.5-1.3 0-1.1.9-2 2-2h2.3A5.6 5.6 0 0 0 22 10.7C22 5.9 17.5 2 12 2z"/>'),
    game: I('<path d="M6 11h4M8 9v4M15 12h.01M18 10h.01"/><path d="M17.3 5H6.7a4 4 0 0 0-4 3.6L2 14.5A3 3 0 0 0 5 18c1 0 1.9-.5 2.4-1.3L8.5 15h7l1.1 1.7A3 3 0 0 0 19 18a3 3 0 0 0 3-3.5l-.7-5.9A4 4 0 0 0 17.3 5z"/>'),
    octo: I('<path d="M6 12a6 6 0 1 1 12 0v2"/><path d="M6 14c0 2-1.5 3-3 3M10 14c0 3-1 5-2.5 5.5M14 14c0 3 1 5 2.5 5.5M18 14c0 2 1.5 3 3 3"/><circle cx="9.5" cy="10" r=".9" fill="currentColor"/><circle cx="14.5" cy="10" r=".9" fill="currentColor"/>'),
    fx: I('<path d="M12 3l1.9 5.1L19 10l-5.1 1.9L12 17l-1.9-5.1L5 10l5.1-1.9z"/><path d="M19 15l.8 2.2L22 18l-2.2.8L19 21l-.8-2.2L16 18l2.2-.8z"/>'),
    card: I('<rect x="3.5" y="6" width="13" height="14" rx="2.5"/><path d="M19 3v4M17 5h4"/>'),
    ink: I('<path d="M12 2.7S6 9.3 6 14a6 6 0 0 0 12 0c0-4.7-6-11.3-6-11.3z"/>'),
    gear: I('<circle cx="12" cy="12" r="3"/><path d="M19.4 15a1.7 1.7 0 0 0 .3 1.8l.1.1a2 2 0 1 1-2.8 2.8l-.1-.1a1.7 1.7 0 0 0-1.8-.3 1.7 1.7 0 0 0-1 1.5V21a2 2 0 1 1-4 0v-.1a1.7 1.7 0 0 0-1.1-1.5 1.7 1.7 0 0 0-1.8.3l-.1.1a2 2 0 1 1-2.8-2.8l.1-.1a1.7 1.7 0 0 0 .3-1.8 1.7 1.7 0 0 0-1.5-1H3a2 2 0 1 1 0-4h.1a1.7 1.7 0 0 0 1.5-1.1 1.7 1.7 0 0 0-.3-1.8l-.1-.1a2 2 0 1 1 2.8-2.8l.1.1a1.7 1.7 0 0 0 1.8.3H9a1.7 1.7 0 0 0 1-1.5V3a2 2 0 1 1 4 0v.1a1.7 1.7 0 0 0 1 1.5 1.7 1.7 0 0 0 1.8-.3l.1-.1a2 2 0 1 1 2.8 2.8l-.1.1a1.7 1.7 0 0 0-.3 1.8V9a1.7 1.7 0 0 0 1.5 1H21a2 2 0 1 1 0 4h-.1a1.7 1.7 0 0 0-1.5 1z"/>'),
    cloud: I('<path d="M17.5 19H8a6 6 0 1 1 5.7-7.9A4.5 4.5 0 1 1 17.5 19z"/>')
  };

  // ---------------------------------------------------------------- the buttons (left to right; Cloud last)
  function press(sel) { var b = typeof sel === 'string' ? q(sel) : sel; if (b) b.click(); return b; }
  var BTNS = [
    { k: 'search', title: 'Search cards', icon: function () { return ICON.search; }, run: function () { toggleSearch(); } },
    { k: 'plus', title: 'Create a board or list', icon: function () { return ICON.plus; }, run: function () { press('button[title^="Create new"]'); } },
    { k: 'view', title: '3D Cover ⇄ Board', icon: function () { return document.body.classList.contains('mode-coverflow') ? ICON.board : ICON.cover; },
      run: function () { var on = document.body.classList.contains('mode-coverflow'); press(on ? '.sf-mode-switch button[title^="Kanban"]' : '.sf-mode-switch button[title^="3D"]'); } },
    { k: 'theme', title: 'Light / dark', icon: function () { return q('button[title^="Switch to light"]') ? ICON.sun : ICON.moon; }, run: function () { press('button[title^="Switch to light"], button[title^="Switch to dark"]'); } },
    { k: 'stats', title: 'Activity & statistics', icon: function () { return ICON.rings; }, run: function () { press('button[title$="statistics panel"]'); }, on: function () { return !!q('button[title^="Hide statistics"]'); } },
    { k: 'iphone', title: 'iPhone ⇄ Desktop — back to the iPhone version', icon: function () { return ICON.phone; },
      run: function () { if (/[?&]from=app/.test(location.search) && history.length > 1) history.back(); else location.href = '/iphone'; } },
    { k: 'lists', title: 'Filter by list', icon: function () { return ICON.list; }, run: function () { press('button[title^="Filter by list"]'); } },
    { k: 'wall', title: 'Appearance — wallpaper & tint', icon: function () { return ICON.palette; }, run: function () { press('button[title^="Board Wallpaper"]'); } },
    { k: 'arcade', title: 'Study Arcade', icon: function () { return ICON.game; }, run: function () { press('.arcade-entry'); } },
    { k: 'octo', title: 'Pet Raising — Octo', icon: function () { return ICON.octo; }, run: function () { press('.mn30-entries button[title^="Pet Raising"]'); } },
    { k: 'fx', title: 'Light FX', icon: function () { return ICON.fx; }, run: function () { var r = document.querySelector('.fbfx-btn'); if (r) r.click(); },
      on: function () { var r = document.querySelector('.fbfx-btn'); return !!(r && /\bon\b/.test(r.className)); }, tip: function () { var r = document.querySelector('.fbfx-btn'); return r && r.title; } },
    { k: 'card', title: 'Card FX', icon: function () { return ICON.card; }, run: function () { var r = document.querySelector('.card-mode-btn'); if (r) r.click(); },
      on: function () { var r = document.querySelector('.card-mode-btn'); return !!(r && /\bon\b/.test(r.className) && !/\bnone\b/.test(r.className)); }, tip: function () { var r = document.querySelector('.card-mode-btn'); return r && r.title; } },
    { k: 'ink', title: 'Invisible Ink', icon: function () { return ICON.ink; }, run: function () { press('.fbi-btn'); } },
    { k: 'gear', title: 'Board settings', icon: function () { return ICON.gear; }, run: function () { press('button[title^="Board settings"]'); } },
    { k: 'cloud', title: 'Cloud sync & Google sign-in', icon: function () { return ICON.cloud; }, run: function () { press('button[title^="Cloud sync"]'); },
      dot: function () { var d = q('button[title^="Cloud sync"] span.rounded-full'); return d ? getComputedStyle(d).backgroundColor : ''; } }
  ];

  // ---------------------------------------------------------------- styles
  var css = document.createElement('style');
  css.id = 'mn31-topbar-css';
  css.textContent = [
    // the old bar: out of sight and out of the way (its menus still show, moved under the new buttons)
    'header{position:fixed!important;top:0!important;left:0;right:0;visibility:hidden!important;pointer-events:none!important;z-index:62!important;opacity:1!important;transform:none!important}',
    'header .mn31-pop{visibility:visible!important;pointer-events:auto!important;position:fixed!important;margin:0!important;transform:none!important;z-index:63!important}',
    // nothing of the old bar may paint (its glass blur showed through as a band) or hold the menus' fixed position
    'header, header *:not(.mn31-pop):not(.mn31-pop *){-webkit-backdrop-filter:none!important;backdrop-filter:none!important;filter:none!important;transform:none!important;background:transparent!important;border-color:transparent!important;box-shadow:none!important}',
    'header .mn31-pop *{visibility:visible}',
    // the two floating FX buttons in the corner are gone (Light FX / Card FX are in the bar)
    '.fbfx-btn,.card-mode-btn{visibility:hidden!important;pointer-events:none!important}',
    // the new bar
    '.mn31-bar{position:fixed;top:0;left:0;right:0;z-index:61;display:flex;align-items:center;gap:6px;padding:9px 14px;',
    'background:rgba(14,20,27,.74);-webkit-backdrop-filter:blur(28px) saturate(170%);backdrop-filter:blur(28px) saturate(170%);border-bottom:1px solid rgba(255,255,255,.08);color:#f1f5f9;',
    'transform:translateY(-110%);opacity:0;transition:transform .38s cubic-bezier(.2,.9,.25,1),opacity .25s ease;pointer-events:none;font-family:Inter,-apple-system,system-ui,sans-serif}',
    'html.mn31-chrome .mn31-bar{transform:none;opacity:1;pointer-events:auto}',
    '.theme-white .mn31-bar,html:has(.theme-white) .mn31-bar{background:rgba(255,255,255,.82);color:#0f172a;border-bottom-color:rgba(15,23,42,.08)}',
    '.mn31-title{flex:0 1 auto;min-width:0;border:0;background:transparent;color:inherit;font-size:19px;font-weight:700;letter-spacing:-.3px;padding:4px 2px;cursor:pointer;white-space:nowrap;overflow:hidden;text-overflow:ellipsis;max-width:42vw;margin-right:auto;text-align:left}',
    '.mn31-b{position:relative;flex:none;width:40px;height:40px;border-radius:13px;display:grid;place-items:center;cursor:pointer;color:inherit;padding:0;',
    'border:1px solid rgba(255,255,255,.16);background:rgba(255,255,255,.07);box-shadow:inset 0 1px 0 rgba(255,255,255,.14),0 4px 12px rgba(0,0,0,.12);transition:background .15s,transform .12s}',
    '.mn31-b:hover{background:rgba(255,255,255,.15)}.mn31-b:active{transform:scale(.93)}.mn31-b svg{width:19px;height:19px}',
    '.mn31-b.on{border-color:rgba(125,211,252,.75);color:#7dd3fc;box-shadow:0 0 0 2px rgba(125,211,252,.22)}',
    '.mn31-b .dot{position:absolute;right:6px;bottom:6px;width:7px;height:7px;border-radius:50%}',
    'html:has(.theme-white) .mn31-b{border-color:rgba(15,23,42,.12);background:rgba(15,23,42,.04);box-shadow:none}',
    '.mn31-search{flex:none;width:0;opacity:0;transition:width .25s ease,opacity .2s;overflow:hidden}',
    '.mn31-search.open{width:min(260px,30vw);opacity:1}',
    '.mn31-search input{width:100%;height:40px;border-radius:13px;border:1px solid rgba(255,255,255,.18);background:rgba(255,255,255,.08);color:inherit;padding:0 12px;font:500 14px inherit;outline:none}',
    '.mn31-edge{position:fixed;top:0;left:0;right:0;height:10px;z-index:60}',
    'html.mn31-chrome .mn31-edge{display:none}',
    '.mn31-hint{position:fixed;left:50%;top:10px;transform:translateX(-50%);z-index:64;padding:8px 14px;border-radius:999px;background:rgba(0,0,0,.72);color:#fff;font:600 13px -apple-system,system-ui,sans-serif;pointer-events:none;animation:mn31Hint 3.2s ease forwards}',
    '@keyframes mn31Hint{0%{opacity:0;transform:translate(-50%,-8px)}10%,80%{opacity:1;transform:translate(-50%,0)}100%{opacity:0}}',
    '@media (max-width:900px){.mn31-b{width:36px;height:36px;border-radius:12px}.mn31-bar{gap:4px;padding:8px 10px}.mn31-title{font-size:17px}}'
  ].join('\n');
  document.head.appendChild(css);

  // ---------------------------------------------------------------- build the bar
  var bar = document.createElement('div'); bar.className = 'mn31-bar'; bar.setAttribute('role', 'toolbar');
  var title = document.createElement('button'); title.type = 'button'; title.className = 'mn31-title'; title.title = 'Switch or manage boards';
  title.onclick = function () { anchor = title; press('.board-switcher, header > div:first-child button'); watchPop(); };
  bar.appendChild(title);
  var search = document.createElement('div'); search.className = 'mn31-search'; search.innerHTML = '<input type="text" placeholder="Search cards…" aria-label="Search cards">';
  var sInput = search.firstChild;
  sInput.addEventListener('input', function () {
    var o = q('input'); if (!o) return;
    Object.getOwnPropertyDescriptor(HTMLInputElement.prototype, 'value').set.call(o, sInput.value);
    o.dispatchEvent(new Event('input', { bubbles: true }));
  });
  sInput.addEventListener('keydown', function (e) { if (e.key === 'Escape') { sInput.value = ''; sInput.dispatchEvent(new Event('input')); toggleSearch(false); } });
  function toggleSearch(open) {
    var o = open == null ? !search.classList.contains('open') : open;
    search.classList.toggle('open', o);
    if (o) { setTimeout(function () { sInput.focus(); }, 60); show(); }
  }
  var els = {};
  BTNS.forEach(function (b) {
    if (b.k === 'search') bar.appendChild(search);
    var el = document.createElement('button'); el.type = 'button'; el.className = 'mn31-b'; el.title = b.title; el.setAttribute('aria-label', b.title);
    el.onclick = function (e) { e.stopPropagation(); anchor = el; b.run(); watchPop(); setTimeout(refresh, 80); };
    els[b.k] = el; bar.appendChild(el);
  });
  function refresh() {
    var t = q('.board-switcher span:not(.board-version):not(.studio-version), header > div:first-child button span:last-child');
    var name = t ? t.textContent.trim() : '';
    if (!name) { var sw = q('header > div:first-child button'); name = sw ? sw.textContent.replace(/^\d+\.\d+/, '').trim() : 'Minest'; }
    if (title.textContent !== name) title.textContent = name;
    BTNS.forEach(function (b) {
      var el = els[b.k], ic = b.icon();
      if (el.__ic !== ic) { el.innerHTML = ic; el.__ic = ic; if (b.dot) { var d = document.createElement('i'); d.className = 'dot'; el.appendChild(d); } }
      if (b.on) el.classList.toggle('on', !!b.on());
      if (b.tip) { var tp = b.tip(); if (tp && el.title !== tp) el.title = tp; }
      if (b.dot) { var dd = el.querySelector('.dot'), c = b.dot(); if (dd) dd.style.background = c || 'transparent'; }
    });
  }
  function mountBar() { if (!bar.isConnected && document.body) document.body.appendChild(bar); refresh(); }
  setInterval(mountBar, 600);

  // ---------------------------------------------------------------- menus from the old bar: under the new button
  var anchor = null, popT = 0;
  function watchPop() {
    clearInterval(popT);
    var n = 0;
    popT = setInterval(function () { placePops(); if (++n > 20) clearInterval(popT); }, 50);
  }
  function placePops() {
    var h = oldBar(); if (!h || !anchor) return;
    var cands = h.querySelectorAll('[class*="popover"], [class*="dropdown"], [class*="menu"]:not(button), [role="menu"], [role="listbox"]');
    var br = bar.getBoundingClientRect(), ar = anchor.getBoundingClientRect();
    Array.prototype.forEach.call(cands, function (p) {
      if (p.closest('.mn31-pop') && p.closest('.mn31-pop') !== p) return;
      var r = p.getBoundingClientRect();
      if (r.height < 30 || r.width < 60) return;
      if (!p.classList.contains('mn31-pop')) p.classList.add('mn31-pop');
      var w = p.offsetWidth, top = Math.round(br.bottom + 8);
      var left = ar.left + ar.width / 2 > innerWidth / 2 ? Math.min(innerWidth - w - 10, ar.right - w) : Math.max(10, ar.left);
      p.style.setProperty('top', top + 'px', 'important'); p.style.setProperty('left', Math.max(10, Math.round(left)) + 'px', 'important');
      p.style.setProperty('right', 'auto', 'important'); p.style.setProperty('bottom', 'auto', 'important');
      p.style.setProperty('max-height', (innerHeight - top - 12) + 'px', 'important'); p.style.setProperty('overflow', 'auto', 'important');
    });
  }
  new MutationObserver(function () { if (anchor) placePops(); }).observe(document.documentElement, { childList: true, subtree: true });

  // ---------------------------------------------------------------- show / hide
  var hideT = 0, away = false;
  function popOpen() { var h = oldBar(); return !!(h && h.querySelector('.mn31-pop')) && Array.prototype.some.call(h.querySelectorAll('.mn31-pop'), function (p) { return p.isConnected && p.getBoundingClientRect().height > 30; }); }
  function busy() { return bar.matches(':hover') || document.activeElement === sInput || popOpen(); }
  function show(ms) { root.classList.add('mn31-chrome'); away = false; hideSoon(ms || 2600); }
  function hideSoon(ms) {
    clearTimeout(hideT);
    hideT = setTimeout(function () { if (busy()) { hideSoon(1200); return; } root.classList.remove('mn31-chrome'); search.classList.remove('open'); }, ms);
  }
  function addEdge() {
    var edge = document.createElement('div'); edge.className = 'mn31-edge';
    edge.addEventListener('mouseenter', function () { show(); });
    edge.addEventListener('click', function () { show(); });
    document.body.appendChild(edge); mountBar();
  }
  if (document.body) addEdge(); else document.addEventListener('DOMContentLoaded', addEdge);
  document.addEventListener('mousemove', function (e) {
    if (e.clientY <= 12) { show(); return; }
    if (!root.classList.contains('mn31-chrome')) return;
    if (e.clientY <= bar.getBoundingClientRect().bottom + 24) { away = false; clearTimeout(hideT); }
    else if (!away) { away = true; hideSoon(1400); }
  }, { passive: true });
  window.addEventListener('wheel', function (e) { if (e.ctrlKey) { e.preventDefault(); show(3200); } }, { passive: false });
  window.addEventListener('gesturestart', function (e) { e.preventDefault(); show(3200); });
  var pinch0 = 0;
  document.addEventListener('touchstart', function (e) { pinch0 = e.touches.length === 2 ? Math.hypot(e.touches[0].clientX - e.touches[1].clientX, e.touches[0].clientY - e.touches[1].clientY) : 0; }, { passive: true });
  document.addEventListener('touchmove', function (e) {
    if (!pinch0 || e.touches.length !== 2) return;
    var d = Math.hypot(e.touches[0].clientX - e.touches[1].clientX, e.touches[0].clientY - e.touches[1].clientY);
    if (Math.abs(d - pinch0) > 28) { pinch0 = 0; show(3500); }
  }, { passive: true });
  setTimeout(function () {
    show(2400);
    try {
      if (!localStorage.getItem('minest.web31.barHint')) {
        localStorage.setItem('minest.web31.barHint', '1');
        var t = document.createElement('div'); t.className = 'mn31-hint'; t.textContent = 'Move to the top, or pinch, for the menu';
        document.body.appendChild(t); setTimeout(function () { t.remove(); }, 3400);
      }
    } catch (e) {}
  }, 900);

  // ---------------------------------------------------------------- empty space → Appearance
  var BLOCK = 'article, .kanban-card, .kanban-subcard, button, a, input, textarea, select, label, [contenteditable], [role="button"], header, .mn31-bar, .mpet-menu, #minest-mini-pet-p0, .arcade, .mlv, .coverflow-card-item, [class*="popover"], [class*="modal"]';
  function blank(el) { return el && el.closest && !el.closest(BLOCK) && !!el.closest('#root') && !el.closest('.mlv, .mlv-open, .arcade, [role="dialog"]'); }
  function appearance() { show(4000); anchor = els.wall; press('button[title^="Board Wallpaper"]'); watchPop(); }
  document.addEventListener('contextmenu', function (e) { if (!blank(e.target)) return; e.preventDefault(); appearance(); });
  var lp = null;
  document.addEventListener('touchstart', function (e) {
    if (lp) clearTimeout(lp.t); lp = null;
    if (e.touches.length !== 1 || !blank(e.target)) return;
    var p = e.touches[0];
    lp = { x: p.clientX, y: p.clientY, t: setTimeout(function () { lp = null; appearance(); }, 560) };
  }, { passive: true, capture: true });
  document.addEventListener('touchmove', function (e) {
    if (!lp) return; var p = e.touches[0];
    if (Math.hypot(p.clientX - lp.x, p.clientY - lp.y) > 9) { clearTimeout(lp.t); lp = null; }
  }, { passive: true, capture: true });
  ['touchend', 'touchcancel'].forEach(function (ev) { document.addEventListener(ev, function () { if (lp) clearTimeout(lp.t); lp = null; }, { passive: true, capture: true }); });

  // ---------------------------------------------------------------- 🎓 Teacher / 🎮 Join in the Study Arcade's top bar
  function arcadeButtons() {
    var chips = document.querySelector('.arcade .ar-chips');
    if (!chips || chips.querySelector('.mn31-ar-te') || window.__MINEST_LIVE_STANDALONE || window.__mnNoVoice || !window.MinestLive) return;
    var mk = function (cls, txt, tt, run) {
      var b = document.createElement('button'); b.type = 'button'; b.className = 'ar-btn ' + cls; b.textContent = txt; b.title = tt;
      b.onclick = function (e) { e.stopPropagation(); run(); };
      return b;
    };
    var ref = chips.querySelector('.ar-bgbtn') || chips.firstChild;
    chips.insertBefore(mk('mn31-ar-te', '🎓 Teacher', 'Host a live Arcade game for your class', function () { window.MinestLive.openTeacher(); }), ref);
    chips.insertBefore(mk('mn31-ar-jo', '🎮 Join', 'Join a live Arcade game with a code', function () { window.MinestLive.openJoin(''); }), ref);
  }
  new MutationObserver(function () { if (document.querySelector('.arcade .ar-chips')) arcadeButtons(); }).observe(document.body || document.documentElement, { childList: true });
})();

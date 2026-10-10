/* web31 · a macOS-style menu bar on top and a macOS-style Dock at the bottom (📌 on the bar keeps both out; while they are out the board steps back) (built on the iPhone 45.x bar). The old bar is gone from sight (it stays in the page, hidden, so
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
    pin: I('<path d="M12 17v5"/><path d="M9 10.8V5h6v5.8l2.5 3.2H6.5L9 10.8z"/><path d="M8 5h8"/>'),
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

  // ---------------------------------------------------------------- the buttons
  // bar: the menu bar's status icons (right side); dock: the Dock on the right, as app icons with a colour each
  function press(sel) { var b = typeof sel === 'string' ? q(sel) : sel; if (b) b.click(); return b; }
  var fxBtn = function () { return document.querySelector('.fbfx-btn'); }, cmBtn = function () { return document.querySelector('.card-mode-btn'); };
  var BTNS = [
    { k: 'search', at: 'bar', title: 'Search', icon: function () { return ICON.search; }, run: function () { toggleSearch(); } },
    { k: 'plus', at: 'bar', title: 'New board or list', icon: function () { return ICON.plus; }, run: function () { press('button[title^="Create new"]'); } },
    { k: 'theme', at: 'bar', title: 'Light / dark', icon: function () { return q('button[title^="Switch to light"]') ? ICON.sun : ICON.moon; }, run: function () { press('button[title^="Switch to light"], button[title^="Switch to dark"]'); } },
    { k: 'cloud', at: 'bar', title: 'Cloud sync & Google sign-in', icon: function () { return ICON.cloud; }, run: function () { press('button[title^="Cloud sync"]'); },
      dot: function () { var d = q('button[title^="Cloud sync"] span.rounded-full'); return d ? getComputedStyle(d).backgroundColor : ''; } },

    { k: 'view', at: 'dock', title: function () { return document.body.classList.contains('mode-coverflow') ? 'Board' : '3D Cover'; }, bg: 'linear-gradient(160deg,#6366f1,#312e81)',
      icon: function () { return document.body.classList.contains('mode-coverflow') ? ICON.board : ICON.cover; },
      run: function () { var on = document.body.classList.contains('mode-coverflow'); press(on ? '.sf-mode-switch button[title^="Kanban"]' : '.sf-mode-switch button[title^="3D"]'); } },
    { k: 'lists', at: 'dock', title: 'Lists', bg: 'linear-gradient(160deg,#38bdf8,#0369a1)', icon: function () { return ICON.list; }, run: function () { press('button[title^="Filter by list"]'); } },
    { k: 'wall', at: 'dock', title: 'Appearance', bg: 'linear-gradient(160deg,#fb7185,#f59e0b)', icon: function () { return ICON.palette; }, run: function () { press('button[title^="Board Wallpaper"]'); } },
    { k: 'arcade', at: 'dock', title: 'Study Arcade', bg: 'linear-gradient(160deg,#a855f7,#6d28d9)', icon: function () { return ICON.game; }, run: function () { press('.arcade-entry'); } },
    { k: 'octo', at: 'dock', title: 'Octo', bg: 'linear-gradient(160deg,#f0abfc,#7c3aed)', icon: function () { return ICON.octo; }, run: function () { press('.mn30-entries button[title^="Pet Raising"]'); } },
    { k: 'stats', at: 'dock', title: 'Activity', bg: 'linear-gradient(160deg,#4ade80,#047857)', icon: function () { return ICON.rings; }, run: function () { press('button[title$="statistics panel"]'); }, on: function () { return !!q('button[title^="Hide statistics"]'); } },
    { k: 'fx', at: 'dock', title: 'Light FX', bg: 'linear-gradient(160deg,#fde047,#f97316)', icon: function () { return ICON.fx; }, run: function () { var r = fxBtn(); if (r) r.click(); },
      on: function () { var r = fxBtn(); return !!(r && /\bon\b/.test(r.className)); } },
    { k: 'card', at: 'dock', title: 'Card FX', bg: 'linear-gradient(160deg,#22d3ee,#0e7490)', icon: function () { return ICON.card; }, run: function () { var r = cmBtn(); if (r) r.click(); },
      on: function () { var r = cmBtn(); return !!(r && /\bon\b/.test(r.className) && !/\bnone\b/.test(r.className)); } },
    { k: 'ink', at: 'dock', title: 'Invisible Ink', bg: 'linear-gradient(160deg,#64748b,#1e293b)', icon: function () { return ICON.ink; }, run: function () { press('.fbi-btn'); } },
    { k: 'iphone', at: 'dock', title: 'iPhone version', bg: 'linear-gradient(160deg,#e2e8f0,#94a3b8)', dark: true, icon: function () { return ICON.phone; },
      run: function () { if (/[?&]from=app/.test(location.search) && history.length > 1) history.back(); else location.href = '/iphone'; } },
    { k: 'gear', at: 'dock', title: 'Settings', bg: 'linear-gradient(160deg,#9ca3af,#4b5563)', icon: function () { return ICON.gear; }, run: function () { press('button[title^="Board settings"]'); } }
  ];
  function titleOf(b) { return typeof b.title === 'function' ? b.title() : b.title; }

  // ---------------------------------------------------------------- styles
  var css = document.createElement('style');
  css.id = 'mn31-topbar-css';
  css.textContent = [
    // the old bar: out of sight and out of the way (its menus still show, moved next to the new buttons)
    'header{position:fixed!important;top:0!important;left:0;right:0;visibility:hidden!important;pointer-events:none!important;z-index:62!important;opacity:1!important;transform:none!important}',
    'header .mn31-pop{visibility:visible!important;pointer-events:auto!important;position:fixed!important;margin:0!important;transform:none!important;z-index:63!important}',
    'header, header *:not(.mn31-pop):not(.mn31-pop *){-webkit-backdrop-filter:none!important;backdrop-filter:none!important;filter:none!important;transform:none!important;background:transparent!important;border-color:transparent!important;box-shadow:none!important}',
    'header .mn31-pop *{visibility:visible}',
    '.fbfx-btn,.card-mode-btn{visibility:hidden!important;pointer-events:none!important}',
    // the menu bar (macOS): thin, translucent, small monochrome status icons
    '.mn31-bar{position:fixed;top:0;left:0;right:0;z-index:61;height:32px;display:flex;align-items:center;gap:2px;padding:0 12px;',
    'background:rgba(30,32,40,.42);-webkit-backdrop-filter:blur(30px) saturate(180%);backdrop-filter:blur(30px) saturate(180%);border-bottom:1px solid rgba(255,255,255,.06);color:#f8fafc;',
    'font:500 13.5px -apple-system,BlinkMacSystemFont,"SF Pro Text",Inter,system-ui,sans-serif;transform:translateY(-110%);opacity:0;transition:transform .32s cubic-bezier(.2,.9,.25,1),opacity .22s ease;pointer-events:none}',
    'html.mn31-chrome .mn31-bar{transform:none;opacity:1;pointer-events:auto}',
    'html:has(.theme-white) .mn31-bar{background:rgba(255,255,255,.55);color:#111827;border-bottom-color:rgba(0,0,0,.06)}',
    '.mn31-logo{font-size:15px;margin-right:6px;opacity:.9}',
    '.mn31-title{flex:0 1 auto;min-width:0;border:0;background:transparent;color:inherit;font-weight:700;font-size:13.5px;padding:3px 8px;border-radius:6px;cursor:pointer;white-space:nowrap;overflow:hidden;text-overflow:ellipsis;max-width:46vw;margin-right:auto;text-align:left}',
    '.mn31-title:hover,.mn31-s:hover{background:rgba(255,255,255,.16)}html:has(.theme-white) .mn31-title:hover,html:has(.theme-white) .mn31-s:hover{background:rgba(0,0,0,.08)}',
    '.mn31-s{position:relative;flex:none;height:24px;min-width:30px;padding:0 6px;border:0;border-radius:6px;background:transparent;color:inherit;display:grid;place-items:center;cursor:pointer}',
    '.mn31-s svg{width:16px;height:16px}.mn31-s .dot{position:absolute;right:3px;top:3px;width:6px;height:6px;border-radius:50%}',
    '.mn31-s.pin.on{background:rgba(125,211,252,.22);color:#7dd3fc}html:has(.theme-white) .mn31-s.pin.on{background:rgba(14,165,233,.14);color:#0369a1}',
    // while the bar and Dock are out, the board steps back: a little smaller, clear of the bar and the Dock
    'main{transition:padding .32s cubic-bezier(.2,.9,.25,1)}',
    'html.mn31-chrome main{padding:36px 18px var(--mn31-dock-room,84px)!important;box-sizing:border-box!important;height:100vh!important;height:100dvh!important;max-height:100dvh!important;min-height:0!important}',
    '.mn31-search{flex:none;width:0;opacity:0;transition:width .22s ease,opacity .18s;overflow:hidden}',
    '.mn31-search.open{width:min(220px,28vw);opacity:1;margin:0 4px}',
    '.mn31-search input{width:100%;height:22px;border-radius:6px;border:0;background:rgba(255,255,255,.18);color:inherit;padding:0 9px;font:500 12.5px inherit;outline:none}',
    'html:has(.theme-white) .mn31-search input{background:rgba(0,0,0,.07)}',
    // the Dock (macOS, at the bottom): a liquid-glass shelf of icons that swell under the pointer
    '.mn31-dock{position:fixed;left:50%;bottom:6px;z-index:60;display:flex;flex-direction:row;align-items:flex-end;gap:6px;padding:6px 10px;border-radius:20px;',
    'background:linear-gradient(180deg,rgba(255,255,255,.22) 0%,rgba(255,255,255,.07) 50%,rgba(255,255,255,.11) 100%);border:1px solid rgba(255,255,255,.3);',
    '-webkit-backdrop-filter:blur(24px) saturate(190%);backdrop-filter:blur(24px) saturate(190%);',
    'box-shadow:inset 0 1px 0 rgba(255,255,255,.55),inset 0 -1px 1px rgba(255,255,255,.12),0 14px 40px rgba(0,0,0,.26);',
    'transform:translate(-50%,140%);opacity:0;transition:transform .34s cubic-bezier(.2,.9,.25,1),opacity .22s ease;pointer-events:none}',
    'html.mn31-chrome .mn31-dock{transform:translate(-50%,0);opacity:1;pointer-events:auto}',
    'html:has(.theme-white) .mn31-dock{background:linear-gradient(180deg,rgba(255,255,255,.7) 0%,rgba(255,255,255,.44) 50%,rgba(255,255,255,.54) 100%);border-color:rgba(255,255,255,.85);box-shadow:inset 0 1px 0 rgba(255,255,255,.95),0 14px 40px rgba(15,23,42,.16)}',
    // the icons: no frame of their own, just the glyph (with a soft shadow) and a dot under the one that is on
    '.mn31-app{position:relative;flex:none;width:46px;height:46px;padding:0;border:0;border-radius:0;background:transparent;display:grid;place-items:center;cursor:pointer;color:#fff}',
    '.mn31-app svg{width:66%;height:66%;filter:drop-shadow(0 2px 4px rgba(0,0,0,.35))}',
    'html:has(.theme-white) .mn31-app{color:#1f2937}html:has(.theme-white) .mn31-app svg{filter:drop-shadow(0 1px 2px rgba(0,0,0,.15))}',
    '.mn31-app.on{color:#7dd3fc}html:has(.theme-white) .mn31-app.on{color:#0284c7}',
    '.mn31-app.on::after{content:"";position:absolute;left:50%;bottom:-5px;width:4px;height:4px;margin-left:-2px;border-radius:50%;background:currentColor}',
    '.mn31-app:active{filter:brightness(.85)}',
    // the edges: where the pointer calls the bar (top) and the Dock (right)
    '.mn31-edge{position:fixed;top:0;left:0;right:0;height:8px;z-index:60}.mn31-edge.r{top:auto;bottom:0}',
    'html.mn31-chrome .mn31-edge{display:none}',
    '.mn31-hint{position:fixed;left:50%;top:10px;transform:translateX(-50%);z-index:64;padding:8px 14px;border-radius:999px;background:rgba(0,0,0,.72);color:#fff;font:600 13px -apple-system,system-ui,sans-serif;pointer-events:none;animation:mn31Hint 3.4s ease forwards}',
    '@keyframes mn31Hint{0%{opacity:0;transform:translate(-50%,-8px)}10%,80%{opacity:1;transform:translate(-50%,0)}100%{opacity:0}}'
  ].join('\n');
  document.head.appendChild(css);

  // ---------------------------------------------------------------- build: the menu bar and the Dock
  var bar = document.createElement('div'); bar.className = 'mn31-bar'; bar.setAttribute('role', 'menubar');
  var logo = document.createElement('span'); logo.className = 'mn31-logo'; logo.textContent = '◈'; bar.appendChild(logo);
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
  var dock = document.createElement('div'); dock.className = 'mn31-dock'; dock.setAttribute('role', 'toolbar'); dock.setAttribute('aria-label', 'Dock');
  var els = {};
  BTNS.forEach(function (b) {
    var el = document.createElement('button'); el.type = 'button';
    if (b.at === 'bar') {
      if (b.k === 'search') bar.appendChild(search);
      el.className = 'mn31-s'; bar.appendChild(el);
    } else {
      el.className = 'mn31-app'; dock.appendChild(el);
    }
    el.onclick = function (e) { e.stopPropagation(); anchor = el; b.run(); watchPop(); setTimeout(refresh, 80); };
    els[b.k] = el;
  });
  // pin: keep the bar and the Dock out for good (remembered)
  var pinned = false; try { pinned = localStorage.getItem('minest.web31.pin') === '1'; } catch (e) {}
  var pinB = document.createElement('button'); pinB.type = 'button'; pinB.className = 'mn31-s pin'; pinB.innerHTML = ICON.pin;
  function setPin(v) {
    pinned = v; pinB.classList.toggle('on', v); pinB.title = v ? 'Unpin the menu bar (hide it again)' : 'Pin the menu bar (always show)'; pinB.setAttribute('aria-label', pinB.title); pinB.setAttribute('aria-pressed', String(v));
    try { localStorage.setItem('minest.web31.pin', v ? '1' : '0'); } catch (e) {}
    if (v) { clearTimeout(hideT); root.classList.add('mn31-chrome'); } else hideSoon(1400);
  }
  pinB.onclick = function (e) { e.stopPropagation(); setPin(!pinned); };
  bar.appendChild(pinB);
  function refresh() {
    var sw = q('header > div:first-child button');
    var name = sw ? sw.textContent.replace(/^\s*\d+\.\d+/, '').trim() : 'Minest';
    if (title.textContent !== name) title.textContent = name;
    BTNS.forEach(function (b) {
      var el = els[b.k], ic = b.icon(), tt = titleOf(b);
      if (el.__ic !== ic) { el.innerHTML = ic; el.__ic = ic; if (b.dot) { var dd0 = document.createElement('i'); dd0.className = 'dot'; el.appendChild(dd0); } }
      if (el.getAttribute('aria-label') !== tt) { el.setAttribute('aria-label', tt); if (b.at === 'bar') el.title = tt; }
      if (b.on) el.classList.toggle('on', !!b.on());
      if (b.dot) { var dd = el.querySelector('.dot'), c = b.dot(); if (dd) dd.style.background = c || 'transparent'; }
    });
  }
  var dockCtl = null;
  function mountBar() {
    if (document.body && !bar.isConnected) document.body.appendChild(bar);
    if (document.body && !dock.isConnected) { document.body.appendChild(dock); if (window.MinestDock && !dockCtl) dockCtl = MinestDock.attach(dock, { axis: 'x', side: 'bottom', max: 1.75, items: '.mn31-app',
      // as big as fits across: n icons + gaps + the swell (about 2.3 icons more)
      base: function () { var n = dock.querySelectorAll('.mn31-app').length || 11, room = innerWidth - 40 - 20 - (n - 1) * 6, b = Math.max(28, Math.min(48, Math.floor(room / (n + 2.3)))); root.style.setProperty('--mn31-dock-room', (b + 30) + 'px'); return b; } }); }
    refresh();
  }
  setInterval(mountBar, 600);

  // ---------------------------------------------------------------- menus from the old bar: next to the new button
  var anchor = null, popT = 0;
  function watchPop() {
    clearInterval(popT);
    var n = 0;
    popT = setInterval(function () { placePops(); if (++n > 20) clearInterval(popT); }, 50);
  }
  function placePops() {
    var h = oldBar(); if (!h || !anchor) return;
    var cands = h.querySelectorAll('[class*="popover"], [class*="dropdown"], [class*="menu"]:not(button), [role="menu"], [role="listbox"]');
    var inDock = dock.contains(anchor), br = bar.getBoundingClientRect(), dr = dock.getBoundingClientRect(), ar = anchor.getBoundingClientRect();
    Array.prototype.forEach.call(cands, function (p) {
      if (p.closest('.mn31-pop') && p.closest('.mn31-pop') !== p) return;
      var r = p.getBoundingClientRect();
      if (r.height < 30 || r.width < 60) return;
      if (!p.classList.contains('mn31-pop')) p.classList.add('mn31-pop');
      var w = p.offsetWidth, h2 = p.offsetHeight, top, left;
      if (inDock) {   // above the Dock, centred on the icon
        left = Math.min(innerWidth - w - 10, ar.left + ar.width / 2 - w / 2);
        top = Math.max(br.bottom + 8, dr.top - h2 - 12);
      } else {        // under the menu bar
        top = br.bottom + 6;
        left = ar.left + ar.width / 2 > innerWidth / 2 ? Math.min(innerWidth - w - 10, ar.right - w) : Math.max(8, ar.left);
      }
      p.style.setProperty('top', Math.round(top) + 'px', 'important'); p.style.setProperty('left', Math.max(8, Math.round(left)) + 'px', 'important');
      p.style.setProperty('right', 'auto', 'important'); p.style.setProperty('bottom', 'auto', 'important');
      p.style.setProperty('max-height', ((inDock ? dr.top - 12 : innerHeight - 12) - top) + 'px', 'important'); p.style.setProperty('overflow', 'auto', 'important');
    });
  }
  new MutationObserver(function () { if (anchor) placePops(); }).observe(document.documentElement, { childList: true, subtree: true });

  // ---------------------------------------------------------------- show / hide (menu bar and Dock together)
  var hideT = 0, away = false;
  function popOpen() { var h = oldBar(); return !!h && Array.prototype.some.call(h.querySelectorAll('.mn31-pop'), function (p) { return p.isConnected && p.getBoundingClientRect().height > 30; }); }
  function busy() { return bar.matches(':hover') || dock.matches(':hover') || document.activeElement === sInput || popOpen(); }
  function show(ms) { root.classList.add('mn31-chrome'); away = false; hideSoon(ms || 2600); }
  function hideSoon(ms) {
    clearTimeout(hideT);
    if (pinned) { root.classList.add('mn31-chrome'); return; }
    hideT = setTimeout(function () { if (busy()) { hideSoon(1200); return; } root.classList.remove('mn31-chrome'); search.classList.remove('open'); if (dockCtl) dockCtl.leave(); }, ms);
  }
  function addEdges() {
    ['', 'r'].forEach(function (k) {
      var edge = document.createElement('div'); edge.className = 'mn31-edge ' + k;
      edge.addEventListener('mouseenter', function () { show(); });
      edge.addEventListener('click', function () { show(); });
      document.body.appendChild(edge);
    });
    mountBar();
  }
  if (document.body) addEdges(); else document.addEventListener('DOMContentLoaded', addEdges);
  function near(e) {
    var b = bar.getBoundingClientRect(), d = dock.getBoundingClientRect();
    return e.clientY <= b.bottom + 24 || (e.clientY >= d.top - 40 && e.clientX >= d.left - 30 && e.clientX <= d.right + 30);
  }
  document.addEventListener('mousemove', function (e) {
    if (e.clientY <= 10 || e.clientY >= innerHeight - 8) { show(); return; }
    if (!root.classList.contains('mn31-chrome')) return;
    if (near(e)) { away = false; clearTimeout(hideT); }
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
    setPin(pinned);
    show(2400);
    try {
      if (localStorage.getItem('minest.web31.barHint') !== '3') {
        localStorage.setItem('minest.web31.barHint', '3');
        var t = document.createElement('div'); t.className = 'mn31-hint'; t.textContent = 'Top edge: menu bar · bottom edge: Dock · 📌 keeps them out';
        document.body.appendChild(t); setTimeout(function () { t.remove(); }, 3600);
      }
    } catch (e) {}
  }, 900);

  // ---------------------------------------------------------------- empty space → Appearance
  var BLOCK = 'article, .kanban-card, .kanban-subcard, button, a, input, textarea, select, label, [contenteditable], [role="button"], header, .mn31-bar, .mn31-dock, .mpet-menu, #minest-mini-pet-p0, .arcade, .mlv, .coverflow-card-item, [class*="popover"], [class*="modal"]';
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

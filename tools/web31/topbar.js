/* web31 · the top bar, like iPhone 45.x: the board takes the whole window and the bar stays out of the way.
   · It slides in when the pointer goes to the top edge, or with a two-finger pinch (trackpad or touch screen),
     and slides away again a moment after you leave it (not while one of its menus or the search is open).
   · One row: the board switcher on the left; on the right the iPhone dock's buttons laid out across — search,
     +, 3D / Board, theme, stats, iPhone ⇄ Desktop, lists, wallpaper, Arcade, Octo, Light FX, Card FX, ink,
     settings — and Cloud last, on the far right. No ≡; the two floating FX buttons in the bottom-right corner
     are gone (their stand-ins are in the bar).
   · A right-click (or a long press on a touch screen) on the board's empty space opens Appearance (wallpaper).
   · Teacher / Join live in the Study Arcade's own top bar. */
(function () {
  'use strict';
  if (window.__mn31TopBar || /[?&]learn=/.test(location.search)) return;
  window.__mn31TopBar = true;
  var root = document.documentElement;

  // the bar's order, left to right after the switcher (the dock's top-to-bottom order, Cloud last)
  var ORDER = [
    ['header > div:nth-child(2) > div.relative.flex.items-center.flex-1', 1],              // search
    ['header > div:nth-child(2) > :has(> button[title^="Create new"])', 2],               // +
    ['header .sf-mode-switch', 3],                                                         // 3D / Board
    ['header button[title^="Switch to light"], header button[title^="Switch to dark"]', 4],
    ['header button[title$="statistics panel"]', 5],
    ['header a[title^="Open iPhone"]', 6],                                                 // iPhone ⇄ Desktop
    ['header > div:nth-child(2) > :has(> button[title^="Filter by list"])', 7],
    ['header > div:nth-child(3) > :has(> button[title^="Board Wallpaper"])', 8],
    ['header .arcade-entry', 9],
    ['header .mn30-entries button[title^="Pet Raising"]', 10],
    ['header .mn31-p-fx', 11], ['header .mn31-p-cm', 12],                                  // Light FX, Card FX
    ['header .fbi-wrap', 13],                                                              // ink
    ['header button[title^="Board settings"]', 14],
    ['header button[title^="Cloud sync"]', 15]
  ];
  var css = document.createElement('style');
  css.id = 'mn31-topbar-css';
  css.textContent = [
    // the bar floats over the board and slides away
    'header{position:fixed!important;top:0;left:0;right:0;z-index:60!important;display:flex!important;align-items:center!important;gap:4px!important;padding:8px 14px!important;',
    'background:rgba(14,20,27,.72)!important;-webkit-backdrop-filter:blur(26px) saturate(170%);backdrop-filter:blur(26px) saturate(170%);border-bottom:1px solid rgba(255,255,255,.08)!important;',
    'transform:translateY(-110%);opacity:0;transition:transform .38s cubic-bezier(.2,.9,.25,1),opacity .25s ease!important;pointer-events:none}',
    '.theme-white header{background:rgba(255,255,255,.8)!important;border-bottom-color:rgba(15,23,42,.08)!important}',
    'html.mn31-chrome header{transform:none;opacity:1;pointer-events:auto}',
    // one row: the groups dissolve so every button can take its place
    'header > div:nth-child(2),header > div:nth-child(3),header .mn30-entries{display:contents!important}',
    'header > div:nth-child(1){order:0;margin-right:auto!important;flex:0 1 auto!important;min-width:0}',
    ORDER.map(function (o) { return o[0] + '{order:' + o[1] + '!important}'; }).join('\n'),
    // not in the bar (Octo's menu has the AI tools; Glass is in Appearance)

    // calm, even buttons like the iPhone dock
    'header > div:nth-child(3) > button,header > div:nth-child(3) > a,header > div:nth-child(3) > div > button,header .mn30-entries button,header > div:nth-child(2) > div > button{height:38px!important;min-width:38px!important;border-radius:12px!important}',
    'header button[title^="Create new"] > span,header button[title^="Create new"] > svg:last-child:not(:first-child){display:none!important}',
    'header button[title^="Create new"]{padding:0 11px!important}',
    'header button[title^="Cloud sync"] > span.hidden{display:none!important}',
    'header button[title^="Filter by list"] > span.font-mono{display:none!important}',
    'header > div:nth-child(2) > div.relative.flex.items-center.flex-1{flex:0 0 170px!important}',
    // every button gets the new look: one glass tile style, icons only (the old pills, labels and colours go)
    'header > div:nth-child(1) .board-switcher, header > div:nth-child(1) button{border:0!important;background:transparent!important;box-shadow:none!important;padding:4px 2px!important}',
    'header > div:nth-child(1) button .board-version, header > div:nth-child(1) button > svg{display:none!important}',
    'header > div:nth-child(1) button > span{font-size:19px!important;font-weight:700!important;letter-spacing:-.3px}',
    'header > div:nth-child(2) > div > button, header > div:nth-child(3) > button, header > div:nth-child(3) > a, header > div:nth-child(3) > div > button, header .mn30-entries button, header .sf-mode-switch, header .mn31-p{' +
      'height:38px!important;min-width:38px!important;padding:0 9px!important;border-radius:12px!important;display:inline-flex!important;align-items:center!important;justify-content:center!important;gap:0!important;' +
      'background:rgba(255,255,255,.07)!important;border:1px solid rgba(255,255,255,.14)!important;box-shadow:inset 0 1px 0 rgba(255,255,255,.12)!important;color:inherit!important;font-size:0!important}',
    'header > div:nth-child(2) > div > button:hover, header > div:nth-child(3) > button:hover, header > div:nth-child(3) > a:hover, header > div:nth-child(3) > div > button:hover, header .mn30-entries button:hover, header .mn31-p:hover{background:rgba(255,255,255,.14)!important}',
    '.theme-white header > div:nth-child(2) > div > button, .theme-white header > div:nth-child(3) > button, .theme-white header > div:nth-child(3) > a, .theme-white header > div:nth-child(3) > div > button, .theme-white header .mn30-entries button, .theme-white header .sf-mode-switch, .theme-white header .mn31-p{background:rgba(15,23,42,.04)!important;border-color:rgba(15,23,42,.12)!important}',
    'header svg{width:17px!important;height:17px!important}',
    'header .arcade-entry-glyph{font-size:15px!important}header button span[aria-hidden="true"]{font-size:16px!important}',
    'header button[title^="Cloud sync"] > span:first-child{font-size:16px!important}header button[title^="Cloud sync"] > span:last-child{width:7px!important;height:7px!important;margin-left:3px}',
    // the list filter: a list icon instead of "All Lists (29) ▾"
    'header button[title^="Filter by list"] > *{display:none!important}',
    'header button[title^="Filter by list"]::before{content:"";width:18px;height:18px;background:currentColor;-webkit-mask:url(\"data:image/svg+xml,%3Csvg xmlns=%27http://www.w3.org/2000/svg%27 viewBox=%270 0 24 24%27 fill=%27none%27 stroke=%27black%27 stroke-width=%272%27 stroke-linecap=%27round%27%3E%3Cpath d=%27M9 6h11M9 12h11M9 18h11%27/%3E%3Ccircle cx=%274.5%27 cy=%276%27 r=%271.2%27 fill=%27black%27/%3E%3Ccircle cx=%274.5%27 cy=%2712%27 r=%271.2%27 fill=%27black%27/%3E%3Ccircle cx=%274.5%27 cy=%2718%27 r=%271.2%27 fill=%27black%27/%3E%3C/svg%3E\") center/contain no-repeat;mask:url(\"data:image/svg+xml,%3Csvg xmlns=%27http://www.w3.org/2000/svg%27 viewBox=%270 0 24 24%27 fill=%27none%27 stroke=%27black%27 stroke-width=%272%27 stroke-linecap=%27round%27%3E%3Cpath d=%27M9 6h11M9 12h11M9 18h11%27/%3E%3Ccircle cx=%274.5%27 cy=%276%27 r=%271.2%27 fill=%27black%27/%3E%3Ccircle cx=%274.5%27 cy=%2712%27 r=%271.2%27 fill=%27black%27/%3E%3Ccircle cx=%274.5%27 cy=%2718%27 r=%271.2%27 fill=%27black%27/%3E%3C/svg%3E\") center/contain no-repeat}',
    // the 3D / Board switch: two quiet icons
    'header .sf-mode-switch{padding:0 3px!important;gap:2px!important}header .sf-mode-switch .sf-mode-thumb{border-radius:9px!important}header .sf-mode-switch button{height:30px!important;min-width:30px!important;border:0!important;background:transparent!important}',
    // the search: a glass field
    'header input[type="text"], header input:not([type]){height:38px!important;border-radius:12px!important;background:rgba(255,255,255,.07)!important;border:1px solid rgba(255,255,255,.14)!important;font-size:13px!important}',
    '.theme-white header input{background:rgba(15,23,42,.04)!important;border-color:rgba(15,23,42,.12)!important}',
    // the two floating FX buttons (bottom right) are gone — their stand-ins sit in the bar
    '.fbfx-btn:not(.mn31-p),.card-mode-btn:not(.mn31-p){display:none!important}',
    '.mn31-p{display:inline-flex!important;align-items:center;justify-content:center;width:38px;height:38px;border-radius:12px;border:1px solid rgba(255,255,255,.14);background:rgba(255,255,255,.06);color:inherit;cursor:pointer;font-size:16px;padding:0}',
    '.mn31-p:hover{background:rgba(255,255,255,.12)}.mn31-p.on{border-color:rgba(125,211,252,.7);box-shadow:0 0 0 2px rgba(125,211,252,.22);color:#7dd3fc}',
    '.theme-white .mn31-p{border-color:rgba(15,23,42,.12);background:rgba(15,23,42,.04)}.mn31-p svg{width:17px;height:17px}',
    // not in the bar (Octo's menu has the AI tools; Glass is in Appearance) — last and strongest, so nothing brings them back
    'html body header .studio-progress-badge,html body header .studio-version,html body header > div:nth-child(1) > .hidden,html body header .mn30-entries button:not([title^="Pet Raising"]),html body header button[title^="Mute"],html body header button[title^="Unmute"],html body header button.fbg-toggle,html body header button[title*="Zen Mode"]{display:none!important}',
    'header .mn31-p span{font-size:16px!important;line-height:1}',
    // the top edge: where the pointer calls the bar
    '.mn31-edge{position:fixed;top:0;left:0;right:0;height:10px;z-index:59}',
    'html.mn31-chrome .mn31-edge{display:none}',
    '.mn31-hint{position:fixed;left:50%;top:10px;transform:translateX(-50%);z-index:61;padding:8px 14px;border-radius:999px;background:rgba(0,0,0,.72);color:#fff;font:600 13px -apple-system,system-ui,sans-serif;pointer-events:none;animation:mn31Hint 3.2s ease forwards}',
    '@keyframes mn31Hint{0%{opacity:0;transform:translate(-50%,-8px)}10%,80%{opacity:1;transform:translate(-50%,0)}100%{opacity:0}}'
  ].join('\n');
  document.head.appendChild(css);

  function header() { return document.querySelector('header'); }

  // ---------------------------------------------------------------- the two FX buttons, in the bar
  var proxies = [];
  function proxy(cls, realSel, glyph) {
    var b = document.createElement('button'); b.type = 'button'; b.className = 'mn31-p ' + cls; b.innerHTML = glyph;
    b.onclick = function (e) { e.stopPropagation(); var r = document.querySelector(realSel); if (r) r.click(); setTimeout(sync, 60); };
    proxies.push({ el: b, sel: realSel });
    return b;
  }
  proxy('mn31-p-fx', '.fbfx-btn:not(.mn31-p)', '<span>✦</span>');
  proxy('mn31-p-cm', '.card-mode-btn:not(.mn31-p)', '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round"><rect x="3.5" y="6" width="13" height="14" rx="2.5"/><path d="M19 3v4M17 5h4"/></svg>');
  function sync() {
    proxies.forEach(function (p) {
      var r = document.querySelector(p.sel); if (!r) return;
      p.el.title = r.title || '';
      p.el.classList.toggle('on', /\bon\b/.test(r.className) && !/\bnone\b/.test(r.className));
    });
  }
  function mount() {
    var h = header(); if (!h) return;
    var right = h.children[2]; if (!right) return;
    proxies.forEach(function (p) { if (p.el.parentNode !== right) right.appendChild(p.el); });
    sync();
  }
  setInterval(mount, 700);

  // ---------------------------------------------------------------- show / hide
  var hideT = 0;
  function busy() {
    var h = header(); if (!h) return false;
    if (h.matches(':hover')) return true;
    var a = document.activeElement;
    if (a && a !== document.body && h.contains(a) && /INPUT|TEXTAREA|SELECT/.test(a.tagName)) return true;
    return !!h.querySelector('[class*="popover"], [class*="dropdown"], [role="menu"], [role="listbox"], .fbi-menu');
  }
  function show(ms) { root.classList.add('mn31-chrome'); hideSoon(ms || 2600); }
  function hideSoon(ms) {
    clearTimeout(hideT);
    hideT = setTimeout(function () { if (busy()) { hideSoon(1200); return; } root.classList.remove('mn31-chrome'); }, ms);
  }
  function addEdge() {
    var edge = document.createElement('div'); edge.className = 'mn31-edge';
    edge.addEventListener('mouseenter', function () { show(); });
    edge.addEventListener('click', function () { show(); });
    document.body.appendChild(edge);
  }
  if (document.body) addEdge(); else document.addEventListener('DOMContentLoaded', addEdge);
  var away = false;
  document.addEventListener('mousemove', function (e) {
    if (e.clientY <= 12) { away = false; show(); return; }
    if (!root.classList.contains('mn31-chrome')) return;
    var h = header(), b = h ? h.getBoundingClientRect().bottom : 56;
    if (e.clientY <= b + 24) { away = false; clearTimeout(hideT); }   // on the bar: it stays
    else if (!away) { away = true; hideSoon(1400); }                   // left it: it goes a moment later
  }, { passive: true });
  // a two-finger pinch: on a trackpad it arrives as ctrl + wheel (Safari also sends gesture events)
  window.addEventListener('wheel', function (e) { if (e.ctrlKey) { e.preventDefault(); show(3200); } }, { passive: false });
  window.addEventListener('gesturestart', function (e) { e.preventDefault(); show(3200); });
  var pinch0 = 0;
  document.addEventListener('touchstart', function (e) { pinch0 = e.touches.length === 2 ? Math.hypot(e.touches[0].clientX - e.touches[1].clientX, e.touches[0].clientY - e.touches[1].clientY) : 0; }, { passive: true });
  document.addEventListener('touchmove', function (e) {
    if (!pinch0 || e.touches.length !== 2) return;
    var d = Math.hypot(e.touches[0].clientX - e.touches[1].clientX, e.touches[0].clientY - e.touches[1].clientY);
    if (Math.abs(d - pinch0) > 28) { pinch0 = 0; show(3500); }
  }, { passive: true });
  // at the start the bar shows briefly; the first time, a hint says how it comes back
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
  var BLOCK = 'article, .kanban-card, .kanban-subcard, button, a, input, textarea, select, label, [contenteditable], [role="button"], header, .mpet-menu, #minest-mini-pet-p0, .arcade, .mlv, .coverflow-card-item, [class*="popover"], [class*="modal"]';
  function blank(el) { return el && el.closest && !el.closest(BLOCK) && !!el.closest('#root') && !el.closest('.mlv, .mlv-open, .arcade, [role="dialog"]'); }
  function appearance() {
    var b = document.querySelector('header button[title^="Board Wallpaper"]'); if (!b) return;
    show(4000);
    setTimeout(function () { b.click(); }, 120);   // the studio hangs from the bar, so the bar comes first
  }
  document.addEventListener('contextmenu', function (e) {
    if (!blank(e.target)) return;
    e.preventDefault(); appearance();
  });
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
    var mk = function (cls, txt, title, run) {
      var b = document.createElement('button'); b.type = 'button'; b.className = 'ar-btn ' + cls; b.textContent = txt; b.title = title;
      b.onclick = function (e) { e.stopPropagation(); run(); };
      return b;
    };
    var ref = chips.querySelector('.ar-bgbtn') || chips.firstChild;
    chips.insertBefore(mk('mn31-ar-te', '🎓 Teacher', 'Host a live Arcade game for your class', function () { window.MinestLive.openTeacher(); }), ref);
    chips.insertBefore(mk('mn31-ar-jo', '🎮 Join', 'Join a live Arcade game with a code', function () { window.MinestLive.openJoin(''); }), ref);
  }
  new MutationObserver(function () { if (document.querySelector('.arcade .ar-chips')) arcadeButtons(); }).observe(document.body, { childList: true });
})();

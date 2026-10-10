/* web31 · the top bar, laid out like iPhone 45.0: the board switcher on the left, everything else on the
   right, and the less-used tools tucked into ≡ — a column of glass icon buttons down the right edge.
   The tucked buttons stay in the board app (hidden); each icon in the column is a stand-in that clicks the
   real one, so every tool works exactly as before. Teacher / Join live in the Study Arcade's own top bar. */
(function () {
  'use strict';
  if (window.__mn31TopBar || /[?&]learn=/.test(location.search)) return;
  window.__mn31TopBar = true;

  // what goes into ≡ (selectors inside the header, in column order)
  var TUCK = [
    { sel: '.mn30-entries button[title^="Build a board"]', label: 'AI Build' },
    { sel: '.mn30-entries button[title^="AI Analyze"]', label: 'Analyze' },
    { sel: '.mn30-entries button[title^="Learning Path"]', label: 'Learn' },
    { sel: '.mn30-entries button[title^="Read aloud"]', label: 'Speak' },
    { sel: '.mn30-entries button[title^="Pet Raising"]', label: 'Octo' },
    { sel: '.mn30-entries button[title^="Talk to Minest"]', label: 'Voice' },
    { sel: 'button[title^="Board Wallpaper"]', label: 'Wallpaper' },
    { sel: 'button[title^="Show statistics"], button[title^="Hide statistics"]', label: 'Stats' },
    { sel: 'button[title^="Mute"], button[title^="Unmute"]', label: 'Sound' },
    { sel: 'button.fbg-toggle', label: 'Glass' },
    { sel: 'button[title^="Switch to light"], button[title^="Switch to dark"]', label: 'Theme' },
    { sel: 'button[title^="Board settings"]', label: 'Settings' },
    { sel: 'a[title^="Open iPhone"]', label: 'iPhone ⇄ Desktop', sw: true }
  ];

  var css = document.createElement('style');
  css.id = 'mn31-topbar-css';
  css.textContent = [
    // everything after the switcher sits on the right
    'header > div:nth-child(2){flex:1 1 auto!important;justify-content:flex-start!important;min-width:0}',
    'header > div:nth-child(2) > :first-child{margin-left:auto}',   // right-aligned, never spilling left over the switcher
    'header > div:nth-child(2) > div.flex-1{flex:0 1 220px!important;min-width:38px}',
    '@media (max-width:1100px){header .studio-progress-badge{display:none!important}}',
    'header > div:nth-child(3){flex:0 0 auto!important}',
    // tucked tools (the board app keeps them; ≡ shows them)
    'header .mn30-entries,' + TUCK.slice(6).map(function (t) { return t.sel.split(',').map(function (x) { return 'header ' + x.trim(); }).join(','); }).join(',') + '{display:none!important}',
    // ≡ (the iPhone 45.0 burger)
    '.mn31-burger{display:inline-flex;align-items:center;justify-content:center;width:36px;height:36px;border-radius:12px;border:1px solid rgba(255,255,255,.14);background:rgba(255,255,255,.06);color:inherit;cursor:pointer;transition:background .2s}',
    '.mn31-burger:hover{background:rgba(255,255,255,.12)}.theme-white .mn31-burger{border-color:rgba(15,23,42,.12);background:rgba(15,23,42,.04)}',
    '.mn31-burger svg{width:18px;height:18px}.mn31-burger .x{display:none}.mn31-more-open .mn31-burger .x{display:block}.mn31-more-open .mn31-burger .b{display:none}',
    // the column
    '.mn31-col{position:fixed;right:14px;top:64px;z-index:2147482000;display:flex;flex-flow:column wrap-reverse;align-content:flex-start;gap:8px;pointer-events:none}',   // a short window: a second column to the left
    '.mn31-col button{pointer-events:auto;position:relative;width:46px;height:46px;border-radius:15px;display:grid;place-items:center;border:1px solid rgba(255,255,255,.22);',
    'background:rgba(20,26,40,.72);-webkit-backdrop-filter:blur(22px) saturate(170%);backdrop-filter:blur(22px) saturate(170%);color:#fff;font-size:18px;cursor:pointer;',
    'box-shadow:0 10px 26px rgba(0,0,0,.28),inset 0 1px 0 rgba(255,255,255,.18);opacity:0;transform:translateX(24px) scale(.9);animation:mn31In .32s cubic-bezier(.2,.9,.3,1.15) forwards}',
    '.mn31-col button svg{width:18px;height:18px}.mn31-col button:hover{background:rgba(40,48,70,.85)}.mn31-col button.on{border-color:rgba(125,211,252,.7);box-shadow:0 0 0 2px rgba(125,211,252,.25),0 10px 26px rgba(0,0,0,.28)}',
    '.mn31-col button .lbl{position:absolute;right:56px;top:50%;transform:translateY(-50%);white-space:nowrap;padding:5px 10px;border-radius:9px;background:rgba(10,14,24,.85);color:#fff;font:600 12px Inter,system-ui,sans-serif;opacity:0;pointer-events:none;transition:opacity .15s}',
    '.mn31-col button:hover .lbl{opacity:1}',
    '.theme-white .mn31-col button{background:rgba(255,255,255,.82);color:#0f172a;border-color:rgba(15,23,42,.12)}',
    '@keyframes mn31In{to{opacity:1;transform:none}}',
    '.mn31-scrim{position:fixed;inset:0;z-index:2147481999}',
    '.mn31-sw{display:inline-flex;gap:1px;padding:2px;border-radius:9px;background:rgba(127,127,127,.2)}.mn31-sw i{display:grid;place-items:center;width:15px;height:17px;border-radius:7px;opacity:.5}.mn31-sw i.on{opacity:1;background:rgba(255,255,255,.28)}.mn31-sw svg{width:12px!important;height:12px!important}'
  ].join('\n');
  document.head.appendChild(css);

  // the iPhone ⇄ Desktop switch (the same as the iPhone page's; here the desktop half is lit)
  var SWITCH = '<span class="mn31-sw"><i><svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round"><rect x="7" y="2.5" width="10" height="19" rx="2.4"/><path d="M11 18.5h2"/></svg></i><i class="on"><svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round"><rect x="2.5" y="4" width="19" height="12.5" rx="2"/><path d="M8.5 20.5h7M12 16.5v4"/></svg></i></span>';
  var burger = null, col = null, scrim = null;
  function header() { return document.querySelector('header'); }
  function close() {
    document.documentElement.classList.remove('mn31-more-open');
    if (col) { col.remove(); col = null; }
    if (scrim) { scrim.remove(); scrim = null; }
  }
  function open() {
    var h = header(); if (!h) return;
    close();
    document.documentElement.classList.add('mn31-more-open');
    scrim = document.createElement('div'); scrim.className = 'mn31-scrim'; scrim.onclick = close; document.body.appendChild(scrim);
    col = document.createElement('div'); col.className = 'mn31-col';
    var r = h.getBoundingClientRect(); col.style.top = Math.round(r.bottom + 10) + 'px'; col.style.maxHeight = Math.max(160, window.innerHeight - r.bottom - 22) + 'px';
    var i = 0;
    TUCK.forEach(function (t) {
      var real = h.querySelector(t.sel); if (!real) return;
      var b = document.createElement('button'); b.type = 'button';
      var title = real.title || real.getAttribute('aria-label') || t.label;
      b.title = title; b.setAttribute('aria-label', title);
      var glyph = t.sw ? SWITCH : real.querySelector('svg') ? real.querySelector('svg').outerHTML : (real.querySelector('[aria-hidden="true"]') || real).textContent.trim().slice(0, 2);
      if (t.sw) title = 'iPhone ⇄ Desktop — back to the iPhone version';
      b.innerHTML = glyph + '<span class="lbl">' + t.label + '</span>';
      if (/\bon\b/.test(real.className && real.className.baseVal == null ? real.className : '')) b.classList.add('on');
      b.style.animationDelay = (i++ * 22) + 'ms';
      b.onclick = function (e) {
        e.stopPropagation(); close();
        if (t.sw) { if (/[?&]from=app/.test(location.search) && history.length > 1) history.back(); else location.href = '/iphone'; return; }   // came from the app: back into it
        if (real.tagName === 'A') { location.href = real.href; return; }
        real.click();
      };
      col.appendChild(b);
    });
    document.body.appendChild(col);
  }
  // ≡ sits at the end of the right group; the board app re-renders the header, so keep putting it back
  function mount() {
    var h = header(); if (!h) return;
    var right = h.children[2]; if (!right) return;
    if (!burger) {
      burger = document.createElement('button'); burger.type = 'button'; burger.className = 'mn31-burger'; burger.title = 'More'; burger.setAttribute('aria-label', 'More');
      burger.innerHTML = '<svg class="b" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round"><path d="M5 9h14M5 15h14"/></svg><svg class="x" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round"><path d="M6 6l12 12M18 6 6 18"/></svg>';
      burger.onclick = function (e) { e.stopPropagation(); if (col) close(); else open(); };
    }
    if (burger.parentNode !== right || burger !== right.lastElementChild) right.appendChild(burger);
  }
  setInterval(mount, 700);
  document.addEventListener('keydown', function (e) { if (e.key === 'Escape' && col) close(); });
  if (document.readyState === 'loading') document.addEventListener('DOMContentLoaded', mount); else mount();

  // 🎓 Teacher / 🎮 Join in the Study Arcade's top bar (not in a student's live game or the play page)
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

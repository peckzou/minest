/* Pet Raising — polish pass (46.8)
   Readability: 46.7 turned every panel into dark sea glass, but some text kept the colours it had on the
   old white cards — wardrobe item names (dark violet), snack names (brown), the motion search box — and
   was close to unreadable. They are light now; locked wardrobe items keep a visible icon.
   Wardrobe on a phone: the sheet covered the octopus, so nothing you tried on could be seen. In portrait
   it now stops at 44 % of the screen and the octopus swims into the free water below it (only while it
   is roaming: not when asleep, in a care activity or in Copy Cat) and back when the wardrobe closes.
   Bond badge: a ring around the 💜 shows the progress to the next level; a gold dot shows that it needs
   something. Opened, the bars carry their names (care-v2.js).
   Loading: while the 3D octopus downloads the sea used to be empty; rising bubbles and a line of text
   show that it is on its way (only if loading takes longer than half a second). index.html also starts
   the model download together with the scripts instead of after them.
   Small: 36 px close button, focus rings for keyboards, less motion with "reduce motion". */
(function () {
  'use strict';
  if (window.__octoPolish) return;
  window.__octoPolish = true;
  var P = 'html body ';
  var css = [
    // ---- readable text on the dark glass
    P + '.wd-card .nm{color:#fff!important}',
    P + '.wd-card .st{color:rgba(255,255,255,.78)!important}',
    P + '.wd-card.on .st{color:#fff!important}',
    P + '.wd-card.locked .st{color:#ffd58a!important}',
    P + '.wd-card.locked .nm{color:rgba(255,255,255,.82)!important}',
    P + '.wd-card.locked .ic{filter:grayscale(.6) opacity(.75)!important}',
    P + '.wd-next,' + P + '.wd-group{color:rgba(255,255,255,.8)!important}',
    P + '.wd-reset:disabled{opacity:.6!important}',
    P + '.oc2-snack small{color:rgba(255,255,255,.92)!important}',
    P + '.apc-search::placeholder{color:rgba(255,255,255,.66)!important;opacity:1}',
    P + '.conversation-overlay p{color:#eef8ff!important}',
    // ---- wardrobe: a larger close button; on a phone the sheet leaves the octopus in view
    P + '.wd-x{width:36px!important;height:36px!important;flex:none;font-size:15px!important;cursor:pointer}',
    P + '.wd-body{overscroll-behavior:contain}',
    '@media (max-width:560px) and (orientation:portrait){' + P + '.wd-sheet{max-height:min(44vh,400px)!important}' +
      P + '.wd-head{padding:10px 14px 4px!important}' + P + '.wd-next{padding:0 14px 6px!important}' + P + '.wd-tabs{padding:0 14px 6px!important}}',
    // ---- bond badge: progress ring + "needs something" dot
    P + '.oc2-needs:not(.open):before{content:"";position:absolute;inset:-4px;border-radius:50%;pointer-events:none;' +
      'background:conic-gradient(#d9c8ff calc(var(--bond,0)*1%),rgba(255,255,255,.2) 0);' +
      '-webkit-mask:radial-gradient(farthest-side,transparent calc(100% - 3px),#000 calc(100% - 2.5px));mask:radial-gradient(farthest-side,transparent calc(100% - 3px),#000 calc(100% - 2.5px))}',
    P + '.oc2-needs.need:not(.open):after{content:"";position:absolute;right:-1px;top:-1px;width:11px;height:11px;border-radius:50%;background:#ffd678;border:2px solid #0e3c58;box-sizing:border-box;pointer-events:none}',
    P + '.oc2-needs.open{min-width:176px!important;padding:10px 12px!important;border-radius:18px!important;gap:5px 8px!important;font-size:12px!important;' +
      'background:linear-gradient(180deg,rgba(40,110,140,.94),rgba(10,44,68,.95))!important;animation:pv9pop .22s cubic-bezier(.2,1.2,.4,1)}',
    P + '.oc2-needs.open .lv{margin-bottom:2px;font-size:13px}',
    P + '.oc2-needs.open .oc2-bar{height:6px!important;min-width:72px}',
    '@keyframes pv9pop{from{opacity:0;transform:scale(.9)}}',
    // ---- loading
    '.pv9-loader{position:fixed;left:50%;top:42%;transform:translate(-50%,-50%);z-index:20;display:flex;flex-direction:column;align-items:center;gap:14px;pointer-events:none;' +
      'color:#eaf6ff;font:700 13px -apple-system,system-ui,sans-serif;letter-spacing:.02em;text-shadow:0 1px 6px rgba(0,20,40,.55);opacity:0;visibility:hidden;transition:opacity .35s,visibility 0s .35s}',
    'html.ui-loading .pv9-loader{opacity:1;visibility:visible;transition:opacity .35s .5s,visibility 0s .5s}',
    '.pv9-loader .b{display:flex;gap:10px;align-items:flex-end;height:34px}',
    '.pv9-loader .b i{display:block;border-radius:50%;border:1.5px solid rgba(225,250,255,.9);background:radial-gradient(circle at 34% 28%,rgba(255,255,255,.95),rgba(170,235,255,.35) 40%,rgba(110,200,240,.16) 72%);animation:pv9rise 1.5s ease-in-out infinite}',
    '.pv9-loader .b i:nth-child(1){width:12px;height:12px}',
    '.pv9-loader .b i:nth-child(2){width:18px;height:18px;animation-delay:.2s}',
    '.pv9-loader .b i:nth-child(3){width:10px;height:10px;animation-delay:.4s}',
    '@keyframes pv9rise{0%,100%{transform:translateY(0);opacity:.55}50%{transform:translateY(-16px);opacity:1}}',
    // ---- keyboards and reduced motion
    P + 'button:focus-visible,' + P + '.wd-card:focus-visible,' + P + '.oc2-needs:focus-visible{outline:2px solid #fff!important;outline-offset:2px!important}',
    '@media (prefers-reduced-motion:reduce){.pv9-loader .b i,.oc2-btn.need,.oc2-handle.need,.oc2-thought{animation:none!important}' + P + '.oc2-needs.open{animation:none!important}}'
  ].join('\n');
  var st = document.createElement('style'); st.id = 'pet-polish-v9'; st.textContent = css;
  // after every other style, also after the ones that re-append themselves late (perf-v7, smooth-v8)
  var place = function () { (document.body || document.head || document.documentElement).appendChild(st); };
  place();
  window.addEventListener('load', function () { setTimeout(place, 0); setTimeout(place, 1600); setTimeout(place, 4100); });

  // ---- loading indicator: lives only until the octopus is in
  function addLoader() {
    var root = document.documentElement;
    if (!root.classList.contains('ui-loading')) return;
    var el = document.createElement('div'); el.className = 'pv9-loader'; el.setAttribute('role', 'status');
    el.innerHTML = '<div class="b" aria-hidden="true"><i></i><i></i><i></i></div><span>Octo is swimming over…</span>';
    document.body.appendChild(el);
    var mo = new MutationObserver(function () {
      if (root.classList.contains('ui-loading')) return;
      mo.disconnect();
      setTimeout(function () { el.remove(); }, 500);
    });
    mo.observe(root, { attributes: true, attributeFilter: ['class'] });
  }

  // ---- the bond badge works from a keyboard too
  function badgeKeys() {
    var n = document.querySelector('.oc2-needs');
    if (!n) return false;
    n.tabIndex = 0; n.setAttribute('role', 'button'); n.setAttribute('aria-label', 'Bond and needs');
    n.addEventListener('keydown', function (e) { if (e.key === 'Enter' || e.key === ' ') { e.preventDefault(); n.click(); } });
    return true;
  }

  // ---- wardrobe on a phone: the octopus swims into the free water under the sheet
  function phonePortrait() { return window.matchMedia('(max-width:560px) and (orientation:portrait)').matches; }
  function roaming() {
    var H = window.__octoHouse, C = window.__octoCopyCat, K = window.__octoCare;
    return !(H && H.state && H.state !== 'roam') && !(C && C.on) && !(K && K.mode);
  }
  // octo() gives the centre and radius of the head; a crown or hat reaches about 1.7 radii above the centre
  var back = null;   // where it was before the wardrobe opened: it swims back there afterwards
  function showOff(sheet) {
    if (!sheet.classList.contains('open') || !phonePortrait() || !roaming()) return;
    var W = window.__octoWorld, K = window.__octoCare, c = K && K.octo ? K.octo() : null;
    if (!W || !W.goTo || W.swimming || !c) return;
    var bottom = sheet.getBoundingClientRect().bottom, y = bottom + c.r * 2.3 + 16;
    if (c.y - c.r * 1.7 > bottom + 4 || y > window.innerHeight - c.r * 1.5) return;   // already in view / no room below
    if (W.goTo(window.innerWidth / 2, y) && !back) back = { x: c.x, y: c.y };
  }
  function goBack() {
    var W = window.__octoWorld, b = back; back = null;
    if (b && W && W.goTo && roaming()) W.goTo(b.x, b.y);
  }
  function watchWardrobe() {
    var sheet = document.querySelector('.wd-sheet');
    if (!sheet) return false;
    var timer = 0, keep = 0, was = false;
    new MutationObserver(function () {
      var open = sheet.classList.contains('open');
      if (open === was) return; was = open;
      clearTimeout(timer); clearInterval(keep);
      if (!open) { goBack(); return; }
      timer = setTimeout(function () { showOff(sheet); }, 340);          // after the sheet's own transition
      keep = setInterval(function () { showOff(sheet); }, 2500);         // free swim drifts back up: bring it down again
    }).observe(sheet, { attributes: true, attributeFilter: ['class'] });
    return true;
  }

  function until(fn, n) { if (!fn() && n < 200) setTimeout(function () { until(fn, n + 1); }, 100); }
  function boot() {
    if (!document.body) return setTimeout(boot, 50);
    addLoader(); until(badgeKeys, 0); until(watchWardrobe, 0);
  }
  boot();
})();

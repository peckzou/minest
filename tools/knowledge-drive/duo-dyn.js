/* Minest Duo × Dynamic presentations (duo-dyn.js)
   On the iPhone Fold the screen you hold decides the layout — nothing to pick by hand:
   - half open, upright (html.duo-halfopen.duo-tall): the 3D keeps the upper screen; the lower screen becomes the
     mode's console — big tools down both sides, the card being read in the middle with its full text, and a strip of
     the current road / line / floor / shelf below it. Browse and read below while the trip goes on above.
   - open flat, sideways (inner, not tall): a book — the 3D on the left page, the same console on the right page.
   - folded (outer screen): the mode stays full screen with its bar trimmed to the essentials.
   Drive and Road Trip keep their own dashboard on the lower screen. Every tool here presses the mode's own button,
   so the modes keep one behaviour whichever screen they are on. */
(function () {
  'use strict';
  if (window.MinestDuoDyn) return;
  var R = document.documentElement;
  var K = function () { return window.KRail; };

  // the modes: root selector, button attribute, tools [action, icon, fallback label] for the left and right columns
  var MODES = [
    { id: 'train', sel: '.kt-root', at: 'kt', api: 'MinestTrain', icon: '🚆', l: [['play', '⏯', 'Go'], ['station', '⏭', 'Next station'], ['speed', '⚡', 'Speed']], r: [['map', '🗺', 'Map'], ['suggest', '🎨', 'Scenery'], ['exit', '✕', 'Exit']], road: 'line' },
    { id: 'metro', sel: '.km-root', at: 'km', api: 'MinestMetro', icon: '🚇', l: [['auto', '▶', 'Auto'], ['board', '🚇', 'Board'], ['xfer', '🔀', 'Transfer']], r: [['map', '🗺', 'Map'], ['lines', '☰', 'Lines'], ['suggest', '🎨', 'Theme']], road: 'lineTitle' },
    { id: 'tower', sel: '.ks-root', at: 'ks', api: 'MinestTower', icon: '🏙', l: [['go', '🛗', 'Ride'], ['cut', '✂️', 'Cutaway'], ['lock', '🔒', 'Lock']], r: [['skyline', '🌆', 'Skyline'], ['suggest', '🎨', 'Exterior'], ['exit', '✕', 'Exit']], road: 'floor' },
    { id: 'rack', sel: '.kr-root', at: 'kx', api: 'MinestRack', icon: '🎠', l: [['prev', '◀', 'Previous'], ['auto', '⟳', 'Auto'], ['next', '▶', 'Next']], r: [['mat', '🪵', 'Material'], ['suggest', '🎨', 'Shape'], ['exit', '✕', 'Exit']] },
    { id: 'library', sel: '.kl-root', at: 'kx', api: 'MinestLibrary', icon: '📚', l: [['prev', '◀', 'Previous'], ['walk', '🚶', 'Walk'], ['next', '▶', 'Next']], r: [['cats', '🗂', 'Sections'], ['out', '⤺', 'Step back'], ['suggest', '🎨', 'Atmosphere']], road: 'section' },
    { id: 'museum', sel: '.ku-root', at: 'kx', api: 'MinestMuseum', icon: '🏛', l: [['prev', '◀', 'Previous'], ['tour', '🎧', 'Tour'], ['next', '▶', 'Next']], r: [['map', '🗺', 'Map'], ['resume', '↩', 'Resume'], ['suggest', '🎨', 'Theme']] },
    { id: 'city', sel: '.kc-root', at: 'kx', api: 'MinestCity', icon: '🌆', l: [['prev', '◀', 'Previous'], ['run', '🏃', 'Run'], ['next', '▶', 'Next']], r: [['time', '🌗', 'Day/Night'], ['shops', '🏪', 'Shops'], ['out', '⤺', 'Avenue']] },
    { id: 'galaxy', sel: '.kg-root', at: 'kx', api: 'MinestGalaxy', icon: '🌌', l: [['warp', '⚡', 'Jump'], ['land', '🛬', 'Land'], ['cruise', '🚀', 'Cruise']], r: [['map', '🌌', 'Planets'], ['cockpit', '🪟', 'View'], ['exit', '✕', 'Exit']] }
  ];
  var cur = null, el = null, src = null, roads = [], roadI = 0, pick = null, lastSig = '', lastKey = '', infoC = {};

  // remember each mode's source when it opens (the strip shows that source's cards)
  function hook() {
    MODES.forEach(function (m) {
      var api = window[m.api]; if (!api || api.__ddy) return; api.__ddy = 1;
      var open = api.open; api.open = function (o) { src = (o && o.source) || { type: 'workspace' }; roads = []; pick = null; var r = open.apply(this, arguments); setTimeout(check, 60); return r; };
    });
  }
  function posture() {
    if (!R.classList.contains('duo')) return null;
    if (R.classList.contains('duo-outer')) return 'outer';
    if (R.classList.contains('duo-halfopen') && R.classList.contains('duo-tall')) return 'tent';
    if (R.classList.contains('duo-inner') && innerWidth > innerHeight * 1.15) return 'book';
    return null;
  }
  function active() {
    for (var i = 0; i < MODES.length; i++) { var root = document.querySelector(MODES[i].sel); if (root) return { m: MODES[i], root: root }; }
    return null;
  }
  function inst() { var api = cur && window[cur.m.api]; return api && api.current && api.current(); }
  function state() { try { var i = inst(); return i && i.state ? i.state() : {}; } catch (e) { return {}; } }
  function hap() { try { webkit.messageHandlers.minest.postMessage({ action: 'haptic', data: { style: 'selection' } }); } catch (e) {} }
  function esc(s) { return String(s == null ? '' : s).replace(/[&<>"']/g, function (c) { return { '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' }[c]; }); }
  function plain(s) { var k = K(); return k && k.plain ? k.plain(s || '') : String(s || '').replace(/<[^>]+>/g, ' '); }

  function check() {
    hook();
    var a = active(), p = posture();
    if (!a || !p) { off(); return; }
    var key = a.m.id + '|' + p;
    if (cur && cur.root === a.root && key === lastKey) return;   // nothing changed (our own class edits land here too)
    lastKey = key;
    if (!cur || cur.root !== a.root) { cur = a; lastSig = ''; build(); }
    ['tent', 'book', 'outer'].forEach(function (k) { var c = 'ddy-' + k; if ((p === k) !== R.classList.contains(c)) R.classList.toggle(c, p === k); });
    if (!R.classList.contains('ddy-on')) R.classList.add('ddy-on');
    if (R.getAttribute('data-ddy') !== a.m.id) R.setAttribute('data-ddy', a.m.id);
    if (el) el.hidden = p === 'outer';
    setTimeout(function () { window.dispatchEvent(new Event('resize')); }, 30);
  }
  function off() {
    if (!R.classList.contains('ddy-on')) return;
    R.classList.remove('ddy-on', 'ddy-tent', 'ddy-book', 'ddy-outer'); R.removeAttribute('data-ddy');
    if (el) el.hidden = true; cur = null; lastKey = ''; pick = null;
    window.dispatchEvent(new Event('resize'));
  }

  // ---------------- the console
  function press(act) {
    var b = cur && cur.root.querySelector('[data-' + cur.m.at + '="' + act + '"]');
    if (b) { b.click(); hap(); setTimeout(refresh, 120); }
  }
  function label(act, fb) {
    var b = cur && cur.root.querySelector('[data-' + cur.m.at + '="' + act + '"]');
    var t = b ? (b.getAttribute('aria-label') || b.textContent || '').replace(/^[^\w(]+/u, '').trim() : '';
    return t && t.length < 18 ? t : fb;
  }
  function tools(list) {
    return list.filter(function (t) { return t[0] === 'exit' || (cur.root.querySelector('[data-' + cur.m.at + '="' + t[0] + '"]')); })
      .map(function (t) { return '<button type="button" class="ddy-t" data-ddy-act="' + t[0] + '"><i>' + t[1] + '</i><span>' + esc(label(t[0], t[2])) + '</span></button>'; }).join('');
  }
  function build() {
    if (!el) {
      el = document.createElement('div'); el.className = 'ddy'; el.setAttribute('aria-label', 'Duo console');
      el.addEventListener('click', onClick);
      document.body.appendChild(el);
    }
    var m = cur.m;
    el.innerHTML = '<div class="ddy-col l">' + tools(m.l) + '</div>' +
      '<div class="ddy-mid"><div class="ddy-now"></div><div class="ddy-sh"><button type="button" class="ddy-nav" data-ddy-road="-1" aria-label="Previous">‹</button><b></b><button type="button" class="ddy-nav" data-ddy-road="1" aria-label="Next">›</button></div><div class="ddy-strip"></div></div>' +
      '<div class="ddy-col r">' + tools(m.r) + '</div>';
    el.hidden = false;
    loadRoads(); refresh(true);
  }
  function loadRoads() {
    var k = K(); if (!k) return;
    try { var P = k.defaultProvider(), PL = k.plan(P, src || { type: 'workspace' }); roads = PL.roads || []; } catch (e) { roads = []; }
    roadI = 0; infoC = {};
  }
  function cardInfo(ref) { var id = ref && (ref.bid + '/' + ref.col + '/' + ref.id); if (id && infoC[id] !== undefined) return infoC[id]; var k = K(), I = null; try { I = k.info(k.defaultProvider(), ref); } catch (e) {} if (id) infoC[id] = I; return I; }
  function findByTitle(t) {
    if (!t) return null;
    for (var i = 0; i < roads.length; i++) for (var j = 0; j < roads[i].items.length; j++) {
      var I = cardInfo(roads[i].items[j].ref); if (I && I.title === t) return { ri: i, j: j, I: I };
    }
    return null;
  }
  function roadFromState(s) {
    var key = cur.m.road, t = key && s[key]; if (!t) return -1;
    t = String(t).replace(/\s*[(（]\s*\d+\s*[)）]\s*$/, '').toLowerCase();
    for (var i = 0; i < roads.length; i++) { var a = String(roads[i].title || '').replace(/\s*[(（]\s*\d+\s*[)）]\s*$/, '').toLowerCase(); if (a && (t.indexOf(a) >= 0 || a.indexOf(t) >= 0)) return i; }
    return -1;
  }
  function refresh(force) {
    if (!cur || !el) return;
    var s = state(), reading = s.reading || s.focus || null;
    var follow = roadFromState(s); if (follow >= 0 && !pick) roadI = follow;
    var hit = reading ? findByTitle(reading) : null;
    if (hit && !pick) roadI = hit.ri;
    var sig = [roadI, reading, pick && pick.I.title, s.playing, s.auto, s.tour, s.walk].join('|');
    // tool labels follow the mode (Pause ↔ Go …)
    el.querySelectorAll('[data-ddy-act]').forEach(function (b) { var t = (cur.m.l.concat(cur.m.r)).filter(function (x) { return x[0] === b.dataset.ddyAct; })[0]; if (t) b.querySelector('span').textContent = label(t[0], t[2]); });
    if (!force && sig === lastSig) return; lastSig = sig;
    var show = pick || hit;
    // the card in the middle: the one being read above, or the one picked on this screen
    var now = el.querySelector('.ddy-now');
    if (show && show.I) {
      var I = show.I, body = plain(I.back || I.desc || I.notes || '');
      now.innerHTML = (I.img ? '<div class="ddy-img" style="background-image:url(\'' + esc(I.img) + '\')"></div>' : '<div class="ddy-img e">' + esc(I.emoji || (I.title || '?').slice(0, 1)) + '</div>') +
        '<div class="ddy-txt"><small>' + (pick ? '📖 Reading here' : '👆 Reading above') + '</small><b>' + esc(I.title) + '</b>' + (I.zh ? '<em>' + esc(I.zh) + '</em>' : '') +
        '<p>' + esc(body || 'This card has no back yet.') + '</p></div>' + (pick ? '<button type="button" class="ddy-x" data-ddy-close aria-label="Close">✕</button>' : '');
    } else {
      var rd = roads[roadI];
      now.innerHTML = '<div class="ddy-img e">' + cur.m.icon + '</div><div class="ddy-txt"><small>' + (s.playing === false ? 'Stopped' : 'On the way') + '</small><b>' + esc(rd ? rd.title : 'Knowledge') + '</b><p>Tap a card above to read it here in full · or tap one in the strip below.</p></div>';
    }
    // the strip: the current road / line / floor / shelf
    var rd2 = roads[roadI]; el.querySelector('.ddy-sh b').textContent = rd2 ? (rd2.title + ' · ' + rd2.items.length) : '';
    el.querySelector('.ddy-sh').style.setProperty('--c', rd2 ? rd2.color : '#888');
    var strip = el.querySelector('.ddy-strip');
    strip.innerHTML = rd2 ? rd2.items.map(function (it, j) {
      var I = cardInfo(it.ref) || { title: '?' }, on = (show && show.I && show.I.title === I.title);
      return '<button type="button" class="ddy-c' + (on ? ' on' : '') + '" data-ddy-card="' + j + '" style="--c:' + (rd2.color || '#888') + '">' + (I.img ? '<i style="background-image:url(\'' + esc(I.img) + '\')"></i>' : '<i class="e">' + esc(I.emoji || I.title.slice(0, 1)) + '</i>') + '<span>' + esc(I.title) + '</span></button>';
    }).join('') : '';
    var on = strip.querySelector('.on'); if (on) on.scrollIntoView({ block: 'nearest', inline: 'center' });
  }
  function onClick(e) {
    var b = e.target.closest('button'); if (!b || !cur) return; e.preventDefault();
    if (b.dataset.ddyAct) return press(b.dataset.ddyAct);
    if (b.dataset.ddyRoad) { if (!roads.length) return; roadI = (roadI + (+b.dataset.ddyRoad) + roads.length) % roads.length; pick = null; hap(); return refresh(true); }
    if (b.hasAttribute('data-ddy-close')) { pick = null; hap(); return refresh(true); }
    if (b.dataset.ddyCard != null) {
      var it = roads[roadI] && roads[roadI].items[+b.dataset.ddyCard], I = it && cardInfo(it.ref);
      if (I) { pick = { ri: roadI, j: +b.dataset.ddyCard, I: I }; hap(); refresh(true); }
    }
  }

  // ---------------- watch: modes opening / closing, folding / unfolding
  new MutationObserver(function () { check(); }).observe(document.body, { childList: true });
  new MutationObserver(function () { check(); }).observe(R, { attributes: true, attributeFilter: ['class'] });
  window.addEventListener('minest:hinge', function () { setTimeout(check, 80); });
  var rzT = 0; window.addEventListener('resize', function () { clearTimeout(rzT); rzT = setTimeout(check, 120); });
  setInterval(function () { if (cur && el && !el.hidden) refresh(false); }, 450);
  hook();
  window.MinestDuoDyn = { check: check, state: function () { return { on: !!cur, mode: cur && cur.m.id, posture: posture(), road: roads[roadI] && roads[roadI].title, pick: pick && pick.I.title }; } };
})();

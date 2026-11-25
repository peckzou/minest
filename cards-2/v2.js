/* 动态卡片 2.0 — the upgrade, laid over the unchanged 1.0 engine (window.MinestCoverModes, tools/cover-modes):
   · 队形变换: changing mode flies the cards from one formation to the next (1.0 cuts)
   · 模式台: every mode by name on a deck, keys 1-9 0 - and [ ], and 巡演 (a tour of all eleven)
   · 舞台: star dust and a floor glow in each mode's colour; the card in front gets a rim of light and a sheen
   · 看板: any board or list Minest keeps on this device (read only), or a sample deck
   window.Cards2 = { go(mode), tour(on), modes } */
(function () {
  'use strict';
  var CM = window.MinestCoverModes, D = window.Cards2Data;
  var slot = document.querySelector('.sf-slot[data-sf-view="coverflow"]');
  if (!CM || !D || !slot) return;
  var MODES = [['flow', '3D 封面', 'Cover Flow', '#5cc8ff'], ['wall', '卡片墙', 'Wall', '#8b9dff'], ['fan', '扇形', 'Fan', '#ffb86b'], ['helix', '螺旋', 'Helix', '#6ff0c2'], ['stack', '叠放', 'Stack', '#ff8fb1'], ['spiral', '旋涡', 'Spiral', '#c08bff'],
    ['orbit', '轨道', 'Orbit', '#5ee0ff'], ['sphere', '球体', 'Sphere', '#7fb0ff'], ['wave', '波浪', 'Wave', '#62e6d0'], ['ring', '环形', 'Ring', '#ff7ad9'], ['stream', '流光', 'Stream', '#f5a524'], ['rolodex', '旋转名片夹', 'Rolodex', '#e6b450']];
  var KEYS = ['1', '2', '3', '4', '5', '6', '7', '8', '9', '0', '-', '='];
  var $ = function (id) { return document.getElementById(id); };
  var calm = false; try { calm = matchMedia('(prefers-reduced-motion: reduce)').matches; } catch (e) {}
  function info(m) { for (var i = 0; i < MODES.length; i++) if (MODES[i][0] === m) return MODES[i]; return MODES[0]; }
  function esc(s) { return String(s == null ? '' : s).replace(/[&<>"']/g, function (c) { return { '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' }[c]; }); }

  /* ───────────── the stage ───────────── */
  var cv = document.createElement('canvas'); cv.id = 'v2-stage';
  var cx = cv.getContext('2d'), W = 0, H = 0, dust = [], ptr = { x: 0, y: 0, tx: 0, ty: 0 }, pulses = [], light = false, acc = [92, 200, 255];
  function rgb(hex) { var n = parseInt(hex.slice(1), 16); return [n >> 16, (n >> 8) & 255, n & 255]; }
  function fit() {
    var r = Math.min(2, window.devicePixelRatio || 1); W = slot.clientWidth; H = slot.clientHeight; cv.width = Math.max(1, Math.round(W * r)); cv.height = Math.max(1, Math.round(H * r)); cx.setTransform(r, 0, 0, r, 0, 0);
    var n = Math.round(Math.min(120, Math.max(46, W * H / 9000)));
    while (dust.length < n) dust.push({ x: Math.random(), y: Math.random(), z: .25 + Math.random() * .75, p: Math.random() * 6.28, c: Math.random() < .35 });
    dust.length = n;
  }
  function mount() {   // the 1.0 engine makes a new #cm-ov for every mode: the stage moves in under its cards
    var ov = $('cm-ov');
    if (ov && cv.parentNode !== ov) { ov.insertBefore(cv, ov.firstChild); fit(); }
    if (ov) { light = ov.classList.contains('stream') || ov.classList.contains('bg-light'); document.body.classList.toggle('v2-light', light); }
    $('v2-empty').hidden = !!(ov && (ov.querySelector('.cm-c') || ov.querySelector('.rdx-stage')));
  }
  new MutationObserver(mount).observe(slot, { childList: true });
  addEventListener('resize', fit);
  addEventListener('pointermove', function (e) { ptr.tx = e.clientX / (W || 1) - .5; ptr.ty = e.clientY / (H || 1) - .5; }, { passive: true });
  var lastT = performance.now();
  function draw(now) {
    requestAnimationFrame(draw);
    var dt = Math.min(.05, (now - lastT) / 1000); lastT = now;
    if (document.hidden || !cv.parentNode || !W) return;
    ptr.x += (ptr.tx - ptr.x) * Math.min(1, dt * 3); ptr.y += (ptr.ty - ptr.y) * Math.min(1, dt * 3);
    cx.clearRect(0, 0, W, H);
    for (var i = 0; i < dust.length; i++) {
      var d = dust[i];
      if (!calm) { d.y -= dt * .012 * d.z; d.x += dt * .004 * Math.sin(d.p + now / 4000); d.p += dt * (.6 + d.z); if (d.y < -.03) { d.y = 1.03; d.x = Math.random(); } }
      var x = ((d.x - ptr.x * .06 * d.z) % 1 + 1) % 1 * W, y = (d.y - ptr.y * .06 * d.z) * H, a = (.18 + .5 * d.z) * (.6 + .4 * Math.sin(d.p)), r = .5 + d.z * 1.5;
      cx.fillStyle = light ? 'rgba(40,60,100,' + (a * .35).toFixed(3) + ')' : d.c ? 'rgba(' + acc[0] + ',' + acc[1] + ',' + acc[2] + ',' + a.toFixed(3) + ')' : 'rgba(255,255,255,' + (a * .8).toFixed(3) + ')';
      cx.beginPath(); cx.arc(x, y, r, 0, 6.2832); cx.fill();
    }
    for (var k = pulses.length - 1; k >= 0; k--) {   // a ring of light runs out from the middle as the formation changes
      var p = pulses[k]; p.t += dt / .9; if (p.t >= 1) { pulses.splice(k, 1); continue; }
      var e = 1 - Math.pow(1 - p.t, 3);
      cx.strokeStyle = 'rgba(' + acc[0] + ',' + acc[1] + ',' + acc[2] + ',' + ((1 - p.t) * (light ? .5 : .4)).toFixed(3) + ')'; cx.lineWidth = 1 + 4 * (1 - p.t);
      cx.beginPath(); cx.ellipse(W / 2, H / 2, e * Math.max(W, H) * .62, e * Math.max(W, H) * .62 * .62, 0, 0, 6.2832); cx.stroke();
    }
  }
  requestAnimationFrame(draw);
  setInterval(function () {   // the card in front gets its rim (the engine marks it .act)
    var ov = $('cm-ov'); if (!ov) return;
    [].forEach.call(ov.querySelectorAll('.cm-c.act'), function (c) { if (!c.querySelector(':scope > .v2-rim')) { var i = document.createElement('i'); i.className = 'v2-rim'; c.appendChild(i); } });
    mount(); if (CM.get() !== painted) paint(CM.get());   // the mode was changed from outside the deck
  }, 300);

  /* ───────────── formation change ───────────── */
  var ghosts = $('v2-ghosts'), morphing = 0, capT = 0;
  function titleOf(el) { var t = el.querySelector('.tt,.rt,.fn,.wt'); return t ? t.textContent : ''; }
  function snap() {   // the cards on screen now, one per card (a mode may draw a card more than once): { key: { el, r } }
    var ov = $('cm-ov'), out = {}; if (!ov) return out;
    var vw = innerWidth, vh = innerHeight;
    [].forEach.call(ov.querySelectorAll('.cm-c'), function (el) {
      var r = el.getBoundingClientRect();
      if (r.width < 28 || r.height < 28 || r.right < 8 || r.left > vw - 8 || r.bottom < 8 || r.top > vh - 8) return;
      var cs = getComputedStyle(el); if (cs.display === 'none' || cs.visibility === 'hidden' || +cs.opacity < .12) return;
      var key = titleOf(el); if (!key) return;
      var d = Math.abs(r.left + r.width / 2 - vw / 2) / vw + Math.abs(r.top + r.height / 2 - vh / 2) / vh, s = { el: el, r: r, d: d, a: r.width * r.height, cs: cs };
      if (!out[key] || out[key].d > d) out[key] = s;
    });
    return out;
  }
  function ghost(key, s) {
    var g = document.createElement('div'), r = s.r, cs = s.cs, k = r.width / (s.el.offsetWidth || r.width);
    g.className = 'v2-g'; g.style.left = r.left + 'px'; g.style.top = r.top + 'px'; g.style.width = r.width + 'px'; g.style.height = r.height + 'px';
    g.style.borderRadius = Math.max(6, (parseFloat(cs.borderTopLeftRadius) || 14) * k) + 'px';
    if (cs.backgroundColor && cs.backgroundColor !== 'rgba(0, 0, 0, 0)') g.style.backgroundColor = cs.backgroundColor;
    if (cs.backgroundImage && cs.backgroundImage !== 'none') g.style.backgroundImage = cs.backgroundImage;
    if (cs.borderTopColor) g.style.borderColor = cs.borderTopColor;
    var art = s.el.querySelector('.im,.art,.fa,.fl'), bi = art && getComputedStyle(art).backgroundImage;
    if (bi && bi !== 'none') { var a = document.createElement('i'); a.style.backgroundImage = bi; g.appendChild(a); }
    var b = document.createElement('b'); b.textContent = key; b.style.fontSize = Math.max(9, Math.min(17, r.width * .085)) + 'px'; g.appendChild(b);
    g._r = r; return g;
  }
  function caption(m) {
    var c = $('v2-cap'), x = info(m); c.innerHTML = '<b>' + esc(x[1]) + '</b><small>' + esc(x[2]) + '</small>';
    c.classList.remove('on'); void c.offsetWidth; c.classList.add('on'); clearTimeout(capT); capT = setTimeout(function () { c.classList.remove('on'); }, 1600);
  }
  var painted = '';
  function paint(m) {
    painted = m; var x = info(m); acc = rgb(x[3]); document.documentElement.style.setProperty('--v2-acc', x[3]);
    [].forEach.call(document.querySelectorAll('#v2-modes button'), function (b) { var on = b.dataset.m === m; b.classList.toggle('on', on); b.setAttribute('aria-selected', on ? 'true' : 'false');
      if (on) { var box = $('v2-modes'), l = b.offsetLeft - (box.clientWidth - b.offsetWidth) / 2; if (box.scrollTo) box.scrollTo({ left: l, behavior: calm ? 'auto' : 'smooth' }); else box.scrollLeft = l; } });
  }
  function go(m, quiet) {
    if (window.MinestExplode && MinestExplode.isOpen && MinestExplode.isOpen()) MinestExplode.close(true);
    var my = ++morphing, from = calm ? {} : snap(), keys = Object.keys(from).sort(function (a, b) { return from[b].a - from[a].a; }).slice(0, 28), gs = {};
    ghosts.textContent = '';
    keys.forEach(function (k, i) { var g = gs[k] = ghost(k, from[k]); g.style.zIndex = String(100 - i); ghosts.appendChild(g); });
    document.body.classList.toggle('v2-morph', keys.length > 0);
    CM.set(m); paint(m); mount(); if (!quiet) caption(m);
    if (!calm) pulses.push({ t: 0 });
    if (!keys.length) return;
    setTimeout(function () {   // the new formation has had a few frames to take its places
      if (my !== morphing) return;
      var to = snap(), vw = innerWidth, vh = innerHeight, last = 0;
      keys.forEach(function (k, i) {
        var g = gs[k], a = g._r, t = to[k], dur = 560, delay = Math.min(160, i * 9), frames;
        if (t) { var b = t.r, sx = b.width / a.width, sy = b.height / a.height, dx = b.left - a.left, dy = b.top - a.top, lift = 1.07;
          frames = [{ transform: 'translate(0,0) scale(1,1)', opacity: 1 },
            { transform: 'translate(' + (dx * .5 - a.width * (lift - 1) * .25).toFixed(1) + 'px,' + (dy * .5 - 18).toFixed(1) + 'px) scale(' + ((1 + sx) / 2 * lift).toFixed(3) + ',' + ((1 + sy) / 2 * lift).toFixed(3) + ')', opacity: 1, offset: .5 },
            { transform: 'translate(' + dx.toFixed(1) + 'px,' + dy.toFixed(1) + 'px) scale(' + sx.toFixed(3) + ',' + sy.toFixed(3) + ')', opacity: 1, offset: .86 },
            { transform: 'translate(' + dx.toFixed(1) + 'px,' + dy.toFixed(1) + 'px) scale(' + sx.toFixed(3) + ',' + sy.toFixed(3) + ')', opacity: 0 }];
          dur = 640;
        } else {   // no place on screen in the new formation: it leaves outwards
          var ox = a.left + a.width / 2 - vw / 2, oy = a.top + a.height / 2 - vh / 2, l = Math.hypot(ox, oy) || 1;
          frames = [{ transform: 'translate(0,0) scale(1)', opacity: 1 }, { transform: 'translate(' + (ox / l * 140).toFixed(1) + 'px,' + (oy / l * 140).toFixed(1) + 'px) scale(.72)', opacity: 0 }]; dur = 380;
        }
        g.animate(frames, { duration: dur, delay: delay, easing: 'cubic-bezier(.3,.7,.2,1)', fill: 'both' }); last = Math.max(last, dur + delay);
      });
      setTimeout(function () { if (my === morphing) document.body.classList.remove('v2-morph'); }, Math.max(0, last - 300));
      setTimeout(function () { if (my === morphing) ghosts.textContent = ''; }, last + 40);
    }, 190);
  }

  /* ───────────── the mode deck, keys, the tour ───────────── */
  var box = $('v2-modes'), tourBtn = $('v2-tour'), tourT = 0, touring = false, played = false;
  /* Opened from Minest's 动态卡片 button: the deck also holds Minest's own views (看板 · 照片 · 图钉), and 3D 封面 is
     Minest's own iTunes-style Cover Flow — choosing one of these closes this page and Minest shows it. */
  var VIEWS = [['board', '看板', 'Board', '<rect x="3" y="4" width="5" height="16" rx="1.5"/><rect x="10" y="4" width="5" height="11" rx="1.5"/><rect x="17" y="4" width="4" height="7" rx="1.5"/>'],
    ['photos', '照片', 'Photos', '<rect x="3" y="5" width="18" height="14" rx="2"/><circle cx="9" cy="10" r="1.6"/><path d="M4 17l5-5 4 4 3-3 4 4"/>'],
    ['pins', '图钉', 'Pins', '<rect x="3" y="3" width="8" height="11" rx="1.5"/><rect x="13" y="3" width="8" height="7" rx="1.5"/><rect x="3" y="16" width="8" height="5" rx="1.5"/><rect x="13" y="12" width="8" height="9" rx="1.5"/>']];
  function inMinest() { var B = window.MinestV2Bridge; return !!(B && B.live && B.live()); }
  function leave(view) { var B = window.MinestV2Bridge; tour(false); if (B && B.close) B.close({ view: view }); }
  function pick(m) { if (m === 'flow' && inMinest()) { leave('coverflow'); return; } tour(false); go(m); }
  function addViews() {
    if (!inMinest() || box.querySelector('.vw')) return;
    var first = box.firstChild, sep = document.createElement('i'); sep.className = 'vw-sep'; sep.setAttribute('aria-hidden', 'true');
    VIEWS.forEach(function (v) {
      var b = document.createElement('button'); b.type = 'button'; b.className = 'vw'; b.dataset.v = v[0]; b.title = v[1] + ' · ' + v[2];
      b.innerHTML = '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.7" stroke-linecap="round" stroke-linejoin="round">' + v[3] + '</svg><span>' + v[1] + '</span>';
      b.onclick = function () { leave(v[0]); }; box.insertBefore(b, first);
    });
    box.insertBefore(sep, first);
  }
  MODES.forEach(function (x, i) {
    var b = document.createElement('button'); b.type = 'button'; b.dataset.m = x[0]; b.setAttribute('role', 'tab'); b.title = x[1] + ' · ' + x[2] + ' (' + KEYS[i] + ')';
    b.innerHTML = '<svg viewBox="0 0 24 24"></svg><span>' + esc(x[1]) + '</span><kbd>' + KEYS[i] + '</kbd>';
    b.onclick = function () { pick(x[0]); }; box.appendChild(b);
  });
  (function icons(n) {   // the deck wears the 1.0 key bar's own icons
    var bar = $('cm-bar'); if (!bar) { if (n < 80) setTimeout(function () { icons(n + 1); }, 50); return; }
    [].forEach.call(box.children, function (b) { var o = bar.querySelector('button[data-m="' + b.dataset.m + '"] svg'); if (o) b.replaceChild(o.cloneNode(true), b.firstChild); });
  })(0);
  function tour(on) {
    if (on === touring) return; touring = on; tourBtn.classList.toggle('on', on); clearInterval(tourT);
    if (on) { var pl = document.querySelector('#cm-bar .pl'); played = !!(pl && pl.classList.contains('on')); CM.play(true);   // (play() tells nothing: the 1.0 key shows whether it was already playing)
      var nx = function (at) { var i = MODES.indexOf(info(at)), n = MODES[(i + 1) % MODES.length][0]; return n === 'flow' && inMinest() ? MODES[(i + 2) % MODES.length][0] : n; };   /* in Minest, 3D 封面 is Minest's own view: the tour passes it */
      tourT = setInterval(function () { go(nx(CM.get())); }, 6500);
      go(nx(CM.get()));
    } else if (!played) CM.play(false);
  }
  tourBtn.onclick = function () { tour(!touring); };
  slot.addEventListener('pointerdown', function () { tour(false); }, true);
  document.addEventListener('keydown', function (e) {
    if (e.metaKey || e.ctrlKey || e.altKey || /input|textarea|select/i.test((e.target && e.target.tagName) || '') || $('xl')) return;
    var i = KEYS.indexOf(e.key), at = MODES.indexOf(info(CM.get()));
    if (i >= 0) pick(MODES[i][0]);
    else if (e.key === ']' || e.key === '[') pick(MODES[(at + (e.key === ']' ? 1 : MODES.length - 1)) % MODES.length][0]);
    else if (e.key === 't' || e.key === 'T') tour(!touring);
    else if (e.key === 'Escape') { panel(false); tour(false); }
  });

  /* ───────────── which board, which list ───────────── */
  var pn = $('v2-panel'), bb = $('v2-board');
  function lists(b) { return (b.columns || []).filter(function (c) { return (c.cards || []).length; }); }
  function sub() {
    var b = D.board(); if (!b) { $('v2-sub').textContent = ''; return; }
    var l = lists(b).filter(function (c) { return c.id === D.listId(); })[0], n = l ? D.count({ columns: [l] }) : D.count(b);
    $('v2-sub').textContent = (b.title || 'Minest') + (l ? ' › ' + l.title : '') + ' · ' + n + ' 张';
  }
  function panel(open) {
    if (!open) { pn.hidden = true; return; }
    var cur = D.board(), h = D.sample() ? '<div class="note">现在是示例卡片。在这台设备的 Minest 里有看板后，这里会列出你自己的看板（只读，不会改动）。</div>' : '';
    h += '<h4>看板 · BOARDS</h4>';
    D.boards().forEach(function (b) {
      var on = cur && b.id === cur.id;
      h += '<button type="button" class="bd' + (on ? ' on' : '') + '" data-b="' + esc(b.id) + '"><b>' + esc(b.title || 'Untitled') + '</b><small>' + D.count(b) + ' 张</small></button>';
      if (on && lists(b).length > 1) h += '<div class="ls"><button type="button" data-b="' + esc(b.id) + '" data-l=""' + (D.listId() ? '' : ' class="on"') + '>全部</button>' +
        lists(b).map(function (c) { return '<button type="button" data-b="' + esc(b.id) + '" data-l="' + esc(c.id) + '"' + (c.id === D.listId() ? ' class="on"' : '') + '>' + esc(c.title || 'List') + ' · ' + D.count({ columns: [c] }) + '</button>'; }).join('') + '</div>';
    });
    pn.innerHTML = h; pn.hidden = false;
  }
  bb.onclick = function (e) { e.stopPropagation(); panel(pn.hidden); };
  pn.addEventListener('click', function (e) {
    var b = e.target.closest('[data-b]'); if (!b) return; e.stopPropagation();
    D.pick(b.getAttribute('data-b'), b.getAttribute('data-l') || ''); panel(true);
  });
  document.addEventListener('pointerdown', function (e) { if (!pn.hidden && !pn.contains(e.target) && !bb.contains(e.target)) panel(false); }, true);
  var shown = '';
  function fresh() {   // other cards: the old ones leave, the new formation comes in
    var b = D.board(), k = b ? b.id + '|' + D.listId() + '|' + D.rev() : ''; sub(); if (k === shown) return; var first = !shown; shown = k;
    if (first) { CM.set(CM.get()); paint(CM.get()); mount(); } else { tour(false); go(CM.get(), true); }
  }
  window.addEventListener('cards2:data', fresh);

  paint(CM.get()); mount(); fresh();
  D.ready(function () { addViews(); if (CM.get() === 'flow' && inMinest()) go('wall', true); setTimeout(function () { caption(CM.get()); }, 250); });
  window.Cards2 = { go: go, tour: tour, modes: MODES.map(function (x) { return x[0]; }) };
})();

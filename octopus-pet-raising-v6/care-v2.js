/* Pet Raising — Care 2.0 (44.1)
   Turns care into play, using the octopus's face, expressions, motion and house:
   🍤 Feed   drag a snack to its mouth — eyes follow it, the mouth opens wider as it nears, chomp & munch;
             a daily favourite ("today's craving") earns love eyes + hearts; full → shakes its head.
   🫧 Bath   scrub it with your finger — foam builds where you rub; tentacles are ticklish (giggles);
             at 100% a rinse, a bath shake and sparkles.
   🎾 Play   Bubble Pop — it blows bubbles from its mouth, tap to pop (golden = +3), it cheers and
             counts combos, then celebrates with a spin.
   🤚 Pet    stroke its head for love eyes, slow blinks and hearts; tentacles = tickles.
   🌙 Sleep  it swims home to its house.
   Needs (hunger, fun, cleanliness, energy) change over time and are saved; the most pressing one shows
   as a thought bubble above it (tap it to start that care) and colours its mood through the
   Expression System. Bond grows with every care and levels up with a celebration. */
(function () {
  'use strict';
  if (window.__octoCare) return;
  function clamp(v, a, b) { return v < a ? a : v > b ? b : v; }
  function R(a, b) { return a + (b - a) * Math.random(); }
  var KEY = 'minest.octo.care.v2';
  var SNACKS = [
    { id: 'shrimp', e: '🦐', name: 'Shrimp', food: 26 },
    { id: 'cookie', e: '🍪', name: 'Kelp Cookie', food: 22 },
    { id: 'jelly', e: '⭐', name: 'Star Jelly', food: 18 },
    { id: 'berry', e: '🍓', name: 'Sea Berry', food: 16 }
  ];

  // ---- needs ------------------------------------------------------------------------------------
  var S = load();
  function load() {
    var d = { hunger: 35, fun: 70, clean: 80, energy: 85, bond: 0, t: Date.now() };
    try { var v = JSON.parse(localStorage.getItem(KEY) || 'null'); if (v) d = Object.assign(d, v); } catch (e) {}
    // catch up on time away (capped so it never comes back starving)
    var h = clamp((Date.now() - (d.t || Date.now())) / 3600000, 0, 24);
    d.hunger = clamp(d.hunger + h * 40, 0, 85); d.fun = clamp(d.fun - h * 30, 20, 100); d.clean = clamp(d.clean - h * 15, 25, 100); d.energy = clamp(d.energy + h * 30, 0, 100);
    d.t = Date.now();
    return d;
  }
  function save() { S.t = Date.now(); try { localStorage.setItem(KEY, JSON.stringify(S)); } catch (e) {} }
  function level() { return 1 + Math.floor(S.bond / 20); }
  function addBond(n) {
    var before = level(); S.bond += n; save();
    if (level() > before) celebrate('Lv ' + level() + ' · closer than ever!');
  }
  var DAY = new Date().toDateString(), fav = SNACKS[Math.abs(DAY.split('').reduce(function (a, c) { return a * 31 + c.charCodeAt(0) | 0; }, 7)) % SNACKS.length].id;

  // ---- helpers to the other modules --------------------------------------------------------------
  function A() { return window.__octopusAvatar; }
  function X() { return window.__octoExpression; }
  function M() { return window.__octoMouth; }
  function Ld() { return window.__octoLids; }
  function eyes(name, ms) { var e = window.__v6EyeHighlight; if (e && e.setExpression) e.setExpression(name, ms || 2500); }
  function mouth(clip) { var m = M(); if (m && m.play) m.play(clip, 40); }
  function lids(clip) { var l = Ld(); if (l && l.play) l.play(clip, 40); }
  function octo() { var x = X(); return x && x.octo ? x.octo() : null; }
  function attend(x, y) { var x2 = X(); if (x2 && x2.attend) x2.attend(x, y); }
  function busy() { var H = window.__octoHouse, C = window.__octoCopyCat; return (H && H.state && H.state !== 'roam') ? 'house' : (C && C.on) ? 'copycat' : null; }
  // hold the octopus still while you scrub / pet / play (free swim resumes afterwards)
  var held = false;
  function hold(on) {
    var av = A(); if (!av || held === on) return;
    held = on;
    var mo = window.__motionV4 || window.__motionV3; if (mo && mo.setEnabled) mo.setEnabled(!on);
    if (on) { av.freeSwimActive = false; try { av.referenceMotion && av.referenceMotion.play('breathing'); } catch (e) {} }
    else if (av.playAction) av.playAction('free_swim_aquarium');
  }

  // ---- UI ----------------------------------------------------------------------------------------
  var css = [
    '.oc2-dock{position:fixed;left:10px;top:50%;transform:translateY(-50%);z-index:40;display:flex;flex-direction:column;gap:8px;transition:transform .35s cubic-bezier(.2,.9,.25,1),opacity .35s}',
    // 44.2: Care 2.0 replaces the old Care button/panel; the dock tucks away when not in use
    'button.utility-toggle[aria-label="Pet care"]{display:none!important}',
    '.oc2-dock.tuck{transform:translate(-72px,-50%);opacity:0;pointer-events:none}',
    '.oc2-handle{position:fixed;left:0;top:50%;transform:translate(-4px,-50%);z-index:40;width:26px;height:64px;border-radius:0 14px 14px 0;border:1px solid rgba(255,255,255,.28);border-left:0;background:rgba(16,40,58,.55);backdrop-filter:blur(14px);-webkit-backdrop-filter:blur(14px);color:#fff;font:14px/1 system-ui;display:flex;align-items:center;justify-content:center;cursor:pointer;transition:opacity .3s,transform .3s}',
    '.oc2-handle.hide{opacity:0;pointer-events:none;transform:translate(-30px,-50%)}',
    '.oc2-handle.need{box-shadow:0 0 0 2px rgba(255,214,120,.85);animation:oc2pulse 1.4s ease-in-out infinite}',
    '.oc2-btn{width:48px;height:48px;border-radius:16px;border:1px solid rgba(255,255,255,.28);background:rgba(16,40,58,.5);backdrop-filter:blur(14px);-webkit-backdrop-filter:blur(14px);color:#fff;font:22px/1 system-ui;display:flex;flex-direction:column;align-items:center;justify-content:center;gap:1px;box-shadow:0 6px 16px rgba(0,0,0,.22);cursor:pointer;-webkit-tap-highlight-color:transparent;transition:transform .15s}',
    '.oc2-btn small{font:700 9px -apple-system,system-ui,sans-serif;opacity:.85}',
    '.oc2-btn:active{transform:scale(.92)}',
    '.oc2-btn.need{box-shadow:0 0 0 2px rgba(255,214,120,.85),0 6px 16px rgba(0,0,0,.22);animation:oc2pulse 1.4s ease-in-out infinite}',
    '@keyframes oc2pulse{50%{transform:scale(1.07)}}',
    '.oc2-needs{position:fixed;left:10px;top:calc(env(safe-area-inset-top,0px) + 10px);z-index:40;padding:7px 10px;border-radius:14px;background:rgba(10,30,45,.5);backdrop-filter:blur(14px);-webkit-backdrop-filter:blur(14px);color:#eaf6ff;font:700 11px -apple-system,system-ui,sans-serif;display:grid;grid-template-columns:auto 1fr;gap:3px 6px;align-items:center;min-width:132px;pointer-events:none}',
    '.oc2-needs .lv{grid-column:1/3;display:flex;justify-content:space-between;gap:8px}',
    '.oc2-bar{height:5px;border-radius:3px;background:rgba(255,255,255,.18);overflow:hidden}',
    '.oc2-bar i{display:block;height:100%;border-radius:3px;transition:width .6s}',
    '.oc2-thought{position:fixed;z-index:39;transform:translate(-50%,-100%);padding:6px 10px;border-radius:18px;background:rgba(255,255,255,.88);font:22px/1 system-ui;box-shadow:0 6px 18px rgba(0,0,0,.2);cursor:pointer;animation:oc2bob 2.4s ease-in-out infinite;transition:opacity .4s}',
    '.oc2-thought:after{content:"";position:absolute;left:30%;bottom:-9px;width:9px;height:9px;border-radius:50%;background:rgba(255,255,255,.88)}',
    '@keyframes oc2bob{50%{margin-top:-6px}}',
    '.oc2-layer{position:fixed;inset:0;z-index:45;touch-action:none}',
    '.oc2-hud{position:fixed;left:50%;top:calc(env(safe-area-inset-top,0px) + 12px);transform:translateX(-50%);z-index:47;padding:8px 14px;border-radius:999px;background:rgba(10,30,45,.62);color:#fff;font:800 13px -apple-system,system-ui,sans-serif;backdrop-filter:blur(14px);-webkit-backdrop-filter:blur(14px);white-space:nowrap}',
    'html.oc2-active #octo-cc-btn,html.oc2-active #octo-cc-panel{opacity:0!important;pointer-events:none!important}',
    '.oc2-done{position:fixed;left:50%;transform:translateX(-50%);top:calc(env(safe-area-inset-top,0px) + 54px);z-index:47;padding:10px 16px;border-radius:999px;border:0;background:#8f6bff;color:#fff;font:800 13px -apple-system,system-ui,sans-serif;box-shadow:0 8px 20px rgba(80,40,200,.4)}',
    '.oc2-tray{position:fixed;left:50%;bottom:calc(env(safe-area-inset-bottom,0px) + 14px);transform:translateX(-50%);z-index:46;display:flex;gap:10px;padding:10px 12px;border-radius:22px;background:rgba(255,255,255,.86);box-shadow:0 10px 30px rgba(0,0,0,.25)}',
    '.oc2-snack{position:relative;width:58px;height:66px;border-radius:16px;background:#fff6ef;display:flex;flex-direction:column;align-items:center;justify-content:center;font:30px/1 system-ui;touch-action:none;cursor:grab;user-select:none;-webkit-user-select:none}',
    '.oc2-snack small{font:700 9px -apple-system,system-ui,sans-serif;color:#7a5a4a;margin-top:3px}',
    '.oc2-snack.fav:before{content:"✨ Craving";position:absolute;top:-10px;left:50%;transform:translateX(-50%);font:800 9px -apple-system,system-ui,sans-serif;background:#ff8fb1;color:#fff;padding:2px 6px;border-radius:999px;white-space:nowrap}',
    '.oc2-drag{position:fixed;z-index:48;font:44px/1 system-ui;transform:translate(-50%,-50%);pointer-events:none;filter:drop-shadow(0 6px 8px rgba(0,0,0,.3));transition:transform .08s}',
    '.oc2-fx{position:fixed;z-index:48;pointer-events:none;font:20px/1 system-ui;transform:translate(-50%,-50%)}',
    '.oc2-foam{position:fixed;z-index:46;pointer-events:none;border-radius:50%;background:radial-gradient(circle at 35% 30%,#fff,rgba(255,255,255,.75) 45%,rgba(220,240,255,.4) 70%,rgba(255,255,255,0) 72%);transform:translate(-50%,-50%)}',
    '.oc2-pop{position:fixed;z-index:46;border-radius:50%;transform:translate(-50%,-50%);background:radial-gradient(circle at 34% 28%,rgba(255,255,255,.95),rgba(170,235,255,.35) 38%,rgba(110,200,240,.18) 70%);border:1.5px solid rgba(225,250,255,.9);box-shadow:0 0 14px rgba(150,235,255,.5),inset 0 0 8px rgba(255,255,255,.6)}',
    '.oc2-pop.gold{background:radial-gradient(circle at 34% 28%,#fff,rgba(255,226,120,.6) 40%,rgba(255,190,60,.3) 72%);border-color:#ffe08a;box-shadow:0 0 18px rgba(255,210,90,.7)}',
    '.oc2-toast{position:fixed;left:50%;top:38%;transform:translate(-50%,-50%);z-index:49;padding:12px 18px;border-radius:18px;background:rgba(255,255,255,.92);color:#3a2a5a;font:800 16px -apple-system,system-ui,sans-serif;box-shadow:0 12px 30px rgba(0,0,0,.25);pointer-events:none;animation:oc2toast 2.2s ease forwards;text-align:center}',
    '@keyframes oc2toast{0%{opacity:0;transform:translate(-50%,-40%) scale(.85)}12%{opacity:1;transform:translate(-50%,-50%) scale(1)}80%{opacity:1}100%{opacity:0;transform:translate(-50%,-60%)}}'
  ].join('\n');
  var dock, needsEl, thought, btns = {}, handle, tuckTimer = 0;
  function showDock(ms) {
    if (!dock) return;
    dock.classList.remove('tuck'); handle.classList.add('hide');
    clearTimeout(tuckTimer);
    tuckTimer = setTimeout(function () { if (!mode) { dock.classList.add('tuck'); handle.classList.remove('hide'); } }, ms || 4000);
  }
  function buildUI() {
    var st = document.createElement('style'); st.textContent = css; document.head.appendChild(st);
    dock = document.createElement('div'); dock.className = 'oc2-dock';
    [['feed', '🍤', 'Feed'], ['bath', '🫧', 'Bath'], ['play', '🎾', 'Play'], ['pet', '🤚', 'Pet'], ['sleep', '🌙', 'Sleep']].forEach(function (b) {
      var el = document.createElement('button'); el.type = 'button'; el.className = 'oc2-btn'; el.innerHTML = b[1] + '<small>' + b[2] + '</small>';
      el.setAttribute('aria-label', b[2]);
      el.addEventListener('pointerdown', function (e) { e.stopPropagation(); }, true);
      el.addEventListener('click', function (e) { e.preventDefault(); e.stopPropagation(); start(b[0]); });
      dock.appendChild(el); btns[b[0]] = el;
    });
    document.body.appendChild(dock);
    handle = document.createElement('button'); handle.type = 'button'; handle.className = 'oc2-handle hide'; handle.textContent = '💜'; handle.setAttribute('aria-label', 'Care');
    handle.addEventListener('pointerdown', function (e) { e.stopPropagation(); }, true);
    handle.addEventListener('click', function (e) { e.preventDefault(); e.stopPropagation(); showDock(6000); });
    document.body.appendChild(handle);
    dock.addEventListener('pointerdown', function () { showDock(6000); }, true);
    showDock(4000);
    needsEl = document.createElement('div'); needsEl.className = 'oc2-needs'; document.body.appendChild(needsEl);
    thought = document.createElement('div'); thought.className = 'oc2-thought'; thought.style.opacity = '0';
    thought.addEventListener('pointerdown', function (e) { e.stopPropagation(); }, true);
    thought.addEventListener('click', function (e) { e.stopPropagation(); if (thought.dataset.need) start(thought.dataset.need); });
    document.body.appendChild(thought);
    renderNeeds();
  }
  function bar(v, col) { return '<div class="oc2-bar"><i style="width:' + Math.round(clamp(v, 0, 100)) + '%;background:' + col + '"></i></div>'; }
  function renderNeeds() {
    var lv = level(), p = (S.bond % 20) / 20 * 100;
    needsEl.innerHTML = '<div class="lv"><span><i class="hrt">💜</i><b class="lvn">' + lv + '</b><span class="lvt"> Lv ' + lv + '</span></span><span class="pct" style="opacity:.7">' + Math.round(p) + '%</span></div>' +
      '<span>🍤</span>' + bar(100 - S.hunger, '#ffb36b') + '<span>🎾</span>' + bar(S.fun, '#7ee0a8') +
      '<span>🫧</span>' + bar(S.clean, '#8fd3ff') + '<span>⚡</span>' + bar(S.energy, '#ffe07a');
  }
  function fx(text, x, y, opts) {
    opts = opts || {};
    var el = document.createElement('div'); el.className = 'oc2-fx'; el.textContent = text; el.style.left = x + 'px'; el.style.top = y + 'px';
    if (opts.size) el.style.fontSize = opts.size + 'px';
    document.body.appendChild(el);
    var t0 = performance.now(), dx = opts.dx != null ? opts.dx : R(-30, 30), dy = opts.dy != null ? opts.dy : R(-90, -50), life = opts.life || 1300;
    (function step(now) {
      var u = (now - t0) / life; if (u >= 1) { el.remove(); return; }
      el.style.transform = 'translate(calc(-50% + ' + (dx * u) + 'px), calc(-50% + ' + (dy * u) + 'px)) scale(' + (0.6 + Math.min(u * 3, 1) * .5) + ')';
      el.style.opacity = String(u < .7 ? 1 : 1 - (u - .7) / .3);
      requestAnimationFrame(step);
    })(t0);
  }
  function toast(t) { var el = document.createElement('div'); el.className = 'oc2-toast'; el.textContent = t; document.body.appendChild(el); setTimeout(function () { el.remove(); }, 2300); }
  function celebrate(t) {
    toast('🎉 ' + t);
    var c = octo(); if (c) for (var i = 0; i < 14; i++) fx(['💜', '✨', '🫧', '⭐'][i % 4], c.x + R(-40, 40), c.y + R(-30, 20), { dx: R(-120, 120), dy: R(-180, -60), life: 1600 });
    eyes('happy', 3000); mouth('giggle'); lids('happy');
    var mo = window.__motionV4; if (mo && mo.spin && !held) setTimeout(function () { mo.spin('pirouette'); }, 300);
  }

  // ---- needs over time → thought bubble + mood ----------------------------------------------------
  var lastMood = 0, lastNeed = '';
  function needOf() {
    if (S.energy < 22) return ['sleep', '💤'];
    if (S.hunger > 68) return ['feed', '🍤'];
    if (S.fun < 32) return ['play', '🎾'];
    if (S.clean < 35) return ['bath', '🫧'];
    return null;
  }
  setInterval(function () {
    var H = window.__octoHouse, resting = H && H.state === 'resting';
    S.hunger = clamp(S.hunger + (resting ? .4 : 1) * 100 / 5400, 0, 100);     // ~90 min to hungry
    S.fun = clamp(S.fun - (resting ? 0 : 100 / 3600), 0, 100);
    S.clean = clamp(S.clean - 100 / 7200, 0, 100);
    S.energy = clamp(S.energy + (resting ? 100 / 90 : -100 / 2700), 0, 100);   // rests to full in ~1.5 min
    if (S.energy < 6 && H && H.state === 'roam' && !mode) H.goHome();
    if (Math.random() < .2) save();
    renderNeeds();
    var n = needOf();
    Object.keys(btns).forEach(function (k) { btns[k].classList.toggle('need', !!n && n[0] === k); });
    if (handle) handle.classList.toggle('need', !!n);
    var nk = n ? n[0] : '';
    if (nk && nk !== lastNeed) showDock(4000);      // a new need slides the dock out for a moment
    lastNeed = nk;
    var now = performance.now();
    if (!mode && !busy() && now - lastMood > 14000) {
      lastMood = now;
      if (n && n[0] === 'feed') eyes('sad', 4000);
      else if (n && n[0] === 'sleep') eyes('sleepy', 5000);
      else if (n && n[0] === 'play') eyes('sad', 3000);
      else if (!n && Math.random() < .5) eyes(Math.random() < .5 ? 'happy' : 'playful', 3500);
    }
  }, 1000);
  (function placeThought() {
    requestAnimationFrame(placeThought);
    if (!thought) return;
    var n = needOf(), c = octo(), show = !!n && !!c && !mode && !busy();
    thought.style.opacity = show ? '1' : '0'; thought.style.pointerEvents = show ? 'auto' : 'none';
    if (!show) return;
    thought.dataset.need = n[0]; if (thought.textContent !== n[1]) thought.textContent = n[1];
    thought.style.left = (c.x + c.r * .75) + 'px'; thought.style.top = (c.y - c.r * .9) + 'px';
  })();

  // ---- modes -------------------------------------------------------------------------------------
  var mode = null, layer = null, hud = null, doneBtn = null, cleanup = [];
  function start(kind) {
    if (mode) stop();
    var b = busy();
    if (b === 'house' && kind !== 'sleep') { var H = window.__octoHouse; if (H.state === 'resting') { toast('Sleeping · tap the house to wake it'); } return; }
    if (b === 'copycat') { toast('Turn off Copy Cat first'); return; }
    if (kind === 'sleep') { var H2 = window.__octoHouse; if (H2) H2.goHome(); return; }
    mode = kind;
    layer = document.createElement('div'); layer.className = 'oc2-layer'; document.body.appendChild(layer);
    hud = document.createElement('div'); hud.className = 'oc2-hud'; document.body.appendChild(hud);
    doneBtn = document.createElement('button'); doneBtn.className = 'oc2-done'; doneBtn.textContent = 'Done';
    doneBtn.addEventListener('click', function (e) { e.stopPropagation(); finish(); });
    document.body.appendChild(doneBtn);
    dock.style.opacity = '.35'; dock.style.pointerEvents = 'none';
    document.documentElement.classList.add('oc2-active');
    ({ feed: feedMode, bath: bathMode, play: playMode, pet: petMode })[kind]();
  }
  var onFinish = null;
  function finish() { if (onFinish) { var f = onFinish; onFinish = null; f(); } stop(); }
  function stop() {
    cleanup.forEach(function (f) { try { f(); } catch (e) {} }); cleanup = [];
    [layer, hud, doneBtn].forEach(function (el) { if (el) el.remove(); });
    layer = hud = doneBtn = null; mode = null; onFinish = null;
    dock.style.opacity = ''; dock.style.pointerEvents = '';
    document.documentElement.classList.remove('oc2-active');
    showDock(3000);
    hold(false); save(); renderNeeds();
  }

  // 🍤 FEED -----------------------------------------------------------------------------------------
  function feedMode() {
    layer.style.pointerEvents = 'none';
    hud.textContent = 'Drag a snack to its mouth 🍤';
    var tray = document.createElement('div'); tray.className = 'oc2-tray'; document.body.appendChild(tray);
    cleanup.push(function () { tray.remove(); });
    SNACKS.forEach(function (sn) {
      var el = document.createElement('div'); el.className = 'oc2-snack' + (sn.id === fav ? ' fav' : ''); el.innerHTML = sn.e + '<small>' + sn.name + '</small>';
      el.addEventListener('pointerdown', function (e) { e.preventDefault(); e.stopPropagation(); drag(sn, e); });
      tray.appendChild(el);
    });
    eyes('curious', 2500);
  }
  function drag(sn, e0) {
    var g = document.createElement('div'); g.className = 'oc2-drag'; g.textContent = sn.e; document.body.appendChild(g);
    var x = e0.clientX, y = e0.clientY, eager = false;
    function place() { g.style.left = x + 'px'; g.style.top = y + 'px'; }
    place();
    function mouthPt() { var m = M(); return m && m.point ? m.point() : null; }
    function move(e) {
      x = e.clientX; y = e.clientY; place(); attend(x, y);
      var mp = mouthPt(); if (!mp) return;
      var d = Math.hypot(x - mp.x, y - mp.y);
      var m = M();
      if (d < 170 && m && m.live) { m.live({ open: clamp(1.05 - d / 170, .25, 1), round: .15, smile: .5 }); if (!eager) { eager = true; eyes('surprised', 900); } }
      else eager = false;
    }
    function up() {
      window.removeEventListener('pointermove', move, true); window.removeEventListener('pointerup', up, true); window.removeEventListener('pointercancel', up, true);
      var mp = mouthPt(), d = mp ? Math.hypot(x - mp.x, y - mp.y) : 1e9;
      if (d < 80) eat(sn, g, mp); else sink(g);
    }
    window.addEventListener('pointermove', move, true); window.addEventListener('pointerup', up, true); window.addEventListener('pointercancel', up, true);
  }
  function eat(sn, g, mp) {
    if (S.hunger <= 6) {
      // full: pushes it away, shakes its head
      var av = A(); try { av.referenceMotion && av.referenceMotion.play('no_shake'); } catch (e) {}
      mouth('pout'); eyes('sad', 1500); toast('All full~');
      g.style.transition = 'left .5s, top .5s, opacity .5s'; g.style.left = (mp.x + 90) + 'px'; g.style.top = (mp.y + 140) + 'px'; g.style.opacity = '0';
      setTimeout(function () { g.remove(); }, 520);
      return;
    }
    g.style.transition = 'left .18s, top .18s, transform .18s, opacity .18s';
    g.style.left = mp.x + 'px'; g.style.top = mp.y + 'px'; g.style.transform = 'translate(-50%,-50%) scale(.25)'; g.style.opacity = '0';
    setTimeout(function () { g.remove(); }, 200);
    var isFav = sn.id === fav, m = M();
    if (m && m.live) m.live({ open: 0, press: 1, smile: .8 });
    setTimeout(function () { mouth('munch'); lids('happy'); }, 120);
    eyes(isFav ? 'love' : 'happy', 2600);
    S.hunger = clamp(S.hunger - sn.food * (isFav ? 1.5 : 1), 0, 100); S.fun = clamp(S.fun + 4, 0, 100);
    for (var i = 0; i < (isFav ? 6 : 2); i++) fx(isFav ? '💖' : '💜', mp.x + R(-20, 20), mp.y - 20, { life: 1200 });
    fx('+' + Math.round(sn.food * (isFav ? 1.5 : 1)) + ' 🍤', mp.x + 40, mp.y - 30, { size: 15, dx: 20, dy: -60 });
    if (isFav) setTimeout(function () { toast('Favourite ' + sn.name + '!'); }, 300);
    if (Math.random() < .35) setTimeout(function () { var mm = M(); if (mm && mm.bubbles) mm.bubbles(2); mouth('giggle'); }, 1300);   // a happy little burp
    addBond(isFav ? 3 : 1.5); renderNeeds();
  }
  function sink(g) {
    var x = parseFloat(g.style.left), y = parseFloat(g.style.top), t0 = performance.now(), floor = innerHeight * .9;
    eyes('curious', 1500); attend(x, y);
    (function step(now) {
      var u = (now - t0) / 1600; y += 2.2; x += Math.sin(u * 9) * .8;
      g.style.left = x + 'px'; g.style.top = Math.min(y, floor) + 'px'; g.style.opacity = String(1 - u);
      if (u < 1) requestAnimationFrame(step); else g.remove();
    })(t0);
  }

  // 🫧 BATH -----------------------------------------------------------------------------------------
  function bathMode() {
    hold(true);
    var progress = 0, lastX = null, lastY = null, lastTickle = 0, lastSquint = 0, foams = [], idle = performance.now();
    hud.textContent = 'Scrub it with your finger 🫧 0%';
    eyes('playful', 2000);
    function down(e) { lastX = e.clientX; lastY = e.clientY; }
    function move(e) {
      if (lastX == null) return;                 // only while the finger / button is down
      var c = octo(); if (!c) return;
      var x = e.clientX, y = e.clientY, d = Math.hypot(x - lastX, y - lastY);
      if (Math.hypot(x - c.x, y - c.y) > c.r * 1.25) { lastX = x; lastY = y; return; }
      idle = performance.now();
      if (d > 14) {
        var f = document.createElement('div'); f.className = 'oc2-foam'; var sz = R(16, 34);
        f.style.width = f.style.height = sz + 'px'; f.style.left = (x + R(-8, 8)) + 'px'; f.style.top = (y + R(-8, 8)) + 'px';
        document.body.appendChild(f); foams.push({ el: f, t: performance.now() });
        progress = Math.min(100, progress + d / (c.r * .18));
        hud.textContent = 'Scrub it with your finger 🫧 ' + Math.round(progress) + '%';
        lastX = x; lastY = y;
      }
      var now = performance.now();
      if (y > c.y + c.r * .2 && now - lastTickle > 900) { lastTickle = now; mouth('giggle'); eyes('playful', 1200); }     // ticklish tentacles
      else if (y <= c.y + c.r * .2 && now - lastSquint > 2200) { lastSquint = now; lids('happy'); }
      if (progress >= 100) rinse();
    }
    function up() { lastX = null; }
    layer.addEventListener('pointerdown', down); layer.addEventListener('pointermove', move); window.addEventListener('pointerup', up);
    var iv = setInterval(function () {
      var now = performance.now();
      foams = foams.filter(function (f) { var a = (now - f.t) / 4000; if (a >= 1) { f.el.remove(); return false; } f.el.style.opacity = String(1 - a * a); f.el.style.marginTop = (-a * 30) + 'px'; return true; });
      if (now - idle > 25000) finish();
    }, 120);
    cleanup.push(function () { clearInterval(iv); window.removeEventListener('pointerup', up); foams.forEach(function (f) { f.el.remove(); }); });
    var rinsed = false;
    function rinse() {
      if (rinsed) return; rinsed = true;
      var c = octo();
      foams.forEach(function (f, i) { setTimeout(function () { f.el.style.transition = 'margin-top 1s, opacity 1s'; f.el.style.marginTop = '-120px'; f.el.style.opacity = '0'; }, i * 8); });
      var av = A(); try { av.referenceMotion && av.referenceMotion.play('shiver'); } catch (e) {}
      if (c) for (var i = 0; i < 12; i++) fx(i % 2 ? '✨' : '💧', c.x + R(-c.r, c.r), c.y + R(-c.r * .6, c.r * .6), { dx: R(-90, 90), dy: R(-120, -30), life: 1400 });
      S.clean = 100; S.fun = clamp(S.fun + 8, 0, 100); addBond(2);
      eyes('happy', 3000); mouth('giggle'); lids('happy');
      toast('Squeaky clean ✨');
      setTimeout(function () { if (mode === 'bath') finish(); }, 1600);
    }
  }

  // 🎾 PLAY — Bubble Pop ----------------------------------------------------------------------------
  function playMode() {
    hold(true);
    var score = 0, combo = 0, lastPop = 0, bubbles = [], t0 = performance.now(), DUR = 20000, nextSpawn = 0, raf = 0, over = false;
    eyes('playful', 4000); mouth('puff');
    function spawn(now) {
      var m = M(), mp = m && m.point ? m.point() : null, c = octo();
      var x = mp ? mp.x : (c ? c.x : innerWidth / 2), y = mp ? mp.y - 10 : (c ? c.y : innerHeight / 2);
      var gold = Math.random() < .12, size = gold ? R(38, 48) : R(34, 58);
      var el = document.createElement('div'); el.className = 'oc2-pop' + (gold ? ' gold' : ''); el.style.width = el.style.height = size + 'px';
      layer.appendChild(el);
      var b = { el: el, x: x, y: y, vx: R(-60, 60), vy: R(-95, -60) * (gold ? 1.25 : 1), ph: R(0, 6), gold: gold, size: size };
      el.addEventListener('pointerdown', function (e) { e.preventDefault(); e.stopPropagation(); pop(b, now); });
      bubbles.push(b);
      if (Math.random() < .35) mouth('puff');
    }
    function pop(b) {
      if (b.popped) return; b.popped = true;
      var now = performance.now();
      combo = now - lastPop < 1100 ? combo + 1 : 1; lastPop = now;
      var pts = (b.gold ? 3 : 1) + (combo >= 3 ? 1 : 0); score += pts;
      b.el.style.transition = 'transform .16s, opacity .16s'; b.el.style.transform = 'translate(-50%,-50%) scale(1.5)'; b.el.style.opacity = '0';
      setTimeout(function () { b.el.remove(); }, 170);
      fx('+' + pts + (combo >= 3 ? ' ×' + combo : ''), b.x, b.y, { size: 15, dy: -50, life: 800 });
      attend(b.x, b.y);
      if (score % 3 === 0 || b.gold) { mouth('giggle'); lids('happy'); }
      hud.textContent = '🫧 Pop the bubbles! ' + score + ' pts · ' + Math.max(0, Math.ceil((DUR - (now - t0)) / 1000)) + 's';
    }
    var last = performance.now();
    (function step(now) {
      raf = requestAnimationFrame(step);
      var dt = Math.min(.05, (now - last) / 1000); last = now;
      if (!over && now > nextSpawn) { spawn(now); nextSpawn = now + R(520, 900); }
      bubbles = bubbles.filter(function (b) {
        if (b.popped) return false;
        b.ph += dt * 3; b.x += (b.vx * .4 + Math.sin(b.ph) * 30) * dt; b.y += b.vy * dt; b.vx *= .99;
        b.el.style.left = b.x + 'px'; b.el.style.top = b.y + 'px';
        if (b.y < -60) { b.el.remove(); return false; }
        return true;
      });
      var left = DUR - (now - t0);
      if (!over) hud.textContent = '🫧 Pop the bubbles! ' + score + ' pts · ' + Math.max(0, Math.ceil(left / 1000)) + 's';
      if (!over && left <= 0) { over = true; end(); }
    })(last);
    cleanup.push(function () { cancelAnimationFrame(raf); bubbles.forEach(function (b) { b.el.remove(); }); });
    function end() {
      S.fun = clamp(S.fun + Math.min(60, 10 + score * 3), 0, 100); S.energy = clamp(S.energy - 6, 0, 100);
      addBond(1 + score / 6);
      toast(score >= 15 ? '🏆 ' + score + ' pts! Amazing' : '🎉 ' + score + ' pts!');
      eyes('happy', 3000); mouth('giggle');
      setTimeout(function () { if (mode === 'play') { finish(); var mo = window.__motionV4; if (mo && mo.spin) setTimeout(function () { mo.spin(score >= 15 ? 'loop' : 'pirouette'); }, 400); } }, 1500);
    }
    onFinish = function () { if (!over) { over = true; S.fun = clamp(S.fun + Math.min(40, score * 3), 0, 100); addBond(score / 8); } };
  }

  // 🤚 PET ------------------------------------------------------------------------------------------
  function petMode() {
    hold(true);
    var lastX = null, lastY = null, dist = 0, lastHeart = 0, lastBlink = 0, lastTickle = 0, taps = [], idle = performance.now(), total = 0;
    hud.textContent = 'Pat its head 💜 · tickle a tentacle 😆';
    function down(e) {
      lastX = e.clientX; lastY = e.clientY; idle = performance.now();
      var now = performance.now(); taps = taps.filter(function (t) { return now - t < 1200; }); taps.push(now);
      if (taps.length >= 5) { taps = []; eyes('surprised', 1200); mouth('gasp'); lids('gasp'); toast('Whoa, too fast!'); }
    }
    function move(e) {
      if (lastX == null) return;
      var c = octo(); if (!c) return;
      var x = e.clientX, y = e.clientY, d = Math.hypot(x - lastX, y - lastY);
      lastX = x; lastY = y;
      if (Math.hypot(x - c.x, y - c.y) > c.r * 1.3) return;
      idle = performance.now(); dist += d; total += d;
      var now = performance.now();
      if (y < c.y + c.r * .15) {                  // head: love
        if (dist > 90 && now - lastHeart > 260) { dist = 0; lastHeart = now; fx('💜', x, y - 10, { life: 1100 }); S.fun = clamp(S.fun + .6, 0, 100); }
        if (now - lastBlink > 2600) { lastBlink = now; lids('love'); eyes('love', 2500); }
      } else if (now - lastTickle > 800) {        // tentacles: tickles
        lastTickle = now; mouth('giggle'); eyes('playful', 1200); fx('😆', x, y - 10, { life: 900, size: 18 });
      }
      if (total > 900) { total = 0; addBond(1); renderNeeds(); }
    }
    function up() { lastX = null; }
    layer.addEventListener('pointerdown', down); layer.addEventListener('pointermove', move); window.addEventListener('pointerup', up);
    var iv = setInterval(function () { if (performance.now() - idle > 15000) finish(); }, 500);
    cleanup.push(function () { clearInterval(iv); window.removeEventListener('pointerup', up); });
    eyes('happy', 2000);
  }

  // the original Care panel buttons open the new interactions too
  document.addEventListener('click', function (e) {
    var b = e.target && e.target.closest ? e.target.closest('button') : null;
    if (!b || b.closest('.oc2-dock')) return;
    var txt = (b.textContent || '').trim();
    var map = { Feed: 'feed', Play: 'play', Clean: 'bath', Pet: 'pet', Rest: 'sleep' };
    if (map[txt] && b.closest('[class*="care"], [class*="panel"], aside, section')) { e.preventDefault(); e.stopPropagation(); start(map[txt]); }
  }, true);

  function boot() { if (!document.body) return setTimeout(boot, 50); buildUI(); }
  boot();
  window.__octoCare = { start: start, stop: function () { if (mode) finish(); }, get state() { return Object.assign({}, S); }, get mode() { return mode; }, level: level, set: function (o) { Object.assign(S, o || {}); save(); renderNeeds(); },
    // 44.5: rewards from the board (ticks, rings, badges) — bond XP with the normal level-up celebration
    reward: function (n) { n = Number(n) || 0; if (n > 0) { addBond(n); renderNeeds(); } return level(); },
    fx: fx, toast: toast, celebrate: celebrate, octo: octo };
})();

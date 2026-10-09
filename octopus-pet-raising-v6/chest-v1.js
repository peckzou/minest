/* Pet Raising — the treasure chest (44.5)
   A wooden chest with brass bands sits on the sea floor (drawn like the house, behind the octopus).
   Closing all three activity rings on the board gives Octo a key (reward-v1 counts them). With a key
   the chest glows and twinkles; Octo swims over by itself (or you tap the chest), opens the lid, gold
   light pours out, and a new badge rises from the chest and flies into Octo's tentacle — it becomes the
   badge Octo holds (wardrobe → Hand → Badge in Hand). Badges found this way are kept in a collection. */
(function () {
  'use strict';
  if (window.__octoChest) return;
  function clamp(v, a, b) { return v < a ? a : v > b ? b : v; }
  function ease(t) { return t < .5 ? 2 * t * t : 1 - Math.pow(-2 * t + 2, 2) / 2; }
  function R(a, b) { return a + (b - a) * Math.random(); }
  var TAU = Math.PI * 2;
  var KEYS = 'minest.octo.chestKeys', COLL = 'minest.octo.treasure.v1';
  var POOL = ['octopus-polymath', 'lucy-axolotl', 'archimedes-owl', 'pikachu', 'perfect-week', 'minion-stuart', 'ender-dragon', 'sith-lightsaber', 'study-streak-365'];
  function keys() { return Math.max(0, parseInt(localStorage.getItem(KEYS) || '0', 10) || 0); }
  function setKeys(n) { try { localStorage.setItem(KEYS, String(Math.max(0, n))); } catch (e) {} updateLabel(); }
  function coll() { try { return JSON.parse(localStorage.getItem(COLL) || '{"opened":[]}'); } catch (e) { return { opened: [] }; } }
  function pretty(id) { return String(id || '').replace(/-/g, ' ').replace(/\b\w/g, function (c) { return c.toUpperCase(); }); }
  function A() { return window.__octopusAvatar; }

  var stage, cv, ctx, W = 0, H = 0, DPR = 1, label = null;
  var chest = { x: 0, y: 0, s: 110 };
  var open = 0, openTarget = 0, wiggle = 0, glow = 0, busy = false, t0 = performance.now();
  var sparks = [];

  function layout() {
    var w = stage.clientWidth, h = stage.clientHeight;
    if (!w || !h) return;
    DPR = Math.min(window.devicePixelRatio || 1, 1.5);
    W = w; H = h; cv.width = Math.round(w * DPR); cv.height = Math.round(h * DPR);
    var sRect = stage.getBoundingClientRect(), sand = document.querySelector('.ocean-sand'), y = h * .9;
    if (sand) { var r = sand.getBoundingClientRect(); y = clamp(r.top - sRect.top + Math.min(r.height, sRect.bottom - r.top) * .62, h * .7, h - 12); }
    chest.s = clamp(Math.min(w, h) * .13, 56, 100);
    chest.x = clamp(w * .2, chest.s * .8, w - chest.s * .8);
    chest.y = y;
    updateLabel();
  }

  // ---- drawing ------------------------------------------------------------------------------------
  function rr(c, x, y, w, h, r) { c.beginPath(); c.moveTo(x + r, y); c.arcTo(x + w, y, x + w, y + h, r); c.arcTo(x + w, y + h, x, y + h, r); c.arcTo(x, y + h, x, y, r); c.arcTo(x, y, x + w, y, r); c.closePath(); }
  function draw(now) {
    var c = ctx, s = chest.s, t = (now - t0) / 1000;
    c.setTransform(DPR, 0, 0, DPR, 0, 0); c.clearRect(0, 0, W, H);
    var k = keys(), ready = k > 0 && !busy;
    glow += ((ready ? 1 : 0) - glow) * .05;
    var wig = Math.sin(t * 40) * wiggle * .06; wiggle *= .9;
    var bw = s, bh = s * .5, lh = s * .3, x0 = chest.x - bw / 2, y1 = chest.y, y0 = y1 - bh;
    // 44.5: just the chest on the sand (no scallop, no dish)
    c.fillStyle = 'rgba(0,20,30,.28)'; c.beginPath(); c.ellipse(chest.x, chest.y + s * .02, bw * .62, s * .07, 0, 0, TAU); c.fill();
    c.save();
    c.translate(chest.x, y1); c.rotate(wig); c.translate(-chest.x, -y1);
    // waiting aura (a key is ready)
    if (glow > .01) {
      var pulse = .55 + .45 * Math.sin(t * 2.6);
      var ag = c.createRadialGradient(chest.x, y0, 4, chest.x, y0, s * 1.1);
      ag.addColorStop(0, 'rgba(255,220,120,' + (.38 * glow * pulse) + ')'); ag.addColorStop(1, 'rgba(255,200,80,0)');
      c.fillStyle = ag; c.beginPath(); c.arc(chest.x, y0, s * 1.1, 0, TAU); c.fill();
    }
    // light pouring out when open
    if (open > .05) {
      c.save(); c.globalCompositeOperation = 'lighter';
      var L = s * (1.6 + open * .8);
      for (var i = 0; i < 9; i++) {
        var a = -Math.PI / 2 + (i - 4) * .2 + Math.sin(t * .8 + i) * .05;
        var g = c.createLinearGradient(chest.x, y0, chest.x + Math.cos(a) * L, y0 + Math.sin(a) * L);
        g.addColorStop(0, 'rgba(255,230,140,' + (.42 * open) + ')'); g.addColorStop(1, 'rgba(255,210,90,0)');
        c.fillStyle = g; c.beginPath(); c.moveTo(chest.x - bw * .3, y0);
        c.lineTo(chest.x + Math.cos(a - .07) * L, y0 + Math.sin(a - .07) * L); c.lineTo(chest.x + Math.cos(a + .07) * L, y0 + Math.sin(a + .07) * L);
        c.lineTo(chest.x + bw * .3, y0); c.closePath(); c.fill();
      }
      var hg = c.createRadialGradient(chest.x, y0, 2, chest.x, y0, s * .9);
      hg.addColorStop(0, 'rgba(255,245,200,' + (.85 * open) + ')'); hg.addColorStop(1, 'rgba(255,210,90,0)');
      c.fillStyle = hg; c.beginPath(); c.arc(chest.x, y0, s * .9, 0, TAU); c.fill();
      c.restore();
    }
    // the chest: pale blue-grey planks, gold bands, rivets, keyhole plate and a ring handle (clay look)
    var gold = c.createLinearGradient(0, y0 - lh, 0, y1); gold.addColorStop(0, '#fbe6a2'); gold.addColorStop(.5, '#d9a945'); gold.addColorStop(1, '#9c6c1e');
    var plank = c.createLinearGradient(x0, 0, x0 + bw, 0); plank.addColorStop(0, '#aebed6'); plank.addColorStop(.4, '#d3deee'); plank.addColorStop(1, '#93a4c0');
    rr(c, x0, y0, bw, bh, s * .05); c.fillStyle = plank; c.fill();
    c.strokeStyle = 'rgba(70,90,130,.28)'; c.lineWidth = 1;
    for (var p = 1; p < 4; p++) { c.beginPath(); c.moveTo(x0 + 3, y0 + bh * p / 4); c.lineTo(x0 + bw - 3, y0 + bh * p / 4); c.stroke(); }
    var shade = c.createLinearGradient(0, y0, 0, y1); shade.addColorStop(0, 'rgba(255,255,255,.12)'); shade.addColorStop(1, 'rgba(30,40,80,.28)');
    rr(c, x0, y0, bw, bh, s * .05); c.fillStyle = shade; c.fill();
    c.fillStyle = gold;
    [.08, .92].forEach(function (f) { rr(c, x0 + bw * f - s * .045, y0 - 1, s * .09, bh + 1, s * .015); c.fill(); });
    [.3, .7].forEach(function (f) { rr(c, x0 + bw * f - s * .03, y0, s * .06, bh, s * .01); c.fill(); });
    rr(c, x0 - 1, y1 - s * .07, bw + 2, s * .07, s * .02); c.fill();
    c.fillStyle = '#fff3c4'; [.08, .92].forEach(function (f) { for (var rv = 0; rv < 3; rv++) { c.beginPath(); c.arc(x0 + bw * f, y0 + bh * (.18 + rv * .3), s * .012, 0, TAU); c.fill(); } });
    // ring handle on the side
    c.strokeStyle = gold; c.lineWidth = s * .022; c.beginPath(); c.arc(x0 - s * .005, y0 + bh * .5, s * .055, Math.PI * .5, Math.PI * 1.5); c.stroke();
    // the open mouth of the chest (inside glows)
    if (open > .05) {
      var ig = c.createLinearGradient(0, y0 - s * .05, 0, y0 + s * .08); ig.addColorStop(0, 'rgba(255,244,190,' + open + ')'); ig.addColorStop(1, 'rgba(200,140,60,' + open + ')');
      c.fillStyle = ig; c.beginPath(); c.ellipse(chest.x, y0, bw * .46, s * .065 * open + 1, 0, 0, TAU); c.fill();
    }
    // barrel lid (hinged at the back: as it opens the front edge rises and tips back)
    var lift = ease(open), ly = y0 - lift * lh * 1.2, ltop = ly - lh * (1 - lift * 1.55);
    var lidUnder = ltop > ly;
    c.beginPath(); c.moveTo(x0, ly); c.lineTo(x0 + bw, ly); c.bezierCurveTo(x0 + bw, ltop, x0, ltop, x0, ly); c.closePath();
    if (lidUnder) { c.fillStyle = '#6f7f9e'; c.fill(); }
    else {
      var lg = c.createLinearGradient(x0, ltop, x0 + bw, ly); lg.addColorStop(0, '#dbe5f3'); lg.addColorStop(.6, '#b4c3db'); lg.addColorStop(1, '#8e9fbd');
      c.fillStyle = lg; c.fill();
      c.save(); c.clip();
      c.strokeStyle = 'rgba(70,90,130,.25)'; c.lineWidth = 1;
      for (var q = 1; q < 3; q++) { c.beginPath(); c.moveTo(x0, ly - (ly - ltop) * q / 3); c.lineTo(x0 + bw, ly - (ly - ltop) * q / 3); c.stroke(); }
      c.fillStyle = gold;
      [.08, .92].forEach(function (f) { c.fillRect(x0 + bw * f - s * .045, ltop - 2, s * .09, ly - ltop + 4); });
      [.3, .7].forEach(function (f) { c.fillRect(x0 + bw * f - s * .03, ltop - 2, s * .06, ly - ltop + 4); });
      c.restore();
      c.fillStyle = gold; rr(c, x0 - 1, ly - s * .035, bw + 2, s * .045, s * .015); c.fill();
    }
    // keyhole plate
    var lx = chest.x, lyk = y0 + s * .1;
    c.fillStyle = gold; rr(c, lx - s * .07, lyk - s * .06, s * .14, s * .16, s * .03); c.fill();
    c.fillStyle = '#4a3410'; c.beginPath(); c.arc(lx, lyk + s * .005, s * .022, 0, TAU); c.fill(); c.beginPath(); c.moveTo(lx - s * .012, lyk + s * .01); c.lineTo(lx + s * .012, lyk + s * .01); c.lineTo(lx + s * .02, lyk + s * .07); c.lineTo(lx - s * .02, lyk + s * .07); c.closePath(); c.fill();
    c.restore();
    c.save(); c.translate(chest.x, y1); c.rotate(wig); c.translate(-chest.x, -y1);
    // twinkles while a key waits / sparks when open
    if (glow > .3 && Math.random() < .12) sparks.push({ x: chest.x + R(-bw * .5, bw * .5), y: y0 + R(-s * .2, bh * .6), vx: 0, vy: -R(6, 14), life: 0, max: R(.8, 1.4), r: R(1.5, 3) });
    if (open > .3 && Math.random() < .6) sparks.push({ x: chest.x + R(-bw * .3, bw * .3), y: y0, vx: R(-30, 30), vy: -R(40, 110), life: 0, max: R(.9, 1.8), r: R(1.5, 3.5) });
    c.globalCompositeOperation = 'lighter';
    for (var j = sparks.length - 1; j >= 0; j--) {
      var sp = sparks[j]; sp.life += 1 / 60; if (sp.life > sp.max) { sparks.splice(j, 1); continue; }
      sp.x += sp.vx / 60; sp.y += sp.vy / 60; sp.vy += 12 / 60;
      var al = 1 - sp.life / sp.max;
      c.fillStyle = 'rgba(255,236,160,' + al + ')'; c.beginPath(); c.arc(sp.x, sp.y, sp.r, 0, TAU); c.fill();
      c.fillStyle = 'rgba(255,255,255,' + al * .8 + ')'; c.fillRect(sp.x - sp.r * 2, sp.y - .5, sp.r * 4, 1); c.fillRect(sp.x - .5, sp.y - sp.r * 2, 1, sp.r * 4);
    }
    c.globalCompositeOperation = 'source-over';
    c.restore();
    if (sparks.length > 160) sparks.splice(0, sparks.length - 160);
  }

  function loop(now) {
    requestAnimationFrame(loop);
    open += (openTarget - open) * (openTarget > open ? .08 : .05);
    if (W) draw(now);
  }

  function updateLabel() {
    if (!label || !W) return;
    var k = keys();
    label.style.display = k > 0 && !busy ? '' : 'none';
    label.textContent = '🔑 ' + (k > 1 ? '×' + k + ' ' : '') + 'Tap to open';
    label.style.left = chest.x + 'px'; label.style.top = (chest.y - chest.s * 1.05) + 'px';
  }
  function say(t) {
    var c = window.__octoCare; if (c && c.toast) { c.toast(t); return; }
    var el = document.createElement('div'); el.className = 'oc2-toast'; el.textContent = t; document.body.appendChild(el); setTimeout(function () { el.remove(); }, 2300);
  }

  // ---- opening --------------------------------------------------------------------------------------
  function pickBadge() {
    var have = coll().opened || [];
    var left = POOL.filter(function (id) { return have.indexOf(id) < 0; });
    return left.length ? left[0] : POOL[Math.floor(Math.random() * POOL.length)];
  }
  function badgeImg(id) {
    var m = /^strike-(\d+)-days$/.exec(id), file = m ? 'strike-' + m[1] : id;
    return location.origin + '/badge-index/thumbs/' + file + '.webp';
  }
  function stageToScreen(x, y) { var r = stage.getBoundingClientRect(); return { x: r.left + x, y: r.top + y }; }
  function openChest(auto) {
    if (busy) return;
    if (keys() < 1) {
      wiggle = 1; if (!auto) say('Close all three rings to get a key 🔑');
      return;
    }
    var H2 = window.__octoHouse; if (H2 && H2.state && H2.state !== 'roam') { if (H2.state === 'resting' && H2.wake) H2.wake(); setTimeout(function () { openChest(auto); }, 3500); return; }
    busy = true; updateLabel();
    var o0 = window.__octoExpression && window.__octoExpression.octo ? window.__octoExpression.octo() : null, rad = o0 ? o0.r : 90;
    var target = stageToScreen(chest.x + chest.s * .5 + rad * .8, chest.y - chest.s * .9 - rad * .9);   // beside the chest, above it: the lid stays in view
    var W2 = window.__octoWorld; if (W2 && W2.goTo) W2.goTo(target.x, target.y);
    var X = window.__octoExpression, M = window.__octoMouth, Ld = window.__octoLids;
    if (X && X.set) X.set('curious', 4000);
    var tries = 0;
    (function arrive() {
      if (W2 && W2.swimming && tries++ < 40) { setTimeout(arrive, 100); return; }
      var av = A();
      try { if (av && av.playReferenceMotion) av.playReferenceMotion('tentacle_fan'); } catch (e) {}
      setTimeout(function () {
        openTarget = 1;
        if (X && X.set) X.set('surprised', 1600); if (M && M.play) M.play('gasp', 40); if (Ld && Ld.play) Ld.play('gasp', 40);
        setTimeout(function () { reveal(); }, 900);
      }, 500);
    })();
  }
  function reveal() {
    var id = pickBadge();
    var start = stageToScreen(chest.x, chest.y - chest.s * .55);
    var img = document.createElement('img'); img.src = badgeImg(id); img.alt = '';
    img.style.cssText = 'position:fixed;z-index:60;width:84px;height:84px;left:' + start.x + 'px;top:' + start.y + 'px;transform:translate(-50%,-50%) scale(.2);opacity:0;pointer-events:none;filter:drop-shadow(0 0 18px rgba(255,220,120,.9));transition:transform .7s cubic-bezier(.2,1.3,.4,1),opacity .3s';
    document.body.appendChild(img);
    requestAnimationFrame(function () { img.style.opacity = '1'; img.style.transform = 'translate(-50%,-150%) scale(1.15) rotate(-8deg)'; });
    // show it off for a moment, then fly to Octo's tentacle
    setTimeout(function () {
      var X = window.__octoExpression, o = X && X.octo ? X.octo() : null, to = o ? { x: o.x + o.r * .55, y: o.y + o.r * .2 } : { x: innerWidth / 2, y: innerHeight / 2 };
      img.style.transition = 'left .8s cubic-bezier(.5,0,.3,1),top .8s cubic-bezier(.5,0,.3,1),transform .8s,opacity .25s .6s';
      img.style.left = to.x + 'px'; img.style.top = to.y + 'px'; img.style.transform = 'translate(-50%,-50%) scale(.35) rotate(360deg)'; img.style.opacity = '0';
      setTimeout(function () { img.remove(); give(id); }, 850);
    }, 1500);
  }
  function give(id) {
    var c = coll(); if ((c.opened || []).indexOf(id) < 0) { c.opened = (c.opened || []).concat(id); try { localStorage.setItem(COLL, JSON.stringify(c)); } catch (e) {} }
    var b = { id: id, t: Date.now(), from: 'chest' };
    try { localStorage.setItem('minest.octo.latestBadge', JSON.stringify(b)); } catch (e) {}
    var K = window.MinestCosmetics, hatNew = false;
    if (K) {
      if (!K.isUnlocked('badge_held')) K.unlock('badge_held');
      if (K.isUnlocked && !K.isUnlocked('pirate_hat')) hatNew = K.unlock('pirate_hat');   // the first chest also holds a pirate hat
      var st = K.getState(); if (!st.equippedBySlot.hand || st.equippedBySlot.hand === 'badge_held') K.equipAccessory('badge_held');
    }
    try { window.dispatchEvent(new CustomEvent('minest-latest-badge', { detail: b })); } catch (e) {}
    setKeys(keys() - 1);
    var X = window.__octoExpression, M = window.__octoMouth, Ld = window.__octoLids, mo = window.__motionV4;
    if (X && X.set) X.set('happy', 3000); if (M && M.play) M.play('wheee', 40); if (Ld && Ld.play) Ld.play('love', 40);
    if (mo && mo.spin) setTimeout(function () { mo.spin('loop'); }, 300);
    say('🎁 Treasure! ' + pretty(id) + ' (' + coll().opened.length + '/' + POOL.length + ')');
    if (hatNew) setTimeout(function () { say('🏴‍☠️ There was a Pirate Hat in the chest too!'); }, 2600);
    setTimeout(function () { openTarget = 0; busy = false; updateLabel(); }, 3500);
  }

  function onTap(e) {
    if (!W) return;
    var r = stage.getBoundingClientRect(), x = e.clientX - r.left, y = e.clientY - r.top, s = chest.s;
    if (Math.abs(x - chest.x) > s * .65 || y > chest.y + s * .15 || y < chest.y - s * 1.0) return;
    openChest(false);
  }

  function install() {
    stage = document.querySelector('.avatar-stage');
    var av = A(), canvasWrap = stage && stage.querySelector('.avatar-canvas');
    if (!stage || !canvasWrap || !av || !av.importedModel || !av.camera) return false;
    cv = document.createElement('canvas'); cv.className = 'octo-chest';
    var st = document.createElement('style');
    st.textContent = '.octo-chest{position:absolute;left:0;top:0;width:100%;height:100%;pointer-events:none}' +
      '.octo-chest-label{opacity:1!important;position:absolute;z-index:9;transform:translate(-50%,-100%);padding:5px 11px;border-radius:999px;color:#fff;font:700 12px -apple-system,system-ui,sans-serif;pointer-events:none;white-space:nowrap;animation:chestBob 1.6s ease-in-out infinite}' +
      '@keyframes chestBob{50%{margin-top:-4px}}';
    document.head.appendChild(st);
    stage.insertBefore(cv, canvasWrap);
    label = document.createElement('div'); label.className = 'octo-chest-label octo-house-label'; stage.appendChild(label);
    ctx = cv.getContext('2d');
    if (window.ResizeObserver) new ResizeObserver(layout).observe(stage); else window.addEventListener('resize', layout);
    layout();
    window.addEventListener('pointerdown', onTap, { capture: true, passive: true });
    requestAnimationFrame(loop);
    // a key waiting from before: open it shortly after Pet Raising appears
    return true;
  }
  window.__octoChest = {
    open: function () { openChest(false); },
    addKey: function (n) { setKeys(keys() + (n || 1)); wiggle = .6; },   // it glows and waits to be tapped
    get keys() { return keys(); },
    get collection() { return coll().opened || []; },
    pool: POOL
  };
  (function wait(n) {
    if (install()) return;
    if (n < 400) setTimeout(function () { wait(n + 1); }, 150);
  })(0);
})();

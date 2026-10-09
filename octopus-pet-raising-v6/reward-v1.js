/* Pet Raising — board rewards (44.5)
   The Minest page keeps a queue of what you achieved on the board (ticks, rings, all three rings,
   badges, good pronunciation). When Pet Raising opens it says hello, receives the queue, turns it
   into bond XP for Octo with a happy greeting (and a wardrobe gift for badges / all three rings),
   and acknowledges the items so they are not given twice. */
(function () {
  'use strict';
  if (window.__octoRewards) return;
  window.__octoRewards = true;
  var inFrame = window.parent && window.parent !== window;
  if (!inFrame) return;
  var SEEN = 'minest.octo.rewardsSeen.v1';
  function seen() { try { return JSON.parse(localStorage.getItem(SEEN) || '[]'); } catch (e) { return []; } }
  function remember(ids) { try { localStorage.setItem(SEEN, JSON.stringify(seen().concat(ids).slice(-600))); } catch (e) {} }
  function C() { return window.__octoCare; }
  function ready() { var c = C(); return !!(c && c.reward && window.__octopusAvatar && window.__octopusAvatar.importedModel && !document.documentElement.classList.contains('ui-loading')); }

  var pending = [];
  window.addEventListener('message', function (e) {
    var d = e.data;
    if (!d || d.type !== 'minest-reward' || e.source !== window.parent) return;
    if (d.action === 'badge' && d.badge && d.badge.id) {   // the newest badge (Octo can hold it)
      var prev = null; try { prev = JSON.parse(localStorage.getItem('minest.octo.latestBadge') || 'null'); } catch (err) {}
      if (!prev || prev.id !== d.badge.id) {
        try { localStorage.setItem('minest.octo.latestBadge', JSON.stringify(d.badge)); } catch (err) {}
        try { window.dispatchEvent(new CustomEvent('minest-latest-badge', { detail: d.badge })); } catch (err) {}
      }
      (function unlock(n) { var K = window.MinestCosmetics; if (K && K.unlock) { if (!K.isUnlocked('badge_held')) K.unlock('badge_held'); return; } if (n < 50) setTimeout(function () { unlock(n + 1); }, 200); })(0);
      return;
    }
    if (d.action === 'batch' && d.items && d.items.length) {
      var have = seen(), fresh = d.items.filter(function (x) { return x && x.id && have.indexOf(x.id) < 0; });
      // acknowledge everything received (also old duplicates) so the page clears its queue
      try { window.parent.postMessage({ type: 'minest-reward', action: 'ack', ids: d.items.map(function (x) { return x.id; }) }, '*'); } catch (err) {}
      remember(fresh.map(function (x) { return x.id; }));
      pending = pending.concat(fresh);
      apply();
    }
  });

  var applyTimer = 0;
  function apply() {
    clearTimeout(applyTimer);
    if (!pending.length) return;
    if (!ready()) { applyTimer = setTimeout(apply, 400); return; }
    // let the scene settle a moment after opening, then greet
    applyTimer = setTimeout(function () { var items = pending; pending = []; greet(items); }, 700);
  }

  function greet(items) {
    var c = C(), n = { tick: 0, ring: 0, all: 0, badge: 0, pron: 0, study: 0 }, xp = 0, rings = [];
    items.forEach(function (x) {
      xp += Number(x.xp) || 0;
      if (x.kind === 'tick') n.tick++;
      else if (x.kind === 'ring') { n.ring++; rings.push(x.ring); }
      else if (x.kind === 'rings-all') n.all++;
      else if (x.kind === 'badge') n.badge++;
      else if (x.kind === 'pron') n.pron++;
      else if (x.kind === 'study') n.study++;   // 44.6 a finished Learning Path round
    });
    xp = Math.round(xp * 10) / 10;
    if (!xp) return;
    var H = window.__octoHouse; if (H && H.state === 'resting' && H.wake) H.wake();   // good news wakes Octo up
    var parts = [];
    if (n.tick) parts.push('✓×' + n.tick);
    if (n.ring) parts.push(rings.map(function (r) { return r === 'focus' ? '❤️' : r === 'check' ? '💚' : '🩵'; }).join('') + ' ring' + (n.ring > 1 ? 's' : ''));
    if (n.all) parts.push('🎉 all rings');
    if (n.badge) parts.push('🏅×' + n.badge);
    if (n.pron) parts.push('🗣️×' + n.pron);
    if (n.study) parts.push('📚×' + n.study);
    var big = n.all || n.badge || n.ring >= 2;
    // hearts fly in from the top of the screen to Octo, then the bond goes up
    var o = c.octo && c.octo(), cx = o ? o.x : innerWidth / 2, cy = o ? o.y : innerHeight / 2;
    var count = Math.min(16, 4 + Math.round(xp));
    for (var i = 0; i < count; i++) (function (i) {
      setTimeout(function () {
        var sx = cx + (Math.random() - .5) * innerWidth * .7, sy = 40 + Math.random() * 60;
        c.fx(['💜', '✨', '💖'][i % 3], sx, sy, { dx: cx - sx, dy: cy - sy, life: 900, size: 20 });
      }, i * 70);
    })(i);
    setTimeout(function () {
      var before = c.level();
      c.reward(xp);                                                  // level-ups celebrate by themselves
      var lv = c.level();
      c.toast('From your board: ' + parts.join(' · ') + '  +' + xp + ' 💜');
      if (lv === before) {
        var e = window.__v6EyeHighlight; if (e && e.setExpression) e.setExpression(big ? 'love' : 'excited', 2600);
        var m = window.__octoMouth; if (m && m.play) m.play(big ? 'wheee' : 'giggle', 40);
        var l = window.__octoLids; if (l && l.play) l.play(big ? 'love' : 'happy', 40);
        var mo = window.__motionV4; if (big && mo && mo.spin) setTimeout(function () { mo.spin(n.all ? 'loop' : 'pirouette'); }, 350);
        if (o) for (var k = 0; k < (big ? 10 : 5); k++) c.fx(['💜', '✨', '⭐'][k % 3], cx + (Math.random() - .5) * 60, cy - 10, { dx: (Math.random() - .5) * 200, dy: -60 - Math.random() * 120, life: 1500 });
      }
      // gifts: a badge brings the crown, all three rings bring the pearl-pink skin, a strike the scarf
      var K = window.MinestCosmetics, gift = false;
      if (K && K.rewardUnlock) {
        items.forEach(function (x) {
          if (x.kind === 'badge') gift = K.rewardUnlock(/^strike-/.test(x.badgeId || '') ? 'streak' : 'badge') || gift;
          if (x.kind === 'rings-all') gift = K.rewardUnlock('celebrate') || gift;
        });
      }
      if (gift) setTimeout(function () { c.toast('🎁 A gift for Octo is in the wardrobe!'); }, 2500);
      // all three rings closed = a key for the treasure chest (Octo opens it right after)
      if (n.all) setTimeout(function () { var ch = window.__octoChest; if (ch && ch.addKey) ch.addKey(n.all); else { try { localStorage.setItem('minest.octo.chestKeys', String((parseInt(localStorage.getItem('minest.octo.chestKeys') || '0', 10) || 0) + n.all)); } catch (e) {} } }, gift ? 4200 : 2600);
    }, count * 70 + 500);
  }

  // say hello once Pet Raising has loaded (the page then sends what is waiting)
  (function hello(n) {
    if (C() && C().reward) { try { window.parent.postMessage({ type: 'minest-reward', action: 'hello' }, '*'); } catch (e) {} return; }
    if (n < 200) setTimeout(function () { hello(n + 1); }, 150);
  })(0);
})();

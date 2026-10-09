/* Minest Desktop Pet · bridge (runs between the Mini Pet core and its behaviour script)
   The behaviour script (menu bubbles, tips, inbox, reactions) is the web one; the tools it opens live
   in the Minest page, so here they are stand-ins that send the request over the link. The native side
   hands it to the connected page (and brings the browser forward), or opens Minest with ?pet=<cmd>.
   Messages from the page arrive in __desktopLink.receive: the page's Mini Pet moves ('ctl'), its
   outfit ('look'), held badge ('badge') and tips ('tip'). */
(function () {
  'use strict';
  var post = window.__desktopPost || function () {};
  function cmd(name, arg) { post({ type: 'link', msg: { t: 'cmd', name: name, arg: arg == null ? null : arg } }); }
  window.MinestAI = {
    openBuilder: function () { cmd('build'); },
    openPronunciation: function (w) { cmd('speak', w || ''); },
    analyze: function () { cmd('analyze'); },
    showList: function (b, l) { cmd('act', { act: 'showlist', arg: b + '|' + l }); },
    board: function () { return null; }, boards: function () { return []; }
  };
  window.MinestLearn = { start: function () { cmd('study'); }, active: function () { return false; }, todayPlan: function () { return null; }, state: { step: 'idle', status: 'idle' } };
  window.MinestPetRaising = { open: function () { cmd('octo'); } };
  window.MinestRealtimeVoice43 = {
    open: function () { cmd('talk'); }, start: function () {}, close: function () {}, stop: function () {},
    ptt: function (phase) { cmd('ptt', phase === 'start' ? 'start' : 'end'); }, active: false
  };

  var linked = false, pendingTips = [];
  function C() { return window.__miniPetCtl; }
  function setLook(st) {
    var K = window.MinestCosmetics;
    if (!st || !K || !K.importState) return;
    try {
      if (JSON.stringify(K.getState()) !== JSON.stringify(st)) K.importState(st);
      localStorage.setItem('minest.octo.lookSynced', '1');
    } catch (e) {}
  }
  function setBadge(b) {
    if (!b || !b.id) return;
    try {
      var cur = JSON.parse(localStorage.getItem('minest.octo.latestBadge') || 'null');
      if (cur && cur.id === b.id) return;
      localStorage.setItem('minest.octo.latestBadge', JSON.stringify(b));
      var K = window.MinestCosmetics; if (K && !K.isUnlocked('badge_held')) K.unlock('badge_held');
      window.dispatchEvent(new CustomEvent('minest-latest-badge', { detail: b }));
    } catch (e) {}
  }
  function showTip(it) {
    var T = window.MinestTips;
    if (T && T.present && T.present(it)) return;
    pendingTips.push(it);   // the pet is busy right now: try again shortly
  }
  setInterval(function () { if (pendingTips.length) { var it = pendingTips.shift(); showTip(it); } }, 3000);

  window.__desktopLink = {
    receive: function (m) {
      if (!m || typeof m !== 'object') return;
      var c = C();
      if (m.t === 'ctl' && c && typeof c[m.m] === 'function') {
        var a = Array.isArray(m.a) ? m.a.slice() : [];
        if (m.m === 'lookAt') { a[0] = (+a[0] || .5) * innerWidth; a[1] = (+a[1] || .5) * innerHeight; }
        try { c[m.m].apply(c, a); } catch (e) {}
      }
      else if (m.t === 'look') setLook(m.look);
      else if (m.t === 'badge') setBadge(m.badge);
      else if (m.t === 'tip' && m.it) showTip(m.it);
      else if (m.t === 'hello') {
        setLook(m.look); setBadge(m.badge);
        if (c && m.base) try { c.setBase(m.base); } catch (e) {}
        if (!linked && c) try { c.say('Linked to Minest 🔗', 2000); c.hop(); } catch (e) {}
        linked = true;
      }
      else if (m.t === 'status') { linked = !!m.connected; }
      else if (m.t === 'diag-tap' && m.label) {   // a check: open the bubble menu and press one, as a click would
        window.dispatchEvent(new CustomEvent('minest:minipet-tap', { detail: { double: false } }));
        setTimeout(function () { var b = document.querySelector('.mpet-menu button[aria-label="' + String(m.label).replace(/"/g, '') + '"]'); if (b) b.click(); }, 500);
      }
      else if (m.t === 'diag-pixels') {   // a check: the average colour of the pet as drawn (WebKit rendering checks)
        var best = { r: 0, g: 0, b: 0, n: 0 }, tries = 0;
        (function sample() {
          requestAnimationFrame(function () {
            var cv = document.querySelector('#minest-mini-pet-p0 canvas'), gl = cv && (cv.getContext('webgl2') || cv.getContext('webgl'));
            if (gl) {
              var w = gl.drawingBufferWidth, h = gl.drawingBufferHeight, px = new Uint8Array(w * h * 4), o = { r: 0, g: 0, b: 0, n: 0 };
              gl.readPixels(0, 0, w, h, gl.RGBA, gl.UNSIGNED_BYTE, px);
              for (var i = 0; i < px.length; i += 16) if (px[i + 3] > 200) { o.r += px[i]; o.g += px[i + 1]; o.b += px[i + 2]; o.n++; }
              if (o.n > best.n) best = { r: Math.round(o.r / o.n), g: Math.round(o.g / o.n), b: Math.round(o.b / o.n), n: o.n };
            }
            if (++tries < 24) { sample(); return; }
            var K = window.MinestCosmetics;
            post({ type: 'link', msg: { t: 'diag-pixels', avg: best, skin: K && K.getState().equippedSkin, mode: K && K.getState().renderMode } });
          });
        })();
      }
      else if (m.t === 'diag') {   // a check from the page: what the desktop pet looks like right now
        var K = window.MinestCosmetics, say = document.querySelector('.mpet-say'), tip = document.querySelector('.mpet-tip');
        post({ type: 'link', msg: { t: 'diag', state: { ctl: !!c, visible: !!(c && c.visible), base: c && c.base, linked: linked,
          look: K && K.getState ? K.getState() : null, badge: JSON.parse(localStorage.getItem('minest.octo.latestBadge') || 'null'),
          say: say ? say.textContent : '', tip: tip ? tip.textContent : '', fx: document.querySelectorAll('.mpet-fx').length,
          size: [innerWidth, innerHeight], three: window.THREE && THREE.REVISION } } });
      }
    },
    get linked() { return linked; }
  };
  // the tip's ✕ / inbox rows run their action through MinestTips → runAct → the stand-ins above

  // the older native API (menu bar) on top of the shared pet
  var NEXT = ['wave', 'happy', 'bounce', 'thinking', 'nod', 'look', 'barrel_roll', 'spiral_ascend', 'sprint', 'dive_down', 'excited', 'keyboard_tap', 'reach', 'free_swim'], ni = -1;
  window.desktopPet = {
    playAction: function (name) { var c = C(); if (c) c.play(name); },
    nextAction: function () { var c = C(); if (!c) return; ni = (ni + 1) % NEXT.length; c.play(NEXT[ni]); c.hop(); },
    triggerReward: function (kind) {
      var k = kind === 'goal' ? 'rings-all' : kind === 'badge' || kind === 'streak' ? 'badge' : 'tick';
      try { window.dispatchEvent(new CustomEvent('minest:reward', { detail: { kind: k, t: Date.now() } })); } catch (e) {}
    },
    setVoiceState: function (state) { try { window.dispatchEvent(new CustomEvent('minest:voice-state', { detail: { state: state } })); } catch (e) {} },
    pause: function () {}, resume: function () {}
  };
})();

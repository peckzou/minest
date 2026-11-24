/* Minest · touch controls for the built-in voxel islands that only had a keyboard and a locked mouse
 * (教堂小岛 cathedrals-island/, 奇想主题乐园 theme-park-island/ — Antigravity's islands; the Philosophers' Island has its own).
 * A Minest add-on, loaded by one <script> line in each island's page; it changes none of the island's code. It speaks the
 * island's own inputs: the joystick presses W/A/S/D, a finger dragged on the view is a mouse drag (look around), a tap or
 * ✋ presses E (use the nearest thing — or open the guide when nothing is near; a tap only when the island shows its prompt), ⤒/⤓ hold Space / C, 飞 presses F.
 * Only on touch screens; with a mouse and keyboard nothing changes. Keep the <script> line when the island is copied in again. */
(function () {
  'use strict';
  var touch = ('ontouchstart' in window) || (window.matchMedia && matchMedia('(pointer:coarse)').matches);
  /* a screen that did not say it was a touch screen: the controls come the first time a finger touches it */
  if (!touch && !window.__mntForce) { var src = document.currentScript && document.currentScript.src; window.addEventListener('touchstart', function once() { window.removeEventListener('touchstart', once, true); if (window.__mntForce || !src) return; window.__mntForce = 1; var sc = document.createElement('script'); sc.src = src; document.body.appendChild(sc); }, true); return; }
  function key(code, down) {
    var k = code === 'Space' ? ' ' : code.replace(/^Key/, '').toLowerCase();
    window.dispatchEvent(new KeyboardEvent(down ? 'keydown' : 'keyup', { code: code, key: k, bubbles: true, cancelable: true }));
  }
  function tapKey(code) { key(code, true); setTimeout(function () { key(code, false); }, 60); }
  function mouse(target, type, x, y, mx, my) {
    var e = new MouseEvent(type, { clientX: x, clientY: y, bubbles: true, cancelable: true, button: 0 });
    try { Object.defineProperty(e, 'movementX', { value: mx || 0 }); Object.defineProperty(e, 'movementY', { value: my || 0 }); } catch (er) {}
    target.dispatchEvent(e);
  }

  var css = document.createElement('style');
  css.textContent = '#mnt-joy{position:fixed;left:calc(env(safe-area-inset-left,0px) + 18px);bottom:calc(env(safe-area-inset-bottom,0px) + 74px);width:118px;height:118px;border-radius:50%;background:rgba(15,23,42,.42);border:1px solid rgba(255,255,255,.28);z-index:30;touch-action:none}' +
    '#mnt-joy i{position:absolute;left:34px;top:34px;width:50px;height:50px;border-radius:50%;background:rgba(251,191,36,.85);pointer-events:none}' +
    '#mnt-btns{position:fixed;right:calc(env(safe-area-inset-right,0px) + 14px);bottom:calc(env(safe-area-inset-bottom,0px) + 74px);display:grid;grid-template-columns:repeat(2,52px);gap:8px;z-index:30}' +
    '#mnt-btns button{width:52px;height:52px;border-radius:50%;border:1px solid rgba(255,255,255,.3);background:rgba(15,23,42,.6);color:#fff;font:700 15px/1 -apple-system,"PingFang SC",sans-serif;touch-action:none;-webkit-user-select:none;user-select:none}' +
    '#mnt-btns button.use{background:rgba(244,114,182,.8);grid-column:1/3;width:auto;border-radius:26px}' +
    'canvas{touch-action:none}';
  document.head.appendChild(css);

  /* the island's own 'press E' prompt is showing: something is near enough to use */
  function promptShown() { return ['tp-action-prompt', 'ci-portal-prompt'].some(function (id) { var el = document.getElementById(id); return el && getComputedStyle(el).display !== 'none' && el.offsetParent !== null; }); }
  function init() {
    var cv = document.querySelector('canvas'); if (!cv) return setTimeout(init, 300);
    /* the joystick → W A S D */
    var joy = document.createElement('div'); joy.id = 'mnt-joy'; joy.setAttribute('aria-label', '移动摇杆'); joy.innerHTML = '<i></i>'; document.body.appendChild(joy);
    var knob = joy.firstChild, jid = null, held = {};
    function setKeys(dx, dy) {
      var want = { KeyW: dy < -0.35, KeyS: dy > 0.35, KeyA: dx < -0.35, KeyD: dx > 0.35 };
      Object.keys(want).forEach(function (c) { if (!!held[c] !== want[c]) { held[c] = want[c]; key(c, want[c]); } });
    }
    function moveJoy(t) { var r = joy.getBoundingClientRect(), dx = (t.clientX - r.left - r.width / 2) / 50, dy = (t.clientY - r.top - r.height / 2) / 50, l = Math.hypot(dx, dy); if (l > 1) { dx /= l; dy /= l; } knob.style.transform = 'translate(' + dx * 40 + 'px,' + dy * 40 + 'px)'; setKeys(dx, dy); }
    joy.addEventListener('touchstart', function (e) { e.preventDefault(); e.stopPropagation(); var t = e.changedTouches[0]; jid = t.identifier; mouse(cv, 'mousedown', t.clientX, t.clientY); mouse(window, 'mouseup', t.clientX, t.clientY); moveJoy(t); }, { passive: false });
    /* buttons: ✋ use (E), ⤒ jump / up (Space), ⤓ down (C), 飞 fly (F) */
    var btns = document.createElement('div'); btns.id = 'mnt-btns';
    btns.innerHTML = '<button type="button" data-hold="Space" aria-label="跳 / 上升">⤒</button><button type="button" data-hold="KeyC" aria-label="下降">⤓</button><button type="button" data-tap="KeyF" aria-label="飞行">飞</button><button type="button" data-tap="KeyT" aria-label="昼夜">☀︎</button><button type="button" class="use" data-tap="KeyE">✋ 互动</button>';
    document.body.appendChild(btns);
    [].forEach.call(btns.querySelectorAll('button'), function (b) {
      b.addEventListener('touchstart', function (e) { e.preventDefault(); e.stopPropagation(); if (b.dataset.hold) key(b.dataset.hold, true); else tapKey(b.dataset.tap); }, { passive: false });
      var up = function (e) { if (b.dataset.hold) { e.preventDefault(); key(b.dataset.hold, false); } };
      b.addEventListener('touchend', up); b.addEventListener('touchcancel', up);
    });
    /* a finger on the view: drag to look around, a quick tap to use the nearest thing */
    var lid = null, lx = 0, ly = 0, sx = 0, sy = 0, t0 = 0;
    cv.addEventListener('touchstart', function (e) {
      var t = e.changedTouches[0]; if (lid !== null) return;
      lid = t.identifier; lx = sx = t.clientX; ly = sy = t.clientY; t0 = Date.now();
      mouse(cv, 'mousedown', t.clientX, t.clientY);
    }, { passive: true });
    window.addEventListener('touchmove', function (e) {
      for (var i = 0; i < e.changedTouches.length; i++) {
        var t = e.changedTouches[i];
        if (t.identifier === jid) moveJoy(t);
        else if (t.identifier === lid) { mouse(window, 'mousemove', t.clientX, t.clientY, (t.clientX - lx) * 2.2, (t.clientY - ly) * 2.2); lx = t.clientX; ly = t.clientY; }
      }
    }, { passive: true });
    function end(e) {
      for (var i = 0; i < e.changedTouches.length; i++) {
        var t = e.changedTouches[i];
        if (t.identifier === jid) { jid = null; knob.style.transform = ''; setKeys(0, 0); }
        if (t.identifier === lid) { lid = null; mouse(window, 'mouseup', t.clientX, t.clientY); if (Date.now() - t0 < 260 && Math.hypot(t.clientX - sx, t.clientY - sy) < 10 && promptShown()) tapKey('KeyE'); }
      }
    }
    window.addEventListener('touchend', end); window.addEventListener('touchcancel', end);
  }
  if (document.readyState === 'loading') document.addEventListener('DOMContentLoaded', init); else init();
})();

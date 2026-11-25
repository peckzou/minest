/* Philosophers' Island · entrances you can find on foot, marked the way the Clun house's door is on the opening screen
 * (and the theme park's rides are): one soft warm-white ring that breathes over each door — every philosopher's hall,
 * the library, the workshop and the Time island's buildings. Near one, its name shows; tapping it walks you to the door.
 * It shrinks with distance and hides far away, behind you, in a panel or a conversation, and away from walking. */
(function (root) {
  'use strict';
  var TIME = [   /* [name, ring at x,z, teleport] — the Time island's walk-in buildings, as the compass sends you there */
    ['时光图书馆', 471.5, 46.5, { mode: 'walk', p: [471.5, 42, 50.5], t: [471.5, 45, 42] }],
    ['Sphere 巨幕', 479, 64.5, { mode: 'walk', p: [474.5, 42, 66], t: [487.5, 50, 62.5] }],
    ['词根馆', 461.5, 58.5, { mode: 'walk', p: [465.5, 42, 58.5], t: [455, 43.5, 58.5] }],
    ['光锥', 471.5, 66, { mode: 'walk', p: [471.5, 42, 70], t: [471.5, 44, 56] }],
    ['EC-6 学习馆', 465.5, 72, { mode: 'walk', p: [468, 42, 72], t: [459, 43, 72] }]
  ];
  function start(V) {
    var T = root.THREE, W = V.world, v = new T.Vector3(), marks = [];
    var css = document.createElement('style'); css.textContent =
      '.pir-door{position:fixed;left:0;top:0;z-index:30;display:none;cursor:pointer;padding:6px;-webkit-tap-highlight-color:transparent}' +
      '.pir-door i{display:block;width:46px;height:46px;border-radius:50%;border:2px solid rgba(255,248,225,.95);box-shadow:0 0 18px rgba(255,235,180,.9),inset 0 0 12px rgba(255,235,180,.6);animation:pirPulse 1.8s ease-in-out infinite}' +
      '.pir-door b{position:absolute;left:50%;top:100%;transform:translateX(-50%);margin-top:2px;font:600 12px/1 -apple-system,"PingFang SC",sans-serif;color:#fff;padding:6px 10px;border-radius:12px;background:rgba(40,52,40,.55);backdrop-filter:blur(6px);-webkit-backdrop-filter:blur(6px);white-space:nowrap;opacity:0;transition:opacity .25s;pointer-events:none}' +
      '.pir-door.near b{opacity:1}' +
      '@keyframes pirPulse{0%,100%{transform:scale(.85);opacity:.75}50%{transform:scale(1.15);opacity:1}}';
    document.head.appendChild(css);
    function add(name, x, y, z, go) {
      var el = document.createElement('div'); el.className = 'pir-door'; el.innerHTML = '<i></i><b></b>'; el.lastChild.textContent = name;
      el.addEventListener('click', function (e) { e.stopPropagation(); go(); });
      document.body.appendChild(el); marks.push({ el: el, x: x, y: y, z: z, on: false });
    }
    (W.PHILOSOPHERS || []).forEach(function (p) {
      var gy = isFinite(p.gy) ? p.gy : 40, dx = p.x + 0.5, dz = p.z + Math.floor(p.d / 2) + 3.5;   /* the door, as the compass's doorOf */
      add(p.name, dx, gy + 1.6, dz, function () { V.teleport({ mode: 'walk', p: [dx, gy + 2, dz + 2.5], t: [dx, gy + 1.5, dz - 6] }); });
    });
    (W.landmarks || []).forEach(function (l) {
      if ((l.id !== 'library' && l.id !== 'workshop') || !l.tp) return;
      var a = l.tp.p, b = l.tp.t, k = 4 / Math.max(1, Math.hypot(b[0] - a[0], b[2] - a[2]));   /* a few steps in from where it sets you down */
      add(String(l.name || '').split(' · ')[0], a[0] + (b[0] - a[0]) * k, a[1] + 0.6, a[2] + (b[2] - a[2]) * k, function () { V.teleport(l.tp); });
    });
    TIME.forEach(function (t) { add(t[0], t[1], 43, t[2], function () { V.teleport(t[3]); }); });
    function tick() {
      requestAnimationFrame(tick);
      var S = V.S || {}, cam = V.camera, pp = V.player && V.player.pos, Wd = innerWidth, H = innerHeight;
      var hide = !!S.ui || !!S.sit || (S.mode !== 'walk' && S.mode !== 'fly') || !!S.cine || document.body.classList.contains('pi-cine');
      for (var i = 0; i < marks.length; i++) {
        var k = marks[i], show = false, d = pp ? Math.hypot(pp.x - k.x, pp.z - k.z) : 999;
        if (!hide && cam && d < 80 && d > 1.2) {
          v.set(k.x, k.y, k.z).project(cam);
          if (v.z < 1 && v.x > -1.1 && v.x < 1.1 && v.y > -1.1 && v.y < 1.1) {
            show = true;
            var s = Math.max(0.5, Math.min(1, 12 / Math.max(d, 1)));
            k.el.style.transform = 'translate(' + ((v.x + 1) / 2 * Wd).toFixed(1) + 'px,' + ((1 - v.y) / 2 * H).toFixed(1) + 'px) translate(-50%,-50%) scale(' + s.toFixed(2) + ')';
            k.el.classList.toggle('near', d < 18);
          }
        }
        if (show !== k.on) { k.on = show; k.el.style.display = show ? 'block' : 'none'; }
      }
    }
    requestAnimationFrame(tick);
  }
  (function wait(n) { var V = root.__philosophersIsland; if (V && V.world && V.camera) start(V); else if (n < 600) setTimeout(function () { wait(n + 1); }, 250); })(0);
})(window);

/* Ride entrances you can find on foot, marked the way the Clun house's door is on the opening screen: one soft
 * warm-white ring that breathes, standing over each ride's boarding spot. Tapping it boards the ride. It shrinks with
 * distance, hides far away, behind you, while riding and while a panel is open. Rides registered later (the staged
 * shows) get theirs on the next sweep. */
(function (root) {
  'use strict';
  function start(API) {
    var T = API.THREE, marks = {}, v = new T.Vector3();
    var css = document.createElement('style'); css.textContent =
      '.rr-door{position:fixed;left:0;top:0;z-index:30;display:none;cursor:pointer;padding:6px;-webkit-tap-highlight-color:transparent}' +
      '.rr-door i{display:block;width:46px;height:46px;border-radius:50%;border:2px solid rgba(255,248,225,.95);box-shadow:0 0 18px rgba(255,235,180,.9),inset 0 0 12px rgba(255,235,180,.6);animation:rrPulse 1.8s ease-in-out infinite}' +
      '.rr-door b{position:absolute;left:50%;top:100%;transform:translateX(-50%);margin-top:2px;font:600 12px/1 -apple-system,"PingFang SC",sans-serif;color:#fff;padding:6px 10px;border-radius:12px;background:rgba(40,52,40,.55);backdrop-filter:blur(6px);-webkit-backdrop-filter:blur(6px);white-space:nowrap;opacity:0;transition:opacity .25s;pointer-events:none}' +
      '.rr-door.near b{opacity:1}' +
      '@keyframes rrPulse{0%,100%{transform:scale(.85);opacity:.75}50%{transform:scale(1.15);opacity:1}}' +
      'body.ride-on .rr-door,body.cine-on .rr-door{display:none!important}';
    document.head.appendChild(css);
    var short = function (n) { return String(n || '').split(/[（(]/)[0].split(' · ')[0].trim(); };
    function make(id, r) {
      var p = r.boardPos; if (!p || !isFinite(p.x) || !isFinite(p.z)) return null;
      var el = document.createElement('div'); el.className = 'rr-door'; el.innerHTML = '<i></i><b>' + short(r.name) + '</b>';
      el.addEventListener('click', function (e) { e.stopPropagation(); var P = API.getPortals && API.getPortals(); if (P && P.playRideAudio) P.playRideAudio(id); API.boardRide(id); });
      document.body.appendChild(el);
      return { el: el, x: p.x, y: (isFinite(p.y) ? p.y : API.groundY(p.x, p.z, 62)) + 1.4, z: p.z, on: false };
    }
    function sweep() {
      var R = (API.getProps() || {}).rides || {};
      Object.keys(R).forEach(function (id) { if (!(id in marks) && id !== 'sw_workshop' && R[id] && R[id].boardPos) marks[id] = make(id, R[id]); });
    }
    sweep(); setInterval(sweep, 3000);
    function tick() {
      requestAnimationFrame(tick);
      var st = API.state || {}, P = API.getPortals && API.getPortals();
      var hide = !!st.activeRide || !!(P && ((P.isModalOpen && P.isModalOpen()) || (P.isDialogueOpen && P.isDialogueOpen())));
      var cam = API.camera, pp = API.player && API.player.pos, W = innerWidth, H = innerHeight;
      Object.keys(marks).forEach(function (id) {
        var k = marks[id]; if (!k) return;
        var show = false, d = pp ? Math.hypot(pp.x - k.x, pp.z - k.z) : 999;
        if (!hide && cam && d < 90) {
          v.set(k.x, k.y, k.z).project(cam);
          if (v.z < 1 && v.x > -1.1 && v.x < 1.1 && v.y > -1.1 && v.y < 1.1) {
            show = true;
            var s = Math.max(0.5, Math.min(1, 14 / Math.max(d, 1)));
            k.el.style.transform = 'translate(' + ((v.x + 1) / 2 * W).toFixed(1) + 'px,' + ((1 - v.y) / 2 * H).toFixed(1) + 'px) translate(-50%,-50%) scale(' + s.toFixed(2) + ')';
            k.el.classList.toggle('near', d < 22);
          }
        }
        if (show !== k.on) { k.on = show; k.el.style.display = show ? 'block' : 'none'; }
      });
    }
    requestAnimationFrame(tick);
  }
  if (root.TPParkAPI && root.TPParkAPI.scene) start(root.TPParkAPI);
  else root.addEventListener('tp:park-ready', function (e) { start(e.detail || root.TPParkAPI); }, { once: true });
})(window);

/* Ride entrances you can find on foot: at every ride's boarding spot, rings of light ripple out over the ground and a
 * soft column of light rises, so an entrance shows from across the land. New rides (registered later, e.g. the staged
 * shows that build on first boarding) get theirs on the next sweep. Hidden while riding. */
(function (root) {
  'use strict';
  function start(API) {
    var T = API.THREE, marks = {}, RINGS = 3, PERIOD = 2.4;
    var ringGeo = new T.RingGeometry(0.8, 1, 48), beamGeo = new T.CylinderGeometry(1.1, 1.6, 26, 24, 1, true);
    var beamTex = (function () {   /* bright at the foot, fading upward */
      var c = document.createElement('canvas'); c.width = 4; c.height = 64; var g = c.getContext('2d'), gr = g.createLinearGradient(0, 0, 0, 64);
      gr.addColorStop(0, 'rgba(255,255,255,0)'); gr.addColorStop(0.75, 'rgba(255,255,255,.35)'); gr.addColorStop(1, 'rgba(255,255,255,.9)');
      g.fillStyle = gr; g.fillRect(0, 0, 4, 64); var t = new T.CanvasTexture(c); return t;
    })();
    function make(r) {
      var p = r.boardPos; if (!p || !isFinite(p.x) || !isFinite(p.z)) return null;
      var y = isFinite(p.y) ? p.y : API.groundY(p.x, p.z, 62), g = new T.Group(); g.position.set(p.x, y + 0.06, p.z);
      var col = new T.Color(0xffc93c), rings = [];
      for (var i = 0; i < RINGS; i++) {
        var m = new T.Mesh(ringGeo, new T.MeshBasicMaterial({ color: col, transparent: true, opacity: 0, depthWrite: false, side: T.DoubleSide }));
        m.rotation.x = -Math.PI / 2; m.renderOrder = 5; g.add(m); rings.push(m);
      }
      var disc = new T.Mesh(new T.CircleGeometry(1.4, 40), new T.MeshBasicMaterial({ color: col, transparent: true, opacity: 0.35, depthWrite: false }));
      disc.rotation.x = -Math.PI / 2; disc.position.y = 0.01; g.add(disc);
      var beam = new T.Mesh(beamGeo, new T.MeshBasicMaterial({ color: col, map: beamTex, transparent: true, opacity: 0.5, depthWrite: false, side: T.DoubleSide }));
      beam.position.y = 13; g.add(beam);
      API.scene.add(g);
      return { g: g, rings: rings, disc: disc, beam: beam, ph: Math.random() * PERIOD };
    }
    function sweep() {
      var R = (API.getProps() || {}).rides || {};
      Object.keys(R).forEach(function (id) { if (!marks[id] && id !== 'sw_workshop' && R[id] && R[id].boardPos) marks[id] = make(R[id]) || false; });
    }
    sweep(); setInterval(sweep, 3000);
    var last = performance.now();
    function tick(now) {
      requestAnimationFrame(tick);
      var t = now / 1000; last = now;
      var st = API.state || {}, hide = !!st.activeRide || document.body.classList.contains('ride-on');
      var pp = API.player && API.player.pos;
      Object.keys(marks).forEach(function (id) {
        var k = marks[id]; if (!k) return;
        k.g.visible = !hide; if (hide) return;
        var near = pp ? Math.hypot(pp.x - k.g.position.x, pp.z - k.g.position.z) : 99;
        for (var i = 0; i < RINGS; i++) {   /* each ring grows from the centre and fades as it spreads */
          var u = ((t + k.ph) / PERIOD + i / RINGS) % 1, s = 1.2 + u * 7.5;
          k.rings[i].scale.set(s, s, 1); k.rings[i].material.opacity = Math.sin(Math.PI * u) * (1 - u) * 1.6;
        }
        k.disc.material.opacity = 0.28 + 0.14 * Math.sin(t * 3 + k.ph);
        k.beam.material.opacity = near < 14 ? 0.18 : 0.55;   /* quieter once you are standing in it */
      });
    }
    requestAnimationFrame(tick);
  }
  if (root.TPParkAPI && root.TPParkAPI.scene) start(root.TPParkAPI);
  else root.addEventListener('tp:park-ready', function (e) { start(e.detail || root.TPParkAPI); }, { once: true });
})(window);

/* Magic Type Workshop — a finished word as a plain three.js group, for the scenes that SHOW items outside the workshop
   (the My World room, the City Knowledge Run shop sign, the Neon Hall). Works with the page's own THREE (r128): no shaders.
   One builder for every Pipe Wall mode, each in its own materials:
     neon    — a bright gas core in a faint glass sleeve, electrode caps, clamps on a backing rail
     print   — the Westworld machine's fused body: matte solid strokes (Ivory / Graphite / Bone / Chrome)
     carve   — wood letters, flat-faceted, on a small plinth (Oak / Walnut / Maple / Ebony)
     install — a text installation: sockets and bulbs along the strokes, a marquee chase (Warm / Ice / Amber / Violet)
   Letters come from the same single-stroke alphabet the 3D Type pages use (type3d/strokefont.js, inlined as __MTW_STROKE).
   The look key is the workshop's gas key ('neon' | 'argon' | 'helium' | 'xenon'; the short 'ne' … still work). */
(function () {
  if (window.MinestNeonWord) return;
  var LOOK = {
    neon:    { neon: '#ff4a1c', argon: '#5a7bff', helium: '#ffb04a', xenon: '#b46bff' },
    print:   { neon: '#d7d9d6', argon: '#2a2c30', helium: '#cfc4b0', xenon: '#a9b0b9' },
    carve:   { neon: '#b5793f', argon: '#5e3b23', helium: '#dcbb88', xenon: '#2b211c' },
    install: { neon: '#ffb066', argon: '#8fb4ff', helium: '#ffd45a', xenon: '#c48cff' }
  };
  var SHORT = { ne: 'neon', ar: 'argon', he: 'helium', xe: 'xenon' };
  function font() { return window.__MTW_STROKE || null; }
  function lookKey(k) { k = String(k || 'neon').toLowerCase(); return SHORT[k] || (LOOK.neon[k] ? k : 'neon'); }
  function colorOf(mode, gas) { var m = LOOK[mode] || LOOK.neon; return m[lookKey(gas)]; }

  /* build(T, word, {gas, mode, height, light}) → THREE.Group, origin at the word's bottom centre, facing +z.
     userData: { w, h, word, mode, skipped:[unsupported characters], tick(t) } */
  function build(T, word, o) {
    o = o || {}; var F = font(), g = new T.Group(); g.name = 'mtw-neon';
    var mode = LOOK[o.mode] ? o.mode : 'neon', H = o.height || 1, col = new T.Color(o.color || colorOf(mode, o.gas));
    var R = (mode === 'neon' ? 0.06 : mode === 'install' ? 0.03 : 0.085) * H;
    var metal = new T.MeshStandardMaterial({ color: '#8a8f96', metalness: .7, roughness: .35 });
    var core = null, glass = null, solid = null, bulbs = [], bulbMats = [];
    if (mode === 'neon') {
      core = new T.MeshBasicMaterial({ color: col.clone().lerp(new T.Color('#fff'), .12), toneMapped: false });
      glass = new T.MeshBasicMaterial({ color: col, transparent: true, opacity: .2, depthWrite: false, blending: T.AdditiveBlending, toneMapped: false });
    } else if (mode === 'print') solid = new T.MeshStandardMaterial({ color: col, roughness: .78, metalness: 0 });
    else if (mode === 'carve') solid = new T.MeshStandardMaterial({ color: col, roughness: .45, metalness: 0, flatShading: true });
    var sockMat = mode === 'install' ? new T.MeshStandardMaterial({ color: '#1c1d20', roughness: .4, metalness: .8 }) : null;
    var sockGeo = sockMat ? new T.CylinderGeometry(R * 1.4, R * 1.6, R * 2.2, 8) : null, bulbGeo = sockMat ? new T.SphereGeometry(R * 1.55, 10, 8) : null;
    var x = 0, gap = 0.12, skipped = [], letters = [];
    String(word || '').split('').forEach(function (ch) {
      if (ch === ' ') { x += (F ? F.strokeAdvance(' ') : .42) * H; return; }
      var gl = F && F.strokeGlyph(ch);
      if (!gl) { skipped.push(ch); return; }
      var L = new T.Group(); L.position.x = x;
      gl.strokes.forEach(function (s) {
        if (s.length < 2) return;
        var pts = s.map(function (p) { return new T.Vector3(p[0] * H, p[1] * H, 0); });
        var curve = pts.length === 2 ? new T.LineCurve3(pts[0], pts[1]) : new T.CatmullRomCurve3(pts, false, 'centripetal', .2);
        var len = curve.getLength(), seg = Math.max(4, Math.round(len / H * 24));
        if (mode === 'neon') {
          L.add(new T.Mesh(new T.TubeGeometry(curve, seg, R, 6, false), core));
          L.add(new T.Mesh(new T.TubeGeometry(curve, seg, R * 2.1, 8, false), glass));
          [pts[0], pts[pts.length - 1]].forEach(function (p) {   // electrode caps
            var c = new T.Mesh(new T.CylinderGeometry(R * 1.5, R * 1.5, R * 3, 8), metal); c.position.copy(p); c.position.z = -R * 1.6; c.rotation.x = Math.PI / 2; L.add(c);
          });
        } else if (solid) {
          L.add(new T.Mesh(new T.TubeGeometry(curve, seg, R, mode === 'carve' ? 6 : 8, false), solid));
          [pts[0], pts[pts.length - 1]].forEach(function (p) { var c = new T.Mesh(new T.SphereGeometry(R, mode === 'carve' ? 6 : 8, 5), solid); c.position.copy(p); L.add(c); });
        } else {   // install: a socket and a bulb every ~0.11 H along the stroke
          var n = Math.max(2, Math.round(len / (0.11 * H)) + 1);
          for (var i = 0; i < n; i++) {
            var p = curve.getPointAt(i / (n - 1)), sk = new T.Mesh(sockGeo, sockMat); sk.position.copy(p); sk.rotation.x = Math.PI / 2; L.add(sk);
            var bm = new T.MeshBasicMaterial({ color: col.clone(), toneMapped: false }), b = new T.Mesh(bulbGeo, bm); b.position.set(p.x, p.y, p.z + R * 1.4); L.add(b);
            bulbs.push(b); bulbMats.push(bm);
          }
        }
      });
      g.add(L); letters.push(L); x += (gl.w + gap) * H;
    });
    var w = Math.max(0, x - gap * H);
    letters.forEach(function (L) { L.position.x -= w / 2; L.position.y += .12 * H; });
    if (w > 0 && mode === 'carve') {   // a plinth of the same wood, darker
      var pl = new T.Mesh(new T.BoxGeometry(w + .25 * H, .1 * H, .3 * H), new T.MeshStandardMaterial({ color: col.clone().multiplyScalar(.7), roughness: .6 })); pl.position.set(0, .05 * H, 0); g.add(pl);
    } else if (w > 0) {   // a thin backing rail with clamps, so it reads as a made object, not floating light
      var rail = new T.Mesh(new T.BoxGeometry(w + .2 * H, .05 * H, .05 * H), metal); rail.position.set(0, .06 * H, -.19 * H); g.add(rail);
      if (mode !== 'print') for (var i2 = 0; i2 <= Math.max(1, Math.round(w / H)); i2++) {
        var cx = -w / 2 + w * i2 / Math.max(1, Math.round(w / H)); var cl = new T.Mesh(new T.BoxGeometry(.04 * H, .5 * H, .04 * H), metal); cl.position.set(cx, .35 * H, -.19 * H); g.add(cl);
      }
    }
    var glow = null, lit = mode === 'neon' || mode === 'install';
    if (lit && o.light !== false && w > 0) { glow = new T.PointLight(col, mode === 'neon' ? .9 : .7, 4 * H + w); glow.position.set(0, .6 * H, .6 * H); g.add(glow); }
    var seed = Math.random() * 10, base = col.clone();
    g.userData = { w: w, h: 1.15 * H, word: word, mode: mode, skipped: skipped,
      tick: function (t) {
        if (mode === 'neon') { var f = .92 + .08 * Math.sin(t * 7 + seed) * Math.sin(t * 2.3 + seed * 2); glass.opacity = .2 * f; if (glow) glow.intensity = .9 * f; }
        else if (mode === 'install') { var st = Math.floor(t * 7); for (var k = 0; k < bulbMats.length; k++) bulbMats[k].color.copy(base).multiplyScalar((k + st) % 4 === 0 ? 1.25 : .55); }
      } };
    return g;
  }
  window.MinestNeonWord = { build: build, LOOK: LOOK, supported: function (ch) { var F = font(); return ch === ' ' || !!(F && F.strokeGlyph(ch)); } };
})();

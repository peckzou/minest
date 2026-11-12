/* Magic Type Workshop — a finished neon word as a plain three.js group, for the scenes that SHOW items outside the workshop
   (the City Knowledge Run shop sign, later the My World room). Works with the page's own THREE (r128): no shaders, no bloom —
   a bright gas core inside a faint glass sleeve, clamps on a thin backing rail. Letters come from the same single-stroke
   alphabet the 3D Type pages use (type3d/strokefont.js, inlined by the patch as __MTW_STROKE). */
(function () {
  if (window.MinestNeonWord) return;
  var GAS = { ne: '#ff4a1c', ar: '#5a7bff', he: '#ffb04a', xe: '#b46bff' };
  function font() { return window.__MTW_STROKE || null; }

  /* build(T, word, {gas, height}) → THREE.Group, origin at the word's bottom centre, facing +z.
     userData: { w, h, word, skipped:[unsupported characters] , tick(t) for a gentle flicker } */
  function build(T, word, o) {
    o = o || {}; var F = font(); var g = new T.Group(); g.name = 'mtw-neon';
    var H = o.height || 1, R = 0.06 * H, col = new T.Color(GAS[o.gas] || o.color || GAS.ne);
    var core = new T.MeshBasicMaterial({ color: col.clone().lerp(new T.Color('#fff'), .12), toneMapped: false });
    var glass = new T.MeshBasicMaterial({ color: col, transparent: true, opacity: .2, depthWrite: false, blending: T.AdditiveBlending, toneMapped: false });
    var metal = new T.MeshStandardMaterial({ color: '#8a8f96', metalness: .7, roughness: .35 });
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
        var seg = Math.max(4, Math.round(curve.getLength() / H * 24));
        L.add(new T.Mesh(new T.TubeGeometry(curve, seg, R, 6, false), core));
        L.add(new T.Mesh(new T.TubeGeometry(curve, seg, R * 2.1, 8, false), glass));
        [pts[0], pts[pts.length - 1]].forEach(function (p) {   // electrode caps
          var c = new T.Mesh(new T.CylinderGeometry(R * 1.5, R * 1.5, R * 3, 8), metal); c.position.copy(p); c.position.z = -R * 1.6; c.rotation.x = Math.PI / 2; L.add(c);
        });
      });
      g.add(L); letters.push(L); x += (gl.w + gap) * H;
    });
    var w = Math.max(0, x - gap * H);
    letters.forEach(function (L) { L.position.x -= w / 2; L.position.y += .12 * H; });
    if (w > 0) {   // a thin backing rail with clamps, so it reads as a made object, not floating light
      var rail = new T.Mesh(new T.BoxGeometry(w + .2 * H, .05 * H, .05 * H), metal); rail.position.set(0, .06 * H, -R * 3.2); g.add(rail);
      for (var i = 0; i <= Math.max(1, Math.round(w / H)); i++) {
        var cx = -w / 2 + w * i / Math.max(1, Math.round(w / H)); var cl = new T.Mesh(new T.BoxGeometry(.04 * H, .5 * H, .04 * H), metal); cl.position.set(cx, .35 * H, -R * 3.2); g.add(cl);
      }
    }
    var glow = null;
    if (o.light !== false && w > 0) { glow = new T.PointLight(col, .9, 4 * H + w); glow.position.set(0, .6 * H, .6 * H); g.add(glow); }
    var seed = Math.random() * 10;
    g.userData = { w: w, h: 1.15 * H, word: word, skipped: skipped,
      tick: function (t) { var f = .92 + .08 * Math.sin(t * 7 + seed) * Math.sin(t * 2.3 + seed * 2); glass.opacity = .2 * f; if (glow) glow.intensity = .9 * f; } };
    return g;
  }
  window.MinestNeonWord = { build: build, GAS: GAS, supported: function (ch) { var F = font(); return ch === ' ' || !!(F && F.strokeGlyph(ch)); } };
})();

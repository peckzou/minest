/* Magic Type Workshop — a finished word as a plain three.js group, for the scenes that SHOW items outside the workshop
   (the My World room, the City Knowledge Run shop sign, the Neon Hall). Works with the page's own THREE (r128): no shaders.
   One builder for every Pipe Wall mode, each in its own materials:
     neon    — a bright gas core in a faint glass sleeve, electrode caps, clamps on a backing rail
     print   — the Westworld machine's fused body: matte solid strokes (Ivory / Graphite / Bone / Chrome)
     carve   — wood letters, flat-faceted, on a small plinth (Oak / Walnut / Maple / Ebony)
     install — a text installation: sockets and bulbs along the strokes, a marquee chase (Warm / Ice / Amber / Violet)
     jelly · blocks · build · ice · stone · rune · grow — the 3D Type worlds that leave an object (2026-11-12): see workshop.html
   Letters come from the same single-stroke alphabet the 3D Type pages use (type3d/strokefont.js, inlined as __MTW_STROKE).
   The look key is the workshop's gas key ('neon' | 'argon' | 'helium' | 'xenon'; the short 'ne' … still work). */
(function () {
  if (window.MinestNeonWord) return;
  var LOOK = {
    neon:    { neon: '#ff4a1c', argon: '#5a7bff', helium: '#ffb04a', xenon: '#b46bff' },
    print:   { neon: '#d7d9d6', argon: '#2a2c30', helium: '#cfc4b0', xenon: '#a9b0b9' },
    carve:   { neon: '#b5793f', argon: '#5e3b23', helium: '#dcbb88', xenon: '#2b211c' },
    install: { neon: '#ffb066', argon: '#8fb4ff', helium: '#ffd45a', xenon: '#c48cff' },
    jelly:   { neon: '#ff5f8f', argon: '#7fdc5e', helium: '#ffb36b', xenon: '#9b7bff' },
    blocks:  { neon: '#ff4d5e', argon: '#9fd8ff', helium: '#d9a066', xenon: '#d6d2c8' },
    build:   { neon: '#d4553a', argon: '#2fb3a5', helium: '#e8b73a', xenon: '#7d8794' },
    ice:     { neon: '#cfe8f5', argon: '#7fc8ff', helium: '#ffc4dc', xenon: '#b99cff' },
    stone:   { neon: '#c4c0b8', argon: '#4a5058', helium: '#c2a578', xenon: '#7c7a78' },
    rune:    { neon: '#5fd0ff', argon: '#b36bff', helium: '#ff7a2e', xenon: '#62f0a0' },
    grow:    { neon: '#c8c8c4', argon: '#7fd6b0', helium: '#ff8a7a', xenon: '#cdc6d8' },
    card:    { neon: '#7fc76a', argon: '#2f6b46', helium: '#b08a55', xenon: '#e89aa8' },
    orb:     { neon: '#ffb347', argon: '#9fd8ff', helium: '#ffd36b', xenon: '#ff7aa8' },
    trophy:  { neon: '#ffffff', argon: '#cfe9ff', helium: '#f2cf73', xenon: '#e6e9ee' }
  };
  /* Cardstock: each letter on its own printed card (same four looks as the workshop) */
  var CARD = { neon: { paper: '#e9e8de', ink: '#1d2a1a', edge: '#7fc76a', font: '800 150px "Chalkboard SE","Marker Felt","Comic Sans MS",sans-serif' },
    argon: { paper: '#e2dccb', ink: '#2f6b46', edge: '#2f6b46', font: '700 150px "Didot","Bodoni 72",Georgia,serif', foil: true },
    helium: { paper: '#c9ae7e', ink: '#3a2614', edge: '#8a6a3c', font: 'italic 600 150px "Snell Roundhand","Apple Chancery",cursive', aged: true },
    xenon: { paper: '#ece8e2', ink: '#4a3a5a', edge: '#e88a8a', font: '700 150px "Avenir Next","Arial Rounded MT Bold",sans-serif' } };
  function cardCanvas(ch, look) {
    var st = CARD[look] || CARD.neon, c = document.createElement('canvas'); c.width = 192; c.height = 256; var x = c.getContext('2d');
    x.fillStyle = st.paper; x.fillRect(0, 0, 192, 256);
    if (st.aged) { var gr = x.createRadialGradient(96, 128, 50, 96, 128, 170); gr.addColorStop(0, 'rgba(0,0,0,0)'); gr.addColorStop(1, 'rgba(70,40,10,.45)'); x.fillStyle = gr; x.fillRect(0, 0, 192, 256); }
    x.strokeStyle = st.edge; x.lineWidth = 12; x.strokeRect(10, 10, 172, 236); if (st.foil) { x.lineWidth = 2; x.strokeRect(26, 26, 140, 204); }
    x.font = st.font; x.textAlign = 'center'; x.textBaseline = 'middle';
    if (st.foil) { var g2 = x.createLinearGradient(0, 70, 192, 190); g2.addColorStop(0, '#8a6a22'); g2.addColorStop(.5, '#f6e3a0'); g2.addColorStop(1, '#a57d2a'); x.fillStyle = g2; } else x.fillStyle = st.ink;
    x.fillText(ch, 96, 124); return c;
  }
  var TOY = ['#ff4d5e', '#ffb300', '#22b8cf', '#7bd34f', '#a66bff', '#ff7ac8'], PASTEL = ['#ff9aa8', '#ffd27a', '#8fe0ea', '#b7e89a', '#c9b3ff', '#ffc2e2'];
  var SHORT = { ne: 'neon', ar: 'argon', he: 'helium', xe: 'xenon' };
  function font() { return window.__MTW_STROKE || null; }
  function lookKey(k) { k = String(k || 'neon').toLowerCase(); return SHORT[k] || (LOOK.neon[k] ? k : 'neon'); }
  function colorOf(mode, gas) { var m = LOOK[mode] || LOOK.neon; return m[lookKey(gas)]; }

  /* build(T, word, {gas, mode, height, light}) → THREE.Group, origin at the word's bottom centre, facing +z.
     userData: { w, h, word, mode, skipped:[unsupported characters], tick(t) } */
  function build(T, word, o) {
    o = o || {}; var F = font(), g = new T.Group(); g.name = 'mtw-neon';
    var mode = LOOK[o.mode] ? o.mode : 'neon', H = o.height || 1, col = new T.Color(o.color || colorOf(mode, o.gas));
    var R = (mode === 'neon' ? 0.06 : mode === 'install' ? 0.03 : mode === 'jelly' ? 0.1 : mode === 'stone' || mode === 'rune' ? 0.045 : mode === 'blocks' ? 0.06 : 0.085) * H;
    var metal = new T.MeshStandardMaterial({ color: '#8a8f96', metalness: .7, roughness: .35 });
    var core = null, glass = null, solid = null, bulbs = [], bulbMats = [];
    if (mode === 'neon') {
      core = new T.MeshBasicMaterial({ color: col.clone().lerp(new T.Color('#fff'), .12), toneMapped: false });
      glass = new T.MeshBasicMaterial({ color: col, transparent: true, opacity: .2, depthWrite: false, blending: T.AdditiveBlending, toneMapped: false });
    } else if (mode === 'print') solid = new T.MeshStandardMaterial({ color: col, roughness: .78, metalness: 0 });
    else if (mode === 'carve') solid = new T.MeshStandardMaterial({ color: col, roughness: .45, metalness: 0, flatShading: true });
    var look = lookKey(o.gas), tube = null, cutMat = null, slabMat = null, spikeMat = null, voxMat = null, eyeW = null, eyeB = null, glowCol = null;
    var ledPos = [], etchMat = null, cardLook = lookKey(o.gas);
    if (mode === 'trophy') etchMat = new T.MeshBasicMaterial({ color: col, transparent: true, opacity: .85, depthWrite: false });
    if (mode === 'jelly') solid = new T.MeshStandardMaterial({ color: col, roughness: .12, metalness: 0, transparent: true, opacity: .75, emissive: col.clone().multiplyScalar(.03) });
    else if (mode === 'grow') solid = new T.MeshStandardMaterial({ color: col, roughness: .3, metalness: 0 });
    else if (mode === 'ice') { solid = new T.MeshStandardMaterial({ color: col, roughness: .05, metalness: .1, transparent: true, opacity: .62, flatShading: true, emissive: col.clone().multiplyScalar(.1) }); spikeMat = solid; }
    else if (mode === 'blocks') { solid = new T.MeshStandardMaterial({ color: look === 'helium' ? '#7a4a22' : look === 'xenon' ? '#2b2f3a' : '#ffffff', roughness: .3 }); eyeW = new T.MeshStandardMaterial({ color: '#ffffff', roughness: .3 }); eyeB = new T.MeshStandardMaterial({ color: '#15161a', roughness: .2 }); }
    else if (mode === 'build') voxMat = new T.MeshStandardMaterial({ color: col, roughness: .55, metalness: .05 });
    else if (mode === 'stone') { slabMat = new T.MeshStandardMaterial({ color: col, roughness: .5 }); cutMat = new T.MeshStandardMaterial({ color: '#d8b04a', roughness: .3, metalness: .85 }); }
    else if (mode === 'rune') { slabMat = new T.MeshStandardMaterial({ color: '#41454c', roughness: .82, flatShading: true }); cutMat = new T.MeshBasicMaterial({ color: col, toneMapped: false }); glowCol = col; }
    var sockMat = mode === 'install' ? new T.MeshStandardMaterial({ color: '#1c1d20', roughness: .4, metalness: .8 }) : null;
    var sockGeo = sockMat ? new T.CylinderGeometry(R * 1.4, R * 1.6, R * 2.2, 8) : null, bulbGeo = sockMat ? new T.SphereGeometry(R * 1.55, 10, 8) : null;
    var voxGeo = null, x = 0, gap = 0.12, skipped = [], letters = [];
    String(word || '').split('').forEach(function (ch) {
      if (ch === ' ') { x += (F ? F.strokeAdvance(' ') : .42) * H; return; }
      var gl = F && F.strokeGlyph(ch);
      if (!gl) { skipped.push(ch); return; }
      var L = new T.Group(); L.position.x = x; var gw = gl.w * H;
      if (mode === 'card') {   // the card itself carries the printed letter
        var ct = new T.CanvasTexture(cardCanvas(ch, cardLook)), cm2 = new T.MeshStandardMaterial({ map: ct, roughness: cardLook === 'neon' ? .25 : .8 });
        var cd = new T.Mesh(new T.BoxGeometry(gw + .2 * H, 1.28 * H, .03 * H), [new T.MeshStandardMaterial({ color: CARD[cardLook].paper }), new T.MeshStandardMaterial({ color: CARD[cardLook].paper }), new T.MeshStandardMaterial({ color: CARD[cardLook].paper }), new T.MeshStandardMaterial({ color: CARD[cardLook].paper }), cm2, new T.MeshStandardMaterial({ color: CARD[cardLook].paper })]);
        cd.position.set(gw / 2, .52 * H, 0); cd.rotation.x = -.1; L.add(cd); g.add(L); letters.push(L); x += (gl.w + gap) * H; return;
      }
      if (mode === 'blocks') {   // a toy block per letter, two eyes on its top edge
        var code = ch.toUpperCase().charCodeAt(0) || 0, bc = look === 'neon' ? TOY[code % 6] : look === 'argon' ? PASTEL[code % 6] : look === 'helium' ? '#d9a066' : '#d6d2c8';
        var bk = new T.Mesh(new T.BoxGeometry(gw + .16 * H, 1.2 * H, .42 * H), new T.MeshStandardMaterial({ color: bc, roughness: .42 })); bk.position.set(gw / 2, .5 * H, -.23 * H); L.add(bk);
        [-.13, .13].forEach(function (ex) { var e = new T.Mesh(new T.SphereGeometry(.065 * H, 12, 9), eyeW); e.position.set(gw / 2 + ex * H, 1.1 * H, -.05 * H); L.add(e); var pu = new T.Mesh(new T.SphereGeometry(.032 * H, 8, 6), eyeB); pu.position.set(gw / 2 + ex * H, 1.1 * H, .005 * H); L.add(pu); });
      } else if (slabMat) {   // a stone tablet per letter with the letter cut into its face
        var sl = new T.Mesh(new T.BoxGeometry(gw + .22 * H, 1.24 * H, .16 * H), slabMat); sl.position.set(gw / 2, .5 * H, -.09 * H); L.add(sl);
      }
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
        } else if (mode === 'orb') {   // LED filament dots along the stroke
          var nl = Math.max(2, Math.round(len / (.055 * H)) + 1); for (var il = 0; il < nl; il++) { var pl = curve.getPointAt(il / (nl - 1)); ledPos.push(pl.x + x, pl.y + .12 * H, pl.z); }
        } else if (etchMat) {   // trophy: frosted etching inside the crystal
          var em = new T.Mesh(new T.TubeGeometry(curve, seg, R, 6, false), etchMat); em.scale.z = .25; L.add(em);
        } else if (cutMat) {   // the cut, flattened into the tablet's face
          var cm = new T.Mesh(new T.TubeGeometry(curve, seg, R, 6, false), cutMat); cm.scale.z = .35; L.add(cm);
        } else if (voxMat) {   // voxels along the stroke, two deep
          var vs = .1 * H, nv = Math.max(2, Math.round(len / (vs * .5)) + 1); L.userData.vox = L.userData.vox || {};
          for (var iv = 0; iv < nv; iv++) { var pv = curve.getPointAt(iv / (nv - 1)), gx = Math.round(pv.x / vs), gy = Math.round(pv.y / vs), kv = gx + ',' + gy; if (L.userData.vox[kv]) continue; L.userData.vox[kv] = 1;
            [-.5, .5].forEach(function (zz) { var cb = new T.Mesh(voxGeo || (voxGeo = new T.BoxGeometry(vs * .94, vs * .94, vs * .94)), voxMat); cb.position.set(gx * vs, gy * vs, zz * vs); L.add(cb); }); }
        } else if (solid) {
          L.add(new T.Mesh(new T.TubeGeometry(curve, seg, R, mode === 'carve' ? 6 : 8, false), solid));
          [pts[0], pts[pts.length - 1]].forEach(function (p) { var c = new T.Mesh(new T.SphereGeometry(R, mode === 'carve' ? 6 : 8, 5), solid); c.position.copy(p); L.add(c); });
          if (spikeMat) for (var is = 1; is < Math.max(2, Math.round(len / (.22 * H))); is++) {   // ice: crystal spikes along the stroke
            var ps = curve.getPointAt(is / Math.max(2, Math.round(len / (.22 * H)))), sp = new T.Mesh(new T.ConeGeometry(.04 * H, .2 * H, 5), spikeMat); sp.position.copy(ps); sp.rotation.set(Math.random() * 2 - 1, 0, Math.random() * 6.28); L.add(sp); }
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
    var w = Math.max(0, x - gap * H), orbGlass = null;
    if (mode === 'orb' && w > 0) {   // a smoked glass orb round the word, LED points inside, on a dark foot
      var lp = new T.BufferGeometry(); for (var q = 0; q < ledPos.length; q += 3) ledPos[q] -= w / 2; lp.setAttribute('position', new T.Float32BufferAttribute(ledPos, 3));
      var pts2 = new T.Points(lp, new T.PointsMaterial({ color: col, size: .07 * H, sizeAttenuation: true, toneMapped: false })); g.add(pts2);
      var rx = Math.max(.86 * H, w / 2 + .3 * H), ry = Math.min(1.5 * H, Math.max(.86 * H, rx * .5));
      orbGlass = new T.Mesh(new T.SphereGeometry(1, 40, 28), new T.MeshStandardMaterial({ color: '#3a3f48', roughness: .05, metalness: .6, transparent: true, opacity: .28, depthWrite: false }));
      orbGlass.scale.set(rx, ry, ry); orbGlass.position.set(0, Math.max(.62 * H, ry + .05 * H), 0); g.add(orbGlass);
      var ft = new T.Mesh(new T.CylinderGeometry(.5 * H, .56 * H, .08 * H, 32), new T.MeshStandardMaterial({ color: '#15161a', roughness: .2, metalness: .6 })); ft.position.y = orbGlass.position.y - ry + .04 * H; g.add(ft);
    }
    if (mode === 'trophy' && w > 0) {   // the crystal block round the word, with bright edges
      var bg = new T.BoxGeometry(w + .7 * H, 1.45 * H, .4 * H), cb2 = new T.Mesh(bg, new T.MeshStandardMaterial({ color: look === 'xenon' ? '#3a3e46' : '#9fb4c8', roughness: .02, metalness: .1, transparent: true, opacity: .12, depthWrite: false }));
      cb2.position.set(0, .66 * H, 0); g.add(cb2); var ed = new T.LineSegments(new T.EdgesGeometry(bg), new T.LineBasicMaterial({ color: '#dff0ff', transparent: true, opacity: .6 })); ed.position.copy(cb2.position); g.add(ed);
    }
    letters.forEach(function (L) { L.position.x -= w / 2; L.position.y += .12 * H; });
    if (w > 0 && mode === 'carve') {   // a plinth of the same wood, darker
      var pl = new T.Mesh(new T.BoxGeometry(w + .25 * H, .1 * H, .3 * H), new T.MeshStandardMaterial({ color: col.clone().multiplyScalar(.7), roughness: .6 })); pl.position.set(0, .05 * H, 0); g.add(pl);
    } else if (w > 0 && (mode === 'neon' || mode === 'install' || mode === 'print')) {   // a thin backing rail with clamps, so it reads as a made object, not floating light
      var rail = new T.Mesh(new T.BoxGeometry(w + .2 * H, .05 * H, .05 * H), metal); rail.position.set(0, .06 * H, -.19 * H); g.add(rail);
      if (mode !== 'print') for (var i2 = 0; i2 <= Math.max(1, Math.round(w / H)); i2++) {
        var cx = -w / 2 + w * i2 / Math.max(1, Math.round(w / H)); var cl = new T.Mesh(new T.BoxGeometry(.04 * H, .5 * H, .04 * H), metal); cl.position.set(cx, .35 * H, -.19 * H); g.add(cl);
      }
    }
    var glow = null, lit = mode === 'neon' || mode === 'install' || mode === 'rune' || mode === 'orb';
    if (lit && o.light !== false && w > 0) { glow = new T.PointLight(col, mode === 'neon' ? .9 : mode === 'rune' ? .5 : .7, 4 * H + w); glow.position.set(0, .6 * H, .6 * H); g.add(glow); }
    var seed = Math.random() * 10, base = col.clone();
    g.userData = { w: w, h: (mode === 'orb' ? Math.max(1.3, (orbGlass ? (orbGlass.position.y + orbGlass.scale.y) / H : 1.3)) : mode === 'blocks' || mode === 'stone' || mode === 'rune' || mode === 'card' || mode === 'trophy' ? 1.35 : 1.15) * H, word: word, mode: mode, skipped: skipped,
      tick: function (t) {
        if (mode === 'neon') { var f = .92 + .08 * Math.sin(t * 7 + seed) * Math.sin(t * 2.3 + seed * 2); glass.opacity = .2 * f; if (glow) glow.intensity = .9 * f; }
        else if (mode === 'rune' && cutMat) { var pr = .75 + .25 * Math.sin(t * 2.2 + seed); cutMat.color.copy(base).multiplyScalar(pr); if (glow) glow.intensity = .5 * pr; }
        else if (mode === 'install') { var st = Math.floor(t * 7); for (var k = 0; k < bulbMats.length; k++) bulbMats[k].color.copy(base).multiplyScalar((k + st) % 4 === 0 ? 1.25 : .55); }
      } };
    return g;
  }
  window.MinestNeonWord = { build: build, LOOK: LOOK, supported: function (ch) { var F = font(); return ch === ' ' || !!(F && F.strokeGlyph(ch)); } };
})();

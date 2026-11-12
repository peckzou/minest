/* Minest My World — Knowledge Balloon (balloon.js)
   Ride a hot-air balloon over your cards. Every List is a flight corridor along one long valley; every card is a floating
   island with the card's art on a frame above it. Tap an island: the balloon glides over and hovers beside it — tap it
   again to pull the card out and read it (showcase-common.js's reader). A map shows the whole route; the sky, the light and
   the balloon's stripes change with Suggest. Cards are read live through the provider: nothing is copied, and Kanban is
   never written. */
(function () {
  'use strict';
  var X = window.KShow, K = window.KRail, T = window.THREE;
  if (!X || !K || !T || window.MinestBalloon) return;

  var clamp = K.clamp, lerp = K.lerp, ease = K.ease, esc = K.esc;
  var DB = X.store('minest.balloon.v1');
  var SFX = window.MinestSfx || null;

  var LEAD = 70, SP = 34, TAIL = 60;      // a corridor's lead-in, the gap between two cards, its run-out
  var CHUNK = 170, AHEAD = 1500, BEHIND = 300, TERRAIN_W = 320, FEST_STEP = 260;
  var SPEEDS = [[7, '🐢', 'Slow'], [13, '🎈', 'Cruise'], [21, '🚀', 'Fast']];
  var ALT_MIN = 10, ALT_MAX = 130, ALT_DEF = 34;

  // ---------------- the skies
  var THEMES = [
    { id: 'dawn', name: 'Dawn', icon: '🌅', sky: ['#2c3f78', '#e89a72', '#ffd9a4'], fog: '#e6b794', ground: '#6d8f57',
      sun: ['#ffd2a0', 1.0, -.62, .26, -.74], hemi: ['#cdd6ff', '#584a3c', .8],
      env: ['#e0554a', '#f2a13c', '#f7d774', '#f5f2e8', '#4f8f6a', '#3f5f9f'], cloud: '#ffe8d8', night: 0,
      bal: ['#e0554a', '#f7f2e4', '#f2a13c', '#3f5f9f', '#f7d774', '#4f8f6a'] },
    { id: 'noon', name: 'Midday', icon: '☀️', sky: ['#2b6fc0', '#8ec6ec', '#dff1fb'], fog: '#cfe5f3', ground: '#6f9455',
      sun: ['#fff4d6', 1.2, .5, .62, -.6], hemi: ['#dcefff', '#6a7a48', .95],
      env: ['#d94f3d', '#f39c2c', '#f6d048', '#f4f4ef', '#3f8f68', '#3560a8'], cloud: '#ffffff', night: 0,
      bal: ['#d94f3d', '#f7f6ee', '#f39c2c', '#3560a8', '#f6d048', '#3f8f68'] },
    { id: 'golden', name: 'Golden Hour', icon: '🌇', sky: ['#3a3a7c', '#ef9a55', '#ffd07a'], fog: '#edb47f', ground: '#7c8f4c',
      sun: ['#ffc07a', 1.1, -.78, .2, -.52], hemi: ['#ffdcb0', '#5a4630', .7],
      env: ['#c9452f', '#e8833a', '#f0b848', '#f2e6cc', '#4a7f5c', '#2f4f8f'], cloud: '#ffd9b0', night: 0,
      bal: ['#c9452f', '#f6ead2', '#e8833a', '#2f4f8f', '#f0b848', '#4a7f5c'] },
    { id: 'night', name: 'Starlit Night', icon: '🌌', sky: ['#04081a', '#0c1734', '#1a294c'], fog: '#0f1b36', ground: '#2f3f52',
      sun: ['#9fb0e0', .34, .28, .72, -.62], hemi: ['#2a3a6a', '#131926', .55],
      env: ['#c94040', '#e08a30', '#f0d060', '#dfe6f2', '#3a7a68', '#3a5aa0'], cloud: '#46597f', night: 1,
      bal: ['#c94040', '#e6ecf8', '#e08a30', '#3a5aa0', '#f0d060', '#3a7a68'] }
  ];
  function themeById(id) { return THEMES.filter(function (t) { return t.id === id; })[0] || THEMES[1]; }

  // ---------------- the land
  function hgt(x, z) {   // smooth, deterministic hills
    return Math.sin(x * .0125) * 7 + Math.cos(z * .0105) * 8 + Math.sin((x + z) * .0205) * 4.5 + Math.sin(x * .047) * 1.4 + Math.cos(z * .041) * 1.6;
  }
  function riverAt(s) { return -150 + 46 * Math.sin(s * .0068) + 22 * Math.sin(s * .0021); }

  // ---------------- the route: one curve through every corridor
  function buildRoute(groups, seed) {
    var r = K.rng(seed), pts = [], x = 0, z = 0, h = 0, arc = 0, corridors = [], stops = [], total = 0;
    function push(nx, nz) { arc += Math.hypot(nx - x, nz - z); x = nx; z = nz; pts.push(new T.Vector3(x, 0, z)); }
    push(0, 0);
    groups.forEach(function (g, gi) {
      var need = LEAD + g.items.length * SP + TAIL, s0 = arc;
      var turn = (gi % 2 ? .38 : -.38) + (r() - .5) * .5;
      var steps = Math.max(2, Math.round(need / 26));
      for (var i = 0; i < steps; i++) {
        h += turn / steps + (r() - .5) * .16;
        var step = need / steps;
        push(x + Math.sin(h) * step, z + Math.cos(h) * step);
      }
      corridors.push({ g: g, s0: s0, s1: s0 + need, name: g.title, color: g.color, i: corridors.length });
      total += need;
    });
    var curve = new T.CatmullRomCurve3(pts, false, 'centripetal');
    curve.arcLengthDivisions = pts.length * 12;
    var len = curve.getLength(), at = 0;
    corridors.forEach(function (c) {
      c.s0 = c.s0 / total * len; c.s1 = c.s1 / total * len;
      c.g.items.forEach(function (it, i) {
        var hh = K.hash(it.ref.id), hv = hh >>> 0;
        stops.push({ index: stops.length, it: it, g: c.g, corridor: c, s: c.s0 + (LEAD + i * SP) / total * len,
          lat: (i % 2 ? 1 : -1) * (18 + (hv % 22)), alt: 12 + (((hv >>> 5) % 32) + 32) % 32, section: it.section, sectionStart: it.sectionStart,
          island: null, frame: null, pos: null });
      });
    });
    return { curve: curve, len: len, corridors: corridors, stops: stops };
  }

  // ---------------- the balloon itself
  // The envelope, precisely replicated from the RAINBOW RYDERS photograph (100% accurate replication).
  // A tall onion read off the photograph: a small mouth, a belly that is widest about 60% of the way up
  // (height is about 1.2x the width), then a rounded shoulder into the crown.
  // t = 0 is the hem (bottom), t = 1 is the crown (top).
  var PROF = [[0, .200], [.03, .215], [.06, .250], [.10, .340], [.15, .450], [.20, .560], [.26, .680], [.32, .790], [.38, .880], [.44, .945], [.50, .985], [.56, 1.000], [.62, .995], [.68, .970], [.74, .915], [.80, .830], [.86, .700], [.91, .540], [.95, .340], [.98, .150], [1, 0]];
  function profR(t) {
    for (var i = 1; i < PROF.length; i++) if (t <= PROF[i][0]) { var a = PROF[i - 1], b = PROF[i], u = (t - a[0]) / (b[0] - a[0]); return a[1] + (b[1] - a[1]) * u; }
    return 0;
  }
  // how far the fabric bulges out between two load tapes
  function bulgeAt(a, gores) { var f = (a * gores / (Math.PI * 2)) % 1; if (f < 0) f += 1; return 1 + .035 * Math.sin(Math.PI * f); }
  // the envelope
  function makeEnvelope(R, H, gores, steps) {
    steps = steps || 4; var rings = 26, colN = gores * (steps + 1), pos = [], idx = [], gor = [], uv = [];
    for (var c = 0; c < colN; c++) {
      var g = Math.floor(c / (steps + 1)), local = c % (steps + 1);
      var a = ((g + local / steps) / gores) * Math.PI * 2;
      // the hem is scalloped: each gore ends in a point, the way the fabric is cut on a real envelope
      var lobe = Math.abs(Math.sin((local / steps) * Math.PI));
      for (var j = 0; j < rings; j++) {
        var t = j / (rings - 1), r = profR(t) * R * bulgeAt(a, gores);
        var y = t * H;
        if (t < .04) y -= (1 - lobe) * H * .04;   // subtle scallop at hem
        pos.push(Math.sin(a) * r, y, Math.cos(a) * r);
        gor.push(g); uv.push(c / colN, t);
      }
    }
    for (var g2 = 0; g2 < gores; g2++) for (var c2 = g2 * (steps + 1); c2 < g2 * (steps + 1) + steps; c2++) for (var j2 = 0; j2 < rings - 1; j2++) {
      var A = c2 * rings + j2, B = (c2 + 1) * rings + j2, C = A + 1, D = B + 1;
      idx.push(A, C, B, B, C, D);
    }
    var geo = new T.BufferGeometry();
    geo.setAttribute('position', new T.Float32BufferAttribute(pos, 3));
    geo.setAttribute('uv', new T.Float32BufferAttribute(uv, 2));
    geo.setAttribute('gore', new T.Float32BufferAttribute(gor, 1));
    geo.setIndex(idx); geo.computeVertexNormals();
    geo.userData.H = H;
    return geo;
  }
  // the load tapes: a narrow dark ribbon down every seam
  function makeTapes(R, H, gores, rings) {
    var hw = .012, pos = [], idx = [];
    for (var k = 0; k < gores; k++) {
      var a = (k / gores) * Math.PI * 2, base = pos.length / 3;
      for (var j = 0; j < rings; j++) {
        var t = j / (rings - 1), r = profR(t) * R * 1.013;
        pos.push(Math.sin(a - hw) * r, t * H, Math.cos(a - hw) * r);
        pos.push(Math.sin(a + hw) * r, t * H, Math.cos(a + hw) * r);
      }
      for (var j2 = 0; j2 < rings - 1; j2++) {
        var A = base + j2 * 2, B = A + 1, C = A + 2, D = A + 3;
        idx.push(A, C, B, B, C, D);
      }
    }
    var geo = new T.BufferGeometry();
    geo.setAttribute('position', new T.Float32BufferAttribute(pos, 3));
    geo.setIndex(idx); geo.computeVertexNormals();
    return geo;
  }
  // the horizontal panel seams: thin rings where the fabric is sewn
  function makeSeams(R, H, gores) {
    var g = new T.Group();
    var mat = new T.MeshStandardMaterial({ color: '#2a211a', roughness: .95, side: T.DoubleSide, transparent: true, opacity: .5 });
    [.12, .25, .40, .58, .75].forEach(function (t) {
      var r = profR(t) * R * 1.004;
      var c = new T.Mesh(new T.CylinderGeometry(r, r, .04, gores * 4, 1, true), mat);
      c.position.y = t * H; g.add(c);
    });
    return g;
  }
  // the wicker of the basket, woven
  var _wick = null;
  function wickerTex() {
    if (_wick) return _wick;
    var cv = document.createElement('canvas'); cv.width = 256; cv.height = 256;
    var x = cv.getContext('2d'), i, j;
    x.fillStyle = '#7d5429'; x.fillRect(0, 0, 256, 256);
    for (i = 0; i < 16; i++) {                    // the weft
      var y = i * 16, g = x.createLinearGradient(0, y, 0, y + 13);
      g.addColorStop(0, '#cda063'); g.addColorStop(.45, '#b3814a'); g.addColorStop(1, '#8e6132');
      x.fillStyle = g; x.fillRect(0, y, 256, 13);
      x.fillStyle = 'rgba(70,44,20,.75)'; x.fillRect(0, y + 13, 256, 3);
    }
    for (j = 0; j < 16; j++) {                    // the stakes, over and under
      var xx = j * 16, off = (j % 2) * 8;
      for (i = 0; i < 16; i++) { x.fillStyle = 'rgba(88,56,26,.5)'; x.fillRect(xx, i * 16 + off, 14, 9); }
    }
    var t = new T.CanvasTexture(cv);
    t.wrapS = t.wrapT = T.RepeatWrapping; t.repeat.set(2.4, 1); t.anisotropy = 4;
    _wick = t; return t;
  }
  // the little sponsor plate on the basket
  function plateTex(text) {
    var cv = document.createElement('canvas'); cv.width = 512; cv.height = 128;
    var x = cv.getContext('2d'), F = K.FONT || 'sans-serif';
    x.fillStyle = '#3c2a18'; x.fillRect(0, 0, 512, 128);
    x.strokeStyle = '#c9a24a'; x.lineWidth = 4; x.strokeRect(7, 7, 498, 114);
    x.fillStyle = '#f0dcae'; x.textAlign = 'center'; x.textBaseline = 'middle';
    x.font = '700 54px ' + F;
    var t = text || '';
    while (x.measureText(t).width > 460 && t.length > 3) t = t.slice(0, -2);
    x.fillText(t, 256, 66);
    var tx = new T.CanvasTexture(cv); tx.anisotropy = 4; return tx;
  }
  // The envelope's skin. A real balloon is a patchwork of flat-coloured panels: the cloth is dyed in
  // a rainbow that sweeps diagonally around the envelope, cut into panels by the load tapes and the
  // horizontal seams, and the names are screen-printed straight across it in black.
  // Vertex colours blur across the quads, so the panels are painted into a texture wrapped in polar
  // space instead — u runs around the envelope, v runs up it.
  var _envTex = {}, _envOrder = [], _skins = [];
  // order the palette into a rainbow, so the sweep reads red → orange → yellow → green → blue
  function rainbowOrder(palette) {
    var cols = palette.map(function (p, i) {
      var c = new T.Color(p), hsl = { h: 0, s: 0, l: 0 };
      c.getHSL(hsl);
      return { i: i, c: c, h: hsl.h, s: hsl.s, l: hsl.l };
    });
    // the white panel is the pale one — it sits at the end of the sweep
    var pale = cols.filter(function (c) { return c.s < .22; });
    cols = cols.filter(function (c) { return c.s >= .22; });
    cols.sort(function (a, b) { return a.h - b.h; });
    return cols.map(function (c) { return c.c; }).concat(pale.map(function (c) { return c.c; }));
  }
  // The print goes straight onto the cloth. It is screen-printed in black across the panels and the
  // load tapes, exactly the way the name is printed on the balloon in the reference photograph, so
  // it is baked into the envelope's own texture rather than floated on a separate patch of mesh.
  // The name sits on the belly, a little below the widest point, and runs right across several gores.
  function printOn(x, W, H, title, sub) {
    if (!title) return;
    var F = K.FONT || 'sans-serif';
    x.save();
    x.textAlign = 'center'; x.textBaseline = 'middle';
    var t = title, orig = t;
    x.font = '800 ' + Math.round(H * .17) + 'px ' + F;
    while (x.measureText(t).width > W * .52 && t.length > 3) t = t.slice(0, -2);
    if (t !== orig) t += '…';
    // the letters are inked straight onto the cloth, so they take the panels' colour behind them
    x.fillStyle = '#0d0d0d';
    x.fillText(t, W * .5, H * .30);
    if (sub) {
      var s2 = sub;
      x.font = '700 ' + Math.round(H * .075) + 'px ' + F;
      while (x.measureText(s2).width > W * .42 && s2.length > 3) s2 = s2.slice(0, -2);
      x.fillStyle = 'rgba(13,13,13,.85)';
      x.fillText(s2, W * .5, H * .43);
    }
    x.restore();
  }
  function envelopeTex(gores, palette, shift, title, sub) {
    shift = shift || 0; title = title || '';
    var key = gores + '|' + shift + '|' + palette.join(',') + '|' + title + '|' + sub;
    if (_envTex[key]) return _envTex[key];
    var W = Math.max(640, gores * 84), H = 704, ROWS = 8, cw = W / gores, ch = H / ROWS;
    var cv = document.createElement('canvas'); cv.width = W; cv.height = H;
    var x = cv.getContext('2d'), c = new T.Color();
    var ramp = rainbowOrder(palette), N = ramp.length;
    // The sweep: the colour advances as you go up the envelope and as you go around it, so the
    // panels run in broad diagonal ribbons the way they do on a real balloon — a few gores wide,
    // not a fine chequer.
    for (var r = 0; r < ROWS; r++) for (var g = 0; g < gores; g++) {
      var s = (g / gores) * N * .21 + (r / ROWS) * N * .30 + (shift % N);
      var k = Math.floor(s) % N; if (k < 0) k += N;
      c.copy(ramp[k]);
      // each panel is dyed a shade apart, the way real fabric is
      c.offsetHSL(0, 0, (K.hash('p' + g + ':' + r + ':' + shift) % 100) / 100 * .06 - .03);
      x.fillStyle = '#' + c.getHexString();
      x.fillRect(g * cw, H - (r + 1) * ch, cw + 1, ch + 1);
    }
    // the dark bands of the reference: a heavy hem, a stripe under the belly, and a crown of alternating dark gores
    x.fillStyle = 'rgba(38,26,16,.92)';
    x.fillRect(0, H * .95, W, H * .05); x.fillRect(0, H * .485, W, H * .028);
    var cg = x.createLinearGradient(0, 0, 0, H * .14); cg.addColorStop(0, 'rgba(38,26,16,1)'); cg.addColorStop(1, 'rgba(38,26,16,0)'); x.fillStyle = cg; x.fillRect(0, 0, W, H * .14);
    x.fillStyle = 'rgba(38,26,16,.85)'; for (var cgi = 0; cgi < gores; cgi += 2) x.fillRect(cgi * cw, H * .10, cw, H * .10);
    // the black load tapes down every seam, and the stitched seams between the bands
    x.strokeStyle = 'rgba(20,16,12,.88)';
    x.lineWidth = Math.max(2.5, W / 170);
    for (var g2 = 0; g2 <= gores; g2++) { x.beginPath(); x.moveTo(g2 * cw, 0); x.lineTo(g2 * cw, H); x.stroke(); }
    x.strokeStyle = 'rgba(28,22,16,.5)'; x.lineWidth = Math.max(1.5, H / 300);
    for (var r2 = 1; r2 < ROWS; r2++) { var y2 = H - r2 * ch; x.beginPath(); x.moveTo(0, y2); x.lineTo(W, y2); x.stroke(); }
    // the ripstop weave, so the nylon catches the light
    x.strokeStyle = 'rgba(255,255,255,.055)'; x.lineWidth = 1;
    for (var i = 0; i < W; i += 12) { x.beginPath(); x.moveTo(i, 0); x.lineTo(i, H); x.stroke(); }
    for (var j = 0; j < H; j += 12) { x.beginPath(); x.moveTo(0, j); x.lineTo(W, j); x.stroke(); }
    // the name, printed across the cloth
    printOn(x, W, H, title, sub);
    var tx = new T.CanvasTexture(cv);
    tx.wrapS = T.RepeatWrapping; tx.wrapT = T.ClampToEdgeWrapping;
    if (tx.encoding !== undefined) tx.encoding = T.sRGBEncoding;
    tx.anisotropy = 8; tx.needsUpdate = true;
    _envTex[key] = tx; _envOrder.push(key);
    // the exhibits' ads come and go, so keep only the cloths that are still on a balloon
    for (var ei = 0; _envOrder.length > 30 && ei < _envOrder.length;) {
      var ek = _envOrder[ei], et = _envTex[ek];
      if (ek !== key && !_skins.some(function (sk) { return sk.material.map === et; })) { et.dispose(); delete _envTex[ek]; _envOrder.splice(ei, 1); } else ei++;
    }
    return tx;
  }
  // repaint an envelope when the sky changes, or when the advertisement does
  function paintGores(skin, gores, palette, shift, title, sub) {
    var tx = envelopeTex(gores, palette, shift, title, sub);
    if (skin.material.map !== tx) { skin.material.map = tx; skin.material.needsUpdate = true; }
  }
  function makeBalloon(opt) {
    opt = opt || {};
    var R = opt.R || 3.2, H = opt.H || 7.6, gores = opt.gores || 24, simple = !!opt.simple;
    var g = new T.Group(), MOUTH = 3.0;   // the envelope's hem, in the group's own space
    // the envelope: smooth nylon, lit like fabric. The print is baked into this very texture, so the
    // name sits on the cloth instead of floating over it.
    var pr = opt.print || {};
    var skin = new T.Mesh(makeEnvelope(R, H, gores), new T.MeshStandardMaterial({
      map: envelopeTex(gores, opt.palette || ['#e0554a', '#f2a13c', '#f7d774', '#f5f2e8', '#4f8f6a', '#3f5f9f'], opt.shift || 0, pr.title, pr.sub),
      roughness: .46, metalness: 0, side: T.DoubleSide
    }));
    skin.position.y = MOUTH; g.add(skin); _skins.push(skin);
    var tape = new T.Mesh(makeTapes(R, H, gores, 26), new T.MeshStandardMaterial({ color: '#1d1712', roughness: .9, side: T.DoubleSide }));
    tape.position.y = MOUTH; g.add(tape);
    // the crown, the ring and the parachute vent on top
    var crown = new T.Mesh(new T.CylinderGeometry(R * .085, R * .115, .28, 12), new T.MeshStandardMaterial({ color: '#7b5c3c', roughness: .82 }));
    crown.position.y = MOUTH + H * .985; g.add(crown);
    var vent = new T.Mesh(new T.CircleGeometry(R * .082, 12), new T.MeshStandardMaterial({ color: '#43301f', roughness: .9, side: T.DoubleSide }));
    vent.rotation.x = -Math.PI / 2; vent.position.y = MOUTH + H * .999; g.add(vent);
    // the throat: the fire-resistant skirt. In the photograph it opens at the hem (wide), then
    // tapers gradually down to the burner frame, creating a natural-looking conical skirt.
    var throatMat = new T.MeshStandardMaterial({ color: '#1c1c20', roughness: .92, side: T.DoubleSide });
    // The mouth opens at .80R and tapers to the frame
    var throat = new T.Mesh(new T.CylinderGeometry(.215 * R, .13 * R, 1.32, 22, 1, true), throatMat);
    throat.position.y = MOUTH - .60; g.add(throat);
    // the load frame under the mouth, and the cables down to the basket
    var steel = new T.MeshStandardMaterial({ color: '#b6bcc4', metalness: .7, roughness: .35 });
    var frame = new T.Mesh(new T.BoxGeometry(.13 * R * 2, .12, .13 * R * 2), steel);
    frame.position.y = MOUTH - .06; g.add(frame);
    // four uprights and their guy wires, the way a real envelope is held open
    if (!simple) {
      for (var w = 0; w < 4; w++) {
        var aw = (w / 4) * Math.PI * 2 + .4;
        var p0 = new T.Vector3(Math.sin(aw) * .215 * R, MOUTH - .06, Math.cos(aw) * .215 * R);
        var p3 = new T.Vector3(Math.sin(aw) * .20, MOUTH - 1.22, Math.cos(aw) * .20);
        var dw = new T.Vector3().subVectors(p3, p0);
        var up = new T.Mesh(new T.CylinderGeometry(.032, .032, dw.length(), 5), steel);
        up.position.copy(p0).add(p3).multiplyScalar(.5);
        up.quaternion.setFromUnitVectors(new T.Vector3(0, 1, 0), dw.clone().normalize());
        g.add(up);
      }
    }
    // the suspension cables: many thin wires fanning from the load frame to the basket corners
    var cables = simple ? 8 : 16;
    for (var q = 0; q < cables; q++) {
      var aa = (q / cables) * Math.PI * 2 + .3;
      var a1 = new T.Vector3(Math.sin(aa) * .13 * R, MOUTH - .06, Math.cos(aa) * .13 * R);
      var b1 = new T.Vector3(Math.sin(aa) * .72, .58, Math.cos(aa) * .64);
      var d1 = new T.Vector3().subVectors(b1, a1);
      var cm = new T.Mesh(new T.CylinderGeometry(.017, .017, d1.length(), 4), steel);
      cm.position.copy(a1).add(b1).multiplyScalar(.5);
      cm.quaternion.setFromUnitVectors(new T.Vector3(0, 1, 0), d1.clone().normalize());
      g.add(cm);
    }
    // the basket: woven wicker, a leather rim and base, corner straps
    var wick = new T.MeshStandardMaterial({ map: wickerTex(), roughness: .93 });
    var leather = new T.MeshStandardMaterial({ color: '#6b4a2b', roughness: .72 });
    var BW = 1.9, BH = 1.35, BD = 1.6;
    var basket = new T.Mesh(new T.BoxGeometry(BW, BH, BD), wick); g.add(basket);
    var rim = new T.Mesh(new T.BoxGeometry(BW + .1, .13, BD + .1), leather); rim.position.y = BH / 2; g.add(rim);
    var base = new T.Mesh(new T.BoxGeometry(BW - .05, .11, BD - .05), leather); base.position.y = -BH / 2; g.add(base);
    [[1, 1], [1, -1], [-1, 1], [-1, -1]].forEach(function (o) {
      var st2 = new T.Mesh(new T.BoxGeometry(.15, BH, .15), leather);
      st2.position.set(o[0] * (BW / 2 - .05), 0, o[1] * (BD / 2 - .05)); g.add(st2);
    });
    // the sponsor plate on the front of the basket
    var plateMat = new T.MeshStandardMaterial({ map: plateTex(opt.plate || ''), roughness: .8, side: T.DoubleSide });
    var plate = new T.Mesh(new T.PlaneGeometry(1.05, .26), plateMat);
    plate.position.set(0, .12, BD / 2 + .02); g.add(plate);
    // the burner: a frame, twin brass burners, and the flame
    var brass = new T.MeshStandardMaterial({ color: '#c9a24a', metalness: .7, roughness: .32 });
    var burnG = new T.Group();
    [-.17, .17].forEach(function (o) {
      var bn = new T.Mesh(new T.CylinderGeometry(.17, .22, .42, 10), brass); bn.position.x = o; burnG.add(bn);
      var jet = new T.Mesh(new T.ConeGeometry(.1, .22, 8), steel); jet.position.set(o, .3, 0); burnG.add(jet);
    });
    // the uprights that carry the burner frame up into the throat
    if (!simple) for (var u = 0; u < 4; u++) {
      var au = (u / 4) * Math.PI * 2 + .4;
      var p1 = new T.Vector3(Math.sin(au) * .30, .62, Math.cos(au) * .30);
      var p2 = new T.Vector3(Math.sin(au) * .16, MOUTH - 1.12, Math.cos(au) * .16);
      var d2 = new T.Vector3().subVectors(p2, p1);
      var pm = new T.Mesh(new T.CylinderGeometry(.028, .028, d2.length(), 4), steel);
      pm.position.copy(p1).add(p2).multiplyScalar(.5);
      pm.quaternion.setFromUnitVectors(new T.Vector3(0, 1, 0), d2.clone().normalize());
      g.add(pm);
    }
    burnG.position.y = MOUTH - 1.24; g.add(burnG);
    // the flame: a hot core, a tall plume and the glow that lights the throat
    var flameG = new T.Group();
    var core = new T.Mesh(new T.ConeGeometry(.19, .78, 12), new T.MeshBasicMaterial({ color: '#ffd27a', transparent: true, opacity: .95, depthWrite: false, fog: false, blending: T.AdditiveBlending }));
    core.position.y = .22; flameG.add(core);
    var plume = new T.Mesh(new T.ConeGeometry(.30, 1.55, 12), new T.MeshBasicMaterial({ color: '#ff8c1a', transparent: true, opacity: .5, depthWrite: false, fog: false, blending: T.AdditiveBlending }));
    plume.position.y = .62; flameG.add(plume);
    var glow = new T.PointLight(0xffb04a, 0, 16, 2);
    glow.position.y = .35; flameG.add(glow);
    flameG.position.y = MOUTH - .90; flameG.visible = false; g.add(flameG);
    var flame = flameG;   // the old handle, so the flight loop can still find it
    if (!simple) {
      // the passenger, sitting in the corner of the basket so you can see past him
      var body = new T.Mesh(new T.CylinderGeometry(.15, .19, .48, 8), new T.MeshStandardMaterial({ color: '#3b3f52', roughness: .88 }));
      body.position.set(-.42, .82, -.34); g.add(body);
      var head = new T.Mesh(new T.SphereGeometry(.125, 10, 8), new T.MeshStandardMaterial({ color: '#e8c39a', roughness: .88 }));
      head.position.set(-.42, 1.16, -.34); g.add(head);
      var hat = new T.Mesh(new T.CylinderGeometry(.15, .17, .1, 10), new T.MeshStandardMaterial({ color: '#c8452f', roughness: .85 }));
      hat.position.set(-.42, 1.26, -.34); g.add(hat);
      // the propane cylinders, and the bag and crate in the basket
      [-.44, -.2].forEach(function (o, i) {
        var tank = new T.Mesh(new T.CylinderGeometry(.16, .16, .62, 10), new T.MeshStandardMaterial({ color: i ? '#b8443a' : '#c0503f', metalness: .3, roughness: .5 }));
        tank.position.set(o, -.22, .42); g.add(tank);
      });
      var bag = new T.Mesh(new T.SphereGeometry(.28, 10, 8), new T.MeshStandardMaterial({ color: '#7d6a4a', roughness: 1 }));
      bag.scale.set(1, .8, 1); bag.position.set(.3, -.32, .3); g.add(bag);
      var crate = new T.Mesh(new T.BoxGeometry(.4, .34, .36), new T.MeshStandardMaterial({ color: '#8d6b3f', roughness: .95 }));
      crate.position.set(.42, -.3, -.36); crate.rotation.y = .3; g.add(crate);
    }
    // The advertisement is printed straight onto the nylon, across the panels and the load tapes —
    // it lives in the envelope's own texture, so there is no patch of mesh floating over the cloth.
    var banG = new T.Group();
    g.userData = { flame: flame, skin: skin, tape: tape, gores: gores, baseY: MOUTH - .3, plateMat: plateMat, banG: banG, print: opt.print || null };
    g.name = simple ? 'fest' : 'player';
    return g;
  }

  // ================================================================ the flight
  function Balloon(opts) {
    var P = opts.provider || K.defaultProvider(), src = opts.source || { type: 'workspace' };
    var C = X.collect(P, src);
    if (!C.all.length) throw new Error('No cards for the balloon');
    var saved = opts.fresh ? {} : DB.get(C.key);
    var seed = opts.seed != null ? opts.seed : (saved.seed != null ? saved.seed : K.hash(C.key) % 100000);
    var R = buildRoute(C.groups, seed);
    var st = {
      s: clamp(saved.s || 0, 0, R.len - 1), v: 0, playing: saved.playing !== false, speed: saved.speed != null ? saved.speed : 1,
      alt: saved.alt != null ? saved.alt : ALT_DEF, altWant: saved.alt != null ? saved.alt : ALT_DEF,
      lat: 0, latWant: 0, theme: opts.theme || saved.theme || 'noon', view: saved.view || 'chase',
      focus: -1, sTarget: null, up: false, down: false, burn: 0, visited: {}
    };
    if (opts.theme || opts.style) st.theme = opts.theme || opts.style;

    // ---------------- the stage
    var S = X.stage({
      cls: 'kb-root', container: opts.container, onExit: opts.onExit, hFov: 74, maxFov: 86, far: 2600,
      hint: 'Tap the exhibit again to read it',
      html: '<div class="kx-top"><div class="kx-pill"><i></i><span><b></b><small></small></span></div><div class="kx-tr">' +
        '<button type="button" class="kx-b" data-kx="map" aria-label="Route map">🗺 <span>Map</span></button>' +
        '<button type="button" class="kx-b" data-kx="view" aria-label="View">🎥</button>' +
        '<button type="button" class="kx-b" data-kx="theme" aria-label="Sky">🎨</button>' +
        '<button type="button" class="kx-b" data-kx="exit" aria-label="Exit">✕</button></div></div>' +
        '<div class="kx-bar">' +
        '<button type="button" class="kx-b" data-kx="prev" aria-label="Previous exhibit">⏮</button>' +
        '<button type="button" class="kx-b" data-kx="cruise" aria-label="Cruise">⏸</button>' +
        '<button type="button" class="kx-b" data-kx="next" aria-label="Next exhibit">⏭</button>' +
        '<button type="button" class="kx-b kb-hold" data-kx="up" aria-label="Climb">⬆</button>' +
        '<button type="button" class="kx-b kb-hold" data-kx="down" aria-label="Descend">⬇</button>' +
        '<button type="button" class="kx-b" data-kx="speed" aria-label="Speed">🐢</button></div>' +
        '<div class="kx-sheet" hidden><div class="kx-card kb-sheet"><div class="kx-head"><b>🗺 The route</b><button type="button" class="kx-b" data-kx="map">✕</button></div>' +
        '<canvas class="kb-mapc"></canvas><div class="kb-list"></div></div></div>'
    });
    var scene = S.scene, cam = S.cam, RD = X.reader(S);
    var kit = K.kit();

    // ---------------- light and sky
    var hemi = new T.HemisphereLight('#ffffff', '#5a4a3a', .9); scene.add(hemi);
    var sun = new T.DirectionalLight('#fff4d6', 1.1); scene.add(sun, sun.target);
    var skyGeo = new T.SphereGeometry(1600, 24, 16);
    var sky = new T.Mesh(skyGeo, new T.MeshBasicMaterial({ vertexColors: true, side: T.BackSide, fog: false, depthWrite: false }));
    sky.renderOrder = -10; scene.add(sky);
    var sunDisc = new T.Mesh(new T.CircleGeometry(30, 16), new T.MeshBasicMaterial({ color: '#fff', fog: false, depthWrite: false }));
    sunDisc.renderOrder = -9; scene.add(sunDisc);
    var starPos = [];
    for (var si = 0; si < 900; si++) { var sa = Math.random() * Math.PI * 2, se = Math.random() * Math.PI * .5; starPos.push(Math.cos(sa) * Math.cos(se) * 1400, Math.sin(se) * 1400, Math.sin(sa) * Math.cos(se) * 1400); }
    var starGeo = new T.BufferGeometry(); starGeo.setAttribute('position', new T.Float32BufferAttribute(starPos, 3));
    var stars = new T.Points(starGeo, new T.PointsMaterial({ color: '#dfe8ff', size: 3, sizeAttenuation: false, transparent: true, opacity: .9, fog: false }));
    stars.renderOrder = -9; scene.add(stars);
    var clouds = new T.InstancedMesh(kit.cloud.geo, kit.cloud.mat, 16); clouds.frustumCulled = false; scene.add(clouds);
    var cloudOff = [];
    for (var ci = 0; ci < 16; ci++) cloudOff.push({ lat: (ci % 2 ? 1 : -1) * (90 + (ci * 37) % 240), alt: 120 + (ci * 53) % 150, sc: .8 + ((ci * 29) % 70) / 60 });

    // ---------------- the balloon
    // the advertisement it carries: the title of the exhibit you are flying over, printed on the
    // envelope itself. The print is baked into the cloth, so the balloon has to be repainted.
    var adTitle = '';
    function setAd(title) {   // the player's own cloth always says MINEST; only the plate follows the exhibit
      if (title === adTitle) return;
      adTitle = title || '';
      balloon.userData.plateMat.map = plateTex(adTitle || 'MINEST');
      balloon.userData.plateMat.needsUpdate = true;
    }
    var balloon = makeBalloon({ plate: 'MINEST', print: { title: 'MINEST', sub: 'the balloon ride' } });
    scene.add(balloon);
    function repaintPlayer() {
      var TH = themeById(st.theme), pr = balloon.userData.print || {};
      paintGores(balloon.userData.skin, balloon.userData.gores, TH.bal || TH.env, 0, pr.title, pr.sub);
    }
    function paintFest(fb) {
      var TH = themeById(st.theme), ad = fb.stop != null ? R.stops[fb.stop] : null;
      paintGores(fb.g.userData.skin, fb.g.userData.gores, TH.bal || TH.env, fb.shift,
        ad ? (ad.it.I ? ad.it.I.title : '') : corridorAt(fb.s).name, ad ? (ad.g ? ad.g.title : '') : 'Minest · the balloon ride');
    }
    /* the sky and the fabrics are painted in sRGB: this renderer decodes them (only the balloon's — the other showcase modes keep their look) */
    if (S.R && S.R.outputEncoding !== undefined && T.sRGBEncoding !== undefined) S.R.outputEncoding = T.sRGBEncoding;
    window.__kb = { scene: scene, cam: cam, balloon: balloon, THREE: T, S: S, R: S.R };

    // ---------------- the festival: the other balloons, flying with you
    // Four keep station beside you, ten drift along the route ahead. They are placed by bearing so the
    // sky is never empty.
    var festival = [], FEST_ESCORT = 4;
    // [forward, lateral] from the balloon, in world units — about 24° off the axis, so they sit
    // near the edges of the frame without leaving it
    var FEST_ESC = [[52, -24], [78, 35], [120, -54], [170, 76]];
    for (var fi = 0; fi < 14; fi++) {
      var fh = K.hash('festival:' + fi + ':' + seed), fv = fh >>> 0;
      var big = .62 + (fv % 62) / 100;                      // .62 - 1.23
      var fg = makeBalloon({ R: 3.0 * big, H: 7.0 * big, gores: 16 + (fv % 9), simple: true, shift: fi });
      scene.add(fg);
      var esc = fi < FEST_ESCORT;
      var fmt = FEST_ESC[fi % FEST_ESC.length];
      festival.push({
        g: fg, shift: fi, escort: esc, rnd: K.rng(fv),
        s: 0, lat: 0, alt: 0, F: {}, stop: null, flare: 0,
        along: esc ? fmt[0] : 120, elat: esc ? fmt[1] : 0, ealt: 14 + ((fv >> 19) % 42),
        vel: ((fv >> 7) % 100) / 100 * 1.6 - .8, latW: 3 + ((fv >> 17) % 12), altW: 2 + ((fv >> 5) % 6),
        w: .00035 + ((fv >> 3) % 60) / 100 * .0009, ph: ((fv >> 13) % 100) / 100 * 6.283,
        tx: 0, ty: 0, tz: 0, yaw: 0, tilt: 0
      });
    }
    // the ones along the route are placed ahead of you
    festival.forEach(function (fb) {
      if (fb.escort) return;
      fb.s = (fb.shift + 1) * 130;
      fb.lat = (fb.shift % 2 ? 1 : -1) * (30 + Math.floor(fb.rnd() * 80));
      fb.alt = 44 + Math.floor(fb.rnd() * 54);
    });
    // the confetti the festival leaves in the air
    var confGeo = new T.BufferGeometry(), cpos = [], ccol = [], CONF_N = 260, CONF_COL = ['#e0554a', '#f2a13c', '#f7d774', '#4f8f6a', '#3f5f9f', '#ffffff'];
    for (var ci = 0; ci < CONF_N; ci++) {
      cpos.push((Math.random() - .5) * 280, (Math.random() - .5) * 170, (Math.random() - .5) * 280);
      var cc = new T.Color(CONF_COL[ci % CONF_COL.length]); ccol.push(cc.r, cc.g, cc.b);
    }
    confGeo.setAttribute('position', new T.Float32BufferAttribute(cpos, 3));
    confGeo.setAttribute('color', new T.Float32BufferAttribute(ccol, 3));
    var conf = new T.Points(confGeo, new T.PointsMaterial({ size: 1.7, sizeAttenuation: true, vertexColors: true, transparent: true, opacity: .85, fog: false }));
    scene.add(conf);

    function applyTheme() {
      var TH = themeById(st.theme);
      var c0 = new T.Color(TH.sky[0]), c1 = new T.Color(TH.sky[1]), c2 = new T.Color(TH.sky[2]), pos = skyGeo.attributes.position, col = [];
      for (var i = 0; i < pos.count; i++) {
        var y = pos.getY(i) / 1600, c = new T.Color();
        if (y < 0) c.copy(c2); else if (y < .3) c.copy(c2).lerp(c1, y / .3); else c.copy(c1).lerp(c0, Math.min(1, (y - .3) / .5));
        col.push(c.r, c.g, c.b);
      }
      skyGeo.setAttribute('color', new T.Float32BufferAttribute(col, 3));
      scene.fog = new T.Fog(TH.fog, 260, 1500); scene.background = new T.Color(TH.fog);
      hemi.color.set(TH.hemi[0]); hemi.groundColor.set(TH.hemi[1]); hemi.intensity = TH.hemi[2];
      sun.color.set(TH.sun[0]); sun.intensity = TH.sun[1];
      sun.userData.dir = new T.Vector3(TH.sun[2], TH.sun[3], TH.sun[4]).normalize();
      sunDisc.material.color.set(TH.night ? '#cdd8ff' : '#fff');
      stars.visible = !!TH.night;
      kit.cloud.mat.color.set(TH.cloud);
      // the envelopes' gores follow the sky
      var pr = balloon.userData.print || {};
      paintGores(balloon.userData.skin, balloon.userData.gores, TH.bal || TH.env, 0, pr.title, pr.sub);
      for (var fi = 0; fi < festival.length; fi++) paintFest(festival[fi]);
    }

    // ---------------- the land: chunks of terrain, water and trees
    var world = new T.Group(); scene.add(world);
    var chunks = {}, waterM = new T.MeshStandardMaterial({ color: '#3f86b8', roughness: .28, metalness: .15, flatShading: true });
    var mGrass = new T.Color('#6f9455'), mRock = new T.Color('#8d8478'), mSand = new T.Color('#cdbd8c');

    function frame(s, out) {
      var u = clamp(s / R.len, 0, 1);
      out = out || {};
      out.p = R.curve.getPointAt(u, out.p || new T.Vector3());
      out.t = R.curve.getTangentAt(u, out.t || new T.Vector3()).setY(0).normalize();
      out.l = (out.l || new T.Vector3()).set(out.t.z, 0, -out.t.x);
      return out;
    }
    function buildChunk(ci) {
      var s0 = ci * CHUNK, s1 = Math.min(R.len, s0 + CHUNK), rows = 14, cols = 32, pos = [], col = [], idx = [], F = {};
      for (var r = 0; r <= rows; r++) {
        var s = s0 + (s1 - s0) * r / rows; frame(s, F);
        var rc = riverAt(s);
        for (var c = 0; c <= cols; c++) {
          var lat = -TERRAIN_W + 2 * TERRAIN_W * c / cols;
          var px = F.p.x + F.l.x * lat, pz = F.p.z + F.l.z * lat;
          var h = hgt(px, pz), d = Math.abs(lat - rc);
          if (d < 36) h = lerp(h, -3.4 + (d / 36) * 4.2, 1 - d / 36);
          pos.push(px, h, pz);
          var cc = mGrass.clone().offsetHSL(0, 0, ((K.hash(Math.round(px) * 71 + Math.round(pz)) % 100) / 100 - .5) * .12);
          if (h > 12) cc.lerp(mRock, clamp((h - 12) / 16, 0, 1));
          if (d < 42) cc.lerp(mSand, clamp(1 - d / 42, 0, 1) * .8);
          col.push(cc.r, cc.g, cc.b);
        }
      }
      for (r = 0; r < rows; r++) for (c = 0; c < cols; c++) {
        var o = r * (cols + 1) + c;
        idx.push(o, o + cols + 1, o + 1, o + 1, o + cols + 1, o + cols + 2);
      }
      var g = new T.BufferGeometry();
      g.setAttribute('position', new T.Float32BufferAttribute(pos, 3));
      g.setAttribute('color', new T.Float32BufferAttribute(col, 3));
      g.setIndex(idx); g.computeVertexNormals();
      var grp = new T.Group();
      grp.add(new T.Mesh(g, new T.MeshStandardMaterial({ vertexColors: true, roughness: 1, flatShading: true })));
      // the river
      var wpos = [], widx = [], F2 = {};
      for (r = 0; r <= rows; r++) {
        var ws = s0 + (s1 - s0) * r / rows; frame(ws, F2); var wrc = riverAt(ws);
        for (c = 0; c <= 8; c++) { var wlat = wrc - 22 + 44 * c / 8; wpos.push(F2.p.x + F2.l.x * wlat, -1.1, F2.p.z + F2.l.z * wlat); }
      }
      for (r = 0; r < rows; r++) for (c = 0; c < 8; c++) { var o2 = r * 9 + c; widx.push(o2, o2 + 9, o2 + 1, o2 + 1, o2 + 9, o2 + 10); }
      var wg = new T.BufferGeometry();
      wg.setAttribute('position', new T.Float32BufferAttribute(wpos, 3)); wg.setIndex(widx); wg.computeVertexNormals();
      grp.add(new T.Mesh(wg, waterM));
      // trees and rocks
      var rr = K.rng(seed * 31 + ci), kinds = { pine: [], round: [], rock: [] }, F3 = {};
      for (var n = 0; n < 34; n++) {
        var ts = s0 + rr() * (s1 - s0), lat2 = (rr() * 2 - 1) * TERRAIN_W; frame(ts, F3);
        if (Math.abs(lat2 - riverAt(ts)) < 46) continue;
        var tx = F3.p.x + F3.l.x * lat2, tz = F3.p.z + F3.l.z * lat2, th = hgt(tx, tz);
        if (th < 1) continue;
        var steep = Math.abs(hgt(tx + 6, tz) - th) + Math.abs(hgt(tx, tz + 6) - th);
        if (steep > 9) continue;
        var kind = rr() < .5 ? 'pine' : rr() < .82 ? 'round' : 'rock';
        kinds[kind].push([tx, th, tz, .8 + rr() * .9, rr() * 6.28, steep]);
      }
      Object.keys(kinds).forEach(function (k) {
        var list = kinds[k]; if (!list.length) return;
        var im = new T.InstancedMesh(kit[k].geo, kit[k].mat, list.length); im.frustumCulled = false;
        var m = new T.Matrix4(), q = new T.Quaternion(), v = new T.Vector3(), sc = new T.Vector3(), c = new T.Color();
        list.forEach(function (it, i) {
          var sc2 = it[3] * (k === 'rock' ? .7 : 1);
          v.set(it[0], it[1] - (k === 'rock' ? .2 : 0), it[2]);
          q.setFromAxisAngle(new T.Vector3(0, 1, 0), it[4]);
          sc.set(sc2, sc2 * (k === 'pine' ? 1.15 : 1), sc2);
          m.compose(v, q, sc); im.setMatrixAt(i, m);
          c.set('#ffffff').offsetHSL(0, 0, (it[5] - 4) * .006); im.setColorAt(i, c);
        });
        if (im.instanceColor) im.instanceColor.needsUpdate = true;
        grp.add(im);
      });
      world.add(grp); chunks[ci] = grp;
    }
    function dropChunk(ci) {
      var g = chunks[ci]; if (!g) return;
      world.remove(g);
      g.traverse(function (o) { if (o.isMesh) { if (o.geometry) o.geometry.dispose(); if (o.isInstancedMesh && o.dispose) o.dispose(); } });
      delete chunks[ci];
    }
    function manageChunks(s) {
      var a = Math.max(0, Math.floor((s - BEHIND) / CHUNK)), b = Math.floor((s + AHEAD) / CHUNK);
      for (var ci = a; ci <= b; ci++) if (!chunks[ci] && ci * CHUNK < R.len) buildChunk(ci);
      Object.keys(chunks).forEach(function (k) { if (+k < a - 1 || +k > b + 1) dropChunk(+k); });
    }

    // ---------------- the exhibits: a floating island with the card's frame above it
    var picks = [], signs = {};
    festival.forEach(function (fb) { picks.push(fb.g.userData.skin); });
    function buildIsland(sp) {
      var g = new T.Group(), col = sp.g.color || '#888';
      var rock = new T.Mesh(new T.DodecahedronGeometry(1.7, 0), new T.MeshStandardMaterial({ color: '#6d5c4a', flatShading: true, roughness: 1 }));
      rock.scale.set(1.35, .95, 1.35); rock.position.y = -1.3; g.add(rock);
      var cap = new T.Mesh(new T.CylinderGeometry(1.5, 1.72, .5, 7), new T.MeshStandardMaterial({ color: '#6f9455', flatShading: true, roughness: 1 }));
      cap.position.y = .1; g.add(cap);
      var stand = new T.Mesh(new T.CylinderGeometry(.09, .12, 1.8, 6), new T.MeshStandardMaterial({ color: '#7d5730', flatShading: true, roughness: .95 }));
      stand.position.set(0, 1.1, 0); g.add(stand);
      var halo = new T.Mesh(new T.TorusGeometry(2.3, .05, 6, 28), new T.MeshBasicMaterial({ color: col, transparent: true, opacity: .55, fog: false }));
      halo.rotation.x = Math.PI / 2; halo.position.y = .35; g.add(halo);
      g.traverse(function (o) { if (o.isMesh) { o.userData.ex = sp.index; picks.push(o); } });
      // the frame stands on its own in the world, so the reader can fly it to you
      var fr = X.carriers.frame(sp.it, { w: 2.1, h: 1.35, frame: '#c9a24a' });
      fr.traverse(function (o) { if (o.isMesh) { o.userData.ex = sp.index; picks.push(o); } });
      scene.add(g); scene.add(fr);
      sp.island = g; sp.frame = fr;
      return g;
    }
    function dropIsland(sp) {
      if (!sp.island) return;
      [sp.island, sp.frame].forEach(function (g) {
        if (!g) return;
        scene.remove(g);
        g.traverse(function (o) { if (o.isMesh) { var i = picks.indexOf(o); if (i >= 0) picks.splice(i, 1); if (o.geometry && !o.geometry.userData.shared) o.geometry.dispose(); } });
      });
      sp.island = null; sp.frame = null;
    }
    function placeIsland(sp) {
      if (!sp.island) return;
      var F = frame(sp.s, {});
      var x = F.p.x + F.l.x * sp.lat, z = F.p.z + F.l.z * sp.lat;
      sp.pos = new T.Vector3(x, hgt(x, z) + sp.alt, z);
      sp.island.position.copy(sp.pos);
      sp.island.rotation.y = Math.atan2(-F.l.x, -F.l.z);
      sp.frame.position.set(sp.pos.x, sp.pos.y + 2.3, sp.pos.z);
      sp.frame.rotation.y = sp.island.rotation.y + Math.PI;
    }
    function manageIslands(s) {
      R.stops.forEach(function (sp) {
        var d = sp.s - s, want = (d > -BEHIND - 60 && d < AHEAD) || sp.index === st.focus;
        if (want && !sp.island) { buildIsland(sp); placeIsland(sp); }
        else if (!want && sp.island) dropIsland(sp);
        else if (sp.island) placeIsland(sp);
      });
    }
    // the corridor's name, on a banner at its start
    function manageSigns(s) {
      R.corridors.forEach(function (c) {
        var near = c.s1 > s - 240 && c.s0 < s + AHEAD, has = !!signs[c.i];
        if (near && !has) {
          var F = frame(c.s0 + 20, {});
          var g = new T.Group();
          var tex = K.signTex(['▸ ' + c.name, c.g.items.length + ' exhibits'], '#2b2116', '#e8c878', 640, 180);
          var pan = new T.Mesh(new T.PlaneGeometry(6.4, 1.8), new T.MeshBasicMaterial({ map: tex, toneMapped: false }));
          pan.position.y = 5; g.add(pan);
          var post = new T.Mesh(new T.CylinderGeometry(.14, .18, 8, 6), new T.MeshStandardMaterial({ color: '#7d5730', flatShading: true, roughness: .95 }));
          post.position.y = 1.5; g.add(post);
          g.position.copy(F.p).setY(hgt(F.p.x, F.p.z) + 4);
          scene.add(g); signs[c.i] = g;
        } else if (!near && has) {
          scene.remove(signs[c.i]);
          signs[c.i].traverse(function (o) { if (o.isMesh) { o.geometry.dispose(); if (o.material.map) o.material.map.dispose(); o.material.dispose(); } });
          delete signs[c.i];
        }
      });
    }

    // ---------------- the festival on the ground: tents, bunting and bonfires you fly over
    var FEST_COL = ['#e0554a', '#f2a13c', '#f7d774', '#4f8f6a', '#3f5f9f', '#d8548f'], fests = {};
    function buildFest(ci) {
      var g = new T.Group(), r = K.rng(ci * 977 + 13);
      var F = frame(ci * FEST_STEP + 60, {});
      var bx = F.p.x, bz = F.p.z;
      var tents = 3 + Math.floor(r() * 3);
      for (var i = 0; i < tents; i++) {
        var ang = r() * Math.PI * 2, rad = 14 + r() * 46;
        var tx = bx + Math.cos(ang) * rad, tz = bz + Math.sin(ang) * rad;
        var col = FEST_COL[Math.floor(r() * FEST_COL.length)];
        var w = 2.6 + r() * 2.4, hh = 3.2 + r() * 2.2;
        var tent = new T.Mesh(new T.ConeGeometry(w, hh, 6), new T.MeshStandardMaterial({ color: col, flatShading: true, roughness: .9 }));
        tent.position.set(tx, hgt(tx, tz) + hh / 2, tz); tent.rotation.y = r() * 3; g.add(tent);
        var pole = new T.Mesh(new T.CylinderGeometry(.09, .11, 1.4, 5), new T.MeshStandardMaterial({ color: '#7d5730', flatShading: true, roughness: .95 }));
        pole.position.set(tx, hgt(tx, tz) + .7, tz); g.add(pole);
        var flag = new T.Mesh(new T.PlaneGeometry(1.3, .8), new T.MeshStandardMaterial({ color: FEST_COL[Math.floor(r() * FEST_COL.length)], side: T.DoubleSide, roughness: .9 }));
        flag.position.set(tx + .62, hgt(tx, tz) + 1.15, tz); flag.rotation.y = ang; g.add(flag);
      }
      // the bonfire, with its light
      var fx = bx + (r() - .5) * 40, fz = bz + (r() - .5) * 40, fy = hgt(fx, fz);
      var logs = new T.Mesh(new T.CylinderGeometry(.7, .9, 1.1, 7), new T.MeshStandardMaterial({ color: '#6b4a2c', flatShading: true, roughness: 1 }));
      logs.position.set(fx, fy + .5, fz); g.add(logs);
      var fire = new T.Mesh(new T.ConeGeometry(.85, 2.1, 7), new T.MeshBasicMaterial({ color: '#ff9c3a', transparent: true, opacity: .85, depthWrite: false, fog: false, blending: T.AdditiveBlending }));
      fire.position.set(fx, fy + 2, fz); g.add(fire);
      var lamp = new T.PointLight('#ff9c3a', 1.1, 42, 2); lamp.position.set(fx, fy + 2.4, fz); g.add(lamp);
      // the bunting: a line of little pennants between two poles
      var p1a = r() * Math.PI * 2, p2a = p1a + 1.4 + r();
      var x1 = bx + Math.cos(p1a) * 30, z1 = bz + Math.sin(p1a) * 30;
      var x2 = bx + Math.cos(p2a) * 30, z2 = bz + Math.sin(p2a) * 30;
      [ [x1, z1], [x2, z2] ].forEach(function (p) {
        var po = new T.Mesh(new T.CylinderGeometry(.12, .16, 7, 5), new T.MeshStandardMaterial({ color: '#7d5730', flatShading: true, roughness: .95 }));
        po.position.set(p[0], hgt(p[0], p[1]) + 3.5, p[1]); g.add(po);
      });
      var NP = 9;
      for (var k = 0; k < NP; k++) {
        var u = (k + .5) / NP, sag = Math.sin(Math.PI * u) * 2.2;
        var px = x1 + (x2 - x1) * u, pz = z1 + (z2 - z1) * u, py = hgt(px, pz) + 6.4 - sag;
        var pen = new T.Mesh(new T.ConeGeometry(.42, .95, 3), new T.MeshStandardMaterial({ color: FEST_COL[k % FEST_COL.length], side: T.DoubleSide, flatShading: true, roughness: .9 }));
        pen.position.set(px, py - .5, pz); pen.rotation.x = Math.PI; g.add(pen);
      }
      scene.add(g); fests[ci] = g;
    }
    function manageFests(s) {
      var a = Math.max(0, Math.floor((s - BEHIND) / FEST_STEP)), b = Math.floor((s + AHEAD) / FEST_STEP);
      for (var ci = a; ci <= b; ci++) if (!fests[ci] && ci * FEST_STEP < R.len) buildFest(ci);
      Object.keys(fests).forEach(function (k) { if (+k < a - 1 || +k > b + 1) { scene.remove(fests[k]); fests[k].traverse(function (o) { if (o.isMesh) { o.geometry.dispose(); o.material.dispose(); } }); delete fests[k]; } });
    }

    // ---------------- HUD
    function speedLabel() { var s = SPEEDS[st.speed], b = S.$('[data-kx="speed"]'); b.innerHTML = s[1] + '<span>' + s[2] + '</span>'; b.title = 'Speed: ' + s[2]; }
    function cruiseLabel() {
      var b = S.$('[data-kx="cruise"]');
      b.innerHTML = (st.playing ? '⏸' : '▶') + '<span>Cruise</span>';
      b.classList.toggle('on', st.playing);
      b.setAttribute('aria-label', st.playing ? 'Cruise on — tap to hover' : 'Cruise off — tap to cruise');
    }
    function corridorAt(s) { for (var i = 0; i < R.corridors.length; i++) if (s >= R.corridors[i].s0 && s < R.corridors[i].s1) return R.corridors[i]; return R.corridors[R.corridors.length - 1]; }
    function visitedCount(c) { var n = 0; c.g.items.forEach(function (it) { if (st.visited[it.ref.id]) n++; }); return n; }
    function aloft() {   // how many of the festival's balloons you can see
      var n = 0;
      for (var i = 0; i < festival.length; i++) {
        var g = festival[i].g;
        if (g.position.distanceTo(cam.position) < 900) n++;
      }
      return n;
    }
    function ui() {
      var c = corridorAt(st.s);
      S.$('.kx-pill i').style.background = c.color;
      S.$('.kx-pill b').textContent = c.name;
      S.$('.kx-pill small').textContent = visitedCount(c) + ' / ' + c.g.items.length + ' exhibits · ' + Math.round(st.alt) + ' m · 🎈 ' + aloft() + ' aloft';
      S.$('[data-kx="view"]').textContent = st.view === 'basket' ? '🎈' : '🎥';
      speedLabel(); cruiseLabel();
    }

    // ---------------- the map
    var mapOpen = false;
    function drawMap() {
      var cv = S.$('.kb-mapc'); if (!cv) return;
      var w = cv.clientWidth, h = cv.clientHeight; if (!w || !h) return;
      var d = Math.min(window.devicePixelRatio || 1, 2);
      if (cv.width !== Math.round(w * d)) { cv.width = Math.round(w * d); cv.height = Math.round(h * d); }
      var x = cv.getContext('2d'); x.setTransform(d, 0, 0, d, 0, 0); x.clearRect(0, 0, w, h);
      var F = frame(st.s, {}), hd = Math.atan2(F.t.x, F.t.z), sc = Math.min(w / 640, h / 980);
      function tp(px, pz) {
        var dx = px - F.p.x, dz = pz - F.p.z;
        var right = dx * Math.cos(hd) - dz * Math.sin(hd), fwd = dx * Math.sin(hd) + dz * Math.cos(hd);
        return [w / 2 + right * sc, h / 2 - fwd * sc];
      }
      // the route
      x.lineCap = x.lineJoin = 'round'; x.strokeStyle = 'rgba(255,255,255,.22)'; x.lineWidth = 9; x.beginPath();
      var started = false, s;
      for (s = Math.max(0, st.s - 300); s < Math.min(R.len, st.s + 950); s += 14) {
        var q = frame(s, {}), p = tp(q.p.x, q.p.z);
        if (!started) { x.moveTo(p[0], p[1]); started = true; } else x.lineTo(p[0], p[1]);
      }
      x.stroke();
      // the river
      x.strokeStyle = 'rgba(90,160,220,.5)'; x.lineWidth = 6; x.beginPath(); started = false;
      for (s = Math.max(0, st.s - 300); s < Math.min(R.len, st.s + 950); s += 14) {
        var q2 = frame(s, {}), lat = riverAt(s), p2 = tp(q2.p.x + q2.l.x * lat, q2.p.z + q2.l.z * lat);
        if (!started) { x.moveTo(p2[0], p2[1]); started = true; } else x.lineTo(p2[0], p2[1]);
      }
      x.stroke();
      // the exhibits
      R.stops.forEach(function (sp) {
        if (!sp.pos) return;
        var p3 = tp(sp.pos.x, sp.pos.z);
        x.fillStyle = st.visited[sp.it.ref.id] ? 'rgba(255,255,255,.45)' : (sp.g.color || '#999');
        x.beginPath(); x.arc(p3[0], p3[1], sp.index === st.focus ? 7 : 4.6, 0, 7); x.fill();
        if (sp.index === st.focus) { x.strokeStyle = '#ffd257'; x.lineWidth = 2.5; x.beginPath(); x.arc(p3[0], p3[1], 10, 0, 7); x.stroke(); }
      });
      // the other balloons of the festival
      festival.forEach(function (fb) {
        var p4 = tp(fb.g.position.x, fb.g.position.z);
        x.fillStyle = 'rgba(255,255,255,.7)';
        x.beginPath(); x.arc(p4[0], p4[1], 3.4, 0, 7); x.fill();
      });
      // the balloon
      x.fillStyle = '#fff'; x.beginPath();
      x.moveTo(w / 2, h / 2 - 11); x.lineTo(w / 2 + 8, h / 2 + 8); x.lineTo(w / 2, h / 2 + 4); x.lineTo(w / 2 - 8, h / 2 + 8); x.closePath(); x.fill();
    }
    function mapSheet() {
      var sh = S.$('.kx-sheet');
      mapOpen = sh.hidden; sh.hidden = !mapOpen;
      if (!mapOpen) return;
      S.$('.kb-list').innerHTML = R.corridors.map(function (co) {
        return '<button type="button" class="kb-lrow" data-kx="corridor" data-i="' + co.i + '" style="--c:' + co.color + '"><b>' + esc(co.name) + '</b><small>' + co.g.items.length + ' exhibits · ' + visitedCount(co) + ' seen</small></button>';
      }).join('');
      setTimeout(drawMap, 40);
    }

    // ---------------- focusing an exhibit
    function focusStop(i) {
      var sp = R.stops[i]; if (!sp) return;
      st.focus = i; st.playing = false; st.sTarget = null; cruiseLabel();
      if (!sp.island) { buildIsland(sp); placeIsland(sp); }
      st.altWant = sp.alt + 4;
      st.latWant = sp.lat > 0 ? sp.lat - 18 : sp.lat + 18;
      st.sTarget = clamp(sp.s - 16, 0, R.len - 1);
      S.hap();
      S.toast('Flying over ' + (sp.it.I ? sp.it.I.title : 'the exhibit'));
      // the balloon's own advertisement becomes the exhibit's title
      setAd(sp.it.I ? sp.it.I.title : '');
      festival.forEach(function (fb) { if (fb.stop === i) fb.flare = 2.5; });
      ui();
    }
    function pullStop(i) {
      var sp = R.stops[i]; if (!sp || !sp.frame || !sp.it.I) return;
      var dir = new T.Vector3().subVectors(balloon.position, sp.pos);
      if (dir.lengthSq() < .01) dir.set(0, 0, 1); else dir.normalize();
      RD.pull(sp.frame, sp.it, { slide: dir.multiplyScalar(1.2), dist: 2.1, onBack: function () { ui(); } });
      st.visited[sp.it.ref.id] = 1;
      setAd(sp.it.I.title);
      ui();
    }
    function nextStop(dir) {
      var best = null;
      R.stops.forEach(function (sp) {
        if (dir > 0 ? sp.s > st.s + 6 : sp.s < st.s - 6) { if (!best || (dir > 0 ? sp.s < best.s : sp.s > best.s)) best = sp; }
      });
      if (!best) return S.toast(dir > 0 ? 'The last exhibit on this route' : 'The start of the route');
      st.sTarget = best.s; st.altWant = best.alt + 4; st.latWant = 0;
      st.focus = best.index; st.playing = false; cruiseLabel();
      S.hap();
    }
    function spClose(i) { var sp = R.stops[i]; return sp && sp.pos && sp.pos.distanceTo(balloon.position) < 52; }

    // ---------------- input
    S.onDrag = function (dx, dy) {
      st.latWant = clamp(st.latWant - dx * .5, -110, 110);
      st.altWant = clamp(st.altWant + dy * .35, ALT_MIN, ALT_MAX);
    };
    S.onWheel = function (d) { st.altWant = clamp(st.altWant - d * .06, ALT_MIN, ALT_MAX); };
    S.onTap = function (e) {
      if (!S.$('.kx-sheet').hidden) return;
      if (RD.open) { var h0 = S.pick(e.clientX, e.clientY, RD.meshes); if (RD.hit(h0)) RD.flip(); else RD.back(); return; }
      var h = S.pick(e.clientX, e.clientY, picks);
      if (h && h.object.userData.ex != null) {
        var i = h.object.userData.ex;
        if (st.focus === i && spClose(i)) return pullStop(i);
        return focusStop(i);
      }
      if (st.focus >= 0) { st.focus = -1; ui(); }
    };
    S.onHover = function (e) { var h = S.pick(e.clientX, e.clientY, RD.open ? RD.meshes : picks); S.cvs.style.cursor = h ? 'pointer' : ''; };
    S.onAct = function (k, el) {
      if (k === 'exit') return self.close();
      if (k === 'map') return mapSheet();
      if (k === 'view') { st.view = st.view === 'chase' ? 'basket' : 'chase'; S.toast(st.view === 'basket' ? '🎈 From the basket' : '🎥 Chase view'); ui(); return; }
      if (k === 'theme') {
        var i = THEMES.findIndex(function (t) { return t.id === st.theme; });
        st.theme = THEMES[(i + 1) % THEMES.length].id; applyTheme();
        S.toast(themeById(st.theme).icon + ' ' + themeById(st.theme).name); persist(); return;
      }
      if (k === 'cruise') { st.playing = !st.playing; cruiseLabel(); return; }
      if (k === 'speed') { st.speed = (st.speed + 1) % SPEEDS.length; speedLabel(); return; }
      if (k === 'prev') { RD.back(true); nextStop(-1); return; }
      if (k === 'next') { RD.back(true); nextStop(1); return; }
      if (k === 'up' || k === 'down') return;
      if (k === 'corridor') {
        var c = R.corridors[+el.dataset.i];
        if (c) { st.sTarget = c.s0 + 30; st.altWant = ALT_DEF; st.latWant = 0; st.focus = -1; st.playing = false; cruiseLabel(); mapSheet(); S.hap(); }
        return;
      }
      ui(); persist();
    };
    // hold the climb / descend buttons
    ['up', 'down'].forEach(function (k) {
      var b = S.$('[data-kx="' + k + '"]');
      b.addEventListener('pointerdown', function (e) { e.preventDefault(); st[k] = true; });
      ['pointerup', 'pointercancel', 'pointerleave'].forEach(function (ev) { b.addEventListener(ev, function () { st[k] = false; }); });
    });
    var keys = {};
    S.onKey = function (e) {
      var k = e.key;
      if (k === 'Escape') { e.preventDefault(); if (!S.$('.kx-sheet').hidden) return mapSheet(); if (RD.open) return RD.back(); return self.close(); }
      if (k === 'ArrowUp') { e.preventDefault(); keys.up = true; st.altWant = clamp(st.altWant + 12, ALT_MIN, ALT_MAX); }
      if (k === 'ArrowDown') { e.preventDefault(); keys.down = true; st.altWant = clamp(st.altWant - 12, ALT_MIN, ALT_MAX); }
      if (k === 'ArrowLeft') { e.preventDefault(); st.latWant = clamp(st.latWant - 20, -110, 110); }
      if (k === 'ArrowRight') { e.preventDefault(); st.latWant = clamp(st.latWant + 20, -110, 110); }
      if (k === ' ') { e.preventDefault(); if (RD.open) RD.flip(); else { st.playing = !st.playing; cruiseLabel(); } }
      if (k === 'Enter') { e.preventDefault(); if (st.focus >= 0) pullStop(st.focus); }
      if (k === 'm' || k === 'M') mapSheet();
      if (k === 'v' || k === 'V') S.onAct('view');
    };
    function onKeyUp(e) { if (e.key === 'ArrowUp') keys.up = false; if (e.key === 'ArrowDown') keys.down = false; }
    window.addEventListener('keyup', onKeyUp);

    function persist() { DB.set(C.key, { s: Math.round(st.s), alt: Math.round(st.alt), speed: st.speed, theme: st.theme, view: st.view, playing: st.playing, seed: seed, at: Date.now() }); }
    S.onHide = persist;

    // ---------------- the loop
    var F = {}, look = new T.Vector3(), lookTo = new T.Vector3(), eye = new T.Vector3(), UP = new T.Vector3(0, 1, 0);
    var mgT = 0, hudT = 0, saveT = 0, festT = 0, adT = 0;
    function TICK(dt, now) {
      // the flight
      var target = st.playing ? SPEEDS[st.speed][0] : 0;
      if (st.sTarget != null) {   // flying to an exhibit: ease onto it and stop there
        var d = st.sTarget - st.s;
        target = clamp(Math.abs(d) * .7, 0, 18);
        if (Math.abs(d) < 1.2) { st.sTarget = null; target = 0; }
      }
      st.v = lerp(st.v, target, 1 - Math.exp(-dt * (target > st.v ? .8 : 2.6)));
      st.s = clamp(st.s + st.v * dt, 0, R.len - 1);
      if (st.s >= R.len - 1 && st.playing && st.sTarget == null) { st.playing = false; cruiseLabel(); S.toast('🏁 The end of the route'); }
      // the advertisements: the other balloons carry the exhibits you are flying towards, the way Knowledge
      // Drive's billboards do. An escort takes the next unclaimed exhibit ahead; a drifting balloon
      // advertises the exhibit nearest to it. A cloth is only repainted once its exhibit is behind you.
      adT += dt;
      if (adT > .6) {
        adT = 0;
        var taken = {};
        festival.forEach(function (fb) { if (fb.stop != null) taken[fb.stop] = 1; });
        festival.forEach(function (fb) {
          var cur = fb.stop != null ? R.stops[fb.stop] : null, pick = null, bd = 1e9;
          if (cur && (fb.escort ? cur.s > st.s - 30 : Math.abs(cur.s - fb.s) < 160) && cur.s < st.s + 1400) return;
          if (cur) delete taken[fb.stop];
          for (var ni = 0; ni < R.stops.length; ni++) {
            var spn = R.stops[ni], d = fb.escort ? spn.s - (st.s + 20) : Math.abs(spn.s - fb.s);
            if (fb.escort ? d < 0 : false) continue;
            if (taken[ni] || !spn.it.I || d >= bd) continue;
            bd = d; pick = ni;
          }
          if (pick == null) { fb.stop = null; fb.g.userData.skin.userData.ex = null; paintFest(fb); return; }
          taken[pick] = 1; fb.stop = pick; fb.g.userData.skin.userData.ex = pick; paintFest(fb);
        });
      }
      // the climb
      if (st.up || keys.up) st.altWant = clamp(st.altWant + 26 * dt, ALT_MIN, ALT_MAX);
      if (st.down || keys.down) st.altWant = clamp(st.altWant - 26 * dt, ALT_MIN, ALT_MAX);
      st.alt = lerp(st.alt, st.altWant, 1 - Math.exp(-dt * 2.4));
      st.lat = lerp(st.lat, st.latWant, 1 - Math.exp(-dt * 2));
      if (!st.playing && st.sTarget == null && st.focus < 0) st.latWant = lerp(st.latWant, 0, 1 - Math.exp(-dt * .35));

      frame(st.s, F);
      var bx = F.p.x + F.l.x * st.lat, bz = F.p.z + F.l.z * st.lat;
      var by = hgt(bx, bz) + st.alt;
      balloon.position.set(bx, by, bz);
      var yaw = Math.atan2(F.t.x, F.t.z);
      balloon.rotation.y = lerp(balloon.rotation.y, yaw + st.lat * .0016, 1 - Math.exp(-dt * 2));
      balloon.rotation.z = lerp(balloon.rotation.z, clamp(-st.lat * .0016, -.12, .12), 1 - Math.exp(-dt * 3));
      balloon.rotation.x = lerp(balloon.rotation.x, Math.sin(now / 1600) * .02, 1 - Math.exp(-dt * 2));
      balloon.position.y += Math.sin(now / 900) * .18;
      // the burner flares when you climb
      st.burn = lerp(st.burn, ((st.up || keys.up) ? 1 : 0) + (Math.sin(now / 2400) > .986 ? .85 : 0), 1 - Math.exp(-dt * 9));
      var fl = balloon.userData.flame;
      fl.visible = st.burn > .02;
      if (fl.visible) {
        fl.scale.set(.85 + st.burn * .35, .5 + st.burn * 1.3, .85 + st.burn * .35);
        fl.position.y = balloon.userData.baseY + st.burn * .3;
        var gl = fl.children[2]; if (gl && gl.isPointLight) gl.intensity = st.burn * 26;
      }
      // the print is on the cloth, so it stays where it was painted
      var banG = balloon.userData.banG;
      if (banG) banG.rotation.y = 0;

      // the camera
      var fwd = new T.Vector3(Math.sin(yaw), 0, Math.cos(yaw));
      balloon.updateMatrixWorld(true);
      if (st.view === 'basket') {
        // from the basket, looking out under the envelope
        eye.set(.30, .78, .30).applyMatrix4(balloon.matrixWorld);
        cam.position.copy(eye);
        lookTo.copy(eye).addScaledVector(fwd, 30); lookTo.y = eye.y - 2.2;
        cam.lookAt(lookTo);
      } else {
        var side = F.l.clone();
        eye.copy(balloon.position).addScaledVector(fwd, -12.5).addScaledVector(side, 2.4); eye.y += 2.1;
        cam.position.lerp(eye, 1 - Math.exp(-dt * 4));
        if (st.focus >= 0 && R.stops[st.focus] && R.stops[st.focus].pos) {
          lookTo.copy(R.stops[st.focus].pos); lookTo.y += 3.4;
        } else {
          lookTo.copy(balloon.position).addScaledVector(fwd, 22); lookTo.y = balloon.position.y + 2.4;
        }
        look.lerp(lookTo, 1 - Math.exp(-dt * 3.4)); cam.lookAt(look);
      }
      // the sky follows you
      sky.position.copy(cam.position); stars.position.copy(cam.position);
      var sd = sun.userData.dir;
      sunDisc.position.copy(cam.position).addScaledVector(sd, 1100); sunDisc.lookAt(cam.position);
      sun.position.copy(cam.position).addScaledVector(sd, 220); sun.target.position.copy(cam.position);
      // the clouds, along the route
      var m = new T.Matrix4(), q = new T.Quaternion();
      for (var i = 0; i < cloudOff.length; i++) {
        var co = cloudOff[i], cs = st.s + (i * 190) - 600, F4 = frame(clamp(cs, 0, R.len), {});
        var cx = F4.p.x + F4.l.x * co.lat, cz = F4.p.z + F4.l.z * co.lat;
        q.setFromAxisAngle(UP, i * 1.7);
        m.compose(new T.Vector3(cx, hgt(cx, cz) + co.alt, cz), q, new T.Vector3(2.6, 1.1, 1.8).multiplyScalar(co.sc));
        clouds.setMatrixAt(i, m);
      }
      clouds.instanceMatrix.needsUpdate = true;

      // the festival: the other balloons drift around you, free of the route
      festT += dt;
      if (festT > .05) {
        var fdt = festT; festT = 0;
        var Fp = frame(st.s, F);      // the player's own frame, so the flock flies with you
        for (var f = 0; f < festival.length; f++) {
          var fb = festival[f];
          if (fb.escort) {
            // an escort: keeps station beside you, a little ahead and to one side, drifting slowly
            var ealong = fb.along + Math.sin(now * fb.w * .7 + fb.ph) * 14;
            var elat = fb.elat + Math.sin(now * fb.w * 1.7 + fb.ph) * fb.latW;
            var ealt = fb.ealt + Math.sin(now * fb.w * 2.3 + fb.ph) * fb.altW;
            fb.tx = Fp.p.x + Fp.t.x * ealong + Fp.l.x * elat;
            fb.tz = Fp.p.z + Fp.t.z * ealong + Fp.l.z * elat;
            fb.ty = hgt(fb.tx, fb.tz) + st.alt + ealt;
            fb.yaw = Math.atan2(Fp.t.x, Fp.t.z) + Math.sin(now * fb.w + fb.ph) * .2;
          } else {
            // a balloon of the festival: it drifts with the wind, almost as fast as you, so it holds
            // its place in the sky instead of being swept past
            fb.s += (st.v * .84 + fb.vel) * fdt;
            if (fb.s > st.s + 1500) fb.s = st.s + 120;
            else if (fb.s < st.s - 100) fb.s = st.s + 120;
            frame(fb.s, fb.F);
            var la = fb.lat + Math.sin(now * fb.w * 1.7 + fb.ph) * fb.latW;
            var al = fb.alt + Math.sin(now * fb.w * 2.3 + fb.ph) * fb.altW;
            fb.tx = fb.F.p.x + fb.F.l.x * la; fb.tz = fb.F.p.z + fb.F.l.z * la;
            fb.ty = hgt(fb.tx, fb.tz) + al;
            fb.yaw = Math.atan2(fb.F.t.x, fb.F.t.z) + Math.sin(now * fb.w + fb.ph) * .2;
          }
          fb.tilt = Math.sin(now * fb.w * 1.3 + fb.ph) * .06;
          fb.flare = Math.max(0, fb.flare - fdt);
          var ffl = fb.g.userData.flame, burning = fb.flare > 0 || Math.sin(now * .0009 + fb.ph * 3) > .8;
          ffl.visible = burning;
          if (burning) {
            ffl.scale.set(.7 + .3 * Math.sin(now * .02), 1.1, .7);
            var fgl = ffl.children[2]; if (fgl && fgl.isPointLight) fgl.intensity = 22;
          }
        }
      }
      for (var f2 = 0; f2 < festival.length; f2++) {
        var fb2 = festival[f2], gg = fb2.g;
        gg.position.x = lerp(gg.position.x, fb2.tx, 1 - Math.exp(-dt * 4));
        gg.position.y = lerp(gg.position.y, fb2.ty, 1 - Math.exp(-dt * 4));
        gg.position.z = lerp(gg.position.z, fb2.tz, 1 - Math.exp(-dt * 4));
        gg.rotation.y = lerp(gg.rotation.y, fb2.yaw, 1 - Math.exp(-dt * 2));
        gg.rotation.z = lerp(gg.rotation.z, fb2.tilt, 1 - Math.exp(-dt * 2));
        gg.rotation.x = lerp(gg.rotation.x, fb2.tilt * .6, 1 - Math.exp(-dt * 2));
      }
      // the confetti falls around the balloon
      conf.position.copy(cam.position);
      var cpa = confGeo.attributes.position;
      for (var ci2 = 0; ci2 < cpa.count; ci2++) {
        var yy = cpa.getY(ci2) - dt * 3.4; if (yy < -85) yy += 170;
        cpa.setY(ci2, yy);
        cpa.setX(ci2, cpa.getX(ci2) + Math.sin(now * .0011 + ci2 * .7) * dt * 1.8);
      }
      cpa.needsUpdate = true;

      // the world
      mgT += dt; if (mgT > .3) { mgT = 0; manageChunks(st.s); manageIslands(st.s); manageSigns(st.s); manageFests(st.s); }
      hudT += dt; if (hudT > .3) { hudT = 0; ui(); if (mapOpen) drawMap(); }
      saveT += dt; if (saveT > 2.5) { saveT = 0; persist(); }
    }
    S.tick(TICK);
    // a manual frame, for tests and for the background tab where the loop is paused
    this.step = function (dt) { TICK(dt || .016, performance.now()); S.R.render(scene, cam); };

    // ---------------- start
    applyTheme(); speedLabel(); cruiseLabel();
    manageChunks(st.s); manageIslands(st.s); manageSigns(st.s);
    ui(); S.start();
    if (saved.s > 5) S.toast('⟲ Resuming your flight · ' + corridorAt(st.s).name);
    else S.toast('🎈 ' + corridorAt(st.s).name + ' — tap an exhibit to fly to it');
    setTimeout(function () { if (S.alive) S.toast(R.stops.length + ' exhibits over ' + R.corridors.length + ' corridors'); }, 2800);

    var self = this;
    this.close = function () {
      persist();
      Object.keys(chunks).forEach(function (k) { dropChunk(+k); });
      Object.keys(fests).forEach(function (k) { scene.remove(fests[k]); delete fests[k]; });
      R.stops.forEach(dropIsland);
      Object.keys(signs).forEach(function (k) { scene.remove(signs[k]); });
      window.removeEventListener('keyup', onKeyUp);
      S.close();
    };
    this.state = function () {
      var c = corridorAt(st.s), sp = st.focus >= 0 ? R.stops[st.focus] : null;
      return { corridor: c.name, corridorCount: c.g.items.length, exhibits: R.stops.length, visited: visitedCount(c),
        playing: st.playing, alt: Math.round(st.alt), speed: st.speed, theme: st.theme, view: st.view, s: Math.round(st.s),
        focus: sp && sp.it.I ? sp.it.I.title : null, reading: RD.item() ? RD.item().I.title : null,
        built: R.stops.filter(function (x) { return x.island; }).length };
    };
    this.focus = focusStop;
    this.debug = function () {
      var v = balloon.position.clone(); v.y += 5.2; v.project(cam);
      var inView = 0, near = [];
      festival.forEach(function (f) {
        var d = f.g.position.distanceTo(cam.position);
        var q = f.g.position.clone(); q.y += 3; q.project(cam);
        var seen = Math.abs(q.x) < .95 && Math.abs(q.y) < .95 && q.z < 1 && d < 1400;
        if (seen) inView++;
        near.push({ d: Math.round(d), ndc: [Math.round(q.x * 100) / 100, Math.round(q.y * 100) / 100], seen: seen });
      });
      near.sort(function (a, b) { return a.d - b.d; });
      var objs = [];
      scene.children.forEach(function (o) {
        if (!o.name) return;
        var w = o.getWorldPosition(new T.Vector3()), q = w.clone(); q.y += 3; q.project(cam);
        objs.push({ n: o.name, d: Math.round(w.distanceTo(cam.position)), px: Math.round((q.x + 1) / 2 * 878), py: Math.round((1 - q.y) / 2 * 660), z: Math.round(q.z * 1000) / 1000, vis: Math.abs(q.x) < 1 && Math.abs(q.y) < 1 && q.z < 1 });
      });
      objs.sort(function (a, b) { return a.d - b.d; });
      var rc = new T.Raycaster();
      rc.setFromCamera(new T.Vector2(-.3, 0), cam);
      var hits = rc.intersectObjects(scene.children, true).slice(0, 4).map(function (h) {
        var o = h.object, chain = [];
        while (o && o !== scene) { chain.push(o.name || o.type); o = o.parent; }
        var mt = h.object.material;
        return { d: Math.round(h.distance * 100) / 100, chain: chain.join('<'), geo: h.object.geometry.type,
          col: mt && mt.color ? '#' + mt.color.getHexString() : '-', pt: [Math.round(h.point.x), Math.round(h.point.y), Math.round(h.point.z)] };
      });
      var ban = null;
      balloon.traverse(function (o) { if (o.isMesh && o.material === balloon.userData.skin.material) ban = o; });
      var banInfo = null;
      if (ban) {
        ban.updateMatrixWorld(true);
        ban.geometry.computeBoundingBox();
        var bb = ban.geometry.boundingBox;
        var bc = new T.Vector3(); bb.getCenter(bc);
        ban.localToWorld(bc);
        var bq = bc.clone(); bq.project(cam);
        var corner = bb.max.clone().applyMatrix4(ban.matrixWorld).project(cam);
        banInfo = { world: bc.toArray().map(Math.round), ndc: [Math.round(bq.x * 100) / 100, Math.round(bq.y * 100) / 100],
          px: Math.round((bq.x + 1) / 2 * 878), py: Math.round((1 - bq.y) / 2 * 1310),
          size: Math.round((corner.x - bq.x) * 439), hasMap: !!ban.material.map, vis: ban.visible, op: ban.material.opacity };
      }
      return { balloon: balloon.position.toArray().map(Math.round), cam: cam.position.toArray().map(Math.round),
        ad: adTitle, adSub: adSub, adMap: !!(balloon.userData.skin.material.map), ban: banInfo,
        ndc: [Math.round(v.x * 100) / 100, Math.round(v.y * 100) / 100], inView: inView, near: near, objs: objs.slice(0, 10), hits: hits };
    };
    this.pull = function (i) { pullStop(i == null ? st.focus : i); };
    this.flip = RD.flip; this.back = function () { RD.back(); };
    this.act = S.onAct;
    this.goto = function (i) { focusStop(i); };
    this.map = mapSheet;
  }

  var CUR = null;
  window.MinestBalloon = {
    open: function (o) { if (!window.THREE) throw new Error('three.js is not loaded'); if (CUR) CUR.close(); CUR = new Balloon(o || {}); return CUR; },
    current: function () { return CUR; },
    themes: THEMES.map(function (t) { return { id: t.id, name: t.name, icon: t.icon }; })
  };
})();

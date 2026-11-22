/* Minest · Spatial Home · Rooms 2.0 — environment "church": the Cathedral, after Notre-Dame de Paris.
   A nave of six bays under a painted rib vault (blue, sown with gold stars), round piers with leaf capitals, a pointed
   arcade, a triforium and a clerestory; an aisle each side under its own small vaults; a three-sided apse with the high
   altar; and over the west door the organ loft, the great organ in its oak case, and the rose behind it.
   · Stained glass (rooms/church-art.js): six Old Testament stories down the north aisle, six of the New down the south,
     the Crucifixion, the Resurrection and the Ascension in the apse, saints in the clerestory, the west rose.
   · Murals: a fresco at the east end of each aisle and one each side of the west door, and the painted frieze of angels
     and saints that runs the length of the triforium.
   · The aisles carry the thirty most-quoted verses (rooms/church-verses.js) on tablets at eye height: 1–15 going east
     along the south aisle, 16–30 coming back west along the north.
   · The organ console stands on the nave floor under the loft (a thing of the layout: tap it and the organ plays the
     Old Hundredth; tap again to stop).
   Every thing of Spatial Home has its place (the same anchor names as the other rooms): the writing desk in the south
   chapel, the vestment chest in the north. Light follows the time of day; candles and the coronas take over at night. */
(function (root) {
  'use strict';
  var THREE = root.THREE, SR = root.SpatialRoom, PT = SR && SR.parts, TX = root.StudyTex, ART = root.SpatialChurchArt, VERSES = root.SpatialChurchVerses;
  if (!SR || !PT || !ART || !VERSES) return;
  (root.SpatialRoomsNew = root.SpatialRoomsNew || []).push('church');
  var PI = Math.PI, W = 6.4, D = 14, NW = 3.2, T = 0.6, BAY = 3.5, SPRING = 11, NC = 1.6, H = SPRING + Math.sqrt((NW + NC) * (NW + NC) - NC * NC);
  var PIERS = [-10.5, -7, -3.5, 0, 3.5, 7, 10.5], BAYS = [-12.25, -8.75, -5.25, -1.75, 1.75, 5.25, 8.75, 12.25];
  var APSE = [[-NW, -D], [-1.6, -17], [1.6, -17], [NW, -D]];
  var rnd = (TX && TX.rng) || function (s) { return function () { s = (s * 16807) % 2147483647; return (s & 0xffffff) / 0x1000000; }; };

  function lin(h) { return new THREE.Color(h).convertSRGBToLinear(); }
  function std(o) { return new THREE.MeshStandardMaterial(o); }
  function box(g, m, x, y, z, w, h, d, ry) {
    var b = new THREE.Mesh(new THREE.BoxGeometry(w, h, d), m); b.position.set(x, y, z); if (ry) b.rotation.y = ry;
    b.castShadow = true; b.receiveShadow = true; g.add(b); return b;
  }
  function cyl(g, m, x, y, z, r0, r1, h, seg) {
    var c = new THREE.Mesh(new THREE.CylinderGeometry(r0, r1, h, seg || 20), m); c.position.set(x, y, z); c.castShadow = true; c.receiveShadow = true; g.add(c); return c;
  }
  function canvasTex(w, h, draw, rx, ry) {
    var c = document.createElement('canvas'); c.width = w; c.height = h; draw(c.getContext('2d'), w, h);
    var t = new THREE.CanvasTexture(c); t.encoding = THREE.sRGBEncoding; t.anisotropy = 8;
    if (rx) { t.wrapS = t.wrapT = THREE.RepeatWrapping; t.repeat.set(rx, ry); } return t;
  }
  /* a pointed arch of half-span a springing at y0 (the two arcs are struck from c beyond the centre line): its points, left to right */
  function archPts(a, y0, c, n) {
    var r = a + c, th = Math.acos(c / r), out = [], i, t;
    for (i = 0; i <= n; i++) { t = PI - th * i / n; out.push([c + r * Math.cos(t), y0 + r * Math.sin(t)]); }
    for (i = n - 1; i >= 0; i--) { t = th * i / n; out.push([-c + r * Math.cos(t), y0 + r * Math.sin(t)]); }
    return out;
  }
  function rise(a, c) { return Math.sqrt((a + c) * (a + c) - c * c); }
  /* a lancet w wide and h tall standing on y = 0 round x = 0 (as a Shape or a hole) */
  function lancet(w, h, c, P) {
    var s = new (P || THREE.Shape)(), pts = archPts(w / 2, h - rise(w / 2, c), c, 10), i;
    s.moveTo(-w / 2, 0); s.lineTo(w / 2, 0); for (i = pts.length - 1; i >= 0; i--) s.lineTo(pts[i][0], pts[i][1]); s.lineTo(-w / 2, 0); return s;
  }
  function moved(s, dx, dy) { var p = new THREE.Path(); s.getPoints(1).forEach(function (q, i) { if (i) p.lineTo(q.x + dx, q.y + dy); else p.moveTo(q.x + dx, q.y + dy); }); return p; }
  /* glass in a lancet: the canvas fills its bounding box */
  function lancetMesh(w, h, c, mat) {
    var ge = new THREE.ShapeGeometry(lancet(w, h, c), 10), p = ge.attributes.position, uv = ge.attributes.uv, i;
    for (i = 0; i < p.count; i++) uv.setXY(i, p.getX(i) / w + 0.5, p.getY(i) / h);
    return new THREE.Mesh(ge, mat);
  }
  /* a profile (points in x, y) swept `len` along z: a vault web seen from below */
  function sweep(pts, len) {
    var pos = [], uv = [], idx = [], n = pts.length, L = 0, i, a, ge = new THREE.BufferGeometry();
    for (i = 0; i < n; i++) { if (i) L += Math.hypot(pts[i][0] - pts[i - 1][0], pts[i][1] - pts[i - 1][1]); pos.push(pts[i][0], pts[i][1], 0, pts[i][0], pts[i][1], len); uv.push(L, 0, L, len); }
    for (i = 0; i < n - 1; i++) { a = i * 2; idx.push(a, a + 1, a + 2, a + 1, a + 3, a + 2); }
    ge.setAttribute('position', new THREE.Float32BufferAttribute(pos, 3)); ge.setAttribute('uv', new THREE.Float32BufferAttribute(uv, 2)); ge.setIndex(idx); ge.computeVertexNormals(); return ge;
  }
  /* a rib along the nave vault from z0 to z1 (z0 = z1: a transverse arch; else a diagonal) */
  function rib(g, m, a, y0, c, z0, z1, r) {
    var pts = archPts(a, y0, c, 12), cv = new THREE.Curve();
    cv.getPoint = function (t, tg) { var f = t * (pts.length - 1), i = Math.min(pts.length - 2, Math.floor(f)), k = f - i; return (tg || new THREE.Vector3()).set(pts[i][0] + (pts[i + 1][0] - pts[i][0]) * k, pts[i][1] + (pts[i + 1][1] - pts[i][1]) * k, z0 + (z1 - z0) * t); };
    var me = new THREE.Mesh(new THREE.TubeGeometry(cv, 28, r, 6, false), m); g.add(me); return me;
  }

  /* ── textures ── */
  function ashlar() {
    return canvasTex(512, 512, function (x, w, h) {
      var r = rnd(41), i, j, cw, px, rows = 8, rh = h / rows;
      x.fillStyle = '#d9cdb4'; x.fillRect(0, 0, w, h);
      for (j = 0; j < rows; j++) for (px = (j % 2) * -60; px < w; px += cw) { cw = 100 + r() * 60; var v = 205 + r() * 26; x.fillStyle = 'rgb(' + (v + 8 | 0) + ',' + (v - 2 | 0) + ',' + (v - 26 | 0) + ')'; x.fillRect(px + 1.5, j * rh + 1.5, cw - 3, rh - 3); }
      for (i = 0; i < 5000; i++) { x.fillStyle = 'rgba(' + (r() < 0.5 ? '70,58,40' : '255,250,236') + ',' + (r() * 0.06) + ')'; x.fillRect(r() * w, r() * h, 1 + r() * 3, 1 + r() * 3); }
    }, 0.42, 0.42);
  }
  function paving() {
    return canvasTex(512, 512, function (x, w, h) {
      var r = rnd(43), i, j, k, s = w / 4;
      for (i = 0; i < 4; i++) for (j = 0; j < 4; j++) {
        var dk = (i + j) % 2; x.fillStyle = dk ? '#2b2b30' : '#e4ded0'; x.fillRect(i * s, j * s, s, s);
        for (k = 0; k < 5; k++) { x.strokeStyle = dk ? 'rgba(220,220,230,' + (0.05 + r() * 0.1) + ')' : 'rgba(110,108,112,' + (0.06 + r() * 0.12) + ')'; x.lineWidth = 0.5 + r() * 1.4; x.beginPath(); var px = i * s + r() * s, py = j * s + r() * s; x.moveTo(px, py); x.bezierCurveTo(px + (r() - 0.5) * s, py + (r() - 0.5) * s, px + (r() - 0.5) * s, py + (r() - 0.5) * s, i * s + r() * s, j * s + r() * s); x.stroke(); }
        x.strokeStyle = 'rgba(40,36,30,.5)'; x.lineWidth = 1.5; x.strokeRect(i * s, j * s, s, s);
      }
    }, W, D);
  }
  /* the vault: deep blue sown with gold stars (as Viollet-le-Duc painted the chapels) */
  function heaven() {
    return canvasTex(512, 512, function (x, w, h) {
      var r = rnd(47), i, k, g = x.createLinearGradient(0, 0, w, 0); g.addColorStop(0, '#22367e'); g.addColorStop(0.5, '#1a2a68'); g.addColorStop(1, '#22367e'); x.fillStyle = g; x.fillRect(0, 0, w, h);
      for (i = 0; i < 2600; i++) { x.fillStyle = 'rgba(' + (r() < 0.5 ? '0,0,30' : '150,170,255') + ',' + (r() * 0.07) + ')'; x.fillRect(r() * w, r() * h, 2 + r() * 5, 2 + r() * 5); }
      x.fillStyle = '#e6c15a';
      for (i = 0; i < 46; i++) { var cx = r() * w, cy = r() * h, s = 4 + r() * 5; x.beginPath(); for (k = 0; k < 10; k++) { var a = k * PI / 5 - PI / 2, q = k % 2 ? s * 0.42 : s; x.lineTo(cx + Math.cos(a) * q, cy + Math.sin(a) * q); } x.fill(); }
    }, 0.4, 0.4);
  }
  function oak() {
    return canvasTex(256, 256, function (x, w, h) {
      var r = rnd(53), i; x.fillStyle = '#5a3a22'; x.fillRect(0, 0, w, h);
      for (i = 0; i < 900; i++) { x.fillStyle = 'rgba(' + (r() < 0.5 ? '20,10,4' : '170,120,70') + ',' + (0.04 + r() * 0.1) + ')'; x.fillRect(r() * w, r() * h, 1 + r() * 2, 20 + r() * 90); }
    }, 1, 1);
  }
  function glowTex() {
    return canvasTex(128, 128, function (x, w, h) { var g = x.createRadialGradient(64, 64, 4, 64, 64, 64); g.addColorStop(0, 'rgba(255,255,255,1)'); g.addColorStop(0.5, 'rgba(255,255,255,.35)'); g.addColorStop(1, 'rgba(255,255,255,0)'); x.fillStyle = g; x.fillRect(0, 0, w, h); });
  }
  function beamTex() {
    return canvasTex(64, 256, function (x, w, h) { var g = x.createLinearGradient(0, 0, 0, h); g.addColorStop(0, 'rgba(255,255,255,.9)'); g.addColorStop(1, 'rgba(255,255,255,0)'); x.fillStyle = g; x.fillRect(0, 0, w, h); var s = x.createLinearGradient(0, 0, w, 0); s.addColorStop(0, 'rgba(0,0,0,1)'); s.addColorStop(0.5, 'rgba(0,0,0,0)'); s.addColorStop(1, 'rgba(0,0,0,1)'); x.globalCompositeOperation = 'destination-out'; x.fillStyle = s; x.fillRect(0, 0, w, h); });
  }

  /* ── the organ's voice: principals in four parts through a long stone echo ── */
  var ORGAN = root.SpatialChurchOrgan = root.SpatialChurchOrgan || { playing: false };
  var HYMN = [  // the Old Hundredth (Genevan Psalter, 1551): [melody, chord root, minor?, beats]
    ['G4', 'G', 0, 2], ['G4', 'G', 0, 1], ['F#4', 'D', 0, 1], ['E4', 'E', 1, 1], ['D4', 'B', 1, 1], ['G4', 'C', 0, 1], ['A4', 'D', 0, 1], ['B4', 'G', 0, 2],
    ['B4', 'G', 0, 2], ['B4', 'G', 0, 1], ['B4', 'E', 1, 1], ['A4', 'D', 0, 1], ['G4', 'E', 1, 1], ['C5', 'C', 0, 1], ['B4', 'G', 0, 1], ['A4', 'D', 0, 2],
    ['G4', 'G', 0, 2], ['A4', 'D', 0, 1], ['B4', 'G', 0, 1], ['A4', 'D', 0, 1], ['G4', 'E', 1, 1], ['E4', 'C', 0, 1], ['F#4', 'D', 0, 1], ['G4', 'G', 0, 2],
    ['D5', 'G', 0, 2], ['B4', 'G', 0, 1], ['G4', 'E', 1, 1], ['A4', 'D', 0, 1], ['C5', 'A', 1, 1], ['B4', 'G', 0, 1], ['A4', 'D', 0, 1], ['G4', 'G', 0, 4]];
  var SEMI = { C: 0, 'C#': 1, D: 2, 'D#': 3, E: 4, F: 5, 'F#': 6, G: 7, 'G#': 8, A: 9, 'A#': 10, B: 11 };
  function hz(name, oct) { return 440 * Math.pow(2, (SEMI[name] - 9 + (oct - 4) * 12) / 12); }
  ORGAN.stop = function () { if (ORGAN.ctx) { try { ORGAN.out.gain.setTargetAtTime(0, ORGAN.ctx.currentTime, 0.25); } catch (e) {} var c = ORGAN.ctx; ORGAN.ctx = null; setTimeout(function () { try { c.close(); } catch (e) {} }, 1600); } clearTimeout(ORGAN.timer); ORGAN.playing = false; };
  ORGAN.play = function () {
    var AC = root.AudioContext || root.webkitAudioContext; if (!AC) return false; ORGAN.stop();
    var ctx = ORGAN.ctx = new AC(), out = ORGAN.out = ctx.createGain(), wet = ctx.createGain(), t = ctx.currentTime + 0.08, beat = 0.78, i;
    var wave = ctx.createPeriodicWave(new Float32Array([0, 1, 0.62, 0.38, 0.3, 0.14, 0.12, 0.06, 0.07]), new Float32Array(9));
    out.gain.value = 0.16; out.connect(ctx.destination); wet.gain.value = 0.5; out.connect(wet);
    [0.29, 0.41, 0.53].forEach(function (dt) { var d = ctx.createDelay(1), fb = ctx.createGain(), lp = ctx.createBiquadFilter(); d.delayTime.value = dt; fb.gain.value = 0.46; lp.type = 'lowpass'; lp.frequency.value = 2200; wet.connect(d); d.connect(lp); lp.connect(fb); fb.connect(d); lp.connect(ctx.destination); });
    function voice(f, t0, len, vol) { var o = ctx.createOscillator(), g = ctx.createGain(); o.setPeriodicWave(wave); o.frequency.value = f; g.gain.setValueAtTime(0, t0); g.gain.linearRampToValueAtTime(vol, t0 + 0.05); g.gain.setValueAtTime(vol, t0 + len - 0.06); g.gain.linearRampToValueAtTime(0, t0 + len + 0.08); o.connect(g); g.connect(out); o.start(t0); o.stop(t0 + len + 0.12); }
    for (i = 0; i < HYMN.length; i++) {
      var n = HYMN[i], len = n[3] * beat, root0 = SEMI[n[1]], third = (root0 + (n[2] ? 3 : 4)) % 12, fifth = (root0 + 7) % 12, names = Object.keys(SEMI);
      voice(hz(n[0].slice(0, -1), +n[0].slice(-1)), t, len, 0.9); voice(hz(n[1], 2), t, len, 0.8); voice(hz(n[1], 3), t, len, 0.45);
      voice(hz(names[third], third < 4 ? 4 : 3), t, len, 0.4); voice(hz(names[fifth], fifth < 6 ? 4 : 3), t, len, 0.4); t += len;
    }
    ORGAN.playing = true; ORGAN.timer = setTimeout(function () { ORGAN.stop(); }, (t - ctx.currentTime + 2.5) * 1000); return true;
  };
  /* the console (front: +z, where the organist sits): three manuals, stop knobs, a pedalboard, a bench */
  var SF = root.SpatialFurniture = root.SpatialFurniture || {}, CAT = root.SpatialFurnitureCatalog = root.SpatialFurnitureCatalog || [];
  SF['church-organ'] = function (T3) {
    var g = new T3.Group(), wood = new T3.MeshStandardMaterial({ color: lin(0x4a2e1a), roughness: 0.55 }), dark = new T3.MeshStandardMaterial({ color: lin(0x2a1a10), roughness: 0.6 }),
      ivory = new T3.MeshStandardMaterial({ color: lin(0xf2ead8), roughness: 0.35 }), ebony = new T3.MeshStandardMaterial({ color: lin(0x15120f), roughness: 0.4 }), brass = new T3.MeshStandardMaterial({ color: lin(0xc9a04e), roughness: 0.3, metalness: 0.85 }), i, k;
    function b(m, x, y, z, w, h, d) { var me = new T3.Mesh(new T3.BoxGeometry(w, h, d), m); me.position.set(x, y, z); me.castShadow = true; me.receiveShadow = true; g.add(me); return me; }
    b(wood, 0, 0.5, -0.3, 1.7, 1.0, 0.5); b(wood, -0.8, 0.62, 0.02, 0.1, 1.24, 0.72); b(wood, 0.8, 0.62, 0.02, 0.1, 1.24, 0.72); b(dark, 0, 1.3, -0.36, 1.7, 0.6, 0.36); b(wood, 0, 1.63, -0.3, 1.8, 0.06, 0.56);
    for (k = 0; k < 3; k++) { b(ivory, 0, 0.78 + k * 0.075, 0.2 - k * 0.13, 1.16, 0.03, 0.16); for (i = 0; i < 20; i++) b(ebony, -0.54 + i * 0.057 + (i % 7 > 2 ? 0.02 : 0), 0.8 + k * 0.075, 0.17 - k * 0.13, 0.022, 0.03, 0.09).castShadow = false; b(dark, 0, 0.745 + k * 0.075, 0.2 - k * 0.13, 1.5, 0.04, 0.17); }
    for (k = -1; k <= 1; k += 2) for (i = 0; i < 15; i++) { var kn = new T3.Mesh(new T3.CylinderGeometry(0.024, 0.024, 0.03, 10), ivory); kn.rotation.x = PI / 2; kn.position.set(k * (0.64 + (i % 3) * 0.065 - 0.065), 1.1 + Math.floor(i / 3) * 0.09, -0.16); g.add(kn); }
    b(dark, 0, 1.26, -0.12, 0.74, 0.34, 0.03).rotation.x = -0.24; b(ivory, 0, 1.25, -0.1, 0.5, 0.26, 0.012).rotation.x = -0.24;
    for (i = 0; i < 16; i++) b(i % 5 === 1 || i % 5 === 3 ? ebony : wood, -0.6 + i * 0.08, 0.06, 0.22, 0.05, 0.05, 0.62).castShadow = false; b(dark, 0, 0.02, 0.2, 1.5, 0.04, 0.8);
    b(wood, 0, 0.6, 0.82, 1.3, 0.06, 0.36); b(wood, -0.6, 0.3, 0.82, 0.06, 0.58, 0.32); b(wood, 0.6, 0.3, 0.82, 0.06, 0.58, 0.32); b(brass, 0, 1.68, -0.3, 0.3, 0.04, 0.04);
    return { group: g, hb: [1.8, 1.7, 1.6], hbZ: 0.22, place: 'floor', press: function () {
      if (ORGAN.playing) { ORGAN.stop(); return '管风琴停了 · 余音还在拱顶下'; }
      return ORGAN.play() ? '🎶 管风琴响起 · 《老百篇》Old Hundredth · 再点一下停止' : '这里放不出声音';
    } };
  };
  if (!CAT.some(function (c) { return c.id === 'church-organ'; })) CAT.push({ id: 'church-organ', name: '管风琴演奏台', en: 'Organ console', icon: '▣', place: 'floor', size: [1.8, 1.7, 1.6], note: '大教堂的管风琴 · 点一下就奏响' });

  function build(scene) {
    var holder = new THREE.Group(); holder.name = 'env-church'; scene.add(holder);
    var g = new THREE.Group(); holder.add(g);
    var i, k, s, stoneT = ashlar(), oakT = oak();
    var M = {
      stone: std({ map: stoneT, color: lin(0xfff6e6), roughness: 0.92, emissive: lin(0x6b5f4c), emissiveIntensity: 0.3 }),
      plain: std({ color: lin(0xd8ccb2), roughness: 0.9, emissive: lin(0x6b5f4c), emissiveIntensity: 0.28 }),
      floor: std({ map: paving(), roughness: 0.34, metalness: 0.05 }),
      vault: std({ map: heaven(), roughness: 0.95, side: THREE.DoubleSide, emissive: lin(0x1a2a68), emissiveIntensity: 0.35 }),
      rib: std({ color: lin(0xd9b660), roughness: 0.55, metalness: 0.35, emissive: lin(0x4a3a14), emissiveIntensity: 0.4 }),
      oak: std({ map: oakT, color: lin(0xffffff), roughness: 0.6 }), dark: std({ color: lin(0x2e1c10), roughness: 0.6 }),
      gold: std({ color: lin(0xd9b24c), roughness: 0.28, metalness: 0.9, emissive: lin(0x4a3508), emissiveIntensity: 0.5 }),
      tin: std({ color: lin(0xcfd3d6), roughness: 0.26, metalness: 0.92, emissive: lin(0x30343a), emissiveIntensity: 0.5 }),
      white: std({ color: lin(0xf4efe4), roughness: 0.8 }), red: std({ color: lin(0x8a1f24), roughness: 0.8 }), wax: std({ color: lin(0xf6efdc), roughness: 0.6, emissive: lin(0x5a4a2a), emissiveIntensity: 0.5 }),
      black: new THREE.MeshBasicMaterial({ color: 0x050508 })
    };
    var glassMats = [], lit = [];                       // glass dims with the day; the painted things keep a little light of their own
    function glassMat(tex) { var m = new THREE.MeshBasicMaterial({ map: tex, side: THREE.DoubleSide }); glassMats.push(m); return m; }
    function painted(tex) { var m = std({ map: tex, roughness: 0.9, emissive: lin(0xffffff), emissiveMap: tex, emissiveIntensity: 0.4 }); lit.push(m); return m; }
    function storyTex(id, tall) { return canvasTex(384, tall ? 1536 : 720, function (x, w, h) { ART.glass(x, w, h, id); }); }
    var saintT = [0, 1, 2, 3].map(function (q) { return canvasTex(256, 448, function (x, w, h) { ART.saint(x, w, h, q); }); });

    /* a wall from P to Q (the room is on its left-hand side walking P → Q), t thick, y1 high, with lancet holes
       [{ x (along the wall), y0, w, h, c, mat (glass in it) }] */
    function wall(P, Q, t, y1, holes, mat) {
      var dx = Q[0] - P[0], dz = Q[1] - P[1], L = Math.hypot(dx, dz), phi = Math.atan2(dz, dx), ex = -Math.sin(phi), ez = Math.cos(phi);
      var gr = new THREE.Group(); gr.position.set(P[0] - t * ex, 0, P[1] - t * ez); gr.rotation.y = -phi; g.add(gr);
      var sh = new THREE.Shape(); sh.moveTo(0, 0); sh.lineTo(L, 0); sh.lineTo(L, y1); sh.lineTo(0, y1); sh.lineTo(0, 0);
      (holes || []).forEach(function (h) {
        sh.holes.push(moved(lancet(h.w, h.h, h.c), h.x, h.y0));
        if (h.mat) { var gl = lancetMesh(h.w, h.h, h.c, h.mat); gl.position.set(h.x, h.y0, t * 0.5); gr.add(gl); }
      });
      var me = new THREE.Mesh(new THREE.ExtrudeGeometry(sh, { depth: t, bevelEnabled: false, curveSegments: 10 }), mat || M.stone); me.receiveShadow = true; me.castShadow = true; gr.add(me);
      return gr;
    }

    /* ── floor, vault ── */
    var floor = new THREE.Mesh(new THREE.PlaneGeometry(2 * W + 1, 2 * D + 0.6), M.floor); floor.rotation.x = -PI / 2; floor.receiveShadow = true; g.add(floor);
    var apseF = new THREE.Shape(); APSE.forEach(function (p, q) { if (q) apseF.lineTo(p[0], -p[1]); else apseF.moveTo(p[0], -p[1]); });
    var af = new THREE.Mesh(new THREE.ShapeGeometry(apseF), M.plain); af.rotation.x = -PI / 2; af.position.y = 0.001; g.add(af);
    var nv = new THREE.Mesh(sweep(archPts(NW, SPRING, NC, 16), 2 * D), M.vault); nv.position.z = -D; g.add(nv);
    PIERS.concat([-D + 0.1, D - 0.1]).forEach(function (z) { rib(g, M.rib, NW - 0.04, SPRING, NC, z, z, 0.1); });
    for (i = 0; i < PIERS.length - 1; i++) { rib(g, M.rib, NW - 0.04, SPRING, NC, PIERS[i], PIERS[i + 1], 0.06); rib(g, M.rib, NW - 0.04, SPRING, NC, PIERS[i + 1], PIERS[i], 0.06); }
    box(g, M.rib, 0, H - 0.07, 0, 0.14, 0.14, 2 * D).castShadow = false;
    for (i = 0; i < PIERS.length - 1; i++) { var boss = new THREE.Mesh(new THREE.SphereGeometry(0.2, 12, 8), M.gold); boss.position.set(0, H - 0.12, (PIERS[i] + PIERS[i + 1]) / 2); g.add(boss); }

    /* ── the nave walls: arcade, triforium frieze, clerestory ── */
    var AH = 4.2, clere = BAYS.map(function () { return 0; });
    [1, -1].forEach(function (sd) {                                    // sd = 1: south (x > 0)
      var holes = [];
      BAYS.forEach(function (z, q) {
        var u = sd > 0 ? z + D : D - z;
        holes.push({ x: u, y0: 0, w: 2.8, h: AH + rise(1.4, 0.6), c: 0.6 });
        holes.push({ x: u, y0: 7.75, w: 1.7, h: 3.0, c: 0.4, mat: glassMat(saintT[(q + (sd > 0 ? 0 : 2)) % 4]) });
      });
      wall(sd > 0 ? [NW, -D] : [-NW, D], sd > 0 ? [NW, D] : [-NW, -D], T, SPRING + 0.4, holes);
      var fz = painted(canvasTex(2048, 320, function (x, w, h) { ART.frieze(x, w, h); }, 4, 1)), fr = new THREE.Mesh(new THREE.PlaneGeometry(2 * D, 1.1), fz);
      fr.position.set(sd * (NW - 0.012), 6.9, 0); fr.rotation.y = -sd * PI / 2; g.add(fr);
      box(g, M.plain, sd * (NW - 0.04), 6.28, 0, 0.1, 0.12, 2 * D).castShadow = false; box(g, M.plain, sd * (NW - 0.04), 7.52, 0, 0.1, 0.12, 2 * D).castShadow = false;
      PIERS.forEach(function (z) {
        var x = sd * (NW + T / 2);
        cyl(g, M.plain, x, 0.14, z, 0.6, 0.64, 0.28, 8); cyl(g, M.stone, x, AH / 2 - 0.1, z, 0.47, 0.49, AH - 0.76, 24); cyl(g, M.plain, x, AH - 0.32, z, 0.64, 0.47, 0.34, 16); box(g, M.plain, x, AH - 0.08, z, 1.34, 0.14, 1.34);
        cyl(g, M.gold, x, AH - 0.52, z, 0.5, 0.5, 0.05, 24).castShadow = false;
        cyl(g, M.plain, sd * (NW - 0.05), (AH + SPRING) / 2, z, 0.1, 0.1, SPRING - AH, 10).castShadow = false; cyl(g, M.plain, sd * (NW - 0.05), SPRING, z, 0.2, 0.1, 0.24, 10).castShadow = false;
      });
    });

    /* ── the aisles: outer walls with the story windows, a small pointed vault to each bay, an arch across at each pier ── */
    var OT = ART.STORIES.slice(0, 6), NT = ART.STORIES.slice(6, 12), WY = 2.75, WH = 3.2, pools = [];
    [1, -1].forEach(function (sd) {
      var holes = [];
      BAYS.forEach(function (z, q) {
        var st = q >= 1 && q <= 6 ? (sd > 0 ? NT[6 - q] : OT[6 - q]) : null;            // both run west → east: Creation and the Annunciation by the door
        holes.push({ x: sd > 0 ? z + D : D - z, y0: WY, w: 1.7, h: WH, c: 0.35, mat: glassMat(st ? storyTex(st.id) : saintT[(q + sd + 4) % 4]) });
        var av = new THREE.Mesh(sweep(archPts(BAY / 2, AH, 0.7, 10), W - NW - T + 0.04), M.vault); av.rotation.y = -PI / 2; av.position.set(sd > 0 ? W + 0.02 : -NW - T + 0.02, 0, z); g.add(av);
        if (st) pools.push([sd * (W - 1.5), z, st]);
      });
      wall(sd > 0 ? [W, -D] : [-W, D], sd > 0 ? [W, D] : [-W, -D], 0.5, 7, holes);
      PIERS.forEach(function (z) {
        var ar = wall(sd > 0 ? [NW + T, z + 0.2] : [-W, z + 0.2], sd > 0 ? [W, z + 0.2] : [-NW - T, z + 0.2], 0.4, 6.7, [{ x: (W - NW - T) / 2, y0: 0, w: 2.2, h: 5.5, c: 0.5 }], M.plain);
        ar.children[0].castShadow = false;
      });
      box(g, M.plain, sd * (W - 0.04), 2.62, 0, 0.1, 0.1, 2 * D).castShadow = false; box(g, M.plain, sd * (W - 0.06), 0.3, 0, 0.14, 0.6, 2 * D).castShadow = false;
    });

    /* ── east: the chapel end walls and the three-sided apse with its tall windows ── */
    wall([-W - 0.5, -D], [-NW, -D], 0.5, 7); wall([NW, -D], [W + 0.5, -D], 0.5, 7);
    [['crucifixion', 0], ['resurrection', 1], ['ascension', 2]].forEach(function (q) {
      var P = APSE[q[1]], Q = APSE[q[1] + 1], L = Math.hypot(Q[0] - P[0], Q[1] - P[1]);
      wall(P, Q, 0.5, SPRING + 0.3, [{ x: L / 2, y0: 2.6, w: 1.75, h: 7.0, c: 0.4, mat: glassMat(storyTex(q[0], true)) }]);
      cyl(g, M.plain, P[0] * 0.985, SPRING / 2, P[1] + 0.06, 0.12, 0.12, SPRING, 10); if (q[1] === 2) cyl(g, M.plain, Q[0] * 0.985, SPRING / 2, Q[1] + 0.06, 0.12, 0.12, SPRING, 10);
    });
    (function () {                                                      // the apse vault: the nave's own profile gathered to a point over the altar
      var half = archPts(NW, SPRING, NC, 12).slice(0, 13), pos = [], uv = [], idx = [], n = half.length, a, b, ge = new THREE.BufferGeometry();
      APSE.forEach(function (c, q) { half.forEach(function (p, j) { var f = -p[0] / NW; pos.push(c[0] * f, p[1], -D + (c[1] + D) * f); uv.push(q * 3, j * 0.5); }); });
      for (a = 0; a < APSE.length - 1; a++) for (b = 0; b < n - 1; b++) { var o = a * n + b; idx.push(o, o + n, o + 1, o + 1, o + n, o + n + 1); }
      ge.setAttribute('position', new THREE.Float32BufferAttribute(pos, 3)); ge.setAttribute('uv', new THREE.Float32BufferAttribute(uv, 2)); ge.setIndex(idx); ge.computeVertexNormals(); g.add(new THREE.Mesh(ge, M.vault));
      APSE.forEach(function (c) { var pts = half.map(function (p) { var f = -p[0] / NW; return new THREE.Vector3(c[0] * f * 0.985, p[1] - 0.03, -D + (c[1] + D) * f * 0.985); }); g.add(new THREE.Mesh(new THREE.TubeGeometry(new THREE.CatmullRomCurve3(pts), 20, 0.07, 6, false), M.rib)); });
    })();
    /* the sanctuary: three steps, the high altar under its cross, six candles */
    var flames = [], flameM = new THREE.MeshBasicMaterial({ color: 0xffd98a });
    function candle(x, y, z, h, r) { cyl(g, M.wax, x, y + h / 2, z, r, r, h, 8).castShadow = false; var f = new THREE.Mesh(new THREE.SphereGeometry(r * 1.1, 8, 6), flameM); f.scale.y = 2.1; f.position.set(x, y + h + r * 2.2, z); g.add(f); flames.push(f); }
    [[2.75, -13.0, 0.12], [2.45, -13.35, 0.24], [2.15, -13.7, 0.36]].forEach(function (q) {
      var sh = new THREE.Shape(), zb = -16.9, wb = Math.min(q[0], 1.5); sh.moveTo(-q[0], -q[1]); sh.lineTo(q[0], -q[1]); sh.lineTo(q[0], D); sh.lineTo(wb, -zb); sh.lineTo(-wb, -zb); sh.lineTo(-q[0], D); sh.lineTo(-q[0], -q[1]);
      var me = new THREE.Mesh(new THREE.ExtrudeGeometry(sh, { depth: q[2], bevelEnabled: false }), q[2] > 0.3 ? M.red : M.plain); me.rotation.x = -PI / 2; me.receiveShadow = true; g.add(me);
    });
    var AZ = -15.2, AY = 0.36;
    box(g, M.plain, 0, AY + 0.5, AZ, 2.4, 1.0, 0.95); box(g, M.white, 0, AY + 1.02, AZ, 2.56, 0.05, 1.05); box(g, M.gold, 0, AY + 0.5, AZ + 0.485, 1.9, 0.72, 0.02); box(g, M.red, 0, AY + 0.5, AZ + 0.49, 0.5, 0.72, 0.02);
    box(g, M.gold, 0, AY + 1.12, AZ - 0.25, 0.5, 0.14, 0.3); box(g, M.gold, 0, AY + 1.95, AZ - 0.25, 0.09, 1.55, 0.07); box(g, M.gold, 0, AY + 2.25, AZ - 0.25, 0.8, 0.09, 0.07);
    for (i = 0; i < 6; i++) { var cx = (i < 3 ? -1.1 : 0.5) + (i % 3) * 0.3; cyl(g, M.gold, cx, AY + 1.2, AZ - 0.2, 0.03, 0.06, 0.3, 10); candle(cx, AY + 1.35, AZ - 0.2, 0.42, 0.022); }

    /* ── west: the wall with the rose, the great door, the loft and the organ ── */
    (function () {
      var gr = wall([W + 0.5, D], [-W - 0.5, D], 0.5, H + 0.4), RY = 10.7, RR = 2.55;
      var rose = new THREE.Mesh(new THREE.CircleGeometry(RR, 64), glassMat(canvasTex(1024, 1024, function (x, w) { ART.rose(x, w); }))); rose.position.set(0, RY, D - 0.03); rose.rotation.y = PI; g.add(rose);
      var rim = new THREE.Mesh(new THREE.TorusGeometry(RR + 0.06, 0.13, 10, 64), M.plain); rim.position.set(0, RY, D - 0.06); g.add(rim);
      /* the door: oak leaves in a pointed portal (the Scenic Window hangs in it, as the view out of the door) */
      var portal = new THREE.Mesh(new THREE.ExtrudeGeometry((function () { var o = lancet(3.3, 4.25, 0.5); o.holes.push(moved(lancet(2.7, 3.95, 0.45), 0, 0)); return o; })(), { depth: 0.16, bevelEnabled: false }), M.plain); portal.position.set(0, 0, D); portal.rotation.y = PI; g.add(portal);
      var door = lancetMesh(2.7, 3.95, 0.45, M.oak); door.position.set(0, 0, D - 0.02); door.rotation.y = PI; g.add(door);
      /* the loft */
      var LY = 4.45, LZ = 11.4;
      box(g, M.plain, 0, LY - 0.14, (LZ + D) / 2, 2 * NW, 0.28, D - LZ); box(g, M.plain, 0, LY - 0.5, LZ + 0.12, 2 * NW, 0.5, 0.24);
      [-1.7, 1.7].forEach(function (x) { cyl(g, M.stone, x, (LY - 0.75) / 2 + 0.1, LZ + 0.14, 0.17, 0.18, LY - 0.95, 14); cyl(g, M.plain, x, 0.1, LZ + 0.14, 0.26, 0.28, 0.2, 8); cyl(g, M.plain, x, LY - 0.82, LZ + 0.14, 0.3, 0.17, 0.2, 12); });
      var balT = canvasTex(512, 128, function (x, w, h) { x.fillStyle = '#cfc3a8'; x.fillRect(0, 0, w, h); for (var q = 0; q < 8; q++) { var cx = q * 64 + 32; x.fillStyle = '#3a3026'; [[0, -17], [17, 0], [0, 17], [-17, 0]].forEach(function (d) { x.beginPath(); x.arc(cx + d[0], 64 + d[1], 15, 0, 6.3); x.fill(); }); x.fillRect(cx - 10, 54, 20, 20); x.fillStyle = '#b8ab8e'; x.fillRect(q * 64 - 2, 0, 4, h); } x.fillStyle = '#b8ab8e'; x.fillRect(0, 0, w, 10); x.fillRect(0, h - 10, w, 10); }, 2, 1);
      box(g, std({ map: balT, roughness: 0.9, emissive: lin(0x6b5f4c), emissiveIntensity: 0.25 }), 0, LY + 0.5, LZ + 0.07, 2 * NW, 1.0, 0.14);
      /* the organ: an oak case, five towers of tin pipes with flats between, gilt shades, a small positive on the rail */
      var OZ = 13.1, BY = LY + 1.5, mouth = M.black;
      box(g, M.oak, 0, LY + 0.75, OZ, 6.0, 1.5, 1.1); box(g, M.dark, 0, BY + 0.04, OZ, 6.16, 0.1, 1.24); box(g, M.dark, 0, LY + 0.06, OZ, 6.1, 0.12, 1.2);
      for (i = 0; i < 10; i++) box(g, M.dark, -2.7 + i * 0.6, LY + 0.78, OZ - 0.56, 0.44, 1.0, 0.03).castShadow = false;
      function pipe(x, z, h, r) { cyl(g, M.tin, x, BY + 0.1 + h / 2, z, r, r * 0.92, h, 12).castShadow = false; var c = cyl(g, M.tin, x, BY + 0.1 - 0.0, z, r * 0.92, r * 0.3, 0.0001, 8); c.visible = false; box(g, mouth, x, BY + 0.36, z - r, r * 1.1, 0.07, 0.02).castShadow = false; }
      var TW = [[-2.55, 4.6], [-1.3, 3.0], [0, 2.2], [1.3, 3.0], [2.55, 4.6]];
      TW.forEach(function (tw) {
        for (k = 0; k < 5; k++) { var a = (k - 2) * 0.52; pipe(tw[0] + Math.sin(a) * 0.3, OZ - 0.3 - Math.cos(a) * 0.3, tw[1] - Math.abs(k - 2) * 0.22, 0.1); }
        cyl(g, M.oak, tw[0], BY + tw[1] + 0.34, OZ - 0.3, 0.5, 0.44, 0.34, 16); cyl(g, M.gold, tw[0], BY + tw[1] + 0.14, OZ - 0.3, 0.46, 0.46, 0.06, 16); cyl(g, M.dark, tw[0], BY + tw[1] + 0.56, OZ - 0.3, 0.3, 0.52, 0.12, 16);
        var fin = new THREE.Mesh(new THREE.ConeGeometry(0.1, 0.4, 8), M.gold); fin.position.set(tw[0], BY + tw[1] + 0.82, OZ - 0.3); g.add(fin);
        box(g, M.oak, tw[0], BY + tw[1] / 2 + 0.2, OZ + 0.1, 0.9, tw[1] + 0.4, 0.5); cyl(g, M.oak, tw[0], BY - 0.12, OZ - 0.3, 0.46, 0.3, 0.3, 16);
      });
      for (i = 0; i < 4; i++) {
        var xa = TW[i][0] + 0.5, xb = TW[i + 1][0] - 0.5, ha = TW[i][1] - 0.9, hb = TW[i + 1][1] - 0.9, n = 6;
        for (k = 0; k < n; k++) { var f = (k + 0.5) / n; pipe(xa + (xb - xa) * f, OZ - 0.42, ha + (hb - ha) * f - 0.25 * Math.sin(f * PI), 0.052); }
        var top = Math.max(ha, hb); box(g, M.oak, (xa + xb) / 2, BY + top / 2 + 0.2, OZ - 0.1, xb - xa + 0.1, top + 0.4, 0.5); box(g, M.gold, (xa + xb) / 2, BY + Math.min(ha, hb) + 0.22, OZ - 0.47, xb - xa, 0.3, 0.02).castShadow = false; box(g, M.dark, (xa + xb) / 2, BY + top + 0.44, OZ - 0.12, xb - xa + 0.2, 0.1, 0.6);
      }
      box(g, M.oak, 0, LY + 1.1, LZ + 0.42, 2.0, 0.5, 0.5); box(g, M.dark, 0, LY + 1.38, LZ + 0.42, 2.1, 0.06, 0.56);
      for (k = 0; k < 13; k++) { var ph = 0.5 + 0.5 * Math.abs(k - 6) / 6, px = -0.84 + k * 0.14, pc = cyl(g, M.tin, px, LY + 1.41 + ph / 2, LZ + 0.24, 0.045, 0.042, ph, 10); pc.castShadow = false; box(g, mouth, px, LY + 1.52, LZ + 0.195, 0.05, 0.04, 0.01).castShadow = false; }
      box(g, M.oak, 0, LY + 1.9, LZ + 0.5, 2.0, 1.1, 0.3); box(g, M.gold, 0, LY + 2.48, LZ + 0.42, 2.1, 0.07, 0.5);
    })();

    /* ── the murals ── */
    function mural(id, x, y, z, ry, w) {
      var me = new THREE.Mesh(new THREE.PlaneGeometry(w, w * 1.15), painted(canvasTex(768, 883, function (c, cw, ch) { ART.mural(c, cw, ch, id); }))); me.position.set(x, y, z); me.rotation.y = ry; g.add(me);
      var fr = box(g, M.gold, x - Math.sin(ry) * 0.012, y, z - Math.cos(ry) * 0.012, w + 0.1, w * 1.15 + 0.1, 0.02, ry); fr.castShadow = false; return me;
    }
    var CX = (NW + T + W) / 2;                                          // the middle of an aisle
    mural('shepherd', CX, 2.78, -D + 0.03, 0, 2.1); mural('sermon', -CX, 2.84, -D + 0.03, 0, 2.1);
    mural('jacob', -CX, 2.3, D - 0.03, PI, 2.0); mural('jonah', CX, 2.3, D - 0.03, PI, 2.0);

    /* ── the thirty verses: tablets down the aisle walls, 1–15 east along the south, 16–30 back west along the north ── */
    var tablets = [], SLOTS = [];
    [5.25, 1.75, -1.75, -5.25, -8.75].forEach(function (z) { [1.1, 0, -1.1].forEach(function (d) { SLOTS.push(z + d); }); });
    function tablet(tex, sd, z, n) {
      var me = new THREE.Mesh(new THREE.PlaneGeometry(1.0, 1.5), painted(tex)); me.position.set(sd * (W - 0.05), 1.66, z); me.rotation.y = -sd * PI / 2; me.name = n ? 'verse-' + n : 'verse-title'; g.add(me);
      box(g, M.dark, sd * (W - 0.025), 1.66, z, 0.04, 1.6, 1.1).castShadow = false; return me;
    }
    VERSES.forEach(function (v, q) {
      var n = q + 1, sd = q < 15 ? 1 : -1, z = q < 15 ? SLOTS[q] : SLOTS[29 - q];
      tablets.push(tablet(canvasTex(512, 768, function (x, w, h) { ART.tablet(x, w, h, n, v); }), sd, z, n));
    });
    tablet(canvasTex(512, 768, function (x, w, h) { ART.title(x, w, h, ['经文三十', 'The Thirty Verses', '最常被引用的三十节经文', '第 1–15 节 · 沿南廊向东', 'the thirty most-quoted verses', '1–15 east along this aisle, 16–30 back along the north']); }), 1, 7.7, 0);
    tablet(canvasTex(512, 768, function (x, w, h) { ART.title(x, w, h, ['经文三十', 'The Thirty Verses', '第 16–30 节 · 沿北廊向西', '和合本 · King James Version', 'verses 16–30, walking west', 'verse 1 begins across the nave, in the south aisle']); }), -1, 7.7, 0);

    /* ── the nave: oak pews either side of the middle walk, three brass coronas, the console under the loft ── */
    for (s = -1; s <= 1; s += 2) for (i = 0; i < 14; i++) {
      var pz = -8.3 + i * 1.18, px0 = s * 1.62;
      box(g, M.oak, px0, 0.43, pz, 2.1, 0.05, 0.4); box(g, M.oak, px0, 0.7, pz + 0.21, 2.1, 0.56, 0.04); box(g, M.oak, px0 - 1.06, 0.48, pz + 0.02, 0.05, 0.96, 0.5); box(g, M.oak, px0 + 1.06, 0.48, pz + 0.02, 0.05, 0.96, 0.5);
    }
    var bulbM = new THREE.MeshBasicMaterial({ color: 0xffe9c4 }), coronas = [];
    [-7, 0, 7].forEach(function (z) {
      var y = 6.0, ring = new THREE.Mesh(new THREE.TorusGeometry(0.85, 0.03, 8, 40), M.gold); ring.rotation.x = PI / 2; ring.position.set(0, y, z); g.add(ring);
      cyl(g, M.gold, 0, (y + H) / 2 + 0.4, z, 0.012, 0.012, H - y - 0.8, 6).castShadow = false;
      for (k = 0; k < 12; k++) { var a = k / 12 * 6.283; if (k % 4 === 0) { var ch = box(g, M.gold, Math.cos(a) * 0.42, y + 0.4, z + Math.sin(a) * 0.42, 0.012, 1.16, 0.012); ch.rotation.z = Math.cos(a) * 0.82; ch.rotation.x = -Math.sin(a) * 0.82; ch.castShadow = false; }
        cyl(g, M.wax, Math.cos(a) * 0.85, y + 0.09, z + Math.sin(a) * 0.85, 0.018, 0.018, 0.14, 6).castShadow = false; var bl = new THREE.Mesh(new THREE.SphereGeometry(0.035, 8, 6), bulbM); bl.position.set(Math.cos(a) * 0.85, y + 0.2, z + Math.sin(a) * 0.85); g.add(bl); }
      var pl = new THREE.PointLight(0xffd9a0, 0.5, 16, 2); pl.position.set(0, y - 0.3, z); holder.add(pl); coronas.push(pl);
    });

    /* ── the two chapels: the writing desk under the Good Shepherd (south), the vestment chest under the Sermon (north) ── */
    var ticks = [];
    function piece(kind, x, z, ry) {
      var o = null; try { o = SF[kind] && SF[kind](THREE); } catch (e) {}
      if (!o || !o.group) return null;
      o.group.position.set(x, 0, z); o.group.rotation.y = ry || 0; o.group.traverse(function (m) { if (m.isMesh) { m.castShadow = true; m.receiveShadow = true; } });
      g.add(o.group); if (typeof o.tick === 'function') ticks.push(o); return o;
    }
    var DX = CX, DZ = -13.2, top = 0.784;
    if (!piece('vic-desk', DX, DZ, 0)) { box(g, M.oak, DX, 0.39, DZ, 1.7, 0.74, 0.9); box(g, M.dark, DX, 0.77, DZ, 1.76, 0.03, 0.96); }
    if (!piece('vic-chair', DX, DZ + 0.78, PI)) { box(g, M.oak, DX, 0.44, DZ + 0.85, 0.5, 0.06, 0.5); box(g, M.oak, DX, 0.75, DZ + 1.08, 0.5, 0.66, 0.05); [[-0.21, 0.63], [0.21, 0.63], [-0.21, 1.06], [0.21, 1.06]].forEach(function (q) { box(g, M.oak, DX + q[0], 0.21, DZ + q[1], 0.05, 0.42, 0.05); }); }
    box(g, M.plain, W - 0.2, 1.02, -12.6, 0.4, 0.08, 0.9); box(g, M.plain, W - 0.12, 0.9, -12.6, 0.2, 0.18, 0.5);                       // a stone shelf in the south wall (the piscina)
    var SBX = -CX, SBZ = -D + 0.34, SBH = 0.9;
    box(g, M.oak, SBX, SBH / 2, SBZ, 2.4, SBH - 0.04, 0.56); box(g, M.dark, SBX, SBH - 0.02, SBZ, 2.48, 0.04, 0.62); box(g, M.dark, SBX, 0.05, SBZ, 2.46, 0.1, 0.6);
    for (i = 0; i < 4; i++) { box(g, M.dark, SBX - 0.9 + i * 0.6, 0.47, SBZ + 0.285, 0.5, 0.62, 0.012).castShadow = false; cyl(g, M.gold, SBX - 0.9 + i * 0.6, 0.47, SBZ + 0.3, 0.018, 0.018, 0.02, 8).rotation.x = PI / 2; }
    /* a stand of votive candles by the north chapel */
    (function (x, z) {
      box(g, M.dark, x, 0.45, z, 0.9, 0.04, 0.4); box(g, M.dark, x, 0.62, z - 0.12, 0.9, 0.04, 0.2); [[-0.4, -0.15], [0.4, -0.15], [-0.4, 0.15], [0.4, 0.15]].forEach(function (q) { cyl(g, M.dark, x + q[0], 0.22, z + q[1], 0.015, 0.015, 0.44, 6); });
      for (k = 0; k < 12; k++) candle(x - 0.36 + (k % 6) * 0.144, k < 6 ? 0.47 : 0.64, z + (k < 6 ? 0.08 : -0.12), 0.07 + (k * 7 % 5) * 0.012, 0.016);
    })(-NW - T - 0.32, -9.6);

    /* ── light ── */
    var hemi = new THREE.HemisphereLight(0xdfe6ff, 0x4a3c2c, 0.6); holder.add(hemi);
    var sun = new THREE.DirectionalLight(0xfff0d8, 0.8); sun.position.set(2.9, 10.4, 5); sun.target.position.set(-2.4, 0, -3);
    sun.castShadow = true; sun.shadow.mapSize.set(2048, 2048); var sc = sun.shadow.camera; sc.left = -15; sc.right = 15; sc.top = 9; sc.bottom = -9; sc.near = 0.3; sc.far = 24;
    sun.shadow.bias = -0.0008; sun.shadow.normalBias = 0.03; holder.add(sun); holder.add(sun.target);
    var fill = new THREE.DirectionalLight(0xbfd0ff, 0.3); fill.position.set(-3, 6, 9); fill.target.position.set(0, 3, -6); holder.add(fill); holder.add(fill.target);
    var altarL = new THREE.PointLight(0xffd9a0, 0.7, 14, 2); altarL.position.set(0, 3.2, -13.6); holder.add(altarL);
    var deskL = new THREE.PointLight(0xffe2b8, 0.45, 7, 2); deskL.position.set(DX - 0.4, 2.6, DZ + 1.0); holder.add(deskL);
    var loftL = new THREE.PointLight(0xffd9a0, 0.4, 12, 2); loftL.position.set(0, 7.4, 11.2); holder.add(loftL);
    /* coloured light on the floor under each story window, and shafts from the south clerestory */
    var glow = glowTex(), poolMs = [], beamMs = [], beamT = beamTex();
    var TINT = { creation: 0x4a6cff, eden: 0x4fd07a, noah: 0x58b8ff, moses: 0xff9a4a, david: 0xffe07a, daniel: 0xc98a4a, annunciation: 0x6a8cff, nativity: 0x5a6cff, baptism: 0x7fd0ff, loaves: 0x8fe0a0, prodigal: 0xffb04a, supper: 0xe0506a };
    pools.forEach(function (p) {
      var m = new THREE.MeshBasicMaterial({ map: glow, color: TINT[p[2].id] || 0xffffff, transparent: true, opacity: 0.3, blending: THREE.AdditiveBlending, depthWrite: false }), me = new THREE.Mesh(new THREE.PlaneGeometry(2.6, 3.0), m);
      me.rotation.x = -PI / 2; me.position.set(p[0], 0.012, p[1]); me.renderOrder = 2; g.add(me); poolMs.push(m);
    });
    BAYS.slice(1, 7).forEach(function (z, q) {
      var m = new THREE.MeshBasicMaterial({ map: beamT, color: [0xffe6b0, 0xcfe0ff, 0xffd0d8][q % 3], transparent: true, opacity: 0.1, blending: THREE.AdditiveBlending, depthWrite: false, side: THREE.DoubleSide, fog: false });
      var me = new THREE.Mesh(new THREE.PlaneGeometry(1.5, 11), m); me.position.set(0.4, 5.0, z - 0.5); me.rotation.set(0, 0.25, -0.62); me.renderOrder = 3; g.add(me); beamMs.push(m);
    });
    scene.fog = null; scene.background = new THREE.Color(0x07070c);

    var mode = 'auto', lastApply = -99, night = 0;
    function apply() {
      var Dt = SR.timeOfDay(mode), L = Dt.light, K = Dt.dusk; night = Dt.night;
      var gc = new THREE.Color(0x3a4a8a).lerp(new THREE.Color(0xffffff), L).lerp(new THREE.Color(0xffc9a0), K * 0.4).multiplyScalar(0.3 + 0.7 * L);
      glassMats.forEach(function (m) { m.color.copy(gc); });
      sun.intensity = 0.05 + 0.8 * L; sun.color.set(0xfff0d8).lerp(new THREE.Color(0xffb27a), K * 0.6); hemi.intensity = 0.22 + 0.3 * L; fill.intensity = 0.1 + 0.22 * L;
      M.stone.emissiveIntensity = 0.07 + 0.13 * L; M.plain.emissiveIntensity = 0.07 + 0.12 * L; M.vault.emissiveIntensity = 0.14 + 0.24 * L;
      lit.forEach(function (m) { m.emissiveIntensity = 0.26 + 0.16 * L; });
      poolMs.forEach(function (m) { m.opacity = 0.42 * L; }); beamMs.forEach(function (m) { m.opacity = 0.17 * L; });
      coronas.forEach(function (c) { c.intensity = 0.35 + 0.95 * night; }); altarL.intensity = 0.55 + 0.7 * night; deskL.intensity = 0.4 + 0.5 * night; bulbM.color.set(night > 0.3 ? 0xfff0cf : 0xe6d6b0);
    }
    apply();

    /* anchors: where each thing of Spatial Home goes in the Cathedral (y = the surface it stands on) */
    var anchors = {
      'desk.left': { p: [DX - 0.3, top, DZ + 0.04], ry: 0 }, 'desk.right': { p: [DX + 0.42, top, DZ + 0.1], ry: 0 },
      'desk.quill': { p: [DX - 0.66, top, DZ + 0.16], ry: 0.25 }, 'desk.mochi': { p: [DX + 0.7, top, DZ + 0.2], ry: -0.3 },
      'desk.key': { p: [DX + 0.1, top, DZ + 0.27], ry: 0.3 }, 'desk.watch': { p: [DX - 0.36, top, DZ + 0.3], ry: 0.2 },
      'desk.book': { p: [DX - 0.62, top, DZ - 0.24], ry: 0.2 },
      'sill.left': { p: [W - 0.2, 1.06, -12.6], ry: -PI / 2 },                                                           // the stone shelf in the south chapel wall
      'corner.window': { p: [-W + 0.55, 0, -11.15], ry: PI / 2 },                                                        // Octo's aquarium in the north chapel
      'wall.left': { p: [-W + 0.06, 1.75, -12.7], ry: PI / 2 },                                                          // the EC–6 board on the north chapel wall
      'cabinet.left': { p: [SBX - 0.84, SBH, SBZ], ry: 0 }, 'shelf.mid': { p: [SBX - 0.28, SBH, SBZ], ry: 0 },
      'cabinet.top': { p: [SBX + 0.28, SBH, SBZ], ry: 0 }, 'cabinet.right': { p: [SBX + 0.84, SBH, SBZ], ry: 0 },
      'wall.right': { p: [W - 0.03, 2.0, -11.2], ry: -PI / 2 },
      'floor.pack': { p: [DX - 1.05, 0, DZ + 0.35], ry: 0.45 }, 'floor.gramo': { p: [W - 0.6, 0, 11.3], ry: -PI / 2 },
      'floor.film': { p: [W - 0.75, 0, 9.3], ry: -PI / 2 }, 'floor.portal': { p: [-W + 0.4, 0, 12.3], ry: PI / 2 },
      'floor.holo': { p: [-CX, 0, 9.2], ry: PI / 2 },
      'floor.window': { p: [0, 0, D - 0.07], ry: PI, w: 2.5, h: 3.2 }                                                    // the Scenic Window: the view out of the west door
    };
    var solids = [[-2.72, -8.75, -0.52, 7.4], [0.52, -8.75, 2.72, 7.4], [-2.9, -D, 2.9, -12.9],
      [DX - 0.95, DZ - 0.5, DX + 0.95, DZ + 0.47], [DX - 0.35, DZ + 0.5, DX + 0.35, DZ + 1.0], [SBX - 1.25, -D, SBX + 1.25, SBZ + 0.34],
      [-NW - T - 0.8, -9.85, -NW - T, -9.35], [-1.9, 11.25, -1.5, 11.75], [1.5, 11.25, 1.9, 11.75]];
    PIERS.forEach(function (z) { solids.push([NW - 0.02, z - 0.5, NW + T + 0.2, z + 0.5], [-NW - T - 0.2, z - 0.5, -NW + 0.02, z + 0.5]); });

    return {
      id: 'church', name: 'The Cathedral', group: g, holder: holder, far: 120, size: { W: W, D: D, H: H }, realistic: true,
      anchors: anchors, avatar: PT.avatar, backdrop: [],
      start: { pos: [0, 1.55, 9.4], yaw: 0, pitch: 0.12 }, startV: 1,
      seat: { x: DX, z: DZ + 0.8, yaw: PI, approach: [DX - 0.75, DZ + 0.95], y: 0.46 },
      desk: { pos: [DX, 1.42, DZ + 1.06], look: [DX, 0.95, DZ - 0.3] },
      solids: solids, verses: tablets,
      /* the organ console stands under the loft, north of the door, as a thing of the layout: it plays, and it can be moved */
      defaultLayout: function () { return { extras: [{ kind: 'church-organ', title: '管风琴演奏台', p: [-2.35, 0, 12.6], ry: PI / 2, uid: 9731 }] }; },
      setTime: function (m) { mode = m || 'auto'; apply(); },
      tick: function (t, dt) {
        if (t - lastApply > 20) { lastApply = t; apply(); }
        for (var q = 0; q < flames.length; q++) { var f = flames[q], w = 0.85 + 0.2 * Math.sin(t * (7 + q % 5) + q * 1.7); f.scale.set(1, 2.1 * w, 1); }
        altarL.intensity = (0.55 + 0.7 * night) * (0.93 + 0.07 * Math.sin(t * 8.3)); loftL.intensity = ORGAN.playing ? 1.1 + 0.2 * Math.sin(t * 3) : 0.4;
        for (q = ticks.length - 1; q >= 0; q--) { try { ticks[q].tick(t, dt); } catch (e) { ticks.splice(q, 1); } }
      },
      dispose: function () { ORGAN.stop(); SR.disposeTree(holder); scene.background = null; }
    };
  }
  SR.register({ id: 'church', name: 'The Cathedral · Notre-Dame', zh: '大教堂 · 巴黎圣母院式', icon: '⛪', build: build });
})(window);

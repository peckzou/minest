/* Duo Aquarium V2 — Pet Raising's sea, in 3D, spanning the iPhone Duo's two screens when the phone stands folded.
   Both screens are windows into one tank: each gets an off-axis camera (Kooima's generalized perspective projection)
   built from the real fold angle (window.__minestHinge) and one shared eye in front of the phone, so whatever crosses
   the hinge stays continuous, as in a book nook or a glass diorama.
   Upright & half-folded: the top screen is the tank's front glass, the bottom one its floor seen from above.
   Sideways & half-folded (a book): the two screens are the two glass walls of a corner tank.
   Anywhere else (flat, the outer screen, another phone): one ordinary camera on the same tank.
   V2 brings in Pet Raising's own cast (ocean-life-v3.js): a pair of clownfish living in an anemone, blue tangs with
   yellow tails, a lionfish by the branch coral, a school of anthias and a silver bait ball far back, moon and sea-nettle
   jellyfish that swim by pulsing, a sea turtle rowing, a spotted eagle ray flapping, a puffer that inflates when tapped,
   a crab walking sideways, a hermit crab, an anglerfish with a glowing lure; kelp, sea grass and sea fans in one current.
   Fish are smooth bodies in Pet Raising's colours whose spine bends as they swim. Depth: soft shadows on the sand,
   moving caustics, marine snow, light shafts and water fog.
   Octo is Pet Raising's own (the same GLB + MinestCosmetics outfit as the Mini Pet), next to its Shell House.
   Tap the water to feed the fish, tap Octo to wave, tap the puffer. ≤30 fps; stops while hidden.
   Open: MinestAquarium.open() · #aquarium · Pet Raising ▸ 🐠 (aquarium-entry-v1.js posts to this page). */
(function () {
  'use strict';
  if (window.MinestAquarium) return;
  var T, root, renderer, scene, tank, cams = [], raf = 0, last = 0, clock, hint;
  var octo = null, mixer = null, clips = {}, fish = [], schools = [], food = [], movers = [], swayers = [], tappable = [];
  var CM_PER_PT = 0.0158;   // iPhone Duo inner screen ≈ 0.158 mm per point
  var EYE = { tall: [0, 13, 36], wide: [0, 0, 34] };   // cm, from the hinge: in front of the phone and only a little above it, so the floor glass is looked into at a slant
  var TAU = Math.PI * 2;
  function R(a, b) { return a + (b - a) * Math.random(); }
  function clamp(v, a, b) { return v < a ? a : v > b ? b : v; }
  function lerp(a, b, t) { return a + (b - a) * t; }
  function zh() { return /^zh/i.test(navigator.language || ''); }
  function hinge() { var h = window.__minestHinge; return h && typeof h.angle === 'number' ? h : null; }
  function layout() {
    var w = innerWidth, h = innerHeight, H = hinge(), Rt = document.documentElement;
    var inner = Rt.classList.contains('duo-inner') || (window.__MINEST_DUO__ && Math.min(w, h) >= 600 && Math.max(w, h) / Math.min(w, h) < 1.6);
    var folded = H && H.status === 'partial' && H.angle > 0.9 && H.angle < 2.95;
    if (!inner || !folded) return { kind: 'single' };
    return { kind: h > w ? 'tall' : 'wide', angle: H.angle };
  }

  /* ---------- materials and textures ---------- */
  function std(c, o) { return new T.MeshStandardMaterial(Object.assign({ color: c, roughness: .7, metalness: 0 }, o || {})); }
  function C(h) { return new T.Color(h); }
  function canvasTex(w, h, draw, repeat) {
    var cv = document.createElement('canvas'); cv.width = w; cv.height = h; draw(cv.getContext('2d'), w, h);
    var t = new T.CanvasTexture(cv); t.anisotropy = 4; if (repeat) { t.wrapS = t.wrapT = T.RepeatWrapping; t.repeat.set(repeat, repeat); } return t;
  }
  function noisy(geo, amt, freq) {   // smooth lumpy displacement along the normal (rocks, brain coral)
    var p = geo.attributes.position, n = new T.Vector3(), seed = R(0, 100);
    for (var i = 0; i < p.count; i++) { n.set(p.getX(i), p.getY(i), p.getZ(i)); var l = n.length() || 1; n.divideScalar(l);
      var d = (Math.sin(n.x * freq + seed) * Math.sin(n.y * freq * 1.3 + seed * .7) * Math.sin(n.z * freq * .9 + seed * 1.3)) * amt + (Math.random() - .5) * amt * .25;
      p.setXYZ(i, n.x * (l + d), n.y * (l + d), n.z * (l + d)); }
    geo.computeVertexNormals(); return geo;
  }
  function shadows(o, cast, recv) { o.traverse(function (m) { if (m.isMesh) { m.castShadow = cast; m.receiveShadow = recv; } }); return o; }

  /* ---------- fish: smooth bodies in Pet Raising's species colours, the spine bends as they swim ---------- */
  var SP = {
    clown: { L: 3.2, h: .52, w: .4, back: '#ff6a00', side: '#ff8c1a', belly: '#ffb45c', fin: '#ff9a2e', tail: '#ff9a2e', edge: '#1a0d05', fork: 0, dorsal: .3, cute: true,
      pat: function (u, v) { var b = [.2, .47, .8], wd = [.045, .055, .03]; for (var i = 0; i < 3; i++) { var d = Math.abs(u - b[i]); if (d < wd[i]) return '#ffffff'; if (d < wd[i] + .016) return '#1a0d05'; } return null; } },
    tang: { L: 5.2, h: .62, w: .3, back: '#1a3aa0', side: '#2f6fe4', belly: '#62a4f4', fin: '#2148b8', tail: '#ffd23a', edge: '#0a1632', fork: .3, dorsal: .22,
      pat: function (u, v) { if (u > .15 && u < .85 && v > -.05 && v < .7) { var ou = (u - .5) / .3, ov = (v - .32) / .2; if (ou * ou + ov * ov > 1 && ou * ou + ov * ov < 2.3) return '#0b1230'; if (u < .32 && v > .1 && v < .45) return '#0b1230'; } return null; } },
    lion: { L: 4.8, h: .46, w: .38, back: '#6a2032', side: '#c4574c', belly: '#f2d4bc', fin: '#ebbca6', tail: '#ebbca6', edge: '#6a2032', fork: 0, dorsal: .55, spiny: true,
      pat: function (u, v) { return Math.floor(u * 14) % 2 ? '#fff0e2' : null; } },
    anthias: { L: 2.4, h: .4, w: .34, back: '#c93d68', side: '#ff8a5c', belly: '#ffd8b4', fin: '#ff9a6a', tail: '#ff9a6a', edge: '#ffd890', fork: .75, dorsal: .2,
      pat: function (u, v) { return u < .32 && Math.abs(v - .05) < .07 ? '#c48cff' : null; } },
    bait: { L: 1.3, h: .32, w: .3, back: '#5c7b92', side: '#c8dce8', belly: '#eef6fb', fin: '#bcd3e0', tail: '#bcd3e0', edge: '#9ab', fork: .7, dorsal: .12, metal: .55 }
  };
  function fishGeometry(s, lite) {
    var g = new T.SphereGeometry(1, lite ? 12 : 22, lite ? 7 : 12); g.rotateZ(-Math.PI / 2);   // axis along x: x = +1 head, −1 tail
    var p = g.attributes.position, cols = [], base = [];
    for (var i = 0; i < p.count; i++) {
      var x = p.getX(i), y = p.getY(i), z = p.getZ(i), u = (1 - x) / 2;   // u: 0 head → 1 tail
      var prof = Math.pow(Math.sin(Math.PI * clamp(u * .9 + .06, 0, 1)), .75) * (1 - Math.pow(u, 6) * .75);
      prof = Math.max(prof, .09);
      var hh = s.L * s.h / 2 * prof, X = x * s.L / 2, Y = y * hh * (y < 0 ? 1.06 : 1), Z = z * hh * s.w * 1.25;
      if (u < .12) { Y *= .85 + u; }   // a blunt snout
      p.setXYZ(i, X, Y, Z); base.push(X, Y, Z);
      var v = y, c = v > .35 ? C(s.back).lerp(C(s.side), clamp((.75 - v) / .4, 0, 1)) : v > -.35 ? C(s.side) : C(s.side).lerp(C(s.belly), clamp((-.35 - v) / .4, 0, 1));
      var pc = s.pat && s.pat(u, v, z); if (pc) c = C(pc);
      cols.push(c.r, c.g, c.b);
    }
    g.setAttribute('color', new T.Float32BufferAttribute(cols, 3)); g.computeVertexNormals(); g.userData.base = base;
    return g;
  }
  function finShape(pts) { var sh = new T.Shape(); sh.moveTo(pts[0][0], pts[0][1]); for (var i = 1; i < pts.length; i++) sh.lineTo(pts[i][0], pts[i][1]); return new T.ShapeGeometry(sh); }
  function makeFish(name, size) {
    var s = SP[name], L = s.L * (size || 1), g = new T.Group(), sc = size || 1, lite = name === 'bait' || name === 'anthias';   // school fish: fewer parts, no shadow
    var bodyGeo = fishGeometry(Object.assign({}, s, { L: L }), lite);
    var body = new T.Mesh(bodyGeo, new T.MeshStandardMaterial({ vertexColors: true, roughness: .38, metalness: s.metal || .08 })); g.add(body);
    var finM = new T.MeshStandardMaterial({ color: s.fin, transparent: true, opacity: .82, side: T.DoubleSide, roughness: .5 });
    // tail fin, hinged at the peduncle
    var tl = L * .32, th = L * s.h * .42, f = s.fork;
    var tail = new T.Mesh(finShape([[0, .05 * th], [-tl, th], [-tl * (1 - f * .45), 0], [-tl, -th], [0, -.05 * th]]), new T.MeshStandardMaterial({ color: s.tail, transparent: true, opacity: .88, side: T.DoubleSide, roughness: .5 }));
    var tailPivot = new T.Group(); tailPivot.position.x = -L / 2 + L * .02; tailPivot.add(tail); g.add(tailPivot);
    // dorsal and anal fins
    var dh = L * s.h * s.dorsal;
    var dors = new T.Mesh(finShape([[L * .22, L * s.h * .3], [L * .05, L * s.h * .3 + dh], [-L * .2, L * s.h * .26 + dh * .7], [-L * .34, L * s.h * .16]]), finM); g.add(dors);
    if (!lite) { var anal = new T.Mesh(finShape([[-L * .05, -L * s.h * .3], [-L * .2, -L * s.h * .3 - dh * .6], [-L * .34, -L * s.h * .14]]), finM); g.add(anal); }
    if (s.spiny) {   // lionfish: long spines and fan-like pectorals
      for (var k = 0; k < 9; k++) { var sp = new T.Mesh(new T.CylinderGeometry(.015, .03, L * .5, 4), std(k % 2 ? '#fff0e2' : '#b04a40')); sp.position.set(L * (.25 - k * .06), L * s.h * .3 + L * .22, 0); sp.rotation.z = .25 + k * .05; g.add(sp); }
      [-1, 1].forEach(function (sd) { var fan = new T.Mesh(finShape([[0, 0], [-L * .5, L * .35], [-L * .7, 0], [-L * .5, -L * .3]]), new T.MeshStandardMaterial({ color: '#f2c7b2', transparent: true, opacity: .55, side: T.DoubleSide })); fan.position.set(L * .12, -L * .05, sd * L * s.h * s.w * .5); fan.rotation.x = sd * .6; g.add(fan); });
    }
    // pectoral fins (they flutter) and eyes
    var pecs = lite ? [] : [-1, 1].map(function (sd) { var pf = new T.Mesh(finShape([[0, 0], [-L * .16, L * .08], [-L * .2, -L * .03]]), finM); pf.position.set(L * .2, -L * .03, sd * L * s.h * s.w * .45); g.add(pf); return pf; });
    if (name !== 'bait') [-1, 1].forEach(function (sd) {
      var er = s.cute ? L * .08 : L * .055, eye = new T.Mesh(new T.SphereGeometry(er, 10, 8), new T.MeshStandardMaterial({ color: 0x08090c, roughness: .15, metalness: .3 }));
      eye.position.set(L * .34, L * s.h * .07, sd * L * s.h * s.w * .62); g.add(eye);
      if (s.cute) { var hl = new T.Mesh(new T.SphereGeometry(er * .32, 6, 5), new T.MeshBasicMaterial({ color: 0xffffff })); hl.position.copy(eye.position).add(new T.Vector3(er * .35, er * .4, sd * er * .75)); g.add(hl); }
      if (lite) return; var ring = new T.Mesh(new T.TorusGeometry(L * .058, L * .012, 5, 12), std(name === 'tang' ? '#0b1020' : '#ffc04a')); ring.position.copy(eye.position); ring.rotation.y = Math.PI / 2; g.add(ring);
    });
    if (!lite) body.castShadow = true;   // only the body throws a shadow
    g.userData = { sp: s, name: name, L: L, body: body, tail: tailPivot, pecs: pecs, phase: R(0, TAU), amp: .4, vel: new T.Vector3(R(-1, 1), 0, R(-1, 1)), target: null, retarget: 0, flee: 0, food: null, speed: { clown: 2.2, tang: 2.6, lion: 1.1, anthias: 3, bait: 3.4 }[name] * sc };
    return g;
  }
  /* the clownfish get their own little model: a short chubby body, round fins, big eyes (the general fish body made
     their bands read as a second head) */
  function roundFin(w, h, kind) {
    var sh = new T.Shape();
    if (kind === 'tail') { sh.moveTo(0, 0); sh.quadraticCurveTo(-w * .45, h * 1.05, -w, h * .7); sh.quadraticCurveTo(-w * 1.18, 0, -w, -h * .7); sh.quadraticCurveTo(-w * .45, -h * 1.05, 0, 0); }
    else if (kind === 'dorsal') { sh.moveTo(w * .5, 0); sh.quadraticCurveTo(w * .35, h * 1.3, -w * .1, h * .9); sh.quadraticCurveTo(-w * .55, h * .7, -w * .5, 0); sh.lineTo(w * .5, 0); }
    else { sh.moveTo(0, 0); sh.quadraticCurveTo(-w * .3, h, -w, h * .45); sh.quadraticCurveTo(-w * 1.05, -h * .2, 0, 0); }
    return new T.ShapeGeometry(sh, 10);
  }
  function makeClown(size) {
    var L = 1.8 * (size || 1), g = new T.Group();
    var geo = new T.SphereGeometry(1, 26, 16); geo.rotateZ(-Math.PI / 2);
    var p = geo.attributes.position, base = [], cols = [], O = C('#ff5e00'), OB = C('#e64a00'), W = C('#ffffff'), K = C('#1d0f06');
    for (var i = 0; i < p.count; i++) {
      var x = p.getX(i), y = p.getY(i), z = p.getZ(i), u = (1 - x) / 2, k = x < 0 ? 1 - Math.pow(-x, 1.6) * .55 : 1 - Math.pow(x, 3) * .12;
      var X = x * L / 2, Y = y * L * .28 * k, Z = z * L * .17 * k; p.setXYZ(i, X, Y, Z); base.push(X, Y, Z);
      var c = O.clone().lerp(OB, clamp(y, 0, 1) * .6), bands = [[.24, .05], [.52, .058], [.84, .034]];
      for (var b = 0; b < 3; b++) { var d = Math.abs(u - bands[b][0]); if (d < bands[b][1]) { c = W; break; } if (d < bands[b][1] + .016) { c = K; break; } }
      cols.push(c.r, c.g, c.b);
    }
    geo.setAttribute('color', new T.Float32BufferAttribute(cols, 3)); geo.computeVertexNormals(); geo.userData.base = base;
    var body = new T.Mesh(geo, new T.MeshStandardMaterial({ vertexColors: true, roughness: .35, metalness: .05 })); body.castShadow = true; g.add(body);
    var finM = new T.MeshStandardMaterial({ color: '#ff6a08', side: T.DoubleSide, roughness: .45 });   // opaque: no see-through fins doubling up
    var tailPivot = new T.Group(); tailPivot.position.x = -L * .47; g.add(tailPivot);
    var tail = new T.Mesh(roundFin(L * .34, L * .26, 'tail'), finM); tailPivot.add(tail);
    var dors = new T.Mesh(roundFin(L * .5, L * .16, 'dorsal'), finM); dors.position.set(-L * .02, L * .28, 0); g.add(dors);
    var anal = new T.Mesh(roundFin(L * .22, L * .1, 'dorsal'), finM); anal.rotation.z = Math.PI; anal.position.set(-L * .18, -L * .27, 0); g.add(anal);
    var pecs = [-1, 1].map(function (sd) { var pf = new T.Mesh(roundFin(L * .2, L * .12, 'pec'), finM); pf.position.set(L * .12, -L * .06, sd * L * .17); g.add(pf); return pf; });
    [-1, 1].forEach(function (sd) {
      var er = L * .1, eye = new T.Mesh(new T.SphereGeometry(er, 14, 10), new T.MeshStandardMaterial({ color: 0x0b0b10, roughness: .1, metalness: .2 })); eye.position.set(L * .3, L * .07, sd * L * .15); g.add(eye);
      var hl = new T.Mesh(new T.SphereGeometry(er * .34, 8, 6), new T.MeshBasicMaterial({ color: 0xffffff })); hl.position.copy(eye.position).add(new T.Vector3(er * .45, er * .45, sd * er * .7)); g.add(hl);
    });
    g.userData = { name: 'clown', L: L, body: body, tail: tailPivot, pecs: pecs, phase: R(0, TAU), amp: .4, vel: new T.Vector3(R(-1, 1), 0, R(-1, 1)), target: null, retarget: 0, flee: 0, food: null, speed: 1.8 * (size || 1) };
    return g;
  }
  function bendFish(f, dt, t) {   // the spine bends as a travelling wave, stronger towards the tail; the tail fin follows
    var u = f.userData, spd = u.vel.length() / u.speed, geo = u.body.geometry, p = geo.attributes.position, b = geo.userData.base, L = u.L;
    u.phase += dt * TAU * (1.6 + 2.2 * Math.min(2, spd)); u.amp += ((.18 + .22 * Math.min(1.6, spd)) - u.amp) * Math.min(1, dt * 3);
    for (var i = 0; i < p.count; i++) { var x = b[i * 3], uu = (L / 2 - x) / L, off = Math.sin(u.phase - uu * 5) * u.amp * L * .12 * uu * uu; p.setZ(i, b[i * 3 + 2] + off); }
    p.needsUpdate = true;
    u.tail.rotation.y = Math.cos(u.phase - 5) * u.amp * 1.1;
    u.pecs.forEach(function (pf, k) { pf.rotation.y = (k ? -1 : 1) * (.4 + Math.sin(t * 9 + k) * .3); });
  }

  /* ---------- the reef ---------- */
  function buildTank() {
    var g = new T.Group();
    // sand: dunes, fine grain, ripples
    var grain = canvasTex(256, 256, function (c, w, h) { c.fillStyle = '#a6875a'; c.fillRect(0, 0, w, h); for (var i = 0; i < 9000; i++) { var v = Math.random(); c.fillStyle = v < .5 ? 'rgba(120,90,50,' + R(.05, .18) + ')' : 'rgba(255,245,220,' + R(.05, .2) + ')'; c.fillRect(Math.random() * w, Math.random() * h, 1.2, 1.2); }
      c.strokeStyle = 'rgba(150,115,70,.12)'; c.lineWidth = 3; for (var y = 0; y < h; y += 18) { c.beginPath(); for (var x = 0; x <= w; x += 8) c.lineTo(x, y + Math.sin(x * .05 + y) * 4); c.stroke(); } }, 5);
    var sand = new T.PlaneGeometry(34, 30, 48, 42); sand.rotateX(-Math.PI / 2);
    var sp = sand.attributes.position; for (var i = 0; i < sp.count; i++) { var x = sp.getX(i), z = sp.getZ(i); sp.setY(i, Math.sin(x * .32) * .45 + Math.cos(z * .3 + x * .15) * .35 + Math.max(0, -z - 6) * .12); }
    sand.computeVertexNormals();
    var sandM = new T.Mesh(sand, new T.MeshStandardMaterial({ map: grain, roughness: .95 })); sandM.receiveShadow = true; g.add(sandM);
    // caustics: two layers of the same light net drifting over the sand
    var caus = canvasTex(256, 256, function (c, w, h) { var img = c.createImageData(w, h), d = img.data;
      for (var y = 0; y < h; y++) for (var x = 0; x < w; x++) { var a = x / w * TAU, b = y / h * TAU, v = Math.sin(a * 3 + Math.sin(b * 2) * 1.6) + Math.sin(b * 3 + Math.sin(a * 2.4) * 1.7) + Math.sin((a + b) * 2.2);
        var k = Math.pow(1 - Math.min(1, Math.abs(v) / 1.15), 4) * 255, j = (y * w + x) * 4; d[j] = d[j + 1] = d[j + 2] = k; d[j + 3] = 255; }
      c.putImageData(img, 0, 0); }, 3);
    [0, 1].forEach(function (k) { var cg = sand.clone(); cg.translate(0, .03 + k * .01, 0); var m = new T.Mesh(cg, new T.MeshBasicMaterial({ map: k ? caus.clone() : caus, transparent: true, opacity: .08, blending: T.AdditiveBlending, depthWrite: false })); if (k) { m.material.map.needsUpdate = true; m.material.map.repeat.set(2.3, 2.3); } m.userData.caus = k; movers.push(m); g.add(m); });
    // back wall: a dark reef wall fading into the deep
    var wall = noisy(new T.PlaneGeometry(36, 24, 36, 24), 0, 1), wp = wall.attributes.position; for (var w = 0; w < wp.count; w++) wp.setZ(w, Math.sin(wp.getX(w) * .7) * .6 + Math.cos(wp.getY(w) * .9 + wp.getX(w) * .3) * .7 + R(-.15, .15));
    wall.computeVertexNormals(); var wm = new T.Mesh(wall, std('#2d6a84', { roughness: 1 })); wm.position.set(0, 10, -13); wm.receiveShadow = true; g.add(wm);
    // rocks
    [[-7.5, -8, 2.8, '#7a7266'], [-4.5, -10, 2, '#6b655b'], [7, -7.5, 2.4, '#827a6c'], [9.5, -2.5, 1.4, '#6f685e'], [-9.6, 3, 1.2, '#7d7568'], [2.4, -10.5, 1.7, '#6a645a']].forEach(function (r) {
      var m = new T.Mesh(noisy(new T.IcosahedronGeometry(r[2], 3), r[2] * .22, 2.4), std(r[3], { roughness: .95 })); m.position.set(r[0], r[2] * .35, r[1]); m.scale.y = .72; shadows(m, true, true); g.add(m);
    });
    // brain coral, branch coral, table coral
    var brain = new T.Mesh(noisy(new T.SphereGeometry(1.6, 40, 24, 0, TAU, 0, Math.PI / 2), .12, 14), std('#c9a35a', { roughness: .8 })); brain.position.set(-.8, 0, -6.5); shadows(brain, true, true); g.add(brain);
    function branch(x, z, col, n) { var b = new T.Group(); (function grow(par, len, rad, depth) { var c = new T.Mesh(new T.CylinderGeometry(rad * .7, rad, len, 7), std(col, { roughness: .6 })); c.position.y = len / 2; par.add(c); if (depth <= 0) { var tip = new T.Mesh(new T.SphereGeometry(rad * .9, 8, 6), std(col, { emissive: col, emissiveIntensity: .12 })); tip.position.y = len; par.add(tip); return; }
      for (var k = 0; k < 2; k++) { var j = new T.Group(); j.position.y = len; j.rotation.z = R(.35, .7) * (k ? 1 : -1); j.rotation.y = R(0, TAU); par.add(j); grow(j, len * .72, rad * .72, depth - 1); } })(b, 1.4, .22, n); b.position.set(x, 0, z); shadows(b, true, true); g.add(b); return b; }
    branch(7.8, -5, '#e070a0', 2); branch(-2, -9, '#ffb060', 2); branch(4, -9.5, '#c77dff', 2);
    var table = new T.Mesh(new T.CylinderGeometry(2.4, .4, .35, 18), std('#8cbf8a')); table.position.set(-7.5, 3.2, -8); shadows(table, true, true); g.add(table);
    var stem = new T.Mesh(new T.CylinderGeometry(.35, .5, 1.2, 8), std('#7aa878')); stem.position.set(-7.5, 2.5, -8); g.add(stem);
    // sea fans (Pet Raising's two: rose and amber) — branching lace that sways
    [['#b2365a', '#e070a0', -9.5, -9, 1], ['#d27a2a', '#ffb060', 9.5, -9.5, -1]].forEach(function (f) {
      var tex = canvasTex(256, 256, function (c, w, h) { c.lineCap = 'round'; (function br(x, y, a, l, wd, d) { var x2 = x + Math.cos(a) * l, y2 = y + Math.sin(a) * l; c.strokeStyle = d > 3 ? f[0] : f[1]; c.lineWidth = wd; c.beginPath(); c.moveTo(x, y); c.lineTo(x2, y2); c.stroke(); if (d < 7) { br(x2, y2, a - R(.2, .5), l * .8, wd * .75, d + 1); br(x2, y2, a + R(.2, .5), l * .8, wd * .75, d + 1); } })(w / 2, h, -Math.PI / 2, 46, 7, 0); });
      var fan = new T.Mesh(new T.PlaneGeometry(6, 6), new T.MeshStandardMaterial({ map: tex, transparent: true, alphaTest: .3, side: T.DoubleSide, roughness: .7 }));
      fan.geometry.translate(0, 3, 0); fan.position.set(f[2], 0, f[3]); fan.rotation.y = f[4] * .4; fan.userData.sway = { a: .06, f: .7, ph: R(0, 6), base: fan.rotation.clone() }; swayers.push(fan); shadows(fan, true, false); g.add(fan);
    });
    // kelp at the back edges and sea grass at the front: blades bending with one shared current
    function blade(x, z, hgt, wd, col, segs) {
      var geo = new T.PlaneGeometry(wd, hgt, 1, segs); geo.translate(0, hgt / 2, 0);
      var m = new T.Mesh(geo, new T.MeshStandardMaterial({ color: col, side: T.DoubleSide, roughness: .6, transparent: true, opacity: .95 }));
      m.position.set(x, 0, z); m.rotation.y = R(0, TAU); m.userData.blade = { base: geo.attributes.position.array.slice(), ph: R(0, 6), h: hgt }; g.add(m); swayers.push(m);
    }
    for (var k = 0; k < 7; k++) blade(R(-12, -8) * (k % 2 ? -1 : 1), R(-12, -9), R(11, 16), R(.9, 1.4), k % 2 ? '#8a8a2e' : '#6f7a28', 12);
    for (var q = 0; q < 16; q++) blade(R(-11, 11), R(4, 8.5), R(1.2, 2.6), .14, q % 3 ? '#4f8f4a' : '#3f7d3f', 5);
    // Pet Raising's Shell House: a pearl scallop shell over a round doorway, its window lit
    var house = new T.Group(), pearl = std('#f3e6e8', { roughness: .35, metalness: .15 });
    var dome = new T.Mesh(new T.SphereGeometry(2.2, 32, 16, 0, TAU, 0, Math.PI / 2), pearl); house.add(dome);
    for (var r = 0; r < 9; r++) { var rib = new T.Mesh(new T.TorusGeometry(2.2, .09, 6, 24, Math.PI / 2), std('#e8cfd6', { roughness: .4 })); rib.rotation.y = r / 9 * Math.PI; rib.rotation.z = Math.PI / 2; house.add(rib); }
    var door = new T.Mesh(new T.CircleGeometry(.75, 24), std('#2a1c16', { roughness: 1 })); door.position.set(0, .75, 2.14); house.add(door);
    var win = new T.Mesh(new T.CircleGeometry(.32, 18), std('#ffd590', { emissive: '#ffc46d', emissiveIntensity: 1.1 })); win.position.set(-1.1, 1.3, 1.86); win.rotation.y = -.5; house.add(win);
    var glow = new T.PointLight(0xffc46d, .6, 6); glow.position.set(-1.1, 1.3, 2.4); house.add(glow);
    house.position.set(7.2, 0, 3.6); house.rotation.y = -.55; shadows(house, true, true); g.add(house);
    house.updateMatrix(); g.userData.house = { g: house, win: win, glow: glow, door: new T.Vector3(0, .75, 2.14).applyMatrix4(house.matrix), front: new T.Vector3(0, 1.4, 4.2).applyMatrix4(house.matrix), top: new T.Vector3(0, 2.4, 0).applyMatrix4(house.matrix) };
    // the anemone the clownfish live in: a column and a crown of tentacles that wave
    var anem = new T.Group(); anem.position.set(1.2, 0, 5.4); /* front and low: the lower screen has life too */ var col = new T.Mesh(new T.CylinderGeometry(.75, .95, .9, 18), std('#b9476a')); col.position.y = .45; anem.add(col);
    for (var a = 0; a < 34; a++) { var ang = a / 34 * TAU * 3.1, rr = .2 + (a / 34) * .62, tent = new T.Group(); tent.position.set(Math.cos(ang) * rr, .9, Math.sin(ang) * rr);
      var tg = new T.Mesh(new T.CylinderGeometry(.045, .075, 1.1, 5), std('#f6a7c1', { roughness: .5 })); tg.position.y = .55; tent.add(tg);
      tent.rotation.x = Math.sin(ang) * rr * .9; tent.rotation.z = -Math.cos(ang) * rr * .9; tent.userData.sway = { a: .22, f: 1.3, ph: ang, base: tent.rotation.clone() }; swayers.push(tent); anem.add(tent); }
    shadows(anem, false, true); col.castShadow = true; g.add(anem); g.userData.anemone = anem.position;
    // treasure chest
    var chest = new T.Group(), wood = std('#7a4e2b', { roughness: .85 }); var cb = new T.Mesh(new T.BoxGeometry(1.8, 1, 1.1), wood); cb.position.y = .5; chest.add(cb);
    var hingeP = new T.Group(); hingeP.position.set(0, 1, -.55); chest.add(hingeP);   // the lid opens on its back edge
    var lid = new T.Mesh(new T.CylinderGeometry(.55, .55, 1.8, 16, 1, false, 0, Math.PI), wood); lid.rotation.z = Math.PI / 2; lid.position.set(0, 0, .55); hingeP.add(lid);
    var band = std('#c9a24a', { metalness: .7, roughness: .3 }); [-.6, .6].forEach(function (bx) { var b = new T.Mesh(new T.BoxGeometry(.12, 1.02, 1.14), band); b.position.set(bx, .5, 0); chest.add(b); });
    var gold = new T.Mesh(new T.IcosahedronGeometry(.32, 1), std('#ffd34d', { emissive: '#ffb300', emissiveIntensity: .35, metalness: .8, roughness: .25 })); gold.position.set(.3, .95, .1); chest.add(gold);
    var shine = new T.PointLight(0xffc94d, 0, 7); shine.position.set(0, 1.6, .4); chest.add(shine);
    chest.position.set(-6.5, 0, 4.5); chest.rotation.y = .6; shadows(chest, true, true); g.add(chest);
    chest.updateMatrix(); g.userData.chest = { g: chest, lid: hingeP, gold: gold, shine: shine, front: new T.Vector3(.4, 2.6, 2.6).applyMatrix4(chest.matrix) };
    return g;
  }

  /* ---------- the cast ---------- */
  function jelly(kind, x, y, z, r) {
    var j = new T.Group(), moon = kind === 'moon';
    var bell = new T.Mesh(new T.SphereGeometry(r, 32, 16, 0, TAU, 0, Math.PI / 2), new T.MeshStandardMaterial({ color: moon ? '#e9e4ff' : '#ffb35c', emissive: moon ? '#8fd8ea' : '#d9672a', emissiveIntensity: .18, transparent: true, opacity: moon ? .42 : .58, roughness: .15, side: T.DoubleSide, depthWrite: false }));
    j.add(bell);
    if (moon) for (var k = 0; k < 4; k++) { var ring = new T.Mesh(new T.TorusGeometry(r * .18, r * .04, 6, 16), std('#cfc4ff', { emissive: '#b8a8ff', emissiveIntensity: .4, transparent: true, opacity: .8 })); ring.rotation.x = Math.PI / 2; ring.position.set(Math.cos(k * TAU / 4) * r * .3, r * .35, Math.sin(k * TAU / 4) * r * .3); j.add(ring); }
    var lines = [], n = moon ? 4 : 10;
    for (var t = 0; t < n; t++) {
      var pts = [], seg = moon ? 8 : 16, len = moon ? r * 1.1 : r * 3.6; for (var s = 0; s < seg; s++) pts.push(new T.Vector3(0, -s * len / seg, 0));
      var geo = new T.BufferGeometry().setFromPoints(pts), line = new T.Line(geo, new T.LineBasicMaterial({ color: moon ? '#f1ecff' : '#ffd9a8', transparent: true, opacity: .7 }));
      var a = t / n * TAU, rr = moon ? r * .2 : r * .85; line.position.set(Math.cos(a) * rr, 0, Math.sin(a) * rr); line.userData = { seg: seg, len: len, ph: R(0, 6) }; lines.push(line); j.add(line);
    }
    j.position.set(x, y, z);
    j.userData = { kind: 'jelly', bell: bell, lines: lines, r: r, phase: R(0, 1), period: moon ? R(1.9, 2.5) : R(2.4, 3.1), vy: 0, home: new T.Vector3(x, y, z) };
    return j;
  }
  function turtle() {
    var t = new T.Group(), shellTex = canvasTex(256, 256, function (c, w, h) { c.fillStyle = '#5b5a2e'; c.fillRect(0, 0, w, h); c.strokeStyle = '#2e2c14'; c.lineWidth = 6; for (var y = 0; y < 4; y++) for (var x = 0; x < 5; x++) { var cx = x * 60 + (y % 2) * 30, cy = y * 64 + 32; c.fillStyle = ['#7b6a32', '#6d5f2c', '#8a7638'][(x + y) % 3]; c.beginPath(); for (var k = 0; k < 6; k++) c.lineTo(cx + Math.cos(k / 6 * TAU) * 30, cy + Math.sin(k / 6 * TAU) * 30); c.closePath(); c.fill(); c.stroke(); } });
    var shell = new T.Mesh(new T.SphereGeometry(1, 28, 16), new T.MeshStandardMaterial({ map: shellTex, roughness: .55 })); shell.scale.set(2.2, .75, 1.7); t.add(shell);
    var skin = std('#9aa36a', { roughness: .8 }); var head = new T.Mesh(new T.SphereGeometry(.55, 16, 12), skin); head.scale.set(1.3, .9, .9); head.position.set(2.4, .1, 0); t.add(head);
    var fl = []; [[1.1, 1, 1.4], [1.1, -1, 1.4], [-1.3, 1, .8], [-1.3, -1, .8]].forEach(function (f) { var piv = new T.Group(); piv.position.set(f[0], 0, f[1] * 1.3); var m = new T.Mesh(new T.SphereGeometry(1, 12, 8), skin); m.scale.set(f[2] * .5, .1, f[2]); m.position.z = f[1] * f[2] * .8; piv.add(m); t.add(piv); fl.push({ p: piv, front: f[0] > 0, sd: f[1] }); });
    t.userData = { kind: 'turtle', flippers: fl, a: R(0, TAU) }; shadows(t, true, false); return t;
  }
  function eagleRay() {
    var spots = canvasTex(256, 256, function (c, w, h) { c.fillStyle = '#23324a'; c.fillRect(0, 0, w, h); c.fillStyle = '#e8eef7'; for (var i = 0; i < 70; i++) { c.beginPath(); c.arc(Math.random() * w, Math.random() * h, R(2, 5), 0, TAU); c.fill(); } });
    var geo = new T.PlaneGeometry(2, 2, 18, 10); geo.rotateX(-Math.PI / 2); var p = geo.attributes.position, base = [];
    for (var i = 0; i < p.count; i++) { var x = p.getX(i), z = p.getZ(i), wd = z < 0 ? Math.pow(1 + z, .7) : Math.pow(1 - z, 1.5); p.setX(i, x * wd * 3.4); p.setZ(i, z * 1.6); base.push(p.getX(i), 0, p.getZ(i)); }
    geo.computeVertexNormals(); geo.userData.base = base;
    var ray = new T.Group(), body = new T.Mesh(geo, new T.MeshStandardMaterial({ map: spots, side: T.DoubleSide, roughness: .5 })); ray.add(body);
    var tail = new T.Mesh(new T.CylinderGeometry(.02, .06, 5, 5), std('#1b2738')); tail.rotation.x = Math.PI / 2; tail.position.z = 4; ray.add(tail);
    var hd = new T.Mesh(new T.SphereGeometry(.4, 12, 8), std('#2a3a55')); hd.scale.set(1, .6, 1.4); hd.position.z = -1.6; ray.add(hd);
    ray.userData = { kind: 'ray', body: body, a: R(0, TAU) }; shadows(ray, true, false); return ray;
  }
  function puffer() {
    var tex = canvasTex(256, 128, function (c, w, h) { var g = c.createLinearGradient(0, 0, 0, h); g.addColorStop(0, '#9a7a3a'); g.addColorStop(.55, '#d9c27a'); g.addColorStop(.6, '#fbf6e4'); g.addColorStop(1, '#fbf6e4'); c.fillStyle = g; c.fillRect(0, 0, w, h); c.fillStyle = '#4a3a1a'; for (var i = 0; i < 60; i++) { var y = Math.random() * h * .55; c.beginPath(); c.arc(Math.random() * w, y, R(2, 4.5), 0, TAU); c.fill(); } });
    var pf = new T.Group(), body = new T.Mesh(new T.SphereGeometry(1, 28, 18), new T.MeshStandardMaterial({ map: tex, roughness: .45 })); body.scale.set(1.25, .95, .95); pf.add(body);
    var spines = new T.Group(); for (var i = 0; i < 46; i++) { var v = new T.Vector3(R(-1, 1), R(-1, 1), R(-1, 1)).normalize(), sp = new T.Mesh(new T.ConeGeometry(.05, .35, 4), std('#efe4c0')); sp.position.copy(v); sp.quaternion.setFromUnitVectors(new T.Vector3(0, 1, 0), v); spines.add(sp); } spines.scale.setScalar(.001); pf.add(spines);
    [-1, 1].forEach(function (sd) { var e = new T.Mesh(new T.SphereGeometry(.16, 10, 8), std('#0a0a0a', { roughness: .15 })); e.position.set(.95, .3, sd * .42); pf.add(e); });
    var tail = new T.Mesh(finShape([[0, 0], [-.6, .35], [-.6, -.35]]), new T.MeshStandardMaterial({ color: '#d9c27a', side: T.DoubleSide, transparent: true, opacity: .85 })); tail.position.x = -1.2; pf.add(tail);
    pf.position.set(-3.6, 2.4, 5.2); pf.scale.setScalar(.9);
    pf.userData = { kind: 'puffer', body: body, spines: spines, inflate: 0, tail: tail, home: pf.position.clone(), a: 0 }; shadows(pf, true, false); tappable.push(pf); return pf;
  }
  function crab() {   // a wide flat shell, eyes on stalks, two big claws in front, short thick legs tucked under the shell
    var cr = new T.Group(), red = std('#c8381a', { roughness: .45 }), dark = std('#8e2a12', { roughness: .5 }), tip = std('#2a140c', { roughness: .4 });
    var shell = new T.Mesh(new T.SphereGeometry(.7, 24, 14), red); shell.scale.set(1.0, .42, 1.35); shell.position.y = .55; cr.add(shell);
    var under = new T.Mesh(new T.SphereGeometry(.66, 18, 10, 0, TAU, Math.PI / 2, Math.PI / 2), std('#f2c6a4')); under.scale.set(1, .3, 1.3); under.position.y = .52; cr.add(under);
    function limb(par, a, b, r, m) { var d = b.clone().sub(a), mesh = new T.Mesh(new T.CylinderGeometry(r * .85, r, d.length(), 7), m || red); mesh.position.copy(a).addScaledVector(d, .5); mesh.quaternion.setFromUnitVectors(new T.Vector3(0, 1, 0), d.normalize()); mesh.scale.z = .75; par.add(mesh); var j = new T.Mesh(new T.SphereGeometry(r * 1.05, 7, 6), m || red); j.position.copy(b); par.add(j); }
    // eyes on short stalks
    [-1, 1].forEach(function (sd) { limb(cr, new T.Vector3(.55, .7, sd * .2), new T.Vector3(.68, .95, sd * .24), .04); var e = new T.Mesh(new T.SphereGeometry(.08, 10, 8), std('#111', { roughness: .15 })); e.position.set(.7, 1.0, sd * .25); cr.add(e); });
    // claws: an arm forward, a big pincer of two halves (the lower one opens and snaps)
    var claws = [-1, 1].map(function (sd) {
      var arm = new T.Group(); arm.position.set(.55, .55, sd * .55); cr.add(arm);
      limb(arm, new T.Vector3(0, 0, 0), new T.Vector3(.38, .08, sd * .22), .12, dark);
      var hand = new T.Group(); hand.position.set(.38, .08, sd * .22); arm.add(hand);
      var palm = new T.Mesh(new T.SphereGeometry(.3, 16, 12), red); palm.scale.set(1.4, .9, .75); palm.position.x = .2; hand.add(palm);
      var top = new T.Mesh(new T.ConeGeometry(.12, .45, 8), tip); top.rotation.z = -Math.PI / 2; top.position.set(.62, .07, 0); hand.add(top);
      var jaw = new T.Group(); jaw.position.set(.42, -.1, 0); hand.add(jaw); var low = new T.Mesh(new T.ConeGeometry(.09, .36, 8), tip); low.rotation.z = -Math.PI / 2; low.position.x = .17; jaw.add(low);
      return { arm: arm, jaw: jaw, sd: sd };
    });
    // four walking legs a side: short, thick, from the shell's edge down to the sand, each set a little further back
    var legs = [];
    for (var i = 0; i < 8; i++) { var sd = i < 4 ? 1 : -1, k = i % 4, piv = new T.Group(), bx = .25 - k * .24; piv.position.set(bx, .48, sd * .8); cr.add(piv);
      var knee = new T.Vector3(-.06 * k, .1, sd * .2), foot = new T.Vector3(-.14 - .06 * k, -.45, sd * .3);   // short and stout, bent back: a crab, not a spider
      limb(piv, new T.Vector3(0, 0, 0), knee, .11); limb(piv, knee, foot, .09, dark); legs.push({ p: piv, ph: k * 1.6 + (sd > 0 ? 0 : Math.PI) }); }
    cr.position.set(-.8, 0, 7.4); cr.rotation.y = Math.PI / 2; cr.scale.setScalar(.9);
    cr.userData = { kind: 'crab', legs: legs, claws: claws, x: -.8, dir: 1, walk: R(1, 2.5), rest: 0, snap: 0 }; shadows(cr, true, false); return cr;
  }
  function hermit() {
    var h = new T.Group(), shell = new T.Mesh(new T.ConeGeometry(.55, 1.4, 14, 6), std('#e7d2b0', { roughness: .5 })); var sp = shell.geometry.attributes.position; for (var i = 0; i < sp.count; i++) { var y = sp.getY(i), a = y * 4; sp.setX(i, sp.getX(i) + Math.cos(a) * .08); sp.setZ(i, sp.getZ(i) + Math.sin(a) * .08); } shell.geometry.computeVertexNormals();
    shell.rotation.z = Math.PI / 2.4; shell.position.y = .5; h.add(shell);
    var claw = new T.Mesh(new T.SphereGeometry(.18, 8, 6), std('#c8562f')); claw.position.set(.65, .3, .1); h.add(claw);
    h.position.set(-1, 0, 6); h.userData = { kind: 'hermit', a: 0 }; shadows(h, true, false); return h;
  }
  function angler() {
    var a = new T.Group(), body = new T.Mesh(new T.SphereGeometry(.9, 20, 14), std('#3a2e38', { roughness: .8 })); body.scale.set(1.3, 1, .9); a.add(body);
    var jaw = new T.Mesh(new T.SphereGeometry(.7, 16, 8, 0, TAU, Math.PI / 2, Math.PI / 2), std('#2a2028')); jaw.position.set(.6, -.1, 0); a.add(jaw);
    for (var i = 0; i < 6; i++) { var tooth = new T.Mesh(new T.ConeGeometry(.05, .22, 4), std('#f2efe6')); tooth.position.set(1.05, -.1, -.3 + i * .12); tooth.rotation.z = Math.PI; a.add(tooth); }
    var stalk = new T.Mesh(new T.CylinderGeometry(.02, .03, 1.2, 4), std('#3a2e38')); stalk.position.set(.6, 1.1, 0); stalk.rotation.z = -.6; a.add(stalk);
    var lure = new T.Mesh(new T.SphereGeometry(.13, 10, 8), new T.MeshBasicMaterial({ color: '#c8f7ff' })); lure.position.set(1.1, 1.55, 0); a.add(lure);
    var lt = new T.PointLight(0x9ff0ff, .9, 5); lt.position.copy(lure.position); a.add(lt);
    a.position.set(8, 1.2, -10); a.rotation.y = -2.3; a.userData = { kind: 'angler', lure: lure, light: lt, a: 0 }; shadows(a, true, false); return a;
  }
  function school(name, n, center, spread, size) {
    var sc = { name: name, members: [], center: center.clone(), goal: center.clone(), spread: spread, retarget: 0 };
    for (var i = 0; i < n; i++) { var f = makeFish(name, size * R(.85, 1.12)); f.position.set(center.x + R(-spread, spread), center.y + R(-spread, spread) * .5, center.z + R(-spread, spread)); sc.members.push(f); tank.add(f); }
    schools.push(sc); return sc;
  }
  function populate() {
    var an = tank.userData.anemone;
    var c1 = makeClown(1), c2 = makeClown(.82); [c1, c2].forEach(function (f, i) { var sd = i ? 1 : -1; f.position.set(an.x + sd * 1.2, 2.4, an.z); f.userData.home = { c: new T.Vector3(an.x + sd * 1.1, 2.3, an.z + sd * .3), r: .9 }; f.userData.mate = i ? c1 : c2; fish.push(f); tank.add(f); });   // each keeps to its own side
    [[-6, 6, -4, .6], [6, 8, -6, .55]].forEach(function (p) { var f = makeFish('tang', p[3]); f.position.set(p[0], p[1], p[2]); f.userData.zone = [1.6, 7]; f.userData.front = true; fish.push(f); tank.add(f); });
    var li = makeFish('lion', .6); li.position.set(7.8, 4.6, -5); li.userData.home = { c: new T.Vector3(7.5, 4.6, -5.5), r: 2.4 }; fish.push(li); tank.add(li);
    school('anthias', 5, new T.Vector3(-3, 7, -4), 2.2, 1);
    school('anthias', 3, new T.Vector3(3, 2.8, 5.5), 1.6, .85).front = true;   // a small school that stays low, in front
    school('bait', 26, new T.Vector3(3, 11.5, -10), 2.6, 1);
    var j1 = jelly('moon', -6, 9, -2, 1.1), j2 = jelly('nettle', 4.5, 10, -6.5, .95), j3 = jelly('moon', 0, 13, -11, .7); [j1, j2, j3].forEach(function (j) { movers.push(j); tank.add(j); });
    [turtle(), eagleRay(), puffer(), crab(), hermit(), angler(), gardenEel(-2.6, 7.6, 0), gardenEel(-1.4, 8.1, 2.1), upsideJelly(-5.2, 6.6), seaDragon(), littleOcto()].forEach(function (m) { movers.push(m); tank.add(m); });
    // marine snow: slow specks at every depth, the strongest depth cue there is
    var n = 420, pos = new Float32Array(n * 3); for (var i = 0; i < n; i++) { pos[i * 3] = R(-13, 13); pos[i * 3 + 1] = R(0, 18); pos[i * 3 + 2] = R(-12, 10); }
    var snowG = new T.BufferGeometry(); snowG.setAttribute('position', new T.BufferAttribute(pos, 3));
    var snow = new T.Points(snowG, new T.PointsMaterial({ color: 0xeaf6ff, size: .07, transparent: true, opacity: .55, depthWrite: false })); snow.userData.kind = 'snow'; movers.push(snow); tank.add(snow);
    // light shafts from the surface
    var shaftTex = canvasTex(8, 128, function (c, w, h) { var gr = c.createLinearGradient(0, 0, 0, h); gr.addColorStop(0, 'rgba(255,255,240,.6)'); gr.addColorStop(1, 'rgba(255,255,240,0)'); c.fillStyle = gr; c.fillRect(0, 0, w, h); });
    for (var k = 0; k < 7; k++) { var sh = new T.Mesh(new T.PlaneGeometry(R(1.2, 2.6), 26), new T.MeshBasicMaterial({ map: shaftTex, transparent: true, opacity: R(.08, .16), blending: T.AdditiveBlending, depthWrite: false, side: T.DoubleSide })); sh.position.set(-11 + k * 3.6, 12, R(-9, 4)); sh.rotation.set(0, R(0, Math.PI), .22); sh.userData = { kind: 'shaft', ph: R(0, 6), o: sh.material.opacity }; movers.push(sh); tank.add(sh); }
    // bubbles from three vents in the sand
    var bub = new T.InstancedMesh(new T.SphereGeometry(.1, 8, 6), new T.MeshStandardMaterial({ color: 0xffffff, transparent: true, opacity: .5, roughness: .05, metalness: .2 }), 45);
    bub.userData = { kind: 'bubbles', p: [] }; for (var b = 0; b < 45; b++) bub.userData.p.push({ v: [[-3.6, -2.2], [5.8, -6.5], [-8, 2]][b % 3], y: R(0, 18), s: R(.6, 1.4), sp: R(1, 1.8) });
    movers.push(bub); tank.add(bub);
  }
  /* a jointed chain: n segments, each a short tube from its joint to the next (eels, a sea dragon's body, tentacles) */
  function chain(n, seg, r0, r1, mat, axis) {
    var root = new T.Group(), joints = [], par = root;
    for (var i = 0; i < n; i++) { var j = new T.Group(); if (i) j.position.y = seg; par.add(j); var r = lerp(r0, r1, i / Math.max(1, n - 1));
      var c = new T.Mesh(new T.CylinderGeometry(lerp(r0, r1, (i + 1) / n), r, seg * 1.04, 8), mat); c.position.y = seg / 2; j.add(c); joints.push(j); par = j; }
    var tipJ = new T.Group(); tipJ.position.y = seg; par.add(tipJ);
    return { root: root, joints: joints, tip: tipJ };
  }
  /* garden eels: a body rising out of a burrow in the sand, swaying in the current; a tap and it slips back down */
  function gardenEel(x, z, ph) {
    var spots = canvasTex(64, 128, function (c, w, h) { c.fillStyle = '#f4efe2'; c.fillRect(0, 0, w, h); c.fillStyle = '#1e1a16'; for (var i = 0; i < 40; i++) { c.beginPath(); c.arc(Math.random() * w, Math.random() * h, R(1.5, 3.2), 0, TAU); c.fill(); } });
    var mat = new T.MeshStandardMaterial({ map: spots, roughness: .5 }), g = new T.Group(); g.position.set(x, 0, z);
    var hole = new T.Mesh(new T.CircleGeometry(.24, 16), new T.MeshBasicMaterial({ color: 0x2a2014 })); hole.rotation.x = -Math.PI / 2; hole.position.y = .06; g.add(hole);
    var rim = new T.Mesh(new T.TorusGeometry(.3, .07, 6, 18), std('#b89a66')); rim.rotation.x = Math.PI / 2; rim.position.y = .04; g.add(rim);
    var ch = chain(5, .24, .15, .13, mat), body = ch.root; g.add(body);   // a short peek out of the sand
    var head = new T.Mesh(new T.SphereGeometry(.19, 16, 12), mat); head.scale.set(1.05, 1.1, 1); head.position.y = .1; ch.tip.add(head);
    [-1, 1].forEach(function (sd) { var e = new T.Mesh(new T.SphereGeometry(.085, 12, 10), std('#0a0a0a', { roughness: .08 })); e.position.set(.11, .16, sd * .11); ch.tip.add(e); var hl = new T.Mesh(new T.SphereGeometry(.03, 8, 6), new T.MeshBasicMaterial({ color: 0xffffff })); hl.position.set(.17, .21, sd * .13); ch.tip.add(hl); });   // big shiny eyes
    var mouth = new T.Mesh(new T.TorusGeometry(.05, .012, 4, 10, Math.PI), std('#3a2a20')); mouth.position.set(.18, .04, 0); mouth.rotation.set(0, Math.PI / 2, Math.PI); ch.tip.add(mouth);   // a little smile
    g.userData = { kind: 'eel', ch: ch, ph: ph, out: 1, hide: 0 }; shadows(g, true, false); return g;
  }
  /* an upside-down jelly (Cassiopea): lies bell-down on the sand, frilly arms up, pulsing slowly */
  function upsideJelly(x, z) {
    var tex = canvasTex(128, 128, function (c, w, h) { c.fillStyle = '#8a7a52'; c.fillRect(0, 0, w, h); c.fillStyle = 'rgba(255,255,240,.85)'; for (var i = 0; i < 70; i++) { c.beginPath(); c.arc(Math.random() * w, Math.random() * h, R(1, 3), 0, TAU); c.fill(); } c.strokeStyle = 'rgba(60,50,30,.6)'; c.lineWidth = 2; for (var k = 0; k < 16; k++) { c.beginPath(); c.moveTo(w / 2, h / 2); c.lineTo(w / 2 + Math.cos(k / 16 * TAU) * w, h / 2 + Math.sin(k / 16 * TAU) * h); c.stroke(); } });
    var g = new T.Group(); g.position.set(x, 0, z);
    var bell = new T.Mesh(new T.SphereGeometry(.85, 28, 10, 0, TAU, Math.PI / 2, Math.PI / 2), new T.MeshStandardMaterial({ map: tex, roughness: .5 })); bell.scale.y = .28; bell.position.y = .26; g.add(bell);
    var arms = new T.Group(); arms.position.y = .3; g.add(arms);
    var lobeM = new T.MeshStandardMaterial({ map: tex, color: '#9fae7a', roughness: .6 }), tuftCols = ['#bfe6ff', '#8fd0e8', '#f2f6ff', '#6fb7c8'];
    for (var a = 0; a < 8; a++) { var arm = new T.Group(), ang = a / 8 * TAU; arm.rotation.y = ang; arms.add(arm);
      var lobe = new T.Mesh(new T.SphereGeometry(.22, 12, 8), lobeM); lobe.scale.set(1.9, .35, .8); lobe.position.set(.42, .12, 0); lobe.rotation.z = .35; arm.add(lobe);
      for (var f = 0; f < 4; f++) { var tf = new T.Mesh(new T.SphereGeometry(R(.06, .09), 8, 6), std(tuftCols[(a + f) % 4], { roughness: .4, emissive: '#3a6a80', emissiveIntensity: .12 })); tf.position.set(.55 + R(-.12, .2), .26 + R(0, .08), R(-.12, .12)); arm.add(tf); } }
    var center = new T.Mesh(new T.SphereGeometry(.2, 12, 8), std('#c9b37a')); center.scale.y = .5; center.position.y = .34; g.add(center);
    g.userData = { kind: 'cassiopea', bell: bell, arms: arms, ph: R(0, 6) }; g.scale.setScalar(1.15); shadows(g, true, true); return g;
  }
  /* a leafy sea dragon: a slender body with leafy fronds and a long snout, hovering upright-ish near the kelp */
  function seaDragon() {
    var stripes = canvasTex(32, 64, function (c, w, h) { c.fillStyle = '#d99a3a'; c.fillRect(0, 0, w, h); c.fillStyle = '#f6dc9a'; for (var y = 0; y < h; y += 10) c.fillRect(0, y, w, 3); }), body = new T.MeshStandardMaterial({ map: stripes, roughness: .55 }), leaf = new T.MeshStandardMaterial({ color: '#c9b44a', side: T.DoubleSide, roughness: .7 });
    var g = new T.Group(), ch = chain(12, .26, .14, .035, body); ch.root.rotation.z = Math.PI * .55; g.add(ch.root);   // the body runs from the head back to the tail
    var head = new T.Group(); head.position.set(.15, .05, 0); g.add(head);
    var skull = new T.Mesh(new T.SphereGeometry(.22, 14, 10), body); skull.scale.set(1.3, 1, .8); head.add(skull);
    var snout = new T.Mesh(new T.CylinderGeometry(.035, .05, .55, 6), body); snout.rotation.z = Math.PI / 2; snout.position.x = .42; head.add(snout);
    [-1, 1].forEach(function (sd) { var e = new T.Mesh(new T.SphereGeometry(.05, 8, 6), std('#1a120a', { roughness: .1 })); e.position.set(.08, .06, sd * .12); head.add(e); });
    function frond(par, y, sz, rot) { var sh = new T.Shape(); sh.moveTo(0, 0); sh.quadraticCurveTo(sz * .5, sz * .25, sz, 0); sh.quadraticCurveTo(sz * .5, -sz * .25, 0, 0); var m = new T.Mesh(new T.ShapeGeometry(sh, 6), leaf); m.position.y = y; m.rotation.set(rot[0], rot[1], rot[2]); par.add(m); return m; }
    var leaves = [];
    ch.joints.forEach(function (j, i) { j.userData.bend = i < 3 ? .12 : i < 8 ? -.1 : .22; if (i > 10) return; var sz = (i % 2 ? .6 : .9) - i * .04; leaves.push(frond(j, .1, sz, [0, 0, .8 + (i % 3) * .2]), frond(j, .1, sz * .85, [0, Math.PI, .8]), frond(j, .14, sz * .7, [Math.PI / 2, 0, -.7]), frond(j, .14, sz * .6, [-Math.PI / 2, 0, -.7])); });   // an S-curve: neck, belly, a curled tail
    frond(head, .12, .3, [0, 0, 1.6]); frond(head, .12, .3, [0, Math.PI, 1.6]);
    g.position.set(-6.2, 4, 3); g.scale.setScalar(1.35);
    g.userData = { kind: 'dragon', ch: ch, leaves: leaves, a: R(0, 6), home: g.position.clone() }; shadows(g, true, false); return g;
  }
  /* a small, real octopus (not Octo): a bumpy mantle, big eyes, eight curling arms; it creeps over the sand, and a tap
     makes it blush, puff a little ink and jet away before settling again */
  function littleOcto() {
    var skin = std('#d0663a', { roughness: .55 }), g = new T.Group();
    var mantle = new T.Mesh(noisy(new T.SphereGeometry(.42, 22, 16), .03, 9), skin); mantle.scale.set(.95, 1.2, .95); mantle.position.set(-.12, .62, 0); mantle.rotation.z = .45; g.add(mantle);
    var headM = new T.Mesh(new T.SphereGeometry(.3, 18, 14), skin); headM.position.set(.12, .32, 0); g.add(headM);
    [-1, 1].forEach(function (sd) {
      var eb = new T.Mesh(new T.SphereGeometry(.13, 14, 10), std('#f6e6c8', { roughness: .3 })); eb.position.set(.22, .42, sd * .2); g.add(eb);
      var pu = new T.Mesh(new T.BoxGeometry(.04, .05, .14), std('#111', { roughness: .1 })); pu.position.set(.33, .42, sd * .21); pu.rotation.y = sd * .5; g.add(pu);
      var hl = new T.Mesh(new T.SphereGeometry(.03, 6, 5), new T.MeshBasicMaterial({ color: 0xffffff })); hl.position.set(.34, .48, sd * .18); g.add(hl);
    });
    var arms = [];
    for (var i = 0; i < 8; i++) { var piv = new T.Group(), ang = i / 8 * TAU + .2; piv.position.set(.1 + Math.cos(ang) * .18, .2, Math.sin(ang) * .18); piv.rotation.y = -ang; piv.rotation.z = -1.85; g.add(piv);   // out and a little down, onto the sand
      var ch = chain(7, .16, .07, .018, skin); piv.add(ch.root); arms.push({ ch: ch, ph: i * .8 }); }
    g.position.set(4.2, 0, 6.6); g.scale.setScalar(.95);
    g.userData = { kind: 'littleocto', arms: arms, skin: skin, a: R(0, 6), x: 4.2, z: 6.6, jet: 0, blush: 0, target: null }; shadows(g, true, false); return g;
  }
  function loadOcto() {
    if (!T.GLTFLoader) return;
    var A = window.minestPetAsset || function (p) { return p; };
    var urls = [A('octopus-pet-raising-v6/models/avatar_web_rigged_v23j.glb'), A('octopus-pet-raising-v6/models/avatar_web_rigged_v23.glb'), A('avatar_web_rigged_v23.glb')];
    (function next(i) {
      if (i >= urls.length) return;
      new T.GLTFLoader().load(urls[i], function (g) {
        if (!scene) return;
        octo = g.scene; octo.scale.setScalar(2.1); shadows(octo, true, false); tank.add(octo);
        try { if (window.MinestCosmetics && MinestCosmetics.watchModel) MinestCosmetics.watchModel(octo, T); } catch (e) {}
        mixer = new T.AnimationMixer(octo); (g.animations || []).forEach(function (c) { clips[c.name] = c; });
        if (clips.idle) mixer.clipAction(clips.idle).play();
        mixer.addEventListener('finished', function () { if (clips.idle) { mixer.stopAllAction(); mixer.clipAction(clips.idle).play(); } });
      }, undefined, function () { next(i + 1); });
    })(0);
  }

  /* ---------- cameras: one window per screen ---------- */
  function V(x, y, z) { return new T.Vector3(x, y, z); }
  function offAxis(cam, pa, pb, pc, pe) {   // Kooima: screen corners lower-left, lower-right, upper-left; eye
    var vr = pb.clone().sub(pa).normalize(), vu = pc.clone().sub(pa).normalize(), vn = vr.clone().cross(vu).normalize();
    var va = pa.clone().sub(pe), vb = pb.clone().sub(pe), vc = pc.clone().sub(pe), d = -va.dot(vn), n = .5, f = 200;
    var l = vr.dot(va) * n / d, r = vr.dot(vb) * n / d, b = vu.dot(va) * n / d, t = vu.dot(vc) * n / d;
    cam.projectionMatrix.makePerspective(l, r, t, b, n, f); cam.projectionMatrixInverse.copy(cam.projectionMatrix).invert();
    cam.position.copy(pe); cam.quaternion.setFromRotationMatrix(new T.Matrix4().makeBasis(vr, vu, vn)); cam.updateMatrixWorld(true);
  }
  // Folded or not, one camera draws one continuous picture over both screens: the per-screen windows (offAxis, kept
  // below) were only right for one assumed eye position, so anything crossing the hinge looked broken, like refraction.
  var SPLIT_WINDOWS = false;
  function setupCams() {
    var L = layout(), w = innerWidth, h = innerHeight;
    cams = [];
    if (L.kind === 'single' || !SPLIT_WINDOWS) {
      var c = new T.PerspectiveCamera(w > h ? 46 : 60, w / h, .5, 200); c.position.set(0, w > h ? 8 : 9.5, w > h ? 24 : 24); c.lookAt(0, w > h ? 5 : 5.4, -1);   // a slanted look into the tank, not from above
      cams.push({ cam: c, vp: [0, 0, w, h] }); eyeW = c.position.clone();
      tank.position.set(0, 0, 0); tank.scale.setScalar(1);
    } else if (L.kind === 'tall') {
      // hinge = x axis; bottom screen flat towards the viewer (+z), top screen rising at the fold angle θ
      var W = w * CM_PER_PT, Hh = h / 2 * CM_PER_PT, th = L.angle, up = V(0, Math.sin(th), Math.cos(th)), pe = V(EYE.tall[0], EYE.tall[1], EYE.tall[2]);
      var top = new T.PerspectiveCamera(), bot = new T.PerspectiveCamera();
      offAxis(top, V(-W / 2, 0, 0), V(W / 2, 0, 0), up.clone().multiplyScalar(Hh).add(V(-W / 2, 0, 0)), pe);
      offAxis(bot, V(-W / 2, 0, Hh), V(W / 2, 0, Hh), V(-W / 2, 0, 0), pe);
      cams.push({ cam: top, vp: [0, h / 2, w, h / 2], ex: 1.1, water: 0x2a7a98 }, { cam: bot, vp: [0, 0, w, h / 2], ex: .4 }); eyeW = pe.clone();   // the floor glass looks at sunlit sand: less exposure there, so both screens match
      // the tank sits under the floor glass and behind the front glass: its sand a few cm down, its back wall behind the hinge
      tank.position.set(0, -3, -3); tank.scale.setScalar(.45);   // sand ~3 cm under the floor glass, the back wall behind the hinge: the slanted view sees front to back
    } else {
      // book: hinge = y axis, both screens upright, each turned towards the viewer by (π − θ) / 2
      var Ww = w / 2 * CM_PER_PT, Hv = h * CM_PER_PT, a = (Math.PI - L.angle) / 2, dl = V(-Math.cos(a), 0, Math.sin(a)), dr = V(Math.cos(a), 0, Math.sin(a)), pe2 = V(EYE.wide[0], Hv / 2 + EYE.wide[1], EYE.wide[2]);
      var lc = new T.PerspectiveCamera(), rc = new T.PerspectiveCamera(), outL = dl.clone().multiplyScalar(Ww), outR = dr.clone().multiplyScalar(Ww);
      offAxis(lc, outL, V(0, 0, 0), outL.clone().add(V(0, Hv, 0)), pe2);
      offAxis(rc, V(0, 0, 0), outR, V(0, Hv, 0), pe2);
      cams.push({ cam: lc, vp: [0, 0, w / 2, h] }, { cam: rc, vp: [w / 2, 0, w / 2, h] }); eyeW = pe2.clone();
      tank.position.set(0, .4, -9); tank.scale.setScalar(.55);
    }
    hint.hidden = L.kind !== 'single' || (!window.__MINEST_DUO__ && !document.documentElement.classList.contains('duo'));
    if (!SPLIT_WINDOWS) hint.hidden = true;
  }

  /* ---------- life ---------- */
  var waveUntil = 0, eyeW = null;
  function steer(f, goal, dt, speed, agility) {
    var u = f.userData, d = new T.Vector3().subVectors(goal, f.position), dist = d.length();
    var want = d.normalize().multiplyScalar(speed * Math.max(.35, Math.min(1, dist / (u.L * 2.5))));
    u.vel.lerp(want, Math.min(1, agility * dt));
    f.position.addScaledVector(u.vel, dt);
    // keep inside the tank: above the sand, below the surface, within the walls
    f.position.x = clamp(f.position.x, -11.5, 11.5); f.position.z = clamp(f.position.z, -11.5, 8.5); f.position.y = clamp(f.position.y, .9, 15.5);
    if (u.vel.lengthSq() > 1e-4) { var yaw = Math.atan2(-u.vel.z, u.vel.x), pitch = clamp(Math.atan2(u.vel.y, Math.hypot(u.vel.x, u.vel.z)), -.5, .5);
      f.rotation.y += ((((yaw - f.rotation.y) % TAU) + TAU * 1.5) % TAU - Math.PI) * Math.min(1, dt * 4); f.rotation.z += (pitch - f.rotation.z) * Math.min(1, dt * 3); }
  }
  function lifeFish(f, dt, t) {
    var u = f.userData, sp = u.speed * (u.flee > 0 ? 2.6 : 1) * (.8 + .4 * Math.sin(t * .3 + u.phase));
    if (u.flee > 0) u.flee -= dt;
    var goal;
    if (u.food && u.food.parent) { goal = u.food.position; if (f.position.distanceTo(goal) < u.L * .5) { u.food.parent.remove(u.food); u.food = null; } sp *= 1.5; }
    else {
      u.food = null; u.retarget -= dt;
      if (!u.target || u.retarget <= 0 || f.position.distanceTo(u.target) < u.L * 1.2) {
        if (u.home) { var a = R(0, TAU), r = R(.3, 1) * u.home.r; u.target = u.home.c.clone().add(new T.Vector3(Math.cos(a) * r, R(-.4, .6) * u.home.r * .5, Math.sin(a) * r)); u.retarget = R(2, 4.5); }
        else { var z = u.zone || [3, 12]; u.target = new T.Vector3(R(-9, 9), R(z[0], z[1]), u.front ? R(0, 7.5) : R(-9, 6)); u.retarget = R(5, 10); }
      }
      goal = u.target;
    }
    if (u.mate) { var gap = f.position.distanceTo(u.mate.position), need = (u.L + u.mate.userData.L) * .9; if (gap < need) { goal = goal.clone().add(new T.Vector3().subVectors(f.position, u.mate.position).normalize().multiplyScalar((need - gap) * 4 + .5)); } }   // never on top of each other
    steer(f, goal, dt, sp, u.flee > 0 ? 4 : u.home ? 2 : 1.2);
    bendFish(f, dt, t);
  }
  function lifeSchool(sc, dt, t) {   // boids-lite: follow a moving goal, keep together, keep apart, all turn as one
    sc.retarget -= dt;
    if (sc.retarget <= 0 || sc.center.distanceTo(sc.goal) < 1.5) { sc.low = !sc.low; sc.goal.set(R(-8, 8), sc.name === 'bait' ? R(9, 14) : sc.front ? R(1.6, 4) : sc.low ? R(2, 5) : R(5, 10), sc.name === 'bait' ? R(-11, -7) : sc.front ? R(3, 7.5) : sc.low ? R(1, 6.5) : R(-8, 1)); sc.retarget = R(6, 12); }   // the anthias take turns low and front
    var cen = new T.Vector3(); sc.members.forEach(function (m) { cen.add(m.position); }); cen.divideScalar(sc.members.length); sc.center.copy(cen);
    sc.members.forEach(function (m, i) {
      var u = m.userData, g = sc.goal.clone().add(new T.Vector3(Math.sin(i * 2.1 + t * .4) * sc.spread * .6, Math.cos(i * 1.7 + t * .5) * sc.spread * .3, Math.cos(i * 1.3) * sc.spread * .6));
      if (u.food && u.food.parent) g = u.food.position.clone(); else u.food = null;
      sc.members.forEach(function (o) { if (o === m) return; var d = m.position.distanceTo(o.position); if (d < u.L * 1.1) g.add(new T.Vector3().subVectors(m.position, o.position).multiplyScalar(2)); });
      if (u.flee > 0) u.flee -= dt;
      steer(m, g, dt, u.speed * (u.flee > 0 ? 2.4 : 1), u.flee > 0 ? 4 : 1.6); bendFish(m, dt, t);
    });
  }
  function lifeOther(m, dt, t) {
    var u = m.userData;
    if (u.caus !== undefined) { var mp = m.material.map; mp.offset.x = (t * (u.caus ? .012 : -.009)) % 1; mp.offset.y = (t * (u.caus ? .007 : .011)) % 1; return; }
    if (u.kind === 'snow') { var p = m.geometry.attributes.position; for (var i = 0; i < p.count; i++) { var y = p.getY(i) - dt * .12; if (y < 0) y = 18; p.setY(i, y); p.setX(i, p.getX(i) + Math.sin(t * .3 + i) * dt * .05); } p.needsUpdate = true; return; }
    if (u.kind === 'shaft') { m.material.opacity = u.o * (.65 + .35 * Math.sin(t * .4 + u.ph)); return; }
    if (u.kind === 'bubbles') { var mx = new T.Matrix4(); u.p.forEach(function (b, i) { b.y += dt * b.sp; if (b.y > 18) b.y = 0; mx.makeScale(b.s, b.s, b.s).setPosition(b.v[0] + Math.sin(t * 2.2 + i) * .18, b.y, b.v[1] + Math.cos(t * 1.9 + i) * .18); m.setMatrixAt(i, mx); }); m.instanceMatrix.needsUpdate = true; return; }
    if (u.kind === 'jelly') {   // pulse: a quick contraction pushes it up, a slow relaxation lets it sink; tentacles trail
      u.phase += dt / u.period; if (u.phase >= 1) u.phase -= 1;
      var c = u.phase < .3 ? Math.sin(u.phase / .3 * Math.PI / 2) : 1 - (u.phase - .3) / .7, sq = 1 - .18 * c;
      u.bell.scale.set(sq, 1 + .12 * c, sq); if (u.phase < .3) u.vy += dt * 1.6; u.vy *= .985; u.vy -= dt * .25;
      m.position.y = clamp(m.position.y + u.vy * dt, 4, 15); m.position.x = u.home.x + Math.sin(t * .1 + u.home.z) * 2; m.position.z = u.home.z + Math.cos(t * .08 + u.home.x) * 1.5;
      u.lines.forEach(function (ln) { var a = ln.geometry.attributes.position, d = ln.userData; for (var s = 0; s < d.seg; s++) { var k = s / d.seg; a.setXYZ(s, Math.sin(t * 1.4 + d.ph + k * 3) * k * u.r * .5, -k * d.len * (1 - c * .15), Math.cos(t * 1.1 + d.ph + k * 2.6) * k * u.r * .4); } a.needsUpdate = true; });
      return;
    }
    if (u.kind === 'turtle') {   // a wide slow loop high in the tank, rowing with the front flippers
      u.a += dt * .07; var x = Math.cos(u.a) * 9, z = Math.sin(u.a) * 6 - 3, y = 12 + Math.sin(u.a * 2) * 1.2; m.position.set(x, y, z); m.rotation.y = -u.a - Math.PI / 2 + Math.PI; m.rotation.z = Math.sin(t * .8) * .05;
      u.flippers.forEach(function (f) { var s = Math.sin(t * 1.6 + (f.front ? 0 : 1.2)); f.p.rotation.x = f.sd * (f.front ? .2 + s * .55 : .1 + s * .2); f.p.rotation.y = f.front ? s * .3 : 0; });
      m.scale.setScalar(.85); return;
    }
    if (u.kind === 'ray') {   // a long figure-eight; a wave runs out to the wing tips
      u.a += dt * .09; var rx = Math.sin(u.a) * 10, rz = Math.sin(u.a * 2) * 5 - 5, ry = 9.5 + Math.sin(u.a * 3) * 1.2; var pr = m.position.clone(); m.position.set(rx, ry, rz);
      var dv = m.position.clone().sub(pr); if (dv.lengthSq() > 1e-6) m.rotation.y = Math.atan2(-dv.x, -dv.z);
      var geo = u.body.geometry, p2 = geo.attributes.position, bs = geo.userData.base; for (var q = 0; q < p2.count; q++) { var bx = bs[q * 3], ax = Math.abs(bx); p2.setY(q, Math.sin(t * 2.2 - ax * .9) * Math.pow(ax / 3.4, 1.5) * 1.1); } p2.needsUpdate = true;
      m.scale.setScalar(.8); return;
    }
    if (u.kind === 'puffer') {   // hovers on fluttering fins near its coral; puffs up when tapped
      u.a += dt; m.position.set(u.home.x + Math.sin(u.a * .4) * 1.5, u.home.y + Math.sin(u.a * .9) * .4, u.home.z + Math.cos(u.a * .3) * 1.2); m.rotation.y = Math.sin(u.a * .4) > 0 ? .4 : Math.PI - .4;
      if (u.puffT > 0) { u.puffT -= dt; u.inflate = Math.min(1, u.inflate + dt * 3.5); } else u.inflate = Math.max(0, u.inflate - dt * .22);   // puffs up fast, holds, lets the water out slowly
      var e = u.inflate * u.inflate * (3 - 2 * u.inflate), k = 1 + e * .95; u.body.scale.set(lerp(1.25, 1, e) * k, lerp(.95, 1, e) * k, lerp(.95, 1, e) * k); u.spines.scale.setScalar(Math.max(.001, e) * k * 1.04);
      u.tail.rotation.y = Math.sin(t * (u.inflate > .1 ? 16 : 8)) * .5; m.position.y += Math.sin(t * 3) * e * .15; return;
    }
    if (u.kind === 'crab') {   // scuttles sideways in short bursts between the chest and the house, pauses, waves a claw
      var moving = u.walk > 0;
      if (moving) { u.walk -= dt; u.x += u.dir * dt * 1.6; if (u.x > 3 || u.x < -4.6) { u.dir *= -1; u.x = clamp(u.x, -4.6, 3); } if (u.walk <= 0) u.rest = R(.8, 2.2); }
      else { u.rest -= dt; if (u.rest <= 0) { u.walk = R(.8, 2.4); if (Math.random() < .45) u.dir *= -1; } }
      m.position.set(u.x, moving ? Math.abs(Math.sin(t * 18)) * .04 : 0, 7.4);
      u.legs.forEach(function (l) { var ph = t * 14 + l.ph; l.p.rotation.x = moving ? Math.sin(ph) * .32 : 0; l.p.rotation.y = moving ? Math.cos(ph) * .18 : 0; });
      u.claws.forEach(function (c, i) { var wave = !moving && i === 0 ? Math.sin(t * 3) * .35 : 0; c.arm.rotation.z = .15 + wave; c.jaw.rotation.z = -Math.abs(Math.sin(t * (moving ? 2 : 6) + i)) * .5; });
      return;
    }
    if (u.kind === 'eel') {   // sways out of its burrow; slips down when startled, peeks back up after a while
      if (u.hide > 0) { u.hide -= dt; u.out = Math.max(0, u.out - dt * 3); } else u.out = Math.min(1, u.out + dt * .35);
      u.ch.root.position.y = -1.4 * (1 - u.out); u.ch.tip.rotation.z = .25 + Math.sin(t * .7 + u.ph) * .2;   // the head tilts, curious
      u.ch.joints.forEach(function (j, i) { var k = i / u.ch.joints.length; j.rotation.z = Math.sin(t * 1.1 + u.ph + i * .45) * .1 * (.4 + k); j.rotation.x = Math.cos(t * .8 + u.ph + i * .3) * .06 * k + (i > 2 ? -.22 : 0); });
      return;
    }
    if (u.kind === 'cassiopea') { var pz = 1 + Math.sin(t * 1.4 + u.ph) * .06; u.bell.scale.set(pz, .28 / pz, pz); u.arms.rotation.y = Math.sin(t * .3 + u.ph) * .2; u.arms.children.forEach(function (a, i) { a.rotation.z = Math.sin(t * 1.4 + u.ph + i) * .08; }); return; }
    if (u.kind === 'dragon') {   // drifts slowly near the kelp, the body gently undulating, fronds trembling
      u.a += dt * .12; m.position.set(u.home.x + Math.sin(u.a) * 1.6, u.home.y + Math.sin(u.a * 1.7) * .6, u.home.z + Math.cos(u.a * .8) * 1.2); m.rotation.y = Math.cos(u.a) > 0 ? 0 : Math.PI;
      u.ch.joints.forEach(function (j, i) { j.rotation.z = (j.userData.bend || 0) + Math.sin(t * .9 - i * .5) * .06; });
      u.leaves.forEach(function (l, i) { l.rotation.x += Math.sin(t * 2.2 + i) * .004; });
      return;
    }
    if (u.kind === 'littleocto') {
      if (u.jet > 0) {   // jetting away, arms trailing, then sinking back to the sand
        u.jet -= dt; var k = u.jet / 1.6; m.position.y = Math.sin((1 - k) * Math.PI) * 2.2; u.x += u.dir * dt * 2.4; m.rotation.z = .5 * k;
        u.arms.forEach(function (a) { a.ch.joints.forEach(function (j) { j.rotation.z = .05; j.rotation.x = 0; }); });
      } else {   // creeps: arms curl and reach in turn
        m.position.y = 0; m.rotation.z = 0; if (!u.target || Math.abs(u.target - u.x) < .1) u.target = R(1.5, 5.6);
        u.dir = u.target > u.x ? 1 : -1; u.x += u.dir * dt * .3; m.rotation.y = u.dir > 0 ? 0 : Math.PI;
        u.arms.forEach(function (a) { a.ch.joints.forEach(function (j, i) { j.rotation.z = (i < 2 ? .1 : i < 4 ? .02 : .35) + Math.sin(t * 2.4 + a.ph - i * .6) * .12; j.rotation.x = Math.sin(t * 1.3 + a.ph + i) * .1; }); });   // lying on the sand, the tips curl up
      }
      u.x = clamp(u.x, 1, 6); m.position.x = u.x; m.position.z = u.z;
      u.blush = Math.max(0, u.blush - dt * .4); u.skin.color.setHex(0xe0521f).lerp(new T.Color(0x9a1c0c), u.blush).lerp(new T.Color(0xf07a3a), Math.max(0, Math.sin(t * .4)) * .2);
      return;
    }
    if (u.kind === 'hermit') { u.a += dt * .06; m.position.x = -1 + Math.sin(u.a) * 2.5; m.rotation.y = Math.cos(u.a) > 0 ? 0 : Math.PI; return; }
    if (u.kind === 'angler') { u.a += dt; u.light.intensity = .7 + Math.sin(u.a * 2.3) * .3; m.position.y = 1.2 + Math.sin(u.a * .5) * .2; return; }
  }
  /* ---------- Octo: Pet Raising's octopus, with Pet Raising's care (minest.octo.care.v2), house and chest ---------- */
  var OC = { mode: 'roam', target: null, vel: null, retarget: 0, high: false, scale: 2.1, then: null, eat: null };
  var CARE = 'minest.octo.care.v2', KEYS = 'minest.octo.chestKeys', COLL = 'minest.octo.treasure.v1';
  var POOL = ['octopus-polymath', 'lucy-axolotl', 'archimedes-owl', 'pikachu', 'perfect-week', 'minion-stuart', 'ender-dragon', 'sith-lightsaber', 'study-streak-365'];
  function care() { var d = { hunger: 35, fun: 70, clean: 80, energy: 85, bond: 0, t: Date.now() }; try { Object.assign(d, JSON.parse(localStorage.getItem(CARE) || 'null') || {}); } catch (e) {} return d; }
  function careAdd(o) {   // the same record Pet Raising keeps, so care given here counts there too
    var d = care(); Object.keys(o).forEach(function (k) { d[k] = clamp((d[k] || 0) + o[k], 0, k === 'bond' ? 1e6 : 100); }); d.t = Date.now();
    try { localStorage.setItem(CARE, JSON.stringify(d)); } catch (e) {} drawBar(); return d;
  }
  function keys() { return Math.max(0, parseInt(localStorage.getItem(KEYS) || '0', 10) || 0); }
  function eyeLocal() { return eyeW ? tank.worldToLocal(eyeW.clone()) : new T.Vector3(0, 6, 30); }
  function octoGo(p, then) { OC.mode = 'goto'; OC.target = p.clone(); OC.then = then || null; }
  function play(name, once) {
    var c = clips[name] || clips.happy; if (!c || !mixer) return; mixer.stopAllAction();
    var a = mixer.clipAction(c); if (once !== false) { a.setLoop(T.LoopOnce, 1); a.clampWhenFinished = false; } a.reset().play();
  }
  function lifeOcto(dt, t, now) {
    if (!OC.vel) OC.vel = new T.Vector3();
    var pos = octo.position;
    if (OC.mode === 'home') {   // resting inside the shell house: energy comes back, the window glows, Zzz
      careAdd({ energy: dt * 1.5 }); var H = tank.userData.house; H.win.material.emissiveIntensity = 1.6 + Math.sin(t * 1.5) * .3; H.glow.intensity = 1.1;
      if (Math.random() < dt * .8) zzz(H.top); return;
    }
    if (OC.mode === 'roam') {   // anywhere in the tank: low by the sand (the floor glass) and high behind the hinge (the front glass)
      OC.retarget -= dt;
      if (!OC.target || OC.retarget <= 0 || pos.distanceTo(OC.target) < 1) { OC.high = !OC.high; OC.target = OC.high ? new T.Vector3(R(-8, 8), R(10, 15), R(-9, -3)) : new T.Vector3(R(-8, 8), R(2, 5), R(-2, 5)); OC.retarget = R(7, 12); }
    }
    if (OC.mode === 'pet') OC.target = pos.clone();
    if (OC.target) {
      var d = OC.target.clone().sub(pos), dist = d.length(), sp = OC.mode === 'goto' ? 3.2 : 2;
      OC.vel.lerp(d.normalize().multiplyScalar(sp * Math.min(1, dist / 2.5)), Math.min(1, dt * 1.6));
      pos.addScaledVector(OC.vel, dt); pos.y += Math.sin(t * 1.3) * dt * .25;
      if (OC.mode === 'goto' && dist < .6) { OC.mode = 'roam'; OC.target = null; var f = OC.then; OC.then = null; if (f) f(); }
    }
    pos.x = clamp(pos.x, -10, 10); pos.y = clamp(pos.y, 1.3, 15.5); pos.z = clamp(pos.z, -10, 7);
    // it looks at you; swimming along it turns partly into the way it goes
    var up = new T.Vector3(0, 1, 0), qE = new T.Quaternion().setFromRotationMatrix(new T.Matrix4().lookAt(eyeLocal(), pos, up));
    var sp2 = OC.vel.length(), q = qE.clone();
    if (sp2 > .3) { var qV = new T.Quaternion().setFromRotationMatrix(new T.Matrix4().lookAt(pos.clone().add(OC.vel), pos, up)); q.slerp(qV, Math.min(.45, sp2 * .15)); }
    octo.quaternion.slerp(q, Math.min(1, dt * 2.5));
    var sc = OC.scale; octo.scale.setScalar(sc);
  }
  /* house: Octo swims to the door, slips inside and rests; a tap wakes it and it comes back out */
  function goHome() {
    var H = tank.userData.house; if (OC.mode === 'home') return wake();
    toast(zh() ? '🌙 Octo 回家休息了' : '🌙 Octo goes home to rest');
    octoGo(H.front, function () { OC.mode = 'goto'; OC.target = H.door.clone(); var t0 = performance.now();
      (function shrink() { var k = Math.min(1, (performance.now() - t0) / 1100); OC.scale = 2.1 * (1 - k); octo.position.lerp(H.door, .08); if (k < 1) requestAnimationFrame(shrink); else { OC.mode = 'home'; octo.visible = false; } })(); });
  }
  function wake() {
    var H = tank.userData.house; if (OC.mode !== 'home') return;
    octo.visible = true; octo.position.copy(H.door); OC.mode = 'goto'; OC.target = H.front.clone(); OC.then = function () { play('excited'); };
    var t0 = performance.now(); (function grow() { var k = Math.min(1, (performance.now() - t0) / 900); OC.scale = 2.1 * k; if (k < 1) requestAnimationFrame(grow); })();
    H.win.material.emissiveIntensity = 1.1; H.glow.intensity = .6; toast(zh() ? '☀️ Octo 醒了，伸个懒腰' : '☀️ Octo wakes up and stretches');
  }
  /* treasure chest: a key from closing all three rings (Pet Raising's reward) opens it; a badge flies out to Octo */
  function openChest() {
    var Cst = tank.userData.chest;
    if (keys() < 1) { toast(zh() ? '🔑 合上三个活动环就能拿到钥匙' : '🔑 Close all three rings to get a key'); Cst.g.userData.wiggle = 1; return; }
    if (OC.mode === 'home') wake();
    octoGo(Cst.front, function () {
      play('reach'); var t0 = performance.now();
      (function lift() { var k = Math.min(1, (performance.now() - t0) / 900); Cst.lid.rotation.x = -k * 1.9; Cst.shine.intensity = k * 2.2; if (k < 1) requestAnimationFrame(lift); else setTimeout(reveal, 300); })();
    });
  }
  function reveal() {
    var Cst = tank.userData.chest, have = []; try { have = (JSON.parse(localStorage.getItem(COLL) || '{"opened":[]}').opened) || []; } catch (e) {}
    var left = POOL.filter(function (id) { return have.indexOf(id) < 0; }), id = left.length ? left[0] : POOL[Math.floor(Math.random() * POOL.length)];
    var sp = toScreen(Cst.g.position.clone().add(new T.Vector3(0, 1.4, 0))), img = document.createElement('img');
    img.src = (location.protocol === 'file:' ? 'https://minest-app.vercel.app/' : location.origin + '/') + 'badge-index/thumbs/' + id + '.webp'; img.alt = ''; img.className = 'maq-badge';
    img.style.left = sp.x + 'px'; img.style.top = sp.y + 'px'; root.appendChild(img);
    requestAnimationFrame(function () { img.classList.add('up'); });
    setTimeout(function () { var o = toScreen(octo.position); img.style.left = o.x + 'px'; img.style.top = o.y + 'px'; img.classList.add('fly'); }, 1500);
    setTimeout(function () {
      img.remove(); have.indexOf(id) < 0 && have.push(id); try { localStorage.setItem(COLL, JSON.stringify({ opened: have })); localStorage.setItem('minest.octo.latestBadge', JSON.stringify({ id: id, t: Date.now(), from: 'chest' })); localStorage.setItem(KEYS, String(Math.max(0, keys() - 1))); } catch (e) {}
      var K = window.MinestCosmetics; try { if (K) { if (!K.isUnlocked('badge_held')) K.unlock('badge_held'); if (!K.isUnlocked('pirate_hat')) K.unlock('pirate_hat'); var st = K.getState(); if (!st.equippedBySlot.hand || st.equippedBySlot.hand === 'badge_held') K.equipAccessory('badge_held'); } } catch (e) {}
      play('excited'); careAdd({ bond: 2, fun: 10 }); toast('🎁 ' + id.replace(/-/g, ' ').replace(/\b\w/g, function (c) { return c.toUpperCase(); }) + ' (' + have.length + '/' + POOL.length + ')');
      var t0 = performance.now(); (function shut() { var k = Math.min(1, (performance.now() - t0) / 900); Cst.lid.rotation.x = -1.9 * (1 - k); Cst.shine.intensity = 2.2 * (1 - k); if (k < 1) requestAnimationFrame(shut); })();
      drawBar();
    }, 2400);
  }
  /* 🍤 feed: a snack drops in front of Octo, it swims over and eats it */
  function feed() {
    if (OC.mode === 'home') wake();
    var at = octo.position.clone().add(new T.Vector3(R(-2, 2), 1.5, R(.5, 2)));
    var snack = new T.Mesh(new T.TorusGeometry(.22, .1, 6, 12, Math.PI * 1.4), std('#ff9a6a', { emissive: '#ff6a3a', emissiveIntensity: .2 })); snack.position.copy(at); tank.add(snack); food.push(snack);
    setTimeout(function () { octoGo(snack.position, function () { if (snack.parent) snack.parent.remove(snack); play('happy'); var d = careAdd({ hunger: -26, bond: 1 }); hearts(toScreen(octo.position), 3); toast(d.hunger < 10 ? (zh() ? '😋 吃饱啦' : '😋 Full!') : (zh() ? '🦐 好吃！' : '🦐 Yum!')); }); }, 500);
  }
  /* 🎾 play: Octo blows bubbles — tap them to pop (a golden one counts three) */
  var toys = [];
  function bubblesPlay() {
    if (OC.mode === 'home') wake();
    play('excited');
    for (var i = 0; i < 6; i++) (function (i) { setTimeout(function () {
      var gold = Math.random() < .2, b = new T.Mesh(new T.SphereGeometry(.45, 16, 12), new T.MeshStandardMaterial({ color: gold ? '#ffd34d' : '#d8f4ff', transparent: true, opacity: .55, roughness: .05, metalness: .3, emissive: gold ? '#ffb300' : '#000000', emissiveIntensity: gold ? .4 : 0 }));
      b.position.copy(octo.position).add(new T.Vector3(R(-.5, .5), 1.2, R(0, .8))); b.userData = { toy: true, gold: gold, v: new T.Vector3(R(-.5, .5), R(.5, 1), R(-.2, .5)), life: 12 }; tank.add(b); toys.push(b);
    }, i * 380); })(i);
  }
  function lifeToys(dt, t) {
    toys = toys.filter(function (b) { if (!b.parent) return false; b.userData.life -= dt; b.position.addScaledVector(b.userData.v, dt); b.position.x += Math.sin(t * 2 + b.id) * dt * .3; if (b.userData.life <= 0 || b.position.y > 16) { b.parent.remove(b); return false; } return true; });
    var Cst = tank && tank.userData.chest; if (Cst) { var k = keys() > 0; Cst.gold.material.emissiveIntensity = k ? .6 + Math.sin(t * 4) * .4 : .25; if (k && Cst.shine.intensity < .5) Cst.shine.intensity = .35 + Math.sin(t * 3) * .2; var w = Cst.g.userData.wiggle || 0; if (w > 0) { Cst.g.userData.wiggle = Math.max(0, w - dt * 1.5); Cst.g.rotation.z = Math.sin(t * 30) * .05 * w; } }
  }
  /* small things on the glass: hearts, Zzz, a toast; and where a tank point shows on the screen */
  function toScreen(pt) {
    var w = tank.localToWorld(pt.clone()), best = null;
    cams.forEach(function (c) { var v = c.vp, q = w.clone().project(c.cam); if (q.z < 1 && Math.abs(q.x) <= 1.05 && Math.abs(q.y) <= 1.05 && !best) best = { x: v[0] + (q.x + 1) / 2 * v[2], y: innerHeight - (v[1] + (q.y + 1) / 2 * v[3]) }; });
    return best || { x: innerWidth / 2, y: innerHeight / 2 };
  }
  function hearts(p, n) { for (var i = 0; i < n; i++) { var e = document.createElement('span'); e.className = 'maq-fx'; e.textContent = ['💗', '💕', '💖'][i % 3]; e.style.left = (p.x + R(-30, 30)) + 'px'; e.style.top = (p.y + R(-20, 10)) + 'px'; e.style.animationDelay = (i * .12) + 's'; root.appendChild(e); setTimeout(function (x) { return function () { x.remove(); }; }(e), 1800); } }
  function ink(at) {   // a little puff of ink that spreads and fades
    var m = new T.Mesh(new T.SphereGeometry(.3, 12, 10), new T.MeshBasicMaterial({ color: 0x1a1420, transparent: true, opacity: .6, depthWrite: false })); m.position.copy(at); tank.add(m); var t0 = performance.now();
    (function grow() { var k = (performance.now() - t0) / 1800; if (k >= 1 || !m.parent) { if (m.parent) m.parent.remove(m); return; } m.scale.setScalar(1 + k * 4); m.material.opacity = .6 * (1 - k); requestAnimationFrame(grow); })();
  }
  function zzz(top) { var p = toScreen(top), e = document.createElement('span'); e.className = 'maq-fx z'; e.textContent = 'z'; e.style.left = p.x + 'px'; e.style.top = p.y + 'px'; root.appendChild(e); setTimeout(function () { e.remove(); }, 2200); }
  var toastT = 0;
  function toast(msg) { var el = root.querySelector('.maq-toast'); el.textContent = msg; el.classList.add('on'); clearTimeout(toastT); toastT = setTimeout(function () { el.classList.remove('on'); }, 2600); }
  /* Pet Raising's tools, in a bar that hides itself (a tap anywhere brings it back) */
  var petMode = false, barT = 0;
  function drawBar() {
    var b = root && root.querySelector('.maq-bar'); if (!b) return; var d = care(), lv = 1 + Math.floor((d.bond || 0) / 20), k = keys();
    b.innerHTML = [['feed', '🍤', zh() ? '喂食' : 'Feed'], ['pet', '🤚', zh() ? '摸摸' : 'Pet'], ['play', '🎾', zh() ? '吹泡泡' : 'Play'], ['home', OC.mode === 'home' ? '☀️' : '🌙', OC.mode === 'home' ? (zh() ? '叫醒' : 'Wake') : (zh() ? '回家' : 'Home')], ['chest', '🎁', (zh() ? '宝箱' : 'Chest') + (k ? ' ·' + k : '')], ['more', '🐙', 'Lv ' + lv]]
      .map(function (x) { return '<button type="button" data-tool="' + x[0] + '" class="' + (x[0] === 'pet' && petMode ? 'on' : '') + '"><i>' + x[1] + '</i><small>' + x[2] + '</small></button>'; }).join('');
  }
  function showBar() { var b = root.querySelector('.maq-bar'); b.classList.add('on'); clearTimeout(barT); if (!petMode) barT = setTimeout(function () { b.classList.remove('on'); }, 4500); }
  function onTool(e) {
    var b = e.target.closest('[data-tool]'); if (!b) return; e.stopPropagation(); var w = b.getAttribute('data-tool'); buzz(); showBar();
    if (w === 'feed') feed();
    else if (w === 'pet') { petMode = !petMode; if (petMode) { if (OC.mode === 'home') wake(); OC.mode = 'pet'; OC.vel && OC.vel.set(0, 0, 0); toast(zh() ? '🤚 用手指在 Octo 身上摸一摸' : '🤚 Stroke Octo with your finger'); } else { OC.mode = 'roam'; } }
    else if (w === 'play') bubblesPlay();
    else if (w === 'home') goHome();
    else if (w === 'chest') openChest();
    else if (w === 'more') { close(); var pr = document.querySelector('[aria-label^="Pet Raising"]'); if (pr) pr.click(); }
    drawBar();
  }
  var strokeAt = 0;
  function onMove(e) {   // petting: a finger moving over Octo
    if (!petMode || !e.buttons && e.pointerType === 'mouse' || !octo) return;
    var o = toScreen(octo.position); if (Math.hypot(e.clientX - o.x, e.clientY - o.y) > 110) return;
    var now = performance.now(); if (now - strokeAt < 350) return; strokeAt = now;
    hearts({ x: e.clientX, y: e.clientY - 20 }, 1); careAdd({ bond: .25, fun: 1 }); if (Math.random() < .25) play(Math.random() < .5 ? 'happy' : 'nod');
  }
  function animate(now) {
    raf = requestAnimationFrame(animate);
    if (document.hidden || now - last < 33) return; last = now;
    var dt = Math.min(.05, clock.getDelta()), t = clock.elapsedTime;
    fish.forEach(function (f) { lifeFish(f, dt, t); });
    schools.forEach(function (s) { lifeSchool(s, dt, t); });
    movers.forEach(function (m) { lifeOther(m, dt, t); });
    swayers.forEach(function (m) {
      var u = m.userData;
      if (u.blade) { var a = m.geometry.attributes.position, b = u.blade.base; for (var i = 0; i < a.count; i++) { var y = b[i * 3 + 1], k = y / u.blade.h; a.setX(i, b[i * 3] + Math.sin(t * 1.1 + u.blade.ph + y * .3) * k * k * u.blade.h * .12); a.setZ(i, b[i * 3 + 2] + Math.sin(t * .8 + y * .25) * k * k * u.blade.h * .1); } a.needsUpdate = true; }
      else if (u.sway) { m.rotation.x = u.sway.base.x + Math.sin(t * u.sway.f + u.sway.ph) * u.sway.a; m.rotation.z = u.sway.base.z + Math.cos(t * u.sway.f * .8 + u.sway.ph) * u.sway.a; }
    });
    food.forEach(function (q) { if (q.parent) q.position.y = Math.max(.4, q.position.y - dt * .9); }); food = food.filter(function (q) { return q.parent; });
    if (octo) lifeOcto(dt, t, now);
    lifeToys(dt, t);
    if (mixer) mixer.update(dt);
    renderer.setScissorTest(cams.length > 1); renderer.shadowMap.needsUpdate = true;
    cams.forEach(function (c) { var v = c.vp; renderer.toneMappingExposure = c.ex || .82; if (cams.length > 1) { scene.background.setHex(c.water || 0x134a62); scene.fog.color.setHex(c.water ? 0x2f84a2 : 0x175470); } renderer.setViewport(v[0], v[1], v[2], v[3]); renderer.setScissor(v[0], v[1], v[2], v[3]); renderer.render(scene, c.cam); });
  }
  function near(obj, px, e) { if (!obj) return false; var p = toScreen(obj.position); return Math.hypot(p.x - e.clientX, p.y - e.clientY) < px; }
  function onTap(e) {
    if (e.target.closest('.maq-ui') || e.target.closest('.maq-bar')) return;
    showBar(); if (petMode) return onMove(e);
    // things that are small on the glass are found by their place on screen, not only by the ray
    var pf = tappable[0]; if (pf && near(pf, 60, e)) { pf.userData.puffT = 2.4; buzz(); return; }
    var eel = movers.find(function (m) { return m.userData.kind === 'eel' && near(m, 60, e); }); if (eel) { eel.userData.hide = R(3, 5); buzz(); return; }
    var lo = movers.find(function (m) { return m.userData.kind === 'littleocto' && near(m, 60, e); }); if (lo && !(lo.userData.jet > 0)) { var lu = lo.userData; lu.jet = 1.6; lu.blush = 1; lu.dir = lu.x > 3.5 ? -1 : 1; ink(lo.position.clone().add(new T.Vector3(0, .5, 0))); buzz(); return; }
    var toy = toys.find(function (b) { return near(b, 44, e); }); if (toy) { tank.remove(toy); var n = toy.userData.gold ? 3 : 1; careAdd({ fun: 4 * n, bond: .3 * n }); hearts(toScreen(toy.position), n); buzz(); return; }
    if (OC.mode === 'home' && near(tank.userData.house.g, 90, e)) { wake(); drawBar(); return; }
    if (near(tank.userData.house.g, 70, e)) { goHome(); drawBar(); return; }
    if (near(tank.userData.chest.g, 70, e)) { openChest(); return; }
    var x = e.clientX, y = innerHeight - e.clientY, hit = null;
    cams.some(function (c) {
      var v = c.vp; if (x < v[0] || x > v[0] + v[2] || y < v[1] || y > v[1] + v[3]) return false;
      var ray = new T.Raycaster(); ray.setFromCamera(new T.Vector2((x - v[0]) / v[2] * 2 - 1, (y - v[1]) / v[3] * 2 - 1), c.cam);
      if (octo && ray.intersectObject(octo, true).length) { hit = 'octo'; return true; }
      var pf = tappable.find(function (o) { return ray.intersectObject(o, true).length; }); if (pf) { hit = pf; return true; }
      var inv = new T.Matrix4().copy(tank.matrixWorld).invert(), r2 = ray.ray.clone().applyMatrix4(inv), pt = new T.Vector3();
      if (!r2.intersectPlane(new T.Plane(new T.Vector3(0, 1, 0), -12), pt)) r2.at(16, pt);
      hit = pt; return true;
    });
    if (hit === 'octo') { play('wave'); hearts(toScreen(octo.position), 2); careAdd({ bond: .5 }); buzz(); return; }
    if (hit && hit.userData && hit.userData.kind === 'puffer') { hit.userData.puffT = 2.4; buzz(); return; }
    if (hit && hit.isVector3) {
      hit.x = clamp(hit.x, -10, 10); hit.z = clamp(hit.z, -10, 8); hit.y = clamp(hit.y, 4, 13);
      var pel = new T.Mesh(new T.SphereGeometry(.14, 8, 6), std('#b8692e')); pel.position.copy(hit); pel.castShadow = true; tank.add(pel); food.push(pel);
      var all = fish.concat.apply(fish.slice(), schools.map(function (s) { return s.members; }));
      all.slice().sort(function (a, b) { return a.position.distanceTo(hit) - b.position.distanceTo(hit); }).forEach(function (f, i) { if (i < 6) f.userData.food = pel; else if (f.position.distanceTo(hit) < 3) f.userData.flee = 1.2; });
      buzz();
    }
  }
  function buzz() { try { if (window.MinestNative && MinestNative.haptic) MinestNative.haptic('light'); } catch (e) {} }

  /* ---------- open / close ---------- */
  function resize() { if (!renderer) return; renderer.setSize(innerWidth, innerHeight, false); setupCams(); }
  function open() {
    if (root) return;
    T = window.THREE; if (!T) return;
    root = document.createElement('div'); root.className = 'maq';
    root.innerHTML = '<canvas></canvas><div class="maq-ui"><button type="button" data-maq="x" aria-label="Close">✕</button></div><div class="maq-bar on"></div><div class="maq-toast"></div>' +
      '<div class="maq-hint" hidden>' + (zh() ? '把 Duo 立起来折成 L 形（或像书一样半开），水族箱会跨过两块屏幕。点水面喂鱼，点 Octo 和它打招呼，点河豚它会鼓起来；下面的工具栏可以喂 Octo、摸摸它、吹泡泡、回贝壳屋和开宝箱。' : 'Stand the Duo up folded like an L (or half-open like a book): the tank spans both screens. Tap the water to feed the fish, tap Octo to say hi, tap the puffer.') + '</div>';
    document.body.appendChild(root); document.documentElement.classList.add('maq-on'); hint = root.querySelector('.maq-hint');
    renderer = new T.WebGLRenderer({ canvas: root.querySelector('canvas'), antialias: true, powerPreference: 'high-performance' });
    renderer.setPixelRatio(Math.min(devicePixelRatio || 1, 1.25)); renderer.toneMapping = T.ACESFilmicToneMapping; renderer.toneMappingExposure = .82;
    renderer.shadowMap.enabled = true; renderer.shadowMap.type = T.PCFSoftShadowMap; renderer.shadowMap.autoUpdate = false;   // once a frame, not once per screen
    scene = new T.Scene(); scene.background = new T.Color(0x134a62); scene.fog = new T.FogExp2(0x175470, .026);
    scene.add(new T.HemisphereLight(0xbfe8ff, 0x3a4a3a, .5));
    var sun = new T.DirectionalLight(0xfff1d6, 1.35); sun.position.set(5, 26, 9); sun.castShadow = true; sun.shadow.mapSize.set(1024, 1024);
    var sc = sun.shadow.camera; sc.left = -16; sc.right = 16; sc.top = 16; sc.bottom = -16; sc.near = 1; sc.far = 60; sun.shadow.bias = -.0008; sun.shadow.radius = 4;
    scene.add(sun); scene.add(sun.target);
    var fill = new T.DirectionalLight(0x8fd3ff, .45); fill.position.set(-8, 6, 12); scene.add(fill);
    tank = buildTank(); scene.add(tank); populate(); loadOcto();
    clock = new T.Clock(); resize();
    root.addEventListener('pointerdown', onTap); root.addEventListener('pointermove', onMove); root.querySelector('.maq-bar').addEventListener('click', onTool); drawBar(); showBar();
    root.querySelector('[data-maq="x"]').addEventListener('click', close);
    addEventListener('resize', resize); addEventListener('minest:hinge', resize);
    raf = requestAnimationFrame(animate);
    if (!hint.hidden) setTimeout(function () { if (hint) hint.classList.add('fade'); }, 7000);
  }
  function close() {
    if (!root) return; cancelAnimationFrame(raf);
    removeEventListener('resize', resize); removeEventListener('minest:hinge', resize);
    try { scene.traverse(function (o) { if (o.geometry) o.geometry.dispose(); if (o.material) [].concat(o.material).forEach(function (m) { if (m.map) m.map.dispose(); m.dispose(); }); }); renderer.dispose(); } catch (e) {}
    root.remove(); root = renderer = scene = tank = octo = mixer = null; fish = []; schools = []; food = []; movers = []; swayers = []; tappable = []; toys = []; clips = {}; petMode = false; OC.mode = 'roam'; OC.target = null; OC.scale = 2.1;
    document.documentElement.classList.remove('maq-on');
    if (location.hash === '#aquarium') try { history.replaceState(null, '', location.pathname + location.search); } catch (e) {}
  }

  // Pet Raising (in its frame) asks for the aquarium; it closes itself first
  addEventListener('message', function (e) { var d = e.data; if (d && d.type === 'minest-pet' && d.action === 'aquarium') { try { var o = document.getElementById('minest-pet-raising-overlay'); if (o) o.remove(); document.documentElement.classList.remove('pet-raising-open'); } catch (x) {} open(); } });
  addEventListener('hashchange', function () { if (location.hash === '#aquarium') open(); });
  if (location.hash === '#aquarium') setTimeout(open, 1200);
  window.MinestAquarium = { open: open, close: close, isOpen: function () { return !!root; }, layout: layout,
    _look: function (from, at) { var c = cams[0] && cams[0].cam; if (!c) return; if (typeof from === 'string') { var m = movers.find(function (x) { return x.userData.kind === from; }); if (!m) return; var w = m.getWorldPosition(new T.Vector3()); at = [w.x, w.y + .3, w.z]; from = [w.x, w.y + 1.6, w.z + 3.4]; } c.position.set(from[0], from[1], from[2]); c.lookAt(at[0], at[1], at[2]); eyeW = c.position.clone(); } };   // a close look while tuning
})();

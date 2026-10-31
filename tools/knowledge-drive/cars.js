/* Minest Knowledge Drive — the garage (cars.js)
   Six grand tourers to drive the Knowledge roads in. Each car is data plus a few builders:
   - exterior(T, car): a low-poly model from the car's side profile (shown in the start-up scene and the garage)
   - wheel(T, car): the steering wheel at unit radius (the drive scales and places it)
   - cluster / screen: canvas instruments redrawn with the live speed (and swept on ignition)
   No maker logos are drawn: badges are plain shapes in the car's colours. */
(function () {
  'use strict';
  if (window.MinestCars) return;

  // side profiles: x = length (front at +x), y = height. body = lower shell, cabin = glasshouse.
  var CARS = [
    { id: 'luce', name: 'Ferrari Luce', short: 'Luce', tag: 'Electric GT · aluminium & tan leather', paint: '#a8121c', glass: '#1b2430',
      body: [[-2.3, .22], [2.3, .22], [2.36, .44], [2.12, .62], [1.2, .78], [.6, .84], [-1.6, .88], [-2.2, .8], [-2.36, .55]],
      cabin: [[-1.72, .86], [-.62, 1.28], [.28, 1.3], [.92, .84]], width: 1.96, wheelR: .37, lights: 'bar', badge: '#f5c400',
      dash: '#1c1d20', trim: '#a7acb2', leather: '#9a5a2a', accent: '#f5c400', ambient: '#e8ecf2', steer: 'alu3', cluster: 'pods', screen: 'clock' },
    { id: 'lexus', name: 'Lexus LC 500', short: 'LC 500', tag: 'Grand tourer · takumi craft', paint: '#29457a', glass: '#18202c',
      body: [[-2.3, .22], [2.3, .22], [2.36, .46], [2.06, .66], [1.0, .8], [-1.5, .86], [-2.16, .82], [-2.36, .6]],
      cabin: [[-1.52, .84], [-.56, 1.24], [.24, 1.26], [.96, .8]], width: 1.92, wheelR: .36, lights: 'spindle', badge: '#d9dde3',
      dash: '#1f2125', trim: '#6b7079', leather: '#c8b79a', accent: '#ffb35c', ambient: '#ffb35c', steer: 'sport3', cluster: 'ring', screen: 'map' },
    { id: 'spectre', name: 'Rolls-Royce Spectre', short: 'Spectre', tag: 'Electric super-coupé · starlight roof', paint: '#1f2a44', paint2: '#c9ccd2', glass: '#141a24',
      body: [[-2.55, .26], [2.55, .26], [2.6, .86], [2.34, .97], [.9, 1.02], [-1.8, 1.04], [-2.48, .96], [-2.6, .6]],
      cabin: [[-1.92, 1.02], [-.9, 1.46], [.36, 1.48], [.96, 1.02]], width: 2.04, wheelR: .4, lights: 'rolls', badge: '#e8e8ea',
      dash: '#0d0d10', trim: '#d9dce0', leather: '#ece6da', wood: '#5a3a22', accent: '#cfd6e6', ambient: '#9fb8ff', steer: 'thin', cluster: 'minimal', screen: 'spirit', stars: true },
    { id: 'p911', name: 'Porsche 911 Turbo S', short: '911', tag: 'Rear-engine icon · five round dials', paint: '#d6d2c6', glass: '#1a2028',
      body: [[-2.16, .2], [2.16, .2], [2.24, .42], [2.0, .6], [1.2, .7], [-.2, .74], [-1.72, .78], [-2.2, .62], [-2.26, .4]],
      cabin: [[-1.92, .76], [-.78, 1.22], [.1, 1.24], [.76, .72]], width: 1.9, wheelR: .36, lights: 'round', badge: '#c8a24a',
      dash: '#19191b', trim: '#3a3b3e', leather: '#1c1c1e', accent: '#ffcf33', ambient: '#ffffff', steer: 'gt3', cluster: 'five', screen: 'none' },
    { id: 'bentley', name: 'Bentley Continental GT', short: 'Continental', tag: 'Grand tourer · walnut & knurled chrome', paint: '#1d4a34', glass: '#162019',
      body: [[-2.36, .24], [2.36, .24], [2.42, .6], [2.22, .82], [1.0, .9], [-1.6, .93], [-2.3, .86], [-2.42, .55]],
      cabin: [[-1.72, .92], [-.7, 1.32], [.3, 1.33], [.96, .9]], width: 1.98, wheelR: .38, lights: 'quad', badge: '#e9e4d6',
      dash: '#4a2e1b', trim: '#cfd2d6', leather: '#efe4cf', wood: '#5b3a20', accent: '#e9e4d6', ambient: '#ffcf8a', steer: 'classic3', cluster: 'twin', screen: 'clock' },
    { id: 'revuelto', name: 'Lamborghini Revuelto', short: 'Revuelto', tag: 'V12 hybrid · hexagons & Y lights', paint: '#6aa83a', glass: '#10161a',
      body: [[-2.3, .2], [2.3, .2], [2.42, .32], [1.42, .62], [.6, .72], [-1.5, .8], [-2.3, .78], [-2.36, .45]],
      cabin: [[-1.32, .78], [-.2, 1.12], [.42, 1.12], [1.38, .62]], width: 2.02, wheelR: .38, lights: 'y', badge: '#d4af37',
      dash: '#141414', trim: '#2b2b2b', leather: '#1a1a1a', accent: '#8fe04a', ambient: '#8fe04a', steer: 'hexflat', cluster: 'hex', screen: 'drive' }
  ];
  function byId(id) { return CARS.filter(function (c) { return c.id === id; })[0] || CARS[0]; }

  function shape(T, pts) { var s = new T.Shape(); pts.forEach(function (p, i) { if (i) s.lineTo(p[0], p[1]); else s.moveTo(p[0], p[1]); }); s.closePath(); return s; }
  function std(T, c, o) { return new T.MeshStandardMaterial(Object.assign({ color: c, roughness: .35, metalness: .4, flatShading: true }, o || {})); }

  // ---------------------------------------------------------------- exterior (front at +x, width along z, wheels on y=0)
  function exterior(T, car) {
    var g = new T.Group(), W = car.width;
    var paint = std(T, car.paint, { roughness: .25, metalness: .55 });
    var bodyG = new T.ExtrudeGeometry(shape(T, car.body), { depth: W - .2, bevelEnabled: true, bevelThickness: .1, bevelSize: .08, bevelSegments: 2 });
    bodyG.translate(0, 0, -(W - .2) / 2);
    g.add(new T.Mesh(bodyG, paint));
    if (car.paint2) {   // two-tone: the upper shell in a second colour
      var up = car.body.filter(function (p) { return p[1] > .7; });
      if (up.length > 1) { var u = new T.ExtrudeGeometry(shape(T, [[up[0][0], .7]].concat(up).concat([[up[up.length - 1][0], .7]])), { depth: W - .16, bevelEnabled: false }); u.translate(0, .01, -(W - .16) / 2); g.add(new T.Mesh(u, std(T, car.paint2, { roughness: .2, metalness: .7 }))); }
    }
    var cab = new T.ExtrudeGeometry(shape(T, car.cabin), { depth: W - .46, bevelEnabled: true, bevelThickness: .06, bevelSize: .05, bevelSegments: 1 });
    cab.translate(0, 0, -(W - .46) / 2);
    g.add(new T.Mesh(cab, std(T, car.glass, { roughness: .08, metalness: .9 })));
    // wheels
    var tyre = std(T, '#121212', { roughness: .9, metalness: 0 }), rimM = std(T, '#c9ccd1', { roughness: .2, metalness: .9 });
    var xs = [car.body[1][0] - .75, car.body[0][0] + .72];
    xs.forEach(function (x) {
      [-1, 1].forEach(function (sz) {
        var t = new T.Mesh(new T.CylinderGeometry(car.wheelR, car.wheelR, .3, 20), tyre); t.rotation.x = Math.PI / 2; t.position.set(x, car.wheelR, sz * (W / 2 - .08)); g.add(t);
        var rm = new T.Mesh(new T.CylinderGeometry(car.wheelR * .66, car.wheelR * .66, .32, 10), rimM); rm.rotation.x = Math.PI / 2; rm.position.copy(t.position); g.add(rm);
      });
    });
    // lights by style
    var head = new T.MeshBasicMaterial({ color: '#f4f8ff' }), tail = new T.MeshBasicMaterial({ color: '#ff2a2a' });
    var fx = car.body[2][0] + .02, rx = car.body[car.body.length - 1][0] - .02, fy = car.body[2][1] + .04;
    function lamp(x, y, z, sx, sy, sz, m) { var b = new T.Mesh(new T.BoxGeometry(sx, sy, sz), m); b.position.set(x, y, z); g.add(b); return b; }
    if (car.lights === 'bar') { lamp(fx, fy + .06, 0, .05, .05, W * .86, head); lamp(rx, .62, 0, .05, .06, W * .9, tail); }
    else if (car.lights === 'round' || car.lights === 'quad') {
      [-1, 1].forEach(function (s) {
        var n = car.lights === 'quad' ? 2 : 1;
        for (var i = 0; i < n; i++) { var c = new T.Mesh(new T.CylinderGeometry(i ? .09 : .13, i ? .09 : .13, .06, 16), head); c.rotation.z = Math.PI / 2; c.position.set(fx - .1, fy + .02, s * (W / 2 - .35 - i * .26)); g.add(c); }
        lamp(rx + .02, .6, s * (W / 2 - .3), .05, .07, .5, tail);
      });
      if (car.lights === 'round') lamp(rx, .62, 0, .04, .03, W * .8, tail);
    } else if (car.lights === 'y') {
      [-1, 1].forEach(function (s) { var a = lamp(fx - .15, fy, s * (W / 2 - .4), .05, .04, .5, head); a.rotation.x = s * .5; var b2 = lamp(fx - .15, fy - .06, s * (W / 2 - .4), .05, .04, .5, head); b2.rotation.x = -s * .5; lamp(rx, .6, s * (W / 2 - .4), .05, .05, .55, tail); });
    } else {
      [-1, 1].forEach(function (s) { lamp(fx - .05, fy, s * (W / 2 - .38), .06, .06, .48, head); lamp(rx, .62, s * (W / 2 - .32), .05, .06, .55, tail); });
    }
    if (car.lights === 'spindle') {   // hourglass grille
      var sp = new T.Shape(); sp.moveTo(-.38, .5); sp.lineTo(.38, .5); sp.lineTo(.2, .05); sp.lineTo(.42, -.4); sp.lineTo(-.42, -.4); sp.lineTo(-.2, .05); sp.closePath();
      var sm = new T.Mesh(new T.ShapeGeometry(sp), new T.MeshBasicMaterial({ color: '#0b0d10', side: T.DoubleSide })); sm.rotation.y = Math.PI / 2; sm.position.set(fx + .06, .42, 0); sm.scale.set(.75, .5, 1); g.add(sm);
    }
    if (car.lights === 'rolls') {     // tall chrome grille
      lamp(fx + .02, .58, 0, .06, .5, .62, std(T, '#e6e8ec', { roughness: .1, metalness: 1 }));
      for (var v = 0; v < 7; v++) lamp(fx + .05, .58, -.27 + v * .09, .02, .46, .02, std(T, '#9aa0a8', { metalness: 1, roughness: .2 }));
    }
    // badge (plain shape in the badge colour) + mirrors
    var bd = new T.Mesh(new T.CylinderGeometry(.06, .06, .02, 12), new T.MeshBasicMaterial({ color: car.badge })); bd.rotation.z = Math.PI / 2; bd.position.set(fx + .06, fy + .16, 0); g.add(bd);
    [-1, 1].forEach(function (s) { lamp(car.cabin[3][0] - .1, car.cabin[3][1] + .02, s * (W / 2 + .05), .18, .1, .14, paint); });
    // ground shadow
    var sh = new T.Mesh(new T.PlaneGeometry(car.body[1][0] - car.body[0][0] + .6, W + .4), new T.MeshBasicMaterial({ color: '#000', transparent: true, opacity: .32, depthWrite: false }));
    sh.rotation.x = -Math.PI / 2; sh.position.y = .015; g.add(sh);
    return g;
  }

  // ---------------------------------------------------------------- steering wheels (unit radius, facing the driver)
  function wheel(T, car) {
    var g = new T.Group(), rimM = std(T, '#151515', { roughness: .8, metalness: .05 }), metal = std(T, car.trim, { roughness: .3, metalness: .85 });
    var R = 1, s = car.steer;
    if (s === 'hexflat') {             // flat-bottomed, hexagonal hub
      var pts = []; for (var i = 0; i <= 40; i++) { var a = -Math.PI / 2 + .55 + (i / 40) * (Math.PI * 2 - 1.1); pts.push(new T.Vector3(Math.cos(a) * R, Math.sin(a) * R, 0)); }
      pts.push(new T.Vector3(Math.cos(-Math.PI / 2 - .55) * R, Math.sin(-Math.PI / 2 - .55) * R, 0));
      g.add(new T.Mesh(new T.TubeGeometry(new T.CatmullRomCurve3(pts, true), 60, .09, 6, true), rimM));
    } else {
      var thick = s === 'thin' ? .045 : s === 'gt3' ? .1 : .085, rad = s === 'thin' ? 1.08 : 1;
      g.add(new T.Mesh(new T.TorusGeometry(rad, thick, 8, 40), rimM));
      if (s === 'gt3') { var mark = new T.Mesh(new T.BoxGeometry(.08, .2, .2), std(T, car.accent, { metalness: 0 })); mark.position.set(0, rad, 0); g.add(mark); }
      if (s === 'thin') { var chrome = new T.Mesh(new T.TorusGeometry(rad * .97, .015, 6, 40), metal); chrome.position.z = .02; g.add(chrome); }
    }
    // spokes
    var spokeM = s === 'alu3' || s === 'thin' || s === 'classic3' ? metal : std(T, '#2a2a2c', { roughness: .6 });
    var arms = s === 'thin' ? [[-1, .18], [1, .18], [0, -1]] : [[-1, .1], [1, .1], [0, -1]];
    arms.forEach(function (a) {
      var len = a[0] ? .82 : .78, sp = new T.Mesh(new T.BoxGeometry(len, s === 'thin' ? .07 : .2, .06), spokeM);
      if (a[0]) { sp.position.set(a[0] * .5, -.05, 0); sp.rotation.z = a[0] * a[1] * -1; }
      else { sp.geometry = new T.BoxGeometry(s === 'thin' ? .07 : .28, len, .06); sp.position.set(0, -.55, 0); }
      g.add(sp);
    });
    // hub + badge
    var hubR = s === 'hexflat' ? .34 : .3, hub = new T.Mesh(new T.CylinderGeometry(hubR, hubR * 1.05, .14, s === 'hexflat' ? 6 : 24), std(T, '#1b1b1d', { roughness: .5 }));
    hub.rotation.x = Math.PI / 2; g.add(hub);
    var badgeShape = new T.Shape();
    if (s === 'alu3') { badgeShape.moveTo(-.12, .14); badgeShape.lineTo(.12, .14); badgeShape.lineTo(.12, -.04); badgeShape.quadraticCurveTo(0, -.18, -.12, -.04); badgeShape.closePath(); }   // shield
    else badgeShape.absarc(0, 0, .1, 0, Math.PI * 2, false);
    var bdg = new T.Mesh(new T.ShapeGeometry(badgeShape), new T.MeshBasicMaterial({ color: car.badge })); bdg.position.z = .08; g.add(bdg);
    // wheel-mounted controls (manettino-style dial on the Luce, red start cover on the Revuelto)
    if (s === 'alu3' || s === 'hexflat') {
      var knob = new T.Mesh(new T.CylinderGeometry(.07, .07, .05, 14), std(T, s === 'alu3' ? '#c81e1e' : '#d4af37', { metalness: .2 })); knob.rotation.x = Math.PI / 2; knob.position.set(.42, -.24, .06); g.add(knob);
      var pad = new T.Mesh(new T.CircleGeometry(.12, 14), new T.MeshBasicMaterial({ color: '#202124' })); pad.position.set(-.42, -.24, .05); g.add(pad);
    }
    return g;
  }

  // ---------------------------------------------------------------- instruments (canvas)
  var FONT = '-apple-system, "SF Pro Display", "Helvetica Neue", sans-serif';
  function dial(x, cx, cy, r, v, max, col, lab, opt) {   // analog dial, 270° sweep
    opt = opt || {}; x.save();
    x.fillStyle = opt.face || '#0b0c0e'; x.beginPath(); x.arc(cx, cy, r, 0, Math.PI * 2); x.fill();
    x.strokeStyle = opt.ring || 'rgba(255,255,255,.25)'; x.lineWidth = r * .05; x.stroke();
    var a0 = Math.PI * .75, a1 = Math.PI * 2.25;
    for (var i = 0; i <= 10; i++) { var a = a0 + (a1 - a0) * i / 10; x.strokeStyle = opt.tick || 'rgba(255,255,255,.75)'; x.lineWidth = r * .03; x.beginPath(); x.moveTo(cx + Math.cos(a) * r * .78, cy + Math.sin(a) * r * .78); x.lineTo(cx + Math.cos(a) * r * .9, cy + Math.sin(a) * r * .9); x.stroke(); }
    if (opt.red) { x.strokeStyle = '#e11d48'; x.lineWidth = r * .06; x.beginPath(); x.arc(cx, cy, r * .84, a0 + (a1 - a0) * .82, a1); x.stroke(); }
    var f = Math.max(0, Math.min(1, v / max)), an = a0 + (a1 - a0) * f;
    if (opt.arc) { x.strokeStyle = col; x.lineWidth = r * .08; x.beginPath(); x.arc(cx, cy, r * .66, a0, an); x.stroke(); }
    x.strokeStyle = col; x.lineWidth = r * .045; x.lineCap = 'round'; x.beginPath(); x.moveTo(cx, cy); x.lineTo(cx + Math.cos(an) * r * .86, cy + Math.sin(an) * r * .86); x.stroke();
    x.fillStyle = '#222'; x.beginPath(); x.arc(cx, cy, r * .09, 0, Math.PI * 2); x.fill();
    if (lab) { x.fillStyle = 'rgba(255,255,255,.7)'; x.font = '600 ' + Math.round(r * .16) + 'px ' + FONT; x.textAlign = 'center'; x.fillText(lab, cx, cy + r * .5); }
    if (opt.digits != null) { x.fillStyle = '#fff'; x.font = '300 ' + Math.round(r * .34) + 'px ' + FONT; x.textAlign = 'center'; x.fillText(opt.digits, cx, cy + r * .2); }
    x.restore();
  }
  // kmh: displayed speed; sweep 0..1 overrides the needles on ignition; on 0..1 = power
  function drawCluster(cv, car, kmh, sweep, on) {
    var x = cv.getContext('2d'), w = cv.width, h = cv.height, sp = sweep != null ? sweep * 320 : kmh, rpm = sweep != null ? sweep * 9 : 1.2 + (kmh % 60) / 60 * 4 + kmh / 120;
    x.fillStyle = '#050607'; x.fillRect(0, 0, w, h);
    x.globalAlpha = on;
    var acc = car.accent, k = car.cluster, kms = String(Math.round(sweep != null ? sweep * 320 : kmh));
    if (k === 'pods') {
      dial(x, w * .2, h * .56, h * .3, rpm, 9, '#ffffff', 'kW', {});
      dial(x, w * .5, h * .5, h * .44, sp, 320, '#ff8a1e', 'km/h', { digits: kms, arc: true });
      dial(x, w * .8, h * .56, h * .3, 0, 1, acc, 'FORCE', {});
      x.strokeStyle = 'rgba(255,255,255,.35)'; x.lineWidth = 2; x.beginPath(); x.moveTo(w * .8 - 30, h * .56); x.lineTo(w * .8 + 30, h * .56); x.moveTo(w * .8, h * .56 - 30); x.lineTo(w * .8, h * .56 + 30); x.stroke();
      x.fillStyle = '#4ade80'; x.fillRect(w * .42, h * .86, w * .16 * (on), 5);
    } else if (k === 'ring') {
      var cx = w / 2, cy = h * .52, r = h * .44, a0 = Math.PI * .8, a1 = Math.PI * 2.2, f = Math.min(1, rpm / 9);
      x.strokeStyle = 'rgba(255,255,255,.12)'; x.lineWidth = 16; x.beginPath(); x.arc(cx, cy, r, a0, a1); x.stroke();
      x.strokeStyle = acc; x.beginPath(); x.arc(cx, cy, r, a0, a0 + (a1 - a0) * f); x.stroke();
      x.fillStyle = '#fff'; x.font = '200 ' + Math.round(h * .3) + 'px ' + FONT; x.textAlign = 'center'; x.fillText(kms, cx, cy + h * .1);
      x.font = '600 18px ' + FONT; x.fillStyle = acc; x.fillText('km/h  ·  D', cx, cy + h * .26);
      x.fillStyle = 'rgba(255,255,255,.6)'; x.textAlign = 'left'; x.fillText('ECO  NORMAL  SPORT S+', 18, h - 16);
    } else if (k === 'minimal') {
      x.strokeStyle = 'rgba(255,255,255,.55)'; x.lineWidth = 3;
      x.beginPath(); x.arc(w * .26, h * .58, h * .34, Math.PI * .8, Math.PI * 2.2); x.stroke();
      x.beginPath(); x.arc(w * .74, h * .58, h * .34, Math.PI * .8, Math.PI * 2.2); x.stroke();
      x.fillStyle = '#e8e8ea'; x.font = '300 ' + Math.round(h * .22) + 'px ' + FONT; x.textAlign = 'center'; x.fillText(kms, w * .74, h * .64);
      x.font = '500 14px ' + FONT; x.fillStyle = 'rgba(232,232,234,.7)'; x.fillText('POWER RESERVE', w * .26, h * .9); x.fillText('km/h', w * .74, h * .9);
      var pr = sweep != null ? sweep : .82; x.strokeStyle = car.accent; x.lineWidth = 6; x.beginPath(); x.arc(w * .26, h * .58, h * .34, Math.PI * .8, Math.PI * .8 + Math.PI * 1.4 * pr); x.stroke();
    } else if (k === 'five') {
      var cxs = [.1, .29, .5, .71, .9], rs = [.2, .26, .42, .26, .2];
      cxs.forEach(function (c, i) { dial(x, w * c, h * .55, h * rs[i], i === 2 ? rpm : i === 1 ? sp : .5, i === 2 ? 9 : i === 1 ? 320 : 1, i === 2 ? '#ff6b00' : '#fff', ['OIL', 'km/h', 'x1000 rpm', 'FUEL', 'TEMP'][i], { red: i === 2, digits: i === 2 ? kms : null, face: i === 2 ? '#0e0e10' : '#0b0c0e' }); });
    } else if (k === 'twin') {
      dial(x, w * .3, h * .52, h * .42, sp, 320, '#f7f3ea', 'km/h', { face: '#101418', ring: '#cfd2d6', digits: kms });
      dial(x, w * .7, h * .52, h * .42, rpm, 9, '#f7f3ea', 'rpm × 1000', { face: '#101418', ring: '#cfd2d6' });
    } else if (k === 'hex') {
      x.fillStyle = 'rgba(255,255,255,.06)';
      for (var b = 0; b < 30; b++) { var bx = 30 + b * ((w - 60) / 30), lit = b / 30 < rpm / 9; x.fillStyle = lit ? (b > 24 ? '#ef4444' : acc) : 'rgba(255,255,255,.1)'; x.beginPath(); x.moveTo(bx, h * .2); x.lineTo(bx + 10, h * .14); x.lineTo(bx + 16, h * .2 + (b % 2) * 2); x.lineTo(bx + 6, h * .26); x.fill(); }
      x.fillStyle = '#fff'; x.font = '700 ' + Math.round(h * .34) + 'px ' + FONT; x.textAlign = 'center'; x.fillText(kms, w / 2, h * .7);
      x.font = '700 16px ' + FONT; x.fillStyle = acc; x.fillText('CITTÀ   STRADA   SPORT   CORSA', w / 2, h * .92);
    }
    x.globalAlpha = 1;
  }
  function drawScreen(cv, car, on, label) {
    var x = cv.getContext('2d'), w = cv.width, h = cv.height;
    x.fillStyle = '#07080a'; x.fillRect(0, 0, w, h); if (!on) return;
    x.globalAlpha = on;
    if (label) {    // boot: the car's name
      x.fillStyle = '#e8e8ea'; x.font = '300 46px ' + FONT; x.textAlign = 'center'; x.fillText(car.short.toUpperCase(), w / 2, h / 2 + 10);
      x.fillStyle = car.accent; x.fillRect(w / 2 - 60, h / 2 + 30, 120 * on, 3); x.globalAlpha = 1; return;
    }
    var now = new Date(), hh = now.getHours(), mm = ('0' + now.getMinutes()).slice(-2);
    if (car.screen === 'clock' || car.screen === 'spirit') {
      var cx = w * .78, cy = h * .45, r = h * .3;
      x.fillStyle = '#f5f5f4'; x.beginPath(); x.arc(cx, cy, r, 0, Math.PI * 2); x.fill();
      x.strokeStyle = '#111'; x.lineWidth = 4; x.lineCap = 'round';
      var ha = (hh % 12 + now.getMinutes() / 60) / 12 * Math.PI * 2 - Math.PI / 2, ma = now.getMinutes() / 60 * Math.PI * 2 - Math.PI / 2;
      x.beginPath(); x.moveTo(cx, cy); x.lineTo(cx + Math.cos(ha) * r * .5, cy + Math.sin(ha) * r * .5); x.stroke();
      x.lineWidth = 2.5; x.beginPath(); x.moveTo(cx, cy); x.lineTo(cx + Math.cos(ma) * r * .78, cy + Math.sin(ma) * r * .78); x.stroke();
      x.strokeStyle = '#d22'; x.lineWidth = 1.5; var sa = now.getSeconds() / 60 * Math.PI * 2 - Math.PI / 2; x.beginPath(); x.moveTo(cx, cy); x.lineTo(cx + Math.cos(sa) * r * .85, cy + Math.sin(sa) * r * .85); x.stroke();
    }
    if (car.screen !== 'spirit') {
      x.fillStyle = '#e5e7eb'; x.font = '600 34px ' + FONT; x.textAlign = 'left'; x.fillText(hh + ':' + mm, 26, 56);
      x.strokeStyle = car.accent; x.lineWidth = 3; x.beginPath();
      for (var i = 0; i < 40; i++) { var px = 26 + i * 8, py = h * .62 - Math.sin(i * .5 + now.getSeconds() * .3) * 16 - Math.sin(i * .17) * 10; if (i) x.lineTo(px, py); else x.moveTo(px, py); }
      x.stroke();
      x.fillStyle = 'rgba(229,231,235,.6)'; x.font = '500 16px ' + FONT; x.fillText(car.screen === 'map' ? 'NAV · KNOWLEDGE ROAD' : 'MODE · TOUR', 26, h - 24);
    } else {
      x.fillStyle = '#e8e8ea'; x.font = '300 22px ' + FONT; x.textAlign = 'left'; x.fillText('SPIRIT', 26, 52); x.fillStyle = 'rgba(232,232,234,.6)'; x.font = '400 15px ' + FONT; x.fillText(hh + ':' + mm + ' · whisper quiet', 26, 80);
    }
    x.globalAlpha = 1;
  }

  // ---------------------------------------------------------------- garage preview (2D silhouette)
  function drawPreview(cv, car) {
    var x = cv.getContext('2d'), w = cv.width, h = cv.height;
    var gr = x.createLinearGradient(0, 0, 0, h); gr.addColorStop(0, '#2a2f38'); gr.addColorStop(1, '#0f1115'); x.fillStyle = gr; x.fillRect(0, 0, w, h);
    x.fillStyle = 'rgba(0,0,0,.45)'; x.beginPath(); x.ellipse(w / 2, h * .82, w * .4, h * .05, 0, 0, Math.PI * 2); x.fill();
    var sc = w / 6, ox = w / 2, oy = h * .82;
    function path(pts) { x.beginPath(); pts.forEach(function (p, i) { var px = ox + p[0] * sc, py = oy - p[1] * sc; if (i) x.lineTo(px, py); else x.moveTo(px, py); }); x.closePath(); }
    var pg = x.createLinearGradient(0, oy - 1.3 * sc, 0, oy); pg.addColorStop(0, car.paint2 || car.paint); pg.addColorStop(.55, car.paint); pg.addColorStop(1, '#000');
    x.fillStyle = pg; path(car.body); x.fill();
    x.fillStyle = '#1b2533'; path(car.cabin); x.fill();
    x.strokeStyle = 'rgba(255,255,255,.35)'; x.lineWidth = 2; x.beginPath(); x.moveTo(ox + car.cabin[1][0] * sc, oy - car.cabin[1][1] * sc + 3); x.lineTo(ox + car.cabin[2][0] * sc, oy - car.cabin[2][1] * sc + 3); x.stroke();
    [car.body[1][0] - .75, car.body[0][0] + .72].forEach(function (wx) {
      x.fillStyle = '#0d0d0d'; x.beginPath(); x.arc(ox + wx * sc, oy - car.wheelR * sc, car.wheelR * sc, 0, Math.PI * 2); x.fill();
      x.fillStyle = '#b8bcc2'; x.beginPath(); x.arc(ox + wx * sc, oy - car.wheelR * sc, car.wheelR * sc * .6, 0, Math.PI * 2); x.fill();
    });
    x.fillStyle = '#ff3b3b'; x.fillRect(ox + car.body[car.body.length - 1][0] * sc - 3, oy - .62 * sc, 5, 6);
    x.fillStyle = '#eef6ff'; x.fillRect(ox + car.body[2][0] * sc - 4, oy - (car.body[2][1] + .06) * sc, 6, 5);
  }

  window.MinestCars = { list: CARS, byId: byId, exterior: exterior, wheel: wheel, drawCluster: drawCluster, drawScreen: drawScreen, drawPreview: drawPreview };
})();

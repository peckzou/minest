/* Minest · Spatial Home — environment "manhattan": New York City — Manhattan Skyline Studio.
   A fictional penthouse studio high over Midtown (the floor is ~240 m up). Warm walnut, glass and stone inside; outside, a real
   3D city: Manhattan's grid of avenues (north–south) and streets (east–west), near / mid / far rings of buildings with setbacks
   and rooftop water tanks, the Empire State Building to the south, the Hudson to the west, traffic on the avenues, clouds,
   lit windows at night, and the sky following the local time (or the setting). Depth comes from geometry plus aerial fog —
   no picture is pasted behind the glass.
   Performance: every building ring is ONE merged mesh with one material (a shared window texture + a night emissive map),
   traffic is one InstancedMesh, nothing outside casts shadows, and lots outside the view wedge are never built. */
(function (root) {
  'use strict';
  var THREE = root.THREE, SV = root.SpatialVoxel, VB = SV.VB, MAT = SV.MAT, SR = root.SpatialRoom, PT = SR.parts;
  var W = PT.size.W, D = PT.size.D, H = 3.1, FLOOR = -240;
  var THEME = {
    woodLight: '#7a4f33', wood: '#5e3b26', woodDark: '#3e2819', blue: '#2b323c', blueDeep: '#1f252d', blueSoft: '#9aa3ad',
    plaster: '#e6e0d6', plaster2: '#d8d0c3', straw: '#b8996a', terracotta: '#8a5a3e', stone: '#cfc7ba', stone2: '#bfb6a8', cream: '#efe4cf',
    gold: '#b97a46', leafDark: '#3d6b3a', coral: '#a8553f'
  };

  /* ------------------------------------------------------------ a merged-box geometry with metre-based UVs (windows) */
  function CityGeo() { this.p = []; this.n = []; this.c = []; this.uv = []; this.i = []; }
  var FACES = [
    { n: [1, 0, 0], v: [[1, 0, 1], [1, 0, 0], [1, 1, 0], [1, 1, 1]], u: 2 }, { n: [-1, 0, 0], v: [[0, 0, 0], [0, 0, 1], [0, 1, 1], [0, 1, 0]], u: 2 },
    { n: [0, 0, 1], v: [[0, 0, 1], [1, 0, 1], [1, 1, 1], [0, 1, 1]], u: 0 }, { n: [0, 0, -1], v: [[1, 0, 0], [0, 0, 0], [0, 1, 0], [1, 1, 0]], u: 0 },
    { n: [0, 1, 0], v: [[0, 1, 1], [1, 1, 1], [1, 1, 0], [0, 1, 0]], top: 1 }, { n: [0, -1, 0], v: [[0, 0, 0], [1, 0, 0], [1, 0, 1], [0, 0, 1]], top: 1 }
  ];
  var SHADE = [0.86, 0.8, 0.94, 0.72, 1.0, 0.5];
  CityGeo.prototype.box = function (x0, y0, z0, x1, y1, z1, col, plain) {
    var c = SV.lin(col), lo = [x0, y0, z0], hi = [x1, y1, z1];
    for (var f = 0; f < 6; f++) {
      var F = FACES[f], base = this.p.length / 3, s = SHADE[f];
      if (f === 5 && y0 > FLOOR + 1) continue;                       // undersides are never seen
      for (var k = 0; k < 4; k++) {
        var q = F.v[k], P = [q[0] ? hi[0] : lo[0], q[1] ? hi[1] : lo[1], q[2] ? hi[2] : lo[2]];
        this.p.push(P[0], P[1], P[2]); this.n.push(F.n[0], F.n[1], F.n[2]); this.c.push(c[0] * s, c[1] * s, c[2] * s);
        if (F.top || plain) this.uv.push(0.004, 0.004);              // roofs and plain boxes sample the wall margin, not a window
        else this.uv.push(P[F.u] / 32, (P[1] - FLOOR) / 57.6);
      }
      this.i.push(base, base + 1, base + 2, base, base + 2, base + 3);
    }
  };
  CityGeo.prototype.mesh = function (mat) {
    var g = new THREE.BufferGeometry();
    g.setAttribute('position', new THREE.Float32BufferAttribute(this.p, 3)); g.setAttribute('normal', new THREE.Float32BufferAttribute(this.n, 3));
    g.setAttribute('color', new THREE.Float32BufferAttribute(this.c, 3)); g.setAttribute('uv', new THREE.Float32BufferAttribute(this.uv, 2));
    g.setIndex(this.i); g.computeBoundingSphere();
    return new THREE.Mesh(g, mat);
  };

  /* window textures: day (glass in a light frame, tinted by the building's colour) and night (some windows lit) */
  function windowTex(night, seed) {
    var c = document.createElement('canvas'); c.width = 128; c.height = 256; var x = c.getContext('2d'), r = SV.rng(seed), i, j;
    x.fillStyle = night ? '#000' : '#fff'; x.fillRect(0, 0, 128, 256);
    for (i = 0; i < 8; i++) for (j = 0; j < 16; j++) {
      if (night) { var lit = r(); if (lit < 0.42) { x.fillStyle = lit < 0.08 ? '#cfe6ff' : (lit < 0.3 ? '#ffd58f' : '#ffe9bf'); x.fillRect(i * 16 + 3, j * 16 + 3, 10, 11); } }
      else { var g = 90 + ((r() * 40) | 0); x.fillStyle = 'rgb(' + (g - 30) + ',' + (g - 12) + ',' + (g + 18) + ')'; x.fillRect(i * 16 + 3, j * 16 + 3, 10, 11); x.fillStyle = 'rgba(255,255,255,.18)'; x.fillRect(i * 16 + 3, j * 16 + 3, 10, 3); }
    }
    x.fillStyle = night ? '#000' : '#fff'; x.fillRect(0, 0, 2, 2);  // the margin roofs sample
    var t = new THREE.CanvasTexture(c); t.wrapS = t.wrapT = THREE.RepeatWrapping; t.encoding = THREE.sRGBEncoding; t.anisotropy = 4;
    return t;
  }

  /* ------------------------------------------------------------ the city */
  var PAL = ['#cfc3ae', '#c9bba2', '#9c5a44', '#8a5442', '#7d5848', '#7f93a8', '#5e6f82', '#4c5a6b', '#e2ddd3', '#bba98c', '#a8a29a', '#d9cbb0'];
  function city(holder) {
    var near = new CityGeo(), far = new CityGeo(), r = SV.rng(1904), i;
    var AVE = 265, ST = 80, ROAD_A = 30, ROAD_S = 18;            // avenue spacing / street spacing / road widths (m)
    var roads = { ave: [], st: [] };
    function tall(x, z) {                                             // Midtown is tall; it falls off to the south and the edges
      var d = Math.sqrt(x * x + z * z), core = Math.max(0, 1 - d / 2600), south = z < -2200 ? Math.max(0.35, 1 - (-z - 2200) / 2600) : 1;
      return core * south;
    }
    function building(G, x0, z0, x1, z1, h, col, detail) {
      var y0 = FLOOR + 0.4, w = x1 - x0, d = z1 - z0;
      if (h > 140 && detail) {                                        // setbacks: the 1916 zoning look
        var t1 = h * (0.45 + r() * 0.15), t2 = h * (0.75 + r() * 0.1);
        G.box(x0, y0, z0, x1, y0 + t1, z1, col);
        var i1 = Math.min(w, d) * 0.12; G.box(x0 + i1, y0 + t1, z0 + i1, x1 - i1, y0 + t2, z1 - i1, col);
        var i2 = Math.min(w, d) * 0.25; G.box(x0 + i2, y0 + t2, z0 + i2, x1 - i2, y0 + h, z1 - i2, col);
        if (r() < 0.35) G.box((x0 + x1) / 2 - 2, y0 + h, (z0 + z1) / 2 - 2, (x0 + x1) / 2 + 2, y0 + h + 14 + r() * 20, (z0 + z1) / 2 + 2, '#a8a29a', true);
      } else {
        G.box(x0, y0, z0, x1, y0 + h, z1, col);
        if (detail) {
          G.box(x0 - 0.5, y0 + h, z0 - 0.5, x1 + 0.5, y0 + h + 1.2, z1 + 0.5, col, true);              // cornice
          if (h < 120 && r() < 0.45) {                                                              // a wooden water tank on legs
            var tx = x0 + 4 + r() * (w - 10), tz = z0 + 4 + r() * (d - 10);
            G.box(tx, y0 + h + 1.2, tz, tx + 5, y0 + h + 4, tz + 5, '#5a4636', true); G.box(tx - 0.3, y0 + h + 4, tz - 0.3, tx + 5.3, y0 + h + 10, tz + 5.3, '#7b5a3e', true);
            G.box(tx + 0.5, y0 + h + 10, tz + 0.5, tx + 4.5, y0 + h + 12, tz + 4.5, '#4a3a2e', true);
          } else if (r() < 0.5) G.box(x0 + w * 0.3, y0 + h + 1.2, z0 + d * 0.3, x0 + w * 0.6, y0 + h + 5, z0 + d * 0.65, '#9a958e', true);
        }
      }
    }
    for (var ax = -14; ax <= 14; ax++) {
      var bx0 = ax * AVE + ROAD_A / 2 - 120, bx1 = bx0 + AVE - ROAD_A;
      roads.ave.push(bx0 - ROAD_A / 2);
      for (var sz = -62; sz <= -1; sz++) {
        var bz0 = sz * ST + ROAD_S / 2, bz1 = bz0 + ST - ROAD_S, cz = (bz0 + bz1) / 2, cx = (bx0 + bx1) / 2;
        if (Math.abs(cx) > -cz * 1.15 + 500) continue;                // outside the view wedge from the window
        if (ax === 0 && sz === -1) continue;                          // our own block
        var dist = Math.sqrt(cx * cx + cz * cz), G = dist < 1500 ? near : far, detail = dist < 1500;
        if (ax === 0 && sz === -14) { esb(near, bx0, bz0, bx1, bz1); continue; }
        G.box(bx0 - 3, FLOOR, bz0 - 3, bx1 + 3, FLOOR + 0.4, bz1 + 3, '#9b968e', true);                  // the block and its sidewalk
        var lots = dist < 1500 ? 3 + ((r() * 3) | 0) : (dist < 2800 ? 2 : 1), x = bx0, k = tall(cx, cz);
        for (i = 0; i < lots; i++) {
          var lw = i === lots - 1 ? bx1 - x : (bx1 - bx0) / lots * (0.7 + r() * 0.6), xa = x, xb = Math.min(bx1, x + lw) - 1; x = xb + 1;
          var hb = 25 + r() * 60 + k * k * (r() < 0.35 ? 260 + r() * 140 : 80 + r() * 80);
          if (r() < 0.06 && k > 0.4 && dist > 700) hb = 320 + r() * 140;                          // a slender supertall now and then, not next door
          /* the studio is ~240 m up: close by, the neighbours stay below it, so you look over their roofs and water tanks */
          if (dist < 900) hb = Math.min(hb, 60 + dist * 0.17 + r() * 30);
          else if (dist < 1400) hb = Math.min(hb, 170 + r() * 160);
          var col = PAL[(r() * PAL.length) | 0];
          if (r() < 0.5 || !detail) building(G, xa, bz0, xb, bz1, hb, col, detail);
          else { var zm = bz0 + (bz1 - bz0) * (0.4 + r() * 0.2); building(G, xa, bz0, xb, zm - 1, hb, col, detail); building(G, xa, zm, xb, bz1, hb * (0.5 + r() * 0.7), PAL[(r() * PAL.length) | 0], detail); }
        }
        if (ax === -14) roads.st.push(bz0 - ROAD_S / 2);
      }
    }
    /* the Hudson to the west, New Jersey low on the far bank */
    far.box(-14 * AVE - 900, FLOOR - 1, -5200, -14 * AVE - 140, FLOOR - 0.6, 600, '#3f5f78', true);
    for (i = 0; i < 40; i++) { var jz = -5000 + i * 130; far.box(-14 * AVE - 1500, FLOOR, jz, -14 * AVE - 950, FLOOR + 20 + r() * 50, jz + 100, '#8c8f94'); }
    var dayT = windowTex(false, 7), nightT = windowTex(true, 11);
    var mat = new THREE.MeshLambertMaterial({ vertexColors: true, map: dayT, emissive: 0xffffff, emissiveMap: nightT, emissiveIntensity: 0 });
    var mNear = near.mesh(mat), mFar = far.mesh(mat); holder.add(mNear); holder.add(mFar);
    var ground = new THREE.Mesh(new THREE.PlaneGeometry(12000, 12000), new THREE.MeshLambertMaterial({ color: 0x45484d }));
    ground.rotation.x = -Math.PI / 2; ground.position.set(0, FLOOR - 0.2, -2400); holder.add(ground);
    return { mat: mat, roads: roads, AVE: AVE };
  }
  /* the Empire State Building, two blocks wide in the grid, south of the studio: setbacks, the mast, the lit crown */
  var ESB = null;
  function esb(G, x0, z0, x1, z1) {
    var cx = (x0 + x1) / 2, cz = (z0 + z1) / 2, L = '#d6ccb6', y = FLOOR + 0.4;
    G.box(x0 - 3, FLOOR, z0 - 3, x1 + 3, FLOOR + 0.4, z1 + 3, '#9b968e', true);
    G.box(cx - 92, y, cz - 28, cx + 92, y + 25, cz + 28, L);
    G.box(cx - 70, y + 25, cz - 24, cx + 70, y + 85, cz + 24, L);
    G.box(cx - 46, y + 85, cz - 20, cx + 46, y + 250, cz + 20, L);
    G.box(cx - 36, y + 250, cz - 16, cx + 36, y + 265, cz + 16, L);
    G.box(cx - 28, y + 265, cz - 14, cx + 28, y + 320, cz + 14, L);
    G.box(cx - 20, y + 320, cz - 12, cx + 20, y + 345, cz + 12, L, true);
    G.box(cx - 14, y + 345, cz - 10, cx + 14, y + 362, cz + 10, L, true);
    G.box(cx - 9, y + 362, cz - 8, cx + 9, y + 381, cz + 8, '#cfc5b0', true);
    G.box(cx - 4, y + 381, cz - 4, cx + 4, y + 404, cz + 4, '#b9b2a4', true);
    G.box(cx - 1.2, y + 404, cz - 1.2, cx + 1.2, y + 443, cz + 1.2, '#8f8a82', true);
    ESB = { cx: cx, cz: cz, y: y };
  }
  function esbCrown(holder) {
    if (!ESB) return null;
    var v = new VB(2301), cx = ESB.cx, cz = ESB.cz, y = ESB.y;
    v.box(cx - 20.5, y + 320, cz - 12.5, cx + 20.5, y + 345, cz + 12.5, '#fff1c8'); v.box(cx - 14.5, y + 345, cz - 10.5, cx + 14.5, y + 362, cz + 10.5, '#fff6dc');
    v.box(cx - 9.5, y + 362, cz - 8.5, cx + 9.5, y + 381, cz + 8.5, '#ffffff'); v.box(cx - 1.5, y + 438, cz - 1.5, cx + 1.5, y + 444, cz + 1.5, '#ff4a3a');
    var m = new THREE.Mesh(v.geometry(), new THREE.MeshBasicMaterial({ vertexColors: true, transparent: true, opacity: 0, depthWrite: false, fog: true }));
    holder.add(m); return m;
  }

  /* ------------------------------------------------------------ traffic: one InstancedMesh, cars on the avenues and streets */
  function traffic(holder, C) {
    var N = 260, geo = new THREE.BoxGeometry(2.2, 1.6, 4.8), mat = new THREE.MeshBasicMaterial({ color: 0xffffff });
    var im = new THREE.InstancedMesh(geo, mat, N); im.instanceMatrix.setUsage(THREE.DynamicDrawUsage); holder.add(im);
    var r = SV.rng(55), cars = [], m4 = new THREE.Matrix4(), col = new THREE.Color(), DAY = ['#f3c21b', '#f3c21b', '#2b2f36', '#d9dde2', '#6e7681', '#1d3b6e', '#8e1f1f'];
    var aves = C.roads.ave.filter(function (x) { return Math.abs(x) < 2000; }), sts = C.roads.st.filter(function (z) { return z > -2400 && z < -150; });
    for (var i = 0; i < N; i++) {
      var onAve = i % 3 !== 0, dir = r() < 0.5 ? 1 : -1;
      cars.push(onAve ? { ave: 1, x: aves[(r() * aves.length) | 0] + (dir > 0 ? 6 : -6) + (r() - 0.5) * 6, z: -150 - r() * 2600, dir: dir, sp: 9 + r() * 7, day: DAY[(r() * DAY.length) | 0] }
        : { ave: 0, z: sts[(r() * sts.length) | 0] + (dir > 0 ? 3 : -3), x: -2000 + r() * 4000, dir: dir, sp: 7 + r() * 5, day: DAY[(r() * DAY.length) | 0] });
    }
    var lastNight = -1;
    function paint(night) {
      var n = night > 0.5 ? 1 : 0; if (n === lastNight) return; lastNight = n;
      cars.forEach(function (c, i) { col.set(n ? ((c.ave ? c.dir < 0 : c.dir > 0) ? '#fff2c6' : '#ff3b2f') : c.day); im.setColorAt(i, col); });
      if (im.instanceColor) im.instanceColor.needsUpdate = true;
    }
    return {
      tick: function (dt, night) {
        paint(night);
        for (var i = 0; i < N; i++) {
          var c = cars[i];
          if (c.ave) { c.z += c.dir * c.sp * dt; if (c.z > -150) c.z = -2750; if (c.z < -2750) c.z = -150; m4.makeTranslation(c.x, FLOOR + 1.2, c.z); }
          else { c.x += c.dir * c.sp * dt; if (c.x > 2000) c.x = -2000; if (c.x < -2000) c.x = 2000; m4.makeRotationY(Math.PI / 2).setPosition(c.x, FLOOR + 1.2, c.z); }
          im.setMatrixAt(i, m4);
        }
        im.instanceMatrix.needsUpdate = true;
      }
    };
  }

  /* ------------------------------------------------------------ sky, clouds, light by the time of day */
  function sky(holder) {
    var sg = new THREE.SphereGeometry(4600, 24, 12), col = new Float32Array(sg.attributes.position.count * 3);
    sg.setAttribute('color', new THREE.BufferAttribute(col, 3));
    var m = new THREE.Mesh(sg, new THREE.MeshBasicMaterial({ vertexColors: true, side: THREE.BackSide, fog: false, depthWrite: false }));
    holder.add(m);
    var top = new THREE.Color(), hor = new THREE.Color(), t = new THREE.Color();
    return {
      set: function (a, b) {
        top.set(a).convertSRGBToLinear(); hor.set(b).convertSRGBToLinear(); var P = sg.attributes.position;
        for (var i = 0; i < P.count; i++) { var k = Math.max(0, Math.min(1, (P.getY(i) + 300) / 2400)); t.copy(hor).lerp(top, Math.pow(k, 0.55)); col[i * 3] = t.r; col[i * 3 + 1] = t.g; col[i * 3 + 2] = t.b; }
        sg.attributes.color.needsUpdate = true;
      }
    };
  }
  function clouds(holder) {
    var v = new VB(2401), r = v.r, i, k;
    for (i = 0; i < 16; i++) {
      var ox = -2600 + r() * 5200, oy = 120 + r() * 260, oz = -600 - r() * 3600, n = 4 + ((r() * 5) | 0);
      for (k = 0; k < n; k++) v.box(ox + k * 60 - r() * 40, oy + r() * 20, oz - r() * 50, ox + k * 60 + 90 + r() * 60, oy + 25 + r() * 35, oz + 60 + r() * 40, '#ffffff');
    }
    var mat = new THREE.MeshBasicMaterial({ vertexColors: true, transparent: true, opacity: 0.85, depthWrite: false });
    var m = new THREE.Mesh(v.geometry(), mat); holder.add(m); return { mesh: m, mat: mat };
  }

  /* ------------------------------------------------------------ the studio */
  function shell(g) {
    var v = new VB(2001), x, z;
    /* walnut floor in long planks */
    v.box(-W - 0.3, -0.2, -D - 0.32, W + 0.3, -0.02, D + 0.3, '#3a261a');
    for (z = -D - 0.3; z < D; z += 0.18) for (x = -W - 0.3 + ((z * 37) % 1.2); x < W; x += 2.4) v.box(Math.max(-W - 0.3, x), -0.02, z + 0.004, Math.min(W + 0.3, x + 2.38), 0, z + 0.176, ((x * 13 + z * 7) & 1) ? '#6b4430' : '#74503a', 0.08);
    /* left: walnut panelling with grooves · right: travertine · door wall: warm grey */
    v.box(-W - 0.3, 0, -D - 0.3, -W, H, D + 0.3, '#5e3b26');
    for (z = -D; z < D; z += 0.6) v.box(-W, 0, z, -W + 0.006, H, z + 0.012, '#3e2819');
    v.box(W, 0, -D - 0.3, W + 0.3, H, D + 0.3, '#d9cdb9', 0.04);
    for (var y = 0.5; y < H; y += 0.5) v.box(W - 0.004, y, -D, W, y + 0.008, D, '#c9bba3');
    v.box(-W, 0, D, W, H, D + 0.3, '#cbc5bc');
    v.box(-W - 0.3, H, -D - 0.32, W + 0.3, H + 0.25, D + 0.3, '#ece8e1');
    v.box(-W, H - 0.04, -D - 0.3, W, H, -D + 0.1, '#2b2a28');                                      // a dark reveal over the glass
    /* the glass wall: bronze mullions, a transom, a walnut ledge for small things */
    for (x = -W; x <= W + 0.01; x += 1.2) v.box(x - 0.025, 0, -D - 0.3, x + 0.025, H, -D - 0.24, '#4a3b2c');
    v.box(-W, 2.78, -D - 0.3, W, 2.83, -D - 0.24, '#4a3b2c'); v.box(-W, 0, -D - 0.3, W, 0.06, -D - 0.2, '#4a3b2c');
    v.box(-1.62, 0.9, -D - 0.24, -0.08, 0.95, -D + 0.0, '#6b4430'); v.box(-1.62, 0.86, -D - 0.24, -1.57, 0.9, -D + 0.0, '#4a3b2c'); v.box(-0.13, 0.86, -D - 0.24, -0.08, 0.9, -D + 0.0, '#4a3b2c');
    g.add(v.mesh());
    var pane = new THREE.Mesh(new THREE.PlaneGeometry(2 * W, H), new THREE.MeshPhongMaterial({ color: 0xbfd6e6, transparent: true, opacity: 0.07, shininess: 160, specular: 0xffffff, depthWrite: false }));
    pane.position.set(0, H / 2, -D - 0.27); g.add(pane);
    /* ceiling light lines */
    var lv = new VB(2002); lv.box(-1.9, H - 0.02, -0.4, 1.9, H, -0.34, '#fff4dc'); lv.box(-1.9, H - 0.02, 1.2, 1.9, H, 1.26, '#fff4dc');
    g.add(lv.mesh(MAT.glow(), true));
  }
  function decor(g) {
    var v = new VB(2011), i;
    /* a linear pendant over the desk */
    v.box(-0.6, 2.18, -1.98, 0.6, 2.22, -1.92, '#2b2a28'); v.box(-0.4, 2.22, -1.96, -0.39, H, -1.95, '#2b2a28'); v.box(0.39, 2.22, -1.96, 0.4, H, -1.95, '#2b2a28');
    /* an arc floor lamp by the sofa, a fiddle-leaf fig in a stone pot */
    v.cb(-2.3, 0, 0.8, 0.28, 0.05, 0.28, '#cfc7ba'); v.box(-2.32, 0.05, 0.78, -2.28, 1.9, 0.82, '#2b2a28'); v.box(-2.32, 1.86, 0.78, -1.7, 1.9, 0.82, '#2b2a28');
    v.cb(-1.7, 1.66, 0.8, 0.22, 0.2, 0.22, '#e8e2d8');
    v.cb(-2.55, 0, 1.95, 0.4, 0.42, 0.4, '#cfc7ba', 0.04); v.box(-2.57, 0.42, 1.93, -2.53, 1.3, 1.97, '#5e3b26');
    v.ball(-2.55, 1.45, 1.95, 0.36, 0.09, null, 0.2, false, function (rr) { return rr() < 0.7 ? (rr() < 0.5 ? '#3d6b3a' : '#4f8247') : null; });
    /* a framed print of the grid on the door wall */
    v.box(-1.3, 1.25, D - 0.04, 0.3, 2.15, D, '#2b2a28'); v.box(-1.25, 1.3, D - 0.05, 0.25, 2.1, D - 0.04, '#efe9df');
    for (i = 0; i < 9; i++) v.box(-1.15 + i * 0.16, 1.4, D - 0.055, -1.1 + i * 0.16, 1.45 + ((i * 7) % 5) * 0.11, D - 0.05, i === 4 ? '#b97a46' : '#3a3f47');
    /* coffee-table books on the stone cabinet's free end */
    v.box(2.58, 0.8, 0.52, 2.92, 0.84, 0.6, '#1f252d'); v.box(2.6, 0.84, 0.53, 2.9, 0.87, 0.59, '#b97a46');
    g.add(v.mesh());
    var b = new VB(2012); b.box(-0.58, 2.17, -1.97, 0.58, 2.18, -1.93, '#fff1cf'); b.cb(-1.7, 1.64, 0.8, 0.16, 0.02, 0.16, '#fff1cf'); g.add(b.mesh(MAT.glow(), true));
  }

  function build(scene) {
    var holder = new THREE.Group(); holder.name = 'env-manhattan'; scene.add(holder);
    var g = new THREE.Group(); holder.add(g);
    PT.theme(THEME);
    shell(g); PT.rug(g); PT.desk(g); PT.chair(g); PT.bookshelf(g); PT.cabinet(g); PT.bench(g); decor(g);
    PT.theme(null);
    var out = new THREE.Group(); holder.add(out);
    var C = city(out), crown = esbCrown(out), cars = traffic(out, C), S = sky(out), CL = clouds(out);

    var hemi = new THREE.HemisphereLight(0xe6effa, 0x6b5a4a, 0.8); holder.add(hemi);
    var sun = new THREE.DirectionalLight(0xfff1d6, 1.0); sun.position.set(-4, 6, -8); sun.target.position.set(0.5, 0.4, 0.6);
    sun.castShadow = true; sun.shadow.mapSize.set(2048, 2048); var sc = sun.shadow.camera; sc.left = -5; sc.right = 5; sc.top = 5; sc.bottom = -5; sc.near = 1; sc.far = 22;
    sun.shadow.bias = -0.0006; sun.shadow.normalBias = 0.02; holder.add(sun); holder.add(sun.target);
    var lamp = new THREE.PointLight(0xffd9a0, 0.3, 6, 2); lamp.position.set(0, 2.1, -1.95); holder.add(lamp);
    var floorLamp = new THREE.PointLight(0xffd9a0, 0.2, 5, 2); floorLamp.position.set(-1.7, 1.55, 0.8); holder.add(floorLamp);
    var fill = new THREE.PointLight(0xfff4e2, 0.25, 9, 2); fill.position.set(0, 2.6, 1.0); holder.add(fill);
    scene.fog = new THREE.Fog(0xd8e4ef, 260, 3400); scene.background = null;

    var mode = 'auto', lastApply = -99;
    function c3(a, b, k) { return new THREE.Color(a).lerp(new THREE.Color(b), k); }
    function apply() {
      var T = SR.timeOfDay(mode), L = T.light, K = T.dusk, N = T.night;
      var top = c3('#08102a', '#5b9be0', L), hor = c3('#1c2848', '#d9e8f5', L); top.lerp(new THREE.Color('#47568f'), K * 0.5); hor.lerp(new THREE.Color('#f6a77d'), K * 0.75);
      S.set(top, hor); scene.fog.color.copy(hor); scene.fog.far = 3400 - N * 900;
      sun.intensity = 0.15 + 0.95 * L; sun.color.copy(c3('#9fb4ff', '#fff1d6', L)).lerp(new THREE.Color('#ffb36b'), K * 0.7);
      hemi.intensity = 0.35 + 0.5 * L; hemi.color.copy(c3('#5a6a96', '#e6effa', L));
      C.mat.emissiveIntensity = Math.min(1, N * 1.3 + K * 0.25); C.mat.color.setScalar(0.45 + 0.55 * L);
      if (crown) crown.material.opacity = Math.min(1, N * 1.4);
      CL.mat.color.copy(c3('#2e3550', '#ffffff', L)).lerp(new THREE.Color('#ffc6a8'), K * 0.6);
      lamp.intensity = 0.25 + 0.6 * N; floorLamp.intensity = 0.15 + 0.6 * N; fill.intensity = 0.2 + 0.25 * N;
      return N;
    }
    var night = apply(), last = 0;
    return {
      id: 'manhattan', name: 'Manhattan Skyline Studio', group: g, holder: holder, far: 5200, size: { W: W, D: D, H: H },
      anchors: PT.anchors(0.95), desk: PT.deskCam, start: PT.start, solids: PT.solids(), avatar: PT.avatar,
      setTime: function (m) { mode = m || 'auto'; night = apply(); },
      tick: function (t) {
        var dt = Math.min(0.1, Math.max(0, t - last)); last = t;
        if (t - lastApply > 20) { lastApply = t; night = apply(); }        // the real clock moves slowly
        cars.tick(dt, night);
        CL.mesh.position.x = ((t * 4) % 1200) - 600;
      },
      dispose: function () { SR.disposeTree(holder); scene.fog = null; }
    };
  }
  SR.register({ id: 'manhattan', name: 'Manhattan Skyline Studio', zh: '纽约曼哈顿高层工作室', icon: '🏙', build: build });
})(window);

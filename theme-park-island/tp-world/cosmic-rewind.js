/* Minest My World · "Guardians of the Galaxy: Cosmic Rewind" — story coaster (`cosmic-rewind.js`)
 * One continuous attraction staged in a private show volume high above EPCOT's Wonders of Xandar pavilion:
 *   Galaxarium (Worldmind) -> Phase Chamber (Nova Prime, Cosmic Generator) -> teleport to the Starcharter's
 *   observation deck -> the Celestial Eson steals the generator -> evacuation pods ->
 *   reverse launch through the jump point -> chase with the Milano past the ringed planet and an asteroid belt ->
 *   time runs backwards around a spinning galaxy to the Big Bang -> the Guardians collapse the jump point on Eson ->
 *   fast-forward past the Moon back to Earth orbit.
 * The pods are omnicoaster cars: they rotate on the track to face each story beat (including the backwards launch).
 * H skips the pre-show. Audio: cosmic-audio.js. */
(function (root) {
  'use strict';

  // name, length (m), turn (deg, + = right), climb (m), cruise speed (m/s)
  const SEGS = [
    ['bay', 52, 0, 0, 3.2], ['turn', 40, 90, 0, 3.2], ['gate', 24, 0, 0, 2.6], ['launch', 120, 0, 0, 25],
    ['climb', 110, -100, 26, 19], ['crest', 80, -50, 8, 16], ['drop', 70, 70, -32, 24], ['helix', 170, 330, -12, 23],
    ['rise', 70, -30, 14, 19], ['sweep', 110, 90, 14, 18], ['dive', 80, 0, -30, 26], ['rewind', 160, -110, 0, 24],
    ['bang', 44, 0, 4, 4], ['fling', 120, 190, -10, 25], ['weave', 100, -30, 12, 22], ['moon', 146, -270, -6, 23],
    ['home', 110, -40, -4, 20], ['brake', 60, 0, 0, 4], ['dock', 34, 0, 0, 2.4]
  ];
  // speaker: [name, caption colour, synthesiser pitch]
  const WHO = {
    wm: ['世界智脑', '#7dd3fc', 1.35], np: ['诺瓦至尊 · 伊拉妮·蕾尔', '#fbbf24', 1.15], es: ['天神族 · 伊森', '#c4b5fd', 0.3],
    sl: ['星爵 · 彼得·奎尔', '#fb923c', 0.95], rk: ['火箭', '#f87171', 1.55], gm: ['卡魔拉', '#86efac', 1.1],
    dx: ['德拉克斯', '#93c5fd', 0.6], gr: ['格鲁特', '#d6b98c', 0.45]
  };

  function build(T, group, o) {
    const V3 = T.Vector3, M4 = T.Matrix4, PI = Math.PI, OX = o.x, OY = 1000, OZ = o.z, WUP = new V3(0, 1, 0);
    const audio = root.TPCosmicAudio ? root.TPCosmicAudio.create() : null;
    const clamp = (v, a, b) => Math.max(a, Math.min(b, v)), lerp = (a, b, k) => a + (b - a) * k;
    const sm = (k) => { k = clamp(k, 0, 1); return k * k * (3 - 2 * k); };
    let seed = 20260;
    const rnd = () => (seed = (seed * 16807) % 2147483647) / 2147483647;

    const show = new T.Group(); show.position.set(OX, OY, OZ); show.visible = false; group.add(show);

    /* ---------------------------------------------------------------- materials & batching */
    const VS = 'attribute vec3 aCol; varying vec3 vC; varying vec3 vN; void main(){ vC = aCol; vN = normalize(mat3(modelMatrix) * normal); gl_Position = projectionMatrix * modelViewMatrix * vec4(position, 1.0); }';
    const FS = 'uniform vec3 uKey; uniform vec3 uKeyCol; uniform vec3 uAmb; uniform vec3 uAdd; uniform float uOp; varying vec3 vC; varying vec3 vN; void main(){ float d = max(dot(normalize(vN), uKey), 0.0); gl_FragColor = vec4(vC * (uAmb + uKeyCol * d) + uAdd, uOp); }';
    const KEY = new V3(0.45, 0.8, 0.4).normalize();
    const mat = (amb, key, op, opt) => new T.ShaderMaterial(Object.assign({
      uniforms: { uKey: { value: KEY }, uKeyCol: { value: new V3(key, key * 0.96, key * 0.9) }, uAmb: { value: new V3(amb[0], amb[1], amb[2]) }, uAdd: { value: new V3() }, uOp: { value: op } },
      vertexShader: VS, fragmentShader: FS
    }, opt || {}));
    const LIT = mat([0.34, 0.37, 0.5], 0.9, 1), GLOW = mat([1, 1, 1], 0, 1), ROOM = mat([1, 1, 1], 0, 1, { side: T.BackSide });
    const ADD = mat([1, 1, 1], 0, 0.75, { transparent: true, blending: T.AdditiveBlending, depthWrite: false });

    let CUR = null;
    function within(m, fn) { const prev = CUR; CUR = prev ? prev.clone().multiply(m) : m; fn(); CUR = prev; }
    function Batch() {
      const pos = [], nor = [], col = [], v = new V3(), nm = new T.Matrix3();
      const rgb = (hex) => col.push((hex >> 16 & 255) / 255, (hex >> 8 & 255) / 255, (hex & 255) / 255);
      return {
        add(g, m, hex) {
          if (CUR) m = CUR.clone().multiply(m);
          const gi = g.index ? g.toNonIndexed() : g, p = gi.attributes.position, n = gi.attributes.normal;
          nm.getNormalMatrix(m);
          for (let i = 0; i < p.count; i++) {
            v.fromBufferAttribute(p, i).applyMatrix4(m); pos.push(v.x, v.y, v.z);
            v.fromBufferAttribute(n, i).applyMatrix3(nm).normalize(); nor.push(v.x, v.y, v.z);
            rgb(hex);
          }
        },
        raw(p, n, hex) { pos.push(p.x, p.y, p.z); nor.push(n.x, n.y, n.z); rgb(hex); },
        mesh(material, parent) {
          if (!pos.length) return null;
          const g = new T.BufferGeometry();
          g.setAttribute('position', new T.BufferAttribute(new Float32Array(pos), 3));
          g.setAttribute('normal', new T.BufferAttribute(new Float32Array(nor), 3));
          g.setAttribute('aCol', new T.BufferAttribute(new Float32Array(col), 3));
          const m = new T.Mesh(g, material); m.frustumCulled = false; (parent || show).add(m);
          return m;
        }
      };
    }
    const EU = (rx, ry, rz) => new T.Quaternion().setFromEuler(new T.Euler(rx || 0, ry || 0, rz || 0));
    const MX = (x, y, z, rx, ry, rz, sx, sy, sz) => new M4().compose(new V3(x, y, z), EU(rx, ry, rz), new V3(sx || 1, sy || 1, sz || 1));
    // Every primitive is addressed by its CENTRE.
    const shapes = (b) => ({
      b,
      box: (c, w, h, d, x, y, z, rx, ry, rz) => b.add(new T.BoxGeometry(w, h, d), MX(x, y, z, rx, ry, rz), c),
      cyl: (c, rt, rb, h, x, y, z, seg, rx, ry, rz, open) => b.add(new T.CylinderGeometry(rt, rb, h, seg || 12, 1, !!open), MX(x, y, z, rx, ry, rz), c),
      sph: (c, r, x, y, z, sx, sy, sz, seg) => b.add(new T.SphereGeometry(r, seg || 14, Math.max(8, (seg || 14) - 4)), MX(x, y, z, 0, 0, 0, sx, sy, sz), c),
      tor: (c, R, r, x, y, z, rx, ry, rz, seg) => b.add(new T.TorusGeometry(R, r, 6, seg || 28), MX(x, y, z, rx, ry, rz), c),
      rock: (c, r, x, y, z, sx, sy, sz, ry) => {
        const g0 = new T.IcosahedronGeometry(r, 0), g = g0.index ? g0.toNonIndexed() : g0; g.computeVertexNormals();
        b.add(g, MX(x, y, z, ry * 0.7, ry, 0, sx, sy, sz), c);
      }
    });
    const WL = Batch(), WG = Batch(), WR = Batch();
    const L = shapes(WL), G = shapes(WG), R = shapes(WR);
    // Movable assembly: one lit + one glow mesh inside its own Group.
    function asm(fn, parent) {
      const bl = Batch(), bg = Batch(), g = new T.Group();
      fn(shapes(bl), shapes(bg)); bl.mesh(LIT, g); bg.mesh(GLOW, g); (parent || show).add(g);
      return g;
    }
    function tex(w, h, draw) {
      const c = document.createElement('canvas'); c.width = w; c.height = h; draw(c.getContext('2d'), w, h);
      const t = new T.CanvasTexture(c); if (T.sRGBEncoding !== undefined) t.encoding = T.sRGBEncoding;
      return t;
    }
    const blobTex = tex(128, 128, (g) => { const gr = g.createRadialGradient(64, 64, 2, 64, 64, 64); gr.addColorStop(0, 'rgba(255,255,255,1)'); gr.addColorStop(0.35, 'rgba(255,255,255,0.35)'); gr.addColorStop(1, 'rgba(255,255,255,0)'); g.fillStyle = gr; g.fillRect(0, 0, 128, 128); });
    const basic = (map, opt) => new T.MeshBasicMaterial(Object.assign({ map, fog: false }, opt || {}));
    function plane(material, w, h, m) {
      const p = new T.Mesh(new T.PlaneGeometry(w, h), material);
      p.matrixAutoUpdate = false; p.matrix.copy(CUR ? CUR.clone().multiply(m) : m); p.frustumCulled = false; show.add(p);
      return p;
    }
    function points(n, fn, size, atten) {
      const a = new Float32Array(n * 3), c = new Float32Array(n * 3), v = new V3(), col = new T.Color();
      for (let i = 0; i < n; i++) { fn(i, v, col); a[i * 3] = v.x; a[i * 3 + 1] = v.y; a[i * 3 + 2] = v.z; c[i * 3] = col.r; c[i * 3 + 1] = col.g; c[i * 3 + 2] = col.b; }
      const g = new T.BufferGeometry();
      g.setAttribute('position', new T.BufferAttribute(a, 3)); g.setAttribute('color', new T.BufferAttribute(c, 3));
      const m = new T.Points(g, new T.PointsMaterial({ size, map: blobTex, vertexColors: true, sizeAttenuation: !!atten, transparent: true, depthWrite: false, fog: false, blending: T.AdditiveBlending }));
      m.frustumCulled = false;
      return m;
    }
    const galaxyFn = (Rg) => (i, v, col) => {
      const rr = Rg * Math.pow(rnd(), 0.7), a = (i % 3) * 2.094 + rr / Rg * 5 + (rnd() - 0.5) * 0.7;
      v.set(Math.cos(a) * rr, (rnd() - 0.5) * Rg * 0.07 * (1.3 - rr / Rg), Math.sin(a) * rr);
      col.setHSL(lerp(0.09, 0.62, clamp(rr / Rg + (rnd() - 0.5) * 0.3, 0, 1)), 0.75, 0.55 + rnd() * 0.25);
    };

    /* ---------------------------------------------------------------- track: turtle -> spline -> 1 m frames */
    const ctrl = [new V3(0, 0, 0)], seg = {}, order = [];
    {
      let h = 0; const cp = new V3();
      for (const [name, len, turn, dy, v] of SEGS) {
        const n = Math.max(2, Math.round(len / 9)), dth = turn * PI / 180 / n, y0 = cp.y;
        const info = seg[name] = { name, i0: ctrl.length - 1, v, k: turn * PI / 180 / len };
        for (let k = 1; k <= n; k++) {
          h -= dth / 2; cp.x += Math.sin(h) * len / n; cp.z += Math.cos(h) * len / n; h -= dth / 2;
          cp.y = y0 + dy * sm(k / n); ctrl.push(cp.clone());
        }
        info.i1 = ctrl.length - 1; order.push(info);
      }
    }
    const SUB = 12, ND = (ctrl.length - 1) * SUB, dense = [], cum = [0];
    {
      const curve = new T.CatmullRomCurve3(ctrl, false, 'centripetal');
      for (let j = 0; j <= ND; j++) { dense.push(curve.getPoint(j / ND)); if (j) cum.push(cum[j - 1] + dense[j].distanceTo(dense[j - 1])); }
    }
    const LEN = cum[ND], NS = Math.floor(LEN) + 1, END = NS - 2.5, S0 = 12;
    for (const q of order) { q.s0 = cum[q.i0 * SUB]; q.s1 = cum[q.i1 * SUB]; }
    const segAt = (s) => { for (const q of order) if (s < q.s1) return q; return order[order.length - 1]; };
    const PT = [], TN = [], UP = [];
    for (let i = 0, j = 0; i < NS; i++) {
      while (j < ND - 1 && cum[j + 1] < i) j++;
      PT.push(dense[j].clone().lerp(dense[j + 1], clamp((i - cum[j]) / ((cum[j + 1] - cum[j]) || 1), 0, 1)));
    }
    {
      let bank = new Float32Array(NS);
      for (let i = 0; i < NS; i++) { const q = segAt(i); bank[i] = clamp(Math.atan(q.v * q.v * q.k / 9.8) * 0.62, -0.8, 0.8); }
      for (let pass = 0; pass < 2; pass++) {
        const b2 = new Float32Array(NS);
        for (let i = 0; i < NS; i++) { let a = 0, n = 0; for (let k = -12; k <= 12; k++) { const m = i + k; if (m >= 0 && m < NS) { a += bank[m]; n++; } } b2[i] = a / n; }
        bank = b2;
      }
      for (let i = 0; i < NS; i++) {
        const t = PT[Math.min(NS - 1, i + 1)].clone().sub(PT[Math.max(0, i - 1)]).normalize();
        const r0 = new V3().crossVectors(t, WUP).normalize(), u0 = new V3().crossVectors(r0, t);
        TN.push(t); UP.push(u0.multiplyScalar(Math.cos(bank[i])).addScaledVector(r0, Math.sin(bank[i])).normalize());
      }
    }
    // Track frame at arc length s: position, tangent, banked up and right (= tangent x up).
    function frame(s, p, t, u, r) {
      s = clamp(s, 0, NS - 1.001); const i = Math.floor(s), k = s - i;
      p.copy(PT[i]).lerp(PT[i + 1], k); t.copy(TN[i]).lerp(TN[i + 1], k).normalize(); u.copy(UP[i]).lerp(UP[i + 1], k).normalize();
      if (r) r.crossVectors(t, u).normalize();
    }
    const _p = new V3(), _t = new V3(), _u = new V3(), _r = new V3();
    const S = (name, f) => lerp(seg[name].s0, seg[name].s1, f || 0);
    const basisM = (s) => { frame(s, _p, _t, _u, _r); return new M4().makeBasis(_r.clone().negate(), _u.clone(), _t.clone()).setPosition(_p); };
    // Point offset from the track in the level heading frame (forward / right / up).
    function anchor(name, f, fwd, right, up) {
      frame(S(name, f), _p, _t, _u, _r);
      const l = Math.hypot(_t.x, _t.z) || 1, tx = _t.x / l, tz = _t.z / l;
      return new V3(_p.x + tx * (fwd || 0) - tz * (right || 0), _p.y + (up || 0), _p.z + tz * (fwd || 0) + tx * (right || 0));
    }
    const frameM = (name, f) => { const q = anchor(name, f); return new M4().compose(q, EU(0, Math.atan2(_t.x, _t.z), 0), new V3(1, 1, 1)); };

    function rail(b, side, drop, rad, hex) {
      const ring = (s) => {
        frame(s, _p, _t, _u, _r);
        const c = _p.clone().addScaledVector(_r, side).addScaledVector(_u, -drop);
        return [0, 1, 2, 3].map((k) => { const a = k * PI / 2 + PI / 4, n = _r.clone().multiplyScalar(Math.cos(a)).addScaledVector(_u, Math.sin(a)); return [c.clone().addScaledVector(n, rad), n]; });
      };
      let a = ring(0);
      for (let s = 1.5; s <= NS - 1; s += 1.5) {
        const c = ring(s);
        for (let k = 0; k < 4; k++) { const k2 = (k + 1) % 4; for (const q of [a[k], c[k2], a[k2], a[k], c[k], c[k2]]) b.raw(q[0], q[1], hex); }
        a = c;
      }
    }
    rail(WL, 0.62, 0.05, 0.07, 0x586174); rail(WL, -0.62, 0.05, 0.07, 0x586174); rail(WG, 0, 0.32, 0.045, 0x1e40af);
    for (let s = 1; s < NS - 1; s += 3) WL.add(new T.BoxGeometry(1.5, 0.08, 0.22), basisM(s).multiply(MX(0, -0.16, 0)), 0x1f2937);
    // Tunnel rings are only lit while the train is near them, so they never clutter the view from elsewhere.
    const tunnels = [];
    const rings = (a, b, step, Rr, cols) => {
      const bt = Batch();
      for (let s = a, i = 0; s < b; s += step, i++) bt.add(new T.TorusGeometry(Rr, 0.16, 5, 26), basisM(s), cols[i % cols.length]);
      tunnels.push({ m: bt.mesh(ADD), a: a - 12, b: b + 70 });
    };
    rings(S('launch', 0.16), S('launch', 1), 7, 6.5, [0x22d3ee, 0x8b5cf6]);
    rings(S('dive', 0), S('rewind', 1), 9, 7, [0xfbbf24, 0xf472b6]);
    rings(S('fling', 0.05), S('fling', 0.7), 9, 7, [0x22d3ee, 0xa7f3d0]);

    /* ---------------------------------------------------------------- Starcharter: launch bay, hull, deck, pre-show rooms */
    function bayShell(z0, z1, endWall) {
      const len = z1 - z0, zc = (z0 + z1) / 2;
      L.box(0x1a2238, 16, 0.4, len, 0, -0.8, zc); L.box(0x232d48, 16, 0.5, len, 0, 8.6, zc);
      for (const sx of [-1, 1]) {
        L.box(0x2a3554, 0.5, 9.4, len, sx * 8.2, 3.9, zc);
        G.box(0x38bdf8, 0.12, 0.16, len, sx * 7.9, 1.3, zc); G.box(0xfbbf24, 0.12, 0.1, len, sx * 7.9, 6.6, zc);
      }
      for (let z = z0 + 4; z < z1; z += 8) {
        L.box(0x34406a, 16, 0.5, 0.8, 0, 8.2, z); G.box(0xcfe8ff, 5, 0.12, 0.5, 0, 7.9, z);
        for (const sx of [-1, 1]) L.box(0x34406a, 0.6, 9, 0.8, sx * 7.8, 3.9, z);
      }
      L.box(0x3a4670, 5.4, 0.9, len - 8, 5.3, -0.15, zc); G.box(0xfde047, 0.14, 0.04, len - 8, 2.75, 0.32, zc);
      L.box(0x1d2540, 16, 9.4, 0.5, 0, 3.9, endWall);
      for (let i = 0; i < 4; i++) G.box(0xfbbf24, 4, 0.4, 0.2, 0, 3.4, endWall - Math.sign(endWall - zc) * 0.4, 0, 0, i * PI / 4);
    }
    bayShell(-14, 52, -14);
    // Hull is four blocks around the bay so the mouth stays open; the pre-show rooms hide inside the top block.
    function hull(zMouth, zBack, deck) {
      const dir = Math.sign(zBack - zMouth), len = Math.abs(zBack - zMouth), zc = (zMouth + zBack) / 2;
      L.box(0x2b3a66, 48, 16, len, 0, 16.9, zc); L.box(0x1f2a4d, 48, 9, len, 0, -5.5, zc);
      for (const sx of [-1, 1]) {
        L.box(0x26335b, 16, 9.9, len, sx * 16.4, 3.9, zc); G.box(0xfbbf24, 0.1, 0.5, len - 12, sx * 24.45, 9.4, zc);
        for (let z = 8; z < len - 6; z += 6) { const zz = zMouth + dir * z; if (!deck || sx > 0 || zz < -6 || zz > 28) G.box(0xfde68a, 0.1, 0.5, 2.4, sx * 24.45, 5, zz); }
        L.box(0x22305a, 34, 2.2, 44, sx * 40, 18, zc + dir * 30, 0, sx * dir * -0.3, 0);
      }
      L.box(0x33437a, 14, 10, 30, 0, 29.9, zc + dir * 14); G.box(0xbfdbfe, 12, 1, 0.2, 0, 31, zc - dir * 1.1);
      for (const x of [-14, 0, 14]) G.sph(0x67e8f9, 5, x, 8, zBack + dir, 1, 1, 1.6);
      for (let i = 0; i < 4; i++) G.box(0xfbbf24, 11, 1, 0.2, 0, 17, zMouth - dir * 0.1, 0, 0, i * PI / 4);
    }
    hull(52, -110, true);
    // Launch gantry lights along the open rail between the bay mouth and the jump point.
    for (let s = S('turn', 0.05); s < S('gate', 1); s += 7) within(basisM(s), () => { L.box(0x2a3554, 3.4, 0.3, 1.2, 0, -0.75, 0); for (const sx of [-1, 1]) G.box(0x38bdf8, 0.2, 0.2, 0.2, sx * 1.6, -0.5, 0); });
    // Observation deck on the starboard flank (right = -x), open towards Eson.
    L.box(0x2a3554, 9, 0.4, 24, -28.8, 1.5, 11); L.box(0x232d48, 9, 0.4, 24, -28.8, 8.3, 11);
    for (const z of [-1, 23]) L.box(0x2a3554, 9, 6.6, 0.4, -28.8, 4.9, z);
    for (let z = -1; z <= 23; z += 6) L.box(0x3b4a78, 0.3, 6.6, 0.3, -33.2, 4.9, z);
    G.box(0x38bdf8, 0.1, 0.1, 24, -33.1, 2.7, 11); G.box(0xfbbf24, 0.1, 0.1, 24, -24.6, 7.6, 11);
    // Galaxarium.
    const GZc = -62, FY = 10.2;
    L.cyl(0x141a30, 11, 11, 0.4, 0, FY, GZc, 32); R.sph(0x0a0f24, 11, 0, FY + 0.2, GZc, 1, 1.15, 1, 24);
    G.tor(0x38bdf8, 4.2, 0.08, 0, FY + 0.3, GZc, PI / 2); L.cyl(0x2a3554, 1.2, 1.6, 0.9, 0, FY + 0.6, GZc, 16);
    for (let i = 0; i < 10; i++) { const a = i / 10 * PI * 2; G.box(i % 2 ? 0x0e7490 : 0x92400e, 2.4, 1.3, 0.1, Math.sin(a) * 10.2, FY + 2.6, GZc + Math.cos(a) * 10.2, 0, a, 0); }
    const holo = points(2200, galaxyFn(3.8), 0.16, true); holo.position.set(0, FY + 3.6, GZc); holo.rotation.x = 0.35; show.add(holo);
    const domeStars = points(380, (i, v, col) => { const a = rnd() * PI * 2, e = rnd() * 1.4 + 0.1; v.set(Math.cos(a) * Math.cos(e) * 10.5, FY + 0.4 + Math.sin(e) * 12, GZc + Math.sin(a) * Math.cos(e) * 10.5); col.setHSL(0.58, 0.4, 0.6 + rnd() * 0.3); }, 0.22, true);
    show.add(domeStars);
    const globes = [0x3b82f6, 0xf59e0b].map((c) => asm((l, g) => { g.sph(c, 0.5, 0, 0, 0); g.tor(0xe0f2fe, 0.75, 0.02, 0, 0, 0, PI / 2); }));
    // Phase Chamber.
    const CZc = -22;
    L.cyl(0x161d36, 7, 7, 0.4, 0, FY, CZc, 8); L.cyl(0x0d1228, 7, 7, 0.4, 0, FY + 9, CZc, 8); R.cyl(0x101833, 7, 7, 9, 0, FY + 4.5, CZc, 8, 0, 0, 0, true);
    for (let i = 0; i < 8; i++) { const a = (i + 0.5) / 8 * PI * 2; G.box(i % 2 ? 0x38bdf8 : 0xfbbf24, 0.16, 7.4, 0.1, Math.sin(a) * 6.4, FY + 4.4, CZc + Math.cos(a) * 6.4, 0, a, 0); }
    L.cyl(0x2a3554, 0.9, 1.3, 1.4, 0, FY + 0.9, CZc, 12); G.tor(0x38bdf8, 2.6, 0.06, 0, FY + 0.3, CZc, PI / 2);
    plane(basic(tex(256, 352, (g, w, h) => {
      g.fillStyle = 'rgba(56,189,248,0.12)'; g.fillRect(0, 0, w, h);
      g.fillStyle = '#38bdf8'; g.beginPath(); g.moveTo(34, 304); g.quadraticCurveTo(128, 110, 222, 304); g.closePath(); g.fill();
      g.fillStyle = '#7dd3fc'; g.beginPath(); g.arc(128, 106, 44, 0, 7); g.fill();
      g.fillStyle = '#e0f2fe'; g.beginPath(); g.ellipse(128, 76, 54, 34, 0, PI, 0); g.fill();
      g.fillStyle = '#fbbf24'; for (let i = 0; i < 4; i++) { g.save(); g.translate(128, 240); g.rotate(i * PI / 4); g.fillRect(-28, -4, 56, 8); g.restore(); }
      g.fillStyle = 'rgba(2,6,23,0.4)'; for (let y = 0; y < h; y += 4) g.fillRect(0, y, w, 1);
      g.fillStyle = '#e0f2fe'; g.font = 'bold 19px sans-serif'; g.textAlign = 'center'; g.fillText('NOVA PRIME · 诺瓦至尊', 128, 336);
    }), { transparent: true, opacity: 0.92, side: T.DoubleSide, depthWrite: false }), 3.4, 4.7, MX(0, FY + 4, CZc + 6.1, 0, PI, 0));

    function mkGen(r, parent) {
      const g = new T.Group(); asm((l, gl) => { gl.sph(0xfff7d6, r * 0.42, 0, 0, 0); }, g);
      g.userData.rings = [0, 1, 2].map((i) => asm((l, gl) => { gl.tor(i === 1 ? 0x67e8f9 : 0xfbbf24, r * (0.7 + i * 0.16), r * 0.045, 0, 0, 0); }, g));
      (parent || show).add(g);
      return g;
    }
    const gen1 = mkGen(1.1); gen1.position.set(0, FY + 3, CZc);

    /* ---------------------------------------------------------------- arrival dock, space scenery */
    within(frameM('brake', 0), () => {
      bayShell(-4, 96, 96); hull(-4, 130);
      plane(basic(tex(512, 128, (g, w, h) => {
        g.fillStyle = '#0b1220'; g.fillRect(0, 0, w, h); g.strokeStyle = '#fbbf24'; g.lineWidth = 6; g.strokeRect(5, 5, w - 10, h - 10);
        g.textAlign = 'center'; g.fillStyle = '#fde68a'; g.font = 'bold 44px sans-serif'; g.fillText('欢迎回到特拉星', w / 2, 60);
        g.fillStyle = '#7dd3fc'; g.font = 'bold 22px sans-serif'; g.fillText('WELCOME BACK TO TERRA · NOVA CORPS', w / 2, 100);
      })), 9, 2.25, MX(0, 7, 95.6, 0, PI, 0));
    });
    const hRad = 1 / Math.abs(seg.helix.k), mRad = 1 / Math.abs(seg.moon.k), gRad = 1 / Math.abs(seg.rewind.k);
    for (let i = 0; i < 70; i++) {
      const rr = 1.2 + rnd() * 4.5, side = (rnd() < 0.5 ? -1 : 1) * (9 + rr * 1.5 + rnd() * 38), q = anchor('sweep', rnd(), 0, side, (rnd() - 0.5) * 44);
      L.rock([0x6b6257, 0x7c7468, 0x544c44][i % 3], rr, q.x, q.y, q.z, 1, 0.7 + rnd() * 0.5, 0.8 + rnd() * 0.5, rnd() * 6);
    }
    WL.mesh(LIT); WG.mesh(GLOW); WR.mesh(ROOM);

    const sky = new T.Group(); sky.position.set(-130, 250, 350); show.add(sky);
    sky.add(new T.Mesh(new T.SphereGeometry(1100, 32, 20), new T.MeshBasicMaterial({ color: 0x02030b, side: T.BackSide, fog: false })));
    sky.add(points(4200, (i, v, col) => {
      const a = rnd() * PI * 2, y = rnd() * 2 - 1, rr = Math.sqrt(1 - y * y), d = 960 + rnd() * 100;
      v.set(Math.cos(a) * rr * d, y * d, Math.sin(a) * rr * d); col.setHSL(rnd() < 0.7 ? 0.6 : 0.1, 0.5, 0.45 + rnd() * 0.5);
    }, 5, false));
    const sprite = (color, size, x, y, z, op, par) => {
      const s = new T.Sprite(new T.SpriteMaterial({ map: blobTex, color, transparent: true, opacity: op, blending: T.AdditiveBlending, depthWrite: false, fog: false }));
      s.position.set(x, y, z); s.scale.setScalar(size); (par || show).add(s);
      return s;
    };
    for (let i = 0; i < 16; i++) {
      const a = rnd() * PI * 2, e = (rnd() - 0.5) * 1.5, d = 600 + rnd() * 150;
      sprite([0x7c3aed, 0x0ea5e9, 0xdb2777, 0x2563eb, 0xf59e0b][i % 5], 260 + rnd() * 320, Math.cos(a) * Math.cos(e) * d, Math.sin(e) * d, Math.sin(a) * Math.cos(e) * d, 0.3, sky);
    }
    sprite(0xfff3c4, 150, 520, 330, -420, 1, sky);
    const ball = (r, t, x, y, z, opt) => { const m = new T.Mesh(new T.SphereGeometry(r, 48, 32), basic(t, opt)); m.position.set(x, y, z); m.frustumCulled = false; show.add(m); return m; };
    const earth = ball(330, tex(1024, 512, (g, w, h) => {
      const gr = g.createLinearGradient(0, 0, 0, h); gr.addColorStop(0, '#0a2a6b'); gr.addColorStop(0.5, '#1766cc'); gr.addColorStop(1, '#0a2a6b'); g.fillStyle = gr; g.fillRect(0, 0, w, h);
      for (let i = 0; i < 26; i++) {
        const cx = rnd() * w, cy = h * (0.2 + rnd() * 0.6);
        for (let j = 0; j < 22; j++) { g.fillStyle = ['#2f7d3a', '#3f8f45', '#8a7a45', '#256b33'][(rnd() * 4) | 0]; g.beginPath(); g.ellipse(cx + (rnd() - 0.5) * 120, cy + (rnd() - 0.5) * 70, 8 + rnd() * 30, 6 + rnd() * 20, rnd() * 3, 0, 7); g.fill(); }
      }
      g.fillStyle = '#eef6ff'; g.fillRect(0, 0, w, 20); g.fillRect(0, h - 24, w, 24);
      for (let i = 0; i < 280; i++) { g.fillStyle = 'rgba(255,255,255,' + (0.1 + rnd() * 0.3) + ')'; g.beginPath(); g.ellipse(rnd() * w, rnd() * h, 14 + rnd() * 50, 3 + rnd() * 9, (rnd() - 0.5) * 0.6, 0, 7); g.fill(); }
    }), -190, -430, 170);
    const atmo = new T.Mesh(new T.SphereGeometry(338, 48, 32), new T.MeshBasicMaterial({ color: 0x3b82f6, transparent: true, opacity: 0.22, blending: T.AdditiveBlending, depthWrite: false, fog: false }));
    atmo.position.copy(earth.position); atmo.frustumCulled = false; show.add(atmo);
    const mc = anchor('moon', 0, 0, -mRad, -3);
    ball(mRad * 0.6, tex(512, 256, (g, w, h) => {
      g.fillStyle = '#9a9aa2'; g.fillRect(0, 0, w, h);
      for (let i = 0; i < 150; i++) { const x = rnd() * w, y = rnd() * h, rr = 3 + rnd() * 16; g.fillStyle = 'rgba(40,40,48,' + (0.15 + rnd() * 0.3) + ')'; g.beginPath(); g.arc(x, y, rr, 0, 7); g.fill(); g.strokeStyle = 'rgba(230,230,235,0.25)'; g.beginPath(); g.arc(x, y, rr, 3.4, 5.6); g.stroke(); }
    }), mc.x, mc.y, mc.z);
    const hc = anchor('helix', 0, 0, hRad, -6);
    const giant = ball(hRad * 0.5, tex(256, 128, (g, w, h) => {
      for (let y = 0; y < h; y += 4) { g.fillStyle = ['#f6c177', '#e8a05c', '#f9dfb0', '#c9713f', '#b06ab3', '#f3d08a'][(y / 4 + ((rnd() * 2) | 0)) % 6 | 0]; g.fillRect(0, y, w, 4); }
      g.fillStyle = 'rgba(180,60,40,0.7)'; g.beginPath(); g.ellipse(170, 80, 22, 9, 0, 0, 7); g.fill();
    }), hc.x, hc.y, hc.z);
    const ringM = new T.Mesh(new T.RingGeometry(hRad * 0.62, hRad * 0.86, 64), basic(tex(256, 256, (g) => {
      for (let rr = 78; rr < 128; rr += 2) { g.strokeStyle = 'rgba(' + [253, 230, 190].join(',') + ',' + (0.15 + rnd() * 0.6) + ')'; g.lineWidth = 2; g.beginPath(); g.arc(128, 128, rr, 0, 7); g.stroke(); }
    }), { transparent: true, side: T.DoubleSide, depthWrite: false }));
    ringM.position.copy(giant.position); ringM.rotation.set(PI / 2 - 0.3, 0.2, 0); ringM.frustumCulled = false; show.add(ringM);
    const galaxyTilt = new T.Group(); galaxyTilt.position.copy(anchor('rewind', 0, 0, -gRad, -8)); galaxyTilt.rotation.set(0.35, 0, 0.2); show.add(galaxyTilt);
    const galaxy = points(7000, galaxyFn(gRad * 0.82), 2.6, true); galaxyTilt.add(galaxy);
    galaxyTilt.add((() => { const s = new T.Sprite(new T.SpriteMaterial({ map: blobTex, color: 0xffe6b0, transparent: true, blending: T.AdditiveBlending, depthWrite: false, fog: false })); s.scale.setScalar(gRad * 0.7); return s; })());

    const swirlTex = tex(256, 256, (g) => {
      const gr = g.createRadialGradient(128, 128, 4, 128, 128, 128); gr.addColorStop(0, 'rgba(255,255,255,1)'); gr.addColorStop(0.25, 'rgba(120,220,255,0.7)'); gr.addColorStop(0.7, 'rgba(110,60,220,0.3)'); gr.addColorStop(1, 'rgba(0,0,0,0)');
      g.fillStyle = gr; g.fillRect(0, 0, 256, 256);
      for (let i = 0; i < 420; i++) { const a = i * 0.19, rr = 6 + i * 0.28; g.fillStyle = 'rgba(255,255,255,' + (0.5 - i / 1000) + ')'; for (let k = 0; k < 3; k++) { g.beginPath(); g.arc(128 + Math.cos(a + k * 2.094) * rr, 128 + Math.sin(a + k * 2.094) * rr, 1.6, 0, 7); g.fill(); } }
    });
    const portal = (Rr) => {
      const m = new T.Mesh(new T.CircleGeometry(1, 48), basic(swirlTex, { transparent: true, blending: T.AdditiveBlending, depthWrite: false, side: T.DoubleSide }));
      m.userData = { R: Rr, k: 0, to: 0 }; m.frustumCulled = false; m.visible = false; show.add(m);
      return m;
    };
    const portalA = portal(9.5), portalB = portal(170);
    portalA.position.copy(anchor('launch', 0.1)); portalA.quaternion.setFromRotationMatrix(basisM(S('launch', 0.1)));
    const GATE = anchor('gate', 1), EA = anchor('gate', 1, 330, 0, -40), BANG = anchor('bang', 0.9), EB = anchor('bang', 0.9, 250, -45, -55);
    const VORTEX = EB.clone().add(EB.clone().sub(BANG).setY(0).normalize().multiplyScalar(150));
    portalB.position.copy(VORTEX); portalB.lookAt(BANG.clone().add(show.position));
    const bangS = sprite(0xfff1c9, 200, 0, 0, 0, 0); bangS.position.copy(anchor('bang', 1, 430, 0, 20));

    /* ---------------------------------------------------------------- Eson, the Milano, the evacuation pods */
    const AR = 0x3b3657, AR2 = 0x57507e, DK = 0x1c1a2c, GD = 0x9a7b3a, PG = 0xa78bfa;
    const eson = new T.Group(); show.add(eson);
    asm((l, g) => {
      l.box(AR, 3.4, 3.2, 2, 0, 1.6, 0); l.box(AR2, 2.6, 1.4, 2.2, 0, 2.2, 0.15); l.box(DK, 2.2, 1.3, 1.5, 0, -0.5, 0); l.box(GD, 3.5, 0.25, 2.1, 0, 0.1, 0);
      g.box(PG, 0.16, 2.6, 0.1, 0, 1.7, 1.08);
      for (const s of [-1, 1]) {
        g.box(PG, 0.12, 1.6, 0.1, s * 0.9, 1.9, 1.08, 0, 0, s * 0.35);
        l.sph(AR2, 1.25, s * 2.5, 3, 0, 1.35, 0.85, 1.15); l.box(GD, 1.2, 0.2, 2.2, s * 2.9, 3.5, 0, 0, 0, -s * 0.4);
        l.box(AR, 1, 4.4, 1.2, s * 0.8, -3.3, 0); l.box(AR2, 1.2, 1.2, 1.5, s * 0.8, -2.4, 0.1); l.box(DK, 1.3, 0.7, 2, s * 0.8, -5.6, 0.3);
        l.box(AR2, 1.1, 1.6, 0.3, s * 1.1, -1.1, 0.9, 0.2);
        l.box(AR2, 0.3, 2.6, 1.2, s * 1.05, 5, -0.1, 0, 0, -s * 0.12); l.box(GD, 0.2, 1.4, 0.6, s * 0.75, 6.5, 0, 0, 0, -s * 0.3);
        for (let i = 0; i < 3; i++) g.box(0xe0f2fe, 0.34, 0.1, 0.06, s * 0.32, 4.95 - i * 0.28, 0.95, 0, 0, s * 0.18);
      }
      l.box(AR, 0.9, 2.6, 1, 2.9, 1.4, 0); l.box(AR2, 1, 2.4, 1.1, 3, -1, 0.2); l.box(DK, 0.9, 0.9, 1, 3, -2.5, 0.3);
      l.box(DK, 1.1, 0.6, 1, 0, 3.5, 0); l.box(AR, 1.7, 1.9, 1.6, 0, 4.7, 0); l.box(AR2, 2.1, 0.5, 1.8, 0, 5.75, 0); l.box(DK, 1.3, 1.3, 0.2, 0, 4.6, 0.82); l.box(GD, 0.3, 1.8, 0.5, 0, 6.6, 0);
    }, eson);
    const esonArm = new T.Group(); esonArm.position.set(-2.9, 2.7, 0); eson.add(esonArm);
    asm((l) => {
      l.box(AR, 0.9, 2.6, 1, 0, -1.3, 0); l.box(AR2, 1, 2.6, 1.1, 0, -3.7, 0); l.box(DK, 1.2, 0.5, 1.2, 0, -5.2, 0);
      for (let i = 0; i < 4; i++) l.box(DK, 0.24, 0.9, 0.26, -0.45 + i * 0.3, -5.9, 0.35, 0.5);
    }, esonArm);
    const gen2 = mkGen(1, esonArm); gen2.position.set(0, -6.4, 1);
    const faceTo = (obj, from, to) => { obj.position.copy(from); obj.rotation.set(0, Math.atan2(to.x - from.x, to.z - from.z), 0); };

    const milano = asm((l, g) => {
      const O = 0xe8742a, B = 0x2b5fb0, D = 0x1f2937;
      l.box(O, 2.2, 1.1, 7, 0, 0, 0); l.box(B, 1.6, 0.9, 3, 0, 0.1, 4.6); l.box(D, 1, 0.5, 1.6, 0, -0.1, 6.6); g.sph(0x7dd3fc, 0.9, 0, 0.55, 3.6, 1, 0.7, 1.6);
      for (const s of [-1, 1]) {
        l.box(B, 6.5, 0.3, 3.2, s * 4, 0.6, -0.6, 0, s * 0.45, s * 0.28); l.box(O, 3, 0.25, 1.6, s * 7.6, 1.5, -2.2, 0, s * 0.6, s * 0.28);
        l.box(B, 0.25, 2, 2.2, s * 1, 1.2, -2.8, 0, 0, -s * 0.3); l.cyl(D, 0.6, 0.75, 2.2, s * 0.9, -0.1, -3.8, 10, PI / 2); g.sph(0x7dd3fc, 0.6, s * 0.9, -0.1, -5, 1, 1, 1.8);
      }
    });
    milano.scale.setScalar(1.5);
    const cars = [0, 1, 2, 3].map(() => asm((l, g) => {
      const N = 0x1e3a8a, D = 0x111827, Gd = 0xfbbf24;
      l.box(D, 1.9, 0.3, 3.2, 0, 0.3, 0); l.box(N, 2.1, 0.5, 3.3, 0, 0.6, 0); l.box(N, 2.1, 0.4, 0.5, 0, 0.82, 1.55, -0.5); g.box(Gd, 0.9, 0.08, 0.06, 0, 0.86, 1.82);
      for (const s of [-1, 1]) { l.box(N, 0.22, 0.3, 3.3, s * 1.05, 0.95, 0); g.box(0x38bdf8, 0.06, 0.08, 3.1, s * 1.17, 0.9, 0); }
      for (const z of [0.25, -1.05]) {
        l.box(D, 1.8, 1.25, 0.25, 0, 1.4, z - 0.42, -0.12);
        for (const s of [-1, 1]) { l.box(0x374151, 0.7, 0.16, 0.7, s * 0.45, 0.92, z); l.box(Gd, 0.5, 0.05, 0.05, s * 0.45, 1.02, z + 0.5); }
      }
    }));
    const dustU = { uC: { value: new V3() } };
    const dust = new T.Points(new T.BufferGeometry(), new T.ShaderMaterial({
      uniforms: dustU, transparent: true, blending: T.AdditiveBlending, depthWrite: false,
      vertexShader: 'uniform vec3 uC; void main(){ vec3 q = mod(position - uC + 60.0, 120.0) - 60.0; vec4 mv = viewMatrix * vec4(q + uC, 1.0); gl_PointSize = clamp(110.0 / -mv.z, 1.0, 3.5); gl_Position = projectionMatrix * mv; }',
      fragmentShader: 'void main(){ gl_FragColor = vec4(0.75, 0.86, 1.0, 0.75); }'
    }));
    { const a = new Float32Array(700 * 3); for (let i = 0; i < a.length; i++) a[i] = rnd() * 120; dust.geometry.setAttribute('position', new T.BufferAttribute(a, 3)); }
    dust.frustumCulled = false; show.add(dust);

    /* ---------------------------------------------------------------- captions + screen flash overlay */
    const ui = document.createElement('div');
    ui.style.cssText = 'position:fixed;inset:0;pointer-events:none;z-index:39;display:none';
    ui.innerHTML = '<div style="position:absolute;inset:0;opacity:0"></div>' +
      '<div role="status" aria-live="polite" style="position:absolute;left:50%;bottom:124px;transform:translateX(-50%);width:max-content;max-width:min(760px,88vw);padding:9px 18px 11px;border-radius:12px;background:rgba(6,10,24,.8);border:1px solid rgba(125,211,252,.35);color:#f1f5f9;font:600 15px/1.5 system-ui,sans-serif;text-align:center;opacity:0;transition:opacity .25s">' +
      '<b style="display:block;font-size:12px;letter-spacing:.06em"></b><span></span></div>';
    document.body.appendChild(ui);
    const fadeEl = ui.children[0], subEl = ui.children[1];

    /* ---------------------------------------------------------------- state, script helpers */
    const st = { active: false, running: false, ph: 'idle', el: 0, s: S0, v: 0, hold: 0, spin: 0, spinTo: 0, ci: 0, shake: 0, label: '', scene: '', sc0: 0, scDur: 1,
                 riseT: -1, alarm: false, suck: 0, bang: 0, fa: 0, fdec: 1, subT: 0, ago: 0, song: 0 };
    const mil = { on: false, k: 0, a: -40, r: 0, u: 6, ta: 20, tr: 0, tu: 6 };
    let timers = [], evt = null;
    const later = (delay, fn) => timers.push({ t: st.el + delay, fn });
    const ev = (msg) => { if (evt) evt(msg); };
    const label = (txt) => { st.label = txt; };
    const music = (m) => { if (audio) audio.setMode(m); };
    const sfx = (n) => { if (audio) audio.fx(n); };
    const flash = (col, a, dec) => { fadeEl.style.background = col; st.fa = a; st.fdec = dec; };
    const milTo = (a, r, u) => { mil.ta = a; mil.tr = r; mil.tu = u; };
    function say(who, text) {
      const w = WHO[who]; subEl.children[0].textContent = w[0]; subEl.children[0].style.color = w[1]; subEl.children[1].textContent = text;
      st.subT = 1 + text.length * 0.17; if (audio) audio.speak(text, w[2]);
    }
    // Schedules lines back to back and returns the delay at which the last one ends.
    function talk(delay, lines) { for (const [who, text] of lines) { later(delay, () => say(who, text)); delay += 1 + text.length * 0.17; } return delay; }
    function scene(name, dur) { st.scene = name; st.sc0 = st.el; st.scDur = dur; }

    function toBoard() {
      flash('#000', 1, 0.9); scene('board', 4.4); label('登上逃生舱'); st.riseT = 9; eson.position.y = EA.y; st.alarm = true; music('tense');
      later(4.5, () => { st.ph = 'ride'; st.hold = 2.4; label('星图号 · 逃生舱发射湾'); talk(0, [['np', '逃生舱出发！愿诺瓦之星指引你们。']]); });
    }
    function reset() {
      Object.assign(st, { ph: 'pre', el: 0, s: S0, v: 0, hold: 0, spin: 0, spinTo: 0, ci: 0, shake: 0, riseT: -1, alarm: false, suck: 0, bang: 0, fa: 0, subT: 0, ago: 0 });
      Object.assign(mil, { on: false, k: 0, a: -40, r: 0, u: 6 });
      timers = []; st.song = (Math.random() * 4) | 0; if (audio) audio.setSong(st.song);
      faceTo(eson, EA, GATE); eson.position.y = EA.y - 320; eson.scale.setScalar(18); eson.visible = true;
      for (const q of [portalA, portalB]) { q.userData.k = 0; q.userData.to = 0; }
      bangS.material.opacity = 0; LIT.uniforms.uAdd.value.set(0, 0, 0);
      scene('gal', 16); label('桑达星奇观 · 星系厅'); music('galaxy'); flash('#000', 1, 0.8);
      later(0.2, () => ev('🌌 前秀开始：先听世界智脑讲故事；按 H 可跳过前秀，直接登上逃生舱'));
      let t = talk(1.2, [['wm', '欢迎来到桑达星奇观，桑达人在特拉星的第一座展馆。'], ['wm', '138 亿年前的一场大爆炸，孕育了你我共同的银河。'], ['wm', '请前往相位舱，诺瓦至尊想亲自问候各位。']]);
      later(t, () => { flash('#000', 1, 1); scene('chamber', 12); label('相位舱'); });
      t = talk(t + 1.2, [['np', '特拉星的朋友们，我是诺瓦军团的伊拉妮·蕾尔。'], ['np', '这台宇宙发生器能打开跃迁点，瞬间跨越星系。'], ['np', '现在，把各位传送到轨道上的星图号！']]);
      later(t - 1.4, () => sfx('teleport'));
      later(t, () => { flash('#fff', 1, 0.5); scene('deck', 30); label('星图号 · 观景甲板'); music('calm'); });
      t = talk(t + 1.6, [['wm', '传送完成。各位脚下，就是你们的蓝色星球。']]);
      later(t, () => { st.riseT = 0; st.alarm = true; st.shake = 1; music('tense'); sfx('portal'); });
      t = talk(t + 1.6, [['wm', '警报！侦测到天神族——伊森！'], ['es', '人类……是这个宇宙的错误。'], ['np', '他夺走了宇宙发生器！他要把时间倒回大爆炸，抹掉人类！'],
        ['np', '立刻接通银河护卫队！'], ['sl', '嘿，EPCOT！我小时候来过——等等，谁要抹掉地球？'], ['rk', '把这帮特拉人塞进逃生舱，跟着我们的信号飞！']]);
      later(t + 0.2, toBoard);
    }

    /* ---------------------------------------------------------------- coaster story cues (by track position) */
    const cues = [];
    const cue = (name, f, fn) => cues.push({ s: S(name, f), fn });
    cue('bay', 0.5, () => talk(0, [['rk', '系好安全带，别吐在逃生舱里。']]));
    cue('turn', 0.3, () => { label('发射导轨'); talk(0, [['np', '伊森就在正前方，所有逃生舱保持队形！']]); });
    cue('gate', 0.9, () => {
      label('跃迁点前'); later(0.6, () => { portalA.userData.to = 1; sfx('portal'); flash('#67e8f9', 0.45, 1.2); });
      const e = talk(0.8, [['es', '回到起点……抹去这个错误。'], ['sl', '他打开跃迁点了！所有人跟上！'], ['gm', '不能让他带着发生器回到大爆炸。']]);
      later(e, () => { st.spinTo = PI; talk(0, [['rk', '逃生舱掉头——倒着飞才刺激！三、二、一！']]); });
      st.hold = e + 4.4;
    });
    cue('launch', 0, () => {
      label('倒退弹射 · 冲入跃迁点'); sfx('launch'); st.shake = 1.2; st.alarm = false; music('groove');
      ev('🎵 星爵按下播放键——劲爆混音带 ' + (audio ? audio.songs[st.song] : '') + '（原创曲目，每次乘坐随机一首）');
    });
    cue('launch', 0.1, () => flash('#a5f3fc', 0.8, 1.5));
    cue('launch', 0.7, () => { eson.visible = false; portalA.userData.to = 0; });
    cue('climb', 0.05, () => { label('跃迁航道 · 追击伊森'); st.spinTo = 2 * PI - 0.75; mil.on = true; milTo(24, -13, 5); talk(0, [['sl', '来点音乐！这可是我的劲爆混音带。']]); });
    cue('crest', 0.1, () => { st.spinTo = 2 * PI; milTo(42, -8, 8); talk(0, [['dx', '这椅子会自己转。我也要一把。']]); });
    cue('drop', 0, () => { st.spinTo = 0.5; milTo(64, 8, 12); });
    cue('helix', 0.08, () => { label('环绕桑达星环'); st.spinTo = 1.15; talk(0, [['gr', '我是格鲁特！'], ['rk', '他说：抓紧扶手，笨蛋们。']]); });
    cue('helix', 0.8, () => { st.spinTo = 0; mil.on = false; });
    cue('rise', 0.1, () => { label('时间开始倒流'); sfx('portal'); flash('#fbbf24', 0.5, 1); talk(0, [['gm', '伊森启动发生器了——时间在倒流！']]); });
    cue('sweep', 0.1, () => { label('小行星带'); st.spinTo = 0.8; });
    cue('sweep', 0.75, () => { st.spinTo = 0; });
    cue('dive', 0, () => {
      label('时间隧道'); faceTo(eson, EB, BANG); eson.visible = true; st.bang = 0.001;
      talk(0, [['wm', '时间坐标急速回退：恐龙时代……太阳系诞生……']]);
    });
    cue('rewind', 0.15, () => { label('银河倒带'); st.spinTo = -1.2; talk(0, [['sl', '快看！整个银河都在倒带！']]); });
    cue('rewind', 0.85, () => { st.spinTo = 0; });
    cue('bang', 0.1, () => { label('时间原点 · 大爆炸'); music('tense'); talk(0, [['wm', '已抵达时间原点：138 亿年前。'], ['es', '就从这里……重写一切。']]); });
    cue('bang', 0.9, () => {
      const e = talk(0.2, [['rk', '发生器反相完成！臭大个，尝尝这个！']]);
      later(e, () => { flash('#fff', 1, 0.45); sfx('boom'); st.shake = 1.5; st.suck = 0.001; portalB.userData.to = 1; talk(0.5, [['sl', '跃迁点把他吸回去了！回家咯——快进！']]); });
      later(e + 3, () => { music('groove'); sfx('launch'); st.spinTo = PI; label('快进 · 回到现在'); });
      st.hold = e + 3.2;
    });
    cue('fling', 0.5, () => { st.spinTo = 2 * PI; });
    cue('weave', 0.15, () => { mil.on = true; mil.a = -50; milTo(26, 12, 6); talk(0, [['dx', '我们赢了！我要大笑一百年！哈哈哈！']]); });
    cue('moon', 0.1, () => { label('掠过月球'); st.spinTo = -1.1; milTo(46, 6, 12); talk(0, [['gm', '那是月球。特拉星就在前面。']]); });
    cue('moon', 0.8, () => { st.spinTo = 0; });
    cue('home', 0.2, () => { label('返回特拉星'); milTo(90, 0, 22); talk(0, [['wm', '时间坐标恢复：现在。']]); });
    cue('brake', 0, () => { label('星图号 · 回收湾'); music('calm'); sfx('brake'); mil.on = false; talk(0, [['np', '逃生舱全部回收。特拉星安全了。']]); });
    cue('dock', 0.55, () => { sfx('chime'); talk(0, [['sl', '欢迎回到地球！下次请你们听 B 面。']]); });
    cues.sort((a, b) => a.s - b.s);
    const T0 = S('rise', 0), T1 = S('bang', 0.9), T2 = S('fling', 0), T3 = S('home', 1);

    function finish() {
      st.ph = 'done'; st.running = false; st.v = 0; label('任务完成');
      ev('🏁 「宇宙倒带」完成！你和银河护卫队一起把时间拨回了现在。再次启动可以听到另一首混音带曲目。');
    }

    /* ---------------------------------------------------------------- per-frame */
    const p = new V3(), t = new V3(), u = new V3(), r = new V3(), d = new V3(), r0 = new V3(), u0 = new V3(), m4 = new M4();
    function stepRide(dt) {
      while (st.ci < cues.length && st.s >= cues[st.ci].s) cues[st.ci++].fn();
      if (st.hold > 0) { st.hold -= dt; st.v = 0; }
      else {
        frame(st.s, p, t, u, r);
        const tgt = Math.min(segAt(st.s).v, segAt(st.s + 26).v) - t.y * 8;
        st.v += clamp(tgt - st.v, -12 * dt, 15 * dt);
        st.s += st.v * dt;
        if (st.s >= END) { st.s = END; finish(); }
      }
      st.spin += clamp(st.spinTo - st.spin, -1.5 * dt, 1.5 * dt);
      if (st.spin > PI * 1.5 && st.spinTo > PI * 1.5) { st.spin -= 2 * PI; st.spinTo -= 2 * PI; }
      const k = st.s < T0 ? 0 : st.s <= T1 ? (st.s - T0) / (T1 - T0) : st.s < T2 ? 1 : st.s < T3 ? 1 - (st.s - T2) / (T3 - T2) : 0;
      st.ago = k <= 0 ? 0 : Math.pow(10, k * 10.14) - 1;
    }
    function placeTrain() {
      cars.forEach((car, i) => {
        frame(st.s - i * 3.7, p, t, u, r);
        m4.makeBasis(d.copy(r).negate(), u, t); car.quaternion.setFromRotationMatrix(m4); car.rotateY(-st.spin);
        car.position.copy(p).addScaledVector(u, 0.22);
      });
    }
    function update(dt, onEvent) {
      if (!st.active) return;
      evt = onEvent; dt = Math.min(dt, 0.05);
      if (st.running) {
        st.el += dt;
        const due = timers.filter((q) => q.t <= st.el);
        if (due.length) { timers = timers.filter((q) => q.t > st.el); due.forEach((q) => q.fn()); }
        if (st.ph === 'ride') stepRide(dt);
        if (st.riseT >= 0 && st.riseT < 9) { st.riseT += dt; eson.position.y = EA.y - 320 * (1 - sm(st.riseT / 7)); }
        if (st.suck > 0 && st.suck < 1) {
          st.suck = Math.min(1, st.suck + dt / 4.5); const e = sm(st.suck);
          eson.position.copy(EB).lerp(VORTEX, e); eson.scale.setScalar(18 * (1 - e) + 0.01); eson.rotation.z += dt * (1 + e * 6);
          if (st.suck >= 1) { eson.visible = false; portalB.userData.to = 0; }
        }
        if (st.bang > 0) {
          const near = clamp((st.s - S('dive', 0)) / (T1 - S('dive', 0)), 0, 1), gone = st.suck > 0 ? clamp((st.s - T1) / 160, 0, 1) : 0;
          bangS.scale.setScalar(140 + near * 480 + Math.sin(st.el * 5) * 12); bangS.material.opacity = (0.25 + near * 0.75) * (1 - gone);
        }
        const inRide = st.ph === 'ride' && st.s > T0 - 400;
        galaxy.rotation.y -= dt * (inRide && st.s < T1 ? 0.9 : -0.25);
      }
      const el = st.el, riding = st.ph === 'ride' || st.ph === 'done';
      holo.rotation.y = el * 0.3;
      globes.forEach((g, i) => { const a = el * (0.5 + i * 0.2) + i * PI; g.position.set(Math.cos(a) * 5.2, FY + 3.6 + Math.sin(a * 0.7) * 0.5, GZc + Math.sin(a) * 5.2); });
      for (const g of [gen1, gen2]) g.userData.rings.forEach((q, i) => q.rotation.set(el * (1.3 + i * 0.5), el * (0.8 + i * 0.35), 0));
      esonArm.rotation.x = -1.2 + Math.sin(el * 0.5) * 0.12;
      for (const q of [portalA, portalB]) {
        const ud = q.userData; ud.k += (ud.to - ud.k) * Math.min(1, dt * 1.6);
        q.visible = ud.k > 0.01; q.scale.setScalar(Math.max(0.01, ud.R * ud.k)); q.rotateZ(dt * 1.4);
      }
      const trainOn = riding || st.scene === 'board';
      cars.forEach((c) => { c.visible = trainOn; });
      if (trainOn) placeTrain();
      mil.k += ((mil.on ? 1 : 0) - mil.k) * Math.min(1, dt * 1.1);
      milano.visible = riding && mil.k > 0.02;
      if (milano.visible) {
        const e = Math.min(1, dt * 0.9); mil.a += (mil.ta - mil.a) * e; mil.r += (mil.tr - mil.r) * e; mil.u += (mil.tu - mil.u) * e;
        frame(clamp(st.s + mil.a, 0, END), p, t, u, r);
        m4.makeBasis(d.copy(r).negate(), u, t); milano.quaternion.setFromRotationMatrix(m4); milano.rotateZ(Math.sin(el * 0.9) * 0.3);
        milano.position.copy(p).addScaledVector(r, mil.r + Math.sign(mil.tr || 1) * (1 - mil.k) * 90).addScaledVector(WUP, mil.u + Math.sin(el * 1.3) * 0.8);
      }
      for (const q of tunnels) q.m.visible = st.ph === 'ride' && st.s > q.a && st.s < q.b;
      dust.visible = st.ph === 'ride' && st.s > S('gate', 0.5) && st.s < S('brake', 0.2);
      const pulse = st.alarm ? 0.12 + 0.12 * Math.sin(el * 6) : 0;
      LIT.uniforms.uAdd.value.set(pulse, 0, 0);
      st.shake = Math.max(0, st.shake - dt * 0.8);
      st.fa = Math.max(0, st.fa - dt * st.fdec); fadeEl.style.opacity = st.fa.toFixed(3);
      if (st.running && st.subT > 0) st.subT -= dt;
      subEl.style.opacity = st.subT > 0 ? '1' : '0';
      if (audio) { audio.setAlarm(st.alarm && st.running); audio.setSpeed(st.running ? clamp(st.v / 26, 0, 1) : 0); audio.update(dt); }
    }

    /* ---------------------------------------------------------------- cameras */
    const out = (px, py, pz, tx, ty, tz, roll) => {
      dustU.uC.value.set(OX + px, OY + py, OZ + pz);
      return { px: OX + px, py: OY + py, pz: OZ + pz, tx: OX + tx, ty: OY + ty, tz: OZ + tz, roll: roll || 0 };
    };
    const mix = (a, b, k) => [lerp(a[0], b[0], k), lerp(a[1], b[1], k), lerp(a[2], b[2], k)];
    function prePose() {
      const k = clamp((st.el - st.sc0) / st.scDur, 0, 1), e = sm(k), sh = st.shake * 0.06;
      let c, l;
      if (st.scene === 'gal') { c = mix([5, FY + 1.9, GZc - 7.5], [-5.5, FY + 1.9, GZc + 6.5], e); l = [0, FY + 3.5, GZc]; }
      else if (st.scene === 'chamber') { c = mix([0, FY + 1.9, CZc - 5.8], [0, FY + 1.9, CZc - 3.4], e); l = mix([0, FY + 4, CZc + 6.1], [0, FY + 3, CZc], sm((k - 0.45) / 0.3)); }
      else if (st.scene === 'deck') {
        c = mix([-27, 3.5, 9], [-30.4, 3.5, 12], e);
        l = mix([-300, -30, 60], [eson.position.x, eson.position.y + 80, eson.position.z], sm(st.riseT / 5));
      } else { c = mix([5, 2.3, S0 - 7], [0, 2.02, S0 + 0.2], e); l = mix([0, 1.2, S0], [0, 1.4, S0 + 30], e); }
      return out(c[0] + (Math.random() - 0.5) * sh, c[1] + (Math.random() - 0.5) * sh, c[2], l[0], l[1], l[2]);
    }
    function ridePose(third) {
      frame(st.s, p, t, u, r);
      if (third) return out(p.x - t.x * 11 + r.x * 4.5, p.y + 4.6, p.z - t.z * 11 + r.z * 4.5, p.x + t.x * 4, p.y + 1, p.z + t.z * 4);
      d.copy(t).multiplyScalar(Math.cos(st.spin)).addScaledVector(r, Math.sin(st.spin));
      const sh = st.shake * 0.09, ex = p.x + u.x * 2.02 + d.x * 0.2 + (Math.random() - 0.5) * sh, ey = p.y + u.y * 2.02 + d.y * 0.2 + (Math.random() - 0.5) * sh, ez = p.z + u.z * 2.02 + d.z * 0.2;
      r0.crossVectors(d, WUP).normalize(); u0.crossVectors(r0, d);
      return out(ex, ey, ez, ex + d.x * 14, ey + d.y * 14 - 0.5, ez + d.z * 14, Math.atan2(-u.dot(r0), u.dot(u0)));
    }
    const fmtAgo = (a) => (a < 1 ? '现在' : a < 1e4 ? Math.round(a) + ' 年前' : a < 1e8 ? (a / 1e4).toFixed(1) + ' 万年前' : (a / 1e8).toFixed(1) + ' 亿年前');

    const ride = {
      id: 'cosmic_rewind', name: '银河护卫队：宇宙倒带（Cosmic Rewind）', land: 'epcot', boardPos: o.board, exitPos: o.exit,
      start() {
        if (!st.active || st.ph === 'done' || st.ph === 'idle') reset();
        st.active = true; st.running = true; show.visible = true; ui.style.display = 'block';
        if (audio) audio.start();
      },
      stop() { st.running = false; if (audio) audio.stop(); },
      onExit() {
        st.active = false; st.running = false; st.ph = 'idle'; show.visible = false; ui.style.display = 'none'; timers = [];
        if (audio) audio.stop();
      },
      isRunning: () => st.running,
      hyperjump(onEvent) {
        if (st.ph !== 'pre' || st.scene === 'board') { if (onEvent) onEvent('🚀 逃生舱已经在跃迁航线上了，坐稳！'); return; }
        timers = []; st.subT = 0;
        toBoard(); if (onEvent) onEvent('⏭️ 已跳过前秀：伊森夺走了宇宙发生器，立刻登上逃生舱！');
      },
      getHudInfo: () => (st.ph === 'pre' ? `前秀 · ${st.label}（H 跳过）` : `${st.label} · ${Math.round(st.v * 3.6)} km/h · 时间坐标：${fmtAgo(st.ago)}`),
      getCameraPose: (third) => (st.ph === 'pre' ? prePose() : ridePose(third))
    };
    return { ride, update, info: { length: LEN, segs: order } };
  }

  root.TPCosmicRewind = { build };
})(window);

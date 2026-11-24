/* Minest My World · "it's a small world" — full dark-ride rebuild (`smallworld.js`)
 * Facade at x=306, z=84 (Disneyland, Fantasyland). Continuous flume: outdoor load dock and topiary canal,
 * then eight show rooms (Hello/Arctic, Europe, Asia, Africa, Latin America, South Seas, North America with
 * Mr. Lincoln, white-and-gold Finale) and back out past the goodbye signs.
 * Scene content lives in smallworld-scenes.js, the soundtrack in smallworld-audio.js. */
(function (root) {
  'use strict';

  function build(scene, world, group) {
    const T = root.THREE, Y = world.PARK_Y, WY = world.WATER_Y, PI = Math.PI;
    const FX = 306, FLOOR = WY + 0.4, CEIL = WY + 9.05, SPEED = 1.3, NBOATS = 7;
    const Scenes = root.TPSmallWorldScenes;
    const audio = root.TPSmallWorldAudio ? root.TPSmallWorldAudio.create() : null;

    /* ---------------------------------------------------------------- flume path */
    const WP = [[318, 95.6], [308.5, 95.6], [308.5, 79.5], [321, 79.5], [321, 53], [311, 53], [311, 66], [301, 66], [301, 53],
                [291, 53], [291, 79.5], [303.5, 79.5], [303.5, 95.6], [289, 95.6], [289, 98.6], [323, 98.6], [323, 95.6]];
    const raw = [];
    for (let i = 0; i < WP.length; i++) {
      const p = WP[i], a = WP[(i + WP.length - 1) % WP.length], b = WP[(i + 1) % WP.length];
      const la = Math.hypot(p[0] - a[0], p[1] - a[1]), lb = Math.hypot(b[0] - p[0], b[1] - p[1]);
      const r = Math.min(2.4, la / 2, lb / 2);
      const s0 = [p[0] + (a[0] - p[0]) / la * r, p[1] + (a[1] - p[1]) / la * r];
      const s1 = [p[0] + (b[0] - p[0]) / lb * r, p[1] + (b[1] - p[1]) / lb * r];
      for (let k = 0; k <= 8; k++) {
        const t = k / 8, u = 1 - t;
        raw.push([u * u * s0[0] + 2 * u * t * p[0] + t * t * s1[0], u * u * s0[1] + 2 * u * t * p[1] + t * t * s1[1]]);
      }
    }
    raw.push(raw[0]);
    const cum = [0];
    for (let i = 1; i < raw.length; i++) cum.push(cum[i - 1] + Math.hypot(raw[i][0] - raw[i - 1][0], raw[i][1] - raw[i - 1][1]));
    const L = cum[cum.length - 1], NP = Math.round(L / 0.2);
    const PX = new Float32Array(NP), PZ = new Float32Array(NP);
    for (let i = 0, j = 0; i < NP; i++) {
      const d = i / NP * L;
      while (j < cum.length - 2 && cum[j + 1] < d) j++;
      const f = (d - cum[j]) / ((cum[j + 1] - cum[j]) || 1);
      PX[i] = raw[j][0] + (raw[j + 1][0] - raw[j][0]) * f;
      PZ[i] = raw[j][1] + (raw[j + 1][1] - raw[j][1]) * f;
    }
    const wrap = (s) => ((s % L) + L) % L;
    function pt(s) {
      const u = wrap(s) / L * NP, i = Math.floor(u) % NP, k = (i + 1) % NP, f = u - Math.floor(u);
      return { x: PX[i] + (PX[k] - PX[i]) * f, z: PZ[i] + (PZ[k] - PZ[i]) * f };
    }
    function at(s) {
      const p = pt(s), a = pt(s - 0.7), b = pt(s + 0.7);
      const tx = b.x - a.x, tz = b.z - a.z, l = Math.hypot(tx, tz) || 1;
      p.tx = tx / l; p.tz = tz / l;
      return p;
    }
    function sNear(x, z) {
      let best = 0, bd = 1e9;
      for (let i = 0; i < NP; i++) { const d = (PX[i] - x) * (PX[i] - x) + (PZ[i] - z) * (PZ[i] - z); if (d < bd) { bd = d; best = i; } }
      return best / NP * L;
    }

    /* ---------------------------------------------------------------- rooms */
    const ROOMS = [
      { id: 'hello',   tint: [0.62, 0.86, 1.0],  floor: 0xdff3ff, accent: 0x8fd3ff, msg: '❄️ 「你好」大厅 · 北极与斯堪的纳维亚：冰上旋转的滑冰娃娃、北极熊和极光，八音盒奏响主题曲' },
      { id: 'europe',  tint: [0.86, 0.74, 1.0],  floor: 0xe6d8ff, accent: 0xc9a7ff, msg: '🎡 欧洲：大本钟卫兵、荷兰风车、埃菲尔铁塔下的康康舞、威尼斯贡多拉——手风琴版' },
      { id: 'asia',    tint: [1.0, 0.66, 0.8],   floor: 0xffd3e2, accent: 0xff8fb8, msg: '🏮 亚洲：飞毯盘旋、泰姬陵、中国龙与宝塔、撑伞的和服娃娃——古筝与锣声' },
      { id: 'africa',  tint: [0.66, 1.0, 0.74],  floor: 0x2d7d55, accent: 0x7be495, msg: '🦒 非洲：点头的长颈鹿、甩鼻子的大象、荡秋千的猴子——马林巴与手鼓' },
      { id: 'latin',   tint: [1.0, 0.82, 0.46],  floor: 0xffc66e, accent: 0xffa53a, msg: '🌞 拉丁美洲：旋转的金色太阳、墨西哥乐队、摇摆的皮纳塔、嘉年华舞者——小号与沙锤' },
      { id: 'seas',    tint: [0.48, 0.95, 1.0],  floor: 0x8fe6e0, accent: 0x3fd5e6, msg: '🌺 南太平洋：草裙舞、跃出水面的鱼、冲浪娃娃、美人鱼和火山彩虹——夏威夷钢棒吉他' },
      { id: 'america', tint: [1.0, 0.78, 0.6],   floor: 0xdba56c, accent: 0xff9d5c, msg: '🤠 北美：牛仔套索、印第安篝火、农场娃娃——前方舞台上，林肯先生即将起身演讲' },
      { id: 'finale',  tint: [1.0, 1.0, 1.0],    floor: 0xffffff, accent: 0xffe28a, msg: '✨ 终章大合唱厅：全世界的孩子换上纯白鎏金礼服同台合唱，旋转木马、摩天轮与万千灯光' }
    ];
    const sIn = sNear(308.5, 84.4), sOut = sNear(303.5, 84.4);
    const bounds = [sIn, sNear(321, 75), sNear(321, 58.5), sNear(308.5, 66), sNear(301, 56.5), sNear(291, 58), sNear(291, 68), sNear(294.5, 79.5), sOut];
    function roomAt(s) {
      s = wrap(s);
      if (s < sIn || s >= sOut) return -1;
      for (let i = 7; i >= 0; i--) if (s >= bounds[i]) return i;
      return -1;
    }
    const sr = (i, f) => bounds[i] + (bounds[i + 1] - bounds[i]) * f;

    /* ---------------------------------------------------------------- materials & builders */
    const uBeat = { value: 0 }, uTime = { value: 0 };
    const hexRGB = (h) => [(h >> 16 & 255) / 255, (h >> 8 & 255) / 255, (h & 255) / 255];
    const SHOW_VS = 'attribute vec3 aCol; varying vec3 vC; varying vec3 vN; varying vec3 vW;' +
      'void main(){ vC=aCol; vN=normalize(mat3(modelMatrix)*normal); vec4 w=modelMatrix*vec4(position,1.0); vW=w.xyz; gl_Position=projectionMatrix*viewMatrix*w; }';
    const SHOW_FS = 'uniform vec3 uTint; uniform float uBeat; varying vec3 vC; varying vec3 vN; varying vec3 vW;' +
      'void main(){ vec3 n=normalize(vN); float d=max(dot(n,normalize(vec3(0.25,0.8,0.55))),0.0);' +
      ' float back=max(dot(n,normalize(vec3(-0.4,0.3,-0.6))),0.0);' +
      ' vec3 v=normalize(cameraPosition-vW); float rim=pow(1.0-max(dot(n,v),0.0),3.0);' +
      ' vec3 c=vC*(0.56+0.44*d)*mix(vec3(1.0),uTint,0.28)+uTint*(back*0.12+rim*0.22);' +
      ' gl_FragColor=vec4(c*(0.95+0.07*uBeat),1.0); }';
    function showMat(tint) {
      return new T.ShaderMaterial({ uniforms: { uTint: { value: new T.Vector3(tint[0], tint[1], tint[2]) }, uBeat }, vertexShader: SHOW_VS, fragmentShader: SHOW_FS });
    }
    const roomMats = ROOMS.map((r) => showMat(r.tint));
    const neutralMat = showMat([1, 1, 1]);
    const vcFlag = T.VertexColors !== undefined ? T.VertexColors : true;
    const extMat = new T.MeshLambertMaterial({ vertexColors: vcFlag, emissive: 0x15140f });

    // Vertex-coloured geometry merger: every set piece is one draw call.
    function Bld() {
      const P = [], N = [], C = [];
      const m4 = new T.Matrix4(), q = new T.Quaternion(), e = new T.Euler(), v = new T.Vector3(), sc = new T.Vector3();
      const self = {
        add(geo, col, x, y, z, rx, ry, rz, sx, sy, sz) {
          const g = geo.index ? geo.toNonIndexed() : geo;
          q.setFromEuler(e.set(rx || 0, ry || 0, rz || 0));
          m4.compose(v.set(x || 0, y || 0, z || 0), q, sc.set(sx || 1, sy || sx || 1, sz || sx || 1));
          g.applyMatrix4(m4);
          const p = g.attributes.position.array, nn = g.attributes.normal.array, c = hexRGB(col);
          for (let i = 0; i < p.length; i += 3) { P.push(p[i], p[i + 1], p[i + 2]); N.push(nn[i], nn[i + 1], nn[i + 2]); C.push(c[0], c[1], c[2]); }
          g.dispose(); if (g !== geo) geo.dispose();
          return self;
        },
        box: (c, w, h, d, x, y, z, rx, ry, rz) => self.add(new T.BoxGeometry(w, h, d), c, x, y, z, rx, ry, rz),
        cyl: (c, rt, rb, h, x, y, z, rx, ry, rz, seg) => self.add(new T.CylinderGeometry(rt, rb, h, seg || 10), c, x, y, z, rx, ry, rz),
        cone: (c, r, h, x, y, z, rx, ry, rz, seg) => self.add(new T.ConeGeometry(r, h, seg || 10), c, x, y, z, rx, ry, rz),
        sph: (c, r, x, y, z, sx, sy, sz) => self.add(new T.SphereGeometry(r, 10, 8), c, x, y, z, 0, 0, 0, sx, sy, sz),
        dome: (c, r, x, y, z, frac) => self.add(new T.SphereGeometry(r, 12, 6, 0, PI * 2, 0, PI * (frac || 0.5)), c, x, y, z),
        geo() {
          const g = new T.BufferGeometry();
          g.setAttribute('position', new T.Float32BufferAttribute(P, 3));
          g.setAttribute('normal', new T.Float32BufferAttribute(N, 3));
          g.setAttribute('aCol', new T.Float32BufferAttribute(C, 3));
          g.setAttribute('color', new T.Float32BufferAttribute(C, 3));
          return g;
        }
      };
      return self;
    }
    const matOf = (room) => (room === -1 || room === undefined ? neutralMat : roomMats[room]);
    const M = (b, room) => new T.Mesh(b.geo(), matOf(room));

    function cvs(w, h) { const c = document.createElement('canvas'); c.width = w; c.height = h; return c; }
    function basicTex(c, rep) {
      const tx = new T.CanvasTexture(c);
      if (rep) tx.wrapS = tx.wrapT = T.RepeatWrapping;
      const m = new T.MeshBasicMaterial({ map: tx, side: T.DoubleSide });
      m.toneMapped = false;
      return m;
    }
    function signMesh(lines, w, h, bg, fg, border) {
      const c = cvs(1024, Math.round(1024 * h / w)), x = c.getContext('2d');
      x.fillStyle = bg; x.fillRect(0, 0, c.width, c.height);
      x.strokeStyle = border || fg; x.lineWidth = 14; x.strokeRect(10, 10, c.width - 20, c.height - 20);
      x.fillStyle = fg; x.textAlign = 'center'; x.textBaseline = 'middle';
      lines.forEach((ln, i) => {
        let size = Math.floor(c.height / (lines.length + 0.9) * (i === 0 ? 0.86 : 0.6));
        x.font = '700 ' + size + 'px Georgia, "Songti SC", "Noto Serif CJK SC", serif';
        while (x.measureText(ln).width > c.width - 70 && size > 12) { size -= 3; x.font = '700 ' + size + 'px Georgia, "Songti SC", "Noto Serif CJK SC", serif'; }
        x.fillText(ln, c.width / 2, c.height * (i + 0.62) / (lines.length + 0.2));
      });
      return new T.Mesh(new T.PlaneGeometry(w, h), basicTex(c));
    }

    /* ---------------------------------------------------------------- interior shell */
    const inner = new T.Group(); group.add(inner);
    const anims = [], dolls = [];

    const backdrops = Scenes ? Scenes.backdrops(cvs) : [];
    const wallBatches = ROOMS.map(() => ({ p: [], u: [] }));
    const WALLS = [
      [306, 74.6, 316.1, 74.6, 0, 1], [310.5, 83.95, 325.9, 83.95, 0, -1], [325.9, 84.4, 325.9, 48.1, -1, 0], [316.1, 74.6, 316.1, 57.9, 1, 0],
      [325.9, 48.1, 306.1, 48.1, 0, 1], [306.1, 48.1, 306.1, 61.1, 1, 0], [315.9, 57.9, 315.9, 70.9, -1, 0], [315.9, 70.9, 296.1, 70.9, 0, -1],
      [296.1, 70.9, 296.1, 57.9, 1, 0], [305.9, 61.1, 305.9, 48.1, -1, 0], [305.9, 48.1, 286.1, 48.1, 0, 1], [286.1, 48.1, 286.1, 84.4, 1, 0],
      [295.9, 57.9, 295.9, 74.6, -1, 0], [296.1, 71.1, 296.1, 74.6, 1, 0], [296.1, 71.1, 305.9, 71.1, 0, 1], [305.9, 71.1, 305.9, 84.4, -1, 0],
      [306.1, 74.6, 306.1, 84.4, 1, 0], [286.1, 83.95, 301.5, 83.95, 0, -1]
    ];
    for (const [x1, z1, x2, z2, nx, nz] of WALLS) {
      const len = Math.hypot(x2 - x1, z2 - z1), n = Math.max(1, Math.ceil(len / 3)), y0 = WY - 0.3, y1 = CEIL;
      for (let i = 0; i < n; i++) {
        const fa = i / n, fb = (i + 1) / n;
        const ax = x1 + (x2 - x1) * fa, az = z1 + (z2 - z1) * fa, bx = x1 + (x2 - x1) * fb, bz = z1 + (z2 - z1) * fb;
        const mx = (ax + bx) / 2 + nx * 4.4, mz = (az + bz) / 2 + nz * 4.4;
        let rm = roomAt(sNear(mx, mz));
        if (rm < 0) rm = mx > FX ? 0 : 7;
        if (mx > 296 && mx < 306 && mz > 71 && mz < 84.4) rm = 7;
        const w = wallBatches[rm], ua = len * fa / 9.35, ub = len * fb / 9.35;
        w.p.push(ax, y0, az, bx, y0, bz, bx, y1, bz, ax, y0, az, bx, y1, bz, ax, y1, az);
        w.u.push(ua, 0, ub, 0, ub, 1, ua, 0, ub, 1, ua, 1);
      }
    }
    wallBatches.forEach((w, i) => {
      if (!w.p.length) return;
      const g = new T.BufferGeometry();
      g.setAttribute('position', new T.Float32BufferAttribute(w.p, 3));
      g.setAttribute('uv', new T.Float32BufferAttribute(w.u, 2));
      const mat = backdrops[i] ? basicTex(backdrops[i], true) : new T.MeshBasicMaterial({ color: ROOMS[i].accent, side: T.DoubleSide });
      inner.add(new T.Mesh(g, mat));
    });
    const dark = new T.MeshBasicMaterial({ color: 0x05060f, side: T.DoubleSide });
    const ceil = new T.Mesh(new T.PlaneGeometry(40.4, 36.6), dark);
    ceil.rotation.x = PI / 2; ceil.position.set(306, CEIL, 66.2); inner.add(ceil);

    // Scene platforms: two ribbons that follow the flume, plus white curbs.
    {
      const P = [], C = [], top = FLOOR, bot = WY - 0.3, curb = hexRGB(0xfff7e0);
      const quad = (a, b, c2, d, col) => { P.push(...a, ...b, ...c2, ...a, ...c2, ...d); for (let k = 0; k < 6; k++) C.push(col[0], col[1], col[2]); };
      const edge = (s, side) => {
        const p = at(s), lx = p.tz * side, lz = -p.tx * side;
        let o = 4.95;
        if (p.z > 77.2 && Math.abs(p.x - FX) < 4 && (p.x + lx * o - FX) * (p.x - FX) < 0) o = Math.max(1.75, Math.abs(p.x - FX) - 0.12);
        return { ix: p.x + lx * 1.7, iz: p.z + lz * 1.7, ox: p.x + lx * o, oz: p.z + lz * o };
      };
      for (let s = sIn; s < sOut; s += 0.5) {
        const rm = roomAt(s + 0.25), col = hexRGB(ROOMS[rm < 0 ? 0 : rm].floor);
        const top = FLOOR - (rm < 0 ? 0 : rm) * 0.006;
        for (const side of [-1, 1]) {
          const a = edge(s, side), b = edge(Math.min(sOut, s + 0.5), side);
          quad([a.ix, top, a.iz], [b.ix, top, b.iz], [b.ox, top, b.oz], [a.ox, top, a.oz], col);
          quad([a.ix, bot, a.iz], [b.ix, bot, b.iz], [b.ix, top, b.iz], [a.ix, top, a.iz], curb);
        }
      }
      const g = new T.BufferGeometry();
      g.setAttribute('position', new T.Float32BufferAttribute(P, 3));
      g.setAttribute('color', new T.Float32BufferAttribute(C, 3));
      const m = new T.MeshBasicMaterial({ vertexColors: vcFlag, side: T.DoubleSide }); m.toneMapped = false;
      inner.add(new T.Mesh(g, m));
    }

    // Interior flume water: dark, with room-coloured ripples.
    const waterTint = new T.Vector3(0.6, 0.85, 1);
    const flume = new T.Mesh(new T.PlaneGeometry(40.4, 36.6), new T.ShaderMaterial({
      uniforms: { uTime, uTint: { value: waterTint } },
      vertexShader: 'varying vec2 vP; void main(){ vec4 w=modelMatrix*vec4(position,1.0); vP=w.xz; gl_Position=projectionMatrix*viewMatrix*w; }',
      fragmentShader: 'uniform float uTime; uniform vec3 uTint; varying vec2 vP;' +
        'void main(){ float h=sin(vP.x*1.9+uTime*1.3)+sin(vP.y*2.6-uTime*1.05)+sin((vP.x+vP.y)*3.4+uTime*1.8)+sin((vP.x-vP.y)*5.1-uTime*2.3)*0.6;' +
        ' vec3 base=mix(vec3(0.012,0.03,0.11),uTint*0.26,0.55); float gl=smoothstep(1.5,3.1,h);' +
        ' gl_FragColor=vec4(base+uTint*gl*0.6+vec3(1.0)*smoothstep(2.9,3.4,h)*0.5,1.0); }'
    }));
    flume.rotation.x = -PI / 2; flume.position.set(306, WY + 0.05, 66.2); inner.add(flume);

    // Twinkle lights (one Points object for the whole show).
    const LP = [], LC = [], LA = [];
    function light(x, y, z, hex, size, speed) {
      const c = hexRGB(hex);
      LP.push(x, y, z); LC.push(c[0], c[1], c[2]); LA.push(Math.random() * 6.283, speed === undefined ? 1.5 + Math.random() * 3 : speed, size || 0.16);
    }

    /* ---------------------------------------------------------------- dolls */
    const SKIN = [0xf8d9b8, 0xeebd8e, 0xc98a58, 0x8a5633, 0xf3cfa4];
    const geoCache = {};
    const cached = (key, fn) => geoCache[key] || (geoCache[key] = fn());
    function hatGeo(b, o) {
      const c = o.hatC || 0xf5c542;
      switch (o.hat) {
        case 'cone': b.cone(c, 0.38, 0.2, 0, 0.53, 0, 0, 0, 0, 14); break;
        case 'fez': b.cyl(c, 0.1, 0.13, 0.17, 0, 0.56, 0).box(0x222222, 0.02, 0.14, 0.02, 0.1, 0.58, 0); break;
        case 'sombrero': b.cyl(c, 0.44, 0.44, 0.035, 0, 0.47, 0, 0, 0, 0, 16).cyl(c, 0.1, 0.16, 0.22, 0, 0.58, 0).cyl(0xd9432f, 0.165, 0.165, 0.04, 0, 0.5, 0); break;
        case 'top': b.cyl(c, 0.23, 0.23, 0.03, 0, 0.48, 0).cyl(c, 0.14, 0.14, 0.26, 0, 0.61, 0); break;
        case 'bearskin': b.cyl(0x141414, 0.22, 0.25, 0.4, 0, 0.6, 0).sph(0x141414, 0.22, 0, 0.8, 0, 1, 0.6, 1); break;
        case 'beret': b.sph(c, 0.2, 0.04, 0.5, 0, 1.3, 0.38, 1.3); break;
        case 'crown': b.cyl(0xf5c542, 0.17, 0.14, 0.12, 0, 0.5, 0); for (let i = 0; i < 5; i++) b.cone(0xf5c542, 0.04, 0.12, Math.cos(i * 1.257) * 0.14, 0.61, Math.sin(i * 1.257) * 0.14); break;
        case 'feather': b.cyl(0xd9432f, 0.268, 0.268, 0.05, 0, 0.36, 0);
          [0xffffff, 0xd9432f, 0xffffff, 0x2f9e44, 0xffffff].forEach((fc, i) => b.box(fc, 0.07, 0.34, 0.02, (i - 2) * 0.09, 0.58, -0.12, -0.25, 0, -(i - 2) * 0.22)); break;
        case 'bonnet': b.add(new T.SphereGeometry(0.295, 10, 6, 0, PI * 2, 0, PI * 0.6), 0xffffff, 0, 0.25, -0.05, -0.5); b.cone(0xffffff, 0.08, 0.2, -0.27, 0.4, 0, 0, 0, 0.9).cone(0xffffff, 0.08, 0.2, 0.27, 0.4, 0, 0, 0, -0.9); break;
        case 'flower': for (let i = 0; i < 7; i++) b.sph([0xff5d8f, 0xffd43b, 0xffffff, 0xff922b][i % 4], 0.055, Math.cos(i * 0.9) * 0.22, 0.44, Math.sin(i * 0.9) * 0.22 - 0.02); break;
        case 'turban': b.sph(c, 0.27, 0, 0.42, -0.02, 1, 0.62, 1).sph(0xf5c542, 0.045, 0, 0.44, 0.24); break;
        case 'cowboy': b.cyl(c, 0.36, 0.36, 0.03, 0, 0.47, 0, 0, 0, 0, 14).cyl(c, 0.14, 0.17, 0.17, 0, 0.56, 0); break;
        case 'spire': b.cyl(0xf5c542, 0.2, 0.22, 0.08, 0, 0.47, 0).cone(0xf5c542, 0.15, 0.46, 0, 0.72, 0); break;
        case 'fur': b.sph(c, 0.3, 0, 0.3, -0.04, 1.08, 1, 1); break;
        case 'buns': b.sph(o.hair, 0.1, -0.25, 0.36, -0.02).sph(o.hair, 0.1, 0.25, 0.36, -0.02); break;
        case 'bow': b.box(c, 0.16, 0.1, 0.04, -0.09, 0.5, 0, 0, 0, 0.5).box(c, 0.16, 0.1, 0.04, 0.09, 0.5, 0, 0, 0, -0.5); break;
        default: break;
      }
    }
    function makeDoll(o, mat) {
      const g = new T.Group(), skin = SKIN[o.skin || 0], trim = o.trim === undefined ? 0xffffff : o.trim, shoe = o.shoe || 0x3a2a22;
      const body = new T.Mesh(cached('b' + [o.top, o.bot, o.skirt ? 1 : 0, o.skin || 0, trim, shoe].join(), () => {
        const b = Bld();
        for (const sx of [-1, 1]) b.box(shoe, 0.11, 0.07, 0.18, sx * 0.09, 0.035, 0.02);
        if (o.skirt) {
          for (const sx of [-1, 1]) b.cyl(skin, 0.05, 0.05, 0.3, sx * 0.085, 0.2, 0);
          b.cyl(o.bot, 0.13, 0.37, 0.46, 0, 0.56, 0, 0, 0, 0, 14).cyl(trim, 0.375, 0.375, 0.045, 0, 0.34, 0, 0, 0, 0, 14);
          b.cyl(o.top, 0.15, 0.135, 0.3, 0, 0.9, 0);
        } else {
          for (const sx of [-1, 1]) b.cyl(o.bot, 0.075, 0.07, 0.52, sx * 0.09, 0.32, 0);
          b.cyl(o.top, 0.16, 0.175, 0.36, 0, 0.84, 0).cyl(trim, 0.18, 0.18, 0.05, 0, 0.68, 0);
        }
        b.cyl(trim, 0.09, 0.15, 0.05, 0, 1.04, 0);
        return b.geo();
      }), mat);
      const head = new T.Mesh(cached('h' + [o.skin || 0, o.hair, o.hat, o.hatC].join(), () => {
        const b = Bld();
        b.sph(skin, 0.26, 0, 0.24, 0, 1, 0.96, 0.95);
        for (const sx of [-1, 1]) {
          b.sph(0x1c1c1c, 0.032, sx * 0.085, 0.27, 0.228);
          b.sph(0xff8fa3, 0.05, sx * 0.15, 0.185, 0.195, 1, 0.8, 0.5);
          b.box(0xc0272d, 0.03, 0.022, 0.02, sx * 0.055, 0.153, 0.236, 0, 0, sx * 0.6);
        }
        b.box(0xc0272d, 0.09, 0.022, 0.02, 0, 0.14, 0.242);
        if (o.hair !== undefined && o.hat !== 'fur') b.add(new T.SphereGeometry(0.278, 10, 6, 0, PI * 2, 0, PI * 0.54), o.hair, 0, 0.25, -0.03, -0.38);
        hatGeo(b, o);
        return b.geo();
      }), mat);
      head.position.y = 1.02;
      const armGeo = cached('a' + [o.top, o.skin || 0].join(), () => Bld().cyl(o.top, 0.05, 0.045, 0.34, 0, -0.17, 0).sph(skin, 0.058, 0, -0.37, 0).geo());
      const aL = new T.Mesh(armGeo, mat), aR = new T.Mesh(armGeo, mat);
      aL.position.set(0.2, 0.98, 0); aR.position.set(-0.2, 0.98, 0); aL.rotation.z = 0.5; aR.rotation.z = -0.5;
      g.add(body, head, aL, aR);
      g.userData = { head, aL, aR };
      g.scale.setScalar(o.sc || 1);
      return g;
    }
    function regDoll(g, anim, ph) {
      dolls.push({ g, t: anim || 'sway', ph: ph === undefined ? dolls.length * 1.7 : ph, y: g.position.y, ry: g.rotation.y, u: g.userData });
      return g;
    }
    function put(obj, s, side, off, dy, rot) {
      const p = at(s), lx = p.tz * side, lz = -p.tx * side;
      obj.position.set(p.x + lx * off, FLOOR + (dy || 0), p.z + lz * off);
      obj.rotation.y = Math.atan2(-lx, -lz) + (rot || 0);
      inner.add(obj);
      return obj;
    }
    function doll(room, s, side, off, o, anim, dy, rot) { return regDoll(put(makeDoll(o, matOf(room)), s, side, off, dy, rot), anim); }
    function dollAt(room, parent, x, y, z, ry, o, anim) {
      const g = makeDoll(o, matOf(room)); g.position.set(x, y, z); g.rotation.y = ry || 0; (parent || inner).add(g);
      return regDoll(g, anim);
    }
    function animateDolls(bp) {
      const w = bp * PI;
      for (let i = 0; i < dolls.length; i++) {
        const d = dolls[i], g = d.g, u = d.u, a = w + d.ph;
        u.head.rotation.y = Math.sin(w * 0.5 + d.ph * 1.7) * 0.28;
        u.head.rotation.z = Math.sin(a) * 0.1;
        switch (d.t) {
          case 'sway': g.rotation.z = Math.sin(a) * 0.15; u.aL.rotation.z = 0.7 + Math.sin(a) * 0.3; u.aR.rotation.z = -0.7 + Math.sin(a) * 0.3; break;
          case 'bob': g.position.y = d.y + Math.abs(Math.sin(a)) * 0.12 * g.scale.y; break;
          case 'spin': g.rotation.y = d.ry + bp * 1.4 + d.ph; u.aL.rotation.z = 1.5; u.aR.rotation.z = -1.5; break;
          case 'hula': g.rotation.y = d.ry + Math.sin(w * 2 + d.ph) * 0.38; g.rotation.z = Math.sin(w * 2 + d.ph + 1.2) * 0.08;
            u.aL.rotation.z = 1.25 + Math.sin(a) * 0.45; u.aR.rotation.z = -1.25 + Math.sin(a) * 0.45; break;
          case 'wave': u.aR.rotation.z = -2.5 + Math.sin(w * 2 + d.ph) * 0.45; g.rotation.z = Math.sin(a) * 0.06; break;
          case 'drum': u.aL.rotation.z = 0.25; u.aR.rotation.z = -0.25; u.aL.rotation.x = -1.2 + Math.sin(w * 4 + d.ph) * 0.5; u.aR.rotation.x = -1.2 - Math.sin(w * 4 + d.ph) * 0.5; break;
          case 'march': g.position.y = d.y + Math.abs(Math.sin(w * 2)) * 0.06; u.aL.rotation.x = Math.sin(w * 2 + d.ph) * 0.8; u.aR.rotation.x = -Math.sin(w * 2 + d.ph) * 0.8; break;
          case 'kick': g.rotation.x = -Math.max(0, Math.sin(w * 2 + d.ph)) * 0.3; g.position.y = d.y + Math.max(0, Math.sin(w * 2 + d.ph)) * 0.14;
            u.aL.rotation.z = 1.9; u.aR.rotation.z = -1.9; break;
          default: break;
        }
      }
    }

    // Room divider with an arched opening the boats sail through.
    function portal(s, room, c1, c2, lines) {
      const p = at(s), stub = p.z > 77.2 && Math.abs(p.x - FX) < 4;
      const half = stub ? 2.38 : 4.9, b = Bld();
      for (const sd of [-1, 1]) {
        const w = half - 1.75;
        if (w > 0.3) b.box(c1, w, 8.7, 0.3, sd * (1.75 + w / 2), 4.0, 0);
        b.cyl(c2, 0.2, 0.2, 4.6, sd * 1.75, 2.0, 0.05);
        b.sph(c2, 0.3, sd * 1.75, 4.45, 0.05);
      }
      b.box(c1, 3.5, 4.2, 0.3, 0, 6.25, 0);
      for (let i = 0; i <= 8; i++) b.sph(i % 2 ? c2 : 0xffffff, 0.24, -1.6 + i * 0.4, 4.2 + Math.sin(i / 8 * PI) * 0.35, 0.12);
      const g = new T.Group(); g.add(M(b, room));
      if (lines) {
        for (const zz of [0.2, -0.2]) { const sg = signMesh(lines, 3.3, 1.5, '#fffdf2', '#b8860b', '#e6b83c'); sg.position.set(0, 5.6, zz); if (zz < 0) sg.rotation.y = PI; g.add(sg); }
      }
      g.position.set(p.x, WY - 0.3, p.z); g.rotation.y = Math.atan2(p.tx, p.tz);
      inner.add(g);
      for (let i = 0; i <= 10; i++) {
        const a = i / 10 * PI, lx = Math.cos(a) * 1.9, ly = 4.3 + Math.sin(a) * 0.7;
        for (const zz of [-0.25, 0.25]) light(p.x + p.tz * lx + p.tx * zz, WY - 0.3 + ly, p.z - p.tx * lx + p.tz * zz, i % 2 ? 0xffffff : c2, 0.2);
      }
      return g;
    }

    /* ---------------------------------------------------------------- scenes */
    const K = {
      T, Y, WY, PI, FLOOR, CEIL, FX, ROOMS, inner, Bld, M, matOf, at, sNear, sr, put, doll, dollAt, makeDoll, regDoll, portal, light,
      signMesh, basicTex, cvs, hexRGB, anim: (fn) => anims.push(fn), state: { rise: 0, speak: 0 }
    };
    let lincoln = null;
    if (Scenes) lincoln = Scenes.populate(K);

    // Ceiling light strings following the flume through every room.
    for (let s = sIn + 1; s < sOut; s += 1.1) {
      const rm = roomAt(s), p = at(s), ac = ROOMS[rm < 0 ? 0 : rm].accent;
      for (const sd of [-1, 1]) light(p.x + p.tz * sd * 2.6, WY + 7.6 + Math.sin(s * 0.9) * 0.5, p.z - p.tx * sd * 2.6, (Math.round(s) + (sd > 0 ? 1 : 0)) % 3 === 0 ? 0xffffff : ac, 0.17);
    }
    {
      const g = new T.BufferGeometry();
      g.setAttribute('position', new T.Float32BufferAttribute(LP, 3));
      g.setAttribute('aCol', new T.Float32BufferAttribute(LC, 3));
      g.setAttribute('aPh', new T.Float32BufferAttribute(LA, 3));
      const pm = new T.ShaderMaterial({
        uniforms: { uTime, uBeat }, transparent: true, depthWrite: false, blending: T.AdditiveBlending,
        vertexShader: 'attribute vec3 aCol; attribute vec3 aPh; uniform float uTime; uniform float uBeat; varying vec3 vC;' +
          'void main(){ vec4 mv=modelViewMatrix*vec4(position,1.0); float tw=0.6+0.4*sin(uTime*aPh.y+aPh.x); vC=aCol*tw*(0.9+0.25*uBeat);' +
          ' gl_PointSize=clamp(aPh.z*900.0/max(0.5,-mv.z),1.5,48.0); gl_Position=projectionMatrix*mv; }',
        fragmentShader: 'varying vec3 vC; void main(){ float d=length(gl_PointCoord-0.5); float a=smoothstep(0.5,0.05,d); gl_FragColor=vec4(vC*(a*0.9+smoothstep(0.16,0.0,d)*0.9),a); }'
      });
      const pts = new T.Points(g, pm); pts.frustumCulled = false; inner.add(pts);
    }

    /* ---------------------------------------------------------------- boats */
    const BOAT_COL = [0x8fd3ff, 0xffb3c8, 0xffe08a, 0xb9f0c8, 0xd4c0ff, 0xffc49b, 0x9be7e1];
    const boats = [];
    for (let i = 0; i < NBOATS; i++) {
      const c = BOAT_COL[i % BOAT_COL.length], b = Bld();
      b.box(c, 1.9, 0.55, 3.5, 0, 0.2, -0.1).box(c, 1.345, 0.55, 1.345, 0, 0.2, 1.65, 0, PI / 4);
      b.box(0xffffff, 2.0, 0.08, 3.6, 0, 0.5, -0.1).box(0xffffff, 1.42, 0.08, 1.42, 0, 0.5, 1.65, 0, PI / 4);
      b.box(0xf5c542, 2.02, 0.07, 3.62, 0, 0.12, -0.1);
      for (const bz of [-1.45, -0.6, 0.25, 1.1]) b.box(0xfff3d6, 1.62, 0.1, 0.42, 0, 0.56, bz).box(0xfff3d6, 1.62, 0.36, 0.08, 0, 0.74, bz - 0.24);
      const m = M(b, -1); group.add(m); boats.push(m);
    }
    const st = { riding: false, k: 0, dist: 0, base: 0, room: -2, spoke: false, lookL: 0, clockT: 0, paradeT: -1, tickN: 0, speakT: 0, vis: true };
    const boatS = (i) => st.base + i * L / NBOATS;

    /* ---------------------------------------------------------------- exterior: show building, facade, dock, topiary */
    const ext = Bld();
    const WHT = 0xfbf9f2, GLD = 0xe2b23a, PNK = 0xf6b8cf, BLU = 0xa9d8ef, LAV = 0xcdb9ea, MNT = 0xb5e3cf, YEL = 0xfbe38a;
    ext.box(WHT, 41.4, 10.4, 0.4, 306, WY + 4.3, 47.8).box(WHT, 0.4, 10.4, 37.4, 285.7, WY + 4.3, 66.3).box(WHT, 0.4, 10.4, 37.4, 326.3, WY + 4.3, 66.3);
    ext.box(0xe9e4d6, 41.4, 0.4, 37.4, 306, WY + 9.5, 66.3);
    const FZ = 84.93;
    for (const sd of [-1, 1]) {
      ext.box(WHT, 16.2, 12.6, 0.95, FX + sd * 12.7, Y + 2.7, FZ);
      ext.box(GLD, 0.5, 8.8, 1.15, FX + sd * 4.6, Y + 0.8, FZ);
      ext.box(GLD, 16.4, 0.35, 1.15, FX + sd * 12.7, Y + 9.0, FZ);
    }
    ext.box(WHT, 9.2, 4.0, 0.95, FX, Y + 7.0, FZ).box(GLD, 9.7, 0.35, 1.2, FX, Y + 5.0, FZ);
    for (let i = 0; i <= 12; i++) ext.sph(i % 2 ? GLD : WHT, 0.36, FX - 4.2 + i * 0.7, Y + 5.0 - Math.sin(i / 12 * PI) * 0.0, FZ + 0.62);
    const spinners = [];
    function spinner(x, y, z, r) {
      const b = Bld();
      for (let i = 0; i < 4; i++) b.box(GLD, r * 2, r * 0.22, 0.08, 0, 0, 0, 0, 0, i * PI / 4);
      b.cyl(WHT, r * 0.3, r * 0.3, 0.14, 0, 0, 0, PI / 2);
      const m = new T.Mesh(b.geo(), extMat); m.position.set(x, y, z); group.add(m); spinners.push(m);
    }
    const TOWERS = [[-19, 3.2, 11, WHT, 'spire'], [-16, 2.6, 14.5, BLU, 'dome'], [-13.2, 3, 10.6, WHT, 'eiffel'], [-10.4, 2.4, 16.2, PNK, 'spire'],
                    [-7.6, 3, 12.5, WHT, 'onion'], [-5.5, 1.7, 10.2, YEL, 'tri'], [5.5, 1.7, 10.2, MNT, 'tri'], [7.8, 3, 13, WHT, 'dome'],
                    [10.6, 2.4, 17, LAV, 'spire'], [13.4, 3, 10.8, WHT, 'pisa'], [16.2, 2.6, 15, PNK, 'onion'], [19.2, 3, 10.6, WHT, 'flat']];
    TOWERS.forEach(([dx, w, h, col, cap], ti) => {
      const x = FX + dx, z = 85.6 + (ti % 3) * 0.22, top = Y + h;
      ext.box(col, w, h, 0.5, x, Y + h / 2, z).box(GLD, w + 0.2, 0.22, 0.62, x, top, z).box(GLD, w + 0.1, 0.16, 0.6, x, Y + 9.0, z);
      for (let k = 0; k < Math.floor(h / 2.4); k++) {
        const yy = Y + 1.8 + k * 2.4, t = (ti + k) % 3;
        if (t === 0) ext.box(GLD, 0.7, 0.7, 0.08, x, yy, z + 0.27, 0, 0, PI / 4);
        else if (t === 1) ext.cyl([PNK, BLU, LAV, MNT][(ti + k) % 4], 0.42, 0.42, 0.08, x, yy, z + 0.27, PI / 2, 0, 0, 14);
        else ext.box(GLD, w * 0.62, 0.12, 0.08, x, yy, z + 0.27).box(GLD, 0.12, 0.9, 0.08, x, yy, z + 0.27);
      }
      if (cap === 'spire') { ext.cone(GLD, w * 0.5, 4.2, x, top + 2.2, z, 0, 0, 0, 8); spinner(x, top + 4.9, z, 0.7); }
      else if (cap === 'dome') { ext.sph(col === WHT ? BLU : WHT, w * 0.52, x, top + 0.3, z, 1, 1, 0.45); ext.cyl(GLD, 0.07, 0.07, 1.8, x, top + 2.1, z); ext.sph(GLD, 0.22, x, top + 3.1, z); }
      else if (cap === 'onion') { ext.sph(col === WHT ? PNK : WHT, w * 0.5, x, top + 1.0, z, 1, 1.15, 0.45); ext.cone(GLD, w * 0.24, 1.9, x, top + 3.0, z); spinner(x, top + 4.4, z, 0.55); }
      else if (cap === 'tri') { ext.cone(GLD, w * 0.62, 2.6, x, top + 1.4, z, 0, PI / 4, 0, 4); }
      else if (cap === 'eiffel') { ext.cone(GLD, 1.5, 6.4, x, top + 3.3, z, 0, PI / 4, 0, 4); ext.box(WHT, 2.0, 0.2, 0.7, x, top + 1.9, z).box(WHT, 1.2, 0.18, 0.6, x, top + 3.8, z); }
      else if (cap === 'pisa') { for (let k = 0; k < 4; k++) ext.cyl(k % 2 ? WHT : LAV, 0.95, 0.95, 1.1, x + k * 0.2, top + 0.65 + k * 1.1, z, 0, 0, -0.16, 12); ext.cyl(GLD, 1.0, 1.0, 0.16, x + 0.86, top + 4.75, z, 0, 0, -0.16, 12); }
      else { for (let k = -1; k <= 1; k++) ext.box(col, 0.6, 0.7, 0.5, x + k * 1.1, top + 0.45, z); spinner(x, top + 2.0, z, 0.65); ext.cyl(GLD, 0.06, 0.06, 1.6, x, top + 1.0, z); }
    });
    // Central clock tower
    ext.box(WHT, 8.6, 13.4, 1.2, FX, Y + 15.7, 85.3).box(GLD, 9.0, 0.35, 1.4, FX, Y + 22.4, 85.3).box(GLD, 9.0, 0.3, 1.4, FX, Y + 13.2, 85.3);
    for (const sd of [-1, 1]) ext.box(sd < 0 ? BLU : PNK, 1.3, 11.5, 0.9, FX + sd * 5.0, Y + 14.8, 85.2).cone(GLD, 0.85, 2.6, FX + sd * 5.0, Y + 21.9, 85.2, 0, PI / 4, 0, 4);
    ext.cone(GLD, 2.6, 5.6, FX, Y + 25.3, 85.3, 0, PI / 4, 0, 4).box(GLD, 8.9, 0.3, 1.9, FX, Y + 9.75, 86.05);
    ext.cyl(GLD, 3.25, 3.25, 0.3, FX, Y + 17.6, 85.95, PI / 2, 0, 0, 28);
    spinner(FX, Y + 28.6, 85.3, 1.0);
    const facadeMesh = new T.Mesh(ext.geo(), extMat); facadeMesh.castShadow = true; facadeMesh.receiveShadow = true; group.add(facadeMesh);

    // Mary Blair pattern panels on the two base walls
    {
      const c = cvs(256, 256), x = c.getContext('2d');
      x.fillStyle = '#fffdf7'; x.fillRect(0, 0, 256, 256);
      for (let gy = 0; gy < 4; gy++) for (let gx = 0; gx < 4; gx++) {
        const cx = gx * 64 + 32, cy = gy * 64 + 32, k = (gx + gy * 3) % 5;
        x.strokeStyle = '#e2b23a'; x.lineWidth = 3; x.strokeRect(cx - 27, cy - 27, 54, 54);
        x.fillStyle = ['#f6b8cf', '#a9d8ef', '#fbe38a', '#cdb9ea', '#b5e3cf'][k];
        x.beginPath();
        if (k % 2) x.arc(cx, cy, 18, 0, PI * 2); else { x.moveTo(cx, cy - 22); x.lineTo(cx + 22, cy); x.lineTo(cx, cy + 22); x.lineTo(cx - 22, cy); x.closePath(); }
        x.fill();
        x.fillStyle = '#e2b23a'; x.beginPath(); x.arc(cx, cy, 5, 0, PI * 2); x.fill();
      }
      const tx = new T.CanvasTexture(c); tx.wrapS = tx.wrapT = T.RepeatWrapping; tx.repeat.set(6, 3.4);
      const pm = new T.MeshLambertMaterial({ map: tx, emissive: 0x1a1812 });
      for (const sd of [-1, 1]) { const pl = new T.Mesh(new T.PlaneGeometry(15.4, 8.6), pm); pl.position.set(FX + sd * 12.7, Y + 4.5, 85.43); group.add(pl); }
    }
    // Smiling clock face that rocks from side to side
    const clockFace = (() => {
      const c = cvs(512, 512), x = c.getContext('2d');
      x.fillStyle = '#fffdf2'; x.beginPath(); x.arc(256, 256, 254, 0, PI * 2); x.fill();
      x.strokeStyle = '#e2b23a'; x.lineWidth = 10;
      for (let i = 0; i < 24; i++) { const a = i / 24 * PI * 2; x.beginPath(); x.moveTo(256 + Math.cos(a) * 150, 256 + Math.sin(a) * 150); x.lineTo(256 + Math.cos(a) * (i % 2 ? 215 : 244), 256 + Math.sin(a) * (i % 2 ? 215 : 244)); x.stroke(); }
      x.fillStyle = '#f7c948'; x.beginPath(); x.arc(256, 256, 152, 0, PI * 2); x.fill();
      x.strokeStyle = '#c98a12'; x.lineWidth = 8; x.stroke();
      x.fillStyle = '#3b2a12'; x.beginPath(); x.arc(204, 222, 17, 0, PI * 2); x.arc(308, 222, 17, 0, PI * 2); x.fill();
      x.fillStyle = '#ff9aa8'; x.beginPath(); x.arc(166, 282, 22, 0, PI * 2); x.arc(346, 282, 22, 0, PI * 2); x.fill();
      x.strokeStyle = '#8a4b0a'; x.lineWidth = 12; x.lineCap = 'round'; x.beginPath(); x.arc(256, 262, 74, 0.14 * PI, 0.86 * PI); x.stroke();
      const m = new T.Mesh(new T.CircleGeometry(3.0, 40), new T.MeshLambertMaterial({ map: new T.CanvasTexture(c), emissive: 0x3a2f12 }));
      m.position.set(FX, Y + 17.6, 86.14); group.add(m);
      return m;
    })();
    // Clock doors + quarter-hour doll parade
    const doorMat = extMat, doors = [];
    for (const sd of [-1, 1]) {
      const d = new T.Mesh(Bld().box(sd < 0 ? BLU : PNK, 1.5, 2.6, 0.2, 0, 0, 0).box(GLD, 1.1, 0.14, 0.24, 0, 0.6, 0).box(GLD, 1.1, 0.14, 0.24, 0, -0.6, 0).geo(), doorMat);
      d.position.set(FX + sd * 3.0, Y + 11.4, 86.0); group.add(d); doors.push(d);
    }
    const paradeGrp = new T.Group(); paradeGrp.visible = false; group.add(paradeGrp);
    const PARADE = [
      { skin: 0, hair: 0xf2c94c, hat: 'bonnet', top: 0x3b82c4, bot: 0x3b82c4, skirt: 1 }, { skin: 2, hair: 0x1c1c1c, hat: 'sombrero', hatC: 0xf2b84b, top: 0xffffff, bot: 0x2d6a4f },
      { skin: 1, hair: 0x1c1c1c, hat: 'cone', hatC: 0xe9c46a, top: 0xd62828, bot: 0x1d3557 }, { skin: 3, hair: 0x1c1c1c, hat: 'flower', top: 0xffb703, bot: 0xfb8500, skirt: 1 },
      { skin: 0, hair: 0x7a4a21, hat: 'bearskin', top: 0xd62828, bot: 0x1c1c1c }, { skin: 4, hair: 0x1c1c1c, hat: 'turban', hatC: 0x7b2cbf, top: 0xf4a261, bot: 0xffffff },
      { skin: 1, hair: 0x1c1c1c, hat: 'feather', top: 0xd9a066, bot: 0xd9a066 }, { skin: 0, hair: 0xd9480f, hat: 'beret', hatC: 0x1d3557, top: 0xffffff, bot: 0xd62828, skirt: 1 }
    ].map((o, i) => { o.sc = 0.82; const g = makeDoll(o, neutralMat); g.position.set(0, Y + 9.92, 86.3); paradeGrp.add(g); return regDoll(g, 'march', i * 0.8); });

    // Load dock canopy, entrance sign, topiary garden
    const misc = Bld();
    for (const px of [312.6, 318, 323.4]) for (const pz of [89.6, 93.2]) misc.cyl(GLD, 0.09, 0.09, 3.3, px, Y + 1.65, pz);
    misc.box(WHT, 12.4, 0.22, 4.6, 318, Y + 3.4, 91.4);
    for (let i = 0; i < 12; i++) misc.sph([PNK, BLU, YEL, MNT][i % 4], 0.52, 312.3 + i * 1.04, Y + 3.3, 93.7, 1, 0.8, 0.3);
    misc.cone(GLD, 0.5, 1.2, 318, Y + 4.1, 91.4, 0, PI / 4, 0, 4);
    for (let i = 0; i < 9; i++) misc.cyl(GLD, 0.05, 0.05, 1.0, 312 + i * 1.5, Y + 0.5, 93.75);
    misc.box(GLD, 12.2, 0.07, 0.07, 318, Y + 1.0, 93.75);
    const GRN = 0x2f8a45, GRN2 = 0x3fa85a;
    const topiary = (x, z, kind) => {
      misc.cyl(WHT, 0.75, 0.9, 0.5, x, Y + 0.25, z, 0, 0, 0, 12);
      if (kind === 0) { for (let k = 0; k < 3; k++) misc.sph(k % 2 ? GRN2 : GRN, 0.95 - k * 0.24, x, Y + 1.3 + k * 1.15, z); misc.sph(GLD, 0.16, x, Y + 4.55, z); }
      else if (kind === 1) { misc.cone(GRN, 0.95, 3.4, x, Y + 2.2, z); for (let k = 0; k < 7; k++) misc.sph(GRN2, 0.3, x + Math.cos(k * 1.4) * (0.8 - k * 0.1), Y + 0.9 + k * 0.42, z + Math.sin(k * 1.4) * (0.8 - k * 0.1)); }
      else if (kind === 2) { // giraffe
        misc.sph(GRN, 0.62, x, Y + 2.0, z, 0.8, 0.8, 1.5); for (const a of [-1, 1]) for (const c2 of [-1, 1]) misc.cyl(GRN, 0.11, 0.1, 1.5, x + a * 0.28, Y + 1.2, z + c2 * 0.55);
        misc.cyl(GRN2, 0.16, 0.22, 2.1, x, Y + 3.2, z + 1.05, 0.45).sph(GRN, 0.3, x, Y + 4.3, z + 1.65, 0.8, 0.8, 1.3);
      } else { // elephant
        misc.sph(GRN, 0.95, x, Y + 1.7, z, 0.9, 0.85, 1.25); for (const a of [-1, 1]) for (const c2 of [-1, 1]) misc.cyl(GRN, 0.22, 0.22, 1.0, x + a * 0.45, Y + 0.95, z + c2 * 0.6);
        misc.sph(GRN2, 0.6, x, Y + 2.1, z + 1.25).cyl(GRN2, 0.1, 0.17, 1.3, x, Y + 1.5, z + 1.85, 0.5);
        for (const a of [-1, 1]) misc.sph(GRN2, 0.5, x + a * 0.62, Y + 2.2, z + 1.05, 0.25, 1, 0.8);
      }
    };
    [[288.5, 90, 2], [292.5, 87.6, 0], [296.5, 90.6, 3], [299.6, 87.4, 1], [312.6, 87, 1], [316.5, 86.8, 0], [320.5, 87, 2], [324.5, 86.9, 0],
     [289, 103.4, 0], [295, 103.8, 1], [317, 103.8, 3], [323, 103.4, 0]].forEach(([x, z, k]) => topiary(x, z, k));
    for (let i = 0; i < 26; i++) misc.sph([0xff5d8f, 0xffd43b, 0xffffff, 0xff922b, 0xc77dff][i % 5], 0.3, 287 + (i * 7.3) % 13, Y + 0.2, 92.6 + (i % 2) * 0.5, 1, 0.5, 1);
    const miscMesh = new T.Mesh(misc.geo(), extMat); miscMesh.castShadow = true; group.add(miscMesh);
    const dockSign = signMesh(['it’s a small world', '世界上最快乐的航行 · THE HAPPIEST CRUISE THAT EVER SAILED'], 9, 1.5, '#fffdf2', '#b8860b', '#e2b23a');
    dockSign.position.set(318, Y + 4.4, 93.75); group.add(dockSign);

    /* ---------------------------------------------------------------- ride */
    const LINCOLN_S = sNear(291, 72.5);
    const SPEECH = 'Four score and seven years ago, our fathers brought forth on this continent a new nation, conceived in liberty, and dedicated to the proposition that all men are created equal.';
    const camS = () => boatS(st.k) + 0.75;
    const ride = {
      id: 'small_world_boat', name: '小小世界 · it’s a small world（含林肯先生）', land: 'Fantasyland',
      boardPos: { x: 318, y: Y, z: 91.6 },
      exitPos: { x: 318, y: Y, z: 90.4, yaw: 0 },
      start() {
        let best = 0, bd = 1e9;
        for (let i = 0; i < NBOATS; i++) { const s = wrap(boatS(i)), d = Math.min(s, L - s); if (d < bd) { bd = d; best = i; } }
        st.base -= boatS(best); st.k = best; st.dist = 0; st.room = -2; st.spoke = false; st.riding = true;
        if (audio) audio.start();
      },
      stop() { st.riding = false; if (audio) audio.hush(); K.state.speak = 0; },
      isRunning: () => st.riding,
      getCameraPose(third) {
        if (!st.riding) return { px: 318, py: Y + 1.7, pz: 92.6, tx: FX, ty: Y + 12, tz: 85 };
        const s = camS(), p = at(s), q = pt(s + 6.5), eye = WY + 1.62;
        let tx = q.x, ty = eye - 0.12, tz = q.z;
        const sway = Math.sin(uTime.value * 0.33) * 1.6;
        tx += p.tz * sway; tz -= p.tx * sway;
        if (lincoln && st.lookL > 0.001) { const w = st.lookL; tx += (lincoln.x - tx) * w; ty += (lincoln.y - ty) * w; tz += (lincoln.z - tz) * w; }
        if (third) { const b = pt(s - 5.2); return { px: b.x, py: WY + 3.6, pz: b.z, tx, ty: WY + 1.2, tz }; }
        return { px: p.x, py: eye + boats[st.k].position.y - WY - 0.1, pz: p.z, tx, ty, tz };
      }
    };

    let fallbackBeats = 0;
    function update(dt, elapsed, onEvent, cam) {
      uTime.value = elapsed;
      const cx = cam ? cam.x : FX, cz = cam ? cam.z : 80;
      const dist = Math.hypot(cx - FX, cz - 76);
      const near = st.riding || dist < 130;
      if (near !== st.vis) { st.vis = near; inner.visible = near; }
      if (!near) { if (audio) { audio.setLevel(0); audio.update(0); } return; }

      // Soundtrack
      fallbackBeats += dt * 116 / 60;
      let bp = fallbackBeats;
      if (audio) {
        audio.setLevel(st.riding ? 0.62 : Math.max(0, Math.min(0.3, (70 - dist) / 110)));
        if (!st.riding) audio.setRoom('outdoor');
        bp = audio.update(fallbackBeats);
      }
      uBeat.value = Math.pow(Math.max(0, Math.cos(bp * PI * 2)), 6);

      // Boats
      st.base += dt * SPEED;
      for (let i = 0; i < NBOATS; i++) {
        const s = boatS(i), p = at(s), b = boats[i];
        b.position.set(p.x, WY + 0.02 + Math.sin(elapsed * 2.1 + i * 1.9) * 0.035, p.z);
        b.rotation.y = Math.atan2(p.tx, p.tz);
        b.rotation.z = Math.sin(elapsed * 1.3 + i) * 0.018;
      }

      // Facade: rocking clock, spinners, tick-tock, quarter-hour parade
      clockFace.rotation.z = Math.sin(elapsed * 2.1) * 0.24;
      for (let i = 0; i < spinners.length; i++) spinners[i].rotation.z = elapsed * (i % 2 ? 1.4 : -1.1);
      const tk = Math.floor(elapsed * 2.1 / PI);
      if (tk !== st.tickN) { st.tickN = tk; if (audio && !st.riding && dist < 60) audio.tick(tk % 2); }
      st.clockT += dt;
      if (st.paradeT < 0 && st.clockT > 55) { st.paradeT = 0; st.clockT = 0; paradeGrp.visible = true; if (audio && roomAt(st.riding ? camS() : -1) < 0) audio.chime(); }
      if (st.paradeT >= 0) {
        st.paradeT += dt;
        const pt2 = st.paradeT, open = Math.min(1, pt2 / 1.5) * Math.min(1, Math.max(0, (17.5 - pt2) / 1.5));
        doors[0].position.x = FX - 3.0 - open * 1.2; doors[1].position.x = FX + 3.0 + open * 1.2;
        PARADE.forEach((g, i) => { const x = -4.4 + (pt2 - 1.2) * 0.75 - i * 0.95; g.position.x = FX + x; g.visible = x > -3.1 && x < 3.1; g.rotation.y = PI / 2 * 0.55; });
        if (pt2 > 19) { st.paradeT = -1; paradeGrp.visible = false; }
      }

      // Show animation
      animateDolls(bp);
      for (let i = 0; i < anims.length; i++) anims[i](elapsed, bp, dt);

      // Riding logic
      let targetLook = 0;
      if (st.riding) {
        st.dist += dt * SPEED;
        const s = wrap(camS()), rm = roomAt(s);
        if (rm !== st.room) {
          st.room = rm;
          if (audio) audio.setRoom(rm < 0 ? 'outdoor' : ROOMS[rm].id);
          if (onEvent) {
            if (rm >= 0) onEvent(ROOMS[rm].msg);
            else if (st.dist < 20) onEvent('⛵ 启航！沿着花园运河驶向微笑时钟立面——留意每隔一分钟的报时娃娃游行');
            else onEvent('👋 再见！Goodbye · Au revoir · Adiós · さようなら · Ciao · Aloha');
          }
        }
        const dl = LINCOLN_S - s;
        if (dl < 10 && dl > -5.5) targetLook = Math.min(1, (10 - dl) / 4) * Math.min(1, (dl + 5.5) / 2.5) * 0.8;
        if (!st.spoke && dl < 8.5 && dl > 0) {
          st.spoke = true; K.state.speak = 1; st.speakT = 16;
          if (onEvent) onEvent('🎩 林肯先生起身演讲：“八十七年前，我们的先辈在这片大陆上创立了一个新国家，它孕育于自由之中，奉行人人生而平等的信念。”');
          if (audio) audio.speak(SPEECH, () => { K.state.speak = 0; }); else setTimeout(() => { K.state.speak = 0; }, 9000);
        }
        const r = st.room;
        const tt = r >= 0 ? ROOMS[r].tint : [0.6, 0.85, 1];
        waterTint.x += (tt[0] - waterTint.x) * Math.min(1, dt * 2); waterTint.y += (tt[1] - waterTint.y) * Math.min(1, dt * 2); waterTint.z += (tt[2] - waterTint.z) * Math.min(1, dt * 2);
        if (st.dist >= L) {
          st.riding = false; K.state.speak = 0;
          if (audio) { audio.hush(); audio.setRoom('outdoor'); }
          if (onEvent) onEvent('⚓ 游船已靠岸，欢迎再次乘坐「小小世界」！');
        }
      }
      if (K.state.speak && (st.speakT -= dt) <= 0) K.state.speak = 0;
      st.lookL += (targetLook - st.lookL) * Math.min(1, dt * 2.2);
      K.state.rise += ((K.state.speak || targetLook > 0.05 ? 1 : 0) - K.state.rise) * Math.min(1, dt * 1.6);
    }

    return { update, ride };
  }

  root.TPSmallWorld = { build };
})(window);

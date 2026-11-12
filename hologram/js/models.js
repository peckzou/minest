/* Minest Duo Holographic Portal — 原创程序化模型（无外部素材）
 * 每个模型输出一个非索引 BufferGeometry，带 position / normal / aTint，
 * 底面在 y=0，x/z 居中。 */
(function () {
  'use strict';
  var T = THREE;
  var WHITE = [1.0, 1.0, 1.0], PALE = [0.72, 0.95, 1.0], BLUE = [0.22, 0.5, 1.0];

  function mat(px, py, pz, rx, ry, rz, sx, sy, sz) {
    var m = new T.Matrix4();
    m.compose(
      new T.Vector3(px || 0, py || 0, pz || 0),
      new T.Quaternion().setFromEuler(new T.Euler(rx || 0, ry || 0, rz || 0)),
      new T.Vector3(sx == null ? 1 : sx, sy == null ? 1 : sy, sz == null ? 1 : sz)
    );
    return m;
  }

  // 合并若干几何体（r128 的 vendor 里没有 BufferGeometryUtils）
  function merge(parts) {
    var pos = [], nor = [], col = [];
    parts.forEach(function (p) {
      var g = p.g.index ? p.g.toNonIndexed() : p.g.clone();
      if (p.m) g.applyMatrix4(p.m);
      if (!g.attributes.normal) g.computeVertexNormals();
      var P = g.attributes.position.array, N = g.attributes.normal.array, c = p.c || PALE;
      for (var i = 0; i < P.length; i += 3) {
        pos.push(P[i], P[i + 1], P[i + 2]);
        nor.push(N[i], N[i + 1], N[i + 2]);
        col.push(c[0], c[1], c[2]);
      }
      g.dispose();
    });
    return build(pos, nor, col);
  }

  function build(pos, nor, col) {
    var g = new T.BufferGeometry();
    g.setAttribute('position', new T.Float32BufferAttribute(pos, 3));
    g.setAttribute('normal', new T.Float32BufferAttribute(nor, 3));
    g.setAttribute('aTint', new T.Float32BufferAttribute(col, 3));
    return g;
  }

  // 归一化：限制高度和宽度，底面落到 y=0，x/z 居中
  function finalize(g, maxH, maxW) {
    g.computeBoundingBox();
    var b = g.boundingBox, sz = new T.Vector3(); b.getSize(sz);
    var s = Math.min(maxH / sz.y, maxW / Math.max(sz.x, sz.z));
    g.translate(-(b.min.x + b.max.x) / 2, -b.min.y, -(b.min.z + b.max.z) / 2);
    g.scale(s, s, s);
    g.computeBoundingBox();
    return g;
  }

  /* ---------- 1. 3D 字母 M ---------- */
  function letterM() {
    var s = new T.Shape();
    [[-1, 0], [-1, 2], [-0.5, 2], [0, 1.1], [0.5, 2], [1, 2], [1, 0], [0.58, 0],
     [0.58, 1.2], [0, 0.3], [-0.58, 1.2], [-0.58, 0]].forEach(function (p, i) {
      if (i) s.lineTo(p[0], p[1]); else s.moveTo(p[0], p[1]);
    });
    var g = new T.ExtrudeGeometry(s, { depth: 0.5, bevelEnabled: true, bevelThickness: 0.05, bevelSize: 0.05, bevelSegments: 1, steps: 1 });
    return finalize(merge([{ g: g, c: PALE }]), 1.9, 1.9);
  }

  /* ---------- 2. 科幻飞船（机头朝 +z） ---------- */
  function ship() {
    var HP = Math.PI / 2, parts = [];
    // 机身：细端朝前
    parts.push({ g: new T.CylinderGeometry(0.13, 0.34, 2.2, 12), m: mat(0, 0, 0, HP, 0, 0), c: PALE });
    parts.push({ g: new T.ConeGeometry(0.13, 0.55, 12), m: mat(0, 0, 1.375, HP, 0, 0), c: WHITE });
    // 座舱
    parts.push({ g: new T.SphereGeometry(0.22, 14, 10), m: mat(0, 0.2, 0.25, 0, 0, 0, 1, 0.75, 1.9), c: BLUE });
    // 后掠翼（XZ 平面内的梯形，挤出成薄板）
    var w = new T.Shape();
    w.moveTo(0.2, 0.5); w.lineTo(1.55, -0.75); w.lineTo(1.55, -1.1); w.lineTo(0.2, -0.85); w.lineTo(0.2, 0.5);
    var wg = new T.ExtrudeGeometry(w, { depth: 0.06, bevelEnabled: false });
    // 形状的 y 轴 → 世界 z 轴；厚度沿 y
    parts.push({ g: wg, m: mat(0, 0.03, 0, HP, 0, 0, 1, 1, 1), c: PALE });
    parts.push({ g: wg, m: mat(0, 0.03, 0, HP, 0, 0, -1, 1, 1), c: PALE });
    // 翼尖挂架
    [-1, 1].forEach(function (sd) {
      parts.push({ g: new T.BoxGeometry(0.07, 0.46, 0.8), m: mat(sd * 1.55, 0, -0.9), c: WHITE });
      // 引擎 + 喷口光环
      parts.push({ g: new T.CylinderGeometry(0.2, 0.15, 0.7, 12), m: mat(sd * 0.46, -0.02, -1.0, HP, 0, 0), c: PALE });
      parts.push({ g: new T.TorusGeometry(0.19, 0.035, 6, 18), m: mat(sd * 0.46, -0.02, -1.37), c: BLUE });
    });
    // 垂尾
    var f = new T.Shape();
    f.moveTo(-0.1, 0); f.lineTo(-0.75, 0); f.lineTo(-0.95, 0.6); f.lineTo(-0.7, 0.6); f.lineTo(-0.1, 0);
    parts.push({ g: new T.ExtrudeGeometry(f, { depth: 0.05, bevelEnabled: false }), m: mat(-0.025, 0.22, -0.25, 0, -HP, 0), c: WHITE });
    var g = merge(parts);
    // 飞船翼面朝下看时翻转过来：让 +z 为机头
    return finalize(g, 2.0, 2.5);
  }

  /* ---------- 3. 圣托里尼风格体素小屋（白墙蓝顶） ---------- */
  function hut() {
    var vox = {};
    function key(x, y, z) { return x + ',' + y + ',' + z; }
    function set(x, y, z, c) { vox[key(x, y, z)] = c; }
    function box(x0, x1, y0, y1, z0, z1, c) {
      for (var x = x0; x <= x1; x++) for (var y = y0; y <= y1; y++) for (var z = z0; z <= z1; z++) set(x, y, z, c);
    }
    // 主屋
    box(1, 7, 0, 4, 1, 6, WHITE);
    box(1, 7, 5, 5, 1, 6, WHITE);                 // 屋檐
    // 蓝色穹顶
    for (var x = 1; x <= 7; x++) for (var y = 6; y <= 9; y++) for (var z = 1; z <= 6; z++) {
      var dx = x - 4, dy = y - 5.4, dz = z - 3.5;
      if (dx * dx + dy * dy * 1.15 + dz * dz < 2.75 * 2.75) set(x, y, z, BLUE);
    }
    set(4, 8, 3, WHITE); set(4, 8, 4, WHITE);      // 顶饰
    // 门、窗（正面 z=6）
    box(4, 4, 0, 1, 6, 6, BLUE);
    set(2, 2, 6, BLUE); set(6, 2, 6, BLUE); set(1, 2, 3, BLUE);
    // 侧屋 + 女儿墙
    box(8, 10, 0, 2, 2, 5, WHITE);
    for (var ax = 8; ax <= 10; ax++) for (var az = 2; az <= 5; az++) {
      if (ax === 10 || az === 2 || az === 5) set(ax, 3, az, WHITE);
    }
    set(10, 1, 3, BLUE); set(9, 1, 5, BLUE);
    box(9, 9, 3, 4, 3, 3, WHITE);                  // 烟囱
    // 侧面台阶
    for (var i = 0; i < 4; i++) box(0, 0, 0, i, 5 - i, 5 - i, WHITE);
    // 门前矮墙与花盆
    set(2, 0, 7, WHITE); set(6, 0, 7, WHITE); set(6, 1, 7, BLUE);

    // 只生成外露面
    var D = [[1, 0, 0], [-1, 0, 0], [0, 1, 0], [0, -1, 0], [0, 0, 1], [0, 0, -1]];
    var Q = [ // 每个朝向的 4 个角（逆时针）
      [[1, 0, 0], [1, 1, 0], [1, 1, 1], [1, 0, 1]],
      [[0, 0, 1], [0, 1, 1], [0, 1, 0], [0, 0, 0]],
      [[0, 1, 1], [1, 1, 1], [1, 1, 0], [0, 1, 0]],
      [[0, 0, 0], [1, 0, 0], [1, 0, 1], [0, 0, 1]],
      [[1, 0, 1], [1, 1, 1], [0, 1, 1], [0, 0, 1]],
      [[0, 0, 0], [0, 1, 0], [1, 1, 0], [1, 0, 0]]
    ];
    var pos = [], nor = [], col = [];
    Object.keys(vox).forEach(function (k) {
      var p = k.split(',').map(Number), c = vox[k];
      for (var d = 0; d < 6; d++) {
        if (vox[key(p[0] + D[d][0], p[1] + D[d][1], p[2] + D[d][2])]) continue;
        var q = Q[d];
        [0, 1, 2, 0, 2, 3].forEach(function (ix) {
          pos.push(p[0] + q[ix][0], p[1] + q[ix][1], p[2] + q[ix][2]);
          nor.push(D[d][0], D[d][1], D[d][2]);
          col.push(c[0], c[1], c[2]);
        });
      }
    });
    return finalize(build(pos, nor, col), 2.0, 2.4);
  }

  /* ---------- 4+. 外部展品（js/exhibit_*.js 里量化后的网格） ---------- */
  function b64(str, Type) {
    var bin = atob(str), n = bin.length, u8 = new Uint8Array(n);
    for (var i = 0; i < n; i++) u8[i] = bin.charCodeAt(i);
    return new Type(u8.buffer);
  }
  function external(e) {
    var q = b64(e.pos, Int16Array), pos = new Float32Array(q.length);
    for (var i = 0; i < q.length; i++) pos[i] = q[i] / e.scale;
    var g = new T.BufferGeometry();
    g.setAttribute('position', new T.BufferAttribute(pos, 3));
    g.setIndex(new T.BufferAttribute(b64(e.idx, Uint16Array), 1));
    g.computeVertexNormals();                       // 先在索引网格上算平滑法线
    var flat = g.toNonIndexed(); g.dispose();
    var n = flat.attributes.position.count, tint = new Float32Array(n * 3), c = e.tint || [0.3, 0.6, 1.0];
    for (var k = 0; k < n; k++) { tint[k * 3] = c[0]; tint[k * 3 + 1] = c[1]; tint[k * 3 + 2] = c[2]; }
    flat.setAttribute('aTint', new T.BufferAttribute(tint, 3));
    return finalize(flat, 2.15, 1.9);
  }

  window.HOLO = window.HOLO || {};
  window.HOLO.models = function () {
    var extra = (window.HOLO.extra || []).map(function (e) { return { name: e.name, geo: external(e), lift: 0 }; });
    return [
      { name: 'M', geo: letterM(), lift: 0 },
      { name: '飞船', geo: ship(), lift: 0.45, bob: 1 },
      { name: '小屋', geo: hut(), lift: 0 }
    ].concat(extra);
  };
})();

/* Clun · 几何工具：把三角面按材质攒在一起，最后每种材质出一个网格。全部用工程坐标（+X 北、+Y 西、+Z 上）。 */
(function () {
  'use strict';
  var C = window.Clun = window.Clun || {};
  var K = C.Kit = {};

  function sub(a, b) { return [a[0] - b[0], a[1] - b[1], a[2] - b[2]]; }
  function add(a, b) { return [a[0] + b[0], a[1] + b[1], a[2] + b[2]]; }
  function mul(a, s) { return [a[0] * s, a[1] * s, a[2] * s]; }
  function dot(a, b) { return a[0] * b[0] + a[1] * b[1] + a[2] * b[2]; }
  function cross(a, b) { return [a[1] * b[2] - a[2] * b[1], a[2] * b[0] - a[0] * b[2], a[0] * b[1] - a[1] * b[0]]; }
  function norm(a) { var l = Math.sqrt(dot(a, a)) || 1; return [a[0] / l, a[1] / l, a[2] / l]; }
  function newell(pts) {
    var n = [0, 0, 0];
    for (var i = 0; i < pts.length; i++) { var a = pts[i], b = pts[(i + 1) % pts.length];
      n[0] += (a[1] - b[1]) * (a[2] + b[2]); n[1] += (a[2] - b[2]) * (a[0] + b[0]); n[2] += (a[0] - b[0]) * (a[1] + b[1]); }
    return norm(n);
  }
  K.rad = function (deg) { return deg * Math.PI / 180; };
  K.tan = function (deg) { return Math.tan(deg * Math.PI / 180); };

  function Batch() { this.m = {}; }
  K.Batch = Batch;
  Batch.prototype.acc = function (mat) { return this.m[mat] || (this.m[mat] = { p: [], n: [] }); };
  Batch.prototype.tri = function (mat, a, b, c, n) {
    var o = this.acc(mat); n = n || norm(cross(sub(b, a), sub(c, a)));
    o.p.push(a[0], a[1], a[2], b[0], b[1], b[2], c[0], c[1], c[2]);
    o.n.push(n[0], n[1], n[2], n[0], n[1], n[2], n[0], n[1], n[2]);
  };
  /* 凸平面多边形 */
  Batch.prototype.fan = function (mat, pts) { for (var i = 1; i < pts.length - 1; i++) this.tri(mat, pts[0], pts[i], pts[i + 1]); };
  /* 凸平面多边形沿 off 拉伸成实体 */
  Batch.prototype.extrude = function (mat, pts, off) {
    var n = newell(pts); if (dot(n, off) > 0) pts = pts.slice().reverse();
    var q = pts.map(function (p) { return add(p, off); }), L = pts.length;
    this.fan(mat, pts); this.fan(mat, q.slice().reverse());
    for (var i = 0; i < L; i++) { var j = (i + 1) % L; this.fan(mat, [pts[i], q[i], q[j], pts[j]]); }
  };
  /* 屋面板：pts 是屋面上表面，向下加厚 t */
  Batch.prototype.slab = function (mat, pts, t) { var n = newell(pts); if (n[2] < 0) n = mul(n, -1); this.extrude(mat, pts, mul(n, -t)); };
  /* 轴对齐盒 */
  Batch.prototype.box = function (mat, x0, y0, z0, x1, y1, z1) {
    this.extrude(mat, [[x0, y0, z1], [x1, y0, z1], [x1, y1, z1], [x0, y1, z1]], [0, 0, z0 - z1]);
  };
  /* 绕 Z 转 rot 的盒：中心 (cx,cy)，半长 hx、hy */
  Batch.prototype.obox = function (mat, cx, cy, hx, hy, rot, z0, z1) {
    var c = Math.cos(rot), s = Math.sin(rot);
    function pt(u, v) { return [cx + u * c - v * s, cy + u * s + v * c, z1]; }
    this.extrude(mat, [pt(-hx, -hy), pt(hx, -hy), pt(hx, hy), pt(-hx, hy)], [0, 0, z0 - z1]);
  };
  /* 任意（可凹）平面轮廓 pts2 = [[x,y],…] 在 z0..z1 之间的柱体：楼板用 */
  Batch.prototype.prism = function (mat, pts2, z0, z1) {
    var con = pts2.map(function (p) { return new THREE.Vector2(p[0], p[1]); });
    if (THREE.ShapeUtils.isClockWise(con)) { con.reverse(); pts2 = pts2.slice().reverse(); }
    var f = THREE.ShapeUtils.triangulateShape(con, []), self = this;
    f.forEach(function (t) {
      var a = pts2[t[0]], b = pts2[t[1]], c = pts2[t[2]];
      if ((b[0] - a[0]) * (c[1] - a[1]) - (b[1] - a[1]) * (c[0] - a[0]) < 0) { var x = b; b = c; c = x; }
      self.tri(mat, [a[0], a[1], z1], [b[0], b[1], z1], [c[0], c[1], z1]);
      self.tri(mat, [a[0], a[1], z0], [c[0], c[1], z0], [b[0], b[1], z0]);
    });
    for (var i = 0; i < pts2.length; i++) { var p = pts2[i], q = pts2[(i + 1) % pts2.length];
      this.fan(mat, [[p[0], p[1], z1], [p[0], p[1], z0], [q[0], q[1], z0], [q[0], q[1], z1]]); }
  };
  /* 现成的 THREE 几何体（如圆柱），m 是放到工程坐标里的矩阵 */
  Batch.prototype.geom = function (mat, g, m) {
    g = g.index ? g.toNonIndexed() : g; g.applyMatrix4(m);
    var o = this.acc(mat), p = g.attributes.position.array, n = g.attributes.normal.array, i;
    for (i = 0; i < p.length; i++) { o.p.push(p[i]); o.n.push(n[i]); }
    g.dispose();
  };
  /* 竖直圆柱（轴沿 Z） */
  Batch.prototype.cyl = function (mat, x, y, z0, z1, r0, r1, seg) {
    var g = new THREE.CylinderGeometry(r1, r0, z1 - z0, seg || 14);
    var m = new THREE.Matrix4().makeRotationX(Math.PI / 2); m.setPosition(x, y, (z0 + z1) / 2);
    this.geom(mat, g, m);
  };
  /* 一段墙。p0→p1 是外墙面线，室内在行进方向左手边，厚 t 向内。ops = 洞口：
     { c:[x,y] 或 s:沿墙距离, w, z0, z1, kind:'glass'|'door'|'open' }。e0/e1 = 两端延长（补阴角）。 */
  Batch.prototype.wall = function (mat, p0, p1, t, z0, z1, ops, e0, e1) {
    var dx = p1[0] - p0[0], dy = p1[1] - p0[1], L = Math.sqrt(dx * dx + dy * dy); if (L < 1e-6) return;
    var u = [dx / L, dy / L], nl = [-u[1], u[0]], self = this;
    function at(s, d, z) { return [p0[0] + u[0] * s + nl[0] * d, p0[1] + u[1] * s + nl[1] * d, z]; }
    function piece(m, sa, sb, za, zb, d0, d1) {
      if (sb - sa < 1e-4 || zb - za < 1e-4) return;
      self.extrude(m, [at(sa, d0, zb), at(sb, d0, zb), at(sb, d1, zb), at(sa, d1, zb)], [0, 0, za - zb]);
    }
    ops = (ops || []).map(function (o) {
      var s = o.s != null ? o.s : (o.c[0] - p0[0]) * u[0] + (o.c[1] - p0[1]) * u[1];
      return { a: Math.max(0, s - o.w / 2), b: Math.min(L, s + o.w / 2), z0: Math.max(z0, o.z0), z1: Math.min(z1, o.z1), kind: o.kind || 'glass' };
    }).sort(function (a, b) { return a.a - b.a; });
    var cur = -(e0 || 0);
    ops.forEach(function (o) {
      piece(mat, cur, o.a, z0, z1, 0, t); piece(mat, o.a, o.b, z0, o.z0, 0, t); piece(mat, o.a, o.b, o.z1, z1, 0, t);
      if (o.kind !== 'open') piece(o.kind, o.a, o.b, o.z0, o.z1, t * 0.35, t * 0.35 + 0.04);
      cur = o.b;
    });
    piece(mat, cur, L + (e1 || 0), z0, z1, 0, t);
  };
  /* 一圈墙。list = [{p:[x,y], n:'段名'}…]，段 i 从 list[i] 到 list[i+1]；closed 时最后一点连回第一点。
     室内在左手边。阴角（右转）处自动把相邻两段各延长一点补齐。ops[段名] = 该段洞口。 */
  Batch.prototype.walls = function (mat, list, closed, t, z0, z1, ops) {
    var N = list.length, segs = closed ? N : N - 1, i;
    function dir(i) { var a = list[i % N].p, b = list[(i + 1) % N].p, l = Math.sqrt(Math.pow(b[0] - a[0], 2) + Math.pow(b[1] - a[1], 2)) || 1; return [(b[0] - a[0]) / l, (b[1] - a[1]) / l]; }
    function ext(i) {   /* 段 i 起点处的补长 */
      if (!closed && i === 0) return 0;
      var a = dir((i - 1 + N) % N), b = dir(i), cr = a[0] * b[1] - a[1] * b[0]; if (cr > -1e-6) return 0;
      var ang = Math.acos(Math.max(-1, Math.min(1, a[0] * b[0] + a[1] * b[1]))); return t * Math.tan(ang / 2);
    }
    for (i = 0; i < segs; i++) {
      var e1 = (!closed && i === segs - 1) ? 0 : ext((i + 1) % N);
      this.wall(mat, list[i].p, list[(i + 1) % N].p, t, z0, z1, ops && ops[list[i].n], ext(i), e1);
    }
  };
  /* 山墙式屋顶（两坡，屋脊沿 Y），一端是山墙面，另一端插进一个母屋面或顶在一面墙上。
     o = { cx, faceY, dir(+1 山墙面朝西 / −1 朝东), halfW(墙面半宽), ovh, verge, pitch, plateZ(半宽处屋面标高),
           parentY(z) → 母屋面在标高 z 处的 Y, limitY(母屋面檐口线，可缺), roofMat, faceMat, faceT, roofT, faceBaseZ(可缺) }
     roof / wall 是两个 Batch（屋面进 roof，山墙三角进 wall）。返回 { apexZ }。 */
  K.gable = function (roof, wall, o) {
    var tg = K.tan(o.pitch), hs = o.halfW + o.ovh, apexZ = o.plateZ + o.halfW * tg, lowZ = apexZ - hs * tg;
    var yF = o.faceY + o.dir * o.verge, yA = o.parentY(apexZ), yE = o.parentY(lowZ);
    if (o.limitY != null) yE = o.dir > 0 ? Math.min(yE, o.limitY) : Math.max(yE, o.limitY);
    [-1, 1].forEach(function (s) {
      roof.slab(o.roofMat, [[o.cx + s * hs, yF, lowZ], [o.cx, yF, apexZ], [o.cx, yA, apexZ], [o.cx + s * hs, yE, lowZ]], o.roofT || 0.14);
    });
    if (o.faceMat) {
      /* 三角墙顶边收在屋面板厚度之内，不和屋面上表面共面 */
      var zb = o.faceBaseZ != null ? o.faceBaseZ : o.plateZ, aF = apexZ - (o.roofT || 0.14) * 0.6 * Math.sqrt(1 + tg * tg), hw = (aF - zb) / tg;
      wall.extrude(o.faceMat, [[o.cx - hw, o.faceY, zb], [o.cx + hw, o.faceY, zb], [o.cx, o.faceY, aF]], [0, -o.dir * (o.faceT || 0.2), 0]);
    }
    return { apexZ: apexZ, lowZ: lowZ };
  };
  /* 把 Batch 变成网格挂到 group 上 */
  Batch.prototype.build = function (group, mats) {
    for (var k in this.m) {
      var o = this.m[k], g = new THREE.BufferGeometry();
      g.setAttribute('position', new THREE.Float32BufferAttribute(o.p, 3));
      g.setAttribute('normal', new THREE.Float32BufferAttribute(o.n, 3));
      var mesh = new THREE.Mesh(g, mats[k] || mats.wall);
      mesh.name = group.name + ':' + k; mesh.castShadow = k !== 'glass' && k !== 'glassRoof'; mesh.receiveShadow = true;
      group.add(mesh);
    }
    return group;
  };
})();

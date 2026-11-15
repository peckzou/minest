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
  /* 现成的 THREE 几何体（如圆柱、带洞拉伸体），m 是放到工程坐标里的矩阵 */
  Batch.prototype.geom = function (mat, g, m) {
    g = g.index ? g.toNonIndexed() : g; g.applyMatrix4(m);
    var o = this.acc(mat), p = g.attributes.position.array, n = g.attributes.normal.array, i, flip = m.determinant() < 0;
    for (i = 0; i < p.length; i += 9) {
      var a = i, b = flip ? i + 6 : i + 3, c = flip ? i + 3 : i + 6;
      o.p.push(p[a], p[a + 1], p[a + 2], p[b], p[b + 1], p[b + 2], p[c], p[c + 1], p[c + 2]);
      o.n.push(n[a], n[a + 1], n[a + 2], n[b], n[b + 1], n[b + 2], n[c], n[c + 1], n[c + 2]);
    }
    g.dispose();
  };
  /* 竖直圆柱（轴沿 Z） */
  Batch.prototype.cyl = function (mat, x, y, z0, z1, r0, r1, seg) {
    var g = new THREE.CylinderGeometry(r1, r0, z1 - z0, seg || 14);
    var m = new THREE.Matrix4().makeRotationX(Math.PI / 2); m.setPosition(x, y, (z0 + z1) / 2);
    this.geom(mat, g, m);
  };

  /* —— 窗 / 门的细部 —— at(s,d,z) 给出洞口里的点：s 沿洞口宽 0..L，d 自外墙面向内的深度（负 = 凸出墙面）。
     op: { kind:'glass'|'door', lights(竖向分几扇), transom(false 关掉上亮子), sill(false 不做窗台), surround(石窗套), glazed(门上玻璃) } */
  K.windowAt = function (b, at, L, z0, z1, op) {
    op = op || {};
    function bx(m, sa, sb, za, zb, d0, d1) {
      if (sb - sa < 1e-4 || zb - za < 1e-4) return;
      b.extrude(m, [at(sa, d0, zb), at(sb, d0, zb), at(sb, d1, zb), at(sa, d1, zb)], [0, 0, za - zb]);
    }
    var f0 = 0.05, f1 = 0.14, fw = 0.06, H = z1 - z0, door = op.kind === 'door', zs = z0 + (door ? 0 : 0.012), i;
    bx('trim', 0, fw, zs, z1, f0, f1); bx('trim', L - fw, L, zs, z1, f0, f1); bx('trim', fw, L - fw, z1 - fw, z1, f0, f1);
    if (door) {
      bx('door', fw, L - fw, z0, z1 - fw, 0.08, 0.13);
      if (op.glazed) { var gw = (L - 2 * fw) * 0.24; [0.27, 0.73].forEach(function (k) { var c = fw + (L - 2 * fw) * k; bx('glass', c - gw / 2, c + gw / 2, z0 + H * 0.42, z1 - fw - 0.16, 0.07, 0.08); }); }
      return;
    }
    bx('trim', fw, L - fw, zs, zs + fw, f0, f1);
    bx('glass', fw, L - fw, zs + fw, z1 - fw, 0.09, 0.105);
    var n = op.lights || Math.max(1, Math.round(L / 0.55)), lw = (L - 2 * fw) / n, zt = (H > 1.2 && op.transom !== false) ? z0 + H * 0.7 : null;
    for (i = 1; i < n; i++) bx('trim', fw + i * lw - 0.025, fw + i * lw + 0.025, zs + fw, z1 - fw, f0 + 0.01, f1);
    if (zt) {
      bx('trim', fw, L - fw, zt - 0.025, zt + 0.025, f0 + 0.01, f1);
      for (i = 0; i < n; i++) {                               /* 上亮子分小格 */
        bx('trim', fw + (i + 0.5) * lw - 0.012, fw + (i + 0.5) * lw + 0.012, zt, z1 - fw, 0.075, 0.115);
        if (z1 - zt > 0.45) bx('trim', fw + i * lw, fw + (i + 1) * lw, (zt + z1 - fw) / 2 - 0.012, (zt + z1 - fw) / 2 + 0.012, 0.075, 0.115);
      }
    }
    if (op.sill !== false) bx('stone', -0.06, L + 0.06, z0 - 0.07, z0 + 0.012, -0.06, f1);
    if (op.surround) {
      bx('stone', -0.15, 0, z0, z1, -0.025, 0.03); bx('stone', L, L + 0.15, z0, z1, -0.025, 0.03);
      bx('stone', -0.2, L + 0.2, z1, z1 + 0.2, -0.03, 0.03);
    }
  };

  /* 一段墙。p0→p1 是外墙面线，室内在行进方向左手边，厚 t 向内。ops = 洞口：
     { c:[x,y] 或 s:沿墙距离, w, z0, z1, kind:'glass'|'door'|'open', …窗的细部参数 }。e0/e1 = 两端延长（补阴角）。 */
  Batch.prototype.wall = function (mat, p0, p1, t, z0, z1, ops, e0, e1) {
    var dx = p1[0] - p0[0], dy = p1[1] - p0[1], L = Math.sqrt(dx * dx + dy * dy); if (L < 1e-6) return;
    var u = [dx / L, dy / L], nl = [-u[1], u[0]], self = this;
    function at(s, d, z) { return [p0[0] + u[0] * s + nl[0] * d, p0[1] + u[1] * s + nl[1] * d, z]; }
    function piece(sa, sb, za, zb) {
      if (sb - sa < 1e-4 || zb - za < 1e-4) return;
      self.extrude(mat, [at(sa, 0, zb), at(sb, 0, zb), at(sb, t, zb), at(sa, t, zb)], [0, 0, za - zb]);
    }
    var list = [];
    (ops || []).forEach(function (o) {
      var s = o.s != null ? o.s : (o.c[0] - p0[0]) * u[0] + (o.c[1] - p0[1]) * u[1];
      var r = { a: Math.max(0, s - o.w / 2), b: Math.min(L, s + o.w / 2), z0: Math.max(z0, o.z0), z1: Math.min(z1, o.z1), o: o };
      if (r.z1 - r.z0 > 1e-3 && r.b - r.a > 1e-3) list.push(r);   /* 不在这段标高范围内的洞口：这段墙照实做 */
    });
    list.sort(function (a, b) { return a.a - b.a; });
    var cur = -(e0 || 0);
    list.forEach(function (r) {
      piece(cur, r.a, z0, z1); piece(r.a, r.b, z0, r.z0); piece(r.a, r.b, r.z1, z1);
      var kind = r.o.kind || 'glass';
      if (kind !== 'open') K.windowAt(self, function (s, d, z) { return at(r.a + s, d, z); }, r.b - r.a, r.z0, r.z1, r.o);
      cur = r.b;
    });
    piece(cur, L + (e1 || 0), z0, z1);
  };
  /* 一圈墙。list = [{p:[x,y], n:'段名'}…]，段 i 从 list[i] 到 list[i+1]；closed 时最后一点连回第一点。
     室内在左手边。阴角（右转）处自动把相邻两段各延长一点补齐。ops[段名] = 该段洞口。mat 可以是 函数(段名)→材质名。 */
  Batch.prototype.walls = function (mat, list, closed, t, z0, z1, ops) {
    var N = list.length, segs = closed ? N : N - 1, i;
    function dir(i) { var a = list[i % N].p, b = list[(i + 1) % N].p, l = Math.sqrt(Math.pow(b[0] - a[0], 2) + Math.pow(b[1] - a[1], 2)) || 1; return [(b[0] - a[0]) / l, (b[1] - a[1]) / l]; }
    function ext(i) {   /* 段 i 起点处的补长 */
      if (!closed && i === 0) return 0;
      var a = dir((i - 1 + N) % N), b = dir(i), cr = a[0] * b[1] - a[1] * b[0]; if (cr > -1e-6) return 0;
      var ang = Math.acos(Math.max(-1, Math.min(1, a[0] * b[0] + a[1] * b[1]))); return t * Math.tan(ang / 2);
    }
    for (i = 0; i < segs; i++) {
      var e1 = (!closed && i === segs - 1) ? 0 : ext((i + 1) % N), nm = list[i].n;
      this.wall(typeof mat === 'function' ? mat(nm) : mat, list[i].p, list[(i + 1) % N].p, t, z0, z1, ops && ops[nm], ext(i), e1);
    }
  };
  /* 贴在外墙面上的一圈线脚 / 勒脚：pts = [[x,y]…]（外墙面线，室内在左），向外凸 out，标高 z0..z1。阳角处自动接齐。 */
  Batch.prototype.band = function (mat, pts, closed, out, z0, z1) {
    var N = pts.length, segs = closed ? N : N - 1, self = this, i;
    function dir(i) { var a = pts[i % N], b = pts[(i + 1) % N], l = Math.sqrt(Math.pow(b[0] - a[0], 2) + Math.pow(b[1] - a[1], 2)) || 1; return [(b[0] - a[0]) / l, (b[1] - a[1]) / l]; }
    function ext(i) {   /* 顶点 i 处阳角的补长 */
      if (!closed && (i === 0 || i === N - 1)) return 0;
      var a = dir((i - 1 + N) % N), b = dir(i % N), cr = a[0] * b[1] - a[1] * b[0]; if (cr < 1e-6) return 0;
      var ang = Math.acos(Math.max(-1, Math.min(1, a[0] * b[0] + a[1] * b[1]))); return out * Math.tan(ang / 2);
    }
    for (i = 0; i < segs; i++) {
      var a = pts[i], b = pts[(i + 1) % N], u = dir(i), nr = [u[1], -u[0]], ea = ext(i), eb = ext((i + 1) % N);
      var A = [a[0] - u[0] * ea, a[1] - u[1] * ea], B = [b[0] + u[0] * eb, b[1] + u[1] * eb];
      self.extrude(mat, [[A[0] + nr[0] * out, A[1] + nr[1] * out, z1], [B[0] + nr[0] * out, B[1] + nr[1] * out, z1],
        [B[0] - nr[0] * 0.02, B[1] - nr[1] * 0.02, z1], [A[0] - nr[0] * 0.02, A[1] - nr[1] * 0.02, z1]], [0, 0, z0 - z1]);
    }
  };
  /* 一片竖直的墙面（可以是三角形山墙），带矩形窗洞。
     o = { org:[x,y], U:[ux,uy] 沿墙方向, N:[nx,ny] 向室内, pts:[[s,z]…] 轮廓, t 厚, mat, wins:[{s0,s1,z0,z1,…窗参数}] } */
  K.face = function (b, o) {
    var sh = new THREE.Shape(o.pts.map(function (p) { return new THREE.Vector2(p[0], p[1]); }));
    (o.wins || []).forEach(function (w) {
      sh.holes.push(new THREE.Path([new THREE.Vector2(w.s0, w.z0), new THREE.Vector2(w.s1, w.z0), new THREE.Vector2(w.s1, w.z1), new THREE.Vector2(w.s0, w.z1)]));
    });
    (o.holes || []).forEach(function (h) { sh.holes.push(new THREE.Path(h.map(function (p) { return new THREE.Vector2(p[0], p[1]); }))); });   /* 任意形状的洞：[[s,z]…] */
    var g = new THREE.ExtrudeGeometry(sh, { depth: o.t, bevelEnabled: false, curveSegments: o.curve || 12 });
    var m = new THREE.Matrix4().set(o.U[0], 0, o.N[0], o.org[0], o.U[1], 0, o.N[1], o.org[1], 0, 1, 0, 0, 0, 0, 0, 1);
    b.geom(o.mat, g, m);
    (o.wins || []).forEach(function (w) {
      K.windowAt(b, function (s, d, z) { return [o.org[0] + o.U[0] * (w.s0 + s) + o.N[0] * d, o.org[1] + o.U[1] * (w.s0 + s) + o.N[1] * d, z]; }, w.s1 - w.s0, w.z0, w.z1, w);
    });
  };
  /* 山墙式屋顶（两坡，屋脊沿 Y），一端是山墙面，另一端插进一个母屋面或顶在一面墙上。
     o = { cx, faceY, dir(+1 山墙面朝西 / −1 朝东), halfW(墙面半宽), ovh, verge, pitch, plateZ(半宽处屋面标高),
           parentY(z) → 母屋面在标高 z 处的 Y, limitY(母屋面檐口线，可缺), roofMat, faceMat, faceT, roofT, faceBaseZ(可缺),
           wins(山墙面上的窗，s 以 cx 为 0), barge(封檐板材质，可缺), bargeD(封檐板高) }
     roof / wall 是两个 Batch（屋面进 roof，山墙面进 wall）。返回 { apexZ, lowZ }。 */
  K.gable = function (roof, wall, o) {
    var tg = K.tan(o.pitch), hs = o.halfW + o.ovh, apexZ = o.plateZ + o.halfW * tg, lowZ = apexZ - hs * tg, rt = o.roofT || 0.14;
    var yF = o.faceY + o.dir * o.verge, yA = o.parentY(apexZ), yE = o.parentY(lowZ);
    if (o.limitY != null) yE = o.dir > 0 ? Math.min(yE, o.limitY) : Math.max(yE, o.limitY);
    [-1, 1].forEach(function (s) {
      roof.slab(o.roofMat, [[o.cx + s * hs, yF, lowZ], [o.cx, yF, apexZ], [o.cx, yA, apexZ], [o.cx + s * hs, yE, lowZ]], rt);
      if (o.barge) {                                          /* 封檐板：贴在屋面板前缘 */
        var bd = o.bargeD || 0.24, dz = 0.03;
        roof.extrude(o.barge, [[o.cx + s * (hs + 0.03), yF, lowZ - 0.03 * tg + dz], [o.cx, yF, apexZ + dz], [o.cx, yF, apexZ + dz - bd], [o.cx + s * (hs + 0.03), yF, lowZ - 0.03 * tg + dz - bd]], [0, o.dir * 0.05, 0]);
      }
    });
    if (o.faceMat) {
      /* 山墙面顶边收在屋面板厚度之内，不和屋面上表面共面 */
      var zb = o.faceBaseZ != null ? o.faceBaseZ : o.plateZ, aF = apexZ - rt * 0.6 * Math.sqrt(1 + tg * tg), hw = (aF - zb) / tg;
      K.face(wall, { org: [o.cx, o.faceY], U: [1, 0], N: [0, -o.dir], pts: [[-hw, zb], [hw, zb], [0, aF]], t: o.faceT || 0.2, mat: o.faceMat, wins: o.wins });
    }
    return { apexZ: apexZ, lowZ: lowZ };
  };
  /* 把 Batch 变成网格挂到 group 上。贴图坐标按面的朝向自动生成，单位是米：
     竖直面 u = 水平方向、v = 标高（所以各面的砖缝、饰带在同一高度上对齐）；斜面 v = 沿坡向上。 */
  Batch.prototype.build = function (group, mats) {
    for (var k in this.m) {
      var o = this.m[k], g = new THREE.BufferGeometry(), uv = new Float32Array(o.p.length / 3 * 2), i;
      for (i = 0; i < o.p.length / 3; i++) {
        var n = [o.n[i * 3], o.n[i * 3 + 1], o.n[i * 3 + 2]], p = [o.p[i * 3], o.p[i * 3 + 1], o.p[i * 3 + 2]];
        var t = Math.abs(n[2]) > 0.999 ? [1, 0, 0] : norm(cross([0, 0, 1], n)), bt = cross(n, t);
        uv[i * 2] = dot(p, t); uv[i * 2 + 1] = dot(p, bt);
      }
      g.setAttribute('position', new THREE.Float32BufferAttribute(o.p, 3));
      g.setAttribute('normal', new THREE.Float32BufferAttribute(o.n, 3));
      g.setAttribute('uv', new THREE.BufferAttribute(uv, 2));
      var mesh = new THREE.Mesh(g, mats[k] || mats.wall);
      mesh.name = group.name + ':' + k; mesh.userData.mat = k; mesh.castShadow = k !== 'glass' && k !== 'glassRoof'; mesh.receiveShadow = true;
      group.add(mesh);
    }
    return group;
  };
})();

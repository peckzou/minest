/* Minest My World · Imagineering Build Kit (`kit.js`)
 * Shared toolbox for the Paris park, the Walt Disney World resort parks and the California upgrade layer:
 *  - Vertex-coloured static batches: every park collapses into ~4 draw calls (solid / facade / glow / glass)
 *  - Primitive shapes addressed by their BASE height (box, cyl, cone, pyr, gable, dome, rod, fan, tube, ribbon)
 *  - Window-tiled `bldg` facades, canvas `sign`s, sculpted trees, lamp posts
 *  - Spline `track` builder with parallel-transport frames (supports vertical loops) and `trainRide` ride factory */
(function (root) {
  'use strict';

  function create(group, world) {
    const T = root.THREE, V3 = T.Vector3, Y = world.PARK_Y;
    const WUP = new V3(0, 1, 0), tmpC = new T.Color();
    const clamp = (v, a, b) => Math.max(a, Math.min(b, v));

    const MX = (x, y, z, rx, ry, rz, sx, sy, sz) => new T.Matrix4().compose(
      new V3(x, y, z),
      new T.Quaternion().setFromEuler(new T.Euler(rx || 0, ry || 0, rz || 0)),
      new V3(sx || 1, sy || 1, sz || 1)
    );

    function Batch(useUv) {
      const parts = [];
      this.add = (geo, m4, hex) => {
        const g = geo.index ? geo.toNonIndexed() : geo;
        if (m4) g.applyMatrix4(m4);
        if (!g.attributes.normal) g.computeVertexNormals();
        parts.push([g, hex]);
      };
      this.build = (mat, parent) => {
        if (!parts.length) return null;
        let n = 0;
        for (const p of parts) n += p[0].attributes.position.count;
        const pos = new Float32Array(n * 3), nor = new Float32Array(n * 3), col = new Uint8Array(n * 3);
        const uv = useUv ? new Float32Array(n * 2) : null;
        let o = 0;
        for (const [g, hex] of parts) {
          const c = g.attributes.position.count;
          pos.set(g.attributes.position.array, o * 3);
          nor.set(g.attributes.normal.array, o * 3);
          if (uv && g.attributes.uv) uv.set(g.attributes.uv.array, o * 2);
          tmpC.setHex(hex);
          const r = Math.round(tmpC.r * 255), gg = Math.round(tmpC.g * 255), b = Math.round(tmpC.b * 255);
          for (let i = 0; i < c; i++) { col[(o + i) * 3] = r; col[(o + i) * 3 + 1] = gg; col[(o + i) * 3 + 2] = b; }
          o += c; g.dispose();
        }
        parts.length = 0;
        const bg = new T.BufferGeometry();
        bg.setAttribute('position', new T.BufferAttribute(pos, 3));
        bg.setAttribute('normal', new T.BufferAttribute(nor, 3));
        bg.setAttribute('color', new T.BufferAttribute(col, 3, true));
        if (uv) bg.setAttribute('uv', new T.BufferAttribute(uv, 2));
        const m = new T.Mesh(bg, mat);
        m.receiveShadow = true;
        (parent || group).add(m);
        return m;
      };
    }

    function shapes(b) {
      const s = {};
      s.geo = (c, g, m) => b.add(g, m, c);
      s.box = (c, w, h, d, x, y, z, ry, rx, rz) => b.add(new T.BoxGeometry(w, h, d), MX(x, y + h / 2, z, rx, ry, rz), c);
      s.cyl = (c, rt, rb, h, x, y, z, seg, rx, rz, ry) => b.add(new T.CylinderGeometry(rt, rb, h, seg || 10), MX(x, y + h / 2, z, rx, ry, rz), c);
      s.cone = (c, r, h, x, y, z, seg, ry) => b.add(new T.ConeGeometry(r, h, seg || 10), MX(x, y + h / 2, z, 0, ry, 0), c);
      const flat = (g) => { const f = g.toNonIndexed(); f.computeVertexNormals(); return f; };
      s.pyr = (c, w, h, d, x, y, z, ry) => {
        const g = new T.ConeGeometry(Math.SQRT1_2, 1, 4); g.rotateY(Math.PI / 4);
        b.add(flat(g), MX(x, y + h / 2, z, 0, ry, 0, w, h, d), c);
      };
      // Faceted rock mass / mesa / spire (flat shaded, `rt` may be 0 for a peak).
      s.crag = (c, rt, rb, h, x, y, z, seg, ry, rx, rz) => b.add(flat(new T.CylinderGeometry(rt, rb, h, seg || 7)), MX(x, y + h / 2, z, rx, ry, rz), c);
      s.sph = (c, r, x, y, z, sx, sy, sz, seg) => b.add(new T.SphereGeometry(r, seg || 10, Math.max(6, (seg || 10) - 3)), MX(x, y, z, 0, 0, 0, sx || 1, sy || 1, sz || 1), c);
      s.ico = (c, r, x, y, z, sx, sy, sz, det, ry) => b.add(new T.IcosahedronGeometry(r, det === undefined ? 1 : det), MX(x, y, z, 0, ry, 0, sx || 1, sy || 1, sz || 1), c);
      // Flat-shaded geodesic / boulder (icosahedron, facets kept).
      s.poly = (c, r, x, y, z, det, sx, sy, sz, ry) => {
        const g0 = new T.IcosahedronGeometry(r, det === undefined ? 1 : det), g = g0.index ? g0.toNonIndexed() : g0;
        g.computeVertexNormals();
        b.add(g, MX(x, y, z, 0, ry, 0, sx || 1, sy || 1, sz || 1), c);
      };
      s.dome = (c, r, x, y, z, sy, seg) => b.add(new T.SphereGeometry(r, seg || 14, 6, 0, Math.PI * 2, 0, Math.PI / 2), MX(x, y, z, 0, 0, 0, 1, sy || 1, 1), c);
      s.tor = (c, R, r, x, y, z, rx, ry, rz, arc, seg) => b.add(new T.TorusGeometry(R, r, 6, seg || 22, arc || Math.PI * 2), MX(x, y, z, rx, ry, rz), c);
      s.rod = (c, r, x1, y1, z1, x2, y2, z2, seg) => {
        const d = new V3(x2 - x1, y2 - y1, z2 - z1), len = d.length();
        if (len < 1e-4) return;
        const m = new T.Matrix4().compose(
          new V3((x1 + x2) / 2, (y1 + y2) / 2, (z1 + z2) / 2),
          new T.Quaternion().setFromUnitVectors(WUP, d.multiplyScalar(1 / len)),
          new V3(1, 1, 1)
        );
        b.add(new T.CylinderGeometry(r, r, len, seg || 5), m, c);
      };
      // Triangular-prism roof: ridge runs along local Z, `w` wide, `d` long.
      s.gable = (c, w, h, d, x, y, z, ry) => {
        const a = w / 2, e = d / 2;
        const v = [
          -a, 0, e, a, 0, e, 0, h, e,
          a, 0, -e, -a, 0, -e, 0, h, -e,
          -a, 0, -e, -a, 0, e, 0, h, e,
          -a, 0, -e, 0, h, e, 0, h, -e,
          a, 0, e, a, 0, -e, 0, h, -e,
          a, 0, e, 0, h, -e, 0, h, e
        ];
        const g = new T.BufferGeometry();
        g.setAttribute('position', new T.BufferAttribute(new Float32Array(v), 3));
        g.computeVertexNormals();
        b.add(g, MX(x, y, z, 0, ry, 0), c);
      };
      // Striped conical canopy (circus tents, carousels, umbrellas): alternating wedge colours.
      s.fan = (cA, cB, r, h, x, y, z, n) => {
        n = n || 12;
        for (let i = 0; i < n; i++) {
          const a0 = (i / n) * Math.PI * 2, a1 = ((i + 1) / n) * Math.PI * 2;
          const g = new T.BufferGeometry();
          g.setAttribute('position', new T.BufferAttribute(new Float32Array([
            x, y + h, z,
            x + Math.cos(a1) * r, y, z + Math.sin(a1) * r,
            x + Math.cos(a0) * r, y, z + Math.sin(a0) * r
          ]), 3));
          g.computeVertexNormals();
          b.add(g, null, i % 2 ? cB : cA);
        }
      };
      s.tube = (c, pts, r, closed, seg) => {
        const curve = new T.CatmullRomCurve3(pts, !!closed, 'centripetal');
        b.add(new T.TubeGeometry(curve, seg || pts.length * 2, r, 5, !!closed), null, c);
      };
      // Flat ribbon following a track (roads, flumes, guideway beams).
      s.ribbon = (c, tr, w, yOff) => {
        const v = [], N = tr.N, L = new V3(), R = new V3(), L2 = new V3(), R2 = new V3();
        const edge = (i, l, r) => {
          const k = i % N, p = tr.P[k], sd = tr.sides[k], up = tr.ups[k];
          l.copy(p).addScaledVector(sd, -w / 2).addScaledVector(up, yOff || 0);
          r.copy(p).addScaledVector(sd, w / 2).addScaledVector(up, yOff || 0);
        };
        const end = tr.closed ? N : N - 1;
        for (let i = 0; i < end; i++) {
          edge(i, L, R); edge(i + 1, L2, R2);
          v.push(L.x, L.y, L.z, L2.x, L2.y, L2.z, R.x, R.y, R.z, R.x, R.y, R.z, L2.x, L2.y, L2.z, R2.x, R2.y, R2.z);
        }
        const g = new T.BufferGeometry();
        g.setAttribute('position', new T.BufferAttribute(new Float32Array(v), 3));
        g.computeVertexNormals();
        b.add(g, null, c);
      };
      return s;
    }

    /* ---------------- Materials & shared static batches ---------------- */
    function makeWindowTex() {
      const c = document.createElement('canvas'); c.width = 64; c.height = 64;
      const x = c.getContext('2d');
      x.fillStyle = '#ffffff'; x.fillRect(0, 0, 64, 64);
      x.fillStyle = 'rgba(0,0,0,0.10)'; x.fillRect(0, 0, 64, 4);
      x.fillStyle = 'rgba(0,0,0,0.05)'; x.fillRect(0, 58, 64, 2);
      x.fillStyle = '#d9dee6'; x.fillRect(17, 13, 30, 38);
      x.fillStyle = '#26344d'; x.fillRect(20, 16, 24, 32);
      x.fillStyle = '#51709c'; x.fillRect(20, 16, 24, 11);
      x.fillStyle = '#d9dee6'; x.fillRect(31, 16, 2, 32); x.fillRect(20, 31, 24, 2);
      x.fillStyle = 'rgba(0,0,0,0.16)'; x.fillRect(15, 51, 34, 3);
      const tx = new T.CanvasTexture(c);
      tx.wrapS = tx.wrapT = T.RepeatWrapping;
      if (T.sRGBEncoding !== undefined) tx.encoding = T.sRGBEncoding;
      return tx;
    }

    const solidMat = new T.MeshLambertMaterial({ vertexColors: true });
    const facMat = new T.MeshLambertMaterial({ vertexColors: true, map: makeWindowTex() });
    const glowMat = new T.MeshBasicMaterial({ vertexColors: true });
    const glassMat = new T.MeshPhongMaterial({ vertexColors: true, transparent: true, opacity: 0.62, shininess: 90, specular: 0xffffff, depthWrite: false, side: T.DoubleSide });

    const bSolid = new Batch(false), bFac = new Batch(true), bGlow = new Batch(false), bGlass = new Batch(false);
    const S = shapes(bSolid), G = shapes(bGlow), W = shapes(bGlass);

    // Window-tiled building block (base at y). `bay` = window spacing, `flr` = storey height.
    function bldg(c, w, h, d, x, y, z, ry, bay, flr) {
      const g = new T.BoxGeometry(w, h, d).toNonIndexed(), uv = g.attributes.uv.array;
      const nu = Math.max(1, Math.round(w / (bay || 3.4))), nd = Math.max(1, Math.round(d / (bay || 3.4)));
      const nv = Math.max(1, Math.round(h / (flr || 3.8)));
      for (let i = 0; i < 36; i++) {
        const f = (i / 6) | 0;
        if (f === 2 || f === 3) { uv[i * 2] = 0.03; uv[i * 2 + 1] = 0.5; }
        else { uv[i * 2] *= (f < 2 ? nd : nu); uv[i * 2 + 1] *= nv; }
      }
      bFac.add(g, MX(x, y + h / 2, z, 0, ry, 0), c);
    }

    function flush() {
      bSolid.build(solidMat); bFac.build(facMat); bGlow.build(glowMat);
      const gl = bGlass.build(glassMat); if (gl) gl.renderOrder = 4;
    }

    // Movable assembly: its own Group at a pivot, flattened to one solid (+ one glow) mesh.
    function asm(x, y, z) {
      const grp = new T.Group(); grp.position.set(x, y, z); group.add(grp);
      const bs = new Batch(false), bg = new Batch(false);
      return { grp, S: shapes(bs), G: shapes(bg), done: () => { bs.build(solidMat, grp); bg.build(glowMat, grp); return grp; } };
    }

    function sign(txt, w, h, x, y, z, ry, bg, fg, sub) {
      const c = document.createElement('canvas'); c.width = 512; c.height = Math.max(64, Math.round(512 * h / w));
      const g = c.getContext('2d'), H = c.height;
      g.fillStyle = bg || '#1e293b'; g.fillRect(0, 0, 512, H);
      g.strokeStyle = fg || '#fde68a'; g.lineWidth = 6; g.strokeRect(6, 6, 500, H - 12);
      g.fillStyle = fg || '#fde68a'; g.textAlign = 'center'; g.textBaseline = 'middle';
      let fs = Math.round(H * (sub ? 0.36 : 0.5));
      g.font = `800 ${fs}px Georgia, "Songti SC", serif`;
      while (fs > 12 && g.measureText(txt).width > 470) { fs -= 2; g.font = `800 ${fs}px Georgia, "Songti SC", serif`; }
      g.fillText(txt, 256, sub ? H * 0.36 : H * 0.52);
      if (sub) {
        let ss = Math.round(H * 0.22);
        g.font = `700 ${ss}px "PingFang SC", "Microsoft YaHei", sans-serif`;
        while (ss > 10 && g.measureText(sub).width > 470) { ss -= 2; g.font = `700 ${ss}px "PingFang SC", "Microsoft YaHei", sans-serif`; }
        g.globalAlpha = 0.92; g.fillText(sub, 256, H * 0.72);
      }
      const tx = new T.CanvasTexture(c);
      if (T.sRGBEncoding !== undefined) tx.encoding = T.sRGBEncoding;
      const m = new T.Mesh(new T.PlaneGeometry(w, h), new T.MeshBasicMaterial({ map: tx }));
      m.position.set(x, y, z); m.rotation.y = ry || 0; group.add(m);
      return m;
    }

    let seed = 19550717;
    const rng = () => { seed = (seed * 1664525 + 1013904223) >>> 0; return seed / 4294967296; };

    function tree(kind, x, z, sc, y0) {
      const k = sc || 1, y = y0 === undefined ? Y : y0;
      if (kind === 'palm') {
        const h = (7.5 + rng() * 4) * k;
        S.cyl(0x7a6248, 0.2 * k, 0.38 * k, h, x, y, z, 5);
        for (let f = 0; f < 7; f++) {
          const a = (f / 7) * Math.PI * 2 + rng() * 0.3;
          S.box(0x3f8a45, 0.6 * k, 0.12, 3.6 * k, x + Math.cos(a) * 1.5 * k, y + h - 0.2, z + Math.sin(a) * 1.5 * k, Math.PI / 2 - a, 0.34);
        }
      } else if (kind === 'pine') {
        const h = (9 + rng() * 5) * k;
        S.cyl(0x5b3f2a, 0.26 * k, 0.46 * k, h * 0.3, x, y, z, 5);
        S.cone(0x24583a, 2.7 * k, h * 0.5, x, y + h * 0.22, z, 7);
        S.cone(0x2c6a45, 2.0 * k, h * 0.42, x, y + h * 0.5, z, 7);
        S.cone(0x24583a, 1.3 * k, h * 0.32, x, y + h * 0.72, z, 7);
      } else if (kind === 'cactus') {
        const h = (3.2 + rng() * 2.4) * k;
        S.cyl(0x4f8a4a, 0.34 * k, 0.38 * k, h, x, y, z, 6);
        S.cyl(0x4f8a4a, 0.24 * k, 0.24 * k, h * 0.42, x + 0.85 * k, y + h * 0.38, z, 6);
        S.box(0x4f8a4a, 0.9 * k, 0.4 * k, 0.4 * k, x + 0.45 * k, y + h * 0.36, z);
        S.cyl(0x4f8a4a, 0.22 * k, 0.22 * k, h * 0.3, x - 0.8 * k, y + h * 0.5, z, 6);
        S.box(0x4f8a4a, 0.8 * k, 0.36 * k, 0.36 * k, x - 0.4 * k, y + h * 0.48, z);
      } else if (kind === 'cypress') {
        const h = (8 + rng() * 3) * k;
        S.cyl(0x5b3f2a, 0.2, 0.3, 1.2, x, y, z, 5);
        S.cone(0x2a5d3a, 1.25 * k, h, x, y + 1.0, z, 7);
      } else {
        const h = (4.4 + rng() * 2.6) * k, r = (2.2 + rng() * 1.1) * k;
        S.cyl(0x6b4a2f, 0.28 * k, 0.48 * k, h, x, y, z, 5);
        const lc = kind === 'blossom' ? 0xf3a6c4 : (rng() < 0.5 ? 0x3f8f3f : 0x2f7438);
        S.ico(lc, r, x, y + h + r * 0.6, z);
        S.ico(lc, r * 0.72, x + r * 0.55, y + h + r * 0.2, z + r * 0.3, 1, 1, 1, 0);
      }
    }

    function lamp(x, z, h, y0) {
      const y = y0 === undefined ? Y : y0, hh = h || 4.2;
      S.cyl(0x25303b, 0.07, 0.12, hh, x, y, z, 5);
      G.sph(0xffe9a8, 0.3, x, y + hh + 0.25, z, 1, 1, 1, 6);
    }

    // Scatter trees over reserved parkland cells (occ === 3); `avoid(x, z)` returns true for blocked spots.
    function scatter(n, x0, x1, z0, z1, avoid, pick, occOk) {
      let placed = 0;
      for (let att = 0; att < n * 9 && placed < n; att++) {
        const tx = x0 + rng() * (x1 - x0), tz = z0 + rng() * (z1 - z0);
        const cell = (tx | 0) + (tz | 0) * world.W;
        if ((occOk ? !occOk(world.occ[cell]) : world.occ[cell] !== 3) || world.hm[cell] < Y) continue;
        if (avoid && avoid(tx, tz)) continue;
        tree(pick(tx, tz, rng()), tx, tz);
        placed++;
      }
    }

    // Local frame at (px, pz) rotated by `r` about Y: local +z is the "front". Lets a pavilion be modelled once and
    // aimed anywhere (e.g. at a lagoon centre) while still landing in the shared static batches.
    function frame(px, pz, r) {
      const cs = Math.cos(r), sn = Math.sin(r);
      const P = (lx, lz) => [px + lx * cs + lz * sn, pz - lx * sn + lz * cs];
      const wrap = (s) => ({
        box: (c, w, h, d, lx, y, lz, ry, rx, rz) => { const p = P(lx, lz); s.box(c, w, h, d, p[0], y, p[1], (ry || 0) + r, rx, rz); },
        cyl: (c, rt, rb, h, lx, y, lz, seg) => { const p = P(lx, lz); s.cyl(c, rt, rb, h, p[0], y, p[1], seg); },
        cone: (c, rr, h, lx, y, lz, seg, ry) => { const p = P(lx, lz); s.cone(c, rr, h, p[0], y, p[1], seg, (ry || 0) + r); },
        pyr: (c, w, h, d, lx, y, lz, ry) => { const p = P(lx, lz); s.pyr(c, w, h, d, p[0], y, p[1], (ry || 0) + r); },
        crag: (c, rt, rb, h, lx, y, lz, seg, ry) => { const p = P(lx, lz); s.crag(c, rt, rb, h, p[0], y, p[1], seg, (ry || 0) + r); },
        gable: (c, w, h, d, lx, y, lz, ry) => { const p = P(lx, lz); s.gable(c, w, h, d, p[0], y, p[1], (ry || 0) + r); },
        dome: (c, rr, lx, y, lz, sy, seg) => { const p = P(lx, lz); s.dome(c, rr, p[0], y, p[1], sy, seg); },
        sph: (c, rr, lx, y, lz, sx, sy, sz, seg) => { const p = P(lx, lz); s.sph(c, rr, p[0], y, p[1], sx, sy, sz, seg); },
        ico: (c, rr, lx, y, lz, sx, sy, sz, det) => { const p = P(lx, lz); s.ico(c, rr, p[0], y, p[1], sx, sy, sz, det, r); },
        rod: (c, rr, x1, y1, z1, x2, y2, z2, seg) => { const a = P(x1, z1), q = P(x2, z2); s.rod(c, rr, a[0], y1, a[1], q[0], y2, q[1], seg); },
        fan: (cA, cB, rr, h, lx, y, lz, n) => { const p = P(lx, lz); s.fan(cA, cB, rr, h, p[0], y, p[1], n); },
        tor: (c, R, rr, lx, y, lz, rx, ry, rz, arc, seg) => { const p = P(lx, lz); s.tor(c, R, rr, p[0], y, p[1], rx, (ry || 0) + r, rz, arc, seg); }
      });
      const f = wrap(S);
      f.P = P; f.r = r; f.G = wrap(G); f.W = wrap(W);
      f.bldg = (c, w, h, d, lx, y, lz, ry, bay, flr) => { const p = P(lx, lz); bldg(c, w, h, d, p[0], y, p[1], (ry || 0) + r, bay, flr); };
      f.sign = (txt, w, h, lx, y, lz, ry, bg, fg, sub) => { const p = P(lx, lz); return sign(txt, w, h, p[0], y, p[1], (ry || 0) + r, bg, fg, sub); };
      f.tree = (kind, lx, lz, sc) => { const p = P(lx, lz); tree(kind, p[0], p[1], sc); };
      f.lamp = (lx, lz, h) => { const p = P(lx, lz); lamp(p[0], p[1], h); };
      return f;
    }

    /* ---------------- Spline track with transported frames ---------------- */
    // o: { closed, gauge, rail:{col,r}, beam:{col,r,drop}, tie:{col,step,r}, sup:{col,step,r}, pull, to:shapes, samples }
    function track(pts, o) {
      o = o || {};
      const closed = o.closed !== false;
      const curve = new T.CatmullRomCurve3(pts.map((p) => new V3(p[0], Y + p[1], p[2])), closed, 'centripetal');
      curve.arcLengthDivisions = 800; curve.updateArcLengths();
      const len = curve.getLength(), N = o.samples || Math.max(24, Math.round(len / 1.4));
      const P = [], tans = [], ups = [], sides = [];
      const up = new V3(0, 1, 0), pull = o.pull === undefined ? 1 : o.pull;
      let yMax = -1e9;
      for (let i = 0; i < N; i++) {
        const u = closed ? i / N : i / (N - 1);
        const p = curve.getPointAt(u), t = curve.getTangentAt(u).normalize();
        up.addScaledVector(t, -up.dot(t));
        if (up.lengthSq() < 1e-6) up.set(0, 1, 0); else up.normalize();
        up.lerp(WUP, pull); up.addScaledVector(t, -up.dot(t));
        if (up.lengthSq() < 1e-6) up.set(t.z, 0, -t.x);
        up.normalize();
        P.push(p); tans.push(t); ups.push(up.clone());
        sides.push(new V3().crossVectors(up, t).normalize());
        if (p.y > yMax) yMax = p.y;
      }
      const tr = { curve, len, N, P, tans, ups, sides, closed, yMax };
      tr.frame = (u, op, ot, ou) => {
        let f;
        if (closed) { u = u - Math.floor(u); f = u * N; }
        else f = clamp(u, 0, 1) * (N - 1);
        const i0 = Math.min(N - 1, Math.floor(f)), i1 = closed ? (i0 + 1) % N : Math.min(N - 1, i0 + 1), k = f - Math.floor(f);
        op.copy(P[i0]).lerp(P[i1], k);
        ot.copy(tans[i0]).lerp(tans[i1], k).normalize();
        ou.copy(ups[i0]).lerp(ups[i1], k).normalize();
      };
      const to = o.to || S;
      if (o.rail) {
        const g = (o.gauge || 1.4) / 2;
        for (const sd of [-1, 1]) {
          to.geo(o.rail.col, new T.TubeGeometry(
            new T.CatmullRomCurve3(P.map((p, i) => p.clone().addScaledVector(sides[i], sd * g)), closed),
            N, o.rail.r || 0.14, 5, closed
          ));
        }
      }
      if (o.beam) {
        const dr = o.beam.drop === undefined ? 0.7 : o.beam.drop;
        to.geo(o.beam.col, new T.TubeGeometry(
          new T.CatmullRomCurve3(P.map((p, i) => p.clone().addScaledVector(ups[i], -dr)), closed),
          N, o.beam.r || 0.6, 6, closed
        ));
      }
      if (o.tie) {
        const g = (o.gauge || 1.4) / 2 + 0.25, st = o.tie.step || 2;
        for (let i = 0; i < N; i += st) {
          const p = P[i], sd = sides[i], u2 = ups[i], d = o.tie.drop || 0.16;
          S.rod(o.tie.col, o.tie.r || 0.11,
            p.x - sd.x * g - u2.x * d, p.y - sd.y * g - u2.y * d, p.z - sd.z * g - u2.z * d,
            p.x + sd.x * g - u2.x * d, p.y + sd.y * g - u2.y * d, p.z + sd.z * g - u2.z * d, 4);
        }
      }
      if (o.sup) {
        const st = o.sup.step || 8, gy = o.sup.ground === undefined ? Y : o.sup.ground;
        for (let i = 0; i < N; i += st) {
          const p = P[i];
          if (p.y - gy < 1.4 || ups[i].y < 0.3) continue;
          S.rod(o.sup.col, o.sup.r || 0.2, p.x, p.y - 0.3, p.z, p.x, gy, p.z, 5);
        }
      }
      return tr;
    }

    /* ---------------- Train / coaster / guideway ride factory ---------------- */
    // o: { id, name, land, track, cars:[Group], gap, speed, G, vmax, auto, boardPos, exitPos, events:[[u,msg]], doneMsg, eye, lift, back }
    function trainRide(o) {
      const tr = o.track, st = { running: !!o.auto, u: o.u0 || 0, v: o.speed, active: false };
      const p = new V3(), t = new V3(), up = new V3(), xa = new V3(), ya = new V3(), mat = new T.Matrix4();
      function place() {
        o.cars.forEach((car, i) => {
          tr.frame(st.u - (i * o.gap) / tr.len, p, t, up);
          xa.crossVectors(up, t).normalize(); ya.crossVectors(t, xa);
          mat.makeBasis(xa, ya, t);
          car.quaternion.setFromRotationMatrix(mat);
          car.position.copy(p).addScaledVector(ya, o.lift === undefined ? 0.3 : o.lift);
        });
      }
      function update(dt, onEvent) {
        if (st.running) {
          tr.frame(st.u, p, t, up);
          const target = o.G ? clamp(Math.sqrt(o.speed * o.speed + 2 * o.G * Math.max(0, tr.yMax - p.y)), o.speed, o.vmax || 40) : o.speed;
          st.v += (target - st.v) * Math.min(1, dt * 2.6);
          const prev = st.u;
          st.u += (st.v * dt) / tr.len;
          if (st.active && onEvent && o.events) {
            for (const ev of o.events) if (prev < ev[0] && st.u >= ev[0]) onEvent(ev[1]);
          }
          if (st.u >= 1) {
            st.u -= 1;
            if (!o.auto) {
              st.running = false; st.u = 0; st.v = o.speed;
              if (st.active && onEvent && o.doneMsg) onEvent(o.doneMsg);
            }
          }
        }
        place();
      }
      place();
      const ride = {
        id: o.id, name: o.name, land: o.land, boardPos: o.boardPos, exitPos: o.exitPos,
        start: () => { st.running = true; st.active = true; },
        stop: () => { st.running = false; },
        isRunning: () => st.running,
        onExit: () => { st.active = false; if (!o.auto) { st.running = false; st.u = 0; st.v = o.speed; } },
        getCameraPose: (third) => {
          tr.frame(st.u, p, t, up);
          if (third) {
            const b = o.back || 10;
            return { px: p.x - t.x * b + t.z * 3.5, py: p.y + 4.6, pz: p.z - t.z * b - t.x * 3.5, tx: p.x + t.x * 4, ty: p.y + 1.2, tz: p.z + t.z * 4 };
          }
          const e = o.eye || 1.9;
          const ex = p.x + up.x * e + t.x * 0.5, ey = p.y + Math.max(0.6, up.y) * e + t.y * 0.5, ez = p.z + up.z * e + t.z * 0.5;
          return { px: ex, py: ey, pz: ez, tx: ex + t.x * 14, ty: ey + t.y * 14 - 0.4, tz: ez + t.z * 14 };
        }
      };
      return { ride, update, state: st };
    }

    return { T, Y, MX, S, G, W, bldg, sign, tree, lamp, scatter, frame, asm, track, trainRide, flush, rng, clamp };
  }

  root.TPKit = { create };
})(window);

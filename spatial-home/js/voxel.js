/* Minest · Spatial Home — voxel kit.
   Boxes with baked face shading and a shared 16×16 pixel grain (the same idea as santorini-world/textures.js:
   near-white pixel tiles tinted by vertex colour), merged into one BufferGeometry per part.
   Palette = the "aegean" theme of the voxel exhibition engine (ui/world-displays.js), so the room reads as the same
   world as the Santorini island. */
(function (root) {
  'use strict';
  var THREE = root.THREE;

  var PAL = {
    plaster: '#f3efe6', plaster2: '#e9e3d6', blue: '#2f6fd6', blueDeep: '#234fa6', blueSoft: '#8fb6ee', ink: '#1d2b4f',
    gold: '#f2c13d', brass: '#c79a3a', wood: '#8f5f3d', woodLight: '#b98a5a', woodDark: '#5d3f2a', metal: '#c9ced6',
    paper: '#fbf7ee', stone: '#d8d0c0', stone2: '#c9c0ae', grout: '#a79f8f', terracotta: '#c8744a', leaf: '#5f9a4a',
    leaf2: '#7fb35a', leafDark: '#3f7a3c', pink: '#e2569a', pink2: '#f08cbb', coral: '#ef7d6a', cork: '#d6b384',
    mint: '#9fc9b7', mintDark: '#7fae9b', dark: '#2b2f36', cream: '#f6ead0', straw: '#d9bb7c', sea: '#2b7fc4',
    red: '#d9463e', cyan: '#63e6ff', octo: '#f08aa8'
  };

  function rng(seed) {
    var a = seed | 0;
    return function () { a = (a + 0x6D2B79F5) | 0; var t = Math.imul(a ^ (a >>> 15), 1 | a); t = (t + Math.imul(t ^ (t >>> 7), 61 | t)) ^ t; return ((t ^ (t >>> 14)) >>> 0) / 4294967296; };
  }

  var colCache = {};
  function lin(c) {
    if (colCache[c]) return colCache[c];
    var k = new THREE.Color(PAL[c] || c); k.convertSRGBToLinear();
    return (colCache[c] = [k.r, k.g, k.b]);
  }

  /* corner order per face is counter-clockwise seen from outside */
  var FACES = [
    { v: [[1, 0, 1], [1, 0, 0], [1, 1, 0], [1, 1, 1]], n: [1, 0, 0], s: 0.90, u: 2, w: 1 },
    { v: [[0, 0, 0], [0, 0, 1], [0, 1, 1], [0, 1, 0]], n: [-1, 0, 0], s: 0.86, u: 2, w: 1 },
    { v: [[0, 1, 1], [1, 1, 1], [1, 1, 0], [0, 1, 0]], n: [0, 1, 0], s: 1.00, u: 0, w: 2 },
    { v: [[0, 0, 0], [1, 0, 0], [1, 0, 1], [0, 0, 1]], n: [0, -1, 0], s: 0.66, u: 0, w: 2 },
    { v: [[0, 0, 1], [1, 0, 1], [1, 1, 1], [0, 1, 1]], n: [0, 0, 1], s: 0.95, u: 0, w: 1 },
    { v: [[1, 0, 0], [0, 0, 0], [0, 1, 0], [1, 1, 0]], n: [0, 0, -1], s: 0.82, u: 0, w: 1 }
  ];
  var TILE = 0.4;   // one 16 px grain tile per 0.4 m → 2.5 cm pixels

  function VB(seed) { this.p = []; this.n = []; this.c = []; this.uv = []; this.i = []; this.r = rng(seed || 7); }
  /* box by two corners; colour = palette name or hex; jit = brightness jitter (0…1) */
  VB.prototype.box = function (x0, y0, z0, x1, y1, z1, colour, jit) {
    var t;
    if (x0 > x1) { t = x0; x0 = x1; x1 = t; } if (y0 > y1) { t = y0; y0 = y1; y1 = t; } if (z0 > z1) { t = z0; z0 = z1; z1 = t; }
    var c = lin(colour), j = jit ? 1 + (this.r() - 0.5) * jit : 1, lo = [x0, y0, z0], hi = [x1, y1, z1];
    for (var f = 0; f < 6; f++) {
      var F = FACES[f], base = this.p.length / 3, s = F.s * j;
      for (var k = 0; k < 4; k++) {
        var q = F.v[k], px = q[0] ? hi[0] : lo[0], py = q[1] ? hi[1] : lo[1], pz = q[2] ? hi[2] : lo[2], P = [px, py, pz];
        this.p.push(px, py, pz); this.n.push(F.n[0], F.n[1], F.n[2]); this.c.push(c[0] * s, c[1] * s, c[2] * s);
        this.uv.push(P[F.u] / TILE, P[F.w] / TILE);
      }
      this.i.push(base, base + 1, base + 2, base, base + 2, base + 3);
    }
    return this;
  };
  /* box by centre of its base: (cx, y0, cz) with size w × h × d */
  VB.prototype.cb = function (cx, y0, cz, w, h, d, colour, jit) {
    return this.box(cx - w / 2, y0, cz - d / 2, cx + w / 2, y0 + h, cz + d / 2, colour, jit);
  };
  /* a stepped voxel ball / dome: cells of size s inside radius r around (cx, cy, cz); half = keep the upper half */
  VB.prototype.ball = function (cx, cy, cz, r, s, colour, jit, half, pick) {
    var n = Math.ceil(r / s);
    for (var ix = -n; ix <= n; ix++) for (var iy = half ? 0 : -n; iy <= n; iy++) for (var iz = -n; iz <= n; iz++) {
      var x = (ix + 0.5) * s, y = (iy + 0.5) * s, z = (iz + 0.5) * s, d = Math.sqrt(x * x + y * y + z * z);
      if (d > r) continue;
      if (d < r - s * 1.6) continue;                      // shell only — the inside is never seen
      var col = pick ? pick(this.r, x, y, z) : colour; if (!col) continue;
      this.box(cx + x - s / 2, cy + y - s / 2, cz + z - s / 2, cx + x + s / 2, cy + y + s / 2, cz + z + s / 2, col, jit);
    }
    return this;
  };
  VB.prototype.geometry = function () {
    var g = new THREE.BufferGeometry();
    g.setAttribute('position', new THREE.Float32BufferAttribute(this.p, 3));
    g.setAttribute('normal', new THREE.Float32BufferAttribute(this.n, 3));
    g.setAttribute('color', new THREE.Float32BufferAttribute(this.c, 3));
    g.setAttribute('uv', new THREE.Float32BufferAttribute(this.uv, 2));
    g.setIndex(this.i);
    g.computeBoundingSphere(); g.computeBoundingBox();
    return g;
  };
  VB.prototype.mesh = function (material, noShadow) {
    var m = new THREE.Mesh(this.geometry(), material || MAT.solid());
    if (!noShadow) { m.castShadow = true; m.receiveShadow = true; }
    return m;
  };

  var grainTex = null;
  function grain() {
    if (grainTex) return grainTex;
    var c = document.createElement('canvas'); c.width = c.height = 16;
    var g = c.getContext('2d'), r = rng(4242), d = g.createImageData(16, 16);
    for (var i = 0; i < 256; i++) {
      var v = 0.93 + r() * 0.07; if (r() < 0.06) v -= 0.06; if (r() < 0.04) v += 0.03;
      var b = Math.max(0, Math.min(255, Math.round(v * 255)));
      d.data[i * 4] = b; d.data[i * 4 + 1] = b; d.data[i * 4 + 2] = b; d.data[i * 4 + 3] = 255;
    }
    g.putImageData(d, 0, 0);
    grainTex = new THREE.CanvasTexture(c);
    grainTex.magFilter = THREE.NearestFilter; grainTex.minFilter = THREE.LinearMipMapLinearFilter;
    grainTex.wrapS = grainTex.wrapT = THREE.RepeatWrapping; grainTex.encoding = THREE.sRGBEncoding;
    return grainTex;
  }
  var MAT = {
    solid: function () { return new THREE.MeshLambertMaterial({ vertexColors: true, map: grain() }); },
    glow: function (opacity) {
      return new THREE.MeshBasicMaterial({ vertexColors: true, transparent: opacity != null && opacity < 1, opacity: opacity == null ? 1 : opacity, fog: false });
    },
    holo: function (opacity) {
      return new THREE.MeshBasicMaterial({ vertexColors: true, transparent: true, opacity: opacity, blending: THREE.AdditiveBlending, depthWrite: false, fog: false });
    }
  };

  root.SpatialVoxel = { VB: VB, PAL: PAL, MAT: MAT, rng: rng, lin: lin };
})(window);

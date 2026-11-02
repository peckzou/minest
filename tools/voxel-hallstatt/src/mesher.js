/* Chunked voxel mesher with face culling, baked ambient occlusion and per-block colour jitter. */
(function (root) {
  'use strict';
  const FACES = [
    { dir: [-1, 0, 0], corners: [{ p: [0, 1, 0], uv: [0, 1] }, { p: [0, 0, 0], uv: [0, 0] }, { p: [0, 1, 1], uv: [1, 1] }, { p: [0, 0, 1], uv: [1, 0] }] },
    { dir: [1, 0, 0], corners: [{ p: [1, 1, 1], uv: [0, 1] }, { p: [1, 0, 1], uv: [0, 0] }, { p: [1, 1, 0], uv: [1, 1] }, { p: [1, 0, 0], uv: [1, 0] }] },
    { dir: [0, -1, 0], corners: [{ p: [1, 0, 1], uv: [1, 0] }, { p: [0, 0, 1], uv: [0, 0] }, { p: [1, 0, 0], uv: [1, 1] }, { p: [0, 0, 0], uv: [0, 1] }] },
    { dir: [0, 1, 0], corners: [{ p: [0, 1, 1], uv: [1, 1] }, { p: [1, 1, 1], uv: [0, 1] }, { p: [0, 1, 0], uv: [1, 0] }, { p: [1, 1, 0], uv: [0, 0] }] },
    { dir: [0, 0, -1], corners: [{ p: [1, 0, 0], uv: [0, 0] }, { p: [0, 0, 0], uv: [1, 0] }, { p: [1, 1, 0], uv: [0, 1] }, { p: [0, 1, 0], uv: [1, 1] }] },
    { dir: [0, 0, 1], corners: [{ p: [0, 0, 1], uv: [0, 0] }, { p: [1, 0, 1], uv: [1, 0] }, { p: [0, 1, 1], uv: [0, 1] }, { p: [1, 1, 1], uv: [1, 1] }] }
  ];
  const SHADE = [0.9, 0.9, 0.7, 1.0, 0.84, 0.84];
  const AO = [0.52, 0.72, 0.87, 1.0];
  const TS = 16, COLS = 8, ROWS = 4;

  function Attr() { return { pos: [], nor: [], uv: [], col: [], idx: [], n: 0 }; }

  function toGeometry(a) {
    if (!a.n) return null;
    const g = new THREE.BufferGeometry();
    g.setAttribute('position', new THREE.BufferAttribute(new Float32Array(a.pos), 3));
    g.setAttribute('normal', new THREE.BufferAttribute(new Int8Array(a.nor), 3, true));
    g.setAttribute('uv', new THREE.BufferAttribute(new Uint16Array(a.uv), 2, true));
    g.setAttribute('color', new THREE.BufferAttribute(new Uint8Array(a.col), 3, true));
    g.setIndex(new THREE.BufferAttribute(new Uint32Array(a.idx), 1));
    g.computeBoundingSphere();
    g.computeBoundingBox();
    return g;
  }

  function buildChunk(world, cx, cz, CH) {
    const { W, D, H, blocks, cols, palette, BI } = world;
    const x0 = cx * CH, z0 = cz * CH, x1 = Math.min(W, x0 + CH), z1 = Math.min(D, z0 + CH);
    const opaque = Attr(), glow = Attr();
    const hash3 = HallstattWorld.hash3;
    const WD = W * D;
    const solid = (x, y, z) => {
      if (y < 0) return 1;
      if (x < 0 || x >= W || z < 0 || z >= D || y >= H) return 0;
      return blocks[x + W * z + WD * y] !== 0 ? 1 : 0;
    };
    const pos = [0, 0, 0];
    for (let y = 0; y < H; y++) {
      for (let z = z0; z < z1; z++) {
        for (let x = x0; x < x1; x++) {
          const id = blocks[x + W * z + WD * y];
          if (id === 0) continue;
          const info = BI[id];
          const A = info.glow ? glow : opaque;
          const pc = palette[cols[x + W * z + WD * y]] || palette[0];
          const hv = hash3(x, y, z);
          const wv = id === world.B.GLASS ? hash3(x, Math.floor((y - 1) / 5), z) : 0;
          const jb = id === world.B.GLASS ? (wv < 0.3 ? 0.2 : 0.8 + wv * 0.2) : 1 + (hv - 0.5) * 2 * info.jit;
          for (let f = 0; f < 6; f++) {
            const face = FACES[f], d = face.dir;
            if (solid(x + d[0], y + d[1], z + d[2])) continue;
            const tile = f === 3 ? info.top : f === 2 ? info.bottom : info.side;
            const u0 = (tile % COLS) / COLS, v0 = 1 - (Math.floor(tile / COLS) + 1) / ROWS;
            const du = 1 / COLS, dv = 1 / ROWS, eps = 0.012;
            const ao = [0, 0, 0, 0];
            const axis = d[0] !== 0 ? 0 : d[1] !== 0 ? 1 : 2;
            const ta = axis === 0 ? 1 : 0, tb = axis === 2 ? 1 : 2;
            for (let c = 0; c < 4; c++) {
              const p = face.corners[c].p;
              const sa = p[ta] ? 1 : -1, sb = p[tb] ? 1 : -1;
              const o1 = [d[0], d[1], d[2]], o2 = [d[0], d[1], d[2]], o3 = [d[0], d[1], d[2]];
              o1[ta] += sa; o2[tb] += sb; o3[ta] += sa; o3[tb] += sb;
              const s1 = solid(x + o1[0], y + o1[1], z + o1[2]), s2 = solid(x + o2[0], y + o2[1], z + o2[2]);
              const s3 = solid(x + o3[0], y + o3[1], z + o3[2]);
              ao[c] = (s1 && s2) ? 0 : 3 - (s1 + s2 + s3);
            }
            const base = A.n;
            const shade = SHADE[f] * jb;
            for (let c = 0; c < 4; c++) {
              const cr = face.corners[c];
              A.pos.push(x + cr.p[0], y + cr.p[1], z + cr.p[2]);
              A.nor.push(d[0] * 127, d[1] * 127, d[2] * 127);
              A.uv.push(Math.round((u0 + du * (eps + cr.uv[0] * (1 - 2 * eps))) * 65535), Math.round((v0 + dv * (eps + cr.uv[1] * (1 - 2 * eps))) * 65535));
              const k = shade * AO[ao[c]];
              A.col.push(Math.min(255, Math.round(pc[0] * k * 255)), Math.min(255, Math.round(pc[1] * k * 255)), Math.min(255, Math.round(pc[2] * k * 255)));
            }
            if (ao[0] + ao[3] > ao[1] + ao[2]) A.idx.push(base, base + 1, base + 3, base, base + 3, base + 2);
            else A.idx.push(base, base + 1, base + 2, base + 2, base + 1, base + 3);
            A.n += 4;
          }
        }
      }
    }
    return { opaque: toGeometry(opaque), glow: toGeometry(glow) };
  }

  root.HallstattMesher = { buildChunk };
})(window);

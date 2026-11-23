/* Cathedrals' Island — High-Craft 3D Architectural Engine for ALL 20 Iconic Cathedrals (15 Catholic + 5 Modern).
 * Uses ExtrudeGeometry, LatheGeometry, procedural stained-glass rose windows, Tuscan tri-color marble,
 * Vienna diamond mosaic tile roofs, Gaudí perforated spires, Le Corbusier curved concrete roof,
 * Tadao Ando's glowing Light Cross, Oscar Niemeyer's 16 hyperboloid ribs, Hallgrímskirkja basalt pipes,
 * and Thorncrown glass-and-timber diamond truss.
 * Exposes CIProps = { build(world, THREE, scene) -> { update(dt, time, cam, night), stats() } }. */
(function (root) {
  'use strict';

  function rng(seed) {
    let a = seed | 0;
    return () => {
      a = (a + 0x6D2B79F5) | 0;
      let t = Math.imul(a ^ (a >>> 15), 1 | a);
      t = (t + Math.imul(t ^ (t >>> 7), 61 | t)) ^ t;
      return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
    };
  }

  function build(world, T, scene) {
    const group = new T.Group(); group.name = 'ci-props'; scene.add(group);
    const P = world.props, made = { meshes: 0, textures: 0 };

    const cvs = (w, h) => { const c = document.createElement('canvas'); c.width = w; c.height = h; return c; };
    function finTex(c, wrap) {
      const t = new T.CanvasTexture(c);
      if (wrap) t.wrapS = t.wrapT = T.RepeatWrapping;
      if (T.sRGBEncoding !== undefined) t.encoding = T.sRGBEncoding;
      t.anisotropy = 4;
      made.textures++;
      return t;
    }

    /* ---------------- Merge & Geometry Helpers ---------------- */
    function Merger() { this.list = []; }
    Merger.prototype.add = function (geo, m) {
      const g = geo.index ? geo.toNonIndexed() : geo.clone();
      g.applyMatrix4(m);
      this.list.push(g);
    };
    Merger.prototype.mesh = function (mat, shadow) {
      if (!this.list.length) return null;
      let n = 0; this.list.forEach((g) => { n += g.attributes.position.count; });
      const pos = new Float32Array(n * 3), nor = new Float32Array(n * 3), uv = new Float32Array(n * 2);
      let o = 0;
      this.list.forEach((g) => {
        pos.set(g.attributes.position.array, o * 3);
        nor.set(g.attributes.normal.array, o * 3);
        if (g.attributes.uv) uv.set(g.attributes.uv.array, o * 2);
        o += g.attributes.position.count;
        g.dispose();
      });
      const geo = new T.BufferGeometry();
      geo.setAttribute('position', new T.BufferAttribute(pos, 3));
      geo.setAttribute('normal', new T.BufferAttribute(nor, 3));
      geo.setAttribute('uv', new T.BufferAttribute(uv, 2));
      geo.computeBoundingSphere();
      const me = new T.Mesh(geo, mat);
      me.receiveShadow = true;
      if (shadow !== false) me.castShadow = true;
      group.add(me); made.meshes++;
      return me;
    };

    function Geo() { this.p = []; this.u = []; this.c = []; }
    Geo.prototype.tri = function (a, b, c, ua, ub, uc, col) {
      this.p.push(a[0], a[1], a[2], b[0], b[1], b[2], c[0], c[1], c[2]);
      this.u.push(ua[0], ua[1], ub[0], ub[1], uc[0], uc[1]);
      for (let k = 0; k < 3; k++) this.c.push(col[0], col[1], col[2]);
    };
    Geo.prototype.quad = function (a, b, c, d, ua, ub, uc, ud, col) {
      this.tri(a, b, c, ua, ub, uc, col); this.tri(a, c, d, ua, uc, ud, col);
    };
    Geo.prototype.mesh = function (mat, up) {
      if (!this.p.length) return null;
      const g = new T.BufferGeometry();
      g.setAttribute('position', new T.Float32BufferAttribute(this.p, 3));
      g.setAttribute('uv', new T.Float32BufferAttribute(this.u, 2));
      g.setAttribute('color', new T.Float32BufferAttribute(this.c, 3));
      if (up) {
        const n = new Float32Array(this.p.length); for (let i = 1; i < n.length; i += 3) n[i] = 1;
        g.setAttribute('normal', new T.BufferAttribute(n, 3));
      } else g.computeVertexNormals();
      g.computeBoundingSphere();
      const m = new T.Mesh(g, mat); m.receiveShadow = true; group.add(m); made.meshes++; return m;
    };

    const M = (x, y, z, rx, ry, rz, sx, sy, sz) => new T.Matrix4().compose(
      new T.Vector3(x, y, z),
      new T.Quaternion().setFromEuler(new T.Euler(rx || 0, ry || 0, rz || 0, 'YXZ')),
      new T.Vector3(sx || 1, sy || 1, sz || 1)
    );
    const cyl = (r0, r1, h, s) => new T.CylinderGeometry(r0, r1, h, s || 10);
    const sph = (r, s) => new T.SphereGeometry(r, s || 10, 8);
    const torus = (r, t) => new T.TorusGeometry(r, t, 6, Math.max(16, Math.round(r * 18)));
    const box = (mg, w, h, d, x, y, z, rx, ry, rz) => mg.add(new T.BoxGeometry(w, h, d), M(x, y, z, rx, ry, rz));
    const V2 = (pts) => pts.map(([a, b]) => new T.Vector2(a, b));

    function addMesh(geo, mat, px, py, pz, rx, ry, rz, shadow) {
      const m = new T.Mesh(geo, mat);
      m.position.set(px, py, pz); m.rotation.set(rx || 0, ry || 0, rz || 0);
      m.receiveShadow = true; if (shadow) m.castShadow = true;
      group.add(m); made.meshes++; return m;
    }

    /* ---------------- Bespoke Procedural Architectural Textures ---------------- */
    function makeAshlarTex(baseHex, veinHex, jointHex, seed) {
      const S = 256, c = cvs(S, S), x = c.getContext('2d'), r = rng(seed || 101);
      x.fillStyle = baseHex; x.fillRect(0, 0, S, S);
      for (let i = 0; i < 650; i++) {
        x.fillStyle = r() > 0.5 ? veinHex : 'rgba(255,255,255,0.08)';
        x.fillRect(r() * S, r() * S, 2 + r() * 14, 1 + r() * 3);
      }
      x.strokeStyle = jointHex; x.lineWidth = 1.5;
      for (let y = 0; y < S; y += 32) {
        x.beginPath(); x.moveTo(0, y); x.lineTo(S, y); x.stroke();
        const off = (Math.floor(y / 32) % 2) * 32;
        for (let xx = off; xx < S; xx += 64) { x.beginPath(); x.moveTo(xx, y); x.lineTo(xx, y + 32); x.stroke(); }
      }
      return finTex(c, true);
    }

    // 1. High-Craft Gothic Stained Glass Rose Window Texture (12-petal radial jewel glass!)
    function makeRoseWindowTex(palette, seed) {
      const S = 512, c = cvs(S, S), x = c.getContext('2d'), cx0 = S / 2, cy0 = S / 2;
      x.fillStyle = '#18141c'; x.fillRect(0, 0, S, S);
      const cols = palette || ['#1d4ed8', '#dc2626', '#f59e0b', '#7c3aed', '#0284c7', '#fbbf24'];
      const rings = [[235, 12], [178, 12], [122, 12], [68, 6]];
      rings.forEach(([rr, n], ri) => {
        for (let i = 0; i < n; i++) {
          const a0 = (i / n) * Math.PI * 2, a1 = ((i + 1) / n) * Math.PI * 2, am = (a0 + a1) * 0.5;
          x.fillStyle = cols[(i + ri * 2 + (seed || 0)) % cols.length];
          x.beginPath(); x.moveTo(cx0, cy0); x.arc(cx0, cy0, rr, a0, a1); x.closePath(); x.fill();
          x.strokeStyle = '#161218'; x.lineWidth = 6; x.stroke();
          // Glowing jewel petal center
          x.fillStyle = cols[(i + ri + 3) % cols.length];
          x.beginPath(); x.arc(cx0 + Math.cos(am) * (rr * 0.78), cy0 + Math.sin(am) * (rr * 0.78), rr * 0.14, 0, Math.PI * 2); x.fill();
          x.strokeStyle = '#161218'; x.lineWidth = 3.5; x.stroke();
        }
      });
      // Golden center medallion
      x.fillStyle = '#fde047'; x.beginPath(); x.arc(cx0, cy0, 34, 0, Math.PI * 2); x.fill();
      x.strokeStyle = '#161218'; x.lineWidth = 6; x.stroke();
      // Outer carved stone tracery rim
      x.strokeStyle = '#d6cbb8'; x.lineWidth = 14; x.beginPath(); x.arc(cx0, cy0, 242, 0, Math.PI * 2); x.stroke();
      return finTex(c, false);
    }

    // 2. Tall Lancet Stained Glass Window (for Sainte-Chapelle, Chartres, Gothic Choirs)
    function makeLancetGlassTex(dominantHex, accentHex) {
      const W = 256, H = 512, c = cvs(W, H), x = c.getContext('2d');
      const g = x.createLinearGradient(0, 0, 0, H);
      g.addColorStop(0, accentHex || '#7c3aed'); g.addColorStop(0.5, dominantHex || '#1d4ed8'); g.addColorStop(1, '#1e3a8a');
      x.fillStyle = g; x.fillRect(0, 0, W, H);
      const jewels = ['#ef4444', '#f59e0b', '#38bdf8', '#a855f7', '#fde047', '#2563eb'];
      for (let y = 36; y < H - 24; y += 64) {
        for (let xx = 42; xx < W - 24; xx += 84) {
          x.fillStyle = jewels[((y / 64) + (xx / 84)) | 0 % jewels.length];
          x.beginPath(); x.moveTo(xx, y - 22); x.lineTo(xx + 22, y); x.lineTo(xx, y + 22); x.lineTo(xx - 22, y); x.closePath(); x.fill();
          x.strokeStyle = '#14121a'; x.lineWidth = 4; x.stroke();
        }
      }
      x.strokeStyle = '#14121a'; x.lineWidth = 7;
      for (let xx = 0; xx <= W; xx += 85) { x.beginPath(); x.moveTo(xx, 0); x.lineTo(xx, H); x.stroke(); }
      for (let yy = 0; yy <= H; yy += 64) { x.beginPath(); x.moveTo(0, yy); x.lineTo(W, yy); x.stroke(); }
      return finTex(c, true);
    }

    // 3. Florence Duomo Tri-Color Tuscan Marble (White Carrara + Dark Green Prato + Pink Maremma!)
    function makeTuscanMarbleTex() {
      const S = 256, c = cvs(S, S), x = c.getContext('2d');
      x.fillStyle = '#f4efe6'; x.fillRect(0, 0, S, S);
      // Horizontal dark Prato green & dusty rose bands
      x.fillStyle = '#254437'; x.fillRect(0, 0, S, 16); x.fillRect(0, 122, S, 14); x.fillRect(0, S - 14, S, 14);
      x.fillStyle = '#c88c82'; x.fillRect(0, 18, S, 8); x.fillRect(0, 138, S, 8);
      // Framed geometric Tuscan marble panels
      for (let col = 0; col < 2; col++) {
        const ox = col * 128;
        x.strokeStyle = '#254437'; x.lineWidth = 6; x.strokeRect(ox + 12, 34, 104, 78);
        x.strokeStyle = '#c88c82'; x.lineWidth = 3; x.strokeRect(ox + 22, 44, 84, 58);
        x.strokeStyle = '#254437'; x.lineWidth = 6; x.strokeRect(ox + 12, 154, 104, 78);
        x.fillStyle = '#254437'; x.beginPath(); x.arc(ox + 64, 193, 18, 0, Math.PI * 2); x.fill();
        x.fillStyle = '#f4efe6'; x.beginPath(); x.arc(ox + 64, 193, 11, 0, Math.PI * 2); x.fill();
      }
      return finTex(c, true);
    }

    // 4. Vienna St. Stephen's Glazed Diamond Mosaic Roof Tile Texture!
    function makeViennaMosaicRoofTex() {
      const S = 256, c = cvs(S, S), x = c.getContext('2d');
      x.fillStyle = '#1b5e3c'; x.fillRect(0, 0, S, S);
      const step = 32;
      const cols = ['#1b5e3c', '#d9a426', '#f4efe4', '#a82824', '#164d31', '#eab308'];
      for (let y = -step; y <= S + step; y += step) {
        for (let xx = -step; xx <= S + step; xx += step) {
          const ci = (Math.abs(Math.floor(xx / step) + Math.floor(y / step)) * 2 + (Math.floor(y / step) % 2)) % cols.length;
          x.fillStyle = cols[ci];
          x.beginPath(); x.moveTo(xx, y - step / 2); x.lineTo(xx + step / 2, y); x.lineTo(xx, y + step / 2); x.lineTo(xx - step / 2, y); x.closePath(); x.fill();
          x.strokeStyle = 'rgba(0,0,0,0.28)'; x.lineWidth = 1.5; x.stroke();
        }
      }
      return finTex(c, true);
    }

    // 5. Tadao Ando Board-Formed Smooth Concrete with Tie-Rod Holes (清水混凝土拉杆孔)
    function makeAndoConcreteTex() {
      const S = 256, c = cvs(S, S), x = c.getContext('2d'), r = rng(404);
      x.fillStyle = '#b4b8bc'; x.fillRect(0, 0, S, S);
      for (let i = 0; i < 600; i++) {
        x.fillStyle = r() > 0.5 ? 'rgba(255,255,255,0.06)' : 'rgba(40,46,52,0.06)';
        x.fillRect(r() * S, r() * S, 3 + r() * 14, 2 + r() * 4);
      }
      // Crisp 2x2 tatami-proportioned formwork seams + 6 circular tie-rod cones per panel
      x.strokeStyle = 'rgba(60,65,72,0.45)'; x.lineWidth = 2;
      x.strokeRect(1, 1, 126, 126); x.strokeRect(129, 1, 126, 126);
      x.strokeRect(1, 129, 126, 126); x.strokeRect(129, 129, 126, 126);
      for (let py = 0; py < 2; py++) for (let px = 0; px < 2; px++) {
        for (const [dx, dy] of [[24, 28], [64, 28], [104, 28], [24, 98], [64, 98], [104, 98]]) {
          x.fillStyle = 'rgba(45,50,56,0.58)'; x.beginPath(); x.arc(px * 128 + dx, py * 128 + dy, 3.2, 0, Math.PI * 2); x.fill();
        }
      }
      return finTex(c, true);
    }

    // 6. Le Corbusier Ronchamp Scattered Colored Stained-Glass Wall Matrix!
    function makeRonchampWallTex() {
      const W = 512, H = 256, c = cvs(W, H), x = c.getContext('2d');
      x.fillStyle = '#f3efe6'; x.fillRect(0, 0, W, H);
      const slots = [
        [36, 32, 34, 24, '#e11d48'], [96, 22, 22, 42, '#2563eb'], [148, 52, 48, 28, '#eab308'],
        [224, 26, 28, 36, '#16a34a'], [284, 48, 42, 24, '#f97316'], [356, 28, 30, 44, '#3b82f6'],
        [424, 42, 46, 32, '#ef4444'], [54, 118, 46, 36, '#facc15'], [134, 128, 28, 52, '#1d4ed8'],
        [198, 108, 54, 30, '#22c55e'], [278, 134, 34, 46, '#dc2626'], [342, 112, 44, 32, '#eab308'],
        [418, 126, 36, 48, '#2563eb'], [82, 192, 30, 26, '#fb923c'], [236, 186, 42, 34, '#38bdf8'],
        [368, 188, 36, 28, '#f43f5e']
      ];
      slots.forEach(([sx, sy, sw, sh, col]) => {
        x.fillStyle = '#c8c0b2'; x.fillRect(sx - 5, sy - 5, sw + 10, sh + 10);
        x.fillStyle = col; x.fillRect(sx, sy, sw, sh);
        x.strokeStyle = 'rgba(0,0,0,0.28)'; x.lineWidth = 2; x.strokeRect(sx, sy, sw, sh);
      });
      return finTex(c, false);
    }

    // 7. Museum Architectural History & Spec Plaque inside each Cathedral
    function makeCathedralPlaqueTex(cat) {
      const W = 512, H = 280, c = cvs(W, H), x = c.getContext('2d');
      const isMod = cat.category === 'modern';
      x.fillStyle = isMod ? '#111827' : '#211912'; x.fillRect(0, 0, W, H);
      x.strokeStyle = isMod ? '#38bdf8' : '#d4a64a'; x.lineWidth = 6; x.strokeRect(8, 8, W - 16, H - 16);
      x.fillStyle = isMod ? '#7dd3fc' : '#fde68a';
      x.font = '800 28px "PingFang SC", Georgia, serif'; x.textAlign = 'center';
      x.fillText(`${cat.num}. ${cat.name}`, W / 2, 50);
      x.fillStyle = '#cbd5e1'; x.font = '600 16px Georgia, serif';
      x.fillText(`${cat.en}  ·  ${cat.era}`, W / 2, 78);
      x.fillStyle = isMod ? '#38bdf8' : '#e0b868'; x.font = '700 15px "PingFang SC", sans-serif';
      x.fillText(`${cat.city}  |  ${cat.style}  |  高 ${cat.height}`, W / 2, 108);
      x.fillStyle = '#f1f5f9'; x.font = '500 16px "PingFang SC", sans-serif';
      const lines = [
        `建筑师：${cat.architect}`,
        `✦ ${cat.highlights[0]}`,
        `✦ ${cat.highlights[1]}`,
        `“${cat.quote.slice(0, 28)}${cat.quote.length > 28 ? '…' : ''}”`
      ];
      lines.forEach((ln, i) => x.fillText(ln, W / 2, 146 + i * 31));
      return finTex(c, false);
    }

    // 8. Pipe Organ Metallic Facade Texture (管风琴音管列阵)
    function makePipeOrganTex() {
      const W = 256, H = 256, c = cvs(W, H), x = c.getContext('2d');
      x.fillStyle = '#3b2414'; x.fillRect(0, 0, W, H);
      x.strokeStyle = '#d4a64a'; x.lineWidth = 6; x.strokeRect(6, 6, W - 12, H - 12);
      const n = 22, pw = (W - 28) / n;
      for (let i = 0; i < n; i++) {
        const px = 14 + i * pw;
        const arch = Math.sin((i / (n - 1)) * Math.PI);
        const ph = 90 + arch * 128;
        const g = x.createLinearGradient(px, 0, px + pw, 0);
        g.addColorStop(0, '#8a7a58'); g.addColorStop(0.45, '#f2e4ba'); g.addColorStop(1, '#7a6846');
        x.fillStyle = g; x.fillRect(px + 1, H - 20 - ph, pw - 2, ph);
      }
      return finTex(c, false);
    }

    /* ---------------- Shared Architectural Materials ---------------- */
    const travMat = new T.MeshLambertMaterial({ map: makeAshlarTex('#efe7d4', 'rgba(160,140,104,0.16)', 'rgba(130,115,90,0.22)', 11), emissive: 0x1a150e });
    const whiteMarbleMat = new T.MeshLambertMaterial({ map: makeAshlarTex('#f5f2eb', 'rgba(180,175,168,0.15)', 'rgba(150,145,140,0.22)', 12), emissive: 0x1e1d1b });
    const gothicGreyMat = new T.MeshLambertMaterial({ map: makeAshlarTex('#7d7c78', 'rgba(60,60,58,0.2)', 'rgba(42,42,40,0.32)', 13), emissive: 0x121210 });
    const limestoneMat = new T.MeshLambertMaterial({ map: makeAshlarTex('#dfd6c2', 'rgba(145,134,112,0.18)', 'rgba(110,100,82,0.25)', 14), emissive: 0x18150f });
    const sandstoneMat = new T.MeshLambertMaterial({ map: makeAshlarTex('#d7b68a', 'rgba(155,112,68,0.22)', 'rgba(118,86,52,0.28)', 15), emissive: 0x1a120a });
    const brickRedMat = new T.MeshLambertMaterial({ map: makeAshlarTex('#b6533c', 'rgba(120,42,26,0.2)', 'rgba(210,196,178,0.3)', 16), emissive: 0x160a06 });
    const terracottaDomeMat = new T.MeshLambertMaterial({ color: 0xc25b38, emissive: 0x1a0b05 });
    const tuscanMat = new T.MeshLambertMaterial({ map: makeTuscanMarbleTex(), emissive: 0x161614 });
    const viennaRoofMat = new T.MeshLambertMaterial({ map: makeViennaMosaicRoofTex(), emissive: 0x121810, side: T.DoubleSide });
    const slateRoofMat = new T.MeshLambertMaterial({ color: 0x3b4858, side: T.DoubleSide });
    const copperMat = new T.MeshPhongMaterial({ color: 0x4b8779, specular: 0x9ecbc0, shininess: 36, emissive: 0x061411 });
    const goldMat = new T.MeshPhongMaterial({ color: 0xd9ad46, specular: 0xfef0b8, shininess: 55, emissive: 0x241904 });
    const bronzeMat = new T.MeshPhongMaterial({ color: 0x6e5332, specular: 0xc8b288, shininess: 36, emissive: 0x100b04 });
    const concreteMat = new T.MeshLambertMaterial({ map: makeAndoConcreteTex(), emissive: 0x141618 });
    const darkConcreteMat = new T.MeshLambertMaterial({ color: 0x52575e, emissive: 0x0d0f12 });
    const whitePlasterMat = new T.MeshLambertMaterial({ color: 0xf5f2ea, emissive: 0x201e1a });
    const timberMat = new T.MeshLambertMaterial({ color: 0x4d331f });
    const blueGlassMat = new T.MeshPhongMaterial({ color: 0x38bdf8, specular: 0xffffff, shininess: 90, transparent: true, opacity: 0.62, emissive: 0x0d4a7a, side: T.DoubleSide });
    const clearGlassMat = new T.MeshPhongMaterial({ color: 0xdbf0ff, specular: 0xffffff, shininess: 110, transparent: true, opacity: 0.34, emissive: 0x0c2438, side: T.DoubleSide });
    const glowCrossMat = new T.MeshBasicMaterial({ color: 0xfffbe6, side: T.DoubleSide });
    const crystalMat = new T.MeshPhongMaterial({ color: 0x7dd3fc, specular: 0xffffff, shininess: 110, transparent: true, opacity: 0.85, emissive: 0x12425a });
    const pipeOrganTex = makePipeOrganTex();
    const pipeOrganMat = new T.MeshLambertMaterial({ map: pipeOrganTex, emissiveMap: pipeOrganTex, emissive: 0xffe8b8, emissiveIntensity: 0.25 });
    const silverPipeMat = new T.MeshPhongMaterial({ color: 0xe2e8f0, specular: 0xffffff, shininess: 92, emissive: 0x161c24 });
    const darkOakMat = new T.MeshLambertMaterial({ color: 0x3b2414, emissive: 0x0c0704 });
    const candleFlameMat = new T.MeshBasicMaterial({ color: 0xffe08a });
    const ivoryKeyMat = new T.MeshLambertMaterial({ color: 0xfefce8 });

    // Rich jewel-toned stained glass textures (Chartres Blue, Gothic Ruby/Sapphire, Gaudí Emerald/Cyan, Gaudí Fiery Gold, St. Peter's Golden Dove)
    const roseMatGothic = new T.MeshLambertMaterial({ map: makeRoseWindowTex(null, 1), emissiveMap: makeRoseWindowTex(null, 1), emissive: 0xffffff, emissiveIntensity: 0.58, side: T.DoubleSide });
    const roseMatChartres = new T.MeshLambertMaterial({ map: makeRoseWindowTex(['#1d4ed8', '#2563eb', '#3b82f6', '#dc2626', '#6366f1', '#f59e0b'], 3), emissiveMap: makeRoseWindowTex(['#1d4ed8', '#2563eb', '#3b82f6', '#dc2626', '#6366f1', '#f59e0b'], 3), emissive: 0xffffff, emissiveIntensity: 0.64, side: T.DoubleSide });
    // Procedural Gaudí Honeycombed Parabolic Bell-Tower Texture (pale Catalan limestone with rhythmic vertical dark acoustic louver slits!)
    function makeGaudiTowerTex() {
      const c = cvs(256, 512), x = c.getContext('2d');
      x.fillStyle = '#ddd0b8'; x.fillRect(0, 0, 256, 512);
      // Subtle horizontal Catalan sandstone courses
      for (let y = 0; y < 512; y += 16) {
        x.fillStyle = (y % 32 === 0) ? 'rgba(135,112,82,0.16)' : 'rgba(255,248,232,0.12)';
        x.fillRect(0, y, 256, 3);
      }
      // 8 vertical columns of dark perforated acoustic louver slits (Gaudí's unmistakable corncob/honeycomb towers!)
      for (let col = 0; col < 8; col++) {
        const cx = col * 32 + 16;
        // Raised pale vertical stone rib flanking each slit column
        x.fillStyle = '#efe5d0'; x.fillRect(col * 32, 0, 6, 512);
        for (let row = 0; row < 20; row++) {
          const ry = 24 + row * 23;
          x.fillStyle = '#3b3024'; x.fillRect(cx - 5, ry, 10, 14);
          x.fillStyle = '#5c4b37'; x.fillRect(cx - 5, ry, 10, 3);
        }
      }
      return finTex(c, true);
    }
    const gaudiTowerMat = new T.MeshLambertMaterial({ map: makeGaudiTowerTex(), emissive: 0x16120c });
    // Procedural Duomo di Milano Flamboyant Gothic Tracery Window & Carved Bronze Portal Textures!
    function makeMilanWindowTex() {
      const c = cvs(128, 256), x = c.getContext('2d');
      x.fillStyle = '#f2ece5'; x.fillRect(0, 0, 128, 256);
      // Pointed Gothic arch dark stained-glass interior
      x.fillStyle = '#242b38';
      x.beginPath();
      x.moveTo(12, 248); x.lineTo(12, 86);
      x.quadraticCurveTo(12, 24, 64, 8);
      x.quadraticCurveTo(116, 24, 116, 86);
      x.lineTo(116, 248); x.closePath(); x.fill();
      // Subtle leaded diamond glass shimmer
      x.strokeStyle = 'rgba(148,180,220,0.22)'; x.lineWidth = 1.5;
      for (let y = 20; y < 248; y += 16) { x.beginPath(); x.moveTo(14, y); x.lineTo(114, y); x.stroke(); }
      // Intricate Flamboyant White Candoglia Marble Stone Mullions & Rose Tracery!
      x.strokeStyle = '#efe8df'; x.lineWidth = 5;
      for (const mx of [38, 64, 90]) { x.beginPath(); x.moveTo(mx, 78); x.lineTo(mx, 248); x.stroke(); }
      // Upper pointed tracery rose & trefoils
      x.lineWidth = 4;
      x.beginPath(); x.arc(64, 52, 20, 0, Math.PI * 2); x.stroke();
      x.beginPath(); x.arc(44, 78, 13, Math.PI, 0); x.stroke();
      x.beginPath(); x.arc(84, 78, 13, Math.PI, 0); x.stroke();
      x.beginPath(); x.moveTo(12, 248); x.lineTo(12, 86); x.quadraticCurveTo(12, 24, 64, 8); x.quadraticCurveTo(116, 24, 116, 86); x.lineTo(116, 248); x.stroke();
      return finTex(c, false);
    }
    function makeMilanDoorTex() {
      const c = cvs(128, 256), x = c.getContext('2d');
      x.fillStyle = '#3a2a1c'; x.fillRect(0, 0, 128, 256);
      // Twin carved bronze door leaves with recessed relief panels
      x.strokeStyle = '#8a6b42'; x.lineWidth = 4;
      x.strokeRect(6, 6, 54, 244); x.strokeRect(68, 6, 54, 244);
      for (let r = 0; r < 5; r++) {
        const ry = 18 + r * 46;
        x.fillStyle = '#4f3a26'; x.fillRect(14, ry, 38, 36); x.fillRect(76, ry, 38, 36);
        x.strokeStyle = '#a88452'; x.lineWidth = 2;
        x.strokeRect(14, ry, 38, 36); x.strokeRect(76, ry, 38, 36);
      }
      return finTex(c, false);
    }
    const milanWinMat = new T.MeshLambertMaterial({ map: makeMilanWindowTex(), emissive: 0x0e1218 });
    const milanDoorMat = new T.MeshLambertMaterial({ map: makeMilanDoorTex(), emissive: 0x0a0704 });
    // Procedural Gaudí Sagrada Família Sculpted Organic Nativity Portal Relief & Rose-Lancet Texture!
    function makeGaudiNativityTex() {
      const c = cvs(128, 256), x = c.getContext('2d');
      x.fillStyle = '#d5c2a0'; x.fillRect(0, 0, 128, 256);
      // Deeply shadowed organic Gothic-Modernist cave arch
      x.fillStyle = '#33261a';
      x.beginPath();
      x.moveTo(14, 250); x.lineTo(14, 118);
      x.quadraticCurveTo(14, 42, 64, 14);
      x.quadraticCurveTo(114, 42, 114, 118);
      x.lineTo(114, 250); x.closePath(); x.fill();
      // Carved sandstone Nativity relief & stalactite organic arch ribs
      x.strokeStyle = '#efe2c8'; x.lineWidth = 5;
      x.beginPath(); x.moveTo(14, 250); x.lineTo(14, 118); x.quadraticCurveTo(14, 42, 64, 14); x.quadraticCurveTo(114, 42, 114, 118); x.lineTo(114, 250); x.stroke();
      x.strokeStyle = '#c4ab82'; x.lineWidth = 3;
      x.beginPath(); x.moveTo(26, 250); x.lineTo(26, 126); x.quadraticCurveTo(26, 62, 64, 36); x.quadraticCurveTo(102, 62, 102, 126); x.lineTo(102, 250); x.stroke();
      // Radiant golden Nativity Star & organic Gothic rose tracery in the upper tympanum!
      x.fillStyle = '#f5c542';
      x.beginPath(); x.arc(64, 72, 14, 0, Math.PI * 2); x.fill();
      x.strokeStyle = '#efe2c8'; x.lineWidth = 3;
      for (let i = 0; i < 8; i++) {
        const a = (i / 8) * Math.PI * 2;
        x.beginPath(); x.moveTo(64, 72); x.lineTo(64 + Math.cos(a) * 26, 72 + Math.sin(a) * 26); x.stroke();
      }
      // Sculpted bronze portal leaves with organic vine relief at the bottom
      x.fillStyle = '#4e3c28'; x.fillRect(30, 148, 32, 102); x.fillRect(66, 148, 32, 102);
      x.strokeStyle = '#9e8254'; x.lineWidth = 2;
      x.strokeRect(32, 152, 28, 94); x.strokeRect(68, 152, 28, 94);
      return finTex(c, false);
    }
    const gaudiNativityMat = new T.MeshLambertMaterial({ map: makeGaudiNativityTex(), emissive: 0x100c08 });
    // Procedural Marianne Peretti Stained-Glass Canopy Texture for Cathedral of Brasília (vibrant cerulean, turquoise, emerald & radiant white!)
    function makeBrasiliaGlassTex() {
      const c = cvs(256, 256), x = c.getContext('2d');
      const g = x.createLinearGradient(0, 0, 0, 256);
      g.addColorStop(0.0, '#e0f2fe'); g.addColorStop(0.28, '#38bdf8');
      g.addColorStop(0.58, '#0284c7'); g.addColorStop(0.82, '#0d9488'); g.addColorStop(1.0, '#1e3a8a');
      x.fillStyle = g; x.fillRect(0, 0, 256, 256);
      // Marianne Peretti's iconic flowing abstract white & turquoise glass brushstrokes
      for (let i = 0; i < 18; i++) {
        x.fillStyle = i % 3 === 0 ? 'rgba(255,255,255,0.42)' : i % 3 === 1 ? 'rgba(125,211,252,0.45)' : 'rgba(45,212,191,0.35)';
        x.beginPath();
        x.ellipse((i * 37) % 256, 28 + ((i * 53) % 200), 16 + (i % 4) * 8, 42 + (i % 3) * 18, (i % 5 - 2) * 0.25, 0, Math.PI * 2);
        x.fill();
      }
      // Fine architectural glazing lead mullions
      x.strokeStyle = 'rgba(255,255,255,0.55)'; x.lineWidth = 2;
      for (let k = 0; k < 256; k += 32) { x.beginPath(); x.moveTo(k, 0); x.lineTo(k, 256); x.stroke(); }
      for (let k = 0; k < 256; k += 42) { x.beginPath(); x.moveTo(0, k); x.lineTo(256, k); x.stroke(); }
      return finTex(c, true);
    }
    const brasiliaGlassTex = makeBrasiliaGlassTex();
    brasiliaGlassTex.repeat.set(4, 1);
    const brasiliaGlassMat = new T.MeshPhongMaterial({
      map: brasiliaGlassTex, emissiveMap: brasiliaGlassTex, emissive: 0x38bdf8, emissiveIntensity: 0.32,
      specular: 0xffffff, shininess: 95, transparent: true, opacity: 0.78, side: T.DoubleSide
    });
    // Procedural 425-Pane Crystal Glass & Dark-Oak Mullion Grid for Thorncrown Chapel!
    function makeThorncrownGlassTex() {
      const c = cvs(256, 256), x = c.getContext('2d');
      x.fillStyle = 'rgba(210,238,255,0.22)'; x.fillRect(0, 0, 256, 256);
      x.strokeStyle = '#3b2414'; x.lineWidth = 5;
      for (let k = 0; k <= 256; k += 64) { x.beginPath(); x.moveTo(k, 0); x.lineTo(k, 256); x.stroke(); }
      x.lineWidth = 3;
      for (let k = 0; k <= 256; k += 42) { x.beginPath(); x.moveTo(0, k); x.lineTo(256, k); x.stroke(); }
      return finTex(c, true);
    }
    const thorncrownGlassTex = makeThorncrownGlassTex();
    thorncrownGlassTex.repeat.set(4, 2);
    const thorncrownGlassMat = new T.MeshPhongMaterial({
      map: thorncrownGlassTex, specular: 0xffffff, shininess: 110, transparent: true, opacity: 0.52, side: T.DoubleSide
    });
    const lancetBlueMat = new T.MeshLambertMaterial({ map: makeLancetGlassTex('#1d4ed8', '#7c3aed'), emissiveMap: makeLancetGlassTex('#1d4ed8', '#7c3aed'), emissive: 0xffffff, emissiveIntensity: 0.58, side: T.DoubleSide });
    const lancetWarmMat = new T.MeshLambertMaterial({ map: makeLancetGlassTex('#d97706', '#dc2626'), emissiveMap: makeLancetGlassTex('#d97706', '#dc2626'), emissive: 0xffffff, emissiveIntensity: 0.56, side: T.DoubleSide });
    const lancetEmeraldMat = new T.MeshLambertMaterial({ map: makeLancetGlassTex('#0284c7', '#10b981'), emissiveMap: makeLancetGlassTex('#0284c7', '#10b981'), emissive: 0xffffff, emissiveIntensity: 0.56, side: T.DoubleSide });
    const ronchampWallMat = new T.MeshLambertMaterial({ map: makeRonchampWallTex(), emissive: 0x1a1814 });

    // Soft additive-style Volumetric Colored Stained-Glass Sunbeam Texture (彩玻圣光束)
    function makeSunbeamTex(hexTop, hexMid) {
      const c = cvs(128, 256), x = c.getContext('2d');
      const g = x.createLinearGradient(0, 0, 0, 256);
      g.addColorStop(0.0, hexTop); g.addColorStop(0.55, hexMid); g.addColorStop(1.0, 'rgba(255,255,255,0)');
      x.fillStyle = g; x.fillRect(0, 0, 128, 256);
      // Soft horizontal edge fade
      const h = x.createLinearGradient(0, 0, 128, 0);
      h.addColorStop(0, 'rgba(0,0,0,1)'); h.addColorStop(0.22, 'rgba(0,0,0,0)'); h.addColorStop(0.78, 'rgba(0,0,0,0)'); h.addColorStop(1, 'rgba(0,0,0,1)');
      x.globalCompositeOperation = 'destination-out'; x.fillStyle = h; x.fillRect(0, 0, 128, 256);
      return finTex(c, false);
    }
    const sunbeamBlueMat = new T.MeshBasicMaterial({ map: makeSunbeamTex('rgba(125,211,252,0.34)', 'rgba(167,139,250,0.16)'), transparent: true, depthWrite: false, blending: T.AdditiveBlending, side: T.DoubleSide });
    const sunbeamGoldMat = new T.MeshBasicMaterial({ map: makeSunbeamTex('rgba(253,224,71,0.34)', 'rgba(251,146,60,0.16)'), transparent: true, depthWrite: false, blending: T.AdditiveBlending, side: T.DoubleSide });
    const sunbeamWhiteMat = new T.MeshBasicMaterial({ map: makeSunbeamTex('rgba(255,254,240,0.42)', 'rgba(255,250,225,0.18)'), transparent: true, depthWrite: false, blending: T.AdditiveBlending, side: T.DoubleSide });

    // Bernini's Golden Glory Stained Glass Window (St. Peter's Cathedra Petri Dove of the Holy Spirit)
    function makeBerniniGloryTex() {
      const c = cvs(256, 256), x = c.getContext('2d');
      const g = x.createRadialGradient(128, 128, 12, 128, 128, 126);
      g.addColorStop(0, '#fffbeb'); g.addColorStop(0.35, '#fde047'); g.addColorStop(0.75, '#d97706'); g.addColorStop(1, '#78350f');
      x.fillStyle = g; x.fillRect(0, 0, 256, 256);
      for (let i = 0; i < 24; i++) {
        const a = (i / 24) * Math.PI * 2;
        x.strokeStyle = 'rgba(255,250,210,0.65)'; x.lineWidth = i % 2 === 0 ? 4 : 2;
        x.beginPath(); x.moveTo(128, 128); x.lineTo(128 + Math.cos(a) * 124, 128 + Math.sin(a) * 124); x.stroke();
      }
      // White Dove of the Holy Spirit silhouette at center
      x.fillStyle = '#ffffff';
      x.beginPath(); x.ellipse(128, 128, 14, 24, 0, 0, Math.PI * 2); x.fill();
      x.beginPath(); x.ellipse(98, 122, 28, 11, -0.35, 0, Math.PI * 2); x.fill();
      x.beginPath(); x.ellipse(158, 122, 28, 11, 0.35, 0, Math.PI * 2); x.fill();
      return finTex(c, false);
    }
    const berniniGloryMat = new T.MeshLambertMaterial({ map: makeBerniniGloryTex(), emissiveMap: makeBerniniGloryTex(), emissive: 0xffe89a, emissiveIntensity: 0.72, side: T.DoubleSide });

    const mTrav = new Merger(), mWhite = new Merger(), mGothic = new Merger(), mLime = new Merger(), mSand = new Merger();
    const mBrick = new Merger(), mTerra = new Merger(), mTuscan = new Merger(), mSlate = new Merger(), mCopper = new Merger();
    const mGold = new Merger(), mBronze = new Merger(), mConc = new Merger(), mDarkConc = new Merger(), mPlaster = new Merger(), mTimber = new Merger();
    const mSilverPipe = new Merger(), mDarkOak = new Merger(), mFlame = new Merger(), mIvory = new Merger();
    const mOrangeLeaf = new Merger(), mOrangeFruit = new Merger(), mGaudi = new Merger();
    const swingingCensers = [];
    const skyClouds = [];

    // Helper: True Scale-Model Deeply Recessed Multi-Order Pointed Gothic Portal (2 stepped archivolts + colonnette jambs + crocketed Wimperg gable!)
    function addPointedGothicPortal(mgTrim, px, gy, zFace, pw, ph, isOpen) {
      const orders = 2;
      const archSpringY = gy + ph * 0.62;
      const archH = ph * 0.38;
      // Stepped receding pointed archivolts & jamb colonnettes
      for (let o = 0; o < orders; o++) {
        const inset = o * 0.36;
        const oz = zFace + (orders - 1 - o) * 0.28;
        const hw = Math.max(0.5, pw / 2 - inset);
        const ah = Math.max(0.6, archH - inset * 0.5);
        // Left & Right Jamb Colonnettes with Capitals
        mgTrim.add(cyl(0.11, 0.12, archSpringY - gy, 6), M(px - hw, gy + (archSpringY - gy) / 2, oz));
        mgTrim.add(cyl(0.11, 0.12, archSpringY - gy, 6), M(px + hw, gy + (archSpringY - gy) / 2, oz));
        box(mgTrim, 0.30, 0.18, 0.30, px - hw, archSpringY, oz);
        box(mgTrim, 0.30, 0.18, 0.30, px + hw, archSpringY, oz);
        // Pointed Gothic Archivolt Left & Right Curved Ribs (3 crisp segments each side!)
        for (const sd of [-1, 1]) {
          for (let s = 0; s < 3; s++) {
            const t0 = s / 3, t1 = (s + 1) / 3;
            const x0 = px + sd * hw * Math.cos(t0 * Math.PI * 0.5);
            const y0 = archSpringY + ah * Math.sin(t0 * Math.PI * 0.5) * (0.75 + 0.25 * t0);
            const x1 = px + sd * hw * Math.cos(t1 * Math.PI * 0.5);
            const y1 = archSpringY + ah * Math.sin(t1 * Math.PI * 0.5) * (0.75 + 0.25 * t1);
            addRibSeg(mgTrim, [x0, y0, oz], [x1, y1, oz], 0.12, 0.12);
          }
        }
      }
      // Steep Crocketed Triangular Gothic Wimperg Gable crowning the portal (outline ribs, NOT a solid flat triangle!)
      const gw = pw * 0.56, gh = ph * 0.52, gBase = archSpringY + 0.15, gz = zFace + orders * 0.28;
      addRibSeg(mgTrim, [px - gw, gBase, gz], [px, gBase + gh, gz], 0.16, 0.13);
      addRibSeg(mgTrim, [px + gw, gBase, gz], [px, gBase + gh, gz], 0.16, 0.13);
      // Chiseled stone crockets climbing both slopes of the Wimperg gable + finial spirelet
      for (let k = 1; k <= 2; k++) {
        const f = k / 3;
        box(mgTrim, 0.18, 0.18, 0.18, px - gw * (1 - f), gBase + gh * f + 0.16, gz);
        box(mgTrim, 0.18, 0.18, 0.18, px + gw * (1 - f), gBase + gh * f + 0.16, gz);
      }
      mgTrim.add(new T.ConeGeometry(0.16, 0.85, 4), M(px, gBase + gh + 0.45, gz));
      // Recessed dark tympanum & carved bronze doors on blind side portals
      if (!isOpen) {
        box(mDarkOak, pw * 0.68, ph * 0.62, 0.22, px, gy + ph * 0.31, zFace - 0.05);
        box(mBronze, pw * 0.30, ph * 0.55, 0.14, px - pw * 0.17, gy + ph * 0.28, zFace + 0.12);
        box(mBronze, pw * 0.30, ph * 0.55, 0.14, px + pw * 0.17, gy + ph * 0.28, zFace + 0.12);
      }
    }

    // Helper: Triple Deeply Recessed Multi-Order Pointed Gothic Portals across the west facade!
    function addTripleGothicPortals(mgTrim, cx, gy, zFace, spreadX) {
      addPointedGothicPortal(mgTrim, cx, gy, zFace, 4.4, 6.2, true);
      addPointedGothicPortal(mgTrim, cx - spreadX, gy, zFace, 3.6, 5.4, false);
      addPointedGothicPortal(mgTrim, cx + spreadX, gy, zFace, 3.6, 5.4, false);
    }

    // =========================================================================
    // 3D SCULPTED GRAND CATHEDRAL PIPE ORGAN (真实立体三塔式大管风琴 + 演奏台)
    // =========================================================================
    function addGrandPipeOrgan3D(ox, oy, oz, scale) {
      const sc = scale || 1.0;
      const baseH = 2.0 * sc;
      // 1. Carved Dark-Oak Lower Organ Case Pedestal & Gothic Paneling
      box(mDarkOak, 5.2 * sc, baseH, 1.35 * sc, ox, oy + baseH / 2, oz);
      box(mGold, 5.45 * sc, 0.14 * sc, 1.48 * sc, ox, oy + baseH + 0.06 * sc, oz);
      // 2. Three Sculpted Pipe Towers (Tall Central Tower + Twin Flanking Towers) + Connecting Flats
      const pipeY = oy + baseH + 0.14 * sc;
      const towers = [
        { dx: 0, tw: 1.45 * sc, th: 4.5 * sc, nPipes: 7, isGold: false },
        { dx: -1.95 * sc, tw: 1.15 * sc, th: 3.7 * sc, nPipes: 5, isGold: false },
        { dx: 1.95 * sc, tw: 1.15 * sc, th: 3.7 * sc, nPipes: 5, isGold: false }
      ];
      towers.forEach((tw) => {
        // Dark oak backing case & gilded cornice crown + finial pinnacle
        box(mDarkOak, tw.tw + 0.25 * sc, tw.th + 0.3 * sc, 1.1 * sc, ox + tw.dx, pipeY + tw.th / 2, oz - 0.18 * sc);
        box(mGold, tw.tw + 0.42 * sc, 0.20 * sc, 1.25 * sc, ox + tw.dx, pipeY + tw.th + 0.2 * sc, oz - 0.1 * sc);
        mGold.add(new T.ConeGeometry(0.22 * sc, 0.95 * sc, 6), M(ox + tw.dx, pipeY + tw.th + 0.78 * sc, oz + 0.05 * sc));
        // Real 3D Cylindrical Metallic Organ Pipes with Inverted Conical Pipe Feet!
        for (let i = 0; i < tw.nPipes; i++) {
          const u = (i / (tw.nPipes - 1)) * 2 - 1; // -1 .. +1
          const px = ox + tw.dx + u * (tw.tw * 0.42);
          const pH = tw.th * (0.94 - Math.abs(u) * 0.24);
          const rPipe = (0.095 - Math.abs(u) * 0.02) * sc;
          const pz = oz + (0.42 - Math.abs(u) * 0.14) * sc;
          const footH = 0.55 * sc;
          const bodyH = Math.max(0.6, pH - footH);
          const pM = (i === Math.floor(tw.nPipes / 2)) ? mGold : mSilverPipe;
          pM.add(cyl(rPipe, rPipe * 0.35, footH, 10), M(px, pipeY + footH / 2, pz));
          pM.add(cyl(rPipe, rPipe, bodyH, 10), M(px, pipeY + footH + bodyH / 2, pz));
        }
      });
      // Connecting Left & Right Pipe Flats (6 shorter shimmering pipes each!)
      for (const sd of [-1, 1]) {
        const fx = ox + sd * 1.04 * sc;
        box(mDarkOak, 0.88 * sc, 2.9 * sc, 0.92 * sc, fx, pipeY + 1.45 * sc, oz - 0.22 * sc);
        box(mGold, 0.95 * sc, 0.14 * sc, 1.0 * sc, fx, pipeY + 2.95 * sc, oz - 0.18 * sc);
        for (let k = 0; k < 5; k++) {
          const u = (k / 4) * 2 - 1;
          const px = fx + u * 0.34 * sc;
          const pH = (2.15 + Math.abs(u) * 0.55) * sc;
          mSilverPipe.add(cyl(0.055 * sc, 0.055 * sc, pH, 8), M(px, pipeY + pH / 2, oz + 0.24 * sc));
        }
      }
      // 3. 3D Organist Console (3 Tiered Ivory Manuals, Oak Desk & Bench!)
      const czC = oz + 1.15 * sc;
      box(mDarkOak, 1.85 * sc, 1.15 * sc, 0.72 * sc, ox, oy + 0.58 * sc, czC);
      for (let m = 0; m < 3; m++) {
        box(mIvory, 1.38 * sc, 0.05 * sc, 0.14 * sc, ox, oy + (0.86 + m * 0.09) * sc, czC + (0.28 - m * 0.08) * sc);
      }
      box(mGold, 0.65 * sc, 0.38 * sc, 0.04 * sc, ox, oy + 1.32 * sc, czC + 0.08 * sc, -0.28);
      box(mDarkOak, 1.45 * sc, 0.52 * sc, 0.36 * sc, ox, oy + 0.26 * sc, czC + 0.78 * sc);
    }

    // Helper: Add shared sacred interior (High Altar, Flickering Candelabras, 3D Grand Pipe Organ, Stained Glass & Volumetric Sunbeams!)
    function addSacredInterior(cx, gy, z0, z1, w, cat, isModern) {
      const altarZ = z0 + 3.6;
      // Stepped Sanctuary Dais & High Altar
      box(isModern ? mConc : mWhite, 6.2, 0.36, 4.0, cx, gy + 0.18, altarZ);
      box(isModern ? mTimber : mWhite, 3.0, 1.06, 1.15, cx, gy + 0.89, altarZ);
      box(mGold, 3.16, 0.08, 1.28, cx, gy + 1.46, altarZ);
      // Altar Cross + Twin 3D Golden Altar Candelabras with Glowing Candles!
      if (cat.id !== 'church_of_light') {
        box(mGold, 0.14, 1.85, 0.14, cx, gy + 2.40, altarZ - 0.32);
        box(mGold, 1.08, 0.14, 0.14, cx, gy + 2.82, altarZ - 0.32);
        for (const sd of [-1, 1]) {
          const lx = cx + sd * 1.18;
          mGold.add(cyl(0.04, 0.14, 0.65, 8), M(lx, gy + 1.82, altarZ));
          box(mGold, 0.56, 0.04, 0.04, lx, gy + 2.12, altarZ);
          for (const cd of [-0.22, 0, 0.22]) {
            mIvory.add(cyl(0.028, 0.028, 0.26, 6), M(lx + cd, gy + 2.27, altarZ));
            mFlame.add(new T.ConeGeometry(0.042, 0.14, 6), M(lx + cd, gy + 2.46, altarZ));
          }
        }
      }
      // Wooden Nave Pews on Left & Right of Central Aisle
      const zStart = Math.max(z0 + 7.4, z1 - 12);
      for (let pz = zStart; pz <= z1 - 4.6; pz += 2.2) {
        for (const sd of [-1, 1]) {
          box(mTimber, Math.min(3.4, w * 0.22), 0.55, 0.55, cx + sd * (Math.min(3.8, w * 0.26)), gy + 0.28, pz);
          box(mTimber, Math.min(3.4, w * 0.22), 0.48, 0.12, cx + sd * (Math.min(3.8, w * 0.26)), gy + 0.72, pz + 0.24);
        }
      }

      // 3D Sculpted Grand Pipe Organ in ALL 15 Catholic Cathedrals + Hallgrímskirkja!
      if (!isModern || cat.id === 'hallgrimskirkja') {
        const organScale = Math.min(1.15, Math.max(0.78, w / 16));
        addGrandPipeOrgan3D(cx, gy + 0.36, z0 + 1.45, organScale);
      }

      // Glowing Rear Apse Stained Glass Windows + Hanging Golden Nave Chandeliers + Volumetric Sunbeams (for Catholic Cathedrals!)
      if (!isModern) {
        const isWarm = cat.id === 'sagrada_familia' || cat.id === 'seville' || cat.id === 'santiago' || cat.id === 'st_marks';
        const isChartres = cat.id === 'chartres' || cat.id === 'sainte_chapelle' || cat.id === 'notre_dame';
        const glassL = cat.id === 'sagrada_familia' ? lancetWarmMat : (isChartres ? lancetBlueMat : (isWarm ? lancetWarmMat : lancetBlueMat));
        const glassR = cat.id === 'sagrada_familia' ? lancetEmeraldMat : (isWarm ? lancetWarmMat : lancetBlueMat);

        // St. Peter's Bernini Golden Dove Glory Window vs Triple Gothic Choir Lancets above the Pipe Organ!
        if (cat.id === 'st_peters') {
          addMesh(new T.CircleGeometry(2.4, 28), berniniGloryMat, cx, gy + 8.6, z0 + 1.05);
          mGold.add(torus(2.55, 0.18), M(cx, gy + 8.6, z0 + 1.08));
        } else {
          for (const dx of [-3.4, 0, 3.4]) {
            if (Math.abs(dx) > w * 0.36) continue;
            addMesh(new T.PlaneGeometry(1.75, 4.4), dx < 0 ? glassL : glassR, cx + dx, gy + 7.6, z0 + 1.05);
          }
        }

        // Hanging Golden Ring Chandeliers down the Central Nave!
        for (let czCh = z0 + 7.5; czCh <= z1 - 5.5; czCh += 5.8) {
          mGold.add(cyl(0.03, 0.03, 3.4, 6), M(cx, gy + 7.8, czCh));
          mGold.add(torus(1.25, 0.055), M(cx, gy + 6.1, czCh, Math.PI / 2));
          for (let ci = 0; ci < 8; ci++) {
            const ca = (ci / 8) * Math.PI * 2;
            mIvory.add(cyl(0.026, 0.026, 0.22, 6), M(cx + Math.cos(ca) * 1.25, gy + 6.24, czCh + Math.sin(ca) * 1.25));
            mFlame.add(new T.ConeGeometry(0.04, 0.13, 6), M(cx + Math.cos(ca) * 1.25, gy + 6.42, czCh + Math.sin(ca) * 1.25));
          }
        }

        // Soft Volumetric Colored Stained-Glass Sunbeam Shafts slanting down across the Nave!
        const beamMatL = isWarm ? sunbeamGoldMat : sunbeamBlueMat;
        const beamMatR = cat.id === 'sagrada_familia' ? sunbeamBlueMat : (isWarm ? sunbeamGoldMat : sunbeamBlueMat);
        for (let bz = z0 + 6.5; bz <= z1 - 5.5; bz += 6.2) {
          addMesh(new T.PlaneGeometry(2.6, 8.2), beamMatL, cx - w * 0.22, gy + 3.6, bz, 0, 0, -0.52);
          addMesh(new T.PlaneGeometry(2.6, 8.2), beamMatR, cx + w * 0.22, gy + 3.6, bz, 0, 0, 0.52);
        }
      }

      // Museum Architectural Encyclopedia Plaque mounted neatly on the Left Interior Wall
      const pTex = makeCathedralPlaqueTex(cat);
      const pMesh = addMesh(new T.PlaneGeometry(3.8, 2.08), new T.MeshLambertMaterial({ map: pTex, emissiveMap: pTex, emissive: 0xffffff, emissiveIntensity: 0.42, side: T.DoubleSide }), cx - (w / 2 - 1.05), gy + 2.55, (z0 + z1) / 2, 0, Math.PI / 2);
      pMesh.castShadow = false;
    }

    // Helper: Build Hollow Walkable Nave Walls WITH Side-Wall Stained Glass Lancet Windows & Interior Vault Ribs!
    function buildNaveShell(mgWall, mgTrim, mgRoof, cx, gy, cz, w, d, wallH, roofH, opts) {
      opts = opts || {};
      const x0 = cx - w / 2, x1 = cx + w / 2, z0 = cz - d / 2, z1 = cz + d / 2;
      const t = opts.t || 0.75;
      const doorW = opts.doorW || 4.2, doorH = opts.doorH || 4.8;
      // Front wall with entrance doorway + carved stone portal surround!
      const sideW = (w - doorW) / 2;
      box(mgWall, sideW, wallH, t, x0 + sideW / 2, gy + wallH / 2, z1 - t / 2);
      box(mgWall, sideW, wallH, t, x1 - sideW / 2, gy + wallH / 2, z1 - t / 2);
      box(mgWall, doorW, wallH - doorH, t, cx, gy + doorH + (wallH - doorH) / 2, z1 - t / 2);
      // Molded Portal Jambs, Open Swung-Back Carved Bronze Doors & Stepped Marble Threshold!
      box(mgTrim, 0.44, doorH + 0.35, t + 0.26, cx - doorW / 2 - 0.16, gy + (doorH + 0.35) / 2, z1 - t / 2 + 0.08);
      box(mgTrim, 0.44, doorH + 0.35, t + 0.26, cx + doorW / 2 + 0.16, gy + (doorH + 0.35) / 2, z1 - t / 2 + 0.08);
      box(mgTrim, doorW + 0.92, 0.40, t + 0.36, cx, gy + doorH + 0.18, z1 - t / 2 + 0.12);
      // Carved Bronze Double Doors swung gracefully open into the portal reveals
      for (const sd of [-1, 1]) {
        box(mBronze, 0.14, doorH - 0.2, 1.35, cx + sd * (doorW / 2 - 0.18), gy + (doorH - 0.2) / 2, z1 - t - 0.42, 0, sd * 0.22, 0);
      }
      // 2-Step Marble Entrance Threshold
      box(mWhite, doorW + 2.2, 0.18, 0.72, cx, gy + 0.09, z1 + 0.38);
      box(mWhite, doorW + 3.0, 0.10, 0.65, cx, gy + 0.05, z1 + 1.02);

      // Rear Wall (unless open for Church of the Light's luminous wall!)
      if (!opts.skipBack) box(mgWall, w, wallH, t, cx, gy + wallH / 2, z0 + t / 2);
      // Left & Right Side Walls + Rhythmic Luminous Stained-Glass Lancet Windows (both exterior & interior!)
      if (!opts.skipSides) {
        box(mgWall, t, wallH, d, x0 + t / 2, gy + wallH / 2, cz);
        box(mgWall, t, wallH, d, x1 - t / 2, gy + wallH / 2, cz);
        if (!opts.noSideGlass && wallH >= 8.5) {
          const winH = Math.min(5.2, wallH - 3.6);
          const winY = gy + 2.5 + winH / 2;
          const glassL = opts.glassL || lancetBlueMat;
          const glassR = opts.glassR || lancetBlueMat;
          for (let wz = z0 + 3.2; wz <= z1 - 3.6; wz += 4.2) {
            for (const sd of [-1, 1]) {
              const wxOut = (sd < 0 ? x0 - 0.06 : x1 + 0.06);
              const wxIn = (sd < 0 ? x0 + t + 0.06 : x1 - t - 0.06);
              const gMat = sd < 0 ? glassL : glassR;
              // Exterior & Interior glowing stained glass lancet panes + stone tracery mullion
              addMesh(new T.PlaneGeometry(1.75, winH), gMat, wxOut, winY, wz, 0, sd * Math.PI / 2);
              addMesh(new T.PlaneGeometry(1.75, winH), gMat, wxIn, winY, wz, 0, -sd * Math.PI / 2);
              box(mgTrim, 0.16, winH + 0.35, 0.16, wxOut, winY, wz);
              box(mgTrim, 0.22, 0.22, 2.05, wxOut, winY - winH / 2 - 0.1, wz);
              box(mgTrim, 0.22, 0.24, 2.05, wxOut, winY + winH / 2 + 0.1, wz);
            }
            // Interior Transverse & Diagonal X-Rib Gothic Groin Vaulting + Gilded Central Boss Medallion!
            box(mgTrim, w - t * 2, 0.38, 0.36, cx, gy + wallH - 0.22, wz);
            if (wz + 4.2 <= z1 - 3.0) {
              const spanW = w - t * 2 - 0.4, diagL = Math.hypot(spanW, 4.2), diagAng = Math.atan2(4.2, spanW);
              box(mgTrim, diagL, 0.24, 0.24, cx, gy + wallH - 0.18, wz + 2.1, 0, diagAng, 0);
              box(mgTrim, diagL, 0.24, 0.24, cx, gy + wallH - 0.18, wz + 2.1, 0, -diagAng, 0);
              mGold.add(sph(0.28), M(cx, gy + wallH - 0.28, wz + 2.1));
            }
          }
        }
      }
      // Upper Cornice
      box(mgTrim, w + 0.7, 0.42, d + 0.7, cx, gy + wallH + 0.15, cz);
      // Pitched Roof (if roofH > 0)
      if (roofH > 0 && mgRoof) {
        const half = w / 2 + 0.55;
        const slopeL = Math.hypot(half, roofH);
        const ang = Math.atan2(roofH, half);
        for (const sd of [-1, 1]) {
          box(mgRoof, slopeL, 0.28, d + 0.9, cx + sd * (half / 2), gy + wallH + roofH / 2 + 0.2, cz, 0, 0, -sd * ang);
        }
        // Front & Back Triangular Gables (optionally skip front gable for flat-gallery Gothic facades like Notre-Dame!)
        const gs = new T.Shape(); gs.moveTo(-w / 2, 0); gs.lineTo(w / 2, 0); gs.lineTo(0, roofH); gs.closePath();
        const gGeo = new T.ExtrudeGeometry(gs, { depth: t, bevelEnabled: false });
        if (!opts.skipFrontGable) mgWall.add(gGeo, M(cx, gy + wallH + 0.1, z1 - t));
        mgWall.add(gGeo, M(cx, gy + wallH + 0.1, z0));
      }
    }

    // Vector-aligned smooth architectural rib segment helper (5-sided crisp stone rib, fast GPU batching!)
    const _upV = new T.Vector3(0, 1, 0);
    function addRibSeg(mg, a, b, r0, r1) {
      const va = new T.Vector3(a[0], a[1], a[2]), vb = new T.Vector3(b[0], b[1], b[2]);
      const d = vb.clone().sub(va), L = d.length(); if (L < 1e-4) return;
      const q = new T.Quaternion().setFromUnitVectors(_upV, d.normalize());
      mg.add(new T.CylinderGeometry(r1 == null ? r0 : r1, r0, L * 1.04, 5), new T.Matrix4().compose(va.clone().add(vb).multiplyScalar(0.5), q, new T.Vector3(1, 1, 1)));
    }

    // Helper: True Scale-Model Cruciform Transept Arms + Polygonal Apse Chevet (transforms boxes into Latin-Cross cathedrals!)
    function addTranseptAndApse(mgWall, mgTrim, mgRoof, cx, gy, cz, naveW, naveD, wallH, roofH, opts) {
      opts = opts || {};
      const trW = opts.transeptW || 8.5, trSpan = naveW + (opts.transeptOut || 7.0);
      const trZ = cz - naveD * 0.14;
      const trH = wallH * 0.96, trRoofH = roofH * 0.95;
      // Projecting Left & Right Transept Wings
      for (const sd of [-1, 1]) {
        const wingLen = (trSpan - naveW) / 2;
        const wx = cx + sd * (naveW / 2 + wingLen / 2);
        box(mgWall, wingLen, trH, trW, wx, gy + trH / 2, trZ);
        box(mgTrim, wingLen + 0.4, 0.36, trW + 0.5, wx, gy + trH + 0.12, trZ);
        // Transept end corner buttresses + rose window!
        const endX = cx + sd * (naveW / 2 + wingLen);
        for (const tz of [-trW / 2, trW / 2]) {
          box(mgTrim, 0.55, trH + 0.8, 0.55, endX, gy + trH / 2, trZ + tz);
          mgTrim.add(new T.ConeGeometry(0.32, 1.8, 6), M(endX, gy + trH + 1.3, trZ + tz));
        }
        if (opts.transeptRose !== false) {
          addMesh(new T.CircleGeometry(Math.min(2.3, trW * 0.28), 24), opts.roseMat || roseMatGothic, endX + sd * 0.08, gy + trH * 0.66, trZ, 0, sd * Math.PI / 2);
        }
        // Pitched Transept Roof running East-West!
        if (trRoofH > 0 && mgRoof) {
          const half = trW / 2 + 0.4, slopeL = Math.hypot(half, trRoofH), ang = Math.atan2(trRoofH, half);
          for (const zs of [-1, 1]) {
            box(mgRoof, wingLen + 0.5, 0.26, slopeL, wx, gy + trH + trRoofH / 2 + 0.15, trZ + zs * (half / 2), zs * ang, 0, 0);
          }
          const gs = new T.Shape(); gs.moveTo(-trW / 2, 0); gs.lineTo(trW / 2, 0); gs.lineTo(0, trRoofH); gs.closePath();
          mgWall.add(new T.ExtrudeGeometry(gs, { depth: 0.5, bevelEnabled: false }), M(endX - sd * 0.25, gy + trH + 0.08, trZ, 0, Math.PI / 2, 0));
        }
      }
      // Stepped Side Aisle Lean-To Roofs (adds authentic 2-tier basilica cross-section!)
      if (opts.sideAisles !== false && mgRoof) {
        const aisleH = wallH * 0.54, aisleW = 2.6;
        for (const sd of [-1, 1]) {
          const ax = cx + sd * (naveW / 2 + aisleW / 2);
          box(mgWall, aisleW, aisleH, naveD * 0.86, ax, gy + aisleH / 2, cz);
          box(mgRoof, aisleW + 0.5, 0.22, naveD * 0.88, ax, gy + aisleH + 0.55, cz, 0, 0, -sd * 0.36);
        }
      }
      // Polygonal Semicircular Choir Apse Chevet at the Rear (North) End!
      const apseR = Math.min(naveW * 0.44, 6.2), apseZ = cz - naveD / 2 - apseR * 0.22;
      mgWall.add(cyl(apseR, apseR * 1.03, trH * 0.94, 8), M(cx, gy + trH * 0.47, apseZ));
      if (mgRoof) mgRoof.add(new T.ConeGeometry(apseR * 1.08, trRoofH * 0.95 + 1.2, 8), M(cx, gy + trH * 0.94 + (trRoofH * 0.95 + 1.2) / 2, apseZ));
      // 3 Radiating Ambulatory Chapels around the Chevet!
      for (const a of [-Math.PI * 0.72, -Math.PI * 0.5, -Math.PI * 0.28]) {
        const chx = cx + Math.cos(a) * (apseR + 0.9), chz = apseZ + Math.sin(a) * (apseR + 0.9);
        mgWall.add(cyl(1.85, 1.92, wallH * 0.52, 8), M(chx, gy + wallH * 0.26, chz));
        if (mgRoof) mgRoof.add(new T.ConeGeometry(2.05, 1.8, 8), M(chx, gy + wallH * 0.52 + 0.9, chz));
      }
    }

    // Helper: Museum Scale-Model Ribbed Dome (paired Corinthian drum columns + arched drum windows + colonnaded flying-buttress lantern!)
    function addRibbedDome(mgDome, mgRib, cx, yBase, cz, r, hScale, ribs, drumH, lanternH, isOctagonal) {
      const segs = isOctagonal ? 8 : 16;
      // Drum Base Plinth & Main Tambour Drum
      mgRib.add(cyl(r * 1.04, r * 1.07, drumH, segs), M(cx, yBase + drumH / 2, cz));
      mgRib.add(cyl(r * 1.14, r * 1.14, 0.44, segs), M(cx, yBase + drumH + 0.22, cz));
      // Paired Classical Columns / Buttress Piers & Recessed Dark Drum Windows around the Tambour!
      const nBays = isOctagonal ? 8 : Math.min(12, Math.max(8, ribs));
      for (let i = 0; i < nBays; i++) {
        const a = (i / nBays) * Math.PI * 2 + (isOctagonal ? Math.PI / 8 : 0);
        const aMid = a + Math.PI / nBays;
        const pR = r * 1.09;
        if (!isOctagonal && r >= 5.0) {
          for (const da of [-0.045, 0.045]) {
            mgRib.add(cyl(0.22, 0.25, drumH * 0.88, 6), M(cx + Math.cos(a + da) * pR, yBase + drumH * 0.5, cz + Math.sin(a + da) * pR));
          }
        } else {
          mgRib.add(cyl(0.24, 0.28, drumH * 0.92, 6), M(cx + Math.cos(a) * pR, yBase + drumH * 0.5, cz + Math.sin(a) * pR));
        }
        const wR = r * 1.055;
        if (isOctagonal) {
          mDarkConc.add(cyl(drumH * 0.24, drumH * 0.24, 0.22, 8), M(cx + Math.cos(aMid) * wR, yBase + drumH * 0.54, cz + Math.sin(aMid) * wR, 0, -aMid, Math.PI / 2));
        } else if (drumH >= 2.4) {
          box(mDarkConc, 0.16, drumH * 0.56, r * 0.20, cx + Math.cos(aMid) * wR, yBase + drumH * 0.52, cz + Math.sin(aMid) * wR, 0, -aMid, 0);
        }
      }
      // Smooth Double-Curved Dome Shell
      const domeY = yBase + drumH + 0.35;
      const pts = [];
      for (let i = 0; i <= 10; i++) {
        const a = (i / 10) * (Math.PI / 2);
        pts.push(new T.Vector2(Math.cos(a) * r, Math.sin(a) * r * hScale));
      }
      mgDome.add(new T.LatheGeometry(pts, segs), M(cx, domeY, cz));
      // Smooth Continuous Meridian Stone Ribs hugging the Dome from Drum to Lantern!
      for (let i = 0; i < ribs; i++) {
        const a = (i / ribs) * Math.PI * 2 + (isOctagonal ? Math.PI / 8 : 0);
        for (let k = 0; k < 6; k++) {
          const t0 = (k / 6) * (Math.PI / 2), t1 = ((k + 1) / 6) * (Math.PI / 2);
          const rr = r + 0.14;
          const p0 = [cx + Math.cos(a) * Math.cos(t0) * rr, domeY + Math.sin(t0) * r * hScale, cz + Math.sin(a) * Math.cos(t0) * rr];
          const p1 = [cx + Math.cos(a) * Math.cos(t1) * rr, domeY + Math.sin(t1) * r * hScale, cz + Math.sin(a) * Math.cos(t1) * rr];
          addRibSeg(mgRib, p0, p1, 0.21, 0.16);
        }
      }
      // Colonnaded Classical Lantern with Mini Flying Buttresses + Fluted Cupola + Golden Orb & Cross!
      const ly = domeY + r * hScale;
      const lR = r * 0.25;
      mgRib.add(cyl(lR * 0.85, lR * 0.92, lanternH, 8), M(cx, ly + lanternH / 2, cz));
      mgRib.add(cyl(lR * 1.18, lR * 1.18, 0.28, 8), M(cx, ly + lanternH, cz));
      for (let i = 0; i < 6; i++) {
        const a = (i / 6) * Math.PI * 2;
        mgRib.add(cyl(0.09, 0.11, lanternH, 5), M(cx + Math.cos(a) * (lR * 1.08), ly + lanternH / 2, cz + Math.sin(a) * (lR * 1.08)));
        if (r >= 5.5) {
          addRibSeg(mgRib, [cx + Math.cos(a) * (lR * 1.55), ly - 0.15, cz + Math.sin(a) * (lR * 1.55)], [cx + Math.cos(a) * (lR * 1.05), ly + lanternH * 0.72, cz + Math.sin(a) * (lR * 1.05)], 0.12, 0.08);
        }
      }
      mgRib.add(new T.ConeGeometry(lR * 1.05, lanternH * 0.85, 8), M(cx, ly + lanternH + lanternH * 0.42, cz));
      const cyTop = ly + lanternH * 1.88;
      mGold.add(sph(0.32), M(cx, cyTop, cz));
      box(mGold, 0.14, 1.9, 0.14, cx, cyTop + 1.1, cz);
      box(mGold, 1.05, 0.14, 0.14, cx, cyTop + 1.45, cz);
    }

    // Helper: Museum Scale-Model Multi-Stage Gothic Tower with Pierced Openwork Ribbed Spire (GPU-efficient!)
    function addGothicTower(mgWall, mgTrim, px, gy, pz, w, shaftH, spireH, flatTop) {
      // 2-Stage Stepped Tower Shaft (tapering upper belfry for authentic scale-model proportion!)
      const h1 = shaftH * 0.56, h2 = shaftH * 0.44;
      box(mgWall, w, h1, w, px, gy + h1 / 2, pz);
      box(mgWall, w * 0.90, h2, w * 0.90, px, gy + h1 + h2 / 2, pz);
      // Stepped Projecting Corner Buttress Piers ending in 4-sided Stone Pinnacles!
      for (const sx of [-1, 1]) for (const sz of [-1, 1]) {
        box(mgTrim, 0.54, h1 + 0.3, 0.54, px + sx * (w * 0.50), gy + h1 / 2, pz + sz * (w * 0.50));
        box(mgTrim, 0.42, h2 + 0.3, 0.42, px + sx * (w * 0.45), gy + h1 + h2 / 2, pz + sz * (w * 0.45));
        mgTrim.add(new T.ConeGeometry(0.24, 1.4, 4), M(px + sx * (w * 0.52), gy + h1 + 0.8, pz + sz * (w * 0.52)));
      }
      // Molded Horizontal Stringcourses & Cornices
      for (const ch of [h1 * 0.55, h1, shaftH]) {
        const cw = ch <= h1 ? w + 0.60 : w + 0.38;
        box(mgTrim, cw, 0.36, cw, px, gy + ch, pz);
      }
      // Paired Pointed-Arch Belfry Louver Lancets on Front, Left & Right Sides (with central stone mullions!)
      const belfryY = gy + h1 + h2 * 0.54;
      const belfryH = Math.max(2.6, h2 * 0.72);
      const halfTop = w * 0.45 + 0.05;
      for (const side of [0, 1, 3]) {
        const ang = side * Math.PI / 2;
        const nx = Math.sin(ang), nz = Math.cos(ang), tx = Math.cos(ang), tz = -Math.sin(ang);
        for (const off of [-w * 0.19, w * 0.19]) {
          const lx = px + nx * halfTop + tx * off, lz = pz + nz * halfTop + tz * off;
          box(mDarkConc, w * 0.24, belfryH, 0.16, lx, belfryY, lz, 0, ang, 0);
          box(mgTrim, 0.08, belfryH, 0.22, lx, belfryY, lz, 0, ang, 0);
        }
      }
      if (!flatTop && spireH > 0) {
        // TRUE PIERCED OCTAGONAL OPENWORK GOTHIC SPIRE (8 ribs + chiseled box crockets + octagonal tracery bands + 4 corner spirelets!)
        const spBaseY = gy + shaftH + 0.15;
        const baseR = w * 0.44;
        mgWall.add(new T.ConeGeometry(baseR * 0.78, spireH * 0.92, 8), M(px, spBaseY + spireH * 0.46, pz));
        for (let i = 0; i < 8; i++) {
          const a = (i / 8) * Math.PI * 2 + Math.PI / 8;
          addRibSeg(mgTrim, [px + Math.cos(a) * baseR, spBaseY, pz + Math.sin(a) * baseR], [px, spBaseY + spireH, pz], 0.16, 0.08);
          if (i % 2 === 0) {
            for (const f of [0.28, 0.55, 0.78]) {
              box(mgTrim, 0.18, 0.18, 0.18, px + Math.cos(a) * baseR * (1 - f) * 1.06, spBaseY + spireH * f, pz + Math.sin(a) * baseR * (1 - f) * 1.06);
            }
          }
        }
        // 3 Horizontal Octagonal Stone Tracery Bands (fast 8-sided rings!)
        for (const f of [0.24, 0.52, 0.76]) {
          const br = baseR * (1 - f) * 1.05;
          mgTrim.add(cyl(br, br, 0.18, 8), M(px, spBaseY + spireH * f, pz));
        }
        // 4 Tall Flanking Corner Pinnacle Spirelets framing the Octagonal Transition!
        for (const sx of [-1, 1]) for (const sz of [-1, 1]) {
          const cxp = px + sx * (w * 0.42), czp = pz + sz * (w * 0.42);
          box(mgTrim, 0.46, 1.5, 0.46, cxp, spBaseY + 0.75, czp);
          mgTrim.add(new T.ConeGeometry(0.32, 3.0, 4), M(cxp, spBaseY + 3.0, czp));
        }
        box(mGold, 0.12, 1.7, 0.12, px, spBaseY + spireH + 0.95, pz);
        box(mGold, 0.90, 0.12, 0.12, px, spBaseY + spireH + 1.3, pz);
      } else {
        // Gothic Openwork Parapet Balustrade & Corner Pinnacles (Notre-Dame / Reims / Giotto Campanile!)
        box(mgTrim, w + 0.52, 0.42, w + 0.52, px, gy + shaftH + 0.21, pz);
        for (const sx of [-1, 1]) for (const sz of [-1, 1]) {
          mgTrim.add(new T.ConeGeometry(0.28, 1.5, 4), M(px + sx * (w * 0.46), gy + shaftH + 1.1, pz + sz * (w * 0.46)));
        }
        for (let k = -2; k <= 2; k++) {
          box(mgTrim, 0.20, 0.85, 0.20, px + k * (w * 0.20), gy + shaftH + 0.72, pz + w * 0.46);
          box(mgTrim, 0.20, 0.85, 0.20, px + k * (w * 0.20), gy + shaftH + 0.72, pz - w * 0.46);
        }
      }
    }

    // Helper: Flying Buttresses along both flanks of a Gothic Cathedral
    function addFlyingButtresses(mg, cx, gy, cz, halfW, d, wallH, count) {
      for (let i = 0; i < count; i++) {
        const bz = cz - d * 0.38 + (i / Math.max(1, count - 1)) * (d * 0.76);
        for (const sd of [-1, 1]) {
          // Outer buttress pier + crocketed pinnacle
          box(mg, 0.95, wallH * 0.80, 0.95, cx + sd * (halfW + 2.6), gy + wallH * 0.40, bz);
          mg.add(new T.ConeGeometry(0.42, 2.6, 6), M(cx + sd * (halfW + 2.6), gy + wallH * 0.80 + 1.3, bz));
          // Upper & lower curved/angled double-tier stone flyer arches!
          box(mg, 2.9, 0.44, 0.46, cx + sd * (halfW + 1.3), gy + wallH * 0.78, bz, 0, 0, -sd * 0.42);
          box(mg, 2.9, 0.38, 0.42, cx + sd * (halfW + 1.3), gy + wallH * 0.56, bz, 0, 0, -sd * 0.36);
        }
      }
    }

    // Helper: Museum Architectural Scale-Model Brass-and-Marble Plaza Plinth Plaque
    // (Placed cleanly on the right-front plaza edge so the historical cathedral facade stays 100% pure & unmarred!)
    function addCathedralFascia(cx, y, z, text, w) {
      const c = cvs(640, 128), x = c.getContext('2d');
      x.fillStyle = '#181410'; x.fillRect(0, 0, 640, 128);
      x.strokeStyle = '#d4a64a'; x.lineWidth = 5; x.strokeRect(8, 8, 624, 112);
      x.strokeStyle = 'rgba(212,166,74,0.35)'; x.lineWidth = 2; x.strokeRect(16, 16, 608, 96);
      const parts = text.split('·').map((s) => s.trim());
      x.fillStyle = '#f8e6b4'; x.font = '800 32px "Songti SC", Georgia, serif';
      x.textAlign = 'center'; x.textBaseline = 'middle';
      x.fillText(parts[1] || parts[0], 320, 48);
      if (parts[1]) {
        x.fillStyle = '#cbd5e1'; x.font = '600 18px Georgia, serif';
        x.fillText(parts[0], 320, 90);
      }
      const tex = finTex(c, false);
      const px = cx + 6.4, pz = z + 4.4;
      // Sleek carved marble museum pedestal + angled engraved bronze plaque
      const baseY = Math.floor(y - 4.5); // approximate ground offset — overridden below if site ground is known
      // Actually place relative to site ground via currentSiteGy!
      const gySite = currentSiteGy;
      box(mTrav, 2.1, 0.95, 0.72, px, gySite + 0.48, pz);
      box(mGold, 2.25, 0.08, 0.82, px, gySite + 0.98, pz);
      addMesh(new T.PlaneGeometry(2.15, 0.56), new T.MeshLambertMaterial({ map: tex, emissiveMap: tex, emissive: 0xffe4a0, emissiveIntensity: 0.35 }), px, gySite + 1.24, pz + 0.16, -0.45, 0, 0);
    }
    let currentSiteGy = 40;

    /* ============================================================================
     * BUILD ALL 20 ICONIC WORLD CATHEDRALS (15 CATHOLIC + 5 MODERN)
     * ============================================================================ */
    (P.cathedralSites || []).forEach((site) => {
      const { x: cx, y: gy, z: cz, x0, z0, x1, z1, cat } = site;
      currentSiteGy = gy;
      const w = x1 - x0, d = z1 - z0;
      const id = cat.id;

      // 1. ST. PETER'S BASILICA (Vatican) — True Scale Model: Cruciform Basilica + Maderno Portico Facade + Paired-Column Ribbed Dome + Continuous Sweeping Bernini Colonnade!
      if (id === 'st_peters') {
        buildNaveShell(mTrav, mWhite, mSlate, cx, gy, cz, 22, 24, 12.5, 3.2, { doorW: 5.2, doorH: 6.2 });
        addTranseptAndApse(mTrav, mWhite, mSlate, cx, gy, cz, 22, 24, 12.5, 3.2, { transeptW: 10.5, transeptOut: 8.5, transeptRose: false });
        // Monumental Maderno Corinthian Giant-Order Facade (27.6m wide, recessed portico arches + pedimented bay windows!)
        box(mTrav, 10.8, 13.0, 2.2, cx - 8.1, gy + 6.5, cz + 12.2);
        box(mTrav, 10.8, 13.0, 2.2, cx + 8.1, gy + 6.5, cz + 12.2);
        box(mTrav, 5.4, 6.8, 2.2, cx, gy + 9.6, cz + 12.2);
        // 8 Giant Corinthian Columns with Pedestal Plinths & Ornate Capitals across the front
        for (const dx of [-11.5, -8.5, -5.5, -2.8, 2.8, 5.5, 8.5, 11.5]) {
          box(mTrav, 1.35, 1.1, 1.35, cx + dx, gy + 0.55, cz + 13.5);
          mWhite.add(cyl(0.50, 0.56, 10.6, 14), M(cx + dx, gy + 6.3, cz + 13.5));
          box(mWhite, 1.48, 0.55, 1.48, cx + dx, gy + 11.75, cz + 13.5);
        }
        // Recessed Lower Portico Arches & Upper Pedimented Baroque Windows in every intercolumniation bay!
        for (const bx of [-10.0, -7.0, -4.15, 4.15, 7.0, 10.0]) {
          box(mDarkOak, 1.65, 3.8, 0.22, cx + bx, gy + 2.0, cz + 13.3);
          mWhite.add(new T.TorusGeometry(0.84, 0.14, 6, 14, Math.PI), M(cx + bx, gy + 3.9, cz + 13.38));
          // Upper Loggia Window with Classical Triangular Pediment
          box(mDarkConc, 1.25, 2.2, 0.18, cx + bx, gy + 8.2, cz + 13.34);
          box(mWhite, 1.55, 0.22, 0.28, cx + bx, gy + 9.42, cz + 13.4);
          box(mWhite, 1.55, 0.20, 0.26, cx + bx, gy + 7.0, cz + 13.4);
        }
        // Molded Main Entablature Cornice running cleanly across the facade!
        box(mWhite, 28.4, 0.65, 1.9, cx, gy + 12.35, cz + 13.2);
        // Central Classical Pediment + Attic + 13 Rooftop Apostle Statues + Valadier Twin Corner Clocks!
        const ps = new T.Shape(); ps.moveTo(-7.2, 0); ps.lineTo(7.2, 0); ps.lineTo(0, 2.8); ps.closePath();
        mTrav.add(new T.ExtrudeGeometry(ps, { depth: 1.4, bevelEnabled: false }), M(cx, gy + 13.2, cz + 12.4));
        box(mWhite, 27.6, 1.8, 1.4, cx, gy + 14.0, cz + 12.8);
        for (let k = -6; k <= 6; k++) {
          mWhite.add(cyl(0.22, 0.28, 1.9, 8), M(cx + k * 2.0, gy + 15.8, cz + 13.1));
          mWhite.add(sph(0.22), M(cx + k * 2.0, gy + 16.9, cz + 13.1));
        }
        // Valadier's Iconic Twin Corner Clocks flanking the Attic!
        for (const sd of [-1, 1]) {
          const clkX = cx + sd * 12.6;
          box(mTrav, 2.2, 2.4, 1.4, clkX, gy + 15.6, cz + 12.8);
          mGold.add(new T.TorusGeometry(0.75, 0.12, 8, 18), M(clkX, gy + 15.6, cz + 13.55));
          addMesh(new T.CircleGeometry(0.68, 18), whitePlasterMat, clkX, gy + 15.6, cz + 13.53);
          box(mDarkOak, 0.08, 0.45, 0.06, clkX, gy + 15.78, cz + 13.58);
          box(mDarkOak, 0.36, 0.08, 0.06, clkX + 0.14, gy + 15.6, cz + 13.58);
        }
        // Central Loggia of the Blessings (Papal Balcony above the main portal)
        box(mWhite, 3.8, 0.4, 1.1, cx, gy + 7.2, cz + 13.45);
        mGold.add(new T.TorusGeometry(1.15, 0.14, 8, 18, Math.PI), M(cx, gy + 9.2, cz + 13.4));
        addCathedralFascia(cx, gy + 12.35, cz + 13.45, 'BASILICA SANCTI PETRI  ·  圣彼得大教堂', 11.5);
        // Michelangelo's Colossal 16-Ribbed Dome + Twin Flanking Satellite Domes (Gregoriana & Clementina)!
        addRibbedDome(mSlate, mTrav, cx, gy + 12.5, cz - 1.5, 8.2, 1.25, 16, 5.5, 3.8, false);
        addRibbedDome(mSlate, mTrav, cx - 8.2, gy + 12.2, cz + 4.0, 3.0, 1.22, 8, 2.0, 1.6, false);
        addRibbedDome(mSlate, mTrav, cx + 8.2, gy + 12.2, cz + 4.0, 3.0, 1.22, 8, 2.0, 1.6, false);
        // Bernini's Iconic Semicircular 3-Row Colonnade Arms with Smooth Continuous Curved Entablature & Rooftop Saints!
        const colPts = [];
        for (let i = 0; i <= 24; i++) {
          const a = -0.14 + (i / 24) * (Math.PI + 0.28);
          if (Math.abs(a - Math.PI / 2) < 0.26) { colPts.push(null); continue; }
          const ox = cx + Math.cos(a) * 18.8, oz = cz + 21.5 + Math.sin(a) * 11.2;
          const mx = cx + Math.cos(a) * 17.5, mz = cz + 21.5 + Math.sin(a) * 10.3;
          const ix = cx + Math.cos(a) * 16.2, iz = cz + 21.5 + Math.sin(a) * 9.4;
          colPts.push({ ox, oz, mx, mz, ix, iz });
          mTrav.add(cyl(0.32, 0.36, 6.2, 10), M(ox, gy + 3.1, oz));
          mTrav.add(cyl(0.32, 0.36, 6.2, 10), M(ix, gy + 3.1, iz));
          // Rooftop Saint Statue crowning Bernini's Colonnade!
          if (i % 2 === 0) {
            mWhite.add(cyl(0.15, 0.20, 1.5, 8), M(ix, gy + 7.6, iz));
            mWhite.add(sph(0.16), M(ix, gy + 8.5, iz));
          }
        }
        // Connect adjacent colonnade columns with smooth curved continuous stone entablature beams!
        for (let i = 0; i < colPts.length - 1; i++) {
          const p0 = colPts[i], p1 = colPts[i + 1];
          if (!p0 || !p1) continue;
          const dx = p1.mx - p0.mx, dz = p1.mz - p0.mz, segL = Math.hypot(dx, dz) + 0.35;
          const yaw = Math.atan2(dx, dz);
          box(mTrav, 3.2, 0.85, segL, (p0.mx + p1.mx) / 2, gy + 6.55, (p0.mz + p1.mz) / 2, 0, yaw, 0);
          box(mWhite, 3.45, 0.26, segL, (p0.mx + p1.mx) / 2, gy + 7.05, (p0.mz + p1.mz) / 2, 0, yaw, 0);
        }
        // White Travertine Compass-Rose Paving Rays radiating from the Vatican Obelisk!
        for (let r = 0; r < 8; r++) {
          const ang = (r / 8) * Math.PI;
          box(mWhite, 22.0, 0.04, 0.38, cx, gy + 0.02, cz + 23.5, 0, ang, 0);
        }
        // Central Vatican Egyptian Obelisk + Bernini's Twin Sculpted Baroque Marble Fountains in St. Peter's Square!
        box(mWhite, 2.2, 1.4, 2.2, cx, gy + 0.7, cz + 23.5);
        mTrav.add(cyl(0.32, 0.68, 9.5, 4), M(cx, gy + 6.1, cz + 23.5, 0, Math.PI / 4, 0));
        mGold.add(new T.ConeGeometry(0.34, 0.9, 4), M(cx, gy + 11.3, cz + 23.5, 0, Math.PI / 4, 0));
        for (const fx of [-10.2, 10.2]) {
          const bx = cx + fx, bz = cz + 23.2;
          mWhite.add(cyl(2.6, 2.8, 0.55, 16), M(bx, gy + 0.28, bz));
          addMesh(new T.CircleGeometry(2.35, 16), blueGlassMat, bx, gy + 0.58, bz, -Math.PI / 2);
          mWhite.add(cyl(0.45, 0.62, 1.35, 12), M(bx, gy + 1.15, bz));
          mWhite.add(cyl(1.45, 0.55, 0.36, 14), M(bx, gy + 1.92, bz));
          mWhite.add(cyl(0.22, 0.34, 0.85, 10), M(bx, gy + 2.48, bz));
          addMesh(new T.ConeGeometry(0.48, 1.05, 10), clearGlassMat, bx, gy + 3.25, bz);
        }
        // Bernini's Interior Twisted Bronze Baldacchino over the High Altar!
        for (const sx of [-1.8, 1.8]) for (const sz of [-1.8, 1.8]) {
          mBronze.add(cyl(0.22, 0.26, 7.2, 10), M(cx + sx, gy + 3.6, cz - 1.5 + sz));
        }
        box(mBronze, 4.4, 0.7, 4.4, cx, gy + 7.4, cz - 1.5);
        mGold.add(sph(0.42), M(cx, gy + 8.6, cz - 1.5));
        // Michelangelo's Pietà White-Marble Chapel Niche in the Right Aisle!
        const px = cx + 7.6, pz = cz + 4.2;
        box(mTrav, 3.2, 1.15, 1.6, px, gy + 0.58, pz);
        mWhite.add(cyl(0.18, 0.22, 4.2, 10), M(px - 1.45, gy + 2.1, pz + 0.6));
        mWhite.add(cyl(0.18, 0.22, 4.2, 10), M(px + 1.45, gy + 2.1, pz + 0.6));
        box(mGold, 3.3, 0.22, 1.4, px, gy + 4.3, pz + 0.2);
        // Sculpted White Carrara Marble Pietà composition
        mWhite.add(new T.ConeGeometry(0.68, 1.65, 12), M(px, gy + 1.98, pz));
        mWhite.add(sph(0.24), M(px - 0.05, gy + 2.86, pz + 0.08));
        mWhite.add(cyl(0.16, 0.18, 1.25, 10), M(px + 0.08, gy + 1.72, pz + 0.36, 0, 0, Math.PI / 2 - 0.18));
        addSacredInterior(cx, gy, cz - 11.5, cz + 10.5, 20, cat, false);
      }

      // 2. FLORENCE DUOMO (Santa Maria del Fiore) — True Scale Model: Cruciform Polychrome Basilica + 3 Terracotta Tribune Half-Domes + Octagonal Brunelleschi Dome + Giotto Campanile!
      else if (id === 'florence_duomo') {
        buildNaveShell(mTuscan, mWhite, mTerra, cx, gy, cz, 17, 22, 10.5, 3.0, { doorW: 4.4, doorH: 5.2 });
        addTranseptAndApse(mTuscan, mWhite, mTerra, cx, gy, cz, 17, 22, 10.5, 2.8, { transeptW: 9.2, transeptOut: 8.0, transeptRose: false });
        // Tri-color Neo-Gothic Marble West Facade: 3 recessed pointed Gothic portals + 4 vertical marble pilaster buttresses + central rose + 2 flanking oculi!
        addTripleGothicPortals(mWhite, cx, gy, cz + 11.05, 5.4);
        for (const px of [-8.4, -2.9, 2.9, 8.4]) {
          box(mWhite, 0.72, 11.8, 0.75, cx + px, gy + 5.9, cz + 11.18);
          mWhite.add(new T.ConeGeometry(0.42, 2.6, 6), M(cx + px, gy + 13.0, cz + 11.18));
        }
        addMesh(new T.CircleGeometry(2.35, 28), roseMatGothic, cx, gy + 8.6, cz + 11.2);
        for (const sd of [-1, 1]) {
          addMesh(new T.CircleGeometry(1.15, 20), roseMatChartres, cx + sd * 5.4, gy + 8.2, cz + 11.2);
        }
        addCathedralFascia(cx, gy + 6.1, cz + 11.85, 'SANTA MARIA DEL FIORE · 圣母百花大教堂', 8.2);
        // Brunelleschi's World-Famous Octagonal Terracotta Ribbed Dome + 3 Semicircular Terracotta Exedrae (Tribune)!
        addRibbedDome(mTerra, mWhite, cx, gy + 10.2, cz - 3.5, 7.4, 1.42, 8, 4.6, 3.6, true);
        for (const [ex, ez] of [[-7.2, -3.5], [7.2, -3.5], [0, -10.8]]) {
          mTuscan.add(cyl(3.4, 3.5, 8.2, 12), M(cx + ex, gy + 4.1, cz + ez));
          mTerra.add(new T.SphereGeometry(3.45, 14, 8, 0, Math.PI * 2, 0, Math.PI / 2), M(cx + ex, gy + 8.2, cz + ez));
        }
        // Giotto's Tall Slim Tuscan-Marble Polychrome Bell Tower (Campanile) with tiered marble bands!
        addGothicTower(mTuscan, mWhite, cx + 11.2, gy, cz + 9.2, 3.8, 22.5, 0, true);
        for (const ty of [6.0, 11.2, 16.4, 21.8]) {
          box(mWhite, 4.25, 0.36, 4.25, cx + 11.2, gy + ty, cz + 9.2);
        }
        addSacredInterior(cx, gy, cz - 10.5, cz + 10.0, 16, cat, false);
      }

      // 3. MILAN CATHEDRAL (Duomo di Milano) — Ultimate Museum Scale Model: Broad 27.6m Triangular Candoglia Marble Facade + 6 Statued Buttress Piers + 26 Lace Parapet Guglie + 5 Pellegrini Balconied Portals + 8 Flamboyant Tracery Windows + Soaring Tiburio, Guglia Maggiore & Golden Madonnina!
      else if (id === 'milan_duomo') {
        buildNaveShell(mWhite, mWhite, mWhite, cx, gy, cz, 20, 24, 11.2, 4.4, { doorW: 4.0, doorH: 5.0 });
        addTranseptAndApse(mWhite, mWhite, mWhite, cx, gy, cz, 20, 24, 11.2, 4.2, { transeptW: 9.0, transeptOut: 7.5 });
        const fz = cz + 12.15;
        // 5 Broad White-Marble Grand Steps spanning the entire 28m Piazza del Duomo facade!
        for (let st = 0; st < 5; st++) {
          box(mWhite, 28.4 - st * 0.4, 0.14, 0.62, cx, gy + st * 0.14 + 0.07, fz + 2.6 - st * 0.52);
        }
        // BROAD 27.6m ISOSCELES TRIANGULAR CANDOGLIA MARBLE SCREEN FACADE (split cleanly around the 3.8m x 5.2m open central portal!)
        box(mWhite, 11.9, 9.4, 1.35, cx - 7.85, gy + 4.7, fz);
        box(mWhite, 11.9, 9.4, 1.35, cx + 7.85, gy + 4.7, fz);
        box(mWhite, 3.8, 4.2, 1.35, cx, gy + 7.3, fz);
        const triS = new T.Shape();
        triS.moveTo(-13.8, 0); triS.lineTo(13.8, 0); triS.lineTo(0, 9.2); triS.closePath();
        mWhite.add(new T.ExtrudeGeometry(triS, { depth: 1.35, bevelEnabled: false }), M(cx, gy + 9.4, fz - 0.68));
        // Rich Horizontal Carved Marble Cornice & Balustrade Band separating Portal Zone & Gothic Window Zone!
        box(mWhite, 28.0, 0.34, 1.75, cx, gy + 6.45, fz + 0.12);
        box(mWhite, 28.0, 0.24, 1.65, cx, gy + 9.45, fz + 0.08);
        // Diagonal Molded Marble Gable Cornices + Delicate Openwork Lace Parapet Band climbing up to the 18.6m Apex!
        addRibSeg(mWhite, [cx - 14.0, gy + 9.4, fz + 0.72], [cx, gy + 18.75, fz + 0.72], 0.30, 0.30);
        addRibSeg(mWhite, [cx + 14.0, gy + 9.4, fz + 0.72], [cx, gy + 18.75, fz + 0.72], 0.30, 0.30);
        addRibSeg(mWhite, [cx - 14.0, gy + 10.1, fz + 0.42], [cx, gy + 19.45, fz + 0.42], 0.14, 0.14);
        addRibSeg(mWhite, [cx + 14.0, gy + 10.1, fz + 0.42], [cx, gy + 19.45, fz + 0.42], 0.14, 0.14);
        // 6 MASSIVE BUNDLED GOTHIC BUTTRESS PIERS with 3 Tiers of Carved Statue Tabernacles + Tall 6m Crocketed Spires!
        const piers = [-13.4, -8.3, -3.15, 3.15, 8.3, 13.4];
        piers.forEach((dx) => {
          const roofY = 9.4 + (1 - Math.abs(dx) / 13.8) * 9.2;
          const pierH = roofY + 1.9;
          // Clustered triple-ribbed Gothic buttress pier
          box(mWhite, 1.05, pierH, 1.65, cx + dx, gy + pierH / 2, fz + 0.48);
          box(mWhite, 0.48, pierH + 0.6, 1.95, cx + dx, gy + pierH / 2 + 0.3, fz + 0.56);
          // 3 Tiers of Projecting Carved Gothic Tabernacle Canopies & Marble Saint Statues climbing every buttress!
          for (const ty of [3.4, 7.6, Math.min(roofY - 1.2, 11.8)]) {
            if (ty > roofY - 0.8) continue;
            box(mWhite, 0.68, 0.22, 0.68, cx + dx, gy + ty, fz + 1.48);
            mWhite.add(cyl(0.14, 0.18, 1.15, 6), M(cx + dx, gy + ty + 0.68, fz + 1.52));
            mWhite.add(new T.ConeGeometry(0.32, 0.95, 4), M(cx + dx, gy + ty + 1.75, fz + 1.52));
          }
          // Ornate Crown Collar + Tall 5.8m Slender Crocketed Gothic Spire + Marble Saint Statue!
          box(mWhite, 1.32, 0.38, 1.85, cx + dx, gy + pierH, fz + 0.48);
          mWhite.add(new T.ConeGeometry(0.46, 5.6, 4), M(cx + dx, gy + pierH + 2.8, fz + 0.48));
          for (const cf of [0.32, 0.62]) {
            box(mWhite, 0.72 * (1 - cf * 0.4), 0.16, 0.72 * (1 - cf * 0.4), cx + dx, gy + pierH + 5.6 * cf, fz + 0.48);
          }
          mWhite.add(sph(0.18), M(cx + dx, gy + pierH + 5.75, fz + 0.48));
        });
        // MILAN'S #1 ICONIC LACE SILHOUETTE: 26 Tall Slender White-Marble Parapet Needles (Guglie) climbing densely up BOTH slopes!
        for (let i = 1; i <= 13; i++) {
          const f = i / 14;
          for (const sd of [-1, 1]) {
            const sx = cx + sd * (13.5 * (1 - f));
            const sy = gy + 9.4 + f * 9.2;
            const nh = (i % 2 === 0) ? 3.2 : 2.3;
            box(mWhite, 0.24, 0.85, 0.24, sx, sy + 0.42, fz + 0.35);
            mWhite.add(new T.ConeGeometry(0.20, nh, 4), M(sx, sy + 0.85 + nh / 2, fz + 0.35));
          }
        }
        // Central Facade Apex Pinnacle + Statue
        mWhite.add(new T.ConeGeometry(0.38, 4.4, 4), M(cx, gy + 21.0, fz + 0.35));
        // 5 DEEP SCULPTED PELLEGRINI RENAISSANCE-BAROQUE PORTALS (twin fluted columns + balconies + arched/triangular pediments + carved bronze doors!)
        for (const sd of [-1, 1]) {
          mWhite.add(cyl(0.24, 0.28, 5.4, 8), M(cx + sd * 2.15, gy + 2.7, fz + 0.92));
          mWhite.add(cyl(0.20, 0.22, 5.4, 8), M(cx + sd * 2.55, gy + 2.7, fz + 0.82));
        }
        box(mWhite, 5.4, 0.42, 1.35, cx, gy + 5.55, fz + 1.02); // Monumental central balcony!
        mWhite.add(new T.TorusGeometry(2.15, 0.24, 6, 16, Math.PI), M(cx, gy + 5.75, fz + 0.95)); // Arched Baroque central pediment!
        for (const dx of [-10.85, -5.72, 5.72, 10.85]) {
          const isInner = Math.abs(dx) < 8;
          const pw = isInner ? 2.25 : 1.9, ph = isInner ? 4.2 : 3.65;
          // Recessed carved bronze relief door texture (ZERO flat brown boxes!)
          addMesh(new T.PlaneGeometry(pw, ph), milanDoorMat, cx + dx, gy + ph / 2 + 0.15, fz + 0.72);
          for (const sd of [-1, 1]) {
            mWhite.add(cyl(0.16, 0.19, ph + 0.2, 6), M(cx + dx + sd * (pw / 2 + 0.22), gy + ph / 2 + 0.15, fz + 0.85));
          }
          box(mWhite, pw + 0.95, 0.34, 0.75, cx + dx, gy + ph + 0.32, fz + 0.92);
          if (isInner) {
            mWhite.add(new T.TorusGeometry(pw * 0.56, 0.18, 6, 14, Math.PI), M(cx + dx, gy + ph + 0.48, fz + 0.86));
          } else {
            const pp = new T.Shape(); pp.moveTo(-pw * 0.65, 0); pp.lineTo(pw * 0.65, 0); pp.lineTo(0, 1.25); pp.closePath();
            mWhite.add(new T.ExtrudeGeometry(pp, { depth: 0.34, bevelEnabled: false }), M(cx + dx, gy + ph + 0.48, fz + 0.72));
          }
        }
        // 5 FLAMBOYANT GOTHIC POINTED TRACERY WINDOWS (milanWinMat) + 3D Pointed Marble Wimperg Gables & Spirelets!
        [[-10.85, 8.2, 1.75, 3.2], [-5.72, 9.6, 2.15, 4.4], [0, 10.6, 2.75, 5.0], [5.72, 9.6, 2.15, 4.4], [10.85, 8.2, 1.75, 3.2]].forEach(([dx, wy, ww, wh]) => {
          addMesh(new T.PlaneGeometry(ww, wh), milanWinMat, cx + dx, gy + wy, fz + 0.72);
          box(mWhite, ww + 0.45, 0.22, 0.36, cx + dx, gy + wy - wh / 2 - 0.08, fz + 0.82);
          // 3D Pointed Gothic Wimperg Gable & Finial Spirelet crowning EVERY window!
          const gTop = gy + wy + wh / 2 + 1.35;
          addRibSeg(mWhite, [cx + dx - ww * 0.56, gy + wy + wh * 0.25, fz + 0.84], [cx + dx, gTop, fz + 0.84], 0.12, 0.09);
          addRibSeg(mWhite, [cx + dx + ww * 0.56, gy + wy + wh * 0.25, fz + 0.84], [cx + dx, gTop, fz + 0.84], 0.12, 0.09);
          mWhite.add(new T.ConeGeometry(0.16, 1.15, 4), M(cx + dx, gTop + 0.58, fz + 0.84));
        });
        // 3 Upper-Tier Pointed Gothic Tracery Windows in the Upper Triangle!
        for (const [dx, wy, wh] of [[-5.72, 13.6, 2.3], [0, 15.6, 2.9], [5.72, 13.6, 2.3]]) {
          addMesh(new T.PlaneGeometry(1.55, wh), milanWinMat, cx + dx, gy + wy, fz + 0.72);
          addRibSeg(mWhite, [cx + dx - 0.88, gy + wy + wh * 0.22, fz + 0.82], [cx + dx, gy + wy + wh * 0.72, fz + 0.82], 0.10, 0.08);
          addRibSeg(mWhite, [cx + dx + 0.88, gy + wy + wh * 0.22, fz + 0.82], [cx + dx, gy + wy + wh * 0.72, fz + 0.82], 0.10, 0.08);
        }
        // DENSE VISIBLE ROOFTOP FOREST OF CANDOGLIA MARBLE SPIRES rising ABOVE the facade slopes (Milan's signature 135-spire crown!)
        addFlyingButtresses(mWhite, cx, gy, cz - 1.0, 10.0, 20, 11.2, 6);
        for (let rz = cz - 10; rz <= cz + 9; rz += 2.6) {
          for (const sd of [-1, 1]) {
            mWhite.add(new T.ConeGeometry(0.36, 5.8, 4), M(cx + sd * 10.2, gy + 14.5, rz));
            mWhite.add(new T.ConeGeometry(0.34, 6.4, 4), M(cx + sd * 5.8, gy + 17.6, rz));
          }
        }
        // SOARING OCTAGONAL OPENWORK TIBURIO CROSSING LANTERN + PIERCED MAIN SPIRE (GUGLIA MAGGIORE) + SCULPTED GOLDEN MADONNINA (rising high above the facade!)
        const tibZ = cz + 1.0;
        mWhite.add(cyl(3.4, 3.6, 6.2, 8), M(cx, gy + 17.5, tibZ));
        for (let i = 0; i < 8; i++) {
          const a = (i / 8) * Math.PI * 2;
          box(mWhite, 0.55, 7.2, 0.55, cx + Math.cos(a) * 3.45, gy + 18.0, tibZ + Math.sin(a) * 3.45);
          mWhite.add(new T.ConeGeometry(0.36, 4.6, 4), M(cx + Math.cos(a) * 3.45, gy + 23.8, tibZ + Math.sin(a) * 3.45));
        }
        // Slender Pierced Octagonal Guglia Maggiore Spire rising to y = 34.5!
        mWhite.add(cyl(1.6, 2.2, 4.8, 8), M(cx, gy + 23.0, tibZ));
        mWhite.add(new T.ConeGeometry(1.65, 9.5, 8), M(cx, gy + 30.0, tibZ));
        for (const tf of [26.8, 29.8, 32.4]) {
          const rr = 1.65 * (1 - (tf - 25.2) / 9.5) * 1.08;
          mWhite.add(cyl(rr, rr, 0.22, 8), M(cx, gy + tf, tibZ));
        }
        // Sculpted 3D Golden Madonnina Statue (flowing golden robe + outstretched arms + golden halo!) soaring at y = 35..38.5!
        mGold.add(new T.ConeGeometry(0.42, 2.2, 8), M(cx, gy + 35.8, tibZ));
        mGold.add(box.length ? new T.BoxGeometry(1.35, 0.22, 0.22) : new T.BoxGeometry(1.35, 0.22, 0.22), M(cx, gy + 36.2, tibZ));
        mGold.add(sph(0.28), M(cx, gy + 37.1, tibZ));
        mGold.add(new T.TorusGeometry(0.45, 0.06, 6, 12), M(cx, gy + 37.3, tibZ));
        addCathedralFascia(cx, gy + 6.4, cz + 12.75, 'DUOMO DI MILANO · 米兰大教堂', 8.0);
        addSacredInterior(cx, gy, cz - 11.5, cz + 11.0, 18, cat, false);
      }

      // 4. ST. MARK'S BASILICA (Venice) — True Scale Model: Double-Tier Venetian Marble Arcade + 5 Golden Mosaic Lunettes + 5 Byzantine Onion Domes + 4 Bronze Horses + Campanile!
      else if (id === 'st_marks') {
        buildNaveShell(mTrav, mGold, mSlate, cx, gy, cz, 20, 19, 8.8, 0, { doorW: 4.8, doorH: 5.0 });
        // Procedural Golden Venetian Mosaic Lunette Material for the 5 Front Arches!
        const venMosC = cvs(128, 128), vmx = venMosC.getContext('2d');
        const vmg = vmx.createRadialGradient(64, 80, 10, 64, 64, 64);
        vmg.addColorStop(0, '#fef08a'); vmg.addColorStop(0.55, '#d97706'); vmg.addColorStop(1, '#78350f');
        vmx.fillStyle = vmg; vmx.fillRect(0, 0, 128, 128);
        vmx.strokeStyle = 'rgba(255,250,210,0.45)'; vmx.lineWidth = 3;
        vmx.beginPath(); vmx.arc(64, 64, 42, Math.PI, 0); vmx.stroke();
        vmx.fillStyle = '#1e3a8a'; vmx.beginPath(); vmx.arc(64, 72, 18, 0, Math.PI * 2); vmx.fill();
        const venMosTex = finTex(venMosC, false);
        const venMosMat = new T.MeshLambertMaterial({ map: venMosTex, emissiveMap: venMosTex, emissive: 0xffd76a, emissiveIntensity: 0.42 });
        // 5 Deeply Recessed Venetian Marble-Columned Arches + Continuous Gallery Balustrade + 5 Upper Crocketed Ogee Gables!
        box(mWhite, 20.6, 0.45, 1.6, cx, gy + 7.65, cz + 10.25); // Upper gallery balustrade cornice!
        for (let k = -2; k <= 2; k++) {
          const ax = cx + k * 3.8;
          // Clustered Marble Porch Columns flanking each Venetian arch!
          for (const sd of [-1, 1]) {
            mWhite.add(cyl(0.22, 0.25, 5.8, 10), M(ax + sd * 1.65, gy + 2.9, cz + 10.35));
            mTrav.add(cyl(0.18, 0.20, 5.8, 8), M(ax + sd * 1.32, gy + 2.9, cz + 10.12));
          }
          mGold.add(new T.TorusGeometry(1.65, 0.26, 8, 20, Math.PI), M(ax, gy + 5.8, cz + 10.25));
          // Glowing Golden Venetian Mosaic semicircular lunette inside each arch!
          addMesh(new T.CircleGeometry(1.52, 18, 0, Math.PI), venMosMat, ax, gy + 5.8, cz + 10.05);
          // Ornate Upper Gothic Crocketed Ogee Arch Outline + Pinnacles & Saint Statue!
          addRibSeg(mWhite, [ax - 1.7, gy + 8.1, cz + 10.2], [ax, gy + 11.2, cz + 10.2], 0.16, 0.12);
          addRibSeg(mWhite, [ax + 1.7, gy + 8.1, cz + 10.2], [ax, gy + 11.2, cz + 10.2], 0.16, 0.12);
          mGold.add(sph(0.22), M(ax, gy + 11.45, cz + 10.2));
          if (k < 2) {
            // Pier pinnacle tabernacle between arches!
            box(mWhite, 0.45, 2.2, 0.45, ax + 1.9, gy + 9.0, cz + 10.25);
            mWhite.add(new T.ConeGeometry(0.32, 1.8, 6), M(ax + 1.9, gy + 11.0, cz + 10.25));
          }
        }
        // 4 Gilded Bronze Horses of St. Mark above the central portal!
        for (const hx of [-1.35, -0.45, 0.45, 1.35]) {
          box(mGold, 0.42, 0.85, 0.95, cx + hx, gy + 8.85, cz + 10.55);
          mGold.add(sph(0.24), M(cx + hx, gy + 9.5, cz + 10.9));
        }
        // 5 Byzantine Onion-Shaped Domes arranged in a Greek Cross!
        [[0, 0, 4.6], [0, 5.2, 3.6], [0, -5.2, 3.6], [-5.8, 0, 3.6], [5.8, 0, 3.6]].forEach(([dx, dz, rr]) => {
          addRibbedDome(mCopper, mGold, cx + dx, gy + 8.8, cz + dz, rr, 1.35, 8, 2.2, 1.8, false);
        });
        // Piazza San Marco's Iconic 3 Tall Crimson Venetian Flagpoles grouped on the Left Piazza (unobstructed fascia!)
        const redFlagMat = new T.MeshLambertMaterial({ color: 0xb91c1c, emissive: 0x2a0606, side: T.DoubleSide });
        for (const fx of [-9.4, -6.8, -4.2]) {
          mBronze.add(cyl(0.42, 0.62, 1.1, 10), M(cx + fx, gy + 0.55, cz + 17.2));
          mBrick.add(cyl(0.10, 0.14, 10.5, 8), M(cx + fx, gy + 6.3, cz + 17.2));
          mGold.add(sph(0.22), M(cx + fx, gy + 11.6, cz + 17.2));
          addMesh(new T.PlaneGeometry(0.95, 3.2), redFlagMat, cx + fx + 0.55, gy + 9.5, cz + 17.2);
        }
        addCathedralFascia(cx, gy + 7.85, cz + 10.75, 'BASILICA DI SAN MARCO · 圣马可大教堂', 8.8);
        // Iconic Red-Brick St. Mark's Campanile Bell Tower with Marble Belfry Loggia & Golden Archangel!
        const vx = cx + 13.5, vz = cz + 12.2;
        box(mBrick, 3.6, 18.0, 3.6, vx, gy + 9.0, vz);
        box(mWhite, 3.9, 0.45, 3.9, vx, gy + 18.1, vz);
        box(mWhite, 3.2, 3.6, 3.2, vx, gy + 20.1, vz);
        for (const bx of [-0.9, 0, 0.9]) box(mDarkOak, 0.45, 2.4, 3.35, vx + bx, gy + 20.1, vz);
        mTerra.add(new T.ConeGeometry(2.3, 6.2, 4), M(vx, gy + 25.0, vz, 0, Math.PI / 4, 0));
        mGold.add(cyl(0.18, 0.28, 1.6, 8), M(vx, gy + 28.8, vz));
        mGold.add(sph(0.24), M(vx, gy + 29.8, vz));
        // Byzantine Golden Mosaic Apse Fresco (Pala d'Oro / Pantocrator Halo) behind St. Mark's Altar!
        {
          const mc = cvs(256, 256), mx = mc.getContext('2d');
          const mg = mx.createRadialGradient(128, 118, 12, 128, 128, 130);
          mg.addColorStop(0, '#fef08a'); mg.addColorStop(0.55, '#d97706'); mg.addColorStop(1, '#78350f');
          mx.fillStyle = mg; mx.fillRect(0, 0, 256, 256);
          mx.strokeStyle = 'rgba(255,250,210,0.45)'; mx.lineWidth = 4;
          for (let r = 28; r <= 110; r += 22) { mx.beginPath(); mx.arc(128, 116, r, 0, Math.PI * 2); mx.stroke(); }
          mx.fillStyle = '#1e3a8a'; mx.beginPath(); mx.arc(128, 128, 42, 0, Math.PI * 2); mx.fill();
          mx.fillStyle = '#fef08a'; mx.fillRect(123, 80, 10, 96); mx.fillRect(88, 112, 80, 10);
          const mTex = finTex(mc, false);
          addMesh(new T.PlaneGeometry(5.6, 5.6), new T.MeshLambertMaterial({ map: mTex, emissiveMap: mTex, emissive: 0xffd76a, emissiveIntensity: 0.45 }), cx, gy + 4.4, cz - 8.85);
        }
        addSacredInterior(cx, gy, cz - 8.5, cz + 8.5, 18, cat, false);
      }

      // 5. NOTRE-DAME DE PARIS — True Scale Model: Flat-Gallery Gothic West Facade + 3 Recessed Archivolt Portals + Full 28 Kings Gallery + Twin Flanking Lancets + Grande Galerie + Flèche!
      else if (id === 'notre_dame') {
        buildNaveShell(mLime, mWhite, mSlate, cx, gy, cz, 16, 24, 11.0, 4.2, { doorW: 4.4, doorH: 5.0, skipFrontGable: true });
        addTranseptAndApse(mLime, mWhite, mSlate, cx, gy, cz, 16, 24, 11.0, 4.2, { transeptW: 8.2, transeptOut: 6.5, roseMat: roseMatGothic });
        addGothicTower(mLime, mWhite, cx - 6.6, gy, cz + 10.2, 4.8, 19.5, 0, true);
        addGothicTower(mLime, mWhite, cx + 6.6, gy, cz + 10.2, 4.8, 19.5, 0, true);
        // Authentic Flat Horizontal Limestone Facade Screen Wall bridging the two bell towers behind the Rose Window (zero sloping gable behind rose!)
        box(mLime, 9.2, 4.2, 1.2, cx, gy + 13.0, cz + 11.95);
        // Triple Deeply Recessed Multi-Order Pointed Gothic Portals + FULL Uninterrupted Gallery of 28 Kings!
        addTripleGothicPortals(mWhite, cx, gy, cz + 12.15, 5.2);
        box(mWhite, 17.8, 1.35, 0.78, cx, gy + 7.45, cz + 12.6);
        for (let k = -9; k <= 9; k++) {
          mTrav.add(cyl(0.13, 0.16, 0.95, 6), M(cx + k * 0.88, gy + 7.45, cz + 13.02));
          mTrav.add(sph(0.13), M(cx + k * 0.88, gy + 8.0, cz + 13.02));
        }
        // Giant 13m Rose Window flanked by Twin Pointed Gothic Lancet Windows + Upper Openwork Grande Galerie Arcade!
        addMesh(new T.CircleGeometry(3.2, 32), roseMatGothic, cx, gy + 11.4, cz + 12.65);
        for (const sd of [-1, 1]) {
          box(mDarkConc, 1.85, 3.8, 0.18, cx + sd * 6.6, gy + 11.4, cz + 12.68);
          box(mWhite, 0.12, 3.8, 0.24, cx + sd * 6.6, gy + 11.4, cz + 12.72);
        }
        box(mWhite, 17.8, 0.35, 0.85, cx, gy + 14.9, cz + 12.6);
        box(mWhite, 17.8, 0.35, 0.85, cx, gy + 16.6, cz + 12.6);
        for (let k = -8; k <= 8; k++) {
          mWhite.add(cyl(0.10, 0.10, 1.7, 6), M(cx + k * 1.02, gy + 15.75, cz + 12.8));
        }
        // Slender central Flèche spire rising from the crossing with gilded rooster finial!
        mCopper.add(cyl(0.45, 0.85, 4.5, 8), M(cx, gy + 17.2, cz - 2.0));
        mCopper.add(new T.ConeGeometry(0.62, 10.5, 8), M(cx, gy + 24.4, cz - 2.0));
        mGold.add(sph(0.24), M(cx, gy + 29.8, cz - 2.0));
        addFlyingButtresses(mLime, cx, gy, cz - 1.5, 8.0, 18, 11.0, 5);
        addCathedralFascia(cx, gy + 7.25, cz + 13.08, 'NOTRE-DAME DE PARIS · 巴黎圣母院', 7.2);
        addSacredInterior(cx, gy, cz - 11.2, cz + 10.0, 15, cat, false);
      }

      // 6. COLOGNE CATHEDRAL (Kölner Dom) — True Scale Model: Cruciform High-Gothic Basilica + Twin Pierced Openwork Spires + Triple Recessed Portals + Crossing Flèche!
      else if (id === 'cologne_cathedral') {
        buildNaveShell(mGothic, mLime, mSlate, cx, gy, cz, 16, 24, 12.0, 5.8, { doorW: 4.2, doorH: 5.2 });
        addTranseptAndApse(mGothic, mGothic, mSlate, cx, gy, cz, 16, 24, 12.0, 5.6, { transeptW: 8.6, transeptOut: 7.2, roseMat: roseMatChartres });
        addGothicTower(mGothic, mGothic, cx - 6.2, gy, cz + 10.2, 4.8, 20.0, 14.5, false);
        addGothicTower(mGothic, mGothic, cx + 6.2, gy, cz + 10.2, 4.8, 20.0, 14.5, false);
        // Slender Central Crossing Flèche Spire on the steep slate nave ridge!
        mGothic.add(new T.ConeGeometry(0.55, 9.5, 8), M(cx, gy + 22.0, cz - 2.5));
        mGold.add(sph(0.24), M(cx, gy + 27.0, cz - 2.5));
        addTripleGothicPortals(mLime, cx, gy, cz + 12.15, 5.0);
        addMesh(new T.PlaneGeometry(4.4, 6.2), lancetBlueMat, cx, gy + 11.8, cz + 12.4);
        // Stone tracery mullions across Cologne's giant west window!
        for (const mx of [-1.1, 0, 1.1]) box(mGothic, 0.14, 6.2, 0.16, cx + mx, gy + 11.8, cz + 12.48);
        addFlyingButtresses(mGothic, cx, gy, cz - 1.5, 8.0, 18, 12.0, 6);
        addCathedralFascia(cx, gy + 8.0, cz + 12.9, 'KÖLNER DOM · 科隆大教堂', 7.4);
        addSacredInterior(cx, gy, cz - 11.2, cz + 10.0, 15, cat, false);
      }

      // 7. CHARTRES CATHEDRAL — True Scale Model: Cruciform Basilica + Asymmetric Openwork North Spire vs Romanesque South Pyramid + Royal Portal!
      else if (id === 'chartres') {
        buildNaveShell(mLime, mWhite, mCopper, cx, gy, cz, 16, 22, 10.6, 4.4, { doorW: 4.2, doorH: 4.8 });
        addTranseptAndApse(mLime, mWhite, mCopper, cx, gy, cz, 16, 22, 10.6, 4.4, { transeptW: 8.2, transeptOut: 6.5, roseMat: roseMatChartres });
        // Left (North) Taller Ornate Flamboyant Openwork Spire vs Right (South) Crisp Romanesque Pyramid Spire!
        addGothicTower(mLime, mWhite, cx - 6.2, gy, cz + 9.2, 4.4, 18.5, 11.8, false);
        addGothicTower(mLime, mLime, cx + 6.2, gy, cz + 9.2, 4.4, 14.2, 9.2, false);
        addPointedGothicPortal(mWhite, cx, gy, cz + 11.1, 4.2, 5.4, true);
        // Royal Portal Triple Chartres-Blue Lancet Windows beneath the Giant Rose Window!
        for (const lx of [-2.2, 0, 2.2]) {
          addMesh(new T.PlaneGeometry(1.4, 3.2), lancetBlueMat, cx + lx, gy + 7.2, cz + 11.35);
          box(mWhite, 0.12, 3.2, 0.14, cx + lx, gy + 7.2, cz + 11.42);
        }
        addMesh(new T.CircleGeometry(2.8, 32), roseMatChartres, cx, gy + 11.5, cz + 11.5);
        addFlyingButtresses(mLime, cx, gy, cz - 1.5, 8.0, 16, 10.6, 4);
        addCathedralFascia(cx, gy + 5.1, cz + 11.6, 'CHARTRES CATHEDRAL · 沙特尔大教堂', 8.2);
        // Chartres's World-Famous 12-Ring Circular Pilgrimage Labyrinth inlaid in the Nave Marble Floor!
        {
          const lc = cvs(256, 256), lx = lc.getContext('2d');
          lx.fillStyle = '#ece6d8'; lx.fillRect(0, 0, 256, 256);
          for (let r = 118; r >= 22; r -= 12) {
            lx.strokeStyle = (r % 24 === 10) ? '#334155' : '#94a3b8'; lx.lineWidth = 4;
            lx.beginPath(); lx.arc(128, 128, r, 0, Math.PI * 2); lx.stroke();
          }
          lx.strokeStyle = '#1e293b'; lx.lineWidth = 4;
          lx.beginPath(); lx.moveTo(128, 10); lx.lineTo(128, 246); lx.moveTo(10, 128); lx.lineTo(246, 128); lx.stroke();
          addMesh(new T.CircleGeometry(3.4, 32), new T.MeshLambertMaterial({ map: finTex(lc, false) }), cx, gy + 0.04, cz + 3.2, -Math.PI / 2);
        }
        addSacredInterior(cx, gy, cz - 10.2, cz + 9.0, 15, cat, false);
      }

      // 8. SAINTE-CHAPELLE (Paris) — Jewel Box of Towering 15m Stained Glass + Two-Story Gothic Porch + Gilded Roof Cresting!
      else if (id === 'sainte_chapelle') {
        buildNaveShell(mLime, mGold, mSlate, cx, gy, cz, 12, 20, 13.5, 4.6, { doorW: 3.6, doorH: 4.4, skipSides: true });
        // Crisp 6x-tiled 15m stained-glass curtain walls atop a solid 2.2m carved limestone dado arcade!
        const scGlassTex = makeLancetGlassTex('#1d4ed8', '#7c3aed');
        scGlassTex.repeat.set(6, 2);
        const scGlassMat = new T.MeshLambertMaterial({ map: scGlassTex, emissiveMap: scGlassTex, emissive: 0xffffff, emissiveIntensity: 0.62, side: T.DoubleSide });
        for (const sd of [-1, 1]) {
          box(mLime, 0.72, 2.2, 20.0, cx + sd * 6.0, gy + 1.1, cz);
          addMesh(new T.PlaneGeometry(18.6, 11.1), scGlassMat, cx + sd * 5.85, gy + 7.75, cz, 0, sd * Math.PI / 2);
          for (let bz = cz - 9; bz <= cz + 9; bz += 3.0) {
            box(mLime, 0.72, 13.8, 0.72, cx + sd * 6.0, gy + 6.9, bz);
            mLime.add(new T.ConeGeometry(0.42, 2.6, 6), M(cx + sd * 6.0, gy + 15.1, bz));
          }
          // Twin Front Corner Turrets framing the Flamboyant Rose Window!
          mLime.add(cyl(0.65, 0.75, 16.5, 8), M(cx + sd * 5.8, gy + 8.25, cz + 10.1));
          mGold.add(new T.ConeGeometry(0.68, 3.2, 8), M(cx + sd * 5.8, gy + 18.1, cz + 10.1));
        }
        addPointedGothicPortal(mLime, cx, gy, cz + 10.05, 3.8, 5.0, true);
        // Gilded Roof Ridge Cresting + Tall Slender Gilded Spire!
        box(mGold, 0.16, 0.65, 19.2, cx, gy + 18.2, cz);
        addMesh(new T.CircleGeometry(2.8, 32), roseMatChartres, cx, gy + 9.8, cz + 10.15);
        mBronze.add(new T.ConeGeometry(0.75, 11.2, 8), M(cx, gy + 23.2, cz - 1.5));
        box(mGold, 0.14, 1.8, 0.14, cx, gy + 29.4, cz - 1.5);
        box(mGold, 0.9, 0.14, 0.14, cx, gy + 29.8, cz - 1.5);
        addCathedralFascia(cx, gy + 5.3, cz + 10.35, 'SAINTE-CHAPELLE · 巴黎圣礼拜堂', 7.4);
        // Sainte-Chapelle's Iconic Royal Cobalt-Blue Starry Gold-Fleur-de-Lis Vaulted Ceiling!
        {
          const sc = cvs(256, 256), sx = sc.getContext('2d');
          sx.fillStyle = '#172554'; sx.fillRect(0, 0, 256, 256);
          sx.fillStyle = '#fde047';
          for (let y = 16; y < 256; y += 32) for (let x = 16; x < 256; x += 32) {
            sx.beginPath(); sx.arc(x + ((y / 32) % 2) * 14, y, 3.2, 0, Math.PI * 2); sx.fill();
          }
          const sTex = finTex(sc, true); sTex.repeat.set(3, 5);
          addMesh(new T.PlaneGeometry(11.4, 19.2), new T.MeshLambertMaterial({ map: sTex, emissiveMap: sTex, emissive: 0x3b82f6, emissiveIntensity: 0.45, side: T.DoubleSide }), cx, gy + 13.1, cz, Math.PI / 2);
        }
        addSacredInterior(cx, gy, cz - 9.0, cz + 8.5, 11, cat, false);
      }

      // 9. REIMS CATHEDRAL — True Scale Model: Cruciform Coronation Basilica + 3 Deeply Recessed Glazed Rose Portals + High Kings Gallery!
      else if (id === 'reims') {
        buildNaveShell(mSand, mWhite, mSlate, cx, gy, cz, 16, 22, 11.2, 4.5, { doorW: 4.4, doorH: 5.0 });
        addTranseptAndApse(mSand, mWhite, mSlate, cx, gy, cz, 16, 22, 11.2, 4.5, { transeptW: 8.2, transeptOut: 6.5, roseMat: roseMatGothic });
        addGothicTower(mSand, mWhite, cx - 6.4, gy, cz + 9.4, 4.6, 20.5, 0, true);
        addGothicTower(mSand, mWhite, cx + 6.4, gy, cz + 9.4, 4.6, 20.5, 0, true);
        // Three iconic deeply projecting pointed portal gables with GLAZED MINI-ROSE TYMPANUMS (unique to Reims!)
        addTripleGothicPortals(mWhite, cx, gy, cz + 11.2, 4.8);
        for (const gx of [-4.8, 0, 4.8]) {
          addMesh(new T.CircleGeometry(0.92, 20), roseMatGothic, cx + gx, gy + 5.7, cz + 11.95);
        }
        // Giant Central Rose Window + Reims's Unique High Gallery of Kings running above the Rose!
        addMesh(new T.CircleGeometry(3.0, 32), roseMatGothic, cx, gy + 11.4, cz + 11.65);
        box(mWhite, 17.2, 1.35, 0.75, cx, gy + 15.4, cz + 11.6);
        for (let k = -7; k <= 7; k++) {
          mTrav.add(cyl(0.14, 0.18, 0.95, 6), M(cx + k * 1.08, gy + 15.4, cz + 12.02));
          mTrav.add(sph(0.14), M(cx + k * 1.08, gy + 15.95, cz + 12.02));
        }
        addFlyingButtresses(mSand, cx, gy, cz - 1.5, 8.0, 16, 11.2, 5);
        addCathedralFascia(cx, gy + 8.15, cz + 12.0, 'NOTRE-DAME DE REIMS · 兰斯大教堂', 8.0);
        addSacredInterior(cx, gy, cz - 10.2, cz + 9.0, 15, cat, false);
      }

      // 10. SAGRADA FAMÍLIA (Barcelona · Gaudí) — Ultimate Museum Scale Model: Organic Melting-Stone 3-Portal Nativity Facade + Sculpted Cypress & Doves + 14 Honeycombed Parabolic Towers with Trencadís Mosaic Starburst Crowns + Soaring 172.5m Tower of Jesus Christ & Blazing 12-Pointed Star of Mary!
      else if (id === 'sagrada_familia') {
        buildNaveShell(mTrav, mLime, mTrav, cx, gy, cz, 19, 22, 11.2, 2.6, { doorW: 4.4, doorH: 5.4, glassL: lancetWarmMat, glassR: lancetEmeraldMat });
        const fz = cz + 11.05;
        // Helper: Authentic Gaudí Parabolic Perforated Honeycombed Tower + Sculptural Multicolored Trencadís Venetian Mosaic Crown!
        const addGaudiTower = (sx, sz, yStart, baseR, h, style) => {
          const pts = [];
          for (let i = 0; i <= 12; i++) {
            const t = i / 12;
            pts.push(new T.Vector2(baseR * Math.pow(1 - t * 0.68, 0.64), t * h));
          }
          mGaudi.add(new T.LatheGeometry(pts, 12), M(sx, yStart, sz));
          // Vertical pale Catalan limestone ribs & sculpted golden mosaic collar bands
          for (let k = 0; k < 4; k++) {
            const a = (k / 4) * Math.PI * 2;
            addRibSeg(mTrav, [sx + Math.cos(a) * baseR * 0.98, yStart, sz + Math.sin(a) * baseR * 0.98], [sx + Math.cos(a) * baseR * 0.35, yStart + h, sz + Math.sin(a) * baseR * 0.35], 0.14, 0.08);
          }
          const topY = yStart + h;
          if (style === 'jesus') {
            // COLOSSAL 172.5m CENTRAL TOWER OF JESUS CHRIST — Stepped Parabolic Crown + Glowing 5.2m 4-Armed 3D White-and-Gold Cross!
            mWhite.add(cyl(1.15, 1.75, 3.2, 8), M(sx, topY + 1.6, sz));
            for (let i = 0; i < 8; i++) {
              const a = (i / 8) * Math.PI * 2;
              mGold.add(new T.ConeGeometry(0.24, 2.2, 4), M(sx + Math.cos(a) * 1.45, topY + 3.4, sz + Math.sin(a) * 1.45));
            }
            mWhite.add(cyl(0.65, 1.05, 2.2, 8), M(sx, topY + 4.1, sz));
            // Colossal 4-Armed 3D Luminous Cross of Jesus Christ!
            mGold.add(new T.BoxGeometry(0.55, 5.4, 0.55), M(sx, topY + 7.6, sz));
            mGold.add(new T.BoxGeometry(3.4, 0.55, 0.55), M(sx, topY + 8.3, sz));
            mGold.add(new T.BoxGeometry(0.55, 0.55, 3.4), M(sx, topY + 8.3, sz));
            addMesh(new T.OctahedronGeometry(0.95, 0), glowCrossMat, sx, topY + 8.3, sz);
          } else if (style === 'mary') {
            // TOWER OF THE VIRGIN MARY — Blue-White Mosaic Crown + Blazing 12-Pointed Star of Mary!
            mWhite.add(cyl(0.9, 1.35, 2.4, 8), M(sx, topY + 1.2, sz));
            mCopper.add(new T.ConeGeometry(1.15, 2.4, 8), M(sx, topY + 3.4, sz));
            addMesh(new T.OctahedronGeometry(1.75, 0), glowCrossMat, sx, topY + 5.2, sz);
            addMesh(new T.OctahedronGeometry(1.75, 0), glowCrossMat, sx, topY + 5.2, sz, 0.78, 0.78, 0.4);
          } else if (style === 'evangelist') {
            // 4 EVANGELIST TOWERS — White Sculptural Tetramorph Finials & Golden Halos!
            mWhite.add(cyl(0.75, 1.15, 2.2, 8), M(sx, topY + 1.1, sz));
            mWhite.add(new T.ConeGeometry(0.95, 2.8, 8), M(sx, topY + 3.4, sz));
            mGold.add(sph(0.58), M(sx, topY + 5.1, sz));
          } else {
            // ICONIC MULTICOLORED VENETIAN TRENCADÍS MOSAIC STARBURST PINNACLE (White calyx + Gold/Crimson/Turquoise polyhedra + 3D Cross!)
            mWhite.add(cyl(0.55, 0.78, 1.55, 8), M(sx, topY + 0.78, sz));
            mGold.add(new T.OctahedronGeometry(0.68, 0), M(sx, topY + 1.95, sz));
            mTerra.add(new T.OctahedronGeometry(0.56, 0), M(sx, topY + 2.85, sz, 0, Math.PI / 4, 0));
            mCopper.add(new T.OctahedronGeometry(0.45, 0), M(sx, topY + 3.65, sz));
            mWhite.add(sph(0.32), M(sx, topY + 4.3, sz));
            mGold.add(new T.BoxGeometry(0.16, 1.35, 0.16), M(sx, topY + 5.1, sz));
            mGold.add(new T.BoxGeometry(0.88, 0.16, 0.16), M(sx, topY + 5.3, sz));
          }
        };
        // THE ICONIC ORGANIC MELTING-STONE NATIVITY FACADE (3 Steep Drip-Castle Portals: Hope, Charity, Faith!)
        const natPortals = [
          { dx: -5.4, pw: 3.8, ph: 5.6, gH: 13.0, isOpen: false },
          { dx: 0,    pw: 4.6, ph: 6.8, gH: 16.4, isOpen: true  },
          { dx: 5.4,  pw: 3.8, ph: 5.6, gH: 13.0, isOpen: false }
        ];
        natPortals.forEach((p) => {
          // Carved Sculpted Nativity Portal Relief on side portals (Hope & Faith) + Open Organic Cave Portal in Center (Charity)!
          if (!p.isOpen) {
            addMesh(new T.PlaneGeometry(p.pw * 0.92, p.ph * 1.05), gaudiNativityMat, cx + p.dx, gy + p.ph * 0.52, fz + 0.52);
          } else {
            // Radiant Golden Nativity Star & Carved Stone Tracery Arch crowning the open Central Charity Portal!
            addMesh(new T.CircleGeometry(1.15, 16), roseMatGothic, cx, gy + 7.2, fz + 0.85);
            mGold.add(sph(0.32), M(cx, gy + 7.2, fz + 0.95));
          }
          addPointedGothicPortal(mTrav, cx + p.dx, gy, fz + 0.42, p.pw, p.ph, true);
          // Steep Organic Sculpted Stone Gable + Cascading "Melting-Wax / Drip-Castle" Stalactite Pinnacles climbing BOTH slopes!
          const gBaseY = gy + p.ph * 0.72, gRise = p.gH - p.ph * 0.72;
          const gS = new T.Shape(); gS.moveTo(-p.pw * 0.56, 0); gS.lineTo(p.pw * 0.56, 0); gS.lineTo(0, gRise); gS.closePath();
          mTrav.add(new T.ExtrudeGeometry(gS, { depth: 1.1, bevelEnabled: false }), M(cx + p.dx, gBaseY, fz - 0.15));
          addRibSeg(mLime, [cx + p.dx - p.pw * 0.56, gBaseY, fz + 0.98], [cx + p.dx, gy + p.gH, fz + 0.98], 0.18, 0.10);
          addRibSeg(mLime, [cx + p.dx + p.pw * 0.56, gBaseY, fz + 0.98], [cx + p.dx, gy + p.gH, fz + 0.98], 0.18, 0.10);
          // Organic stalactite / drip-castle stone needle clusters climbing both slopes of EVERY Nativity gable!
          for (let k = 1; k <= 3; k++) {
            const f = k / 4;
            for (const sd of [-1, 1]) {
              const sx = cx + p.dx + sd * p.pw * 0.56 * (1 - f);
              const sy = gBaseY + gRise * f;
              mTrav.add(new T.ConeGeometry(0.22, 1.5 + f * 0.8, 5), M(sx, sy + 0.75, fz + 0.85));
            }
          }
          // Flanking organic sculpted rock-pinnacle colonnettes at portal bases!
          for (const sd of [-1, 1]) {
            mTrav.add(new T.ConeGeometry(0.32, 3.2, 6), M(cx + p.dx + sd * (p.pw * 0.56), gy + p.ph + 1.4, fz + 0.82));
          }
        });
        // SCULPTED MULTI-CLUSTERED GREEN CYPRESS TREE OF LIFE + FLYING WHITE DOVES + CRIMSON-GOLD TAU CROSS!
        mTrav.add(cyl(0.65, 0.95, 1.2, 8), M(cx, gy + 15.8, fz + 0.5)); // Carved pelican rock base
        mOrangeLeaf.add(sph(1.15), M(cx, gy + 16.9, fz + 0.5));
        mOrangeLeaf.add(sph(0.95), M(cx - 0.45, gy + 17.5, fz + 0.55));
        mOrangeLeaf.add(sph(0.95), M(cx + 0.45, gy + 17.6, fz + 0.55));
        mOrangeLeaf.add(sph(0.82), M(cx, gy + 18.4, fz + 0.5));
        mOrangeLeaf.add(new T.ConeGeometry(0.75, 2.2, 8), M(cx, gy + 19.6, fz + 0.5));
        // Crimson & Gold Tau Cross crowning the Cypress Tree of Life!
        mTerra.add(new T.BoxGeometry(0.22, 1.55, 0.22), M(cx, gy + 21.1, fz + 0.5));
        mGold.add(new T.BoxGeometry(1.15, 0.22, 0.22), M(cx, gy + 21.6, fz + 0.5));
        // 5 Sculpted White Alabaster Doves with Outstretched Wings circling the Cypress Tree!
        for (const [dx, dy, dz] of [[-0.95, 17.0, 1.25], [1.0, 17.8, 1.2], [-0.65, 18.8, 1.15], [0.72, 16.4, 1.2], [0.1, 19.4, 1.1]]) {
          mWhite.add(sph(0.18), M(cx + dx, gy + dy, fz + dz));
          box(mWhite, 0.58, 0.06, 0.22, cx + dx, gy + dy + 0.05, fz + dz, 0, 0, dx > 0 ? 0.25 : -0.25);
        }
        // Sculpted Openwork Arched Stone Bridges linking the 4 Front Nativity Bell Towers!
        box(mTrav, 15.8, 0.95, 1.15, cx, gy + 12.6, fz + 0.12);
        for (const bx of [-5.4, 0, 5.4]) {
          mTrav.add(new T.TorusGeometry(1.1, 0.16, 6, 12, Math.PI), M(cx + bx, gy + 11.8, fz + 0.62));
        }
        // 4 FRONT NATIVITY BELL TOWERS rising directly from Facade Piers (bundled octagonal stone bases — no flat cubes!)
        [[-7.8, 22.8, 1.48], [-2.7, 25.8, 1.58], [2.7, 25.8, 1.58], [7.8, 22.8, 1.48]].forEach(([dx, h, r]) => {
          mTrav.add(cyl(r * 1.12, r * 1.32, 6.2, 8), M(cx + dx, gy + 3.1, fz - 0.1));
          addGaudiTower(cx + dx, fz - 0.1, gy + 5.8, r, h, 'apostle');
        });
        // 4 REAR PASSION FACADE BELL TOWERS
        [[-7.8, 22.0, 1.48], [-2.7, 24.8, 1.58], [2.7, 24.8, 1.58], [7.8, 22.0, 1.48]].forEach(([dx, h, r]) => {
          addGaudiTower(cx + dx, cz - 10.6, gy + 5.8, r, h, 'apostle');
        });
        // 4 TALLER EVANGELIST TOWERS clustering tightly around the central crossing!
        for (const [ex, ez] of [[-4.2, -3.2], [4.2, -3.2], [-4.2, 2.2], [4.2, 2.2]]) {
          addGaudiTower(cx + ex, cz + ez, gy + 10.2, 1.75, 22.5, 'evangelist');
        }
        // TOWER OF THE VIRGIN MARY (offset slightly right-rear so the Blazing 12-Pointed Star of Mary shines clearly beside the Jesus Tower!)
        addGaudiTower(cx + 5.2, cz - 6.8, gy + 10.2, 2.0, 23.5, 'mary');
        // COLOSSAL 172.5m CENTRAL TOWER OF JESUS CHRIST (soars dramatically ABOVE all 4 Nativity towers even in ground perspective!)
        addGaudiTower(cx, cz - 0.4, gy + 10.2, 3.1, 32.5, 'jesus');
        // Interior Branching Tree-Trunk Columns (Gaudí's signature forest nave!)
        for (let bz = cz - 7; bz <= cz + 6; bz += 4.5) {
          for (const sd of [-4.8, 4.8]) {
            mTrav.add(cyl(0.45, 0.65, 7.5, 8), M(cx + sd, gy + 3.75, bz));
            for (let b = 0; b < 4; b++) {
              const ba = (b / 4) * Math.PI * 2 + 0.4;
              mTrav.add(cyl(0.18, 0.28, 3.8, 6), M(cx + sd + Math.cos(ba) * 0.85, gy + 9.0, bz + Math.sin(ba) * 0.85, Math.sin(ba) * 0.35, 0, -Math.cos(ba) * 0.35));
            }
          }
        }
        addCathedralFascia(cx, gy + 5.7, cz + 11.3, 'SAGRADA FAMÍLIA · 圣家族大教堂', 8.8);
        addSacredInterior(cx, gy, cz - 10.2, cz + 9.5, 19, cat, false);
      }

      // 11. SEVILLE CATHEDRAL & LA GIRALDA — True Scale Model: Cruciform Gothic Hall + Moorish Sebka Giralda Belfry + Patio de los Naranjos!
      else if (id === 'seville') {
        buildNaveShell(mSand, mTrav, mTerra, cx, gy, cz, 18, 20, 10.2, 2.8, { doorW: 4.4, doorH: 4.8 });
        addTranseptAndApse(mSand, mTrav, mTerra, cx, gy, cz, 18, 20, 10.2, 2.8, { transeptW: 8.5, transeptOut: 5.5 });
        addPointedGothicPortal(mTrav, cx, gy, cz + 10.05, 4.4, 5.4, true);
        addFlyingButtresses(mSand, cx, gy, cz - 1.0, 9.0, 16, 10.2, 4);
        // Moorish Red-Brick Square Giralda Tower with Recessed Arched Windows, Renaissance Bell Chamber & Golden Giraldillo!
        const gx = cx + 10.8, gz = cz + 6.5;
        box(mBrick, 4.6, 17.5, 4.6, gx, gy + 8.75, gz);
        for (const ay of [7.5, 11.5, 15.2]) {
          box(mDarkConc, 0.72, 1.85, 4.72, gx - 0.9, gy + ay, gz);
          box(mDarkConc, 0.72, 1.85, 4.72, gx + 0.9, gy + ay, gz);
        }
        box(mTrav, 5.1, 0.5, 5.1, gx, gy + 17.6, gz);
        box(mTrav, 3.8, 4.2, 3.8, gx, gy + 19.9, gz);
        for (const bx of [-0.95, 0, 0.95]) box(mDarkConc, 0.55, 2.4, 3.92, gx + bx, gy + 19.9, gz);
        box(mBrick, 2.4, 3.2, 2.4, gx, gy + 23.6, gz);
        mGold.add(new T.ConeGeometry(0.9, 2.2, 8), M(gx, gy + 26.2, gz));
        mGold.add(sph(0.35), M(gx, gy + 27.6, gz));
        addMesh(new T.CircleGeometry(2.4, 24), roseMatGothic, cx, gy + 8.0, cz + 10.15);
        // Patio de los Naranjos — Iconic Seville Courtyard Orange Trees studded with golden-orange fruit + Central Moorish Fountain!
        for (const ox of [-7.4, -4.0, 4.0, 7.4]) {
          for (const oz of [cz + 14.5, cz + 18.8]) {
            mTimber.add(cyl(0.18, 0.24, 1.9, 8), M(cx + ox, gy + 0.95, oz));
            mOrangeLeaf.add(sph(1.15, 10), M(cx + ox, gy + 2.45, oz));
            for (let fi = 0; fi < 6; fi++) {
              const fa = (fi / 6) * Math.PI * 2;
              mOrangeFruit.add(sph(0.18, 6), M(cx + ox + Math.cos(fa) * 0.95, gy + 2.35 + (fi % 2) * 0.35, oz + Math.sin(fa) * 0.95));
            }
          }
        }
        // Central Moorish Octagonal Stone Fountain in the Patio de los Naranjos
        mTrav.add(cyl(1.85, 2.0, 0.65, 8), M(cx, gy + 0.32, cz + 16.6));
        addMesh(new T.CircleGeometry(1.65, 8), blueGlassMat, cx, gy + 0.66, cz + 16.6, -Math.PI / 2);
        mTrav.add(cyl(0.28, 0.38, 1.3, 8), M(cx, gy + 1.15, cz + 16.6));
        mTrav.add(cyl(0.95, 0.35, 0.3, 8), M(cx, gy + 1.85, cz + 16.6));
        // Moorish Sebka Carved Relief Frames on La Giralda Tower!
        for (const sy of [6.0, 10.5, 14.5]) {
          box(mTrav, 3.8, 0.28, 4.85, gx, gy + sy, gz);
          box(mTrav, 4.85, 0.28, 3.8, gx, gy + sy, gz);
        }
        addCathedralFascia(cx, gy + 5.2, cz + 10.2, 'CATEDRAL DE SEVILLA · 塞维利亚大教堂', 8.4);
        addSacredInterior(cx, gy, cz - 9.2, cz + 8.8, 17, cat, false);
      }

      // 12. VIENNA ST. STEPHEN'S (Stephansdom) — True Scale Model: Steep Diamond-Mosaic Tile Roof + 136m Openwork South Spire + Unfinished Onion-Dome North Tower!
      else if (id === 'st_stephens') {
        buildNaveShell(mLime, mWhite, null, cx, gy, cz, 16, 22, 9.6, 0, { doorW: 4.2, doorH: 4.8 });
        addPointedGothicPortal(mWhite, cx, gy, cz + 11.0, 4.4, 5.4, true);
        // Steep Glazed Diamond Mosaic Roof + 4 Signature Gothic Side Gable Dormers (Wimperge) along both flanks!
        const rH = 8.4, half = 8.6, slopeL = Math.hypot(half, rH), ang = Math.atan2(rH, half);
        for (const sd of [-1, 1]) {
          addMesh(new T.BoxGeometry(slopeL, 0.34, 22.8), viennaRoofMat, cx + sd * (half / 2), gy + 9.8 + rH / 2, cz, 0, 0, -sd * ang, true);
          for (let dz = cz - 7.5; dz <= cz + 6.5; dz += 4.5) {
            const wg = new T.Shape(); wg.moveTo(-1.8, 0); wg.lineTo(1.8, 0); wg.lineTo(0, 4.6); wg.closePath();
            mLime.add(new T.ExtrudeGeometry(wg, { depth: 0.45, bevelEnabled: false }), M(cx + sd * 8.1, gy + 9.6, dz, 0, Math.PI / 2, 0));
            mWhite.add(new T.ConeGeometry(0.22, 1.6, 4), M(cx + sd * 8.2, gy + 14.9, dz));
          }
        }
        const gs = new T.Shape(); gs.moveTo(-8.0, 0); gs.lineTo(8.0, 0); gs.lineTo(0, rH); gs.closePath();
        mLime.add(new T.ExtrudeGeometry(gs, { depth: 0.75, bevelEnabled: false }), M(cx, gy + 9.7, cz + 10.3));
        // Iconic Single Soaring South Gothic Tower (Steffl, 136m) on the Right Flank!
        addGothicTower(mLime, mWhite, cx + 9.4, gy, cz + 4.5, 4.4, 20.5, 14.0, false);
        // Iconic Unfinished North Tower crowned with its Verdigris Copper Renaissance Onion Dome (classic Vienna postcard asymmetry!)
        addGothicTower(mLime, mWhite, cx - 9.2, gy, cz + 4.5, 4.0, 13.8, 0, true);
        addRibbedDome(mCopper, mGold, cx - 9.2, gy + 13.8, cz + 4.5, 1.85, 1.45, 8, 1.2, 1.2, false);
        // Smaller paired Romanesque Heidentürme (Heathens' Towers) flanking the West Giant's Door!
        addGothicTower(mLime, mWhite, cx - 6.8, gy, cz + 10.0, 2.6, 13.0, 3.8, false);
        addGothicTower(mLime, mWhite, cx + 6.8, gy, cz + 10.0, 2.6, 13.0, 3.8, false);
        // Gothic Giant Front Lancet Stained-Glass Window & Rose Medallion on Stephansdom's West Facade!
        addMesh(new T.PlaneGeometry(2.6, 4.8), lancetWarmMat, cx, gy + 8.6, cz + 11.12);
        addMesh(new T.CircleGeometry(1.75, 24), roseMatGothic, cx, gy + 13.6, cz + 11.15);
        addCathedralFascia(cx, gy + 5.6, cz + 11.2, 'STEPHANSDOM WIEN · 圣斯蒂芬大教堂', 8.2);
        addSacredInterior(cx, gy, cz - 10.0, cz + 9.5, 15, cat, false);
      }

      // 13. SANTIAGO DE COMPOSTELA — Museum Scale Model: Churrigueresque Baroque Obradoiro Facade + Double-Flight Imperial Staircase + St. James Niche + Swinging Botafumeiro!
      else if (id === 'santiago') {
        buildNaveShell(mSand, mGold, mTerra, cx, gy, cz, 18, 20, 10.5, 3.0, { doorW: 4.4, doorH: 5.0 });
        addTranseptAndApse(mSand, mGold, mTerra, cx, gy, cz, 18, 20, 10.5, 3.0, { transeptW: 8.5, transeptOut: 5.5, transeptRose: false });
        addGothicTower(mSand, mTrav, cx - 7.4, gy, cz + 9.2, 4.2, 17.5, 7.2, false);
        addGothicTower(mSand, mTrav, cx + 7.4, gy, cz + 9.2, 4.2, 17.5, 7.2, false);
        // Ornate Churrigueresque Baroque Central Retablo Tower (split cleanly around open doorway + glazed central window + Golden Scallop Shell Niche!)
        box(mSand, 2.6, 14.5, 1.4, cx - 3.5, gy + 7.25, cz + 9.8);
        box(mSand, 2.6, 14.5, 1.4, cx + 3.5, gy + 7.25, cz + 9.8);
        box(mSand, 4.4, 9.5, 1.4, cx, gy + 9.75, cz + 9.8);
        // Tall Baroque Glazed Central Window + Flanking Corinthian Pilasters + Curved Scroll Volutes!
        addMesh(new T.PlaneGeometry(3.2, 4.6), lancetWarmMat, cx, gy + 9.2, cz + 10.56);
        for (const sd of [-1, 1]) {
          mTrav.add(cyl(0.24, 0.28, 12.5, 8), M(cx + sd * 2.4, gy + 6.5, cz + 10.65));
          mTrav.add(cyl(0.24, 0.28, 11.2, 8), M(cx + sd * 4.4, gy + 5.8, cz + 10.65));
          mSand.add(new T.ConeGeometry(0.45, 2.6, 4), M(cx + sd * 4.4, gy + 15.6, cz + 10.2));
        }
        // Central Baroque Pyramid Gable crowned by the Golden Scallop-Shell Niche & Statue of St. James the Pilgrim!
        mSand.add(new T.ConeGeometry(3.8, 6.4, 4), M(cx, gy + 17.6, cz + 9.8, 0, Math.PI / 4, 0));
        mGold.add(new T.TorusGeometry(0.95, 0.14, 6, 16, Math.PI), M(cx, gy + 15.2, cz + 10.75));
        mGold.add(cyl(0.24, 0.32, 1.65, 8), M(cx, gy + 15.6, cz + 10.72));
        mGold.add(sph(0.24), M(cx, gy + 16.6, cz + 10.72));
        mGold.add(cyl(0.22, 0.30, 1.8, 8), M(cx, gy + 21.5, cz + 9.8));
        // Iconic Swinging Silver-Gold Botafumeiro Censer suspended from the Santiago Nave Crossing!
        {
          const pivot = new T.Group(); pivot.position.set(cx, gy + 10.2, cz + 0.5);
          const rope = new T.Mesh(cyl(0.035, 0.035, 6.8, 6), goldMat); rope.position.y = -3.4;
          const censer = new T.Mesh(cyl(0.38, 0.18, 0.95, 12), silverPipeMat); censer.position.y = -6.95;
          const cap = new T.Mesh(new T.ConeGeometry(0.42, 0.55, 12), goldMat); cap.position.y = -6.35;
          pivot.add(rope, censer, cap); group.add(pivot); made.meshes += 3;
          swingingCensers.push({ pivot, phase: 0.4 });
        }
        // Sweeping Double-Flight Split Grand Imperial Staircase with Carved Stone Balustrades!
        for (let st = 0; st < 5; st++) box(mTrav, 11.4 - st * 0.55, 0.22, 0.65, cx, gy + st * 0.22 + 0.11, cz + 13.4 - st * 0.62);
        for (const sd of [-1, 1]) {
          box(mTrav, 0.42, 1.15, 3.6, cx + sd * 5.6, gy + 0.72, cz + 12.1);
          mGold.add(sph(0.22), M(cx + sd * 5.6, gy + 1.45, cz + 13.8));
        }
        addCathedralFascia(cx, gy + 6.2, cz + 10.6, 'SANTIAGO DE COMPOSTELA · 圣地亚哥大教堂', 8.8);
        addSacredInterior(cx, gy, cz - 9.2, cz + 8.6, 17, cat, false);
      }

      // 14. MEXICO CITY METROPOLITAN CATHEDRAL — True Scale Model: Cruciform Basilica + Open-Belfry Bell-Cupola Twin Towers + Central Virtues Clock + Sagrario!
      else if (id === 'mexico_cathedral') {
        buildNaveShell(mLime, mTrav, mSlate, cx, gy, cz, 19, 20, 10.2, 2.2, { doorW: 4.6, doorH: 5.0 });
        addTranseptAndApse(mLime, mTrav, mSlate, cx, gy, cz, 19, 20, 10.2, 2.2, { transeptW: 8.5, transeptOut: 5.5, transeptRose: false });
        // Twin Towers with signature Open Arched Belfry Openings, Hanging Bronze Bells & Bell-Shaped Stone Caps!
        for (const sd of [-1, 1]) {
          const tx = cx + sd * 7.8, tz = cz + 9.2;
          box(mLime, 4.2, 14.8, 4.2, tx, gy + 7.4, tz);
          for (const by of [9.6, 12.8]) {
            box(mDarkConc, 1.35, 2.2, 4.35, tx, gy + by, tz);
            mBronze.add(new T.ConeGeometry(0.38, 0.72, 8), M(tx, gy + by + 0.15, tz + 1.8));
          }
          box(mWhite, 4.6, 0.45, 4.6, tx, gy + 14.9, tz);
          const bellPts = V2([[2.1, 0], [1.9, 1.2], [1.4, 2.8], [0.95, 4.2], [0.45, 5.1], [0, 5.4]]);
          mWhite.add(new T.LatheGeometry(bellPts, 16), M(tx, gy + 15.1, tz));
          box(mGold, 0.14, 1.8, 0.14, tx, gy + 21.3, tz);
          box(mGold, 0.9, 0.14, 0.14, tx, gy + 21.7, tz);
        }
        addRibbedDome(mTrav, mWhite, cx, gy + 10.5, cz - 1.5, 4.8, 1.25, 12, 3.2, 2.4, false);
        // Central Neoclassical Clock Tower + Sculpted Statues of the 3 Theological Virtues (Faith, Hope, Charity)!
        box(mWhite, 4.8, 3.8, 1.2, cx, gy + 12.1, cz + 10.1);
        mGold.add(new T.TorusGeometry(0.85, 0.12, 8, 18), M(cx, gy + 12.0, cz + 10.75));
        addMesh(new T.CircleGeometry(0.76, 18), whitePlasterMat, cx, gy + 12.0, cz + 10.72);
        for (const vx of [-1.5, 0, 1.5]) {
          mWhite.add(cyl(0.18, 0.24, 1.6, 8), M(cx + vx, gy + 14.8, cz + 10.2));
          mWhite.add(sph(0.20), M(cx + vx, gy + 15.8, cz + 10.2));
        }
        // Iconic Flanking Sagrario Metropolitano (Red Volcanic Tezontle Stone + Carved White Churrigueresque Facade!)
        box(mBrick, 8.2, 9.5, 10.0, cx + 13.4, gy + 4.75, cz + 5.2);
        box(mWhite, 4.4, 9.8, 0.65, cx + 13.4, gy + 4.9, cz + 10.3);
        mGold.add(sph(0.32), M(cx + 13.4, gy + 10.2, cz + 10.4));
        addCathedralFascia(cx, gy + 6.4, cz + 10.2, 'CATEDRAL METROPOLITANA · 墨西哥城大教堂', 8.8);
        addSacredInterior(cx, gy, cz - 9.2, cz + 8.6, 18, cat, false);
      }

      // 15. LAS LAJAS SANCTUARY (Colombia Gorge) — Fairy-Tale Grey-and-White Neo-Gothic Spires + Canyon Stone Arch Bridge!
      else if (id === 'las_lajas') {
        buildNaveShell(mWhite, mGothic, mSlate, cx, gy, cz, 15, 20, 10.5, 4.2, { doorW: 4.0, doorH: 4.8 });
        // 3 Slender White-and-Grey Neo-Gothic Spires across the Cliffside Facade (central tower lifted above open entrance portal!)
        addPointedGothicPortal(mWhite, cx, gy, cz + 10.1, 4.0, 5.0, true);
        addGothicTower(mWhite, mGothic, cx - 5.2, gy, cz + 9.2, 3.2, 14.5, 9.2, false);
        addGothicTower(mWhite, mGothic, cx + 5.2, gy, cz + 9.2, 3.2, 14.5, 9.2, false);
        addGothicTower(mWhite, mGothic, cx, gy + 5.2, cz + 8.8, 3.6, 12.3, 11.5, false);
        // Dramatic Multi-Arch Stone Viaduct Bridge spanning the Gorge with Gothic Balustrade Lanterns!
        box(mWhite, 6.2, 0.7, 13.5, cx, gy - 0.35, cz + 16.5);
        for (const bz of [cz + 12.2, cz + 16.5, cz + 20.8]) {
          box(mGothic, 5.8, 10.0, 1.5, cx, gy - 5.5, bz);
        }
        for (const sd of [-2.9, 2.9]) {
          box(mWhite, 0.25, 1.0, 13.5, cx + sd, gy + 0.5, cz + 16.5);
          for (const lz of [cz + 12.2, cz + 16.5, cz + 20.8]) {
            box(mWhite, 0.42, 1.45, 0.42, cx + sd, gy + 0.72, lz);
            mGold.add(sph(0.22), M(cx + sd, gy + 1.62, lz));
          }
        }
        // Cascading Foaming White Canyon Waterfall plunging beneath the Las Lajas Viaduct Bridge!
        for (const wfX of [-6.8, 6.8]) {
          addMesh(new T.PlaneGeometry(3.8, 9.6), clearGlassMat, cx + wfX, gy - 4.6, cz + 15.8, 0.28, 0, 0);
          addMesh(new T.PlaneGeometry(4.4, 2.2), whitePlasterMat, cx + wfX, gy - 8.6, cz + 17.2, -Math.PI / 2);
        }
        addCathedralFascia(cx, gy + 5.65, cz + 11.15, 'SANTUARIO DE LAS LAJAS · 拉斯拉哈斯教堂', 8.2);
        addSacredInterior(cx, gy, cz - 9.0, cz + 8.2, 14, cat, false);
      }

      // ========================================================================
      // TOP 5 MODERN & CONTEMPORARY ICONIC CHURCHES (16–20)
      // ========================================================================

      // 16. NOTRE-DAME DU HAUT (RONCHAMP · Le Corbusier, 1955) — Exquisite Sculptural Scale Model: Floating Crab-Shell Concrete Sail Roof + 3D Recessed Splayed Stained-Glass Apertures + 3 Acoustic-Cowl Light Towers + East Pilgrimage Sanctuary + West Concrete Rain-Spout Gargoyle & Geometric Basin!
      else if (id === 'ronchamp') {
        buildNaveShell(mPlaster, mPlaster, null, cx, gy, cz, 16, 15, 7.6, 0, { doorW: 3.6, doorH: 4.2, skipSides: false, noSideGlass: true });
        // Thick battered sculptural white-plaster South & East walls with Le Corbusier's iconic deeply-splayed colored stained-glass apertures!
        addMesh(new T.PlaneGeometry(5.8, 6.8), ronchampWallMat, cx - 4.8, gy + 4.0, cz + 7.58);
        addMesh(new T.PlaneGeometry(5.8, 6.8), ronchampWallMat, cx + 4.8, gy + 4.0, cz + 7.58);
        addMesh(new T.PlaneGeometry(13.8, 6.8), ronchampWallMat, cx + 8.08, gy + 4.0, cz, 0, Math.PI / 2);
        // Iconic East Outdoor Pilgrimage Sanctuary (stepped concrete altar, cantilevered concrete pulpit & tall wooden pilgrimage cross under the sweeping prow overhang!)
        box(mPlaster, 4.4, 0.32, 8.2, cx + 10.6, gy + 0.16, cz);
        box(mPlaster, 2.4, 1.1, 1.1, cx + 10.6, gy + 0.85, cz);
        box(mConc, 1.4, 1.8, 1.1, cx + 9.4, gy + 1.2, cz + 3.4); // Sculptural cantilevered pulpit!
        box(mTimber, 0.18, 4.6, 0.18, cx + 11.4, gy + 2.6, cz - 2.2);
        box(mTimber, 1.8, 0.18, 0.18, cx + 11.4, gy + 3.8, cz - 2.2);
        // 3 Iconic Semicylindrical White Light-Scoop Towers with Open-Front Curved Acoustic Cowl Hoods!
        mPlaster.add(cyl(2.1, 2.35, 14.2, 16), M(cx - 7.8, gy + 7.1, cz - 3.5));
        mPlaster.add(new T.SphereGeometry(2.15, 14, 8, 0, Math.PI * 2, 0, Math.PI * 0.55), M(cx - 7.8, gy + 14.1, cz - 3.5));
        box(mDarkConc, 2.6, 2.2, 0.5, cx - 7.8, gy + 13.6, cz - 1.5); // Recessed acoustic light-scoop opening
        mPlaster.add(cyl(1.65, 1.85, 11.2, 14), M(cx + 7.4, gy + 5.6, cz - 4.8));
        mTerra.add(new T.SphereGeometry(1.68, 12, 8, 0, Math.PI * 2, 0, Math.PI * 0.55), M(cx + 7.4, gy + 11.1, cz - 4.8));
        mPlaster.add(cyl(1.55, 1.75, 10.4, 14), M(cx - 6.8, gy + 5.2, cz + 5.2));
        mDarkConc.add(new T.SphereGeometry(1.58, 12, 8, 0, Math.PI * 2, 0, Math.PI * 0.55), M(cx - 6.8, gy + 10.3, cz + 5.2));
        // Le Corbusier's Famous Sculptural Concrete Rain-Spout Gargoyle + Shimmering Water Stream + Geometric Pyramid & Cylinder Rain-Basin on the West Side!
        box(mConc, 4.4, 0.58, 1.35, cx - 9.8, gy + 7.65, cz + 0.8);
        addMesh(new T.CylinderGeometry(0.10, 0.18, 6.8, 8), clearGlassMat, cx - 11.6, gy + 4.1, cz + 0.8);
        mConc.add(cyl(2.1, 2.3, 0.85, 16), M(cx - 11.6, gy + 0.42, cz + 0.8));
        addMesh(new T.CircleGeometry(1.9, 16), blueGlassMat, cx - 11.6, gy + 0.86, cz + 0.8, -Math.PI / 2);
        mConc.add(new T.ConeGeometry(0.68, 1.75, 4), M(cx - 11.2, gy + 1.45, cz + 0.4));
        mConc.add(cyl(0.42, 0.42, 1.35, 10), M(cx - 12.1, gy + 1.25, cz + 1.3));
        // Luminous Continuous Horizontal Clerestory Light-Sliver & Tiny Pilotis Columns supporting the Floating Concrete Roof!
        addMesh(new T.PlaneGeometry(15.6, 0.42), glowCrossMat, cx, gy + 7.82, cz + 7.56);
        addMesh(new T.PlaneGeometry(14.6, 0.42), glowCrossMat, cx + 8.06, gy + 7.82, cz, 0, Math.PI / 2);
        for (const px of [-6.0, -2.0, 2.0, 6.0]) box(mConc, 0.18, 0.65, 0.18, cx + px, gy + 7.9, cz + 7.6);
        // Le Corbusier's Signature Dramatic Upturned Dark-Concrete Crab-Shell / Boat-Sail Roof (sweeping prow soaring over the East altar!)
        const sailGeo = new T.BoxGeometry(22.4, 1.95, 18.6, 14, 2, 12);
        const pos = sailGeo.attributes.position;
        for (let i = 0; i < pos.count; i++) {
          const px = pos.getX(i), py = pos.getY(i), pz = pos.getZ(i);
          const lift = (px * px) * 0.022 + Math.max(0, pz) * 0.18 + (px > 0 && pz > 0 ? (px * pz) * 0.032 : 0);
          pos.setY(i, py + lift);
        }
        sailGeo.computeVertexNormals();
        const sail = addMesh(sailGeo, darkConcreteMat, cx + 1.4, gy + 8.55, cz + 0.5, 0, 0, 0, true);
        sail.receiveShadow = true;
        addCathedralFascia(cx, gy + 1.1, cz + 8.8, 'RONCHAMP · 朗香教堂 (Le Corbusier)', 7.6);
        addSacredInterior(cx, gy, cz - 6.5, cz + 6.2, 14, cat, true);
      }

      // 17. CHURCH OF THE LIGHT (Osaka · Tadao Ando, 1989) — Exquisite Minimalist Scale Model: Tatami-Modular Board-Formed Concrete Cube + 15° Piercing Wall + Glass Vestibule + Zen Forecourt + Blazing LIGHT CROSS!
      else if (id === 'church_of_light') {
        buildNaveShell(mConc, mConc, null, cx, gy, cz, 12, 18, 7.8, 0, { doorW: 3.4, doorH: 4.2, skipBack: true, noSideGlass: true });
        // Crisp minimalist cantilevered board-formed concrete roof slab with shadow-reveal groove!
        box(mConc, 12.6, 0.58, 18.6, cx, gy + 8.08, cz);
        // Signature 15-degree angled freestanding board-formed concrete entrance wall piercing the pure cube!
        box(mConc, 0.58, 7.6, 12.4, cx - 4.4, gy + 3.8, cz + 8.4, 0, 0.26, 0);
        // Crisp dark-steel-framed glass vestibule screen joining the angled wall & main cube!
        addMesh(new T.PlaneGeometry(3.6, 7.2), clearGlassMat, cx - 2.4, gy + 3.6, cz + 11.4, 0, 0.26);
        box(mDarkConc, 3.6, 0.12, 0.12, cx - 2.4, gy + 7.2, cz + 11.4, 0, 0.26, 0);
        box(mDarkConc, 0.12, 7.2, 0.12, cx - 2.4, gy + 3.6, cz + 11.4, 0, 0.26, 0);
        // Minimalist Osaka Concrete Approach Wall & Japanese Zen Courtyard Framing!
        box(mConc, 16.5, 1.35, 0.42, cx + 1.0, gy + 0.68, cz + 14.2);
        box(mConc, 0.42, 1.35, 6.2, cx + 9.0, gy + 0.68, cz + 11.2);
        // Sculpted Minimalist Dark-Steel Cross standing quietly in the concrete Zen forecourt
        box(mDarkConc, 0.14, 3.4, 0.14, cx + 5.4, gy + 1.7, cz + 11.2);
        box(mDarkConc, 1.4, 0.14, 0.14, cx + 5.4, gy + 2.6, cz + 11.2);
        // THE ICONIC NORTH ALTAR WALL WITH A FULL-HEIGHT OPEN CRUCIFORM CUTOUT ("THE LIGHT CROSS")!
        const zBack = cz - 8.6;
        box(mConc, 5.74, 3.6, 0.72, cx - 3.13, gy + 1.8, zBack);
        box(mConc, 5.74, 3.6, 0.72, cx + 3.13, gy + 1.8, zBack);
        box(mConc, 5.74, 3.6, 0.72, cx - 3.13, gy + 5.92, zBack);
        box(mConc, 5.74, 3.6, 0.72, cx + 3.13, gy + 5.92, zBack);
        // Blazing sunlit luminous Cross panes glowing right inside the concrete aperture + Volumetric White Light Shaft!
        addMesh(new T.PlaneGeometry(0.52, 7.7), glowCrossMat, cx, gy + 3.85, zBack - 0.15);
        addMesh(new T.PlaneGeometry(11.6, 0.52), glowCrossMat, cx, gy + 3.86, zBack - 0.15);
        addMesh(new T.PlaneGeometry(1.15, 9.2), sunbeamWhiteMat, cx, gy + 2.6, zBack + 3.6, 0.85, 0, 0);
        addMesh(new T.PlaneGeometry(8.4, 0.72), sunbeamWhiteMat, cx, gy + 2.4, zBack + 3.4, 0.85, 0, 0);
        addCathedralFascia(cx + 1.6, gy + 5.6, cz + 9.2, 'CHURCH OF THE LIGHT · 光之教堂 (安藤忠雄)', 8.2);
        addSacredInterior(cx, gy, cz - 7.5, cz + 7.2, 11, cat, true);
      }

      // 18. CATHEDRAL OF BRASÍLIA (Oscar Niemeyer, 1970) — Exquisite Modernist Scale Model: 16 Sculptural White Hyperboloid Boomerang Ribs + Compression Ring + Marianne Peretti Stained-Glass Canopy + Mirror Reflecting Pool + Egg Baptistery + Campanário!
      else if (id === 'brasilia') {
        const Rbase = 9.8, Rwaist = 4.2, Rtop = 7.6, Htot = 15.2;
        const rad = (t) => Rwaist + (t < 0.68 ? Math.pow((0.68 - t) / 0.68, 1.55) * (Rbase - Rwaist) : Math.pow((t - 0.68) / 0.32, 1.45) * (Rtop - Rwaist));
        for (let i = 0; i < 16; i++) {
          const a = (i / 16) * Math.PI * 2;
          for (let s = 0; s < 12; s++) {
            const t0 = s / 12, t1 = (s + 1) / 12;
            const r0 = rad(t0), r1 = rad(t1);
            const p0 = [cx + Math.cos(a) * r0, gy + t0 * Htot, cz + Math.sin(a) * r0];
            const p1 = [cx + Math.cos(a) * r1, gy + t1 * Htot, cz + Math.sin(a) * r1];
            const w0 = 0.46 * (1 - t0 * 0.32), w1 = 0.46 * (1 - t1 * 0.32);
            addRibSeg(mPlaster, p0, p1, w0, w1);
          }
        }
        // Continuous White-Concrete Compression Ring binding all 16 Boomerang Ribs at the Waist + Golden Cross above the Oculus!
        mPlaster.add(new T.TorusGeometry(Rwaist + 0.12, 0.36, 8, 32), M(cx, gy + Htot * 0.68, cz, Math.PI / 2, 0, 0));
        mGold.add(new T.BoxGeometry(0.16, 2.8, 0.16), M(cx, gy + Htot + 1.2, cz));
        mGold.add(new T.BoxGeometry(1.4, 0.16, 0.16), M(cx, gy + Htot + 1.9, cz));
        // Marianne Peretti's Vibrant Cerulean-Turquoise-White Stained-Glass Hyperboloid Sky Canopy!
        const glassPts = [];
        for (let s = 0; s <= 12; s++) {
          const t = s / 12;
          const r = Rwaist + (t < 0.68 ? Math.pow((0.68 - t) / 0.68, 1.55) * (Rbase - Rwaist) : Math.pow((t - 0.68) / 0.32, 1.45) * (Rtop - Rwaist));
          glassPts.push(new T.Vector2(r - 0.35, t * (Htot * 0.78)));
        }
        addMesh(new T.LatheGeometry(glassPts, 16), brasiliaGlassMat, cx, gy + 0.1, cz);
        // Shimmering Turquoise Circular Mirror Reflecting Pool Ring + Crisp Raised White-Marble Pool Coping Rim!
        addMesh(new T.RingGeometry(9.9, 13.9, 32), blueGlassMat, cx, gy + 0.06, cz, -Math.PI / 2);
        mPlaster.add(new T.TorusGeometry(13.95, 0.22, 6, 32), M(cx, gy + 0.14, cz, Math.PI / 2, 0, 0));
        // Oscar Niemeyer's Iconic Sculptural Egg-Shaped White Concrete Baptistery Dome beside the Reflecting Pool!
        mPlaster.add(new T.SphereGeometry(2.8, 16, 12, 0, Math.PI * 2, 0, Math.PI * 0.65), M(cx - 12.8, gy + 0.4, cz + 8.5, 0, 0, 0, 1.0, 1.25, 1.0));
        // 3 Sculpted Suspended Flying Angels hanging gracefully inside the Brasília blue-glass crown!
        [[-2.2, 7.8, -1.2, 0.4], [2.4, 8.6, 0.8, -0.5], [0.2, 9.4, -2.5, 0.15]].forEach(([ax, ay, az, rot]) => {
          mPlaster.add(cyl(0.16, 0.28, 1.5, 8), M(cx + ax, gy + ay, cz + az, 0.45, rot, 0));
          mPlaster.add(sph(0.22), M(cx + ax, gy + ay + 0.85, cz + az + 0.25));
          mPlaster.add(new T.BoxGeometry(2.1, 0.08, 0.55), M(cx + ax, gy + ay + 0.35, cz + az - 0.2, 0.2, rot, 0.18));
        });
        // Sculpted Bronze Four Evangelists Statues flanking the entrance causeway!
        for (const sx of [-3.2, -1.8, 1.8, 3.2]) {
          box(mWhite, 0.7, 0.9, 0.7, cx + sx, gy + 0.45, cz + 12.2);
          mBronze.add(cyl(0.22, 0.28, 1.85, 8), M(cx + sx, gy + 1.82, cz + 12.2));
          mBronze.add(sph(0.20), M(cx + sx, gy + 2.9, cz + 12.2));
        }
        // Oscar Niemeyer's Iconic Freestanding Sculptural White Concrete Bell Tower (Campanário) with 4 Suspended Bronze Bells!
        const btx = cx + 13.8, btz = cz + 6.5;
        box(mPlaster, 0.75, 14.5, 1.6, btx - 1.1, gy + 7.25, btz, 0, 0, -0.06);
        box(mPlaster, 0.75, 14.5, 1.6, btx + 1.1, gy + 7.25, btz, 0, 0, 0.06);
        box(mPlaster, 3.6, 0.55, 1.8, btx, gy + 14.6, btz);
        for (const blx of [-0.95, -0.32, 0.32, 0.95]) {
          mBronze.add(new T.ConeGeometry(0.28, 0.65, 8), M(btx + blx, gy + 13.7, btz));
        }
        addCathedralFascia(cx, gy + 1.15, cz + 13.6, 'CATEDRAL DE BRASÍLIA · 巴西利亚大教堂', 8.4);
        addSacredInterior(cx, gy, cz - 7.5, cz + 6.5, 14, cat, true);
      }

      // 19. HALLGRÍMSKIRKJA (Reykjavík · Iceland, 1986) — Exquisite Expressionist Basalt-Column Scale Model + Clock with Hands + Hanging Bells + Viking-Shield Leif Erikson!
      else if (id === 'hallgrimskirkja') {
        buildNaveShell(mWhite, mWhite, mSlate, cx, gy, cz, 14, 18, 9.5, 3.5, { doorW: 3.6, doorH: 4.5 });
        // Iconic Stepped Basalt / Organ-Pipe Vertical Columns Ascending Symmetrically (with open 3.2m x 4.6m central doorway + horizontal basalt joint bands!)
        for (let k = -8; k <= 8; k++) {
          const absK = Math.abs(k);
          const colH = absK === 0 ? 25.5 : absK === 1 ? 21.5 : Math.max(5.2, 20.5 - absK * 2.05);
          const px = cx + k * 1.25;
          const pz = cz + 9.2 + (absK === 0 ? 0.5 : 0);
          if (absK <= 1) {
            const upperH = colH - 4.8;
            box(mWhite, 1.08, upperH, 1.55, px, gy + 4.8 + upperH / 2, pz);
          } else {
            box(mWhite, 1.08, colH, 1.55, px, gy + colH / 2, pz);
          }
          if (absK < 8 && absK > 1) box(mConc, 0.16, colH - 0.3, 1.62, px + (k >= 0 ? 0.62 : -0.62), gy + (colH - 0.3) / 2, pz);
          // Crisp Gothic-Expressionist narrow slit windows along the flanking wings!
          if (absK === 3 || absK === 5) {
            box(mDarkConc, 0.28, colH * 0.45, 0.16, px, gy + colH * 0.46, pz + 0.80);
          }
        }
        // Iconic Bronze Statue of Leif Erikson with Viking Spear & Round Shield on Stepped Basalt Prow Plinth!
        box(mGothic, 2.5, 0.55, 2.5, cx - 4.4, gy + 0.28, cz + 16.2);
        box(mGothic, 1.7, 1.8, 1.7, cx - 4.4, gy + 1.45, cz + 16.2);
        mBronze.add(cyl(0.28, 0.38, 2.3, 8), M(cx - 4.4, gy + 3.5, cz + 16.2));
        mBronze.add(sph(0.26), M(cx - 4.4, gy + 4.85, cz + 16.2));
        mBronze.add(cyl(0.05, 0.05, 3.4, 6), M(cx - 3.88, gy + 4.0, cz + 16.2));
        mBronze.add(cyl(0.42, 0.42, 0.08, 10), M(cx - 4.85, gy + 3.6, cz + 16.4, Math.PI / 2, 0, 0));
        // Central Reykjavík Tower Clock with Hands, Belfry Slit with Hanging Bronze Bell & Verdigris-Tipped Nordic Spire!
        mGold.add(new T.TorusGeometry(0.68, 0.09, 8, 18), M(cx, gy + 21.8, cz + 10.55));
        addMesh(new T.CircleGeometry(0.62, 18), whitePlasterMat, cx, gy + 21.8, cz + 10.52);
        box(mDarkOak, 0.06, 0.42, 0.06, cx, gy + 21.96, cz + 10.58);
        box(mDarkOak, 0.32, 0.06, 0.06, cx + 0.12, gy + 21.8, cz + 10.58);
        box(mDarkConc, 0.52, 2.9, 0.18, cx, gy + 24.4, cz + 10.52);
        mBronze.add(new T.ConeGeometry(0.24, 0.48, 8), M(cx, gy + 24.5, cz + 10.42));
        mCopper.add(new T.ConeGeometry(1.12, 4.9, 4), M(cx, gy + 27.95, cz + 9.7, 0, Math.PI / 4, 0));
        box(mGold, 0.14, 2.2, 0.14, cx, gy + 31.2, cz + 9.7);
        box(mGold, 1.1, 0.14, 0.14, cx, gy + 31.6, cz + 9.7);
        addCathedralFascia(cx, gy + 6.4, cz + 10.7, 'HALLGRÍMSKIRKJA · 哈尔格林姆教堂', 7.8);
        addSacredInterior(cx, gy, cz - 8.2, cz + 7.5, 13, cat, true);
      }

      // 20. THORNCROWN CHAPEL (Arkansas Forest · E. Fay Jones, 1980) — Exquisite 425-Pane Mullioned Glass Forest Sanctuary + Interlaced Oak Diamond Trusses + Twin Prairie Lanterns!
      else if (id === 'thorncrown') {
        const tw = 9.5, td = 18.5, wallH = 8.4, roofH = 4.6;
        // Native Arkansas fieldstone low perimeter base wall (1.1m tall)
        box(mGothic, tw, 1.1, 0.6, cx, gy + 0.55, cz - td / 2);
        box(mGothic, 0.6, 1.1, td, cx - tw / 2, gy + 0.55, cz);
        box(mGothic, 0.6, 1.1, td, cx + tw / 2, gy + 0.55, cz);
        // 425-Pane Transparent Crystal Glass Curtain Walls with Crisp Dark-Oak Mullion Grid!
        addMesh(new T.PlaneGeometry(td, wallH - 1.1), thorncrownGlassMat, cx - tw / 2 + 0.1, gy + 1.1 + (wallH - 1.1) / 2, cz, 0, Math.PI / 2);
        addMesh(new T.PlaneGeometry(td, wallH - 1.1), thorncrownGlassMat, cx + tw / 2 - 0.1, gy + 1.1 + (wallH - 1.1) / 2, cz, 0, -Math.PI / 2);
        addMesh(new T.PlaneGeometry(tw, wallH - 1.1), thorncrownGlassMat, cx, gy + 1.1 + (wallH - 1.1) / 2, cz - td / 2 + 0.1);
        // Iconic Intricate Interlaced Dark-Oak Diamond Gothic-Modernist Truss Frames + Central King-Posts + Twin Glowing Prairie Lanterns!
        const half = tw / 2 + 0.6, slopeL = Math.hypot(half, roofH), ang = Math.atan2(roofH, half);
        for (let bz = cz - td / 2 + 0.6; bz <= cz + td / 2 - 0.6; bz += 2.4) {
          for (const sd of [-1, 1]) {
            box(mTimber, 0.22, wallH, 0.22, cx + sd * (tw / 2), gy + wallH / 2, bz);
            box(mTimber, slopeL, 0.24, 0.22, cx + sd * (half / 2), gy + wallH + roofH / 2, bz, 0, 0, -sd * ang);
            box(mTimber, 4.6, 0.14, 0.14, cx + sd * 2.1, gy + wallH + 1.1, bz, 0, 0, sd * 0.62);
            box(mTimber, 3.8, 0.14, 0.14, cx + sd * 1.4, gy + wallH + 2.4, bz, 0, 0, -sd * 0.72);
            // Twin Rows of Custom Prairie-Style Wrought-Iron & Glowing Amber Lanterns!
            if (Math.abs(bz - cz) < 6.5) {
              box(mDarkConc, 0.05, 1.8, 0.05, cx + sd * 3.1, gy + wallH - 1.2, bz);
              box(mFlame, 0.28, 0.38, 0.28, cx + sd * 3.1, gy + wallH - 2.2, bz);
              box(mDarkConc, 0.42, 0.06, 0.42, cx + sd * 3.1, gy + wallH - 2.0, bz);
            }
          }
          // Horizontal tie beam + central vertical king-post diamond filigree!
          box(mTimber, tw, 0.16, 0.16, cx, gy + wallH - 0.3, bz);
          box(mTimber, 0.12, roofH * 0.85, 0.12, cx, gy + wallH + roofH * 0.42, bz);
        }
        // Timber Roof Shell with Open Central Glass Skylight Strip!
        for (const sd of [-1, 1]) {
          box(mTimber, slopeL * 0.84, 0.16, td + 0.8, cx + sd * (half * 0.56), gy + wallH + roofH * 0.44 + 0.15, cz, 0, 0, -sd * ang);
        }
        addMesh(new T.PlaneGeometry(1.6, td + 0.6), clearGlassMat, cx, gy + wallH + roofH + 0.08, cz, -Math.PI / 2);
        // Surrounding Lush Ozark Woodland Forest Canopy framing Thorncrown's 425-pane glass walls!
        const forestTrees = [
          [-8.8, -8.5, 9.2], [-9.4, -2.5, 10.6], [-8.6, 4.2, 8.8], [-7.8, 10.2, 7.6],
          [8.8, -8.2, 9.8], [9.5, -1.8, 11.0], [8.6, 4.6, 9.0], [7.8, 10.4, 7.8],
          [-4.2, -13.2, 10.4], [0.5, -14.0, 11.4], [4.8, -13.0, 9.6]
        ];
        forestTrees.forEach(([tx, tz, th]) => {
          mTimber.add(cyl(0.24, 0.38, th * 0.52, 7), M(cx + tx, gy + th * 0.26, cz + tz));
          mOrangeLeaf.add(sph(2.2), M(cx + tx, gy + th * 0.56, cz + tz));
          mOrangeLeaf.add(sph(1.75), M(cx + tx + 0.85, gy + th * 0.64, cz + tz - 0.5));
          mOrangeLeaf.add(sph(1.65), M(cx + tx - 0.75, gy + th * 0.72, cz + tz + 0.55));
        });
        addCathedralFascia(cx, gy + 8.15, cz + td / 2 + 0.35, 'THORNCROWN CHAPEL · 荆棘冠玻璃礼拜堂', 7.8);
        addSacredInterior(cx, gy, cz - 7.8, cz + 7.2, 8.8, cat, true);
      }
    });

    /* ---------------- Flush All Merged Architectural Meshes ---------------- */
    mTrav.mesh(travMat); mWhite.mesh(whiteMarbleMat); mGothic.mesh(gothicGreyMat);
    mLime.mesh(limestoneMat); mSand.mesh(sandstoneMat); mBrick.mesh(brickRedMat);
    mTerra.mesh(terracottaDomeMat); mTuscan.mesh(tuscanMat); mSlate.mesh(slateRoofMat);
    mCopper.mesh(copperMat); mGold.mesh(goldMat, false); mBronze.mesh(bronzeMat, false);
    mConc.mesh(concreteMat); mDarkConc.mesh(darkConcreteMat, false); mPlaster.mesh(whitePlasterMat);
    mTimber.mesh(timberMat);
    mSilverPipe.mesh(silverPipeMat, false); mDarkOak.mesh(darkOakMat, false); mFlame.mesh(candleFlameMat, false); mIvory.mesh(ivoryKeyMat, false);
    mOrangeLeaf.mesh(new T.MeshLambertMaterial({ color: 0x266330 }));
    mOrangeFruit.mesh(new T.MeshLambertMaterial({ color: 0xf97316, emissive: 0x2a1002 }), false);
    mGaudi.mesh(gaudiTowerMat);

    /* ---------------- Low-Profile Museum Crystal Portal Plinths ---------------- */
    const floatingCrystals = [];
    const octGeo = new T.OctahedronGeometry(0.24, 0);
    const ringGeo = new T.TorusGeometry(0.38, 0.026, 8, 24);
    const mPlinth = new Merger(), mPlinthGold = new Merger();
    (P.portalPlinths || []).forEach((item) => {
      const { x, y, z, cat } = item;
      mPlinth.add(new T.BoxGeometry(0.54, 0.12, 0.54), M(x, y + 0.06, z));
      mPlinth.add(cyl(0.18, 0.22, 0.52, 12), M(x, y + 0.38, z));
      mPlinthGold.add(new T.BoxGeometry(0.46, 0.06, 0.46), M(x, y + 0.67, z));
      const crystal = new T.Mesh(octGeo, crystalMat); crystal.position.set(x, y + 1.06, z);
      const halo = new T.Mesh(ringGeo, goldMat); halo.position.set(x, y + 1.06, z);
      group.add(crystal, halo);
      floatingCrystals.push({ crystal, halo, baseY: y + 1.06, phase: cat.num * 0.65 });
      made.meshes += 2;
    });
    mPlinth.mesh(whiteMarbleMat, false);
    mPlinthGold.mesh(goldMat, false);

    /* ---------------- Carved Oak Wayfinding Fingerposts ---------------- */
    function makeSlatTex(label) {
      const c = cvs(320, 64), x = c.getContext('2d');
      x.fillStyle = '#4a3320'; x.fillRect(0, 0, 320, 64);
      x.strokeStyle = 'rgba(218,196,152,0.5)'; x.lineWidth = 2; x.strokeRect(5, 5, 310, 54);
      x.fillStyle = '#f5ead2'; x.font = '700 22px "Songti SC", "PingFang SC", serif';
      x.textAlign = 'center'; x.textBaseline = 'middle'; x.fillText(label, 160, 33);
      return finTex(c, false);
    }
    const mPosts = new Merger();
    (P.wayposts || []).forEach((wp) => {
      mPosts.add(cyl(0.09, 0.11, 3.0, 8), M(wp.x, wp.y + 1.5, wp.z));
      (wp.arms || []).slice(0, 3).forEach((arm, idx) => {
        const ay = wp.y + 2.65 - idx * 0.36;
        const dx = Math.sin(arm.dir || 0), dz = Math.cos(arm.dir || 0);
        const tex = makeSlatTex(arm.label);
        const slat = addMesh(new T.BoxGeometry(1.15, 0.22, 0.06), new T.MeshLambertMaterial({ map: tex, emissiveMap: tex, emissive: 0xffe8c0, emissiveIntensity: 0.32 }), wp.x + dx * 0.62, ay, wp.z + dz * 0.62, 0, arm.dir || 0);
        slat.castShadow = true;
      });
    });
    mPosts.mesh(timberMat);

    /* ---------------- Wildflowers, Swans, Sailboats & Distant Horizon Wolds ---------------- */
    if (P.tufts && P.tufts.length) {
      const c = cvs(256, 64), x = c.getContext('2d'), r = rng(5);
      for (let k = 0; k < 4; k++) {
        const ox = k * 64;
        for (let i = 0; i < 22; i++) {
          const bx = ox + 6 + r() * 52, top = 12 + r() * 28, lean = (r() - 0.5) * 14;
          x.strokeStyle = ['#5a9038', '#6aa042', '#4e8032'][(r() * 3) | 0]; x.lineWidth = 1.8;
          x.beginPath(); x.moveTo(bx, 64); x.quadraticCurveTo(bx + lean * 0.3, (64 + top) / 2, bx + lean, top); x.stroke();
          if (k >= 2 && r() < 0.55) { x.fillStyle = ['#f2d22a', '#ffffff', '#b07ad8'][(r() * 3) | 0]; x.beginPath(); x.arc(bx + lean, top, 2.5, 0, 7); x.fill(); }
        }
      }
      const tuftMat = new T.MeshLambertMaterial({ map: finTex(c, false), alphaTest: 0.45, vertexColors: true });
      const tg = new Geo(), HT = [0.55, 1.3, 0.95, 0.65], WD = [0.85, 0.85, 0.85, 0.85], white = [1, 1, 1];
      P.tufts.forEach(([tx, ty, tz, k, sc]) => {
        const h = HT[k] * sc, w = WD[k] * sc * 0.5, a = ((tx * 12.9898 + tz * 78.233) % 3.14);
        const u0 = k * 0.25 + 0.004, u1 = (k + 1) * 0.25 - 0.004;
        for (const aa of [a, a + Math.PI / 2]) {
          const dx = Math.cos(aa) * w, dz = Math.sin(aa) * w;
          const A = [tx - dx, ty, tz - dz], Bq = [tx + dx, ty, tz + dz], Cq = [tx + dx, ty + h, tz + dz], Dq = [tx - dx, ty + h, tz - dz];
          tg.quad(A, Bq, Cq, Dq, [u0, 0], [u1, 0], [u1, 1], [u0, 1], white);
          tg.quad(Bq, A, Dq, Cq, [u1, 0], [u0, 0], [u0, 1], [u1, 1], white);
        }
      });
      tg.mesh(tuftMat, true);
    }

    // Bobbing Mediterranean Sailboats around the Sacred Island Coast
    const bobbingBoats = [];
    [[192, 362, 0.4], [358, 192, -1.1], [26, 200, 1.2], [320, 322, -0.7], [68, 56, 2.1]].forEach(([bx, bz, ry], idx) => {
      const bg = new T.Group(); bg.position.set(bx, world.WATER_Y - 0.05, bz); bg.rotation.y = ry;
      const hull = new T.Mesh(new T.BoxGeometry(2.2, 0.72, 5.2), timberMat); hull.position.y = 0.25;
      const mast = new T.Mesh(cyl(0.07, 0.09, 5.4, 8), timberMat); mast.position.y = 2.9;
      const sail = new T.Mesh(new T.PlaneGeometry(2.6, 3.8), whitePlasterMat); sail.position.set(0.05, 3.1, 0.3); sail.rotation.y = Math.PI / 2;
      bg.add(hull, mast, sail); group.add(bg); made.meshes += 3;
      bobbingBoats.push({ grp: bg, baseY: world.WATER_Y - 0.05, phase: idx * 1.4 });
    });

    // Ornate Wrought-Iron Cathedral Plaza Streetlamps flanking every Cathedral Forecourt!
    const mLampIron = new Merger(), mLampGlass = new Merger();
    (P.cathedralSites || []).forEach((site) => {
      const { x: cx, y: gy, z1 } = site;
      for (const sd of [-1, 1]) {
        const lx = cx + sd * 6.4, lz = z1 + 4.8;
        mLampIron.add(cyl(0.08, 0.14, 0.45, 8), M(lx, gy + 0.22, lz));
        mLampIron.add(cyl(0.045, 0.06, 3.2, 8), M(lx, gy + 2.0, lz));
        mLampGlass.add(cyl(0.20, 0.14, 0.42, 6), M(lx, gy + 3.78, lz));
        mLampIron.add(new T.ConeGeometry(0.26, 0.26, 6), M(lx, gy + 4.10, lz));
      }
    });
    mLampIron.mesh(darkConcreteMat);
    const streetLampGlowMat = new T.MeshBasicMaterial({ color: 0xffebb0 });
    mLampGlass.mesh(streetLampGlowMat, false);

    // Distant Mediterranean Coastal Horizon Hills (Wolds) & Soft High Sky Clouds!
    const woldGeo = new T.RingGeometry(245, 760, 48, 4);
    woldGeo.rotateX(-Math.PI / 2);
    const wPos = woldGeo.attributes.position;
    for (let i = 0; i < wPos.count; i++) {
      const wx = wPos.getX(i), wz = wPos.getZ(i), rr = Math.hypot(wx, wz);
      const hill = Math.max(0, (rr - 290) / 470) * (24 + Math.sin(wx * 0.015) * 14 + Math.cos(wz * 0.013) * 12);
      wPos.setY(i, world.WATER_Y - 2.5 + hill);
    }
    woldGeo.computeVertexNormals();
    addMesh(woldGeo, new T.MeshLambertMaterial({ color: 0x6f9960 }), 192, 0, 192);

    // 12 High Drifting Volumetric Painterly Cumulus Clouds across the Mediterranean Sky!
    function makeSkyCloudTex(seed) {
      const c = cvs(256, 128), x = c.getContext('2d'), r = rng(seed);
      for (let i = 0; i < 18; i++) {
        const px = 40 + r() * 176, py = 62 + (r() - 0.5) * 32, rr = 22 + r() * 32;
        const g = x.createRadialGradient(px, py - 4, 3, px, py, rr);
        g.addColorStop(0, 'rgba(255,255,255,0.92)'); g.addColorStop(0.6, 'rgba(248,252,255,0.52)'); g.addColorStop(1, 'rgba(240,248,255,0)');
        x.fillStyle = g; x.beginPath(); x.arc(px, py, rr, 0, Math.PI * 2); x.fill();
      }
      return finTex(c, false);
    }
    for (let ci = 0; ci < 12; ci++) {
      const ca = (ci / 12) * Math.PI * 2, dist = 120 + (ci % 3) * 65;
      const cMat = new T.MeshBasicMaterial({ map: makeSkyCloudTex(300 + ci), transparent: true, depthWrite: false, fog: false, opacity: 0.78, side: T.DoubleSide });
      const cm = new T.Mesh(new T.PlaneGeometry(54 + (ci % 3) * 18, 22 + (ci % 2) * 8), cMat);
      cm.position.set(192 + Math.cos(ca) * dist, 82 + (ci % 3) * 10, 192 + Math.sin(ca) * dist);
      cm.rotation.x = Math.PI / 2; cm.renderOrder = -6;
      group.add(cm); made.meshes++;
      skyClouds.push({ mesh: cm, mat: cMat, baseX: cm.position.x, speed: 0.35 + (ci % 4) * 0.12, phase: ci * 1.1 });
    }

    function update(dt, time, cam, night) {
      const nf = night || 0;
      const gBoost = 0.56 + nf * 0.62;
      roseMatGothic.emissiveIntensity = gBoost;
      roseMatChartres.emissiveIntensity = gBoost + 0.06;
      lancetBlueMat.emissiveIntensity = gBoost;
      lancetWarmMat.emissiveIntensity = gBoost;
      lancetEmeraldMat.emissiveIntensity = gBoost;
      berniniGloryMat.emissiveIntensity = 0.72 + nf * 0.45;
      const flk = 0.90 + Math.sin(time * 11.3) * 0.06 + Math.sin(time * 6.7) * 0.04;
      candleFlameMat.color.setRGB(1, 0.86 * flk, 0.52 * flk);
      for (const sc of swingingCensers) {
        sc.pivot.rotation.z = Math.sin(time * 1.35 + sc.phase) * 0.42;
      }
      for (const cl of skyClouds) {
        cl.mesh.position.x = cl.baseX + Math.sin(time * 0.04 * cl.speed + cl.phase) * 28;
        cl.mat.opacity = Math.max(0.08, 0.78 * (1 - nf * 0.88));
      }
      for (const b of bobbingBoats) {
        b.grp.position.y = b.baseY + Math.sin(time * 1.2 + b.phase) * 0.12;
        b.grp.rotation.z = Math.sin(time * 0.9 + b.phase) * 0.04;
      }
      for (const fc of floatingCrystals) {
        const bob = Math.sin(time * 2.1 + fc.phase) * 0.14;
        fc.crystal.position.y = fc.baseY + bob;
        fc.crystal.rotation.y = time * 1.3 + fc.phase;
        fc.halo.position.y = fc.baseY + bob;
        fc.halo.rotation.x = Math.sin(time * 1.4 + fc.phase) * 0.55;
        fc.halo.rotation.y = time * 0.85;
      }
    }

    return { update, stats: () => made };
  }

  root.CIProps = { build };
})(window);

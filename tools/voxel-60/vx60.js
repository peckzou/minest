/* minest-voxel-60 */
/* Minest · 体素世界 60 (iPhoneDuo60.html) — My World turned into a real block world.
   How it converts: the island / room you are in is built by My World's own 🚶 Walk-in builder (the same layout,
   terrain, pieces, Studio models, people and animals). This layer opens that builder unseen, reads the finished
   three.js scene once, and rasterises every surface into a voxel grid (S voxels per world block). Textured box
   parts keep their Minecraft texture as the block face; models and coloured parts become colour blocks sampled from
   their own texture or colour. Ground is filled solid under the terrain, doors stay walkable, pictures and signs stay
   as panels. The result is a chunked voxel world with face culling, corner AO and skylight, where you can look
   around (阅览), walk (🚶), fly (✈), break (⛏) and place (🧱) blocks. Edits are saved on this device per island.
   Nothing in the original app changes: the layer only reads MinestDisplay / MinestWorldFold / MinestAssets3D and
   presses the app's own 🚶 Walk in button, then closes it again.
   Ideas taken from mūse's voxel.html (top-layer popover overlay, orbit view, read-only data access) and from the
   Oia voxel engine (chunked block world, walk / fly / build). */
(function () {
  'use strict';
  if (window.MinestVoxel60) return;

  var MD = function () { return window.MinestDisplay || null; };
  var WF = function () { return window.MinestWorldFold || null; };
  var CH = 16;
  var LS_KEY = 'minest.vx60.';

  /* ================================================================ styles + DOM */
  var css = document.createElement('style');
  css.id = 'vx60-style';
  css.textContent = [
    '#vx60-btn{position:fixed;left:14px;bottom:14px;top:auto;right:auto;margin:0;z-index:2147483000;background:#2f9e44;color:#fff;border:0;border-radius:999px;padding:11px 18px;font:700 15px/1.1 system-ui,sans-serif;box-shadow:0 4px 18px rgba(0,0,0,.35);cursor:pointer;display:none}',
    '#vx60-btn.show{display:block}',
    'html.duo-halfopen #vx60-btn{bottom:calc(50vh - 58px)}',
    '#vx60{position:fixed;inset:0;width:100%;height:100%;max-width:none;max-height:none;margin:0;padding:0;border:0;z-index:2147483001;background:#8ecbff;display:none;overflow:hidden;font:500 13px/1.3 system-ui,sans-serif;color:#eef2f7;-webkit-user-select:none;user-select:none;touch-action:none}',
    '#vx60.open{display:block}',
    '#vx60 .st{position:absolute;left:0;right:0;top:0;bottom:0}',
    '#vx60 .st canvas{display:block;width:100%;height:100%}',
    '#vx60 .top{position:absolute;left:0;right:0;top:0;display:flex;flex-wrap:wrap;gap:6px;align-items:center;padding:8px 10px;padding-top:max(8px,env(safe-area-inset-top));background:rgba(18,24,36,.82)}',
    '#vx60 .top b{font-size:15px;margin-right:4px}',
    '#vx60 .top .ctx{opacity:.85;margin-right:auto;max-width:40vw;overflow:hidden;text-overflow:ellipsis;white-space:nowrap}',
    '#vx60 button{background:#334155;color:#e2e8f0;border:1px solid #4b5b73;border-radius:8px;padding:6px 9px;cursor:pointer;font:600 13px system-ui,sans-serif}',
    '#vx60 button.on{background:#2f9e44;border-color:#2f9e44;color:#fff}',
    '#vx60 .msg{position:absolute;left:50%;top:44%;transform:translate(-50%,-50%);background:rgba(15,23,42,.9);padding:16px 20px;border-radius:12px;font:600 15px system-ui;max-width:82%;text-align:center;display:none;z-index:5}',
    '#vx60 .cross{position:absolute;left:50%;top:50%;transform:translate(-50%,-50%);font:300 26px system-ui;text-shadow:0 1px 2px #000;display:none;pointer-events:none}',
    '#vx60.walk .cross{display:block}',
    '#vx60 .ctl{position:absolute;left:0;right:0;bottom:0;pointer-events:none}',
    '#vx60 .ctl > *{pointer-events:auto}',
    '#vx60 .bar{position:absolute;left:50%;bottom:max(10px,env(safe-area-inset-bottom));transform:translateX(-50%);display:flex;gap:3px;padding:3px;background:rgba(0,0,0,.45);border:2px solid rgba(0,0,0,.6)}',
    '#vx60 .bar .sl{width:40px;height:40px;border:2px solid rgba(255,255,255,.25);display:flex;align-items:center;justify-content:center;cursor:pointer}',
    '#vx60 .bar .sl.on{border-color:#fff}',
    '#vx60 .bar .sl canvas{width:30px;height:30px;image-rendering:pixelated}',
    '#vx60 .joy{position:absolute;left:22px;bottom:84px;width:120px;height:120px;border-radius:50%;background:rgba(255,255,255,.14);border:2px solid rgba(255,255,255,.35);display:none}',
    '#vx60 .joy i{position:absolute;left:50%;top:50%;width:48px;height:48px;margin:-24px 0 0 -24px;border-radius:50%;background:rgba(255,255,255,.5)}',
    '#vx60 .pad{position:absolute;right:16px;bottom:84px;display:none;flex-direction:column;gap:8px}',
    '#vx60 .pad button{width:56px;height:56px;font-size:22px;border-radius:14px;background:rgba(30,41,59,.75)}',
    '#vx60.walk .joy{display:block}',
    '#vx60.walk .pad{display:flex}',
    '#vx60 .info{position:absolute;left:10px;top:58px;font:12px ui-monospace,monospace;text-shadow:0 1px 2px #000;opacity:.9;pointer-events:none}',
    /* Duo half folded: the world on the upper screen, the controls on the lower screen */
    'html.duo-halfopen #vx60 .st{bottom:50%}',
    'html.duo-halfopen #vx60 .ctl{top:50%;background:linear-gradient(#1b2433,#121826)}',
    'html.duo-halfopen #vx60 .msg{top:25%}',
    'html.duo-halfopen #vx60 .cross{top:25%}',
    'html.duo-halfopen #vx60 .joy{display:block;left:28px;top:50%;bottom:auto;transform:translateY(-50%);width:150px;height:150px}',
    'html.duo-halfopen #vx60 .pad{display:flex;flex-direction:row;flex-wrap:wrap;width:136px;right:24px;top:50%;bottom:auto;transform:translateY(-50%)}',
    'html.duo-halfopen #vx60 .ctl .hint{display:block}',
    '#vx60 .ctl .hint{display:none;position:absolute;left:0;right:0;top:10px;text-align:center;opacity:.7}',
  ].join('\n');
  document.head.appendChild(css);

  var btn = document.createElement('button');
  btn.id = 'vx60-btn'; btn.type = 'button'; btn.textContent = '🧊 体素世界 60';
  btn.setAttribute('popover', 'manual');
  var ov = document.createElement('div');
  ov.id = 'vx60'; ov.setAttribute('popover', 'manual');
  ov.innerHTML =
    '<div class="st"></div><div class="cross">+</div><div class="info"></div>' +
    '<div class="top"><b>🧊 体素世界 60</b><span class="ctx"></span>' +
    '<button data-m="view">阅览</button><button data-m="walk">🚶 行走</button><button data-m="fly">✈ 飞行</button>' +
    '<button data-t="break">⛏ 挖</button><button data-t="place">🧱 放</button>' +
    '<button data-s="2">×2</button><button data-s="4">×4</button><button data-s="8">×8</button>' +
    '<button data-a="rot">🔄</button><button data-a="redo">↻ 重新转换</button><button data-a="reset">⟲ 撤销改动</button><button data-a="x">✕</button></div>' +
    '<div class="ctl"><div class="hint">上屏是体素世界 · 下屏是操作区</div><div class="joy"><i></i></div>' +
    '<div class="pad"><button data-p="up">⬆</button><button data-p="down">⬇</button><button data-p="act">⛏</button><button data-p="run">⏩</button></div>' +
    '<div class="bar"></div></div>' +
    '<div class="msg"></div>';
  function mount() {
    if (!btn.isConnected) document.body.appendChild(btn);
    if (!ov.isConnected) document.body.appendChild(ov);
  }
  mount();
  var $ = function (s) { return ov.querySelector(s); };
  var stage = $('.st'), msgEl = $('.msg'), infoEl = $('.info'), ctxEl = $('.ctx'), barEl = $('.bar');
  function msg(t) { msgEl.textContent = t || ''; msgEl.style.display = t ? 'block' : 'none'; }
  function showPop(e) { try { if (e.showPopover && !e.matches(':popover-open')) e.showPopover(); } catch (x) {} }
  function hidePop(e) { try { if (e.hidePopover && e.matches(':popover-open')) e.hidePopover(); } catch (x) {} }

  /* ================================================================ helpers */
  var clamp = function (v, a, b) { return v < a ? a : v > b ? b : v; };
  var lin = function (v) { return Math.pow(v, 2.2); };
  function hashStr(s) { var h = 5381; for (var i = 0; i < s.length; i += (s.length > 4000 ? 7 : 1)) h = ((h << 5) + h + s.charCodeAt(i)) | 0; return (h >>> 0).toString(36) + s.length.toString(36); }
  function sleep(ms) { return new Promise(function (r) { setTimeout(r, ms); }); }
  function frame() { return new Promise(function (r) { requestAnimationFrame(function () { r(); }); }); }

  /* ================================================================ block registry + atlas */
  var ATN = 32, TS = 16;                       // atlas: 32 × 32 tiles of 16 px
  var atlasCv = document.createElement('canvas'); atlasCv.width = atlasCv.height = ATN * TS;
  var atlasCx = atlasCv.getContext('2d');
  var REG = null;                              // { list: [block], byKey: {}, tiles: {} }
  function regReset() {
    REG = { list: [null], byKey: {}, tiles: {}, nTiles: 0 };
    atlasCx.clearRect(0, 0, atlasCv.width, atlasCv.height);
    tileOf('white', function (cx, x, y) { cx.fillStyle = '#fff'; cx.fillRect(x, y, TS, TS); cx.fillStyle = 'rgba(0,0,0,.07)'; for (var i = 0; i < 18; i++) cx.fillRect(x + ((i * 7) % 16), y + ((i * 11) % 16), 1, 1); });
  }
  function tileOf(key, draw) {
    if (REG.tiles[key] !== undefined) return REG.tiles[key];
    var i = REG.nTiles++;
    if (i >= ATN * ATN) i = 0;
    var x = (i % ATN) * TS, y = Math.floor(i / ATN) * TS;
    try { draw(atlasCx, x, y); } catch (e) { atlasCx.fillStyle = '#999'; atlasCx.fillRect(x, y, TS, TS); }
    REG.tiles[key] = i;
    return i;
  }
  // a block: { key, tile, col:[r,g,b] linear tint, kind:'solid'|'glass'|'water'|'door'|'ground', name }
  function block(key, mk) {
    var id = REG.byKey[key];
    if (id) return id;
    var b = mk(); b.key = key;
    id = REG.list.length;
    if (id > 65000) return 1;
    REG.list.push(b); REG.byKey[key] = id;
    return id;
  }
  function colorBlock(r, g, b, kind) {
    r = r & 0xf0 | 8; g = g & 0xf0 | 8; b = b & 0xf0 | 8;   // 4 bits a channel keeps the palette small
    var hex = ((1 << 24) | (r << 16) | (g << 8) | b).toString(16).slice(1);
    return block('c' + hex + (kind && kind !== 'solid' ? ':' + kind : ''), function () {
      return { tile: REG.tiles.white, col: [lin(r / 255), lin(g / 255), lin(b / 255)], kind: kind || 'solid', hex: '#' + hex };
    });
  }

  /* texture names → the app's own texture URLs (to know water, glass, ground and doors by name) */
  var NAMES = ['water', 'glass', 'grass_top', 'grass_side', 'dirt', 'stone', 'sand', 'snow', 'snow_side', 'moss', 'moss_side', 'gravel', 'path', 'cobble', 'door', 'oak_door', 'spruce_door', 'farmland', 'clay', 'mud', 'podzol', 'coarse_dirt', 'andesite', 'leaves', 'log', 'oak', 'plaster', 'brick'];
  var GROUND = { grass_top: 1, grass_side: 1, dirt: 1, stone: 1, sand: 1, snow: 1, snow_side: 1, moss: 1, moss_side: 1, gravel: 1, path: 1, farmland: 1, clay: 1, mud: 1, podzol: 1, coarse_dirt: 1, andesite: 1 };
  var srcName = {};
  function learnNames() {
    srcName = {};
    var md = MD(); if (!md || !md.tex) return;
    NAMES.forEach(function (n) { try { var u = md.tex(n); if (u) srcName[u] = n; } catch (e) {} });
  }
  function imgSrc(img) { return img && (img.currentSrc || img.src) || ''; }

  function tileBlock(tex, tint, transparent, opacity) {
    var img = tex.image, src = imgSrc(img) || ('uuid:' + tex.uuid);
    var name = srcName[src] || '';
    var kind = name === 'water' ? 'water' : name === 'glass' || (transparent && opacity < .8) ? 'glass' : /door/.test(name) ? 'door' : GROUND[name] ? 'ground' : transparent && opacity < .95 ? 'water' : 'solid';
    var th = tint ? tint.getHexString() : 'ffffff';
    var key = 't' + (name || hashStr(src)) + ':' + th + ':' + kind;
    return block(key, function () {
      var t = tileOf('img:' + src, function (cx, x, y) {
        if (img && (img.width || img.naturalWidth)) { cx.imageSmoothingEnabled = false; cx.drawImage(img, x, y, TS, TS); }
        else { cx.fillStyle = '#9a8f7a'; cx.fillRect(x, y, TS, TS); }
      });
      return { tile: t, col: tint ? [tint.r, tint.g, tint.b] : [1, 1, 1], kind: kind, name: name, src: src };
    });
  }

  /* reading a model's texture colour at a uv */
  var pixCache = new WeakMap();
  function pixels(img) {
    if (!img) return null;
    var c = pixCache.get(img); if (c !== undefined) return c;
    c = null;
    try {
      var w = img.width || img.naturalWidth, h = img.height || img.naturalHeight;
      if (w && h) {
        var k = Math.min(1, 256 / Math.max(w, h)), cw = Math.max(1, Math.round(w * k)), chh = Math.max(1, Math.round(h * k));
        var cv = document.createElement('canvas'); cv.width = cw; cv.height = chh;
        var x = cv.getContext('2d'); x.drawImage(img, 0, 0, cw, chh);
        c = { w: cw, h: chh, d: x.getImageData(0, 0, cw, chh).data };
      }
    } catch (e) { c = null; }
    pixCache.set(img, c);
    return c;
  }

  /* ================================================================ voxel world */
  function VWorld(W, H, D, S, ox, oy, oz) {
    this.W = W; this.H = H; this.D = D; this.S = S; this.ox = ox; this.oy = oy; this.oz = oz;
    this.v = new Uint16Array(W * H * D);
    this.top = new Int16Array(W * D);
    this.dirty = {};
  }
  VWorld.prototype.i = function (x, y, z) { return (y * this.D + z) * this.W + x; };
  VWorld.prototype.in = function (x, y, z) { return x >= 0 && y >= 0 && z >= 0 && x < this.W && y < this.H && z < this.D; };
  VWorld.prototype.get = function (x, y, z) { return this.in(x, y, z) ? this.v[this.i(x, y, z)] : 0; };
  VWorld.prototype.put = function (x, y, z, id) { if (this.in(x, y, z)) this.v[this.i(x, y, z)] = id; };
  VWorld.prototype.opaque = function (x, y, z) { var id = this.get(x, y, z); if (!id) return false; var k = REG.list[id].kind; return k !== 'glass' && k !== 'water'; };
  VWorld.prototype.solid = function (x, y, z) {
    if (y < 0) return true;
    var id = this.get(x, y, z); if (!id) return false; var k = REG.list[id].kind; return k !== 'water' && k !== 'door';
  };
  VWorld.prototype.colTop = function (x, z) {
    var y = this.H - 1; while (y >= 0 && !this.opaque(x, y, z)) y--; this.top[z * this.W + x] = y + 1;
  };
  VWorld.prototype.tops = function () { for (var z = 0; z < this.D; z++) for (var x = 0; x < this.W; x++) this.colTop(x, z); };
  VWorld.prototype.lit = function (x, y, z) { if (x < 0 || z < 0 || x >= this.W || z >= this.D) return true; return y >= this.top[z * this.W + x]; };
  VWorld.prototype.set = function (x, y, z, id) {
    if (!this.in(x, y, z)) return false;
    this.v[this.i(x, y, z)] = id; this.colTop(x, z);
    var cx = Math.floor(x / CH), cz = Math.floor(z / CH);
    for (var dx = -1; dx <= 1; dx++) for (var dz = -1; dz <= 1; dz++) this.dirty[(cx + dx) + ',' + (cz + dz)] = 1;
    return true;
  };

  /* ================================================================ the conversion */
  function landBounds(d) {
    var x0 = 1e9, z0 = 1e9, x1 = -1e9, z1 = -1e9, cells = {};
    (d.land || []).forEach(function (k) {
      var c = String(k).split(','), i = +c[0], j = +c[1];
      x0 = Math.min(x0, i * 3); z0 = Math.min(z0, j * 3); x1 = Math.max(x1, i * 3 + 3); z1 = Math.max(z1, j * 3 + 3);
      for (var a = 0; a < 3; a++) for (var b = 0; b < 3; b++) cells[(i * 3 + a) + ',' + (j * 3 + b)] = 1;
    });
    if (x0 > x1) { x0 = 0; z0 = 0; x1 = 9; z1 = 9; }
    return { x0: x0, z0: z0, x1: x1, z1: z1, cells: cells };
  }

  function convert(T, scene, d, S) {
    var t0 = performance.now();
    learnNames();
    regReset();
    scene.updateMatrixWorld(true);
    var lb = landBounds(d), M = 4;                  // margin in blocks around the land
    var room = d.scene === 'room';
    var bx0 = lb.x0 - M, bz0 = lb.z0 - M, bx1 = lb.x1 + M, bz1 = lb.z1 + M, by0 = -2, by1 = room ? 8 : 26;
    // first pass: the real height of what was built (tall towers raise the ceiling)
    var meshes = [], box = new T.Box3();
    scene.traverse(function (o) {
      if (!(o.isMesh || o.isInstancedMesh) || !o.visible) return;
      var p = o.parent; while (p) { if (p.visible === false) return; p = p.parent; }
      var m = Array.isArray(o.material) ? o.material[0] : o.material;
      if (!m || m.visible === false || (m.transparent && m.opacity < .05) || m.wireframe) return;
      if (m.colorWrite === false || m.depthWrite === false && m.opacity < .5) return;
      box.setFromObject(o);
      if (box.isEmpty()) return;
      if (box.max.x < bx0 || box.min.x > bx1 || box.max.z < bz0 || box.min.z > bz1) return;
      if (!m.map && m.transparent && m.opacity < .9 && box.min.y > 6) return;   // weather clouds
      if (box.min.y > 60 || box.max.y < by0) return;
      meshes.push(o);
      if (box.max.y + 1 > by1) by1 = Math.min(60, Math.ceil(box.max.y + 1));
    });
    var W = Math.ceil((bx1 - bx0) * S), D = Math.ceil((bz1 - bz0) * S), H = Math.min(512, Math.ceil((by1 - by0) * S));
    var vw = new VWorld(W, H, D, S, bx0, by0, bz0);
    var panels = [];
    var va = new T.Vector3(), vb = new T.Vector3(), vc = new T.Vector3(), e1 = new T.Vector3(), e2 = new T.Vector3(), nrm = new T.Vector3(), pt = new T.Vector3();
    var mw = new T.Matrix4(), im = new T.Matrix4();
    var tris = 0;

    meshes.forEach(function (o) {
      var g = o.geometry, pos = g.attributes.position; if (!pos) return;
      var m = Array.isArray(o.material) ? o.material[0] : o.material;
      var map = m.map && m.map.image ? m.map : null;
      var tiled = !!(map && (map.wrapS === T.RepeatWrapping || map.wrapT === T.RepeatWrapping));
      var isPlane = g.type === 'PlaneGeometry' && map && !tiled;
      if (isPlane) { panels.push(o); return; }       // pictures and sign words stay as panels
      var uv = g.attributes.uv, col = g.attributes.color, idx = g.index;
      var mcol = m.color || new T.Color(1, 1, 1);
      var fixedId = 0;
      if (tiled) fixedId = tileBlock(map, mcol.r < .99 || mcol.g < .99 || mcol.b < .99 ? mcol : null, m.transparent, m.opacity);
      var px = !tiled && map ? pixels(map.image) : null;
      var kindC = m.transparent && m.opacity < .7 ? 'glass' : 'solid';
      var nInst = o.isInstancedMesh ? o.count : 1;
      var nTri = idx ? idx.count / 3 : pos.count / 3;
      for (var inst = 0; inst < nInst; inst++) {
        if (o.isInstancedMesh) { o.getMatrixAt(inst, im); mw.multiplyMatrices(o.matrixWorld, im); } else mw.copy(o.matrixWorld);
        var icol = null;
        if (o.isInstancedMesh && o.instanceColor) { var ic = o.instanceColor.array; icol = [ic[inst * 3], ic[inst * 3 + 1], ic[inst * 3 + 2]]; }
        for (var t = 0; t < nTri; t++) {
          var ia = idx ? idx.getX(t * 3) : t * 3, ib = idx ? idx.getX(t * 3 + 1) : t * 3 + 1, ic2 = idx ? idx.getX(t * 3 + 2) : t * 3 + 2;
          va.fromBufferAttribute(pos, ia).applyMatrix4(mw); vb.fromBufferAttribute(pos, ib).applyMatrix4(mw); vc.fromBufferAttribute(pos, ic2).applyMatrix4(mw);
          e1.subVectors(vb, va); e2.subVectors(vc, va); nrm.crossVectors(e1, e2);
          var area = nrm.length(); if (area < 1e-9) continue;
          nrm.multiplyScalar(1 / area);
          if (m.side === T.BackSide) nrm.negate();
          tris++;
          var id = fixedId;
          if (!id) {
            // colour from the model: its texture at the triangle's centre uv, else vertex / material colour
            var r = mcol.r, gg = mcol.g, bb = mcol.b;
            if (col) { r *= (col.getX(ia) + col.getX(ib) + col.getX(ic2)) / 3; gg *= (col.getY(ia) + col.getY(ib) + col.getY(ic2)) / 3; bb *= (col.getZ(ia) + col.getZ(ib) + col.getZ(ic2)) / 3; }
            if (icol) { r *= icol[0]; gg *= icol[1]; bb *= icol[2]; }
            var R = Math.pow(clamp(r, 0, 1), 1 / 2.2) * 255, G = Math.pow(clamp(gg, 0, 1), 1 / 2.2) * 255, Bc = Math.pow(clamp(bb, 0, 1), 1 / 2.2) * 255;
            if (px && uv) {
              var u = (uv.getX(ia) + uv.getX(ib) + uv.getX(ic2)) / 3, v = (uv.getY(ia) + uv.getY(ib) + uv.getY(ic2)) / 3;
              if (map.flipY !== false) v = 1 - v;
              u = u - Math.floor(u); v = v - Math.floor(v);
              var qx = Math.min(px.w - 1, Math.floor(u * px.w)), qy = Math.min(px.h - 1, Math.floor(v * px.h)), q = (qy * px.w + qx) * 4;
              if (px.d[q + 3] < 40) continue;
              R = px.d[q] * R / 255; G = px.d[q + 1] * G / 255; Bc = px.d[q + 2] * Bc / 255;
            }
            id = colorBlock(R | 0, G | 0, Bc | 0, kindC);
          }
          // sample the triangle at half-voxel spacing; each sample marks the voxel just inside the surface
          var la = va.distanceTo(vb), lc = va.distanceTo(vc);
          var nu = Math.max(1, Math.ceil(la * S * 2)), nv = Math.max(1, Math.ceil(lc * S * 2));
          var inX = nrm.x * .3 / S, inY = nrm.y * .3 / S, inZ = nrm.z * .3 / S;
          for (var a = 0; a <= nu; a++) {
            var fa = a / nu;
            for (var b = 0; b <= nv - Math.floor(fa * nv); b++) {
              var fb = b / nv; if (fa + fb > 1.0001) break;
              var X = va.x + e1.x * fa + e2.x * fb - inX, Y = va.y + e1.y * fa + e2.y * fb - inY, Z = va.z + e1.z * fa + e2.z * fb - inZ;
              var ix = Math.floor((X - bx0) * S), iy = Math.floor((Y - by0) * S), iz = Math.floor((Z - bz0) * S);
              if (ix < 0 || iy < 0 || iz < 0 || ix >= W || iy >= H || iz >= D) continue;
              var k = (iy * D + iz) * W + ix;
              var cur = vw.v[k];
              var nk = REG.list[id].kind, ck = cur ? REG.list[cur].kind : '';
              if (!cur || (ck === 'water' && nk !== 'water' && nk !== 'ground') || (nk === 'water' && ck === 'ground')) vw.v[k] = id;
            }
          }
        }
      }
    });

    // ground is solid: fill under every ground block, and give the land a stone underside
    var dirtId = 0, stoneId = 0;
    REG.list.forEach(function (b, i) { if (!b) return; if (b.name === 'dirt' && !dirtId) dirtId = i; if (b.name === 'stone' && !stoneId) stoneId = i; });
    if (!dirtId) dirtId = colorBlock(134, 96, 67, 'ground');
    if (!stoneId) stoneId = colorBlock(125, 125, 125, 'ground');
    var y0v = Math.floor((0 - by0) * S);             // world height 0 = the island's floor
    var baseV = Math.max(0, y0v - Math.max(2, Math.round(S * .75)));
    for (var z = 0; z < D; z++) for (var x = 0; x < W; x++) {
      var wx = Math.floor(bx0 + (x + .5) / S), wz = Math.floor(bz0 + (z + .5) / S);
      var onLand = !!lb.cells[wx + ',' + wz];
      var gTop = -1;
      for (var y = H - 1; y >= 0; y--) { var id2 = vw.v[(y * D + z) * W + x]; if (id2 && REG.list[id2].kind === 'ground') { gTop = y; break; } }
      if (gTop < 0 && onLand) gTop = y0v - 1;
      if (gTop < 0) continue;
      for (var y2 = (onLand ? baseV : Math.max(baseV, gTop - 1)); y2 < gTop; y2++) {
        var k2 = (y2 * D + z) * W + x;
        var c2 = vw.v[k2];
        if (!c2 || REG.list[c2].kind === 'water' || REG.list[c2].kind === 'glass') vw.v[k2] = gTop - y2 > S ? stoneId : dirtId;
      }
    }
    // lakes and rivers get depth: the ground under open water becomes water too
    var deep = Math.max(1, Math.round(S / 2));
    for (var z3 = 0; z3 < D; z3++) for (var x3 = 0; x3 < W; x3++) for (var y3 = H - 1; y3 > deep; y3--) {
      var k3 = (y3 * D + z3) * W + x3, id3 = vw.v[k3];
      if (!id3) continue;
      if (REG.list[id3].kind === 'water' && !vw.v[k3 + D * W]) {
        for (var dd = 1; dd <= deep; dd++) { var kb = k3 - dd * D * W, cb = vw.v[kb]; if (cb && REG.list[cb].kind === 'ground') vw.v[kb] = id3; }
      }
      break;
    }
    vw.tops();
    var stats = { ms: Math.round(performance.now() - t0), tris: tris, meshes: meshes.length, blocks: REG.list.length - 1, size: [W, H, D], panels: panels.length };
    return { vw: vw, panels: panels, stats: stats, lb: lb };
  }

  /* ================================================================ meshing (face culling, corner AO, skylight) */
  var FACES = [
    { d: [1, 0, 0], c: [[1, 1, 1, 0, 1], [1, 0, 1, 0, 0], [1, 1, 0, 1, 1], [1, 0, 0, 1, 0]], s: .84 },
    { d: [-1, 0, 0], c: [[0, 1, 0, 0, 1], [0, 0, 0, 0, 0], [0, 1, 1, 1, 1], [0, 0, 1, 1, 0]], s: .74 },
    { d: [0, 1, 0], c: [[0, 1, 1, 1, 1], [1, 1, 1, 0, 1], [0, 1, 0, 1, 0], [1, 1, 0, 0, 0]], s: 1 },
    { d: [0, -1, 0], c: [[1, 0, 1, 1, 0], [0, 0, 1, 0, 0], [1, 0, 0, 1, 1], [0, 0, 0, 0, 1]], s: .52 },
    { d: [0, 0, 1], c: [[0, 0, 1, 0, 0], [1, 0, 1, 1, 0], [0, 1, 1, 0, 1], [1, 1, 1, 1, 1]], s: .9 },
    { d: [0, 0, -1], c: [[1, 0, 0, 0, 0], [0, 0, 0, 1, 0], [1, 1, 0, 0, 1], [0, 1, 0, 1, 1]], s: .66 },
  ];
  var AOC = [.5, .66, .83, 1];
  function tileUV(t) {
    var e = 1 / (ATN * TS * 8), tx = t % ATN, ty = Math.floor(t / ATN);
    return [tx / ATN + e, 1 - (ty + 1) / ATN + e, (tx + 1) / ATN - e, 1 - ty / ATN - e];
  }
  function meshChunk(vw, cx, cz) {
    var G = { o: { p: [], u: [], c: [], i: [] }, t: { p: [], u: [], c: [], i: [] } };
    var x0 = cx * CH, z0 = cz * CH, x1 = Math.min(vw.W, x0 + CH), z1 = Math.min(vw.D, z0 + CH);
    var L = REG.list;
    for (var y = 0; y < vw.H; y++) for (var z = z0; z < z1; z++) for (var x = x0; x < x1; x++) {
      var id = vw.v[(y * vw.D + z) * vw.W + x]; if (!id) continue;
      var b = L[id], tr = b.kind === 'glass' || b.kind === 'water';
      var uvr = tileUV(b.tile);
      var waterLow = b.kind === 'water' && vw.get(x, y + 1, z) !== id;
      for (var f = 0; f < 6; f++) {
        var F = FACES[f], nx = x + F.d[0], ny = y + F.d[1], nz = z + F.d[2];
        var n = vw.get(nx, ny, nz);
        if (n) { var nb = L[n]; if (nb.kind !== 'glass' && nb.kind !== 'water') continue; if (n === id) continue; if (tr && (nb.kind === 'glass' || nb.kind === 'water') && b.kind === 'water') continue; }
        var g = tr ? G.t : G.o, st = g.p.length / 3;
        var sky = vw.lit(nx, ny, nz) ? 1 : .55, base = F.s * sky;
        var ax = F.d[0] ? 0 : F.d[1] ? 1 : 2, t1 = (ax + 1) % 3, t2 = (ax + 2) % 3;
        var ao = [3, 3, 3, 3];
        for (var q = 0; q < 4; q++) {
          var c = F.c[q], py = y + c[1];
          if (waterLow && c[1] === 1) py -= .15;
          g.p.push(x + c[0], py, z + c[2]);
          g.u.push(c[3] ? uvr[2] : uvr[0], c[4] ? uvr[3] : uvr[1]);
          if (!tr) {
            var s1 = [0, 0, 0], s2 = [0, 0, 0]; s1[t1] = c[t1] ? 1 : -1; s2[t2] = c[t2] ? 1 : -1;
            var A = vw.opaque(nx + s1[0], ny + s1[1], nz + s1[2]) ? 1 : 0, Bq = vw.opaque(nx + s2[0], ny + s2[1], nz + s2[2]) ? 1 : 0;
            var C = vw.opaque(nx + s1[0] + s2[0], ny + s1[1] + s2[1], nz + s1[2] + s2[2]) ? 1 : 0;
            ao[q] = A && Bq ? 0 : 3 - (A + Bq + C);
          }
          var k = lin(base * AOC[ao[q]]);
          g.c.push(k * b.col[0], k * b.col[1], k * b.col[2]);
        }
        if (ao[0] + ao[3] > ao[1] + ao[2]) g.i.push(st, st + 1, st + 2, st + 2, st + 1, st + 3);
        else g.i.push(st, st + 1, st + 3, st, st + 3, st + 2);
      }
    }
    return G;
  }

  /* ================================================================ renderer state */
  var R = {
    T: null, renderer: null, scene: null, cam: null, mats: null, atlasTex: null, chunks: {}, vw: null, panelsG: null,
    mode: 'view', tool: 'break', S: 4, held: 0, hot: [], orbit: { az: .8, el: .62, dist: 120, tx: 0, ty: 0, tz: 0, auto: true },
    player: { x: 0, y: 0, z: 0, vx: 0, vy: 0, vz: 0, yaw: 0, pitch: -.15, ground: false },
    keys: {}, joy: { x: 0, y: 0 }, pad: { up: false, down: false, run: false }, running: false, last: 0, ctxKey: '', d: null, edits: null, sel: null,
  };

  function ensureRenderer(T) {
    if (R.renderer) return;
    R.T = T;
    var rr = new T.WebGLRenderer({ antialias: false, powerPreference: 'high-performance' });
    var touch = ('ontouchstart' in window) || (window.matchMedia && matchMedia('(pointer:coarse)').matches);
    rr.setPixelRatio(Math.min(window.devicePixelRatio || 1, touch ? 1.5 : 2));
    stage.appendChild(rr.domElement);
    R.renderer = rr;
    R.scene = new T.Scene();
    R.sky = new T.Color(0x8ecbff);
    R.scene.background = R.sky;
    R.scene.fog = new T.Fog(0x8ecbff, 120, 520);
    R.cam = new T.PerspectiveCamera(70, 1, .1, 3000);
    R.cam.rotation.order = 'YXZ';
    R.atlasTex = new T.CanvasTexture(atlasCv);
    R.atlasTex.magFilter = T.NearestFilter; R.atlasTex.minFilter = T.NearestFilter; R.atlasTex.generateMipmaps = false;
    if (T.SRGBColorSpace) R.atlasTex.colorSpace = T.SRGBColorSpace;
    R.mats = {
      o: new T.MeshBasicMaterial({ map: R.atlasTex, vertexColors: true, alphaTest: .5 }),
      t: new T.MeshBasicMaterial({ map: R.atlasTex, vertexColors: true, transparent: true, opacity: .82, depthWrite: false, side: T.DoubleSide }),
    };
    R.hl = new T.LineSegments(new T.EdgesGeometry(new T.BoxGeometry(1.01, 1.01, 1.01)), new T.LineBasicMaterial({ color: 0x111111 }));
    R.hl.visible = false; R.scene.add(R.hl);
    // blocky clouds
    var cc = document.createElement('canvas'); cc.width = cc.height = 64;
    var cx = cc.getContext('2d'), im = cx.createImageData(64, 64);
    for (var i = 0; i < 64 * 64; i++) {
      var x = i % 64, y = (i / 64) | 0;
      var v = Math.sin(x * .35) + Math.sin(y * .27 + x * .1) + Math.sin((x + y) * .19) + Math.sin(x * .9 + y * .7) * .5;
      im.data[i * 4] = im.data[i * 4 + 1] = im.data[i * 4 + 2] = 255; im.data[i * 4 + 3] = v > 1.1 ? 225 : 0;
    }
    cx.putImageData(im, 0, 0);
    var ct = new T.CanvasTexture(cc); ct.magFilter = T.NearestFilter; ct.wrapS = ct.wrapT = T.RepeatWrapping; ct.repeat.set(3, 3);
    R.clouds = new T.Mesh(new T.PlaneGeometry(3000, 3000), new T.MeshBasicMaterial({ map: ct, transparent: true, opacity: .8, fog: false, depthWrite: false, side: T.DoubleSide }));
    R.clouds.rotation.x = -Math.PI / 2; R.scene.add(R.clouds);
    R.cloudTex = ct;
    bindInput(rr.domElement);
    new ResizeObserver(resize).observe(stage);
    resize();
  }
  function resize() {
    if (!R.renderer) return;
    var w = stage.clientWidth || 1, h = stage.clientHeight || 1;
    R.renderer.setSize(w, h, false); R.cam.aspect = w / h; R.cam.updateProjectionMatrix();
  }

  function clearWorld() {
    Object.keys(R.chunks).forEach(function (k) { R.chunks[k].forEach(function (m) { R.scene.remove(m); m.geometry.dispose(); }); });
    R.chunks = {};
    if (R.panelsG) { R.scene.remove(R.panelsG); R.panelsG = null; }
  }
  function buildChunk(cx, cz) {
    var T = R.T, vw = R.vw, key = cx + ',' + cz;
    (R.chunks[key] || []).forEach(function (m) { R.scene.remove(m); m.geometry.dispose(); });
    if (cx < 0 || cz < 0 || cx * CH >= vw.W || cz * CH >= vw.D) { delete R.chunks[key]; return; }
    var G = meshChunk(vw, cx, cz), list = [];
    ['o', 't'].forEach(function (k) {
      var g = G[k]; if (!g.i.length) return;
      var geo = new T.BufferGeometry();
      geo.setAttribute('position', new T.Float32BufferAttribute(g.p, 3));
      geo.setAttribute('uv', new T.Float32BufferAttribute(g.u, 2));
      geo.setAttribute('color', new T.Float32BufferAttribute(g.c, 3));
      geo.setIndex(g.i); geo.computeBoundingSphere();
      var m = new T.Mesh(geo, R.mats[k]); m.matrixAutoUpdate = false; if (k === 't') m.renderOrder = 1;
      R.scene.add(m); list.push(m);
    });
    R.chunks[key] = list;
  }
  function flushDirty() {
    var vw = R.vw; if (!vw) return;
    var ks = Object.keys(vw.dirty); if (!ks.length) return;
    vw.dirty = {};
    ks.forEach(function (k) { var c = k.split(','); buildChunk(+c[0], +c[1]); });
  }

  /* ================================================================ capture: My World's own 3D builder, unseen */
  var capStyle = document.createElement('style');
  capStyle.textContent = 'html.vx60-cap .mn-walk{opacity:0 !important;pointer-events:none !important} html.vx60-cap .mn-toast,html.vx60-cap .toast{opacity:0 !important}';
  document.head.appendChild(capStyle);
  var patched = new WeakSet(), lastScene = null;
  function patchThree(T) {
    if (!T || patched.has(T)) return;
    patched.add(T);
    var P = T.Object3D.prototype, orig = P.updateMatrixWorld;
    P.updateMatrixWorld = function () { if (this.isScene && this !== R.scene && window.__vx60Cap) lastScene = this; return orig.apply(this, arguments); };
  }
  function closeWalk() {   // the walk's own ✕ (it listens for the pointer, not the click)
    var x = document.querySelector('.mn-walk [data-wkx]'); if (!x) return;
    var r = x.getBoundingClientRect(), o = { bubbles: true, cancelable: true, composed: true, pointerId: 77, isPrimary: true, clientX: r.left + 2, clientY: r.top + 2, button: 0 };
    try { x.dispatchEvent(new PointerEvent('pointerdown', o)); } catch (e) {}
    if (x.isConnected) try { x.dispatchEvent(new PointerEvent('pointerup', o)); } catch (e) {}
    if (x.isConnected) try { x.click(); } catch (e) {}
  }
  function countMeshes(sc) { var n = 0; sc.traverse(function (o) { if (o.isMesh) n++; }); return n; }
  function capture() {
    return new Promise(function (resolve, reject) {
      var md = MD();
      if (!md || !md.isOpen || !md.isOpen()) return reject(new Error('先打开 My World（我的世界）里的一座岛'));
      var host = document.querySelector('.mn-dsp'); if (!host) return reject(new Error('找不到 My World 画面'));
      closeWalk();
      document.documentElement.classList.add('vx60-cap');
      window.__vx60Cap = true; lastScene = null;
      var b = document.createElement('button'); b.type = 'button'; b.hidden = true; b.setAttribute('data-fpv', '');
      host.appendChild(b); b.click(); b.remove();
      var t0 = performance.now(), lastN = -1, stableT = 0;
      (function poll() {
        if (window.MinestAssets3D && window.MinestAssets3D.three) patchThree(window.MinestAssets3D.three);
        var now = performance.now();
        if (lastScene) {
          var n = countMeshes(lastScene);
          if (n !== lastN) { lastN = n; stableT = now; }
          if (now - t0 > 1400 && now - stableT > 700 || now - t0 > 7000) return done(lastScene);
        } else if (now - t0 > 9000) return fail(new Error('My World 的 3D 场景没有打开（这台设备可能不支持 WebGL）'));
        setTimeout(poll, 120);
      })();
      function finish() {
        window.__vx60Cap = false;
        closeWalk();
        setTimeout(function () { closeWalk(); document.documentElement.classList.remove('vx60-cap'); }, 400);
      }
      function done(sc) { try { var T = window.MinestAssets3D.three, d = md.state(); var out = convert(T, sc, d, R.S); finish(); resolve({ T: T, d: d, out: out }); } catch (e) { finish(); reject(e); } }
      function fail(e) { finish(); reject(e); }
    });
  }

  /* ================================================================ open / build */
  function ctxInfo() {
    var md = MD(), wf = WF(), d = md && md.state ? md.state() : null, crumbs = [];
    try { crumbs = wf && wf.crumbs ? wf.crumbs() : []; } catch (e) {}
    var bid = '';
    try { bid = (document.querySelector('.mn-dsp-title b') || {}).textContent || ''; } catch (e) {}
    var key = (crumbs.join('›') || bid || 'island') + '|' + (d ? (d.scene || 'island') + ':' + (d.land || []).length : '');
    return { d: d, crumbs: crumbs, key: key, scape: d && d.terr && d.terr.scape };
  }
  function loadEdits(key) { try { return JSON.parse(localStorage.getItem(LS_KEY + key) || '[]'); } catch (e) { return []; } }
  function saveEdits() { if (!R.ctxKey) return; try { localStorage.setItem(LS_KEY + R.ctxKey, JSON.stringify(R.edits || [])); } catch (e) {} }

  function build() {
    var c = ctxInfo();
    if (c.scape === 'santorini' && window.MinestOia && !(c.d && c.d.scene === 'room')) { close(); MinestOia.open(); return Promise.resolve(); }
    msg('正在把「' + (c.crumbs.join(' › ') || '我的世界') + '」转换成体素…');
    ctxEl.textContent = c.crumbs.join(' › ');
    return frame().then(capture).then(function (r) {
      ensureRenderer(r.T);
      clearWorld();
      R.vw = r.out.vw; R.d = r.d; R.lb = r.out.lb; R.stats = r.out.stats;
      R.ctxKey = c.key + '|S' + R.S;
      R.edits = loadEdits(R.ctxKey);
      applyEdits();
      R.atlasTex.needsUpdate = true;
      var vw = R.vw, nx = Math.ceil(vw.W / CH), nz = Math.ceil(vw.D / CH);
      for (var cz = 0; cz < nz; cz++) for (var cx = 0; cx < nx; cx++) buildChunk(cx, cz);
      addPanels(r.T, r.out.panels);
      hotbar();
      R.clouds.position.y = vw.H + 30 * R.S / 4;
      R.scene.fog.near = Math.max(vw.W, vw.D) * .9; R.scene.fog.far = Math.max(vw.W, vw.D) * 3.2;
      var o = R.orbit; o.tx = vw.W / 2; o.tz = vw.D / 2; o.ty = (0 - vw.oy) * vw.S; o.dist = Math.max(vw.W, vw.D) * 1.05;
      spawn();
      msg('');
      R.stats.chunks = nx * nz;
      return R.stats;
    }).catch(function (e) { msg('体素转换失败：' + (e && e.message || e)); throw e; });
  }

  function addPanels(T, panels) {
    var g = new T.Group(), vw = R.vw, S = vw.S;
    var off = new T.Matrix4().makeTranslation(-vw.ox * S, -vw.oy * S, -vw.oz * S).multiply(new T.Matrix4().makeScale(S, S, S));
    panels.forEach(function (o) {
      var m = new T.Mesh(o.geometry, o.material);
      m.matrixAutoUpdate = false; m.matrix.multiplyMatrices(off, o.matrixWorld); g.add(m);
    });
    R.panelsG = g; R.scene.add(g);
  }

  function applyEdits() {
    var vw = R.vw; if (!vw || !R.edits) return;
    R.edits.forEach(function (e) {
      var id = 0;
      if (e[3]) { id = REG.byKey[e[3]] || 0; if (!id) return; }
      if (vw.in(e[0], e[1], e[2])) { vw.v[vw.i(e[0], e[1], e[2])] = id; }
    });
    vw.tops();
  }

  /* ================================================================ hotbar: the blocks your world is made of */
  function hotbar() {
    var cnt = {}, v = R.vw.v;
    for (var i = 0; i < v.length; i += 3) if (v[i]) cnt[v[i]] = (cnt[v[i]] || 0) + 1;
    R.hot = Object.keys(cnt).map(Number).filter(function (id) { return REG.list[id].kind !== 'water'; }).sort(function (a, b) { return cnt[b] - cnt[a]; }).slice(0, 9);
    R.held = 0;
    barEl.innerHTML = '';
    R.hot.forEach(function (id, k) {
      var b = REG.list[id], s = document.createElement('div'); s.className = 'sl' + (k === 0 ? ' on' : ''); s.title = b.name || b.hex || '';
      var c = document.createElement('canvas'); c.width = c.height = TS;
      var x = c.getContext('2d'), t = b.tile;
      x.drawImage(atlasCv, (t % ATN) * TS, Math.floor(t / ATN) * TS, TS, TS, 0, 0, TS, TS);
      if (b.hex) { x.globalCompositeOperation = 'multiply'; x.fillStyle = b.hex; x.fillRect(0, 0, TS, TS); }
      s.appendChild(c);
      s.addEventListener('pointerdown', function (e) { e.stopPropagation(); selectHot(k); });
      barEl.appendChild(s);
    });
  }
  function selectHot(k) { R.held = (k + R.hot.length) % Math.max(1, R.hot.length); Array.prototype.forEach.call(barEl.children, function (s, i) { s.classList.toggle('on', i === R.held); }); }

  /* ================================================================ player */
  function dims() { var S = R.vw.S; return { hw: Math.max(.3, .28 * S), h: Math.max(1.6, .92 * S), eye: Math.max(1.45, .82 * S), step: Math.max(1, Math.round(.5 * S)) }; }
  function collides(px, py, pz) {
    var vw = R.vw, D = dims();
    for (var y = Math.floor(py); y <= Math.floor(py + D.h - .001); y++)
      for (var z = Math.floor(pz - D.hw); z <= Math.floor(pz + D.hw); z++)
        for (var x = Math.floor(px - D.hw); x <= Math.floor(px + D.hw); x++) if (vw.solid(x, y, z)) return true;
    return false;
  }
  function groundAt(x, z) { var vw = R.vw, y = vw.H - 1; while (y > 0 && !vw.solid(Math.floor(x), y, Math.floor(z))) y--; return y + 1; }
  function spawn() {
    var vw = R.vw, p = R.player, cx = vw.W / 2, cz = vw.D / 2, best = null;
    // the open ground nearest the island's centre, outside any building
    for (var r = 0; r < Math.max(vw.W, vw.D) / 2 && !best; r += 2) {
      for (var a = 0; a < 16 && !best; a++) {
        var x = cx + Math.cos(a / 16 * Math.PI * 2) * r, z = cz + Math.sin(a / 16 * Math.PI * 2) * r;
        var gy = groundAt(x, z), top = vw.top[Math.floor(z) * vw.W + Math.floor(x)], under = vw.get(Math.floor(x), gy - 1, Math.floor(z));
        if (gy >= top - 1 && gy > 0 && under && REG.list[under].kind === 'ground' && !collides(x, gy, z)) best = [x, gy, z];
      }
    }
    if (!best) best = [cx, vw.H - 2, cz];
    p.x = best[0]; p.y = best[1]; p.z = best[2]; p.vx = p.vy = p.vz = 0; p.yaw = Math.atan2(-(cx - p.x), -(cz - p.z)) || 0; p.pitch = -.12;
  }
  function moveAxis(ax, amt) {
    var p = R.player; if (!amt) return false;
    var old = p[ax]; p[ax] += amt;
    if (!collides(p.x, p.y, p.z)) return false;
    var D = dims();
    if (ax === 'y') p.y = amt < 0 ? Math.floor(p.y) + 1 : Math.floor(p.y + D.h) - D.h - .001;
    else p[ax] = amt > 0 ? Math.floor(p[ax] + D.hw) - D.hw - .001 : Math.floor(p[ax] - D.hw) + 1 + D.hw + .001;
    if (collides(p.x, p.y, p.z)) p[ax] = old;
    return true;
  }
  function updatePlayer(dt) {
    var p = R.player, S = R.vw.S, k = R.keys, fly = R.mode === 'fly';
    var f = (k.KeyW || k.ArrowUp ? 1 : 0) - (k.KeyS || k.ArrowDown ? 1 : 0) - R.joy.y;
    var s = (k.KeyD || k.ArrowRight ? 1 : 0) - (k.KeyA || k.ArrowLeft ? 1 : 0) + R.joy.x;
    var fx = -Math.sin(p.yaw), fz = -Math.cos(p.yaw), rx = -fz, rz = fx;
    var wx = fx * f + rx * s, wz = fz * f + rz * s, wl = Math.hypot(wx, wz);
    if (wl > 1) { wx /= wl; wz /= wl; }
    var vw = R.vw, inW = (function () { var id = vw.get(Math.floor(p.x), Math.floor(p.y + .4 * S), Math.floor(p.z)); return id && REG.list[id].kind === 'water'; })();
    var run = k.ShiftLeft && !fly || R.pad.run;
    var sp = (fly ? 7 : inW ? 1.6 : run ? 5.2 : 3.2) * S * .5;
    var a = 1 - Math.exp(-dt * (p.ground || fly ? 12 : 4));
    p.vx += (wx * sp - p.vx) * a; p.vz += (wz * sp - p.vz) * a;
    var up = k.Space || R.pad.up, down = (fly && (k.ShiftLeft || k.KeyC)) || R.pad.down;
    if (fly) p.vy += (((up ? 1 : 0) - (down ? 1 : 0)) * 4 * S - p.vy) * a;
    else if (inW) { p.vy -= 3 * S * dt; p.vy = Math.max(p.vy, -1.5 * S); if (up) p.vy = 1.4 * S; }
    else { p.vy -= 7 * S * dt; p.vy = Math.max(p.vy, -12 * S); if (up && p.ground) p.vy = Math.sqrt(2 * 7 * S * 1.15 * S * .5); }
    var steps = Math.ceil(Math.max(Math.abs(p.vx), Math.abs(p.vy), Math.abs(p.vz)) * dt / .3) || 1, sdt = dt / steps, hit = false;
    p.ground = false;
    for (var i = 0; i < steps; i++) {
      if (moveAxis('x', p.vx * sdt)) { hit = true; p.vx = 0; }
      if (moveAxis('z', p.vz * sdt)) { hit = true; p.vz = 0; }
      if (moveAxis('y', p.vy * sdt)) { if (p.vy < 0) p.ground = true; p.vy = 0; }
    }
    if (hit && p.ground && !fly && wl > .1) {   // step up: half a world block, like My World's own walk
      var D = dims(), axp = p.x + wx * (D.hw + .4), azp = p.z + wz * (D.hw + .4);
      for (var st = 1; st <= D.step; st++) if (!collides(axp, p.y + st, azp) && !collides(p.x, p.y + st, p.z)) { p.y += st; break; }
    }
    if (p.y < -20) spawn();
    var D2 = dims();
    R.cam.position.set(p.x, p.y + D2.eye, p.z);
    R.cam.rotation.set(p.pitch, p.yaw, 0, 'YXZ');
  }
  function applyOrbit(dt) {
    var o = R.orbit; if (o.auto) o.az += dt * .12;
    o.el = clamp(o.el, .08, 1.5);
    R.cam.position.set(o.tx + Math.cos(o.el) * Math.sin(o.az) * o.dist, o.ty + Math.sin(o.el) * o.dist, o.tz + Math.cos(o.el) * Math.cos(o.az) * o.dist);
    R.cam.lookAt(o.tx, o.ty, o.tz);
  }

  /* ================================================================ picking + building */
  function ray(ox, oy, oz, dx, dy, dz, max) {
    var vw = R.vw, x = Math.floor(ox), y = Math.floor(oy), z = Math.floor(oz);
    var sx = Math.sign(dx), sy = Math.sign(dy), sz = Math.sign(dz);
    var tdx = sx ? Math.abs(1 / dx) : Infinity, tdy = sy ? Math.abs(1 / dy) : Infinity, tdz = sz ? Math.abs(1 / dz) : Infinity;
    var tx = sx > 0 ? (x + 1 - ox) * tdx : sx < 0 ? (ox - x) * tdx : Infinity, ty = sy > 0 ? (y + 1 - oy) * tdy : sy < 0 ? (oy - y) * tdy : Infinity, tz = sz > 0 ? (z + 1 - oz) * tdz : sz < 0 ? (oz - z) * tdz : Infinity;
    var n = [0, 0, 0], t = 0;
    while (t <= max) {
      var id = vw.get(x, y, z);
      if (id && REG.list[id].kind !== 'water') return { x: x, y: y, z: z, n: n, id: id };
      if (tx < ty && tx < tz) { x += sx; t = tx; tx += tdx; n = [-sx, 0, 0]; }
      else if (ty < tz) { y += sy; t = ty; ty += tdy; n = [0, -sy, 0]; }
      else { z += sz; t = tz; tz += tdz; n = [0, 0, -sz]; }
    }
    return null;
  }
  var rc = null;
  function pickAt(clientX, clientY) {
    var T = R.T; if (!rc) rc = { v: new T.Vector3(), d: new T.Vector3() };
    var r = R.renderer.domElement.getBoundingClientRect();
    rc.v.set(((clientX - r.left) / r.width) * 2 - 1, -((clientY - r.top) / r.height) * 2 + 1, .5).unproject(R.cam);
    rc.d.copy(rc.v).sub(R.cam.position).normalize();
    var reach = R.mode === 'view' ? 4000 : 7 * R.vw.S;
    return ray(R.cam.position.x, R.cam.position.y, R.cam.position.z, rc.d.x, rc.d.y, rc.d.z, reach);
  }
  function pickCenter() { var r = R.renderer.domElement.getBoundingClientRect(); return pickAt(r.left + r.width / 2, r.top + r.height / 2); }
  function act(hit, tool) {
    if (!hit) return;
    var vw = R.vw, p = R.player, D = dims();
    if (tool === 'break') { if (hit.y <= 0) return; vw.set(hit.x, hit.y, hit.z, 0); R.edits.push([hit.x, hit.y, hit.z, 0]); }
    else {
      var x = hit.x + hit.n[0], y = hit.y + hit.n[1], z = hit.z + hit.n[2], id = R.hot[R.held]; if (!id || !vw.in(x, y, z)) return;
      var cur = vw.get(x, y, z); if (cur && REG.list[cur].kind !== 'water') return;
      if (R.mode !== 'view' && x + 1 > p.x - D.hw && x < p.x + D.hw && z + 1 > p.z - D.hw && z < p.z + D.hw && y + 1 > p.y && y < p.y + D.h) return;
      vw.set(x, y, z, id); R.edits.push([x, y, z, REG.list[id].key]);
    }
    if (R.edits.length > 20000) R.edits = R.edits.slice(-20000);
    saveEdits();
  }

  /* ================================================================ input */
  function bindInput(cv) {
    var drags = {}, tap = null;
    cv.addEventListener('pointerdown', function (e) {
      cv.setPointerCapture && cv.setPointerCapture(e.pointerId);
      drags[e.pointerId] = { x: e.clientX, y: e.clientY, sx: e.clientX, sy: e.clientY, b: e.button, t: performance.now() };
      R.orbit.auto = false; setBtns();
    });
    cv.addEventListener('pointermove', function (e) {
      var d = drags[e.pointerId]; if (!d) return;
      var dx = e.clientX - d.x, dy = e.clientY - d.y; d.x = e.clientX; d.y = e.clientY;
      var ids = Object.keys(drags);
      if (R.mode === 'view') {
        var o = R.orbit;
        if (ids.length >= 2) {
          var a = drags[ids[0]], b = drags[ids[1]], dist = Math.hypot(a.x - b.x, a.y - b.y);
          if (R.pinch) { o.dist = clamp(o.dist * R.pinch / Math.max(dist, 1), 6, 4000); var k = o.dist / 900; o.tx -= (Math.cos(o.az) * dx - Math.sin(o.az) * 0) * k * .5; o.tz -= (-Math.sin(o.az) * dx) * k * .5; o.ty += dy * k * .5; }
          R.pinch = dist;
        } else if (d.b === 2 || e.shiftKey) {
          var k2 = o.dist / 700; o.tx -= (Math.cos(o.az) * dx + Math.sin(o.az) * Math.sin(o.el) * dy) * k2; o.tz -= (-Math.sin(o.az) * dx + Math.cos(o.az) * Math.sin(o.el) * dy) * k2;
        } else { o.az -= dx * .006; o.el += dy * .005; }
      } else {
        var p = R.player; p.yaw -= dx * .005; p.pitch = clamp(p.pitch - dy * .005, -1.5, 1.5);
      }
    });
    function up(e) {
      var d = drags[e.pointerId]; delete drags[e.pointerId]; if (Object.keys(drags).length < 2) R.pinch = 0;
      if (!d || e.type === 'pointercancel') return;
      var moved = Math.hypot(e.clientX - d.sx, e.clientY - d.sy), quick = performance.now() - d.t < 450;
      if (moved < 8 && quick) {   // a tap: break or place where you tapped (right click always places)
        act(pickAt(e.clientX, e.clientY), d.b === 2 ? 'place' : R.tool);
      }
    }
    cv.addEventListener('pointerup', up); cv.addEventListener('pointercancel', up);
    cv.addEventListener('wheel', function (e) { e.preventDefault(); if (R.mode === 'view') { R.orbit.dist = clamp(R.orbit.dist * Math.exp(e.deltaY * .0012), 6, 4000); R.orbit.auto = false; setBtns(); } else selectHot(R.held + (e.deltaY > 0 ? 1 : -1)); }, { passive: false });
    cv.addEventListener('contextmenu', function (e) { e.preventDefault(); });
    cv.addEventListener('mousemove', function (e) {
      if (!R.vw || R.mode !== 'view') return;
      var h = pickAt(e.clientX, e.clientY); R.sel = h;
    });
    // joystick
    var joy = $('.joy'), knob = joy.querySelector('i'), jid = null;
    function joyMove(e) {
      var r = joy.getBoundingClientRect(), cx = r.left + r.width / 2, cy = r.top + r.height / 2, rad = r.width / 2;
      var dx = (e.clientX - cx) / rad, dy = (e.clientY - cy) / rad, l = Math.hypot(dx, dy); if (l > 1) { dx /= l; dy /= l; }
      R.joy.x = dx; R.joy.y = dy; knob.style.transform = 'translate(' + dx * rad * .6 + 'px,' + dy * rad * .6 + 'px)';
    }
    joy.addEventListener('pointerdown', function (e) { e.stopPropagation(); jid = e.pointerId; joy.setPointerCapture(e.pointerId); if (R.mode === 'view') setMode('walk'); joyMove(e); });
    joy.addEventListener('pointermove', function (e) { if (e.pointerId === jid) joyMove(e); });
    function joyEnd(e) { if (e.pointerId !== jid) return; jid = null; R.joy.x = R.joy.y = 0; knob.style.transform = ''; }
    joy.addEventListener('pointerup', joyEnd); joy.addEventListener('pointercancel', joyEnd);
    Array.prototype.forEach.call(ov.querySelectorAll('[data-p]'), function (b) {
      var k = b.getAttribute('data-p');
      b.addEventListener('pointerdown', function (e) {
        e.stopPropagation(); e.preventDefault();
        if (k === 'act') { act(pickCenter(), R.tool); return; }
        if (k === 'run') { R.pad.run = !R.pad.run; b.classList.toggle('on', R.pad.run); return; }
        R.pad[k] = true;
      });
      var off = function () { if (k === 'up' || k === 'down') R.pad[k] = false; };
      b.addEventListener('pointerup', off); b.addEventListener('pointercancel', off); b.addEventListener('pointerleave', off);
    });
  }
  window.addEventListener('keydown', function (e) {
    if (!isOpen()) return;
    var tg = e.target; if (tg && (tg.tagName === 'INPUT' || tg.tagName === 'TEXTAREA')) return;
    R.keys[e.code] = true;
    if (/^Digit[1-9]$/.test(e.code)) selectHot(+e.code.slice(5) - 1);
    if (e.code === 'KeyF') setMode(R.mode === 'fly' ? 'walk' : 'fly');
    if (e.code === 'KeyV') setMode('view');
    if (e.code === 'KeyQ') setTool(R.tool === 'break' ? 'place' : 'break');
    if (e.code === 'Escape') close();
    if (/^(Space|Arrow|Key[WASD])/.test(e.code)) { if (R.mode === 'view' && /Key[WASD]|Arrow/.test(e.code)) setMode('walk'); e.preventDefault(); }
    e.stopPropagation();
  }, true);
  window.addEventListener('keyup', function (e) { if (!isOpen()) return; R.keys[e.code] = false; e.stopPropagation(); }, true);

  /* ================================================================ modes + buttons */
  function setMode(m) {
    if (!R.vw) return;
    if (R.mode === 'view' && m !== 'view') {
      var o = R.orbit, p = R.player;   // walk in where the view looks
      p.yaw = o.az + Math.PI; p.pitch = -.15;
    }
    R.mode = m; ov.classList.toggle('walk', m !== 'view'); setBtns();
    if (m === 'view') R.orbit.auto = false;
  }
  function setTool(t) { R.tool = t; $('[data-p="act"]').textContent = t === 'break' ? '⛏' : '🧱'; setBtns(); }
  function setBtns() {
    Array.prototype.forEach.call(ov.querySelectorAll('[data-m]'), function (b) { b.classList.toggle('on', b.getAttribute('data-m') === R.mode); });
    Array.prototype.forEach.call(ov.querySelectorAll('[data-t]'), function (b) { b.classList.toggle('on', b.getAttribute('data-t') === R.tool); });
    Array.prototype.forEach.call(ov.querySelectorAll('[data-s]'), function (b) { b.classList.toggle('on', +b.getAttribute('data-s') === R.S); });
    $('[data-a="rot"]').classList.toggle('on', R.orbit.auto && R.mode === 'view');
  }
  ov.querySelector('.top').addEventListener('click', function (e) {
    var b = e.target.closest('button'); if (!b) return; e.stopPropagation();
    var v;
    if ((v = b.getAttribute('data-m'))) return setMode(v);
    if ((v = b.getAttribute('data-t'))) return setTool(v);
    if ((v = b.getAttribute('data-s'))) { R.S = +v; try { localStorage.setItem(LS_KEY + 'S', v); } catch (x) {} setBtns(); return build(); }
    v = b.getAttribute('data-a');
    if (v === 'x') return close();
    if (v === 'rot') { R.orbit.auto = !R.orbit.auto; if (R.orbit.auto) setMode('view'); return setBtns(); }
    if (v === 'redo') return build();
    if (v === 'reset') { R.edits = []; saveEdits(); return build(); }
  });
  try { var s0 = +localStorage.getItem(LS_KEY + 'S'); if (s0 === 2 || s0 === 4 || s0 === 8) R.S = s0; } catch (e) {}
  if ((('ontouchstart' in window) || (window.matchMedia && matchMedia('(pointer:coarse)').matches)) && !localStorage.getItem(LS_KEY + 'S')) R.S = 4;

  /* ================================================================ loop */
  var cloudX = 0;
  function loop(now) {
    if (!R.running) return;
    requestAnimationFrame(loop);
    var dt = Math.min(.05, R.last ? (now - R.last) / 1000 : .016); R.last = now;
    if (!R.vw) { if (R.renderer) R.renderer.render(R.scene, R.cam); return; }
    if (R.mode === 'view') applyOrbit(dt); else updatePlayer(dt);
    flushDirty();
    var h = R.mode === 'view' ? R.sel : pickCenter();
    R.hl.visible = !!h; if (h) R.hl.position.set(h.x + .5, h.y + .5, h.z + .5);
    cloudX += dt * .4;
    R.clouds.position.x = R.cam.position.x; R.clouds.position.z = R.cam.position.z;
    R.cloudTex.offset.set((R.cam.position.x + cloudX) / 1000, -R.cam.position.z / 1000);
    var p = R.player, vw = R.vw;
    infoEl.textContent = R.mode === 'view' ? (R.stats ? vw.W + '×' + vw.H + '×' + vw.D + ' 体素 · ' + R.stats.blocks + ' 种方块 · ×' + vw.S : '') :
      'XYZ ' + (vw.ox + p.x / vw.S).toFixed(1) + ' ' + (vw.oy + p.y / vw.S).toFixed(1) + ' ' + (vw.oz + p.z / vw.S).toFixed(1) + (R.mode === 'fly' ? ' · 飞行' : '');
    R.renderer.render(R.scene, R.cam);
  }

  /* ================================================================ open / close / button */
  function isOpen() { return ov.classList.contains('open'); }
  function open() {
    mount(); showPop(ov); ov.classList.add('open'); hidePop(btn);
    document.title = 'Minest Duo 60 · 体素世界';
    setBtns(); setTool(R.tool);
    if (!R.running) { R.running = true; R.last = 0; requestAnimationFrame(loop); }
    return build();
  }
  function close() {
    ov.classList.remove('open'); hidePop(ov); R.running = false; R.keys = {}; R.joy.x = R.joy.y = 0;
    syncBtn();
  }
  btn.addEventListener('click', function (e) { e.stopPropagation(); open(); });
  function syncBtn() {
    var md = MD(), on = !!(md && md.isOpen && md.isOpen()) && !isOpen() && !document.querySelector('.mn-walk:not(.vx60-hidden)') ;
    if (document.documentElement.classList.contains('vx60-cap')) on = false;
    btn.classList.toggle('show', on);
    if (on) showPop(btn); else hidePop(btn);
  }
  setInterval(syncBtn, 900);

  window.MinestVoxel60 = {
    version: '60', open: open, close: close, isOpen: isOpen, rebuild: build,
    setScale: function (s) { R.S = s; return build(); }, mode: function (m) { if (m) setMode(m); return R.mode; },
    stats: function () { return R.stats || null; },
    world: function () { return R.vw; }, blocks: function () { return REG ? REG.list.slice(1).map(function (b) { return { key: b.key, kind: b.kind, name: b.name || '', hex: b.hex || '' }; }) : []; },
    view: function (az, el, dist) { var o = R.orbit; o.auto = false; if (az != null) o.az = az; if (el != null) o.el = el; if (dist != null) o.dist = dist; setMode('view'); },
    player: function () { return R.player; }, act: function (tool) { act(pickCenter(), tool || R.tool); return R.edits.length; },
  };
})();

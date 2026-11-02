/* minest-voxel-62 */
/* Minest · 体素世界 62 (iPhoneDuo62.html) — My World turned into a real block world.
   How it converts: the island / room you are in is built by My World's own 🚶 Walk-in builder (the same layout,
   terrain, pieces, Studio models, people and animals). This layer opens that builder unseen, reads the finished
   three.js scene once, and rasterises every surface into a voxel grid (S voxels per world block). Textured box
   parts keep their Minecraft texture as the block face; models and coloured parts become colour blocks sampled from
   their own texture or colour. Ground is filled solid under the terrain, doors stay walkable, pictures and signs stay
   as panels. The result is a chunked voxel world with face culling, corner AO and skylight, where you can look
   around (阅览), walk (🚶), fly (✈), break (⛏) and place (🧱) blocks. Edits are saved on this device per island.
   Nothing in the original app changes: the layer only reads MinestDisplay / MinestWorldFold / MinestAssets3D and
   presses the app's own 🚶 Walk in button, then closes it again.
   61 · the console (🎛): the voxel world takes the island's place and My World's own console stays beside it (or on
   the lower screen of a half-folded Duo) with all of its tools — Edit, Tools, the object picker, 一键生成, Smart
   Island, ✨ Smart, 🪄 Smart Fill, Suggest. What they change shows in the voxel world a moment later (live sync).
   🧩 摆放: pick a thing or a card in the console, then tap a block — it goes there (a card tapped onto a display
   stands in it). ✦ 陈列 puts every list on the furniture that suits it; ↶ ↷ are My World's own undo / redo.
   62 · tidy tools: one top bar (✕, ‹ up, where you are, 👁 / 🚶 / ✈, ↶ ↷, 🗺 2D, ⚙) and one dock at the bottom —
   👆 浏览 · ⛏ 方块 · 🧩 摆放 · 🏠 房间 · 📄 陈列 · ⛰ 地形 · ✨ Smart. The picked tool shows its options in one sheet just
   above the dock; nothing else covers the world. 🏠: tap a building (or pick it in the sheet) to go in, see its rooms,
   ＋ add a room (My World's own room kinds), tap a room to go in — the room is built in voxels, then 🧩 puts furniture
   and displays in it and 📄 puts cards on them. ‹ goes back up. 🗺 shows the 2D island under it for a moment.
   🛠 地形 (mūse's phase-2 terrain tools, merged): ⛰ raise, ⬇ lower, ▦ flatten, ∿ smooth, 💧 lake, 〰 river, 🌿 restore,
   brush 1 / 3 / 5, ✨ Smart terrain and 🗑 reset — written into My World's own island terrain (V.d.terr) through its
   own brush, so the 2D island shows them, they are saved with the island and ↶ Undo takes them back.
   Ideas taken from mūse's voxel.html (top-layer popover overlay, orbit view, read-only data access) and from the
   Oia voxel engine (chunked block world, walk / fly / build). */
(function () {
  'use strict';
  if (window.MinestVoxel62) return;

  var MD = function () { return window.MinestDisplay || null; };
  var WF = function () { return window.MinestWorldFold || null; };
  var CH = 16;
  var LS_KEY = 'minest.vx61.';

  /* ================================================================ styles + DOM */
  var css = document.createElement('style');
  css.id = 'vx62-style';
  css.textContent = [
    '#vx62-btn{position:fixed;left:14px;bottom:14px;top:auto;right:auto;margin:0;z-index:2147483000;background:#2f9e44;color:#fff;border:0;border-radius:999px;padding:11px 18px;font:700 15px/1.1 system-ui,sans-serif;box-shadow:0 4px 18px rgba(0,0,0,.35);cursor:pointer;display:none}',
    '#vx62-btn.show{display:block}',
    'html.duo-halfopen #vx62-btn{bottom:calc(50vh - 58px)}',
    '#vx62{position:fixed;inset:0;width:100%;height:100%;max-width:none;max-height:none;margin:0;padding:0;border:0;z-index:2147483001;background:#8ecbff;display:none;overflow:hidden;font:500 13px/1.3 system-ui,sans-serif;color:#eef2f7;-webkit-user-select:none;user-select:none;touch-action:none}',
    '#vx62.open{display:block}',
    '#vx62 .st{position:absolute;left:0;right:0;top:0;bottom:0}',
    '#vx62 .st canvas{display:block;width:100%;height:100%}',
    '#vx62 .top{position:absolute;left:0;right:0;top:0;display:flex;gap:6px;align-items:center;padding:6px 8px;padding-top:max(6px,env(safe-area-inset-top));background:rgba(18,24,36,.86);z-index:4}',
    '#vx62 .top .ttl{flex:1;min-width:0;display:flex;flex-direction:column;line-height:1.15}',
    '#vx62 .top .ttl b{font-size:14px;white-space:nowrap}',
    '#vx62 .top .ctx{opacity:.8;font-size:12px;overflow:hidden;text-overflow:ellipsis;white-space:nowrap}',
    '#vx62 button{background:#334155;color:#e2e8f0;border:1px solid #4b5b73;border-radius:9px;padding:6px 9px;cursor:pointer;font:600 13px system-ui,sans-serif;white-space:nowrap;flex:none}',
    '#vx62 button.on{background:#2f9e44;border-color:#2f9e44;color:#fff}',
    '#vx62 button.ic{width:36px;height:34px;padding:0;font-size:16px}',
    '#vx62 button[hidden]{display:none}',
    '#vx62 .seg{display:flex;flex:none;border:1px solid #4b5b73;border-radius:10px;overflow:hidden}',
    '#vx62 .seg button{border:0;border-radius:0;width:38px;height:32px;padding:0;font-size:16px;background:#263244}',
    '#vx62 .seg button.on{background:#2f9e44}',
    '#vx62 .more{position:absolute;right:8px;top:52px;z-index:6;background:rgba(15,23,42,.97);border:1px solid #334155;border-radius:12px;padding:10px;display:none;width:min(300px,86%)}',
    '#vx62 .more.on{display:block}',
    '#vx62 .more h5{margin:8px 0 5px;font:700 11px system-ui;opacity:.7;letter-spacing:.04em}',
    '#vx62 .more .r{display:flex;flex-wrap:wrap;gap:6px}',
    '#vx62 .dock{position:absolute;left:0;right:0;bottom:0;display:flex;gap:4px;padding:6px;padding-bottom:max(6px,env(safe-area-inset-bottom));background:rgba(18,24,36,.92);overflow-x:auto;scrollbar-width:none;z-index:4}',
    '#vx62 .dock::-webkit-scrollbar{display:none}',
    '#vx62 .dock button{flex:1 0 auto;min-width:50px;display:flex;flex-direction:column;align-items:center;gap:2px;padding:5px 4px;border:0;background:transparent;border-radius:10px;font:600 11px system-ui}',
    '#vx62 .dock button i{font-style:normal;font-size:20px;line-height:1}',
    '#vx62 .dock button.on{background:#f2c13d;color:#2b2205}',
    '#vx62 .sheet{position:absolute;left:0;right:0;background:rgba(15,23,42,.94);padding:7px 8px;display:none;z-index:4;overflow-y:auto;border-top:1px solid #334155}',
    '#vx62 .sheet.on{display:block}',
    '#vx62 .sheet .row{display:flex;gap:6px;overflow-x:auto;scrollbar-width:none;padding:2px 0;align-items:center}',
    '#vx62 .sheet .row::-webkit-scrollbar{display:none}',
    '#vx62 .sheet .lab{font:700 11px system-ui;opacity:.7;flex:none;margin-right:2px}',
    '#vx62 .sheet .hint{font:500 12px/1.35 system-ui;opacity:.88;margin:2px 0 6px}',
    '#vx62 .sheet .hint b{color:#f2c13d}',
    '#vx62 .sheet button.go{background:#1f3a2b;border-color:#2f6b45}',
    '#vx62 .sheet button.add{background:#2b2f55;border-color:#4a52a0}',
    '#vx62 .sheet button.tr{background:#3b2f1c;border-color:#7a5a24}',
    '#vx62 .sheet button.tr.on{background:#b7791f;border-color:#b7791f;color:#fff}',
    '#vx62 .sheet .cards button{display:block;width:100%;text-align:left;margin:3px 0;white-space:normal;background:#1e293b}',
    '#vx62 .sheet .cards h4{margin:8px 0 3px;font:700 11px system-ui;opacity:.7}',
    '#vx62 .bar{display:flex;gap:3px;padding:2px;overflow-x:auto;scrollbar-width:none}',
    '#vx62 .bar .sl{flex:none;width:38px;height:38px;border:2px solid rgba(255,255,255,.25);display:flex;align-items:center;justify-content:center;cursor:pointer;background:rgba(0,0,0,.35)}',
    '#vx62 .bar .sl.on{border-color:#fff}',
    '#vx62 .bar .sl canvas{width:28px;height:28px;image-rendering:pixelated}',
    '#vx62 .pill{display:none;position:absolute;left:50%;top:10px;transform:translateX(-50%);z-index:7;background:#2f9e44;color:#fff;border:0;border-radius:999px;padding:9px 16px;font:700 14px system-ui;box-shadow:0 4px 16px #0006;pointer-events:auto}',
    '#vx62.peek{background:transparent !important;pointer-events:none}',
    '#vx62.peek > *{display:none !important}',
    '#vx62.peek > .pill{display:block !important}',
    '#vx62 .msg{position:absolute;left:50%;top:44%;transform:translate(-50%,-50%);background:rgba(15,23,42,.9);padding:16px 20px;border-radius:12px;font:600 15px system-ui;max-width:82%;text-align:center;display:none;z-index:5}',
    '#vx62 .cross{position:absolute;left:50%;top:50%;transform:translate(-50%,-50%);font:300 26px system-ui;text-shadow:0 1px 2px #000;display:none;pointer-events:none}',
    '#vx62.walk .cross{display:block}',
    '#vx62 .ctl{position:absolute;left:0;right:0;bottom:0;pointer-events:none}',
    '#vx62 .ctl > *{pointer-events:auto}',
    '#vx62 .joy{position:absolute;left:18px;bottom:calc(var(--ch,60px) + 14px);width:120px;height:120px;border-radius:50%;background:rgba(255,255,255,.14);border:2px solid rgba(255,255,255,.35);display:none}',
    '#vx62 .joy i{position:absolute;left:50%;top:50%;width:48px;height:48px;margin:-24px 0 0 -24px;border-radius:50%;background:rgba(255,255,255,.5)}',
    '#vx62 .pad{position:absolute;right:14px;bottom:calc(var(--ch,60px) + 14px);display:none;flex-direction:column;gap:8px}',
    '#vx62 .pad button{width:56px;height:56px;font-size:22px;border-radius:14px;background:rgba(30,41,59,.75)}',
    '#vx62.walk .joy{display:block}',
    '#vx62.walk .pad{display:flex}',
    '#vx62 .info{position:absolute;left:10px;top:54px;font:12px ui-monospace,monospace;text-shadow:0 1px 2px #000;opacity:.9;pointer-events:none}',
    /* Duo half folded: the world on the upper screen, the controls on the lower screen */
    'html.duo-halfopen #vx62:not(.con) .st{bottom:50%}',
    'html.duo-halfopen #vx62:not(.con) .ctl{top:50%;background:linear-gradient(#1b2433,#121826)}',
    'html.duo-halfopen #vx62:not(.con) .msg{top:25%}',
    'html.duo-halfopen #vx62:not(.con) .cross{top:25%}',
    'html.duo-halfopen #vx62:not(.con) .joy{display:block;left:28px;top:calc(50% + 40px);bottom:auto;width:140px;height:140px}',
    'html.duo-halfopen #vx62:not(.con) .pad{display:flex;flex-direction:row;flex-wrap:wrap;width:136px;right:24px;top:calc(50% + 40px);bottom:auto}',
    /* 61 · console mode: the voxel world sits where the island was, the console stays usable beside it */
    '#vx62.con{inset:auto;border-radius:0;box-shadow:0 0 0 1px #0006}',
    '#vx62.con .joy{width:96px;height:96px;left:12px}',
    '#vx62.con .pad{right:10px}',
    '#vx62.con .pad button{width:46px;height:46px;font-size:18px}',
    '#vx62 .tst{position:absolute;left:50%;bottom:calc(var(--ch,60px) + 10px);z-index:6;transform:translateX(-50%);background:rgba(15,23,42,.92);padding:9px 14px;border-radius:10px;font:600 14px system-ui;opacity:0;transition:opacity .3s;pointer-events:none;max-width:86%;text-align:center}',
    '#vx62 .tst.on{opacity:1}',
    '#vx62 .sync{position:absolute;right:10px;top:54px;font:600 12px system-ui;background:rgba(47,158,68,.9);padding:4px 8px;border-radius:8px;display:none}',
    '#vx62 .sync.on{display:block}',
  ].join('\n');
  document.head.appendChild(css);

  var btn = document.createElement('button');
  btn.id = 'vx62-btn'; btn.type = 'button'; btn.textContent = '🧊 体素世界 62';
  btn.setAttribute('popover', 'manual');
  var ov = document.createElement('div');
  ov.id = 'vx62'; ov.setAttribute('popover', 'manual');
  var DOCK = [['look', '👆', '浏览'], ['build', '⛏', '方块'], ['put', '🧩', '摆放'], ['room', '🏠', '房间'], ['show', '📄', '陈列'], ['ter', '⛰', '地形'], ['smart', '✨', 'Smart']];
  ov.innerHTML =
    '<div class="st"></div><div class="cross">+</div><div class="info"></div>' +
    '<div class="top"><button class="ic" data-a="x" title="回到 2D 岛">✕</button><button class="ic" data-r="up" title="上一层" hidden>‹</button>' +
    '<div class="ttl"><b>🧊 体素世界</b><span class="ctx"></span></div>' +
    '<div class="seg"><button data-m="view" title="阅览">👁</button><button data-m="walk" title="行走">🚶</button><button data-m="fly" title="飞行">✈</button></div>' +
    '<button class="ic" data-c="undo" title="撤销">↶</button><button class="ic" data-c="redo" title="重做">↷</button><button class="ic" data-a="2d" title="看 2D 岛">🗺</button><button class="ic" data-a="more" title="设置">⚙</button></div>' +
    '<div class="more"><h5>视图</h5><div class="r"><button data-a="rot">🔄 自动旋转</button><button data-c="con">🎛 控制台在旁边</button></div>' +
    '<h5>体素精度</h5><div class="r"><button data-s="2">×2 粗</button><button data-s="4">×4</button><button data-s="8">×8 细</button></div>' +
    '<h5>重新开始</h5><div class="r"><button data-a="redo">↻ 重新转换</button><button data-a="reset">⟲ 撤销方块改动</button></div></div>' +
    '<div class="ctl"><div class="joy"><i></i></div>' +
    '<div class="pad"><button data-p="up">⬆</button><button data-p="down">⬇</button><button data-p="act">⛏</button><button data-p="run">⏩</button></div>' +
    '<div class="sheet"></div>' +
    '<div class="dock">' + DOCK.map(function (d) { return '<button data-tab="' + d[0] + '"><i>' + d[1] + '</i>' + d[2] + '</button>'; }).join('') + '</div></div>' +
    '<div class="msg"></div><div class="tst"></div><div class="sync">同步中…</div><button class="pill" data-a="back">🧊 回到体素世界</button>';
  var barEl = document.createElement('div'); barEl.className = 'bar';
  function mount() {
    if (!btn.isConnected) document.body.appendChild(btn);
    if (!ov.isConnected) document.body.appendChild(ov);
  }
  mount();
  var $ = function (s) { return ov.querySelector(s); };
  var stage = $('.st'), msgEl = $('.msg'), infoEl = $('.info'), ctxEl = $('.ctx'), sheetEl = $('.sheet'), dockEl = $('.dock');
  function msg(t) { msgEl.textContent = t || ''; msgEl.style.display = t ? 'block' : 'none'; }
  var tstEl = ov.querySelector('.tst'), tstT = 0, syncEl = ov.querySelector('.sync');
  function toast(t) { tstEl.textContent = t; tstEl.classList.add('on'); clearTimeout(tstT); tstT = setTimeout(function () { tstEl.classList.remove('on'); }, 2400); }
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
    mode: 'view', tool: 'look', tab: 'look', S: 4, brush: 3, moveId: null, ids: null, holdRef: null, scope: '', held: 0, hot: [], orbit: { az: .8, el: .62, dist: 120, tx: 0, ty: 0, tz: 0, auto: true },
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
  capStyle.textContent = 'html.vx62-cap .mn-walk{opacity:0 !important;pointer-events:none !important} html.vx62-cap .mn-toast,html.vx62-cap .toast{opacity:0 !important}';
  document.head.appendChild(capStyle);
  var patched = new WeakSet(), lastScene = null;
  function patchThree(T) {
    if (!T || patched.has(T)) return;
    patched.add(T);
    var P = T.Object3D.prototype, orig = P.updateMatrixWorld;
    P.updateMatrixWorld = function () { if (this.isScene && this !== R.scene && window.__vx62Cap) lastScene = this; return orig.apply(this, arguments); };
  }
  function closeWalk() {   // the walk's own ✕ (it listens for the pointer, not the click)
    var x = document.querySelector('.mn-walk [data-wkx]'); if (!x) return;
    var r = x.getBoundingClientRect(), o = { bubbles: true, cancelable: true, composed: true, pointerId: 77, isPrimary: true, clientX: r.left + 2, clientY: r.top + 2, button: 0 };
    try { x.dispatchEvent(new PointerEvent('pointerdown', o)); } catch (e) {}
    if (x.isConnected) try { x.dispatchEvent(new PointerEvent('pointerup', o)); } catch (e) {}
    if (x.isConnected) try { x.click(); } catch (e) {}
  }
  function countMeshes(sc) { var n = 0; sc.traverse(function (o) { if (o.isMesh) n++; }); return n; }
  var capturing = false;
  function capture() {
    if (capturing) return Promise.reject(new Error('busy'));
    capturing = true;
    return new Promise(function (resolve, reject) {
      var md = MD();
      if (!md || !md.isOpen || !md.isOpen()) { capturing = false; return reject(new Error('先打开 My World（我的世界）里的一座岛')); }
      var host = document.querySelector('.mn-dsp'); if (!host) { capturing = false; return reject(new Error('找不到 My World 画面')); }
      closeWalk();
      document.documentElement.classList.add('vx62-cap');
      window.__vx62Cap = true; lastScene = null;
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
        window.__vx62Cap = false;
        closeWalk();
        setTimeout(function () { closeWalk(); document.documentElement.classList.remove('vx62-cap'); }, 400);
      }
      function done(sc) { try { var T = window.MinestAssets3D.three, d = md.state(); var out = convert(T, sc, d, R.S); finish(); capturing = false; resolve({ T: T, d: d, out: out }); } catch (e) { finish(); capturing = false; reject(e); } }
      function fail(e) { finish(); capturing = false; reject(e); }
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

  function build(opts) {
    opts = opts || {};
    var c = ctxInfo();
    if (c.scape === 'santorini' && window.MinestOia && !(c.d && c.d.scene === 'room')) { close(); MinestOia.open(); return Promise.resolve(); }
    if (!opts.keep) msg('正在把「' + (c.crumbs.join(' › ') || '我的世界') + '」转换成体素…'); else syncEl.classList.add('on');
    var keepS = opts.keep && R.vw && R.vw.S === R.S ? { o: Object.assign({}, R.orbit), p: Object.assign({}, R.player), ox: R.vw.ox, oz: R.vw.oz, oy: R.vw.oy } : null;
    ctxEl.textContent = c.crumbs.join(' › ');
    var upB = $('[data-r="up"]'); if (upB) upB.hidden = lvl() < 3;
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
      var o = R.orbit;
      if (keepS) {   // same view as before the change (the voxel grid may have grown: shift by the new origin)
        var sx = (keepS.ox - vw.ox) * vw.S, sy = (keepS.oy - vw.oy) * vw.S, sz = (keepS.oz - vw.oz) * vw.S;
        Object.assign(o, keepS.o); o.tx += sx; o.ty += sy; o.tz += sz;
        Object.assign(R.player, keepS.p); R.player.x += sx; R.player.y += sy; R.player.z += sz;
        if (collides(R.player.x, R.player.y, R.player.z)) { var gy = groundAt(R.player.x, R.player.z); if (gy < vw.H - 2) R.player.y = gy; }
      } else {
        o.tx = vw.W / 2; o.tz = vw.D / 2; o.ty = (0 - vw.oy) * vw.S; o.dist = Math.max(vw.W, vw.D) * 1.05;
        spawn();
      }
      msg(''); syncEl.classList.remove('on');
      R.hash = stateHash(); R.scope = scopeKey(); trackNew();
      if (R.tab === 'room' || R.tab === 'show' || R.tab === 'put') drawSheet();
      R.stats.chunks = nx * nz;
      return R.stats;
    }).catch(function (e) { syncEl.classList.remove('on'); if (e && e.message === 'busy') return null; if (opts.keep) { R.hash = stateHash(); return null; } msg('体素转换失败：' + (e && e.message || e)); throw e; });
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
    if (tool === 'look') return;
    if (tool === 'room') return roomTap(hit);
    if (tool === 'put' || tool === 'show') return putAt(hit);
    if (/^ter:/.test(tool)) return terStroke(tool.slice(4), [hit]);
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
      if (/^ter:/.test(R.tool) && ids.length === 1 && d.b !== 2 && R.mode === 'view') {   // painting the terrain
        var hh = pickAt(e.clientX, e.clientY); if (hh) { (d.paint || (d.paint = [])).push(hh); d.painted = true; R.sel = hh; }
        return;
      }
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
      if (d.painted && d.paint && d.paint.length) { terStroke(R.tool.slice(4), d.paint); return; }
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
  function setTool(t) {
    R.tool = t; $('[data-p="act"]').textContent = { break: '⛏', place: '🧱', put: '🧩', show: '📄', room: '🚪', look: '👆' }[t] || (/^ter:/.test(t) ? '⛰' : '👆'); setBtns();
    if (/^ter:/.test(t)) { ensureTerrain(); R.terTool = t; }
  }
  function setBtns() {
    var all = function (sel, f) { Array.prototype.forEach.call(ov.querySelectorAll(sel), f); };
    all('[data-m]', function (b) { b.classList.toggle('on', b.getAttribute('data-m') === R.mode); });
    all('[data-t]', function (b) { b.classList.toggle('on', b.getAttribute('data-t') === R.tool); });
    all('[data-b]', function (b) { b.classList.toggle('on', +b.getAttribute('data-b') === R.brush); });
    all('[data-s]', function (b) { b.classList.toggle('on', +b.getAttribute('data-s') === R.S); });
    all('[data-tab]', function (b) { b.classList.toggle('on', b.getAttribute('data-tab') === R.tab); });
    all('[data-a="rot"]', function (b) { b.classList.toggle('on', R.orbit.auto && R.mode === 'view'); });
    all('[data-c="con"]', function (b) { b.classList.toggle('on', !!R.con); });
  }
  ov.addEventListener('click', function (e) {
    var b = e.target.closest('button'); if (!b || !ov.contains(b)) return;
    if (b.closest('.bar') || b.hasAttribute('data-p')) return;
    e.stopPropagation();
    var v;
    if (!b.closest('.more') && b.getAttribute('data-a') !== 'more') $('.more').classList.remove('on');
    if ((v = b.getAttribute('data-tab'))) return setTab(R.tab === v && v !== 'look' ? 'look' : v);
    if ((v = b.getAttribute('data-c'))) return command(v);
    if ((v = b.getAttribute('data-r'))) return roomAct(v, b);
    if ((v = b.getAttribute('data-b'))) { R.brush = +v; return setBtns(); }
    if ((v = b.getAttribute('data-m'))) return setMode(v);
    if ((v = b.getAttribute('data-t'))) return setTool(v);
    if ((v = b.getAttribute('data-ref'))) return pickCard(v, b.textContent);
    if ((v = b.getAttribute('data-s'))) { R.S = +v; try { localStorage.setItem(LS_KEY + 'S', v); } catch (x) {} setBtns(); return build(); }
    v = b.getAttribute('data-a');
    if (v === 'x') return close();
    if (v === 'more') { $('.more').classList.toggle('on'); return; }
    if (v === '2d') return peek(true);
    if (v === 'back') return peek(false);
    if (v === 'rot') { R.orbit.auto = !R.orbit.auto; if (R.orbit.auto) setMode('view'); return setBtns(); }
    if (v === 'redo') return build();
    if (v === 'reset') { R.edits = []; saveEdits(); return build(); }
  });
  try { var s0 = +localStorage.getItem(LS_KEY + 'S'); if (s0 === 2 || s0 === 4 || s0 === 8) R.S = s0; } catch (e) {}
  if ((('ontouchstart' in window) || (window.matchMedia && matchMedia('(pointer:coarse)').matches)) && !localStorage.getItem(LS_KEY + 'S')) R.S = 4;

  /* ================================================================ 61 · My World's console, live sync, placing, Smart */
  function scopeKey() { var md = MD(), d = md && md.state ? md.state() : null, c = []; try { c = WF().crumbs() || []; } catch (e) {} return (d && d.scene || 'island') + '|' + c.slice(0, 4).join('›'); }
  function stateHash() { var md = MD(); var d = md && md.state ? md.state() : null; return d ? hashStr(JSON.stringify(d)) : ''; }
  function stageEl() { return document.querySelector('.mn-dsp .mn-dsp-stage'); }
  function wfEl() { return document.querySelector('.wf'); }
  function layout() {   // console mode: the voxel world covers the island stage only; the console stays beside / below it
    if (!R.con || !isOpen()) { ['left', 'top', 'width', 'height', 'right', 'bottom'].forEach(function (k) { ov.style[k] = ''; }); ov.classList.remove('con'); return; }
    var st = stageEl(), r = st && st.getBoundingClientRect();
    var wf = wfEl(), w = wf && wf.getBoundingClientRect();
    if (!r || r.width < 80 || r.height < 80) { r = { left: 0, top: 0, width: innerWidth, height: innerHeight }; }
    var L = r.left, T0 = r.top, Wd = r.width, Hh = r.height;
    if (w && w.width && w.height) {   // never over the console, whatever the stage says
      if (w.left > L + Wd * .4 && w.left < L + Wd) Wd = w.left - L;
      else if (w.top > T0 + Hh * .3 && w.top < T0 + Hh) Hh = w.top - T0;
    }
    ov.classList.add('con');
    ov.style.left = L + 'px'; ov.style.top = T0 + 'px'; ov.style.width = Math.max(120, Wd) + 'px'; ov.style.height = Math.max(120, Hh) + 'px'; ov.style.right = 'auto'; ov.style.bottom = 'auto';
    resize();
  }
  function setCon(on) {
    R.con = !!on;
    try { localStorage.setItem(LS_KEY + 'con', R.con ? '1' : '0'); } catch (e) {}
    if (R.con) { var wf = WF(); try { if (wf && wf.open && !wf.on()) wf.open(true); } catch (e) {} }
    setTimeout(layout, 60); setTimeout(layout, 500); setBtns();
  }
  function wfPress(attr, val) {   // a console button, pressed through the console's own handler (its undo, toasts and previews)
    var wf = WF();
    if (!wfEl()) { try { if (wf && wf.open) wf.open(true); } catch (e) {} }
    var host = wfEl(); if (!host) { toast('控制台没有打开（先在 My World 里打开一座岛）'); return false; }
    var b = document.createElement('button'); b.type = 'button'; b.hidden = true; b.setAttribute(attr, val == null ? '' : val);
    host.appendChild(b); try { b.click(); } finally { b.remove(); }
    return true;
  }
  function command(c) {
    var md = MD();
    if (c === 'con') return setCon(!R.con);
    if (!md || !md.isOpen || !md.isOpen()) { toast('先打开 My World 里的一座岛'); return; }
    if (c === 'cards') return setTab('show');
    if (c === 'lib') { setCon(true); wfPress('data-wfact', 'edit'); return toast('📦 在控制台里点一个物件：它会先放到岛上，再点体素世界的地面把它摆过去'); }
    if (c === 'unsel') { R.moveId = null; R.holdRef = null; drawSheet(); return; }
    if (c === 'terauto') { if (inRoom()) return toast('地形只在岛上（不在房间里）'); ensureTerrain(); wfPress('data-wfter', 'auto'); return toast('✨ Smart 地形：山、河和湖（↶ 可撤销）'); }
    if (c === 'terflat') { if (inRoom()) return toast('地形只在岛上（不在房间里）'); ensureTerrain(); wfPress('data-wfter', 'flat'); return toast('🗑 地形已重置（↶ 可撤销）'); }
    if (c === 'undo') { md.undo && md.undo(); return toast('↶ 撤销'); }
    if (c === 'redo') { md.redo && md.redo(); return toast('↷ 重做'); }
    if (c === 'arrange') { var n = md.arrange ? md.arrange() : 0; return toast(n ? '✦ 已陈列 ' + n + ' 处（↶ 可撤销）' : '✦ 卡片都已经陈列好了'); }
    if (!R.con) setCon(true);   // the Smart tools show their proposals in the console: keep it in sight
    if (c === 'smart') { wfPress('data-wfpanel', 'smart'); return toast('✨ Smart：在控制台里挑一个方案，✓ Confirm 后体素世界随之更新'); }
    if (c === 'fill') { wfPress('data-wffill'); return toast('🪄 Smart Fill：在控制台里预览，✓ Confirm 后生效'); }
    if (c === 'mega') { wfPress('data-wfmegapop'); return toast('一键生成：在控制台里选一种岛'); }
  }
  // world layout (x, y) → a point on My World's island view (its own iso projection and camera)
  function camOf() {
    var sc = document.querySelector('.mn-dsp .mn-dsp-scene'), g = sc && sc.querySelector('g.cam');
    var m = g && String(g.getAttribute('transform') || '').match(/translate\(\s*([-\d.]+)[ ,]+([-\d.]+)\s*\)\s*scale\(\s*([-\d.]+)\s*\)/);
    if (!m) return null;
    return { sc: sc, r: sc.parentNode.getBoundingClientRect(), x: +m[1], y: +m[2], z: +m[3] };
  }
  function toScreen(lx, ly) {
    var c = camOf(), md = MD(), d = md && md.state(); if (!c || !d) return null;
    var lb = landBounds(d), r = d.rot || 0, x = lx, y = ly;
    if (r) { var s2 = (lb.x0 + lb.x1) / 2 + (lb.z0 + lb.z1) / 2, dd = (lb.z0 + lb.z1) / 2 - (lb.x0 + lb.x1) / 2; for (var i = 0; i < r; i++) { var t = x; x = s2 - y; y = t + dd; } }
    var th = d.terr && d.terr.h && d.scene !== 'room' ? (d.terr.h[Math.floor(lx) + ',' + Math.floor(ly)] || 0) * .5 : 0;   // on a hill: up by its height
    return { sc: c.sc, x: c.r.left + c.x + c.z * (x - y) * 32, y: c.r.top + c.y + c.z * ((x + y) * 16 - th * 32), r: c.r };
  }
  function ptr(type, target, x, y) {
    target.dispatchEvent(new PointerEvent(type, { bubbles: true, cancelable: true, composed: true, pointerId: 61, isPrimary: true, pointerType: 'mouse', clientX: x, clientY: y, button: 0, buttons: type === 'pointerup' ? 0 : 1 }));
  }
  function tapIsland(lx, ly) {   // a tap on My World's island at that spot (the overlay steps aside so it hits what is drawn there)
    var p = toScreen(lx, ly); if (!p) return false;
    var vis = ov.style.visibility; ov.style.visibility = 'hidden';
    try { var t = document.elementFromPoint(p.x, p.y); if (!t || !t.closest || !t.closest('.mn-dsp-scene')) t = p.sc; ptr('pointerdown', t, p.x, p.y); ptr('pointerup', t, p.x, p.y); }
    finally { ov.style.visibility = vis; }
    return true;
  }
  function count() { var md = MD(), d = md && md.state(); if (!d) return 0; var n = (d.pc || []).length; (d.pc || []).forEach(function (q) { n += (q.it || []).length; }); return n; }
  function putAt(hit) {
    var vw = R.vw, S = vw.S, x = hit.x + hit.n[0] + .5, z = hit.z + hit.n[2] + .5;
    var lx = vw.ox + x / S, ly = vw.oz + z / S;
    var hb = hit.id && REG.list[hit.id], onThing = hb && hb.kind !== 'ground' && hb.kind !== 'water';
    if (R.holdRef) return dropCard(R.holdRef, lx, ly, onThing ? nearestPiece(lx, ly) : null);
    var held = !!R.holdRef || !!document.querySelector('.mn-dsp .mn-ghost') || !!document.querySelector('.mn-dsp-fu.held, .mn-pk-card.held');
    if (!held && !R.holdRef && onThing) {   // tapped a thing: that is the one to move (or a display to fill)
      var q = nearestPiece(lx, ly); if (q && q.id !== R.moveId) { R.moveId = q.id; drawSheet(); toast('选中「' + (q.label || q.k) + '」· 点地面把它摆过去'); return; }
    }
    if (!held && R.moveId && pieceById(R.moveId) && !onThing) {
      var mid = R.moveId, before = JSON.stringify(pieceById(mid));
      var mv = function () { if (!dragPiece(mid, lx, ly, function () { setTimeout(function () { toast(JSON.stringify(pieceById(mid)) !== before ? '🧩 摆好了 · ↶ 可撤销' : '那里放不下，换个地方试试'); poke(); }, 150); })) toast('移不了这个物件'); };
      mv();
      return;
    }
    var go = function () {
      var before = count();
      if (!tapIsland(lx, ly)) { toast('那里在 My World 画面之外，先点 🎛 控制台或 Fit'); return; }
      setTimeout(function () {
        if (count() !== before) { toast(R.holdRef ? '📄 放好了 · ↶ 可撤销' : '🧩 放好了'); R.holdRef = null; drawSheet(); poke(); return; }
        if (!document.querySelector('.mn-dsp .mn-ghost')) { toast(R.holdRef ? '那里放不了这张卡片，换一个展示架或地面' : '先在 📄 陈列 里选一张卡片，或在 📦 物件库 里选一个物件'); return; }
        setTimeout(function () {   // My World shows where it would go first (a see-through copy): the second tap puts it there
          tapIsland(lx, ly);
          setTimeout(function () { if (count() !== before) { toast(R.holdRef ? '📄 放好了 · ↶ 可撤销' : '🧩 放好了'); R.holdRef = null; drawSheet(); poke(); } else toast('那里放不下，换个地方试试'); }, 150);
        }, 450);
      }, 150);
    };
    var p = toScreen(lx, ly), off = !p || p.x < p.r.left + 8 || p.x > p.r.right - 8 || p.y < p.r.top + 8 || p.y > p.r.bottom - 8;
    var on = onThing && nearestPiece(lx, ly);
    if (off && on) { var md = MD(); try { md.focus(on.id); } catch (e) {} setTimeout(go, 450); }
    else go();
  }
  // ---- 🧩 摆放: a thing you just placed (or tapped) goes where you tap
  var SKIPK = /^(r_|w_|t_rail)|^pathway$|^pond$/;
  function pieces() { var md = MD(), d = md && md.state(); return (d && d.pc) || []; }
  function pieceById(id) { return pieces().filter(function (q) { return q.id === id; })[0] || null; }
  function pieceName(id) { var q = pieceById(id); return q ? (q.label || q.k) : ''; }
  function nearestPiece(lx, ly) {
    var best = null, bd = 1e9;
    pieces().forEach(function (q) { if (SKIPK.test(q.k)) return; var dd = Math.hypot(q.x - lx, q.y - ly), lim = 1.7 * (q.s || 1); if (dd < lim && dd < bd) { bd = dd; best = q; } });
    return best;
  }
  function dragPiece(id, lx, ly, done) {
    var q = pieceById(id); if (!q) return false;
    var el = document.querySelector('.mn-dsp .mn-dsp-scene [data-pc="' + id + '"]'), a = toScreen(q.x, q.y), b = toScreen(lx, ly);
    if (!el || !a || !b) return false;
    var er = el.getBoundingClientRect(); if (er.width) { a = { x: er.left + er.width / 2, y: er.top + er.height * .7 }; }
    ptr('pointerdown', el, a.x, a.y);
    var steps = 6, i = 0;   // a real drag: a few frames, so My World follows the finger all the way
    (function next() {
      i++; var t = i / steps;
      ptr('pointermove', document, a.x + (b.x - a.x) * t + (i === 1 ? 12 : 0), a.y + (b.y - a.y) * t);
      if (i < steps) return requestAnimationFrame(next);
      requestAnimationFrame(function () { ptr('pointermove', document, b.x, b.y); requestAnimationFrame(function () { ptr('pointerup', document, b.x, b.y); if (done) done(); }); });
    })();
    return true;
  }
  function trackNew() {   // the newest thing put on the island is the one 🧩 moves next
    var ids = {}; pieces().forEach(function (q) { ids[q.id] = 1; });
    if (R.ids) { var fresh = Object.keys(ids).filter(function (k) { return !R.ids[k]; }); if (fresh.length) { R.moveId = fresh[fresh.length - 1]; var nq = pieceById(R.moveId); if (nq && nq.k === 'item') { R.moveId = null; R.ids = ids; return; }
      if (isOpen()) { if (R.tab !== 'look' && R.tab !== 'put') drawSheet(); else { if (R.tab !== 'put') setTab('put'); else drawSheet(); toast('新放的「' + pieceName(R.moveId) + '」· 点体素世界的地面，把它摆过去'); } } } }
    R.ids = ids;
  }
  // ---- 📄 卡片陈列: a card from this island's lists, onto a display (or standing on the ground)
  function boardNow() {
    var wf = WF(), t = ''; try { t = (wf.crumbs() || [])[0] || ''; } catch (e) {}
    var bs = []; try { bs = window.MinestAI.boards() || []; } catch (e) {}
    var norm = function (x) { return String(x || '').replace(/^my\s+/i, '').trim(); };
    return bs.filter(function (b) { return norm(b.title) === norm(t); })[0] || null;
  }
  function cardsHtml() {
    var b = boardNow(); if (!b) return '<p class="hint">找不到这座岛的卡片</p>';
    var html = '';
    (b.columns || []).forEach(function (c) {
      var rows = [];
      (c.cards || []).forEach(function (k) {
        if (!k || !k.id) return;
        if (k.stack && k.stack.length) k.stack.forEach(function (st) { if (st && st.id) rows.push([k.id + '/' + st.id, st.title || k.title || '卡片']); });
        else rows.push([c.id + '/' + k.id, k.title || '卡片']);
      });
      if (!rows.length) return;
      html += '<h4>' + escH(c.title || 'List') + ' · ' + rows.length + '</h4>' + rows.slice(0, 40).map(function (r) { return '<button data-ref="' + escH(r[0]) + '">' + escH(r[1]) + '</button>'; }).join('');
    });
    return '<div class="cards">' + (html || '<p class="hint">这座岛还没有卡片</p>') + '</div>';
  }
  function escH(x) { return String(x).replace(/[&<>"]/g, function (c) { return { '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;' }[c]; }); }
  function dropCard(h, lx, ly, q) {   // a card dragged out of the Box, as a finger would: onto a display (into a free slot) or onto the ground
    var md = MD();
    var go = function () {
      var t = null, el = q && pieceEl(q.id);
      if (el) { var r = el.getBoundingClientRect(); if (r.width) t = { x: r.left + r.width / 2, y: r.top + r.height * .55 }; }
      if (!t) t = toScreen(lx, ly); if (!t) return;
      var host = document.querySelector('.mn-dsp'), g = document.createElement('div'); g.className = 'mn-dsp-grid'; g.style.cssText = 'position:fixed;left:0;top:0;width:4px;height:4px;opacity:0;overflow:hidden';
      var b = document.createElement('button'); b.type = 'button'; b.setAttribute('data-ref', h.ref); g.appendChild(b); host.appendChild(g);
      var vis = ov.style.visibility, before = count(), its = q ? (pieceById(q.id) || {}).it : null, n0 = its ? its.length : -1;
      ov.style.visibility = 'hidden';
      var only = document.createElement('style');   // what is drawn in front must not catch it: only the display you tapped (or nothing: the ground)
      only.textContent = '.mn-dsp-scene [data-pc]' + (q ? ':not([data-pc="' + q.id + '"])' : '') + '{pointer-events:none !important}';
      document.head.appendChild(only);
      try { ptr('pointerdown', b, 2, 2); ptr('pointermove', document, 40, 40); ptr('pointermove', document, t.x, t.y); ptr('pointermove', document, t.x + 1, t.y); ptr('pointerup', document, t.x + 1, t.y); }
      finally { ov.style.visibility = vis; g.remove(); only.remove(); }
      setTimeout(function () {
        var q2 = q && pieceById(q.id), n1 = q2 && q2.it ? q2.it.length : -1;
        if (q && n1 > n0) toast('📄「' + h.title + '」放到 ' + (q2.label || q2.k) + ' 上了 · ↶ 可撤销');
        else if (count() !== before) toast('📄「' + h.title + '」放好了 · ↶ 可撤销');
        else if (q && !h.retry) { h.retry = 1; return dropCard(h, lx, ly, null); }   // not a display (or full): stand it on the ground there
        else { h.retry = 0; return toast('那里放不了，换一个地方'); }
        h.retry = 0;
        R.holdRef = null; drawSheet(); poke();
      }, 220);
    };
    var p = q ? toScreen(q.x, q.y) : toScreen(lx, ly), off = p && (p.x < p.r.left + 8 || p.x > p.r.right - 8 || p.y < p.r.top + 8 || p.y > p.r.bottom - 8);
    var near = q;
    if (off && !near) { var bd = 1e9; pieces().forEach(function (c) { var d = Math.hypot(c.x - lx, c.y - ly); if (d < bd) { bd = d; near = c; } }); }
    if (off && near) { try { md.focus(near.id); } catch (e) {} setTimeout(go, 450); } else go();
  }
  function pickCard(ref, title) {
    R.holdRef = { ref: ref, title: String(title || '').trim() }; R.moveId = null;
    setTool('show'); drawSheet();
    toast('📄「' + R.holdRef.title + '」· 点体素世界里的展示架（或地面）');
  }
  // ---- 🛠 地形: mūse's tools, done with My World's own terrain brush (saved with the island, ↶ undo)
  var TERNAME = { raise: '升起', lower: '降低', flatten: '拉平', smooth: '平滑', lake: '造水', river: '河流', erase: '恢复草地' };
  function inRoom() { var md = MD(), d = md && md.state(); return !!(d && d.scene === 'room'); }
  function ensureTerrain() { if (!document.querySelector('.wf .wf-terr')) wfPress('data-wfter', 'toggle'); }
  function setBrush(mode) {
    ensureTerrain();
    var on = document.querySelector('.wf [data-wfbrush="' + mode + '"].on');
    if (!on) wfPress('data-wfbrush', mode);
  }
  function dab(mode, cells) {   // one stroke of My World's brush over these world cells
    if (!cells.length) return;
    setBrush(mode);
    var sc = document.querySelector('.mn-dsp .mn-dsp-scene'); if (!sc) return;
    var pts = cells.map(function (c) { return toScreen(c[0] + .5, c[1] + .5); }).filter(Boolean); if (!pts.length) return;
    ptr('pointerdown', sc, pts[0].x, pts[0].y);
    for (var i = 1; i < pts.length; i++) ptr('pointermove', document, pts[i].x, pts[i].y);
    ptr('pointerup', document, pts[pts.length - 1].x, pts[pts.length - 1].y);
  }
  function terH() { var md = MD(), d = md && md.state(); return (d && d.terr && d.terr.h) || {}; }
  function brushCells(hits) {
    var vw = R.vw, S = vw.S, r = (R.brush - 1) / 2, out = {}, list = [];
    hits.forEach(function (h) {
      var cx = Math.floor(vw.ox + (h.x + .5) / S), cy = Math.floor(vw.oz + (h.z + .5) / S);
      for (var dx = -Math.ceil(r); dx <= Math.ceil(r); dx++) for (var dy = -Math.ceil(r); dy <= Math.ceil(r); dy++) {
        if (Math.hypot(dx, dy) > r + .35) continue; var k = (cx + dx) + ',' + (cy + dy); if (out[k]) continue; out[k] = 1; list.push([cx + dx, cy + dy]);
      }
    });
    return list;
  }
  function terStroke(tool, hits) {
    if (inRoom()) return toast('地形只在岛上（不在房间里）');
    if (!R.vw || !hits.length) return;
    var cells = brushCells(hits), md = MD(), lb = landBounds(md.state());
    cells = cells.filter(function (c) { return lb.cells[c[0] + ',' + c[1]]; });
    if (!cells.length) return toast('那里不是岛上的地');
    if (tool === 'raise' || tool === 'lower' || tool === 'lake' || tool === 'erase' || tool === 'river') {
      dab(tool, cells);
    } else {   // ▦ flatten to where the stroke began · ∿ smooth to the neighbourhood: raise / lower dabs until each cell is there
      var h0 = terH(), target = {};
      if (tool === 'flatten') { var f = cells[0], t0 = h0[f[0] + ',' + f[1]] || 0; cells.forEach(function (c) { target[c[0] + ',' + c[1]] = t0; }); }
      else cells.forEach(function (c) { var sum = 0, n = 0; for (var dx = -1; dx <= 1; dx++) for (var dy = -1; dy <= 1; dy++) { var k = (c[0] + dx) + ',' + (c[1] + dy); if (!lb.cells[k]) continue; sum += h0[k] || 0; n++; } target[c[0] + ',' + c[1]] = Math.round(sum / Math.max(1, n)); });
      for (var pass = 0; pass < 9; pass++) {
        var h = terH(), up = [], dn = [];
        cells.forEach(function (c) { var k = c[0] + ',' + c[1], v = h[k] || 0; if (v < target[k]) up.push(c); else if (v > target[k]) dn.push(c); });
        if (!up.length && !dn.length) break;
        if (up.length) dab('raise', up.slice(0, 400));
        if (dn.length) dab('lower', dn.slice(0, 400));
      }
    }
    toast('🛠 ' + TERNAME[tool] + ' · ' + cells.length + ' 格（↶ 可撤销）');
    poke();
  }
  // ---- 62 · the dock and its sheets
  var TERS = [['raise', '⛰ 升起'], ['lower', '⬇ 降低'], ['flatten', '▦ 拉平'], ['smooth', '∿ 平滑'], ['lake', '💧 造水'], ['river', '〰 河流'], ['erase', '🌿 恢复']];
  function setTab(t) {
    R.tab = t;
    var tool = { look: 'look', put: 'put', room: 'room', show: 'show', smart: 'look' }[t];
    if (t === 'build') tool = R.tool === 'place' ? 'place' : 'break';
    if (t === 'ter') tool = R.terTool || 'ter:raise';
    if (t !== 'show') R.holdRef = null;
    setTool(tool); drawSheet();
  }
  function lvl() { try { return WF().level() || 1; } catch (e) { return 1; } }
  function drawSheet() {
    var t = R.tab, h = '';
    if (t === 'build') {
      h = '<div class="row"><button data-t="break">⛏ 挖掉</button><button data-t="place">🧱 放方块</button><span class="lab">点方块 · 1-9 选方块</span></div>';
    } else if (t === 'put') {
      var mv = R.moveId && pieceById(R.moveId);
      h = '<p class="hint">' + (mv ? '选中 <b>' + escH(mv.label || mv.k) + '</b> · 点体素世界的地面，把它摆过去' : (inRoom() ? '在 📦 物件库 里选家具或展示架，或点体素世界里的一个物件选中它' : '在 📦 物件库 里选一个物件，或点体素世界里的一个物件选中它')) + '</p>' +
        '<div class="row"><button class="go" data-c="lib">📦 物件库</button>' + (mv ? '<button data-c="unsel">✖ 取消选中</button>' : '') + '<button data-c="arrange">✦ 自动陈列</button></div>';
    } else if (t === 'room') {
      h = roomHtml();
    } else if (t === 'show') {
      h = '<p class="hint">' + (R.holdRef ? '拿着 <b>' + escH(R.holdRef.title) + '</b> · 点体素世界里的展示架（或地面）放上去' : '选一张卡片，再点体素世界里的展示架或地面 · ✦ 把所有列表陈列到合适的家具上') + '</p>' +
        '<div class="row"><button class="go" data-c="arrange">✦ 自动陈列</button>' + (R.holdRef ? '<button data-c="unsel">✖ 放下卡片</button>' : '') + '</div>' + cardsHtml();
    } else if (t === 'ter') {
      h = inRoom() ? '<p class="hint">地形只在岛上 · 先 ‹ 回到岛</p>' :
        '<div class="row">' + TERS.map(function (x) { return '<button class="tr" data-t="ter:' + x[0] + '">' + x[1] + '</button>'; }).join('') + '</div>' +
        '<div class="row"><span class="lab">笔刷</span><button data-b="1">1</button><button data-b="3">3</button><button data-b="5">5</button><button data-c="terauto">✨ Smart 地形</button><button data-c="terflat">🗑 重置</button></div>';
    } else if (t === 'smart') {
      h = '<p class="hint">方案在旁边的控制台里预览 · ✓ Confirm 后这里马上更新</p>' +
        '<div class="row"><button class="go" data-c="smart">✨ Smart</button><button class="go" data-c="fill">🪄 Smart Fill</button><button class="go" data-c="mega">🎲 一键生成</button><button data-c="con">🎛 控制台</button></div>';
    }
    sheetEl.innerHTML = h;
    if (t === 'build') sheetEl.appendChild(barEl);
    sheetEl.classList.toggle('on', !!h);
    setBtns(); fitCtl();
  }
  function fitCtl() {   // the sheet sits on the dock; the joystick, pad and toasts above both
    var dh = dockEl.offsetHeight || 56;
    sheetEl.style.bottom = dh + 'px';
    sheetEl.style.maxHeight = Math.max(90, Math.round((ov.clientHeight || innerHeight) * .46 - dh * .3)) + 'px';
    var ch = dh + (sheetEl.classList.contains('on') ? sheetEl.offsetHeight : 0);
    ov.style.setProperty('--ch', ch + 'px');
  }
  function peek(on) {   // the 2D island under the voxel world, for a moment (its own plan, panels and pickers)
    ov.classList.toggle('peek', !!on);
    if (!on) { layout(); poke(); }
  }
  // ---- 🏠 buildings and rooms, with My World's own building view (rooms, ＋ Add a room, double-tap to go in)
  function buildings() { return pieces().filter(function (q) { return (q.rooms && q.rooms.length) || /^(bld:|lm_)/.test(q.k); }); }
  function studioKinds() {   // My World's 🛠 Build → 🏠 Buildings drawer: Studio buildings, the ones with rooms
    var list = function () { return Array.prototype.map.call(document.querySelectorAll('.mn-dsp-grid [data-kind^="bld:"]'), function (e) { var b = e.querySelector('b'); return [e.getAttribute('data-kind'), b ? b.textContent : e.getAttribute('data-kind')]; }); };
    var got = list(); if (got.length) return got;
    var bm = document.querySelector('.mn-dsp [data-bmenu]');
    if (bm && !document.querySelector('.mn-bmenu')) bm.click();
    var it = document.querySelector('.mn-bmenu [data-bm="bld"]'); if (it) it.click();
    if (!R.studioT) R.studioT = setTimeout(function () { R.studioT = 0; if (R.tab === 'room') drawSheet(); }, 900);
    return list();
  }
  function placeKind(kind, lx, ly) {
    var b = document.querySelector('.mn-dsp-grid [data-kind="' + kind + '"]'); if (!b) { studioKinds(); return toast('建筑列表还在加载，再试一次'); }
    var st = stageEl().getBoundingClientRect(), cx = st.left + st.width / 2, cy = st.top + st.height / 2, before = {};
    pieces().forEach(function (q) { before[q.id] = 1; });
    ptr('pointerdown', b, cx, cy); ptr('pointermove', document, cx + 20, cy + 20); ptr('pointermove', document, cx, cy); ptr('pointerup', document, cx, cy);
    setTimeout(function () {
      var nw = pieces().filter(function (q) { return !before[q.id]; })[0];
      if (!nw) return toast('放不下 · 先 ⛰ 扩地，或换一座小一点的');
      dragPiece(nw.id, lx, ly, function () { setTimeout(function () { R.holdKind = null; R.moveId = nw.id; toast('🏗 建好了 · 在下面点它进去，看它的房间'); poke(); drawSheet(); }, 150); });
    }, 200);
  }
  function bvPress(el) {   // the building view only counts a press that starts in it
    var bv = document.querySelector('.mn-bv'); if (!bv || !el) return false;
    var r = el.getBoundingClientRect(); ptr('pointerdown', bv, r.left + 2, r.top + 2); el.click(); return true;
  }
  function bldTitle(q) { if (!q) return ''; if (q.label) return q.label; var t = (document.querySelector('.mn-bv b') || {}).textContent || ''; if (t && lvl() >= 3) return t.replace(/ · .*$/, ''); return q.k.replace(/^bld:(building_)?\d*_?/, '').replace(/_/g, ' '); }
  function bvRooms() { return Array.prototype.map.call(document.querySelectorAll('.mn-bv [data-bvroom]'), function (e) { var b = e.querySelector('.lab b'), i = e.querySelector('.lab i'); return [e.getAttribute('data-bvroom'), (i ? i.textContent + ' ' : '') + (b ? b.textContent : e.getAttribute('aria-label') || '房间')]; }); }
  function bvKinds() { return Array.prototype.map.call(document.querySelectorAll('.mn-bv [data-bsadd]'), function (e) { return [e.getAttribute('data-bsadd'), e.textContent.trim(), e.classList.contains('has')]; }); }
  function roomHtml() {
    var L = lvl();
    if (L >= 4) return '<p class="hint">在房间里 · 用 <b>🧩 摆放</b> 放家具和展示架，用 <b>📄 陈列</b> 把卡片放上去</p><div class="row"><button class="go" data-r="up">‹ 回到建筑</button><button data-tab="put">🧩 摆放</button><button data-tab="show">📄 陈列</button></div>';
    if (L === 3) {
      if (!document.querySelector('.mn-bv [data-bsadd]') && !R.addTried) { R.addTried = 1; var ad = document.querySelector('.mn-bv [data-bvadd]'); if (ad) { bvPress(ad); setTimeout(function () { if (R.tab === 'room') drawSheet(); }, 80); } }
      var rs = bvRooms(), ks = bvKinds();
      return '<p class="hint">点一个房间进去 · ＋ 加房间（My World 推荐的种类在前面）</p>' +
        '<div class="row"><button data-r="up">‹ 回到岛</button>' + (rs.length ? rs.map(function (r) { return '<button class="go" data-r="room:' + escH(r[0]) + '">🚪 ' + escH(r[1]) + '</button>'; }).join('') : '<span class="lab">还没有房间</span>') + '</div>' +
        '<div class="row"><span class="lab">＋ 加房间</span>' + ks.map(function (k) { return '<button class="add" data-r="add:' + escH(k[0]) + '">' + escH(k[1]) + '</button>'; }).join('') + '</div>';
    }
    var bs = buildings(), sk = R.holdKind ? [] : studioKinds();
    return '<p class="hint">' + (R.holdKind ? '点体素世界里的一块空地，<b>' + escH(R.holdKind[1]) + '</b> 就建在那里' : bs.length ? '选一座建筑进去，看它的房间 · 也可以点体素世界里的建筑' : '这座岛还没有能进去的建筑 · 先在下面挑一座 Studio 建筑，再点一块空地') + '</p>' +
      (bs.length ? '<div class="row">' + bs.slice(0, 40).map(function (q) { return '<button class="go" data-r="bld:' + escH(q.id) + '">🏠 ' + escH(bldTitle(q)) + (q.rooms && q.rooms.length ? ' · ' + q.rooms.length + ' 间' : '') + '</button>'; }).join('') + '</div>' : '') +
      (R.holdKind ? '<div class="row"><button data-r="cancel:">✖ 取消</button></div>' :
        '<div class="row"><span class="lab">🏗 建一座</span>' + (sk.length ? sk.slice(0, 40).map(function (k) { return '<button class="add" data-r="put:' + escH(k[0]) + '">' + escH(k[1]) + '</button>'; }).join('') : '<span class="lab">加载中…</span>') + '</div>');
  }
  function pieceEl(id) { return document.querySelector('.mn-dsp .mn-dsp-scene [data-pc="' + id + '"]'); }
  function tapEl(el) {
    var r = el.getBoundingClientRect(), x = r.left + r.width / 2, y = r.top + r.height * .62;
    ptr('pointerdown', el, x, y); ptr('pointerup', el, x, y);
  }
  function enterBuilding(id) {   // the console's own way in (🏠 Rooms of this building)
    var q = pieceById(id);
    var go = function () {
      wfPress('data-wfbld', id);
      setTimeout(function () {
        if (lvl() >= 3) { R.addTried = 0; toast('🏠 ' + bldTitle(q) + ' · 选一个房间，或 ＋ 加一个'); if (q) focusAt(q.x, q.y, 22); drawSheet(); }
        else toast('这个进不去：只有 Studio 建筑和地标有房间');
      }, 260);
    };
    if (lvl() >= 3) { try { WF().go(2); } catch (e) {} setTimeout(go, 350); } else go();
  }
  function focusAt(lx, ly, dist) {
    var vw = R.vw; if (!vw) return; var o = R.orbit;
    o.tx = (lx - vw.ox) * vw.S; o.tz = (ly - vw.oz) * vw.S; o.ty = (0 - vw.oy) * vw.S; o.dist = dist * vw.S; o.el = Math.max(o.el, .55); o.auto = false;
    if (R.mode !== 'view') setMode('view');
  }
  function roomAct(v) {
    if (v === 'up') { try { WF().up(); } catch (e) {} setTimeout(function () { drawSheet(); poke(); }, 300); return; }
    var a = v.split(':'), k = a[0], id = a.slice(1).join(':');
    if (k === 'bld') return enterBuilding(id);
    if (k === 'put') { var nm = (document.querySelector('.mn-dsp-grid [data-kind="' + id + '"] b') || {}).textContent || id; R.holdKind = [id, nm]; drawSheet(); return toast('🏗 点体素世界里的一块空地'); }
    if (k === 'cancel') { R.holdKind = null; return drawSheet(); }
    if (k === 'add') {
      var c = document.querySelector('.mn-bv [data-bsadd="' + id + '"]'); if (!c) return toast('加不了这个房间');
      bvPress(c); setTimeout(function () { drawSheet(); toast('＋ 加好了 · 点它进去'); }, 150); return;
    }
    if (k === 'room') {
      var bv = document.querySelector('.mn-bv'), el = document.querySelector('.mn-bv [data-bvroom="' + id + '"]'); if (!bv || !el) return toast('找不到这个房间');
      var r = el.getBoundingClientRect(), x = r.left + r.width / 2, y = r.top + r.height / 2;
      ptr('pointerdown', bv, x, y);
      el.dispatchEvent(new MouseEvent('dblclick', { bubbles: true, cancelable: true, clientX: x, clientY: y }));
      if (lvl() < 4) { var gb = document.createElement('button'); gb.type = 'button'; gb.hidden = true; gb.setAttribute('data-bvgo', id); bv.appendChild(gb); bvPress(gb); gb.remove(); }
      msg('正在进入房间…');
      setTimeout(function () { if (lvl() >= 4) { msg(''); build(); } else { msg(''); toast('进不去这个房间'); } }, 350);
    }
  }
  function roomTap(hit) {
    if (R.holdKind && lvl() < 3) { var vw0 = R.vw; return placeKind(R.holdKind[0], vw0.ox + (hit.x + hit.n[0] + .5) / vw0.S, vw0.oz + (hit.z + hit.n[2] + .5) / vw0.S); }
    if (lvl() >= 3) return toast(lvl() >= 4 ? '在房间里：用 🧩 摆放 或 📄 陈列' : '在下面选一个房间');
    var vw = R.vw, lx = vw.ox + (hit.x + .5) / vw.S, ly = vw.oz + (hit.z + .5) / vw.S, best = null, bd = 1e9;
    buildings().forEach(function (q) { var d = Math.hypot(q.x - lx, q.y - ly); if (d < 2.6 * (q.s || 1) && d < bd) { bd = d; best = q; } });
    if (!best) return toast('那里没有能进去的建筑 · 在下面选一座，或 🏗 建一座');
    enterBuilding(best.id);
  }
  // live: what the console (or anything else) changes, the voxel world shows
  var pokeT = 0;
  function poke() { clearTimeout(pokeT); pokeT = setTimeout(syncNow, 350); }
  function syncNow() {
    trackNew();
    if (!isOpen() || !R.vw || capturing) return;
    var h = stateHash(); if (!h || h === R.hash) return;
    R.hash = h;
    build({ keep: scopeKey() === R.scope });
  }
  setInterval(function () {
    if (!isOpen()) return;
    if (R.con) layout();
    if (!capturing && R.vw && !document.querySelector('.wf-pend:not(.idle)') && stateHash() !== R.hash) poke();
  }, 900);
  window.addEventListener('resize', function () { if (R.con) setTimeout(layout, 80); });
  try { R.con = localStorage.getItem(LS_KEY + 'con') === '1'; } catch (e) {}

  /* ================================================================ loop */
  var cloudX = 0;
  function loop(now) {
    if (!R.running) return;
    requestAnimationFrame(loop);
    var dt = Math.min(.05, R.last ? (now - R.last) / 1000 : .016); R.last = now;
    if (!R.vw) { if (R.renderer) R.renderer.render(R.scene, R.cam); return; }
    if (R.mode === 'view') applyOrbit(dt); else updatePlayer(dt);
    flushDirty();
    var vw = R.vw;
    var h = R.mode === 'view' ? R.sel : pickCenter();
    R.hl.visible = !!h; if (h) { R.hl.position.set(h.x + .5, h.y + .5, h.z + .5); var bs = /^ter:/.test(R.tool) ? R.brush * vw.S : 1; R.hl.scale.set(bs, /^ter:/.test(R.tool) ? 1 : 1, bs); }
    cloudX += dt * .4;
    R.clouds.position.x = R.cam.position.x; R.clouds.position.z = R.cam.position.z;
    R.cloudTex.offset.set((R.cam.position.x + cloudX) / 1000, -R.cam.position.z / 1000);
    var p = R.player;
    var L = lvl(), upB = $('.top [data-r="up"]'); if (upB) upB.hidden = L < 3;
    if (R.ctxT === undefined || now - R.ctxT > 700) { R.ctxT = now; try { ctxEl.textContent = (WF().crumbs() || []).join(' › '); } catch (e) {} fitCtl(); if (R.tab === 'room' && L !== R.lastL) drawSheet(); R.lastL = L; }
    infoEl.textContent = R.mode === 'view' ? (R.stats ? vw.W + '×' + vw.H + '×' + vw.D + ' 体素 · ' + R.stats.blocks + ' 种方块 · ×' + vw.S : '') :
      'XYZ ' + (vw.ox + p.x / vw.S).toFixed(1) + ' ' + (vw.oy + p.y / vw.S).toFixed(1) + ' ' + (vw.oz + p.z / vw.S).toFixed(1) + (R.mode === 'fly' ? ' · 飞行' : '');
    R.renderer.render(R.scene, R.cam);
  }

  /* ================================================================ open / close / button */
  function isOpen() { return ov.classList.contains('open'); }
  function open() {
    mount(); showPop(ov); ov.classList.add('open'); hidePop(btn);
    document.title = 'Minest Duo 62 · 体素世界';
    setBtns(); setTool(R.tool === 'put' ? 'break' : R.tool);
    if (R.con) setCon(true); else layout();
    setTab(R.tab || 'look');
    if (!R.running) { R.running = true; R.last = 0; requestAnimationFrame(loop); }
    return build();
  }
  function close() {
    ov.classList.remove('open'); hidePop(ov); R.running = false; R.keys = {}; R.joy.x = R.joy.y = 0; layout();
    syncBtn();
  }
  btn.addEventListener('click', function (e) { e.stopPropagation(); open(); });
  function syncBtn() {
    var md = MD(), on = !!(md && md.isOpen && md.isOpen()) && !isOpen() && !document.querySelector('.mn-walk:not(.vx60-hidden)') ;
    if (document.documentElement.classList.contains('vx62-cap')) on = false;
    btn.classList.toggle('show', on);
    if (on) showPop(btn); else hidePop(btn);
  }
  setInterval(syncBtn, 900);

  window.MinestVoxel62 = {
    version: '62', open: open, close: close, isOpen: isOpen, rebuild: build,
    setScale: function (s) { R.S = s; return build(); }, mode: function (m) { if (m) setMode(m); return R.mode; },
    stats: function () { return R.stats || null; },
    world: function () { return R.vw; }, blocks: function () { return REG ? REG.list.slice(1).map(function (b) { return { key: b.key, kind: b.kind, name: b.name || '', hex: b.hex || '' }; }) : []; },
    view: function (az, el, dist) { var o = R.orbit; o.auto = false; if (az != null) o.az = az; if (el != null) o.el = el; if (dist != null) o.dist = dist; setMode('view'); },
    player: function () { return R.player; }, act: function (tool) { act(pickCenter(), tool || R.tool); return R.edits.length; },
    console: function (on) { if (on !== undefined) setCon(on); return !!R.con; }, command: command, putAtWorld: function (lx, ly) { var vw = R.vw; return putAt({ x: Math.floor((lx - vw.ox) * vw.S), y: 0, z: Math.floor((ly - vw.oz) * vw.S), n: [0, 0, 0] }); },
    toScreen: toScreen, synced: function () { return R.hash === stateHash(); },
    tab: function (t) { if (t) setTab(t); return R.tab; },
    tapWorld: function (lx, ly) {   // the same as a tap on the ground at that world spot, with the picked tool
      var vw = R.vw, x = Math.floor((lx - vw.ox) * vw.S), z = Math.floor((ly - vw.oz) * vw.S), y = groundAt(x + .5, z + .5) - 1;
      act({ x: x, y: y, z: z, n: [0, 1, 0], id: vw.get(x, y, z) }, R.tool); return true;
    },
    level: lvl,
    terrain: function (tool, lx, ly, size) { var vw = R.vw; if (size) R.brush = size; terStroke(tool, [{ x: Math.floor((lx - vw.ox) * vw.S), y: 0, z: Math.floor((ly - vw.oz) * vw.S) }]); return terH(); },
    moveTo: function (id, lx, ly) { R.moveId = id; var vw = R.vw; return putAt({ x: Math.floor((lx - vw.ox) * vw.S), y: 0, z: Math.floor((ly - vw.oz) * vw.S), n: [0, 0, 0], id: 0 }); },
  };
})();

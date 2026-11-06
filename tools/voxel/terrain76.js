  /* ================================================================ 76 · ⛰ 地形 — quick to shape, and it looks real
     The island's terrain stays My World's own (terr.h levels of half a block, terr.w water, terr.lv rock / snow lines),
     read and written through window.__terStore (its history: ↶ ↷). In the voxel world it is sculpted naturally:
     heights flow between cells (no terraces), a little relief, and the surface by slope and height — grass, earth on
     the slopes, rock faces, snow on the peaks, sand on the shores, lake beds below the water — in one of five looks.
     Columns with a building, a display or a tree in them are left as converted. One-tap landscapes keep the land
     around buildings flat; brushes fall off softly; ▲ 山峰 raises a whole peak with one tap. */
  var T76 = { look: null, g0: null, nat: true };
  var TLOOK = [['green', '🌿 夏绿'], ['autumn', '🍂 金秋'], ['winter', '❄ 冬雪'], ['desert', '🏜 沙漠'], ['volcanic', '🌋 火山岩']];
  var TPRE = [['alps', '🏔 雪山'], ['hills', '⛰ 丘陵'], ['isle', '🏝 海岛'], ['canyon', '🏜 峡谷'], ['volcano', '🌋 火山'], ['lakes', '🌊 湖区'], ['valley', '〰 河谷'], ['flat', '▭ 平地']];
  var TBR = [['raise', '⛰ 抬升'], ['lower', '⬇ 下挖'], ['peak', '▲ 山峰'], ['smooth', '∿ 抚平'], ['flatten', '▦ 削平'], ['lake', '💧 加水'], ['erase', '🌿 去水']];
  function tStore() { return window.__terStore || null; }
  function tGet() { var s = tStore(); try { return s ? s.get() : null; } catch (e) { return null; } }
  function tHash(x, y, s) { var h = (x * 374761393 + y * 668265263 + (s || 0) * 2147483647) | 0; h = (h ^ (h >>> 13)) * 1274126177 | 0; return ((h ^ (h >>> 16)) >>> 0) / 4294967296; }
  function tNoise(x, y, s) { var x0 = Math.floor(x), y0 = Math.floor(y), fx = x - x0, fy = y - y0, ux = fx * fx * (3 - 2 * fx), uy = fy * fy * (3 - 2 * fy);
    var a = tHash(x0, y0, s), b = tHash(x0 + 1, y0, s), c = tHash(x0, y0 + 1, s), d = tHash(x0 + 1, y0 + 1, s); return a + (b - a) * ux + (c - a) * uy + (a - b - c + d) * ux * uy; }
  function tFbm(x, y, s, oct) { var v = 0, a = .5, f = 1, n = 0; for (var i = 0; i < (oct || 4); i++) { v += a * tNoise(x * f, y * f, s + i * 17); n += a; a *= .5; f *= 2; } return v / n; }
  function texB(name, tint, kind) {   // a block with one of My World's own textures (tinted), registered on demand
    var tk = tint ? tint.join(',') : '1,1,1';
    return block('t76:' + name + ':' + tk + ':' + (kind || 'ground'), function () {
      var md = MD(), url = ''; try { url = md && md.tex ? md.tex(name) : ''; } catch (e) {}
      var key = 't76img:' + name;
      function draw(cx, x, y) { var im = texImg[url]; if (im && im.complete && im.naturalWidth) { cx.imageSmoothingEnabled = false; cx.drawImage(im, x, y, TS, TS); } else { cx.fillStyle = '#8a8f7a'; cx.fillRect(x, y, TS, TS); } }
      var t = tileOf(key, draw);
      if (url && !(texImg[url] && texImg[url].complete)) {
        var im = texImg[url] || (texImg[url] = new Image());
        im.addEventListener('load', function () { try { draw(atlasCx, (t % ATN) * TS, Math.floor(t / ATN) * TS); if (R.atlasTex) R.atlasTex.needsUpdate = true; } catch (e) {} });
        if (!im.src) im.src = url;
      }
      return { tile: t, col: tint ? tint.map(lin) : [1, 1, 1], kind: kind || 'ground', name: name };
    });
  }
  function surfaceBlock(look, f) {   // f: { hv, wl, slope, nearWater, rel (0..1 of the peaks), snow, rock, n }
    var n = f.n;
    if (look === 'desert') return f.slope >= 3 ? texB('sandstone', n > .5 ? [1, .9, .8] : null) : f.slope >= 2 ? texB('sandstone_top') : texB('sand', n > .66 ? [.96, .9, .8] : null);
    if (look === 'volcanic') return f.nearWater ? texB('sand', [.55, .5, .45]) : f.slope >= 2 || f.rock ? (n > .55 ? texB('blackstone') : texB('obsidian', [1.2, 1.2, 1.25])) : texB('grass_top', [.75, .8, .55]);
    if (f.nearWater && f.hv <= f.wl + 2) return texB('sand');
    if (look === 'winter') return f.slope >= 3 ? texB('stone', [.9, .92, 1]) : texB('snow');
    if (f.snow && f.slope <= 2) return texB('snow');
    if (f.slope >= 3 || (f.snow && f.slope > 2)) return n > .5 ? texB('stone') : texB('andesite');
    if (f.rock) return n > .6 ? texB('cobble', [.9, .9, .9]) : texB('stone');
    if (f.slope >= 2) return n > .5 ? texB('dirt') : texB('grass_top', look === 'autumn' ? [1.15, .85, .45] : [.85, .9, .7]);
    if (look === 'autumn') return n > .72 ? texB('grass_top', [1.35, .7, .3]) : n > .4 ? texB('grass_top', [1.2, .95, .4]) : texB('grass_top', [1.05, 1, .55]);
    return n > .82 ? texB('moss') : n > .55 ? texB('grass_top', [.9, 1.05, .85]) : texB('grass_top');
  }
  function terSculpt() {   // the island's terrain, naturally, in this voxel world
    var vw = R.vw, md = MD(); if (!vw || !md || !md.state) return;
    var st = md.state(), t = st && st.terr; if (inRoom() || !st || (t && t.nat === false)) return;
    var hs = (t && t.h) || {}, ws = (t && t.w) || {}, lv = (t && t.lv) || { stone: 5, snow: 7 }, look = (t && t.look) || (t && t.scape === 'alpchalet' ? 'green' : 'green');
    if (t && t.scape && !t.look && t.scape !== 'alpchalet') return;   // the one-tap worlds (Santorini, Venice …) keep their own look
    var lb = landBounds(st), S = vw.S, W = vw.W, D = vw.D, L = REG.list;
    function terrainId(id) { if (!id) return true; var b = L[id]; return !b || b.kind === 'ground' || b.kind === 'water' || /^t76:/.test(b.key || ''); }
    // where flat ground is (h = 0, no water): the island's surface height in this world
    var cnt = {}, best = 0, g0 = 0;
    for (var z = 0; z < D; z += 2) for (var x = 0; x < W; x += 2) { var cx = Math.floor(vw.ox + (x + .5) / S), cy = Math.floor(vw.oz + (z + .5) / S), k = cx + ',' + cy;
      if (!lb.cells[k] || hs[k] || ws[k]) continue; var tp = vw.top[z * W + x]; if (tp <= 0 || !terrainId(vw.v[vw.i(x, tp - 1, z)]) || !vw.v[vw.i(x, tp - 1, z)]) continue;   // the ground itself, not a roof
      cnt[tp] = (cnt[tp] || 0) + 1; if (cnt[tp] > best || (cnt[tp] === best && tp < g0)) { best = cnt[tp]; g0 = tp; } }
    if (!g0) return; T76.g0 = g0;
    var step = .5 * S, HV = new Float32Array(W * D), WET = new Uint8Array(W * D), OWN = new Uint8Array(W * D);
    var BH = {};   // the levels softened a little (a 5 × 5 Gaussian): slopes widen like real ones, peaks round off
    Object.keys(lb.cells).forEach(function (k) { var c = k.split(','), x = +c[0], y = +c[1], s = 0, n = 0;
      for (var a = -2; a <= 2; a++) for (var b = -2; b <= 2; b++) { var kk = (x + a) + ',' + (y + b), g = Math.exp(-(a * a + b * b) / 2.2); s += (lb.cells[kk] ? hs[kk] || 0 : 0) * g; n += g; }
      BH[k] = Math.max(s / n, (hs[k] || 0) * .55); });
    function lvAt(fx, fy) { var x0 = Math.floor(fx - .5), y0 = Math.floor(fy - .5), ax = fx - .5 - x0, ay = fy - .5 - y0;
      function h(i, j) { var k = (x0 + i) + ',' + (y0 + j); return lb.cells[k] ? BH[k] || 0 : 0; }
      return h(0, 0) * (1 - ax) * (1 - ay) + h(1, 0) * ax * (1 - ay) + h(0, 1) * (1 - ax) * ay + h(1, 1) * ax * ay; }
    for (z = 0; z < D; z++) for (x = 0; x < W; x++) {
      var fx = vw.ox + (x + .5) / S, fy = vw.oz + (z + .5) / S, key = Math.floor(fx) + ',' + Math.floor(fy), i = z * W + x;
      if (!lb.cells[key]) continue;
      var foreign = false; for (var y = g0; y < vw.H && !foreign; y++) if (!terrainId(vw.v[vw.i(x, y, z)])) foreign = true;
      if (foreign) continue;
      OWN[i] = 1;
      if (ws[key] && !hs[key]) { WET[i] = 1; HV[i] = g0 - 2; continue; }
      var l = lvAt(fx, fy), rel = l > .3 ? (tFbm(fx * .35, fy * .35, 7, 3) - .5) * (.8 + l * .12) : 0;
      HV[i] = g0 + l * step + rel * S * .5;
    }
    var wl = g0 - 2, peak = 0; for (i = 0; i < W * D; i++) if (OWN[i] && HV[i] > peak) peak = HV[i];
    var near = function (x, z) { for (var dz = -S; dz <= S; dz += Math.max(1, S / 2)) for (var dx = -S; dx <= S; dx += Math.max(1, S / 2)) { var X = x + dx, Z = z + dz; if (X >= 0 && Z >= 0 && X < W && Z < D && WET[Z * W + X]) return true; } return false; };
    for (z = 0; z < D; z++) for (x = 0; x < W; x++) {
      i = z * W + x; if (!OWN[i]) continue;
      for (y = g0 - 4; y < vw.H; y++) { if (y < 0) continue; var id0 = vw.v[vw.i(x, y, z)]; if (y >= g0 || (id0 && (L[id0].kind === 'water'))) vw.v[vw.i(x, y, z)] = 0; }
      if (WET[i]) {   // a lake bed, deeper away from its shore
        var deep = near(x + S, z) && near(x - S, z) && near(x, z + S) && near(x, z - S) ? 3 : 2, bed = g0 - 1 - deep;
        for (y = Math.max(0, bed); y < g0 - 1; y++) vw.v[vw.i(x, y, z)] = y === bed ? texB('sand', [.8, .78, .7]) : texB('water', null, 'water');
        continue;
      }
      var hv = Math.max(g0, Math.round(HV[i])), sl = 0;
      [[1, 0], [-1, 0], [0, 1], [0, -1]].forEach(function (d) { var X = x + d[0], Z = z + d[1]; if (X < 0 || Z < 0 || X >= W || Z >= D || !OWN[Z * W + X]) return; var o = WET[Z * W + X] ? g0 - 1 : Math.round(HV[Z * W + X]); sl = Math.max(sl, Math.abs(hv - o)); });
      var lvl = (hv - g0) / step, f = { hv: hv, wl: wl, slope: sl, nearWater: near(x, z), snow: lvl >= lv.snow - tNoise(x * .3, z * .3, 3) * 1.5, rock: lvl >= lv.stone - tNoise(x * .25, z * .25, 5) * 1.5, n: tNoise(x * .45, z * .45, 11) * .7 + tHash(x, z, 2) * .3 };
      var top = surfaceBlock(look, f), under = look === 'desert' ? texB('sandstone') : f.nearWater && hv <= wl + 2 ? texB('sand') : f.rock || f.snow ? texB('stone') : texB('dirt');
      for (y = g0 - 1; y < hv; y++) vw.v[vw.i(x, y, z)] = y === hv - 1 ? top : y >= hv - 3 ? under : texB('stone');
    }
    vw.tops();
  }
  function terRefresh() {   // the voxel world follows a terrain change at once (no reconversion)
    if (!R.vw) return; terSculpt();
    var nx = Math.ceil(R.vw.W / CH), nz = Math.ceil(R.vw.D / CH);
    for (var cz = 0; cz < nz; cz++) for (var cx = 0; cx < nx; cx++) buildChunk(cx, cz);
    if (R.atlasTex) R.atlasTex.needsUpdate = true;
    R.hash = stateHash();
  }
  function tWrite(fn, label) {
    var s = tStore(); if (!s) return toast('先在 My World 里打开一座岛');
    var t = tGet() || {}; t.h = t.h || {}; t.w = t.w || {};
    fn(t); s.set(t); terRefresh(); toast(label + '（↶ 可撤销）'); drawSheet();
  }
  function pads(st) {   // the ground under buildings and displays stays as it is
    var P = {}; (st.pc || []).forEach(function (p) {
      var big = /^bld:|house|hall|school|library|church|chapel|cafe|tower|castle|museum|mill|shop|inn|chalet|barn|hut|pavilion|dome|gr_|c_|h_|ruins|vox_door|gallery|stand/.test(p.k), r = big ? 1.4 + 2.2 * (p.s || 1) : 1;
      for (var dx = -Math.ceil(r + 2); dx <= Math.ceil(r + 2); dx++) for (var dy = -Math.ceil(r + 2); dy <= Math.ceil(r + 2); dy++) {
        var d = Math.hypot(dx, dy), k = Math.floor(p.x + dx) + ',' + Math.floor(p.y + dy), w = d <= r ? 0 : Math.min(1, (d - r) / 2.5);
        P[k] = P[k] == null ? w : Math.min(P[k], w);
      }
    }); return P;
  }
  function landscape(kind) {   // one tap: a whole island of hills, peaks, water — the land around buildings kept flat
    var md = MD(), st = md && md.state(); if (!st) return;
    var lb = landBounds(st), keys = Object.keys(lb.cells); if (!keys.length) return;
    var xs = keys.map(function (k) { return +k.split(',')[0]; }), ys = keys.map(function (k) { return +k.split(',')[1]; });
    var X0 = Math.min.apply(null, xs), X1 = Math.max.apply(null, xs) + 1, Y0 = Math.min.apply(null, ys), Y1 = Math.max.apply(null, ys) + 1, cxm = (X0 + X1) / 2, cym = (Y0 + Y1) / 2, rad = Math.max(X1 - X0, Y1 - Y0) / 2;
    var seed = (Date.now() % 997) + 1, P = pads(st), h = {}, w = {}, lv = { stone: 6, snow: 99 }, look = 'green';
    var amp = Math.max(.35, Math.min(1, rad / 22));   // a small island gets hills, a big one its peaks
    var LOOKS = { alps: 'green', hills: 'green', isle: 'green', canyon: 'desert', volcano: 'volcanic', lakes: 'green', valley: 'autumn', flat: 'green' };
    look = LOOKS[kind] || 'green';
    keys.forEach(function (k) {
      var c = k.split(','), x = +c[0] + .5, y = +c[1] + .5, u = (x - cxm) / rad, v = (y - cym) / rad, d = Math.hypot(u, v), n = tFbm(x * .09, y * .09, seed, 5), m = tFbm(x * .2, y * .2, seed + 9, 3), L = 0, wet = false;
      if (kind === 'alps') { var ridge = 1 - Math.abs(tFbm(x * .07, y * .07, seed, 4) * 2 - 1); L = Math.pow(ridge, 2.2) * 24 + n * 4 - 3; lv = { stone: 9, snow: 14 }; }
      if (kind === 'hills') { L = n * 13 - 4 + m * 2; lv = { stone: 13, snow: 99 }; }
      if (kind === 'isle') { L = Math.max(0, 1 - d * 1.05) * 20 * (.7 + n * .6) - 1; wet = d > .9 + (m - .5) * .15; lv = { stone: 11, snow: 17 }; }
      if (kind === 'canyon') { var mid = cym + Math.sin((x - X0) * .22 + seed) * rad * .25, gap = Math.abs(y - mid); L = gap < 1.6 ? 0 : gap < 3.5 ? (gap - 1.6) * 6 : 12 + n * 3; wet = gap < 1.2; lv = { stone: 3, snow: 99 }; }
      if (kind === 'volcano') { L = d < .16 ? 3 : Math.max(0, 1 - (d - .12) * 1.25) * 22 * (.85 + m * .3); wet = d < .11; lv = { stone: 5, snow: 99 }; }
      if (kind === 'lakes') { L = n * 9 - 2; wet = tFbm(x * .14, y * .14, seed + 31, 3) < .36; lv = { stone: 9, snow: 99 }; }
      if (kind === 'valley') { var rv = cxm + Math.sin((y - Y0) * .25 + seed) * rad * .2, g2 = Math.abs(x - rv); L = Math.min(16, g2 * 1.4) * (.7 + n * .6) - 1; wet = g2 < 1.3; lv = { stone: 11, snow: 15 }; }
      var pw = P[k] == null ? 1 : P[k]; L *= pw * amp; if (pw < 1) wet = false;
      L = Math.max(0, Math.min(22, Math.round(L)));
      if (wet) { w[k] = 2; } else if (L > 0) h[k] = L;
    });
    lv = { stone: Math.max(2, Math.round(lv.stone * amp)), snow: lv.snow >= 99 ? 99 : Math.max(3, Math.round(lv.snow * amp)) };
    tWrite(function (t) { t.h = h; t.w = w; t.lv = lv; t.look = look; delete t.scape; t.nat = true; }, '已生成「' + (TPRE.filter(function (p) { return p[0] === kind; })[0] || ['', ''])[1] + '」');
  }
  function terStroke(tool, hits) {   // brushes, straight on the island's terrain data, softly falling off
    if (inRoom()) return toast('地形只在岛上（不在房间里）');
    if (!R.vw || !hits.length) return;
    var md = MD(), st = md.state(), lb = landBounds(st), vw = R.vw, S = vw.S, r = Math.max(1, (R.brush - 1) / 2) + .5, centres = [];
    hits.forEach(function (hh) { var c = [vw.ox + (hh.x + .5) / S, vw.oz + (hh.z + .5) / S]; if (!centres.length || Math.hypot(c[0] - centres[centres.length - 1][0], c[1] - centres[centres.length - 1][1]) > r * .4) centres.push(c); });
    var strong = T76.strong ? 2 : 1, seed = Date.now() % 997;
    tWrite(function (t) {
      var h = t.h, w = t.w, acc = {}, target = null, flat = null;
      if (tool === 'flatten') { var c0 = centres[0], k0 = Math.floor(c0[0]) + ',' + Math.floor(c0[1]); flat = h[k0] || 0; }
      centres.forEach(function (c) {
        for (var dx = -Math.ceil(r); dx <= Math.ceil(r); dx++) for (var dy = -Math.ceil(r); dy <= Math.ceil(r); dy++) {
          var x = Math.floor(c[0]) + dx, y = Math.floor(c[1]) + dy, k = x + ',' + y; if (!lb.cells[k]) continue;
          var d = Math.hypot(x + .5 - c[0], y + .5 - c[1]) / r; if (d > 1) continue;
          var wgt = tool === 'peak' ? Math.pow(1 - d, 1.5) : Math.exp(-d * d * 2.5);
          acc[k] = Math.max(acc[k] || 0, wgt);
        }
      });
      if (tool === 'smooth') { target = {}; Object.keys(acc).forEach(function (k) { var c = k.split(','), x = +c[0], y = +c[1], s = 0, n = 0; for (var a = -1; a <= 1; a++) for (var b = -1; b <= 1; b++) { var kk = (x + a) + ',' + (y + b); if (!lb.cells[kk]) continue; s += h[kk] || 0; n++; } target[k] = s / Math.max(1, n); }); }
      Object.keys(acc).forEach(function (k) {
        var wg = acc[k], cur = h[k] || 0, nv = cur, c = k.split(',');
        if (tool === 'raise') nv = cur + Math.round(wg * 2 * strong);
        if (tool === 'lower') nv = cur - Math.round(wg * 2 * strong);
        if (tool === 'peak') nv = Math.max(cur, Math.round(wg * (8 + 6 * strong) + (tFbm(+c[0] * .3, +c[1] * .3, seed, 3) - .5) * 4 * wg));
        if (tool === 'smooth') nv = Math.round(cur + (target[k] - cur) * Math.min(1, wg * 1.5));
        if (tool === 'flatten') nv = wg > .3 ? flat : Math.round(cur + (flat - cur) * wg * 2);
        if (tool === 'lake' || tool === 'river') { if (wg > .35) { w[k] = 2; delete h[k]; } return; }
        if (tool === 'erase') { if (wg > .35) delete w[k]; return; }
        nv = Math.max(0, Math.min(22, nv)); if (nv) { h[k] = nv; delete w[k]; } else delete h[k];
      });
      t.nat = true; if (!t.look && !t.scape) t.look = T76.look || 'green';
    }, '🛠 ' + ((TBR.filter(function (b) { return b[0] === tool; })[0] || ['', tool])[1]) + ' · ' + hits.length + ' 处');
  }
  function terSheet() {
    var t = tGet() || {}, look = t.look || 'green', cur = R.terTool || 'ter:raise';
    return inRoom() ? '<p class="hint">地形只在岛上 · 先 ‹ 回到岛</p>' :
      '<p class="hint">一键生成整座岛的地形（建筑周围保持平整），再用笔刷在画面上点或拖来修</p>' +
      '<div class="row t76-row">' + TPRE.map(function (p) { return '<button data-tp="' + p[0] + '">' + p[1] + '</button>'; }).join('') + '</div>' +
      '<div class="row t76-row">' + TBR.map(function (b) { return '<button data-t="ter:' + b[0] + '"' + (cur === 'ter:' + b[0] ? ' class="on"' : '') + '>' + b[1] + '</button>'; }).join('') + '</div>' +
      '<div class="row t76-row"><span class="lab">笔刷</span>' + [[3, '小'], [7, '中'], [13, '大']].map(function (b) { return '<button data-tb="' + b[0] + '"' + (R.brush === b[0] ? ' class="on"' : '') + '>' + b[1] + '</button>'; }).join('') +
      '<button data-tx="strong"' + (T76.strong ? ' class="on"' : '') + '>💪 强</button><span class="lab">风格</span>' + TLOOK.map(function (l) { return '<button data-tl="' + l[0] + '"' + (look === l[0] ? ' class="on"' : '') + '>' + l[1] + '</button>'; }).join('') + '</div>' +
      '<div class="row t76-row"><button data-tx="nat"' + (t.nat === false ? '' : ' class="on"') + '>🏞 自然地形</button><button data-c="terauto">✨ Smart 地形</button><button data-tp="flat">🗑 清空地形</button></div>';
  }
  var drawSheet0 = drawSheet;
  drawSheet = function () { drawSheet0(); if (R.tab === 'ter') { var sh = ov.querySelector('.sheet'); if (sh) sh.innerHTML = terSheet(); } };
  ov.addEventListener('click', function (e) {
    var b = e.target.closest && e.target.closest('[data-tp],[data-tb],[data-tl],[data-tx]'); if (!b || !ov.contains(b)) return;
    e.stopPropagation(); var v;
    if ((v = b.getAttribute('data-tp'))) return landscape(v);
    if ((v = b.getAttribute('data-tb'))) { R.brush = +v; return drawSheet(); }
    if ((v = b.getAttribute('data-tl'))) { T76.look = v; return tWrite(function (t) { t.look = v; t.nat = true; delete t.scape; }, '地形风格：' + (TLOOK.filter(function (l) { return l[0] === v; })[0] || ['', v])[1]); }
    if ((v = b.getAttribute('data-tx'))) {
      if (v === 'strong') { T76.strong = !T76.strong; return drawSheet(); }
      if (v === 'nat') { var on = (tGet() || {}).nat === false; return tWrite(function (t) { t.nat = on; }, on ? '🏞 自然地形：开' : '🏞 自然地形：关（方块台阶）'); }
    }
  }, true);
  var t76css = document.createElement('style'); t76css.textContent = '#vx62 .t76-row{flex-wrap:nowrap;overflow-x:auto;scrollbar-width:thin}#vx62 .t76-row button{flex:none}';
  document.head.appendChild(t76css);

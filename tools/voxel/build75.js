  /* ================================================================ 75 · 🧱 建造 — build the voxel world yourself
     Tools: 🧱 放置 / ⛏ 拆除 one cell · ▭ 方块体 two taps = a solid box · ▱ 地板 two taps = a floor · 🏠 小屋 two taps =
     walls, floor and roof with a door · 🖌 涂色 recolours a cell · 🌳 预制 stamps a tree, lamp, bench, fountain, tower
     or bridge. Cell size 细 / 标准 / 大 (1 voxel, one My World block, two blocks), 🪞 mirror across the island.
     Every step is kept in the island's own data (window.__vxStore: synced with it, and My World's ↶ ↷ take it back);
     steps are in My World block units, so they stay put at any voxel precision. Off My World (no store) they stay on
     this device. */
  var BMAT = [   // [key, name, texture | colour, kind]
    ['grass', '草地', 'grass_top', 'ground'], ['dirt', '泥土', 'dirt', 'ground'], ['sand', '沙子', 'sand', 'ground'], ['stone', '石头', 'stone', 'solid'],
    ['cobble', '圆石', 'cobble', 'solid'], ['bricks', '石砖', 'stone_bricks', 'solid'], ['brick', '红砖', 'brick', 'solid'], ['plaster', '白墙', 'plaster', 'solid'],
    ['quartz', '石英', 'quartz', 'solid'], ['oak', '橡木板', 'oak', 'solid'], ['spruce', '云杉板', 'spruce', 'solid'], ['dark', '深色木', 'dark', 'solid'],
    ['log', '原木', 'log', 'solid'], ['leaves', '树叶', 'leaves', 'solid'], ['glass', '玻璃', 'glass', 'glass'], ['water', '水', 'water', 'water'],
    ['books', '书架', 'bookshelf', 'solid'], ['lantern', '灯', 'lantern', 'solid'], ['gold', '金块', 'gold', 'solid'], ['path', '小路', 'path', 'ground'],
    ['c:e74c3c', '红', '#e74c3c'], ['c:f39c12', '橙', '#f39c12'], ['c:f1c40f', '黄', '#f1c40f'], ['c:2ecc71', '绿', '#2ecc71'],
    ['c:1abc9c', '青', '#1abc9c'], ['c:3498db', '蓝', '#3498db'], ['c:9b59b6', '紫', '#9b59b6'], ['c:ff7eb6', '粉', '#ff7eb6'],
    ['c:ffffff', '白', '#ffffff'], ['c:95a5a6', '灰', '#95a5a6'], ['c:34495e', '深灰', '#34495e'], ['c:111111', '黑', '#111111']
  ];
  var BTOOLS = [['place', '🧱', '放置'], ['erase', '⛏', '拆除'], ['box', '▭', '方块体'], ['floor', '▱', '地板'], ['house', '🏠', '小屋'], ['paint', '🖌', '涂色'], ['stamp', '🌳', '预制']];
  var BPRE = [['tree', '🌳', '树'], ['lamp', '💡', '路灯'], ['bench', '🪑', '长椅'], ['fountain', '⛲', '喷泉'], ['tower', '🗼', '塔'], ['bridge', '🌉', '小桥']];
  var BS = { tool: 'place', mat: 'oak', size: 'std', mirror: false, pre: 'tree', a: null, ops: null, key: '', marker: null };
  var texImg = {};
  function matDef(k) { for (var i = 0; i < BMAT.length; i++) if (BMAT[i][0] === k) return BMAT[i]; return BMAT[0]; }
  function matUrl(m) { var md = MD(); if (/^#/.test(m[2])) return ''; try { return md && md.tex ? md.tex(m[2]) : ''; } catch (e) { return ''; } }
  function matBlock(k) {   // the block for a palette key (registered on demand: the registry is rebuilt with every conversion)
    var m = matDef(k);
    if (/^#/.test(m[2])) { var n = parseInt(m[2].slice(1), 16); return colorBlock(n >> 16 & 255, n >> 8 & 255, n & 255); }
    return block('b75:' + m[0], function () {
      var url = matUrl(m), key = 'b75img:' + m[0];
      function draw(cx, x, y) { var im = texImg[url]; if (im && im.complete && im.naturalWidth) { cx.imageSmoothingEnabled = false; cx.drawImage(im, x, y, TS, TS); } else { cx.fillStyle = '#9aa3ad'; cx.fillRect(x, y, TS, TS); } }
      var t = tileOf(key, draw);
      if (url && !(texImg[url] && texImg[url].complete)) {
        var im = texImg[url] || (texImg[url] = new Image());
        im.addEventListener('load', function () { try { draw(atlasCx, (t % ATN) * TS, Math.floor(t / ATN) * TS); if (R.atlasTex) R.atlasTex.needsUpdate = true; } catch (e) {} });
        if (!im.src) im.src = url;
      }
      return { tile: t, col: [1, 1, 1], kind: m[3] || 'solid', name: m[1] };
    });
  }
  function cellVox() { var S = R.vw ? R.vw.S : 4; return BS.size === 'fine' ? 1 : BS.size === 'big' ? S * 2 : S; }
  // ---- the steps, in My World block units: { t: 'box', a: [x, y, z], b: [x, y, z], k: key | '' , m: 'solid' | 'shell' | 'paint' }
  function toW(x, y, z) { var vw = R.vw; return [Math.round((x / vw.S + vw.ox) * 8) / 8, Math.round(y / vw.S * 8) / 8, Math.round((z / vw.S + vw.oz) * 8) / 8]; }
  function toV(p) { var vw = R.vw; return [Math.round((p[0] - vw.ox) * vw.S), Math.round(p[1] * vw.S), Math.round((p[2] - vw.oz) * vw.S)]; }
  function storeKey() { return (R.ctxKey || '').replace(/\|S\d+$/, ''); }
  function loadOps() {
    BS.key = storeKey(); var st = window.__vxStore, o = null;
    try { o = st && st.get ? st.get(BS.key) : null; } catch (e) {}
    if (!o) try { o = JSON.parse(localStorage.getItem(LS_KEY + 'b75:' + BS.key) || 'null'); } catch (e) {}
    BS.ops = Array.isArray(o) ? o : [];
  }
  function saveOps() {
    var st = window.__vxStore, ok = false;
    try { ok = !!(st && st.set && st.set(BS.key, BS.ops)); } catch (e) {}
    if (!ok) try { localStorage.setItem(LS_KEY + 'b75:' + BS.key, JSON.stringify(BS.ops)); } catch (e) {}
    R.hash = stateHash();   // our own change: no reconversion for it
  }
  function writeOp(op, cols) {   // the voxels of one step
    var vw = R.vw, a = toV(op.a), b = toV(op.b), id = op.k ? matBlock(op.k) : 0;
    var x0 = Math.max(0, Math.min(a[0], b[0])), x1 = Math.min(vw.W, Math.max(a[0], b[0])), y0 = Math.max(0, Math.min(a[1], b[1])), y1 = Math.min(vw.H, Math.max(a[1], b[1])), z0 = Math.max(0, Math.min(a[2], b[2])), z1 = Math.min(vw.D, Math.max(a[2], b[2]));
    var th = Math.max(1, Math.round((op.th || 0) * vw.S)), door = op.door ? [Math.round((op.door[0] - vw.ox) * vw.S), Math.round((op.door[1] - vw.ox) * vw.S), Math.round(op.door[2] * vw.S)] : null;   // door and walls: block units too
    for (var y = y0; y < y1; y++) for (var z = z0; z < z1; z++) for (var x = x0; x < x1; x++) {
      var v = id;
      if (op.m === 'shell') {   // walls one cell thick, a floor, a flat roof and a door gap on the front
        var edge = x < x0 + th || x >= x1 - th || z < z0 + th || z >= z1 - th, cap = y < y0 + th || y >= y1 - th;
        if (!edge && !cap) v = 0;
        if (door && z < z0 + th && x >= door[0] && x < door[1] && y >= y0 + th && y < Math.min(y1 - th, y0 + th + door[2])) v = 0;
        if (!edge && !cap) { vw.v[vw.i(x, y, z)] = 0; continue; }
      }
      if (op.m === 'paint' && !vw.v[vw.i(x, y, z)]) continue;
      vw.v[vw.i(x, y, z)] = v;
    }
    if (cols) cols.push([x0, z0, x1, z1]);
  }
  function applyOps() { if (!R.vw) return; loadOps(); BS.ops.forEach(function (op) { try { writeOp(op); } catch (e) {} }); R.vw.tops(); }
  function refresh(boxes) {
    var vw = R.vw, seen = {};
    boxes.forEach(function (bx) {
      for (var z = bx[1]; z < bx[3]; z++) for (var x = bx[0]; x < bx[2]; x++) vw.colTop(x, z);
      for (var cz = Math.floor((bx[1] - 1) / CH); cz <= Math.floor(bx[3] / CH); cz++) for (var cx = Math.floor((bx[0] - 1) / CH); cx <= Math.floor(bx[2] / CH); cx++) { var k = cx + ',' + cz; if (!seen[k]) { seen[k] = 1; buildChunk(cx, cz); } }
    });
    if (R.atlasTex) R.atlasTex.needsUpdate = true;
  }
  function mirrorOf(op) {   // across the island's middle (east ↔ west)
    var vw = R.vw, mid = vw.ox + vw.W / vw.S / 2, o = JSON.parse(JSON.stringify(op));
    o.a[0] = 2 * mid - op.b[0]; o.b[0] = 2 * mid - op.a[0];
    if (o.door) o.door = [2 * mid - op.door[1], 2 * mid - op.door[0], op.door[2]];
    return o;
  }
  function commit(list, label) {
    if (BS.mirror) list = list.concat(list.map(mirrorOf));
    var boxes = []; list.forEach(function (op) { BS.ops.push(op); writeOp(op, boxes); });
    refresh(boxes); saveOps(); toast(label + (BS.mirror ? ' · 🪞 已镜像' : '')); drawSheet();
  }
  function cellAt(hit, out) {   // the grid cell next to the face you tapped (out) or the one you tapped
    var u = cellVox(), x = hit.x + (out ? hit.n[0] : 0), y = hit.y + (out ? hit.n[1] : 0), z = hit.z + (out ? hit.n[2] : 0);
    return [Math.floor(x / u) * u, Math.floor(y / u) * u, Math.floor(z / u) * u];
  }
  function boxOp(c0, c1, k, m) { var u = cellVox(); return { t: 'box', a: toW(Math.min(c0[0], c1[0]), Math.min(c0[1], c1[1]), Math.min(c0[2], c1[2])), b: toW(Math.max(c0[0], c1[0]) + u, Math.max(c0[1], c1[1]) + u, Math.max(c0[2], c1[2]) + u), k: k, m: m || 'solid' }; }
  function prefab(id, c) {   // a few boxes around the tapped cell, in voxels (u = one cell)
    var u = cellVox(), P = [];
    function bx(x0, y0, z0, x1, y1, z1, k) { P.push({ t: 'box', a: toW(c[0] + x0 * u, c[1] + y0 * u, c[2] + z0 * u), b: toW(c[0] + x1 * u, c[1] + y1 * u, c[2] + z1 * u), k: k, m: 'solid' }); }
    if (id === 'tree') { bx(0, 0, 0, 1, 4, 1, 'log'); bx(-2, 3, -2, 3, 5, 3, 'leaves'); bx(-1, 5, -1, 2, 6, 2, 'leaves'); }
    if (id === 'lamp') { bx(0, 0, 0, 1, 4, 1, 'c:34495e'); bx(0, 4, 0, 1, 5, 1, 'lantern'); }
    if (id === 'bench') { bx(-1, 0, 0, 2, 1, 1, 'dark'); bx(-1, 1, 1, 2, 2, 2, 'dark'); bx(-1, 0, 1, 2, 1, 2, 'dark'); }
    if (id === 'fountain') { bx(-2, 0, -2, 3, 1, 3, 'quartz'); bx(-1, 0, -1, 2, 1, 2, 'water'); bx(0, 1, 0, 1, 3, 1, 'quartz'); bx(0, 3, 0, 1, 4, 1, 'water'); }
    if (id === 'tower') { P.push(Object.assign(boxOp([c[0] - u, c[1], c[2] - u], [c[0] + u, c[1] + 7 * u, c[2] + u], 'bricks', 'shell'), { th: u / R.vw.S, door: [toW(c[0], 0, 0)[0], toW(c[0] + u, 0, 0)[0], 2 * u / R.vw.S] })); bx(-2, 8, -2, 3, 9, 3, 'bricks'); bx(-1, 9, -1, 2, 10, 2, 'c:e74c3c'); }
    if (id === 'bridge') { bx(-3, 0, 0, 4, 1, 2, 'oak'); bx(-3, 1, 0, 4, 2, 1, 'log'); bx(-3, 1, 1, 4, 2, 2, 'log'); bx(-2, 1, 0, 3, 2, 2, ''); }
    return P;
  }
  function buildTap(hit) {
    var t = BS.tool, k = BS.mat, out = t === 'place' || t === 'box' || t === 'floor' || t === 'house' || t === 'stamp';
    var c = cellAt(hit, out), u = cellVox();
    if (t === 'place') return commit([boxOp(c, c, k)], '已放置 ' + matDef(k)[1]);
    if (t === 'erase') return commit([boxOp(cellAt(hit, false), cellAt(hit, false), '')], '已拆除');
    if (t === 'paint') return commit([Object.assign(boxOp(cellAt(hit, false), cellAt(hit, false), k), { m: 'paint' })], '已涂成 ' + matDef(k)[1]);
    if (t === 'stamp') return commit(prefab(BS.pre, c), '已放置 ' + (BPRE.filter(function (p) { return p[0] === BS.pre; })[0] || [0, 0, ''])[2]);
    // two taps: the first corner, then the second
    if (!BS.a) { BS.a = c; mark(c); drawSheet(); return toast('已选第一个角 · 再点第二个角'); }
    var a = BS.a; BS.a = null; mark(null);
    if (t === 'floor') return commit([boxOp(a, [c[0], a[1], c[2]], k)], '已铺地板');
    if (t === 'box') return commit([boxOp(a, c, k)], '已建方块体');
    if (t === 'house') {   // at least 3 × 3 cells, walls 4 cells high above the floor if the second tap was on the ground
      var x0 = Math.min(a[0], c[0]), x1 = Math.max(a[0], c[0]), z0 = Math.min(a[2], c[2]), z1 = Math.max(a[2], c[2]);
      if (x1 - x0 < 2 * u) x1 = x0 + 2 * u; if (z1 - z0 < 2 * u) z1 = z0 + 2 * u;
      var y0 = Math.min(a[1], c[1]), y1 = Math.max(Math.max(a[1], c[1]), y0 + 5 * u), mid = Math.floor((x0 + x1) / 2 / u) * u;
      var op = boxOp([x0, y0, z0], [x1, y1, z1], k, 'shell'); op.th = u / R.vw.S; op.door = [toW(mid, 0, 0)[0], toW(mid + u, 0, 0)[0], 2 * u / R.vw.S];
      return commit([op], '已建小屋（门朝南）');
    }
  }
  function mark(c) {   // a wire cube on the first corner
    var T = R.T; if (BS.marker) { R.scene.remove(BS.marker); BS.marker.geometry.dispose(); BS.marker = null; }
    if (!c || !T) return; var u = cellVox();
    BS.marker = new T.LineSegments(new T.EdgesGeometry(new T.BoxGeometry(u * 1.04, u * 1.04, u * 1.04)), new T.LineBasicMaterial({ color: 0xffd400 }));
    BS.marker.position.set(c[0] + u / 2, c[1] + u / 2, c[2] + u / 2); R.scene.add(BS.marker);
  }
  function buildSheet() {
    var two = BS.tool === 'box' || BS.tool === 'floor' || BS.tool === 'house';
    var hint = { place: '点方块的一面，在它旁边放一格', erase: '点一格把它拆掉', box: '点两个角，填满之间的方块体', floor: '点两个角，铺一层地板', house: '点两个角，建一间有门的小屋（墙、地板、屋顶）', paint: '点一格，涂成选中的材质', stamp: '点地面，放下选中的预制件' }[BS.tool];
    return '<p class="hint b75-hint">' + (two && BS.a ? '✅ 已选第一个角 · 再点第二个角 <button data-bx="cancel">取消</button>' : hint) + '</p>' +
      '<div class="row b75-tools">' + BTOOLS.map(function (t) { return '<button data-bt="' + t[0] + '"' + (BS.tool === t[0] ? ' class="on"' : '') + '>' + t[1] + ' ' + t[2] + '</button>'; }).join('') + '</div>' +
      (BS.tool === 'stamp' ? '<div class="row">' + BPRE.map(function (p) { return '<button data-bp="' + p[0] + '"' + (BS.pre === p[0] ? ' class="on"' : '') + '>' + p[1] + ' ' + p[2] + '</button>'; }).join('') + '</div>' : '') +
      (BS.tool === 'erase' || BS.tool === 'stamp' ? '' : '<div class="b75-mats">' + BMAT.map(function (m) { var u = matUrl(m); return '<button data-bm="' + m[0] + '" title="' + m[1] + '"' + (BS.mat === m[0] ? ' class="on"' : '') + '><i style="' + (u ? 'background-image:url(' + u + ')' : 'background:' + m[2]) + '"></i><span>' + m[1] + '</span></button>'; }).join('') + '</div>') +
      '<div class="row"><span class="lab">格子</span>' + [['fine', '细'], ['std', '标准'], ['big', '大']].map(function (s) { return '<button data-bs="' + s[0] + '"' + (BS.size === s[0] ? ' class="on"' : '') + '>' + s[1] + '</button>'; }).join('') +
      '<button data-bx="mirror"' + (BS.mirror ? ' class="on"' : '') + '>🪞 镜像</button><span class="lab">' + (BS.ops ? BS.ops.length : 0) + ' 步 · ↶ ↷ 撤销/重做</span>' + (BS.ops && BS.ops.length ? '<button data-bx="clear">🗑 清空建造</button>' : '') + '</div>';
  }
  ov.addEventListener('click', function (e) {
    var b = e.target.closest && e.target.closest('[data-bt],[data-bm],[data-bs],[data-bp],[data-bx]'); if (!b || !ov.contains(b)) return;
    e.stopPropagation(); var v;
    if ((v = b.getAttribute('data-bt'))) { BS.tool = v; BS.a = null; mark(null); }
    if ((v = b.getAttribute('data-bm'))) BS.mat = v;
    if ((v = b.getAttribute('data-bs'))) { BS.size = v; BS.a = null; mark(null); }
    if ((v = b.getAttribute('data-bp'))) BS.pre = v;
    if ((v = b.getAttribute('data-bx'))) {
      if (v === 'cancel') { BS.a = null; mark(null); }
      if (v === 'mirror') BS.mirror = !BS.mirror;
      if (v === 'clear') { if (b.dataset.sure) { BS.ops = []; saveOps(); return build({ keep: true }); } b.dataset.sure = '1'; b.textContent = '再点一次确认清空'; return; }
    }
    drawSheet();
  }, true);
  var b75css = document.createElement('style'); b75css.textContent =
    '#vx62 .b75-tools{flex-wrap:nowrap;overflow-x:auto}#vx62 .b75-mats{display:flex;gap:5px;overflow-x:auto;margin:6px 0;padding-bottom:2px;scrollbar-width:thin}#vx62 .b75-mats button{flex:0 0 50px}' +
    '#vx62 .b75-mats button{display:flex;flex-direction:column;align-items:center;gap:2px;padding:4px 2px;font-size:11px}#vx62 .b75-mats i{width:26px;height:26px;border-radius:5px;background-size:cover;image-rendering:pixelated;box-shadow:inset 0 0 0 1px rgba(0,0,0,.25)}' +
    '#vx62 .b75-mats button.on{outline:2px solid #ffd400;outline-offset:1px}#vx62 .b75-hint button{margin-left:6px;padding:3px 8px}';
  document.head.appendChild(b75css);

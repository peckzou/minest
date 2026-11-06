  /* ================================================================ 78 · 🏛 展馆 — from cards to an exhibition in a few taps
     ① a building (one tap: a new exhibition pavilion on a free spot, or one of the island's own) · ② its rooms — ⚡ all
     the board's lists set out at once (My World's Smart arrange for one building), or one list as its own room named
     after it · ③ walk in: tap a room and it is built in voxels, its displays already holding the cards. 📄 陈列 stays for
     placing one card by hand. Everything is My World's own data and history (window.__showStore). */
  var SH = { sel: null, busy: false };
  function shStore() { return window.__showStore || null; }
  function shState() { var s = shStore(); try { return s ? s.state() : null; } catch (e) { return null; } }
  function pressR(v) {   // the voxel world's own 🏠 actions (data-r): into a building, into one of its rooms
    var b = document.createElement('button'); b.type = 'button'; b.hidden = true; b.setAttribute('data-r', v);
    (ov.querySelector('.wf-center') || ov).appendChild(b); try { b.click(); } finally { b.remove(); }
  }
  function goRoom(pcId, rid) {
    toast('🚪 正在进入展厅…');
    if (lvl() >= 3) return pressR('room:' + rid);
    pressR('bld:' + pcId); var t = 0, iv = setInterval(function () { if (lvl() >= 3 || ++t > 25) { clearInterval(iv); if (lvl() >= 3) pressR('room:' + rid); } }, 200);
  }
  function hallSheet() {
    var st = shState(); if (!st) return '<p class="hint">先在 My World 里打开一座岛</p>';
    if (st.at && st.at.room) return '<p class="hint">🖼 你在展厅里 · 点展架上的卡片看大图 · 用 <b>📄 陈列</b> 再放一张，<b>🧩 摆放</b> 加展架</p><div class="row"><button class="go" data-r="up">‹ 回到建筑</button><button data-tab="show">📄 陈列</button><button data-tab="put">🧩 摆放</button></div>';
    if (st.at) return '<p class="hint">在建筑里 · 选一个展厅进去，或 ‹ 回到岛上布展</p><div class="row"><button data-r="up">‹ 回到岛</button></div>' + (function () { var b = st.buildings.filter(function (x) { return x.id === st.at.pc; })[0]; return b ? roomsRow(b) : ''; })();
    var bs = st.buildings; if (!SH.sel || !bs.some(function (b) { return b.id === SH.sel; })) SH.sel = bs.length ? bs[0].id : null;
    var b = bs.filter(function (x) { return x.id === SH.sel; })[0], total = 0, out = 0; st.lists.forEach(function (l) { total += l.n; out += l.out; });
    var h = '<p class="hint"><b>① 选建筑</b> → <b>② 一键布展</b>（每个列表一个展厅，卡片上展架）→ <b>③ 点展厅走进去</b> · 已陈列 ' + out + '/' + total + ' 张</p>';
    h += '<div class="row"><span class="lab">① 建筑</span>' + bs.map(function (x) { return '<button data-sh="sel:' + escH(x.id) + '"' + (x.id === SH.sel ? ' class="on"' : '') + '>🏛 ' + escH(x.name) + (x.rooms.length ? ' · ' + x.rooms.length + ' 间' : '') + '</button>'; }).join('') +
      '<button class="add" data-sh="hall">＋ 新展馆</button><button data-tab="room">🏗 换一种建筑…</button></div>';
    if (!b) return h + '<div class="row"><button class="go" data-sh="quick">⚡ 一键：建展馆并把整个看板陈列进去</button></div>';
    h += '<div class="row"><span class="lab">② 布展</span><button class="go" data-sh="fill:">⚡ 所有列表 → 展厅</button></div>';
    h += '<div class="sh78-lists">' + st.lists.map(function (l) { var all = l.n && l.out >= l.n;
      return '<div class="sh78-l"><span><b>' + escH(l.title) + '</b><small>' + l.n + ' 张 · 已陈列 ' + l.out + '</small></span><button data-sh="fill:' + escH(l.id) + '"' + (all ? ' disabled' : '') + '>' + (all ? '✓ 已陈列' : '＋ 建成展厅') + '</button></div>'; }).join('') + '</div>';
    return h + roomsRow(b);
  }
  function roomsRow(b) {
    return '<div class="row"><span class="lab">③ 走进去</span>' + (b.rooms.length ? b.rooms.map(function (r) { return '<button class="go" data-sh="room:' + escH(b.id) + ':' + escH(r.id) + '">' + r.ic + ' ' + escH(r.n) + (r.displays ? ' · ' + r.displays + ' 架 · ' + r.things + ' 件' : '') + '</button>'; }).join('') : '<span class="lab">还没有展厅 · 先 ② 布展</span>') + '</div>';
  }
  function shAct(v) {
    var s = shStore(); if (!s || SH.busy) return;
    if (/^sel:/.test(v)) { SH.sel = v.slice(4); return drawSheet(); }
    if (/^room:/.test(v)) { var p = v.split(':'); return goRoom(p[1], p[2]); }
    SH.busy = true;
    try {
      if (v === 'hall' || v === 'quick') {
        var id = s.hall(); if (!id) { toast('岛上没有空地放展馆了 · 用 ⛰ 地形 削平一块，或在 2D 里 More land'); return; }
        SH.sel = id; toast('🏛 已放下一座展馆（↶ 可撤销）');
        if (v === 'quick') { var q = s.fill(id, '*'); toast('⚡ 已建 ' + q.rooms + ' 个展厅、' + q.displays + ' 个展架 · 点 ③ 里的展厅走进去'); }
      }
      if (/^fill:/.test(v)) {
        var lid = v.slice(5), r = s.fill(SH.sel, lid || '*');
        toast(r.displays ? '⚡ ' + (r.rooms ? '新展厅：' + r.names.join('、') + ' · ' : '') + r.displays + ' 个展架摆好了（↶ 可撤销）· 点 ③ 走进去' : '这些卡片都已经陈列在别处了');
      }
    } finally { SH.busy = false; }
    drawSheet();
  }
  ov.addEventListener('click', function (e) {
    var b = e.target.closest && e.target.closest('[data-sh]'); if (!b || !ov.contains(b)) return;
    e.stopPropagation(); shAct(b.getAttribute('data-sh'));
  }, true);
  var drawSheet78 = drawSheet;
  drawSheet = function () { drawSheet78(); if (R.tab === 'hall') { var sh = ov.querySelector('.sheet'); if (sh) { sh.innerHTML = hallSheet(); sh.classList.add('on'); } } };
  var sh78css = document.createElement('style'); sh78css.textContent =
    '#vx62 .sh78-lists{display:grid;grid-template-columns:repeat(auto-fill,minmax(220px,1fr));gap:6px;margin:4px 0 8px}' +
    '#vx62 .sh78-l{display:flex;align-items:center;gap:8px;padding:6px 8px;border-radius:10px;background:rgba(255,255,255,.06);border:1px solid rgba(255,255,255,.1)}' +
    '#vx62 .sh78-l span{flex:1;min-width:0;display:flex;flex-direction:column}#vx62 .sh78-l b{white-space:nowrap;overflow:hidden;text-overflow:ellipsis;font-size:13px}#vx62 .sh78-l small{opacity:.7;font-size:11px}' +
    '#vx62 .sh78-l button{flex:none}#vx62 .sheet button:disabled{opacity:.5}';
  document.head.appendChild(sh78css);
  /* 78 · the cards themselves, in the voxel world, on their displays as the display is made: a shelf holds them in rows
     on its front, a wall or board carries them flat, an easel one big card, a knowledge tree hangs them round its
     crown, a table or case lays them tilted on top; anything else gets a small wall of cards in front. Each display's
     size is measured in the voxels; its front is the side facing the middle of the room (or island). Tap a card: it
     opens big, and flips to its meaning, points and checklist. */
  var C78 = { g: null };
  function shapeOf(k) {
    if (/tree|plant|bonsai/.test(k)) return 'tree';
    if (/easel|lectern|podium|stand$|^stand|tripod/.test(k)) return 'easel';
    if (/table|desk|vitrine|showcase|counter|plinth|pedestal|bench|island/.test(k)) return 'table';
    if (/shelf|book|case|cabinet|rack|cubby|locker|dresser/.test(k)) return 'shelf';
    if (/wall|frame|gallery|board|map|screen|poster|notice|panel|sign/.test(k)) return 'wall';
    return 'free';
  }
  function cardTex(c) {
    var T = R.T, cv = document.createElement('canvas'); cv.width = 256; cv.height = 192; var g = cv.getContext('2d');
    g.fillStyle = '#fbfaf7'; g.fillRect(0, 0, 256, 192); g.fillStyle = '#f2c13d'; g.fillRect(0, 0, 256, 10);
    g.strokeStyle = 'rgba(0,0,0,.18)'; g.lineWidth = 4; g.strokeRect(2, 2, 252, 188);
    var tex = new T.CanvasTexture(cv); if (T.SRGBColorSpace) tex.colorSpace = T.SRGBColorSpace;
    function words(text, y0, size, lines, col) {
      g.fillStyle = col || '#1f2937'; g.font = 'bold ' + size + 'px system-ui, sans-serif'; g.textAlign = 'center'; g.textBaseline = 'middle';
      var out = [], line = '';
      String(text || '').split(/(\s+)/).forEach(function (w) { if (/[㐀-鿿]/.test(w)) { for (var i = 0; i < w.length; i++) { if (g.measureText(line + w[i]).width > 228) { out.push(line); line = ''; } line += w[i]; } return; } if (g.measureText(line + w).width > 228 && line.trim()) { out.push(line.trim()); line = ''; } line += w; });
      if (line.trim()) out.push(line.trim()); out = out.slice(0, lines);
      out.forEach(function (l, i) { g.fillText(l, 128, y0 + (i - (out.length - 1) / 2) * size * 1.15); });
    }
    if (c.img) {
      words(c.title, 166, 20, 1);
      var im = new Image(); im.crossOrigin = 'anonymous';
      im.onload = function () { try { var r = Math.max(236 / im.width, 132 / im.height), w = im.width * r, h = im.height * r; g.save(); g.beginPath(); g.rect(10, 14, 236, 132); g.clip(); g.drawImage(im, 128 - w / 2, 80 - h / 2, w, h); g.restore(); tex.needsUpdate = true; } catch (e) {} };
      im.src = c.img;
    } else { words(c.title, c.zh ? 84 : 100, 26, c.zh ? 3 : 4); if (c.zh) words(c.zh, 160, 20, 1, '#64748b'); }
    return tex;
  }
  function clearCards() { if (C78.g && R.scene) { R.scene.remove(C78.g); C78.g.traverse(function (o) { if (o.material) { if (o.material.map) o.material.map.dispose(); o.material.dispose(); } if (o.geometry) o.geometry.dispose(); }); } C78.g = null; }
  function cardOf(ref) {
    var st = shStore(), c = null; try { c = st && st.card ? st.card(ref) : null; } catch (e) {}
    if (!c) { var v = null; try { v = MD().resolve(ref); } catch (e) {} c = { title: (v && v.title) || ref, zh: '', text: (v && v.note) || '', img: (v && (v.img || v.url)) || '', list: '', sub: [], checks: [] }; }
    c.ref = ref; return c;
  }
  function plane(T, c, w, h) { var m = new T.Mesh(new T.PlaneGeometry(w, h), new T.MeshBasicMaterial({ map: cardTex(c), side: T.DoubleSide })); m.userData.card78 = c; return m; }
  function cards78() {
    clearCards(); var vw = R.vw, T = R.T, st = shStore(); if (!vw || !T || !st || !st.pieces) return;
    var P = []; try { P = st.pieces(); } catch (e) { return; } if (!P.length) return;
    var S = vw.S, L = REG.list, cx = vw.W / 2, cz = vw.D / 2, grp = new T.Group(); grp.name = 'cards78';
    P.forEach(function (p) {
      var refs = p.refs.slice(0, 30); if (!refs.length) return;
      var x0 = (p.x0 - vw.ox) * S, x1 = (p.x1 - vw.ox) * S, z0 = (p.y0 - vw.oz) * S, z1 = (p.y1 - vw.oz) * S, mx = (x0 + x1) / 2, mz = (z0 + z1) / 2;
      // its front: the side that faces the middle, along one axis
      var dx = cx - mx, dz = cz - mz, alongX = Math.abs(dz) >= Math.abs(dx), sgn = alongX ? (dz >= 0 ? 1 : -1) : (dx >= 0 ? 1 : -1);
      var faceW = alongX ? x1 - x0 : z1 - z0, depth = alongX ? z1 - z0 : x1 - x0;
      // its height and the floor, measured in the voxels
      var floor = groundAt(alongX ? mx : mx + sgn * (depth / 2 + 1), alongX ? mz + sgn * (depth / 2 + 1) : mz), top = floor;
      for (var z = Math.max(0, Math.floor(z0)); z < Math.min(vw.D, Math.ceil(z1)); z++) for (var x = Math.max(0, Math.floor(x0)); x < Math.min(vw.W, Math.ceil(x1)); x++)
        for (var y = vw.H - 1; y >= floor; y--) { var id = vw.v[vw.i(x, y, z)]; if (id && L[id] && L[id].kind !== 'ground' && L[id].kind !== 'water') { top = Math.max(top, y + 1); break; } }
      var h = Math.max(S, top - floor), shape = shapeOf(p.k), cards = refs.map(cardOf), n = cards.length, g = new T.Group();
      function grid(w0, h0, y0, push, maxW) {   // cards in rows over a w0 × h0 face, y0 its bottom, push off the face
        var best = null;
        for (var cols = 1; cols <= n; cols++) { var rows = Math.ceil(n / cols), cw = Math.min(maxW || 1.1 * S, (w0 - (cols + 1) * .08 * S) / cols, ((h0 - (rows + 1) * .08 * S) / rows) * 4 / 3); if (cw > 0 && (!best || cw > best.cw)) best = { cols: cols, rows: rows, cw: cw }; }
        if (!best) best = { cols: n, rows: 1, cw: .4 * S }; var cw = Math.max(.35 * S, best.cw), ch = cw * .75, gap = .08 * S;
        cards.forEach(function (c, i) { var col = i % best.cols, row = Math.floor(i / best.cols), m = plane(T, c, cw, ch);
          m.position.set((col - (best.cols - 1) / 2) * (cw + gap), y0 + h0 - (row + .5) * (ch + gap) - gap / 2, push); g.add(m); });
      }
      if (shape === 'shelf') grid(faceW * .94, h * .92, floor + h * .04, depth / 2 + .06 * S, .9 * S);
      else if (shape === 'wall') grid(faceW * .96, Math.max(S, h - .5 * S), floor + .5 * S, depth / 2 + .06 * S, 1.2 * S);
      else if (shape === 'easel') { var ew = Math.min(1.4 * S, Math.max(.8 * S, faceW * .9)); if (n === 1) { var m1 = plane(T, cards[0], ew, ew * .75); m1.position.set(0, floor + h * .62, depth * .15); m1.rotation.x = -.12; g.add(m1); } else grid(Math.max(faceW, 1.6 * S), Math.max(h * .7, S), floor + h * .3, depth * .15, ew); }
      else if (shape === 'table') {
        var tw = Math.min(.9 * S, (faceW - .1 * S) / Math.min(n, 4)), per = Math.max(1, Math.floor(faceW / (tw + .08 * S)));
        cards.forEach(function (c, i) { var col = i % per, row = Math.floor(i / per), m = plane(T, c, tw, tw * .75);
          m.position.set((col - (Math.min(per, n) - 1) / 2) * (tw + .08 * S), floor + h + .25 * S + row * .02 * S, depth / 2 - .3 * S - row * tw * .8); m.rotation.x = -1.0; g.add(m); });
      }
      else if (shape === 'tree') {
        var rad = Math.max(faceW, depth) / 2 + .35 * S, tiers = Math.ceil(n / 10), cw2 = .85 * S;
        cards.forEach(function (c, i) { var tier = Math.floor(i / 10), k = i % 10, cnt = Math.min(10, n - tier * 10), a = (k / cnt) * Math.PI * 2 + tier * .3, m = plane(T, c, cw2, cw2 * .75);
          m.position.set(Math.sin(a) * rad, floor + h * (.72 - tier * .22), Math.cos(a) * rad); m.rotation.y = a; g.add(m); });
      }
      else grid(Math.max(faceW, Math.ceil(Math.sqrt(n * 1.6)) * 1.25 * S), Math.ceil(n / Math.ceil(Math.sqrt(n * 1.6))) * .95 * S + .3 * S, floor + .3 * S, depth / 2 + 1.1 * S, 1.1 * S);
      g.position.set(mx, 0, mz);
      if (shape !== 'tree') g.rotation.y = alongX ? (sgn > 0 ? 0 : Math.PI) : (sgn > 0 ? Math.PI / 2 : -Math.PI / 2);   // the cards face the front
      grp.add(g);
    });
    if (grp.children.length) { R.scene.add(grp); C78.g = grp; }
  }
  function openCard78(c) {
    var old = ov.querySelector('.c78-card'); if (old) old.remove();
    var m = document.createElement('div'); m.className = 'c78-card';
    var back = (c.text ? '<p>' + escH(c.text) + '</p>' : '<p class="c78-none">这张卡片还没有释义</p>') +
      (c.sub && c.sub.length ? '<h5>要点</h5><ul>' + c.sub.map(function (x) { return '<li>' + escH(x) + '</li>'; }).join('') + '</ul>' : '') +
      (c.checks && c.checks.length ? '<h5>清单</h5><ul>' + c.checks.map(function (x) { return '<li>☐ ' + escH(x) + '</li>'; }).join('') + '</ul>' : '');
    m.innerHTML = '<div class="c78-flip"><div class="c78-face c78-front">' + (c.img ? '<img alt="" src="' + escH(c.img) + '">' : '<em>' + escH(String(c.title).charAt(0).toUpperCase()) + '</em>') +
      '<b>' + escH(c.title) + '</b>' + (c.zh ? '<small>' + escH(c.zh) + '</small>' : '') + (c.list ? '<small>📚 ' + escH(c.list) + '</small>' : '') + '</div>' +
      '<div class="c78-face c78-back"><b>' + escH(c.title) + '</b>' + back + '</div></div>' +
      '<div class="c78-bar"><button type="button" data-c78="flip">⟲ 翻面</button><button type="button" data-c78="x">关闭</button></div>';
    m.addEventListener('click', function (e) { var b = e.target.closest('[data-c78]'); if (e.target === m || (b && b.dataset.c78 === 'x')) return m.remove(); if (b || e.target.closest('.c78-flip')) m.classList.toggle('flipped'); });
    ov.appendChild(m);
  }
  (function cardTaps() {   // a quick tap on a card in the world opens it (any tool)
    var down = null;
    ov.addEventListener('pointerdown', function (e) { if (e.target.tagName === 'CANVAS') down = { x: e.clientX, y: e.clientY, t: performance.now() }; }, true);
    ov.addEventListener('pointerup', function (e) {
      if (!down || !C78.g || e.target.tagName !== 'CANVAS') return; var d = down; down = null;
      if (Math.hypot(e.clientX - d.x, e.clientY - d.y) > 8 || performance.now() - d.t > 450) return;
      var T = R.T, r = R.renderer.domElement.getBoundingClientRect(), ray = new T.Raycaster();
      ray.setFromCamera(new T.Vector2((e.clientX - r.left) / r.width * 2 - 1, 1 - (e.clientY - r.top) / r.height * 2), R.cam);
      var hit = ray.intersectObjects(C78.g.children, true).filter(function (h) { return h.object.userData.card78; })[0];
      if (hit) { e.stopImmediatePropagation(); openCard78(hit.object.userData.card78); }
    }, true);
  })();
  var c78css = document.createElement('style'); c78css.textContent =
    '#vx62 .c78-card{position:absolute;inset:0;z-index:9;background:rgba(0,0,0,.35);display:flex;flex-direction:column;align-items:center;padding-top:max(56px,env(safe-area-inset-top));perspective:1200px}' +
    '#vx62 .c78-flip{position:relative;width:min(340px,86%);height:min(330px,52vh);transform-style:preserve-3d;transition:transform .55s cubic-bezier(.2,.8,.2,1);cursor:pointer}#vx62 .c78-card.flipped .c78-flip{transform:rotateY(180deg)}' +
    '#vx62 .c78-face{position:absolute;inset:0;backface-visibility:hidden;-webkit-backface-visibility:hidden;border-radius:18px;padding:14px;box-sizing:border-box;overflow:auto;display:flex;flex-direction:column;gap:6px;box-shadow:0 18px 50px rgba(0,0,0,.5)}' +
    '#vx62 .c78-front{background:#fbfaf7;color:#111827}#vx62 .c78-back{background:#1d2433;color:#e8eef8;transform:rotateY(180deg)}' +
    '#vx62 .c78-front img,#vx62 .c78-front em{width:100%;height:46%;flex:none;object-fit:cover;border-radius:12px;background:#e8ecf2;display:flex;align-items:center;justify-content:center;font:700 72px system-ui;font-style:normal;color:#c3ccd8}' +
    '#vx62 .c78-face b{font-size:19px}#vx62 .c78-front small{color:#64748b;font-size:13px}#vx62 .c78-back p{margin:0;line-height:1.55;color:#c6d2e4;white-space:pre-wrap}#vx62 .c78-back .c78-none{opacity:.6}' +
    '#vx62 .c78-back h5{margin:6px 0 0;font:700 12px system-ui;color:#f2c13d}#vx62 .c78-back ul{margin:0;padding-left:18px;color:#9fb0c8;font-size:13px;line-height:1.6}' +
    '#vx62 .c78-bar{display:flex;gap:8px;margin-top:10px}#vx62 .c78-bar button{background:#1f2937;color:#fff;border:1px solid rgba(255,255,255,.25);border-radius:10px;padding:8px 14px;font:700 13px system-ui}';
  document.head.appendChild(c78css);

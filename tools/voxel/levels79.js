  /* ================================================================ 79 · one flow for both worlds: the level tools are My World's own
     The voxel world follows the 2D world's building flow (Island → Building → Dollhouse → Room → Display Fixture → Item;
     at every level New · Gallery · Group · Smart, Smart = Base then Detail, Lock, ✓ Confirm, Edit). Those tools are not
     rebuilt here: My World's own console (aside.wf) sits under the voxel world and drives it — whatever it changes, the
     blocks follow. The voxel console (77) therefore shrinks to one strip along the bottom of the 3D view with what only
     the voxel world has (view modes, ↶ ↷, 建造, 地形, 展馆, 摆放, 陈列, 2D, ⚙); a tool's controls float above the strip
     while that tool is picked. 房间 and Smart leave the strip: the level tools below do that work now. */
  (function levels79() {
    var con = ov.querySelector('.vxc'); if (!con || con.querySelector('.lv79-strip')) return;
    var st = document.createElement('style'); st.id = 'vx79-css';
    st.textContent =
      '#vx62.lv79 .vxc{background:none!important;border:0!important;box-shadow:none!important;padding:0 8px 8px!important;pointer-events:none;display:block!important;height:auto!important;min-height:0!important;-webkit-backdrop-filter:none!important;backdrop-filter:none!important}' +
      '#vx62.lv79 .vxc .wf-h{display:none!important}' +
      '#vx62.lv79 .vxc .wf-main{display:flex!important;flex-direction:column!important;gap:6px!important;height:auto!important;min-height:0!important;padding:0!important;background:none!important;border:0!important;grid-template-columns:none!important}' +
      '#vx62.lv79 .vxc .wf-center{order:1;pointer-events:auto;max-height:36vh;overflow:auto;border-radius:14px;padding:8px 10px!important;background:rgba(22,24,30,.92)!important;border:1px solid rgba(255,255,255,.14)!important;box-shadow:0 10px 30px rgba(0,0,0,.4);color:#fff}' +
      '#vx62.lv79 .vxc .wf-center[hidden]{display:none!important}' +
      '#vx62.lv79 .vxc .lv79-strip{order:2;pointer-events:auto;display:flex;align-items:stretch;gap:6px;overflow-x:auto;overflow-y:hidden;-webkit-overflow-scrolling:touch;scrollbar-width:none;border-radius:16px;padding:6px;background:rgba(22,24,30,.78);border:1px solid rgba(255,255,255,.14);-webkit-backdrop-filter:blur(14px) saturate(1.3);backdrop-filter:blur(14px) saturate(1.3);box-shadow:0 8px 24px rgba(0,0,0,.35)}' +
      '#vx62.lv79 .vxc .lv79-strip::-webkit-scrollbar{display:none}' +
      '#vx62.lv79 .vxc .lv79-strip nav{display:flex!important;flex-direction:row!important;gap:6px!important;width:auto!important;height:auto!important;overflow:visible!important;padding:0!important;margin:0!important;background:none!important;border:0!important;flex:0 0 auto!important;grid-template-columns:none!important}' +
      '#vx62.lv79 .vxc .lv79-strip .lv79-sep{flex:0 0 1px;background:rgba(255,255,255,.18);margin:4px 2px}' +
      '#vx62.lv79 .vxc .lv79-strip button{flex:0 0 auto!important;width:54px!important;min-width:54px!important;height:50px!important;min-height:0!important;margin:0!important;padding:3px 2px!important;border-radius:11px!important;display:flex!important;flex-direction:column!important;align-items:center!important;justify-content:center!important;gap:1px!important;font:700 10px/1.1 system-ui!important;letter-spacing:0!important}' +
      '#vx62.lv79 .vxc .lv79-strip button i{font-size:19px!important;line-height:1.05!important;font-style:normal}' +
      '#vx62.lv79 .vxc .lv79-strip button span{white-space:nowrap;overflow:hidden;text-overflow:ellipsis;max-width:100%}' +
      '#vx62.lv79 .vxc .lv79-strip [data-tab="room"],#vx62.lv79 .vxc .lv79-strip [data-tab="smart"]{display:none!important}' +
      '#vx62.lv79 .vxc .vx77-idle{display:none!important}' +
      '#vx62.lv79 .lv79-hint{position:absolute;left:50%;top:10px;transform:translateX(-50%);z-index:6;max-width:86%;padding:6px 12px;border-radius:999px;font:600 12px/1.3 system-ui;color:#fff;background:rgba(22,24,30,.72);border:1px solid rgba(255,255,255,.14);pointer-events:none;white-space:nowrap;overflow:hidden;text-overflow:ellipsis;transition:opacity .4s}' +
      '#vx62.lv79 .lv79-hint[hidden]{display:none}' +
      '#vx62.lv79 .lv79-rooms{position:absolute;left:8px;right:8px;top:46px;z-index:6;display:flex;gap:8px;overflow-x:auto;scrollbar-width:none;padding:8px;border-radius:16px;background:rgba(22,24,30,.78);border:1px solid rgba(255,255,255,.14);-webkit-backdrop-filter:blur(14px) saturate(1.3);backdrop-filter:blur(14px) saturate(1.3);box-shadow:0 8px 24px rgba(0,0,0,.35)}' +
      '#vx62.lv79 .lv79-rooms[hidden]{display:none}#vx62.lv79 .lv79-rooms::-webkit-scrollbar{display:none}' +
      '#vx62.lv79 .lv79-rooms b{flex:0 0 auto;align-self:center;font:700 12px/1.2 system-ui;color:#f2c13d;padding:0 4px;white-space:nowrap}' +
      '#vx62.lv79 .lv79-rooms button{flex:0 0 auto;display:flex;flex-direction:column;align-items:flex-start;gap:2px;min-width:104px;padding:8px 12px;border-radius:12px;border:1px solid rgba(255,255,255,.2);background:rgba(255,255,255,.1);color:#fff;font:700 13px/1.2 system-ui;cursor:pointer;text-align:left}' +
      '#vx62.lv79 .lv79-rooms button small{font:500 11px/1.2 system-ui;opacity:.7}#vx62.lv79 .lv79-rooms button:active{transform:scale(.96)}';
    document.head.appendChild(st);
    ov.classList.add('lv79');
    var main = con.querySelector('.wf-main'), acts = con.querySelector('.wf-acts'), center = con.querySelector('.wf-center'), menu = con.querySelector('.wf-menu');
    var strip = document.createElement('div'); strip.className = 'lv79-strip'; strip.setAttribute('aria-label', '体素工具');
    var sep = document.createElement('i'); sep.className = 'lv79-sep';
    // view modes and undo first, then what only the voxel world builds with, then 2D / settings / back
    strip.appendChild(menu); strip.appendChild(sep); strip.appendChild(acts);
    var x = con.querySelector('.wf-h .wf-x[data-a="x"], .wf-h [data-a="x"]');
    if (x) { x.innerHTML = '<i>✕</i><span>回 2D</span>'; x.classList.remove('wf-x'); var nx = document.createElement('nav'); nx.appendChild(x); var sep2 = document.createElement('i'); sep2.className = 'lv79-sep'; strip.appendChild(sep2); strip.appendChild(nx); }
    main.appendChild(strip);
    // where you are, said once at the top of the 3D view (the full crumbs are in the console below)
    var hint = document.createElement('div'); hint.className = 'lv79-hint'; hint.hidden = true; ov.appendChild(hint);
    var LV = [null, '🏝 Island', '🏛 Building', '🏠 Dollhouse', '🚪 Room', '🗄 Display', '📦 Item'];
    var lastLv = -1, hintT = 0;
    // Dollhouse (3/6): the building's rooms, to walk into — the 2D world shows a cutaway there, the 3D view shows these
    var roomsEl = document.createElement('div'); roomsEl.className = 'lv79-rooms'; roomsEl.hidden = true; ov.appendChild(roomsEl);
    var roomsKey = '';
    roomsEl.addEventListener('click', function (e) { var b = e.target.closest('button[data-lv79room]'); if (!b) return; e.stopPropagation(); try { roomAct('room:' + b.getAttribute('data-lv79room')); } catch (x) {} });
    function drawRooms(lv) {
      if (lv !== 3) { if (!roomsEl.hidden) { roomsEl.hidden = true; roomsKey = ''; } return; }
      var els = document.querySelectorAll('.mn-bv [data-bvroom]'), list = [], seen = {};
      Array.prototype.forEach.call(els, function (el) { var id = el.getAttribute('data-bvroom'); if (!id || seen[id]) return; seen[id] = 1;
        var t = (el.textContent || '').replace(/\s+/g, ' ').trim(), m = t.match(/^(.*?)(\d+\s*things?)\s*$/), r = roomData79(id), n = r && r.d && r.d.pc ? r.d.pc.length : 0, k = m ? parseInt(m[2], 10) : 0;
        // the name from the room's own record (the cutaway cell also lists what is on show), the icon from the cell
        var ic = (t.match(/^[^A-Za-z0-9\u4e00-\u9fff]+/) || [''])[0].trim(), nm = r && r.n ? r.n : r && r.k ? r.k.charAt(0).toUpperCase() + r.k.slice(1) + (/room$/.test(r.k) ? '' : ' room') : (m ? m[1] : t).trim();
        if (r && r.k === 'living') nm = r.n || 'Living room'; else if (r && (r.k === 'kitchen' || r.k === 'study' || r.k === 'bedroom' || r.k === 'bathroom' || r.k === 'garage')) nm = r.n || r.k.charAt(0).toUpperCase() + r.k.slice(1);
        if (!ic && r) ic = { living: '🛋️', kitchen: '🍳', study: '📚', bedroom: '🛏️', bathroom: '🛁', garage: '🚗', dining: '🍽️', hall: '🚪' }[r.k] || '🚪';
        list.push([id, (ic ? ic + ' ' : '') + (nm || 'Room'), (n ? n + ' 件家具' : '空房间') + (k ? ' · ' + k + ' 件展品' : '')]); });
      var key = list.map(function (r) { return r.join('|'); }).join(';');
      if (key === roomsKey && !roomsEl.hidden) return; roomsKey = key;
      roomsEl.innerHTML = '<b>🏠 进入房间</b>' + (list.length ? list.map(function (r) { return '<button type="button" data-lv79room="' + esc79(r[0]) + '">' + esc79(r[1]) + (r[2] ? '<small>' + esc79(r[2]) + '</small>' : '') + '</button>'; }).join('') : '<b style="color:#fff;font-weight:500">还没有房间 · 在下方用 New Room 或 Smart Room 建一个</b>');
      roomsEl.hidden = false;
    }
    // Display and Item (5–6/6): the fixture's things, to open one — the 2D display view that lists them sits under the voxel world
    var itemsEl = document.createElement('div'); itemsEl.className = 'lv79-rooms lv79-items'; itemsEl.hidden = true; ov.appendChild(itemsEl);
    var itemsKey = '';
    itemsEl.addEventListener('click', function (e) { var b = e.target.closest('button[data-lv79item]'); if (!b) return; e.stopPropagation();
      var src = document.querySelectorAll('.mn-pv [data-pvi]')[+b.getAttribute('data-lv79item')]; if (src) { src.click(); itemsKey = ''; } });
    // Room (4/6): its display fixtures, to open one — the same as a double tap on it, without having to hit it
    var FIX79 = /wall|shelf|records|grid|frame|case|cabinet|board|gallery|rack|stand|pedestal|vitrine|display|easel|showcase|table/;
    function drawFixtures(lv) {
      if (lv !== 4) return false;
      var list = []; try { pieces().forEach(function (p) { var n = (p.it || []).length; if (n || FIX79.test(p.k)) list.push([p.id, p.label || p.k.replace(/^f_/, '').replace(/_/g, ' ').replace(/^./, function (c) { return c.toUpperCase(); }), n]); }); } catch (e) {}
      list.sort(function (a, b) { return b[2] - a[2]; });
      var key = 'fx;' + list.map(function (r) { return r.join('|'); }).join(';');
      if (key === itemsKey && !itemsEl.hidden) return true; itemsKey = key;
      itemsEl.innerHTML = '<b>🗄 展架</b>' + (list.length ? list.slice(0, 12).map(function (r) { return '<button type="button" data-lv79fix="' + esc79(r[0]) + '">' + esc79(r[1]) + '<small>' + (r[2] ? r[2] + ' 件展品' : '空') + '</small></button>'; }).join('') : '<b style="color:#fff;font-weight:500">这个房间还没有展架 · 在下方用 Smart Fill 放一些</b>');
      itemsEl.hidden = false; return true;
    }
    itemsEl.addEventListener('click', function (e) { var b = e.target.closest('button[data-lv79fix]'); if (!b) return; e.stopPropagation(); try { MinestDisplay.piece(b.getAttribute('data-lv79fix')); } catch (x) {} itemsKey = ''; });
    function drawItems(lv) {
      if (drawFixtures(lv)) return;
      if (lv < 5) { if (!itemsEl.hidden) { itemsEl.hidden = true; itemsKey = ''; } return; }
      var els = document.querySelectorAll('.mn-pv [data-pvi]'), list = [];
      Array.prototype.forEach.call(els, function (el, i) { var t = (el.textContent || '').replace(/\s+/g, ' ').trim(); if (t.length > 1 && t[0] === t[1]) t = t.slice(1); list.push([i, t || 'Item', el.classList.contains('on') || el.getAttribute('aria-current') === 'true']); });
      var key = lv + ';' + list.map(function (r) { return r.join('|'); }).join(';');
      if (key === itemsKey && !itemsEl.hidden) return; itemsKey = key;
      itemsEl.innerHTML = '<b>' + (lv >= 6 ? '📦 展品' : '📦 进入展品') + '</b>' + (list.length ? list.map(function (r) { return '<button type="button" data-lv79item="' + r[0] + '"' + (r[2] ? ' style="border-color:#f2c13d"' : '') + '>' + esc79(r[1]) + '</button>'; }).join('') : '<b style="color:#fff;font-weight:500">这个展架还是空的 · 在下方用 Smart Fill 或 ＋ Add 放东西</b>');
      itemsEl.hidden = false;
    }
    function houseOf79() {   // the building whose rooms the Dollhouse lists
      var el = document.querySelector('.mn-bv [data-bvroom]'), id = el && el.getAttribute('data-bvroom'), hit = null; if (!id) return null;
      try { (MinestDisplay.state().pc || []).forEach(function (p) { if ((p.rooms || []).some(function (r) { return r.id === id; })) hit = p; }); } catch (e) {} return hit;
    }
    function roomData79(id) {   // the room's own record (furniture count), from the building it belongs to
      try { var hit = null; (MinestDisplay.state().pc || []).forEach(function (p) { (p.rooms || []).forEach(function (r) { if (r.id === id) hit = r; }); }); return hit; } catch (e) { return null; }
    }
    /* Room and deeper (4–6/6): the camera finds what was built — the voxel grid keeps the island's size, so the room would
       otherwise sit small in the middle of an empty field */
    var fitKey = '', openSeq79 = 0, wasOpen79 = false, glideRaf = 0;
    function glide79(to) {   // 80: the camera moves there in ~0.6 s instead of jumping
      var o = R.orbit, from = { tx: o.tx, ty: o.ty, tz: o.tz, dist: o.dist }, t0 = performance.now(); cancelAnimationFrame(glideRaf);
      if (!isFinite(from.tx) || !isFinite(from.dist)) { Object.assign(o, to); return; }
      (function step(now) { var k = Math.min(1, (now - t0) / 600), e = k * k * (3 - 2 * k); for (var key in to) o[key] = from[key] + (to[key] - from[key]) * e; if (k < 1) glideRaf = requestAnimationFrame(step); })(t0);
    }
    function fitContent(lv) {
      var vw = R.vw; if (!vw) return;
      // 80: every level — 1–3 frame the whole world (up close at 3/6 the house is only its roof), 4 the room, 5–6 the fixture the 2D world opened
      var pvEl = lv >= 5 ? document.querySelector('.mn-pv[data-pv-pc]') : null, fx = pvEl ? pieceById(pvEl.getAttribute('data-pv-pc')) : null;
      var key = lv + '|' + (fx ? fx.id : '') + '|' + R.scope + '|' + openSeq79 + '|' + vw.W + 'x' + vw.D; if (key === fitKey) return; fitKey = key;   // once per scene: edits keep your view
      var cx = fx ? Math.floor((fx.x - vw.ox) * vw.S) : -1, cz = fx ? Math.floor((fx.y - vw.oz) * vw.S) : -1, rad = fx ? Math.max(3, Math.round((lv === 3 ? 3.2 : 1.6) * vw.S * (fx.s || 1))) : 1e9;
      var x0 = 1e9, y0 = 1e9, z0 = 1e9, x1 = -1e9, y1 = -1e9, z1 = -1e9, n = 0;
      for (var y = 0; y < vw.H; y++) for (var z = 0; z < vw.D; z++) for (var x = 0; x < vw.W; x++) if ((!fx || (Math.abs(x - cx) <= rad && Math.abs(z - cz) <= rad && y > 0)) && vw.get(x, y, z)) { n++; if (x < x0) x0 = x; if (x > x1) x1 = x; if (y < y0) y0 = y; if (y > y1) y1 = y; if (z < z0) z0 = z; if (z > z1) z1 = z; }
      if (!n) return;
      var o = R.orbit, ext = Math.max(x1 - x0, z1 - z0, (y1 - y0) * 1.4) + 1;
      var asp = (ov.clientWidth || 1) / (ov.clientHeight || 1), wide = asp < 1 ? Math.min(1.9, 0.92 / asp) : 1;   // a tall screen sees less across: step back
      o.auto = false; glide79({ tx: (x0 + x1 + 1) / 2, tz: (z0 + z1 + 1) / 2, ty: y0 + (y1 - y0) * (fx ? 0.55 : 0.35), dist: Math.max(fx ? 5 : 8, wide * ext * (fx ? (lv >= 6 ? 0.9 : 1.3) : lv <= 3 ? 1.15 : 1.25)) });
      if (o.el == null || o.el < 0.45) o.el = 0.62;
    }
    function esc79(t) { return String(t).replace(/[&<>"]/g, function (c) { return { '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;' }[c]; }); }
    function fit79() { ov.style.setProperty('--ch', Math.round(con.getBoundingClientRect().height || 60) + 'px'); }
    function sync79() {
      if (!isOpen()) { wasOpen79 = false; return; }
      if (!wasOpen79) { wasOpen79 = true; openSeq79++; }
      // the level tools are My World's console: it is always beside / below the voxel world
      if (!R.con) { try { setCon(true); } catch (e) {} }
      var sheet = center.querySelector('.sheet'), has = R.tab && R.tab !== 'look' && R.tab !== 'room' && R.tab !== 'smart' && sheet && sheet.textContent.trim();
      if (center.hidden === !!has) { center.hidden = !has; fit79(); }
      if (R.tab === 'room' || R.tab === 'smart') { try { setTab('look'); } catch (e) {} }
      var wf = WF(), lv = 0; try { lv = wf && wf.level ? wf.level() : 0; } catch (e) {}
      drawRooms(lv); drawItems(lv); try { fitContent(lv); } catch (e) {}
      if (lv !== lastLv) { if (lastLv > 0 && R.moveId) { R.moveId = null; try { setTab('look'); } catch (e) {} }   // a pending move does not follow you to another level
        lastLv = lv; var cr = []; try { cr = wf.crumbs() || []; } catch (e) {}
        hint.textContent = (LV[lv] || '🧊 Voxel world') + (cr.length ? ' · ' + cr[cr.length - 1] : '') + (document.documentElement.classList.contains('vx80-min') ? '  —  ⌃ Expand console: New · Gallery · Group · Smart' : '  —  Console below: New · Gallery · Group · Smart');
        hint.hidden = false; hint.style.opacity = '1'; clearTimeout(hintT); hintT = setTimeout(function () { hint.style.opacity = '0'; }, 4200); }
    }
    // a double-tap in the 3D view is My World's own double-tap at that spot: one level deeper (onto the island, into the
    // building, into the room, to the display, to the item) — the 2D world decides, the blocks follow
    var dt = null, lastTap = null;
    ov.addEventListener('pointerdown', function (e) { if (!e.target || e.target.tagName !== 'CANVAS' || e.isPrimary === false) { dt = null; return; } dt = { x: e.clientX, y: e.clientY, t: Date.now() }; }, true);
    ov.addEventListener('pointerup', function (e) {
      var d = dt; dt = null; if (!d || !isOpen() || (R.tab && R.tab !== 'look')) { lastTap = null; return; }
      if (Math.abs(e.clientX - d.x) + Math.abs(e.clientY - d.y) > 12 || Date.now() - d.t > 500) { lastTap = null; return; }
      var now = Date.now(), L = lastTap;
      if (!(L && now - L.at <= 450 && Math.abs(e.clientX - L.x) + Math.abs(e.clientY - L.y) <= 34)) { lastTap = { x: e.clientX, y: e.clientY, at: now }; return; }
      lastTap = null; dive(e.clientX, e.clientY);
    }, true);
    function dive(cx, cy) {
      var lv = lvl(), hit = null; try { hit = pickAt(cx, cy); } catch (x) {}
      if (lv === 3) { var one = roomsEl.querySelectorAll('button[data-lv79room]'); if (one.length === 1) return roomAct('room:' + one[0].getAttribute('data-lv79room')); return toast('🏠 在上方选一个房间进入'); }
      if (lv >= 5) { var its = itemsEl.querySelectorAll('button[data-lv79item]'); if (its.length === 1) return its[0].click(); return toast('📦 在上方选一件展品'); }
      if (!hit || !R.vw) return;
      var vw = R.vw, lx = vw.ox + (hit.x + .5) / vw.S, ly = vw.oz + (hit.z + .5) / vw.S, best = null, bd = 1e9;
      try { pieces().forEach(function (q) { var dd = Math.hypot(q.x - lx, q.y - ly); if (dd < 2.6 * (q.s || 1) && dd < bd) { bd = dd; best = q; } }); } catch (x) {}
      if (best) { lx = best.x; ly = best.y; }
      try { tapIsland(lx, ly); } catch (x) {}
      setTimeout(function () { try { tapIsland(lx, ly); } catch (x) {} }, 90);
      setTimeout(function () { var after = lvl(); if (after !== lv) { try { poke(); } catch (x) {} } else if (!best) toast('双击建筑、展架或物件，进入下一层'); }, 700);
    }
    window.__vx79 = { dive: dive };
    setInterval(sync79, 350);
    window.addEventListener('resize', fit79);
    sync79(); fit79();
  })();

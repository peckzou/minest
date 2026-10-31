  /* ── 53.86–53.87 · Fold flow: My World on the iPhone Fold held upright and half folded like a laptop (html.duo-tall.duo-halfopen,
     hinge at 50vh). The top half is the scene, the bottom half a console for the level you are on. Six levels, one chain:
       1 Island           the island as a whole                🏝 Island tools (建岛)                     ✨ Smart Island
       2 Building         on the island, closer: its buildings 🏘 Building tools                          ✨ Smart Build
       3 Dollhouse        a building cut away, its rooms       🚪 Room tools (建房)                       ✨ Smart Room
       4 Room             V.at = { pc, room }                  🛋 Room tools (this room) · 🗄 Display tools (陈列)   ✨ Smart Room / Smart Display
       5 Display Fixture  the piece view (pv) of a display     🗄 Display tools for this fixture (摆放)    ✨ Smart Display
       6 Item             one thing on it (pv.at ≥ 0)          ✏️ details · 🖼 picture · 📍 where          ✨ Smart Edit
     A double-tap on the target in the scene goes one level deeper (its own detector, mouse and touch: 450 ms, a little
     movement allowed, a first tap that selects still counts); ‹ Back (top left of the scene), the console's crumbs, a
     two-finger pinch in or Esc go back up.
     Levels 1–4 share one tool structure: Smart · Suggest · Lock · Confirm · Edit, then the level's menu — New · Gallery ·
     Group · Smart <level> · More tools. Suggest is a carousel of proposals (Base / Detail, ‹ 2/5 ›) shown live in the scene;
     Smart makes a base when there is none and details when there is; Smart Fill walks Island → Building → Room → Display
     Fixture → Item. Nothing is saved until ✓ Confirm (one ↶ Undo step); ✕ puts it back. Locked parts (per level, kept in
     the synced layout as wfLock) survive Suggest and Smart. A Style Direction biases both.
     Data (nothing else new is stored): the island = the board's layout (side data dsp:<board>), buildings = building pieces
     on it, rooms = a building's rooms[], displays = pieces holding refs ('list id/card id'), items = the cards those refs
     name. Layout edits go through change() / save(); card edits through MinestAI.updateBoard.
     Anywhere else (opened flat, sideways, a Mac) the same console is a side panel (wide) or a bottom sheet, from 🎛 Levels. */
  var WFAPI = null;
  (function () {
    var R = document.documentElement, W = { tab: {}, grp: {}, fs: null, S: null, key: '', q: false, mode: '', fill: 0, panel: {}, set4: 'roomd', DT: null, near: false, lt: null };
    try { W.style = localStorage.getItem('minest.wf.style') || 'surprise'; } catch (e) { W.style = 'surprise'; }
    var LVN = [null, 'Island', 'Building', 'Dollhouse', 'Room', 'Display Fixture', 'Item'];
    function prefOn() { try { return localStorage.getItem('minest.wf.on') === '1'; } catch (e) { return false; } }
    function setPref(v) { try { localStorage.setItem('minest.wf.on', v ? '1' : '0'); } catch (e) {} }
    function folded() { return R.classList.contains('duo-tall') && R.classList.contains('duo-halfopen'); }
    function canToggle() { return R.classList.contains('duo') || (innerWidth >= 900 && !!window.matchMedia && matchMedia('(pointer: fine)').matches); }
    function live() { return !!(el && V && !V.visit && V.bid !== 'tile:home'); }
    function mode() {
      if (!live()) return '';
      if (folded()) return 'fold';
      if (!prefOn() || !canToggle()) return '';
      return innerWidth >= 820 && innerWidth > innerHeight ? 'side' : 'sheet';
    }
    function level() { if (!V) return 0; if (pv) return pv.at >= 0 ? 6 : 5; if (V.at && V.at.room) return 4; if (V.at) return 3; return W.near ? 2 : 1; }
    function pvPiece() { return pv ? pieceOf(pv.pc) : null; }
    function pvRef() { return pv && pv.at >= 0 ? pv.refs[pv.at] : null; }
    function nm(p) { return p ? (p.label || (K[p.k] && K[p.k].n) || 'Piece') : ''; }
    function isDisp(p) { return !!(p && K[p.k] && !K[p.k].decor && !isBld(p) && capOf(p) > 0); }
    function ico(c) { return '<i aria-hidden="true">' + c + '</i>'; }

    // ---------------------------------------------------------------- where you are, and the way back up
    function crumbs() {
      var lv = level(), b = board(V.bid), out = [[1, '🏝', String((b && b.title) || 'Island').replace(/^my\s+/i, '')]];
      if (lv >= 2) out.push([2, '🏘', 'Buildings']);
      var bp = bldOf(); if (lv >= 3 && bp) out.push([3, '🏠', bldName(bp)]);
      var r = roomOf(); if (lv >= 4 && r) out.push([4, (ROOMS[r.k] || ROOMS.hall)[1], r.n || (ROOMS[r.k] || ROOMS.hall)[0]]);
      var p = pvPiece(); if (lv >= 5 && p) out.push([5, '🗄', nm(p)]);
      if (lv >= 6) { var t = thing(pvRef()); out.push([6, '📄', t ? t.s.title : 'Item']); }
      return out;
    }
    function up() {
      var lv = level(); if (W.fs) fsEnd(false); if (W.S) sCancel(true);
      if (lv === 6) pvDetail(-1);
      else if (lv === 5) closePiece();
      else if (lv === 4) leaveRoom();   // → its building's dollhouse
      else if (lv === 3) { leaveRoom(); W.near = true; }   // → the buildings
      else if (lv === 2) { W.near = false; V.sel = null; render(); fit(); }
      else return false;
      hap('light'); draw(); return true;
    }
    function goTo(n) { var g = 8; while (level() > n && g-- && up()); }

    // ---------------------------------------------------------------- the levels' tools (the "More tools" tabs keep the 53.86 tools)
    var HINT = [null, 'Double-tap the island to step onto it', 'Double-tap a building to see inside · ‹ Back for the whole island',
      'Double-tap a room to go in · ‹ Back for the buildings', 'Double-tap a display to open it · ‹ Back for the dollhouse',
      'Tap a thing for its details · ‹ Back for the room', '‹ › for the next thing · ‹ Back for the display'];
    function tabsFor(lv) {
      if (lv === 1) return [['land', '⛰', 'Land'], ['nature', '🌳', 'Nature'], ['life', '🐾', 'Life'], ['sets', '🎁', 'Sets'], ['ctl', '🎛', 'Controls']];
      if (lv === 2) return [['here', '🏘', 'Here'], ['bld', '🏠', 'Buildings'], ['lm', '🗽', 'Landmarks'], ['ctl', '🎛', 'Controls'], ['lay', '🔀', 'Layout']];
      if (lv === 3) return [['rooms', '🚪', 'Rooms'], ['add', '＋', 'Add room'], ['house', '🏡', 'House']];
      if (lv === 4) return [['here', '🗄', 'Here'], ['disp', '🖼', 'Displays'], ['furn', '🛋', 'Furniture'], ['ctl', '🎛', 'Controls'], ['look', '🎨', 'Look']];
      if (lv === 5) return [['bag', '🎒', 'Bag'], ['on', '📋', 'On it'], ['kind', '🎨', 'Display']];
      return [['det', '✏️', 'Details'], ['pic', '🖼', 'Picture'], ['where', '📍', 'Where']].concat(VOCAB && VOCAB.isVocab(pvPiece()) ? [['form', '🔤', 'Form']] : []);
    }
    function bodyFor(lv, tab) { return body(lv, tab); }
    function libGroups(id) {
      var by = {}; pkTabs().forEach(function (t) { by[t.id] = t.groups || []; });
      if (id === 'nature') return (by.decor || []).concat(by.land || []);
      if (id === 'life') return by.life || [];
      if (id === 'bld') return by.bld || [];
      if (id === 'lm') return (by.lm || []).concat(by.go || []);
      if (id === 'disp') return (by.furn || []).filter(function (g) { return g.n !== 'Home furniture'; });
      if (id === 'furn') return (by.furn || []).filter(function (g) { return g.n === 'Home furniture'; }).concat(by.decor || [], by.life || []);
      return [];
    }
    function libHtml(id) {
      var G = libGroups(id); if (!G.length) return '<p class="duo-lib-m">' + (window.MinestAssets3D ? 'Nothing to place here.' : 'Bringing the library…') + '</p>';
      var gi = Math.min(W.grp[id] || 0, G.length - 1), count = {}; (V.d.pc || []).forEach(function (q) { count[q.k] = (count[q.k] || 0) + 1; });
      return '<div class="duo-lib-chips" data-lib="' + id + '">' + G.map(function (g, i) { return '<button type="button" data-wfgrp="' + i + '"' + (i === gi ? ' class="on"' : '') + '>' + esc(g.n) + '</button>'; }).join('') + '</div>' +
        '<div class="duo-lib-grid">' + G[gi].kinds.map(function (k) { return pkCard(k, count[k] || 0); }).join('') + '</div>';
    }
    function libFill() {   // Studio pictures arrive one by one
      clearTimeout(W.fill); var c = document.querySelector('.wf'); if (!c) return; var left = 0;
      c.querySelectorAll('.mn-pk-card').forEach(function (x) { var pic = x.querySelector('.pic'); if (!pic || !pic.querySelector('.mn-a3wait')) return; var kk = x.getAttribute('data-pkkind'); if (!/^bld:/.test(kk || '')) return; var h = bldIcon(kk, 132); if (h.indexOf('mn-a3wait') < 0) pic.innerHTML = h; else left++; });
      c.querySelectorAll('.mn-a3wait[data-a3]').forEach(function (x) { var u = a3Url(x.getAttribute('data-a3'), 0); if (u) x.outerHTML = '<img class="ic" alt="" src="' + esc(u) + '" width="' + (parseInt(x.style.width, 10) || 112) + '" height="' + (parseInt(x.style.width, 10) || 112) + '" style="object-fit:contain">'; else left++; });
      if (left) W.fill = setTimeout(libFill, 700);
    }
    function ctlHtml() {
      var p = DUO_API ? DUO_API.selPiece() : null, h = DUO_API ? DUO_API.ctlHtml() : '<p class="duo-lib-m">Tap a piece in the scene.</p>';
      if (p && isBld(p)) h = '<div class="wf-row"><button type="button" class="wf-go" data-wfbld="' + esc(p.id) + '">🚪 Open ' + esc(nm(p)) + ' ›</button></div>' + h;
      else if (p && isDisp(p)) h = '<div class="wf-row"><button type="button" class="wf-go" data-wfopen="' + esc(p.id) + '">🗄 Open ' + esc(nm(p)) + ' ›</button></div>' + h;
      return h;
    }
    function opt(L, cur) { return L.map(function (x) { return '<option value="' + esc(x[0]) + '"' + (x[0] === cur ? ' selected' : '') + '>' + esc(x[1]) + '</option>'; }).join(''); }
    function cnt(p) { return (p.it || []).filter(thing).length; }
    function body(lv, tab) {
      if (tab === 'ctl') return ctlHtml();
      if (/^(nature|life|bld|lm|disp|furn)$/.test(tab)) return libHtml(tab);
      if (lv === 1 && tab === 'land') {
        var lb = lbox();
        return '<p class="duo-lib-m">' + landOf().length + ' plots · ' + (lb.x1 - lb.x0) + ' × ' + (lb.y1 - lb.y0) + ' blocks</p>' +
          '<div class="wf-row"><button type="button" data-wfland="edit"' + (V.expand ? ' class="on"' : '') + '>' + (V.expand ? '✓ Done shaping' : '⛰ Shape the land (＋ / −)') + '</button><button type="button" data-wfland="ring">＋ A ring all round</button><button type="button" data-wfland="double">× 2 land</button></div>' +
          '<h4>Ground</h4><div class="wf-row">' + RO_GROUND.map(function (g) { return '<button type="button" data-wfground="' + g[0] + '"' + ((V.d.ground || 'grass') === g[0] ? ' class="on"' : '') + '>' + g[1] + '</button>'; }).join('') + '</div>';
      }
      if (lv === 1 && tab === 'sets') return '<div class="wf-list">' +
        '<button type="button" data-wfdo="kits"><b>🎁 Add a set</b><small>a house and its yard, land, a school…</small></button>' +
        '<button type="button" data-wfdo="city"><b>🏙 Build a town</b><small>roads, blocks and districts</small></button>' +
        '<button type="button" data-wfdo="sample"><b>🏠 House Sample</b><small>a home with four furnished rooms</small></button>' +
        '<button type="button" data-wfdo="reorg"><b>🔀 Reorganize</b><small>another layout or look for the island</small></button></div>';
      if (lv === 2 && tab === 'here') {
        var B = (V.d.pc || []).filter(isBld), D = (V.d.pc || []).filter(isDisp), sel = V.sel && V.sel.pc;
        return (B.length ? '<h4>Buildings · double-tap one in the scene, or ›</h4><div class="wf-list">' + B.map(function (p) { var n = (p.rooms || []).length;
            return '<div class="wf-item' + (p.id === sel ? ' on' : '') + '"><button type="button" data-wfsel="' + esc(p.id) + '"><b>🏠 ' + esc(nm(p)) + '</b><small>' + (n ? n + ' room' + (n === 1 ? '' : 's') : 'no rooms yet') + '</small></button><button type="button" class="wf-go" data-wfbld="' + esc(p.id) + '" aria-label="Open ' + esc(nm(p)) + '">›</button></div>'; }).join('') + '</div>'
          : '<p class="duo-lib-m">No buildings yet — pick one from 🏠, or ✨ Smart Build.</p>') +
          (D.length ? '<h4>Out in the open</h4><div class="wf-list">' + D.map(function (p) { return '<div class="wf-item' + (p.id === sel ? ' on' : '') + '"><button type="button" data-wfsel="' + esc(p.id) + '"><b>🗄 ' + esc(nm(p)) + '</b><small>' + cnt(p) + ' thing' + (cnt(p) === 1 ? '' : 's') + '</small></button><button type="button" class="wf-go" data-wfopen="' + esc(p.id) + '" aria-label="Open">›</button></div>'; }).join('') + '</div>' : '');
      }
      if (lv === 2 && tab === 'lay') return '<div class="wf-list"><button type="button" data-wfdo="reorg"><b>🔀 Reorganize the buildings</b><small>a row, a ring, together or spread out — see it, then keep it</small></button>' +
        '<button type="button" data-wfdo="arrange"><b>✦ Arrange for me</b><small>your things into the buildings that suit them</small></button>' +
        '<button type="button" data-wfdo="city"><b>🏙 Build a town</b><small>roads, blocks and districts</small></button></div>';
      if (lv === 3) return bldBody(tab);
      if (lv === 4 && tab === 'here') {
        var DS = (V.d.pc || []).filter(isDisp), s4 = V.sel && V.sel.pc, box = boxRefs().length;
        return (DS.length ? '<h4>Displays · double-tap one in the scene, or ›</h4><div class="wf-list">' + DS.map(function (p) { var c = cnt(p), cap = capOf(p);
            return '<div class="wf-item' + (p.id === s4 ? ' on' : '') + '"><button type="button" data-wfsel="' + esc(p.id) + '"><b>🗄 ' + esc(nm(p)) + '</b><small>' + c + ' / ' + cap + ' things' + (K[p.k].use ? ' · ' + esc(K[p.k].use) : '') + '</small></button><button type="button" class="wf-go" data-wfopen="' + esc(p.id) + '" aria-label="Open">›</button></div>'; }).join('') + '</div>'
          : '<p class="duo-lib-m">No displays in this room yet — pick one from 🖼, or ✨ Smart Arrange.</p>') + '<p class="duo-lib-m">🎒 ' + box + ' thing' + (box === 1 ? '' : 's') + ' still in the bag.</p>';
      }
      if (lv === 4 && tab === 'look') { var rd = V.d;
        return '<h4>Floor & walls</h4><div class="wf-row">' + RO_FINISH.map(function (f, i) { return '<button type="button" data-wffinish="' + i + '"' + (rd.floor === f[0] && rd.wall === f[1] ? ' class="on"' : '') + '>' + f[2] + '</button>'; }).join('') + '</div>' +
          '<h4>Space</h4><div class="wf-row"><button type="button" data-wfland="ring">⛰ ＋ More space</button><span class="lb">' + landOf().length + ' plots</span></div>' +
          '<div class="wf-list"><button type="button" data-wfdo="reorg"><b>🔀 Reorganize the displays</b><small>along the walls, in rows, in the middle, facing rows</small></button><button type="button" data-wfdo="furnish"><b>✦ Furnish this room</b><small>the furniture a room like this has</small></button></div>';
      }
      if (lv === 5) return dispBody(tab);
      if (lv === 6) return itemBody(tab);
      return '';
    }
    // 3 · a building: its rooms (the dollhouse's own room bar, here), rooms to add, the house
    function bldBody(tab) {
      var p = bldOf(); if (!p || !BV) return '';
      var R0 = p.rooms || [], sel = R0.filter(function (r) { return r.id === BV.sel; })[0], fl = p.floors || 1, vf = p.viewFl || 1;
      var floors = '<div class="wf-row"><span class="lb">Floors</span>' + [1, 2, 3].slice(0, fl).map(function (f) { return '<button type="button" data-wffl="' + f + '"' + (f === vf ? ' class="on"' : '') + '>' + f + 'F</button>'; }).join('') +
        (fl < 3 ? '<button type="button" data-wffloor="add">＋ Floor</button>' : '') + (fl > 1 ? '<button type="button" data-wffloor="rm">− Floor</button>' : '') + '</div>';
      if (tab === 'add') {
        var sug = suggestRooms(p), have = R0.map(function (r) { return r.k; });
        var chip = function (k) { var T = ROOMS[k]; return T ? '<button type="button" data-wfroom="' + k + '"' + (have.indexOf(k) >= 0 ? ' class="has"' : '') + '>' + T[1] + ' ' + esc(T[0]) + '</button>' : ''; };
        return floors + '<h4>Suggested for ' + esc(bldName(p)) + ' · goes on ' + vf + 'F</h4><div class="wf-chips">' + sug.map(chip).join('') + '</div>' +
          '<h4>More rooms</h4><div class="wf-chips">' + ROOM_ORDER.filter(function (k) { return sug.indexOf(k) < 0; }).map(chip).join('') + '</div>' +
          (bvFloors.showrooms ? '<h4>Showrooms</h4><div class="wf-chips">' + bvFloors.showrooms().map(function (s) { return '<button type="button" data-wfroom="' + esc(s.k) + '" title="' + esc(s.tip || '') + '">' + s.ic + ' ' + esc(s.n) + '</button>'; }).join('') + '</div>' : '');
      }
      if (tab === 'house') {
        var m = window.MinestFloorPlan && MinestFloorPlan.mode ? MinestFloorPlan.mode() : 'doll';
        return '<h4>Show it as</h4><div class="wf-row">' + [['doll', '🏠 Dollhouse'], ['plan', '▦ Floor plan'], ['cut', '◩ Cutaway'], ['cards', '▤ Cards']].map(function (o) { return '<button type="button" data-wfmode="' + o[0] + '"' + (m === o[0] ? ' class="on"' : '') + '>' + o[1] + '</button>'; }).join('') + '</div>' +
          '<div class="wf-list"><button type="button" data-wfdo="bsuggest"><b>✦ Suggest its rooms</b><small>the rooms a ' + esc(bldName(p).toLowerCase()) + ' has</small></button>' +
          '<button type="button" data-wfdo="bfill"><b>✦ Fill it with my things</b><small>rooms and displays for what you keep</small></button>' +
          (R0.length > 1 ? '<button type="button" data-wfdo="reorg"><b>🔀 Room order</b><small>visiting order, by kind, two floors</small></button>' : '') + '</div>' +
          (bvFloors.homes ? '<h4>Home template</h4><div class="wf-chips">' + bvFloors.homes().map(function (h) { return '<button type="button" data-wfhome="' + esc(h.id) + '">' + h.ic + ' ' + esc(h.n) + '</button>'; }).join('') + '</div>' : '') +
          (bvFloors.outsides ? '<h4>Outside</h4><div class="wf-row"><select data-wfout aria-label="Its outside">' + bvFloors.outsides().map(function (o) { return '<option value="' + esc(o.k) + '"' + (o.on ? ' selected' : '') + '>' + esc(o.n) + '</option>'; }).join('') + '</select></div>' : '');
      }
      return floors + (R0.length ? '<div class="wf-rooms">' + R0.map(function (r) { var T = ROOMS[r.k] || ROOMS.hall, n = 0; (r.d && r.d.pc || []).forEach(function (q) { n += (q.it || []).filter(thing).length; });
          return '<button type="button" data-wfrsel="' + esc(r.id) + '"' + (r.id === BV.sel ? ' class="on"' : '') + '><i>' + T[1] + '</i><b>' + esc(r.n || T[0]) + '</b><small>' + (r.fl || 1) + 'F · ' + n + ' thing' + (n === 1 ? '' : 's') + '</small></button>'; }).join('') + '</div>'
        : '<p class="duo-lib-m">No rooms yet — ＋ Add room, or ✨ Smart Build Rooms.</p>') +
        (sel ? '<div class="wf-bv mn-bv-bar">' + bvBar(sel) + '</div>' : (R0.length ? '<p class="duo-lib-m">Tap a room (here or in the dollhouse) to change it · double-tap to go in.</p>' : ''));
    }
    // 5 · a display: the bag, what is on it, what kind it is
    function boxRefs() { index(); var on = placed(); return Object.keys(IX).filter(function (r) { return !on[r] && !/^v\//.test(r); }); }
    function dispBody(tab) {
      var p = pvPiece(); if (!p) return '';
      var have = (p.it || []).filter(thing), cap = capOf(p);
      var head = '<p class="duo-lib-m">' + esc(nm(p)) + ' · ' + have.length + ' / ' + cap + ' places' + (K[p.k].use ? ' · for ' + esc(K[p.k].use.toLowerCase()) : '') + '</p>';
      if (tab === 'on') return head + (have.length ? '<div class="wf-list">' + have.map(function (r, i) { var t = thing(r);
          return '<div class="wf-item"><button type="button" data-wfdet="' + esc(r) + '"><b>' + (i + 1) + ' · ' + esc(t.s.title) + '</b><small>' + esc(t.k.title || '') + '</small></button><button type="button" data-wfmv="-1" data-wfref="' + esc(r) + '"' + (i ? '' : ' disabled') + ' aria-label="Earlier">◀</button><button type="button" data-wfmv="1" data-wfref="' + esc(r) + '"' + (i < have.length - 1 ? '' : ' disabled') + ' aria-label="Later">▶</button><button type="button" class="rm" data-wfoff="' + esc(r) + '" aria-label="Back to the bag">✕</button></div>'; }).join('') + '</div>'
        : '<p class="duo-lib-m">Nothing on it yet — 🎒 Bag, or ✨ Smart Place.</p>');
      if (tab === 'kind') {
        var st = []; try { st = roStyles({ lv: 'fixture', p: p }); } catch (e) {}
        return head + '<h4>Name</h4><div class="wf-row"><input type="text" data-wflabel value="' + esc(p.label || '') + '" placeholder="' + esc(K[p.k].n) + '" aria-label="Display name"></div>' +
          '<h4>Size</h4><div class="wf-row"><button type="button" data-wfsz="-1">− Smaller</button><span class="lb">' + Math.round((p.s || 1) * 100) + '%</span><button type="button" data-wfsz="1">＋ Bigger</button></div>' +
          (st.length ? '<h4>Another kind of display · its things stay</h4><div class="wf-list">' + st.map(function (s, i) { return '<button type="button" data-wfkind="' + i + '"><b>' + esc(s.n) + '</b><small>' + esc(s.d || '') + '</small></button>'; }).join('') + '</div>' : '');
      }
      var free = boxRefs(), by = {}, order = [];
      free.forEach(function (r) { var t = thing(r), L = t.k.title || 'List'; if (!by[L]) { by[L] = []; order.push(L); } by[L].push(r); });
      var home = mainList(p) || (lists(board(V.bid))[0] || { k: {} }).k.id;
      return head + '<div class="wf-row wf-new"><input type="text" data-wfnt placeholder="A new thing — its name" aria-label="New thing" enterkeyhint="done"><select data-wfnl aria-label="In list">' + listOpts(home) + '</select><button type="button" data-wfnew>＋ Add</button></div>' +
        (free.length ? order.map(function (L) { return '<h4>' + esc(L) + ' · ' + by[L].length + '</h4><div class="wf-bag">' + by[L].map(function (r) { var t = thing(r), u = picOf(t.s);
            return '<button type="button" data-wfput="' + esc(r) + '" title="Put it on ' + esc(nm(p)) + '">' + (u ? '<img alt="" loading="lazy" src="' + esc(S(u)) + '">' : '<i style="--h:' + (hash(t.s.title) % 360) + '">' + esc(String(t.s.title).charAt(0).toUpperCase()) + '</i>') + '<span>' + esc(t.s.title) + '</span></button>'; }).join('') + '</div>'; }).join('')
          : '<p class="duo-lib-m">The bag is empty — everything is out on the island. Add a new thing above.</p>');
    }
    // 6 · one thing
    function itemBody(tab) {
      var ref = pvRef(), t = thing(ref); if (!t) return ''; var s = t.s, u = picOf(s), i = pv.at;
      if (tab === 'form') return formChips(pvPiece(), ref) + '<p class="duo-lib-m">Only how it stands on this display — the card stays as it is.</p>';
      if (tab === 'pic') return '<div class="wf-pic">' + (u ? '<img alt="" src="' + esc(S(u)) + '">' : '<span class="mn-letter" style="--h:' + (hash(s.title) % 360) + '">' + esc(String(s.title).charAt(0).toUpperCase()) + '</span>') + '</div>' +
        '<div class="wf-row"><button type="button" data-wfpic="photo">🔎 Find a photo</button><button type="button" data-wfpic="icon">🙂 An icon</button>' + (u ? '<button type="button" class="rm" data-wfpic="none">✕ No picture</button>' : '') + '</div>' +
        '<div class="wf-row"><input type="url" data-wfurl placeholder="…or paste a picture link" aria-label="Picture link"><button type="button" data-wfpic="url">Use</button></div>';
      if (tab === 'where') { var p = pvPiece(), r = roomOf(), b = bldOf();
        return '<p class="duo-lib-m">' + esc(t.k.title || '') + ' → ' + esc([b && bldName(b), r && (r.n || ROOMS[r.k][0]), nm(p)].filter(Boolean).join(' · ')) + '</p>' +
          '<div class="wf-row"><button type="button" data-wfnav="-1"' + (i ? '' : ' disabled') + '>‹ Previous</button><span class="lb">' + (i + 1) + ' / ' + pv.refs.length + '</span><button type="button" data-wfnav="1"' + (i < pv.refs.length - 1 ? '' : ' disabled') + '>Next ›</button></div>' +
          '<div class="wf-list"><button type="button" data-wfpv="data-pvoff"><b>⤓ Take it off this display</b><small>back into the bag</small></button><button type="button" data-wfpv="data-pvedit"><b>✎ The full editor</b><small>everything on the card</small></button><button type="button" data-wfpv="data-pvlist"><b>☰ Show in its list</b><small>leaves My World</small></button></div>';
      }
      return '<label class="wf-f"><span>Name</span><input type="text" data-wft value="' + esc(s.title || '') + '" aria-label="Name"></label>' +
        '<label class="wf-f"><span>Note</span><textarea data-wfn rows="4" aria-label="Note" placeholder="A note about it">' + esc(s.desc || '') + '</textarea></label>' +
        '<label class="wf-chk"><input type="checkbox" data-wfdone' + (s.complete ? ' checked' : '') + '> Done</label>';
    }


    // ---------------------------------------------------------------- the console
    function stateKey() {
      if (!V) return ''; var p = pvPiece(), b = bldOf(), S = W.S;
      return [W.mode, level(), V.bid, V.at ? V.at.pc + '/' + (V.at.room || '') : '', V.sel ? (V.sel.pc || '') + '|' + (V.sel.ref || '') : '', BV ? BV.sel + ':' + ((b && b.rooms) || []).length + ':' + ((b && b.floors) || 1) + ':' + ((b && b.viewFl) || 1) : '',
        pv ? pv.pc + ':' + pv.at + ':' + (p ? (p.it || []).join(',') + ':' + p.k + ':' + p.s : '') : '', SB ? 'sb' : '', RO ? 'ro' : '', (V.d.pc || []).length, landOf().length, V.d.ground || '', V.d.floor || '', V.expand ? 'x' : '',
        W.fs ? 'fs' + W.fs.i + (W.fs.busy ? 'b' : '') : '', S ? 'S' + S.i + S.tab + S.asp : '', JSON.stringify(W.panel), W.set4, W.style].join('~');
    }
    function soon() { if (W.q) return; W.q = true; requestAnimationFrame(function () { W.q = false; sync(); }); }
    function layout(m) {
      if (m === W.mode) return; W.mode = m;
      ['wf-on', 'wf-fold', 'wf-side', 'wf-sheet'].forEach(function (c) { R.classList.toggle(c, c === 'wf-on' ? !!m : c === 'wf-' + m); });
      if (m && DUO_API && DUO_API.LIB.on) DUO_API.libClose();   // one console at a time
      if (m) { var pk = el && el.querySelector('.mn-pick'); if (pk) pk.remove(); }
      requestAnimationFrame(function () { try { window.dispatchEvent(new Event('resize')); } catch (e) {} if (el && V && !pv && !V.at) fit(); });
    }
    function remove() { var c = document.querySelector('.wf'); if (c) c.remove(); W.key = ''; if (W.fs) fsEnd(false); if (W.S) sCancel(true); backBtn(); okChip(); }
    function sync() {
      var m = mode(); layout(m); tog(); backBtn(); okChip(); floorGuide();
      if (!m) return remove();
      var c = document.querySelector('.wf'), a = document.activeElement;
      if (c && a && c.contains(a) && /^(INPUT|TEXTAREA|SELECT)$/.test(a.tagName) && a.type !== 'checkbox' && a.type !== 'range') return;   // typing: the next change redraws
      var k = stateKey(); if (c && k === W.key) return; draw();
    }
    function setKey() { var lv = level(); return lv === 4 ? W.set4 : TSET[lv]; }
    var TSET = { 1: 'island', 2: 'bld', 3: 'room', 5: 'fixture' };
    function draw() {
      var m = mode(); if (!m) return remove(); W.key = stateKey();
      var c = document.querySelector('.wf');
      if (!c) {
        c = document.createElement('aside'); c.className = 'wf'; c.setAttribute('aria-label', 'My World levels'); document.body.appendChild(c);
        c.addEventListener('click', click); c.addEventListener('change', onChange);
        c.addEventListener('keydown', function (e) { if (e.key === 'Enter' && e.target.matches('[data-wfnt]')) { e.preventDefault(); var b = c.querySelector('[data-wfnew]'); if (b) b.click(); } });
      }
      var lv = level(), cr = crumbs();
      var head = '<header class="wf-h"><button type="button" class="wf-up" data-wfup' + (lv > 1 ? '' : ' disabled') + ' aria-label="Back up a level">‹</button>' +
        '<nav class="wf-crumbs" aria-label="Where you are">' + cr.map(function (x, i) { return (i ? '<span class="sep">›</span>' : '') + '<button type="button" data-wfgo="' + x[0] + '"' + (x[0] === lv ? ' class="on" aria-current="page"' : '') + '>' + x[1] + ' ' + esc(x[2]) + '</button>'; }).join('') + '</nav>' +
        '<span class="wf-lv" title="Level ' + lv + ' of 6">' + lv + '/6 · ' + LVN[lv] + '</span>' + (m === 'fold' ? '' : '<button type="button" class="wf-x" data-wfx aria-label="Close the levels console">✕</button>') + '</header>';
      c.setAttribute('data-lv', lv);
      if (lv === 6) {   // the item: as 53.86 built it — Smart Edit, then its tools
        var T = tabsFor(lv), tab = W.tab[lv] && T.some(function (x) { return x[0] === W.tab[lv]; }) ? W.tab[lv] : T[0][0]; W.tab[lv] = tab;
        var fs = W.fs && W.fs.lv === 6 ? W.fs : null;
        var smart = fs ? '<div class="wf-fs' + (fs.busy ? ' busy' : '') + '"><div><b>✨ ' + esc(fs.n) + '</b><small>' + esc(fs.note || '') + '</small></div><div class="wf-fsb"><button type="button" class="no" data-fsx>↶ Undo</button><button type="button" class="ok" data-fsok>✓ Keep</button></div></div>'
          : '<button type="button" class="wf-smart" data-wfsmart><b>✨ Smart Edit</b><small>a picture, a tidy name and a short note for this thing</small></button>';
        c.classList.add('wf3'); var half = Math.ceil(T.length / 2), side = function (L) { return L.map(function (x) { return '<button type="button" role="tab" data-wftab="' + x[0] + '"' + (x[0] === tab ? ' class="on" aria-selected="true"' : '') + '><i>' + ico(x[1]) + '</i><span>' + esc(x[2]) + '</span></button>'; }).join(''); };
        c.innerHTML = head + '<div class="wf-main"><nav class="wf-acts" role="tablist" aria-label="This thing">' + side(T.slice(0, half)) + '</nav><div class="wf-center">' + smart + '<div class="wf-body">' + bodyFor(lv, tab) + '</div><p class="wf-hint">' + esc(HINT[lv]) + '</p></div>' +
          '<nav class="wf-menu" role="tablist" aria-label="More for this thing">' + side(T.slice(half)) + '</nav></div>';
        emoji(c);
      } else {
        var sk = setKey(), D = SETS[sk], pn = W.panel[sk] || 'smart', S = W.S && W.S.set === sk ? W.S : null, nl = Object.keys(locks(sk)).length;
        var acts = [['smart', '✨', 'Smart'], ['suggest', '💡', 'Suggest'], ['lock', nl ? '🔒' : '🔓', 'Lock' + (nl ? ' ' + nl : '')], ['confirm', '✓', 'Confirm'], ['edit', '✎', 'Edit']];
        var menu = [['new', '＋', D.menu[0]], ['gallery', '🖼', D.menu[1]], ['group', '🧩', D.menu[2]], ['smart', '✨', D.smart], ['more', '⋯', 'More tools ▾']];
        c.classList.add('wf3');   // 53.89 · tools down both sides, the console and a gallery in the middle
        c.innerHTML = head + '<div class="wf-main">' +
          // left column: the five steps fold into one button (it pops the others), then the hands-on build tools
          '<nav class="wf-acts" aria-label="Actions">' + stepBtn(acts, pn, S) + HUD_MAIN.map(hudBtn).join('') + '<button type="button" class="wf-popb' + (W.pop === 'tools' ? ' on' : '') + '" data-wfpop="tools" aria-expanded="' + (W.pop === 'tools') + '"><i>🛠</i><span>Tools ▾</span></button></nav>' +
          (V && V.expand ? '<div class="wf-center">' + landPanel() + '</div>' :
          '<div class="wf-center">' +
          (lv === 4 ? '<div class="wf-seg" role="tablist" aria-label="Which tools"><button type="button" data-wfset="roomd"' + (sk === 'roomd' ? ' class="on"' : '') + '>🛋 Room tools · 建房</button><button type="button" data-wfset="disp"' + (sk === 'disp' ? ' class="on"' : '') + '>🗄 Display tools · 陈列</button></div>' : '') +
          (S ? pendHtml(S) : '') +
          '<div class="wf-body">' + panelHtml(lv, sk, pn) + '</div>' + (pn === 'smart' ? '<section class="wf-gal"><h4>🖼 ' + esc(D.menu[1]) + '</h4>' + D.gallery() + '</section>' : '') + '<p class="wf-hint">' + esc(HINT[lv]) + '</p></div>') +
          '<nav class="wf-menu" aria-label="' + esc(D.name) + '">' + menu.map(function (a) { return '<button type="button" data-wfpanel="' + a[0] + '"' + (a[0] === pn ? ' class="on"' : '') + '><i>' + a[1] + '</i><span>' + esc(String(a[2]).replace(/ ▾$/, '')) + '</span></button>'; }).join('') + '</nav></div>';
        emoji(c);
        if (W.pop) popOpen(c, acts, pn, S);
      }
      var nav = c.querySelector('.wf-crumbs'); if (nav) nav.scrollLeft = nav.scrollWidth;   // where you are stays in sight
      clearTimeout(W.fill); W.fill = setTimeout(libFill, 400);
      placePanels(); okChip(); backBtn();
    }
    // ---- hands-on build tools: each presses the island HUD's own button, so they behave exactly as before
    var HUD_MAIN = [['fpv', '🚶', 'Walk in', '[data-fpv]'], ['expand', '⛰', 'More land', '[data-expand]'], ['undo', '↶', 'Undo', '[data-hudundo]']];
    var HUD_MORE = [['redo', '↷', 'Redo', '[data-hudredo]'], ['snap', '▦', 'Grid', '[data-hudsnap]'], ['auto', '✦', 'Arrange for me', '[data-auto]'], ['reorg', '🔀', 'Reorganize', '[data-reorg]'],
      ['arch', '🗺', 'Tile mode', '[data-arch]'], ['box', '🎒', 'Box', '[data-hudsheet="box"]'], ['in', '＋', 'Zoom in', '[data-cam="in"]'], ['out', '−', 'Zoom out', '[data-cam="out"]'],
      ['left', '⟲', 'Turn left', '[data-cam="left"]'], ['right', '⟳', 'Turn right', '[data-cam="right"]'], ['fit', '⤢', 'See it all', '[data-cam="fit"]']];
    function hudEl(sel) { return document.querySelector('.mn-dsp ' + sel) || document.querySelector(sel); }
    function hudBtn(t) {   // mirrors the HUD button's state: ⛰ while adding land reads ✓ Done
      var h = hudEl(t[3]), on = !!(h && h.classList.contains('on')), lab = on && t[0] === 'expand' ? '✓ Done' : t[2];
      return '<button type="button" data-wfhud="' + esc(t[3]) + '"' + (on ? ' class="on"' : '') + (h ? '' : ' disabled') + '><i>' + t[1] + '</i><span>' + esc(lab) + '</span></button>';
    }
    function stepBtn(acts, pn, S) {
      var cur = S && S.i >= 0 ? acts[3] : acts.filter(function (a) { return a[0] === pn; })[0] || acts[0];
      return '<button type="button" class="wf-popb wf-step on' + (W.pop === 'steps' ? ' open' : '') + '" data-wfpop="steps" aria-expanded="' + (W.pop === 'steps') + '"><i>' + cur[1] + '</i><span>' + esc(cur[2]) + ' ▾</span></button>';
    }
    function popOpen(c, acts, pn, S) {   // the pop-out beside the left column
      var html = W.pop === 'steps'
        ? acts.map(function (a) { var on = a[0] === pn || (a[0] === 'confirm' && S && S.i >= 0); return '<button type="button" data-wfact="' + a[0] + '"' + (on ? ' class="on"' : '') + (a[0] === 'confirm' && !(S && S.i >= 0) ? ' disabled' : '') + '><i>' + a[1] + '</i><span>' + esc(a[2]) + '</span></button>'; }).join('')
        : HUD_MORE.map(hudBtn).join('');
      var pop = document.createElement('div'); pop.className = 'wf-pop ' + W.pop; pop.setAttribute('role', 'menu'); pop.innerHTML = html;
      var main = c.querySelector('.wf-main'); main.appendChild(pop);
      var b = c.querySelector('[data-wfpop="' + W.pop + '"]'); if (b) pop.style.top = Math.max(0, Math.min(b.offsetTop - 4, main.clientHeight - pop.offsetHeight)) + 'px';   // beside its button, never off the screen
    }
    // first person on the folded Duo: the view stays above, the joystick and the fly / run / up / down pad move to the lower screen
    setInterval(function () { var w = !!document.querySelector('.mn-dsp .mn-walk'); if (w !== R.classList.contains('wf-walk')) R.classList.toggle('wf-walk', w); }, 300);
    // ⛰ More land on: the middle of the lower screen becomes the land tools (the island above shows ＋ / − plots)
    function landPanel() {
      var n = landOf().length, b = lbox(), room = V.at && V.at.room, g0 = V.d.ground || 'grass';
      return '<section class="wf-land"><div class="wf-land-h"><i>⛰</i><div><b>' + (room ? 'Room space' : 'More land') + '</b><small>' + n + ' plots · ' + (b.x1 - b.x0) + ' × ' + (b.y1 - b.y0) + ' blocks</small></div></div>' +
        '<p class="duo-lib-m">Tap <b>＋</b> on the ' + (room ? 'room' : 'island') + ' above to add a plot, <b>−</b> to take an empty one away. Or grow it at once:</p>' +
        '<div class="wf-land-q"><button type="button" data-wfland="ring"><i>◯</i><b>A ring all round</b><small>one plot wide on every side</small></button><button type="button" data-wfland="double"><i>×2</i><b>Double the land</b><small>twice as many plots</small></button></div>' +
        (room ? '' : '<h4>Ground</h4><div class="wf-chips">' + GROUNDS.map(function (g) { return '<button type="button" data-wfgr="' + g[0] + '"' + (g0 === g[0] ? ' class="on"' : '') + '>' + ({ grass: '🌿', snow: '❄️', sand: '🏖', moss: '🍀' }[g[0]] || '') + ' ' + esc(g[1]) + '</button>'; }).join('') + '</div>') +
        '<button type="button" class="wf-land-ok" data-wfhud="[data-expand]">✓ Done</button></section>';
    }
    function dspPress(attr, val) {   // press a land / ground control through the island's own handler (undo, toasts, limits)
      var host = document.querySelector('.mn-dsp'); if (!host) return; var b = document.createElement('button'); b.type = 'button'; b.hidden = true; b.setAttribute(attr, val); host.appendChild(b); try { b.click(); } finally { b.remove(); }
    }
    function emoji(c) {   // the console reads by pictures: a leading emoji in a card or chip becomes its big icon
      var RE = /^\s*((?:\p{Extended_Pictographic}|\p{Regional_Indicator}|[✦✧✓✎＋⋯▦◩▤🀄])(?:\uFE0F|\u200D\p{Extended_Pictographic})*)\s*/u;
      c.querySelectorAll('.wf-center .wf-list > button > b, .wf-center .wf-list .wf-item > button > b, .wf-center .wf-chips > button, .wf-center .wf-row > button, .wf-center .wf-smart > b, .wf-center .wf-fill > b').forEach(function (b) {
        if (b.querySelector('i.em')) return; var t = b.firstChild; if (!t || t.nodeType !== 3) return; var m = t.nodeValue.match(RE); if (!m) return;
        t.nodeValue = t.nodeValue.slice(m[0].length); var i = document.createElement('i'); i.className = 'em'; i.textContent = m[1]; b.insertBefore(i, b.firstChild); (b.tagName === 'B' ? b.parentNode : b).classList.add('has-em');
      });
    }
    function tabsNav(T, tab) { return '<nav class="wf-tabs" role="tablist">' + T.map(function (x) { return '<button type="button" role="tab" data-wftab="' + x[0] + '"' + (x[0] === tab ? ' class="on" aria-selected="true"' : '') + '>' + ico(x[1]) + '<span>' + esc(x[2]) + '</span></button>'; }).join('') + '</nav>'; }
    function pendHtml(S) {
      return '<div class="wf-pend' + (S.i < 0 ? ' idle' : '') + '"><div class="t"><b>' + esc(S.title) + '</b><small>' + esc(S.i < 0 ? 'Pick a proposal — ‹ › or a chip' : (S.note || '')) + (S.i >= 0 ? ' · nothing saved yet' : '') + '</small></div>' +
        (S.n > 1 ? '<div class="wf-car"><button type="button" data-wfprev aria-label="Previous">‹</button><span>' + (S.i < 0 ? '–' : S.i + 1) + '/' + S.n + '</span><button type="button" data-wfnext aria-label="Next">›</button></div>' : '') +
        '<div class="wf-fsb"><button type="button" class="no" data-wfcancel>✕</button><button type="button" class="ok" data-wfconfirm' + (S.i < 0 ? ' disabled' : '') + '>✓ Confirm</button></div></div>';
    }
    function styleChips() {
      return '<h4>Style direction</h4><div class="wf-chips wf-sty">' + STYLES.map(function (s) { return '<button type="button" data-wfsty="' + s[0] + '"' + (W.style === s[0] ? ' class="on"' : '') + '>' + s[1] + '</button>'; }).join('') + '</div>';
    }
    function panelHtml(lv, sk, pn) {
      var D = SETS[sk], S = W.S && W.S.set === sk ? W.S : null;
      if (pn === 'more') { var T = tabsFor(lv), tab = W.tab[lv] && T.some(function (x) { return x[0] === W.tab[lv]; }) ? W.tab[lv] : T[0][0]; W.tab[lv] = tab; return tabsNav(T, tab) + bodyFor(lv, tab); }
      if (pn === 'edit') return D.edit();
      if (pn === 'lock') return '<p class="duo-lib-m">Locked parts stay as they are when Suggest or Smart make something new.</p><div class="wf-locks">' + D.locks.map(function (l) { var on = !!locks(sk)[l[0]]; return '<button type="button" role="switch" aria-checked="' + on + '" data-wflock="' + l[0] + '"' + (on ? ' class="on"' : '') + '><i>' + (on ? '🔒' : '🔓') + '</i><b>' + esc(l[1]) + '</b><small>' + esc(l[2]) + '</small></button>'; }).join('') + '</div>';
      if (pn === 'suggest') {
        var tab = (S && S.kind === 'suggest' ? S.tab : W.stab) || (D.hasBase() ? 'detail' : 'base'), asp = S && S.kind === 'suggest' ? S.asp : 'all';
        return '<div class="wf-seg sm"><button type="button" data-wfstab="base"' + (tab === 'base' ? ' class="on"' : '') + '>Base · structure, type, layout</button><button type="button" data-wfstab="detail"' + (tab === 'detail' ? ' class="on"' : '') + '>Detail · decor, materials, light</button></div>' +
          '<h4>Suggest</h4><div class="wf-chips">' + [['all', '🎲 Anything']].concat(D[tab]).map(function (a) { return '<button type="button" data-wfasp="' + a[0] + '" data-wftab2="' + tab + '"' + (S && S.kind === 'suggest' && asp === a[0] ? ' class="on"' : '') + '>' + a[1] + '</button>'; }).join('') + '</div>' +
          (S && S.kind === 'suggest' ? '' : '<div class="wf-car big"><button type="button" data-wfsugg="-1">‹ Previous</button><span>–/5</span><button type="button" data-wfsugg="1">Next ›</button></div>') + styleChips();
      }
      if (pn === 'new' || pn === 'gallery' || pn === 'group') return D[pn]();
      var pend = W.S && W.S.kind === 'smart' && W.S.set === sk, base = pend ? W.S.tab === 'detail' : D.hasBase();   // while looking: what the preview is, not what it shows
      return '<button type="button" class="wf-smart" data-wfsmart><b>✨ ' + esc(D.smart) + (pend ? ' · another option ›' : '') + '</b><small>' + esc(base ? 'Base is here — adds the details: ' + D.detail.map(function (x) { return x[1].replace(/^\S+\s/, ''); }).join(', ') : 'No base yet — makes one first: ' + D.base.map(function (x) { return x[1].replace(/^\S+\s/, ''); }).join(', ')) + '</small></button>' +
        '<button type="button" class="wf-fill" data-wffill><b>🪄 Smart Fill</b><small>Island → Building → Room → Display Fixture → Item: fills what is missing at each level</small></button>' + styleChips();
    }
    function placePanels() {   // the ✨ / 🔀 preview panels of the 53.85 tools sit over the console, not over the scene
      var c = document.querySelector('.wf'); if (!c) return; var r = c.getBoundingClientRect();
      document.querySelectorAll('.mn-sb, .mn-ro').forEach(function (o) { o.style.left = Math.round(r.left + 8) + 'px'; o.style.width = Math.round(r.width - 16) + 'px'; o.style.right = 'auto'; o.style.transform = 'none'; o.style.bottom = '8px'; o.style.maxHeight = Math.round(r.height - 16) + 'px'; o.style.overflow = 'auto'; o.classList.add('wf-docked'); });
    }
    function unplacePanels() { document.querySelectorAll('.mn-sb.wf-docked, .mn-ro.wf-docked').forEach(function (o) { ['left', 'width', 'right', 'transform', 'bottom', 'maxHeight', 'overflow'].forEach(function (k) { o.style[k] = ''; }); o.classList.remove('wf-docked'); }); }
    // 🎛 Levels: the console where the phone is not half folded (a side panel when wide, a bottom sheet otherwise)
    function tog() {
      var b = document.querySelector('.wf-tog'), want = live() && !folded() && canToggle() && !mode();
      if (!want) { if (b) b.remove(); return; }
      if (!b) { b = document.createElement('button'); b.type = 'button'; b.className = 'wf-tog'; b.innerHTML = '🎛 <b>Levels</b>'; b.setAttribute('aria-label', 'Open the levels console'); document.body.appendChild(b);
        b.addEventListener('click', function (e) { e.preventDefault(); e.stopPropagation(); setPref(true); sync(); }); }
      b.classList.toggle('in-pv', !!pv);   // a display open: its title bar has Box / ＋ Add top right, so Levels goes bottom right
    }
    // ‹ Back: top left of the scene on every level — one tap to the parent (the island's parent: out of My World)
    function backBtn() {
      var b = document.querySelector('.wf-back'), m = mode();
      if (!m) { if (b) b.remove(); return; }
      if (!b) { b = document.createElement('button'); b.type = 'button'; b.className = 'wf-back'; document.body.appendChild(b);
        ['pointerdown', 'touchstart'].forEach(function (ev) { b.addEventListener(ev, function (e) { e.stopPropagation(); }, { passive: true }); });
        b.addEventListener('click', function (e) { e.preventDefault(); e.stopPropagation(); if (level() > 1) up(); else { try { close(); } catch (x) {} } }); }
      var lv = level(), to = lv > 1 ? LVN[lv - 1] : '', lab = lv > 1 ? 'Back to the ' + to.toLowerCase() : 'Close My World';
      if (b.innerHTML !== '‹') b.innerHTML = '‹'; if (b.getAttribute('aria-label') !== lab) { b.setAttribute('aria-label', lab); b.title = lab; }
    }
    // the dashed next floor over the dollhouse: only while a floor is being added (＋ Floor, or adding rooms)
    function floorGuide() {
      var b = level() === 3 && bldOf(), fl = b ? (b.floors || 1) : 0;
      if (W.addFl && (!b || W.addFl.pc !== b.id || W.addFl.fl !== fl)) W.addFl = null;   // a floor was added, or you left: hidden again
      R.classList.toggle('wf-addfl', !!(b && W.addFl));
    }
    // ✓ in the scene: by what the proposal changed (or the scene's bottom middle)
    function okChip() {
      var o = document.querySelector('.wf-ok'), S = W.S;
      if (!S || S.i < 0 || !mode()) { if (o) o.remove(); return; }
      if (!o) { o = document.createElement('div'); o.className = 'wf-ok'; o.innerHTML = '<button type="button" class="ok" data-wfconfirm>✓ Confirm</button><button type="button" class="no" data-wfcancel aria-label="Put it back">✕</button>'; document.body.appendChild(o);
        ['pointerdown', 'touchstart'].forEach(function (ev) { o.addEventListener(ev, function (e) { e.stopPropagation(); }, { passive: true }); });
        o.addEventListener('click', function (e) { var g = e.target.closest('button'); if (!g) return; e.preventDefault(); e.stopPropagation(); if (g.hasAttribute('data-wfconfirm')) sConfirm(); else sCancel(); }); }
      var sc = (pv && pv.el) || (el && el.querySelector('.mn-dsp-stage')); if (!sc) return; var r = sc.getBoundingClientRect(), x = r.left + r.width / 2, y = r.bottom - 64;
      var f = S.focus && !pv && level() !== 2 && pieceOf(S.focus), scn = el && el.querySelector('.mn-dsp-scene');
      if (f && scn) { var rs = scn.getBoundingClientRect(), ft = foot(f), c2 = P((ft.x0 + ft.x1) / 2, (ft.y0 + ft.y1) / 2, 0); x = clamp(rs.left + V.cam.x + c2[0] * V.cam.z, r.left + 90, r.right - 90); y = clamp(rs.top + V.cam.y + c2[1] * V.cam.z + 18, r.top + 70, r.bottom - 60); }
      o.style.left = Math.round(x) + 'px'; o.style.top = Math.round(y) + 'px';
    }

    // ---------------------------------------------------------------- what the 53.86 tools do
    function sel(id) { V.sel = { pc: id }; render(); var p = pieceOf(id); if (p && DUO_API) DUO_API.centreOn(p); }
    function reopen(ref) { if (!pv) return; var pc = pv.pc; render(); openPiece(pc, ref || null); }
    function landDo(how) {
      if (how === 'edit') { V.expand = !V.expand; V.sel = null; render(); fit(); if (V.expand) toast('Tap ＋ to add land, − to take an empty plot away'); return; }
      var n0 = landOf().length; if (n0 >= MAX_PLOTS) { toast('That is as big as it gets'); return; }
      change(function () { if (how === 'ring') { V.d.land = landOf().concat(candidates().add).slice(0, MAX_PLOTS); refreshLand(); } else { var g = 0; while (landOf().length < Math.min(MAX_PLOTS, n0 * 2) && g++ < 40 && growLand()); } });
      fit(); hap('success'); toast(landOf().length + ' plots now');
    }
    function doAct(a) {
      editOn();
      if (a === 'kits') return kitsOpen();
      if (a === 'city') return cityOpen();
      if (a === 'sample') { var hs = houseSample(); if (hs) { hap('success'); toast('🏠 House Sample — double-tap it to go in'); } return; }
      if (a === 'reorg') { if (level() === 4 || level() === 2) V.sel = null; roOpen(); return draw(); }
      if (a === 'arrange' || a === 'furnish' || a === 'bsuggest' || a === 'bfill') return bulbDo({ arrange: 'arrange', furnish: 'rfurnish', bsuggest: 'bsuggest', bfill: 'bfill' }[a]);
    }
    function moveRef(p, r, d) { var a = (p.it || []).slice(), i = a.indexOf(r), j = i + d; if (i < 0 || j < 0 || j >= a.length) return; a.splice(i, 1); a.splice(j, 0, r); p.it = a; save(); hap('selection'); reopen(null); }
    function bvForward(g) {   // the dollhouse's own room bar, used here: its click and input handlers do the work
      if (!BV) return; BV.armed = 1;
      if (g.hasAttribute('data-rgrow') || g.hasAttribute('data-rshrink')) return roomSpace(g);
      try { bvClick({ target: g, currentTarget: null, stopPropagation: function () {}, preventDefault: function () {} }); } catch (x) {}
      draw();
    }
    function roomSpace(g) {
      var grow = g.hasAttribute('data-rgrow'), b = bldOf(), id = g.getAttribute(grow ? 'data-rgrow' : 'data-rshrink'), r = b && (b.rooms || []).filter(function (x) { return x.id === id; })[0]; if (!r) return;
      var d = roomD(r), ok = withD(d, function () { if (grow) return growLand(); var land = landOf(); if (land.length <= 9) return false; for (var i = land.length - 1; i >= 0; i--) if (plotFree(land[i])) { d.land = land.filter(function (x, j) { return j !== i; }); return true; } return false; });
      if (!ok) { toast(grow ? 'That is as big as a room gets' : 'Nothing free to take away'); return; }
      save(); bvDraw(); render(); hap('light'); draw();
    }
    function click(e) {
      var g = e.target.closest('button, [data-wfput]'); if (!g || g.disabled) return; e.preventDefault(); e.stopPropagation();
      var p, v, lv = level(), sk = lv < 6 ? setKey() : null;
      if (g.hasAttribute('data-wfup')) return up();
      if (g.hasAttribute('data-wfx')) { setPref(false); return sync(); }
      if ((v = g.getAttribute('data-wfgo'))) return goTo(+v);
      // the unified tools
      if ((v = g.getAttribute('data-wfland'))) { dspPress('data-landfast', v); return setTimeout(draw, 60); }
      if ((v = g.getAttribute('data-wfgr'))) { dspPress('data-gr', v); return setTimeout(draw, 60); }
      if ((v = g.getAttribute('data-wfpop'))) { W.pop = W.pop === v ? null : v; return draw(); }
      if ((v = g.getAttribute('data-wfhud'))) { W.pop = null; var hb = hudEl(v); if (hb) hb.click(); setTimeout(draw, 60); return; }
      if (W.pop && g.closest('.wf-pop')) W.pop = null;
      if ((v = g.getAttribute('data-wfset'))) { if (W.S) sCancel(true); W.set4 = v; return draw(); }
      if ((v = g.getAttribute('data-wfact'))) {
        if (v === 'confirm') return sConfirm();
        if (v === 'smart') { W.panel[sk] = 'smart'; return smartGo(sk); }   // ✨ makes it at once (again: another option)
        W.panel[sk] = v; return draw(); }
      if ((v = g.getAttribute('data-wfpanel'))) { if (v === 'smart') { W.panel[sk] = 'smart'; return smartGo(sk); } W.panel[sk] = v; return draw(); }
      if ((v = g.getAttribute('data-wfsty'))) { W.style = v; try { localStorage.setItem('minest.wf.style', v); } catch (x) {} if (W.S && W.S.i >= 0) { W.S.cache = {}; W.S.notes = {}; return sGo(W.S.i); } return draw(); }
      if ((v = g.getAttribute('data-wflock'))) { setLock(sk, v); return draw(); }
      if ((v = g.getAttribute('data-wfstab'))) { W.stab = v; if (W.S && W.S.kind === 'suggest') sCancel(true); return draw(); }
      if ((v = g.getAttribute('data-wfasp'))) { sOpen(sk, 'suggest', { tab: g.getAttribute('data-wftab2'), asp: v, n: 5, title: '💡 Suggest · ' + (v === 'all' ? 'anything' : g.textContent.replace(/^\S+\s/, '')) }); return sGo(0); }
      if ((v = g.getAttribute('data-wfsugg'))) { var tb = W.stab || (SETS[sk].hasBase() ? 'detail' : 'base'); sOpen(sk, 'suggest', { tab: tb, asp: 'all', n: 5, title: '💡 Suggest · ' + tb }); return sGo(+v > 0 ? 0 : 4); }
      if (g.hasAttribute('data-wfprev')) return sGo((W.S.i < 0 ? 0 : W.S.i) - 1);
      if (g.hasAttribute('data-wfnext')) return sGo(W.S.i + 1);
      if (g.hasAttribute('data-wfconfirm')) return sConfirm();
      if (g.hasAttribute('data-wfcancel')) return sCancel();
      if (g.hasAttribute('data-wffill')) { sOpen(sk, 'fill', { n: 3, title: '🪄 Smart Fill' }); return sGo(0); }
      if ((v = g.getAttribute('data-wfpick'))) { var a = v.split(':'); sOpen(sk, a[0], { n: +a[2], title: g.getAttribute('data-wft2') || 'Preview' }); return sGo(+a[1]); }
      if ((v = g.getAttribute('data-wfnw'))) { try { MinestNewWorld.open(v); } catch (x) { toast('New worlds are not available here'); } return; }
      if ((v = g.getAttribute('data-wfpg'))) { var lbp = g.closest('[data-lib]').getAttribute('data-lib'); W.grp[lbp + ':p'] = Math.max(0, (W.grp[lbp + ':p'] || 0) + (+v)); return draw(); }
      if ((v = g.getAttribute('data-wfdtab'))) { W.dtab = v; return draw(); }
      if ((v = g.getAttribute('data-wfskinw'))) { W.skinUndo = W.skinUndo || []; skinSet('uv:skin:w:' + V.bid, v); hap('selection'); toast('🏝 The main island looks like “' + ((AS() && AS().info(v) || {}).name || v) + '” in My World'); return draw(); }
      if ((v = g.getAttribute('data-wfskinc'))) { var sc = v.split('|'); skinSet('uv:skin:c:' + V.bid + ':' + sc[0], sc[1]); hap('selection'); toast('🏝 Subsidiary island: “' + ((AS() && AS().info(sc[1]) || {}).name || sc[1]) + '”'); return draw(); }
      if ((v = g.getAttribute('data-wfarea')) != null) { W.area = +v; return draw(); }
      if ((v = g.getAttribute('data-wfgstyle'))) return groupStyle(v);
      if (g.hasAttribute('data-wfskinundo')) return skinUndo();
      if ((v = g.getAttribute('data-wfout2'))) return outsideSet(v);
      if ((v = g.getAttribute('data-wfrg'))) return lv === 4 ? roomKind4(v) : roomType(v);
      if ((v = g.getAttribute('data-wfrf')) != null) return lv === 4 ? roomFinish4(+v) : roomFinish(+v);
      if (g.hasAttribute('data-wfblankroom')) return blankRoom();
      if (g.hasAttribute('data-wfblankbld')) return blankBld();
      if (g.hasAttribute('data-wfshelfnear')) return shelfNear();
      if ((v = g.getAttribute('data-wfdk'))) return dispKind(v);
      if ((v = g.getAttribute('data-wfvk'))) return vocabKind(v);
      if ((v = g.getAttribute('data-wfform'))) return formSet(v, g.getAttribute('data-wfref'));
      if ((v = g.getAttribute('data-wftstyle'))) return titleStyle(v);
      if (g.hasAttribute('data-wfsmart')) return lv === 6 ? smartEdit() : smartGo(sk);
      if (g.hasAttribute('data-fsok')) return fsEnd(true);
      if (g.hasAttribute('data-fsx')) return fsEnd(false);
      // the 53.86 tools
      if ((v = g.getAttribute('data-wftab'))) { W.tab[lv] = v; return draw(); }
      if ((v = g.getAttribute('data-wfgrp')) != null) { var lb = g.closest('[data-lib]'), lk = lb ? lb.getAttribute('data-lib') : W.tab[lv]; W.grp[lk] = +v; W.grp[lk + ':p'] = 0; return draw(); }
      if ((v = g.getAttribute('data-pkkind'))) { editOn(); if (W.S) sCancel(true); try { lib4Kind(v); } catch (x) {} if (DUO_API) DUO_API.placeKind(v); else change(function () { var q = add(v, (lbox().x0 + lbox().x1) / 2, (lbox().y0 + lbox().y1) / 2); if (q) V.sel = { pc: q.id }; }); if (V.sel && V.sel.pc && sk) W.panel[sk] = 'edit'; return draw(); }
      if ((v = g.getAttribute('data-wk'))) { if (DUO_API) DUO_API.wkAct(v); return draw(); }
      if ((v = g.getAttribute('data-wfbld'))) { editOn(); return bldOpen(v); }
      if ((v = g.getAttribute('data-wfopen'))) return openPiece(v);
      if ((v = g.getAttribute('data-wfsel'))) return sel(v);
      if ((v = g.getAttribute('data-wfland'))) { editOn(); return landDo(v); }
      if ((v = g.getAttribute('data-wfground'))) { change(function () { V.d.ground = v; }); return hap('selection'); }
      if ((v = g.getAttribute('data-wffinish')) != null) { var f = RO_FINISH[+v]; change(function () { V.d.floor = f[0]; V.d.wall = f[1]; }); return hap('selection'); }
      if ((v = g.getAttribute('data-wfdo'))) return doAct(v);
      // the building
      if ((v = g.getAttribute('data-wfrsel'))) { if (BV) { BV.sel = BV.sel === v ? null : v; bvDraw(); } return draw(); }
      if ((v = g.getAttribute('data-wffl'))) return bvFloors.floor(+v);
      if ((v = g.getAttribute('data-wffloor'))) { if (v === 'add') bvFloors.addFloor(); else bvFloors.rmFloor(); var bf = bldOf(); W.addFl = v === 'add' && bf ? { pc: bf.id, fl: bf.floors || 1 } : null; floorGuide(); return draw(); }
      if (g.hasAttribute('data-wfguide')) { var bg = bldOf(); W.addFl = W.addFl ? null : bg && { pc: bg.id, fl: bg.floors || 1 }; floorGuide(); return draw(); }
      if ((v = g.getAttribute('data-wfroom'))) { var b0 = bldOf(); bvFloors.addAt(v, (b0 && b0.viewFl) || 1); W.tab[lv] = 'rooms'; return draw(); }
      if ((v = g.getAttribute('data-wfmode'))) { if (window.MinestFloorPlan) MinestFloorPlan.setMode(v); return draw(); }
      if ((v = g.getAttribute('data-wfhome'))) { bvFloors.home(v); return draw(); }
      if (g.closest('.wf-bv')) return bvForward(g);
      // the display fixture
      p = pvPiece();
      if ((v = g.getAttribute('data-wfput')) && p) { if (putOnPiece(p, v)) { save(); hap('light'); reopen(null); } return; }
      if (g.hasAttribute('data-wfnew') && p) { var c = g.closest('.wf'), inp = c.querySelector('[data-wfnt]'), t = String(inp.value || '').trim(), card = c.querySelector('[data-wfnl]').value, pc = pv.pc; if (!t) return inp.focus();
        inp.value = ''; return newThing(card, t, function (ref) { var p2 = pieceOf(pc); if (!ref || !p2) return; var ok = putOnPiece(p2, ref); save(); render(); if (pv && pv.pc === pc) openPiece(pc); hap('success'); if (ok) toast('“' + t + '” is on ' + nm(p2)); }); }
      if ((v = g.getAttribute('data-wfmv')) && p) return moveRef(p, g.getAttribute('data-wfref'), +v);
      if ((v = g.getAttribute('data-wfoff')) && p) { p.it = (p.it || []).filter(function (x) { return x !== v; }); save(); hap('light'); return reopen(null); }
      if ((v = g.getAttribute('data-wfdet')) && pv) { var i = pv.refs.indexOf(v); if (i >= 0) pvDetail(i); return; }
      if ((v = g.getAttribute('data-wfsz')) && p) { var s0 = p.s || 1, x0 = p.x, y0 = p.y; p.s = clamp(Math.round((s0 + (+v) * .25) * 100) / 100, .5, 2.5); if (!fits(p) && !settle(p, x0, y0)) { p.s = s0; p.x = x0; p.y = y0; toast('No room for it that big here'); return; } save(); return reopen(null); }
      if ((v = g.getAttribute('data-wfkind')) != null && p) { var st = roStyles({ lv: 'fixture', p: p })[+v]; if (st) { st.go(); save(); hap('selection'); reopen(null); } return; }
      // the item
      if ((v = g.getAttribute('data-wfnav')) && pv) { var j = pv.at + (+v); if (j >= 0 && j < pv.refs.length) pvDetail(j); return; }
      if ((v = g.getAttribute('data-wfpv')) && pv) { var b = pv.el.querySelector('[' + v + ']'); if (b) b.click(); return; }
      if ((v = g.getAttribute('data-wfpic'))) return picDo(v, g);
    }
    function onChange(e) {
      var t = e.target, p;
      if (t.closest('.wf-bv') && BV) { BV.armed = 1; try { bvInput({ target: t }); } catch (x) {} return draw(); }
      if (t.matches('[data-wfout]')) { bvFloors.outside(t.value); return draw(); }
      if (t.matches('[data-wflabel]') && (p = pvPiece())) { p.label = String(t.value || '').trim(); save(); return reopen(null); }
      if (t.matches('[data-wfbt]')) return boardTitle(t.value);
      if (t.matches('[data-wfct]')) return boardTitle(t.value, t.getAttribute('data-wfct'));
      if (t.matches('[data-wfisle]')) return isleTitleSet(+t.getAttribute('data-wfisle'), t.value);
      if (t.matches('[data-wfrtitle]')) return level() === 4 ? roomTitle4(t.value) : roomTitle(t.value);
      var ref = pvRef(); if (!ref) return;
      if (t.matches('[data-wft]')) { var v = String(t.value || '').trim(); if (v) patchThing(ref, { title: v }); return; }
      if (t.matches('[data-wfn]')) return patchThing(ref, { desc: String(t.value || '') });
      if (t.matches('[data-wfdone]')) return patchThing(ref, { complete: !!t.checked });
    }

    // ---------------------------------------------------------------- a card, through the board's own update (synced like any edit)
    function patchThing(ref, patch) {
      var t = thing(ref); if (!t) return false; var bid = realBid(t.k.id), id = t.s.id, before = null; try { before = A().boards(); } catch (e) {}
      var fix = function (x) { var o = Object.assign({}, x); Object.keys(patch).forEach(function (k) { if (patch[k] === undefined) delete o[k]; else o[k] = patch[k]; }); return o; };
      try {
        A().updateBoard(bid, function (bd) { return Object.assign({}, bd, { columns: (bd.columns || []).map(function (c) { var hit = false;
          var cards = (c.cards || []).map(function (k) { if (!k) return k; if (k.id === id) { hit = true; return fix(k); }
            if (k.stack && k.stack.some(function (s) { return s && s.id === id; })) { hit = true; return Object.assign({}, k, { stack: k.stack.map(function (s) { return s && s.id === id ? fix(s) : s; }) }); } return k; });
          return hit ? Object.assign({}, c, { cards: cards }) : c; }) }); });
      } catch (e) { toast('✗ That could not be saved'); return false; }
      var t0 = Date.now(); (function w() { var now = null; try { now = A().boards(); } catch (e) {} if (now === before && Date.now() - t0 < 1500) return setTimeout(w, 60); written(ref); })();
      return true;
    }
    function written(ref) { if (!V) return; index(); if (pv) { var keep = pv.refs.indexOf(ref) >= 0 && pv.at >= 0 ? ref : null; reopen(keep); } W.key = ''; soon(); }
    function findPic(title, list) {
      var P = window.MinestPics && MinestPics.find ? MinestPics.find(title, list).catch(function () { return null; }) : Promise.resolve(null);
      return P.then(function (r) { if (r && r.url) return r; return window.MinestCartoon && MinestCartoon.icon ? MinestCartoon.icon(title).then(function (x) { return x ? { url: x.url, by: x.by } : null; }, function () { return null; }) : null; });
    }
    function cover(r) { return { type: 'image', value: r.url, url: r.url, title: r.by || (r.page ? 'Wikipedia · ' + r.page : 'Picture'), size: 'banner' }; }
    function wikiNote(title) {   // the first sentences of its Wikipedia page (the same public page the pictures come from)
      title = String(title || '').replace(/^my\s+/i, '').trim(); if (!title || !window.fetch) return Promise.resolve(null);
      return fetch('https://en.wikipedia.org/api/rest_v1/page/summary/' + encodeURIComponent(title.replace(/ /g, '_')) + '?redirect=true', { headers: { Accept: 'application/json' } })
        .then(function (r) { return r.ok ? r.json() : null; })
        .then(function (d) { if (!d || d.type === 'disambiguation' || !d.extract) return null; var x = String(d.extract).match(/[^.!?]+[.!?]+/g) || [d.extract]; var o = x.slice(0, 2).join('').trim(); return o.length > 320 ? o.slice(0, 317).replace(/\s+\S*$/, '') + '…' : o; })
        .catch(function () { return null; });
    }
    function picDo(how, g) {
      var ref = pvRef(), t = thing(ref); if (!t) return;
      if (how === 'none') return patchThing(ref, { cover: undefined });
      if (how === 'url') { var u = String((g.closest('.wf').querySelector('[data-wfurl]') || {}).value || '').trim(); if (!/^https?:\/\//i.test(u)) { toast('Paste a link that starts with https://'); return; } return patchThing(ref, { cover: cover({ url: u, by: 'Link' }) }); }
      g.disabled = true; g.textContent = '…';
      var P = how === 'icon' && window.MinestCartoon ? MinestCartoon.icon(t.s.title).then(function (x) { return x ? { url: x.url, by: x.by } : null; }, function () { return null; }) : findPic(t.s.title, t.k.title);
      P.then(function (r) { if (!r || !r.url) { toast('No picture found for “' + t.s.title + '”'); draw(); return; } patchThing(ref, { cover: cover(r) }); hap('success'); });
    }
    function smartEdit() {   // one tap: a tidy name, a picture if it has none, a short note if it has none — ↶ Undo puts it all back
      var ref = pvRef(), t = thing(ref); if (!t) return; var s = t.s, old = { title: s.title, desc: s.desc, cover: s.cover }, patch = {}, did = [];
      var tidy = String(s.title || '').replace(/\s+/g, ' ').trim(); if (tidy) tidy = tidy.charAt(0).toUpperCase() + tidy.slice(1);
      if (tidy && tidy !== s.title) { patch.title = tidy; did.push('tidy name'); }
      var needPic = !picOf(s), needNote = !String(s.desc || '').trim();
      W.fs = { lv: 6, kind: 'edit', ref: ref, old: old, i: 0, busy: true, n: 'Smart Edit', note: needPic || needNote ? 'Looking for ' + (needPic ? 'a picture' : '') + (needPic && needNote ? ' and ' : '') + (needNote ? 'a short note' : '') + '…' : 'Tidying…' }; draw();
      (needPic ? findPic(tidy || s.title, t.k.title) : Promise.resolve(null)).then(function (r) {
        if (r && r.url) { patch.cover = cover(r); did.push('picture'); }
        return needNote ? wikiNote((r && r.page) || tidy || s.title) : null;
      }).then(function (note) {
        if (!W.fs || W.fs.ref !== ref) return;
        if (note) { patch.desc = note; did.push('note'); }
        if (!did.length) { W.fs = null; draw(); toast('✨ “' + (tidy || s.title) + '” already has a picture, a tidy name and a note'); return; }
        patchThing(ref, patch); W.fs = { lv: 6, kind: 'edit', ref: ref, old: old, i: 0, n: 'Smart Edit', note: 'Added: ' + did.join(' · ') + ' — saved to the card' }; hap('success'); draw();
      });
    }

    function fsEnd(keep) {   // Smart Edit (the item): written at once — ↶ Undo puts the card back
      var F = W.fs; if (!F) return; W.fs = null;
      if (!keep) { patchThing(F.ref, F.old); toast('↶ As it was'); } else hap('success'); draw();
    }


    // ================================================================ 53.87 · the tools: Smart · Suggest · Lock · Confirm · Edit
    var STYLES = [['surprise', '🎲 Surprise Me'], ['natural', '🌿 Natural'], ['cozy', '🕯 Cozy'], ['modern', '🏙 Modern'], ['museum', '🏛 Museum'], ['fantasy', '🦄 Fantasy'], ['minimal', '◻ Minimal']];
    var BIAS = {   // how a style direction leans: ground, outdoor decor, room finishes (RO_FINISH index), displays, rooms, indoor decor, how much
      natural: { ground: ['grass', 'moss'], decor: /^(tree|birch|spruce|bush|flowers|rock|pond|mushroom|bamboo|fl_)/, finish: [0, 2], disp: /garden|aquarium|ktree|shelf|books/, rooms: ['garden', 'living', 'reading', 'study'], indoor: /plant|rug|obj:/, count: 1 },
      cozy: { ground: ['grass'], decor: /^(cherry|bench|lamp|flowers|well|beehive|bush|fence|fl_)/, finish: [0, 3], disp: /books|records|desk|wall|shelf/, rooms: ['living', 'reading', 'bedroom', 'kitchen', 'dining'], indoor: /rug|lamp|plant|sofa|armchair|fireplace/, count: 1 },
      modern: { ground: ['sand', 'grass'], decor: /^(lamp|fountain|bench|pathway|palm|crystal)/, finish: [1, 4], disp: /grid|gallery|wall|cinema|net/, rooms: ['living', 'workshop', 'gallery', 'study'], indoor: /lamp|plant|obj:/, count: .8 },
      museum: { ground: ['grass'], decor: /^(fountain|lamp|bench|pathway|rock)/, finish: [1, 2], disp: /museum|gallery|wall|trophy|time|mhall/, rooms: ['gallery', 'hall', 'memory', 'trophy', 'reading'], indoor: /lamp|plant|rug/, count: .7 },
      fantasy: { ground: ['moss', 'snow'], decor: /^(cherry|crystal|mushroom|pond|fountain|bamboo|palm|fl_)/, finish: [3, 1], disp: /stars|orbit|balloons|aquarium|ktree/, rooms: ['dreams', 'garden', 'games', 'music'], indoor: /obj:|plant|lamp/, count: 1.2 },
      minimal: { ground: ['sand', 'snow'], decor: /^(rock|tree|bench)$/, finish: [1], disp: /shelf|grid|wall/, rooms: ['living', 'study', 'bedroom'], indoor: /plant|lamp/, count: .4 } };
    function styFor(i) { if (W.style && W.style !== 'surprise' && BIAS[W.style]) return BIAS[W.style]; var ks = Object.keys(BIAS); return BIAS[ks[(i + 2) % ks.length]]; }
    function styName(i) { if (W.style && W.style !== 'surprise') return ''; var ks = Object.keys(BIAS); return ks[(i + 2) % ks.length]; }
    function bias(arr, re) { if (!re) return arr; var f = arr.filter(function (k) { return re.test(k); }); return f.length ? f : arr; }
    function okK(k) { return !!(k && K[k] && BUILD[k]); }
    function flowers() { return FLOWER_KINDS.map(function (v) { return Array.isArray(v) ? v[0] : v; }).filter(okK); }
    var NAT_RE = /^(tree|birch|cherry|spruce|palm|bamboo|bush|flowers|rock|fountain|lamp|bench|well|beehive|mushroom|crystal|pond|cactus)$/;
    function natPool(B) { var a = DECOR_KINDS.filter(function (k) { return NAT_RE.test(k) && okK(k); }).concat(flowers().slice(0, 6)); return bias(a, B && B.decor); }
    function l4(g) { try { return lib4Ids(g, 'obj:'); } catch (e) { return []; } }
    function scatter(pool, n, near) { var c = 0; pool = pool.filter(function (k) { return /^obj:/.test(k) || okK(k); }); for (var t = 0; t < n * 3 && c < n && pool.length; t++) if (sbPlace(pool[Math.floor(Math.random() * pool.length)], near ? near[0] : null, near ? near[1] : null)) c++; return c; }
    function placeAll(list) { var c = 0; list.forEach(function (k) { if (sbPlace(k)) c++; }); return c; }
    // what a piece is (for locks and for what a proposal touches)
    function cDisp(p) { return !!(K[p.k] && !K[p.k].decor && !isBld(p)); }
    function cLight(p) { return /lamp|lantern|light|candle|chandel|torch/i.test(p.k) && !cDisp(p); }
    function cMob(p) { return MOB_KINDS.indexOf(p.k) >= 0 || CRITTER_KINDS.indexOf(p.k) >= 0; }
    function cFurn(p) { return !!(K[p.k] && (K[p.k].furn || K[p.k].model || /^(obj|m3d):/.test(p.k))) && !cLight(p) && !cDisp(p); }
    function cDecor(p) { return !!(K[p.k] && K[p.k].decor && !isBld(p) && !cFurn(p)); }
    function keepCat(h, O, test) { h.pc = (h.pc || []).filter(function (p) { return !test(p); }).concat(JSON.parse(JSON.stringify((O.pc || []).filter(test)))); }
    function byId(a) { var m = {}; (a || []).forEach(function (x) { m[x.id] = x; }); return m; }

    // ---------------------------------------------------------------- locks: per level, kept in the synced layout (wfLock on the level's own record)
    function hostOf(set, Rt) {
      Rt = Rt || islandD(); if (set === 'island' || set === 'bld') return Rt;
      var b = V.at && (Rt.pc || []).filter(function (p) { return p.id === V.at.pc; })[0];
      if (set === 'room') return b || null;
      var d = V.at && V.at.room ? ((b && (b.rooms || []).filter(function (x) { return x.id === V.at.room; })[0]) || {}).d : Rt;
      return d || null;   // the room (or the island, for a display out in the open): Room tools of this room, Display tools
    }
    function locks(set) { var h = hostOf(set); return (h && h.wfLock && h.wfLock[set]) || {}; }
    function setLock(set, k) {
      var flip = function (h) { if (!h) return; var all = h.wfLock = Object.assign({}, h.wfLock || {}), o = all[set] = Object.assign({}, all[set] || {}); if (o[k]) delete o[k]; else o[k] = 1; };
      flip(hostOf(set)); hap('selection');
      var S = W.S; if (!S) return save();
      var fix = function (json) { var o = JSON.parse(json); flip(hostOf(set, o)); return JSON.stringify(o); };   // a lock is not part of the preview: the snapshot gets it too
      S.snap = fix(S.snap); S.cache = {}; S.notes = {}; S.lockSave = 1; if (S.i >= 0) sGo(S.i);
    }
    function applyLocks(set, h, O) {
      var L = (O.wfLock && O.wfLock[set]) || {}, m;
      if (set === 'island') { if (L.terrain) h.land = (O.land || []).slice(); if (L.materials) h.ground = O.ground; if (L.buildings) keepCat(h, O, function (p) { return isBld(p) || cDisp(p); }); if (L.decor) keepCat(h, O, function (p) { return !isBld(p) && !cDisp(p); }); }
      if (set === 'bld') {
        if (L.structure) keepCat(h, O, isBld);
        m = byId(O.pc); (h.pc || []).forEach(function (p) { var o = m[p.id]; if (!o || !isBld(p)) return; if (L.layout) { p.x = o.x; p.y = o.y; p.f = o.f; } if (L.exterior) { p.k = o.k; p.s = o.s; }
          if (L.materials) { var orr = byId(o.rooms); (p.rooms || []).forEach(function (r) { var q = orr[r.id]; if (q && q.d && r.d) { r.d.floor = q.d.floor; r.d.wall = q.d.wall; } }); } });
      }
      if (set === 'room') {
        m = byId(O.rooms);
        if (L.structure) { var cur = byId(h.rooms); h.rooms = (O.rooms || []).map(function (o) { return cur[o.id] || JSON.parse(JSON.stringify(o)); }); h.floors = O.floors; }
        if (L.layout) { var ord = (O.rooms || []).map(function (r) { return r.id; }); (h.rooms || []).sort(function (a, b) { var i = ord.indexOf(a.id), j = ord.indexOf(b.id); return (i < 0 ? 1e9 : i) - (j < 0 ? 1e9 : j); }); (h.rooms || []).forEach(function (r) { var o = m[r.id]; if (o) { r.fl = o.fl; r.sz = o.sz; } }); h.roomOrder = O.roomOrder; }
        (h.rooms || []).forEach(function (r) { var o = m[r.id]; if (!o || !o.d || !r.d) return; if (L.furniture) keepCat(r.d, o.d, cFurn); if (L.decor) keepCat(r.d, o.d, function (p) { return cDecor(p) || cLight(p); }); });
      }
      if (set === 'disp') {
        if (L.fixtures) keepCat(h, O, cDisp);
        else if (L.layout) { m = byId(O.pc); (h.pc || []).forEach(function (p) { var o = m[p.id]; if (o && cDisp(p)) { p.x = o.x; p.y = o.y; p.f = o.f; } }); }
        if (L.lighting) keepCat(h, O, cLight); if (L.materials) { h.floor = O.floor; h.wall = O.wall; }
      }
      if (set === 'roomd') {
        if (L.structure) h.land = (O.land || []).slice();
        if (L.layout) { m = byId(O.pc); (h.pc || []).forEach(function (p) { var o = m[p.id]; if (o) { p.x = o.x; p.y = o.y; p.f = o.f; } }); }
        if (L.furniture) keepCat(h, O, cFurn); if (L.decor) keepCat(h, O, function (p) { return cDecor(p) || cLight(p); });
      }
      if (set === 'fixture') {   // the display fixture that is open, and what is round it in its room
        var fp = pv && byId(h.pc)[pv.pc], fo = pv && byId(O.pc)[pv.pc];
        if (fp && fo && L.fixtures) { fp.k = fo.k; fp.s = fo.s; fp.x = fo.x; fp.y = fo.y; fp.f = fo.f; }
        if (fp && fo && L.layout) { fp.it = (fo.it || []).slice(); }
        if (L.lighting) keepCat(h, O, cLight); if (L.materials) { h.floor = O.floor; h.wall = O.wall; }
      }
    }

    // ---------------------------------------------------------------- proposals: shown live, nothing saved until ✓ Confirm
    function atKey2() { return V ? V.bid + '|' + (V.at ? V.at.pc + '/' + (V.at.room || '') : '') + '|' + (pv ? pv.pc : '') : ''; }
    function restoreRoot(json) {
      var R0 = islandD(), o = JSON.parse(json); Object.keys(R0).forEach(function (k) { delete R0[k]; }); Object.assign(R0, o);
      if (V.at && V.at.room) { var b = (R0.pc || []).filter(function (p) { return p.id === V.at.pc; })[0], r = b && (b.rooms || []).filter(function (x) { return x.id === V.at.room; })[0]; if (r) V.d = roomD(r); }
      refreshLand();
    }
    function ids(root) { var m = {}; (function go(d) { (d.pc || []).forEach(function (p) { m[p.id] = 1; (p.rooms || []).forEach(function (r) { m[r.id] = 1; if (r.d) go(r.d); }); }); })(root); return m; }
    function sOpen(set, kind, o) {
      if (W.S) sCancel(true); editOn(); V.sel = null;
      W.S = Object.assign({ set: set, kind: kind, tab: 'base', asp: 'all', i: -1, n: 5, cache: {}, notes: {}, focus: {}, title: '' }, o || {}, { snap: JSON.stringify(islandD()), at: atKey2(), lv: level() });
    }
    function sGo(i) {
      var S = W.S; if (!S) return; i = ((i % S.n) + S.n) % S.n; S.i = i;
      if (S.cache[i]) { restoreRoot(S.cache[i]); }
      else {
        restoreRoot(S.snap); var note = '', before = ids(islandD());
        quiet(function () { try { note = runGen(S, i) || ''; } catch (e) { note = 'That one did not work here'; try { console.warn('wf', e); } catch (x) {} } });
        var Rt = islandD(), O = JSON.parse(S.snap), h = hostOf(S.set); if (S.kind === 'fill') { applyLocks('island', Rt, O); applyLocks('bld', Rt, O); } else if (h) applyLocks(S.set, h, hostOf(S.set, O));
        var now = ids(Rt), nw = (V.d.pc || []).filter(function (p) { return now[p.id] && !before[p.id]; })[0];
        S.focus[i] = nw ? nw.id : null; S.cache[i] = JSON.stringify(Rt); S.notes[i] = note;
      }
      S.note = S.notes[i]; S.focus = S.focus || {}; S.fid = S.focus[i]; W.S.focusId = S.fid;
      after(S); hap('selection'); draw(); flashRooms(S);
    }
    function flashRooms(S) {   // the dollhouse: light up every room this proposal changed (or every room, when it changed them all)
      if (!S || level() !== 3) return; var b0 = hostOf('room', JSON.parse(S.snap)), b1 = bldOf(); if (!b1) return;
      var old = {}; ((b0 && b0.rooms) || []).forEach(function (r) { old[r.id] = JSON.stringify(r); });
      var ch = (b1.rooms || []).filter(function (r) { return old[r.id] !== JSON.stringify(r); }).map(function (r) { return r.id; });
      [60, 400].forEach(function (t) { setTimeout(function () { ch.forEach(function (id) { [].forEach.call(document.querySelectorAll('.mn-dsp .mn-bv [data-fproom="' + id + '"]'), function (x) { x.classList.remove('wf-flash'); void x.getBoundingClientRect(); x.classList.add('wf-flash'); }); }); }, t); });
    }
    function after(S) {
      refreshLand(); if (BV) bvDraw(); render();
      if (pv) { if (pieceOf(pv.pc)) { var at = pv.at; openPiece(pv.pc); } else closePiece(); }
      if (S && S.lv <= 2) fit();
    }
    function sConfirm() {
      var S = W.S; if (!S || S.i < 0) return; W.S = null; if (S.set === 'room') { var bp = bldOf(); if (bp) bp.wfBase = 1; } save(); hap('success');
      if (S.kind === 'fill' && S.pics && window.MinestPics && !/^hub:/.test(V.bid)) { try { MinestPics.fill(V.bid, {}, { all: true }); } catch (e) {} }
      toast('✓ Confirmed — ↶ Undo brings the old one back'); after(null); draw();
    }
    function sCancel(quietly) {
      var S = W.S; if (!S) return; W.S = null; try { if (S.i >= 0 || S.kind) restoreRoot(S.snap); } catch (e) {}
      if (S.lockSave) save();   // a lock set while looking is kept (the preview is not)
      if (!quietly) toast('↶ As it was'); after(null); if (!quietly) draw();
    }
    function smartGo(sk) {   // no base yet: the base; a base: the details (Another for more)
      if (W.S && W.S.kind === 'smart' && W.S.set === sk) return sGo(W.S.i + 1);   // ✨ again while looking: the next option
      if (W.S) sCancel(true); var D = SETS[sk], b = D.hasBase();   // judged on what is really there, not on a preview
      sOpen(sk, 'smart', { tab: b ? 'detail' : 'base', asp: 'all', n: 4, title: '✨ ' + D.smart + (b ? ' · details' : ' · base') }); sGo(0);
    }
    function runGen(S, i) {
      var D = SETS[S.set], B = styFor(i), out = [], sn = styName(i);
      if (S.kind === 'fill') return gFill(i, B);
      if (D.pick && D.pick[S.kind]) return D.pick[S.kind](i, B);
      var all = D[S.tab].map(function (a) { return a[0]; }), fns = S.asp === 'all' ? [all[i % all.length]] : [S.asp];   // 🎲 Anything: each proposal another aspect
      if (S.kind === 'smart' && D.smartGen) fns = D.smartFn ? D.smartFn(S.tab) : D.smartGen[S.tab];
      fns.forEach(function (a) { var f = D.gen[a]; if (f) { var r = f(i, B); if (r) out.push(r); } });
      return (sn ? '(' + sn + ') ' : '') + out.join(' · ');
    }

    // ---------------------------------------------------------------- 1 · the island (建岛)
    function plotsBox() { var b = { i0: 1e9, j0: 1e9, i1: -1e9, j1: -1e9 }; landOf().forEach(function (k) { var c = k.split(','), i = +c[0], j = +c[1]; b.i0 = Math.min(b.i0, i); b.j0 = Math.min(b.j0, j); b.i1 = Math.max(b.i1, i); b.j1 = Math.max(b.j1, j); }); return b; }
    function gShape(i, B) {
      var n0 = landOf().length, how = i % 4, g = 0;
      if (how === 0) V.d.land = landOf().concat(candidates().add).slice(0, MAX_PLOTS);
      else if (how === 1) { while (landOf().length < n0 + Math.max(3, Math.round(n0 * .5 * ((B && B.count) || 1))) && g++ < 30 && growLand()); }
      else if (how === 2) { while (landOf().length < n0 * 2 && g++ < 40 && growLand()); }
      else { V.d.land = landOf().concat(candidates().add).slice(0, MAX_PLOTS); refreshLand(); V.d.land = landOf().concat(candidates().add).slice(0, MAX_PLOTS); }
      refreshLand(); return ['a ring of land all round', 'a longer island', 'twice the land', 'a big round island'][how] + ' (' + landOf().length + ' plots)';
    }
    function gStyleIsl(i, B) {
      var G = B && B.ground ? B.ground : ['grass', 'moss', 'sand', 'snow']; V.d.ground = G[i % G.length]; var pool = natPool(B), n = 0;
      (V.d.pc || []).forEach(function (p, ix) { if (!NAT_RE.test(p.k)) return; var k0 = p.k, nk = pool[(ix + i) % pool.length]; if (!nk || nk === k0) return; p.k = nk; if (!fits(p)) p.k = k0; else n++; });
      return V.d.ground + ' ground' + (n ? ', ' + n + ' trees & things restyled' : '');
    }
    var ISLE_GROUPS = [['Main island + 2 islets', '🏝·🏝'], ['A chain of islets', '🏝⋯'], ['Islets round the corner', '🏝◦'], ['Twin islands', '🏝🏝'], ['A cluster in front', '🏝⁘']];
    function gGroup(t, B) {
      t = t % ISLE_GROUPS.length; var b = plotsBox(), add = [], w = b.i1 - b.i0 + 1, h = b.j1 - b.j0 + 1;
      var Rc = function (i0, j0, wi, hj) { for (var i = 0; i < wi; i++) for (var j = 0; j < hj; j++) add.push((i0 + i) + ',' + (j0 + j)); };
      if (t === 0) { Rc(b.i1 + 2, b.j0, 2, 2); Rc(b.i0, b.j1 + 2, 2, 1); }
      else if (t === 1) { for (var k = 0; k < 3; k++) Rc(b.i1 + 2 + k * 2, b.j0 + k, 1, 1); }
      else if (t === 2) { Rc(b.i1 + 2, b.j0, 1, 1); Rc(b.i1 + 2, b.j1, 1, 1); Rc(b.i0, b.j1 + 2, 1, 1); Rc(b.i1, b.j1 + 2, 1, 1); Rc(b.i1 + 2, b.j1 + 2, 1, 1); }
      else if (t === 3) Rc(b.i1 + 2, b.j0, Math.min(w, 4), Math.min(h, 4));
      else { Rc(b.i0, b.j1 + 2, 1, 1); Rc(b.i0 + 2, b.j1 + 2, 2, 1); Rc(b.i0 + 1, b.j1 + 4, 1, 1); }
      var land = landOf(); V.d.land = land.concat(add.filter(function (k) { return land.indexOf(k) < 0; })).slice(0, MAX_PLOTS); refreshLand();
      if (B && B.ground) V.d.ground = B.ground[0];
      var pool = natPool(B), n = 0; add.forEach(function (k, ix) { if (ix % 2) return; var c = k.split(','); if (sbPlace(pool[ix % pool.length], c[0] * PLOT + 1.5, c[1] * PLOT + 1.5)) n++; });
      return ISLE_GROUPS[t][0] + ' (' + isles().length + ' islands, ' + n + ' trees on the new ones)';
    }
    function gDecor(i, B) { var n = scatter(natPool(B), Math.min(18, Math.round((5 + landOf().length / 4) * ((B && B.count) || 1)))); n += scatter(bias(l4('outdoor'), B && B.decor), 2); return '+' + n + ' decorations'; }
    function gDstyle(i, B) { var acc = bias(['pathway', 'fence', 'lamp', 'bench', 'flowers', 'well'].filter(okK).concat(flowers()), B && B.decor); return '+' + scatter(acc, 6) + ' detail touches'; }
    function gMove(i) { var n = 0; pickSome(MOB_KINDS.filter(okK), 2).concat(pickSome(CRITTER_KINDS.filter(okK), 2)).forEach(function (k) { if (sbPlace(k)) n++; }); return '+' + n + ' moving things'; }
    function gBlank() { V.d.land = DEF_LAND.slice(); V.d.pc = []; refreshLand(); return 'a blank island — your things wait in the Box'; }
    function isles() {   // the island's separate pieces of land: the main island first, then the subsidiary ones
      var S0 = {}, seen = {}, out = []; landOf().forEach(function (k) { S0[k] = 1; });
      Object.keys(S0).forEach(function (k0) { if (seen[k0]) return; var q = [k0], g = []; seen[k0] = 1; while (q.length) { var k = q.pop(); g.push(k); var c = k.split(','), i = +c[0], j = +c[1]; [[1, 0], [-1, 0], [0, 1], [0, -1]].forEach(function (d) { var n = (i + d[0]) + ',' + (j + d[1]); if (S0[n] && !seen[n]) { seen[n] = 1; q.push(n); } }); } out.push(g); });
      return out.sort(function (a, b) { return b.length - a.length; });
    }
    function isleFlag(g) { var on = {}; g.forEach(function (k) { on[k] = 1; }); return (islandD().pc || []).filter(function (p) { return p.k === 'y_flag' && on[plotAt(p.x, p.y)]; })[0] || null; }
    function isleTitleSet(ix, txt) {
      if (level() !== 1) return; var g = isles()[ix]; if (!g) return; txt = String(txt || '').trim();
      change(function () { var f = isleFlag(g); if (f) { f.label = txt; return; } if (!txt) return; var c = g[0].split(','), q = { id: uid(), k: 'y_flag', x: c[0] * PLOT + 1, y: c[1] * PLOT + 2, f: 0, s: 1, it: [], label: txt }; if (settle(q, q.x, q.y)) V.d.pc.push(q); else toast('No room for a flag on that island'); });
      hap('selection');
    }
    var TSTYLES = [['plain', 'Aa Plain'], ['emoji', '🏝 With an island'], ['stars', '✨ Starry'], ['caps', 'AA CAPITALS']];
    function plainT(s) { return String(s || '').replace(/^(🏝 |✨ )/, '').replace(/ ✨$/, ''); }
    function titleStyle(v) {
      change(function () { (islandD().pc || []).forEach(function (p) { if (p.k !== 'y_flag' || !p.label) return; var b = plainT(p.label); if (/^[A-Z0-9 \W]+$/.test(b) && p.wfT) b = p.wfT; p.wfT = p.wfT || b;
        p.label = v === 'emoji' ? '🏝 ' + p.wfT : v === 'stars' ? '✨ ' + p.wfT + ' ✨' : v === 'caps' ? String(p.wfT).toUpperCase() : p.wfT; }); });
      hap('selection');
    }
    // ---------------------------------------------------------------- 1 · building tools (on the island)
    function gBuildings(i) { var w = SB_WAYS.island[i % 4], plan = makePlan(w.mode); if (!plan.groups.length) return 'nothing in the Box to build for'; plan.mode = 'build'; sbAlt(w.alt, function () { buildApply(plan); }); roApply({ lv: 'island' }, w.lay); return w.n; }
    function gLayout(i) { var w = RO_WAYS.island[i % 4]; roApply({ lv: 'island' }, w[0]); return w[1] + ' — ' + w[2]; }
    function gExterior(i) {
      var n = 0; (V.d.pc || []).filter(isBld).forEach(function (b, ix) { var st = []; try { st = roStyles({ lv: 'building', p: b }); } catch (e) {}
        if (OUTSIDES.some(function (o) { return o[0] === b.k; })) st = OUTSIDES.filter(function (o) { return o[0] !== b.k && okK(o[0]); }).map(function (o) { return { go: function () { b.k = o[0]; } }; }).concat(st);
        var s = st[(i + ix) % Math.max(1, st.length)]; if (s) { var d0 = V.d; try { s.go(); n++; } finally { V.d = d0; } } });
      return n ? n + ' building' + (n === 1 ? '' : 's') + ' with another outside' : 'no buildings yet';
    }
    function gYard(i, B) { var yard = KIT_PIECES.filter(function (v) { return v[3] === 'yard'; }).map(function (v) { return v[0]; }).filter(okK), pool = bias(yard, B && B.decor).concat(natPool(B).slice(0, 4)), n = 0;
      (V.d.pc || []).filter(isBld).forEach(function (b) { n += scatter(pool, 2, [b.x + 2, b.y + 2]); }); return '+' + n + ' yard pieces'; }
    function finishFor(i, B, ix) { var F = B && B.finish ? B.finish : [0, 1, 2, 3, 4]; return RO_FINISH[F[(i + (ix || 0)) % F.length]]; }
    function gMaterials(i, B) { var n = 0; (V.d.pc || []).filter(isBld).forEach(function (b) { (b.rooms || []).forEach(function (r, ix) { var d = roomD(r), f = finishFor(i, B, ix); d.floor = f[0]; d.wall = f[1]; n++; }); }); return n ? n + ' rooms: ' + finishFor(i, B, 0)[2] : 'no rooms yet'; }
    // ---------------------------------------------------------------- 2 · the building: room tools (建房)
    function roomThings(r) { var n = 0; (r.d && r.d.pc || []).forEach(function (q) { n += (q.it || []).filter(thing).length; }); return n; }
    function topFl(p) { return (p.rooms || []).reduce(function (m, r) { return Math.max(m, r.fl || 1); }, 1); }
    function gRoomSet(i, B) {
      var p = bldOf(); if (!p) return ''; var keep = (p.rooms || []).filter(roomThings), have = keep.map(function (r) { return r.k; });
      var sets = [suggestRooms(p), (B && B.rooms) || ['living', 'study', 'bedroom'], (ROOMS_FOR[(i * 3) % ROOMS_FOR.length] || [])[1] || ['hall'], pickSome(ROOM_ORDER, 4), suggestRooms(p).slice(0, 2).concat(pickSome((B && B.rooms) || ROOM_ORDER, 2))];
      var ks = sets[i % sets.length].filter(function (k, j, a) { return ROOMS[k] && a.indexOf(k) === j && have.indexOf(k) < 0; }).slice(0, 6);
      p.rooms = keep.slice(); p.roomsInit = 1; p.roomOrder = 1;
      ks.forEach(function (k, j) { var r = { id: 'r' + uid().slice(1), k: k, n: ROOMS[k][0], fl: keep.length + j >= 4 ? 2 : 1 }; roomD(r); placeIn(p, r, r.fl, 1e9); });
      p.floors = topFl(p); p.viewFl = 1;
      return ks.length + ' rooms: ' + ks.map(function (k) { return ROOMS[k][0]; }).join(', ') + (keep.length ? ' (' + keep.length + ' with your things kept)' : '');
    }
    function gHome(i) {   // a home template, without saving (the 53.7 template's own logic)
      var p = bldOf(), H = HOMES[i % HOMES.length]; if (!p) return '';
      var kept = (p.rooms || []).filter(roomThings), have = {}; kept.forEach(function (r) { have[r.k] = (have[r.k] || 0) + 1; }); p.rooms = kept.slice(); p.roomsInit = 1; p.roomOrder = 1; var cnt = {}, made = 0;
      H[3].forEach(function (x) { cnt[x[0]] = (cnt[x[0]] || 0) + 1; if (cnt[x[0]] <= (have[x[0]] || 0)) return; var T = ROOMS[x[0]] || ROOMS.hall, same = (p.rooms || []).filter(function (r) { return r.k === x[0]; }).length;
        var r = /^sr:/.test(x[0]) ? srMake(x[0].slice(3), x[1]) : { id: 'r' + uid().slice(1), k: x[0], n: T[0] + (same ? ' ' + (same + 1) : ''), fl: x[1] }; if (!r) return; roomD(r); placeIn(p, r, x[1], 1e9); made++; });
      p.floors = topFl(p); p.viewFl = 1; if (BV) BV.sel = null;
      return H[2] + ' ' + H[1] + ': ' + made + ' rooms on ' + p.floors + ' floor' + (p.floors === 1 ? '' : 's');
    }
    function eachRoom(fn) { var p = bldOf(), n = 0; (p && p.rooms || []).forEach(function (r, ix) { var d = roomD(r); withD(d, function () { n += fn(r, d, ix) || 0; }); }); return n; }
    function gRoomStyle(i, B) { var n = eachRoom(function (r, d, ix) { var f = finishFor(i, B, ix); d.floor = f[0]; d.wall = f[1]; return 1; }); return n + ' rooms: ' + finishFor(i, B, 0)[2]; }
    function gRoomDecor(i, B) { return '+' + eachRoom(function () { return scatter(bias(['f_plant', 'f_lamp', 'f_rug'].filter(okK).concat(l4('indoor')), B && B.indoor), 2); }) + ' decorations'; }
    function gRoomFurn() { return '+' + eachRoom(function (r, d) { return placeAll((FURNISH[r.k] || []).filter(function (k) { return okK(k) && !d.pc.some(function (q) { return q.k === k; }); })); }) + ' furniture'; }
    function gArea(i) { return eachRoom(function (r, d, ix) { return (ix + i) % 2 ? 0 : growLand() ? 1 : 0; }) + ' rooms made bigger'; }
    function blankRoom() {
      var p = bldOf(); if (!p) return; var fl = p.viewFl || 1, r = { id: 'r' + uid().slice(1), k: 'hall', n: 'New room', fl: fl, seeded: 1, d: { scene: 'room', rot: 0, pc: [], land: DEF_LAND.slice(), floor: 'oak', wall: 'plaster' } };
      placeIn(p, r, fl, 1e9); p.roomsInit = 1; p.floors = Math.max(p.floors || 1, fl); if (BV) BV.sel = r.id; save(); bvDraw(); hap('light'); toast('A blank room on ' + fl + 'F — double-tap it to go in'); draw();
    }
    function selRoom() { var p = bldOf(); return p && BV && (p.rooms || []).filter(function (r) { return r.id === BV.sel; })[0]; }
    function fake(attr, val) { return { target: { hasAttribute: function (a) { return a === attr; }, value: val } }; }
    function roomType(k) { if (!selRoom()) { var b = bldOf(); bvFloors.addAt(k, (b && b.viewFl) || 1); return draw(); } BV.armed = 1; bvInput(fake('data-bvtype', k)); draw(); }
    function roomTitle(v) { if (!selRoom()) return; bvInput(fake('data-bvname', v)); draw(); }
    function roomFinish(i) { var r = selRoom(), f = RO_FINISH[i]; if (!f) return; var L = r ? [r] : (bldOf().rooms || []); L.forEach(function (x) { var d = roomD(x); d.floor = f[0]; d.wall = f[1]; }); save(); bvDraw(); hap('selection'); draw(); }
    // ---------------------------------------------------------------- 3 · the room: display tools (陈列)
    var DTRIOS = (function () { var seen = {}, out = []; ROOM_ORDER.forEach(function (k) { var t = ROOMS[k] && ROOMS[k][2]; if (!t || !t.length) return; var key = t.join(','); if (seen[key]) return; seen[key] = 1; out.push([ROOMS[k][1] + ' ' + ROOMS[k][0] + ' set', t]); }); return out; })();
    function gShelf(i, B) {
      var w = SB_WAYS.room[i % 4], plan = makePlan(w.mode === 'list' ? 'list' : 'smart'); if (!plan.groups.length) return gTrio(i, B);
      plan.groups.forEach(function (g, k) { if (w.alt) { var alt = bias(SB_ALTK.filter(function (x) { return x !== g.k && okK(x); }), B && B.disp); g.k = alt[k % alt.length]; } });
      plan.mode = w.mode === 'list' ? 'list' : 'smart'; applyPlan(plan); roApply({ lv: 'room' }, w.lay); return w.n;
    }
    function gTrio(i, B) { var list = DTRIOS.filter(function (t) { return !(B && B.disp) || t[1].some(function (k) { return B.disp.test(k); }); }); if (!list.length) list = DTRIOS; var t = list[i % list.length], n = 0; t[1].forEach(function (k) { if (okK(k) && sbPlace(k)) n++; }); return t[0] + ' (+' + n + ' displays)'; }
    function gDispStyle(i) { var n = 0; (V.d.pc || []).filter(function (p) { return cDisp(p) && (p.it || []).length; }).forEach(function (p, ix) { var st = []; try { st = roStyles({ lv: 'fixture', p: p }); } catch (e) {} var s = st[(i + ix) % Math.max(1, st.length)]; if (s) { s.go(); n++; } }); return n ? n + ' displays of another kind' : 'no displays with things yet'; }
    function gDispDecor(i, B) { var r = roomOf(); return '+' + scatter(bias(((r && FURNISH[r.k]) || []).concat(['f_plant', 'f_rug']).filter(okK).concat(l4('indoor')), B && B.indoor), 3) + ' decorations'; }
    function lightKinds() { return Object.keys(K).filter(function (k) { return /lamp|lantern|light|candle|chandel/i.test(k) && okK(k) && !isOutdoor(k); }); }
    function gLight(i) { var L = lightKinds(), D = (V.d.pc || []).filter(cDisp), n = 0; D.slice(0, 3).forEach(function (p, ix) { var k = L[(i + ix) % Math.max(1, L.length)]; if (k && sbPlace(k, p.x + 1, p.y + 1)) n++; }); if (!D.length) n = scatter(L, 2); return '+' + n + ' lights by the displays'; }
    function gMaterial(i, B) { var f = finishFor(i, B, 0); V.d.floor = f[0]; V.d.wall = f[1]; return f[2] + ' floor & walls'; }
    function dispKind(k) {
      var p = V.sel && V.sel.pc && pieceOf(V.sel.pc);
      if (p && cDisp(p)) { change(function () { var n = (p.it || []).length; p.k = k; p.s = 1; while (capOf(p) < n && p.s < 2.5) p.s = Math.round((p.s + .25) * 100) / 100; if (!fits(p)) settle(p, p.x, p.y); }); hap('selection'); return draw(); }
      editOn(); if (DUO_API) DUO_API.placeKind(k); W.panel.disp = 'edit'; draw();
    }
    function blankBld() { editOn(); if (!DUO_API) return; DUO_API.placeKind('house'); var q = V.sel && V.sel.pc && pieceOf(V.sel.pc); if (q && isBld(q)) { q.rooms = []; q.roomsInit = 1; save(); } W.panel.bld = 'edit'; toast('A blank building — double-tap it to go in, then add rooms'); draw(); }
    // ---------------------------------------------------------------- 4 · the display fixture (摆放)
    function gItems(i) {
      var p = pvPiece(); if (!p) return ''; index(); var on = placed(), home = mainList(p), suitK = function (r) { var t = thing(r); return t && suitFor(t.k.title, t.col && t.col.title, V.bid) === p.k; };
      var free = Object.keys(IX).filter(function (r) { return !on[r] && !/^v\//.test(r); }), rank = function (r) { return home && r.split('/')[0] === home ? 0 : suitK(r) ? 1 : 2; };
      free.sort(function (a, b) { return rank(a) - rank(b) || String(thing(a).s.title).localeCompare(String(thing(b).s.title)); }); if (i % 2 && home) free = free.filter(function (r) { return rank(r) === 0; });
      var added = 0; for (var k = 0; k < free.length && added < 24; k++) { if (!putOnPiece(p, free[k])) break; added++; }
      return added ? added + ' from the bag' : 'nothing new from the bag';
    }
    function gPKind(i) { var p = pvPiece(), st = []; try { st = roStyles({ lv: 'fixture', p: p }); } catch (e) {} var s = st[i % Math.max(1, st.length)]; if (!s) return ''; s.go(); return 'as a ' + String(s.n).toLowerCase(); }
    function gOrder(i) { var p = pvPiece(); if (!p || !(p.it || []).length) return ''; var w = ['name', 'list', 'reverse', 'shuffle'][i % 4]; roApply({ lv: 'fixture', p: p }, w); return { name: 'A → Z', list: 'by list', reverse: 'the other way round', shuffle: 'a fresh mix' }[w]; }
    // ---------------------------------------------------------------- 🪄 Smart Fill: Island → Building → Room → Display Fixture → Item
    function gFill(i, B) {
      var R0 = islandD(), n = { b: 0, r: 0, t: 0, d: 0 }; index(); var before = Object.keys(placed()).length;
      withD(R0, function () {
        if (!(R0.pc || []).some(isBld)) { var plan = makePlan('build'); if (plan.groups.length) { plan.mode = 'build'; buildApply(plan); n.b = (R0.pc || []).filter(isBld).length; } }
        (R0.pc || []).filter(isBld).forEach(function (b) { if ((b.rooms || []).length) return; b.roomsInit = 1; b.rooms = suggestRooms(b).slice(0, 3 + (i % 2)).filter(function (k) { return ROOMS[k]; }).map(function (k) { return { id: 'r' + uid().slice(1), k: k, n: ROOMS[k][0], fl: 1 }; }); b.rooms.forEach(roomD); n.r += b.rooms.length; });
        if ((R0.pc || []).filter(function (p) { return cDecor(p) && !cMob(p); }).length < 4) n.d = scatter(natPool(B), 6);
      });
      index(); var on = placed(), free = Object.keys(IX).filter(function (r) { return !on[r] && !/^v\//.test(r); });   // the Box → free places on the displays in the rooms
      (R0.pc || []).filter(isBld).forEach(function (b) { (b.rooms || []).forEach(function (r) { var d = roomD(r); withD(d, function () { (d.pc || []).filter(cDisp).forEach(function (p) {
        if (!free.length) return; var want = free.filter(function (x) { var t = thing(x); return t && suitFor(t.k.title, t.col && t.col.title, V.bid) === p.k; }); if (!want.length && i % 2 === 0) want = free.slice();
        want.slice(0, Math.max(0, capOf(p) - (p.it || []).filter(thing).length)).forEach(function (x) { if (putOnPiece(p, x)) { free.splice(free.indexOf(x), 1); n.t++; } }); }); }); }); });
      index(); var nopic = Object.keys(placed()).filter(function (r) { var t = thing(r); return t && !picOf(t.s); }).length; if (W.S) W.S.pics = nopic;
      return [n.b ? 'Island: ' + n.b + ' buildings' : 'Island: buildings kept', n.r ? 'Building: +' + n.r + ' rooms' : 'Building: rooms kept', 'Room/Display: ' + (Object.keys(placed()).length - before) + ' things set out', n.d ? '+' + n.d + ' decor' : '', 'Item: ' + (nopic ? nopic + ' pictures to find on Confirm' : 'pictures all there')].filter(Boolean).join(' · ');
    }

    // ---------------------------------------------------------------- 4 · this room (Room tools) and 5 · round the open fixture (Display tools)
    function KITS4() { var B = styFor(0), L = ROOM_ORDER.filter(function (k) { return ROOMS[k] && ROOMS[k][2] && ROOMS[k][2].length; }); return W.style && W.style !== 'surprise' ? bias(L, new RegExp('^(' + B.rooms.join('|') + ')$')).concat(L.filter(function (k) { return B.rooms.indexOf(k) < 0; })) : L; }
    function gRoomKit(i) { var r = roomOf(), L = KITS4(), k = L[i % L.length]; if (!k) return ''; var n = placeAll((FURNISH[k] || []).concat(ROOMS[k][2]).filter(okK)); return ROOMS[k][1] + ' ' + ROOMS[k][0] + ' set (+' + n + ')'; }
    function gRoomKind(i, B) { var r = roomOf(); if (!r) return ''; var L = bias(ROOM_ORDER.filter(function (k) { return ROOMS[k] && k !== r.k; }), B && B.rooms && new RegExp('^(' + B.rooms.join('|') + ')$')), k = L[i % L.length], T = ROOMS[k], old = ROOMS[r.k] || ROOMS.hall;
      if (!r.n || r.n === old[0]) r.n = T[0]; r.k = k; V.d.floor = T[3]; V.d.wall = T[4]; var n = placeAll((FURNISH[k] || []).concat(T[2]).filter(function (x) { return okK(x) && !V.d.pc.some(function (q) { return q.k === x; }); })); return 'a ' + T[0].toLowerCase() + ' (+' + n + ')'; }
    function gArea4(i) { var n = 0; if (W.S && W.S.kind === 'smart' && i % 2 === 0) return ''; for (var t = 0; t < 1 + (i % 2); t++) if (growLand()) n++; return n ? 'bigger: ' + landOf().length + ' plots' : 'as big as it gets'; }
    function gFurn4(i, B) { var r = roomOf(), want = ((r && FURNISH[r.k]) || []).filter(function (k) { return okK(k) && !V.d.pc.some(function (q) { return q.k === k; }); }); var n = placeAll(want) + scatter(bias(['f_armchair', 'f_plant', 'f_lamp', 'f_rug', 'f_table'].filter(okK), B && B.indoor), 1); return '+' + n + ' furniture'; }
    function nearFx() { var p = pvPiece(); return p ? [p.x + 1.5, p.y + 1.5] : null; }
    function gTrioNear(i) { var t = DTRIOS[i % DTRIOS.length], c = nearFx(), n = 0; t[1].forEach(function (k) { if (okK(k) && sbPlace(k, c && c[0], c && c[1])) n++; }); return t[0] + ' round it (+' + n + ')'; }
    function gDecorNear(i, B) { var r = roomOf(), pool = r ? bias(((FURNISH[r.k]) || []).concat(['f_plant', 'f_rug']).filter(okK).concat(l4('indoor')), B && B.indoor) : natPool(B); return '+' + scatter(pool, 2, nearFx()) + ' decorations round it'; }
    function gLightNear(i) { var L = roomOf() ? lightKinds() : ['lamp'].filter(okK), c = nearFx(), n = 0; for (var t = 0; t < 2; t++) { var k = L[(i + t) % Math.max(1, L.length)]; if (k && sbPlace(k, c && c[0], c && c[1])) n++; } return '+' + n + ' lights by it'; }
    function shelfNear() { var p = pvPiece(); if (!p) return; var q = null; change(function () { q = add('shelf', p.x + 2, p.y); }); if (q) { hap('success'); toast('A new shelf beside “' + nm(p) + '” — ‹ Back to the room to move it'); } }
    function roomKind4(k) { var r = roomOf(), T = ROOMS[k]; if (!r || !T) return; change(function () { var old = ROOMS[r.k] || ROOMS.hall; if (!r.n || r.n === old[0]) r.n = T[0]; r.k = k; V.d.floor = T[3]; V.d.wall = T[4]; }); hap('selection'); draw(); }
    function roomFinish4(i) { var f = RO_FINISH[i]; if (!f) return; change(function () { V.d.floor = f[0]; V.d.wall = f[1]; }); hap('selection'); draw(); }
    function roomTitle4(v) { var r = roomOf(); if (!r) return; v = String(v || '').trim(); if (!v) return; change(function () { r.n = v; }); draw(); }

    // ---------------------------------------------------------------- 3 · dollhouse layouts and styles (Room Group / Room Gallery / Smart Room / Suggest · Base)
    // rooms: [kind, floor, size (the plan's share), name]; exterior: one of the 53.7 outsides (only for buildings that are one of them); palette: PALETTES index
    var LAYOUTS = [
      ['duo', '1 floor · 2 rooms', '▭', [['living', 1, 1.4], ['kitchen', 1, 1]], 'house', 0],
      ['square', '2 × 2 house', '⊞', [['living', 1, 1], ['kitchen', 1, 1], ['bedroom', 2, 1], ['study', 2, 1]], 'house', 0],
      ['tower', '3 floors stacked', '▤', [['living', 1, 1], ['study', 2, 1], ['bedroom', 3, 1]], 'lighthouse', 2],
      ['lshape', 'L-shape', '⌐', [['living', 1, 2.2], ['kitchen', 1, .9], ['dining', 1, .9]], 'house', 0],
      ['atrium', 'Tall atrium + side rooms', '⧈', [['hall', 1, 2.6, 'Atrium'], ['gallery', 1, .8], ['study', 1, .8], ['hall', 2, 2.6, 'Atrium gallery'], ['reading', 2, 1]], 'c_church', 1],
      ['split', 'Split-level', '⫽', [['garage', 1, 1], ['living', 1, 1.6], ['bedroom', 2, 1.3], ['study', 3, .6, 'Half-landing study']], 'c_town', 3],
      ['wing', 'Gallery wing', '⊏', [['gallery', 1, 2], ['gallery', 1, 1, 'East gallery'], ['memory', 1, 1], ['trophy', 2, 1]], 'c_church', 1],
      ['attic', 'Cottage with attic', '⌂', [['living', 1, 1.2], ['kitchen', 1, 1], ['bath', 1, .6], ['bedroom', 2, 1, 'Attic bedroom']], 'cabin', 3],
      ['museum', 'Museum hall + side galleries', '🏛', [['hall', 1, 2.2, 'Great hall'], ['sr:art', 1], ['sr:natural', 1], ['sr:library', 2], ['sr:fame', 2]], 'c_church', 1],
      ['shop', 'Shop-front + backroom', '🛍', [['shop', 1, 2, 'Shop front'], ['storage', 1, .6, 'Backroom'], ['living', 2, 1, 'Flat upstairs']], 'c_town', 0],
      ['loft', 'Workshop loft', '🔧', [['workshop', 1, 2], ['bedroom', 2, 1], ['music', 2, 1]], 'barn', 4],
      ['library', 'Library tower', '📚', [['reading', 1, 1.4], ['study', 2, 1], ['memory', 3, 1]], 'lighthouse', 2],
      ['family', 'Family house', '🏠', [['living', 1, 1], ['kitchen', 1, 1], ['dining', 1, 1], ['garage', 1, 1], ['bath', 1, .6], ['bedroom', 2, 1], ['bedroom', 2, 1], ['games', 2, 1], ['bath', 2, .6], ['study', 2, 1]], 'house', 5],
      ['villa', 'Villa', '🏰', [['living', 1, 1.4], ['dining', 1, 1], ['kitchen', 1, 1], ['music', 1, 1], ['garden', 1, 1], ['bedroom', 2, 1], ['bath', 2, .6], ['study', 2, 1], ['gallery', 2, 1], ['games', 3, 1], ['dreams', 3, 1]], 'fcastle', 6],
      ['flat', 'Studio flat', '🛋', [['living', 1, 1.6], ['kitchen', 1, .8], ['bedroom', 1, 1], ['bath', 1, .6]], 'c_apartment', 1],
      ['words', 'Word library & knowledge hall', '📚', [['reading', 1, 1.8, 'Word library'], ['study', 1, 1, 'Knowledge hall'], ['classroom', 2, 1.2, 'Review room'], ['memory', 2, .8, 'Concept gallery']], 'c_church', 2]];
    var LAY_FOR = { natural: ['attic', 'lshape', 'loft', 'square'], cozy: ['attic', 'square', 'duo', 'family'], modern: ['split', 'shop', 'flat', 'loft'], museum: ['museum', 'wing', 'atrium', 'library'], fantasy: ['tower', 'villa', 'atrium', 'library'], minimal: ['duo', 'flat', 'tower', 'lshape'] };
    var PALETTES = [['🪵 Warm oak', 0], ['🤍 Bright gallery', 1], ['🏰 Old library', 2], ['🌙 Dark & cosy', 3], ['🪨 Stone hall', 4], ['🎨 Each room its own', -1], ['🌗 Light below, dark above', -2]];
    function paint(p, pi) {
      var P0 = PALETTES[pi % PALETTES.length], n = 0;
      (p.rooms || []).forEach(function (r) { var d = roomD(r), T = ROOMS[r.k] || ROOMS.hall, f = P0[1] >= 0 ? RO_FINISH[P0[1]] : P0[1] === -1 ? [T[3], T[4]] : RO_FINISH[(r.fl || 1) > 1 ? 3 : 1]; d.floor = f[0]; d.wall = f[1]; n++; });
      return P0[0] + ' (' + n + ' rooms)';
    }
    function layIndex(i, B) { if (!B) return i % LAYOUTS.length; var k = Object.keys(BIAS).filter(function (x) { return BIAS[x] === B; })[0], L = LAY_FOR[k] || []; var ix = L.length ? LAYOUTS.map(function (l) { return l[0]; }).indexOf(L[i % L.length]) : -1; return ix >= 0 ? ix : i % LAYOUTS.length; }
    function gLayout3(i, B) {
      var p = bldOf(); if (!p) return ''; var Lt = LAYOUTS[layIndex(i, B)], keep = (p.rooms || []).filter(roomThings), have = {}, made = 0, cnt = {};
      keep.forEach(function (r) { have[r.k] = (have[r.k] || 0) + 1; }); p.rooms = keep.slice(); p.roomsInit = 1; p.roomOrder = 1;
      Lt[3].forEach(function (x) { cnt[x[0]] = (cnt[x[0]] || 0) + 1; if (cnt[x[0]] <= (have[x[0]] || 0)) return; var T = ROOMS[x[0]] || ROOMS.hall;
        var r = /^sr:/.test(x[0]) ? srMake(x[0].slice(3), x[1]) : { id: 'r' + uid().slice(1), k: x[0], n: x[3] || T[0], fl: x[1] }; if (!r) return; if (x[2]) r.sz = x[2]; roomD(r); placeIn(p, r, x[1], 1e9); made++; });
      p.floors = topFl(p); p.viewFl = 1; if (BV) BV.sel = null;
      if (OUTSIDES.some(function (o) { return o[0] === p.k; }) && okK(Lt[4])) p.k = Lt[4];
      var pal = paint(p, Lt[5]);
      return Lt[2] + ' ' + Lt[1] + ': ' + made + ' rooms on ' + p.floors + ' floor' + (p.floors === 1 ? '' : 's') + ' · ' + pal + (keep.length ? ' · ' + keep.length + ' room' + (keep.length === 1 ? '' : 's') + ' with your things kept' : '');
    }
    function gRoomsDetail(i, B) {   // ✨ Smart Room with rooms there: each room furnished, decorated, a new floor & wall palette, the fuller rooms bigger
      var p = bldOf(); if (!p) return ''; var cur = {}, f = 0, d = 0, g = 0;
      (p.rooms || []).forEach(function (r) { var dd = roomD(r); cur[dd.floor + '/' + dd.wall] = (cur[dd.floor + '/' + dd.wall] || 0) + 1; });
      var F = B && B.finish ? B.finish : [0, 1, 2, 3, 4], pi = F[i % F.length], tries = 0; while (cur[RO_FINISH[pi][0] + '/' + RO_FINISH[pi][1]] === (p.rooms || []).length && tries++ < 5) pi = (pi + 1) % 5;
      var pal = paint(p, i % 3 === 2 ? 5 : pi);
      eachRoom(function (r, dd) {
        var want = (FURNISH[r.k] || []).concat(((ROOMS[r.k] || ROOMS.hall)[2]) || []).filter(function (k) { return okK(k) && !dd.pc.some(function (q) { return q.k === k; }); });
        f += placeAll(want); d += scatter(bias(['f_plant', 'f_lamp', 'f_rug'].filter(okK).concat(l4('indoor')), B && B.indoor), 2);
        return 0; });
      (p.rooms || []).forEach(function (r) { var n = roomThings(r); if (n > 0 || i % 2) { var s0 = r.sz || 1, s1 = Math.min(2.2, Math.round((s0 + (n > 6 ? .5 : .25)) * 100) / 100); if (s1 !== s0) { r.sz = s1; g++; } } });
      if (g) p.roomOrder = 1;
      return pal + ' · +' + f + ' furniture & displays · +' + d + ' decorations' + (g ? ' · ' + g + ' room' + (g === 1 ? '' : 's') + ' bigger' : '');
    }
    function gPalette(i, B) { var p = bldOf(); if (!p) return ''; var pi = B && B.finish ? B.finish[i % B.finish.length] : i % PALETTES.length; return paint(p, pi); }
    function outsideSet(k) { var p = bldOf(); if (!p || !okK(k)) return; change(function () { p.k = k; }); if (BV) bvDraw(); hap('selection'); draw(); }

    // ---------------------------------------------------------------- Studio's assets (MinestAssets3D): pictures, groups by theme, placed where they fit
    function AS() { return window.MinestAssets3D || null; }
    function art(id, sz) { sz = sz || 112; var u = a3Url(id, 0); return u ? '<img class="ic" alt="" src="' + esc(u) + '" width="' + sz + '" height="' + sz + '" style="object-fit:contain">' : '<span class="ic mn-a3wait" data-a3="' + esc(id) + '" style="width:' + sz + 'px;height:' + sz + 'px"></span>'; }
    function themeOf(a) { return String(a.categoryName || a.category || (a.subcategories || [])[0] || 'More').replace(/[_-]/g, ' '); }
    function studioGrid(key, list, attr, prefix, on) {   // chips by theme, then a page of pictures (24 at a time: they are drawn one by one)
      if (!list || !list.length) return '<p class="duo-lib-m">' + (AS() ? 'Nothing here.' : 'Bringing Studio’s library…') + '</p>';
      var G = {}, order = []; list.forEach(function (a) { var t = themeOf(a); if (!G[t]) { G[t] = []; order.push(t); } G[t].push(a); });
      var gi = Math.min(W.grp[key] || 0, order.length - 1), pg = W.grp[key + ':p'] || 0, items = G[order[gi]], show = items.slice(pg * 24, pg * 24 + 24);
      return '<div class="duo-lib-chips" data-lib="' + key + '">' + order.map(function (t, i) { return '<button type="button" data-wfgrp="' + i + '"' + (i === gi ? ' class="on"' : '') + '>' + esc(t) + ' · ' + G[t].length + '</button>'; }).join('') + '</div>' +
        '<div class="duo-lib-grid">' + show.map(function (a) { return '<button type="button" class="mn-pk-card' + (on === a.id ? ' on' : '') + '" ' + attr + '="' + esc(prefix + a.id) + '" title="' + esc(a.name) + '"><b class="nm">' + esc(a.name) + '</b><span class="pic">' + art(a.id) + '</span></button>'; }).join('') + '</div>' +
        (items.length > 24 ? '<div class="wf-car big" data-lib="' + key + '"><button type="button" data-wfpg="-1"' + (pg ? '' : ' disabled') + '>‹ Previous</button><span>' + (pg + 1) + '/' + Math.ceil(items.length / 24) + '</span><button type="button" data-wfpg="1"' + ((pg + 1) * 24 < items.length ? '' : ' disabled') + '>Next ›</button></div>' : '');
    }
    function studioList(kind) {
      var A0 = AS(); if (!A0) { try { a3().then(function () { W.key = ''; soon(); }); } catch (e) {} return []; }
      var C = A0.catalog || {}, L = A0.lib4 || { objects: {} }, inf = function (ids) { return (ids || []).map(function (id) { var x = A0.info(id); return x ? Object.assign({ id: id }, x) : null; }).filter(Boolean); };
      if (kind === 'world') return C.world || [];
      if (kind === 'sub') return C.subisland || [];
      if (kind === 'bld') return C.building || [];
      if (kind === 'out') return inf((L.objects.outdoor || []).concat(L.objects.expo || []));
      if (kind === 'in') return inf((L.objects.indoor || []).concat(L.objects.decor || [], L.objects.museum || []));
      if (kind === 'obj') { var l4 = {}; Object.keys(L.objects || {}).forEach(function (g) { L.objects[g].forEach(function (id) { l4[id] = 1; }); }); return (C.object || []).filter(function (a) { return !l4[a.id]; }); }
      if (kind === 'scene') return inf((L.museumRooms || []).concat(L.expoSets || [])).concat(C.diorama || []).filter(function (a, i, arr) { return arr.map(function (x) { return x.id; }).indexOf(a.id) === i; });
      return [];
    }
    function decorPicker(indoorOnly) {   // ＋ Decor: Studio's objects and scenes, placed in a free spot facing you (then ✎ to move)
      var tabs = indoorOnly ? [['in', '🪴 Indoor & museum'], ['obj', '📦 Classic objects'], ['scene', '🖼 Studio scenes']] : [['out', '🌳 Outdoor & expo'], ['obj', '📦 Classic objects'], ['scene', '🖼 Studio scenes']];
      var t = W.dtab && tabs.some(function (x) { return x[0] === W.dtab; }) ? W.dtab : tabs[0][0];
      return '<h4>＋ Decor from Studio</h4><div class="wf-seg sm">' + tabs.map(function (x) { return '<button type="button" data-wfdtab="' + x[0] + '"' + (x[0] === t ? ' class="on"' : '') + '>' + x[1] + '</button>'; }).join('') + '</div>' +
        studioGrid('d' + t, studioList(t), 'data-pkkind', t === 'scene' ? 'dio:' : 'obj:');
    }
    // main island and subsidiary islands: their looks are the Universe's own skins (uv:skin:w:<board> · uv:skin:c:<board>:<area>, synced side data)
    function skinGet(key) { try { return KN() && KN().get(key); } catch (e) { return null; } }
    function skinSet(key, id) { var prev = skinGet(key) || null; W.skinUndo = W.skinUndo || []; W.skinUndo.push([key, prev]); try { KN().set(key, id || null, true); if (window.MinestUniverse && MinestUniverse.refresh) MinestUniverse.refresh(); } catch (e) { toast('✗ That could not be saved'); } }
    function skinUndo() { var u = W.skinUndo || [], n = 0; while (u.length) { var x = u.pop(); try { KN().set(x[0], x[1], true); n++; } catch (e) {} } try { MinestUniverse.refresh(); } catch (e) {} toast(n ? '↶ The island looks are back as they were' : 'Nothing to undo'); draw(); }
    function realCols() { var b = board(V.bid); return (b && b.columns || []).filter(function (c) { return c && c.id && !isHead(c.id); }); }
    function boardTitle(t, colId) {   // a title through the board's own update
      t = String(t || '').trim(); if (!t || /^hub:/.test(V.bid)) return;
      try { A().updateBoard(V.bid, function (bd) { return colId ? Object.assign({}, bd, { columns: (bd.columns || []).map(function (c) { return c.id === colId ? Object.assign({}, c, { title: t }) : c; }) }) : Object.assign({}, bd, { title: t }); }); hap('selection'); } catch (e) { toast('✗ That could not be saved'); }
      setTimeout(function () { W.key = ''; soon(); }, 300);
    }
    function groupStyle(theme) {   // ② a coordinated look: the main island and every area from one Studio theme
      var W0 = studioList('world'), S0 = studioList('sub'), word = String(theme).split(/[ &,]+/)[0].toLowerCase(), m = function (a) { return themeOf(a) === theme || themeOf(a).toLowerCase().indexOf(word) >= 0; }, w = W0.filter(m), s = S0.filter(m);
      if (!w.length) w = W0; if (!s.length) s = S0; if (!w.length) return;
      W.skinUndo = []; skinSet('uv:skin:w:' + V.bid, w[0].id); realCols().forEach(function (c, i) { if (s.length) skinSet('uv:skin:c:' + V.bid + ':' + c.id, s[i % s.length].id); });
      toast('🏝 ' + theme + ': the main island and ' + realCols().length + ' subsidiary islands — ↶ Undo in Island Group'); draw();
    }

    // ---------------------------------------------------------------- 📚 words (world_vocab.js): forms, the vocabulary room
    function formChips(p, ref) {   // the 12 forms (and the Word Tile): for every word on a display, or for one word (the Item level)
      var t = ref && thing(ref), w = t ? String(t.s.title || '') : 'Word', cur = VOCAB.formOf(p, ref);
      return '<h4>' + (ref ? 'This word’s form' : 'Every word’s form') + '</h4><div class="wf-forms">' + VOCAB.forms.map(function (f) { return '<button type="button" data-wfform="' + f[0] + '"' + (ref ? ' data-wfref="' + esc(ref) + '"' : '') + (f[0] === cur ? ' class="on"' : '') + ' title="' + esc(f[1]) + '">' + VOCAB.preview(w, f[0]) + '<small>' + esc(f[1]) + '</small></button>'; }).join('') + '</div>';
    }
    function formSet(form, ref) { var p = pvPiece(); if (!p) return; change(function () { VOCAB.setForm(p, form, ref || null); }); hap('selection'); reopen(ref || pvRef()); }
    function vocabKind(k) { var p = pvPiece(); if (!p || !K[k]) return; change(function () { var n = (p.it || []).filter(thing).length; p.k = k; p.wf = null; p.s = p.s || 1; while (capOf(p) < n && p.s < 2.5) p.s = Math.round((p.s + .25) * 100) / 100; if (!fits(p)) settle(p, p.x, p.y); }); hap('selection'); reopen(null); }
    function gVocabRoom(i) {   // 📚 a vocabulary room: word wall, library, cabinet and flashcard table — the biggest list on them
      var n = 0, made = []; ['wwall', 'wlib', 'wcab', 'wtable'].forEach(function (k) { var q = okK(k) && sbPlace(k); if (q) { made.push(q); n++; } });
      var g = VOCAB.bigList(true) || VOCAB.bigList(false), put = 0; if (g && made.length) { var left = g.refs.slice(), q0 = made[i % made.length]; left.forEach(function (r) { if (putOnPiece(q0, r)) put++; }); q0.label = String(g.L.k.title || ''); }
      return '📚 Vocabulary room: ' + n + ' word displays' + (put ? ' · ' + put + ' words on the ' + K[made[i % made.length].k].n.toLowerCase() : '');
    }
    // ---------------------------------------------------------------- the tool sets (sketch 006: Island · Building · Room · Display)
    function chips(list, attr) { return '<div class="wf-chips">' + list.join('') + '</div>'; }
    function pickBtn(kind, i, n, label, sub, title) { return '<button type="button" data-wfpick="' + kind + ':' + i + ':' + n + '" data-wft2="' + esc(title || label) + '"' + (W.S && W.S.kind === kind && W.S.i === i ? ' class="on"' : '') + '><b>' + esc(label) + '</b>' + (sub ? '<small>' + esc(sub) + '</small>' : '') + '</button>'; }
    var SETS = {
      island: { name: 'Island tools', smart: 'Smart Island', menu: ['New Empty', 'Island Gallery', 'Island Group'],
        base: [['island', '🏝 Island'], ['style', '🎨 Style'], ['group', '🏝🏝 Island group']], detail: [['decor', '🌳 Decor'], ['dstyle', '✨ Detail style'], ['move', '🐾 Moving things']],
        locks: [['terrain', '⛰ Terrain', 'the land and its shape'], ['buildings', '🏘 Buildings & layout', 'buildings and displays stay where they are'], ['decor', '🌳 Decorations', 'trees, flowers, lamps, animals'], ['materials', '🎨 Ground & materials', 'the ground it is made of']],
        hasBase: function () { var R0 = islandD(); return (R0.pc || []).length > 0 || landOf(R0).length > 9; },
        gen: { island: gShape, style: gStyleIsl, group: gGroup, decor: gDecor, dstyle: gDstyle, move: gMove },
        smartGen: { base: ['island', 'style', 'decor'], detail: ['decor', 'dstyle', 'move'] },
        pick: { blank: function () { return gBlank(); }, gallery: function (i) { var k = Object.keys(BIAS)[i % 6]; return k + ': ' + gStyleIsl(0, BIAS[k]) + ' · ' + gDecor(0, BIAS[k]); }, group: function (i, B) { return gGroup(i, B); } },
        edit: function () { return ctlHtml() + decorPicker(false); },
        new: function () { return '<div class="wf-list"><button type="button" data-wfnw="blankisland"><b>🆕 New empty island</b><small>a blank new island (a new world), ready to build on</small></button>' + pickBtn('blank', 0, 1, '🧹 Start this island over', 'empty land — your things go back to the Box (preview first)') + '</div>'; },
        gallery: function () {
          var I = isles(), b0 = board(V.bid) || {}, cols = realCols(), ai = Math.min(W.area || 0, Math.max(0, cols.length - 1)), col = cols[ai], hub = /^hub:/.test(V.bid);
          var mainOn = skinGet('uv:skin:w:' + V.bid), subOn = col && skinGet('uv:skin:c:' + V.bid + ':' + col.id);
          return '<h4>Main island · title and look</h4>' + (hub ? '' : '<label class="wf-f"><span>Title</span><input type="text" data-wfbt value="' + esc(b0.title || '') + '"></label>') +
            studioGrid('w', studioList('world'), 'data-wfskinw', '', mainOn) +
            (cols.length && !hub ? '<h4>Subsidiary islands · one for each area</h4>' + chips(cols.map(function (c, i) { return '<button type="button" data-wfarea="' + i + '"' + (i === ai ? ' class="on"' : '') + '>' + esc(c.title || 'Area') + '</button>'; })) +
              '<label class="wf-f"><span>Title of this island</span><input type="text" data-wfct="' + esc(col.id) + '" value="' + esc(col.title || '') + '"></label>' + studioGrid('s', studioList('sub'), 'data-wfskinc', col.id + '|', subOn) : '') +
            ((W.skinUndo || []).length ? '<div class="wf-row"><button type="button" data-wfskinundo>↶ Undo the island looks</button></div>' : '') +
            '<h4>Island style · ground, trees and things (preview, then ✓)</h4><div class="wf-list two">' + Object.keys(BIAS).map(function (k, i) { return pickBtn('gallery', i, 6, STYLES[i + 1][1] + ' island', '', STYLES[i + 1][1] + ' island'); }).join('') + '</div>' +
            '<h4>Flags on the land · main island and islets</h4><div class="wf-list">' + I.map(function (g, ix) { var f = isleFlag(g); return '<label class="wf-f"><span>' + (ix ? '🏝 Islet ' + ix : '🏝 Main island') + ' · ' + g.length + ' plots</span><input type="text" data-wfisle="' + ix + '" value="' + esc(f ? plainT(f.wfT || f.label) : '') + '" placeholder="Its title (a flag on it)"></label>'; }).join('') + '</div>' +
            '<h4>Title style</h4>' + chips(TSTYLES.map(function (t) { return '<button type="button" data-wftstyle="' + t[0] + '">' + t[1] + '</button>'; })) +
            '<div class="wf-list"><button type="button" data-wfnw="mainisland"><b>🏝 Make a main island</b><small>a main island with your worlds round it as subsidiary islands</small></button></div>';
        },
        group: function () { return '<h4>① A template or framework</h4><div class="wf-list two">' + ISLE_GROUPS.map(function (g, i) { return pickBtn('group', i, ISLE_GROUPS.length, g[1] + ' ' + g[0], '', '🏝 ' + g[0]); }).join('') + '</div>' +
          '<div class="wf-list two"><button type="button" data-wfnw="template"><b>📚 From a template</b><small>a new group of islands from Minest’s templates</small></button><button type="button" data-wfnw="generate"><b>🧭 From a framework</b><small>say what it is about — a ready world</small></button></div>' +
          '<h4>② Choose a style · the main island and its subsidiary islands together</h4>' + chips((function () { var t = {}, out = []; studioList('world').concat(studioList('sub')).forEach(function (a) { var x = themeOf(a); if (!t[x]) { t[x] = 1; out.push(x); } }); return out; })().slice(0, 24).map(function (x) { return '<button type="button" data-wfgstyle="' + esc(x) + '">' + esc(x) + '</button>'; })) +
          ((W.skinUndo || []).length ? '<div class="wf-row"><button type="button" data-wfskinundo>↶ Undo the island looks</button></div>' : '') + styleChips(); } },
      bld: { name: 'Building tools', smart: 'Smart Build', menu: ['New Building', 'Building Gallery', 'Building Group'],
        base: [['buildings', '🏘 Buildings'], ['layout', '🧭 Layout'], ['exterior', '🏠 Style']], detail: [['yard', '🌳 Yards & decor'], ['exterior', '🏠 Exterior'], ['materials', '🧱 Materials']],
        locks: [['structure', '🏗 Structure', 'which buildings, and their rooms'], ['layout', '🧭 Layout', 'where each building stands'], ['exterior', '🏠 Exterior', 'what each building looks like'], ['materials', '🧱 Materials', 'floors and walls inside']],
        hasBase: function () { return (islandD().pc || []).some(isBld); },
        gen: { buildings: gBuildings, layout: gLayout, exterior: gExterior, yard: gYard, materials: gMaterials },
        smartGen: { base: ['buildings'], detail: ['yard', 'materials'] },
        pick: { group: function (i) { return gBuildings(i); } },
        edit: function () { return ctlHtml() + decorPicker(false); },
        new: function () { return '<div class="wf-list"><button type="button" data-wfblankbld><b>🆕 A blank building</b><small>a plain house with no rooms yet</small></button></div><h4>Or pick one to place</h4>' + libHtml('bld'); },
        gallery: function () { return '<h4>Studio buildings · ' + studioList('bld').length + ' (tap one: it goes where it fits, facing you)</h4>' + studioGrid('b', studioList('bld'), 'data-pkkind', 'bld:') + '<h4>Landmarks & block buildings</h4>' + libHtml('lm'); },
        group: function () { return '<h4>Your lists as buildings</h4><div class="wf-list two">' + SB_WAYS.island.map(function (w, i) { return pickBtn('group', i, 4, w.n, '', '🏘 ' + w.n); }).join('') + '</div><h4>Sets</h4><div class="wf-list two"><button type="button" data-wfdo="kits"><b>🎁 Add a set</b><small>a house and its yard, a school…</small></button><button type="button" data-wfdo="city"><b>🏙 Build a town</b><small>roads, blocks and districts</small></button><button type="button" data-wfdo="sample"><b>🏠 House Sample</b><small>four furnished rooms</small></button></div>'; } },
      room: { name: 'Room tools', smart: 'Smart Room', menu: ['New Room', 'Room Gallery', 'Room Group'],
        base: [['group', '🏘 Layout'], ['room', '🚪 Rooms'], ['style', '🎨 Style']], detail: [['decor', '🌿 Decor'], ['area', '📐 Area'], ['style', '🎨 Style'], ['furniture', '🛋 Furniture']],
        locks: [['structure', '🚪 Structure', 'which rooms, and the floors'], ['layout', '🧭 Layout', 'order, floor and size of each room'], ['furniture', '🛋 Furniture', 'the furniture in the rooms'], ['decor', '🌿 Decorations', 'plants, rugs, lamps, models']],
        hasBase: function () { var p = bldOf(); return !!(p && (p.rooms || []).length && (p.wfBase || p.roomOrder || (p.rooms || []).some(roomThings))); },   // the rooms a building is given on first opening are not a base yet
        gen: { room: gRoomSet, style: gPalette, group: gLayout3, decor: gRoomDecor, area: gArea, furniture: gRoomFurn, detail: gRoomsDetail },
        smartGen: { base: ['group'], detail: ['detail'] },
        pick: { group: function (i) { return gLayout3(i, null); }, gallery: function (i) { var p = bldOf(); return p ? paint(p, i) : ''; } },
        edit: function () { return bldBody('rooms'); },
        new: function () { var p = bldOf(); return '<div class="wf-list"><button type="button" data-wfblankroom><b>🆕 A blank room</b><small>an empty room on the floor you are looking at</small></button>' +
          (p && (p.floors || 1) < 3 ? '<button type="button" data-wfguide' + (W.addFl ? ' class="on"' : '') + '><b>＋ A new floor</b><small>' + (W.addFl ? 'tap the dashed floor over the house to build it' : 'shows the next floor over the house — tap it to build it') + '</small></button>' : '') + '</div>'; },
        gallery: function () { var r = selRoom(), p = bldOf();
          return '<h4>House style · ' + PALETTES.length + ' palettes (preview, then ✓)</h4><div class="wf-list two">' + PALETTES.map(function (x, i) { return pickBtn('gallery', i, PALETTES.length, x[0], i < 5 ? 'every room the same' : i === 5 ? 'each room as its kind is' : 'bright downstairs, cosy upstairs', 'Style · ' + x[0]); }).join('') + '</div>' +
            (p && OUTSIDES.some(function (o) { return o[0] === p.k; }) ? '<h4>Outside · walls and roof</h4>' + chips(OUTSIDES.filter(function (o) { return okK(o[0]); }).map(function (o) { return '<button type="button" data-wfout2="' + o[0] + '"' + (p.k === o[0] ? ' class="on"' : '') + '>' + esc(o[1]) + '</button>'; })) : '') +
            '<h4>' + (r ? 'This room · “' + esc(r.n || ROOMS[r.k][0]) + '”' : 'A room — tap one in the dollhouse to change it, or pick a kind to add one') + '</h4>' +
            (r ? '<label class="wf-f"><span>Title</span><input type="text" data-wfrtitle value="' + esc(r.n || '') + '"></label>' : '') +
            chips(ROOM_ORDER.filter(function (k) { return ROOMS[k]; }).map(function (k) { return '<button type="button" data-wfrg="' + k + '"' + (r && r.k === k ? ' class="on"' : '') + '>' + ROOMS[k][1] + ' ' + esc(ROOMS[k][0]) + '</button>'; })) +
            (r ? '<h4>Its floor & walls</h4>' + chips(RO_FINISH.map(function (f, i) { return '<button type="button" data-wfrf="' + i + '">' + f[2] + '</button>'; })) : ''); },
        group: function () { var p = bldOf(); return '<h4>Layouts · ' + LAYOUTS.length + ' ways to arrange floors and rooms (preview, then ✓)</h4><div class="wf-list two">' + LAYOUTS.map(function (l, i) { var fl = l[3].reduce(function (m, x) { return Math.max(m, x[1]); }, 1); return pickBtn('group', i, LAYOUTS.length, l[2] + ' ' + l[1], l[3].length + ' rooms · ' + fl + ' floor' + (fl === 1 ? '' : 's') + ' · ' + PALETTES[l[5]][0], l[2] + ' ' + l[1]); }).join('') + '</div>' +
          '<div class="wf-list"><button type="button" data-wfdo="bsuggest"><b>✦ The rooms a ' + esc(p ? bldName(p).toLowerCase() : 'building') + ' has</b><small>added at once (↶ Undo)</small></button></div>' + styleChips(); } },
      disp: { name: 'Display tools', smart: 'Smart Display', menu: ['New Set', 'Display Gallery', 'Display Group'],
        base: [['shelf', '🗄 Displays'], ['vocab', '📚 Word display'], ['style', '🎨 Style'], ['group', '🧩 Group']], detail: [['decor', '🌿 Decor'], ['lighting', '💡 Lighting'], ['material', '🧱 Material']],
        locks: [['fixtures', '🗄 Fixture structure', 'which displays, their kind and size'], ['layout', '🧭 Display layout', 'where each display stands'], ['lighting', '💡 Lighting', 'lamps and lights'], ['materials', '🧱 Materials', 'the floor and the walls']],
        hasBase: function () { return (V.d.pc || []).some(function (p) { return cDisp(p) && (p.it || []).filter(thing).length; }); },
        gen: { shelf: gShelf, style: gDispStyle, group: gTrio, decor: gDispDecor, lighting: gLight, material: gMaterial, vocab: function (i, B) { return VOCAB.place(i, B); }, auto: function (i, B) { return VOCAB.like() ? VOCAB.place(i, B) : gShelf(i, B); } },
        smartGen: { base: ['auto'], detail: ['decor', 'lighting', 'material'] },   // a world of words: the word display its list suggests
        pick: { group: function (i, B) { return gTrio(i, null); }, vgroup: function (i) { return VOCAB.place(i, null); } },
        edit: function () { return ctlHtml() + decorPicker(true); },
        new: function () { return '<div class="wf-list"><button type="button" data-wfdk="shelf"><b>🆕 A new set (a shelf)</b><small>placed in a free spot — move it from ✎ Edit</small></button></div>'; },
        gallery: function () { var p = V.sel && V.sel.pc && pieceOf(V.sel.pc), G = libGroups('disp'), ks = []; G.forEach(function (g) { g.kinds.forEach(function (k) { if (ks.indexOf(k) < 0) ks.push(k); }); });
          return '<p class="duo-lib-m">' + (p && cDisp(p) ? 'Restyling “' + esc(nm(p)) + '” — its things stay on it.' : 'Pick a style to place a new display — or select one in the room to restyle it.') + '</p>' +
            '<h4>📚 Vocabulary & concept displays</h4><div class="wf-list two">' + VOCAB.displays.map(function (d) { return '<button type="button" data-wfdk="' + d[0] + '"><b>' + d[1] + '</b><small>' + esc(d[2]) + '</small></button>'; }).join('') + '</div><h4>All displays</h4><div class="duo-lib-grid">' + ks.map(function (k) { return pkCard(k, 0).replace('data-pkkind=', 'data-wfdk='); }).join('') + '</div>'; },
        group: function () { var g = VOCAB.bigList(true) || VOCAB.bigList(false), R0 = g ? VOCAB.recommend(g.refs.length, g.refs) : [];
          return (g ? '<h4>📚 Word displays for “' + esc(g.L.k.title || '') + '” · ' + g.refs.length + ' words (' + (g.refs.length <= 10 ? 'a few: standalone pieces' : g.refs.length <= 40 ? 'some: shelves, a wall, a table' : 'many: a library, a cabinet, zones') + ')</h4><div class="wf-list two">' +
            R0.map(function (x, i) { var d = VOCAB.displays.filter(function (y) { return y[0] === x[0]; })[0], f = VOCAB.forms.filter(function (y) { return y[0] === x[1]; })[0]; return pickBtn('vgroup', i, R0.length, d[1], (f ? f[1] + ' · ' : '') + d[2], d[1]); }).join('') + '</div>' : '') +
            '<h4>Display groups</h4><div class="wf-list two">' + DTRIOS.map(function (t, i) { return pickBtn('group', i, DTRIOS.length, t[0], t[1].map(function (k) { return K[k] ? K[k].n : k; }).join(' · '), '🧩 ' + t[0]); }).join('') + '</div>'; } },
      roomd: { name: 'Room tools', smart: 'Smart Room', menu: ['New Room', 'Room Gallery', 'Room Group'],
        base: [['kind', '🚪 Room'], ['style', '🎨 Style'], ['group', '🏡 Room group']], detail: [['decor', '🌿 Decor'], ['area', '📐 Area'], ['style', '🎨 Style'], ['furniture', '🛋 Furniture']],
        locks: [['structure', '📐 Structure', 'the room’s size and shape'], ['layout', '🧭 Layout', 'where everything stands'], ['furniture', '🛋 Furniture', 'the furniture'], ['decor', '🌿 Decorations', 'plants, rugs, lamps, models']],
        hasBase: function () { return (V.d.pc || []).length > 0; },
        gen: { kind: gRoomKind, style: gMaterial, group: gRoomKit, decor: gDispDecor, area: gArea4, furniture: gFurn4 },
        smartGen: { base: ['group', 'style'], detail: ['furniture', 'decor', 'style', 'area'] },
        pick: { blank: function () { V.d.pc = []; return 'an empty room — its things went back to the Box'; }, group: function (i) { return gRoomKit(i); }, vroom: gVocabRoom },
        edit: function () { return ctlHtml() + decorPicker(true); },
        new: function () { return '<div class="wf-list">' + pickBtn('blank', 0, 1, '🆕 A blank room', 'empties this room — its things go back to the Box (preview first)', '🆕 A blank room') + '</div>'; },
        gallery: function () { var r = roomOf(); if (!r) return '';
          return '<label class="wf-f"><span>Title</span><input type="text" data-wfrtitle value="' + esc(r.n || '') + '"></label><h4>Kind of room</h4>' + chips(ROOM_ORDER.filter(function (k) { return ROOMS[k]; }).map(function (k) { return '<button type="button" data-wfrg="' + k + '"' + (r.k === k ? ' class="on"' : '') + '>' + ROOMS[k][1] + ' ' + esc(ROOMS[k][0]) + '</button>'; })) +
            '<h4>Style · floor & walls</h4>' + chips(RO_FINISH.map(function (f, i) { return '<button type="button" data-wfrf="' + i + '"' + (V.d.floor === f[0] && V.d.wall === f[1] ? ' class="on"' : '') + '>' + f[2] + '</button>'; })) +
            '<h4>Studio room scenes · a whole set in the room</h4>' + studioGrid('sc', studioList('scene'), 'data-pkkind', 'dio:'); },
        group: function () { return '<h4>📚 For words</h4><div class="wf-list two">' + pickBtn('vroom', 0, 4, '📚 Vocabulary room', 'word wall · library · cabinet · flashcard table', '📚 Vocabulary room') + '</div><h4>Room sets · furniture and displays that go together</h4><div class="wf-list two">' + KITS4().map(function (k, i, a) { return pickBtn('group', i, a.length, ROOMS[k][1] + ' ' + ROOMS[k][0] + ' set', (FURNISH[k] || []).concat(ROOMS[k][2]).length + ' pieces', ROOMS[k][1] + ' ' + ROOMS[k][0] + ' set'); }).join('') + '</div>' + styleChips(); } },
      fixture: { name: 'Display tools', smart: 'Smart Display', menu: ['New Set', 'Display Gallery', 'Display Group'],
        base: [['shelf', '🗄 Things on it'], ['wdisp', '📚 Word display'], ['style', '🎨 Style'], ['group', '🧩 Group']], detail: [['wform', '🔤 Word form'], ['decor', '🌿 Decor'], ['lighting', '💡 Lighting'], ['material', '🧱 Material'], ['order', '🔢 Order']],
        locks: [['fixtures', '🗄 Fixture structure', 'its kind, size and spot'], ['layout', '🧭 Display layout', 'which things, in which order'], ['lighting', '💡 Lighting', 'lamps and lights round it'], ['materials', '🧱 Materials', 'the floor and the walls']],
        hasBase: function () { var p = pvPiece(); return !!(p && (p.it || []).filter(thing).length); },
        gen: { shelf: gItems, style: gPKind, group: gTrioNear, decor: gDecorNear, lighting: gLightNear, material: gMaterial, order: gOrder, wdisp: function (i) { return VOCAB.switchKind(pvPiece(), i); }, wform: function (i) { return VOCAB.cycleForm(pvPiece(), i); } },
        smartGen: { base: ['shelf', 'order'], detail: ['decor', 'lighting', 'material'] },
        smartFn: function (tab) { var v = VOCAB.isVocab(pvPiece()); return tab === 'base' ? (v || !VOCAB.like() ? ['shelf', 'order'] : ['shelf', 'wdisp']) : (v ? ['wform', 'lighting'] : ['decor', 'lighting', 'material']); },
        pick: { group: function (i) { return gTrioNear(i); } },
        edit: function () { var p = pvPiece(); return (VOCAB.isVocab(p) ? formChips(p, null) : '') + dispBody('on'); },
        new: function () { return '<div class="wf-list"><button type="button" data-wfshelfnear><b>🆕 A new set beside it</b><small>another shelf next to this display</small></button></div>' + dispBody('bag'); },
        gallery: function () { var p = pvPiece(); return '<h4>📚 As a word display · its words stay</h4><div class="wf-list two">' + VOCAB.displays.map(function (d) { return '<button type="button" data-wfvk="' + d[0] + '"' + (p && p.k === d[0] ? ' class="on"' : '') + '><b>' + d[1] + '</b><small>' + esc(d[2]) + '</small></button>'; }).join('') + '</div>' + (VOCAB.isVocab(p) ? formChips(p, null) : '') + dispBody('kind'); },
        group: function () { return '<h4>Display groups · placed round this one</h4><div class="wf-list two">' + DTRIOS.map(function (t, i) { return pickBtn('group', i, DTRIOS.length, t[0], t[1].map(function (k) { return K[k] ? K[k].n : k; }).join(' · '), '🧩 ' + t[0]); }).join('') + '</div>'; } }
    };

    // ---------------------------------------------------------------- double-tap: one level deeper, for touch and mouse alike
    function tgtOf(t) {
      if (!t || !t.closest) return null; var x;
      if ((x = t.closest('.mn-dsp .mn-bv [data-fproom], .mn-dsp .mn-bv [data-bvroom]'))) return { room: x.getAttribute('data-fproom') || x.getAttribute('data-bvroom') };
      if ((x = t.closest('.mn-pv [data-pvi], .mn-pv [data-wvi]'))) return { pvi: +(x.getAttribute('data-pvi') || x.getAttribute('data-wvi')) };
      if (!t.closest('.mn-dsp .mn-dsp-scene')) return null;
      var pc = t.closest('[data-pc]'), it = t.closest('[data-it]'), id = pc && pc.getAttribute('data-pc'), ref = it && it.getAttribute('data-it');
      if (!id && ref) (V.d.pc || []).forEach(function (p) { if (!id && (p.it || []).indexOf(ref) >= 0) id = p.id; });
      return { pc: id || null, scene: 1 };
    }
    function tgtAt(x, y, t0) {   // what is under the finger — through labels and highlights drawn over it (a first tap that selects redraws them)
      var L = [t0], best = null; try { L = L.concat([].slice.call(document.elementsFromPoint(x, y))); } catch (e) {}
      for (var i = 0; i < L.length; i++) { var t = tgtOf(L[i]); if (!t) continue; if (t.room || t.pvi != null || t.pc) return t; if (!best) best = t; }
      return best;
    }
    function sameT(a, b) { return !!(a && b) && a.room === b.room && a.pvi === b.pvi && (a.pc === b.pc || (level() === 1 && a.scene && b.scene)); }
    function enter(t, e) {
      var lv = level();
      if (t.room && lv === 3) { var b = bldOf(); if (b) enterRoom(b.id, t.room); return; }
      if (t.pvi != null && lv === 5 && pv && pv.at !== t.pvi) { pvDetail(t.pvi); return; }
      if (lv === 1 && t.scene) { W.near = true; V.sel = null; zoomAt(e.clientX, e.clientY, 1.7); hap('light'); render(); return; }
      if (!t.pc || (lv !== 2 && lv !== 4)) return;
      var p = pieceOf(t.pc); if (!p) return; var bh = null; try { bh = dblBehind(e, p); } catch (x) {} if (bh) p = bh;
      if (isBld(p)) return lv === 2 ? bldOpen(p.id) : null;
      if (K[p.k] && !K[p.k].decor) return openPiece(p.id);
    }
    document.addEventListener('pointerdown', function (e) { if (!mode() || (e.button && e.button > 0) || e.isPrimary === false) { W.DT = null; return; } W.DT = { x: e.clientX, y: e.clientY, t: tgtAt(e.clientX, e.clientY, e.target), lv: level() }; }, true);
    document.addEventListener('pointerup', function (e) {
      var d = W.DT; W.DT = null; if (!d || !mode()) return;
      if (Math.abs(e.clientX - d.x) + Math.abs(e.clientY - d.y) > 12) { W.lastTap = null; return; }
      var now = Date.now(), L = W.lastTap, near = L && now - L.at <= 450 && Math.abs(e.clientX - L.x) + Math.abs(e.clientY - L.y) <= 32 && L.lv === d.lv;
      var weak = function (t) { return !t || (!t.room && t.pvi == null && !t.pc); };
      if (!(near && (sameT(L.t, d.t) || weak(d.t)))) { W.lastTap = d.t ? { x: e.clientX, y: e.clientY, at: now, t: d.t, lv: d.lv } : null; return; }   // the first tap's target counts: a tap that selects redraws what is under the finger
      d.t = L.t; W.lastTap = null; var ev = { clientX: e.clientX, clientY: e.clientY };
      setTimeout(function () { if (level() === d.lv && mode()) { try { enter(d.t, ev); } catch (x) {} } }, 30);   // after the scene's own handlers — only if they did not go in already
    }, true);

    // ---------------------------------------------------------------- the scene's own double-tap on the island goes onto it (1 → 2); pinch in, Esc
    var tap0 = tap;
    tap = function (e, d) {
      if (mode() && level() === 1 && V && !V.hold && d && /pan|pc|it/.test(d.t)) {
        var now = e.timeStamp || Date.now(), lt = W.lt;
        if (lt && now - lt.t >= 0 && now - lt.t < 450 && Math.abs(e.clientX - lt.x) + Math.abs(e.clientY - lt.y) < 32) { W.lt = null; W.near = true; V.sel = null; zoomAt(e.clientX, e.clientY, 1.7); hap('light'); render(); return; }
        W.lt = { t: now, x: e.clientX, y: e.clientY };
      } else W.lt = null;
      return tap0.apply(this, arguments);
    };
    var PZ = null;
    function dist(t) { return Math.hypot(t[0].clientX - t[1].clientX, t[0].clientY - t[1].clientY) || 1; }
    document.addEventListener('touchstart', function (e) {
      if (e.touches.length !== 2 || !mode()) { if (e.touches.length > 2) PZ = null; return; }
      var t = e.target; if (!(t.closest && t.closest('.mn-dsp, .mn-pv'))) return; var lv = level();
      PZ = { d0: dist(e.touches), min: 1, lv: lv, ok: lv === 3 || lv >= 5 || ((lv === 2 || lv === 4) && V.cam.z <= (V.fitZ || V.cam.z) * 1.08) };
    }, true);
    document.addEventListener('touchmove', function (e) { if (PZ && e.touches.length === 2) PZ.min = Math.min(PZ.min, dist(e.touches) / PZ.d0); }, true);
    document.addEventListener('touchend', function () { if (!PZ) return; var z = PZ; PZ = null; if (z.ok && z.min < .62 && level() === z.lv && !SB && !RO) up(); }, true);
    window.addEventListener('keydown', function (e) {
      var t = e.target, c = document.querySelector('.wf');
      if (c && t && c.contains(t) && /^(INPUT|TEXTAREA|SELECT)$/.test(t.tagName)) { e.stopPropagation(); return; }   // typing here: not the piece view's ‹ › keys
      if (e.key === 'Escape' && W.S && mode()) { e.preventDefault(); e.stopPropagation(); sCancel(); return; }
      if (e.key !== 'Escape' || !mode() || SB || RO || pv || W.fs || !V || V.hold || V.menu || V.sel) return;   // a selection / a piece in hand: Esc lets go of it first (the island's own key)
      if (level() > 1 && !document.querySelector('.mn-pick, .mn-sa, .mn-invx, .mn-qe')) { e.preventDefault(); e.stopPropagation(); up(); }
    }, true);

    // ---------------------------------------------------------------- 🎒 Box / ＋ Add on a display: one sheet with everything that can go on it
    // The Box button used to open a list's inventory (which cannot put anything on the display), and "From your Box" only
    // offered things not out yet — once Smart build had placed everything, nothing could be added. Now Box opens the add
    // sheet at its Box part, which also lists what stands on other displays (tap to move it here; its list never changes).
    var PVM = 'add';
    var pva0 = pvAdd; pvAdd = function () {
      pva0(); if (!pv) return; var d = pv.el.querySelector('.pv-detail'), p = pieceOf(pv.pc), sh = d && d.querySelector('.pv-add .txt'); if (!sh || !p) return;
      var sel = d.querySelector('[data-pvnl]'); if (sel && !sel.options.length) { sel.innerHTML = '<option value="">＋ New list · ' + esc(pvListName(p)) + '</option>'; sel.classList.add('wf-newlist'); }   // no lists yet: say where the thing will go
      var on = placed(), names = {}, here = {}, groups = {}, order = [];
      walkAll(function (q) { names[q.id] = q.label || (K[q.k] ? K[q.k].n : 'Display'); });
      (p.it || []).forEach(function (r) { here[r] = 1; });
      Object.keys(on).forEach(function (r) { if (here[r] || on[r] === p.id || !thing(r)) return; var g = on[r]; if (!groups[g]) { groups[g] = []; order.push(g); } groups[g].push(r); });
      var n = 0; order.forEach(function (g) { n += groups[g].length; });
      var it = function (r) { var t = thing(r), u = t && picOf(t.s); return '<button type="button" class="mn-sa-it" data-pvput="' + esc(r) + '" data-q="' + esc((t.s.title + ' ' + (t.s.titleZh || '') + ' ' + t.k.title).toLowerCase()) + '" title="' + esc(t.s.title + ' · on ' + names[on[r]]) + '">' + (u ? '<img alt="" loading="lazy" src="' + esc(S(u)) + '">' : '<i>' + esc(String(t.s.title).charAt(0).toUpperCase()) + '</i>') + '<span>' + esc(t.s.title) + '</span></button>'; };
      sh.insertAdjacentHTML('beforeend', '<div class="wf-pvbox"><label class="mn-nw-lab">On other displays · ' + n + ' — tap one to move it here</label>' +
        (n ? '<input class="mn-ie-in" data-pvq type="search" placeholder="Find a thing…" aria-label="Find a thing" enterkeyhint="search">' + order.map(function (g) { return '<div class="wf-pvgrp"><small>from ' + esc(names[g]) + ' · ' + groups[g].length + '</small><div class="pv-free">' + groups[g].map(it).join('') + '</div></div>'; }).join('') : '<p class="dim">Nothing stands anywhere else yet.</p>') + '</div>');
      var q = sh.querySelector('[data-pvq]');
      if (q) { q.addEventListener('keydown', function (e) { e.stopPropagation(); }); q.addEventListener('input', function () { var v = q.value.trim().toLowerCase(); sh.querySelectorAll('.wf-pvbox [data-q]').forEach(function (b) { b.hidden = !!v && b.getAttribute('data-q').indexOf(v) < 0; }); sh.querySelectorAll('.wf-pvgrp').forEach(function (g) { g.hidden = !g.querySelector('[data-q]:not([hidden])'); }); }); }
      if (PVM === 'box') setTimeout(function () { var inp = d.querySelector('[data-pvnt]'); try { if (inp) inp.blur(); } catch (x) {} var lab = [].slice.call(d.querySelectorAll('.mn-nw-lab')).filter(function (l) { return /From your Box/.test(l.textContent); })[0]; if (lab) lab.scrollIntoView({ block: 'start' }); }, 60);
    };
    // on a phone the keyboard is up while you type the name: the first touch on Add used to blur the field, the keyboard dropped,
    // the sheet jumped and the click landed beside the button. Holding the focus on touch-down keeps Add where the finger is.
    window.addEventListener('pointerdown', function (e) { var b = e.target && e.target.closest && e.target.closest('.mn-pv .pv-add [data-pvnew], .mn-pv .pv-add [data-pvput]'); if (b) e.preventDefault(); }, true);
    var HUB_SIG = {}, hb0 = hubBoard; hubBoard = function (bid) {   // a main island's Box is cached; drop it when any of its worlds' lists or things change
      try { var H = window.MinestHubs, ws = H && H.groupWorlds ? H.groupWorlds(bid.slice(4)) : [], all = A().boards() || [], sig = ws.length + ':';
        ws.forEach(function (w) { var b = all.filter(function (x) { return x.id === w.id; })[0]; ((b && b.columns) || []).forEach(function (c) { sig += (c.cards || []).length + '.'; (c.cards || []).forEach(function (k) { sig += (k && k.stack ? k.stack.length : 0) + ','; }); }); });
        if (sig !== HUB_SIG[bid]) { HUB_SIG[bid] = sig; HUBB.key = null; } } catch (e) {}
      return hb0(bid);
    };
    function anyPiece(pc) { var hit = pieceOf(pc); if (!hit) walkAll(function (q) { if (!hit && q.id === pc) hit = q; }); return hit; }   // the display wherever it stands (a room's, if the view moved on)
    function pvRefresh(p) { if (!pv || pv.pc !== p.id) return; pv.refs = pvOrder(p); var b = pv.el.querySelector('.pv-body'), sm = pv.el.querySelector('.mn-dsp-title small'); if (b) b.innerHTML = pvBody(p, pv.refs); if (sm) sm.textContent = (K[p.k] ? K[p.k].n : '') + ' · ' + pv.refs.length + ' thing' + (pv.refs.length === 1 ? '' : 's'); var d = pv.el.querySelector('.pv-detail'); if (d) d.hidden = true; }
    function pvListName(p) { return String((p && (p.label || (K[p.k] && K[p.k].n))) || 'My things').trim(); }
    var pm0 = pvMore; pvMore = function (e) {
      if (pv && e.target.closest('[data-pvadd]')) { PVM = 'add'; pvAdd(); return true; }
      // a world with no lists yet: the new thing still goes on — into a new list named after the display, made first
      var d0 = pv && e.target.closest('[data-pvnew]') && pv.el.querySelector('.pv-detail'), sel0 = d0 && d0.querySelector('[data-pvnl]'), in0 = d0 && d0.querySelector('[data-pvnt]');
      if (sel0 && sel0.value && in0) {   // a list is chosen: add it there and put it on this display (wherever the display stands)
        var t1 = String(in0.value || '').trim(), pc1 = pv.pc; if (!t1) { in0.focus(); return true; }
        newThing(sel0.value, t1, function (ref) { var p3 = anyPiece(pc1); if (!ref || !p3) { toast('✗ “' + t1 + '” could not be added'); return; } var ok = putOnPiece(p3, ref); save(); render(); if (pieceOf(pc1)) openPiece(pc1, ok ? ref : null); else pvRefresh(p3); hap('success');
          if (ok) toast('“' + t1 + '” is on this display — tap Edit to add a picture or a note'); });
        return true;
      }
      if (sel0 && !sel0.value && in0) {
        var title = String(in0.value || '').trim(); if (!title) { in0.focus(); return true; }
        var pc0 = pv.pc, p0 = anyPiece(pc0);
        var b = board(V.bid), firstCol = function () { return ((board(V.bid) || {}).columns || []).filter(function (c) { return c && c.id && !isHead(c.id); })[0] || null; }, col = firstCol(), pc = pc0, name = pvListName(p0);
        if (!buildBar()) { toast('✗ That could not be saved'); return true; }
        if (!col && /^hub:/.test(V.bid)) {   // a main island whose group has no world yet: make its Box world first, beside it
          var hid = V.bid.slice(4), hb = window.MinestHubs && MinestHubs.hub(hid), wt = String((hb && hb.title) || (b && b.title) || 'Main island').trim() + ' Box';
          var nb = 'lw-' + wt.toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/^-|-$/g, '') + '-' + Date.now().toString(36).slice(-4), cid = nb + '-d-things';
          try {
            A().addBoard({ id: nb, title: wt, columns: [{ id: cid, title: 'Things', color: '#5e9c2e', cards: [] }], labelDefinitions: [], archivedCards: [], linkedBoardIds: [], showLabelNames: false }, false);
            var m = {}; m['lom:world:' + nb] = { created: Date.now(), templates: {}, scratch: true }; KN().setMany(m); KN().set('uv:parent:' + nb, hid, true);
          } catch (x) { toast('✗ That could not be saved'); return true; }
          toast('Making “' + wt + '” for this island…');
          when(function () { var c = firstCol(); return c && c.__bid === nb ? c : null; }, function (c) { if (!c) { toast('✗ The new world did not appear — try again'); return; } addInto(c); });
          return true;
        }
        if (!col) { toast('This world has no area yet — add one first'); return true; }
        addInto(col); return true;
        function addInto(col) {
        // a new list is an empty card until its first thing is in it (lists() only counts cards with things), so look for the card itself
        var want = myName(name).toLowerCase(), had = {}; (col.cards || []).forEach(function (k) { if (k && k.id) had[k.id] = 1; });
        var findCard = function () { var c2 = ((board(V.bid) || {}).columns || []).filter(function (c) { return c.id === col.id; })[0], hit = null; ((c2 && c2.cards) || []).forEach(function (k) { if (k && k.id && !had[k.id] && String(k.title || '').toLowerCase() === want) hit = k.id; }); return hit; };
        try { buildBar().addList(realBid(col.id), col.id, name); } catch (x) { toast('✗ That could not be saved'); return true; }
        toast('Making the list “' + myName(name) + '”…');
        when(findCard, function (id) {
          if (!id) { toast('✗ The new list did not appear — try again'); return; }
          newThing(id, title, function (ref) { var p2 = anyPiece(pc); if (!ref || !p2) { toast('✗ “' + title + '” could not be added'); return; } var ok = putOnPiece(p2, ref); save(); render(); if (pieceOf(pc)) openPiece(pc, ok ? ref : null); else pvRefresh(p2); hap('success');
            if (ok) toast('“' + title + '” is on this display — in your new list “' + myName(name) + '”'); });
        });
        }
      }
      return pm0.apply(null, arguments);   // 🎒 Box: the list inventory (below it gains a row for this display)
    };
    // 🎒 the Minecraft-style inventory opened from a display: under its hotbar, a row for the display — pick a thing up in the
    // inventory, tap ＋ and it stands on the display (its list stays the same); tap a thing in that row to put it back in the box
    var ob0 = openBox; openBox = function () {
      var pc = pv && pv.pc; ob0.apply(null, arguments); var inv = document.querySelector('.mn-invx'), panel = inv && inv.querySelector('.mn-inv-panel'); if (!pc || !panel || panel.querySelector('.wf-invpv')) return;
      var row = document.createElement('div'); row.className = 'wf-invpv';
      function slot(r) { var t = thing(r), u = t && picOf(t.s), w = t ? String(t.s.title || '') : ''; return '<button type="button" class="mn-slot wf-invon" data-invoff="' + esc(r) + '" data-tip="' + esc(w) + '" title="' + esc(w + ' — tap to put it back in the box') + '">' + (u ? '<img alt="" src="' + esc(S(u)) + '">' : '<b>' + esc(w.charAt(0).toUpperCase()) + '</b>') + '</button>'; }
      function draw() { var p = pieceOf(pc); if (!p) return; var its = (p.it || []).filter(thing);
        row.innerHTML = '<div class="mn-inv-sub">🗄 On “' + esc(nm(p)) + '” · ' + its.length + ' — pick a thing up above, then tap ＋</div><div class="wf-invpv-row"><button type="button" class="mn-slot wf-invput" data-invput aria-label="Put the thing you hold on this display">＋</button>' + its.map(slot).join('') + '</div>'; }
      draw(); panel.appendChild(row);
      row.__wfAct = function (e) {
        var p = pieceOf(pc), g; if (!p) return;
        if (e.target.closest('[data-invput]')) {
          var h = window.MinestInventory && MinestInventory.held(); if (!h) { toast('Tap a thing in the box to pick it up, then tap ＋'); return; }
          var ref = h.card + '/' + h.sid; if (!thing(ref)) { index(); }
          if (putOnPiece(p, ref)) { save(); render(); MinestInventory.release(); draw(); hap('success'); toast('“' + h.title + '” is on ' + nm(p)); }
          return;
        }
        if ((g = e.target.closest('[data-invoff]'))) { var r = g.getAttribute('data-invoff'), t = thing(r); p.it = (p.it || []).filter(function (x) { return x !== r; }); save(); render(); draw(); hap('light'); toast('“' + (t ? t.s.title : '') + '” is back in the box'); }
      };
    };
    // the inventory takes every click inside it at document capture; this row answers first (window capture runs before it)
    window.addEventListener('click', function (e) { var row = e.target && e.target.closest && e.target.closest('.mn-invx .wf-invpv'); if (!row || !row.__wfAct) return; e.preventDefault(); e.stopImmediatePropagation(); row.__wfAct(e); }, true);

    // ---------------------------------------------------------------- keep it in step with the scene
    var op0 = openPiece; openPiece = function (pcId, ref) { if (V && !V.at) W.near = true; var o = op0.call(null, pcId, mode() && !pv ? null : ref); soon(); return o; };   // one level at a time: a display opens on itself, a thing on it is the next step
    var cp0 = closePiece; closePiece = function () { var o = cp0.apply(null, arguments); soon(); return o; };
    var pd0 = pvDetail; pvDetail = function () { var o = pd0.apply(null, arguments); soon(); return o; };
    var bo0 = bldOpen; bldOpen = function () { W.near = true; var o = bo0.apply(null, arguments); soon(); return o; };
    var bd0 = bvDraw; bvDraw = function () { var o = bd0.apply(null, arguments); soon(); return o; };
    var sd0 = sbDraw; sbDraw = function () { var o = sd0.apply(null, arguments); if (W.mode) { placePanels(); W.key = ''; soon(); } else unplacePanels(); return o; };
    var rd0 = roDraw; roDraw = function () { var o = rd0.apply(null, arguments); if (W.mode) { placePanels(); W.key = ''; soon(); } else unplacePanels(); return o; };
    var hg0 = histGo; histGo = function () { if (W.S) { W.S = null; } var o = hg0.apply(null, arguments); if (pv && W.mode) { if (pieceOf(pv.pc)) reopen(pvRef()); else closePiece(); } W.key = ''; soon(); return o; };   // ↶ / ↷ with a display open: it shows the step
    var pk1 = pkOpen; pkOpen = function (tab) { if (mode()) { var sk = setKey(); W.panel[sk] = 'new'; return draw(); } return pk1.apply(null, arguments); };
    var r0 = render; render = function () {
      if (W.S && atKey2() !== W.S.at) { var S = W.S; W.S = null; try { var keepAt = V.at, keepD = V.d; restoreRoot(S.snap); } catch (x) {} }   // left the level while looking: put it back
      var o = r0.apply(null, arguments); if (V && !V.at && !pv && V.cam && V.fitZ && W.near && V.cam.z < V.fitZ * .98 && !W.S) W.near = false;
      var sk = V && V.sel && V.sel.pc && !V.sel.ref ? V.sel.pc : '', lv = level();   // a piece picked in the scene: its controls in the console (✎ Edit)
      if (sk !== W.selK) { W.selK = sk; if (sk && W.mode && !W.S && (lv === 1 || lv === 2 || lv === 4)) { var ky = setKey(); if (ky !== 'roomd' || true) W.panel[ky] = 'edit'; } }
      soon(); okChip(); return o; };
    var cl0 = close; close = function () { if (W.S) sCancel(true); var o = cl0.apply(null, arguments); W.near = false; W.fs = null; soon(); setTimeout(sync, 60); return o; };
    window.addEventListener('resize', soon);
    window.addEventListener('minest:hinge', function () { setTimeout(sync, 30); setTimeout(sync, 500); });
    new MutationObserver(function () { soon(); }).observe(R, { attributes: true, attributeFilter: ['class'] });
    WFAPI = { on: function () { return !!mode(); }, sync: function () { soon(); return true; }, level: level, up: up, go: goTo, crumbs: function () { return V ? crumbs().map(function (x) { return x[2]; }) : []; }, mode: mode, open: function (v) { setPref(v !== false); sync(); },
      session: function () { return W.S ? { set: W.S.set, kind: W.S.kind, i: W.S.i, n: W.S.n, note: W.S.note } : null; }, locks: function (s) { return locks(s || setKey()); } };
    window.MinestWorldFold = WFAPI;
  })();

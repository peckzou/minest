/* MN-BOARD-NAV:BEGIN — 2026-10-30 Board switcher (Trello "Switch boards") + Board Center page (Trello boards page).
   Source: tools/live-perf/board_nav.js + board_nav.css → python3 tools/live-perf/patch_board_nav.py.
   Runs inside the app script (host React: P = jsx runtime, _ = React, m() = ReactDOM). Me (the board picker) delegates to
   MinestBoardNav.Root with its own props, so every existing callback and the canonical boards array are reused; no new store. */
var MinestBoardNav = (function() {
  var RECENTS = 'minest.boardRecents.v1';   // the Board Center's existing recents (Board IDs on this device)
  var prefs = { layout: 'grid', pinned: false, sort: 'recent' };   // this session only
  var pendingView = null;
  window.addEventListener('minest:open-boards', function(e) { pendingView = (e && e.detail && e.detail.view) || 'center'; });
  function h(type, props) {
    var kids = Array.prototype.slice.call(arguments, 2), key;
    props = Object.assign({}, props || {});
    if (props.key !== undefined) { key = props.key; delete props.key; }
    if (kids.length === 1) props.children = kids[0]; else if (kids.length > 1) props.children = kids;
    return kids.length > 1 ? (0, P.jsxs)(type, props, key) : (0, P.jsx)(type, props, key);
  }
  function snd(n) { try { if (window.SoundEngine && SoundEngine.play) SoundEngine.play(n); } catch(e) {} }
  function toast(t) { try { if (window.GlassUI) GlassUI.toast(t); } catch(e) {} }
  function hap() { try { if (window.MinestNative && MinestNative.haptic) MinestNative.haptic('light'); } catch(e) {} }
  function wsOf(b) { return (b.workspace && String(b.workspace).trim()) || 'General'; }
  function readRecents() { try { var r = JSON.parse(localStorage.getItem(RECENTS) || '[]'); return Array.isArray(r) ? r : []; } catch(e) { return []; } }
  function pushRecent(id) { var r = [id].concat(readRecents().filter(function(x) { return x !== id; })).slice(0, 24); try { localStorage.setItem(RECENTS, JSON.stringify(r)); } catch(e) {} return r; }
  var ICON = {
    search: '<circle cx="11" cy="11" r="6.5"/><path d="m20 20-4.2-4.2"/>',
    grid: '<rect x="4" y="4" width="7" height="7" rx="1.6"/><rect x="13" y="4" width="7" height="7" rx="1.6"/><rect x="4" y="13" width="7" height="7" rx="1.6"/><rect x="13" y="13" width="7" height="7" rx="1.6"/>',
    list: '<path d="M9 6h11M9 12h11M9 18h11"/><circle cx="4.5" cy="6" r="1.2"/><circle cx="4.5" cy="12" r="1.2"/><circle cx="4.5" cy="18" r="1.2"/>',
    pin: '<path d="M9 4h6l-1 5 3 3v2H7v-2l3-3z"/><path d="M12 14v6"/>',
    close: '<path d="M6 6l12 12M18 6 6 18"/>',
    sync: '<path d="M21 12a9 9 0 0 1-15.5 6.3L3 16"/><path d="M3 12a9 9 0 0 1 15.5-6.3L21 8"/><path d="M21 3v5h-5"/><path d="M3 21v-5h5"/>',
    more: '<circle cx="6" cy="12" r="1.4"/><circle cx="12" cy="12" r="1.4"/><circle cx="18" cy="12" r="1.4"/>',
    boards: '<rect x="3.5" y="4" width="17" height="16" rx="2.5"/><path d="M9 4v16M15 4v10"/>',
    templates: '<rect x="4" y="4" width="16" height="16" rx="2.5"/><path d="M4 10h16M10 10v10"/>',
    home: '<path d="M4 11 12 4l8 7"/><path d="M6 10v10h12V10"/>',
    plus: '<path d="M12 5v14M5 12h14"/>',
    chev: '<path d="m9 6 6 6-6 6"/>',
    down: '<path d="m6 9 6 6 6-6"/>',
    back: '<path d="m15 6-6 6 6 6"/>',
    gear: '<circle cx="12" cy="12" r="3"/><path d="M12 3v2.5M12 18.5V21M3 12h2.5M18.5 12H21M5.6 5.6l1.8 1.8M16.6 16.6l1.8 1.8M5.6 18.4l1.8-1.8M16.6 7.4l1.8-1.8"/>',
    people: '<circle cx="9" cy="9" r="3.2"/><path d="M3.5 19c.6-3 2.8-4.6 5.5-4.6s4.9 1.6 5.5 4.6"/><circle cx="17" cy="9.5" r="2.4"/><path d="M16 14.5c2.3.1 3.9 1.5 4.5 4"/>',
    archive: '<rect x="3.5" y="4.5" width="17" height="4" rx="1"/><path d="M5 8.5V19a1 1 0 0 0 1 1h12a1 1 0 0 0 1-1V8.5M10 12.5h4"/>',
    menu: '<path d="M4 7h16M4 12h16M4 17h16"/>',
    star: '<path d="m12 3.6 2.6 5.3 5.8.8-4.2 4.1 1 5.8-5.2-2.7-5.2 2.7 1-5.8-4.2-4.1 5.8-.8z"/>'
  };
  function ic(name, cls) { return h('svg', { className: 'mn-bn-ic' + (cls ? ' ' + cls : ''), viewBox: '0 0 24 24', 'aria-hidden': true, fill: 'none', stroke: 'currentColor', strokeWidth: 1.9, strokeLinecap: 'round', strokeLinejoin: 'round', dangerouslySetInnerHTML: { __html: ICON[name] } }); }
  // the cover: the board's wallpaper picture, else its gradient, else the board colour (else its first list's colour)
  function cover(b) {
    var wp = String(b.wallpaper || '').trim(), c = String(b.color || '').trim() || ((b.columns || [])[0] || {}).color || '#5b6b84';
    if (/^(linear|radial|conic)-gradient/i.test(wp)) return { style: { background: wp } };
    if (wp && !/^(#|rgb|hsl)/i.test(wp)) return { style: { backgroundColor: c, backgroundImage: 'linear-gradient(135deg,' + c + ',' + c + 'aa)' }, img: wp };
    return { style: { backgroundColor: c, backgroundImage: 'linear-gradient(135deg,' + c + ' 0%,color-mix(in srgb,' + c + ' 58%,#0b1220) 100%)' } };
  }
  function wsColor(name) { var hsh = 0; for (var i = 0; i < name.length; i++) hsh = (hsh * 31 + name.charCodeAt(i)) | 0; return 'hsl(' + (Math.abs(hsh) % 360) + ' 55% 46%)'; }
  function initial(s) { return String(s || '?').trim().charAt(0).toUpperCase() || '?'; }
  function cardCount(b) { return (b.columns || []).reduce(function(n, c) { return n + ((c.cards || []).length); }, 0); }
  var COLORS = ['#0079bf', '#d29034', '#519839', '#b04632', '#89609e', '#cd5a91', '#4bbf6b', '#00aecc', '#838c91', '#172b4d'];
  function gradients() { try { return CURATED_BOARD_GRADIENTS.slice(0, 8); } catch(e) { return []; } }
  function photos() { try { return CURATED_WALLPAPERS.slice(0, 8); } catch(e) { return []; } }

  function Root(props) {
    var boards = props.boards || [], isDark = props.themeMode === 'dark';
    var propsRef = (0, _.useRef)(props); propsRef.current = props;
    var viewS = (0, _.useState)(function() { var v = pendingView || 'switch'; pendingView = null; return v; }), view = viewS[0], setView = viewS[1];
    var qS = (0, _.useState)(''), q = qS[0], setQ = qS[1];
    var wsS = (0, _.useState)('all'), wsSel = wsS[0], setWsSel = wsS[1];
    var layoutS = (0, _.useState)(prefs.layout), layout = layoutS[0], setLayout = layoutS[1];
    var pinS = (0, _.useState)(prefs.pinned), pinned = pinS[0], setPinned = pinS[1];
    var sortS = (0, _.useState)(prefs.sort), sort = sortS[0], setSort = sortS[1];
    var pageS = (0, _.useState)({ page: 'boards' }), page = pageS[0], setPage = pageS[1];
    var openWsS = (0, _.useState)({}), openWs = openWsS[0], setOpenWs = openWsS[1];
    var menuS = (0, _.useState)(null), menu = menuS[0], setMenu = menuS[1];
    var askS = (0, _.useState)(null), ask = askS[0], setAsk = askS[1];
    var chipsS = (0, _.useState)(false), chipsOpen = chipsS[0], setChipsOpen = chipsS[1];
    var createS = (0, _.useState)(null), creating = createS[0], setCreating = createS[1];
    var sideS = (0, _.useState)(false), sideOpen = sideS[0], setSideOpen = sideS[1];
    var dropS = (0, _.useState)(null), dropWs = dropS[0], setDropWs = dropS[1];
    var recentsS = (0, _.useState)(function() { return props.activeBoardId ? pushRecent(props.activeBoardId) : readRecents(); }), recents = recentsS[0], setRecents = recentsS[1];
    var customS = (0, _.useState)(function() { try { return window.MinestWorkspaceCloud.names(); } catch(e) { return []; } }), custom = customS[0], setCustom = customS[1];
    var rootRef = (0, _.useRef)(null);
    (0, _.useEffect)(function() {
      var reload = function() { try { setCustom(window.MinestWorkspaceCloud.names()); } catch(e) {} };
      var go = function(e) { var v = (e && e.detail && e.detail.view) || 'center'; pendingView = null; setView(v); };
      window.addEventListener('minest:workspaces-changed', reload); window.addEventListener('minest:open-boards', go);
      return function() { window.removeEventListener('minest:workspaces-changed', reload); window.removeEventListener('minest:open-boards', go); };
    }, []);
    var modal = !(view === 'switch' && pinned);
    window.__mnBoardNavPinned = !modal;
    (0, _.useEffect)(function() {
      var R = document.documentElement; R.classList.add('mn-bn-open');
      return function() { R.classList.remove('mn-bn-open'); };
    }, []);
    (0, _.useEffect)(function() { return function() { window.__mnBoardNavPinned = false; }; }, []);
    (0, _.useEffect)(function() {
      if (!modal) return;
      var prev = document.activeElement, ov = document.body.style.overflow;
      document.body.style.overflow = 'hidden';
      return function() { document.body.style.overflow = ov; if (prev && prev.isConnected && prev.focus) try { prev.focus({ preventScroll: true }); } catch(e) {} };
    }, [modal]);
    (0, _.useEffect)(function() {
      var s = rootRef.current && rootRef.current.querySelector('[data-bn-search]');
      if (s && window.matchMedia && matchMedia('(pointer: fine)').matches) s.focus({ preventScroll: true });
    }, [view]);
    (0, _.useEffect)(function() {
      var keys = function(e) {
        if (e.key !== 'Escape') return;
        e.preventDefault(); e.stopPropagation();
        if (ask) setAsk(null); else if (menu) setMenu(null); else if (chipsOpen) setChipsOpen(false); else if (creating) setCreating(null); else props.onClose();
      };
      document.addEventListener('keydown', keys, true);
      return function() { document.removeEventListener('keydown', keys, true); };
    });

    // ---- data ----
    var visible = boards.filter(function(b) { return !b.archived; }), closed = boards.filter(function(b) { return b.archived; });
    var wsNames = (function() {
      var seen = {}, out = [];
      visible.forEach(function(b) { var w = wsOf(b); if (!seen[w]) { seen[w] = 1; out.push(w); } });
      (custom || []).forEach(function(w) { if (w && !seen[w]) { seen[w] = 1; out.push(w); } });
      return out.sort(function(a, b) { return a === 'General' ? -1 : b === 'General' ? 1 : a.localeCompare(b); });
    })();
    var needle = q.trim().toLowerCase();
    function match(b) { return !needle || ((b.title || '') + ' ' + (b.titleZh || '') + ' ' + wsOf(b)).toLowerCase().indexOf(needle) >= 0; }
    function inWs(b) { return wsSel === 'all' || wsOf(b) === wsSel; }
    function sorted(list) {
      var l = list.slice();
      if (sort === 'az') return l.sort(function(a, b) { return String(a.title || '').localeCompare(String(b.title || ''), undefined, { sensitivity: 'base', numeric: true }); });
      var rank = function(b) { var i = recents.indexOf(b.id); return i < 0 ? 1e6 : i; };
      return l.sort(function(a, b) { return rank(a) - rank(b); });
    }
    var starred = visible.filter(function(b) { return b.starred; });
    var recent = recents.map(function(id) { return visible.find(function(b) { return b.id === id; }); }).filter(Boolean);

    // ---- actions (all through the existing callbacks) ----
    function close() { props.onClose(); }
    function openBoard(b) {
      setRecents(pushRecent(b.id)); hap();
      props.onSelectBoard(b.id); snd('click');
      if (view === 'switch' && pinned) return;
      close();
    }
    function update(b, patch) { if (props.onUpdateBoard) props.onUpdateBoard(Object.assign({}, b, patch)); }
    function star(b) { update(b, { starred: !b.starred }); snd('click'); hap(); }
    function saveCustom(list) {
      try { window.MinestWorkspaceCloud.save(list); setCustom(window.MinestWorkspaceCloud.names()); return true; }
      catch(e) { toast('Cannot save this workspace on this device. Check available storage; existing workspaces are kept.'); return false; }
    }
    function moveBoard(b, ws) {
      ws = String(ws || '').trim(); if (!ws || ws === wsOf(b)) return;
      if (wsNames.indexOf(ws) < 0 && custom.indexOf(ws) < 0 && !saveCustom(custom.concat([ws]))) return;
      update(b, { workspace: ws }); snd('slide'); toast('✅ "' + b.title + '" moved to ' + ws);
    }
    function rename(b) { setMenu(null); setAsk({ title: 'Rename board', value: b.title || '', ok: function(v) { if (v !== b.title) { update(b, { title: v }); toast('✅ Board renamed'); } } }); }
    function duplicate(b) {
      setMenu(null);
      var had = !!props.hasBoardClipboard;
      if (!props.onCopyBoard || !props.onPasteBoard) return;
      props.onCopyBoard(b.id);
      setTimeout(function() {
        var p = propsRef.current; if (p.onPasteBoard) p.onPasteBoard();
        if (!had) setTimeout(function() { var p2 = propsRef.current; if (p2.onClearBoardClipboard) p2.onClearBoardClipboard(); }, 120);
        toast('✅ Duplicated "' + b.title + '"');
      }, 120);
    }
    function archive(b) {
      setMenu(null);
      if (visible.length <= 1) { toast('The last open board cannot be closed.'); return; }
      if (props.onArchiveBoard) { props.onArchiveBoard(b.id); snd('slide'); toast('Board closed — reopen it from Closed boards'); }
    }
    function remove(b) {
      setMenu(null);
      if (visible.length <= 1 && !b.archived) { toast('The last open board cannot be deleted.'); return; }
      GlassUI.confirm('Delete board "' + b.title + '" and all its lists and cards? This cannot be undone.').then(function(ok) { if (ok && propsRef.current.onDeleteBoard) propsRef.current.onDeleteBoard(b.id); });
    }
    function createBoard(title, ws) {
      title = String(title || '').trim(); if (!title) return;
      props.onCreateBoard(title, ws && ws !== 'all' ? ws : 'General'); snd('slide'); setCreating(null); close();
    }
    function newWorkspace() {
      setAsk({ title: 'Create workspace', value: '', placeholder: 'Workspace name', ok: function(v) {
        if (wsNames.indexOf(v) >= 0) { toast('A workspace called "' + v + '" already exists'); return; }
        if (saveCustom(custom.concat([v]))) { snd('add'); toast('✅ Workspace created: ' + v); setOpenWs(Object.assign({}, openWs, (function(o) { o[v] = true; return o; })({}))); setPage({ page: 'ws', ws: v, tab: 'boards' }); }
      } });
    }
    function renameWorkspace(old) {
      setMenu(null);
      setAsk({ title: 'Rename workspace', value: old, ok: function(v) {
        if (v === old) return;
        visible.concat(closed).forEach(function(b) { if (wsOf(b) === old) update(b, { workspace: v }); });
        var next = custom.filter(function(w) { return w !== old && w !== v; }).concat([v]);
        saveCustom(next); setPage({ page: 'ws', ws: v, tab: 'boards' }); if (wsSel === old) setWsSel(v);
        toast('✅ Workspace renamed: ' + v);
      } });
    }
    function deleteWorkspace(name) {
      setMenu(null);
      if (name === 'General') { toast('General is the default workspace and stays.'); return; }
      GlassUI.confirm('Delete workspace "' + name + '"?\nIts boards move to General — no board is deleted.').then(function(ok) {
        if (!ok) return;
        visible.concat(closed).forEach(function(b) { if (wsOf(b) === name) update(b, { workspace: 'General' }); });
        saveCustom(custom.filter(function(w) { return w !== name; }));
        setPage({ page: 'boards' }); if (wsSel === name) setWsSel('all');
        toast('✅ Workspace deleted; its boards are in General');
      });
    }
    function syncNow(e) {
      var btn = e.currentTarget;
      if (!window.minestCloudSyncNow) { toast('☁️ Sign in to Cloud Sync first'); return; }
      if (btn.classList.contains('mn-ws-sync-on')) return;
      btn.classList.add('mn-ws-sync-on'); snd('click');
      window.minestCloudSyncNow().then(function(done) { toast(done ? '☁️ Synced with the cloud' : '☁️ Changes queued — syncing with the cloud'); })
        .catch(function(err) { toast('☁️ Sync did not go through (' + ((err && (err.code || err.message)) || 'offline') + ')'); })
        .then(function() { setTimeout(function() { btn.classList.remove('mn-ws-sync-on'); }, 400); });
    }
    function exportJson() {
      var dl = document.createElement('a');
      dl.href = 'data:text/json;charset=utf-8,' + encodeURIComponent(JSON.stringify(boards, null, 2));
      dl.download = 'focusboard-backup-' + new Date().toISOString().slice(0, 10) + '.json';
      document.body.appendChild(dl); dl.click(); dl.remove();
    }
    function importJson(e) {
      var file = e.target.files && e.target.files[0], input = e.target; if (!file) return;
      var reader = new FileReader();
      reader.onload = function(evt) {
        var data;
        try { data = JSON.parse(String((evt.target && evt.target.result) || '').replace(/^﻿/, '').trim()); }
        catch(err) { toast('❌ Failed to parse JSON: ' + err.message); input.value = ''; return; }
        Promise.resolve(propsRef.current.onImportBoards(data)).then(function(res) {
          if (res && res.success) { snd('add'); toast('✅ ' + res.message); close(); }
          else if (res && !res.cancelled) toast('❌ Import failed: ' + (res.message || 'unknown error'));
        }).then(function() { input.value = ''; });
      };
      reader.onerror = function() { toast('❌ Could not read the file. Please try again.'); input.value = ''; };
      reader.readAsText(file, 'UTF-8');
    }
    function resetDefaults() {
      GlassUI.confirm('Reset to default system study boards? Your customized boards will be replaced.').then(function(ok) { if (!ok) return; propsRef.current.onResetDefaults(); snd('trash'); close(); });
    }
    function openMenu(e, b) {
      e.preventDefault(); e.stopPropagation();
      var r = e.currentTarget.getBoundingClientRect ? e.currentTarget.getBoundingClientRect() : null;
      var x = e.type === 'contextmenu' || !r ? e.clientX : r.right - 264, y = e.type === 'contextmenu' || !r ? e.clientY : r.bottom + 4;
      setMenu({ board: b, x: x, y: y, sub: null });
    }

    // ---- pieces ----
    function Tile(b, opts) {
      opts = opts || {};
      var cv = cover(b), cur = b.id === props.activeBoardId, row = opts.row;
      return h('div', { key: (opts.k || '') + b.id, className: 'mn-bn-tile' + (row ? ' is-row' : '') + (cur ? ' is-current' : '') + (b.starred ? ' is-starred' : ''),
          draggable: !!opts.drag, 'data-board-id': b.id,
          onDragStart: opts.drag ? function(e) { try { e.dataTransfer.setData('text/x-mn-board', b.id); e.dataTransfer.setData('text/plain', b.title || ''); e.dataTransfer.effectAllowed = 'move'; } catch(x) {} } : undefined,
          onContextMenu: opts.menu ? function(e) { openMenu(e, b); } : undefined },
        h('button', { type: 'button', className: 'mn-bn-cover', style: cv.style, 'aria-label': 'Open ' + (b.title || 'board') + (cur ? ' (current board)' : ''), 'aria-current': cur ? 'page' : undefined, title: b.title,
            onClick: function() { if (opts.use) opts.use(b); else openBoard(b); } },
          cv.img ? h('img', { src: cv.img, alt: '', loading: 'lazy', decoding: 'async', draggable: false, onError: function(e) { e.currentTarget.style.display = 'none'; } }) : null,
          row ? null : h('span', { className: 'mn-bn-shade', 'aria-hidden': true }),
          opts.use ? h('span', { className: 'mn-bn-usetpl' }, 'Use template') : null),
        h('div', { className: 'mn-bn-tname' },
          h('span', { className: 'mn-bn-ttl' }, b.title || 'Untitled'),
          opts.sub ? h('small', null, opts.sub(b)) : null),
        h('div', { className: 'mn-bn-tacts' },
          opts.menu ? h('button', { type: 'button', className: 'mn-bn-more', 'aria-label': 'Board actions for ' + b.title, 'aria-haspopup': 'menu', onClick: function(e) { openMenu(e, b); } }, ic('more')) : null,
          h('button', { type: 'button', className: 'mn-bn-star', 'aria-pressed': !!b.starred, 'aria-label': (b.starred ? 'Unstar ' : 'Star ') + (b.title || 'board'), title: b.starred ? 'Unstar' : 'Star', onClick: function(e) { e.stopPropagation(); star(b); } }, ic('star', b.starred ? 'is-fill' : ''))));
    }
    function Grid(list, opts) {
      opts = opts || {};
      var kids = list.map(function(b) { return Tile(b, opts); });
      if (opts.create !== undefined) kids.push(CreateTile(opts.create, opts.k));
      return h('div', { className: 'mn-bn-grid' + (opts.row ? ' is-list' : '') + (opts.cls ? ' ' + opts.cls : '') }, kids);
    }
    function CreateTile(ws, k) {
      var key = 'create-' + (k || '') + ws;
      if (creating && creating.ws === ws && creating.k === k) {
        return h('form', { key: key, className: 'mn-bn-tile mn-bn-create is-form', onSubmit: function(e) { e.preventDefault(); createBoard(e.currentTarget.elements.title.value, ws); } },
          h('label', { className: 'mn-bn-create-l' }, 'Board title', h('input', { name: 'title', autoFocus: true, required: true, maxLength: 120, placeholder: 'e.g. Spring unit plan', autoComplete: 'off' })),
          h('small', null, 'in ' + (ws === 'all' ? 'General' : ws)),
          h('div', { className: 'mn-bn-create-b' },
            h('button', { type: 'submit', className: 'mn-bn-btn is-primary' }, 'Create'),
            h('button', { type: 'button', className: 'mn-bn-btn', onClick: function() { setCreating(null); } }, 'Cancel')));
      }
      return h('button', { key: key, type: 'button', className: 'mn-bn-tile mn-bn-create', onClick: function() { setCreating({ ws: ws, k: k }); } },
        h('span', null, 'Create new board'), h('small', null, ws === 'all' ? 'General' : ws));
    }
    function Section(title, icon, body, extra, key) {
      return h('section', { key: key || title, className: 'mn-bn-sec' },
        h('header', { className: 'mn-bn-sech' }, icon ? h('span', { className: 'mn-bn-secic', 'aria-hidden': true }, icon) : null, h('h3', null, title), extra || null),
        body);
    }
    function Empty(t) { return h('p', { className: 'mn-bn-empty', role: 'status' }, t); }
    function Avatar(name, small) { return h('span', { className: 'mn-bn-av' + (small ? ' is-sm' : ''), style: { background: wsColor(name) }, 'aria-hidden': true }, initial(name)); }
    function dropProps(ws) {
      return {
        onDragOver: function(e) { var t = e.dataTransfer && e.dataTransfer.types; if (t && Array.prototype.indexOf.call(t, 'text/x-mn-board') >= 0) { e.preventDefault(); e.dataTransfer.dropEffect = 'move'; if (dropWs !== ws) setDropWs(ws); } },
        onDragLeave: function(e) { if (!e.currentTarget.contains(e.relatedTarget)) setDropWs(null); },
        onDrop: function(e) { e.preventDefault(); setDropWs(null); var id = e.dataTransfer.getData('text/x-mn-board'), b = boards.find(function(x) { return x.id === id; }); if (b) moveBoard(b, ws); }
      };
    }

    // ---- the board menu (⋯ / right-click) ----
    function Menu() {
      if (!menu) return null;
      var b = boards.find(function(x) { return x.id === menu.board.id; }) || menu.board, sub = menu.sub;
      var W = 264, x = Math.max(8, Math.min(innerWidth - W - 8 - (document.documentElement.classList.contains('duo-dockpin') ? (parseFloat(getComputedStyle(document.documentElement).getPropertyValue('--duo-dock')) || 84) : 0), menu.x)), y = Math.max(8, Math.min(innerHeight - 380, menu.y));
      function item(label, fn, cls, k) { return h('button', { key: k || label, type: 'button', role: 'menuitem', className: 'mn-bn-mi' + (cls ? ' ' + cls : ''), onClick: fn }, label); }
      var body;
      if (sub === 'cover') {
        body = [
          h('div', { key: 'hd', className: 'mn-bn-mhead' }, h('button', { type: 'button', className: 'mn-bn-mback', 'aria-label': 'Back', onClick: function() { setMenu(Object.assign({}, menu, { sub: null })); } }, ic('back')), 'Board cover'),
          h('div', { key: 'c', className: 'mn-bn-swatches', role: 'group', 'aria-label': 'Colours' }, COLORS.map(function(c) { return h('button', { key: c, type: 'button', className: 'mn-bn-sw' + (!b.wallpaper && b.color === c ? ' is-on' : ''), style: { background: c }, 'aria-label': 'Colour ' + c, onClick: function() { update(b, { color: c, wallpaper: '' }); } }); })),
          gradients().length ? h('div', { key: 'g', className: 'mn-bn-swatches', role: 'group', 'aria-label': 'Gradients' }, gradients().map(function(g) { return h('button', { key: g.id, type: 'button', className: 'mn-bn-sw' + (b.wallpaper === g.value ? ' is-on' : ''), style: { background: g.value }, 'aria-label': g.name, title: g.name, onClick: function() { update(b, { wallpaper: g.value }); } }); })) : null,
          photos().length ? h('div', { key: 'p', className: 'mn-bn-swatches is-photos', role: 'group', 'aria-label': 'Photos' }, photos().map(function(p) { var th = String(p.url).replace(/w=\d+/, 'w=240'); return h('button', { key: p.id, type: 'button', className: 'mn-bn-sw' + (b.wallpaper === p.url ? ' is-on' : ''), style: { backgroundImage: 'url("' + th + '")' }, 'aria-label': p.name, title: p.name, onClick: function() { update(b, { wallpaper: p.url }); } }); })) : null,
          item('Remove picture / gradient', function() { update(b, { wallpaper: '' }); }, null, 'rm')
        ];
      } else if (sub === 'move') {
        body = [h('div', { key: 'hd', className: 'mn-bn-mhead' }, h('button', { type: 'button', className: 'mn-bn-mback', 'aria-label': 'Back', onClick: function() { setMenu(Object.assign({}, menu, { sub: null })); } }, ic('back')), 'Move to workspace')]
          .concat(wsNames.map(function(w) { var on = w === wsOf(b); return h('button', { key: 'w' + w, type: 'button', role: 'menuitemradio', 'aria-checked': on, className: 'mn-bn-mi' + (on ? ' is-on' : ''), onClick: function() { setMenu(null); moveBoard(b, w); } }, Avatar(w, true), h('span', null, w), on ? h('i', null, '✓') : null); }))
          .concat([item('+ New workspace…', function() { setMenu(null); setAsk({ title: 'Move to a new workspace', value: '', placeholder: 'Workspace name', ok: function(v) { moveBoard(b, v); } }); }, null, 'nw')]);
      } else {
        body = [
          h('div', { key: 'hd', className: 'mn-bn-mhead' }, h('span', { className: 'mn-bn-mthumb', style: cover(b).style }), h('span', { className: 'mn-bn-mtitle' }, b.title)),
          b.archived ? null : item('Open board', function() { setMenu(null); openBoard(b); }, null, 'open'),
          b.archived ? null : item(b.starred ? '★ Unstar' : '☆ Star', function() { star(b); }, null, 'star'),
          item('Rename…', function() { rename(b); }, null, 'ren'),
          item('Change cover…', function() { setMenu(Object.assign({}, menu, { sub: 'cover' })); }, 'has-sub', 'cov'),
          item('Move to workspace…', function() { setMenu(Object.assign({}, menu, { sub: 'move' })); }, 'has-sub', 'mv'),
          item('Duplicate', function() { duplicate(b); }, null, 'dup'),
          props.onCopyBoard ? item('Copy to clipboard', function() { setMenu(null); props.onCopyBoard(b.id); }, null, 'cp') : null,
          window.MinestCovers821 ? item(window.MinestCovers821.anyVisible(b) ? 'Hide card covers' : 'Show card covers', function() { setMenu(null); window.MinestCovers821.toggleBoard(b); }, null, 'cc') : null,
          h('hr', { key: 'hr' }),
          b.archived ? item('Reopen board', function() { setMenu(null); props.onRestoreBoard && props.onRestoreBoard(b.id); }, null, 'ro') : item('Close (archive) board', function() { archive(b); }, null, 'ar'),
          item('Delete board…', function() { remove(b); }, 'is-danger', 'del')
        ];
      }
      return h('div', { className: 'mn-bn-menu-scrim', onMouseDown: function(e) { if (e.target === e.currentTarget) setMenu(null); }, onClick: function(e) { if (e.target === e.currentTarget) setMenu(null); } },
        h('div', { className: 'mn-bn-menu', role: 'menu', 'aria-label': 'Board actions', style: { left: x + 'px', top: y + 'px', width: W + 'px' } }, body));
    }
    function Ask() {
      if (!ask) return null;
      return h('div', { className: 'mn-bn-menu-scrim is-ask', onClick: function(e) { if (e.target === e.currentTarget) setAsk(null); } },
        h('form', { className: 'mn-bn-ask', role: 'dialog', 'aria-label': ask.title, onSubmit: function(e) { e.preventDefault(); var v = String(e.currentTarget.elements.v.value || '').trim(); if (!v) return; var fn = ask.ok; setAsk(null); fn(v); } },
          h('h4', null, ask.title),
          h('input', { name: 'v', defaultValue: ask.value, placeholder: ask.placeholder || '', autoFocus: true, required: true, maxLength: 120, autoComplete: 'off', onFocus: function(e) { e.currentTarget.select(); } }),
          h('div', { className: 'mn-bn-askb' },
            h('button', { type: 'button', className: 'mn-bn-btn', onClick: function() { setAsk(null); } }, 'Cancel'),
            h('button', { type: 'submit', className: 'mn-bn-btn is-primary' }, 'Save'))));
    }

    // ---- 1. the switcher (Trello "Switch boards") ----
    function Switcher() {
      var row = layout === 'list';
      var max = innerWidth < 560 ? 2 : innerWidth < 900 ? 4 : 6, chips = ['all'].concat(wsNames), shown = chips.slice(0, max + 1), extra = chips.slice(max + 1);
      if (wsSel !== 'all' && shown.indexOf(wsSel) < 0) { shown = shown.slice(0, max).concat([wsSel]); extra = chips.filter(function(c) { return shown.indexOf(c) < 0; }); }
      var opts = { row: row, menu: true, k: '', sub: row || wsSel === 'all' ? wsOf : null };
      var sections;
      if (needle) {
        var hits = sorted(visible.filter(function(b) { return match(b) && inWs(b); }));
        sections = [Section('Boards matching “' + q.trim() + '”', null, hits.length ? Grid(hits, Object.assign({}, opts, { k: 's' })) : Empty('No boards match this search.'), null, 'search')];
      } else {
        var st = starred.filter(inWs), rc = recent.filter(inWs).slice(0, row ? 8 : 8);
        sections = [
          Section('Starred boards', '★', st.length ? Grid(st, Object.assign({}, opts, { k: 'st' })) : Empty('Star a board (☆ on its tile) to keep it here.'), null, 'st'),
          Section('Recent boards', '🕘', rc.length ? Grid(rc, Object.assign({}, opts, { k: 'rc' })) : Empty('Boards you open appear here.'), null, 'rc')
        ];
        if (wsSel !== 'all') sections.push(Section(wsSel, null, Grid(sorted(visible.filter(inWs)), Object.assign({}, opts, { k: 'ws', create: wsSel })), null, 'ws'));
      }
      return h('div', { className: 'mn-bn-switch' + (pinned ? ' is-pinned' : ''), role: 'dialog', 'aria-modal': modal, 'aria-label': 'Switch boards', onClick: function(e) { e.stopPropagation(); } },
        h('div', { className: 'mn-bn-shead' },
          h('label', { className: 'mn-bn-search' }, ic('search'), h('input', { 'data-bn-search': true, type: 'search', value: q, placeholder: 'Search your boards', 'aria-label': 'Search your boards', onChange: function(e) { setQ(e.target.value); } })),
          h('button', { type: 'button', className: 'mn-bn-iconbtn', 'aria-label': row ? 'Show as grid' : 'Show as list', title: row ? 'Grid view' : 'List view', onClick: function() { var v = row ? 'grid' : 'list'; prefs.layout = v; setLayout(v); } }, ic(row ? 'grid' : 'list')),
          h('button', { type: 'button', className: 'mn-bn-iconbtn' + (pinned ? ' is-on' : ''), 'aria-pressed': pinned, 'aria-label': pinned ? 'Unpin the board switcher' : 'Pin the board switcher open', title: pinned ? 'Unpin' : 'Pin open', onClick: function() { prefs.pinned = !pinned; setPinned(!pinned); } }, ic('pin')),
          h('button', { type: 'button', className: 'mn-bn-iconbtn', 'aria-label': 'Close board switcher', onClick: close }, ic('close'))),
        h('div', { className: 'mn-bn-chips', role: 'tablist', 'aria-label': 'Workspaces' },
          shown.map(function(w) { var on = wsSel === w; return h('button', { key: 'c' + w, type: 'button', role: 'tab', 'aria-selected': on, className: 'mn-bn-chip' + (on ? ' is-on' : ''), onClick: function() { setWsSel(w); setChipsOpen(false); } }, w === 'all' ? 'All' : w); }),
          extra.length ? h('div', { className: 'mn-bn-chipmore' },
            h('button', { type: 'button', className: 'mn-bn-chip', 'aria-expanded': chipsOpen, 'aria-label': 'More workspaces', onClick: function() { setChipsOpen(!chipsOpen); } }, '⌄'),
            chipsOpen ? h('div', { className: 'mn-bn-chipmenu', role: 'menu' }, extra.map(function(w) { return h('button', { key: 'x' + w, type: 'button', role: 'menuitem', onClick: function() { setWsSel(w); setChipsOpen(false); } }, Avatar(w, true), w); })) : null) : null),
        h('div', { className: 'mn-bn-sbody' }, sections),
        h('div', { className: 'mn-bn-sfoot' },
          h('button', { type: 'button', className: 'mn-bn-link', onClick: function() { setView('center'); setPage({ page: 'boards' }); } }, ic('boards'), 'View all boards'),
          h('button', { type: 'button', className: 'mn-bn-link', onClick: function() { setView('center'); setPage(wsSel !== 'all' ? { page: 'ws', ws: wsSel, tab: 'boards' } : { page: 'boards' }); setCreating({ ws: wsSel === 'all' ? 'General' : wsSel, k: 'w' }); } }, ic('plus'), 'Create board')));
    }

    // ---- 2. the Board Center page (Trello boards page) ----
    function Sidebar() {
      function nav(id, label, icon) { var on = page.page === id; return h('button', { key: id, type: 'button', className: 'mn-bn-nav' + (on ? ' is-on' : ''), 'aria-current': on ? 'page' : undefined, onClick: function() { setPage({ page: id }); setSideOpen(false); } }, ic(icon), h('span', null, label)); }
      return h('nav', { className: 'mn-bn-side' + (sideOpen ? ' is-open' : ''), 'aria-label': 'Board Center' },
        nav('boards', 'Boards', 'boards'), nav('templates', 'Templates', 'templates'), nav('home', 'Home', 'home'),
        h('div', { className: 'mn-bn-sidehd' }, h('span', null, 'Workspaces'), h('button', { type: 'button', className: 'mn-bn-iconbtn is-sm', 'aria-label': 'Create workspace', title: 'Create workspace', onClick: newWorkspace }, ic('plus'))),
        wsNames.map(function(w) {
          var open = !!openWs[w], here = page.page === 'ws' && page.ws === w, n = visible.filter(function(b) { return wsOf(b) === w; }).length;
          function sub(tab, label, icon) { var on = here && page.tab === tab; return h('button', { key: tab, type: 'button', className: 'mn-bn-nav is-sub' + (on ? ' is-on' : ''), onClick: function() { setPage({ page: 'ws', ws: w, tab: tab }); setSideOpen(false); } }, ic(icon), h('span', null, label)); }
          return h('div', Object.assign({ key: 'ws' + w, className: 'mn-bn-wsgroup' + (dropWs === w ? ' is-drop' : '') }, dropProps(w)),
            h('button', { type: 'button', className: 'mn-bn-nav is-ws', 'aria-expanded': open, onClick: function() { var o = Object.assign({}, openWs); o[w] = !open; setOpenWs(o); } },
              Avatar(w, true), h('span', null, w), h('small', null, n), ic('down', 'mn-bn-chev' + (open ? ' is-open' : ''))),
            open ? h('div', { className: 'mn-bn-wssub' }, sub('boards', 'Boards', 'boards'), sub('settings', 'Settings', 'gear'), sub('members', 'Members', 'people')) : null);
        }),
        closed.length ? h('button', { type: 'button', className: 'mn-bn-nav is-closed' + (page.page === 'closed' ? ' is-on' : ''), onClick: function() { setPage({ page: 'closed' }); setSideOpen(false); } }, ic('archive'), h('span', null, 'Closed boards'), h('small', null, closed.length)) : null);
    }
    function SortBar() {
      return h('div', { className: 'mn-bn-sort', role: 'group', 'aria-label': 'Sort boards' },
        h('span', null, 'Sort'),
        [['recent', 'Most recent'], ['az', 'A–Z']].map(function(s) { var on = sort === s[0]; return h('button', { key: s[0], type: 'button', 'aria-pressed': on, className: on ? 'is-on' : '', onClick: function() { prefs.sort = s[0]; setSort(s[0]); } }, s[1]); }));
    }
    function WsHeader(w, big) {
      return h('header', { className: 'mn-bn-wsh' + (big ? ' is-big' : '') }, Avatar(w), h('h3', null, w),
        h('div', { className: 'mn-bn-wsbtns' },
          h('button', { type: 'button', className: 'mn-bn-btn is-sm', onClick: function() { setPage({ page: 'ws', ws: w, tab: 'boards' }); } }, ic('boards'), 'Boards'),
          h('button', { type: 'button', className: 'mn-bn-btn is-sm', onClick: function() { setPage({ page: 'ws', ws: w, tab: 'members' }); } }, ic('people'), 'Members'),
          h('button', { type: 'button', className: 'mn-bn-btn is-sm', onClick: function() { setPage({ page: 'ws', ws: w, tab: 'settings' }); } }, ic('gear'), 'Settings')));
    }
    function Main() {
      var opts = { menu: true, drag: true }, list = function(l) { return l.filter(match); };
      if (page.page === 'templates') {
        var all = sorted(list(visible));
        return [h('div', { key: 'h', className: 'mn-bn-mainh' }, h('h2', null, 'Templates'), h('p', null, 'Start a new board from any of your boards: lists, cards and settings are duplicated, the original stays as it is.')),
          all.length ? Grid(all, { k: 't', use: duplicate, sub: wsOf }) : Empty('No boards match this search.')];
      }
      if (page.page === 'home') {
        var hs = list(starred), hr = list(recent).slice(0, 8);
        return [h('div', { key: 'h', className: 'mn-bn-mainh' }, h('h2', null, 'Home')),
          h('div', { key: 'qa', className: 'mn-bn-quick' },
            h('button', { type: 'button', className: 'mn-bn-btn is-primary', onClick: function() { setPage({ page: 'boards' }); setCreating({ ws: 'General', k: 'w' }); } }, ic('plus'), 'Create board'),
            h('button', { type: 'button', className: 'mn-bn-btn', onClick: newWorkspace }, ic('plus'), 'Create workspace'),
            props.hasBoardClipboard ? h('button', { type: 'button', className: 'mn-bn-btn', onClick: function() { if (props.onPasteBoard) props.onPasteBoard(); close(); } }, 'Paste board from clipboard') : null,
            props.hasBoardClipboard ? h('button', { type: 'button', className: 'mn-bn-btn', onClick: function() { if (props.onClearBoardClipboard) props.onClearBoardClipboard(); } }, 'Clear clipboard') : null),
          hs.length ? Section('Starred boards', '★', Grid(hs, Object.assign({ k: 'hs' }, opts)), null, 'hs') : null,
          Section('Recently viewed', '🕘', hr.length ? Grid(hr, Object.assign({ k: 'hr' }, opts)) : Empty('Boards you open appear here.'), null, 'hr'),
          Section('Backup & import', null, h('div', { className: 'mn-bn-quick' },
            h('button', { type: 'button', className: 'mn-bn-btn', onClick: function() { var ab = boards.find(function(b) { return b.id === props.activeBoardId; }) || boards[0]; try { exportBoardToMarkdown(ab); } catch(e) {} } }, 'Export current board (MD)'),
            h('button', { type: 'button', className: 'mn-bn-btn', onClick: exportJson }, 'JSON backup'),
            h('label', { className: 'mn-bn-btn' }, 'Import JSON', h('input', { type: 'file', accept: '.json', className: 'mn-bn-file', onChange: importJson })),
            h('button', { type: 'button', className: 'mn-bn-btn is-danger', onClick: resetDefaults }, 'Reset defaults')), null, 'bk')];
      }
      if (page.page === 'closed') {
        return [h('div', { key: 'h', className: 'mn-bn-mainh' }, h('h2', null, 'Closed boards'), h('p', null, 'Closed (archived) boards keep everything and sync as usual. Reopen one, or delete it for good.')),
          h('ul', { key: 'l', className: 'mn-bn-closed' }, closed.filter(match).map(function(b) {
            return h('li', { key: b.id }, h('span', { className: 'mn-bn-mthumb', style: cover(b).style }), h('span', { className: 'mn-bn-cttl' }, b.title, h('small', null, wsOf(b))),
              h('button', { type: 'button', className: 'mn-bn-btn is-sm', onClick: function() { props.onRestoreBoard && props.onRestoreBoard(b.id); snd('add'); } }, 'Reopen'),
              h('button', { type: 'button', className: 'mn-bn-btn is-sm is-danger', onClick: function() { remove(b); } }, 'Delete'));
          }))];
      }
      if (page.page === 'ws') {
        var w = page.ws, tab = page.tab || 'boards', wb = visible.filter(function(b) { return wsOf(b) === w; });
        var tabs = h('div', { key: 'tabs', className: 'mn-bn-tabs', role: 'tablist' }, [['boards', 'Boards'], ['members', 'Members'], ['settings', 'Settings']].map(function(t) { var on = tab === t[0]; return h('button', { key: t[0], type: 'button', role: 'tab', 'aria-selected': on, className: on ? 'is-on' : '', onClick: function() { setPage({ page: 'ws', ws: w, tab: t[0] }); } }, t[1]); }));
        var head = h('div', Object.assign({ key: 'h', className: 'mn-bn-mainh is-ws' + (dropWs === w ? ' is-drop' : '') }, dropProps(w)), Avatar(w), h('div', null, h('h2', null, w), h('p', null, wb.length + (wb.length === 1 ? ' board' : ' boards') + ' · Private')));
        if (tab === 'settings') return [head, tabs, h('div', { key: 's', className: 'mn-bn-settings' },
          h('div', { className: 'mn-bn-setrow' }, h('div', null, h('b', null, 'Workspace name'), h('p', null, w)), h('button', { type: 'button', className: 'mn-bn-btn', onClick: function() { renameWorkspace(w); } }, 'Rename')),
          h('div', { className: 'mn-bn-setrow' }, h('div', null, h('b', null, 'Delete this workspace'), h('p', null, 'Its boards move to General; no board or card is deleted.')), h('button', { type: 'button', className: 'mn-bn-btn is-danger', disabled: w === 'General', onClick: function() { deleteWorkspace(w); } }, 'Delete workspace')))];
        if (tab === 'members') return [head, tabs, h('div', { key: 'm', className: 'mn-bn-settings' },
          h('div', { className: 'mn-bn-setrow' }, h('div', null, h('b', null, 'Members'), h('p', null, 'Only you. This workspace syncs to your devices with Cloud Sync.')), h('span', { className: 'mn-ws-cloud mn-bn-cloud2', ref: function(el) { if (el && window.minestCloudLine) window.minestCloudLine(el); } })))];
        return [head, tabs, h('div', { key: 'sb', className: 'mn-bn-toolrow' }, SortBar()), Grid(sorted(list(wb)), Object.assign({ k: 'w', create: w }, opts))];
      }
      // Boards: Starred · Recently viewed · YOUR WORKSPACES
      var st = list(starred), rc = list(recent).slice(0, 8);
      var out = [h('div', { key: 'tb', className: 'mn-bn-toolrow' }, SortBar())];
      if (st.length) out.push(Section('Starred boards', '★', Grid(sorted(st), Object.assign({ k: 's' }, opts)), null, 'st'));
      if (rc.length && !needle) out.push(Section('Recently viewed', '🕘', Grid(rc, Object.assign({ k: 'r' }, opts)), null, 'rc'));
      out.push(h('h4', { key: 'yw', className: 'mn-bn-cap' }, 'YOUR WORKSPACES'));
      wsNames.forEach(function(w) {
        var wb = sorted(list(visible.filter(function(b) { return wsOf(b) === w; })));
        if (needle && !wb.length) return;
        out.push(h('section', Object.assign({ key: 'w' + w, className: 'mn-bn-sec is-ws' + (dropWs === w ? ' is-drop' : '') }, dropProps(w)), WsHeader(w), Grid(wb, Object.assign({ k: 'w', create: w }, opts))));
      });
      if (!wsNames.length) out.push(Grid([], { create: 'General', k: 'w' }));
      return out;
    }
    function Center() {
      return h('div', { className: 'mn-bn-center', role: 'dialog', 'aria-modal': true, 'aria-label': 'Board Center', onClick: function(e) { e.stopPropagation(); } },
        h('div', { className: 'mn-bn-top' },
          h('button', { type: 'button', className: 'mn-bn-iconbtn mn-bn-sidetoggle', 'aria-label': 'Workspaces menu', 'aria-expanded': sideOpen, onClick: function() { setSideOpen(!sideOpen); } }, ic('menu')),
          h('div', { className: 'mn-bn-toptitle' }, h('h2', { className: 'mn-ws-title' }, 'Boards', h('small', { className: 'mn-ws-sub' }, visible.length + ' boards')),
            h('span', { className: 'mn-ws-cloud', ref: function(el) { if (el && window.minestCloudLine) window.minestCloudLine(el); } })),
          h('label', { className: 'mn-bn-search' }, ic('search'), h('input', { 'data-bn-search': true, type: 'search', value: q, placeholder: 'Search boards', 'aria-label': 'Search boards', onChange: function(e) { setQ(e.target.value); } })),
          h('button', { type: 'button', className: 'mn-ws-sync mn-bn-iconbtn', title: 'Sync with the cloud now', 'aria-label': 'Sync with the cloud now', onClick: syncNow }, ic('sync')),
          h('button', { type: 'button', className: 'mn-bn-iconbtn', title: 'Switch boards', 'aria-label': 'Back to the board switcher', onClick: function() { setView('switch'); } }, ic('grid')),
          h('button', { type: 'button', className: 'mn-bn-iconbtn', 'aria-label': 'Close Board Center', onClick: close }, ic('close'))),
        h('div', { className: 'mn-bn-body' }, Sidebar(), sideOpen ? h('div', { className: 'mn-bn-sidescrim', onClick: function() { setSideOpen(false); } }) : null, h('main', { className: 'mn-bn-main' }, Main())));
    }

    var cls = 'mn-bn-root ' + (isDark ? 'is-dark' : 'is-light') + ' is-' + view + (modal ? '' : ' is-docked');
    return m().createPortal(h('div', { ref: rootRef, className: cls, onClick: function(e) { if (e.target === e.currentTarget && modal) close(); } },
      view === 'center' ? Center() : Switcher(), Menu(), Ask()), document.body);
  }
  return { Root: Root };
})();
/* MN-BOARD-NAV:END */

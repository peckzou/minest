function minestMerge3(base, local, remote, mineNewer) { return window.MinestBoardMerge(base, local, remote, mineNewer); }
/* 2026-11-26 · board sync repair (tools/cloud-transport/board-app.js, inserted by patch_board_sync.py).
   Built-in boards (EC6 Outline, EC6 Glossary) are rebuilt from the page, not stored whole in the cloud copy. Before
   this, every cloud copy that came in replaced them with fresh defaults, so ticks and mastery on them were lost on
   each sync and never reached other devices. Now: this device keeps its own built-in boards, and the cloud doc
   carries only what differs from the default, card by card (builtinEdits), newest edit per card wins. */
var MINEST_BUILTIN_BOARD_IDS = { 'board-ec6-outline': 1, 'board-ec6-glossary': 1 };
var MINEST_BUILTIN_EDITS_KEY = 'minest.builtinEdits.v1';
function minestIsBuiltin(b) { return !!(b && MINEST_BUILTIN_BOARD_IDS[b.id]); }
function minestNoBuiltins(list) { return Array.isArray(list) ? list.filter(function(b) { return !minestIsBuiltin(b); }) : list; }
/* `list` with this device's own built-in boards in place of whatever built-in boards it has */
function minestKeepBuiltins(list, local) {
  if (!Array.isArray(list)) return list;
  return (local || []).filter(minestIsBuiltin).concat(minestNoBuiltins(list));
}
function minestBuiltinDefaults() {
  if (!minestBuiltinDefaults.c) {
    var m = {};
    sanitizeLoadedBoards([MINEST_EC6_OUTLINE, MINEST_EC6_GLOSSARY]).forEach(function(b) { if (minestIsBuiltin(b)) m[b.id] = b; });
    minestBuiltinDefaults.c = m;
  }
  return minestBuiltinDefaults.c;
}
function minestBuiltinStore() {
  try { var s = JSON.parse((window.MinestDurableStorage || localStorage).getItem(MINEST_BUILTIN_EDITS_KEY) || 'null'); return s && typeof s === 'object' ? s : {}; } catch (e) { return {}; }
}
function minestBuiltinStoreSave(s) { try { (window.MinestDurableStorage || localStorage).setItem(MINEST_BUILTIN_EDITS_KEY, JSON.stringify(s)); } catch (e) {} }
function minestBuiltinCards(board) {
  var m = {};
  ((board && board.columns) || []).forEach(function(c, ci) {
    ((c && c.cards) || []).forEach(function(k, ki) { if (k && k.id != null && !(k.id in m)) m[k.id] = { col: c.id, at: ki, card: k }; });
  });
  return m;
}
/* what this board has that the default does not: {cardId: {f: changed fields, u: removed fields, c: list} | {del} | {add, c}} */
function minestBuiltinDiff(board, def) {
  var out = {}, D = minestBuiltinCards(def), L = minestBuiltinCards(board);
  Object.keys(D).forEach(function(id) {
    var d = D[id], l = L[id];
    if (!l) { out[id] = { del: 1 }; return; }
    var e = {}, f = {}, n = 0;
    Object.keys(l.card).forEach(function(k) { if (k !== 'id' && JSON.stringify(l.card[k]) !== JSON.stringify(d.card[k])) { f[k] = l.card[k]; n++; } });
    var u = Object.keys(d.card).filter(function(k) { return !(k in l.card); });
    if (n) e.f = f; if (u.length) e.u = u; if (l.col !== d.col) e.c = l.col;
    if (n || u.length || e.c) out[id] = e;
  });
  Object.keys(L).forEach(function(id) { if (!D[id]) out[id] = { add: L[id].card, c: L[id].col }; });
  return out;
}
/* stamp this device's built-in edits (a card whose difference from the default changed gets the time now) */
function minestBuiltinStamp(boards) {
  var defs = minestBuiltinDefaults(), store = minestBuiltinStore(), now = Date.now(), changed = false;
  (boards || []).forEach(function(b) {
    if (!minestIsBuiltin(b) || !defs[b.id]) return;
    var cur = minestBuiltinDiff(b, defs[b.id]), st = store[b.id] || {};
    Object.keys(cur).concat(Object.keys(st)).forEach(function(id) {
      var e = JSON.stringify(cur[id] || {});
      if (st[id] ? st[id].e === e : e === '{}') return;
      st[id] = { t: now, e: e }; changed = true;
    });
    if (Object.keys(st).length) store[b.id] = st;
  });
  if (changed) minestBuiltinStoreSave(store);
  return store;
}
/* the field for the cloud doc, or null when there is nothing (an empty map would wipe the cloud's entries) */
function minestBuiltinEditsPayload(boards) {
  var store = minestBuiltinStamp(boards), out = null;
  Object.keys(store).forEach(function(bid) { if (MINEST_BUILTIN_BOARD_IDS[bid] && store[bid] && Object.keys(store[bid]).length) { out = out || {}; out[bid] = store[bid]; } });
  return out;
}
/* the cloud's built-in edits that are newer than this device's: {boardId: {cardId: entry}}; this device now holds them */
function minestBuiltinIncoming(remote, localBoards) {
  var todo = {};
  if (!remote || typeof remote !== 'object') return todo;
  var store = minestBuiltinStamp(localBoards), changed = false;
  Object.keys(remote).forEach(function(bid) {
    var rb = remote[bid]; if (!MINEST_BUILTIN_BOARD_IDS[bid] || !rb || typeof rb !== 'object') return;
    var st = store[bid] || (store[bid] = {});
    Object.keys(rb).forEach(function(id) {
      var r = rb[id], e; if (!r || typeof r.e !== 'string') return;
      if (st[id] && (Number(st[id].t) || 0) >= (Number(r.t) || 0)) return;
      try { e = JSON.parse(r.e); } catch (err) { return; }
      (todo[bid] = todo[bid] || {})[id] = e; st[id] = { t: Number(r.t) || 0, e: r.e }; changed = true;
    });
  });
  if (changed) minestBuiltinStoreSave(store);
  return todo;
}
/* apply incoming built-in edits to these boards (pure; the same array when there is nothing to do) */
function minestBuiltinPatchAll(boards, todo) {
  if (!todo || !Object.keys(todo).length || !Array.isArray(boards)) return boards;
  var defs = minestBuiltinDefaults();
  return boards.map(function(b) {
    var edits = b && todo[b.id], def = b && defs[b.id];
    if (!edits || !def) return b;
    var D = minestBuiltinCards(def), out = JSON.parse(JSON.stringify(b));
    Object.keys(edits).forEach(function(id) {
      var e = edits[id] || {}, d = D[id], was = null;
      (out.columns || []).forEach(function(c) {
        if (!c || !c.cards) return;
        var i = c.cards.findIndex(function(k) { return k && k.id === id; });
        if (i >= 0) { was = { col: c.id, at: i }; c.cards.splice(i, 1); }
      });
      if (e.del) return;
      var card, col;
      if (e.add) { card = e.add; col = e.c || (was && was.col); }
      else if (d) { card = Object.assign(JSON.parse(JSON.stringify(d.card)), e.f || {}); (e.u || []).forEach(function(k) { delete card[k]; }); col = e.c || d.col; }
      else return;
      var find = function(cid) { return (out.columns || []).filter(function(c) { return c && c.id === cid; })[0]; };
      var target = find(col) || (was && find(was.col)); if (!target) return;
      target.cards = target.cards || [];
      var at = was && was.col === target.id ? was.at : (d && d.col === target.id ? d.at : target.cards.length);
      target.cards.splice(Math.min(at, target.cards.length), 0, card);
    });
    return out;
  });
}

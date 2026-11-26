(function(root){
/* Board three-way merge (2026-11-26, board sync repair).
   base = the boards as the cloud last had them, local = this device, remote = the server now.
   - Boards, lists and cards are merged field by field: a field only one side changed takes that side; a field both
     sides changed takes the newer side (mineNewer). So a tick on one device and a title edit on another both survive.
   - Added on either side is kept. Deleted on one side is dropped only if the other side left it untouched.
   - Order is merged too: a side that reordered (and the other did not) keeps its order. Before this, the server's
     order always won, so a reorder made on this device was reverted by the next upload.
   - A card moved to another list follows the move, and an edit made elsewhere to that card is kept with it.
   - A card's stacked cards and checklist items are merged item by item too.
   - Without a base nothing is inferred deleted. */
function minestSame(a,b){return JSON.stringify(a)===JSON.stringify(b);}
function minestMerge3(base, local, remote, mineNewer) {
  function has(x) { return !!x && typeof x === 'object' && x.id != null; }
  function ids(a) { var out = [], seen = {}; (a || []).forEach(function(x) { if (has(x) && !seen[x.id]) { seen[x.id] = 1; out.push(x.id); } }); return out; }
  function idx(a) { var m = {}; (a || []).forEach(function(x) { if (has(x) && !(x.id in m)) m[x.id] = x; }); return m; }
  function clone(x) { return x === undefined ? undefined : JSON.parse(JSON.stringify(x)); }
  /* field-level three-way of one object; `skip` (its child list) is left out */
  function fields(b, l, r, skip) {
    if (!l) return clone(r); if (!r) return clone(l);
    var out = {}, keys = {};
    Object.keys(l).concat(Object.keys(r)).forEach(function(k) { if (k !== skip) keys[k] = 1; });
    Object.keys(keys).forEach(function(k) {
      var lv = l[k], rv = r[k], v;
      if (minestSame(lv, rv)) v = lv;
      else if (LISTS[k] && Array.isArray(lv) && Array.isArray(rv)) v = mergeList(b && Array.isArray(b[k]) ? b[k] : null, lv, rv);
      else {
        var lc = !b || !minestSame(b[k], lv), rc = !b || !minestSame(b[k], rv);
        v = (lc && !rc) ? lv : (rc && !lc) ? rv : (mineNewer ? lv : rv);
      }
      if (v !== undefined) out[k] = clone(v);
    });
    return out;
  }
  /* a card's stacked cards (My World's items) and checklist items: merged item by item like cards, so an item added,
     ticked or reordered on one device and another item changed on another device both survive */
  var LISTS = { stack: 1, checklistItems: 1 };
  function mergeList(b, l, r) {
    if (!l.every(has) || !r.every(has)) return mineNewer ? l : r;
    var B = idx(b), L = idx(l), R = idx(r), keep = {}, out = {};
    Object.keys(L).concat(Object.keys(R)).forEach(function(id) {
      if (out[id]) return;
      var bi = B[id], li = L[id], ri = R[id];
      if (li && ri) out[id] = fields(bi, li, ri, null);
      else if (li ? keepOne(bi, li) : keepOne(bi, ri)) out[id] = clone(li || ri);
      if (out[id]) keep[id] = 1;
    });
    return order(ids(b), ids(l), ids(r), keep).map(function(id) { return out[id]; });
  }
  /* present on one side only: dropped if the side that still has it left it as the base had it */
  function keepOne(b, x) { return !(b && minestSame(b, x)); }
  function seqChanged(bIds, xIds) {
    var inB = {}, inX = {}; bIds.forEach(function(i) { inB[i] = 1; }); xIds.forEach(function(i) { inX[i] = 1; });
    return bIds.filter(function(i) { return inX[i]; }).join('\u0001') !== xIds.filter(function(i) { return inB[i]; }).join('\u0001');
  }
  /* order the ids in `keep`, with the side that reordered as the skeleton; the rest go in after their neighbour */
  function order(bIds, lIds, rIds, keep) {
    var lc = seqChanged(bIds, lIds), rc = seqChanged(bIds, rIds);
    var useLocal = (lc && !rc) ? true : (rc && !lc) ? false : !!mineNewer;
    var primary = useLocal ? lIds : rIds, secondary = useLocal ? rIds : lIds;
    var out = [], placed = {};
    primary.forEach(function(i) { if (keep[i] && !placed[i]) { out.push(i); placed[i] = 1; } });
    [secondary, bIds].forEach(function(seq) {
      seq.forEach(function(i, n) {
        if (!keep[i] || placed[i]) return;
        var at = 0;
        for (var p = n - 1; p >= 0; p--) { var j = out.indexOf(seq[p]); if (j >= 0) { at = j + 1; break; } }
        out.splice(at, 0, i); placed[i] = 1;
      });
    });
    Object.keys(keep).forEach(function(i) { if (!placed[i]) { out.push(i); placed[i] = 1; } });
    return out;
  }
  function cardsOf(board) {
    var m = {};
    ((board && board.columns) || []).forEach(function(c) {
      if (!has(c)) return;
      (c.cards || []).forEach(function(k) { if (has(k) && !(k.id in m)) m[k.id] = { col: c.id, card: k }; });
    });
    return m;
  }
  function colIds(board, colId) {
    var c = ((board && board.columns) || []).filter(function(x) { return has(x) && x.id === colId; })[0];
    return c ? ids(c.cards) : [];
  }
  function mergeBoard(b, l, r) {
    var out = fields(b, l, r, 'columns');
    var bC = idx(b && b.columns), lC = idx(l.columns), rC = idx(r.columns), keepCols = {}, cols = {};
    Object.keys(lC).concat(Object.keys(rC)).forEach(function(id) {
      if (cols[id]) return;
      var bc = bC[id], lc = lC[id], rc = rC[id];
      if (lc && rc) cols[id] = fields(bc, lc, rc, 'cards');
      else if (lc ? keepOne(bc, lc) : keepOne(bc, rc)) cols[id] = fields(null, lc, rc, 'cards');
      if (cols[id]) { keepCols[id] = 1; cols[id].cards = []; }
    });
    var colOrder = order(ids(b && b.columns), ids(l.columns), ids(r.columns), keepCols);
    var bK = cardsOf(b), lK = cardsOf(l), rK = cardsOf(r), where = {}, cards = {};
    Object.keys(lK).concat(Object.keys(rK)).forEach(function(id) {
      if (cards[id]) return;
      var bk = bK[id], lk = lK[id], rk = rK[id], card, col;
      if (lk && rk) {
        card = fields(bk && bk.card, lk.card, rk.card, null);
        var lm = !bk || lk.col !== bk.col, rm = !bk || rk.col !== bk.col;
        col = lk.col === rk.col ? lk.col : (lm && !rm) ? lk.col : (rm && !lm) ? rk.col : (mineNewer ? lk.col : rk.col);
        if (!cols[col]) col = cols[lk.col] ? lk.col : rk.col;
      } else {
        var one = lk || rk;
        if (!(bk && minestSame(bk.card, one.card) && bk.col === one.col)) { card = clone(one.card); col = one.col; }
      }
      if (card && cols[col]) { cards[id] = card; where[id] = col; }
    });
    colOrder.forEach(function(cid) {
      var keep = {}; Object.keys(where).forEach(function(id) { if (where[id] === cid) keep[id] = 1; });
      cols[cid].cards = order(colIds(b, cid), colIds(l, cid), colIds(r, cid), keep).map(function(id) { return cards[id]; });
    });
    out.columns = colOrder.map(function(cid) { return cols[cid]; });
    return out;
  }
  var B = idx(base), L = idx(local), R = idx(remote), keep = {}, merged = {};
  Object.keys(L).concat(Object.keys(R)).forEach(function(id) {
    if (merged[id]) return;
    var b = B[id], l = L[id], r = R[id];
    if (l && r) merged[id] = minestSame(l, r) ? clone(l) : mergeBoard(b, l, r);
    else if (l ? keepOne(b, l) : keepOne(b, r)) merged[id] = clone(l || r);
    if (merged[id]) keep[id] = 1;
  });
  return order(ids(base), ids(local), ids(remote), keep).map(function(id) { return merged[id]; });
}
root.MinestBoardMerge=minestMerge3;
if(typeof module==='object'&&module.exports)module.exports=minestMerge3;
})(typeof window!=='undefined'?window:this);

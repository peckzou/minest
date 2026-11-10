(function(root){function minestSame(a,b){return JSON.stringify(a)===JSON.stringify(b);}
function minestMerge3(base, local, remote, mineNewer) {
  var LEVELS = ['columns', 'cards'];
  function idx(a) { var m = {}; (a || []).forEach(function(x) { if (x && x.id != null) m[x.id] = x; }); return m; }
  function strip(x, key) { if (!key || !x) return x; var o = {}; Object.keys(x).forEach(function(k) { if (k !== key) o[k] = x[k]; }); return o; }
  function one(b, l, r, depth) {
    if (!l && !r) return null;
    if (!l) return b && minestSame(b, r) ? null : r;
    if (!r) return b && minestSame(b, l) ? null : l;
    if (minestSame(l, r)) return l;
    var key = LEVELS[depth];
    var lc = !b || !minestSame(strip(b, key), strip(l, key)), rc = !b || !minestSame(strip(b, key), strip(r, key));
    var own = (lc && !rc) ? l : (rc && !lc) ? r : (mineNewer ? l : r);
    if (!key) return own;
    var o = strip(own, key); o[key] = list(b && b[key], l[key], r[key], depth + 1); return o;
  }
  function list(bA, lA, rA, depth) {
    var B = idx(bA), L = idx(lA), out = [], have = {};
    (rA || []).forEach(function(r) { if (!r || r.id == null || have[r.id]) return; have[r.id] = 1; var v = one(B[r.id], L[r.id], r, depth); if (v) out.push(v); });
    (lA || []).forEach(function(l, i) {
      if (!l || l.id == null || have[l.id]) return; have[l.id] = 1;
      var v = one(B[l.id], l, null, depth); if (!v) return;
      var prev = i > 0 && lA[i - 1] ? lA[i - 1].id : null, at = prev == null ? 0 : out.length;
      for (var j = 0; prev != null && j < out.length; j++) if (out[j].id === prev) { at = j + 1; break; }
      out.splice(at, 0, v);
    });
    return out;
  }
  var res = list(base, local, remote, 0);
  res.forEach(function(bd) { var seen = {}; (bd.columns || []).forEach(function(c) { if (c && c.cards) c.cards = c.cards.filter(function(k) { if (!k || seen[k.id]) return false; seen[k.id] = 1; return true; }); }); });
  return res;
}

root.MinestBoardMerge=minestMerge3;})(window);

"""My World 70 — the voxel world (Santorini / Oia) and 2D My World as one place, on top of the Codex console (duo-v1).

- 2D My World's binding for the voxel world (window.__oiaBind hooks) gains:
    things()   this world's own cards (the board's items), with their pictures, for the 3D displays
    sync(info) the voxel world's buildings → the island's pieces (moved / turned / copied / removed, Santorini island only)
               and its displays → a "3D 陈列" room in the building they stand by (one display piece per 3D display)
    pull()     what changed on the 2D side of those rooms (another card, a display removed) → back to the voxel world
    info(bid)  the 2D side of one building (rooms, displays, cards) for the console
- mn-oia-bld-69: cards from the world's own board (sample cards only while it has none), card pictures on the 3D cards,
  new displays / elements placed beside the selected building or where the editing camera looks (not at the walker),
  a new display gets a card not yet shown, no keyboard hints on touch buttons.
- mn-oia-sync-70 (tools/myworld/oia-sync-70.js / .css): pushes after every voxel edit (minest-world-edit), pulls on open,
  compact console rails (all seven tools visible), a live header, the 2D link card and a card picker in 陈列.
Safe to re-run: every edit checks for its marker; the 70 blocks are replaced with their current text."""
import re
from pathlib import Path

HERE = Path(__file__).resolve().parent
ROOT = HERE.parents[1]
FILES = ['iPhoneDuo.html', 'iPhoneDuo69.html', 'iphone.html', 'iPhone53.8241.html', 'index.html', 'ipad.html',
         'ios/Minest/Minest/iPhoneDuo.html', 'ios/Minest/Minest/index.html', 'ios/Minest/Minest/ipad.html',
         'ios/Minest/Minest/iphone.html', 'ios/Minest/Minest/iphone18.0.html']
JS = (HERE / 'oia-sync-70.js').read_text(encoding='utf-8')
CSS = (HERE / 'oia-sync-70.css').read_text(encoding='utf-8')
assert '</script' not in JS.lower() and '</style' not in CSS.lower()

HOOKS = r"""      /* 70 */ things: function () { if (!V || V.visit) return []; try { index(); } catch (e) { return []; }
        return Object.keys(IX).map(function (r) { var t = IX[r], u = null; try { u = picOf(t.s); if (u) u = S(u); } catch (e) { u = null; } return { id: r, title: String(t.s.title || ''), col: (t.k && t.k.title) || '', zh: '', desc: '', pic: u || '', own: 1 }; }); },
      info: function (bid) { if (!V) return null; var p = (islandD().pc || []).filter(function (q) { return q.vox === bid; })[0]; if (!p) return null;
        var n = 0, t = (p.it || []).length; (p.rooms || []).forEach(function (r) { ((r.d && r.d.pc) || []).forEach(function (q) { if (Array.isArray(q.it)) { n++; t += q.it.length; } }); });
        return { label: p.label || null, rooms: (p.rooms || []).length, displays: n, things: t }; },
      sync: function (info) {   /* 70: the voxel world's buildings and displays, mirrored into this island's pieces and rooms */
        if (!V || V.visit || !info || !window.MinestOia) return 0; try { index(); } catch (e) {}
        var R = islandD(); R.pc = R.pc || []; var before = JSON.stringify(R.pc), wv = MinestOia.world(), san = !!(R.terr && R.terr.scape === 'santorini'), sc = 48 / Math.max(wv.W, wv.D);
        var KM = { house: 'gr_house', cave: 'gr_cave', chapel: 'gr_church', church: 'gr_church', castle: 'ruins', mill: 'gr_mill', taverna: 'c_cafe' }, byV = {};
        R.pc.forEach(function (p) { if (p.vox) byV[p.vox] = p; });
        (info.bld || []).forEach(function (b) {
          var p = byV[b.id];
          if (b.gone) { if (p && !p.gone) { p.gone = 1; p.k0 = p.k; p.k = 'vox_door'; } return; }   // its rooms and things stay with it
          if (!san) return;
          var x = Math.round((wv.W - b.cx) * sc * 2) / 2, y = Math.round((wv.D - b.cz) * sc * 2) / 2;
          if (!p) { if (!/^u/.test(b.id)) return; p = { id: uid(), k: K[KM[b.kind]] ? KM[b.kind] : 'gr_house', x: x, y: y, f: 3, s: .8, it: [], city: 1, vox: b.id, label: b.name || undefined }; R.pc.push(p); byV[b.id] = p; if (typeof fits === 'function' && !fits(p)) { p.k = 'vox_door'; p.s = 1; } return; }
          if (p.gone) { p.k = p.k0 || p.k; delete p.gone; delete p.k0; }
          if (p.k !== 'vox_door') { p.x = x; p.y = y; p.f = (3 + (b.rot || 0)) % 4; }
        });
        var KD = { easel: 'easel', shelf: 'shelf', showcase: 'gallery', wall: 'wall' }, want = {};
        (info.disp || []).forEach(function (d) { if (d.bid) (want[d.bid] = want[d.bid] || []).push(d); });
        R.pc.forEach(function (p) { (p.rooms || []).forEach(function (r) { if (r.v3d && r.d && !want[p.vox]) { r.d.pc = (r.d.pc || []).filter(function (q) { return !q.v3d; }); r.v3dIds = []; } }); });
        Object.keys(want).forEach(function (bid) {
          var p = byV[bid];
          if (!p) { p = { id: uid(), k: 'vox_door', x: 1, y: 1, f: 0, s: 1, it: [], city: 1, vox: bid, label: want[bid][0].bname || undefined }; R.pc.push(p); byV[bid] = p; }
          if (!(p.rooms || []).length) { p.roomsInit = 1; p.rooms = suggestRooms(p).map(function (k) { return { id: 'r' + uid().slice(1), k: k, n: ROOMS[k][0] }; }); p.rooms.forEach(function (r) { roomD(r); }); }
          var r = p.rooms.filter(function (q) { return q.v3d; })[0];
          if (!r) { r = { id: 'r' + uid().slice(1), k: ROOMS.gallery ? 'gallery' : p.rooms[0].k, n: '3D 陈列', v3d: 1, fl: 1 }; p.rooms.push(r); roomD(r); r.d.pc = (r.d.pc || []).filter(function (q) { return !Array.isArray(q.it); }); }   // its furniture, not empty displays: only the voxel world's own
          roomD(r); var old = {}; (r.d.pc || []).forEach(function (q) { if (q.v3d) old[q.id] = q; });
          var mine = want[bid].map(function (d, i) { var id = 'v3d-' + d.id, q = old[id] || { id: id, x: 1.5 + (i % 3) * 2.5, y: 1.5 + Math.floor(i / 3) * 2.5, f: 0, s: 1, v3d: 1 };
            q.k = K[KD[d.kind]] ? KD[d.kind] : 'easel'; q.it = d.cardId && IX[d.cardId] ? [d.cardId] : []; q.d3 = d.id; q.c3 = d.cardId || null; return q; });
          r.d.pc = (r.d.pc || []).filter(function (q) { return !q.v3d; }).concat(mine); r.v3dIds = mine.map(function (q) { return q.d3; });
        });
        if (JSON.stringify(R.pc) === before) return 0; var hh = HISTORIES[V.bid]; if (hh && !hh.busy) hh.cur = histSnap(R);   /* the mirror is part of the voxel edit's own undo step */
        save(true); return 1;
      },
      pull: function () { if (!V || V.visit) return null; try { index(); } catch (e) {} var out = { cards: {}, gone: [] };
        (islandD().pc || []).forEach(function (p) { (p.rooms || []).forEach(function (r) { if (!r.v3d || !r.d) return; var have = {};
          (r.d.pc || []).forEach(function (q) { if (!q.v3d) return; have[q.d3] = 1; var ref = (q.it || [])[0]; if (ref && ref !== q.c3 && IX[ref]) out.cards[q.d3] = ref; });
          (r.v3dIds || []).forEach(function (id) { if (!have[id]) out.gone.push(id); }); }); });
        return out; },
"""
ENTER = "      enter: function (bid, at) {   // through its door"

PLACE = r"""  function placeAt(dist) {   /* 70: where a new thing goes: beside the selected building, else where the editing camera looks, else in front of you */
    var w = world(), b = sel && w && (w.buildings || []).find(function (x) { return x.id === sel; });
    if (b) return { x: (b.x0 + b.x1 + 1) / 2 + .5, z: b.z1 + 2.5 };
    var E = window.MinestOiaEditor; if (E && E.active && E.target) return { x: Math.floor(E.target.x) + .5, z: Math.floor(E.target.z) + .5 };
    var s = sa(), p = s ? s.player.pos : { x: 20, z: 20 }, yaw = s ? s.player.yaw : 0;
    return { x: p.x - Math.sin(yaw) * dist, z: p.z - Math.cos(yaw) * dist };
  }

  function commit(fn) {"""


def bld69(b):
    if '/* 70:' in b:
        return b
    n = b.count('function getActiveCards() {'); assert n == 1, n
    b = b.replace('function getActiveCards() {', 'function getActiveCards() {   /* 70: this world\'s own cards first */\n    try { if (H && H.things) { var own = H.things(); if (own && own.length) return own; } } catch (e) {}', 1)
    a = 'return cards.find(function (c) { return c.id === id; }) || cards[0];'; assert b.count(a) == 1
    b = b.replace(a, 'var hit = cards.find(function (c) { return c.id === id; }); if (hit) return hit; var h = 0; String(id || \'\').split(\'\').forEach(function (ch) { h = (h * 31 + ch.charCodeAt(0)) | 0; }); return cards[Math.abs(h) % cards.length];')
    a = "g.fillText(card.title || 'Art Exhibit', 128, 190);"; assert b.count(a) == 1
    b = b.replace(a, "g.fillText(card.title || 'Art Exhibit', 128, 190, 232);")
    a = "g.fillText((card.zh ? card.zh + ' · ' : '') + (card.id || ''), 128, 212);"; assert b.count(a) == 1
    b = b.replace(a, "g.fillText(card.own ? (card.col || '') : (card.zh ? card.zh + ' · ' : '') + (card.id || ''), 128, 212, 232);\n"
                     "    if (card.pic) { var im = new Image(); im.crossOrigin = 'anonymous'; im.onload = function () { try { var r = Math.max(216 / im.width, 94 / im.height), iw = im.width * r, ih = im.height * r; g.save(); g.beginPath(); g.rect(20, 66, 216, 94); g.clip(); g.drawImage(im, 128 - iw / 2, 113 - ih / 2, iw, ih); g.restore(); if (cardTexCache[key]) cardTexCache[key].needsUpdate = true; } catch (e) {} }; im.src = card.pic; }")
    assert b.count('  function commit(fn) {') == 1
    b = b.replace('  function commit(fn) {', PLACE, 1)
    i = b.index('addDisp: function (kind) {'); j = b.index('commit(function (next) {', i)
    b = b[:i] + ("addDisp: function (kind) {\n      var w = world(), at = placeAt(3), dx = at.x, dz = at.z, dy = top(w, Math.floor(dx), Math.floor(dz)) + 1;\n"
                 "      var cards = getActiveCards(), used = {}; (((H && H.bld && H.bld()) || {}).displays || []).forEach(function (q) { used[q.cardId] = 1; });\n"
                 "      var id = 'disp-' + Date.now(), cardId = (cards.filter(function (c) { return !used[c.id]; })[0] || cards[0]).id;\n\n      ") + b[j:]
    i = b.index('addElem: function (type) {'); seg = b[i:b.index('commit(function (next) {', i)]
    seg2 = re.sub(r"var s = sa\(\), p = s \? s\.player\.pos : \{[^}]*\}, yaw = s \? s\.player\.yaw : 0;\s*var fx = -Math\.sin\(yaw\), fz = -Math\.cos\(yaw\);\s*var ex = Math\.floor\(p\.x \+ fx \* 4\), ez = Math\.floor\(p\.z \+ fz \* 4\);",
                  "var at = placeAt(4), ex = Math.floor(at.x), ez = Math.floor(at.z);", seg)
    assert seg2 != seg, 'addElem'
    b = b.replace(seg, seg2, 1)
    b = re.sub(r' \((?:C|G|X|Easel|Shelf|Showcase|Wall)\)</button>', '</button>', b)
    b = b.replace('进入建筑剖面 (Doorhouse)</button>', '进入房间</button>')
    b = re.sub(r" \(' \+ \((\w+)\.zh \|\| ''\) \+ '\)", r"' + (\1.zh ? ' (' + \1.zh + ')' : '') + '", b)   # no empty () for cards without a Chinese title
    b = b.replace("(' + (card.zh || '') + ')</span>", "' + (card.zh ? '(' + card.zh + ')' : '') + '</span>")
    return b


for f in FILES:
    p = ROOT / f
    if not p.exists():
        continue
    s = p.read_text(encoding='utf-8')
    if '<script id="mn-oia-bld-69">' not in s:
        continue
    if '/* 70 */ things:' not in s:
        assert s.count(ENTER) == 1, (f, 'enter')
        s = s.replace(ENTER, HOOKS + ENTER, 1)
    i = s.index('<script id="mn-oia-bld-69">'); j = s.index('</script>', i)
    s = s[:i] + bld69(s[i:j]) + s[j:]
    s = re.sub(r'\n<style id="mn-oia-sync-70-css">.*?</style>\n', '', s, flags=re.S)
    s = re.sub(r'<script id="mn-oia-sync-70">.*?</script>\n', '', s, flags=re.S)
    k = s.index('<script id="minest-world-controls-adapter"'); k = s.index('</script>', k) + len('</script>')
    s = s[:k] + '\n<style id="mn-oia-sync-70-css">\n' + CSS + '</style>\n<script id="mn-oia-sync-70">\n' + JS + '</script>\n' + s[k:]
    p.write_text(s, encoding='utf-8')
    print('patched', f)

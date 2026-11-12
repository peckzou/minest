#!/usr/bin/env python3
"""Minest 70 · 体素陈列引擎 (Voxel Exhibition Engine 3D) into the Duo pages.

    python3 tools/santorini-69/patch_displays70.py            # patch index.html, then copy it to its mirrors
    python3 tools/santorini-69/patch_displays70.py --check    # only say what state the pages are in
    python3 tools/santorini-69/patch_displays70.py --all      # also overwrite mirrors that differ from index.html

What it does to index.html:
1. puts ui/world-displays.js (the exhibition engine) and ui/world-textcraft.js (文字制作工坊) in as
   <script id="minest-voxel-displays"> and <script id="minest-text-craft"> just before <script id="mn-oia-bld-69">
   (replaced when already there, so they can be changed and patched in again);
2. changes the Santorini building / display module (mn-oia-bld-69, 69.5 → 70.0) so that its displays are drawn,
   picked, placed and edited by the engine: see HOOKS below. Each hook must match exactly once;
3. writes the changed module back to tools/santorini-69/oiabld69.js (that file had fallen behind the page);
4. copies index.html over the pages that were byte-identical to it before (the Duo mirrors and the iOS bundle).
The older 69.3 pages (ipad.html, iPhone18.0.html in the repo root) are left alone."""
import hashlib, sys
from pathlib import Path

ROOT = Path(__file__).resolve().parents[2]
PAGE = ROOT / 'index.html'
MIRRORS = ['iPhoneDuo.html', 'iPhoneDuo69.html', 'iphone.html', 'ios/Minest/Minest/iPhoneDuo.html',
           'ios/Minest/Minest/index.html', 'ios/Minest/Minest/ipad.html', 'ios/Minest/Minest/iphone.html',
           'ios/Minest/Minest/iphone18.0.html']
# the scripts put in before the 69 module, in this order: (script id, file)
ENGINES = [('minest-voxel-displays', ROOT / 'ui' / 'world-displays.js'), ('minest-text-craft', ROOT / 'ui' / 'world-textcraft.js'),
           ('minest-machines', ROOT / 'ui' / 'world-machines.js')]
SRC69 = ROOT / 'tools' / 'santorini-69' / 'oiabld69.js'
OPEN69, CLOSE = '<script id="mn-oia-bld-69">\n', '</script>'
VD_OPEN = '<script id="minest-voxel-displays">\n'

GLUE = r"""
  /* 70 · 体素陈列引擎 (ui/world-displays.js): it draws, picks, places and edits the displays; this module gives it the
     world, the island record (with undo) and the selection, and falls back to the 69 props when it is not loaded */
  function VD() { return window.MinestVoxelDisplays || null; }
  var vdHost = {
    scene: function () { var s = sa(); return s && s.scene; },
    camera: function () { var s = sa(); return s && s.camera; },
    canvas: function () { return document.getElementById('oia-gl'); },
    world: function () { return world(); },
    record: function () { return H && H.bld ? H.bld() : null; },
    boardId: function () { return H && H.key ? (H.key() || '') : ''; },
    shadows: function () { var s = sa(); return !s || !s.S || s.S.shadows !== false; },
    view: function () {   // where new things go: in front of the walker, or where the editing camera looks at the ground
      var s = sa(), E = window.MinestOiaEditor, w = world();
      if (E && E.active && s && w) {
        var c = s.camera.position, t = E.target, dx = t.x - c.x, dy = t.y - c.y, dz = t.z - c.z, n = Math.hypot(dx, dy, dz) || 1, h = Math.hypot(dx, dz) || 1, x = t.x, z = t.z, y = null;
        for (var k = 0; k < n + 400; k += 0.4) { var px = Math.floor(c.x + dx / n * k), py = Math.floor(c.y + dy / n * k), pz = Math.floor(c.z + dz / n * k); if (py < 0) break; if (w.inb(px, py, pz) && w.blocks[w.idx(px, py, pz)] !== 0) { x = px + 0.5; z = pz + 0.5; y = w.hm ? w.hm[px + w.W * pz] - 1 : py; break; } }   // the ground under what you look at
        return { x: x, z: z, y: y, fx: dx / h, fz: dz / h };
      }
      var p = s ? s.player.pos : { x: 20, y: 10, z: 20 }, yaw = s ? s.player.yaw : 0, fx = -Math.sin(yaw), fz = -Math.cos(yaw);
      return { x: p.x + fx * 4, z: p.z + fz * 4, y: Math.floor(p.y), fx: fx, fz: fz };
    },
    focus: function (b, f) {   // look at a fixture from its front
      var s = sa(), E = window.MinestOiaEditor; if (!s) return;
      if (E && E.active) { E.target.x = b.x; E.target.y = b.y; E.target.z = b.z; E.zoom(Math.max(16, b.w * 4) / E.distance); return; }
      var back = 2.5 + b.d / 2 + b.w * 0.55;
      s.player.pos.x = b.x + f[0] * back; s.player.pos.z = b.z + f[1] * back; s.player.pos.y = b.y - b.h / 2 + 0.05;
      s.player.yaw = Math.atan2(f[0], f[1]); s.player.pitch = -0.06;
    }
  };
  var vdCtx = {
    host: vdHost,
    commit: function (fn) { return commit(fn); },
    toast: function (m) { toast(m); },
    sel: function () { return selDisp; },
    setSel: function (id) { selDisp = id; if (id) { curTab = 'disp'; sel = null; selElem = null; } },
    editing: function () { return !!edit; },
    refresh: function () { updateHl(); fillPanel(); }
  };
  function curDisps() { var v = VD(); if (v) return v.list(vdHost); var st = H && H.bld ? H.bld() : null; return (st && st.displays) || defaultDisplays(world()); }
"""

# (what was there, what is there now) — each must be found exactly once in the 69.5 module
HOOKS = [
    ("if (window.MinestOiaBld && window.MinestOiaBld.version === '69.5') return;",
     "if (window.MinestOiaBld && window.MinestOiaBld.version === '70.0') return;"),
    ("    version: '69.5',", "    version: '70.0',"),
    ("  var KIND = { house: '白屋', cave: '洞穴屋', taverna: '小酒馆', chapel: '教堂' };\n",
     "  var KIND = { house: '白屋', cave: '洞穴屋', taverna: '小酒馆', chapel: '教堂' };\n" + GLUE),
    # the cards of 69 came from window.boards, which the app never sets: they were always the built-in samples
    ("      if (window.boards && Array.isArray(window.boards)) {\n        var b = window.boards.find(function (x) { return x.id === 'board-ec6-art'; }) || window.boards[0];",
     "      var bs = (window.MinestAI && window.MinestAI.boards && window.MinestAI.boards()) || window.boards;\n      if (bs && Array.isArray(bs)) {\n        var b = bs.find(function (x) { return x.id === 'board-ec6-art'; }) || bs[0];"),
    # a display edit no longer cuts and pastes every moved building again (and re-meshes their chunks)
    ("  function sigOf(st) { return JSON.stringify(st || {}); }",
     "  function sigOf(st) { if (!st || !VD()) return JSON.stringify(st || {}); var o = {}; Object.keys(st).forEach(function (k) { if (k !== 'displays' && k !== 'dv') o[k] = st[k]; }); return JSON.stringify(o); }"),
    # opening the world no longer writes sample displays into the island record
    ("    var st = H && H.bld ? H.bld() : null;\n    if (!st) {\n      st = { m: {}, a: [], n: 0, elements: [], displays: defaultDisplays(w) };",
     "    var st = H && H.bld ? H.bld() : null;\n    if (VD()) { if (!st) st = { m: {}, a: [], n: 0, elements: [] }; }\n    else if (!st) {\n      st = { m: {}, a: [], n: 0, elements: [], displays: defaultDisplays(w) };"),
    ("    var m = st.m || {}, adds = st.a || [], elems = st.elements || [], disps = st.displays || defaultDisplays(w), cols = {};",
     "    var m = st.m || {}, adds = st.a || [], elems = st.elements || [], disps = VD() ? null : (st.displays || defaultDisplays(w)), cols = {};"),
    ("  function renderVoxelDisplays(disps) {\n    var s = sa(); if (!s || !s.scene) return;\n",
     "  function renderVoxelDisplays(disps) {\n    var s = sa(); if (!s || !s.scene) return;\n    if (VD()) { if (voxDispGroup && voxDispGroup.parent) voxDispGroup.parent.remove(voxDispGroup); VD().render(vdHost); return; }   /* 70 */\n"),
    ("  function pickDisplayAt(clientX, clientY) {\n",
     "  function pickDisplayAt(clientX, clientY) {\n    if (VD()) { var hit70 = VD().pick(vdHost, clientX, clientY); return hit70 ? (curDisps().filter(function (q) { return q.id === hit70.id; })[0] || null) : null; }   /* 70 */\n"),
    ("    if (!window.__oiaOn) return;\n\n    // 1. Check if clicking a 3D Display\n    var disp = pickDisplayAt(clientX, clientY);",
     "    if (!window.__oiaOn) return;\n    if (VD() && VD().tap(vdCtx, clientX, clientY)) return;   /* 70: a fixture, one of its slots, or the ground it should move to */\n    if (VD() && edit && curTab === 'disp') return;   /* 70: while arranging displays a tap beside them does not jump to the nearest building */\n\n    // 1. Check if clicking a 3D Display\n    var disp = VD() ? null : pickDisplayAt(clientX, clientY);"),
    # the selection box: the fixture's real size (and it no longer stays turned for the next building)
    ("    if (curTab === 'disp' && selDisp) {\n      var st = H && H.bld ? H.bld() : null, dList = (st && st.displays) || defaultDisplays(world());\n      var d = dList.find(function (q) { return q.id === selDisp; });\n      if (d) {",
     "    hl.rotation.y = 0;\n    if (curTab === 'disp' && selDisp) {\n      var dList = curDisps();\n      var d = dList.find(function (q) { return q.id === selDisp; });\n      if (d && VD()) { var bb = VD().bounds(d); hl.scale.set(bb.w + 0.14, bb.h + 0.14, bb.d + 0.14); hl.position.set(bb.x, bb.y, bb.z); hl.visible = true; return; }\n      if (d) {"),
    ("    var next = JSON.parse(JSON.stringify(cur || { m: {}, a: [], n: 0, elements: [], displays: defaultDisplays(world()) }));\n    fn(next);",
     "    var next = JSON.parse(JSON.stringify(cur || { m: {}, a: [], n: 0, elements: [], displays: VD() ? [] : defaultDisplays(world()) }));\n    if (VD()) { next.displays = JSON.parse(JSON.stringify(VD().list(vdHost))); next.dv = 2; }   /* 70: what is shown is what is saved */\n    if (!next.m) next.m = {}; if (!next.a) next.a = [];\n    fn(next);"),
    ("      rec.displays = next.displays || [];\n    });",
     "      rec.displays = next.displays || [];\n      if (next.dv) rec.dv = next.dv;\n    });"),
    ("    addDisp: function (kind) {\n", "    addDisp: function (kind) {\n      if (VD()) return VD().act(vdCtx, 'add', kind);\n"),
    ("    mvDisp: function (dir) {\n", "    mvDisp: function (dir) {\n      if (VD()) return VD().act(vdCtx, 'move', dir);\n"),
    ("    rotDisp: function () {\n", "    rotDisp: function () {\n      if (VD()) return VD().act(vdCtx, 'rot');\n"),
    ("    delDisp: function () {\n", "    delDisp: function () {\n      if (VD()) return VD().act(vdCtx, 'del');\n"),
    ("    cycleCard: function () {\n", "    cycleCard: function () {\n      if (VD()) return VD().act(vdCtx, 'pick');\n"),
    ("    viewCard: function () {\n", "    viewCard: function () {\n      if (VD()) return VD().act(vdCtx, 'view');\n"),
    ("    smartLayout: function (theme) {\n      var w = world(); if (!w) return;\n",
     "    smartLayout: function (theme) {\n      var w = world(); if (!w) return;\n      if (VD() && theme === 'art') { curTab = 'disp'; return VD().act(vdCtx, 'auto'); }   /* 70: a real list, curated */\n"),
    ("        '<b>🏛️ 规划: 圣托里尼悬崖艺术展</b><br><small style=\"opacity:.85\">自动生成画架、展柜、艺术展墙与观景休闲长椅套装</small>' +",
     "        '<b>🏛️ 规划: 圣托里尼悬崖艺术展</b><br><small style=\"opacity:.85\">按看板列表自动策展：挑最合适的体素展架，在你面前的平地上摆好整个列表</small>' +"),
    ("      var g = e.target.closest('[data-a]'); if (!g) return;\n",
     "      if (VD() && VD().click(vdCtx, e)) return;   /* 70 */\n      var g = e.target.closest('[data-a]'); if (!g) return;\n"),
    ("      if (ACT[a]) ACT[a](d);\n    });\n",
     "      if (ACT[a]) ACT[a](d);\n    });\n    panel.addEventListener('change', function (e) { e.stopPropagation(); if (VD()) VD().changed(vdCtx, e); });\n"),
    ("    var dispList = (st && st.displays) || defaultDisplays(w);\n    var disp = selDisp ? dispList.find(function (q) { return q.id === selDisp; }) : null;\n    var card = disp ? getCardById(disp.cardId) : null;",
     "    var dispList = curDisps();\n    var disp = selDisp ? dispList.find(function (q) { return q.id === selDisp; }) : null;\n    var card = disp && !VD() ? getCardById(disp.cardId) : null;"),
    ("    } else if (curTab === 'disp') {\n      h += '<div class=\"obld-card\">' +",
     "    } else if (curTab === 'disp' && VD()) {\n      h += VD().panel(vdCtx);\n    } else if (curTab === 'disp') {\n      h += '<div class=\"obld-card\">' +"),
    # the panel is written again only when it changed (it was rebuilt every 0.4 s, which closed menus and lost scroll)
    ("    panel.innerHTML = h;\n  }",
     "    if (panel.__h === h) return;\n    var sc70 = panel.querySelector('.vd-cards'), top70 = sc70 ? sc70.scrollTop : 0;\n    panel.__h = h; panel.innerHTML = h;\n    if (top70 && (sc70 = panel.querySelector('.vd-cards'))) sc70.scrollTop = top70;\n  }"),
    ("      if (!voxDispGroup || voxDispGroup.children.length === 0) {\n        var w = world();",
     "      if (VD()) VD().render(vdHost);   /* 70: only what changed is rebuilt */\n      else if (!voxDispGroup || voxDispGroup.children.length === 0) {\n        var w = world();"),
    ("    displays: function () {\n      var st = H && H.bld ? H.bld() : null;",
     "    displays: function () {\n      if (VD()) return curDisps();\n      var st = H && H.bld ? H.bld() : null;"),
]


def md5(b):
    return hashlib.md5(b).hexdigest()


def block(s, open_tag):
    i = s.index(open_tag) + len(open_tag)
    return i, s.index(CLOSE, i)


def main():
    check, every = '--check' in sys.argv, '--all' in sys.argv
    raw = PAGE.read_bytes()
    before = md5(raw)
    s = raw.decode('utf-8')
    same = [m for m in MIRRORS if (ROOT / m).exists() and (every or md5((ROOT / m).read_bytes()) == before)]
    i, j = block(s, OPEN69)
    body = s[i:j]
    patched = "version: '70.0'" in body
    print('index.html: module', '70.0 (already patched)' if patched else '69.5', '· engine', 'in' if VD_OPEN in s else 'not in',
          '· mirrors identical:', len(same), '/', len(MIRRORS))
    if check:
        return
    if not patched:
        for a, b in HOOKS:
            n = body.count(a)
            assert n == 1, 'hook found %d times, not once: %s' % (n, a[:80])
            body = body.replace(a, b)
        s = s[:i] + body + s[j:]
        SRC69.write_text(body, encoding='utf-8')
    for sid, path in ENGINES:
        if not path.exists():   # a module not written yet is simply not put in
            continue
        tag, code = '<script id="%s">\n' % sid, path.read_text(encoding='utf-8')
        assert '</script' not in code
        if tag in s:
            a, b = block(s, tag)
            s = s[:a] + code + s[b:]
        else:
            k = s.index(OPEN69)
            s = s[:k] + tag + code + CLOSE + '\n' + s[k:]
    out = s.encode('utf-8')
    PAGE.write_bytes(out)
    for m in same:
        (ROOT / m).write_bytes(out)
    print('written: index.html +', len(same), 'mirrors ·', len(out), 'bytes ·', md5(out))
    skipped = [m for m in MIRRORS if m not in same]
    if skipped:
        print('NOT touched (they differed from index.html):', ', '.join(skipped))


if __name__ == '__main__':
    main()

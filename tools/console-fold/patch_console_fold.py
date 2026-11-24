#!/usr/bin/env python3
"""My World levels console: five keys down the left, matching the five on the right.

  Smart ▾ · Walk in · More land · Backpack · More ▾

  · Backpack is always there. It opens the Magical Backpack on its Index page (every building, object and interior
    that is online); a library entry gets a 「放到岛上」 key that sets it down on the island you are on.
  · More ▾ holds what used to stand in the column: Undo, Terrain, 阅览 View, the Tools, and the keys other features
    add to the column (Live view, Run, Voxel World, Interiors, 全息操作台 …). Those keys stay in the column, hidden,
    so the features that add them keep finding them; the pop-out shows a stand-in for each and presses the original.

Usage: python3 tools/console-fold/patch_console_fold.py [file.html ...]   (default: iphone.html)
Each file is written only when every anchor is found exactly once. Running it twice changes nothing.
"""
import sys
from pathlib import Path

ROOT = Path(__file__).resolve().parents[2]
MARK = 'wf-acts wf-fold'

EDITS = [
    # ---- the left column: five keys
    ("        c.classList.add('wf3');   // 53.89 · tools down both sides, the console and a gallery in the middle\n",
     "        var fold = HUD_FOLD.map(hudBtn).join('') + (lv === 1 ? '<button type=\"button\" data-wfter=\"toggle\"' + (W.terr ? ' class=\"on\"' : '') + '><i>' + px('hill') + '</i><span>' + (W.terr ? '✓ Done' : 'Terrain') + '</span></button><button type=\"button\" data-wfview><i>' + px('eye') + '</i><span>阅览 View</span></button>' : '') + HUD_MORE.map(hudBtn).join('');   // what More ▾ holds\n"
     "        c.classList.add('wf3');   // 53.89 · tools down both sides, the console and a gallery in the middle\n"),
    ("'<nav class=\"wf-acts\" aria-label=\"Actions\">' + stepBtn(acts, pn, S) + HUD_MAIN.map(hudBtn).join('') + (lv === 1 ? '<button type=\"button\" data-wfter=\"toggle\"' + (W.terr ? ' class=\"on\"' : '') + '><i>' + px('hill') + '</i><span>' + (W.terr ? '✓ Done' : 'Terrain') + '</span></button><button type=\"button\" data-wfview><i>' + px('eye') + '</i><span>阅览 View</span></button>' : '') + '<button type=\"button\" class=\"wf-popb' + (W.pop === 'tools' ? ' on' : '') + '\" data-wfpop=\"tools\" aria-expanded=\"' + (W.pop === 'tools') + '\"><i>' + px('tools') + '</i><span>Tools ▾</span></button></nav>' +",
     "'<nav class=\"wf-acts wf-fold\" aria-label=\"Actions\">' + stepBtn(acts, pn, S) + HUD_MAIN.map(hudBtn).join('') + '<button type=\"button\" class=\"wf-pack' + (packIsOpen() ? ' on' : '') + '\" data-wfpack aria-label=\"Backpack: every building, object and interior, ready to set out\"><i>' + pxi('🎒') + '</i><span>Backpack</span></button><button type=\"button\" class=\"wf-popb' + (W.pop === 'tools' ? ' on' : '') + '\" data-wfpop=\"tools\" aria-expanded=\"' + (W.pop === 'tools') + '\" aria-label=\"More tools\"><i>' + pxi('⋯') + '</i><span>More ▾</span></button></nav>' +"),
    ("        if (W.pop) popOpen(c, acts, pn, S);",
     "        if (W.foldObs) { W.foldObs.disconnect(); W.foldObs = null; }\n"
     "        if (W.pop) popOpen(c, acts, pn, S, fold);"),
    ("    var HUD_MAIN = [['fpv', '🚶', 'Walk in', '[data-fpv]'], ['expand', '⛰', 'More land', '[data-expand]'], ['undo', '↶', 'Undo', '[data-hudundo]']];",
     "    var HUD_MAIN = [['fpv', '🚶', 'Walk in', '[data-fpv]'], ['expand', '⛰', 'More land', '[data-expand]']];\n"
     "    var HUD_FOLD = [['undo', '↶', 'Undo', '[data-hudundo]']];   // first in More ▾"),
    # ---- the pop-out: the folded tools, then a stand-in for every key another feature added to the column
    ("    function popOpen(c, acts, pn, S) {   // the pop-out beside the left column",
     "    function extBtns(c) { return c ? [].slice.call(c.querySelectorAll('.wf-acts.wf-fold > button')).slice(5) : []; }   // keys other features add to the column: kept there (hidden) so they keep finding them\n"
     "    function foldSync(c, pop) {\n"
     "      [].slice.call(pop.querySelectorAll('[data-wfext]')).forEach(function (x) { x.remove(); });\n"
     "      extBtns(c).forEach(function (b, i) { var x = document.createElement('button'); x.type = 'button'; x.setAttribute('data-wfext', i); x.innerHTML = b.innerHTML; if (b.disabled) x.disabled = true; pop.appendChild(x); });\n"
     "    }\n"
     "    function popOpen(c, acts, pn, S, fold) {   // the pop-out beside the left column"),
    ("        : HUD_MORE.map(hudBtn).join('');\n", "        : (fold || '');\n"),
    ("      var main = c.querySelector('.wf-main'); main.appendChild(pop);\n",
     "      var main = c.querySelector('.wf-main'); main.appendChild(pop);\n"
     "      if (W.pop === 'tools') {\n"
     "        var nav = c.querySelector('.wf-acts.wf-fold'); foldSync(c, pop);\n"
     "        if (nav && window.MutationObserver) { W.foldObs = new MutationObserver(function () { if (pop.isConnected) { foldSync(c, pop); place(); } }); W.foldObs.observe(nav, { childList: true, subtree: true, characterData: true }); }\n"
     "      }\n"),
    ("if (b) pop.style.top = Math.max(0, Math.min(b.offsetTop - 4, main.clientHeight - pop.offsetHeight)) + 'px';",
     "var place = function () { var vis = Math.min(main.clientHeight, window.innerHeight - main.getBoundingClientRect().top); pop.style.maxHeight = Math.max(120, vis - 8) + 'px'; if (b) pop.style.top = Math.max(0, Math.min(b.offsetTop - 4, vis - pop.offsetHeight - 4)) + 'px'; }; place();"),
    # ---- clicks
    ("      if ((v = g.getAttribute('data-wfter'))) return terrAct(v);",
     "      if ((v = g.getAttribute('data-wfter'))) { if (g.closest('.wf-pop')) W.pop = null; return terrAct(v); }"),
    ("      if ((v = g.getAttribute('data-wfhud'))) { W.pop = null; var hb = hudEl(v); if (hb) hb.click(); setTimeout(draw, 60); return; }\n",
     "      if ((v = g.getAttribute('data-wfhud'))) { W.pop = null; var hb = hudEl(v); if (hb) hb.click(); setTimeout(draw, 60); return; }\n"
     "      if (g.hasAttribute('data-wfpack')) { W.pop = null; hap(); return packOpen(); }\n"
     "      if ((v = g.getAttribute('data-wfext')) != null) { W.pop = null; var xb = extBtns(g.closest('.wf'))[+v]; if (xb) xb.click(); setTimeout(draw, 60); return; }\n"),
    ("      if ((v = g.getAttribute('data-pkkind'))) { editOn(); if (W.S) sCancel(true); try { lib4Kind(v); } catch (x) {} if (DUO_API) DUO_API.placeKind(v); else change(function () { var q = add(v, (lbox().x0 + lbox().x1) / 2, (lbox().y0 + lbox().y1) / 2); if (q) V.sel = { pc: q.id }; }); if (V.sel && V.sel.pc && sk) W.panel[sk] = 'edit'; return draw(); }",
     "      if ((v = g.getAttribute('data-pkkind'))) { placeKind(v); return draw(); }"),
    # ---- the Backpack key: the Magical Backpack on its Index page, with this island as its host
    ("    function AS() { return window.MinestAssets3D || null; }\n",
     "    function AS() { return window.MinestAssets3D || null; }\n"
     "    function placeKind(v) {   // a library piece, set down where it fits and selected, ready to move\n"
     "      var sk = level() < 6 ? setKey() : null;\n"
     "      editOn(); if (W.S) sCancel(true); try { lib4Kind(v); } catch (x) {}\n"
     "      if (DUO_API) DUO_API.placeKind(v); else change(function () { var q = add(v, (lbox().x0 + lbox().x1) / 2, (lbox().y0 + lbox().y1) / 2); if (q) V.sel = { pc: q.id }; });\n"
     "      if (V.sel && V.sel.pc && sk) W.panel[sk] = 'edit';\n"
     "    }\n"
     "    function packIsOpen() { var BP = window.MinestBackpack; try { return !!(BP && BP.isOpen && BP.isOpen()); } catch (e) { return false; } }\n"
     "    function packPlace(id) {   // from the backpack's Index: a building, an object or an interior goes onto the island\n"
     "      var A0 = AS(), C = (A0 && A0.catalog) || {}, has = function (k) { return (C[k] || []).some(function (a) { return a.id === id; }); };\n"
     "      var name = ((A0 && A0.info && A0.info(id)) || {}).name || id;\n"
     "      if (!V || !V.d) { toast('先打开一座岛'); return false; }\n"
     "      if (has('world') || has('subisland') || has('center')) { toast('「' + name + '」是岛的外观 · 在 Island Gallery 里选用'); return false; }\n"
     "      var k = (has('building') ? 'bld:' : has('diorama') ? 'dio:' : 'obj:') + id;\n"
     "      if (V.at && V.at.room && /^bld:/.test(k)) { toast('建筑放在岛上 · 先走出房间'); return false; }\n"
     "      var before = (V.d.pc || []).length;\n"
     "      try { placeKind(k); } catch (e) { toast('「' + name + '」放不下'); return false; }\n"
     "      if ((V.d.pc || []).length > before) toast('🎒 「' + name + '」放好了 · 拖动它换位置，↶ 可撤销');\n"
     "      return true;\n"
     "    }\n"
     "    var packHost = {\n"
     "      world: 'myworld', THREE: window.THREE, placeLib: packPlace,\n"
     "      reduced: function () { try { return matchMedia('(prefers-reduced-motion: reduce)').matches; } catch (e) { return false; } },\n"
     "      toast: function (m) { toast(m); }, hotbarVisible: function () { return false; }, functionObjects: function () { return []; },\n"
     "      listBoard: function () { return V ? V.bid : null; },\n"
     "      status: function () { return { badge: '', cls: 'bag', text: '在 Spatial Home 或圣托里尼里摆放', placed: false, home: true }; },\n"
     "      place: function () { toast('这一件在 Spatial Home 或圣托里尼里摆放'); }, stash: function () {},\n"
     "      onClose: function () { setTimeout(draw, 0); }\n"
     "    };\n"
     "    function packOpen() {\n"
     "      var BP = window.MinestBackpack; if (!BP || !BP.open) { toast('🎒 背包还没准备好'); return; }\n"
     "      if (packIsOpen()) { BP.close(); return draw(); }\n"
     "      packHost.THREE = window.THREE; try { a3(); } catch (e) {}\n"
     "      BP.open(packHost, 'index'); draw();\n"
     "    }\n"),
    # ---- styles
    ("html body .wf.wf3 .wf-pop > button[disabled] { opacity:.35; }\n",
     "html body .wf.wf3 .wf-pop > button[disabled] { opacity:.35; }\n"
     "html body .wf.wf3 .wf-acts.wf-fold > button:nth-of-type(n+6) { display:none; }\n"
     "html body .wf.wf3 .wf-pop.tools { grid-template-columns:repeat(auto-fill,minmax(68px,1fr));box-sizing:border-box;width:min(344px,calc(100% - 92px));overflow-y:auto;scrollbar-width:none; }\n"
     "html body .wf.wf3 .wf-pop.tools > button[data-wfext] { font-size:11px;line-height:1.15;text-align:center; }\n"),
    # ---- the Magical Backpack: open on a given page; a host that can place library entries gets them first, with a key
    ("  function open(host) {\n    css();", "  function open(host, cat) {\n    css();"),
    ("    ui.host = host; ui.el.hidden = false;", "    ui.host = host; if (cat) { ui.cat = cat; ui.sel = null; } ui.el.hidden = false;"),
    ("      '#mn-bp .ixnote{font-size:12.5px;color:#8a6a48}',",
     "      '#mn-bp .ixnote{font-size:12.5px;color:#8a6a48}',\n      '#mn-bp .grid .bpown{order:2}',"),
    ("    var h = '<h5>背包里的物品 · 可以直接放出来</h5>';",
     "    var here = !!(ui.host && ui.host.placeLib);   // My World's island: the library is what goes down here, so it comes first\n"
     "    var h = '<h5' + (here ? ' class=\"bpown\"' : '') + '>' + (here ? '背包里的物品 · 在 Spatial Home 和圣托里尼里摆放' : '背包里的物品 · 可以直接放出来') + '</h5>';"),
    ("      h += '<div class=\"ix\"><b>' + g[1] + ' <em>' + list.length + '</em></b>' + list.map(function (it) {",
     "      h += '<div class=\"ix' + (here ? ' bpown' : '') + '\"><b>' + g[1] + ' <em>' + list.length + '</em></b>' + list.map(function (it) {"),
    ("    h += '<h5>My World 3D 库 · 共 ' + total + ' 件已上线 · 在 My World 的「建造」里摆放</h5>';",
     "    h += '<h5>My World 3D 库 · 共 ' + total + ' 件已上线 · ' + (here ? '点一件，再点「放到岛上」' : '在 My World 的「建造」里摆放') + '</h5>';"),
    ("    var names = { building: '建筑', object: '物件', diorama: '室内', world: '世界', subisland: '小岛', center: '中心岛样式' };",
     "    var names = { building: '建筑', object: '物件', diorama: '室内', world: '世界', subisland: '小岛', center: '中心岛样式' };\n"
     "    var grp = ''; LIB_GROUPS.some(function (g) { if ((C[g[0]] || []).some(function (x) { return x.id === id; })) { grp = g[0]; return true; } return false; });\n"
     "    var here = !!(ui.host && ui.host.placeLib), canPut = here && (grp === 'building' || grp === 'object' || grp === 'diorama');\n"
     "    var put = canPut ? '<div class=\"acts\"><button type=\"button\" class=\"pri\" data-bp=\"libplace\">放到岛上</button></div>' : '';"),
    ("'</h4><dl><dt>类型</dt><dd>' + esc(names[kind] || kind || '') + '</dd>' +",
     "'</h4>' + put + '<dl><dt>类型</dt><dd>' + esc(names[kind] || names[grp] || kind || '') + '</dd>' +"),
    ("<dt>状态</dt><dd>已上线 · 在 My World 的「建造」里摆放</dd></dl>';",
     "<dt>状态</dt><dd>' + (canPut ? '已上线 · 可以放到这座岛上' : here ? '已上线 · 岛的外观，在 Island Gallery 里选用' : '已上线 · 在 My World 的「建造」里摆放') + '</dd></dl>';"),
    ("    var a = b.dataset.bp, it = selected();\n    if (a === 'close') { close(); return; }\n",
     "    var a = b.dataset.bp, it = selected();\n    if (a === 'close') { close(); return; }\n"
     "    if (a === 'libplace') { if (host.placeLib && ui.lib && host.placeLib(ui.lib) !== false) close(true); return; }\n"),
]


def patch(path):
    s = path.read_text(encoding='utf-8')
    if MARK in s:
        print(path.name, 'already patched'); return True
    bad = [(i, s.count(old)) for i, (old, _) in enumerate(EDITS) if s.count(old) != 1]
    if bad:
        print(path.name, 'NOT patched; anchors (index, found):', bad); return False
    for old, new in EDITS:
        s = s.replace(old, new)
    path.write_text(s, encoding='utf-8')
    print(path.name, 'patched'); return True


if __name__ == '__main__':
    files = sys.argv[1:] or ['iphone.html']
    sys.exit(0 if all([patch(ROOT / f) for f in files]) else 1)

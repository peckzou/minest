#!/usr/bin/env python3
"""Magical Backpack · Index page: small inventory slots with a picture in each, instead of name chips.

  · Every entry (the backpack's own things and My World's 3D library) is a slot like the other pages, a size smaller,
    with its picture and its name under it. The name and note are also the slot's tooltip.
  · Pictures are made only for the slots on screen, one at a time, and kept, so choosing a slot or searching does
    not draw them again.

Usage: python3 tools/console-fold/patch_index_grid.py [file.html ...]   (default: iphone.html)
Each file is written only when every anchor is found exactly once. Running it twice changes nothing.
"""
import sys
from pathlib import Path

ROOT = Path(__file__).resolve().parents[2]
MARK = 'function ixFill('

EDITS = [
    # ---- helpers: a library picture that is already made, and the filler for the slots on screen
    ("  function renderIndex(all, grid) {\n",
     "  var LIBPIC = {};\n"
     "  function libPic(id) { if (LIBPIC[id]) return LIBPIC[id]; try { var c = LIB && LIB.cached && LIB.cached(id); if (c) LIBPIC[id] = c; return c || ''; } catch (e) { return ''; } }\n"
     "  function ixFill(grid) {   // pictures for the slots on screen, one at a time\n"
     "    var gen = (ui.gen = (ui.gen || 0) + 1), busy = false, T = ui.host.THREE, all = items();\n"
     "    function step() {\n"
     "      if (busy || !ui || ui.gen !== gen || ui.el.hidden || ui.cat !== 'index') return;\n"
     "      var bounds = grid.getBoundingClientRect(), slots = grid.querySelectorAll('i[data-th],i[data-lt]'), slot = null;\n"
     "      for (var j = 0; j < slots.length; j++) { var box = slots[j].getBoundingClientRect(); if (box.bottom >= bounds.top - 60 && box.top <= bounds.bottom + 60) { slot = slots[j]; break; } }\n"
     "      if (!slot) return;\n"
     "      busy = true;\n"
     "      var k = slot.getAttribute('data-th'), id = slot.getAttribute('data-lt'), done = false;\n"
     "      var put = function (src) {\n"
     "        if (done) return; done = true; busy = false;\n"
     "        if (src && slot.isConnected) { var im = document.createElement('img'); im.alt = ''; im.src = src; slot.replaceWith(im); }\n"
     "        else { slot.removeAttribute('data-th'); slot.removeAttribute('data-lt'); }\n"
     "        setTimeout(step, 0);\n"
     "      };\n"
     "      if (k != null) {\n"
     "        (root.requestIdleCallback || function (fn) { return setTimeout(fn, 60); })(function () {\n"
     "          var it = all.filter(function (x) { return x.key === k; })[0], src = '';\n"
     "          try { src = it ? thumb(T, it) : ''; } catch (e) {}\n"
     "          put(src);\n"
     "        }, { timeout: 350 });\n"
     "      } else {\n"
     "        setTimeout(function () { put(''); }, 6000);\n"
     "        try { Promise.resolve(LIB.thumb(id)).then(function (u) { if (u) LIBPIC[id] = u; put(u); }, function () { put(''); }); } catch (e) { put(''); }\n"
     "      }\n"
     "    }\n"
     "    grid.onscroll = step; step();\n"
     "  }\n"
     "  function renderIndex(all, grid) {\n"),
    ("    var q = ui.q, hit = function (t) { return !q || String(t).toLowerCase().indexOf(q) >= 0; };\n    var here =",
     "    var q = ui.q, hit = function (t) { return !q || String(t).toLowerCase().indexOf(q) >= 0; };\n"
     "    var scroll = grid.scrollTop, host = ui.host, PV = null; try { PV = previewer(host.THREE); } catch (e) {}\n"
     "    var here ="),
    # ---- the backpack's own things: slots
    ("      h += '<div class=\"ix' + (here ? ' bpown' : '') + '\"><b>' + g[1] + ' <em>' + list.length + '</em></b>' + list.map(function (it) {\n"
     "        return '<button type=\"button\" data-key=\"' + esc(it.key) + '\" class=\"' + (ui.sel === it.key ? 'sel' : '') + (it.ready === false ? ' off' : '') + '\">' + esc(it.name) + (it.ready === false ? ' · 未完成' : '') + '</button>';\n"
     "      }).join('') + '</div>';\n",
     "      h += '<h5 class=\"ixh' + (here ? ' bpown' : '') + '\">' + g[1] + ' · ' + list.length + '</h5>' + list.map(function (it) {\n"
     "        var ok = it.ready !== false, src = ok && PV ? PV.cache[it.key] : '', st = {}; try { st = host.status(it) || {}; } catch (e) {}\n"
     "        var tip = it.name + (ok ? '' : ' · 未完成') + (it.note ? ' — ' + it.note : '');\n"
     "        return '<button type=\"button\" class=\"it' + (ui.sel === it.key ? ' sel' : '') + (ok ? '' : ' off') + (here ? ' bpown' : '') + '\" data-key=\"' + esc(it.key) + '\" title=\"' + esc(tip) + '\">' +\n"
     "          (src ? '<img alt=\"\" src=\"' + src + '\">' : '<i' + (ok && PV && src === undefined ? ' data-th=\"' + esc(it.key) + '\"' : '') + '>' + pix(it) + '</i>') + '<span>' + esc(it.name) + '</span>' +\n"
     "          (st.badge ? '<b class=\"' + st.cls + '\">' + esc(st.badge) + '</b>' : '') + '</button>';\n"
     "      }).join('');\n"),
    ("      grid.innerHTML = h;\n      lib3d().then(",
     "      grid.innerHTML = h; grid.scrollTop = scroll; ixFill(grid);\n      lib3d().then("),
    # ---- My World's 3D library: slots
    ("      h += '<div class=\"ix\"><b>' + g[1] + ' <em>' + list.length + '</em></b>' + list.map(function (a) {\n"
     "        return '<button type=\"button\" data-lib=\"' + esc(a.id) + '\" class=\"' + (ui.lib === a.id ? 'sel' : '') + '\" title=\"' + esc(a.subtitle || a.category || '') + '\">' + esc(a.name) + '</button>';\n"
     "      }).join('') + '</div>';\n"
     "    });\n"
     "    grid.innerHTML = h;\n",
     "      h += '<h5 class=\"ixh\">' + g[1] + ' · ' + list.length + '</h5>' + list.map(function (a) {\n"
     "        var src = libPic(a.id), tip = a.name + (a.subtitle || a.category ? ' — ' + (a.subtitle || a.category) : '');\n"
     "        return '<button type=\"button\" class=\"it' + (ui.lib === a.id ? ' sel' : '') + '\" data-lib=\"' + esc(a.id) + '\" title=\"' + esc(tip) + '\">' +\n"
     "          (src ? '<img alt=\"\" src=\"' + src + '\">' : '<i' + (LIB.thumb ? ' data-lt=\"' + esc(a.id) + '\"' : '') + ' class=\"ixw\">·</i>') + '<span>' + esc(a.name) + '</span></button>';\n"
     "      }).join('');\n"
     "    });\n"
     "    grid.innerHTML = h; grid.scrollTop = scroll; ixFill(grid);\n"),
    ("    if (ui.cat === 'index') { renderIndex(all, grid); preview(); hotbar(host); return; }",
     "    grid.classList.toggle('ixg', ui.cat === 'index');\n"
     "    if (ui.cat === 'index') { renderIndex(all, grid); preview(); hotbar(host); return; }"),
    # ---- styles: the Index slots are a size smaller than the other pages'
    ("#mn-bp .it span { flex: none; line-height: 18px; }\n",
     "#mn-bp .it span { flex: none; line-height: 18px; }\n"
     "#mn-bp .grid.ixg { grid-template-columns: repeat(auto-fill, minmax(68px, 1fr)) !important; }\n"
     "#mn-bp .grid.ixg .it { height: 84px !important; min-height: 84px !important; padding: 4px 2px 3px; }\n"
     "#mn-bp .grid.ixg .it img { width: 52px; height: 52px; }\n"
     "#mn-bp .grid.ixg .it i { height: 52px; line-height: 52px; }\n"
     "#mn-bp .grid.ixg .it i.ixw { opacity: .45; }\n"
     "#mn-bp .grid.ixg .it i svg.px { width: 36px; height: 36px; margin: 8px auto; }\n"
     "#mn-bp .grid.ixg .it span { font-size: 10px; line-height: 14px; padding: 0 2px; }\n"
     "#mn-bp .grid.ixg h5.ixh { margin-top: 6px; }\n"),
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

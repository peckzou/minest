#!/usr/bin/env python3
"""Magical Backpack · Index page: categories, and only the chosen category's thumbnails are loaded.

  · A row of category keys sits on top of the Index (the backpack's own groups and My World's library groups).
    One category is shown at a time, so a few dozen slots are drawn instead of the whole catalogue.
  · My World's 3D library (a 2.9 MB script) is read only when one of its categories is opened.
  · Library slots show the library's cached still thumbnails, several at a time instead of one by one.

Run from the repository root:  python3 tools/console-fold/patch_index_cats.py
"""
from pathlib import Path

FILE = Path('iphone.html')
s = FILE.read_text(encoding='utf-8')

a = s.index('  function ixFill(grid) {')
b = s.index('  function libPreview(pv) {', a)

NEW = r"""  function ixFill(grid) {   // pictures for the slots on screen: library stills four at a time, the backpack's own models one at a time
    var gen = (ui.gen = (ui.gen || 0) + 1), busy = 0, T = ui.host.THREE, all = items();
    function step() {
      if (!ui || ui.gen !== gen || ui.el.hidden || ui.cat !== 'index') return;
      var bounds = grid.getBoundingClientRect(), slots = grid.querySelectorAll('i[data-th],i[data-lt]');
      for (var j = 0; j < slots.length && busy < 4; j++) {
        var slot = slots[j], box = slot.getBoundingClientRect();
        if (box.bottom < bounds.top - 60 || box.top > bounds.bottom + 60) continue;
        var k = slot.getAttribute('data-th');
        if (k != null && busy) return;
        busy++; run(slot, k, slot.getAttribute('data-lt'));
        if (k != null) return;
      }
    }
    function run(slot, k, id) {
      var done = false;
      slot.removeAttribute('data-th'); slot.removeAttribute('data-lt');
      var put = function (src) {
        if (done) return; done = true; busy--;
        if (src && slot.isConnected) { var im = document.createElement('img'); im.alt = ''; im.decoding = 'async'; im.src = src; slot.replaceWith(im); }
        setTimeout(step, 0);
      };
      if (k != null) {
        (root.requestIdleCallback || function (fn) { return setTimeout(fn, 60); })(function () {
          var it = all.filter(function (x) { return x.key === k; })[0], src = '';
          try { src = it ? thumb(T, it) : ''; } catch (e) {}
          put(src);
        }, { timeout: 350 });
      } else {
        setTimeout(function () { put(''); }, 6000);
        try { Promise.resolve(LIB.thumb(id)).then(function (u) { if (u) LIBPIC[id] = u; put(u); }, function () { put(''); }); } catch (e) { put(''); }
      }
    }
    grid.onscroll = step; step();
  }
  function renderIndex(all, grid) {
    var q = ui.q, hit = function (t) { return !q || String(t).toLowerCase().indexOf(q) >= 0; };
    var scroll = grid.scrollTop, host = ui.host, PV = null; try { PV = previewer(host.THREE); } catch (e) {}
    var here = !!(ui.host && ui.host.placeLib);   // My World's island: the library is what goes down here, so its categories come first
    var C = LIB ? (LIB.catalog || {}) : null;
    var own = BP_GROUPS.map(function (g) {
      return { id: 'bp:' + g[0], name: g[1], list: all.filter(function (it) { return it.cat === g[0] && hit(it.name + ' ' + (it.note || '') + ' ' + (it.en || '')); }) };
    }).filter(function (c) { return c.list.length; });
    var lib = LIB_GROUPS.map(function (g) {
      return { id: 'lib:' + g[0], name: g[1], lib: true, list: C ? (C[g[0]] || []).filter(function (x) { return hit(x.name + ' ' + (x.subtitle || '') + ' ' + (x.category || '') + ' ' + x.id); }) : null };
    }).filter(function (c) { return !c.list || c.list.length; });
    var cats = here ? lib.concat(own) : own.concat(lib);
    var cur = cats.filter(function (c) { return c.id === ui.ixc; })[0];
    if (!cur || (q && cur.list && !cur.list.length)) cur = cats.filter(function (c) { return !q || !c.list || c.list.length; })[0] || cats[0];
    ui.ixc = cur ? cur.id : null;
    var h = '<div class="ixc" role="tablist" aria-label="Index 分类">' + cats.map(function (c) {
      return '<button type="button" role="tab" aria-selected="' + (c === cur) + '" data-ixc="' + c.id + '" class="' + (c === cur ? 'on' : '') + '">' + c.name + (c.list ? ' <em>' + c.list.length + '</em>' : '') + '</button>';
    }).join('') + '</div>';
    if (!cur) { grid.innerHTML = h + '<h5>没有找到</h5>'; return; }
    if (!cur.lib) {
      h += '<h5 class="ixh">' + (here ? '背包里的物品 · 在 Spatial Home 和圣托里尼里摆放' : '背包里的物品 · 可以直接放出来') + '</h5>' + cur.list.map(function (it) {
        var ok = it.ready !== false, src = ok && PV ? PV.cache[it.key] : '', st = {}; try { st = host.status(it) || {}; } catch (e) {}
        var tip = it.name + (ok ? '' : ' · 未完成') + (it.note ? ' — ' + it.note : '');
        return '<button type="button" class="it' + (ui.sel === it.key ? ' sel' : '') + (ok ? '' : ' off') + '" data-key="' + esc(it.key) + '" title="' + esc(tip) + '">' +
          (src ? '<img alt="" src="' + src + '">' : '<i' + (ok && PV && src === undefined ? ' data-th="' + esc(it.key) + '"' : '') + '>' + pix(it) + '</i>') + '<span>' + esc(it.name) + '</span>' +
          (st.badge ? '<b class="' + st.cls + '">' + esc(st.badge) + '</b>' : '') + '</button>';
      }).join('');
      grid.innerHTML = h; grid.scrollTop = scroll; ixFill(grid);
      return;
    }
    if (!LIB) {   // the library is read only when one of its categories is opened
      h += '<h5 class="ixh ixnote">正在读取 My World 3D 库…</h5>';
      grid.innerHTML = h; grid.scrollTop = 0;
      lib3d().then(function (L) {
        if (!ui || ui.cat !== 'index' || ui.el.hidden) return;
        if (L) render(); else { var n = grid.querySelector('.ixnote'); if (n) n.textContent = '这个页面里没有 My World 的 3D 库（在 Minest 里打开背包才会列出）。'; }
      });
      return;
    }
    h += '<h5 class="ixh">My World 3D 库 · ' + (here ? '点一件，再点「放到岛上」' : '在 My World 的「建造」里摆放') + '</h5>' + cur.list.map(function (x) {
      var src = libPic(x.id), tip = x.name + (x.subtitle || x.category ? ' — ' + (x.subtitle || x.category) : '');
      return '<button type="button" class="it' + (ui.lib === x.id ? ' sel' : '') + '" data-lib="' + esc(x.id) + '" title="' + esc(tip) + '">' +
        (src ? '<img alt="" decoding="async" src="' + src + '">' : '<i' + (LIB.thumb ? ' data-lt="' + esc(x.id) + '"' : '') + ' class="ixw">·</i>') + '<span>' + esc(x.name) + '</span></button>';
    }).join('');
    grid.innerHTML = h; grid.scrollTop = scroll; ixFill(grid);
  }
"""
s = s[:a] + NEW + s[b:]

old_click = "    if (b.dataset.cat) { ui.cat = b.dataset.cat; render(); return; }\n    if (b.dataset.key) { ui.sel = b.dataset.key; ui.lib = null; render(); return; }"
assert s.count(old_click) == 1
s = s.replace(old_click, "    if (b.dataset.ixc) { ui.ixc = b.dataset.ixc; ui.el.querySelector('.grid').scrollTop = 0; render(); return; }\n" + old_click)

old_css = "#mn-bp .grid.ixg h5.ixh { margin-top: 6px; }\n"
assert s.count(old_css) == 1
s = s.replace(old_css, old_css + """#mn-bp .grid.ixg .ixc { grid-column: 1 / -1; display: flex; gap: 4px; overflow-x: auto; scrollbar-width: none; position: sticky; top: 0; z-index: 2; padding: 0 0 4px; background: #c6c6c6; touch-action: pan-x; }
#mn-bp .grid.ixg .ixc::-webkit-scrollbar { display: none; }
#mn-bp .grid.ixg .ixc button { flex: none; min-height: 30px; padding: 3px 9px; border: 2px solid #111; border-radius: 0; background: #8b8b8b; color: #fff; font: inherit; font-size: 11px; font-weight: 700; text-shadow: 1px 1px 0 #3f3f3f; cursor: pointer; white-space: nowrap; }
#mn-bp .grid.ixg .ixc button.on { background: #fff; color: #111; text-shadow: none; }
#mn-bp .grid.ixg .ixc button em { font-style: normal; opacity: .75; margin-left: 2px; }
""")

FILE.write_text(s, encoding='utf-8')
print('ok')

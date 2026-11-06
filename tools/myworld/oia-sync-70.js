/* 70 · the voxel world and 2D My World as one: 3D buildings ↔ the island's pieces, 3D displays ↔ the displays in that
   building's rooms, cards from this world's own board; and a tidier console (tools/myworld/patch_oia_sync_70.py). */
(function () {
  'use strict';
  if (window.MinestOiaSync) return;
  var H = null, timer = 0, pulled = false;
  var KIND = { easel: '画架', shelf: '书架', showcase: '展柜', wall: '展板' };
  function api() { return window.MinestOiaBld; }
  function esc(s) { return String(s == null ? '' : s).replace(/[&<>"]/g, function (c) { return { '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;' }[c]; }); }

  // ---- catch the world's hooks (My World binds them on the voxel world's first open)
  function wrapBind() {
    var O = window.MinestOia; if (!O || O.__sync70) return !!O;
    var bind0 = O.bind; O.bind = function (h) { H = h; pulled = false; return bind0.apply(O, arguments); }; O.__sync70 = 1;
    var open0 = O.open; if (open0) O.open = function () { var r = open0.apply(O, arguments); pulled = false; setTimeout(pull, 900); return r; };
    return true;
  }
  if (!wrapBind()) { var tries = 0, iv = setInterval(function () { if (wrapBind() || ++tries > 120) clearInterval(iv); }, 250); }

  // ---- what the voxel world holds now
  function buildingOf(d, bs) {   // a display belongs to the building it stands in or next to
    var best = null, bd = 1e9;
    bs.forEach(function (b) {
      var dx = Math.max(b.x0 - d.x, 0, d.x - b.x1 - 1), dz = Math.max(b.z0 - d.z, 0, d.z - b.z1 - 1), dist = Math.sqrt(dx * dx + dz * dz);
      if (dist < bd) { bd = dist; best = b; }
    });
    return best && bd <= 10 ? best : null;
  }
  function collect() {
    var a = api(); if (!a) return null;
    var rec = a.record() || {}, m = rec.m || {}, bs = a.buildings(), live = {};
    var out = { bld: [], disp: [] };
    bs.forEach(function (b) { live[b.id] = 1; out.bld.push({ id: b.id, kind: b.kind, name: b.name || null, cx: (b.x0 + b.x1 + 1) / 2, cz: (b.z0 + b.z1 + 1) / 2, rot: (m[b.id] && m[b.id].rot) || 0, gone: !!(m[b.id] && m[b.id].gone) }); });
    Object.keys(m).forEach(function (id) { if (m[id] && m[id].gone && !live[id]) out.bld.push({ id: id, gone: true }); });
    var standing = bs.filter(function (b) { return !(m[b.id] && m[b.id].gone); });
    (a.displays() || []).forEach(function (d) { var b = buildingOf(d, standing); out.disp.push({ id: d.id, kind: d.kind, cardId: d.cardId, x: d.x, z: d.z, bid: b ? b.id : null, bname: b ? b.name || null : null }); });
    return out;
  }
  function push() {   // the voxel world → 2D My World
    clearTimeout(timer);
    timer = setTimeout(function () { if (!H || !H.sync) return; var info = collect(); if (!info) return; try { H.sync(info); } catch (e) { if (window.console) console.error('oia-sync', e); } decorate(); }, 250);
  }
  function pull() {   // 2D My World → the voxel world: a card changed or a mirrored display removed in a room
    if (pulled || !H || !H.pull || !H.bldSet) return; pulled = true;
    var p = null; try { p = H.pull(); } catch (e) { return; }
    if (!p || (!Object.keys(p.cards || {}).length && !(p.gone || []).length)) return push();
    H.bldSet(function (rec) {
      rec.displays = (rec.displays || []).filter(function (d) { return (p.gone || []).indexOf(d.id) < 0; });
      rec.displays.forEach(function (d) { if (p.cards[d.id]) d.cardId = p.cards[d.id]; });
    });
    var a = api(); if (a && a.reapply) a.reapply();
    window.dispatchEvent(new Event('minest-world-edit'));
  }
  window.addEventListener('minest-world-edit', push);

  // ---- the console: compact tool rails, a live header, the 2D side of what is selected, a card picker
  function setCard(id, ref) {
    if (!H || !H.bldSet) return;
    H.bldSet(function (rec) { (rec.displays || []).forEach(function (d) { if (d.id === id) d.cardId = ref; }); });
    var a = api(); if (a && a.reapply) a.reapply();
    window.dispatchEvent(new Event('minest-world-edit'));
  }
  function decorate() {
    var c = document.getElementById('oia-console'); if (!c) return;
    c.querySelectorAll('.console-grid > nav:first-child button').forEach(function (b) {
      if (b.__c70) return; b.__c70 = 1; var parts = b.innerHTML.split('<br>');
      if (parts.length === 2) b.innerHTML = '<i>' + parts[0] + '</i><span>' + parts[1] + '</span>';
    });
    var a = api(), head = c.querySelector('header span');
    if (head && a) {
      var sel = a.selected && a.selected(), b = sel && a.buildings().filter(function (x) { return x.id === sel; })[0];
      var t = b ? '已选 · ' + (b.name || (H && H.label && H.label(b.id)) || b.id) : a.buildings().length + ' 栋建筑';
      if (head.textContent !== t) head.textContent = t;
    }
    var panel = document.getElementById('mn-bld-p'); if (!panel || panel.hidden || !a) return;
    var tool = c.dataset.tool, box = panel.querySelector('.o70-link');
    var html = '';
    if (tool === 'bld' && a.selected && a.selected()) {
      var bid = a.selected(), info = H && H.info ? H.info(bid) : null;
      html = '<b>⇄ My World 2D</b><p>' + (info ? esc(info.label || bid) + ' · ' + info.rooms + ' 个房间 · ' + info.displays + ' 个陈列 · ' + info.things + ' 件卡片' : '这栋楼在 2D 里还没有房间，进入房间后会自动建好') + '</p><p class="o70-sub">移动、旋转、复制、移除会同步到 2D 小岛；房间与陈列两边共用。</p>';
    } else if (tool === 'disp') {
      var did = a.selectedDisplay && a.selectedDisplay(), info2 = collect(), d = info2 && info2.disp.filter(function (x) { return x.id === did; })[0];
      var cards = (a.getActiveCards && a.getActiveCards()) || [], own = cards.length && cards[0].own;
      html = '<b>⇄ My World 2D</b><p>' + (own ? '卡片来自这个世界的看板（' + cards.length + ' 张）' : '这个世界的看板还没有卡片，先用示例卡片') + '</p>';
      if (d) {
        html += '<p class="o70-sub">' + (d.bid ? '同步到 2D：' + esc(d.bname || (H && H.label && H.label(d.bid)) || d.bid) + ' › 3D 陈列 房间' : '离建筑太远，只在 3D 里展示；挪到建筑旁即可进 2D') + '</p>';
        html += '<div class="o70-cards" role="listbox" aria-label="选择展出的卡片">' + cards.slice(0, 60).map(function (k) {
          return '<button type="button" role="option" data-o70card="' + esc(k.id) + '" aria-selected="' + (k.id === d.cardId) + '">' + (k.pic ? '<img alt="" loading="lazy" src="' + esc(k.pic) + '">' : '<em>' + esc(String(k.title || '?').charAt(0)) + '</em>') + '<span>' + esc(k.title) + '</span></button>';
        }).join('') + '</div>';
      } else html += '<p class="o70-sub">轻点画面里的展架选中它，就能换上看板里的任意一张卡片。</p>';
    }
    if (!html) { if (box) box.remove(); return; }
    if (!box) { box = document.createElement('div'); box.className = 'o70-link'; if (tool === 'bld') panel.insertBefore(box, panel.firstChild); else panel.appendChild(box); }
    if (box.__h !== html) { box.innerHTML = html; box.__h = html; }
  }
  document.addEventListener('click', function (e) {
    var b = e.target.closest && e.target.closest('[data-o70card]'); if (!b) return;
    e.stopPropagation(); var a = api(), id = a && a.selectedDisplay && a.selectedDisplay();
    if (id) setCard(id, b.getAttribute('data-o70card'));
  }, true);
  var q = false;
  new MutationObserver(function () { if (q) return; q = true; requestAnimationFrame(function () { q = false; decorate(); }); }).observe(document.body, { childList: true, subtree: true });

  window.MinestOiaSync = { version: '70.0', push: push, pull: function () { pulled = false; pull(); }, collect: collect, hooks: function () { return H; } };
})();

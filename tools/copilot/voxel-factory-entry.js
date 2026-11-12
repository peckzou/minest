/* 3D Display (Copilot's voxel-factory/, 2026-11-12): this My World world's things, crafted and set out on shelves in a
   voxel workshop. window.MinestVoxelFactory.open(bid) — and a ◇ 3D Display button in the My World console's tool row.
   Only titles go across (in the address); the voxel factory keeps its own layout (minest3d.world.v1) and never writes
   to Minest's boards. The iOS bundle opens the live page. */
(function () {
  if (window.MinestVoxelFactory) return;
  function boards() { try { return (window.MinestAI && MinestAI.boards && MinestAI.boards()) || []; } catch (e) { return []; } }
  /* the world on show: My World's first crumb is its board's title */
  function curBid() {
    try {
      if (!(window.MinestDisplay && MinestDisplay.isOpen && MinestDisplay.isOpen())) return null;
      var t = window.MinestWorldFold && MinestWorldFold.crumbs && MinestWorldFold.crumbs()[0]; if (!t) return null;
      var b = boards().filter(function (x) { return String(x.title || '') === String(t); })[0]; return b ? b.id : null;
    } catch (e) { return null; }
  }
  function items(bid) {
    var b = boards().filter(function (x) { return x.id === bid; })[0], K = window.MinestKnowledge, out = [];
    ((b && b.columns) || []).forEach(function (col) { (col.cards || []).forEach(function (c) {
      if (!c || !c.id || (K && K.isHeading && K.isHeading(c.id)) || (K && K.get && K.get('sk:' + c.id)) || /inbox/i.test(c.title || '')) return;
      (c.stack || []).forEach(function (s) { if (s && s.title && out.length < 48) out.push(String(s.title).replace(/\s+/g, ' ').trim().slice(0, 40)); });
    }); });
    return out;
  }
  function toast(m) { try { GlassUI.toast(m); } catch (e) { try { alert(m); } catch (e2) {} } }
  function open(bid) {
    bid = bid || curBid(); var its = items(bid);
    if (!its.length) return toast('Nothing in this world to display yet — add something first.');
    var base = /^https?:$/.test(location.protocol) ? 'voxel-factory/index.html' : 'https://minest-app.vercel.app/voxel-factory/index.html';
    var f = document.createElement('div'); f.id = 'mn-vf3d'; f.style.cssText = 'position:fixed;inset:0;z-index:2147483560;background:#cfe6f5';
    f.innerHTML = '<iframe src="' + base + '?kit=voxel-foundry&items=' + encodeURIComponent(its.join('\n')) + '" style="border:0;width:100%;height:100%" title="3D Display" allow="fullscreen"></iframe>' +
      '<button type="button" style="position:absolute;right:12px;bottom:calc(12px + env(safe-area-inset-bottom));padding:8px 14px;border-radius:10px;border:0;background:#2b2118;color:#fff;font:600 14px system-ui">Close 3D</button>';
    f.querySelector('button').onclick = function () { f.remove(); };
    document.body.appendChild(f);
  }
  setInterval(function () {
    var acts = document.querySelector('aside.wf .wf-acts'); if (!acts || acts.querySelector('[data-vf3d]') || !curBid()) return;
    var b = document.createElement('button'); b.type = 'button'; b.setAttribute('data-vf3d', ''); b.title = '3D Display — this world\'s things in a voxel workshop';
    b.innerHTML = '<i>◇</i>3D Display'; b.addEventListener('click', function (e) { e.stopPropagation(); open(); });
    acts.appendChild(b);
  }, 800);
  window.MinestVoxelFactory = { open: open, items: items };
})();

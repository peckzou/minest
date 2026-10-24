  (function () {   // ⛰ lit while in land mode: on the island, and in a room (a room grows by its own plots — the building's outside stays)
    var r0 = render; render = function () { var out = r0.apply(null, arguments); try { var b = el && el.querySelector('.mn-hud [data-expand]'); if (b) { b.classList.toggle('on', !!(V && V.expand)); b.hidden = !!(V && V.at && !V.at.room); } } catch (e) {} return out; };
  })();
  /* ── 53.85 · a room's own space from the building view: the picked room's bar gets ⛰ ＋ Space / − Space — a row of plots
     more or less inside the room (its contents stay; a plot with something on it is never taken away). The building's
     outside does not change. In the building view ⛰ (island land mode) is hidden: it would grow the island, unseen. */
  (function () {
    var bb0 = bvBar; bvBar = function (sel) { var h = bb0(sel), d = roomD(sel), n = (d.land || DEF_LAND).length;
      return h + '<div class="row"><span class="lb">Space</span><button type="button" data-rgrow="' + esc(sel.id) + '">⛰ ＋ Space</button><button type="button" data-rshrink="' + esc(sel.id) + '"' + (n <= 9 ? ' disabled' : '') + '>− Space</button><span class="lb">' + n + ' plots · ' + (lboxOf(d)) + '</span></div>'; };
    function lboxOf(d) { var b = boxOf(d.land || DEF_LAND); return (b.x1 - b.x0) + ' × ' + (b.y1 - b.y0) + ' blocks'; }
    function roomById(id) { var b = bldOf(); return b && (b.rooms || []).filter(function (r) { return r.id === id; })[0] || null; }
    document.addEventListener('click', function (e) {
      var g = e.target.closest && e.target.closest('[data-rgrow], [data-rshrink]'); if (!g || !el || !el.contains(g) || g.disabled) return;
      e.preventDefault(); e.stopImmediatePropagation();
      var grow = g.hasAttribute('data-rgrow'), r = roomById(g.getAttribute(grow ? 'data-rgrow' : 'data-rshrink')); if (!r) return;
      var d = roomD(r), ok = withD(d, function () {
        if (grow) return growLand();
        var land = landOf(); if (land.length <= 9) return false;
        for (var i = land.length - 1; i >= 0; i--) if (plotFree(land[i])) { d.land = land.filter(function (x, j) { return j !== i; }); return true; }
        return false;
      });
      if (!ok) { toast(grow ? 'That is as big as a room gets' : 'Nothing free to take away — move what stands at the edge first'); return; }
      save(); if (BV) bvDraw(); render(); hap('light');
      toast('⛰ ' + (r.n || ROOMS[r.k][0]) + ': ' + (d.land || []).length + ' plots (' + lboxOf(d) + ') — the building outside stays the same');
    }, true);
    var bv1 = bvDraw; bvDraw = function () { var out = bv1.apply(null, arguments); try { var b = el && el.querySelector('.mn-hud [data-expand]'); if (b) b.hidden = !!(V && V.at && !V.at.room); } catch (e) {} return out; };
  })();


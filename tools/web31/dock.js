/* Minest Dock — a macOS-style dock: tiles that swell under the pointer (the neighbours a little less), a name
   bubble beside the one you point at. On a touch screen a tap (or a slide along the dock) picks an icon — it
   stays swollen with its name — and a second tap on it opens it; a mouse opens with one click, as on a Mac. 
   Used by web31 and the iPhone / iPad pages.
     MinestDock.attach(container, {
       axis: 'y' | 'x', side: 'left' | 'right' | 'top' | 'bottom', base: 46 | function, max: 1.65,
       items: '.selector' (inside the container)  — or tiles: function () { return [elements] },
       boxes: [elements that receive the pointer] (default: the container),
       mode: 'size' (tiles really grow; the column reflows) | 'transform' (scale + push apart; the layout
             is untouched — for docks whose positions are computed elsewhere),
       contain: true | margin px (transform mode: the swollen row stays on screen)
     })   */
(function () {
  'use strict';
  if (window.MinestDock) return;
  var CSS = [
    '.mdk-tile{transition:width .14s ease-out,height .14s ease-out}',
    '.mdk-tile.mdk-t{transition:scale .14s ease-out,translate .14s ease-out}',
    '.mdk-label{position:fixed;z-index:2147483300;pointer-events:none;padding:6px 11px;border-radius:9px;background:rgba(36,36,44,.86);color:#fff;font:600 13px -apple-system,BlinkMacSystemFont,"SF Pro Text",Inter,system-ui,sans-serif;',
    'white-space:nowrap;box-shadow:0 6px 18px rgba(0,0,0,.3);-webkit-backdrop-filter:blur(14px);backdrop-filter:blur(14px);border:1px solid rgba(255,255,255,.12);opacity:0;transition:opacity .12s}',
    '.mdk-label.show{opacity:1}',
    '.mdk-label::after{content:"";position:absolute;width:9px;height:9px;background:inherit;border:inherit;border-width:0 1px 1px 0;transform:rotate(45deg)}',
    '.mdk-label.to-left::after{right:-5px;top:calc(50% - 5px);transform:rotate(-45deg)}',
    '.mdk-label.to-right::after{left:-5px;top:calc(50% - 5px);transform:rotate(135deg)}',
    '.mdk-label.to-top::after{left:calc(50% - 5px);bottom:-5px}',
    '.mdk-label.to-bottom::after{left:calc(50% - 5px);top:-5px;transform:rotate(225deg)}'
  ].join('\n');
  function ensureCss() { if (document.getElementById('mdk-css')) return; var s = document.createElement('style'); s.id = 'mdk-css'; s.textContent = CSS; document.head.appendChild(s); }

  function attach(box, o) {
    ensureCss();
    o = o || {};
    var axis = o.axis || 'y', side = o.side || 'right', max = o.max || 1.65, base = 46, reach = 150, mode = o.mode || 'size';
    var boxes = o.boxes || [box];
    // axis / side are read every time, so a dock can move (left · bottom · right) without attaching again
    function sizes() { axis = o.axis || 'y'; side = o.side || 'right'; base = typeof o.base === 'function' ? o.base() : (o.base || 46); reach = o.reach || base * 3.2; }
    var label = document.createElement('div'); label.className = 'mdk-label'; document.body.appendChild(label);
    var raf = 0, pos = null, scrub = null;
    function tiles() {
      var list = o.tiles ? o.tiles() : Array.prototype.slice.call(box.querySelectorAll(o.items || ':scope > *'));
      return list.filter(function (t) { return t && t.offsetParent !== null; });
    }
    function nameOf(t) { var b = t.matches('button') ? t : (t.querySelector('button') || t); return (o.label && o.label(t)) || t.getAttribute('aria-label') || t.title || b.getAttribute('aria-label') || b.title || ''; }
    // where a tile sits at rest (along the axis), whatever its current swell / push
    function restC(t) { var r = t.getBoundingClientRect(); return (axis === 'y' ? r.top + r.height / 2 : r.left + r.width / 2) - (t.__push || 0); }
    function apply() {
      raf = 0; sizes();
      var ts = tiles(), best = null, bestS = 1;
      var info = ts.map(function (t) {
        var c = restC(t), s = 1;
        if (pos != null) { var d = Math.abs(pos - c); if (d < reach) s = 1 + (max - 1) * Math.cos((d / reach) * Math.PI / 2); }
        if (s > bestS) { bestS = s; best = t; }
        return { t: t, c: c, s: s };
      });
      if (mode === 'size') {
        info.forEach(function (x) {
          if (!x.t.classList.contains('mdk-tile')) x.t.classList.add('mdk-tile');
          var px = Math.round(base * x.s) + 'px';
          x.t.style.setProperty('width', px, 'important'); x.t.style.setProperty('height', px, 'important');
        });
      } else {
        // scale each tile and push its neighbours apart by the room the swell takes
        info.sort(function (a, b) { return a.c - b.c; });
        var p = -1; info.forEach(function (x, i) { if (x.t === best) p = i; });
        info.forEach(function (x, i) {
          var push = 0;
          if (p >= 0 && i !== p) {
            var dir = i > p ? 1 : -1, sum = (info[p].s - 1) * base / 2 + (x.s - 1) * base / 2;
            for (var k = p + dir; k !== i; k += dir) sum += (info[k].s - 1) * base;
            push = dir * sum;
          }
          x.push = push;
        });
        // contain: keep the swollen row on screen — slide it back in, and squeeze it if it is wider than the screen
        if (o.contain && info.length) {
          var m = o.contain === true ? 6 : o.contain, lim = axis === 'y' ? innerHeight : innerWidth;
          var half = function (x) { return (axis === 'y' ? x.t.offsetHeight : x.t.offsetWidth) * x.s / 2; };
          var a0 = info[0], a1 = info[info.length - 1];
          var lo = function (k) { return a0.c + a0.push * k - half(a0); }, hi = function (k) { return a1.c + a1.push * k + half(a1); };
          var k = 1, room = lim - 2 * m;
          if (hi(1) - lo(1) > room) { var span0 = hi(0) - lo(0), span1 = hi(1) - lo(1); k = span1 > span0 ? Math.max(0, (room - span0) / (span1 - span0)) : 1; }
          var shift = 0;
          if (lo(k) < m) shift = m - lo(k); else if (hi(k) > lim - m) shift = lim - m - hi(k);
          info.forEach(function (x) { x.push = x.push * k + shift; });
        }
        info.forEach(function (x) {
          var push = x.push;
          x.t.__push = push;
          if (!x.t.classList.contains('mdk-t')) x.t.classList.add('mdk-tile', 'mdk-t');
          x.t.style.setProperty('transform-origin', side === 'right' ? 'right center' : side === 'left' ? 'left center' : side === 'bottom' ? 'center bottom' : 'center top', 'important');
          x.t.style.setProperty('scale', x.s === 1 ? '1' : x.s.toFixed(3), 'important');
          x.t.style.setProperty('translate', axis === 'y' ? '0 ' + push.toFixed(1) + 'px' : push.toFixed(1) + 'px 0', 'important');
          x.t.style.zIndex = x.s > 1.01 ? String(Math.round(x.s * 100)) : '';
        });
      }
      if (best && bestS > 1.25) {
        var n = nameOf(best);
        if (n) {
          label.textContent = n;
          var r = best.getBoundingClientRect(), lw = label.offsetWidth, lh = label.offsetHeight;
          label.className = 'mdk-label show to-' + (side === 'right' ? 'left' : side === 'left' ? 'right' : side === 'bottom' ? 'top' : 'bottom');
          if (side === 'right') { label.style.left = (r.left - lw - 14) + 'px'; label.style.top = (r.top + r.height / 2 - lh / 2) + 'px'; }
          else if (side === 'left') { label.style.left = (r.right + 14) + 'px'; label.style.top = (r.top + r.height / 2 - lh / 2) + 'px'; }
          else if (side === 'bottom') { label.style.left = (r.left + r.width / 2 - lw / 2) + 'px'; label.style.top = (r.top - lh - 12) + 'px'; }
          else { label.style.left = (r.left + r.width / 2 - lw / 2) + 'px'; label.style.top = (r.bottom + 12) + 'px'; }
        } else label.classList.remove('show');
      } else label.classList.remove('show');
    }
    function kick() { if (!raf) raf = requestAnimationFrame(apply); }
    function at(x, y) { pos = axis === 'y' ? y : x; kick(); }
    function leave() { pos = null; sel = null; clearTimeout(selT); kick(); }
    // a finger picks first, opens second (like pointing, then clicking, on a Mac): the tile it lands or lifts on
    // stays swollen with its name; a tap on that same tile opens it
    var sel = null, selT = 0;
    function pick(t) {
      sel = t; pos = restC(t); kick();
      clearTimeout(selT); selT = setTimeout(leave, 6000);
    }
    document.addEventListener('touchstart', function (e) {
      if (sel && !boxes.some(function (b2) { return b2.contains(e.target); })) leave();
    }, { capture: true, passive: true });
    sizes(); window.addEventListener('resize', function () { sizes(); kick(); });
    boxes.forEach(function (bx) {
      bx.addEventListener('mousemove', function (e) { at(e.clientX, e.clientY); });
      bx.addEventListener('mouseleave', function (e) { if (!boxes.some(function (b2) { return e.relatedTarget && b2.contains(e.relatedTarget); })) leave(); });
      // a finger: slide along the dock, lift on the one you want
      bx.addEventListener('touchstart', function (e) {
        if (e.touches.length !== 1) return;
        var p = e.touches[0]; scrub = { x: p.clientX, y: p.clientY, lx: p.clientX, ly: p.clientY, moved: false };
        at(p.clientX, p.clientY);
      }, { passive: true });
      bx.addEventListener('touchmove', function (e) {
        if (!scrub || e.touches.length !== 1) return;
        var p = e.touches[0];
        if (Math.hypot(p.clientX - scrub.x, p.clientY - scrub.y) > 8) scrub.moved = true;
        if (scrub.moved && e.cancelable) e.preventDefault();
        scrub.lx = p.clientX; scrub.ly = p.clientY;
        at(p.clientX, p.clientY);
      }, { passive: false });
      bx.addEventListener('touchend', function (e) {
        var s = scrub; scrub = null;
        if (!s) return;
        var hit = null, best = 1e9;
        tiles().forEach(function (t) { var d = Math.abs((axis === 'y' ? s.ly : s.lx) - restC(t)); if (d < best) { best = d; hit = t; } });
        if (!hit || best >= base * 0.75) { leave(); return; }
        if (!s.moved && hit === sel) { clearTimeout(selT); setTimeout(leave, 260); return; }   // the second tap: let it open
        if (e.cancelable) e.preventDefault();   // the first tap / a slide only picks it
        pick(hit);
      });
    });
    kick();
    return { refresh: kick, leave: leave };
  }
  window.MinestDock = { attach: attach };
})();

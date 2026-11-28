/* Minest · the Duo's pages in the system Dock (2026-11-26, the user's three rules, page by page):
     1 folded, the Dock holds the four system keys (✕ ‹ ⛶ =); unfolded, the keys of the page on screen — the page's own
       buttons move into the Dock (handed over with MinestSystemBar.page, as the 3D Cover's modes are)
     2 one look, nothing doubled: while the Dock holds them, a page's own control buttons step aside; the Dock never hides
       under a page (only the outer screen's Glance page and reading mode put it away); full-screen pages keep clear of
       the Dock's column
     3 ✕ closes the page on screen (its own ✕ / Back / API); with no page open — the board, the outermost layer — it goes
       home to Spatial Home; in Spatial Home (home) it says so. ‹ steps back inside a page (My World's levels).
   The Duo only (html.duo); every other phone keeps the system Dock as it is. window.MinestDuoPages = { page(), close() } */
(function () {
  'use strict';
  if (window.MinestDuoPages) return;
  var R = document.documentElement;
  function duo() { return R.classList.contains('duo'); }
  function SB() { return window.MinestSystemBar && MinestSystemBar.page ? MinestSystemBar : null; }
  /* laid out (a page's own buttons may be visibility:hidden here: the Dock stands in for them) */
  function laid(el) { if (!el || !el.isConnected) return false; var r = el.getBoundingClientRect(); return r.width >= 2 && r.height >= 2 && getComputedStyle(el).display !== 'none'; }
  function big(el) { if (!laid(el)) return false; var r = el.getBoundingClientRect(), c = getComputedStyle(el); return r.width >= innerWidth * .5 && r.height >= innerHeight * .5 && c.visibility !== 'hidden' && (+c.opacity > .05 || !!el.__duoMo); }   // __duoMo: faded by duo-motion.js, still open
  function api(n) { try { return window[n] || null; } catch (e) { return null; } }
  function esc() { document.dispatchEvent(new KeyboardEvent('keydown', { key: 'Escape', code: 'Escape', keyCode: 27, bubbles: true, cancelable: true })); }
  function name(b) { return (b.getAttribute('aria-label') || b.title || b.textContent || '').replace(/\s+/g, ' ').trim(); }
  var S = function (p) { return '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true">' + p + '</svg>'; };
  var IC = {
    dot: S('<circle cx="12" cy="12" r="2.2" fill="currentColor"/>'),
    board: S('<rect x="3" y="4" width="5" height="16" rx="1.5"/><rect x="10" y="4" width="5" height="11" rx="1.5"/><rect x="17" y="4" width="4" height="7" rx="1.5"/>'),
    tag: S('<path d="M3 12V4h8l10 10-8 8z"/><circle cx="7.5" cy="8.5" r="1.3"/>'),
    palette: S('<path d="M12 3a9 9 0 1 0 0 18c1.2 0 2-.8 2-2 0-.6-.3-1-.6-1.4-.3-.4-.6-.8-.6-1.4 0-1.1.9-2 2-2h2.4A3.8 3.8 0 0 0 21 10.4C21 6.3 17 3 12 3z"/><circle cx="7.5" cy="11" r="1"/><circle cx="10" cy="7" r="1"/><circle cx="14.5" cy="7" r="1"/>'),
    activity: S('<path d="M3 12h4l3-8 4 16 3-8h4"/>'),
    archive: S('<rect x="3" y="4" width="18" height="5" rx="1"/><path d="M5 9v10a1 1 0 0 0 1 1h12a1 1 0 0 0 1-1V9M10 13h4"/>'),
    sliders: S('<path d="M4 6h10M18 6h2M4 12h4M12 12h8M4 18h12"/><circle cx="16" cy="6" r="2"/><circle cx="10" cy="12" r="2"/><circle cx="18" cy="18" r="2"/>'),
    timer: S('<circle cx="12" cy="13" r="8"/><path d="M12 9v4l2.5 2.5M9 2h6"/>'),
    data: S('<ellipse cx="12" cy="5" rx="8" ry="3"/><path d="M4 5v14c0 1.7 3.6 3 8 3s8-1.3 8-3V5M4 12c0 1.7 3.6 3 8 3s8-1.3 8-3"/>'),
    lists: S('<path d="M8 6h13M8 12h13M8 18h13"/><circle cx="4" cy="6" r="1"/><circle cx="4" cy="12" r="1"/><circle cx="4" cy="18" r="1"/>'),
    image: S('<rect x="3" y="4" width="18" height="16" rx="2"/><circle cx="9" cy="10" r="2"/><path d="m21 16-5-5-9 9"/>'),
    stand: S('<circle cx="12" cy="10" r="6"/><path d="M12 7v3l2 1.5M8 21h8M12 16v5"/>'),
    cloud: S('<path d="M7 18h10a4 4 0 0 0 .5-8A6 6 0 0 0 6 9.5 4.3 4.3 0 0 0 7 18z"/>'),
    tile: S('<rect x="4" y="4" width="7" height="7"/><rect x="13" y="4" width="7" height="7"/><rect x="4" y="13" width="7" height="7"/><rect x="13" y="13" width="7" height="7"/>'),
    plus: S('<path d="M12 5v14M5 12h14"/>')
  };
  /* the icon a page's button shows (its own svg / image), else one of ours */
  function iconOf(b, fallback) {
    var s = b && b.querySelector('svg, img');
    if (s) { var c = s.cloneNode(true); ['class', 'width', 'height', 'style', 'id'].forEach(function (a) { c.removeAttribute(a); }); return c.outerHTML; }
    return fallback || IC.dot;
  }
  function shadowOf(sel) { var h = document.querySelector(sel); return h && h.shadowRoot || null; }
  /* a style inside a page's shadow root (the page's own key capsule goes while the Dock holds its keys) */
  function shadowStyle(sr, css) { if (!duo() || sr.getElementById('mn-duo-pages-shadow')) return; var st = document.createElement('style'); st.id = 'mn-duo-pages-shadow'; st.textContent = css; sr.appendChild(st); }
  function click(root, sel) { var b = root && root.querySelector(sel); if (b) { b.click(); return true; } return false; }
  function call(n, m) { var o = api(n); if (o && typeof o[m] === 'function') { try { o[m](); return true; } catch (e) {} } return false; }
  function isOpenApi(n) { var o = api(n); try { return !!(o && o.isOpen && o.isOpen()); } catch (e) { return false; } }

  /* ---------- the pages: what each one is, how it closes, which of its buttons go into the Dock ---------- */
  var SETTAB = { 'labels & filters': IC.tag, appearance: IC.palette, activity: IC.activity, archive: IC.archive, general: IC.sliders, countdown: IC.timer, data: IC.data };
  var PAGES = [
    { id: 'v2r', label: '动态卡片', root: '.mn-v2r', own: ['.mn-v2r-x'], close: function (r) { return click(r, '.mn-v2r-x'); } },
    { id: 'search', label: '搜索', root: '.mo-root.on', close: function () { return call('MinestOmni', 'close') || call('MinestOmni', 'toggle') || (esc(), true); } },
    { id: 'type3d', label: '立体打字', root: '.mn-type3d', own: ['.mn-type3d-x'], close: function (r) { return call('MinestType3D', 'close') || click(r, '.mn-type3d-x'); } },
    { id: 'hermes', label: '打字机', root: '.mn-hermes', close: function () { return call('MinestHermes', 'close'); } },
    /* Liquid Routine draws its own capsule of keys (nav.lr-dock, in its shadow root): they move into the Dock, the capsule goes;
       "返回 Minest" is ✕ */
    { id: 'routine', label: '日程', root: '.mn-routine',
      close: function () { return call('MinestRoutine', 'close'); },
      keys: function () {
        var sr = shadowOf('.mn-routine-host'); if (!sr) return [];
        /* the river kept right:54px for the capsule (.app.immersive) even with the capsule gone: an empty strip down the
           right edge. The half-open book posture keeps its own split (duo-book).
           And the day is fitted to the river's height (100dvh), so the last hour lay behind the Dock along the bottom:
           the river now ends --mn-dock-clear above the edge (tools/polish measures it; 0 when the Dock stands at the
           side), the same way the routine makes room for its own live editor; book, tent and the editors keep theirs */
        var FIT = '.app.immersive:not(.duo-book):not(.duo-tent):not(.has-live-editor):not(.has-studio)';
        shadowStyle(sr, 'nav.lr-dock{display:none!important}.app.immersive:not(.duo-book) .river-panel{right:0!important}' +
          FIT + ' .river-panel{bottom:var(--mn-dock-clear,0px)!important}' + FIT + ' .chamber-scroll{height:calc(100dvh - var(--mn-dock-clear,0px))!important}');
        return [].filter.call(sr.querySelectorAll('nav.lr-dock button'), function (b) { return name(b) !== '返回 Minest'; })
          .map(function (b) { return { el: b, label: name(b).replace(/（.*）$/, ''), icon: iconOf(b) }; });
      } },
    { id: 'settings', label: '设置', root: '.board-settings-modal', top: '.board-settings-overlay',
      own: ['.board-settings-modal > :first-child button:not(.mn-set-cloud)'],
      gone: ['.board-settings-modal > :nth-child(2)', '.board-settings-modal .duo-set-tools', '.board-settings-modal .mn-set-cloud'],
      close: function (r) { var c = [].find.call(r.querySelectorAll('button'), function (b) { return b.textContent.trim() === 'Cancel'; }); if (c) { c.click(); return true; } return click(r, ':scope > :first-child button:not(.mn-set-cloud)'); },
      keys: function (r) {
        var out = [];
        [].forEach.call(r.querySelectorAll(':scope > :nth-child(2) button'), function (b) {
          var t = b.textContent.trim(), k = t.replace(/\s*\(.*\)$/, '').toLowerCase();
          out.push({ el: b, label: t, icon: SETTAB[k] || IC.dot, on: !/opacity-/.test(b.className) });
        });
        [].forEach.call(document.querySelectorAll('.duo-set-tools button'), function (b) {
          var t = b.textContent.replace(/^[^A-Za-z0-9一-鿿]+/, '').trim();
          out.push({ el: b, label: t, icon: /list/i.test(t) ? IC.lists : /wall/i.test(t) ? IC.image : /stand/i.test(t) ? IC.stand : IC.dot });
        });
        var cl = r.querySelector('.mn-set-cloud'); if (cl) out.push({ el: cl, label: '云同步', icon: iconOf(cl, IC.cloud) });
        return out;
      } },
    { id: 'knowledge', label: '知识', root: '.kh', own: ['.kh-x'],   // its six modes are the page itself: nothing doubled in the Dock
      close: function (r) { return call('MinestKnowledgeHub', 'close') || click(r, '.kh-x'); } },
    { id: 'arcade', label: '学习街机', root: '.arcade', own: ['.ar-top .ar-btn', '.ar-top .ar-chips'],
      close: function (r) { return click(r, '.ar-x'); },
      keys: function (r) { return [].map.call(r.querySelectorAll('.ar-top .ar-btn:not(.ar-x)'), function (b) { return { el: b, label: name(b), icon: iconOf(b) }; }); } },
    { id: 'pet', label: '宠物', root: '#minest-pet-raising-overlay', own: ['.minest-pet-x'],
      close: function (r) { return call('MinestPetRaising', 'close') || click(r, '.minest-pet-x'); } },
    { id: 'rings', label: '成就', root: '.minest-activity-modal-backdrop', own: ['.minest-activity-modal-close'],
      close: function (r) { return click(r, '.minest-activity-modal-close'); } },
    /* My World's sheets (Settings, a new world, an island's setup…): one head for all of them, ‹ title ×. The Dock's ✕ and ‹ are
       those two, so the sheet's own pair steps aside (2026-11-26, duo-polish: Settings showed × twice) */
    { id: 'sheet', label: '设置', root: '.mn-nw', own: ['.mn-nw .mn-nw-head > .mn-nw-b[aria-label="Close"]', '.mn-nw .mn-nw-head > .mn-nw-b[aria-label="Back"]'],
      close: function (r) { return click(r, '.mn-nw-head > .mn-nw-b[aria-label="Close"]') || call('MinestSettings', 'close'); },
      back: function (r) { return click(r, '.mn-nw-head > .mn-nw-b[aria-label="Back"]'); } },
    { id: 'world', label: 'My World', root: '.uv', own: ['.uv-head .uv-b', '.uv-add'],
      close: function (r) { return click(r, '.uv-head .uv-b[data-x]') || call('MinestUniverse', 'close'); },
      back: function (r) { return click(r, '.uv-head .uv-b[data-back]'); },
      keys: function (r) {
        var out = [];
        [].forEach.call(r.querySelectorAll('.uv-head .uv-b'), function (b) {
          if (b.hasAttribute('data-x') || b.hasAttribute('data-back') || !laid(b)) return;
          var t = (b.title || name(b)).split(' — ')[0];
          out.push({ el: b, label: t, icon: b.hasAttribute('data-tilemode') ? IC.tile : iconOf(b), on: /(^|\s)on(\s|$)/.test(b.className) });
        });
        var add = r.querySelector('.uv-add'); if (add && laid(add)) out.push({ el: add, label: '添加', icon: iconOf(add, IC.plus) });
        return out;
      } }
  ];
  /* the room is home; it sits over the board and the pages under it */
  function roomOpen() { try { return !!(window.MinestSpatialHome && MinestSpatialHome.isOpen && MinestSpatialHome.isOpen()); } catch (e) { return false; } }
  function roomFeature() { try { var st = MinestSpatialHome.api && MinestSpatialHome.api().state(); return !!(st && st.inFeature); } catch (e) { return false; } }
  function zOf(el) { var z = 0; for (var e = el; e && e !== document.body; e = e.parentElement) { var v = parseInt(getComputedStyle(e).zIndex, 10); if (!isNaN(v)) z = Math.max(z, v); } return z; }
  function glanceTop() { var g = document.querySelector('.duo-gl'); if (!g || g.hidden || !laid(g)) return false; var t = document.elementFromPoint(innerWidth / 2, innerHeight / 2); return !!(t && g.contains(t)); }
  /* the page on screen: the open page with the highest layer (the room counts as a layer too) */
  function page() {
    var best = null, bz = -1;
    PAGES.forEach(function (p) {
      var r = document.querySelector(p.root); if (!r) return;
      var box = p.top ? (r.closest(p.top) || r) : r;
      if (!(p.id === 'knowledge' || p.id === 'settings' ? laid(r) : big(box))) return;
      var z = zOf(box); if (z >= bz) { bz = z; best = { def: p, el: r }; }
    });
    if (best && roomOpen() && zOf(document.getElementById('mn-sh') || document.body) > bz) return null;   // the room is over it
    return best;
  }

  function boxOf(p) { return p.def.top ? (p.el.closest(p.def.top) || p.el) : p.el; }

  /* ---------- the page's keys in the Dock ---------- */
  var group = null, mine = '', prev = null;
  function key(it) {
    var b = document.createElement('button'); b.type = 'button'; b.className = 'mn-bapp mn-page-key duo-pg-key' + (it.on ? ' on' : '');
    b.title = it.label; b.setAttribute('aria-label', it.label); b.setAttribute('data-spatial-home-dock', ''); b.innerHTML = it.icon;
    b.addEventListener('click', function (e) { e.stopPropagation(); e.preventDefault(); try { if (window.MinestNative && MinestNative.haptic) MinestNative.haptic('light'); } catch (er) {} if (it.el && it.el.isConnected) it.el.click(); setTimeout(sync, 160); }, true);
    return b;
  }
  function handOver(p) {
    var sb = SB(); if (!sb) return;
    var items = p && p.def.keys ? p.def.keys(p.el).filter(function (x) { return x && x.el; }) : [];
    var sig = p ? p.def.id + '|' + items.map(function (x) { return x.label + (x.on ? '*' : '') + x.icon.length; }).join(',') : '';
    if (p && !items.length) sig = p.def.id + '|-';   // a page with nothing to hand over: the board's apps still give way
    if (sig === mine && (!p || (group && group.isConnected))) return;
    var cur = sb.pageEl ? sb.pageEl() : null;
    if (!p) { mine = ''; try { document.dispatchEvent(new CustomEvent('minest:duo-keys', { detail: { page: '' } })); } catch (e) {} if (group && cur === group) sb.page(prev && prev !== group ? prev : null); group = null; prev = null; return; }
    if (cur && cur !== group) prev = cur;   // the 3D Cover's keys come back when the page closes
    var g = document.createElement('div'); g.className = 'mn-page duo-pg'; g.dataset.page = p.def.id; g._dock = 1;
    items.forEach(function (x) { g.appendChild(key(x)); });
    group = g; mine = sig; sb.page(g);
    try { document.dispatchEvent(new CustomEvent('minest:duo-keys', { detail: { group: g, page: p.def.id } })); } catch (e) {}   // duo-motion.js: the keys come in
  }

  /* ---------- ✕ and ‹ ---------- */
  function snap() { return document.body.childElementCount + '|' + R.className + '|' + document.querySelectorAll('[role=dialog],[class*=modal],[class*=overlay],[class*=popover],[class*=sheet]').length + '|' + (page() ? page().def.id : '') + '|' + roomOpen(); }
  function goHome() {
    var sp = document.getElementById('mn-clun-splash');
    if (sp) { try { sp.dispatchEvent(new Event('minest:open-web')); } catch (e) {} setTimeout(function () { try { MinestSpatialHome.open(); } catch (e) {} }, 1200); return; }
    try { MinestSpatialHome.open(); } catch (e) { var t = document.getElementById('mn-spatial-home-trigger'); if (t) t.click(); }
  }
  function close(b, ctx) {
    if (!duo()) return false;
    var sb = SB(), p = page();
    if (p) {
      var s0 = snap(), box = boxOf(p), M = window.MinestDuoMotion;
      var go = function () { if (!p.def.close(p.el)) esc(); setTimeout(function () { if (snap() === s0 && sb) sb.say(b, '没有可关闭的'); sync(); }, 320); };
      if (M && M.exit) M.exit(p.def.id, box, b, go); else go();   // it shrinks into ✕, then closes
      return true;
    }
    if (document.getElementById('mn-clun-splash')) { goHome(); return true; }   // the opening: on into the room (home)
    if (roomOpen()) {
      if (roomFeature()) { esc(); return true; }
      if (sb) sb.say(b, '已经在主页'); return true;
    }
    /* the board: a small panel on it closes first (a list menu, a card…); nothing to close — home */
    var s1 = snap(), ex = document.querySelector('.mn-bdock .mn-sys-exit');
    if (ex) ex.click(); else esc();
    setTimeout(function () { if (snap() === s1) goHome(); }, 280);
    return true;
  }
  function back(b) {
    if (!duo()) return false;
    var p = page(); if (!p) return false;   // the board / the room: the system back as it is
    if (p.def.back && p.def.back(p.el)) return true;
    return close(b);
  }

  /* ---------- the room: a way to the board, now that ✕ stays home ---------- */
  var toBoard = null;
  function roomKey() {
    var d = document.querySelector('.mn-bdock'); if (!d || !duo()) return;
    if (!toBoard) {
      toBoard = document.createElement('button'); toBoard.type = 'button'; toBoard.className = 'mn-bapp mn-ctx-key mn-ctx-board'; toBoard.dataset.ctx = 'room';
      toBoard.setAttribute('aria-label', '看板 · 进入 Minest'); toBoard.title = '看板 · 进入 Minest'; toBoard.setAttribute('data-spatial-home-dock', ''); toBoard.innerHTML = IC.board;
      toBoard.addEventListener('click', function (e) { e.stopPropagation(); e.preventDefault(); var x = document.getElementById('sh-exitBtn'); if (x) x.click(); else try { MinestSpatialHome.close(); } catch (er) {} }, true);
    }
    var first = d.querySelector('.mn-ctx-key[data-ctx="room"]');
    if (first && toBoard.parentNode !== d) d.insertBefore(toBoard, first);
  }

  /* ---------- keeping it in step ---------- */
  var cur = '';
  function sync() {
    if (!duo()) return;
    R.classList.toggle('duo-gl-top', glanceTop());
    var p = page(), id = p ? p.def.id : '';
    if (id !== cur) { if (cur) R.classList.remove('duo-pg-' + cur); if (id) R.classList.add('duo-pg-' + id); cur = id; }
    R.classList.toggle('duo-pg-on', !!p);
    handOver(p); roomKey();
  }
  /* the page's own buttons step aside while the Dock holds them (built from the list above) */
  var own = [];
  PAGES.forEach(function (p) { (p.own || []).forEach(function (s) { own.push('html.duo.mn-sysbar:not(.duo-gl-top) body ' + s); }); });
  var gone = [];
  PAGES.forEach(function (p) { (p.gone || []).forEach(function (s) { gone.push('html.duo.mn-sysbar:not(.duo-gl-top) body ' + s); }); });
  var css = document.createElement('style'); css.id = 'mn-duo-pages-own';
  /* out of the flow too (a title beside them gets the room back), but still laid out, so the Dock can read and press them */
  css.textContent = own.join(',\n') + ' { visibility: hidden !important; pointer-events: none !important; position: absolute !important; }\n' + gone.join(',\n') + ' { display: none !important; }';
  (document.head || R).appendChild(css);

  function start() {
    var sb = SB(); if (sb) { sb.hooks = sb.hooks || {}; sb.hooks.close = close; sb.hooks.back = back; }
    sync();
  }
  setInterval(sync, 500);
  document.addEventListener('click', function () { setTimeout(sync, 80); setTimeout(sync, 420); }, true);
  if (document.readyState === 'loading') document.addEventListener('DOMContentLoaded', start); else start();
  window.addEventListener('load', start);
  window.MinestDuoPages = { current: function () { var p = page(); return p ? { id: p.def.id, el: p.el, box: boxOf(p) } : null; }, page: function () { var p = page(); return p ? p.def.id : (roomOpen() ? 'room' : 'board'); }, close: function () { return close(document.querySelector('.mn-bdock .mn-sk-close') || document.body); }, sync: sync };
})();

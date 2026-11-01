/* minest-oia-link-63 */
/* Minest · 63 · 圣托里尼 3D ↔ My World 的智能建造层级（World → Building → Dollhouse → Room → Display → Item）
   What was there: in the voxel Oia (MinestOia, tools/voxel-oia) the 🚪 button at a building's wall went straight into
   that building's first room as a 🚶 walk (H.enter), skipping the building's dollhouse and its Smart Room tools.
   This layer only adapts that one door (no engine, no My World code changes):
   · 🚪 now asks where to go: 🏠 剖面 Dollhouse — My World's own building view of that Oia building (its rooms on their floors,
     Smart Room / Suggest / Refine / Confirm, ＋ Add a room, move, resize, remove), or 🚶 走进去 — the walk as before.
   · From the dollhouse everything is My World's: double-tap a room → the room (Smart Display, display tools), double-tap a
     display → its things (Smart Fill, cards from the board), a thing → its card. 🚶 Walk in shows the room in 3D.
   · A 🇬🇷 pill brings you back onto the doorstep in Oia; going ‹ out of the building does the same.
   · The door shows what the building holds (rooms · displays · things), read from the island record, so you see it grow.
   Nothing new is stored: rooms, displays and things are the island's own (p.rooms of the piece linked by p.vox), saved and
   synced by My World as always. */
(function () {
  'use strict';
  if (window.MinestOiaLink) return;
  var MD = function () { return window.MinestDisplay || null; };
  var WF = function () { return window.MinestWorldFold || null; };
  var LINK = null, H = null, origEnter = null, pill = null, chooser = null;

  var css = document.createElement('style');
  css.id = 'mn-oia-link-style';
  css.textContent = [
    '#oia-root .oial{position:absolute;z-index:61;left:50%;top:calc(116px + env(safe-area-inset-top));transform:translateX(-50%);width:min(360px,92vw);background:rgba(18,24,36,.94);border:3px solid #111;box-shadow:inset 2px 2px 0 rgba(255,255,255,.18);color:#fff;padding:12px;font:600 13px/1.4 system-ui,sans-serif;pointer-events:auto}',
    '#oia-root .oial[hidden]{display:none}',
    '#oia-root .oial b.t{display:block;font:900 16px/1.2 ui-monospace,monospace;margin-bottom:4px}',
    '#oia-root .oial .n{opacity:.85;margin-bottom:10px}',
    '#oia-root .oial button{display:block;width:100%;margin:6px 0 0;padding:10px 12px;text-align:left;font:800 14px/1.25 system-ui,sans-serif;color:#fff;background:#2b3a55;border:3px solid;border-color:#5b6f96 #18233a #18233a #5b6f96;cursor:pointer}',
    '#oia-root .oial button small{display:block;font:600 11.5px/1.3 system-ui;opacity:.8}',
    '#oia-root .oial button.go{background:#3f8f3f;border-color:#9fe39f #2a5e2a #2a5e2a #9fe39f}',
    '#oia-root .oial button.x{display:inline-block;width:auto;padding:6px 10px;background:#444}',
    '.mn-oial-pill{position:fixed;z-index:2147483300;left:50%;bottom:calc(14px + env(safe-area-inset-bottom));transform:translateX(-50%);display:flex;gap:6px;align-items:center;background:rgba(18,24,36,.92);color:#fff;border:2px solid #2f6fd0;border-radius:999px;padding:6px 8px 6px 14px;font:700 13px system-ui,sans-serif;box-shadow:0 6px 20px #0007}',
    '.mn-oial-pill[hidden]{display:none}',
    '.mn-oial-pill span{max-width:46vw;overflow:hidden;text-overflow:ellipsis;white-space:nowrap}',
    '.mn-oial-pill button{border:0;border-radius:999px;padding:7px 12px;font:800 13px system-ui;color:#fff;background:#2f6fd0;cursor:pointer}',
    '.mn-oial-pill button.w{background:#3f8f3f}',
    'html.duo-halfopen .mn-oial-pill{bottom:calc(50vh + 10px)}',
  ].join('\n');
  document.head.appendChild(css);

  /* ---------------------------------------------------------------- helpers */
  function toast(t) { try { if (window.toast) return window.toast(t); } catch (e) {} }
  function lvl() { try { return (WF() && WF().level()) || 0; } catch (e) { return 0; } }
  function wfPress(attr, val) {
    var wf = WF(); if (!document.querySelector('.wf')) { try { wf && wf.open && wf.open(true); } catch (e) {} }
    var host = document.querySelector('.wf'); if (!host) return false;
    var b = document.createElement('button'); b.type = 'button'; b.hidden = true; b.setAttribute(attr, val == null ? '' : val);
    host.appendChild(b); try { b.click(); } finally { b.remove(); }
    return true;
  }
  function island() {   // the island record (also when a room is open: its rooms live in the island's pieces)
    var md = MD(), d = md && md.state && md.state(); if (!d) return null;
    if (d.scene === 'room' || !(d.pc || []).some(function (p) { return p.vox; })) return LINK && LINK.isl ? LINK.isl : d;
    return d;
  }
  function pieceOf(bid, d) { d = d || island(); return d ? (d.pc || []).filter(function (q) { return q.vox === bid; })[0] || null : null; }
  function counts(p) {   // what a building holds: rooms, displays (pieces in its rooms that hold things or can), things
    var r = 0, disp = 0, it = 0;
    ((p && p.rooms) || []).forEach(function (rm) { r++; ((rm.d && rm.d.pc) || []).forEach(function (q) { var n = (q.it || []).length; if (n) { disp++; it += n; } }); });
    return { rooms: r, displays: disp, items: it };
  }
  var KIND = { house: '白屋', cave: '洞穴屋', chapel: '蓝顶小教堂', church: '教堂', castle: '城堡遗址', mill: '风车', taverna: '小酒馆' };
  function bName(bid, p) {
    if (p && p.label) return p.label;
    var w = window.MinestOia && MinestOia.world && MinestOia.world(), b = w && (w.buildings || []).filter(function (x) { return x.id === bid; })[0];
    return (b && (b.name || KIND[b.kind])) || '建筑';
  }
  function closeWalk() {
    var x = document.querySelector('.mn-walk [data-wkx]'); if (!x) return;
    var r = x.getBoundingClientRect(), o = { bubbles: true, cancelable: true, composed: true, pointerId: 63, isPrimary: true, clientX: r.left + 2, clientY: r.top + 2, button: 0 };
    try { x.dispatchEvent(new PointerEvent('pointerdown', o)); } catch (e) {}
  }

  /* ---------------------------------------------------------------- 🚪 the door: where to go */
  function ensureChooser() {
    var root = document.getElementById('oia-root'); if (!root) return null;
    if (chooser && chooser.isConnected) return chooser;
    chooser = document.createElement('div'); chooser.className = 'oial'; chooser.hidden = true; root.appendChild(chooser);
    chooser.addEventListener('click', function (e) {
      e.stopPropagation(); var g = e.target.closest('button'); if (!g) return;
      var a = g.getAttribute('data-oial'), bid = chooser.getAttribute('data-bid'), at = chooser.__at;
      chooser.hidden = true;
      if (a === 'doll') openDollhouse(bid, at);
      else if (a === 'walk' && origEnter) origEnter(bid, at);
    });
    return chooser;
  }
  function choose(bid, at) {
    var c = ensureChooser(); if (!c) return origEnter && origEnter(bid, at);
    var p = pieceOf(bid), n = counts(p), name = bName(bid, p);
    c.setAttribute('data-bid', bid); c.__at = at;
    c.innerHTML = '<b class="t">🏠 ' + esc(name) + '</b><div class="n">' + (n.rooms ? n.rooms + ' 个房间 · ' + n.displays + ' 个展位 · ' + n.items + ' 件展品' : '还没有房间 · 第一次进去会按它的用途推荐房间') + '</div>' +
      '<button class="go" data-oial="doll">🏠 剖面 Dollhouse<small>看楼层和房间 · Smart Room 推荐、确认、Refine · 双击房间进去布置展架和展品</small></button>' +
      '<button data-oial="walk">🚶 走进去<small>直接走进第一个房间（3D）· 🌳 Outside 回到门口</small></button>' +
      '<button class="x" data-oial="x">✕</button>';
    c.hidden = false;
  }
  function esc(x) { return String(x).replace(/[&<>"]/g, function (ch) { return { '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;' }[ch]; }); }

  /* ---------------------------------------------------------------- 🏠 into My World's dollhouse of that building */
  function openDollhouse(bid, at) {
    var p = pieceOf(bid);
    if (!p) { if (origEnter) origEnter(bid, at); return; }   // no piece holds it yet: the original door makes one (and its rooms)
    LINK = { bid: bid, at: at, pid: p.id, name: bName(bid, p), t: Date.now(), reached: false };
    try { MinestOia.close(); } catch (e) {}
    if (lvl() >= 3) { try { WF().go(1); } catch (e) {} }
    try { if (WF() && !WF().on()) WF().open(true); } catch (e) {}
    setTimeout(function () {
      wfPress('data-wfbld', p.id);
      setTimeout(function () {
        if (lvl() >= 3) { LINK.reached = true; if (window.MinestSfx) MinestSfx.play('door'); toast('🏠 ' + LINK.name + ' · 双击一个房间进去 · ✨ Smart Room 在控制台'); }
        else { toast('进不去这座建筑'); back(); }
        drawPill();
      }, 300);
    }, 120);
  }
  function back() {   // onto the doorstep in Oia
    var L = LINK; LINK = null; drawPill(); if (!L) return;
    closeWalk();
    setTimeout(function () {
      try { WF().go(1); } catch (e) {}
      try { MinestOia.open({ at: L.at }); } catch (e) {}
    }, document.querySelector('.mn-walk') ? 500 : 60);
  }
  function drawPill() {
    if (!pill) {
      pill = document.createElement('div'); pill.className = 'mn-oial-pill'; pill.hidden = true; pill.setAttribute('popover', 'manual');
      pill.innerHTML = '<span></span><button class="w" data-p="walk">🚶 3D</button><button data-p="back">🇬🇷 回到门口</button>';
      pill.addEventListener('click', function (e) {
        var g = e.target.closest('[data-p]'); if (!g) return; e.stopPropagation();
        if (g.getAttribute('data-p') === 'back') return back();
        var host = document.querySelector('.mn-dsp'); if (!host) return;
        var b = document.createElement('button'); b.type = 'button'; b.hidden = true; b.setAttribute('data-fpv', ''); host.appendChild(b); b.click(); b.remove();   // My World's own 🚶 Walk in, for the level you are at
      });
      document.body.appendChild(pill);
    }
    var on = !!LINK && !(window.MinestOia && MinestOia.isOpen()) && !document.querySelector('.mn-walk');
    pill.hidden = !on;
    try { if (on) { if (!pill.matches(':popover-open')) pill.showPopover(); } else if (pill.matches(':popover-open')) pill.hidePopover(); } catch (e) {}
    if (on) {
      var c = []; try { c = WF().crumbs() || []; } catch (e) {}
      pill.querySelector('span').textContent = '🇬🇷 ' + (c.slice(2).join(' › ') || LINK.name);
      pill.querySelector('[data-p="walk"]').hidden = lvl() < 4;
    }
  }
  setInterval(function () {
    if (!LINK) { if (pill && !pill.hidden) drawPill(); return; }
    var md = MD();
    if (!md || !md.isOpen || !md.isOpen()) { LINK = null; return drawPill(); }   // My World closed: the visit is over
    if (window.MinestOia && MinestOia.isOpen()) { LINK = null; return drawPill(); }   // back in Oia some other way (🌳 Outside)
    var L = lvl();
    if (L >= 3) LINK.reached = true;
    else if (LINK.reached && !document.querySelector('.mn-walk') && Date.now() - LINK.t > 1500) return back();   // ‹ out of the building: onto its doorstep
    drawPill();
  }, 500);

  /* ---------------------------------------------------------------- the door itself: wrap the hooks My World binds */
  function wrap() {
    if (!window.MinestOia || MinestOia.__linked) return !!(window.MinestOia);
    var bind0 = MinestOia.bind;
    MinestOia.bind = function (h) {
      H = h; origEnter = h && h.enter;
      if (h && h.enter) { h = Object.assign({}, h, { enter: function (bid, at) { choose(bid, at); } }); }
      return bind0.call(MinestOia, h);
    };
    MinestOia.__linked = true;
    return true;
  }
  if (!wrap()) { var tries = 0, t = setInterval(function () { if (wrap() || ++tries > 60) clearInterval(t); }, 500); }

  window.MinestOiaLink = {
    version: '63', choose: choose, dollhouse: openDollhouse, back: back,
    link: function () { return LINK ? { bid: LINK.bid, pid: LINK.pid, name: LINK.name } : null; },
    counts: function (bid) { return counts(pieceOf(bid)); },
  };
})();

  /* ================================================================ 79 · one flow for both worlds: the level tools are My World's own
     The voxel world follows the 2D world's building flow (Island → Building → Dollhouse → Room → Display Fixture → Item;
     at every level New · Gallery · Group · Smart, Smart = Base then Detail, Lock, ✓ Confirm, Edit). Those tools are not
     rebuilt here: My World's own console (aside.wf) sits under the voxel world and drives it — whatever it changes, the
     blocks follow. The voxel console (77) therefore shrinks to one strip along the bottom of the 3D view with what only
     the voxel world has (view modes, ↶ ↷, 建造, 地形, 展馆, 摆放, 陈列, 2D, ⚙); a tool's controls float above the strip
     while that tool is picked. 房间 and Smart leave the strip: the level tools below do that work now. */
  (function levels79() {
    var con = ov.querySelector('.vxc'); if (!con || con.querySelector('.lv79-strip')) return;
    var st = document.createElement('style'); st.id = 'vx79-css';
    st.textContent =
      '#vx62.lv79 .vxc{background:none!important;border:0!important;box-shadow:none!important;padding:0 8px 8px!important;pointer-events:none;display:block!important;height:auto!important;min-height:0!important;-webkit-backdrop-filter:none!important;backdrop-filter:none!important}' +
      '#vx62.lv79 .vxc .wf-h{display:none!important}' +
      '#vx62.lv79 .vxc .wf-main{display:flex!important;flex-direction:column!important;gap:6px!important;height:auto!important;min-height:0!important;padding:0!important;background:none!important;border:0!important;grid-template-columns:none!important}' +
      '#vx62.lv79 .vxc .wf-center{order:1;pointer-events:auto;max-height:36vh;overflow:auto;border-radius:14px;padding:8px 10px!important;background:rgba(22,24,30,.92)!important;border:1px solid rgba(255,255,255,.14)!important;box-shadow:0 10px 30px rgba(0,0,0,.4);color:#fff}' +
      '#vx62.lv79 .vxc .wf-center[hidden]{display:none!important}' +
      '#vx62.lv79 .vxc .lv79-strip{order:2;pointer-events:auto;display:flex;align-items:stretch;gap:6px;overflow-x:auto;overflow-y:hidden;-webkit-overflow-scrolling:touch;scrollbar-width:none;border-radius:16px;padding:6px;background:rgba(22,24,30,.78);border:1px solid rgba(255,255,255,.14);-webkit-backdrop-filter:blur(14px) saturate(1.3);backdrop-filter:blur(14px) saturate(1.3);box-shadow:0 8px 24px rgba(0,0,0,.35)}' +
      '#vx62.lv79 .vxc .lv79-strip::-webkit-scrollbar{display:none}' +
      '#vx62.lv79 .vxc .lv79-strip nav{display:flex!important;flex-direction:row!important;gap:6px!important;width:auto!important;height:auto!important;overflow:visible!important;padding:0!important;margin:0!important;background:none!important;border:0!important;flex:0 0 auto!important;grid-template-columns:none!important}' +
      '#vx62.lv79 .vxc .lv79-strip .lv79-sep{flex:0 0 1px;background:rgba(255,255,255,.18);margin:4px 2px}' +
      '#vx62.lv79 .vxc .lv79-strip button{flex:0 0 auto!important;width:54px!important;min-width:54px!important;height:50px!important;min-height:0!important;margin:0!important;padding:3px 2px!important;border-radius:11px!important;display:flex!important;flex-direction:column!important;align-items:center!important;justify-content:center!important;gap:1px!important;font:700 10px/1.1 system-ui!important;letter-spacing:0!important}' +
      '#vx62.lv79 .vxc .lv79-strip button i{font-size:19px!important;line-height:1.05!important;font-style:normal}' +
      '#vx62.lv79 .vxc .lv79-strip button span{white-space:nowrap;overflow:hidden;text-overflow:ellipsis;max-width:100%}' +
      '#vx62.lv79 .vxc .lv79-strip [data-tab="room"],#vx62.lv79 .vxc .lv79-strip [data-tab="smart"]{display:none!important}' +
      '#vx62.lv79 .vxc .vx77-idle{display:none!important}' +
      '#vx62.lv79 .lv79-hint{position:absolute;left:50%;top:10px;transform:translateX(-50%);z-index:6;max-width:86%;padding:6px 12px;border-radius:999px;font:600 12px/1.3 system-ui;color:#fff;background:rgba(22,24,30,.72);border:1px solid rgba(255,255,255,.14);pointer-events:none;white-space:nowrap;overflow:hidden;text-overflow:ellipsis;transition:opacity .4s}' +
      '#vx62.lv79 .lv79-hint[hidden]{display:none}';
    document.head.appendChild(st);
    ov.classList.add('lv79');
    var main = con.querySelector('.wf-main'), acts = con.querySelector('.wf-acts'), center = con.querySelector('.wf-center'), menu = con.querySelector('.wf-menu');
    var strip = document.createElement('div'); strip.className = 'lv79-strip'; strip.setAttribute('aria-label', '体素工具');
    var sep = document.createElement('i'); sep.className = 'lv79-sep';
    // view modes and undo first, then what only the voxel world builds with, then 2D / settings / back
    strip.appendChild(menu); strip.appendChild(sep); strip.appendChild(acts);
    var x = con.querySelector('.wf-h .wf-x[data-a="x"], .wf-h [data-a="x"]');
    if (x) { x.innerHTML = '<i>✕</i><span>回 2D</span>'; x.classList.remove('wf-x'); var nx = document.createElement('nav'); nx.appendChild(x); var sep2 = document.createElement('i'); sep2.className = 'lv79-sep'; strip.appendChild(sep2); strip.appendChild(nx); }
    main.appendChild(strip);
    // where you are, said once at the top of the 3D view (the full crumbs are in the console below)
    var hint = document.createElement('div'); hint.className = 'lv79-hint'; hint.hidden = true; ov.appendChild(hint);
    var LV = [null, '🏝 Island 岛', '🏛 Building', '🏠 Dollhouse', '🚪 Room 房间', '🗄 Display 展架', '📦 Item'];
    var lastLv = -1, hintT = 0;
    function fit79() { ov.style.setProperty('--ch', Math.round(con.getBoundingClientRect().height || 60) + 'px'); }
    function sync79() {
      if (!isOpen()) return;
      // the level tools are My World's console: it is always beside / below the voxel world
      if (!R.con) { try { setCon(true); } catch (e) {} }
      var sheet = center.querySelector('.sheet'), has = R.tab && R.tab !== 'look' && R.tab !== 'room' && R.tab !== 'smart' && sheet && sheet.textContent.trim();
      if (center.hidden === !!has) { center.hidden = !has; fit79(); }
      if (R.tab === 'room' || R.tab === 'smart') { try { setTab('look'); } catch (e) {} }
      var wf = WF(), lv = 0; try { lv = wf && wf.level ? wf.level() : 0; } catch (e) {}
      if (lv !== lastLv) { lastLv = lv; var cr = []; try { cr = wf.crumbs() || []; } catch (e) {}
        hint.textContent = (LV[lv] || '🧊 体素世界') + (cr.length ? ' · ' + cr[cr.length - 1] : '') + '  —  下方控制台：New · Gallery · Group · Smart';
        hint.hidden = false; hint.style.opacity = '1'; clearTimeout(hintT); hintT = setTimeout(function () { hint.style.opacity = '0'; }, 4200); }
    }
    // a double-tap in the 3D view is My World's own double-tap at that spot: one level deeper (onto the island, into the
    // building, into the room, to the display, to the item) — the 2D world decides, the blocks follow
    var dt = null, lastTap = null;
    ov.addEventListener('pointerdown', function (e) { if (!e.target || e.target.tagName !== 'CANVAS' || e.isPrimary === false) { dt = null; return; } dt = { x: e.clientX, y: e.clientY, t: Date.now() }; }, true);
    ov.addEventListener('pointerup', function (e) {
      var d = dt; dt = null; if (!d || !isOpen() || (R.tab && R.tab !== 'look')) { lastTap = null; return; }
      if (Math.abs(e.clientX - d.x) + Math.abs(e.clientY - d.y) > 12 || Date.now() - d.t > 500) { lastTap = null; return; }
      var now = Date.now(), L = lastTap;
      if (!(L && now - L.at <= 450 && Math.abs(e.clientX - L.x) + Math.abs(e.clientY - L.y) <= 34)) { lastTap = { x: e.clientX, y: e.clientY, at: now }; return; }
      lastTap = null; dive(e.clientX, e.clientY);
    }, true);
    function dive(cx, cy) {
      var lv = lvl(), hit = null; try { hit = pickAt(cx, cy); } catch (x) {}
      if (lv === 3) return toast('🏠 Dollhouse · 在下方控制台点一个房间进入');
      if (!hit || !R.vw) return;
      var vw = R.vw, lx = vw.ox + (hit.x + .5) / vw.S, ly = vw.oz + (hit.z + .5) / vw.S, best = null, bd = 1e9;
      try { pieces().forEach(function (q) { var dd = Math.hypot(q.x - lx, q.y - ly); if (dd < 2.6 * (q.s || 1) && dd < bd) { bd = dd; best = q; } }); } catch (x) {}
      if (best) { lx = best.x; ly = best.y; }
      try { tapIsland(lx, ly); } catch (x) {}
      setTimeout(function () { try { tapIsland(lx, ly); } catch (x) {} }, 90);
      setTimeout(function () { var after = lvl(); if (after !== lv) { try { poke(); } catch (x) {} } else if (!best) toast('双击建筑、展架或物件，进入下一层'); }, 700);
    }
    window.__vx79 = { dive: dive };
    setInterval(sync79, 350);
    window.addEventListener('resize', fit79);
    sync79(); fit79();
  })();

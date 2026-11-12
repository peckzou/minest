  /* ================================================================ 80 · the voxel world, as one experience
     A pass over the whole voxel UI: no debug line in the corner; the strip leads with the tools you build with, then the
     ways of looking, undo / redo, 2D and settings, each its own group; My World's console folds to its crumbs row (⌄) so
     the world can fill the screen — folded by default on short screens, the choice remembered; a one-time card says how
     to move, zoom, go deeper and build. (The camera finding each level's content is levels79's fitContent.) */
  (function ux80() {
    var con = ov.querySelector('.vxc'); if (!con || document.getElementById('vx80-css')) return;
    var LS80 = 'minest.vx80.', H = document.documentElement;
    function get80(k) { try { return localStorage.getItem(LS80 + k); } catch (e) { return null; } }
    function set80(k, v) { try { localStorage.setItem(LS80 + k, v); } catch (e) {} }
    var st = document.createElement('style'); st.id = 'vx80-css';
    st.textContent =
      '#vx62 .info{display:none!important}' +
      '#vx62.lv79 .vxc .lv79-strip [data-c="undo"]{margin-left:10px!important}#vx62.lv79 .vxc .lv79-strip [data-a="2d"]{margin-left:10px!important}' +
      '#vx62.lv79 .vxc .lv79-strip .wf-acts button[aria-pressed="true"],#vx62.lv79 .vxc .lv79-strip .wf-acts button.on{box-shadow:0 0 0 2px #f2c13d inset!important}' +
      'html.vx80-on.vx80-min aside.wf .wf-main{display:none!important}' +
      'html.vx80-on.vx80-min aside.wf{top:auto!important;height:auto!important;min-height:0!important}' +
      '.vx80-fold{display:none;flex:0 0 auto;align-self:center;margin:0 6px;height:32px;padding:0 12px;border-radius:999px;border:1px solid rgba(255,255,255,.22);background:rgba(255,255,255,.1);color:#fff;font:700 12px/1 system-ui;cursor:pointer;white-space:nowrap}' +
      'html.vx80-on .vx80-fold{display:inline-flex;align-items:center;gap:4px}' +
      'html body #vx62.vx80-joy .joy{display:block!important}html body #vx62.vx80-joy .pad{display:flex!important}' +
      '#vx62.vx80-joy .joy{bottom:calc(var(--ch,60px) + 18px)!important}#vx62.vx80-joy .pad{bottom:calc(var(--ch,60px) + 18px)!important}' +
      '#vx62 .vx80-coach{position:absolute;inset:0;z-index:9;display:flex;align-items:center;justify-content:center;padding:20px;background:rgba(10,14,24,.5);-webkit-backdrop-filter:blur(3px);backdrop-filter:blur(3px)}' +
      '#vx62 .vx80-coach[hidden]{display:none}' +
      '#vx62 .vx80-card{max-width:360px;width:100%;border-radius:20px;padding:18px 18px 14px;background:rgba(22,24,30,.94);border:1px solid rgba(255,255,255,.16);box-shadow:0 18px 50px rgba(0,0,0,.45);color:#fff;font:500 14px/1.45 system-ui}' +
      '#vx62 .vx80-card h3{margin:0 0 10px;font:800 17px/1.2 system-ui}#vx62 .vx80-card li{display:flex;gap:10px;margin:8px 0;list-style:none}#vx62 .vx80-card ul{margin:0;padding:0}' +
      '#vx62 .vx80-card li i{font-style:normal;font-size:20px;width:28px;text-align:center;flex:0 0 28px}#vx62 .vx80-card small{opacity:.65;display:block;font-size:12px}' +
      '#vx62 .vx80-card button{margin-top:12px;width:100%;height:44px;border:0;border-radius:12px;background:#f2c13d;color:#1a1408;font:800 15px/1 system-ui;cursor:pointer}';
    /* 8. one look: Minecraft blocks, matching My World's console — square, a 2 px black edge, lit top / shaded bottom,
       grass green with a gold ring when picked, gold for what you act on; panels the console's deep grey */
    var MCB = 'background:#4a4a4a!important;border:2px solid #000!important;border-radius:0!important;box-shadow:inset 0 -3px 0 rgba(0,0,0,.33),inset 0 2px 0 rgba(255,255,255,.15)!important;color:#fff!important;text-shadow:1px 1px 0 rgba(0,0,0,.55)!important;font-weight:800!important;',
        MCH = 'background:#5c5c5c!important;',
        MCON = 'background:#3c8527!important;box-shadow:0 0 0 2px #f2c13d,inset 0 -3px 0 rgba(0,0,0,.33),inset 0 2px 0 rgba(255,255,255,.18)!important;',
        MCDN = 'transform:translateY(1px);box-shadow:inset 0 3px 0 rgba(0,0,0,.35)!important;',
        MCG = 'background:#f2c13d!important;color:#1b1b1b!important;text-shadow:none!important;',
        MCP = 'background:#3b3b3b!important;border:2px solid #000!important;border-radius:0!important;box-shadow:inset 0 -4px 0 #2a2a2a,inset 0 2px 0 rgba(255,255,255,.08),0 6px 18px rgba(0,0,0,.35)!important;-webkit-backdrop-filter:none!important;backdrop-filter:none!important;color:#fff!important;',
        MCT = 'background:rgba(0,0,0,.62)!important;border:2px solid #000!important;border-radius:0!important;color:#fff!important;text-shadow:1px 1px 0 rgba(0,0,0,.7)!important;-webkit-backdrop-filter:none!important;backdrop-filter:none!important;';
    st.textContent +=
      '#vx62.lv79 .vxc .lv79-strip,#vx62.lv79 .vxc .wf-center,#vx62.lv79 .lv79-rooms,#vx62 .vx80-card,#vx62 .more{' + MCP + '}' +
      '#vx62.lv79 .vxc .lv79-strip .lv79-sep{background:#000!important;width:2px!important;flex-basis:2px!important}' +
      '#vx62.lv79 .vxc .lv79-strip button,#vx62.lv79 .vxc .wf-center button,#vx62.lv79 .lv79-rooms button,#vx62 .more button,.vx80-fold,#vx62 .pad button{' + MCB + '}' +
      '#vx62.lv79 .vxc .lv79-strip button:hover,#vx62.lv79 .vxc .wf-center button:hover,#vx62.lv79 .lv79-rooms button:hover,.vx80-fold:hover{' + MCH + '}' +
      '#vx62.lv79 .vxc .lv79-strip button.on,#vx62.lv79 .vxc .wf-center button.on,#vx62 .more button.on{' + MCON + '}' +
      '#vx62.lv79 .vxc .lv79-strip button:active,#vx62.lv79 .vxc .wf-center button:active,#vx62.lv79 .lv79-rooms button:active,#vx62 .pad button:active,.vx80-fold:active{' + MCDN + '}' +
      '#vx62.lv79 .lv79-rooms b{color:#f2c13d!important;text-shadow:1px 1px 0 #000!important}#vx62.lv79 .lv79-rooms button small{color:#d7d7d7!important;opacity:1!important}' +
      '#vx62.lv79 .lv79-hint,#vx62 .tst,#vx62 .msg{' + MCT + '}' +
      '#vx62 .vx80-card button{' + MCB + MCG + 'height:46px!important}#vx62 .vx80-card h3{color:#f2c13d;text-shadow:2px 2px 0 #000}' +
      '#vx62 .sl,#vx62 .sl canvas{border-radius:0!important}#vx62 .sl{border:2px solid #000!important}#vx62 .sl.on{box-shadow:0 0 0 2px #f2c13d!important}' +
      '#vx62 .joy{border-radius:0!important;border:2px solid #000!important;background:rgba(59,59,59,.55)!important;box-shadow:inset 0 -4px 0 rgba(0,0,0,.3)!important}' +
      '#vx62 .joy i{border-radius:0!important;' + MCB + '}';
    document.head.appendChild(st);
    // 2. the strip: tools, then looking (view · walk · fly), undo / redo, then 2D · settings · back
    var strip = con.querySelector('.lv79-strip'), acts = con.querySelector('.wf-acts'), menu = con.querySelector('.wf-menu');
    if (strip && acts && menu && acts.parentNode === strip && strip.firstElementChild !== acts) { strip.insertBefore(acts, strip.firstElementChild); var sp = strip.querySelector('.lv79-sep'); if (sp) strip.insertBefore(sp, menu); }
    // 2b. two look-alike buttons: 🗺 peeks at the 2D island and comes back, ✕ leaves the voxel world
    function relabel(sel, txt) { var b = con.querySelector(sel), sp = b && b.querySelector('span'); if (sp && sp.textContent !== txt) sp.textContent = txt; }
    relabel('.lv79-strip [data-a="2d"]', '对照 2D'); relabel('.lv79-strip [data-a="x"]', '退出');
    // 3. the console folds to its crumbs row
    function folded() { var v = get80('min'); return v === null ? innerHeight < 760 : v === '1'; }
    function applyFold() {
      var on = isOpen(); H.classList.toggle('vx80-on', on); H.classList.toggle('vx80-min', on && folded());
      var b = document.querySelector('aside.wf .vx80-fold'); if (b) b.innerHTML = folded() ? '⌃ <span>展开控制台</span>' : '⌄ <span>收起</span>';
    }
    function foldBtn() {
      var hd = document.querySelector('aside.wf .wf-h'); if (!hd || hd.querySelector('.vx80-fold')) return;
      var b = document.createElement('button'); b.type = 'button'; b.className = 'vx80-fold'; b.setAttribute('aria-label', '收起或展开控制台');
      b.addEventListener('click', function (e) { e.preventDefault(); e.stopPropagation(); set80('min', folded() ? '0' : '1'); applyFold(); setTimeout(function () { try { window.dispatchEvent(new Event('resize')); } catch (x) {} }, 30); });
      var x = hd.querySelector('.wf-x'); hd.insertBefore(b, x || null); applyFold();   // the header is redrawn per level: label the new button at once
    }
    // 5. once: how to get around
    var coach = document.createElement('div'); coach.className = 'vx80-coach'; coach.hidden = true;
    coach.innerHTML = '<div class="vx80-card" role="dialog" aria-label="体素世界怎么用"><h3>🧊 体素世界</h3><ul>' +
      '<li><i>🖐</i><span>拖动转视角<small>双指捏合或滚轮缩放</small></span></li>' +
      '<li><i>👆</i><span>双击建筑、房间、展架<small>一层层进去：岛 → 建筑 → 房间 → 展架 → 物件；左上 ‹ 回上一层</small></span></li>' +
      '<li><i>🧱</i><span>底部工具<small>建造 · 摆放 · 陈列 · 地形 · 展馆</small></span></li>' +
      '<li><i>⌄</i><span>收起控制台<small>让世界占满屏幕，需要时再展开</small></span></li>' +
      '</ul><button type="button">开始</button></div>';
    coach.addEventListener('click', function (e) { if (e.target.closest('button') || e.target === coach) { coach.hidden = true; set80('coached', '1'); } });
    ov.appendChild(coach);
    // 7. the sky: a gradient from a deeper blue overhead to a pale horizon, the fog the horizon's colour (was one flat blue)
    function sky80() {
      if (!R.scene || !R.T || R.scene.userData.sky80) return;
      var T = R.T, c = document.createElement('canvas'); c.width = 2; c.height = 256; var x = c.getContext('2d'), g = x.createLinearGradient(0, 0, 0, 256);
      g.addColorStop(0, '#3f8fe0'); g.addColorStop(0.45, '#7fbdf5'); g.addColorStop(0.82, '#c6e4ff'); g.addColorStop(1, '#e6f3ff');
      x.fillStyle = g; x.fillRect(0, 0, 2, 256);
      var tex = new T.CanvasTexture(c); if (T.SRGBColorSpace) tex.colorSpace = T.SRGBColorSpace;
      R.scene.background = tex; if (R.scene.fog) R.scene.fog.color.set('#d6ecff'); R.scene.userData.sky80 = 1;
    }
    var wasOpen = false, TOUCH80 = ('ontouchstart' in window) || (window.matchMedia && matchMedia('(pointer:coarse)').matches);
    function sync80() {
      var on = isOpen();
      // walking on a touch screen: the console's navigation pane holds the controls — folded (or not opened) there is nothing
      // to walk with, so the engine's own joystick and up / down pad come back
      var m = on ? R.mode : '', nav = document.querySelector('.wf-center.world-navigation-open'), navShown = !!(nav && nav.offsetHeight && !H.classList.contains('vx80-min'));
      ov.classList.toggle('vx80-joy', !!(on && TOUCH80 && (m === 'walk' || m === 'fly') && !navShown));
      if (on) { foldBtn(); sky80(); if (!wasOpen && !get80('coached')) coach.hidden = false; }
      if (on !== wasOpen) { wasOpen = on; applyFold(); if (on) setTimeout(function () { try { window.dispatchEvent(new Event('resize')); } catch (x) {} }, 60); }
    }
    // 6. a tool's panel floats over the lower part of the view: the picture lifts by about half of what it covers
    var offCur = 0, offTo = 0, offRaf = 0;
    function applyOff() {
      var c = R.cam, cv = R.renderer && R.renderer.domElement; if (!c || !cv) return;
      var w = cv.clientWidth || 1, h = cv.clientHeight || 1;
      if (Math.abs(offCur) < 0.5) c.clearViewOffset(); else c.setViewOffset(w, h, 0, Math.round(offCur), w, h);
      c.updateProjectionMatrix();
    }
    function liftTo(px) {
      offTo = px; if (offRaf) return;
      (function step() { offCur += (offTo - offCur) * 0.25; if (Math.abs(offTo - offCur) < 0.5) offCur = offTo; applyOff(); offRaf = offCur === offTo ? 0 : requestAnimationFrame(step); })();
    }
    function panelLift() {
      if (!isOpen() || !R.renderer) return 0;
      var center = con.querySelector('.wf-center'), cv = R.renderer.domElement;
      if (!center || center.hidden || !center.offsetHeight || R.mode === 'walk' || R.mode === 'fly') return 0;
      var cr = center.getBoundingClientRect(), vr = cv.getBoundingClientRect(), cover = Math.max(0, Math.min(vr.bottom, cr.bottom) - Math.max(vr.top, cr.top));
      return Math.round(cover * 0.5);
    }
    window.addEventListener('resize', function () { if (offCur) applyOff(); });
    setInterval(function () { var t = panelLift(); if (t !== offTo) liftTo(t); }, 250);
    setInterval(sync80, 400); sync80();
    window.__vx80 = { fold: function (v) { set80('min', v ? '1' : '0'); applyFold(); window.dispatchEvent(new Event('resize')); }, coach: function () { coach.hidden = false; } };
  })();

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
      '#vx62 .vx80-coach{position:absolute;inset:0;z-index:9;display:flex;align-items:center;justify-content:center;padding:20px;background:rgba(10,14,24,.5);-webkit-backdrop-filter:blur(3px);backdrop-filter:blur(3px)}' +
      '#vx62 .vx80-coach[hidden]{display:none}' +
      '#vx62 .vx80-card{max-width:360px;width:100%;border-radius:20px;padding:18px 18px 14px;background:rgba(22,24,30,.94);border:1px solid rgba(255,255,255,.16);box-shadow:0 18px 50px rgba(0,0,0,.45);color:#fff;font:500 14px/1.45 system-ui}' +
      '#vx62 .vx80-card h3{margin:0 0 10px;font:800 17px/1.2 system-ui}#vx62 .vx80-card li{display:flex;gap:10px;margin:8px 0;list-style:none}#vx62 .vx80-card ul{margin:0;padding:0}' +
      '#vx62 .vx80-card li i{font-style:normal;font-size:20px;width:28px;text-align:center;flex:0 0 28px}#vx62 .vx80-card small{opacity:.65;display:block;font-size:12px}' +
      '#vx62 .vx80-card button{margin-top:12px;width:100%;height:44px;border:0;border-radius:12px;background:#f2c13d;color:#1a1408;font:800 15px/1 system-ui;cursor:pointer}';
    document.head.appendChild(st);
    // 2. the strip: tools, then looking (view · walk · fly), undo / redo, then 2D · settings · back
    var strip = con.querySelector('.lv79-strip'), acts = con.querySelector('.wf-acts'), menu = con.querySelector('.wf-menu');
    if (strip && acts && menu && acts.parentNode === strip && strip.firstElementChild !== acts) { strip.insertBefore(acts, strip.firstElementChild); var sp = strip.querySelector('.lv79-sep'); if (sp) strip.insertBefore(sp, menu); }
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
    var wasOpen = false;
    function sync80() {
      var on = isOpen();
      if (on) { foldBtn(); if (!wasOpen && !get80('coached')) coach.hidden = false; }
      if (on !== wasOpen) { wasOpen = on; applyFold(); if (on) setTimeout(function () { try { window.dispatchEvent(new Event('resize')); } catch (x) {} }, 60); }
    }
    setInterval(sync80, 400); sync80();
    window.__vx80 = { fold: function (v) { set80('min', v ? '1' : '0'); applyFold(); window.dispatchEvent(new Event('resize')); }, coach: function () { coach.hidden = false; } };
  })();

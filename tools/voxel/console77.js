  /* ================================================================ 77 · the voxel world's console = My World's 2D console
     The same three columns as the 2D world (aside.wf): a header (‹ up, where you are, the tool, ▾ / ✕), the tools on
     the left, the picked tool's controls in the middle, and the view / ↶ ↷ / 2D / ⚙ on the right. Its look is My
     World's own: the 2D console's style rules, taken as they are under another root class (.vxc), so nothing that looks
     for the 2D console (.wf) ever finds this one. The world stays above it; the joystick and the toasts sit over it. */
  (function console77() {
    if (ov.querySelector('.vxc')) return;
    var TOOLNAME = { look: '浏览', hall: '展馆', build: '建造', put: '摆放', room: '房间', show: '陈列', ter: '地形', smart: 'Smart' };
    function cssFromWf() {   // the 2D console's rules, re-rooted
      var out = [];
      Array.prototype.forEach.call(document.styleSheets, function (sh) {
        var rules; try { rules = sh.cssRules; } catch (e) { return; }
        Array.prototype.forEach.call(rules || [], function (r) {
          var t = r.cssText; if (!/\.wf3?(?![\w-])/.test(t)) return;
          out.push(t.replace(/\.wf3(?![\w-])/g, '.vxc3').replace(/\.wf(?![\w-])/g, '#vx62 .vxc'));
        });
      });
      return out.join('\n');
    }
    var st = document.createElement('style'); st.id = 'vx77-wf-css'; st.textContent = cssFromWf();
    st.textContent += '\n#vx62 .vxc{position:absolute!important;left:0!important;right:0!important;bottom:0!important;top:auto!important;width:auto!important;z-index:5!important;max-height:none!important}' +
      '#vx62 .vxc.mini{height:auto!important;min-height:0!important}#vx62 .vxc.mini .wf-main{display:none!important}#vx62 .vxc .wf-center{overflow:auto}' +
      '#vx62 .vxc .wf-center .sheet{position:static!important;display:block!important;background:none!important;border:0!important;padding:4px 2px!important;max-height:none!important}' +
      '#vx62 .vxc .vx77-idle{opacity:.85;font:600 13px/1.5 system-ui;padding:6px 4px}#vx62 .vxc .vx77-idle b{color:#f2c13d}' +
      '#vx62 .top{display:none!important}#vx62 .dock{display:none!important}#vx62 .info{top:10px!important}' +
      '#vx62 .more{top:auto!important;bottom:calc(var(--ch,60px) + 8px)!important}#vx62 .vxc .wf-crumbs b{white-space:nowrap}' +
      '#vx62 .vxc .wf-acts button i,#vx62 .vxc .wf-menu button i{font-style:normal;font-size:20px;line-height:1}';
    document.head.appendChild(st);
    var con = document.createElement('aside'); con.className = 'vxc vxc3'; con.setAttribute('aria-label', '体素世界控制台');
    con.innerHTML = '<header class="wf-h"><nav class="wf-crumbs"><button type="button" class="on" data-vx77="top"><b>🧊 体素世界</b></button><button type="button" data-vx77="ctx"></button></nav>' +
      '<span class="wf-lv" data-vx77="lv"></span><button type="button" class="wf-x" data-vx77="mini" title="收起 / 展开控制台">▾</button></header>' +
      '<div class="wf-main"><nav class="wf-acts" aria-label="工具"></nav><div class="wf-center"></div><nav class="wf-menu" aria-label="视图"></nav></div>';
    ov.appendChild(con);
    var head = con.querySelector('.wf-h'), acts = con.querySelector('.wf-acts'), center = con.querySelector('.wf-center'), menu = con.querySelector('.wf-menu');
    function tile(b, icon, label) { b.innerHTML = '<i>' + icon + '</i><span>' + label + '</span>'; b.classList.remove('ic'); return b; }
    // ‹ up and ✕ go into the header, as in the 2D console
    var up = ov.querySelector('[data-r="up"]'); if (up) { up.classList.add('wf-up'); up.classList.remove('ic'); head.insertBefore(up, head.firstChild); }
    var x = ov.querySelector('.top [data-a="x"]'); if (x) { x.classList.add('wf-x'); x.classList.remove('ic'); x.title = '回到 2D 岛'; head.appendChild(x); }
    // the tools, left
    Array.prototype.forEach.call(ov.querySelectorAll('.dock [data-tab]'), function (b) {
      var i = b.querySelector('i'), icon = i ? i.textContent : '', label = b.textContent.replace(icon, '').trim();
      acts.appendChild(tile(b, icon, label));
    });
    // the picked tool's controls, centre
    var sheet = ov.querySelector('.sheet'); if (sheet) center.appendChild(sheet);
    var idle = document.createElement('div'); idle.className = 'vx77-idle'; center.appendChild(idle);
    // view, ↶ ↷, 2D and settings, right
    [['[data-m="view"]', '👁', '阅览'], ['[data-m="walk"]', '🚶', '步行'], ['[data-m="fly"]', '✈', '飞行'], ['[data-c="undo"]', '↶', '撤销'], ['[data-c="redo"]', '↷', '重做'], ['.top [data-a="2d"]', '🗺', '看 2D'], ['.top [data-a="more"]', '⚙', '设置']].forEach(function (d) {
      var b = ov.querySelector(d[0]); if (b) menu.appendChild(tile(b, d[1], d[2]));
    });
    var seg = ov.querySelector('.top .seg'); if (seg && !seg.children.length) seg.remove();
    head.querySelector('[data-vx77="mini"]').onclick = function (e) { e.stopPropagation(); con.classList.toggle('mini'); this.textContent = con.classList.contains('mini') ? '▴' : '▾'; fit(); };
    head.querySelector('[data-vx77="top"]').onclick = function (e) { e.stopPropagation(); con.classList.remove('mini'); setTab('look'); fit(); };
    head.querySelector('[data-vx77="ctx"]').onclick = function (e) { e.stopPropagation(); };
    function fit() { ov.style.setProperty('--ch', Math.round(con.getBoundingClientRect().height || 60) + 'px'); }
    function sync() {   // where you are and the picked tool, as the 2D console says it
      var ctx = ov.querySelector('.top .ctx'), c = head.querySelector('[data-vx77="ctx"]'), t = (ctx && ctx.textContent) || '';
      if (c.textContent !== t) { c.textContent = t; c.hidden = !t; }
      var lv = head.querySelector('[data-vx77="lv"]'), l = (TOOLNAME[R.tab] || '浏览') + ' · ' + ({ view: '阅览', walk: '步行', fly: '飞行' }[R.mode] || '');
      if (lv.textContent !== l) lv.textContent = l;
      var empty = !sheet || !sheet.textContent.trim();
      idle.hidden = !empty;
      if (empty && !idle.innerHTML) idle.innerHTML = '<b>🧊 体素世界</b> · 拖动转视角，双指缩放<br>左边选工具：<b>🏛 展馆</b> 几下就把看板布成展览（建筑 → 展厅 → 展架上的卡片），<b>⛰ 地形</b> 一键生成山水；<b>🧩 摆放</b> / <b>🏠 房间</b> / <b>📄 陈列</b> 用手细调<br>右边切换 👁 阅览 / 🚶 步行 / ✈ 飞行';
      fit();
    }
    setInterval(function () { if (ov.classList.contains('open')) sync(); }, 400);
    window.addEventListener('resize', fit);
    sync();
  })();

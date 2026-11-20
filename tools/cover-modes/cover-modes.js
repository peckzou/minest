/* Minest 3D Cover display modes: 3D / Wall / Fan / Helix / Stack / Spiral / Orbit / Sphere / Wave — High-End 3D Physics & Motion */
(function () {
  'use strict';
  if (window.MinestCoverModes) return;
  var MODES = [
    ['flow', '3D'],
    ['wall', 'Wall'],
    ['fan', 'Fan'],
    ['helix', 'Helix'],
    ['stack', 'Stack'],
    ['spiral', 'Spiral'],
    ['orbit', 'Orbit'],
    ['sphere', 'Sphere'],
    ['wave', 'Wave']
  ];
  var KEY = 'minest.coverMode', mode = 'flow', playing = false, speed = 1, fanT = 0, ov = null, bar = null, eng = null, sig = '';
  try { mode = localStorage.getItem(KEY) || 'flow'; speed = parseFloat(localStorage.getItem('minest.coverSpeed')) || 1; } catch (e) {}
  var calm = false; try { calm = matchMedia('(prefers-reduced-motion: reduce)').matches; } catch (e) {}
  /* a soft tick and a light tap when a card comes to the front (not while playing on its own) */
  var lastLand = 0;
  function land() { var n = Date.now(); if (n - lastLand < 90) return; lastLand = n; try { if (window.MinestNative && MinestNative.haptic) MinestNative.haptic('light'); } catch (e) {} try { if (window.SoundEngine && SoundEngine.play) SoundEngine.play('click'); } catch (e) {} }
  var clamp = function (x, a, b) { return Math.max(a, Math.min(b, x)); }, mix = function (a, b, k) { return a + (b - a) * k; };

  function catmull(p0, p1, p2, p3, t) {
    var t2 = t * t, t3 = t2 * t;
    return 0.5 * ((2 * p1) + (-p0 + p2) * t + (2 * p0 - 5 * p1 + 4 * p2 - p3) * t2 + (-p0 + 3 * p1 - 3 * p2 + p3) * t3);
  }

  var css = document.createElement('style');
  css.textContent =
    '#cm-bar{position:absolute;top:44px;left:50%;transform:translateX(-50%);z-index:60;display:flex;align-items:center;gap:2px;max-width:96vw;overflow-x:auto;scrollbar-width:none;padding:4px 6px;border-radius:99px;background:rgba(15,18,26,.8);border:1px solid rgba(255,255,255,.18);box-shadow:0 12px 32px rgba(0,0,0,.3);backdrop-filter:blur(18px);-webkit-backdrop-filter:blur(18px)}' +
    '#cm-bar::-webkit-scrollbar{display:none}' +
    '#cm-bar button{border:0;border-radius:99px;padding:6px 10px;background:none;color:#cbd5e1;font:600 11.5px -apple-system,system-ui,sans-serif;cursor:pointer;white-space:nowrap;flex:none;transition:background .18s ease,color .18s ease,transform .15s ease}' +
    '#cm-bar button:hover{color:#fff}' +
    '#cm-bar button.on{background:#fff;color:#0f172a;box-shadow:0 2px 10px rgba(255,255,255,.35)}' +
    '#cm-bar .pl{width:28px;padding:6px 0;margin-left:3px;background:rgba(255,255,255,.16);color:#fff}' +
    '#cm-bar .pl.on{background:#38bdf8;color:#0f172a}' +
    '#cm-bar input{width:60px;margin:0 6px 0 4px;accent-color:#38bdf8;align-self:center;flex:none}' +
    'body.cm-on .sf-slot[data-sf-view="coverflow"]>*:not(#cm-ov):not(#cm-bar){visibility:hidden!important}' +
    '#cm-ov{position:absolute;inset:0;z-index:50;overflow:hidden;touch-action:none;user-select:none;-webkit-user-select:none;background:radial-gradient(circle at 50% 42%,rgba(255,255,255,.55),transparent 68%),linear-gradient(155deg,#e2e8f0 0%,#f8fafc 50%,#cbd5e1 100%)}' +
    'body.theme-dark #cm-ov{background:radial-gradient(circle at 50% 38%,rgba(56,189,248,.14),transparent 62%),linear-gradient(160deg,#090d16 0%,#111827 52%,#0b1120 100%)!important}' +
    '#cm-ov.wall,#cm-ov.helix,#cm-ov.stack,#cm-ov.orbit,#cm-ov.sphere,#cm-ov.wave{background:radial-gradient(circle at 50% 38%,rgba(255,255,255,.72),transparent 64%),linear-gradient(160deg,#d8d6dc,#f4f3f7 55%,#dfdde4)}' +
    '#cm-fr{position:absolute;left:50%;top:50%;width:720px;height:720px;margin:-360px 0 0 -360px}' +
    '#cm-tilt{position:absolute;inset:0;perspective:1400px;transform-style:preserve-3d}' +
    '.cm-c{position:absolute;left:0;top:0;will-change:transform,opacity,filter;backface-visibility:hidden;overflow:hidden;font-family:-apple-system,system-ui,sans-serif;border:1px solid rgba(255,255,255,.58);display:flex;contain:layout paint;align-items:center;justify-content:center;text-align:center;box-sizing:border-box;cursor:grab}' +
    '.cm-c .im{position:absolute;inset:0;background-size:cover;background-position:center;transition:transform .45s cubic-bezier(.22,1,.36,1)}' +
    '.cm-c:hover .im{transform:scale(1.06)}' +
    '.cm-c .sh{position:absolute;inset:0;pointer-events:none;z-index:3;background:linear-gradient(115deg,transparent 28%,rgba(255,255,255,.32) 46%,rgba(255,255,255,.04) 54%,transparent 70%);mix-blend-mode:overlay}' +
    '.cm-c .tt{position:relative;z-index:2;padding:0 16px;font:700 18px/1.22 -apple-system,system-ui,sans-serif;letter-spacing:-.01em;color:#1e293b;display:-webkit-box;-webkit-line-clamp:4;-webkit-box-orient:vertical;overflow:hidden;pointer-events:none}' +
    '.cm-c .cm-ini{position:absolute;right:10px;top:4px;font:800 64px/1 Georgia,serif;color:var(--cm-col,#64748b);opacity:.09;pointer-events:none;z-index:1}' +
    '.cm-c .cm-st{position:absolute;left:12px;right:12px;bottom:10px;z-index:2;font:600 9.5px/1.2 ui-monospace,monospace;letter-spacing:.1em;text-transform:uppercase;color:var(--cm-col,#64748b);white-space:nowrap;overflow:hidden;text-overflow:ellipsis;pointer-events:none}' +
    '.cm-c .cm-bd{position:absolute;left:0;right:0;top:0;height:5px;background:var(--cm-col,#64748b);opacity:.85;z-index:2}' +
    'body.theme-dark .cm-c .cm-st{filter:brightness(1.5)}.cm-c.hasim .cm-ini,.cm-c.hasim .cm-st,.cm-c.hasim .cm-bd{display:none}' +
    '.cm-c.hasim .tt{opacity:0}body.theme-dark .cm-c .tt{color:#fff}body.theme-dark .cm-c{border-color:rgba(255,255,255,.2)}' +
    '.cm-sp{width:242px;height:312px;margin:-156px 0 0 -121px;border-radius:26px;box-shadow:0 18px 42px rgba(15,23,42,.24)}' +
    '.cm-wl{width:300px;height:200px;margin:-100px 0 0 -150px;border-radius:24px;box-shadow:0 18px 40px rgba(15,23,42,.24);transition:box-shadow .25s ease}' +
    '.cm-wl:hover{box-shadow:0 28px 56px rgba(14,165,233,.32)}' +
    '.cm-wl.wi,.cm-hx.wi{border-radius:16px;box-shadow:0 18px 42px rgba(0,0,0,.3);background:#232429!important;border:0;backdrop-filter:none;-webkit-backdrop-filter:none;display:block;text-align:left}' +
    '.cm-wl .art,.cm-hx .art{position:absolute;left:10px;top:10px;right:10px;height:112px;border-radius:10px;background-size:cover;background-position:center;background-color:#33343a;overflow:hidden}' +
    '.cm-wl .art i,.cm-hx .art i{position:absolute;left:12px;right:40%;height:6px;border-radius:3px;background:rgba(255,255,255,.22)}' +
    '.cm-wl .wt,.cm-hx .wt{position:absolute;left:14px;right:14px;bottom:34px;font:700 21px/1.1 -apple-system,system-ui,sans-serif;color:#fff;white-space:nowrap;overflow:hidden;text-overflow:ellipsis;pointer-events:none}' +
    '.cm-wl .ws,.cm-hx .ws{position:absolute;left:14px;right:14px;bottom:14px;font:500 11px/1.2 -apple-system,system-ui,sans-serif;color:#9a9aa3;white-space:nowrap;overflow:hidden;text-overflow:ellipsis;pointer-events:none}' +
    '.cm-wl .wg,.cm-hx .wg{position:absolute;right:12px;bottom:12px;max-width:42%;font:700 8.5px ui-monospace,monospace;letter-spacing:.08em;color:#ff7a59;background:rgba(255,90,60,.16);padding:3px 6px;border-radius:5px;text-transform:uppercase;white-space:nowrap;overflow:hidden;text-overflow:ellipsis}' +
    '.cm-fn{width:178px;height:178px;margin:-89px 0 0 -89px;border-radius:32px;box-shadow:0 18px 42px rgba(15,23,42,.26)}.cm-fn .tt,.cm-hx .tt{font-size:17px}' +
    '.cm-orb{width:172px;height:220px;margin:-110px 0 0 -86px;border-radius:22px;box-shadow:0 18px 40px rgba(15,23,42,.26)}.cm-orb .tt{font-size:16px}' +
    '.cm-sph{width:152px;height:192px;margin:-96px 0 0 -76px;border-radius:20px;box-shadow:0 16px 36px rgba(15,23,42,.24)}.cm-sph .tt{font-size:15px}' +
    '.cm-wav{width:176px;height:224px;margin:-112px 0 0 -88px;border-radius:22px;box-shadow:0 18px 40px rgba(15,23,42,.25)}.cm-wav .tt{font-size:16px}' +
    '.cm-hx{backdrop-filter:none;-webkit-backdrop-filter:none;width:320px;height:212px;margin:-106px 0 0 -160px;border-radius:20px;box-shadow:0 20px 46px rgba(0,0,0,.28);backface-visibility:hidden;transition:box-shadow .25s ease}' +
    '.cm-c.act{box-shadow:0 30px 64px rgba(14,165,233,.34),0 20px 48px rgba(0,0,0,.38)}' +
    '.cm-hx .art,.cm-wl .art{animation:cmz 5.5s ease-in-out var(--cm-d,0s) infinite alternate}' +
    '.cm-hx .art i,.cm-wl .art i{animation:cmb 2s ease-in-out var(--cm-d,0s) infinite alternate}' +
    '.cm-hx .wg,.cm-wl .wg{animation:cmp 1.8s ease-in-out var(--cm-d,0s) infinite alternate}' +
    '@keyframes cmz{from{background-size:100% auto;background-position:50% 25%}to{background-size:118% auto;background-position:50% 75%}}' +
    '@keyframes cmb{from{transform:scaleX(.45);transform-origin:left}to{transform:scaleX(1);transform-origin:left}}' +
    '@keyframes cmp{from{opacity:.5}to{opacity:1}}' +
    '.cm-hx.wi .art{height:122px;left:11px;right:11px;top:11px}.cm-hx.wi .wt{font-size:21px;bottom:34px}.cm-hx.wi .ws{font-size:11px;bottom:14px}.cm-hx.wi .wg{font-size:8.5px;bottom:13px}' +
    '#cm-ov.stack .cm-c .tt{font-size:19px;-webkit-line-clamp:3}' +
    '#cm-det{position:absolute;left:50%;bottom:calc(env(safe-area-inset-bottom,0px) + 96px);width:min(340px,86%);transform:translateX(-50%);z-index:1200;background:rgba(255,255,255,.9);backdrop-filter:blur(20px);-webkit-backdrop-filter:blur(20px);border:1px solid rgba(255,255,255,.85);border-radius:22px;box-shadow:0 18px 44px rgba(15,23,42,.2);padding:14px 20px;text-align:center;box-sizing:border-box;font-family:-apple-system,system-ui,sans-serif;display:none;pointer-events:none}' +
    '#cm-ov.fan #cm-det,#cm-ov.orbit #cm-det,#cm-ov.wave #cm-det{display:block}html.mn-dock-v #cm-det{bottom:calc(env(safe-area-inset-bottom,0px) + 22px)}html.mn-sys-reading #cm-det{display:none!important}' +
    '#cm-det>*{display:block}' +
    'body.theme-dark #cm-det{background:rgba(30,36,50,.9);border-color:rgba(255,255,255,.14)}body.theme-dark #cm-det b{color:#fff}body.theme-dark #cm-det p{color:#94a3b8}#cm-det b{display:block;font:800 19px/1.18 -apple-system,system-ui,sans-serif;margin:5px 0 4px;color:#0f172a}#cm-det span{font:700 9.5px ui-monospace,monospace;color:#0284c7;letter-spacing:.12em}#cm-det p{margin:0;color:#475569;font-size:12px}';
  document.head.appendChild(css);

  function hue(s) { var h = 0; s = String(s); for (var i = 0; i < s.length; i++) h = (h * 31 + s.charCodeAt(i)) % 360; return h; }
  function items() {
    var b = null; try { b = window.MinestAI && MinestAI.board && MinestAI.board(); } catch (e) {}
    if (!b || !window.MinestImageViews) return [];
    var list = MinestImageViews.cards(b, null, '');
    return list.map(function (c) {
      var im = MinestImageViews.image(c), src = im.thumb || im.full || '';
      return { id: c.id, title: c.title || 'Untitled', sub: c.columnTitle || '', src: src, hue: hue(c.id || c.title), color: c.color || (c.background && c.background !== '#fbfaf7' ? c.background : '') || (c.columnColor || '') };
    });
  }

  var P = [[-170, 175, 1, -3], [-35, 110, .85, -2], [90, 75, .78, 1], [178, 40, .62, 4], [215, -35, .54, 8], [122, -145, .46, 14], [42, -165, .35, 18], [-13, -165, .3, 20], [-70, -145, .25, 22], [-114, -118, .21, 24], [-155, -90, .18, 26], [-198, -54, .15, 28], [-210, -18, .12, 30], [-212, 22, .095, 32], [-212, 55, .075, 34], [-212, 82, .058, 34], [-212, 104, .044, 34], [-212, 122, .033, 34], [-212, 136, .025, 34], [-212, 148, .019, 34], [-212, 156, .014, 34], [-212, 162, .01, 34]];

  function Engine(box, list, m, onPick) {
    var N = list.length, fr = document.createElement('div'), tilt = document.createElement('div'), det = document.createElement('div');
    fr.id = 'cm-fr'; tilt.id = 'cm-tilt'; det.id = 'cm-det'; fr.appendChild(tilt); box.appendChild(fr); box.appendChild(det);
    var minCount = { spiral: 22, helix: 12, stack: 10, fan: 9, orbit: 12, sphere: 18, wave: 13 }[m] || N;
    var count = m === 'wall' ? Math.max(Math.ceil(Math.max(N, 20) / 5) + (Math.ceil(Math.max(N, 20) / 5) % 2), 4) * 5 : Math.max(N, minCount);
    var cards = [], time = 0, idle = 0, drag = false, vel = 0, t = 0, sel = 0, selF = 0, selV = 0, off = { x: 0, y: 0 }, ov2 = { x: 0, y: 0 }, sph = { rx: 0.18, ry: 0, vx: 0, vy: 0 }, goal = null, moved = 0, last = performance.now(), par = { x: 0, y: 0, tx: 0, ty: 0 }, hovIdx = -1, dead = false;
    var cls = { spiral: 'cm-sp', wall: 'cm-wl', helix: 'cm-hx', stack: 'cm-hx', fan: 'cm-fn', orbit: 'cm-orb', sphere: 'cm-sph', wave: 'cm-wav' }[m];
    for (var i = 0; i < count; i++) {
      var it = list[i % N], el = document.createElement('div');
      el.className = 'cm-c ' + cls;
      var col = /^#[0-9a-f]{6}$/i.test(it.color) ? it.color : '#' + [0, 8, 16].map(function (o) { return ('0' + Math.round(128 + 90 * Math.sin(((it.hue + i * 23) + o * 15) * .0175)).toString(16)).slice(-2); }).join('');
      var dark = /theme-dark/.test(document.body.className);
      el.style.backgroundColor = dark ? '#161b24' : '#fbfaf7';
      el.style.backgroundImage = dark ? 'linear-gradient(135deg,' + col + '52 0%,' + col + '1e 50%,rgba(14,22,33,.88) 100%)' : 'linear-gradient(135deg,' + col + '3a 0%,' + col + '14 50%,rgba(255,255,255,.94) 100%)';
      el.style.borderColor = col + '77';
      el.innerHTML = (it.src ? '<div class="im" style="background-image:url(&quot;' + String(it.src).replace(/"/g, '%22') + '&quot;)"></div>' : '') + '<div class="cm-bd"></div><div class="cm-ini"></div><div class="sh"></div><div class="tt"></div><div class="cm-st"></div>';
      el.style.setProperty('--cm-col', col);
      if ((m === 'wall' || m === 'helix' || m === 'stack') && it.src) {
        el.removeAttribute('style'); el.classList.add('wi');
        el.innerHTML = '<div class="art"' + (it.src ? ' style="background-image:url(&quot;' + String(it.src).replace(/"/g, '%22') + '&quot;)"' : ' style="background-image:linear-gradient(135deg,' + col + '55,' + col + '14)"') + '>' + (it.src ? '' : '<i style="top:18px;width:46%"></i><i style="top:34px;width:30%"></i><i style="top:76px;width:38%;background:' + col + '"></i>') + '</div><div class="sh"></div><div class="wt"></div><div class="ws"></div><div class="wg"></div>';
        el.querySelector('.wt').textContent = it.title; el.querySelector('.ws').textContent = it.sub; el.querySelector('.wg').textContent = it.sub;
      } else {
        if (it.src) el.classList.add('hasim');
        el.querySelector('.tt').textContent = it.title;
        var ini = el.querySelector('.cm-ini'), st = el.querySelector('.cm-st'); if (ini) ini.textContent = (String(it.title).trim().charAt(0) || '').toUpperCase(); if (st) st.textContent = it.sub;
      }
      el.dataset.i = i % N;
      el.dataset.slot = i;
      el.style.setProperty('--cm-d', ((i % 9) * -0.68) + 's');
      (function (idx) {
        el.addEventListener('pointerenter', function () { hovIdx = idx; });
        el.addEventListener('pointerleave', function () { if (hovIdx === idx) hovIdx = -1; });
      })(i);
      tilt.appendChild(el); cards.push(el);
    }
    if (m === 'spiral' || m === 'helix' || m === 'stack' || m === 'orbit' || m === 'sphere' || m === 'wave') tilt.style.transformStyle = 'flat';
    var detAge = 1, hxPath = null, hxPath2 = null, born = calm ? 1 : 0; if (!calm) fr.style.opacity = '0';
    if (m === 'helix' || m === 'orbit' || m === 'wave') {
      var sv = document.createElementNS('http://www.w3.org/2000/svg', 'svg');
      sv.setAttribute('viewBox', '0 0 720 720');
      sv.style.cssText = 'position:absolute;inset:0;pointer-events:none;overflow:visible';
      hxPath2 = document.createElementNS('http://www.w3.org/2000/svg', 'path');
      hxPath2.setAttribute('fill', 'none');
      hxPath2.setAttribute('stroke', 'rgba(56,189,248,.24)');
      hxPath2.setAttribute('stroke-width', '2.2');
      hxPath = document.createElementNS('http://www.w3.org/2000/svg', 'path');
      hxPath.setAttribute('fill', 'none');
      hxPath.setAttribute('stroke', 'rgba(60,50,60,.36)');
      hxPath.setAttribute('stroke-width', '1.4');
      hxPath.setAttribute('stroke-dasharray', '5 5');
      sv.appendChild(hxPath2);
      sv.appendChild(hxPath);
      fr.insertBefore(sv, tilt);
    }
    function fit() {
      var w = box.clientWidth || 390, h = box.clientHeight || 700;
      fr.style.transform = 'scale(' + (m === 'wall' ? Math.max(w / 1000, h / 1100) : (m === 'helix' || m === 'stack' ? Math.min(w / 640, h / 900) : Math.min(w / 720, h / 740) * (m === 'sphere' ? 0.82 / Math.min(1.25, Math.sqrt(Math.max(1, count / 18))) + 0.12 : 1))) + ')';
    }
    fit();

    function sp(d) {
      if (d < 0) {
        var k0 = clamp(-d, 0, 1.25), p = P[0];
        return [p[0] - k0 * 320, p[1] + k0 * 240, p[2] + k0 * .42, p[3] - k0 * 9, clamp(1 - k0 / .95, 0, 1)];
      }
      d = Math.min(d, P.length - 1.001);
      var a = Math.floor(d), k = d - a;
      var p0 = P[Math.max(0, a - 1)], p1 = P[a], p2 = P[Math.min(P.length - 1, a + 1)], p3 = P[Math.min(P.length - 1, a + 2)];
      return [
        catmull(p0[0], p1[0], p2[0], p3[0], k),
        catmull(p0[1], p1[1], p2[1], p3[1], k),
        Math.max(0.008, catmull(p0[2], p1[2], p2[2], p3[2], k)),
        catmull(p0[3], p1[3], p2[3], p3[3], k),
        1
      ];
    }

    function updateDet(idx, tagPrefix) {
      var curIdx = ((Math.round(idx) % N) + N) % N, cur = list[curIdx];
      var key = tagPrefix + ':' + curIdx;
      if (det.dataset.k !== key) {
        det.dataset.k = key;
        det.innerHTML = '<span></span><b></b><p></p>';
        det.children[0].textContent = tagPrefix + ' / ' + String(curIdx + 1).padStart(2, '0') + ' / ' + String(N).padStart(2, '0');
        det.children[1].textContent = cur.title;
        det.children[2].textContent = cur.sub;
        detAge = calm ? 1 : 0;
        if (!playing && det.dataset.k0) land();
        det.dataset.k0 = '1';
      }
    }

    function render() {
      var M = count;
      if (m === 'spiral') {
        tilt.style.transform = 'rotateX(' + (-par.y * 4.2).toFixed(2) + 'deg) rotateY(' + (par.x * 4.2).toFixed(2) + 'deg)';
        cards.forEach(function (el, i) {
          var d = (((i - t) % M) + M) % M;
          if (d > M - 1.25) d -= M;
          var r = sp(d);
          var flt = Math.sin(time * 2.1 + i * 0.85) * (d < 4 ? 4.5 : 1.5);
          var breathe = 1 + Math.max(0, 1 - Math.abs(d)) * 0.045 * Math.sin(time * 2.4) + (hovIdx === i ? 0.05 : 0);
          var bankX = Math.sin(time * 1.5 + i) * 3.5 + (d < 0 ? d * 12 : 0);
          el.style.opacity = d > P.length - 1.2 ? 0 : r[4];
          el.style.pointerEvents = d > 6.5 ? 'none' : '';
          el.style.transform = 'translate3d(' + (360 + r[0]).toFixed(1) + 'px,' + (360 + r[1] + flt).toFixed(1) + 'px,0) rotateX(' + bankX.toFixed(2) + 'deg) rotateY(' + (-r[3] * .55).toFixed(2) + 'deg) rotateZ(' + (r[3] * .62).toFixed(2) + 'deg) scale(' + (r[2] * breathe).toFixed(3) + ')';
          el.style.zIndex = Math.round(1000 - d * 10);
        });
      } else if (m === 'wall') {
        tilt.style.transform = 'rotateX(' + (15 - par.y * 4.5).toFixed(2) + 'deg) rotateY(' + (11 + par.x * 5).toFixed(2) + 'deg) rotateZ(-13deg)';
        var cw = 330, ch = 238, cols = 5, rows = count / cols, W = cols * cw, H = rows * ch;
        cards.forEach(function (el, i) {
          var col = i % cols, row = Math.floor(i / cols), dir = row % 2 ? 1 : -1;
          var x = col * cw + dir * off.x + (row % 2) * 70;
          x = ((x % W) + W) % W - W / 2 - cw / 2;
          var y = ((row * ch + off.y) % H + H) % H - H / 2 - ch / 2;
          var bob = Math.sin(time * 1.65 + i * 0.78) * 9 + (hovIdx === i ? 24 : 0);
          var tiltCard = Math.cos(time * 1.3 + i * 0.6) * 2.2;
          var sc = hovIdx === i ? 1.06 : 1;
          el.style.transform = 'translate3d(' + (360 + x).toFixed(1) + 'px,' + (360 + y + bob * .35).toFixed(1) + 'px,' + bob.toFixed(1) + 'px) rotateX(' + tiltCard.toFixed(2) + 'deg) scale(' + sc + ')';
        });
      } else if (m === 'stack') {
        tilt.style.transform = 'rotateX(' + (-par.y * 3.2).toFixed(2) + 'deg) rotateY(' + (par.x * 3.8).toFixed(2) + 'deg)';
        cards.forEach(function (el, i) {
          var d = ((i - selF) % M + M) % M; if (d > M - 1.25) d -= M;
          var a = Math.max(d, 0), out = d < 0 ? -d : 0;
          var swayX = Math.sin(a * 0.5 - time * 1.3) * 10 * Math.min(a, 1);
          var fltY = Math.cos(time * 1.8 + i * 0.9) * 3;
          var sc = Math.max(0.62, 1.04 - a * 0.065 + out * 0.12 + (hovIdx === i ? 0.04 : 0));
          var pitch = Math.min(a, 1) * 5 - out * 14;
          el.style.opacity = d > 6.2 ? 0 : d < 0 ? clamp(1 - out * 1.15, 0, 1) : (a <= 3 ? 1 : clamp(1 - (a - 3) * 0.3, 0.05, 1));
          el.style.pointerEvents = d > 2.8 || d < -.5 ? 'none' : '';
          el.style.filter = a < .45 ? '' : 'grayscale(' + clamp(a * .22, 0, .55).toFixed(2) + ') brightness(' + (1 - Math.min(a, 4) * .06).toFixed(2) + ')';
          el.style.transform = 'translate3d(' + (360 + swayX).toFixed(1) + 'px,' + (500 - a * 72 + out * 220 + fltY).toFixed(1) + 'px,0) perspective(1100px) rotateX(' + pitch.toFixed(2) + 'deg) scale(' + sc.toFixed(3) + ')';
          el.style.zIndex = Math.round(1000 - d * 20);
          el.classList.toggle('act', d > -.5 && d < .5);
        });
      } else if (m === 'helix') {
        var hxPts = [], hxPts2 = [];
        for (var hd = -2.5; hd <= 2.55; hd += 0.18) {
          var hth = hd * .82;
          hxPts.push((360 + Math.sin(hth) * 245).toFixed(1) + ',' + (360 - hd * 195).toFixed(1));
          hxPts2.push((360 + Math.sin(hth + 0.45) * 215).toFixed(1) + ',' + (360 - hd * 195 + Math.cos(time * 1.4 + hd) * 8).toFixed(1));
        }
        if (hxPath) hxPath.setAttribute('d', 'M' + hxPts.join(' L'));
        if (hxPath2) hxPath2.setAttribute('d', 'M' + hxPts2.join(' L'));
        cards.forEach(function (el, i) {
          var d = ((i - selF) % M + M + M / 2) % M - M / 2, ad = Math.abs(d);
          var th = d * .82, R = 245;
          var bobY = Math.sin(time * 1.85 + i * 1.35) * 7;
          var bobRot = Math.cos(time * 1.35 + i * 0.95) * 2.6;
          var x = Math.sin(th) * R + par.x * 14 * (1 - Math.min(ad, 2) * .3);
          var y = 360 - d * 195 + bobY + par.y * 10;
          var focus = clamp(1 - ad / .85, 0, 1);
          var rotY = Math.sin(th) * 26 * (1 - focus * .85) + par.x * 5;
          var rotZ = Math.cos(th) * d * -4 * (1 - focus * .9) + bobRot;
          var sc = 0.72 + focus * 0.34 - Math.max(0, ad - 1) * 0.06 + (hovIdx === i ? 0.04 : 0);
          el.style.opacity = ad > 2.45 ? 0 : clamp(1.18 - ad * .38, .08, 1);
          el.style.pointerEvents = ad > 2.1 ? 'none' : '';
          el.style.filter = ad < .35 ? '' : 'grayscale(' + clamp(ad * .62, 0, .72).toFixed(2) + ') brightness(' + (1 - Math.min(ad, 2.4) * .08).toFixed(2) + ')';
          el.style.transform = 'translate3d(' + (360 + x).toFixed(1) + 'px,' + y.toFixed(1) + 'px,0) perspective(1100px) rotateY(' + rotY.toFixed(2) + 'deg) rotateZ(' + rotZ.toFixed(2) + 'deg) scale(' + sc.toFixed(3) + ')';
          el.style.zIndex = Math.round(1000 - ad * 100);
          el.classList.toggle('act', ad < .45);
        });
      } else if (m === 'orbit') {
        /* 6. 3D Planetary Halo Orbit Ring — card-centered perspective so cards never blow up over #cm-det */
        var oPts = [], oPts2 = [];
        for (var oa = 0; oa <= 6.32; oa += 0.16) {
          oPts.push((360 + Math.sin(oa) * 262).toFixed(1) + ',' + (268 + Math.cos(oa) * 82).toFixed(1));
          oPts2.push((360 + Math.sin(oa) * 276).toFixed(1) + ',' + (268 + Math.cos(oa) * 90 + Math.sin(oa * 3 + time * 2) * 3).toFixed(1));
        }
        if (hxPath) hxPath.setAttribute('d', 'M' + oPts.join(' L') + ' Z');
        if (hxPath2) hxPath2.setAttribute('d', 'M' + oPts2.join(' L') + ' Z');
        cards.forEach(function (el, i) {
          var d = ((i - selF) % M + M + M / 2) % M - M / 2;
          var RING = Math.min(M, 16), ang = (d / RING) * Math.PI * 2;
          if (Math.abs(d) > RING / 2) { el.style.opacity = 0; el.style.pointerEvents = 'none'; return; }
          var sinA = Math.sin(ang), cosA = Math.cos(ang);
          var flt = Math.sin(time * 2.1 + i * 0.9) * 5;
          var x = sinA * 262 + par.x * 14 * cosA;
          var y = 268 + cosA * 82 + flt - par.y * 10;
          var front = clamp((cosA + 1) * 0.5, 0, 1);
          var focus = Math.pow(front, 3.2);
          var sc = 0.44 + front * 0.36 + focus * 0.24 + (hovIdx === i ? 0.05 : 0);
          var rotY = -sinA * 42 * (1 - focus * 0.88) + par.x * 5;
          var rotZ = -sinA * 5.5 * (1 - focus);
          el.style.opacity = clamp(0.2 + front * 0.85, 0.2, 1);
          el.style.pointerEvents = cosA < -0.15 ? 'none' : '';
          el.style.filter = cosA > 0.75 ? '' : 'brightness(' + (0.72 + front * 0.28).toFixed(2) + ')';
          el.style.transform = 'translate3d(' + (360 + x).toFixed(1) + 'px,' + y.toFixed(1) + 'px,0) perspective(1000px) rotateY(' + rotY.toFixed(2) + 'deg) rotateZ(' + rotZ.toFixed(2) + 'deg) scale(' + sc.toFixed(3) + ')';
          el.style.zIndex = Math.round(500 + cosA * 400);
          el.classList.toggle('act', Math.abs(d) < 0.45);
        });
        updateDet(sel, 'ORBIT');
      } else if (m === 'sphere') {
        /* 7. 3D Fibonacci Knowledge Globe — card-centered perspective */
        var phi = Math.PI * (3 - Math.sqrt(5)), dens = Math.sqrt(Math.max(1, M / 18)), R = 232 * Math.min(1.25, dens), shrink = 1 / Math.min(1.6, dens);
        var cosY = Math.cos(sph.ry + par.x * 0.25), sinY = Math.sin(sph.ry + par.x * 0.25);
        var cosX = Math.cos(sph.rx - par.y * 0.2), sinX = Math.sin(sph.rx - par.y * 0.2);
        var bestI = 0, bestZ = -1e9;
        cards.forEach(function (el, i) {
          var y0 = 1 - (i / Math.max(1, M - 1)) * 2;
          var r0 = Math.sqrt(Math.max(0, 1 - y0 * y0));
          var th = phi * i;
          var vx = Math.cos(th) * r0, vy = y0, vz = Math.sin(th) * r0;
          var x1 = vx * cosY + vz * sinY, z1 = -vx * sinY + vz * cosY;
          var y2 = vy * cosX - z1 * sinX, z2 = vy * sinX + z1 * cosX;
          if (z2 > bestZ) { bestZ = z2; bestI = i; }
          var breathe = 1 + Math.sin(time * 1.9 + i * 0.7) * 0.03;
          var px = x1 * R * breathe, py = y2 * R * breathe;
          var front = clamp((z2 + 1) * 0.5, 0, 1);
          var sc = (0.4 + Math.pow(front, 1.7) * 0.62) * mix(shrink, 1, Math.pow(front, 6)) + (hovIdx === i ? 0.06 : 0);
          var rotY = x1 * 38 * (1 - Math.pow(front, 4));
          var rotX = -y2 * 32 * (1 - Math.pow(front, 4));
          el.style.opacity = clamp(0.14 + Math.pow(front, 1.4) * 0.9, 0.14, 1);
          el.style.pointerEvents = z2 < -0.05 ? 'none' : '';
          el.style.filter = z2 > 0.6 ? '' : 'brightness(' + (0.65 + front * 0.35).toFixed(2) + ')';
          el.style.transform = 'translate3d(' + (360 + px).toFixed(1) + 'px,' + (350 + py).toFixed(1) + 'px,0) perspective(1000px) rotateY(' + rotY.toFixed(2) + 'deg) rotateX(' + rotX.toFixed(2) + 'deg) scale(' + sc.toFixed(3) + ')';
          el.style.zIndex = Math.round(500 + z2 * 400);
        });
        cards.forEach(function (el, i) { el.classList.toggle('act', i === bestI); });
      } else if (m === 'wave') {
        /* 8. 3D Harmonic Sine Ribbon Wave — card-centered perspective */
        var wPts = [], wPts2 = [];
        for (var wd = -3.4; wd <= 3.45; wd += 0.16) {
          var ph = wd * 0.85 - time * 1.4;
          wPts.push((360 + wd * 98).toFixed(1) + ',' + (280 + Math.sin(ph) * 74).toFixed(1));
          wPts2.push((360 + wd * 98).toFixed(1) + ',' + (280 + Math.cos(ph) * 52).toFixed(1));
        }
        if (hxPath) hxPath.setAttribute('d', 'M' + wPts.join(' L'));
        if (hxPath2) hxPath2.setAttribute('d', 'M' + wPts2.join(' L'));
        cards.forEach(function (el, i) {
          var d = ((i - selF) % M + M + M / 2) % M - M / 2, ad = Math.abs(d);
          if (ad > 3.6) { el.style.opacity = 0; el.style.pointerEvents = 'none'; return; }
          el.style.pointerEvents = '';
          var ph = d * 0.85 - time * 1.4;
          var x = d * 102 + par.x * 14;
          var y = 278 + Math.sin(ph) * 72 * clamp(ad * 0.65, 0.15, 1) - par.y * 10;
          var focus = clamp(1 - ad / 0.85, 0, 1);
          var rotZ = Math.cos(ph) * 14 * (1 - focus * 0.85);
          var rotY = -d * 14 * (1 - focus * 0.85) + par.x * 5;
          var sc = 0.64 + focus * 0.4 - Math.max(0, ad - 1) * 0.06 + (hovIdx === i ? 0.05 : 0);
          el.style.opacity = clamp(3.6 - ad, 0, 1);
          el.style.filter = ad < 0.45 ? '' : 'brightness(' + (1 - Math.min(ad, 3) * 0.07).toFixed(2) + ')';
          el.style.transform = 'translate3d(' + (360 + x).toFixed(1) + 'px,' + y.toFixed(1) + 'px,0) perspective(1000px) rotateY(' + rotY.toFixed(2) + 'deg) rotateZ(' + rotZ.toFixed(2) + 'deg) scale(' + sc.toFixed(3) + ')';
          el.style.zIndex = Math.round(800 - ad * 100);
          el.classList.toggle('act', ad < 0.45);
        });
        updateDet(sel, 'WAVE');
      } else {
        tilt.style.transform = 'rotateX(' + (-par.y * 4.5).toFixed(2) + 'deg) rotateY(' + (par.x * 5).toFixed(2) + 'deg)';
        cards.forEach(function (el, i) {
          var d = i - selF, a = Math.abs(d), s = d < 0 ? -1 : 1, k = Math.min(a, 1);
          if (a > 4.3) { el.style.opacity = 0; el.style.pointerEvents = 'none'; return; }
          el.style.pointerEvents = '';
          el.style.opacity = clamp(4.3 - a, 0, 1);
          var flt = Math.sin(time * 2.2 + i * 0.9) * (a < 0.5 ? 6 : 3);
          var rotZ = clamp(d * 6.2, -20, 20);
          var rotY = clamp(-d * 10.5, -28, 28);
          var sc = (a < 1 ? 1.32 - a * .32 : Math.max(0.76, 1 - (a - 1) * 0.06)) + (hovIdx === i ? 0.05 : 0);
          el.style.transform = 'translate3d(' + (360 + d * 96 + s * k * 68).toFixed(1) + 'px,' + (288 + a * a * 5.5 + k * 8 + flt).toFixed(1) + 'px,' + (-a * 46).toFixed(1) + 'px) rotateY(' + rotY.toFixed(2) + 'deg) rotateZ(' + rotZ.toFixed(2) + 'deg) scale(' + sc.toFixed(3) + ')';
          el.style.zIndex = Math.round(1000 - a * 10);
        });
        updateDet(sel, 'COVER');
      }
    }

    var rafId = 0;
    function tick() {
      if (dead) return;
      rafId = requestAnimationFrame(tick);
      var now = performance.now(), dt = Math.min(.05, (now - last) / 1000); last = now; if (!calm) time += dt;
      if (document.hidden) return;
      if (detAge < 1) { detAge = Math.min(1, detAge + dt / 0.32); var de = 1 - Math.pow(1 - detAge, 3); [].forEach.call(det.children, function (c) { c.style.opacity = de.toFixed(3); c.style.transform = 'translateY(' + ((1 - de) * 6).toFixed(1) + 'px)'; }); }
      if (born < 1) { born = Math.min(1, born + dt / 0.5); var e = 1 - Math.pow(1 - born, 3); fr.style.opacity = e.toFixed(3); tilt.style.translate = '0 ' + ((1 - e) * 18).toFixed(1) + 'px'; if (born >= 1) { fr.style.opacity = ''; tilt.style.translate = ''; } }
      par.x += (par.tx - par.x) * Math.min(1, dt * 8);
      par.y += (par.ty - par.y) * Math.min(1, dt * 8);
      if (!drag) {
        if (idle > 0) idle -= dt;
        if (m === 'sphere') {
          if (playing) { sph.ry += dt * speed * 0.55; sph.rx = 0.18 + Math.sin(time * 0.6) * 0.22; }
          sph.ry += sph.vy; sph.rx = clamp(sph.rx + sph.vx, -1.1, 1.1);
          sph.vy *= Math.pow(.12, dt); sph.vx *= Math.pow(.12, dt);
        } else if (playing && goal === null && m !== 'fan') {
          vel = 0;
          if (m === 'spiral') t += dt * speed * .82;
          else sel += dt * speed * .72;
        } else if (playing && m === 'fan') {
          fanT += dt * speed;
          if (fanT > 1.25) { fanT = 0; sel = sel >= count - 1 ? 0 : Math.round(sel) + 1; }
        } else if (m === 'spiral') {
          if (goal !== null) { t += (goal - t) * Math.min(1, dt * 9); if (Math.abs(goal - t) < .003) { t = goal; goal = null; } }
          else { vel *= Math.pow(.08, dt); t += vel * dt * 60; if (Math.abs(vel) < .004) t += (Math.round(t) - t) * Math.min(1, dt * 9); }
        } else if (m === 'helix' || m === 'stack' || m === 'orbit' || m === 'wave') {
          if (goal !== null) { sel += (goal - sel) * Math.min(1, dt * 9); if (Math.abs(goal - sel) < .003) { sel = goal; goal = null; } }
          else { vel *= Math.pow(.06, dt); sel += vel * dt * 60; if (Math.abs(vel) < .004) sel += (Math.round(sel) - sel) * Math.min(1, dt * 9); }
        }
        if (m === 'wall') {
          if (playing) { off.x += dt * speed * 48; off.y -= dt * speed * 22; }
          off.x += ov2.x; off.y += ov2.y; ov2.x *= Math.pow(.16, dt); ov2.y *= Math.pow(.16, dt);
        }
        if (m === 'fan') { selV += (sel - selF) * 260 * dt; selV *= Math.exp(-20 * dt); selF += selV * dt; }
        else if (m === 'helix' || m === 'stack' || m === 'orbit' || m === 'wave') { selV += (sel - selF) * 210 * dt; selV *= Math.exp(-18 * dt); selF += selV * dt; }
      } else if (m === 'fan' || m === 'helix' || m === 'stack' || m === 'orbit' || m === 'wave') {
        selF += (sel - selF) * Math.min(1, dt * 18); selV = 0;
      }
      render();
    }
    rafId = requestAnimationFrame(tick);

    function hoverMove(e) {
      var r = box.getBoundingClientRect();
      par.tx = clamp(((e.clientX - r.left) / (r.width || 1) - .5) * 2, -1, 1);
      par.ty = clamp(((e.clientY - r.top) / (r.height || 1) - .5) * 2, -1, 1);
    }
    box.addEventListener('pointermove', hoverMove);
    var px = 0, py = 0;
    box.addEventListener('pointerdown', down); box.addEventListener('pointermove', move); box.addEventListener('pointerup', up); box.addEventListener('pointercancel', up);
    function down(e) { if (e.target.closest('#cm-bar')) return; px = e.clientX; py = e.clientY; vel = 0; ov2.x = ov2.y = 0; sph.vx = sph.vy = 0; goal = null; moved = 0; drag = true; try { box.setPointerCapture(e.pointerId); } catch (x) {} }
    function move(e) {
      if (!drag) return;
      var dx = e.clientX - px, dy = e.clientY - py; px = e.clientX; py = e.clientY; moved += Math.abs(dx) + Math.abs(dy);
      if (m === 'spiral') { var s = -(dx - dy) / 210; t += s; vel = s; }
      else if (m === 'wall') { off.x += dx; off.y += dy; ov2.x = dx; ov2.y = dy; }
      else if (m === 'sphere') { sph.ry += dx * 0.0065; sph.rx = clamp(sph.rx - dy * 0.0065, -1.1, 1.1); sph.vy = dx * 0.003; sph.vx = -dy * 0.003; }
      else if (m === 'helix') { var hs = (-dx + dy) / 72; sel += hs; vel = hs; }
      else if (m === 'stack') { var ss = (-dx + dy * .6) / 60; sel += ss; vel = ss; }
      else if (m === 'orbit' || m === 'wave') { var os = -dx / 68; sel += os; vel = os; }
      else sel = clamp(sel - dx / 70, 0, count - 1);
    }
    function up(e) {
      if (!drag) return; drag = false;
      if (m === 'fan') sel = Math.round(sel);
      if (moved < 6) {
        var c = document.elementFromPoint(e.clientX, e.clientY), el = c && c.closest && c.closest('.cm-c');
        if (!el) return;
        var slotIdx = +el.dataset.slot, itemIdx = +el.dataset.i, base = m === 'spiral' ? t : sel, cur = ((Math.round(base) % count) + count) % count;
        if (m === 'wall' || m === 'sphere' || slotIdx === cur) { if (onPick) onPick(list[itemIdx]); return; }
        if (m === 'fan') sel = slotIdx;
        else { var dd = (((slotIdx - base) % count) + count + count / 2) % count - count / 2; goal = base + dd; }
      }
    }
    function wheel(e) {
      e.preventDefault(); var dx = e.deltaX || 0, dy = e.deltaY || 0;
      if (m === 'wall') { off.x -= dx; off.y -= dy; return; }
      if (m === 'sphere') { sph.ry -= dx * 0.004; sph.rx = clamp(sph.rx + dy * 0.004, -1.1, 1.1); return; }
      var k = (Math.abs(dx) > Math.abs(dy) ? dx : dy);
      if (m === 'fan') sel = clamp(Math.round(sel) + (k > 0 ? 1 : -1), 0, count - 1);
      else if (m === 'spiral') { goal = Math.round(goal === null ? t : goal) + (k > 0 ? 1 : -1); }
      else goal = Math.round(goal === null ? sel : goal) + (k > 0 ? 1 : -1);
    }
    box.addEventListener('wheel', wheel, { passive: false });
    function key(e) {
      var k = e.key; if (!/^Arrow(Left|Right|Up|Down)$/.test(k) || /input|textarea|select/i.test((e.target && e.target.tagName) || '') || (e.target && e.target.isContentEditable)) return;
      e.preventDefault(); var f = (k === 'ArrowRight' || k === 'ArrowDown') ? 1 : -1;
      if (m === 'wall') { var a = k === 'ArrowLeft' || k === 'ArrowRight'; ov2.x += a ? -f * 14 : 0; ov2.y += a ? 0 : -f * 14; return; }
      if (m === 'sphere') { if (k === 'ArrowLeft' || k === 'ArrowRight') sph.vy += -f * 0.04; else sph.vx += f * 0.04; return; }
      if (m === 'fan') sel = clamp(Math.round(sel) + f, 0, count - 1);
      else if (m === 'spiral') goal = Math.round(goal === null ? t : goal) + f;
      else goal = Math.round(goal === null ? sel : goal) + f;
    }
    document.addEventListener('keydown', key);
    return { destroy: function () { dead = true; cancelAnimationFrame(rafId); box.removeEventListener('pointermove', hoverMove); box.removeEventListener('pointerdown', down); box.removeEventListener('pointermove', move); box.removeEventListener('pointerup', up); box.removeEventListener('pointercancel', up); box.removeEventListener('wheel', wheel); document.removeEventListener('keydown', key); fr.remove(); det.remove(); }, fit: fit };
  }

  function setMode(m) { mode = m; document.body.classList.toggle('cm-on', m !== 'flow'); try { localStorage.setItem(KEY, m); } catch (e) {} sync(true); }
  function pick(it) {
    try { var b = MinestAI.board(); MinestImageViews.select(b.id, it.id, 'coverflow'); } catch (e) {}
  }
  function sync(force) {
    var slot = document.querySelector('.sf-slot[data-sf-view="coverflow"]'), on = slot && /(?:^|\s)mode-coverflow(?:\s|$)/.test(document.body.className) && slot.offsetWidth > 0;
    document.body.classList.toggle('cm-on', !!on && mode !== 'flow');
    if (!on) { if (eng) { eng.destroy(); eng = null; } if (ov) { ov.remove(); ov = null; } if (bar) { bar.remove(); bar = null; } sig = ''; return; }
    if (!bar || bar.parentNode !== slot) {
      if (bar) bar.remove();
      bar = document.createElement('div'); bar.id = 'cm-bar';
      MODES.forEach(function (x) { var b = document.createElement('button'); b.textContent = x[1]; b.dataset.m = x[0]; b.onclick = function (e) { e.stopPropagation(); setMode(x[0]); }; bar.appendChild(b); });
      var pl = document.createElement('button'); pl.className = 'pl'; pl.textContent = playing ? '❚❚' : '▶'; pl.title = 'Auto play';
      pl.onclick = function (e) { e.stopPropagation(); playing = !playing; pl.textContent = playing ? '❚❚' : '▶'; pl.classList.toggle('on', playing); };
      pl.classList.toggle('on', playing);
      var rg = document.createElement('input'); rg.type = 'range'; rg.min = .25; rg.max = 3; rg.step = .25; rg.value = speed; rg.title = 'Speed';
      rg.oninput = function () { speed = parseFloat(rg.value); try { localStorage.setItem('minest.coverSpeed', speed); } catch (e) {} };
      ['pointerdown', 'click'].forEach(function (ev) { rg.addEventListener(ev, function (e) { e.stopPropagation(); }); });
      bar.appendChild(pl); bar.appendChild(rg);
      slot.appendChild(bar);
    }
    [].forEach.call(bar.querySelectorAll('button[data-m]'), function (b) { b.classList.toggle('on', b.dataset.m === mode); });
    if (mode === 'flow') { if (eng) { eng.destroy(); eng = null; } if (ov) { ov.remove(); ov = null; } sig = ''; return; }
    var list = items(), s = mode + '|' + list.map(function (x) { return x.id + x.src; }).join(',');
    if (!force && eng && ov && ov.parentNode === slot && s === sig) return;
    if (eng) eng.destroy();
    if (ov) ov.remove();
    ov = document.createElement('div'); ov.id = 'cm-ov'; ov.className = mode; slot.insertBefore(ov, bar); sig = s;
    eng = list.length ? Engine(ov, list, mode, pick) : null;
  }
  addEventListener('resize', function () { if (eng) eng.fit(); });
  window.addEventListener('minest:image-assets', function () { sync(true); });
  setInterval(function () { try { sync(false); } catch (e) {} }, 700);
  window.MinestCoverModes = { play: function (v) { playing = v === undefined ? !playing : !!v; var b = bar && bar.querySelector('.pl'); if (b) { b.textContent = playing ? '❚❚' : '▶'; b.classList.toggle('on', playing); } }, speed: function (v) { speed = v; }, set: setMode, get: function () { return mode; } };
})();

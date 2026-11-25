/* Minest · 全息操作台 · 光锥 HUD — on top of cone.js: a swarm of little paper cards drifting round the cone, a list of
   "what happened around this time" on the right, a draggable timeline with a histogram along the bottom, and the year in
   large type. Loaded after cone.js. */
(function () {
  'use strict';
  var HL = window.HL, T = window.THREE, C = HL && HL.cone; if (!C) return;
  var NOW = 2030, U0 = Math.log10(NOW - 2026), U1 = Math.log10(NOW + 3300000);
  var depth = function (y) { return (Math.log10(NOW - Math.min(y, 2026)) - U0) / (U1 - U0); }, yearAt = function (d) { return NOW - Math.pow(10, U0 + d * (U1 - U0)); };
  function fy(y) { y = Math.round(y); if (y < -12000) { var a = 2026 - y; return a >= 1e6 ? (a / 1e6).toFixed(1) + ' 百万年前' : Math.round(a / 1e4) + ' 万年前'; } return y < 0 ? '前 ' + (-y) : String(y); }
  var st = document.createElement('style'); st.textContent =
    '#coneHud{position:fixed;inset:0;z-index:4;pointer-events:none;display:none;font-family:Georgia,"Songti SC",serif;color:#e9ddff}' +
    '#coneYear{position:absolute;right:26px;bottom:236px;font-size:64px;line-height:1;color:#c9a7ff;text-shadow:0 0 24px rgba(160,110,255,.6);text-align:right}#coneYear small{display:block;font-size:12px;letter-spacing:.2em;color:#9f8fc8;margin-top:4px}' +
    '#coneList{position:absolute;right:22px;top:150px;width:300px;max-height:44vh;overflow:hidden}#coneList h4{margin:0 0 8px;font-size:17px;font-style:italic;font-weight:400;color:#fff}' +
    '#coneList div{pointer-events:auto;cursor:pointer;margin:0 0 8px;padding-left:10px;border-left:2px solid var(--c);font-size:12.5px;line-height:1.5;color:#cfc4ea}#coneList div b{color:#fff;font-weight:400}#coneList div i{font-style:normal;color:#b58cff;margin-left:6px}#coneList div:hover b{color:#ffd96b}' +
    '#coneLine{position:absolute;left:8%;right:8%;bottom:176px;height:44px;pointer-events:auto;cursor:ew-resize}#coneLine canvas{position:absolute;inset:0;width:100%;height:100%}#coneLine u{position:absolute;top:0;bottom:8px;width:2px;background:#fff;box-shadow:0 0 10px #fff;text-decoration:none}#coneLine span{position:absolute;bottom:-12px;font-size:10px;color:#9f8fc8;transform:translateX(-50%);white-space:nowrap}' +
    '@media (max-width:760px){#coneList{display:none}#coneYear{font-size:40px}}';
  document.head.appendChild(st);
  var hud = document.createElement('div'); hud.id = 'coneHud'; hud.innerHTML = '<div id="coneList"></div><div id="coneYear"></div><div id="coneLine"><canvas width="1200" height="60"></canvas><u></u></div>'; document.body.appendChild(hud);
  var line = hud.querySelector('#coneLine'), knob = line.querySelector('u'), cv = line.querySelector('canvas');
  [[2026, '此刻'], [1900, '1900'], [1500, '1500'], [0, '公元元年'], [-10000, '1 万年前'], [-1000000, '100 万年前'], [-3300000, '330 万年前']].forEach(function (q) { var s = document.createElement('span'); s.textContent = q[1]; s.style.left = ((1 - depth(q[0])) * 100) + '%'; line.appendChild(s); });
  function hist() { var x = cv.getContext('2d'), n = 80, b = [], i; x.clearRect(0, 0, 1200, 60); for (i = 0; i < n; i++) b[i] = 0; C.ev.forEach(function (e) { if (C.vis(e)) b[Math.min(n - 1, Math.floor((1 - e.d) * n))]++; }); var mx = Math.max.apply(null, b) || 1; var g = x.createLinearGradient(0, 0, 1200, 0); g.addColorStop(0, '#ff6b8a'); g.addColorStop(.6, '#b58cff'); g.addColorStop(1, '#6fe3ff'); x.fillStyle = g; for (i = 0; i < n; i++) { var h = b[i] / mx * 42; x.fillRect(i * 15 + 1, 50 - h, 13, h + 2); } }
  var dragging = false; function setFrom(e) { var r = line.getBoundingClientRect(), u = Math.max(0, Math.min(1, (e.clientX - r.left) / r.width)); C.play = 0; C.sel = -1; var cd = document.getElementById('coneCard'); if (cd) cd.style.display = 'none'; C.d = 1 - u; }
  line.addEventListener('pointerdown', function (e) { e.stopPropagation(); dragging = true; setFrom(e); }); addEventListener('pointermove', function (e) { if (dragging) setFrom(e); }); addEventListener('pointerup', function () { dragging = false; });
  hud.querySelector('#coneList').addEventListener('pointerdown', function (e) { e.stopPropagation(); var d = e.target.closest('[data-i]'); if (d) C.select(+d.getAttribute('data-i')); });
  // paper cards drifting round the cone
  var sq; function sqTex() { if (sq) return sq; var c = document.createElement('canvas'); c.width = c.height = 32; var x = c.getContext('2d'); x.fillStyle = '#fff'; x.fillRect(5, 8, 22, 16); sq = new T.CanvasTexture(c); return sq; }
  var bits = null, N = 900, seed = [];
  function makeBits() { var P = new Float32Array(N * 3), K = new Float32Array(N * 3), i, col = new T.Color(); seed = []; for (i = 0; i < N; i++) { var d = Math.pow(Math.random(), 0.8), a = Math.random() * 6.283; seed.push([d, a, 0.75 + Math.random() * 0.6, 0.2 + Math.random() * 0.5, Math.random() * 6]); col.setHSL(0.78 + Math.random() * 0.14, 0.75, 0.5 + Math.random() * 0.25); K[i * 3] = col.r; K[i * 3 + 1] = col.g; K[i * 3 + 2] = col.b; }
    var g = new T.BufferGeometry(); g.setAttribute('position', new T.BufferAttribute(P, 3)); g.setAttribute('color', new T.BufferAttribute(K, 3)); bits = new T.Points(g, new T.PointsMaterial({ size: 0.06, map: sqTex(), vertexColors: true, transparent: true, opacity: 0.85, blending: T.AdditiveBlending, depthWrite: false })); C.root.add(bits); }
  var build0 = C.build, enter0 = C.enter, exit0 = C.exit, update0 = C.update, lastKey = '';
  C.build = function () { build0.apply(C, arguments); makeBits(); hist(); lastKey = ''; };
  C.enter = function () { enter0.apply(C, arguments); hud.style.display = 'block'; };
  C.exit = function () { hud.style.display = 'none'; bits = null; exit0.apply(C, arguments); };
  C.update = function (dt, t) { update0.apply(C, arguments); if (!C.root || !bits) return;
    var p = bits.geometry.attributes.position.array, i; for (i = 0; i < N; i++) { var s = seed[i], a = s[1] + HL.now * s[3] * 0.25, r = (0.1 + s[0] * 1.75) * s[2], lit = s[0] >= C.d ? 1 : 0.25; p[i * 3] = Math.cos(a) * r; p[i * 3 + 1] = 3.25 - s[0] * 2.05 + Math.sin(HL.now * 0.7 + s[4]) * 0.03; p[i * 3 + 2] = Math.sin(a) * r * lit + (1 - lit) * Math.sin(a) * r; }
    bits.geometry.attributes.position.needsUpdate = true; bits.material.opacity = 0.55 + 0.3 * Math.sin(HL.now * 0.8);
    var y = yearAt(C.d); knob.style.left = ((1 - C.d) * 100) + '%'; hud.querySelector('#coneYear').innerHTML = fy(y) + '<small>' + (C.dom < 0 ? 'ALL DOMAINS' : C.dom === 8 ? '思想者' : HL.TECH_DOMAINS[C.dom][0]) + '</small>';
    var near = C.ev.map(function (e, i) { return [Math.abs(e.d - C.d), i]; }).filter(function (q) { return C.vis(C.ev[q[1]]); }).sort(function (a, b) { return a[0] - b[0]; }).slice(0, 5).map(function (q) { return q[1]; }).sort(function (a, b) { return a - b; }), key = near.join() + C.dom;
    if (key !== lastKey) { lastKey = key; hist(); var box = hud.querySelector('#coneList'); box.innerHTML = '<h4></h4>'; box.firstChild.textContent = '在 ' + fy(y) + ' 前后'; near.forEach(function (i) { var e = C.ev[i], d = document.createElement('div'); d.setAttribute('data-i', i); d.style.setProperty('--c', e.dom === 8 ? '#fff' : HL.TECH_DOMAINS[e.dom][1]); d.innerHTML = '<b></b><i></i><br>'; d.querySelector('b').textContent = e.title; d.querySelector('i').textContent = fy(e.year); d.appendChild(document.createTextNode((e.note || '').slice(0, 46) + ((e.note || '').length > 46 ? '…' : ''))); box.appendChild(d); }); } };
})();

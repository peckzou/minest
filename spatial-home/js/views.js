/* Minest · Spatial Home — the view out of the window, chosen per room (2026-11-13).
   'auto' keeps the room's own outside (Santorini's village, Manhattan's skyline, the train's line…). Any other view puts
   one painted panorama on a sphere that encloses the whole room, so through every window — and only there, the walls
   hide the rest — you see the sea, a lake, the aurora… The room's own far scenery is still there behind it, just covered.
   Panoramas are painted here on a canvas (equirectangular, horizon at eye level): no downloads, nothing copied. */
(function (root) {
  'use strict';
  var THREE = root.THREE;
  var LIST = [
    { id: 'auto', icon: '🏠', zh: '跟随环境', en: 'The room\'s own view' },
    { id: 'sea', icon: '🌊', zh: '海景 · 爱琴海', en: 'Sea' },
    { id: 'lake', icon: '🏞️', zh: '湖景 · 雪山湖', en: 'Lake' },
    { id: 'aurora', icon: '🌌', zh: '极光 · 冰湖', en: 'Aurora' },
    { id: 'snow', icon: '🏔️', zh: '雪山 · 草甸', en: 'Snow peaks' },
    { id: 'city', icon: '🌃', zh: '城市夜景', en: 'City at night' },
    { id: 'sakura', icon: '🌸', zh: '樱花 · 春湖', en: 'Cherry blossom' }
  ];
  var W = 2048, H = 1024, HZ = H / 2;
  function rng(seed) { var s = seed >>> 0; return function () { s = (s * 1664525 + 1013904223) >>> 0; return s / 4294967296; }; }
  function grad(x, y0, y1, stops) { var g = x.createLinearGradient(0, y0, 0, y1); stops.forEach(function (s) { g.addColorStop(s[0], s[1]); }); return g; }
  /** a ridge line across the whole panorama (wraps), filled down to `base` */
  function ridge(x, r, y, amp, rough, fill, base, wraps) {
    var pts = [], n = 64, k, ph = r() * 6.28, ph2 = r() * 6.28;
    for (k = 0; k <= n; k++) { var t = k / n * Math.PI * 2 * (wraps || 3); pts.push(y - amp * (0.55 * Math.sin(t + ph) + 0.3 * Math.sin(t * 2.3 + ph2) + rough * (r() - 0.5))); }
    x.beginPath(); x.moveTo(0, base); for (k = 0; k <= n; k++) x.lineTo(k / n * W, pts[k]); x.lineTo(W, base); x.closePath(); x.fillStyle = fill; x.fill(); return pts;
  }
  function peaks(x, r, y, count, hMin, hMax, rock, snow) {
    for (var i = 0; i < count; i++) {
      var cx = r() * W, w = 140 + r() * 260, h = hMin + r() * (hMax - hMin);
      for (var dx = -W; dx <= W; dx += W) {
        var px = cx + dx; x.beginPath(); x.moveTo(px - w, y); x.lineTo(px - w * 0.15, y - h * 0.92); x.lineTo(px, y - h); x.lineTo(px + w * 0.2, y - h * 0.9); x.lineTo(px + w, y); x.closePath(); x.fillStyle = rock; x.fill();
        if (snow) { x.beginPath(); x.moveTo(px - w * 0.36, y - h * 0.62); x.lineTo(px - w * 0.15, y - h * 0.92); x.lineTo(px, y - h); x.lineTo(px + w * 0.2, y - h * 0.9); x.lineTo(px + w * 0.4, y - h * 0.6); x.lineTo(px + w * 0.12, y - h * 0.7); x.lineTo(px - w * 0.05, y - h * 0.58); x.lineTo(px - w * 0.2, y - h * 0.68); x.closePath(); x.fillStyle = snow; x.fill(); }
      }
    }
  }
  function pines(x, r, y, n, col, hMin, hMax) { x.fillStyle = col; for (var i = 0; i < n; i++) { var px = r() * W, h = hMin + r() * (hMax - hMin), w = h * 0.32; x.beginPath(); x.moveTo(px, y - h); x.lineTo(px + w, y + 2); x.lineTo(px - w, y + 2); x.closePath(); x.fill(); } }
  function stars(x, r, n, y1) { for (var i = 0; i < n; i++) { var a = 0.3 + r() * 0.7; x.fillStyle = 'rgba(255,255,255,' + a + ')'; var s = r() < 0.06 ? 2.2 : 1.1; x.fillRect(r() * W, r() * y1, s, s); } }
  function mirror(x, from, to, alpha, tint) {           // the lake: the band above the horizon, flipped below it
    x.save(); x.globalAlpha = alpha; x.translate(0, HZ * 2); x.scale(1, -1); x.drawImage(x.canvas, 0, from, W, HZ - from, 0, from, W, HZ - from); x.restore();
    x.fillStyle = tint; x.fillRect(0, HZ, W, to - HZ);
    x.strokeStyle = 'rgba(255,255,255,0.08)'; x.lineWidth = 1; for (var y = HZ + 4; y < to; y += 6) { x.beginPath(); x.moveTo(0, y); x.lineTo(W, y); x.stroke(); }
  }
  var PAINT = {
    sea: function (x, r) {
      x.fillStyle = grad(x, 0, HZ, [[0, '#2f74c4'], [0.55, '#78b6e8'], [1, '#d8ecf7']]); x.fillRect(0, 0, W, HZ);
      var sx = W * 0.62, sy = HZ - 170, g = x.createRadialGradient(sx, sy, 10, sx, sy, 260); g.addColorStop(0, 'rgba(255,250,225,1)'); g.addColorStop(0.12, 'rgba(255,244,200,0.85)'); g.addColorStop(1, 'rgba(255,240,200,0)'); x.fillStyle = g; x.fillRect(0, 0, W, HZ);
      for (var i = 0; i < 14; i++) { var cx = r() * W, cy = 80 + r() * 260, cw = 120 + r() * 220; x.fillStyle = 'rgba(255,255,255,' + (0.35 + r() * 0.35) + ')'; for (var j = 0; j < 6; j++) { x.beginPath(); x.ellipse(cx + (j - 3) * cw * 0.18, cy + r() * 14, cw * (0.18 + r() * 0.12), 16 + r() * 14, 0, 0, 6.3); x.fill(); } }
      x.fillStyle = 'rgba(120,150,175,0.85)'; [[0.15, 60, 420], [0.4, 34, 260], [0.86, 48, 360]].forEach(function (s) { x.beginPath(); x.ellipse(W * s[0], HZ, s[2] / 2, s[1], 0, Math.PI, 0); x.fill(); });
      x.fillStyle = grad(x, HZ, H, [[0, '#3b86c0'], [0.25, '#1f5f9b'], [1, '#0b2f5a']]); x.fillRect(0, HZ, W, HZ);
      for (i = 0; i < 2600; i++) { var px = r() * W, py = HZ + Math.pow(r(), 1.6) * HZ, near = Math.abs(px - sx) < 160 + (py - HZ) * 0.6; x.fillStyle = 'rgba(255,255,255,' + (near ? 0.55 : 0.12) * (1 - (py - HZ) / HZ * 0.6) + ')'; x.fillRect(px, py, 6 + r() * 18, 1.5); }
    },
    lake: function (x, r) {
      x.fillStyle = grad(x, 0, HZ, [[0, '#5d97cf'], [1, '#e3eef5']]); x.fillRect(0, 0, W, HZ);
      peaks(x, r, HZ - 30, 9, 140, 300, '#8796ab', '#f4f7fa');
      ridge(x, r, HZ - 60, 40, 0.5, '#5e7a6a', HZ - 10, 4);
      pines(x, r, HZ - 8, 420, '#22402f', 18, 48);
      x.fillStyle = '#2c4a37'; x.fillRect(0, HZ - 10, W, 10);
      mirror(x, 120, H, 0.55, 'rgba(40,90,120,0.45)');
      x.fillStyle = grad(x, HZ, H, [[0, 'rgba(0,0,0,0)'], [1, 'rgba(10,40,60,0.6)']]); x.fillRect(0, HZ, W, HZ);
    },
    aurora: function (x, r) {
      x.fillStyle = grad(x, 0, HZ, [[0, '#02040c'], [0.6, '#06142a'], [1, '#0d2a3a']]); x.fillRect(0, 0, W, HZ);
      stars(x, r, 1400, HZ - 20);
      x.globalCompositeOperation = 'lighter';
      for (var b = 0; b < 4; b++) {
        var y0 = 230 + b * 55 + r() * 30, amp = 50 + r() * 70, ph = r() * 6.3, hue = b === 3 ? 'rgba(180,90,255,' : 'rgba(70,255,150,';
        for (var px = 0; px < W; px += 3) {
          var y = y0 + amp * Math.sin(px / W * Math.PI * 2 * (2 + b) + ph) + 20 * Math.sin(px / 61 + b), h = 140 + 90 * Math.sin(px / 173 + ph * 2) ;
          var g = x.createLinearGradient(0, y - h, 0, y + 10); g.addColorStop(0, hue + '0)'); g.addColorStop(0.65, hue + (0.16 + 0.12 * Math.sin(px / 37 + b)) + ')'); g.addColorStop(1, hue + '0.5)');
          x.fillStyle = g; x.fillRect(px, y - h, 3, h + 10);
        }
      }
      x.globalCompositeOperation = 'source-over';
      ridge(x, r, HZ - 30, 26, 0.6, '#0b1620', HZ, 3);
      peaks(x, r, HZ - 6, 7, 40, 95, '#121e2a', '#5f7286');
      pines(x, r, HZ - 2, 260, '#05090d', 14, 34);
      mirror(x, 60, H, 0.6, 'rgba(8,22,32,0.5)');
    },
    snow: function (x, r) {
      x.fillStyle = grad(x, 0, HZ, [[0, '#1f6fd0'], [0.7, '#8ec3f0'], [1, '#e6f1f8']]); x.fillRect(0, 0, W, HZ);
      peaks(x, r, HZ - 20, 7, 260, 420, '#7c8aa0', '#ffffff');
      peaks(x, r, HZ - 10, 8, 120, 220, '#6b7d72', '#eef3f6');
      ridge(x, r, HZ - 30, 30, 0.4, '#5f8a4a', HZ + 30, 5);
      pines(x, r, HZ - 20, 300, '#1f3a22', 20, 54);
      x.fillStyle = grad(x, HZ - 20, H, [[0, '#6f9a4e'], [0.4, '#4f7a38'], [1, '#2b4a20']]); x.fillRect(0, HZ - 20, W, H - HZ + 20);
      for (var i = 0; i < 900; i++) { x.fillStyle = ['#f6e27a', '#ffffff', '#c79bf2', '#f29bb5'][i % 4]; x.fillRect(r() * W, HZ + r() * HZ * 0.8, 3, 3); }
    },
    city: function (x, r) {
      x.fillStyle = grad(x, 0, HZ, [[0, '#0a0f2a'], [0.6, '#2a2552'], [1, '#c96a52']]); x.fillRect(0, 0, W, HZ);
      stars(x, r, 260, HZ - 200);
      for (var layer = 0; layer < 3; layer++) {
        var base = HZ + 4, col = ['#3a3a5a', '#24243a', '#121220'][layer], px = 0;
        while (px < W) {
          var bw = 30 + r() * (70 - layer * 10), bh = 60 + r() * (layer === 2 ? 260 : 180) + (r() < 0.06 ? 160 : 0);
          x.fillStyle = col; x.fillRect(px, base - bh, bw, bh + 4);
          if (layer > 0) for (var wy = base - bh + 8; wy < base - 4; wy += 9) for (var wx = px + 4; wx < px + bw - 4; wx += 7) if (r() < 0.38) { x.fillStyle = r() < 0.8 ? 'rgba(255,214,140,' + (0.5 + r() * 0.5) + ')' : 'rgba(170,210,255,0.8)'; x.fillRect(wx, wy, 3, 4); }
          if (r() < 0.05) { x.fillStyle = '#ff3b3b'; x.fillRect(px + bw / 2 - 1, base - bh - 10, 3, 10); }
          px += bw + (layer === 2 ? 2 : 6);
        }
      }
      x.fillStyle = '#05060c'; x.fillRect(0, HZ + 4, W, HZ);
      for (var i = 0; i < 1800; i++) { var lx = r() * W, ly = HZ + 8 + Math.pow(r(), 1.5) * HZ * 0.8; x.fillStyle = r() < 0.7 ? 'rgba(255,200,120,' + (0.15 + r() * 0.35) + ')' : 'rgba(150,200,255,0.3)'; x.fillRect(lx, ly, 2 + r() * 10, 1.5); }
    },
    sakura: function (x, r) {
      x.fillStyle = grad(x, 0, HZ, [[0, '#8fb8e8'], [0.7, '#f3d7e6'], [1, '#fbeef2']]); x.fillRect(0, 0, W, HZ);
      for (var dx = -W; dx <= W; dx += W) {             // one tall cone volcano with a snow cap
        var cx = W * 0.35 + dx, y = HZ - 20; x.fillStyle = '#7f8db0'; x.beginPath(); x.moveTo(cx - 520, y); x.lineTo(cx - 70, y - 330); x.lineTo(cx + 70, y - 330); x.lineTo(cx + 520, y); x.fill();
        x.fillStyle = '#ffffff'; x.beginPath(); x.moveTo(cx - 70, y - 330); x.lineTo(cx + 70, y - 330); x.lineTo(cx + 170, y - 210); x.lineTo(cx + 90, y - 230); x.lineTo(cx + 30, y - 200); x.lineTo(cx - 40, y - 235); x.lineTo(cx - 120, y - 205); x.closePath(); x.fill();
      }
      ridge(x, r, HZ - 24, 18, 0.5, '#6f8a76', HZ, 5);
      mirror(x, 150, H, 0.5, 'rgba(120,150,190,0.35)');
      for (var i = 0; i < 46; i++) {                    // cherry trees along the near shore
        var tx = r() * W, ty = HZ + 40 + r() * 30, s = 40 + r() * 50;
        x.fillStyle = '#4a3328'; x.fillRect(tx - 3, ty - s * 0.4, 6, s * 0.7);
        for (var j = 0; j < 14; j++) { x.fillStyle = ['#f7b6c8', '#f39ab4', '#fbd3df'][j % 3]; x.beginPath(); x.arc(tx + (r() - 0.5) * s * 1.4, ty - s * 0.5 - r() * s * 0.6, s * (0.18 + r() * 0.16), 0, 6.3); x.fill(); }
      }
      x.fillStyle = '#5d7d4c'; x.fillRect(0, HZ + 64, W, H); for (i = 0; i < 1500; i++) { x.fillStyle = 'rgba(247,182,200,0.7)'; x.fillRect(r() * W, HZ + 64 + r() * HZ, 3, 2); }
    }
  };
  var cache = {}, sphere = null, mat = null, curId = 'auto', scroll = 0;
  function texture(id) {
    if (cache[id]) return cache[id];
    var c = document.createElement('canvas'); c.width = W; c.height = H; var x = c.getContext('2d');
    PAINT[id](x, rng(id.length * 7919 + 17));
    var t = new THREE.CanvasTexture(c); t.encoding = THREE.sRGBEncoding; t.wrapS = THREE.RepeatWrapping; t.anisotropy = 4;
    return (cache[id] = t);
  }
  /** show view `id` round `room` in `scene` (or the room's own view for 'auto') */
  function apply(scene, room, id) {
    curId = PAINT[id] ? id : 'auto';
    ((room && room.backdrop) || []).forEach(function (m) { m.visible = curId === 'auto'; });   // a room's own near backdrop (the Study's sky plane) would cover the view
    if (curId === 'auto') { if (sphere) sphere.visible = false; return curId; }
    if (!sphere) {
      mat = new THREE.MeshBasicMaterial({ side: THREE.BackSide, fog: false, toneMapped: false, depthWrite: true });
      sphere = new THREE.Mesh(new THREE.SphereGeometry(1, 64, 32), mat); sphere.name = 'window-view'; sphere.renderOrder = -1;
    }
    if (sphere.parent !== scene) scene.add(sphere);
    var s = room && room.size || { W: 3, D: 2.5 }, R = Math.max(9, Math.hypot(s.W || 3, s.D || 2.5) + 4.5), cx = 0, cz = 0, b = room && room.bounds;
    if (b) { cx = (b[0] + b[2]) / 2; cz = (b[1] + b[3]) / 2; R = Math.max(R, Math.hypot((b[2] - b[0]) / 2, (b[3] - b[1]) / 2) + 6); }   // a big room (the Study, the King's Hall): round all of it, so it shows only through the windows
    sphere.scale.setScalar(R); sphere.position.set(cx, 1.5, cz); sphere.rotation.y = 0;
    mat.map = texture(curId); mat.needsUpdate = true; sphere.visible = true; scroll = 0;
    return curId;
  }
  /** each frame: the train's view slides past; the aurora drifts very slowly */
  function tick(t, dt, room) {
    if (!sphere || !sphere.visible || !mat.map) return;
    if (room && room.envId === 'train') { scroll += (dt || 0.016) * 0.012; mat.map.offset.x = scroll % 1; }
    else if (curId === 'aurora') mat.map.offset.x = (t * 0.0015) % 1; else mat.map.offset.x = 0;
  }
  root.SpatialViews = { list: function () { return LIST.slice(); }, apply: apply, tick: tick, current: function () { return curId; }, version: '1.0' };
})(window);

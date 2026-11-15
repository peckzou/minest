/* Clun · 程序贴图（canvas 画的，风格化，不是照片）。每张贴图记下它在墙上覆盖多少米（w × h），几何体的贴图坐标单位是米。 */
(function () {
  'use strict';
  var C = window.Clun = window.Clun || {};
  var seed = 7;
  function rnd() { seed = (seed * 16807) % 2147483647; return seed / 2147483647; }
  function shade(hex, k) {            /* k: −1..1 变暗 / 变亮 */
    var r = (hex >> 16) & 255, g = (hex >> 8) & 255, b = hex & 255;
    function f(v) { return Math.max(0, Math.min(255, Math.round(k < 0 ? v * (1 + k) : v + (255 - v) * k))); }
    return 'rgb(' + f(r) + ',' + f(g) + ',' + f(b) + ')';
  }
  function tex(cv, w, h) {
    var t = new THREE.CanvasTexture(cv); t.wrapS = t.wrapT = THREE.RepeatWrapping; t.encoding = THREE.sRGBEncoding; t.anisotropy = 8;
    t.repeat.set(1 / w, 1 / h); return t;
  }
  function canvas(px, py) { var c = document.createElement('canvas'); c.width = px; c.height = py; return c; }

  /* 砖墙。rows = 自下而上每一皮的类型：'b' 砖、's' 石（长块）。cols = 每皮几块砖。 */
  function courses(rows, cols, brick, stone, mortar, w, h) {
    var cv = canvas(512, 512), g = cv.getContext('2d'), ch = 512 / rows.length, bw = 512 / cols, r, i;
    g.fillStyle = mortar; g.fillRect(0, 0, 512, 512);
    for (r = 0; r < rows.length; r++) {
      var y = 512 - (r + 1) * ch, st = rows[r] === 's', n = st ? cols / 2 : cols, ww = st ? bw * 2 : bw, off = (r % 2) * ww / 2;
      for (i = -1; i < n; i++) {
        g.fillStyle = shade(st ? stone : brick, (rnd() - 0.5) * (st ? 0.1 : 0.22));
        g.fillRect(Math.round(i * ww + off) + 1, Math.round(y) + 1, Math.round(ww) - 2, Math.round(ch) - 2);
      }
    }
    return tex(cv, w, h);
  }
  /* 屋瓦 / 挂瓦。rows 每一排：'p' 平瓦、'f' 鱼鳞瓦（圆弧下缘）；pal[type] = 颜色 */
  function tiles(rows, cols, pal, back, w, h, moss) {
    var cv = canvas(512, 512), g = cv.getContext('2d'), ch = 512 / rows.length, tw = 512 / cols, r, i;
    g.fillStyle = back; g.fillRect(0, 0, 512, 512);
    for (r = 0; r < rows.length; r++) {
      var y = 512 - (r + 1) * ch, off = (r % 2) * tw / 2, ty = rows[r];
      for (i = -1; i < cols; i++) {
        var k = (rnd() - 0.5) * 0.18, x = i * tw + off;
        g.fillStyle = (moss && rnd() < moss) ? shade(0x6f6a4c, k) : shade(pal[ty], k);
        if (ty === 'f') { g.beginPath(); g.moveTo(x + 1, y); g.lineTo(x + 1, y + ch * 0.45); g.arc(x + tw / 2, y + ch * 0.45, tw / 2 - 1, Math.PI, 0, true); g.lineTo(x + tw - 1, y); g.closePath(); g.fill(); }
        else g.fillRect(Math.round(x) + 1, Math.round(y), Math.round(tw) - 2, Math.round(ch) - 2);
      }
      g.fillStyle = 'rgba(0,0,0,0.16)'; g.fillRect(0, Math.round(y + ch) - 3, 512, 3);      /* 下缘的影子 */
    }
    return tex(cv, w, h);
  }
  /* 木地板：长短不一的窄条，错缝 */
  function boards(w, h) {
    var cv = canvas(512, 512), g = cv.getContext('2d'), rows = 8, ch = 512 / rows, r;
    g.fillStyle = '#6e4a2c'; g.fillRect(0, 0, 512, 512);
    for (r = 0; r < rows; r++) {
      var x = -rnd() * 200;
      while (x < 512) {
        var len = 120 + rnd() * 220;
        g.fillStyle = shade(0xb08458, (rnd() - 0.5) * 0.22); g.fillRect(Math.round(x) + 1, r * ch + 1, Math.round(len) - 2, ch - 2);
        x += len;
      }
    }
    return tex(cv, w, h);
  }
  function rep(s, n) { var a = []; for (var i = 0; i < n; i++) a.push(s); return a; }

  C.makeTextures = function () {
    seed = 7;
    var BR = 0xbf5530, BR2 = 0xb04a2c, ST = 0xd2aa5f, MO = '#d3b77c';
    return {
      /* 正面 / 侧面：红砖和浅色石带大致等宽交替（四皮砖、四皮石，每皮 75 mm） */
      band: courses(rep('b', 4).concat(rep('s', 4), rep('b', 4), rep('s', 4)), 6, BR, ST, MO, 1.35, 1.2),
      /* 背面：红砖为主，每 0.75 m 一道细浅色带 */
      rear: courses(['s'].concat(rep('b', 9), ['s'], rep('b', 9)), 6, BR2, 0xead9b6, '#d9b48c', 1.35, 1.5),
      brick: courses(rep('b', 16), 6, BR2, ST, '#d2a781', 1.35, 1.2),
      roof: tiles(rep('p', 8), 8, { p: 0x664438 }, '#3a2620', 1.36, 1.12, 0),
      hung: tiles(['p', 'p', 'p', 'f', 'f', 'p', 'p', 'p', 'f', 'f'], 8, { p: 0xcf5d30, f: 0xa9432a }, '#6e2c1c', 1.36, 1.1, 0),
      boards: boards(2.4, 1.2),
      floorTile: tiles(rep('p', 6), 6, { p: 0xa5482f }, '#5c2a1c', 0.9, 0.9, 0)
    };
  };
})();

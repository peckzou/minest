/* Clun · 外景（交付图版）：用户给的交付效果图整张做底图，最大程度保留原场景；只把图里原来那栋房子换成 Clun，缩小到原来的 75%。
   1) 在画布上抹掉原房子：房顶上方的山向下镜像延伸，房身那一带用它右边那条山林和村庄镜像拼接；门前的花丛和台阶不动。
   2) 补好的图做一遍绘画化（和 3D 房子的卡通光照统一），作为固定机位的底图。
   3) 3D 房子按底图的透视放：门对准原来的门（台阶从那里下去），朝向和原房子一样露出左侧山墙，大小是原房子的 75%。
   底图坐标：原图像素（2576 × 1438）。 */
(function () {
  'use strict';
  var C = window.Clun = window.Clun || {};
  var D2R = Math.PI / 180;
  var PL = C.PLATE = {
    img: 'art/delivery-plate.jpg', W: 2576, H: 1438,
    hfov: 60,                      /* 底图的水平视角（假定） */
    horizon: 0.65,                 /* 地平线在底图里的高度（从上往下的比例），由原房子的屋檐线和墙脚线汇聚估出 */
    door: [868, 1022],             /* 原房子门的底边 */
    top: 452,                      /* 原房子最高点（左烟囱顶） */
    scale: 0.75,                   /* 新房子相对原房子的大小（按高度：门底到烟囱顶） */
    turn: 30,                      /* 正面比正对镜头多转的角度（露出左侧山墙） */
    /* 原房子的轮廓（要抹掉的范围）。底边在门前花丛处抬高，花丛和台阶保留 */
    mask: [[425, 1040], [425, 730], [488, 556], [494, 446], [582, 446], [582, 548], [962, 552], [965, 552], [1040, 552], [1044, 664], [1118, 730], [1162, 730],
      [1172, 780], [1210, 836], [1284, 924], [1284, 1044], [1142, 1044], [1142, 1012], [808, 1012], [808, 1046]],
    path: [[300, 990], [830, 990], [830, 1112], [300, 1112]],
    ladders: [[[108, 662], [198, 744], [132, 1168], [22, 1118]], [[160, 784], [232, 784], [322, 1154], [222, 1168]]],   /* 原图树屋的两架木梯：抹掉，换成一条绳梯 */
    rope: [332, 808, 1152],                     /* 绳梯：挂在平台右端前沿（x, 平台底 y），下面地面 y */
    walkOut: [[262, 1110], [420, 1060], [600, 1035], [790, 1032], [880, 1060], [835, 1130], [870, 1200], [930, 1270], [985, 1340], [1045, 1420], [760, 1428], [520, 1390], [330, 1320], [255, 1210]],   /* 右边沿着小路栏杆的内侧（不站到栏杆外面） */   /* 屋外能走的范围：门前、左边草坪和石板路 */
    walkBank: [[1690, 1205], [1820, 1120], [2120, 1150], [2420, 1230], [2555, 1330], [2555, 1430], [1720, 1430], [1700, 1330]],   /* 小溪对岸：石桌那片草坡 */
    hops: [[1010, 1405], [1215, 1428], [1365, 1338], [1555, 1318], [1745, 1315]],   /* 从小路尽头跳过栏杆，经溪里的石头到对岸 */   /* 踩着溪里的石头过溪（两头在两边草地上） */
    waterSpots: [[1760, 1290, 1610, 1300], [1800, 1395, 1650, 1410]],   /* 玩水：小人站的地方 → 水面的点 */
    fence: [[1962, 1080], [2000, 1080], [2012, 1190], [2018, 1300], [2020, 1438], [1680, 1438], [1680, 1395], [1730, 1360], [1870, 1205]],   /* 石桌边沿河那道木栅栏和它的影子：铺成草地 */          /* 房前那条土路：铺成草地 */
    bush: { rect: [322, 790, 560, 1046], src: [200, 70, 420, 420] },    /* 房子左前方一丛树叶（取自左上大树的叶子），挡住左端 */
    /* 动画区域（底图像素） */
    fall: [[1973, 52], [1999, 52], [1986, 320], [1967, 540], [1948, 705], [1890, 705], [1922, 540], [1946, 320]],
    fallMist: [1918, 700, 95],
    river: [[1665, 1022], [1855, 1022], [1862, 1110], [1832, 1170], [1768, 1230], [1698, 1290], [1628, 1350], [1560, 1400], [1505, 1438],
      [1198, 1438], [1218, 1368], [1280, 1318], [1380, 1268], [1488, 1218], [1578, 1168], [1628, 1108]],
    bridge: [1760, 1018],
    /* 小溪收窄：右岸往里推，原来的水面铺成向下的缓草坡（这一圈点 = 新岸线 + 原来右岸外的草地） */
    bank: [[1855, 1030], [1862, 1110], [1832, 1170], [1768, 1230], [1698, 1290], [1628, 1350], [1560, 1400], [1505, 1438], [1760, 1438], [1800, 1330], [1860, 1230], [1885, 1120], [1880, 1030]],
    rocks: [[1585, 1175, 15], [1468, 1248, 21], [1555, 1318, 18], [1365, 1338, 27], [1440, 1410, 31]],   /* 溪里的石头：中心 x, y, 半径（像素） */
    walk: [[760, 1330], [985, 1222]],   /* 小旅人来回走的石板路两端（近景） */
    table: [[1985, 1405], [2095, 1392]], /* 远景里小旅人的位置：石桌左前方的草地 */
    heroScale: 0.72,                     /* 小旅人整体缩小 */
    mound: { h: 0.35, reach: 4.5, sample: 28 },   /* 小山丘：墙根处比房子地面高 0.35 m，向外 4.5 m 落到草地；颜色取下方 70 像素处的草 */
    pathDrop: 0.45                      /* 小路比房子台地低多少（米） */
  };

  /* 动画遮罩：R = 瀑布，G = 小溪，B = 瀑布底的水雾 */
  function makeFlowMask() {
    var f = 4, cv = document.createElement('canvas'); cv.width = Math.round(PL.W / f); cv.height = Math.round(PL.H / f); var g = cv.getContext('2d');
    g.fillStyle = '#000'; g.fillRect(0, 0, cv.width, cv.height); g.globalCompositeOperation = 'lighter';
    function poly(pts, col) { g.fillStyle = col; g.beginPath(); pts.forEach(function (p, i) { if (i) g.lineTo(p[0] / f, p[1] / f); else g.moveTo(p[0] / f, p[1] / f); }); g.closePath(); g.fill(); }
    poly(PL.fall, 'rgb(255,0,0)'); poly(PL.river, 'rgb(0,255,0)');
    g.globalCompositeOperation = 'source-over'; g.fillStyle = 'rgb(0,0,0)';
    PL.rocks.forEach(function (r) { g.beginPath(); g.ellipse(r[0] / f, r[1] / f, r[2] * 0.95 / f, r[2] * 0.7 / f, 0, 0, Math.PI * 2); g.fill(); });
    g.globalCompositeOperation = 'lighter';
    var m = PL.fallMist, gr = g.createRadialGradient(m[0] / f, m[1] / f, 0, m[0] / f, m[1] / f, m[2] / f); gr.addColorStop(0, 'rgba(0,0,255,1)'); gr.addColorStop(1, 'rgba(0,0,255,0)');
    g.fillStyle = gr; g.fillRect(0, 0, cv.width, cv.height);
    var t = new THREE.CanvasTexture(cv); t.minFilter = t.magFilter = THREE.LinearFilter; t.generateMipmaps = false; return t;
  }
  /* 底图材质：瀑布往下冲、小溪从桥下往镜头这边流（流动贴图：两相位交替采样，画面不会被越拉越远）、瀑布底水雾、云慢慢漂 */
  function backMaterial() {
    return new THREE.ShaderMaterial({ depthWrite: false,
      uniforms: { map: { value: null }, mk: { value: makeFlowMask() }, uTime: C.Paint.time, uRocks: { value: PL.rocks.map(function (r) { return new THREE.Vector4(r[0] / PL.W, 1 - r[1] / PL.H, r[2] / PL.H, 0); }) }, uBridge: { value: new THREE.Vector2(PL.bridge[0] / PL.W, 1 - PL.bridge[1] / PL.H) }, uAsp: { value: PL.W / PL.H } },
      vertexShader: 'varying vec2 vUv; void main(){ vUv = uv; gl_Position = projectionMatrix * modelViewMatrix * vec4(position, 1.0); }',
      fragmentShader: [
        'uniform sampler2D map, mk; uniform float uTime, uAsp; uniform vec2 uBridge; uniform vec4 uRocks[5]; varying vec2 vUv;',
        'float h2(vec2 p){ return fract(sin(dot(p, vec2(127.1, 311.7))) * 43758.5453); }',
        'float vn(vec2 p){ vec2 i = floor(p), f = fract(p); f = f * f * (3.0 - 2.0 * f); return mix(mix(h2(i), h2(i + vec2(1.0, 0.0)), f.x), mix(h2(i + vec2(0.0, 1.0)), h2(i + vec2(1.0, 1.0)), f.x), f.y); }',
        'float fbm(vec2 p){ float s = 0.0, a = 0.5; for (int i = 0; i < 4; i++) { s += a * vn(p); p *= 2.03; a *= 0.5; } return s; }',
        'vec3 flowSample(vec2 uv, vec2 v, float rate){',                           /* 沿 v 流动：两相位交替，每相位从 -0.5v 滑到 +0.5v */
        '  float p0 = fract(uTime * rate), p1 = fract(uTime * rate + 0.5);',
        '  vec3 a = texture2D(map, uv - v * (p0 - 0.5)).rgb, b = texture2D(map, uv - v * (p1 - 0.5)).rgb;',
        '  return mix(a, b, abs(p0 - 0.5) * 2.0);',
        '}',
        'void main(){',
        '  vec4 m = texture2D(mk, vUv); vec3 c = texture2D(map, vUv).rgb;',
        '  if (m.g > 0.003) {',                                                     /* 小溪 */
        '    vec2 d = vUv - uBridge; d.x *= uAsp; float r = length(d); vec2 dir = normalize(d); dir.x /= uAsp;',
        '    vec3 w = flowSample(vUv, dir * (0.006 + r * 0.03), 0.45);',
        '    vec2 q = vec2(atan(d.y, d.x) * 34.0, r * 55.0 - uTime * 2.2);',                  /* 横向 = 绕桥的角度，纵向 = 离桥的距离，白浪往镜头这边漂 */
        '    float foam = smoothstep(0.58, 0.82, fbm(q * vec2(1.0, 0.35)));',
        '    w = mix(w, vec3(0.96, 0.99, 1.0), foam * 0.45 * smoothstep(0.55, 0.85, dot(w, vec3(0.33))));',   /* 白浪只加在本来就亮的水面上 */
        '    float sp = 0.0;',                                                       /* 石头：上游一侧水堆起来翻白，下游拖一条白色的尾流 */
        '    for (int i = 0; i < 5; i++) {',
        '      vec2 e = vUv - uRocks[i].xy; e.x *= uAsp; float R = uRocks[i].z, dl = length(e / vec2(1.0, 0.72));',
        '      float along = dot(e, normalize(vec2(dir.x * uAsp, dir.y))), across = abs(dot(e, normalize(vec2(-dir.y, dir.x * uAsp))));',
        '      float n = fbm(vec2(atan(e.y, e.x) * 3.0, dl / R * 2.0 - uTime * 3.0));',
        '      float ring = smoothstep(R * 1.9, R * 1.0, dl) * smoothstep(0.25, 0.6, n) * (0.6 + 0.4 * smoothstep(0.0, -R, along));',
        '      float wake = exp(-across * across / (R * R * 0.8)) * smoothstep(0.0, R * 0.8, along) * exp(-along / (R * 6.0)) * smoothstep(0.3, 0.65, fbm(vec2(along / R * 1.4 - uTime * 3.4, across / R * 2.5)));',
        '      sp = max(sp, max(ring, wake * 0.85));',
        '    }',
        '    w = mix(w, vec3(0.97, 0.99, 1.0), sp * 0.85);',
        '    c = mix(c, w, max(m.g, sp * smoothstep(0.0, 0.05, m.g + 0.02)));',
        '  }',
        '  if (m.r > 0.003) {',                                                     /* 瀑布 */
        '    vec3 w = flowSample(vUv, vec2(0.0015, -0.05), 0.9);',
        '    float st = vn(vec2(vUv.x * 1400.0, vUv.y * 22.0 + uTime * 5.0)) * vn(vec2(vUv.x * 700.0 + 3.0, vUv.y * 9.0 + uTime * 3.2));',
        '    w = mix(w, vec3(1.0), smoothstep(0.32, 0.62, st) * 0.55);',
        '    c = mix(c, w, m.r);',
        '  }',
        '  if (m.b > 0.003) {',                                                     /* 水雾 */
        '    float mist = fbm(vec2(vUv.x * 60.0 - uTime * 0.25, vUv.y * 45.0 + uTime * 0.4));',
        '    c = mix(c, vec3(0.93, 0.96, 0.98), m.b * smoothstep(0.35, 0.8, mist) * 0.55);',
        '  }',
        '  if (vUv.y > 0.62) {',                                                    /* 云：亮而不饱和的天空像素，极慢地往右漂 */
        '    float lum = dot(c, vec3(0.333)), sat = max(c.r, max(c.g, c.b)) - min(c.r, min(c.g, c.b));',
        '    float cm = smoothstep(0.72, 0.86, lum) * (1.0 - smoothstep(0.12, 0.28, sat)) * smoothstep(0.62, 0.72, vUv.y);',
        '    if (cm > 0.01) c = mix(c, flowSample(vUv, vec2(0.012, 0.0), 0.03), cm);',
        '  }',
        '  gl_FragColor = vec4(c, 1.0);',
        '}'].join('\n') });
  }

  /* —— 抹掉原房子：补图（整张大小）和低分辨率遮罩 —— */
  function makePatch(img) {
    var W = PL.W, H = PL.H, cv = document.createElement('canvas'); cv.width = W; cv.height = H; var g = cv.getContext('2d');
    g.drawImage(img, 0, 0);
    var x0 = 400, x1 = 1290, sx = 1290, sw = 250, k, x;
    /* 房身一带：右边那条山林和村庄（源行 690–1060）左右镜像拼过去，竖向拉到 565–1060 */
    for (k = 0, x = x1; x > x0; k++, x -= sw) {
      g.save();
      if (k % 2 === 0) { g.translate(x, 0); g.scale(-1, 1); g.drawImage(img, sx, 690, sw, 370, 0, 500, sw, 560); }
      else g.drawImage(img, sx, 690, sw, 370, x - sw, 500, sw, 560);
      g.restore();
    }
    /* 房顶一带：上方的山向下镜像延伸，下沿和山林渐变衔接 */
    var band = document.createElement('canvas'); band.width = W; band.height = H; var bg = band.getContext('2d');
    bg.save(); bg.translate(0, 445 * 2); bg.scale(1, -1); bg.drawImage(img, x0, 320, x1 - x0, 125, x0, 320, x1 - x0, 125); bg.restore();   /* 320–445（烟囱顶以上）翻到 445–570 */
    bg.drawImage(img, x0, 320, x1 - x0, 125, x0, 570, x1 - x0, 125);                                                                       /* 再接一段 570–695 */
    bg.globalCompositeOperation = 'destination-in';
    var gr = bg.createLinearGradient(0, 445, 0, 700); gr.addColorStop(0, 'rgba(0,0,0,1)'); gr.addColorStop(0.5, 'rgba(0,0,0,1)'); gr.addColorStop(0.8, 'rgba(0,0,0,0)'); gr.addColorStop(1, 'rgba(0,0,0,0)');   /* 山延伸到遮罩里面一段（到 570），再在 650 前慢慢过渡成山林 */
    bg.fillStyle = gr; bg.fillRect(0, 445, W, 260); bg.fillStyle = '#000'; bg.globalCompositeOperation = 'source-over';
    /* 悬崖右边的天空翻下来会在烟囱后面留一块白斑：用左边紧挨着的一段崖壁（右移 150）盖住，左缘羽化 */
    var fx0 = 870, fw = 180, fy0 = 445, fh = 210, pc = document.createElement('canvas'); pc.width = fw; pc.height = fh; var pg = pc.getContext('2d');
    pg.drawImage(band, fx0 - 150, fy0, fw, fh, 0, 0, fw, fh);
    pg.globalCompositeOperation = 'destination-in'; var fg = pg.createLinearGradient(0, 0, 40, 0); fg.addColorStop(0, 'rgba(0,0,0,0)'); fg.addColorStop(1, 'rgba(0,0,0,1)'); pg.fillStyle = fg; pg.fillRect(0, 0, fw, fh);
    bg.drawImage(pc, fx0, fy0);
    g.drawImage(band, 0, 0);
    /* 房前的草坡：原图里草坡一直隆起到房子墙脚。把正下方的一段坡上草地拉高铺上去，上沿是一条平缓的坡顶曲线、四周羽化，
       原来那条土路和房子墙脚之间的空当都变成连续的小山丘（房子和小路的高度差由 3D 的小山丘接上，见 buildValley） */
    var lw = document.createElement('canvas'), LX0 = 270, LX1 = 840, LY0 = 975, LY1 = 1125; lw.width = LX1 - LX0; lw.height = LY1 - LY0; var lg = lw.getContext('2d');
    lg.drawImage(img, LX0, 1105, LX1 - LX0, 95, 0, 0, LX1 - LX0, LY1 - LY0);
    lg.globalCompositeOperation = 'destination-in';
    var lm = document.createElement('canvas'); lm.width = lw.width; lm.height = lw.height; var lmg = lm.getContext('2d');
    lmg.filter = 'blur(10px)'; lmg.fillStyle = '#000'; lmg.beginPath(); lmg.moveTo(40, lw.height - 14);
    for (var xx = 40; xx <= lw.width - 20; xx += 10) { var t = (xx - 40) / (lw.width - 60), crest = 1003 + 10 * t - 9 * Math.sin(t * Math.PI); lmg.lineTo(xx, crest - LY0); }
    lmg.lineTo(lw.width - 20, lw.height - 14); lmg.closePath(); lmg.fill();
    lg.drawImage(lm, 0, 0); lg.globalCompositeOperation = 'source-over';
    g.drawImage(lw, LX0, LY0);
    var shg = g.createLinearGradient(0, 990, 0, 1120); shg.addColorStop(0, 'rgba(255,250,210,0.10)'); shg.addColorStop(0.35, 'rgba(255,250,210,0)'); shg.addColorStop(1, 'rgba(20,45,10,0.18)');
    g.save(); g.globalCompositeOperation = 'source-atop'; g.fillStyle = shg; g.fillRect(LX0 + 40, 985, LX1 - LX0 - 60, 135); g.restore();   /* 坡顶受光、坡脚稍暗：有小山丘的起伏 */
    /* 去掉石桌边那道木栅栏（连同影子）：用石凳下方那条干净的向阳草地一块块铺上去，越往下铺得越大（近大远小），左右交替翻转免得看出重复 */
    var fc = document.createElement('canvas'); fc.width = W; fc.height = H; var fg2 = fc.getContext('2d');
    fg2.beginPath(); PL.fence.forEach(function (q, i2) { if (i2) fg2.lineTo(q[0], q[1]); else fg2.moveTo(q[0], q[1]); }); fg2.closePath(); fg2.save(); fg2.clip();
    var ty = 1060, row = 0;
    while (ty < H) {
      var sc = 0.45 + 0.55 * Math.max(0, ty - 1060) / 378, tw = 300 * sc, th = 70 * sc, tx = 1700 - (row % 2) * tw * 0.5, col = 0;
      for (; tx < 2060; tx += tw, col++) {
        fg2.save(); if ((row + col) % 2) { fg2.translate(tx + tw, ty); fg2.scale(-1, 1); fg2.drawImage(img, 2150, 1365, 300, 70, 0, 0, tw, th); }
        else fg2.drawImage(img, 2150, 1365, 300, 70, tx, ty, tw, th);
        fg2.restore();
      }
      ty += th * 0.92; row++;
    }
    fg2.restore();
    var fm = document.createElement('canvas'); fm.width = W; fm.height = H; var fmg = fm.getContext('2d');   /* 羽化边 */
    fmg.filter = 'blur(9px)'; fmg.fillStyle = '#000'; fmg.beginPath(); PL.fence.forEach(function (q, i2) { if (i2) fmg.lineTo(q[0], q[1]); else fmg.moveTo(q[0], q[1]); }); fmg.closePath(); fmg.fill();
    fg2.globalCompositeOperation = 'destination-in'; fg2.drawImage(fm, 0, 0);
    g.drawImage(fc, 0, 0);
    /* 小溪右岸：原来的水面铺成草坡。草取石凳下方那条向阳草地（近大远小），靠水那一侧渐暗（坡往下到水边），岸线上一道湿边和细细的水花 */
    var edge = [];                                                    /* 新岸线：每 8 像素一点，左右轻轻起伏，不是一条直线 */
    for (var ei = 0; ei < 7; ei++) { var EA = PL.bank[ei], EB = PL.bank[ei + 1], en = Math.max(1, Math.round(Math.hypot(EB[0] - EA[0], EB[1] - EA[1]) / 8));
      for (var ek = 0; ek < en; ek++) { var et = ek / en, ex = EA[0] + (EB[0] - EA[0]) * et, ey = EA[1] + (EB[1] - EA[1]) * et; edge.push([ex + 5 * Math.sin(ey * 0.11) + 3 * Math.sin(ey * 0.37 + 1.3), ey]); } }
    edge.push(PL.bank[7]);
    var bankPoly = edge.concat(PL.bank.slice(8));
    var bc = document.createElement('canvas'); bc.width = W; bc.height = H; var bg2 = bc.getContext('2d');
    function bpath(c2) { c2.beginPath(); bankPoly.forEach(function (q, i2) { if (i2) c2.lineTo(q[0], q[1]); else c2.moveTo(q[0], q[1]); }); c2.closePath(); }
    bg2.save(); bpath(bg2); bg2.clip();
    for (var by = 1000, brow = 0; by < H; brow++) {
      var bsc = 0.4 + 0.6 * Math.max(0, by - 1000) / 438, bw = 300 * bsc, bh = 70 * bsc;
      for (var bx = 1480 - (brow % 2) * bw * 0.5, bcol = 0; bx < 1900; bx += bw, bcol++) {
        bg2.save(); if ((brow + bcol) % 2) { bg2.translate(bx + bw, by); bg2.scale(-1, 1); bg2.drawImage(img, 2150, 1365, 300, 70, 0, 0, bw, bh); } else bg2.drawImage(img, 2150, 1365, 300, 70, bx, by, bw, bh);
        bg2.restore();
      }
      by += bh * 0.92;
    }
    function stroke(col, wid, blur, dx) { bg2.save(); bg2.filter = 'blur(' + blur + 'px)'; bg2.strokeStyle = col; bg2.lineWidth = wid; bg2.lineJoin = bg2.lineCap = 'round'; bg2.beginPath(); edge.forEach(function (q, i2) { if (i2) bg2.lineTo(q[0] + dx, q[1]); else bg2.moveTo(q[0] + dx, q[1]); }); bg2.stroke(); bg2.restore(); }
    stroke('rgba(20,48,12,0.55)', 90, 22, 22);                        /* 坡往下到水边：靠水一侧暗下去 */
    stroke('rgba(52,60,30,0.75)', 14, 4, 4);                           /* 水边湿土 */
    for (var ti = 0; ti < edge.length; ti += 2) {                      /* 水边的草丛：一簇簇往水面探 */
      var tq = edge[ti], ts = 0.6 + 0.6 * (tq[1] - 1000) / 438;
      bg2.save(); bg2.translate(tq[0] + 2, tq[1]); bg2.strokeStyle = ti % 4 ? 'rgba(96,140,40,0.9)' : 'rgba(70,112,30,0.9)'; bg2.lineWidth = 1.6 * ts;
      for (var tb = 0; tb < 4; tb++) { bg2.beginPath(); bg2.moveTo(0, 0); bg2.quadraticCurveTo(-4 * ts, -8 * ts, (-9 - tb * 3 + (ti % 3) * 2) * ts, (-12 - tb * 2) * ts); bg2.stroke(); }
      bg2.restore();
    }
    bg2.restore();
    stroke('rgba(235,245,250,0.85)', 5, 2, -4);                        /* 岸线上的细水花（画在草坡外侧的水面上） */
    var bm = document.createElement('canvas'); bm.width = W; bm.height = H; var bmg = bm.getContext('2d');
    bmg.filter = 'blur(16px)'; bmg.fillStyle = '#000'; bpath(bmg); bmg.fill(); bmg.filter = 'blur(2px)'; bmg.beginPath(); edge.concat([[1690, 1438], [1800, 1100]]).forEach(function (q, i2) { if (i2) bmg.lineTo(q[0], q[1]); else bmg.moveTo(q[0], q[1]); }); bmg.closePath(); bmg.fill();   /* 外侧（和原来的草地）大羽化，靠水一侧边缘清楚 */ bmg.lineWidth = 16; bmg.strokeStyle = '#000'; bmg.beginPath(); edge.forEach(function (q, i2) { if (i2) bmg.lineTo(q[0] - 4, q[1]); else bmg.moveTo(q[0] - 4, q[1]); }); bmg.stroke();
    bg2.globalCompositeOperation = 'destination-in'; bg2.drawImage(bm, 0, 0);
    g.drawImage(bc, 0, 0);
    /* 右岸草坡和石桌边的草地：稀疏的野花（白、黄、粉、紫），近处大远处小，几朵一簇 */
    var rnd = (function () { var x = 7; return function () { x = (x * 16807) % 2147483647; return x / 2147483647; }; })();
    g.save(); g.beginPath();
    [bankPoly, PL.fence].forEach(function (poly) { poly.forEach(function (q, i2) { if (i2) g.lineTo(q[0], q[1]); else g.moveTo(q[0], q[1]); }); g.closePath(); });
    g.clip();
    var FL = ['#fbfaf2', '#f6d84a', '#f2a6c2', '#b78ad8', '#fbfaf2', '#f6d84a'];
    for (var fi = 0; fi < 60; fi++) {
      var fy = 1060 + Math.pow(rnd(), 0.8) * 378, fx = 1560 + rnd() * 480, fs = 1.1 + 2.6 * (fy - 1060) / 378, fc2 = FL[Math.floor(rnd() * FL.length)], fn = 1 + Math.floor(rnd() * 3);
      for (var fk = 0; fk < fn; fk++) {
        var ax = fx + (rnd() - 0.5) * 14 * fs, ay = fy + (rnd() - 0.5) * 6 * fs;
        g.strokeStyle = 'rgba(70,110,30,0.8)'; g.lineWidth = 0.8 * fs; g.beginPath(); g.moveTo(ax, ay); g.lineTo(ax + (rnd() - 0.5) * 2, ay + 5 * fs); g.stroke();
        g.fillStyle = fc2; g.beginPath(); g.arc(ax, ay, 1.7 * fs, 0, Math.PI * 2); g.fill();
        g.fillStyle = 'rgba(255,255,255,0.5)'; g.beginPath(); g.arc(ax - 0.5 * fs, ay - 0.5 * fs, 0.6 * fs, 0, Math.PI * 2); g.fill();
      }
    }
    g.restore();
    /* 溪里的石头：先画水撞上来的白浪（在石头后面），再画露出水面的圆顶石头，最后是前面一圈白沫 */
    PL.rocks.forEach(function (r, ri) {
      var x = r[0], y = r[1], R = r[2];
      g.save(); g.translate(x, y);
      g.fillStyle = 'rgba(20,40,50,0.3)'; g.beginPath(); g.ellipse(R * 0.15, R * 0.5, R * 1.15, R * 0.4, 0, 0, Math.PI * 2); g.fill();      /* 水下的影子 */
      g.filter = 'blur(2px)'; g.fillStyle = 'rgba(246,251,255,0.9)';
      g.beginPath(); g.ellipse(0, -R * 0.05, R * 1.35, R * 0.62, 0, Math.PI, Math.PI * 2); g.ellipse(0, -R * 0.05, R * 1.0, R * 0.25, 0, 0, Math.PI); g.fill();   /* 上游一侧堆起的白浪 */
      g.filter = 'none';
      g.beginPath();
      for (var a = 0; a <= 16; a++) { var th = Math.PI + a / 16 * Math.PI, k = 1 + 0.1 * Math.sin(th * 3 + ri * 1.7) + 0.05 * Math.cos(th * 5 + ri); g.lineTo(Math.cos(th) * R * k, Math.sin(th) * R * 0.85 * k); }   /* 上半：圆顶 */
      g.quadraticCurveTo(R * 0.6, R * 0.32, 0, R * 0.3); g.quadraticCurveTo(-R * 0.6, R * 0.32, -R, 0); g.closePath();                            /* 下半：没进水里，平一点 */
      var rg = g.createLinearGradient(0, -R * 0.85, 0, R * 0.3); rg.addColorStop(0, '#a3a39a'); rg.addColorStop(0.5, '#6f716b'); rg.addColorStop(1, '#353b3c');
      g.fillStyle = rg; g.fill();
      g.fillStyle = 'rgba(255,250,235,0.4)'; g.beginPath(); g.ellipse(-R * 0.25, -R * 0.55, R * 0.42, R * 0.14, -0.25, 0, Math.PI * 2); g.fill();   /* 顶上的高光 */
      g.filter = 'blur(1.2px)'; g.strokeStyle = 'rgba(246,251,255,0.9)'; g.lineWidth = R * 0.14; g.lineCap = 'round';
      g.beginPath(); g.ellipse(0, R * 0.22, R * 1.02, R * 0.22, 0, Math.PI * 0.02, Math.PI * 0.98); g.stroke();                                      /* 和水面交界的白沫 */
      g.filter = 'none'; g.restore();
    });
    /* 抹掉原图树屋的两架木梯：一行一行地用梯子左右两边的颜色接起来（小屋的木板、树丛、树干、草坪都是横向连续的），再加一点颗粒 */
    (function () {
      PL.ladders.forEach(function (poly) {
        var ys = poly.map(function (q) { return q[1]; }), y0 = Math.floor(Math.min.apply(null, ys)), y1 = Math.ceil(Math.max.apply(null, ys)), xs = poly.map(function (q) { return q[0]; });
        var bx0 = Math.max(0, Math.floor(Math.min.apply(null, xs)) - 12), bx1 = Math.ceil(Math.max.apply(null, xs)) + 12, d = g.getImageData(bx0, y0, bx1 - bx0, y1 - y0 + 1), q = d.data, w = bx1 - bx0;
        for (var y = y0; y <= y1; y++) {
          var hits = []; for (var e = 0; e < poly.length; e++) { var A = poly[e], B = poly[(e + 1) % poly.length]; if ((A[1] - y) * (B[1] - y) <= 0 && A[1] !== B[1]) hits.push(A[0] + (B[0] - A[0]) * (y - A[1]) / (B[1] - A[1])); }
          if (hits.length < 2) continue; var xa = Math.max(bx0 + 4, Math.floor(Math.min.apply(null, hits)) - 2), xb = Math.min(bx1 - 4, Math.ceil(Math.max.apply(null, hits)) + 2), row = (y - y0) * w;
          function avg(x0, x1) { var c = [0, 0, 0], n = 0; for (var x = Math.max(bx0, x0); x < Math.min(bx1, x1); x++) { var o = (row + x - bx0) * 4; c[0] += q[o]; c[1] += q[o + 1]; c[2] += q[o + 2]; n++; } return n ? c.map(function (v) { return v / n; }) : null; }
          var cl = avg(xa - 7, xa - 1) || avg(xb + 1, xb + 7), cr = avg(xb + 1, xb + 7) || cl;
          for (var x = xa; x <= xb; x++) { var t = (x - xa) / Math.max(1, xb - xa), o2 = (row + x - bx0) * 4, n2 = (Math.sin(x * 12.9898 + y * 78.233) * 43758.5453 % 1) * 14; q[o2] = cl[0] + (cr[0] - cl[0]) * t + n2; q[o2 + 1] = cl[1] + (cr[1] - cl[1]) * t + n2; q[o2 + 2] = cl[2] + (cr[2] - cl[2]) * t + n2; }
        }
        g.putImageData(d, bx0, y0);
        /* 去掉横纹：在梯子范围里叠一层旁边的真实纹理（左梯取左边的树丛、右梯取右边的草和灌木），再轻轻糊一下 */
        var shift = poly === PL.ladders[0] ? 62 : -95;
        g.save(); g.beginPath(); poly.forEach(function (q2, i2) { if (i2) g.lineTo(q2[0], q2[1]); else g.moveTo(q2[0], q2[1]); }); g.closePath(); g.clip();
        g.globalAlpha = 0.55; g.drawImage(img, bx0 - shift, y0, bx1 - bx0, y1 - y0, bx0, y0, bx1 - bx0, y1 - y0); g.globalAlpha = 1;
        g.filter = 'blur(2.5px)'; g.drawImage(g.canvas, bx0, y0, bx1 - bx0, y1 - y0, bx0, y0, bx1 - bx0, y1 - y0); g.filter = 'none';
        g.restore();
      });
    })();
    /* 遮罩：原房子的轮廓，低分辨率，放大时边缘自然羽化 */
    var f = 16, mk = document.createElement('canvas'); mk.width = Math.round(W / f); mk.height = Math.round(H / f); var mg = mk.getContext('2d');
    mg.fillStyle = '#000'; mg.fillRect(0, 0, mk.width, mk.height); mg.fillStyle = '#fff'; mg.beginPath();
    [PL.mask, PL.path, PL.fence, PL.bank].concat(PL.ladders.map(function (poly) { var cx = 0, cy = 0; poly.forEach(function (q) { cx += q[0] / poly.length; cy += q[1] / poly.length; }); return poly.map(function (q) { var dx = q[0] - cx, dy = q[1] - cy, L = Math.hypot(dx, dy) || 1; return [q[0] + dx / L * 26, q[1] + dy / L * 26]; }); }))   /* 梯子很细：遮罩往外放宽，补好的那层完全盖住原来的木梯，不留残影 */.concat(PL.rocks.map(function (r) { var o = []; for (var a = 0; a < 10; a++) o.push([r[0] + Math.cos(a / 10 * 6.283) * r[2] * 1.6, r[1] + Math.sin(a / 10 * 6.283) * r[2] * 1.3]); return o; })).forEach(function (poly) { mg.beginPath(); poly.forEach(function (p, i) { if (i) mg.lineTo(p[0] / f, p[1] / f); else mg.moveTo(p[0] / f, p[1] / f); }); mg.closePath(); mg.fill(); });
    function tex(c) { var t = new THREE.CanvasTexture(c); t.minFilter = THREE.LinearFilter; t.magFilter = THREE.LinearFilter; t.generateMipmaps = false; t.flipY = true; return t; }
    return { patch: tex(cv), mask: tex(mk) };
  }

  C.buildValley = function (scene, house, renderer) {
    var disp = [], root = new THREE.Group(); root.name = 'plate'; scene.add(root);
    var Wn = 2 * Math.tan(PL.hfov / 2 * D2R), A = PL.W / PL.H, Hn = Wn / A, vfov = 2 * Math.atan(Hn / 2) / D2R;
    var pitch = Math.atan((PL.horizon - 0.5) * Hn);                      /* 镜头略微抬头，地平线落在底图 65% 高处 */
    var cam = { pos: new THREE.Vector3(0, 0, 0), quat: new THREE.Quaternion().setFromEuler(new THREE.Euler(pitch, 0, 0, 'YXZ')) };

    /* —— 底图：挂在镜头前方远处，正好铺满整个画框 —— */
    var RB = 4000, back = new THREE.Mesh(new THREE.PlaneGeometry(Wn * RB, Hn * RB), backMaterial());
    back.position.set(0, 0, -RB).applyQuaternion(cam.quat); back.quaternion.copy(cam.quat); back.renderOrder = -10; back.frustumCulled = false; back.visible = false; root.add(back); disp.push(back.geometry, back.material);
    var img = new Image(); img.onload = function () {
      var src = new THREE.Texture(img); src.minFilter = THREE.LinearFilter; src.generateMipmaps = false; src.needsUpdate = true;
      var pm = makePatch(img), rt = C.Paint.paintBackdrop(renderer, src, 2048, Math.round(2048 / A), { patch: pm.patch, mask: pm.mask, sky: false, haze: 0.08 });
      [src, pm.patch, pm.mask, rt].forEach(function (d) { disp.push(d); });
      back.material.uniforms.map.value = rt.texture; back.visible = true;
      bush.material.uniforms.map.value = rt.texture; bush.visible = true;
      mound.material.uniforms.map.value = rt.texture; mound.visible = true;
    };
    img.src = PL.img;

    /* —— 房子：门的底边落在原来的门上，大小按原房子的 75% —— */
    function rayTo(px, py) { return new THREE.Vector3((px / PL.W - 0.5) * Wn, -(py / PL.H - 0.5) * Hn, -1).applyQuaternion(cam.quat).normalize(); }
    var holder = new THREE.Group(); root.add(holder); if (house.parent) house.parent.remove(house); holder.add(house);
    var ray = rayTo(PL.door[0], PL.door[1]);
    function place(d) {                                                  /* 房子放在门的射线上距离 d 处，朝向：正面比正对镜头多转 turn 度 */
      var p = ray.clone().multiplyScalar(d); holder.position.copy(p).add(new THREE.Vector3(0, 0.3, 0));   /* 模型室外地面在 −0.3 */
      holder.rotation.set(0, Math.atan2(-p.x, -p.z) + PL.turn * D2R, 0); holder.updateMatrixWorld(true);
    }
    function heightPx() {                                                 /* 房子在底图上从门底到最高点的高度（像素） */
      var box = new THREE.Box3().setFromObject(house), inv = cam.quat.clone().invert(), top = new THREE.Vector3((box.min.x + box.max.x) / 2, box.max.y, (box.min.z + box.max.z) / 2).applyQuaternion(inv);
      return PL.door[1] - (0.5 - top.y / -top.z / Hn) * PL.H;
    }
    var target = (PL.door[1] - PL.top) * PL.scale, d = 60, it;
    for (it = 0; it < 8; it++) { place(d); d *= heightPx() / target; }
    place(d);
    C.Paint.toonTree(holder, function () { return { cel: true }; });   /* 房子：塞尔达式赛璐珞着色 */

    /* —— 房子左前方一丛树叶：一块面向镜头的面片，颜色直接取绘画化底图里大树的叶子，边缘做成一团团叶子的轮廓 —— */
    var bush = (function () {
      var r = PL.bush.rect, sr = PL.bush.src, Dp = d * 0.85, g = new THREE.PlaneGeometry(1, 1);
      var m = new THREE.ShaderMaterial({ transparent: true, depthWrite: false,
        uniforms: { map: { value: null }, uSrc: { value: new THREE.Vector4(sr[0] / PL.W, 1 - sr[3] / PL.H, (sr[2] - sr[0]) / PL.W, (sr[3] - sr[1]) / PL.H) } },
        vertexShader: 'varying vec2 vUv; void main(){ vUv = uv; gl_Position = projectionMatrix * modelViewMatrix * vec4(position, 1.0); }',
        fragmentShader: ['uniform sampler2D map; uniform vec4 uSrc; varying vec2 vUv;',
          'float h2(vec2 p){ return fract(sin(dot(p, vec2(127.1, 311.7))) * 43758.5453); }',
          'float vn(vec2 p){ vec2 i = floor(p), f = fract(p); f = f * f * (3.0 - 2.0 * f); return mix(mix(h2(i), h2(i + vec2(1.0, 0.0)), f.x), mix(h2(i + vec2(0.0, 1.0)), h2(i + vec2(1.0, 1.0)), f.x), f.y); }',
          'void main(){',
          '  vec3 c = texture2D(map, uSrc.xy + vUv * uSrc.zw).rgb;',
          '  vec2 q = (vUv - vec2(0.5, 0.06)) / vec2(0.5, 0.94);',                 /* 半圆顶的一丛，底边贴着草地 */
          '  float dd = length(q) + 0.16 * (vn(vUv * 9.0) - 0.5) + 0.08 * (vn(vUv * 23.0) - 0.5);',
          '  float a = 1.0 - smoothstep(0.86, 0.98, dd); if (vUv.y < 0.06) a *= smoothstep(0.0, 0.06, vUv.y);',
          '  c *= 0.82 + 0.25 * vUv.y;',                                               /* 下面暗一点 */
          '  if (a < 0.02) discard; gl_FragColor = vec4(c, a);',
          '}'].join('\n') });
      var mesh = new THREE.Mesh(g, m), cxp = (r[0] + r[2]) / 2, cyp = (r[1] + r[3]) / 2;
      mesh.position.set((cxp / PL.W - 0.5) * Wn * Dp, -(cyp / PL.H - 0.5) * Hn * Dp, -Dp).applyQuaternion(cam.quat); mesh.quaternion.copy(cam.quat);
      mesh.scale.set((r[2] - r[0]) / PL.W * Wn * Dp, (r[3] - r[1]) / PL.H * Hn * Dp, 1); mesh.renderOrder = 5; mesh.visible = false; mesh.frustumCulled = false;
      root.add(mesh); disp.push(g, m); return mesh;
    })();
    house.traverse(function (o) { if (o.isMesh) { o.castShadow = true; o.receiveShadow = true; } });

    /* —— 房子脚下的小山丘：草地从四周缓缓隆起，盖住墙脚那条硬边。
       颜色取底图里每一点正下方一段的草地（按固定机位投影算好的贴图坐标），越往外越透明，和原来的草地融成一片 —— */
    var mound = (function () {
      var ry = holder.rotation.y; holder.rotation.y = 0; holder.updateMatrixWorld(true);
      var bx = new THREE.Box3().setFromObject(house); holder.rotation.y = ry; holder.updateMatrixWorld(true);
      var c0 = holder.position, ax0 = bx.min.x - c0.x + 0.2, ax1 = bx.max.x - c0.x - 0.2, az0 = bx.min.z - c0.z + 0.2, az1 = bx.max.z - c0.z - 0.2;
      var y0 = c0.y - 0.3, H = PL.mound.h, L = PL.mound.reach, st = 0.3, cs = Math.cos(ry), sn = Math.sin(ry), inv = cam.quat.clone().invert();
      var nx = Math.ceil((ax1 - ax0 + 2 * L) / st), nz = Math.ceil((az1 - az0 + 2 * L) / st), pos = [], uv = [], sh = [], al = [], idx = [], i, j;
      function toPx(w) { var v = w.clone().sub(cam.pos).applyQuaternion(inv); return [(v.x / -v.z / Wn + 0.5) * PL.W, (0.5 - v.y / -v.z / Hn) * PL.H]; }
      /* 房子墙脚在底图上的下沿：四条外墙脚线投影后，每个 x 取最低（最靠前）的那条；山丘只露在这条线以下 */
      var corners = [[ax0, az0], [ax1, az0], [ax1, az1], [ax0, az1]].map(function (q) { return toPx(new THREE.Vector3(c0.x + q[0] * cs + q[1] * sn, y0, c0.z - q[0] * sn + q[1] * cs)); });
      var pxMin = Math.min.apply(null, corners.map(function (q) { return q[0]; })), pxMax = Math.max.apply(null, corners.map(function (q) { return q[0]; }));
      function baseAt(px) {
        var x = Math.max(pxMin, Math.min(pxMax, px)), best = -1e9;
        for (var e = 0; e < 4; e++) { var A = corners[e], B = corners[(e + 1) % 4]; if ((x - A[0]) * (x - B[0]) <= 0 && A[0] !== B[0]) best = Math.max(best, A[1] + (B[1] - A[1]) * (x - A[0]) / (B[0] - A[0])); }
        return best;
      }
      function sm(e0, e1, x) { var t = Math.max(0, Math.min(1, (x - e0) / (e1 - e0))); return t * t * (3 - 2 * t); }
      for (j = 0; j <= nz; j++) for (i = 0; i <= nx; i++) {
        var lx = ax0 - L + i * st, lz = az0 - L + j * st;
        var dx = Math.max(0, ax0 - lx, lx - ax1), dz = Math.max(0, az0 - lz, lz - az1), dd = Math.sqrt(dx * dx + dz * dz);
        var h = H * (1 - sm(0, L, dd)), wx = c0.x + lx * cs + lz * sn, wz = c0.z - lx * sn + lz * cs, w = new THREE.Vector3(wx, y0 + h, wz);
        pos.push(wx, y0 + h, wz);
        var v = w.clone().sub(cam.pos).applyQuaternion(inv), u = v.x / -v.z / Wn + 0.5, vv = 0.5 + v.y / -v.z / Hn;
        uv.push(u, vv - PL.mound.sample / PL.H);
        sh.push((0.82 + 0.18 * sm(0, 0.9, dd)) * (1.04 - 0.06 * sm(0, L, dd)));      /* 墙根处压暗一点（接触阴影），坡顶亮、坡脚暗 */
        var pp = toPx(new THREE.Vector3(wx, y0, wz)), side = Math.max(0, pxMin - pp[0], pp[0] - pxMax);
        al.push((1 - sm(L * 0.45, L, dd)) * sm(-12, 18, pp[1] - baseAt(pp[0])) * (1 - sm(20, 160, side)));   /* 只在墙脚线以下；房子两侧往外很快淡掉 */
      }
      for (j = 0; j < nz; j++) for (i = 0; i < nx; i++) { var k = j * (nx + 1) + i; idx.push(k, k + nx + 1, k + 1, k + 1, k + nx + 1, k + nx + 2); }
      var g = new THREE.BufferGeometry(); g.setIndex(idx);
      g.setAttribute('position', new THREE.Float32BufferAttribute(pos, 3)); g.setAttribute('uv', new THREE.Float32BufferAttribute(uv, 2));
      g.setAttribute('shade', new THREE.Float32BufferAttribute(sh, 1)); g.setAttribute('alpha', new THREE.Float32BufferAttribute(al, 1));
      var m = new THREE.ShaderMaterial({ transparent: true, depthWrite: false, side: THREE.DoubleSide, uniforms: { map: { value: null } },
        vertexShader: 'attribute float shade; attribute float alpha; varying vec2 vUv; varying float vS; varying float vA; void main(){ vUv = uv; vS = shade; vA = alpha; gl_Position = projectionMatrix * modelViewMatrix * vec4(position, 1.0); }',
        fragmentShader: ['uniform sampler2D map; varying vec2 vUv; varying float vS; varying float vA;',
          'float h2(vec2 p){ return fract(sin(dot(p, vec2(127.1, 311.7))) * 43758.5453); }',
          'void main(){ vec3 c = texture2D(map, vUv).rgb * vS;',
          '  float a = vA * (0.85 + 0.15 * h2(floor(gl_FragCoord.xy / 3.0)));',
          '  if (a < 0.02) discard; gl_FragColor = vec4(c, a); }'].join('\n') });
      var mesh = new THREE.Mesh(g, m); mesh.renderOrder = 2; mesh.visible = false; mesh.frustumCulled = false; root.add(mesh); disp.push(g, m); return mesh;
    })();

    /* —— 小旅人：在石板路上来回走（路面高度 = 房子台地往下 pathDrop 米，两端由底图像素的射线和路面求交） —— */
    var hero = C.Hero.build(), gy = holder.position.y - 0.3 - PL.pathDrop;
    function onGround(px, py) { var r = rayTo(px, py); return r.clone().multiplyScalar((gy - cam.pos.y) / r.y).add(cam.pos); }
    var gyT = holder.position.y - 0.3;                                       /* 屋外地面：房子和大树那一带是台地高度，往画面下方慢慢降到小路高度 */
    function groundY(py) { var t = Math.max(0, Math.min(1, (py - 1120) / 220)); return gyT + (gy - gyT) * t * t * (3 - 2 * t); }
    function onTerrain(px, py) { var r = rayTo(px, py), y = groundY(py); return r.clone().multiplyScalar((y - cam.pos.y) / r.y).add(cam.pos); }
    function toPx(v) { var q = v.clone().sub(cam.pos).applyQuaternion(cam.quat.clone().invert()); return [(q.x / -q.z / Wn + 0.5) * PL.W, (0.5 - q.y / -q.z / Hn) * PL.H]; }
    hero.root.scale.setScalar(PL.heroScale);
    var spot = null;
    function heroAt(name) { if (name === spot) return; spot = name; var w = PL[name]; hero.setPath(onGround(w[0][0], w[0][1]), onGround(w[1][0], w[1][1]), cam.pos.clone()); }
    heroAt('walk');
    root.add(hero.root);

    /* —— 树屋（底图里原有的）的绳梯：挂在平台右端，两根麻绳 + 木横档，最下一档离地约半米，不碰地。
       可以收起（绳子往上卷成一卷）、放下（卷着的放开垂下来）；放下时小人可以坐在最下一档荡秋千（整条绳梯绕顶上摆） —— */
    var TH = (function () {
      var R = PL.rope, base = onTerrain(R[0], R[2]), inv = cam.quat.clone().invert(), depth = -base.clone().sub(cam.pos).applyQuaternion(inv).z;
      function atDepth(px, py, dz) { return new THREE.Vector3((px / PL.W - 0.5) * Wn, -(py / PL.H - 0.5) * Hn, -1).multiplyScalar(depth + (dz || 0)).applyQuaternion(cam.quat).add(cam.pos); }
      var top = atDepth(R[0], R[1]), full = top.y - (base.y + 0.5);
      var ropeM = new THREE.MeshStandardMaterial({ color: new THREE.Color(0x5c4b34).convertSRGBToLinear(), roughness: 1 }), rungM = new THREE.MeshStandardMaterial({ color: new THREE.Color(0x6b5136).convertSRGBToLinear(), roughness: 0.95 });   /* 照参考图：哑光深麻绳色、旧木色横档 */   /* 照参考图：哑光麻绳色、浅木色横档，不要太亮 */
      var side = new THREE.Vector3(1, 0, 0).applyQuaternion(cam.quat); side.y = 0; side.normalize();
      var toCam = cam.pos.clone().sub(base); toCam.y = 0; toCam.normalize();
      var pivot = new THREE.Group(); pivot.position.copy(top); root.add(pivot);
      var ropes = [-0.17, 0.17].map(function (o) { var geo = new THREE.CylinderGeometry(0.019, 0.019, 1, 6); geo.translate(0, -0.5, 0); var m = new THREE.Mesh(geo, ropeM); m.position.copy(side).multiplyScalar(o); pivot.add(m); return m; });
      var NR = Math.max(9, Math.round(full / 0.24) + 1), rungs = []; for (var k = 0; k < NR; k++) { var d = full - (full - 0.12) * k / (NR - 1), rr = new THREE.Mesh(new THREE.BoxGeometry(0.03, 0.4, 0.045), rungM); rr.position.set(0, -d, 0); rr.quaternion.setFromUnitVectors(new THREE.Vector3(0, 1, 0), side); rr.userData.d = d; pivot.add(rr); rungs.push(rr); }
      var bar = new THREE.Mesh(new THREE.BoxGeometry(0.05, 0.56, 0.07), rungM); bar.quaternion.setFromUnitVectors(new THREE.Vector3(0, 1, 0), side); bar.position.set(0, 0.04, 0); pivot.add(bar);   /* 平台下的木挂杆，绳子绕在上面打结 */
      [-0.17, 0.17].forEach(function (o) { var kn = new THREE.Mesh(new THREE.SphereGeometry(0.035, 8, 6), ropeM); kn.position.copy(side).multiplyScalar(o); kn.position.y = 0.02; pivot.add(kn); });
      var roll = new THREE.Mesh(new THREE.CylinderGeometry(1, 1, 0.4, 14), ropeM); roll.quaternion.setFromUnitVectors(new THREE.Vector3(0, 1, 0), side); roll.position.set(0, -0.05, 0); pivot.add(roll);
      C.Paint.toonTree(pivot);
      var st = { k: 0, want: 0, ang: 0 };
      function apply() {
        var L = Math.max(0.04, full * (1 - st.k)); ropes.forEach(function (m) { m.scale.y = L; });
        rungs.forEach(function (m) { m.visible = m.userData.d <= L + 0.01; });
        var rad = 0.015 + 0.075 * Math.sqrt(st.k); roll.scale.set(rad, 1, rad); roll.visible = st.k > 0.02;
      }
      apply();
      var foot = new THREE.Vector3(top.x, base.y, top.z).addScaledVector(toCam, 0.35), ladderTop = new THREE.Vector3(top.x, top.y + 0.05, top.z).addScaledVector(toCam, 0.25);
      var deck = atDepth(R[0] - 70, R[1] - 12, 0.4); deck.y = top.y + 0.08;            /* 平台上站的地方（栏杆后面一点） */
      return {
        pivot: pivot, ladder: foot, ladderTop: ladderTop, deck: deck, face: Math.atan2(-toCam.x, -toCam.z), toCam: toCam, len: full,
        down: function () { return st.want === 0 && st.k < 0.01; },
        moving: function () { return Math.abs(st.k - st.want) > 0.001; },
        roll: function (up) { st.want = up ? 1 : 0; },
        tick: function (dt) { if (st.k !== st.want) { st.k += Math.sign(st.want - st.k) * Math.min(Math.abs(st.want - st.k), dt / 1.6); apply(); } },
        swing: function (a) { st.ang = a; pivot.quaternion.setFromAxisAngle(side, a); },
        bottom: function () { pivot.updateMatrixWorld(true); return pivot.localToWorld(new THREE.Vector3(0, -full, 0)); }
      };
    })();

    /* —— 接触阴影：房子脚下一块只接阴影的透明地面 —— */
    var ground = new THREE.Mesh(new THREE.PlaneGeometry(60, 60), new THREE.ShadowMaterial({ opacity: 0.32 }));
    ground.rotation.x = -Math.PI / 2; ground.position.copy(holder.position).add(new THREE.Vector3(0, -0.3, 0)); ground.receiveShadow = true; root.add(ground); disp.push(ground.geometry, ground.material);

    /* —— 光：和底图一样的晴天，太阳在右前上方，房子正面受光、左侧山墙稍暗 —— */
    var hemi = new THREE.HemisphereLight(0xf2f4ee, 0x667a48, 0.62); root.add(hemi);
    var sun = new THREE.DirectionalLight(0xfff1dc, 1.6); sun.position.copy(holder.position).add(new THREE.Vector3(45, 60, 40)); sun.target.position.copy(holder.position); root.add(sun, sun.target);
    sun.castShadow = true; sun.shadow.mapSize.set(2048, 2048); sun.shadow.bias = -0.0004; sun.shadow.normalBias = 0.05;
    var sc = sun.shadow.camera; sc.left = -22; sc.right = 22; sc.top = 22; sc.bottom = -22; sc.near = 10; sc.far = 200;

    /* —— 镜头：固定在底图的机位，画面 = 底图上裁出的一个矩形（底图像素）。
          Duo：外屏（窄长）裁房子主体近景；展开到内屏裁远景全景。两者之间做过渡：
            外屏 → 内屏（展开）：先在内屏上停在房子近景，再缓缓拉远，露出整片山谷，小旅人挥手；
            内屏 → 外屏（合上）：镜头从山谷中间横移、推近到房子。
          判断：根元素有 duo-outer / duo-inner 类就用它（Duo 版页面会加）；否则按尺寸：短边 ≥ 600 且长短边比 < 1.6 当内屏，
          窄长竖屏（宽高比 < 0.62）当外屏，其余（电脑、平板横屏）按内屏的全景处理。?duo=outer|inner 或 C.PLATE.sim 可强制。 —— */
    var HOUSE = [857, 812], lastT = null, kind = null, trans = null, Q = new URLSearchParams(location.search);
    function screenKind(w, h) {
      var f = PL.sim || Q.get('duo'); if (f === 'outer' || f === 'inner') return f;
      var R = document.documentElement; if (R.classList.contains('duo-inner')) return 'inner'; if (R.classList.contains('duo-outer')) return 'outer';
      if (!(navigator.maxTouchPoints > 0)) return 'normal';                 /* 只在触屏设备上按尺寸猜，电脑窗口不算 */
      if (Math.min(w, h) >= 600 && Math.max(w, h) / Math.min(w, h) < 1.6) return 'inner';    /* 和 iPhoneDuo 页面的判定一致 */
      return w < h ? 'outer' : 'normal';                                   /* 竖着的小屏 = 外屏（和 iPhoneDuo 页面一致）；横拿手机看全景 */
    }
    function clampRect(r) {                                               /* 矩形不超出底图 */
      var w = Math.min(r.w, PL.W, PL.H * r.w / r.h), h = w * r.h / r.w;
      return { x: Math.max(0, Math.min(PL.W - w, r.cx - w / 2)), y: Math.max(0, Math.min(PL.H - h, r.cy - h / 2)), w: w, h: h };
    }
    function shows(fr, x) { var c = clampRect(fr); return x > c.x + 40 && x < c.x + c.w - 40; }
    function frameFor(k, va) {                                            /* 各屏的取景：中心 + 宽（高由视口比例定） */
      if (k === 'outer') { var ho = Math.min(PL.H, Math.max(1100, 640 / va)); return { cx: HOUSE[0], cy: HOUSE[1] - 30, w: ho * va, h: ho }; }   /* 房子居中，略推近 */
      var w = va > A ? PL.W : PL.H * va;                                      /* 远景：房子左缘（约 x 520）留在画面里，能放下就往右多带上村庄、瀑布和石桌 */
      return { cx: va > A ? PL.W / 2 : (k === 'inner' ? 520 + w / 2 : PL.W / 2), cy: PL.H / 2, w: w, h: w / va };
    }
    function closeUp(va) { var w = Math.min(760, PL.H * va); return { cx: HOUSE[0], cy: HOUSE[1] + 40, w: w, h: w / va }; }   /* 房子近景 */
    function ease(t) { return t < 0.5 ? 4 * t * t * t : 1 - Math.pow(-2 * t + 2, 3) / 2; }
    function lerpR(a, b, t) { return { cx: a.cx + (b.cx - a.cx) * t, cy: a.cy + (b.cy - a.cy) * t, w: a.w * Math.pow(b.w / a.w, t), h: a.h * Math.pow(b.h / a.h, t) }; }
    function beginTransition(from, to, va, now) {
      if (from === 'outer' && to !== 'outer') { trans = { from: closeUp(va), t0: now, dur: 2.6, hold: 0.5, glow: 1 }; hero.greet(); }
      else if (to === 'outer' && from && from !== 'outer') { var f = frameFor('outer', va); trans = { from: { cx: 1300, cy: f.cy, w: f.w * 1.25, h: f.h * 1.25 }, t0: now, dur: 1.6, hold: 0.15, glow: 0 }; }
      try { sessionStorage.setItem('clun.duo.kind', JSON.stringify({ k: to, t: Date.now() })); } catch (e) {}
    }
    /* 页面在换屏时被重新载入的情况：上一屏是外屏且刚过去不久，就补放展开动画 */
    var bootFrom = null; try { var bk = JSON.parse(sessionStorage.getItem('clun.duo.kind') || 'null'); if (bk && Date.now() - bk.t < 8000) bootFrom = bk.k; } catch (e) {}
    var glow = document.createElement('div');                             /* 展开时从折痕处扫过的一道柔光 */
    glow.style.cssText = 'position:fixed;inset:0;pointer-events:none;z-index:3;opacity:0;background:linear-gradient(90deg,rgba(255,250,235,0) 35%,rgba(255,250,235,.55) 50%,rgba(255,250,235,0) 65%);background-size:300% 100%;';
    document.body.appendChild(glow); disp.push({ dispose: function () { glow.remove(); } });
    /* —— 进门：点房门 → 镜头推到门口 → 进屋、穿过门厅、上楼梯到二楼 → 进书房（南侧前面那间）。
       Minest 开屏用（?entry=1）：走完给外层发 {clun:'enter'}，外层接着打开房间。随时可跳过。 —— */
    var DOOR = { x: [800, 940], y: [895, 1040], c: [868, 985] }, lastC = null, walk = null, ENTRY = Q.get('entry') === '1';
    function E(x, y, z) { house.updateMatrixWorld(true); return house.localToWorld(new THREE.Vector3(x, y, z)); }   /* 工程坐标（X 北、Y 进深、Z 上）→ 场景 */
    var F1 = C.P.floor1Z, EYE = 1.55;
    /* 白光一闪进到门厅 → 沿楼梯左侧往里走（不穿扶手）→ 绕到梯脚 → 顺着梯段往前上 → 转角踏步 → 二楼平台；
       再一闪进书房（南侧后间），慢慢走向窗前书桌 */
    var camPath = new THREE.CatmullRomCurve3([E(0, 0.55, 1.55), E(0.05, 1.6, 1.6), E(0.25, 3.3, 1.6), E(1.05, 3.85, 1.6),
      E(1.17, 2.4, 0.75 + EYE), E(1.17, 1.5, 1.55 + EYE)], false, 'centripetal');
    var lookPath = new THREE.CatmullRomCurve3([E(0, 2.5, 1.5), E(0.1, 3.5, 1.55), E(0.6, 4.3, 1.6), E(1.17, 2.6, 1.7), E(1.17, 0.9, 2.9)], false, 'centripetal');
    var studyA = E(-1.25, 4.15, F1 + EYE), studyB = E(-2.75, 4.75, F1 + EYE), studyL = E(-5.6, 5.4, F1 + 0.95);   /* 书房（南侧后间）：从平台的门进去，看向窗前的书桌 */
    var veil = document.createElement('div');
    veil.style.cssText = 'position:fixed;inset:0;pointer-events:none;opacity:0;z-index:30;background:radial-gradient(circle at 50% 55%, #fffaf0, #f3e6cf);transition:none';
    document.body.appendChild(veil);
    var ui = document.createElement('div'); ui.className = 'clun-entry';
    ui.innerHTML = '<div class="ce-door" hidden><span class="ce-ring"></span></div>' +
      '<button class="ce-skip" hidden>跳过动画 ›</button><button class="ce-go" hidden>直接进入房间 ›</button>' +
      '<button class="ce-explore" hidden>进屋探索</button><button class="ce-out" hidden>‹ 回到门外</button>' +
      '<button class="ce-view" hidden>👤 第一人称</button><div class="ce-acts" hidden><span class="ce-ctx"></span><button class="ce-door2" hidden>🚪 开门</button><button class="ce-sit" hidden>🪑 坐下</button><button class="ce-read" hidden>📖 看书</button><button class="ce-wave">👋 挥手</button></div><div class="ce-stick" hidden><div class="ce-knob"></div></div><button class="ce-menu" hidden>≡</button><div class="ce-feats" hidden></div><div class="ce-bar" hidden><div class="ce-brand" style="visibility:hidden"></div><button class="ce-ic ce-x" data-a="pack" title="背包 · 布置">🎒</button><button class="ce-ic ce-x" data-a="env" title="切换环境">🌐</button><button class="ce-ic ce-x" data-a="views" title="窗外风景">🪟</button><button class="ce-ic ce-x" data-a="sit" title="坐下 / 起立">🪑</button><button class="ce-ic ce-x" data-a="view" title="第一 / 第三人称">👤</button><button class="ce-ic ce-x" data-a="set" title="设置">⚙</button><button class="ce-ic ce-fold on" data-a="menu" title="显示 / 收起按钮">≡</button><button class="ce-ic" data-a="exit" title="进入完整的 Minest">✕</button></div><div class="ce-help" hidden>拖动看四周 · 摇杆或 WASD 走动 · 楼梯可以上楼</div>';
    document.body.appendChild(ui);
    var css = document.createElement('style'); css.textContent =
      '.clun-entry .ce-door{position:fixed;z-index:20;transform:translate(-50%,-50%);pointer-events:auto;cursor:pointer;display:flex;flex-direction:column;align-items:center;gap:8px}' +
      '.clun-entry .ce-door[hidden],.clun-entry button[hidden]{display:none}' +
      '.clun-entry .ce-ring{width:46px;height:46px;border-radius:50%;border:2px solid rgba(255,248,225,.95);box-shadow:0 0 18px rgba(255,235,180,.9),inset 0 0 12px rgba(255,235,180,.6);animation:cePulse 1.8s ease-in-out infinite}' +
      '.clun-entry .ce-tip{font:600 13px/1 -apple-system,"PingFang SC",sans-serif;color:#fff;padding:7px 12px;border-radius:14px;background:rgba(40,52,40,.55);backdrop-filter:blur(6px);-webkit-backdrop-filter:blur(6px);white-space:nowrap}' +
      '@keyframes cePulse{0%,100%{transform:scale(.85);opacity:.75}50%{transform:scale(1.15);opacity:1}}' +
      '.clun-entry button{position:fixed;z-index:40;right:16px;font:600 13px/1 -apple-system,"PingFang SC",sans-serif;color:#fff;border:0;padding:10px 14px;border-radius:16px;background:rgba(30,36,30,.5);backdrop-filter:blur(6px);-webkit-backdrop-filter:blur(6px);cursor:pointer}' +
      '.clun-entry .ce-skip{bottom:calc(16px + env(safe-area-inset-bottom))}.clun-entry .ce-go,.clun-entry .ce-out{top:calc(14px + env(safe-area-inset-top));right:auto;left:calc(16px + env(safe-area-inset-left))}' +   /* 右上角让给系统状态栏 */
      '.clun-entry .ce-explore{bottom:calc(16px + env(safe-area-inset-bottom));right:auto;left:calc(16px + env(safe-area-inset-left));background:rgba(196,140,60,.78)}' +
      '.clun-entry .ce-stick{position:fixed;z-index:40;left:calc(24px + env(safe-area-inset-left));bottom:calc(70px + env(safe-area-inset-bottom));width:116px;height:116px;border-radius:50%;background:rgba(255,255,255,.18);border:2px solid rgba(255,255,255,.55);touch-action:none}' +
      '.clun-entry .ce-view{bottom:calc(66px + env(safe-area-inset-bottom))}' +
      '.clun-entry .ce-acts{position:fixed;z-index:40;left:50%;transform:translateX(-50%);bottom:calc(16px + env(safe-area-inset-bottom));display:flex;gap:8px}.clun-entry .ce-acts[hidden]{display:none}' +
      '.clun-entry .ce-acts button{position:static;right:auto}.clun-entry .ce-ctx{display:contents}' +
      '.clun-entry .ce-bar{position:fixed;z-index:42;top:calc(10px + env(safe-area-inset-top));left:calc(12px + env(safe-area-inset-left));right:calc(12px + env(safe-area-inset-right));display:flex;align-items:center;gap:8px;pointer-events:none;font:14px/1.4 -apple-system,BlinkMacSystemFont,"PingFang SC",sans-serif;color:#1d2b4f}' +
      '.clun-entry .ce-bar[hidden]{display:none}.clun-entry .ce-bar>*{pointer-events:auto}' +
      '.clun-entry .ce-brand{margin-right:auto;padding:7px 12px;border-radius:14px;background:rgba(251,247,238,.82);backdrop-filter:blur(14px);-webkit-backdrop-filter:blur(14px);border:1px solid rgba(29,43,79,.14);display:flex;flex-direction:column;line-height:1.15}' +
      '.clun-entry .ce-brand strong{font-size:13px;letter-spacing:.02em}.clun-entry .ce-brand span{font-size:11px;opacity:.62;white-space:nowrap}' +
      '.clun-entry .ce-bar .ce-ic{position:static;flex:none;width:38px;height:38px;border-radius:13px;border:1px solid rgba(29,43,79,.14);background:rgba(251,247,238,.82);backdrop-filter:blur(14px);-webkit-backdrop-filter:blur(14px);font:16px/1 -apple-system,sans-serif;cursor:pointer;color:#1d2b4f;padding:0;transition:opacity .25s,transform .25s}' +
      '.clun-entry .ce-bar .ce-ic.on{background:#2f6fd6;color:#fff}' +
      '.clun-entry .ce-bar.fold .ce-x{opacity:0;pointer-events:none;transform:translateY(-8px)}' +
      '@media (max-width:480px){.clun-entry .ce-brand{display:none}.clun-entry .ce-bar .ce-ic{width:34px;height:34px;border-radius:11px}.clun-entry .ce-bar{gap:6px;justify-content:flex-end}}' +
      '.clun-entry .ce-menu{top:calc(14px + env(safe-area-inset-top));right:calc(16px + env(safe-area-inset-right));font-size:20px;padding:6px 14px}' +
      '.clun-entry .ce-feats{position:fixed;z-index:41;top:calc(60px + env(safe-area-inset-top));right:calc(16px + env(safe-area-inset-right));width:230px;max-height:70vh;overflow:auto;padding:8px;border-radius:16px;background:rgba(30,36,30,.72);backdrop-filter:blur(10px);-webkit-backdrop-filter:blur(10px)}' +
      '.clun-entry .ce-feats[hidden]{display:none}.clun-entry .ce-feats h4{margin:4px 8px 8px;font:600 12px/1.3 -apple-system,"PingFang SC",sans-serif;color:rgba(255,255,255,.75)}' +
      '.clun-entry .ce-feats button{position:static;display:block;width:100%;text-align:left;margin:2px 0;background:rgba(255,255,255,.08);padding:10px 12px}' +
      '.clun-entry .ce-stick[hidden],.clun-entry .ce-help[hidden]{display:none}' +
      '.clun-entry .ce-knob{position:absolute;left:50%;top:50%;width:48px;height:48px;margin:-24px 0 0 -24px;border-radius:50%;background:rgba(255,255,255,.75);box-shadow:0 2px 8px rgba(0,0,0,.25)}' +
      '.clun-entry .ce-help{position:fixed;z-index:40;left:50%;transform:translateX(-50%);top:calc(16px + env(safe-area-inset-top));font:500 12px/1 -apple-system,"PingFang SC",sans-serif;color:#fff;padding:7px 12px;border-radius:12px;background:rgba(30,36,30,.45);pointer-events:none;white-space:nowrap}';
    document.head.appendChild(css);
    var doorEl = ui.querySelector('.ce-door'), skipEl = ui.querySelector('.ce-skip'), goEl = ui.querySelector('.ce-go'), exEl = ui.querySelector('.ce-explore'), outEl = ui.querySelector('.ce-out'), stickEl = ui.querySelector('.ce-stick'), viewEl = ui.querySelector('.ce-view'), actsEl = ui.querySelector('.ce-acts'), sitEl = ui.querySelector('.ce-sit'), readEl = ui.querySelector('.ce-read'), waveEl = ui.querySelector('.ce-wave'), door2El = ui.querySelector('.ce-door2'), menuEl = ui.querySelector('.ce-menu'), featsEl = ui.querySelector('.ce-feats'), barEl = ui.querySelector('.ce-bar'), ctxEl = ui.querySelector('.ce-ctx'), knobEl = ui.querySelector('.ce-knob'), helpEl = ui.querySelector('.ce-help');
    doorEl.addEventListener('click', function () { enter(); });
    skipEl.addEventListener('click', function () { finish(); }); goEl.addEventListener('click', function () { finish(); });
    viewEl.addEventListener('click', function () { EX.third = !EX.third; viewEl.textContent = EX.third ? '👤 第一人称' : '🧍 第三人称'; });
    exEl.addEventListener('click', function () { startExplore(); });
    sitEl.addEventListener('click', function () { if (EX.pose) standUp(); else if (EX.near) sitDown(EX.near); });
    readEl.addEventListener('click', function () { hero.act('read'); readEl.textContent = hero.reading() ? '📕 合上书' : '📖 看书'; });
    waveEl.addEventListener('click', function () { hero.act('wave'); });
    door2El.addEventListener('click', function () { if (OUT.on) { if (OUT.ctx) OUT.ctx.run(); return; } if (EX.nearFront) { goOutside(); return; } if (EX.nearDoor) toggleDoor(EX.nearDoor); });
    /* ≡：Minest 的全部功能。点一项 → 进入 Minest 的房间并打开它（外层页面负责；单独打开这个页面时只提示） */
    var FEATS = [['typewriter', '⌨️ 打字机 · Hermes'], ['quill', '🪶 羽毛笔 · 3D Type'], ['planner', '📘 日程本 · Routine'], ['board', '📌 布告栏 · 看板'], ['album', '📔 收藏册 · My World'],
      ['bookstand', '📖 知识书架'], ['aquarium', '🐙 Octo 水族缸'], ['carkey', '🔑 车钥匙 · Knowledge Drive'], ['carmodel', '🚘 老爷车 · 车载闪卡'], ['medals', '🏅 勋章'], ['projector', '🔮 全息投影仪'], ['ornament', '🌀 魔法摆件 · 主题世界']];
    featsEl.innerHTML = '<h4>Minest 的全部功能 · 点一下进入</h4>' + FEATS.map(function (f) { return '<button data-f="' + f[0] + '">' + f[1] + '</button>'; }).join('');
    menuEl.addEventListener('click', function () { featsEl.hidden = !featsEl.hidden; });
    /* 顶栏：和 Spatial Home 一样的一排按钮（默认收起，只露 ≡ 和 ✕）。🎒 🌐 🪟 ⚙ → 进 Minest 的房间打开同一个面板；🪑 👤 在这里用；✕ 进入完整的 Minest */
    barEl.classList.add('fold');
    barEl.addEventListener('click', function (e) {
      var t = e.target.closest('.ce-ic'); if (!t) return; var a = t.getAttribute('data-a');
      if (a === 'menu') { var f = !barEl.classList.contains('fold'); barEl.classList.toggle('fold', f); t.classList.toggle('on', f); return; }
      if (a === 'exit') { OUT.on = false; finish(); return; }
      if (a === 'view') { if (walk && walk.explore) viewEl.click(); t.classList.toggle('on', !EX.third); return; }
      if (a === 'sit') { if (walk && walk.explore) { if (EX.pose) standUp(); else if (EX.near) sitDown(EX.near); else toast('走到椅子、沙发或床旁边再点'); } else toast('到屋里的椅子旁边才能坐'); return; }
      roomAction(a);
    });
    function toast(t) { helpEl.textContent = t; helpEl.hidden = false; clearTimeout(toast.t); toast.t = setTimeout(function () { helpEl.hidden = true; }, 2200); }
    function roomAction(a) {
      if (!(window.parent && window.parent !== window)) { toast('在 Minest 里打开时，这里会进入房间并打开同一个面板'); return; }
      OUT.on = false; if (walk) { if (walk.explore) heroBack(); walk.done = true; walk.explore = false; }
      viewEl.hidden = actsEl.hidden = menuEl.hidden = stickEl.hidden = outEl.hidden = skipEl.hidden = barEl.hidden = true; EX.pose = null;
      veil.style.transition = 'opacity .35s'; veil.style.opacity = 1;
      try { window.parent.postMessage({ clun: 'enter', action: a }, '*'); } catch (e) {}
    }
    featsEl.addEventListener('click', function (e) { var t = e.target.closest('button'); if (t) openFeature(t.getAttribute('data-f')); });
    function openFeature(id) {
      featsEl.hidden = true;
      if (!(window.parent && window.parent !== window)) { helpEl.textContent = '在 Minest 里打开时，这里会直接进入「' + id + '」'; helpEl.hidden = false; setTimeout(function () { helpEl.hidden = true; }, 2500); return; }
      if (walk) { if (walk.explore) heroBack(); walk.done = true; walk.explore = false; }
      viewEl.hidden = actsEl.hidden = menuEl.hidden = stickEl.hidden = outEl.hidden = skipEl.hidden = barEl.hidden = true; EX.pose = null; OUT.on = false;
      veil.style.transition = 'opacity .35s'; veil.style.opacity = 1;
      try { window.parent.postMessage({ clun: 'enter', feature: id }, '*'); } catch (e) {}
    } outEl.addEventListener('click', function () { leaveExplore(); });
    if (ENTRY) document.body.classList.add('clun-entry-mode');          /* 开屏只留风景：不放「直接进入房间」、不放说明文字 */
    function post(m) { try { if (window.parent && window.parent !== window) window.parent.postMessage({ clun: m }, '*'); } catch (e) {} }
    function enter() {
      if (walk) return;
      walk = { t0: performance.now() / 1000, from: lastC ? { cx: lastC.x + lastC.w / 2, cy: lastC.y + lastC.h / 2, w: lastC.w, h: lastC.h } : null, done: false };
      doorEl.hidden = true; goEl.hidden = true; skipEl.hidden = false; exEl.hidden = false; post('entering');
    }
    function finish() {
      if (walk && walk.done) return;
      if (!walk) walk = { t0: performance.now() / 1000 - 99, from: null };
      if (walk.explore) heroBack(); walk.done = true; walk.explore = false; viewEl.hidden = true; actsEl.hidden = true; menuEl.hidden = true; featsEl.hidden = true; barEl.hidden = true; EX.pose = null; OUT.on = false; stickEl.hidden = true; skipEl.hidden = true; goEl.hidden = true; doorEl.hidden = true; exEl.hidden = true; outEl.hidden = true; stickEl.hidden = true; helpEl.hidden = true; skipEl.textContent = '跳过动画 ›';
      veil.style.transition = 'opacity .35s'; veil.style.opacity = 1;
      post('enter');
      if (!ENTRY) setTimeout(function () { walk = null; if (C.setLampLevel) C.setLampLevel(0); veil.style.transition = 'opacity .6s'; veil.style.opacity = 0; }, 1600);   /* 独立页：回到外景 */
    }
    /* —— 进屋探索：第一人称在屋里走。拖动看四周，摇杆 / WASD / 方向键走；墙、家具挡路（膝盖和胸口两条射线），
       脚下用一条向下的射线找地面，台阶不超过 0.42 m 就能走上去，所以楼梯可以上楼 —— */
    var EX = { pos: new THREE.Vector3(), yaw: 0, pitch: 0, keys: {}, stick: [0, 0], last: 0, floorY: 0, third: true, camD: 1.9 }, ray = new THREE.Raycaster(), UPV = new THREE.Vector3(0, 1, 0), DOWN = new THREE.Vector3(0, -1, 0);
    var hitList = null;
    function solids() {
      if (hitList) return hitList; hitList = [];
      house.traverse(function (o) { if (o.isMesh && o.visible && o.userData.mat !== 'glassRoof' && !/^rug:|^art:/.test(o.name)) { var g = o.parent; while (g && g.name !== 'roof' && g !== house) g = g.parent; if (!g || g.name !== 'roof') hitList.push(o); } });
      return hitList;
    }
    var allList = null;
    function allSolids() {                                                 /* 镜头和头顶净空：连屋面一起算（阁楼的斜顶就是屋面） */
      if (allList) return allList; allList = [];
      house.traverse(function (o) { if (o.isMesh && o.visible && o.userData.mat !== 'glassRoof' && o.userData.mat !== 'glass' && !/^rug:|^art:/.test(o.name)) allList.push(o); });
      return allList;
    }
    function headroom(p, floorY) { ray.set(new THREE.Vector3(p.x, floorY + 0.3, p.z), UPV); ray.far = 3; var h = ray.intersectObjects(allSolids(), false)[0]; return h ? h.distance + 0.3 : 9; }
    function floorAt(p, fromY) { ray.set(new THREE.Vector3(p.x, fromY, p.z), DOWN); ray.far = 3; var h = ray.intersectObjects(solids(), false)[0]; return h ? h.point.y : null; }
    function blocked(p, d, dist) {
      for (var k = 0; k < 2; k++) { ray.set(new THREE.Vector3(p.x, EX.floorY + (k ? 1.1 : 0.56), p.z), d); ray.far = dist; if (ray.intersectObjects(solids(), false).length) return true; }
      return false;
    }
    C._explore = { st: EX, eng: function (x, y, z) { return E(x, y, z); }, house: house };   /* 调试用 */
    function startExplore() {
      if (!walk) enter();
      var a = E(0, 1.1, 0), b = E(0, 3.0, 0); EX.floorY = (floorAt(a, a.y + 1.2) || a.y); EX.pos.set(a.x, EX.floorY + EYE, a.z);
      EX.yaw = Math.atan2(-(b.x - a.x), -(b.z - a.z)); EX.pitch = 0; EX.last = performance.now() / 1000;
      walk.explore = true; walk.done = false; veil.style.transition = 'opacity .5s'; veil.style.opacity = 0;
      skipEl.textContent = '进入房间 ›'; skipEl.hidden = false; exEl.hidden = true; outEl.hidden = false; helpEl.hidden = false; stickEl.hidden = false; viewEl.hidden = true; actsEl.hidden = false; menuEl.hidden = true; barEl.hidden = false; outEl.hidden = true; OUT.on = false;
      viewEl.textContent = EX.third ? '👤 第一人称' : '🧍 第三人称';
      setTimeout(function () { helpEl.hidden = true; }, 5000);
      post('explore');
    }
    function heroBack() { hero.release(); if (OUT.on) return; var sp = spot; spot = null; heroAt(sp || 'walk'); }
    function leaveExplore() {                                             /* 回到门外：回到外景，门上的提示重新出现 */
      walk = null; EX.keys = {}; EX.stick = [0, 0]; skipEl.hidden = true; outEl.hidden = true; stickEl.hidden = true; helpEl.hidden = true; viewEl.hidden = true; actsEl.hidden = true; menuEl.hidden = true; featsEl.hidden = true; barEl.hidden = true; EX.pose = null; heroBack(); skipEl.textContent = '跳过动画 ›';
      if (C.setLampLevel) C.setLampLevel(0); veil.style.transition = 'opacity .4s'; veil.style.opacity = 0;
    }
    /* 椅子、沙发、床（furnish.js 登记的），换算到场景里 */
    var seatsW = null;
    function seats() {
      if (seatsW) return seatsW;
      seatsW = (C.seats || []).map(function (q) {
        var p = E(q.x, q.y, q.z), f = E(q.x + Math.sin(q.r), q.y - Math.cos(q.r), q.z).sub(p); f.y = 0; f.normalize();
        return { p: p, front: f, h: q.h, kind: q.kind };
      });
      return seatsW;
    }
    function nearSeat(feet) {
      var best = null, bd = 9;
      seats().forEach(function (q) { var dx = q.p.x - feet.x, dz = q.p.z - feet.z, d = Math.hypot(dx, dz), lim = q.kind === 'lie' ? 1.5 : 1.25; if (Math.abs(q.p.y - feet.y) < 0.6 && d < lim && d < bd) { bd = d; best = q; } });
      return best;
    }
    function sitDown(q) {
      EX.pose = q; hero.pose(q.kind, q.h); sitEl.textContent = '🧍 起来'; readEl.hidden = q.kind !== 'sit'; readEl.textContent = '📖 看书';
      EX.yaw = Math.atan2(q.front.x, q.front.z) + 0.35; EX.pitch = 0.15;                        /* 镜头转到小人前方斜侧看着它 */
    }
    function standUp() {
      var q = EX.pose; if (!q) return; EX.pose = null; hero.pose(null); readEl.hidden = true;
      var out = q.p.clone().addScaledVector(q.front, q.kind === 'lie' ? 1.2 : 0.6); EX.floorY = q.p.y; EX.pos.set(out.x, q.p.y + EYE, out.z);
      EX.yaw = Math.atan2(-q.front.x, -q.front.z) + Math.PI;
    }
    function toggleDoor(d) { d.open = !d.open; }
    function doorWorld(d) { return d.pivot.getWorldPosition(new THREE.Vector3()); }
    function nearDoor(feet) { var best = null, bd = 1.3; (C.doors || []).forEach(function (d) { var p = doorWorld(d), dist = Math.hypot(p.x - feet.x, p.z - feet.z); if (Math.abs(p.y - feet.y) < 0.8 && dist < bd) { bd = dist; best = d; } }); return best; }
    function tickDoors(dt) { (C.doors || []).forEach(function (d) { var want = d.open ? 1 : 0; if (Math.abs(d.a - want) > 1e-3) { d.a += Math.sign(want - d.a) * Math.min(Math.abs(want - d.a), dt * 1.6); var e = d.a * d.a * (3 - 2 * d.a); d.pivot.rotation.z = d.base + d.side * e * 82 * Math.PI / 180; } }); }
    var tapRay = new THREE.Raycaster();
    function exploreTap(cx, cy, camera) {                                  /* 点门 → 开 / 关；点书桌上的打字机、羽毛笔 → 进 Minest 打开它 */
      var rect = renderer.domElement.getBoundingClientRect(), v = new THREE.Vector2((cx - rect.left) / rect.width * 2 - 1, -(cy - rect.top) / rect.height * 2 + 1);
      tapRay.setFromCamera(v, camera); tapRay.far = 6;
      var targets = []; (C.doors || []).forEach(function (d) { targets.push(d.pivot); }); (C.features || []).forEach(function (f) { targets.push(f.obj); });
      var hf = tapRay.intersectObjects(allSolids(), false)[0];
      if (hf && hf.object.userData.mat === 'door') { var fd2 = E(0, 0, 1.0); if (hf.point.distanceTo(fd2) < 1.6) { goOutside(); return true; } }   /* 点正门 → 出门 */
      var h = tapRay.intersectObjects(targets, true)[0]; if (!h) return false;
      var o = h.object; while (o && o.name !== 'door' && !/^feat:/.test(o.name)) o = o.parent;
      if (!o) return false;
      if (o.name === 'door') { var d = (C.doors || []).filter(function (q) { return q.pivot === o; })[0]; if (d) toggleDoor(d); return true; }
      openFeature(o.name.slice(5)); return true;
    }
    /* —— 屋外：在画里的有限范围走动（门前、左边草坪、石板路；小溪对岸石桌那片），镜头仍是底图的固定机位，画框跟着小人；
       爬树屋、玩水、踩石头过溪、进屋 —— */
    var OUT = { on: false, pos: new THREE.Vector3(), yaw: 0, act: null, ctx: null, frame: null, splash: [] };
    function inPoly(pt, poly) { var c = false; for (var i = 0, j = poly.length - 1; i < poly.length; j = i++) { var a = poly[i], b = poly[j]; if ((a[1] > pt[1]) !== (b[1] > pt[1]) && pt[0] < (b[0] - a[0]) * (pt[1] - a[1]) / (b[1] - a[1]) + a[0]) c = !c; } return c; }
    function walkable(v) { var px = toPx(v); return inPoly(px, PL.walkOut) || inPoly(px, PL.walkBank); }
    function settle(v) { var px = toPx(v); v.y = groundY(px[1]); return v; }
    var waterW = PL.waterSpots.map(function (w) { var a = onTerrain(w[0], w[1]), b = onGround(w[2], w[3]); b.y = gy - 0.2; return { at: a, water: b }; });
    var hopsW = PL.hops.map(function (h, i) { if (i === 0 || i === PL.hops.length - 1) return onTerrain(h[0], h[1]); var r = onGround(h[0], h[1]); r.y = gy - 0.1; return r; });
    var porchW = onTerrain(PL.door[0], PL.door[1] + 45);
    C._out = { st: OUT, th: function () { return TH; }, hops: function () { return hopsW; }, water: function () { return waterW; } };   /* 调试用 */
    function goOutside() {                                                  /* 从正门出去：白光一闪，站在门廊前 */
      if (walk && walk.explore) heroBack(); EX.pose = null; walk = null; OUT.on = true; OUT.act = null; OUT.frame = null;
      OUT.pos.copy(porchW); OUT.yaw = Math.atan2(cam.pos.x - porchW.x, cam.pos.z - porchW.z);
      veil.style.transition = 'none'; veil.style.opacity = 1; setTimeout(function () { veil.style.transition = 'opacity .6s'; veil.style.opacity = 0; }, 60);
      skipEl.hidden = true; outEl.hidden = true; viewEl.hidden = true; readEl.hidden = true; sitEl.hidden = true; actsEl.hidden = false; stickEl.hidden = false; barEl.hidden = false; doorEl.hidden = true; goEl.hidden = true;
      if (C.setLampLevel) C.setLampLevel(0); toast('在门前草坪和小路上走走：树屋、小溪都可以去');
    }
    function startOutdoorHere() {                                           /* 从开屏直接开始：小人从它现在站的地方走起 */
      OUT.on = true; OUT.act = null; OUT.frame = null; OUT.pos.copy(hero.root.position); settle(OUT.pos); if (!walkable(OUT.pos)) OUT.pos.copy(porchW);
      OUT.yaw = hero.root.rotation.y; actsEl.hidden = false; barEl.hidden = false; doorEl.hidden = true;
    }
    function leaveOutdoor() { OUT.on = false; OUT.act = null; hero.pose(null); ctxEl.innerHTML = ''; OUT.key = ''; TH.swing(0); }
    function goInside() { leaveOutdoor(); startExplore(); }
    function nearPt(v, d) { return Math.hypot(v.x - OUT.pos.x, v.z - OUT.pos.z) < d; }
    function outdoorCtx() {                                                 /* 现在附近能做什么 */
      if (OUT.act) {
        if (OUT.act.kind === 'deck') return { label: '⬇ 下来', run: function () { startAct('down'); } };
        if (OUT.act.kind === 'crouch') return { label: '🧍 起来', run: function () { OUT.act = null; hero.pose(null); } };
        if (OUT.act.kind === 'swing') return { label: '🧍 下来', run: function () { OUT.act.stop = performance.now() / 1000; } };
        return null;
      }
      if (nearPt(porchW, 1.0)) return { label: '🚪 进屋', run: goInside };
      if (nearPt(TH.ladder, 1.0)) {
        if (TH.moving()) return null;
        if (!TH.down()) return { label: '⬇ 放下绳梯', run: function () { TH.roll(false); } };
        return [{ label: '🪜 爬树屋', run: function () { startAct('up'); } }, { label: '🎠 荡秋千', run: function () { startAct('swing'); } }, { label: '⬆ 收起绳梯', run: function () { TH.roll(true); } }];
      }
      for (var i = 0; i < waterW.length; i++) { if (nearPt(waterW[i].at, 1.0)) { var w = waterW[i]; return { label: '💧 玩水', run: function () { startAct('water', w); } }; } }
      if (nearPt(hopsW[0], 1.0)) return { label: '🪨 踩石头过溪', run: function () { startAct('hop', hopsW); } };
      if (nearPt(hopsW[hopsW.length - 1], 1.0)) return { label: '🪨 踩石头过溪', run: function () { startAct('hop', hopsW.slice().reverse()); } };
      return null;
    }
    function startAct(kind, arg) {
      var t = performance.now() / 1000;
      if (kind === 'up') { OUT.act = { kind: 'climb', t0: t, dur: 3.2, a: TH.ladder.clone(), b: TH.ladderTop.clone() }; hero.pose('climb'); }
      else if (kind === 'down') { OUT.act = { kind: 'climbDown', t0: t, dur: 2.6, a: TH.ladderTop.clone(), b: TH.ladder.clone() }; hero.pose('climb'); }
      else if (kind === 'water') { OUT.pos.copy(arg.at); OUT.yaw = Math.atan2(arg.water.x - arg.at.x, arg.water.z - arg.at.z); OUT.act = { kind: 'crouch', water: arg.water, next: t }; hero.pose('crouch'); }
      else if (kind === 'swing') { OUT.act = { kind: 'swing', t0: t }; hero.pose('sit', 0.42); }
      else if (kind === 'hop') { OUT.act = { kind: 'hop', t0: t, pts: arg, seg: 0.55 }; hero.pose(null); }
    }
    var splashGeo = new THREE.SphereGeometry(0.035, 6, 4), splashMat = new THREE.MeshBasicMaterial({ color: 0xf2f8ff, transparent: true, opacity: 0.9 });
    function splash(at, n) { for (var i = 0; i < n; i++) { var m = new THREE.Mesh(splashGeo, splashMat.clone()); m.position.copy(at); m.userData.v = new THREE.Vector3((Math.random() - 0.5) * 1.2, 1.6 + Math.random() * 1.4, (Math.random() - 0.5) * 1.2); m.userData.t = 0; root.add(m); OUT.splash.push(m); } }
    function outdoorStep(now) {
      var dt = Math.min(0.05, now - (OUT.last || now)); OUT.last = now;
      var a = OUT.act, moving = false, faceYaw = OUT.yaw;
      if (a && (a.kind === 'climb' || a.kind === 'climbDown')) {           /* 爬上 / 爬下绳梯，到顶后走上阳台 */
        var u = Math.min(1, (now - a.t0) / a.dur); OUT.pos.lerpVectors(a.a, a.b, u); moving = true; faceYaw = TH.face;
        if (u >= 1) { if (a.kind === 'climb') { OUT.pos.copy(TH.deck); OUT.act = { kind: 'deck' }; hero.pose(null); OUT.yaw = Math.atan2(cam.pos.x - TH.deck.x, cam.pos.z - TH.deck.z); } else { OUT.act = null; hero.pose(null); } }
        hero.drive(OUT.pos, faceYaw, moving, dt);
      } else if (a && a.kind === 'hop') {                                   /* 一块石头一块石头跳过去，落水的地方溅水花 */
        var tt = (now - a.t0) / a.seg, i = Math.floor(tt), f = tt - i;
        if (i >= a.pts.length - 1) { OUT.pos.copy(a.pts[a.pts.length - 1]); OUT.act = null; }
        else { var p0 = a.pts[i], p1 = a.pts[i + 1]; OUT.pos.lerpVectors(p0, p1, f); OUT.pos.y += Math.sin(f * Math.PI) * 0.4; faceYaw = Math.atan2(p1.x - p0.x, p1.z - p0.z); OUT.yaw = faceYaw; if (a.last !== i && i > 0) { a.last = i; splash(p0, 8); } }
        hero.drive(OUT.pos, faceYaw, true, dt);
      } else if (a && a.kind === 'swing') {                                 /* 荡秋千：坐在最下一档，整条绳梯绕顶上前后摆；「下来」后慢慢停住再落地 */
        var ts = now - a.t0, amp = 0.42 * Math.min(1, ts / 1.5); if (a.stop) amp *= Math.max(0, 1 - (now - a.stop) / 1.2);
        TH.swing(amp * Math.sin(ts * 2.3)); var bt = TH.bottom(), seatPos = bt.clone().addScaledVector(TH.toCam, 0.06); seatPos.y -= 0.42;
        OUT.pos.copy(seatPos); hero.drive(seatPos, Math.atan2(TH.toCam.x, TH.toCam.z), false, dt);
        if (a.stop && now - a.stop > 1.2) { TH.swing(0); OUT.act = null; hero.pose(null); OUT.pos.copy(TH.ladder); }
      } else if (a && a.kind === 'crouch') {
        if (now > a.next) { splash(a.water, 6); a.next = now + 0.35; }
        hero.drive(OUT.pos, OUT.yaw, false, dt);
      } else if (a && a.kind === 'deck') {
        hero.drive(OUT.pos, OUT.yaw, false, dt);
      } else {                                                              /* 自由走动：摇杆往上 = 往画面里走 */
        var fwd = new THREE.Vector3(0, 0, -1).applyQuaternion(cam.quat); fwd.y = 0; fwd.normalize(); var rgt = new THREE.Vector3(-fwd.z, 0, fwd.x);
        var f2 = (EX.keys.w || EX.keys.arrowup ? 1 : 0) - (EX.keys.s || EX.keys.arrowdown ? 1 : 0) - EX.stick[1], r2 = (EX.keys.d || EX.keys.arrowright ? 1 : 0) - (EX.keys.a || EX.keys.arrowleft ? 1 : 0) + EX.stick[0], m = Math.hypot(f2, r2);
        if (m > 0.05) {
          if (m > 1) { f2 /= m; r2 /= m; }
          var mv = fwd.multiplyScalar(f2).add(rgt.multiplyScalar(r2)).multiplyScalar(1.6 * dt);
          var inside = walkable(OUT.pos);
          [mv, new THREE.Vector3(mv.x, 0, 0), new THREE.Vector3(0, 0, mv.z)].some(function (st2) { var np = settle(OUT.pos.clone().add(st2)); if (inside && !walkable(np)) return false; OUT.pos.copy(np); moving = true; return true; });   /* 万一站到了范围外（跳过溪、玩水之后），往哪走都行，好走回来 */
          if (moving) OUT.yaw = Math.atan2(mv.x, mv.z);
        }
        hero.drive(OUT.pos, OUT.yaw, moving, dt);
      }
      OUT.splash = OUT.splash.filter(function (m2) { m2.userData.t += dt; m2.userData.v.y -= 6 * dt; m2.position.addScaledVector(m2.userData.v, dt); m2.material.opacity = Math.max(0, 0.9 - m2.userData.t * 1.2); if (m2.userData.t > 0.8) { root.remove(m2); m2.material.dispose(); return false; } return true; });
      var list = outdoorCtx() || []; if (!Array.isArray(list)) list = [list];      /* 附近能做的事，可以有好几个按钮 */
      var key = list.map(function (c) { return c.label; }).join('|');
      if (key !== OUT.key) { OUT.key = key; ctxEl.innerHTML = ''; list.forEach(function (c) { var b = document.createElement('button'); b.textContent = c.label; b.addEventListener('click', function (e) { e.stopPropagation(); wake(); c.run(); }); ctxEl.appendChild(b); }); }
      door2El.hidden = true; sitEl.hidden = true;
    }
    var far0 = null, lastCam = null;
    function exploreStep(camera, va, now) {
      var dt = Math.min(0.05, now - EX.last); EX.last = now;
      var f = (EX.keys.w || EX.keys.arrowup ? 1 : 0) - (EX.keys.s || EX.keys.arrowdown ? 1 : 0) - EX.stick[1], r = (EX.keys.d ? 1 : 0) - (EX.keys.a ? 1 : 0) + EX.stick[0];
      if (EX.keys.arrowleft) EX.yaw += 1.8 * dt; if (EX.keys.arrowright) EX.yaw -= 1.8 * dt;
      var m = Math.hypot(f, r), moved = false, need = EX.third ? 1.4 : 1.7;              /* 头顶净空：第三人称小人 1.3 m，第一人称眼高 1.55 m */
      if (EX.pose && m > 0.3) standUp();
      if (!EX.pose && m > 0.05) {
        if (m > 1) { f /= m; r /= m; }
        var fw = new THREE.Vector3(-Math.sin(EX.yaw), 0, -Math.cos(EX.yaw)), rt = new THREE.Vector3(Math.cos(EX.yaw), 0, -Math.sin(EX.yaw));
        var mv = fw.multiplyScalar(f).add(rt.multiplyScalar(r)).multiplyScalar(1.5 * dt), L0 = mv.length();
        var tries = [mv.clone(), new THREE.Vector3(mv.x, 0, 0), new THREE.Vector3(0, 0, mv.z)];
        [0.6, -0.6, 1.1, -1.1].forEach(function (a) { tries.push(mv.clone().applyAxisAngle(UPV, a).multiplyScalar(0.8)); });   /* 被柱子、扶手挡住时斜着绕过去 */
        tries.some(function (step) {
          var L = step.length(); if (L < 1e-5) return false;
          var d = step.clone().normalize(); if (blocked(EX.pos, d, L + 0.3)) return false;
          var np = EX.pos.clone().add(step), fy = floorAt(np, EX.floorY + 1.0);
          if (fy == null || fy - EX.floorY > 0.5) return false;             /* 太高：家具、窗台（台阶、转角踏步不超过 0.5 m） */
          if (headroom(np, fy) < need) return false;                         /* 阁楼斜顶下太矮：不让走过去 */
          EX.pos.copy(np); EX.floorY = fy; moved = true; return true;
        });
      }
      if (!EX.pose) { var fy2 = floorAt(EX.pos, EX.floorY + 1.0); if (fy2 != null && fy2 < EX.floorY - 0.01) EX.floorY = Math.max(fy2, EX.floorY - 3 * dt); }   /* 下楼 */
      EX.pos.y += (EX.floorY + EYE - EX.pos.y) * Math.min(1, dt * 12);
      if (near0 == null) near0 = camera.near; if (far0 == null) far0 = camera.far;
      camera.near = 0.05; camera.far = 80; camera.clearViewOffset(); camera.fov = 70; camera.aspect = va; camera.updateProjectionMatrix();   /* 屋里远平面收近：深度精度够用，地毯、地板不闪 */
      lastCam = camera; tickDoors(dt);
      var feet = new THREE.Vector3(EX.pos.x, EX.floorY, EX.pos.z), q = EX.pose;
      var fd = E(0, 0.45, 0); EX.nearFront = !q && Math.hypot(fd.x - feet.x, fd.z - feet.z) < 1.15 && Math.abs(fd.y - feet.y) < 0.6;   /* 正门：出门到屋外 */
      EX.nearDoor = q || EX.nearFront ? null : nearDoor(feet); door2El.hidden = !(EX.nearDoor || EX.nearFront);
      if (EX.nearFront) door2El.textContent = '🚪 出门'; else if (EX.nearDoor) door2El.textContent = EX.nearDoor.open ? '🚪 关门' : '🚪 开门';
      if (!q) { EX.near = nearSeat(feet); sitEl.hidden = !EX.near; if (EX.near) sitEl.textContent = EX.near.kind === 'lie' ? '🛏 躺下' : '🪑 坐下'; }
      if (EX.third || q) {                                                 /* 第三人称（坐、躺时也用）：镜头在小人身后偏上，碰到墙、屋顶就拉近 */
        if (q && q.kind === 'lie') { var hd = q.front.clone().negate(), lp = q.p.clone().addScaledVector(hd, -0.62); lp.y = q.p.y + q.h + 0.14; hero.drive(lp, Math.atan2(-hd.x, -hd.z), false, dt); }
        else if (q) hero.drive(q.p, Math.atan2(q.front.x, q.front.z), false, dt);
        else hero.drive(feet, EX.yaw + Math.PI, moved, dt);
        hero.root.updateMatrixWorld(true);
        var head = hero.head.getWorldPosition(new THREE.Vector3()), pc = Math.max(-0.25, Math.min(1.0, 0.28 - EX.pitch));
        var back = new THREE.Vector3(Math.sin(EX.yaw) * Math.cos(pc), Math.sin(pc), Math.cos(EX.yaw) * Math.cos(pc));
        var side = new THREE.Vector3(Math.cos(EX.yaw), 0, -Math.sin(EX.yaw)), want = 1.9;          /* 三条射线（正中和左右各偏 12 cm）取最近的，镜头不会因为擦过细东西一下近一下远 */
        [0, 0.12, -0.12].forEach(function (o) { ray.set(head.clone().addScaledVector(side, o), back); ray.far = 2.3; var hb = ray.intersectObjects(allSolids(), false)[0]; if (hb) want = Math.min(want, Math.max(0.3, hb.distance - 0.25)); });
        EX.camD += (want - EX.camD) * Math.min(1, dt * (want < EX.camD ? 14 : 2.5));
        camera.position.copy(head).addScaledVector(back, EX.camD); camera.lookAt(head.clone().add(new THREE.Vector3(-Math.sin(EX.yaw) * 0.6, -0.1, -Math.cos(EX.yaw) * 0.6)));
      } else { hero.hide(); camera.position.copy(EX.pos); camera.rotation.set(EX.pitch, EX.yaw, 0, 'YXZ'); }
      if (C.setLampLevel) C.setLampLevel(0.45);
    }
    (function () {                                                         /* 探索时的输入：拖动看四周、键盘、摇杆 */
      var el = renderer.domElement, drag = null;
      el.addEventListener('pointerdown', function (e) { if (walk && walk.explore) drag = { x: e.clientX, y: e.clientY, id: e.pointerId }; });
      window.addEventListener('pointermove', function (e) {
        if (!drag || e.pointerId !== drag.id || !(walk && walk.explore)) return;
        EX.yaw -= (e.clientX - drag.x) * 0.005; EX.pitch = Math.max(-1.2, Math.min(1.2, EX.pitch - (e.clientY - drag.y) * 0.004)); drag.x = e.clientX; drag.y = e.clientY;
      });
      window.addEventListener('pointerup', function (e) { if (drag && e.pointerId === drag.id) drag = null; });
      window.addEventListener('keydown', function (e) { if ((walk && walk.explore) || OUT.on || (!walk && /^[wasd]$|^arrow/i.test(e.key))) { EX.keys[e.key.toLowerCase()] = true; if (/^arrow/i.test(e.key)) e.preventDefault(); } });
      window.addEventListener('keyup', function (e) { EX.keys[e.key.toLowerCase()] = false; });
      var sid = null;
      function stick(e) { var r = stickEl.getBoundingClientRect(), x = (e.clientX - r.left - r.width / 2) / (r.width / 2), y = (e.clientY - r.top - r.height / 2) / (r.height / 2), m = Math.hypot(x, y); if (m > 1) { x /= m; y /= m; } EX.stick = [x, y]; knobEl.style.transform = 'translate(' + (x * 34) + 'px,' + (y * 34) + 'px)'; }
      stickEl.addEventListener('pointerdown', function (e) { sid = e.pointerId; stickEl.setPointerCapture(e.pointerId); stick(e); e.stopPropagation(); });
      stickEl.addEventListener('pointermove', function (e) { if (e.pointerId === sid) stick(e); });
      function rel(e) { if (e.pointerId !== sid) return; sid = null; EX.stick = [0, 0]; knobEl.style.transform = ''; }
      stickEl.addEventListener('pointerup', rel); stickEl.addEventListener('pointercancel', rel);
    })();
    var WALK = { zoom: 1.3, flash: 0.35, inside: 7.0 }, near0 = null;
    function walkCamera(camera, sz, va, now) {                            /* 返回 true = 这一帧的镜头由进门动画接管 */
      if (!walk) return false;
      var t = now - walk.t0;
      if (walk.explore) { exploreStep(camera, va, now); return true; }
      if (walk.done) { if (t > 50) return true; }
      if (t < WALK.zoom && !walk.done) {                                 /* 1. 推到门口：画框收向房门 */
        var e = ease(Math.min(1, t / WALK.zoom)), to = { cx: DOOR.c[0], cy: DOOR.c[1], w: 150 * va, h: 150 };
        var fr = walk.from || frameFor(kind, va), r = lerpR(fr, to, e), c = clampRect({ cx: r.cx, cy: r.cy, w: r.w, h: r.w / va }), s = sz.x / c.w;
        veil.style.transition = 'none'; veil.style.opacity = Math.max(0, (t - (WALK.zoom - WALK.flash)) / WALK.flash).toFixed(3);
        camera.position.copy(cam.pos); camera.quaternion.copy(cam.quat); camera.fov = vfov; camera.aspect = A;
        camera.setViewOffset(PL.W * s, PL.H * s, c.x * s, c.y * s, sz.x, sz.y); camera.updateProjectionMatrix(); return true;
      }
      var u = walk.done ? 1 : Math.min(1, (t - WALK.zoom) / WALK.inside);
      if (near0 == null) near0 = camera.near; if (far0 == null) far0 = camera.far; camera.near = 0.05; camera.far = 80;   /* 屋里贴着墙和扶手走：近裁剪面 5 cm、远平面收近（深度精度够，不闪） */
      if (C.setLampLevel) C.setLampLevel(0.45 * Math.min(1, Math.max(0, (t - WALK.zoom) / 0.8)));   /* 进屋后灯慢慢亮起来（白天屋里本来就亮，灯只加一点暖光） */
      camera.clearViewOffset(); camera.fov = 64; camera.aspect = va; camera.updateProjectionMatrix();
      var U1 = 0.62, U2 = 0.7, op;                                       /* 0–U1 门厅到二楼平台；U1–U2 白光；U2–1 书房 */
      if (u < U2 - 0.04) {
        var a = Math.min(1, u / U1), k = a * a * (3 - 2 * a);
        camera.position.copy(camPath.getPointAt(k)); camera.lookAt(lookPath.getPointAt(Math.min(1, k + 0.02)));
        op = Math.max(1 - (t - WALK.zoom) / WALK.flash, (u - (U1 - 0.06)) / 0.06);
      } else {
        var b = (u - (U2 - 0.04)) / (1 - U2 + 0.04), kb = 1 - Math.pow(1 - b, 2);
        camera.position.copy(studyA).lerp(studyB, kb); camera.lookAt(studyL);
        op = Math.max(1 - (u - U2) / 0.07, (u - 0.93) / 0.07);
      }
      if (!walk.done) veil.style.opacity = Math.max(0, Math.min(1, op)).toFixed(3);
      if (u >= 1 && !walk.done) finish();
      return true;
    }
    function hitDoor(px, py) { return px > DOOR.x[0] && px < DOOR.x[1] && py > DOOR.y[0] && py < DOOR.y[1]; }
    function placeDoorHint(c, sz) {
      if (walk || trans || !uiAwake()) { doorEl.hidden = true; return; }
      var x = (DOOR.c[0] - c.x) / c.w * sz.x, y = (DOOR.c[1] - c.y) / c.h * sz.y, rect = renderer.domElement.getBoundingClientRect();
      doorEl.hidden = x < 0 || x > sz.x || y < 0 || y > sz.y; doorEl.style.left = (rect.left + x) + 'px'; doorEl.style.top = (rect.top + y + 18) + 'px';
    }
    /* 开屏 / 屋外：圆圈（门上）和摇杆只在鼠标、手指动的时候出现，5 秒没操作就藏起来（按着、正在推摇杆时不藏） */
    var AW = { last: -99, down: 0 };
    function wake() { AW.last = performance.now() / 1000; }
    function uiAwake() { return AW.down > 0 || Math.abs(EX.stick[0]) + Math.abs(EX.stick[1]) > 0.02 || performance.now() / 1000 - AW.last < 5; }
    ['pointermove', 'pointerdown', 'touchstart', 'keydown', 'wheel'].forEach(function (ev) { window.addEventListener(ev, wake, { passive: true }); });
    window.addEventListener('pointerdown', function () { AW.down++; }); window.addEventListener('pointerup', function () { AW.down = Math.max(0, AW.down - 1); }); window.addEventListener('pointercancel', function () { AW.down = Math.max(0, AW.down - 1); });
    function awakeUi() {                                                   /* 每帧：不在屋里探索时，摇杆跟着活动显示 / 隐藏 */
      if (walk && walk.explore) return;
      if (walk) { stickEl.hidden = true; return; }
      var on = uiAwake(); stickEl.hidden = !on; stickEl.style.opacity = on ? 1 : 0;
      if (OUT.on) { actsEl.hidden = !on && !OUT.act; barEl.hidden = !on; }
    }
    if (ENTRY) post('ready');

    return {
      enter: enter, skipEntry: finish, walking: function () { return !!walk; },
      tap: function (cx, cy) {                                           /* 点在房门上（底图坐标）就进门 */
        if (walk && walk.explore && lastCam) return exploreTap(cx, cy, lastCam);
        if (OUT.on) { if (lastC) { var rc = renderer.domElement.getBoundingClientRect(), ppx = lastC.x + (cx - rc.left) / rc.width * lastC.w, ppy = lastC.y + (cy - rc.top) / rc.height * lastC.h; if (hitDoor(ppx, ppy)) { leaveOutdoor(); enter(); return true; } } return false; }   /* 屋外点正门 → 进门动画 */
        if (!lastC || walk) return false;
        var rect = renderer.domElement.getBoundingClientRect(), px = lastC.x + (cx - rect.left) / rect.width * lastC.w, py = lastC.y + (cy - rect.top) / rect.height * lastC.h;
        if (hitDoor(px, py)) { enter(); return true; } return false;
      },
      root: root, holder: holder, distance: d, hero: hero,
      kind: function () { return kind; },
      tick: function (t) { var dt = lastT == null ? 0 : t - lastT; lastT = t; C.Paint.time.value = t; hero.update(t, dt); },
      limits: function (a, zoom) { return { azMax: 0.5 * (1 - (zoom || 1)) + 0.0001 }; },
      place: function (camera, O) {
        var sz = renderer.getSize(new THREE.Vector2()), va = sz.x / Math.max(1, sz.y), now = performance.now() / 1000;
        if (walkCamera(camera, sz, va, now)) return;
        awakeUi(); TH.tick(Math.min(0.05, now - (TH.lastT || now))); TH.lastT = now;
        if (!walk && !OUT.on && !trans && Math.abs(EX.stick[0]) + Math.abs(EX.stick[1]) + (EX.keys.w || EX.keys.a || EX.keys.s || EX.keys.d ? 1 : 0) > 0.15) startOutdoorHere();   /* 开屏推摇杆：小人直接在屋外走起来 */
        if (OUT.on) outdoorStep(now);
        var k = screenKind(sz.x, sz.y);
        if (k !== kind) { document.body.classList.toggle('duo-screen', (k === 'outer' || k === 'inner') && !PL.sim); var from = kind == null ? bootFrom : kind; kind = k; if (from && from !== k) { beginTransition(from, k, va, now); O.zoom = 1; O.az = O.el = 0; } else try { sessionStorage.setItem('clun.duo.kind', JSON.stringify({ k: k, t: Date.now() })); } catch (e) {} }
        var tgt = frameFor(k, va), r = tgt;
        if (OUT.on) {                                                       /* 屋外：画框跟着小人（略推近），平滑移动 */
          var hp = toPx(OUT.pos), fh = Math.min(PL.H, 640), want = { cx: hp[0], cy: hp[1] - 150, w: Math.min(PL.W, fh * va), h: Math.min(PL.W, fh * va) / va };
          OUT.frame = OUT.frame ? lerpR(OUT.frame, want, 0.08) : want; tgt = OUT.frame; r = tgt;
        } else heroAt(k !== 'outer' && shows(tgt, PL.table[1][0]) ? 'table' : 'walk');   /* 远景看得到石桌就在石桌边，否则（外屏 / 接近方形的内屏）在门前小路上 */
        if (trans) {
          var p = Math.max(0, Math.min(1, (now - trans.t0 - trans.hold) / trans.dur)), e = ease(p);
          r = lerpR(trans.from, tgt, e);
          if (trans.glow) { var g = Math.sin(Math.min(1, (now - trans.t0) / (trans.dur * 0.7)) * Math.PI); glow.style.opacity = (0.9 * g).toFixed(3); glow.style.backgroundPosition = (100 - 100 * Math.min(1, (now - trans.t0) / (trans.dur * 0.7))) + '% 0'; }
          if (p >= 1) { trans = null; glow.style.opacity = 0; }
        } else {                                                          /* 用户的推近和平移，叠在取景上 */
          var z = Math.max(0.45, Math.min(1, O.zoom || 1)); O.az = Math.max(-0.5, Math.min(0.5, O.az)); O.el = Math.max(-0.5, Math.min(0.5, O.el));
          var room = clampRect(tgt);
          r = { cx: tgt.cx - O.az * PL.W * (1 - z) * 0.9, cy: tgt.cy + O.el * PL.H * (1 - z) * 0.9, w: room.w * z, h: room.h * z };
          if (z >= 0.999) r = { cx: tgt.cx - O.az * (PL.W - room.w), cy: tgt.cy + O.el * (PL.H - room.h), w: room.w, h: room.h };
        }
        var c = clampRect({ cx: r.cx, cy: r.cy, w: r.w, h: r.w / va }), s = sz.x / c.w;
        camera.position.copy(cam.pos); camera.quaternion.copy(cam.quat);
        camera.fov = vfov; camera.aspect = A; camera.setViewOffset(PL.W * s, PL.H * s, c.x * s, c.y * s, sz.x, sz.y); camera.updateProjectionMatrix();
        lastC = c; placeDoorHint(c, sz); if (near0 != null) { camera.near = near0; near0 = null; if (far0 != null) { camera.far = far0; far0 = null; } camera.updateProjectionMatrix(); }
      },
      dispose: function () { scene.remove(root); disp.forEach(function (x) { try { x.dispose(); } catch (e) {} }); }
    };
  };
})();

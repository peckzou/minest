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
    fence: [[1962, 1080], [2000, 1080], [2012, 1190], [2018, 1300], [2020, 1438], [1680, 1438], [1680, 1395], [1730, 1360], [1870, 1205]],   /* 石桌边沿河那道木栅栏和它的影子：铺成草地 */          /* 房前那条土路：铺成草地 */
    bush: { rect: [322, 790, 560, 1046], src: [200, 70, 420, 420] },    /* 房子左前方一丛树叶（取自左上大树的叶子），挡住左端 */
    /* 动画区域（底图像素） */
    fall: [[1973, 52], [1999, 52], [1986, 320], [1967, 540], [1948, 705], [1890, 705], [1922, 540], [1946, 320]],
    fallMist: [1918, 700, 95],
    river: [[1665, 1022], [1855, 1022], [1864, 1118], [1852, 1180], [1802, 1230], [1752, 1290], [1720, 1350], [1690, 1400], [1672, 1438],
      [1198, 1438], [1218, 1368], [1280, 1318], [1380, 1268], [1488, 1218], [1578, 1168], [1628, 1108]],
    bridge: [1760, 1018],
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
    var m = PL.fallMist, gr = g.createRadialGradient(m[0] / f, m[1] / f, 0, m[0] / f, m[1] / f, m[2] / f); gr.addColorStop(0, 'rgba(0,0,255,1)'); gr.addColorStop(1, 'rgba(0,0,255,0)');
    g.fillStyle = gr; g.fillRect(0, 0, cv.width, cv.height);
    var t = new THREE.CanvasTexture(cv); t.minFilter = t.magFilter = THREE.LinearFilter; t.generateMipmaps = false; return t;
  }
  /* 底图材质：瀑布往下冲、小溪从桥下往镜头这边流（流动贴图：两相位交替采样，画面不会被越拉越远）、瀑布底水雾、云慢慢漂 */
  function backMaterial() {
    return new THREE.ShaderMaterial({ depthWrite: false,
      uniforms: { map: { value: null }, mk: { value: makeFlowMask() }, uTime: C.Paint.time, uBridge: { value: new THREE.Vector2(PL.bridge[0] / PL.W, 1 - PL.bridge[1] / PL.H) }, uAsp: { value: PL.W / PL.H } },
      vertexShader: 'varying vec2 vUv; void main(){ vUv = uv; gl_Position = projectionMatrix * modelViewMatrix * vec4(position, 1.0); }',
      fragmentShader: [
        'uniform sampler2D map, mk; uniform float uTime, uAsp; uniform vec2 uBridge; varying vec2 vUv;',
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
        '    c = mix(c, w, m.g);',
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
    /* 遮罩：原房子的轮廓，低分辨率，放大时边缘自然羽化 */
    var f = 16, mk = document.createElement('canvas'); mk.width = Math.round(W / f); mk.height = Math.round(H / f); var mg = mk.getContext('2d');
    mg.fillStyle = '#000'; mg.fillRect(0, 0, mk.width, mk.height); mg.fillStyle = '#fff'; mg.beginPath();
    [PL.mask, PL.path, PL.fence].forEach(function (poly) { mg.beginPath(); poly.forEach(function (p, i) { if (i) mg.lineTo(p[0] / f, p[1] / f); else mg.moveTo(p[0] / f, p[1] / f); }); mg.closePath(); mg.fill(); });
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
    C.Paint.toonTree(holder);

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
    hero.root.scale.setScalar(PL.heroScale);
    var spot = null;
    function heroAt(name) { if (name === spot) return; spot = name; var w = PL[name]; hero.setPath(onGround(w[0][0], w[0][1]), onGround(w[1][0], w[1][1]), cam.pos.clone()); }
    heroAt('walk');
    root.add(hero.root);

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
       再一闪进书房（南侧前间），慢慢走向凸窗 */
    var camPath = new THREE.CatmullRomCurve3([E(0, 0.55, 1.55), E(0.05, 1.6, 1.6), E(0.25, 3.3, 1.6), E(1.05, 3.85, 1.6),
      E(1.17, 2.4, 0.75 + EYE), E(1.17, 1.5, 1.55 + EYE)], false, 'centripetal');
    var lookPath = new THREE.CatmullRomCurve3([E(0, 2.5, 1.5), E(0.1, 3.5, 1.55), E(0.6, 4.3, 1.6), E(1.17, 2.6, 1.7), E(1.17, 0.9, 2.9)], false, 'centripetal');
    var studyA = E(-1.2, 2.6, F1 + EYE), studyB = E(-2.6, 1.3, F1 + EYE), studyL = E(-3.42, -0.7, F1 + 1.25);
    var veil = document.createElement('div');
    veil.style.cssText = 'position:fixed;inset:0;pointer-events:none;opacity:0;z-index:30;background:radial-gradient(circle at 50% 55%, #fffaf0, #f3e6cf);transition:none';
    document.body.appendChild(veil);
    var ui = document.createElement('div'); ui.className = 'clun-entry';
    ui.innerHTML = '<div class="ce-door" hidden><span class="ce-ring"></span><span class="ce-tip">轻点房门 · 进入</span></div>' +
      '<button class="ce-skip" hidden>跳过动画 ›</button><button class="ce-go" hidden>直接进入房间 ›</button>';
    document.body.appendChild(ui);
    var css = document.createElement('style'); css.textContent =
      '.clun-entry .ce-door{position:fixed;z-index:20;transform:translate(-50%,-50%);pointer-events:auto;cursor:pointer;display:flex;flex-direction:column;align-items:center;gap:8px}' +
      '.clun-entry .ce-door[hidden],.clun-entry button[hidden]{display:none}' +
      '.clun-entry .ce-ring{width:46px;height:46px;border-radius:50%;border:2px solid rgba(255,248,225,.95);box-shadow:0 0 18px rgba(255,235,180,.9),inset 0 0 12px rgba(255,235,180,.6);animation:cePulse 1.8s ease-in-out infinite}' +
      '.clun-entry .ce-tip{font:600 13px/1 -apple-system,"PingFang SC",sans-serif;color:#fff;padding:7px 12px;border-radius:14px;background:rgba(40,52,40,.55);backdrop-filter:blur(6px);-webkit-backdrop-filter:blur(6px);white-space:nowrap}' +
      '@keyframes cePulse{0%,100%{transform:scale(.85);opacity:.75}50%{transform:scale(1.15);opacity:1}}' +
      '.clun-entry button{position:fixed;z-index:40;right:16px;font:600 13px/1 -apple-system,"PingFang SC",sans-serif;color:#fff;border:0;padding:10px 14px;border-radius:16px;background:rgba(30,36,30,.5);backdrop-filter:blur(6px);-webkit-backdrop-filter:blur(6px);cursor:pointer}' +
      '.clun-entry .ce-skip{bottom:calc(16px + env(safe-area-inset-bottom))}.clun-entry .ce-go{top:calc(14px + env(safe-area-inset-top))}';
    document.head.appendChild(css);
    var doorEl = ui.querySelector('.ce-door'), skipEl = ui.querySelector('.ce-skip'), goEl = ui.querySelector('.ce-go');
    doorEl.addEventListener('click', function () { enter(); });
    skipEl.addEventListener('click', function () { finish(); }); goEl.addEventListener('click', function () { finish(); });
    if (ENTRY) { goEl.hidden = false; document.body.classList.add('clun-entry-mode'); }
    function post(m) { try { if (window.parent && window.parent !== window) window.parent.postMessage({ clun: m }, '*'); } catch (e) {} }
    function enter() {
      if (walk) return;
      walk = { t0: performance.now() / 1000, from: lastC ? { cx: lastC.x + lastC.w / 2, cy: lastC.y + lastC.h / 2, w: lastC.w, h: lastC.h } : null, done: false };
      doorEl.hidden = true; goEl.hidden = true; skipEl.hidden = false; post('entering');
    }
    function finish() {
      if (walk && walk.done) return;
      if (!walk) walk = { t0: performance.now() / 1000 - 99, from: null };
      walk.done = true; skipEl.hidden = true; goEl.hidden = true; doorEl.hidden = true; veil.style.transition = 'opacity .35s'; veil.style.opacity = 1;
      post('enter');
      if (!ENTRY) setTimeout(function () { walk = null; veil.style.transition = 'opacity .6s'; veil.style.opacity = 0; if (ENTRY) goEl.hidden = false; }, 1600);   /* 独立页：回到外景 */
    }
    var WALK = { zoom: 1.3, flash: 0.35, inside: 7.0 }, near0 = null;
    function walkCamera(camera, sz, va, now) {                            /* 返回 true = 这一帧的镜头由进门动画接管 */
      if (!walk) return false;
      var t = now - walk.t0;
      if (walk.done) { if (t > 50) return true; }
      if (t < WALK.zoom && !walk.done) {                                 /* 1. 推到门口：画框收向房门 */
        var e = ease(Math.min(1, t / WALK.zoom)), to = { cx: DOOR.c[0], cy: DOOR.c[1], w: 150 * va, h: 150 };
        var fr = walk.from || frameFor(kind, va), r = lerpR(fr, to, e), c = clampRect({ cx: r.cx, cy: r.cy, w: r.w, h: r.w / va }), s = sz.x / c.w;
        veil.style.transition = 'none'; veil.style.opacity = Math.max(0, (t - (WALK.zoom - WALK.flash)) / WALK.flash).toFixed(3);
        camera.position.copy(cam.pos); camera.quaternion.copy(cam.quat); camera.fov = vfov; camera.aspect = A;
        camera.setViewOffset(PL.W * s, PL.H * s, c.x * s, c.y * s, sz.x, sz.y); camera.updateProjectionMatrix(); return true;
      }
      var u = walk.done ? 1 : Math.min(1, (t - WALK.zoom) / WALK.inside);
      if (near0 == null) near0 = camera.near; camera.near = 0.05;                   /* 屋里贴着墙和扶手走：近裁剪面放到 5 cm */
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
      if (!ENTRY || walk || trans) { doorEl.hidden = true; return; }
      var x = (DOOR.c[0] - c.x) / c.w * sz.x, y = (DOOR.c[1] - c.y) / c.h * sz.y, rect = renderer.domElement.getBoundingClientRect();
      doorEl.hidden = x < 0 || x > sz.x || y < 0 || y > sz.y; doorEl.style.left = (rect.left + x) + 'px'; doorEl.style.top = (rect.top + y + 18) + 'px';
    }
    if (ENTRY) post('ready');

    return {
      enter: enter, skipEntry: finish, walking: function () { return !!walk; },
      tap: function (cx, cy) {                                           /* 点在房门上（底图坐标）就进门 */
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
        var k = screenKind(sz.x, sz.y);
        if (k !== kind) { document.body.classList.toggle('duo-screen', (k === 'outer' || k === 'inner') && !PL.sim); var from = kind == null ? bootFrom : kind; kind = k; if (from && from !== k) { beginTransition(from, k, va, now); O.zoom = 1; O.az = O.el = 0; } else try { sessionStorage.setItem('clun.duo.kind', JSON.stringify({ k: k, t: Date.now() })); } catch (e) {} }
        var tgt = frameFor(k, va), r = tgt;
        heroAt(k !== 'outer' && shows(tgt, PL.table[1][0]) ? 'table' : 'walk');   /* 远景看得到石桌就在石桌边，否则（外屏 / 接近方形的内屏）在门前小路上 */
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
        lastC = c; placeDoorHint(c, sz); if (near0 != null) { camera.near = near0; near0 = null; camera.updateProjectionMatrix(); }
      },
      dispose: function () { scene.remove(root); disp.forEach(function (x) { try { x.dispose(); } catch (e) {} }); }
    };
  };
})();

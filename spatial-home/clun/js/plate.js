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
    path: [[330, 1026], [812, 1026], [812, 1104], [330, 1104]],          /* 房前那条土路：铺成草地 */
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
    g.drawImage(img, 330, 1098, 482, 52, 330, 1028, 482, 76);          /* 土路换成正下方的草坪 */
    var sh = g.createLinearGradient(330, 0, 700, 0); sh.addColorStop(0, 'rgba(20,45,10,0.42)'); sh.addColorStop(0.65, 'rgba(20,45,10,0.3)'); sh.addColorStop(1, 'rgba(20,45,10,0)');
    g.fillStyle = sh; g.fillRect(330, 1028, 370, 76);                  /* 左边在大树的树荫里：压暗，和周围的草一致 */
    /* 遮罩：原房子的轮廓，低分辨率，放大时边缘自然羽化 */
    var f = 16, mk = document.createElement('canvas'); mk.width = Math.round(W / f); mk.height = Math.round(H / f); var mg = mk.getContext('2d');
    mg.fillStyle = '#000'; mg.fillRect(0, 0, mk.width, mk.height); mg.fillStyle = '#fff'; mg.beginPath();
    [PL.mask, PL.path].forEach(function (poly) { mg.beginPath(); poly.forEach(function (p, i) { if (i) mg.lineTo(p[0] / f, p[1] / f); else mg.moveTo(p[0] / f, p[1] / f); }); mg.closePath(); mg.fill(); });
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
      return w / h < 0.62 ? 'outer' : 'normal';
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
    return {
      root: root, holder: holder, distance: d, hero: hero,
      kind: function () { return kind; },
      tick: function (t) { var dt = lastT == null ? 0 : t - lastT; lastT = t; C.Paint.time.value = t; hero.update(t, dt); },
      limits: function (a, zoom) { return { azMax: 0.5 * (1 - (zoom || 1)) + 0.0001 }; },
      place: function (camera, O) {
        var sz = renderer.getSize(new THREE.Vector2()), va = sz.x / Math.max(1, sz.y), now = performance.now() / 1000;
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
      },
      dispose: function () { scene.remove(root); disp.forEach(function (x) { try { x.dispose(); } catch (e) {} }); }
    };
  };
})();

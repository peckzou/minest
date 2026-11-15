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
      [1172, 780], [1210, 836], [1284, 924], [1284, 1044], [1142, 1044], [1142, 1012], [808, 1012], [808, 1046]]
  };

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
    g.drawImage(band, 0, 0);
    /* 遮罩：原房子的轮廓，低分辨率，放大时边缘自然羽化 */
    var f = 16, mk = document.createElement('canvas'); mk.width = Math.round(W / f); mk.height = Math.round(H / f); var mg = mk.getContext('2d');
    mg.fillStyle = '#000'; mg.fillRect(0, 0, mk.width, mk.height); mg.fillStyle = '#fff'; mg.beginPath();
    PL.mask.forEach(function (p, i) { if (i) mg.lineTo(p[0] / f, p[1] / f); else mg.moveTo(p[0] / f, p[1] / f); }); mg.closePath(); mg.fill();
    function tex(c) { var t = new THREE.CanvasTexture(c); t.minFilter = THREE.LinearFilter; t.magFilter = THREE.LinearFilter; t.generateMipmaps = false; t.flipY = true; return t; }
    return { patch: tex(cv), mask: tex(mk) };
  }

  C.buildValley = function (scene, house, renderer) {
    var disp = [], root = new THREE.Group(); root.name = 'plate'; scene.add(root);
    var Wn = 2 * Math.tan(PL.hfov / 2 * D2R), A = PL.W / PL.H, Hn = Wn / A, vfov = 2 * Math.atan(Hn / 2) / D2R;
    var pitch = Math.atan((PL.horizon - 0.5) * Hn);                      /* 镜头略微抬头，地平线落在底图 65% 高处 */
    var cam = { pos: new THREE.Vector3(0, 0, 0), quat: new THREE.Quaternion().setFromEuler(new THREE.Euler(pitch, 0, 0, 'YXZ')) };

    /* —— 底图：挂在镜头前方远处，正好铺满整个画框 —— */
    var RB = 4000, back = new THREE.Mesh(new THREE.PlaneGeometry(Wn * RB, Hn * RB), new THREE.MeshBasicMaterial({ toneMapped: false, depthWrite: false, fog: false }));
    back.position.set(0, 0, -RB).applyQuaternion(cam.quat); back.quaternion.copy(cam.quat); back.renderOrder = -10; back.frustumCulled = false; back.visible = false; root.add(back); disp.push(back.geometry, back.material);
    var img = new Image(); img.onload = function () {
      var src = new THREE.Texture(img); src.minFilter = THREE.LinearFilter; src.generateMipmaps = false; src.needsUpdate = true;
      var pm = makePatch(img), rt = C.Paint.paintBackdrop(renderer, src, 2048, Math.round(2048 / A), { patch: pm.patch, mask: pm.mask, sky: false, haze: 0.08 });
      [src, pm.patch, pm.mask, rt].forEach(function (d) { disp.push(d); });
      back.material.map = rt.texture; back.material.needsUpdate = true; back.visible = true;
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
    house.traverse(function (o) { if (o.isMesh) { o.castShadow = true; o.receiveShadow = true; } });

    /* —— 接触阴影：房子脚下一块只接阴影的透明地面 —— */
    var ground = new THREE.Mesh(new THREE.PlaneGeometry(60, 60), new THREE.ShadowMaterial({ opacity: 0.32 }));
    ground.rotation.x = -Math.PI / 2; ground.position.copy(holder.position).add(new THREE.Vector3(0, -0.3, 0)); ground.receiveShadow = true; root.add(ground); disp.push(ground.geometry, ground.material);

    /* —— 光：和底图一样的晴天，太阳在右前上方，房子正面受光、左侧山墙稍暗 —— */
    var hemi = new THREE.HemisphereLight(0xf2f4ee, 0x667a48, 0.62); root.add(hemi);
    var sun = new THREE.DirectionalLight(0xfff1dc, 1.6); sun.position.copy(holder.position).add(new THREE.Vector3(45, 60, 40)); sun.target.position.copy(holder.position); root.add(sun, sun.target);
    sun.castShadow = true; sun.shadow.mapSize.set(2048, 2048); sun.shadow.bias = -0.0004; sun.shadow.normalBias = 0.05;
    var sc = sun.shadow.camera; sc.left = -22; sc.right = 22; sc.top = 22; sc.bottom = -22; sc.near = 10; sc.far = 200;

    /* —— 镜头：固定在底图的机位；只能推近和在底图范围内平移（裁出底图的一部分来看） —— */
    return {
      root: root, holder: holder, distance: d,
      tick: function (t) { C.Paint.time.value = t; },
      limits: function (a, zoom) { return { azMax: 0.5 * (1 - (zoom || 1)) + 0.0001 }; },
      place: function (camera, O) {
        var sz = renderer.getSize(new THREE.Vector2()), va = sz.x / Math.max(1, sz.y), fw, fh, ox, oy, z = Math.max(0.45, Math.min(1, O.zoom || 1));
        if (va > A) { fw = sz.x; fh = sz.x / A; } else { fh = sz.y; fw = sz.y * A; }        /* 底图铺满视口（多出的裁掉） */
        fw /= z; fh /= z;
        var cx = va < 1 ? 0.31 : 0.5;                                        /* 竖屏时以房子为中心 */
        O.az = Math.max(-0.5, Math.min(0.5, O.az)); O.el = Math.max(-0.5, Math.min(0.5, O.el));
        ox = Math.max(0, Math.min(fw - sz.x, fw * cx - sz.x / 2 - O.az * (fw - sz.x)));
        oy = Math.max(0, Math.min(fh - sz.y, (fh - sz.y) / 2 + O.el * (fh - sz.y)));
        camera.position.copy(cam.pos); camera.quaternion.copy(cam.quat);
        camera.fov = vfov; camera.aspect = A; camera.setViewOffset(fw, fh, ox, oy, sz.x, sz.y); camera.updateProjectionMatrix();
      },
      dispose: function () { scene.remove(root); disp.forEach(function (x) { try { x.dispose(); } catch (e) {} }); }
    };
  };
})();

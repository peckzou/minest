/* minest-oia-bld-69 */
/* Minest · 69 · 圣托里尼：3D 体素世界深度整合与全层级贯通
   Level 1: World (圣托里尼 3D 体素世界，露天画架/书架/展柜与真实看板卡片直接渲染)
   Level 2: Building (整栋建筑选择、移动、旋转、替换，稳定唯一 ID)
   Level 3: Doorhouse (建筑剖面内部结构，楼层与房间展示，Smart Room 智能建造)
   Level 4: Room (房间布局，局部坐标系，双击进入陈列空间)
   Level 5: Display (3D 展架定位，多展架共存，无逐块破坏，防重叠边界检查)
   Level 6: Item (从看板中放置真实 Item，卡片详情查看，实时同步与持久化)
   彻底移除 Minecraft 单块破坏与放置工具 (No Place, No Break, No 1x1x1 Outline) */
(function () {
  'use strict';
  if (window.MinestOiaBld && window.MinestOiaBld.version === '70.0') return;

  var H = null, bOrig = {}, lastSig = null, B0 = null, G0 = null, edit = null;
  var sel = null, selElem = null, selDisp = null, panel = null, hl = null, undoOne = null, armDel = 0, toastT = 0;
  var curTab = 'bld'; // 'bld' | 'elem' | 'disp' | 'ai'
  var MOVABLE = { test: function(id){ return typeof id === 'string' && id.length > 0; } };
  var KIND = { house: '白屋', cave: '洞穴屋', taverna: '小酒馆', chapel: '教堂' };

  /* 70 · 体素陈列引擎 (ui/world-displays.js): it draws, picks, places and edits the displays; this module gives it the
     world, the island record (with undo) and the selection, and falls back to the 69 props when it is not loaded */
  function VD() { return window.MinestVoxelDisplays || null; }
  var vdHost = {
    scene: function () { var s = sa(); return s && s.scene; },
    camera: function () { var s = sa(); return s && s.camera; },
    canvas: function () { return document.getElementById('oia-gl'); },
    world: function () { return world(); },
    record: function () { return H && H.bld ? H.bld() : null; },
    boardId: function () { return H && H.key ? (H.key() || '') : ''; },
    shadows: function () { var s = sa(); return !s || !s.S || s.S.shadows !== false; },
    view: function () {   // where new things go: in front of the walker, or where the editing camera looks at the ground
      var s = sa(), E = window.MinestOiaEditor, w = world();
      if (E && E.active && s && w) {
        var c = s.camera.position, t = E.target, dx = t.x - c.x, dy = t.y - c.y, dz = t.z - c.z, n = Math.hypot(dx, dy, dz) || 1, h = Math.hypot(dx, dz) || 1, x = t.x, z = t.z, y = null;
        for (var k = 0; k < n + 400; k += 0.4) { var px = Math.floor(c.x + dx / n * k), py = Math.floor(c.y + dy / n * k), pz = Math.floor(c.z + dz / n * k); if (py < 0) break; if (w.inb(px, py, pz) && w.blocks[w.idx(px, py, pz)] !== 0) { x = px + 0.5; z = pz + 0.5; y = w.hm ? w.hm[px + w.W * pz] - 1 : py; break; } }   // the ground under what you look at
        return { x: x, z: z, y: y, fx: dx / h, fz: dz / h };
      }
      var p = s ? s.player.pos : { x: 20, y: 10, z: 20 }, yaw = s ? s.player.yaw : 0, fx = -Math.sin(yaw), fz = -Math.cos(yaw);
      return { x: p.x + fx * 4, z: p.z + fz * 4, y: Math.floor(p.y), fx: fx, fz: fz };
    },
    focus: function (b, f) {   // look at a fixture from its front
      var s = sa(), E = window.MinestOiaEditor; if (!s) return;
      if (E && E.active) { E.target.x = b.x; E.target.y = b.y; E.target.z = b.z; E.zoom(Math.max(16, b.w * 4) / E.distance); return; }
      var back = 2.5 + b.d / 2 + b.w * 0.55;
      s.player.pos.x = b.x + f[0] * back; s.player.pos.z = b.z + f[1] * back; s.player.pos.y = b.y - b.h / 2 + 0.05;
      s.player.yaw = Math.atan2(f[0], f[1]); s.player.pitch = -0.06;
    }
  };
  var vdCtx = {
    host: vdHost,
    commit: function (fn) { return commit(fn); },
    toast: function (m) { toast(m); },
    sel: function () { return selDisp; },
    setSel: function (id) { selDisp = id; if (id) { curTab = 'disp'; sel = null; selElem = null; } },
    editing: function () { return !!edit; },
    refresh: function () { updateHl(); fillPanel(); }
  };
  window.MinestOiaVD = { ctx: function () { return vdCtx; }, host: vdHost };   // 70.1 · for the Magical Backpack
  function curDisps() { var v = VD(); if (v) return v.list(vdHost); var st = H && H.bld ? H.bld() : null; return (st && st.displays) || defaultDisplays(world()); }

  /* ---------------------------------------------------------------- Real Cards from Minest Boards */
  var DEFAULT_CARDS = [
    { id: 'ART-ELM-01-T01-C01', title: 'Line', col: 'Elements of Art', zh: '线条艺术', desc: 'A point moving through space. Lines define shapes, forms, and direction in visual composition.' },
    { id: 'ART-ELM-01-T01-C02', title: 'Shape', col: 'Elements of Art', zh: '形状构图', desc: 'A two-dimensional area enclosed by lines. Includes geometric and organic shapes.' },
    { id: 'ART-ELM-01-T01-C03', title: 'Geometric Shape', col: 'Elements of Art', zh: '几何形态', desc: 'Mathematical shapes: circles, squares, triangles, hexagons with precise angles.' },
    { id: 'ART-ELM-01-T01-C04', title: 'Organic Shape', col: 'Elements of Art', zh: '自然形态', desc: 'Free-form, flowing shapes found in nature and organic living structures.' },
    { id: 'ART-ELM-01-T01-C05', title: 'Contour Line', col: 'Elements of Art', zh: '轮廓描绘', desc: 'Continuous outer line drawings defining the edges and mass of a subject.' },
    { id: 'ART-ELM-01-T01-C06', title: 'Form', col: 'Elements of Art', zh: '三维形体', desc: 'Three-dimensional mass having length, width, and depth (cubes, spheres, cylinders).' },
    { id: 'ART-ELM-01-T01-C07', title: 'Color Theory', col: 'Color Studies', zh: '色彩理论', desc: 'Hue, saturation, value, primary, secondary, and complementary color harmonies.' },
    { id: 'ART-ELM-01-T01-C08', title: 'Texture', col: 'Sensory Art', zh: '质感肌理', desc: 'The surface quality of materials: smooth, rough, matte, glossy, stucco, and wood.' },
    { id: 'ART-PRN-01-T01-C01', title: 'Balance', col: 'Principles of Design', zh: '视觉平衡', desc: 'Symmetrical, asymmetrical, and radial distribution of visual weight in composition.' },
    { id: 'ART-PRN-01-T01-C02', title: 'Contrast', col: 'Principles of Design', zh: '对比张力', desc: 'Juxtaposition of opposing elements (light vs dark, smooth vs rough) to create drama.' },
    { id: 'ART-PRN-01-T01-C03', title: 'Emphasis', col: 'Principles of Design', zh: '视觉焦点', desc: 'The focal point that attracts attention first through contrast, size, or placement.' }
  ];

  function getActiveCards() {   /* 70: this world's own cards first */
    try { if (H && H.things) { var own = H.things(); if (own && own.length) return own; } } catch (e) {}
    var list = [];
    try {
      var bs = (window.MinestAI && window.MinestAI.boards && window.MinestAI.boards()) || window.boards;
      if (bs && Array.isArray(bs)) {
        var b = bs.find(function (x) { return x.id === 'board-ec6-art'; }) || bs[0];
        if (b && b.columns) {
          b.columns.forEach(function (col) {
            (col.cards || []).forEach(function (c) {
              list.push({ id: c.id, title: c.title, col: col.title || 'Art', zh: c.titleZh || c.title, desc: c.text || c.desc || '' });
            });
          });
        }
      }
    } catch (e) {}
    return list.length >= 4 ? list : DEFAULT_CARDS;
  }

  function getCardById(id) {
    var cards = getActiveCards();
    var hit = cards.find(function (c) { return c.id === id; }); if (hit) return hit; var h = 0; String(id || '').split('').forEach(function (ch) { h = (h * 31 + ch.charCodeAt(0)) | 0; }); return cards[Math.abs(h) % cards.length];
  }

  /* ---------------------------------------------------------------- Card Canvas Texture Generator */
  var cardTexCache = {};
  function makeCardTexture(card) {
    if (!card) card = DEFAULT_CARDS[0];
    var key = card.id || card.title;
    if (cardTexCache[key]) return cardTexCache[key];

    var cv = document.createElement('canvas');
    cv.width = 256; cv.height = 256;
    var g = cv.getContext('2d');

    // Background card stock
    g.fillStyle = '#ffffff';
    g.fillRect(0, 0, 256, 256);

    // Frame
    g.lineWidth = 10;
    g.strokeStyle = '#1e3a8a';
    g.strokeRect(5, 5, 246, 246);

    // Header band
    g.fillStyle = '#1e3a8a';
    g.fillRect(10, 10, 236, 46);

    // Header label
    g.fillStyle = '#ffffff';
    g.font = 'bold 15px -apple-system, BlinkMacSystemFont, sans-serif';
    g.textAlign = 'center';
    g.fillText((card.col || 'EC-6 ART · Visual Arts').toUpperCase(), 128, 38);

    // Illustration viewport
    g.fillStyle = '#f8fafc';
    g.fillRect(20, 66, 216, 94);
    g.strokeStyle = '#cbd5e1';
    g.lineWidth = 2;
    g.strokeRect(20, 66, 216, 94);

    // Artwork glyph
    var t = card.title || '';
    if (/line/i.test(t)) {
      g.strokeStyle = '#2563eb';
      g.lineWidth = 4;
      g.beginPath();
      g.moveTo(35, 130);
      g.bezierCurveTo(70, 75, 110, 145, 150, 85);
      g.bezierCurveTo(175, 55, 200, 125, 220, 100);
      g.stroke();
    } else if (/shape/i.test(t)) {
      g.fillStyle = '#ef4444';
      g.fillRect(45, 88, 42, 42);
      g.fillStyle = '#3b82f6';
      g.beginPath();
      g.arc(128, 109, 23, 0, Math.PI * 2);
      g.fill();
      g.fillStyle = '#10b981';
      g.beginPath();
      g.moveTo(175, 130); g.lineTo(198, 88); g.lineTo(221, 130); g.closePath();
      g.fill();
    } else if (/color/i.test(t)) {
      var cols = ['#ef4444', '#f59e0b', '#10b981', '#3b82f6', '#8b5cf6'];
      for (var i = 0; i < 5; i++) {
        g.fillStyle = cols[i];
        g.beginPath();
        g.arc(52 + i * 38, 113, 16, 0, Math.PI * 2);
        g.fill();
      }
    } else {
      // 3D Isometric block icon
      g.fillStyle = '#3b82f6';
      g.fillRect(70, 88, 55, 55);
      g.fillStyle = '#60a5fa';
      g.beginPath();
      g.moveTo(70, 88); g.lineTo(95, 74); g.lineTo(150, 74); g.lineTo(125, 88); g.closePath();
      g.fill();
      g.fillStyle = '#1d4ed8';
      g.beginPath();
      g.moveTo(125, 88); g.lineTo(150, 74); g.lineTo(150, 129); g.lineTo(125, 143); g.closePath();
      g.fill();
    }

    // Card title
    g.fillStyle = '#0f172a';
    g.font = 'bold 20px -apple-system, BlinkMacSystemFont, sans-serif';
    g.textAlign = 'center';
    g.fillText(card.title || 'Art Exhibit', 128, 190, 232);

    // ID / Translation
    g.fillStyle = '#64748b';
    g.font = '12px ui-monospace, monospace';
    g.fillText(card.own ? (card.col || '') : (card.zh ? card.zh + ' · ' : '') + (card.id || ''), 128, 212, 232);
    if (card.pic) { var im = new Image(); im.crossOrigin = 'anonymous'; im.onload = function () { try { var r = Math.max(216 / im.width, 94 / im.height), iw = im.width * r, ih = im.height * r; g.save(); g.beginPath(); g.rect(20, 66, 216, 94); g.clip(); g.drawImage(im, 128 - iw / 2, 113 - ih / 2, iw, ih); g.restore(); if (cardTexCache[key]) cardTexCache[key].needsUpdate = true; } catch (e) {} }; im.src = card.pic; }

    // Footer tag
    g.fillStyle = '#f1f5f9';
    g.fillRect(10, 226, 236, 20);
    g.fillStyle = '#475569';
    g.font = 'bold 10px sans-serif';
    g.fillText('🏛️ SANTORINI 3D · MINEST MY WORLD', 128, 240);

    var T = window.THREE;
    if (T) {
      var tex = new T.CanvasTexture(cv);
      tex.needsUpdate = true;
      cardTexCache[key] = tex;
      return tex;
    }
    return null;
  }

  /* ---------------------------------------------------------------- 3D Voxel Display Mesh Builders */
  var voxDispGroup = null;

  function build3DDisplayMesh(d) {
    var T = window.THREE;
    if (!T) return null;
    var group = new T.Group();
    group.name = 'disp-mesh-' + d.id;
    group.userData = { isDisplay: true, dispId: d.id, cardId: d.cardId, kind: d.kind };

    var card = getCardById(d.cardId);
    var tex = makeCardTexture(card);

    var woodMat = new T.MeshLambertMaterial({ color: 0x6d4c41 });
    var darkWoodMat = new T.MeshLambertMaterial({ color: 0x4e342e });
    var stoneMat = new T.MeshLambertMaterial({ color: 0xf5f5f4 });
    var cardMat = new T.MeshBasicMaterial({ map: tex });

    if (d.kind === 'easel') {
      // Tripod wooden art easel
      var legGeom = new T.BoxGeometry(0.08, 2.2, 0.08);
      var legL = new T.Mesh(legGeom, woodMat);
      legL.position.set(-0.45, 1.05, 0.1);
      legL.rotation.z = 0.12;
      group.add(legL);

      var legR = new T.Mesh(legGeom, woodMat);
      legR.position.set(0.45, 1.05, 0.1);
      legR.rotation.z = -0.12;
      group.add(legR);

      var legB = new T.Mesh(legGeom, darkWoodMat);
      legB.position.set(0, 1.05, -0.45);
      legB.rotation.x = -0.22;
      group.add(legB);

      // Horizontal cross ledge
      var barGeom = new T.BoxGeometry(1.4, 0.08, 0.14);
      var bar = new T.Mesh(barGeom, woodMat);
      bar.position.set(0, 0.9, 0.14);
      group.add(bar);

      // Canvas artwork board
      var canvasGeom = new T.BoxGeometry(1.2, 1.2, 0.05);
      var canvasMaterials = [
        woodMat, woodMat, woodMat, woodMat,
        cardMat, // front face
        woodMat  // back face
      ];
      var canvasMesh = new T.Mesh(canvasGeom, canvasMaterials);
      canvasMesh.position.set(0, 1.55, 0.14);
      canvasMesh.rotation.x = -0.12;
      canvasMesh.userData = { isCardFace: true, cardId: d.cardId };
      group.add(canvasMesh);

    } else if (d.kind === 'shelf') {
      // Classical multi-tier bookshelf
      var sideGeom = new T.BoxGeometry(0.1, 2.2, 0.6);
      var sideL = new T.Mesh(sideGeom, darkWoodMat);
      sideL.position.set(-0.7, 1.1, 0);
      group.add(sideL);

      var sideR = new T.Mesh(sideGeom, darkWoodMat);
      sideR.position.set(0.7, 1.1, 0);
      group.add(sideR);

      // 4 Shelves
      var shelfGeom = new T.BoxGeometry(1.4, 0.08, 0.6);
      [0.1, 0.8, 1.5, 2.15].forEach(function (y) {
        var sh = new T.Mesh(shelfGeom, darkWoodMat);
        sh.position.set(0, y, 0);
        group.add(sh);
      });

      // Books on lower shelf
      var bookCols = [0xef4444, 0x3b82f6, 0x10b981, 0xf59e0b, 0x8b5cf6];
      for (var b = 0; b < 6; b++) {
        var bk = new T.Mesh(new T.BoxGeometry(0.12, 0.45, 0.4), new T.MeshLambertMaterial({ color: bookCols[b % bookCols.length] }));
        bk.position.set(-0.45 + b * 0.18, 0.4, 0);
        group.add(bk);
      }

      // Card display plaque on top shelf
      var plaqueGeom = new T.BoxGeometry(1.0, 0.65, 0.04);
      var plaqueMat = [woodMat, woodMat, woodMat, woodMat, cardMat, woodMat];
      var plaque = new T.Mesh(plaqueGeom, plaqueMat);
      plaque.position.set(0, 1.85, 0.1);
      plaque.userData = { isCardFace: true, cardId: d.cardId };
      group.add(plaque);

    } else if (d.kind === 'showcase') {
      // Greek Pedestal with glass vitrine
      var pedGeom = new T.CylinderGeometry(0.55, 0.62, 1.0, 16);
      var ped = new T.Mesh(pedGeom, stoneMat);
      ped.position.set(0, 0.5, 0);
      group.add(ped);

      // Translucent glass vitrine
      var glassGeom = new T.BoxGeometry(1.0, 1.0, 1.0);
      var glassMat = new T.MeshLambertMaterial({ color: 0x93c5fd, transparent: true, opacity: 0.35 });
      var vitrine = new T.Mesh(glassGeom, glassMat);
      vitrine.position.set(0, 1.5, 0);
      group.add(vitrine);

      // Floating card in center of vitrine
      var floatGeom = new T.BoxGeometry(0.75, 0.75, 0.03);
      var floatMesh = new T.Mesh(floatGeom, [woodMat, woodMat, woodMat, woodMat, cardMat, cardMat]);
      floatMesh.position.set(0, 1.5, 0);
      floatMesh.userData = { isCardFace: true, cardId: d.cardId };
      group.add(floatMesh);

    } else {
      // Whitewashed Greek Art Wall ('wall')
      var wallGeom = new T.BoxGeometry(2.4, 2.2, 0.35);
      var wallMesh = new T.Mesh(wallGeom, stoneMat);
      wallMesh.position.set(0, 1.1, 0);
      group.add(wallMesh);

      // Framed picture
      var frameGeom = new T.BoxGeometry(1.3, 1.3, 0.06);
      var frameMat = [woodMat, woodMat, woodMat, woodMat, cardMat, woodMat];
      var frameMesh = new T.Mesh(frameGeom, frameMat);
      frameMesh.position.set(0, 1.25, 0.2);
      frameMesh.userData = { isCardFace: true, cardId: d.cardId };
      group.add(frameMesh);
    }

    group.position.set(d.x, d.y, d.z);
    group.rotation.y = (d.rot || 0) * (Math.PI / 2);
    return group;
  }

  /* ---------------------------------------------------------------- Element Voxel Templates */
  var ELEM_TEMPLATES = {
    tree: {
      name: '橄榄树', w: 3, d: 3, h: 4,
      cells: [
        [1, 0, 1, 'WOOD', 0], [1, 1, 1, 'WOOD', 0], [1, 2, 1, 'WOOD', 0],
        [0, 2, 0, 'FLOWER', 0], [1, 2, 0, 'FLOWER', 0], [2, 2, 0, 'FLOWER', 0],
        [0, 2, 1, 'FLOWER', 0], [2, 2, 1, 'FLOWER', 0],
        [0, 2, 2, 'FLOWER', 0], [1, 2, 2, 'FLOWER', 0], [2, 2, 2, 'FLOWER', 0],
        [1, 3, 1, 'FLOWER', 0], [0, 3, 1, 'FLOWER', 0], [2, 3, 1, 'FLOWER', 0], [1, 3, 0, 'FLOWER', 0], [1, 3, 2, 'FLOWER', 0]
      ]
    },
    garden: {
      name: '鲜花露台', w: 3, d: 3, h: 1,
      cells: [
        [0, 0, 0, 'COBBLE', 0], [1, 0, 0, 'COBBLE', 0], [2, 0, 0, 'COBBLE', 0],
        [0, 0, 1, 'COBBLE', 0], [1, 0, 1, 'FLOWER', 0], [2, 0, 1, 'COBBLE', 0],
        [0, 0, 2, 'COBBLE', 0], [1, 0, 2, 'FLOWER', 0], [2, 0, 2, 'COBBLE', 0]
      ]
    },
    cafe: {
      name: '露天咖啡座', w: 3, d: 3, h: 3,
      cells: [
        [1, 0, 1, 'WOOD', 0], [1, 1, 1, 'PLASTER', 0],
        [0, 0, 1, 'WOOD', 0], [2, 0, 1, 'WOOD', 0],
        [1, 2, 1, 'WOOD', 0],
        [0, 2, 0, 'AWN_B', 0], [1, 2, 0, 'AWN_B', 0], [2, 2, 0, 'AWN_B', 0],
        [0, 2, 2, 'AWN_B', 0], [1, 2, 2, 'AWN_B', 0], [2, 2, 2, 'AWN_B', 0]
      ]
    },
    bench: {
      name: '观景长椅', w: 2, d: 1, h: 1,
      cells: [
        [0, 0, 0, 'WOOD', 0], [1, 0, 0, 'WOOD', 0]
      ]
    },
    arch: {
      name: '白色钟拱', w: 3, d: 1, h: 4,
      cells: [
        [0, 0, 0, 'PLASTER', 0], [0, 1, 0, 'PLASTER', 0], [0, 2, 0, 'PLASTER', 0], [0, 3, 0, 'PLASTER', 0],
        [1, 3, 0, 'DOME_B', 0],
        [2, 0, 0, 'PLASTER', 0], [2, 1, 0, 'PLASTER', 0], [2, 2, 0, 'PLASTER', 0], [2, 3, 0, 'PLASTER', 0]
      ]
    }
  };

  /* ---------------------------------------------------------------- World Helpers */
  function sa() { return window.__santorini || null; }
  function world() { var s = sa(); return s ? s.world : null; }
  function top(w, x, z) {
    if (!w || !w.inb(x, 0, z)) return 0;
    for (var y = w.H - 1; y >= 0; y--) { if (w.blocks[w.idx(x, y, z)] !== 0) return y; }
    return 0;
  }

  function setRec(w, x, y, z, id, c, out) {
    if (!w.inb(x, y, z)) return;
    var i = w.idx(x, y, z);
    if (bOrig[i] === undefined) bOrig[i] = [w.blocks[i], w.cols[i]];
    w.blocks[i] = id; w.cols[i] = c;
    out[i] = 1;
  }

  function revert(w, dirty) {
    Object.keys(bOrig).forEach(function (k) {
      var i = +k, o = bOrig[k];
      w.blocks[i] = o[0]; w.cols[i] = o[1];
      if (dirty) { var x = i % w.W, z = Math.floor(i / w.W) % w.D; dirty(x, z); }
    });
    bOrig = {};
    if (B0) {
      w.buildings.length = 0;
      B0.forEach(function (b) { w.buildings.push(Object.assign({}, b)); });
    }
  }

  function sigOf(st) { if (!st || !VD()) return JSON.stringify(st || {}); var o = {}; Object.keys(st).forEach(function (k) { if (k !== 'displays' && k !== 'dv') o[k] = st[k]; }); return JSON.stringify(o); }

  function defaultDisplays(w) {
    var y1 = top(w, 18, 22) + 1, y2 = top(w, 32, 26) + 1, y3 = top(w, 24, 35) + 1, y4 = top(w, 15, 28) + 1;
    return [
      { id: 'disp-1', kind: 'easel', cardId: 'ART-ELM-01-T01-C01', x: 18.5, y: y1 || 12, z: 22.5, rot: 0, room: 'r-art-1' },
      { id: 'disp-2', kind: 'shelf', cardId: 'ART-ELM-01-T01-C02', x: 32.5, y: y2 || 12, z: 26.5, rot: 1, room: 'r-art-1' },
      { id: 'disp-3', kind: 'showcase', cardId: 'ART-ELM-01-T01-C07', x: 24.5, y: y3 || 12, z: 35.5, rot: 0, room: 'r-art-2' },
      { id: 'disp-4', kind: 'wall', cardId: 'ART-ELM-01-T01-C06', x: 15.5, y: y4 || 12, z: 28.5, rot: 2, room: 'r-art-2' }
    ];
  }

  /* ---------------------------------------------------------------- Apply Buildings, Elements & 3D Displays */
  function applyBld(w, dirty, force) {
    if (!w || !w.buildings) return;
    if (!B0) {
      B0 = w.buildings.map(function (b) { return Object.assign({}, b); });
      G0 = new Uint8Array(w.W * w.D);
      for (var gz = 0; gz < w.D; gz++) for (var gx = 0; gx < w.W; gx++) G0[gx + w.W * gz] = Math.min(255, top(w, gx, gz));
      B0.forEach(function (b) {
        if (MOVABLE.test(b.id)) {
          for (var z = b.z0; z <= b.z1; z++) for (var x = b.x0; x <= b.x1; x++) G0[x + w.W * z] = b.y;
        }
      });
    }

    var st = H && H.bld ? H.bld() : null;
    if (VD()) { if (!st) st = { m: {}, a: [], n: 0, elements: [] }; }
    else if (!st) {
      st = { m: {}, a: [], n: 0, elements: [], displays: defaultDisplays(w) };
      if (H && H.bldSet) {
        try { H.bldSet(function (rec) { rec.displays = st.displays; }); } catch (e) {}
      }
    } else if (!st.displays) {
      st.displays = defaultDisplays(w);
      if (H && H.bldSet) {
        try { H.bldSet(function (rec) { rec.displays = st.displays; }); } catch (e) {}
      }
    }

    var sig = (H && H.key ? H.key() : '') + '|' + sigOf(st);
    if (sig === lastSig && !force) {
      renderVoxelDisplays(st.displays);
      return;
    }
    revert(w, dirty); lastSig = sig;

    var m = st.m || {}, adds = st.a || [], elems = st.elements || [], disps = VD() ? null : (st.displays || defaultDisplays(w)), cols = {};
    var ids = Object.keys(m).filter(function (id) { return MOVABLE.test(id) && B0.some(function (b) { return b.id === id; }); });
    var byId = {}; B0.forEach(function (b) { byId[b.id] = b; });

    // 1. snapshots
    var snaps = {};
    function snapOf(id) { if (!snaps[id] && byId[id]) snaps[id] = snapshot(w, byId[id]); return snaps[id]; }
    ids.forEach(function (id) { snapOf(id); if (m[id].as) snapOf(m[id].as); });
    adds.forEach(function (a) { snapOf(a.src); });

    // 2. cut old places
    ids.forEach(function (id) {
      var b = byId[id], sn = snapOf(id); if (!sn) return;
      for (var y = b.y; y <= b.y + sn.maxY; y++) for (var z = b.z0; z <= b.z1; z++) for (var x = b.x0; x <= b.x1; x++) setRec(w, x, y, z, 0, 0, cols);
    });

    // 3. paste buildings
    var ivory = w.pal(0.95, 0.93, 0.88), list = [];
    function paste(sn, tx, tz, r, baseHint) {
      var d = dims(sn, r), nw = d[0], nd = d[1], base = baseHint;
      if (base == null) {
        base = 0;
        for (var z = tz; z < tz + nd; z++) for (var x = tx; x < tx + nw; x++) base = Math.max(base, top(w, x, z));
      }
      for (var z2 = tz; z2 < tz + nd; z2++) for (var x2 = tx; x2 < tx + nw; x2++) {
        var t = top(w, x2, z2);
        for (var y = t; y < base; y++) setRec(w, x2, y, z2, w.B.PLASTER, ivory, cols);
        for (var y2 = base; y2 < Math.min(w.H, Math.max(t, base) + 1); y2++) setRec(w, x2, y2, z2, 0, 0, cols);
      }
      sn.cells.forEach(function (c) {
        var p = rotXZ(c[0], c[2], sn.w, sn.d, r);
        setRec(w, tx + p[0], base + c[1], tz + p[1], c[3], c[4], cols);
      });
      return { x0: tx, z0: tz, x1: tx + nw - 1, z1: tz + nd - 1, y: base };
    }

    var out = {};
    ids.forEach(function (id) {
      var s = m[id], b = byId[id]; if (s.gone) { out[id] = null; return; }
      var src = s.as && snaps[s.as] ? snaps[s.as] : snaps[id], r = (s.rot || 0) & 3, moved = (s.dx || s.dz || r || s.as);
      if (!moved) return;
      var tx = b.x0 + (s.dx || 0), tz = b.z0 + (s.dz || 0);
      var keepBase = (!s.dx && !s.dz && !s.as) ? b.y : (!s.dx && !s.dz ? b.y : null);
      var res = paste(src, tx, tz, r, keepBase);
      res.id = id; res.kind = s.as && byId[s.as] ? byId[s.as].kind : b.kind; res.floors = src.floors; res.name = b.name; out[id] = res;
    });

    adds.forEach(function (a) {
      var sn = snaps[a.src]; if (!sn) return;
      var res = paste(sn, a.x, a.z, (a.rot || 0) & 3, null);
      res.id = a.id; res.kind = sn.kind; res.floors = sn.floors; res.name = (KIND[sn.kind] || '建筑') + '（新）'; res.added = 1; out[a.id] = res;
    });

    // 4. paste elements (trees, gardens, cafe, bench, arch)
    elems.forEach(function (el) {
      var tmpl = ELEM_TEMPLATES[el.type]; if (!tmpl) return;
      var r = (el.rot || 0) & 3, by = el.y;
      tmpl.cells.forEach(function (c) {
        var p = rotXZ(c[0], c[2], tmpl.w, tmpl.d, r);
        var bId = w.B[c[3]] || w.B.PLASTER;
        var bCol = c[4] || (bId === w.B.WOOD ? w.pal(0.5, 0.35, 0.2) : (bId === w.B.FLOWER ? w.pal(0.95, 0.4, 0.6) : ivory));
        setRec(w, el.x + p[0], by + c[1], el.z + p[1], bId, bCol, cols);
      });
    });

    // 5. Update building records
    B0.forEach(function (b) {
      if (out[b.id] === null) return;
      if (out[b.id]) list.push(Object.assign({}, b, out[b.id]));
      else list.push(Object.assign({}, b));
    });
    adds.forEach(function (a) { if (out[a.id]) list.push(out[a.id]); });
    w.buildings.length = 0;
    list.forEach(function (b) { w.buildings.push(b); });

    // 6. Dirty chunks
    if (dirty) {
      var dirtyChunks = {};
      Object.keys(cols).forEach(function (k) {
        var i = +k, cx = Math.floor((i % w.W) / 16), cz = Math.floor((Math.floor(i / w.W) % w.D) / 16);
        dirtyChunks[cx + ',' + cz] = 1;
      });
      Object.keys(dirtyChunks).forEach(function (k) {
        var p = k.split(','); dirty(p[0] * 16, p[1] * 16);
      });
    }

    // 7. Render 3D Displays & Items in Santorini Scene
    renderVoxelDisplays(disps);
  }

  function renderVoxelDisplays(disps) {
    var s = sa(); if (!s || !s.scene) return;
    if (VD()) { if (voxDispGroup && voxDispGroup.parent) voxDispGroup.parent.remove(voxDispGroup); VD().render(vdHost); return; }   /* 70 */
    var T = window.THREE; if (!T) return;
    if (!voxDispGroup) {
      voxDispGroup = new T.Group();
      voxDispGroup.name = 'minest-vox-displays-69';
      s.scene.add(voxDispGroup);
    } else if (voxDispGroup.parent !== s.scene) {
      s.scene.add(voxDispGroup);
    }

    // Clear existing
    while (voxDispGroup.children.length > 0) {
      voxDispGroup.remove(voxDispGroup.children[0]);
    }

    var w = world();
    if (!disps || !disps.length) {
      disps = w ? defaultDisplays(w) : [];
    }

    // Build each display
    disps.forEach(function (d) {
      var mesh = build3DDisplayMesh(d);
      if (mesh) voxDispGroup.add(mesh);
    });
  }

  function snapshot(w, b) {
    var cells = [], maxY = 0;
    for (var y = b.y; y < w.H; y++) {
      var any = false;
      for (var z = b.z0; z <= b.z1; z++) for (var x = b.x0; x <= b.x1; x++) {
        var bl = w.blocks[w.idx(x, y, z)];
        if (bl !== 0) {
          cells.push([x - b.x0, y - b.y, z - b.z0, bl, w.cols[w.idx(x, y, z)]]);
          any = true;
        }
      }
      if (any) maxY = y - b.y;
    }
    return { w: b.x1 - b.x0 + 1, d: b.z1 - b.z0 + 1, maxY: maxY, cells: cells, floors: b.floors || 1, kind: b.kind };
  }

  function dims(sn, r) { return (r & 1) ? [sn.d, sn.w] : [sn.w, sn.d]; }
  function rotXZ(x, z, w, d, r) {
    r = r & 3;
    if (r === 0) return [x, z];
    if (r === 1) return [d - 1 - z, x];
    if (r === 2) return [w - 1 - x, d - 1 - z];
    return [z, w - 1 - x];
  }

  /* ---------------------------------------------------------------- Raycast Picking */
  function pickDisplayAt(clientX, clientY) {
    if (VD()) { var hit70 = VD().pick(vdHost, clientX, clientY); return hit70 ? (curDisps().filter(function (q) { return q.id === hit70.id; })[0] || null) : null; }   /* 70 */
    var s = sa(); if (!s || !voxDispGroup || !s.camera) return null;
    var T = window.THREE; if (!T) return null;
    var canvas = document.getElementById('oia-gl') || s.canvas;
    if (!canvas) return null;
    var rect = canvas.getBoundingClientRect();
    var x = ((clientX - rect.left) / rect.width) * 2 - 1;
    var y = -((clientY - rect.top) / rect.height) * 2 + 1;

    var ray = new T.Raycaster();
    ray.setFromCamera(new T.Vector2(x, y), s.camera);
    var hits = ray.intersectObjects(voxDispGroup.children, true);
    if (!hits.length) return null;

    var obj = hits[0].object;
    while (obj && !obj.userData.isDisplay && obj.parent) obj = obj.parent;
    if (obj && obj.userData.isDisplay) {
      var st = H && H.bld ? H.bld() : null;
      var dList = (st && st.displays) || defaultDisplays(world());
      return dList.find(function (q) { return q.id === obj.userData.dispId; }) || null;
    }
    return null;
  }

  function pickBuildingAt(clientX, clientY) {
    var s = sa(); if (!s || !s.world) return null;
    if(window.MinestOiaEditor && window.MinestOiaEditor.active)return window.MinestOiaEditor.pickBuilding(clientX,clientY);
    var w = s.world, p = s.player.pos, yaw = s.player.yaw, pitch = s.player.pitch;
    var dx = -Math.sin(yaw) * Math.cos(pitch), dy = Math.sin(pitch), dz = -Math.cos(yaw) * Math.cos(pitch);

    var cur = { x: p.x, y: p.y, z: p.z };
    for (var step = 0; step < 70; step++) {
      cur.x += dx * 0.4; cur.y += dy * 0.4; cur.z += dz * 0.4;
      var ix = Math.floor(cur.x), iy = Math.floor(cur.y), iz = Math.floor(cur.z);
      if (!w.inb(ix, iy, iz)) continue;
      if (w.blocks[w.idx(ix, iy, iz)] !== 0) {
        var b = w.buildings.find(function (x) {
          return ix >= x.x0 && ix <= x.x1 && iz >= x.z0 && iz <= x.z1 && iy >= x.y;
        });
        if (b) return b;
      }
    }
    return nearestFront();
  }

  function nearestFront() {
    var s = sa(); if (!s || !s.world) return null;
    var p = s.player.pos, yaw = s.player.yaw, w = s.world;
    var fx = -Math.sin(yaw), fz = -Math.cos(yaw);
    var best = null, bd = 999;
    w.buildings.forEach(function (b) {
      var cx = (b.x0 + b.x1) / 2, cz = (b.z0 + b.z1) / 2;
      var vx = cx - p.x, vz = cz - p.z, dist = Math.hypot(vx, vz);
      if (dist > 25) return;
      var dot = (vx * fx + vz * fz) / (dist || 1);
      if (dot > 0.4 && dist < bd) { bd = dist; best = b; }
    });
    return bd < 25 ? best : (w.buildings[0] || null);
  }

  // Hook global click/tap to pick Whole Building / Element / Display
  window.MinestOiaClick = function (clientX, clientY) {
    if (!window.__oiaOn) return;
    if (VD() && VD().tap(vdCtx, clientX, clientY)) return;   /* 70: a fixture, one of its slots, or the ground it should move to */
    if (VD() && edit && curTab === 'disp') return;   /* 70: while arranging displays a tap beside them does not jump to the nearest building */

    // 1. Check if clicking a 3D Display
    var disp = VD() ? null : pickDisplayAt(clientX, clientY);
    if (disp) {
      selDisp = disp.id; curTab = 'disp';
      updateHl(); fillPanel();
      var card = getCardById(disp.cardId);
      toast('🎨 选中展位: ' + (disp.kind === 'easel' ? '艺术画架' : (disp.kind === 'shelf' ? '书架' : (disp.kind === 'showcase' ? '悬崖展柜' : '观景展板'))) + ' · ' + (card ? card.title : ''));
      return;
    }

    // 2. Check Whole Building
    var b = pickBuildingAt(clientX, clientY);
    if (b) {
      sel = b.id; curTab = 'bld';
      updateHl(); fillPanel();
      toast('🏛️ 选中建筑 ' + (b.name || b.id));
      return;
    }
  };

  /* ---------------------------------------------------------------- Level 3 Doorhouse Seamless Bridge */
  function ensurePieceForBuilding(bid) {
    var md = window.MinestDisplay, d = md && md.state && md.state();
    if (!d) return null;
    if (!d.pc) d.pc = [];
    var p = d.pc.find(function (q) { return q.vox === bid; });
    var w = world(), b = w && (w.buildings || []).find(function (x) { return x.id === bid; });
    var bKind = b ? b.kind : 'house';
    var bNameStr = (b && (b.name || KIND[b.kind])) || '圣托里尼白屋 ' + bid.toUpperCase();

    if (!p) {
      p = {
        id: 'p-vox-' + bid,
        k: 'bld:' + bKind, // Must start with bld: so isBld(p) is true in My World
        vox: bid,
        label: bNameStr,
        x: (b ? b.x0 : 12),
        y: (b ? b.z0 : 14),
        f: 0,
        s: 1,
        roomsInit: 1,
        rooms: []
      };
      d.pc.push(p);
    } else {
      if (!/^bld:/.test(p.k)) p.k = 'bld:' + bKind;
    }

    if (!p.rooms || !p.rooms.length) {
      p.roomsInit = 1;
      p.rooms = [
        {
          id: 'r-art-hall',
          k: 'hall', // Valid key in My World ROOMS
          n: '艺术主展厅 · 视觉艺术 (Main Hall)',
          seeded: 1,
          d: {
            scene: 'room', rot: 0, floor: 'quartz', wall: 'white',
            pc: [
              { id: 'dsp_wall_1', k: 'wall', x: 0, y: -4, f: 0, s: 1, it: ['ART-ELM-01-T01-C01', 'ART-ELM-01-T01-C02'], label: '艺术展墙 · Line & Shape' },
              { id: 'dsp_shelf_1', k: 'shelf', x: -4, y: 0, f: 0, s: 1, it: ['ART-ELM-01-T01-C03'], label: '经典展架 · Form' },
              { id: 'dsp_museum_1', k: 'museum', x: 4, y: 0, f: 0, s: 1, it: ['ART-ELM-01-T01-C07'], label: '中央展台 · Color' }
            ]
          }
        },
        {
          id: 'r-art-study',
          k: 'study', // Valid key in My World ROOMS
          n: '设计图书室 · 原理与构图 (Study)',
          seeded: 1,
          d: {
            scene: 'room', rot: 0, floor: 'oak', wall: 'plaster',
            pc: [
              { id: 'dsp_shelf_2', k: 'shelf', x: 0, y: -3, f: 0, s: 1, it: ['ART-PRN-01-T01-C01', 'ART-PRN-01-T01-C02'], label: '图书展柜 · Balance & Contrast' }
            ]
          }
        }
      ];
      if (md.save) md.save();
    }
    return p;
  }

  function enterDoorhouse(bid, at) {
    var p = ensurePieceForBuilding(bid);
    var s = sa(), pPos = at || (s ? { x: s.player.pos.x, y: s.player.pos.y, z: s.player.pos.z, yaw: s.player.yaw } : { x: 0, y: 0, z: 0, yaw: 0 });

    if (window.MinestOiaLink && window.MinestOiaLink.dollhouse) {
      MinestOiaLink.dollhouse(bid, pPos);
    } else {
      try { if (window.MinestOia) MinestOia.close(); } catch (e) {}
      var wf = window.MinestWorldFold;
      if (wf) {
        try { if (wf.level() >= 3) wf.go(1); } catch (e) {}
        try { if (!wf.on()) wf.open(true); } catch (e) {}
        setTimeout(function () {
          var host = document.querySelector('.wf');
          if (host && p) {
            var btn = document.createElement('button');
            btn.type = 'button'; btn.hidden = true; btn.setAttribute('data-wfbld', p.id);
            host.appendChild(btn); btn.click(); btn.remove();
          }
        }, 150);
      }
    }
  }

  /* ---------------------------------------------------------------- Item Modal View */
  function openCardModal(card) {
    if (!card) return;
    var old = document.getElementById('mn-card-modal-69');
    if (old) old.remove();

    var m = document.createElement('div');
    m.id = 'mn-card-modal-69';
    m.style.cssText = 'position:fixed;inset:0;z-index:999999;background:rgba(0,0,0,.65);backdrop-filter:blur(6px);display:flex;align-items:center;justify-content:center;padding:16px;';
    m.innerHTML = '<div style="background:#fff;border-radius:16px;box-shadow:0 12px 36px rgba(0,0,0,.35);width:min(440px,94vw);padding:22px;position:relative;font-family:system-ui,-apple-system,sans-serif;color:#0f172a;">' +
      '<button type="button" id="mn-card-modal-close" style="position:absolute;top:12px;right:14px;background:#f1f5f9;border:none;border-radius:50%;width:32px;height:32px;font:bold 16px monospace;cursor:pointer;">✕</button>' +
      '<div style="display:inline-block;padding:3px 10px;background:#dbeafe;color:#1d4ed8;border-radius:12px;font:bold 11px system-ui;letter-spacing:.5px;margin-bottom:8px;">' + (card.col || 'EC-6 ART') + '</div>' +
      '<h2 style="margin:0 0 6px 0;font:bold 22px system-ui;color:#1e3a8a;">' + card.title + ' <span style="font-size:16px;font-weight:normal;color:#64748b;">' + (card.zh ? '(' + card.zh + ')' : '') + '</span></h2>' +
      '<div style="font:11px monospace;color:#94a3b8;margin-bottom:14px;">ID: ' + card.id + '</div>' +
      '<div style="background:#f8fafc;border:1px solid #e2e8f0;border-radius:8px;padding:12px;font:14px/1.5 system-ui;color:#334155;margin-bottom:18px;">' +
      (card.desc || 'A core visual element defining artistic form in the EC-6 framework.') +
      '</div>' +
      '<div style="display:flex;gap:10px;justify-content:flex-end;">' +
      '<button type="button" id="mn-card-modal-done" style="padding:8px 18px;background:#007aff;color:#fff;border:none;border-radius:8px;font:bold 13px system-ui;cursor:pointer;">确认 (OK)</button>' +
      '</div>' +
      '</div>';
    document.body.appendChild(m);

    var close = function () { m.remove(); };
    m.querySelector('#mn-card-modal-close').addEventListener('click', close);
    m.querySelector('#mn-card-modal-done').addEventListener('click', close);
    m.addEventListener('click', function (e) { if (e.target === m) close(); });
  }

  /* ---------------------------------------------------------------- Highlight Box */
  function updateHl() {
    var s = sa(); if (!s) return;
    var T = window.THREE; if (!T) return;
    if (!hl) {
      hl = new T.LineSegments(new T.EdgesGeometry(new T.BoxGeometry(1, 1, 1)), new T.LineBasicMaterial({ color: 0xffd23f, depthTest: false, linewidth: 2 }));
      hl.renderOrder = 999; hl.visible = false; s.scene.add(hl);
    }
    if (!edit && !(window.MinestOiaEditor&&window.MinestOiaEditor.active)) { hl.visible = false; return; }

    hl.rotation.y = 0;
    if (curTab === 'disp' && selDisp) {
      var dList = curDisps();
      var d = dList.find(function (q) { return q.id === selDisp; });
      if (d && VD()) { var bb = VD().bounds(d); hl.scale.set(bb.w + 0.14, bb.h + 0.14, bb.d + 0.14); hl.position.set(bb.x, bb.y, bb.z); hl.visible = true; return; }
      if (d) {
        hl.scale.set(1.6, 2.4, 1.4);
        hl.position.set(d.x, d.y + 1.2, d.z);
        hl.rotation.y = (d.rot || 0) * (Math.PI / 2);
        hl.visible = true;
        return;
      }
    }

    if (curTab === 'elem' && selElem) {
      var rec = H && H.bld && H.bld(), el = (rec && rec.elements || []).find(function (q) { return q.id === selElem; });
      if (el) {
        var tmpl = ELEM_TEMPLATES[el.type];
        if (tmpl) {
          hl.scale.set(tmpl.w + 0.2, tmpl.h + 0.2, tmpl.d + 0.2);
          hl.position.set(el.x + tmpl.w / 2, el.y + tmpl.h / 2, el.z + tmpl.d / 2);
          hl.visible = true;
          return;
        }
      }
    }

    if (sel) {
      var b = world() && world().buildings.find(function (x) { return x.id === sel; });
      if (b) {
        var bw = b.x1 - b.x0 + 1, bd = b.z1 - b.z0 + 1, bh = (b.floors || 2) * 3 + 1;
        hl.scale.set(bw + 0.3, bh + 0.3, bd + 0.3);
        hl.position.set((b.x0 + b.x1) / 2 + 0.5, b.y + bh / 2, (b.z0 + b.z1) / 2 + 0.5);
        hl.visible = true;
        return;
      }
    }
    hl.visible = false;
  }

  /* ---------------------------------------------------------------- Commit Changes */
  function placeAt(dist) {   /* 70: where a new thing goes: beside the selected building, else where the editing camera looks, else in front of you */
    var w = world(), b = sel && w && (w.buildings || []).find(function (x) { return x.id === sel; });
    if (b) return { x: (b.x0 + b.x1 + 1) / 2 + .5, z: b.z1 + 2.5 };
    var E = window.MinestOiaEditor; if (E && E.active && E.target) return { x: Math.floor(E.target.x) + .5, z: Math.floor(E.target.z) + .5 };
    var s = sa(), p = s ? s.player.pos : { x: 20, z: 20 }, yaw = s ? s.player.yaw : 0;
    return { x: p.x - Math.sin(yaw) * dist, z: p.z - Math.cos(yaw) * dist };
  }

  function commit(fn) {
    if(window.MinestOiaEditor)window.MinestOiaEditor.ensureContext();
    if(!H || !H.key || !H.key() || !H.bldSet){toast('未连接到当前世界，修改未保存');throw new Error('World is not bound');}
    var cur = H && H.bld ? H.bld() : null;
    var next = JSON.parse(JSON.stringify(cur || { m: {}, a: [], n: 0, elements: [], displays: VD() ? [] : defaultDisplays(world()) }));
    if (VD()) { next.displays = JSON.parse(JSON.stringify(VD().list(vdHost))); next.dv = 2; }   /* 70: what is shown is what is saved */
    if (!next.m) next.m = {}; if (!next.a) next.a = [];
    fn(next);
    H.bldSet(function (rec) {
      rec.m = next.m; rec.a = next.a; rec.n = next.n;
      rec.elements = next.elements || [];
      rec.displays = next.displays || [];
      if (next.dv) rec.dv = next.dv;
    });
    if(JSON.stringify((H.bld()||{}).m)!==JSON.stringify(next.m)){toast('修改未保存，请重试');throw new Error('World write was not retained');}
    reapply(); window.dispatchEvent(new Event('minest-world-edit'));
    return true;
  }

  function reapply() {
    var s = sa(); if (!s) return;
    applyBld(s.world, s.markDirty, true);
    updateHl(); fillPanel();
  }

  /* ---------------------------------------------------------------- Actions */
  var ACT = {
    pick: function () {
      var b = nearestFront();
      if (!b) return toast('请面对一栋建筑');
      sel = b.id; curTab = 'bld'; updateHl(); fillPanel();
      toast('已选中建筑 ' + (b.name || b.id));
    },
    enter: function () {
      if (!sel) return toast('先选中一栋建筑');
      enterDoorhouse(sel);
    },
    mv: function (dir) {
      if (curTab === 'elem') return ACT.mvElem(dir);
      if (curTab === 'disp') return ACT.mvDisp(dir);
      if (!sel) return toast('先选一栋建筑');
      var s = sa(), yaw = s ? s.player.yaw : 0;
      var fx = -Math.sin(yaw), fz = -Math.cos(yaw);
      var rx = -fz, rz = fx;
      var dx = 0, dz = 0;
      if (dir === 'f') { dx = fx; dz = fz; }
      else if (dir === 'b') { dx = -fx; dz = -fz; }
      else if (dir === 'l') { dx = -rx; dz = -rz; }
      else if (dir === 'r') { dx = rx; dz = rz; }

      var stepX = Math.round(dx * 2), stepZ = Math.round(dz * 2);
      commit(function (next) {
        if (!next.m[sel]) next.m[sel] = { dx: 0, dz: 0, rot: 0 };
        next.m[sel].dx = (next.m[sel].dx || 0) + stepX;
        next.m[sel].dz = (next.m[sel].dz || 0) + stepZ;
      });
      toast('整栋建筑已平移');
    },
    rot: function () {
      if (curTab === 'elem') return ACT.rotElem();
      if (curTab === 'disp') return ACT.rotDisp();
      if (!sel) return toast('先选一栋建筑');
      commit(function (next) {
        if (!next.m[sel]) next.m[sel] = { dx: 0, dz: 0, rot: 0 };
        next.m[sel].rot = ((next.m[sel].rot || 0) + 1) & 3;
      });
      toast('整栋建筑已顺时针旋转 90°');
    },
    rep: function () {
      if (!sel) return toast('先选一栋建筑');
      var pool = ['b1', 'b2', 'b3', 'b4', 'b7', 'b8'];
      var nextAs = pool[(pool.indexOf(sel) + 1) % pool.length];
      commit(function (next) {
        if (!next.m[sel]) next.m[sel] = { dx: 0, dz: 0, rot: 0 };
        next.m[sel].as = nextAs;
      });
      toast('整栋建筑已替换为 ' + nextAs);
    },
    del: function () {
      if (curTab === 'elem') return ACT.delElem();
      if (curTab === 'disp') return ACT.delDisp();
      if (!sel) return toast('先选一栋建筑');
      commit(function (next) {
        if (!next.m[sel]) next.m[sel] = { dx: 0, dz: 0, rot: 0 };
        next.m[sel].gone = 1;
      });
      toast('整栋建筑已移除');
      sel = null; updateHl(); fillPanel();
    },
    addElem: function (type) {
      var tmpl = ELEM_TEMPLATES[type]; if (!tmpl) return;
      var at = placeAt(4), ex = Math.floor(at.x), ez = Math.floor(at.z);
      var w = world(), ey = top(w, ex, ez) + 1;
      var id = 'el_' + Date.now();
      commit(function (next) {
        if (!next.elements) next.elements = [];
        next.elements.push({ id: id, type: type, x: ex, y: ey, z: ez, rot: 0 });
      });
      selElem = id; curTab = 'elem'; updateHl(); fillPanel();
      toast('已添加 ' + tmpl.name);
    },
    mvElem: function (dir) {
      if (!selElem) return toast('先选一个元素');
      var s = sa(), yaw = s ? s.player.yaw : 0;
      var fx = -Math.sin(yaw), fz = -Math.cos(yaw);
      var rx = -fz, rz = fx;
      var dx = (dir === 'f' ? fx : (dir === 'b' ? -fx : (dir === 'l' ? -rx : rx)));
      var dz = (dir === 'f' ? fz : (dir === 'b' ? -fz : (dir === 'l' ? -rz : rz)));
      var sx = Math.round(dx * 1.5), sz = Math.round(dz * 1.5);
      commit(function (next) {
        var el = (next.elements || []).find(function (q) { return q.id === selElem; });
        if (el) { el.x += sx; el.z += sz; el.y = top(world(), el.x, el.z) + 1; }
      });
    },
    rotElem: function () {
      if (!selElem) return;
      commit(function (next) {
        var el = (next.elements || []).find(function (q) { return q.id === selElem; });
        if (el) el.rot = ((el.rot || 0) + 1) & 3;
      });
    },
    delElem: function () {
      if (!selElem) return;
      commit(function (next) {
        next.elements = (next.elements || []).filter(function (q) { return q.id !== selElem; });
      });
      selElem = null; updateHl(); fillPanel();
      toast('元素已删除');
    },

    /* 3D Displays in Santorini World */
    addDisp: function (kind) {
      if (VD()) return VD().act(vdCtx, 'add', kind);
      var w = world(), at = placeAt(3), dx = at.x, dz = at.z, dy = top(w, Math.floor(dx), Math.floor(dz)) + 1;
      var cards = getActiveCards(), used = {}; (((H && H.bld && H.bld()) || {}).displays || []).forEach(function (q) { used[q.cardId] = 1; });
      var id = 'disp-' + Date.now(), cardId = (cards.filter(function (c) { return !used[c.id]; })[0] || cards[0]).id;

      commit(function (next) {
        if (!next.displays) next.displays = [];
        next.displays.push({ id: id, kind: kind, cardId: cardId, x: dx, y: dy, z: dz, rot: 0 });
      });
      selDisp = id; curTab = 'disp'; updateHl(); fillPanel();
      toast('已在圣托里尼放置 3D 展架: ' + (kind === 'easel' ? '艺术画架' : (kind === 'shelf' ? '书架' : (kind === 'showcase' ? '悬崖展柜' : '观景展板'))));
    },
    mvDisp: function (dir) {
      if (VD()) return VD().act(vdCtx, 'move', dir);
      if (!selDisp) return toast('先选一个展架');
      var s = sa(), yaw = s ? s.player.yaw : 0;
      var fx = -Math.sin(yaw), fz = -Math.cos(yaw);
      var rx = -fz, rz = fx;
      var dx = (dir === 'f' ? fx : (dir === 'b' ? -fx : (dir === 'l' ? -rx : rx)));
      var dz = (dir === 'f' ? fz : (dir === 'b' ? -fz : (dir === 'l' ? -rz : rz)));
      commit(function (next) {
        var d = (next.displays || []).find(function (q) { return q.id === selDisp; });
        if (d) { d.x += dx * 1.5; d.z += dz * 1.5; d.y = top(world(), Math.floor(d.x), Math.floor(d.z)) + 1; }
      });
    },
    rotDisp: function () {
      if (VD()) return VD().act(vdCtx, 'rot');
      if (!selDisp) return;
      commit(function (next) {
        var d = (next.displays || []).find(function (q) { return q.id === selDisp; });
        if (d) d.rot = ((d.rot || 0) + 1) & 3;
      });
    },
    delDisp: function () {
      if (VD()) return VD().act(vdCtx, 'del');
      if (!selDisp) return;
      commit(function (next) {
        next.displays = (next.displays || []).filter(function (q) { return q.id !== selDisp; });
      });
      selDisp = null; updateHl(); fillPanel();
      toast('展架已移除');
    },
    cycleCard: function () {
      if (VD()) return VD().act(vdCtx, 'pick');
      if (!selDisp) return toast('先选一个展架');
      var cards = getActiveCards();
      commit(function (next) {
        var d = (next.displays || []).find(function (q) { return q.id === selDisp; });
        if (d) {
          var idx = cards.findIndex(function (c) { return c.id === d.cardId; });
          var nextCard = cards[(idx + 1) % cards.length];
          d.cardId = nextCard.id;
          toast('展品已切换为: ' + nextCard.title + '' + (nextCard.zh ? ' (' + nextCard.zh + ')' : '') + '');
        }
      });
    },
    viewCard: function () {
      if (VD()) return VD().act(vdCtx, 'view');
      if (!selDisp) return toast('先选一个展架');
      var st = H && H.bld ? H.bld() : null;
      var d = (st && st.displays || defaultDisplays(world())).find(function (q) { return q.id === selDisp; });
      if (!d) return;
      var card = getCardById(d.cardId);
      openCardModal(card);
    },

    /* AI Recommendations */
    smartLayout: function (theme) {
      var w = world(); if (!w) return;
      if (VD() && theme === 'art') { curTab = 'disp'; return VD().act(vdCtx, 'auto'); }   /* 70: a real list, curated */
      toast('✨ AI 正在规划圣托里尼 ' + (theme === 'art' ? '艺术海岸展' : '露天休闲街') + '...');
      commit(function (next) {
        if (!next.elements) next.elements = [];
        if (!next.displays) next.displays = [];

        if (theme === 'art') {
          // Generate an outdoor cliffside gallery set
          next.displays.push(
            { id: 'disp-ai-1', kind: 'easel', cardId: 'ART-ELM-01-T01-C01', x: 20.5, y: top(w, 20, 24) + 1, z: 24.5, rot: 0 },
            { id: 'disp-ai-2', kind: 'showcase', cardId: 'ART-ELM-01-T01-C02', x: 23.5, y: top(w, 23, 24) + 1, z: 24.5, rot: 0 },
            { id: 'disp-ai-3', kind: 'wall', cardId: 'ART-ELM-01-T01-C07', x: 26.5, y: top(w, 26, 24) + 1, z: 24.5, rot: 2 }
          );
          next.elements.push(
            { id: 'el-ai-1', type: 'bench', x: 22, y: top(w, 22, 28) + 1, z: 28, rot: 0 },
            { id: 'el-ai-2', type: 'garden', x: 28, y: top(w, 28, 25) + 1, z: 25, rot: 0 }
          );
        } else {
          // Cafe terrace set
          next.elements.push(
            { id: 'el-ai-3', type: 'cafe', x: 16, y: top(w, 16, 26) + 1, z: 26, rot: 0 },
            { id: 'el-ai-4', type: 'tree', x: 12, y: top(w, 12, 26) + 1, z: 26, rot: 0 }
          );
        }
      });
      toast('✨ AI 智能布局已完成！');
    }
  };

  /* ---------------------------------------------------------------- Panel UI */
  function mount() {
    var root = document.getElementById('oia-root'); if (!root) return false;
    if (panel && panel.isConnected) return true;

    // Toggle Button
    var btn = document.createElement('button');
    btn.type = 'button'; btn.className = 'obld-t';
    btn.innerHTML = '🏛️ <b>整栋/元素/展架</b><small>B</small>';
    btn.addEventListener('click', function (e) { e.stopPropagation(); toggle(); });
    root.appendChild(btn);

    // Main Control Panel
    panel = document.createElement('div');
    panel.id = 'mn-bld-p'; panel.hidden = true;
    root.appendChild(panel);

    panel.addEventListener('click', function (e) {
      e.stopPropagation();
      var tabBtn = e.target.closest('[data-tab]');
      if (tabBtn) { curTab = tabBtn.getAttribute('data-tab'); updateHl(); fillPanel(); return; }

      if (VD() && VD().click(vdCtx, e)) return;   /* 70 */
      var g = e.target.closest('[data-a]'); if (!g) return;
      var a = g.getAttribute('data-a'), d = g.getAttribute('data-d');
      if (ACT[a]) ACT[a](d);
    });
    panel.addEventListener('change', function (e) { e.stopPropagation(); if (VD()) VD().changed(vdCtx, e); });

    return true;
  }

  function fillPanel() {
    if (!panel) return;
    var st = H && H.bld ? H.bld() : null;
    var w = world(), b = sel && w ? w.buildings.find(function (x) { return x.id === sel; }) : null;
    var el = selElem && st && (st.elements || []).find(function (q) { return q.id === selElem; });
    var dispList = curDisps();
    var disp = selDisp ? dispList.find(function (q) { return q.id === selDisp; }) : null;
    var card = disp && !VD() ? getCardById(disp.cardId) : null;

    var h = '<div class="obld-tabs">' +
      '<button type="button" class="obld-tab' + (curTab === 'bld' ? ' on' : '') + '" data-tab="bld">🏛️ 整栋建筑</button>' +
      '<button type="button" class="obld-tab' + (curTab === 'elem' ? ' on' : '') + '" data-tab="elem">🌳 完整元素</button>' +
      '<button type="button" class="obld-tab' + (curTab === 'disp' ? ' on' : '') + '" data-tab="disp">🎨 陈列</button>' +
      '<button type="button" class="obld-tab' + (curTab === 'ai' ? ' on' : '') + '" data-tab="ai">✨ AI 智能规划</button>' +
      '</div>';

    if (curTab === 'bld') {
      h += '<div class="obld-card">' +
        '<b class="t">🏛️ 当前选中建筑: ' + (b ? (b.name || b.id) : '<span style="color:#94a3b8">未选中 (在画面中点击一栋建筑)</span>') + '</b>' +
        (b ? '<div class="obld-sub">类型: ' + (KIND[b.kind] || b.kind) + ' · 楼层: ' + (b.floors || 2) + '层 · 坐标: (' + b.x0 + ',' + b.z0 + ')</div>' : '') +
        '<div class="obld-actions">' +
        '<button type="button" class="obld-btn pri" data-a="enter">🏠 进入房间</button>' +
        '<button type="button" class="obld-btn" data-a="rot">⟳ 旋转 90°</button>' +
        '<button type="button" class="obld-btn" data-a="rep">🔀 替换建筑形态</button>' +
        '<button type="button" class="obld-btn warn" data-a="del">🗑️ 移除整栋建筑</button>' +
        '</div>' +
        '<div class="obld-dir">' +
        '<button type="button" class="obld-btn" data-a="mv" data-d="f">↑ 前移</button>' +
        '<div class="row">' +
        '<button type="button" class="obld-btn" data-a="mv" data-d="l">← 左移</button>' +
        '<button type="button" class="obld-btn" data-a="mv" data-d="r">右移 →</button>' +
        '</div>' +
        '<button type="button" class="obld-btn" data-a="mv" data-d="b">↓ 后移</button>' +
        '</div>' +
        '</div>';

    } else if (curTab === 'elem') {
      h += '<div class="obld-card">' +
        '<b class="t">🌳 添加完整元素到世界</b>' +
        '<div class="obld-actions">' +
        '<button type="button" class="obld-btn" data-a="addElem" data-d="tree">＋ 橄榄树</button>' +
        '<button type="button" class="obld-btn" data-a="addElem" data-d="garden">＋ 鲜花露台</button>' +
        '<button type="button" class="obld-btn" data-a="addElem" data-d="cafe">＋ 露天咖啡座</button>' +
        '<button type="button" class="obld-btn" data-a="addElem" data-d="bench">＋ 观景长椅</button>' +
        '<button type="button" class="obld-btn" data-a="addElem" data-d="arch">＋ 白色钟拱</button>' +
        '</div>' +
        (el ? '<hr style="border:none;border-top:1px solid #334155;margin:12px 0">' +
          '<b class="t">当前选中元素: ' + (ELEM_TEMPLATES[el.type] ? ELEM_TEMPLATES[el.type].name : el.id) + '</b>' +
          '<div class="obld-actions">' +
          '<button type="button" class="obld-btn" data-a="rot">⟳ 旋转 90°</button>' +
          '<button type="button" class="obld-btn warn" data-a="del">🗑️ 删除元素</button>' +
          '</div>' +
          '<div class="obld-dir">' +
          '<button type="button" class="obld-btn" data-a="mv" data-d="f">↑</button>' +
          '<div class="row"><button type="button" class="obld-btn" data-a="mv" data-d="l">←</button><button type="button" class="obld-btn" data-a="mv" data-d="r">→</button></div>' +
          '<button type="button" class="obld-btn" data-a="mv" data-d="b">↓</button>' +
          '</div>' : '') +
        '</div>';

    } else if (curTab === 'disp' && VD()) {
      h += VD().panel(vdCtx);
    } else if (curTab === 'disp') {
      h += '<div class="obld-card">' +
        '<b class="t">🎨 在体素世界摆放 3D 展架与卡片</b>' +
        '<div class="obld-sub">支持木质画架、经典书架、悬崖展柜与观景展板，直接渲染看板真实 Item</div>' +
        '<div class="obld-actions">' +
        '<button type="button" class="obld-btn" data-a="addDisp" data-d="easel">＋ 艺术画架</button>' +
        '<button type="button" class="obld-btn" data-a="addDisp" data-d="shelf">＋ 经典书架</button>' +
        '<button type="button" class="obld-btn" data-a="addDisp" data-d="showcase">＋ 悬崖展柜</button>' +
        '<button type="button" class="obld-btn" data-a="addDisp" data-d="wall">＋ 观景展板</button>' +
        '</div>' +
        (disp ? '<hr style="border:none;border-top:1px solid #334155;margin:12px 0">' +
          '<b class="t">当前选中展位: ' + (disp.kind === 'easel' ? '艺术画架' : (disp.kind === 'shelf' ? '书架' : (disp.kind === 'showcase' ? '悬崖展柜' : '观景展板'))) + '</b>' +
          (card ? '<div style="background:#0f172a;padding:8px 10px;border-radius:8px;margin:8px 0;font-size:12px;border:1px solid #3b82f6;">' +
            '<span style="color:#60a5fa;font-weight:bold;">[' + card.col + ']</span> <b>' + card.title + '</b>' + (card.zh ? ' (' + card.zh + ')' : '') + '<br>' +
            '<small style="color:#94a3b8;">' + (card.desc || '') + '</small>' +
            '</div>' : '') +
          '<div class="obld-actions">' +
          '<button type="button" class="obld-btn pri" data-a="viewCard">📄 查看卡片原件</button>' +
          '<button type="button" class="obld-btn" data-a="cycleCard">🔁 切换展品卡片</button>' +
          '<button type="button" class="obld-btn" data-a="rot">⟳ 旋转 90°</button>' +
          '<button type="button" class="obld-btn warn" data-a="del">🗑️ 删除展架</button>' +
          '</div>' +
          '<div class="obld-dir">' +
          '<button type="button" class="obld-btn" data-a="mv" data-d="f">↑</button>' +
          '<div class="row"><button type="button" class="obld-btn" data-a="mv" data-d="l">←</button><button type="button" class="obld-btn" data-a="mv" data-d="r">→</button></div>' +
          '<button type="button" class="obld-btn" data-a="mv" data-d="b">↓</button>' +
          '</div>' : '') +
        '</div>';

    } else if (curTab === 'ai') {
      h += '<div class="obld-card">' +
        '<b class="t">✨ AI 智能规划圣托里尼</b>' +
        '<div class="obld-sub">AI 自动分析地形、街道走势与海景视线，推荐最佳展示与景观布局</div>' +
        '<div class="obld-actions" style="grid-template-columns:1fr;margin-top:12px;">' +
        '<button type="button" class="obld-btn pri" data-a="smartLayout" data-d="art" style="padding:12px;text-align:left;">' +
        '<b>🏛️ 规划: 圣托里尼悬崖艺术展</b><br><small style="opacity:.85">按看板列表自动策展：挑最合适的体素展架，在你面前的平地上摆好整个列表</small>' +
        '</button>' +
        '<button type="button" class="obld-btn" data-a="smartLayout" data-d="cafe" style="padding:12px;text-align:left;">' +
        '<b>☕ 规划: 爱琴海露天咖啡走廊</b><br><small style="opacity:.85">在沿海主干道自动布局露天咖啡座、遮阳伞与百年橄榄树</small>' +
        '</button>' +
        '</div>' +
        '</div>';
    }

    if (panel.__h === h) return;
    var sc70 = panel.querySelector('.vd-cards'), top70 = sc70 ? sc70.scrollTop : 0;
    panel.__h = h; panel.innerHTML = h;
    if (top70 && (sc70 = panel.querySelector('.vd-cards'))) sc70.scrollTop = top70;
  }

  function toggle(on) {
    if (!mount()) return;
    edit = on == null ? !edit : !!on;
    panel.hidden = !edit;
    var btn = document.querySelector('#oia-root .obld-t');
    if (btn) btn.classList.toggle('on', edit);
    if (edit) {
      var b = nearestFront();
      if (b && !sel) sel = b.id;
    }
    updateHl(); fillPanel();
  }

  function toast(msg) {
    var root = document.getElementById('oia-root'); if (!root) return;
    var o = root.querySelector('.obld-toast');
    if (!o) { o = document.createElement('div'); o.className = 'obld-toast'; root.appendChild(o); }
    o.textContent = msg; o.hidden = false;
    clearTimeout(toastT);
    toastT = setTimeout(function () { if (o) o.hidden = true; }, 2600);
  }

  /* ---------------------------------------------------------------- Style Injection */
  var style = document.createElement('style');
  style.id = 'mn-oia-bld-style-69';
  style.textContent = [
    '#oia-root .obld-t{position:absolute;z-index:60;right:calc(16px + env(safe-area-inset-right));bottom:calc(76px + env(safe-area-inset-bottom));padding:7px 14px;background:rgba(18,24,36,.92);border:2px solid #3b82f6;border-radius:20px;color:#fff;font:bold 12px/1.2 system-ui,sans-serif;cursor:pointer;pointer-events:auto;box-shadow:0 4px 14px rgba(0,0,0,.4);display:flex;align-items:center;gap:6px;}',
    '#oia-root .obld-t.on{background:#2563eb;border-color:#93c5fd;}',
    '#mn-bld-p{position:absolute;z-index:60;right:calc(16px + env(safe-area-inset-right));bottom:calc(126px + env(safe-area-inset-bottom));width:min(360px,92vw);background:rgba(15,23,42,.95);border:2px solid #334155;border-radius:14px;padding:12px;color:#f8fafc;font:13px/1.4 system-ui,sans-serif;box-shadow:0 8px 30px rgba(0,0,0,.6);pointer-events:auto;max-height:80vh;overflow-y:auto;}',
    '#mn-bld-p[hidden]{display:none;}',
    '#mn-bld-p .obld-tabs{display:grid;grid-template-columns:1fr 1fr;gap:6px;margin-bottom:10px;}',
    '#mn-bld-p .obld-tab{padding:6px;background:#1e293b;border:1px solid #475569;border-radius:8px;color:#cbd5e1;font:bold 11px system-ui;cursor:pointer;}',
    '#mn-bld-p .obld-tab.on{background:#2563eb;border-color:#60a5fa;color:#fff;}',
    '#mn-bld-p .obld-card{background:#1e293b;border-radius:10px;padding:12px;border:1px solid #334155;}',
    '#mn-bld-p .obld-card .t{display:block;font-size:14px;font-weight:bold;margin-bottom:4px;color:#fff;}',
    '#mn-bld-p .obld-sub{font-size:11px;color:#94a3b8;margin-bottom:10px;}',
    '#mn-bld-p .obld-actions{display:grid;grid-template-columns:1fr 1fr;gap:6px;margin-bottom:10px;}',
    '#mn-bld-p .obld-btn{padding:8px 10px;background:#334155;border:none;border-radius:6px;color:#fff;font:bold 12px system-ui;cursor:pointer;transition:background .15s;}',
    '#mn-bld-p .obld-btn:hover{background:#475569;}',
    '#mn-bld-p .obld-btn.pri{background:#007aff;color:#fff;grid-column:1/-1;}',
    '#mn-bld-p .obld-btn.warn{background:#dc2626;}',
    '#mn-bld-p .obld-dir{display:flex;flex-direction:column;align-items:center;gap:4px;margin-top:8px;}',
    '#mn-bld-p .obld-dir .row{display:flex;gap:6px;}',
    '#mn-bld-p .obld-dir .obld-btn{padding:5px 16px;font-size:14px;}',
    '#oia-root .obld-toast{position:absolute;z-index:90;top:calc(20px + env(safe-area-inset-top));left:50%;transform:translateX(-50%);padding:8px 16px;background:rgba(15,23,42,.92);border:2px solid #60a5fa;border-radius:20px;color:#fff;font:bold 13px system-ui;box-shadow:0 4px 16px rgba(0,0,0,.5);pointer-events:none;}',
    '#oia-root .obld-toast[hidden]{display:none;}'
  ].join('\n');
  document.head.appendChild(style);

  /* ---------------------------------------------------------------- Hooks & Lifecycle */
  function wrap() {
    if (!window.MinestOia || !window.__oiaApply || window.MinestOia.__bld69) return !!(window.MinestOia && window.MinestOia.__bld69);
    var bind0 = window.MinestOia.bind;
    window.MinestOia.bind = function (h) { H = h; return bind0.call(window.MinestOia, h); };
    var apply0 = window.__oiaApply;
    window.__oiaApply = function (w, dirty) {
      apply0(w, dirty);
      try { applyBld(w, dirty, false); } catch (e) { if (window.console) console.error('oia-bld', e); }
    };
    window.MinestOia.__bld69 = 1;
    return true;
  }
  if (!wrap()) {
    var tries = 0, tm = setInterval(function () { if (wrap() || ++tries > 80) clearInterval(tm); }, 250);
  }

  function wrapLink() {
    if (window.MinestOiaLink && !window.MinestOiaLink.__wrapped69) {
      var origDoll = window.MinestOiaLink.dollhouse;
      window.MinestOiaLink.__origDollhouse = origDoll;
      window.MinestOiaLink.dollhouse = function (bid, at) {
        ensurePieceForBuilding(bid);
        return origDoll(bid, at);
      };
      window.MinestOiaLink.__wrapped69 = 1;
      return true;
    }
    return false;
  }
  if (!wrapLink()) {
    var triesL = 0, tmL = setInterval(function () { if (wrapLink() || ++triesL > 80) clearInterval(tmL); }, 250);
  }

  setInterval(function () {
    if (window.__oiaOn && window.__santorini) {
      if (!panel) mount();
      if (VD()) VD().render(vdHost);   /* 70: only what changed is rebuilt */
      else if (!voxDispGroup || voxDispGroup.children.length === 0) {
        var w = world();
        if (w) {
          var st = H && H.bld ? H.bld() : null;
          var disps = (st && st.displays && st.displays.length) ? st.displays : defaultDisplays(w);
          renderVoxelDisplays(disps);
        }
      }
    }
    if (edit && window.__oiaOn) { updateHl(); if (!sel && !selElem && !selDisp) fillPanel(); }
  }, 400);

  window.addEventListener('keydown', function (e) {
    if (!window.__oiaOn) return;
    if (e.target && /^(INPUT|TEXTAREA|SELECT)$/.test(e.target.tagName)) return;
    if (e.code === 'KeyB') { toggle(); return; }
    if (!edit) return;
    var k = { KeyV: ['pick'], KeyI: ['mv', 'f'], KeyK: ['mv', 'b'], KeyJ: ['mv', 'l'], KeyL: ['mv', 'r'], KeyC: ['rot'], KeyG: ['rep'], KeyX: ['del'] }[e.code];
    if (k) { ACT[k[0]](k[1]); e.preventDefault(); }
  });

  window.MinestOiaBld = {
    version: '70.0',
    toggle: toggle,
    act: function (a, d) { return ACT[a] ? ACT[a](d) : null; },
    select: function (id) { sel = id; curTab = 'bld'; updateHl(); fillPanel(); },
    selected: function () { return sel; },
    selectDisplay: function (id) { selDisp = id; curTab = 'disp'; updateHl(); fillPanel(); },
    selectedDisplay: function () { return selDisp; },
    record: function () { return H && H.bld ? JSON.parse(JSON.stringify(H.bld() || null)) : null; },
    buildings: function () { var w = world(); return w ? w.buildings.map(function (b) { return Object.assign({}, b); }) : []; },
    displays: function () {
      if (VD()) return curDisps();
      var st = H && H.bld ? H.bld() : null;
      if (st && st.displays && st.displays.length) return st.displays;
      var w = world();
      return w ? defaultDisplays(w) : [];
    },
    reapply: function () { reapply(); },
    history: function () { return H&&H.history?H.history():{undo:false,redo:false}; },
    undo: function () { if(!H||!H.undo||!H.undo())return false;sel=null;selDisp=null;selElem=null;window.__oiaApply(sa().world,sa().markDirty);reapply();window.dispatchEvent(new Event('minest-world-edit'));return true; },
    redo: function () { if(!H||!H.redo||!H.redo())return false;sel=null;selDisp=null;selElem=null;window.__oiaApply(sa().world,sa().markDirty);reapply();window.dispatchEvent(new Event('minest-world-edit'));return true; },
    reset: function () { if(!H||!H.reset||!H.reset())return false;sel=null;selDisp=null;selElem=null;window.__oiaApply(sa().world,sa().markDirty);reapply();window.dispatchEvent(new Event('minest-world-edit'));return true; },
    restore: function () { if(!H||!H.restore||!H.restore())return false;sel=null;selDisp=null;selElem=null;window.__oiaApply(sa().world,sa().markDirty);reapply();window.dispatchEvent(new Event('minest-world-edit'));return true; },
    ensurePieceForBuilding: ensurePieceForBuilding,
    enterDoorhouse: enterDoorhouse,
    openCardModal: openCardModal,
    getActiveCards: getActiveCards,
    pickDisplayAt: pickDisplayAt,
    pickBuildingAt: pickBuildingAt
  };
})();


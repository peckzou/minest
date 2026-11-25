/* =========================================================================
 * Minest Duo Holographic Portal 2.0 (hologram-2/v2.js)
 *
 * Non-destructive upgrade on top of ../hologram/js/{materials,models,exhibit_vader}.js:
 * - Preserves 100% of 1.0's Kooima off-axis foldable projection (`Duo` mode),
 *   rear camera passthrough (`透视` + iOS `minestBridge`), Vision head tracking
 *   (`window.HOLO.nativeEvent`), cyan energy ring, beam, particles, and
 *   scanline reveal/dissolve transitions.
 * - Replaces static default `M` / `Vader` exhibits with living, walking 3D
 *   characters + multi-frame animated GIFs (with pure-JS GIF89a LZW decoder,
 *   IndexedDB persistence, smart background keying, 3D volumetric slices,
 *   autonomous stage walking, footstep ripples, floor reflections, and
 *   @niwachipi-inspired 3D dotted-matrix stage + miniature cyan desk prop).
 * ========================================================================= */
(function () {
  'use strict';
  var T = THREE, H = window.HOLO;
  function $(id) { return document.getElementById(id); }
  function clamp(v, a, b) { return Math.max(a, Math.min(b, v)); }
  function lerp(a, b, k) { return a + (b - a) * k; }
  function rad(d) { return d * Math.PI / 180; }
  function angDiff(to, from) {
    var d = (to - from) % (Math.PI * 2);
    if (d > Math.PI) d -= Math.PI * 2;
    if (d < -Math.PI) d += Math.PI * 2;
    return d;
  }

  var canvas = $('gl'), video = $('bg-video'), body = document.body, root = document.documentElement;

  /* ---------- 1. Settings & Persistence ---------- */
  var LS = 'minest.hologram2.v1';
  var DB_NAME = 'minest.holoPortalGifs.v1';
  var DB_STORE = 'gifs';

  var DEF = {
    scan: true, flicker: true, particles: true,
    hover: 0.02, size: 1.0, opacity: 1.0,
    crease: 0.5, angle: 96, elev: 36,
    track: true, flipX: false, flipY: false, gain: 1.0, camZoom: 1.0,
    walkMode: 'roam',      // 'roam' | 'orbit' | 'pace' | 'idle'
    walkSpeed: 1.0,
    visualStyle: 'vivid',  // 'vivid' | 'holo'
    keyMode: 'auto',       // 'auto' | 'black' | 'white' | 'none'
    keyTol: 38,
    gifDepth: 0.08,
    dotStage: true,
    deskProp: true,
    reflect: true,
    billboard: true,
    includeClassic: false,
    duoCam: false          // In Duo mode, default to crisp 3D dot-matrix stage unless camera toggled on
  };
  var S = Object.assign({}, DEF);
  try { Object.assign(S, JSON.parse(localStorage.getItem(LS) || '{}')); } catch (e) {}
  function save() { try { localStorage.setItem(LS, JSON.stringify(S)); } catch (e) {} }
  var mode = 1;

  /* ---------- 2. Pure-JS GIF89a Multi-Frame LZW Decoder ---------- */
  function decodeGifBuffer(arrayBuffer) {
    var bytes = new Uint8Array(arrayBuffer);
    if (bytes.length < 14) throw new Error('Invalid GIF');
    var hdr = String.fromCharCode(bytes[0], bytes[1], bytes[2], bytes[3], bytes[4], bytes[5]);
    if (hdr !== 'GIF87a' && hdr !== 'GIF89a') throw new Error('Not GIF87a/89a');

    var p = 6;
    function u16() { var v = bytes[p] | (bytes[p + 1] << 8); p += 2; return v; }
    var width = u16(), height = u16();
    var packed = bytes[p++]; p += 2; // bgIndex + aspect
    var gctFlag = (packed & 0x80) !== 0;
    var gctSize = 2 << (packed & 7);

    function readColorTable(count) {
      var tbl = new Uint8Array(count * 3);
      for (var i = 0; i < count * 3 && p < bytes.length; i++) tbl[i] = bytes[p++];
      return tbl;
    }
    var gct = gctFlag ? readColorTable(gctSize) : null;

    function skipSubBlocks() {
      while (p < bytes.length) { var sz = bytes[p++]; if (!sz) break; p += sz; }
    }
    function readSubBlocks() {
      var chunks = [], total = 0;
      while (p < bytes.length) {
        var sz = bytes[p++];
        if (!sz) break;
        chunks.push(bytes.subarray(p, p + sz));
        total += sz; p += sz;
      }
      var out = new Uint8Array(total), off = 0;
      for (var i = 0; i < chunks.length; i++) { out.set(chunks[i], off); off += chunks[i].length; }
      return out;
    }
    function lzwDecode(minCodeSize, data, pixelCount) {
      var MAX_STACK = 4096;
      var clearCode = 1 << minCodeSize, eoiCode = clearCode + 1;
      var codeSize = minCodeSize + 1, codeMask = (1 << codeSize) - 1, avail = clearCode + 2;
      var oldCode = -1, datum = 0, bits = 0, first = 0, top = 0, pi = 0, bi = 0;
      var prefix = new Int32Array(MAX_STACK), suffix = new Uint8Array(MAX_STACK);
      var pixelStack = new Uint8Array(MAX_STACK + 1), out = new Uint8Array(pixelCount);
      for (var code = 0; code < clearCode; code++) { prefix[code] = 0; suffix[code] = code; }
      while (pi < pixelCount) {
        if (top === 0) {
          if (bits < codeSize) {
            if (bi >= data.length) break;
            datum |= data[bi++] << bits; bits += 8; continue;
          }
          var cur = datum & codeMask; datum >>= codeSize; bits -= codeSize;
          if (cur > avail || cur === eoiCode) break;
          if (cur === clearCode) {
            codeSize = minCodeSize + 1; codeMask = (1 << codeSize) - 1; avail = clearCode + 2; oldCode = -1; continue;
          }
          if (oldCode === -1) { pixelStack[top++] = suffix[cur]; oldCode = cur; first = cur; continue; }
          var inCode = cur;
          if (cur === avail) { pixelStack[top++] = first; cur = oldCode; }
          while (cur > clearCode && top < MAX_STACK) { pixelStack[top++] = suffix[cur]; cur = prefix[cur]; }
          first = suffix[cur]; pixelStack[top++] = first;
          if (avail < MAX_STACK) {
            prefix[avail] = oldCode; suffix[avail] = first; avail++;
            if ((avail & codeMask) === 0 && avail < MAX_STACK) { codeSize++; codeMask += avail; }
          }
          oldCode = inCode;
        }
        out[pi++] = pixelStack[--top];
      }
      return out;
    }

    var comp = new Uint8ClampedArray(width * height * 4);
    var gce = { delay: 85, disposal: 0, transFlag: false, transIdx: 0 };
    var frames = [];

    while (p < bytes.length && frames.length < 200) {
      var block = bytes[p++];
      if (block === 0x3B) break;
      if (block === 0x21) {
        var label = bytes[p++];
        if (label === 0xF9) {
          p++;
          var gp = bytes[p++], delayCs = u16(), tIdx = bytes[p++]; p++;
          gce = { disposal: (gp >> 2) & 7, transFlag: (gp & 1) !== 0, delay: Math.max(25, (delayCs || 8) * 10), transIdx: tIdx };
        } else skipSubBlocks();
      } else if (block === 0x2C) {
        var fx = u16(), fy = u16(), fw = u16(), fh = u16(), ip = bytes[p++];
        var lctFlag = (ip & 0x80) !== 0, interlace = (ip & 0x40) !== 0, lctSize = 2 << (ip & 7);
        var ct = lctFlag ? readColorTable(lctSize) : gct;
        var lzwMin = bytes[p++], lzwData = readSubBlocks();
        var idx = lzwDecode(lzwMin, lzwData, fw * fh);
        var backup = gce.disposal === 3 ? new Uint8ClampedArray(comp) : null;
        if (ct) {
          var rowMap = null;
          if (interlace) {
            rowMap = new Int32Array(fh);
            var dst = 0, passes = [[0, 8], [4, 8], [2, 4], [1, 2]];
            for (var ps = 0; ps < 4; ps++) for (var r = passes[ps][0]; r < fh; r += passes[ps][1]) if (dst < fh) rowMap[dst++] = r;
          }
          for (var sy = 0; sy < fh; sy++) {
            var dy = fy + (rowMap ? rowMap[sy] : sy);
            if (dy < 0 || dy >= height) continue;
            var sRow = sy * fw;
            for (var sx = 0; sx < fw; sx++) {
              var dx = fx + sx;
              if (dx < 0 || dx >= width) continue;
              var ci = idx[sRow + sx];
              if (gce.transFlag && ci === gce.transIdx) continue;
              var co = ci * 3, doff = (dy * width + dx) * 4;
              comp[doff] = ct[co]; comp[doff + 1] = ct[co + 1]; comp[doff + 2] = ct[co + 2]; comp[doff + 3] = 255;
            }
          }
        }
        frames.push({ rgba: new Uint8ClampedArray(comp), delay: gce.delay });
        if (gce.disposal === 2) {
          for (var cy = fy; cy < fy + fh && cy < height; cy++) {
            for (var cx = fx; cx < fx + fw && cx < width; cx++) {
              var o2 = (cy * width + cx) * 4;
              comp[o2] = comp[o2 + 1] = comp[o2 + 2] = comp[o2 + 3] = 0;
            }
          }
        } else if (gce.disposal === 3 && backup) comp.set(backup);
        gce = { delay: 85, disposal: 0, transFlag: false, transIdx: 0 };
      } else if (block === 0) continue;
      else break;
    }
    if (!frames.length) throw new Error('Empty GIF');
    return { width: width, height: height, frames: frames };
  }

  /* ---------- 3. Smart Background Keying & Built-in Animated GIF Clips ---------- */
  function detectCornerBg(rgba, w, h) {
    var pts = [[1, 1], [w - 2, 1], [1, h - 2], [w - 2, h - 2], [Math.floor(w / 2), 1]];
    var trans = 0, r = 0, g = 0, b = 0, n = 0;
    for (var i = 0; i < pts.length; i++) {
      var x = clamp(pts[i][0], 0, w - 1), y = clamp(pts[i][1], 0, h - 1), off = (y * w + x) * 4;
      if (rgba[off + 3] < 40) trans++;
      else { r += rgba[off]; g += rgba[off + 1]; b += rgba[off + 2]; n++; }
    }
    if (trans >= 2 || !n) return null;
    r /= n; g /= n; b /= n;
    var maxD = 0;
    for (var j = 0; j < 4; j++) {
      var ox = (clamp(pts[j][1], 0, h - 1) * w + clamp(pts[j][0], 0, w - 1)) * 4;
      if (rgba[ox + 3] >= 40) maxD = Math.max(maxD, Math.hypot(rgba[ox] - r, rgba[ox + 1] - g, rgba[ox + 2] - b));
    }
    return maxD < 60 ? [r, g, b] : null;
  }

  function applyBgKey(src, dst, w, h, keyMode, tol, autoRef) {
    dst.set(src);
    if (keyMode === 'none') return;
    var ref = keyMode === 'auto' ? autoRef : keyMode === 'black' ? [0, 0, 0] : keyMode === 'white' ? [255, 255, 255] : null;
    if (!ref) return;
    var thr = clamp(tol || 38, 6, 130), soft = thr * 0.45 + 10;
    var rr = ref[0], rg = ref[1], rb = ref[2];
    for (var i = 0, len = w * h * 4; i < len; i += 4) {
      var a = dst[i + 3];
      if (!a) continue;
      var dr = dst[i] - rr, dg = dst[i + 1] - rg, db = dst[i + 2] - rb;
      var dist = Math.sqrt(dr * dr + dg * dg + db * db);
      if (dist < thr) dst[i + 3] = 0;
      else if (dist < thr + soft) dst[i + 3] = Math.round(a * ((dist - thr) / soft));
    }
  }

  function makeBuiltInGifClip(kind) {
    var W = 192, Hh = 240, N = 12, frames = [];
    var cv = document.createElement('canvas'); cv.width = W; cv.height = Hh;
    var x = cv.getContext('2d');
    for (var f = 0; f < N; f++) {
      var ph = (f / N) * Math.PI * 2;
      x.clearRect(0, 0, W, Hh);
      x.save();
      if (kind === 'neko') {
        var bob = Math.abs(Math.sin(ph)) * 7, sw = Math.sin(ph), cy = 134 - bob;
        var gr = x.createRadialGradient(96, cy, 8, 96, cy, 86);
        gr.addColorStop(0, 'rgba(111,233,255,0.32)'); gr.addColorStop(1, 'rgba(111,233,255,0)');
        x.fillStyle = gr; x.fillRect(0, 0, W, Hh);
        x.strokeStyle = '#fef3c7'; x.lineWidth = 11; x.lineCap = 'round';
        x.beginPath(); x.moveTo(76, cy + 30); x.quadraticCurveTo(38, cy + 14 + Math.sin(ph + 1) * 14, 44, cy - 14); x.stroke();
        x.lineWidth = 13; x.strokeStyle = '#fffbeb';
        x.beginPath(); x.moveTo(84, cy + 34); x.lineTo(84 - sw * 18, 220); x.stroke();
        x.beginPath(); x.moveTo(108, cy + 34); x.lineTo(108 + sw * 18, 220); x.stroke();
        x.fillStyle = '#fffbeb';
        x.beginPath(); x.ellipse(96, cy + 14, 28, 34, 0, 0, Math.PI * 2); x.fill();
        x.fillStyle = '#38bdf8'; x.fillRect(72, cy - 10, 48, 12);
        x.fillStyle = '#fffbeb';
        x.beginPath(); x.arc(96, cy - 32, 30, 0, Math.PI * 2); x.fill();
        x.beginPath(); x.moveTo(68, cy - 46); x.lineTo(62, cy - 78); x.lineTo(88, cy - 58); x.closePath(); x.fill();
        x.beginPath(); x.moveTo(124, cy - 46); x.lineTo(130, cy - 78); x.lineTo(104, cy - 58); x.closePath(); x.fill();
        x.fillStyle = '#fda4af';
        x.beginPath(); x.moveTo(71, cy - 49); x.lineTo(67, cy - 70); x.lineTo(84, cy - 57); x.closePath(); x.fill();
        x.beginPath(); x.moveTo(121, cy - 49); x.lineTo(125, cy - 70); x.lineTo(108, cy - 57); x.closePath(); x.fill();
        x.fillStyle = '#0f172a';
        x.beginPath(); x.arc(85, cy - 32, 4.5, 0, Math.PI * 2); x.arc(109, cy - 32, 4.5, 0, Math.PI * 2); x.fill();
        x.fillStyle = '#fff';
        x.beginPath(); x.arc(83.5, cy - 33.5, 1.8, 0, Math.PI * 2); x.arc(107.5, cy - 33.5, 1.8, 0, Math.PI * 2); x.fill();
      } else {
        // Luminous pixel/illustrated strolling girl GIF
        var b2 = Math.abs(Math.sin(ph)) * 6, st = Math.sin(ph), y0 = 32 - b2;
        var g2 = x.createRadialGradient(96, 122, 10, 96, 122, 96);
        g2.addColorStop(0, 'rgba(255,244,196,0.34)'); g2.addColorStop(1, 'rgba(255,244,196,0)');
        x.fillStyle = g2; x.fillRect(0, 0, W, Hh);
        x.strokeStyle = '#fdeedc'; x.lineWidth = 10; x.lineCap = 'round';
        x.beginPath(); x.moveTo(96, y0 + 58); x.lineTo(96 - st * 24, y0 + 102); x.stroke();
        x.lineWidth = 11; x.strokeStyle = '#f8d9c0';
        x.beginPath(); x.moveTo(90, y0 + 124); x.lineTo(90 - st * 22, 222 - Math.max(0, -st) * 8); x.stroke();
        x.strokeStyle = '#ffe8d2';
        x.beginPath(); x.moveTo(102, y0 + 124); x.lineTo(102 + st * 22, 222 - Math.max(0, st) * 8); x.stroke();
        x.fillStyle = '#ffffff';
        x.beginPath(); x.ellipse(90 - st * 22 + 4, 224 - Math.max(0, -st) * 8, 10, 5, 0, 0, Math.PI * 2); x.fill();
        x.beginPath(); x.ellipse(102 + st * 22 + 4, 224 - Math.max(0, st) * 8, 10, 5, 0, 0, Math.PI * 2); x.fill();
        x.fillStyle = '#ffd54f';
        x.beginPath();
        x.moveTo(78, y0 + 92); x.lineTo(114, y0 + 92);
        x.lineTo(130 + st * 5, y0 + 144); x.lineTo(62 + st * 5, y0 + 144);
        x.closePath(); x.fill();
        x.strokeStyle = 'rgba(217,140,16,0.45)'; x.lineWidth = 2;
        [-14, -5, 5, 14].forEach(function (ox) {
          x.beginPath(); x.moveTo(96 + ox * 0.6, y0 + 95); x.lineTo(96 + ox * 1.3 + st * 4, y0 + 142); x.stroke();
        });
        x.fillStyle = '#ffffff';
        x.beginPath();
        x.moveTo(78, y0 + 50); x.lineTo(114, y0 + 50);
        x.lineTo(116, y0 + 94); x.lineTo(76, y0 + 94);
        x.closePath(); x.fill();
        x.strokeStyle = '#fff5ea'; x.lineWidth = 10;
        x.beginPath(); x.moveTo(98, y0 + 58); x.lineTo(98 + st * 24, y0 + 102); x.stroke();
        x.fillStyle = '#6d4c3d';
        x.beginPath(); x.arc(96, y0 + 24, 23, 0, Math.PI * 2); x.fill();
        x.fillStyle = '#fff2e4';
        x.beginPath(); x.arc(99, y0 + 26, 17, 0, Math.PI * 2); x.fill();
        x.fillStyle = '#5c3d2e';
        x.beginPath(); x.arc(94, y0 + 20, 21, Math.PI * 0.85, Math.PI * 1.95); x.fill();
        x.fillRect(75, y0 + 18, 13, 24);
      }
      x.restore();
      frames.push({ rgba: new Uint8ClampedArray(x.getImageData(0, 0, W, Hh).data), delay: 75 });
    }
    return { width: W, height: Hh, frames: frames, autoRef: null };
  }

  /* ---------- 4. IndexedDB Multi-GIF Library ---------- */
  function openGifDB() {
    return new Promise(function (resolve) {
      if (!window.indexedDB) { resolve(null); return; }
      try {
        var req = window.indexedDB.open(DB_NAME, 1);
        req.onupgradeneeded = function () {
          var db = req.result;
          if (!db.objectStoreNames.contains(DB_STORE)) db.createObjectStore(DB_STORE, { keyPath: 'id' });
        };
        req.onsuccess = function () { resolve(req.result); };
        req.onerror = function () { resolve(null); };
      } catch (e) { resolve(null); }
    });
  }
  function dbGetAllGifs() {
    return openGifDB().then(function (db) {
      if (!db) return [];
      return new Promise(function (resolve) {
        try {
          var tx = db.transaction(DB_STORE, 'readonly');
          var req = tx.objectStore(DB_STORE).getAll();
          req.onsuccess = function () { resolve(req.result || []); };
          req.onerror = function () { resolve([]); };
        } catch (e) { resolve([]); }
      });
    });
  }
  function dbPutGif(rec) {
    return openGifDB().then(function (db) {
      if (!db) return;
      return new Promise(function (resolve) {
        try {
          var tx = db.transaction(DB_STORE, 'readwrite');
          tx.objectStore(DB_STORE).put(rec);
          tx.oncomplete = function () { resolve(true); };
          tx.onerror = function () { resolve(false); };
        } catch (e) { resolve(false); }
      });
    });
  }
  function dbDeleteGif(id) {
    return openGifDB().then(function (db) {
      if (!db) return;
      return new Promise(function (resolve) {
        try {
          var tx = db.transaction(DB_STORE, 'readwrite');
          tx.objectStore(DB_STORE).delete(id);
          tx.oncomplete = function () { resolve(true); };
          tx.onerror = function () { resolve(false); };
        } catch (e) { resolve(false); }
      });
    });
  }

  /* ---------- 5. Renderer & Scene Setup ---------- */
  var renderer;
  try {
    renderer = new T.WebGLRenderer({ canvas: canvas, alpha: true, antialias: true, powerPreference: 'high-performance' });
  } catch (e) {
    $('hint').textContent = '此浏览器无法创建 WebGL 上下文';
    $('hint').classList.remove('gone');
    return;
  }
  renderer.setClearColor(0x000000, 0);
  renderer.autoClear = false;

  var scene = new T.Scene();
  var stage = new T.Group(); scene.add(stage);       // 底座光环 + 点阵舞台 + 角色行走舞台
  var stageRot = new T.Group(); stage.add(stageRot); // 用户拖动旋转中心

  // 1.0 原版能量光环、体积光束、上升粒子、投影台网格
  var holoMat = H.hologramMaterial();
  var classicModels = H.models();
  var classicMesh = new T.Mesh(classicModels[0].geo, holoMat);
  classicMesh.frustumCulled = false;
  classicMesh.visible = false;

  var classicPivot = new T.Group();
  classicPivot.add(classicMesh);
  stageRot.add(classicPivot);

  var ring = H.ringMesh(); ring.position.y = 0.002; stage.add(ring);
  var beam = H.beamMesh(); stage.add(beam);
  var parts = H.particles(240); stage.add(parts);
  var grid = H.gridMesh(); grid.visible = false; scene.add(grid);

  var camMain = new T.PerspectiveCamera(32, 1, 0.1, 200);
  var camUp = new T.PerspectiveCamera(), camLo = new T.PerspectiveCamera();

  /* ---------- 6. @niwachipi 3D Dotted-Matrix Stage & Mini Cyan Desk Prop ---------- */
  function buildDotStage() {
    var grp = new T.Group();
    var pos = [], col = [];
    // Floor lattice (XZ plane around the cyan ring) + upright backdrop lattice (XY plane behind stage)
    var cols = 21, rows = 15, sp = 0.24;
    for (var ix = 0; ix < cols; ix++) {
      for (var iz = 0; iz < rows; iz++) {
        var x = (ix - (cols - 1) / 2) * sp;
        var z = (iz - (rows - 1) / 2) * sp + 0.1;
        var fade = clamp(1.18 - Math.hypot(x * 0.42, (z - 0.1) * 0.48), 0.18, 1);
        pos.push(x, 0.001, z);
        col.push(0.72 * fade, 0.94 * fade, 1.0 * fade);
      }
    }
    var bCols = 23, bRows = 16, bSp = 0.23;
    for (var bx = 0; bx < bCols; bx++) {
      for (var by = 0; by < bRows; by++) {
        var x2 = (bx - (bCols - 1) / 2) * bSp;
        var y2 = 0.14 + by * bSp;
        var fade2 = clamp(1.22 - Math.hypot(x2 * 0.36, (y2 - 1.7) * 0.34), 0.22, 1);
        pos.push(x2, y2, -1.18);
        col.push(0.88 * fade2, 0.96 * fade2, 1.0 * fade2);
      }
    }
    var g = new T.BufferGeometry();
    g.setAttribute('position', new T.Float32BufferAttribute(pos, 3));
    g.setAttribute('color', new T.Float32BufferAttribute(col, 3));
    var m = new T.ShaderMaterial({
      transparent: true, depthWrite: false, depthTest: true, blending: T.AdditiveBlending,
      uniforms: { uViewH: H.shared.uViewH, uOpacity: { value: 0.96 } },
      vertexShader: [
        'uniform float uViewH; attribute vec3 color; varying vec3 vCol;',
        'void main(){',
        '  vCol = color;',
        '  vec4 mv = modelViewMatrix * vec4(position, 1.0);',
        '  gl_Position = projectionMatrix * mv;',
        '  gl_PointSize = clamp(0.038 * projectionMatrix[1][1] * uViewH * 0.5 / max(0.25, -mv.z), 2.8, 7.2);',
        '}'
      ].join('\n'),
      fragmentShader: [
        'precision highp float; uniform float uOpacity; varying vec3 vCol;',
        'void main(){',
        '  float d = length(gl_PointCoord - 0.5);',
        '  if (d > 0.5) discard;',
        '  float a = smoothstep(0.5, 0.08, d) * uOpacity;',
        '  gl_FragColor = vec4(vCol, a);',
        '}'
      ].join('\n')
    });
    var pts = new T.Points(g, m);
    pts.frustumCulled = false;
    grp.add(pts);
    return grp;
  }

  function buildDeskProp() {
    var g = new T.Group();
    var topMat = new T.MeshBasicMaterial({ color: 0xbff4ff, transparent: true, opacity: 0.86 });
    var legMat = new T.MeshBasicMaterial({ color: 0x7ddff8, transparent: true, opacity: 0.72 });
    var propMat = new T.MeshBasicMaterial({ color: 0xffffff, transparent: true, opacity: 0.92 });
    var accentMat = new T.MeshBasicMaterial({ color: 0x56ccf2, transparent: true, opacity: 0.88 });

    var top = new T.Mesh(new T.BoxGeometry(0.68, 0.045, 0.38), topMat);
    top.position.set(0, 0.48, 0);
    g.add(top);

    var edge = new T.LineSegments(
      new T.EdgesGeometry(new T.BoxGeometry(0.69, 0.048, 0.39)),
      new T.LineBasicMaterial({ color: 0xffffff, transparent: true, opacity: 0.75 })
    );
    edge.position.copy(top.position);
    g.add(edge);

    [[-0.27, -0.14], [0.27, -0.14], [-0.27, 0.14], [0.27, 0.14]].forEach(function (p) {
      var leg = new T.Mesh(new T.CylinderGeometry(0.02, 0.016, 0.48, 8), legMat);
      leg.position.set(p[0], 0.24, p[1]);
      g.add(leg);
    });
    // Little tissue box + cup on the desk (matching @niwachipi's spatial prop cue)
    var box = new T.Mesh(new T.BoxGeometry(0.18, 0.09, 0.12), propMat);
    box.position.set(-0.12, 0.545, -0.02);
    g.add(box);
    var tissue = new T.Mesh(new T.ConeGeometry(0.045, 0.08, 6), accentMat);
    tissue.position.set(-0.12, 0.62, -0.02);
    tissue.rotation.z = 0.22;
    g.add(tissue);
    var mug = new T.Mesh(new T.CylinderGeometry(0.042, 0.038, 0.095, 12), accentMat);
    mug.position.set(0.16, 0.55, 0.04);
    g.add(mug);

    g.position.set(-0.98, 0, -0.46);
    g.rotation.y = 0.24;
    return g;
  }

  var dotStageGroup = buildDotStage();
  stage.add(dotStageGroup);
  var deskPropGroup = buildDeskProp();
  stageRot.add(deskPropGroup);

  /* ---------- 7. Expanding Footstep Ripples on the Cyan Holo Ring ---------- */
  var RIPPLE_COUNT = 6;
  var ripples = [];
  var rippleGroup = new T.Group();
  stageRot.add(rippleGroup);
  (function initRipples() {
    var rg = new T.RingGeometry(0.68, 1.0, 32);
    rg.rotateX(-Math.PI / 2);
    for (var i = 0; i < RIPPLE_COUNT; i++) {
      var rm = new T.MeshBasicMaterial({
        color: 0x7ef0ff, transparent: true, opacity: 0, depthWrite: false,
        blending: T.AdditiveBlending, side: T.DoubleSide
      });
      var mesh = new T.Mesh(rg, rm);
      mesh.visible = false;
      rippleGroup.add(mesh);
      ripples.push({ mesh: mesh, mat: rm, age: 99, maxAge: 0.9 });
    }
  })();
  var rippleIdx = 0;
  function spawnFootRipple(x, y, z, colHex) {
    var r = ripples[rippleIdx];
    rippleIdx = (rippleIdx + 1) % RIPPLE_COUNT;
    r.age = 0;
    r.mesh.position.set(x, y + 0.005, z);
    r.mesh.scale.setScalar(0.06);
    r.mat.color.setHex(colHex || 0x7ef0ff);
    r.mesh.visible = true;
  }
  function updateRipples(dt) {
    for (var i = 0; i < RIPPLE_COUNT; i++) {
      var r = ripples[i];
      if (r.age >= r.maxAge) { r.mesh.visible = false; continue; }
      r.age += dt;
      var k = clamp(r.age / r.maxAge, 0, 1);
      r.mesh.scale.setScalar(0.06 + k * 0.34);
      r.mat.opacity = (1 - k) * (1 - k) * 0.65 * S.opacity;
    }
  }

  /* ---------- 8. Luminous / Hologram Shader for 3D Articulated Girl ---------- */
  var girlUniforms = {
    uTime: H.shared.uTime,
    uReveal: { value: 2 },
    uDissolve: { value: 0 },
    uOpacity: { value: 1 },
    uScan: { value: 1 },
    uHoloMix: { value: 0 }, // 0 = @niwachipi vivid glowing colors, 1 = cyan hologram
    uRefl: { value: 0 }
  };

  function makeCharPartMat(hexColor, glowBoost, isRefl) {
    var u = {
      uTime: H.shared.uTime,
      uBaseCol: { value: new T.Color(hexColor) },
      uGlow: { value: glowBoost == null ? 0.32 : glowBoost },
      uReveal: girlUniforms.uReveal,
      uDissolve: girlUniforms.uDissolve,
      uOpacity: girlUniforms.uOpacity,
      uScan: girlUniforms.uScan,
      uHoloMix: girlUniforms.uHoloMix,
      uRefl: { value: isRefl ? 1.0 : 0.0 }
    };
    return new T.ShaderMaterial({
      uniforms: u,
      transparent: true,
      depthTest: true,
      depthWrite: !isRefl,
      blending: isRefl ? T.AdditiveBlending : T.NormalBlending,
      side: T.DoubleSide,
      vertexShader: [
        'varying vec3 vWorld; varying vec3 vNormalW; varying float vCharH;',
        'void main(){',
        '  vec4 w = modelMatrix * vec4(position, 1.0);',
        '  vWorld = w.xyz;',
        '  vNormalW = normalize(mat3(modelMatrix) * normal);',
        '  vCharH = clamp(abs(w.y) / 1.95, 0.0, 1.0);',
        '  gl_Position = projectionMatrix * viewMatrix * w;',
        '}'
      ].join('\n'),
      fragmentShader: [
        'precision highp float;',
        'uniform vec3 uBaseCol;',
        'uniform float uTime, uGlow, uReveal, uDissolve, uOpacity, uScan, uHoloMix, uRefl;',
        'varying vec3 vWorld; varying vec3 vNormalW; varying float vCharH;',
        'float hash(vec2 p){ return fract(sin(dot(p, vec2(127.1, 311.7))) * 43758.5453); }',
        'void main(){',
        '  float hq = floor(vCharH * 64.0) / 64.0;',
        '  if (hq > uReveal) discard;',
        '  if (uDissolve > 0.0) {',
        '    float n = hash(floor(vWorld.xy * 18.0) + floor(uTime * 14.0));',
        '    if (n < uDissolve * 1.35 - (1.0 - vCharH) * 0.35) discard;',
        '  }',
        '  vec3 N = normalize(vNormalW);',
        '  vec3 V = normalize(cameraPosition - vWorld);',
        '  vec3 L = normalize(vec3(0.35, 0.85, 0.55));',
        '  float ndl = dot(N, L) * 0.5 + 0.5;',
        '  float rim = pow(1.0 - abs(dot(N, V)), 2.4);',
        '  vec3 rimTint = mix(uBaseCol * 1.35, vec3(1.0, 0.97, 0.90), clamp(uGlow, 0.0, 1.0));',
        '  vec3 vivid = uBaseCol * (0.80 + 0.30 * ndl) + rimTint * (rim * (0.14 + uGlow * 0.45) + uGlow * 0.22);',
        '  float line = smoothstep(0.28, 0.72, fract(vWorld.y * 22.0 - uTime * 0.75));',
        '  vec3 holo = mix(vec3(0.22, 0.86, 1.0), vec3(0.88, 0.99, 1.0), rim * 0.7);',
        '  vec3 col = mix(vivid, holo, uHoloMix);',
        '  float scanMul = mix(1.0, mix(0.86, 1.06, line), uScan * (0.28 + 0.72 * uHoloMix));',
        '  col *= scanMul;',
        '  float edge = uReveal < 1.01 ? smoothstep(0.07, 0.0, uReveal - hq) : 0.0;',
        '  col = mix(col, vec3(0.85, 0.98, 1.0), edge * 0.85);',
        '  float alpha = mix(1.0, (0.34 + 0.66 * rim) * mix(0.65, 1.0, line), uHoloMix * 0.82) * uOpacity;',
        '  if (uRefl > 0.5) {',
        '    alpha *= clamp(1.0 - abs(vWorld.y) * 0.85, 0.0, 1.0) * 0.24;',
        '  }',
        '  gl_FragColor = vec4(col, clamp(alpha, 0.0, 1.0));',
        '}'
      ].join('\n')
    });
  }

  /* ---------- 9. Build Articulated 3D Walking Girl (`漫步少女`) ---------- */
  function createWalkingGirlRig(isRefl) {
    var rootG = new T.Group();
    var bodyG = new T.Group();
    rootG.add(bodyG);

    var mSkin = makeCharPartMat(0xffead8, 0.26, isRefl);
    var mHair = makeCharPartMat(0x5c3a2b, 0.04, isRefl);
    var mTop  = makeCharPartMat(0xffffff, 0.58, isRefl);
    var mSkirt = makeCharPartMat(0xffd54a, 0.46, isRefl);
    var mShoe = makeCharPartMat(0xffffff, 0.48, isRefl);
    var mCollar = makeCharPartMat(0xb8eeff, 0.40, isRefl);

    // Legs (hip pivots at y = 0.86)
    function makeLeg(xOff) {
      var hip = new T.Group();
      hip.position.set(xOff, 0.86, 0);
      var thigh = new T.Mesh(new T.CylinderGeometry(0.064, 0.052, 0.42, 12), mSkin);
      thigh.position.y = -0.21;
      hip.add(thigh);

      var knee = new T.Group();
      knee.position.set(0, -0.42, 0);
      hip.add(knee);

      var shin = new T.Mesh(new T.CylinderGeometry(0.050, 0.040, 0.40, 12), mSkin);
      shin.position.y = -0.20;
      knee.add(shin);

      var shoe = new T.Mesh(new T.BoxGeometry(0.096, 0.068, 0.175), mShoe);
      shoe.position.set(0, -0.405, 0.032);
      knee.add(shoe);

      bodyG.add(hip);
      return { hip: hip, knee: knee };
    }
    var legL = makeLeg(-0.095);
    var legR = makeLeg(0.095);

    // Golden pleated flared skirt with real 3D pleats (waist at y = 1.04 down to y = 0.58)
    var skirtPivot = new T.Group();
    skirtPivot.position.set(0, 1.04, 0);
    var skirtGeo = new T.CylinderGeometry(0.132, 0.325, 0.46, 36, 4, false);
    var sp = skirtGeo.attributes.position;
    for (var si = 0; si < sp.count; si++) {
      var sx = sp.getX(si), sy = sp.getY(si), sz = sp.getZ(si);
      var r = Math.hypot(sx, sz);
      if (r > 0.05) {
        var ang = Math.atan2(sz, sx);
        var flare = clamp((0.23 - sy) / 0.46, 0, 1);
        var pleat = 1.0 + Math.sin(ang * 12.0) * 0.055 * flare;
        sp.setX(si, sx * pleat);
        sp.setZ(si, sz * pleat);
      }
    }
    skirtGeo.computeVertexNormals();
    var skirtMesh = new T.Mesh(skirtGeo, mSkirt);
    skirtMesh.position.y = -0.22;
    skirtPivot.add(skirtMesh);
    bodyG.add(skirtPivot);

    // Luminous white blouse torso + soft shoulders (y = 1.02 .. 1.44)
    var waist = new T.Mesh(new T.CylinderGeometry(0.154, 0.128, 0.34, 16), mTop);
    waist.position.set(0, 1.18, 0);
    waist.scale.set(1.05, 1, 0.78);
    bodyG.add(waist);

    var chest = new T.Mesh(new T.SphereGeometry(0.162, 16, 14), mTop);
    chest.position.set(0, 1.33, 0.008);
    chest.scale.set(1.12, 0.88, 0.82);
    bodyG.add(chest);

    var collar = new T.Mesh(new T.TorusGeometry(0.105, 0.018, 8, 16), mCollar);
    collar.rotation.x = Math.PI / 2 + 0.14;
    collar.position.set(0, 1.43, 0.012);
    bodyG.add(collar);

    // Arms (shoulder pivots at y = 1.38)
    function makeArm(xOff) {
      var sh = new T.Group();
      sh.position.set(xOff, 1.38, 0);
      var puff = new T.Mesh(new T.SphereGeometry(0.068, 12, 10), mTop);
      puff.position.set(0, -0.03, 0);
      puff.scale.set(0.95, 1.25, 0.95);
      sh.add(puff);

      var sleeve = new T.Mesh(new T.CylinderGeometry(0.058, 0.072, 0.16, 12), mTop);
      sleeve.position.y = -0.09;
      sh.add(sleeve);

      var upper = new T.Mesh(new T.CylinderGeometry(0.040, 0.035, 0.24, 10), mSkin);
      upper.position.y = -0.16;
      sh.add(upper);

      var elbow = new T.Group();
      elbow.position.set(0, -0.27, 0);
      sh.add(elbow);

      var fore = new T.Mesh(new T.CylinderGeometry(0.034, 0.029, 0.23, 10), mSkin);
      fore.position.y = -0.115;
      elbow.add(fore);

      var hand = new T.Mesh(new T.SphereGeometry(0.035, 8, 8), mSkin);
      hand.position.y = -0.24;
      elbow.add(hand);

      bodyG.add(sh);
      return { sh: sh, elbow: elbow };
    }
    var armL = makeArm(-0.195);
    var armR = makeArm(0.195);

    // Head + soft sculpted bobbed chestnut hair (head pivot at y = 1.47)
    var headPivot = new T.Group();
    headPivot.position.set(0, 1.47, 0);
    var neck = new T.Mesh(new T.CylinderGeometry(0.048, 0.054, 0.09, 10), mSkin);
    neck.position.y = 0.03;
    headPivot.add(neck);

    var head = new T.Mesh(new T.SphereGeometry(0.156, 20, 18), mSkin);
    head.position.set(0, 0.185, 0.015);
    head.scale.set(0.95, 1.03, 0.94);
    headPivot.add(head);

    // Smooth rounded crown & back bob
    var hairCrown = new T.Mesh(new T.SphereGeometry(0.174, 20, 18), mHair);
    hairCrown.position.set(0, 0.205, -0.018);
    hairCrown.scale.set(1.04, 1.05, 1.06);
    headPivot.add(hairCrown);

    // Lower bob bell hugging the nape & sides (open-ended so zero flat cap artifacts)
    var hairBob = new T.Mesh(
      new T.CylinderGeometry(0.162, 0.192, 0.17, 20, 1, true, Math.PI * 0.58, Math.PI * 1.84),
      mHair
    );
    hairBob.position.set(0, 0.115, -0.012);
    headPivot.add(hairBob);

    // Soft cheek-framing side locks + curved front fringe
    [-1, 1].forEach(function (sd) {
      var lock = new T.Mesh(new T.SphereGeometry(0.068, 12, 10), mHair);
      lock.position.set(sd * 0.138, 0.135, 0.045);
      lock.scale.set(0.62, 1.62, 0.88);
      lock.rotation.z = sd * 0.08;
      headPivot.add(lock);
    });
    var fringe = new T.Mesh(new T.SphereGeometry(0.145, 16, 12), mHair);
    fringe.position.set(0, 0.268, 0.055);
    fringe.scale.set(1.04, 0.56, 0.82);
    fringe.rotation.x = 0.22;
    headPivot.add(fringe);

    bodyG.add(headPivot);

    if (isRefl) {
      rootG.scale.y = -1;
    }

    return {
      root: rootG, body: bodyG,
      legL: legL, legR: legR, armL: armL, armR: armR,
      skirt: skirtPivot, head: headPivot
    };
  }

  /* ---------- 10. Build Articulated Cyan Hologram Walker (`全息行者`) ---------- */
  function tintGeo(geo, rgb) {
    var g = geo.index ? geo.toNonIndexed() : geo.clone();
    if (!g.attributes.normal) g.computeVertexNormals();
    var n = g.attributes.position.count, arr = new Float32Array(n * 3);
    for (var i = 0; i < n; i++) { arr[i * 3] = rgb[0]; arr[i * 3 + 1] = rgb[1]; arr[i * 3 + 2] = rgb[2]; }
    g.setAttribute('aTint', new T.BufferAttribute(arr, 3));
    return g;
  }

  var holoWalkerMat = H.hologramMaterial();
  holoWalkerMat.uniforms.uY0.value = -0.5;
  holoWalkerMat.uniforms.uY1.value = 0.5;

  function createHoloWalkerRig() {
    var rootG = new T.Group();
    var bodyG = new T.Group();
    rootG.add(bodyG);

    var PALE = [0.75, 0.96, 1.0], BLUE = [0.28, 0.62, 1.0], WHITE = [1.0, 1.0, 1.0];

    function part(geo, col, px, py, pz) {
      var m = new T.Mesh(tintGeo(geo, col), holoWalkerMat);
      m.frustumCulled = false;
      m.position.set(px || 0, py || 0, pz || 0);
      return m;
    }

    function makeLeg(xOff) {
      var hip = new T.Group(); hip.position.set(xOff, 0.92, 0);
      hip.add(part(new T.CylinderGeometry(0.078, 0.064, 0.44, 10), PALE, 0, -0.22, 0));
      var knee = new T.Group(); knee.position.set(0, -0.44, 0); hip.add(knee);
      knee.add(part(new T.CylinderGeometry(0.064, 0.052, 0.42, 10), BLUE, 0, -0.21, 0));
      knee.add(part(new T.BoxGeometry(0.12, 0.08, 0.21), WHITE, 0, -0.44, 0.04));
      bodyG.add(hip);
      return { hip: hip, knee: knee };
    }
    var legL = makeLeg(-0.12), legR = makeLeg(0.12);

    // Armored holographic torso + flowing coat panels
    bodyG.add(part(new T.CylinderGeometry(0.20, 0.15, 0.52, 10), PALE, 0, 1.21, 0));
    bodyG.add(part(new T.BoxGeometry(0.30, 0.22, 0.18), WHITE, 0, 1.32, 0.02));
    var capePivot = new T.Group(); capePivot.position.set(0, 1.42, -0.10);
    var cape = part(new T.BoxGeometry(0.38, 0.78, 0.025), BLUE, 0, -0.39, 0);
    capePivot.add(cape);
    bodyG.add(capePivot);

    function makeArm(xOff) {
      var sh = new T.Group(); sh.position.set(xOff, 1.42, 0);
      sh.add(part(new T.SphereGeometry(0.072, 8, 8), WHITE, 0, 0, 0));
      sh.add(part(new T.CylinderGeometry(0.054, 0.046, 0.28, 8), PALE, 0, -0.15, 0));
      var elbow = new T.Group(); elbow.position.set(0, -0.29, 0); sh.add(elbow);
      elbow.add(part(new T.CylinderGeometry(0.046, 0.038, 0.26, 8), BLUE, 0, -0.13, 0));
      bodyG.add(sh);
      return { sh: sh, elbow: elbow };
    }
    var armL = makeArm(-0.24), armR = makeArm(0.24);

    var headPivot = new T.Group(); headPivot.position.set(0, 1.52, 0);
    headPivot.add(part(new T.SphereGeometry(0.155, 14, 12), PALE, 0, 0.17, 0));
    headPivot.add(part(new T.BoxGeometry(0.22, 0.065, 0.14), WHITE, 0, 0.18, 0.09));
    headPivot.add(part(new T.ConeGeometry(0.18, 0.18, 10, 1, true), BLUE, 0, 0.12, -0.02));
    bodyG.add(headPivot);

    return {
      root: rootG, body: bodyG,
      legL: legL, legR: legR, armL: armL, armR: armR,
      skirt: capePivot, head: headPivot
    };
  }

  var girlRig = createWalkingGirlRig(false);
  var girlReflRig = createWalkingGirlRig(true);
  stageRot.add(girlRig.root);
  stageRot.add(girlReflRig.root);

  var holoWalkerRig = createHoloWalkerRig();
  stageRot.add(holoWalkerRig.root);

  /* ---------- 11. Volumetric 3D Animated GIF Stage Rig ---------- */
  var gifGroup = new T.Group();
  stageRot.add(gifGroup);

  var gifCv = document.createElement('canvas');
  gifCv.width = 256; gifCv.height = 256;
  var gifCtx = gifCv.getContext('2d');
  var gifTex = new T.CanvasTexture(gifCv);
  gifTex.minFilter = T.LinearFilter;
  gifTex.magFilter = T.LinearFilter;

  var gifWorkCv = document.createElement('canvas');
  var gifWorkCtx = gifWorkCv.getContext('2d');

  var gifUniforms = {
    uMap: { value: gifTex },
    uTime: H.shared.uTime,
    uReveal: { value: 2 },
    uDissolve: { value: 0 },
    uOpacity: { value: 1 },
    uScan: { value: 1 },
    uHoloMix: { value: 0 }
  };

  function makeGifSliceMat(layerAlpha, tintVec, isRefl) {
    return new T.ShaderMaterial({
      uniforms: {
        uMap: gifUniforms.uMap,
        uTime: gifUniforms.uTime,
        uReveal: gifUniforms.uReveal,
        uDissolve: gifUniforms.uDissolve,
        uOpacity: gifUniforms.uOpacity,
        uScan: gifUniforms.uScan,
        uHoloMix: gifUniforms.uHoloMix,
        uLayerAlpha: { value: layerAlpha },
        uLayerTint: { value: tintVec },
        uRefl: { value: isRefl ? 1.0 : 0.0 }
      },
      transparent: true,
      depthTest: true,
      depthWrite: layerAlpha > 0.9 && !isRefl,
      blending: isRefl ? T.AdditiveBlending : T.NormalBlending,
      side: T.DoubleSide,
      vertexShader: [
        'varying vec2 vUv; varying vec3 vWorld;',
        'void main(){',
        '  vUv = uv;',
        '  vec4 w = modelMatrix * vec4(position, 1.0);',
        '  vWorld = w.xyz;',
        '  gl_Position = projectionMatrix * viewMatrix * w;',
        '}'
      ].join('\n'),
      fragmentShader: [
        'precision highp float;',
        'uniform sampler2D uMap;',
        'uniform float uTime, uReveal, uDissolve, uOpacity, uScan, uHoloMix, uLayerAlpha, uRefl;',
        'uniform vec3 uLayerTint;',
        'varying vec2 vUv; varying vec3 vWorld;',
        'float hash(vec2 p){ return fract(sin(dot(p, vec2(127.1, 311.7))) * 43758.5453); }',
        'void main(){',
        '  vec4 tx = texture2D(uMap, vUv);',
        '  if (tx.a < 0.04) discard;',
        '  float hq = floor(vUv.y * 64.0) / 64.0;',
        '  if (hq > uReveal) discard;',
        '  if (uDissolve > 0.0) {',
        '    float n = hash(floor(vUv * 42.0) + floor(uTime * 14.0));',
        '    if (n < uDissolve * 1.35 - (1.0 - vUv.y) * 0.35) discard;',
        '  }',
        '  float lum = dot(tx.rgb, vec3(0.299, 0.587, 0.114));',
        '  vec3 holo = mix(vec3(0.18, 0.82, 1.0), vec3(0.92, 0.99, 1.0), lum) * (0.75 + 0.5 * lum);',
        '  vec3 col = mix(tx.rgb * 1.08, holo, uHoloMix) * uLayerTint;',
        '  float line = smoothstep(0.28, 0.72, fract(vWorld.y * 22.0 - uTime * 0.75));',
        '  col *= mix(1.0, mix(0.84, 1.08, line), uScan * (0.25 + 0.75 * uHoloMix));',
        '  float edge = uReveal < 1.01 ? smoothstep(0.07, 0.0, uReveal - hq) : 0.0;',
        '  col = mix(col, vec3(0.86, 0.98, 1.0), edge * 0.85);',
        '  float a = tx.a * uLayerAlpha * uOpacity;',
        '  if (uRefl > 0.5) a *= (1.0 - vUv.y) * 0.28;',
        '  gl_FragColor = vec4(col, clamp(a, 0.0, 1.0));',
        '}'
      ].join('\n')
    });
  }

  var gifStand = new T.Group();
  gifGroup.add(gifStand);
  var gifSlices = [];
  var SLICE_COUNT = 5;
  (function buildGifSlices() {
    var plane = new T.PlaneGeometry(1, 1);
    plane.translate(0, 0.5, 0); // Bottom anchored right on y = 0!
    for (var i = 0; i < SLICE_COUNT; i++) {
      var isFront = (i === 0);
      var mat = makeGifSliceMat(
        isFront ? 1.0 : 0.28,
        isFront ? new T.Vector3(1, 1, 1) : new T.Vector3(0.68, 0.93, 1.0),
        false
      );
      var m = new T.Mesh(plane, mat);
      m.frustumCulled = false;
      gifStand.add(m);
      gifSlices.push(m);
    }
    var reflPlane = new T.PlaneGeometry(1, 1);
    reflPlane.translate(0, 0.5, 0);
    var reflMesh = new T.Mesh(reflPlane, makeGifSliceMat(1.0, new T.Vector3(0.75, 0.95, 1.0), true));
    reflMesh.scale.y = -1;
    reflMesh.frustumCulled = false;
    gifStand.add(reflMesh);
    gifStand.userData.refl = reflMesh;
  })();

  /* Active GIF playback state */
  var activeGif = {
    clip: null,       // { width, height, frames: [{ rgba, delay }], autoRef }
    videoEl: null,    // HTMLVideoElement if user uploaded mp4/webm
    imgEl: null,      // HTMLImageElement if static png/jpg/webp
    frameIdx: 0,
    frameTimer: 0,
    keyedBuf: null,
    aspect: 0.8,
    flipX: 1
  };

  function setGifClip(clip, videoEl, imgEl) {
    if (activeGif.videoEl && activeGif.videoEl !== videoEl) {
      try { activeGif.videoEl.pause(); } catch (e) {}
    }
    activeGif.clip = clip || null;
    activeGif.videoEl = videoEl || null;
    activeGif.imgEl = imgEl || null;
    activeGif.frameIdx = 0;
    activeGif.frameTimer = 0;

    var w = 192, h = 240;
    if (clip) {
      w = clip.width; h = clip.height;
      if (clip.autoRef === undefined && clip.frames && clip.frames[0]) {
        clip.autoRef = detectCornerBg(clip.frames[0].rgba, w, h);
      }
      activeGif.keyedBuf = new Uint8ClampedArray(w * h * 4);
    } else if (videoEl) {
      w = videoEl.videoWidth || 256; h = videoEl.videoHeight || 256;
    } else if (imgEl) {
      w = imgEl.naturalWidth || 256; h = imgEl.naturalHeight || 256;
    }
    activeGif.aspect = clamp(w / Math.max(1, h), 0.35, 2.2);
    paintGifFrame(true);
  }

  function paintGifFrame(force) {
    var H_WORLD = 1.86;
    var W_WORLD = H_WORLD * activeGif.aspect;
    for (var i = 0; i < gifSlices.length; i++) {
      var zOff = -i * (S.gifDepth / Math.max(1, SLICE_COUNT - 1));
      gifSlices[i].position.z = zOff;
      gifSlices[i].scale.set(W_WORLD * activeGif.flipX, H_WORLD, 1);
      gifSlices[i].visible = (i === 0 || S.gifDepth > 0.005);
    }
    var refl = gifStand.userData.refl;
    if (refl) {
      refl.scale.set(W_WORLD * activeGif.flipX, -H_WORLD * 0.72, 1);
      refl.visible = S.reflect;
    }

    if (activeGif.clip) {
      var cl = activeGif.clip, fr = cl.frames[activeGif.frameIdx];
      if (!fr) return;
      if (gifWorkCv.width !== cl.width || gifWorkCv.height !== cl.height) {
        gifWorkCv.width = cl.width; gifWorkCv.height = cl.height;
      }
      if (!activeGif.keyedBuf || activeGif.keyedBuf.length !== fr.rgba.length) {
        activeGif.keyedBuf = new Uint8ClampedArray(fr.rgba.length);
      }
      applyBgKey(fr.rgba, activeGif.keyedBuf, cl.width, cl.height, S.keyMode, S.keyTol, cl.autoRef);
      var idata = new ImageData(activeGif.keyedBuf, cl.width, cl.height);
      gifWorkCtx.putImageData(idata, 0, 0);
      gifCtx.clearRect(0, 0, gifCv.width, gifCv.height);
      gifCtx.drawImage(gifWorkCv, 0, 0, gifCv.width, gifCv.height);
      gifTex.needsUpdate = true;
    } else if (activeGif.videoEl && activeGif.videoEl.readyState >= 2) {
      var vw = activeGif.videoEl.videoWidth || 256, vh = activeGif.videoEl.videoHeight || 256;
      activeGif.aspect = clamp(vw / Math.max(1, vh), 0.35, 2.2);
      if (S.keyMode === 'none') {
        gifCtx.clearRect(0, 0, gifCv.width, gifCv.height);
        gifCtx.drawImage(activeGif.videoEl, 0, 0, gifCv.width, gifCv.height);
      } else {
        if (gifWorkCv.width !== 256 || gifWorkCv.height !== 256) { gifWorkCv.width = 256; gifWorkCv.height = 256; }
        gifWorkCtx.clearRect(0, 0, 256, 256);
        gifWorkCtx.drawImage(activeGif.videoEl, 0, 0, 256, 256);
        var vd = gifWorkCtx.getImageData(0, 0, 256, 256);
        var autoR = detectCornerBg(vd.data, 256, 256);
        var out = new Uint8ClampedArray(vd.data.length);
        applyBgKey(vd.data, out, 256, 256, S.keyMode, S.keyTol, autoR);
        gifCtx.putImageData(new ImageData(out, 256, 256), 0, 0);
      }
      gifTex.needsUpdate = true;
    } else if (activeGif.imgEl && force) {
      var iw = activeGif.imgEl.naturalWidth || 256, ih = activeGif.imgEl.naturalHeight || 256;
      if (gifWorkCv.width !== 256 || gifWorkCv.height !== 256) { gifWorkCv.width = 256; gifWorkCv.height = 256; }
      gifWorkCtx.clearRect(0, 0, 256, 256);
      gifWorkCtx.drawImage(activeGif.imgEl, 0, 0, 256, 256);
      var imd = gifWorkCtx.getImageData(0, 0, 256, 256);
      var ar = detectCornerBg(imd.data, 256, 256);
      var out2 = new Uint8ClampedArray(imd.data.length);
      applyBgKey(imd.data, out2, 256, 256, S.keyMode, S.keyTol, ar);
      gifCtx.putImageData(new ImageData(out2, 256, 256), 0, 0);
      gifTex.needsUpdate = true;
      void iw; void ih;
    }
  }

  function stepGifFrames(dt) {
    if (activeGif.clip && activeGif.clip.frames.length > 1) {
      activeGif.frameTimer += dt * 1000 * S.walkSpeed;
      var curDelay = activeGif.clip.frames[activeGif.frameIdx].delay || 80;
      if (activeGif.frameTimer >= curDelay) {
        activeGif.frameTimer = activeGif.frameTimer % curDelay;
        activeGif.frameIdx = (activeGif.frameIdx + 1) % activeGif.clip.frames.length;
        paintGifFrame(false);
      }
    } else if (activeGif.videoEl) {
      paintGifFrame(false);
    }
  }

  /* ---------- 12. Autonomous 3D Walking Controller ---------- */
  var walker = {
    x: 0, z: 0.08,
    heading: 0.25,
    phase: 0,
    roamT: 0,
    prevStepSide: 0
  };

  function resetWalkerPose() {
    walker.x = 0; walker.z = 0.08; walker.heading = 0.2; walker.phase = 0; walker.roamT = 0;
  }

  function stepWalkerMotion(dt, kind) {
    var sp = S.walkSpeed;
    var tx = 0, tz = 0, moving = S.walkMode !== 'idle';

    if (S.walkMode === 'roam') {
      walker.roamT += dt * 0.62 * sp;
      // Smooth figure-8 / clover stroll inside the cyan emitter ring (radius ~0.64)
      tx = Math.sin(walker.roamT) * 0.56;
      tz = Math.sin(walker.roamT * 2.0) * 0.34 + 0.06;
    } else if (S.walkMode === 'orbit') {
      walker.roamT += dt * 0.82 * sp;
      tx = Math.cos(walker.roamT) * 0.54;
      tz = Math.sin(walker.roamT) * 0.48;
    } else if (S.walkMode === 'pace') {
      walker.roamT += dt * 0.95 * sp;
      tx = Math.sin(walker.roamT) * 0.62;
      tz = 0.08 + Math.cos(walker.roamT * 2.0) * 0.06;
    } else {
      tx = 0; tz = 0.05;
    }

    var dx = tx - walker.x, dz = tz - walker.z;
    var follow = 1 - Math.exp(-dt * 4.5);
    var vx = (dx * follow) / Math.max(dt, 1e-4);
    var vz = (dz * follow) / Math.max(dt, 1e-4);
    walker.x += dx * follow;
    walker.z += dz * follow;

    var speedMag = Math.hypot(vx, vz);
    if (moving && speedMag > 0.03) {
      var targetYaw = Math.atan2(vx, vz);
      walker.heading += angDiff(targetYaw, walker.heading) * (1 - Math.exp(-dt * 7.5));
      walker.phase += dt * (4.8 + speedMag * 3.6);
    } else {
      walker.heading += angDiff(0, walker.heading) * (1 - Math.exp(-dt * 3.0));
      walker.phase += dt * 1.4;
    }

    var strideAmp = moving ? clamp(speedMag * 0.78 + 0.22, 0.18, 0.44) : 0.03;
    var s = Math.sin(walker.phase);
    var c = Math.cos(walker.phase);
    var bob = moving ? Math.abs(s) * 0.032 : Math.sin(walker.phase) * 0.012;

    // Trigger expanding cyan footstep shockwaves when left or right shoe lands!
    if (moving) {
      var side = s > 0.85 ? 1 : (s < -0.85 ? -1 : 0);
      if (side !== 0 && side !== walker.prevStepSide) {
        walker.prevStepSide = side;
        var footX = walker.x + Math.cos(walker.heading) * (side * 0.10) * S.size;
        var footZ = walker.z - Math.sin(walker.heading) * (side * 0.10) * S.size;
        spawnFootRipple(footX, S.hover, footZ, kind === 'girl3d' && S.visualStyle === 'vivid' ? 0x9ef3ff : 0x52e2ff);
      }
    }

    if (kind === 'girl3d' || kind === 'holoWalker') {
      var rig = kind === 'girl3d' ? girlRig : holoWalkerRig;
      applyRigStride(rig, walker.x, walker.z, walker.heading, s, c, strideAmp, bob);
      if (kind === 'girl3d') {
        girlReflRig.root.visible = S.reflect;
        if (S.reflect) {
          applyRigStride(girlReflRig, walker.x, walker.z, walker.heading, s, c, strideAmp, bob);
          girlReflRig.root.position.y = S.hover * 2;
        }
      }
    } else if (kind === 'gif') {
      var hop = moving ? Math.abs(Math.sin(walker.phase * 0.9)) * 0.035 : 0;
      gifGroup.position.set(walker.x, S.hover + hop, walker.z);
      gifGroup.scale.setScalar(S.size);
      // Flip horizontal sprite direction naturally when walking left vs right
      if (moving && Math.abs(vx) > 0.04) {
        var wantFlip = vx >= 0 ? 1 : -1;
        if (wantFlip !== activeGif.flipX) {
          activeGif.flipX = wantFlip;
          paintGifFrame(false);
        }
      }
      if (S.billboard) {
        // Face viewer horizontally (compensating stageRot yaw so Kooima Duo views always see full sprite width!)
        gifStand.rotation.set(0, -yaw, moving ? Math.sin(walker.phase) * 0.025 : 0);
      } else {
        gifStand.rotation.set(0, walker.heading * 0.35, 0);
      }
    }
  }

  function applyRigStride(rig, x, z, heading, s, c, amp, bob) {
    rig.root.position.set(x, S.hover, z);
    rig.root.rotation.y = heading;
    rig.root.scale.setScalar(S.size * (rig.root.scale.y < 0 ? 1 : 1));
    if (rig === girlReflRig) rig.root.scale.set(S.size, -S.size, S.size);

    rig.body.position.y = bob;
    rig.body.rotation.z = -s * amp * 0.06;
    rig.body.rotation.x = amp * 0.05;

    rig.legL.hip.rotation.x = s * amp;
    rig.legR.hip.rotation.x = -s * amp;
    rig.legL.knee.rotation.x = Math.max(0, -c) * amp * 0.85;
    rig.legR.knee.rotation.x = Math.max(0, c) * amp * 0.85;

    rig.armL.sh.rotation.x = -s * amp * 0.78;
    rig.armR.sh.rotation.x = s * amp * 0.78;
    rig.armL.sh.rotation.z = 0.09;
    rig.armR.sh.rotation.z = -0.09;
    rig.armL.elbow.rotation.x = -0.18 - Math.max(0, -s) * amp * 0.35;
    rig.armR.elbow.rotation.x = -0.18 - Math.max(0, s) * amp * 0.35;

    if (rig.skirt) {
      rig.skirt.rotation.z = s * amp * 0.09;
      rig.skirt.rotation.x = -0.04 - Math.abs(s) * 0.04;
    }
    if (rig.head) {
      rig.head.rotation.y = Math.sin(walker.roamT * 1.4) * 0.14;
      rig.head.rotation.z = s * amp * 0.04;
    }
  }

  /* ---------- 13. Exhibit Registry (3D Walkers + Built-in GIFs + Custom GIFs + Optional Classics) ---------- */
  var builtInGirlGif = makeBuiltInGifClip('girl');
  var builtInNekoGif = makeBuiltInGifClip('neko');
  var customGifRecords = []; // Loaded from IndexedDB + user uploads
  var exhibits = [];
  var cur = 0, phase = 'in', reveal = 0, dissolve = 0, pending = -1;
  var yaw = 0.18, pitch = 0, lastTouch = -10, time = 0;

  function rebuildExhibits(selectId) {
    var curId = selectId || (exhibits[cur] && exhibits[cur].id) || 'girl3d';
    exhibits = [
      { id: 'girl3d', name: '漫步少女', badge: '3D 走动人物', kind: 'girl3d' },
      { id: 'holoWalker', name: '全息行者', badge: '3D 全息行者', kind: 'holoWalker' }
    ];
    // Put user's custom uploaded GIFs right up front so they are immediately accessible!
    customGifRecords.forEach(function (rec) {
      exhibits.push({
        id: rec.id,
        name: rec.name,
        badge: '自定义 GIF',
        kind: 'gif',
        custom: true,
        rec: rec
      });
    });
    exhibits.push(
      { id: 'gif-girl', name: '像素少女 GIF', badge: '动态 GIF 预设', kind: 'gif', clip: builtInGirlGif },
      { id: 'gif-neko', name: '漫步小猫 GIF', badge: '动态 GIF 预设', kind: 'gif', clip: builtInNekoGif }
    );
    if (S.includeClassic) {
      classicModels.forEach(function (cm, idx) {
        exhibits.push({ id: 'classic-' + idx, name: cm.name, badge: '经典全息 1.0', kind: 'classic', classicIdx: idx });
      });
    }

    var nextIdx = 0;
    for (var i = 0; i < exhibits.length; i++) {
      if (exhibits[i].id === curId) { nextIdx = i; break; }
    }
    applyExhibit(nextIdx);
  }

  function decodeCustomRecordToRuntime(rec) {
    if (rec._decoded) {
      setGifClip(rec._clip || null, rec._video || null, rec._img || null);
      updateGifMetaText();
      return;
    }
    rec._decoded = true;
    var mime = (rec.mime || '').toLowerCase();
    var buf = rec.buffer;
    if (!buf) return;

    if (mime.indexOf('gif') >= 0 || isGifHeader(buf)) {
      try {
        rec._clip = decodeGifBuffer(buf);
        rec._clip.autoRef = detectCornerBg(rec._clip.frames[0].rgba, rec._clip.width, rec._clip.height);
        if (exhibits[cur] && exhibits[cur].id === rec.id) {
          setGifClip(rec._clip, null, null);
          updateGifMetaText();
        }
        return;
      } catch (err) { /* fallback to Image below */ }
    }
    if (mime.indexOf('video') >= 0) {
      var blobV = new Blob([buf], { type: mime || 'video/mp4' });
      var vd = document.createElement('video');
      vd.muted = true; vd.loop = true; vd.playsInline = true; vd.autoplay = true;
      vd.src = URL.createObjectURL(blobV);
      vd.addEventListener('loadeddata', function () {
        var p = vd.play(); if (p && p.catch) p.catch(function () {});
        if (exhibits[cur] && exhibits[cur].id === rec.id) {
          setGifClip(null, vd, null);
          updateGifMetaText();
        }
      });
      rec._video = vd;
      return;
    }
    var blobI = new Blob([buf], { type: mime || 'image/png' });
    var im = new Image();
    im.onload = function () {
      if (exhibits[cur] && exhibits[cur].id === rec.id) {
        setGifClip(null, null, im);
        updateGifMetaText();
      }
    };
    im.src = URL.createObjectURL(blobI);
    rec._img = im;
  }

  function isGifHeader(buf) {
    if (!buf || buf.byteLength < 6) return false;
    var u = new Uint8Array(buf, 0, 6);
    var s = String.fromCharCode(u[0], u[1], u[2], u[3], u[4], u[5]);
    return s === 'GIF87a' || s === 'GIF89a';
  }

  function updateGifMetaText() {
    var ex = exhibits[cur];
    if (!ex) return;
    if (ex.kind === 'gif' && activeGif.clip) {
      $('gif-meta').textContent = activeGif.clip.frames.length + ' 帧 · ' + activeGif.clip.width + '×' + activeGif.clip.height;
    } else if (ex.kind === 'gif' && activeGif.videoEl) {
      $('gif-meta').textContent = '循环视频';
    } else if (ex.kind === 'gif') {
      $('gif-meta').textContent = '贴图投射';
    } else {
      $('gif-meta').textContent = ex.badge;
    }
  }

  function applyExhibit(i) {
    cur = clamp(i, 0, exhibits.length - 1);
    var ex = exhibits[cur];

    girlRig.root.visible = (ex.kind === 'girl3d');
    girlReflRig.root.visible = (ex.kind === 'girl3d' && S.reflect);
    holoWalkerRig.root.visible = (ex.kind === 'holoWalker');
    gifGroup.visible = (ex.kind === 'gif');
    classicMesh.visible = (ex.kind === 'classic');

    if (ex.kind === 'gif') {
      if (ex.clip) setGifClip(ex.clip, null, null);
      else if (ex.rec) decodeCustomRecordToRuntime(ex.rec);
    } else if (ex.kind === 'classic') {
      var cm = classicModels[ex.classicIdx], bb = cm.geo.boundingBox;
      classicMesh.geometry = cm.geo;
      holoMat.uniforms.uY0.value = bb.min.y;
      holoMat.uniforms.uY1.value = bb.max.y;
      classicMesh.position.y = -(bb.min.y + bb.max.y) / 2;
    }

    $('exhibit-name').textContent = ex.name;
    $('exhibit-badge').textContent = ex.badge;
    $('b-del-gif').hidden = !ex.custom;
    $('gif-key-box').style.display = ex.kind === 'gif' ? '' : 'none';
    updateGifMetaText();

    // Update bottom bar dots
    var d = $('dots'); d.innerHTML = '';
    exhibits.forEach(function (_, k) {
      var b = document.createElement('b');
      if (k === cur) b.className = 'on';
      d.appendChild(b);
    });

    // Update panel exhibit chips
    var list = $('exhibit-list'); list.innerHTML = '';
    exhibits.forEach(function (item, k) {
      var btn = document.createElement('button');
      btn.type = 'button';
      btn.className = 'ex-chip' + (k === cur ? ' on' : '');
      btn.textContent = item.name;
      btn.addEventListener('click', function () { nextModel(k); });
      list.appendChild(btn);
    });
  }

  function nextModel(i) {
    pending = (i == null ? (cur + 1) % exhibits.length : i);
    if (pending === cur && phase === 'idle') { replay(); return; }
    if (phase !== 'out') { phase = 'out'; dissolve = 0; }
  }
  function replay() { phase = 'in'; reveal = 0; dissolve = 0; }

  /* ---------- 14. File Upload / Drag-Drop / Clipboard Paste ---------- */
  function handleUploadedFiles(fileList) {
    if (!fileList || !fileList.length) return;
    var files = Array.prototype.slice.call(fileList);
    var lastAddedId = null;
    var chain = Promise.resolve();

    files.forEach(function (file) {
      chain = chain.then(function () {
        return file.arrayBuffer().then(function (buf) {
          var cleanName = (file.name || '我的GIF').replace(/\.[a-z0-9]+$/i, '').slice(0, 18) || '我的GIF';
          var id = 'custom-' + Date.now() + '-' + Math.floor(Math.random() * 1000);
          var rec = {
            id: id,
            name: cleanName,
            mime: file.type || 'image/gif',
            buffer: buf,
            createdAt: Date.now()
          };
          customGifRecords.unshift(rec);
          lastAddedId = id;
          return dbPutGif({
            id: rec.id, name: rec.name, mime: rec.mime, buffer: rec.buffer, createdAt: rec.createdAt
          });
        });
      }).catch(function (err) {
        if (window.console) console.warn('GIF load failed:', err);
      });
    });

    chain.then(function () {
      if (lastAddedId) {
        resetWalkerPose();
        rebuildExhibits(lastAddedId);
        replay();
        $('hint').classList.add('gone');
      }
    });
  }

  $('upload-btn').addEventListener('click', function () { $('gif-input').click(); });
  $('b-upload').addEventListener('click', function () { $('gif-input').click(); });
  $('gif-input').addEventListener('change', function () {
    if (this.files && this.files.length) handleUploadedFiles(this.files);
    this.value = '';
  });

  $('b-del-gif').addEventListener('click', function () {
    var ex = exhibits[cur];
    if (!ex || !ex.custom) return;
    var delId = ex.id;
    customGifRecords = customGifRecords.filter(function (r) { return r.id !== delId; });
    dbDeleteGif(delId);
    rebuildExhibits('girl3d');
    replay();
  });

  // Drag & Drop + Paste
  var dragDepth = 0;
  window.addEventListener('dragenter', function (e) {
    e.preventDefault(); dragDepth++; $('drop-mask').hidden = false;
  });
  window.addEventListener('dragover', function (e) { e.preventDefault(); });
  window.addEventListener('dragleave', function (e) {
    e.preventDefault(); dragDepth = Math.max(0, dragDepth - 1);
    if (!dragDepth) $('drop-mask').hidden = true;
  });
  window.addEventListener('drop', function (e) {
    e.preventDefault(); dragDepth = 0; $('drop-mask').hidden = true;
    if (e.dataTransfer && e.dataTransfer.files && e.dataTransfer.files.length) {
      handleUploadedFiles(e.dataTransfer.files);
    }
  });
  window.addEventListener('paste', function (e) {
    var items = e.clipboardData && e.clipboardData.files;
    if (items && items.length) handleUploadedFiles(items);
  });

  /* ---------- 15. Kooima Generalized Off-Axis Perspective & Layout (100% 1.0 Compatible) ---------- */
  var W = 0, Hh = 0, L = { upB: 0, loT: 0, src: 'manual' };

  function readSegments() {
    try {
      var segs = (window.visualViewport && window.visualViewport.segments) ||
                 (window.getWindowSegments && window.getWindowSegments());
      if (segs && segs.length === 2 && segs[0].top !== segs[1].top) {
        var a = segs[0].top < segs[1].top ? segs[0] : segs[1], b = a === segs[0] ? segs[1] : segs[0];
        return { upB: a.top + a.height, loT: b.top };
      }
      if (segs && segs.length === 2) return { sideBySide: true };
    } catch (e) {}
    return null;
  }
  function posture() {
    try { return navigator.devicePosture ? navigator.devicePosture.type : null; } catch (e) { return null; }
  }

  var _va = new T.Vector3(), _vb = new T.Vector3(), _vc = new T.Vector3();
  var _vr = new T.Vector3(), _vu = new T.Vector3(), _vn = new T.Vector3(), _m = new T.Matrix4();
  function offAxis(camO, pa, pb, pc, pe) {
    _vr.subVectors(pb, pa).normalize(); _vu.subVectors(pc, pa).normalize();
    _vn.crossVectors(_vr, _vu).normalize();
    _va.subVectors(pa, pe); _vb.subVectors(pb, pe); _vc.subVectors(pc, pe);
    var d = -_va.dot(_vn); if (d < 0.01) d = 0.01;
    var n = 0.5, f = 400, k = n / d;
    camO.projectionMatrix.makePerspective(_vr.dot(_va) * k, _vr.dot(_vb) * k, _vu.dot(_vc) * k, _vu.dot(_va) * k, n, f);
    camO.projectionMatrixInverse.copy(camO.projectionMatrix).invert();
    camO.position.copy(pe);
    camO.quaternion.setFromRotationMatrix(_m.makeBasis(_vr, _vu, _vn));
    camO.updateMatrixWorld(true);
  }

  var PX_PER_M = 6450;
  var P = { upp: 0.01, Ww: 4, Hu: 3, Hl: 3, dist: 9 };
  var head = { ref: null, tAz: 0, tEl: 0, tD: 0.37, az: 0, el: 0, d: 0.37, last: -10, seen: false, avail: false };
  var _pe = new T.Vector3(), _a = new T.Vector3(), _b = new T.Vector3(), _c = new T.Vector3();

  function onHead(ev) {
    if (ev.lost) { head.seen = false; return; }
    var a = ev.a || 0.75, fov = rad(ev.fov || 70), t = Math.tan(fov / 2);
    var fx = a < 1 ? 2 * Math.atan(t * a) : fov, fy = a < 1 ? fov : 2 * Math.atan(t / a);
    var ax = (ev.x - 0.5) * fx, ay = (ev.y - 0.5) * fy;
    if (S.flipX) ax = -ax;
    if (S.flipY) ay = -ay;
    if (!head.ref) head.ref = { ax: ax, ay: ay };
    head.tAz = clamp((ax - head.ref.ax) * S.gain, -1.1, 1.1);
    head.tEl = clamp((ay - head.ref.ay) * S.gain, -0.6, 0.9);
    head.tD = clamp(0.075 / Math.tan(Math.max(0.02, ev.w * fx / 2)), 0.18, 1.0);
    head.last = time; head.seen = true;
  }
  function headActive() { return S.track && head.seen && time - head.last < 0.8; }
  function stepHead(dt) {
    var on = headActive(), k = 1 - Math.exp(-dt / (on ? 0.07 : 0.35));
    head.az += ((on ? head.tAz : 0) - head.az) * k;
    head.el += ((on ? head.tEl : 0) - head.el) * k;
    head.d += ((on ? head.tD : 0.37) - head.d) * k;
  }

  function portalCams() {
    var D = head.d * PX_PER_M * P.upp, e = clamp(rad(S.elev) + head.el, 0.08, 1.45), phi = Math.PI - rad(S.angle);
    _pe.set(D * Math.sin(head.az) * Math.cos(e), D * Math.sin(e), D * Math.cos(head.az) * Math.cos(e));
    var hw = P.Ww / 2;
    offAxis(camLo, _a.set(-hw, 0, P.Hl), _b.set(hw, 0, P.Hl), _c.set(-hw, 0, 0), _pe);
    offAxis(camUp, _a.set(-hw, 0, 0), _b.set(hw, 0, 0), _c.set(-hw, P.Hu * Math.sin(phi), -P.Hu * Math.cos(phi)), _pe);
  }
  function mainCam() {
    var e = Math.atan(0.24) + head.el * 0.6, az = head.az * 0.6, d = P.dist * Math.sqrt(1 + 0.24 * 0.24);
    camMain.position.set(d * Math.sin(az) * Math.cos(e), 0.98 + d * Math.sin(e), d * Math.cos(az) * Math.cos(e));
    camMain.lookAt(0, 0.92, 0);
  }

  var needLayout = true;
  function layout() {
    needLayout = false;
    var w = window.innerWidth, h = window.innerHeight;
    if (!w || !h) return;
    if (w !== W || h !== Hh) { W = w; Hh = h; renderer.setSize(W, Hh, false); }

    var seg = readSegments();
    if (seg && seg.upB != null) { L.upB = seg.upB; L.loT = seg.loT; L.src = 'segments'; }
    else { L.upB = L.loT = Math.round(Hh * S.crease); L.src = seg && seg.sideBySide ? 'side' : 'manual'; }
    root.style.setProperty('--crease-y', L.upB + 'px');
    root.style.setProperty('--lower-top', L.loT + 'px');

    if (mode === 3) {
      var loH = Hh - L.loT;
      var upp = 4.4 / Math.min(W, 1.5 * L.upB, 1.5 * loH);
      var Ww = W * upp, Hu = L.upB * upp, Hl = loH * upp;
      var sab = parseFloat(getComputedStyle(root).getPropertyValue('--sab')) || 0;
      var fit = Math.min(1, (Hl - (66 + sab) * upp) / 2.5, Ww / 2.8);
      var zc = 1.2 * fit + 0.05;
      stage.position.set(0, 0, zc); stage.scale.setScalar(fit);
      P.upp = upp; P.Ww = Ww; P.Hu = Hu; P.Hl = Hl;
      portalCams();
      grid.visible = true; grid.scale.set(Ww, 1, Hl); grid.position.set(0, 0, Hl / 2);
      grid.material.uniforms.uCenter.value.set(0, zc);
      grid.material.uniforms.uCell.value = 0.3 * fit;
    } else {
      stage.position.set(0, 0, 0); stage.scale.setScalar(1);
      grid.visible = false;
      var asp = W / Hh, t = Math.tan(rad(camMain.fov / 2));
      var dist = Math.max(1.88 / t, 1.52 / (t * asp)) * 1.04;
      camMain.aspect = asp;
      P.dist = dist;
      camMain.updateProjectionMatrix();
      mainCam();
    }
    sendRect();
    updateInfo();
  }
  function askLayout() { needLayout = true; }

  /* ---------- 16. Camera Passthrough & Native iOS Bridge (100% 1.0 Compatible) ---------- */
  var cam = { state: 'idle', stream: null, facing: '' };
  var CAM_TEXT = {
    requesting: '正在请求摄像头权限…',
    denied: '摄像头权限被拒绝 · DEMO 背景（点此重试）',
    nocamera: '未找到摄像头 · DEMO 背景（点此重试）',
    insecure: '需要 HTTPS 或 localhost 才能用摄像头 · DEMO 背景',
    unsupported: '此浏览器不支持摄像头 · DEMO 背景',
    busy: '摄像头被占用 · DEMO 背景（点此重试）',
    error: '摄像头启动失败 · DEMO 背景（点此重试）'
  };

  var bridge = window.__isMinestNative && window.webkit && window.webkit.messageHandlers &&
               window.webkit.messageHandlers.minestBridge;
  var nat = { ok: !!bridge, on: false, timer: 0, rect: '' };

  function wantsCamera() {
    if (mode === 2) return true;
    if (mode === 3) return !!(S.duoCam || nat.ok);
    return false;
  }

  function nsend(action, payload) {
    try { bridge.postMessage(Object.assign({ action: action }, payload || {})); } catch (e) { nat.ok = false; }
  }
  function camRect() { return { x: 0, y: 0, w: W, h: mode === 3 ? L.upB : Hh, zoom: S.camZoom }; }
  function sendRect() {
    video.style.transform = S.camZoom > 1 ? 'scale(' + S.camZoom + ')' : '';
    if (!nat.on) return;
    var r = camRect(), key = [r.w, r.h, r.zoom].join(',');
    if (key !== nat.rect) { nat.rect = key; nsend('holoRect', r); }
  }
  function nativeCamEvent(ev) {
    clearTimeout(nat.timer);
    if (!nat.on) return;
    if (ev.state === 'requesting') return;
    if (ev.state === 'live') {
      if (!wantsCamera()) { stopCamera(); return; }
      cam.stream = { native: true }; cam.facing = 'environment'; head.avail = !!ev.tracking;
      root.classList.add('native-cam'); nat.rect = ''; setCam('live'); sendRect();
    } else {
      nat.on = false; cam.stream = null; head.avail = false; root.classList.remove('native-cam');
      setCam(ev.state || 'error');
    }
  }
  window.HOLO.nativeEvent = function (ev) {
    if (!ev) return;
    if (ev.type === 'head') onHead(ev); else if (ev.type === 'cam') nativeCamEvent(ev);
  };

  function setCam(state) {
    cam.state = state;
    var chip = $('cam-chip');
    var duoBtn = $('duo-cam-btn');
    duoBtn.hidden = (mode !== 3 || nat.ok);
    duoBtn.classList.toggle('on', !!S.duoCam);
    duoBtn.textContent = S.duoCam ? '📷 关闭透视（回点阵）' : '📷 开启透视';

    if (!wantsCamera()) {
      chip.hidden = true;
      body.dataset.bg = 'none';
      return;
    }
    chip.hidden = false; chip.dataset.state = state;
    if (state === 'live') {
      chip.textContent = '● 实时摄像头' + (cam.facing === 'environment' ? '（后置）' : cam.facing === 'user' ? '（前置）' : '') +
        (head.avail && S.track ? ' · 头部追踪' : '');
      body.dataset.bg = 'video';
    } else if (state === 'requesting' || state === 'idle') {
      chip.textContent = CAM_TEXT.requesting; body.dataset.bg = 'none';
    } else {
      chip.textContent = CAM_TEXT[state] || CAM_TEXT.error;
      body.dataset.bg = mode === 3 ? 'none' : 'demo';
    }
    updateInfo();
  }

  function stopCamera() {
    if (nat.on) {
      clearTimeout(nat.timer); nat.on = false; nsend('holoStop');
      cam.stream = null; head.avail = false; head.seen = false; root.classList.remove('native-cam');
    }
    if (cam.stream && cam.stream.getTracks) {
      cam.stream.getTracks().forEach(function (t) { t.onended = null; t.stop(); });
    }
    cam.stream = null;
    try { video.pause(); } catch (e) {}
    video.srcObject = null;
    cam.state = 'idle';
  }

  function startCamera() {
    if (cam.stream || cam.state === 'requesting') return;
    if (nat.ok) {
      nat.on = true; nat.rect = ''; setCam('requesting');
      nsend('holoStart', Object.assign(camRect(), { tracking: true }));
      nat.timer = setTimeout(function () {
        if (nat.on && cam.state === 'requesting') { nat.on = false; nat.ok = false; cam.state = 'idle'; startCamera(); }
      }, 2500);
      return;
    }
    if (!navigator.mediaDevices || !navigator.mediaDevices.getUserMedia) {
      setCam(window.isSecureContext ? 'unsupported' : 'insecure'); return;
    }
    setCam('requesting');
    navigator.mediaDevices.getUserMedia({
      audio: false,
      video: { facingMode: { ideal: 'environment' }, width: { ideal: 1920 }, height: { ideal: 1080 } }
    }).then(function (stream) {
      if (!wantsCamera() || document.hidden) {
        stream.getTracks().forEach(function (t) { t.stop(); }); cam.state = 'idle'; return;
      }
      cam.stream = stream;
      var tr = stream.getVideoTracks()[0];
      try { cam.facing = (tr.getSettings && tr.getSettings().facingMode) || ''; } catch (e) { cam.facing = ''; }
      tr.onended = function () { stopCamera(); setCam('error'); };
      video.srcObject = stream;
      var p = video.play(); if (p && p.catch) p.catch(function () {});
      setCam('live');
    }).catch(function (err) {
      var n = (err && err.name) || '';
      cam.stream = null;
      setCam(n === 'NotAllowedError' || n === 'SecurityError' || n === 'PermissionDeniedError' ? 'denied'
        : n === 'NotFoundError' || n === 'DevicesNotFoundError' || n === 'OverconstrainedError' ? 'nocamera'
        : n === 'NotReadableError' || n === 'TrackStartError' || n === 'AbortError' ? 'busy' : 'error');
    });
  }

  function setMode(m) {
    mode = m; body.dataset.mode = String(m);
    Array.prototype.forEach.call(document.querySelectorAll('.seg button'), function (b) {
      b.classList.toggle('on', +b.dataset.mode === m);
    });
    if (wantsCamera()) { if (cam.stream) setCam('live'); else startCamera(); }
    else { stopCamera(); setCam('idle'); }
    askLayout();
  }

  $('duo-cam-btn').addEventListener('click', function () {
    S.duoCam = !S.duoCam;
    save();
    setMode(mode);
  });

  /* ---------- 17. Pointer Gestures: Drag Rotate / Pinch Zoom / Tap Switch / Long-Press Panel ---------- */
  var pts = new Map(), g = null, lpTimer = 0, pinch0 = 0, size0 = 1;
  function pinchDist() { var a = Array.from(pts.values()); return Math.hypot(a[0].x - a[1].x, a[0].y - a[1].y) || 1; }
  function touched() { lastTouch = time; $('hint').classList.add('gone'); }

  canvas.addEventListener('pointerdown', function (e) {
    try { canvas.setPointerCapture(e.pointerId); } catch (err) {}
    pts.set(e.pointerId, { x: e.clientX, y: e.clientY });
    if (pts.size === 1) {
      g = { x0: e.clientX, y0: e.clientY, t0: performance.now(), moved: false, multi: false, long: false };
      clearTimeout(lpTimer);
      lpTimer = setTimeout(function () {
        if (g && !g.moved && !g.multi && pts.size === 1) { g.long = true; openPanel(true); }
      }, 550);
    } else if (pts.size === 2 && g) {
      g.multi = true; clearTimeout(lpTimer); pinch0 = pinchDist(); size0 = S.size;
    }
    touched();
  });
  canvas.addEventListener('pointermove', function (e) {
    var p = pts.get(e.pointerId); if (!p || !g) return;
    var dx = e.clientX - p.x, dy = e.clientY - p.y;
    p.x = e.clientX; p.y = e.clientY;
    if (pts.size >= 2) {
      S.size = clamp(size0 * pinchDist() / pinch0, 0.5, 2); syncUI(); touched(); return;
    }
    if (g.multi) return;
    if (!g.moved && Math.hypot(e.clientX - g.x0, e.clientY - g.y0) > 8) { g.moved = true; clearTimeout(lpTimer); }
    if (g.moved && !g.long) {
      yaw += dx * 0.011; pitch = clamp(pitch + dy * 0.007, -0.45, 0.45); touched();
    }
  });
  function pointerEnd(e) {
    if (!pts.has(e.pointerId)) return;
    pts.delete(e.pointerId);
    if (pts.size === 0 && g) {
      clearTimeout(lpTimer);
      var tap = e.type === 'pointerup' && !g.moved && !g.multi && !g.long && performance.now() - g.t0 < 400;
      g = null;
      if (tap) { if (!$('panel').hidden) openPanel(false); else nextModel(); }
      save();
    }
  }
  canvas.addEventListener('pointerup', pointerEnd);
  canvas.addEventListener('pointercancel', pointerEnd);
  canvas.addEventListener('contextmenu', function (e) { e.preventDefault(); });
  canvas.addEventListener('wheel', function (e) {
    e.preventDefault(); S.size = clamp(S.size * Math.exp(-e.deltaY * 0.0012), 0.5, 2); syncUI(); touched(); save();
  }, { passive: false });
  document.addEventListener('gesturestart', function (e) { e.preventDefault(); });

  function resetView() { yaw = 0.18; pitch = 0; S.size = 1; S.hover = DEF.hover; resetWalkerPose(); syncUI(); save(); }

  /* ---------- 18. Control Panel Bindings ---------- */
  function openPanel(on) { $('panel').hidden = !on; if (on) $('hint').classList.add('gone'); }

  function bindToggle(id, key, after) {
    $(id).addEventListener('change', function () { S[key] = this.checked; save(); if (after) after(); });
  }
  function bindSlider(id, key, relayout, after) {
    $(id).addEventListener('input', function () {
      S[key] = parseFloat(this.value); syncUI(true); save();
      if (relayout) askLayout();
      if (after) after();
    });
  }
  function bindSeg(containerId, attr, key, after) {
    Array.prototype.forEach.call($(containerId).querySelectorAll('button'), function (btn) {
      btn.addEventListener('click', function () {
        S[key] = btn.getAttribute(attr);
        syncUI(); save();
        if (after) after();
      });
    });
  }

  function syncUI(skipInputs) {
    if (!skipInputs) {
      $('t-scan').checked = S.scan;
      $('t-flicker').checked = S.flicker;
      $('t-particles').checked = S.particles;
      $('t-dotStage').checked = S.dotStage;
      $('t-deskProp').checked = S.deskProp;
      $('t-reflect').checked = S.reflect;
      $('t-billboard').checked = S.billboard;
      $('t-classic').checked = S.includeClassic;
      $('t-track').checked = S.track;
      $('t-flipX').checked = S.flipX;
      $('t-flipY').checked = S.flipY;
      ['hover', 'size', 'opacity', 'crease', 'angle', 'elev', 'camZoom', 'gain'].forEach(function (k) {
        $('s-' + k).value = S[k];
      });
      $('s-speed').value = S.walkSpeed;
      $('s-keyTol').value = S.keyTol;
      $('s-depth').value = S.gifDepth;
    }
    Array.prototype.forEach.call($('walk-seg').querySelectorAll('button'), function (b) {
      b.classList.toggle('on', b.getAttribute('data-walk') === S.walkMode);
    });
    Array.prototype.forEach.call($('style-seg').querySelectorAll('button'), function (b) {
      b.classList.toggle('on', b.getAttribute('data-style') === S.visualStyle);
    });
    Array.prototype.forEach.call($('key-seg').querySelectorAll('button'), function (b) {
      b.classList.toggle('on', b.getAttribute('data-key') === S.keyMode);
    });

    $('v-hover').textContent = S.hover.toFixed(2);
    $('v-size').textContent = S.size.toFixed(2) + '×';
    $('v-opacity').textContent = Math.round(S.opacity * 100) + '%';
    $('v-crease').textContent = Math.round(S.crease * 100) + '%';
    $('v-angle').textContent = Math.round(S.angle) + '°';
    $('v-elev').textContent = Math.round(S.elev) + '°';
    $('v-camZoom').textContent = S.camZoom.toFixed(2) + '×';
    $('v-gain').textContent = S.gain.toFixed(2) + '×';
    $('v-speed').textContent = S.walkSpeed.toFixed(2) + '×';
    $('v-keyTol').textContent = Math.round(S.keyTol);
    $('v-depth').textContent = Math.round(S.gifDepth * 100) + '%';
  }

  function updateInfo() {
    var p = posture();
    $('duo-info').textContent =
      (L.src === 'segments' ? '折痕：系统分区' : L.src === 'side' ? '检测到左右分屏，请转成上下姿态' : '折痕：手动') +
      ' · 姿态：' + (p || '无 API');
    $('s-crease').disabled = L.src === 'segments';
    $('track-info').textContent = !nat.ok ? '仅 App 内可用' : !head.avail ? (cam.state === 'live' ? '此设备不支持双摄同开' : '未启动')
      : !S.track ? '已关闭' : headActive() ? '追踪中 · ' + Math.round(head.d * 100) + ' cm' : '未检测到人脸';
  }

  bindSeg('walk-seg', 'data-walk', 'walkMode');
  bindSeg('style-seg', 'data-style', 'visualStyle');
  bindSeg('key-seg', 'data-key', 'keyMode', function () { paintGifFrame(true); });
  bindSlider('s-speed', 'walkSpeed');
  bindSlider('s-keyTol', 'keyTol', false, function () { paintGifFrame(true); });
  bindSlider('s-depth', 'gifDepth', false, function () { paintGifFrame(true); });

  bindToggle('t-dotStage', 'dotStage');
  bindToggle('t-deskProp', 'deskProp');
  bindToggle('t-reflect', 'reflect', function () { paintGifFrame(false); });
  bindToggle('t-billboard', 'billboard');
  bindToggle('t-classic', 'includeClassic', function () { rebuildExhibits(); });

  bindToggle('t-scan', 'scan');
  bindToggle('t-flicker', 'flicker');
  bindToggle('t-particles', 'particles');
  bindSlider('s-hover', 'hover');
  bindSlider('s-size', 'size');
  bindSlider('s-opacity', 'opacity');

  bindToggle('t-track', 'track');
  bindToggle('t-flipX', 'flipX');
  bindToggle('t-flipY', 'flipY');
  ['t-flipX', 't-flipY'].forEach(function (id) { $(id).addEventListener('change', function () { head.ref = null; }); });
  $('t-track').addEventListener('change', function () { if (cam.stream) setCam('live'); });
  bindSlider('s-camZoom', 'camZoom', true);
  bindSlider('s-gain', 'gain');
  $('b-recenter').addEventListener('click', function () { head.ref = null; });
  bindSlider('s-crease', 'crease', true);
  bindSlider('s-angle', 'angle', true);
  bindSlider('s-elev', 'elev', true);

  $('b-reset').addEventListener('click', resetView);
  $('b-replay').addEventListener('click', replay);
  $('b-cam').addEventListener('click', function () { if (wantsCamera() && !cam.stream) { cam.state = 'idle'; startCamera(); } });
  $('cam-chip').addEventListener('click', function () { if (wantsCamera() && !cam.stream) { cam.state = 'idle'; startCamera(); } });
  $('p-close').addEventListener('click', function () { openPanel(false); });
  $('gear').addEventListener('click', function () { openPanel($('panel').hidden); });
  $('exhibit').addEventListener('click', function () { nextModel(); touched(); });
  Array.prototype.forEach.call(document.querySelectorAll('.seg button'), function (b) {
    b.addEventListener('click', function () { setMode(+b.dataset.mode); });
  });
  window.addEventListener('keydown', function (e) {
    if (e.key === '1' || e.key === '2' || e.key === '3') setMode(+e.key);
    else if (e.key === ' ' || e.key === 'ArrowRight') nextModel();
    else if (e.key === 'r') resetView();
    else if (e.key === 'p') openPanel($('panel').hidden);
    else if (e.key === 'Escape') openPanel(false);
  });

  /* ---------- 19. Lifecycle & Dynamic Pixel Ratio ---------- */
  window.addEventListener('resize', askLayout);
  window.addEventListener('orientationchange', askLayout);
  if (window.visualViewport) window.visualViewport.addEventListener('resize', askLayout);
  try { if (navigator.devicePosture) navigator.devicePosture.addEventListener('change', askLayout); } catch (e) {}
  var resumeCam = false;
  document.addEventListener('visibilitychange', function () {
    if (document.hidden) { resumeCam = !!cam.stream; stopCamera(); }
    else { last = 0; if (resumeCam && wantsCamera()) startCamera(); resumeCam = false; askLayout(); }
  });
  window.addEventListener('pagehide', stopCamera);
  canvas.addEventListener('webglcontextlost', function (e) { e.preventDefault(); });
  canvas.addEventListener('webglcontextrestored', askLayout);

  var res = 1, acc = 0, cnt = 0, good = 0, hold = 0, fps = 0;
  function basePR() { return Math.min(window.devicePixelRatio || 1, 2); }
  function applyRes() { renderer.setPixelRatio(basePR() * res); }
  function perf(ms, now) {
    if (ms > 250 || ms <= 0) return;
    acc += ms; cnt++;
    if (cnt < 45) return;
    var avg = acc / cnt; acc = 0; cnt = 0; fps = 1000 / avg;
    if (avg > 21 && res > 0.5) { res = Math.max(0.5, res * 0.85); applyRes(); good = 0; hold = now + 4000; }
    else if (avg < 17.6 && res < 1 && now > hold) { if (++good >= 3) { res = Math.min(1, res * 1.12); applyRes(); good = 0; } }
    else good = 0;
    if (!$('panel').hidden) {
      $('stats').textContent = Math.round(fps) + ' FPS · 渲染 ' + Math.round(W * basePR() * res) + '×' +
        Math.round(Hh * basePR() * res) + '（' + Math.round(res * 100) + '%）';
    }
  }

  /* ---------- 20. Main Animation & Kooima Dual-Viewport Render Loop ---------- */
  var last = 0, U = holoMat.uniforms, UW = holoWalkerMat.uniforms, SH = H.shared, frameNo = 0;
  function ease(t) { return t * t * (3 - 2 * t); }

  function frame(now) {
    requestAnimationFrame(frame);
    var ms = last ? now - last : 16.7; last = now;
    var dt = Math.min(0.1, ms / 1000); time += dt;
    perf(ms, now);
    if (needLayout || window.innerWidth !== W || window.innerHeight !== Hh) layout();
    if (!W) return;

    // Scanline materialization / disintegration state machine across ALL exhibit types!
    var revVal = 2, disVal = 0;
    if (phase === 'in') {
      reveal += dt / 1.45;
      if (reveal >= 1) { phase = 'idle'; revVal = 2; }
      else revVal = ease(reveal) * 1.01;
      disVal = 0;
    } else if (phase === 'out') {
      dissolve += dt / 0.65;
      disVal = Math.min(1, dissolve);
      revVal = 2;
      if (dissolve >= 1) {
        applyExhibit(pending < 0 ? cur : pending);
        pending = -1;
        replay();
        revVal = 0; disVal = 0;
      }
    }

    U.uReveal.value = UW.uReveal.value = girlUniforms.uReveal.value = gifUniforms.uReveal.value = revVal;
    U.uDissolve.value = UW.uDissolve.value = girlUniforms.uDissolve.value = gifUniforms.uDissolve.value = disVal;

    SH.uPower.value += ((phase === 'idle' ? 1 : 1.85) - SH.uPower.value) * Math.min(1, dt * 5);
    SH.uTime.value = time;

    var scanNum = S.scan ? 1 : 0;
    var flickNum = S.flicker ? 1 : 0;
    var holoMixTarget = S.visualStyle === 'holo' ? 1 : 0;
    girlUniforms.uHoloMix.value += (holoMixTarget - girlUniforms.uHoloMix.value) * Math.min(1, dt * 8);
    gifUniforms.uHoloMix.value = girlUniforms.uHoloMix.value;

    U.uScan.value = UW.uScan.value = girlUniforms.uScan.value = gifUniforms.uScan.value = scanNum;
    U.uFlicker.value = UW.uFlicker.value = flickNum;
    U.uOpacity.value = UW.uOpacity.value = girlUniforms.uOpacity.value = gifUniforms.uOpacity.value = S.opacity;

    parts.visible = S.particles;
    dotStageGroup.visible = S.dotStage && cam.state !== 'live';
    deskPropGroup.visible = S.deskProp;

    // Gentle stage rotation only when viewing classic static exhibits; walking characters & GIFs own their 3D motion!
    var ex = exhibits[cur];
    if (ex && ex.kind === 'classic') {
      if (!g && time - lastTouch > 3) yaw += dt * 0.25;
      var cm = classicModels[ex.classicIdx], bb = cm.geo.boundingBox, hh = (bb.max.y - bb.min.y) / 2;
      classicPivot.scale.setScalar(S.size);
      classicPivot.position.y = S.hover + cm.lift + hh * S.size + (cm.bob ? Math.sin(time * 1.3) * 0.04 : 0);
    } else if (ex) {
      stepWalkerMotion(dt, ex.kind);
      if (ex.kind === 'gif') stepGifFrames(dt);
    }
    stageRot.rotation.set(pitch, yaw, 0);
    updateRipples(dt);

    // Camera / Kooima off-axis projection
    stepHead(dt);
    if (mode === 3) portalCams(); else mainCam();
    if (!$('panel').hidden && (frameNo++ % 20) === 0) updateInfo();

    var pr = renderer.getPixelRatio();
    renderer.setScissorTest(false); renderer.setViewport(0, 0, W, Hh); renderer.clear();
    if (mode !== 3) {
      SH.uViewH.value = Hh * pr;
      renderer.render(scene, camMain);
    } else {
      renderer.setScissorTest(true);
      var loH = Hh - L.loT;
      renderer.setViewport(0, Hh - L.upB, W, L.upB); renderer.setScissor(0, Hh - L.upB, W, L.upB);
      SH.uViewH.value = L.upB * pr; grid.visible = false;
      renderer.render(scene, camUp);
      renderer.setViewport(0, 0, W, loH); renderer.setScissor(0, 0, W, loH);
      SH.uViewH.value = loH * pr; grid.visible = true;
      renderer.render(scene, camLo);
    }
  }

  /* ---------- 21. Back Navigation (Native App & Spatial Home Frame) ---------- */
  var inFrame = false;
  try { inFrame = window.parent && window.parent !== window; } catch (e) { inFrame = true; }
  if (window.__isMinestNative || inFrame) {
    $('back').hidden = false;
    $('back').addEventListener('click', function () {
      stopCamera();
      try {
        if (inFrame && window.parent && window.parent.SpatialBridge && window.parent.SpatialBridge.leave) {
          window.parent.SpatialBridge.leave('back');
          return;
        }
      } catch (e) {}
      if (history.length > 1) history.back(); else location.href = '../index.html';
    });
  }

  /* ---------- 22. Boot ---------- */
  applyRes();
  syncUI();
  rebuildExhibits('girl3d');

  // Load saved custom GIFs from IndexedDB
  dbGetAllGifs().then(function (list) {
    if (list && list.length) {
      list.sort(function (a, b) { return (b.createdAt || 0) - (a.createdAt || 0); });
      customGifRecords = list;
      rebuildExhibits(exhibits[cur] ? exhibits[cur].id : 'girl3d');
    }
  });

  var qx = /[?&]ex=(\d+)/.exec(location.search);
  if (qx && +qx[1] < exhibits.length) applyExhibit(+qx[1]);

  var q = /[?&]mode=([123])/.exec(location.search);
  var defaultMode = q ? +q[1] : (posture() === 'folded' ? 3 : 1);
  setMode(defaultMode);

  setTimeout(function () { $('hint').classList.add('gone'); }, 8000);
  requestAnimationFrame(frame);

  window.HOLO.debug = function () {
    var ex = exhibits[cur] || {};
    return {
      version: '2.0',
      mode: mode,
      exhibit: ex.name,
      exhibitKind: ex.kind,
      exhibitCount: exhibits.length,
      customGifCount: customGifRecords.length,
      walker: { x: +walker.x.toFixed(3), z: +walker.z.toFixed(3), heading: +walker.heading.toFixed(3), walkMode: S.walkMode },
      phase: phase,
      cam: cam.state,
      facing: cam.facing,
      res: res,
      fps: Math.round(fps),
      layout: { W: W, H: Hh, upB: L.upB, loT: L.loT, src: L.src },
      head: { az: head.az, el: head.el, d: head.d, active: headActive(), avail: head.avail },
      native: nat.on,
      settings: Object.assign({}, S)
    };
  };
})();

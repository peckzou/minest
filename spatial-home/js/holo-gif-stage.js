/* =========================================================================
   Minest · Spatial Home — Desk L-Fold 3D Walking Hologram & Custom GIF Stage
   (spatial-home/js/holo-gif-stage.js)
   Standalone non-destructive upgrade for the Holo Screen (`projector`):
   - Zero modifications to objects.js, room.js, app.js, or realistic.js.
   - Adds an L-shaped (~92° foldable) dual-screen dotted-matrix 3D hologram
     inspired by @niwachipi's foldable 3D walking character stage:
       * Upper upright OLED screen with crisp glowing dot-matrix, mini HUD,
         and optional miniature cyan desk prop for spatial depth cues.
       * Lower flat OLED deck with concentric cyan emitter ring, footstep
         shockwaves, sky-blue front pill button, and real-time cross-fold
         anamorphic floor reflection tracking the character's footsteps.
       * Mode 1 (`walk3d`): Built-in luminous 3D girl in white blouse & warm
         golden skirt autonomously walking/strolling around the holo-ring.
       * Mode 2 (`gif`): Pure-JS GIF89a multi-frame LZW decoder + IndexedDB
         persistence + smart background chroma/corner keying + 6-slice 3D
         volumetric depth stack + autonomous walking patrol & floor reflection!
       * Mode 3 (`classic`): Preserves the original text hologram 100% intact.
   ========================================================================= */
(function (root) {
  'use strict';
  if (root.SpatialHoloGifStage || !root.THREE || !root.SpatialObjects) return;

  var THREE = root.THREE;
  var SKEY = 'minest.holoLfold.v1';
  var DB_NAME = 'minest.holoGif.db';
  var DB_STORE = 'media';

  function clamp(v, a, b) { return v < a ? a : (v > b ? b : v); }
  function lerp(a, b, k) { return a + (b - a) * k; }
  function angDiff(to, from) {
    var d = (to - from) % (Math.PI * 2);
    if (d > Math.PI) d -= Math.PI * 2;
    if (d < -Math.PI) d += Math.PI * 2;
    return d;
  }

  /* -------------------------------------------------------------------------
     1. Pure-JS GIF89a Multi-Frame LZW Binary Decoder (zero external deps)
        Guarantees smooth frame-by-frame animation in WebGL CanvasTexture on
        Safari, Chrome, Firefox, and iOS WKWebView!
     ------------------------------------------------------------------------- */
  function decodeGifBuffer(arrayBuffer) {
    var bytes = new Uint8Array(arrayBuffer);
    if (bytes.length < 14) throw new Error('Invalid GIF file');
    var hdr = String.fromCharCode(bytes[0], bytes[1], bytes[2], bytes[3], bytes[4], bytes[5]);
    if (hdr !== 'GIF87a' && hdr !== 'GIF89a') throw new Error('Not a GIF87a/89a stream');

    var p = 6;
    function u16() { var v = bytes[p] | (bytes[p + 1] << 8); p += 2; return v; }
    var width = u16(), height = u16();
    var packed = bytes[p++], bgIndex = bytes[p++]; p++; // pixel aspect ratio
    var gctFlag = (packed & 0x80) !== 0;
    var gctSize = 2 << (packed & 7);

    function readColorTable(count) {
      var tbl = new Uint8Array(count * 3);
      for (var i = 0; i < count * 3 && p < bytes.length; i++) tbl[i] = bytes[p++];
      return tbl;
    }
    var gct = gctFlag ? readColorTable(gctSize) : null;

    function skipSubBlocks() {
      while (p < bytes.length) {
        var sz = bytes[p++];
        if (!sz) break;
        p += sz;
      }
    }
    function readSubBlocks() {
      var chunks = [], total = 0;
      while (p < bytes.length) {
        var sz = bytes[p++];
        if (!sz) break;
        chunks.push(bytes.subarray(p, p + sz));
        total += sz;
        p += sz;
      }
      var out = new Uint8Array(total), off = 0;
      for (var i = 0; i < chunks.length; i++) { out.set(chunks[i], off); off += chunks[i].length; }
      return out;
    }

    function lzwDecode(minCodeSize, data, pixelCount) {
      var MAX_STACK = 4096;
      var clearCode = 1 << minCodeSize;
      var eoiCode = clearCode + 1;
      var codeSize = minCodeSize + 1;
      var codeMask = (1 << codeSize) - 1;
      var avail = clearCode + 2;
      var oldCode = -1;
      var prefix = new Int32Array(MAX_STACK);
      var suffix = new Uint8Array(MAX_STACK);
      var pixelStack = new Uint8Array(MAX_STACK + 1);
      var out = new Uint8Array(pixelCount);

      for (var code = 0; code < clearCode; code++) {
        prefix[code] = 0;
        suffix[code] = code;
      }

      var datum = 0, bits = 0, first = 0, top = 0, pi = 0, bi = 0;
      while (pi < pixelCount) {
        if (top === 0) {
          if (bits < codeSize) {
            if (bi >= data.length) break;
            datum |= data[bi++] << bits;
            bits += 8;
            continue;
          }
          var cur = datum & codeMask;
          datum >>= codeSize;
          bits -= codeSize;

          if (cur > avail || cur === eoiCode) break;
          if (cur === clearCode) {
            codeSize = minCodeSize + 1;
            codeMask = (1 << codeSize) - 1;
            avail = clearCode + 2;
            oldCode = -1;
            continue;
          }
          if (oldCode === -1) {
            pixelStack[top++] = suffix[cur];
            oldCode = cur;
            first = cur;
            continue;
          }
          var inCode = cur;
          if (cur === avail) {
            pixelStack[top++] = first;
            cur = oldCode;
          }
          while (cur > clearCode && top < MAX_STACK) {
            pixelStack[top++] = suffix[cur];
            cur = prefix[cur];
          }
          first = suffix[cur];
          pixelStack[top++] = first;
          if (avail < MAX_STACK) {
            prefix[avail] = oldCode;
            suffix[avail] = first;
            avail++;
            if ((avail & codeMask) === 0 && avail < MAX_STACK) {
              codeSize++;
              codeMask += avail;
            }
          }
          oldCode = inCode;
        }
        top--;
        out[pi++] = pixelStack[top];
      }
      return out;
    }

    var workCv = document.createElement('canvas');
    workCv.width = width; workCv.height = height;
    var wctx = workCv.getContext('2d');
    var compImg = wctx.createImageData(width, height);
    var comp = compImg.data;

    var gce = { delay: 90, disposal: 0, transFlag: false, transIdx: 0 };
    var frames = [];

    while (p < bytes.length && frames.length < 180) {
      var block = bytes[p++];
      if (block === 0x3B) break; // Trailer
      if (block === 0x21) {      // Extension
        var label = bytes[p++];
        if (label === 0xF9) {    // Graphic Control Extension
          p++; // block size (4)
          var gPacked = bytes[p++];
          var delayCs = u16();
          var tIdx = bytes[p++];
          p++; // terminator
          gce = {
            disposal: (gPacked >> 2) & 7,
            transFlag: (gPacked & 1) !== 0,
            delay: Math.max(30, (delayCs || 8) * 10),
            transIdx: tIdx
          };
        } else {
          skipSubBlocks();
        }
      } else if (block === 0x2C) { // Image Descriptor
        var fx = u16(), fy = u16(), fw = u16(), fh = u16();
        var iPacked = bytes[p++];
        var lctFlag = (iPacked & 0x80) !== 0;
        var interlace = (iPacked & 0x40) !== 0;
        var lctSize = 2 << (iPacked & 7);
        var ct = lctFlag ? readColorTable(lctSize) : gct;
        var lzwMin = bytes[p++];
        var lzwData = readSubBlocks();
        var idxPixels = lzwDecode(lzwMin, lzwData, fw * fh);

        var prevBackup = gce.disposal === 3 ? new Uint8ClampedArray(comp) : null;

        if (ct) {
          var rowMap = null;
          if (interlace) {
            rowMap = new Int32Array(fh);
            var dst = 0;
            var passes = [[0, 8], [4, 8], [2, 4], [1, 2]];
            for (var ps = 0; ps < 4; ps++) {
              for (var r = passes[ps][0]; r < fh; r += passes[ps][1]) {
                if (dst < fh) rowMap[dst++] = r;
              }
            }
          }
          for (var sy = 0; sy < fh; sy++) {
            var dy = fy + (rowMap ? rowMap[sy] : sy);
            if (dy < 0 || dy >= height) continue;
            var srcRow = sy * fw;
            for (var sx = 0; sx < fw; sx++) {
              var dx = fx + sx;
              if (dx < 0 || dx >= width) continue;
              var ci = idxPixels[srcRow + sx];
              if (gce.transFlag && ci === gce.transIdx) continue;
              var cOff = ci * 3;
              var dOff = (dy * width + dx) * 4;
              comp[dOff] = ct[cOff];
              comp[dOff + 1] = ct[cOff + 1];
              comp[dOff + 2] = ct[cOff + 2];
              comp[dOff + 3] = 255;
            }
          }
        }

        frames.push({
          rgba: new Uint8ClampedArray(comp),
          delay: gce.delay
        });

        if (gce.disposal === 2) {
          for (var cy = fy; cy < fy + fh && cy < height; cy++) {
            for (var cx = fx; cx < fx + fw && cx < width; cx++) {
              var o2 = (cy * width + cx) * 4;
              comp[o2] = comp[o2 + 1] = comp[o2 + 2] = comp[o2 + 3] = 0;
            }
          }
        } else if (gce.disposal === 3 && prevBackup) {
          comp.set(prevBackup);
        }
        gce = { delay: 90, disposal: 0, transFlag: false, transIdx: 0 };
      } else if (block === 0) {
        continue;
      } else {
        break;
      }
    }
    if (!frames.length) throw new Error('No frames decoded from GIF');
    void bgIndex;
    return { width: width, height: height, frames: frames };
  }

  /* -------------------------------------------------------------------------
     2. Built-in Procedural Animated Presets (so GIF mode has rich animated
        demos immediately, plus user's own uploaded GIFs!)
     ------------------------------------------------------------------------- */
  function makeBuiltInSpriteClip(kind) {
    var W = 192, H = 240, N = 12, frames = [];
    var cv = document.createElement('canvas'); cv.width = W; cv.height = H;
    var x = cv.getContext('2d');
    for (var f = 0; f < N; f++) {
      var ph = (f / N) * Math.PI * 2;
      x.clearRect(0, 0, W, H);
      x.save();
      if (kind === 'neko') {
        // Glowing cyber-cat strolling on two paws
        var bob = Math.abs(Math.sin(ph)) * 7;
        var sw = Math.sin(ph);
        var cy = 132 - bob;
        // Soft aura
        var gr = x.createRadialGradient(96, cy, 8, 96, cy, 84);
        gr.addColorStop(0, 'rgba(130,240,255,0.34)');
        gr.addColorStop(1, 'rgba(130,240,255,0)');
        x.fillStyle = gr; x.fillRect(0, 0, W, H);
        // Tail
        x.strokeStyle = '#fef3c7'; x.lineWidth = 11; x.lineCap = 'round';
        x.beginPath(); x.moveTo(76, cy + 32);
        x.quadraticCurveTo(38, cy + 16 + Math.sin(ph + 1) * 14, 44, cy - 12);
        x.stroke();
        // Legs
        x.lineWidth = 13; x.strokeStyle = '#fffbeb';
        x.beginPath(); x.moveTo(84, cy + 36); x.lineTo(84 - sw * 18, 214); x.stroke();
        x.beginPath(); x.moveTo(108, cy + 36); x.lineTo(108 + sw * 18, 214); x.stroke();
        // Body + scarf
        x.fillStyle = '#fffbeb';
        x.beginPath(); x.ellipse(96, cy + 16, 28, 34, 0, 0, Math.PI * 2); x.fill();
        x.fillStyle = '#38bdf8';
        x.fillRect(72, cy - 8, 48, 12);
        // Head & ears
        x.fillStyle = '#fffbeb';
        x.beginPath(); x.arc(96, cy - 30, 30, 0, Math.PI * 2); x.fill();
        x.beginPath(); x.moveTo(68, cy - 44); x.lineTo(62, cy - 76); x.lineTo(88, cy - 56); x.closePath(); x.fill();
        x.beginPath(); x.moveTo(124, cy - 44); x.lineTo(130, cy - 76); x.lineTo(104, cy - 56); x.closePath(); x.fill();
        x.fillStyle = '#fda4af';
        x.beginPath(); x.moveTo(71, cy - 47); x.lineTo(67, cy - 68); x.lineTo(84, cy - 55); x.closePath(); x.fill();
        x.beginPath(); x.moveTo(121, cy - 47); x.lineTo(125, cy - 68); x.lineTo(108, cy - 55); x.closePath(); x.fill();
        // Eyes
        x.fillStyle = '#0f172a';
        x.beginPath(); x.arc(85, cy - 30, 4.5, 0, Math.PI * 2); x.arc(109, cy - 30, 4.5, 0, Math.PI * 2); x.fill();
        x.fillStyle = '#fff';
        x.beginPath(); x.arc(83.5, cy - 31.5, 1.8, 0, Math.PI * 2); x.arc(107.5, cy - 31.5, 1.8, 0, Math.PI * 2); x.fill();
      } else {
        // Illustrated anime-style walking girl in white blouse & warm yellow skirt
        var b2 = Math.abs(Math.sin(ph)) * 6;
        var st = Math.sin(ph);
        var y0 = 36 - b2;
        var g2 = x.createRadialGradient(96, 124, 10, 96, 124, 96);
        g2.addColorStop(0, 'rgba(255,244,196,0.32)');
        g2.addColorStop(1, 'rgba(255,244,196,0)');
        x.fillStyle = g2; x.fillRect(0, 0, W, H);
        // Back arm
        x.strokeStyle = '#fdeedc'; x.lineWidth = 10; x.lineCap = 'round';
        x.beginPath(); x.moveTo(96, y0 + 58); x.lineTo(96 - st * 24, y0 + 102); x.stroke();
        // Legs
        x.lineWidth = 11;
        x.strokeStyle = '#f8d9c0';
        x.beginPath(); x.moveTo(90, y0 + 124); x.lineTo(90 - st * 22, 214 - Math.max(0, -st) * 8); x.stroke();
        x.strokeStyle = '#ffe8d2';
        x.beginPath(); x.moveTo(102, y0 + 124); x.lineTo(102 + st * 22, 214 - Math.max(0, st) * 8); x.stroke();
        // White shoes
        x.fillStyle = '#ffffff';
        x.beginPath(); x.ellipse(90 - st * 22 + 4, 216 - Math.max(0, -st) * 8, 10, 5, 0, 0, Math.PI * 2); x.fill();
        x.beginPath(); x.ellipse(102 + st * 22 + 4, 216 - Math.max(0, st) * 8, 10, 5, 0, 0, Math.PI * 2); x.fill();
        // Golden pleated skirt
        x.fillStyle = '#ffd54f';
        x.beginPath();
        x.moveTo(78, y0 + 92); x.lineTo(114, y0 + 92);
        x.lineTo(130 + st * 5, y0 + 142); x.lineTo(62 + st * 5, y0 + 142);
        x.closePath(); x.fill();
        x.strokeStyle = 'rgba(217,140,16,0.45)'; x.lineWidth = 2;
        [-14, -5, 5, 14].forEach(function (ox) {
          x.beginPath(); x.moveTo(96 + ox * 0.6, y0 + 95); x.lineTo(96 + ox * 1.3 + st * 4, y0 + 140); x.stroke();
        });
        // Luminous white top
        x.fillStyle = '#ffffff';
        x.beginPath();
        x.moveTo(78, y0 + 50); x.lineTo(114, y0 + 50);
        x.lineTo(116, y0 + 94); x.lineTo(76, y0 + 94);
        x.closePath(); x.fill();
        // Front arm
        x.strokeStyle = '#fff5ea'; x.lineWidth = 10;
        x.beginPath(); x.moveTo(98, y0 + 58); x.lineTo(98 + st * 24, y0 + 102); x.stroke();
        // Head & bobbed chestnut hair
        x.fillStyle = '#6d4c3d';
        x.beginPath(); x.arc(96, y0 + 24, 23, 0, Math.PI * 2); x.fill();
        x.fillStyle = '#fff2e4';
        x.beginPath(); x.arc(99, y0 + 26, 17, 0, Math.PI * 2); x.fill();
        x.fillStyle = '#5c3d2e';
        x.beginPath(); x.arc(94, y0 + 20, 21, Math.PI * 0.85, Math.PI * 1.95); x.fill();
        x.fillRect(75, y0 + 18, 13, 24);
      }
      x.restore();
      frames.push({
        rgba: new Uint8ClampedArray(x.getImageData(0, 0, W, H).data),
        delay: 75
      });
    }
    return { width: W, height: H, frames: frames };
  }

  /* -------------------------------------------------------------------------
     3. IndexedDB Persistence for User-Uploaded GIF / Image / Video Blobs
     ------------------------------------------------------------------------- */
  function openMediaDB() {
    return new Promise(function (resolve, reject) {
      if (!root.indexedDB) { resolve(null); return; }
      var req = root.indexedDB.open(DB_NAME, 1);
      req.onupgradeneeded = function () {
        var db = req.result;
        if (!db.objectStoreNames.contains(DB_STORE)) db.createObjectStore(DB_STORE);
      };
      req.onsuccess = function () { resolve(req.result); };
      req.onerror = function () { reject(req.error); };
    });
  }
  function saveMediaRecord(rec) {
    return openMediaDB().then(function (db) {
      if (!db) return;
      return new Promise(function (resolve) {
        try {
          var tx = db.transaction(DB_STORE, 'readwrite');
          tx.objectStore(DB_STORE).put(rec, 'customGif');
          tx.oncomplete = function () { resolve(true); };
          tx.onerror = function () { resolve(false); };
        } catch (e) { resolve(false); }
      });
    }).catch(function () {});
  }
  function loadMediaRecord() {
    return openMediaDB().then(function (db) {
      if (!db) return null;
      return new Promise(function (resolve) {
        try {
          var tx = db.transaction(DB_STORE, 'readonly');
          var g = tx.objectStore(DB_STORE).get('customGif');
          g.onsuccess = function () { resolve(g.result || null); };
          g.onerror = function () { resolve(null); };
        } catch (e) { resolve(null); }
      });
    }).catch(function () { return null; });
  }

  /* -------------------------------------------------------------------------
     4. Smart Chroma / Luminance / Corner Background Keyer for GIF Frames
     ------------------------------------------------------------------------- */
  function detectCornerBg(rgba, w, h) {
    var pts = [[1, 1], [w - 2, 1], [1, h - 2], [w - 2, h - 2], [Math.floor(w / 2), 1]];
    var transparentCorners = 0, r = 0, g = 0, b = 0, n = 0;
    for (var i = 0; i < pts.length; i++) {
      var x = clamp(pts[i][0], 0, w - 1), y = clamp(pts[i][1], 0, h - 1);
      var off = (y * w + x) * 4;
      if (rgba[off + 3] < 40) transparentCorners++;
      else { r += rgba[off]; g += rgba[off + 1]; b += rgba[off + 2]; n++; }
    }
    if (transparentCorners >= 2 || !n) return null; // Already transparent!
    r /= n; g /= n; b /= n;
    // Check consistency across corners
    var maxDiff = 0;
    for (var j = 0; j < 4; j++) {
      var ox = (clamp(pts[j][1], 0, h - 1) * w + clamp(pts[j][0], 0, w - 1)) * 4;
      if (rgba[ox + 3] >= 40) {
        var d = Math.hypot(rgba[ox] - r, rgba[ox + 1] - g, rgba[ox + 2] - b);
        if (d > maxDiff) maxDiff = d;
      }
    }
    return maxDiff < 58 ? [r, g, b] : null;
  }

  function applyBgKey(srcRgba, dstRgba, w, h, keyMode, tol, autoRef) {
    dstRgba.set(srcRgba);
    if (keyMode === 'none') return;
    var thr = clamp(tol || 38, 6, 130), soft = thr * 0.45 + 10;
    var ref = null;
    if (keyMode === 'auto') ref = autoRef;
    else if (keyMode === 'black') ref = [0, 0, 0];
    else if (keyMode === 'white') ref = [255, 255, 255];
    if (!ref) return;
    var rr = ref[0], rg = ref[1], rb = ref[2];
    for (var i = 0, len = w * h * 4; i < len; i += 4) {
      var a = dstRgba[i + 3];
      if (a === 0) continue;
      var dr = dstRgba[i] - rr, dg = dstRgba[i + 1] - rg, db = dstRgba[i + 2] - rb;
      var dist = Math.sqrt(dr * dr + dg * dg + db * db);
      if (dist < thr) dstRgba[i + 3] = 0;
      else if (dist < thr + soft) dstRgba[i + 3] = Math.round(a * ((dist - thr) / soft));
    }
  }

  /* -------------------------------------------------------------------------
     5. Compute a Clean, Unobstructed Desk Spot ('desk.holo') for Every Room
     ------------------------------------------------------------------------- */
  var DESK_RAD = { 'desk.left': 0.28, 'desk.right': 0.23, 'desk.book': 0.24, 'desk.watch': 0.14 };
  function computeDeskHoloAnchor(A) {
    if (!A) return null;
    var l = A['desk.left'], r = A['desk.right'], k = A['desk.key'] || l;
    if (!l || !l.p) return null;
    var ry = isFinite(l.ry) ? l.ry : 0;
    var y = l.p[1];
    // Local desk basis: +right = (cos(ry), -sin(ry)), +towardsChair = (sin(ry), cos(ry))
    var rx = Math.cos(ry), rz = -Math.sin(ry);
    var fx = Math.sin(ry), fz = Math.cos(ry);

    // If desk.left and desk.right have a generous center gap (>= 0.76m, e.g. Santorini, Studio), sit dead-center!
    if (r && r.p) {
      var lrDist = Math.hypot(r.p[0] - l.p[0], r.p[2] - l.p[2]);
      if (lrDist >= 0.76) {
        var mx = (l.p[0] + r.p[0]) * 0.5 + fx * (-0.05);
        var mz = (l.p[2] + r.p[2]) * 0.5 + fz * (-0.05);
        return { p: [+mx.toFixed(3), +y.toFixed(3), +mz.toFixed(3)], ry: +ry.toFixed(4) };
      }
    }

    // Otherwise pick outer-left or outer-right spot with maximum clearance from existing desk items
    var cands = [
      [-0.68, -0.02, -0.16],
      [0.34, -0.22, -0.06],
      [-0.56, 0.06, -0.18],
      [0.24, -0.26, -0.04]
    ];
    var occupied = [];
    Object.keys(A).forEach(function (nm) {
      if (nm.indexOf('desk.') === 0 && nm !== 'desk.holo' && A[nm] && A[nm].p && Math.abs(A[nm].p[1] - y) < 0.14) {
        occupied.push({ x: A[nm].p[0], z: A[nm].p[2], rad: DESK_RAD[nm] || 0.14 });
      }
    });
    var best = null, bestScore = -1e9;
    for (var i = 0; i < cands.length; i++) {
      var c = cands[i];
      var px = l.p[0] + rx * c[0] + fx * c[1];
      var pz = l.p[2] + rz * c[0] + fz * c[1];
      var minClear = 1e9;
      for (var j = 0; j < occupied.length; j++) {
        var d = Math.hypot(px - occupied[j].x, pz - occupied[j].z) - occupied[j].rad;
        if (d < minClear) minClear = d;
      }
      if (minClear > bestScore) {
        bestScore = minClear;
        best = { p: [+px.toFixed(3), +y.toFixed(3), +pz.toFixed(3)], ry: +(ry + c[2]).toFixed(4) };
      }
    }
    return best || { p: [+(k.p[0]).toFixed(3), +y.toFixed(3), +(k.p[2] - 0.18).toFixed(3)], ry: ry };
  }

  function ensureRoomDeskAnchor(room) {
    if (room && room.anchors && !room.anchors['desk.holo']) {
      var dh = computeDeskHoloAnchor(room.anchors);
      if (dh) room.anchors['desk.holo'] = dh;
    }
    return room;
  }

  var SR = root.SpatialRoom;
  if (SR) {
    if (SR.parts && typeof SR.parts.anchors === 'function') {
      var origAnchors = SR.parts.anchors;
      SR.parts.anchors = function () {
        var A = origAnchors.apply(this, arguments);
        if (A && !A['desk.holo']) {
          var dh = computeDeskHoloAnchor(A);
          if (dh) A['desk.holo'] = dh;
        }
        return A;
      };
    }
    if (typeof SR.build === 'function') {
      var origRoomBuild = SR.build;
      SR.build = function () {
        return ensureRoomDeskAnchor(origRoomBuild.apply(this, arguments));
      };
    }
  }

  /* -------------------------------------------------------------------------
     6. Build the 3D L-Fold Hologram Hardware + Walking Girl + Volumetric GIF
     ------------------------------------------------------------------------- */
  function loadState() {
    var def = {
      mode: 'walk3d',          // 'walk3d' | 'gif' | 'classic'
      walkStyle: 'patrol',     // 'patrol' | 'orbit' | 'stroll' | 'stand'
      foldDeg: 93,             // L-fold angle (75..120)
      scale: 1.0,              // Character / GIF scale (0.6..1.6)
      glow: 1.0,               // Holographic bloom / ring intensity
      propDesk: true,          // Miniature cyan desk prop on the left (like @niwachipi!)
      flatBase: true,          // Sit L-fold screen directly flat on desk vs atop projector drum
      bgKey: 'auto',           // 'auto' | 'black' | 'white' | 'none'
      bgTol: 38,
      gifPreset: 'girl',       // 'girl' | 'neko' | 'custom'
      gifName: '',
      speed: 1.0,
      migrated: {}
    };
    try {
      var raw = JSON.parse(localStorage.getItem(SKEY) || 'null');
      if (raw && typeof raw === 'object') {
        for (var k in def) if (raw[k] !== undefined) def[k] = raw[k];
      }
    } catch (e) {}
    return def;
  }

  function saveState(st) {
    try { localStorage.setItem(SKEY, JSON.stringify(st)); } catch (e) {}
  }

  function linCol(hex) {
    var c = new THREE.Color(hex);
    return c.convertSRGBToLinear ? c.convertSRGBToLinear() : c;
  }

  function makeRoundedBox(w, h, d, r) {
    var sh = new THREE.Shape();
    var hw = w / 2, hh = h / 2, rr = Math.min(r, hw * 0.45, hh * 0.45);
    sh.moveTo(-hw + rr, -hh);
    sh.lineTo(hw - rr, -hh);
    sh.quadraticCurveTo(hw, -hh, hw, -hh + rr);
    sh.lineTo(hw, hh - rr);
    sh.quadraticCurveTo(hw, hh, hw - rr, hh);
    sh.lineTo(-hw + rr, hh);
    sh.quadraticCurveTo(-hw, hh, -hw, hh - rr);
    sh.lineTo(-hw, -hh + rr);
    sh.quadraticCurveTo(-hw, -hh, -hw + rr, -hh);
    var geo = new THREE.ExtrudeGeometry(sh, { depth: d, bevelEnabled: true, bevelThickness: 0.0025, bevelSize: 0.0025, bevelSegments: 3, curveSegments: 8 });
    geo.center();
    return geo;
  }

  function makeUpperScreenTexture() {
    var cv = document.createElement('canvas'); cv.width = 512; cv.height = 448;
    var x = cv.getContext('2d');
    // Deep OLED obsidian gradient
    var gr = x.createLinearGradient(0, 0, 0, 448);
    gr.addColorStop(0, '#070b13');
    gr.addColorStop(0.55, '#090e18');
    gr.addColorStop(1, '#0c1322');
    x.fillStyle = gr; x.fillRect(0, 0, 512, 448);

    // Subtle bezel inner hairline
    x.strokeStyle = 'rgba(148,197,255,0.14)';
    x.lineWidth = 2;
    x.strokeRect(8, 8, 496, 432);

    // Top mini HUD (inspired by @niwachipi's top bar icons)
    x.fillStyle = 'rgba(220,238,255,0.82)';
    x.font = '600 15px -apple-system,"PingFang SC",ui-monospace,sans-serif';
    x.fillText('◈ トッキー · HOLO', 26, 32);

    // Top-right status pill + fullscreen bracket
    x.fillStyle = 'rgba(125,211,252,0.16)';
    x.strokeStyle = 'rgba(125,211,252,0.42)';
    x.lineWidth = 1.5;
    x.beginPath();
    x.rect(368, 17, 92, 21);
    x.fill(); x.stroke();
    x.fillStyle = '#bae6fd';
    x.font = '600 12px ui-monospace,Menlo,monospace';
    x.fillText('● 3D GIF', 378, 32);
    // Tiny expand brackets
    x.strokeStyle = 'rgba(226,240,255,0.75)';
    x.lineWidth = 2;
    [[472, 19, 1, 1], [486, 19, -1, 1], [472, 33, 1, -1], [486, 33, -1, -1]].forEach(function (q) {
      x.beginPath();
      x.moveTo(q[0] + 4 * q[2], q[1]); x.lineTo(q[0], q[1]); x.lineTo(q[0], q[1] + 4 * q[3]);
      x.stroke();
    });

    // Crisp luminous white/ice-blue dot matrix (17 cols x 13 rows)
    var cols = 17, rows = 13;
    for (var r = 0; r < rows; r++) {
      for (var c = 0; c < cols; c++) {
        var px = 32 + c * ((512 - 64) / (cols - 1));
        var py = 58 + r * ((448 - 82) / (rows - 1));
        // Glow halo
        x.fillStyle = 'rgba(140,215,255,0.22)';
        x.beginPath(); x.arc(px, py, 4.2, 0, Math.PI * 2); x.fill();
        // Crisp bright dot core
        x.fillStyle = 'rgba(242,250,255,0.92)';
        x.beginPath(); x.arc(px, py, 2.0, 0, Math.PI * 2); x.fill();
      }
    }

    // Subtle fold crease glow at very bottom of upper screen
    var cg = x.createLinearGradient(0, 412, 0, 448);
    cg.addColorStop(0, 'rgba(56,189,248,0)');
    cg.addColorStop(1, 'rgba(56,189,248,0.20)');
    x.fillStyle = cg; x.fillRect(0, 412, 512, 36);

    var tex = new THREE.CanvasTexture(cv);
    tex.encoding = THREE.sRGBEncoding;
    tex.anisotropy = 4;
    return tex;
  }

  function createLowerDeckDynamic() {
    var cv = document.createElement('canvas'); cv.width = 512; cv.height = 416;
    var ctx = cv.getContext('2d');
    var tex = new THREE.CanvasTexture(cv);
    tex.encoding = THREE.sRGBEncoding;
    tex.anisotropy = 4;

    var ripples = [];
    function addRipple(nx, nz) {
      if (ripples.length > 5) ripples.shift();
      ripples.push({ x: nx, z: nz, age: 0 });
    }

    function paint(t, dt, charX, charZ, glowK, warmTint) {
      var W = 512, H = 416;
      var gr = ctx.createLinearGradient(0, 0, 0, H);
      gr.addColorStop(0, '#0b1322');
      gr.addColorStop(0.45, '#070c16');
      gr.addColorStop(1, '#050810');
      ctx.fillStyle = gr; ctx.fillRect(0, 0, W, H);

      ctx.strokeStyle = 'rgba(148,197,255,0.13)';
      ctx.lineWidth = 2;
      ctx.strokeRect(8, 8, W - 16, H - 16);

      // Matching dot matrix on horizontal deck (17 cols x 11 rows)
      var cols = 17, rows = 11;
      for (var r = 0; r < rows; r++) {
        for (var c = 0; c < cols; c++) {
          var px = 32 + c * ((W - 64) / (cols - 1));
          var py = 28 + r * ((H - 86) / (rows - 1));
          ctx.fillStyle = 'rgba(148,210,255,0.18)';
          ctx.beginPath(); ctx.arc(px, py, 3.4, 0, Math.PI * 2); ctx.fill();
          ctx.fillStyle = 'rgba(232,245,255,0.75)';
          ctx.beginPath(); ctx.arc(px, py, 1.7, 0, Math.PI * 2); ctx.fill();
        }
      }

      // Center of cyan holo-emitter pad on the lower screen
      var cx = W * 0.5, cy = H * 0.46;
      var fx = cx + (charX / 0.145) * (W * 0.42);
      var fz = cy + (charZ / 0.115) * (H * 0.36);

      // Ambient cyan pool glow around emitter center
      var pool = ctx.createRadialGradient(cx, cy, 8, cx, cy, 155);
      pool.addColorStop(0, 'rgba(56,189,248,' + (0.26 * glowK).toFixed(3) + ')');
      pool.addColorStop(0.55, 'rgba(37,99,235,' + (0.12 * glowK).toFixed(3) + ')');
      pool.addColorStop(1, 'rgba(14,165,233,0)');
      ctx.fillStyle = pool; ctx.fillRect(0, 0, W, H);

      // Warm golden-white ground bounce right under the walking character's feet!
      var footGlow = ctx.createRadialGradient(fx, fz, 2, fx, fz, 76);
      footGlow.addColorStop(0, warmTint ? 'rgba(255,230,150,' + (0.42 * glowK).toFixed(3) + ')' : 'rgba(165,243,252,' + (0.42 * glowK).toFixed(3) + ')');
      footGlow.addColorStop(0.5, 'rgba(96,205,255,' + (0.18 * glowK).toFixed(3) + ')');
      footGlow.addColorStop(1, 'rgba(56,189,248,0)');
      ctx.fillStyle = footGlow; ctx.fillRect(0, 0, W, H);

      // Concentric glowing cyan emitter rings (exact match to @niwachipi's blue floor circle!)
      ctx.save();
      ctx.shadowColor = 'rgba(56,189,248,0.95)';
      ctx.shadowBlur = 14 * glowK;
      ctx.strokeStyle = 'rgba(125,225,255,' + clamp(0.88 * glowK, 0.2, 1).toFixed(3) + ')';
      ctx.lineWidth = 3.0;
      ctx.beginPath(); ctx.arc(cx, cy, 108, 0, Math.PI * 2); ctx.stroke();

      ctx.lineWidth = 1.6;
      ctx.strokeStyle = 'rgba(56,189,248,' + clamp(0.55 * glowK, 0.15, 0.9).toFixed(3) + ')';
      ctx.beginPath(); ctx.arc(cx, cy, 86, 0, Math.PI * 2); ctx.stroke();

      // Rotating dashed holo ring
      ctx.translate(cx, cy);
      ctx.rotate(t * 0.45);
      ctx.setLineDash([12, 10]);
      ctx.strokeStyle = 'rgba(186,230,253,' + clamp(0.68 * glowK, 0.15, 0.95).toFixed(3) + ')';
      ctx.lineWidth = 2.0;
      ctx.beginPath(); ctx.arc(0, 0, 97, 0, Math.PI * 2); ctx.stroke();
      ctx.setLineDash([]);
      ctx.restore();

      // Footstep ripples expanding across the lower screen
      for (var i = ripples.length - 1; i >= 0; i--) {
        var rp = ripples[i];
        rp.age += dt;
        if (rp.age > 0.85) { ripples.splice(i, 1); continue; }
        var k = rp.age / 0.85;
        var rx = cx + (rp.x / 0.145) * (W * 0.42);
        var rz = cy + (rp.z / 0.115) * (H * 0.36);
        ctx.strokeStyle = 'rgba(165,243,252,' + ((1 - k) * 0.65 * glowK).toFixed(3) + ')';
        ctx.lineWidth = 2.4 * (1 - k * 0.5);
        ctx.beginPath(); ctx.arc(rx, rz, 10 + k * 54, 0, Math.PI * 2); ctx.stroke();
      }

      // Front sky-blue pill button at bottom center (just like @niwachipi's lower screen!)
      var pw = 128, ph = 26, px0 = (W - pw) / 2, py0 = H - 50;
      ctx.save();
      ctx.shadowColor = 'rgba(125,211,252,0.75)';
      ctx.shadowBlur = 10;
      ctx.fillStyle = '#8fd8f8';
      ctx.beginPath();
      rr2d(ctx, px0, py0, pw, ph, 13);
      ctx.fill();
      ctx.fillStyle = '#0c2338';
      ctx.font = '700 12px -apple-system,"PingFang SC",sans-serif';
      ctx.textAlign = 'center'; ctx.textBaseline = 'middle';
      ctx.fillText('HOLO · WALK', W / 2, py0 + ph / 2 + 0.5);
      ctx.restore();

      tex.needsUpdate = true;
    }

    return { tex: tex, paint: paint, addRipple: addRipple };
  }

  function rr2d(ctx, x, y, w, h, r) {
    ctx.moveTo(x + r, y);
    ctx.arcTo(x + w, y, x + w, y + h, r);
    ctx.arcTo(x + w, y + h, x, y + h, r);
    ctx.arcTo(x, y + h, x, y, r);
    ctx.arcTo(x, y, x + w, y, r);
    ctx.closePath();
  }

  /* -------------------------------------------------------------------------
     7. Articulated 3D Walking Girl Rig (@niwachipi Tribute)
     ------------------------------------------------------------------------- */
  function buildWalkingGirl3D() {
    var rootG = new THREE.Group();
    var body = new THREE.Group();
    rootG.add(body);

    function glowMat(hex, op) {
      return new THREE.MeshBasicMaterial({
        color: hex,
        transparent: op !== undefined && op < 1,
        opacity: op === undefined ? 1 : op,
        toneMapped: false,
        fog: false
      });
    }

    var skinM = glowMat(0xfff1e2);
    var blouseM = glowMat(0xffffff);
    var skirtM = glowMat(0xffd54f);
    var skirtHemM = glowMat(0xffdf78);
    var hairM = new THREE.MeshStandardMaterial({
      color: linCol(0x6b4737),
      emissive: linCol(0x523426),
      emissiveIntensity: 0.85,
      roughness: 0.55,
      metalness: 0.05
    });
    var shoeM = glowMat(0xfef9ee);

    // Head + bobbed hair
    var headG = new THREE.Group();
    headG.position.y = 0.132;
    body.add(headG);

    var face = new THREE.Mesh(new THREE.SphereGeometry(0.0155, 20, 16), skinM);
    face.scale.set(0.95, 1.04, 0.92);
    headG.add(face);

    var hairCap = new THREE.Mesh(new THREE.SphereGeometry(0.0176, 20, 16, 0, Math.PI * 2, 0, Math.PI * 0.68), hairM);
    hairCap.position.set(0, 0.002, -0.0015);
    headG.add(hairCap);

    var hairBack = new THREE.Mesh(new THREE.CylinderGeometry(0.0155, 0.0185, 0.024, 18, 1, false, Math.PI * 0.55, Math.PI * 1.9), hairM);
    hairBack.position.set(0, -0.004, -0.002);
    headG.add(hairBack);

    // Subtle bangs
    var bangs = new THREE.Mesh(new THREE.BoxGeometry(0.024, 0.008, 0.008), hairM);
    bangs.position.set(0.002, 0.009, 0.0125);
    bangs.rotation.z = -0.1;
    headG.add(bangs);

    // Neck & luminous white blouse torso
    var neck = new THREE.Mesh(new THREE.CylinderGeometry(0.005, 0.0055, 0.012, 12), skinM);
    neck.position.y = 0.114;
    body.add(neck);

    var torso = new THREE.Mesh(new THREE.CylinderGeometry(0.0135, 0.012, 0.038, 18), blouseM);
    torso.scale.set(1.12, 1, 0.78);
    torso.position.y = 0.093;
    body.add(torso);

    var collar = new THREE.Mesh(new THREE.TorusGeometry(0.0095, 0.0026, 8, 18), blouseM);
    collar.rotation.x = Math.PI / 2;
    collar.position.y = 0.111;
    body.add(collar);

    // Flared golden-yellow pleated skirt
    var skirtG = new THREE.Group();
    skirtG.position.y = 0.075;
    body.add(skirtG);

    var skirt = new THREE.Mesh(new THREE.CylinderGeometry(0.0125, 0.0285, 0.042, 24, 1, false), skirtM);
    skirt.scale.set(1.06, 1, 0.9);
    skirt.position.y = -0.019;
    skirtG.add(skirt);

    var skirtGlow = new THREE.Mesh(new THREE.CylinderGeometry(0.014, 0.031, 0.044, 24, 1, true), new THREE.MeshBasicMaterial({
      color: 0xffe57f,
      transparent: true,
      opacity: 0.36,
      blending: THREE.AdditiveBlending,
      depthWrite: false,
      side: THREE.DoubleSide,
      toneMapped: false
    }));
    skirtGlow.position.y = -0.019;
    skirtG.add(skirtGlow);

    var hem = new THREE.Mesh(new THREE.TorusGeometry(0.0275, 0.0018, 6, 24), skirtHemM);
    hem.rotation.x = Math.PI / 2;
    hem.scale.set(1.06, 0.9, 1);
    hem.position.y = -0.039;
    skirtG.add(hem);

    // Articulated arms (shoulder -> upper arm -> forearm)
    function makeArm(side) {
      var sh = new THREE.Group();
      sh.position.set(side * 0.0165, 0.108, 0);
      var slv = new THREE.Mesh(new THREE.CylinderGeometry(0.0052, 0.006, 0.014, 12), blouseM);
      slv.position.y = -0.006;
      sh.add(slv);
      var ua = new THREE.Mesh(new THREE.CylinderGeometry(0.0042, 0.0038, 0.024, 10), skinM);
      ua.position.y = -0.018;
      sh.add(ua);
      var elb = new THREE.Group();
      elb.position.y = -0.03;
      sh.add(elb);
      var fa = new THREE.Mesh(new THREE.CylinderGeometry(0.0038, 0.0034, 0.022, 10), skinM);
      fa.position.y = -0.011;
      elb.add(fa);
      var hand = new THREE.Mesh(new THREE.SphereGeometry(0.0042, 10, 8), skinM);
      hand.position.y = -0.022;
      elb.add(hand);
      sh.rotation.z = side * 0.12;
      body.add(sh);
      return { sh: sh, elb: elb };
    }
    var armL = makeArm(-1), armR = makeArm(1);

    // Articulated legs (hip -> thigh -> knee -> shin -> shoe)
    function makeLeg(side) {
      var hip = new THREE.Group();
      hip.position.set(side * 0.0075, 0.056, 0);
      var th = new THREE.Mesh(new THREE.CylinderGeometry(0.0054, 0.0045, 0.028, 12), skinM);
      th.position.y = -0.014;
      hip.add(th);
      var knee = new THREE.Group();
      knee.position.y = -0.028;
      hip.add(knee);
      var sn = new THREE.Mesh(new THREE.CylinderGeometry(0.0044, 0.0036, 0.026, 12), skinM);
      sn.position.y = -0.013;
      knee.add(sn);
      var shoe = new THREE.Mesh(new THREE.BoxGeometry(0.009, 0.0055, 0.016), shoeM);
      shoe.position.set(0, -0.026, 0.0035);
      knee.add(shoe);
      body.add(hip);
      return { hip: hip, knee: knee };
    }
    var legL = makeLeg(-1), legR = makeLeg(1);

    // Soft volumetric warm aura sprite behind the girl (creates the bright bloom seen in @niwachipi's photo!)
    var auraCv = document.createElement('canvas'); auraCv.width = auraCv.height = 128;
    var ax = auraCv.getContext('2d');
    var ag = ax.createRadialGradient(64, 64, 4, 64, 64, 62);
    ag.addColorStop(0, 'rgba(255,248,215,0.65)');
    ag.addColorStop(0.45, 'rgba(255,224,130,0.24)');
    ag.addColorStop(1, 'rgba(125,211,252,0)');
    ax.fillStyle = ag; ax.fillRect(0, 0, 128, 128);
    var auraTex = new THREE.CanvasTexture(auraCv);
    var aura = new THREE.Sprite(new THREE.SpriteMaterial({
      map: auraTex,
      transparent: true,
      opacity: 0.55,
      blending: THREE.AdditiveBlending,
      depthWrite: false,
      fog: false
    }));
    aura.scale.set(0.14, 0.20, 1);
    aura.position.y = 0.088;
    rootG.add(aura);

    // Inverted soft reflection silhouette on the lower horizontal screen!
    var reflCv = document.createElement('canvas'); reflCv.width = 128; reflCv.height = 128;
    var rx = reflCv.getContext('2d');
    var rg = rx.createLinearGradient(0, 0, 0, 128);
    rg.addColorStop(0, 'rgba(255,232,145,0.45)');
    rg.addColorStop(0.45, 'rgba(255,255,255,0.18)');
    rg.addColorStop(1, 'rgba(56,189,248,0)');
    rx.fillStyle = rg;
    rx.beginPath(); rx.moveTo(44, 6); rx.lineTo(84, 6); rx.lineTo(74, 96); rx.lineTo(54, 96); rx.closePath(); rx.fill();
    var reflTex = new THREE.CanvasTexture(reflCv);
    var reflMesh = new THREE.Mesh(new THREE.PlaneGeometry(0.085, 0.11), new THREE.MeshBasicMaterial({
      map: reflTex,
      transparent: true,
      opacity: 0.5,
      blending: THREE.AdditiveBlending,
      depthWrite: false,
      side: THREE.DoubleSide,
      toneMapped: false
    }));
    reflMesh.rotation.x = -Math.PI / 2;
    reflMesh.position.set(0, 0.001, 0.048);

    function pose(phase, amp, t, glowK) {
      var s = Math.sin(phase), c = Math.cos(phase);
      legL.hip.rotation.x = s * 0.62 * amp;
      legR.hip.rotation.x = -s * 0.62 * amp;
      legL.knee.rotation.x = Math.max(0, -s) * 0.72 * amp;
      legR.knee.rotation.x = Math.max(0, s) * 0.72 * amp;

      armL.sh.rotation.x = -s * 0.52 * amp;
      armR.sh.rotation.x = s * 0.52 * amp;
      armL.elb.rotation.x = -0.18 - Math.max(0, -s) * 0.25 * amp;
      armR.elb.rotation.x = -0.18 - Math.max(0, s) * 0.25 * amp;

      body.position.y = Math.abs(c) * 0.0055 * amp;
      body.rotation.z = s * 0.035 * amp;
      skirtG.rotation.z = -s * 0.075 * amp;
      skirtG.rotation.x = 0.04 * amp;
      headG.rotation.y = Math.sin(t * 1.4) * 0.14;
      headG.rotation.z = Math.sin(t * 2.1) * 0.04;
      aura.material.opacity = clamp(0.46 * glowK, 0.1, 0.85);
      reflMesh.material.opacity = clamp(0.45 * glowK, 0.1, 0.8);
    }

    return { group: rootG, refl: reflMesh, pose: pose };
  }

  /* -------------------------------------------------------------------------
     8. Multi-Layer Volumetric 3D GIF Stage + Cross-Fold Floor Reflection
     ------------------------------------------------------------------------- */
  function buildVolumetricGifRig() {
    var rootG = new THREE.Group();
    var pivot = new THREE.Group();
    rootG.add(pivot);

    var cv = document.createElement('canvas'); cv.width = 256; cv.height = 256;
    var ctx = cv.getContext('2d');
    var tex = new THREE.CanvasTexture(cv);
    tex.encoding = THREE.sRGBEncoding;
    tex.minFilter = THREE.LinearFilter;
    tex.magFilter = THREE.LinearFilter;

    // 6-slice volumetric depth stack so the GIF has tangible 3D thickness from side angles!
    var slices = [];
    var SLICE_N = 6;
    for (var i = 0; i < SLICE_N; i++) {
      var isFront = (i === 0);
      var mat = new THREE.MeshBasicMaterial({
        map: tex,
        transparent: true,
        alphaTest: 0.03,
        opacity: isFront ? 0.98 : (0.28 * (1 - i / SLICE_N)),
        color: isFront ? 0xffffff : 0x9be7ff,
        blending: isFront ? THREE.NormalBlending : THREE.AdditiveBlending,
        depthWrite: isFront,
        side: THREE.DoubleSide,
        toneMapped: false,
        fog: false
      });
      var m = new THREE.Mesh(new THREE.PlaneGeometry(0.15, 0.175), mat);
      m.position.set(0, 0.088, -i * 0.0032);
      pivot.add(m);
      slices.push(m);
    }

    // Back-facing crisp layer so viewing from behind also looks solid
    var backPlane = new THREE.Mesh(new THREE.PlaneGeometry(0.15, 0.175), new THREE.MeshBasicMaterial({
      map: tex,
      transparent: true,
      alphaTest: 0.04,
      opacity: 0.92,
      side: THREE.DoubleSide,
      toneMapped: false,
      fog: false
    }));
    backPlane.position.set(0, 0.088, -SLICE_N * 0.0032);
    pivot.add(backPlane);
    slices.push(backPlane);

    // Cross-fold floor reflection lying flat on the horizontal OLED deck!
    var reflMat = new THREE.MeshBasicMaterial({
      map: tex,
      transparent: true,
      opacity: 0.34,
      color: 0xbff4ff,
      blending: THREE.AdditiveBlending,
      depthWrite: false,
      side: THREE.DoubleSide,
      toneMapped: false,
      fog: false
    });
    var refl = new THREE.Mesh(new THREE.PlaneGeometry(0.15, 0.13), reflMat);
    refl.rotation.x = Math.PI / 2; // Flips top-to-bottom naturally forward from the feet!
    refl.position.set(0, 0.0015, 0.062);

    function setAspect(w, h) {
      var ar = clamp((w || 1) / Math.max(1, h || 1), 0.45, 1.9);
      var baseH = 0.175, baseW = baseH * ar;
      if (baseW > 0.22) { baseW = 0.22; baseH = baseW / ar; }
      slices.forEach(function (s) {
        s.scale.set(baseW / 0.15, baseH / 0.175, 1);
        s.position.y = baseH / 2;
      });
      refl.scale.set(baseW / 0.15, (baseH * 0.72) / 0.13, 1);
      refl.position.z = baseH * 0.36;
    }

    return {
      group: rootG,
      pivot: pivot,
      refl: refl,
      canvas: cv,
      ctx: ctx,
      tex: tex,
      slices: slices,
      setAspect: setAspect
    };
  }

  /* -------------------------------------------------------------------------
     9. Miniature Cyan Desk Prop (from @niwachipi's left side of the screen!)
     ------------------------------------------------------------------------- */
  function buildMiniDeskProp() {
    var g = new THREE.Group();
    var topM = new THREE.MeshBasicMaterial({ color: 0xbfeeff, transparent: true, opacity: 0.92, toneMapped: false, fog: false });
    var legM = new THREE.MeshBasicMaterial({ color: 0x8ad8f8, transparent: true, opacity: 0.85, toneMapped: false, fog: false });
    var boxM = new THREE.MeshBasicMaterial({ color: 0xffffff, transparent: true, opacity: 0.95, toneMapped: false, fog: false });

    var top = new THREE.Mesh(new THREE.BoxGeometry(0.064, 0.0045, 0.036), topM);
    top.position.y = 0.036;
    g.add(top);

    [[-0.026, -0.013], [0.026, -0.013], [-0.026, 0.013], [0.026, 0.013]].forEach(function (q) {
      var leg = new THREE.Mesh(new THREE.CylinderGeometry(0.0022, 0.0018, 0.036, 8), legM);
      leg.position.set(q[0], 0.018, q[1]);
      g.add(leg);
    });

    // Little tissue box / book on the miniature table
    var item = new THREE.Mesh(new THREE.BoxGeometry(0.018, 0.010, 0.013), boxM);
    item.position.set(-0.008, 0.043, 0);
    g.add(item);
    var tissue = new THREE.Mesh(new THREE.PlaneGeometry(0.008, 0.009), boxM);
    tissue.position.set(-0.008, 0.051, 0);
    tissue.rotation.z = 0.25;
    g.add(tissue);

    g.position.set(-0.088, 0.002, -0.056);
    g.rotation.y = 0.14;
    return g;
  }

  /* -------------------------------------------------------------------------
     10. Enhance `projector` Object Instance Non-Destructively
     ------------------------------------------------------------------------- */
  function upgradeProjector(o) {
    if (!o || o.id !== 'projector' || o.__holoLfoldUpgraded) return o;
    o.__holoLfoldUpgraded = true;

    var st = loadState();
    var origSet = o.set;
    var origIdle = o.idle;
    var origPanel = o.panel;
    var origChildren = o.group.children.slice();

    // Default to 'desk.holo' so fresh rooms put the mini hologram screen right on the desk!
    o.anchor = 'desk.holo';
    o.name = '全息屏 · 3D';
    o.en = '3D L-Fold Holo Screen';
    o.focusL = { pos: [0, 0.34, 0.64], look: [0, 0.11, -0.02] };

    // Expand hitBox so tapping anywhere on the L-fold screen works reliably
    if (o.hit && o.hit.geometry) {
      o.hit.geometry.dispose();
      o.hit.geometry = new THREE.BoxGeometry(0.40, 0.44, 0.36);
      o.hit.position.set(0, 0.20, 0.0);
    }
    o.label = [0, 0.38, 0];

    // Root container named 'dress-holo-lfold' so app.js dress() hideVox NEVER hides it!
    var stageRoot = new THREE.Group();
    stageRoot.name = 'dress-holo-lfold';
    o.group.add(stageRoot);

    // Matte-black foldable chassis materials
    var bezelMat = new THREE.MeshStandardMaterial({
      color: linCol(0x12151c),
      roughness: 0.42,
      metalness: 0.35
    });
    var trimMat = new THREE.MeshStandardMaterial({
      color: linCol(0x232936),
      roughness: 0.28,
      metalness: 0.65
    });

    var W = 0.31, lowerD = 0.245, upperH = 0.265, thick = 0.012;
    var hingeZ = -lowerD * 0.42; // Crease Z coordinate in stageRoot local space

    // Lower horizontal half
    var lowerHalf = new THREE.Group();
    stageRoot.add(lowerHalf);
    var lowerBody = new THREE.Mesh(makeRoundedBox(W, lowerD, thick, 0.022), bezelMat);
    lowerBody.rotation.x = Math.PI / 2;
    lowerBody.position.set(0, thick / 2 + 0.002, hingeZ + lowerD / 2);
    lowerBody.castShadow = true; lowerBody.receiveShadow = true;
    lowerHalf.add(lowerBody);

    var lowerLip = new THREE.Mesh(new THREE.BoxGeometry(W - 0.024, 0.002, lowerD - 0.024), trimMat);
    lowerLip.position.set(0, thick + 0.0046, hingeZ + lowerD / 2);
    lowerHalf.add(lowerLip);

    var lowerDeck = createLowerDeckDynamic();
    var lowerScreen = new THREE.Mesh(new THREE.PlaneGeometry(W - 0.026, lowerD - 0.026), new THREE.MeshBasicMaterial({
      map: lowerDeck.tex,
      toneMapped: false,
      fog: false
    }));
    lowerScreen.rotation.x = -Math.PI / 2;
    lowerScreen.position.set(0, thick + 0.0062, hingeZ + lowerD / 2);
    lowerHalf.add(lowerScreen);

    // Cylindrical hinge spine along the crease
    var hingeCyl = new THREE.Mesh(new THREE.CylinderGeometry(0.0075, 0.0075, W - 0.016, 20), trimMat);
    hingeCyl.rotation.z = Math.PI / 2;
    hingeCyl.position.set(0, thick + 0.003, hingeZ);
    stageRoot.add(hingeCyl);

    // Upper upright screen (pivots around the hinge crease!)
    var upperPivot = new THREE.Group();
    upperPivot.position.set(0, thick + 0.0055, hingeZ);
    stageRoot.add(upperPivot);

    var upperBody = new THREE.Mesh(makeRoundedBox(W, upperH, thick, 0.022), bezelMat);
    upperBody.position.set(0, upperH / 2, -thick / 2 - 0.0025);
    upperBody.castShadow = true; upperBody.receiveShadow = true;
    upperPivot.add(upperBody);

    var upperScreenTex = makeUpperScreenTexture();
    var upperScreen = new THREE.Mesh(new THREE.PlaneGeometry(W - 0.026, upperH - 0.026), new THREE.MeshBasicMaterial({
      map: upperScreenTex,
      toneMapped: false,
      fog: false
    }));
    upperScreen.position.set(0, upperH / 2, 0.0018);
    upperPivot.add(upperScreen);

    // Holographic actor stage standing on the horizontal deck just in front of the crease!
    var actorStage = new THREE.Group();
    actorStage.position.set(0, thick + 0.0068, hingeZ + lowerD * 0.46);
    stageRoot.add(actorStage);

    var miniDesk = buildMiniDeskProp();
    actorStage.add(miniDesk);

    var girlRig = buildWalkingGirl3D();
    actorStage.add(girlRig.group);
    actorStage.add(girlRig.refl);

    var gifRig = buildVolumetricGifRig();
    actorStage.add(gifRig.group);
    actorStage.add(gifRig.refl);

    var holoLight = new THREE.PointLight(0x5fd8ff, 0.38, 1.1, 2);
    holoLight.position.set(0, 0.16, 0.04);
    stageRoot.add(holoLight);

    // GIF Playback State
    var gifClip = null;
    var gifAutoRef = null;
    var gifFrameIdx = 0;
    var gifFrameAcc = 0;
    var gifDirtyFrame = true;
    var videoEl = null;
    var staticImg = null;
    var workData = null;

    function loadClipObject(clip) {
      if (videoEl) { try { videoEl.pause(); videoEl.src = ''; } catch (e) {} videoEl = null; }
      staticImg = null;
      gifClip = clip;
      gifFrameIdx = 0;
      gifFrameAcc = 0;
      gifDirtyFrame = true;
      if (clip && clip.frames && clip.frames.length) {
        gifAutoRef = detectCornerBg(clip.frames[0].rgba, clip.width, clip.height);
        gifRig.canvas.width = clip.width;
        gifRig.canvas.height = clip.height;
        workData = gifRig.ctx.createImageData(clip.width, clip.height);
        gifRig.setAspect(clip.width, clip.height);
        paintCurrentGifFrame();
      }
    }

    function paintCurrentGifFrame() {
      if (videoEl && videoEl.readyState >= 2) {
        var vw = videoEl.videoWidth || 256, vh = videoEl.videoHeight || 256;
        if (gifRig.canvas.width !== vw || gifRig.canvas.height !== vh) {
          gifRig.canvas.width = vw; gifRig.canvas.height = vh;
          workData = gifRig.ctx.createImageData(vw, vh);
          gifRig.setAspect(vw, vh);
        }
        gifRig.ctx.clearRect(0, 0, vw, vh);
        gifRig.ctx.drawImage(videoEl, 0, 0, vw, vh);
        if (st.bgKey !== 'none') {
          var raw = gifRig.ctx.getImageData(0, 0, vw, vh);
          var ref = gifAutoRef || detectCornerBg(raw.data, vw, vh);
          gifAutoRef = ref;
          applyBgKey(raw.data, workData.data, vw, vh, st.bgKey, st.bgTol, ref);
          gifRig.ctx.putImageData(workData, 0, 0);
        }
        gifRig.tex.needsUpdate = true;
        return;
      }
      if (staticImg) {
        var iw = staticImg.naturalWidth || 256, ih = staticImg.naturalHeight || 256;
        if (gifRig.canvas.width !== iw || gifRig.canvas.height !== ih) {
          gifRig.canvas.width = iw; gifRig.canvas.height = ih;
          workData = gifRig.ctx.createImageData(iw, ih);
          gifRig.setAspect(iw, ih);
        }
        gifRig.ctx.clearRect(0, 0, iw, ih);
        gifRig.ctx.drawImage(staticImg, 0, 0, iw, ih);
        var sRaw = gifRig.ctx.getImageData(0, 0, iw, ih);
        gifAutoRef = detectCornerBg(sRaw.data, iw, ih);
        applyBgKey(sRaw.data, workData.data, iw, ih, st.bgKey, st.bgTol, gifAutoRef);
        gifRig.ctx.putImageData(workData, 0, 0);
        gifRig.tex.needsUpdate = true;
        gifDirtyFrame = false;
        return;
      }
      if (!gifClip || !gifClip.frames.length || !workData) return;
      var fr = gifClip.frames[gifFrameIdx % gifClip.frames.length];
      applyBgKey(fr.rgba, workData.data, gifClip.width, gifClip.height, st.bgKey, st.bgTol, gifAutoRef);
      gifRig.ctx.putImageData(workData, 0, 0);
      gifRig.tex.needsUpdate = true;
      gifDirtyFrame = false;
    }

    function activatePresetOrSaved() {
      if (st.gifPreset === 'custom') {
        loadMediaRecord().then(function (rec) {
          if (rec && rec.buffer) {
            applyUploadedBuffer(rec.buffer, rec.mime || 'image/gif', rec.name || 'custom.gif', false);
          } else {
            st.gifPreset = 'girl';
            loadClipObject(makeBuiltInSpriteClip('girl'));
          }
        });
      } else {
        loadClipObject(makeBuiltInSpriteClip(st.gifPreset === 'neko' ? 'neko' : 'girl'));
      }
    }

    function applyUploadedBuffer(buffer, mime, name, persist) {
      mime = String(mime || '').toLowerCase();
      var isGif = mime.indexOf('gif') >= 0 || /\.gif$/i.test(name || '');
      if (!isGif && buffer && buffer.byteLength >= 6) {
        var b6 = new Uint8Array(buffer, 0, 6);
        var sig = String.fromCharCode(b6[0], b6[1], b6[2]);
        if (sig === 'GIF') isGif = true;
      }
      if (isGif) {
        try {
          var parsed = decodeGifBuffer(buffer);
          st.gifPreset = 'custom';
          st.gifName = name || 'custom.gif';
          st.mode = 'gif';
          saveState(st);
          loadClipObject(parsed);
          if (persist) saveMediaRecord({ buffer: buffer, mime: 'image/gif', name: st.gifName });
          syncStageVisibility();
          return Promise.resolve({ ok: true, frames: parsed.frames.length });
        } catch (err) {
          return Promise.resolve({ ok: false, error: err && err.message ? err.message : 'GIF 解析失败' });
        }
      }
      if (mime.indexOf('video/') === 0 || /\.(mp4|webm|mov)$/i.test(name || '')) {
        var vBlob = new Blob([buffer], { type: mime || 'video/mp4' });
        var vUrl = URL.createObjectURL(vBlob);
        var v = document.createElement('video');
        v.muted = true; v.loop = true; v.playsInline = true; v.autoplay = true;
        v.src = vUrl;
        v.play().catch(function () {});
        gifClip = null; staticImg = null; gifAutoRef = null;
        videoEl = v;
        st.gifPreset = 'custom'; st.gifName = name || 'video.mp4'; st.mode = 'gif';
        saveState(st);
        if (persist) saveMediaRecord({ buffer: buffer, mime: mime || 'video/mp4', name: st.gifName });
        syncStageVisibility();
        return Promise.resolve({ ok: true, frames: 60 });
      }
      // Static PNG / WebP / JPEG image
      return new Promise(function (resolve) {
        var iBlob = new Blob([buffer], { type: mime || 'image/png' });
        var iUrl = URL.createObjectURL(iBlob);
        var im = new Image();
        im.onload = function () {
          gifClip = null; videoEl = null; staticImg = im; gifDirtyFrame = true;
          st.gifPreset = 'custom'; st.gifName = name || 'image.png'; st.mode = 'gif';
          saveState(st);
          paintCurrentGifFrame();
          if (persist) saveMediaRecord({ buffer: buffer, mime: mime || 'image/png', name: st.gifName });
          syncStageVisibility();
          resolve({ ok: true, frames: 1 });
        };
        im.onerror = function () { resolve({ ok: false, error: '图片加载失败' }); };
        im.src = iUrl;
      });
    }

    activatePresetOrSaved();

    function syncStageVisibility() {
      var isClassic = st.mode === 'classic';
      stageRoot.visible = !isClassic;
      stageRoot.position.y = (!isClassic && st.flatBase) ? 0.0 : 0.112;

      var foldRad = clamp(st.foldDeg, 72, 125) * Math.PI / 180;
      upperPivot.rotation.x = -(foldRad - Math.PI / 2);

      miniDesk.visible = !!st.propDesk;
      girlRig.group.visible = st.mode === 'walk3d';
      girlRig.refl.visible = st.mode === 'walk3d';
      gifRig.group.visible = st.mode === 'gif';
      gifRig.refl.visible = st.mode === 'gif';

      var sc = clamp(st.scale || 1, 0.55, 1.65);
      girlRig.group.scale.setScalar(sc);
      girlRig.refl.scale.setScalar(sc);
      gifRig.group.scale.setScalar(sc);

      // Hide original projector base/beam when L-fold sits directly flat on desk
      var hideOrig = !isClassic && st.flatBase;
      o.group.children.forEach(function (ch) {
        if (ch === stageRoot || ch === o.hit) return;
        if (/^switch-/.test(ch.name || '')) { ch.visible = !hideOrig; return; }
        if (/^dress-projector/.test(ch.name || '') || origChildren.indexOf(ch) >= 0) {
          ch.visible = !hideOrig;
        }
      });
      // Even when sitting atop projector drum, hide original floating holo voxels in L-fold modes
      if (!isClassic && !st.flatBase) {
        for (var i = 2; i < origChildren.length; i++) origChildren[i].visible = false;
      }
    }

    // Autonomous Walking Controller (shared smooth kinematics for both 3D Girl & GIF!)
    var walk = {
      x: 0.01, z: 0.0, heading: 0.4, phase: 0,
      gx: 0.05, gz: 0.02, wait: 0, dirX: 1, flipScale: 1, stepSide: 1
    };
    function pickNewGoal() {
      // Avoid miniature desk prop at (-0.088, -0.056) if visible
      for (var tries = 0; tries < 8; tries++) {
        var nx = (Math.random() * 2 - 1) * 0.072;
        var nz = (Math.random() * 2 - 1) * 0.044;
        if (st.propDesk && nx < -0.042 && nz < -0.015) continue;
        walk.gx = nx; walk.gz = nz;
        return;
      }
      walk.gx = 0.03; walk.gz = 0.01;
    }

    var lastT = 0, lastDeckPaint = -1;

    // One-time gentle migration of Victorian Study's stock bookcase projector coordinate onto the desk
    function maybeMigrateToDeskOnce() {
      var A = root.MinestSpatialHome && root.MinestSpatialHome.api && root.MinestSpatialHome.api();
      if (!A || !A.env) return;
      var rm = A.env();
      if (!rm || !rm.envId || st.migrated[rm.envId]) return;
      var dh = rm.anchors && rm.anchors['desk.holo'];
      if (!dh) return;
      var L = A.layout && A.layout();
      var cur = L && L.projector;
      // Only migrate if projector is at Victorian's stock bookcase slot [-8.10, 1.865, -3.65]
      if (rm.envId === 'victorian' && cur && cur.p &&
          Math.abs(cur.p[0] + 8.10) < 0.08 && Math.abs(cur.p[1] - 1.865) < 0.08 && Math.abs(cur.p[2] + 3.65) < 0.08) {
        st.migrated[rm.envId] = { prev: cur };
        saveState(st);
        moveProjectorTo(dh.p, dh.ry);
      }
    }

    function moveProjectorTo(p, ry) {
      try {
        var A = root.MinestSpatialHome && root.MinestSpatialHome.api && root.MinestSpatialHome.api();
        var rm = A && A.env && A.env();
        if (!rm) return false;
        var env = rm.envId;
        // Update MinestBackpack store + local spatialHome settings
        var rawS = JSON.parse(localStorage.getItem('minest.spatialHome.v1') || '{}');
        rawS.layouts = rawS.layouts || {};
        var L = (A.layout && A.layout()) || rawS.layouts[env] || {};
        L.projector = { p: p.slice(), ry: ry, stashed: false };
        rawS.layouts[env] = L;
        localStorage.setItem('minest.spatialHome.v1', JSON.stringify(rawS));
        if (root.MinestBackpack && root.MinestBackpack.store) {
          root.MinestBackpack.store.set('bp:home:' + env, L);
        }
        o.group.position.set(p[0], p[1], p[2]);
        o.group.rotation.y = ry;
        o.stashed = false;
        o.group.visible = true;
        o.group.updateMatrixWorld(true);
        o.labelAt = new THREE.Vector3(o.label[0], o.label[1], o.label[2]).applyMatrix4(o.group.matrixWorld);
        o.centre = new THREE.Box3().setFromObject(o.hit).getCenter(new THREE.Vector3());
        updateFocusWorld();
        return true;
      } catch (e) { return false; }
    }

    function isOnDeskNow() {
      try {
        var A = root.MinestSpatialHome && root.MinestSpatialHome.api && root.MinestSpatialHome.api();
        var rm = A && A.env && A.env();
        var dh = rm && rm.anchors && rm.anchors['desk.holo'];
        if (!dh) return false;
        return Math.hypot(o.group.position.x - dh.p[0], o.group.position.z - dh.p[2]) < 0.75 &&
               Math.abs(o.group.position.y - dh.p[1]) < 0.25;
      } catch (e) { return false; }
    }

    function toggleDeskVsCabinet() {
      var A = root.MinestSpatialHome && root.MinestSpatialHome.api && root.MinestSpatialHome.api();
      var rm = A && A.env && A.env();
      if (!rm || !rm.anchors) return false;
      var onDesk = isOnDeskNow();
      if (onDesk) {
        var cab = (st.migrated[rm.envId] && st.migrated[rm.envId].prev) || rm.anchors['cabinet.top'] || rm.anchors['shelf.mid'];
        if (cab && cab.p) return moveProjectorTo(cab.p, cab.ry || 0);
      } else {
        var dh = rm.anchors['desk.holo'] || computeDeskHoloAnchor(rm.anchors);
        if (dh && dh.p) return moveProjectorTo(dh.p, dh.ry || 0);
      }
      return false;
    }

    function updateFocusWorld() {
      o.group.updateMatrixWorld(true);
      var baseY = (!st.flatBase || st.mode === 'classic') ? 0.11 : 0.0;
      var posL = st.mode === 'classic' ? new THREE.Vector3(0, 0.50, 0.88) : new THREE.Vector3(0, 0.30 + baseY, 0.62);
      var lookL = st.mode === 'classic' ? new THREE.Vector3(0, 0.22, 0) : new THREE.Vector3(0, 0.08 + baseY, -0.02);
      var M = new THREE.Matrix4().makeRotationY(o.group.rotation.y).setPosition(o.group.position.x, o.group.position.y, o.group.position.z);
      o.focus = {
        pos: posL.applyMatrix4(M).toArray(),
        look: lookL.applyMatrix4(M).toArray()
      };
    }

    o.aim = function () { updateFocusWorld(); };

    o.set = function (k) {
      origSet.call(o, k);
      syncStageVisibility();
    };

    var didMigrateCheck = false;
    o.idle = function (t) {
      var dt = clamp(lastT ? (t - lastT) : 0.016, 0.001, 0.08);
      lastT = t;

      if (!didMigrateCheck && t > 0.6) {
        didMigrateCheck = true;
        maybeMigrateToDeskOnce();
      }

      if (st.mode === 'classic') {
        stageRoot.visible = false;
        origIdle.call(o, t);
        return;
      }

      syncStageVisibility();
      var spd = clamp(st.speed || 1, 0.3, 2.5);
      var glowK = clamp(st.glow || 1, 0.3, 1.8);
      holoLight.intensity = 0.36 * glowK;

      // Step walking kinematics
      var movingAmp = 0;
      var prevStepSin = Math.sin(walk.phase);

      if (st.walkStyle === 'stand') {
        walk.x = lerp(walk.x, 0, Math.min(1, dt * 4));
        walk.z = lerp(walk.z, 0, Math.min(1, dt * 4));
        walk.heading += angDiff(0, walk.heading) * Math.min(1, dt * 5);
        walk.flipScale = lerp(walk.flipScale, 1, Math.min(1, dt * 8));
        movingAmp = st.mode === 'gif' ? 0.35 : 0.08;
        walk.phase += dt * 4.5 * spd;
      } else if (st.walkStyle === 'orbit') {
        var ang = t * 0.72 * spd;
        var nx = Math.cos(ang) * 0.052;
        var nz = Math.sin(ang) * 0.034;
        var vx = nx - walk.x, vz = nz - walk.z;
        walk.x = nx; walk.z = nz;
        walk.heading = Math.atan2(vx, vz);
        walk.dirX = vx >= 0 ? 1 : -1;
        walk.flipScale = lerp(walk.flipScale, walk.dirX, Math.min(1, dt * 9));
        movingAmp = 0.92;
        walk.phase += dt * 8.2 * spd;
      } else if (st.walkStyle === 'stroll') {
        var sx = Math.sin(t * 0.82 * spd) * 0.068;
        var dx = sx - walk.x;
        walk.x = sx;
        walk.z = lerp(walk.z, 0.008, Math.min(1, dt * 3));
        walk.dirX = dx >= 0 ? 1 : -1;
        walk.heading += angDiff(walk.dirX > 0 ? 0.42 : -0.42, walk.heading) * Math.min(1, dt * 6);
        walk.flipScale = lerp(walk.flipScale, walk.dirX, Math.min(1, dt * 10));
        movingAmp = Math.min(1, Math.abs(dx / Math.max(1e-4, dt)) * 18 + 0.2);
        walk.phase += dt * 8.0 * spd * movingAmp;
      } else {
        // 'patrol' — organic autonomous wandering with brief pauses
        if (walk.wait > 0) {
          walk.wait -= dt;
          walk.heading += angDiff(0, walk.heading) * Math.min(1, dt * 2.5);
          movingAmp = 0.06;
        } else {
          var gx = walk.gx - walk.x, gz = walk.gz - walk.z;
          var dist = Math.hypot(gx, gz);
          if (dist < 0.006) {
            pickNewGoal();
            walk.wait = 0.45 + Math.random() * 0.9;
          } else {
            var step = Math.min(dist, dt * 0.052 * spd);
            walk.x += (gx / dist) * step;
            walk.z += (gz / dist) * step;
            var wantH = Math.atan2(gx, gz);
            walk.heading += angDiff(wantH, walk.heading) * Math.min(1, dt * 6.5);
            if (Math.abs(gx) > 0.003) walk.dirX = gx >= 0 ? 1 : -1;
            walk.flipScale = lerp(walk.flipScale, walk.dirX, Math.min(1, dt * 9));
            movingAmp = 0.95;
            walk.phase += dt * 8.6 * spd;
          }
        }
      }

      // Trigger cyan footstep ripple on lower screen each half-stride
      var curStepSin = Math.sin(walk.phase);
      if (movingAmp > 0.35 && ((prevStepSin <= 0 && curStepSin > 0) || (prevStepSin >= 0 && curStepSin < 0))) {
        lowerDeck.addRipple(walk.x, walk.z);
      }

      var sc = clamp(st.scale || 1, 0.55, 1.65);

      if (st.mode === 'walk3d') {
        girlRig.group.position.set(walk.x, 0, walk.z);
        girlRig.group.rotation.y = walk.heading;
        girlRig.pose(walk.phase, movingAmp, t, glowK);
        girlRig.refl.position.set(walk.x, 0.0012, walk.z + 0.046 * sc);
      } else if (st.mode === 'gif') {
        // Advance GIF frame timer
        if (gifClip && gifClip.frames.length > 1) {
          gifFrameAcc += dt * 1000 * spd;
          var curDelay = gifClip.frames[gifFrameIdx % gifClip.frames.length].delay || 80;
          if (gifFrameAcc >= curDelay) {
            gifFrameAcc = gifFrameAcc % curDelay;
            gifFrameIdx = (gifFrameIdx + 1) % gifClip.frames.length;
            gifDirtyFrame = true;
          }
        }
        if (gifDirtyFrame || videoEl) paintCurrentGifFrame();

        var bob = movingAmp > 0.2 ? Math.abs(Math.cos(walk.phase)) * 0.0055 * movingAmp : Math.sin(t * 2.2) * 0.002;
        gifRig.group.position.set(walk.x, bob, walk.z);

        // Subtle camera-aware parallax yaw so walking around the desk feels volumetric!
        var camYaw = 0;
        var cam = root.SpatialRoom && root.SpatialRoom.camera;
        if (cam) {
          var wPos = new THREE.Vector3();
          actorStage.getWorldPosition(wPos);
          var localCam = o.group.worldToLocal(cam.position.clone());
          camYaw = clamp(Math.atan2(localCam.x, Math.max(0.15, localCam.z)) * 0.55, -0.48, 0.48);
        }
        gifRig.group.rotation.y = camYaw;
        var fx = Math.abs(walk.flipScale) < 0.12 ? (walk.flipScale < 0 ? -0.12 : 0.12) : walk.flipScale;
        gifRig.pivot.scale.x = fx;
        gifRig.refl.position.set(walk.x, 0.0014, walk.z + 0.056 * sc);
        gifRig.refl.scale.x = (gifRig.slices[0].scale.x || 1) * fx * sc;
        gifRig.refl.material.opacity = clamp(0.34 * glowK, 0.08, 0.65);
      }

      // Redraw lower OLED deck at ~30fps
      if (t - lastDeckPaint > 0.032) {
        lastDeckPaint = t;
        lowerDeck.paint(t, 0.033, walk.x, walk.z, glowK, st.mode === 'walk3d');
      }
    };

    /* -----------------------------------------------------------------------
       11. Interactive Control Panel (Upload GIF, Chroma-Key, Walk Mode, Angle)
       ----------------------------------------------------------------------- */
    o.panel = function (ctx) {
      var hostEl = (ctx && ctx.container) || document.body;
      return new Promise(function (resolve) {
        var box = document.createElement('div');
        box.className = 'sh-lfold-panel';

        var panelCss = document.getElementById('sh-lfold-panel-css');
        if (!panelCss) {
          panelCss = document.createElement('style');
          panelCss.id = 'sh-lfold-panel-css';
          panelCss.textContent =
            '.sh-lfold-panel{position:absolute;z-index:12;left:50%;bottom:calc(12px + env(safe-area-inset-bottom,0px));transform:translateX(-50%);width:min(460px,calc(100% - 20px));padding:12px 14px;border-radius:20px;background:rgba(8,15,26,.86);-webkit-backdrop-filter:blur(18px) saturate(160%);backdrop-filter:blur(18px) saturate(160%);border:1px solid rgba(125,211,252,.32);color:#e2f4ff;font:13px/1.35 -apple-system,BlinkMacSystemFont,"PingFang SC",sans-serif;box-shadow:0 18px 44px rgba(0,0,0,.48);box-sizing:border-box}' +
            '.sh-lfold-panel.mini{width:auto;padding:7px 10px;border-radius:999px}' +
            '.sh-lfold-panel.mini .lf-body{display:none}' +
            '.sh-lfold-panel .lf-hd{display:flex;align-items:center;gap:8px;justify-content:space-between}' +
            '.sh-lfold-panel .lf-title{display:flex;align-items:center;gap:6px;font-weight:700;font-size:13.5px;color:#f0f9ff}' +
            '.sh-lfold-panel .lf-topbtns{display:flex;align-items:center;gap:5px}' +
            '.sh-lfold-panel button{border:1px solid rgba(125,211,252,.26);background:rgba(56,189,248,.10);color:#dff4ff;border-radius:10px;padding:6px 10px;font:600 12px/1.1 inherit;cursor:pointer;transition:all .16s ease}' +
            '.sh-lfold-panel button:hover{background:rgba(56,189,248,.22);border-color:rgba(125,211,252,.5)}' +
            '.sh-lfold-panel button.on{background:linear-gradient(180deg,rgba(56,189,248,.38),rgba(14,165,233,.28));color:#fff;border-color:#7dd3fc;box-shadow:0 0 12px rgba(56,189,248,.28)}' +
            '.sh-lfold-panel button.pri{background:#0ea5e9;border-color:#38bdf8;color:#fff}' +
            '.sh-lfold-panel .lf-tabs{display:grid;grid-template-columns:repeat(3,1fr);gap:5px;margin:10px 0 8px}' +
            '.sh-lfold-panel .lf-row{display:flex;align-items:center;gap:6px;flex-wrap:wrap;margin-top:7px}' +
            '.sh-lfold-panel .lf-lbl{font-size:11.5px;color:#93c5fd;min-width:58px;font-weight:600}' +
            '.sh-lfold-panel .lf-drop{display:flex;align-items:center;justify-content:space-between;gap:8px;padding:8px 10px;margin-top:6px;border-radius:13px;border:1px dashed rgba(125,211,252,.45);background:rgba(14,165,233,.08)}' +
            '.sh-lfold-panel .lf-drop.drag{background:rgba(56,189,248,.24);border-color:#fff}' +
            '.sh-lfold-panel .lf-sliders{display:grid;grid-template-columns:1fr 1fr;gap:6px 12px;margin-top:8px}' +
            '.sh-lfold-panel .lf-sl{display:flex;align-items:center;gap:6px;font-size:11.5px;color:#bae6fd}' +
            '.sh-lfold-panel .lf-sl span{white-space:nowrap;min-width:46px}' +
            '.sh-lfold-panel .lf-sl input[type="range"]{flex:1;min-width:0;accent-color:#38bdf8;margin:0}' +
            '.sh-lfold-panel .lf-foot{display:flex;gap:6px;margin-top:10px;padding-top:8px;border-top:1px solid rgba(125,211,252,.16)}' +
            '.sh-lfold-panel .lf-foot button{flex:1}' +
            '.sh-lfold-panel .lf-status{font-size:11.5px;color:#7dd3fc;overflow:hidden;text-overflow:ellipsis;white-space:nowrap;max-width:210px}';
          document.head.appendChild(panelCss);
        }

        box.innerHTML =
          '<div class="lf-hd">' +
            '<div class="lf-title"><span>🔮 L折屏全息舞台</span></div>' +
            '<div class="lf-topbtns">' +
              '<button type="button" data-act="desk" title="在书桌与边柜之间切换摆放位置"></button>' +
              '<button type="button" data-act="mini" title="收起/展开控制栏以便全屏欣赏">👁 欣赏</button>' +
              '<button type="button" class="pri" data-act="done">✓ 完成</button>' +
            '</div>' +
          '</div>' +
          '<div class="lf-body">' +
            '<div class="lf-tabs">' +
              '<button type="button" data-mode="walk3d">🚶‍♀️ 3D 漫步少女</button>' +
              '<button type="button" data-mode="gif">🎞 自定义 GIF 3D</button>' +
              '<button type="button" data-mode="classic">🔤 经典文字全息</button>' +
            '</div>' +
            '<div data-sec="gif">' +
              '<div class="lf-drop" data-drop>' +
                '<div><b style="font-size:12px">上传你的 GIF / 动图 / 视频</b><div class="lf-status" data-status>支持透明或纯色底 GIF 自动抠图立体走动</div></div>' +
                '<button type="button" class="pri" data-act="pick">📂 选择 GIF</button>' +
                '<input type="file" accept="image/gif,image/webp,image/png,image/jpeg,video/mp4,video/webm,.gif" style="display:none" data-file>' +
              '</div>' +
              '<div class="lf-row">' +
                '<span class="lf-lbl">示例/去底</span>' +
                '<button type="button" data-preset="girl">✨ 示例少女</button>' +
                '<button type="button" data-preset="neko">🐱 像素小猫</button>' +
                '<button type="button" data-key="auto">智能抠底</button>' +
                '<button type="button" data-key="black">去黑底</button>' +
                '<button type="button" data-key="white">去白底</button>' +
                '<button type="button" data-key="none">原图</button>' +
              '</div>' +
            '</div>' +
            '<div data-sec="stage">' +
              '<div class="lf-row">' +
                '<span class="lf-lbl">人物走动</span>' +
                '<button type="button" data-walk="patrol">自由漫步</button>' +
                '<button type="button" data-walk="orbit">圆环绕行</button>' +
                '<button type="button" data-walk="stroll">左右散步</button>' +
                '<button type="button" data-walk="stand">原地踏步</button>' +
              '</div>' +
              '<div class="lf-sliders">' +
                '<label class="lf-sl"><span>折屏角</span><input type="range" min="75" max="118" step="1" data-sl="foldDeg"></label>' +
                '<label class="lf-sl"><span>人物大小</span><input type="range" min="0.65" max="1.55" step="0.05" data-sl="scale"></label>' +
                '<label class="lf-sl"><span>全息光效</span><input type="range" min="0.4" max="1.6" step="0.05" data-sl="glow"></label>' +
                '<label class="lf-sl"><span>走动速度</span><input type="range" min="0.4" max="2.0" step="0.1" data-sl="speed"></label>' +
              '</div>' +
              '<div class="lf-row">' +
                '<button type="button" data-toggle="propDesk">🪑 小书桌布景</button>' +
                '<button type="button" data-toggle="flatBase">📱 贴桌折叠屏</button>' +
                '<button type="button" data-act="classicEdit">✎ 编辑文字全息</button>' +
                '<button type="button" data-act="holoPortal">🌌 全屏全息展厅</button>' +
              '</div>' +
            '</div>' +
          '</div>';

        hostEl.appendChild(box);

        var fileInput = box.querySelector('[data-file]');
        var statusEl = box.querySelector('[data-status]');
        var dropZone = box.querySelector('[data-drop]');
        var deskBtn = box.querySelector('[data-act="desk"]');

        function refreshUI() {
          var mini = box.classList.contains('mini');
          box.querySelector('[data-act="mini"]').textContent = mini ? '⚙ 展开设置' : '👁 欣赏';
          deskBtn.textContent = isOnDeskNow() ? '↩ 放回边柜' : '📌 摆到书桌';

          [].forEach.call(box.querySelectorAll('[data-mode]'), function (b) {
            b.classList.toggle('on', b.getAttribute('data-mode') === st.mode);
          });
          box.querySelector('[data-sec="gif"]').style.display = st.mode === 'gif' ? '' : 'none';
          box.querySelector('[data-sec="stage"]').style.display = st.mode === 'classic' ? 'none' : '';

          [].forEach.call(box.querySelectorAll('[data-walk]'), function (b) {
            b.classList.toggle('on', b.getAttribute('data-walk') === st.walkStyle);
          });
          [].forEach.call(box.querySelectorAll('[data-key]'), function (b) {
            b.classList.toggle('on', b.getAttribute('data-key') === st.bgKey);
          });
          [].forEach.call(box.querySelectorAll('[data-preset]'), function (b) {
            b.classList.toggle('on', b.getAttribute('data-preset') === st.gifPreset);
          });
          [].forEach.call(box.querySelectorAll('[data-toggle]'), function (b) {
            var k = b.getAttribute('data-toggle');
            b.classList.toggle('on', !!st[k]);
          });
          [].forEach.call(box.querySelectorAll('[data-sl]'), function (inp) {
            var k = inp.getAttribute('data-sl');
            inp.value = st[k];
          });
          if (st.gifPreset === 'custom' && st.gifName) {
            statusEl.textContent = '当前动图：' + st.gifName + (gifClip ? ' (' + gifClip.frames.length + ' 帧)' : '');
          } else {
            statusEl.textContent = '支持上传本地 .gif / .webp / .png / .mp4';
          }
        }

        function handleFile(file) {
          if (!file) return;
          statusEl.textContent = '正在解析 ' + file.name + '…';
          var reader = new FileReader();
          reader.onload = function () {
            applyUploadedBuffer(reader.result, file.type, file.name, true).then(function (res) {
              if (res && res.ok) {
                statusEl.textContent = '✓ 已加载 ' + file.name + ' (' + res.frames + ' 帧)';
              } else {
                statusEl.textContent = '⚠ ' + ((res && res.error) || '解析失败');
              }
              refreshUI();
            });
          };
          reader.readAsArrayBuffer(file);
        }

        fileInput.addEventListener('change', function () {
          if (fileInput.files && fileInput.files[0]) handleFile(fileInput.files[0]);
          fileInput.value = '';
        });

        ['dragenter', 'dragover'].forEach(function (ev) {
          dropZone.addEventListener(ev, function (e) { e.preventDefault(); e.stopPropagation(); dropZone.classList.add('drag'); });
        });
        ['dragleave', 'drop'].forEach(function (ev) {
          dropZone.addEventListener(ev, function (e) {
            e.preventDefault(); e.stopPropagation(); dropZone.classList.remove('drag');
            if (ev === 'drop' && e.dataTransfer && e.dataTransfer.files && e.dataTransfer.files[0]) {
              handleFile(e.dataTransfer.files[0]);
            }
          });
        });

        function onPaste(e) {
          var items = e.clipboardData && e.clipboardData.items;
          if (!items) return;
          for (var i = 0; i < items.length; i++) {
            if (items[i].kind === 'file') {
              var f = items[i].getAsFile();
              if (f) { handleFile(f); break; }
            }
          }
        }
        root.addEventListener('paste', onPaste);

        box.addEventListener('input', function (e) {
          var sl = e.target.closest('[data-sl]');
          if (!sl) return;
          var k = sl.getAttribute('data-sl');
          st[k] = parseFloat(sl.value);
          saveState(st);
          syncStageVisibility();
        });

        function closePanel(result) {
          root.removeEventListener('paste', onPaste);
          root.removeEventListener('keydown', onEsc, true);
          box.remove();
          resolve(result || null);
        }

        function onEsc(e) {
          if (e.key === 'Escape') { e.stopPropagation(); closePanel(null); }
        }
        root.addEventListener('keydown', onEsc, true);

        box.addEventListener('click', function (e) {
          var b = e.target.closest('button');
          if (!b) return;
          e.stopPropagation();

          var m = b.getAttribute('data-mode');
          if (m) {
            st.mode = m;
            saveState(st);
            syncStageVisibility();
            if (m === 'classic') {
              closePanel(null);
              origPanel.call(o, ctx);
              return;
            }
            refreshUI();
            return;
          }
          var w = b.getAttribute('data-walk');
          if (w) { st.walkStyle = w; saveState(st); refreshUI(); return; }

          var ky = b.getAttribute('data-key');
          if (ky) { st.bgKey = ky; gifDirtyFrame = true; paintCurrentGifFrame(); saveState(st); refreshUI(); return; }

          var pr = b.getAttribute('data-preset');
          if (pr) {
            st.gifPreset = pr;
            st.mode = 'gif';
            saveState(st);
            loadClipObject(makeBuiltInSpriteClip(pr === 'neko' ? 'neko' : 'girl'));
            syncStageVisibility();
            refreshUI();
            return;
          }

          var tg = b.getAttribute('data-toggle');
          if (tg) { st[tg] = !st[tg]; saveState(st); syncStageVisibility(); refreshUI(); return; }

          var act = b.getAttribute('data-act');
          if (act === 'pick') { fileInput.click(); return; }
          if (act === 'mini') { box.classList.toggle('mini'); refreshUI(); return; }
          if (act === 'desk') {
            if (toggleDeskVsCabinet()) {
              closePanel(null);
              setTimeout(function () {
                var A = root.MinestSpatialHome && root.MinestSpatialHome.api && root.MinestSpatialHome.api();
                if (A && A.activate) A.activate('projector');
              }, 160);
            }
            return;
          }
          if (act === 'classicEdit') {
            st.mode = 'classic'; saveState(st); syncStageVisibility();
            root.removeEventListener('paste', onPaste);
            root.removeEventListener('keydown', onEsc, true);
            box.remove();
            origPanel.call(o, ctx).then(resolve);
            return;
          }
          if (act === 'holoPortal') { closePanel({ feature: 'holo' }); return; }
          if (act === 'done') closePanel(null);
        });

        ['pointerdown', 'touchstart', 'wheel'].forEach(function (ev) {
          box.addEventListener(ev, function (e) { e.stopPropagation(); }, { passive: true });
        });

        refreshUI();
      });
    };

    syncStageVisibility();

    // Expose programmatic test/inspection hook on the object
    o.holoStage = {
      getState: function () { return JSON.parse(JSON.stringify(st)); },
      setMode: function (m) { st.mode = m; saveState(st); syncStageVisibility(); },
      loadBuffer: function (buf, mime, name) { return applyUploadedBuffer(buf, mime, name, true); },
      frameIndex: function () { return gifFrameIdx; },
      frameCount: function () { return gifClip ? gifClip.frames.length : (videoEl ? 60 : (staticImg ? 1 : 0)); },
      actorPos: function () { return { x: +walk.x.toFixed(4), z: +walk.z.toFixed(4), heading: +walk.heading.toFixed(3) }; }
    };

    return o;
  }

  /* -------------------------------------------------------------------------
     12. Non-Destructive Hook into `window.SpatialObjects`
     ------------------------------------------------------------------------- */
  var SO = root.SpatialObjects;
  if (SO.make && typeof SO.make.projector === 'function') {
    var origMakeProjector = SO.make.projector;
    SO.make.projector = function () {
      return upgradeProjector(origMakeProjector.apply(this, arguments));
    };
  }
  if (typeof SO.build === 'function') {
    var origBuild = SO.build;
    SO.build = function (room, scene, opts) {
      ensureRoomDeskAnchor(room);
      var list = origBuild.apply(this, arguments);
      list.forEach(function (o) {
        if (o && o.id === 'projector') {
          upgradeProjector(o);
          var a = (room && room.anchors && room.anchors[o.anchor]) || (room && room.anchors && room.anchors['cabinet.top']);
          if (a && a.p) {
            o.group.position.set(a.p[0], a.p[1], a.p[2]);
            o.group.rotation.y = a.ry || 0;
            o.group.updateMatrixWorld(true);
            o.labelAt = new THREE.Vector3(o.label[0], o.label[1], o.label[2]).applyMatrix4(o.group.matrixWorld);
            o.centre = new THREE.Box3().setFromObject(o.hit).getCenter(new THREE.Vector3());
            if (o.aim) o.aim();
          }
        }
      });
      return list;
    };
  }

  root.SpatialHoloGifStage = {
    decodeGifBuffer: decodeGifBuffer,
    upgradeProjector: upgradeProjector,
    version: '1.0'
  };
})(window);

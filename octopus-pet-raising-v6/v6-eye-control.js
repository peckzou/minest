(function () {
  'use strict';

  // The catchlights are native Three.js children of the imported avatar. This
  // controller only owns the small control surface and smooths its values.
  var state = { targetX: 0, targetY: -0.22, currentX: 0, currentY: -0.22, targetSize: 1, currentSize: 1, preset: 'upper-center', enabled: true };
  var section = null;
  var raf = 0;
  var capturedAvatar = null;
  // 43.6 motion v2 — expression layer on top of the preset (offsets in eye radii; y < 0 = up)
  var EXPR = {
    neutral:   { dx: 0, dy: 0, size: 1, sec: 1, twinkle: 0, twinkleHz: 2, orbit: 0, shimmer: 0, dim: 1 },
    happy:     { dx: 0, dy: -.08, size: 1.2, sec: 1.25, twinkle: .1, twinkleHz: 2.4, orbit: 0, shimmer: 0, dim: 1 },
    excited:   { dx: 0, dy: -.04, size: 1.32, sec: 1.5, twinkle: .22, twinkleHz: 4.5, orbit: 0, shimmer: 0, dim: 1 },
    curious:   { dx: .14, dy: -.06, size: 1.1, sec: .9, twinkle: 0, twinkleHz: 2, orbit: 0, shimmer: 0, dim: 1 },
    surprised: { dx: 0, dy: .06, size: 1.42, sec: 1.3, twinkle: 0, twinkleHz: 2, orbit: 0, shimmer: 0, dim: 1 },
    sleepy:    { dx: 0, dy: .16, size: .7, sec: .6, twinkle: 0, twinkleHz: 2, orbit: 0, shimmer: 0, dim: .62 },
    sad:       { dx: 0, dy: .2, size: 1.12, sec: 1.9, twinkle: .05, twinkleHz: 1.2, orbit: 0, shimmer: .018, dim: 1 },
    shy:       { dx: -.12, dy: .12, size: .86, sec: .8, twinkle: 0, twinkleHz: 2, orbit: 0, shimmer: 0, dim: .9 },
    dizzy:     { dx: 0, dy: 0, size: 1.05, sec: 1, twinkle: 0, twinkleHz: 2, orbit: .2, shimmer: 0, dim: 1 },
    love:      { dx: 0, dy: -.1, size: 1.3, sec: 1.6, twinkle: .16, twinkleHz: 1.6, orbit: 0, shimmer: 0, dim: 1 }
  };
  var expr = { name: 'neutral', until: 0, cur: Object.assign({}, EXPR.neutral), target: EXPR.neutral, look: 0 };
  function setExpression(name, holdMs, opts) {
    var e = EXPR[name] || EXPR.neutral;
    expr.name = EXPR[name] ? name : 'neutral';
    expr.target = opts ? Object.assign({}, e, opts) : e;
    expr.until = holdMs ? performance.now() + holdMs : 0;
  }
  var presets = { center: [0, 0], 'upper-center': [0, -0.22], left: [-0.24, -0.04], right: [0.24, -0.04], upper: [0, -0.28], lower: [0, 0.22] };

  function clamp(value, min, max) { return Math.max(min, Math.min(max, value)); }

  function addStyle() {
    if (document.querySelector('[data-v6-eye-style]')) return;
    var style = document.createElement('style');
    style.dataset.v6EyeStyle = 'true';
    style.textContent = [
      '[data-v6-eye-section]{margin-top:14px;padding-top:12px;border-top:1px solid rgba(255,255,255,.1)}',
      '[data-v6-eye-section] > span{display:block;color:#bda3f8;text-transform:uppercase;letter-spacing:.08em;margin-bottom:7px;font-size:11px}',
      '[data-v6-eye-row]{display:grid;grid-template-columns:repeat(3,minmax(0,1fr));gap:5px;margin-top:5px}',
      '[data-v6-eye-row] button{min-height:30px;padding:0 6px;font-size:10px;text-align:center}',
      '[data-v6-eye-row] button[data-active="true"]{color:#fff;background:#49316d;border-color:#bda3f8;box-shadow:0 0 0 1px rgba(189,163,248,.2) inset}',
      '[data-v6-eye-toggle]{width:100%;margin-top:5px}',
      '[data-v6-eye-toggle][data-active="false"]{color:#c6b9d4;border-color:rgba(198,185,212,.38);background:rgba(255,255,255,.04)}',
      '[data-v6-eye-note]{display:block;color:#9c93ad;margin-top:7px;font-size:10px;line-height:1.35}'
    ].join('');
    document.head.appendChild(style);
  }

  try {
    Object.defineProperty(window, '__octopusAvatar', {
      configurable: true,
      get: function () { return capturedAvatar; },
      set: function (value) {
        if (value) {
          capturedAvatar = value;
          window.__v6AvatarInstance = value;
        }
      }
    });
  } catch (error) {}

  function getAvatar() { return capturedAvatar || window.__v6AvatarInstance || window.__octopusAvatarPersistent || null; }

  // 43.6: the eyes are painted into the baked texture of one skinned mesh, so the catchlights are
  // pinned to the eye in texture (UV) space: each catchlight sits on the mesh triangle under its UV
  // point, and every frame its position is the skinned position of that triangle's 3 vertices
  // (barycentric blend). It therefore stays exactly on the eye through head squash, nods, swimming and
  // camera turns. (Before: two dots hung off the model root at a guessed spot ~0.6 units in front of
  // the face, so any rotation or head motion slid them off the eyes.)
  function findEyes(skinned) {
    var map = skinned.material && (skinned.material.emissiveMap || skinned.material.map);
    var img = map && map.image;
    if (!img || !img.width) return null;
    var S = 1024, cv = document.createElement('canvas'); cv.width = cv.height = S;
    var cx = cv.getContext('2d', { willReadFrequently: true });
    cx.drawImage(img, 0, 0, S, S);
    var px = cx.getImageData(0, 0, S, S).data;
    var flip = !!map.flipY;
    function lumAt(u, v) {
      var x = Math.min(S - 1, Math.max(0, Math.floor(u * S))), y = Math.min(S - 1, Math.max(0, Math.floor((flip ? 1 - v : v) * S)));
      var k = (y * S + x) * 4; return .3 * px[k] + .59 * px[k + 1] + .11 * px[k + 2];
    }
    var g = skinned.geometry, P = g.attributes.position, UV = g.attributes.uv;
    if (!UV) return null;
    var maxY = -Infinity; for (var i = 0; i < P.count; i++) maxY = Math.max(maxY, P.getY(i));
    var eyes = [];
    [-1, 1].forEach(function (side) {
      // dark, front-facing vertices on this side of the upper head
      var su = 0, sv = 0, n = 0;
      for (var i = 0; i < P.count; i++) {
        if (Math.sign(P.getX(i)) !== side || P.getY(i) < maxY * .5 || P.getZ(i) < 0) continue;
        if (lumAt(UV.getX(i), UV.getY(i)) < 45) { su += UV.getX(i); sv += UV.getY(i); n++; }
      }
      if (n < 6) return;
      // flood-fill the dark blob in the texture around that centre → true eye centre + radius in UV
      var u0 = su / n, v0 = sv / n;
      var sx = Math.floor(u0 * S), sy = Math.floor((flip ? 1 - v0 : v0) * S);
      function dark(x, y) { var k = (y * S + x) * 4; return .3 * px[k] + .59 * px[k + 1] + .11 * px[k + 2] < 70; }
      if (!dark(sx, sy)) {
        var best = null;
        for (var r = 1; r < 40 && !best; r++) for (var dy = -r; dy <= r && !best; dy++) for (var dx = -r; dx <= r; dx++) {
          var xx = sx + dx, yy = sy + dy; if (xx >= 0 && yy >= 0 && xx < S && yy < S && dark(xx, yy)) { best = [xx, yy]; break; }
        }
        if (!best) return; sx = best[0]; sy = best[1];
      }
      var seen = new Uint8Array(S * S), stack = [sx, sy], minx = S, maxx = 0, miny = S, maxy = 0, cnt = 0, ax = 0, ay = 0;
      seen[sy * S + sx] = 1;
      while (stack.length && cnt < 60000) {
        var y = stack.pop(), x = stack.pop();
        cnt++; ax += x; ay += y;
        if (x < minx) minx = x; if (x > maxx) maxx = x; if (y < miny) miny = y; if (y > maxy) maxy = y;
        var nb = [x + 1, y, x - 1, y, x, y + 1, x, y - 1];
        for (var q = 0; q < 8; q += 2) {
          var nx = nb[q], ny = nb[q + 1];
          if (nx < 0 || ny < 0 || nx >= S || ny >= S) continue;
          var id = ny * S + nx;
          // white baked glints inside the pupil count as eye too (only stop at the light skin)
          if (!seen[id] && (dark(nx, ny) || (Math.abs(nx - sx) < (maxx - minx) * .5 + 3 && Math.abs(ny - sy) < (maxy - miny) * .5 + 3 && cnt < 200))) { seen[id] = 1; stack.push(nx, ny); }
        }
      }
      var cu = (minx + maxx) / 2 / S, cvv = (miny + maxy) / 2 / S;
      eyes.push({ side: side, u: cu, v: flip ? 1 - cvv : cvv, ru: (maxx - minx) / 2 / S, rv: (maxy - miny) / 2 / S });
    });
    if (eyes.length !== 2) return null;
    // triangles that touch either eye (UV bbox, padded) for fast lookups
    var idx = g.index, triCount = idx ? idx.count / 3 : P.count / 3, tris = [];
    function vi(t, k) { return idx ? idx.getX(t * 3 + k) : t * 3 + k; }
    for (var t = 0; t < triCount; t++) {
      var a = vi(t, 0), b = vi(t, 1), c = vi(t, 2);
      for (var e = 0; e < 2; e++) {
        var E = eyes[e], pad = 2.2;
        var ua = UV.getX(a), va = UV.getY(a);
        if (Math.abs(ua - E.u) < E.ru * pad && Math.abs(va - E.v) < E.rv * pad) { tris.push([a, b, c]); break; }
      }
    }
    return { eyes: eyes, tris: tris, UV: UV, P: P };
  }
  // the triangle whose UV contains (u, v) → { i: [a,b,c], w: [wa,wb,wc] }
  function locate(info, u, v) {
    var UV = info.UV, best = null, bestErr = Infinity;
    for (var t = 0; t < info.tris.length; t++) {
      var tr = info.tris[t];
      var x1 = UV.getX(tr[0]), y1 = UV.getY(tr[0]), x2 = UV.getX(tr[1]), y2 = UV.getY(tr[1]), x3 = UV.getX(tr[2]), y3 = UV.getY(tr[2]);
      var d = (y2 - y3) * (x1 - x3) + (x3 - x2) * (y1 - y3);
      if (Math.abs(d) < 1e-12) continue;
      var w1 = ((y2 - y3) * (u - x3) + (x3 - x2) * (v - y3)) / d, w2 = ((y3 - y1) * (u - x3) + (x1 - x3) * (v - y3)) / d, w3 = 1 - w1 - w2;
      var err = Math.max(0, -w1) + Math.max(0, -w2) + Math.max(0, -w3);
      if (err < bestErr) { bestErr = err; best = { i: tr, w: [w1, w2, w3] }; if (err === 0) break; }
    }
    return best;
  }

  // closest point on the eye's triangles (bind pose) to a 3D point → { i, w }
  function closestOnSurface(info, x, y, z) {
    var P = info.P, best = null, bestD = Infinity;
    for (var t = 0; t < info.tris.length; t++) {
      var tr = info.tris[t], r = closestOnTri(x, y, z,
        P.getX(tr[0]), P.getY(tr[0]), P.getZ(tr[0]), P.getX(tr[1]), P.getY(tr[1]), P.getZ(tr[1]), P.getX(tr[2]), P.getY(tr[2]), P.getZ(tr[2]));
      if (r[0] < bestD) { bestD = r[0]; best = { i: tr, w: [r[1], r[2], r[3]] }; }
    }
    return best;
  }
  function closestOnTri(px, py, pz, ax, ay, az, bx, by, bz, cx, cy, cz) {
    // Ericson, Real-Time Collision Detection 5.1.5 — returns [dist², wa, wb, wc]
    var abx = bx - ax, aby = by - ay, abz = bz - az, acx = cx - ax, acy = cy - ay, acz = cz - az;
    var apx = px - ax, apy = py - ay, apz = pz - az;
    var d1 = abx * apx + aby * apy + abz * apz, d2 = acx * apx + acy * apy + acz * apz, wa, wb, wc;
    if (d1 <= 0 && d2 <= 0) { wa = 1; wb = 0; wc = 0; }
    else {
      var bpx = px - bx, bpy = py - by, bpz = pz - bz;
      var d3 = abx * bpx + aby * bpy + abz * bpz, d4 = acx * bpx + acy * bpy + acz * bpz;
      if (d3 >= 0 && d4 <= d3) { wa = 0; wb = 1; wc = 0; }
      else {
        var vc = d1 * d4 - d3 * d2;
        if (vc <= 0 && d1 >= 0 && d3 <= 0) { var v1 = d1 / (d1 - d3); wa = 1 - v1; wb = v1; wc = 0; }
        else {
          var cpx = px - cx, cpy = py - cy, cpz = pz - cz;
          var d5 = abx * cpx + aby * cpy + abz * cpz, d6 = acx * cpx + acy * cpy + acz * cpz;
          if (d6 >= 0 && d5 <= d6) { wa = 0; wb = 0; wc = 1; }
          else {
            var vb = d5 * d2 - d1 * d6;
            if (vb <= 0 && d2 >= 0 && d6 <= 0) { var w1 = d2 / (d2 - d6); wa = 1 - w1; wb = 0; wc = w1; }
            else {
              var va = d3 * d6 - d5 * d4;
              if (va <= 0 && (d4 - d3) >= 0 && (d5 - d6) >= 0) { var w2 = (d4 - d3) / ((d4 - d3) + (d5 - d6)); wa = 0; wb = 1 - w2; wc = w2; }
              else { var den = 1 / (va + vb + vc); wb = vb * den; wc = vc * den; wa = 1 - wb - wc; }
            }
          }
        }
      }
    }
    var qx = ax * wa + bx * wb + cx * wc - px, qy = ay * wa + by * wb + cy * wc - py, qz = az * wa + bz * wb + cz * wc - pz;
    return [qx * qx + qy * qy + qz * qz, wa, wb, wc];
  }
  function bindPoint(info, hit) {
    var P = info.P, i = hit.i, w = hit.w;
    return [0, 1, 2].map(function (k) {
      var get = k === 0 ? 'getX' : k === 1 ? 'getY' : 'getZ';
      return P[get](i[0]) * w[0] + P[get](i[1]) * w[1] + P[get](i[2]) * w[2];
    });
  }

  function installOnAvatar(avatar) {
    var model = avatar && avatar.importedModel;
    if (!model || model.userData.v6EyeHighlightGroup) return;
    var skinned = null;
    model.traverse(function (node) { if (!skinned && node.isSkinnedMesh) skinned = node; });
    var crown = null;
    model.traverse(function (node) { if (!crown && node.isMesh && !node.isSkinnedMesh && node.material && !Array.isArray(node.material)) crown = node; });
    var refMesh = crown || (avatar.character && avatar.character.leftEyeMesh);
    if (!skinned || !refMesh || typeof skinned.getVertexPosition !== 'function') return;
    var info = findEyes(skinned);
    if (!info) return;
    var Mesh = refMesh.constructor, Material = refMesh.material.constructor;
    var Geometry = skinned.geometry.constructor, Attr = skinned.geometry.attributes.position.constructor;
    var V3 = skinned.position.constructor, Q = skinned.quaternion.constructor;
    if (Attr.name && /Interleaved/.test(Attr.name)) Attr = skinned.geometry.attributes.normal.constructor;
    // unit disc facing +Z
    var segs = 28, verts = [0, 0, 0], index = [];
    for (var k = 0; k <= segs; k++) { var a = k / segs * Math.PI * 2; verts.push(Math.cos(a), Math.sin(a), 0); }
    for (var k2 = 1; k2 <= segs; k2++) index.push(0, k2, k2 + 1);
    var disc = new Geometry();
    disc.setAttribute('position', new Attr(new Float32Array(verts), 3));
    disc.setIndex(index);
    var material = new Material({ color: 0xffffff, emissive: 0xffffff, emissiveIntensity: 1.15, roughness: 1, metalness: 0, transparent: true, opacity: .97, depthWrite: false, polygonOffset: true, polygonOffsetFactor: -4, polygonOffsetUnits: -4 });
    if ('toneMapped' in material) material.toneMapped = false;
    var group = new (avatar.avatarGestureGroup ? avatar.avatarGestureGroup.constructor : model.constructor)();
    group.name = 'v6-eye-catchlights';
    group.userData.v6EyeHighlight = { x: 0, y: -.22, size: 1 };
    skinned.add(group);   // skinned positions are in the skinned mesh's local space
    var tmpA = new V3(), tmpB = new V3(), tmpC = new V3(), e1 = new V3(), e2 = new V3(), nrm = new V3(), Z = new V3(0, 0, 1);
    function skinnedPoint(hit, out) {
      skinned.getVertexPosition(hit.i[0], tmpA); skinned.getVertexPosition(hit.i[1], tmpB); skinned.getVertexPosition(hit.i[2], tmpC);
      out.set(0, 0, 0).addScaledVector(tmpA, hit.w[0]).addScaledVector(tmpB, hit.w[1]).addScaledVector(tmpC, hit.w[2]);
      e1.subVectors(tmpB, tmpA); e2.subVectors(tmpC, tmpA); nrm.crossVectors(e1, e2).normalize();
      return out;
    }
    // per eye: which UV direction is "up" and "right" on screen (texture islands can be flipped)
    var dots = [];
    info.eyes.forEach(function (E) {
      var c0 = locate(info, E.u, E.v), cu = locate(info, E.u + E.ru * .6, E.v), cvv = locate(info, E.u, E.v + E.rv * .6);
      if (!c0 || !cu || !cvv) return;
      // eye frame in bind space: surface normal at the centre, "up" = model up flattened onto the
      // eye, "right" = up × normal. Offsets are laid out in this frame (not along the UV axes, which
      // the texture wrap stretches and tilts), then snapped to the nearest point on the eye surface.
      var C = bindPoint(info, c0), Eu = bindPoint(info, cu);
      var P = info.P, t0 = c0.i;
      var ax = P.getX(t0[1]) - P.getX(t0[0]), ay = P.getY(t0[1]) - P.getY(t0[0]), az = P.getZ(t0[1]) - P.getZ(t0[0]);
      var bx = P.getX(t0[2]) - P.getX(t0[0]), by = P.getY(t0[2]) - P.getY(t0[0]), bz = P.getZ(t0[2]) - P.getZ(t0[0]);
      var n = new V3(ay * bz - az * by, az * bx - ax * bz, ax * by - ay * bx).normalize();
      if (n.z < 0) n.negate();
      var up = new V3(0, 1, 0).addScaledVector(n, -n.y).normalize();
      var right = new V3().crossVectors(up, n).normalize();
      E.C = new V3(C[0], C[1], C[2]); E.up = up; E.right = right;
      E.R = Math.hypot(Eu[0] - C[0], Eu[1] - C[1], Eu[2] - C[2]) / .6;   // cu sat at .6 of the UV radius
      E.center = c0;
      E.edge = closestOnSurface(info, E.C.x + right.x * E.R, E.C.y + right.y * E.R, E.C.z + right.z * E.R);
      [{ main: true }, { main: false }].forEach(function (kind) {
        var dot = new Mesh(disc, material);
        dot.name = 'v6-eye-catchlight-' + (E.side < 0 ? 'left' : 'right') + (kind.main ? '' : '-small');
        dot.renderOrder = 20;
        dot.frustumCulled = false;
        dot.userData.eye = E; dot.userData.main = kind.main; dot.userData.hit = null; dot.userData.key = '';
        dot.onBeforeRender = function () { placeDot(dot); };
        group.add(dot);
        dots.push(dot);
      });
    });
    if (!dots.length) { skinned.remove(group); return; }
    var pos = new V3(), ctr = new V3(), edge = new V3(), q = new Q();
    var cW = new V3(), eW = new V3(), nW = new V3(), rW = new V3(), uW = new V3(), Vv = new V3(), Lv = new V3(), Hv = new V3(), wUp = new V3(0, 1, 0), tmp = new V3();
    var keyLight = null, reflCache = {};
    // 43.6 motion v2: where the key light's reflection would sit on this eye, relative to where it sits
    // when the eye looks straight at the camera. Turning, spinning or tilting slides the catchlight
    // across the eye like a real reflection; facing the camera it rests at the chosen preset.
    function reflection(E) {
      var frame = avatar.__eyeFrameId || 0, c = reflCache[E.side];
      if (c && c.f === frame) return c;
      c = reflCache[E.side] = { f: frame, x: 0, y: 0 };
      var cam = avatar.camera;
      if (!cam) return c;
      if (!keyLight && avatar.scene) keyLight = avatar.scene.getObjectByName('keyLight') || null;
      skinnedPoint(E.center, cW); var nl = nrm.clone();
      skinnedPoint(E.edge, eW);
      cW.applyMatrix4(skinned.matrixWorld); eW.applyMatrix4(skinned.matrixWorld);
      nW.copy(nl).transformDirection(skinned.matrixWorld);
      rW.subVectors(eW, cW).addScaledVector(nW, -tmp.subVectors(eW, cW).dot(nW)).normalize();
      uW.crossVectors(nW, rW).normalize();
      Vv.setFromMatrixPosition(cam.matrixWorld).sub(cW).normalize();
      if (keyLight) { Lv.setFromMatrixPosition(keyLight.matrixWorld); if (keyLight.target) Lv.sub(tmp.setFromMatrixPosition(keyLight.target.matrixWorld)); else Lv.sub(cW); Lv.normalize(); }
      else Lv.set(.55, .7, .45).normalize();
      Hv.addVectors(Lv, Vv).normalize();
      // same half-vector seen by an eye facing the camera
      var upR = tmp.copy(wUp).addScaledVector(Vv, -wUp.dot(Vv)).normalize();
      var hu0 = Hv.dot(upR), hr0 = Hv.dot(tmp.crossVectors(upR, Vv).normalize());
      c.x = Hv.dot(rW) - hr0; c.y = -(Hv.dot(uW) - hu0);
      return c;
    }
    function placeDot(dot) {
      var E = dot.userData.eye, d = group.userData.v6EyeHighlight, ex = expr.cur, t = performance.now() * .001;
      var rf = reflection(E), K = 1.35;
      // main catchlight at the preset (+ reflection + expression); a small secondary one opposite it
      var ox = d.x * 1.75 + rf.x * K + ex.dx + Math.cos(t * 5.2 + E.side) * ex.orbit, oy = d.y * 1.75 + rf.y * K + ex.dy + Math.sin(t * 5.2 + E.side) * ex.orbit;
      ox += Math.sin(t * 23 + E.side * 2) * ex.shimmer; oy += Math.cos(t * 19 + E.side) * ex.shimmer;
      if (!dot.userData.main) { ox = -d.x * 1.2 + .3 - rf.x * K * .6 - ex.dx * .5; oy = -d.y * .6 + .34 - rf.y * K * .6 + ex.dy * .4 - Math.sin(t * 5.2 + E.side) * ex.orbit; }
      var len = Math.hypot(ox, oy), lim = dot.userData.main ? .62 : .7;
      if (len > lim) { ox *= lim / len; oy *= lim / len; }
      var key = (Math.round(ox * 200) / 200) + ',' + (Math.round(oy * 200) / 200);
      if (dot.userData.key !== key) {
        dot.userData.key = key;
        var tx = E.C.x + (E.right.x * ox - E.up.x * oy) * E.R, ty = E.C.y + (E.right.y * ox - E.up.y * oy) * E.R, tz = E.C.z + (E.right.z * ox - E.up.z * oy) * E.R;
        dot.userData.hit = closestOnSurface(info, tx, ty, tz);
        dot.userData.edge = E.edge;
      }
      if (!dot.userData.hit) return;
      skinnedPoint(E.center, ctr);
      skinnedPoint(dot.userData.edge, edge);
      var eyeR = ctr.distanceTo(edge);
      skinnedPoint(dot.userData.hit, pos);              // also leaves the surface normal in nrm
      var tw = 1 + ex.twinkle * Math.sin(t * ex.twinkleHz * Math.PI * 2 + (dot.userData.main ? 0 : 1.7) + E.side * .6);
      var r = eyeR * (dot.userData.main ? .31 * ex.size : .12 * ex.sec) * d.size * tw;
      dot.position.copy(pos).addScaledVector(nrm, r * .18);
      q.setFromUnitVectors(Z, nrm);
      dot.quaternion.copy(q);
      dot.scale.set(r, r, r);
      dot.updateMatrix();
      dot.matrixWorld.multiplyMatrices(group.matrixWorld, dot.matrix);
    }
    group.userData.material = material;
    model.userData.v6EyeHighlightGroup = group;
    avatar.setV6EyeHighlightVisible = function (visible) { group.visible = Boolean(visible); };
    avatar.setV6EyeHighlight = function (x, y, size) {
      var data = group.userData.v6EyeHighlight;
      data.x = clamp(Number(x) || 0, -.34, .34);
      data.y = clamp(Number(y) || 0, -.34, .34);
      data.size = clamp(Number(size) || 1, .72, 1.42);
    };
    avatar.setV6EyeHighlight(0, -.22, 1);
  }

  function syncAvatar() {
    var avatar = getAvatar();
    installOnAvatar(avatar);
    if (!avatar || typeof avatar.setV6EyeHighlight !== 'function') return;
    avatar.setV6EyeHighlight(state.currentX, state.currentY, state.currentSize);
    if (typeof avatar.setV6EyeHighlightVisible === 'function') avatar.setV6EyeHighlightVisible(state.enabled);
  }

  function tickExpression() {
    if (expr.until && performance.now() > expr.until) { expr.target = EXPR.neutral; expr.name = 'neutral'; expr.until = 0; }
    var c = expr.cur, t = expr.target, k = .085;
    for (var key in t) if (typeof t[key] === 'number') c[key] += (t[key] - c[key]) * (key === 'orbit' || key === 'size' ? .12 : k);
    if (expr.look) c.dx += expr.look * .16;
    var avatar = getAvatar(), g = avatar && avatar.importedModel && avatar.importedModel.userData.v6EyeHighlightGroup;
    if (g && g.userData.material) g.userData.material.opacity = .97 * c.dim;
    if (avatar) avatar.__eyeFrameId = (avatar.__eyeFrameId || 0) + 1;
  }

  function tick() {
    tickExpression();
    state.currentX += (state.targetX - state.currentX) * .13;
    state.currentY += (state.targetY - state.currentY) * .13;
    state.currentSize += (state.targetSize - state.currentSize) * .13;
    syncAvatar();
    raf = window.requestAnimationFrame(tick);
  }

  function syncButtons() {
    if (!section) return;
    section.querySelectorAll('button[data-v6-eye-preset]').forEach(function (button) { button.dataset.active = String(button.dataset.v6EyePreset === state.preset); });
    section.querySelectorAll('button[data-v6-eye-size]').forEach(function (button) { button.dataset.active = String(Number(button.dataset.v6EyeSize) === state.targetSize); });
    var toggle = section.querySelector('[data-v6-eye-toggle]');
    if (toggle) {
      toggle.dataset.active = String(state.enabled);
      toggle.textContent = state.enabled ? 'Hide highlight' : 'Show highlight';
      toggle.setAttribute('aria-label', state.enabled ? 'Hide eye highlight' : 'Show eye highlight');
    }
  }

  function setPreset(name) {
    var point = presets[name];
    if (!point) return;
    state.targetX = point[0];
    state.targetY = point[1];
    state.preset = name;
    syncButtons();
  }

  function setSize(size) { state.targetSize = clamp(Number(size) || 1, .72, 1.42); syncButtons(); }

  function setEnabled(enabled) { state.enabled = Boolean(enabled); syncButtons(); }

  function makeButton(label, attribute, value, action) {
    var button = document.createElement('button');
    button.type = 'button';
    button.textContent = label;
    button.dataset[attribute] = value;
    button.setAttribute('aria-label', label + ' eye highlight');
    button.addEventListener('click', function (event) { event.preventDefault(); event.stopPropagation(); action(value); });
    return button;
  }

  function addControls(panel) {
    if (!panel || panel.querySelector('[data-v6-eye-section]')) return;
    section = document.createElement('div');
    section.dataset.v6EyeSection = 'true';
    var title = document.createElement('span');
    title.textContent = 'Eye highlight';
    section.appendChild(title);
    var positionRow = document.createElement('div');
    positionRow.dataset.v6EyeRow = 'position';
    [['Center', 'center'], ['Left', 'left'], ['Right', 'right'], ['Upper', 'upper'], ['Lower', 'lower'], ['Reset', 'upper-center']].forEach(function (item) { positionRow.appendChild(makeButton(item[0], 'v6EyePreset', item[1], setPreset)); });
    var sizeRow = document.createElement('div');
    sizeRow.dataset.v6EyeRow = 'size';
    [['Small', '.78'], ['Default', '1'], ['Large', '1.3']].forEach(function (item) { sizeRow.appendChild(makeButton(item[0], 'v6EyeSize', item[1], setSize)); });
    section.appendChild(positionRow);
    section.appendChild(sizeRow);
    var toggle = makeButton('Hide highlight', 'v6EyeToggle', 'true', function () { setEnabled(!state.enabled); });
    section.appendChild(toggle);
    var note = document.createElement('small');
    note.dataset.v6EyeNote = 'true';
    note.textContent = 'Stitch-style white catchlight · pinned to the eye surface';
    section.appendChild(note);
    panel.appendChild(section);
    syncButtons();
  }

  function scan() { var panel = document.querySelector('.avatar-control-panel'); if (panel) addControls(panel); }

  function boot() {
    addStyle();
    scan();
    if (!raf) raf = window.requestAnimationFrame(tick);
    new MutationObserver(scan).observe(document.body, { childList: true, subtree: true });
    window.addEventListener('resize', scan, { passive: true });
    window.__v6EyeHighlight = { setPreset: setPreset, setSize: setSize, setEnabled: setEnabled, setExpression: setExpression, setLook: function (v) { expr.look = clamp(Number(v) || 0, -1, 1); }, expressions: Object.keys(EXPR), getExpression: function () { return expr.name; }, getState: function () { return { x: state.targetX, y: state.targetY, size: state.targetSize, preset: state.preset, enabled: state.enabled }; } };
  }

  if (document.readyState === 'loading') document.addEventListener('DOMContentLoaded', boot);
  else boot();
}());

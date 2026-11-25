/* Show kit for the staged rides (2026-11-24) — what "it's a small world" has, made shareable:
 *  · a look: one show shader per scene (key, back and rim light, a tint, depth haze into the scene's own colour,
 *    caustics under water, glow from lava below, a flash for lightning, and a spotlight for a headlamp or searchlight),
 *    over vertex-coloured geometry merged into one draw call per set piece (a builder with a matrix stack);
 *  · figures with faces, hair, hats and jointed arms and legs;
 *  · painted backdrops, moving water, drifting motes (bubbles, embers, spores), soft halos round lamps;
 *  · a score: a small sequencer on the audio clock (lead, bass, pad, percussion) through a reverb, in sections;
 *  · lines in Chinese and English (they join the park's dictionary). */
(function (root) {
  'use strict';
  var K = root.TPRideKit; if (!K) return;
  var PI = Math.PI, uTime = { value: 0 }, looks = [];
  K.uTime = uTime;
  (function tick() { requestAnimationFrame(tick); uTime.value = performance.now() / 1000; })();
  function rgb(h) { return [(h >> 16 & 255) / 255, (h >> 8 & 255) / 255, (h & 255) / 255]; }
  function hash(x, y, z) { var s = Math.sin(x * 12.9898 + y * 78.233 + z * 37.719) * 43758.5453; return s - Math.floor(s); }
  K.rnd = function (seed) { var s = seed % 2147483647; if (s <= 0) s += 2147483646; return function () { return (s = s * 16807 % 2147483647) / 2147483647; }; };

  /* ------------------------------------------------------------------ the look */
  var VS = 'attribute vec3 aCol; attribute float aGlow; varying vec3 vC; varying vec3 vN; varying vec3 vW; varying float vG; varying float vD;' +
    'void main(){ vC=aCol; vG=aGlow; vN=normalize(mat3(modelMatrix)*normal); vec4 w=modelMatrix*vec4(position,1.0); vW=w.xyz; vec4 mv=viewMatrix*w; vD=-mv.z; gl_Position=projectionMatrix*mv; }';
  var FS = 'uniform vec3 uTint; uniform vec3 uFog; uniform float uNear; uniform float uFar; uniform float uAmb; uniform float uRim; uniform float uTime; uniform float uCaus;' +
    'uniform vec3 uUnder; uniform float uUnderY; uniform vec3 uFlash; uniform vec3 uSpotP; uniform vec3 uSpotD; uniform vec3 uSpotC; uniform float uSpotCos; uniform float uSpotR; uniform float uPulse;' +
    'varying vec3 vC; varying vec3 vN; varying vec3 vW; varying float vG; varying float vD;' +
    'void main(){ vec3 n=normalize(vN); if(!gl_FrontFacing) n=-n; float d=max(dot(n,normalize(vec3(0.3,0.8,0.5))),0.0); float bk=max(dot(n,normalize(vec3(-0.45,0.25,-0.6))),0.0);' +
    ' vec3 v=normalize(cameraPosition-vW); float rim=pow(1.0-max(dot(n,v),0.0),3.0);' +
    ' vec3 c=vC*(uAmb+(1.0-uAmb)*d)*mix(vec3(1.0),uTint,0.35)+uTint*(bk*0.10+rim*uRim);' +
    ' c+=vC*uUnder*(smoothstep(uUnderY+14.0,uUnderY,vW.y)*0.9+max(-n.y,0.0)*0.35);' +
    ' float ca=sin(vW.x*0.9+uTime*1.3)+sin(vW.z*1.1-uTime*1.1)+sin((vW.x+vW.z)*0.7+uTime*0.8); ca=pow(max(0.0,ca/3.0*0.5+0.5),5.0); c+=uCaus*ca*max(n.y,0.0)*vec3(0.55,0.9,1.0);' +
    ' vec3 sp=vW-uSpotP; float sl=length(sp); float sd=dot(sp/max(sl,0.001),uSpotD); float cone=smoothstep(uSpotCos,uSpotCos+0.16,sd)*(1.0-smoothstep(uSpotR*0.35,uSpotR,sl))*smoothstep(1.5,5.0,sl);' +
    ' c+=vC*uSpotC*cone*(0.55+0.45*max(dot(n,-uSpotD),0.0));' +
    ' c+=vC*uFlash;' +
    ' c=mix(c,vC*(1.0+uPulse*sin(uTime*2.2+vW.x*0.7+vW.z*0.9)),clamp(vG,0.0,1.0));' +
    ' float f=smoothstep(uNear,uFar,vD)*(1.0-clamp(vG,0.0,1.0)*0.55); c=mix(c,uFog,f);' +
    ' gl_FragColor=vec4(c,1.0); }';
  /* o: tint [r,g,b], fog hex, near, far, amb, rim, caus, under hex, underY, pulse */
  K.look = function (o) {
    var T = K.T(), V3 = function (a) { return new T.Vector3(a[0], a[1], a[2]); };
    var u = { uTint: { value: V3(o.tint || [1, 1, 1]) }, uFog: { value: V3(rgb(o.fog || 0)) }, uNear: { value: o.near == null ? 20 : o.near }, uFar: { value: o.far == null ? 160 : o.far },
      uAmb: { value: o.amb == null ? 0.5 : o.amb }, uRim: { value: o.rim == null ? 0.2 : o.rim }, uTime: uTime, uCaus: { value: o.caus || 0 }, uUnder: { value: V3(o.under ? rgb(o.under) : [0, 0, 0]) }, uUnderY: { value: o.underY || 0 },
      uFlash: { value: V3([0, 0, 0]) }, uSpotP: { value: V3([0, 0, 0]) }, uSpotD: { value: V3([0, 0, -1]) }, uSpotC: { value: V3([0, 0, 0]) }, uSpotCos: { value: 0.9 }, uSpotR: { value: 60 }, uPulse: { value: o.pulse == null ? 0.18 : o.pulse } };
    var mat = new T.ShaderMaterial({ uniforms: u, vertexShader: VS, fragmentShader: FS, side: T.DoubleSide });
    var Lk = { u: u, mat: mat, fog: o.fog || 0,
      flash: function (r, g, b) { u.uFlash.value.set(r, g == null ? r : g, b == null ? r : b); },
      spot: function (p, d, col, cos, range) { u.uSpotP.value.set(p[0], p[1], p[2]); var l = Math.hypot(d[0], d[1], d[2]) || 1; u.uSpotD.value.set(d[0] / l, d[1] / l, d[2] / l); if (col) u.uSpotC.value.set(col[0], col[1], col[2]); if (cos != null) u.uSpotCos.value = cos; if (range != null) u.uSpotR.value = range; },
      /* build a mesh: fn gets a builder; the mesh is added to parent */
      mesh: function (parent, fn, x, y, z, ry) { var b = K.bld(); fn(b); var m = new T.Mesh(b.geo(), mat); m.position.set(x || 0, y || 0, z || 0); if (ry) m.rotation.y = ry; m.frustumCulled = false; if (parent) parent.add(m); return m; } };
    looks.push(Lk); return Lk;
  };

  /* ------------------------------------------------------------------ the builder */
  K.rockGeo = function (r, seed, detail, rough, soft) { var T = K.T(), g = new T.IcosahedronGeometry(r, detail == null ? 1 : detail), p = g.attributes.position, k = rough == null ? 0.32 : rough;
    for (var i = 0; i < p.count; i++) { var x = p.getX(i), y = p.getY(i), z = p.getZ(i), f = 2.3 / r, q = 1 + k * ((Math.sin(x * f + seed) + Math.sin(y * f * 1.31 + seed * 2.1) + Math.sin(z * f * 0.83 + seed * 3.7)) / 3 * 1.5 + (hash(Math.round(x / r * 40) + seed, Math.round(y / r * 40), Math.round(z / r * 40)) - 0.5) * 0.5); p.setXYZ(i, x * q, y * q, z * q); }
    g.computeVertexNormals(); var nm = g.attributes.normal; for (i = 0; i < p.count; i++) { var l = Math.hypot(p.getX(i), p.getY(i), p.getZ(i)) || 1, sf = soft == null ? 0.75 : soft, nx = nm.getX(i) * (1 - sf) + p.getX(i) / l * sf, ny = nm.getY(i) * (1 - sf) + p.getY(i) / l * sf, nz = nm.getZ(i) * (1 - sf) + p.getZ(i) / l * sf, nl = Math.hypot(nx, ny, nz) || 1; nm.setXYZ(i, nx / nl, ny / nl, nz / nl); } return g; };
  K.bld = function () {
    var T = K.T(), P = [], N = [], C = [], G = [], glow = 0, stack = [new T.Matrix4()], m4 = new T.Matrix4(), q = new T.Quaternion(), e = new T.Euler(), v = new T.Vector3(), sc = new T.Vector3(), n3 = new T.Matrix3();
    var b = {
      glow: function (g) { glow = g || 0; return b; },
      push: function (x, y, z, ry, s, rx, rz) { var m = new T.Matrix4(); q.setFromEuler(e.set(rx || 0, ry || 0, rz || 0)); m.compose(v.set(x || 0, y || 0, z || 0), q, sc.set(s || 1, s || 1, s || 1)); stack.push(stack[stack.length - 1].clone().multiply(m)); return b; },
      pop: function () { if (stack.length > 1) stack.pop(); return b; },
      add: function (geo, col, x, y, z, rx, ry, rz, sx, sy, sz) {
        var g = geo.index ? geo.toNonIndexed() : geo;
        q.setFromEuler(e.set(rx || 0, ry || 0, rz || 0)); m4.compose(v.set(x || 0, y || 0, z || 0), q, sc.set(sx || 1, sy || sx || 1, sz || sx || 1)); m4.premultiply(stack[stack.length - 1]);
        n3.getNormalMatrix(m4);
        var p = g.attributes.position.array, nn = g.attributes.normal.array, c = typeof col === 'function' ? null : rgb(col);
        for (var i = 0; i < p.length; i += 3) { v.set(p[i], p[i + 1], p[i + 2]); var ly = p[i + 1]; v.applyMatrix4(m4); P.push(v.x, v.y, v.z); var cc = c || rgb(col(v.x, v.y, v.z, ly)); C.push(cc[0], cc[1], cc[2]); v.set(nn[i], nn[i + 1], nn[i + 2]).applyMatrix3(n3).normalize(); N.push(v.x, v.y, v.z); G.push(glow); }
        g.dispose(); if (g !== geo) geo.dispose(); return b; },
      box: function (c, w, h, d, x, y, z, rx, ry, rz) { return b.add(new T.BoxGeometry(w, h, d), c, x, y, z, rx, ry, rz); },
      cyl: function (c, rt, rb, h, x, y, z, rx, ry, rz, seg) { return b.add(new T.CylinderGeometry(rt, rb, h, seg || 10), c, x, y, z, rx, ry, rz); },
      cone: function (c, r, h, x, y, z, rx, ry, rz, seg) { return b.add(new T.ConeGeometry(r, h, seg || 10), c, x, y, z, rx, ry, rz); },
      sph: function (c, r, x, y, z, sx, sy, sz, seg) { return b.add(new T.SphereGeometry(r, seg || 12, Math.max(6, Math.round((seg || 12) * 0.7))), c, x, y, z, 0, 0, 0, sx, sy, sz); },
      dome: function (c, r, x, y, z, frac, rx, ry, rz, sx, sy, sz) { return b.add(new T.SphereGeometry(r, 16, 8, 0, PI * 2, 0, PI * (frac || 0.5)), c, x, y, z, rx, ry, rz, sx, sy, sz); },
      torus: function (c, r, t, x, y, z, rx, ry, rz, arc, seg) { return b.add(new T.TorusGeometry(r, t, 8, seg || 24, arc || PI * 2), c, x, y, z, rx, ry, rz); },
      disc: function (c, r, x, y, z, rx, ry, seg) { return b.add(new T.CircleGeometry(r, seg || 24), c, x, y, z, rx == null ? -PI / 2 : rx, ry); },
      plane: function (c, w, h, x, y, z, rx, ry, rz) { return b.add(new T.PlaneGeometry(w, h), c, x, y, z, rx, ry, rz); },
      rock: function (c, r, x, y, z, seed, sx, sy, sz, detail, rough) { return b.add(K.rockGeo(r, seed || 1, detail, rough), c, x, y, z, (seed || 1) * 1.3, (seed || 1) * 2.1, 0, sx, sy, sz); },
      /* a tube through points [[x,y,z],…] with a radius that tapers r0 → r1 */
      tube: function (c, pts, r0, r1, seg, rs) { var cv = new T.CatmullRomCurve3(pts.map(function (a) { return new T.Vector3(a[0], a[1], a[2]); })), n = seg || pts.length * 5, g = new T.TubeGeometry(cv, n, 1, rs || 7, false), p = g.attributes.position, nm = g.attributes.normal, ring = (rs || 7) + 1;
        for (var i = 0; i < p.count; i++) { var k = Math.floor(i / ring) / n, r = r0 + ((r1 == null ? r0 : r1) - r0) * k; p.setXYZ(i, p.getX(i) + nm.getX(i) * (r - 1), p.getY(i) + nm.getY(i) * (r - 1), p.getZ(i) + nm.getZ(i) * (r - 1)); }
        return b.add(g, c); },
      /* a turned shape: profile [[radius, y],…] */
      lathe: function (c, prof, x, y, z, seg, rx, ry, rz, s) { return b.add(new T.LatheGeometry(prof.map(function (a) { return new T.Vector2(a[0], a[1]); }), seg || 14), c, x, y, z, rx, ry, rz, s); },
      geo: function () { var g = new T.BufferGeometry(); g.setAttribute('position', new T.Float32BufferAttribute(P, 3)); g.setAttribute('normal', new T.Float32BufferAttribute(N, 3)); g.setAttribute('aCol', new T.Float32BufferAttribute(C, 3)); g.setAttribute('aGlow', new T.Float32BufferAttribute(G, 1)); return g; }
    };
    return b;
  };
  /* shade a colour by a factor (for hand-made variation) */
  K.shade = function (h, k) { var c = rgb(h); return (Math.min(255, Math.round(c[0] * k * 255)) << 16) | (Math.min(255, Math.round(c[1] * k * 255)) << 8) | Math.min(255, Math.round(c[2] * k * 255)); };
  K.mix = function (a, b2, k) { var x = rgb(a), y = rgb(b2); return (Math.round((x[0] + (y[0] - x[0]) * k) * 255) << 16) | (Math.round((x[1] + (y[1] - x[1]) * k) * 255) << 8) | Math.round((x[2] + (y[2] - x[2]) * k) * 255); };

  /* ------------------------------------------------------------------ figures */
  /* o: h (height, 1.75), skin, top, bot, boots, coat (hex: a long coat), belt, sash, hair, beard, hat ('tricorn','bandana','cap','captain','helmet','hood','turban'),
   *    hatC, eye, brow, face(b): extra on the head, extra(b): extra on the body. Parts in userData: head, armL/armR (shoulders), foreL/foreR (elbows), legL/legR (hips). */
  K.doll = function (Lk, parent, x, y, z, ry, o) {
    o = o || {}; var T = K.T(), g = new T.Group(), s = (o.h || 1.75) / 1.75, skin = o.skin == null ? 0xe8b88f : o.skin, top = o.top == null ? 0x6b4a35 : o.top, bot = o.bot == null ? 0x2e2a2a : o.bot, boots = o.boots == null ? 0x1c1512 : o.boots, u = {};
    g.position.set(x || 0, y || 0, z || 0); g.rotation.y = ry || 0; g.scale.setScalar(s); if (parent) parent.add(g);
    Lk.mesh(g, function (b) {
      b.cyl(top, 0.2, 0.17, 0.52, 0, 1.2, 0, 0, 0, 0, 12).sph(top, 0.2, 0, 1.44, 0, 1.05, 0.5, 0.8).cyl(bot, 0.175, 0.185, 0.16, 0, 0.9, 0, 0, 0, 0, 12);
      if (o.belt != null) b.cyl(o.belt, 0.19, 0.19, 0.06, 0, 0.98, 0, 0, 0, 0, 12).box(0xd9b23c, 0.07, 0.07, 0.03, 0, 0.98, 0.185);
      if (o.sash != null) b.cyl(o.sash, 0.195, 0.2, 0.1, 0, 1.03, 0, 0, 0, 0, 12).box(o.sash, 0.07, 0.34, 0.04, 0.13, 0.84, 0.15, 0, 0, 0.1);
      if (o.coat != null) { b.cyl(o.coat, 0.215, 0.3, 0.74, 0, 0.98, -0.02, 0, 0, 0, 12); b.box(K.shade(o.coat, 0.75), 0.06, 0.7, 0.03, -0.07, 1.0, 0.24, 0.06).box(K.shade(o.coat, 0.75), 0.06, 0.7, 0.03, 0.07, 1.0, 0.24, 0.06); b.box(K.shade(o.coat, 1.2), 0.1, 0.16, 0.03, -0.1, 1.42, 0.17, 0, 0, 0.4).box(K.shade(o.coat, 1.2), 0.1, 0.16, 0.03, 0.1, 1.42, 0.17, 0, 0, -0.4); }
      b.cyl(skin, 0.06, 0.07, 0.1, 0, 1.52, 0);
      if (o.extra) o.extra(b);
    });
    var head = new T.Group(); head.position.y = 1.58; g.add(head); u.head = head;
    Lk.mesh(head, function (b) {
      b.sph(skin, 0.17, 0, 0.14, 0, 0.95, 1.05, 0.98, 16);
      [-1, 1].forEach(function (sx) {
        b.sph(0xffffff, 0.036, sx * 0.062, 0.165, 0.135, 1, 1, 0.6); b.glow(0.2).sph(o.eye == null ? 0x2a1a12 : o.eye, 0.02, sx * 0.064, 0.165, 0.158).glow(0);
        b.box(o.brow == null ? (o.hair == null ? 0x2a1a12 : o.hair) : o.brow, 0.055, 0.012, 0.014, sx * 0.064, 0.212, 0.155, 0, 0, -sx * (o.angry ? -0.35 : 0.12));
        b.sph(skin, 0.03, sx * 0.165, 0.14, 0, 0.5, 1, 0.8);
      });
      b.sph(K.shade(skin, 0.92), 0.028, 0, 0.125, 0.165, 0.9, 1, 1.1).box(0x8a3a34, 0.06, 0.012, 0.012, 0, 0.068, 0.155);
      if (o.hair != null && o.hat !== 'hood' && o.hat !== 'helmet') { b.dome(o.hair, 0.178, 0, 0.16, -0.012, 0.56, -0.3); if (o.long) b.box(o.hair, 0.3, 0.3, 0.07, 0, 0.04, -0.12); }
      if (o.beard != null) { b.sph(o.beard, 0.1, 0, 0.04, 0.09, 1.1, 0.9, 0.7); if (o.beardLong) b.cone(o.beard, 0.07, 0.2, 0, -0.08, 0.1, PI, 0, 0); }
      if (o.stache != null) b.box(o.stache, 0.09, 0.02, 0.02, 0, 0.09, 0.165);
      var hc = o.hatC == null ? 0x2a2420 : o.hatC;
      switch (o.hat) {
        case 'tricorn': b.cyl(hc, 0.12, 0.15, 0.1, 0, 0.32, 0).cyl(hc, 0.3, 0.3, 0.025, 0, 0.275, 0, 0, 0, 0, 3).box(0xd9b23c, 0.31, 0.02, 0.02, 0, 0.285, 0.14); break;
        case 'bandana': b.dome(hc, 0.18, 0, 0.165, 0, 0.5, -0.1).box(hc, 0.05, 0.16, 0.03, 0.15, 0.1, -0.12, 0, 0, -0.3); break;
        case 'cap': b.dome(hc, 0.178, 0, 0.19, 0, 0.45).box(hc, 0.2, 0.02, 0.12, 0, 0.215, 0.18); break;
        case 'captain': b.cyl(hc, 0.19, 0.16, 0.08, 0, 0.3, 0, 0, 0, 0, 14).box(0x111111, 0.2, 0.02, 0.1, 0, 0.262, 0.18).box(0xd9b23c, 0.06, 0.04, 0.02, 0, 0.3, 0.17); break;
        case 'helmet': b.sph(hc, 0.2, 0, 0.17, 0, 1, 1.02, 1.02, 16); break;
        case 'hood': b.sph(hc, 0.21, 0, 0.15, -0.035, 1, 1.08, 1, 14); break;
        case 'turban': b.sph(hc, 0.2, 0, 0.26, -0.01, 1, 0.6, 1).sph(0xd9b23c, 0.03, 0, 0.27, 0.19); break;
        default: break;
      }
      if (o.face) o.face(b);
    });
    function limb(side, arm) {
      var p = new T.Group(), f = new T.Group(), c = arm ? (o.sleeve == null ? (o.coat != null ? o.coat : top) : o.sleeve) : bot;
      if (arm) { p.position.set(side * 0.255, 1.44, 0); f.position.y = -0.27; Lk.mesh(p, function (b) { b.sph(c, 0.075, 0, 0, 0).cyl(c, 0.062, 0.055, 0.28, 0, -0.14, 0); }); Lk.mesh(f, function (b) { b.sph(c, 0.056, 0, 0, 0).cyl(c, 0.052, 0.046, 0.24, 0, -0.12, 0); if (o.cuff != null) b.cyl(o.cuff, 0.058, 0.058, 0.05, 0, -0.22, 0); b.sph(skin, 0.05, 0, -0.28, 0, 0.9, 1.1, 0.7); }); }
      else { p.position.set(side * 0.095, 0.86, 0); f.position.y = -0.4; Lk.mesh(p, function (b) { b.cyl(c, 0.085, 0.07, 0.42, 0, -0.2, 0); }); Lk.mesh(f, function (b) { b.sph(c, 0.07, 0, 0, 0).cyl(c, 0.068, 0.06, 0.34, 0, -0.17, 0).cyl(boots, 0.07, 0.075, 0.16, 0, -0.34, 0).box(boots, 0.13, 0.08, 0.24, 0, -0.42, 0.05); }); }
      p.add(f); g.add(p); return [p, f];
    }
    var aL = limb(-1, true), aR = limb(1, true), lL = limb(-1, false), lR = limb(1, false);
    u.armL = aL[0]; u.foreL = aL[1]; u.armR = aR[0]; u.foreR = aR[1]; u.legL = lL[0]; u.shinL = lL[1]; u.legR = lR[0]; u.shinR = lR[1];
    u.armL.rotation.z = -0.12; u.armR.rotation.z = 0.12; u.foreL.rotation.x = u.foreR.rotation.x = -0.2;
    g.userData = u; return g;
  };
  /* a little life for a standing figure: breathing, a turning head */
  K.idle = function (d, t, ph) { var u = d.userData; ph = ph || 0; u.head.rotation.y = Math.sin(t * 0.6 + ph) * 0.35; u.head.rotation.x = Math.sin(t * 0.9 + ph * 2) * 0.06; u.armL.rotation.x = Math.sin(t * 1.1 + ph) * 0.08; u.armR.rotation.x = -Math.sin(t * 1.1 + ph) * 0.08; };
  /* a chain of joints (tentacle, tail, kelp): returns the joint groups, root first; draw(b, i, k) draws segment i (k = 0…1 along) */
  K.chain = function (Lk, parent, n, len, draw) { var T = K.T(), js = [], par = parent; for (var i = 0; i < n; i++) { var j = new T.Group(); j.position.y = i ? len : 0; par.add(j); (function (i) { Lk.mesh(j, function (b) { draw(b, i, i / (n - 1 || 1)); }); })(i); par = j; js.push(j); } return js; };

  /* ------------------------------------------------------------------ backdrops, water, motes, halos */
  K.paint = function (w, h, draw) { var T = K.T(), cv = document.createElement('canvas'); cv.width = w; cv.height = h; draw(cv.getContext('2d'), w, h); var t = new T.CanvasTexture(cv); t.anisotropy = 4; return t; };
  /* the inside of a cylinder, painted */
  K.cyc = function (g, r, h, tex, y, arc, start) { var T = K.T(), m = new T.Mesh(new T.CylinderGeometry(r, r, h, 48, 1, true, start || 0, arc || PI * 2), new T.MeshBasicMaterial({ map: tex, side: T.BackSide, fog: false, depthWrite: false })); m.position.y = y || 0; m.renderOrder = -5; g.add(m); return m; };
  K.flat = function (g, w, h, tex, x, y, z, ry, o) { var T = K.T(), m = new T.Mesh(new T.PlaneGeometry(w, h), new T.MeshBasicMaterial(Object.assign({ map: tex, fog: false, transparent: true, side: T.DoubleSide }, o || {}))); m.position.set(x || 0, y || 0, z || 0); if (ry) m.rotation.y = ry; g.add(m); return m; };
  var WVS = 'varying vec3 vW; varying float vD; void main(){ vec4 w=modelMatrix*vec4(position,1.0); vW=w.xyz; vec4 mv=viewMatrix*w; vD=-mv.z; gl_Position=projectionMatrix*mv; }';
  var WFS = 'uniform vec3 uA; uniform vec3 uB; uniform vec3 uS; uniform vec3 uFog; uniform float uNear; uniform float uFar; uniform float uTime; uniform float uOp; uniform vec3 uFlash; varying vec3 vW; varying float vD;' +
    'float w(vec2 p,float t){ return sin(dot(p,vec2(0.8,0.3))+t*1.1)+sin(dot(p,vec2(-0.35,0.9))*1.3-t*0.9)+sin(dot(p,vec2(0.6,-0.75))*2.1+t*1.5)*0.5+sin(dot(p,vec2(-0.9,-0.2))*3.3-t*2.1)*0.25; }' +
    'void main(){ vec2 p=vW.xz; float h=w(p,uTime); float hx=w(p+vec2(0.15,0.0),uTime)-h; float hz=w(p+vec2(0.0,0.15),uTime)-h; vec3 n=normalize(vec3(-hx*1.3,1.0,-hz*1.3));' +
    ' vec3 v=normalize(cameraPosition-vW); float fr=pow(1.0-max(dot(n,v),0.0),2.5); vec3 c=mix(uA,uB,clamp(fr*0.8+h*0.05,0.0,1.0));' +
    ' float sp=pow(max(dot(reflect(-normalize(vec3(0.3,0.7,-0.6)),n),v),0.0),40.0); c+=uS*sp; c+=uB*uFlash;' +
    ' c=mix(c,uFog,smoothstep(uNear,uFar,vD)); gl_FragColor=vec4(c,uOp); }';
  /* o: a (deep colour), b (sheen colour), s (sparkle), fog, near, far, op */
  K.water = function (g, w, d, o, x, y, z) { var T = K.T(), V = function (h) { var c = rgb(h); return new T.Vector3(c[0], c[1], c[2]); };
    var u = { uA: { value: V(o.a) }, uB: { value: V(o.b) }, uS: { value: V(o.s == null ? 0xffffff : o.s) }, uFog: { value: V(o.fog || 0) }, uNear: { value: o.near == null ? 30 : o.near }, uFar: { value: o.far == null ? 200 : o.far }, uTime: uTime, uOp: { value: o.op == null ? 1 : o.op }, uFlash: { value: new T.Vector3() } };
    var m = new T.Mesh(new T.PlaneGeometry(w, d), new T.ShaderMaterial({ uniforms: u, vertexShader: WVS, fragmentShader: WFS, transparent: (o.op || 1) < 1 })); m.rotation.x = -PI / 2; m.position.set(x || 0, y || 0, z || 0); m.userData.u = u; g.add(m); return m; };
  var dot = null;
  function dotTex() { if (dot) return dot; dot = K.paint(64, 64, function (c) { var gr = c.createRadialGradient(32, 32, 0, 32, 32, 32); gr.addColorStop(0, 'rgba(255,255,255,1)'); gr.addColorStop(0.35, 'rgba(255,255,255,.55)'); gr.addColorStop(1, 'rgba(255,255,255,0)'); c.fillStyle = gr; c.fillRect(0, 0, 64, 64); }); return dot; }
  /* motes in a box that travels with the rider: o: n, box [x,y,z], col, size, vel [x,y,z], add (additive), op */
  K.motes = function (g, o) { var T = K.T(), n = o.n || 200, bx = o.box || [30, 20, 30], p = new Float32Array(n * 3), ph = new Float32Array(n), r = K.rnd(o.seed || 7);
    for (var i = 0; i < n; i++) { p[i * 3] = (r() - 0.5) * bx[0]; p[i * 3 + 1] = (r() - 0.5) * bx[1]; p[i * 3 + 2] = (r() - 0.5) * bx[2]; ph[i] = r() * 6.28; }
    var geo = new T.BufferGeometry(); geo.setAttribute('position', new T.BufferAttribute(p, 3));
    var pts = new T.Points(geo, new T.PointsMaterial({ color: o.col == null ? 0xffffff : o.col, size: o.size || 0.2, map: dotTex(), transparent: true, opacity: o.op == null ? 0.8 : o.op, depthWrite: false, fog: false, blending: o.add === false ? T.NormalBlending : T.AdditiveBlending, sizeAttenuation: true }));
    pts.frustumCulled = false; g.add(pts); var vel = o.vel || [0, 0.4, 0];
    pts.userData.step = function (dt, cx, cy, cz, t) { pts.position.set(cx, cy, cz); for (var i = 0; i < n; i++) { var a = i * 3; p[a] += (vel[0] + Math.sin(t * 0.8 + ph[i]) * (o.drift || 0.15)) * dt; p[a + 1] += vel[1] * dt; p[a + 2] += (vel[2] + Math.cos(t * 0.7 + ph[i]) * (o.drift || 0.15)) * dt; for (var k = 0; k < 3; k++) { var hlf = bx[k] / 2; if (p[a + k] > hlf) p[a + k] -= bx[k]; else if (p[a + k] < -hlf) p[a + k] += bx[k]; } } geo.attributes.position.needsUpdate = true; };
    return pts; };
  K.halo = function (g, col, size, x, y, z, op) { var T = K.T(), s = new T.Sprite(new T.SpriteMaterial({ map: dotTex(), color: col, transparent: true, opacity: op == null ? 0.8 : op, depthWrite: false, fog: false, blending: T.AdditiveBlending })); s.scale.set(size, size, 1); s.position.set(x || 0, y || 0, z || 0); g.add(s); return s; };
  /* a shaft of light: an open cone, additive */
  K.shaft = function (g, col, r0, r1, len, x, y, z, op) { var T = K.T(), m = new T.Mesh(new T.CylinderGeometry(r0, r1, len, 18, 1, true), new T.MeshBasicMaterial({ color: col, transparent: true, opacity: op == null ? 0.12 : op, depthWrite: false, fog: false, side: T.DoubleSide, blending: T.AdditiveBlending })); m.position.set(x || 0, y || 0, z || 0); g.add(m); return m; };
  /* rails and sleepers along a curve, into a builder */
  K.rails = function (b, curve, o) { o = o || {}; var T = K.T(), n = Math.round(curve.getLength() / (o.step || 1.1)), ga = (o.gauge || 1.5) / 2, up = new T.Vector3(0, 1, 0), s = new T.Vector3(), dy = o.dy == null ? -0.05 : o.dy;
    for (var i = 0; i < n; i++) { var u = i / n, p = curve.getPointAt(u), t = curve.getTangentAt(u); s.crossVectors(t, up).normalize(); var ry = Math.atan2(t.x, t.z), rx = -Math.asin(Math.max(-1, Math.min(1, t.y)));
      b.box(o.tie || 0x3b2a1c, ga * 2 + 0.5, 0.12, 0.26, p.x, p.y + dy, p.z, rx, ry, 0);
      [-1, 1].forEach(function (sd) { b.box(o.rail || 0x8a8f98, 0.09, 0.12, (o.step || 1.1) * 1.12, p.x + s.x * ga * sd, p.y + dy + 0.12, p.z + s.z * ga * sd, rx, ry, 0); }); }
    return b; };

  /* ------------------------------------------------------------------ the score */
  var NOTE = { c: 0, d: 2, e: 4, f: 5, g: 7, a: 9, b: 11 };
  function midi(tok) { var m = /^([a-g])(#|b)?(-?\d)$/.exec(tok); if (!m) return null; return 12 * (parseInt(m[3], 10) + 1) + NOTE[m[1]] + (m[2] === '#' ? 1 : m[2] === 'b' ? -1 : 0); }
  function hz(m) { return 440 * Math.pow(2, (m - 69) / 12); }
  var bus = null;
  function getBus() { var a = K.ac(); if (!a) return null; if (bus && bus.a === a) return bus;
    var out = a.createGain(), an = a.createAnalyser(); an.fftSize = 1024; out.connect(an); an.connect(a.destination);
    var cv = a.createConvolver(), len = Math.floor(a.sampleRate * 2.4), ir = a.createBuffer(2, len, a.sampleRate); for (var ch = 0; ch < 2; ch++) { var d = ir.getChannelData(ch); for (var i = 0; i < len; i++) d[i] = (Math.random() * 2 - 1) * Math.pow(1 - i / len, 2.6); }
    cv.buffer = ir; var wet = a.createGain(); wet.gain.value = 0.32; cv.connect(wet); wet.connect(out);
    var dry = a.createGain(); dry.connect(out); dry.connect(cv);
    bus = { a: a, inp: dry, an: an, buf: new Float32Array(1024) }; return bus; }
  /* how loud the show's sound is right now (for checking) */
  K.level = function () { if (!bus) return 0; bus.an.getFloatTimeDomainData(bus.buf); var s = 0; for (var i = 0; i < bus.buf.length; i++) s += bus.buf[i] * bus.buf[i]; return Math.sqrt(s / bus.buf.length); };
  function note(a, dest, f, t, dur, vol, o) { o = o || {}; var osc = a.createOscillator(), g = a.createGain(); osc.type = o.wave || 'triangle'; osc.frequency.setValueAtTime(f, t); if (o.det) osc.detune.value = o.det;
    var at = o.a || 0.01, rl = o.r || 0.08; g.gain.setValueAtTime(0.0001, t); g.gain.linearRampToValueAtTime(vol, t + at); if (o.pluck) g.gain.exponentialRampToValueAtTime(0.0001, t + Math.max(at + 0.02, o.pluck)); else { g.gain.setValueAtTime(vol, Math.max(t + at + 0.001, t + dur - 0.02)); g.gain.linearRampToValueAtTime(0.0001, t + dur + rl); }
    if (o.vib) { var l = a.createOscillator(), lg = a.createGain(); l.frequency.value = 5.2; lg.gain.value = f * o.vib; l.connect(lg); lg.connect(osc.frequency); l.start(t); l.stop(t + dur + rl + 0.1); }
    var outN = g; if (o.lp) { var fl = a.createBiquadFilter(); fl.type = 'lowpass'; fl.frequency.value = o.lp; g.connect(fl); outN = fl; } osc.connect(g); outN.connect(dest); osc.start(t); osc.stop(t + (o.pluck || dur) + rl + 0.1); }
  function hit(a, dest, kind, t, vol) { if (kind === 'k') { note(a, dest, 55, t, 0, vol * 1.6, { wave: 'sine', pluck: 0.28 }); return; } if (kind === 't') { note(a, dest, 98, t, 0, vol * 1.2, { wave: 'sine', pluck: 0.4 }); return; }
    K.noise(0.01, 500, 500, 0.0001); var s = a.createBufferSource(), g = a.createGain(), f = a.createBiquadFilter(); s.buffer = K._nb; f.type = kind === 'h' ? 'highpass' : 'bandpass'; f.frequency.value = kind === 'h' ? 7000 : 1800; var d = kind === 'h' ? 0.05 : 0.16; g.gain.setValueAtTime(vol * (kind === 'h' ? 0.5 : 1), t); g.gain.exponentialRampToValueAtTime(0.0001, t + d); s.connect(f); f.connect(g); g.connect(dest); s.start(t, Math.random()); s.stop(t + d + 0.05); }
  var CH = { '': [0, 4, 7], m: [0, 3, 7], '7': [0, 4, 7, 10], m7: [0, 3, 7, 10], dim: [0, 3, 6], sus: [0, 5, 7], '5': [0, 7, 12] };
  /* def: { bpm, step (steps per beat, 2), vol, lead:{wave,vol,lp,vib,pluck}, bass:{…}, pad:{…}, sections: { name: { lead:'e4 - g4 . …', bass:'…', pad:'Am - - - F …', perc:'k . h . s . h .' } } }
   * a token is one step: a note, '-' (hold the last note on), '.' (rest); pad tokens are chords (C, Am, G7, Dsus …) held until the next. */
  K.score = function (def) {
    var a = K.ac(), B = getBus(); if (!a || !B) return { set: function () {}, stop: function () {}, vol: function () {} };
    var master = a.createGain(); master.gain.value = 0; master.connect(B.inp); master.gain.setTargetAtTime(def.vol == null ? 0.5 : def.vol, a.currentTime, 0.6);
    var stepDur = 60 / def.bpm / (def.step || 2), cur = null, next = null, pos = 0, tNext = a.currentTime + 0.12, alive = true, parsed = {};
    function parse(name) { if (parsed[name]) return parsed[name]; var s = def.sections[name], o = { len: 0 };
      ['lead', 'lead2', 'bass'].forEach(function (k) { if (!s[k]) return; var toks = s[k].replace(/\|/g, ' ').trim().split(/\s+/), ev = []; toks.forEach(function (tk, i) { if (tk === '-') { if (ev.length) ev[ev.length - 1].n++; } else if (tk !== '.') { var m = midi(tk); if (m != null) ev.push({ i: i, m: m, n: 1 }); } }); o[k] = ev; o.len = Math.max(o.len, toks.length); });
      if (s.pad) { var tp = s.pad.replace(/\|/g, ' ').trim().split(/\s+/), pv = []; tp.forEach(function (tk, i) { if (tk === '-') { if (pv.length) pv[pv.length - 1].n++; } else if (tk !== '.') { var m = /^([A-G])(#|b)?(.*)$/.exec(tk); if (m) pv.push({ i: i, root: 48 + NOTE[m[1].toLowerCase()] + (m[2] === '#' ? 1 : m[2] === 'b' ? -1 : 0), ch: CH[m[3]] || CH[''], n: 1 }); } }); o.pad = pv; o.len = Math.max(o.len, tp.length); }
      if (s.perc) { o.perc = s.perc.replace(/\|/g, ' ').trim().split(/\s+/); }
      parsed[name] = o; return o; }
    function sched() { if (!alive) return; var now = a.currentTime; if (tNext < now) tNext = now + 0.05;
      while (tNext < now + 0.7) { if (!cur || (next && pos === 0)) { if (next) { cur = parse(next); next = null; pos = 0; } } if (!cur) { tNext += stepDur; continue; }
        var t = tNext, L = def.lead || {}, L2 = def.lead2 || L, Bs = def.bass || {}, Pd = def.pad || {};
        (cur.lead || []).forEach(function (e) { if (e.i === pos) note(a, master, hz(e.m), t, e.n * stepDur * 0.95, L.vol || 0.12, L); });
        (cur.lead2 || []).forEach(function (e) { if (e.i === pos) note(a, master, hz(e.m), t, e.n * stepDur * 0.95, L2.vol || 0.08, L2); });
        (cur.bass || []).forEach(function (e) { if (e.i === pos) note(a, master, hz(e.m), t, e.n * stepDur * 0.9, Bs.vol || 0.16, Object.assign({ wave: 'triangle', lp: 500 }, Bs)); });
        (cur.pad || []).forEach(function (e) { if (e.i === pos) e.ch.forEach(function (iv, k) { note(a, master, hz(e.root + iv), t, e.n * stepDur, (Pd.vol || 0.05), Object.assign({ wave: 'sawtooth', lp: 900, a: 0.35, r: 0.5, det: (k - 1) * 7 }, Pd)); }); });
        if (cur.perc) { var pk = cur.perc[pos % cur.perc.length]; if (pk && pk !== '.') hit(a, master, pk, t, (def.percVol || 0.12)); }
        pos = (pos + 1) % cur.len; tNext += stepDur; } }
    var iv = setInterval(sched, 90);
    return { set: function (name) { if (def.sections[name]) { next = name; if (!cur) pos = 0; } }, cut: function (name) { if (def.sections[name]) { next = name; pos = 0; } },
      vol: function (v, tc) { master.gain.setTargetAtTime(v, a.currentTime, tc || 0.4); },
      stop: function () { alive = false; clearInterval(iv); master.gain.setTargetAtTime(0, a.currentTime, 0.25); setTimeout(function () { try { master.disconnect(); } catch (e) {} }, 2500); } };
  };
  /* one-off sounds through the same reverb */
  K.fx = function (f, d, wave, vol, f2, delay, o) { var a = K.ac(), B = getBus(); if (!a || !B) return; var t = a.currentTime + (delay || 0), osc = a.createOscillator(), g = a.createGain(); osc.type = wave || 'sine'; osc.frequency.setValueAtTime(f, t); if (f2) osc.frequency.exponentialRampToValueAtTime(f2, t + d); g.gain.setValueAtTime(0.0001, t); g.gain.exponentialRampToValueAtTime(vol || 0.1, t + Math.min(0.04, d / 3)); g.gain.exponentialRampToValueAtTime(0.0001, t + d); var outN = g; if (o && o.lp) { var fl = a.createBiquadFilter(); fl.type = 'lowpass'; fl.frequency.value = o.lp; g.connect(fl); outN = fl; } osc.connect(g); outN.connect(B.inp); osc.start(t); osc.stop(t + d + 0.05); };
  K.rush = function (d, f0, f1, vol, q, delay) { var a = K.ac(), B = getBus(); if (!a || !B) return; K.noise(0.01, 500, 500, 0.0001); var t = a.currentTime + (delay || 0), s = a.createBufferSource(); s.buffer = K._nb; s.loop = true; var bp = a.createBiquadFilter(); bp.type = 'bandpass'; bp.Q.value = q || 0.8; bp.frequency.setValueAtTime(f0, t); bp.frequency.exponentialRampToValueAtTime(f1, t + d); var g = a.createGain(); g.gain.setValueAtTime(0.0001, t); g.gain.exponentialRampToValueAtTime(vol || 0.15, t + Math.min(0.3, d / 4)); g.gain.exponentialRampToValueAtTime(0.0001, t + d); s.connect(bp); bp.connect(g); g.connect(B.inp); s.start(t); s.stop(t + d + 0.05); };
  K.thud = function (v, delay) { K.fx(95, 1.1, 'sine', (v || 1) * 0.5, 28, delay); K.rush(1.0, 700, 60, (v || 1) * 0.35, 0.5, delay); };

  /* ------------------------------------------------------------------ two languages */
  var pend = [], waiting = false;
  function flush() { waiting = false; if (root.TPI18N && root.TPI18N.add) { root.TPI18N.add(pend); pend = []; } else if (pend.length) { waiting = true; setTimeout(flush, 400); } }
  K.tr = function (zh, en) { if (en) { pend.push([zh, en]); if (!waiting) flush(); } return zh; };
  /* a spoken line with a caption: who and text each in Chinese and English */
  K.line = function (icon, who, zh, en) { var w = who ? K.tr(who[0], who[1]) : ''; K.tr(zh, en); K.say(icon, w, zh); };
})(window);

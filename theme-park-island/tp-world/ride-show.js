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
    ' float sh=max(-vG,0.0); if(sh>0.0){ vec3 hk=normalize(normalize(vec3(0.3,0.8,0.5))+v); vec3 hs=normalize(v-uSpotD); float gl=fract(sin(dot(floor(vW*7.0),vec3(12.9898,78.233,37.719)))*43758.5453+uTime*0.35);' +
    '  c+=sh*vec3(1.0,0.9,0.62)*(pow(max(dot(n,hk),0.0),22.0)*0.9+pow(max(dot(n,hs),0.0),18.0)*cone*length(uSpotC)*1.2+smoothstep(0.965,1.0,gl)*0.9+rim*0.25); }' +
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
      rock: function (c, r, x, y, z, seed, sx, sy, sz, detail, rough) { var even = !sx || (sx === sy && sy === sz); return b.add(K.rockGeo(r, seed || 1, detail, rough), c, x, y, z, even ? (seed || 1) * 1.3 : 0, (seed || 1) * 2.1, 0, sx, sy, sz); },
      pt: function (x, y, z) { v.set(x, y, z).applyMatrix4(stack[stack.length - 1]); return [v.x, v.y, v.z]; },
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
  var FVS = 'uniform float uThrow; uniform float uSpread; varying vec2 vU; varying float vD; void main(){ vU=uv; float k=1.0-uv.y; vec3 p=position; p.x*=1.0+k*uSpread; p.z+=uThrow*sqrt(k)*(1.0-k*0.35); vec4 mv=modelViewMatrix*vec4(p,1.0); vD=-mv.z; gl_Position=projectionMatrix*mv; }';
  var FFS = 'uniform float uTime; uniform vec3 uCol; uniform vec3 uFog; uniform float uNear; uniform float uFar; uniform float uSeed; varying vec2 vU; varying float vD;' +
    'float h(vec2 p){ return fract(sin(dot(p,vec2(127.1,311.7)))*43758.5453); } float n(vec2 p){ vec2 i=floor(p),f=fract(p); f=f*f*(3.0-2.0*f); return mix(mix(h(i),h(i+vec2(1.0,0.0)),f.x),mix(h(i+vec2(0.0,1.0)),h(i+vec2(1.0,1.0)),f.x),f.y); }' +
    'void main(){ float k=1.0-vU.y; float t=uTime*(0.55+k*0.5); float st=n(vec2(vU.x*26.0+uSeed,vU.y*3.0+t*2.2))*0.6+n(vec2(vU.x*9.0+uSeed*2.0,vU.y*1.4+t*1.3))*0.5+n(vec2(vU.x*60.0,vU.y*9.0+t*4.0))*0.25;' +
    ' float edge=pow(sin(vU.x*3.14159),0.7); float body=smoothstep(0.42+k*0.32,1.05,st); float mistA=smoothstep(0.55,1.0,k)*n(vec2(vU.x*4.0+uSeed,vU.y*2.0+t))*0.55; float a=edge*(body*(1.0-k*0.45)+mistA)*smoothstep(0.0,0.03,k);' +
    ' vec3 c=mix(uCol,vec3(1.0),body*0.7); float f=smoothstep(uNear,uFar,vD); gl_FragColor=vec4(mix(c,uFog,f*0.8),a*(1.0-f*0.5)); }';
  /* o: w (width at the lip), h (the drop), throw (how far out it leaps), spread, col. Returns a group; fogTo(look) keeps its haze with the scene's */
  K.fall = function (g, o, x, y, z, ry) { var T = K.T(), grp = new T.Group(), V = function (hx) { var c = rgb(hx); return new T.Vector3(c[0], c[1], c[2]); }; grp.position.set(x || 0, y || 0, z || 0); grp.rotation.y = ry || 0; g.add(grp);
    var u = { uTime: uTime, uCol: { value: V(o.col == null ? 0xcfeeff : o.col) }, uFog: { value: V(o.fog || 0xffffff) }, uNear: { value: o.near == null ? 200 : o.near }, uFar: { value: o.far == null ? 1600 : o.far }, uThrow: { value: o.throw == null ? 6 : o.throw }, uSpread: { value: o.spread == null ? 0.9 : o.spread }, uSeed: { value: (o.seed || 1) * 3.7 } };
    var mat = new T.ShaderMaterial({ uniforms: u, vertexShader: FVS, fragmentShader: FFS, transparent: true, depthWrite: false, side: T.DoubleSide });
    [0, 0.5, -0.5].forEach(function (a, n) { var geo = new T.PlaneGeometry(o.w * (n ? 0.8 : 1), o.h, 6, 24); geo.translate(0, -o.h / 2, 0); var m = new T.Mesh(geo, mat); m.rotation.y = a; m.frustumCulled = false; m.renderOrder = 4; grp.add(m); });
    grp.userData.u = u; return grp; };
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
  /* An orchestra made in the browser: every instrument is built from partials, filters and envelopes so that it
   * sounds like something played (a celesta, a harp, a flute, strings, a horn, an accordion, a pipe organ, a plucked
   * bass, timpani, a tambourine) rather than a bare oscillator. Everything goes through a compressor and a hall. */
  var NOTE = { c: 0, d: 2, e: 4, f: 5, g: 7, a: 9, b: 11 };
  function midi(tok) { var m = /^([a-g])(#|b)?(-?\d)$/.exec(tok); if (!m) return null; return 12 * (parseInt(m[3], 10) + 1) + NOTE[m[1]] + (m[2] === '#' ? 1 : m[2] === 'b' ? -1 : 0); }
  function hz(m) { return 440 * Math.pow(2, (m - 69) / 12); }
  var bus = null;
  function getBus() { var a = K.ac(); if (!a) return null; if (bus && bus.a === a) return bus;
    var out = a.createGain(), an = a.createAnalyser(); an.fftSize = 1024; out.gain.value = 0.9; out.connect(an); an.connect(a.destination);
    var comp = a.createDynamicsCompressor(); comp.threshold.value = -20; comp.knee.value = 18; comp.ratio.value = 3.5; comp.attack.value = 0.01; comp.release.value = 0.25;
    var tone = a.createBiquadFilter(); tone.type = 'lowpass'; tone.frequency.value = 9000; comp.connect(tone);
    var cv = a.createConvolver(), len = Math.floor(a.sampleRate * 2.8), ir = a.createBuffer(2, len, a.sampleRate); for (var ch = 0; ch < 2; ch++) { var d = ir.getChannelData(ch), lp = 0; for (var i = 0; i < len; i++) { var k = i / len, n = (Math.random() * 2 - 1) * Math.pow(1 - k, 2.4) * (i < 600 ? i / 600 : 1); lp += (n - lp) * (0.75 - k * 0.5); d[i] = lp; } }
    cv.buffer = ir; var wet = a.createGain(); wet.gain.value = 0.42; tone.connect(cv); cv.connect(wet); wet.connect(out); tone.connect(out);
    var nb = a.createBuffer(1, a.sampleRate * 2, a.sampleRate), nd = nb.getChannelData(0); for (var q = 0; q < nd.length; q++) nd[q] = Math.random() * 2 - 1;
    bus = { a: a, inp: comp, an: an, buf: new Float32Array(1024), noise: nb }; return bus; }
  /* how loud the show's sound is right now (for checking) */
  K.level = function () { if (!bus) return 0; bus.an.getFloatTimeDomainData(bus.buf); var s = 0; for (var i = 0; i < bus.buf.length; i++) s += bus.buf[i] * bus.buf[i]; return Math.sqrt(s / bus.buf.length); };
  function vibrato(a, param, f, t, dur, depth, delay) { var l = a.createOscillator(), g = a.createGain(); l.frequency.value = 5.2 + Math.random() * 0.5; g.gain.setValueAtTime(0, t); g.gain.linearRampToValueAtTime(f * depth, t + (delay || 0.18) + 0.2); l.connect(g); g.connect(param); l.start(t); l.stop(t + dur + 0.6); }
  /* struck or plucked: partials that each die away */
  function struck(parts, at) { return function (a, dest, f, t, dur, vol) { var g = a.createGain(); g.gain.value = vol; g.connect(dest); var end = 0;
      parts.forEach(function (p) { var fr = f * p[0]; if (fr > 9000) return; var o = a.createOscillator(), e = a.createGain(), dec = p[2] * (f < 200 ? 1.3 : f > 900 ? 0.7 : 1); o.type = 'sine'; o.frequency.value = fr; e.gain.setValueAtTime(0.0001, t); e.gain.linearRampToValueAtTime(p[1], t + (at || 0.004)); e.gain.exponentialRampToValueAtTime(0.0001, t + dec); o.connect(e); e.connect(g); o.start(t); o.stop(t + dec + 0.05); end = Math.max(end, dec); }); }; }
  /* bowed or blown: a rich source through a filter, with an envelope and vibrato */
  function bowed(o2) { return function (a, dest, f, t, dur, vol) { var g = a.createGain(), fl = a.createBiquadFilter(), at = o2.a, rl = o2.r, end = t + Math.max(dur, at + 0.02); fl.type = 'lowpass'; fl.Q.value = o2.q || 0.6;
      var cut = Math.min(o2.max || 4200, (o2.base || 500) + f * (o2.k || 2.4)); if (o2.sweep) { fl.frequency.setValueAtTime(cut * 0.45, t); fl.frequency.linearRampToValueAtTime(cut * 1.25, t + at + 0.03); fl.frequency.linearRampToValueAtTime(cut, t + at + 0.2); } else fl.frequency.value = cut;
      g.gain.setValueAtTime(0.0001, t); g.gain.linearRampToValueAtTime(vol, t + at); g.gain.setValueAtTime(vol, end); g.gain.linearRampToValueAtTime(0.0001, end + rl); fl.connect(g); g.connect(dest);
      (o2.det || [0]).forEach(function (dc, i) { var o = a.createOscillator(), og = a.createGain(); o.type = o2.wave || 'sawtooth'; o.frequency.value = f * (o2.oct && i === o2.det.length - 1 ? o2.oct : 1); o.detune.value = dc; og.gain.value = 1 / (o2.det || [0]).length; o.connect(og); og.connect(fl); if (o2.vib) vibrato(a, o.frequency, f, t, dur, o2.vib, o2.vd); o.start(t); o.stop(end + rl + 0.05); });
      if (o2.breath && bus) { var n = a.createBufferSource(), nf = a.createBiquadFilter(), ng = a.createGain(); n.buffer = bus.noise; n.loop = true; nf.type = 'bandpass'; nf.frequency.value = Math.min(6000, f * 2.2); nf.Q.value = 1.2; ng.gain.setValueAtTime(0.0001, t); ng.gain.linearRampToValueAtTime(vol * o2.breath, t + at * 0.6); ng.gain.linearRampToValueAtTime(vol * o2.breath * 0.4, t + at + 0.15); ng.gain.linearRampToValueAtTime(0.0001, end + rl); n.connect(nf); nf.connect(ng); ng.connect(dest); n.start(t, Math.random()); n.stop(end + rl + 0.05); } }; }
  /* reeds and pipes: steady partials */
  function piped(parts, at, rl, chorus, trem) { return function (a, dest, f, t, dur, vol) { var g = a.createGain(), end = t + Math.max(dur, at + 0.02); g.gain.setValueAtTime(0.0001, t); g.gain.linearRampToValueAtTime(vol, t + at); g.gain.setValueAtTime(vol, end); g.gain.linearRampToValueAtTime(0.0001, end + rl); g.connect(dest);
      if (trem) { var l = a.createOscillator(), lg = a.createGain(); l.frequency.value = 5.6; lg.gain.value = vol * trem; l.connect(lg); lg.connect(g.gain); l.start(t); l.stop(end + rl + 0.05); }
      parts.forEach(function (p) { var fr = f * p[0]; if (fr > 8000) return; (chorus ? [0, chorus] : [0]).forEach(function (dc) { var o = a.createOscillator(), e = a.createGain(); o.type = 'sine'; o.frequency.value = fr; o.detune.value = dc; e.gain.value = p[1] * (chorus ? 0.6 : 1); o.connect(e); e.connect(g); o.start(t); o.stop(end + rl + 0.05); }); }); }; }
  var INST = {
    celesta: struck([[1, 1, 1.5], [2, 0.38, 1.0], [4, 0.2, 0.55], [6.27, 0.06, 0.25], [8.9, 0.03, 0.12]]),
    musicbox: struck([[1, 1, 1.8], [3, 0.3, 0.7], [5.4, 0.16, 0.4], [9.1, 0.05, 0.2]]),
    harp: struck([[1, 1, 2.0], [2, 0.46, 1.3], [3, 0.22, 0.9], [4, 0.1, 0.55], [5, 0.05, 0.35]], 0.006),
    marimba: struck([[1, 1, 0.55], [4, 0.32, 0.14], [9.2, 0.08, 0.06]]),
    glock: struck([[1, 1, 1.1], [2.76, 0.4, 0.6], [5.4, 0.2, 0.35], [8.9, 0.08, 0.2]]),
    bass: struck([[1, 1, 0.85], [2, 0.42, 0.45], [3, 0.14, 0.25]], 0.008),
    strings: bowed({ det: [-9, 0, 8], a: 0.16, r: 0.34, base: 500, k: 2.4, max: 3400, vib: 0.0035 }),
    cello: bowed({ det: [-6, 5], a: 0.1, r: 0.28, base: 300, k: 2.6, max: 2000, vib: 0.004 }),
    fiddle: bowed({ det: [-4, 4], a: 0.03, r: 0.1, base: 700, k: 3.4, max: 5200, vib: 0.005, vd: 0.08, q: 1.2 }),
    horn: bowed({ det: [0, 3], a: 0.07, r: 0.22, base: 180, k: 1.9, max: 2200, sweep: true, vib: 0.002, q: 0.9 }),
    brass: bowed({ det: [-3, 3], a: 0.04, r: 0.16, base: 300, k: 3.0, max: 3600, sweep: true, q: 1.0 }),
    flute: bowed({ wave: 'sine', det: [0], a: 0.06, r: 0.14, base: 4000, k: 4, max: 9000, vib: 0.004, breath: 0.05 }),
    choir: bowed({ det: [-11, 0, 10], a: 0.28, r: 0.5, base: 500, k: 1.2, max: 1500, vib: 0.003, q: 2.2 }),
    accordion: piped([[1, 1], [2, 0.5], [3, 0.42], [4, 0.2], [5, 0.14], [6, 0.06]], 0.03, 0.09, 9),
    organ: piped([[0.5, 0.45], [1, 1], [2, 0.6], [3, 0.24], [4, 0.36], [6, 0.1], [8, 0.12]], 0.03, 0.18, 0, 0.06)
  };
  function drum(a, dest, kind, t, vol) { var o, g, n, f;
    function noise(type, freq, q, at, dec, v) { n = a.createBufferSource(); f = a.createBiquadFilter(); g = a.createGain(); n.buffer = bus.noise; f.type = type; f.frequency.value = freq; f.Q.value = q; g.gain.setValueAtTime(0.0001, t); g.gain.linearRampToValueAtTime(v, t + at); g.gain.exponentialRampToValueAtTime(0.0001, t + at + dec); n.connect(f); f.connect(g); g.connect(dest); n.start(t, Math.random()); n.stop(t + at + dec + 0.05); }
    function tone(f0, f1, dec, v) { o = a.createOscillator(); g = a.createGain(); o.type = 'sine'; o.frequency.setValueAtTime(f0, t); o.frequency.exponentialRampToValueAtTime(f1, t + Math.min(0.12, dec)); g.gain.setValueAtTime(0.0001, t); g.gain.linearRampToValueAtTime(v, t + 0.004); g.gain.exponentialRampToValueAtTime(0.0001, t + dec); o.connect(g); g.connect(dest); o.start(t); o.stop(t + dec + 0.05); }
    if (kind === 'k') tone(120, 46, 0.32, vol * 1.5);                                   /* a soft bass drum */
    else if (kind === 't') { tone(98, 73, 1.0, vol * 1.3); tone(196, 147, 0.5, vol * 0.3); noise('lowpass', 300, 0.5, 0.004, 0.12, vol * 0.25); }   /* timpani */
    else if (kind === 's') { noise('bandpass', 1900, 0.7, 0.003, 0.15, vol * 0.7); tone(190, 150, 0.08, vol * 0.3); }      /* a brushed snare */
    else if (kind === 'h') noise('highpass', 6500, 0.5, 0.002, 0.04, vol * 0.3);                                   /* a shaker */
    else if (kind === 'b') { noise('bandpass', 8200, 3, 0.002, 0.13, vol * 0.5); noise('highpass', 9500, 0.5, 0.002, 0.05, vol * 0.2); }   /* a tambourine */
    else if (kind === 'w') tone(980, 900, 0.05, vol * 0.5);                                                         /* a woodblock */
    else if (kind === 'c') noise('highpass', 5200, 0.5, 0.5, 1.4, vol * 0.4);                                       /* a cymbal swell */
    else if (kind === 'g') { tone(62, 55, 2.4, vol * 1.4); noise('lowpass', 500, 0.5, 0.01, 0.8, vol * 0.2); } }      /* a deep drum */
  var CH = { '': [0, 4, 7], m: [0, 3, 7], '7': [0, 4, 7, 10], m7: [0, 3, 7, 10], dim: [0, 3, 6], sus: [0, 5, 7], '5': [0, 7, 12] };
  /* def: { bpm, step (steps per beat: 2 = quavers, 3 = a jig, 4 = semiquavers), vol, inst: { lead, lead2, bass, pad }, mix: { lead, lead2, bass, pad, perc },
   *        sections: { name: { inst: {…overrides}, lead: 'e4 - g4 . …', lead2, bass, pad: 'Am - - - F …', perc: 'k . h . s . h .' } } }
   * a token is one step: a note, '-' (hold the last note on), '.' (rest); '|' is only for the eye. Pad tokens are chords (C, Am, G7, Ddim …). */
  K.score = function (def) {
    var a = K.ac(), B = getBus(); if (!a || !B) return { set: function () {}, cut: function () {}, stop: function () {}, vol: function () {} };
    var master = a.createGain(); master.gain.value = 0; master.connect(B.inp); master.gain.setTargetAtTime(def.vol == null ? 0.7 : def.vol, a.currentTime, 0.8);
    var stepDur = 60 / def.bpm / (def.step || 2), cur = null, next = null, pos = 0, tNext = a.currentTime + 0.15, alive = true, parsed = {}, MIX = Object.assign({ lead: 0.3, lead2: 0.2, bass: 0.34, pad: 0.07, perc: 0.3 }, def.mix || {}), DI = Object.assign({ lead: 'celesta', lead2: 'strings', bass: 'bass', pad: 'strings' }, def.inst || {});
    function parse(name) { if (parsed[name]) return parsed[name]; var s = def.sections[name], o = { len: 0, inst: Object.assign({}, DI, s.inst || {}), mix: Object.assign({}, MIX, s.mix || {}) };
      ['lead', 'lead2', 'bass'].forEach(function (k) { if (!s[k]) return; var toks = s[k].replace(/\|/g, ' ').trim().split(/\s+/), ev = []; toks.forEach(function (tk, i) { if (tk === '-') { if (ev.length) ev[ev.length - 1].n++; } else if (tk !== '.') { var m = midi(tk); if (m != null) ev.push({ i: i, m: m, n: 1 }); } }); o[k] = ev; o.len = Math.max(o.len, toks.length); });
      if (s.pad) { var tp = s.pad.replace(/\|/g, ' ').trim().split(/\s+/), pv = []; tp.forEach(function (tk, i) { if (tk === '-') { if (pv.length) pv[pv.length - 1].n++; } else if (tk !== '.') { var m = /^([A-G])(#|b)?(.*)$/.exec(tk); if (m) pv.push({ i: i, root: 48 + NOTE[m[1].toLowerCase()] + (m[2] === '#' ? 1 : m[2] === 'b' ? -1 : 0), ch: CH[m[3]] || CH[''], n: 1 }); } }); o.pad = pv; o.len = Math.max(o.len, tp.length); }
      if (s.perc) o.perc = s.perc.replace(/\|/g, ' ').trim().split(/\s+/);
      parsed[name] = o; return o; }
    function play(track, m, t, dur, accent) { var fn = INST[cur.inst[track]] || INST.celesta; fn(a, master, hz(m), t + (Math.random() - 0.5) * 0.012, dur, cur.mix[track] * (0.86 + Math.random() * 0.2) * accent); }
    function sched() { if (!alive) return; var now = a.currentTime; if (tNext < now) tNext = now + 0.05;
      while (tNext < now + 0.7) { if (next && (!cur || pos === 0)) { cur = parse(next); next = null; pos = 0; } if (!cur) { tNext += stepDur; continue; }
        var t = tNext, beat = (def.step || 2), acc = pos % (beat * 2) === 0 ? 1.15 : pos % beat === 0 ? 1.04 : 0.92;
        (cur.lead || []).forEach(function (e) { if (e.i === pos) play('lead', e.m, t, e.n * stepDur * 0.96, acc); });
        (cur.lead2 || []).forEach(function (e) { if (e.i === pos) play('lead2', e.m, t, e.n * stepDur * 0.98, acc); });
        (cur.bass || []).forEach(function (e) { if (e.i === pos) play('bass', e.m, t, e.n * stepDur * 0.9, acc); });
        (cur.pad || []).forEach(function (e) { if (e.i === pos) e.ch.forEach(function (iv, k) { (INST[cur.inst.pad] || INST.strings)(a, master, hz(e.root + iv + (k === 0 ? 0 : 0)), t + k * 0.012, e.n * stepDur, cur.mix.pad); }); });
        if (cur.perc) { var pk = cur.perc[pos % cur.perc.length]; if (pk && pk !== '.') drum(a, master, pk, t + (Math.random() - 0.5) * 0.008, cur.mix.perc * (0.85 + Math.random() * 0.25) * acc); }
        pos = (pos + 1) % cur.len; tNext += stepDur; } }
    var iv = setInterval(sched, 90);
    return { set: function (name) { if (def.sections[name]) next = name; }, cut: function (name) { if (def.sections[name]) { next = name; pos = 0; } },
      vol: function (v, tc) { master.gain.setTargetAtTime(v, a.currentTime, tc || 0.4); },
      stop: function () { alive = false; clearInterval(iv); master.gain.setTargetAtTime(0, a.currentTime, 0.3); setTimeout(function () { try { master.disconnect(); } catch (e) {} }, 3500); } };
  };
  /* one note of an instrument, now (a chime, a sting) */
  K.play = function (inst, note, dur, vol, delay) { var a = K.ac(), B = getBus(); if (!a || !B) return; var m = typeof note === 'number' ? note : midi(note); if (m == null) return; (INST[inst] || INST.celesta)(a, B.inp, hz(m), a.currentTime + (delay || 0) + 0.02, dur || 0.5, vol == null ? 0.2 : vol); };
  /* a soft bed of air that goes on until stopped: filtered noise that breathes, and (optionally) a low note under it */
  K.air = function (o) { o = o || {}; var a = K.ac(), B = getBus(); if (!a || !B) return { stop: function () {}, set: function () {} };
    var n = a.createBufferSource(), f = a.createBiquadFilter(), g = a.createGain(); n.buffer = B.noise; n.loop = true; f.type = 'bandpass'; f.frequency.value = o.freq || 400; f.Q.value = o.q || 0.5; g.gain.value = 0; g.gain.setTargetAtTime(o.vol == null ? 0.05 : o.vol, a.currentTime, 1.2); n.connect(f); f.connect(g); g.connect(B.inp); n.start();
    var l = a.createOscillator(), lg = a.createGain(); l.frequency.value = o.rate || 0.13; lg.gain.value = (o.freq || 400) * 0.35; l.connect(lg); lg.connect(f.frequency); l.start();
    var d = null, dg = null; if (o.drone) { d = a.createOscillator(); dg = a.createGain(); d.type = 'sine'; d.frequency.value = o.drone; dg.gain.value = 0; dg.gain.setTargetAtTime(o.droneVol == null ? 0.05 : o.droneVol, a.currentTime, 1.5); d.connect(dg); dg.connect(B.inp); d.start(); }
    return { set: function (v, freq, dv) { g.gain.setTargetAtTime(v, a.currentTime, 0.5); if (freq) f.frequency.setTargetAtTime(freq, a.currentTime, 0.5); if (dg && dv != null) dg.gain.setTargetAtTime(dv, a.currentTime, 0.5); },
      stop: function () { g.gain.setTargetAtTime(0, a.currentTime, 0.4); if (dg) dg.gain.setTargetAtTime(0, a.currentTime, 0.4); setTimeout(function () { try { n.stop(); l.stop(); if (d) d.stop(); } catch (e) {} }, 2500); } }; };
  /* one-off sounds through the same hall */
  K.fx = function (f, d, wave, vol, f2, delay, o) { var a = K.ac(), B = getBus(); if (!a || !B) return; var t = a.currentTime + (delay || 0), osc = a.createOscillator(), g = a.createGain(), fl = a.createBiquadFilter(); osc.type = wave || 'sine'; osc.frequency.setValueAtTime(f, t); if (f2) osc.frequency.exponentialRampToValueAtTime(f2, t + d); g.gain.setValueAtTime(0.0001, t); g.gain.exponentialRampToValueAtTime(vol || 0.1, t + Math.min(0.06, d / 3)); g.gain.exponentialRampToValueAtTime(0.0001, t + d); fl.type = 'lowpass'; fl.frequency.value = (o && o.lp) || (wave && wave !== 'sine' ? Math.max(600, f * 6) : 12000); osc.connect(fl); fl.connect(g); g.connect(B.inp); osc.start(t); osc.stop(t + d + 0.05); };
  K.rush = function (d, f0, f1, vol, q, delay) { var a = K.ac(), B = getBus(); if (!a || !B) return; var t = a.currentTime + (delay || 0), s = a.createBufferSource(); s.buffer = B.noise; s.loop = true; var bp = a.createBiquadFilter(); bp.type = 'bandpass'; bp.Q.value = q || 0.8; bp.frequency.setValueAtTime(f0, t); bp.frequency.exponentialRampToValueAtTime(f1, t + d); var g = a.createGain(); g.gain.setValueAtTime(0.0001, t); g.gain.exponentialRampToValueAtTime(vol || 0.15, t + Math.min(0.3, d / 4)); g.gain.exponentialRampToValueAtTime(0.0001, t + d); s.connect(bp); bp.connect(g); g.connect(B.inp); s.start(t); s.stop(t + d + 0.05); };
  K.thud = function (v, delay) { K.fx(95, 1.1, 'sine', (v || 1) * 0.5, 28, delay); K.rush(1.0, 700, 60, (v || 1) * 0.3, 0.5, delay); };
  /* a creature's roar: a growl of noise through moving formants over a low rasp */
  K.roar = function (d, vol, pitch) { var a = K.ac(), B = getBus(); if (!a || !B) return; var t = a.currentTime, p = pitch || 1, g = a.createGain(); g.gain.setValueAtTime(0.0001, t); g.gain.exponentialRampToValueAtTime(vol || 0.4, t + d * 0.18); g.gain.setValueAtTime(vol || 0.4, t + d * 0.6); g.gain.exponentialRampToValueAtTime(0.0001, t + d); g.connect(B.inp);
    [[420, 4], [900, 5], [1500, 6]].forEach(function (fm, i) { var n = a.createBufferSource(), f = a.createBiquadFilter(), ng = a.createGain(); n.buffer = B.noise; n.loop = true; f.type = 'bandpass'; f.Q.value = fm[1]; f.frequency.setValueAtTime(fm[0] * p * 0.7, t); f.frequency.linearRampToValueAtTime(fm[0] * p * 1.2, t + d * 0.3); f.frequency.linearRampToValueAtTime(fm[0] * p * 0.6, t + d); ng.gain.value = 1.4 - i * 0.4; n.connect(f); f.connect(ng); ng.connect(g); n.start(t, Math.random()); n.stop(t + d + 0.05); });
    var o = a.createOscillator(), og = a.createGain(), of = a.createBiquadFilter(), am = a.createOscillator(), amg = a.createGain(); o.type = 'sawtooth'; o.frequency.setValueAtTime(70 * p, t); o.frequency.linearRampToValueAtTime(95 * p, t + d * 0.3); o.frequency.linearRampToValueAtTime(52 * p, t + d); of.type = 'lowpass'; of.frequency.value = 420; og.gain.value = 0.5; am.frequency.value = 31; amg.gain.value = 0.4; am.connect(amg); amg.connect(og.gain); o.connect(of); of.connect(og); og.connect(g); o.start(t); am.start(t); o.stop(t + d + 0.05); am.stop(t + d + 0.05); };
  /* the storyteller's voice: the best voice the device has for the language, at a calm pace; each character a pitch of their own */
  var VOICE = {};
  function bestVoice(lang) { if (VOICE[lang] !== undefined) return VOICE[lang]; var vs = []; try { vs = root.speechSynthesis.getVoices() || []; } catch (e) {} if (!vs.length) return null; var pre = lang === 'en' ? /^en/i : /^zh|cmn/i, list = vs.filter(function (v) { return pre.test(v.lang); });
    var score = function (v) { var n = v.name + ' ' + v.lang, s2 = 0; if (/premium|enhanced|natural|neural|siri/i.test(n)) s2 += 6; if (lang === 'en' ? /en[-_](US|GB)/i.test(v.lang) : /zh[-_](CN|Hans)|cmn/i.test(v.lang)) s2 += 3; if (/Tingting|Ting-Ting|婷婷|Lili|Yu-shu|Xiaoxiao|晓晓|Samantha|Daniel|Karen|Ava|Google/i.test(n)) s2 += 2; if (/compact|eloquence|Albert|Bad News|Bahh|Bells|Boing|Bubbles|Cellos|Wobble|Zarvox|Trinoids|Whisper|Organ|Jester|Junior|Ralph|Fred|Superstar|Good News|Deranged|Hysterical/i.test(n)) s2 -= 9; if (v.localService) s2 += 1; return s2; };
    list.sort(function (x, y) { return score(y) - score(x); }); VOICE[lang] = list[0] || null; return VOICE[lang]; }
  try { if (root.speechSynthesis) root.speechSynthesis.onvoiceschanged = function () { VOICE = {}; }; } catch (e) {}
  K.say = function (icon, who, text, o) { try { root.TPParkAPI.toast(icon + ' ' + (who ? who + '：' : '') + text); var ss = root.speechSynthesis; if (!ss || !root.SpeechSynthesisUtterance) return; ss.cancel(); var en = root.TPI18N && root.TPI18N.lang() === 'en', line = en ? root.TPI18N.t(text) : text, isEn = en && !/[\u4e00-\u9fff]/.test(line), u = new root.SpeechSynthesisUtterance(isEn ? line : text), v = bestVoice(isEn ? 'en' : 'zh');
      u.lang = isEn ? 'en-US' : 'zh-CN'; if (v) { u.voice = v; u.lang = v.lang; } u.rate = (o && o.rate) || 0.95; u.pitch = (o && o.pitch) || 1; u.volume = 1; ss.speak(u); } catch (e) {} };

  /* ------------------------------------------------------------------ two languages */
  var pend = [], waiting = false;
  function flush() { waiting = false; if (root.TPI18N && root.TPI18N.add) { root.TPI18N.add(pend); pend = []; } else if (pend.length) { waiting = true; setTimeout(flush, 400); } }
  K.tr = function (zh, en) { if (en) { pend.push([zh, en]); if (!waiting) flush(); } return zh; };
  /* a spoken line with a caption: who and text each in Chinese and English */
  K.line = function (icon, who, zh, en) { var w = who ? K.tr(who[0], who[1]) : ''; K.tr(zh, en); K.say(icon, w, zh, who && who[2]); };
})(window);

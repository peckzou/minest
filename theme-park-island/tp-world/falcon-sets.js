/* Minest My World · "Millennium Falcon: Smugglers Run" set pieces (`falcon-sets.js`)
 * Geometry and shaders for the attraction rebuild: the walk-through interior (Ohnaka Transport Solutions
 * briefing room with Hondo, boarding tunnel, main hold with the Dejarik table, ring corridor, six-seat cockpit)
 * and everything outside the cockpit window (Batuu spires, Corellia shipyard gantries, the coaxium train,
 * TIE fighters, a Star Destroyer, planets, hyperspace tunnel). The mission logic lives in falcon.js. */
(function (root) {
  'use strict';

  function create(T) {
    const PI = Math.PI;
    const hexRGB = (h) => [(h >> 16 & 255) / 255, (h >> 8 & 255) / 255, (h & 255) / 255];
    let seed = 11;
    const rnd = () => { seed = (seed * 16807) % 2147483647; return seed / 2147483647; };
    const V3 = (x, y, z) => new T.Vector3(x || 0, y || 0, z || 0);

    /* ---------------------------------------------------------------- lit vertex-colour material */
    function uni() {
      return { uKey: { value: V3(0.35, 0.8, 0.48).normalize() }, uKeyCol: { value: V3(1, 1, 1) }, uAmb: { value: V3(0.4, 0.4, 0.42) },
               uFogCol: { value: V3() }, uFog: { value: 0 }, uAdd: { value: V3() } };
    }
    const EXT = uni(), INT = uni();
    INT.uKey.value.set(0.1, 0.9, 0.42).normalize(); INT.uKeyCol.value.set(0.6, 0.58, 0.55); INT.uAmb.value.set(0.5, 0.5, 0.53);
    const LIT_VS = 'attribute vec3 aCol; attribute float aGlow; varying vec3 vC; varying vec3 vN; varying vec3 vW; varying float vG;' +
      'void main(){ vC=aCol; vG=aGlow; vN=normalize(mat3(modelMatrix)*normal); vec4 w=modelMatrix*vec4(position,1.0); vW=w.xyz; gl_Position=projectionMatrix*viewMatrix*w; }';
    const LIT_FS = 'uniform vec3 uKey; uniform vec3 uKeyCol; uniform vec3 uAmb; uniform vec3 uFogCol; uniform vec3 uAdd; uniform float uFog;' +
      'varying vec3 vC; varying vec3 vN; varying vec3 vW; varying float vG;' +
      'void main(){ vec3 n=normalize(vN); if(!gl_FrontFacing) n=-n; float d=max(dot(n,uKey),0.0);' +
      ' vec3 v=normalize(cameraPosition-vW); float rim=pow(1.0-max(dot(n,v),0.0),3.0);' +
      ' vec3 c=vC*(uAmb+uKeyCol*d)+uKeyCol*rim*0.07+vC*uAdd; c=mix(c,vC*1.15,vG);' +
      ' float dist=length(cameraPosition-vW); float f=(1.0-exp(-dist*dist*uFog*uFog))*(1.0-vG*0.55);' +
      ' gl_FragColor=vec4(mix(c,uFogCol,f),1.0); }';
    const litMat = (U) => new T.ShaderMaterial({ uniforms: U, vertexShader: LIT_VS, fragmentShader: LIT_FS, side: T.DoubleSide });

    // Vertex-coloured geometry merger: each set piece becomes one draw call.
    function Bld() {
      const P = [], N = [], C = [], G = [];
      const m4 = new T.Matrix4(), q = new T.Quaternion(), e = new T.Euler(), v = new T.Vector3(), sc = new T.Vector3(), Z = new T.Vector3(0, 0, 1);
      let glow = 0;
      function bake(geo, col) {
        const g = geo.index ? geo.toNonIndexed() : geo;
        g.applyMatrix4(m4);
        const p = g.attributes.position.array, nn = g.attributes.normal.array, c = hexRGB(col);
        for (let i = 0; i < p.length; i += 3) { P.push(p[i], p[i + 1], p[i + 2]); N.push(nn[i], nn[i + 1], nn[i + 2]); C.push(c[0], c[1], c[2]); G.push(glow); }
        g.dispose(); if (g !== geo) geo.dispose();
        return self;
      }
      const self = {
        g(val) { glow = val; return self; },
        add(geo, col, x, y, z, rx, ry, rz, sx, sy, sz) {
          q.setFromEuler(e.set(rx || 0, ry || 0, rz || 0));
          m4.compose(v.set(x || 0, y || 0, z || 0), q, sc.set(sx || 1, sy || sx || 1, sz || sx || 1));
          return bake(geo, col);
        },
        beam(col, x1, y1, z1, x2, y2, z2, w, h) {
          const d = new T.Vector3(x2 - x1, y2 - y1, z2 - z1), len = d.length();
          q.setFromUnitVectors(Z, d.normalize());
          m4.compose(v.set((x1 + x2) / 2, (y1 + y2) / 2, (z1 + z2) / 2), q, sc.set(1, 1, 1));
          return bake(new T.BoxGeometry(w, h || w, len), col);
        },
        put(sub, x, y, z, ry, s) {
          q.setFromEuler(e.set(0, ry || 0, 0));
          m4.compose(v.set(x || 0, y || 0, z || 0), q, sc.set(s || 1, s || 1, s || 1));
          const r = sub.raw();
          for (let i = 0; i < r.P.length; i += 3) {
            v.set(r.P[i], r.P[i + 1], r.P[i + 2]).applyMatrix4(m4); P.push(v.x, v.y, v.z);
            v.set(r.N[i], r.N[i + 1], r.N[i + 2]).applyQuaternion(q); N.push(v.x, v.y, v.z);
            C.push(r.C[i], r.C[i + 1], r.C[i + 2]); G.push(r.G[i / 3]);
          }
          return self;
        },
        raw: () => ({ P, N, C, G }),
        box: (c, w, h, d, x, y, z, rx, ry, rz) => self.add(new T.BoxGeometry(w, h, d), c, x, y, z, rx, ry, rz),
        cyl: (c, rt, rb, h, x, y, z, rx, ry, rz, seg) => self.add(new T.CylinderGeometry(rt, rb, h, seg || 10), c, x, y, z, rx, ry, rz),
        cone: (c, r, h, x, y, z, rx, ry, rz, seg) => self.add(new T.ConeGeometry(r, h, seg || 8), c, x, y, z, rx, ry, rz),
        sph: (c, r, x, y, z, sx, sy, sz) => self.add(new T.SphereGeometry(r, 10, 8), c, x, y, z, 0, 0, 0, sx, sy, sz),
        dome: (c, r, x, y, z) => self.add(new T.SphereGeometry(r, 12, 6, 0, PI * 2, 0, PI * 0.5), c, x, y, z),
        geo() {
          const g = new T.BufferGeometry();
          g.setAttribute('position', new T.Float32BufferAttribute(P, 3));
          g.setAttribute('normal', new T.Float32BufferAttribute(N, 3));
          g.setAttribute('aCol', new T.Float32BufferAttribute(C, 3));
          g.setAttribute('aGlow', new T.Float32BufferAttribute(G, 1));
          return g;
        }
      };
      return self;
    }
    function triGeo(arr) {
      const g = new T.BufferGeometry();
      g.setAttribute('position', new T.Float32BufferAttribute(arr, 3));
      g.computeVertexNormals();
      return g;
    }
    function cvs(w, h) { const c = document.createElement('canvas'); c.width = w; c.height = h; return c; }
    function texMat(c) { const m = new T.MeshBasicMaterial({ map: new T.CanvasTexture(c), side: T.DoubleSide, fog: false }); m.toneMapped = false; return m; }
    const glowMat = (hex, op) => { const m = new T.MeshBasicMaterial({ color: hex, transparent: true, opacity: op === undefined ? 1 : op, blending: T.AdditiveBlending, depthWrite: false, fog: false }); m.toneMapped = false; return m; };

    /* ---------------------------------------------------------------- blinking console panels */
    const P_VS = 'varying vec2 vU; void main(){ vU=uv; gl_Position=projectionMatrix*modelViewMatrix*vec4(position,1.0); }';
    const P_FS = 'uniform float uT; uniform float uPow; uniform float uAlarm; uniform vec2 uGrid; varying vec2 vU;' +
      'float h(vec2 p){ return fract(sin(dot(p,vec2(127.1,311.7)))*43758.5453); }' +
      'void main(){ vec2 g=vU*uGrid; vec2 id=floor(g); vec2 f=fract(g); float r=h(id); float r2=h(id+17.3);' +
      ' float blink=step(0.5,fract(r2*9.0+uT*(0.12+r*0.8))); float on=step(0.38,r)*max(blink,step(0.8,r));' +
      ' float bx=step(0.16,f.x)*step(f.x,0.84)*step(0.24,f.y)*step(f.y,0.76);' +
      ' vec3 col=r2<0.25?vec3(1.0,0.28,0.2):(r2<0.5?vec3(1.0,0.72,0.2):(r2<0.75?vec3(0.25,0.75,1.0):vec3(0.35,1.0,0.5)));' +
      ' col=mix(col,vec3(1.0,0.1,0.06),uAlarm*step(0.5,fract(uT*2.2))*0.8);' +
      ' gl_FragColor=vec4(vec3(0.06,0.065,0.08)+col*bx*(on*uPow*(0.55+0.45*r)+0.05),1.0); }';
    const S_FS = 'uniform float uT; uniform float uPow; uniform float uAlarm; uniform vec2 uGrid; varying vec2 vU;' +
      'void main(){ vec2 p=vU*2.0-1.0; float d=length(p); float a=atan(p.y,p.x)/6.2832;' +
      ' float sweep=pow(fract(a-uT*0.4),7.0); float rings=step(0.9,fract(d*4.0))+step(0.96,1.0-abs(p.x))*0.0;' +
      ' float cross=step(abs(p.x),0.02)+step(abs(p.y),0.02);' +
      ' vec3 col=mix(vec3(0.1,0.85,1.0),vec3(1.0,0.2,0.1),uAlarm);' +
      ' gl_FragColor=vec4(vec3(0.02,0.05,0.08)+col*(rings*0.45+sweep*0.9+cross*0.25)*step(d,1.0)*uPow,1.0); }';
    function panelU(pow) { return { uT: { value: 0 }, uPow: { value: pow }, uAlarm: { value: 0 } }; }
    function panel(U, w, h, gx, gy, scope) {
      const m = new T.ShaderMaterial({
        uniforms: { uT: U.uT, uPow: U.uPow, uAlarm: U.uAlarm, uGrid: { value: new T.Vector2(gx, gy) } },
        vertexShader: P_VS, fragmentShader: scope ? S_FS : P_FS, side: T.DoubleSide
      });
      return new T.Mesh(new T.PlaneGeometry(w, h), m);
    }

    /* ================================================================ INTERIOR (ship-local coordinates) */
    function buildInterior() {
      const grp = new T.Group(), board = new T.Group(); grp.add(board);
      const intMat = litMat(INT);
      const PUc = panelU(0), PUh = panelU(1);
      const b = Bld(), pre = Bld();
      const WALL = 0x565b64, DARK = 0x24272d, PAD = 0xcbc2aa, MET = 0x868c96, FLOOR = 0x2d3036, TAN = 0x9a8a6a, SEAT = 0x3b4049;
      const at = (m, x, y, z, rx, ry, rz) => { m.position.set(x, y, z); m.rotation.set(rx || 0, ry || 0, rz || 0); grp.add(m); return m; };

      function seatB() {
        const s = Bld();
        s.cyl(DARK, 0.12, 0.2, 0.4, 0, 0.2, 0).box(SEAT, 0.58, 0.14, 0.58, 0, 0.47, 0).box(SEAT, 0.56, 0.95, 0.14, 0, 1.0, 0.27, -0.08)
         .box(TAN, 0.4, 0.6, 0.05, 0, 0.95, 0.19, -0.08).box(SEAT, 0.34, 0.26, 0.16, 0, 1.58, 0.3);
        for (const sx of [-1, 1]) s.box(DARK, 0.08, 0.08, 0.5, sx * 0.31, 0.68, 0.02);
        return s;
      }
      const seat = seatB();

      /* ---- cockpit: z -3.3 (nose) .. 3.2 (rear door) */
      b.add(new T.CylinderGeometry(1.9, 1.9, 4.8, 18, 1, true), WALL, 0, 0.3, 0.8, PI / 2);
      for (const z of [-1.55, 0, 1.6, 3.15]) b.add(new T.TorusGeometry(1.86, 0.08, 5, 18), DARK, 0, 0.3, z);
      b.box(FLOOR, 2.9, 0.08, 4.8, 0, -1.1, 0.8);
      b.g(1); for (const sx of [-1, 1]) b.box(0x7dd3fc, 0.05, 0.03, 4.6, sx * 1.3, -1.05, 0.8); b.g(0);
      // The famous greenhouse canopy: three octagonal rings and eight radial struts
      [[1.9, -1.6, 0.075], [1.35, -2.45, 0.05], [0.8, -3.3, 0.05]].forEach(([r, z, t]) => b.add(new T.TorusGeometry(r, t, 4, 8), DARK, 0, 0.3, z, 0, 0, PI / 8));
      for (let i = 0; i < 8; i++) {
        const a = i * PI / 4 + PI / 8, c = Math.cos(a), s = Math.sin(a);
        b.beam(DARK, c * 1.9, 0.3 + s * 1.9, -1.6, c * 0.8, 0.3 + s * 0.8, -3.3, 0.085);
      }
      b.box(DARK, 3.1, 0.5, 1.0, 0, -0.98, -1.45, 0.45).box(DARK, 3.3, 0.9, 0.3, 0, -1.0, -1.95).box(DARK, 0.5, 0.55, 1.5, 0, -0.85, -0.45)
       .box(DARK, 1.7, 0.2, 0.9, 0, 1.78, -0.9, -0.3);
      for (const sd of [-1, 1]) {
        b.box(DARK, 0.2, 1.0, 2.4, sd * 1.72, 0.75, 1.9);
        b.put(seat, sd * 0.72, -1.1, -0.35).put(seat, sd * 1.05, -1.1, 1.45, -sd * PI / 2).put(seat, sd * 1.05, -1.1, 2.55, -sd * PI / 2);
        b.box(DARK, 0.25, 2.9, 0.2, sd * 1.3, 0.3, 3.2);
        at(panel(PUc, 2.2, 0.9, 18, 7), sd * 1.61, 0.75, 1.9, 0, -sd * PI / 2, 0);
      }
      b.box(DARK, 2.9, 0.25, 0.2, 0, 1.75, 3.2);
      at(panel(PUc, 2.9, 0.85, 26, 6), 0, -0.746, -1.337, -(PI / 2 - 0.45));
      at(panel(PUc, 1.6, 0.8, 16, 6), 0, 1.675, -0.868, PI / 2 - 0.3);
      at(panel(PUc, 0.4, 0.4, 1, 1, true), 0, -0.57, -0.2, -PI / 2);
      const yokes = [-1, 1].map((sd) => at(new T.Mesh(Bld().add(new T.TorusGeometry(0.17, 0.03, 5, 10, PI), MET).cyl(DARK, 0.03, 0.03, 0.35, 0, -0.17, 0.02, 0.5).geo(), intMat), sd * 0.72, -0.42, -0.98));
      const lever = at(new T.Mesh(Bld().cyl(MET, 0.02, 0.02, 0.36, -0.07, 0.18, 0).cyl(MET, 0.02, 0.02, 0.36, 0.07, 0.18, 0).g(1).box(0xff4433, 0.3, 0.07, 0.08, 0, 0.37, 0).geo(), intMat), 0, -0.6, -0.85, 0.35);
      const reticleMat = new T.MeshBasicMaterial({ color: 0x4ade80, transparent: true, opacity: 0.9, depthTest: false, fog: false });
      reticleMat.toneMapped = false;
      const reticle = at(new T.Mesh(new T.RingGeometry(0.085, 0.105, 24), reticleMat), 0, 0.3, -2.3);
      reticle.renderOrder = 20;

      /* ---- access corridor: z 3.2 .. 10 */
      b.add(new T.CylinderGeometry(1.45, 1.45, 6.8, 14, 1, true), 0x7f7c74, 0, 0.2, 6.6, PI / 2);
      b.box(FLOOR, 1.75, 0.08, 6.8, 0, -1.1, 6.6);
      for (let z = 3.7; z < 10; z += 0.9) {
        b.add(new T.TorusGeometry(1.38, 0.14, 6, 14), PAD, 0, 0.2, z);
        b.g(1); for (const sx of [-1, 1]) b.box(0xfff1c9, 0.06, 0.04, 0.32, sx * 0.8, -1.04, z + 0.45);
        b.box(0xdbeafe, 0.5, 0.05, 0.14, 0, 1.6, z + 0.45).g(0);
      }

      /* ---- main hold: x -5.5..5.5, z 10..19 */
      b.box(0x30343a, 11.4, 0.12, 9, 0, -1.16, 14.5).box(0x25282d, 11.4, 0.12, 9, 0, 2.36, 14.5);
      for (const sx of [-1, 1]) {
        b.box(WALL, 0.2, 3.5, 9, sx * 5.6, 0.6, 14.5).box(WALL, 4.2, 3.5, 0.2, sx * 3.5, 0.6, 10).box(WALL, 4.3, 3.5, 0.2, sx * 3.45, 0.6, 19);
        b.box(DARK, 0.16, 0.7, 9, sx * 5.44, -0.7, 14.5).cyl(MET, 0.06, 0.06, 9, sx * 5.3, 1.95, 14.5, PI / 2).cyl(0xa8553a, 0.04, 0.04, 9, sx * 5.32, 1.78, 14.5, PI / 2);
        for (let z = 10.9; z < 18.6; z += 1.4) b.box(PAD, 0.12, 1.5, 1.15, sx * 5.44, 0.9, z);
        b.g(1); for (const z of [12.4, 16.6]) b.cyl(0xfff3d6, 0.36, 0.36, 0.05, sx * 2.3, 2.28, z, 0, 0, 0, 14); b.g(0);
        b.box(0x3a3d44, 0.2, 3, 2.5, sx * 1.4, 0.4, 20.25);
        b.g(1).box(0xffb04a, 0.06, 0.06, 2.4, sx * 1.25, 1.62, 20.25).g(0);
      }
      b.box(WALL, 2.8, 0.7, 0.2, 0, 2.0, 10).box(WALL, 2.6, 0.6, 0.2, 0, 2.05, 19).box(DARK, 3, 0.2, 2.5, 0, 1.8, 20.25).box(FLOOR, 3, 0.1, 2.5, 0, -1.15, 20.25);
      for (let i = 0; i < 9; i++) b.box(i % 2 ? 0x3a3e45 : 0x282b30, 1.7, 0.02, 1.7, -3.6 + (i % 3) * 3.6, -1.09, 11.6 + Math.floor(i / 3) * 2.9);
      // Dejarik holochess table with wrap-around bench
      const TX = -2.7, TZ = 15.3;
      b.cyl(DARK, 0.3, 0.5, 0.75, TX, -0.72, TZ).cyl(0x1a1c20, 1.0, 1.0, 0.1, TX, -0.3, TZ, 0, 0, 0, 24);
      b.g(1).add(new T.TorusGeometry(1.0, 0.03, 4, 28), 0xfde047, TX, -0.25, TZ, PI / 2).g(0);
      for (let k = 0; k < 7; k++) {
        const a = (110 + k * 23.3) * PI / 180, c = Math.cos(a), s = Math.sin(a), ry = PI / 2 - a;
        b.box(DARK, 0.75, 0.4, 0.6, TX + c * 1.75, -0.9, TZ + s * 1.75, 0, ry, 0).box(TAN, 0.75, 0.14, 0.62, TX + c * 1.75, -0.63, TZ + s * 1.75, 0, ry, 0)
         .box(PAD, 0.75, 0.8, 0.14, TX + c * 2.06, -0.12, TZ + s * 2.06, 0, ry, 0);
      }
      const dj = cvs(256, 256), dx = dj.getContext('2d');
      dx.fillStyle = '#0b0c0f'; dx.fillRect(0, 0, 256, 256);
      for (let r = 3; r >= 1; r--) for (let k = 0; k < 12; k++) {
        dx.fillStyle = (k + r) % 2 ? '#e8e2c8' : '#17191d';
        dx.beginPath(); dx.moveTo(128, 128); dx.arc(128, 128, r * 40, k * PI / 6, (k + 1) * PI / 6); dx.closePath(); dx.fill();
      }
      dx.fillStyle = '#facc15'; dx.beginPath(); dx.arc(128, 128, 14, 0, PI * 2); dx.fill();
      dx.strokeStyle = '#facc15'; dx.lineWidth = 4; dx.beginPath(); dx.arc(128, 128, 122, 0, PI * 2); dx.stroke();
      at(new T.Mesh(new T.CircleGeometry(0.94, 32), texMat(dj)), TX, -0.244, TZ, -PI / 2);
      const holo = [];
      for (let i = 0; i < 6; i++) {
        const h = Bld(), k = i % 3;
        if (k === 0) h.sph(0, 0.09, 0, 0.16, 0, 1, 1.2, 1).sph(0, 0.06, 0, 0.3, 0.02).cyl(0, 0.02, 0.02, 0.16, -0.1, 0.24, 0, 0, 0, 0.9).cyl(0, 0.02, 0.02, 0.16, 0.1, 0.24, 0, 0, 0, -0.9).cyl(0, 0.03, 0.03, 0.1, -0.04, 0.05, 0).cyl(0, 0.03, 0.03, 0.1, 0.04, 0.05, 0);
        else if (k === 1) h.cyl(0, 0.04, 0.07, 0.3, 0, 0.15, 0).sph(0, 0.07, 0, 0.34, 0.02, 1.3, 0.8, 1).cone(0, 0.025, 0.12, 0, 0.44, 0).cyl(0, 0.015, 0.015, 0.22, 0.11, 0.2, 0.04, 0.6);
        else { h.sph(0, 0.12, 0, 0.13, 0, 1.2, 0.8, 1); for (let l = 0; l < 4; l++) h.cyl(0, 0.025, 0.02, 0.1, Math.cos(l * 1.57 + 0.78) * 0.1, 0.04, Math.sin(l * 1.57 + 0.78) * 0.1); h.sph(0, 0.035, 0.06, 0.24, 0.06).sph(0, 0.035, -0.06, 0.24, 0.06); }
        const a = i / 6 * PI * 2;
        const m = at(new T.Mesh(h.geo(), glowMat([0x7df9ff, 0xfde047, 0x86efac][k], 0.8)), TX + Math.cos(a) * 0.56, -0.24, TZ + Math.sin(a) * 0.56, 0, -a + PI / 2, 0);
        holo.push({ m, a });
      }
      // Engineering station and cargo
      b.box(DARK, 0.7, 0.9, 2.6, 5.1, -0.65, 12.6).put(seat, 4.2, -1.1, 12.6, -PI / 2);
      at(panel(PUh, 2.4, 1.1, 20, 9), 5.44, 0.75, 12.6, 0, -PI / 2, 0);
      at(panel(PUh, 0.55, 2.4, 5, 18), 5.08, -0.19, 12.6, -PI / 2, 0, 0);
      at(panel(PUh, 1.8, 0.7, 14, 5), -5.36, 0.9, 11.6, 0, PI / 2, 0);
      b.box(0x6b5a45, 1, 1, 1, 3.9, -0.6, 17.6).box(0x4a5560, 0.8, 0.8, 0.8, 4.7, -0.7, 16.4, 0, 0.4, 0).box(0x6b5a45, 0.7, 0.7, 0.7, 3.95, 0.25, 17.65, 0, 0.3, 0)
       .cyl(0x7a4a2a, 0.3, 0.3, 0.9, 2.9, -0.65, 18.2);

      /* ---- Ohnaka Transport Solutions briefing room (hidden once the mission launches) */
      const PW = 0x7d6952, PF = 0x4c4136;
      pre.box(PF, 14.4, 0.12, 11.5, 0, -1.16, 27.25).box(0x2b2622, 14.4, 0.12, 11.5, 0, 4.26, 27.25).box(PW, 0.3, 5.5, 11.5, 7.15, 1.55, 27.25).box(PW, 14.4, 5.5, 0.3, 0, 1.55, 33.15);
      for (const sx of [-1, 1]) pre.box(PW, 5.7, 5.5, 0.3, sx * 4.25, 1.55, 21.6);
      pre.box(PW, 2.9, 2.4, 0.3, 0, 3.1, 21.6);
      pre.box(PW, 0.3, 1.3, 11.5, -7.15, -0.45, 27.25).box(PW, 0.3, 0.9, 11.5, -7.15, 3.85, 27.25).box(PW, 0.3, 3.2, 1.5, -7.15, 1.8, 22.25).box(PW, 0.3, 3.2, 3.5, -7.15, 1.8, 31.25);
      for (const z of [24.6, 26.25, 27.9]) pre.box(DARK, 0.2, 3.2, 0.14, -7.1, 1.8, z);
      pre.box(DARK, 0.2, 0.14, 6.5, -7.1, 1.8, 26.25);
      pre.box(0x5a4a3a, 3.4, 0.9, 3.0, -3.8, -0.65, 26).box(0x4a3d30, 0.8, 0.45, 1.4, -1.7, -0.88, 26);
      for (let z = 24.6; z <= 27.45; z += 0.7) pre.cyl(MET, 0.035, 0.035, 0.9, -2.15, 0.25, z);
      pre.cyl(MET, 0.04, 0.04, 2.9, -2.15, 0.7, 26, PI / 2);
      // Hoisted sublight engine, workbench, crates and hanging lamps
      pre.cyl(MET, 0.7, 0.8, 2.6, 4.3, 1.3, 27, PI / 2).cyl(DARK, 0.85, 0.85, 0.3, 4.3, 1.3, 26.2, PI / 2).box(0x5b4a3a, 2.6, 0.12, 1.1, 4.6, -0.3, 29.6).box(0x3a3028, 2.4, 0.8, 0.9, 4.6, -0.75, 29.6);
      pre.g(1).cone(0x7dd3fc, 0.55, 0.9, 4.3, 1.3, 28.6, -PI / 2).g(0);
      for (const z of [26.3, 27.7]) pre.cyl(DARK, 0.025, 0.025, 2.2, 4.3, 3.15, z);
      [[5.6, 31.6, 1.2, 0x6b5a45], [5.9, 23.2, 1.0, 0x4a5560], [-5.6, 31.8, 1.1, 0x6b5a45], [4.6, 31.9, 0.8, 0x7a4a2a], [-4.4, 32.0, 0.9, 0x4a5560], [5.7, 24.5, 0.8, 0x6b5a45]]
        .forEach(([x, z, s, c], i) => pre.box(c, s, s, s, x, -1.1 + s / 2, z, 0, i * 0.5, 0));
      pre.box(0x6b5a45, 0.8, 0.8, 0.8, 5.65, 0.5, 31.6, 0, 0.6, 0);
      for (const [x, z] of [[-3, 24], [2.5, 25.5], [-2.5, 30], [3, 30.5], [0, 27.5]]) {
        pre.cyl(DARK, 0.015, 0.015, 0.7, x, 3.85, z).cone(0x3a3028, 0.3, 0.25, x, 3.5, z).g(1).sph(0xffcf8a, 0.13, x, 3.36, z).g(0);
      }
      board.add(new T.Mesh(pre.geo(), intMat));
      // Hangar window: the Falcon parked on Docking Bay 5 at sunset
      const wc = cvs(768, 384), wx = wc.getContext('2d');
      const sg = wx.createLinearGradient(0, 0, 0, 384);
      sg.addColorStop(0, '#2a3a78'); sg.addColorStop(0.5, '#f08a3c'); sg.addColorStop(0.72, '#ffd08a'); sg.addColorStop(0.73, '#6b4a34'); sg.addColorStop(1, '#3a2a20');
      wx.fillStyle = sg; wx.fillRect(0, 0, 768, 384);
      wx.fillStyle = '#2a2018';
      [[40, 90, 60], [150, 150, 40], [620, 60, 70], [720, 130, 50], [330, 175, 26]].forEach(([x, y, w]) => { wx.beginPath(); wx.moveTo(x - w, 282); wx.lineTo(x - w * 0.3, y + 40); wx.lineTo(x, y); wx.lineTo(x + w * 0.35, y + 55); wx.lineTo(x + w, 282); wx.fill(); });
      wx.fillStyle = '#b9b4a8'; wx.beginPath(); wx.ellipse(410, 262, 150, 24, 0, 0, PI * 2); wx.fill();
      wx.fillStyle = '#9b968a'; wx.beginPath(); wx.ellipse(410, 250, 78, 16, 0, PI, PI * 2); wx.fill();
      wx.fillStyle = '#b9b4a8'; wx.fillRect(150, 254, 130, 14); wx.fillRect(160, 270, 120, 10);
      wx.fillStyle = '#8a857a'; wx.beginPath(); wx.ellipse(545, 246, 34, 13, -0.15, 0, PI * 2); wx.fill();
      wx.fillStyle = '#7dd3fc'; wx.fillRect(540, 268, 30, 6);
      wx.fillStyle = '#4a4640'; for (const x of [330, 410, 490]) wx.fillRect(x - 4, 282, 8, 22);
      wx.fillStyle = '#ffd08a'; for (let i = 0; i < 9; i++) wx.fillRect(210 + i * 50, 306, 8, 5);
      const win = new T.Mesh(new T.PlaneGeometry(9.2, 4.6), texMat(wc)); win.position.set(-7.9, 1.8, 26.25); win.rotation.y = PI / 2; board.add(win);
      const sc = cvs(1024, 200), sx2 = sc.getContext('2d');
      sx2.fillStyle = '#1c1611'; sx2.fillRect(0, 0, 1024, 200); sx2.strokeStyle = '#f59e0b'; sx2.lineWidth = 8; sx2.strokeRect(8, 8, 1008, 184);
      sx2.fillStyle = '#fbbf24'; sx2.textAlign = 'center'; sx2.font = '700 72px Georgia, "Songti SC", serif'; sx2.fillText('OHNAKA TRANSPORT SOLUTIONS', 512, 92);
      sx2.fillStyle = '#fde68a'; sx2.font = '700 50px "Songti SC", "Noto Serif CJK SC", serif'; sx2.fillText('奥纳卡运输公司 · 千年隼号登船口', 512, 162);
      const sign = new T.Mesh(new T.PlaneGeometry(5.2, 1.02), texMat(sc)); sign.position.set(0, 3.05, 21.8); board.add(sign);

      /* ---- Hondo Ohnaka audio-animatronic and R5-P8 */
      const COAT = 0x8e1b1b, SKIN = 0xa67c52, GOLD = 0xd4a72c, LEA = 0x2a1f18;
      const hondo = new T.Group(); hondo.position.set(-3.6, -0.2, 26); hondo.rotation.y = 0.8; hondo.scale.setScalar(1.25); board.add(hondo);
      const hb = Bld();
      for (const sx of [-1, 1]) hb.cyl(LEA, 0.09, 0.1, 0.35, sx * 0.13, 0.175, 0).cyl(0x4a3a2a, 0.1, 0.09, 0.5, sx * 0.13, 0.6, 0).box(GOLD, 0.05, 0.45, 0.03, sx * 0.09, 1.3, 0.255, 0, 0, -sx * 0.2).cyl(GOLD, 0.1, 0.1, 0.05, sx * 0.36, 1.63, 0);
      hb.cyl(COAT, 0.26, 0.4, 0.75, 0, 0.85, 0).cyl(COAT, 0.27, 0.25, 0.5, 0, 1.3, 0).cyl(LEA, 0.275, 0.275, 0.08, 0, 1.05, 0).box(GOLD, 0.1, 0.08, 0.04, 0, 1.05, 0.27)
        .box(0xd8cfb8, 0.12, 0.4, 0.03, 0, 1.32, 0.25).box(COAT, 0.72, 0.14, 0.34, 0, 1.55, 0).cyl(SKIN, 0.07, 0.08, 0.1, 0, 1.65, 0);
      hondo.add(new T.Mesh(hb.geo(), intMat));
      const hh = Bld();
      hh.sph(SKIN, 0.19, 0, 0.17, 0, 0.92, 1.08, 0.98).box(0x8a6340, 0.3, 0.045, 0.08, 0, 0.24, 0.15).box(0x9a7048, 0.05, 0.09, 0.07, 0, 0.15, 0.185).box(0x9a7048, 0.14, 0.06, 0.1, 0, 0.03, 0.12)
        .add(new T.SphereGeometry(0.205, 10, 6, 0, PI * 2, 0, PI * 0.5), 0x7a1616, 0, 0.19, -0.01).cyl(0x3a2a20, 0.03, 0.02, 0.4, 0, 0.1, -0.2, 0.4);
      for (const sx of [-1, 1]) {
        hh.box(0x8a6340, 0.03, 0.12, 0.04, sx * 0.1, 0.12, 0.16, 0, 0, sx * 0.3).sph(0x151515, 0.022, sx * 0.07, 0.2, 0.175).box(0x5a3a28, 0.04, 0.2, 0.16, sx * 0.2, 0.14, -0.02);
        hh.cyl(0x3a2a20, 0.055, 0.055, 0.05, sx * 0.07, 0.33, 0.165, PI / 2).g(1).cyl(0x9fe8c0, 0.04, 0.04, 0.055, sx * 0.07, 0.33, 0.168, PI / 2).g(0);
      }
      const head = new T.Mesh(hh.geo(), intMat); head.position.y = 1.7; hondo.add(head);
      const jaw = new T.Mesh(Bld().box(0x3a1a14, 0.09, 0.03, 0.02, 0, 0, 0).geo(), intMat); jaw.position.set(0, 0.085, 0.19); head.add(jaw);
      const upG = Bld().cyl(COAT, 0.075, 0.065, 0.34, 0, -0.17, 0).geo();
      const foG = Bld().cyl(COAT, 0.065, 0.06, 0.3, 0, -0.15, 0).cyl(GOLD, 0.07, 0.07, 0.05, 0, -0.28, 0).sph(SKIN, 0.06, 0, -0.35, 0).geo();
      const arms = [-1, 1].map((sd) => {
        const up = new T.Mesh(upG, intMat); up.position.set(sd * 0.42, 1.52, 0); hondo.add(up);
        const fo = new T.Mesh(foG, intMat); fo.position.y = -0.34; up.add(fo);
        return { up, fo, sd };
      });
      const r5 = new T.Group(); r5.position.set(-1.5, -1.1, 24.2); r5.rotation.y = 0.6; board.add(r5);
      const rb = Bld().cyl(0x1c1c1f, 0.24, 0.24, 0.5, 0, 0.5, 0, 0, 0, 0, 14).cyl(0xb3261e, 0.245, 0.245, 0.06, 0, 0.62, 0, 0, 0, 0, 14).cyl(0xb3261e, 0.245, 0.245, 0.06, 0, 0.36, 0, 0, 0, 0, 14).cyl(0x1c1c1f, 0.1, 0.14, 0.2, 0, 0.15, 0.1);
      for (const sx of [-1, 1]) rb.box(0x1c1c1f, 0.09, 0.6, 0.14, sx * 0.3, 0.42, 0).box(0xb3261e, 0.14, 0.12, 0.3, sx * 0.3, 0.07, 0.02);
      r5.add(new T.Mesh(rb.geo(), intMat));
      const r5Head = new T.Mesh(Bld().cyl(0x1c1c1f, 0.13, 0.24, 0.22, 0, 0, 0, 0, 0, 0, 14).cyl(0xb3261e, 0.135, 0.15, 0.04, 0, 0.09, 0, 0, 0, 0, 14).g(1).sph(0xff3b30, 0.035, 0, 0.02, 0.2).geo(), intMat);
      r5Head.position.y = 0.86; r5.add(r5Head);

      grp.add(new T.Mesh(b.geo(), intMat));
      /* the quad laser cannons seen from the cockpit, and the gunner's stick that turns them (falcon.js: aim) */
      const gunMat = new T.MeshLambertMaterial({ color: 0x8a929c }), tipMat = new T.MeshBasicMaterial({ color: 0xff5a3c });
      const guns = [-1, 1].map((sd) => {
        const g = new T.Group(); g.position.set(sd * 1.05, -0.32, -2.2);
        [-0.09, 0.09].forEach((dy) => { const b = new T.Mesh(new T.CylinderGeometry(0.035, 0.045, 1.5, 8), gunMat); b.rotation.x = PI / 2; b.position.set(0, dy, -0.75); g.add(b); const t = new T.Mesh(new T.SphereGeometry(0.06, 8, 6), tipMat); t.position.set(0, dy, -1.52); t.visible = false; g.add(t); });
        const m = new T.Mesh(new T.BoxGeometry(0.2, 0.34, 0.4), gunMat); g.add(m); grp.add(g); return g;
      });
      const stick = new T.Group(); stick.position.set(0.34, -0.36, -0.8); stick.scale.setScalar(0.5);   /* small, low and to the right: out of the view ahead */
      const sShaft = new T.Mesh(new T.CylinderGeometry(0.018, 0.022, 0.3, 8), gunMat); sShaft.position.y = 0.15; stick.add(sShaft);
      const sGrip = new T.Mesh(new T.CylinderGeometry(0.035, 0.03, 0.12, 8), new T.MeshLambertMaterial({ color: 0x1f2430 })); sGrip.position.y = 0.33; stick.add(sGrip);
      const sBtn = new T.Mesh(new T.SphereGeometry(0.022, 8, 6), tipMat); sBtn.position.set(0, 0.4, 0); stick.add(sBtn);
      const sBase = new T.Mesh(new T.CylinderGeometry(0.07, 0.09, 0.05, 10), gunMat); stick.add(sBase); grp.add(stick);
      return { grp, guns, stick, board, yokes, lever, reticle, reticleMat, holo, PUc, PUh, hondo: { head, jaw, arms }, r5Head, table: [TX, -0.2, TZ] };
    }

    /* ================================================================ EXTERIOR */
    function buildEnv() {
      const grp = new T.Group(), extMat = litMat(EXT);

      // Sky dome, stars, ground
      const domeU = { uTop: { value: V3() }, uHor: { value: V3() }, uBot: { value: V3() }, uSun: { value: V3() }, uSunDir: { value: V3(0.25, 0.1, -0.96).normalize() } };
      const dome = new T.Mesh(new T.SphereGeometry(880, 24, 16), new T.ShaderMaterial({
        uniforms: domeU, side: T.BackSide, // writes depth so the park 900 units below can never show through the mission sky
        vertexShader: 'varying vec3 vD; void main(){ vD=position; gl_Position=projectionMatrix*modelViewMatrix*vec4(position,1.0); }',
        fragmentShader: 'uniform vec3 uTop; uniform vec3 uHor; uniform vec3 uBot; uniform vec3 uSun; uniform vec3 uSunDir; varying vec3 vD;' +
          'void main(){ vec3 d=normalize(vD); float a=abs(d.y); vec3 c=d.y>0.0?mix(uHor,uTop,pow(a,0.5)):mix(uHor,uBot,pow(a,0.45));' +
          ' float s=max(dot(d,uSunDir),0.0); c+=uSun*(pow(s,60.0)+pow(s,7.0)*0.3); gl_FragColor=vec4(c,1.0); }'
      }));
      dome.renderOrder = -5; grp.add(dome);
      const sp = new Float32Array(700 * 3);
      for (let i = 0; i < 700; i++) {
        const th = rnd() * PI * 2, ph = Math.acos(2 * rnd() - 1);
        sp[i * 3] = Math.sin(ph) * Math.cos(th) * 400; sp[i * 3 + 1] = Math.cos(ph) * 400; sp[i * 3 + 2] = Math.sin(ph) * Math.sin(th) * 400;
      }
      const sgeo = new T.BufferGeometry(); sgeo.setAttribute('position', new T.BufferAttribute(sp, 3));
      const stars = new T.Points(sgeo, new T.PointsMaterial({ color: 0xe6f1ff, size: 1.7, sizeAttenuation: false, transparent: true, depthWrite: false, fog: false }));
      grp.add(stars);
      const groundU = { uCol: { value: V3() }, uScroll: { value: 0 }, uFogCol: EXT.uFogCol, uFog: EXT.uFog };
      const ground = new T.Mesh(new T.CircleGeometry(440, 40), new T.ShaderMaterial({
        uniforms: groundU,
        vertexShader: 'varying vec3 vW; void main(){ vec4 w=modelMatrix*vec4(position,1.0); vW=w.xyz; gl_Position=projectionMatrix*viewMatrix*w; }',
        fragmentShader: 'uniform vec3 uCol; uniform vec3 uFogCol; uniform float uScroll; uniform float uFog; varying vec3 vW;' +
          'float h(vec2 p){ return fract(sin(dot(p,vec2(127.1,311.7)))*43758.5453); }' +
          'void main(){ vec2 p=vec2(vW.x,vW.z-uScroll); float n=h(floor(p/26.0))*0.5+h(floor(p/7.0))*0.25; vec3 c=uCol*(0.72+n*0.5);' +
          ' float dist=length(cameraPosition-vW); float f=1.0-exp(-dist*dist*uFog*uFog); gl_FragColor=vec4(mix(c,uFogCol,f),1.0); }'
      }));
      ground.rotation.x = -PI / 2; grp.add(ground);

      /* ---- Batuu: petrified spires and Black Spire Outpost */
      function spireGeo(v) {
        const b = Bld(), H = 100, R = 7; let ox = 0, oz = 0;
        for (let k = 0; k < 8; k++) {
          const r0 = R * (1 - k / 9.5), r1 = R * (1 - (k + 1) / 9.5), h = H / 8;
          ox += (rnd() - 0.5) * 1.6; oz += (rnd() - 0.5) * 1.6;
          b.add(new T.CylinderGeometry(r1 * (0.85 + rnd() * 0.2), r0, h, 7), [0x2e2925, 0x3a322b, 0x262220][(k + v) % 3], ox, h * (k + 0.5), oz, 0, rnd() * 3, 0);
          if (k % 2 === 1) b.add(new T.CylinderGeometry(r0 * 1.2, r0 * 1.05, 1.4, 7), 0x57483a, ox, h * k + 0.7, oz, 0, rnd() * 3, 0);
        }
        b.cone(0x262220, R * 0.17, 9, ox, H + 4.5, oz, 0, 0, 0, 6).g(1).sph(0xffb347, 0.7, R * 0.6, 21, R * 0.5).g(0);
        return b.geo();
      }
      const spireGeos = [spireGeo(0), spireGeo(1), spireGeo(2)];
      const spires = [];
      for (let i = 0; i < 14; i++) { const m = new T.Mesh(spireGeos[i % 3], extMat); grp.add(m); spires.push({ m, z: 0, x: 0, s: 1, col: false }); }
      const pb = Bld();
      pb.cyl(0x58524b, 15, 15, 0.5, 0, 0.25, 0, 0, 0, 0, 28).cyl(0x403b36, 16.5, 16.5, 0.3, 0, 0.15, 0, 0, 0, 0, 28);
      pb.g(1); for (let i = 0; i < 16; i++) pb.sph(0xffc878, 0.35, Math.cos(i * PI / 8) * 14.2, 0.6, Math.sin(i * PI / 8) * 14.2); pb.g(0);
      for (let i = 0; i < 16; i++) {
        const a = rnd() * PI * 2, rad = 30 + rnd() * 60, r = 4 + rnd() * 5, x = Math.cos(a) * rad, z = Math.sin(a) * rad;
        pb.cyl(0xb8a384, r * 0.96, r, 3.2, x, 1.6, z, 0, 0, 0, 12).dome(0xc9b596, r, x, 3.2, z).g(1).box(0xffc878, 0.8, 1.2, 0.3, x, 1.4, z + r).g(0);
      }
      for (let i = 0; i < 9; i++) { const a = PI * 0.15 + i * 0.2; pb.box(0x6e6052, 6.4, 9, 1.5, Math.cos(a) * 24, 4.5, Math.sin(a) * 24, 0, -a + PI / 2, 0); }
      const pad = new T.Mesh(pb.geo(), extMat); grp.add(pad);

      /* ---- Corellia shipyard gantries (five obstacle types + a plain gate) */
      const YC = 0x4a5058, YD = 0x30353c;
      function gate(b) {
        for (const sx of [-1, 1]) {
          b.box(0x3d434b, 9, 170, 9, sx * 42, -10, 0).box(0x2b3036, 11, 4, 11, sx * 42, 30, 0).box(0x2b3036, 11, 4, 11, sx * 42, -28, 0);
          b.g(1); for (const y of [-40, -10, 20, 50]) b.box(0xffd27a, 0.8, 0.8, 0.4, sx * 37.3, y, 4.7); b.g(0);
          b.beam(0x8a6a2a, sx * 42, 62, 0, sx * 14, 74, 0, 1.6);
        }
        b.box(0x353a42, 93, 5, 6, 0, 60, 0).box(0x2b3036, 60, 2, 2, 0, 54, 3).box(0x8a6a2a, 3, 3, 24, -18, 56, 8);
        return b;
      }
      const yardDefs = [
        { safe: [4.5, 0], col: [[-30, -1.5, -60, 60]], make: (b) => { b.box(YC, 28.5, 62, 16, -15.75, -7, 0); for (const y of [-30, -14, 2, 18]) b.box(YD, 29, 1.2, 16.4, -15.75, y, 0); b.g(1).box(0xffa033, 0.5, 62, 0.5, -1.4, -7, 8.2).g(0); } },
        { safe: [-4.5, 0], col: [[1.5, 30, -60, 60]], make: (b) => { b.box(YC, 28.5, 62, 16, 15.75, -7, 0); for (const y of [-30, -14, 2, 18]) b.box(YD, 29, 1.2, 16.4, 15.75, y, 0); b.g(1).box(0xffa033, 0.5, 62, 0.5, 1.4, -7, 8.2).g(0); } },
        { safe: [0, 2.8], col: [[-40, 40, -12, -0.6]], make: (b) => { b.box(YC, 75, 11.4, 7, 0, -6.3, 0).cyl(YD, 1.2, 1.2, 75, 0, -0.9, -2, 0, 0, PI / 2).g(1).box(0xffa033, 75, 0.4, 0.4, 0, -0.55, 3.6).g(0); for (const x of [-22, 22]) b.box(YD, 5, 70, 5, x, -46, 0); } },
        { safe: [0, -2.4], col: [[-40, 40, 1.0, 14]], make: (b) => { b.box(YC, 75, 13, 7, 0, 7.5, 0).g(1).box(0xffa033, 75, 0.4, 0.4, 0, 0.95, 3.6).g(0); for (const x of [-26, 0, 26]) b.box(YD, 3, 40, 3, x, 34, 0); } },
        { safe: [5.6, 0], col: [[-2.6, 2.6, -60, 60]], make: (b) => { b.box(YC, 5.2, 170, 7, 0, -10, 0).g(1).box(0xff4a3a, 5.6, 0.5, 0.5, 0, 4, 3.6).box(0xff4a3a, 5.6, 0.5, 0.5, 0, -4, 3.6).g(0); } },
        { safe: [0, 0], col: [], make: () => {} }
      ];
      yardDefs.forEach((d) => { const b = gate(Bld()); d.make(b); d.geo = b.geo(); });
      const yard = [];
      for (let i = 0; i < 5; i++) { const m = new T.Mesh(yardDefs[5].geo, extMat); grp.add(m); yard.push({ m, z: 0, v: 5 }); }

      /* ---- First Order Star Destroyer (unit length 120, scaled up in the scene) */
      const sb = Bld();
      function wedge(col, col2, nz, rz, hw, y0, yt, yk) {
        const N = [0, y0, nz], L = [-hw, y0, rz], R = [hw, y0, rz], Tp = [0, yt, rz], K = [0, yk, rz];
        if (yt !== y0) sb.add(triGeo([].concat(N, L, Tp, N, Tp, R, L, R, Tp)), col);
        if (yk !== y0) sb.add(triGeo([].concat(N, K, L, N, R, K, L, K, R)), col2);
      }
      wedge(0x9aa1ab, 0, -60, 60, 36, 0.5, 5.5, 0.5); wedge(0, 0x7d848e, -60, 60, 36, -0.5, -0.5, -4.5);
      wedge(0x2a2e35, 0x2a2e35, -58, 59.5, 34.6, 0, 0.5, -0.5); wedge(0xa9b0ba, 0, -22, 58, 20, 2.4, 8.5, 2.4);
      sb.box(0xa3aab4, 26, 5, 22, 0, 9, 44).box(0xaab1bb, 18, 4, 14, 0, 13, 47).box(0x8f96a0, 8, 6, 6, 0, 17, 50).box(0xaab1bb, 27, 4.5, 7, 0, 21.5, 50).box(0x8f96a0, 6, 3, 9, 0, 22, 50);
      for (const sx of [-1, 1]) sb.sph(0xb4bbc5, 2.4, sx * 9, 25, 50);
      sb.box(0x1c1f24, 14, 1.2, 20, 0, -2.9, 20).sph(0x8f96a0, 5, 0, -4.2, 40).g(1).box(0xbfe3ff, 10, 0.3, 14, 0, -3.56, 20);
      for (const x of [-13, 0, 13]) sb.cyl(0x7fd4ff, 4.3, 4.3, 0.4, x, 0.6, 63.3, PI / 2, 0, 0, 14);
      for (const x of [-22, -6.5, 6.5, 22]) sb.cyl(0x7fd4ff, 1.8, 1.8, 0.4, x, 0.4, 62.6, PI / 2);
      for (let i = 0; i < 90; i++) {
        if (i < 50) sb.box(0xffe9b0, 0.45, 0.45, 0.45, (rnd() - 0.5) * 24, 6.8 + rnd() * 16, 36 + rnd() * 18);
        else { const t = rnd(), sx = rnd() < 0.5 ? -1 : 1; sb.box(0xffe9b0, 0.4, 0.4, 0.4, sx * 36 * t, 0, -60 + 120 * t); }
      }
      sb.g(0);
      for (const x of [-13, 0, 13]) sb.cyl(0x5d646e, 5, 5, 6, x, 0.6, 60, PI / 2, 0, 0, 14);
      const sd = new T.Mesh(sb.geo(), extMat); sd.scale.setScalar(2.2); grp.add(sd);

      /* ---- TIE fighters */
      const tb = Bld();
      tb.sph(0x3d444d, 1.0, 0, 0, 0).cyl(0x7c848e, 0.62, 0.62, 0.12, 0, 0, 0.92, PI / 2, 0, 0, 12).cyl(0x0d1016, 0.5, 0.5, 0.14, 0, 0, 0.95, PI / 2, 0, 0, 8);
      for (const sx of [-1, 1]) {
        tb.box(0x565d66, 1.9, 0.4, 0.6, sx * 1.75, 0, 0).add(new T.CylinderGeometry(2.7, 2.7, 0.12, 6), 0x15181d, sx * 2.7, 0, 0, 0, 0, PI / 2).cyl(0x7c848e, 0.45, 0.45, 0.3, sx * 2.7, 0, 0, 0, 0, PI / 2);
        for (let k = 0; k < 3; k++) tb.box(0x7c848e, 0.2, 5.3, 0.16, sx * 2.7, 0, 0, k * PI / 3, 0, 0);
        tb.g(1).sph(0xff3b30, 0.12, sx * 0.3, -0.75, 0.75).g(0);
      }
      const tieGeo = tb.geo(), ties = [];
      for (let i = 0; i < 6; i++) { const m = new T.Mesh(tieGeo, extMat); m.visible = false; grp.add(m); ties.push({ m, on: false, wait: i * 0.7, x: 0, y: 0, z: 0, bx: 0, by: 0, ph: i * 1.3, cd: 1, pass: false }); }

      /* ---- Corellia coaxium train */
      const carB = Bld().box(0x4b5058, 4, 3, 10, 0, 2.2, 0).box(0x353a42, 2, 1.4, 10, 0, 0, 0).box(0x4b5058, 3.6, 2.8, 10, 0, -2.4, 0).box(0x2b3036, 4.3, 0.3, 10.2, 0, 3.75, 0);
      carB.g(1).box(0xffb04a, 4.06, 0.3, 8, 0, 2.6, 0).box(0xffb04a, 3.66, 0.25, 8, 0, -2.2, 0).g(0);
      const engB = Bld().put(carB, 0, 0, 0).beam(0x4b5058, 0, 2.2, -5, 0, 1.2, -9, 3.2, 2).box(0x353a42, 1.6, 4, 1.6, 0, 5.5, 2).g(1).sph(0xfff3c4, 0.6, 0, 1.6, -9.2).box(0xff4a3a, 1.8, 0.4, 1.8, 0, 7.6, 2).g(0);
      const contB = Bld().box(0x23272d, 3.2, 0.3, 4.4, 0, 0.15, 0).box(0x23272d, 3.2, 0.3, 4.4, 0, 2.2, 0);
      for (const sx of [-1, 1]) for (const sz of [-1, 1]) contB.box(0x565d66, 0.25, 2.1, 0.25, sx * 1.45, 1.2, sz * 2.05);
      contB.g(1); for (const x of [-0.95, 0, 0.95]) contB.cyl(0x35e0ff, 0.42, 0.42, 3.6, x, 1.2, 0, PI / 2); contB.g(0);
      const carGeo = carB.geo(), cars = [];
      for (let i = 0; i < 5; i++) { const m = new T.Mesh(i === 4 ? engB.geo() : carGeo, extMat); grp.add(m); cars.push(m); }
      const contGeo = contB.geo();
      const conts = [1, 3].map((car) => { const m = new T.Mesh(contGeo, extMat); grp.add(m); return { m, car, state: 'on', t: 0 }; });
      const NR = 90, rp = new Float32Array(NR * 4 * 3), rn = [], rc = [], rg = [], ri = [];
      for (let i = 0; i < NR; i++) {
        for (let k = 0; k < 4; k++) { rn.push(0, 1, 0); const c = hexRGB(k === 0 || k === 3 ? 0x8a9099 : 0x2b3036); rc.push(c[0], c[1], c[2]); rg.push(0); }
        if (i < NR - 1) { const a = i * 4; for (const k of [0, 2]) ri.push(a + k, a + k + 4, a + k + 1, a + k + 1, a + k + 4, a + k + 5); ri.push(a + 1, a + 5, a + 2, a + 2, a + 5, a + 6); }
      }
      const railGeo = new T.BufferGeometry();
      railGeo.setAttribute('position', new T.BufferAttribute(rp, 3));
      railGeo.setAttribute('normal', new T.Float32BufferAttribute(rn, 3));
      railGeo.setAttribute('aCol', new T.Float32BufferAttribute(rc, 3));
      railGeo.setAttribute('aGlow', new T.Float32BufferAttribute(rg, 1));
      railGeo.setIndex(ri);
      const rail = new T.Mesh(railGeo, extMat); rail.frustumCulled = false; grp.add(rail);
      const pylGeo = Bld().box(0x3d434b, 2.6, 180, 2.6, 0, -91, 0).box(0x2b3036, 7, 1.2, 3, 0, -1.2, 0).geo(), pylons = [];
      for (let i = 0; i < 9; i++) { const m = new T.Mesh(pylGeo, extMat); grp.add(m); pylons.push({ m, z: 0 }); }
      const cable = new T.Mesh(new T.BoxGeometry(0.1, 0.1, 1), glowMat(0xffb04a)); cable.visible = false; grp.add(cable);
      const lockRing = new T.Mesh(new T.TorusGeometry(1.6, 0.09, 4, 28), glowMat(0x35e0ff)); lockRing.visible = false; grp.add(lockRing);

      /* ---- planets */
      const planetU = { uA: { value: V3() }, uB: { value: V3() }, uCl: { value: V3(0.9, 0.9, 0.92) }, uAtm: { value: V3() }, uSun: { value: V3(0.5, 0.45, -0.74).normalize() }, uCity: { value: 0 } };
      const planet = new T.Mesh(new T.SphereGeometry(1, 48, 32), new T.ShaderMaterial({
        uniforms: planetU,
        vertexShader: 'varying vec3 vN; varying vec3 vP; varying vec3 vW; void main(){ vP=position; vN=normalize(mat3(modelMatrix)*normal); vec4 w=modelMatrix*vec4(position,1.0); vW=w.xyz; gl_Position=projectionMatrix*viewMatrix*w; }',
        fragmentShader: 'uniform vec3 uA; uniform vec3 uB; uniform vec3 uCl; uniform vec3 uAtm; uniform vec3 uSun; uniform float uCity; varying vec3 vN; varying vec3 vP; varying vec3 vW;' +
          'void main(){ vec3 n=normalize(vN);' +
          ' float a=sin(vP.x*5.1+sin(vP.y*4.3+1.7)*1.6)*sin(vP.y*6.7+sin(vP.z*5.9)*1.4)*sin(vP.z*4.9+sin(vP.x*3.7)*1.8);' +
          ' float b=sin(vP.x*13.0+vP.y*9.0)*sin(vP.y*17.0-vP.z*11.0)*sin(vP.z*15.0+vP.x*7.0);' +
          ' float land=smoothstep(-0.05,0.25,a+b*0.35); vec3 c=mix(uA,uB,land);' +
          ' float cl=smoothstep(0.15,0.7,sin(vP.y*9.0+sin(vP.x*6.0)*2.0)*sin(vP.x*7.0+vP.z*5.0)); c=mix(c,uCl,cl*0.6);' +
          ' float d=max(dot(n,uSun),0.0); float night=1.0-smoothstep(0.0,0.3,d);' +
          ' float city=step(0.86,fract(sin(dot(floor(vP*70.0),vec3(12.9,78.2,37.7)))*43758.5))*land*night*uCity;' +
          ' vec3 v=normalize(cameraPosition-vW); float rim=pow(1.0-max(dot(n,v),0.0),2.5);' +
          ' gl_FragColor=vec4(c*(0.05+d*1.05)+vec3(1.0,0.8,0.5)*city+uAtm*rim*(0.2+d*0.9),1.0); }'
      }));
      planet.visible = false; grp.add(planet);

      /* ---- hyperspace */
      const tunU = { uT: { value: 0 }, uK: { value: 1 } };
      const tunnel = new T.Mesh(new T.CylinderGeometry(26, 26, 800, 48, 1, true), new T.ShaderMaterial({
        uniforms: tunU, side: T.BackSide,
        vertexShader: 'varying vec2 vU; void main(){ vU=uv; gl_Position=projectionMatrix*modelViewMatrix*vec4(position,1.0); }',
        fragmentShader: 'uniform float uT; uniform float uK; varying vec2 vU; float h(float n){ return fract(sin(n*91.345)*47453.5453); }' +
          'void main(){ float a=vU.x*140.0; float id=floor(a); float f=fract(a)-0.5; float r=h(id); float r2=h(id+31.7);' +
          ' float v=fract(vU.y*(2.0+r*3.0)-uT*(0.9+r*1.8)+r2); float streak=pow(1.0-v,5.0+r*8.0)*smoothstep(0.5,0.1+0.3*r2,abs(f));' +
          ' float cloud=(0.5+0.5*sin(vU.x*37.699+uT*0.7+sin(vU.y*40.0+uT*6.0)*1.3))*(0.5+0.5*sin(vU.x*12.566-uT*0.4+vU.y*9.0));' +
          ' vec3 c=vec3(0.02,0.08,0.28)+vec3(0.05,0.25,0.7)*cloud*0.6+vec3(0.75,0.9,1.0)*streak*1.5; gl_FragColor=vec4(c*uK,1.0); }'
      }));
      tunnel.rotation.x = PI / 2; tunnel.position.z = -380; tunnel.visible = false; tunnel.frustumCulled = false; grp.add(tunnel);
      const tunEnd = new T.Mesh(new T.CircleGeometry(27, 24), new T.MeshBasicMaterial({ color: 0xd6ecff, fog: false })); tunEnd.material.toneMapped = false;
      tunEnd.position.z = -778; tunEnd.visible = false; grp.add(tunEnd);
      const NS = 420, lp = new Float32Array(NS * 6), le = new Float32Array(NS * 2);
      for (let i = 0; i < NS; i++) {
        const a = rnd() * PI * 2, r = 18 + rnd() * 240, x = Math.cos(a) * r, y = Math.sin(a) * r, z = -380 + rnd() * 400;
        lp.set([x, y, z, x, y, z], i * 6); le[i * 2 + 1] = 1;
      }
      const lgeo = new T.BufferGeometry(); lgeo.setAttribute('position', new T.BufferAttribute(lp, 3)); lgeo.setAttribute('aEnd', new T.BufferAttribute(le, 1));
      const streakU = { uLen: { value: 0 }, uOp: { value: 1 } };
      const streaks = new T.LineSegments(lgeo, new T.ShaderMaterial({
        uniforms: streakU, transparent: true, depthWrite: false, blending: T.AdditiveBlending,
        vertexShader: 'attribute float aEnd; uniform float uLen; varying float vE; void main(){ vE=aEnd; vec3 p=position; p.z+=aEnd*uLen; gl_Position=projectionMatrix*modelViewMatrix*vec4(p,1.0); }',
        fragmentShader: 'uniform float uOp; varying float vE; void main(){ gl_FragColor=vec4(mix(vec3(0.6,0.8,1.0),vec3(1.0),vE)*uOp,1.0); }'
      }));
      streaks.visible = false; streaks.frustumCulled = false; grp.add(streaks);
      const flashMat = new T.MeshBasicMaterial({ color: 0xffffff, transparent: true, opacity: 0, side: T.BackSide, depthWrite: false, fog: false }); flashMat.toneMapped = false;
      const flash = new T.Mesh(new T.SphereGeometry(13, 12, 8), flashMat); flash.renderOrder = 10; grp.add(flash);

      /* ---- pooled laser bolts and explosions */
      const boltGeo = new T.BoxGeometry(0.2, 0.2, 6);
      const mkBolts = (n, hex) => { const mat = glowMat(hex), arr = []; for (let i = 0; i < n; i++) { const m = new T.Mesh(boltGeo, mat); m.visible = false; grp.add(m); arr.push({ m, on: false, vx: 0, vy: 0, vz: 0, age: 0, tgt: null }); } return arr; };
      const pBolts = mkBolts(20, 0xff2a1a), eBolts = mkBolts(24, 0xff4433);
      const exGeo = new T.SphereGeometry(1, 10, 8), booms = [];
      for (let i = 0; i < 6; i++) { const m = new T.Mesh(exGeo, glowMat(0xff9a3c, 0)); m.visible = false; grp.add(m); booms.push({ m, age: 9 }); }

      return { grp, dome, domeU, stars, ground, groundU, spires, spireGeos, pad, yard, yardDefs, sd, ties, cars, conts, rail, rp, NR, pylons, cable, lockRing,
               planet, planetU, tunnel, tunEnd, tunU, streaks, streakU, flash, flashMat, pBolts, eBolts, booms };
    }

    return { EXT, INT, buildInterior, buildEnv };
  }

  root.TPFalconSets = { create };
})(window);

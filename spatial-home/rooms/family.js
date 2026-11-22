/* Minest · Spatial Home · Rooms 2.0 — the family: five characters who live in the rooms of this page.
     · Peck  爸爸   blue tunic, a sword on his back
     · Cece  妈妈   blue blouse with gold trim, long hair under a circlet, a glowing slate at her hip
     · Joy   哥哥   green tunic and the long green cap, a wooden shield on his back
     · Luke  弟弟   red tunic, a blue scarf, shorts
     · the white Bichon Frise, who stays near Luke
   All five are drawn in the cel look of Clun's little traveller (clun/js/hero.js): jointed primitives, the two-tone
   toon light of clun/js/painterly.js (loaded as it is), and an ink outline round every part.
   Spatial Home's own files stay as they are: this file wraps SpatialRoom.build, puts the family into the room that was
   built and moves them from the room's tick. They stand as for a family photo before where you come in, then wander:
   each has a patch of free floor (the room's solids and the standing furniture are kept clear). Tap one: it turns to
   you, waves (the dog hops) and a card says who it is. */
(function (root) {
  'use strict';
  var THREE = root.THREE, SR = root.SpatialRoom; if (!THREE || !SR || !SR.build) return;
  var PI = Math.PI, Paint = root.Clun && root.Clun.Paint;
  var INK = new THREE.MeshBasicMaterial({ color: 0x241c2c, side: THREE.BackSide }), MATS = {}, V = new THREE.Vector3();
  function mat(hex) {
    if (MATS[hex]) return MATS[hex];
    var m = new THREE.MeshStandardMaterial({ color: new THREE.Color(hex).convertSRGBToLinear(), roughness: 0.85, metalness: 0 });
    return (MATS[hex] = Paint && Paint.toon ? Paint.toon(m, { cel: true }) : m);
  }
  /* a part: geometry, colour, place; o = { s: scale, r: rotation, ink: outline width in metres (0 = none) } */
  function part(parent, geo, hex, x, y, z, o) {
    o = o || {}; var m = new THREE.Mesh(geo, typeof hex === 'number' ? mat(hex) : hex); m.position.set(x || 0, y || 0, z || 0); m.castShadow = true;
    if (o.s) m.scale.set(o.s[0], o.s[1], o.s[2]); if (o.r) m.rotation.set(o.r[0], o.r[1], o.r[2]);
    var t = o.ink == null ? 0.011 : o.ink;
    if (t) { if (!geo.boundingBox) geo.computeBoundingBox(); geo.boundingBox.getSize(V); var k = new THREE.Mesh(geo, INK);
      k.scale.set(1 + 2 * t / Math.max(V.x * m.scale.x, 0.01), 1 + 2 * t / Math.max(V.y * m.scale.y, 0.01), 1 + 2 * t / Math.max(V.z * m.scale.z, 0.01)); k.userData.ink = true; m.add(k); }
    parent.add(m); return m;
  }
  var UP = new THREE.Vector3(0, 1, 0);
  var EYEWHITE = new THREE.MeshBasicMaterial({ color: 0xfdfaf4 });
  /* once a figure is built, the parts of each joint are welded by material (and their outlines into one): a third of the draw calls */
  function weld(list) {
    var n = 0, ni = 0, o = 0, oi = 0, v = new THREE.Vector3(), nm = new THREE.Matrix3();
    list.forEach(function (e) { n += e[0].attributes.position.count; ni += e[0].index.count; });
    var P = new Float32Array(n * 3), N = new Float32Array(n * 3), I = new (n > 65535 ? Uint32Array : Uint16Array)(ni);
    list.forEach(function (e) {
      var p = e[0].attributes.position, q = e[0].attributes.normal, ix = e[0].index.array, i; nm.getNormalMatrix(e[1]);
      for (i = 0; i < p.count; i++) {
        v.fromBufferAttribute(p, i).applyMatrix4(e[1]); P[(o + i) * 3] = v.x; P[(o + i) * 3 + 1] = v.y; P[(o + i) * 3 + 2] = v.z;
        v.fromBufferAttribute(q, i).applyMatrix3(nm).normalize(); N[(o + i) * 3] = v.x; N[(o + i) * 3 + 1] = v.y; N[(o + i) * 3 + 2] = v.z;
      }
      for (i = 0; i < ix.length; i++) I[oi + i] = ix[i] + o; o += p.count; oi += ix.length;
    });
    var g = new THREE.BufferGeometry(); g.setAttribute('position', new THREE.BufferAttribute(P, 3)); g.setAttribute('normal', new THREE.BufferAttribute(N, 3)); g.setIndex(new THREE.BufferAttribute(I, 1)); return g;
  }
  function bake(fig) {
    var joints = []; fig.traverse(function (o) { if (!o.isMesh && !o.isSprite) joints.push(o); });
    joints.forEach(function (j) {
      var by = {}, keys = [];
      function put(m, mx) { var k = m.material.uuid; if (!by[k]) { by[k] = { mat: m.material, ink: !!m.userData.ink, list: [] }; keys.push(k); } by[k].list.push([m.geometry, mx]); }
      j.children.filter(function (c) { return c.isMesh && !c.userData.keep && c.geometry.index && c.geometry.attributes.normal; }).forEach(function (c) {
        c.updateMatrix(); put(c, c.matrix.clone()); c.children.forEach(function (k) { if (k.isMesh) { k.updateMatrix(); put(k, c.matrix.clone().multiply(k.matrix)); } }); j.remove(c);
      });
      keys.forEach(function (k) { var m = new THREE.Mesh(weld(by[k].list), by[k].mat); m.castShadow = !by[k].ink; m.userData.ink = by[k].ink; j.add(m); });
    });
    return fig;
  }
  function J(parent, x, y, z) { var g = new THREE.Group(); g.position.set(x, y, z); parent.add(g); return g; }
  function sph(r, a, b) { return new THREE.SphereGeometry(r, a || 14, b || 10); }
  function cyl(r0, r1, h, n) { return new THREE.CylinderGeometry(r0, r1, h, n || 12); }
  function box(w, h, d) { return new THREE.BoxGeometry(w, h, d); }
  function limb(parent, hex, len, r0, r1) { return part(parent, cyl(r0, r1, len, 10), hex, 0, -len / 2, 0); }
  function blob(r) { var s = new THREE.Mesh(new THREE.CircleGeometry(r, 20), new THREE.MeshBasicMaterial({ color: 0x10141c, transparent: true, opacity: 0.2, depthWrite: false })); s.rotation.x = -PI / 2; s.position.y = 0.012; s.renderOrder = 1; s.userData.keep = true; return s; }
  function label(name, zh) {
    var c = document.createElement('canvas'); c.width = 320; c.height = 96; var x = c.getContext('2d');
    x.font = '700 44px Georgia, "Times New Roman", serif'; var w1 = x.measureText(name).width; x.font = '500 30px "PingFang SC", "Noto Sans SC", sans-serif'; var w2 = x.measureText(zh).width, w = w1 + w2 + 54, x0 = (320 - w) / 2;
    x.fillStyle = 'rgba(20,18,30,0.62)'; var r = 30; x.beginPath(); x.moveTo(x0 + r, 18); x.arcTo(x0 + w, 18, x0 + w, 78, r); x.arcTo(x0 + w, 78, x0, 78, r); x.arcTo(x0, 78, x0, 18, r); x.arcTo(x0, 18, x0 + w, 18, r); x.closePath(); x.fill();
    x.strokeStyle = 'rgba(255,226,160,0.75)'; x.lineWidth = 2; x.stroke();
    x.textBaseline = 'middle'; x.fillStyle = '#fff6df'; x.font = '700 44px Georgia, "Times New Roman", serif'; x.fillText(name, x0 + 20, 49);
    x.fillStyle = '#ffd98a'; x.font = '500 30px "PingFang SC", "Noto Sans SC", sans-serif'; x.fillText(zh, x0 + 20 + w1 + 14, 50);
    var t = new THREE.CanvasTexture(c); t.encoding = THREE.sRGBEncoding;
    var s = new THREE.Sprite(new THREE.SpriteMaterial({ map: t, transparent: true, depthWrite: false, fog: false })); s.scale.set(0.76, 0.228, 1); s.renderOrder = 5; return s;
  }

  /* ───────────────────────── a person (built 1.6 m tall like the traveller, then scaled to S.h) ───────────────────────── */
  function person(S) {
    var g = new THREE.Group(), body = J(g, 0, 0, 0), hips = J(body, 0, 0.8, 0), i;
    var legs = [-1, 1].map(function (s) {
      var hip = J(hips, s * 0.085, -0.02, 0); limb(hip, S.pants, 0.38, 0.075, 0.062);
      var knee = J(hip, 0, -0.38, 0); limb(knee, S.shin || S.pants, 0.34, 0.058, 0.05);
      part(knee, cyl(0.066, 0.06, 0.15, 10), S.boot, 0, -0.285, 0); part(knee, box(0.12, 0.1, 0.23), S.boot, 0, -0.385, 0.045);
      part(knee, cyl(0.07, 0.07, 0.03, 10), S.bootTop || S.boot, 0, -0.2, 0, { ink: 0 });
      return { hip: hip, knee: knee };
    });
    var torso = J(hips, 0, 0, 0);
    if (S.skirt) {                                                             // a long skirt, a trim band at its hem
      part(torso, cyl(0.168, 0.3, 0.6, 18), S.skirt, 0, -0.24, 0); part(torso, cyl(0.302, 0.306, 0.045, 18), S.trim, 0, -0.52, 0, { ink: 0 });
    } else {
      part(torso, cyl(0.17, 0.218, 0.3, 14), S.top, 0, 0, 0); part(torso, cyl(0.22, 0.223, 0.04, 14), S.trim, 0, -0.132, 0, { ink: 0 });
    }
    part(torso, cyl(0.155, 0.172, 0.3, 14), S.top, 0, 0.28, 0);
    part(torso, cyl(0.178, 0.178, 0.055, 14), S.belt, 0, 0.13, 0, { ink: 0.006 }); part(torso, box(0.06, 0.05, 0.02), S.buckle || 0xe8c35a, 0, 0.13, 0.176, { ink: 0.004 });
    part(torso, cyl(0.082, 0.1, 0.07, 12), S.collar || S.trim, 0, 0.44, 0, { ink: 0.006 });
    if (S.chest) part(torso, box(0.11, 0.2, 0.012), S.chest, 0, 0.31, 0.158, { ink: 0 });                      // a panel down the chest
    var arms = [-1, 1].map(function (s) {
      var sh = J(torso, s * 0.2, 0.4, 0); part(sh, sph(0.068, 10, 8), S.top, 0, 0, 0); limb(sh, S.top, 0.26, 0.06, 0.05);
      part(sh, cyl(0.053, 0.053, 0.03, 10), S.trim, 0, -0.25, 0, { ink: 0 });
      var el = J(sh, 0, -0.26, 0); limb(el, S.sleeve, 0.24, 0.046, 0.04);
      if (S.bracer) part(el, cyl(0.048, 0.044, 0.11, 10), S.bracer, 0, -0.16, 0, { ink: 0.005 });
      part(el, sph(0.05, 10, 8), S.skin, 0, -0.265, 0);
      sh.rotation.z = s * 0.16; el.rotation.x = -0.2;
      return { sh: sh, el: el };
    });
    var neck = J(torso, 0, 0.47, 0), head = J(neck, 0, 0.05 + 0.13 * S.head, 0); head.scale.setScalar(S.head);
    part(neck, cyl(0.045, 0.05, 0.1, 8), S.skin, 0, 0.03, 0, { ink: 0 });
    part(head, sph(0.15, 22, 16), S.skin, 0, 0, 0, { s: [1, 1.04, 0.97] });
    [-1, 1].forEach(function (s) {
      part(head, sph(0.04, 14, 10), 0x2a2026, s * 0.058, 0.0, 0.127, { s: [0.86, 1.22, 0.3], ink: 0 });                             // the eye: lash line, white, iris, pupil, light
      part(head, sph(0.035, 14, 10), EYEWHITE, s * 0.058, -0.007, 0.131, { s: [0.8, 1.16, 0.36], ink: 0 });
      part(head, sph(0.027, 12, 10), S.eye, s * 0.056, -0.012, 0.139, { s: [0.8, 1.12, 0.32], ink: 0 });
      part(head, sph(0.014, 10, 8), 0x1c1620, s * 0.055, -0.013, 0.1445, { s: [0.8, 1.12, 0.3], ink: 0 });
      part(head, sph(0.008, 8, 6), EYEWHITE, s * 0.055 + 0.01, 0.006, 0.148, { ink: 0 });
      part(head, box(0.056, 0.01, 0.01), S.hair, s * 0.058, 0.064, 0.136, { r: [0, 0, s * -0.14 * (S.brow || 1)], ink: 0 });        // the brow
      part(head, sph(0.022, 8, 6), 0xf0998c, s * 0.092, -0.052, 0.118, { s: [1.3, 0.6, 0.3], ink: 0 });                             // a touch of colour on the cheek
      part(head, new THREE.ConeGeometry(0.034, 0.12, 8), S.skin, s * 0.158, 0.012, -0.012, { r: [-0.25, 0, s * -1.05], s: [1, 1, 0.55], ink: 0.006 });   // the long pointed ear
    });
    part(head, sph(0.012, 8, 6), 0xd9a085, 0, -0.03, 0.149, { ink: 0 });
    part(head, sph(0.013, 8, 6), 0xb5594c, 0, -0.074, 0.138, { s: [S.smile || 1.9, 0.55, 0.5], ink: 0 });
    var sway = hair(head, S), acc = S.gear ? S.gear(torso, hips) : null;
    var lb = label(S.name, S.zh); lb.position.y = 1.9 + (S.head - 1) * 0.34; g.add(lb); g.add(blob(0.27));
    bake(g); g.scale.setScalar(S.h / 1.62);
    return { root: g, body: body, hips: hips, torso: torso, legs: legs, arms: arms, neck: neck, head: head, sway: sway, label: lb, acc: acc, hipY: 0.8 };
  }
  /* hair: a cap of it, then the style. Returns the joints that sway. */
  function hair(head, S) {
    var H = S.hair, sway = [], i, a;
    part(head, new THREE.SphereGeometry(0.162, 22, 14, 0, PI * 2, 0, PI * 0.56), H, 0, 0.018, -0.012);
    /* a lock from a root buried in the cap to a tip */
    function spike(bx, by, bz, tx, ty, tz, r) {
      var d = new THREE.Vector3(tx - bx, ty - by, tz - bz), h = d.length(), m = part(head, new THREE.ConeGeometry(r, h, 7), H, (bx + tx) / 2, (by + ty) / 2, (bz + tz) / 2, { ink: 0.006 });
      m.quaternion.setFromUnitVectors(UP, d.normalize()); return m;
    }
    function tuft(x, y, z, rx, rz, r, h) { return part(head, new THREE.ConeGeometry(r || 0.05, h || 0.13, 7), H, x, y, z, { r: [rx, 0, rz], ink: 0.007 }); }
    if (S.style === 'long') {                                                    // Cece: parted, long down her back, a lock before each ear, a gold circlet with a blue stone
      [-1, 1].forEach(function (s) {
        part(head, sph(0.09, 12, 10), H, s * 0.075, 0.075, 0.085, { s: [1.05, 0.62, 0.62], r: [0.25, 0, s * -0.55], ink: 0.007 });
        var lock = J(head, s * 0.135, -0.01, 0.055); part(lock, cyl(0.03, 0.018, 0.3, 8), H, 0, -0.15, 0, { r: [0.06, 0, s * 0.06], ink: 0.007 }); sway.push({ j: lock, k: 0.06, ax: 'x' });
      });
      var back = J(head, 0, 0.02, -0.1); part(back, cyl(0.135, 0.105, 0.5, 14), H, 0, -0.25, -0.012, { s: [1, 1, 0.5] }); part(back, sph(0.105, 12, 8), H, 0, -0.5, -0.012, { s: [1, 0.5, 0.5], ink: 0.007 }); sway.push({ j: back, k: 0.05, ax: 'x' });
      part(head, new THREE.TorusGeometry(0.153, 0.008, 6, 28), 0xe8c35a, 0, 0.062, 0, { r: [PI / 2 - 0.16, 0, 0], ink: 0 });
      part(head, sph(0.017, 8, 6), 0x4aa8ff, 0, 0.088, 0.15, { s: [1, 1.3, 0.6], ink: 0.004 });
    } else {
      [[-0.1, -0.118, 0.07], [-0.052, -0.07, 0.062], [-0.004, -0.02, 0.07], [0.046, 0.04, 0.06], [0.096, 0.112, 0.068]].forEach(function (f) {   // the fringe: locks that stop above the brows
        spike(f[0], S.style === 'cap' ? 0.09 : 0.118, S.style === 'cap' ? 0.1 : 0.082, f[1], f[2], 0.128 + 0.022 * (1 - Math.abs(f[1]) / 0.12), 0.04); });
      [-1, 1].forEach(function (s) { spike(s * 0.12, 0.06, 0.03, s * 0.148, -0.045, 0.062, 0.034); });                               // a lock before each ear
      for (i = 0; i < 7; i++) { a = (i / 6) * PI * 1.1 - PI * 0.05; spike(Math.cos(a) * 0.1, 0.04, -Math.sin(a) * 0.1 - 0.02, Math.cos(a) * 0.185, -0.075, -Math.sin(a) * 0.17 - 0.03, 0.058); }   // and the nape
      if (S.style === 'spiky') [[0, 0.165, 0.0, 0, 0.1], [-0.07, 0.15, 0.03, 0.2, 0.6], [0.075, 0.15, 0.02, 0.15, -0.6], [0.0, 0.15, -0.07, -0.6, 0], [-0.05, 0.16, -0.03, -0.3, 0.35], [0.06, 0.16, -0.04, -0.3, -0.4]].forEach(function (t) { tuft(t[0], t[1], t[2], t[3], t[4], 0.05, 0.15); });
      else if (S.style === 'short') [[0.02, 0.158, 0.02, 0.5, -0.5], [-0.06, 0.15, 0.03, 0.5, 0.1], [0.085, 0.14, 0.0, 0.3, -0.9]].forEach(function (t) { tuft(t[0], t[1], t[2], t[3], t[4], 0.052, 0.12); });
      else if (S.style === 'cap') {                                              // Joy: the long green cap, its tail swaying behind
        var C = S.cap; part(head, new THREE.SphereGeometry(0.183, 20, 12, 0, PI * 2, 0, PI * 0.47), C, 0, 0.03, -0.012, { r: [-0.3, 0, 0] });
        part(head, new THREE.TorusGeometry(0.178, 0.016, 6, 24), S.capBand || C, 0, 0.046, -0.01, { r: [PI / 2 - 0.3, 0, 0], ink: 0.004 });
        var prev = J(head, 0, 0.13, -0.09), r0 = 0.115; prev.rotation.x = -1.25;
        for (i = 0; i < 4; i++) { var seg = J(prev, 0, i ? 0.105 : 0, 0), r1 = r0 * 0.68; part(seg, cyl(r1, r0, 0.115, 10), C, 0, 0.052, 0); seg.rotation.x = i ? -0.3 : 0; sway.push({ j: seg, k: 0.07, ax: 'x', base: seg.rotation.x }); prev = seg; r0 = r1; }
      }
    }
    return sway;
  }

  var FAMILY = [
    { id: 'peck', name: 'Peck', zh: '爸爸', say: '一家之主。蓝色外衣，背上一把长剑，走到哪儿都先看看风景。', h: 1.8, head: 0.86, speed: 0.95, style: 'short', brow: 1.4, smile: 1.6,
      skin: 0xf0c49c, hair: 0x2c2019, eye: 0x4b7fd1, top: 0x3d8fd6, trim: 0xf3efe2, chest: 0xf3efe2, sleeve: 0xefe6d2, bracer: 0x7a4f2c, pants: 0xcdb183, boot: 0x6a4428, bootTop: 0x8a5e36, belt: 0x5c3b22,
      gear: function (t) {
        part(t, box(0.045, 0.56, 0.02), 0x5c3b22, 0, 0.27, 0.165, { r: [0, 0, 0.72], ink: 0.004 }); part(t, box(0.045, 0.56, 0.02), 0x5c3b22, 0, 0.27, -0.165, { r: [0, 0, -0.72], ink: 0.004 });   // the strap
        var s = J(t, 0.02, 0.3, -0.21); s.rotation.z = 0.72;
        part(s, box(0.085, 0.62, 0.034), 0x2f4f9a, 0, -0.06, 0); part(s, box(0.09, 0.05, 0.04), 0xe8c35a, 0, -0.36, 0, { ink: 0 }); part(s, box(0.09, 0.04, 0.04), 0xe8c35a, 0, 0.22, 0, { ink: 0 });
        part(s, box(0.24, 0.04, 0.05), 0x5a4fb8, 0, 0.28, 0); part(s, cyl(0.02, 0.02, 0.18, 8), 0x5a4fb8, 0, 0.39, 0); part(s, sph(0.03, 8, 6), 0xe8c35a, 0, 0.49, 0, { ink: 0.005 });
      } },
    { id: 'cece', name: 'Cece', zh: '妈妈', say: '蓝衣金饰，长发束着一道金环；腰间那块石板会发光，里面记着全家的事。', h: 1.66, head: 0.9, speed: 0.85, style: 'long', brow: 0.5, smile: 1.7, stride: 0.34,
      skin: 0xf6cfae, hair: 0x3a2518, eye: 0x3fa98a, top: 0x2f63bd, trim: 0xe8c35a, collar: 0xf5f0e6, chest: 0xe8c35a, sleeve: 0xf5f0e6, bracer: 0x2f63bd, pants: 0x3b3440, boot: 0x6a4428, belt: 0xe8c35a, buckle: 0x4aa8ff, skirt: 0xf3ecdd,
      gear: function (t) {
        part(t, box(0.11, 0.16, 0.026), 0x3a3550, 0.2, 0.02, 0.06, { r: [0, 0.5, -0.12], ink: 0.005 });
        var gl = new THREE.Mesh(box(0.078, 0.11, 0.004), new THREE.MeshBasicMaterial({ color: 0x69e6ff })); gl.position.set(0.2075, 0.02, 0.073); gl.rotation.set(0, 0.5, -0.12); gl.userData.keep = true; t.add(gl); return gl;
      } },
    { id: 'joy', name: 'Joy', zh: '哥哥', say: '绿帽绿衣，背着一面木盾。弟弟和小狗去哪儿，他就跟到哪儿。', h: 1.42, head: 1.0, speed: 1.1, style: 'cap', brow: 1.0, smile: 2.2,
      skin: 0xf3c7a2, hair: 0x33231a, eye: 0x4b7fd1, top: 0x4f9e3c, trim: 0x3a7a2c, cap: 0x4f9e3c, capBand: 0x3a7a2c, collar: 0xf3efe2, sleeve: 0xf3efe2, bracer: 0x8a5e36, pants: 0xeee6d2, boot: 0x7a4f2c, belt: 0x6a4428,
      gear: function (t) {
        var s = J(t, 0, 0.27, -0.2); part(s, cyl(0.2, 0.2, 0.035, 20), 0xa9743f, 0, 0, 0, { r: [PI / 2, 0, 0] }); part(s, new THREE.TorusGeometry(0.195, 0.016, 6, 24), 0xb9c2cc, 0, 0, -0.012, { ink: 0 });
        part(s, cyl(0.07, 0.07, 0.02, 14), 0xd24a3c, 0, 0, -0.026, { r: [PI / 2, 0, 0], ink: 0 }); part(t, box(0.04, 0.5, 0.02), 0x6a4428, 0, 0.27, 0.166, { r: [0, 0, -0.72], ink: 0.004 });
      } },
    { id: 'luke', name: 'Luke', zh: '弟弟', say: '红衣蓝围巾，全家最小，也跑得最快。小白总跟在他脚边。', h: 1.14, head: 1.14, speed: 1.2, style: 'spiky', brow: 0.6, smile: 2.4, hop: true,
      skin: 0xf6cdab, hair: 0x3b281c, eye: 0x6a4a2c, top: 0xd5493a, trim: 0xf2c84b, collar: 0x3f7fd0, sleeve: 0xf3efe2, pants: 0x8a6a45, shin: 0xf6cdab, boot: 0x6a4428, belt: 0x5c3b22,
      gear: function (t) {
        part(t, new THREE.TorusGeometry(0.1, 0.042, 8, 16), 0x3f7fd0, 0, 0.46, 0, { r: [PI / 2, 0, 0], ink: 0.006 });
        var prev = J(t, -0.06, 0.45, -0.1), out = [], i; for (i = 0; i < 3; i++) { var seg = J(prev, 0, i ? -0.1 : 0, 0); part(seg, box(0.08, 0.11, 0.022), 0x3f7fd0, 0, -0.05, 0, { ink: 0.005 }); out.push(seg); prev = seg; } return out;
      } }
  ];

  /* ───────────────────────── the white Bichon Frise (real size: about 28 cm at the shoulder) ───────────────────────── */
  function bichon() {
    var W = 0xfbf8f2, g = new THREE.Group(), body = J(g, 0, 0.2, 0), i, r = (function (s) { return function () { s = (s * 16807) % 2147483647; return s / 2147483647; }; })(7);
    part(body, sph(0.12, 16, 12), W, 0, 0, 0, { s: [1, 0.95, 1.5] });
    for (i = 0; i < 16; i++) { var a = r() * PI * 2, z = (r() - 0.5) * 0.3, rr = 0.045 + r() * 0.03; part(body, sph(rr, 9, 7), W, Math.cos(a) * 0.085, Math.abs(Math.sin(a)) * 0.08 - 0.01 + r() * 0.02, z, { ink: 0.007 }); }
    part(body, sph(0.085, 12, 9), W, 0, 0.03, 0.13); part(body, sph(0.09, 12, 9), W, 0, 0.0, -0.13);
    var legs = [[-1, 1], [1, 1], [-1, -1], [1, -1]].map(function (q) { var j = J(body, q[0] * 0.068, -0.05, q[1] * 0.115); part(j, cyl(0.04, 0.034, 0.13, 8), W, 0, -0.06, 0); part(j, sph(0.046, 10, 8), W, 0, -0.125, 0.008, { s: [1, 0.7, 1.15] }); return j; });
    var neck = J(body, 0, 0.09, 0.15), head = J(neck, 0, 0.07, 0.04);
    part(neck, new THREE.TorusGeometry(0.07, 0.014, 6, 18), 0xd23c3c, 0, 0.0, 0.0, { r: [PI / 2 - 0.5, 0, 0], ink: 0 }); part(neck, sph(0.016, 8, 6), 0xe8c35a, 0, -0.05, 0.062, { ink: 0.003 });
    part(head, sph(0.105, 16, 12), W, 0, 0.0, 0);                                                   // the round powder-puff head
    for (i = 0; i < 18; i++) { var th = r() * PI * 2, ph = r() * PI * 0.62, rr2 = 0.04 + r() * 0.028; var hx = Math.sin(ph) * Math.cos(th) * 0.09, hy = Math.cos(ph) * 0.09 + 0.01, hz = Math.sin(ph) * Math.sin(th) * 0.09; if (hz > 0.05 && hy < 0.05) continue; part(head, sph(rr2, 9, 7), W, hx, hy, hz, { ink: 0.007 }); }
    [-1, 1].forEach(function (s) {
      part(head, sph(0.055, 10, 8), W, s * 0.1, -0.035, -0.005, { s: [0.8, 1.35, 0.9], ink: 0.007 });                  // the ears, lost in the fluff
      part(head, sph(0.019, 10, 8), 0x1a1616, s * 0.043, 0.012, 0.094, { ink: 0 }); part(head, sph(0.006, 6, 5), 0xffffff, s * 0.043 + 0.006, 0.02, 0.11, { ink: 0 });
      part(head, sph(0.036, 10, 8), W, s * 0.03, -0.04, 0.095, { ink: 0.005 });
    });
    part(head, sph(0.05, 12, 9), W, 0, -0.035, 0.085, { s: [1.1, 0.8, 1], ink: 0.005 }); part(head, sph(0.02, 10, 8), 0x1a1616, 0, -0.018, 0.134, { s: [1.2, 0.85, 0.8], ink: 0 });
    var tongue = part(head, box(0.022, 0.006, 0.03), 0xf08a9a, 0, -0.062, 0.118, { r: [0.5, 0, 0], ink: 0 }); tongue.userData.keep = true;
    var tail = J(body, 0, 0.09, -0.17); part(tail, sph(0.05, 10, 8), W, 0, 0.03, -0.01); part(tail, sph(0.058, 10, 8), W, 0, 0.09, 0.0); part(tail, sph(0.05, 10, 8), W, 0, 0.14, 0.035);
    var lb = label('Bichon', '比熊'); lb.position.y = 0.62; lb.scale.set(0.5, 0.15, 1); g.add(lb); g.add(blob(0.2)); bake(g);
    return { root: g, body: body, legs: legs, neck: neck, head: head, tail: tail, tongue: tongue, label: lb, dog: true };
  }
  var DOG = { id: 'bichon', name: 'Bichon', zh: '比熊', say: '白白的一团比熊犬。尾巴一直在摇，最爱跟着 Luke 跑。', h: 0.45, speed: 1.7, dog: true };

  /* ───────────────────────── moving them ───────────────────────── */
  function ease(o, k, v, a) { o[k] += (v - o[k]) * a; }
  function turn(m, yaw, dt, rate) { var d = yaw - m.yaw; d = Math.atan2(Math.sin(d), Math.cos(d)); m.yaw += d * Math.min(1, dt * (rate || 5)); }
  function posePerson(m, t, dt, cam) {
    var R = m.rig, a = Math.min(1, dt * 8), S = m.spec, st = S.stride || 0.55, s, k, ph = m.ph0;
    if (m.moving) {
      m.walk += dt * (S.speed / (0.42 * S.h / 1.62)) ; var w = m.walk, sw = Math.sin(w);
      R.legs[0].hip.rotation.x = sw * st; R.legs[1].hip.rotation.x = -sw * st;
      R.legs[0].knee.rotation.x = Math.max(0, -Math.cos(w)) * 0.7; R.legs[1].knee.rotation.x = Math.max(0, Math.cos(w)) * 0.7;
      for (k = 0; k < 2; k++) { s = k ? 1 : -1; ease(R.arms[k].sh.rotation, 'x', s * sw * 0.5, a); ease(R.arms[k].sh.rotation, 'z', s * 0.16, a); ease(R.arms[k].el.rotation, 'x', -0.35, a); ease(R.arms[k].el.rotation, 'z', 0, a); }
      R.hips.position.y = R.hipY - 0.012 + Math.abs(Math.cos(w)) * 0.022; R.torso.rotation.x = 0.06; R.torso.rotation.y = sw * 0.07; ease(R.head.rotation, 'y', 0, a); ease(R.head.rotation, 'x', 0, a);
    } else {
      var hop = m.hopT > 0 ? Math.abs(Math.sin((0.7 - m.hopT) / 0.7 * PI * 2)) * 0.09 : 0; if (m.hopT > 0) m.hopT -= dt;
      R.hips.position.y += (R.hipY + Math.sin(t * 1.7 + ph) * 0.004 + hop - R.hips.position.y) * a; ease(R.torso.rotation, 'x', 0, a); ease(R.torso.rotation, 'y', Math.sin(t * 0.5 + ph) * 0.05, a);
      for (k = 0; k < 2; k++) { ease(R.legs[k].hip.rotation, 'x', 0, a); ease(R.legs[k].knee.rotation, 'x', 0, a); }
      var wave = m.waveT > 0; if (wave) m.waveT -= dt;
      for (k = 0; k < 2; k++) {
        s = k ? 1 : -1;
        if (k === 1 && wave) { ease(R.arms[1].sh.rotation, 'z', 2.5, a); ease(R.arms[1].sh.rotation, 'x', 0, a); ease(R.arms[1].el.rotation, 'x', 0, a); R.arms[1].el.rotation.z = 0.45 + Math.sin(t * 10) * 0.4; }
        else { ease(R.arms[k].sh.rotation, 'z', s * (0.16 + Math.sin(t * 1.7 + ph) * 0.012), a); ease(R.arms[k].sh.rotation, 'x', Math.sin(t * 0.8 + ph + k) * 0.04, a); ease(R.arms[k].el.rotation, 'x', -0.2, a); ease(R.arms[k].el.rotation, 'z', 0, a); }
      }
      /* the head follows you when you are near */
      var hy = 0, hx = 0;
      if (cam) { var dx = cam.x - m.x, dz = cam.z - m.z, d = Math.hypot(dx, dz); if (d < 7) { hy = Math.atan2(dx, dz) - m.yaw; hy = Math.atan2(Math.sin(hy), Math.cos(hy)); if (Math.abs(hy) > 1.5) hy = 0; hy = Math.max(-0.85, Math.min(0.85, hy)); hx = Math.max(-0.35, Math.min(0.3, -Math.atan2(cam.y - S.h * 0.92, Math.max(d, 0.6)))); } }
      if (!cam || hy === 0) hy = Math.sin(t * 0.37 + ph * 3) * 0.35;
      ease(R.head.rotation, 'y', hy, Math.min(1, dt * 4)); ease(R.head.rotation, 'x', hx, Math.min(1, dt * 4));
    }
    R.sway.forEach(function (q, n) { q.j.rotation[q.ax] = (q.base || 0) + Math.sin(t * 2.1 + n * 0.9 + ph) * q.k * (m.moving ? 2.2 : 1) - (m.moving && q.ax === 'x' ? 0.1 : 0); });
    if (R.acc && R.acc.length) R.acc.forEach(function (j, n) { j.rotation.x = -0.12 - (m.moving ? 0.35 : 0) + Math.sin(t * 2.6 + n * 0.8) * 0.12; });
    else if (R.acc && R.acc.material) R.acc.material.color.setHSL(0.52, 1, 0.62 + Math.sin(t * 2.2) * 0.1);
  }
  function poseDog(m, t, dt) {
    var R = m.rig, a = Math.min(1, dt * 8), k;
    R.tail.rotation.z = Math.sin(t * (m.moving ? 14 : 9)) * 0.5; R.tail.rotation.x = -0.25;
    if (m.moving) {
      m.walk += dt * 15; var w = m.walk; m.sit += (0 - m.sit) * a;
      R.legs[0].rotation.x = Math.sin(w) * 0.7; R.legs[3].rotation.x = Math.sin(w) * 0.7; R.legs[1].rotation.x = -Math.sin(w) * 0.7; R.legs[2].rotation.x = -Math.sin(w) * 0.7;
      R.body.position.y = 0.2 + Math.abs(Math.sin(w)) * 0.025; ease(R.head.rotation, 'z', 0, a); R.head.rotation.x = Math.sin(w * 2) * 0.05;
    } else {
      var hop = m.hopT > 0 ? Math.abs(Math.sin((0.7 - m.hopT) / 0.7 * PI * 3)) * 0.12 : 0; if (m.hopT > 0) m.hopT -= dt;
      m.sit += ((m.idle > 1.2 && !hop ? 1 : 0) - m.sit) * Math.min(1, dt * 4); m.idle += dt;
      for (k = 0; k < 4; k++) ease(R.legs[k].rotation, 'x', k > 1 ? m.sit * 1.25 : -m.sit * 0.12, a);
      R.body.position.y = 0.2 + hop - m.sit * 0.035 + Math.sin(t * 3.2) * 0.003; ease(R.head.rotation, 'z', Math.sin(t * 0.6) > 0.6 ? 0.3 : 0, Math.min(1, dt * 5)); ease(R.head.rotation, 'x', -m.sit * 0.35, a);
    }
    R.body.rotation.x = -m.sit * 0.42; R.tongue.position.y = -0.062 + Math.sin(t * 7) * 0.004;
  }

  function attach(room) {
    var host = room && (room.group || room.holder); if (!host || !room.size) return;
    var G = new THREE.Group(); G.name = 'family'; G.visible = false; host.add(G);
    var M = FAMILY.map(function (S, n) { var rig = person(S); return { spec: S, rig: rig, x: 0, z: 0, yaw: 0, walk: n * 1.3, ph0: n * 1.7, waveT: 0, hopT: 0, wait: 3 + n * 1.4, idle: 0, sit: 0 }; });
    M.push({ spec: DOG, rig: bichon(), x: 0, z: 0, yaw: 0, walk: 0, ph0: 0, waveT: 0, hopT: 0, wait: 2, idle: 0, sit: 0 });
    M.forEach(function (m) { m.rig.root.userData.member = m; G.add(m.rig.root); });
    var solids = null, placed = false, last = 0, born = 0, rnd = Math.random, W = room.size.W, D = room.size.D;
    function free(x, z, mg) {
      if (Math.abs(x) > W - mg || Math.abs(z) > D - mg) return false;
      for (var i = 0; i < solids.length; i++) { var b = solids[i]; if (x > b[0] - mg && x < b[2] + mg && z > b[1] - mg && z < b[3] + mg) return false; }
      return true;
    }
    function clear(x0, z0, x1, z1, mg) { var n = Math.ceil(Math.hypot(x1 - x0, z1 - z0) / 0.2); for (var i = 1; i <= n; i++) if (!free(x0 + (x1 - x0) * i / n, z0 + (z1 - z0) * i / n, mg)) return false; return true; }
    function apart(m, x, z, d) { return M.every(function (o) { return o === m || (Math.hypot(o.x - x, o.z - z) > d && (!o.to || Math.hypot(o.to.x - x, o.to.z - z) > d)); }); }
    /* where they stand when you come in: before you, facing you, on free floor */
    function place() {
      solids = (room.solids || []).slice();
      try { var api = root.MinestSpatialHome && root.MinestSpatialHome.open(), bx = new THREE.Box3();
        (api && api.objects || []).forEach(function (o) { if (!o.group || !o.group.parent || o.group.visible === false) return; bx.setFromObject(o.group); if (bx.min.y < 0.45 && bx.max.y - bx.min.y > 0.35 && bx.max.x - bx.min.x < 6) solids.push([bx.min.x, bx.min.z, bx.max.x, bx.max.z]); }); } catch (e) {}
      var st = room.start || { pos: [0, 1.6, 0], yaw: 0 }, cx = st.pos[0], cz = st.pos[2], fx = -Math.sin(st.yaw), fz = -Math.cos(st.yaw), rx = -fz, rz = fx;
      /* a family photo: the parents behind, the boys and the dog before them. The spot is the one nearest "a few steps
         before you" that is on free floor, in the picture, and has no furniture standing between you and them. */
      var U = [-0.36, 0.38, -0.7, 0.02, 0.62], Vv = [0.5, 0.5, 0, 0.02, -0.12], best = null, bs = 1e9, d, l, i;
      for (d = 1.6; d <= 9; d += 0.2) for (l = -3; l <= 3; l += 0.2) {
        var sc = Math.abs(d - 3.4) + Math.abs(l) * 0.5 + Math.max(0, Math.atan2(Math.abs(l), d) - 0.3) * 9; if (sc >= bs) continue;
        var ok = true, pts = [];
        for (i = 0; i < 5 && ok; i++) { var x = cx + fx * (d + Vv[i]) + rx * (l + U[i]), z = cz + fz * (d + Vv[i]) + rz * (l + U[i]); ok = free(x, z, 0.34); if (ok && !clear(cx, cz, x, z, 0)) sc += 2; pts.push([x, z]); }
        if (ok && sc < bs) { bs = sc; best = pts; }
      }
      if (!best) {                                                              // no room for a line: each takes the nearest free spot before you
        best = []; var cand = [];
        for (d = 1.8; d <= 8; d += 0.35) for (l = -3.5; l <= 3.5; l += 0.35) { var x2 = cx + fx * d + rx * l, z2 = cz + fz * d + rz * l; if (free(x2, z2, 0.32)) cand.push([x2, z2, Math.abs(d - 3.6) + Math.abs(l) * 0.8]); }
        cand.sort(function (p, q) { return p[2] - q[2]; });
        cand.forEach(function (c) { if (best.length < 5 && best.every(function (b) { return Math.hypot(b[0] - c[0], b[1] - c[1]) > 0.62; })) best.push(c); });
        if (best.length < 5) return false;
        best.sort(function (p, q) { return (p[0] * rx + p[1] * rz) - (q[0] * rx + q[1] * rz); });
      }
      M.forEach(function (m, n) { m.x = m.hx = best[n][0]; m.z = m.hz = best[n][1]; m.yaw = Math.atan2(cx - m.x, cz - m.z); m.to = null; m.moving = false; });
      return true;
    }
    function wander(m) {
      var dog = m.spec.dog, buddy = M[3], R = dog ? 1.5 : Math.min(3.2, Math.max(1.4, Math.min(W, D) * 0.5)), i;
      for (i = 0; i < 14; i++) {
        var a = rnd() * PI * 2, r = (dog ? 0.55 : 0.5) + rnd() * R, ox = dog ? buddy.x : m.hx, oz = dog ? buddy.z : m.hz, x = ox + Math.cos(a) * r, z = oz + Math.sin(a) * r;
        if (!free(x, z, 0.36) || !clear(m.x, m.z, x, z, dog ? 0.2 : 0.3) || !apart(m, x, z, dog ? 0.45 : 0.75)) continue;
        m.to = { x: x, z: z }; m.stuck = 0; return;
      }
      m.wait = 2 + rnd() * 3;
    }
    function step(m, t, dt, cam) {
      if (m.to) {
        var dx = m.to.x - m.x, dz = m.to.z - m.z, d = Math.hypot(dx, dz);
        if (d < 0.06 || (m.stuck += dt) > 14) { m.to = null; m.moving = false; m.idle = 0; m.wait = m.spec.dog ? 1.5 + rnd() * 4 : 5 + rnd() * 9; if (m.spec.hop && rnd() < 0.5) m.hopT = 0.7; }
        else { turn(m, Math.atan2(dx, dz), dt, 6); var v = Math.min(d, m.spec.speed * dt), f = Math.cos(Math.max(-1.5, Math.min(1.5, Math.atan2(Math.sin(Math.atan2(dx, dz) - m.yaw), Math.cos(Math.atan2(dx, dz) - m.yaw))))); f = Math.max(0.15, f); m.x += dx / d * v * f; m.z += dz / d * v * f; m.moving = true; }
      } else {
        m.moving = false; m.wait -= dt;
        if (cam && m.waveT <= 0 && !m.spec.dog) { var cd = Math.hypot(cam.x - m.x, cam.z - m.z); if (cd < 3.2 && t - (m.lastWave || -99) > 14) { m.lastWave = t; m.waveT = 1.6; } }
        if (m.face != null) { turn(m, m.face, dt, 4); }
        if (m.wait <= 0 && t - born > 7) { m.face = null; wander(m); }
      }
      m.rig.root.position.set(m.x, 0, m.z); m.rig.root.rotation.y = m.yaw;
      if (m.spec.dog) poseDog(m, t, dt); else posePerson(m, t, dt, cam);
      if (cam) { var ld = Math.hypot(cam.x - m.x, cam.z - m.z); m.rig.label.material.opacity = Math.max(0, Math.min(1, (13 - ld) / 4)) * Math.max(0, Math.min(1, (ld - 0.9) / 0.6)); }
    }
    var tick0 = room.tick, cp = new THREE.Vector3();
    room.tick = function (t) {
      if (tick0) tick0.apply(this, arguments);
      var dt = Math.min(0.05, Math.max(0, t - last)); last = t;
      if (!placed) { if (++born < 3) return; placed = true; born = t;                 // the room's things are standing by its third frame: they are kept clear too
        try { G.visible = place(); } catch (e) { G.visible = false; if (root.console) console.warn('[rooms] family place', e && e.stack || e); } }
      if (!G.visible) return;
      var c = SR.camera, cam = c ? c.getWorldPosition(cp) : null;
      for (var i = 0; i < M.length; i++) step(M[i], t, dt, cam);
    };
    room.family = { group: G, members: M, replace: function () { placed = false; born = 0; } };
    return room;
  }

  /* a tap on one of them: it turns to you, waves (the dog hops), and a small card says who it is */
  var card = null, cardT = 0, ray = new THREE.Raycaster(), ndc = new THREE.Vector2(), down = null, cur = null;
  function show(m) {
    if (!card) { card = document.createElement('div'); card.id = 'fam-card';
      card.style.cssText = 'position:fixed;left:50%;bottom:calc(92px + env(safe-area-inset-bottom));transform:translateX(-50%);z-index:60;max-width:min(440px,calc(100vw - 32px));padding:14px 18px 15px;border-radius:16px;background:rgba(18,17,28,.78);-webkit-backdrop-filter:blur(14px);backdrop-filter:blur(14px);border:1px solid rgba(255,226,160,.45);box-shadow:0 12px 40px rgba(0,0,0,.4);color:#fff6df;font:14px/1.55 -apple-system,"PingFang SC","Noto Sans SC",sans-serif;pointer-events:none;opacity:0;transition:opacity .25s';
      document.body.appendChild(card); }
    card.innerHTML = '<div style="font:700 22px/1.2 Georgia,serif;letter-spacing:.02em">' + m.spec.name + ' <span style="font:500 14px -apple-system,\'PingFang SC\',sans-serif;color:#ffd98a;margin-left:6px">' + m.spec.zh + '</span></div><div style="margin-top:6px;color:#e9e2d0">' + m.spec.say + '</div>';
    card.style.opacity = 1; clearTimeout(cardT); cardT = setTimeout(function () { if (card) card.style.opacity = 0; }, 5200);
  }
  function hit(e) {
    var cam = SR.camera, G = cur && cur.family && cur.family.group; if (!cam || !G || !G.visible || !G.parent) return null;
    ndc.set(e.clientX / root.innerWidth * 2 - 1, -(e.clientY / root.innerHeight) * 2 + 1); ray.setFromCamera(ndc, cam); ray.camera = cam;
    var h = ray.intersectObject(G, true).filter(function (q) { return !q.object.isSprite; })[0]; if (!h) return null;
    var wall = ray.intersectObject(cur.group || cur.holder, true).filter(function (q) { if (q.object.isSprite) return false; for (var o = q.object; o; o = o.parent) if (!o.visible) return false; return true; })[0];   // something of the room stands in front of it
    if (wall && wall.distance < h.distance - 0.05) return null;
    for (var o = h.object; o; o = o.parent) if (o.userData && o.userData.member) return o.userData.member;
    return null;
  }
  document.addEventListener('pointerdown', function (e) { down = e.target && e.target.tagName === 'CANVAS' ? { x: e.clientX, y: e.clientY, t: Date.now(), id: e.pointerId } : null; }, true);
  document.addEventListener('pointerup', function (e) {
    var d = down; down = null; if (!d || d.id !== e.pointerId || Math.abs(e.clientX - d.x) + Math.abs(e.clientY - d.y) > 7 || Date.now() - d.t > 450) return;
    var m = hit(e); if (!m) return;
    e.stopPropagation(); try { e.target.dispatchEvent(new PointerEvent('pointercancel', { pointerId: e.pointerId, bubbles: true })); } catch (er) {}   // the room lets go of this tap: it was for one of the family
    var cam = SR.camera.getWorldPosition(new THREE.Vector3()); m.to = null; m.moving = false; m.wait = 6; m.idle = 0; m.face = Math.atan2(cam.x - m.x, cam.z - m.z);
    if (m.spec.dog) m.hopT = 0.7; else m.waveT = 2.2; show(m);
  }, true);

  var build0 = SR.build;
  SR.build = function () { var room = build0.apply(this, arguments); try { attach(room); cur = room; } catch (e) { if (root.console) console.warn('[rooms] family', e); } return room; };
  root.SpatialFamily = { people: FAMILY, person: person, bichon: bichon, show: show, room: function () { return cur; } };
})(window);

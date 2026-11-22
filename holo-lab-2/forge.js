/* Minest · 全息操作台 2.0 · 装甲拆解 ARMOR BAY — a mode that exists for the motion.
   Your words, cards, charts and notes become holographic armour plates locked around an arc-reactor core.
     spread two fingers / wheel in   the armour comes apart into an exploded view, layer by layer, tethered to the core
     flick empty space               the whole assembly spins and keeps turning
     tap a plate                     it flies out to you and its text opens in the data panel
     drag a plate                    pull it off the assembly; let go and it snaps back with a tumble
   Registered with 1.0's own HL.register before HL.start(), so the dock, keyboard and tool strip treat it like any other mode. */
(function () {
  'use strict';
  var HL = window.HL, T = window.THREE; if (!HL || !T || !HL.register) return;
  var F = { id: 'forge', zh: '装甲拆解', en: 'ARMOR BAY', plates: [], sel: -1, root: null, spin: 0, auto: true, E: 0 };
  var COL = ['#6fe3ff', '#ffb454', '#b58cff', '#7dffb0', '#ff8fb1', '#9fc4ff'], PW = 0.9, PH = 0.545, NEAR = 0.52;   // NEAR: explode is complete once the camera is this fraction of the way home
  function clamp(v, a, b) { return v < a ? a : v > b ? b : v; }
  function reduce() { return !!HL.layout().settings.reduce; }
  var ray = new T.Raycaster(), v2 = new T.Vector2(), tmp = new T.Vector3(), tmp2 = new T.Vector3(), tmp3 = new T.Vector3(), q1 = new T.Quaternion(), q2 = new T.Quaternion(), eul = new T.Euler();

  F.items = function () {
    var c = HL.content, out = [];
    c.lists.forEach(function (l, gi) { l.items.forEach(function (it) { out.push({ it: it, g: gi, gt: l.title }); }); });
    var g = c.lists.length;
    c.charts.forEach(function (it) { out.push({ it: it, g: g, gt: 'Anchor Charts' }); });
    c.knowledge.forEach(function (it) { out.push({ it: it, g: g + 1, gt: it.groupTitle || 'Notes' }); });
    (c.works || []).forEach(function (it) { out.push({ it: it, g: g + 2, gt: it.groupTitle || '' }); });
    return out;
  };
  function wrap(ctx, text, maxW, maxLines) {
    var out = [], line = '', chars = String(text || '').replace(/\s+/g, ' ').match(/[\u3400-\u9fff]|[^ \u3400-\u9fff]+ ?| /g) || [];
    for (var i = 0; i < chars.length; i++) {
      if (ctx.measureText(line + chars[i]).width > maxW && line) { out.push(line.trim()); line = ''; if (out.length === maxLines) break; }
      line += chars[i];
    }
    if (out.length < maxLines && line.trim()) out.push(line.trim());
    else if (out.length === maxLines && i < chars.length) out[maxLines - 1] = out[maxLines - 1].replace(/.{0,2}$/, '…');
    return out;
  }
  function drawPlate(p) {
    var c = p.cv, x = c.getContext('2d'), W = c.width, H = c.height, it = p.it, col = p.col, kz = (HL.KIND && HL.KIND[it.kind]) || ['', 'NODE'];
    x.clearRect(0, 0, W, H);
    x.beginPath(); x.moveTo(6, 6); x.lineTo(W - 46, 6); x.lineTo(W - 6, 46); x.lineTo(W - 6, H - 6); x.lineTo(46, H - 6); x.lineTo(6, H - 46); x.closePath();
    var g = x.createLinearGradient(0, 0, 0, H); g.addColorStop(0, 'rgba(10,52,80,.78)'); g.addColorStop(1, 'rgba(2,14,28,.86)'); x.fillStyle = g; x.fill();
    x.lineWidth = 4; x.strokeStyle = col; x.shadowColor = col; x.shadowBlur = 18; x.stroke(); x.shadowBlur = 0;
    x.fillStyle = col; x.fillRect(6, 6, 8, H - 58);
    x.globalAlpha = 0.5; for (var i = 0; i < 9; i++) x.fillRect(W - 70 - i * 14, H - 26, 6, i % 3 ? 8 : 14); x.globalAlpha = 1;
    x.font = '600 21px ui-monospace, Menlo, monospace'; x.textBaseline = 'top'; x.fillStyle = col;
    x.fillText(((kz[1] || 'NODE') + ' · P-' + ('0' + (p.i + 1)).slice(-2)).toUpperCase(), 30, 22);
    var fam = '-apple-system, "PingFang SC", "Noto Sans CJK SC", system-ui, sans-serif', fs = 54, lines;
    do { x.font = '700 ' + fs + 'px ' + fam; lines = wrap(x, it.title || '（无标题）', W - 64, 2); fs -= 6; } while (fs > 30 && (lines.length > 1 && x.measureText(it.title || '').width > (W - 64) * 1.9));
    x.fillStyle = '#f2fbff'; x.shadowColor = col; x.shadowBlur = 12;
    var y = 58; lines.forEach(function (l) { x.fillText(l, 30, y); y += fs + 14; }); x.shadowBlur = 0;
    x.font = '400 23px ' + fam; x.fillStyle = 'rgba(200,236,250,.82)';
    wrap(x, it.text || p.gt || '', W - 64, y > 150 ? 2 : 3).forEach(function (l) { if (y < H - 60) { x.fillText(l, 30, y + 6); y += 31; } });
    p.tex.needsUpdate = true;
  }

  F.clear = function () {
    if (F.root) { HL.contentRoot.remove(F.root); F.root.traverse(function (o) { if (o.geometry) o.geometry.dispose(); if (o.material) { if (o.material.map) o.material.map.dispose(); o.material.dispose(); } }); }
    F.root = null; F.plates = []; F.sel = -1;
  };
  function title(on) { var e = document.getElementById('v2Title'); if (!e) return; if (!F.t0) F.t0 = e.textContent; e.textContent = on ? '全息操作台 2.0 · 装甲拆解' : F.t0; }
  // the ✋ guide (built by v2.js, which loads after this file) lists this mode's gestures while it is active
  var GUIDE = [['双指张开 / 滚轮', '把装甲拆成分层爆炸图；捏合就合体 · Spread to take it apart, pinch to assemble'], ['单指拖空白', '转动；甩一下，它会继续转 · Drag or flick to spin'],
    ['轻点装甲片', '它飞到面前，资料面板打开 · Tap a plate to call it out'], ['拖动装甲片', '把它拽出来，松手弹回去 · Pull a plate off, let go and it snaps back'], ['双指拖动', '平移 · Two fingers to pan']];
  function guide(on) {
    var g = document.getElementById('v2guide'), dl = g && g.querySelector('dl'); if (!dl) return false;
    if (F.g0 == null) F.g0 = dl.innerHTML;
    dl.innerHTML = on ? GUIDE.map(function (r) { return '<dt>' + r[0] + '</dt><dd>' + r[1] + '</dd>'; }).join('') : F.g0;
    return true;
  }
  F.enter = function () { title(true); F.gOk = guide(true); F.build(); };
  F.exit = function () { title(false); guide(false); F.clear(); };
  F.onContent = function () { F.build(true); HL.refreshTools(); };
  F.onItemEdited = function (it) { F.plates.forEach(function (p) { if (p.it === it) drawPlate(p); }); };
  F.onDetailClosed = function () { F.sel = -1; };
  F.resize = function () { if (F._narrow !== undefined && F._narrow !== HL.narrow) F.build(true); F._narrow = HL.narrow; };

  F.build = function (keep) {
    var rot = keep && F.root ? F.root.rotation.y : 0.4;
    F.clear();
    var N = HL.narrow, per = N ? 6 : 9, list = F.items().slice(0, per * 4), n = list.length;
    HL.empty(n ? '' : '还没有内容 · Nothing to assemble yet');
    var root = F.root = new T.Group(); root.position.copy(HL.CENTER); root.rotation.y = rot; HL.contentRoot.add(root);
    var layers = Math.max(1, Math.ceil(n / per)); F.layers = layers;
    var faceG = new T.PlaneGeometry(PW, PH), edgeG = new T.EdgesGeometry(new T.PlaneGeometry(PW * 1.06, PH * 1.1));
    list.forEach(function (o, i) {
      var L = Math.floor(i / per), inL = Math.min(per, n - L * per), k = i - L * per, col = COL[o.g % COL.length];
      var cv = document.createElement('canvas'); cv.width = 512; cv.height = 310;
      var tex = new T.CanvasTexture(cv); tex.anisotropy = 4;
      var grp = new T.Group(),
          face = new T.Mesh(faceG, new T.MeshBasicMaterial({ map: tex, transparent: true, depthWrite: false, side: T.FrontSide })),
          back = new T.Mesh(faceG, new T.MeshBasicMaterial({ map: tex, transparent: true, opacity: 0.5, depthWrite: false, side: T.FrontSide })),
          edge = new T.LineSegments(edgeG, new T.LineBasicMaterial({ color: new T.Color(col), transparent: true, opacity: 0.85, blending: T.AdditiveBlending, depthWrite: false }));
      back.rotation.y = Math.PI; grp.add(back); grp.add(face); grp.add(edge); root.add(grp);
      var p = { i: i, it: o.it, gt: o.gt, col: col, L: L, a: k / inL * Math.PI * 2 + L * 0.35, n: inL, grp: grp, face: face, edge: edge, back: back, cv: cv, tex: tex,
        from: new T.Vector3((Math.random() - 0.5) * 16, (Math.random() - 0.3) * 9, (Math.random() - 0.5) * 16), off: new T.Vector3(), vel: new T.Vector3(), tum: 0, pull: 0, drag: false };
      face.userData.i = i; drawPlate(p); F.plates.push(p);
    });
    // tethers from the core to every plate (they light up as the armour comes apart)
    F.tether = new T.LineSegments(new T.BufferGeometry().setAttribute('position', new T.BufferAttribute(new Float32Array(Math.max(n, 1) * 6), 3)),
      new T.LineBasicMaterial({ color: 0x6fe3ff, transparent: true, opacity: 0, blending: T.AdditiveBlending, depthWrite: false }));
    F.tether.frustumCulled = false; root.add(F.tether);
    F.pulse = new T.Points(new T.BufferGeometry().setAttribute('position', new T.BufferAttribute(new Float32Array(Math.max(n, 1) * 3), 3)), new T.PointsMaterial({ color: 0xffd9a0, size: 0.07, transparent: true, opacity: 0, blending: T.AdditiveBlending, depthWrite: false }));
    F.pulse.frustumCulled = false; root.add(F.pulse); F.swirl = 0;
    // the arc reactor
    var core = F.core = new T.Group(); root.add(core);
    function ringMat(c, o) { return new T.MeshBasicMaterial({ color: c, transparent: true, opacity: o, blending: T.AdditiveBlending, depthWrite: false, side: T.DoubleSide }); }
    F.rings = [[0.3, 0.012, 0x9fefff, 0.95], [0.42, 0.008, 0xffb454, 0.8], [0.56, 0.006, 0x6fe3ff, 0.6]].map(function (r, i) {
      var m = new T.Mesh(new T.TorusGeometry(r[0], r[1], 8, 72), ringMat(r[2], r[3])); m.rotation.x = Math.PI / 2 + i * 0.9; m.rotation.y = i * 1.3; core.add(m); return m;
    });
    var gem = new T.LineSegments(new T.WireframeGeometry(new T.IcosahedronGeometry(0.17, 1)), new T.LineBasicMaterial({ color: 0xdff8ff, transparent: true, opacity: 0.9, blending: T.AdditiveBlending, depthWrite: false })); core.add(gem); F.gem = gem;
    var gc = document.createElement('canvas'); gc.width = gc.height = 128; var gx = gc.getContext('2d'), gg = gx.createRadialGradient(64, 64, 2, 64, 64, 64);
    gg.addColorStop(0, 'rgba(235,252,255,1)'); gg.addColorStop(0.25, 'rgba(120,225,255,.75)'); gg.addColorStop(1, 'rgba(40,150,255,0)'); gx.fillStyle = gg; gx.fillRect(0, 0, 128, 128);
    F.glow = new T.Sprite(new T.SpriteMaterial({ map: new T.CanvasTexture(gc), transparent: true, blending: T.AdditiveBlending, depthWrite: false })); F.glow.scale.set(1.5, 1.5, 1); core.add(F.glow);
    // a shock ring fired whenever the armour opens, closes or a plate is called out
    F.shock = new T.Mesh(new T.RingGeometry(0.96, 1, 96), ringMat(0xffc47a, 0)); F.shock.rotation.x = -Math.PI / 2; root.add(F.shock); F.shockT = 9;
    // sparks drifting through the assembly
    var m = N ? 160 : 320, pos = new Float32Array(m * 3);
    for (var j = 0; j < m; j++) { var r = 0.7 + Math.random() * 3.2, a = Math.random() * 6.283, h = (Math.random() - 0.5) * 3.4; pos[j * 3] = Math.cos(a) * r; pos[j * 3 + 1] = h; pos[j * 3 + 2] = Math.sin(a) * r; }
    F.sparks = new T.Points(new T.BufferGeometry().setAttribute('position', new T.BufferAttribute(pos, 3)), new T.PointsMaterial({ color: 0x9fe8ff, size: 0.028, transparent: true, opacity: 0.7, blending: T.AdditiveBlending, depthWrite: false })); root.add(F.sparks);
    F._narrow = N;
  };

  // where plate p sits in the assembly for an exploded amount E (0 locked … 1 fully apart), in root space
  function seat(p, E, t, out, rotOut) {
    var mid = (F.layers - 1) / 2, d = p.L - mid, r0 = Math.max(0.5, p.n * PW * 1.04 / (Math.PI * 2)) * (1 - Math.abs(d) * 0.1),
        a = p.a + (p.L % 2 ? 1 : -1) * (0.3 * E + F.swirl), r = r0 * (1 + E * 0.6) + E * 0.25 + Math.sin(t * 1.3 + p.i) * 0.03 * E,
        y = d * (PH * 1.08 + E * 0.5) + Math.sin(t * 0.9 + p.i * 1.7) * 0.04 * E;
    out.set(Math.cos(a) * r, y, Math.sin(a) * r);
    rotOut.set(-d * 0.3 * (1 - E), Math.PI / 2 - a, 0, 'YXZ');
  }
  F.fire = function () { F.shockT = 0; };
  F.update = function (dt, t) {
    var root = F.root; if (!root) return;
    if (!F.gOk) F.gOk = guide(true);
    var cam = HL.cam, rd = reduce(), home = cam.homeDist;
    // zooming in is what takes the armour apart; the assembly is scaled so it stays the same size on screen while it does
    var E = F.E = clamp((home - cam.dist) / (home * (1 - NEAR)), 0, 1), sc = cam.dist / home * (1 + 0.18 * E); root.scale.setScalar(sc);
    F.swirl += dt * 0.1 * E * (rd || F.sel >= 0 ? 0 : 1);
    F.spin *= Math.exp(-dt * 0.9);
    root.rotation.y += (F.spin + (F.auto && !rd && F.sel < 0 && !F.held ? 0.1 + 0.08 * E : 0)) * dt;
    if (Math.abs(E - (F.E0 || 0)) > 0.3) { F.E0 = E > 0.5 ? 1 : 0; F.fire(); }
    var open = isOpen(); if (open !== F.open) { F.open = open; HL.refreshTools(); }
    var camQ = HL.camera.quaternion, tp = F.tether.geometry.attributes.position.array, pp = F.pulse.geometry.attributes.position.array; root.updateMatrixWorld();
    root.getWorldQuaternion(q2); q2.invert();
    F.plates.forEach(function (p, i) {
      var ap = rd ? 1 : HL.appear(i, 0.08), sel = F.sel === i;
      seat(p, E, rd ? 0 : t, tmp, eul);
      if (ap < 1) tmp.lerp(p.from, 1 - ap);
      p.pull += ((sel ? 1 : 0) - p.pull) * (rd ? 1 : Math.min(1, dt * 7));
      q1.setFromEuler(eul);
      if (p.pull > 0.002) {   // called out: fly to a spot in front of the camera and face it
        HL.camera.getWorldDirection(tmp2); tmp2.multiplyScalar(cam.dist * 0.5).add(HL.camera.position);
        if (HL.narrow) tmp2.addScaledVector(tmp3.setFromMatrixColumn(HL.camera.matrixWorld, 1), 0.1 * cam.dist); else tmp2.addScaledVector(tmp3.setFromMatrixColumn(HL.camera.matrixWorld, 0), -0.1 * cam.dist);   // clear of the data panel
        root.worldToLocal(tmp2);
        tmp.lerp(tmp2, p.pull); q1.slerp(q2.clone().multiply(camQ), p.pull);
      }
      if (!p.drag) { p.off.multiplyScalar(Math.exp(-dt * 7)); p.tum *= Math.exp(-dt * 2.4); }
      tmp.add(p.off);
      p.grp.position.copy(tmp); p.grp.quaternion.copy(q1); if (p.tum) p.grp.rotateY(p.tum * Math.sin(t * 9 + i));
      p.grp.scale.setScalar((0.25 + 0.75 * ap) * (1 + p.pull * ((HL.narrow ? 0.125 : 0.17) * cam.dist / (PH * sc) - 1)));
      p.face.material.opacity = ap * (F.sel >= 0 && !sel ? 0.35 : 1); p.edge.material.opacity = 0.85 * ap * (F.sel >= 0 && !sel ? 0.4 : 1); p.back.material.opacity = 0.5 * ap * (F.sel >= 0 && !sel ? 0.35 : 1);
      p.grp.renderOrder = sel ? 5 : 1;
      tp[i * 6] = tp[i * 6 + 1] = tp[i * 6 + 2] = 0; tp[i * 6 + 3] = tmp.x; tp[i * 6 + 4] = tmp.y; tp[i * 6 + 5] = tmp.z;
      var f = rd ? 1 : (t * 0.55 + i * 0.381) % 1; pp[i * 3] = tmp.x * f; pp[i * 3 + 1] = tmp.y * f; pp[i * 3 + 2] = tmp.z * f;
    });
    F.tether.geometry.attributes.position.needsUpdate = true; F.pulse.geometry.attributes.position.needsUpdate = true; F.pulse.material.opacity = (0.25 + 0.75 * E) * (rd ? 0 : HL.appear(0)); F.tether.material.opacity = (0.08 + 0.3 * E) * (rd ? 1 : HL.appear(0));
    var pulse = 1 + 0.08 * Math.sin(t * 4.2);
    F.core.scale.setScalar((0.8 + 0.5 * E) * pulse * (rd ? 1 : HL.appear(0)));
    if (!rd) { F.rings[0].rotation.z += dt * 1.6; F.rings[1].rotation.x += dt * 0.9; F.rings[1].rotation.y -= dt * 0.6; F.rings[2].rotation.x -= dt * 0.5; F.rings[2].rotation.z += dt * 0.8; F.gem.rotation.y -= dt * 1.2; F.gem.rotation.x += dt * 0.5; F.sparks.rotation.y -= dt * 0.07; }
    F.glow.material.opacity = 0.75 + 0.25 * Math.sin(t * 4.2);
    F.shockT += dt; var s = F.shockT / 0.9;
    F.shock.visible = s < 1 && !rd; if (F.shock.visible) { F.shock.scale.setScalar(0.3 + s * 4.2); F.shock.material.opacity = (1 - s) * 0.8; }
  };

  F.pick = function (x, y) {
    if (!F.root) return null;
    v2.set(x / innerWidth * 2 - 1, -(y / innerHeight) * 2 + 1); ray.setFromCamera(v2, HL.camera);
    var hit = ray.intersectObjects(F.plates.map(function (p) { return p.face; }).concat(F.plates.map(function (p) { return p.back; })), false)[0];
    if (!hit) return null;
    for (var i = 0; i < F.plates.length; i++) if (F.plates[i].face === hit.object || F.plates[i].back === hit.object) return { i: i, drag: true };
    return null;
  };
  F.select = function (i) {
    F.sel = i; F.fire();
    var p = F.plates[i]; HL.detail.open(p.it, { sub: (p.gt || '') + ' · P-' + ('0' + (i + 1)).slice(-2) });
  };
  F.tap = function (h) {
    if (!h) { if (F.sel >= 0) { F.sel = -1; HL.detail.close(); } return; }
    if (F.sel === h.i) { F.sel = -1; HL.detail.close(); } else F.select(h.i);
  };
  function unit(p) { p.grp.getWorldPosition(tmp); return 1 / HL.screenOf(tmp).ppu / F.root.scale.x; }   // css px → root units at that plate's depth
  F.dragStart = function (h, x, y) { var p = F.plates[h.i]; if (!p) return; p.drag = true; p.px = x; p.py = y; p.vel.set(0, 0, 0); };
  F.dragMove = function (h, x, y) {
    var p = F.plates[h.i]; if (!p || !p.drag) return;
    var k = unit(p), dx = (x - p.px) * k, dy = (y - p.py) * k; p.px = x; p.py = y;
    tmp.setFromMatrixColumn(HL.camera.matrixWorld, 0).multiplyScalar(dx); tmp2.setFromMatrixColumn(HL.camera.matrixWorld, 1).multiplyScalar(-dy); tmp.add(tmp2);
    F.root.getWorldQuaternion(q2); tmp.applyQuaternion(q2.invert()); p.off.add(tmp); p.vel.copy(tmp);
  };
  F.dragEnd = function (h) { var p = F.plates[h.i]; if (!p) return; p.drag = false; p.tum = reduce() ? 0 : clamp(p.vel.length() * 9, 0.25, 1.4); };
  F.emptyDrag = function (dx, dy) {
    if (!F.root) return false;
    F.root.rotation.y += dx * 0.0065; F.spin = 0; F.held = true;
    HL.cam.g.el = clamp(HL.cam.g.el + dy * 0.004, -0.08, 0.62);
    return true;
  };
  F.emptyDragEnd = function (vx) { F.held = false; F.spin = reduce() ? 0 : clamp((vx || 0) * 0.0065 * 60, -5, 5); };
  F.explode = function (on) { HL.cam.g.dist = on ? HL.cam.homeDist * NEAR : HL.cam.homeDist; };
  function isOpen() { return HL.cam.g.dist < HL.cam.homeDist * (1 + NEAR) / 2; }
  F.tools = function (box) {
    var open = F.open = isOpen();
    HL.ui.chip(box, open ? '⟲ 合体 Assemble' : '✦ 拆解 Explode', open, function () { F.explode(!open); HL.refreshTools(); }, '把装甲拆成分层爆炸图 / 合回去 · 双指张合或滚轮也可以');
    HL.ui.chip(box, '↻ 重新装配 Suit up', false, function () { F.sel = -1; HL.detail.close(); F.explode(false); F.plates.forEach(function (p) { p.from.set((Math.random() - 0.5) * 16, (Math.random() - 0.3) * 9, (Math.random() - 0.5) * 16); }); HL.appearAt = HL.now; F.fire(); HL.refreshTools(); }, '所有装甲片重新飞入装配');
    HL.ui.chip(box, '自转 Spin', F.auto, function () { F.auto = !F.auto; HL.refreshTools(); }, '自动旋转');
    HL.ui.sep(box); HL.ui.lab(box, F.plates.length + ' 片装甲 plates');
  };
  HL.register(F);
})();

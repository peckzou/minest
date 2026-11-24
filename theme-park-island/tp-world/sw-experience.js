/* Star Wars: Galaxy's Edge — building a lightsaber and a droid with your own hands (2026-11-24).
 * The two workshops' experiences, step by step as they go in the parks (Disney's own pages and visitors' accounts):
 *
 * Savi's Workshop — choose one of four hilt themes and take its pin (Peace and Justice, Power and Control, Elemental
 * Nature, Protection and Defense) → let a kyber crystal choose you (blue, green, violet, red) → the tray of parts for
 * your theme: seat the crystal in the chassis (it lights), fit an activation plate round it, slide on two of the four
 * sleeves, then screw in one of two emitters and one of two pommel caps → the Gatherer looks it over → the hilt goes
 * into the activation chamber, the lights go down → press the switch: the blade ignites → raise it with the Gatherers.
 *
 * Droid Depot — register an R-series or a BB-series unit and take the blueprint → the Parts Station: pick each part
 * the blueprint asks for off the moving conveyor, in the colours you like (R: dome, body, centre leg, a pair of side
 * legs; BB: dome, dome connection plate, body sphere, motivator) → the Build Station: put the parts together in the
 * placemat's order, then drive home every bolt with the powered driver → hold ACTIVATE: the droid wakes → take the
 * remote and drive it through the three rings on the floor.
 *
 * Everything is done on the things themselves: click (tap) a part to take or fit it, hold on a part to screw or drive
 * it, the arrow keys / WASD (or the on-screen pad) to drive the droid, the pointer to raise the blade. Esc or ✕ leaves.
 * What is built is kept (sw-workshops.js): the saber is in the hand, the droid follows its maker through the park. */
(function (root) {
  'use strict';
  var API = null, T = null, W = null, B = null, X = null, clock = 0, ray = null, ndc = null, hud = null, keys = {}, markers = [];
  var THEMES = [
    { id: 'peace', name: '和平与正义', icon: '🕊', m: 0xc8ccd2, g: 0x1c1c22, a: 0xc9a24a, bg: '#2563eb' },
    { id: 'power', name: '力量与掌控', icon: '⚡', m: 0x3a3d44, g: 0x111114, a: 0xb3202a, bg: '#b91c1c' },
    { id: 'nature', name: '自然元素', icon: '🌿', m: 0x7a5230, g: 0xe8dcc0, a: 0x4f7a3d, bg: '#15803d' },
    { id: 'defense', name: '守护与防御', icon: '🛡', m: 0x8a7a55, g: 0x4a4238, a: 0x2f7d8a, bg: '#a16207' }
  ];
  var KYBER = [['#3b82f6', '蓝'], ['#22c55e', '绿'], ['#a855f7', '紫'], ['#ef4444', '红']];
  var DCOLS = ['#2563eb', '#f97316', '#dc2626', '#16a34a', '#7c3aed', '#facc15'];
  var SLOT_Y = { pommel: -0.1375, sleeveA: -0.075, 'switch': -0.005, sleeveB: 0.06, emitter: 0.1275 };

  /* ================================================================ parts */
  function mats(th) { var t = THEMES.filter(function (q) { return q.id === th; })[0] || THEMES[0]; return { m: new T.MeshPhongMaterial({ color: t.m, shininess: 60 }), g: new T.MeshLambertMaterial({ color: t.g, side: T.DoubleSide }), a: new T.MeshPhongMaterial({ color: t.a, shininess: 50 }) }; }
  function cyl(g, rt, rb, h, m, y, seg) { var o = new T.Mesh(new T.CylinderGeometry(rt, rb, h, seg || 16), m); o.position.y = y || 0; g.add(o); return o; }
  function tor(g, r, t, m, y) { var o = new T.Mesh(new T.TorusGeometry(r, t, 6, 18), m); o.rotation.x = Math.PI / 2; o.position.y = y || 0; g.add(o); return o; }
  function hiltPart(slot, th, i) {
    var g = new T.Group(), M = mats(th), k, o;
    if (slot === 'emitter') {
      if (i === 0) { cyl(g, 0.027, 0.019, 0.045, M.m, 0); tor(g, 0.027, 0.004, M.a, 0.0225);
        if (th === 'power') for (k = 0; k < 4; k++) { o = new T.Mesh(new T.ConeGeometry(0.006, 0.03, 6), M.a); o.position.set(Math.cos(k * 1.57) * 0.024, 0.036, Math.sin(k * 1.57) * 0.024); g.add(o); }
        else if (th === 'nature') for (k = 0; k < 5; k++) { o = new T.Mesh(new T.ConeGeometry(0.007, 0.028, 5), M.g); o.position.set(Math.cos(k * 1.257) * 0.022, 0.034, Math.sin(k * 1.257) * 0.022); g.add(o); }
        else if (th === 'defense') cyl(g, 0.042, 0.042, 0.006, M.a, -0.02, 20);
        else for (k = 0; k < 3; k++) { o = new T.Mesh(new T.BoxGeometry(0.004, 0.04, 0.016), M.g); o.position.set(Math.cos(k * 2.094) * 0.027, 0, Math.sin(k * 2.094) * 0.027); o.rotation.y = -k * 2.094; g.add(o); }
      } else { cyl(g, 0.02, 0.02, 0.05, M.m, 0); o = new T.Mesh(new T.CylinderGeometry(0.027, 0.027, 0.06, 14, 1, true, 0, Math.PI), M.g); o.position.y = 0.005; g.add(o); cyl(g, 0.023, 0.023, 0.008, M.a, -0.02);
        for (k = 0; k < 3; k++) { o = new T.Mesh(new T.SphereGeometry(0.0045, 6, 5), M.a); o.position.set(Math.cos(3.6 + k * 0.5) * 0.021, 0.012, Math.sin(3.6 + k * 0.5) * 0.021); g.add(o); } }
    } else if (slot === 'pommel') {
      if (i === 0) { o = new T.Mesh(new T.SphereGeometry(0.022, 14, 10), M.m); o.scale.y = 0.75; g.add(o); cyl(g, 0.02, 0.02, 0.008, M.a, 0.013); }
      else { cyl(g, 0.022, 0.015, 0.026, M.m, 0); cyl(g, 0.011, 0.011, 0.01, M.g, -0.017); o = new T.Mesh(new T.TorusGeometry(0.011, 0.003, 6, 14), M.a); o.position.y = -0.026; g.add(o); }
    } else if (slot === 'sleeve') {
      if (i === 0) { cyl(g, 0.0185, 0.0185, 0.085, M.m, 0); for (k = 0; k < 5; k++) tor(g, 0.019, 0.0035, M.g, -0.032 + k * 0.016); }
      else if (i === 1) { cyl(g, 0.02, 0.02, 0.085, M.g, 0); cyl(g, 0.0215, 0.0215, 0.01, M.a, 0.03); cyl(g, 0.0215, 0.0215, 0.01, M.a, -0.03); }
      else if (i === 2) { cyl(g, 0.0165, 0.0165, 0.085, M.m, 0); for (k = 0; k < 6; k++) { o = new T.Mesh(new T.BoxGeometry(0.006, 0.075, 0.01), M.g); o.position.set(Math.cos(k * 1.047) * 0.019, 0, Math.sin(k * 1.047) * 0.019); o.rotation.y = -k * 1.047; g.add(o); } }
      else { cyl(g, 0.019, 0.019, 0.085, M.g, 0); for (k = 0; k < 7; k++) { o = tor(g, 0.0195, 0.0022, M.m, -0.036 + k * 0.012); o.rotation.x = Math.PI / 2 + 0.35; } o = new T.Mesh(new T.SphereGeometry(0.005, 6, 5), M.a); o.position.set(0, 0, 0.021); g.add(o); }
    } else {   /* the activation plate and its switch, clamped round the crystal chamber */
      tor(g, 0.0185, 0.003, M.m, 0.02); tor(g, 0.0185, 0.003, M.m, -0.02);
      if (i === 0) { o = new T.Mesh(new T.BoxGeometry(0.022, 0.045, 0.008), M.m); o.position.z = 0.02; g.add(o); o = new T.Mesh(new T.SphereGeometry(0.006, 8, 6), new T.MeshBasicMaterial({ color: 0xef4444 })); o.position.set(0, 0.008, 0.026); g.add(o); o = new T.Mesh(new T.SphereGeometry(0.003, 6, 5), new T.MeshBasicMaterial({ color: 0x4ade80 })); o.position.set(0, -0.012, 0.025); g.add(o); }
      else { o = new T.Mesh(new T.BoxGeometry(0.02, 0.05, 0.008), M.g); o.position.z = 0.02; g.add(o); o = new T.Mesh(new T.CylinderGeometry(0.004, 0.004, 0.016, 8), M.a); o.rotation.x = Math.PI / 2; o.position.set(0, 0.006, 0.03); g.add(o); [-0.016, 0.018].forEach(function (y) { var q = new T.Mesh(new T.SphereGeometry(0.0035, 6, 5), M.a); q.position.set(0, y, 0.025); g.add(q); }); }
    }
    return g;
  }
  function chassis(color) {   /* the hilt's core: the crystal chamber in the middle; it lights when the crystal is seated */
    var g = new T.Group(), steel = new T.MeshPhongMaterial({ color: 0x4b5563, shininess: 40 });
    cyl(g, 0.013, 0.013, 0.29, steel, 0); cyl(g, 0.015, 0.015, 0.012, new T.MeshPhongMaterial({ color: 0xd1d5db, shininess: 80 }), 0.145); cyl(g, 0.015, 0.015, 0.012, new T.MeshPhongMaterial({ color: 0xd1d5db, shininess: 80 }), -0.145);
    var glass = cyl(g, 0.017, 0.017, 0.04, new T.MeshBasicMaterial({ color: color || 0x94a3b8, transparent: true, opacity: color ? 0.55 : 0.25 }), -0.005);
    var gem = new T.Mesh(new T.OctahedronGeometry(0.008, 0), new T.MeshBasicMaterial({ color: color || 0xffffff })); gem.position.y = -0.005; gem.scale.y = 1.6; gem.visible = !!color; g.add(gem);
    g.userData = { glass: glass, gem: gem }; return g;
  }
  function saber(spec) {   /* the finished lightsaber: hilt centred on the origin, blade from its top */
    var g = new T.Group(); g.add(chassis(spec.color));
    var put = function (slot, kind, i) { var p = hiltPart(kind, spec.theme, i); p.position.y = SLOT_Y[slot]; g.add(p); };
    put('pommel', 'pommel', spec.pommel || 0); put('sleeveA', 'sleeve', (spec.sleeves || [0, 1])[0]); put('switch', 'switch', spec.sw || 0); put('sleeveB', 'sleeve', (spec.sleeves || [0, 1])[1]); put('emitter', 'emitter', spec.emitter || 0);
    var blade = new T.Group(); blade.position.y = 0.155; g.add(blade);
    var core = new T.Mesh(new T.CylinderGeometry(0.011, 0.012, 0.9, 8), new T.MeshBasicMaterial({ color: 0xffffff })); core.position.y = 0.45; blade.add(core);
    var glow = new T.Mesh(new T.CylinderGeometry(0.028, 0.03, 0.92, 10), new T.MeshBasicMaterial({ color: spec.color, transparent: true, opacity: 0.55, blending: T.AdditiveBlending, depthWrite: false })); glow.position.y = 0.45; blade.add(glow);
    g.userData = { blade: blade, on: 1, k: 0 }; return g;
  }
  function droidPart(body, type, col) {
    var g = new T.Group(), white = new T.MeshLambertMaterial({ color: 0xf1f5f9 }), c = new T.MeshLambertMaterial({ color: col }), dark = new T.MeshLambertMaterial({ color: 0x1f2937 }), o, k;
    var add = function (geo, m, x, y, z) { var q = new T.Mesh(geo, m); q.position.set(x || 0, y || 0, z || 0); g.add(q); return q; };
    if (body === 'bb') {
      if (type === 'sphere') { add(new T.SphereGeometry(0.42, 20, 14), white); [[0, 0, 0.42, 0, 0], [0.42, 0, 0, 0, 1.571], [-0.42, 0, 0, 0, 1.571], [0, 0, -0.42, 0, 0], [0, 0.42, 0, 1.571, 0], [0, -0.42, 0, 1.571, 0]].forEach(function (q) { o = add(new T.TorusGeometry(0.17, 0.04, 8, 18), c, q[0], q[1], q[2]); o.rotation.set(q[3], q[4], 0); add(new T.CylinderGeometry(0.07, 0.07, 0.02, 10), dark, q[0] * 1.01, q[1] * 1.01, q[2] * 1.01).rotation.set(q[3] ? 0 : Math.PI / 2, 0, q[4] ? Math.PI / 2 : 0); }); }
      else if (type === 'motivator') { add(new T.CylinderGeometry(0.2, 0.24, 0.1, 16), dark, 0, 0.05, 0); add(new T.CylinderGeometry(0.245, 0.245, 0.03, 16), c, 0, 0.05, 0); for (k = 0; k < 3; k++) { o = add(new T.CylinderGeometry(0.05, 0.05, 0.04, 10), white, Math.cos(k * 2.094) * 0.17, 0.02, Math.sin(k * 2.094) * 0.17); o.rotation.z = Math.PI / 2; o.rotation.y = -k * 2.094; } }
      else if (type === 'plate') { add(new T.CylinderGeometry(0.2, 0.24, 0.045, 18), c); add(new T.CylinderGeometry(0.12, 0.12, 0.05, 14), dark); }
      else { add(new T.SphereGeometry(0.26, 18, 10, 0, Math.PI * 2, 0, Math.PI / 2), white); add(new T.CylinderGeometry(0.265, 0.265, 0.05, 18), c, 0, 0.03, 0); add(new T.CylinderGeometry(0.2, 0.2, 0.012, 16), c, 0, 0.17, 0); add(new T.SphereGeometry(0.07, 10, 8), dark, 0, 0.12, 0.22); add(new T.SphereGeometry(0.03, 8, 6), dark, 0.11, 0.07, 0.23); add(new T.CylinderGeometry(0.006, 0.006, 0.22, 4), dark, -0.08, 0.34, -0.05); add(new T.CylinderGeometry(0.006, 0.006, 0.14, 4), dark, -0.03, 0.3, -0.07); }
    } else {
      if (type === 'body') { add(new T.CylinderGeometry(0.34, 0.34, 0.7, 20), white); [0.2, 0, -0.2].forEach(function (y, i) { add(new T.BoxGeometry(0.3 - i * 0.04, 0.11, 0.04), c, 0, y, 0.33); }); add(new T.BoxGeometry(0.08, 0.3, 0.04), c, -0.24, -0.08, 0.25).rotation.y = -0.75; add(new T.BoxGeometry(0.08, 0.3, 0.04), c, 0.24, -0.08, 0.25).rotation.y = 0.75; add(new T.CylinderGeometry(0.345, 0.345, 0.04, 20), dark, 0, -0.33, 0); add(new T.CylinderGeometry(0.05, 0.05, 0.03, 10), dark, 0.1, 0.27, 0.32).rotation.x = Math.PI / 2; }
      else if (type === 'legC') { add(new T.BoxGeometry(0.14, 0.26, 0.14), white, 0, 0.1, 0); add(new T.BoxGeometry(0.28, 0.14, 0.36), c, 0, -0.08, 0.04); add(new T.BoxGeometry(0.3, 0.04, 0.38), dark, 0, -0.15, 0.04); }
      else if (type === 'legS') { add(new T.BoxGeometry(0.12, 0.62, 0.2), white, 0, 0.08, 0); add(new T.CylinderGeometry(0.13, 0.13, 0.13, 14), c, 0, 0.36, 0).rotation.z = Math.PI / 2; add(new T.BoxGeometry(0.13, 0.3, 0.06), c, 0, 0.05, 0.1); add(new T.BoxGeometry(0.2, 0.16, 0.38), c, 0, -0.32, 0.04); add(new T.BoxGeometry(0.22, 0.04, 0.4), dark, 0, -0.4, 0.04); }
      else { add(new T.SphereGeometry(0.34, 20, 10, 0, Math.PI * 2, 0, Math.PI / 2), c); add(new T.CylinderGeometry(0.345, 0.345, 0.04, 20), white, 0, 0.01, 0); add(new T.SphereGeometry(0.08, 10, 8), dark, 0, 0.16, 0.28); add(new T.BoxGeometry(0.1, 0.07, 0.04), white, -0.16, 0.1, 0.28).rotation.y = -0.5; add(new T.CylinderGeometry(0.04, 0.04, 0.06, 8), dark, 0.16, 0.26, 0.1); g.userData.lamp = add(new T.SphereGeometry(0.035, 8, 6), new T.MeshBasicMaterial({ color: 0xef4444 }), 0.14, 0.1, 0.29); }
    }
    return g;
  }
  function droid(spec) {   /* a whole droid from its parts; userData.parts holds each, so the Build Station can lay them out and bring them home */
    var g = new T.Group(), P = spec.parts || {}, f = spec.color || '#2563eb', parts = {}, put = function (name, type, y, x, z) { var p = droidPart(spec.body, type, P[name] || f); p.position.set(x || 0, y, z || 0); g.add(p); parts[name] = p; return p; };
    if (spec.body === 'bb') { put('motivator', 'motivator', 0); put('sphere', 'sphere', 0.5); put('plate', 'plate', 0.92); put('dome', 'dome', 0.94); g.userData = { parts: parts, head: parts.dome, ball: parts.sphere, order: ['motivator', 'sphere', 'plate', 'dome'] }; }
    else { put('body', 'body', 0.64); put('legC', 'legC', 0.17, 0, 0.26); put('legL', 'legS', 0.42, -0.42); put('legR', 'legS', 0.42, 0.42); put('dome', 'dome', 1.0); g.userData = { parts: parts, head: parts.dome, lamp: parts.dome.userData.lamp, order: ['body', 'legC', 'legL', 'legR', 'dome'] }; }
    return g;
  }
  root.TPSWParts = { saber: saber, droid: droid, hiltPart: hiltPart, droidPart: droidPart };

  /* ================================================================ sound, tweens, the HUD */
  function tone(f, d, type, vol, f2, delay) { try { var c = W.actx(); if (!c) return; var t = c.currentTime + (delay || 0), o = c.createOscillator(), g = c.createGain(); o.type = type || 'sine'; o.frequency.setValueAtTime(f, t); if (f2) o.frequency.exponentialRampToValueAtTime(f2, t + d); g.gain.setValueAtTime(0.0001, t); g.gain.exponentialRampToValueAtTime(vol || 0.12, t + 0.01); g.gain.exponentialRampToValueAtTime(0.0001, t + d); o.connect(g); g.connect(c.destination); o.start(t); o.stop(t + d + 0.03); } catch (e) {} }
  function noise(d, f0, f1, vol) { try { var c = W.actx(); if (!c) return; var t = c.currentTime, buf = noise.b; if (!buf) { buf = noise.b = c.createBuffer(1, c.sampleRate, c.sampleRate); var ch = buf.getChannelData(0); for (var i = 0; i < ch.length; i++) ch[i] = Math.random() * 2 - 1; } var s = c.createBufferSource(); s.buffer = buf; var bp = c.createBiquadFilter(); bp.type = 'bandpass'; bp.Q.value = 1.2; bp.frequency.setValueAtTime(f0, t); bp.frequency.exponentialRampToValueAtTime(f1, t + d); var g = c.createGain(); g.gain.setValueAtTime(vol || 0.2, t); g.gain.exponentialRampToValueAtTime(0.0001, t + d); s.connect(bp); bp.connect(g); g.connect(c.destination); s.start(t); s.stop(t + d + 0.02); } catch (e) {} }
  var snd = { latch: function () { noise(0.06, 2600, 700, 0.25); tone(170, 0.08, 'sine', 0.2); }, chime: function () { tone(880, 0.25, 'sine', 0.1); tone(1320, 0.4, 'sine', 0.08, 0, 0.09); }, buzz: function () { tone(110, 0.22, 'square', 0.07); }, tick: function () { noise(0.025, 3200, 1800, 0.12); }, thump: function () { tone(70, 0.5, 'sine', 0.3, 38); noise(0.3, 400, 90, 0.2); }, beeps: function () { for (var i = 0; i < 4; i++) tone(700 + Math.random() * 1300, 0.11, 'square', 0.05, 500 + Math.random() * 1500, i * 0.13); }, fanfare: function () { [392, 523, 659, 784].forEach(function (f, i) { tone(f, 0.9 - i * 0.1, 'triangle', 0.09, 0, i * 0.16); }); } };
  var whirr = null;
  function whirrSet(on, k) { try { var c = W.actx(); if (!c) return; if (on && !whirr) { var o = c.createOscillator(), g = c.createGain(), lp = c.createBiquadFilter(); o.type = 'sawtooth'; lp.type = 'lowpass'; lp.frequency.value = 1400; g.gain.value = 0.05; o.connect(lp); lp.connect(g); g.connect(c.destination); o.start(); whirr = { o: o, g: g }; } if (whirr) { if (on) whirr.o.frequency.setTargetAtTime(120 + (k || 0) * 380, c.currentTime, 0.04); else { whirr.g.gain.setTargetAtTime(0, c.currentTime, 0.03); var w = whirr; whirr = null; setTimeout(function () { try { w.o.stop(); } catch (e) {} }, 200); } } } catch (e) {} }
  function say(text) { if (!hud) return; hud.text.textContent = text; try { var ss = root.speechSynthesis; if (ss && root.SpeechSynthesisUtterance) { ss.cancel(); var u = new root.SpeechSynthesisUtterance(text.replace(/（.*?）/g, '')); u.lang = 'zh-CN'; u.rate = 1.0; u.pitch = 0.9; ss.speak(u); } } catch (e) {} }
  function step(title, text) { hud.step.textContent = title; say(text); }
  function chips(list) { hud.chips.innerHTML = list.map(function (c) { return '<span class="' + (c.done ? 'ok' : '') + (c.now ? ' now' : '') + '">' + (c.col ? '<i style="background:' + c.col + '"></i>' : '') + c.label + (c.done ? ' ✓' : '') + '</span>'; }).join(''); }
  function tween(o, to, dur, cb) { X.tw.push({ o: o, p0: o.position.clone(), p1: to.pos ? new T.Vector3(to.pos[0], to.pos[1], to.pos[2]) : null, r0: o.rotation.clone(), r1: to.rot || null, s0: o.scale.x, s1: to.scale == null ? null : to.scale, t: 0, d: dur || 0.5, cb: cb, arc: to.arc || 0 }); }
  function later(sec, fn) { X.timers.push({ t: sec, fn: fn }); }
  function hot(o, opt) { o.userData.swx = opt; opt.on = opt.on !== false; X.hot.push(o); return o; }
  function mark(list) { X.marks = (list || []).filter(Boolean); }
  function camTo(px, py, pz, tx, ty, tz) { var g = X.group.position; X.cam = { p: new T.Vector3(g.x + px, g.y + py, g.z + pz), t: new T.Vector3(g.x + tx, g.y + ty, g.z + tz) }; }
  function label(text, sub, bg, w, h) { var c = document.createElement('canvas'); c.width = w || 256; c.height = h || 256; var q = c.getContext('2d'); q.fillStyle = bg; q.fillRect(0, 0, c.width, c.height); q.textAlign = 'center'; q.textBaseline = 'middle'; q.fillStyle = '#fff'; q.font = (c.height * 0.42) + 'px sans-serif'; q.fillText(text, c.width / 2, c.height * 0.42); if (sub) { q.font = '700 ' + (c.height * 0.13) + 'px "PingFang SC",sans-serif'; q.fillText(sub, c.width / 2, c.height * 0.82); } return new T.CanvasTexture(c); }

  function ensureHud() {
    if (hud) return;
    var el = document.createElement('div'); el.id = 'swx';
    el.innerHTML = '<div id="swx-dim"></div><div class="top"><b id="swx-step"></b><span id="swx-text"></span><div id="swx-chips"></div></div><div id="swx-ring"><i></i></div><button type="button" id="swx-x" title="离开 (Esc)">✕</button>' +
      '<div id="swx-pad"><button type="button" data-k="ArrowUp">▲</button><button type="button" data-k="ArrowLeft">◀</button><button type="button" data-k="ArrowDown">▼</button><button type="button" data-k="ArrowRight">▶</button></div>';
    document.body.appendChild(el);
    var css = document.createElement('style');
    css.textContent = '#swx{position:fixed;inset:0;z-index:90;pointer-events:none;display:none;font-family:-apple-system,"PingFang SC",sans-serif}body.swx-on #swx{display:block}body.swx-on #tp-action-prompt,body.swx-on #hint,body.swx-on #hotbar,body.swx-on #mmWrap,body.swx-on #title,body.swx-on #mip-fab,body.swx-on #crosshair,body.swx-on #sw-saber-btn{display:none!important}' +
      '#swx .top{position:absolute;left:50%;top:14px;transform:translateX(-50%);max-width:min(760px,92vw);padding:10px 18px;border-radius:16px;background:rgba(10,14,26,.88);border:1.5px solid #7dd3fc;color:#e0f2fe;text-align:center;line-height:1.5}#swx-step{display:block;color:#fde68a;font-size:15px;letter-spacing:.06em}#swx-text{font-size:14.5px}' +
      '#swx-chips{display:flex;gap:8px;flex-wrap:wrap;justify-content:center;margin-top:8px}#swx-chips:empty{display:none}#swx-chips span{padding:5px 11px;border-radius:999px;background:rgba(10,14,26,.8);border:1.5px solid rgba(255,255,255,.25);color:#cbd5e1;font-size:12.5px;font-weight:700}#swx-chips span.now{border-color:#fde047;color:#fde68a}#swx-chips span.ok{border-color:#4ade80;color:#bbf7d0}#swx-chips i{display:inline-block;width:11px;height:11px;border-radius:50%;margin-right:5px;vertical-align:-1px;border:1px solid rgba(255,255,255,.6)}' +
      '#swx-ring{position:absolute;left:50%;bottom:120px;transform:translateX(-50%);width:240px;height:12px;border-radius:999px;background:rgba(10,14,26,.8);border:1.5px solid #7dd3fc;overflow:hidden;display:none}#swx-ring i{display:block;height:100%;width:0;background:linear-gradient(90deg,#38bdf8,#fde047)}' +
      '#swx-x{pointer-events:auto;position:absolute;right:16px;top:16px;width:44px;height:44px;border-radius:50%;border:1.5px solid rgba(255,255,255,.4);background:rgba(10,14,26,.85);color:#fff;font-size:18px;cursor:pointer}' +
      '#swx-pad{pointer-events:auto;position:absolute;left:50%;bottom:26px;transform:translateX(-50%);display:none;grid-template-columns:repeat(3,56px);grid-template-rows:repeat(2,56px);gap:6px}#swx-pad button{border-radius:14px;border:1.5px solid #7dd3fc;background:rgba(10,14,26,.8);color:#e0f2fe;font-size:22px;cursor:pointer;touch-action:none}#swx-pad button[data-k=ArrowUp]{grid-column:2;grid-row:1}#swx-pad button[data-k=ArrowLeft]{grid-column:1;grid-row:2}#swx-pad button[data-k=ArrowDown]{grid-column:2;grid-row:2}#swx-pad button[data-k=ArrowRight]{grid-column:3;grid-row:2}' +
      '#swx-dim{position:absolute;inset:0;background:radial-gradient(ellipse at 50% 55%,rgba(0,0,0,0) 18%,rgba(2,4,12,.88) 78%);opacity:0;transition:opacity 1.6s}';
    document.head.appendChild(css);
    hud = { el: el, step: el.querySelector('#swx-step'), text: el.querySelector('#swx-text'), chips: el.querySelector('#swx-chips'), ring: el.querySelector('#swx-ring'), bar: el.querySelector('#swx-ring i'), pad: el.querySelector('#swx-pad'), dim: el.querySelector('#swx-dim') };
    el.querySelector('#swx-x').onclick = function (e) { e.stopPropagation(); stop(); };
    [].forEach.call(hud.pad.querySelectorAll('button'), function (b) { var k = b.dataset.k; b.addEventListener('pointerdown', function (e) { e.preventDefault(); e.stopPropagation(); keys[k] = true; }); ['pointerup', 'pointerleave', 'pointercancel'].forEach(function (ev) { b.addEventListener(ev, function () { keys[k] = false; }); }); });
  }

  /* ================================================================ starting and leaving */
  function begin(group, back) {
    ensureHud(); if (X) stop();
    try { if (document.pointerLockElement) document.exitPointerLock(); } catch (e) {}
    API.setUI(true); W.busy(true); document.body.classList.add('swx-on');
    var tmp = new T.Group(); group.add(tmp);
    X = { group: group, tmp: tmp, hot: [], tw: [], timers: [], marks: [], cam: null, back: back, undo: [], mx: 0, my: 0, held: null, state: '' };
    hud.chips.innerHTML = ''; hud.ring.style.display = 'none'; hud.pad.style.display = 'none'; hud.dim.style.opacity = 0;
    return X;
  }
  function stop() {
    if (!X) return; var x = X; X = null;
    x.group.remove(x.tmp); x.undo.forEach(function (f) { try { f(); } catch (e) {} });
    markers.forEach(function (m) { m.visible = false; }); whirrSet(false); try { root.speechSynthesis.cancel(); } catch (e) {}
    document.body.classList.remove('swx-on'); hud.dim.style.opacity = 0; API.canvas.style.cursor = ''; keys = {};
    var b = x.back; API.setUI(false); W.busy(false);
    API.teleport({ mode: 'walk', p: [b.p[0], API.groundY(b.p[0], b.p[2], 62), b.p[2]], t: b.t });
  }
  function add(geo, m, x, y, z, parent) { var o = new T.Mesh(geo, m); o.position.set(x, y, z); (parent || X.tmp).add(o); return o; }
  var Lm = function (c, o) { return new T.MeshLambertMaterial(Object.assign({ color: c }, o || {})); }, Bm = function (c, o) { return new T.MeshBasicMaterial(Object.assign({ color: c }, o || {})); };

  /* ================================================================ Savi's Workshop */
  function startSavi() {
    var S = B.saviGroup, sp = B.savi, x = begin(S, { p: [sp.x, 0, sp.z + 3.4], t: [sp.x, 41.4, sp.z - 0.6] }), K = 2.2, C = [0, 1.37, 0.92];
    x.spec = { theme: null, color: null, sleeves: [], emitter: null, pommel: null, sw: null }; x.kind = 'saber';
    B.trays[0].visible = false; x.undo.push(function () { B.trays[0].visible = true; B.lamp2.intensity = 0.8; B.gath.forEach(function (q) { q.sb.userData.blade.visible = true; q.sb.userData.blade.scale.y = 1; }); W.hum(false); });
    camTo(0, 2.34, 2.25, 0, 1.25, 0.95);
    add(new T.BoxGeometry(1.74, 0.02, 0.9), Lm(0x1c2430), 0, 1.215, 0.98); add(new T.BoxGeometry(1.78, 0.012, 0.94), Lm(0x8a6a3c), 0, 1.207, 0.98);
    /* the activation chamber beside the station */
    var tube = add(new T.CylinderGeometry(0.1, 0.1, 0.62, 18, 1, true), Lm(0xf1f5f9, { side: T.DoubleSide }), 0.98, 1.53, 0.86); add(new T.CylinderGeometry(0.13, 0.15, 0.06, 18), Lm(0x6b7280), 0.98, 1.24, 0.86); add(new T.TorusGeometry(0.1, 0.012, 6, 20), Lm(0x6b7280), 0.98, 1.84, 0.86).rotation.x = Math.PI / 2;
    var tubeGlow = add(new T.CylinderGeometry(0.085, 0.085, 0.6, 14, 1, true), Bm(0xffffff, { transparent: true, opacity: 0, side: T.DoubleSide }), 0.98, 1.53, 0.86);

    step('萨维的工坊', '欢迎。我们是采集者——收集被遗忘的废铁，也守护原力的传统。今天，你要亲手造出自己的光剑。先选你的道路：点一枚徽章。');
    /* 1 — the four themes, each a pin */
    var pins = THEMES.map(function (t, i) {
      var g = new T.Group(); g.position.set(-0.6 + i * 0.4, 1.34, 1.02); g.rotation.x = 0.85; x.tmp.add(g);
      add(new T.CylinderGeometry(0.13, 0.13, 0.02, 28), new T.MeshPhongMaterial({ color: 0xc9a24a, shininess: 70 }), 0, 0, 0, g);
      var face = add(new T.CircleGeometry(0.115, 28), new T.MeshBasicMaterial({ map: label(t.icon, t.name, t.bg) }), 0, 0.011, 0, g); face.rotation.x = -Math.PI / 2;
      [hiltPart('emitter', t.id, 0)].forEach(function (p) { p.scale.setScalar(1.6); p.position.set(0, 0.06, -0.2); p.rotation.x = -0.85; g.add(p); });
      return hot(g, { act: function () { chooseTheme(t, g); } });
    });
    mark(pins);
    function chooseTheme(t, g) {
      x.spec.theme = t.id; snd.chime(); mark([]); pins.forEach(function (p) { p.userData.swx.on = false; if (p !== g) tween(p, { scale: 0.001 }, 0.4); });
      tween(g, { pos: [-0.74, 1.27, 0.64], scale: 0.55 }, 0.6); chips([{ label: t.icon + ' ' + t.name, done: true }]);
      later(0.9, crystalStep);
    }
    /* 2 — the kyber crystals */
    var gem = null;
    function crystalStep() {
      step('凯伯水晶', '这是凯伯水晶，光剑的心。蓝、绿、紫、红——不是你选水晶，是水晶选你。哪一颗在呼唤你？');
      var box = new T.Group(); box.position.set(0, 1.26, 0.98); box.scale.setScalar(0.001); x.tmp.add(box); tween(box, { scale: 1 }, 0.5);
      add(new T.BoxGeometry(0.86, 0.1, 0.34), Lm(0x3a2616), 0, 0, 0, box); add(new T.BoxGeometry(0.8, 0.02, 0.28), Lm(0x1a1410), 0, 0.05, 0, box);
      var lid = new T.Group(); lid.position.set(0, 0.06, -0.17); box.add(lid); add(new T.BoxGeometry(0.86, 0.04, 0.34), Lm(0x4a3220), 0, 0, 0.17, lid); tween(lid, { rot: new T.Euler(-1.9, 0, 0) }, 0.9);
      var gems = KYBER.map(function (k, i) { var m = add(new T.OctahedronGeometry(0.06, 0), Bm(k[0]), -0.3 + i * 0.2, 0.16, 0, box); m.scale.y = 1.5; m.userData.spin = 1; return hot(m, { act: function () { pick(k, m); } }); });
      later(0.6, function () { mark(gems); });
      function pick(k, m) {
        x.spec.color = k[0]; snd.chime(); tone(1760, 1.2, 'sine', 0.05); mark([]); gems.forEach(function (q) { q.userData.swx.on = false; });
        var wp = m.getWorldPosition(new T.Vector3()).sub(S.position); box.remove(m); x.tmp.add(m); m.position.copy(wp); gem = m;
        tween(m, { pos: [-0.8, 1.46, 1.04] }, 0.7); tween(lid, { rot: new T.Euler(0, 0, 0) }, 0.5); later(0.6, function () { tween(box, { scale: 0.001 }, 0.4); });
        later(1.1, buildStep);
      }
    }
    /* 3 — the tray of parts and the chassis */
    var loose = [], core = null, mounted = { 'switch': null, sleeveA: null, sleeveB: null, emitter: null, pommel: null }, seated = false;
    function need() { return !seated ? 'crystal' : !mounted['switch'] ? 'switch' : (!mounted.sleeveA || !mounted.sleeveB) ? 'sleeve' : !mounted.emitter ? 'emitter' : !mounted.pommel ? 'pommel' : 'done'; }
    var ORDER = ['crystal', 'switch', 'sleeve', 'emitter', 'pommel'], NAMES = { crystal: '水晶', 'switch': '激活板与开关', sleeve: '握套 ×2', emitter: '发射口', pommel: '尾盖' };
    function refresh() {
      var n = need(); chips(ORDER.map(function (k) { return { label: NAMES[k], done: ORDER.indexOf(k) < (n === 'done' ? 9 : ORDER.indexOf(n)), now: k === n }; }));
      mark(n === 'crystal' ? [gem] : loose.filter(function (p) { return p.userData.kind === n && !p.userData.slot; }));
      if (n === 'done') { mark([]); later(0.5, screwStep); }
      else say({ crystal: '先把水晶放进剑柄中间的水晶舱：点一下水晶。', 'switch': '水晶亮了！现在选一组激活板和开关，扣在水晶舱外面。', sleeve: '再选两段握套——四段里挑两段，套在上下两头。点已装上的可以换下来。', emitter: '选一个发射口，装在剑柄顶端。', pommel: '最后选一个尾盖，装在底部。' }[n]);
    }
    function buildStep() {
      step('组装剑柄', '这一盘零件属于你选的道路。剑柄的骨架在托架上。');
      core = chassis(null); core.scale.setScalar(K); core.position.set(C[0], C[1], C[2]); core.rotation.z = -Math.PI / 2; x.tmp.add(core);
      [-0.2, 0.2].forEach(function (dx) { add(new T.BoxGeometry(0.03, 0.14, 0.1), Lm(0x8a6a3c), dx, 1.29, 0.92); });
      var lay = function (kind, i, hx, hz) { var p = hiltPart(kind, x.spec.theme, i); p.scale.setScalar(0.001); p.position.set(hx, 1.33, hz); p.userData = { kind: kind, i: i, home: [hx, 1.33, hz], slot: null }; x.tmp.add(p); tween(p, { scale: K }, 0.4); loose.push(p); hot(p, { act: function () { clickPart(p); } }); };
      [0, 1, 2, 3].forEach(function (i) { lay('sleeve', i, -0.62 + i * 0.22, 1.28); }); [0, 1].forEach(function (i) { lay('switch', i, 0.42 + i * 0.22, 1.28); lay('emitter', i, 0.45 + i * 0.21, 0.76); lay('pommel', i, -0.74 + i * 0.2, 0.76); });
      hot(gem, { act: function () { if (seated) return; seated = true; gem.userData.swx.on = false; snd.chime(); tween(gem, { pos: [C[0] - 0.005 * K, C[1], C[2]], scale: 0.3 }, 0.5, function () { gem.visible = false; core.userData.gem.visible = true; core.userData.gem.material.color.set(x.spec.color); core.userData.glass.material.color.set(x.spec.color); core.userData.glass.material.opacity = 0.6; tone(1320, 0.8, 'sine', 0.08); refresh(); }); } });
      later(0.5, refresh);
    }
    function unmount(p) { mounted[p.userData.slot] = null; p.userData.slot = null; tween(p, { pos: p.userData.home, rot: new T.Euler(0, 0, 0), arc: 0.12 }, 0.4); }
    function clickPart(p) {
      var kind = p.userData.kind, n = need(), ki = ORDER.indexOf(kind), ni = n === 'done' ? 9 : ORDER.indexOf(n);
      if (ki > ni) { snd.buzz(); say('别急——先装「' + NAMES[n] + '」。'); return; }
      if (p.userData.slot) { unmount(p); snd.tick(); refresh(); return; }
      var slot = kind;
      if (kind === 'sleeve') { slot = !mounted.sleeveA ? 'sleeveA' : !mounted.sleeveB ? 'sleeveB' : 'sleeveA'; }
      if (mounted[slot]) unmount(mounted[slot]);
      mounted[slot] = p; p.userData.slot = slot;
      tween(p, { pos: [C[0] + SLOT_Y[slot] * K, C[1], C[2]], rot: new T.Euler(0, 0, -Math.PI / 2), arc: 0.16 }, 0.45, function () { snd.latch(); });
      refresh();
    }
    /* 4 — the emitter and the pommel screw into place */
    function screwStep() {
      loose.forEach(function (p) { p.userData.swx.on = false; if (!p.userData.slot) tween(p, { scale: 0.001 }, 0.4); });
      x.spec.sleeves = [mounted.sleeveA.userData.i, mounted.sleeveB.userData.i]; x.spec.emitter = mounted.emitter.userData.i; x.spec.pommel = mounted.pommel.userData.i; x.spec.sw = mounted['switch'].userData.i;
      step('拧紧', '发射口和尾盖要拧进去才牢。按住发射口不放，再按住尾盖不放，直到拧紧。'); chips([{ label: '发射口', now: true }, { label: '尾盖' }]);
      var doneN = 0, mk = function (p, lab) { p.userData.swx = { on: true, hold: { dur: 1.4, k: 0, tick: function (k, dt) { p.rotation.x += dt * 9; if (Math.floor(k * 12) !== Math.floor((k - dt / 1.4) * 12)) snd.tick(); }, done: function () { p.userData.swx.on = false; snd.latch(); tone(520, 0.2, 'triangle', 0.1); doneN++; chips([{ label: '发射口', done: !mounted.emitter.userData.swx.on, now: mounted.emitter.userData.swx.on }, { label: '尾盖', done: !mounted.pommel.userData.swx.on, now: mounted.pommel.userData.swx.on }]); mark([mounted.emitter, mounted.pommel].filter(function (q) { return q.userData.swx.on; })); if (doneN === 2) later(0.4, inspectStep); } } }; };
      mk(mounted.emitter); mk(mounted.pommel); mark([mounted.emitter, mounted.pommel]);
    }
    /* 5 — the Gatherer looks it over; into the activation chamber; the lights go down */
    var hilt = null;
    function inspectStep() {
      loose.forEach(function (p) { x.tmp.remove(p); }); x.tmp.remove(core); x.hot = x.hot.filter(function (o) { return loose.indexOf(o) < 0; });
      hilt = saber(x.spec); hilt.userData.blade.visible = false; hilt.scale.setScalar(K); hilt.position.set(C[0], C[1], C[2]); hilt.rotation.z = -Math.PI / 2; x.tmp.add(hilt);
      step('采集者的检查', '让我看看……握套服帖，开关利落，水晶在唱歌。很好。现在是最危险的一步：点一下剑柄，把它放进旁边的激活舱。'); snd.chime(); chips([]);
      tween(hilt, { pos: [C[0], C[1] + 0.16, C[2]], rot: new T.Euler(0.5, 0, -Math.PI / 2) }, 0.8);
      hot(hilt, { act: toTube }); later(0.9, function () { mark([hilt]); });
    }
    function toTube() {
      hilt.userData.swx.on = false; mark([]); snd.tick();
      tween(hilt, { pos: [0.98, 2.3, 0.86], rot: new T.Euler(0, 0, 0), arc: 0.1 }, 0.7, function () { tween(hilt, { pos: [0.98, 1.6, 0.86] }, 0.8, function () { snd.thump(); dimStep(); }); });
    }
    function dimStep() {
      step('激活舱', '灯暗下来了。闭上眼睛，听——水晶和剑柄，正在原力里连成一体。'); hud.dim.style.opacity = 1; x.state = 'dim'; x.t0 = clock;
      B.gath.forEach(function (q) { q.sb.userData.blade.visible = false; }); tone(55, 5.2, 'sine', 0.16, 110); tone(82.5, 5.2, 'sine', 0.08, 165);
      later(5.4, function () { x.state = ''; tubeGlow.material.opacity = 0; hud.dim.style.opacity = 0.55; igniteStep(); });
    }
    /* 6 — ignite; 7 — raise it */
    function igniteStep() {
      camTo(0, 2.34, 2.25, 0, 1.95, -0.6);
      tween(hilt, { pos: [0.98, 2.4, 0.86] }, 0.6, function () { tween(hilt, { pos: [0.26, 1.84, 1.6], scale: 1.5, rot: new T.Euler(-0.15, 0, 0), arc: 0.1 }, 0.8, function () { x.state = 'ready'; hilt.userData.swx.on = true; hilt.userData.swx.act = ignite; mark([hilt]); }); });
      step('点亮', '它是你的了。按下开关——点一下光剑，或按空格键。');
    }
    function ignite() {
      if (x.state !== 'ready') return; x.state = 'lit'; x.lit = 0; x.raise = 0; x.hold = 0; mark([]); hilt.userData.swx.on = false; hilt.userData.blade.visible = true; hilt.userData.blade.scale.y = 0.001;
      W.fx(true); W.hum(true); hud.dim.style.opacity = 0.3;
      B.gath.forEach(function (q, i) { later(0.5 + i * 0.22, function () { q.sb.userData.blade.visible = true; q.sb.userData.blade.scale.y = 0.001; q.lit = clock; noise(0.3, 300, 3000, 0.1); }); });
      later(1.6, function () { step('举起光剑', '采集者们都点亮了。现在把光剑高高举起——把鼠标（手指）往上移，或按住 W 键。'); });
    }
    x.key = function (code) { if (code === 'Space' || code === 'Enter') ignite(); };
    x.frame = function (dt) {
      if (x.state === 'dim') { var k = Math.min(1, (clock - x.t0) / 5); B.lamp2.intensity = 0.8 - k * 0.7; tubeGlow.material.color.set(x.spec.color); tubeGlow.material.opacity = k * (0.5 + 0.3 * Math.sin(clock * 9)); B.great.scale.setScalar(1 + k * 0.5 + Math.sin(clock * 6) * 0.08 * k); }
      if (gem && gem.visible) { gem.rotation.y += dt * 1.6; }
      if (x.state === 'lit' || x.state === 'done') {
        x.lit += dt; hilt.userData.blade.scale.y = Math.max(0.001, Math.min(1, x.lit / 0.45));
        B.gath.forEach(function (q) { if (q.lit) q.sb.userData.blade.scale.y = Math.max(0.001, Math.min(1, (clock - q.lit) / 0.5)); });
        var up = keys.KeyW || keys.ArrowUp ? 1 : Math.max(0, Math.min(1, (x.my + 0.1) / 0.6)), px = x.raise; x.raise += (up - x.raise) * Math.min(1, dt * 5);
        hilt.position.set(0.26 - x.mx * 0.3 - x.raise * 0.2, 1.84 + x.raise * 0.42, 1.6); hilt.rotation.set(-0.15 - x.raise * 0.25, 0, x.mx * 0.55);
        W.swing(Math.min(6, (Math.abs(x.raise - px) / Math.max(dt, 0.001)) * 2.5 + Math.abs(x.mx - (x.pmx || 0)) / Math.max(dt, 0.001) * 1.5)); x.pmx = x.mx;
        if (x.state === 'lit' && x.lit > 1.6) { if (x.raise > 0.8) x.hold += dt; else x.hold = Math.max(0, x.hold - dt); if (x.hold > 1.0) { x.state = 'done'; snd.fanfare(); B.gath.forEach(function (q) { q.up = clock; }); B.lamp2.intensity = 1.2; hud.dim.style.opacity = 0; step('光剑铸成', '愿原力与你同在。带上你的光剑，回到黑尖塔前哨站去吧。（按 L 或右下角 ⚔️ 可以收起、点亮）'); later(4.2, function () { var spec = x.spec; stop(); W.set('saber', { theme: spec.theme, color: spec.color, sleeves: spec.sleeves, emitter: spec.emitter, pommel: spec.pommel, sw: spec.sw }); API.toast('⚔️ 你亲手造的光剑在手里了！'); }); } }
      }
    };
  }

  /* ================================================================ Droid Depot */
  function startDepot() {
    var G = B.depotGroup, dp = B.depot, x = begin(G, { p: [dp.x, 0, dp.z + 3.6], t: [dp.x, 41.2, dp.z - 0.6] });
    x.spec = { body: null, parts: {} }; x.kind = 'droid';
    if (B.demo) B.demo.visible = false; x.undo.push(function () { if (B.demo) B.demo.visible = true; B.parts.forEach(function (p) { p.visible = true; }); B.ring.material.color.set(0x38bdf8); });
    /* the registration boards: the two units' blueprints */
    camTo(-4.6, 1.75, 5.5, -4.6, 1.55, 3.4);
    var boards = [['r2', 'R 系列', ['顶盖 DOME', '机身 BODY', '中腿 CENTER LEG', '侧腿 ×2 SIDE LEGS']], ['bb', 'BB 系列', ['顶盖 DOME', '连接板 PLATE', '球体 SPHERE', '驱动器 MOTIVATOR']]].map(function (q, i) {
      var c = document.createElement('canvas'); c.width = 512; c.height = 384; var d = c.getContext('2d'); d.fillStyle = '#12336b'; d.fillRect(0, 0, 512, 384); d.strokeStyle = 'rgba(255,255,255,.14)'; for (var k = 0; k < 512; k += 32) { d.beginPath(); d.moveTo(k, 0); d.lineTo(k, 384); d.moveTo(0, k); d.lineTo(512, k); d.stroke(); }
      d.strokeStyle = '#fff'; d.lineWidth = 4; d.strokeRect(8, 8, 496, 368); d.fillStyle = '#fde68a'; d.font = '800 46px sans-serif'; d.fillText(q[1], 28, 64); d.fillStyle = '#e0f2fe'; d.font = '700 22px "PingFang SC",sans-serif'; q[2].forEach(function (t, j) { d.fillText('□ ' + t, 262, 130 + j * 46); });
      d.lineWidth = 5; if (i === 0) { d.beginPath(); d.arc(130, 170, 70, Math.PI, 0); d.stroke(); d.strokeRect(60, 170, 140, 130); d.strokeRect(28, 190, 26, 140); d.strokeRect(206, 190, 26, 140); d.strokeRect(108, 300, 44, 44); } else { d.beginPath(); d.arc(130, 250, 88, 0, 7); d.stroke(); d.beginPath(); d.arc(130, 160, 52, Math.PI, 0); d.closePath(); d.stroke(); d.beginPath(); d.arc(130, 250, 34, 0, 7); d.stroke(); }
      var m = add(new T.PlaneGeometry(1.5, 1.12), new T.MeshBasicMaterial({ map: new T.CanvasTexture(c) }), -5.42 + i * 1.64, 1.6, 3.4); add(new T.BoxGeometry(1.6, 1.22, 0.06), Lm(0x334155), -5.42 + i * 1.64, 1.6, 3.36); add(new T.BoxGeometry(0.1, 1.1, 0.1), Lm(0x1f2937), -5.42 + i * 1.64, 0.6, 3.34);
      return hot(m, { act: function () { x.spec.body = q[0]; snd.chime(); mark([]); boards.forEach(function (b) { b.userData.swx.on = false; }); later(0.5, partsStep); } });
    });
    step('登记', '欢迎来到机器人工坊。先登记你要造的型号，拿走它的蓝图：点左边的 R 系列，或右边的 BB 系列。'); mark(boards);

    var SLOTS, LBL = { dome: '顶盖', body: '机身', legC: '中腿', legL: '左侧腿', legR: '右侧腿', plate: '连接板', sphere: '球体', motivator: '驱动器' }, typeOf = function (s) { return s === 'legL' || s === 'legR' ? 'legS' : s; };
    function showChips(now) { chips(SLOTS.map(function (s) { return { label: LBL[s], col: x.spec.parts[s], done: !!x.spec.parts[s] && !now, now: now === s }; })); }
    /* the Parts Station: pick each part off the moving belt */
    var basket = null, inBasket = {}, rolled = 0;
    function roll(b) {   /* a new part comes onto the belt: more often one the blueprint still lacks */
      if (b.m) x.tmp.remove(b.m);
      var all = SLOTS.map(typeOf), missing = SLOTS.filter(function (s) { return !x.spec.parts[s]; }).map(typeOf), pool = missing.length && rolled % 2 === 0 ? missing : all, t = pool[Math.floor(Math.random() * pool.length)], col = DCOLS[(rolled * 5 + Math.floor(Math.random() * 6)) % 6]; rolled++;
      var m = droidPart(x.spec.body, t, col); m.scale.setScalar(t === 'sphere' ? 0.62 : t === 'body' ? 0.75 : 0.85);
      m.position.set(b.x, 1.24 + (t === 'sphere' ? 0.28 : t === 'body' ? 0.27 : t === 'legS' ? 0.36 : t === 'legC' ? 0.14 : 0.02), -4.6); x.tmp.add(m);
      b.m = m; b.t = t; b.col = col; hot(m, { act: function () { if (b.m === m) take(b); } });
    }
    function take(b) {
      var m = b.m; b.m = null; m.userData.swx.on = false; snd.latch();
      var slot = b.t === 'legS' ? (!x.spec.parts.legL ? 'legL' : !x.spec.parts.legR ? 'legR' : (x.legFlip = !x.legFlip) ? 'legL' : 'legR') : b.t;
      x.spec.parts[slot] = b.col; if (inBasket[slot]) x.tmp.remove(inBasket[slot]); inBasket[slot] = m;
      tween(m, { pos: [-0.55 + SLOTS.indexOf(slot) * 0.28, 1.05, -3.5], scale: 0.3, arc: 0.5 }, 0.55);
      showChips(); later(0.25, function () { if (x.belt) { b.x = -7.2; roll(b); } });
      if (SLOTS.every(function (s) { return x.spec.parts[s]; }) && !x.partsDone) {
        x.partsDone = true;
        later(1.2, function () { say('零件齐了！不满意还可以再换——满意的话，点一下篮子，带去组装台。'); hot(basket, { act: leaveBelt }); mark([basket]); });
      }
    }
    function leaveBelt() {
      basket.userData.swx.on = false; mark([]); x.belt.forEach(function (q) { if (q.m) x.tmp.remove(q.m); }); x.belt = null;
      Object.keys(inBasket).forEach(function (k) { x.tmp.remove(inBasket[k]); }); x.tmp.remove(basket); B.parts.forEach(function (p) { p.visible = true; }); snd.chime(); buildStep();
    }
    function partsStep() {
      SLOTS = x.spec.body === 'bb' ? ['dome', 'plate', 'sphere', 'motivator'] : ['dome', 'body', 'legC', 'legL', 'legR'];
      camTo(0, 2.0, -1.5, 0, 1.45, -4.6); B.parts.forEach(function (p) { p.visible = false; });
      step('零件站', '传送带上滚过来的都是零件，颜色随你挑。蓝图上要的每一样，都从传送带上点下来放进篮子。'); showChips();
      basket = new T.Group(); basket.position.set(0, 0.95, -3.5); x.tmp.add(basket); add(new T.BoxGeometry(1.5, 0.05, 0.6), Lm(0x374151), 0, 0, 0, basket);
      [[-0.75, 0, 0.05, 0.6], [0.75, 0, 0.05, 0.6], [0, -0.3, 1.5, 0.05], [0, 0.3, 1.5, 0.05]].forEach(function (q) { add(new T.BoxGeometry(q[2], 0.3, q[3]), Lm(0x4b5563, { transparent: true, opacity: 0.55 }), q[0], 0.15, q[1], basket); });
      x.belt = []; for (var i = 0; i < 9; i++) { var b = { x: -6 + i * 1.45, m: null }; x.belt.push(b); roll(b); }
    }
    /* the Build Station: in the placemat's order, then every bolt */
    var D = null, dparts, order, oi = 0, SC = 1.45, PAD = [0, 0.62, -0.6];
    function buildStep() {
      camTo(0, 2.25, 3.9, 0, 1.25, 0.1); mark([]);
      add(new T.BoxGeometry(3.6, 0.1, 0.8), Lm(0x55606e), 0, 0.8, 1.4); [[-1.7, 1.1], [1.7, 1.1], [-1.7, 1.7], [1.7, 1.7]].forEach(function (q) { add(new T.BoxGeometry(0.1, 0.75, 0.1), Lm(0x374151), q[0], 0.42, q[1]); });
      D = droid(x.spec); D.scale.setScalar(SC); D.position.set(PAD[0], PAD[1], PAD[2]); x.tmp.add(D); dparts = D.userData.parts; order = D.userData.order; oi = 0;
      order.forEach(function (name, i) { var p = dparts[name]; p.userData.home = p.position.clone(); var bx = (-1.4 + i * (2.8 / (order.length - 1))), lift = name === 'sphere' ? 0.42 : name === 'body' ? 0.36 : name === 'legL' || name === 'legR' ? 0.42 : name === 'legC' ? 0.17 : 0.02; p.position.set((bx - PAD[0]) / SC, (0.86 - PAD[1]) / SC + lift, (1.4 - PAD[2]) / SC); if (name === 'legL' || name === 'legR') p.rotation.y = 0; hot(p, { act: function () { fit(name, p); } }); });
      step('组装台', '照着蓝图的顺序，把零件一件件装上去。黄色箭头指着下一件。'); nextPart();
    }
    function nextPart() { if (oi >= order.length) { mark([]); return later(0.6, boltStep); } showChips(order[oi]); mark([dparts[order[oi]]]); }
    function fit(name, p) {
      var want = order[oi], ok = name === want || (/^leg[LR]$/.test(name) && /^leg[LR]$/.test(want));
      if (!ok) { snd.buzz(); say('先装「' + LBL[want] + '」——蓝图上它在前面。'); return; }
      if (name !== want) { var j = order.indexOf(name); order[j] = want; order[oi] = name; }
      p.userData.swx.on = false; var h = p.userData.home; tween(p, { pos: [h.x, h.y, h.z], arc: 0.5 }, 0.6, function () { snd.latch(); }); oi++; later(0.35, nextPart);
    }
    function boltStep() {
      var pts = x.spec.body === 'bb' ? [[0.2, 0.93, 0.13], [-0.2, 0.93, 0.13], [0, 0.5, 0.44], [0, 0.07, 0.25]] : [[-0.5, 0.78, 0.04], [0.5, 0.78, 0.04], [0, 0.42, 0.36], [0, 1.0, 0.36], [0, 0.2, 0.42]], left = pts.length;
      step('电动螺丝刀', '零件都到位了。拿起电动螺丝刀：按住每一颗发亮的螺栓，直到它拧到底变绿。'); chips([{ label: '螺栓 0/' + pts.length, now: true }]);
      var tool = new T.Group(); x.tmp.add(tool); add(new T.CylinderGeometry(0.035, 0.035, 0.34, 10), Lm(0xf97316), 0, 0, 0.2, tool).rotation.x = Math.PI / 2; add(new T.BoxGeometry(0.07, 0.2, 0.09), Lm(0x1f2937), 0, -0.12, 0.32, tool); add(new T.CylinderGeometry(0.012, 0.012, 0.1, 6), Lm(0xd1d5db), 0, 0, 0, tool).rotation.x = Math.PI / 2; tool.position.set(1.4, 0.95, 1.4); x.tool = tool;
      var bolts = pts.map(function (q) { var b = add(new T.CylinderGeometry(0.035, 0.035, 0.06, 8), Bm(0xfde047), q[0], q[1], q[2] + 0.03, D); b.rotation.x = Math.PI / 2;
        return hot(b, { hold: { dur: 0.9, k: 0, tick: function (k, dt) { b.rotation.y += dt * 22; b.position.z = q[2] + 0.03 - k * 0.03; var wp = b.getWorldPosition(new T.Vector3()).sub(G.position); tool.position.set(wp.x, wp.y, wp.z + 0.06); whirrSet(true, k); }, done: function () { b.userData.swx.on = false; b.material.color.set(0x4ade80); whirrSet(false); snd.latch(); left--; chips([{ label: '螺栓 ' + (pts.length - left) + '/' + pts.length, now: left > 0, done: !left }]); mark(bolts.filter(function (o) { return o.userData.swx.on; })); if (!left) { tween(tool, { pos: [1.4, 0.95, 1.4] }, 0.5); later(0.7, activateStep); } } } }); });
      mark(bolts);
    }
    /* ACTIVATE, then the remote */
    function activateStep() {
      var con = new T.Group(); con.position.set(-1.35, 0.85, 1.4); x.tmp.add(con); add(new T.BoxGeometry(0.5, 0.12, 0.4), Lm(0x1f2937), 0, 0.06, 0, con); var btn = add(new T.CylinderGeometry(0.13, 0.13, 0.08, 20), Bm(0xef4444), 0, 0.16, 0, con); add(new T.TorusGeometry(0.15, 0.02, 6, 20), Lm(0xd1d5db), 0, 0.13, 0, con).rotation.x = Math.PI / 2;
      step('启动', '最后一步：把手按在红色的「启动」按钮上不放，给它充能。'); chips([{ label: '充能', now: true }]);
      hot(btn, { hold: { dur: 2.0, k: 0, tick: function (k) { btn.position.y = 0.16 - 0.03; B.ring.material.color.setHSL(0.55 - k * 0.4, 1, 0.5 + k * 0.3); whirrSet(true, k * 1.6); D.position.y = PAD[1] + Math.sin(clock * 40) * 0.006 * k; }, done: function () { btn.userData.swx.on = false; btn.material.color.set(0x4ade80); whirrSet(false); snd.thump(); mark([]); x.awake = clock; snd.beeps(); later(0.7, snd.beeps); step('它醒了！', '听，它在和你打招呼。接过遥控器——用方向键或 WASD（或屏幕下方的按钮）开着它，穿过地上的三个光圈。'); later(2.6, driveStep); } } });
      mark([btn]);
    }
    function driveStep() {
      camTo(0, 2.6, 5.75, 0, 0.5, 3.2); hud.pad.style.display = 'grid'; chips([{ label: '光圈 0/3', now: true }]);
      var wp = D.position.clone(); x.drive = { h: 0, x: 0, z: 2.6, got: 0 }; tween(D, { pos: [0, 0.22, 2.6], scale: 1.0, arc: 0.6 }, 0.9, function () { x.state = 'drive'; });
      x.rings = [[-2.6, 3.0], [2.7, 3.3], [0.2, 4.5]].map(function (q) { var r = add(new T.TorusGeometry(0.5, 0.05, 8, 28), Bm(0x38bdf8), q[0], 0.26, q[1]); r.rotation.x = Math.PI / 2; r.userData.q = q; return r; }); void wp;
    }
    x.frame = function (dt) {
      if (x.belt) { x.belt.forEach(function (b) { if (!b.m) return; b.x += dt * 0.75; if (b.x > 6.6) { b.x = -6.6; roll(b); } b.m.position.x = b.x; b.m.rotation.y += dt * 0.5; }); x.hot = x.hot.filter(function (o) { return o.parent; }); }
      if (D && x.awake) { var hd = D.userData.head; if (x.state !== 'drive') hd.rotation.y = Math.sin((clock - x.awake) * 5) * 0.9; if (D.userData.lamp) D.userData.lamp.visible = Math.sin(clock * 8) > 0; }
      if (x.state === 'drive') {
        var d = x.drive, turn = (keys.ArrowLeft || keys.KeyA ? 1 : 0) - (keys.ArrowRight || keys.KeyD ? 1 : 0), go = (keys.ArrowUp || keys.KeyW ? 1 : 0) - (keys.ArrowDown || keys.KeyS ? 1 : 0);
        d.h += turn * dt * 2.4; var sp = go * 2.2 * dt; d.x = Math.max(-3.4, Math.min(3.6, d.x + Math.sin(d.h) * sp)); d.z = Math.max(2.1, Math.min(5.2, d.z + Math.cos(d.h) * sp));
        D.position.set(d.x, 0.22, d.z); D.rotation.y = d.h; if (D.userData.ball) D.userData.ball.rotation.x += sp / 0.42; D.userData.head.rotation.y = turn * 0.5; if (go && Math.random() < dt * 1.5) tone(600 + Math.random() * 900, 0.08, 'square', 0.03);
        x.rings.forEach(function (r) { if (r.userData.got) return; r.rotation.z += dt; if (Math.hypot(d.x - r.userData.q[0], d.z - r.userData.q[1]) < 0.6) { r.userData.got = true; r.material.color.set(0x4ade80); snd.chime(); d.got++; chips([{ label: '光圈 ' + d.got + '/3', now: d.got < 3, done: d.got === 3 }]); if (d.got === 3) { x.state = 'won'; hud.pad.style.display = 'none'; snd.fanfare(); snd.beeps(); step('出厂！', '漂亮！它已经认得你了。从现在起，它会跟着你走遍整个乐园。'); later(4, function () { var spec = x.spec; stop(); W.set('droid', { body: spec.body, parts: spec.parts, color: spec.parts.dome }); API.toast('🤖 你亲手造的机器人跟上来了！'); }); } } });
      }
      if (x.state === 'won' && D) { D.rotation.y += dt * 5; D.position.y = 0.22 + Math.abs(Math.sin(clock * 7)) * 0.15; }
    };
  }

  /* ================================================================ per frame, and the pointer */
  function pick(e) {
    if (!X) return null; var r = API.canvas.getBoundingClientRect(); ndc.set(((e.clientX - r.left) / r.width) * 2 - 1, -((e.clientY - r.top) / r.height) * 2 + 1); X.mx = ndc.x; X.my = ndc.y;
    ray.setFromCamera(ndc, API.camera); var list = X.hot.filter(function (o) { return o.userData.swx && o.userData.swx.on && o.parent; }), h = ray.intersectObjects(list, true);
    for (var i = 0; i < h.length; i++) { for (var o = h[i].object; o; o = o.parent) if (o.userData && o.userData.swx && o.userData.swx.on) return o; }
    return null;
  }
  function tick(now) {
    requestAnimationFrame(tick); var dt = Math.min(0.05, (now - (tick.last || now)) / 1000); tick.last = now; clock += dt;
    if (!X) return; var x = X, P = API.player, i;
    if (!API.state.ui) API.setUI(true);
    if (x.cam) { var c = x.cam, k = Math.hypot(c.p.x - P.pos.x, c.p.z - P.pos.z) > 14 ? 1 : Math.min(1, dt * 3.2),   /* from far away: there at once */ dx = c.t.x - c.p.x, dy = c.t.y - c.p.y, dz = c.t.z - c.p.z; P.pos.x += (c.p.x - P.pos.x) * k; P.pos.y += (c.p.y - 1.62 - P.pos.y) * k; P.pos.z += (c.p.z - P.pos.z) * k; if (P.vel) P.vel.set(0, 0, 0);
      var yaw = Math.atan2(-dx, -dz), pitch = Math.atan2(dy, Math.hypot(dx, dz)); P.yaw += Math.atan2(Math.sin(yaw - P.yaw), Math.cos(yaw - P.yaw)) * k; P.pitch += (pitch - P.pitch) * k; }
    for (i = x.timers.length - 1; i >= 0; i--) { var tm = x.timers[i]; tm.t -= dt; if (tm.t <= 0) { x.timers.splice(i, 1); try { tm.fn(); } catch (e) { if (root.console) console.warn('[sw experience]', e); } if (X !== x) return; } }
    for (i = x.tw.length - 1; i >= 0; i--) { var w = x.tw[i]; w.t = Math.min(1, w.t + dt / w.d); var s = w.t * w.t * (3 - 2 * w.t); if (w.p1) { w.o.position.lerpVectors(w.p0, w.p1, s); w.o.position.y += Math.sin(s * Math.PI) * w.arc; } if (w.r1) w.o.rotation.set(w.r0.x + (w.r1.x - w.r0.x) * s, w.r0.y + (w.r1.y - w.r0.y) * s, w.r0.z + (w.r1.z - w.r0.z) * s); if (w.s1 != null) w.o.scale.setScalar(w.s0 + (w.s1 - w.s0) * s); if (w.t >= 1) { x.tw.splice(i, 1); if (w.cb) { try { w.cb(); } catch (e) { if (root.console) console.warn('[sw experience]', e); } if (X !== x) return; } } }
    if (x.held) { var hd = x.held.userData.swx, H = hd.hold; if (!hd.on) { x.held = null; hud.ring.style.display = 'none'; whirrSet(false); } else { H.k = Math.min(1, H.k + dt / H.dur); hud.ring.style.display = 'block'; hud.bar.style.width = (H.k * 100) + '%'; H.tick(H.k, dt); if (H.k >= 1) { x.held = null; hud.ring.style.display = 'none'; H.done(); if (X !== x) return; } } }
    if (x.frame) x.frame(dt);
    /* the yellow arrows over what to touch next */
    var v = new T.Vector3(), bx = new T.Box3();
    for (i = 0; i < Math.max(markers.length, x.marks.length); i++) {
      var m = markers[i]; if (!m) { m = new T.Mesh(new T.ConeGeometry(0.05, 0.13, 10), new T.MeshBasicMaterial({ color: 0xfde047, depthTest: false })); m.rotation.x = Math.PI; m.renderOrder = 9; API.scene.add(m); markers[i] = m; }
      var o = x.marks[i]; if (!o || !o.parent || !(o.userData.swx && o.userData.swx.on)) { m.visible = false; continue; }
      bx.setFromObject(o); bx.getCenter(v); m.visible = true; m.position.set(v.x, bx.max.y + 0.1 + Math.abs(Math.sin(clock * 4)) * 0.06, v.z); m.rotation.y = clock * 2;
    }
  }
  function attach(api) {
    if (API || !api) return; API = api; T = api.THREE; ray = new T.Raycaster(); ndc = new T.Vector2();
    var go = function () { W = root.TPStarWarsWorkshops; B = root.TPStarWarsBuildings; if (!W || !B || !B.saviGroup) return setTimeout(go, 200); W.reapply(); };
    go();
    var cv = API.canvas;
    cv.addEventListener('pointerdown', function (e) { if (!X) return; e.stopPropagation(); var o = pick(e); if (!o) return; var s = o.userData.swx; if (s.hold) { X.held = o; } else if (s.act) { try { s.act(); } catch (er) { if (root.console) console.warn('[sw experience]', er); } } }, true);
    cv.addEventListener('pointermove', function (e) { if (!X) return; var o = pick(e); cv.style.cursor = o ? 'pointer' : 'default'; if (X.held && o !== X.held) { X.held = null; hud.ring.style.display = 'none'; whirrSet(false); } }, true);
    ['pointerup', 'pointercancel', 'pointerleave'].forEach(function (ev) { cv.addEventListener(ev, function () { if (X && X.held) { X.held = null; hud.ring.style.display = 'none'; whirrSet(false); } }, true); });
    ['mousedown', 'click', 'touchstart'].forEach(function (ev) { cv.addEventListener(ev, function (e) { if (X) e.stopPropagation(); }, true); });
    root.addEventListener('keydown', function (e) { if (!X) return; if (/INPUT|TEXTAREA/.test((e.target && e.target.tagName) || '')) return; e.stopImmediatePropagation(); e.preventDefault(); if (e.key === 'Escape') return stop(); keys[e.code] = true; if (!e.repeat && X.key) X.key(e.code); }, true);
    root.addEventListener('keyup', function (e) { if (!X) return; e.stopImmediatePropagation(); keys[e.code] = false; }, true);
    requestAnimationFrame(tick);
  }
  function start(kind) { if (!API || !W || !B || !B.saviGroup) return; try { if (kind === 'saber') startSavi(); else startDepot(); } catch (e) { if (root.console) console.warn('[sw experience]', e); stop(); } }
  if (root.TPParkAPI) attach(root.TPParkAPI); else root.addEventListener('tp:park-ready', function (e) { attach(e.detail || root.TPParkAPI); });
  root.TPSWExperience = { start: start, stop: stop, active: function () { return X ? X.kind : null; }, _x: function () { return X; } };
})(window);

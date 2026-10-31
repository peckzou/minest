    /* ── Walk in 2.0 (patch_walk_in.py) — the Minecraft way: go into buildings, sit down, sleep, talk to people, pet animals
       Near a building: 🚪 Go in (or tap it) — you walk its rooms (chips at the top switch rooms, 🌳 Outside goes back
       out where you came in). Tap a sofa / chair / bench to sit (move the stick or ⬆ Stand up), a bed to sleep till
       morning. People and animals wander on their own; tap a person to talk (they turn to you, hop, say a line about
       your cards), tap an animal to pet it (hearts). Nothing here is saved, except a building's first rooms (as when
       you open it). */
    var WKX = (function () {
      var amb = null, rainIn = null, wxOff = null, flOff = null, W = null, sky = null, stars = null, rainFx = null, snowFx = null, clouds = null, lights = null, flashT = 0, portals = [], nearP = null, spawnT = 0, bld = [], seats = [], mobs = [], act = null, rooms = null, fade = null, sit = null, steps = null, nearB = null, chkT = 0, lines = null;
      var SFX = function (n, k) { if (window.MinestSfx) MinestSfx.play(n, k); };
      function cry(m) { var n = K[m.p.k].n.toLowerCase(); return /dog/.test(n) ? 'bark' : /cat/.test(n) ? 'meow' : /sheep|goat/.test(n) ? 'baa' : /cow/.test(n) ? 'moo' : /chicken|hen|duck|bird/.test(n) ? 'cluck' : /fox/.test(n) ? 'yip' : 'pop'; }
      function pitch(m) { return /kid/.test(m.p.k) ? 1.5 : /chef/.test(m.p.k) ? .85 : /gardener/.test(m.p.k) ? 1.1 : 1; }
      var SEAT = /^(f_sofa|f_armchair|f_desk|f_dining|f_piano|f_toilet|bench|f_vanity)$/, BED = /^(f_bed1|f_bed2|f_bunk)$/;
      function enterable(p, ext) { if (room || !p || K[p.k].mob) return false; if (isBld(p) || /^(c_|k_|h_|bld:)/.test(p.k)) return true;
        return !K[p.k].decor && ext[5] - ext[4] > 2.2 && (ext[1] - ext[0]) * (ext[3] - ext[2]) >= 4; }
      function ui() {
        if (act) return; ov.insertAdjacentHTML('beforeend', '<button type="button" class="wk-x wk-act" hidden></button><div class="wk-x wk-rooms" hidden></div><div class="wk-fade"><b></b></div>');
        act = ov.querySelector('.wk-act'); rooms = ov.querySelector('.wk-rooms'); fade = ov.querySelector('.wk-fade');
        act.addEventListener('click', function (e) { e.stopPropagation(); var a = act.getAttribute('data-a'); if (a === 'in' && nearB) goIn(nearB.p); else if (a === 'up') standUp(); else if (a === 'portal' && nearP) goPortal(nearP); });
        rooms.addEventListener('click', function (e) { e.stopPropagation(); var g = e.target.closest('[data-wr]'); if (!g) return; var id = g.getAttribute('data-wr'); if (id === 'out') goOut(); else goRoom(id); });
        var b = bOf(); if (b) {
          rooms.innerHTML = '<button type="button" data-wr="out">🌳 Outside</button>' + ((b && b.rooms) || []).map(function (r) { return '<button type="button" data-wr="' + r.id + '"' + (V.at && V.at.room === r.id ? ' class="on"' : '') + '>' + esc(r.n || (ROOMS[r.k] || ROOMS.hall)[0]) + '</button>'; }).join('');
          rooms.hidden = false; var tp = ov.querySelector('.tip'); if (tp) tp.classList.add('gone'); buildPortals(b); }
        spawnT = performance.now();
        if (window.MinestSfx) { steps = MinestSfx.loop('steps'); amb = MinestSfx.loop(room ? 'indoor' : 'outdoor'); amb.set(.8); if (room) { rainIn = MinestSfx.loop('outdoor'); } }   // a breeze and birds outside, a quiet room inside (rain heard through the walls)
        if (window.MinestWX) { wxOff = MinestWX.on(wxApply); flOff = MinestWX.onFlash(flash); wxApply(MinestWX.state()); }
      }
      function setAct(a, text) { if (!act) return; if (!a) { act.hidden = true; act.removeAttribute('data-a'); return; } var tp = ov.querySelector('.tip'); if (tp) tp.classList.add('gone'); act.hidden = false; act.setAttribute('data-a', a); act.textContent = text; }
      function fadeDo(text, mid, then) { fade.querySelector('b').textContent = text || ''; fade.classList.add('on'); setTimeout(function () { if (mid) mid(); setTimeout(function () { fade.classList.remove('on'); if (then) then(); }, mid ? 120 : 900); }, 380); }
      // ---- buildings: in and out, room to room (the walk is built again for the room you are in)
      function restart(spawn) { WKS = spawn || null; var w = WK; WK = null; if (steps) steps.stop(); w.stop(); wkStart(AS); }
      function goIn(p) {
        if (!(p.rooms || []).length) { p.roomsInit = 1; p.rooms = suggestRooms(p).map(function (k) { return { id: 'r' + uid().slice(1), k: k, n: ROOMS[k][0] }; }); p.rooms.forEach(function (r) { roomD(r); }); save(); }   // its first rooms, as when you open it
        var r = p.rooms[0]; roomD(r); SFX('door'); WKIN = { pc: p.id, back: { x: me.x, z: me.z, yaw: Math.atan2(-((lb.x0 + lb.x1) / 2 - me.x), -((lb.y0 + lb.y1) / 2 - me.z)) } };   // back out facing the island
        fadeDo('🚪 ' + bldName(p), function () { V.root = islandD(); V.at = { pc: p.id, room: r.id }; V.d = r.d; refreshLand(); restart(); });
      }
      function bpc() { return WKIN ? WKIN.pc : V.at && V.at.room ? V.at.pc : null; }
      function bOf() { var id = bpc(); return id ? (islandD().pc || []).filter(function (q) { return q.id === id; })[0] || null : null; }
      function goRoom(id, how) { var b = bOf(), r = b && (b.rooms || []).filter(function (x) { return x.id === id; })[0]; if (!r || (V.at && V.at.room === id)) return;
        if (!WKIN) WKIN = { pc: b.id, back: null }; WKIN.from = V.at && V.at.room;   // you arrive at the door (or stairs) that leads back
        roomD(r); SFX(how === 'stairs' ? 'thud' : 'door'); fadeDo((how === 'stairs' ? (((r.fl || 1) > ((roomOf() || {}).fl || 1)) ? '⬆ ' : '⬇ ') : '🚪 ') + (r.n || ROOMS[r.k][0]), function () { V.at = { pc: b.id, room: r.id }; V.d = r.d; refreshLand(); restart(); }); }
      function goPortal(P) { if (P.kind === 'out') goOut(); else goRoom(P.to, P.kind === 'door' ? 'door' : 'stairs'); }
      // ---- doors, stairs and the way out, inside a building: real doors on the walls, each with its room's name above
      var DOORT = null;
      function doorTex() { if (DOORT) return DOORT; var c = document.createElement('canvas'); c.width = 16; c.height = 32; var x = c.getContext('2d');
        x.fillStyle = '#6b4a2b'; x.fillRect(0, 0, 16, 32); x.fillStyle = '#7d5834'; for (var i = 0; i < 16; i += 4) x.fillRect(i + 1, 0, 2, 32);
        x.fillStyle = '#4a321c'; x.fillRect(0, 0, 16, 1); x.fillRect(0, 31, 16, 1); x.fillRect(0, 0, 1, 32); x.fillRect(15, 0, 1, 32); x.fillRect(0, 15, 16, 1);
        x.fillStyle = '#9fd3e6'; x.fillRect(3, 3, 4, 5); x.fillRect(9, 3, 4, 5); x.fillStyle = '#d6b44a'; x.fillRect(12, 17, 2, 2);
        DOORT = new T.CanvasTexture(c); DOORT.magFilter = T.NearestFilter; DOORT.minFilter = T.NearestFilter; if (T.SRGBColorSpace) DOORT.colorSpace = T.SRGBColorSpace; disp.push(DOORT); return DOORT; }
      function plate(text, w, h, x, y, z, ry) { var g = new T.PlaneGeometry(w, h), m = new T.MeshBasicMaterial({ map: textTex(text, '#3b2a1a', '#ffe9b8'), side: T.DoubleSide }), me2 = new T.Mesh(g, m); me2.position.set(x, y, z); me2.rotation.y = ry; S.add(me2); disp.push(g, m); }
      function door(x, z, ry, label, P) {   // a door flush on the wall at (x, z) facing into the room (ry: 0 back wall, ±π/2 side walls, π front)
        var nx = Math.sin(ry), nz = Math.cos(ry), g = new T.PlaneGeometry(1, 2), m = new T.MeshLambertMaterial({ map: doorTex(), side: T.DoubleSide }), d = new T.Mesh(g, m);
        d.position.set(x + nx * .03, 1, z + nz * .03); d.rotation.y = ry; S.add(d); disp.push(g, m);
        var fg = new T.BoxGeometry(1.24, .14, .12), fm = new T.MeshLambertMaterial({ color: 0x3e2a17 }), f = new T.Mesh(fg, fm); f.position.set(x + nx * .05, 2.06, z + nz * .05); f.rotation.y = ry; S.add(f); disp.push(fg, fm);
        plate(label, 1.5, .45, x + nx * .06, 2.45, z + nz * .06, ry);
        P.x = x + nx * .7; P.z = z + nz * .7; P.yaw = Math.atan2(-nx, -nz); portals.push(P);
      }
      function stairs(up, x0, z0, label, P) {   // up: six oak steps climbing to the back wall · down: an opening in the floor with a rail
        var m = new T.MeshLambertMaterial({ map: tex('oak') || null, color: tex('oak') ? 0xffffff : 0x9a6a3a }); disp.push(m);
        if (up) { for (var i = 0; i < 6; i++) { var g = new T.BoxGeometry(1.1, (i + 1) * .3, .45), st = new T.Mesh(g, m); st.position.set(x0 + .55, (i + 1) * .15, z0 + (5 - i) * .45 + .22); S.add(st); disp.push(g); }
          plate(label, 1.5, .45, x0 + .55, 2.6, z0 + .03, 0); P.x = x0 + .55; P.z = z0 + 6 * .45 + .5; }
        else { var hg = new T.PlaneGeometry(1.2, 1.4), hm = new T.MeshBasicMaterial({ color: 0x0b0b10 }), h = new T.Mesh(hg, hm); h.rotation.x = -Math.PI / 2; h.position.set(x0 + .6, .02, z0 + .8); S.add(h); disp.push(hg, hm);
          [[0, .1], [1.2, .1]].forEach(function (a) { var rg = new T.BoxGeometry(.08, .9, 1.4), rr = new T.Mesh(rg, m); rr.position.set(x0 + a[0], .45, z0 + .8); S.add(rr); disp.push(rg); });
          plate(label, 1.5, .45, x0 + .6, 1.4, z0 + .05, 0); P.x = x0 + .6; P.z = z0 + 2.1; }
        P.yaw = Math.PI; portals.push(P);   // arriving by the stairs: facing into the room
      }
      function buildPortals(b) {
        var cur = (b.rooms || []).filter(function (r) { return V.at && r.id === V.at.room; })[0]; if (!cur || !room) return;
        var fl = cur.fl || 1, same = b.rooms.filter(function (r) { return r !== cur && (r.fl || 1) === fl; }), up = b.rooms.filter(function (r) { return (r.fl || 1) === fl + 1; })[0], dn = b.rooms.filter(function (r) { return (r.fl || 1) === fl - 1; })[0];
        var nm = function (r) { return r.n || (ROOMS[r.k] || ROOMS.hall)[0]; }, slots = [], x, z;
        for (x = lb.x0 + 2.4; x < lb.x1 - (dn ? 2.2 : .8); x += 2.2) slots.push([x, lb.y0, 0]);
        for (z = lb.y0 + 1.8; z < lb.y1 - 1.6; z += 2.2) { slots.push([lb.x0, z, Math.PI / 2]); slots.push([lb.x1, z, -Math.PI / 2]); }
        same.forEach(function (r, i) { var sl = slots[i]; if (sl) door(sl[0], sl[1], sl[2], '🚪 ' + nm(r), { kind: 'door', to: r.id, label: '🚪 ' + nm(r) }); });
        door((lb.x0 + lb.x1) / 2, lb.y1, Math.PI, '🌳 Outside', { kind: 'out', to: 'out', label: '🌳 Go outside' });
        if (up) stairs(true, lb.x0 + .15, lb.y0, '⬆ ' + nm(up), { kind: 'up', to: up.id, label: '⬆ Upstairs · ' + nm(up) });
        if (dn) stairs(false, lb.x1 - 1.4, lb.y0, '⬇ ' + nm(dn), { kind: 'down', to: dn.id, label: '⬇ Downstairs · ' + nm(dn) });
        var from = WKIN && WKIN.from, at = portals.filter(function (P) { return from ? P.to === from : P.kind === 'out'; })[0];   // stand where you came in
        if (at) { me.x = at.x + Math.sin(at.yaw + Math.PI) * .5; me.z = at.z + Math.cos(at.yaw + Math.PI) * .5; me.yaw = at.yaw; me.y = Math.max(0, floorAt(me.x, me.z, .3)); }
        if (WKIN) WKIN.from = null;
      }
      function goOut() { if (!WKIN) WKIN = { pc: bpc(), back: null }; var back = WKIN.back; SFX('door'); fadeDo('🌳 Outside', function () { V.d = V.root || V.d; V.root = null; V.at = null; refreshLand(); WKIN = null; restart(back); }); }
      // ---- the sky follows the real weather (world_wx.js): day, dawn, dusk, night; clouds, rain, snow, fog, wind, lightning
      var SKY = { day: [0x8ecbff, 0xa9b4c0, 0x7d8792], dawn: [0xf6b48f, 0xc9a99a, 0x8a8790], dusk: [0xf08a5a, 0xb0807a, 0x7a6a72], night: [0x0d1430, 0x161c2c, 0x111520] };
      function wxApply(st) {
        if (!st) return; W = st; var C = T.Color;
        if (!lights) { lights = { hemi: null, amb: null, sun: null }; S.children.forEach(function (o) { if (o.isHemisphereLight) lights.hemi = o; else if (o.isAmbientLight) lights.amb = o; else if (o.isDirectionalLight) lights.sun = o; }); ['hemi', 'amb', 'sun'].forEach(function (k) { if (lights[k]) lights[k].base = lights[k].intensity; }); }
        if (amb && !room) amb.set(.8, st); if (rainIn) rainIn.set(1, { muffled: true, rain: st.rain });   // indoors: only the rain, muffled
        var tiEl = ov.querySelector('.ti'); if (tiEl) { if (tiEl.getAttribute('data-base') == null) tiEl.setAttribute('data-base', tiEl.textContent); tiEl.textContent = tiEl.getAttribute('data-base') + '  ' + MinestWX.icon(st) + (st.temp != null && st.mode === 'auto' ? ' ' + st.temp + '°' : ''); }
        if (room) return;   // a room keeps its own lights; the weather is outside
        var row = SKY[st.phase] || SKY.day, col = new C(st.rain > .1 || st.snow > .1 || st.cond === 'storm' ? row[2] : st.cloud > .6 || st.cond === 'fog' ? row[1] : row[0]);
        if (st.cond === 'fog') col.lerp(new C(0xd8dde2), st.phase === 'night' ? .15 : .55);
        S.background = col; if (S.fog) { S.fog.color = col.clone(); S.fog.near = st.cond === 'fog' ? 4 : st.rain > .5 || st.snow > .5 ? 12 : 22; S.fog.far = st.cond === 'fog' ? 28 : st.rain > .5 || st.snow > .5 ? 55 : 90; }
        var L = st.light; if (lights.hemi) lights.hemi.intensity = lights.hemi.base * (.25 + .75 * L); if (lights.amb) lights.amb.intensity = lights.amb.base * (.4 + .6 * L);
        if (lights.sun) { lights.sun.intensity = lights.sun.base * L * (1 - st.cloud * .55); lights.sun.color = new C(st.phase === 'night' ? 0x8fa8ff : st.phase === 'dusk' ? 0xff9a55 : st.phase === 'dawn' ? 0xffc29a : 0xfff4e0); }
        if (st.phase === 'night' && st.cloud < .7) { if (!stars) { var n = 700, pos = new Float32Array(n * 3); for (var i = 0; i < n; i++) { var a = Math.random() * 6.283, e = .15 + Math.random() * 1.3, r = 160; pos[i * 3] = Math.cos(a) * Math.cos(e) * r; pos[i * 3 + 1] = Math.sin(e) * r; pos[i * 3 + 2] = Math.sin(a) * Math.cos(e) * r; }
          var g = new T.BufferGeometry(); g.setAttribute('position', new T.BufferAttribute(pos, 3)); var m = new T.PointsMaterial({ color: 0xffffff, size: 1.6, sizeAttenuation: false, fog: false, transparent: true, opacity: .9 }); stars = new T.Points(g, m); S.add(stars); disp.push(g, m); } stars.visible = true; }
        else if (stars) stars.visible = false;
        makeClouds(); cloudMat.color.set(st.phase === 'night' ? 0x3a4058 : st.rain > .1 || st.cond === 'storm' ? 0x8a9099 : st.phase === 'dusk' ? 0xffc8a8 : st.phase === 'dawn' ? 0xffe0cc : 0xffffff); cloudMat.opacity = .7 + st.cloud * .25;
        clouds.forEach(function (g, i) { g.visible = i < 4 + Math.round(st.cloud * 8); });
        rainFx = particles(rainFx, st.rain > .05, 1400 * Math.max(.4, st.rain), true); snowFx = particles(snowFx, st.snow > .05, 900, false);
      }
      var VW = null;
      function vwInit() {   // 阅览 gestures: one finger turns and tilts, two fingers pinch to zoom and drag to move the subject, a double tap resets, the wheel zooms
        if (VW) return; var span = Math.max(lb.x1 - lb.x0, lb.y1 - lb.y0);
        VW = { cx: (lb.x0 + lb.x1) / 2, cz: (lb.y0 + lb.y1) / 2, r: span * .8, yaw: .8, el: .42, k: 1, tx: 0, tz: 0, auto: true, ptr: {}, lastTap: 0 };
        ov.insertAdjacentHTML('beforeend', '<div class="wk-x wk-vbar"><button type="button" data-vw="auto" class="on" aria-label="Orbit on its own">⟳</button><button type="button" data-vw="reset" aria-label="Reset the view">⤢</button></div>');
        var bar = ov.querySelector('.wk-vbar'); bar.addEventListener('click', function (e) { e.stopPropagation(); var g = e.target.closest('[data-vw]'); if (!g) return; if (g.getAttribute('data-vw') === 'auto') VW.auto = !VW.auto; else reset(); paintBar(); });
        function paintBar() { bar.querySelector('[data-vw="auto"]').classList.toggle('on', VW.auto); }
        function reset() { VW.k = 1; VW.tx = VW.tz = 0; VW.el = .42; VW.auto = true; paintBar(); }
        function on(e) {
          if (!WKVIEW || !ov.isConnected || !ov.contains(e.target) || e.target.closest('.wk-x, [data-wkx]')) return; e.stopPropagation(); if (e.type !== 'pointerdown') e.preventDefault(); var P = VW.ptr, p = P[e.pointerId];
          if (e.type === 'pointerdown') { P[e.pointerId] = { x: e.clientX, y: e.clientY, sx: e.clientX, sy: e.clientY, t: Date.now() }; return; }
          if (!p) return;
          if (e.type === 'pointermove') { var ids = Object.keys(P), dx = e.clientX - p.x, dy = e.clientY - p.y;
            if (ids.length === 1) { if (Math.abs(e.clientX - p.sx) + Math.abs(e.clientY - p.sy) > 6) { VW.auto = false; paintBar(); } VW.yaw -= dx * .006; VW.el = Math.max(.08, Math.min(1.35, VW.el + dy * .004)); }
            else { var o = P[ids[0] === String(e.pointerId) ? ids[1] : ids[0]], d0 = Math.hypot(p.x - o.x, p.y - o.y), d1 = Math.hypot(e.clientX - o.x, e.clientY - o.y); VW.auto = false; paintBar();
              if (d0 > 8 && d1 > 8) VW.k = Math.max(.2, Math.min(2.6, VW.k * d0 / d1));
              var sc = VW.r * VW.k / Math.max(320, ov.clientWidth) * 1.4, mx = dx / 2, my = dy / 2, sy = Math.sin(VW.yaw), cyw = Math.cos(VW.yaw), lim = span * .6;
              VW.tx = Math.max(-lim, Math.min(lim, VW.tx + (-cyw * mx - sy * my) * sc)); VW.tz = Math.max(-lim, Math.min(lim, VW.tz + (sy * mx - cyw * my) * sc)); }
            p.x = e.clientX; p.y = e.clientY; return; }
          var tap = Object.keys(P).length === 1 && Math.hypot(e.clientX - p.sx, e.clientY - p.sy) < 8 && Date.now() - p.t < 350; delete P[e.pointerId];
          if (tap) { if (Date.now() - VW.lastTap < 320) { reset(); VW.lastTap = 0; } else { VW.lastTap = Date.now(); var cx2 = e.clientX, cy2 = e.clientY; setTimeout(function () { if (VW.lastTap && Date.now() - VW.lastTap >= 300) tapPick(cx2, cy2); }, 330); } }
        }
        ['pointerdown', 'pointermove', 'pointerup', 'pointercancel'].forEach(function (t) { window.addEventListener(t, on, true); });
        function wh(e) { if (!WKVIEW) return; e.preventDefault(); VW.k = Math.max(.2, Math.min(2.6, VW.k * Math.exp(e.deltaY * .0015))); VW.auto = false; paintBar(); }
        ov.addEventListener('wheel', wh, { passive: false });
        VW.off = function () { ['pointerdown', 'pointermove', 'pointerup', 'pointercancel'].forEach(function (t) { window.removeEventListener(t, on, true); }); };
      }
      var cloudMat = null;
      function makeClouds() {   // flat blocky clouds (Minecraft): each a blob of 2 × 2 cells, a block thick, high above the island
        if (clouds) return; clouds = []; cloudMat = new T.MeshLambertMaterial({ color: 0xffffff, transparent: true, opacity: .9, fog: false }); disp.push(cloudMat);
        var span = Math.max(lb.x1 - lb.x0, lb.y1 - lb.y0), cxc = (lb.x0 + lb.x1) / 2, czc = (lb.y0 + lb.y1) / 2;
        for (var c = 0; c < 12; c++) { var g = new T.Group(), n = 6 + ((c * 7) % 9), seen = {}, x = 0, z = 0;
          for (var b = 0; b < n; b++) { var k = x + ',' + z; if (!seen[k]) { seen[k] = 1; var bg = new T.BoxGeometry(2, 1.1, 2), me3 = new T.Mesh(bg, cloudMat); me3.position.set(x * 2, 0, z * 2); g.add(me3); disp.push(bg); }
            var dir = (c * 13 + b * 5) % 4; if (dir === 0) x++; else if (dir === 1) z++; else if (dir === 2) x--; else z += (b % 2 ? 1 : -1); }
          var ca = c / 12 * 6.283 + (c % 3) * .4, cr = span * (.45 + ((c * 37) % 100) / 100 * .7); g.position.set(cxc + Math.cos(ca) * cr, span * .3 + (c % 4) * 1.8, czc + Math.sin(ca) * cr);   /* round the island's sky, in sight of the 阅览 orbit */ S.add(g); clouds.push(g); }
        S.children.slice().forEach(function (o) { if (o.isMesh && o.material && o.material.isMeshBasicMaterial && o.material.transparent && o.position.y > 18 && o.position.y < 40) S.remove(o); });   // the old flat slabs
      }
      function particles(fx, on, n, isRain) {   // rain streaks / snowflakes in a box that travels with you
        if (!on) { if (fx) fx.o.visible = false; return fx; } if (fx) { fx.o.visible = true; return fx; }
        n = Math.round(n); var pos = new Float32Array(n * (isRain ? 6 : 3)), seed = [];
        for (var i = 0; i < n; i++) seed.push([(Math.random() - .5) * 36, Math.random() * 22, (Math.random() - .5) * 36, .6 + Math.random() * .8]);
        var g = new T.BufferGeometry(); g.setAttribute('position', new T.BufferAttribute(pos, 3));
        var o = isRain ? new T.LineSegments(g, new T.LineBasicMaterial({ color: 0xbfd4ff, transparent: true, opacity: .55 })) : new T.Points(g, new T.PointsMaterial({ color: 0xffffff, size: .13, transparent: true, opacity: .95 }));
        o.frustumCulled = false; S.add(o); disp.push(g, o.material); return { o: o, g: g, pos: pos, seed: seed, rain: isRain, t: 0 };
      }
      function stepFx(fx, dt) {
        if (!fx || !fx.o.visible) return; fx.t += dt; var P = fx.pos, w = W ? W.wind : .2, cx = me.x, cz = me.z, by = me.y;
        fx.seed.forEach(function (s0, i) { var y = s0[1] - fx.t * (fx.rain ? 16 : 1.4) * s0[3], yy = ((y % 22) + 22) % 22, x = s0[0] + (fx.rain ? -w * 3 * (22 - yy) / 22 : Math.sin(fx.t * .7 + i) * .6 + fx.t * w * 1.5), X = cx + ((x + 18) % 36 + 36) % 36 - 18, Z = cz + s0[2], Y = by + yy - 4;
          if (fx.rain) { P[i * 6] = X; P[i * 6 + 1] = Y; P[i * 6 + 2] = Z; P[i * 6 + 3] = X + w * .25; P[i * 6 + 4] = Y - .55; P[i * 6 + 5] = Z; } else { P[i * 3] = X; P[i * 3 + 1] = Y; P[i * 3 + 2] = Z; } });
        fx.g.attributes.position.needsUpdate = true;
      }
      function flash() { if (room || !lights) return; flashT = .5; }
      function wxTick(dt) {
        if (room || !W) return; stepFx(rainFx, dt); stepFx(snowFx, dt); if (stars) stars.position.set(me.x, 0, me.z);
        if (clouds) { var spn = Math.max(lb.x1 - lb.x0, lb.y1 - lb.y0); clouds.forEach(function (o) { o.position.x += (0.35 + W.wind * 2.5) * dt; if (o.position.x > lb.x1 + spn * 1.2) o.position.x = lb.x0 - spn * 1.2; }); }
        if (flashT > 0) { flashT -= dt; var k = flashT > .38 || (flashT < .25 && flashT > .15) ? 1 : 0; if (lights.amb) lights.amb.intensity = lights.amb.base * (.4 + .6 * W.light) + k * 2.2; }
      }
      // ---- sitting and sleeping
      function sitOn(s) { if (sit) return; var e = s.ext; sit = { x: (e[0] + e[1]) / 2, z: (e[2] + e[3]) / 2, y: e[4] + Math.min(.5, (e[5] - e[4]) * .45), from: { x: me.x, z: me.z, y: me.y } }; me.fly = false; me.vy = 0; SFX('thud'); setAct('up', '⬆ Stand up'); toast('🪑 Sitting on the ' + K[s.p.k].n.toLowerCase() + ' · move to stand up'); }
      function standUp() { if (!sit) return; me.x = sit.from.x; me.z = sit.from.z; me.y = sit.from.y; sit = null; setAct(null); }
      function sleep(s) { SFX('click'); fadeDo('😴 Zzz…', null, function () { toast('☀️ Good morning!'); SFX('chime'); }); }
      // ---- people and animals: each its own little model, wandering
      function mob(p, b) {
        var B0 = BUF; BUF = {}; WKNS = true; var x0 = 1e9, x1 = -1e9, z0 = 1e9, z1 = -1e9, y1 = 0;
        b.parts.forEach(function (q) { if (q.t !== 'box') return; box(q); x0 = Math.min(x0, q.x0); x1 = Math.max(x1, q.x1); z0 = Math.min(z0, q.y0); z1 = Math.max(z1, q.y1); y1 = Math.max(y1, q.z1); });
        WKNS = false; var g = new T.Group(), cx = (x0 + x1) / 2, cz = (z0 + z1) / 2;
        Object.keys(BUF).forEach(function (n) { var Bf = BUF[n], ge = new T.BufferGeometry(); ge.setAttribute('position', new T.Float32BufferAttribute(Bf.p, 3)); ge.setAttribute('normal', new T.Float32BufferAttribute(Bf.nm, 3)); ge.setAttribute('uv', new T.Float32BufferAttribute(Bf.u, 2)); ge.setIndex(Bf.i); ge.translate(-cx, 0, -cz);
          var m = new T.MeshLambertMaterial({ map: tex(n) }); g.add(new T.Mesh(ge, m)); disp.push(ge, m); });
        BUF = B0; if (!g.children.length) return; g.position.set(cx, 0, cz); S.add(g);
        var pg = new T.BoxGeometry(Math.max(.5, x1 - x0), Math.max(.5, y1), Math.max(.5, z1 - z0)), pk = new T.Mesh(pg, new T.MeshBasicMaterial({ visible: false })); pk.userData.pc = p.id; picks.add(pk); disp.push(pg);
        var person = /^mob_(explorer|gardener|villager|chef|kid)$/.test(p.k) || !/(dog|cat|sheep|cow|chicken|fox|pig|horse|bird|duck)/i.test(K[p.k].n);
        mobs.push({ p: p, g: g, pk: pk, h: y1, home: [cx, cz], tx: cx, tz: cz, wait: Math.random() * 2, f0: (p.f || 0) * Math.PI / 2, yaw: 0, person: person, talk: 0, hop: 0, bub: null, hearts: [] });
      }
      function say(m) {   // a line from the island: a card's title, or a hello
        if (!lines) { lines = []; try { Object.keys(IX).forEach(function (r) { var t = thing(r); if (t && t.s && t.s.title) lines.push(String(t.s.title).slice(0, 40)); }); } catch (e) {} }
        var nm = K[m.p.k].n, pick = lines.length ? lines[(Math.random() * lines.length) | 0] : '', opts = ['Hi! I’m the ' + nm.toLowerCase() + '.', pick ? 'Have you seen “' + pick + '”?' : 'Lovely day on the island!', pick ? 'I was just reading about ' + pick + '.' : 'Hmm… hrm!', 'Welcome to ' + String((board(V.bid) || {}).title || 'our island').replace(/^my\s+/i, '') + '!'];
        return opts[(m.talk++) % opts.length];
      }
      function bubble(m, text) { if (m.bub) { m.g.remove(m.bub); m.bub.material.map.dispose(); m.bub.material.dispose(); }
        var t = textTex(text, '#fffdf3', '#2b2b2b'), s = new T.Sprite(new T.SpriteMaterial({ map: t, transparent: true, depthTest: false })); s.scale.set(1.3, .65, 1); s.position.set(0, m.h + .55, 0); s.renderOrder = 9; m.g.add(s); m.bub = s; m.bubT = 4.5; }
      function heart(m) { var c = document.createElement('canvas'); c.width = c.height = 32; var x = c.getContext('2d'); x.fillStyle = '#e8203a'; [[1, 0], [2, 0], [4, 0], [5, 0], [0, 1], [1, 1], [2, 1], [3, 1], [4, 1], [5, 1], [6, 1], [0, 2], [1, 2], [2, 2], [3, 2], [4, 2], [5, 2], [6, 2], [1, 3], [2, 3], [3, 3], [4, 3], [5, 3], [2, 4], [3, 4], [4, 4], [3, 5]].forEach(function (q) { x.fillRect(2 + q[0] * 4, 4 + q[1] * 4, 4, 4); });
        var t = new T.CanvasTexture(c); t.magFilter = T.NearestFilter; var s = new T.Sprite(new T.SpriteMaterial({ map: t, transparent: true })); s.scale.set(.4, .4, 1); s.position.set((Math.random() - .5) * .6, m.h + .2, (Math.random() - .5) * .6); m.g.add(s); m.hearts.push({ s: s, t: 0 }); }
      function meet(m) {
        var dx = me.x - m.g.position.x, dz = me.z - m.g.position.z; m.tx = m.g.position.x; m.tz = m.g.position.z; m.wait = 5; m.yaw = Math.atan2(dx, dz); m.hop = .35;
        if (m.person) { bubble(m, say(m)); SFX('hmm', pitch(m)); } else { for (var i = 0; i < 4; i++) heart(m); SFX(cry(m)); setTimeout(function () { SFX('pop'); }, 250); toast('❤ ' + K[m.p.k].n); }
      }
      function mobTick(m, dt) {
        var g = m.g, P = g.position;
        if (m.wait > 0) m.wait -= dt;
        else { var dx = m.tx - P.x, dz = m.tz - P.z, d = Math.hypot(dx, dz);
          if (d < .08) { m.wait = 1.5 + Math.random() * 3.5; if (Math.random() < .25 && Math.hypot(P.x - me.x, P.z - me.z) < 9) SFX(m.person ? 'hmm' : cry(m), m.person ? pitch(m) : 1);   /* now and then, a sound from those close by */ for (var k = 0; k < 6; k++) { var a = Math.random() * 6.283, r = .8 + Math.random() * 2.6, nx = m.home[0] + Math.cos(a) * r, nz = m.home[1] + Math.sin(a) * r; if (onLandXZ(nx, nz) && !blocked(nx, nz, .1) && floorAt(nx, nz, .3) < .3) { m.tx = nx; m.tz = nz; break; } } }
          else { var sp = Math.min(d, (m.person ? .9 : 1.1) * dt), nx2 = P.x + dx / d * sp, nz2 = P.z + dz / d * sp; if (!blocked(nx2, nz2, .1)) { P.x = nx2; P.z = nz2; m.yaw = Math.atan2(dx, dz); } else m.tx = P.x, m.tz = P.z; m.step = (m.step || 0) + dt * 9; } }
        var dy = ((m.yaw - g.rotation.y + Math.PI) % 6.283 + 6.283) % 6.283 - Math.PI; g.rotation.y += dy * Math.min(1, dt * 8);
        g.rotation.y = g.rotation.y; P.y = (m.hop > 0 ? Math.sin((.35 - m.hop) / .35 * Math.PI) * .45 : 0) + (m.wait <= 0 ? Math.abs(Math.sin(m.step || 0)) * .05 : 0); if (m.hop > 0) m.hop -= dt;
        m.pk.position.set(P.x, m.h / 2 + P.y, P.z);
        if (m.bub) { m.bubT -= dt; if (m.bubT <= 0) { m.g.remove(m.bub); m.bub.material.map.dispose(); m.bub.material.dispose(); m.bub = null; } }
        m.hearts = m.hearts.filter(function (h) { h.t += dt; h.s.position.y += dt * .8; h.s.material.opacity = Math.max(0, 1 - h.t / 1.4); if (h.t > 1.4) { m.g.remove(h.s); h.s.material.map.dispose(); h.s.material.dispose(); return false; } return true; });
      }
      return {
        mob: function (p, b) { mob(p, b); },
        note: function (p, ext) { if (!p || ext[0] > ext[1]) return; if (enterable(p, ext)) bld.push({ p: p, ext: ext }); if (SEAT.test(p.k)) seats.push({ p: p, ext: ext, bed: false }); else if (BED.test(p.k)) seats.push({ p: p, ext: ext, bed: true }); },
        isMob: function (p) { return K[p.k] && K[p.k].mob; },
        spawn: function () { ui(); },
        tap: function (p) {   // true when the walk handled it
          var m = mobs.filter(function (x) { return x.p.id === p.id; })[0]; if (m) { if (Math.hypot(m.g.position.x - me.x, m.g.position.z - me.z) < 5) meet(m); else toast('Walk closer to ' + K[p.k].n.toLowerCase()); return true; }
          var s = seats.filter(function (x) { return x.p.id === p.id; })[0]; if (s) { var e = s.ext, d = Math.hypot((e[0] + e[1]) / 2 - me.x, (e[2] + e[3]) / 2 - me.z); if (d > 3.2) { toast('Walk closer to sit'); return true; } if (s.bed) sleep(s); else sitOn(s); return true; }
          var b = bld.filter(function (x) { return x.p.id === p.id; })[0]; if (b && nearB === b) { goIn(b.p); return true; }
          return false;
        },
        label: function (p) { if (!p) return ''; if (mobs.some(function (x) { return x.p.id === p.id; })) return (K[p.k].n) + (/^mob_(explorer|gardener|villager|chef|kid)$/.test(p.k) ? ' · tap to talk' : ' · tap to pet');
          var s = seats.filter(function (x) { return x.p.id === p.id; })[0]; if (s) return K[p.k].n + (s.bed ? ' · tap to sleep' : ' · tap to sit'); var b = bld.filter(function (x) { return x.p.id === p.id; })[0]; if (b && nearB === b) return bldName(p) + ' · tap to go in'; return ''; },
        tick: function (dt, now) {
          ui(); wxTick(dt); mobs.forEach(function (m) { mobTick(m, dt); });
          if (WKVIEW && !room) {   // 阅览: a drone orbit round the island — on its own, or by hand (see vwInit)
            vwInit(); if (VW.auto && !Object.keys(VW.ptr).length) VW.yaw += dt * .045;
            var Rv = VW.r * VW.k, tx0 = VW.cx + VW.tx, tz0 = VW.cz + VW.tz;
            cam.position.set(tx0 + Math.sin(VW.yaw) * Rv * Math.cos(VW.el), Rv * Math.sin(VW.el) + 1.5, tz0 + Math.cos(VW.yaw) * Rv * Math.cos(VW.el)); cam.lookAt(tx0, 1.2, tz0);
            if (S.fog) { S.fog.near = Rv * 1.6; S.fog.far = Rv * 4 + 40; } if (steps) steps.set(0); return; }
          var moving = Math.hypot(me.mx, me.mz) > .15 || ['w', 'a', 's', 'd', 'arrowup', 'arrowdown', 'arrowleft', 'arrowright'].some(function (k) { return me.keys[k]; });
          if (sit) { if (moving && Math.hypot(me.mx, me.mz) > .6) standUp(); else { me.x = sit.x; me.z = sit.z; me.y = sit.y - EYE + .95; me.vy = 0; cam.position.set(sit.x, sit.y + .95, sit.z); } }
          if (steps) steps.set(!sit && moving && me.grounded && !me.fly ? (me.run ? .95 : .55) : 0);
          if (now - chkT > 150 && !sit) { chkT = now; nearB = null; var best = 2.2;
            bld.forEach(function (b) { var e = b.ext, dx = Math.max(e[0] - me.x, 0, me.x - e[1]), dz = Math.max(e[2] - me.z, 0, me.z - e[3]), d = Math.hypot(dx, dz); if (d < best && me.y < 1.5) { best = d; nearB = b; } });
            nearP = null; var bp = 1.5; portals.forEach(function (P) { var d = Math.hypot(P.x - me.x, P.z - me.z); if (d < bp) { bp = d; nearP = P; } });
            if (nearB) setAct('in', '🚪 Go into ' + bldName(nearB.p)); else if (nearP) { setAct('portal', nearP.label); if (bp < .45 && moving && now - spawnT > 900) goPortal(nearP); } else setAct(null); }   // walk into a door to go through
        },
        dbg: function () { return { mobs: mobs, seats: seats, bld: bld, sit: sit, me: me, near: nearB }; },
        stop: function () { if (VW && VW.off) VW.off(); if (wxOff) wxOff(); if (flOff) flOff(); if (rainIn) { rainIn.stop(); rainIn = null; } if (amb) { amb.stop(); amb = null; } if (steps) { steps.stop(); steps = null; } }
      };
    })();

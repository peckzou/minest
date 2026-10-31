/* Minest My World — Knowledge Metro (prototype) · "Navigate the Connections"
   You stand on a low-poly metro platform. Each List is a line (its colour), each Card a station: the wall shows the station's
   name board and the card as a poster, the hanging screen the next train. Trains pull in, open their doors, you board and ride
   to the next station; transfer stations switch to another line; the Metro Map shows the whole network — tap any station.
   Tap a poster to look at it, tap again to flip it to the meaning. Reuses Knowledge Drive's data and art (rail-common.js). */
(function () {
  'use strict';
  var K = window.KRail, T = window.THREE; if (!K || !T || window.MinestMetro) return;
  var STORE = 'minest.metro.v1', clamp = K.clamp, lerp = K.lerp, ease = K.ease, esc = K.esc, FONT = K.FONT;
  var THEMES = [
    { id: 'classic', name: 'Classic Tile', icon: '🧱', wall: '#efe7d6', tile: '#e2d6bd', floor: '#b9b2a6', ceil: '#3a3d44', light: '#fff4dc', lit: .95 },
    { id: 'modern', name: 'Modern', icon: '⬜', wall: '#e9edf2', tile: '#d5dce5', floor: '#9aa3ae', ceil: '#d9dee5', light: '#ffffff', lit: 1.05 },
    { id: 'deco', name: 'Art Deco', icon: '✨', wall: '#20453b', tile: '#2b5a4d', floor: '#6b5d48', ceil: '#1c2622', light: '#ffd998', lit: .85 },
    { id: 'night', name: 'Night Line', icon: '🌙', wall: '#1b2140', tile: '#252c54', floor: '#2d3248', ceil: '#101425', light: '#8fd0ff', lit: .7 }];

  function load() { try { return JSON.parse(localStorage.getItem(STORE) || '{}') || {}; } catch (e) { return {}; } }
  function save(key, v) { try { var a = load(); a[key] = v; localStorage.setItem(STORE, JSON.stringify(a)); } catch (e) {} }

  function Metro(opts) {
    var self = this, P = opts.provider || K.defaultProvider(), PL = K.plan(P, opts.source || { type: 'workspace' });
    PL.roads.forEach(function (r) { r.title = String(r.title).replace(/\s*[(（]\s*\d+\s*[)）]\s*$/, '') || r.title; }); var lines = PL.roads.slice(0, opts.maxLines || 8); if (!lines.length) throw new Error('No cards for stations');
    // transfers: deterministic links between neighbouring lines
    lines.forEach(function (L, i) { L.xfer = {}; });
    lines.forEach(function (L, i) {   // interchange with the next line at the same position, so the map's links run straight down
      var o = lines[i + 1]; if (!o) return; var a = Math.floor((L.items.length - 1) / 2), b = Math.min(a, o.items.length - 1);
      (L.xfer[a] = L.xfer[a] || []).push({ li: i + 1, si: b }); (o.xfer[b] = o.xfer[b] || []).push({ li: i, si: a });
    });
    var saved = opts.fresh ? {} : (load()[PL.key] || {});
    var st = { li: 0, si: 0, theme: saved.theme || 'classic', hist: [], auto: true, phase: 'wait', t: 0, trainX: -90, doors: 0, focus: null, busy: false };
    lines.forEach(function (L, i) { if (L.id === saved.line) { st.li = i; st.si = clamp(saved.si || 0, 0, L.items.length - 1); } });

    var root = document.createElement('div'); root.className = 'km-root';
    root.innerHTML = '<canvas class="km-gl"></canvas>' +
      '<div class="km-top"><div class="km-line"><i></i><span><b></b><small></small></span></div><button type="button" class="km-b" data-km="exit" aria-label="Exit">✕</button></div>' +
      '<div class="km-toast"></div><div class="km-fade"></div>' +
      '<div class="km-bar"><button type="button" class="km-b km-auto" data-km="auto"></button><button type="button" class="km-b km-board" data-km="board">🚇 <span>Board</span></button>' +
      '<button type="button" class="km-b km-xfer" data-km="xfer" hidden></button><button type="button" class="km-b" data-km="lines">🎨 <span>Lines</span></button><button type="button" class="km-b" data-km="map">🗺 <span>Metro Map</span></button>' +
      '<button type="button" class="km-b km-th" data-km="suggest"></button><button type="button" class="km-b" data-km="prevtheme" title="Previous style">↺</button></div>' +
      '<div class="km-mapov" hidden><div class="km-mapcard"><div class="km-maphead"><b>Metro Map</b><button type="button" class="km-b" data-km="map">✕</button></div><div class="km-svg"></div></div></div>' +
      '<div class="km-linesov" hidden><div class="km-mapcard"><div class="km-maphead"><b>Choose Line</b><button type="button" class="km-b" data-km="lines">✕</button></div><div class="km-linelist"></div></div></div>';
    (opts.container || document.body).appendChild(root);
    var $ = function (s) { return root.querySelector(s); }, cvs = $('.km-gl');

    var dpr = Math.min(window.devicePixelRatio || 1, 2), R = new T.WebGLRenderer({ canvas: cvs, antialias: dpr < 2 }); R.setPixelRatio(dpr);
    var scene = new T.Scene(), cam = new T.PerspectiveCamera(60, 1, .1, 300);
    var hemi = new T.HemisphereLight('#fff', '#666', .9), key = new T.DirectionalLight('#fff', .55); key.position.set(-6, 10, 8); scene.add(hemi, key);
    var M = function (c, o) { return new T.MeshStandardMaterial(Object.assign({ color: c, flatShading: true, roughness: .85 }, o || {})); };
    var mat = { wall: M('#efe7d6'), tile: M('#e2d6bd'), floor: M('#b9b2a6'), ceil: M('#3a3d44'), pit: M('#2a2b2f'), rail: M('#b9bcc2', { metalness: .5, roughness: .4 }), sleeper: M('#5a4a3a'),
      edge: new T.MeshBasicMaterial({ color: '#f2c94c' }), light: new T.MeshBasicMaterial({ color: '#fff4dc' }), stripe: M('#3d8bfd'), col: M('#cfc8bb'), dark: M('#2b2f36') };
    (function () { var c = document.createElement('canvas'); c.width = c.height = 128; var x = c.getContext('2d'); x.fillStyle = '#fff'; x.fillRect(0, 0, 128, 128); x.strokeStyle = 'rgba(0,0,0,.16)'; x.lineWidth = 3; x.strokeRect(0, 0, 128, 128);
      var t = new T.CanvasTexture(c); t.wrapS = t.wrapT = T.RepeatWrapping; t.repeat.set(80, 4.5); t.anisotropy = 8; mat.floor.map = t; var t2 = t.clone(); t2.needsUpdate = true; t2.repeat.set(160, 8); mat.wall.map = t2; })();
    function box(w, h, d, m, x, y, z, g) { var o = new T.Mesh(new T.BoxGeometry(w, h, d), m); o.position.set(x, y, z); (g || scene).add(o); return o; }
    // the station box: platform (camera side, z > 0), the track pit, the far wall (z = -7)
    box(160, 1.1, 9, mat.floor, 0, .55, 4.5); box(160, .02, .5, mat.edge, 0, 1.11, .35); box(160, .4, 7, mat.pit, 0, -.2, -3.5);
    box(160, .14, .12, mat.rail, 0, .1, -2.3); box(160, .14, .12, mat.rail, 0, .1, -3.7);
    (function () { var g = new T.InstancedMesh(new T.BoxGeometry(.3, .1, 2.6), mat.sleeper, 160), m = new T.Matrix4(); for (var i = 0; i < 160; i++) { m.makeTranslation(-80 + i, .03, -3); g.setMatrixAt(i, m); } scene.add(g); })();
    box(160, 8, .4, mat.wall, 0, 4, -7.2); box(160, .5, .1, mat.stripe, 0, 2.4, -6.95); box(160, 1.6, .06, mat.tile, 0, .8, -6.97);
    box(160, .3, 16, mat.ceil, 0, 7.6, 0); [0, -4].forEach(function (z) { box(160, .08, .5, mat.light, 0, 7.4, z); });
    [-12, 22, 36].forEach(function (x) { box(.9, 6.5, .9, mat.col, x, 4.35, 2.6); });
    box(8, 7, .4, mat.dark, -40, 3.5, -3.5).visible = true;   // tunnel mouths far off-screen
    // ---------------- the wall: station name board + posters (the card itself, and the next station)
    var wallG = new T.Group(); scene.add(wallG); var picks = [];
    function face(w, h) {
      var g = new T.Group(), fr = new T.Mesh(new T.BoxGeometry(w + .3, h + .3, .16), M('#2b2f36')), f = new T.Mesh(new T.PlaneGeometry(w, h), new T.MeshBasicMaterial({ color: '#ddd', toneMapped: false })), b = new T.Mesh(new T.PlaneGeometry(w, h), new T.MeshBasicMaterial({ color: '#f6f1e6', toneMapped: false }));
      f.position.z = .09; b.position.z = -.09; b.rotation.y = Math.PI; var fc = new T.Group(); fc.add(fr, f, b); g.add(fc); g.userData = { face: fc, front: f, back: b }; f.userData.kind = b.userData.kind = 'poster'; return g;
    }
    var nameB = new T.Mesh(new T.PlaneGeometry(7.6, 1.9), new T.MeshBasicMaterial({ toneMapped: false })); nameB.position.set(4.6, 4.3, -6.9); wallG.add(nameB);
    var posterA = face(4.8, 3), posterB = face(3.6, 2.25); posterA.position.set(-2.6, 4.2, -6.85); posterB.position.set(11.6, 4.1, -6.85); wallG.add(posterA, posterB);
    var screen = new T.Mesh(new T.PlaneGeometry(4.2, 1.05), new T.MeshBasicMaterial({ toneMapped: false })); screen.position.set(5.2, 5.9, 1.2); screen.rotation.set(-.1, -.55, 0, 'YXZ'); scene.add(screen);
    box(.06, 1.1, .06, mat.dark, 3.5, 6.95, 2.4); box(.06, 1.1, .06, mat.dark, 6.9, 6.95, 0);
    var texs = [];
    function station(li, si) { var L = lines[li], it = L.items[si]; return it ? { L: L, ref: it.ref, I: K.info(P, it.ref), si: si, li: li } : null; }
    function nameTex(S) {
      var c = document.createElement('canvas'); c.width = 1024; c.height = 256; var x = c.getContext('2d'), L = S.L, prev = station(S.li, S.si - 1), next = station(S.li, S.si + 1), xf = L.xfer[S.si];
      x.fillStyle = '#fbfaf6'; x.fillRect(0, 0, 1024, 256); x.fillStyle = L.color; x.fillRect(0, 0, 1024, 26); x.fillRect(0, 230, 1024, 26);
      x.fillStyle = L.color; K.rr(x, 30, 62, 120, 120, 26); x.fill(); x.fillStyle = '#fff'; x.font = '800 64px ' + FONT; x.textAlign = 'center'; x.textBaseline = 'middle'; x.fillText(String(S.li + 1), 90, 124);
      x.textAlign = 'left'; x.fillStyle = '#1d1f24'; var t = S.I ? S.I.title : 'Station', fs = t.length > 18 ? 58 : 76; x.font = '800 ' + fs + 'px ' + FONT; while (x.measureText(t).width > 660 && t.length > 4) t = t.slice(0, -2) + '…'; x.fillText(t, 176, S.I && S.I.zh ? 104 : 124);
      if (S.I && S.I.zh) { x.font = '500 34px ' + FONT; x.fillStyle = '#5b616c'; x.fillText(S.I.zh, 178, 160); }
      x.font = '600 24px ' + FONT; x.fillStyle = '#5b616c'; x.textAlign = 'right';
      if (prev && prev.I) x.fillText('← ' + prev.I.title.slice(0, 22), 994, 80); if (next && next.I) x.fillText(next.I.title.slice(0, 22) + ' →', 994, 124);
      if (xf) { x.fillStyle = lines[xf[0].li].color; x.fillText('⇄ Transfer: Line ' + (xf[0].li + 1) + ' · ' + lines[xf[0].li].title, 994, 172); }
      var tx = new T.CanvasTexture(c); tx.anisotropy = 4; return tx;
    }
    function screenTex(msg) {
      var c = document.createElement('canvas'); c.width = 768; c.height = 192; var x = c.getContext('2d'), S = station(st.li, st.si), next = station(st.li, st.si + 1) || station(st.li, 0);
      x.fillStyle = '#0d0f12'; x.fillRect(0, 0, 768, 192); x.fillStyle = S.L.color; x.fillRect(0, 0, 14, 192);
      x.fillStyle = '#ffb547'; x.font = '700 40px "SF Mono", Menlo, monospace'; x.textBaseline = 'middle';
      x.fillText('LINE ' + (st.li + 1) + '  ' + S.L.title.toUpperCase().slice(0, 18), 36, 52);
      x.font = '600 32px "SF Mono", Menlo, monospace'; x.fillStyle = '#ffd38a'; x.fillText('→ ' + (next && next.I ? next.I.title : '').slice(0, 26), 36, 104);
      x.fillStyle = '#7dffa8'; x.fillText(msg, 36, 154);
      return new T.CanvasTexture(c);
    }
    function setScreen(msg) { var o = screen.material.map; screen.material.map = screenTex(msg); screen.material.needsUpdate = true; if (o) o.dispose(); st.screenMsg = msg; }
    function posterArt(g, I, color) {
      var fm = g.userData.front.material; fm.color.set(color); fm.map = null; g.userData.face.rotation.y = 0; g.userData.flip = 0;
      g.userData.front.userData.I = g.userData.back.userData.I = I; g.userData.front.userData.node = g.userData.back.userData.node = g;
      if (!I) return; var bm = g.userData.back.material; if (bm.map) bm.map.dispose(); bm.map = K.drawBack(I, color); bm.color.set('#fff'); bm.needsUpdate = true;
      K.loadImg(I.img).then(function (im) { if (g.userData.front.userData.I !== I) return; var t = K.drawBoard(I, 'near', im, color); texs.push(t); fm.map = t; fm.color.set('#fff'); fm.needsUpdate = true; });
    }
    function paintStation() {
      var S = station(st.li, st.si), next = station(st.li, st.si + 1) || station(st.li, 0), o = nameB.material.map;
      nameB.material.map = nameTex(S); nameB.material.needsUpdate = true; if (o) o.dispose();
      texs.splice(0).forEach(function (t) { t.dispose(); });
      mat.stripe.color.set(S.L.color); trainStripe.color.set(S.L.color); doorM.color.set(S.L.color);
      posterArt(posterA, S.I, S.L.color); posterArt(posterB, next && next.I, S.L.color);
      picks = [posterA.userData.front, posterA.userData.back, posterB.userData.front, posterB.userData.back, nameB];
      nameB.userData = { kind: 'poster', node: posterA };   // the name board reads the station's card too
      var xf = S.L.xfer[st.si], xb = $('.km-xfer'); xb.hidden = !xf; if (xf) { xb.innerHTML = '⇄ <span>Line ' + (xf[0].li + 1) + ' · ' + esc(lines[xf[0].li].title) + '</span>'; xb.style.setProperty('--c', lines[xf[0].li].color); }
      $('.km-line i').style.background = S.L.color; $('.km-line b').textContent = (S.I ? S.I.title : 'Station');
      $('.km-line small').textContent = 'Line ' + (st.li + 1) + ' · ' + S.L.title + ' · ' + (st.si + 1) + '/' + S.L.items.length;
      persist();
    }
    // ---------------- the train: three cars, the line's colour stripe, sliding doors
    var train = new T.Group(), trainStripe = M('#3d8bfd'), doorM = M('#3d8bfd'), leaves = []; scene.add(train);
    var bodyM = M('#f3f4f6', { roughness: .5 }), glassM = M('#1d2733', { roughness: .2, metalness: .2 }), roofM = M('#c9ccd2');
    [-18, 0, 18].forEach(function (cx, ci) {
      box(17.4, 3, 3, bodyM, cx, 1.75, -3, train); box(17, .4, 2.6, roofM, cx, 3.4, -3, train); box(17.42, .36, 3.02, trainStripe, cx, 1.35, -3, train);
      [-6.6, -2.2, 2.2, 6.6].forEach(function (wx) { box(2.2, 1.05, .04, glassM, cx + wx, 2.35, -1.48, train); });
      [-4.4, 4.4].forEach(function (dx) { [-1, 1].forEach(function (sd) { var l = box(.72, 2.15, .06, doorM, cx + dx + sd * .37, 1.85, -1.46, train); l.userData.base = l.position.x; l.userData.sd = sd; leaves.push(l); box(.4, .7, .02, glassM, 0, .4, .035, l); }); });
      if (ci === 2) { var nose = box(1.6, 2.6, 2.9, bodyM, cx + 9.4, 1.6, -3, train); nose.rotation.z = -.12; box(.1, .35, .5, new T.MeshBasicMaterial({ color: '#fff7c2' }), cx + 10.2, 1.2, -2.2, train); }
    });
    train.traverse(function (o) { if (o.isMesh) o.userData.kind = 'train'; });
    train.position.x = st.trainX;

    function applyTheme() {
      var th = THEMES.filter(function (t) { return t.id === st.theme; })[0] || THEMES[0];
      mat.wall.color.set(th.wall); mat.tile.color.set(th.tile); mat.floor.color.set(th.floor); mat.ceil.color.set(th.ceil); mat.light.color.set(th.light); mat.col.color.set(th.tile);
      hemi.intensity = th.lit; scene.background = new T.Color(th.ceil); scene.fog = new T.Fog(th.ceil, 40, 110);
      $('.km-th').innerHTML = th.icon + ' <span>' + th.name + '</span>'; $('.km-th').title = 'Suggest a station style';
    }
    // ---------------- flow: wait → arriving → doors open → (board) → ride → next station
    function setPhase(p) { st.phase = p; st.t = 0; var b = $('.km-board'); b.disabled = false; b.innerHTML = p === 'doors' ? '🚇 <span>Board</span>' : p === 'wait' ? '🚆 <span>Call train</span>' : '⏳ <span>' + (p === 'arriving' ? 'Arriving' : 'Departing') + '</span>'; }
    function arrive() { if (st.phase !== 'wait') return; unfocus(); setPhase('arriving'); setScreen('ARRIVING'); st.trainX = -95; }
    function board(target) {   // ride to target {li, si} (default: next station on this line)
      if (st.busy) return; unfocus();
      var to = target || { li: st.li, si: (st.si + 1) % lines[st.li].items.length };
      if (st.phase !== 'doors' && !target) { arrive(); st.pending = to; return; }
      st.busy = true; hap(); setPhase('closing');
      setTimeout(function () { fade(true); setTimeout(function () {
        st.li = to.li; st.si = to.si; paintStation(); st.trainX = 0; st.doors = 0; train.position.x = 0; setPhase('departing'); setScreen('NEXT TRAIN 2 MIN');
        fade(false); st.busy = false; toast((st.li !== (target && target.fromLi) ? '' : '') + '🚉 ' + (station(st.li, st.si).I || {}).title);
      }, 900); }, target ? 10 : 650);
    }
    function fade(on) { $('.km-fade').classList.toggle('on', on); }

    // ---------------- reading: tap a poster, the camera looks at it; tap again to flip
    var camHome = new T.Vector3(-4.8, 2.75, 5.6), lookHome = new T.Vector3(4.2, 2.9, -6.5), look = lookHome.clone(), lookTo = new T.Vector3(), camTo = camHome.clone(), fov = 60, baseFov = 60;
    function focusPoster(g) { if (!g.userData.front.userData.I) return; st.focus = g; hap(); toast('Tap it again to flip'); }
    function unfocus() { if (st.focus) { st.focus.userData.flip = 0; st.focus = null; } }

    // ---------------- maps
    function metroMap() {
      var ov = $('.km-mapov'); if (!ov.hidden) { ov.hidden = true; return; }
      var Wm = 660, rowH = 104, top = 46, pos = {}, svg = '';
      var x0 = 40, Wmax = Wm;
      lines.forEach(function (L, i) {   // one row per line, all starting at the left; interchanges drop straight down
        var n = L.items.length, y0 = top + i * rowH, pts = [], dx = n > 1 ? Math.max(36, Math.min(60, (Wm - 130) / (n - 1))) : 0;
        for (var j = 0; j < n; j++) { var x = x0 + j * dx, y = y0 + (Math.floor(j / 6) % 2 ? 18 : 0) * (i % 2 ? -1 : 1); pts.push([x, y]); pos[i + ':' + j] = [x, y]; }
        L._pts = pts; L._dense = dx < 60; Wmax = Math.max(Wmax, pts[n - 1][0] + 150); 
      });
      lines.forEach(function (L, i) { Object.keys(L.xfer).forEach(function (j) { L.xfer[j].forEach(function (x) { var a = pos[i + ':' + j], b = pos[x.li + ':' + x.si]; if (a && b && x.li > i) svg += '<path d="M' + a[0] + ' ' + a[1] + (Math.abs(a[0] - b[0]) < 2 ? ' L' + b[0] + ' ' + b[1] : ' C' + (a[0] - 60) + ' ' + a[1] + ' ' + (b[0] - 60) + ' ' + b[1] + ' ' + b[0] + ' ' + b[1]) + '" stroke="rgba(255,255,255,.4)" stroke-width="7" stroke-linecap="round" fill="none"/>'; }); }); });
      lines.forEach(function (L, i) {
        svg += '<polyline points="' + L._pts.map(function (p) { return p.join(','); }).join(' ') + '" fill="none" stroke="' + L.color + '" stroke-width="7" stroke-linejoin="round" stroke-linecap="round"/>';
        svg += '<text x="' + Math.max(18, L._pts[0][0] - 22) + '" y="' + (L._pts[0][1] - 18) + '" fill="' + L.color + '" font-size="14" font-weight="800">' + (i + 1) + ' · ' + esc(L.title) + '</text>';
        L._pts.forEach(function (p, j) {
          var here = i === st.li && j === st.si, xf = !!L.xfer[j], lab = true, I = K.info(P, L.items[j].ref), nm = I ? I.title : '';
          svg += '<g class="km-st" data-li="' + i + '" data-si="' + j + '"><circle cx="' + p[0] + '" cy="' + p[1] + '" r="' + (xf ? 8 : 6) + '" fill="#fff" stroke="' + (xf ? '#1d1f24' : L.color) + '" stroke-width="' + (xf ? 3.5 : 3) + '"/>' +
            (here ? '<circle class="km-here" cx="' + p[0] + '" cy="' + p[1] + '" r="13" fill="none" stroke="#ffd257" stroke-width="3"/>' : '') +
            (L._dense ? '<text x="' + (p[0] + 5) + '" y="' + (p[1] + 15) + '" transform="rotate(32 ' + (p[0] + 5) + ' ' + (p[1] + 15) + ')"' : '<text x="' + p[0] + '" y="' + (p[1] + 24) + '" text-anchor="middle"') + ' fill="#fff" font-size="10.5" opacity="' + (here ? 1 : .72) + '">' + (lab ? esc(nm.length > 14 ? nm.slice(0, 13) + '…' : nm) : '') + '</text><title>' + esc(nm) + '</title></g>';
        });
      });
      var Hm = top + lines.length * rowH + 40; $('.km-svg').innerHTML = '<svg viewBox="0 0 ' + Wmax + ' ' + Hm + '"' + (Wmax > Wm ? ' width="' + Wmax + '" height="' + Hm + '" class="wide"' : '') + ' role="img" aria-label="Metro map">' + svg + '</svg>';
      var here = $('.km-svg .km-here'); if (here && Wmax > Wm) { var sv = $('.km-svg'); sv.scrollLeft = Math.max(0, here.getAttribute('cx') - sv.clientWidth / 2); }
      ov.hidden = false;
    }
    function chooseLine() {
      var ov = $('.km-linesov'); if (!ov.hidden) { ov.hidden = true; return; }
      $('.km-linelist').innerHTML = lines.map(function (L, i) { return '<button type="button" data-km="goline" data-li="' + i + '" style="--c:' + L.color + '"' + (i === st.li ? ' class="on"' : '') + '><i>' + (i + 1) + '</i><span><b>' + esc(L.title) + '</b><small>' + L.items.length + ' stations · ' + esc(L.region) + '</small></span></button>'; }).join('');
      ov.hidden = false;
    }

    // ---------------- HUD / input
    var toastT = 0;
    function toast(t) { var e = $('.km-toast'); e.textContent = t; e.classList.add('on'); clearTimeout(toastT); toastT = setTimeout(function () { e.classList.remove('on'); }, 1900); }
    function hap() { try { webkit.messageHandlers.minest.postMessage({ action: 'haptic', data: { style: 'selection' } }); } catch (e) {} }
    function autoLabel() { var b = $('.km-auto'); b.innerHTML = st.auto ? '⏸ <span>Smart</span>' : '▶ <span>Smart</span>'; b.title = st.auto ? 'Smart ride on — pause' : 'Smart ride: trains come and go on their own'; }
    function act(k, el) {
      if (k === 'exit') return self.close();
      if (k === 'auto') { st.auto = !st.auto; autoLabel(); toast(st.auto ? 'Smart ride: on' : 'Paused'); }
      else if (k === 'board') { if (st.phase === 'doors') board(); else if (st.phase === 'wait') arrive(); }
      else if (k === 'xfer') { var xf = lines[st.li].xfer[st.si]; if (xf) { toast('⇄ Line ' + (xf[0].li + 1) + ' · ' + lines[xf[0].li].title); board({ li: xf[0].li, si: xf[0].si }); } }
      else if (k === 'map') metroMap();
      else if (k === 'lines') chooseLine();
      else if (k === 'goline') { $('.km-linesov').hidden = true; board({ li: +el.dataset.li, si: 0 }); }
      else if (k === 'suggest') { st.hist.push(st.theme); var i = THEMES.findIndex(function (t) { return t.id === st.theme; }); st.theme = THEMES[(i + 1) % THEMES.length].id; applyTheme(); toast(THEMES[(i + 1) % THEMES.length].name); persist(); }
      else if (k === 'prevtheme') { if (st.hist.length) { st.theme = st.hist.pop(); applyTheme(); persist(); } }
      hap();
    }
    root.addEventListener('click', function (e) {
      var s = e.target.closest('.km-st'); if (s) { $('.km-mapov').hidden = true; board({ li: +s.dataset.li, si: +s.dataset.si }); return; }
      var b = e.target.closest('[data-km]'); if (b) { e.preventDefault(); act(b.dataset.km, b); return; }
      if (e.target.classList.contains('km-mapov') || e.target.classList.contains('km-linesov')) e.target.hidden = true;
    });
    var down = null, ray = new T.Raycaster(), ndc = new T.Vector2();
    cvs.addEventListener('pointerdown', function (e) { down = { x: e.clientX, y: e.clientY, t: performance.now() }; });
    cvs.addEventListener('pointerup', function (e) {
      if (!down) return; var mv = Math.hypot(e.clientX - down.x, e.clientY - down.y); down = null; if (mv > 10) return;
      var r = cvs.getBoundingClientRect(); ndc.set((e.clientX - r.left) / r.width * 2 - 1, -((e.clientY - r.top) / r.height) * 2 + 1); ray.setFromCamera(ndc, cam);
      var h = ray.intersectObjects(picks.concat(train.children), true)[0], o = h && h.object;
      if (o && o.userData.kind === 'train') { if (st.phase === 'doors') board(); return; }
      if (o && o.userData.kind === 'poster') { var g = o.userData.node; if (st.focus === g) { g.userData.flip = g.userData.flip ? 0 : 1; hap(); } else focusPoster(g); return; }
      if (st.focus) unfocus();
    });
    function onKey(e) {
      var k = e.key;
      if (k === 'Escape') { e.preventDefault(); if (!$('.km-mapov').hidden) return metroMap(); if (!$('.km-linesov').hidden) return chooseLine(); if (st.focus) return unfocus(); return self.close(); }
      var m = { ' ': 'auto', Enter: 'board', m: 'map', M: 'map', l: 'lines', L: 'lines', t: 'xfer', T: 'xfer', s: 'suggest', S: 'suggest' }[k];
      if ((k === 'f' || k === 'F') && st.focus) { st.focus.userData.flip = st.focus.userData.flip ? 0 : 1; return; }
      if (k === 'ArrowRight') { e.preventDefault(); return board(); }
      if (m) { e.preventDefault(); act(m); }
    }
    window.addEventListener('keydown', onKey);
    function persist() { save(PL.key, { line: lines[st.li].id, si: st.si, theme: st.theme }); }

    // ---------------- loop
    var raf = 0, last = 0, alive = true, W = 1, H = 1;
    function step(now) {
      raf = 0; if (!alive) return; schedule(); var dt = Math.min(.05, (now - (last || now)) / 1000); last = now; st.t += dt;
      // the train
      if (st.phase === 'arriving') { var k = clamp(st.t / 4.2, 0, 1); st.trainX = lerp(-95, 0, 1 - Math.pow(1 - k, 3)); if (k >= 1) { setPhase('doorsopening'); setScreen('NOW BOARDING'); } }
      else if (st.phase === 'doorsopening') { st.doors = clamp(st.t / .7, 0, 1); if (st.doors >= 1) { setPhase('doors'); if (st.pending) { var p = st.pending; st.pending = null; setTimeout(function () { board(p); }, 700); } } }
      else if (st.phase === 'doors') { if (st.auto && st.t > 4) board(); }
      else if (st.phase === 'closing') st.doors = clamp(1 - st.t / .6, 0, 1);
      else if (st.phase === 'departing') { var kk = clamp((st.t - .4) / 4, 0, 1); st.trainX = 95 * kk * kk; if (kk >= 1) { setPhase('wait'); st.trainX = -95; setScreen('NEXT TRAIN 1 MIN'); } }
      else if (st.phase === 'wait') { if (st.auto && st.t > 7 && !st.focus) arrive(); }
      train.position.x = st.trainX; train.visible = Math.abs(st.trainX) < 94;
      var e2 = ease(st.doors); leaves.forEach(function (l) { l.position.x = l.userData.base + l.userData.sd * .78 * e2; });
      // camera: home, or looking at a poster
      var f = st.focus;
      if (f) { f.userData.front.getWorldPosition(lookTo); camTo.set(lookTo.x - 1.5, 2.9, 4.4); var d = camTo.distanceTo(lookTo), w = f === posterA ? 4.8 : 3.6; fov = lerp(fov, clamp(T.MathUtils.radToDeg(Math.max(2 * Math.atan(w / .6 / 2 / d / cam.aspect), 2 * Math.atan(w * .62 / .42 / 2 / d))), 14, baseFov), 1 - Math.exp(-dt * 3)); }
      else { lookTo.copy(lookHome); camTo.copy(camHome); fov = lerp(fov, baseFov, 1 - Math.exp(-dt * 3)); }
      cam.position.lerp(camTo, 1 - Math.exp(-dt * 3)); cam.position.y += Math.sin(now / 1400) * .0008; look.lerp(lookTo, 1 - Math.exp(-dt * 3.2)); cam.lookAt(look);
      if (Math.abs(cam.fov - fov) > .01) { cam.fov = fov; cam.updateProjectionMatrix(); }
      [posterA, posterB].forEach(function (g) { var fc = g.userData.face, to = g.userData.flip ? Math.PI : 0; if (Math.abs(fc.rotation.y - to) > .001) fc.rotation.y = lerp(fc.rotation.y, to, 1 - Math.exp(-dt * 7)); });
      R.render(scene, cam);
    }
    function schedule() { if (!raf && alive && !document.hidden) raf = requestAnimationFrame(step); }
    function onVis() { if (document.hidden) { if (raf) cancelAnimationFrame(raf); raf = 0; } else { last = 0; schedule(); } }
    document.addEventListener('visibilitychange', onVis);
    function resize() { var r = root.getBoundingClientRect(); W = Math.max(1, r.width); H = Math.max(1, r.height); R.setSize(W, H, false); cam.aspect = W / H; baseFov = clamp(2 * T.MathUtils.radToDeg(Math.atan(Math.tan(T.MathUtils.degToRad(84) / 2) / cam.aspect)), 50, 92); if (!st.focus) fov = baseFov; cam.fov = fov; cam.updateProjectionMatrix(); root.classList.toggle('narrow', W < 640); }
    var ro = new ResizeObserver(resize); ro.observe(root);

    applyTheme(); autoLabel(); paintStation(); setPhase('wait'); setScreen('NEXT TRAIN 1 MIN'); resize(); cam.position.copy(camHome); cam.lookAt(look);
    toast('🚉 ' + ((station(st.li, st.si).I || {}).title || '') + ' · Line ' + (st.li + 1)); schedule();
    setTimeout(function () { if (alive && st.phase === 'wait') arrive(); }, 1600);

    this.close = function () { if (!alive) return; persist(); alive = false; if (raf) cancelAnimationFrame(raf); window.removeEventListener('keydown', onKey); document.removeEventListener('visibilitychange', onVis); ro.disconnect(); texs.forEach(function (t) { t.dispose(); }); R.dispose(); root.remove(); if (opts.onExit) opts.onExit(); };
    this.state = function () { var S = station(st.li, st.si); return { line: st.li + 1, lineTitle: S.L.title, station: S.I && S.I.title, si: st.si, phase: st.phase, auto: st.auto, theme: st.theme, focus: st.focus ? st.focus.userData.front.userData.I.title : null, flip: st.focus ? st.focus.userData.flip : 0, transfer: !!S.L.xfer[st.si] }; };
    this.act = act; this.board = board; this.poster = function (b) { focusPoster(b ? posterB : posterA); };
  }
  var CUR = null;
  window.MinestMetro = { open: function (o) { if (CUR) CUR.close(); CUR = new Metro(o || {}); return CUR; }, current: function () { return CUR; }, themes: THEMES };
})();

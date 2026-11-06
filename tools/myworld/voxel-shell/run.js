/* 72 · Knowledge Run — a Dynamic presentation inside a voxel world: run the Grand Canal of Venice (or, elsewhere, the
   world's landmarks one after another); every list of your board is a stage under its own gate, every card a sign on
   the bank. Tap a sign as you pass: the run stops and the card opens — flip it to read, then run on.
   The cards come from My World (postMessage: minestRunData?); nothing in the world is changed. */
(function (root) {
  'use strict';
  var T = root.THREE, R = null, data = null, waiting = null;
  var SPEEDS = [['慢跑', 5], ['快跑', 9], ['冲刺', 15]];
  function S() { return root.__voxel; }
  function E() { return root.MinestOiaEditor; }
  function esc(s) { return String(s == null ? '' : s).replace(/[&<>"]/g, function (c) { return { '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;' }[c]; }); }
  function say(t) { var e = document.getElementById('run-status'); if (e) e.textContent = t; var o = document.getElementById('oia-operation-status'); if (o) o.textContent = t; }

  // ---------------------------------------------------------------- the route
  function topAt(w, x, z) { x = Math.max(0, Math.min(w.W - 1, Math.floor(x))); z = Math.max(0, Math.min(w.D - 1, Math.floor(z))); return w.topH ? w.topH[x + w.W * z] : 0; }
  function routePoints(w) {
    var pts = [];
    if (w.gcPath && w.gcPath.length > 2) pts = w.gcPath.map(function (p) { return [p[0], p[1]]; });
    else {   // the landmarks, nearest next, from the one nearest the middle
      var L = (w.landmarks || []).filter(function (l) { return l && isFinite(l.x); }).map(function (l) { return [l.x, l.z]; });
      if (L.length < 2) return null;
      var cur = L.sort(function (a, b) { return Math.hypot(a[0] - w.W / 2, a[1] - w.D / 2) - Math.hypot(b[0] - w.W / 2, b[1] - w.D / 2); }).shift(); pts.push(cur);
      while (L.length) { L.sort(function (a, b) { return Math.hypot(a[0] - cur[0], a[1] - cur[1]) - Math.hypot(b[0] - cur[0], b[1] - cur[1]); }); cur = L.shift(); pts.push(cur); }
    }
    var water = !!w.gcPath, base = w.WATER_Y || 0;
    if (water) {   // only the stretch with the town on its banks — not the open lagoon at either end
      var dense = []; for (var q = 0; q < pts.length - 1; q++) { var A = pts[q], Bq = pts[q + 1], n = Math.max(1, Math.ceil(Math.hypot(Bq[0] - A[0], Bq[1] - A[1]) / 3)); for (var j = 0; j < n; j++) dense.push([A[0] + (Bq[0] - A[0]) * j / n, A[1] + (Bq[1] - A[1]) * j / n]); }
      dense.push(pts[pts.length - 1]);
      var town = dense.map(function (p) { var hits = 0; for (var a = 0; a < 8; a++) { var dx = Math.cos(a * Math.PI / 4), dz = Math.sin(a * Math.PI / 4); for (var r = 4; r <= 22; r += 3) if (topAt(w, p[0] + dx * r, p[1] + dz * r) > base + 2) { hits++; break; } } return hits >= 4; });
      var best = [0, -1], st = -1; town.concat([false]).forEach(function (t, i) { if (t && st < 0) st = i; if (!t && st >= 0) { if (i - 1 - st > best[1] - best[0]) best = [st, i - 1]; st = -1; } });
      if (best[1] - best[0] > 8) pts = dense.slice(best[0], best[1] + 1).filter(function (p, i, arr) { return i % 3 === 0 || i === arr.length - 1; });
    }
    var v = pts.map(function (p) { var h = topAt(w, p[0], p[1]); return new T.Vector3(p[0], water ? Math.max(base + 2.2, h + 1.8) : h + 3.2, p[1]); });
    for (var k = 0; k < 3; k++) v = v.map(function (p, i) { var a = v[Math.max(0, i - 1)], b = v[Math.min(v.length - 1, i + 1)]; return new T.Vector3(p.x, Math.max(p.y, (a.y + p.y * 2 + b.y) / 4), p.z); });
    return { pts: v, water: water };
  }
  function laps(v, need) {   // out and back along the same canal until every card has its place
    var all = v.slice(), back = true, len = function (a) { var L = 0; for (var i = 1; i < a.length; i++) L += a[i].distanceTo(a[i - 1]); return L; };
    for (var k = 0; k < 6 && len(all) < need; k++) { var seg = (back ? v.slice().reverse() : v.slice()).slice(1); all = all.concat(seg.map(function (p) { return p.clone(); })); back = !back; }
    return new T.CatmullRomCurve3(all, false, 'centripetal');
  }

  // ---------------------------------------------------------------- the signs
  function wrapText(g, text, x, y, maxW, lh, maxLines) {
    var words = String(text || '').split(/(\s+)/), line = '', n = 0, chars = /[　-鿿]/;
    function flush() { g.fillText(line.trim(), x, y + n * lh); n++; line = ''; }
    for (var i = 0; i < words.length && n < maxLines; i++) {
      var wd = words[i];
      if (chars.test(wd)) { for (var j = 0; j < wd.length && n < maxLines; j++) { if (g.measureText(line + wd[j]).width > maxW) flush(); line += wd[j]; } continue; }
      if (g.measureText(line + wd).width > maxW && line.trim()) flush(); line += wd;
    }
    if (line.trim() && n < maxLines) flush();
  }
  function face(item, list, back) {
    var cv = document.createElement('canvas'); cv.width = 512; cv.height = 384; var g = cv.getContext('2d');
    g.fillStyle = back ? '#1d2433' : '#fbfaf7'; g.fillRect(0, 0, 512, 384);
    g.fillStyle = list.color || '#3b82f6'; g.fillRect(0, 0, 512, 46);
    g.fillStyle = '#fff'; g.font = 'bold 22px system-ui, sans-serif'; g.textBaseline = 'middle'; g.fillText(String(list.title).slice(0, 34), 18, 24);
    g.textBaseline = 'alphabetic';
    if (back) {
      g.fillStyle = '#e8eef8'; g.font = 'bold 28px system-ui, sans-serif'; wrapText(g, item.title, 22, 96, 468, 34, 2);
      g.fillStyle = '#b9c6da'; g.font = '22px system-ui, sans-serif'; wrapText(g, item.text || (item.sub || []).join(' · ') || '轻点它，翻开来读', 22, 176, 468, 30, 6);
    } else {
      g.fillStyle = '#eef1f5'; g.fillRect(18, 62, 476, 196);
      g.fillStyle = '#c9d2de'; g.font = 'bold 120px system-ui, sans-serif'; g.textAlign = 'center'; g.fillText(String(item.title || '?').charAt(0).toUpperCase(), 256, 205); g.textAlign = 'left';
      g.fillStyle = '#111827'; g.font = 'bold 34px system-ui, sans-serif'; wrapText(g, item.title, 22, 304, 468, 38, 2);
      if (item.zh) { g.fillStyle = '#64748b'; g.font = '22px system-ui, sans-serif'; g.fillText(String(item.zh).slice(0, 30), 22, 370); }
    }
    var tex = new T.CanvasTexture(cv); tex.anisotropy = 4;
    if (!back && item.img) { var im = new Image(); im.crossOrigin = 'anonymous'; im.onload = function () { try { var r = Math.max(476 / im.width, 196 / im.height), iw = im.width * r, ih = im.height * r; g.save(); g.beginPath(); g.rect(18, 62, 476, 196); g.clip(); g.drawImage(im, 256 - iw / 2, 160 - ih / 2, iw, ih); g.restore(); tex.needsUpdate = true; } catch (e) {} }; im.src = item.img; }
    return tex;
  }
  function sign(item, list, p, side, normal) {
    var grp = new T.Group(), w = 3.2, h = 2.4;
    var front = new T.Mesh(new T.PlaneGeometry(w, h), new T.MeshBasicMaterial({ map: face(item, list, false) }));
    var back = new T.Mesh(new T.PlaneGeometry(w, h), new T.MeshBasicMaterial({ map: face(item, list, true) })); back.rotation.y = Math.PI;
    var frame = new T.Mesh(new T.BoxGeometry(w + .24, h + .24, .12), new T.MeshLambertMaterial({ color: 0x5b3a22 })); frame.position.z = -.08;
    var pole = new T.Mesh(new T.BoxGeometry(.18, 2.6, .18), new T.MeshLambertMaterial({ color: 0x5b3a22 })); pole.position.y = -(h / 2 + 1.2);
    front.position.z = .0; back.position.z = -.15; grp.add(frame, front, back, pole);
    var w0 = S().world, off = 4.2, base = w0.WATER_Y || 0;
    if (R.water) for (var k = 3; k <= 18; k++) { var qx = p.x + normal.x * side * k, qz = p.z + normal.z * side * k; if (topAt(w0, qx, qz) > base + .5) { off = k + .6; break; } }   // on the bank, not in the water
    grp.position.copy(p).addScaledVector(normal, side * off);
    grp.position.y = Math.max(p.y - .6, topAt(w0, grp.position.x, grp.position.z) + 1) + 1.6;
    grp.lookAt(p.x, grp.position.y, p.z);   // facing the runner's line
    grp.userData.item = item; grp.userData.list = list; front.userData.sign = grp; back.userData.sign = grp; frame.userData.sign = grp;
    return grp;
  }
  function gate(list, p, tangent) {
    var grp = new T.Group(), span = R.water ? 13 : 7, mat = new T.MeshLambertMaterial({ color: new T.Color(list.color || '#3b82f6') });
    var cv = document.createElement('canvas'); cv.width = 1024; cv.height = 128; var g = cv.getContext('2d');
    g.fillStyle = list.color || '#3b82f6'; g.fillRect(0, 0, 1024, 128); g.fillStyle = '#fff'; g.font = 'bold 58px system-ui, sans-serif'; g.textAlign = 'center'; g.textBaseline = 'middle';
    g.fillText(('第 ' + (list.index + 1) + ' 段 · ' + list.title).slice(0, 28), 512, 66);
    var banner = new T.Mesh(new T.PlaneGeometry(span, span / 8), new T.MeshBasicMaterial({ map: new T.CanvasTexture(cv), side: T.DoubleSide })); banner.position.y = 5.2;
    [-1, 1].forEach(function (s) { var post = new T.Mesh(new T.BoxGeometry(.4, 6, .4), mat); post.position.set(s * span / 2, 2.2, 0); grp.add(post); });
    grp.add(banner); grp.position.copy(p); grp.position.y -= 1.2;
    grp.lookAt(p.x + tangent.x, grp.position.y, p.z + tangent.z); grp.rotateY(Math.PI);
    return grp;
  }

  // ---------------------------------------------------------------- a run
  function build(from) {
    var s = S(); if (!s || !T || !data) return false;
    clear(); var rt = routePoints(s.world); if (!rt) { say('这个世界没有可跑的路线'); return false; }
    var lists = data.lists.slice(from || 0).filter(function (l) { return l.items.length; });
    var n = 0; lists.forEach(function (l) { n += l.items.length + 1.6; });
    var curve = laps(rt.pts, 30 + n * 9);
    R = { curve: curve, water: rt.water, len: curve.getLength(), group: new T.Group(), signs: [], marks: [], d: 0, speed: 0, running: false, open: null, t: 0 };
    var gap = Math.max(8, Math.min(16, (R.len - 24) / Math.max(1, n))), d = 18, up = new T.Vector3(0, 1, 0);
    lists.forEach(function (l, li) {
      if (d > R.len - 6) return;
      l.index = data.lists.indexOf(l);
      var u = d / R.len, p = R.curve.getPointAt(u), tg = R.curve.getTangentAt(u);
      R.group.add(gate(l, p, tg)); R.marks.push({ d: d, list: l }); d += gap * 1.6;
      l.items.forEach(function (it, i) {
        if (d > R.len - 4) return;
        var sg = null;
        for (var tries = 0; tries < 6 && !sg && d <= R.len - 4; tries++) {   // never on top of a sign from the way out
          var uu = d / R.len, pp = R.curve.getPointAt(uu), t2 = R.curve.getTangentAt(uu), nm = new T.Vector3().crossVectors(t2, up).normalize();
          [i % 2 ? 1 : -1, i % 2 ? -1 : 1].some(function (side) { var c = sign(it, l, pp, side, nm); if (R.signs.every(function (o) { return o.position.distanceTo(c.position) > 3.6; })) { sg = c; return true; } c.traverse(function (o) { if (o.geometry) o.geometry.dispose(); if (o.material) { if (o.material.map) o.material.map.dispose(); o.material.dispose(); } }); return false; });
          if (!sg) d += gap / 2;
        }
        if (!sg) return;
        sg.userData.d = d; R.group.add(sg); R.signs.push(sg); d += gap;
      });
    });
    R.end = Math.min(R.len - 2, d + 6); s.scene.add(R.group);
    var shown = R.signs.length, total = 0; lists.forEach(function (l) { total += l.items.length; });
    say(shown < total ? '路线放得下 ' + shown + '/' + total + ' 张卡片 · 可从后面的赛段再开一次' : shown + ' 张卡片 · ' + lists.length + ' 段');
    return true;
  }
  function clear() { var s = S(); if (R && R.group && s) { s.scene.remove(R.group); R.group.traverse(function (o) { if (o.geometry) o.geometry.dispose(); if (o.material) { if (o.material.map) o.material.map.dispose(); o.material.dispose(); } }); } closeCard(); R = null; }
  function frame() {
    if (!R) return false;
    var s = S(), cam = s.camera, now = performance.now(), dt = Math.min(.05, (now - (R.t || now)) / 1000); R.t = now;
    if (R.running && !R.open) { R.d += SPEEDS[R.speed][1] * dt; if (R.d >= R.end) { R.d = R.end; R.running = false; say('🏁 跑完了 · ' + R.signs.length + ' 张卡片'); paint(); } }
    var u = Math.max(0, Math.min(1, R.d / R.len)), p = R.curve.getPointAt(u), ahead = R.curve.getPointAt(Math.min(1, u + 6 / R.len));
    var bob = R.running && !R.open ? Math.sin(now / 1000 * (6 + SPEEDS[R.speed][1] * .6)) * .07 : 0;
    var c = document.getElementById('oia-console'), cv = document.getElementById('gl'), rc = cv.getBoundingClientRect(), vh = c && !c.hidden ? Math.max(180, c.getBoundingClientRect().top - rc.top) : rc.height;
    cam.fov = 70; cam.far = 3000; cam.setViewOffset(rc.width, vh, 0, 0, rc.width, rc.height); cam.updateProjectionMatrix();
    if (R.open) { var g = R.open.position, toward = new T.Vector3().subVectors(p, g).setY(0).normalize(); cam.position.lerp(new T.Vector3(g.x + toward.x * 4.2, g.y + .2, g.z + toward.z * 4.2), .12); cam.lookAt(g); }
    else { cam.position.set(p.x, p.y + bob, p.z); cam.lookAt(ahead.x, ahead.y - .6, ahead.z); }
    cam.updateMatrixWorld(true);
    var m = null; R.marks.forEach(function (k) { if (k.d <= R.d + 1) m = k; }); var lbl = document.getElementById('modeLabel');
    if (lbl) { var t = '🏃 Knowledge Run · ' + (m ? '第 ' + (m.list.index + 1) + ' 段 ' + m.list.title : '起跑'); if (lbl.textContent !== t) lbl.textContent = t; }
    var bar = document.getElementById('run-progress'); if (bar) bar.style.width = Math.round(R.d / R.end * 100) + '%';
    return true;
  }
  function pick(x, y) {
    if (!R) return false; var s = S(), cv = document.getElementById('gl'), r = cv.getBoundingClientRect(), ray = new T.Raycaster();
    ray.setFromCamera(new T.Vector2((x - r.left) / r.width * 2 - 1, 1 - (y - r.top) / r.height * 2), s.camera);
    var hit = ray.intersectObjects(R.group.children, true).filter(function (h) { return h.object.userData.sign; })[0];
    if (hit && hit.distance < 60) { openCard(hit.object.userData.sign); return true; }
    return false;
  }

  // ---------------------------------------------------------------- the card, read
  function openCard(sg) {
    closeCard(); R.open = sg; var it = sg.userData.item, l = sg.userData.list;
    var m = document.createElement('section'); m.id = 'run-card'; m.setAttribute('role', 'dialog'); m.setAttribute('aria-label', it.title);
    m.innerHTML = '<div class="rc-inner"><div class="rc-face rc-front">' + (it.img ? '<img alt="" src="' + esc(it.img) + '">' : '<em>' + esc(String(it.title).charAt(0).toUpperCase()) + '</em>') +
      '<b>' + esc(it.title) + '</b>' + (it.zh ? '<small>' + esc(it.zh) + '</small>' : '') + '</div><div class="rc-face rc-back"><b>' + esc(it.title) + '</b><p>' + esc(it.text || '这张卡片还没有释义') + '</p>' +
      (it.sub && it.sub.length ? '<ul>' + it.sub.map(function (x) { return '<li>' + esc(x) + '</li>'; }).join('') + '</ul>' : '') + '</div></div>' +
      '<header style="--c:' + esc(l.color || '#3b82f6') + '">' + esc(l.title) + '</header><footer><button data-rc="flip">⟲ 翻面</button><button data-rc="go">🏃 继续跑</button></footer>';
    m.addEventListener('click', function (e) { var b = e.target.closest('[data-rc]'); if (!b) { m.classList.toggle('flipped'); return; } if (b.dataset.rc === 'flip') m.classList.toggle('flipped'); else { closeCard(); if (R) { R.running = true; paint(); } } });
    document.body.appendChild(m); say('「' + it.title + '」 · 点卡片翻面'); paint();
  }
  function closeCard() { var m = document.getElementById('run-card'); if (m) m.remove(); if (R) R.open = null; }

  // ---------------------------------------------------------------- the console pane
  function markup() {
    return '<section id="oia-run-pane" hidden><h3>🏃 Knowledge Run</h3><p>看板的每一列是一段赛程，每张卡片是岸边的展牌 · 路过时轻点它就会停下来翻开</p>' +
      '<div class="run-src" id="run-src"></div><div class="run-bar"><i id="run-progress"></i></div>' +
      '<div class="camera-actions run-actions"><button data-run="go">▶ 开跑</button><button data-run="pause">⏸ 暂停</button><button data-run="speed">速度：慢跑</button><button data-run="again">⟲ 从头</button><button data-run="end">■ 结束</button></div>' +
      '<p id="run-status" role="status"></p><div class="run-lists" id="run-lists"></div></section>';
  }
  function paint() {
    var src = document.getElementById('run-src'); if (!src) return;
    src.textContent = data ? '看板「' + data.title + '」 · ' + data.lists.length + ' 列' : waiting ? '正在从 My World 取卡片…' : '';
    var L = document.getElementById('run-lists');
    if (L && data && L.dataset.n !== String(data.lists.length)) { L.dataset.n = String(data.lists.length); L.innerHTML = '<h4>从哪一段开跑</h4>' + data.lists.map(function (l, i) { return '<button data-run-from="' + i + '"><i style="background:' + esc(l.color) + '"></i>' + esc(l.title) + ' <small>' + l.items.length + '</small></button>'; }).join(''); }
    var g = document.querySelector('[data-run="go"]'), sp = document.querySelector('[data-run="speed"]');
    if (g) g.classList.toggle('on', !!(R && R.running)); if (sp) sp.textContent = '速度：' + SPEEDS[R ? R.speed : 0][0];
  }
  function need(cb) {
    if (data) return cb();
    waiting = cb; paint();
    try { if (root.parent && root.parent !== root) root.parent.postMessage({ action: 'minestRunData?' }, '*'); } catch (e) {}
    setTimeout(function () { if (!data && waiting) { waiting = null; say('没有从 My World 取到卡片 · 请从 My World 打开这个世界'); paint(); } }, 4000);
  }
  root.addEventListener('message', function (e) {
    var d = e.data; if (!d || d.action !== 'minestRunData' || e.source !== root.parent || !Array.isArray(d.lists)) return;
    data = { title: String(d.title || 'Board'), lists: d.lists.map(function (l) { return { title: String(l.title || ''), color: String(l.color || '#3b82f6'), items: (l.items || []).map(function (x) { return { title: String(x.title || ''), zh: String(x.zh || ''), text: String(x.text || ''), img: typeof x.img === 'string' ? x.img : '', sub: Array.isArray(x.sub) ? x.sub.map(String) : [] }; }) }; }).filter(function (l) { return l.items.length; }) };
    var cb = waiting; waiting = null; paint(); if (cb) cb();
  });
  function start(from) {
    need(function () {
      if (!data.lists.length) { say('这个看板还没有卡片'); return; }
      var E0 = E(); if (E0 && !E0.active) E0.explore('edit');
      if (build(from || 0)) { R.running = true; paint(); }
    });
  }
  document.addEventListener('click', function (e) {
    var f = e.target.closest && e.target.closest('[data-run-from]'); if (f) { e.stopPropagation(); start(+f.getAttribute('data-run-from')); return; }
    var b = e.target.closest && e.target.closest('[data-run]'); if (!b) return; e.stopPropagation(); var a = b.dataset.run;
    if (a === 'go') { if (R) { closeCard(); R.running = true; if (R.d >= R.end) R.d = 0; paint(); } else start(0); }
    if (a === 'pause' && R) { R.running = false; say('已暂停'); paint(); }
    if (a === 'speed') { if (R) R.speed = (R.speed + 1) % SPEEDS.length; paint(); }
    if (a === 'again' && R) { closeCard(); R.d = 0; R.running = true; paint(); }
    if (a === 'end') stop();
  }, true);
  function stop() { clear(); var e0 = E(); if (e0 && e0.fit) e0.fit(false); say('Knowledge Run 已结束'); paint(); }

  // the editing camera yields to the run; a tap on a sign opens it
  var waitE = setInterval(function () {
    var e0 = E(); if (!e0 || e0.__run72) return; clearInterval(waitE); e0.__run72 = 1;
    var f0 = e0.frame; e0.frame = function () { return frame() || f0.apply(e0, arguments); };
    var c0 = root.MinestOiaClick; root.MinestOiaClick = function (x, y) { if (pick(x, y)) return; if (c0) c0(x, y); };
  }, 200);
  root.MinestRun = { available: function () { var s = S(); return !!(T && s && s.world && s.scene && ((s.world.gcPath && s.world.gcPath.length) || (s.world.landmarks || []).length > 1)); }, markup: markup, paint: paint, start: start, stop: stop, active: function () { return !!R; } };
})(window);

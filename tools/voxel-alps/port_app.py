"""Port the Venice engine (venice-world/{app,mesher,textures}.js) to the Alpine Chalet world.
The engine stays the same (renderer, sky and day/night, chunked mesher, player physics, crowds, minimap, hotbar);
this script swaps the scene: no boats / gondolas / pigeons / Sketchfab library, a lake-sized water surface, NPCs on the
village lanes, landmark teleports and the tour from the world, and adds doors (open / close), sitting on chairs and
benches, an always-lit fire material, chimney smoke and cows in the pasture. Run:
    python3 tools/voxel-alps/port_app.py venice-world   →   writes alpine-world/{app,mesher}.js"""
import sys
from pathlib import Path

SRC = Path(sys.argv[1])
OUT = next(p for p in [Path(__file__).resolve().parents[1], Path(__file__).resolve().parents[2]] if (p / 'alpine-world').is_dir()) / 'alpine-world'


def must(s, a, b, n=1):
    assert s.count(a) == n, (a[:90], s.count(a))
    return s.replace(a, b)


def cut(s, start, end):   # remove [start, end) — both markers must exist once
    i, j = s.index(start), s.index(end)
    assert s.count(start) == 1 and i < j, start
    return s[:i] + s[j:]


# ---------------------------------------------------------------- mesher: lit blocks (fire) in their own geometry
m = (SRC / 'mesher.js').read_text(encoding='utf-8')
m = m.replace('VeniceWorld', 'AlpineWorld').replace('VeniceMesher', 'AlpineMesher')
m = must(m, 'const opaque = Attr(), glow = Attr();', 'const opaque = Attr(), glow = Attr(), lit = Attr();')
m = must(m, 'const A = info.glow ? glow : opaque;', 'const A = info.lit ? lit : info.glow ? glow : opaque;')
m = must(m, 'const wv = id === world.B.GLASS ? hash3(x, Math.floor((y - 1) / 5), z) : 0;', 'const wv = id === world.B.GLASS ? hash3(x, Math.floor((y - 1) / 4), z) : 0;')
m = must(m, 'return { opaque: toGeometry(opaque), glow: toGeometry(glow) };', 'return { opaque: toGeometry(opaque), glow: toGeometry(glow), lit: toGeometry(lit) };')
m = must(m, "/* ", "/* Alpine Chalet port (tools/port_app.py): lit blocks (fire) get a third geometry, windows light per 4-high storey.\n * ")
(OUT / 'mesher.js').write_text(m, encoding='utf-8')

# ---------------------------------------------------------------- app
s = (SRC / 'app.js').read_text(encoding='utf-8')
s = must(s, '/* Venezia Voxel — main application: renderer, sky/day-night, water, player, boats, crowds, UI. */',
         '/* Alpine Chalet Voxel — main application (the Venezia Voxel engine, ported by tools/port_app.py):\n'
         '   renderer, sky/day-night, a mountain lake, player, doors and seats, villagers on the lanes, cows, chimney smoke, UI. */')
s = s.replace('window.VeniceWorld', 'window.AlpineWorld').replace('VeniceMesher', 'AlpineMesher').replace('VeniceTex', 'AlpineTex')
s = must(s, "const qs = new URLSearchParams(location.search);", "const qs = new URLSearchParams(location.search);\n  const EMBED = !!window.__alpEmbed;   // inside My World (tools/voxel-alps/patch_alps.py)")
# renderer: lighter on phones
s = must(s, "new THREE.WebGLRenderer({ canvas, antialias: true,", "new THREE.WebGLRenderer({ canvas, antialias: !isTouch,")
s = must(s, 'renderer.setPixelRatio(Math.min(window.devicePixelRatio || 1, 2));', 'renderer.setPixelRatio(Math.min(window.devicePixelRatio || 1, isTouch ? 1.5 : 2));')
s = must(s, "scene.fog = new THREE.FogExp2(0xaad4f6, 0.0036);", "scene.fog = new THREE.FogExp2(0xbcdcf4, 0.0028);")
s = must(s, "S = { mode: 'tour', time: parseFloat(qs.get('t')) || 17.8,", "S = { mode: 'tour', sit: null, time: parseFloat(qs.get('t')) || 10.5,")
s = must(s, "player = { pos: new V3(128.5, 5, 102.5), vel: new V3(), yaw: -Math.PI / 2,", "player = { pos: new V3(90.5, 22, 103.5), vel: new V3(), yaw: 0,")
# far floor: the valley floor beyond the ridges, not the sea
s = must(s, "new THREE.MeshLambertMaterial({ color: 0x8a8060 }));\n  farFloor.rotation.x = -Math.PI / 2; farFloor.position.y = 0.9;",
         "new THREE.MeshLambertMaterial({ color: 0x51683f }));\n  farFloor.rotation.x = -Math.PI / 2; farFloor.position.y = 18;")
# the water: just the lake
s = must(s, "const waterMesh = new THREE.Mesh(new THREE.PlaneGeometry(4000, 4000), waterMat);\n  waterMesh.rotation.x = -Math.PI / 2; waterMesh.position.y = VW.WATER_Y; waterMesh.renderOrder = 5; waterMesh.frustumCulled = false;",
         "const waterMesh = new THREE.Mesh(new THREE.PlaneGeometry(56, 40), waterMat);   // the Bergsee (centred on the lake by the world at boot)\n  waterMesh.rotation.x = -Math.PI / 2; waterMesh.position.y = VW.WATER_Y; waterMesh.renderOrder = 5; waterMesh.frustumCulled = false;\n  const inLake = (x, z) => Math.abs(x - waterMesh.position.x) < 28 && Math.abs(z - waterMesh.position.z) < 20;")
s = must(s, "const under = cam.y < VW.WATER_Y - 0.05;", "const under = cam.y < VW.WATER_Y - 0.05 && inLake(cam.x, cam.z);")
s = must(s, "else { scene.fog.color.copy(cHor); scene.fog.density = 0.0036; }", "else { scene.fog.color.copy(cHor); scene.fog.density = 0.0028; }")
s = must(s, "waterMesh.visible = !under;", "waterMesh.visible = !under;   // (an alpine lake: turquoise, see KEYS)")
# alpine lake colours: deep teal and glacier turquoise
s = must(s, "    [8, 0x5aa2e4, 0xc2dff2, 0x0f5260, 0x3a9a9a],\n    [12, 0x3a8ce8, 0xaad4f6, 0x0c5a6a, 0x40b0a8],\n    [16.5, 0x4a96e0, 0xc6dcf0, 0x0e5666, 0x3aa0a0],",
         "    [8, 0x5aa2e4, 0xcde6f6, 0x0f5866, 0x4ab8b4],\n    [12, 0x3a8ce8, 0xbcdcf4, 0x0c6070, 0x52c4bc],\n    [16.5, 0x4a96e0, 0xcfe2f2, 0x0e5a6a, 0x48b6b0],")
# third material: fire is always lit
s = must(s, "  const matGlow = new THREE.MeshBasicMaterial({ vertexColors: true });",
         "  const matGlow = new THREE.MeshBasicMaterial({ vertexColors: true });\n  const matLit = new THREE.MeshBasicMaterial({ vertexColors: true });   // the fire in the hearth: lit day and night")
s = must(s, "    if (rec.glow) { worldGroup.remove(rec.glow); rec.glow.geometry.dispose(); rec.glow = null; }",
         "    if (rec.glow) { worldGroup.remove(rec.glow); rec.glow.geometry.dispose(); rec.glow = null; }\n    if (rec.lit) { worldGroup.remove(rec.lit); rec.lit.geometry.dispose(); rec.lit = null; }")
s = must(s, "    if (g.glow) { const m = new THREE.Mesh(g.glow, matGlow); m.castShadow = true; rec.glow = m; worldGroup.add(m); }",
         "    if (g.glow) { const m = new THREE.Mesh(g.glow, matGlow); m.castShadow = true; rec.glow = m; worldGroup.add(m); }\n    if (g.lit) { const m = new THREE.Mesh(g.lit, matLit); rec.lit = m; worldGroup.add(m); }")
s = must(s, "matWorld.map = atlas; matGlow.map = atlas; matWorld.needsUpdate = true; matGlow.needsUpdate = true;",
         "matWorld.map = atlas; matGlow.map = atlas; matLit.map = atlas; matWorld.needsUpdate = true; matGlow.needsUpdate = true; matLit.needsUpdate = true;")

s = must(s, "(prev === 'tour' || prev === 'gondola')", "(prev === 'tour')")
# ---- boats: gone
s = cut(s, "  const stripeMat = new THREE.MeshLambertMaterial({", "  /* ================= people (instanced voxel villagers) ================= */")
s = must(s, "  /* ================= people (instanced voxel villagers) ================= */",
         "  const boats = [], gondolas = [];   // (no boats in the mountains)\n  function updateBoats() {}\n\n  /* ================= people (instanced voxel villagers) ================= */")
# ---- villagers: on the lanes, any height
s = must(s, "  const NPC_N = 100;", "  const NPC_N = isTouch ? 14 : 26;")
s = must(s, "      if (c < world.BASE) continue;", "      if (c < 3) continue;")
s = must(s, """      const crowd = npcs.length < NPC_N * 0.5;
      const x = crowd ? Math.floor(rr(104, 160)) : Math.floor(rr(4, world.W - 4));
      const z = crowd ? Math.floor(rr(94, 136)) : Math.floor(rr(4, world.D - 4));
      if (!world.land[x + world.W * z]) continue;
      const y = surfaceAt(x, z, world.BASE);""", """      const x = Math.floor(rr(4, world.W - 4)), z = Math.floor(rr(4, world.D - 4));
      if (!world.walk[x + world.W * z]) continue;
      const y = surfaceAt(x, z, world.hm[x + world.W * z]);""")
s = must(s, "      const nx = n.x + d[0], nz = n.z + d[1];\n      const y = surfaceAt(nx, nz, n.y);",
         "      const nx = n.x + d[0], nz = n.z + d[1];\n      if (!world.walk[nx + world.W * nz]) continue;\n      const y = surfaceAt(nx, nz, n.y);")
s = must(s, "  const SHIRTS = [0xc03a2e, 0x2f5fb8, 0xf1e4c0, 0x2f8a5e, 0xe3a72f, 0x6f3fa0, 0x1f1f26, 0xd96aa0, 0x3aa5b8, 0xf5f5f0, 0xb0602c];",
         "  const SHIRTS = [0xb3221e, 0x2f5fb8, 0xf1e4c0, 0x2f6a3e, 0xe3a72f, 0x5a3a2a, 0x1f1f26, 0xd96aa0, 0xf5f5f0, 0x7a2a2a, 0x3a5a7a];")
# ---- birds: alpine choughs over the valley, no pigeons
s = must(s, "      gulls.push({ g, cx: rr(60, 190), cz: rr(60, 175), R: rr(18, 55), h: rr(24, 60),", "      gulls.push({ g, cx: rr(50, 140), cz: rr(30, 110), R: rr(14, 40), h: rr(46, 74),")
s = must(s, "    for (let i = 0; i < 14; i++) {\n      const g = makeGull();", "    for (let i = 0; i < 8; i++) {\n      const g = makeGull(); g.traverse((o) => { if (o.material && o.material.color) o.material = lam(o.material.color.getHex() === 0xe8a020 ? 0xf0c020 : 0x1c1c22); });")
s = must(s, "    for (let i = 0; i < 34; i++) {\n      const g = makePigeon();", "    for (let i = 0; i < 0; i++) {\n      const g = makePigeon();")
# ---- flags: the Swiss flag
s = must(s, """      x.fillStyle = '#b3141e'; x.fillRect(0, 0, s, s);
      x.fillStyle = '#e8bd3a';
      [[8, 20, 16, 5], [6, 14, 5, 7], [20, 12, 6, 8], [22, 9, 4, 3], [10, 8, 9, 6], [12, 6, 5, 3], [22, 24, 3, 4], [6, 25, 3, 3], [13, 25, 3, 3]].forEach((r) => x.fillRect(r[0], r[1], r[2], r[3]));
      x.fillStyle = '#b3141e'; x.fillRect(15, 11, 2, 2);""", """      x.fillStyle = '#d52b1e'; x.fillRect(0, 0, s, s);
      x.fillStyle = '#ffffff'; x.fillRect(13, 6, 6, 20); x.fillRect(6, 13, 20, 6);""")
s = must(s, "const geo = new THREE.PlaneGeometry(4.4, 2.8, 11, 6); geo.translate(2.2, -1.4, 0);", "const geo = new THREE.PlaneGeometry(2.8, 2.8, 8, 6); geo.translate(1.4, -1.4, 0);")
s = must(s, "const x = f.base[i * 3], y = f.base[i * 3 + 1], k = x / 4.4;", "const x = f.base[i * 3], y = f.base[i * 3 + 1], k = x / 2.8;")

# ---- landmarks / tour from the world
i = s.index("  const TELE = [")
j = s.index("  let tourCam = null, tourTgt = null;")
s = s[:i] + """  let TELE = [], TOUR = null;
  function buildTele() {   // every landmark of the world: walk to its doorstep / viewpoint, the summit by air
    TELE = world.landmarks.map((l) => {
      if (l.id === 'summit') return { name: l.name, en: l.en, mode: 'fly', p: [l.x - 14, l.top + 8, l.z + 18], t: [l.x, l.top, l.z] };
      return { name: l.name, en: l.en, mode: 'walk', p: [l.x, l.top + 4, l.z + 3.5], t: [l.x, l.top - 4, l.z - 6] };
    });
    TELE.push({ name: '山谷全景', en: 'Valley view', mode: 'fly', p: [92, 52, 150], t: [92, 24, 96] });
    TOUR = world.tour;
  }
""" + s[j:]

# ---- modes: no gondola
s = must(s, "const MODE_LABEL = { tour: '导览模式 · 点击或按任意键开始探索', walk: '步行模式', fly: '飞行模式', gondola: '贡多拉 · 大运河' };",
         "const MODE_LABEL = { tour: '导览模式 · 点击或按任意键开始探索', walk: '步行模式', fly: '飞行模式' };")
s = must(s, "    if (m === 'gondola') {\n      const b = gondolas[rideIdx % gondolas.length];\n      ridePrevHeading = b.heading; player.yaw = b.heading; player.pitch = -0.05;\n    }\n", "    if (m !== 'walk') S.sit = null;\n")
s = must(s, "    if (t.mode === 'gondola') { setMode('gondola'); return; }\n", "    S.sit = null;\n")
s = must(s, "    if (t.mode === 'walk') y = groundY(t.p[0], t.p[2], Math.floor(t.p[1] + 6));", "    if (t.mode === 'walk') y = groundY(t.p[0], t.p[2], t.p[1] < 3 ? world.H - 1 : Math.floor(t.p[1] + 6));   // no height given: the ground there")

# ---- keys: E uses (doors, seats); Q / R cycle the held block; no model library, no gondola
s = must(s, "    if (e.code === 'KeyM') VeniceModels.toggle();\n    if (e.code === 'KeyQ') cycleHeld(-1);\n    if (e.code === 'KeyE') cycleHeld(1);\n    if (S.mode === 'gondola') {\n      if (e.code === 'KeyA' || e.code === 'ArrowLeft') nextRide(-1);\n      if (e.code === 'KeyD' || e.code === 'ArrowRight') nextRide(1);\n    }\n",
         "    if (e.code === 'KeyQ') cycleHeld(-1);\n    if (e.code === 'KeyR') cycleHeld(1);\n    if (e.code === 'KeyE' && (S.mode === 'walk' || S.mode === 'fly')) interact();\n")
s = must(s, "/^(F\\d+|Tab|Escape|Digit\\d|KeyT|KeyY|KeyM|KeyH)$/", "/^(F\\d+|Tab|Escape|Digit\\d|KeyT|KeyY|KeyH|KeyE)$/")
s = must(s, "    if (e.button === 0) breakBlock(); else if (e.button === 2) placeBlock(); else if (e.button === 1) pickBlock();",
         "    if (e.button === 0) breakBlock(); else if (e.button === 2) { if (!interact(true)) placeBlock(); } else if (e.button === 1) pickBlock();")
# touch: a tap on a door or a seat uses it; otherwise it breaks the block, as before
s = must(s, "&& (S.mode === 'walk' || S.mode === 'fly')) breakBlock(); } } };", "&& (S.mode === 'walk' || S.mode === 'fly')) { if (!interact(true)) breakBlock(); } } } };")
s = must(s, "    hold($('tJump'), 'jump'); hold($('tDown'), 'down');", "    hold($('tJump'), 'jump'); hold($('tDown'), 'down');\n    $('tUse').addEventListener('touchstart', (e) => { e.preventDefault(); if (S.mode === 'tour') setMode('walk'); interact(); }, { passive: false });")

# ---- physics: seated players stay put; fall respawn at the village square
s = must(s, "    if (p.pos.y < -20) { p.pos.set(128.5, 8, 102.5); p.vel.set(0, 0, 0); }", "    if (p.pos.y < -20) { p.pos.set(world.spawn.x, world.spawn.y + 2, world.spawn.z); p.vel.set(0, 0, 0); }")
s = must(s, "      movePlayer(dt);\n      camera.position.set(player.pos.x, player.pos.y + 1.62 + player.stepOff, player.pos.z);",
         "      if (S.sit) {   // seated: any move stands you up\n        const mv = keys.KeyW || keys.KeyA || keys.KeyS || keys.KeyD || keys.ArrowUp || keys.ArrowDown || keys.ArrowLeft || keys.ArrowRight || keys.Space || Math.hypot(joy.x, joy.y) > 0.3 || touchBtn.jump;\n"
         "        if (mv) standUp(); else { player.vel.set(0, 0, 0); camera.position.set(S.sit.x, S.sit.y + 0.95, S.sit.z); camera.rotation.set(player.pitch, player.yaw, 0); camera.updateProjectionMatrix(); return; }\n      }\n"
         "      movePlayer(dt);\n      camera.position.set(player.pos.x, player.pos.y + 1.62 + player.stepOff, player.pos.z);")
# ---- doors, seats, smoke and cows (new)
s = must(s, "  /* ================= gondola ride ================= */\n  function nextRide(d) { rideIdx = (rideIdx + d + gondolas.length) % gondolas.length; const b = gondolas[rideIdx]; ridePrevHeading = b.heading; player.yaw = b.heading; toast('贡多拉 ' + (rideIdx + 1) + '/' + gondolas.length); }",
         r"""  /* ================= doors & seats ================= */
  function doorAt(x, y, z) { return world.doors.find((d) => d.x === x && d.z === z && (d.y === y || d.y + 1 === y)); }
  function toggleDoor(d) {
    if (d.open) {
      const pp = player.pos; if (Math.abs(pp.x - (d.x + 0.5)) < 0.8 && Math.abs(pp.z - (d.z + 0.5)) < 0.8 && pp.y < d.y + 2) { toast('先从门口让开～'); return; }
      world.set(d.x, d.y, d.z, B.DOOR, d.c); world.set(d.x, d.y + 1, d.z, B.DOOR, d.c); d.open = false; toast('🚪 关门');
    } else {
      d.c = world.cols[world.idx(d.x, d.y, d.z)];
      world.set(d.x, d.y, d.z, 0, 0); world.set(d.x, d.y + 1, d.z, 0, 0); d.open = true; toast('🚪 开门');
    }
    markDirty(d.x, d.z);
    if (window.__alpDoor) window.__alpDoor(d);
  }
  function nearDoor(r) { const p = player.pos; let best = null, bd = r; for (const d of world.doors) { const k = Math.hypot(p.x - (d.x + 0.5), p.z - (d.z + 0.5)); if (k < bd && Math.abs(p.y - d.y) < 2.2) { bd = k; best = d; } } return best; }
  function nearSeat(r) { const p = player.pos; let best = null, bd = r; for (const s2 of world.seats) { const k = Math.hypot(p.x - s2.x, p.z - s2.z); if (k < bd && Math.abs(p.y - s2.y) < 1.6) { bd = k; best = s2; } } return best; }
  function sitOn(s2) { S.sit = s2; player.pos.set(s2.x, s2.y, s2.z); player.vel.set(0, 0, 0); toast('🪑 坐下 · 移动即可站起来'); }
  function standUp() { const s2 = S.sit; S.sit = null; if (!s2) return; player.pos.set(s2.x, s2.y + 0.02, s2.z); player.vel.set(0, 0, 0); }
  function interact(onlyTarget) {   // E / right-click / tap: the door or seat you look at, else the nearest one
    if (S.sit) { standUp(); return true; }
    if (target) {
      const id = world.blocks[world.idx(target.x, target.y, target.z)];
      if (id === B.DOOR) { const d = doorAt(target.x, target.y, target.z); if (d) { toggleDoor(d); return true; } }
      if (id === B.CHAIR || id === B.BENCH) { const s2 = world.seats.find((q) => Math.floor(q.x) === target.x && Math.floor(q.z) === target.z && q.y === target.y + 1); if (s2) { sitOn(s2); return true; } }
    }
    if (onlyTarget) return false;
    const d = nearDoor(2.4); if (d) { toggleDoor(d); return true; }
    const s3 = nearSeat(1.8); if (s3) { sitOn(s3); return true; }
    toast('附近没有门或座位'); return false;
  }
  function useHint() {   // what E would do here
    const el = $('useHint'); if (!el) return;
    let t = '';
    if (S.mode === 'walk') {
      if (S.sit) t = '移动：站起来';
      else { const tg = target && world.blocks[world.idx(target.x, target.y, target.z)]; const d = nearDoor(2.4), s3 = nearSeat(1.8);
        if (tg === B.DOOR || d) { const dd = (tg === B.DOOR ? doorAt(target.x, target.y, target.z) : d) || d; t = dd && dd.open ? 'E · 关门' : 'E · 开门'; }
        else if (tg === B.CHAIR || tg === B.BENCH || s3) t = 'E · 坐下'; }
    }
    if (el.textContent !== t) el.textContent = t;
    el.style.display = t ? 'block' : 'none';
  }

  /* ================= chimney smoke ================= */
  let smoke = null;
  function spawnSmoke() {
    const per = 10, n = world.chimneys.length * per, pos = new Float32Array(n * 3), seeds = new Float32Array(n);
    for (let i = 0; i < n; i++) seeds[i] = Math.random() * 6;
    const geo = new THREE.BufferGeometry(); geo.setAttribute('position', new THREE.BufferAttribute(pos, 3));
    const mat = new THREE.PointsMaterial({ color: 0xdedede, size: 0.9, transparent: true, opacity: 0.55, depthWrite: false });
    const pts = new THREE.Points(geo, mat); pts.frustumCulled = false; scene.add(pts);
    smoke = { pos, seeds, per, geo };
  }
  function updateSmoke(time) {
    if (!smoke) return; const { pos, seeds, per } = smoke;
    for (let i = 0; i < seeds.length; i++) {
      const c = world.chimneys[(i / per) | 0], a = (time * 0.5 + seeds[i]) % 6;
      pos[i * 3] = c[0] + Math.sin(a * 1.3 + seeds[i] * 4) * 0.22 * a + a * 0.4; pos[i * 3 + 1] = c[1] + a * 1.05; pos[i * 3 + 2] = c[2] + Math.cos(a * 1.1 + seeds[i] * 3) * 0.22 * a;
    }
    smoke.geo.attributes.position.needsUpdate = true;
  }

  /* ================= cows in the pasture ================= */
  const cows = [];
  function makeCow() {
    const g = new THREE.Group(), w = 0xf2efe6, b = 0x5a3a26;
    bx(g, 0.8, 0.7, 1.5, w, 0, 0.9, 0); bx(g, 0.55, 0.3, 0.6, b, 0.15, 1.05, 0.2); bx(g, 0.4, 0.3, 0.4, b, -0.22, 0.95, -0.4);
    bx(g, 0.5, 0.5, 0.5, w, 0, 1.15, 0.95); bx(g, 0.5, 0.22, 0.2, 0xd8a090, 0, 1.0, 1.22); bx(g, 0.1, 0.16, 0.1, 0xe8e0c0, 0.22, 1.45, 0.95); bx(g, 0.1, 0.16, 0.1, 0xe8e0c0, -0.22, 1.45, 0.95);
    bx(g, 0.18, 0.18, 0.12, 0xd8b030, 0, 0.82, 1.0);   // the bell
    for (const [x, z] of [[-0.25, -0.55], [0.25, -0.55], [-0.25, 0.55], [0.25, 0.55]]) bx(g, 0.18, 0.55, 0.18, w, x, 0.28, z);
    return g;
  }
  function spawnCows() {
    const P = world.pasture; if (!P.length) return;
    for (let i = 0; i < 6; i++) { const c = P[Math.floor(Math.random() * P.length)], g = makeCow(); scene.add(g); cows.push({ g, x: c[0] + 0.5, z: c[1] + 0.5, tx: c[0] + 0.5, tz: c[1] + 0.5, wait: rr(0, 4) }); }
  }
  function updateCows(dt, time) {
    const P = world.pasture;
    for (const c of cows) {
      if (c.wait > 0) { c.wait -= dt; c.g.children[3].rotation.x = Math.sin(time * 2 + c.x) > 0.3 ? 0.5 : 0; }
      else { const dx = c.tx - c.x, dz = c.tz - c.z, d = Math.hypot(dx, dz); if (d < 0.1) { c.wait = rr(2, 7); const n = P[Math.floor(Math.random() * P.length)]; if (Math.hypot(n[0] - c.x, n[1] - c.z) < 8) { c.tx = n[0] + 0.5; c.tz = n[1] + 0.5; } } else { const st = Math.min(d, 0.7 * dt); c.x += dx / d * st; c.z += dz / d * st; c.g.rotation.y = Math.atan2(dx, dz); } }
      const y = world.hm[Math.floor(c.x) + world.W * Math.floor(c.z)];
      c.g.position.set(c.x, y, c.z);
    }
  }""")

# ---- held blocks: the alpine ones
i = s.index("    HELD.push(")
j = s.index("    updateHeld();\n  }")
s = s[:i] + """    HELD.push(
      { n: '原木墙', id: B.LOGW, c: P(0.42, 0.27, 0.15) }, { n: '木板', id: B.PLANKS, c: P(0.62, 0.42, 0.24) },
      { n: '石墙', id: B.STONE, c: P(0.78, 0.76, 0.72) }, { n: '白灰墙', id: B.PLASTER, c: P(0.96, 0.94, 0.88) },
      { n: '木瓦屋顶', id: B.ROOF, c: P(0.36, 0.25, 0.18) }, { n: '窗（夜亮灯）', id: B.GLASS, c: 0 },
      { n: '红百叶窗', id: B.SHUTTER, c: P(0.72, 0.16, 0.14) }, { n: '天竺葵', id: B.FLOWER, c: 0 },
      { n: '石板路', id: B.PATH, c: P(0.7, 0.68, 0.64) }, { n: '雪', id: B.SNOW, c: P(0.97, 0.98, 1.0) },
      { n: '栏杆', id: B.RAIL, c: P(0.42, 0.27, 0.15) }, { n: '灯', id: B.LAMP, c: 0 }
    );
""" + s[j:]
s = must(s, "  const SWATCH = ['#ece8dc', '#e0a85c', '#eb9e85', '#cc6b4d', '#c75c38', '#b3804d', '#33734d', '#f2d27a', '#e8bd3a', '#66b89a', '#e58a80', '#ffe9a0'];",
         "  const SWATCH = ['#6b4526', '#9e6b3d', '#c7c2b8', '#f4f0e0', '#5c4030', '#f2d27a', '#b82924', '#d8404a', '#b3ada3', '#f8fbff', '#6b4526', '#ffe9a0'];")

# ---- hotbar: no gondola, no model library; 🚪 use instead
s = must(s, "    { ic: '🛶', tip: '贡多拉', act: () => { setMode('gondola'); requestLock(); } },", "    { ic: '🚪', tip: '开门 / 坐下 (E)', act: () => { if (S.mode === 'tour') setMode('walk'); interact(); } },")
s = must(s, "    { ic: '🌐', tip: '3D 模型库 (M)', act: () => VeniceModels.toggle() }", "    { ic: '🏔️', tip: '山谷全景', act: () => teleport(TELE[TELE.length - 1]) }")
s = must(s, "    const modeIdx = { tour: 0, walk: 1, fly: 2, gondola: 3 }[S.mode];", "    const modeIdx = { tour: 0, walk: 1, fly: 2 }[S.mode];")
s = must(s, "      walk: 'WASD 移动 · 空格 跳 · Shift 冲刺<br>左键 拆方块 · 右键 放方块 · Q/E 换方块<br>F / 双击空格：飞行 · 水里按空格上岸',",
         "      walk: 'WASD 移动 · 空格 跳 · Shift 冲刺<br>E / 右键门或椅子：开门 · 坐下<br>左键 拆方块 · 右键 放方块 · Q/R 换方块<br>F / 双击空格：飞行',")
s = must(s, "      fly: 'WASD 飞行 · 空格 上升 · C/Shift 下降<br>Ctrl 加速 · 左键拆 · 右键放 · F 落地',\n      gondola: 'A / D：换一条贡多拉<br>鼠标：环顾四周 · 1-4：切换模式'",
         "      fly: 'WASD 飞行 · 空格 上升 · C/Shift 下降<br>Ctrl 加速 · 左键拆 · 右键放 · F 落地'")
s = must(s, "      tour: '点击画面 / 任意键：进入探索<br>1-9：功能栏 · T：时间 · M：模型库',", "      tour: '点击画面 / 任意键：进入探索<br>1-9：功能栏 · T：时间 · 📍 地标',")
s = must(s, "(S.mode === 'walk' || S.mode === 'fly' || S.mode === 'gondola')) ? 'block' : 'none';", "(S.mode === 'walk' || S.mode === 'fly')) ? 'block' : 'none';")
# ---- minimap: the lake, lanes, roofs
s = must(s, "      if (b === B.SAND || h <= 1) { r = 26; g = 92; bl = 118; }", "      if (h < VW.WATER_Y && b === B.GRAVEL) { r = 40; g = 140; bl = 150; }")
s = must(s, "        if (b === B.PAVE) { r = 150; g = 146; bl = 138; }", "        if (b === B.PATH) { r = 196; g = 190; bl = 178; }\n        if (b === B.SNOW || b === B.ROCKSNOW) { r = 245 * sh; g = 248 * sh; bl = 255 * sh; }")
s = must(s, "    gondolas.forEach((b) => { mmx.fillStyle = '#ffd34a'; mmx.fillRect(Math.floor(b.pos.x) - 1, Math.floor(b.pos.z) - 1, 2, 2); });\n", "")
s = must(s, "    if (S.mode === 'tour' || S.mode === 'gondola') player.pitch = -0.25;", "    if (S.mode === 'tour') player.pitch = -0.25;")
# ---- camera: no gondola branch
i = s.index("    } else if (S.mode === 'gondola') {")
j = s.index("    } else {\n      if (S.sit)")
s = s[:i] + s[j:]
# ---- main loop: smoke, cows, use hint; no glTF mixer
s = must(s, "    updateBoats(dt, S.elapsed); updateNPCs(dt, S.elapsed); updateBirds(dt, S.elapsed); updateFlags(S.elapsed);\n    if (glb.mixer) glb.mixer.update(dt);",
         "    updateNPCs(dt, S.elapsed); updateBirds(dt, S.elapsed); updateFlags(S.elapsed); updateSmoke(S.elapsed); updateCows(dt, S.elapsed);")
s = must(s, "      drawMinimap(); updateBanner();", "      drawMinimap(); updateBanner(); useHint();")
s = must(s, "    $('uw').style.display = camera.position.y < VW.WATER_Y - 0.05 ? 'block' : 'none';", "    $('uw').style.display = camera.position.y < VW.WATER_Y - 0.05 && inLake(camera.position.x, camera.position.z) ? 'block' : 'none';")
# ---- boot
i = s.index("      setLoad('正在规划运河与街区…', 0.04); await nextFrame();")
j = s.index("      setLoad('烘焙像素贴图…', 0.16); await nextFrame();")
s = s[:i] + """      setLoad('堆起雪山、铺开草坡…', 0.04); await nextFrame();
      world = window.__alpWorld || VW.create(1291); window.__alpWorld = world;
      if (window.__alpApply) window.__alpApply(world, null);   // My World: this island's own edits on the world
      window.__alpine = { world, player, scene, camera, S, setMode, teleport, markDirty, interact, toggleDoor, sitOn };
      { const l = world.landmarks.find((q) => q.id === 'lake'); if (l) { waterMesh.position.x = l.x + 6; waterMesh.position.z = l.z + 2; } }
      player.pos.set(world.spawn.x, world.spawn.y, world.spawn.z);
""" + s[j:]
s = must(s, "        if (done % 3 === 0) { setLoad('搭建方块街区 ' + done + '/' + total, 0.2 + 0.6 * done / total); await nextFrame(); }",
         "        if (done % 3 === 0) { setLoad('搭建木屋与松林 ' + done + '/' + total, 0.2 + 0.6 * done / total); await nextFrame(); }")
i = s.index("      setLoad('放置贡多拉、行人与海鸥…', 0.86); await nextFrame();")
j = s.index("      setLoad('完成', 1);")
s = s[:i] + """      setLoad('村民、奶牛与炊烟…', 0.86); await nextFrame();
      spawnNPCs(); makeNPCMeshes(); spawnBirds(); spawnFlags(); spawnSmoke(); spawnCows();
      buildHeld(); buildMinimap(); buildTele(); initTour(); buildHotbar();
""" + s[j:]
s = must(s, "    const m = qs.get('mode'); if (m && ['tour', 'walk', 'fly', 'gondola'].includes(m)) S.mode = m;", "    const m = qs.get('mode'); if (m && ['tour', 'walk', 'fly'].includes(m)) S.mode = m;\n    if (m === 'walk' && !c) { player.pos.set(world.spawn.x, world.spawn.y, world.spawn.z); player.yaw = world.spawn.yaw; }")
# the glTF loader is not needed (no third-party model library here)
s = cut(s, "  /* ================= external glTF ================= */", "  /* ================= landmarks / teleports ================= */")
s = must(s, "  /* ================= landmarks / teleports ================= */", "  const glb = { mixer: null };\n\n  /* ================= landmarks / teleports ================= */")
assert 'Venice' not in s and 'gondola' not in s.replace('gondolas', ''), [l for l in s.split('\n') if 'Venice' in l or ('gondola' in l and 'gondolas' not in l)][:5]
(OUT / 'app.js').write_text(s, encoding='utf-8')
print('ported app.js', len(s), 'mesher.js', len(m))

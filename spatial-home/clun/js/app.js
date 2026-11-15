/* Clun · 展示页：绕建筑旋转的镜头、视角预设、图层开关、水平剖切、参数表。只有简单地面和基础光。 */
(function () {
  'use strict';
  var C = window.Clun, P = C.P, q = new URLSearchParams(location.search);
  var $ = function (id) { return document.getElementById(id); };

  var renderer = new THREE.WebGLRenderer({ antialias: true, alpha: true, preserveDrawingBuffer: q.has('shot') });
  renderer.setPixelRatio(Math.min(window.devicePixelRatio || 1, 2));
  renderer.outputEncoding = THREE.sRGBEncoding; renderer.toneMapping = THREE.ACESFilmicToneMapping; renderer.toneMappingExposure = 0.92;
  renderer.shadowMap.enabled = true; renderer.shadowMap.type = THREE.PCFSoftShadowMap;
  $('stage').appendChild(renderer.domElement);

  var scene = new THREE.Scene(), camera = new THREE.PerspectiveCamera(32, 1, 0.5, 400);
  var house = C.build(q.get('mode') === 'white' ? 'white' : 'final'); scene.add(house);
  var G = house.userData.groups;

  /* 简单地面：一块接阴影的圆盘 + 一个指北箭头 */
  var ground = new THREE.Mesh(new THREE.CircleGeometry(70, 72), new THREE.MeshStandardMaterial({ color: new THREE.Color(0xc9b994).convertSRGBToLinear(), roughness: 1 }));
  ground.rotation.x = -Math.PI / 2; ground.position.y = P.groundZ - 0.005; ground.receiveShadow = true; scene.add(ground);
  var arrow = (function () {
    var s = new THREE.Shape(); s.moveTo(0, 1.6); s.lineTo(0.7, -0.6); s.lineTo(0, -0.2); s.lineTo(-0.7, -0.6); s.closePath();
    var a = new THREE.Mesh(new THREE.ShapeGeometry(s), new THREE.MeshBasicMaterial({ color: new THREE.Color(0xb8553f).convertSRGBToLinear() }));
    a.rotation.x = -Math.PI / 2; a.rotation.z = -Math.PI / 2;       /* 箭头指向 +X（北） */
    a.scale.setScalar(0.8); a.position.set(15, P.groundZ + 0.01, 6); scene.add(a); return a;
  })();

  /* 基础光：天光 + 一盏带软阴影的太阳 + 一点补光 */
  var hemiS = new THREE.HemisphereLight(0xe6efff, 0xa89a84, 0.6); scene.add(hemiS);
  var sun = new THREE.DirectionalLight(0xfff0dc, 1.45); sun.position.set(-16, 26, 22); sun.target.position.set(1.5, 3, -3.5); scene.add(sun, sun.target);
  sun.castShadow = true; sun.shadow.mapSize.set(2048, 2048); sun.shadow.bias = -0.0004; sun.shadow.normalBias = 0.04;
  var sc = sun.shadow.camera; sc.left = -22; sc.right = 22; sc.top = 22; sc.bottom = -22; sc.near = 1; sc.far = 90;
  var fill = new THREE.DirectionalLight(0xdbe6ff, 0.4); fill.position.set(14, 10, -20); scene.add(fill);

  /* —— 外景（?scene=valley）：劳特布龙嫩山谷 + 花园。展台的地面、指北箭头和灯关掉，镜头换成照片机位 —— */
  var VAL = q.get('scene') === 'valley' && C.buildValley ? C.buildValley(scene, house, renderer) : null, VO = { az: 0, el: 0, zoom: 1 };
  if (VAL) {
    ground.visible = false; arrow.visible = false; hemiS.visible = sun.visible = fill.visible = false; sun.castShadow = false;
    camera.far = 6000; camera.near = 0.8; camera.updateProjectionMatrix(); document.body.classList.add('valley'); renderer.toneMappingExposure = 0.85;
    $('hint').textContent = '拖动小幅转动（照片范围内）· 滚轮 / 捏合推近 · 360° 看房子请回展台';
    if (q.get('zoom')) VO.zoom = Math.max(0.55, Math.min(1, +q.get('zoom'))); if (q.get('az')) VO.az = +q.get('az'); if (q.get('el')) VO.el = +q.get('el');
  }

  /* —— 环绕镜头 —— az=0 在正东（看正立面），az 增大向北转 */
  var O = { az: 0.55, el: 0.3, d: 46, t: new THREE.Vector3(1.6, 3.6, -3.4), auto: false };
  var VIEWS = {
    hero: [0.55, 0.3, 40], eye: [0, -0.075, 30], detail: [0.35, 0.02, 13], front: [0, 0.1, 38], rear: [Math.PI, 0.16, 38], south: [-Math.PI / 2, 0.14, 36], north: [Math.PI / 2, 0.14, 36],
    top: [0, 1.52, 40], section: [Math.PI / 2, 0.06, 30], sectionStair: [-Math.PI / 2, 0.06, 26], 'rear-n': [Math.PI - 0.7, 0.32, 46], 'rear-s': [Math.PI + 0.7, 0.32, 46], 'front-s': [-0.6, 0.3, 46], aerial: [0.25, 0.75, 38]
  };
  var fly = null;
  function setView(n, instant) {
    if (VAL) { VO.az = 0; VO.el = 0; VO.zoom = 1; return; }
    var v = VIEWS[n]; if (!v) return;
    if (instant) { O.az = v[0]; O.el = v[1]; O.d = v[2]; fly = null; return; }
    var da = v[0] - O.az; da = Math.atan2(Math.sin(da), Math.cos(da));
    fly = { t: 0, a0: O.az, a1: O.az + da, e0: O.el, e1: v[1], d0: O.d, d1: v[2] };
  }
  function place() {
    if (VAL) { VAL.place(camera, VO); return; }
    O.el = Math.max(-0.14, Math.min(1.54, O.el)); O.d = Math.max(6, Math.min(140, O.d));
    var ce = Math.cos(O.el);
    camera.position.set(O.t.x + O.d * ce * Math.sin(O.az), O.t.y + O.d * Math.sin(O.el), O.t.z + O.d * ce * Math.cos(O.az));
    if (camera.position.y < P.groundZ + 0.4) camera.position.y = P.groundZ + 0.4;
    camera.lookAt(O.t);
  }
  (function () {
    var el = renderer.domElement, pts = {}, last = null;
    el.style.touchAction = 'none';
    el.addEventListener('contextmenu', function (e) { e.preventDefault(); });
    el.addEventListener('pointerdown', function (e) { el.setPointerCapture(e.pointerId); pts[e.pointerId] = { x: e.clientX, y: e.clientY, b: e.button }; last = null; fly = null; O.auto = false; sync(); });
    el.addEventListener('pointerup', function (e) { delete pts[e.pointerId]; last = null; });
    el.addEventListener('pointercancel', function (e) { delete pts[e.pointerId]; last = null; });
    el.addEventListener('pointermove', function (e) {
      var p = pts[e.pointerId]; if (!p) return;
      var dx = e.clientX - p.x, dy = e.clientY - p.y; p.x = e.clientX; p.y = e.clientY;
      var ids = Object.keys(pts);
      if (VAL) {                                   /* 外景：小幅转动（绕房子）+ 俯仰；双指捏合推近 */
        if (ids.length >= 2) { var a2 = pts[ids[0]], b2 = pts[ids[1]], d2 = Math.hypot(a2.x - b2.x, a2.y - b2.y); if (last) VO.zoom = Math.max(0.55, Math.min(1, VO.zoom * last.dist / Math.max(1, d2))); last = { dist: d2 }; }
        else { VO.az -= dx * 0.0012; VO.el += dy * 0.001; }
        return;
      }
      if (ids.length >= 2) {                       /* 双指：捏合缩放 + 平移 */
        var a = pts[ids[0]], b = pts[ids[1]], dist = Math.hypot(a.x - b.x, a.y - b.y), mx = (a.x + b.x) / 2, my = (a.y + b.y) / 2;
        if (last) { O.d *= last.dist / Math.max(1, dist); pan(mx - last.mx, my - last.my); }
        last = { dist: dist, mx: mx, my: my };
      } else if (p.b === 2 || e.shiftKey) pan(dx, dy);
      else { O.az -= dx * 0.006; O.el += dy * 0.005; }
    });
    el.addEventListener('wheel', function (e) { e.preventDefault(); if (VAL) { VO.zoom = Math.max(0.55, Math.min(1, VO.zoom * Math.exp(e.deltaY * 0.0012))); return; } O.d *= Math.exp(e.deltaY * 0.0012); fly = null; }, { passive: false });
    function pan(dx, dy) {
      var k = O.d * 0.0011, r = new THREE.Vector3().setFromMatrixColumn(camera.matrix, 0), u = new THREE.Vector3().setFromMatrixColumn(camera.matrix, 1);
      O.t.addScaledVector(r, -dx * k).addScaledVector(u, dy * k); O.t.y = Math.max(0, Math.min(10, O.t.y));
    }
  })();

  /* —— 水平剖切：把标高 h 以上的部分切掉，看室内布局 —— */
  var clip = new THREE.Plane(new THREE.Vector3(0, -1, 0), 0), CUT_MAX = 11.5, cutOn = false;
  /* 竖向剖面：垂直于南北轴（X）切开。side = 1 留南半边（从北往南看），−1 留北半边 */
  var sec = new THREE.Plane(new THREE.Vector3(-1, 0, 0), 0), secOn = false;
  function planes() { var a = []; if (cutOn) a.push(clip); if (secOn) a.push(sec); renderer.clippingPlanes = a; }
  function setCut(h) {
    h = Math.max(0.3, Math.min(CUT_MAX, h)); cutOn = h < CUT_MAX - 0.01; clip.constant = h; planes();
    $('cutVal').textContent = cutOn ? '+' + h.toFixed(1) + ' m' : '关'; $('cut').value = h;
  }
  function setSection(x, side) {
    secOn = x != null; side = side || 1; if (secOn) { sec.normal.set(-side, 0, 0); sec.constant = side * x; } planes();
    $('sec').classList.toggle('on', secOn);
  }

  /* —— 界面 —— */
  function sync() { $('auto').classList.toggle('on', O.auto); $('mode').textContent = C.mode === 'final' ? '看白模' : '看外观'; }
  [['hero', '主视角'], ['front', '正面 · 东'], ['rear', '背面 · 西'], ['south', '南侧'], ['north', '北侧'], ['aerial', '俯瞰'], ['top', '屋顶']].forEach(function (v) {
    var b = document.createElement('button'); b.textContent = v[1]; b.addEventListener('click', function () { setView(v[0]); }); $('views').appendChild(b);
  });
  C.LAYERS.forEach(function (l) {
    var lab = document.createElement('label'), cb = document.createElement('input'); cb.type = 'checkbox'; cb.checked = true; cb.id = 'ly-' + l[0];
    cb.addEventListener('change', function () { G[l[0]].visible = cb.checked; });
    lab.appendChild(cb); lab.appendChild(document.createTextNode(l[1])); $('layers').appendChild(lab);
  });
  function setLayer(n, on) { if (G[n]) { G[n].visible = on; var cb = $('ly-' + n); if (cb) cb.checked = on; } }
  $('cut').max = CUT_MAX; $('cut').addEventListener('input', function () { setCut(+this.value); });
  $('auto').addEventListener('click', function () { O.auto = !O.auto; sync(); });
  $('scene').textContent = VAL ? '回展台' : '外景 · 劳特布龙嫩';
  $('scene').addEventListener('click', function () { var u = new URLSearchParams(location.search); if (VAL) u.delete('scene'); else u.set('scene', 'valley'); ['view', 'cam', 'sec', 'secside'].forEach(function (k) { u.delete(k); }); location.search = u.toString(); });
  /* 剖面：穿过卧室 4 的后老虎窗和客厅（看斜顶、矮墙、各层层高），从北往南看；楼梯剖面沿楼梯井切开，从南往北看 */
  $('sec').addEventListener('click', function () { if (secOn) { setSection(null); return; } all(true); setCut(CUT_MAX); setSection(-3.0, 1); setView('section'); });
  $('secStair').addEventListener('click', function () { all(true); setCut(CUT_MAX); setSection(0.4, -1); setView('sectionStair'); });
  $('mode').addEventListener('click', function () { C.setMode(house, C.mode === 'final' ? 'white' : 'final'); sync(); });
  [['roofOff', function () { setSection(null); setLayer('roof', false); setLayer('chimneys', false); setCut(CUT_MAX); }], ['f2', function () { all(true); setCut(P.floor2Z + 1.3 - P.groundZ * 0); }],
    ['f1', function () { all(true); setCut(P.floor1Z + 1.4); }], ['f0', function () { all(true); setCut(1.5); }], ['whole', function () { all(true); setCut(CUT_MAX); }]
  ].forEach(function (a) { $(a[0]).addEventListener('click', a[1]); });
  function all(on) { C.LAYERS.forEach(function (l) { setLayer(l[0], on); }); setSection(null); }
  /* 参数表 */
  (function () {
    var h = '<table><tr><th>参数</th><th>值</th><th>说明</th><th>来源</th><th>可信度</th></tr>';
    C.PARAM_TABLE.forEach(function (r) { h += '<tr><td><code>' + r[0] + '</code></td><td>' + r[1] + '</td><td>' + r[2] + '</td><td>' + r[3] + '</td><td class="est">' + r[4] + ' · ' + r[5] + '</td></tr>'; });
    h += '</table><h3>房间尺寸（平面图标注，STATED · PROVISIONAL）</h3><table><tr><th>层</th><th>房间</th><th>长 × 宽 (m)</th><th>方位</th></tr>';
    C.ROOMS.forEach(function (r) { h += '<tr><td>' + r[0] + '</td><td>' + r[1] + '</td><td>' + r[2].toFixed(2) + ' × ' + r[3].toFixed(2) + '</td><td>' + r[4] + '</td></tr>'; });
    h += '</table><p>主宅面积 ' + C.AREA.main + ' m²（' + C.AREA.conf + '；' + C.AREA.note + '）</p>';
    $('ptable').innerHTML = h;
    $('params').addEventListener('click', function () { $('pwrap').hidden = !$('pwrap').hidden; });
    $('pclose').addEventListener('click', function () { $('pwrap').hidden = true; });
  })();

  function resize() {
    var w = window.innerWidth, h = window.innerHeight; renderer.setSize(w, h, false);
    camera.aspect = w / h; camera.fov = w / h < 0.8 ? 46 : 32; camera.updateProjectionMatrix();
  }
  window.addEventListener('resize', resize); resize();

  /* 地址参数：?view=front&cut=4.3&hide=roof,chimneys&auto=1&ui=0 */
  if (q.get('view')) setView(q.get('view'), true);
  if (q.get('sec')) setSection(+q.get('sec'), q.get('secside') === 'n' ? -1 : 1);
  if (q.get('cam')) { var cm = q.get('cam').split(',').map(Number); if (cm.length >= 3) { O.az = cm[0]; O.el = cm[1]; O.d = cm[2]; } if (cm.length >= 6) O.t.set(cm[3], cm[4], cm[5]); fly = null; }   /* ?cam=方位,仰角,距离,目标x,y,z */
  (q.get('hide') || '').split(',').forEach(function (n) { if (n) setLayer(n, false); });
  setCut(q.get('cut') ? +q.get('cut') : CUT_MAX);
  if (q.get('auto') === '1') O.auto = true;
  if (q.get('ui') === '0') document.body.classList.add('noui');
  sync();

  var st = C.stats(house), frames = 0, t0 = performance.now(), fps = 0, prev = t0;
  $('stat').textContent = st.meshes + ' 网格 · ' + Math.round(st.tris) + ' 三角面';
  function loop(now) {
    var dt = Math.min(0.05, (now - prev) / 1000); prev = now;
    if (fly) { fly.t = Math.min(1, fly.t + dt / 0.9); var k = fly.t * fly.t * (3 - 2 * fly.t);
      O.az = fly.a0 + (fly.a1 - fly.a0) * k; O.el = fly.e0 + (fly.e1 - fly.e0) * k; O.d = fly.d0 + (fly.d1 - fly.d0) * k; if (fly.t >= 1) fly = null; }
    if (O.auto) { if (VAL) VO.az = Math.sin(now / 1000 * 0.35) * VAL.limits(camera.aspect, VO.zoom).azMax; else O.az += dt * 0.25; }
    if (VAL && VAL.tick) VAL.tick(now / 1000);
    place(); renderer.render(scene, camera);
    frames++; if (now - t0 > 1000) { fps = Math.round(frames * 1000 / (now - t0)); frames = 0; t0 = now; $('fps').textContent = fps + ' fps'; }
    requestAnimationFrame(loop);
  }
  requestAnimationFrame(loop);

  C.app = { setView: setView, setCut: setCut, setSection: setSection, setMode: function (m) { C.setMode(house, m); sync(); }, setLayer: setLayer, orbit: O, stats: st, fps: function () { return fps; }, renderer: renderer, scene: scene, camera: camera, house: house,
    shot: function () { place(); renderer.render(scene, camera); return renderer.domElement.toDataURL('image/jpeg', 0.9); } };
})();

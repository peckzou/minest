  /* ================= boot ================= */
  const setLoad = (msg, p) => { $('loadMsg').textContent = msg; $('bar').firstElementChild.style.width = Math.round(p * 100) + '%'; };
  async function boot() {
    try {
      setLoad('正在塑造破火山口悬崖…', 0.04); await nextFrame();
      world = VW.create(2021);
      window.__santorini = { world, player, scene, camera, S, setMode, teleport };
      setLoad('烘焙像素贴图…', 0.16); await nextFrame();
      const atlas = new THREE.CanvasTexture(SantoriniTex.buildCanvas());
      atlas.magFilter = THREE.NearestFilter; atlas.minFilter = THREE.NearestFilter; atlas.generateMipmaps = false;
      matWorld.map = atlas; matGlow.map = atlas; matWorld.needsUpdate = true; matGlow.needsUpdate = true;
      CX = Math.ceil(world.W / CH); CZ = Math.ceil(world.D / CH);
      const total = CX * CZ; let done = 0;
      for (let cz = 0; cz < CZ; cz++) for (let cx = 0; cx < CX; cx++) {
        meshChunk(cx, cz); done++;
        if (done % 3 === 0) { setLoad('搭建白色小镇 ' + done + '/' + total, 0.2 + 0.6 * done / total); await nextFrame(); }
      }
      setLoad('扬帆、牵驴、放风车…', 0.86); await nextFrame();
      addRoute([[84, 24], [60, 52], [56, 86], [60, 112]], 'gulet', { speed: 2.4, u0: 0, a: 4, b: 4 });
      addRoute([[56, 168], [66, 190], [56, 214]], 'gulet', { speed: 2.2, u0: 40, a: 4, b: 4 });
      addRoute([[42, 40], [44, 80], [42, 112], [40, 150], [46, 190]], 'caique', { speed: 3.2, hull: 0x1f55b5, u0: 0, a: 4, b: 4 });
      addRoute([[96, 100], [94, 128], [92, 160], [96, 196]], 'caique', { speed: 3.6, hull: 0xf4f4f0, u0: 20, a: 3, b: 3 });
      addRoute([[84, 4], [80, 36], [66, 64], [66, 94], [86, 112], [92, 132], [88, 160], [76, 200], [70, 222]], 'ferry', { speed: 4.4, u0: 60, a: 2, b: 2 });
      addMoored();
      spawnNPCs(); makeNPCMeshes(); spawnBirds(); spawnProps();
      buildHeld(); buildMinimap(); buildTele(); initTour(); buildHotbar();
      SantoriniModels.init({
        loadGLB, clearGLB, setGLBScale: (s) => { if (glb.pivot) glb.pivot.scale.setScalar(s); }, toast,
        onOpen: () => { exitLock(); }, onClose: () => { }
      });
      setLoad('完成', 1);
      applyURLCamera();
      setMode(S.mode); updateHint();
      $('loading').classList.add('done');
      requestAnimationFrame(frame);
    } catch (err) {
      console.error(err);
      setLoad('加载失败：' + (err && err.message ? err.message : err), 1);
    }
  }
  function applyURLCamera() {
    const c = qs.get('cam');
    if (c) {
      const v = c.split(',').map(Number);
      if (v.length >= 6) {
        const f = look(v[0], v[1], v[2], v[3], v[4], v[5]);
        player.pos.set(v[0], v[1] - 1.62, v[2]); player.yaw = f.yaw; player.pitch = f.pitch; S.mode = 'fly';
      }
    }
    const m = qs.get('mode'); if (m && ['tour', 'walk', 'fly', 'boat'].includes(m)) S.mode = m;
    const tp = parseInt(qs.get('tp'), 10); if (!isNaN(tp) && TELE[tp]) { teleport(TELE[tp]); }
    if (qs.get('hud') === '0') $('hud').style.display = 'none';
  }
  boot();
})();

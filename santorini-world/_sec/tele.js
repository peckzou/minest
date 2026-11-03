  /* ================= landmarks / teleports ================= */
  function look(fx, fy, fz, tx, ty, tz) { const dx = tx - fx, dy = ty - fy, dz = tz - fz; return { yaw: Math.atan2(-dx, -dz), pitch: Math.atan2(dy, Math.hypot(dx, dz)) }; }
  let TELE = [];
  function buildTele() {
    const P0 = world.BASE, lm = (id) => world.landmarks.find((l) => l.id === id);
    const sq = lm('platsani'), ca = lm('castle'), wm = lm('windmills'), h = world.harbour, dp = world.donkeyPath;
    const az = 104, ax = Math.round(world.XC(az));
    const zz = dp[Math.min(dp.length - 1, 60)];
    TELE = [
      { name: '三蓝顶教堂', en: 'Three Blue Domes · Anastasis', mode: 'fly', p: [ax - 22, P0 + 9, az - 24], t: [ax - 4, P0 + 8, az] },
      { name: '伊亚城堡 · 日落观景点', en: 'Castle of Agios Nikolaos', mode: 'walk', p: [ca.x + 10.5, P0, ca.z], t: [ca.x - 6, P0 + 9, ca.z - 6] },
      { name: '伊亚风车', en: 'Oia Windmills', mode: 'walk', p: [wm.x, P0, wm.z + 1], t: [155.5, P0 + 12, 41.5] },
      { name: '普拉察尼广场', en: 'Panagia Platsani', mode: 'walk', p: [sq.x - 5, P0, sq.z - 6.5], t: [sq.x + 4, P0 + 10, sq.z - 3] },
      { name: '阿穆迪湾码头', en: 'Ammoudi Bay', mode: 'walk', p: [h.pierX0 + 9, world.QUAY, h.pierZ + 0.5], t: [h.qx1 + 28, 46, h.pierZ] },
      { name: '之字形驴道', en: 'Donkey Steps', mode: 'walk', p: [dp[0][0], dp[0][1], dp[0][2]], t: [zz[0], zz[1] - 3, zz[2]] },
      { name: '新卡梅尼火山岛', en: 'Nea Kameni · Volcano', mode: 'fly', p: [94, 34, 152], t: [64, 14, 132] },
      { name: '乘船游览破火山口', en: 'Caldera Cruise', mode: 'boat' }
    ];
  }

  const TOUR = {
    cam: [[62, 40, 10], [84, 58, 56], [88, 66, 100], [92, 58, 150], [82, 46, 198], [42, 52, 176], [18, 64, 112], [40, 52, 50]],
    tgt: [[142, 54, 50], [142, 58, 100], [140, 60, 108], [140, 56, 150], [140, 50, 182], [142, 52, 160], [140, 56, 112], [142, 54, 70]],
    dur: 170
  };
  let tourCam = null, tourTgt = null;
  function initTour() {
    tourCam = new THREE.CatmullRomCurve3(TOUR.cam.map((p) => new V3(p[0], p[1], p[2])), true, 'centripetal');
    tourTgt = new THREE.CatmullRomCurve3(TOUR.tgt.map((p) => new V3(p[0], p[1], p[2])), true, 'centripetal');
  }


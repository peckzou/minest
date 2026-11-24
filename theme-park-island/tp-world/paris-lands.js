/* Minest My World · Disneyland Park Paris — part 2: Disneyland Railroad, Frontierland, Adventureland and
 * Discoveryland, plus the `TPParis.build` entry point that assembles every part with the shared build kit. */
(function (root) {
  'use strict';

  (root.TPParisParts = root.TPParisParts || []).push(function (ctx) {
    const { K, P, Y, WY, hmAt, foot, updaters, rides, interactables, world, pg } = ctx;
    const { S, G, W, T, bldg, sign, tree, lamp } = K;
    const { turret, finial, flag } = ctx;
    const PI = Math.PI, X = P.x, L = P.lake;
    const WOOD = 0x7a5a3a, WOOD2 = 0x5b4030, GOLD = 0xe7b83a, DARK = 0x23262d, WHITE = 0xfbf6ee;

    const hcyl = (s, c, r, len, x, yc, z, seg) => s.cyl(c, r, r, len, x, yc - len / 2, z, seg || 10, PI / 2);
    const wheel = (s, c, r, x, yc, z) => s.cyl(c, r, r, 0.2, x, yc - 0.1, z, 10, 0, PI / 2);

    /* =============== DISNEYLAND RAILROAD (4 stations, elevated through Main Street Station) =============== */
    const R = P.rail, railPts = [];
    for (let i = 0; i < 56; i++) {
      const a = -PI / 2 + (i / 56) * PI * 2;
      let da = Math.abs(a + PI / 2); if (da > PI) da = PI * 2 - da;
      const k = K.clamp(1.7 * (1 - da / 0.62), 0, 1), e = k * k * (3 - 2 * k);
      railPts.push([R.x + Math.cos(a) * R.rx, 0.45 + e * 5.95, R.z + Math.sin(a) * R.rz]);
    }
    const rail = K.track(railPts, {
      gauge: 1.5, rail: { col: 0x3b3f46, r: 0.09 }, tie: { col: WOOD2, step: 1, r: 0.13 },
      sup: { col: 0x8a4b3a, step: 5, r: 0.28 }
    });
    function loco(sc, body, trim) {
      const a = K.asm(0, 0, 0), s = a.S;
      s.box(DARK, 1.9 * sc, 0.5 * sc, 7.6 * sc, 0, 0.5 * sc, 0);
      hcyl(s, body, 0.95 * sc, 4.4 * sc, 0, 1.95 * sc, 1.2 * sc, 12);
      hcyl(s, DARK, 1.0 * sc, 0.9 * sc, 0, 1.95 * sc, 3.6 * sc, 12);
      s.cyl(DARK, 0.5 * sc, 0.28 * sc, 1.7 * sc, 0, 2.8 * sc, 3.5 * sc, 8);
      s.cyl(trim, 0.6 * sc, 0.5 * sc, 0.3 * sc, 0, 4.4 * sc, 3.5 * sc, 8);
      s.sph(trim, 0.5 * sc, 0, 3.0 * sc, 1.6 * sc, 1, 1, 1, 8);
      s.sph(trim, 0.4 * sc, 0, 2.95 * sc, 0.1 * sc, 1, 1, 1, 8);
      s.box(0xb3261e, 2.3 * sc, 2.5 * sc, 2.2 * sc, 0, 1.0 * sc, -2.5 * sc);
      s.box(trim, 2.7 * sc, 0.18 * sc, 2.9 * sc, 0, 3.5 * sc, -2.5 * sc);
      s.box(0xb3261e, 1.2 * sc, 0.5 * sc, 1.6 * sc, 0, 0.5 * sc, 4.3 * sc, 0, 0.5);
      a.G.sph(0xfff2b0, 0.3 * sc, 0, 2.6 * sc, 4.15 * sc, 1, 1, 1, 6);
      for (const z of [-2.4, -0.6, 1.2]) for (const x of [-1, 1]) wheel(s, 0xb3261e, 0.8 * sc, x * 0.95 * sc, 0.8 * sc, z * sc);
      for (const x of [-1, 1]) wheel(s, 0xb3261e, 0.45 * sc, x * 0.95 * sc, 0.45 * sc, 3.0 * sc);
      return a.done();
    }
    function coach(col, roof) {
      const a = K.asm(0, 0, 0), s = a.S;
      s.box(DARK, 1.9, 0.4, 7.2, 0, 0.5, 0);
      s.box(col, 2.3, 1.0, 7.4, 0, 0.9, 0);
      s.box(roof, 2.7, 0.22, 7.9, 0, 3.4, 0);
      s.box(WHITE, 2.1, 0.2, 7.3, 0, 3.2, 0);
      for (const z of [-3.5, -1.2, 1.2, 3.5]) for (const x of [-1.1, 1.1]) s.cyl(GOLD, 0.06, 0.06, 1.4, x, 1.9, z, 4);
      for (const z of [-2.6, -0.9, 0.9, 2.6]) s.box(0x7a4e2d, 1.9, 0.5, 0.35, 0, 1.3, z);
      for (const z of [-2.4, 2.4]) for (const x of [-1, 1]) wheel(s, DARK, 0.45, x * 0.95, 0.45, z);
      return a.done();
    }
    const trainSet = K.trainRide({
      id: 'paris_railroad', name: '巴黎迪士尼铁路 · Disneyland Railroad', land: 'paris_main', track: rail,
      cars: [loco(1, 0x14532d, GOLD), coach(0x14532d, 0xb3261e), coach(0x7c2d12, 0x14532d), coach(0x14532d, 0xb3261e), coach(0x7c2d12, 0x14532d)],
      gap: 8.8, speed: 9, auto: true, lift: 0.1, eye: 2.4, back: 16, u0: 0.03,
      boardPos: { x: X, y: Y, z: P.zStation + 12 }, exitPos: { x: X, y: Y, z: P.zStation + 14, yaw: PI },
      events: [
        [0.02, '🚂 Main Street Station —— 列车驶出酒店后方的高架站台，开始环游巴黎迪士尼乐园！'],
        [0.2, '🏜️ Frontierland Depot —— 左侧是远西河与河心岛上的巨雷山红岩'],
        [0.36, '🌴 探险世界丛林 —— 危险神殿的矿车正冲过 360° 回环'],
        [0.5, '🏰 Fantasyland Station —— 小小世界的钟楼与睡美人城堡的背影'],
        [0.75, '🚀 Discoveryland Station —— 青铜色的太空山与哥伦比亚德巨炮']
      ]
    });
    rides.paris_railroad = trainSet.ride;
    updaters.push((dt, t, ev) => trainSet.update(dt, ev));
    // Frontierland Depot (east), Fantasyland Station (south), Discoveryland Station (west).
    const depot = (a, name, wall, roof) => {
      const dx = R.x + Math.cos(a) * (R.rx - 7), dz = R.z + Math.sin(a) * (R.rz - 7), ry = -a + PI / 2;
      S.box(0x8b5e38, 16, 0.5, 6, dx, Y, dz, ry);
      S.box(wall, 8, 3.6, 3.4, dx, Y + 0.5, dz, ry);
      S.gable(roof, 7, 2.4, 17, dx, Y + 4.4, dz, ry + PI / 2);
      for (const k of [-7, -3.5, 3.5, 7]) S.cyl(WHITE, 0.14, 0.14, 3.9, dx + Math.cos(ry) * k + Math.sin(ry) * 2.4, Y + 0.5, dz - Math.sin(ry) * k + Math.cos(ry) * 2.4, 5);
      sign(name, 7, 0.9, dx - Math.cos(a) * 2.2, Y + 3.3, dz - Math.sin(a) * 2.2, -a - PI / 2, '#f5efe0', '#7c2d12');
      foot(dx, dz, 10);
    };
    depot(0, 'FRONTIERLAND DEPOT', 0xb07a4a, 0x7a3b2a);
    depot(PI / 2, 'FANTASYLAND STATION', 0xf3d9e4, 0x35507a);
    depot(PI, 'DISCOVERYLAND STATION', 0xb39160, 0x3f7f78);

    /* ============================== FRONTIERLAND ============================== */
    // Fort Comstock: log palisade, twin blockhouses and the gate over the plaza spoke.
    const FX = 436, FZ = 946;
    for (const f of [-1, 1]) {
      for (let i = 0; i < 16; i++) {
        const lz = FZ + f * (9 + i * 1.05), lh = 5.4 + (i % 3) * 0.4;
        S.cyl(i % 2 ? WOOD : WOOD2, 0.48, 0.52, lh, FX, Y, lz, 6);
        S.cone(i % 2 ? WOOD : WOOD2, 0.5, 0.9, FX, Y + lh, lz, 6);
      }
      S.box(WOOD2, 5, 6.5, 5, FX, Y, FZ + f * 7);
      S.box(WOOD, 6.6, 3, 6.6, FX, Y + 6.5, FZ + f * 7);
      S.pyr(0x4a3626, 7.6, 3.2, 7.6, FX, Y + 9.5, FZ + f * 7);
      flag(FX, Y + 12.7, FZ + f * 7, f > 0 ? 0xb3261e : 0x1d4ed8);
      foot(FX, FZ + f * 16, 12);
    }
    S.box(WOOD, 1.2, 1.4, 9, FX, Y + 6, FZ);
    sign('FRONTIERLAND', 8, 1.3, FX - 0.7, Y + 6.8, FZ, -PI / 2, '#3b2a1a', '#fbbf24', 'FORT COMSTOCK');
    sign('THUNDER MESA', 8, 1.3, FX + 0.7, Y + 6.8, FZ, PI / 2, '#3b2a1a', '#fbbf24');

    // Thunder Mesa main street (false-front western town along the west shore).
    const western = (z, w, h, col, front, name) => {
      const x = 428;
      S.box(col, 9, h, w, x, Y, z);
      S.box(front, 0.5, h + 2.4, w + 0.2, x + 4.6, Y, z);
      S.box(WHITE, 0.7, 0.4, w + 0.5, x + 4.7, Y + h + 2.4, z);
      S.box(0x8b5e38, 3.4, 0.25, w, x + 6.4, Y, z);
      S.box(WOOD2, 3.6, 0.2, w + 0.3, x + 6.5, Y + 3.5, z, 0, 0, -0.14);
      for (let i = 0; i <= Math.round(w / 3); i++) S.cyl(WOOD, 0.13, 0.13, 3.3, x + 7.9, Y + 0.2, z - w / 2 + 0.3 + i * (w - 0.6) / Math.round(w / 3), 5);
      for (let i = 0; i < Math.floor(w / 2.6); i++) G.box(0xffdf9a, 0.1, 1.3, 0.9, x + 4.9, Y + 4.4, z - w / 2 + 1.5 + i * 2.6);
      S.box(DARK, 0.1, 2.3, 1.3, x + 4.9, Y + 0.3, z);
      sign(name, Math.min(w - 1, 8), 1.1, x + 4.92, Y + h + 1.2, z, PI / 2, '#f3e3c0', '#5b2a12');
      foot(x, z, w * 0.6 + 3);
    };
    western(886, 12, 7.5, 0xb88a5a, 0xd9b27c, 'THE LUCKY NUGGET SALOON');
    western(898, 9, 6.5, 0x9b5a45, 0xbf7a5f, 'THUNDER MESA MERCANTILE');
    western(909, 10, 7, 0x8a8f7a, 0xb4b89e, 'SILVER SPUR STEAKHOUSE');
    western(921, 9, 6, 0xa9764a, 0xcf9a6a, 'TOBIAS NORTON & SONS');
    S.cyl(WOOD, 1.4, 1.4, 5, 428, Y + 7, 880, 8); S.cone(WOOD2, 1.9, 1.6, 428, Y + 12, 880, 8);
    for (const dx of [-1, 1]) for (const dz of [-1, 1]) S.rod(WOOD2, 0.14, 428 + dx * 1.6, Y, 880 + dz * 1.6, 428 + dx * 1.1, Y + 7, 880 + dz * 1.1, 4);

    // Big Thunder Mountain: red-rock buttes on the island in the Rivers of the Far West.
    const RC = [0xc2603d, 0xab4e32, 0xd27a4e, 0xb85a3a];
    const butte = (x, z, r, h, k) => {
      const y = hmAt(x, z) - 0.6, ry = K.rng() * 3;
      S.crag(RC[k % 4], r * 0.62, r, h * 0.55, x, y, z, 7, ry);
      S.crag(RC[(k + 1) % 4], r * 0.42, r * 0.66, h * 0.3, x + 0.4, y + h * 0.5, z - 0.3, 7, ry + 1);
      S.crag(RC[(k + 2) % 4], r * 0.3, r * 0.44, h * 0.2, x + 0.2, y + h * 0.78, z + 0.2, 6, ry + 2);
      S.box(RC[(k + 3) % 4], r * 0.7, 0.5, r * 0.6, x + 0.2, y + h * 0.97, z, ry);
    };
    butte(L.x, L.z, 11.5, 31, 0);
    butte(L.x + 9, L.z - 5, 7, 23, 1);
    butte(L.x - 8, L.z + 5, 6.5, 20, 2);
    for (let i = 0; i < 11; i++) {
      const a = i / 11 * PI * 2 + 0.3, rr = 0.6 + (i % 3) * 0.12;
      butte(L.x + Math.cos(a) * L.ix * rr, L.z + Math.sin(a) * L.iz * rr, 3 + (i % 4) * 0.9, 9 + ((i * 5) % 7) * 1.7, i);
    }
    for (let i = 0; i < 8; i++) {
      const a = i * 0.8 + 0.5;
      tree(i % 2 ? 'cactus' : 'pine', L.x + Math.cos(a) * L.ix * 0.88, L.z + Math.sin(a) * L.iz * 0.88, 0.8, hmAt(L.x + Math.cos(a) * L.ix * 0.88, L.z + Math.sin(a) * L.iz * 0.88));
    }
    const btm = K.track([
      [446, 1.2, 908], [446, 1.2, 918], [447.5, 1.6, 928], [452, 2.8, 936], [460, 6, 943], [470, 10, 948], [486, 13, 951], [504, 16, 950],
      [522, 19, 946], [536, 21, 937], [542, 22.5, 925], [536, 22, 913], [524, 15, 906], [510, 9, 905], [496, 6.5, 911], [489, 8, 922],
      [493, 11.5, 934], [506, 12.5, 941], [521, 10, 939], [529, 7, 929], [524, 6, 917], [511, 8, 912.5], [499, 9.5, 908], [484, 9.5, 903],
      [470, 8.5, 899], [458, 5.5, 897], [449.5, 2.4, 899.5]
    ], {
      gauge: 1.2, rail: { col: 0x4a3a30, r: 0.09 }, tie: { col: WOOD2, step: 1, r: 0.11 },
      sup: { col: WOOD, step: 3, r: 0.2, ground: Y - 3.8 }, pull: 0.5
    });
    const mineCar = (c) => {
      const a = K.asm(0, 0, 0), s = a.S;
      s.box(DARK, 1.3, 0.3, 3.2, 0, 0.35, 0);
      s.box(c, 1.6, 0.9, 3.3, 0, 0.6, 0);
      s.box(WOOD2, 1.7, 0.14, 3.4, 0, 1.5, 0);
      s.box(0x3a2a20, 1.3, 0.5, 0.3, 0, 1.2, -0.8); s.box(0x3a2a20, 1.3, 0.5, 0.3, 0, 1.2, 0.7);
      for (const z of [-1.1, 1.1]) for (const x of [-1, 1]) wheel(s, DARK, 0.32, x * 0.7, 0.32, z);
      return a.done();
    };
    const btmRide = K.trainRide({
      id: 'paris_big_thunder', name: '巨雷山 · Big Thunder Mountain', land: 'paris_frontier', track: btm,
      cars: [loco(0.62, 0x7a2e1f, GOLD), mineCar(0x8a5a36), mineCar(0x7a4a2c), mineCar(0x8a5a36), mineCar(0x7a4a2c)],
      gap: 3.9, speed: 6.5, G: 8.5, vmax: 26, lift: 0.1, eye: 1.7, back: 9,
      boardPos: { x: 442, y: Y, z: 912 }, exitPos: { x: 441, y: Y, z: 916, yaw: -PI / 2 },
      events: [
        [0.1, '⛏️ 矿车驶离雷霆台地站，爬上横跨远西河的木栈桥……'],
        [0.4, '⚡ 登顶巨雷山！整座河心岛与莫莉·布朗号尽收眼底——抓紧了！'],
        [0.62, '🌪️ 冲入红岩峡谷螺旋俯冲，矿洞里的炸药正在倒计时！'],
        [0.9, '🌊 飞越河面木桥，返回雷霆台地矿业公司']
      ],
      doneMsg: '🏁 巨雷山矿车安全进站！这可是全欧洲最长的矿山车。'
    });
    rides.paris_big_thunder = btmRide.ride;
    updaters.push((dt, t, ev) => btmRide.update(dt, ev));
    // Thunder Mesa Mining Co. station shed.
    S.gable(0x7a3b2a, 6, 2.2, 18, 446, Y + 5, 913, 0);
    for (const z of [905, 913, 921]) for (const x of [-2.6, 2.6]) S.cyl(WOOD, 0.18, 0.18, 5, 446 + x, Y, z, 5);
    S.box(0x8b5e38, 2, 0.9, 16, 443.4, Y, 913);
    sign('BIG THUNDER MOUNTAIN', 8, 1.1, 442.9, Y + 4.2, 913, -PI / 2, '#3b2a1a', '#fbbf24', 'THUNDER MESA MINING CO.');

    // The Molly Brown paddle steamer circling the island.
    const boat = K.asm(L.x - 47, WY, L.z), bs = boat.S;
    bs.box(0xf4efe3, 5.6, 1.5, 21, 0, -0.3, 0);
    bs.box(0xf4efe3, 4, 1.5, 4, 0, -0.3, 11.2, PI / 4);
    bs.box(0x8b2a22, 5.9, 0.25, 21.3, 0, 1.2, 0);
    bs.box(0xfbf6ee, 4.6, 2.4, 15, 0, 1.45, -1);
    bs.box(0x8b2a22, 5.6, 0.2, 17, 0, 3.85, -1);
    bs.box(0xfbf6ee, 3.8, 2.2, 11, 0, 4.05, -2);
    bs.box(0x8b2a22, 4.8, 0.2, 13, 0, 6.25, -2);
    bs.box(0xfbf6ee, 2.6, 1.9, 2.8, 0, 6.45, 2.2);
    bs.box(0x8b2a22, 3.2, 0.2, 3.4, 0, 8.35, 2.2);
    for (const x of [-1.1, 1.1]) { bs.cyl(DARK, 0.34, 0.34, 4.2, x, 6.4, 5.4, 8); bs.cyl(0xb3261e, 0.52, 0.34, 0.5, x, 10.4, 5.4, 8); }
    for (let i = -4; i <= 4; i++) for (const x of [-2.75, 2.75]) bs.cyl(WHITE, 0.07, 0.07, 2.4, x, 1.45, -1 + i * 1.8, 4);
    for (let i = -6; i <= 6; i++) boat.G.sph(0xffe9a8, 0.14, i % 2 ? -2.8 : 2.8, 3.7, -1 + i * 1.3, 1, 1, 1, 5);
    const paddle = K.asm(0, 1.0, -11.6);
    for (let i = 0; i < 8; i++) paddle.S.box(0xb3261e, 5, 0.16, 2.6, 0, -0.08, 0, 0, i * PI / 8);
    paddle.done(); boat.grp.add(paddle.grp);
    boat.done();
    updaters.push((dt, t) => {
      const a = PI + t * 0.045, bx = L.x + Math.cos(a) * 47, bz = L.z + Math.sin(a) * 37;
      boat.grp.position.set(bx, WY + Math.sin(t * 1.1) * 0.05, bz);
      boat.grp.rotation.y = Math.atan2(-Math.sin(a) * 47, Math.cos(a) * 37);
      paddle.grp.rotation.x -= dt * 2.2;
    });
    // Riverboat landing.
    bldg(0xf2ead8, 12, 5, 6, 498, Y, 986, 0, 3, 5);
    S.gable(0x7a3b2a, 7.4, 2.6, 13, 498, Y + 5, 986, PI / 2);
    S.box(0x8b5e38, 10, 0.3, 6, 498, Y - 0.2, 980);
    sign('THUNDER MESA RIVERBOAT LANDING', 9, 1, 498, Y + 3.8, 989.1, 0, '#f3e3c0', '#5b2a12');
    foot(498, 986, 9);

    // Phantom Manor: the derelict Second Empire mansion brooding on its hill above the river.
    const MX = P.manor.x, MZ = P.manor.z, my = hmAt(MX, MZ), MW = 0x8c8377, MR = 0x38353c, GH = 0xb9f5a6;
    bldg(MW, 17, 9, 11, MX, my, MZ, 0, 3.4, 4.5);
    S.box(0x6f675d, 17.8, 0.5, 11.8, MX, my + 9, MZ);
    S.box(MR, 16, 3.6, 10, MX, my + 9.5, MZ);
    S.box(0x2a282d, 13, 0.3, 7, MX, my + 13.1, MZ);
    for (let i = -3; i <= 3; i++) S.cone(DARK, 0.16, 1, MX + i * 2, my + 13.4, MZ + 3.4, 4);
    S.box(MW, 5.4, 16.5, 5.4, MX, my, MZ + 4.6);
    S.box(0x6f675d, 6.2, 0.5, 6.2, MX, my + 16.5, MZ + 4.6);
    S.pyr(MR, 6, 5.2, 6, MX, my + 17, MZ + 4.6);
    S.box(MR, 2.4, 1, 2.4, MX, my + 21.4, MZ + 4.6);
    for (const [ax, az] of [[-1, -1], [1, -1], [-1, 1], [1, 1]]) S.cyl(DARK, 0.05, 0.05, 1.4, MX + ax * 1.1, my + 22.4, MZ + 4.6 + az * 1.1, 4);
    S.cyl(DARK, 0.06, 0.06, 2.6, MX, my + 22.4, MZ + 4.6, 4);
    for (const sx of [-1, 1]) {
      S.box(MW, 5, 11.5, 5, MX + sx * 7, my, MZ - 2);
      S.pyr(MR, 5.8, 4.4, 5.8, MX + sx * 7, my + 11.5, MZ - 2);
      G.box(GH, 1, 1.9, 0.12, MX + sx * 5.2, my + 5.6, MZ + 5.58);
      S.box(0x6f675d, 7.6, 0.25, 3, MX + sx * 5, my + 3.9, MZ + 6.9);
      for (let i = 0; i < 3; i++) S.cyl(0xb5ada0, 0.16, 0.16, 3.9, MX + sx * (2.4 + i * 2.8), my, MZ + 8.1, 5);
      // Dead trees and the wrought-iron gate piers.
      const tx = MX + sx * 13, tz = MZ + 9, ty = hmAt(tx, tz);
      S.cyl(0x3d342c, 0.2, 0.42, 6, tx, ty, tz, 5);
      for (let b = 0; b < 5; b++) S.rod(0x3d342c, 0.1, tx, ty + 3 + b * 0.6, tz, tx + Math.cos(b * 1.4) * 2.4, ty + 5 + b * 0.7, tz + Math.sin(b * 1.4) * 2.4, 4);
      S.box(0x5f5a55, 1.2, 3.4, 1.2, MX + sx * 5.5, Y, MZ + 25);
      G.sph(GH, 0.3, MX + sx * 5.5, Y + 3.8, MZ + 25, 1, 1, 1, 6);
    }
    G.box(GH, 1.2, 2.2, 0.12, MX, my + 12, MZ + 7.36);
    G.box(0xffd27a, 1.2, 2.4, 0.12, MX, my + 5.8, MZ + 7.36);
    S.box(DARK, 1.8, 2.8, 0.14, MX, my, MZ + 7.36);
    sign('PHANTOM MANOR', 7, 1, MX, Y + 4.4, MZ + 25, 0, '#1f2a24', '#b9f5a6');
    // Boot Hill cemetery.
    for (let i = 0; i < 9; i++) {
      const gx = MX - 17 + (i % 3) * 2.4, gz = MZ + 12 + Math.floor(i / 3) * 2.6;
      S.box(0x9a948c, 0.9, 1.1 + (i % 2) * 0.3, 0.25, gx, hmAt(gx, gz), gz, (i % 3 - 1) * 0.15);
    }
    foot(MX, MZ, 16);
    interactables.push({ id: 'paris_manor', name: '幽灵庄园大门', x: MX, y: Y, z: MZ + 24, msg: '👻 铁门吱呀作响……幽灵新娘梅兰妮的身影在塔楼窗后一闪而过，空气中回荡着幻影的笑声。' });

    /* ============================== ADVENTURELAND ============================== */
    // Adventureland Bazaar: Agrabah domes and minarets framing the gateway.
    const BZ = 0xe3c58f, BZ2 = 0xcfa86c, TEAL = 0x2f9c95;
    const bax = 430, baz = 987, dxn = 0.749, dzn = 0.663, bry = -Math.atan2(dzn, dxn);
    for (const f of [-1, 1]) {
      const bx = bax - dzn * f * 14.5, bz = baz + dxn * f * 14.5;
      S.box(BZ, 16, 8, 11, bx, Y, bz, bry);
      S.box(BZ2, 16.6, 0.6, 11.6, bx, Y + 8, bz, bry);
      for (let i = -3; i <= 3; i++) S.box(BZ, 1.2, 1, 0.6, bx + dxn * i * 2.2 + dzn * f * 5.4, Y + 8.6, bz + dzn * i * 2.2 - dxn * f * 5.4, bry);
      S.cyl(BZ2, 3.6, 3.8, 2, bx, Y + 8.6, bz, 10);
      S.sph(f > 0 ? TEAL : GOLD, 3.7, bx, Y + 12.4, bz, 1, 1.12, 1, 12);
      S.cone(f > 0 ? TEAL : GOLD, 1.3, 2.8, bx, Y + 15.4, bz, 10);
      finial(bx, Y + 18.2, bz);
      const mx = bx + dxn * f * 0 - dzn * f * -7.2 + dxn * 7 * f, mz = bz + dxn * f * -7.2 + dzn * 7 * f;
      S.cyl(BZ, 1.1, 1.3, 15, mx, Y, mz, 8);
      S.cyl(BZ2, 1.7, 1.2, 0.8, mx, Y + 14.4, mz, 8);
      S.sph(f > 0 ? GOLD : TEAL, 1.3, mx, Y + 16.2, mz, 1, 1.3, 1, 8);
      finial(mx, Y + 17.8, mz, 0.8);
      const px = bax - dzn * f * 6.2, pz = baz + dxn * f * 6.2;
      S.box(BZ, 2.4, 9, 2.4, px, Y, pz, bry);
      S.sph(TEAL, 1.2, px, Y + 9.7, pz, 1, 1.2, 1, 8);
      for (let i = 0; i < 3; i++) S.box([0xb3261e, 0x7e22ce, 0x15803d][i], 2.6, 0.12, 3, bx - dzn * f * -6.8 + dxn * (i - 1) * 4.6, Y + 3.2, bz + dxn * f * -6.8 + dzn * (i - 1) * 4.6, bry, f * 0.3);
      foot(bx, bz, 12);
    }
    S.box(BZ, 12.4, 2.6, 2.4, bax, Y + 9, baz, bry + PI / 2);
    S.tor(BZ2, 5, 0.5, bax, Y + 4.2, baz, 0, bry + PI / 2, 0, PI, 12);
    S.sph(GOLD, 1.6, bax, Y + 12.6, baz, 1, 1.25, 1, 10);
    finial(bax, Y + 14.4, baz);
    sign('ADVENTURELAND', 8, 1.2, bax - dxn * 1.3, Y + 10.2, baz - dzn * 1.3, bry - PI / 2, '#3a2a14', '#fbbf24', 'ADVENTURELAND BAZAAR');

    // Adventure Isle: Skull Rock.
    const IX = P.isle.x + 7, IZ = P.isle.z, SK = 0xb9b1a3, SK2 = 0x9c9488;
    S.crag(SK2, 6.5, 9, 4, IX, Y - 1, IZ, 8, 0.4);
    S.sph(SK, 6.4, IX, Y + 8, IZ, 1.05, 1.1, 1, 12);
    S.box(SK, 7.4, 3.6, 6, IX, Y + 1.4, IZ - 0.6);
    for (const sx of [-1, 1]) {
      S.sph(DARK, 1.9, IX + sx * 2.6, Y + 8.4, IZ - 5.2, 1, 1.1, 0.6, 8);
      G.sph(0xff9a3c, 0.4, IX + sx * 2.6, Y + 8.2, IZ - 5.4, 1, 1, 1, 6);
      S.crag(SK2, 1.2, 2.6, 6 + sx, IX + sx * 8.5, Y - 1, IZ + 1.5, 6, sx);
    }
    S.cone(DARK, 0.9, 1.8, IX, Y + 5, IZ - 6.1, 4);
    S.box(DARK, 5.2, 1.5, 0.6, IX, Y + 2.6, IZ - 3.5);
    for (let i = -3; i <= 3; i++) S.box(0xe9e2d2, 0.6, 1.1, 0.5, IX + i * 0.75, Y + 3.2 - (i % 2 ? 0.5 : 0), IZ - 3.75);
    W.box(0xd6f1ff, 2, 4.6, 0.3, IX, WY, IZ - 4.1);
    foot(IX, IZ, 12);
    // Captain Hook's pirate galleon.
    const ship = K.asm(P.isle.x - 15, WY, IZ + 4), ss = ship.S, HULL = 0x6a4126;
    ship.grp.rotation.y = PI / 2 + 0.12;
    ss.box(HULL, 5.2, 3.4, 17, 0, -0.6, 0);
    ss.box(HULL, 3.7, 3.4, 3.7, 0, -0.6, 8.6, PI / 4);
    ss.box(GOLD, 5.4, 0.25, 17.2, 0, 2.3, 0);
    ss.box(0x8f2a22, 5.6, 2.8, 5.4, 0, 2.6, -6);
    ss.box(GOLD, 5.8, 0.25, 5.6, 0, 5.4, -6);
    ss.box(0x8f2a22, 4.6, 1.4, 3.6, 0, 2.6, 6);
    for (const x of [-1.6, 0, 1.6]) ship.G.box(0xffd98a, 0.9, 1, 0.12, x, 3.4, -8.75);
    ss.rod(HULL, 0.16, 0, 3.4, 9, 0, 5.6, 14, 5);
    [[4.5, 13], [-0.5, 16], [-5.5, 11]].forEach(([mz, mh], i) => {
      ss.cyl(0x4a3020, 0.22, 0.3, mh, 0, 2.6, mz, 6);
      ss.box(0x4a3020, 6.4, 0.18, 0.18, 0, 2.6 + mh * 0.82, mz);
      ss.box(0xf2ead8, 5.8, mh * 0.38, 0.14, 0, 2.6 + mh * 0.42, mz + 0.3);
      if (i < 2) { ss.box(0x4a3020, 5, 0.16, 0.16, 0, 2.6 + mh * 0.4, mz); ss.box(0xf2ead8, 4.6, mh * 0.2, 0.14, 0, 2.6 + mh * 0.18, mz + 0.3); }
      ss.cyl(0x4a3020, 0.7, 0.5, 0.6, 0, 2.6 + mh * 0.86, mz, 8);
    });
    ss.box(0x111111, 1.5, 0.9, 0.05, 0.8, 19.2, -0.5);
    ship.done();
    foot(P.isle.x - 15, IZ + 4, 10);
    // La Cabane des Robinson: the giant banyan treehouse.
    const RX = 548, RZ = 1038;
    S.cyl(0x6b4a2f, 2.6, 4.6, 19, RX, Y, RZ, 9);
    for (let i = 0; i < 7; i++) S.crag(0x5b3f2a, 0.5, 1.6, 4.5, RX + Math.cos(i * 0.9) * 4.6, Y - 0.5, RZ + Math.sin(i * 0.9) * 4.6, 5, i, Math.sin(i * 0.9) * -0.3, Math.cos(i * 0.9) * 0.3);
    for (let i = 0; i < 9; i++) {
      const a = i * 0.7, rr = i === 0 ? 0 : 6 + (i % 3) * 2;
      S.ico(i % 2 ? 0x2f7d3b : 0x3f9447, 5.2 - (i % 3) * 0.6, RX + Math.cos(a) * rr, Y + 19 + (i % 3) * 1.6, RZ + Math.sin(a) * rr, 1.2, 0.8, 1.2);
      if (i) S.rod(0x6b4a2f, 0.45, RX, Y + 14, RZ, RX + Math.cos(a) * rr, Y + 18.5, RZ + Math.sin(a) * rr, 5);
    }
    [[5, 0.4, 6], [-4.6, 2.6, 10], [3.6, 4.4, 14]].forEach(([rr, a, hh]) => {
      const hx = RX + Math.cos(a) * rr, hz = RZ + Math.sin(a) * rr;
      S.cyl(0x8b5e38, 3, 3, 0.3, hx, Y + hh, hz, 8);
      S.cyl(0xb88a5a, 1.9, 1.9, 2.2, hx, Y + hh + 0.3, hz, 8);
      S.cone(0xc9a35a, 2.9, 2, hx, Y + hh + 2.5, hz, 8);
      S.rod(0x8b5e38, 0.12, hx, Y + hh, hz, RX + Math.cos(a + 1.3) * 6, Y + hh - 4, RZ + Math.sin(a + 1.3) * 6, 4);
    });
    sign('LA CABANE DES ROBINSON', 7, 0.9, RX - 6.5, Y + 2.8, RZ, -PI / 2, '#3a2a14', '#fde68a');
    foot(RX, RZ, 9);
    // Pirates of the Caribbean: the Spanish colonial fortress.
    const PX = 470, PZ = 1092, FORT = 0xcdbb9b;
    S.box(FORT, 30, 8, 10, PX, Y, PZ);
    for (let i = -7; i <= 7; i++) S.box(FORT, 1.2, 1, 0.8, PX + i * 2, Y + 8, PZ - 4.6);
    S.box(0xa8553d, 12, 0.4, 5, PX - 6, Y + 5.2, PZ - 7, 0, -0.28);
    for (let i = 0; i < 4; i++) S.cyl(0x6b4a2f, 0.18, 0.18, 4.6, PX - 11 + i * 3.4, Y, PZ - 9, 5);
    turret(PX + 13, Y, PZ - 4, 4, 13, 4, FORT, 0xa8553d, 10);
    flag(PX + 13, Y + 17, PZ - 4, 0x111111);
    S.box(0x3a2a20, 3.4, 4.4, 0.4, PX + 3, Y, PZ - 5.1);
    S.tor(0xa89878, 1.7, 0.3, PX + 3, Y + 4.4, PZ - 5.15, 0, 0, 0, PI, 10);
    for (const cx of [-10, 9]) { hcyl(S, DARK, 0.3, 2.4, PX + cx, Y + 8.6, PZ - 4.6, 6); }
    sign('PIRATES OF THE CARIBBEAN', 9, 1.1, PX - 5, Y + 6.9, PZ - 5.1, PI, '#2a1c12', '#fbbf24');
    foot(PX, PZ, 18);

    // Indiana Jones et le Temple du Péril: ruined jungle temple wrapped by the looping mine-cart coaster.
    const TPX = 568, TPZ = 1004, TS = [0xa3967d, 0x8f836c, 0xb3a68b];
    for (let i = 0; i < 5; i++) {
      const w = 20 - i * 3.6;
      S.box(TS[i % 3], w, 3, w, TPX, Y + i * 3, TPZ);
      if (i < 4) for (const [ax, az] of [[-1, -1], [1, -1], [-1, 1], [1, 1]]) S.box(TS[(i + 1) % 3], 1.4, 1.2, 1.4, TPX + ax * (w / 2 - 0.7), Y + i * 3 + 3, TPZ + az * (w / 2 - 0.7));
    }
    S.box(TS[1], 4, 15.2, 2.4, TPX - 9.6, Y - 0.2, TPZ, 0, 0, -0.62);
    for (const [ax, az] of [[-1.6, -1.6], [1.6, -1.6], [-1.6, 1.6], [1.6, 1.6]]) S.cyl(TS[2], 0.4, 0.5, 4, TPX + ax, Y + 15, TPZ + az, 6);
    S.box(TS[1], 5, 0.8, 5, TPX, Y + 19, TPZ);
    G.sph(0xffb020, 0.7, TPX, Y + 16.4, TPZ, 1, 1, 1, 8);
    for (let i = 0; i < 6; i++) S.cyl(TS[i % 3], 0.6, 0.7, 3 + (i % 3) * 1.6, 546 + i * 1.6, Y, 1001 - (i % 2) * 1.5, 6);
    const indy = K.track([
      [547, 1.5, 1017], [557, 1.5, 1017.5], [569, 3.5, 1018], [579, 8, 1014], [584.5, 13, 1004], [581, 17, 994], [571, 18.5, 989.5],
      [563, 9, 989.2], [557.5, 3.6, 989], [551.2, 9, 989.5], [555.5, 14.6, 990.1], [560.2, 9, 990.7], [556, 3.6, 991.3],
      [549, 3.4, 992.5], [544.5, 3, 998], [543.5, 2.2, 1007], [544.5, 1.6, 1014]
    ], {
      gauge: 1.1, rail: { col: 0x7a2a22, r: 0.09 }, tie: { col: 0x3a2a20, step: 1, r: 0.1 },
      sup: { col: 0x6b4a2f, step: 2, r: 0.14 }, pull: 0.06
    });
    const indyRide = K.trainRide({
      id: 'paris_indiana', name: '印第安纳琼斯与危险神殿 · Temple du Péril', land: 'paris_adventure', track: indy,
      cars: [mineCar(0x7a2a22), mineCar(0x8a5a36), mineCar(0x7a2a22)],
      gap: 3.7, speed: 6, G: 9, vmax: 22, lift: 0.1, eye: 1.6, back: 8,
      boardPos: { x: 546, y: Y, z: 1012 }, exitPos: { x: 544, y: Y, z: 1009, yaw: PI / 2 },
      events: [
        [0.12, '🗿 矿车沿着考古脚手架爬升，绕上危险神殿的塔顶……'],
        [0.42, '🔥 俯冲！前方是迪士尼史上第一个 360° 垂直回环！'],
        [0.8, '🐍 穿出丛林遗迹，返回考古营地']
      ],
      doneMsg: '🏁 危险神殿探险完成！帽子还在头上吗？'
    });
    rides.paris_indiana = indyRide.ride;
    updaters.push((dt, t, ev) => indyRide.update(dt, ev));
    sign('INDIANA JONES™ ET LE TEMPLE DU PÉRIL', 9, 1.1, 546, Y + 4.4, 1003.6, PI, '#2a1c12', '#fbbf24');
    foot(TPX, TPZ, 22);

    /* ============================== DISCOVERYLAND ============================== */
    const SX = P.space.x, SZ = P.space.z, BRZ = 0xa9763b, BRZ2 = 0x8a5c2c, VERD = 0x4f9a8c, COP = 0xc98a4a;
    // Space Mountain: ribbed bronze cone, crown dome and the Columbiad cannon.
    S.cyl(BRZ2, 30, 31, 3, SX, Y, SZ, 28);
    S.cyl(BRZ, 12.4, 29.4, 20, SX, Y + 3, SZ, 28);
    S.cyl(VERD, 13.2, 13.2, 1.2, SX, Y + 22.4, SZ, 28);
    S.dome(COP, 12.5, SX, Y + 23.4, SZ, 0.76, 24);
    S.cyl(VERD, 2.4, 3.4, 2.4, SX, Y + 32.4, SZ, 10);
    S.cone(GOLD, 1.5, 6, SX, Y + 34.8, SZ, 8);
    finial(SX, Y + 40.8, SZ, 1.4);
    for (let i = 0; i < 28; i++) {
      const a = i / 28 * PI * 2;
      S.rod(i % 2 ? GOLD : VERD, i % 2 ? 0.2 : 0.34, SX + Math.cos(a) * 29.8, Y + 3, SZ + Math.sin(a) * 29.8, SX + Math.cos(a) * 12.9, Y + 23, SZ + Math.sin(a) * 12.9, 5);
      if (i % 2) G.sph(0xffd98a, 0.32, SX + Math.cos(a) * 30.6, Y + 3.4, SZ + Math.sin(a) * 30.6, 1, 1, 1, 6);
      if (i % 4 === 0) S.rod(GOLD, 0.16, SX + Math.cos(a) * 12.4, Y + 23.6, SZ + Math.sin(a) * 12.4, SX, Y + 33, SZ, 4);
    }
    S.tor(VERD, 21.4, 0.45, SX, Y + 12.5, SZ, PI / 2, 0, 0, PI * 2, 32);
    // The Columbiad: breech at the foot of the mountain, muzzle beside the crown.
    const c0 = [SX + 40, Y + 3.4, SZ], c1 = [SX + 13, Y + 29.2, SZ];
    S.rod(BRZ2, 3.1, c0[0], c0[1], c0[2], c1[0], c1[1], c1[2], 14);
    for (let i = 0; i <= 6; i++) {
      const k = i / 6, bx = c0[0] + (c1[0] - c0[0]) * k, by = c0[1] + (c1[1] - c0[1]) * k;
      const k2 = k + 0.03, bx2 = c0[0] + (c1[0] - c0[0]) * k2, by2 = c0[1] + (c1[1] - c0[1]) * k2;
      S.rod(i % 2 ? GOLD : VERD, 3.5, bx, by, SZ, bx2, by2, SZ, 14);
    }
    S.sph(BRZ2, 4.2, c0[0] + 1.6, c0[1] - 1.4, SZ, 1, 1, 1, 12);
    S.rod(GOLD, 3.7, c1[0], c1[1], SZ, c1[0] - 1.4, c1[1] + 1.35, SZ, 14);
    for (const f of [-1, 1]) {
      S.rod(VERD, 0.5, SX + 30, Y, SZ + f * 5.5, SX + 27, Y + 14.5, SZ + f * 3, 6);
      S.rod(VERD, 0.5, SX + 22, Y + 6, SZ + f * 6, SX + 20.5, Y + 21, SZ + f * 3, 6);
      S.cyl(GOLD, 1.6, 1.6, 0.6, SX + 41.5, Y + 0.6, SZ + f * 4.6, 12, PI / 2);
    }
    // Star-field interior so riders launch into deep space.
    const inner = new T.MeshBasicMaterial({ color: 0x04060e, side: T.BackSide });
    const hull = new T.Mesh(new T.CylinderGeometry(11.8, 28.8, 20, 28, 1, true), inner); hull.position.set(SX, Y + 13, SZ); pg.add(hull);
    const cap = new T.Mesh(new T.SphereGeometry(12, 20, 8, 0, PI * 2, 0, PI / 2), inner); cap.position.set(SX, Y + 23, SZ); cap.scale.y = 0.76; pg.add(cap);
    const sp = new Float32Array(900 * 3);
    for (let i = 0; i < 900; i++) {
      const h = K.rng() * 27, rm = h < 20 ? 28 - h * 0.83 : 11.5 * Math.sqrt(Math.max(0.02, 1 - Math.pow((h - 20) / 9, 2))), a = K.rng() * PI * 2, rr = rm * (0.82 + K.rng() * 0.16);
      sp[i * 3] = SX + Math.cos(a) * rr; sp[i * 3 + 1] = Y + 3.4 + h; sp[i * 3 + 2] = SZ + Math.sin(a) * rr;
    }
    const sg = new T.BufferGeometry(); sg.setAttribute('position', new T.BufferAttribute(sp, 3));
    pg.add(new T.Points(sg, new T.PointsMaterial({ color: 0xdfe9ff, size: 0.34, sizeAttenuation: true })));
    G.sph(0xffb347, 2.2, SX - 6, Y + 15, SZ + 6, 1, 1, 1, 12);
    G.sph(0x9bd0ff, 1.3, SX + 9, Y + 10, SZ - 12, 1, 1, 1, 10);
    G.sph(0xf5f1e0, 3, SX - 2, Y + 22, SZ - 2, 1, 1, 1, 14);
    G.tor(0xffe2a0, 3.4, 0.12, SX - 6, Y + 15, SZ + 6, 1.2, 0, 0.3, PI * 2, 20);
    const sm = K.track([
      [48, 1.5, 11], [47.5, 1.5, 4], [43, 2.4, 0.2], [35, 8.6, 0], [25, 18.1, 0], [15.5, 27.2, 0], [8, 29, -3.5], [0, 28, -8],
      [-8, 26, -4], [-9, 24, 5], [-2, 22, 10], [8, 20, 8], [12, 18, -2], [6, 16, -11], [-6, 14, -13], [-15, 12, -5], [-15, 10, 8],
      [-5, 8, 16], [9, 7, 16], [19, 6, 8], [21, 5, -6], [12, 4.5, -18], [-4, 4, -22], [-18, 4, -14], [-23, 3.5, 2], [-16, 3, 17],
      [0, 3, 24], [16, 2.5, 22], [30, 2, 18], [42, 1.5, 15.5]
    ].map((p) => [SX + p[0], p[1], SZ + p[2]]), { gauge: 1.2, rail: { col: COP, r: 0.1 }, tie: { col: BRZ2, step: 2, r: 0.1 }, pull: 0.35 });
    const rocket = (c) => {
      const a = K.asm(0, 0, 0), s = a.S;
      s.box(BRZ2, 1.5, 0.4, 3.4, 0, 0.3, 0);
      hcyl(s, c, 0.85, 3.2, 0, 1.0, 0, 10);
      s.sph(GOLD, 0.75, 0, 1.0, 1.7, 1, 1, 1.7, 8); s.box(c, 1.3, 0.9, 1.4, 0, 0.9, -0.2);
      s.box(DARK, 1.2, 0.5, 1.8, 0, 1.5, -0.2);
      for (const x of [-1, 1]) s.box(VERD, 0.12, 0.9, 1.4, x * 0.95, 0.7, -1.3, 0, -0.4);
      a.G.sph(0x7dd3fc, 0.3, 0, 1.0, -1.7, 1, 1, 1, 6);
      return a.done();
    };
    const smRide = K.trainRide({
      id: 'paris_space_mountain', name: '太空山 · Space Mountain: De la Terre à la Lune', land: 'paris_discovery', track: sm,
      cars: [rocket(COP), rocket(BRZ), rocket(COP), rocket(BRZ)],
      gap: 3.8, speed: 12, G: 7, vmax: 27, lift: 0.1, eye: 1.6, back: 8,
      boardPos: { x: SX + 50, y: Y, z: SZ + 10 }, exitPos: { x: SX + 52, y: Y, z: SZ + 8, yaw: -PI / 2 },
      events: [
        [0.03, '🚀 列车滑入哥伦比亚德巨炮炮膛……3、2、1——点火！'],
        [0.17, '🌙 冲出炮口，进入太空山穹顶深空！前方是月球与小行星带'],
        [0.55, '☄️ 螺旋俯冲穿越星云——左侧是带光环的行星！'],
        [0.92, '🛬 重返大气层，滑回发现世界站台']
      ],
      doneMsg: '🏁 「从地球到月球」航行完成！儒勒·凡尔纳向你致敬。'
    });
    rides.paris_space_mountain = smRide.ride;
    updaters.push((dt, t, ev) => smRide.update(dt, ev));
    S.box(BRZ2, 8, 0.4, 14, SX + 49, Y + 4.2, SZ + 9);
    for (const [ax, az] of [[-3.6, -6.4], [3.6, -6.4], [-3.6, 6.4], [3.6, 6.4]]) S.cyl(VERD, 0.22, 0.26, 4.2, SX + 49 + ax, Y, SZ + 9 + az, 6);
    sign('SPACE MOUNTAIN', 8, 1.3, SX + 53.1, Y + 5.6, SZ + 9, PI / 2, '#20160c', '#e7b83a', 'DE LA TERRE À LA LUNE');
    foot(SX, SZ, 33);

    // Orbitron — Machines Volantes: da Vinci-style orrery of bronze planets with circling rockets.
    const OX = 344, OZ = 972;
    S.cyl(BRZ2, 7.6, 8, 0.8, OX, Y, OZ, 16);
    S.cyl(VERD, 1.2, 2.2, 9, OX, Y + 0.8, OZ, 10);
    S.sph(GOLD, 2.3, OX, Y + 11.6, OZ, 1, 1, 1, 12);
    S.cone(COP, 0.8, 3, OX, Y + 13.6, OZ, 8);
    const orb = K.asm(OX, Y + 11.6, OZ), orb2 = K.asm(OX, Y + 5.2, OZ);
    [[4.2, 0.5, 1.0, COP], [5.6, -0.4, 0.8, 0xb3261e], [7, 0.25, 1.3, VERD], [3.2, -0.8, 0.6, WHITE]].forEach(([rr, tilt, pr, c], i) => {
      orb.S.tor(GOLD, rr, 0.09, 0, 0, 0, PI / 2 + tilt, 0, 0, PI * 2, 24);
      orb.S.sph(c, pr, Math.cos(i * 1.7) * rr, Math.sin(i * 1.7) * rr * Math.sin(-tilt), Math.sin(i * 1.7) * rr * Math.cos(tilt), 1, 1, 1, 8);
    });
    for (let i = 0; i < 10; i++) {
      const a = i / 10 * PI * 2, rx = Math.cos(a) * 7.4, rz = Math.sin(a) * 7.4;
      orb2.S.rod(BRZ, 0.12, 0, 0.6, 0, rx, 0, rz, 4);
      orb2.S.sph([COP, VERD, 0xb3261e][i % 3], 0.6, rx, 0, rz, 1, 0.9, 2.1, 8);
      orb2.S.box(GOLD, 1.8, 0.08, 0.5, rx, 0, rz, -a);
    }
    orb.done(); orb2.done();
    updaters.push((dt, t) => { orb.grp.rotation.y += dt * 0.35; orb2.grp.rotation.y -= dt * 0.8; orb2.grp.position.y = Y + 5.2 + Math.sin(t * 0.5) * 1.6; });
    sign('ORBITRON', 5, 0.9, OX, Y + 2.4, OZ + 8.4, 0, '#20160c', '#e7b83a', 'MACHINES VOLANTES');
    foot(OX, OZ, 10);

    // Les Mystères du Nautilus: Captain Nemo's submarine moored in the lagoon.
    const naut = K.asm(P.lagoon.x, WY, P.lagoon.z), ns = naut.S, NI = 0x5c5248, NI2 = 0x463f38;
    ns.sph(NI, 2.6, 0, 0.2, 0, 4.4, 1, 1.15, 12);
    ns.sph(NI2, 1, 12.4, 0.2, 0, 3, 0.6, 0.6, 6);
    for (let i = -7; i <= 7; i++) ns.cone(NI2, 0.5, 1.5 - Math.abs(i) * 0.06, i * 1.25, 2.3 - Math.abs(i) * 0.12, 0, 4);
    ns.box(NI2, 4.4, 1.5, 2.4, 2.5, 2.3, 0); ns.box(NI, 3, 0.9, 1.8, 2.5, 3.8, 0);
    ns.box(NI2, 3.4, 3, 0.2, -10.8, 0.4, 0); ns.box(NI2, 2.6, 0.2, 3.2, -10.6, 0.4, 0);
    for (const f of [-1, 1]) {
      naut.G.sph(0xffd24a, 0.85, 6.2, 1.0, f * 2.25, 1, 1, 0.5, 8);
      naut.G.sph(0xffd24a, 0.5, 3.4, 4.2, f * 0.95, 1, 1, 0.4, 6);
      for (let i = -3; i <= 3; i++) ns.sph(GOLD, 0.16, i * 2.4, 1.3, f * 2.55, 1, 1, 1, 5);
    }
    naut.grp.rotation.y = 0.15; naut.done();
    updaters.push((dt, t) => { naut.grp.position.y = WY + Math.sin(t * 0.7) * 0.07; });
    S.cyl(BRZ2, 2.4, 2.8, 5, P.lagoon.x + 25, Y, P.lagoon.z - 6, 10);
    S.dome(VERD, 2.9, P.lagoon.x + 25, Y + 5, P.lagoon.z - 6, 0.8, 10);
    G.sph(0xffd98a, 0.6, P.lagoon.x + 25, Y + 7.8, P.lagoon.z - 6, 1, 1, 1, 8);
    sign('LES MYSTÈRES DU NAUTILUS', 7, 0.9, P.lagoon.x, Y + 2.6, P.lagoon.z - 15, PI, '#20160c', '#e7b83a');

    // Videopolis and the Hyperion airship moored above its entrance.
    const VX = 262, VZ = 1046;
    bldg(0x9a7a4a, 34, 12, 16, VX, Y, VZ + 6, 0, 4.2, 6);
    S.box(VERD, 35, 0.7, 17, VX, Y + 12, VZ + 6);
    S.cyl(BRZ, 17, 17, 1, VX, Y + 12.7, VZ + 6, 20);
    for (let i = -3; i <= 3; i++) S.cyl(VERD, 0.4, 0.5, 9, VX + i * 4.6, Y, VZ - 3.4, 8);
    S.box(BRZ2, 30, 0.6, 3, VX, Y + 9, VZ - 3.2);
    const air = K.asm(VX, Y + 19, VZ - 8), as = air.S;
    as.sph(0xc2412d, 3.6, 0, 0, 0, 3.4, 1, 1, 14);
    for (let i = -3; i <= 3; i++) as.tor(0xf3d9a0, 3.65 * Math.sqrt(1 - Math.pow(i / 3.6, 2)), 0.14, i * 3.2, 0, 0, 0, PI / 2, 0, PI * 2, 16);
    as.sph(GOLD, 0.9, 12.2, 0, 0, 1.6, 1, 1, 8);
    as.box(BRZ2, 9, 1.6, 2.2, 0.5, -5.8, 0); as.box(0xf3d9a0, 9.4, 0.2, 2.6, 0.5, -4.2, 0);
    for (const x of [-3.5, 0.5, 4.5]) for (const f of [-1, 1]) as.rod(GOLD, 0.06, x, -4.2, f * 1, x, -3.2, f * 1.6, 4);
    as.box(0xc2412d, 0.2, 3.4, 4.4, -11.4, -1.7, 0); as.box(0xc2412d, 3.6, 0.2, 5.4, -11.2, 0, 0);
    for (const f of [-1, 1]) { as.rod(BRZ2, 0.12, -1, -5, f * 1.1, -1.5, -4.6, f * 3.4, 4); as.box(GOLD, 0.1, 2.6, 0.3, -1.5, -5.9, f * 3.5); }
    air.grp.rotation.y = -0.2; air.done();
    updaters.push((dt, t) => { air.grp.position.y = Y + 19 + Math.sin(t * 0.4) * 0.5; air.grp.rotation.z = Math.sin(t * 0.3) * 0.03; });
    sign('VIDEOPOLIS', 9, 1.4, VX, Y + 10.2, VZ - 4.8, PI, '#20160c', '#e7b83a', 'CAFÉ HYPÉRION');
    foot(VX, VZ + 6, 22);

    // Star Tours with the X-wing, and Buzz Lightyear Laser Blast.
    const STX = 238, STZ = 898;
    bldg(0x8fa3b8, 26, 10, 18, STX, Y, STZ, 0, 4.4, 5);
    S.box(0x5b6f86, 27, 0.6, 19, STX, Y + 10, STZ);
    S.cyl(0x5b6f86, 0.5, 0.8, 9, STX + 6, Y, STZ + 15, 8);
    const xw = K.asm(STX + 6, Y + 10.4, STZ + 15), xs = xw.S;
    xs.box(0xe5e7eb, 1.1, 1, 8, 0, -0.5, 0); xs.cone(0xe5e7eb, 0.55, 2.6, 0, -1.3, 5.2, 6);
    xs.box(0x9aa3b0, 0.9, 0.6, 1.6, 0, 0.5, -0.6);
    for (const f of [-1, 1]) for (const u of [-1, 1]) {
      xs.box(0xe5e7eb, 5, 0.12, 2, f * 3, u * 0.5 - 0.06, -2.4, 0, 0, f * u * 0.22);
      hcyl(xs, 0x9aa3b0, 0.4, 2.6, f * 1.4, u * 0.6, -2.6, 8);
      xs.rod(0xdc2626, 0.07, f * 5.4, u * 1.05, -3.4, f * 5.4, u * 1.05, 1.6, 4);
    }
    xw.grp.rotation.set(-0.25, -0.5, 0.12); xw.done();
    sign('STAR TOURS', 8, 1.3, STX, Y + 7, STZ + 9.1, 0, '#0b1220', '#7dd3fc', 'L’AVENTURE CONTINUE');
    foot(STX, STZ, 18);
    const BX = 322, BZ3 = 898;
    bldg(0x6d5fb0, 24, 9, 16, BX, Y, BZ3, 0, 4.2, 4.5);
    S.box(0x84cc16, 25, 0.7, 17, BX, Y + 9, BZ3);
    S.sph(0x84cc16, 2.6, BX - 6, Y + 12.4, BZ3 + 4, 1, 1, 1, 10); S.tor(WHITE, 3.6, 0.2, BX - 6, Y + 12.4, BZ3 + 4, 1.2, 0, 0.2, PI * 2, 20);
    S.cone(WHITE, 1.3, 5, BX + 6, Y + 9.7, BZ3 + 4, 8); for (let i = 0; i < 3; i++) S.box(0xdc2626, 0.15, 1.8, 1.4, BX + 6 + Math.cos(i * 2.1) * 1.3, Y + 9.7, BZ3 + 4 + Math.sin(i * 2.1) * 1.3, -i * 2.1);
    sign('BUZZ LIGHTYEAR LASER BLAST', 9, 1.1, BX, Y + 6.2, BZ3 + 8.1, 0, '#2e1065', '#bef264');
    foot(BX, BZ3, 16);
    // Volcanic rock spires and brass street lamps of Discoveryland.
    for (let i = 0; i < 9; i++) {
      const a = i * 0.72 + 2.2, rx = SX + Math.cos(a) * 38, rz = SZ + Math.sin(a) * 36;
      if (Math.cos(a) > 0.55) continue;
      S.crag(i % 2 ? 0x9a5a3c : 0x7f4a34, 0.4, 2.2 + (i % 3) * 0.6, 7 + (i % 4) * 2.2, rx, Y - 0.5, rz, 6, i);
      foot(rx, rz, 3);
    }
    for (let i = 0; i < 8; i++) lamp(318 + i * 5, 938 + (i % 2) * 16, 4.6);
    for (let i = 0; i < 6; i++) { lamp(450 + i * 14, 990 + (i % 2) * 4, 4.2); lamp(462 + i * 16, 1076 - (i % 2) * 6, 4.2); }
  });

  /* ---------------- Entry point ---------------- */
  function build(scene, world, group) {
    const T = root.THREE, P = world.PARIS;
    if (!P || !root.TPKit) return null;
    const pg = new T.Group(); pg.name = 'disneyland-paris'; (group || scene).add(pg);
    const K = root.TPKit.create(pg, world), Y = world.PARK_Y;
    const feet = [], updaters = [], rides = {}, interactables = [];
    const ctx = {
      K, P, Y, WY: world.WATER_Y, world, pg, updaters, rides, interactables,
      hmAt: (x, z) => world.hm[(x | 0) + (z | 0) * world.W] || Y,
      foot: (x, z, r) => feet.push([x, z, r * r])
    };
    (root.TPParisParts || []).forEach((part) => part(ctx));

    const avoid = (x, z) => {
      for (const f of feet) { const dx = x - f[0], dz = z - f[1]; if (dx * dx + dz * dz < f[2]) return true; }
      const R = P.rail, d = Math.hypot((x - R.x) / R.rx, (z - R.z) / R.rz);
      return d > 0.97 && d < 1.03;
    };
    const R = P.rail;
    K.scatter(420, R.x - R.rx - 28, R.x + R.rx + 28, 742, R.z + R.rz + 26, avoid, (x, z, r) => {
      const d = Math.hypot((x - R.x) / R.rx, (z - R.z) / R.rz);
      if (d > 1.03) return r < 0.5 ? 'pine' : 'oak';
      if (x > 440 && z > 985) return r < 0.75 ? 'palm' : 'oak';
      if (x > 430) return r < 0.55 ? 'pine' : (r < 0.75 ? 'cactus' : 'oak');
      if (x < 340 && z > 870) return r < 0.5 ? 'palm' : 'cypress';
      if (z > 1010) return r < 0.3 ? 'blossom' : (r < 0.5 ? 'cypress' : 'oak');
      return r < 0.2 ? 'blossom' : 'oak';
    });
    K.flush();
    pg.traverse((m) => { if (m.isMesh && m.material && m.material.isMeshLambertMaterial) m.castShadow = true; });

    let elapsed = 0;
    return {
      rides, interactables,
      update: (dt, t, onEvent) => { elapsed += dt; for (const u of updaters) u(dt, elapsed, onEvent); }
    };
  }

  root.TPParis = { build };
})(window);

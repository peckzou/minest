/* Minest My World · Disneyland Park (California) — Paris-standard upgrade layer.
 * Rebuilds the park's weakest set pieces with the Imagineering Build Kit:
 *  - Matterhorn: faceted alpine massif + a real two-lap bobsled spline track (was plain cones on a circular orbit)
 *  - Big Thunder Mountain: stratified sandstone buttes + a real mine-train spline track with dinosaur ribs
 *  - Disneyland Monorail: new rideable elevated beam loop, Tomorrowland ⇄ Esplanade (Downtown Disney)
 *  - Pirates of the Caribbean show building: dressed as New Orleans Square town houses and jungle cliffs */
(function (root) {
  'use strict';

  function build(scene, world, group) {
    const T = root.THREE;
    if (!root.TPKit) return null;
    const cg = new T.Group(); cg.name = 'california-plus'; (group || scene).add(cg);
    const K = root.TPKit.create(cg, world), Y = world.PARK_Y;
    const { S, G, W, bldg, sign, tree, lamp } = K;
    const PI = Math.PI, updaters = [], rides = {}, interactables = [];
    const WOOD = 0x6b4a2f, WHITE = 0xf4f6f8, DARK = 0x27303c, GOLD = 0xe7b83a, RED = 0xb3261e;
    const polar = (cx, cz, list) => list.map(([deg, r, y]) => [cx + Math.cos(deg * PI / 180) * r, y, cz + Math.sin(deg * PI / 180) * r]);

    /* =============== MATTERHORN BOBSLEDS =============== */
    const MX = 330, MZ = 176, ROCK = 0x6a7078, ROCK2 = 0x7f858d, ROCK3 = 0x565c64, SNOW = 0xf4f8fc;
    S.crag(ROCK, 9, 19.5, 18, MX, Y, MZ, 9, 0.3);
    S.crag(ROCK2, 4.5, 11.5, 16, MX - 1, Y + 15, MZ - 1, 8, 0.8);
    S.crag(ROCK3, 1.3, 5.6, 9.5, MX - 1.6, Y + 29, MZ - 1.2, 7, 0.4);
    S.crag(SNOW, 1.2, 4.3, 6.4, MX - 1.7, Y + 32.7, MZ - 1.3, 7, 0.4);
    S.crag(SNOW, 0, 2.5, 6.8, MX - 2.5, Y + 38.2, MZ - 1.8, 6, 0.3, 0.1, 0.16);          // the hooked summit
    [[9, 5, 2.5, 9, 17, 0.5], [-10, 6, 2, 8, 14, 1.2], [3, -10, 2, 8, 19, 0.2]].forEach(([dx, dz, rt, rb, h, ry], i) => {
      S.crag(i % 2 ? ROCK2 : ROCK3, rt, rb, h, MX + dx, Y, MZ + dz, 7, ry);
      S.crag(SNOW, 0, rt + 0.7, 3.4, MX + dx, Y + h - 0.6, MZ + dz, 6, ry);
    });
    for (const [dx, dy, dz, r] of [[4, 22, 3, 3.2], [-6, 19, -4, 3], [-3, 26.5, 4, 2.4], [6, 12, -9, 3], [-11, 9, 3, 2.6], [8, 27, -2, 2.2]]) S.poly(SNOW, r, MX + dx, Y + dy, MZ + dz, 0, 1.4, 0.42, 1, dx);
    W.box(0xcfeeff, 2.2, 15.5, 0.3, MX + 13.6, Y, MZ + 5.6, PI / 2.5); W.box(0xcfeeff, 1.4, 11, 0.3, MX + 4, Y, MZ - 16.4, 0.2);
    const mh = K.track(polar(MX, MZ, [
      [133, 21, 1.5], [175, 21.5, 3], [220, 19, 7], [265, 16.5, 12], [310, 15.5, 17], [355, 13, 22], [40, 11, 25.5],
      [85, 12, 23], [130, 14, 19.5], [175, 16, 16], [220, 21.5, 12.5], [265, 22, 9.5], [310, 21.5, 7.5], [355, 21, 6], [40, 21.5, 5], [85, 21.5, 3.5], [112, 21, 2.2]
    ]), { gauge: 1.1, rail: { col: 0xcfd8e3, r: 0.11 }, tie: { col: ROCK3, step: 3, r: 0.09 }, sup: { col: 0x8a9099, step: 5, r: 0.2 }, pull: 0.7 });
    const sled = (c) => {
      const a = K.asm(0, 0, 0), s = a.S;
      s.box(c, 1.15, 0.55, 2.9, 0, 0.12, 0); s.box(c, 0.9, 0.4, 0.9, 0, 0.3, 1.6, 0, 0.35); s.box(WHITE, 1.2, 0.14, 2.95, 0, 0.36, 0);
      for (const z of [-0.9, 0.2]) s.box(DARK, 0.9, 0.6, 0.16, 0, 0.6, z);
      return a.done();
    };
    const mhRide = K.trainRide({
      id: 'matterhorn_bobsleds', name: '马特宏峰雪橇 · Matterhorn Bobsleds', land: 'matterhorn', track: mh,
      cars: [sled(RED), sled(0x2563eb), sled(RED)], gap: 3.2, speed: 6.2, G: 9.2, vmax: 23, lift: 0.1, eye: 1.35, back: 8,
      boardPos: { x: MX - 13.5, y: Y, z: MZ + 18.2 }, exitPos: { x: MX - 16.5, y: Y, z: MZ + 20, yaw: -0.5 },
      events: [
        [0.03, '🛷 雪橇驶出瑞士木屋车站，开始沿山腰螺旋爬升'],
        [0.3, '🧊 钻进冰川裂隙——山壁上全是幽蓝的冰晶'],
        [0.4, '👹 雪怪哈罗德！它在峰顶冰洞里朝你咆哮——抓紧！'],
        [0.6, '🏔️ 冲出峰肩，绕着阿尔卑斯山壁高速盘旋下滑'],
        [0.9, '💦 掠过冰川瀑布，滑回山脚']
      ],
      doneMsg: '🏁 马特宏峰雪橇完成！这是全世界第一座钢管轨道过山车（1959）。'
    });
    rides.matterhorn_bobsleds = mhRide.ride;
    updaters.push((dt, t, ev) => mhRide.update(dt, ev));
    // Harold the Abominable Snowman in his ice cave near the summit.
    const hx = MX + Math.cos(0.35) * 8.2, hz = MZ + Math.sin(0.35) * 8.2;
    S.crag(0x3d4149, 2.4, 4, 5, hx, Y + 21, hz, 6, 0.5);
    const harold = K.asm(hx + 1.6, Y + 23.4, hz + 0.8);
    harold.S.poly(0xe8e4da, 1.5, 0, 1.4, 0, 1, 1, 1.3, 1); harold.S.poly(0xdcd6c8, 0.85, 0, 3.3, 0.2, 1);
    for (const sx of [-1, 1]) { harold.S.rod(0xe8e4da, 0.42, sx * 1.2, 2.3, 0, sx * 2.2, 3.6, 1.2, 6); harold.G.sph(0xef4444, 0.13, sx * 0.3, 3.5, 0.95, 1, 1, 1, 5); }
    harold.grp.rotation.y = PI / 2 - 0.35; harold.done();
    for (let i = 0; i < 5; i++) G.cone(0x7dd3fc, 0.4, 1.6 + (i % 2), hx + 2.6 + Math.cos(i * 1.3) * 1.6, Y + 22.4, hz + Math.sin(i * 1.3) * 2.2, 5);
    updaters.push((dt, t) => { harold.grp.rotation.y = PI / 2 - 0.35 + Math.sin(t * 2.6) * 0.3; });
    // Swiss chalet station.
    const CXs = MX - 13.5, CZs = MZ + 14.6;
    for (const [ax, az] of [[-3.6, -3], [3.6, -3], [-3.6, 3], [3.6, 3]]) S.cyl(WOOD, 0.26, 0.3, 4.4, CXs + ax, Y, CZs + az, 6);
    S.box(0x8a5a3a, 9, 0.5, 8, CXs, Y + 4.4, CZs); S.gable(0x8f3a2c, 9.6, 2.8, 9.4, CXs, Y + 4.9, CZs, PI / 2);
    for (let i = -3; i <= 3; i++) S.box([0xf472b6, 0xfde047, RED][(i + 3) % 3], 0.8, 0.4, 0.5, CXs + i * 1.1, Y + 3.9, CZs + 4.1);
    sign('MATTERHORN BOBSLEDS', 7.4, 1.1, CXs, Y + 6.4, CZs + 4.9, 0, '#1e3a5f', '#f8fafc', '马特宏峰雪橇 · since 1959');
    for (const [px, pz] of [[MX - 21, MZ - 8], [MX + 20, MZ - 12], [MX - 17, MZ - 16], [MX + 23, MZ + 13], [MX - 24, MZ + 8]]) tree('pine', px, pz, 0.8);
    interactables.push({ id: 'matterhorn_peak', name: '马特宏峰 · 登山者营地', x: MX - 20, y: Y, z: MZ + 10, msg: '🧗 抬头看：真实比例 1:100 的马特宏峰高 45 米，峰顶偶尔能看到米奇带队攀岩，山体里还藏着一个半场篮球场。' });

    /* =============== BIG THUNDER MOUNTAIN RAILROAD =============== */
    const BX = 188, BZ = 154, RR = [0xb9583a, 0xc96a44, 0xa84a30, 0xd07a50];
    const butte = (x, z, r, h, ry) => {
      let y = 0, rr = r;
      [0.3, 0.27, 0.23, 0.2].forEach((k, i) => {
        const hh = h * k, top = rr * (i === 3 ? 0.35 : 0.86);
        S.crag(RR[i], top, rr, hh, x + (i % 2 ? 0.4 : -0.3), Y + y, z + (i % 2 ? -0.3 : 0.4), 8, (ry || 0) + i * 0.5);
        y += hh; rr = top * 0.9;
      });
    };
    butte(BX, BZ - 1, 13, 31, 0.2); butte(216, 146, 6, 18, 1); butte(186, 127, 6, 16, 2);
    S.crag(RR[2], 0.5, 3, 13, 170, Y, 169, 6, 0.3); S.crag(RR[0], 0.4, 3.4, 15, 206, Y, 134, 6, 1.1); S.crag(RR[1], 0.4, 2.4, 10, 214, Y, 166, 6, 2);
    S.crag(RR[3], 0.6, 2.2, 8, BX + 4, Y + 24, BZ - 3, 6, 0.6);
    const bt = K.track(polar(BX, BZ, [
      [80, 20, 1.5], [40, 20.5, 2.5], [0, 19.5, 5], [320, 18, 8.5], [280, 16.5, 12], [240, 15.5, 15],
      [200, 17, 13], [160, 15, 14.5], [120, 14, 13], [80, 13.5, 11], [40, 14, 9], [0, 15, 7.5],
      [320, 21.5, 6], [280, 21.5, 5], [240, 20.5, 4.5], [200, 21, 4], [160, 22, 3.2], [120, 21.5, 2.4]
    ]), { gauge: 1.2, rail: { col: 0x4a3a2e, r: 0.11 }, tie: { col: WOOD, step: 2, r: 0.1 }, sup: { col: WOOD, step: 4, r: 0.22 }, pull: 0.75 });
    const mineCar = (loco) => {
      const a = K.asm(0, 0, 0), s = a.S;
      s.box(0x3a2a20, 1.5, 0.4, 3, 0, 0.1, 0);
      if (loco) { s.cyl(0x2a2422, 0.62, 0.62, 2.1, 0, 0.9, 0.8, 10, PI / 2); s.cyl(GOLD, 0.2, 0.32, 1.1, 0, 1.9, 1.3, 6); s.box(RED, 1.5, 1.4, 1, 0, 1.2, -0.9); s.cone(0x2a2422, 0.7, 0.8, 0, 0.5, 2.3, 4); a.G.sph(0xffe9a8, 0.2, 0, 1.5, 1.95, 1, 1, 1, 5); }
      else { s.box(0x8a5a3a, 1.5, 0.8, 2.9, 0, 0.5, 0); for (const z of [-0.8, 0.5]) s.box(0x5b3f2a, 1.3, 0.7, 0.2, 0, 1.3, z); }
      return a.done();
    };
    const btRide = K.trainRide({
      id: 'big_thunder', name: '巨雷山铁路 · Big Thunder Mountain Railroad', land: 'frontierland', track: bt,
      cars: [mineCar(true), mineCar(), mineCar(), mineCar(), mineCar()], gap: 3.3, speed: 6.4, G: 9.4, vmax: 21, lift: 0.15, eye: 1.7, back: 9,
      boardPos: { x: BX + 4, y: Y, z: BZ + 23.5 }, exitPos: { x: BX + 7, y: Y, z: BZ + 25.5, yaw: 0 },
      events: [
        [0.03, '🚂 「这是荒野里最狂野的旅程！」矿车驶离彩虹岭矿镇'],
        [0.2, '⛏️ 爬上红岩台地——脚下就是美国河与汤姆索亚岛'],
        [0.36, '💨 列车失控了！贴着砂岩山壁急转俯冲'],
        [0.62, '🌵 第二圈：从车站屋顶上方呼啸而过'],
        [0.86, '🦖 穿过巨型恐龙化石肋骨拱，滑回矿镇']
      ],
      doneMsg: '🏁 巨雷山铁路完成！淘金者说：山神总算放你一马。'
    });
    rides.big_thunder = btRide.ride;
    updaters.push((dt, t, ev) => btRide.update(dt, ev));
    const sx0 = BX + 3.5, sz0 = BZ + 20.5;
    S.box(0x7a5a3c, 11, 0.4, 6.4, sx0, Y + 4.8, sz0); S.gable(0x8f4a36, 7, 2.2, 11.6, sx0, Y + 5.2, sz0, PI / 2);
    for (const [ax, az] of [[-5, -2.8], [5, -2.8], [-5, 2.8], [5, 2.8], [0, 2.8]]) S.cyl(WOOD, 0.22, 0.26, 4.8, sx0 + ax, Y, sz0 + az, 6);
    sign('BIG THUNDER MOUNTAIN RAILROAD', 9, 1.1, sx0, Y + 3.9, sz0 + 3.3, 0, '#3b1d0a', '#fde68a', '巨雷山铁路 · Rainbow Ridge');
    for (const [ax, az] of [[-1.4, -1.4], [1.4, -1.4], [-1.4, 1.4], [1.4, 1.4]]) S.rod(WOOD, 0.16, BX + 15 + ax * 1.3, Y, BZ + 22 + az * 1.3, BX + 15 + ax, Y + 6, BZ + 22 + az, 5);
    S.cyl(0x8a5a3a, 2, 2, 3, BX + 15, Y + 6, BZ + 22, 10); S.cone(0x5b3f2a, 2.3, 1.6, BX + 15, Y + 9, BZ + 22, 10);
    const ribA = 160 * PI / 180, rbx = BX + Math.cos(ribA) * 22, rbz = BZ + Math.sin(ribA) * 22;
    for (let i = -2; i <= 2; i++) S.tor(0xe8e0cc, 3.3, 0.18, rbx + Math.sin(ribA) * i * 1.2, Y + 2.4, rbz - Math.cos(ribA) * i * 1.2, 0, PI / 2 - ribA + PI / 2, 0, PI, 10);
    S.sph(0xe8e0cc, 0.9, rbx + Math.sin(ribA) * 4.4, Y + 4.4, rbz - Math.cos(ribA) * 4.4, 1, 0.8, 1.6, 7);
    for (const [gx, gz, h] of [[BX + 22, BZ + 10, 5], [BX + 24.5, BZ + 13, 3.4], [BX - 22, BZ - 14, 4.4]]) { S.cyl(0xd9a066, 1.3, 1.7, 0.5, gx, Y, gz, 9); W.cone(0xdff4ff, 0.7, h, gx, Y + 0.4, gz, 6); }
    for (const [px, pz] of [[BX + 24, BZ + 2], [BX - 20, BZ + 14], [BX + 18, BZ - 20], [BX - 8, BZ + 23]]) tree('cactus', px, pz, 1.1);
    interactables.push({ id: 'thunder_gold', name: '彩虹岭 · 淘金盘', x: BX - 4, y: Y, z: BZ + 24, msg: '⛏️ 你在溪水里晃了晃淘金盘——金光一闪！彩虹岭的老矿工说，这座山会惩罚贪心的人。' });

    /* =============== DISNEYLAND MONORAIL (Tomorrowland ⇄ Esplanade) =============== */
    const MH = 10;
    const mono = K.track([[372, MH, 304], [352, MH, 316], [336, MH, 350], [330, MH, 400], [334, MH, 446], [324, MH, 488], [340, MH, 500], [362, MH, 494],
      [378, MH, 470], [386, MH, 430], [388, MH, 380], [386, MH, 336], [382, MH, 314]],
      { beam: { col: 0xe8eef5, r: 0.55, drop: 0.75 }, sup: { col: 0xd9dee6, step: 9, r: 0.5 }, pull: 0.85 });
    const monoCar = (c, nose) => {
      const a = K.asm(0, 0, 0), s = a.S;
      s.box(c, 2.3, 1.2, 7.4, 0, -0.7, 0); s.box(0x1f2933, 2.34, 0.75, 7.0, 0, 0.5, 0); s.box(WHITE, 2.2, 0.4, 7.2, 0, 1.25, 0);
      if (nose) { s.box(c, 2.1, 1, 2, 0, -0.6, 4.3, 0, 0.35); s.sph(0x1f2933, 1, 0, 0.7, 3.9, 1, 0.6, 1.4, 8); a.G.box(0xe0f2fe, 1.2, 0.2, 0.1, 0, -0.1, 5.3); }
      return a.done();
    };
    const monoRide = K.trainRide({
      id: 'monorail', name: '迪士尼乐园单轨列车 · Disneyland Monorail', land: 'tomorrowland', track: mono,
      cars: [monoCar(RED, true), monoCar(RED), monoCar(RED)], gap: 7.8, speed: 9, auto: true, lift: 0.55, eye: 1.4, back: 14,
      boardPos: { x: 372, y: Y, z: 300 }, exitPos: { x: 368, y: Y, z: 298, yaw: 0 },
      events: [
        [0.04, '🚝 「请站稳扶好」——Mark VII 单轨列车驶离明日世界站'],
        [0.3, '🚂 正从迪士尼铁路上空跨过，右侧就是小镇大街的屋顶'],
        [0.46, '🎟️ 迎宾广场站（迪士尼小镇方向）到了，列车继续环线'],
        [0.8, '🚀 回程：前方白色穹顶是太空山，远处雪峰是马特宏峰']
      ]
    });
    rides.monorail = monoRide.ride;
    updaters.push((dt, t, ev) => monoRide.update(dt, ev));
    const monoStation = (x, z, ry, title, cn) => {
      const f = K.frame(x, z, ry);
      f.box(0xe8eef5, 16, 0.5, 9, 0, Y + MH - 1.4, 0); f.box(0x38bdf8, 17, 0.4, 10, 0, Y + MH + 4.4, 0);
      for (const sx of [-1, 1]) for (const sz of [-1, 1]) f.cyl(WHITE, 0.3, 0.36, MH + 4.4, sx * 7, Y, sz * 4, 6);
      f.box(0xcfd8e3, 3, 0.3, 13, 9.4, Y + (MH - 1.4) / 2 - 0.2, 4.5, 0, Math.atan2(MH - 1.4, 13));
      f.sign(title, 8, 1.2, 0, Y + MH + 2.6, 5.1, 0, '#0b1f3a', '#7dd3fc', cn);
    };
    monoStation(368, 306, 0.5, 'DISNEYLAND MONORAIL', '明日世界站 · Tomorrowland');
    monoStation(330, 494, -0.9, 'DISNEYLAND MONORAIL', '迎宾广场站 · Downtown Disney');
    for (let z = 320; z <= 470; z += 25) { tree('palm', 344, z, 0.9); lamp(350, z + 12, 4.2); }

    /* =============== PIRATES OF THE CARIBBEAN — show building dressed as New Orleans Square =============== */
    const PAL = [0xe9c9a0, 0xd9a3a0, 0xf2e6cf, 0xa9c3b0, 0x9fb3c8], IRON = 0x1f2a24;
    S.box(0x4a5563, 56.4, 0.5, 52.4, 145, Y + 14.1, 305);
    for (const [w, d, x, z] of [[56.8, 1, 145, 279.6], [56.8, 1, 145, 330.6], [1, 52, 117.2, 305], [1, 52, 172.8, 305]]) S.box(0x3d4756, w, 1.6, d, x, Y + 13.4, z);
    for (let i = 0; i < 6; i++) { S.box(0x8f4a36, 1.4, 2.6, 1.4, 124 + i * 8.4, Y + 14.6, 290 + (i % 3) * 14); S.box(0x55667f, 3, 2, 3.4, 128 + i * 8, Y + 14.6, 322 - (i % 2) * 26); }
    const house = (x, z, len, alongX, out, i) => {
      const w = alongX ? len : 1.6, d = alongX ? 1.6 : len, c = PAL[i % 5];
      bldg(c, w, 13.4, d, x, Y, z, 0, 2.6, 4.2);
      for (const by of [4.2, 8.4]) {
        const bx = x + (alongX ? 0 : out * 1.5), bz = z + (alongX ? out * 1.5 : 0);
        S.box(IRON, alongX ? len : 1.4, 0.16, alongX ? 1.4 : len, bx, Y + by, bz);
        S.box(IRON, alongX ? len : 0.08, 0.9, alongX ? 0.08 : len, x + (alongX ? 0 : out * 2.15), Y + by + 0.16, z + (alongX ? out * 2.15 : 0));
        for (let k = -1; k <= 1; k++) S.cyl(IRON, 0.07, 0.07, by, x + (alongX ? k * len * 0.4 : out * 2.15), Y, z + (alongX ? out * 2.15 : k * len * 0.4), 4);
      }
    };
    for (let i = 0; i < 5; i++) house(116.6, 285 + i * 10, 9.8, false, -1, i);                 // west row, facing the Haunted Mansion walk
    for (let i = 0; i < 2; i++) house(173.4, 286 + i * 10, 9.8, false, 1, i + 2);              // north-east row, facing Adventureland
    const cliff = (x, z, k) => { S.crag(k % 2 ? 0x6f6a5c : 0x7d7868, 1.2, 3.6 + (k % 3), 9 + (k % 4) * 2, x, Y, z, 6, k); S.poly(k % 2 ? 0x2c7a3b : 0x3f8f3f, 2.2, x, Y + 10 + (k % 4) * 2, z, 1, 1.3, 0.6, 1.3, k); };
    for (let z = 320, k = 0; z <= 330; z += 5, k++) cliff(174, z, k);
    for (let x = 120, k = 3; x <= 172; x += 5.2, k++) { if (x > 131 && x < 149) continue; cliff(x, 332, k); }
    sign('PIRATES OF THE CARIBBEAN', 9, 1.3, 145, Y + 11.6, 279, PI, '#1a1420', '#fde68a', '加勒比海盗 · New Orleans Square');

    K.flush();
    cg.traverse((m) => { if (m.isMesh && m.material && m.material.isMeshLambertMaterial) m.castShadow = true; });
    let elapsed = 0;
    return { rides, interactables, update: (dt, t, onEvent) => { elapsed += dt; for (const u of updaters) u(dt, elapsed, onEvent); } };
  }

  root.TPCalifornia = { build };
})(window);

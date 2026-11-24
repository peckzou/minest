/* Minest My World · Walt Disney World Resort — part 1: EPCOT.
 * Entrance plaza & fountain → Spaceship Earth → World Celebration gardens → World Showcase Lagoon ringed by the
 * eleven nation pavilions. World Discovery (Test Track, Mission: SPACE, Cosmic Rewind) lies east, World Nature
 * (The Seas, The Land, Imagination!) west. The Disney Skyliner leaves the gate southwards for Hollywood Studios. */
(function (root) {
  'use strict';

  (root.TPResortParts = root.TPResortParts || []).push(function (ctx) {
    const { K, R, Y, WY, foot, updaters, rides, interactables, rg } = ctx;
    const { S, G, W, T, bldg, sign, tree, lamp } = K;
    const PI = Math.PI, E = R.epcot, EX = E.x, L = E.lagoon;
    const WHITE = 0xf4f6f8, SILVER = 0xcfd8e3, STEEL = 0x8fa0b4, DARK = 0x27303c, GOLD = 0xe7b83a;
    const BLUE = 0x2563eb, TEAL = 0x0e9aa7, PURPLE = 0x6d4fc2, STONE = 0xd9cfc2, RED = 0xb3261e;
    const V3 = T.Vector3;

    /* =============== ENTRANCE PLAZA, FOUNTAIN & GATES =============== */
    const FZ = E.zGate;
    S.cyl(WHITE, 7, 7.4, 0.8, EX, Y, FZ, 24);
    W.cyl(0x7dd3fc, 6.5, 6.5, 0.25, EX, Y + 0.65, FZ, 24);
    for (const [dx, h, ry] of [[-2.3, 6.2, 0.4], [0, 9, 0], [2.3, 6.2, 1.1]]) W.crag(0xcdeeff, 0.12, 1.05, h, EX + dx, Y + 0.8, FZ, 3, ry);
    foot(EX, FZ, 9);
    for (const sx of [-1, 1]) {
      for (let i = 0; i < 4; i++) {
        const gx = EX + sx * (9 + i * 5.2);
        S.box(SILVER, 2.2, 2.6, 2.2, gx, Y, 292); S.box(BLUE, 4.6, 0.3, 4, gx, Y + 3.3, 292);
        for (const f of [-1, 1]) S.cyl(WHITE, 0.1, 0.1, 3.3, gx + f * 2, Y, 290.4, 5);
      }
      for (let i = 0; i < 5; i++) {
        const px = EX + sx * (12 + i * 5), pz = 281 - i * 1.4;
        S.cyl(WHITE, 0.07, 0.09, 8, px, Y, pz, 5);
        S.box([BLUE, TEAL, PURPLE, 0xf59e0b, 0xe11d48][i], 1.7, 1, 0.05, px + 0.9, Y + 6.8, pz);
      }
      foot(EX + sx * 18, 292, 12);
    }
    sign('EPCOT', 12, 2.6, EX, Y + 6.4, 294.5, 0, '#0b1220', '#e2e8f0', '未来世界 · 世界橱窗');
    for (const sx of [-1, 1]) S.cyl(SILVER, 0.25, 0.3, 5.2, EX + sx * 5.6, Y, 294.5, 6);

    /* =============== SPACESHIP EARTH =============== */
    const SZ = E.zEarth, SY = Y + 25.5, SR = 18.5;
    S.poly(SILVER, SR, EX, SY, SZ, 3);
    for (let i = 0; i < 3; i++) {
      const a = i * PI * 2 / 3 + PI / 6;
      for (const o of [-0.2, 0.2]) {
        const fx = EX + Math.cos(a + o) * 22, fz = SZ + Math.sin(a + o) * 22;
        S.rod(WHITE, 1.05, fx, Y, fz, EX + Math.cos(a + o * 0.4) * 12.4, SY - 13.2, SZ + Math.sin(a + o * 0.4) * 12.4, 8);
        S.cyl(STEEL, 1.7, 2, 0.9, fx, Y, fz, 8);
        foot(fx, fz, 3);
      }
    }
    S.tor(STEEL, 12.6, 0.45, EX, SY - 13.4, SZ, PI / 2, 0, 0, PI * 2, 28);
    S.cyl(WHITE, 8.5, 8.5, 0.5, EX, Y + 5, SZ, 24);
    S.cyl(0x3b4a5c, 5.2, 5.6, 5, EX, Y, SZ, 16);
    for (let i = 0; i < 8; i++) S.cyl(SILVER, 0.22, 0.22, 5, EX + Math.cos(i * PI / 4) * 8, Y, SZ + Math.sin(i * PI / 4) * 8, 6);
    G.box(0x7dd3fc, 4.4, 2.6, 0.2, EX, Y + 0.4, SZ + 5.5);
    sign('SPACESHIP EARTH', 9, 1.2, EX, Y + 6.3, SZ + 8.7, 0, '#0b1220', '#7dd3fc', '地球号太空船');
    interactables.push({ id: 'spaceship_earth', name: '地球号太空船', x: EX, y: Y, z: SZ + 12, msg: '🌐 地球号太空船：你将乘时光机穿越 4 万年人类通信史——从洞穴壁画、腓尼基字母、活字印刷到互联网！' });

    /* =============== WORLD CELEBRATION GARDENS =============== */
    const CZ = 186;
    S.cyl(STONE, 3.4, 3.8, 0.8, EX, Y, CZ, 16);
    S.cyl(0x8a6a48, 0.4, 0.5, 0.5, EX, Y + 0.8, CZ, 8);
    S.cyl(0x6b5238, 0.3, 0.36, 1.5, EX, Y + 1.3, CZ, 6); S.sph(0x6b5238, 0.34, EX, Y + 3.1, CZ, 1, 1, 1, 6);  // Walt the Dreamer
    for (let i = 0; i < 12; i++) {
      const a = i * PI / 6 + PI / 12, bx = EX + Math.cos(a) * 23, bz = CZ + Math.sin(a) * 12;
      S.cyl(0x4b8f3f, 2.2, 2.4, 0.35, bx, Y, bz, 10);
      S.cyl([0xf472b6, 0xfde047, 0x38bdf8, 0xc084fc][i % 4], 1.7, 1.9, 0.3, bx, Y + 0.3, bz, 10);
      if (i % 2) tree('blossom', bx, bz, 0.7);
    }
    for (const sx of [-1, 1]) {
      const hx = EX + sx * 34;
      bldg(WHITE, 14, 6, 20, hx, Y, CZ + 4, 0, 3.6, 6);
      S.box(TEAL, 15, 0.5, 21, hx, Y + 6, CZ + 4);
      S.cyl(SILVER, 6.5, 6.5, 0.6, hx, Y + 6.5, CZ + 4, 20); W.dome(0x9fd3ff, 5.6, hx, Y + 7.1, CZ + 4, 0.45, 16);
      foot(hx, CZ + 4, 14);
    }
    sign('CONNECTIONS · CREATIONS', 9, 1.1, EX - 34, Y + 4.2, CZ + 14.2, 0, '#0b1220', '#5eead4');
    sign('COMMUNICORE HALL', 9, 1.1, EX + 34, Y + 4.2, CZ + 14.2, 0, '#0b1220', '#5eead4');

    /* =============== WORLD DISCOVERY (east) =============== */
    // Test Track: circular show building with a high-speed elevated outer loop.
    const TX = 672, TZ = 224;
    S.cyl(0x3b4a5c, 12, 12, 7.5, TX, Y, TZ, 28); S.cyl(SILVER, 12.6, 12.6, 0.6, TX, Y + 7.5, TZ, 28);
    S.cyl(BLUE, 9, 9, 0.7, TX, Y + 8.1, TZ, 24);
    S.cyl(WHITE, 0.4, 0.5, 7, TX - 15, Y, TZ + 8, 6); S.box(BLUE, 9, 0.4, 7, TX - 13, Y + 7, TZ + 8, 0.3);
    sign('TEST TRACK', 8, 1.4, TX - 13.2, Y + 5, TZ + 11.6, 0.3, '#0b1220', '#38bdf8', '测试赛道 · presented by Chevrolet');
    foot(TX, TZ, 15);
    const tt = K.track([[668, 4.5, 206], [688, 4.5, 196], [708, 5, 192], [722, 7, 204], [726, 9, 228], [722, 8, 254], [708, 6, 270], [690, 5, 274], [676, 4.5, 262], [672, 4.5, 236]],
      { gauge: 2.6, rail: { col: SILVER, r: 0.12 }, beam: { col: 0x9aa7b5, r: 1.2, drop: 1.25 }, sup: { col: WHITE, step: 7, r: 0.42 }, pull: 0.55 });
    S.ribbon(0x2b3440, tt, 3.6, 0.02); S.ribbon(0x2b3440, tt, -3.6, 0.0);
    const simCar = (c) => {
      const a = K.asm(0, 0, 0), s = a.S;
      s.box(c, 1.9, 0.5, 4.3, 0, 0.3, 0); s.box(c, 1.7, 0.35, 1.5, 0, 0.75, 1.5, 0, 0.12);
      s.box(DARK, 1.6, 0.5, 1.9, 0, 0.8, -0.3); s.box(c, 1.9, 0.3, 0.5, 0, 1.0, -2);
      for (const x of [-1, 1]) for (const z of [-1.4, 1.4]) s.cyl(0x15191f, 0.42, 0.42, 0.35, x * 0.95, 0.22, z, 10, 0, PI / 2);
      for (const x of [-0.6, 0.6]) { a.G.box(0xe0f2fe, 0.4, 0.14, 0.1, x, 0.6, 2.16); a.G.box(0xef4444, 0.4, 0.12, 0.1, x, 0.62, -2.16); }
      return a.done();
    };
    const ttRide = K.trainRide({
      id: 'test_track', name: '测试赛道 · Test Track（EPCOT）', land: 'epcot', track: tt,
      cars: [simCar(0x38bdf8), simCar(0xf59e0b)], gap: 7, speed: 11, G: 14, vmax: 27, lift: 0.05, eye: 1.25, back: 8,
      boardPos: { x: TX - 9, y: Y, z: TZ + 12 }, exitPos: { x: TX - 12, y: Y, z: TZ + 14, yaw: 0 },
      events: [
        [0.04, '🏁 设计完成！你的 SIM 概念车驶出展馆，开始性能测试'],
        [0.22, '🌀 高速弯道测试——高架路面带倾角，抓稳了！'],
        [0.5, '⚡ 动力测试：直道全油门，时速突破 100 公里！'],
        [0.82, '🛞 操控测试通过，减速返回展馆']
      ],
      doneMsg: '✅ 测试赛道完成！你的概念车在动力、操控与能效上都拿到了高分。'
    });
    rides.test_track = ttRide.ride;
    updaters.push((dt, t, ev) => ttRide.update(dt, ev));

    // Guardians of the Galaxy: Cosmic Rewind — the Wonders of Xandar pavilion with a Nova Corps Starblaster.
    const GX = 704, GZ = 232;
    bldg(0x1f3a6b, 18, 11, 26, GX, Y, GZ, 0, 4.5, 11);
    S.box(0x16294d, 19, 0.6, 27, GX, Y + 11, GZ);
    for (let i = -2; i <= 2; i++) G.box(0x60a5fa, 0.3, 9, 0.2, GX - 9.1, Y + 1, GZ + i * 5);
    const sb = K.asm(GX - 14, Y + 7, GZ), sbs = sb.S;
    sbs.box(0x1f3a6b, 1.6, 0.9, 5.6, 0, -0.4, 0); sbs.cone(GOLD, 0.8, 2.4, 0, -0.6, 3.6, 6);
    for (let i = 0; i < 8; i++) { const a = i * PI / 4; sbs.box(i % 2 ? GOLD : 0x2f55a4, 3.6, 0.14, 1, Math.cos(a) * 2, Math.sin(a) * 2 - 0.1, -0.4, 0, 0, a); }
    sb.grp.rotation.set(-0.3, -PI / 2 + 0.4, 0); sb.done();
    S.cyl(STEEL, 0.4, 0.8, 6, GX - 14, Y, GZ, 6);
    sign('COSMIC REWIND', 9, 1.3, GX - 9.2, Y + 8, GZ - 8, -PI / 2, '#0b1220', '#fbbf24', 'GUARDIANS OF THE GALAXY · 银河护卫队');
    // Phase-chamber entrance portal; the story coaster itself is staged by cosmic-rewind.js (TPCosmicRewind).
    S.box(0x0b1220, 0.5, 5.4, 5.6, GX - 9.3, Y, GZ + 5); G.box(0x22d3ee, 0.3, 5.6, 0.3, GX - 9.5, Y, GZ + 2.1); G.box(0x22d3ee, 0.3, 5.6, 0.3, GX - 9.5, Y, GZ + 7.9);
    G.box(0xfbbf24, 0.3, 0.3, 6.1, GX - 9.5, Y + 5.5, GZ + 5);
    sign('入口 · 相位舱', 4.6, 0.9, GX - 9.7, Y + 6.6, GZ + 5, -PI / 2, '#0b1220', '#67e8f9', '故事过山车 · STORY COASTER');
    for (let i = 0; i < 4; i++) { S.cyl(GOLD, 0.08, 0.1, 1, GX - 11 - i * 1.4, Y, GZ + 2.4, 6); S.cyl(GOLD, 0.08, 0.1, 1, GX - 11 - i * 1.4, Y, GZ + 7.6, 6); }
    if (root.TPCosmicRewind && rg) {
      const cr = root.TPCosmicRewind.build(T, rg, { x: GX, z: GZ, board: { x: GX - 11.5, y: Y, z: GZ + 5 }, exit: { x: GX - 15, y: Y, z: GZ + 10, yaw: PI / 2 } });
      rides.cosmic_rewind = cr.ride;
      updaters.push((dt, t, ev) => cr.update(dt, ev));
    }
    foot(GX, GZ, 17);

    // Mission: SPACE — swept red façade with the planets.
    const MX2 = 652, MZ = 248;
    for (let i = 0; i < 7; i++) {
      const a = PI * 0.15 + i * PI * 0.12;
      S.box(i % 2 ? 0xc2412d : 0xa8321f, 4.6, 6 + i * 0.9, 1.4, MX2 + Math.cos(a) * 10, Y, MZ - Math.sin(a) * 10 + 8, a + PI / 2);
    }
    S.sph(0xc2552d, 4.2, MX2 - 4, Y + 5.2, MZ + 2, 1, 1, 1, 14);                       // Mars
    S.sph(0x2b6cb0, 2.2, MX2 + 6, Y + 3.2, MZ + 6, 1, 1, 1, 12); S.sph(0x9ca3af, 0.8, MX2 + 9.4, Y + 5, MZ + 7, 1, 1, 1, 8);
    S.sph(0xd9a066, 3, MX2 + 3, Y + 9.5, MZ - 3, 1, 1, 1, 12); S.tor(0xe8d5a8, 4.6, 0.22, MX2 + 3, Y + 9.5, MZ - 3, PI / 2 - 0.35, 0, 0.2, PI * 2, 24);
    sign('MISSION: SPACE', 8, 1.2, MX2 - 2, Y + 1.8, MZ + 10.5, 0, '#1b0b08', '#fca5a5', '火星任务');
    foot(MX2, MZ, 13);

    /* =============== WORLD NATURE (west) =============== */
    // The Seas with Nemo & Friends.
    bldg(0xe8f1f6, 22, 7, 15, 574, Y, 246, 0, 4.4, 7);
    for (let i = 0; i < 5; i++) S.tor(i % 2 ? 0x38bdf8 : 0x0e7490, 3.2, 0.5, 565 + i * 4.5, Y + 4.4, 253.6, 0, 0, 0, PI, 12);
    S.crag(0x8d8f8a, 1.2, 4.2, 5, 588, Y, 256, 6, 1); S.crag(0x9c9e98, 0.8, 3, 3.6, 591.5, Y, 253, 6, 2);
    for (const [gx, gy, gz] of [[588, 5.1, 256], [591.5, 3.7, 253], [586.6, 4.2, 257.4]]) { S.sph(WHITE, 0.3, gx, Y + gy + 0.25, gz, 1, 0.9, 1.5, 6); S.cone(0xf59e0b, 0.08, 0.3, gx, Y + gy + 0.2, gz + 0.5, 4); }
    sign('THE SEAS', 8, 1.2, 574, Y + 5.8, 253.7, 0, '#06283d', '#7dd3fc', 'with Nemo & Friends · 海洋馆');
    foot(574, 246, 15);
    // The Land.
    S.cyl(0xd9c9a8, 15, 15, 3.4, 552, Y, 212, 24);
    S.cone(0xc9b48c, 15.6, 8.5, 552, Y + 3.4, 212, 24); W.cone(0xb7e3d0, 7.4, 7, 552, Y + 8.2, 212, 12);
    for (let i = 0; i < 6; i++) S.box([0xd97706, 0x65a30d, 0x0e7490][i % 3], 2.4, 0.3, 9, 566 + i * 0.2, Y + 0.02 + i * 0.01, 204 + i * 3.2, 0.5);
    sign('THE LAND', 7, 1.1, 566.2, Y + 2.2, 213, PI / 2, '#1c1917', '#bef264', '陆地馆 · Soarin’');
    foot(552, 212, 17);
    // Imagination! — the twin glass pyramids and the leap-frog fountain.
    bldg(PURPLE, 18, 6, 10, 566, Y, 182, 0, 4.4, 6);
    for (const [px, k] of [[561, 1], [571, 0.82]]) { W.pyr(0x8ec5ff, 9 * k, 9 * k, 9 * k, px, Y + 6, 182); S.pyr(0x3b82f6, 9.3 * k, 0.5, 9.3 * k, px, Y + 5.9, 182); }
    S.cyl(STONE, 2.4, 2.6, 0.5, 578, Y, 190, 12);
    const jets = []; for (let i = 0; i < 4; i++) { const j = K.asm(578, Y + 0.6, 190); j.G.sph(0xbfe9ff, 0.22, 0, 0, 0, 1, 1.8, 1, 5); j.done(); jets.push(j.grp); }
    updaters.push((dt, t) => jets.forEach((j, i) => { const u = (t * 0.7 + i * 0.25) % 1; j.position.set(578 - 6 + u * 12, Y + 0.6 + Math.sin(u * PI) * 3.4, 190 + (i % 2 ? 1.5 : -1.5)); }));
    sign('IMAGINATION!', 7, 1.1, 566, Y + 3.4, 187.1, 0, '#2e1065', '#f0abfc', '想象力馆 · Figment');
    foot(566, 182, 13);

    /* =============== WORLD SHOWCASE — eleven pavilions around the lagoon =============== */
    const RG = E.ring;
    const pav = (deg, name, cn, bg, fg) => {
      const a = deg * PI / 180, px = L.x + Math.cos(a) * RG.rx, pz = L.z + Math.sin(a) * RG.rz;
      foot(px, pz, 15);
      const f = K.frame(px, pz, Math.atan2(L.x - px, L.z - pz));
      for (const sx of [-1, 1]) f.cyl(0x4a3a2c, 0.1, 0.12, 2.2, sx * 2.4, Y, 10.5, 5);
      f.sign(name, 5.6, 1.1, 0, Y + 2.6, 10.5, 0, bg, fg, cn);
      return f;
    };
    let f;
    // Canada — Hôtel du Canada, the Rockies waterfall and a totem pole.
    f = pav(120, 'CANADA', '加拿大', '#7f1d1d', '#fff7ed');
    f.bldg(0xb9ad98, 14, 9, 8, -2, Y, -6, 0, 3, 3);
    f.pyr(0x4f7f6f, 15, 9, 9, -2, Y + 9, -6);
    for (const sx of [-1, 1]) { f.cyl(0xb9ad98, 1.6, 1.6, 12, -2 + sx * 7, Y, -3, 8); f.cone(0x4f7f6f, 2.1, 5.2, -2 + sx * 7, Y + 12, -3, 8); }
    f.crag(0x7b7f86, 1.5, 6.5, 12, 10, Y, -8, 6, 1); f.crag(0x8d9198, 1, 4.4, 8, 12.5, Y, -3.5, 6, 2); f.crag(0xf2f7fc, 0, 1.7, 2.6, 10, Y + 11.4, -8, 6, 1);
    f.W.box(0xcfeeff, 1.6, 8.5, 0.3, 9.6, Y + 0.4, -3.6);
    f.cyl(0x7a4a2c, 0.5, 0.6, 7.2, 5, Y, 3, 6);
    for (let i = 0; i < 4; i++) f.box([RED, 0x1f6f8b, GOLD, 0x1f2937][i], 1.5, 0.9, 1.1, 5, Y + 1 + i * 1.55, 3);
    f.box(RED, 4, 0.3, 0.3, 5, Y + 6.6, 3);
    // United Kingdom — half-timbered pub, Hampton Court turret and a red phone box.
    f = pav(150, 'UNITED KINGDOM', '英国', '#1e3a8a', '#fef3c7');
    f.bldg(0xf2ead8, 12, 6.5, 8, -3, Y, -6, 0, 3, 3.2); f.gable(0x6b4a34, 9.4, 4, 12.8, -3, Y + 6.5, -6, PI / 2);
    for (let i = -2; i <= 2; i++) f.box(0x3a2a20, 0.26, 6.5, 0.12, -3 + i * 2.8, Y, -1.94);
    f.box(0x3a2a20, 12.1, 0.26, 0.12, -3, Y + 3.3, -1.94); f.box(0x8f4a36, 1.2, 3, 1.2, -7, Y + 8, -6);
    f.bldg(0x9c4a3a, 5, 10, 5, 6.5, Y, -6, 0, 2.5, 3.3); f.box(0xe8dcc8, 5.6, 0.6, 5.6, 6.5, Y + 10, -6);
    for (const [ax, az] of [[-1, -1], [1, -1], [-1, 1], [1, 1]]) { f.cyl(0x9c4a3a, 0.6, 0.6, 12, 6.5 + ax * 2.5, Y, -6 + az * 2.5, 8); f.dome(0x5b6b7a, 0.7, 6.5 + ax * 2.5, Y + 12, -6 + az * 2.5, 1.2, 8); }
    f.box(0xc81e1e, 1, 2.4, 1, 2.6, Y, 4); f.box(0xc81e1e, 1.16, 0.25, 1.16, 2.6, Y + 2.4, 4); f.G.box(0xfef3c7, 0.7, 1.5, 0.05, 2.6, Y + 0.6, 4.52);
    // France — the Eiffel Tower above Belle Époque blocks and a fountain.
    f = pav(180, 'FRANCE', '法国', '#1e3a8a', '#f8fafc');
    const IRON = 0x6b5a48;
    for (const sx of [-1, 1]) for (const sz of [-1, 1]) {
      f.rod(IRON, 0.36, sx * 4.6, Y, -9 + sz * 4.6, sx * 1.7, Y + 9, -9 + sz * 1.7, 5);
      f.rod(IRON, 0.26, sx * 1.7, Y + 9, -9 + sz * 1.7, sx * 0.55, Y + 19, -9 + sz * 0.55, 5);
    }
    f.box(IRON, 4.6, 0.5, 4.6, 0, Y + 8.8, -9); f.box(IRON, 2.2, 0.4, 2.2, 0, Y + 15, -9); f.box(IRON, 1.4, 1, 1.4, 0, Y + 19, -9);
    f.cyl(IRON, 0.1, 0.5, 7, 0, Y + 20, -9, 4);
    for (const [bx, w, c] of [[-10, 9, 0xe9dfc9], [10, 8, 0xdccfb6]]) {
      f.bldg(c, w, 8, 6, bx, Y, -3, 0, 3, 3.4);
      f.box(0x55667f, w + 0.4, 2.6, 6.4, bx, Y + 8, -3); f.box(0x44546b, w - 2, 0.4, 4.4, bx, Y + 10.6, -3);
      for (let i = -1; i <= 1; i++) f.box(0xe9dfc9, 1, 1.4, 0.5, bx + i * 2.6, Y + 8.3, 0.1);
    }
    f.cyl(STONE, 2.2, 2.5, 0.6, 0, Y, 3, 10); f.W.cone(0xdff4ff, 0.8, 2.6, 0, Y + 0.5, 3, 6);
    // Morocco — Koutoubia minaret, the Bab Boujouloud gate and ochre medina walls.
    f = pav(210, 'MOROCCO', '摩洛哥', '#14532d', '#fde68a');
    const SAND = 0xd8b98a;
    f.box(SAND, 4.2, 17, 4.2, 5, Y, -7); f.box(0x2f8f6f, 4.4, 0.8, 4.4, 5, Y + 13.4, -7); f.box(SAND, 4.8, 0.7, 4.8, 5, Y + 17, -7);
    f.box(SAND, 2, 3.4, 2, 5, Y + 17.7, -7); f.dome(SAND, 1.1, 5, Y + 21.1, -7, 1.1, 8); f.cyl(GOLD, 0.08, 0.08, 1.8, 5, Y + 22, -7, 4);
    f.box(SAND, 14, 4.6, 6, -4, Y, -7);
    for (let i = 0; i < 9; i++) f.box(SAND, 0.9, 0.8, 0.9, -10.4 + i * 1.6, Y + 4.6, -4.4);
    for (const sx of [-1, 1]) f.box(0xc9a877, 2.4, 8, 2.4, -3 + sx * 3.5, Y, -0.8);
    f.box(0x2b6cb0, 9.4, 2, 2.4, -3, Y + 6, -0.8); f.box(0x2f8f6f, 9.8, 0.5, 2.8, -3, Y + 8, -0.8);
    f.tree('palm', -9, 3, 0.8); f.tree('palm', 9, 2, 0.8);
    // Japan — five-storey pagoda, the white castle keep and the torii standing in the lagoon.
    f = pav(240, 'JAPAN', '日本', '#7f1d1d', '#fef2f2');
    for (let i = 0; i < 5; i++) {
      const w = 6 - i * 0.8;
      f.box(0xf3ede0, w * 0.62, 2.2, w * 0.62, -6, Y + i * 3.1, -6); f.pyr(0x39495c, w * 1.3, 1.1, w * 1.3, -6, Y + 2.2 + i * 3.1, -6);
      f.box(0xb3261e, w * 0.7, 0.3, w * 0.7, -6, Y + 1.9 + i * 3.1, -6);
    }
    f.cyl(GOLD, 0.08, 0.14, 4, -6, Y + 15.6, -6, 4);
    f.box(0x8b8f94, 9.4, 3, 7.4, 6, Y, -6); f.box(0xf3f0e8, 7.6, 3.4, 5.8, 6, Y + 3, -6); f.pyr(0x39495c, 9.2, 1.6, 7.2, 6, Y + 6.4, -6);
    f.box(0xf3f0e8, 4.6, 2.4, 3.6, 6, Y + 7.4, -6); f.gable(0x39495c, 4.6, 2, 5.8, 6, Y + 9.8, -6, PI / 2);
    for (const sx of [-1, 1]) f.cyl(0xc8321e, 0.36, 0.42, 6.4, sx * 2.3, WY - 0.6, 27, 8);
    f.box(0xc8321e, 6.6, 0.5, 0.6, 0, WY + 4.5, 27); f.box(0x22262e, 7.8, 0.45, 0.9, 0, WY + 5.4, 27);
    f.tree('blossom', 0, -1, 0.8); f.tree('blossom', -11, 2, 0.7);
    // The American Adventure — Georgian brick hall with portico and clock cupola.
    f = pav(270, 'THE AMERICAN ADVENTURE', '美国', '#1e3a8a', '#fef2f2');
    f.bldg(0xa8503f, 28, 10, 11, 0, Y, -8, 0, 3.2, 3.6); f.box(WHITE, 28.6, 0.6, 11.6, 0, Y + 10, -8);
    f.gable(0x4a5568, 12.6, 3.2, 28.8, 0, Y + 10.6, -8, PI / 2);
    for (let i = 0; i < 6; i++) f.cyl(WHITE, 0.45, 0.5, 8, -5.5 + i * 2.2, Y, -1.4, 8);
    f.box(WHITE, 12.6, 0.8, 2.8, 0, Y + 8, -1.6); f.gable(WHITE, 12.6, 2.6, 2.8, 0, Y + 8.8, -1.6, 0);
    f.box(WHITE, 5, 4, 5, 0, Y + 13.2, -8); f.cyl(WHITE, 2, 2, 3, 0, Y + 17.2, -8, 8); f.dome(0x4a5568, 2.3, 0, Y + 20.2, -8, 1, 10);
    f.cyl(GOLD, 0.06, 0.06, 2.4, 0, Y + 22.4, -8, 4);
    for (const sx of [-1, 1]) { f.cyl(WHITE, 0.08, 0.1, 9, sx * 10, Y, 2, 5); f.box(sx > 0 ? RED : BLUE, 2, 1.2, 0.05, sx * 10 + 1, Y + 7.6, 2); }
    // Italy — St Mark's Campanile and the Doge's Palace.
    f = pav(300, 'ITALY', '意大利', '#14532d', '#fef2f2');
    f.box(0xb5654a, 3.6, 17, 3.6, 7, Y, -7); f.box(0xf2ead8, 4, 3.2, 4, 7, Y + 17, -7); f.box(0xb5654a, 3.4, 1.6, 3.4, 7, Y + 20.2, -7);
    f.pyr(0x4f8f7a, 3.9, 4.8, 3.9, 7, Y + 21.8, -7); f.sph(GOLD, 0.36, 7, Y + 27, -7, 1, 1.4, 1, 6);
    f.bldg(0xf0c9c0, 13, 7.5, 7, -4, Y, -7, 0, 2.6, 3.8);
    for (let i = 0; i < 7; i++) f.cyl(WHITE, 0.22, 0.22, 3.2, -10 + i * 2, Y, -3.1, 6);
    f.box(WHITE, 13.4, 0.4, 1.2, -4, Y + 3.2, -3.2);
    for (let i = 0; i < 9; i++) f.cone(WHITE, 0.42, 0.95, -10 + i * 1.5, Y + 7.5, -3.7, 4);
    for (const sx of [-1, 1]) { f.cyl(STONE, 0.4, 0.46, 6.2, sx * 3, Y, 4, 8); f.sph(GOLD, 0.5, sx * 3, Y + 6.7, 4, 1, 1, 1, 6); }
    // Germany — stepped-gable Biergarten, glockenspiel clock tower and St George's fountain.
    f = pav(330, 'GERMANY', '德国', '#1c1917', '#fde047');
    f.bldg(0xf2e2b8, 10, 8, 7, -5, Y, -7, 0, 2.8, 3.2); f.gable(0x8f4a36, 10.4, 5, 7.4, -5, Y + 8, -7.3, 0);
    for (let i = 0; i < 4; i++) f.box(0xf2e2b8, 8.4 - i * 2.2, 1.3, 0.8, -5, Y + 8 + i * 1.3, -3.7);
    f.box(0xe9d7a8, 4, 14, 4, 5, Y, -7); f.box(WHITE, 2.2, 2.2, 0.16, 5, Y + 9.6, -4.94); f.box(DARK, 0.12, 0.95, 0.1, 5, Y + 10.6, -4.84);
    f.pyr(0x3f6f5f, 4.7, 5.2, 4.7, 5, Y + 14, -7); f.sph(GOLD, 0.3, 5, Y + 19.6, -7, 1, 1, 1, 6);
    f.box(0xb9ad98, 6, 5, 3, 0, Y, -9.5);
    f.cyl(STONE, 1.8, 2, 0.6, 0, Y, 3, 10); f.cyl(STONE, 0.3, 0.36, 4.6, 0, Y + 0.6, 3, 6); f.sph(0x7d8791, 0.6, 0, Y + 5.7, 3, 1, 1.3, 1, 6);
    // China — the Temple of Heaven's Hall of Prayer and a paifang gate.
    f = pav(0, 'CHINA', '中国', '#7f1d1d', '#fde047');
    f.cyl(WHITE, 8.6, 9.1, 1, 0, Y, -6, 22); f.cyl(WHITE, 7, 7.5, 0.8, 0, Y + 1, -6, 22);
    f.cyl(RED, 5, 5, 4.4, 0, Y + 1.8, -6, 18);
    for (const [rr, yy] of [[7.4, 6.2], [6, 10], [4.6, 13.8]]) f.cone(0x1d4f9c, rr, 2.7, 0, Y + yy, -6, 22);
    f.cyl(RED, 3.9, 3.9, 1.8, 0, Y + 8.3, -6, 18); f.cyl(RED, 2.9, 2.9, 1.8, 0, Y + 12.1, -6, 18); f.sph(GOLD, 0.7, 0, Y + 16.9, -6, 1, 1.3, 1, 8);
    for (const sx of [-1, 1]) f.cyl(RED, 0.36, 0.36, 5, sx * 3, Y, 5.5, 8);
    f.box(0x1d4f9c, 8.6, 0.5, 1.3, 0, Y + 5, 5.5); f.box(0x1f6b4a, 5.2, 0.9, 0.5, 0, Y + 4, 5.5);
    // Norway — stave church and the Akershus fortress tower.
    f = pav(30, 'NORWAY', '挪威', '#1e3a8a', '#fef2f2');
    for (let i = 0; i < 4; i++) { const w = 7 - i * 1.6; f.box(0x4a3426, w, 2.6, w, -5, Y + i * 3, -6); f.pyr(0x2f241c, w + 1.8, 2.3, w + 1.8, -5, Y + 2.6 + i * 3, -6); }
    f.cone(0x2f241c, 0.6, 4.2, -5, Y + 13.6, -6, 4);
    f.cyl(0x8b8f94, 3, 3.2, 10, 6.5, Y, -7, 10); f.cone(0x3f4a52, 3.5, 4.6, 6.5, Y + 10, -7, 10); f.box(0x8b8f94, 8, 5, 3, 0.5, Y, -9.5);
    f.box(0xb5503f, 5, 3, 4, 1, Y, -2.5); f.gable(0x4f8a3f, 5.6, 2, 4.8, 1, Y + 3, -2.5, PI / 2);
    f.tree('pine', -11, 2, 0.7); f.tree('pine', 11, 1, 0.7);
    // Mexico — Mesoamerican stepped pyramid.
    f = pav(60, 'MEXICO', '墨西哥', '#14532d', '#fef2f2');
    for (let i = 0; i < 5; i++) {
      const w = 20 - i * 3.4;
      f.box(i % 2 ? 0xb9a47c : 0xc9b48c, w, 2.6, w * 0.8, 0, Y + i * 2.6, -8);
      f.box(0x9c8860, 3.6, 2.6, 1.6, 0, Y + i * 2.6, -8 + w * 0.4 + 0.5);
    }
    f.box(0xb9a47c, 5, 3, 4, 0, Y + 13, -8); f.box(RED, 5.6, 0.6, 4.6, 0, Y + 16, -8); f.G.box(0xfbbf24, 1.6, 2, 0.1, 0, Y + 13.2, -5.95);
    for (const sx of [-1, 1]) { f.sph(0x4f8a6f, 0.8, sx * 2.6, Y + 0.8, 2.2, 1, 1, 1.5, 6); f.tree('palm', sx * 11, 1, 0.8); }

    /* =============== LAGOON: promenade lamps, the globe barge and the Friendship Boat =============== */
    for (let i = 0; i < 24; i++) {
      const a = i * PI / 12 + PI / 24;
      lamp(L.x + Math.cos(a) * (L.rx + 2.2), L.z + Math.sin(a) * (L.rz + 2.2), 4.4);
    }
    const globe = K.asm(L.x, WY + 4.6, L.z);
    globe.S.poly(0x2b6cb0, 3.2, 0, 0, 0, 2); globe.S.ico(0x4f9a4a, 3.24, 0.3, 0.2, 0, 0.9, 0.7, 0.9, 1);
    globe.S.tor(GOLD, 3.9, 0.12, 0, 0, 0, PI / 2 - 0.4, 0, 0, PI * 2, 24);
    globe.done();
    S.cyl(DARK, 4.6, 5, 0.9, L.x, WY - 0.3, L.z, 12); S.cyl(STEEL, 0.5, 0.9, 1.6, L.x, WY + 0.5, L.z, 8);
    updaters.push((dt) => { globe.grp.rotation.y += dt * 0.25; });

    const fbPts = [];
    for (let i = 0; i < 16; i++) { const a = PI / 2 + i * PI / 8; fbPts.push([L.x + Math.cos(a) * 31, WY - Y + 0.12, L.z + Math.sin(a) * 20.5]); }
    const fbTrack = K.track(fbPts, {});
    const fb = K.asm(0, 0, 0), fs = fb.S;
    fs.box(WHITE, 3.2, 1, 9.4, 0, -0.3, 0); fs.box(BLUE, 3.3, 0.3, 9.5, 0, 0.3, 0); fs.box(WHITE, 2.2, 0.9, 1.6, 0, -0.2, 5.2, 0, 0.3);
    for (const x of [-1.4, 1.4]) for (const z of [-3.6, -1.2, 1.2, 3.6]) fs.cyl(GOLD, 0.06, 0.06, 2, x, 0.7, z, 4);
    fs.box(0x1e3a8a, 3.4, 0.2, 8.4, 0, 2.7, 0); fs.box(0x8b5e38, 2.6, 0.2, 8, 0, 0.62, 0);
    fb.G.sph(0xffe9a8, 0.2, 0, 1.4, 4.6, 1, 1, 1, 5);
    const fbRide = K.trainRide({
      id: 'friendship_boat', name: '友谊号游船 · 世界橱窗环湖巡游', land: 'epcot_showcase', track: fbTrack,
      cars: [fb.done()], gap: 0, speed: 5.2, lift: 0, eye: 2.3, back: 12,
      boardPos: { x: L.x, y: Y, z: L.z + L.rz + 4 }, exitPos: { x: L.x + 5, y: Y, z: L.z + L.rz + 5, yaw: 0 },
      events: [
        [0.03, '⛴️ 友谊号离港！左舷依次是加拿大城堡酒店与英国都铎酒馆'],
        [0.22, '🗼 法国馆的埃菲尔铁塔与摩洛哥库图比亚宣礼塔'],
        [0.4, '⛩️ 水中的朱红鸟居与五重塔——日本馆；正前方是美国独立厅'],
        [0.57, '🛶 威尼斯钟楼与总督宫——意大利；隔壁是德国钟楼广场'],
        [0.73, '🏮 北京天坛祈年殿！随后是挪威木板教堂'],
        [0.9, '🌋 最后是墨西哥的玛雅金字塔，游船即将回到码头']
      ],
      doneMsg: '⚓ 环球一周完成！友谊号已回到世界橱窗码头。'
    });
    rides.friendship_boat = fbRide.ride;
    updaters.push((dt, t, ev) => fbRide.update(dt, ev));
    S.box(0x8b5e38, 7, 0.4, 5, L.x, Y - 0.4, L.z + L.rz - 1.5);
    for (const sx of [-1, 1]) S.cyl(0x5b3f2a, 0.2, 0.2, 2.4, L.x + sx * 3.3, Y - 1.4, L.z + L.rz - 3.6, 5);
    sign('FRIENDSHIP BOATS', 5.4, 0.9, L.x, Y + 2.8, L.z + L.rz + 0.6, 0, '#0b2545', '#fde68a', '友谊号游船码头');
    interactables.push({ id: 'epcot_torii', name: '世界橱窗 · 环球护照', x: L.x - 8, y: Y, z: L.z + L.rz + 6, msg: '🛂 环球护照盖章成功！十一国展馆任你走——别忘了在每个国家馆找文化大使聊聊。' });

    /* =============== DISNEY SKYLINER (EPCOT ⇄ Hollywood Studios) =============== */
    const SKH = 16, Z0 = 302, Z1 = 500;
    const skPts = [[EX - 2.6, SKH, Z0 + 4], [EX - 2.6, SKH, 400], [EX - 2.6, SKH, Z1 - 4], [EX, SKH, Z1], [EX + 2.6, SKH, Z1 - 4], [EX + 2.6, SKH, 400], [EX + 2.6, SKH, Z0 + 4], [EX, SKH, Z0]];
    const sk = K.track(skPts, { beam: { col: DARK, r: 0.09, drop: 0 }, samples: 220 });
    for (let z = 336; z <= 470; z += 44) {
      for (const sx of [-1, 1]) S.rod(WHITE, 0.4, EX + sx * 14.5, Y, z, EX + sx * 4.2, Y + SKH + 1, z, 6);
      S.box(WHITE, 9.4, 0.6, 0.8, EX, Y + SKH + 0.7, z);
      for (const sx of [-1, 1]) S.cyl(DARK, 0.5, 0.5, 0.3, EX + sx * 2.6, Y + SKH + 0.05, z, 8, PI / 2);
    }
    const station = (z, dir, title, cn) => {
      S.box(0xe8eef5, 12, 0.5, 14, EX, Y + SKH + 2.4, z); S.box(TEAL, 12.6, 0.35, 14.6, EX, Y + SKH + 2.9, z);
      for (const sx of [-1, 1]) for (const sz of [-1, 1]) S.cyl(WHITE, 0.3, 0.36, SKH + 2.4, EX + sx * 5.4, Y, z + sz * 6, 6);
      S.box(STEEL, 10, 0.3, 12, EX, Y + SKH - 3.9, z);
      S.box(SILVER, 3, 0.25, 19.5, EX + 7, Y + (SKH - 3.9) / 2, z + dir * 3, 0, dir * Math.atan2(SKH - 3.9, 15));
      sign(title, 8, 1.2, EX, Y + SKH + 4, z - dir * 7.4, dir > 0 ? PI : 0, '#0b2545', '#fde68a', cn);
      foot(EX, z, 10);
    };
    station(Z0 + 3, 1, 'DISNEY SKYLINER', 'EPCOT 站 · 国际门户');
    station(Z1 - 3, -1, 'DISNEY SKYLINER', '好莱坞影城站');
    const cabin = (c) => {
      const a = K.asm(0, 0, 0), s = a.S;
      s.rod(DARK, 0.07, 0, 0, 0, 0, -1.15, 0, 4); s.box(c, 2.1, 0.35, 2.7, 0, -1.5, 0);
      s.box(0x9fd3ff, 2.0, 1.3, 2.6, 0, -2.8, 0); s.box(c, 2.1, 0.95, 2.7, 0, -3.75, 0);
      return a.done();
    };
    const skCols = [RED, BLUE, GOLD, TEAL, PURPLE, 0xf97316, 0x16a34a, 0xdb2777];
    const skRide = K.trainRide({
      id: 'skyliner_ride', name: '迪士尼天际缆车（EPCOT ⇄ 好莱坞影城）', land: 'epcot', track: sk,
      cars: skCols.map(cabin), gap: sk.len / 8, speed: 5.5, auto: true, lift: 0, eye: -2.5, back: 10,
      boardPos: { x: EX, y: Y, z: Z0 - 3 }, exitPos: { x: EX - 6, y: Y, z: Z0 - 5, yaw: 0 },
      events: [[0.08, '🚡 缆车驶离 EPCOT 国际门户站，向南飞越度假区大道'], [0.45, '🎬 抵达好莱坞影城站上空——前方掉头返航'], [0.58, '🌐 回程：正前方银色巨球就是地球号太空船']]
    });
    rides.skyliner_ride = skRide.ride;
    updaters.push((dt, t, ev) => skRide.update(dt, ev));

    for (let i = 0; i < 6; i++) { lamp(EX - 26 + i * 10.4, 246, 4.6); lamp(EX - 26 + i * 10.4, 206, 4.6); }
    for (let z = 310; z <= 490; z += 18) { lamp(EX - 9.5, z, 4.2); lamp(EX + 9.5, z + 9, 4.2); }
  });
})(window);

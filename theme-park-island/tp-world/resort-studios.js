/* Minest My World · Walt Disney World Resort — part 2: Disney's Hollywood Studios.
 * Pan-Pacific gate (north) → Hollywood Boulevard → Chinese Theatre; Sunset Boulevard east to the Hollywood Tower
 * Hotel and the Rock 'n' Roller Coaster guitar; Echo Lake west with Gertie; Toy Story Land to the south-west.
 * Guests arrive from the north, so façades and signs face −z. */
(function (root) {
  'use strict';

  (root.TPResortParts = root.TPResortParts || []).push(function (ctx) {
    const { K, R, Y, WY, foot, updaters, rides, interactables } = ctx;
    const { S, G, W, T, bldg, sign, tree, lamp } = K;
    const PI = Math.PI, H = R.studios, HX = H.x;
    const WHITE = 0xf8f5ee, CREAM = 0xf2e6cf, MINT = 0x7fd1c0, MINT2 = 0x4fae9c, DARK = 0x27303c, GOLD = 0xe7b83a;
    const RED = 0xc8321e, BLUE = 0x2563eb, SALMON = 0xcf9480, SALMON2 = 0xbd806c, TILE = 0x8f3a2c, SILVER = 0xcfd8e3;

    /* =============== PAN-PACIFIC ENTRANCE GATE & CROSSROADS OF THE WORLD =============== */
    const GZ = H.zGate;
    for (const ox of [-15, -5, 5, 15]) {
      S.box(MINT, 2.4, 8.5, 3, HX + ox, Y, GZ);
      for (let i = 0; i < 3; i++) S.box(i % 2 ? WHITE : MINT2, 0.5, 11.5 - i * 1.6, 3.6 - i * 0.5, HX + ox + (i - 1) * 0.75, Y, GZ - 0.4);
      S.cyl(WHITE, 0.06, 0.08, 4, HX + ox, Y + 11.5, GZ - 0.4, 4); S.box(RED, 1.3, 0.7, 0.05, HX + ox + 0.7, Y + 14.6, GZ - 0.4);
      foot(HX + ox, GZ, 4);
    }
    S.box(WHITE, 33, 0.6, 4.4, HX, Y + 4.4, GZ + 0.4); S.box(MINT2, 33.4, 0.3, 4.8, HX, Y + 5, GZ + 0.4);
    for (const ox of [-10, 0, 10]) { S.box(CREAM, 3.2, 2.6, 2.4, HX + ox, Y, GZ + 0.6); G.box(0xfde68a, 2, 1, 0.1, HX + ox, Y + 1.2, GZ - 0.65); }
    sign('DISNEY’S HOLLYWOOD STUDIOS', 16, 2, HX, Y + 7, GZ - 2, PI, '#0f3b36', '#fef3c7', '好莱坞影城');
    const CZ = 528;
    S.cyl(CREAM, 3, 3.2, 3.4, HX, Y, CZ, 12); S.cyl(MINT2, 4, 4, 0.4, HX, Y + 3.4, CZ, 12);
    for (let i = 0; i < 5; i++) S.cyl(i % 2 ? MINT : CREAM, 1.6 - i * 0.28, 1.9 - i * 0.28, 2.4, HX, Y + 3.8 + i * 2.4, CZ, 8);
    S.poly(0x2b6cb0, 1.5, HX, Y + 17.2, CZ, 2); S.tor(GOLD, 1.75, 0.08, HX, Y + 17.2, CZ, PI / 2, 0, 0, PI * 2, 16);
    S.sph(0x15191f, 0.42, HX, Y + 19.5, CZ, 1, 1, 1, 8); S.sph(RED, 0.4, HX, Y + 18.9, CZ, 1, 1, 1, 8);
    for (const sx of [-1, 1]) S.sph(0x15191f, 0.26, HX + sx * 0.42, Y + 19.95, CZ, 1, 1, 0.4, 8);
    foot(HX, CZ, 5);
    interactables.push({ id: 'crossroads', name: '十字路口塔 · Crossroads of the World', x: HX, y: Y, z: CZ - 5, msg: '🎬 灯光、摄影、开拍！你站在好莱坞的十字路口——塔顶踩着地球仪的正是米奇。' });

    /* =============== HOLLYWOOD BOULEVARD =============== */
    const shop = (sx, zc, col, trim, h, name, neon) => {
      const cx = HX + sx * 16, fx = cx - sx * 6;
      bldg(col, 12, h, 13, cx, Y, zc, 0, 3.2, 4);
      S.box(trim, 12.6, 0.5, 13.6, cx, Y + h, zc);
      for (let i = 0; i < 3; i++) S.box(i === 1 ? trim : col, 0.9, 1 + (i === 1 ? 1.6 : 0.6), 4.6 - i * 0.2, fx - sx * 0.2, Y + h + 0.5, zc + (i - 1) * 3.2);
      G.box(neon, 0.14, 0.35, 12.4, fx - sx * 0.12, Y + 4.4, zc);
      S.box(trim, 2.6, 0.2, 10.6, fx - sx * 1.3, Y + 3.4, zc, 0, 0, sx * 0.22);
      G.box(0xfff1c2, 0.1, 2.2, 9.6, fx - sx * 0.08, Y + 0.6, zc);
      sign(name, 8.4, 1.1, fx - sx * 0.2, Y + h - 1.5, zc, sx > 0 ? -PI / 2 : PI / 2, '#101820', '#fde68a');
      foot(cx, zc, 9);
    };
    shop(-1, 541, 0xf3d9c0, MINT2, 8.5, 'MICKEY’S OF HOLLYWOOD', 0xfb7185);
    shop(-1, 555, 0xcfe7e0, 0xd97706, 10, 'KEYSTONE CLOTHIERS', 0x38bdf8);
    shop(-1, 569, 0xf6e7b4, RED, 8, 'THE DARKROOM', 0xfacc15);
    shop(-1, 583, 0xe8c9b0, 0x7c4a2a, 9.5, 'THE HOLLYWOOD BROWN DERBY', 0xfb923c);
    shop(1, 541, 0xd8e4f2, BLUE, 9.5, 'CELEBRITY 5 & 10', 0xa78bfa);
    shop(1, 583, 0xf3d0d6, MINT2, 8.5, 'THE TROLLEY CAR CAFÉ', 0x34d399);
    S.dome(0x7c4a2a, 4.4, HX - 16, Y + 10, 583, 0.9, 14); S.cyl(0x7c4a2a, 5, 5, 0.3, HX - 16, Y + 10, 583, 14);   // the Derby hat
    for (let z = 534; z <= 590; z += 14) for (const sx of [-1, 1]) {
      if (sx > 0 && z > 552 && z < 580) continue;
      tree('palm', HX + sx * 7.6, z, 0.9); lamp(HX + sx * 6.2, z + 7, 4.4);
    }
    // A red Pacific Electric trolley parked on the boulevard.
    S.box(RED, 2.6, 2.4, 8, HX, Y + 0.5, 548); S.box(CREAM, 2.7, 0.9, 8.1, HX, Y + 2, 548); S.box(0x8f2418, 2.9, 0.3, 8.6, HX, Y + 2.9, 548);
    for (const z of [-2.6, 2.6]) for (const sx of [-1, 1]) S.cyl(DARK, 0.4, 0.4, 0.3, HX + sx * 1.2, Y + 0.15, 548 + z, 8, 0, PI / 2);

    /* =============== CHINESE THEATRE (Mickey & Minnie's Runaway Railway) =============== */
    const TZ = H.zTheatre;
    bldg(0x8c3a30, 28, 9, 14, HX, Y, TZ + 2, 0, 4, 9);
    S.box(0x6d2a22, 28.6, 0.6, 14.6, HX, Y + 9, TZ + 2);
    S.box(0x7a2f27, 13, 11, 9, HX, Y, TZ - 3);
    for (const sx of [-1, 1]) {
      S.cyl(RED, 0.9, 0.95, 10.4, HX + sx * 5.2, Y, TZ - 8.2, 10);
      S.box(0x6b5a48, 2.2, 0.5, 2.2, HX + sx * 5.2, Y + 10.4, TZ - 8.2);
      S.box(0xb9ad98, 3.2, 13, 3.2, HX + sx * 12, Y, TZ - 5.4); S.pyr(0x4b7f6f, 3.8, 3.4, 3.8, HX + sx * 12, Y + 13, TZ - 5.4);
      S.box(0x9aa3a0, 1.3, 1.6, 2.2, HX + sx * 8.2, Y, TZ - 10.5); S.sph(0x9aa3a0, 0.7, HX + sx * 8.2, Y + 2.1, TZ - 11.2, 1, 1, 1, 6);   // heaven dogs
    }
    S.pyr(0x4b7f6f, 20, 2.6, 13, HX, Y + 10.9, TZ - 4.2); S.pyr(0x3f6f5f, 15, 9, 9.6, HX, Y + 11.6, TZ - 4.2);
    S.cyl(GOLD, 0.1, 0.16, 2.4, HX, Y + 20.4, TZ - 4.2, 4);
    S.box(0x2a1a14, 7, 6.4, 0.4, HX, Y, TZ - 7.6); G.box(0xfbbf24, 5.4, 4.6, 0.12, HX, Y + 0.4, TZ - 7.85);
    for (let i = 0; i < 12; i++) S.box(i % 2 ? 0xb0a48f : 0xc9bda8, 1.5, 0.06, 1.5, HX - 7.5 + (i % 6) * 3, Y + 0.02, TZ - 14 + ((i / 6) | 0) * 2.4);
    sign('CHINESE THEATRE', 11, 1.7, HX, Y + 8.2, TZ - 9.3, PI, '#3b0d0a', '#fde68a', 'Mickey & Minnie’s Runaway Railway · 米奇米妮失控火车');
    foot(HX, TZ, 18);
    interactables.push({ id: 'handprints', name: '中国大剧院 · 星光手印', x: HX, y: Y, z: TZ - 14, msg: '🖐️ 你把手按进水泥方砖——旁边正是米奇、唐老鸭和高飞的手印与签名！' });

    /* =============== SUNSET BOULEVARD =============== */
    const sShop = (x, zs, col, trim, h, name) => {
      const zc = H.zSunset + zs * 17;
      bldg(col, 14, h, 12, x, Y, zc, 0, 3.4, 4);
      S.box(trim, 14.6, 0.5, 12.6, x, Y + h, zc);
      S.box(trim, 12.4, 0.2, 2.4, x, Y + 3.4, zc - zs * 7.1, 0, -zs * 0.22);
      sign(name, 9, 1.1, x, Y + h - 1.4, zc - zs * 6.1, zs < 0 ? 0 : PI, '#101820', '#fde68a');
      foot(x, zc, 10);
    };
    sShop(648, -1, 0xf6e7b4, 0xd97706, 8.5, 'SUNSET RANCH MARKET');
    sShop(664, -1, 0xf4f1ea, BLUE, 9, 'CARTHAY CIRCLE');
    sShop(648, 1, 0xd8e4f2, MINT2, 9, 'LEGENDS OF HOLLYWOOD');
    sShop(662, 1, 0xf3d0d6, RED, 8, 'BEVERLY SUNSET');
    S.box(0xf4f1ea, 4.4, 9, 4.4, 664, Y + 9, 549); S.cyl(0xf4f1ea, 1.8, 1.8, 3, 664, Y + 18, 549, 8); S.dome(BLUE, 2, 664, Y + 21, 549, 1.2, 10);
    S.cyl(GOLD, 0.06, 0.06, 2, 664, Y + 23.4, 549, 4);
    for (let x = 640; x <= 676; x += 12) { tree('palm', x, H.zSunset - 6.5, 1); tree('palm', x + 6, H.zSunset + 6.5, 1); lamp(x + 3, H.zSunset - 5.4, 4.4); }

    // Rock 'n' Roller Coaster: the 12-metre Stratocaster in front of G-Force Records.
    const RX = 678, RZ = 596;
    bldg(0x3d4756, 18, 9, 10, RX + 2, Y, RZ + 8, 0, 4.5, 9);
    S.sph(RED, 3.3, RX, Y + 4.4, RZ, 1, 1.15, 0.22, 14); S.sph(RED, 2.5, RX, Y + 7.8, RZ, 1, 1, 0.22, 14);
    S.sph(WHITE, 1.9, RX, Y + 5, RZ - 0.4, 1, 1.1, 0.2, 12);
    S.box(0x3a2a20, 0.9, 9.5, 0.36, RX, Y + 9.6, RZ); S.box(RED, 1.7, 2.4, 0.4, RX + 0.2, Y + 19, RZ);
    for (let i = -2; i <= 2; i++) G.box(0xfef3c7, 0.04, 14, 0.04, RX + i * 0.14, Y + 5, RZ - 0.5);
    S.rod(0x3a2a20, 0.3, RX + 0.2, Y + 21.4, RZ, RX + 8, Y + 12, RZ + 6, 6);
    sign('ROCK ’N’ ROLLER COASTER', 10, 1.3, RX + 2, Y + 6.6, RZ + 2.9, PI, '#190a1f', '#f0abfc', 'Starring Aerosmith · 摇滚过山车');
    foot(RX + 2, RZ + 6, 12);

    /* =============== THE HOLLYWOOD TOWER HOTEL — The Twilight Zone Tower of Terror =============== */
    const TX = H.tower.x, TWZ = H.tower.z;
    bldg(SALMON, 14, 40, 20, TX + 4, Y, TWZ, 0, 3.4, 4);
    for (const sz of [-1, 1]) {
      bldg(SALMON2, 11, 28, 9, TX + 3, Y, TWZ + sz * 14.5, 0, 3.4, 4);
      S.pyr(TILE, 12, 4.4, 10, TX + 3, Y + 28, TWZ + sz * 14.5);
      S.cyl(SALMON, 1.8, 1.8, 5, TX - 2.6, Y + 28, TWZ + sz * 18.2, 8); S.dome(TILE, 2.1, TX - 2.6, Y + 33, TWZ + sz * 18.2, 1.3, 10);
      for (const sx of [-1, 1]) { S.cyl(SALMON, 1.5, 1.5, 4.2, TX + 4 + sx * 6.2, Y + 40.8, TWZ + sz * 9.2, 8); S.dome(TILE, 1.8, TX + 4 + sx * 6.2, Y + 45, TWZ + sz * 9.2, 1.3, 10); }
      S.box(0x1a1320, 0.5, 5.4, 4.4, TX - 3.1, Y + 30, TWZ + sz * 5);
      S.box(CREAM, 0.7, 0.5, 5.4, TX - 3.2, Y + 35.4, TWZ + sz * 5); S.box(CREAM, 0.7, 0.5, 5.4, TX - 3.2, Y + 29.5, TWZ + sz * 5);
    }
    for (const yy of [13, 26, 40]) S.box(CREAM, 14.8, 0.8, 20.8, TX + 4, Y + yy, TWZ);
    S.box(SALMON, 8, 5.4, 10, TX + 5, Y + 40.8, TWZ); S.pyr(TILE, 9.2, 4.8, 11.2, TX + 5, Y + 46.2, TWZ);
    S.cyl(GOLD, 0.08, 0.14, 3.4, TX + 5, Y + 51, TWZ, 4);
    S.box(0x2a1f24, 0.4, 10, 14, TX - 3.05, Y + 17, TWZ);                                    // the lightning-scorched gash
    sign('THE HOLLYWOOD TOWER HOTEL', 13, 2.6, TX - 3.4, Y + 23, TWZ, -PI / 2, '#1c1018', '#fca5a5');
    for (const [y0, y1, z0, z1] of [[52, 46, 3, -1], [46, 41, -1, 4], [41, 36, 4, 0], [36, 28, 0, 2]]) G.rod(0xfde047, 0.16, TX - 3.4, Y + y0, TWZ + z0, TX - 3.4, Y + y1, TWZ + z1, 4);
    bldg(SALMON, 6, 7, 24, TX - 6, Y, TWZ, 0, 3, 7); S.box(TILE, 7, 0.6, 25, TX - 6, Y + 7, TWZ);
    for (let i = -2; i <= 2; i++) { S.cyl(CREAM, 0.3, 0.34, 4.6, TX - 10, Y, TWZ + i * 4.4, 6); }
    S.box(TILE, 3.4, 0.4, 22, TX - 9.6, Y + 4.6, TWZ, 0, 0, 0.18);
    for (const sz of [-1, 1]) { S.box(0xb9ad98, 1.6, 4.4, 1.6, TX - 22, Y, TWZ + sz * 4.6); S.sph(0xb9ad98, 0.7, TX - 22, Y + 4.9, TWZ + sz * 4.6, 1, 1, 1, 6); }
    sign('THE TWILIGHT ZONE · TOWER OF TERROR', 9, 1.3, TX - 22.2, Y + 6.2, TWZ, -PI / 2, '#1c1018', '#fde047', '暮光之城 · 恐怖魔塔');
    for (const sz of [-1, 1]) S.cyl(DARK, 0.1, 0.1, 6.2, TX - 22, Y, TWZ + sz * 4.6, 4);
    foot(TX + 2, TWZ, 26);

    const car = K.asm(TX - 3.9, Y + 2, TWZ - 5);
    car.S.box(0x3b2a2f, 2.4, 3.3, 3.6, 0, 0, 0); car.S.box(GOLD, 2.5, 0.2, 3.7, 0, 3.3, 0);
    car.G.box(0xfde68a, 0.1, 2.5, 3, -1.22, 0.4, 0);
    car.done();
    const KF = [[0, 2], [5, 2], [13, 30.4], [16.5, 30.4], [17.6, 9], [19.5, 9], [22.5, 30.4], [24.5, 30.4], [25.7, 3], [27.5, 3], [30, 26], [31, 26], [32.1, 2], [35, 2]];
    const END = 35;
    const hAt = (tt) => {
      for (let i = 1; i < KF.length; i++) if (tt <= KF[i][0]) {
        const a = KF[i - 1], b = KF[i];
        let k = (tt - a[0]) / (b[0] - a[0]);
        k = b[1] < a[1] ? k * k : k * k * (3 - 2 * k);
        return a[1] + (b[1] - a[1]) * k;
      }
      return 2;
    };
    const EVS = [
      [0.4, '🛎️ 门童：「欢迎光临好莱坞高塔酒店……请乘服务电梯。」'],
      [5, '🕯️ 电梯缓缓上升——你即将跨入第五维度'],
      [13, '🌆 13 层到了！大门打开，整个好莱坞影城就在脚下……'],
      [16.5, '⚡ 闪电击中酒店——整厢自由落体！！'],
      [19.6, '⬆️ 又被拉回顶层——抓紧扶手！'],
      [24.5, '⚡ 再次坠落！'],
      [30, '😱 最后一次……']
    ];
    const tot = { t: 0, active: false, run: true };
    updaters.push((dt, t, ev) => {
      if (tot.run) {
        const prev = tot.t; tot.t += dt;
        if (tot.active && ev) for (const e of EVS) if (prev < e[0] && tot.t >= e[0]) ev(e[1]);
        if (tot.t >= END) {
          tot.t = 0;
          if (tot.active) { tot.run = false; if (ev) ev('🏨 电梯回到大堂。「下次入住，请务必再搭这部电梯。」'); }
        }
      }
      car.grp.position.y = Y + hAt(tot.t);
    });
    rides.tower_of_terror = {
      id: 'tower_of_terror', name: '暮光之城恐怖魔塔 · Tower of Terror', land: 'hollywood',
      boardPos: { x: TX - 14, y: Y, z: TWZ }, exitPos: { x: TX - 18, y: Y, z: TWZ + 3, yaw: PI / 2 },
      start: () => { if (!tot.active) { tot.active = true; tot.t = 0; } tot.run = true; },
      stop: () => { tot.run = false; },
      isRunning: () => tot.run,
      onExit: () => { tot.active = false; tot.run = true; },
      getCameraPose: (third) => {
        const cy = car.grp.position.y;
        if (third) return { px: TX - 40, py: Y + 10 + (cy - Y) * 0.5, pz: TWZ - 24, tx: TX - 3, ty: cy + 1.5, tz: TWZ - 5 };
        return { px: TX - 4.6, py: cy + 1.75, pz: TWZ - 5, tx: TX - 44, ty: cy - 5, tz: TWZ + 2 };
      }
    };

    /* =============== ECHO LAKE =============== */
    const LX = H.lake.x, LZ = H.lake.z, DINO = 0x5fae5a;
    S.sph(DINO, 2.6, LX - 9, WY + 2.3, LZ, 1.5, 1, 1, 10);
    S.rod(DINO, 0.95, LX - 6.6, WY + 3, LZ, LX - 4.4, WY + 8.8, LZ + 0.6, 8);
    S.sph(DINO, 1.1, LX - 3.6, WY + 9.4, LZ + 0.8, 1.6, 0.9, 1, 8); S.sph(0x15191f, 0.16, LX - 3, WY + 9.8, LZ + 1.7, 1, 1, 1, 5);
    S.rod(DINO, 0.7, LX - 12, WY + 2.6, LZ, LX - 15.6, WY + 0.8, LZ - 1.4, 6);
    for (const [ax, az] of [[-7.4, 1.4], [-7.4, -1.4], [-10.6, 1.4], [-10.6, -1.4]]) S.cyl(DINO, 0.6, 0.7, 2.6, LX + ax, WY - 0.6, LZ + az, 7);
    G.box(0xfde68a, 2.2, 1.2, 0.1, LX - 9, WY + 1.6, LZ + 2.62);
    sign('DINOSAUR GERTIE’S', 5.4, 0.9, LX - 9, Y + 5.4, LZ + 13.4, PI, '#14532d', '#fef3c7', 'Ice Cream of Extinction · 恐龙葛蒂冰淇淋');
    S.cyl(0x4a3a2c, 0.12, 0.14, 5, LX - 9, Y, LZ + 13.4, 5);
    const tramp = K.asm(LX + 8, WY, LZ + 4), ts = tramp.S;
    ts.box(0x2f3a48, 3.8, 1.6, 11, 0, -0.4, 0); ts.box(RED, 3.9, 0.3, 11.1, 0, 0.4, 0); ts.box(WHITE, 3, 2.2, 5, 0, 1.2, -1);
    ts.cyl(RED, 0.6, 0.7, 2.6, 0, 3.4, -1.6, 8); ts.cyl(0x15191f, 0.64, 0.64, 0.5, 0, 5.6, -1.6, 8); ts.cyl(0x7a5a3c, 0.1, 0.12, 5, 0, 1.2, 3.6, 4);
    tramp.grp.rotation.y = 0.5; tramp.done();
    updaters.push((dt, t) => { tramp.grp.position.y = WY + Math.sin(t * 0.8) * 0.06; tramp.grp.rotation.z = Math.sin(t * 0.6) * 0.015; });
    for (let i = 0; i < 12; i++) { const a = i * PI / 6; lamp(LX + Math.cos(a) * 18, LZ + Math.sin(a) * 14, 4.2); }
    // Indiana Jones Epic Stunt Spectacular.
    bldg(0xc9a877, 16, 8, 22, 543, Y, 599, 0, 4, 8);
    for (let i = 0; i < 4; i++) S.box(i % 2 ? 0xb9976a : 0xa8875c, 3 - i * 0.5, 2.2, 12 - i * 2.6, 551.6 + i * 0.2, Y + i * 2.2, 599);
    S.sph(0x8a6a48, 1.8, 553.6, Y + 1.8, 588, 1, 1, 1, 10);                                   // the rolling boulder
    sign('INDIANA JONES', 9, 1.4, 551.4, Y + 9.6, 599, PI / 2, '#3b2a14', '#fbbf24', 'Epic Stunt Spectacular! · 特技剧场');
    foot(543, 599, 16);

    /* =============== TOY STORY LAND =============== */
    const AX = H.toy.x, AZ = H.toy.z;
    const blocks = [[RED, 'T'], [BLUE, 'O'], [0x16a34a, 'Y']];
    for (const sx of [-1, 1]) blocks.forEach(([c], i) => S.box(c, 2.6, 2.6, 2.6, AX + 4 + sx * 8, Y + i * 2.6, 641, i * 0.3 * sx));
    S.box(0xd9a066, 19, 2.2, 1, AX + 4, Y + 7.8, 641);
    sign('TOY STORY LAND', 12, 1.8, AX + 4, Y + 8.9, 640.4, PI, '#1e3a8a', '#fde047', '玩具总动员乐园 · 安迪的后院');
    foot(AX + 4, 641, 10);
    for (let i = 0; i < 12; i++) {                                                           // crayon fence
      const cx = AX - 30 + i * 2.2, cz = 646 - i * 0.5, c = [RED, 0xf59e0b, 0xfacc15, 0x16a34a, BLUE, 0x7c3aed][i % 6];
      S.cyl(c, 0.42, 0.42, 4 + (i % 3) * 0.6, cx, Y, cz, 8); S.cone(c, 0.42, 1, cx, Y + 4 + (i % 3) * 0.6, cz, 8);
    }
    // Slinky Dog Dash — Andy's Mega Coaster Play Kit.
    const sl = K.track([[598, 2, 650], [609, 5, 660], [612, 9, 676], [604, 7, 692], [588, 3.5, 699], [570, 6, 698], [552, 9, 690], [540, 6, 676], [542, 3.2, 660], [554, 5, 651], [568, 8, 655], [580, 5, 663], [588, 3, 655]],
      { gauge: 1.3, rail: { col: 0xf97316, r: 0.13 }, tie: { col: RED, step: 2, r: 0.1 }, sup: { col: BLUE, step: 5, r: 0.26 }, pull: 0.75 });
    const dogCar = (kind) => {
      const a = K.asm(0, 0, 0), s = a.S, BR = 0x9a6a3a;
      s.box(BR, 1.3, 0.5, 2.3, 0, 0.1, 0);
      if (kind === 0) {
        s.box(BR, 1.2, 0.9, 1.6, 0, 0.6, -0.2); s.sph(0xb07a44, 0.72, 0, 1.75, 0.9, 1, 1, 1.35, 8);
        s.sph(0x15191f, 0.2, 0, 1.75, 1.95, 1, 1, 1, 6);
        for (const x of [-1, 1]) { s.box(0x5b3a1e, 0.16, 0.9, 0.5, x * 0.7, 1.2, 0.5, 0, 0, x * 0.3); a.G.sph(0xffffff, 0.12, x * 0.3, 2.05, 1.5, 1, 1, 1, 5); }
      } else if (kind === 2) {
        s.box(BR, 1.2, 0.8, 1.4, 0, 0.6, 0.2); s.rod(SILVER, 0.07, 0, 1.2, -0.5, 0, 2.2, -1.5, 4); s.sph(BR, 0.16, 0, 2.2, -1.5, 1, 1, 1, 5);
      } else for (const z of [-0.75, 0, 0.75]) s.tor(SILVER, 0.78, 0.11, 0, 1.15, z, 0, 0, 0, PI * 2, 14);
      return a.done();
    };
    const slRide = K.trainRide({
      id: 'slinky_dog', name: '弹簧狗冲刺 · Slinky Dog Dash', land: 'toy_story', track: sl,
      cars: [dogCar(0), dogCar(1), dogCar(1), dogCar(1), dogCar(2)], gap: 2.7, speed: 7, G: 10, vmax: 19, lift: 0.15, eye: 1.7, back: 8,
      boardPos: { x: 598, y: Y, z: 645 }, exitPos: { x: 601, y: Y, z: 643, yaw: PI },
      events: [
        [0.05, '🐕 弹簧狗出发！安迪用过山车积木搭的轨道就在后院草地上'],
        [0.2, '⛰️ 爬上第一个大坡——整片玩具乐园尽收眼底'],
        [0.5, '🌀 俯冲大回环，掠过叠叠乐积木塔！'],
        [0.8, '👽 飞越外星人旋转飞碟，弹回站台']
      ],
      doneMsg: '🏁 弹簧狗冲刺完成！胡迪说：「干得漂亮，伙计！」'
    });
    rides.slinky_dog = slRide.ride;
    updaters.push((dt, t, ev) => slRide.update(dt, ev));
    S.box(0xd9a066, 7, 0.4, 10, 598, Y + 6.2, 650);
    for (const [ax, az, c] of [[-3, -4.4, RED], [3, -4.4, 0xfacc15], [-3, 4.4, 0x16a34a], [3, 4.4, BLUE]]) { S.cyl(c, 0.3, 0.3, 6.2, 598 + ax, Y, 650 + az, 6); S.cone(0xf3d9a0, 0.3, 0.8, 598 + ax, Y + 6.6, 650 + az, 6); }
    sign('SLINKY DOG DASH', 6.4, 1.1, 598, Y + 7.3, 644.9, PI, '#7c2d12', '#fde047', '弹簧狗冲刺');
    // Jenga tower, Luxo ball, Tinkertoy and Woody's Lunch Box.
    for (let i = 0; i < 9; i++) for (let k = -1; k <= 1; k++) {
      if ((i * 3 + k) % 7 === 2) continue;
      S.box(k ? 0xd9b98a : 0xcaa878, i % 2 ? 3.9 : 1.2, 0.8, i % 2 ? 1.2 : 3.9, 560 + (i % 2 ? 0 : k * 1.3), Y + i * 0.82, 672 + (i % 2 ? k * 1.3 : 0), 0.2);
    }
    S.sph(0xfacc15, 2.3, 574, Y + 2.3, 678, 1, 1, 1, 14); S.tor(BLUE, 2.18, 0.42, 574, Y + 2.3, 678, PI / 2, 0, 0, PI * 2, 20); S.sph(RED, 0.7, 574, Y + 2.3, 675.6, 1, 1, 0.3, 8);
    const hubs = [[590, 0.6, 682], [596, 0.6, 688], [586, 0.6, 690], [591, 7, 686], [591, 12, 686]];
    hubs.forEach(([x, y, z], i) => S.cyl(i === 4 ? RED : GOLD, 1, 1, 0.7, x, Y + y - 0.35, z, 10));
    for (const [a, b, c] of [[0, 3, RED], [1, 3, BLUE], [2, 3, 0x16a34a], [3, 4, 0xf97316], [0, 1, 0x7c3aed], [1, 2, RED], [2, 0, BLUE]]) S.rod(c, 0.2, hubs[a][0], Y + hubs[a][1], hubs[a][2], hubs[b][0], Y + hubs[b][1], hubs[b][2], 6);
    S.box(0x2563eb, 7, 4.4, 3.2, 600, Y, 672, 0.5); S.box(0xfacc15, 7.2, 0.5, 3.4, 600, Y + 4.4, 672, 0.5); S.tor(RED, 1.2, 0.2, 600, Y + 5, 672, 0, 0.5, 0, PI, 10);
    S.cyl(RED, 1.1, 1.1, 4.4, 606, Y, 668, 12); S.cyl(WHITE, 1.15, 1.15, 0.8, 606, Y + 4.4, 668, 12); S.cyl(0xd1d5db, 0.7, 1, 0.8, 606, Y + 5.2, 668, 12);
    sign('WOODY’S LUNCH BOX', 5.4, 0.9, 598.6, Y + 2.6, 669.4, PI, '#1e3a8a', '#fde047');
    foot(560, 672, 5); foot(574, 678, 4); foot(591, 686, 8); foot(602, 670, 7);
    // Alien Swirling Saucers.
    const SX2 = 554, SZ2 = 666;
    S.cyl(0x1e3a8a, 9.6, 9.6, 0.4, SX2, Y, SZ2, 20); S.cyl(SILVER, 0.5, 0.7, 7, SX2, Y, SZ2, 8);
    for (let i = 0; i < 8; i++) S.cyl(0x7c3aed, 0.22, 0.22, 6.4, SX2 + Math.cos(i * PI / 4) * 9.4, Y, SZ2 + Math.sin(i * PI / 4) * 9.4, 6);
    S.fan(0x38bdf8, 0x7c3aed, 10.8, 3.4, SX2, Y + 6.4, SZ2, 16);
    const sau = K.asm(SX2, Y + 0.5, SZ2);
    for (let i = 0; i < 6; i++) {
      const a = i * PI / 3, x = Math.cos(a) * 5.6, z = Math.sin(a) * 5.6;
      sau.S.cyl([RED, 0xf97316, 0x16a34a][i % 3], 1.5, 1.1, 0.6, x, 0, z, 12); sau.S.dome(0x9fd3ff, 0.9, x, 0.6, z, 0.8, 8);
      sau.S.sph(0x84cc16, 0.5, x, 1.7, z, 1, 1.15, 1, 8); sau.S.cyl(0x84cc16, 0.04, 0.04, 0.5, x, 2.2, z, 4); sau.S.sph(0x84cc16, 0.1, x, 2.75, z, 1, 1, 1, 5);
      for (let e = -1; e <= 1; e++) sau.G.sph(0xffffff, 0.11, x + Math.cos(a) * 0.42 - Math.sin(a) * e * 0.2, 1.85, z + Math.sin(a) * 0.42 + Math.cos(a) * e * 0.2, 1, 1, 1, 5);
    }
    sau.done();
    updaters.push((dt, t) => { sau.grp.rotation.y = t * 0.9 + Math.sin(t * 0.7) * 0.8; });
    sign('ALIEN SWIRLING SAUCERS', 7, 1, SX2, Y + 3.2, SZ2 - 10.4, PI, '#2e1065', '#bef264', '外星人旋转飞碟');
    foot(SX2, SZ2, 11);
    // Andy's string lights overhead.
    const poles = []; for (let i = 0; i < 7; i++) { const a = i * PI * 2 / 7 + 0.3; poles.push([AX + Math.cos(a) * 30, AZ + Math.sin(a) * 23]); }
    poles.forEach(([px, pz], i) => {
      S.cyl(0x16a34a, 0.16, 0.2, 9, px, Y, pz, 5);
      const [qx, qz] = poles[(i + 2) % 7];
      for (let k = 1; k < 14; k++) {
        const u = k / 14;
        G.sph([0xf87171, 0xfde047, 0x4ade80, 0x60a5fa, 0xf472b6][k % 5], 0.3, px + (qx - px) * u, Y + 9 - Math.sin(u * PI) * 2.2, pz + (qz - pz) * u, 1, 1.3, 1, 5);
      }
    });

    /* =============== EARFFEL TOWER & ANIMATION COURTYARD =============== */
    const EX2 = 652, EZ2 = 632;
    for (const [ax, az] of [[-1, -1], [1, -1], [-1, 1], [1, 1]]) S.rod(0xd1d5db, 0.24, EX2 + ax * 4.2, Y, EZ2 + az * 4.2, EX2 + ax * 2.6, Y + 15, EZ2 + az * 2.6, 5);
    S.tor(0xd1d5db, 4.2, 0.12, EX2, Y + 7, EZ2, PI / 2, 0, 0, PI * 2, 4);
    S.cyl(0xe5e9ee, 3.7, 3.7, 5, EX2, Y + 15, EZ2, 16); S.cone(0xb8c0ca, 4, 2.2, EX2, Y + 20, EZ2, 16);
    for (const sx of [-1, 1]) S.cyl(0x15191f, 2.6, 2.6, 0.45, EX2 + sx * 3.7, Y + 21.4, EZ2, 18, PI / 2);
    sign('WALT DISNEY PRESENTS', 7, 1, EX2, Y + 3, EZ2 - 9, PI, '#1e293b', '#fde68a', 'Animation Courtyard · 动画庭院');
    for (const sx of [-1, 1]) S.cyl(SILVER, 0.14, 0.16, 3.6, EX2 + sx * 3.2, Y, EZ2 - 9, 5);
    foot(EX2, EZ2, 7);
  });
})(window);

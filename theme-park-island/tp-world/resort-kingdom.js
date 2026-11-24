/* Minest My World · Walt Disney World Resort — part 3: Disney's Animal Kingdom, plus the resort entry point.
 * The Oasis (north) → Discovery Island and the Tree of Life inside the Discovery River ring → Pandora (west),
 * Asia / Expedition Everest (east) and Africa / Harambe with the Kilimanjaro Safaris savanna (south-west). */
(function (root) {
  'use strict';

  (root.TPResortParts = root.TPResortParts || []).push(function (ctx) {
    const { K, R, Y, WY, foot, updaters, rides, interactables } = ctx;
    const { S, G, W, bldg, sign, tree, lamp } = K;
    const PI = Math.PI, A = R.kingdom, AX = A.x, AZ = A.z;
    const WOOD = 0x6b4a2f, THATCH = 0xb89a5a, WHITE = 0xf4f1ea, GOLD = 0xe7b83a, DARK = 0x27303c, RED = 0xb3261e;

    /* =============== THE OASIS — entrance =============== */
    for (const sx of [-1, 1]) {
      const gx = AX + sx * 11;
      for (const [ax, az] of [[-3, -2.4], [3, -2.4], [-3, 2.4], [3, 2.4]]) S.cyl(WOOD, 0.3, 0.38, 4.6, gx + ax, Y, 592 + az, 6);
      S.cone(THATCH, 6, 4.2, gx, Y + 4.6, 592, 8); S.cone(0xa3854a, 3.2, 2.4, gx, Y + 7.6, 592, 8);
      S.box(0xc9a877, 5, 2.4, 3.6, gx, Y, 592);
      S.crag(0x8a7d6a, 1.4, 3.6, 4.4, AX + sx * 19, Y, 596, 6, sx); S.crag(0x9a8d78, 0.8, 2.4, 2.8, AX + sx * 22, Y, 593, 6, sx * 2);
      W.box(0xcfeeff, 1.2, 3.6, 0.25, AX + sx * 19, Y + 0.2, 598.9);
      tree('palm', AX + sx * 16, 588); tree('palm', AX + sx * 25, 599, 1.1);
      foot(gx, 592, 8);
    }
    S.box(WOOD, 18, 0.7, 0.7, AX, Y + 5.6, 592); S.rod(0xf2ead8, 0.3, AX - 4, Y + 6, 592, AX - 1.4, Y + 9.4, 592, 5); S.rod(0xf2ead8, 0.3, AX + 4, Y + 6, 592, AX + 1.4, Y + 9.4, 592, 5);
    sign('DISNEY’S ANIMAL KINGDOM', 13, 1.8, AX, Y + 7.4, 591.4, PI, '#1c2b1a', '#fde68a', '动物王国 · The Oasis');

    /* =============== DISCOVERY ISLAND — THE TREE OF LIFE =============== */
    const BARK = 0x7a5c40, BARK2 = 0x8f6f4f, BARK3 = 0x64492f;
    S.crag(BARK, 5.2, 10, 20, AX, Y, AZ, 11, 0.2); S.crag(BARK2, 4.4, 5.4, 6, AX, Y + 19, AZ, 9, 0.6);
    for (let i = 0; i < 12; i++) {
      const a = i * PI / 6 + 0.2, r1 = 15 + (i % 4) * 1.4;
      S.rod(i % 2 ? BARK : BARK3, 1.6 - (i % 3) * 0.3, AX + Math.cos(a) * 6.2, Y + 5 + (i % 3), AZ + Math.sin(a) * 6.2, AX + Math.cos(a + 0.12) * r1, Y - 0.5, AZ + Math.sin(a + 0.12) * r1 * 0.85, 6);
    }
    for (let i = 0; i < 52; i++) {                                                        // animal carvings on the trunk
      const a = i * 2.39996, h = 1.4 + (i / 52) * 18, r = 10 - (h / 20) * 4.8;
      S.poly(i % 3 ? BARK2 : 0x9c7d5a, 0.8 + (i % 4) * 0.26, AX + Math.cos(a) * r, Y + h, AZ + Math.sin(a) * r, 0, 1, 1.2, 1, i);
    }
    for (let i = 0; i < 10; i++) {
      const a = i * PI / 5 + 0.3, by = Y + 29 + (i % 3) * 2.2;
      S.rod(BARK, 1.3, AX + Math.cos(a) * 3, Y + 22, AZ + Math.sin(a) * 3, AX + Math.cos(a) * 13, by, AZ + Math.sin(a) * 13, 6);
      S.rod(BARK3, 0.7, AX + Math.cos(a) * 13, by, AZ + Math.sin(a) * 13, AX + Math.cos(a + 0.25) * 21, by + 2.5, AZ + Math.sin(a + 0.25) * 21, 5);
    }
    S.rod(BARK, 1.6, AX, Y + 24, AZ, AX + 1, Y + 35, AZ - 1, 7);
    const LEAVES = [0x2c7a3b, 0x3f8f3f, 0x1d562a, 0x4b9444];
    for (let i = 0; i < 46; i++) {
      const a = i * 2.39996, rad = Math.sqrt(i / 46) * 25, k = rad / 25;
      S.poly(LEAVES[i % 4], 5.4 + (i % 4) * 0.8, AX + Math.cos(a) * rad, Y + 40.5 - k * k * 10 + ((i % 3) - 1) * 1.2, AZ + Math.sin(a) * rad, 1, 1.25, 0.68, 1.25, i);
    }
    foot(AX, AZ, 19);
    for (const [dx, dz, along] of [[0, -23, 0], [0, 23, 0], [-27, 0, 1], [27, 0, 1]]) {     // four timber bridges
      for (const s of [-1, 1]) {
        S.box(WOOD, along ? 10 : 0.26, 1.1, along ? 0.26 : 10, AX + dx + (along ? 0 : s * 3.4), Y, AZ + dz + (along ? s * 3.4 : 0));
        for (const e of [-1, 1]) S.cyl(BARK3, 0.2, 0.22, 2.2, AX + dx + (along ? e * 4.8 : s * 3.4), Y, AZ + dz + (along ? s * 3.4 : e * 4.8), 5);
      }
    }
    sign('TREE OF LIFE', 6, 1, AX, Y + 2.6, AZ - 19.6, PI, '#1c2b1a', '#bef264', '生命之树 · It’s Tough to be a Bug!');
    for (const sx of [-1, 1]) S.cyl(WOOD, 0.14, 0.16, 2.4, AX + sx * 2.8, Y, AZ - 19.6, 5);
    interactables.push({ id: 'tree_of_life', name: '生命之树 · 动物浮雕', x: AX, y: Y, z: AZ - 17, msg: '🌳 你在树干上数到了大象、猎豹、海马和蜥蜴……整棵生命之树刻着三百多种动物！' });
    for (let i = 0; i < 16; i++) { const a = i * PI / 8 + 0.2; lamp(AX + Math.cos(a) * 36, AZ + Math.sin(a) * 32, 4); }

    /* =============== PANDORA — THE WORLD OF AVATAR =============== */
    const PX = A.pandora.x, PZ = A.pandora.z, ROCKP = 0x5f6b66, ROCKP2 = 0x74807a, MOSS = 0x3f7d4a;
    [[PX - 6, PZ - 12, 11, 20, 13], [PX + 11, PZ + 1, 8, 16, 10], [PX - 19, PZ + 2, 7.5, 14, 9], [PX + 1, PZ + 15, 6, 24, 7], [PX - 26, PZ - 14, 6.5, 26, 8]].forEach(([x, z, rr, yb, h], i) => {
      S.crag(i % 2 ? ROCKP2 : ROCKP, rr, rr * 0.16, h, x, Y + yb, z, 8, i);
      S.crag(MOSS, rr * 0.55, rr * 1.03, 2.4, x, Y + yb + h, z, 8, i);
      for (let k = 0; k < 4; k++) S.poly([0x2c7a3b, 0x4b9444, 0x1d562a][k % 3], rr * 0.42, x + Math.cos(k * 1.7 + i) * rr * 0.45, Y + yb + h + 2.6, z + Math.sin(k * 1.7 + i) * rr * 0.45, 1, 1.2, 0.75, 1.2, k);
      for (let k = 0; k < 3; k++) {
        const a = k * 2.1 + i;
        S.rod(0x3f5f3a, 0.2, x + Math.cos(a) * rr * 0.3, Y + yb + 2, z + Math.sin(a) * rr * 0.3, x + Math.cos(a) * (rr + 4), Y, z + Math.sin(a) * (rr + 4), 4);
      }
      W.box(0xcfeeff, 1.5, yb + h * 0.55, 0.3, x + rr * 0.45, Y, z + rr * 0.4, i);
      foot(x, z, 5);
    });
    S.tor(ROCKP, 7.5, 1.7, PX + 4, Y - 0.5, PZ - 2, 0, 0.7, 0, PI, 12); S.tor(ROCKP2, 5, 1.2, PX - 12, Y - 0.5, PZ + 9, 0, -0.5, 0, PI, 10);
    const GLOW = [0x22d3ee, 0xc084fc, 0xa3e635, 0xf472b6];
    for (let i = 0; i < 30; i++) {
      const a = i * 2.39996, rr = 9 + (i % 7) * 2.6, x = PX + Math.cos(a) * rr * 1.3, z = PZ + Math.sin(a) * rr * 0.9;
      S.cyl(0x2f5f4a, 0.08, 0.12, 0.9 + (i % 3) * 0.5, x, Y, z, 4);
      if (i % 3) G.sph(GLOW[i % 4], 0.34, x, Y + 1.2 + (i % 3) * 0.5, z, 1, 0.7, 1, 6); else G.cone(GLOW[i % 4], 0.5, 1.3, x, Y + 0.9, z, 6);
    }
    for (const [hx, hz] of [[PX + 18, PZ + 10], [PX - 4, PZ + 4], [PX - 22, PZ - 6]]) for (let k = 0; k < 5; k++) S.cone(0xf97316, 1.3 - k * 0.2, 0.9, hx, Y + k * 0.85, hz, 8, k);
    S.crag(ROCKP, 3, 7.5, 9, PX - 22, Y, PZ - 16, 7, 1); S.box(0x16201c, 3, 3.6, 0.5, PX - 19.4, Y, PZ - 10.4, 0.5);
    sign('AVATAR FLIGHT OF PASSAGE', 7.4, 1.1, PX - 16, Y + 4.6, PZ - 8, 0.5, '#062a2a', '#67e8f9', '阿凡达 · 飞行之旅');
    sign('NA’VI RIVER JOURNEY', 6.4, 1, PX, Y + 2.8, PZ + 15.4, PI, '#062a2a', '#d8b4fe', '纳美河之旅');
    for (const sx of [-1, 1]) S.cyl(0x3f5f3a, 0.14, 0.16, 2.6, PX + sx * 3, Y, PZ + 15.4, 5);
    S.cyl(0x9aa39a, 4.2, 4.2, 13, PX + 22, Y - 6.5, PZ - 15, 14, 0, PI / 2); S.box(0x6f7a70, 0.4, 3.4, 5, PX + 15.4, Y, PZ - 15);
    sign('SATU’LI CANTEEN', 5, 0.9, PX + 15.1, Y + 4.4, PZ - 15, -PI / 2, '#062a2a', '#fde68a');
    foot(PX, PZ, 12); foot(PX + 22, PZ - 15, 9);
    const banshees = [];
    for (let i = 0; i < 3; i++) {
      const b = K.asm(PX, Y + 34, PZ), s = b.S, c = [0x1f9e8f, 0x7c3aed, 0x2563eb][i];
      s.box(c, 0.5, 0.45, 2.8, 0, 0, 0); s.cone(c, 0.3, 1, 0, 0.1, 1.9, 5);
      for (const x of [-1, 1]) { s.box(c, 3.2, 0.1, 1.5, x * 1.7, 0.3, 0.2, 0, 0, x * 0.3); s.box(0xfde047, 1.6, 0.08, 0.9, x * 3.6, 0.9, -0.1, 0, 0, x * 0.5); }
      b.done(); banshees.push(b.grp);
    }
    updaters.push((dt, t) => banshees.forEach((b, i) => {
      const a = t * 0.38 + i * 2.1, x = PX + Math.cos(a) * 26, z = PZ + Math.sin(a) * 19;
      b.position.set(x, Y + 33 + Math.sin(a * 2 + i) * 3.5, z);
      b.rotation.set(0, Math.atan2(-Math.sin(a) * 26, Math.cos(a) * 19), Math.sin(t * 1.2 + i) * 0.25, 'YXZ');
    }));
    interactables.push({ id: 'pandora_bloom', name: '潘多拉 · 发光植物', x: PX + 2, y: Y, z: PZ + 4, msg: '✨ 你轻触螺旋状的 Helicoradian——它瞬间缩回地面，四周的荧光植物像呼吸一样亮了起来。' });

    /* =============== ASIA — EXPEDITION EVEREST: Legend of the Forbidden Mountain =============== */
    const EX = A.everest.x, EZ = A.everest.z, ROCK = 0x6f747c, ROCK2 = 0x858a92, SNOW = 0xf2f7fc;
    S.crag(ROCK, 11, 24, 20, EX, Y, EZ, 10, 0.3); S.crag(ROCK2, 5, 13.5, 20, EX + 1, Y + 16, EZ - 1, 8, 0.9);
    S.crag(SNOW, 0, 6.2, 13, EX + 1.5, Y + 34.4, EZ - 1.5, 7, 0.2);
    S.crag(ROCK2, 3, 10, 22, EX - 13, Y, EZ + 6, 7, 1.4); S.crag(SNOW, 0, 3.7, 7, EX - 13, Y + 21, EZ + 6, 6, 1);
    S.crag(ROCK, 2.5, 9, 18, EX + 13, Y, EZ + 8, 7, 2.2); S.crag(SNOW, 0, 3.1, 6, EX + 13, Y + 17.3, EZ + 8, 6, 0.4);
    S.crag(ROCK2, 2, 8, 26, EX + 7, Y + 4, EZ - 9, 6, 0.5); S.crag(SNOW, 0, 2.7, 6, EX + 7, Y + 29.2, EZ - 9, 6, 0.8);
    for (const [gx, gy, gz, r] of [[-5, 27, 3, 4], [6, 24, 5, 3.4], [-9, 13, -6, 3.6], [3, 31, -6, 3]]) S.poly(SNOW, r, EX + gx, Y + gy, EZ + gz, 0, 1.3, 0.45, 1, gx);
    foot(EX, EZ, 27);
    const ev = K.track([[326, 2, 686], [344, 2, 688], [360, 3.5, 684], [368, 8, 670], [368, 14, 652], [362, 20, 638], [350, 25, 631], [337, 26, 634], [328, 22, 644], [324, 14, 656], [318, 7, 668], [316, 3, 680]],
      { gauge: 1.3, rail: { col: 0x5b4636, r: 0.12 }, tie: { col: WOOD, step: 2, r: 0.1 }, sup: { col: WOOD, step: 4, r: 0.24 }, pull: 0.8 });
    const teaCar = (c, loco) => {
      const a = K.asm(0, 0, 0), s = a.S;
      s.box(0x3a2a20, 1.5, 0.4, 3.2, 0, 0.1, 0); s.box(c, 1.5, 0.8, 3.1, 0, 0.5, 0);
      if (loco) { s.cyl(0x2a2422, 0.6, 0.6, 2, 0, 0.95, 0.9, 10, PI / 2); s.cyl(0x2a2422, 0.22, 0.3, 1.2, 0, 2, 1.3, 6); s.box(RED, 1.5, 1.3, 1, 0, 1.3, -1); a.G.sph(0xffe9a8, 0.2, 0, 1.5, 2, 1, 1, 1, 5); }
      else for (const z of [-0.8, 0.5]) s.box(0x2a2422, 1.3, 0.7, 0.2, 0, 1.3, z);
      return a.done();
    };
    const evRide = K.trainRide({
      id: 'everest_ride', name: '珠峰探险 · Expedition Everest', land: 'pandora_everest', track: ev,
      cars: [teaCar(0x7a3b2a, true), teaCar(0x2f6f6a), teaCar(0xb5803a), teaCar(0x2f6f6a)], gap: 3.5, speed: 6.5, G: 9.5, vmax: 25, lift: 0.15, eye: 1.7, back: 9,
      boardPos: { x: 335, y: Y, z: 693 }, exitPos: { x: 331, y: Y, z: 696, yaw: 0 },
      events: [
        [0.03, '🚂 喜马拉雅探险公司的采茶小火车驶离塞尔卡宗车站'],
        [0.2, '⛰️ 沿栈桥爬升——左侧就是禁忌之山的冰川'],
        [0.5, '🏔️ 山肩最高点！海拔 26 米，前方轨道被撕断了……'],
        [0.62, '👹 雪怪！！它从山洞里伸出巨爪——列车急速俯冲！'],
        [0.88, '🛤️ 冲出山脚，驶回车站']
      ],
      doneMsg: '🏁 珠峰探险完成！你从雪怪手下逃了出来。'
    });
    rides.everest_ride = evRide.ride;
    updaters.push((dt, t, onEv) => evRide.update(dt, onEv));
    // The Yeti in his cave above the drop.
    S.crag(0x3d4149, 2.6, 4.4, 5.4, 335, Y + 15.6, 650, 6, 0.4);
    S.poly(0xd8d2c4, 1.7, 333.4, Y + 20.6, 650.6, 1, 1, 1.3, 1); S.poly(0xcfc8b8, 1, 332.6, Y + 23, 651, 1);
    S.rod(0xd8d2c4, 0.55, 333, Y + 21.4, 651.8, 329.6, Y + 19.4, 654.6, 6); S.rod(0xd8d2c4, 0.5, 333, Y + 21.4, 649.4, 330.4, Y + 22.4, 647.6, 6);
    for (const s of [-1, 1]) G.sph(0xef4444, 0.16, 331.8, Y + 23.2, 651 + s * 0.4, 1, 1, 1, 5);
    // Serka Zong village, station, stupa and prayer flags.
    S.box(0x7a2a22, 9, 0.5, 6, 335, Y + 4.6, 688); S.pyr(0x8f3a2c, 10, 1.8, 7, 335, Y + 5.1, 688);
    for (const [ax, az] of [[-4, -2.6], [4, -2.6], [-4, 2.6], [4, 2.6]]) S.cyl(RED, 0.24, 0.26, 4.6, 335 + ax, Y, 688 + az, 6);
    sign('EXPEDITION EVEREST', 7.6, 1.1, 335, Y + 3.4, 691.4, 0, '#3b0d0a', '#fde68a', '珠峰探险 · 禁忌之山传奇');
    const tibet = (x, z, w, h) => {
      bldg(0xf2ede2, w, h, 6, x, Y, z, 0, 3, 3.2); S.box(0x7a2a22, w + 0.4, 1, 6.4, x, Y + h, z); S.box(0x2a2422, w + 0.9, 0.3, 6.9, x, Y + h + 1, z);
      for (const sx of [-1, 1]) S.cyl(GOLD, 0.25, 0.25, 0.8, x + sx * (w / 2 - 0.6), Y + h + 1.3, z, 6);
      foot(x, z, w * 0.7);
    };
    tibet(352, 704, 9, 7); tibet(322, 706, 8, 5.5); tibet(341, 707, 7, 9);
    S.cyl(WHITE, 2.6, 3, 1.2, 316, Y, 698, 8); S.dome(WHITE, 2, 316, Y + 1.2, 698, 1.1, 10); S.box(WHITE, 1.2, 0.8, 1.2, 316, Y + 3.3, 698); S.cone(GOLD, 0.6, 2.6, 316, Y + 4.1, 698, 8);
    for (const [x0, z0, x1, z1] of [[316, 698, 331, 688], [339, 688, 352, 704], [316, 698, 322, 706]]) for (let k = 1; k < 12; k++) {
      const u = k / 12;
      S.box([0x2563eb, WHITE, RED, 0x16a34a, 0xfacc15][k % 5], 0.7, 0.5, 0.04, x0 + (x1 - x0) * u, Y + 6.4 - Math.sin(u * PI) * 1.2, z0 + (z1 - z0) * u, Math.atan2(x1 - x0, z1 - z0) + PI / 2);
    }

    /* =============== AFRICA — HARAMBE & KILIMANJARO SAFARIS =============== */
    const HX = A.harambe.x, HZ = A.harambe.z;
    const hut = (x, z, w, h, c, thatch) => {
      bldg(c, w, h, 6.5, x, Y, z, 0, 3, 3.2);
      if (thatch) S.gable(THATCH, 8, 3, w + 1.4, x, Y + h, z, PI / 2);
      else { S.box(0x9a6a4a, w + 0.5, 0.4, 7, x, Y + h, z); for (let i = 0; i < 5; i++) S.box(c, 0.9, 0.7, 0.5, x - w / 2 + 0.6 + i * (w - 1.2) / 4, Y + h + 0.4, z - 3); }
      S.box([RED, 0x16a34a, 0xf59e0b][(x | 0) % 3], w - 1, 0.15, 2.2, x, Y + 2.9, z - 4.2, 0, 0.25);
      foot(x, z, w * 0.75);
    };
    hut(HX - 14, HZ + 8, 10, 5, 0xd9a066, true); hut(HX + 2, HZ + 9, 9, 6.5, 0xf2e2c4, false); hut(HX + 16, HZ + 8, 10, 5.4, 0xc97b4a, true);
    S.box(0xf2e2c4, 4, 11, 4, HX + 2, Y + 6.5, HZ + 9.5); for (let i = 0; i < 4; i++) S.box(0xf2e2c4, 0.9, 0.9, 0.9, HX + 0.4 + (i % 2) * 3.2, Y + 17.5, HZ + 7.9 + ((i / 2) | 0) * 3.2);
    sign('HARAMBE', 6, 1.2, HX + 2, Y + 14.4, HZ + 7.4, PI, '#7c2d12', '#fef3c7', '哈兰贝村 · 团结一心');
    for (let i = 0; i < 6; i++) lamp(HX - 20 + i * 8, HZ - 6 + (i % 2) * 2, 4);
    const SV = A.savanna, SAV = [];
    for (let i = 0; i < 14; i++) { const a = i * PI / 7; SAV.push([SV.x + Math.cos(a) * 37.5, 0.12, SV.z + Math.sin(a) * 15.6]); }
    const saf = K.track(SAV, {});
    const truck = K.asm(0, 0, 0), ks = truck.S, TAN = 0xc9a877;
    ks.box(TAN, 2.3, 1, 6.2, 0, 0.6, 0); ks.box(0x9a7a4a, 2.2, 1.1, 1.6, 0, 1.6, 2.2); ks.box(DARK, 2.0, 0.5, 0.1, 0, 2.1, 3.02);
    for (const x of [-1, 1]) for (const z of [-2.2, 0, 2.2]) { if (z !== 2.2) ks.cyl(WOOD, 0.07, 0.07, 1.9, x * 1.05, 1.6, z - 0.4, 4); ks.cyl(0x15191f, 0.55, 0.55, 0.4, x * 1.1, 0.05, z === 0 ? -2.3 : z * 0.95, 10, 0, PI / 2); }
    ks.box(0xe8dcc0, 2.5, 0.16, 4.6, 0, 3.5, -0.9); ks.box(0x6b4a2f, 2, 0.3, 4, 0, 1.55, -0.9);
    const safRide = K.trainRide({
      id: 'safari_ride', name: '乞力马扎罗野生动物园 · Kilimanjaro Safaris', land: 'animal_kingdom', track: saf,
      cars: [truck.done()], gap: 0, speed: 4.6, lift: 0, eye: 2.9, back: 11,
      boardPos: { x: SV.x + 41, y: Y, z: SV.z - 2 }, exitPos: { x: SV.x + 43, y: Y, z: SV.z - 5, yaw: PI },
      events: [
        [0.03, '🚙 Jambo！敞篷卡车驶入哈兰贝野生动物保护区'],
        [0.16, '🦓 右侧草地上是一群斑马——远处那棵粗壮的是猴面包树'],
        [0.36, '🦏 西边水塘：白犀牛在泥地里打滚，火烈鸟站在浅水中'],
        [0.56, '🐘 非洲象一家正在北岸散步，小象紧跟着妈妈'],
        [0.74, '🦁 快看岩石山顶——狮子正趴在那儿晒太阳！'],
        [0.9, '🦒 最后是长颈鹿，它们正够着金合欢树顶的嫩叶']
      ],
      doneMsg: '🏁 Kwaheri！野生动物园之旅结束，谢谢你一起守护这片草原。'
    });
    rides.safari_ride = safRide.ride;
    updaters.push((dt, t, onEv) => safRide.update(dt, onEv));
    S.box(THATCH, 7, 0.4, 9, SV.x + 43, Y + 4.4, SV.z - 1); S.cone(0xa3854a, 5.4, 2.6, SV.x + 43, Y + 4.8, SV.z - 1, 4, PI / 4);
    for (const [ax, az] of [[-3, -4], [3, -4], [-3, 4], [3, 4]]) S.cyl(WOOD, 0.24, 0.3, 4.4, SV.x + 43 + ax, Y, SV.z - 1 + az, 6);
    sign('KILIMANJARO SAFARIS', 7, 1.1, SV.x + 46.6, Y + 3, SV.z - 1, PI / 2, '#3b2a14', '#fde68a', '乞力马扎罗野生动物园');

    const quad = (x, z, ry, o) => {
      const f = K.frame(x, z, ry), y0 = Y + (o.y0 || 0), by = y0 + o.leg, lr = o.lr || 0.16;
      f.box(o.c, o.w, o.h, o.len, 0, by, 0);
      for (const sx of [-1, 1]) for (const sz of [-1, 1]) f.cyl(o.c2 || o.c, lr, lr * 0.9, o.leg, sx * o.w * 0.32, y0, sz * o.len * 0.36, 5);
      const nz = o.len * 0.42, hy = by + o.h + (o.neck || 0), hz = nz + (o.nf || 0.3);
      if (o.neck) f.rod(o.c, o.nr || 0.25, 0, by + o.h * 0.8, nz, 0, hy, hz, 6);
      f.box(o.c, o.hw, o.hh, o.hl, 0, hy - o.hh / 2, hz + o.hl * 0.3);
      return { f, hy, hz, by };
    };
    const giraffe = (x, z, ry, k) => {
      const q = quad(x, z, ry, { c: 0xe0b060, c2: 0xd9c08a, w: 1.1 * k, h: 1.5 * k, len: 2.6 * k, leg: 2.5 * k, neck: 3.3 * k, nf: 1.1 * k, nr: 0.3 * k, hw: 0.55 * k, hh: 0.6 * k, hl: 1.2 * k });
      for (let i = 0; i < 6; i++) q.f.box(0x8a5a2a, 0.5 * k, 0.5 * k, 0.06, (i % 2 ? 0.56 : -0.56) * k, q.by + 0.3 * k + (i % 3) * 0.4 * k, -0.8 * k + i * 0.3 * k, PI / 2);
      for (const sx of [-1, 1]) q.f.cyl(0x5b3a1e, 0.05, 0.05, 0.4 * k, sx * 0.16 * k, q.hy, q.hz, 4);
    };
    const elephant = (x, z, ry, k) => {
      const q = quad(x, z, ry, { c: 0x8a8f96, w: 2.2 * k, h: 2.3 * k, len: 3.6 * k, leg: 1.6 * k, lr: 0.46 * k, neck: 0.01, nf: 0.2 * k, hw: 1.7 * k, hh: 1.7 * k, hl: 1.4 * k });
      q.f.rod(0x8a8f96, 0.3 * k, 0, q.hy - 0.9 * k, q.hz + 1.1 * k, 0, Y + 0.6 * k, q.hz + 1.9 * k, 6);
      for (const sx of [-1, 1]) { q.f.box(0x7b8088, 0.14, 1.5 * k, 1.3 * k, sx * 1.05 * k, q.hy - 1.6 * k, q.hz - 0.1 * k, sx * 0.4); q.f.rod(WHITE, 0.1 * k, sx * 0.5 * k, q.hy - 1.3 * k, q.hz + 1 * k, sx * 0.6 * k, q.hy - 1.9 * k, q.hz + 2 * k, 4); }
    };
    const zebra = (x, z, ry) => {
      const q = quad(x, z, ry, { c: 0xf2f2ee, w: 0.8, h: 1, len: 2, leg: 1.1, neck: 0.9, nf: 0.5, hw: 0.45, hh: 0.5, hl: 0.9 });
      for (let i = 0; i < 6; i++) q.f.box(0x1f2329, 0.84, 1.02, 0.12, 0, q.by, -0.8 + i * 0.32);
    };
    giraffe(SV.x + 12, SV.z - 9, 0.6, 1); giraffe(SV.x + 17, SV.z - 5, -1.2, 0.85); giraffe(SV.x - 30, SV.z + 6, 2.2, 0.95); giraffe(SV.x + 26, SV.z + 2, 2.8, 0.6);
    elephant(SV.x - 14, SV.z - 10, 1.2, 1); elephant(SV.x - 9, SV.z - 8, 1.5, 0.9); elephant(SV.x - 11, SV.z - 5.5, 1.3, 0.5);
    zebra(SV.x + 18, SV.z + 7, 0.3); zebra(SV.x + 21, SV.z + 9.5, 0.8); zebra(SV.x + 24, SV.z + 6, -0.4); zebra(SV.x + 15, SV.z + 10, 1.6);
    quad(SV.x - 24, SV.z - 1, 0.9, { c: 0x7b7f86, w: 1.5, h: 1.5, len: 3.2, leg: 0.9, lr: 0.3, neck: 0.01, nf: 0.1, hw: 1, hh: 1, hl: 1.3 });
    S.cone(0xd9d2c4, 0.2, 0.8, SV.x - 22.2, Y + 2.2, SV.z + 0.5, 5);
    // Kopje with the lions, the watering hole with flamingos and a hippo.
    const KX = SV.x + 3, KZ = SV.z - 6;
    S.crag(0x9a8468, 3, 6, 4, KX, Y, KZ, 7, 0.4); S.crag(0xa8926f, 1.6, 3.4, 3, KX + 4.4, Y, KZ + 1.6, 6, 1.3); S.crag(0x8a765c, 1.2, 2.6, 2.2, KX - 4, Y, KZ - 1, 6, 2);
    quad(KX, KZ, 0.9, { y0: 4, c: 0xc9a05a, w: 0.9, h: 0.8, len: 2, leg: 0.3, neck: 0.01, nf: 0.2, hw: 0.6, hh: 0.6, hl: 0.7 });
    S.poly(0x8a5a2a, 0.62, KX + Math.sin(0.9) * 1.05, Y + 5, KZ + Math.cos(0.9) * 1.05, 1);
    for (let i = 0; i < 6; i++) {
      const fx = SV.x - 12 + i * 1.5, fz = SV.z + 4.6 + (i % 2) * 0.9;
      S.cyl(0xf9a8d4, 0.04, 0.04, 1.3, fx, WY - 0.3, fz, 4); S.sph(0xf9a8d4, 0.34, fx, WY + 1.2, fz, 1, 0.8, 1.4, 6);
      S.rod(0xf9a8d4, 0.07, fx, WY + 1.3, fz + 0.3, fx, WY + 2.1, fz + 0.6, 4); S.sph(0xf472b6, 0.14, fx, WY + 2.15, fz + 0.72, 1, 1, 1.3, 5);
    }
    S.sph(0x6f6a72, 1.2, SV.x - 2, WY, SV.z + 1, 1.5, 0.6, 1, 8); S.sph(0x6f6a72, 0.6, SV.x - 0.2, WY + 0.3, SV.z + 1, 1.3, 0.8, 1, 6);
    const baobab = (x, z, k) => {
      S.cyl(0x9a8468, 1.5 * k, 2.4 * k, 8 * k, x, Y, z, 9);
      for (let i = 0; i < 7; i++) { const a = i * 0.9; S.rod(0x8a765c, 0.32 * k, x, Y + 7.6 * k, z, x + Math.cos(a) * 3.6 * k, Y + 10.6 * k + (i % 2), z + Math.sin(a) * 3.6 * k, 5); S.poly(0x6f8f3a, 1.5 * k, x + Math.cos(a) * 3.8 * k, Y + 11.4 * k + (i % 2), z + Math.sin(a) * 3.8 * k, 0, 1.3, 0.6, 1.3, i); }
    };
    const acacia = (x, z, k) => {
      S.rod(0x6b4a2f, 0.26 * k, x, Y, z, x + 0.8 * k, Y + 4.6 * k, z + 0.4 * k, 5);
      S.poly(0x6f8f3a, 3.4 * k, x + 0.8 * k, Y + 5.4 * k, z + 0.4 * k, 1, 1.3, 0.22, 1.3, x); S.poly(0x7fa044, 2.2 * k, x - 1 * k, Y + 5 * k, z - 0.8 * k, 1, 1.3, 0.22, 1.3, z);
    };
    baobab(SV.x - 20, SV.z + 12, 1); baobab(SV.x + 28, SV.z - 4, 0.85); baobab(SV.x + 8, SV.z + 17.5, 0.7);
    [[14, -11, 1], [20, -3, 1.1], [-34, 2, 1], [-6, 12, 0.9], [30, 9, 1], [-28, -9, 1.1], [-40, -4, 0.9], [38, 12, 0.8], [0, -17, 1], [-18, 17, 0.9]].forEach(([dx, dz, k]) => acacia(SV.x + dx, SV.z + dz, k));
    interactables.push({ id: 'safari_lion', name: '草原 · 狮子岩', x: SV.x + 40, y: Y, z: SV.z + 4, msg: '🦁 向导递给你望远镜：岩石山顶那头雄狮打了个大哈欠——这里的每块「岩石」其实都装了空调。' });
  });

  /* ---------------- Entry point: builds all three resort parks into one batched group ---------------- */
  function build(scene, world, group) {
    const T = root.THREE, R = world.RESORT;
    if (!R || !root.TPKit) return null;
    const rg = new T.Group(); rg.name = 'wdw-resort'; (group || scene).add(rg);
    const K = root.TPKit.create(rg, world), Y = world.PARK_Y;
    const feet = [], updaters = [], rides = {}, interactables = [];
    const ctx = { K, R, Y, WY: world.WATER_Y, world, updaters, rides, interactables, foot: (x, z, r) => feet.push([x, z, r * r]) };
    (root.TPResortParts || []).forEach((part) => part(ctx));

    const avoid = (x, z) => {
      for (const f of feet) { const dx = x - f[0], dz = z - f[1]; if (dx * dx + dz * dz < f[2]) return true; }
      return false;
    };
    const grass = (o) => o === 0;
    K.scatter(170, 506, 734, 40, 300, avoid, (x, z, r) => (z < 190 ? (r < 0.25 ? 'pine' : r < 0.45 ? 'cypress' : 'oak') : (r < 0.35 ? 'palm' : r < 0.5 ? 'blossom' : 'oak')), grass);
    K.scatter(70, 474, 734, 300, 498, avoid, (x, z, r) => (r < 0.4 ? 'palm' : 'oak'), grass);
    K.scatter(150, 510, 734, 498, 722, avoid, (x, z, r) => (r < 0.6 ? 'palm' : r < 0.75 ? 'cypress' : 'oak'), grass);
    K.scatter(90, 284, 600, 512, 612, avoid, (x, z, r) => (r < 0.3 ? 'palm' : 'oak'), grass);
    K.scatter(210, 110, 372, 574, 730, avoid, (x, z, r) => (x < 236 && z < 680 ? (r < 0.55 ? 'palm' : 'cypress') : x > 300 ? (r < 0.6 ? 'pine' : 'oak') : (r < 0.5 ? 'palm' : 'oak')), grass);
    K.flush();
    rg.traverse((m) => { if (m.isMesh && m.material && m.material.isMeshLambertMaterial) m.castShadow = true; });

    let elapsed = 0;
    return {
      rides, interactables,
      update: (dt, t, nightF, onEvent) => { elapsed += dt; for (const u of updaters) u(dt, elapsed, onEvent); }
    };
  }

  root.TPOrlando = { build };
})(window);

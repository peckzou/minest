/* Minest My World · Disneyland Park Paris — part 1: the central axis.
 * Fantasia Gardens → Disneyland Hotel → Main Street Station → Town Square → Main Street, U.S.A. (with the
 * Liberty & Discovery Arcades) → Central Plaza → Le Château de la Belle au Bois Dormant → Fantasyland.
 * The park is rotated 180°: guests enter from the north (low z) and walk south (+z) towards the castle. */
(function (root) {
  'use strict';

  (root.TPParisParts = root.TPParisParts || []).push(function (ctx) {
    const { K, P, Y, hmAt, foot, updaters, rides, interactables } = ctx;
    const { S, G, W, T, bldg, sign, tree, lamp } = K;
    const PI = Math.PI, X = P.x;
    const PINK = 0xf3bccb, PINK2 = 0xe9a3b8, RED = 0xb5463f, WHITE = 0xfbf6ee, GOLD = 0xe7b83a, SLATE = 0x4a6fa3;
    const BLUE = 0x3f6ea8, STONE = 0xd9cfc2, DARK = 0x2a2233, GLASSY = 0x9fd3ff, IRON = 0x2f4a3c;

    const finial = (x, y, z, k) => {
      S.cyl(GOLD, 0.06 * (k || 1), 0.06 * (k || 1), 1.5 * (k || 1), x, y - 0.1, z, 4);
      S.sph(GOLD, 0.24 * (k || 1), x, y + 1.4 * (k || 1), z, 1, 1, 1, 6);
    };
    const turret = (x, y, z, r, h, rh, wall, roof, seg) => {
      S.cyl(wall, r, r, h, x, y, z, seg || 10);
      S.cyl(WHITE, r * 1.17, r, 0.7, x, y + h - 0.7, z, seg || 10);
      S.cone(roof, r * 1.34, rh, x, y + h, z, seg || 10);
      finial(x, y + h + rh, z, Math.max(0.7, r / 2.2));
    };
    const flag = (x, y, z, c) => {
      S.cyl(0xe5e7eb, 0.05, 0.05, 2.6, x, y, z, 4);
      S.box(c, 1.5, 0.8, 0.05, x + 0.8, y + 1.7, z);
    };
    ctx.turret = turret; ctx.finial = finial; ctx.flag = flag;

    /* =============== FANTASIA GARDENS =============== */
    for (const sx of [-1, 1]) {
      const px = X + sx * 32;
      W.cone(0xdff4ff, 1.6, 4.2, px, Y - 3.4, 764, 8);
      W.cone(0xdff4ff, 0.7, 6.4, px, Y - 3.4, 764, 6);
      S.cyl(STONE, 2.2, 2.6, 0.5, px, Y - 3.5, 764, 10);
      // Victorian gazebo beside each pond.
      const gx = X + sx * 52, gz = 768;
      S.cyl(WHITE, 4, 4.3, 0.5, gx, Y, gz, 8);
      for (let i = 0; i < 8; i++) S.cyl(WHITE, 0.13, 0.13, 3.4, gx + Math.cos(i * PI / 4) * 3.6, Y + 0.5, gz + Math.sin(i * PI / 4) * 3.6, 5);
      S.fan(RED, 0xd96a5f, 4.8, 2.6, gx, Y + 3.9, gz, 8);
      finial(gx, Y + 6.5, gz);
      foot(gx, gz, 6);
      for (let i = 0; i < 5; i++) {
        const bx = X + sx * (12 + i * 9), bz = 752 + (i % 2) * 3;
        S.cyl(0x4b8f3f, 2.4, 2.6, 0.35, bx, Y, bz, 12);
        S.cyl([0xf472b6, 0xfacc15, 0xf87171, 0xc084fc, 0xfb923c][i], 1.9, 2.1, 0.3, bx, Y + 0.3, bz, 12);
        S.cone(0x2f7438, 0.8, 2.2, bx, Y + 0.5, bz, 6);
      }
    }
    // The floral Mickey face in front of the hotel.
    S.cyl(0x3f8f3f, 6.2, 6.6, 0.4, X, Y, 771, 20);
    S.cyl(0xfacc15, 3.3, 3.5, 0.35, X, Y + 0.4, 771.6, 18);
    S.cyl(0xf87171, 1.9, 2.0, 0.35, X - 3.4, Y + 0.4, 768.4, 14);
    S.cyl(0xf87171, 1.9, 2.0, 0.35, X + 3.4, Y + 0.4, 768.4, 14);
    foot(X, 771, 8);
    for (let i = -5; i <= 5; i++) if (i) { lamp(X + i * 11, 779.5, 4.4); lamp(X + i * 6 + (i > 0 ? 6 : -6), 746, 4.4); }

    /* =============== DISNEYLAND HOTEL (pink Victorian palace straddling the gates) =============== */
    const HZ = 791, HH = 15;
    for (const sx of [-1, 1]) {
      const wx = X + sx * 31; // wings: x 332..376 / 392..436
      bldg(PINK, 46, HH, 15, wx, Y, HZ, 0, 3.3, 3.75);
      S.box(WHITE, 46.8, 0.5, 15.8, wx, Y + HH, HZ);
      S.box(WHITE, 46.4, 0.3, 15.4, wx, Y + 7.4, HZ);
      S.gable(RED, 16.4, 6.4, 47, wx, Y + HH + 0.5, HZ, PI / 2);
      S.box(0x8f342f, 47.4, 0.35, 0.9, wx, Y + HH + 6.8, HZ);
      for (let i = -4; i <= 4; i++) {
        for (const f of [-1, 1]) {
          const dx = wx + i * 4.8, dz = HZ + f * 5.4;
          S.box(WHITE, 2.1, 2.2, 1.6, dx, Y + HH + 0.9, dz);
          S.gable(RED, 2.6, 1.5, 2.2, dx, Y + HH + 3.1, dz, 0);
          G.box(0xffe7a8, 1.1, 1.3, 0.1, dx, Y + HH + 1.3, dz + f * 0.82);
        }
      }
      // Ground-floor veranda with white columns and balcony rail on both façades.
      for (const f of [-1, 1]) {
        const vz = HZ + f * 9.2;
        S.box(WHITE, 44, 0.3, 3.2, wx, Y + 3.9, vz - f * 0.4);
        S.box(WHITE, 44, 0.9, 0.12, wx, Y + 4.2, vz + f * 1.1);
        for (let i = -5; i <= 5; i++) S.cyl(WHITE, 0.2, 0.2, 3.9, wx + i * 4.2, Y, vz + f * 1.0, 6);
      }
      // End pavilion and corner turrets.
      const ex = X + sx * 56;
      bldg(PINK2, 12, HH + 4, 19, ex, Y, HZ, 0, 3.2, 3.75);
      S.pyr(RED, 13.4, 8.5, 20.4, ex, Y + HH + 4, HZ);
      S.box(WHITE, 5, 0.3, 5, ex, Y + HH + 12.4, HZ);
      finial(ex, Y + HH + 12.6, HZ, 1.3);
      for (const f of [-1, 1]) {
        turret(ex + sx * 6, Y, HZ + f * 9.5, 2.3, HH + 6, 6.5, PINK, RED, 8);
        turret(X + sx * 9, Y, HZ + f * 8, 2.5, HH + 7, 7.5, PINK, RED, 8);
      }
      foot(wx, HZ, 30);
    }
    // Central clock tower block bridging the entrance passage.
    for (const sx of [-1, 1]) S.box(PINK2, 2.6, 7.5, 17, X + sx * 7.3, Y, HZ);
    bldg(PINK, 17.2, 9, 17, X, Y + 7.5, HZ, 0, 3.3, 3.75);
    S.box(WHITE, 18, 0.6, 17.8, X, Y + 7.2, HZ);
    S.box(WHITE, 18, 0.5, 17.8, X, Y + 16.5, HZ);
    for (const f of [-1, 1]) {
      S.tor(WHITE, 6, 0.35, X, Y + 1.5, HZ + f * 8.6, 0, 0, 0, PI, 14);
      S.gable(PINK2, 13, 8.5, 1.2, X, Y + 17, HZ + f * 8, 0);
      S.gable(RED, 14.4, 9.4, 0.6, X, Y + 17, HZ + f * 7.2, 0);
      // The Mickey clock.
      S.cyl(GOLD, 2.6, 2.6, 0.3, X, Y + 18.6, HZ + f * 8.75, 20, PI / 2);
      S.cyl(WHITE, 2.25, 2.25, 0.3, X, Y + 18.6, HZ + f * 8.9, 20, PI / 2);
      S.box(DARK, 0.18, 1.7, 0.1, X, Y + 18.75, HZ + f * 9.1, 0, 0, 0.5);
      S.box(DARK, 0.18, 1.2, 0.1, X, Y + 18.75, HZ + f * 9.1, 0, 0, -1.2);
    }
    S.pyr(RED, 19, 9, 18.6, X, Y + 17, HZ);
    S.box(PINK, 5, 4, 5, X, Y + 25, HZ);
    S.pyr(RED, 6.4, 6, 6.4, X, Y + 29, HZ);
    finial(X, Y + 35, HZ, 1.6);
    flag(X, Y + 37, HZ, 0x2563eb);
    sign('DISNEYLAND HOTEL', 15, 1.9, X, Y + 9.6, HZ - 8.7, PI, '#fff7f0', '#b5463f');
    sign('DISNEYLAND PARK', 13, 1.8, X, Y + 9.6, HZ + 8.7, 0, '#fff7f0', '#b5463f', '巴黎迪士尼乐园');
    foot(X, HZ, 14);

    /* =============== MAIN STREET STATION (elevated platform over the entrance tunnels) =============== */
    const SZ = P.zStation, BRICK = 0xb9624e, CREAM = 0xf2e6cf, GREY = 0x56606e;
    for (const sx of [-1, 1]) {
      bldg(BRICK, 20, 5.6, 13, X + sx * 20, Y, SZ, 0, 3.3, 5.6);
      for (const f of [-1, 1]) {
        bldg(CREAM, 20, 5, 3, X + sx * 20, Y + 6.2, SZ + f * 5, 0, 3.3, 5);
        S.box(GREY, 21, 2.2, 3.8, X + sx * 20, Y + 11.2, SZ + f * 5);
        S.box(0x3d4652, 19, 0.3, 2.4, X + sx * 20, Y + 13.4, SZ + f * 5);
      }
      S.box(GREY, 20.6, 0.4, 14, X + sx * 20, Y + 11.2, SZ);
      S.box(BRICK, 3, 6.2, 13, X + sx * 8.5, Y, SZ);
      for (const f of [-1, 1]) turret(X + sx * 30.5, Y, SZ + f * 6.2, 1.6, 13, 4.5, BRICK, GREY, 8);
      foot(X + sx * 20, SZ, 14);
    }
    S.box(STONE, 62, 0.6, 14, X, Y + 5.6, SZ);
    for (const f of [-1, 1]) {
      S.box(BRICK, 14, 7, 2.4, X, Y + 6.2, SZ + f * 5.8);
      S.tor(WHITE, 3.2, 0.3, X, Y + 6.2, SZ + f * 7.05, 0, 0, 0, PI, 12);
      S.cyl(WHITE, 1.7, 1.7, 0.25, X, Y + 15.6, SZ + f * 7.3, 18, PI / 2);
      S.box(DARK, 0.14, 1.2, 0.08, X, Y + 15.8, SZ + f * 7.5, 0, 0, 0.6);
    }
    S.box(BRICK, 14, 4.6, 14, X, Y + 13.2, SZ);
    S.box(WHITE, 14.8, 0.5, 14.8, X, Y + 17.8, SZ);
    S.box(GREY, 12.5, 4.2, 12.5, X, Y + 18.3, SZ);
    S.box(0x3d4652, 9, 0.4, 9, X, Y + 22.5, SZ);
    for (const [ax, az] of [[-4, -4], [4, -4], [-4, 4], [4, 4]]) S.cyl(GOLD, 0.07, 0.07, 1.4, X + ax, Y + 22.9, SZ + az, 4);
    flag(X, Y + 22.9, SZ, 0xdc2626);
    sign('DISNEYLAND RAILROAD', 12, 1.4, X, Y + 8.4, SZ - 7.1, PI, '#f5efe0', '#7c2d12', 'MAIN STREET STATION');
    sign('MAIN STREET STATION', 12, 1.4, X, Y + 8.4, SZ + 7.1, 0, '#f5efe0', '#7c2d12');

    /* =============== TOWN SQUARE =============== */
    const TZ = P.zSquare;
    S.cyl(WHITE, 4.4, 4.8, 0.9, X, Y, TZ, 8);
    for (let i = 0; i < 8; i++) {
      const a = i * PI / 4 + PI / 8;
      S.cyl(WHITE, 0.14, 0.14, 3.6, X + Math.cos(a) * 4, Y + 0.9, TZ + Math.sin(a) * 4, 5);
      S.box(0xdc2626, 1.4, 0.5, 0.06, X + Math.cos(a + PI / 8) * 4.05, Y + 3.7, TZ + Math.sin(a + PI / 8) * 4.05, -(a + PI / 8) + PI / 2);
    }
    S.fan(0x3f7f6a, 0x5fa58c, 5.4, 2.4, X, Y + 4.5, TZ, 8);
    S.cyl(WHITE, 1, 1, 1.2, X, Y + 6.4, TZ, 8);
    S.cone(0x3f7f6a, 1.4, 1.6, X, Y + 7.6, TZ, 8);
    finial(X, Y + 9.2, TZ);
    for (let i = 0; i < 12; i++) {
      const a = i * PI / 6;
      S.cyl([0xf472b6, 0xfde047, 0xf87171][i % 3], 1.3, 1.4, 0.3, X + Math.cos(a) * 8, Y, TZ + Math.sin(a) * 8, 8);
    }
    // City Hall (east) and the Transportation Co. / Ribbons & Bows (west) closing the square.
    const civic = (sx, col, name, mans) => {
      const cx = X + sx * 28, cz = TZ + 4;
      bldg(col, 14, 11, 26, cx, Y, cz, 0, 3.3, 3.7);
      S.box(WHITE, 14.8, 0.5, 26.8, cx, Y + 11, cz);
      S.box(mans, 13, 3.4, 25, cx, Y + 11.5, cz);
      S.box(0x39424e, 10.5, 0.4, 22.5, cx, Y + 14.9, cz);
      S.box(col, 5, 5, 6, cx - sx * 5.5, Y + 11.5, cz);
      S.pyr(mans, 6, 4.5, 7, cx - sx * 5.5, Y + 16.5, cz);
      finial(cx - sx * 5.5, Y + 21, cz);
      S.box(WHITE, 2.4, 0.3, 20, cx - sx * 8.2, Y + 4.1, cz);
      for (let i = -4; i <= 4; i++) S.cyl(WHITE, 0.18, 0.18, 4.1, cx - sx * 9.1, Y, cz + i * 2.4, 6);
      sign(name, 9, 1.2, cx - sx * 7.15, Y + 5.6, cz, sx > 0 ? -PI / 2 : PI / 2, '#fdf6e3', '#1f3a5f');
      foot(cx, cz, 16);
    };
    civic(1, 0xe8d9a8, 'CITY HALL', 0x55606d);
    civic(-1, 0xc9dbe6, 'MAIN STREET TRANSPORTATION CO.', 0x6a4a3a);
    for (const sx of [-1, 1]) for (const z of [816, 826, 836, 846]) lamp(X + sx * 16, z, 4.6);

    /* =============== MAIN STREET, U.S.A. =============== */
    const ROOFS = { m: 0x55606d, r: 0x9c4a3f, g: 0x4f7a68, b: 0x6a4a3a };
    function shop(o) {
      const d = 17, dir = o.dir, fx = X + dir * 9, cx = fx + dir * d / 2, cz = o.z + o.w / 2, h = o.h, ry = dir > 0 ? -PI / 2 : PI / 2;
      bldg(o.col, d, h, o.w - 0.25, cx, Y, cz, 0, 3.1, 3.6);
      S.box(DARK, 0.3, 2.7, o.w - 2.2, fx - dir * 0.02, Y + 0.5, cz);
      G.box(0xffe9b0, 0.12, 1.9, o.w - 3.2, fx - dir * 0.2, Y + 0.9, cz);
      S.box(o.trim, 0.5, 0.5, o.w - 0.6, fx - dir * 0.15, Y + 3.25, cz);
      S.box(o.trim, 1.1, 0.6, o.w, fx - dir * 0.3, Y + h, cz);
      S.box(o.trim, 0.3, h, 0.5, fx - dir * 0.12, Y, o.z + 0.3);
      S.box(o.trim, 0.3, h, 0.5, fx - dir * 0.12, Y, o.z + o.w - 0.3);
      const n = Math.max(3, Math.round(o.w - 1.6));
      for (let i = 0; i < n; i++) {
        S.box(i % 2 ? o.aw : WHITE, 2.3, 0.12, (o.w - 1.6) / n, fx - dir * 1.1, Y + 3.0, o.z + 0.8 + (i + 0.5) * (o.w - 1.6) / n, 0, 0, dir * 0.36);
      }
      const rc = ROOFS[o.roof[1]] || ROOFS.m, ry0 = Y + h + 0.6;
      if (o.roof[0] === 'M') {
        S.box(rc, d - 0.6, 3.2, o.w - 0.4, cx, ry0, cz);
        S.box(0x39424e, d - 3.4, 0.35, o.w - 2.6, cx, ry0 + 3.2, cz);
        for (let i = 0; i < Math.floor(o.w / 3.2); i++) {
          const dz = o.z + 1.9 + i * 3.2;
          S.box(o.trim, 0.9, 1.8, 1.5, fx + dir * 0.6, ry0 + 0.5, dz);
          G.box(0xffe7a8, 0.1, 1.1, 0.8, fx + dir * 0.12, ry0 + 0.8, dz);
        }
      } else if (o.roof[0] === 'G') {
        S.gable(rc, o.w - 0.2, 4.6, d, cx, ry0, cz, PI / 2);
        S.gable(o.col, o.w - 1, 4.2, 0.4, fx + dir * 0.1, ry0, cz, PI / 2);
        G.cyl(0xffe7a8, 0.7, 0.7, 0.2, fx - dir * 0.2, ry0 + 1.2, cz, 10, 0, PI / 2);
      } else if (o.roof[0] === 'P') {
        S.box(o.trim, 0.5, 1.5, o.w - 0.4, fx + dir * 0.3, ry0, cz);
        S.gable(o.trim, o.w * 0.5, 1.8, 0.5, fx + dir * 0.3, ry0 + 1.5, cz, PI / 2);
        S.box(0x4b5563, d - 1, 0.4, o.w - 0.6, cx + dir * 0.4, ry0, cz);
      } else {
        // Corner turret roof.
        S.box(rc, d - 0.6, 2.6, o.w - 0.4, cx, ry0, cz);
        const tz = o.z + (o.tz > 0 ? o.w - 2 : 2);
        turret(fx + dir * 2, Y + h - 3, tz, 2.4, 7.5, 5.5, o.col, rc, 8);
      }
      if (o.name) sign(o.name, Math.min(o.w - 1.4, 7.5), 1.05, fx - dir * 0.75, Y + 4.55, cz, ry, o.bg || '#fdf3d7', o.fg || '#7c2d12');
    }
    const WEST = [ // Discoveryland side (x 358..375, façades facing east)
      [9, 12.5, 0xf1e2b6, 0x7a4e2d, 0xb91c1c, 'Tb', 'RIBBONS & BOWS', -1],
      [8, 10.5, 0xbfd8c4, WHITE, 0x15803d, 'Mm', 'DISNEY CLOTHIERS'],
      [10, 12, 0xe9b7a6, WHITE, 0x1d4ed8, 'Pm', 'BOARDWALK CANDY PALACE'],
      [7, 10, 0xd9cdea, WHITE, 0x7e22ce, 'Gg', 'DISNEY & CO.'],
      [9, 11.5, 0xf3e6b3, 0x7a4e2d, 0xb91c1c, 'Mb', 'WALT’S — AN AMERICAN RESTAURANT'],
      [7, 10, 0xb9d3e6, WHITE, 0x1d4ed8, 'Pm', 'LILLY’S BOUTIQUE'],
      [8, 11, 0xe7c08e, WHITE, 0x15803d, 'Gr', 'DISNEYANA COLLECTIBLES'],
      [8, 12.5, 0xcfe3d2, WHITE, 0xb91c1c, 'Tg', 'CASEY’S CORNER', 1]
    ];
    const EAST = [ // Frontierland side (x 393..410, façades facing west)
      [10, 12.5, 0xe3c7a0, WHITE, 0x15803d, 'Tr', 'EMPORIUM', -1],
      [9, 11.5, 0xe8d8a8, 0x7a4e2d, 0x15803d, 'Mm', 'EMPORIUM'],
      [7, 10, 0xc6dceb, WHITE, 0xb91c1c, 'Gb', 'DAPPER DAN’S HAIR CUTS'],
      [9, 12, 0xe7b0a2, WHITE, 0x7e22ce, 'Mm', 'HARRINGTON’S FINE CHINA'],
      [7, 10, 0xd3e3c3, WHITE, 0x1d4ed8, 'Pm', 'MARKET HOUSE DELI'],
      [8, 11, 0xf0d9b0, 0x7a4e2d, 0xb91c1c, 'Gr', 'CABLE CAR BAKE SHOP'],
      [7, 10.5, 0xd9cdea, WHITE, 0x15803d, 'Pm', 'COOKIE KITCHEN'],
      [9, 12.5, 0xf6d7de, WHITE, 0xbe185d, 'Tm', 'GIBSON GIRL ICE CREAM', 1]
    ];
    for (const [row, dir] of [[WEST, -1], [EAST, 1]]) {
      let z = 851;
      for (const s of row) {
        shop({ dir, z, w: s[0], h: s[1], col: s[2], trim: s[3], aw: s[4], roof: s[5], name: s[6], tz: s[7] });
        z += s[0];
      }
      // Gas-lit glazed arcade behind the shops (Discovery Arcade west, Liberty Arcade east).
      const ax = X + dir * 29.5;
      S.box(0xd8c9a8, 0.6, 6.5, 66, ax + dir * 3, Y, 884);
      W.box(GLASSY, 5.2, 0.15, 66, ax, Y + 7.6, 884, 0, 0, dir * 0.22);
      S.box(IRON, 0.25, 0.25, 66, ax - dir * 2.6, Y + 7.1, 884);
      for (let i = 0; i <= 11; i++) {
        const az = 852 + i * 5.9;
        S.cyl(IRON, 0.14, 0.18, 6.6, ax - dir * 2.6, Y, az, 6);
        S.tor(IRON, 2.7, 0.1, ax, Y + 5.2, az, 0, PI / 2, 0, PI, 10);
        S.rod(IRON, 0.05, ax, Y + 7.3, az, ax, Y + 5.6, az, 4);
        G.sph(0xffd98a, 0.32, ax, Y + 5.3, az, 1, 1.25, 1, 6);
      }
      sign(dir > 0 ? 'LIBERTY ARCADE' : 'DISCOVERY ARCADE', 5, 1, ax, Y + 5.4, 850.6, PI, '#1f3a3a', '#fde68a');
      for (let i = 0; i < 7; i++) lamp(X + dir * 7.2, 855 + i * 10, 4.6);
      foot(X + dir * 20, 884, 36);
    }
    // Horse-drawn streetcar shuttling along the rails.
    const car = K.asm(X - 2, Y, 880);
    car.S.box(0xb91c1c, 2.2, 0.5, 6.4, 0, 0.5, 0);
    car.S.box(0xfde68a, 2.1, 0.35, 6.2, 0, 2.9, 0);
    car.S.box(0x14532d, 2.4, 0.2, 6.8, 0, 3.25, 0);
    for (const cz of [-3, -1, 1, 3]) for (const cx of [-1, 1]) car.S.cyl(0xfde68a, 0.06, 0.06, 2.0, cx, 1.0, cz, 4);
    for (const cz of [-2, 0, 2]) car.S.box(0x7a4e2d, 1.8, 0.5, 0.3, 0, 1.0, cz);
    for (const cz of [-2.2, 2.2]) for (const cx of [-1.05, 1.05]) car.S.cyl(0x1f2937, 0.4, 0.4, 0.15, cx - 0.075, 0.4, cz, 10, 0, PI / 2);
    car.S.box(0xe7e0d2, 0.7, 1.3, 2.0, 0, 0.9, 5.2); car.S.box(0xe7e0d2, 0.5, 1.0, 0.6, 0, 1.9, 6.3);
    for (const cz of [4.5, 5.9]) for (const cx of [-0.25, 0.25]) car.S.cyl(0xcfc6b4, 0.1, 0.1, 0.9, cx, 0, cz, 4);
    car.done();
    updaters.push((dt, t) => {
      const ph = Math.sin(t * 0.12);
      car.grp.position.z = 884 + ph * 30;
      car.grp.rotation.y = Math.cos(t * 0.12) >= 0 ? 0 : PI;
    });

    /* =============== CENTRAL PLAZA =============== */
    const HUBZ = P.zHub;
    S.cyl(0x3f8f3f, 5.6, 6, 0.5, X, Y, HUBZ, 20);
    for (let i = 0; i < 16; i++) S.cyl([0xf472b6, 0xfde047, 0xc084fc, 0xf87171][i % 4], 0.9, 1, 0.4, X + Math.cos(i * PI / 8) * 4, Y + 0.4, HUBZ + Math.sin(i * PI / 8) * 4, 8);
    S.cone(0x2f7438, 1.4, 3.6, X, Y + 0.5, HUBZ, 8);
    for (let i = 0; i < 12; i++) {
      const a = i * PI / 6 + PI / 12;
      lamp(X + Math.cos(a) * 27, HUBZ + Math.sin(a) * 27, 4.8);
      if (i % 3 !== 1) tree('oak', X + Math.cos(a + 0.26) * 22, HUBZ + Math.sin(a + 0.26) * 22, 0.9);
    }
    // Plaza Gardens Restaurant (Victorian pavilion on the Discoveryland side of the hub).
    bldg(0xf6e7c8, 22, 9, 14, X - 46, Y, 924, 0, 3.2, 4.5);
    S.box(0x55606d, 21, 3.4, 13, X - 46, Y + 9.5, 924);
    turret(X - 35.5, Y, 931, 3.2, 11, 6, 0xf6e7c8, 0x55606d, 8);
    sign('PLAZA GARDENS', 9, 1.2, X - 46, Y + 5.2, 931.2, 0, '#fdf6e3', '#14532d');
    foot(X - 46, 924, 15);

    /* =============== LE CHÂTEAU DE LA BELLE AU BOIS DORMANT =============== */
    const CZ = P.zCastle, y0 = Y + 4, ROCK = 0xa59a90, ROCK2 = 0x8d837b;
    // Rock outcrops the castle grows out of.
    for (let i = 0; i < 18; i++) {
      const a = i / 18 * PI * 2, rr = 0.86 + K.rng() * 0.18;
      const rx = X + Math.cos(a) * 19 * rr, rz = CZ + Math.sin(a) * 16 * rr;
      if (Math.abs(rx - X) < 6 && Math.abs(Math.sin(a)) > 0.8) continue;
      S.crag(i % 2 ? ROCK : ROCK2, 1.2 + K.rng() * 1.6, 3.2 + K.rng() * 2, 3.5 + K.rng() * 3.5, rx, Y + 0.6, rz, 6, K.rng() * 3);
    }
    const wallRun = (x1, z1, x2, z2, h, th) => {
      const len = Math.hypot(x2 - x1, z2 - z1), ry = -Math.atan2(z2 - z1, x2 - x1);
      S.box(PINK, len, h, th, (x1 + x2) / 2, y0, (z1 + z2) / 2, ry);
      S.box(PINK2, len + 0.4, 0.5, th + 0.7, (x1 + x2) / 2, y0 + h - 0.5, (z1 + z2) / 2, ry);
      const n = Math.floor(len / 1.6);
      for (let i = 0; i < n; i += 2) {
        const k = (i + 0.5) / n;
        S.box(PINK, 0.8, 0.9, th + 0.7, x1 + (x2 - x1) * k, y0 + h, z1 + (z2 - z1) * k, ry);
      }
    };
    const slit = (x, y, z, glow) => (glow ? G : S).box(glow ? 0xffe2a0 : DARK, 0.5, 1.5, 0.5, x, y, z);
    const gate = (z, w, h) => {
      for (const sx of [-1, 1]) S.box(PINK, 3.2, h, w, X + sx * 4.6, y0, z);
      S.box(PINK, 12.4, h - 6.2, w, X, y0 + 6.2, z);
      for (const f of [-1, 1]) S.tor(STONE, 3, 0.4, X, y0 + 3.4, z + f * (w / 2 + 0.05), 0, 0, 0, PI, 12);
    };
    // North gatehouse with the great stained-glass window, portcullis and twin drum towers.
    gate(CZ - 11, 5, 15);
    for (let i = -2; i <= 2; i++) S.cyl(0x4b4033, 0.08, 0.08, 1.6, X + i * 1.1, y0 + 4.9, CZ - 13.2, 4);
    S.gable(PINK, 12.4, 6, 5, X, y0 + 15, CZ - 11, 0);
    S.gable(BLUE, 13.6, 6.8, 4.6, X, y0 + 15.2, CZ - 10.7, 0);
    finial(X, y0 + 21.8, CZ - 11);
    G.cyl(0x7cc4ff, 2.1, 2.1, 0.2, X, y0 + 11.3, CZ - 13.6, 14, PI / 2);
    G.cyl(0xf9a8d4, 1.2, 1.2, 0.2, X, y0 + 11.3, CZ - 13.75, 8, PI / 2);
    S.tor(GOLD, 2.2, 0.16, X, y0 + 11.4, CZ - 13.6, 0, 0, 0, PI * 2, 16);
    for (const sx of [-1, 1]) {
      turret(X + sx * 8.2, y0 - 2, CZ - 12.5, 2.8, 21, 9.5, PINK, BLUE, 12);
      for (const hy of [6, 11, 15]) slit(X + sx * 8.2, y0 + hy, CZ - 15.1, hy === 11);
      turret(X + sx * 5.2, y0 + 15, CZ - 13.4, 0.8, 4.4, 3.4, PINK, BLUE, 8);
      // Outer curtain walls stepping back to the flanking towers.
      wallRun(X + sx * 10.5, CZ - 12, X + sx * 17, CZ - 7, 8, 1.6);
      turret(X + sx * 17.5, y0 - 3, CZ - 6.5, 2.1, 15, 6.5, PINK, BLUE, 10);
      wallRun(X + sx * 17.5, CZ - 5, X + sx * 16, CZ + 6, 7, 1.6);
      turret(X + sx * 16, y0 - 3, CZ + 7, 1.8, 13, 5.5, PINK, BLUE, 10);
      wallRun(X + sx * 15, CZ + 8, X + sx * 6.4, CZ + 12, 6.5, 1.6);
      S.box(STONE, 0.8, 1.1, 12, X + sx * 4.6, Y, 973);
      for (let i = 0; i < 4; i++) S.cyl(STONE, 0.5, 0.5, 1.8, X + sx * 4.6, Y, 968 + i * 3.6, 6);
    }
    // The keep: octagonal great tower, gallery, upper lantern and the tall spire.
    S.cyl(PINK, 5.6, 6, 21, X, y0, CZ + 2, 8);
    S.cyl(PINK2, 6.6, 5.6, 1.4, X, y0 + 20, CZ + 2, 8);
    for (let i = 0; i < 8; i++) {
      const a = i * PI / 4 + PI / 8;
      S.box(PINK, 1, 1, 0.9, X + Math.cos(a) * 6.2, y0 + 21.4, CZ + 2 + Math.sin(a) * 6.2, -a);
      if (i % 2) turret(X + Math.cos(a) * 5.9, y0 + 17, CZ + 2 + Math.sin(a) * 5.9, 1.05, 6.5, 4.4, PINK, BLUE, 8);
      (i % 3 === 0 ? G : S).box(i % 3 === 0 ? 0xffe2a0 : DARK, 0.7, 2.2, 0.7, X + Math.cos(a - PI / 8) * 5.5, y0 + 12, CZ + 2 + Math.sin(a - PI / 8) * 5.5, -(a - PI / 8));
    }
    S.cyl(PINK, 3.9, 4.2, 9, X, y0 + 21.4, CZ + 2, 8);
    S.cyl(PINK2, 4.7, 3.9, 0.9, X, y0 + 29.6, CZ + 2, 8);
    S.cone(BLUE, 5.1, 13.5, X, y0 + 30.5, CZ + 2, 8);
    S.cone(GOLD, 0.9, 2.4, X, y0 + 42.6, CZ + 2, 8);
    finial(X, y0 + 44.6, CZ + 2, 1.5);
    for (let i = 0; i < 4; i++) G.box(0x9bd0ff, 1.1, 3, 0.3, X + Math.cos(i * PI / 2 + PI / 2) * 4.05, y0 + 24, CZ + 2 + Math.sin(i * PI / 2 + PI / 2) * 4.05, -(i * PI / 2 + PI / 2) + PI / 2);
    // Spiral staircase turret climbing the keep, wrapped by a golden helix.
    const sx0 = X + 6.8, sz0 = CZ - 1.6;
    turret(sx0, y0, sz0, 1.7, 31, 7.5, PINK, BLUE, 10);
    for (let i = 0; i < 44; i++) {
      const a0 = i * 0.42, a1 = (i + 1) * 0.42, h0 = 3 + i * 0.62, h1 = 3 + (i + 1) * 0.62;
      S.rod(GOLD, 0.09, sx0 + Math.cos(a0) * 1.78, y0 + h0, sz0 + Math.sin(a0) * 1.78, sx0 + Math.cos(a1) * 1.78, y0 + h1, sz0 + Math.sin(a1) * 1.78, 4);
    }
    // Slender west tower, east great hall with its square tower, and the lower west wing.
    turret(X - 8.6, y0, CZ + 6.5, 2.2, 27, 10.5, PINK, BLUE, 10);
    turret(X - 6.5, y0 + 20, CZ + 8.2, 0.85, 5, 3.6, PINK, BLUE, 8);
    S.box(PINK, 11, 11, 8, X + 11.5, y0, CZ + 4);
    S.gable(BLUE, 9.2, 6.5, 11.8, X + 11.5, y0 + 11, CZ + 4, PI / 2);
    for (let i = -1; i <= 1; i++) G.box(0x9bd0ff, 1.3, 3.6, 0.2, X + 11.5 + i * 3, y0 + 4.2, CZ - 0.05);
    S.box(PINK, 5.2, 21, 5.2, X + 14.6, y0, CZ + 9.2);
    S.box(PINK2, 6, 0.8, 6, X + 14.6, y0 + 20.4, CZ + 9.2);
    S.pyr(BLUE, 6.4, 9.5, 6.4, X + 14.6, y0 + 21.2, CZ + 9.2);
    finial(X + 14.6, y0 + 30.7, CZ + 9.2, 1.1);
    S.box(PINK, 9, 8.5, 7, X - 11.5, y0, CZ - 0.5);
    S.gable(BLUE, 8, 5.4, 9.8, X - 11.5, y0 + 8.5, CZ - 0.5, PI / 2);
    turret(X - 16, y0, CZ - 3.6, 1.5, 12.5, 5.5, PINK, BLUE, 8);
    // South gate towards Fantasyland.
    gate(CZ + 12.5, 4, 11);
    S.gable(BLUE, 13, 5, 4.4, X, y0 + 11, CZ + 12.5, 0);
    for (const sx of [-1, 1]) turret(X + sx * 6.6, y0 - 1, CZ + 13.2, 1.5, 14.5, 6, PINK, BLUE, 8);
    // Square "Sleeping Beauty" topiary trees on the slopes, waterfall and the dragon's lair.
    for (let i = 0; i < 26; i++) {
      const a = i / 26 * PI * 2 + 0.12, rr = 0.72 + (i % 3) * 0.1;
      const tx = X + Math.cos(a) * 27 * rr, tz = CZ + Math.sin(a) * 23 * rr;
      if (Math.abs(tx - X) < 7) continue;
      const ty = hmAt(tx, tz), k = 1.7 + (i % 4) * 0.35;
      S.cyl(0x6b4a2f, 0.18, 0.22, 1.5, tx, ty, tz, 5);
      S.box(i % 2 ? 0x3f9447 : 0x2f7d3b, k, k, k, tx, ty + 1.4, tz, a);
    }
    W.box(0xdff3ff, 3, 0.25, 9.5, X - 19.5, Y + 0.1, CZ - 10.5, 0.5, -0.62);
    W.box(0xc7ebff, 2.2, 0.25, 9.5, X - 19.3, Y + 0.25, CZ - 10.4, 0.5, -0.62);
    S.crag(ROCK2, 2.6, 4.2, 5.2, X + 20.5, Y - 1, CZ - 9, 6, 1);
    S.sph(DARK, 2.2, X + 20, Y + 0.6, CZ - 11.4, 1, 0.9, 0.6, 8);
    S.sph(0x5d8a3c, 1.25, X + 20.2, Y + 0.4, CZ - 12.6, 1.5, 0.75, 1, 8);
    S.cone(0x4a7030, 0.3, 1, X + 19.2, Y + 0.9, CZ - 12.2, 5); S.cone(0x4a7030, 0.3, 1, X + 21.2, Y + 0.9, CZ - 12.2, 5);
    G.sph(0xffb020, 0.2, X + 19.5, Y + 0.7, CZ - 13.6, 1, 1, 1, 6); G.sph(0xffb020, 0.2, X + 20.9, Y + 0.7, CZ - 13.6, 1, 1, 1, 6);
    foot(X, CZ, 30);
    interactables.push({ id: 'paris_dragon', name: '城堡地下巨龙洞穴', x: X + 18, y: Y, z: CZ - 16, msg: '🐉 La Tanière du Dragon —— 沉睡在睡美人城堡下的巨龙睁开了琥珀色的眼睛，鼻孔喷出一缕白烟！' });

    /* =============== FANTASYLAND =============== */
    const tudor = (x, z, w, d, h, wall, roof, ry) => {
      S.box(wall, w, h, d, x, Y, z, ry);
      S.box(0x5b3b28, w + 0.15, 0.3, d + 0.15, x, Y + h * 0.5, z, ry);
      S.box(0x5b3b28, w + 0.15, 0.3, d + 0.15, x, Y + h - 0.3, z, ry);
      S.gable(roof, w + 1.2, h * 0.7, d + 1.2, x, Y + h, z, ry);
      foot(x, z, Math.max(w, d) * 0.6);
    };
    // Blanche-Neige et les Sept Nains + Les Voyages de Pinocchio (west), Peter Pan's Flight (east).
    tudor(X - 44, 1030, 16, 10, 7, 0xf1e3c2, 0x8c4a36, 0);
    tudor(X - 30, 1028, 9, 9, 9, 0xe9d2a6, 0x6e4a3a, PI / 2);
    turret(X - 37, Y, 1024.5, 1.7, 12, 6, 0xf1e3c2, 0x8c4a36, 8);
    tudor(X - 60, 1034, 13, 9, 6.5, 0xf4d9b0, 0xa8553d, 0.25);
    sign('BLANCHE-NEIGE ET LES SEPT NAINS', 10, 1.1, X - 44, Y + 4.6, 1035.3, 0, '#3b2a20', '#fde68a');
    sign('LES VOYAGES DE PINOCCHIO', 9, 1, X - 60.8, Y + 4.4, 1038.8, 0.25, '#3b2a20', '#fde68a');
    tudor(X + 42, 1030, 18, 10, 7.5, 0xdfe6ee, 0x35507a, 0);
    S.box(0xdfe6ee, 4.4, 15, 4.4, X + 33, Y, 1027);
    S.pyr(0x35507a, 5.4, 6, 5.4, X + 33, Y + 15, 1027);
    S.cyl(WHITE, 1.4, 1.4, 0.2, X + 33, Y + 11.4, 1029.3, 14, PI / 2);
    finial(X + 33, Y + 21, 1027);
    sign('PETER PAN’S FLIGHT', 9, 1.1, X + 42, Y + 4.8, 1035.3, 0, '#1e2f52', '#fde68a');
    tudor(X + 62, 1036, 14, 10, 7, 0xf3e1ea, 0x7a4a8c, -0.25);
    sign('AUBERGE DE CENDRILLON', 8, 1, X + 61, Y + 4.6, 1041.2, -0.25, '#3b2a4a', '#fde68a');

    // Le Carrousel de Lancelot.
    const CAZ = 1048;
    S.cyl(0xd9c7a0, 9.4, 9.8, 0.5, X, Y, CAZ, 20);
    S.fan(0x2f5fa8, 0xe6c15a, 10.4, 4.2, X, Y + 6.2, CAZ, 16);
    S.cyl(0xe6c15a, 10.4, 10.4, 0.9, X, Y + 5.4, CAZ, 16);
    S.cyl(0xb8322c, 2, 2, 5.4, X, Y + 0.5, CAZ, 10);
    S.cone(0x2f5fa8, 2.2, 3.4, X, Y + 10, CAZ, 8);
    finial(X, Y + 13.4, CAZ, 1.2);
    for (let i = 0; i < 8; i++) {
      const a = i * PI / 4;
      S.cyl(0xe6c15a, 0.16, 0.16, 5, X + Math.cos(a) * 9.6, Y + 0.5, CAZ + Math.sin(a) * 9.6, 5);
      S.cone(0xb8322c, 0.7, 2, X + Math.cos(a) * 9.9, Y + 6.3, CAZ + Math.sin(a) * 9.9, 6);
    }
    const spin = K.asm(X, Y + 0.5, CAZ);
    for (let i = 0; i < 20; i++) {
      const a = i / 20 * PI * 2, rr = i % 2 ? 7.6 : 5.2, hx = Math.cos(a) * rr, hz = Math.sin(a) * rr, hy = 1 + (i % 3) * 0.3;
      const hc = [0xfafafa, 0x8a5a36, 0x2b2b2b, 0xd9b98a][i % 4];
      spin.S.cyl(0xe6c15a, 0.05, 0.05, 4.8, hx, 0, hz, 4);
      spin.S.box(hc, 0.45, 0.6, 1.5, hx, hy, hz, -a);
      spin.S.box(hc, 0.3, 0.8, 0.45, hx - Math.sin(a) * 0.7, hy + 0.45, hz + Math.cos(a) * 0.7, -a);
      spin.S.box([0xb8322c, 0x2f5fa8, 0x15803d][i % 3], 0.5, 0.2, 0.6, hx, hy + 0.6, hz, -a);
    }
    spin.done();
    updaters.push((dt) => { spin.grp.rotation.y += dt * 0.5; });
    foot(X, CAZ, 12);

    // Dumbo the Flying Elephant.
    const DX = X - 40, DZ = 1058;
    W.cyl(0x8fd3ff, 9, 9, 0.5, DX, Y, DZ, 18);
    S.tor(STONE, 9, 0.5, DX, Y + 0.3, DZ, PI / 2, 0, 0, PI * 2, 20);
    S.cyl(0xb8322c, 1.4, 2.2, 5, DX, Y, DZ, 10);
    S.sph(0xfacc15, 2, DX, Y + 6.4, DZ, 1, 1, 1, 10);
    S.cone(0xe6c15a, 1.2, 2, DX, Y + 8, DZ, 8);
    const dumbo = K.asm(DX, Y + 4.6, DZ);
    const dParts = [];
    for (let i = 0; i < 10; i++) {
      const a = i / 10 * PI * 2, e = K.asm(0, 0, 0);
      e.S.box(0xe6c15a, 7.6, 0.22, 0.22, 3.8, 0, 0);
      e.S.sph(0x9aa3b0, 0.95, 7.8, 0, 0, 1.5, 1, 1, 8);
      e.S.sph(0x9aa3b0, 0.6, 7.8, 0.55, -1.15, 1, 1, 1, 8);
      e.S.box(0x8b94a3, 0.12, 1.2, 1.3, 7.2, 0.6, -1.0, 0.5); e.S.box(0x8b94a3, 0.12, 1.2, 1.3, 8.4, 0.6, -1.0, -0.5);
      e.S.box([0xf472b6, 0x60a5fa, 0xfacc15, 0xa78bfa, 0x34d399][i % 5], 1, 0.5, 0.1, 7.8, 1.15, -1.2);
      e.grp.rotation.y = a; dumbo.grp.add(e.done()); dParts.push(e.grp);
    }
    dumbo.done();
    updaters.push((dt, t) => {
      dumbo.grp.rotation.y -= dt * 0.55;
      dParts.forEach((g, i) => { g.rotation.z = 0.18 + Math.sin(t * 0.9 + i * 1.3) * 0.2; });
    });
    foot(DX, DZ, 11);
    sign('DUMBO THE FLYING ELEPHANT', 8, 0.9, DX, Y + 2.6, DZ - 10.2, PI, '#7c2d12', '#fde68a');

    // Mad Hatter's Tea Cups under the glass petal canopy.
    const TX = X + 40, TZ2 = 1058;
    S.cyl(0xe9d5f5, 10, 10.4, 0.4, TX, Y, TZ2, 20);
    for (let i = 0; i < 10; i++) {
      const a = i * PI / 5;
      S.cyl(0x7e5bb5, 0.2, 0.26, 6.4, TX + Math.cos(a) * 10.4, Y, TZ2 + Math.sin(a) * 10.4, 6);
      S.rod(0x7e5bb5, 0.12, TX + Math.cos(a) * 10.4, Y + 6.4, TZ2 + Math.sin(a) * 10.4, TX, Y + 10.5, TZ2, 4);
    }
    W.cone(0xc9b6ff, 11.6, 4.4, TX, Y + 6.3, TZ2, 20);
    S.cyl(0xf472b6, 1.3, 1.3, 1.6, TX, Y + 10.4, TZ2, 8);
    S.cone(0x7e5bb5, 1.7, 2.4, TX, Y + 12, TZ2, 8);
    const cups = K.asm(TX, Y + 0.4, TZ2), cupG = [];
    cups.S.cyl(0xfbf6ee, 1.1, 0.9, 1.5, 0, 0.2, 0, 10); cups.S.cone(0xf472b6, 0.8, 1, 0, 1.7, 0, 8);
    for (let i = 0; i < 12; i++) {
      const a = i / 12 * PI * 2, rr = i % 2 ? 7.4 : 4.2, c = K.asm(Math.cos(a) * rr, 0, Math.sin(a) * rr);
      const cc = [0xf9a8d4, 0x93c5fd, 0xfde68a, 0xa7f3d0, 0xd8b4fe, 0xfdba74][i % 6];
      c.S.cyl(0xfbf6ee, 1.35, 1.35, 0.12, 0, 0.05, 0, 12);
      c.S.cyl(cc, 1.1, 0.75, 1.05, 0, 0.15, 0, 12);
      c.S.tor(cc, 0.36, 0.1, 1.25, 0.7, 0, 0, 0, 0, PI * 2, 8);
      cups.grp.add(c.done()); cupG.push(c.grp);
    }
    cups.done();
    updaters.push((dt) => { cups.grp.rotation.y += dt * 0.6; cupG.forEach((g, i) => { g.rotation.y -= dt * (1.6 + (i % 3) * 0.5); }); });
    foot(TX, TZ2, 12);
    sign('MAD HATTER’S TEA CUPS', 8, 0.9, TX, Y + 2.6, TZ2 - 11, PI, '#4c1d95', '#fde68a');

    // Alice's Curious Labyrinth with the Queen of Hearts' Castle.
    const AX = X + 66, AZ = 1076, HEDGE = 0x2f7d3b;
    for (let r = 0; r < 4; r++) {
      const hw = 17 - r * 4, hd = 11 - r * 2.6;
      for (const f of [-1, 1]) {
        S.box(HEDGE, hw * 2 - (f < 0 && r % 2 === 0 ? 4 : 0), 2.1, 1, AX + (f < 0 && r % 2 === 0 ? 2 : 0), Y, AZ + f * hd);
        S.box(r % 2 ? 0x3f9447 : HEDGE, 1, 2.1, hd * 2 - (f > 0 && r % 2 ? 4 : 0), AX + f * hw, Y, AZ + (f > 0 && r % 2 ? 2 : 0));
      }
    }
    const QZ = AZ + 3;
    S.box(0xd77aa8, 5, 6, 5, AX, Y, QZ);
    S.box(0x8e4fa3, 6, 0.6, 6, AX, Y + 6, QZ);
    S.cyl(0xf3a6c4, 1.7, 2, 6, AX, Y + 6.6, QZ, 6);
    S.cone(0x8e4fa3, 2.4, 4, AX, Y + 12.6, QZ, 6);
    for (const [ox, oz] of [[-2.6, -2.6], [2.6, -2.6], [-2.6, 2.6], [2.6, 2.6]]) {
      S.cyl(0xf3a6c4, 0.8, 0.9, 8, AX + ox, Y, QZ + oz, 6);
      S.cone(0xc0392b, 1.1, 2.4, AX + ox, Y + 8, QZ + oz, 6);
      G.sph(0xff5a7a, 0.34, AX + ox, Y + 10.8, QZ + oz, 1.2, 1, 0.5, 6);
    }
    G.sph(0xff5a7a, 0.5, AX, Y + 17, QZ, 1.2, 1, 0.5, 6);
    // Cheshire Cat floral face at the entrance.
    S.cyl(0xc084fc, 2.6, 2.8, 0.4, AX, Y, AZ - 14.5, 14);
    G.sph(0xfde047, 0.4, AX - 0.9, Y + 0.6, AZ - 15, 1, 0.4, 1, 6); G.sph(0xfde047, 0.4, AX + 0.9, Y + 0.6, AZ - 15, 1, 0.4, 1, 6);
    S.tor(WHITE, 1.3, 0.14, AX, Y + 0.5, AZ - 14.1, PI / 2, 0, PI, PI, 10);
    sign('ALICE’S CURIOUS LABYRINTH', 9, 1, AX, Y + 3.6, AZ - 12.2, PI, '#4c1d95', '#fde68a');
    foot(AX, AZ, 20);

    // "it's a small world" — the white, gold and pastel kinetic façade with its smiling clock tower.
    const WX = X - 56, WZ = 1092, PAST = [0xfde2ea, 0xdbeafe, 0xfef3c7, 0xdcfce7, 0xede9fe, 0xffffff];
    S.box(0xf8fafc, 62, 7, 8, WX, Y, WZ + 4);
    for (let i = 0; i < 15; i++) {
      const bx = WX - 29 + i * 4.15, bh = 6 + ((i * 7) % 5) * 1.7 + (Math.abs(i - 7) < 2 ? 4 : 0), kind = i % 4;
      S.box(PAST[i % 6], 3.6, bh, 1.2, bx, Y, WZ - 0.4);
      S.box(GOLD, 3.8, 0.25, 1.3, bx, Y + bh, WZ - 0.4);
      if (kind === 0) S.cone(PAST[(i + 2) % 6], 1.9, 3.6, bx, Y + bh + 0.2, WZ - 0.4, 4, PI / 4);
      else if (kind === 1) S.dome(PAST[(i + 3) % 6], 1.7, bx, Y + bh + 0.2, WZ - 0.4, 1.1, 10);
      else if (kind === 2) { S.cyl(PAST[(i + 1) % 6], 1, 1, 2.6, bx, Y + bh + 0.2, WZ - 0.4, 8); S.cone(GOLD, 1.3, 2, bx, Y + bh + 2.8, WZ - 0.4, 8); }
      else S.gable(PAST[(i + 4) % 6], 3.6, 2.6, 1.2, bx, Y + bh + 0.2, WZ - 0.4, 0);
      G.box(i % 2 ? 0xbfe3ff : 0xffe7a8, 1.2, 1.6, 0.1, bx, Y + bh * 0.5, WZ - 1.05);
    }
    S.box(0xffffff, 6, 20, 2, WX, Y, WZ - 0.8);
    S.box(GOLD, 6.6, 0.4, 2.4, WX, Y + 20, WZ - 0.8);
    S.cone(0xdbeafe, 3.4, 5, WX, Y + 20.4, WZ - 0.8, 4, PI / 4);
    finial(WX, Y + 25.4, WZ - 0.8, 1.2);
    S.cyl(GOLD, 2.7, 2.7, 0.3, WX, Y + 14.6, WZ - 1.9, 20, PI / 2);
    S.cyl(0xfff6d6, 2.4, 2.4, 0.3, WX, Y + 14.6, WZ - 2.05, 20, PI / 2);
    S.sph(DARK, 0.26, WX - 0.8, Y + 15.3, WZ - 2.2, 1, 1, 0.4, 6); S.sph(DARK, 0.26, WX + 0.8, Y + 15.3, WZ - 2.2, 1, 1, 0.4, 6);
    S.tor(0xdc2626, 1.1, 0.12, WX, Y + 14.7, WZ - 2.2, 0, 0, PI, PI, 10);
    const pins = [];
    for (const px of [-22, -11, 11, 22]) {
      const pw = K.asm(WX + px, Y + 13.5, WZ - 1.3);
      for (let i = 0; i < 6; i++) pw.S.box(i % 2 ? GOLD : 0xffffff, 0.5, 2.2, 0.12, Math.cos(i * PI / 3 + PI / 2) * 1.1, Math.sin(i * PI / 3 + PI / 2) * 1.1 - 1.1, 0, 0, 0, i * PI / 3);
      pw.done(); pins.push(pw.grp);
      S.cyl(GOLD, 0.1, 0.1, 5, WX + px, Y + 9, WZ - 1, 4);
    }
    updaters.push((dt) => { pins.forEach((g, i) => { g.rotation.z += dt * (i % 2 ? 1.1 : -1.4); }); });
    sign('it’s a small world', 12, 1.5, WX, Y + 3.4, WZ - 1.2, PI, '#ffffff', '#c2932f');
    foot(WX, WZ + 2, 32);
    for (let i = 0; i < 9; i++) lamp(X - 80 + i * 20, 1050 + (i % 2) * 18, 4.4);
  });
})(window);

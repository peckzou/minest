async (page) => {
  const errs = [], out = {};
  page.on('pageerror', (e) => errs.push('PAGEERR ' + e.message));
  page.on('console', (m) => { if (m.type() === 'error' && !/404|Failed to load resource/.test(m.text())) errs.push(m.text().slice(0, 200)); });
  await page.unroute('https://admont.test/**').catch(() => {});
  await page.route('https://admont.test/**', async (route) => {
    const path = decodeURIComponent(route.request().url().replace('https://admont.test', '').split('?')[0]);
    try { await route.fulfill({ path: '/projects/sandbox' + path }); } catch (e) { await route.fulfill({ status: 404, body: 'nf' }); }
  });
  await page.setViewportSize({ width: 1280, height: 760 });
  const T = (ms) => page.waitForTimeout(ms);
  const SS = (n) => page.screenshot({ path: '/projects/sandbox/.kiro/artifacts/screenshots/' + n + '.png' });
  await page.goto('https://admont.test/downton/downton.html?mode=walk&t=10.5&v=' + Date.now());
  await page.waitForFunction(() => document.getElementById('loading').classList.contains('done'), null, { timeout: 240000 });
  await T(1500);
  const st = () => page.evaluate(() => { const s = window.__da; return { x: +s.player.pos.x.toFixed(2), y: +s.player.pos.y.toFixed(2), z: +s.player.pos.z.toFixed(2), sit: !!s.S.sit, mode: s.S.mode, indoor: s.indoor() }; });
  const doorOpen = (x, z, y) => page.evaluate(([x, z, y]) => { const d = window.__da.world.doors.find((q) => q.x === x && q.z === z && (y == null || q.y === y)); return d ? d.open : 'none'; }, [x, z, y]);
  // hold W until a predicate on the position holds (software rendering is slow, so measure by position, not time)
  async function walkUntil(pred, maxMs) { await page.keyboard.down('KeyW'); const t0 = Date.now(); let p = await st(); while (!pred(p) && Date.now() - t0 < maxMs) { await T(250); p = await st(); } await page.keyboard.up('KeyW'); return p; }
  out.spawn = await st();
  // 1 walk the drive towards the house
  out.walkDrive = await walkUntil((p) => p.z > out.spawn.z + 6, 15000);
  // 2 the front door under the porte-cochere: E opens it, then walk into the entrance hall
  await page.evaluate(() => window.__da.teleport({ mode: 'walk', p: [128.0, 41, 87.5], t: [128.0, 42.5, 90.5] })); await T(700);
  const d0 = await doorOpen(128, 90);
  await page.keyboard.press('KeyE'); await T(600);
  out.frontDoor = { before: d0, after: await doorOpen(128, 90), block: await page.evaluate(() => window.__da.world.get(128, 41, 90)) };
  await SS('da-door');
  out.entered = await walkUntil((p) => p.z > 93, 15000);
  // 3 the grand staircase: lower flight east to the landing, then a return flight west to the first-floor gallery
  await page.evaluate(() => window.__da.teleport({ mode: 'walk', p: [138.5, 41, 114.5], t: [146, 43, 114.5] })); await T(700);
  out.stairUp1 = await walkUntil((p) => p.x > 144.5, 15000);
  await page.evaluate(() => { const s = window.__da; s.teleport({ mode: 'walk', p: [144.5, s.player.pos.y, 108.5], t: [136, 49.5, 108.5] }); }); await T(700);
  out.landing = await st();
  out.stairUp2 = await walkUntil((p) => p.x < 139 || p.y >= 47.9, 15000);
  out.stairUp2b = await walkUntil((p) => p.x < 138, 6000);
  await SS('da-stair-top');
  // 4 a door between rooms: the Drawing Room <- Music Room door at (X[2]=136, g, 131)
  await page.evaluate(() => window.__da.teleport({ mode: 'walk', p: [134.5, 41, 131.5], t: [137, 42.5, 131.5] })); await T(700);
  const d1 = await doorOpen(136, 131);
  await page.keyboard.press('KeyE'); await T(600);
  out.roomDoor = { before: d1, after: await doorOpen(136, 131) };
  out.intoDrawing = await walkUntil((p) => p.x > 138, 12000);
  // 5 sit on a sofa in the Drawing Room, look round, stand up
  await page.evaluate(() => { const s = window.__da, b = s.world.seats.find((q) => q.y === 42 && q.x > 140 && q.x < 142 && q.z > 129 && q.z < 134); window.__seat = b; s.teleport({ mode: 'walk', p: [b.x + 1.3, 41, b.z], t: [b.x, 41.6, b.z] }); }); await T(600);
  await page.keyboard.press('KeyE'); await T(700); out.sit = await st();
  out.seat = await page.evaluate(() => window.__seat);
  await T(800); await SS('da-sit');
  await page.keyboard.down('KeyW'); await T(400); await page.keyboard.up('KeyW'); await T(300); out.stand = await st();
  // 6 out through the south door onto the terrace (indoor -> outdoor)
  await page.evaluate(() => window.__da.teleport({ mode: 'walk', p: [128.0, 41, 137.5], t: [128.0, 42.5, 141] })); await T(700);
  out.southIndoor = await st();
  await page.keyboard.press('KeyE'); await T(600);
  out.southDoor = await doorOpen(128, 140);
  out.outside = await walkUntil((p) => p.z > 143, 12000);
  // 7 night: the house lit from the park, the Library by firelight
  await page.evaluate(() => { window.__da.S.time = 21.8; window.__da.S.auto = false; window.__da.teleport({ mode: 'fly', p: [128.5, 50, 40], t: [128, 52, 110] }); }); await T(2200);
  await SS('da-night-front');
  out.lightsNight = await page.evaluate(() => window.__da.lights().length);
  await page.evaluate(() => { window.__da.S.time = 21.8; window.__da.teleport({ mode: 'walk', p: [116.5, 41, 128.5], t: [104, 43, 131] }); }); await T(2200);
  await SS('da-night-library');
  out.indoorLib = await page.evaluate(() => window.__da.indoor());
  out.stats = await page.evaluate(() => window.__da.stats());
  out.heap = await page.evaluate(() => performance.memory ? Math.round(performance.memory.usedJSHeapSize / 1e6) : null);
  return JSON.stringify({ out, errs: errs.slice(0, 8) });
}

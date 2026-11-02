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
  await page.goto('https://admont.test/bibury/bibury.html?mode=walk&t=10.5&v=' + Date.now());
  await page.waitForFunction(() => document.getElementById('loading').classList.contains('done'), null, { timeout: 240000 });
  await T(1500);
  const st = () => page.evaluate(() => { const s = window.__bb; return { x: +s.player.pos.x.toFixed(2), y: +s.player.pos.y.toFixed(2), z: +s.player.pos.z.toFixed(2), sit: !!s.S.sit, mode: s.S.mode, indoor: s.indoor() }; });
  const doorOpen = (x, z, y) => page.evaluate(([x, z, y]) => { const d = window.__bb.world.doors.find((q) => q.x === x && q.z === z && (y == null || q.y === y)); return d ? d.open : 'none'; }, [x, z, y]);
  // hold W until a predicate on the position holds (software rendering is slow, so measure by position, not time)
  async function walkUntil(pred, maxMs) { await page.keyboard.down('KeyW'); const t0 = Date.now(); let p = await st(); while (!pred(p) && Date.now() - t0 < maxMs) { await T(250); p = await st(); } await page.keyboard.up('KeyW'); return p; }
  out.spawn = await st();
  const lm = (id) => page.evaluate((id) => window.__bb.world.landmarks.find((l) => l.id === id), id);
  const tp = (p, t, mode) => page.evaluate(([p, t, m]) => window.__bb.teleport({ mode: m || 'walk', p, t }), [p, t, mode]);
  // 1 walk up the lane along Arlington Row (the spawn looks west, up the lane)
  out.walkLane = await walkUntil((p) => p.x < out.spawn.x - 6, 15000);
  // 2 cottage No. 8 (a parlour): the front door on z 123 at x 93; E opens it, walk in
  const g = (await lm('row8')).top - 3; out.g = g;
  await tp([93.5, g, 121.5], [93.5, g + 1.5, 126]); await T(700);
  const d0 = await doorOpen(93, 123);
  await page.keyboard.press('KeyE'); await T(600);
  out.frontDoor = { before: d0, after: await doorOpen(93, 123) };
  await SS('bb-door');
  out.entered = await walkUntil((p) => p.z > 124.6, 15000);
  out.bannerIn = await page.evaluate(() => document.getElementById('bannerT').textContent);
  // 3 the stair: the foot at (96, 128), the flight climbs west to the landing at x 93, then into the bedroom
  await tp([96.5, g, 127.5], [96.5, g + 1, 131]); await T(700);
  out.stairFoot = await walkUntil((p) => p.y >= g + 0.9, 8000);
  await page.evaluate(() => { const s = window.__bb; s.teleport({ mode: 'walk', p: [s.player.pos.x, s.player.pos.y, 128.5], t: [88, s.player.pos.y + 2, 128.5] }); }); await T(600);
  out.stairTop = await walkUntil((p) => p.x < 94 || p.y >= g + 3.9, 15000);
  await page.evaluate(() => { const s = window.__bb; s.teleport({ mode: 'walk', p: [93.5, s.player.pos.y, 128.5], t: [93.5, s.player.pos.y + 1.4, 120] }); }); await T(600);
  out.upstairs = await walkUntil((p) => p.z < 126.6, 8000);
  await T(900); out.bannerUp = await page.evaluate(() => document.getElementById('bannerT').textContent);
  await SS('bb-upstairs-walk');
  // 4 sit on the bedroom chair, stand up
  await page.evaluate((g) => { const s = window.__bb, b = s.world.seats.find((q) => q.y === g + 5 && Math.abs(q.x - 94.5) < 0.1 && Math.abs(q.z - 125.5) < 0.1); window.__seat = b; s.teleport({ mode: 'walk', p: [b.x - 1, g + 4, b.z], t: [b.x, g + 4.6, b.z] }); }, g); await T(600);
  await page.keyboard.press('KeyE'); await T(700); out.sit = await st(); out.seat = await page.evaluate(() => window.__seat);
  await SS('bb-sit');
  await page.keyboard.down('KeyW'); await T(400); await page.keyboard.up('KeyW'); await T(300); out.stand = await st();
  // 5 out through the front door into the lane (indoor -> outdoor)
  await tp([93.5, g, 124.5], [93.5, g + 1.5, 118]); await T(900); out.inside = await st();
  out.outside = await walkUntil((p) => p.z < 121.2, 12000); await T(900); out.outside = await st();
  // 6 the Swan: the door from the bar into the dining room
  const sw = (await lm('swanBar')).top - 3;
  await tp([236.5, sw, 113.5], [236.5, sw + 1.5, 118]); await T(700);
  const d1 = await doorOpen(236, 115); await page.keyboard.press('KeyE'); await T(600);
  out.swanDoor = { before: d1, after: await doorOpen(236, 115) }; out.swanDining = await walkUntil((p) => p.z > 116.6, 12000);
  // 7 St Mary's: the south door from the porch, then sit in a pew
  const cg = (await lm('nave')).top - 6;
  await tp([224.5, cg, 46.5], [224.5, cg + 1.5, 40]); await T(700);
  const d2 = await doorOpen(224, 44); await page.keyboard.press('KeyE'); await T(600);
  out.churchDoor = { before: d2, after: await doorOpen(224, 44) }; out.inNave = await walkUntil((p) => p.z < 43, 12000);
  await page.evaluate((cg) => { const s = window.__bb, b = s.world.seats.find((q) => q.y === cg + 1 && Math.abs(q.x - 226.5) < 0.1 && Math.abs(q.z - 40.5) < 0.1); s.teleport({ mode: 'walk', p: [b.x, cg, b.z - 1.2], t: [b.x, cg + 0.6, b.z] }); }, cg); await T(600);
  await page.keyboard.press('KeyE'); await T(700); out.pew = await st();
  await SS('bb-pew');
  // 8 night: the row from the lane, a cottage by firelight
  await page.evaluate(() => { window.__bb.S.time = 21.8; window.__bb.S.auto = false; window.__bb.teleport({ mode: 'fly', p: [161.5, 44, 119.5], t: [100, 46, 124] }); }); await T(2200);
  await SS('bb-night-lane');
  out.lightsNight = await page.evaluate(() => window.__bb.lights());
  await page.evaluate((g) => { window.__bb.teleport({ mode: 'walk', p: [93.5, g, 127.5], t: [97, g + 1, 125] }); }, g); await T(2200);
  await SS('bb-night-cottage');
  out.indoorNight = await page.evaluate(() => window.__bb.indoor());
  out.stats = await page.evaluate(() => window.__bb.stats());
  out.heap = await page.evaluate(() => performance.memory ? Math.round(performance.memory.usedJSHeapSize / 1e6) : null);
  return JSON.stringify({ out, errs: errs.slice(0, 8) });
}

async (page) => {
  const errs = [], out = {};
  page.on('pageerror', (e) => errs.push('PAGEERR ' + e.message));
  await page.unroute('https://admont.test/**').catch(() => {});
  await page.route('https://admont.test/**', async (route) => {
    const path = decodeURIComponent(route.request().url().replace('https://admont.test', '').split('?')[0]);
    try { await route.fulfill({ path: '/projects/sandbox' + path }); } catch (e) { await route.fulfill({ status: 404, body: 'nf' }); }
  });
  await page.setViewportSize({ width: 1280, height: 760 });
  const T = (ms) => page.waitForTimeout(ms);
  await page.goto('https://admont.test/neusch/neuschwanstein.html?mode=walk&t=10.5&v=' + Date.now());
  await page.waitForFunction(() => document.getElementById('loading').classList.contains('done'), null, { timeout: 240000 });
  await T(1500);
  const st = () => page.evaluate(() => { const s = window.__ns; return { x: +s.player.pos.x.toFixed(2), y: +s.player.pos.y.toFixed(2), z: +s.player.pos.z.toFixed(2), sit: !!s.S.sit, mode: s.S.mode }; });
  out.spawn = await st();
  // 1 walk west through the gate passage (hold W)
  await page.keyboard.down('KeyW'); await T(6000); await page.keyboard.up('KeyW'); out.walkGate = await st();
  // 2 a door: the Palas main door from the upper courtyard
  await page.evaluate(() => window.__ns.teleport({ mode: 'walk', p: [102.5, 43, 96.5], t: [99, 44.5, 96.5] })); await T(600);
  const d0 = await page.evaluate(() => { const w = window.__ns.world, d = w.doors.find((q) => q.x === 100 && q.z === 96); return d && d.open; });
  await page.keyboard.press('KeyE'); await T(500);
  out.door = { before: d0, after: await page.evaluate(() => { const w = window.__ns.world, d = w.doors.find((q) => q.x === 100 && q.z === 96); return d && d.open; }), blockAtDoor: await page.evaluate(() => window.__ns.world.get(100, 43, 96)) };
  await page.keyboard.down('KeyW'); await T(2500); await page.keyboard.up('KeyW'); out.inside = await st();
  // 3 the stair tower: courtyard door, then walk the spiral (hold W while turning a little each step)
  await page.evaluate(() => window.__ns.teleport({ mode: 'walk', p: [110.5, 43, 86.5], t: [104, 44.5, 86.5] })); await T(400);
  await page.keyboard.press('KeyE'); await T(400);
  out.towerDoor = await page.evaluate(() => { const d = window.__ns.world.doors.find((q) => q.x === 108 && q.z === 86); return d && d.open; });
  // 4 sit: a bench in the Singers' Hall
  await page.evaluate(() => { const s = window.__ns, b = s.world.seats.find((q) => q.y === 61 && q.x > 76 && q.x < 80); s.teleport({ mode: 'walk', p: [b.x, 60, b.z + 1.2], t: [b.x, 60.5, b.z] }); window.__seat = b; }); await T(500);
  await page.keyboard.press('KeyE'); await T(500); out.sit = await st();
  await page.evaluate(() => { const s = window.__ns; s.player.yaw = 0; s.player.pitch = 0.05; }); await T(1200);
  await page.screenshot({ path: '/projects/sandbox/.kiro/artifacts/screenshots/ns2-sit.png' });
  await page.keyboard.down('KeyW'); await T(400); await page.keyboard.up('KeyW'); out.stand = await st();
  // 5 the spiral stair from inside
  await page.evaluate(() => window.__ns.teleport({ mode: 'walk', p: [106.2, 43, 86.5], t: [104, 50, 89] })); await T(1200);
  await page.screenshot({ path: '/projects/sandbox/.kiro/artifacts/screenshots/ns2-stair.png' });
  // 6 night: lanterns and windows
  await page.evaluate(() => { window.__ns.S.time = 21.8; window.__ns.teleport({ mode: 'fly', p: [20, 78, 175], t: [86, 62, 94] }); }); await T(1800);
  await page.screenshot({ path: '/projects/sandbox/.kiro/artifacts/screenshots/ns2-night.png' });
  out.lightsNight = await page.evaluate(() => window.__ns.lights());
  await page.evaluate(() => { window.__ns.S.time = 21.8; window.__ns.teleport({ mode: 'walk', p: [68.5, 53, 94.5], t: [47, 58, 94.5] }); }); await T(1800);
  await page.screenshot({ path: '/projects/sandbox/.kiro/artifacts/screenshots/ns2-throne-night.png' });
  out.lightsThrone = await page.evaluate(() => window.__ns.lights()); out.indoor = await page.evaluate(() => window.__ns.indoor());
  out.stats = await page.evaluate(() => window.__ns.stats());
  out.heap = await page.evaluate(() => performance.memory ? Math.round(performance.memory.usedJSHeapSize / 1e6) : null);
  return JSON.stringify({ out, errs: errs.slice(0, 6) });
}

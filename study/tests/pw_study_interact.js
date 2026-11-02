async (page) => {
  const errs = [], out = {};
  page.on('pageerror', (e) => errs.push('PAGEERR ' + e.message));
  await page.unroute('https://admont.test/**').catch(() => {});
  await page.route('https://admont.test/**', async (route) => {
    const path = decodeURIComponent(route.request().url().replace('https://admont.test', '').split('?')[0]);
    try { await route.fulfill({ path: '/projects/sandbox' + path }); } catch (e) { await route.fulfill({ status: 404, body: 'nf' }); }
  });
  await page.setViewportSize({ width: 1180, height: 760 });
  const T = (ms) => page.waitForTimeout(ms);
  await page.goto('https://admont.test/study/study.html?mode=walk&q=low&v=' + Date.now());
  await page.waitForFunction(() => window.__study && document.getElementById('loading').classList.contains('done'), null, { timeout: 90000 });
  await T(1000);
  const st = () => page.evaluate(() => { const s = window.__study; return { x: +s.player.pos.x.toFixed(2), y: +s.player.pos.y.toFixed(2), z: +s.player.pos.z.toFixed(2), lz: +s.world.ladder.z.toFixed(2), climb: !!s.S.climb, grab: s.S.grab, sit: s.S.sit && s.S.sit.id, held: s.S.held, reading: s.S.reading }; });
  const hold = async (code, ms) => { await page.keyboard.down(code); await T(ms); await page.keyboard.up(code); };
  // 1 push: stand beside the ladder (in front of the shelves), walk along the wall into it
  await page.evaluate(() => window.__study.teleport({ p: [3.2, 0, 0.1], t: [3.2, 1.0, 3], mode: 'walk' }));
  out.push0 = await st(); await hold('KeyW', 4500); out.push1 = await st();
  // 2 grab: stand at the foot, G, walk back along the wall (-z)
  await page.evaluate(() => window.__study.teleport({ p: [2.3, 0, 1.4], t: [2.3, 1.0, -3], mode: 'walk' }));
  await page.keyboard.press('KeyG'); out.grab0 = await st(); await hold('KeyW', 4500); out.grab1 = await st();
  await page.keyboard.press('KeyG'); out.grab2 = await st();
  // 3 climb: face the ladder at its foot, E, then W
  await page.evaluate(() => { const L = window.__study.world.ladder; window.__study.teleport({ p: [L.baseX - 0.7, 0, L.z], t: [L.baseX + 1, 1.2, L.z], mode: 'walk' }); });
  await T(300); await page.keyboard.press('KeyE'); await T(300); out.climb0 = await st();
  await hold('KeyW', 6000); out.climb1 = await st();
  await page.evaluate(() => { window.__study.player.pitch = 0.35; }); await T(800);
  await page.screenshot({ path: '/projects/sandbox/.kiro/artifacts/screenshots/st3-climb.png' });
  // slide along the rail while up there
  await hold('KeyD', 2500); out.climb2 = await st();
  // 4 take a user book while up here (aim by geometry)
  out.userIds = await page.evaluate(() => window.__study.built.books.ids().length);
  const tgt = await page.evaluate(() => { const b = window.__study.built.books, ids = b.ids(); let best = null; ids.forEach(id => { const m = b.meta(id); if (m.unit === 'E' && (!best || m.base[1] > b.meta(best).base[1])) best = id; }); return best ? { id: best, m: b.meta(best) } : null; });
  out.eastHigh = tgt && { id: tgt.id, title: tgt.m.title, y: +tgt.m.base[1].toFixed(2), z: +tgt.m.base[2].toFixed(2) };
  await page.evaluate(() => { const s = window.__study; s.S.climb = null; s.player.pos.set(0, 0, 0); });
  // aim from the floor at a west-wall eye-level user book
  const w = await page.evaluate(() => { const b = window.__study.built.books, ids = b.ids(); const id = ids.find(i => b.meta(i).unit === 'W' && b.meta(i).base[1] > 1.0 && b.meta(i).base[1] < 1.9); return { id, m: b.meta(id) }; });
  await page.evaluate(({ m }) => { const x = m.base[0], y = m.base[1], z = m.base[2]; window.__study.teleport({ p: [x + 1.6, 0, z], t: [x, y, z], mode: 'walk' }); }, w);
  await T(700); out.aim = await page.evaluate((id) => ({ want: id, got: window.__study.aim() }), w.id);
  await page.keyboard.press('KeyE'); await T(600);
  out.take = { held: (await st()).held, card: await page.evaluate(() => document.getElementById('card').classList.contains('show') ? document.querySelector('#card .t').textContent : null), out: await page.evaluate((id) => window.__study.built.books.isTaken(id), w.id) };
  await page.screenshot({ path: '/projects/sandbox/.kiro/artifacts/screenshots/st3-take.png' });
  // 5 sit at the desk and read
  await page.evaluate(() => window.__study.teleport({ p: [0, 0, -2.0 + 1.9], t: [0, 1, -3], mode: 'walk' }));
  await page.evaluate(() => window.__study.teleport({ p: [0.2, 0, -2.75], t: [0, 0.9, -1.5], mode: 'walk' }));
  await T(300); await page.keyboard.press('KeyE'); await T(400); out.sit = await st();
  await page.keyboard.press('KeyR'); await T(800); out.read = await st();
  await page.screenshot({ path: '/projects/sandbox/.kiro/artifacts/screenshots/st3-read.png' });
  await page.keyboard.press('KeyR'); await hold('KeyW', 600); out.stand = await st();
  out.stats = await page.evaluate(() => window.__study.stats());
  return JSON.stringify({ out, errs: errs.slice(0, 6) });
}

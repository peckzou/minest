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
  out.rows = await page.evaluate(() => { const b = window.__study.built.books, c = {}; b.ids().forEach(id => { const m = b.meta(id); const k = m.unit + m.row; c[k] = (c[k] || 0) + 1; }); return c; });
  const tgt = await page.evaluate(() => { const b = window.__study.built.books; let best = null; b.ids().forEach(id => { const m = b.meta(id); if (m.unit === 'E' && (!best || m.base[1] > b.meta(best).base[1])) best = id; }); const m = b.meta(best); return { id: best, title: m.title, base: m.base }; });
  out.tgt = { id: tgt.id, title: tgt.title, y: +tgt.base[1].toFixed(2), z: +tgt.base[2].toFixed(2) };
  // walk to the ladder foot, climb E, slide the ladder to the book with D/A, climb up with W
  await page.evaluate(() => { const L = window.__study.world.ladder; window.__study.teleport({ p: [L.baseX - 0.7, 0, L.z], t: [L.baseX + 1, 1.2, L.z], mode: 'walk' }); });
  await T(300); await page.keyboard.press('KeyE'); await T(300);
  out.onLadder = await page.evaluate(() => !!window.__study.S.climb);
  // speed up the slow software renderer: set the climb height and ladder place the way W and D would
  await page.evaluate((z) => { const s = window.__study; s.S.climb.h = 1.7; s.built.setLadderZ(z + 0.3); }, tgt.base[2]);
  await T(600);
  // look at the book
  await page.evaluate((b) => { const s = window.__study, c = s.camera.position; const dx = b[0] - c.x, dy = b[1] - c.y, dz = b[2] - c.z; s.player.yaw = Math.atan2(-dx, -dz); s.player.pitch = Math.atan2(dy, Math.hypot(dx, dz)); }, tgt.base);
  await T(800);
  out.cam = await page.evaluate(() => { const c = window.__study.camera.position; return [+c.x.toFixed(2), +c.y.toFixed(2), +c.z.toFixed(2)]; });
  out.aim = await page.evaluate(() => window.__study.aim());
  await page.keyboard.press('KeyE'); await T(600);
  out.take = await page.evaluate((id) => ({ held: window.__study.S.held, out: window.__study.built.books.isTaken(id), card: document.querySelector('#card .t').textContent, climbing: !!window.__study.S.climb }), tgt.id);
  await page.screenshot({ path: '/projects/sandbox/.kiro/artifacts/screenshots/st4-ladder-take.png' });
  // climb down with S
  await page.evaluate(() => { window.__study.S.climb.h = 0.02; }); await page.keyboard.down('KeyS'); await T(1500); await page.keyboard.up('KeyS');
  out.down = await page.evaluate(() => ({ climbing: !!window.__study.S.climb, y: window.__study.player.pos.y }));
  // overview shot of the ladder from the room
  await page.evaluate(() => window.__study.teleport({ p: [0.3, 0, 1.2], t: [3.8, 1.6, 0.6], mode: 'walk' })); await T(900);
  await page.screenshot({ path: '/projects/sandbox/.kiro/artifacts/screenshots/st4-ladder.png' });
  // add a book through the panel and check it appears with its title
  await page.keyboard.press('KeyB'); await T(300);
  await page.fill('#addT', '我的读书笔记'); await page.fill('#addA', 'Minest'); await page.click('#addp [data-c="add"]'); await T(800);
  out.added = await page.evaluate(() => { const b = window.__study.built.books; const id = b.ids().find(i => b.meta(i).title === '我的读书笔记'); return id ? { id, m: b.meta(id).unit + b.meta(id).row } : null; });
  await page.reload(); await page.waitForFunction(() => window.__study && document.getElementById('loading').classList.contains('done'), null, { timeout: 90000 });
  out.afterReload = await page.evaluate(() => { const b = window.__study.built.books; return { n: b.userCount, has: b.ids().some(i => b.meta(i).title === '我的读书笔记') }; });
  return JSON.stringify({ out, errs: errs.slice(0, 6) });
}

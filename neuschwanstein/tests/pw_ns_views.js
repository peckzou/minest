async (page) => {
  const errs = [], out = {};
  page.on('console', (m) => { if (m.type() === 'error' && !/404|Failed to load resource/.test(m.text())) errs.push(m.text().slice(0, 200)); });
  page.on('pageerror', (e) => errs.push('PAGEERR ' + e.message));
  await page.unroute('https://admont.test/**').catch(() => {});
  await page.route('https://admont.test/**', async (route) => {
    const path = decodeURIComponent(route.request().url().replace('https://admont.test', '').split('?')[0]);
    try { await route.fulfill({ path: '/projects/sandbox' + path }); } catch (e) { await route.fulfill({ status: 404, body: 'nf' }); }
  });
  await page.setViewportSize({ width: 1280, height: 760 });
  const t0 = Date.now();
  await page.goto('https://admont.test/neusch/neuschwanstein.html?mode=fly&t=10.5&v=' + Date.now());
  await page.waitForFunction(() => document.getElementById('loading').classList.contains('done') || /失败/.test(document.getElementById('loadMsg').textContent), null, { timeout: 240000 });
  out.loadMs = Date.now() - t0; out.msg = await page.evaluate(() => document.getElementById('loadMsg').textContent);
  await page.waitForTimeout(1500);
  out.stats = await page.evaluate(() => window.__ns && window.__ns.stats());
  const V = [
    ['ns1-bridge', 'fly', [64.5, 50.6, 147], [80, 60, 94]],
    ['ns1-pano', 'fly', [20, 80, 175], [86, 62, 94]],
    ['ns1-north', 'fly', [110, 60, 10], [90, 60, 94]],
    ['ns1-gate', 'fly', [210, 46, 104], [184, 50, 96]],
    ['ns1-court', 'fly', [130, 45.6, 96], [100, 60, 92]],
    ['ns1-throne', 'fly', [68, 55.6, 94.5], [47, 58, 94.5]],
    ['ns1-throne-up', 'fly', [66, 58, 103], [52, 62, 86]],
    ['ns1-singers', 'fly', [97, 62, 91], [71, 63, 90]],
    ['ns1-bed', 'fly', [88.5, 54.6, 93.5], [82, 55, 102]],
    ['ns1-grotto', 'fly', [76.5, 54.6, 88.5], [75, 54.5, 83]],
    ['ns1-stair', 'fly', [106.5, 47.6, 88.5], [104, 60, 86]],
    ['ns1-kitchen', 'fly', [70.5, 44.6, 100.5], [46, 44, 89]]
  ];
  for (const [n, m, p, t] of V) {
    await page.evaluate(([m, p, t]) => { const s = window.__ns; s.teleport({ mode: m, p: [p[0], p[1] - 1.62, p[2]], t }); }, [m, p, t]);
    await page.waitForTimeout(1600);
    await page.screenshot({ path: '/projects/sandbox/.kiro/artifacts/screenshots/' + n + '.png' });
  }
  out.stats2 = await page.evaluate(() => window.__ns.stats());
  return JSON.stringify({ out, errs: errs.slice(0, 8) });
}

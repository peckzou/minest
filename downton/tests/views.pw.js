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
  await page.goto('https://admont.test/downton/downton.html?mode=fly&t=10.5&v=' + Date.now());
  await page.waitForFunction(() => document.getElementById('loading').classList.contains('done') || /失败/.test(document.getElementById('loadMsg').textContent), null, { timeout: 240000 });
  out.loadMs = Date.now() - t0; out.msg = await page.evaluate(() => document.getElementById('loadMsg').textContent);
  await page.waitForTimeout(1500);
  out.stats = await page.evaluate(() => window.__da && window.__da.stats());
  const V = [
    ['da-front', 'fly', [128.5, 46, 52], [128, 52, 110]],
    ['da-pano', 'fly', [190, 64, 196], [128, 52, 115]],
    ['da-south', 'fly', [128, 44, 175], [128, 52, 118]],
    ['da-aerial', 'fly', [60, 110, 40], [128, 45, 115]],
    ['da-saloon', 'fly', [128.5, 42.8, 108.5], [128, 50, 122]],
    ['da-saloon-up', 'fly', [133.5, 49.6, 108.5], [122, 44, 121]],
    ['da-stairs', 'fly', [137.6, 42.8, 114.5], [149, 46, 114]],
    ['da-library', 'fly', [116.5, 42.8, 136.5], [104, 43, 110]],
    ['da-dining', 'fly', [117.5, 42.8, 103.5], [102, 44, 97]],
    ['da-drawing', 'fly', [138.5, 42.8, 126.5], [154, 44, 133]],
    ['da-study', 'fly', [139.5, 42.8, 103.5], [152, 43, 95]],
    ['da-garden', 'fly', [170, 42, 104], [195, 37, 126]],
    ['da-bed', 'fly', [152, 49.6, 103], [140, 49, 97]]
  ];
  for (const [n, m, p, t] of V) {
    await page.evaluate(([m, p, t]) => { const s = window.__da; s.teleport({ mode: m, p: [p[0], p[1] - 1.62, p[2]], t }); }, [m, p, t]);
    await page.waitForTimeout(1600);
    await page.screenshot({ path: '/projects/sandbox/.kiro/artifacts/screenshots/' + n + '.png' });
  }
  out.stats2 = await page.evaluate(() => window.__da.stats());
  return JSON.stringify({ out, errs: errs.slice(0, 8) });
}

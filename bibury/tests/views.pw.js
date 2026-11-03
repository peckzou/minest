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
  await page.goto('https://admont.test/bibury/bibury.html?mode=fly&t=10.5&v=' + Date.now());
  await page.waitForFunction(() => document.getElementById('loading').classList.contains('done') || /失败/.test(document.getElementById('loadMsg').textContent), null, { timeout: 240000 });
  out.loadMs = Date.now() - t0; out.msg = await page.evaluate(() => document.getElementById('loadMsg').textContent);
  await page.waitForTimeout(1500);
  out.stats = await page.evaluate(() => window.__bb && window.__bb.stats());
  const V = [
    ['bb-lane', 'fly', [161.5, 42.7, 119.5], [100, 46, 124]],
    ['bb-pano', 'fly', [196, 66, 76], [118, 44, 118]],
    ['bb-aerial', 'fly', [60, 100, 200], [120, 42, 100]],
    ['bb-row-front', 'fly', [112, 46, 108], [112, 47, 126]],
    ['bb-weaver', 'fly', [81.5, 45.6, 127.5], [85.5, 45, 124.5]],
    ['bb-kitchen', 'fly', [91.5, 45.6, 127.5], [88.5, 45, 124.5]],
    ['bb-parlour', 'fly', [93.5, 45.6, 127.5], [96, 45, 124]],
    ['bb-upstairs', 'fly', [81.5, 49.6, 127.5], [85, 48.5, 125]],
    ['bb-rack', 'fly', [150.5, 41.8, 95.5], [130, 40, 72]],
    ['bb-mill', 'fly', [44.5, 44, 38], [44, 48, 51]],
    ['bb-mill-in', 'fly', [45.5, 43.6, 48.5], [40, 42.5, 52]],
    ['bb-trout', 'fly', [110.5, 46, 46], [100, 38, 24]],
    ['bb-swan', 'fly', [224.5, 44, 112.5], [236, 46, 113]],
    ['bb-swan-bar', 'fly', [233.5, 42.7, 113.5], [239, 42, 106]],
    ['bb-church', 'fly', [204, 50, 72], [226, 48, 38]],
    ['bb-nave', 'fly', [216.5, 43.7, 38.5], [246, 44, 38.5]],
    ['bb-bridge', 'fly', [198, 44, 132], [214, 40, 119]]
  ];
  for (const [n, m, p, t] of V) {
    await page.evaluate(([m, p, t]) => { const s = window.__bb; s.teleport({ mode: m, p: [p[0], p[1] - 1.62, p[2]], t }); }, [m, p, t]);
    await page.waitForTimeout(1600);
    await page.screenshot({ path: '/projects/sandbox/.kiro/artifacts/screenshots/' + n + '.png' });
  }
  out.stats2 = await page.evaluate(() => window.__bb.stats());
  return JSON.stringify({ out, errs: errs.slice(0, 8) });
}

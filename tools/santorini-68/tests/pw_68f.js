async (page) => {
  const errs = [], out = {};
  page.on('pageerror', (e) => errs.push('PAGEERR ' + e.message));
  await page.unroute('https://admont.test/**').catch(() => {});
  await page.route('https://admont.test/**', async (route) => {
    const path = decodeURIComponent(route.request().url().replace('https://admont.test', '').split('?')[0]);
    try { await route.fulfill({ path: '/projects/sandbox' + path }); } catch (e) { await route.fulfill({ status: 404, body: 'nf' }); }
  });
  await page.setViewportSize({ width: 1180, height: 820 });
  const T = (ms) => page.waitForTimeout(ms);
  const dbl = async (x, y) => { await page.mouse.move(x, y); await page.mouse.down(); await page.mouse.up(); await page.mouse.down(); await page.mouse.up(); };
  const lvl = () => page.evaluate(() => MinestWorldFold.level());
  await page.goto('https://admont.test/admtest/t68a.html?f=' + Date.now());
  await page.waitForFunction(() => window.MinestDisplay && window.MinestWorldFold && window.MinestOia && window.MinestOiaLink, null, { timeout: 120000 });
  await T(2500);
  await page.evaluate(() => { const bid = 'board-ec6-art'; try { MinestUniverse.open({ path: [{ t: 'home' }, { t: 'world', bid }] }); } catch (e) {} MinestDisplay.open({ bid }); });
  await T(2500);
  await page.evaluate(() => { try { MinestWorldFold.open(true); } catch (e) {} });
  await T(1500);
  // the building that already has rooms (from the earlier session)
  const bid = await page.evaluate(() => { const d = MinestDisplay.state(); const p = (d.pc || []).find(q => q.vox && (q.rooms || []).length > 1); return p ? p.vox : null; });
  out.bid = bid;
  await page.evaluate((v) => MinestOiaLink.dollhouse(v, { x: 10, y: 5, z: 10, yaw: 0 }), bid);
  await T(3500);
  out.l3 = await lvl();
  const c = await page.evaluate(() => { const x = document.querySelector('.mn-dsp .mn-bv [data-fproom]'); const q = x.getBoundingClientRect(); return { x: q.left + q.width / 2, y: q.top + q.height / 2, id: x.getAttribute('data-fproom') }; });
  await dbl(c.x, c.y); await T(3000);
  out.l4 = await lvl(); out.crumbs = await page.evaluate(() => MinestWorldFold.crumbs());
  const A = JSON.parse(await page.evaluate(() => JSON.stringify(window.__mnAnchors())));
  out.problems = A.problems; out.disp = A.displays.map(d => d.kind + ':' + d.items.length + '/' + d.capacity);
  // 3D walk of this room
  await page.evaluate(() => { const b = [...document.querySelectorAll('.wf [data-wfhud]')].find(x => /Walk in/.test(x.textContent)); b.click(); });
  await page.waitForFunction(() => window.__mnWalk && document.querySelector('.mn-walk'), null, { timeout: 60000 });
  await T(3000);
  const face = () => page.evaluate(() => { const w = __mnWalk; w.me.x = 6; w.me.z = 4.2; w.me.yaw = Math.PI + 0.35; w.me.pitch = -0.05; });
  await face(); await T(1500);
  out.calls = await page.evaluate(() => ({ calls: __mnWalk.renderer.info.render.calls, tris: __mnWalk.renderer.info.render.triangles, geoms: __mnWalk.renderer.info.memory.geometries, tex: __mnWalk.renderer.info.memory.textures }));
  await page.screenshot({ path: '/projects/sandbox/.kiro/artifacts/screenshots/e68-walk-items.png' });
  // live sync 1: the board changes (a card title) while the walk is open
  const el0 = await page.evaluate(() => { const w = document.querySelector('.mn-walk'); w.__tag = 'old'; return w.__tag; });
  await page.evaluate(() => { MinestAI.updateBoard('board-ec6-art', function (b) { const c = JSON.parse(JSON.stringify(b)); let n = 0; (function walk(o) { if (!o || typeof o !== 'object') return; if (o.id === 'ART-MED-01-T01-C01' && typeof o.title === 'string') { o.title = 'SYNC-TEST-TITLE'; n++; } Object.keys(o).forEach(k => walk(o[k])); })(c); window.__synced = n; return c; }); });
  await T(3500);
  out.sync1 = { changed: await page.evaluate(() => window.__synced), rebuilt: await page.evaluate(() => document.querySelector('.mn-walk') && document.querySelector('.mn-walk').__tag !== 'old'), title: await page.evaluate(() => { index = null; return null; }).catch(() => null) };
  // live sync 2: a display moves
  await page.evaluate(() => { document.querySelector('.mn-walk').__tag = 'old'; const d = MinestDisplay.state(); const p = d.pc.find(q => q.k === 'easel'); p.x = p.x + 0.5; });
  await T(3500);
  out.sync2 = await page.evaluate(() => document.querySelector('.mn-walk').__tag !== 'old');
  // tap an item in 3D: opens the original card
  await face(); await T(800);
  const hit = await page.evaluate(() => { const w = __mnWalk, p = w.picks.children[0]; return { n: w.picks.children.length }; });
  out.picks = hit;
  return JSON.stringify({ out, errs: errs.filter(e => !/404/.test(e)).slice(0, 5) });
}

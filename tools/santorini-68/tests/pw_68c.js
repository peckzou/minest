async (page) => {
  const errs = [], out = {};
  page.on('pageerror', (e) => errs.push('PAGEERR ' + e.message));
  await page.unroute('https://admont.test/**').catch(() => {});
  await page.route('https://admont.test/**', async (route) => {
    const path = decodeURIComponent(route.request().url().replace('https://admont.test', '').split('?')[0]);
    try { await route.fulfill({ path: '/projects/sandbox' + path }); } catch (e) { await route.fulfill({ status: 404, body: 'nf' }); }
  });
  await page.setViewportSize({ width: 1180, height: 820 });
  const press = (sel, val) => page.evaluate(([sel, val]) => { const host = document.querySelector('.wf'); if (!host) return 'no .wf'; const b = document.createElement('button'); b.type = 'button'; b.hidden = true; b.setAttribute(sel, val || ''); host.appendChild(b); b.click(); b.remove(); return 'ok'; }, [sel, val]);
  const ver = 't68a';
  const T = (ms) => page.waitForTimeout(ms);
  const boot = async () => {
    await page.waitForFunction(() => window.MinestDisplay && window.MinestWorldFold && window.MinestOia && window.MinestOiaBld, null, { timeout: 120000 });
    await T(2500);
    await page.evaluate(() => { const bid = 'board-ec6-art'; try { MinestUniverse.open({ path: [{ t: 'home' }, { t: 'world', bid }] }); } catch (e) {} MinestDisplay.open({ bid }); });
    await T(2500);
    await page.evaluate(() => { try { MinestWorldFold.open(true); } catch (e) {} });
    await T(1500);
  };
  await page.goto('https://admont.test/admtest/' + ver + '.html?c=' + Date.now());
  await page.evaluate(async () => { localStorage.clear(); (await indexedDB.databases()).forEach(d => indexedDB.deleteDatabase(d.name)); });
  await page.goto('https://admont.test/admtest/' + ver + '.html?d=' + Date.now());
  await boot();
  await press('data-wfmega', 'santorini'); await T(1200);
  await page.evaluate(() => { const c = document.querySelector('[data-wfconfirm]'); if (c) c.click(); });
  await page.waitForFunction(() => window.MinestOia.isOpen() && window.__santorini && window.__santorini.player, null, { timeout: 120000 });
  await T(6000);
  const cnt = (id) => page.evaluate((id) => { const w = __santorini.world, b = w.buildings.find(q => q.id === id); if (!b) return null; let n = 0; for (let y = b.y; y < b.y + 14; y++) for (let z = b.z0; z <= b.z1; z++) for (let x = b.x0; x <= b.x1; x++) if (w.blocks[w.idx(x, y, z)]) n++; return { n, x0: b.x0, z0: b.z0, x1: b.x1, z1: b.z1, y: b.y }; }, id);
  const info = await page.evaluate(() => { const bs = MinestOiaBld.buildings(); return { total: bs.length, movable: bs.filter(b => /^b\d+$/.test(b.id)).length, tpl: MinestOiaBld.templates() }; });
  out.info = info;
  // pick a house with some room around it
  const id = await page.evaluate(() => { const bs = MinestOiaBld.buildings().filter(b => /^b\d+$/.test(b.id) && b.kind === 'house'); return bs[Math.floor(bs.length / 2)].id; });
  out.id = id; out.s0 = await cnt(id);
  const stand = (dx, dz) => page.evaluate(([id, dx, dz]) => { const s = __santorini, b = s.world.buildings.find(q => q.id === id); s.setMode('walk'); s.player.pos.set((b.x0 + b.x1) / 2 + dx, b.y + 12, (b.z0 + b.z1) / 2 + dz); s.player.yaw = 0; s.player.pitch = -0.1; }, [id, dx, dz]);
  await stand(0, 12); await T(1500);
  await page.screenshot({ path: '/projects/sandbox/.kiro/artifacts/screenshots/b68-0-before.png' });
  await page.evaluate((id) => { MinestOiaBld.toggle(true); MinestOiaBld.select(id); }, id);
  await T(300);
  // move: try every direction until one works (neighbours may block)
  const log = [];
  for (const d of ['f', 'l', 'r', 'b']) {
    await page.evaluate((d) => MinestOiaBld.act('mv', d), d); await T(200);
    const c = await cnt(id); log.push(d + ':' + (c && (c.x0 + ',' + c.z0 + ' n=' + c.n)));
  }
  out.move = log;
  out.rec1 = await page.evaluate(() => MinestOiaBld.record());
  await page.evaluate((id) => MinestOiaBld.act('rot'), id); await T(300);
  out.rot = await cnt(id);
  out.msg = await page.evaluate(() => document.querySelector('#oia-root .obld .msg').textContent);
  await T(1500);
  await page.screenshot({ path: '/projects/sandbox/.kiro/artifacts/screenshots/b68-1-moved.png' });
  // replace
  await page.evaluate(() => MinestOiaBld.act('rep')); await T(300);
  out.rep = await cnt(id); out.msgRep = await page.evaluate(() => document.querySelector('#oia-root .obld .msg').textContent);
  // add
  const before = (await page.evaluate(() => MinestOiaBld.buildings().length));
  await page.evaluate(() => MinestOiaBld.act('add')); await T(500);
  const after = (await page.evaluate(() => MinestOiaBld.buildings().length));
  out.add = { before, after, sel: await page.evaluate(() => MinestOiaBld.selected()), msg: await page.evaluate(() => document.querySelector('#oia-root .obld .msg').textContent) };
  await T(1500);
  await page.screenshot({ path: '/projects/sandbox/.kiro/artifacts/screenshots/b68-2-added.png' });
  // delete another house (2 taps)
  const id2 = await page.evaluate((id) => { const bs = MinestOiaBld.buildings().filter(b => /^b\d+$/.test(b.id) && b.id !== id); return bs[3].id; }, id);
  out.id2 = id2; out.d0 = await cnt(id2);
  await page.evaluate((i) => MinestOiaBld.select(i), id2);
  await page.evaluate(() => MinestOiaBld.act('del')); await page.evaluate(() => MinestOiaBld.act('del')); await T(500);
  out.del = { after: await cnt(id2), rec: await page.evaluate(() => MinestOiaBld.record()) };
  // persistence: reload
  await T(1500);
  await page.reload(); await boot();
  out.persistRec = await page.evaluate(() => { const d = MinestDisplay.state(); return d && d.vox && d.vox.bld ? { m: Object.keys(d.vox.bld.m), a: d.vox.bld.a.length } : 'none'; });
  await page.evaluate(() => { try { MinestOia.open(); } catch (e) {} });
  await page.waitForFunction(() => window.MinestOia.isOpen() && window.__santorini && window.__santorini.player, null, { timeout: 120000 }).catch(() => {});
  await T(6000);
  out.afterReload = { id: await cnt(id), id2: await cnt(id2), total: await page.evaluate(() => MinestOiaBld.buildings().length), hasU1: await page.evaluate(() => MinestOiaBld.buildings().some(b => b.id === 'u1')) };
  // restore the deleted one
  await page.evaluate((i) => { MinestOiaBld.select(i); }, id2); await page.evaluate(() => MinestOiaBld.act('back')); await T(500);
  out.restored = await cnt(id2);
  return JSON.stringify({ out, errs: errs.filter(e => !/404/.test(e)).slice(0, 8) });
}

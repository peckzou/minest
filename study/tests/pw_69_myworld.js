async (page) => {
  const errs = [], out = {};
  page.on('pageerror', (e) => errs.push('PAGEERR ' + e.message));
  let nanErr = 0; page.on('console', (m) => { if (m.type() === 'error' && /NaN/.test(m.text())) nanErr++; });
  await page.unroute('https://admont.test/**').catch(() => {});
  await page.route('https://admont.test/**', async (route) => {
    const path = decodeURIComponent(route.request().url().replace('https://admont.test', '').split('?')[0]);
    try { await route.fulfill({ path: '/projects/sandbox' + path }); } catch (e) { await route.fulfill({ status: 404, body: 'nf' }); }
  });
  await page.setViewportSize({ width: 1180, height: 820 });
  const T = (ms) => page.waitForTimeout(ms);
  const press = (sel, val) => page.evaluate(([sel, val]) => { const host = document.querySelector('.wf'); if (!host) return 'no .wf'; const b = document.createElement('button'); b.type = 'button'; b.hidden = true; b.setAttribute(sel, val || ''); host.appendChild(b); b.click(); b.remove(); return 'ok'; }, [sel, val]);
  const boot = async () => {
    await page.waitForFunction(() => window.MinestDisplay && window.MinestWorldFold && window.MinestStudy && window.MinestOia && window.MinestTrinity && window.MinestAdmont && window.MinestAlps, null, { timeout: 120000 });
    await T(2500);
    await page.evaluate(() => { const bid = 'board-ec6-art'; try { MinestUniverse.open({ path: [{ t: 'home' }, { t: 'world', bid }] }); } catch (e) {} MinestDisplay.open({ bid }); });
    await T(2500);
    await page.evaluate(() => { try { MinestWorldFold.open(true); } catch (e) {} });
    await T(1500);
  };
  const ready = () => page.waitForFunction(() => window.MinestStudy.isOpen() && window.__study && document.getElementById('st-loading').classList.contains('done'), null, { timeout: 90000 });
  await page.goto('https://admont.test/admtest/t69a.html?c=' + Date.now());
  await page.evaluate(async () => { localStorage.clear(); (await indexedDB.databases()).forEach(d => indexedDB.deleteDatabase(d.name)); });
  await page.goto('https://admont.test/admtest/t69a.html?d=' + Date.now());
  await boot();
  // 1 one-tap
  out.mega = await press('data-wfmega', 'study'); await T(1200);
  await page.evaluate(() => { const c = document.querySelector('[data-wfconfirm]'); if (c) c.click(); });
  await ready(); await T(1500);
  out.open = await page.evaluate(() => ({ books: __study.built.books.userCount, generic: __study.built.books.count, stats: __study.stats() }));
  await page.screenshot({ path: '/projects/sandbox/.kiro/artifacts/screenshots/s69-1-open.png' });
  // 2 add real board items from the + panel
  await page.evaluate(() => document.getElementById('st-bAdd').click()); await T(600);
  out.choices = await page.evaluate(() => document.querySelectorAll('#st-addp [data-ref]').length);
  const picked = await page.evaluate(() => [...document.querySelectorAll('#st-addp [data-ref]')].slice(0, 6).map(b => ({ ref: b.getAttribute('data-ref'), t: b.textContent })));
  out.picked = picked.map(p => p.t.slice(0, 40));
  for (let i = 0; i < picked.length; i++) { await page.evaluate((ref) => { const b = document.querySelector('#st-addp [data-ref="' + ref + '"]'); if (b) b.click(); }, picked[i].ref); await T(400); }
  await page.screenshot({ path: '/projects/sandbox/.kiro/artifacts/screenshots/s69-2-picker.png' });
  await page.evaluate(() => { const x = document.querySelector('#st-addp [data-c="x"]'); if (x) x.click(); }); await T(500);
  out.afterAdd = await page.evaluate(() => { const b = __study.built.books; return { n: b.userCount, titles: b.ids().slice(0, 6).map(i => b.meta(i).title) }; });
  // 3 the shelf piece in the study room holds them (My World data)
  out.shelf = await page.evaluate(() => { const d = MinestDisplay.state(); const R = d; const p = (R.pc || []).find(q => q.st === 'house'); const r = p && p.rooms.find(x => x.st === 'study'); const q = r && r.d.pc.find(x => x.st === 'shelf'); return q ? { k: q.k, n: q.it.length, rooms: p.rooms.length } : null; });
  // 4 take a book and look at it
  const b0 = await page.evaluate(() => { const b = __study.built.books, id = b.ids()[0]; return { id, m: b.meta(id) }; });
  await page.evaluate(({ m }) => { const s = __study; const x = m.base[0], y = m.base[1], z = m.base[2], o = m.out; s.teleport({ p: [x + o[0] * 1.3, 0, z + o[2] * 1.3], t: [x, y, z], mode: 'walk' }); }, b0);
  await T(900);
  out.aim = await page.evaluate(() => __study.aim());
  await page.evaluate(() => __study.interact()); await T(700);
  out.card = await page.evaluate(() => ({ show: document.getElementById('st-card').classList.contains('show'), t: document.querySelector('#st-card .t').textContent, a: document.querySelector('#st-card .a').textContent, x: document.querySelector('#st-card .x').textContent.slice(0, 60), openBtn: getComputedStyle(document.querySelector('#st-card [data-c="open"]')).display }));
  await page.screenshot({ path: '/projects/sandbox/.kiro/artifacts/screenshots/s69-3-book.png' });
  // 5 open the original card in My World
  await page.evaluate(() => document.querySelector('#st-card [data-c="open"]').click()); await T(3000);
  out.orig = await page.evaluate(() => ({ studyOpen: MinestStudy.isOpen(), lvl: MinestWorldFold.level(), crumbs: MinestWorldFold.crumbs(), pv: !!document.querySelector('.mn-pv'), pill: !document.querySelector('.mn-st-pill').hidden }));
  await page.screenshot({ path: '/projects/sandbox/.kiro/artifacts/screenshots/s69-4-original.png' });
  // 6 back to the study via the pill
  await page.evaluate(() => document.querySelector('.mn-st-pill [data-p="back"]').click()); await T(2500);
  out.back = await page.evaluate(() => ({ open: MinestStudy.isOpen(), n: __study.built.books.userCount }));
  // 7 Dollhouse
  await page.evaluate(() => document.getElementById('st-doll').click()); await T(3000);
  out.doll = await page.evaluate(() => ({ lvl: MinestWorldFold.level(), rooms: [...document.querySelectorAll('.mn-bv [data-bvroom]')].map(b => b.textContent.trim().slice(0, 24)) }));
  await page.screenshot({ path: '/projects/sandbox/.kiro/artifacts/screenshots/s69-5-doll.png' });
  // 8 into the study room (double tap), then Walk in opens the 3D study
  const c = await page.evaluate(() => { const d = MinestDisplay.state(), p = d.pc.find(q => q.st === 'house'), r = p.rooms.find(x => x.st === 'study'); const x = document.querySelector('.mn-dsp .mn-bv [data-fproom="' + r.id + '"]') || document.querySelector('.mn-dsp .mn-bv [data-fproom]'); const q = x.getBoundingClientRect(); return { x: q.left + q.width / 2, y: q.top + q.height / 2 }; });
  await page.mouse.move(c.x, c.y); await page.mouse.down(); await page.mouse.up(); await page.mouse.down(); await page.mouse.up(); await T(2500);
  out.room = await page.evaluate(() => ({ lvl: MinestWorldFold.level(), crumbs: MinestWorldFold.crumbs(), anchors: (window.__mnAnchors && window.__mnAnchors()) ? window.__mnAnchors().displays.map(d => d.kind + ':' + d.items.length) : null }));
  if (out.room.lvl < 4) { const c2 = await page.evaluate(() => { const x = document.querySelector('.mn-bv [data-bvroom]'); const q = x.getBoundingClientRect(); return { x: q.left + q.width / 2, y: q.top + q.height / 2, n: x.textContent.trim().slice(0, 20) }; }); out.room.retry = c2.n; await page.mouse.dblclick(c2.x, c2.y); await T(2500); out.room.lvl2 = await page.evaluate(() => MinestWorldFold.level()); out.room.anchors = await page.evaluate(() => (window.__mnAnchors && window.__mnAnchors()) ? window.__mnAnchors().displays.map(d => d.kind + ':' + d.items.length) : null); out.room.crumbs = await page.evaluate(() => MinestWorldFold.crumbs()); }
  await page.evaluate(() => { const b = [...document.querySelectorAll('.wf [data-wfhud]')].find(x => /Walk in/.test(x.textContent)); if (b) b.click(); }); await T(3000);
  out.walkIn = await page.evaluate(() => ({ study: MinestStudy.isOpen(), genericWalk: !!document.querySelector('.mn-walk') }));
  // 9 reload: the books are still there; the 3D entry button is there
  await page.evaluate(() => MinestStudy.close()); await T(1500);
  await page.reload(); await boot();
  out.reload = { btn: await page.evaluate(() => !!document.querySelector('[data-wfstudy]')) };
  await page.evaluate(() => document.querySelector('[data-wfstudy]').click()); await ready(); await T(1500);
  out.reload.books = await page.evaluate(() => { const b = __study.built.books; return { n: b.userCount, titles: b.ids().slice(0, 3).map(i => b.meta(i).title) }; });
  out.others = await page.evaluate(() => ['MinestOia', 'MinestAlps', 'MinestAdmont', 'MinestTrinity', 'MinestOiaBld'].map(k => k + ':' + typeof window[k]).join(' '));
  out.nanErrors = nanErr; return JSON.stringify({ out, errs: errs.filter(e => !/404/.test(e)).slice(0, 8) });
}

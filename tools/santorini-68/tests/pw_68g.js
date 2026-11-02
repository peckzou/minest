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
  await page.goto('https://admont.test/admtest/t68a.html?g=' + Date.now());
  await page.waitForFunction(() => window.MinestDisplay && window.MinestWorldFold && window.MinestOia && window.MinestOiaLink, null, { timeout: 120000 });
  await T(2500);
  await page.evaluate(() => { const bid = 'board-ec6-art'; try { MinestUniverse.open({ path: [{ t: 'home' }, { t: 'world', bid }] }); } catch (e) {} MinestDisplay.open({ bid }); });
  await T(2500);
  await page.evaluate(() => { try { MinestWorldFold.open(true); } catch (e) {} });
  await T(1500);
  // 1 World: one-tap button present when the island is Santorini; open the 3D world
  out.go3d = await page.evaluate(() => !!document.querySelector('[data-wfoia]'));
  await page.evaluate(() => document.querySelector('[data-wfoia]').click());
  await page.waitForFunction(() => window.MinestOia.isOpen() && window.__santorini && window.__santorini.player, null, { timeout: 120000 });
  await T(5000);
  out.world = await page.evaluate(() => ({ buildings: __santorini.world.buildings.length, fps: document.querySelector('#oia-coords') && document.querySelector('#oia-coords').textContent }));
  // 2 Building: stand at the door of b7, the door button appears, tap it -> chooser -> Dollhouse
  await page.evaluate(() => { const s = __santorini, b = s.world.buildings.find(q => q.id === 'b7'); s.setMode('walk'); s.player.pos.set(b.x0 - 1.2, b.y + 1.2, (b.z0 + b.z1) / 2); s.player.yaw = 0; });
  await T(2500);
  out.door = await page.evaluate(() => { const b = document.getElementById('oia-enter'); return { hidden: b.hidden, text: b.textContent }; });
  await page.evaluate(() => document.getElementById('oia-enter').click()); await T(800);
  out.chooser = await page.evaluate(() => { const c = document.querySelector('#oia-root .oial'); return c && !c.hidden ? c.innerText.replace(/\s+/g, ' ').slice(0, 120) : null; });
  await page.evaluate(() => document.querySelector('#oia-root .oial [data-oial="doll"]').click()); await T(3500);
  out.l3 = { lvl: await page.evaluate(() => MinestWorldFold.level()), rooms: await page.evaluate(() => document.querySelectorAll('.mn-bv [data-bvroom]').length) };
  // 4 Room
  const c = await page.evaluate(() => { const x = document.querySelector('.mn-dsp .mn-bv [data-fproom]'); const q = x.getBoundingClientRect(); return { x: q.left + q.width / 2, y: q.top + q.height / 2 }; });
  await dbl(c.x, c.y); await T(3000);
  out.l4 = await lvl();
  const A = JSON.parse(await page.evaluate(() => JSON.stringify(window.__mnAnchors())));
  out.kept = { building: A.building.id, room: A.room.name, displays: A.displays.map(d => d.kind + ':' + d.items.length), problems: A.problems };
  // 3D walk x5: memory
  const mem = [];
  for (let i = 0; i < 5; i++) {
    await page.evaluate(() => { const b = [...document.querySelectorAll('.wf [data-wfhud]')].find(x => /Walk in/.test(x.textContent)); b.click(); });
    await page.waitForFunction(() => window.__mnWalk && document.querySelector('.mn-walk'), null, { timeout: 60000 });
    await T(1800);
    mem.push(await page.evaluate(() => { const i = __mnWalk.renderer.info; return { g: i.memory.geometries, t: i.memory.textures, calls: i.render.calls, heapMB: performance.memory ? Math.round(performance.memory.usedJSHeapSize / 1e6) : null }; }));
    await page.evaluate(() => document.querySelector('.mn-walk [data-wkx]').click()); await T(1500);
  }
  out.mem = mem;
  // back to the World: pill
  await page.evaluate(() => document.querySelector('.mn-oial-pill [data-p="back"]').click());
  await page.waitForFunction(() => window.MinestOia.isOpen(), null, { timeout: 60000 });
  await T(3500);
  out.back = await page.evaluate(() => ({ open: MinestOia.isOpen(), pos: [__santorini.player.pos.x | 0, __santorini.player.pos.z | 0], door: !document.getElementById('oia-enter').hidden, mode: __santorini.S.mode }));
  return JSON.stringify({ out, errs: errs.filter(e => !/404/.test(e)).slice(0, 5) });
}

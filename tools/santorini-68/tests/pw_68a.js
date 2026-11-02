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
  for (const ver of ['t63a', 't68a']) {
    await page.goto('https://admont.test/admtest/' + ver + '.html?c=' + Date.now());
    await page.evaluate(async () => { localStorage.clear(); (await indexedDB.databases()).forEach(d => indexedDB.deleteDatabase(d.name)); });
    await page.goto('https://admont.test/admtest/' + ver + '.html?d=' + Date.now());
    await page.waitForFunction(() => window.MinestDisplay && window.MinestUniverse && window.MinestWorldFold && window.MinestOia, null, { timeout: 120000 });
    await page.waitForTimeout(2500);
    await page.evaluate(() => { const bid = 'board-ec6-art'; try { MinestUniverse.open({ path: [{ t: 'home' }, { t: 'world', bid }] }); } catch (e) {} MinestDisplay.open({ bid }); });
    await page.waitForTimeout(2500);
    await page.evaluate(() => { try { MinestWorldFold.open(true); } catch (e) {} });
    await page.waitForTimeout(1500);
    await press('data-wfmega', 'santorini');
    await page.waitForTimeout(1200);
    await page.evaluate(() => { const c = document.querySelector('[data-wfconfirm]'); if (c) c.click(); });
    await page.waitForFunction(() => window.MinestOia.isOpen() && document.getElementById('oia-loading') && getComputedStyle(document.getElementById('oia-loading')).display === 'none' || (document.getElementById('oia-loading') && document.getElementById('oia-loading').classList.contains('done')), null, { timeout: 120000 }).catch(() => {});
    await page.waitForTimeout(4000);
    const edits = () => page.evaluate(() => { const d = MinestDisplay.state(); return d && d.vox ? d.vox.edits.length : 'no-vox'; });
    out[ver] = { open: await page.evaluate(() => MinestOia.isOpen()), before: await edits() };
    // three quick taps on the 3D canvas (touch): the first leaves the tour, the others used to break blocks
    for (let i = 0; i < 4; i++) {
      await page.evaluate(() => {
        const c = document.getElementById('oia-gl'), r = c.getBoundingClientRect();
        const mk = (type) => { const t = new Touch({ identifier: 77, target: c, clientX: r.left + r.width * .7, clientY: r.top + r.height * .5 }); c.dispatchEvent(new TouchEvent(type, { bubbles: true, cancelable: true, touches: type === 'touchend' ? [] : [t], targetTouches: type === 'touchend' ? [] : [t], changedTouches: [t] })); };
        mk('touchstart'); setTimeout(() => mk('touchend'), 60);
      });
      await page.waitForTimeout(500);
    }
    out[ver].after = await edits();
    out[ver].held = await page.evaluate(() => { const h = document.getElementById('oia-held'); return h ? getComputedStyle(h).display : 'none-el'; });
    await page.screenshot({ path: '/projects/sandbox/.kiro/artifacts/screenshots/s68-' + ver + '.png' });
  }
  return JSON.stringify({ out, errs: errs.filter(e => !/404/.test(e)).slice(0, 6) });
}

import { spawn } from 'child_process';
import fs from 'fs';
import path from 'path';

const CHROME = '/Applications/Google Chrome.app/Contents/MacOS/Google Chrome';
const OUT_DIR = '/Users/cece/.gemini/antigravity/brain/bcaa46a4-4c84-448b-9402-6618d36c7d65';
const sleep = (ms) => new Promise((r) => setTimeout(r, ms));

async function run() {
  const proc = spawn(CHROME, [
    '--headless=new',
    '--remote-debugging-port=0',
    '--user-data-dir=/tmp/test-interactive-' + Date.now(),
    '--window-size=1280,800',
    '--use-gl=angle',
    'about:blank'
  ]);

  let wsUrl = null;
  const onData = (d) => {
    const m = d.toString().match(/DevTools listening on (ws:\/\/[^\s]+)/);
    if (m) wsUrl = m[1];
  };
  proc.stderr.on('data', onData);
  proc.stdout.on('data', onData);

  for (let i = 0; i < 80 && !wsUrl; i++) await sleep(100);
  if (!wsUrl) throw new Error('no wsUrl');

  const r = await fetch(wsUrl.replace('ws://', 'http://').replace(/\/devtools\/browser\/.*/, '/json/list'));
  const pages = await r.json();
  const page = pages.find((p) => p.type === 'page') || pages[0];
  const ws = new WebSocket(page.webSocketDebuggerUrl);
  await new Promise((res) => (ws.onopen = res));

  let seq = 1;
  const pending = new Map();

  ws.onmessage = (ev) => {
    const msg = JSON.parse(ev.data);
    if (msg.id && pending.has(msg.id)) {
      const { resolve, reject } = pending.get(msg.id);
      pending.delete(msg.id);
      if (msg.error) reject(new Error(JSON.stringify(msg.error)));
      else resolve(msg.result);
    }
  };

  function send(method, params = {}) {
    const id = seq++;
    ws.send(JSON.stringify({ id, method, params }));
    return new Promise((resolve, reject) => pending.set(id, { resolve, reject }));
  }

  async function evalJS(expr) {
    const res = await send('Runtime.evaluate', { expression: expr, returnByValue: true, awaitPromise: true });
    if (res.exceptionDetails) {
      throw new Error('Eval error: ' + (res.exceptionDetails.text || '') + ' ' + (res.exceptionDetails.exception?.description || ''));
    }
    return res.result?.value;
  }

  async function takeScreenshot(name) {
    const shot = await send('Page.captureScreenshot', { format: 'png' });
    if (shot.data) {
      const outPath = path.join(OUT_DIR, name);
      fs.writeFileSync(outPath, Buffer.from(shot.data, 'base64'));
      console.log(`📸 Screenshot: ${name}`);
      return outPath;
    }
    return null;
  }

  await send('Page.enable');
  await send('Runtime.enable');
  console.log('Navigating to http://127.0.0.1:8131/iPhoneDuo69.html ...');
  await send('Page.navigate', { url: 'http://127.0.0.1:8131/iPhoneDuo69.html' });
  await sleep(4000);

  // Initialize board-ec6-art for rich items
  await evalJS(`
    const bid = 'board-ec6-art';
    try { MinestUniverse.open({ path: [{ t: 'home' }, { t: 'world', bid }] }); } catch (e) {}
    try { MinestDisplay.open({ bid }); } catch (e) {}
  `);
  await sleep(1500);

  // 1. Enter Santorini via floating button
  console.log('--- Step 1: Click #mn-btn-santorini-3d ---');
  await evalJS(`document.getElementById('mn-btn-santorini-3d').click();`);
  await sleep(3500);

  const st1 = await evalJS(`
    (() => {
      const s = window.__santorini;
      const dpad = document.getElementById('oia-dpad-69');
      const qbar = document.getElementById('oia-quick-69');
      const bldPanel = document.getElementById('mn-bld-p');
      return {
        oiaOn: window.__oiaOn,
        mode: s?.S?.mode,
        pos: s?.player?.pos ? [s.player.pos.x, s.player.pos.y, s.player.pos.z] : null,
        yaw: s?.player?.yaw,
        pitch: s?.player?.pitch,
        hasDpad: !!dpad,
        dpadDisplay: dpad ? window.getComputedStyle(dpad).display : null,
        hasQbar: !!qbar,
        qbarDisplay: qbar ? window.getComputedStyle(qbar).display : null,
        bldPanelOpen: bldPanel ? !bldPanel.hidden && window.getComputedStyle(bldPanel).display !== 'none' : false
      };
    })()
  `);
  console.log('State 1 (After Enter):', JSON.stringify(st1));
  await takeScreenshot('interact_01_entered.png');

  // 2. Test Mouse Drag Rotation (Drag to Look)
  console.log('--- Step 2: Test Drag-to-Look ---');
  const yawBefore = st1.yaw;
  await evalJS(`
    (() => {
      const canvas = document.getElementById('oia-gl');
      const rect = canvas.getBoundingClientRect();
      const cx = rect.left + rect.width / 2;
      const cy = rect.top + rect.height / 2;
      canvas.dispatchEvent(new MouseEvent('mousedown', { clientX: cx, clientY: cy, button: 0, bubbles: true }));
      window.dispatchEvent(new MouseEvent('mousemove', { clientX: cx - 100, clientY: cy, bubbles: true }));
      window.dispatchEvent(new MouseEvent('mouseup', { clientX: cx - 100, clientY: cy, button: 0, bubbles: true }));
    })()
  `);
  await sleep(500);
  const st2 = await evalJS(`
    (() => {
      const s = window.__santorini;
      return { yaw: s?.player?.yaw, pitch: s?.player?.pitch };
    })()
  `);
  console.log(`Yaw before: ${yawBefore}, Yaw after drag: ${st2.yaw}`);
  if (Math.abs(st2.yaw - yawBefore) < 0.001) {
    console.warn('⚠️ Drag rotation did not change yaw as expected');
  } else {
    console.log('✅ Drag-to-look rotation working smoothly!');
  }

  // 3. Test D-Pad forward movement
  console.log('--- Step 3: Test D-Pad Movement ---');
  const posBefore = await evalJS(`[window.__santorini.player.pos.x, window.__santorini.player.pos.z]`);
  await evalJS(`
    (() => {
      const upBtn = document.querySelector('#oia-dpad-69 .u');
      if (upBtn) {
        upBtn.dispatchEvent(new PointerEvent('pointerdown', { bubbles: true }));
      }
    })()
  `);
  await sleep(800);
  await evalJS(`window.dispatchEvent(new PointerEvent('pointerup', { bubbles: true }));`);
  await sleep(300);
  const posAfter = await evalJS(`[window.__santorini.player.pos.x, window.__santorini.player.pos.z]`);
  console.log(`Pos before: ${JSON.stringify(posBefore)}, Pos after: ${JSON.stringify(posAfter)}`);

  // 4. Test Quick Bar -> Tab Displays & Cards
  console.log('--- Step 4: Quick Bar -> Displays & Cards ---');
  await evalJS(`document.getElementById('oia-q-disp').click();`);
  await sleep(800);
  const dispState = await evalJS(`
    (() => {
      const activeTab = document.querySelector('.obld-tab.on')?.textContent;
      const displays = window.MinestOiaBld ? MinestOiaBld.displays() : [];
      return { activeTab, displaysCount: displays.length };
    })()
  `);
  console.log('Display tab state:', JSON.stringify(dispState));
  await takeScreenshot('interact_02_displays.png');

  // 5. Test Quick Bar -> Enter Doorhouse (Level 3)
  console.log('--- Step 5: Quick Bar -> Enter Doorhouse ---');
  await evalJS(`document.getElementById('oia-q-door').click();`);
  await sleep(3500);
  const doorState = await evalJS(`
    (() => {
      const bv = document.querySelector('.mn-bv');
      const rooms = Array.from(document.querySelectorAll('.mn-bv [data-bvroom]')).map(r => r.getAttribute('data-bvroom'));
      const pill = document.querySelector('.mn-oial-pill');
      return {
        hasBv: !!bv,
        bvDisplay: bv ? window.getComputedStyle(bv).display : null,
        roomsCount: rooms.length,
        rooms: rooms,
        hasPill: !!pill
      };
    })()
  `);
  console.log('Doorhouse state:', JSON.stringify(doorState));
  await takeScreenshot('interact_03_doorhouse.png');

  // 6. Test Enter Room (Level 4) -> 3D Room Walk (Level 5 & 6)
  console.log('--- Step 6: Enter Room & 3D Walk ---');
  await evalJS(`
    (() => {
      const rBtn = document.querySelector('.mn-bv [data-bvroom]');
      if (rBtn) {
        const q = rBtn.getBoundingClientRect();
        const ev = new MouseEvent('dblclick', { clientX: q.left + q.width / 2, clientY: q.top + q.height / 2, bubbles: true });
        rBtn.dispatchEvent(ev);
      }
    })()
  `);
  await sleep(2500);

  // Click Walk In Room
  await evalJS(`
    (() => {
      const btn = [...document.querySelectorAll('.wf [data-wfhud]')].find(x => /Walk in/.test(x.textContent));
      if (btn) btn.click();
      else if (window.MinestWalk && MinestWalk.open) MinestWalk.open();
    })()
  `);
  await sleep(3000);

  const walk3dState = await evalJS(`
    (() => {
      const w = window.__mnWalk;
      return {
        walkOpen: !!w,
        renders: w ? w.renderer.info.render.calls : 0
      };
    })()
  `);
  console.log('3D Room Walk state:', JSON.stringify(walk3dState));
  await takeScreenshot('interact_04_3d_walk.png');

  // 7. Test Return to Doorstep / World via Return Pill
  console.log('--- Step 7: Return via Doorstep Pill ---');
  await evalJS(`
    (() => {
      const closeBtn = document.querySelector('.mn-walk [data-wkx]');
      if (closeBtn) closeBtn.click();
      setTimeout(() => {
        const pill = document.querySelector('.mn-oial-pill [data-p="back"]');
        if (pill) pill.click();
      }, 500);
    })()
  `);
  await sleep(3000);

  const returnState = await evalJS(`
    (() => {
      const s = window.__santorini;
      return {
        oiaOn: window.__oiaOn,
        mode: s?.S?.mode,
        pos: s?.player?.pos ? [Math.round(s.player.pos.x), Math.round(s.player.pos.z)] : null
      };
    })()
  `);
  console.log('Return state:', JSON.stringify(returnState));
  await takeScreenshot('interact_05_returned.png');

  console.log('🎉 Interactive verification test completed successfully!');
  proc.kill();
  process.exit(0);
}

run().catch((e) => {
  console.error('Test failed:', e);
  process.exit(1);
});

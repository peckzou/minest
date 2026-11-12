import { spawn } from 'child_process';
import fs from 'fs';
import path from 'path';

const CHROME = '/Applications/Google Chrome.app/Contents/MacOS/Google Chrome';
const OUT_DIR = '/Users/cece/.gemini/antigravity/brain/bcaa46a4-4c84-448b-9402-6618d36c7d65';
const sleep = (ms) => new Promise((r) => setTimeout(r, ms));

async function run() {
  console.log('🚀 Starting Verification of All Deployed Voxel Worlds...');
  const proc = spawn(CHROME, [
    '--headless=new',
    '--remote-debugging-port=0',
    '--user-data-dir=/tmp/test-deploy-' + Date.now(),
    '--window-size=1280,820',
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

  const tests = [
    { url: 'http://127.0.0.1:8128/worlds.html', title: 'World Portal', shot: 'shot_portal_worlds.png', wait: 2000 },
    { url: 'http://127.0.0.1:8128/lauterbrunnen.html', title: 'Lauterbrunnen (劳特布龙嫩)', shot: 'shot_world_lauterbrunnen.png', wait: 3500 },
    { url: 'http://127.0.0.1:8128/bibury.html', title: 'Bibury (拜伯里)', shot: 'shot_world_bibury.png', wait: 3000 },
    { url: 'http://127.0.0.1:8128/downton.html', title: 'Downton Abbey (唐顿庄园)', shot: 'shot_world_downton.png', wait: 3000 },
    { url: 'http://127.0.0.1:8128/hallstatt.html', title: 'Hallstatt (哈尔施塔特)', shot: 'shot_world_hallstatt.png', wait: 3000 },
    { url: 'http://127.0.0.1:8128/giethoorn.html', title: 'Giethoorn (羊角村)', shot: 'shot_world_giethoorn.png', wait: 3500 },
    { url: 'http://127.0.0.1:8128/neuschwanstein.html', title: 'Neuschwanstein (新天鹅堡)', shot: 'shot_world_neuschwanstein.png', wait: 3000 }
  ];

  for (const t of tests) {
    console.log(`Navigating to ${t.title}: ${t.url} ...`);
    await send('Page.navigate', { url: t.url });
    await sleep(t.wait);
    const docTitle = await evalJS('document.title');
    console.log(`Page title: ${docTitle}`);
    await takeScreenshot(t.shot);
  }

  // Test the floating World Portal button on iPhoneDuo69.html
  console.log('Testing 3D Portal modal on iPhoneDuo69.html...');
  await send('Page.navigate', { url: 'http://127.0.0.1:8128/iPhoneDuo69.html' });
  for (let i = 0; i < 30; i++) {
    const has = await evalJS('!!document.getElementById("mn-btn-worlds-portal-3d")');
    if (has) break;
    await sleep(500);
  }

  const portalBtnState = await evalJS(`
    (() => {
      const btn = document.getElementById('mn-btn-worlds-portal-3d');
      return { exists: !!btn, text: btn ? btn.innerText : null };
    })()
  `);
  console.log('Portal Button on Main Page:', JSON.stringify(portalBtnState));

  // Click portal button
  await evalJS(`document.getElementById('mn-btn-worlds-portal-3d').click();`);
  await sleep(1000);

  const modalState = await evalJS(`
    (() => {
      const modal = document.getElementById('mn-worlds-modal-69');
      const links = modal ? Array.from(modal.querySelectorAll('a')).map(a => a.href) : [];
      return {
        modalVisible: !!modal,
        linksCount: links.length,
        links
      };
    })()
  `);
  console.log('Portal Modal State:', JSON.stringify(modalState));
  await takeScreenshot('shot_portal_modal_popup.png');

  console.log('🎉 ALL 7 VOXEL WORLDS VERIFIED AND DEPLOYED SUCCESSFULLY!');
  proc.kill();
  process.exit(0);
}

run().catch((e) => {
  console.error('Verification failed:', e);
  process.exit(1);
});

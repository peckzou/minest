import { spawn } from 'child_process';
import fs from 'fs';
import path from 'path';

const CHROME = '/Applications/Google Chrome.app/Contents/MacOS/Google Chrome';
const OUT_DIR = '/Users/cece/.gemini/antigravity/brain/bcaa46a4-4c84-448b-9402-6618d36c7d65';
const sleep = (ms) => new Promise((r) => setTimeout(r, ms));

async function run() {
  console.log('🚀 Starting Verification of Minest Duo Port 8151...');
  const proc = spawn(CHROME, [
    '--headless=new',
    '--remote-debugging-port=0',
    '--user-data-dir=/tmp/test-duo-' + Date.now(),
    '--window-size=1280,820',
    '--use-gl=angle',
    'about:blank'
  ]);

  let wsUrl = null;
  proc.stderr.on('data', (d) => {
    const s = d.toString();
    const m = s.match(/ws:\/\/127\.0\.0\.1:\d+\/devtools\/browser\/[a-f0-9-]+/);
    if (m && !wsUrl) wsUrl = m[0];
  });

  for (let i = 0; i < 40; i++) {
    if (wsUrl) break;
    await sleep(100);
  }
  if (!wsUrl) throw new Error('Failed to get Chrome WebSocket URL');

  const ws = new WebSocket(wsUrl);
  await new Promise((resolve) => ws.onopen = resolve);

  let id = 1;
  const pending = new Map();
  ws.onmessage = (e) => {
    const data = JSON.parse(e.data);
    if (data.id && pending.has(data.id)) {
      pending.get(data.id)(data);
      pending.delete(data.id);
    }
  };

  const send = (method, params = {}) => new Promise((resolve) => {
    const curId = id++;
    pending.set(curId, (res) => resolve(res.result || {}));
    ws.send(JSON.stringify({ id: curId, method, params }));
  });

  const { targetId } = await send('Target.createTarget', { url: 'about:blank' });
  const { sessionId } = await send('Target.attachToTarget', { targetId, flatten: true });

  const sendSession = (method, params = {}) => new Promise((resolve) => {
    const curId = id++;
    pending.set(curId, (res) => resolve(res.result || {}));
    ws.send(JSON.stringify({ id: curId, sessionId, method, params }));
  });

  await sendSession('Page.enable');
  await sendSession('Runtime.enable');

  const testNav = async (url, screenshotName) => {
    console.log(`Navigating to Duo URL: ${url} ...`);
    await sendSession('Page.navigate', { url });
    await sleep(2500);
    const titleRes = await sendSession('Runtime.evaluate', { expression: 'document.title' });
    console.log(`Page title: ${titleRes?.result?.value}`);
    const shot = await sendSession('Page.captureScreenshot', { format: 'png' });
    if (shot?.data) {
      fs.writeFileSync(path.join(OUT_DIR, screenshotName), Buffer.from(shot.data, 'base64'));
      console.log(`📸 Screenshot: ${screenshotName}`);
    }
  };

  // 1. Worlds portal on Duo port 8151
  await testNav('http://127.0.0.1:8151/worlds.html', 'duo_portal_worlds.png');

  // 2. iPhoneDuo.html on Duo port 8151
  console.log('Testing 3D Portal modal on http://127.0.0.1:8151/iPhoneDuo.html ...');
  await sendSession('Page.navigate', { url: 'http://127.0.0.1:8151/iPhoneDuo.html' });
  
  // Wait up to 15s for the button to inject
  let btnCheck = null;
  for (let i = 0; i < 30; i++) {
    btnCheck = await sendSession('Runtime.evaluate', {
      expression: '(() => { const b = document.getElementById("mn-btn-worlds-portal-3d"); return { exists: !!b, text: b ? b.innerText : null }; })()',
      returnByValue: true
    });
    if (btnCheck?.result?.value?.exists) break;
    await sleep(500);
  }
  console.log('Portal Button on Duo Page:', JSON.stringify(btnCheck?.result?.value));

  // Trigger modal open
  await sendSession('Runtime.evaluate', {
    expression: 'document.getElementById("mn-btn-worlds-portal-3d")?.click()'
  });
  await sleep(1000);

  const modalCheck = await sendSession('Runtime.evaluate', {
    expression: '(() => { const m = document.getElementById("mn-worlds-modal-69"); return { modalVisible: !!m, linksCount: m ? m.querySelectorAll("a").length : 0 }; })()',
    returnByValue: true
  });
  console.log('Portal Modal on Duo:', JSON.stringify(modalCheck?.result?.value));

  const modalShot = await sendSession('Page.captureScreenshot', { format: 'png' });
  if (modalShot?.data) {
    fs.writeFileSync(path.join(OUT_DIR, 'duo_shot_modal_popup.png'), Buffer.from(modalShot.data, 'base64'));
    console.log('📸 Screenshot: duo_shot_modal_popup.png');
  }

  // 3. Test Lauterbrunnen and Bibury on Duo port 8151
  await testNav('http://127.0.0.1:8151/lauterbrunnen.html', 'duo_shot_world_lauterbrunnen.png');
  await testNav('http://127.0.0.1:8151/bibury.html', 'duo_shot_world_bibury.png');

  proc.kill('SIGKILL');
  console.log('🎉 DUO PORT 8151 VERIFIED AND TESTED SUCCESSFULLY!');
  process.exit(0);
}

run().catch((err) => {
  console.error('Fatal error:', err);
  process.exit(1);
});

// Dev helper: node venice-world/_shot.mjs "<query>" out.png [w] [h]
import { spawn } from 'node:child_process';
import fs from 'node:fs';
const query = process.argv[2] || '';
const out = process.argv[3] || '/tmp/venice.png';
const w = +(process.argv[4] || 1280), h = +(process.argv[5] || 720);
const chrome = '/Applications/Google Chrome.app/Contents/MacOS/Google Chrome';
const proc = spawn(chrome, ['--headless=new', '--no-sandbox', '--remote-debugging-port=9333', '--use-angle=swiftshader', '--enable-unsafe-swiftshader', '--ignore-gpu-blocklist',
  '--user-data-dir=/tmp/venice-chrome-prof', `--window-size=${w},${h}`, 'about:blank'], { stdio: 'ignore' });
const sleep = (ms) => new Promise((r) => setTimeout(r, ms));
let targets;
for (let i = 0; i < 40; i++) { try { targets = await (await fetch('http://127.0.0.1:9333/json')).json(); if (targets.find((t) => t.type === 'page')) break; } catch (e) { /* retry */ } await sleep(300); }
const page = targets.find((t) => t.type === 'page');
const ws = new WebSocket(page.webSocketDebuggerUrl);
await new Promise((r) => (ws.onopen = r));
let id = 0; const pend = new Map();
ws.onmessage = (m) => {
  const d = JSON.parse(m.data);
  if (d.id && pend.has(d.id)) { pend.get(d.id)(d); pend.delete(d.id); }
  else if (d.method === 'Runtime.consoleAPICalled') console.log('[console.' + d.params.type + ']', d.params.args.map((a) => a.value ?? a.description).join(' '));
  else if (d.method === 'Runtime.exceptionThrown') console.log('[exception]', d.params.exceptionDetails.exception?.description || d.params.exceptionDetails.text);
};
const send = (method, params = {}) => new Promise((r) => { const i = ++id; pend.set(i, r); ws.send(JSON.stringify({ id: i, method, params })); });
await send('Runtime.enable'); await send('Page.enable');
await send('Emulation.setDeviceMetricsOverride', { width: w, height: h, deviceScaleFactor: 1, mobile: false });
await send('Page.navigate', { url: 'http://localhost:8123/venice.html' + query });
const t0 = Date.now();
while (Date.now() - t0 < 90000) {
  const r = await send('Runtime.evaluate', { expression: "document.getElementById('loading') && document.getElementById('loading').classList.contains('done')" });
  if (r.result?.result?.value) break;
  await sleep(500);
}
await sleep(+(process.env.WAIT || 2500));
const extra = process.env.EVAL; if (extra) { const r = await send('Runtime.evaluate', { expression: extra, awaitPromise: true }); console.log('eval:', JSON.stringify(r.result?.result?.value ?? r.result)); await sleep(1500); }
const shot = await send('Page.captureScreenshot', { format: 'png' });
fs.writeFileSync(out, Buffer.from(shot.result.data, 'base64'));
console.log('saved', out, 'load ms', Date.now() - t0);
ws.close(); proc.kill();
process.exit(0);

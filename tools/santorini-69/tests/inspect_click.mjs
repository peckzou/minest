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
    '--user-data-dir=/tmp/inspect-click-' + Date.now(),
    '--window-size=1200,860',
    '--use-gl=angle',
    'about:blank'
  ]);

  let wsUrl = null;
  proc.stderr.on('data', (d) => {
    const m = d.toString().match(/DevTools listening on (ws:\/\/[^\s]+)/);
    if (m) wsUrl = m[1];
  });

  for (let i = 0; i < 60 && !wsUrl; i++) await sleep(100);
  if (!wsUrl) throw new Error('no wsUrl');

  const r = await fetch(wsUrl.replace('ws://', 'http://').replace(/\/devtools\/browser\/.*/, '/json/list'));
  const pages = await r.json();
  const page = pages.find((p) => p.type === 'page') || pages[0];
  const ws = new WebSocket(page.webSocketDebuggerUrl);
  await new Promise((res) => (ws.onopen = res));

  let seq = 1;
  const pending = new Map();
  const consoleLogs = [];
  const pageErrors = [];

  ws.onmessage = (ev) => {
    const msg = JSON.parse(ev.data);
    if (msg.id && pending.has(msg.id)) {
      const { resolve, reject } = pending.get(msg.id);
      pending.delete(msg.id);
      if (msg.error) reject(new Error(JSON.stringify(msg.error)));
      else resolve(msg.result);
    } else if (msg.method === 'Runtime.consoleAPICalled') {
      const txt = (msg.params.args || []).map((a) => a.value || a.description || '').join(' ');
      consoleLogs.push(txt);
      console.log('BROWSER LOG:', txt);
    } else if (msg.method === 'Runtime.exceptionThrown') {
      const err = msg.params.exceptionDetails.text || 'Exception';
      pageErrors.push(err);
      console.log('BROWSER ERROR:', err);
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
      console.log(`📸 Screenshot saved: ${name}`);
      return outPath;
    }
    return null;
  }

  await send('Page.enable');
  await send('Runtime.enable');
  await send('Page.navigate', { url: 'http://127.0.0.1:8131/iPhoneDuo69.html' });
  await sleep(3500);

  // 1. Inspect initial page state
  console.log('=== Checking Initial Page ===');
  const initCheck = await evalJS(`
    (() => {
      const btn = document.getElementById('mn-btn-santorini-3d');
      const r = btn ? btn.getBoundingClientRect() : null;
      const elAtPt = r ? document.elementFromPoint(r.x + r.width/2, r.y + r.height/2) : null;
      return {
        hasBtn: !!btn,
        btnRect: r,
        btnText: btn?.innerText,
        elAtPtTag: elAtPt?.tagName,
        elAtPtId: elAtPt?.id,
        elAtPtClass: elAtPt?.className,
        isOiaOpen: window.MinestOia ? MinestOia.isOpen() : false
      };
    })()
  `);
  console.log('Initial Check:', JSON.stringify(initCheck));
  await takeScreenshot('inspect_01_init.png');

  // 2. Click the button directly via dispatchEvent
  console.log('=== Clicking #mn-btn-santorini-3d ===');
  const clickRes = await evalJS(`
    (() => {
      const btn = document.getElementById('mn-btn-santorini-3d');
      if (!btn) return { error: 'no btn' };
      btn.click();
      return { clicked: true };
    })()
  `);
  console.log('Click result:', JSON.stringify(clickRes));
  await sleep(3000);

  // 3. Inspect after click
  const afterClick = await evalJS(`
    (() => {
      const oiaRoot = document.getElementById('oia-root');
      const oiaGl = document.getElementById('oia-gl');
      const oiaLoading = document.getElementById('oia-loading');
      const oiaHud = document.getElementById('oia-hud');
      const editBtn = document.querySelector('#oia-root .obld-t');
      const editPanel = document.getElementById('mn-bld-p');
      const santorini = window.__santorini;

      return {
        oiaOn: window.__oiaOn,
        oiaOpen: window.MinestOia ? MinestOia.isOpen() : false,
        rootHidden: oiaRoot ? oiaRoot.hidden : null,
        loadingDone: oiaLoading ? oiaLoading.classList.contains('done') : null,
        hasSantorini: !!santorini,
        editBtnExists: !!editBtn,
        editBtnHidden: editBtn ? editBtn.hidden : null,
        editPanelExists: !!editPanel,
        editPanelHidden: editPanel ? editPanel.hidden : null,
        curTab: window.MinestOiaBld ? MinestOiaBld.version : null
      };
    })()
  `);
  console.log('After Click:', JSON.stringify(afterClick));
  await takeScreenshot('inspect_02_after_click.png');

  // 4. Test clicking the Edit button inside Santorini
  console.log('=== Testing Santorini Edit Button ===');
  const editClickRes = await evalJS(`
    (() => {
      const btn = document.querySelector('#oia-root .obld-t');
      if (!btn) return { error: 'no edit btn' };
      btn.click();
      const panel = document.getElementById('mn-bld-p');
      return {
        editBtnClicked: true,
        panelHidden: panel ? panel.hidden : null,
        panelHtml: panel ? panel.innerHTML.slice(0, 200) : null
      };
    })()
  `);
  console.log('Edit Click Result:', JSON.stringify(editClickRes));
  await sleep(1500);
  await takeScreenshot('inspect_03_panel_open.png');

  // 5. Check pointer events on the 3D canvas and buttons
  const pointerCheck = await evalJS(`
    (() => {
      const gl = document.getElementById('oia-gl');
      const hud = document.getElementById('oia-hud');
      const root = document.getElementById('oia-root');
      const panel = document.getElementById('mn-bld-p');
      const btn = document.querySelector('#oia-root .obld-t');

      function info(el) {
        if (!el) return null;
        const cs = window.getComputedStyle(el);
        return {
          id: el.id,
          class: el.className,
          zIndex: cs.zIndex,
          pointerEvents: cs.pointerEvents,
          display: cs.display
        };
      }

      return {
        root: info(root),
        gl: info(gl),
        hud: info(hud),
        btn: info(btn),
        panel: info(panel)
      };
    })()
  `);
  console.log('Pointer Events Check:', JSON.stringify(pointerCheck));

  proc.kill();
  process.exit(0);
}

run().catch((e) => {
  console.error('Inspect failed:', e);
  process.exit(1);
});

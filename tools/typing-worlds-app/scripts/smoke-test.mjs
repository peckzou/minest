import { chromium } from 'playwright';
import { preview } from 'vite';
import { mkdirSync } from 'node:fs';

async function main() {
  mkdirSync('screenshots', { recursive: true });

  console.log('[SmokeTest] Starting Vite preview server...');
  const server = await preview({ preview: { port: 5199 } });
  const url = 'http://localhost:5199/';
  console.log('[SmokeTest] Server listening at', url);

  const browser = await chromium.launch({
    headless: true,
    executablePath: '/Users/cece/Library/Caches/ms-playwright/chromium_headless_shell-1254/chrome-headless-shell-mac-arm64/chrome-headless-shell',
  });
  const context = await browser.newContext({ viewport: { width: 1280, height: 800 } });
  const page = await context.newPage();

  page.on('console', (msg) => {
    if (msg.type() === 'error') console.error('[Page Error]', msg.text());
  });

  try {
    console.log('[SmokeTest] Navigating to page...');
    await page.goto(url, { waitUntil: 'networkidle' });
    await page.waitForTimeout(600);

    // 1. Magnetic Jelly: Type "wonder"
    console.log('[SmokeTest] 1. Testing Magnetic Jelly...');
    const input = page.locator('.tw-input');
    await input.focus();
    await page.keyboard.type('wonder', { delay: 100 });
    await page.waitForTimeout(600);
    await page.screenshot({ path: 'screenshots/01-magnetic-jelly-typed.png' });

    // Enter to complete & save
    await page.keyboard.press('Enter');
    await page.waitForTimeout(800);
    await page.screenshot({ path: 'screenshots/01-magnetic-jelly-saved.png' });

    // 2. Open Gallery
    console.log('[SmokeTest] 2. Testing Gallery Modal...');
    await page.click('.tw-gallery-trigger');
    await page.waitForSelector('.tw-gallery', { state: 'visible' });
    await page.waitForTimeout(500);
    await page.screenshot({ path: 'screenshots/02-gallery-modal.png' });

    // 3. Switch to Chalk Flow
    console.log('[SmokeTest] 3. Testing Chalk Flow...');
    const chalkCard = page.locator('.tw-card').filter({ hasText: '粉笔黑板' });
    await chalkCard.locator('.tw-card-go').click();
    await page.waitForTimeout(800);

    await input.focus();
    await page.keyboard.type('chalk', { delay: 120 });
    await page.waitForTimeout(800);
    await page.screenshot({ path: 'screenshots/03-chalk-flow-typed.png' });

    // 4. Switch to Noble Gas Neon
    console.log('[SmokeTest] 4. Testing Noble Gas Neon...');
    await page.click('.tw-gallery-trigger');
    await page.waitForSelector('.tw-gallery', { state: 'visible' });
    const neonCard = page.locator('.tw-card').filter({ hasText: 'Neon' });
    await neonCard.locator('.tw-card-go').click();
    await page.waitForTimeout(800);

    await input.focus();
    await page.keyboard.type('neon', { delay: 100 });
    await page.waitForTimeout(800);
    await page.screenshot({ path: 'screenshots/04-noble-gas-neon.png' });

    // 5. Switch to Magic Wand
    console.log('[SmokeTest] 5. Testing Magic Wand...');
    await page.click('.tw-gallery-trigger');
    await page.waitForSelector('.tw-gallery', { state: 'visible' });
    const wandCard = page.locator('.tw-card').filter({ hasText: 'Magic Wand' });
    await wandCard.locator('.tw-card-go').click();
    await page.waitForTimeout(800);

    await input.focus();
    await page.keyboard.type('magic', { delay: 120 });
    await page.waitForTimeout(800);
    await page.screenshot({ path: 'screenshots/05-magic-wand.png' });

    // Backspace test
    await page.keyboard.press('Backspace');
    await page.keyboard.press('Backspace');
    await page.waitForTimeout(400);
    await page.screenshot({ path: 'screenshots/06-magic-wand-backspace.png' });

    console.log('[SmokeTest] ALL CHECKS PASSED SUCCESSFULLY!');
  } finally {
    await browser.close();
    await server.close();
  }
}

main().catch((err) => {
  console.error('[SmokeTest FAILED]', err);
  process.exit(1);
});

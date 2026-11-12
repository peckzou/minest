import { chromium } from '/Users/cece/Documents/minest-pr9/node_modules/playwright/index.mjs';

async function main() {
  console.log('🚀 Running Duo verification on http://127.0.0.1:8151 ...');
  const browser = await chromium.launch({ headless: true });
  const page = await browser.newPage({ viewport: { width: 1398, height: 950 } });

  // 1. Check World Portal on Duo
  console.log('1. Checking http://127.0.0.1:8151/worlds.html ...');
  await page.goto('http://127.0.0.1:8151/worlds.html', { waitUntil: 'domcontentloaded' });
  const portalTitle = await page.title();
  console.log('   Portal Title:', portalTitle);
  await page.screenshot({ path: '/Users/cece/.gemini/antigravity/brain/bcaa46a4-4c84-448b-9402-6618d36c7d65/duo_shot_worlds_portal.png' });

  // 2. Check iPhoneDuo.html
  console.log('2. Checking http://127.0.0.1:8151/iPhoneDuo.html ...');
  await page.goto('http://127.0.0.1:8151/iPhoneDuo.html', { waitUntil: 'domcontentloaded' });
  
  // Wait up to 15s for the portal button
  for (let i = 0; i < 30; i++) {
    const btn = await page.$('#mn-btn-worlds-portal-3d');
    if (btn) {
      console.log('   Found #mn-btn-worlds-portal-3d on iPhoneDuo!');
      break;
    }
    await page.waitForTimeout(500);
  }

  // Click portal button to open modal
  await page.click('#mn-btn-worlds-portal-3d');
  await page.waitForSelector('#mn-worlds-modal-69', { timeout: 5000 });
  console.log('   Modal opened successfully on iPhoneDuo!');
  await page.screenshot({ path: '/Users/cece/.gemini/antigravity/brain/bcaa46a4-4c84-448b-9402-6618d36c7d65/duo_shot_modal_popup.png' });

  // 3. Test opening Lauterbrunnen directly on Duo
  console.log('3. Checking Lauterbrunnen on Duo port 8151 ...');
  await page.goto('http://127.0.0.1:8151/lauterbrunnen.html', { waitUntil: 'domcontentloaded' });
  console.log('   Lauterbrunnen Title:', await page.title());
  await page.waitForTimeout(2000);
  await page.screenshot({ path: '/Users/cece/.gemini/antigravity/brain/bcaa46a4-4c84-448b-9402-6618d36c7d65/duo_shot_lauterbrunnen.png' });

  await browser.close();
  console.log('🎉 Duo Verification Completed Successfully!');
}

main().catch(err => {
  console.error('Test failed:', err);
  process.exit(1);
});

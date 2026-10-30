const assert = require('node:assert/strict');
async function chooseView(page,mode) {
  await page.evaluate(()=>window.MinestChrome && MinestChrome.show());
  const trigger=page.getByRole('toolbar',{name:'Dock',exact:true}).getByRole('button',{name:'Views',exact:true});
  await trigger.click();
  await page.getByRole('menu',{name:'Views',exact:true}).locator('[data-view-mode="'+mode+'"]').click();
  assert.equal(await page.locator('.miv-floating-switch').count(),0);
}
module.exports={chooseView};

const {chromium}=require(process.env.PLAYWRIGHT_MODULE||'playwright');
const fs=require('fs'),path=require('path'),assert=require('node:assert/strict');
const repo=path.resolve(__dirname,'../../..'),out=process.env.MINEST_TEST_OUTPUT||path.resolve(__dirname,'..');
const origin=process.env.MINEST_TEST_ORIGIN||'http://127.0.0.1:8765';
(async()=>{const browser=await chromium.launch({channel:'chrome',headless:true});try{
 const page=await browser.newPage({viewport:{width:390,height:844},hasTouch:true});const errors=[];page.on('pageerror',e=>errors.push(e.message));
 const board=JSON.parse(fs.readFileSync(path.join(repo,'ec6_anchor_charts_143_board.json')));board.id='ios-photo-test';
 board.columns.forEach(col=>col.cards.forEach(card=>{['value','originalUrl','url'].forEach(k=>{if(card.cover[k])card.cover[k]=card.cover[k].replace('https://minest-app.vercel.app','')});}));
 await page.addInitScript(board=>{if(!localStorage.getItem('focusboard_boards_v7_2')){localStorage.setItem('focusboard_boards_v7_2',JSON.stringify([board]));localStorage.setItem('focusboard_active_id_v7_2',board.id);}},board);
 await page.route('**/*',r=>r.request().url().startsWith(origin)?r.continue():r.abort());
 await page.goto(origin+'/iphone.html?mode=photos',{waitUntil:'domcontentloaded'});await page.waitForSelector('.miv-photos');assert.equal(await page.locator('.miv-tile').count(),143);
 assert.ok((await page.locator('.miv-photos').boundingBox()).y<=54,'grid starts below one compact header');
 assert.equal(await page.locator('.miv-tools:visible').count(),0);assert.equal(await page.locator('.miv-sheet-zoom:visible').count(),0);
 const pet=page.locator('#minest-mini-pet-p0');await pet.waitFor();let p=await pet.boundingBox();await page.mouse.move(p.x+p.width/2,p.y+p.height/2);await page.mouse.down();await page.mouse.move(280,560,{steps:8});await page.mouse.up();let p2=await pet.boundingBox();assert.ok(Math.abs(p2.x-p.x)+Math.abs(p2.y-p.y)>60,'Octo moves with mouse');
 const cdp=await page.context().newCDPSession(page);
 async function touch(type,points){await cdp.send('Input.dispatchTouchEvent',{type,touchPoints:points.map((p,i)=>({x:p[0],y:p[1],id:i+1}))});}
 async function swipe(a,b){await touch('touchStart',[a]);await touch('touchMove',[[a[0]+(b[0]-a[0])/2,a[1]+(b[1]-a[1])/2]]);await touch('touchMove',[b]);await touch('touchEnd',[]);}
 await swipe([p2.x+p2.width/2,p2.y+p2.height/2],[85,635]);let p3=await pet.boundingBox();assert.ok(Math.abs(p3.x-p2.x)+Math.abs(p3.y-p2.y)>40,'Octo moves with touch');
 await page.locator('.miv-tile').first().click();await page.waitForSelector('.miv-viewer');assert.equal(await page.locator('.miv-viewer').getAttribute('data-image-scale'),'1.00');
 await touch('touchStart',[[140,350],[240,350]]);await touch('touchMove',[[80,350],[300,350]]);await touch('touchEnd',[]);
 const scale=Number(await page.locator('.miv-viewer').getAttribute('data-image-scale'));assert.ok(scale>1.8,'two-finger image pinch scales the image');
 const transform=await page.locator('.miv-viewer-pan img').getAttribute('style');await swipe([190,420],[135,360]);assert.notEqual(await page.locator('.miv-viewer-pan img').getAttribute('style'),transform,'zoomed image pans');
 await touch('touchStart',[[90,350],[300,350]]);await touch('touchMove',[[155,350],[235,350]]);await touch('touchEnd',[]);assert.equal(await page.locator('.miv-viewer').getAttribute('data-image-scale'),'1.00');
 await swipe([300,390],[70,400]);await page.waitForFunction(()=>document.querySelector('.miv-photo-heading strong').textContent.includes('Vowel Teams'));
 await page.getByRole('button',{name:'View photo 20',exact:true}).click();assert.ok((await page.locator('.miv-photo-heading small').innerText()).startsWith('20 of'));
 await swipe([190,300],[200,475]);await page.waitForSelector('.miv-viewer',{state:'detached'});
 await page.getByRole('button',{name:'Select',exact:true}).click();await page.locator('.miv-tile').nth(20).click();await page.locator('.miv-tile').nth(21).click();assert.equal(await page.locator('.miv-selected').count(),2);
 await page.getByRole('button',{name:'Manage selected photos',exact:true}).click();await page.getByRole('button',{name:'New album…',exact:true}).click();await page.getByRole('textbox',{name:'Album name',exact:true}).fill('Quick selection');await page.getByRole('button',{name:'Create album',exact:true}).click();assert.ok(await page.getByRole('button',{name:'Quick selection, 2 photos',exact:true}).isVisible());
 await page.reload({waitUntil:'domcontentloaded'});await page.waitForSelector('.miv-photos');await page.getByRole('button',{name:'Albums',exact:true}).click();assert.ok(await page.getByRole('button',{name:'Quick selection, 2 photos',exact:true}).isVisible(),'album references survive canonical hydration');
 await page.getByRole('button',{name:'All Photos',exact:true}).click();await page.getByRole('button',{name:'Import photos',exact:true}).click();assert.equal(await page.getByRole('button',{name:'Choose photos…',exact:true}).isEnabled(),false);assert.ok(await page.getByRole('button',{name:'Sign in to Cloud Sync',exact:true}).isVisible());await page.getByRole('button',{name:'Close import',exact:true}).click();
 // Isolated contract double for the existing owner-scoped Firestore SDK, never the live service.
 await page.evaluate(()=>{
  const rows=new Map();window.__photoTestRows=rows;window.__photoTestDeny=false;
  function doc(path){return {path,get:async()=>({exists:rows.has(path),data:()=>rows.get(path)}),set:async data=>rows.set(path,data),collection:name=>collection(path+'/'+name),onSnapshot:()=>()=>{}};}
  function collection(path){return {doc:id=>doc(path+'/'+id)};}
  const db={doc,collection,batch(){const ops=[];return{set(ref,value){ops.push([ref.path,value])},async commit(){if(window.__photoTestDeny){let e=new Error('denied');e.code='permission-denied';throw e;}ops.forEach(([p,v])=>rows.set(p,v));}}}};
  function firestore(){return db;}firestore.Blob={fromUint8Array:bytes=>({toUint8Array:()=>bytes})};firestore.FieldValue={serverTimestamp:()=>Date.now()};
  const user={uid:'photo-test-owner'};const auth={currentUser:user,onAuthStateChanged:()=>()=>{},getRedirectResult:async()=>({user:null})};window.firebase={apps:[{}],auth:()=>auth,firestore,app:()=>({options:{}})};
 });
 await page.getByRole('button',{name:'Import photos',exact:true}).click();await page.getByLabel('Upload destination',{exact:true}).selectOption(board.columns[1].id);
 const fixture=path.join(repo,'public/anchor-charts/thumbs/ELAR-01_Vowel-Valley-and-Sound-Wall.webp');await page.locator('input[aria-label="Choose photos to upload"]').setInputFiles(fixture);
 await page.waitForFunction(()=>document.querySelectorAll('.miv-tile').length===144);
 const uploaded=await page.evaluate(()=>{const b=MinestAI.board(),c=b.columns.flatMap(c=>c.cards).find(c=>c.cover&&c.cover.asset);return {column:b.columns.find(col=>col.cards.some(x=>x.id===c.id)).id,asset:c.cover.asset,previewLength:c.cover.value.length,docs:[...__photoTestRows].filter(([p])=>p.includes('/photoAssets/')).map(([p,v])=>({path:p,bytes:v.image.toUint8Array().length}))};});
 assert.equal(uploaded.column,board.columns[1].id);assert.ok(uploaded.asset.path.startsWith('users/photo-test-owner/photoAssets/'));assert.equal(uploaded.docs.length,2);assert.ok(uploaded.docs.every(d=>d.bytes<800000));assert.ok(uploaded.previewLength<2600);
 await page.getByRole('button',{name:'Import photos',exact:true}).click();await page.evaluate(()=>window.__photoTestDeny=true);await page.locator('input[aria-label="Choose photos to upload"]').setInputFiles(fixture);await page.waitForFunction(()=>document.querySelector('.miv-photo-sheet').textContent.includes('Cloud access was denied'));assert.equal(await page.locator('.miv-tile').count(),144,'denied upload adds no fake photo');await page.getByRole('button',{name:'Close import',exact:true}).click();
 // A selected photo may differ from the last viewed photo: management must use the selection.
 await page.getByRole('button',{name:'Select',exact:true}).click();const managedId=await page.locator('.miv-tile').nth(3).getAttribute('data-card-id');await page.locator('.miv-tile').nth(3).click();await page.getByRole('button',{name:'Manage selected photos',exact:true}).click();await page.getByLabel('Photo title',{exact:true}).fill('Managed chart');await page.getByRole('button',{name:'Rename',exact:true}).click();
 assert.equal(await page.evaluate(id=>MinestAI.board().columns.flatMap(c=>c.cards).find(c=>String(c.id)===id).title,managedId),'Managed chart');
 await page.getByRole('button',{name:'Manage selected photos',exact:true}).click();await page.getByRole('button',{name:'Replace image…',exact:true}).click();await page.evaluate(()=>window.__photoTestDeny=false);await page.locator('input[aria-label="Choose replacement photo"]').setInputFiles(fixture);await page.waitForFunction(id=>!!MinestAI.board().columns.flatMap(c=>c.cards).find(c=>String(c.id)===id).cover.asset,managedId);assert.equal(await page.locator('.miv-tile').count(),144,'replacement retains the same Card');
 await page.getByRole('button',{name:'Manage selected photos',exact:true}).click();await page.getByLabel('Move photos to List',{exact:true}).selectOption(board.columns[2].id);assert.equal(await page.evaluate(id=>MinestAI.board().columns.find(c=>c.cards.some(c=>String(c.id)===id)).id,managedId),board.columns[2].id);
 await page.getByRole('button',{name:'Select',exact:true}).click();await page.locator('.miv-tile[data-card-id="'+managedId+'"]').click();await page.getByRole('button',{name:'Manage selected photos',exact:true}).click();await page.getByRole('button',{name:'Remove image · keep Cards',exact:true}).click();await page.waitForFunction(()=>document.querySelectorAll('.miv-tile').length===143);assert.equal(await page.evaluate(id=>MinestAI.board().columns.flatMap(c=>c.cards).find(c=>String(c.id)===id).title,managedId),'Managed chart','removing the image retains its Card');
 await page.screenshot({path:path.join(out,'ios-photos-library.png')});
 assert.deepEqual(errors,[]);fs.writeFileSync(path.join(out,'ios-photos-results.txt'),'PASS: compact header, Octo mouse/touch drag, single-tap opening, real two-touch pinch/pan, swipe next/dismiss, filmstrip jump, multi-select album, hydration persistence; owner-scoped cloud upload contract, two bounded documents, destination List, denied-upload handling, selection-scoped rename/replace/move and image removal retaining Cards.\nLive cross-device cloud transport requires the user to be signed in; contract tests used an isolated SDK double.\n');console.log('iPhone photo interactions and cloud upload contract passed.');
}finally{await browser.close();}})().catch(e=>{console.error(e);process.exit(1)});

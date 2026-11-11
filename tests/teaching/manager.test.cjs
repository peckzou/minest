const {test}=require('node:test');
const assert=require('node:assert/strict');
const fs=require('node:fs');
const vm=require('node:vm');
const crypto=require('node:crypto').webcrypto;
const {createCache}=require('../../tools/storage/durable.js');
const host=fs.readFileSync('iphone.html','utf8');
const sets=host.match(/<script id="mn-teaching-53-811-sets">([\s\S]*?)<\/script>/)[1];
const store=fs.readFileSync('tools/live-perf/teaching_store.js','utf8');
const manager=fs.readFileSync('tools/live-perf/wordlist_manager.js','utf8');
const importer=fs.readFileSync('tools/live-perf/teach_json.js','utf8');
const key='minest.teaching.wordsets.v1';
function makeDB(){const rows=new Map();return {rows,fail:false,all:async()=>Object.fromEntries(rows),update:async function(k,fn){if(this.fail)throw Error('disk full');const value=fn(rows.get(k));rows.set(k,value);return value;}};}
async function setup(db=makeDB(),quota=false){
 const local=new Map();local.set(key,JSON.stringify({version:1,id:'minest-teaching-independent-v1',columns:[],selected:null}));
 const storage={getItem:k=>local.has(k)?local.get(k):null,setItem(k,v){if(quota)throw Error('QuotaExceededError');local.set(k,v);}};
 const cache=createCache(storage,db);const messages=[];
 const document={addEventListener(){},querySelector(){return null;}};
 const context={window:{MinestDurableStorage:cache,MinestSyncManagement:{reportLocalSave:(...v)=>messages.push(v)},addEventListener(){}},localStorage:storage,document,crypto,MutationObserver:class{observe(){}},requestAnimationFrame(){},setTimeout,clearTimeout,Promise,Map,Set,Date};
 vm.createContext(context);vm.runInContext(store,context);await context.window.MinestTeachingStorage.ready;vm.runInContext(sets,context);vm.runInContext(manager,context);
 return {S:context.window.MinestTeachingSets,M:context.window.MinestWordlists,store:context.window.MinestTeachingStorage,context,db,messages};
}
test('more than five lists save and reload when localStorage is full',async()=>{
 const x=await setup(undefined,true);for(let i=0;i<25;i++)x.S.create('list '+i,'apple,book');await x.store.flush();assert.equal(x.S.read().columns.length,25);
 const reloaded=await setup(x.db,true);assert.equal(reloaded.S.read().columns.length,25);assert.equal(reloaded.S.read().columns[24].title,'list 24');
});
test('reorder, archive, restore and delete update the same existing vocabulary data',async()=>{
 const x=await setup();let ids=['first','second','third'].map(t=>x.S.create(t,t).listId);await x.store.flush();await x.M.move(ids[2],ids[0]);assert.deepEqual(Array.from(x.S.read().columns,c=>c.title),['third','first','second']);
 await x.M.archive(ids[2],true);assert.equal(x.S.read().columns[0].teachingListArchived,true);assert.notEqual(x.S.read().selected,ids[2]);
 await x.M.archive(ids[2],false);assert.equal(x.S.read().columns[0].cards.length,1);await x.M.remove(ids[1]);assert.equal(x.S.read().columns.length,2);assert.equal(x.S.read().columns[0].cards[0].title,'third');
 await assert.rejects(x.M.move('missing',ids[0]),/词表已改变/);
});
test('failed persistence reports only through settings and can be retried without losing memory draft',async()=>{
 const x=await setup(undefined,true);x.db.fail=true;x.S.create('keep me','word');await assert.rejects(x.store.flush(),/disk full/);assert.ok(x.messages.some(m=>m[0]==='teaching'&&m[1].includes('未保存')));assert.equal(x.S.read().columns[0].title,'keep me');
 x.db.fail=false;await x.store.flush();assert.equal(JSON.parse(x.db.rows.get(key)).columns[0].title,'keep me');assert.equal(x.messages.at(-1)[1],'');
});
test('existing JSON importer accepts many lists and empty exported lists',async()=>{
 const x=await setup(undefined,true),w=x.context.window;w.MinestTeachingAssets={forBoard:()=>({}),pinyin:()=>'',saveMany(){}};w.MinestTeachingData={};w.MinestLearningData={empty:()=>({})};w.MinestTemplates={read:()=>[]};vm.runInContext(importer,x.context);
 const out=w.MinestTeachingJSON.importText(JSON.stringify({lists:Array.from({length:26},(_,i)=>({title:'list '+i,words:i===0?[]:[{word:'apple',en:'apple'}]}))}));await x.store.flush();assert.equal(out.listIds.length,26);assert.equal(x.S.read().columns[0].cards.length,0);assert.equal(x.S.read().columns.length,26);
});
test('production hosts use the durable Teaching store and include home library and JSON import',()=>{
 for(const name of ['iphone.html','index.html','iPhoneDuo.html','ipad.html','ios/Minest/Minest/iphone.html']){
 const html=fs.readFileSync(name,'utf8');assert.ok(html.includes('id="minest-wordlist-manager-v1"'),name);assert.ok(html.includes('id="minest-teaching-storage-v1"'),name);assert.ok(html.includes("window.MinestTeachingStorage.setItem(KEY,JSON.stringify(b))"),name);assert.ok(html.includes('data-wordlists-open>词表管理'),name);
 }
});

const {readFileSync}=require('fs');const vm=require('vm');const assert=require('assert/strict');
const html=readFileSync('iphone.html','utf8');
const waitSrc=html.slice(html.indexOf('function minestCloudWait('),html.indexOf('function minestCloudBoardsDirty('));
const refreshSrc=html.slice(html.indexOf('        var refreshPromise = null;'),html.indexOf('        window.minestCloudSyncNow = function()'));
async function main(){
 let timer,cleared=0;const w={Promise,Error,setTimeout:fn=>{timer=fn;return 1},clearTimeout:()=>cleared++};vm.createContext(w);vm.runInContext(waitSrc,w);
 assert.equal(await w.minestCloudWait(Promise.resolve(42)),42);assert.equal(cleared,1);
 const timeout=w.minestCloudWait(new Promise(()=>{}));timer();await assert.rejects(timeout,e=>e.code==='sync/timeout');
 let resolveRead,rejectRead,reads=0,applied=0,kicks=0;const status=[],errors=[];
 const c={Promise,stopped:false,cloudReadyRef:{current:false},setCloudReadError:s=>errors.push(s),setSyncStatus:s=>status.push(s),setCloudKick:()=>kicks++,minestCloudUnsynced:()=>false,minestCloudWait:p=>p,user:{uid:'test'},firebaseConfig:{projectId:'test'},minestCloudServerRead:ref=>ref.get({source:'server'}),docRef:{get:opts=>{assert.equal(opts.source,'server');reads++;return new Promise((r,j)=>{resolveRead=r;rejectRead=j})}},acceptDoc:doc=>{assert.equal(doc.tag,'server');applied++;c.cloudReadyRef.current=true;return Promise.resolve()}};
 vm.createContext(c);vm.runInContext(refreshSrc,c);
 let p=c.refreshServer();assert.equal(c.refreshServer(),p);assert.equal(reads,1);assert.equal(applied,0);
 resolveRead({tag:'server'});assert.equal(await p,true);assert.equal(applied,1);assert.equal(kicks,1);
 p=c.refreshServer();assert.equal(reads,2);rejectRead(Object.assign(new Error('Connection timeout'),{code:'sync/timeout'}));await assert.rejects(p);assert.equal(status.at(-1),'offline');assert(errors.at(-1).includes('sync/timeout'));
 c.stopped=true;assert.equal(await c.refreshServer(),false);assert.equal(reads,2);
 const header=html.slice(html.indexOf('// Header\n',html.indexOf('var BoardSettings')),html.indexOf('// Segmented Tabs Bar'));
 assert(!header.includes('onClick: togglePureMode'));assert(!header.includes('data-cover821'));
 assert(html.includes('children: pureMode ? "✓ 纯净模式已开启"'));assert(html.includes('children: "隐藏封面"'));
 assert(html.includes('grid-template-columns:minmax(0,1fr) auto 32px'));assert(!html.includes('right:58px!important;top:50%!important;transform:translateY(-50%)'));
 console.log('PASS: bounded server reads, deduplication, no early success, offline status, auth cleanup; header quick controls removed while body settings preserved');
}
main().catch(e=>{console.error(e);process.exitCode=1});

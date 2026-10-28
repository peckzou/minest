const {readFileSync}=require('fs');const vm=require('vm');const assert=require('assert/strict');
const html=readFileSync('iphone.html','utf8');
const effect=html.slice(html.indexOf('  // Firestore Debounced Save.'),html.indexOf('  // 53.84: the app going to the background'));
const helpers=html.slice(html.indexOf('var MINEST_CLOUD_DIRTY ='),html.indexOf('/* primary\'s boards'));
async function run() {
 let payloadResolve,writeResolve,uploads=0,writes=0,captured,dirty=new Map();let effectFn;
 const ctx={console,Promise,Date,Math,setTimeout:()=>1,clearTimeout:()=>{},localStorage:{getItem:k=>dirty.get(k),setItem:(k,v)=>dirty.set(k,v)},window:{MinestWorkspaceCloud:{pending:()=>false}},_:{useEffect:fn=>effectFn=fn},boards:[{id:'a'}],activeBoardId:'a',viewMode:'board',themeMode:'dark',firebaseUser:{uid:'u',email:'example'},cloudKick:0,cloudReadyRef:{current:true},cloudSeenRef:{current:[]},isRemoteUpdateRef:{current:null},cloudLatestRef:{current:null},cloudInFlightRef:{current:null},cloudFlushRef:{current:null},saveDebounceRef:{current:null},setSyncStatus:s=>ctx.status=s,setCloudKick:()=>ctx.kicks++,kicks:0,setLastSyncTime:()=>{},minestCloudBaseSet:()=>{},GlassUI:{toast:()=>{}},minestCloudPayload:()=>{uploads++;return new Promise(r=>payloadResolve=r)}};
 const db={collection:()=>db,doc:()=>db,set:p=>{writes++;captured=p;return new Promise(r=>writeResolve=r)}};
 ctx.firebase={apps:[1],auth:()=>({currentUser:{uid:'u'}}),firestore:()=>db};
 vm.createContext(ctx);vm.runInContext(helpers,ctx);vm.runInContext(effect,ctx);
 effectFn();const firstDirty=ctx.minestCloudNum(ctx.MINEST_CLOUD_DIRTY);const saving=ctx.cloudFlushRef.current();
 ctx.boards=[{id:'a',title:'Edited during compression'}];effectFn();const secondDirty=ctx.minestCloudNum(ctx.MINEST_CLOUD_DIRTY);
 assert(secondDirty>firstDirty);assert.equal(ctx.cloudFlushRef.current(),saving);assert.equal(uploads,1);
 payloadResolve({clientUpdatedAt:Date.now()+10000,boardsGz:'compressed first snapshot'});await Promise.resolve();assert.equal(writes,1);assert.equal(captured.clientUpdatedAt,firstDirty);
 writeResolve();await saving;assert.equal(ctx.minestCloudNum(ctx.MINEST_CLOUD_ACK),firstDirty);assert(ctx.minestCloudUnsynced());assert(ctx.kicks>0);
 // Incoming remote array is exempt, but an immediate local array is never suppressed.
 ctx.isRemoteUpdateRef.current=ctx.boards;effectFn();assert.equal(ctx.isRemoteUpdateRef.current,null);assert.equal(ctx.minestCloudNum(ctx.MINEST_CLOUD_DIRTY),secondDirty);
 ctx.boards=[{id:'a',title:'Immediate real edit'}];effectFn();assert(ctx.minestCloudNum(ctx.MINEST_CLOUD_DIRTY)>secondDirty);
 // Server readiness is mandatory: cached initial data cannot enable writes.
 ctx.cloudReadyRef.current=false;ctx.cloudFlushRef.current=null;effectFn();assert.equal(ctx.cloudFlushRef.current,null);
 console.log('PASS: actual save effect: compression race, monotonic dirty versions, serialized writes, exact ACK, immediate edit after remote update, server-read gating');
}
run().catch(e=>{console.error(e);process.exitCode=1});

const {test}=require('node:test'),a=require('node:assert/strict');
const D=require('../../tools/storage/durable.js'),E=require('../../tools/routine/envelope.js');
const seed=()=>({version:1,tasks:[],runs:{},routines:[{id:'main',name:'Main',mode:'timeline'}],currentRoutine:'main'});
const add=(s,id)=>({...s,routines:[...s.routines,{id,name:id,mode:'timeline'}],tasks:[...s.tasks,{id,title:id,routine:id}]});
function setup(){let disk=null,fail=false,release=null,events=[];const storage={getItem:()=>null,setItem:()=>{throw Error('QuotaExceededError')}};let chain=Promise.resolve();const db={read:async()=>disk,update:(k,fn)=>{let p=chain.catch(()=>{}).then(async()=>{if(release)await new Promise(r=>release=r);if(fail)throw Error('disk blocked');disk=JSON.parse(JSON.stringify(fn(disk)));return disk;});chain=p;return p;},all:async()=>({})};const client=actor=>D.routine({storage,database:db,envelope:E,actor,notify:()=>{},apply:()=>{},status:s=>events.push(s)});return {client,storage,db,disk:()=>disk,fail:v=>fail=v,events};}
test('full localStorage still saves durably and survives reopening',async()=>{let f=setup(),c=f.client('mac');await c.ready;c.set(JSON.stringify(add(seed(),'EC6')),JSON.stringify(seed()));await c.flush();let re=f.client('reload');await re.ready;a.ok(JSON.parse(re.get()).tasks.some(t=>t.title==='EC6'));a.equal(re.pending(),true);});
test('two clients merge atomic commits from stale views',async()=>{let f=setup(),A=f.client('mac'),B=f.client('duo');await Promise.all([A.ready,B.ready]);A.set(JSON.stringify(add(seed(),'A')),JSON.stringify(seed()));B.set(JSON.stringify(add(seed(),'B')),JSON.stringify(seed()));await Promise.all([A.flush(),B.flush()]);a.deepEqual(f.disk().state.tasks.map(t=>t.id).sort(),['A','B']);});
test('storage failure preserves draft, surfaces error, and later edit retries',async()=>{let f=setup(),c=f.client('mac');await c.ready;f.fail(true);c.set(JSON.stringify(add(seed(),'EC6')),JSON.stringify(seed()));await a.rejects(c.flush());a.equal(JSON.parse(c.get()).tasks[0].id,'EC6');a.ok(f.events.at(-1).error);f.fail(false);let s=JSON.parse(c.get());c.set(JSON.stringify(add(s,'Later')),JSON.stringify(s));await c.flush();a.equal(f.disk().state.tasks.length,2);a.equal(f.events.at(-1).error,null);});
test('old cloud ACK does not acknowledge newer edits and survives reload',async()=>{let f=setup(),c=f.client('mac');await c.ready;c.set(JSON.stringify(add(seed(),'A')),JSON.stringify(seed()));await c.flush();let sent=structuredClone(c.cloud()),s=JSON.parse(c.get());c.set(JSON.stringify(add(s,'B')),JSON.stringify(s));await c.mergeCloud(sent);a.equal(c.pending(),true);a.equal(f.disk().state.tasks.length,2);await c.mergeCloud(c.cloud());a.equal(c.pending(),false);let reload=f.client('reload');await reload.ready;a.equal(reload.pending(),false);});
test('metadata fallback persists through quota without falsely reporting storage failure',async()=>{let data={},db={all:async()=>data,update:async(k,fn)=>(data[k]=fn(data[k]))};let cache=D.createCache({getItem:()=>null,setItem:()=>{throw Error('quota')}},db);await cache.ready;await cache.setItem('minest.cloud.dirtyAt','20');await cache.flush();let reload=D.createCache({getItem:()=>null,setItem:()=>{throw Error('quota')}},db);await reload.ready;a.equal(reload.getItem('minest.cloud.dirtyAt'),'20');});

test('retry flush recovers failed saves without requiring another user edit',async()=>{let f=setup(),c=f.client('mac');await c.ready;f.fail(true);c.set(JSON.stringify(add(seed(),'keep-me')),JSON.stringify(seed()));await a.rejects(c.flush());f.fail(false);await c.flush();a.equal(f.disk().state.tasks[0].id,'keep-me');});
test('valid database survives a corrupted legacy localStorage copy',async()=>{let f=setup(),c=f.client('mac');await c.ready;c.set(JSON.stringify(add(seed(),'safe')),JSON.stringify(seed()));await c.flush();let re=D.routine({database:f.db,storage:{getItem:()=>'{broken'},envelope:E,actor:'reload',notify:()=>{},apply:()=>{}});await re.ready;a.equal(JSON.parse(re.get()).tasks[0].id,'safe');});

test('repeated identical cloud polls do not persist, apply, notify, or show saving',async()=>{
 const f=setup();let writes=0,applies=0,dirty=0,status=[];const update=f.db.update;f.db.update=(...args)=>{writes++;return update(...args)};
 const c=D.routine({storage:f.storage,database:f.db,envelope:E,actor:'mac',notify:()=>dirty++,apply:()=>applies++,status:s=>status.push(s)});
 await c.ready;c.set(JSON.stringify(add(seed(),'A')),JSON.stringify(seed()));await c.flush();await c.mergeCloud(c.cloud());c.get();
 const accepted=structuredClone(c.cloud());writes=0;applies=0;dirty=0;status=[];
 for(let i=0;i<30;i++)await c.mergeCloud(accepted);
 a.equal(writes,0);a.equal(applies,0);a.equal(dirty,0);a.equal(status.some(s=>s.saving),false);a.equal(c.pending(),false);
});
test('cloud ACK only changes durable metadata and never re-applies the same visible state',async()=>{
 const f=setup();let applies=0,status=[];const c=D.routine({storage:f.storage,database:f.db,envelope:E,actor:'mac',notify:()=>{},apply:()=>applies++,status:s=>status.push(s)});
 await c.ready;c.set(JSON.stringify(add(seed(),'A')),JSON.stringify(seed()));await c.flush();a.equal(applies,0);status=[];
 await c.mergeCloud(c.cloud());a.equal(applies,0);a.equal(status.some(s=>s.saving),false);a.equal(f.disk().pending,false);
});
test('no-op save does not create a new edit revision or re-enter the upload queue',async()=>{
 const f=setup(),c=f.client('mac');await c.ready;c.set(JSON.stringify(add(seed(),'A')),JSON.stringify(seed()));await c.flush();await c.mergeCloud(c.cloud());const raw=c.get(),clock=c.cloud().clock;
 c.set(raw,raw);await c.flush();a.equal(c.cloud().clock,clock);a.equal(c.pending(),false);
});
test('real changed remote data still persists and updates the UI once, without an editing toast',async()=>{
 const f=setup();let applies=0,status=[];const c=D.routine({storage:f.storage,database:f.db,envelope:E,actor:'mac',notify:()=>{},apply:()=>applies++,status:s=>status.push(s)});
 await c.ready;const remote=E.edit({state:seed()},seed(),add(seed(),'Duo'),'duo',100);
 await c.mergeCloud(remote);a.equal(applies,1);a.equal(f.disk().state.tasks[0].id,'Duo');a.equal(status.some(s=>s.saving),false);
});

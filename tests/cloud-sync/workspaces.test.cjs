const {readFileSync}=require('fs');
const vm=require('vm');
const assert=require('assert/strict');
const source=readFileSync('tools/live-perf/cloud_workspace_sync.js','utf8');
function client(initial={}) {
 const data=new Map(Object.entries(initial)), listeners=new Map();
 const ctx={Map,Set,Number,Date,JSON,Event:class {constructor(type){this.type=type}},localStorage:{getItem:k=>data.get(k)||null,setItem:(k,v)=>data.set(k,v)},addEventListener:(n,fn)=>listeners.set(n,fn),dispatchEvent:e=>listeners.get(e.type)?.(e)};
 ctx.window=ctx;vm.createContext(ctx);vm.runInContext(source,ctx);
 return {api:ctx.MinestWorkspaceCloud,ctx,data};
}
const a=client({'minest.customWorkspaces.v1':'["Safari unsent","__proto__"]'}), b=client();
assert.deepEqual(Array.from(a.api.names()),['Safari unsent','__proto__']);
assert(a.api.pending());
b.api.merge(a.api.snapshot(),true);
assert.deepEqual(Array.from(b.api.names()),Array.from(a.api.names()));
assert(!b.api.pending());
a.api.merge(a.api.snapshot(),true);assert(!a.api.pending());
a.api.save(['Safari unsent','__proto__','Mac folder']);
b.api.save(['Safari unsent','__proto__','Duo folder']);
const aUpload=a.api.snapshot(), bUpload=b.api.snapshot();
a.api.merge(bUpload,true); b.api.merge(aUpload,true);
assert(a.api.pending());assert(b.api.pending());
const union=a.api.snapshot();b.api.merge(union,true);a.api.merge(union,true);
assert(!a.api.pending());assert(!b.api.pending());
assert.deepEqual(Array.from(a.api.names()),['Duo folder','Mac folder','Safari unsent','__proto__']);
a.api.save(['Duo folder','Mac renamed','Safari unsent','__proto__']);
b.api.merge(a.api.snapshot(),true);
assert(!b.api.names().includes('Mac folder'));
assert(b.api.names().includes('Mac renamed'));
b.api.merge(aUpload,true); // an old device cannot resurrect deleted group
assert(!b.api.names().includes('Mac folder'));assert(b.api.pending());
const c=client();c.api.save(['Offline']);c.api.merge(c.api.snapshot(),false);assert(c.api.pending());
c.api.merge(c.api.snapshot(),true);assert(!c.api.pending());
c.api.resetServer();assert(c.api.pending());
const d=client({'minest.customWorkspaces.v1':'["Local legacy"]'});d.api.merge(undefined,true);assert(d.api.pending());
let changed=0;d.ctx.addEventListener('minest:workspaces-changed',()=>changed++);d.api.merge(union,true);assert.equal(changed,1);
const e=client();e.ctx.localStorage.setItem=()=>{throw Error('QuotaExceededError')};assert.throws(()=>e.api.save(['Not saved']),/Quota/);assert.equal(e.api.names().length,0);
console.log('PASS: legacy recovery, cloud acknowledgment, concurrent additions, rename/delete, stale/cache snapshots, UI events, quota failure');
// Parse the actual deployed inline JavaScript, including the patched React component.
const html=readFileSync('iphone.html','utf8');let count=0;
for(const m of html.matchAll(/<script\b([^>]*)>([\s\S]*?)<\/script>/gi)) {
 if(/\bsrc\s*=|type\s*=\s*["'](?:application\/ld\+json|application\/json|importmap)/i.test(m[1]))continue;
 if(m[2].trim()){new vm.Script(m[2],{filename:'iphone.inline.'+(++count)+'.js'});}
}
assert(html.includes('base.workspaceGroups = window.MinestWorkspaceCloud.snapshot()'));
assert(!html.includes('setTimeout(function() { isRemoteUpdateRef.current = false; }, 300)'));
assert(html.includes('includeMetadataChanges: true'));
console.log('PASS: '+count+' inline scripts parse; groups included in actual payload; exact remote identity guard');

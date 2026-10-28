const fs=require('fs'),vm=require('vm'),assert=require('assert/strict');
const helper=fs.readFileSync('tools/live-perf/cloud_server_read.js','utf8');
async function main(){
 let requests=[],tokenReads=0,status=200;
 const c={Promise,Error,Object,Number,encodeURIComponent,setTimeout,clearTimeout,AbortController,
 minestCloudWait:p=>p,fetch:async(url,options)=>{requests.push({url,options});return {status,ok:status===200,json:async()=>({fields:{boardsGz:{stringValue:'compressed'},workspaceGroups:{arrayValue:{values:[{mapValue:{fields:{name:{stringValue:'Learning'},at:{integerValue:'123'},deleted:{booleanValue:false}}}}]}},clientUpdatedAt:{integerValue:'456'}}})}}};
 vm.createContext(c);vm.runInContext(helper,c);
 const user={uid:'current-user',getIdToken:async()=>{tokenReads++;return 'test-token'}};
 const good={exists:true,metadata:{fromCache:false,hasPendingWrites:false},data:()=>({})};
 assert.equal(await c.minestCloudServerRead({get:async()=>good},user,'test-project'),good);assert.equal(requests.length,0);
 const pending={metadata:{fromCache:false,hasPendingWrites:true}};
 let doc=await c.minestCloudServerRead({get:async()=>pending},user,'test-project');
 assert.equal(doc.metadata.hasPendingWrites,false);assert.equal(doc.metadata.fromCache,false);
 assert.equal(doc.data().workspaceGroups[0].name,'Learning');assert.equal(doc.data().clientUpdatedAt,456);
 assert.equal(requests[0].options.method,'GET');assert(requests[0].url.endsWith('/users/current-user/focusboard/data'));assert.equal(requests[0].options.headers.Authorization,'Bearer test-token');assert(!requests[0].url.includes('test-token'));
 await c.minestCloudServerRead({get:async()=>({metadata:{fromCache:true}})},user,'test-project');
 await c.minestCloudServerRead({get:async()=>{throw Object.assign(new Error(),{code:'sync/timeout'})}},user,'test-project');
 assert.equal(requests.length,3);assert.equal(tokenReads,3);
 await assert.rejects(c.minestCloudServerRead({get:async()=>{throw Object.assign(new Error(),{code:'permission-denied'})}},user,'test-project'));
 assert.equal(requests.length,3);
 for(status of [401,403,404,503]) await assert.rejects(c.minestCloudServerRead({get:async()=>pending},user,'test-project'));
 assert(requests.every(r=>r.options.method==='GET'));assert(!helper.includes("method:'POST'"));
 console.log('PASS: clean SDK reads reused; pending/cache/timeouts use authenticated GET only; nested fields decode; permission/HTTP failures preserve local data');
}
main().catch(e=>{console.error(e);process.exitCode=1});

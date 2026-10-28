const fs=require('fs'),vm=require('vm'),assert=require('assert/strict');
const s=fs.readFileSync('iphone.html','utf8'),code=s.slice(s.indexOf('function initFirebaseClient('),s.indexOf('// The Firebase scripts are deferred;'));
for(const ua of ['Mozilla Macintosh Version/26.5 Safari/605.1.15','Mozilla iPhone AppleWebKit/605.1.15','Mozilla Macintosh Chrome/145 Safari/537']){
 let order=[],settings;
 const db={settings:o=>{settings=o;order.push('settings')},enablePersistence:()=>{order.push('persistence');return Promise.resolve()}};
 const c={console,navigator:{userAgent:ua},firebase:{apps:[1],app:()=>({}),auth:()=>({}),firestore:()=>db}};
 vm.createContext(c);vm.runInContext(code,c);assert(c.initFirebaseClient({apiKey:'public-test',projectId:'test'}));
 if(ua.includes('Chrome'))assert.equal(settings,undefined);else {assert.equal(settings.experimentalForceLongPolling,true);assert.equal(settings.experimentalAutoDetectLongPolling,false);assert.equal(settings.useFetchStreams,false);assert.equal(order[0],'settings');}
 c.initFirebaseClient({apiKey:'public-test',projectId:'test'});assert.equal(order.filter(x=>x==='settings').length,ua.includes('Chrome')?0:1);
}
console.log('PASS: WebKit compatibility transport configured once before persistence; Chrome transport unchanged');

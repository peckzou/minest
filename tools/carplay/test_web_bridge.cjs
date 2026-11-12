const fs=require('node:fs'),vm=require('node:vm'),assert=require('node:assert/strict');
const source=fs.readFileSync('tools/live-perf/carflash.js','utf8');
const post=source.slice(source.indexOf('var nativeReplyTimer'),source.indexOf('function prefs'));
const listener=source.slice(source.indexOf("window.addEventListener('minestNativeEvent'"),source.indexOf('/* browser preview: the panel plays'));
let timers=new Map(),id=0,note={textContent:''},receive,hasNative=true,throws=false,sent=[];
const ctx={native:()=>hasNative?{postMessage:m=>{if(throws)throw Error('closed');sent.push(m);}}:null,
setTimeout:fn=>{timers.set(++id,fn);return id;},clearTimeout:n=>timers.delete(n),
ov:{querySelector:()=>note},window:{addEventListener:(_name,cb)=>receive=cb},
G:()=>null,paint:()=>{},err:()=>{},st:{},gs:null};
vm.createContext(ctx);vm.runInContext(post+listener,ctx);
ctx.post('carFlashStart',{words:['one']});assert.equal(sent[0].action,'carFlashStart');assert.equal(timers.size,1);
receive({detail:{event:'carFlash',payload:{playing:true,word:'one',index:0,total:1}}});assert.equal(timers.size,0);assert.equal(ctx.st.word,'one');console.log('PASS: real native receipt cancels warning and updates current word');
ctx.post('carFlashState');for(const fn of [...timers.values()])fn();timers.clear();assert.match(note.textContent,/CarPlay 无法同步/);console.log('PASS: missing bridge gives explicit native-app update message');
receive({detail:{event:'carFlash',payload:{playing:true,word:'two'}}});assert.equal(note.textContent,'原生闪卡已连接。');console.log('PASS: late native receipt clears missing-bridge warning');
hasNative=false;assert.equal(ctx.post('carFlashStart'),false);assert.equal(timers.size,0);console.log('PASS: browser preview has no false native warning');
hasNative=true;throws=true;assert.equal(ctx.post('carFlashStart'),false);assert.equal(timers.size,0);console.log('PASS: rejected native send cancels timer');

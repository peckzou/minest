const {test}=require('node:test');
const assert=require('node:assert/strict');
const vm=require('node:vm');
const fs=require('node:fs');
const source=fs.readFileSync('tools/live-perf/teach_export.js','utf8');
function setup(){
 const board={id:'board',columns:[{id:'a',title:'家庭',cards:[{id:'one',title:'妈妈',en:'mother',pinyin:'mā ma',desc:'母亲',cover:{type:'image',value:'data:image/png;base64,abc'}}]},{id:'empty',title:'hobby',cards:[]}]};
 const assets={one:{category:'家庭',hint:'家人',relatedWords:['爸爸']},other:{hint:'unrelated'}};
 let clicked=false,removed=false,revoked=false,anchor;
 const context={window:{MinestTeachingSets:{read:()=>board},MinestTeachingAssets:{forBoard:()=>assets}},document:{addEventListener(){},body:{appendChild(){}},createElement(){anchor={style:{},click(){clicked=true},remove(){removed=true}};return anchor}},Blob,URL:{createObjectURL(){return 'blob:local'},revokeObjectURL(){revoked=true}},setTimeout(fn){fn()},Date};
 vm.runInNewContext(source,context);
 return {api:context.window.MinestTeachingExport,board,assets,state:()=>({clicked,removed,revoked,anchor})};
}
test('all local lists including empty ones export with materials without modifying data',()=>{
 const x=setup(),before=JSON.stringify([x.board,x.assets]),out=x.api.build();
 assert.equal(out.lists.length,2);assert.equal(out.lists[1].words.length,0);
 assert.equal(out.lists[0].words[0].word,'妈妈');assert.equal(out.lists[0].words[0].category,'家庭');
 assert.equal(out.lists[0].words[0].image,'data:image/png;base64,abc');
 assert.equal(out.backup.assets.other,undefined);assert.equal(JSON.stringify([x.board,x.assets]),before);
 out.backup.wordsets.columns[0].title='changed';assert.equal(x.board.columns[0].title,'家庭');
});
test('single-list export is scoped and unknown IDs fail instead of exporting other data',()=>{
 const x=setup();assert.equal(x.api.build('a').lists.length,1);assert.throws(()=>x.api.build('missing'),/没有找到/);
});
test('download works with no Firebase or account and releases its URL',()=>{
 const x=setup();x.api.download('a');const s=x.state();assert.ok(s.clicked&&s.removed&&s.revoked);assert.match(s.anchor.download,/^Minest-家庭-.*\.json$/);
});
test('production teacher entry points inline the exporter and both buttons',()=>{
 for(const name of ['iphone.html','index.html','iPhoneDuo.html','ipad.html','ios/Minest/Minest/iphone.html']){
 const html=fs.readFileSync(name,'utf8');assert.ok(html.includes('id="minest-teaching-export-v1"'),name);assert.ok(html.includes('↓ 导出全部词表'),name);assert.ok(html.includes("exp.setAttribute('data-teaching-export',c.id)"),name);
 }
});

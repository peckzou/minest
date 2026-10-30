const assert = require('node:assert/strict');
const fs = require('node:fs');
const vm = require('node:vm');
const events = [];
const context = { window: { addEventListener(){}, dispatchEvent(e){events.push(e);} }, CustomEvent: class { constructor(type, init){this.type=type;this.detail=init.detail;} }, Map };
vm.createContext(context);
vm.runInContext(fs.readFileSync(require('node:path').join(__dirname,'../source/image-views.js'),'utf8'), context);
const views = context.window.MinestImageViews;
const board = {id:'a',columns:[{id:'l1',title:'One',cards:[
  {id:1,title:'Zulu',priority:'low',complete:false,labels:['red'],stack:[{id:'child',title:'Beta',priority:'high',labels:['blue'],complete:true}]},
  {id:'2',title:'Alpha',priority:'medium',complete:true,labels:['red']}
]},{id:'l2',cards:[{id:'3',title:'Gamma',complete:false}]}]};
const before = JSON.stringify(board);
assert.equal(views.cards(board,'all','').length,4);
assert.equal(views.cards(board,'l2','')[0].id,'3');
assert.equal(views.cards(board,'all','Beta')[0].parentCardId,1);
assert.equal(views.cards({...board,statusFilter:'completed'},'all','').length,2);
assert.equal(views.cards({...board,activeLabelFilter:'blue'},'all','')[0].id,'child');
assert.equal(views.cards({...board,priorityFilter:'high'},'all','').length,2); // parent retains stack match
assert.equal(views.cards({...board,sortBy:'title'},'l1','')[0].id,'2');
assert.equal(views.cards({...board,sortBy:'priority'},'l1','')[0].id,'2');
views.state('a').priorities.l1='medium';
assert.equal(views.cards(board,'l1','').length,1);
assert.equal(views.cards(board,'missing','').length,0);
views.select('a',1,'photos'); views.select('a',1,'pins');
assert.equal(views.state('a').selected,'1'); assert.equal(events.length,1);
assert.equal(views.state('b').selected,null);
views.state('a').scroll.photos={top:500,cardId:'1'};
assert.equal(views.state('a').scroll.photos.top,500);
const image=views.image({cover:{type:'image',value:'/thumb.webp',originalUrl:'/full.webp'}});
assert.equal(image.thumb,'/thumb.webp'); assert.equal(image.full,'/full.webp');
assert.equal(views.image({cover:{type:'link',value:'https://example.com',originalUrl:'https://example.com'}}).full,'');
assert.equal(views.image({image:{url:'/image.png',thumbnailUrl:'/small.png'}}).thumb,'/small.png');
assert.equal(JSON.stringify(board),before);
views.state('a').priorities = {};
const projection = views.cards(board,'all','',true);
assert.equal(views.albums(board,projection).length,3);
assert.equal(views.albums(board,projection).find(a=>a.kind==='stack').items.length,2);
views.state('a').albums.push({id:'mine',title:'Favorites',cardIds:['child','3','deleted']});
views.state('a').activeAlbum='mine';
assert.equal(views.cards(board,'all','').length,2);
assert.equal(views.cards(board,'l1','').length,1);
assert.equal(views.cards(board,'all','Gamma')[0].id,'3');
assert.equal(views.cards(board,'all','',true).length,4);
assert.equal(views.cards({...board,statusFilter:'completed'},'all','').length,1);
assert.equal(views.state('b').albums.length,0);
assert.equal(JSON.stringify(board),before);
console.log('PASS: 28 state/data assertions (including albums, shared scope, filtering and immutable source data).');

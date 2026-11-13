(function(){
'use strict';
if(window.MinestInteriors)return;
const current=document.currentScript,base=new URL('./',current.src);
const rooms={
 manor:{name:'翡翠庄园大厅',icon:'⌂',note:'双向楼梯 · 二层收藏长廊',page:'rooms/index.html'},
 castle:{name:'古堡珍藏厅',icon:'♜',note:'石柱 · 绯红挂毯 · 二层回廊',page:'rooms/index.html'},
 library:{name:'双层私人图书馆',icon:'▤',note:'深木书架 · 阅览区 · 二层回廊',page:'rooms/index.html'},
 neuschwanstein:{name:'新天鹅堡 · 城堡外景',icon:'🏰',note:'城堡 · 峡谷 · 玛丽恩桥 · 可进入内景',localCollection:false,page:'../neuschwanstein/neuschwanstein.html?cam=30,70,168,86,62,94&mode=fly'},
 'neuschwanstein-throne':{name:'新天鹅堡 · 双层王座厅',icon:'♜',note:'金冠吊灯 · 拱廊 · 上层回廊',localCollection:false,page:'../neuschwanstein/neuschwanstein.html?cam=68.5,54.62,94.5,48,58,94.5&mode=walk'},
 'neuschwanstein-singers':{name:'新天鹅堡 · 歌手大厅',icon:'♜',note:'木格天花 · 壁画 · 皇室房间',localCollection:false,page:'../neuschwanstein/neuschwanstein.html?cam=97.5,61.62,90.5,71,62,90&mode=walk'},
 'kings-hall':{name:'斯科克洛斯特城堡 · 国王大厅',icon:'♛',note:'真实扫描 · 雕花天顶 · 长桌与肖像（CC BY 4.0）',localCollection:false,page:'../interiors-glb/index.html?scene=kings-hall'},
 'victorian-study':{name:'维多利亚书房',icon:'▤',note:'壁炉与金框镜 · 四面书架 · 图书梯 · 织锦地毯',localCollection:false,page:'../interiors-glb/index.html?scene=victorian-study'}
};
let root=null,frame=null,back=null,focus=null;
function close(){
 if(!root)return;const old=root;root=null;frame=null;old.remove();document.documentElement.classList.remove('minest-interior-open');
 if(back&&window.MinestUniverse){try{MinestUniverse.go(back);}catch(e){console.warn('Return to My World',e);}}back=null;
 if(focus&&focus.isConnected)focus.focus();focus=null;
}
function open(id){
 const room=rooms[id];if(!room)return false;if(root)close();focus=document.activeElement;
 // Keep the current island mounted; closing returns without saving or regenerating it.
 back=null;
 root=document.createElement('section');root.className='minest-interior-portal';root.setAttribute('popover','manual');root.setAttribute('role','dialog');root.setAttribute('aria-modal','true');root.setAttribute('aria-label',room.name+' · My World');
 const bar=document.createElement('header'),exit=document.createElement('button'),title=document.createElement('strong'),note=document.createElement('span');
 exit.type='button';exit.textContent=document.querySelector('#mn-sh:not([hidden])')?'‹ 回到房间':'‹ 返回 My World';exit.onclick=close;title.textContent=room.name;note.textContent=room.localCollection===false?'外景与内景 · 自由探索':'自由探索 · 本地收藏';bar.append(exit,title,note);
 frame=document.createElement('iframe');frame.title=room.name+' 3D 内景';frame.allow='fullscreen';frame.setAttribute('allowfullscreen','');
 const url=new URL(room.page,base);url.searchParams.set('embed','1');url.searchParams.set('room',id);frame.src=url.href;
 root.append(bar,frame);document.body.appendChild(root);if(root.showPopover)root.showPopover();document.documentElement.classList.add('minest-interior-open');
 for(const t of ['pointerdown','click','wheel','touchstart'])root.addEventListener(t,e=>e.stopPropagation(),{passive:true});exit.focus();return true;
}
window.addEventListener('message',e=>{if(frame&&e.source===frame.contentWindow&&e.origin===location.origin&&e.data&&e.data.type==='minest-interior-exit')close();});
document.addEventListener('keydown',e=>{if(root&&e.key==='Escape'){e.preventDefault();e.stopImmediatePropagation();close();}},true);
const css=document.createElement('link');css.rel='stylesheet';css.href=new URL('entry.css?v=1',base).href;document.head.appendChild(css);
window.MinestInteriors={open,close,has:id=>Object.prototype.hasOwnProperty.call(rooms,id),isOpen:()=>!!root,kinds:Object.keys(rooms).map(id=>[id,'books','一键进入'+rooms[id].name,rooms[id].note])};
const requested=new URLSearchParams(location.search).get('interior');if(rooms[requested]){if(document.readyState==='loading')document.addEventListener('DOMContentLoaded',()=>open(requested),{once:true});else open(requested);}
})();

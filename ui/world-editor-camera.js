/* Orbit editor over the original Santorini camera; no duplicated scene or content. */
(function(root){
'use strict';
function fitDistance(w,d,h,aspect,fov){var r=Math.hypot(w,d,h)/2,half=Math.min(fov*Math.PI/360,Math.atan(Math.tan(fov*Math.PI/360)*aspect));return Math.max(12,r/Math.sin(half)*1.12);}
if(typeof module==='object'&&module.exports){module.exports={fitDistance:fitDistance};return;}
var daylight=true,active=true,initialized=false,worldRef=null,target={x:0,y:25,z:0},distance=350,yaw=.65,elevation=.8,gesture='rotate',fitted=true,points=new Map(),previous=null,dragged=false,viewHeight=0;
function scene(){return root.__santorini;}
function field(e){return e.target&&/INPUT|TEXTAREA|SELECT/.test(e.target.tagName);}
function ensureContext(){
 var md=root.MinestDisplay;if(!md)return false;
 if(md.isOpen&&md.isOpen()){if(root.__oiaBind)root.__oiaBind();return true;}
 var A=root.MinestAI,boards=A&&A.boards?A.boards():[],current=A&&A.board?A.board():null;
 var chosen=boards.find(function(b){var d=root.MinestKnowledge&&root.MinestKnowledge.get('dsp:'+b.id);return d&&d.terr&&d.terr.scape==='santorini';})||current||boards[0];
 if(!chosen)return false;
 if(root.MinestUniverse)root.MinestUniverse.open({path:[{t:'home'},{t:'world',bid:chosen.id}]});
 md.open({bid:chosen.id});if(root.__oiaBind)root.__oiaBind();if(root.MinestOiaBld&&root.__santorini)root.MinestOiaBld.reapply();return true;
}
function viewport(){
 var cv=document.getElementById('oia-gl'),r=cv.getBoundingClientRect(),c=document.getElementById('oia-console');
 var vh=c&&!c.hidden?Math.max(180,c.getBoundingClientRect().top-r.top):r.height;
 return {width:r.width,height:r.height,visibleHeight:vh,aspect:r.width/vh};
}
function fit(top){
 var s=scene();if(!s)return;
 target.x=s.world.W/2;target.z=s.world.D/2;target.y=30;
 elevation=top?1.48:.78;yaw=.65;active=true;fitted=true;var v=viewport();
 distance=fitDistance(s.world.W,s.world.D,65,v.aspect,50);viewHeight=v.visibleHeight;publish();
}
function publish(){
 var el=document.getElementById('oia-camera-summary');if(el && el.textContent!== (active?'编辑视角':'步行探索')+' · '+Math.round(distance)+' m · '+(gesture==='pan'?'拖动平移':'拖动旋转'))el.textContent=(active?'编辑视角':'步行探索')+' · '+Math.round(distance)+' m · '+(gesture==='pan'?'拖动平移':'拖动旋转');
 var r=document.getElementById('oia-camera-distance');if(r)r.value=String(Math.round(distance));
 var selected=root.MinestOiaBld&&root.MinestOiaBld.selected(),g=scene(),b=g&&g.world.buildings.find(function(b){return b.id===selected;}),n=document.getElementById('oia-selection');if(n&&n.textContent!==(b?'已选中：'+(b.name||b.id):'轻点画面中的建筑以选中'))n.textContent=b?'已选中：'+(b.name||b.id):'轻点画面中的建筑以选中';
 var p=document.getElementById('oia-camera-gesture');if(p&&p.textContent!==(gesture==='pan'?'当前：平移':'当前：旋转'))p.textContent=gesture==='pan'?'当前：平移':'当前：旋转';
}
function zoom(factor){active=true;fitted=false;distance=Math.max(12,Math.min(3500,distance*factor));publish();}
function pan(dx,dy){
 var v=viewport(),scale=2*distance*Math.tan(25*Math.PI/180)/v.visibleHeight;
 target.x+=(-Math.cos(yaw)*dx+Math.sin(yaw)*dy)*scale;
 target.z+=(Math.sin(yaw)*dx+Math.cos(yaw)*dy)*scale;
 fitted=false;
}
function pickBuilding(x,y){
 var s=scene(),T=root.THREE;if(!s||!T)return null;
 var r=document.getElementById('oia-gl').getBoundingClientRect(),ray=new T.Raycaster();s.camera.updateMatrixWorld(true);
 ray.setFromCamera(new T.Vector2((x-r.left)/r.width*2-1,1-(y-r.top)/r.height*2),s.camera);
 var best=null,dist=Infinity,p=new T.Vector3();
 s.world.buildings.forEach(function(b){
  var maxY=b.y+(b.floors||2)*4+6;
  var box=new T.Box3(new T.Vector3(b.x0,b.y,b.z0),new T.Vector3(b.x1+1,maxY,b.z1+1));
  if(ray.ray.intersectBox(box,p)){var d=p.distanceTo(s.camera.position);if(d<dist){best=b;dist=d;}}
 });
 return best;
}
function focus(){
 var s=scene(),api=root.MinestOiaBld,id=api&&api.selected(),b=s&&s.world.buildings.find(function(b){return b.id===id;});
 if(!b){var el=document.getElementById('oia-camera-summary');if(el)el.textContent='先在画面中轻点一栋建筑，再聚焦';return;}
 target.x=(b.x0+b.x1+1)/2;target.z=(b.z0+b.z1+1)/2;target.y=b.y+(b.floors||2)*2;
 distance=fitDistance(b.x1-b.x0+5,b.z1-b.z0+5,(b.floors||2)*4+8,viewport().aspect,50);
 elevation=.7;active=true;fitted=false;publish();
}
function walk(){
 active=false;points.clear();previous=null;
 var s=scene();if(s){s.camera.clearViewOffset();s.camera.far=3000;s.camera.fov=72;s.camera.updateProjectionMatrix();s.setMode('walk',true);}
 publish();
}
function frame(){
 var s=scene();if(!s)return false;
 if(!initialized||worldRef!==s.world){initialized=true;worldRef=s.world;ensureContext();fit(false);}
 var host=document.getElementById('oia-root');host.classList.toggle('oia-edit-camera',active);
 if(!active)return false;
 var v=viewport();if(fitted&&Math.abs(viewHeight-v.visibleHeight)>2){distance=fitDistance(s.world.W,s.world.D,65,v.aspect,50);viewHeight=v.visibleHeight;}
 var h=distance*Math.cos(elevation);
 s.camera.position.set(target.x+Math.sin(yaw)*h,target.y+Math.sin(elevation)*distance,target.z+Math.cos(yaw)*h);
 s.camera.fov=50;s.camera.far=6000;
 s.camera.setViewOffset(v.width,v.visibleHeight,0,0,v.width,v.height);
 s.camera.lookAt(target.x,target.y,target.z);s.camera.updateMatrixWorld(true);
 var label=document.getElementById('oia-modeLabel');if(label)label.textContent='全局编辑 · 可缩放、旋转、平移';
 publish();return true;
}
root.MinestOiaEditor={get daylight(){return daylight;},get active(){return active;},get target(){return target;},get distance(){return distance;},frame:frame,fit:fit,focus:focus,walk:walk,zoom:zoom,pickBuilding:pickBuilding,ensureContext:ensureContext};
function onCanvas(e){return e.target&&e.target.id==='oia-gl'&&root.__oiaOn;}
function pair(){
 var a=Array.from(points.values());
 if(a.length===1)return {x:a[0].x,y:a[0].y};
 var p=a[0],q=a[1];return {x:(p.x+q.x)/2,y:(p.y+q.y)/2,length:Math.hypot(p.x-q.x,p.y-q.y)};
}
document.addEventListener('pointerdown',function(e){
 if(!active||!onCanvas(e))return;e.preventDefault();e.stopImmediatePropagation();
 if(document.pointerLockElement)document.exitPointerLock();
 e.target.setPointerCapture(e.pointerId);points.set(e.pointerId,{x:e.clientX,y:e.clientY});previous=pair();dragged=false;
},{capture:true,passive:false});
document.addEventListener('pointermove',function(e){
 if(!active||!points.has(e.pointerId))return;e.preventDefault();e.stopImmediatePropagation();
 points.set(e.pointerId,{x:e.clientX,y:e.clientY});var now=pair();if(!previous){previous=now;return;}
 var dx=now.x-previous.x,dy=now.y-previous.y;if(Math.hypot(dx,dy)>2)dragged=true;
 if(now.length&&previous.length){zoom(previous.length/Math.max(1,now.length));pan(dx,dy);dragged=true;}
 else if(gesture==='pan'||e.shiftKey||e.buttons===2)pan(dx,dy);
 else{yaw-=dx*.006;elevation=Math.max(.2,Math.min(1.49,elevation+dy*.005));fitted=false;}
 previous=now;publish();
},{capture:true,passive:false});
document.addEventListener('pointerup',function(e){
 if(!points.has(e.pointerId))return;e.preventDefault();e.stopImmediatePropagation();
 var tap=points.size===1&&!dragged;points.delete(e.pointerId);previous=points.size?pair():null;
 if(tap&&root.MinestOiaClick)root.MinestOiaClick(e.clientX,e.clientY);
},{capture:true,passive:false});
document.addEventListener('pointercancel',function(e){points.delete(e.pointerId);previous=points.size?pair():null;},true);
window.addEventListener('blur',function(){points.clear();previous=null;});
['mousedown','mouseup','touchstart','touchmove','touchend','dblclick','contextmenu'].forEach(function(type){
 document.addEventListener(type,function(e){if(active&&onCanvas(e)){e.preventDefault();e.stopImmediatePropagation();}},{capture:true,passive:false});
});
document.addEventListener('wheel',function(e){if(active&&onCanvas(e)){e.preventDefault();e.stopImmediatePropagation();zoom(Math.exp(e.deltaY*.0015));}},{capture:true,passive:false});
document.addEventListener('click',function(e){
 if(active&&e.target.id==='oia-mm'){e.preventDefault();e.stopImmediatePropagation();var s=scene(),r=e.target.getBoundingClientRect();target.x=(e.clientX-r.left)/r.width*s.world.W;target.z=(e.clientY-r.top)/r.height*s.world.D;fitted=false;}
 var b=e.target.closest('[data-camera]');if(!b)return;
 var a=b.getAttribute('data-camera');
 if(a==='fit')fit(false);if(a==='top')fit(true);if(a==='focus')focus();if(a==='in')zoom(.8);if(a==='out')zoom(1.25);if(a==='walk')walk();
 if(a==='light'){daylight=!daylight;b.textContent=daylight?'编辑照明：明亮':'编辑照明：真实时间';}
 if(a==='gesture'){gesture=gesture==='pan'?'rotate':'pan';publish();}
},true);
document.addEventListener('input',function(e){if(e.target.id==='oia-camera-distance'){distance=+e.target.value;active=true;fitted=false;publish();}});
})(typeof window==='object'?window:globalThis);

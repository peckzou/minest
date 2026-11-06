/* Adapts the existing camera/player; preserves all terrain and architecture. */
(function () {
'use strict';
var panel=document.getElementById('mn-hb-console'),menu=document.getElementById('mn-hb-menu');
var drag=null,radius=135,yaw=.7,pitch=.48,focus=null,saved=null,pinch=null;
function game(){return window.__game;}
function status(t){document.getElementById('mn-hb-status').textContent=t;}
function keysOff(){['KeyW','KeyA','KeyS','KeyD','Space','ShiftLeft'].forEach(function(code){dispatchEvent(new KeyboardEvent('keyup',{code:code}));});}
function ready(){var g=game();if(!g)status('世界加载中…');return g;}
function panorama(){
var g=ready();if(!g)return;
if(!window.__hobbitonPanorama)saved={pos:g.player.pos.clone(),rotation:g.camera.quaternion.clone(),fly:g.player.fly};
window.__hobbitonActive=true;window.__hobbitonPanorama=true;keysOff();
document.getElementById('overlay').classList.add('hidden');
if(document.pointerLockElement)document.exitPointerLock();
var p=g.info.pois.find(function(p){return p.fly;})||g.info.spawn;
focus={x:p.look[0],y:p.look[1],z:p.look[2]};
var dx=p.pos[0]-focus.x,dz=p.pos[2]-focus.z,dy=p.pos[1]-focus.y;
radius=Math.max(75,Math.hypot(dx,dz,dy));yaw=Math.atan2(dx,dz);pitch=Math.max(.25,Math.atan2(dy,Math.hypot(dx,dz)));
status('全景 · 拖动旋转 · 双指或滚轮缩放');panel.hidden=true;menu.setAttribute('aria-expanded','false');
}
function walk(fly){
var g=ready();if(!g)return;keysOff();
if(window.__hobbitonPanorama&&saved){g.player.pos.copy(saved.pos);g.player.vel.set(0,0,0);g.camera.position.set(saved.pos.x,saved.pos.y+1.62,saved.pos.z);g.camera.quaternion.copy(saved.rotation);}
window.__hobbitonPanorama=false;window.__hobbitonActive=true;g.player.fly=!!fly;
document.getElementById('overlay').classList.add('hidden');status(fly?'飞行 · 拖动转头 · 方向键移动':'步行 · 拖动转头 · 方向键移动');panel.hidden=true;menu.setAttribute('aria-expanded','false');
}
window.MinestHobbitonNavigation={frame:function(){
var g=game();if(!g||!window.__hobbitonPanorama||!focus)return;
var r=radius*Math.cos(pitch);
g.camera.position.set(focus.x+Math.sin(yaw)*r,focus.y+Math.sin(pitch)*radius,focus.z+Math.cos(yaw)*r);g.camera.lookAt(focus.x,focus.y,focus.z);
}};
menu.onclick=function(){panel.hidden=!panel.hidden;menu.setAttribute('aria-expanded',String(!panel.hidden));};
panel.addEventListener('click',function(e){
var b=e.target.closest('[data-hb]');if(!b)return;var act=b.getAttribute('data-hb');
if(act==='panorama')return panorama();if(act==='walk')return walk(false);if(act==='fly')return walk(true);
if(act==='close'){panel.hidden=true;menu.setAttribute('aria-expanded','false');return;}
if(act==='back')return document.getElementById('mn-hb-back-myworld').click();
if(!ready())return;
if(act==='poi')walk(false);
var code=act==='door'?'KeyE':'KeyG';dispatchEvent(new KeyboardEvent('keydown',{code:code}));dispatchEvent(new KeyboardEvent('keyup',{code:code}));
});
document.getElementById('mn-hb-panorama-start').onclick=panorama;
function canvasTarget(e){return e.target.tagName==='CANVAS'&&!e.target.closest('#hud');}
document.addEventListener('pointerdown',function(e){
if(!canvasTarget(e)||!ready()||e.button>0)return;
drag={id:e.pointerId,x:e.clientX,y:e.clientY};e.target.setPointerCapture(e.pointerId);e.preventDefault();
});
document.addEventListener('pointermove',function(e){
if(!drag||drag.id!==e.pointerId)return;
var dx=e.clientX-drag.x,dy=e.clientY-drag.y;drag.x=e.clientX;drag.y=e.clientY;
if(window.__hobbitonPanorama){yaw-=dx*.006;pitch=Math.max(.08,Math.min(1.4,pitch+dy*.005));}
else if(!document.pointerLockElement){var camera=game().camera;camera.rotation.reorder('YXZ');camera.rotation.y-=dx*.004;camera.rotation.x=Math.max(-1.4,Math.min(1.4,camera.rotation.x-dy*.004));}
});
function release(){drag=null;keysOff();}
document.addEventListener('pointerup',function(e){if(drag&&drag.id===e.pointerId)drag=null;});
document.addEventListener('pointercancel',release);window.addEventListener('blur',release);
document.addEventListener('visibilitychange',function(){if(document.hidden)release();});
document.addEventListener('wheel',function(e){if(window.__hobbitonPanorama&&canvasTarget(e)){radius=Math.max(45,Math.min(260,radius*Math.exp(e.deltaY*.001)));e.preventDefault();}},{passive:false});
document.addEventListener('touchstart',function(e){if(canvasTarget(e)&&e.touches.length===2){pinch=Math.hypot(e.touches[0].clientX-e.touches[1].clientX,e.touches[0].clientY-e.touches[1].clientY);drag=null;}},{passive:true});
document.addEventListener('touchmove',function(e){if(window.__hobbitonPanorama&&pinch&&e.touches.length===2){var d=Math.hypot(e.touches[0].clientX-e.touches[1].clientX,e.touches[0].clientY-e.touches[1].clientY);radius=Math.max(45,Math.min(260,radius*pinch/Math.max(1,d)));pinch=d;e.preventDefault();}},{passive:false});
document.addEventListener('touchend',function(){pinch=null;},{passive:true});
document.querySelectorAll('[data-hb-move]').forEach(function(b){
var key=b.getAttribute('data-hb-move'),held=false;
b.addEventListener('pointerdown',function(e){if(window.__hobbitonPanorama)walk(false);if(!ready())return;e.preventDefault();held=true;b.setPointerCapture(e.pointerId);dispatchEvent(new KeyboardEvent('keydown',{code:key}));});
function up(){if(!held)return;held=false;dispatchEvent(new KeyboardEvent('keyup',{code:key}));}
b.addEventListener('pointerup',up);b.addEventListener('pointercancel',up);b.addEventListener('lostpointercapture',up);window.addEventListener('blur',up);
});
if(parent!==window)document.getElementById('mn-hb-back-myworld').hidden=true;
})();

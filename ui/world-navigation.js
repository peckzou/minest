/* One console controller; the original engines retain movement and collisions. */
(function (root) {
'use strict';
function inputLatch(write) {
 var held = new Map();
 function flush() { var next = {}; held.forEach(function (a) { next[a] = true; }); write(next); }
 return {
  press: function (id, action) { held.set(id, action); flush(); },
  release: function (id) { if(!held.has(id))return;held.delete(id);flush(); },
  clear: function () { held.clear(); flush(); }
 };
}
function joystickVector(x,y,radius){var length=Math.hypot(x,y);if(length<radius*.12)return {x:0,y:0};var scale=Math.max(radius,length);return {x:x/scale,y:-y/scale};}
if (typeof module === 'object' && module.exports) { module.exports = { inputLatch: inputLatch, joystickVector:joystickVector }; return; }
var pendingOiaWalk = false, voxelPane = false, fast = false, current = '', lastMode = '', heldProvider = null;
var sticks=new Map(),held={},axes={};
function provider(id) {
 if (id === 'voxel') {
  var v = root.MinestVoxel62;
  if (!v || !v.isOpen() || !v.controls) return null;
  return { controls: v.controls, mode: function () { return v.mode(); }, setMode: function (m) { v.mode(m === 'edit' ? 'view' : m); }, position: v.player };
 }
 var s = root.__santorini, editor = root.MinestOiaEditor;
 if (!root.__oiaOn || !s || !s.controls || !editor) return null;
 return { controls: s.controls, mode: function () { return editor.active ? 'view' : s.S.mode; }, setMode: function (m) { editor.explore(m); }, position: function () { return s.player.pos; } };
}
function sendInput(){var p=heldProvider;if(!p)return;var next=Object.assign({},held,axes),moving=Object.keys(next).some(function(k){return !!next[k];});next.fast=fast;p.controls.input(next);if(!moving)p.controls.stop();}
var latch = inputLatch(function (next) {held=next;sendInput();});
function stop() {
 sticks.clear();axes={};
 latch.clear();
 if (heldProvider) heldProvider.controls.stop();
 heldProvider = null; fast = false;
 document.querySelectorAll('[data-nav-hold], [data-nav-fast]').forEach(function (b) { b.classList.remove('on'); b.setAttribute('aria-pressed', 'false'); });
 document.querySelectorAll('[data-nav-stick]').forEach(function(el){el.classList.remove('on');el.querySelector('i').style.transform='';el.setAttribute('aria-label',el.dataset.navStick==='move'?'移动摇杆，已居中':'视线摇杆，已居中');});
}
function button(action, label) { return '<button type="button" data-nav-hold="' + action + '" aria-label="' + label + '">' + label + '</button>'; }
function markup(id) {
 return '<section class="world-navigation" data-nav-provider="' + id + '" aria-label="Walk in 操作面板">' +
  '<header class="nav-heading"><h3>🚶 Walk in</h3>'+(id==='voxel'?'<button data-nav-exit aria-label="退出 Walk in">取消 ×</button>':'')+'</header><p data-nav-status role="status"></p>' +
  '<div class="nav-modes"><button data-nav-mode="walk">🚶 步行</button><button data-nav-mode="fly">✈️ 飞行</button><button data-nav-mode="edit">🌐 全局视角</button></div>' +
  '<div class="nav-dashboard"><div class="nav-stick-group"><span>移动</span><div data-nav-stick="move" role="group" tabindex="0" aria-label="移动摇杆，已居中"><b>↑</b><i></i></div></div>'+
  '<div class="nav-stick-group"><span>视线</span><div data-nav-stick="look" role="group" tabindex="0" aria-label="视线摇杆，已居中"><b>↔</b><i></i></div></div></div>'+
  '<div class="nav-altitude">' + button('up','↑ 上升 / 跳跃') + button('down','↓ 下降') + '<button data-nav-fast aria-pressed="false">加速：关</button><button data-nav-stop aria-label="停止移动">■ 停止</button></div>' +
  '<p class="nav-help">拖动摇杆，松手回中 · 再点已选模式可退出</p>' +
  '<details class="nav-extra"><summary>方向键与视角微调</summary><div class="nav-camera">'+button('forward','↑ 前进')+button('left','← 左移')+button('right','右移 →')+button('back','↓ 后退')+button('lookUp','↑ 抬头')+button('lookLeft','← 左转')+button('lookRight','右转 →')+button('lookDown','↓ 低头')+'<button data-nav-level>平视</button></div>'+
  (id === 'oia' ? '<div class="nav-camera"><button data-camera="fit">看全世界</button><button data-camera="top">俯视</button><button data-camera="out">− 缩小</button><button data-camera="in">＋ 放大</button></div>' : '') + '</details></section>';
}
function exitProvider(id){stop();if(id==='voxel'){voxelPane=false;var p=provider(id);if(p)p.setMode('edit');render();}else if(root.MinestOiaConsole)root.MinestOiaConsole.cancel();}
function modeFor(e) { var host = e.target.closest('[data-nav-provider]'); return host && host.getAttribute('data-nav-provider'); }
function render() {
if(pendingOiaWalk&&root.__oiaOn&&root.MinestOiaEditor&&root.MinestOiaEditor.ready&&root.MinestOiaConsole){pendingOiaWalk=false;root.MinestOiaConsole.open('walk');root.MinestOiaEditor.explore('walk');}

 var v = root.MinestVoxel62, on = !!(v && v.isOpen()), center = document.querySelector('.wf .wf-center'), ov = document.getElementById('vx62');
 if (ov) ov.classList.toggle('navigation-integrated', on && !!v.controls);
 if (!on) voxelPane = false;
 if (center) {
  if (on && voxelPane && !center.querySelector('[data-nav-provider="voxel"]')) center.insertAdjacentHTML('beforeend', markup('voxel'));
  center.classList.toggle('world-navigation-open', on && voxelPane);
 }
 document.querySelectorAll('.wf [data-wfhud="[data-fpv]"]').forEach(function(b){if(on){b.dataset.navIntegrated='true';b.classList.toggle('on',voxelPane);b.setAttribute('aria-pressed',String(voxelPane));}else if(b.dataset.navIntegrated){delete b.dataset.navIntegrated;b.classList.remove('on');b.setAttribute('aria-pressed','false');}});
 var id = on && voxelPane ? 'voxel' : root.__oiaOn ? 'oia' : '', p = provider(id);
 var mode = p ? p.mode() : '';
 if (current !== id || lastMode !== mode) { stop(); current = id; lastMode = mode; }
 document.querySelectorAll('[data-nav-provider]').forEach(function (host) {
  var p = provider(host.getAttribute('data-nav-provider')); if (!p) return;
  var m = p.mode(), pos = p.position(), text = ({ walk:'步行', fly:'飞行', view:'全局视角', tour:'导览' }[m] || m) + ' · XYZ ' + pos.x.toFixed(1) + ' / ' + pos.y.toFixed(1) + ' / ' + pos.z.toFixed(1);
  var label = host.querySelector('[data-nav-status]'); if (label.textContent !== text) label.textContent = text;
  host.querySelectorAll('[data-nav-mode]').forEach(function (b) { var active = b.dataset.navMode === (m === 'view' ? 'edit' : m); b.classList.toggle('on', active); b.setAttribute('aria-pressed', String(active)); });
  host.querySelectorAll('[data-nav-hold],[data-nav-fast],[data-nav-level]').forEach(function (b) { b.disabled = m !== 'walk' && m !== 'fly'; });
  var upButton=host.querySelector('[data-nav-hold="up"]'),upText=m==='fly'?'↑ 上升':'↑ 跳跃';if(upButton.textContent!==upText)upButton.textContent=upText;
  host.querySelectorAll('[data-nav-stick]').forEach(function(el){el.setAttribute('aria-disabled',String(m!=='walk'&&m!=='fly'));});
  var fastButton = host.querySelector('[data-nav-fast]'), textFast = fast && current === host.dataset.navProvider ? '加速：开' : '加速：关'; if (fastButton.textContent !== textFast) fastButton.textContent = textFast;fastButton.classList.toggle('on',fast&&current===host.dataset.navProvider);fastButton.setAttribute('aria-pressed',String(fast&&current===host.dataset.navProvider));
 });
 // If a console is closed or another tool replaces this pane, release every held action.
 if (heldProvider) {
  var visible = Array.from(document.querySelectorAll('[data-nav-provider="' + current + '"]')).some(function (h) { return h.getClientRects().length && !h.closest('[hidden]') && (current !== 'voxel' || voxelPane); });
  if (!visible) stop();
 }
}
document.addEventListener('click', function (e) {
 var original = e.target.closest('[data-wfhud="[data-fpv]"]'), v = root.MinestVoxel62;
 if (original && v && v.isOpen()) { e.preventDefault(); e.stopImmediatePropagation();if(voxelPane){exitProvider('voxel');return;}stop();voxelPane=true;if(v.mode()==='view')v.mode('walk');render();return; }
 if(original){var md=root.MinestDisplay,ctx=md&&md.integration&&md.integration.context();if(ctx&&ctx.world==='santorini'&&!ctx.roomId&&root.MinestOia){e.preventDefault();e.stopImmediatePropagation();pendingOiaWalk=true;root.MinestOia.open();return;}}
 if (e.target.closest('.wf button') && !e.target.closest('[data-nav-provider]')) { if(voxelPane)exitProvider('voxel'); }
 var id = modeFor(e), p = id && provider(id); if (!p) return;
 var b = e.target.closest('button'); if (!b) return;
 if (b.hasAttribute('data-nav-exit')) {exitProvider(id);return;}
 if (b.hasAttribute('data-nav-mode')) {var next=b.dataset.navMode;if(next===(p.mode()==='view'?'edit':p.mode())){exitProvider(id);return;}stop();p.setMode(next);lastMode=p.mode();render();}
 if (b.hasAttribute('data-nav-stop')) stop();
 if (b.hasAttribute('data-nav-fast')) { heldProvider = p; current = id; fast = !fast; latch.release('fast-toggle'); render(); }
 if (b.hasAttribute('data-nav-level')) { var pos = id === 'voxel' ? root.MinestVoxel62.player() : root.__santorini.player; pos.pitch = 0; }
}, true);
function press(e, token) {
 var b = e.target.closest('[data-nav-hold]'); if (!b || b.disabled) return;
 var id = modeFor(e), p = provider(id); if (!p || (p.mode() !== 'walk' && p.mode() !== 'fly')) return;
 e.preventDefault(); e.stopPropagation(); heldProvider = p; current = id; lastMode = p.mode(); latch.press(token, b.dataset.navHold); b.classList.add('on'); b.setAttribute('aria-pressed','true');
}
function updateSticks(){axes={};sticks.forEach(function(s){var x=s.vector.x,y=s.vector.y;if(s.kind==='move'){axes.moveX=x;axes.moveY=y;}else{axes.lookX=x;axes.lookY=y;}});sendInput();}
function moveStick(e){var s=sticks.get(e.pointerId);if(!s)return;e.preventDefault();e.stopPropagation();var r=s.el.getBoundingClientRect(),radius=Math.min(r.width,r.height)*.34;s.vector=joystickVector(e.clientX-r.left-r.width/2,e.clientY-r.top-r.height/2,radius);s.el.querySelector('i').style.transform='translate('+s.vector.x*radius+'px,'+-s.vector.y*radius+'px)';s.el.setAttribute('aria-label',(s.kind==='move'?'移动摇杆':'视线摇杆')+'，横向 '+Math.round(s.vector.x*100)+'%，纵向 '+Math.round(s.vector.y*100)+'%');updateSticks();}
document.addEventListener('pointerdown',function(e){var el=e.target.closest('[data-nav-stick]');if(!el||el.getAttribute('aria-disabled')==='true')return;var id=modeFor(e),p=provider(id);if(!p)return;e.preventDefault();e.stopPropagation();heldProvider=p;current=id;lastMode=p.mode();el.classList.add('on');sticks.set(e.pointerId,{el:el,kind:el.dataset.navStick,vector:{x:0,y:0}});el.setPointerCapture(e.pointerId);moveStick(e);},true);
document.addEventListener('pointermove',moveStick,{capture:true,passive:false});
document.addEventListener('pointerdown', function (e) { var b = e.target.closest('[data-nav-hold]'); if (!b || b.disabled) return; press(e, 'p' + e.pointerId); b.setPointerCapture(e.pointerId); }, true);
function release(e) {var s=sticks.get(e.pointerId);if(s){sticks.delete(e.pointerId);s.el.classList.remove('on');s.el.querySelector('i').style.transform='';s.el.setAttribute('aria-label',s.kind==='move'?'移动摇杆，已居中':'视线摇杆，已居中');updateSticks();} latch.release('p' + e.pointerId); var b = e.target.closest('[data-nav-hold]'); if (b) { b.classList.remove('on'); b.setAttribute('aria-pressed','false'); } }
document.addEventListener('pointerup', release, true); document.addEventListener('pointercancel', release, true); document.addEventListener('lostpointercapture', release, true);
document.addEventListener('keydown', function (e) {var stick=e.target.closest('[data-nav-stick]');if(stick&&/^Arrow/.test(e.code)){e.preventDefault();e.stopImmediatePropagation();if(stick.getAttribute('aria-disabled')==='true')return;var id=modeFor(e),p=provider(id);if(!p)return;heldProvider=p;current=id;var action=(stick.dataset.navStick==='move'?{ArrowUp:'forward',ArrowDown:'back',ArrowLeft:'left',ArrowRight:'right'}:{ArrowUp:'lookUp',ArrowDown:'lookDown',ArrowLeft:'lookLeft',ArrowRight:'lookRight'})[e.code];latch.press('k'+e.code,action);return;}if(e.repeat)return;if ((e.code === 'Space' || e.code === 'Enter') && e.target.matches('[data-nav-hold]')) { e.stopImmediatePropagation(); press(e, 'k' + e.code); } }, true);
document.addEventListener('keyup', function (e) { if (/^(Space|Enter|ArrowUp|ArrowDown|ArrowLeft|ArrowRight)$/.test(e.code)) { latch.release('k' + e.code); if(e.target.matches('[data-nav-hold],[data-nav-stick]')){e.preventDefault();e.stopImmediatePropagation();e.target.classList.remove('on');} } }, true);
window.addEventListener('blur', stop); document.addEventListener('visibilitychange', function () { if (document.hidden) stop(); });
root.MinestWorldNavigation = { markup: markup, stop: stop, render: render };
setInterval(render, 150);
})(typeof window === 'object' ? window : globalThis);

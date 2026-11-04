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
if (typeof module === 'object' && module.exports) { module.exports = { inputLatch: inputLatch }; return; }
var pendingOiaWalk = false, voxelPane = false, fast = false, current = '', lastMode = '', heldProvider = null;
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
var latch = inputLatch(function (next) { var p = heldProvider; if (p) { var moving=Object.keys(next).length>0; next.fast = fast; p.controls.input(next); if(!moving)p.controls.stop(); } });
function stop() {
 latch.clear();
 if (heldProvider) heldProvider.controls.stop();
 heldProvider = null; fast = false;
 document.querySelectorAll('[data-nav-hold], [data-nav-fast]').forEach(function (b) { b.classList.remove('on'); b.setAttribute('aria-pressed', 'false'); });
}
function button(action, label) { return '<button type="button" data-nav-hold="' + action + '" aria-label="' + label + '">' + label + '</button>'; }
function markup(id) {
 return '<section class="world-navigation" data-nav-provider="' + id + '" aria-label="Walk in 操作面板">' +
  '<h3>🚶 Walk in · 探索与视角</h3><p data-nav-status role="status"></p>' +
  '<div class="nav-modes"><button data-nav-mode="walk">🚶 步行</button><button data-nav-mode="fly">✈️ 飞行</button><button data-nav-mode="edit">🌐 全局视角</button></div>' +
  '<p class="nav-help">长按移动或转头，松手即停。步行保留原有碰撞与跳跃。</p>' +
  '<div class="nav-pads"><div><h4>移动</h4><div class="nav-pad">' + button('forward','↑ 前进') + button('left','← 左移') + '<button data-nav-stop aria-label="停止移动">■ 停止</button>' + button('right','右移 →') + button('back','↓ 后退') + '</div></div>' +
  '<div><h4>视线</h4><div class="nav-pad">' + button('lookUp','↑ 抬头') + button('lookLeft','← 左转') + '<button data-nav-level>平视</button>' + button('lookRight','右转 →') + button('lookDown','↓ 低头') + '</div></div></div>' +
  '<div class="nav-altitude">' + button('up','↑ 跳跃 / 上升') + button('down','↓ 下降') + '<button data-nav-fast aria-pressed="false">加速：关</button></div>' +
  '<p class="nav-help">键盘 WASD 移动 · F 切换飞行 · 画面拖动转头</p>' +
  (id === 'oia' ? '<div class="nav-camera"><button data-camera="fit">看全世界</button><button data-camera="top">正上方俯视</button><button data-camera="focus">聚焦选中建筑</button><button data-camera="out">− 缩小</button><button data-camera="in">＋ 放大</button></div>' : '<p class="nav-help">全局视角中拖动画面旋转，滚轮或双指缩放。</p>') + '</section>';
}
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
 var id = on && voxelPane ? 'voxel' : root.__oiaOn ? 'oia' : '', p = provider(id);
 var mode = p ? p.mode() : '';
 if (current !== id || lastMode !== mode) { stop(); current = id; lastMode = mode; }
 document.querySelectorAll('[data-nav-provider]').forEach(function (host) {
  var p = provider(host.getAttribute('data-nav-provider')); if (!p) return;
  var m = p.mode(), pos = p.position(), text = ({ walk:'步行', fly:'飞行', view:'全局视角', tour:'导览' }[m] || m) + ' · XYZ ' + pos.x.toFixed(1) + ' / ' + pos.y.toFixed(1) + ' / ' + pos.z.toFixed(1);
  var label = host.querySelector('[data-nav-status]'); if (label.textContent !== text) label.textContent = text;
  host.querySelectorAll('[data-nav-mode]').forEach(function (b) { var active = b.dataset.navMode === (m === 'view' ? 'edit' : m); b.classList.toggle('on', active); b.setAttribute('aria-pressed', String(active)); });
  host.querySelectorAll('[data-nav-hold],[data-nav-fast],[data-nav-level]').forEach(function (b) { b.disabled = m !== 'walk' && m !== 'fly'; });
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
 if (original && v && v.isOpen()) { e.preventDefault(); e.stopImmediatePropagation(); stop();voxelPane=true;if(v.mode()==='view')v.mode('walk');render();return; }
 if(original){var md=root.MinestDisplay,ctx=md&&md.integration&&md.integration.context();if(ctx&&ctx.world==='santorini'&&!ctx.roomId&&root.MinestOia){e.preventDefault();e.stopImmediatePropagation();pendingOiaWalk=true;root.MinestOia.open();return;}}
 if (e.target.closest('.wf button') && !e.target.closest('[data-nav-provider]')) { if (voxelPane) { stop(); voxelPane = false; render(); } }
 var id = modeFor(e), p = id && provider(id); if (!p) return;
 var b = e.target.closest('button'); if (!b) return;
 if (b.hasAttribute('data-nav-mode')) { stop(); p.setMode(b.dataset.navMode); lastMode = p.mode(); render(); }
 if (b.hasAttribute('data-nav-stop')) stop();
 if (b.hasAttribute('data-nav-fast')) { heldProvider = p; current = id; fast = !fast; latch.release('fast-toggle'); render(); }
 if (b.hasAttribute('data-nav-level')) { var pos = id === 'voxel' ? root.MinestVoxel62.player() : root.__santorini.player; pos.pitch = 0; }
}, true);
function press(e, token) {
 var b = e.target.closest('[data-nav-hold]'); if (!b || b.disabled) return;
 var id = modeFor(e), p = provider(id); if (!p || (p.mode() !== 'walk' && p.mode() !== 'fly')) return;
 e.preventDefault(); e.stopPropagation(); heldProvider = p; current = id; lastMode = p.mode(); latch.press(token, b.dataset.navHold); b.classList.add('on'); b.setAttribute('aria-pressed','true');
}
document.addEventListener('pointerdown', function (e) { var b = e.target.closest('[data-nav-hold]'); if (!b || b.disabled) return; press(e, 'p' + e.pointerId); b.setPointerCapture(e.pointerId); }, true);
function release(e) { latch.release('p' + e.pointerId); var b = e.target.closest('[data-nav-hold]'); if (b) { b.classList.remove('on'); b.setAttribute('aria-pressed','false'); } }
document.addEventListener('pointerup', release, true); document.addEventListener('pointercancel', release, true); document.addEventListener('lostpointercapture', release, true);
document.addEventListener('keydown', function (e) { if (e.repeat) return; if ((e.code === 'Space' || e.code === 'Enter') && e.target.matches('[data-nav-hold]')) { e.stopImmediatePropagation(); press(e, 'k' + e.code); } }, true);
document.addEventListener('keyup', function (e) { if (e.code === 'Space' || e.code === 'Enter') { latch.release('k' + e.code); if(e.target.matches('[data-nav-hold]')){e.preventDefault();e.stopImmediatePropagation();e.target.classList.remove('on');} } }, true);
window.addEventListener('blur', stop); document.addEventListener('visibilitychange', function () { if (document.hidden) stop(); });
root.MinestWorldNavigation = { markup: markup, stop: stop, render: render };
setInterval(render, 150);
})(typeof window === 'object' ? window : globalThis);

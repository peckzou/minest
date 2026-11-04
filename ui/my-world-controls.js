/* Console adapter: all content edits use the original My World data and history. */
(function(){
'use strict';
function status(text){var e=document.getElementById('oia-operation-status');if(e)e.textContent=text;}
function voxel(){
 var editor=window.MinestOiaEditor;if(editor)editor.ensureContext();
 if(window.MinestOia)MinestOia.close();
 if(window.MinestVoxel62){Promise.resolve(MinestVoxel62.open({forceVoxel:true})).catch(function(e){status('体素空间未能打开：'+e.message);if(window.MinestOia)MinestOia.open();});}
}
function chooseWorld(){
 var host=document.getElementById('oia-root');if(!host||host.querySelector('#oia-world-picker'))return;
 var picker=document.createElement('section');picker.id='oia-world-picker';picker.setAttribute('role','dialog');picker.setAttribute('aria-label','一键世界');
 picker.innerHTML='<header><b>🌍 一键世界</b><button aria-label="关闭世界选择">×</button></header><div></div>';
 picker.querySelector('header button').onclick=function(){picker.remove();};
 var native=[['santorini','圣托里尼','MinestOia'],['alpchalet','阿尔卑斯木屋','MinestAlps'],['admont','阿德蒙特图书馆','MinestAdmont'],['trinity','三一学院','MinestTrinity'],['study','英式藏书室','MinestStudy'],['hallstatt','哈尔施塔特','MinestHallstatt']];
 var options=native.filter(function(x){return window[x[2]];}).map(function(x){return {id:x[0],name:x[1],open:function(){if(window.MinestOia)MinestOia.close();if(window.MinestSceneCatalog)MinestSceneCatalog.open(x[0]);else window[x[2]].open();}};});
 if(window.MinestInteriors)MinestInteriors.kinds.forEach(function(k){options.push({id:k[0],name:k[2].replace('一键进入',''),open:function(){if(window.MinestOia)MinestOia.close();MinestInteriors.open(k[0]);}});});
 else if(window.openWorldOverlay3D)[['hobbiton','霍比屯'],['bibury','拜伯里'],['downton','唐顿庄园'],['giethoorn','羊角村'],['lauterbrunnen','劳特布龙嫩'],['neuschwanstein','新天鹅堡']].forEach(function(x){options.push({id:x[0],name:x[1],open:function(){MinestOia.close();openWorldOverlay3D(x[0]+'.html',x[1]);}});});
 options.forEach(function(option){var b=document.createElement('button');b.textContent=option.name;b.onclick=function(){picker.remove();option.open();};picker.querySelector('div').appendChild(b);});
 host.appendChild(picker);
}
function history(){
 var api=window.MinestOiaBld,h=api&&api.history?api.history():{};
 ['undo','redo'].forEach(function(a){var b=document.querySelector('#oia-console [data-console="'+a+'"]');if(b){b.disabled=!h[a];b.title=h[a]?'执行'+(a==='undo'?'撤销':'重做'):'尚无'+(a==='undo'?'撤销':'重做')+'记录';}});
 var s=window.__santorini,e=document.getElementById('oia-building-count');if(e&&s&&e.textContent!==s.world.buildings.length+' 栋建筑 · 修改自动保存')e.textContent=s.world.buildings.length+' 栋建筑 · 修改自动保存';
}
function prepare(){
 document.querySelectorAll('.wf .wf-acts').forEach(function(nav){
  if(!nav.querySelector('[data-console-voxel]')){var b=document.createElement('button');b.type='button';b.setAttribute('data-console-voxel','');b.innerHTML='<i>🧊</i><span>体素世界</span>';b.onclick=voxel;nav.appendChild(b);}
  var original=document.getElementById('mn-btn-santorini-3d');
  if(original&&!nav.querySelector('[data-console-santorini]')){var b=document.createElement('button');b.type='button';b.setAttribute('data-console-santorini','');b.innerHTML='<i>🏛️</i><span>圣托里尼</span>';b.onclick=function(){original.click();};nav.appendChild(b);}
 });
 var root=document.getElementById('oia-root');if(!root)return;
 var panel=root.querySelector('#mn-bld-p');
 if(!root.querySelector('#oia-console')){
  var toggle=document.createElement('button');toggle.type='button';toggle.id='oia-console-toggle';toggle.textContent='≡';toggle.setAttribute('aria-label','打开 My World 控制台');toggle.setAttribute('aria-expanded','false');
  var console=document.createElement('section');console.id='oia-console';console.hidden=true;console.setAttribute('aria-label','My World 控制台');
  console.innerHTML='<header><b>🌴 World › 圣托里尼</b><span>1/6 · World</span><button data-console="close" aria-label="收起控制台">×</button></header>'+
   '<div class="console-grid"><nav aria-label="编辑工具"><button data-console="view" class="on">🌐<br>视角</button><button data-console="map">🗺️<br>地图</button><button data-console="bld">🏛️<br>建筑</button><button data-console="elem">🌳<br>元素</button><button data-console="disp">🎨<br>陈列</button><button data-console="ai">✨<br>Smart</button></nav><main><section id="oia-camera-pane"><h3>全局编辑</h3><p id="oia-camera-summary" role="status"></p><p id="oia-selection"></p><div class="camera-actions"><button data-camera="fit">看全世界</button><button data-camera="top">正上方俯视</button><button data-camera="focus">聚焦选中建筑</button><button data-camera="light">编辑照明：明亮</button><button data-camera="gesture" id="oia-camera-gesture">当前：旋转</button><button data-camera="out">− 缩小</button><button data-camera="in">＋ 放大</button></div><label>镜头距离<input id="oia-camera-distance" type="range" min="12" max="3500" step="1" aria-label="镜头距离"></label><p class="camera-help">拖动旋转 · 双指捏合缩放并平移<br>切换「平移」后单指拖动平移 · 轻点选建筑</p><button data-camera="walk">🚶 步行探索</button></section><section id="oia-map-pane" hidden><h3>世界地图</h3><p>轻点地图定位镜头 · 下方滑杆调整时间</p><div id="oia-console-map"></div></section></main><nav aria-label="世界导航"><button data-console="door">🏠<br>进入房间</button><button data-console="worlds">🌍<br>一键世界</button><button data-console="voxel">🧊<br>体素世界</button><button data-console="return">‹<br>返回小岛</button></nav></div>'+
   '<footer><p id="oia-operation-status" role="status"></p><span id="oia-building-count"></span><div><button data-console="undo">↶ 撤销</button><button data-console="redo">↷ 重做</button><button data-console="reset">还原原始场景</button><button data-console="restore">恢复还原前编辑</button></div></footer>';
  function tab(name){
   var view=console.querySelector('#oia-camera-pane'),p=root.querySelector('#mn-bld-p');
   var sceneTab=name==='view'||name==='map';view.hidden=name!=='view';console.querySelector('#oia-map-pane').hidden=name!=='map';if(window.MinestOiaBld)MinestOiaBld.toggle(!sceneTab);if(p)p.hidden=sceneTab;
   var original=p&&p.querySelector('[data-tab="'+name+'"]');if(original)original.click();
   console.querySelectorAll('[data-console]').forEach(function(b){b.classList.toggle('on',b.getAttribute('data-console')===name);});
  }
  function open(on){console.hidden=!on;toggle.setAttribute('aria-expanded',String(on));if(on)tab('view');history();}
  toggle.onclick=function(){open(console.hidden);};
  console.addEventListener('click',function(e){
   var b=e.target.closest('[data-console]');if(!b)return;e.stopPropagation();var a=b.getAttribute('data-console'),api=window.MinestOiaBld;
   if(a==='close')return open(false);
   if(a==='worlds')return chooseWorld();
   if(a==='voxel'){open(false);return voxel();}
   if(a==='return'){open(false);if(window.MinestOia)MinestOia.close();return;}
   if(a==='door'){if(api){var id=api.selected();if(id)api.enterDoorhouse(id);else{tab('view');status('先在画面中轻点一栋建筑，再进入房间');}}return;}
   if(['undo','redo','reset','restore'].includes(a)){if(api&&api[a]){var ok=api[a]();tab('view');status(ok?(a==='reset'?'已还原原始场景，仍可撤销或恢复还原前编辑':'操作完成'):a==='restore'?'没有还原前的备份':'当前没有可执行的操作');history();}return;}
   tab(a);
  });
  root.appendChild(toggle);root.appendChild(console);
 }
 var console=root.querySelector('#oia-console'),main=console.querySelector('main');
 if(panel&&panel.parentElement!==main){main.appendChild(panel);panel.hidden=true;}
 var map=root.querySelector('#oia-mmWrap'),mapHost=console.querySelector('#oia-console-map');
 if(map&&map.parentElement!==mapHost)mapHost.appendChild(map);
 history();
}
var queued=false;new MutationObserver(function(){if(queued)return;queued=true;requestAnimationFrame(function(){queued=false;prepare();});}).observe(document.body,{childList:true,subtree:true});
window.addEventListener('minest-world-edit',history);
prepare();
})();

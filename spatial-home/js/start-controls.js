/* The opening landscape uses Minest's original Dock and opens the desktop board.
   The "=" / "||" key only folds the Dock's tools: it stays on the opening. */
(function () {
  'use strict';
  if (window.MinestStartControls) return;
  var root = document.documentElement, frame = null, dock = null, idle = 0, down = false, reading = false, nativeFull = false, opening = false, unwatch = [], dockPopover = false;
  var enterIcon = '<svg viewBox="0 0 24 24" aria-hidden="true"><path d="M8 3H3v5m13-5h5v5M3 16v5h5m13-5v5h-5"/></svg>';
  var exitIcon = '<svg viewBox="0 0 24 24" aria-hidden="true"><path d="M3 8h5V3m8 0v5h5M8 21v-5H3m18 0h-5v5"/></svg>';
  var css = document.createElement('style'); css.id = 'mn-start-controls-style'; css.textContent = `
html.mn-start-active body .mn-bdock.mn-bdock,html.mn-mac-web body .mn-bdock.mn-bdock{display:flex!important;opacity:1!important;visibility:visible!important;pointer-events:auto!important;z-index:2147483647!important;margin:0!important;overflow:visible!important}
html.mn-start-active body .mn-bdock[popover]{inset:auto!important;left:50%!important;right:auto!important;top:auto!important;bottom:max(12px,env(safe-area-inset-bottom))!important;flex-direction:row!important;transform:translateX(-50%)!important}
html.mn-mac-web[data-mn-bd="bottom"] body .mn-bdock{transform:translate(-50%,0)!important}
html.mn-mac-web[data-mn-bd="right"] body .mn-bdock,html.mn-mac-web[data-mn-bd="left"] body .mn-bdock{transform:translate(0,-50%)!important}
html.mn-start-active.mn-start-idle body .mn-bdock.mn-bdock{opacity:0!important;visibility:hidden!important;pointer-events:none!important}
html.mn-start-reading body .mn-bdock.mn-bdock,html.sh-reading body .mn-bdock.mn-bdock{display:none!important;visibility:hidden!important;pointer-events:none!important}
#sh-reading-exit{box-sizing:border-box!important;text-indent:0!important;padding:0!important;overflow:hidden!important}
#sh-reading-exit svg{position:absolute!important;left:50%!important;top:50%!important;width:22px!important;height:22px!important;margin:0!important;transform:translate(-50%,-50%)!important;display:block!important}
`; document.head.appendChild(css);
  function watch(target, type, fn) { target.addEventListener(type, fn, {capture:true,passive:true}); unwatch.push(function () { target.removeEventListener(type,fn,true); }); }
  function wake() {
    if (!frame || reading || opening) return;
    root.classList.remove('mn-start-idle');
    try { frame.contentDocument.documentElement.classList.remove('mn-start-idle'); } catch(e) {}
    clearTimeout(idle);
    idle = setTimeout(function () { if (down) { wake(); return; } root.classList.add('mn-start-idle'); try { frame.contentDocument.documentElement.classList.add('mn-start-idle'); } catch(e) {} }, 2400);
  }
  function setReading(on) {
    reading = !!on; root.classList.toggle('mn-start-reading',reading); clearTimeout(idle);
    try { var doc=frame.contentDocument; doc.documentElement.classList.toggle('mn-start-reading',reading); doc.getElementById('mn-start-full').hidden=reading; doc.getElementById('mn-start-exit').hidden=!reading; if(reading)doc.getElementById('mn-start-exit').focus({preventScroll:true}); } catch(e) {}
    if (reading && !document.fullscreenElement && root.requestFullscreen) {
      try { var p=root.requestFullscreen(); if(p)p.then(function(){nativeFull=true;if(!reading&&document.fullscreenElement)document.exitFullscreen().catch(function(){});}).catch(function(){}); } catch(e) {}
    } else if (!reading) {
      if(nativeFull&&document.fullscreenElement&&document.exitFullscreen)document.exitFullscreen().catch(function(){});
      nativeFull=false;wake();
    }
  }
  function showBoardDock() {
    root.classList.add('mn-mac-web','mn-chrome'); root.classList.remove('sh-main-dock-disabled','mn-start-idle');
    var g=document.querySelector('.duo-gl'); if(g){var b=g.querySelector('.duo-full');if(b)b.click();}
    try { if(window.MinestRoutine&&MinestRoutine.isOpen())MinestRoutine.close(); } catch(e) {}
  }
  function restoreDock() { if(dockPopover&&dock){try{dock.hidePopover();}catch(e){} dock.removeAttribute('popover');dockPopover=false;} }
  function openWeb(desktop) {
    if(desktop){ var url = new URL('web31.0.html',location.href); url.searchParams.set('dock','1');url.searchParams.set('from','clun');location.href=url.href;return; }
    if(opening)return; opening=true;if(reading)setReading(false);restoreDock();showBoardDock();
    if(frame)frame.dispatchEvent(new Event('minest:open-web'));
  }
  function mountChild() {
    if(!frame)return;var doc;try{doc=frame.contentDocument;if(!doc||!doc.body)return;}catch(e){return;}
    if(doc.getElementById('mn-start-full'))return;
    var style=doc.createElement('style');style.textContent=`
.mn-start-control{position:fixed!important;z-index:2147483647!important;width:44px!important;height:44px!important;min-width:44px!important;box-sizing:border-box!important;padding:0!important;border:1px solid #ffffff75!important;border-radius:50%!important;background:#1d2b4fcc!important;color:#fff!important;backdrop-filter:blur(12px);-webkit-backdrop-filter:blur(12px);cursor:pointer!important;display:grid!important;place-items:center!important;line-height:0!important;text-indent:0!important;transition:opacity .25s}
.mn-start-control svg{display:block!important;width:22px!important;height:22px!important;fill:none;stroke:currentColor;stroke-width:1.8;stroke-linecap:round;stroke-linejoin:round;pointer-events:none}
#mn-start-full{right:calc(16px + env(safe-area-inset-right))!important;bottom:calc(16px + env(safe-area-inset-bottom))!important}
#mn-start-exit{left:calc(16px + env(safe-area-inset-left))!important;right:auto!important;bottom:calc(16px + env(safe-area-inset-bottom))!important}
.mn-start-control[hidden]{display:none!important}
html.mn-start-idle #mn-start-full{opacity:0;visibility:hidden;pointer-events:none}
html.mn-start-reading body button,html.mn-start-reading .clun-entry,html.mn-start-reading .card{visibility:hidden!important;pointer-events:none!important}
html.mn-start-reading #mn-start-exit{visibility:visible!important;pointer-events:auto!important;display:grid!important}
`;
    doc.head.appendChild(style);
    [['mn-start-full','全屏 · 纯净阅览',enterIcon],['mn-start-exit','退出全屏',exitIcon]].forEach(function(q,i){var b=doc.createElement('button');b.id=q[0];b.className='mn-start-control';b.title=q[1];b.setAttribute('aria-label',q[1]);b.innerHTML=q[2];b.hidden=!!i;b.addEventListener('click',function(e){e.stopPropagation();setReading(!i);});doc.body.appendChild(b);});
    ['pointermove','pointerdown','touchstart','wheel','keydown','focusin'].forEach(function(t){watch(doc,t,wake);});
    watch(doc,'pointerdown',function(){down=true;}); ['pointerup','pointercancel'].forEach(function(t){watch(doc,t,function(){down=false;wake();});});
    var key=function(e){if(e.key==='Escape'&&reading){e.preventDefault();setReading(false);}};doc.addEventListener('keydown',key,true);unwatch.push(function(){doc.removeEventListener('keydown',key,true);});wake();
  }
  function ensureDock() {
    if(dock)return;dock=document.querySelector('.mn-bdock');
    if(dock&&dock.showPopover){try{dock.setAttribute('popover','manual');dock.showPopover();dockPopover=true;}catch(e){dock.removeAttribute('popover');}}
  }
  function attach(f) {
    frame=f;opening=false;root.classList.add('mn-start-active');root.classList.remove('mn-mac-web');
    ensureDock();
    var load=mountChild;f.addEventListener('load',load);unwatch.push(function(){f.removeEventListener('load',load);});mountChild();wake();
  }
  function detach() {
    if(reading)setReading(false);restoreDock();clearTimeout(idle);unwatch.forEach(function(fn){fn();});unwatch=[];down=false;frame=null;dock=null;root.classList.remove('mn-start-active','mn-start-idle','mn-start-reading');
  }
  document.addEventListener('click',function(e){if(frame&&e.target.closest&&e.target.closest('.mn-bdock button')&&!e.target.closest('.mn-sk-tools'))openWeb(false);},true);
  ['pointermove','pointerdown','wheel','keydown','focusin'].forEach(function(t){document.addEventListener(t,wake,{capture:true,passive:true});});
  document.addEventListener('fullscreenchange',function(){if(reading&&nativeFull&&!document.fullscreenElement)setReading(false);});
  var queued=false;new MutationObserver(function(){if(queued)return;queued=true;queueMicrotask(function(){queued=false;var f=document.getElementById('mn-clun-splash');if(f===frame){if(frame)ensureDock();return;}if(frame)detach();if(f)attach(f);});}).observe(document.body,{childList:true,subtree:true});
  window.MinestStartControls={openWeb:openWeb,showBoardDock:showBoardDock,setReading:setReading};
  var existing=document.getElementById('mn-clun-splash');if(existing)attach(existing);
})();

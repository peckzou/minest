(function(){
'use strict';
const params=new URLSearchParams(location.search), kind=params.get('room');
function init(){
 if(params.get('embed')!=='1')return;
 if(kind){const b=document.querySelector('[data-template="'+kind.replace(/[^a-z]/g,'')+'"]');if(b)b.click();}
 const send=()=>parent.postMessage({type:'minest-interior-exit'},location.origin);
 document.addEventListener('click',function(e){if(e.target.closest('#outside,#home')){e.preventDefault();e.stopImmediatePropagation();send();}},true);
 document.addEventListener('keydown',function(e){if(e.key==='Escape'&&!document.querySelector('dialog[open]')&&!document.body.classList.contains('arranging')){e.preventDefault();e.stopImmediatePropagation();send();}},true);
 document.getElementById('enter').click();
}
if(document.readyState==='loading')document.addEventListener('DOMContentLoaded',init,{once:true});else init();
})();
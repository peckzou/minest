/* Shared by word sets and their materials. Keep legacy copies; fall back to IndexedDB. */
(function(){
 'use strict';
 var cache=window.MinestDurableStorage, jobs=new Set(),failed=new Map();
 function report(error){if(window.MinestSyncManagement)window.MinestSyncManagement.reportLocalSave('teaching',error?'本机词表未保存：'+String(error.message||error)+'。请保留页面并导出备份。':'');}
 function setItem(key,value){
  value=String(value);var p;
  try{if(cache)p=cache.setItem(key,value);else{localStorage.setItem(key,value);if(localStorage.getItem(key)!==value)throw Error('词表保存未完成');p=Promise.resolve();}}
  catch(e){report(e);throw e;}
  jobs.add(p);p.then(function(){failed.delete(key);if(!failed.size)report(null);},function(e){failed.set(key,{value:value,error:e});report(e);}).then(function(){jobs.delete(p);});
  return p;
 }
 async function flush(){await api.ready;await Promise.all(Array.from(jobs));if(failed.size){var retry=Array.from(failed.entries());await Promise.all(retry.map(function(pair){return setItem(pair[0],pair[1].value);}));}if(failed.size)throw failed.values().next().value.error;}
 var api={ready:cache?cache.ready:Promise.resolve(),getItem:function(key){return cache?cache.getItem(key):localStorage.getItem(key);},setItem:setItem,flush:flush};
 window.MinestTeachingStorage=api;
 window.addEventListener('beforeunload',function(e){if(jobs.size||failed.size){e.preventDefault();e.returnValue='';}});
 window.addEventListener('storage',function(e){if(e.key&&/^minest\.teaching(?:\.|-)/.test(e.key)&&e.newValue!==null&&cache)setItem(e.key,e.newValue);});
})();

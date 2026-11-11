/* Short transactions stay silent; genuine errors are always immediate. */
(function(root){'use strict';
function create(render,options={}) {
 const schedule=options.setTimeout||setTimeout,cancel=options.clearTimeout||clearTimeout;
 let timer=null,last='',waiting=false;
 function emit(text){if(last===text)return;last=text;render(text);}
 return function update(state){
  if(state.error){if(timer!==null)cancel(timer);timer=null;waiting=false;emit('本机日程未保存：'+state.error+'。请保留页面并导出备份。');return;}
  if(!state.saving){if(timer!==null)cancel(timer);timer=null;waiting=false;emit('');return;}
  if(waiting||last==='正在保存到本机…')return;
  waiting=true;timer=schedule(()=>{timer=null;emit('正在保存到本机…');},options.delay??600);
 };
}
if(typeof module==='object'&&module.exports)module.exports=create;else root.MinestSaveIndicator=create;
})(typeof window!=='undefined'?window:this);

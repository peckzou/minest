/* Sync Management v1: metadata only. No content, credentials or email in the audit trail. */
(function(root,factory){var api=factory();if(typeof module==='object'&&module.exports)module.exports=api;else root.MinestSyncCore=api;})(typeof window!=='undefined'?window:this,function(){
'use strict';
var categories=['boards','routine','myworld','teaching'];
function stable(v){if(v===null||typeof v!=='object')return JSON.stringify(v);if(Array.isArray(v))return '['+v.map(stable).join(',')+']';return '{'+Object.keys(v).sort().filter(function(k){return v[k]!==undefined;}).map(function(k){return JSON.stringify(k)+':'+stable(v[k]);}).join(',')+'}';}
function version(v){v=JSON.parse(JSON.stringify(v));var s=stable(v),a=2166136261,b=5381;for(var i=0;i<s.length;i++){a=Math.imul(a^s.charCodeAt(i),16777619);b=Math.imul(b,33)^s.charCodeAt(i);}return s.length.toString(36)+'-'+(a>>>0).toString(36)+(b>>>0).toString(36);}
function fresh(){return {schema:1,domains:{},events:[]};}
function create(options){var state=fresh(),seq=0,uid='anonymous';var now=options.now||Date.now;
 function key(){return 'minest.sync-management.v1.'+encodeURIComponent(uid);}
 function load(){try{var x=JSON.parse(options.store.getItem(key()));state=x&&x.schema===1&&x.domains&&Array.isArray(x.events)?x:fresh();}catch(e){state=fresh();}}
 function save(){try{options.store.setItem(key(),JSON.stringify(state));}catch(e){state.storageError='记录无法保存到此设备';}if(options.changed)options.changed();}
 function domain(c){return state.domains[c]||(state.domains[c]={});}
 function event(c,kind,meta){var e=Object.assign({id:options.device.id+'-'+now().toString(36)+'-'+(++seq).toString(36)+'-'+Math.random().toString(36).slice(2,7),category:c,kind:kind,at:now(),deviceId:options.device.id,device:options.device.label},meta||{});state.events.push(e);state.events=state.events.slice(-80);return e;}
 function local(c,value,count){var d=domain(c),v=version(value);d.count=count||0;if(d.version!==v){if(d.version){d.localAt=now();event(c,v===d.cloudVersion?'applied':'local',{version:v});}d.version=v;}save();return v;}
 function capture(c,v){var d=domain(c);d.attemptAt=now();d.error='';save();return {category:c,version:v,uid:uid};}
 function ack(ticket){if(ticket.uid!==uid)return;var d=domain(ticket.category);var changed=d.uploadVersion!==ticket.version;d.uploadAt=now();d.uploadVersion=ticket.version;d.cloudVersion=ticket.version;d.cloudAt=now();d.error='';if(changed)event(ticket.category,'uploaded',{version:ticket.version});save();}
 function fail(ticket,error){if(ticket.uid!==uid)return;var d=domain(ticket.category);d.error=String(error&&error.code||'sync/failed').slice(0,120);event(ticket.category,'failed',{code:d.error});save();}
 function receive(c,v,meta){var d=domain(c);if(d.cloudVersion!==v){event(c,'available',{version:v,sourceDevice:meta&&meta.device||'旧版客户端（未记录设备）',sourceId:meta&&meta.deviceId||''});}d.cloudVersion=v;d.cloudAt=now();if(d.version===v)d.error='';d.writer=meta&&meta.device||'';d.writerAt=Number(meta&&meta.at)||null;save();}
 function status(c){var d=domain(c);if(d.error)return 'error';if(!d.version)return 'unavailable';if(d.cloudVersion===d.version)return 'confirmed';if(d.localAt)return 'pending';return 'unknown';}
 return {account:function(id){uid=id||'anonymous';load();},uid:function(){return uid;},snapshot:function(){return JSON.parse(JSON.stringify(state));},local:local,capture:capture,ack:ack,fail:fail,receive:receive,status:status,device:options.device};
}
return {create:create,version:version,stable:stable,categories:categories};
});

/* Home vocabulary library. Same Teaching Sets and JSON importer, no separate data silo. */
(function(){
 'use strict';
 var opening=false, modal=null, filter='',archived=false,dragged=null,oldFocus=null;
 function S(){if(!window.MinestTeachingSets)throw Error('词表仍在加载，请稍后再试。');return window.MinestTeachingSets;}
 function clone(v){return JSON.parse(JSON.stringify(v));}
 function escape(v){return String(v==null?'':v).replace(/[&<>"']/g,function(c){return {'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[c];});}
 async function ready(){if(window.MinestTeachingStorage)await window.MinestTeachingStorage.ready;}
 async function flush(){if(window.MinestTeachingStorage)await window.MinestTeachingStorage.flush();}
 async function change(fn){await ready();var b=clone(S().read());fn(b);S().save(b);await flush();return b;}
 function selected(b){var c=b.columns.find(function(x){return x.id===b.selected&&!x.teachingListArchived;});if(!c)b.selected=(b.columns.find(function(x){return !x.teachingListArchived;})||{}).id||null;}
 async function archive(id,value){return change(function(b){var c=b.columns.find(function(x){return x.id===id;});if(!c)throw Error('词表已改变，请刷新列表。');c.teachingListArchived=!!value;selected(b);});}
 async function remove(id){return change(function(b){if(!b.columns.some(function(x){return x.id===id;}))throw Error('词表已改变，请刷新列表。');b.columns=b.columns.filter(function(x){return x.id!==id;});selected(b);});}
 async function move(id,target){return change(function(b){var from=b.columns.findIndex(function(c){return c.id===id;}),to=b.columns.findIndex(function(c){return c.id===target;});if(from<0||to<0)throw Error('词表已改变，请刷新列表。');var item=b.columns.splice(from,1)[0];b.columns.splice(to,0,item);});}
 async function sort(mode,archiveScope){var scope=typeof archiveScope==='boolean'?archiveScope:archived;return change(function(b){var indexes=[],subset=[];b.columns.forEach(function(c,i){if(!!c.teachingListArchived===scope){indexes.push(i);subset.push(c);}});subset.sort(function(a,b){return mode==='count'?(b.cards||[]).length-(a.cards||[]).length:String(a.title||'').localeCompare(String(b.title||''),'zh-Hans',{numeric:true});});indexes.forEach(function(i,n){b.columns[i]=subset[n];});});}
 function say(text){if(modal){var el=modal.querySelector('[data-wm-message]');if(el)el.textContent=text||'';}}
 function perform(fn){if(!modal||modal.dataset.busy)return;modal.dataset.busy='1';var buttons=Array.from(modal.querySelectorAll('button:not([data-wm-close])')).map(function(b){var was=b.disabled;b.disabled=true;return {button:b,disabled:was};});Promise.resolve().then(fn).then(function(){if(modal)draw();}).catch(function(e){say(e.message||String(e));}).finally(function(){if(modal){delete modal.dataset.busy;buttons.forEach(function(x){if(x.button.isConnected)x.button.disabled=x.disabled;});}});}
 function close(){if(!modal)return;modal.close();modal.remove();modal=null;dragged=null;if(oldFocus&&oldFocus.isConnected)oldFocus.focus();}
 function importPanel(){
  var area=modal.querySelector('[data-wm-panel]'),J=window.MinestTeachingJSON;if(!J){say('JSON 导入仍在加载，请稍后再试。');return;}
  area.innerHTML='<h3>导入 JSON</h3>'+J.panelHTML();area.hidden=false;
  // Existing parser supports both pasted JSON and a selected file.
  J.bind(area,function(id,note){flush().then(function(){if(modal){draw();say(note);}},function(e){say(e.message);});});
  area.scrollIntoView({block:'nearest'});area.querySelector('textarea').focus();
 }
 function newPanel(){var p=modal.querySelector('[data-wm-panel]');p.hidden=false;p.innerHTML='<form data-wm-new><label>词表名称<input name="title" required maxlength="120" placeholder="例如：Word work"></label><label>词语（可留空）<textarea name="words" rows="3" placeholder="每行一个词，或用逗号分隔"></textarea></label><button type="submit" class="wm-primary">创建词表</button></form>';p.querySelector('form').onsubmit=function(e){e.preventDefault();var title=this.elements.title.value.trim(),words=this.elements.words.value;if(!title)return;perform(async function(){await ready();S().create(title,words);await flush();archived=false;filter='';});};p.querySelector('input').focus();}
 function draw(){
  if(!modal)return;var b=S().read(),all=b.columns||[],rows=all.filter(function(c){return !!c.teachingListArchived===archived&&(!filter||String(c.title||'').toLocaleLowerCase().includes(filter.toLocaleLowerCase()));});
  modal.innerHTML='<header><div><small>MINEST · VOCABULARY</small><h2>词表管理</h2></div><button data-wm-close aria-label="关闭词表管理">✕</button></header>'
   +'<div class="wm-toolbar"><button class="wm-primary" data-wm-create>＋ 新建词表</button><button data-wm-import>导入 JSON</button><button data-wm-export>导出全部词表</button><label class="wm-search"><span class="wm-sr">搜索词表</span><input data-wm-search value="'+escape(filter)+'" placeholder="搜索词表"></label></div>'
   +'<div class="wm-options"><div role="group" aria-label="词表范围"><button data-wm-active aria-pressed="'+!archived+'">词表 · '+all.filter(function(c){return !c.teachingListArchived;}).length+'</button><button data-wm-archive-tab aria-pressed="'+archived+'">Archive · '+all.filter(function(c){return c.teachingListArchived;}).length+'</button></div><label>排序 <select data-wm-sort><option value="">手动顺序</option><option value="title">名称</option><option value="count">词数最多</option></select></label></div>'
   +'<p data-wm-message role="status"></p><main class="wm-scroll"><section data-wm-panel hidden></section><div class="wm-list">'
   +rows.map(function(c,i){return '<article data-wm-row="'+escape(c.id)+'"><div class="wm-info"><strong>'+escape(c.title)+'</strong><small>'+(c.cards||[]).filter(function(w){return !w.teachingArchived;}).length+' 词</small></div><div class="wm-actions"><button data-wm-edit="'+escape(c.id)+'">编辑</button><button data-wm-one-export="'+escape(c.id)+'">导出</button><button class="wm-handle" draggable="true" data-wm-drag="'+escape(c.id)+'" aria-label="拖动排序 '+escape(c.title)+'">⠿</button><button data-wm-up="'+escape(c.id)+'" aria-label="上移 '+escape(c.title)+'" '+(i===0?'disabled':'')+'>↑</button><button data-wm-down="'+escape(c.id)+'" aria-label="下移 '+escape(c.title)+'" '+(i===rows.length-1?'disabled':'')+'>↓</button><button data-wm-archive="'+escape(c.id)+'">'+(archived?'恢复':'Archive')+'</button><button class="wm-danger" data-wm-delete="'+escape(c.id)+'">Delete</button></div></article>';}).join('')
   +(rows.length?'':'<p class="wm-empty">'+(filter?'没有匹配的词表。':archived?'还没有归档词表。':'还没有词表，点击上方新建或导入 JSON。')+'</p>')+'</div></main><footer>拖动 ⠿ 或使用 ↑ ↓ 调整顺序 · 归档后可恢复</footer>';
  var q=function(s){return modal.querySelector(s);};q('[data-wm-close]').onclick=close;q('[data-wm-create]').onclick=newPanel;q('[data-wm-import]').onclick=importPanel;q('[data-wm-export]').onclick=function(){try{window.MinestTeachingExport.download();}catch(e){say(e.message);}};
  q('[data-wm-search]').oninput=function(){var pos=this.selectionStart;filter=this.value;draw();var input=modal.querySelector('[data-wm-search]');input.focus();input.setSelectionRange(pos,pos);};
  q('[data-wm-active]').onclick=function(){archived=false;draw();};q('[data-wm-archive-tab]').onclick=function(){archived=true;draw();};q('[data-wm-sort]').onchange=function(){var mode=this.value;if(mode)perform(function(){return sort(mode);});};
  modal.querySelectorAll('[data-wm-row]').forEach(function(row){
   var id=row.getAttribute('data-wm-row'),at=rows.findIndex(function(c){return c.id===id;});
   row.querySelector('[data-wm-edit]').onclick=function(){close();S().edit(id,{onSave:open});};
   row.querySelector('[data-wm-one-export]').onclick=function(){try{window.MinestTeachingExport.download(id);}catch(e){say(e.message);}};
   row.querySelector('[data-wm-archive]').onclick=function(){perform(function(){return archive(id,!archived);});};
   row.querySelector('[data-wm-delete]').onclick=function(){if(window.confirm('永久删除词表「'+rows[at].title+'」及其中词卡？建议先导出备份。'))perform(function(){return remove(id);});};
   row.querySelector('[data-wm-up]').onclick=function(){if(at>0)perform(function(){return move(id,rows[at-1].id);});};
   row.querySelector('[data-wm-down]').onclick=function(){if(at<rows.length-1)perform(function(){return move(id,rows[at+1].id);});};
   row.querySelector('[data-wm-drag]').ondragstart=function(e){dragged=id;row.classList.add('wm-dragging');e.dataTransfer.effectAllowed='move';e.dataTransfer.setData('text/plain',id);};
   row.ondragover=function(e){if(dragged&&dragged!==id){e.preventDefault();row.classList.add('wm-drop');}};row.ondragleave=function(){row.classList.remove('wm-drop');};row.ondrop=function(e){e.preventDefault();row.classList.remove('wm-drop');if(dragged&&dragged!==id){var from=dragged;dragged=null;perform(function(){return move(from,id);});}};row.ondragend=function(){dragged=null;modal.querySelectorAll('.wm-drop,.wm-dragging').forEach(function(r){r.classList.remove('wm-drop','wm-dragging');});};
  });
 }
 async function open(){
  if(modal){modal.focus();return;}if(opening)return;opening=true;try{await ready();oldFocus=document.activeElement;modal=document.createElement('dialog');modal.id='minest-wordlists';modal.setAttribute('aria-label','词表管理');document.body.appendChild(modal);draw();modal.addEventListener('cancel',function(e){e.preventDefault();close();});modal.showModal();
  ['keydown','pointerdown','click','wheel'].forEach(function(type){modal.addEventListener(type,function(e){e.stopPropagation();},{passive:true});});
  }catch(e){if(modal&&!modal.open){modal.remove();modal=null;}throw e;}finally{opening=false;}
 }
 document.addEventListener('click',function(e){var t=e.target.closest&&e.target.closest('[data-wordlists-open]');if(t)open().catch(function(error){var p=t.closest('[data-teaching-sets]'),msg=p&&p.querySelector('[data-set-error]');if(msg)msg.textContent=error.message;});});
 window.MinestWordlists={open:open,close:close,archive:archive,remove:remove,move:move,sort:sort};
})();

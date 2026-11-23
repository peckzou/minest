/* Teaching home: list actions stay beside the list, sharing the library's storage. */
function teacher(body){
 var panel=document.createElement('section'),archived=false,busy=false,dragged=null;
 panel.className='mlv-card';panel.setAttribute('data-teaching-sets','');
 var legacy=document.createElement('details');legacy.innerHTML='<summary style="cursor:pointer;padding:16px">Live classroom & more</summary>';
 while(body.firstChild)legacy.appendChild(body.firstChild);body.append(panel,legacy);
 function message(text){var p=panel.querySelector('[data-set-error]');if(p)p.textContent=text||'';}
 async function flush(){if(window.MinestTeachingStorage)await window.MinestTeachingStorage.flush();}
 function run(fn){if(busy)return;busy=true;var buttons=Array.from(panel.querySelectorAll('button')).map(function(b){var disabled=b.disabled;b.disabled=true;return {button:b,disabled:disabled};});
  Promise.resolve().then(fn).then(render).catch(function(e){message(e.message||String(e));}).finally(function(){busy=false;buttons.forEach(function(x){if(x.button.isConnected)x.button.disabled=x.disabled;});});
 }
 function render(){
  var b;try{b=read();}catch(e){panel.textContent=e.message;return;}
  var columns=b.columns.filter(function(c){return !!c.teachingListArchived===archived;});
  panel.innerHTML='<div class="mlv-row" style="margin:0 0 20px"><button class="mlv-btn" data-teaching-templates>Teaching</button><button class="mlv-btn alt" data-teaching-ec6>EC–6</button></div>'
   +'<h2>Word Lists</h2><div class="tl-toolbar"><button class="mlv-btn alt" data-set-json>Import JSON</button><button class="mlv-btn alt" data-teaching-export="">Export All</button><button class="mlv-btn alt" data-set-scope></button><label class="tl-sort">Sort <select data-set-sort><option value="">Manual</option><option value="title">Name</option><option value="count">Word count</option></select></label></div>'
   +'<p data-set-error role="status"></p><div data-set-json-panel hidden></div><div class="tl-create"><label>Title<input data-set-title placeholder="Word list title" maxlength="120"></label><label>Words <small>(optional)</small><textarea data-set-words rows="2" placeholder="One word per line, or separate with commas"></textarea></label><button class="mlv-btn" data-set-create>New List</button></div><div data-set-items></div>';
  function enter(audience){var saved=read();window.MinestLive.close();open({board:saved,listId:saved.selected},{audience:audience});}
  panel.querySelector('[data-teaching-templates]').onclick=function(){enter('student');};panel.querySelector('[data-teaching-ec6]').onclick=function(){enter('ec6');};
  var scope=panel.querySelector('[data-set-scope]');scope.textContent=archived?'Lists ('+b.columns.filter(function(c){return !c.teachingListArchived;}).length+')':'Archive ('+b.columns.filter(function(c){return c.teachingListArchived;}).length+')';
  scope.onclick=function(){archived=!archived;render();};
  panel.querySelector('[data-set-sort]').onchange=function(){var mode=this.value;if(mode)run(function(){return window.MinestWordlists.sort(mode,archived);});};
  panel.querySelector('[data-set-json]').onclick=function(){
   var J=window.MinestTeachingJSON,area=panel.querySelector('[data-set-json-panel]');if(!J){message('JSON import is still loading.');return;}
   area.hidden=!area.hidden;if(area.hidden)return;area.innerHTML=J.panelHTML();
   J.bind(area,function(id,note){flush().then(function(){render();message(note);},function(e){message(e.message);});});
   area.querySelector('[data-p-go]').textContent='Import';area.querySelector('[data-p-jsonfmt]').textContent='Copy Format';area.querySelector('[data-p-jsonsample]').textContent='Example';
   area.querySelector('textarea').focus();
  };
  var items=panel.querySelector('[data-set-items]');
  columns.forEach(function(c,index){
   var row=document.createElement('div');row.className='tl-row';row.setAttribute('data-set-row',c.id);
   var label=document.createElement('strong');label.className='tl-title';var count=c.cards.filter(function(w){return !w.teachingArchived;}).length;label.textContent=c.title+' · '+count+(count===1?' word':' words');
   var actions=document.createElement('div');actions.className='tl-actions';row.append(label,actions);
   function button(text,fn,attr){var el=document.createElement('button');el.type='button';el.className='mlv-btn alt';el.textContent=text;if(attr)el.setAttribute(attr,c.id);el.onclick=fn;actions.appendChild(el);return el;}
   button('Edit',function(){edit(c.id,{onSave:render});},'data-set-edit');
   button('Export',null,'data-teaching-export');
   var teach=button('Teaching',function(){window.MinestLive.close();open({board:read(),listId:c.id});});teach.className='mlv-btn';teach.disabled=!c.cards.some(function(w){return !w.teachingArchived;});
   var solo=button('Solo',function(){try{arcade(c.id);}catch(e){message(e.message);}},'data-set-arcade');solo.disabled=teach.disabled;
   var handle=button('⠿',null,'data-set-drag');handle.draggable=true;handle.setAttribute('aria-label','Reorder '+c.title);handle.classList.add('tl-handle');
   var up=button('↑',function(){if(index>0)run(function(){return window.MinestWordlists.move(c.id,columns[index-1].id);});},'data-set-up');up.disabled=index===0;up.setAttribute('aria-label','Move up '+c.title);
   var down=button('↓',function(){if(index<columns.length-1)run(function(){return window.MinestWordlists.move(c.id,columns[index+1].id);});},'data-set-down');down.disabled=index===columns.length-1;down.setAttribute('aria-label','Move down '+c.title);
   button(archived?'Restore':'Archive',function(){run(function(){return window.MinestWordlists.archive(c.id,!archived);});},'data-set-archive');
   var del=button('Delete',function(){if(window.confirm('Delete “'+c.title+'” and its words permanently? Export a backup first if needed.'))run(function(){return window.MinestWordlists.remove(c.id);});},'data-set-delete');del.classList.add('tl-delete');
   handle.ondragstart=function(e){dragged=c.id;e.dataTransfer.effectAllowed='move';e.dataTransfer.setData('text/plain',c.id);row.classList.add('tl-dragging');};
   row.ondragover=function(e){if(dragged&&dragged!==c.id){e.preventDefault();row.classList.add('tl-drop');}};row.ondragleave=function(){row.classList.remove('tl-drop');};
   row.ondrop=function(e){e.preventDefault();row.classList.remove('tl-drop');if(dragged&&dragged!==c.id){var from=dragged;dragged=null;run(function(){return window.MinestWordlists.move(from,c.id);});}};
   handle.ondragend=function(){dragged=null;panel.querySelectorAll('.tl-drop,.tl-dragging').forEach(function(r){r.classList.remove('tl-drop','tl-dragging');});};items.appendChild(row);
  });
  if(!columns.length){var empty=document.createElement('p');empty.textContent=archived?'No archived lists.':'No word lists yet.';items.appendChild(empty);}
  panel.querySelector('[data-set-create]').onclick=function(){var title=panel.querySelector('[data-set-title]').value.trim(),words=panel.querySelector('[data-set-words]').value;if(!title){message('Enter a title.');return;}run(async function(){create(title,words);await flush();archived=false;});};
 }
 render();
}

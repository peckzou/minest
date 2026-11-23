/* Teaching home: list actions stay beside the list, sharing the library's storage. */
function teacher(body){
 var panel=document.createElement('section'),archived=false,busy=false,dragged=null,filter='';
 panel.className='mlv-card tl-library';var host=body.closest('.mlv');if(host)host.classList.add('mlv-teacher');body.classList.add('tl-dashboard');panel.setAttribute('data-teaching-sets','');
 var legacy=document.createElement('details');legacy.className='tl-live';legacy.innerHTML='<summary><span>🎮</span><div><b>Live 课堂与学生作业</b><small>选择游戏、生成数字 Code、查看课堂结果</small></div><i aria-hidden="true">⌄</i></summary>';
 while(body.firstChild)legacy.appendChild(body.firstChild);body.append(panel,legacy);
 function message(text){var p=panel.querySelector('[data-set-error]');if(p)p.textContent=text||'';}
 async function flush(){if(window.MinestTeachingStorage)await window.MinestTeachingStorage.flush();}
 function run(fn){if(busy)return;busy=true;var buttons=Array.from(panel.querySelectorAll('button')).map(function(b){var disabled=b.disabled;b.disabled=true;return {button:b,disabled:disabled};});
  Promise.resolve().then(fn).then(render).catch(function(e){message(e.message||String(e));}).finally(function(){busy=false;buttons.forEach(function(x){if(x.button.isConnected)x.button.disabled=x.disabled;});});
 }
 function render(){
  var b;try{b=read();}catch(e){panel.textContent=e.message;return;}
  var active=b.columns.filter(function(c){return !c.teachingListArchived;}),wordCount=active.reduce(function(n,c){return n+c.cards.filter(function(w){return !w.teachingArchived;}).length;},0);
  var columns=b.columns.filter(function(c){return !!c.teachingListArchived===archived&&(!filter||(c.title+' '+c.cards.map(function(w){return w.title;}).join(' ')).toLocaleLowerCase().includes(filter.toLocaleLowerCase()));});
  panel.innerHTML='<div class="tl-hero"><div><span class="tl-eyebrow">MINEST · TEACHER</span><h1>教师工作台</h1><p>整理词卡，准备活动，开启你的课堂。</p></div><div class="tl-quick"><button class="mlv-btn" data-teaching-templates>▦ 课堂活动</button><button class="mlv-btn alt" data-teaching-ec6>EC–6 教学</button><button class="mlv-btn alt" data-set-live>🎮 Live 课堂</button></div></div>'
   +'<div class="tl-stats"><div><span>📚 我的词表</span><strong>'+active.length+'</strong></div><div><span>✦ 可用词卡</span><strong>'+wordCount+'</strong></div><div><span>▣ 已归档</span><strong>'+(b.columns.length-active.length)+'</strong></div></div>'
   +'<div class="tl-section-head"><div><h2>我的教学词表</h2><p>先选一份词表，再开始编辑或上课。</p></div><button class="mlv-btn alt" data-wordlists-open>管理全部词表 ↗</button></div>'
   +'<div class="tl-toolbar"><label class="tl-search"><span class="tl-sr">搜索词表或词语</span><input data-set-search type="search" placeholder="搜索词表或词语"></label><button class="mlv-btn alt" data-set-json>↓ 导入 JSON</button><button class="mlv-btn alt" data-teaching-export="">↑ 导出全部</button><button class="mlv-btn alt" data-set-scope></button><label class="tl-sort">排序 <select data-set-sort><option value="">手动顺序</option><option value="title">名称</option><option value="count">词数最多</option></select></label></div>'
   +'<p data-set-error role="status" aria-live="polite"></p><div data-set-json-panel hidden></div><details class="tl-create"'+(active.length?'':' open')+'><summary>＋ 新建教学词表</summary><div class="tl-create-fields"><label>词表名称<input data-set-title placeholder="例如：校园生活" maxlength="120"></label><label>词语 <small>（可留空）</small><textarea data-set-words rows="2" placeholder="每行一个词，或用逗号分隔"></textarea></label><button class="mlv-btn" data-set-create>创建词表</button></div></details><div data-set-items></div>';
  panel.querySelector('[data-set-live]').onclick=function(){legacy.open=true;legacy.scrollIntoView({block:'start',behavior:'smooth'});};
  var search=panel.querySelector('[data-set-search]');search.value=filter;search.oninput=function(event){if(event&&event.isComposing)return;var pos=this.selectionStart;filter=this.value;render();var input=panel.querySelector('[data-set-search]');input.focus();if(typeof pos==='number')input.setSelectionRange(pos,pos);};search.oncompositionend=search.oninput;
  function enter(audience){var saved=read();window.MinestLive.close();open({board:saved,listId:saved.selected},{audience:audience});}
  panel.querySelector('[data-teaching-templates]').onclick=function(){enter('student');};panel.querySelector('[data-teaching-ec6]').onclick=function(){enter('ec6');};
  var scope=panel.querySelector('[data-set-scope]');scope.textContent=archived?'查看使用中的词表':'归档词表 · '+(b.columns.length-active.length);scope.setAttribute('aria-pressed',String(archived));
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
   var row=document.createElement('div');row.className='tl-row';row.dataset.tone=index%4;row.setAttribute('data-set-row',c.id);
   var label=document.createElement('div');label.className='tl-title';var count=c.cards.filter(function(w){return !w.teachingArchived;}).length;var title=document.createElement('strong');title.textContent=c.title;var meta=document.createElement('small');meta.textContent=count+' 张词卡';var preview=document.createElement('p');preview.textContent=c.cards.filter(function(w){return !w.teachingArchived;}).slice(0,4).map(function(w){return w.title;}).join(' · ')||'添加词卡，开始准备课堂';label.append(title,meta,preview);
   var badge=document.createElement('span');badge.className='tl-list-icon';badge.setAttribute('aria-hidden','true');badge.textContent=['📚','✏️','🌟','🎨'][index%4];var actions=document.createElement('div');actions.className='tl-actions';row.append(badge,label,actions);var more=document.createElement('details');more.className='tl-more';more.innerHTML='<summary aria-label="更多词表操作">更多 ···</summary><div class="tl-menu"></div>';more.querySelector('summary').setAttribute('aria-label','更多操作：'+c.title);actions.appendChild(more);
   function button(text,fn,attr){var el=document.createElement('button');el.type='button';el.className='mlv-btn alt';el.textContent=text;if(attr)el.setAttribute(attr,c.id);el.onclick=fn;if(/^(data-teaching-export|data-set-up|data-set-down|data-set-archive|data-set-delete)$/.test(attr||''))more.querySelector('.tl-menu').appendChild(el);else actions.insertBefore(el,more);return el;}
   button('编辑备课',function(){edit(c.id,{onSave:render});},'data-set-edit');
   button('导出词表',null,'data-teaching-export');
   var teach=button('开始上课',function(){window.MinestLive.close();open({board:read(),listId:c.id});});teach.className='mlv-btn';teach.disabled=!c.cards.some(function(w){return !w.teachingArchived;});
   var solo=button('学生闯关',function(){try{arcade(c.id);}catch(e){message(e.message);}},'data-set-arcade');solo.disabled=teach.disabled;
   var handle=button('⠿',null,'data-set-drag');handle.draggable=true;handle.setAttribute('aria-label','Reorder '+c.title);handle.classList.add('tl-handle');
   var up=button('↑',function(){if(index>0)run(function(){return window.MinestWordlists.move(c.id,columns[index-1].id);});},'data-set-up');up.disabled=index===0;up.setAttribute('aria-label','Move up '+c.title);
   var down=button('↓',function(){if(index<columns.length-1)run(function(){return window.MinestWordlists.move(c.id,columns[index+1].id);});},'data-set-down');down.disabled=index===columns.length-1;down.setAttribute('aria-label','Move down '+c.title);
   button(archived?'恢复词表':'归档词表',function(){run(function(){return window.MinestWordlists.archive(c.id,!archived);});},'data-set-archive');
   var del=button('删除词表',function(){if(window.confirm('Delete “'+c.title+'” and its words permanently? Export a backup first if needed.'))run(function(){return window.MinestWordlists.remove(c.id);});},'data-set-delete');del.classList.add('tl-delete');
   handle.ondragstart=function(e){dragged=c.id;e.dataTransfer.effectAllowed='move';e.dataTransfer.setData('text/plain',c.id);row.classList.add('tl-dragging');};
   row.ondragover=function(e){if(dragged&&dragged!==c.id){e.preventDefault();row.classList.add('tl-drop');}};row.ondragleave=function(){row.classList.remove('tl-drop');};
   row.ondrop=function(e){e.preventDefault();row.classList.remove('tl-drop');if(dragged&&dragged!==c.id){var from=dragged;dragged=null;run(function(){return window.MinestWordlists.move(from,c.id);});}};
   handle.ondragend=function(){dragged=null;panel.querySelectorAll('.tl-drop,.tl-dragging').forEach(function(r){r.classList.remove('tl-drop','tl-dragging');});};items.appendChild(row);
  });
  if(!columns.length){var empty=document.createElement('p');empty.className='tl-empty';empty.textContent=filter?'没有匹配的词表，试试其他关键词。':archived?'还没有归档词表。':'还没有教学词表，从新建或导入开始吧。';items.appendChild(empty);}
  panel.querySelector('[data-set-create]').onclick=function(){var title=panel.querySelector('[data-set-title]').value.trim(),words=panel.querySelector('[data-set-words]').value;if(!title){message('请先填写词表名称。');return;}run(async function(){create(title,words);await flush();archived=false;});};
 }
 render();
}

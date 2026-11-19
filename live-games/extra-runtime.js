/* Shared Live assignment runtime. English and Chinese cards use the same six levels on every entry page. */
(function(){
 'use strict';
 if(window.MinestLiveExtraGames)return;
 const definitions=[
  {k:'tt-dragmatching',name:'Drag Matching',icon:'🧲',tag:'Match terms and definitions',teach:'dragmatching'},
  {k:'tt-ttt3',name:'Tic-Tac-Toe · 井字棋',icon:'⭕',tag:'Answer to claim a square',teach:'ttt3'},
  {k:'tt-snake3',name:'Snakes & Ladders · 蛇形棋',icon:'🐍',tag:'Answer to roll the dice',teach:'snake3'},
  {k:'tt-cloze3',name:'Build a Bridge · 过桥',icon:'🌉',tag:'Find the missing term',teach:'cloze3'},
  {k:'tt-cloud3',name:'Listen & Order · 云朵',icon:'☁️',tag:'Read and arrange the sentence',teach:'cloud3'},
  {k:'tt-lock3',name:'Unlock · 开锁',icon:'🔑',tag:'Match definition keys to term locks',teach:'lock3'}
 ];
 const names=new Set(definitions.map(d=>d.teach));
 const old=window.MinestLiveTeach;
 let current=null,watch=0;
 const esc=t=>String(t??'').replace(/[&<>"']/g,c=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[c]));
 function plain(s){return String(s||'').replace(/!\[[^\]]*\]\([^)]*\)/g,'').replace(/\[([^\]]+)\]\([^)]*\)/g,'$1').replace(/<[^>]*>/g,' ').replace(/[#*_`>|]+/g,'').replace(/\s+/g,' ').trim();}
 function cardsOf(board){
  const cards=[],seen=new Set();
  function add(c){if(!c||!String(c.title||'').trim())return;const title=String(c.title).trim();if(seen.has(title))return;seen.add(title);cards.push({id:'c'+cards.length,zh:title,en:plain(c.en||c.desc||c.description)||title,py:c.pinyin||'',sent:c.sent||c.sentence||'',sentEn:c.sentEn||'',img:''});(c.stack||[]).forEach(add);}
  (board?.columns||[]).forEach(col=>(col.cards||[]).forEach(add));return cards;
 }
 function stop(){
  clearInterval(watch);watch=0;
  if(window.MinestLiveDragExtras)MinestLiveDragExtras.stop();
  const root=document.getElementById('mn-live-extra');if(root)root.remove();
  window.MinestLiveExtraContext=null;current=null;
 }
 function cancel(){if(!current)return;const report=!current.reported;stop();if(report)window.dispatchEvent(new CustomEvent('minest:arcade-closed'));}
 function complete(result){
  if(!current||current.reported||!result.total||result.completed<result.total)return;
  current.reported=true;clearInterval(watch);watch=0;
  const root=document.getElementById('mn-live-extra');if(root)root.style.display='none';
  window.dispatchEvent(new CustomEvent('minest:arcade-done',{detail:{mode:current.key,cleared:true,score:(result.xp||result.correct*10)*10,combo:result.correct,c:result.correct||0,w:Math.max(0,result.completed-(result.correct||0))}}));
 }
 function shuffle(a){a=a.slice();for(let i=a.length-1;i>0;i--){const j=Math.floor(Math.random()*(i+1));[a[i],a[j]]=[a[j],a[i]];}return a;}
 function matching(root,cards){
  const chosen=shuffle(cards).slice(0,Math.min(6,cards.length)),done=new Set();let selected=null,wrong=0;
  const wrap=root.querySelector('.tt-wrap');
  wrap.innerHTML='<section class="d3-stage"><div class="d3-hud"><button type="button" class="d3-back" data-exit>← Map</button><b>🧲 Drag Matching</b><span class="d3-xp" data-progress>0 / '+chosen.length+'</span></div><div class="d3-card"><p class="d3-dir">MATCH TERMS TO DEFINITIONS</p><p>Tap a term, then its definition — or drag it across.</p><div class="lve-match"><div class="lve-column">'+chosen.map(c=>'<button type="button" draggable="true" class="lve-term" data-term="'+c.id+'">'+esc(c.zh)+'</button>').join('')+'</div><div class="lve-column">'+shuffle(chosen).map(c=>'<button type="button" class="lve-definition" data-definition="'+c.id+'">'+esc(c.en)+'</button>').join('')+'</div></div></div><p class="lve-notice" role="status">Choose a term.</p></section>';
  wrap.querySelector('[data-exit]').onclick=cancel;
  function select(id){if(done.has(id))return;selected=id;wrap.querySelectorAll('[data-term]').forEach(b=>b.classList.toggle('selected',b.dataset.term===id));wrap.querySelector('[role="status"]').textContent='Now choose the matching definition.';}
  function match(id){if(!selected||done.has(id))return;const id0=selected;if(id!==id0){wrong++;wrap.querySelector('[role="status"]').textContent='Try another definition.';return;}
   done.add(id);selected=null;wrap.querySelectorAll('[data-term],[data-definition]').forEach(b=>{if((b.dataset.term||b.dataset.definition)===id){b.disabled=true;b.classList.add('matched');b.classList.remove('selected');}});
   wrap.querySelector('[data-progress]').textContent=done.size+' / '+chosen.length;wrap.querySelector('[role="status"]').textContent=done.size===chosen.length?'Level complete!':'Matched! Choose the next term.';
   if(done.size===chosen.length)complete({total:chosen.length,completed:chosen.length,correct:Math.max(0,chosen.length-wrong),xp:chosen.length*10});
  }
  wrap.querySelectorAll('[data-term]').forEach(b=>{b.onclick=()=>select(b.dataset.term);b.ondragstart=e=>{select(b.dataset.term);e.dataTransfer.setData('text/plain',b.dataset.term);};});
  wrap.querySelectorAll('[data-definition]').forEach(b=>{b.onclick=()=>match(b.dataset.definition);b.ondragover=e=>e.preventDefault();b.ondrop=e=>{e.preventDefault();selected=e.dataTransfer.getData('text/plain');match(b.dataset.definition);};});
 }
 function start(board,mode,key){
  if(!names.has(mode))return old?.start?old.start(board,mode,key):false;
  const cards=cardsOf(board);if(cards.length<3)return false;
  stop();const context={boardId:String(board.id||'live'),col:'live-all',title:board.title||'Live class',cards};
  window.MinestLiveExtraContext=context;
  const root=document.createElement('div');root.id='mn-live-extra';root.setAttribute('role','dialog');root.setAttribute('aria-label',definitions.find(d=>d.teach===mode).name);root.innerHTML='<div class="tt-wrap"></div>';document.body.appendChild(root);
  current={key:key||'tt-'+mode,mode,reported:false};
  if(mode==='dragmatching')matching(root,cards);
  else {
   if(!window.MinestLiveDragExtras||!MinestLiveDragExtras.start(mode)){stop();return false;}
   watch=setInterval(()=>{if(!current)return;if(!root.isConnected){cancel();return;}const info=MinestLiveDragExtras.info();if(info?.done)complete(info);},200);
  }
  return true;
 }
 window.addEventListener('minest:live-extra-close',cancel);
 window.addEventListener('keydown',e=>{if(current&&e.key==='Escape'&&!document.querySelector('#mn-live-extra .d3-tile.sel')){e.preventDefault();cancel();}},true);
 function register(){const live=window.MinestLive;if(!live)return;definitions.forEach(d=>{if(!live.levels.some(l=>l.k===d.k))live.levels.push(d);});}
 register();document.addEventListener('DOMContentLoaded',register,{once:true});
 window.MinestLiveTeach={start,stop:()=>{stop();old?.stop?.();},active:()=>!!current||!!old?.active?.()};
 window.MinestLiveExtraGames={start,stop,definitions,cardsOf,version:'13.1'};
})();

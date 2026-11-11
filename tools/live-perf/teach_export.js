/* Local-only vocabulary backup. Never signs in, saves, or uploads. */
(function(){
  'use strict';
  function clone(v){return JSON.parse(JSON.stringify(v));}
  function build(listId){
    var S=window.MinestTeachingSets;
    if(!S||!S.read)throw Error('词表仍在加载，请稍后再试。');
    var board=clone(S.read()), columns=board.columns||[];
    if(listId){columns=columns.filter(function(c){return c.id===listId;});if(!columns.length)throw Error('没有找到这个词表，请重新打开。');}
    if(!columns.length)throw Error('目前没有可导出的词表。');
    var A=window.MinestTeachingAssets, assets=A&&A.forBoard?clone(A.forBoard(board.id)||{}):{};
    var selectedAssets={};
    var lists=columns.map(function(col){
      return Object.assign({},col,{words:(col.cards||[]).map(function(card){
        var m=assets[card.id]||{};if(assets[card.id])selectedAssets[card.id]=m;
        return Object.assign({},m,card,{word:card.title||'',meaning:card.back||card.desc||'',pinyin:card.pinyin||m.pinyin||'',en:card.en||'',image:card.cover&&card.cover.type==='image'?card.cover.value:(m.image&&m.image.url||''),related:m.relatedWords||[],sentence:card.sent||'',sentenceEn:card.sentEn||''});
      })});
    });
    board.columns=columns;
    return {format:'minest-teaching-export',version:1,exportedAt:new Date().toISOString(),lists:lists,backup:{wordsets:board,assets:selectedAssets}};
  }
  function download(listId){
    var data=build(listId), blob=new Blob([JSON.stringify(data,null,2)],{type:'application/json;charset=utf-8'}),url=URL.createObjectURL(blob),a=document.createElement('a');
    var title=listId?data.lists[0].title:'全部词表';
    a.href=url;a.download='Minest-'+String(title||'词表').replace(/[\\/:*?"<>|\u0000-\u001f]/g,'_').slice(0,80)+'-'+new Date().toISOString().slice(0,10)+'.json';
    a.style.display='none';document.body.appendChild(a);
    try{a.click();}finally{a.remove();setTimeout(function(){URL.revokeObjectURL(url);},60000);}
    return data;
  }
  document.addEventListener('click',function(ev){
    var t=ev.target.closest&&ev.target.closest('[data-teaching-export]');if(!t)return;
    try{download(t.getAttribute('data-teaching-export')||null);}catch(error){
      var panel=t.closest('[data-teaching-sets]'),msg=panel&&panel.querySelector('[data-set-error]');if(msg)msg.textContent=error.message;
    }
  });
  window.MinestTeachingExport={build:build,download:download};
})();

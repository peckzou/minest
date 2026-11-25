import ENGLISH from './english.json';
(function () {
  'use strict';
  if (window.MinestWordlistPreview) return;
  const ID = 'minest-wordlist-preview';
  const HAN = /[\u3400-\u9fff]/;
  const ICONS = { '英文课':'🔤','中文课':'🏮','西班牙文课':'🌎','数学课':'🔢','体育课':'⚽','阅读课':'📖','跑步':'🏃','看书':'📖','画画':'🎨','听音乐':'🎧','唱歌':'🎤','游泳':'🏊','跳舞':'💃','骑车':'🚲','苹果':'🍎','香蕉':'🍌','葡萄':'🍇','草莓':'🍓','西瓜':'🍉','学校':'🏫','老师':'🧑‍🏫','学生':'🎒','同学':'🧑‍🤝‍🧑','教室':'🏫','书包':'🎒','课本':'📚','白板':'📝','桌子':'🪑','椅子':'🪑','熊猫':'🐼','猫':'🐱','狗':'🐶','兔子':'🐰','大象':'🐘','春天':'🌷','夏天':'☀️','秋天':'🍂','冬天':'❄️','太阳':'☀️','月亮':'🌙','水':'💧','一':'1️⃣','二':'2️⃣','三':'3️⃣' };
  const text = v => v == null ? '' : String(v).trim();
  const esc = v => text(v).replace(/[&<>"']/g, c => ({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[c]));
  const comparable = v => text(v).normalize('NFD').replace(/[\u0300-\u036f]/g, '').replace(/\s+/g,'').toLowerCase();
  let root = null, selected = '', oldFocus = null, overflow = '', pinyin = true, utterance = null;
  let fromManager = false, homeNeedsRefresh = false, returnWatcher = null, returnEpoch = 0;
  function stop() {
    if (utterance && window.speechSynthesis) window.speechSynthesis.cancel();
    utterance = null;
    if (root) root.querySelectorAll('[aria-pressed="true"]').forEach(b => b.setAttribute('aria-pressed', 'false'));
  }
  function close(handoff = false) {
    if (!root) return;
    stop(); const modal = root; root = null;
    modal.close(); modal.remove(); document.body.style.overflow = overflow;
    if (oldFocus && oldFocus.isConnected) oldFocus.focus({preventScroll:true});
    if (!handoff) {
      if (fromManager && !document.getElementById('minest-wordlists') && window.MinestWordlists) MinestWordlists.open();
      else if (homeNeedsRefresh && !fromManager && window.MinestLive && MinestLive.openTeacher) MinestLive.openTeacher();
      homeNeedsRefresh = false;
    }
  }
  function cancelReturn() {
    returnEpoch++;
    if (returnWatcher) returnWatcher.disconnect();
    returnWatcher = null;
  }
  function resumeAfter(selector, getId) {
    cancelReturn(); const epoch = returnEpoch;
    function check() {
      if (document.querySelector(selector)) return;
      if (returnWatcher) returnWatcher.disconnect();
      returnWatcher = null;
      setTimeout(() => {
        if (epoch !== returnEpoch || root || document.querySelector('#mn-set-editor,#mn-templates,#v3t')) return;
        open(getId(), {resume:true});
      }, 0);
    }
    returnWatcher = new MutationObserver(check);
    returnWatcher.observe(document.body, {childList:true,subtree:true});
    check();
  }
  function actionError(error, id) {
    if (!root) open(id, {resume:true});
    const message = root.querySelector('[data-wp-action-error]');
    if (message) message.textContent = error.message || String(error);
  }
  function launch(action) {
    const id = selected;
    try {
      const S = window.MinestTeachingSets, state = snapshot(id), board = S.read(), listId=state.list.id;
      if (action === 'export') {
        if (!window.MinestTeachingExport || !MinestTeachingExport.download) throw new Error('导出功能仍在加载，请稍后再试。');
        Promise.resolve(MinestTeachingExport.download(listId)).catch(e => actionError(e, id));
        return;
      }
      if (action === 'teaching' && !S.open || action === 'solo' && !S.arcade || action === 'edit' && !S.edit) throw new Error('教学功能仍在加载，请稍后再试。');
      if (['teaching','solo','assign'].includes(action) && !state.cards.some(c => c.zh)) throw new Error('先给这组词表添加词卡，再开始教学或闯关。');
      if (action === 'assign' && (!window.MinestVocab3D || !MinestVocab3D.assign)) throw new Error('布置功能仍在加载，请稍后再试。');
      if (action === 'manage' && !window.MinestWordlists) throw new Error('词表管理仍在加载，请稍后再试。');
      cancelReturn(); close(true);
      if (action !== 'manage' && document.getElementById('minest-wordlists') && window.MinestWordlists) MinestWordlists.close();
      if (action === 'teaching') {
        if (window.MinestLive) MinestLive.close();
        S.open({board, listId});
      } else if (action === 'solo') S.arcade(listId);
      else if (action === 'edit') {
        let editedId = id;
        homeNeedsRefresh=true;
        S.edit(listId, {onSave(result) { editedId=result && result.listId || id; }});
        resumeAfter('#mn-set-editor', () => editedId);
      } else if (action === 'assign') {
        MinestVocab3D.assign(board, {listIds:[listId]});
        resumeAfter('#v3t', () => id);
      } else if (action === 'manage') Promise.resolve(MinestWordlists.open()).catch(e => actionError(e, id));
    } catch (error) { actionError(error, id); }
  }
  function openHome() {
    try {
      const board=window.MinestTeachingSets.read(), lists=board.columns || [];
      const list=lists.find(c=>String(c.id)===selected) || lists.find(c=>String(c.id)===String(board.selected)) || lists.find(c=>!c.teachingListArchived) || lists[0];
      if (list) open(list.id);
    } catch (error) { actionError(error, selected); }
  }
  function safeImage(value) {
    if (typeof value !== 'string' || !value.trim()) return '';
    if (/^data:image\/(png|jpe?g|webp|gif|avif);/i.test(value)) return value;
    try { const u = new URL(value, location.href); return /^(https?:|blob:)$/.test(u.protocol) ? u.href : ''; } catch (_) { return ''; }
  }
  function snapshot(id) {
    const S = window.MinestTeachingSets;
    if (!S || typeof S.read !== 'function') throw new Error('词表仍在加载，请稍后再试。');
    const board = S.read(), lists = board.columns || [];
    const list = lists.find(c => String(c.id) === String(id));
    if (!list) throw new Error('这组词表已不存在，请关闭预览后重新选择。');
    const A = window.MinestTeachingAssets;
    let assets = {}, effective = [];
    try { if (A && A.forBoard) assets = A.forBoard(board.id) || {}; } catch (_) {}
    try { if (window.MinestTemplates && MinestTemplates.read) effective = MinestTemplates.read(board, list.id, true) || []; } catch (_) {}
    const cards = (list.cards || []).filter(c => !c.teachingArchived).map(c => {
      const a = assets[c.id] || {}, w = effective.find(w => String(w.id) === String(c.id)) || {};
      const zh = text(w.front || c.title || c.term || c.word);
      let py = text(c.pinyin || c.py || a.pinyin || w.py);
      if (!py && HAN.test(zh) && A && A.pinyin) { try { py = text(A.pinyin(zh)); } catch (_) {} }
      if (HAN.test(py)) py = '';
      let en = text(c.en || c.english || c.translation || (a.definitions && (a.definitions.en || a.definitions.english)) || w.en);
      if (!en) {
        const parts = text(w.back || c.desc).split(/\n|\s[·|]\s/);
        en = parts.find(s => /[a-z]/i.test(s) && !HAN.test(s) && !/https?:\/\/|!\[|\]\(/i.test(s) && comparable(s) !== comparable(py)) || '';
      }
      en = en || (Object.prototype.hasOwnProperty.call(ENGLISH, zh) ? ENGLISH[zh] : '') || '';
      let image = '';
      try { image = a.image && A && A.resolve ? A.resolve(a.image) : ''; } catch (_) {}
      image = safeImage(image) || safeImage(c.cover && c.cover.type === 'image' && (c.cover.value || c.cover.url)) || safeImage(c.image) || safeImage(w.hasCustomImage && w.image);
      return {id:c.id, zh, py, en, image, icon:text(c.icon || a.icon || ICONS[zh] || '📚')};
    });
    return {list, lists, cards};
  }
  function ruby(w) {
    if (!w.py || !HAN.test(w.zh)) return '<span class="wp-front">'+esc(w.zh || '未填写词语')+'</span>';
    const chars = Array.from(w.zh), tokens = w.py.split(/\s+/).filter(Boolean);
    let at = 0;
    if (tokens.length === chars.filter(c => HAN.test(c)).length) {
      return '<span class="'+(pinyin?'':'cn-pinyin-off')+'" lang="zh-CN"><ruby>'+chars.map(c => HAN.test(c) ? esc(c)+'<rt>'+esc(tokens[at++])+'</rt>' : esc(c)).join('')+'</ruby></span>';
    }
    return '<span class="'+(pinyin?'':'cn-pinyin-off')+'" lang="zh-CN"><ruby>'+esc(w.zh)+'<rt>'+esc(w.py)+'</rt></ruby></span>';
  }
  function say(w, button) {
    stop(); const status = root && root.querySelector('[data-wp-voice]');
    if (!window.speechSynthesis || !window.SpeechSynthesisUtterance) { if (status) status.textContent='此浏览器不支持朗读，可以看拼音跟读。'; return; }
    const u = new SpeechSynthesisUtterance(w.zh); utterance = u;
    u.lang = HAN.test(w.zh) ? 'zh-CN' : 'en-US'; u.rate = .72;
    const voices = window.speechSynthesis.getVoices();
    const voice = voices.find(v => HAN.test(w.zh) ? /^zh[-_](CN|Hans)/i.test(v.lang) : /^en[-_]US/i.test(v.lang));
    if (voice) u.voice = voice;
    button.setAttribute('aria-pressed','true'); status.textContent='正在朗读：'+w.zh+(w.py?' · '+w.py:'');
    u.onend = () => { if (utterance !== u) return; utterance=null; if (button.isConnected) button.setAttribute('aria-pressed','false'); if (status.isConnected) status.textContent='点击词卡，听发音。'; };
    u.onerror = () => { if (utterance !== u) return; utterance=null; if (button.isConnected) button.setAttribute('aria-pressed','false'); if (status.isConnected) status.textContent='设备语音暂不可用，可以看拼音跟读。'; };
    window.speechSynthesis.speak(u);
  }
  function draw() {
    stop(); const main = root.querySelector('main');
    let state; try { state = snapshot(selected); } catch (e) { main.innerHTML='<section class="cn-card"><p role="alert">'+esc(e.message)+'</p></section>'; return; }
    const {list, lists, cards} = state;
    root.querySelector('[data-wp-subtitle]').textContent = list.title || '教学词表';
    const playable=cards.some(c=>c.zh), S=window.MinestTeachingSets;
    main.innerHTML='<div class="wp-picker"><label>切换词表<select data-wp-group aria-label="切换词表">'+lists.map(c => '<option value="'+esc(c.id)+'"'+(String(c.id)===String(selected)?' selected':'')+'>'+esc(c.title)+(c.teachingListArchived?' · 已归档':'')+'</option>').join('')+'</select></label><button type="button" class="wp-secondary" data-wp-action="manage">管理词表</button></div>'
      +'<nav class="wp-actions" aria-label="当前词表的教学操作"><button type="button" class="wp-teaching" data-wp-action="teaching"'+(playable && S.open?'':' disabled')+'><b>▦ Teaching</b><small>开始上课</small></button><button type="button" class="wp-solo" data-wp-action="solo"'+(playable && S.arcade?'':' disabled')+'><b>🎮 Solo</b><small>学生闯关</small></button><button type="button" class="wp-secondary" data-wp-action="edit"'+(S.edit?'':' disabled')+'>✎ 编辑词表</button><button type="button" class="wp-secondary" data-wp-action="assign"'+(playable && !list.teachingListArchived && window.MinestVocab3D?'':' disabled')+'>🎓 布置给学生</button><button type="button" class="wp-secondary" data-wp-action="export">↑ 导出词表</button></nav><p class="wp-action-error" data-wp-action-error role="alert"></p>'
      +'<section class="cn-card"><div class="cn-row wp-title"><h2>📚 '+esc(list.title)+' · '+cards.length+' 个词</h2><label class="cn-switch"><input type="checkbox" data-wp-pinyin '+(pinyin?'checked':'')+'>拼音辅助</label></div><p>每个汉字上方显示已有或本地生成的声调拼音。点词卡，听发音。</p>'
      +'<div class="cn-grid">'+cards.map((w,i) => '<button type="button" class="cn-word'+(Array.from(w.zh).length>10?' wp-long':'')+'" data-wp-word="'+i+'" aria-pressed="false"'+(w.zh?'':' disabled')+' aria-label="'+esc(w.zh?'朗读 '+w.zh:'空白词卡')+'">'+(w.image?'<img class="wp-image" src="'+esc(w.image)+'" alt="'+esc(w.zh)+'" loading="lazy" decoding="async">':'')+'<span class="cn-icon"'+(w.image?' hidden':'')+' aria-hidden="true">'+esc(w.icon)+'</span>'+ruby(w)+'<span class="cn-english'+(w.en?'':' wp-missing')+'">'+esc(w.en || '暂无英文释义')+'</span></button>').join('')+'</div>'
      +(cards.length?'':'<div class="wp-empty">📚<p>这组还没有词卡，点击“编辑词表”开始添加。</p></div>')+'<p class="cn-note" data-wp-voice role="status" aria-live="polite">点击词卡，听发音。</p></section>';
    main.querySelectorAll('[data-wp-action]').forEach(button => { button.onclick=()=>launch(button.dataset.wpAction); });
    main.querySelector('[data-wp-group]').onchange = e => { selected=e.target.value; draw(); root.querySelector('[data-wp-group]').focus({preventScroll:true}); main.scrollTop=0; };
    main.querySelector('[data-wp-pinyin]').onchange = e => {
      pinyin=e.target.checked;
      main.querySelectorAll('.cn-word [lang="zh-CN"]').forEach(el => el.classList.toggle('cn-pinyin-off', !pinyin));
    };
    main.querySelectorAll('[data-wp-word]').forEach(button => { button.onclick=() => say(cards[+button.dataset.wpWord],button); });
    main.querySelectorAll('.wp-image').forEach(image => { image.onerror=() => { image.hidden=true; image.parentElement.querySelector('.cn-icon').hidden=false; }; });
  }
  function open(id, options = {}) {
    cancelReturn();
    selected=String(id);
    if (root) { draw(); return; }
    if (!options.resume) { oldFocus=document.activeElement; fromManager=!!document.getElementById('minest-wordlists'); homeNeedsRefresh=false; }
    overflow=document.body.style.overflow; pinyin=true;
    root=document.createElement('dialog'); root.id=ID; root.lang='zh-CN'; root.setAttribute('aria-label','词卡预览页');
    root.innerHTML='<header><strong>📚 词卡预览页<small data-wp-subtitle></small></strong><button type="button" data-wp-close aria-label="返回词表">← 返回词表</button></header><main></main>';
    document.body.appendChild(root); document.body.style.overflow='hidden';
    root.querySelector('[data-wp-close]').onclick=()=>close();
    root.addEventListener('cancel',e=>{e.preventDefault();close();});
    ['click','keydown','pointerdown','wheel'].forEach(type => root.addEventListener(type,e=>e.stopPropagation(),{passive:true}));
    draw(); root.showModal(); root.querySelector('[data-wp-close]').focus({preventScroll:true});
  }
  function enhance(scope) {
    if (!window.MinestTeachingSets) return;
    const rows=[]; if (scope.matches && scope.matches('[data-set-row],[data-wm-row]')) rows.push(scope);
    if (scope.querySelectorAll) rows.push(...scope.querySelectorAll('[data-set-row],[data-wm-row]'));
    rows.forEach(row => {
      if (row.querySelector('[data-wordlist-preview]')) return;
      const edit=row.querySelector('[data-set-edit],[data-wm-edit]'); if (!edit) return;
      const id=row.getAttribute('data-set-row') || row.getAttribute('data-wm-row');
      const button=document.createElement('button'); button.type='button'; button.className=edit.className; button.textContent='预览词卡'; button.setAttribute('data-wordlist-preview',id);
      button.onclick=e=>{e.preventDefault();e.stopPropagation();open(id);}; edit.after(button);
    });
    const homes=[];
    if (scope.matches && scope.matches('[data-teaching-sets]')) homes.push(scope);
    if (scope.closest) { const home=scope.closest('[data-teaching-sets]'); if(home) homes.push(home); }
    if (scope.querySelectorAll) homes.push(...scope.querySelectorAll('[data-teaching-sets]'));
    homes.forEach(home => {
      const toolbar=home.querySelector('.tl-toolbar');
      if (!toolbar || home.querySelector('[data-wordlist-preview-home]')) return;
      const button=document.createElement('button');button.type='button';button.className='mlv-btn alt';button.textContent='▦ 词卡预览页';button.setAttribute('data-wordlist-preview-home','');
      try { button.disabled=!(MinestTeachingSets.read().columns || []).length; } catch (_) { button.disabled=true; }
      button.onclick=openHome;toolbar.prepend(button);
    });
  }
  function start() {
    enhance(document);
    new MutationObserver(records=>records.forEach(record=>record.addedNodes.forEach(node=>{ if (node.nodeType===1 && !node.hasAttribute('data-wordlist-preview') && !node.hasAttribute('data-wordlist-preview-home')) enhance(node); }))).observe(document.body,{childList:true,subtree:true});
  }
  window.MinestWordlistPreview={open,close:()=>{cancelReturn();close();},openHome};
  if (document.body) start(); else document.addEventListener('DOMContentLoaded',start,{once:true});
})();

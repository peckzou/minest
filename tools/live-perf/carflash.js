/* 53.829 · 🚗 车载闪卡 (CarPlay flashcards) — the iPhone side.  53.830: + 🎓 GPT 学习 (GPT Study) mode.
   Two modes, one list, one progress record:
   · 自动播放 (Auto Play) — as before: pick a list, an interval and the order, then Start; words change by time.
   · GPT 学习 (GPT Study) — for studying with the official ChatGPT app's voice: the card stays until you press Next.
     Progress (seen / learned / rounds / where you are) is kept per list by gptstudy.js, so Continue Study resumes at the
     right card the next day and no card is skipped. 📤 shares the study session (plain text) to ChatGPT via the iOS share
     sheet — sharing does not connect ChatGPT to Minest.
   The iOS app (CarFlashController) writes the current word into the App Group playlist: the CarPlay widget, the Live
   Activity and Siri all show / use it. Bridge: carFlashStart {words, listName, interval, shuffle | mode:'gpt', cardIds,
   listKey} · carFlashToggle · carFlashNext · carFlashStop · carFlashState · share {text}; the app answers with the native
   event "carFlash" {playing, paused, word, index, total, listName, interval, mode, listKey, cardId, seq, events, error}.
   In a browser there is no Live Activity: the panel plays / steps by itself, so the flow can be tried. */
(function(){'use strict';
if (window.MinestCarFlash) return;
var KEY = 'minest.carflash.v1';
function esc(s){ return String(s == null ? '' : s).replace(/[&<>"']/g, function(c){ return { '&':'&amp;', '<':'&lt;', '>':'&gt;', '"':'&quot;', "'":'&#39;' }[c]; }); }
function native(){ try { return window.webkit && webkit.messageHandlers && webkit.messageHandlers.minestBridge; } catch(e){ return null; } }
function post(action, extra){ var h = native(); if (!h) return false; try { h.postMessage(Object.assign({ action: action }, extra || {})); return true; } catch(e){ return false; } }
function prefs(){ try { return JSON.parse(localStorage.getItem(KEY) || '{}') || {}; } catch(e){ return {}; } }
function savePrefs(p){ try { localStorage.setItem(KEY, JSON.stringify(p)); } catch(e){} }
function plain(s){ var d = document.createElement('div'); d.innerHTML = String(s || ''); return (d.textContent || '').replace(/\s+/g, ' ').trim(); }
function G(){ return window.MinestGPTStudy; }

/* every list that can play: board lists, then Teaching word lists */
function sources(){
  var out = [];
  try { (window.MinestAI && MinestAI.boards ? MinestAI.boards() : []).forEach(function(b){ (b.columns || []).forEach(function(c){
    var cards = []; (c.cards || []).forEach(function k(x){ if (!x || x.teachingArchived) return; cards.push(x); (x.stack || []).forEach(k); });
    if (cards.length) out.push({ id: 'b:' + b.id + ':' + c.id, group: b.title || 'Board', title: c.title || 'List', cards: cards });
  }); }); } catch(e){}
  try { var T = window.MinestTeachingSets && MinestTeachingSets.read(); (T && T.columns || []).forEach(function(c){
    var cards = (c.cards || []).filter(function(x){ return x && !x.teachingArchived; });
    if (cards.length) out.push({ id: 't:' + c.id, group: '📚 Teaching 词表', title: c.title || '词表', cards: cards });
  }); } catch(e){}
  return out;
}
function wordOf(c, side){
  var front = plain(c.title || c.front), back = plain(c.en || c.desc || c.description || c.back);
  var w = side === 'back' ? back : side === 'auto' ? (/[A-Za-z]/.test(front) && !/[㐀-鿿]/.test(front) ? front : (c.en ? plain(c.en) : back) || front) : front;
  return w.slice(0, 60);
}
function wordsOf(src, side){
  var seen = {};
  return src.cards.map(function(c){ return wordOf(c, side); }).filter(function(w){ if (!w || seen[w]) return false; seen[w] = 1; return true; });
}
/* GPT Study: every card keeps its own stable ID (no de-duplication by word) */
function itemsOf(src, side){
  var ids = {};
  return src.cards.map(function(c, i){ var id = String(c.id != null ? c.id : 'i' + i); if (ids[id]) id += '#' + i; ids[id] = 1; return { id: id, word: wordOf(c, side) }; }).filter(function(it){ return it.word; });
}
function findSource(key){ return sources().filter(function(s){ return s.id === key; })[0] || null; }

var ov = null, st = { playing: false, paused: false, word: '', index: 0, total: 0, listName: '' }, webTimer = 0, webWords = [];
var gs = null;   /* GPT Study on show: { key, name, items } */
function mode(){ return prefs().mode === 'gpt' ? 'gpt' : 'auto'; }

function open(){
  if (ov) { ov.remove(); }
  var p = prefs(), list = sources(), gpt = mode() === 'gpt';
  ov = document.createElement('div'); ov.className = 'cf-ov'; ov.setAttribute('role', 'dialog'); ov.setAttribute('aria-label', '车载闪卡');
  ov.innerHTML = '<div class="cf-box"><header class="cf-top"><b>🚗 车载闪卡 · CarPlay</b><button type="button" class="cf-x" data-cf-close aria-label="关闭">✕</button></header>' +
    '<section class="cf-setup" data-cf-setup>' +
      '<div class="cf-f">模式<div class="cf-chips" data-cf-mode><button type="button" data-v="auto"' + (!gpt ? ' class="on"' : '') + '>⏱ 自动播放</button><button type="button" data-v="gpt"' + (gpt ? ' class="on"' : '') + '>🎓 GPT 学习</button></div></div>' +
      (list.length ? '<label class="cf-f">词表<select data-cf-list>' + groups(list, p.list) + '</select></label>' : '<p class="cf-warn">还没有可用的词表。先在看板或 Teaching 词表里加词。</p>') +
      '<div class="cf-f">显示<div class="cf-chips" data-cf-side>' + [['auto', '英文优先'], ['front', '正面'], ['back', '背面']].map(function(o){ return '<button type="button" data-v="' + o[0] + '"' + ((p.side || 'auto') === o[0] ? ' class="on"' : '') + '>' + o[1] + '</button>'; }).join('') + '</div></div>' +
      '<div data-cf-auto' + (gpt ? ' hidden' : '') + '>' +
        '<div class="cf-f">每个词停留<div class="cf-chips" data-cf-int>' + [5, 8, 10, 15, 20, 30].map(function(n){ return '<button type="button" data-v="' + n + '"' + ((p.interval || 10) === n ? ' class="on"' : '') + '>' + n + ' 秒</button>'; }).join('') + '</div></div>' +
        '<div class="cf-f">顺序<div class="cf-chips" data-cf-order><button type="button" data-v="seq"' + (!p.shuffle ? ' class="on"' : '') + '>按顺序</button><button type="button" data-v="mix"' + (p.shuffle ? ' class="on"' : '') + '>随机</button></div></div>' +
        '<p class="cf-count" data-cf-count></p>' +
        '<button type="button" class="cf-go" data-cf-start' + (list.length ? '' : ' disabled') + '>▶ 开始播放</button>' +
      '</div>' +
      '<div data-cf-gpt' + (gpt ? '' : ' hidden') + '>' +
        '<div class="cf-prog" data-cf-prog></div>' +
        '<button type="button" class="cf-go" data-cf-continue>▶ Continue Study · 继续学习</button>' +
        '<div class="cf-row2"><button type="button" class="cf-stop" data-cf-review>↺ Review Seen</button><button type="button" class="cf-stop" data-cf-restart>⟳ Restart Round</button></div>' +
        '<button type="button" class="cf-stop cf-wide" data-cf-share-open>📤 Share to ChatGPT</button>' +
      '</div>' +
      '<p class="cf-note" data-cf-note></p>' +
    '</section>' +
    '<section class="cf-play" data-cf-play hidden><p class="cf-list" data-cf-name></p><div class="cf-word" data-cf-word></div><p class="cf-pos" data-cf-pos></p>' +
      '<div class="cf-row" data-cf-autorow><button type="button" class="cf-go" data-cf-toggle>⏸ Pause</button><button type="button" class="cf-stop" data-cf-next aria-label="下一个">⏭</button><button type="button" class="cf-stop" data-cf-stop>■ 结束</button></div>' +
      '<div data-cf-gptrow hidden>' +
        '<div class="cf-row3"><button type="button" class="cf-stop" data-cf-prev>◀ Previous</button><button type="button" class="cf-go" data-cf-gnext>Next Card ▶</button></div>' +
        '<button type="button" class="cf-stop cf-wide" data-cf-learned>✓ Mark Learned</button>' +
        '<div class="cf-row2"><button type="button" class="cf-stop" data-cf-share-open2>📤 分享给 ChatGPT</button><button type="button" class="cf-stop" data-cf-gstop>■ 结束</button></div>' +
      '</div>' +
      '<p class="cf-err" data-cf-err role="status"></p></section>' +
    '<section class="cf-share" data-cf-share hidden>' +
      '<div class="cf-f">分享范围<div class="cf-chips" data-cf-scope><button type="button" data-v="remaining" class="on">接下来未完成的</button><button type="button" data-v="all">整个 List</button></div></div>' +
      '<div class="cf-f">每批<div class="cf-chips" data-cf-size>' + [20, 25, 30].map(function(n){ return '<button type="button" data-v="' + n + '"' + (n === 25 ? ' class="on"' : '') + '>' + n + ' 个</button>'; }).join('') + '</div></div>' +
      '<div class="cf-batch"><button type="button" class="cf-stop" data-cf-bprev>◀</button><span data-cf-bnum></span><button type="button" class="cf-stop" data-cf-bnext>▶</button></div>' +
      '<textarea class="cf-preview" data-cf-preview readonly rows="9"></textarea>' +
      '<div class="cf-row3"><button type="button" class="cf-stop" data-cf-share-back>← 返回</button><button type="button" class="cf-go" data-cf-share-go>📤 分享</button></div>' +
      '<p class="cf-note">分享只是把学习内容发给 ChatGPT，并没有让 ChatGPT 和 Minest 实时连接。学到哪里，回 Minest 点 Next Card。</p>' +
    '</section></div>';
  document.body.appendChild(ov);
  var q = function(s){ return ov.querySelector(s); };
  function chips(sel, key, conv, after){ [].forEach.call(ov.querySelectorAll(sel + ' button'), function(b){ b.onclick = function(){ [].forEach.call(ov.querySelectorAll(sel + ' button'), function(x){ x.classList.toggle('on', x === b); }); if (key) { var pp = prefs(); pp[key] = conv(b.dataset.v); savePrefs(pp); } if (after) after(b.dataset.v); count(); }; }); }
  chips('[data-cf-int]', 'interval', function(v){ return +v; });
  chips('[data-cf-order]', 'shuffle', function(v){ return v === 'mix'; });
  chips('[data-cf-side]', 'side', function(v){ return v; });
  chips('[data-cf-mode]', 'mode', function(v){ return v; }, function(v){ q('[data-cf-auto]').hidden = v === 'gpt'; q('[data-cf-gpt]').hidden = v !== 'gpt'; note(); });
  function current(){ var sel = q('[data-cf-list]'); return sel ? list.filter(function(s){ return s.id === sel.value; })[0] : null; }
  function count(){
    var s = current(), el = q('[data-cf-count]'); if (el) { var w = s ? wordsOf(s, prefs().side || 'auto') : []; el.textContent = s ? w.length + ' 个词 · 例如：' + w.slice(0, 4).join(' · ') : ''; }
    progress();
  }
  function progress(){
    var box = q('[data-cf-prog]'), s = current(); if (!box) return; if (!s || !G()) { box.innerHTML = ''; return; }
    var items = itemsOf(s, prefs().side || 'auto'), x = G().stats(s.id, s.title, items), L = G().get(s.id);
    var cur = L && L.current ? items[G().posOf(items, L.current)] : null;
    box.innerHTML = '<b>' + esc(s.title) + '</b>' +
      '<div class="cf-stats"><span>Total<b>' + x.total + '</b></span><span>Seen<b>' + x.seen + '</b></span><span>Learned<b>' + x.learned + '</b></span><span>Remaining<b>' + x.remaining + '</b></span></div>' +
      '<small>第 ' + x.round + ' 轮 · Last Studied: ' + lastText(x.last) + (cur ? ' · 上次停在 ' + esc(cur.word) + '（' + x.position + '/' + x.total + '）' : '') + '</small>';
    q('[data-cf-review]').disabled = !x.seen;
  }
  function note(){ q('[data-cf-note]').textContent = mode() === 'gpt'
    ? 'GPT 学习：单词不会自动切换，学完一个点 Next Card。进度按词表分别保存，明天点「继续学习」从正确位置接着学。' + (native() ? '' : '（浏览器预览：CarPlay 同步需要 Minest iOS App。）')
    : (native() ? '车上：CarPlay 仪表盘会显示 Minest 的单词。播放时请让 Minest 保持在手机前台（ChatGPT 语音可在后台继续）。' : '浏览器预览：这里只在本页播放；CarPlay 同步需要 Minest iOS App。'); }
  note();
  if (q('[data-cf-list]')) q('[data-cf-list]').onchange = function(){ var pp = prefs(); pp.list = this.value; savePrefs(pp); count(); };
  count();
  q('[data-cf-close]').onclick = close;
  q('[data-cf-start]').onclick = function(){
    var s = current(); if (!s) return; var pp = prefs(), words = wordsOf(s, pp.side || 'auto'); if (!words.length) { err('这个词表没有可以显示的词。'); return; }
    gs = null;
    var msg = { words: words, listName: s.title, interval: pp.interval || 10, shuffle: !!pp.shuffle };
    if (!post('carFlashStart', msg)) webStart(msg);
  };
  q('[data-cf-toggle]').onclick = function(){ if (!post('carFlashToggle')) webToggle(); };
  q('[data-cf-next]').onclick = function(){ if (!post('carFlashNext')) webNext(); };
  q('[data-cf-stop]').onclick = function(){ if (!post('carFlashStop')) webStop(); };
  /* GPT Study */
  function gptGo(what){
    var s = current(); if (!s) return; var items = itemsOf(s, prefs().side || 'auto'); if (!items.length) { err('这个词表没有可以显示的词。'); return; }
    gs = { key: s.id, name: s.title, items: items };
    var r = G().act(s.id, s.title, items, what);
    if (!r.id) { progress(); q('[data-cf-prog]').insertAdjacentHTML('beforeend', '<p class="cf-done">' + (what === 'review' ? '还没有已看过的卡片可以复习。' : '🎉 这一轮已经全部完成！可以点「新一轮」再学一遍，或「复习」。') + '</p>'); gs = null; return; }
    showGPT();
  }
  q('[data-cf-continue]').onclick = function(){ gptGo('continue'); };
  q('[data-cf-review]').onclick = function(){ gptGo('review'); };
  q('[data-cf-restart]').onclick = function(){ if (window.confirm('开始新一轮？之前的学习记录都会保留，只是从头再走一遍。')) gptGo('restart'); };
  q('[data-cf-gnext]').onclick = function(){ step('next'); };
  q('[data-cf-prev]').onclick = function(){ step('prev'); };
  q('[data-cf-learned]').onclick = function(){ step('learned'); };
  q('[data-cf-gstop]').onclick = function(){ post('carFlashStop'); gs = null; st = { playing: false }; paint(); count(); };
  /* share */
  var share = { scope: 'remaining', size: 25, batch: 1 };
  function shareOpen(){ var s = gs ? findSource(gs.key) : current(); if (!s) return; share.src = s; share.batch = 1; q('[data-cf-setup]').hidden = true; q('[data-cf-play]').hidden = true; q('[data-cf-share]').hidden = false; sharePaint(); }
  function sharePaint(){ var s = share.src, items = itemsOf(s, prefs().side || 'auto'), t = G().shareText(s.id, s.title, items, share.scope, share.batch, share.size); share.batch = t.batch; share.text = t.text; q('[data-cf-preview]').value = t.text; q('[data-cf-bnum]').textContent = '第 ' + t.batch + ' / ' + t.pages + ' 批 · ' + t.count + ' 个词'; q('[data-cf-bprev]').disabled = t.batch <= 1; q('[data-cf-bnext]').disabled = t.batch >= t.pages; }
  chips('[data-cf-scope]', null, null, function(v){ share.scope = v; share.batch = 1; sharePaint(); });
  chips('[data-cf-size]', null, null, function(v){ share.size = +v; share.batch = 1; sharePaint(); });
  q('[data-cf-bprev]').onclick = function(){ share.batch--; sharePaint(); };
  q('[data-cf-bnext]').onclick = function(){ share.batch++; sharePaint(); };
  q('[data-cf-share-open]').onclick = shareOpen;
  q('[data-cf-share-open2]').onclick = shareOpen;
  q('[data-cf-share-back]').onclick = function(){ q('[data-cf-share]').hidden = true; paint(); };
  q('[data-cf-share-go]').onclick = function(){
    var text = share.text; if (!text) return;
    if (post('share', { text: text })) return;
    if (navigator.share) { navigator.share({ text: text }).catch(function(){}); return; }
    try { navigator.clipboard.writeText(text).then(function(){ alert('已复制学习内容，粘贴到 ChatGPT 即可。'); }); } catch(e){ q('[data-cf-preview]').select(); }
  };
  post('carFlashState');
  paint();
}
function lastText(t){ if (!t) return '—'; var d = new Date(t), n = new Date(); var days = Math.round((new Date(n.toDateString()) - new Date(d.toDateString())) / 864e5); return days === 0 ? 'Today' : days === 1 ? 'Yesterday' : d.toLocaleDateString(); }
function groups(list, sel){
  var g = {}, order = []; list.forEach(function(s){ if (!g[s.group]) { g[s.group] = []; order.push(s.group); } g[s.group].push(s); });
  var has = list.some(function(s){ return s.id === sel; });
  return order.map(function(k){ return '<optgroup label="' + esc(k) + '">' + g[k].map(function(s, i){ return '<option value="' + esc(s.id) + '"' + ((has ? s.id === sel : (k === order[0] && i === 0)) ? ' selected' : '') + '>' + esc(s.title) + ' · ' + s.cards.length + '</option>'; }).join('') + '</optgroup>'; }).join('');
}

/* GPT Study: show the current card here and send the study queue to the app (CarPlay widget / Live Activity / Siri) */
function showGPT(){
  if (!gs) return; var L = G().get(gs.key); if (!L || !L.current) return;
  var ids = G().queue(gs.key, gs.items, 300), byId = {}; gs.items.forEach(function(it){ byId[it.id] = it.word; });
  ids = ids.filter(function(id){ return byId[id]; });
  G().resetNativeSeq(gs.key);
  post('carFlashStart', { mode: 'gpt', words: ids.map(function(id){ return byId[id]; }), cardIds: ids, listName: gs.name, listKey: gs.key });
  paint();
}
function step(what){
  if (!gs) return;
  var r = G().act(gs.key, gs.name, gs.items, what);
  if (what === 'learned') { paint(); return; }
  if (!r.id) { err(what === 'prev' ? '已经是第一张了。' : (r.L.mode === 'review' ? '复习完了 ✓' : '🎉 这一轮全部完成！回到设置可以开始新一轮。')); return; }
  err(''); showGPT();
}
function close(){ if (ov) { ov.remove(); ov = null; } }
function err(t){ var e = ov && ov.querySelector('[data-cf-err]'); if (e) e.textContent = t || ''; if (t && ov && !st.playing && !gs) { var n = ov.querySelector('[data-cf-count]'); if (n) n.textContent = t; } }
/* the longest single word fits on one line (heavy capitals are ~0.84 em wide); lines break only between words */
function fit(w, text){ var longest = Math.max.apply(null, text.split(/\s+/).map(function(x){ return x.length; }).concat([4])); w.textContent = text; w.style.fontSize = Math.max(20, Math.min(92, Math.floor((w.clientWidth || 300) / (longest * 0.84)), text.length > 28 ? 44 : 92)) + 'px'; }
function paint(){
  if (!ov) return; var q = function(s){ return ov.querySelector(s); };
  if (!q('[data-cf-share]').hidden) return;
  var gptOn = !!(gs && G() && G().get(gs.key) && G().get(gs.key).current);
  var playing = gptOn || st.playing;
  q('[data-cf-setup]').hidden = playing; q('[data-cf-play]').hidden = !playing;
  q('[data-cf-autorow]').hidden = gptOn; q('[data-cf-gptrow]').hidden = !gptOn;
  if (!playing) return;
  if (gptOn) {
    var L = G().get(gs.key), x = G().stats(gs.key, gs.name, gs.items), c = L.cards[L.current] || {}, it = gs.items[G().posOf(gs.items, L.current)];
    fit(q('[data-cf-word]'), String(it ? it.word : '').toUpperCase());
    q('[data-cf-name]').textContent = gs.name + (L.mode === 'review' ? ' · 复习' : ' · GPT 学习');
    q('[data-cf-pos]').textContent = x.position + ' / ' + x.total + ' · Seen ' + x.seen + ' · Learned ' + x.learned + ' · 本轮剩 ' + x.remaining + (c.learned ? ' · ✓ 已掌握' : '');
    var lb = q('[data-cf-learned]'); lb.textContent = c.learned ? '✓ 已掌握（点按取消）' : '✓ Mark Learned'; lb.classList.toggle('on', !!c.learned);
    return;
  }
  fit(q('[data-cf-word]'), String(st.word || '').toUpperCase());
  q('[data-cf-name]').textContent = st.listName || ''; q('[data-cf-pos]').textContent = (st.index + 1) + ' / ' + st.total + (st.paused ? ' · 已暂停' : '');
  var t = q('[data-cf-toggle]'); t.textContent = st.paused ? '▶ Resume' : '⏸ Pause'; t.classList.toggle('paused', !!st.paused);
}
window.addEventListener('minestNativeEvent', function(e){
  var d = e.detail || {}; if (d.event !== 'carFlash') return; var p = d.payload || {};
  if (p.mode === 'gpt' && p.listKey && G()) {
    /* Next taps made on the CarPlay widget / Siri while this page slept: record them in the study progress */
    var src = findSource(p.listKey);
    if (src) {
      var items = itemsOf(src, prefs().side || 'auto');
      G().applyNative(p.listKey, src.title, items, p.events || [], p.seq || 0);
      if (p.playing) gs = { key: p.listKey, name: src.title, items: items }; else if (gs && gs.key === p.listKey) gs = null;
    }
    st = { playing: false }; paint(); err(p.error || ''); return;
  }
  st = { playing: !!p.playing, paused: !!p.paused, word: p.word || '', index: p.index || 0, total: p.total || 0, listName: p.listName || '' };
  if (p.playing) gs = null;
  paint(); err(p.error || '');
});

/* browser preview: the panel plays by itself */
function webStart(m){ webWords = m.shuffle ? m.words.slice().sort(function(){ return Math.random() - .5; }) : m.words.slice(); st = { playing: true, paused: false, word: webWords[0], index: 0, total: webWords.length, listName: m.listName, interval: m.interval }; webTick(); paint(); }
function webTick(){ clearInterval(webTimer); if (!st.playing || st.paused) return; webTimer = setInterval(function(){ st.index = (st.index + 1) % webWords.length; st.word = webWords[st.index]; paint(); }, (st.interval || 10) * 1000); }
function webToggle(){ if (!st.playing) return; st.paused = !st.paused; webTick(); paint(); }
function webNext(){ if (!st.playing) return; st.index = (st.index + 1) % webWords.length; st.word = webWords[st.index]; webTick(); paint(); }
function webStop(){ clearInterval(webTimer); st = { playing: false, paused: false, word: '', index: 0, total: 0, listName: '' }; paint(); }

/* entries: a 🚗 tab in the bottom dock (iOS app, or ?carflash in a browser) and a button in the word-list editor */
function entries(){
  if (native() || /[?&]carflash\b/.test(location.search)) {
    /* the right-side glass column (mn-bdock) — the layout the phone uses — gets a car tile next to Study Arcade */
    var side = document.querySelector('.mn-bdock');
    if (side && !side.querySelector('[data-carflash-dock]')) {
      var t = document.createElement('button'); t.type = 'button'; t.className = 'mn-bapp mdk-tile mdk-t'; t.setAttribute('data-carflash-dock', ''); t.title = '车载闪卡 · CarPlay'; t.setAttribute('aria-label', '车载闪卡 · CarPlay');
      t.innerHTML = '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.8" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true"><path d="M5 16.5V12l1.8-4.6A2 2 0 0 1 8.7 6h6.6a2 2 0 0 1 1.9 1.4L19 12v4.5"/><path d="M4 12h16v4.5H4z"/><circle cx="7.5" cy="14.3" r=".9" fill="currentColor" stroke="none"/><circle cx="16.5" cy="14.3" r=".9" fill="currentColor" stroke="none"/><path d="M6 16.5V18M18 16.5V18"/></svg>';
      t.onclick = open;
      var after = side.querySelector('button[title="Study Arcade"]'); if (after && after.nextSibling) side.insertBefore(t, after.nextSibling); else side.appendChild(t);
    }
    var dock = document.querySelector('nav.ios-bottom-tab-bar');
    if (dock && !dock.querySelector('[data-carflash-dock]')) {
      var b = document.createElement('button'); b.type = 'button'; b.className = 'ios-tab-item'; b.setAttribute('data-carflash-dock', ''); b.title = '车载闪卡 · CarPlay';
      b.innerHTML = '<span class="ios-tab-icon" aria-hidden="true">🚗</span><span class="ios-tab-label">车载</span>'; b.onclick = open; dock.appendChild(b);
    }
  }
  var bar = document.querySelector('#mn-set-editor .se819-lists');
  if (bar && !bar.querySelector('[data-carflash-ed]')) { var e = document.createElement('button'); e.type = 'button'; e.setAttribute('data-carflash-ed', ''); e.textContent = '🚗 车载闪卡'; e.onclick = open; bar.appendChild(e); }
}
var queued = false;
new MutationObserver(function(){ if (queued) return; queued = true; requestAnimationFrame(function(){ queued = false; entries(); }); }).observe(document.documentElement, { childList: true, subtree: true });
entries();
/* the app came back from the background: catch up with Next taps made on the widget / Siri */
document.addEventListener('visibilitychange', function(){ if (!document.hidden) post('carFlashState'); });
setTimeout(function(){ post('carFlashState'); }, 2500);

window.MinestCarFlash = { open: open, close: close, sources: sources, itemsOf: itemsOf, version: '53.830' };
})();

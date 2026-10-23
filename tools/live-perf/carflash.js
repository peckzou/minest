/* 53.829 · 🚗 车载闪卡 (CarPlay flashcards) — the iPhone side.
   Pick a list (any board list, or a Teaching word list), an interval and the order, then Start. The iOS app
   (CarFlashController) writes the current word into Minest's Live Activity; CarPlay's Dashboard shows its small layout:
   one big English word and one ⏸ Pause / ▶ Resume button. The phone shows the same word here.
   Bridge: carFlashStart {words, listName, interval, shuffle} · carFlashToggle · carFlashStop · carFlashState;
   the app answers with the native event "carFlash" {playing, paused, word, index, total, listName, interval, error}.
   Keep Minest open on the phone while it plays (iOS pauses a backgrounded app; a voice app keeps talking behind it).
   In a browser there is no Live Activity: the panel plays the words itself, so the flow can be tried. */
(function(){'use strict';
if (window.MinestCarFlash) return;
var KEY = 'minest.carflash.v1';
function esc(s){ return String(s == null ? '' : s).replace(/[&<>"']/g, function(c){ return { '&':'&amp;', '<':'&lt;', '>':'&gt;', '"':'&quot;', "'":'&#39;' }[c]; }); }
function native(){ try { return window.webkit && webkit.messageHandlers && webkit.messageHandlers.minestBridge; } catch(e){ return null; } }
function post(action, extra){ var h = native(); if (!h) return false; try { h.postMessage(Object.assign({ action: action }, extra || {})); return true; } catch(e){ return false; } }
function prefs(){ try { return JSON.parse(localStorage.getItem(KEY) || '{}') || {}; } catch(e){ return {}; } }
function savePrefs(p){ try { localStorage.setItem(KEY, JSON.stringify(p)); } catch(e){} }
function plain(s){ var d = document.createElement('div'); d.innerHTML = String(s || ''); return (d.textContent || '').replace(/\s+/g, ' ').trim(); }

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
function wordsOf(src, side){
  var seen = {};
  return src.cards.map(function(c){
    var front = plain(c.title || c.front), back = plain(c.en || c.desc || c.description || c.back);
    var w = side === 'back' ? back : side === 'auto' ? (/[A-Za-z]/.test(front) && !/[㐀-鿿]/.test(front) ? front : (c.en ? plain(c.en) : back) || front) : front;
    return w.slice(0, 60);
  }).filter(function(w){ if (!w || seen[w]) return false; seen[w] = 1; return true; });
}

var ov = null, st = { playing: false, paused: false, word: '', index: 0, total: 0, listName: '' }, webTimer = 0, webWords = [];
function open(){
  if (ov) { ov.remove(); }
  var p = prefs(), list = sources();
  ov = document.createElement('div'); ov.className = 'cf-ov'; ov.setAttribute('role', 'dialog'); ov.setAttribute('aria-label', '车载闪卡');
  ov.innerHTML = '<div class="cf-box"><header class="cf-top"><b>🚗 车载闪卡 · CarPlay</b><button type="button" class="cf-x" data-cf-close aria-label="关闭">✕</button></header>' +
    '<section class="cf-setup" data-cf-setup>' +
      (list.length ? '<label class="cf-f">词表<select data-cf-list>' + groups(list, p.list) + '</select></label>' : '<p class="cf-warn">还没有可用的词表。先在看板或 Teaching 词表里加词。</p>') +
      '<div class="cf-f">每个词停留<div class="cf-chips" data-cf-int>' + [5, 8, 10, 15, 20, 30].map(function(n){ return '<button type="button" data-v="' + n + '"' + ((p.interval || 10) === n ? ' class="on"' : '') + '>' + n + ' 秒</button>'; }).join('') + '</div></div>' +
      '<div class="cf-f">顺序<div class="cf-chips" data-cf-order><button type="button" data-v="seq"' + (!p.shuffle ? ' class="on"' : '') + '>按顺序</button><button type="button" data-v="mix"' + (p.shuffle ? ' class="on"' : '') + '>随机</button></div></div>' +
      '<div class="cf-f">显示<div class="cf-chips" data-cf-side>' + [['auto', '英文优先'], ['front', '正面'], ['back', '背面']].map(function(o){ return '<button type="button" data-v="' + o[0] + '"' + ((p.side || 'auto') === o[0] ? ' class="on"' : '') + '>' + o[1] + '</button>'; }).join('') + '</div></div>' +
      '<p class="cf-count" data-cf-count></p>' +
      '<button type="button" class="cf-go" data-cf-start' + (list.length ? '' : ' disabled') + '>▶ 开始播放</button>' +
      '<p class="cf-note">' + (native() ? '车上：CarPlay 仪表盘会显示 Minest 实时活动里的单词和 ⏸ 按钮。播放时请让 Minest 保持在手机前台（ChatGPT 语音可在后台继续）。' : '浏览器预览：这里只在本页播放；CarPlay 同步需要 Minest iOS App。') + '</p>' +
    '</section>' +
    '<section class="cf-play" data-cf-play hidden><p class="cf-list" data-cf-name></p><div class="cf-word" data-cf-word></div><p class="cf-pos" data-cf-pos></p>' +
      '<div class="cf-row"><button type="button" class="cf-go" data-cf-toggle>⏸ Pause</button><button type="button" class="cf-stop" data-cf-next aria-label="下一个">⏭</button><button type="button" class="cf-stop" data-cf-stop>■ 结束</button></div>' +
      '<p class="cf-err" data-cf-err role="status"></p></section></div>';
  document.body.appendChild(ov);
  var q = function(s){ return ov.querySelector(s); };
  function chips(sel, key, conv){ [].forEach.call(ov.querySelectorAll(sel + ' button'), function(b){ b.onclick = function(){ [].forEach.call(ov.querySelectorAll(sel + ' button'), function(x){ x.classList.toggle('on', x === b); }); var pp = prefs(); pp[key] = conv(b.dataset.v); savePrefs(pp); count(); }; }); }
  chips('[data-cf-int]', 'interval', function(v){ return +v; });
  chips('[data-cf-order]', 'shuffle', function(v){ return v === 'mix'; });
  chips('[data-cf-side]', 'side', function(v){ return v; });
  function current(){ var sel = q('[data-cf-list]'); return sel ? list.filter(function(s){ return s.id === sel.value; })[0] : null; }
  function count(){ var s = current(), el = q('[data-cf-count]'); if (!el) return; var w = s ? wordsOf(s, prefs().side || 'auto') : []; el.textContent = s ? w.length + ' 个词 · 例如：' + w.slice(0, 4).join(' · ') : ''; }
  if (q('[data-cf-list]')) q('[data-cf-list]').onchange = function(){ var pp = prefs(); pp.list = this.value; savePrefs(pp); count(); };
  count();
  q('[data-cf-close]').onclick = close;
  q('[data-cf-start]').onclick = function(){
    var s = current(); if (!s) return; var pp = prefs(), words = wordsOf(s, pp.side || 'auto'); if (!words.length) { err('这个词表没有可以显示的词。'); return; }
    var msg = { words: words, listName: s.title, interval: pp.interval || 10, shuffle: !!pp.shuffle };
    if (!post('carFlashStart', msg)) webStart(msg);
  };
  q('[data-cf-toggle]').onclick = function(){ if (!post('carFlashToggle')) webToggle(); };
  q('[data-cf-next]').onclick = function(){ if (!post('carFlashNext')) webNext(); };
  q('[data-cf-stop]').onclick = function(){ if (!post('carFlashStop')) webStop(); };
  post('carFlashState');
  paint();
}
function groups(list, sel){
  var g = {}, order = []; list.forEach(function(s){ if (!g[s.group]) { g[s.group] = []; order.push(s.group); } g[s.group].push(s); });
  var has = list.some(function(s){ return s.id === sel; });
  return order.map(function(k){ return '<optgroup label="' + esc(k) + '">' + g[k].map(function(s, i){ return '<option value="' + esc(s.id) + '"' + ((has ? s.id === sel : (k === order[0] && i === 0)) ? ' selected' : '') + '>' + esc(s.title) + ' · ' + s.cards.length + '</option>'; }).join('') + '</optgroup>'; }).join('');
}
function close(){ if (ov) { ov.remove(); ov = null; } }
function err(t){ var e = ov && ov.querySelector('[data-cf-err]'); if (e) e.textContent = t || ''; if (t && ov && !st.playing) { var n = ov.querySelector('[data-cf-count]'); if (n) n.textContent = t; } }
function paint(){
  if (!ov) return; var q = function(s){ return ov.querySelector(s); };
  q('[data-cf-setup]').hidden = st.playing; q('[data-cf-play]').hidden = !st.playing;
  if (!st.playing) return;
  var w = q('[data-cf-word]'), text = String(st.word || '').toUpperCase(), longest = Math.max.apply(null, text.split(/\s+/).map(function(x){ return x.length; }).concat([4]));
  w.textContent = text;   /* sized so the longest single word fits on one line; lines break only between words */
  w.style.fontSize = Math.max(24, Math.min(92, Math.floor((w.clientWidth || 320) / (longest * 0.72)), text.length > 28 ? 44 : 92)) + 'px';
  q('[data-cf-name]').textContent = st.listName || ''; q('[data-cf-pos]').textContent = (st.index + 1) + ' / ' + st.total + (st.paused ? ' · 已暂停' : '');
  var t = q('[data-cf-toggle]'); t.textContent = st.paused ? '▶ Resume' : '⏸ Pause'; t.classList.toggle('paused', !!st.paused);
}
window.addEventListener('minestNativeEvent', function(e){
  var d = e.detail || {}; if (d.event !== 'carFlash') return; var p = d.payload || {};
  st = { playing: !!p.playing, paused: !!p.paused, word: p.word || '', index: p.index || 0, total: p.total || 0, listName: p.listName || '' };
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

window.MinestCarFlash = { open: open, close: close, sources: sources, version: '53.829' };
})();

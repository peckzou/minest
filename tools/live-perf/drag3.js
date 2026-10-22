/* Teaching · 阶段四 · 拖拽造句: three more drag games on the student map (levels 11–13)
   11 🧱 连词成句 Sentence Builder — drag the shuffled word blocks into the sentence slots, in order
   12 🔤 拼音拼拼 Pinyin Builder   — drag a syllable onto each character (tone look-alikes are among the tiles)
   13 🕳 句子填空 Fill the Blank    — drag the right word card into the gap of a sentence
   Sentences: the card's own example (card.sent / card.sentEn, written in the word-list editor or by its ✍ 一键造句),
   else a bilingual classroom frame (我喜欢数学。· I like math.), so every list can play.
   Every game: drag, or tap a tile then tap a slot; Esc / ↩ to put a tile back. Stars and XP like the other ten levels
   (minest.teaching.ten824.best, by board / list / game). */
(function(){'use strict';
if (window.MinestDrag3) return;
var KEY = 'minest.teaching.ten824.best';
var GAMES = [
  ['sentence3','🧱','连词成句 · Sentence Builder','把词块拖进句子槽，拼出完整的句子','#0ea5e9'],
  ['pinyin3','🔤','拼音拼拼 · Pinyin Builder','把音节拖到每个汉字上方，注意声调','#f97316'],
  ['cloze3','🕳','句子填空 · Fill the Blank','把正确的词卡拖进句子的空格','#10b981']
];
function esc(s){ return String(s == null ? '' : s).replace(/[&<>"']/g, function(c){ return { '&':'&amp;', '<':'&lt;', '>':'&gt;', '"':'&quot;', "'":'&#39;' }[c]; }); }
function mix(a){ a = a.slice(); for (var i = a.length - 1; i > 0; i--) { var j = Math.floor(Math.random() * (i + 1)), t = a[i]; a[i] = a[j]; a[j] = t; } return a; }
function T(){ return window.MinestTeachingTen || {}; }
function sfx(k){ try { T().playSfx && T().playSfx(k); } catch(e){} }
function showEn(){ try { return T().isShowEnglish ? T().isShowEnglish() : true; } catch(e){ return true; } }
function han(s){ return /[㐀-鿿]/.test(s || ''); }
function pyLike(v){ return /[āáǎàēéěèīíǐìōóǒòūúǔùǖǘǚǜü]/i.test(v || ''); }
function speak(t){ try { if (!window.speechSynthesis || !t) return; var u = new SpeechSynthesisUtterance(t); u.lang = 'zh-CN'; u.rate = 0.85; speechSynthesis.cancel(); speechSynthesis.speak(u); } catch(e){} }

/* ---- sentences: the card's own, else a frame -------------------------------------------------------------------- */
var VERB = /^(to )?(play|go|do|eat|drink|ride|watch|listen|read|write|sing|dance|swim|run|draw|sleep|walk|wash|brush|get|have|speak|look|cook|clean|study|learn|make|fly|jump|climb|paint|talk|sit|stand|open|close|help|visit|buy)\b/i;
var SUBJ = /^(math|chinese|english|science|music|art|pe|history|geography|physics|chemistry|biology|coding|reading|writing|calligraphy|drama|politics|it)$/i;
function frames(w, e){
  e = String(e || '').trim();
  if (e && VERB.test(e)) { var v = e.replace(/^to /i, ''); return [[['我', '喜欢', w], 'I like to ' + v + '.'], [['我们', '一起', w, '吧'], "Let's " + v + ' together.'], [['我', '每天', '都', w], 'I ' + v + ' every day.']]; }
  if (e && SUBJ.test(e)) return [[['我', '喜欢', w], 'I like ' + e + '.'], [['我们', '今天', '学', w], 'We learn ' + e + ' today.'], [['我', '最', '喜欢', '上', w, '课'], 'I like ' + e + ' class best.']];
  return [[['我', '喜欢', w], e ? 'I like ' + e + '.' : ''], [['这', '是', '我的', w], e ? 'This is my ' + e + '.' : ''], [['我', '想', '要', w], e ? 'I want ' + e + '.' : '']];
}
function sentenceFor(w, e, i){ var F = frames(w, e), f = F[(i || 0) % F.length]; return { zh: f[0].join('') + '。', en: f[1], chunks: f[0].slice(), target: f[0].indexOf(w), end: '。' }; }
function chunk(sent, w){   // a teacher's own sentence → word blocks, keeping the target word whole
  var s = String(sent || '').trim(), end = ''; var m = s.match(/[。！？!?.]+$/); if (m) { end = m[0]; s = s.slice(0, -end.length); }
  if (!s || s.indexOf(w) < 0) return null;
  var parts = [], segs = function(t){ if (!t) return []; try { if (window.Intl && Intl.Segmenter) return Array.from(new Intl.Segmenter('zh', { granularity: 'word' }).segment(t)).map(function(x){ return x.segment; }).filter(function(x){ return x.trim(); }); } catch(e){} return Array.from(t).filter(function(x){ return x.trim(); }); };
  var bits = s.split(w); bits.forEach(function(b, i){ parts = parts.concat(segs(b)); if (i < bits.length - 1) parts.push(w); });
  parts = parts.map(function(p){ return p.replace(/^[，,、\s]+|[，,、\s]+$/g, ''); }).filter(Boolean);
  while (parts.length > 7) { var best = -1, len = 1e9; for (var k = 0; k < parts.length - 1; k++) { if (parts[k] === w || parts[k + 1] === w) continue; var L = parts[k].length + parts[k + 1].length; if (L < len) { len = L; best = k; } } if (best < 0) break; parts.splice(best, 2, parts[best] + parts[best + 1]); }
  if (parts.length < 2) return null;
  return { zh: s + (end || '。'), chunks: parts, target: parts.indexOf(w), end: end || '。' };
}
function sentenceOf(c, i){ var own = c.sent ? chunk(c.sent, c.zh) : null; if (own) { own.en = c.sentEn || ''; return own; } return sentenceFor(c.zh, c.en, i); }

/* ---- the list being played ---------------------------------------------------------------------------------------- */
function root(){ return document.getElementById('mn-templates'); }
function context(){
  var r = root(), a = r && r.__teaching824; if (!a) return null; var info = a.info(), S = window.MinestTeachingSets, b = S ? S.read() : { columns: [] };
  var col = (b.columns || []).filter(function(c){ return c.id === info.col; })[0]; if (!col) return null;
  var byId = {}; (info.allItems || []).forEach(function(it){ byId[it.id] = it; });
  var seen = {}, cards = (col.cards || []).filter(function(c){ var t = String(c.title || '').trim(); if (!t || c.teachingArchived || seen[t]) return false; seen[t] = 1; return true; }).map(function(c){
    var it = byId[c.id] || {}, py = String(c.pinyin || it.py || '').trim(); if (!py) { try { py = MinestTeachingAssets.pinyin(c.title) || ''; } catch(e){} }
    var back = String(it.back || c.desc || '').trim(), en = String(c.en || it.en || '').trim() || (back && !han(back) && !pyLike(back) ? back : '');
    return { id: c.id, zh: String(c.title).trim(), py: py, en: en, sent: String(c.sent || '').trim(), sentEn: String(c.sentEn || '').trim() };
  });
  return { boardId: info.boardId, col: info.col, title: col.title, cards: cards };
}
function why(g, cx){
  if (!cx) return '请先选择词表';
  var zhCards = cx.cards.filter(function(c){ return han(c.zh); });
  if (g === 'sentence3') return cx.cards.length >= 2 ? '' : '至少需要 2 张词卡';
  if (g === 'cloze3') return cx.cards.length >= 3 ? '' : '至少需要 3 张不同词卡';
  if (g === 'pinyin3') return pinyinCards(cx).length >= 2 ? '' : '需要至少 2 张中文词卡（带拼音）';
  return '';
}
function pinyinCards(cx){ return cx.cards.filter(function(c){ var ch = Array.from(c.zh).filter(han), sy = c.py.split(/\s+/).filter(Boolean); return ch.length && ch.length === Array.from(c.zh).length && ch.length === sy.length && ch.length <= 6; }); }
function bestAll(){ try { return JSON.parse(localStorage.getItem(KEY) || '{}') || {}; } catch(e){ return {}; } }
function bestOf(cx, g){ return bestAll()[JSON.stringify([cx.boardId, cx.col, g])] || null; }

/* ---- the map: 阶段四 after the ten levels ---------------------------------------------------------------------------- */
function paintMap(){
  var r = root(); if (!r || r.dataset.tenView !== 'home') return; var map = r.querySelector('.solo-trail-map'); if (!map || map.querySelector('[data-d3]')) return;
  var cx = context(); if (!cx) return;
  var html = '<div class="solo-stage-pill" data-d3-pill>🧱 阶段四 · 拖拽造句与拼音拼装</div>' + GAMES.map(function(g, i){
    var w = why(g[0], cx), b = bestOf(cx, g[0]), st = b ? b.stars || 0 : 0;
    return '<button type="button" class="solo-level-card' + (w ? ' needs-data' : '') + '" data-d3="' + g[0] + '"' + (w ? ' disabled' : '') + '><div class="solo-card-icon" style="background:' + g[4] + '">' + g[1] + '</div><div class="solo-card-info"><b>' + (11 + i) + '. ' + esc(g[2]) + '</b><small>' + esc(w || g[3]) + '</small><span class="solo-card-stars">' + [1,2,3].map(function(n){ return n <= st ? '★' : '☆'; }).join('') + '</span></div><div class="solo-card-play">' + (w ? '🔒' : '▶') + '</div></button>';
  }).join('');
  map.insertAdjacentHTML('beforeend', html);
}
document.addEventListener('click', function(e){
  var b = e.target.closest && e.target.closest('#mn-templates [data-d3]'); if (!b || b.disabled) return; e.preventDefault(); e.stopPropagation(); sfx('click'); start(b.getAttribute('data-d3'));
}, true);
var q3 = false; new MutationObserver(function(){ if (q3) return; q3 = true; requestAnimationFrame(function(){ q3 = false; paintMap(); }); }).observe(document.documentElement, { childList: true, subtree: true });

/* ---- a game ------------------------------------------------------------------------------------------------------------ */
var G = null;
function start(g){
  var cx = context(), r = root(); if (!cx || !r) return; if (why(g, cx)) return;
  var pool = g === 'pinyin3' ? pinyinCards(cx) : cx.cards, rounds = mix(pool).slice(0, Math.min(6, pool.length));
  G = { g: g, meta: GAMES.filter(function(x){ return x[0] === g; })[0], cx: cx, rounds: rounds, i: 0, first: 0, miss: 0, xp: 0, sel: null };
  r.dataset.tenView = 'd3'; next();
}
function wrap(){ return root() && root().querySelector('.tt-wrap'); }
function hud(){
  var m = G.meta, pct = Math.round(G.i / G.rounds.length * 100);
  return '<div class="d3-hud"><button type="button" class="d3-back" data-d3-home>🏝 返回地图</button><b>' + m[1] + ' ' + esc(m[2]) + '</b><span class="d3-prog"><i style="width:' + pct + '%"></i></span><span class="d3-n">' + Math.min(G.i + 1, G.rounds.length) + ' / ' + G.rounds.length + '</span><span class="d3-xp">⭐ ' + G.xp + '</span></div>';
}
function next(){
  var w = wrap(); if (!w) return; if (G.i >= G.rounds.length) return finish();
  var c = G.rounds[G.i]; G.miss = 0; G.sel = null; G.c = c;
  if (G.g === 'sentence3') sentenceRound(w, c); else if (G.g === 'pinyin3') pinyinRound(w, c); else clozeRound(w, c);
}
function tile(text, id, extra){ return '<button type="button" class="d3-tile' + (extra || '') + '" data-d3-tile="' + esc(id) + '">' + esc(text) + '</button>'; }
function enLine(t){ return t && showEn() ? '<p class="d3-en">' + esc(t) + '</p>' : ''; }

function sentenceRound(w, c){
  var S = sentenceOf(c, G.i); G.S = S;
  var ids = S.chunks.map(function(x, i){ return { t: x, k: 'c' + i }; }), order = mix(ids); if (order.map(function(x){ return x.k; }).join() === ids.map(function(x){ return x.k; }).join() && ids.length > 1) order.reverse();
  w.innerHTML = '<section class="d3-stage">' + hud() + '<div class="d3-card"><div class="d3-dir">连词成句 · BUILD THE SENTENCE</div><p class="d3-word">' + esc(c.zh) + (c.py ? '<small>' + esc(c.py) + '</small>' : '') + '</p>' + enLine(S.en) +
    '<div class="d3-slots">' + S.chunks.map(function(x, i){ return '<button type="button" class="d3-slot" data-d3-slot="' + i + '" aria-label="第 ' + (i + 1) + ' 个位置"></button>'; }).join('') + '<span class="d3-end">' + esc(S.end) + '</span></div></div>' +
    '<div class="d3-tray">' + order.map(function(x){ return tile(x.t, x.k, x.t === c.zh ? ' key' : ''); }).join('') + '</div><p class="d3-tip">拖动词块到上面的格子里，或先点词块再点格子；点已放好的词块可以拿回来</p></section>';
}
function pinyinRound(w, c){
  var ch = Array.from(c.zh), sy = c.py.split(/\s+/).filter(Boolean), others = [];
  G.cx.cards.forEach(function(o){ if (o.zh !== c.zh) o.py.split(/\s+/).forEach(function(s){ if (s && sy.indexOf(s) < 0 && others.indexOf(s) < 0) others.push(s); }); });
  var dis = []; sy.forEach(function(s){ var t = tone(s); if (t && sy.indexOf(t) < 0 && dis.indexOf(t) < 0) dis.push(t); });
  dis = mix(dis).slice(0, Math.max(1, Math.min(2, sy.length))).concat(mix(others).slice(0, 1));
  var tiles = mix(sy.map(function(s, i){ return { t: s, k: 's' + i }; }).concat(dis.map(function(s, i){ return { t: s, k: 'x' + i }; })));
  G.sy = sy;
  w.innerHTML = '<section class="d3-stage">' + hud() + '<div class="d3-card"><div class="d3-dir">拼音拼拼 · PINYIN BUILDER</div>' + enLine(c.en) +
    '<div class="d3-chars">' + ch.map(function(x, i){ return '<div class="d3-char"><button type="button" class="d3-slot py" data-d3-slot="' + i + '" aria-label="' + esc(x) + ' 的拼音"></button><b>' + esc(x) + '</b></div>'; }).join('') + '</div></div>' +
    '<div class="d3-tray">' + tiles.map(function(x){ return tile(x.t, x.k, ' py'); }).join('') + '</div><p class="d3-tip">把每个音节拖到对应的汉字上方；声调不同的音节是陷阱</p></section>';
}
function tone(s){   // the same syllable with another tone mark
  var V = { 'ā':'āáǎà','á':'āáǎà','ǎ':'āáǎà','à':'āáǎà','ē':'ēéěè','é':'ēéěè','ě':'ēéěè','è':'ēéěè','ī':'īíǐì','í':'īíǐì','ǐ':'īíǐì','ì':'īíǐì','ō':'ōóǒò','ó':'ōóǒò','ǒ':'ōóǒò','ò':'ōóǒò','ū':'ūúǔù','ú':'ūúǔù','ǔ':'ūúǔù','ù':'ūúǔù','ǖ':'ǖǘǚǜ','ǘ':'ǖǘǚǜ','ǚ':'ǖǘǚǜ','ǜ':'ǖǘǚǜ' };
  for (var i = 0; i < s.length; i++) { var set = V[s[i]]; if (set) { var opts = set.split('').filter(function(x){ return x !== s[i]; }); return s.slice(0, i) + opts[Math.floor(Math.random() * opts.length)] + s.slice(i + 1); } }
  return '';
}
function clozeRound(w, c){
  var S = sentenceOf(c, G.i); G.S = S;
  var before = S.chunks.slice(0, S.target).join(''), after = S.chunks.slice(S.target + 1).join('');
  var own = function(o, i){ var x = sentenceOf(o, G.cx.cards.indexOf(o)); return x.zh.replace(/[。！？!?.]+$/, ''); }, fits = before + '\u0000' + after;   /* no distractor that makes another card's own sentence */
  var opts = mix([c].concat(mix(G.cx.cards.filter(function(o){ return o.zh !== c.zh && own(o) !== before + o.zh + after; })).slice(0, 3)));
  w.innerHTML = '<section class="d3-stage">' + hud() + '<div class="d3-card"><div class="d3-dir">句子填空 · FILL THE BLANK</div>' +
    '<p class="d3-sent">' + esc(before) + '<button type="button" class="d3-slot gap" data-d3-slot="0" aria-label="空格"></button>' + esc(after) + esc(S.end) + '</p>' + (S.en ? '<p class="d3-en">' + esc(S.en) + '</p>' : '') + (c.py ? '<p class="d3-hint">提示 · ' + esc(c.py) + '</p>' : '') + '</div>' +
    '<div class="d3-tray big">' + opts.map(function(o){ return tile(o.zh, 'w:' + o.zh, ''); }).join('') + '</div><p class="d3-tip">把正确的词卡拖进空格</p></section>';
}

/* ---- drop rules ------------------------------------------------------------------------------------------------------------ */
function place(tileEl, slotEl){
  if (!tileEl || !slotEl || slotEl.classList.contains('ok')) return;
  var w = wrap(), k = tileEl.getAttribute('data-d3-tile'), idx = +slotEl.getAttribute('data-d3-slot');
  if (G.g === 'sentence3') {
    if (slotEl.firstChild) back(slotEl.firstChild);
    slotEl.appendChild(tileEl); tileEl.classList.add('in'); sfx('click');
    var slots = w.querySelectorAll('.d3-slot'), full = [].every.call(slots, function(s){ return s.firstChild; });
    if (!full) return;
    var wrongs = [].filter.call(slots, function(s, i){ return s.firstChild.textContent !== G.S.chunks[i]; });
    if (!wrongs.length) { [].forEach.call(slots, function(s){ s.classList.add('ok'); }); return win(G.S.zh); }
    G.miss++; sfx('wrong'); wrongs.forEach(function(s){ s.classList.add('bad'); var t = s.firstChild; setTimeout(function(){ s.classList.remove('bad'); if (t && t.parentNode === s) back(t); }, 650); });
    return;
  }
  if (G.g === 'pinyin3') {
    if (tileEl.textContent === G.sy[idx]) { slotEl.appendChild(tileEl); tileEl.classList.add('in'); slotEl.classList.add('ok'); sfx('correct');
      if ([].every.call(w.querySelectorAll('.d3-slot'), function(s){ return s.classList.contains('ok'); })) win(G.c.zh); return; }
    G.miss++; sfx('wrong'); bounce(tileEl, slotEl); return;
  }
  if (tileEl.getAttribute('data-d3-tile') === 'w:' + G.c.zh) { slotEl.appendChild(tileEl); tileEl.classList.add('in'); slotEl.classList.add('ok'); return win(G.S.zh); }
  G.miss++; sfx('wrong'); bounce(tileEl, slotEl);
}
function back(t){ var tray = wrap() && wrap().querySelector('.d3-tray'); if (tray && t) { t.classList.remove('in', 'sel'); tray.appendChild(t); } }
function bounce(t, s){ s.classList.add('bad'); t.classList.add('shake'); setTimeout(function(){ s.classList.remove('bad'); t.classList.remove('shake'); }, 500); }
function win(said){
  var clean = G.miss === 0; if (clean) G.first++; G.xp += clean ? 10 : 5; sfx(clean ? 'correct' : 'click'); speak(said);
  var w = wrap(), card = w && w.querySelector('.d3-card'); if (card) { card.classList.add('done'); card.insertAdjacentHTML('beforeend', '<div class="d3-yay">' + (clean ? '✨ 一次就对！+10' : '👍 完成 +5') + '</div>'); }
  var tray = w && w.querySelector('.d3-tray'); if (tray) tray.classList.add('off');
  setTimeout(function(){ if (!G || G.done) return; G.i++; next(); }, 1300);
}
function finish(){
  var n = G.rounds.length, ratio = n ? G.first / n : 0, stars = ratio >= 0.85 ? 3 : ratio >= 0.6 ? 2 : 1, cx = G.cx, k = JSON.stringify([cx.boardId, cx.col, G.g]), all = bestAll(), old = all[k] || {};
  all[k] = { stars: Math.max(old.stars || 0, stars), xp: Math.max(old.xp || 0, G.xp), at: Date.now() }; try { localStorage.setItem(KEY, JSON.stringify(all)); } catch(e){}
  G.done = true; sfx('win');
  var w = wrap(); if (!w) return;
  w.innerHTML = '<section class="d3-stage"><div class="d3-card d3-end-card"><div class="d3-big">' + G.meta[1] + '</div><h2>LEVEL CLEARED · 关卡通关！</h2><div class="d3-stars">' + [1,2,3].map(function(i){ return i <= stars ? '★' : '☆'; }).join('') + '</div>' +
    '<p>✨ +' + G.xp + ' 积分 · 一次答对 ' + G.first + ' / ' + n + ' 轮</p><div class="d3-endb"><button type="button" class="d3-btn" data-d3-again>↻ 再玩一次</button><button type="button" class="d3-btn pri" data-d3-home>🏝 返回游戏地图</button></div></div></section>';
}

/* ---- dragging (pointer) + tap-tap + keyboard ------------------------------------------------------------------------------------- */
var drag = null;
document.addEventListener('pointerdown', function(e){
  var t = e.target.closest && e.target.closest('#mn-templates .d3-tile'); if (!t || !G || G.done) return;
  if (t.parentNode && t.parentNode.classList.contains('d3-slot')) { if (t.parentNode.classList.contains('ok')) return; }
  drag = { t: t, x: e.clientX, y: e.clientY, moved: false, ghost: null, id: e.pointerId };
}, true);
document.addEventListener('pointermove', function(e){
  if (!drag || e.pointerId !== drag.id) return; var dx = e.clientX - drag.x, dy = e.clientY - drag.y;
  if (!drag.moved && Math.abs(dx) + Math.abs(dy) < 8) return;
  if (!drag.moved) { drag.moved = true; var r = drag.t.getBoundingClientRect(); drag.ox = drag.x - r.left; drag.oy = drag.y - r.top; drag.ghost = drag.t.cloneNode(true); drag.ghost.classList.add('d3-ghost'); drag.ghost.style.width = r.width + 'px'; document.body.appendChild(drag.ghost); drag.t.classList.add('lift'); }
  e.preventDefault(); drag.ghost.style.left = (e.clientX - drag.ox) + 'px'; drag.ghost.style.top = (e.clientY - drag.oy) + 'px';
  [].forEach.call(document.querySelectorAll('#mn-templates .d3-slot.hover'), function(s){ s.classList.remove('hover'); });
  var s = slotAt(e.clientX, e.clientY); if (s) s.classList.add('hover');
}, { capture: true, passive: false });
function slotAt(x, y){ var el = document.elementFromPoint(x, y); var s = el && el.closest && el.closest('#mn-templates .d3-slot'); if (s) return s;
  var best = null, bd = 60; [].forEach.call(document.querySelectorAll('#mn-templates .d3-slot:not(.ok)'), function(sl){ var r = sl.getBoundingClientRect(), cx = Math.max(r.left, Math.min(x, r.right)), cy = Math.max(r.top, Math.min(y, r.bottom)), d = Math.hypot(x - cx, y - cy); if (d < bd) { bd = d; best = sl; } }); return best; }   /* a forgiving drop: the nearest slot within 60 px */
document.addEventListener('pointerup', function(e){
  var d = drag; drag = null; if (!d || e.pointerId !== d.id) return;
  [].forEach.call(document.querySelectorAll('#mn-templates .d3-slot.hover'), function(s){ s.classList.remove('hover'); });
  if (d.moved) { if (d.ghost) d.ghost.remove(); d.t.classList.remove('lift'); var s = slotAt(e.clientX, e.clientY); if (s) place(d.t, s); else if (d.t.parentNode && d.t.parentNode.classList.contains('d3-slot')) back(d.t); swallow(); return; }
}, true);
document.addEventListener('pointercancel', function(){ if (drag) { if (drag.ghost) drag.ghost.remove(); drag.t.classList.remove('lift'); drag = null; } }, true);
function swallow(){ var f = function(ev){ ev.stopPropagation(); ev.preventDefault(); }; window.addEventListener('click', f, true); setTimeout(function(){ window.removeEventListener('click', f, true); }, 0); }
document.addEventListener('click', function(e){
  var r = root(); if (!r || !G || !r.contains(e.target)) return; var t;
  if ((t = e.target.closest('[data-d3-home]'))) { G = null; sfx('click'); try { T().home(r); } catch(x){} return; }
  if ((t = e.target.closest('[data-d3-again]'))) { var g = G.g; start(g); return; }
  if (G.done) return;
  if ((t = e.target.closest('.d3-tile'))) {
    if (t.parentNode && t.parentNode.classList.contains('d3-slot')) { if (!t.parentNode.classList.contains('ok')) { back(t); sfx('click'); } return; }   // tap a placed block: it comes back
    [].forEach.call(r.querySelectorAll('.d3-tile.sel'), function(x){ if (x !== t) x.classList.remove('sel'); }); t.classList.toggle('sel'); G.sel = t.classList.contains('sel') ? t : null; sfx('click'); return;
  }
  if ((t = e.target.closest('.d3-slot'))) { if (G.sel) { var s = G.sel; G.sel = null; s.classList.remove('sel'); place(s, t); } return; }
}, true);
document.addEventListener('keydown', function(e){ if (!G || G.done || e.key !== 'Escape') return; var s = G.sel; if (s) { s.classList.remove('sel'); G.sel = null; e.stopPropagation(); } }, true);

window.MinestDrag3 = { games: GAMES.map(function(g){ return g[0]; }), start: start, sentenceFor: sentenceFor, context: context, version: '1' };
})();

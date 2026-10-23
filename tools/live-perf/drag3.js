/* Teaching · 阶段四 · 拖拽造句: three more drag games on the student map (levels 11–13)
   11 🧱 连词成句 Sentence Builder — drag the shuffled word blocks into the sentence slots, in order
   12 🔤 拼音拼拼 Pinyin Builder   — drag a syllable onto each character (tone look-alikes are among the tiles)
   13 🕳 句子填空 Fill the Blank    — drag the right word card into the gap of a sentence
   🔑 配对开锁 Unlock (阶段四) — three locks show a word (or its picture); drag each pinyin key (one tone look-alike is a
      decoy) onto its lock — the lock opens and the word is read in Chinese.
   14 ☁️ 云朵排序 Listen & Order   — (阶段五 · 听力) tap the question to hear the whole sentence (🐢 slower); its word
      blocks float below as clouds, shuffled. Tap a cloud to hear it, drag clouds left / right to put the sentence back in
      order. It checks itself after every move; the sentence shows (with pinyin and English) once it is right.
   Sentences: the card's own example (card.sent / card.sentEn, written in the word-list editor or by its ✍ 一键造句),
   else a bilingual classroom frame (我喜欢数学。· I like math.), so every list can play.
   Every game: drag, or tap a tile then tap a slot; Esc / ↩ to put a tile back. Stars and XP like the other ten levels
   (minest.teaching.ten824.best, by board / list / game). */
(function(){'use strict';
if (window.MinestDrag3) return;
var KEY = 'minest.teaching.ten824.best';
var GAMES = [
  ['sentence3','🚂','拼火车 · Train Builder','把词语车厢按顺序挂上火车，拼出句子','#0ea5e9'],
  ['pinyin3','🔤','拼音拼拼 · Pinyin Builder','把音节拖到每个汉字上方，注意声调','#f97316'],
  ['lock3','🔑','配对开锁 · Unlock','把拼音钥匙拖到对应的字或图片锁上，打开它','#eab308'],
  ['cloze3','🌉','搭桥 · Build a Bridge','把缺的木板放进桥里，帮小熊过河','#10b981'],
  ['cloud3','☁️','云朵排序 · Listen & Order','点题目听整句，点云朵听词语，拖动云朵排出句子','#38bdf8'],
  ['ttt3','⭕','井字棋 · Tic-Tac-Toe','答对才能落子，三个 ✕ 连成一线就赢','#f43f5e'],
  ['snake3','🐍','蛇形棋 · Snakes & Ladders','答对才能掷骰子，爬梯子、躲蛇，先到终点','#22c55e']
];
function canSpeak(){ return !!(window.speechSynthesis && window.SpeechSynthesisUtterance && !window.__mnNoVoice); }
function say(t, rate){ try { if (!canSpeak() || !t) return; var u = new SpeechSynthesisUtterance(t); u.lang = 'zh-CN'; u.rate = rate || 0.85; var v = (speechSynthesis.getVoices() || []).filter(function(x){ return /^(zh|cmn)/i.test(x.lang || ''); }); if (v.length) u.voice = v.filter(function(x){ return /CN|Hans/i.test(x.lang); })[0] || v[0]; speechSynthesis.cancel(); speechSynthesis.speak(u); } catch(e){} }
function pyOf(t){ try { return (window.MinestTeachingAssets && MinestTeachingAssets.pinyin && MinestTeachingAssets.pinyin(t)) || ''; } catch(e){ return ''; } }
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
    return { id: c.id, zh: String(c.title).trim(), py: py, en: en, sent: String(c.sent || '').trim(), sentEn: String(c.sentEn || '').trim(), img: it.hasCustomImage && it.image ? it.image : '' };
  });
  return { boardId: info.boardId, col: info.col, title: col.title, cards: cards };
}
function why(g, cx){
  if (!cx) return '请先选择词表';
  var zhCards = cx.cards.filter(function(c){ return han(c.zh); });
  if (g === 'sentence3') return cx.cards.length >= 2 ? '' : '至少需要 2 张词卡';
  if (g === 'cloze3') return cx.cards.length >= 3 ? '' : '至少需要 3 张不同词卡';
  if (g === 'pinyin3') return pinyinCards(cx).length >= 2 ? '' : '需要至少 2 张中文词卡（带拼音）';
  if (g === 'ttt3') return cx.cards.filter(function(c){ return han(c.zh); }).length >= 5 ? '' : '需要至少 5 张中文词卡';
  if (g === 'snake3') return cx.cards.filter(function(c){ return han(c.zh); }).length >= 4 ? '' : '需要至少 4 张中文词卡';
  if (g === 'lock3') return lockCards(cx).length >= 3 ? '' : '需要至少 3 张带拼音的中文词卡';
  if (g === 'cloud3') return !canSpeak() ? '这台设备不能朗读中文' : zhCards.length >= 1 ? '' : '需要中文词卡';
  return '';
}
function pinyinCards(cx){ return cx.cards.filter(function(c){ var ch = Array.from(c.zh).filter(han), sy = c.py.split(/\s+/).filter(Boolean); return ch.length && ch.length === Array.from(c.zh).length && ch.length === sy.length && ch.length <= 6; }); }
function lockCards(cx){ return cx.cards.filter(function(c){ return han(c.zh) && c.py; }); }
function bestAll(){ try { return JSON.parse(localStorage.getItem(KEY) || '{}') || {}; } catch(e){ return {}; } }
function bestOf(cx, g){ return bestAll()[JSON.stringify([cx.boardId, cx.col, g])] || null; }

/* ---- the map: 阶段四 after the ten levels ---------------------------------------------------------------------------- */
function paintMap(){
  var r = root(); if (!r || r.dataset.tenView !== 'home') return; var map = r.querySelector('.solo-trail-map'); if (!map || map.querySelector('[data-d3]')) return;
  var cx = context(); if (!cx) return;
  var html = '<div class="solo-stage-pill" data-d3-pill>🧱 阶段四 · 拖拽造句与拼音拼装</div>' + GAMES.map(function(g, i){
    var w = why(g[0], cx), b = bestOf(cx, g[0]), st = b ? b.stars || 0 : 0;
    return (g[0] === 'cloud3' ? '<div class="solo-stage-pill" data-d3-pill>🎧 阶段五 · 听力排序</div>' : g[0] === 'ttt3' ? '<div class="solo-stage-pill" data-d3-pill>🎲 阶段六 · 棋盘对战</div>' : '') + '<button type="button" class="solo-level-card' + (w ? ' needs-data' : '') + '" data-d3="' + g[0] + '"' + (w ? ' disabled' : '') + '><div class="solo-card-icon" style="background:' + g[4] + '">' + g[1] + '</div><div class="solo-card-info"><b>' + ((T().modes ? T().modes.length : 11) + 1 + i) + '. ' + esc(g[2]) + '</b><small>' + esc(w || g[3]) + '</small><span class="solo-card-stars">' + [1,2,3].map(function(n){ return n <= st ? '★' : '☆'; }).join('') + '</span></div><div class="solo-card-play">' + (w ? '🔒' : '▶') + '</div></button>';
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
  var pool = g === 'pinyin3' ? pinyinCards(cx) : g === 'cloud3' ? cx.cards.filter(function(c){ return han(c.zh); }) : g === 'lock3' ? lockCards(cx) : cx.cards, rounds = mix(pool).slice(0, Math.min(6, pool.length));
  if (g === 'ttt3' || g === 'snake3') rounds = [1];   /* one match; the board game runs its own turns */
  if (g === 'lock3') { var sets = [], all = mix(pool); for (var k = 0; k + 3 <= all.length && sets.length < 4; k += 3) sets.push(all.slice(k, k + 3)); rounds = sets; }   /* three locks a round, up to four rounds */
  G = { g: g, meta: GAMES.filter(function(x){ return x[0] === g; })[0], cx: cx, rounds: rounds, i: 0, first: 0, miss: 0, xp: 0, sel: null };
  r.dataset.tenView = 'd3'; next();
}
function wrap(){ return root() && root().querySelector('.tt-wrap'); }
function hud(){
  var m = G.meta, pct = Math.round(G.i / G.rounds.length * 100);
  return '<div class="d3-hud"><button type="button" class="d3-back" data-d3-home>🏝 返回地图</button><b>' + m[1] + ' ' + esc(m[2]) + '</b><span class="d3-prog"><i style="width:' + pct + '%"></i></span><span class="d3-n">' + Math.min(G.i + 1, G.rounds.length) + ' / ' + G.rounds.length + '</span><span class="d3-xp">⭐ ' + G.xp + '</span></div>';
}
function next(){
  var w = wrap(); if (!w) return;
  if (G.g === 'ttt3') return tttStart(w);
  if (G.g === 'snake3') return snakeStart(w);
  if (G.i >= G.rounds.length) return finish();
  var c = G.rounds[G.i]; G.miss = 0; G.sel = null; G.c = c; G.won = false;
  if (G.g === 'sentence3') sentenceRound(w, c); else if (G.g === 'pinyin3') pinyinRound(w, c); else if (G.g === 'cloud3') cloudRound(w, c); else if (G.g === 'lock3') lockRound(w, c); else clozeRound(w, c);
}
function tile(text, id, extra){ return '<button type="button" class="d3-tile' + (extra || '') + '" data-d3-tile="' + esc(id) + '">' + esc(text) + '</button>'; }
function enLine(t){ return t && showEn() ? '<p class="d3-en">' + esc(t) + '</p>' : ''; }

function sentenceRound(w, c){
  var S = sentenceOf(c, G.i); G.S = S;
  var ids = S.chunks.map(function(x, i){ return { t: x, k: 'c' + i }; }), order = mix(ids); if (order.map(function(x){ return x.k; }).join() === ids.map(function(x){ return x.k; }).join() && ids.length > 1) order.reverse();
  /* 53.833 · 拼火车: the slots are a track behind an engine, the word blocks are wagons; in order, the train toots and leaves */
  w.innerHTML = '<section class="d3-stage">' + hud() + '<div class="d3-card"><div class="d3-dir">拼火车 · TRAIN BUILDER</div><p class="d3-word">' + esc(c.zh) + (c.py ? '<small>' + esc(c.py) + '</small>' : '') + '</p>' + enLine(S.en) +
    '<div class="tr-scene"><div class="d3-slots tr-track" data-tr-track><span class="tr-engine" aria-hidden="true">🚂</span>' + S.chunks.map(function(x, i){ return '<button type="button" class="d3-slot tr-car" data-d3-slot="' + i + '" aria-label="第 ' + (i + 1) + ' 节车厢"></button>'; }).join('') + '<span class="d3-end tr-end">' + esc(S.end) + '</span></div><div class="tr-rail" aria-hidden="true"></div></div></div>' +
    '<div class="d3-tray tr-yard">' + order.map(function(x){ return tile(x.t, x.k, ' tr-wagon' + (x.t === c.zh ? ' key' : '')); }).join('') + '</div><p class="d3-tip">把车厢按句子顺序挂到火车头后面；点已挂好的车厢可以取下</p></section>';
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
  /* 53.833 · 搭桥: every word of the sentence is a plank; the missing word is the missing plank; when it fits the bear crosses */
  var planks = S.chunks.map(function(x, i){ return i === S.target ? '<button type="button" class="d3-slot gap br-gap" data-d3-slot="0" aria-label="缺的木板"></button>' : '<span class="br-plank">' + esc(x) + '</span>'; }).join('');
  w.innerHTML = '<section class="d3-stage">' + hud() + '<div class="d3-card"><div class="d3-dir">搭桥 · BUILD A BRIDGE</div>' +
    '<div class="br-scene" data-br-scene><span class="br-walker" aria-hidden="true">🐻</span><span class="br-flag" aria-hidden="true">🏁</span><div class="br-bridge">' + planks + '<span class="br-plank br-end">' + esc(S.end) + '</span></div><div class="br-river" aria-hidden="true"></div></div>' +
    (S.en ? '<p class="d3-en">' + esc(S.en) + '</p>' : '') + (c.py ? '<p class="d3-hint">提示 · ' + esc(c.py) + '</p>' : '') + '</div>' +
    '<div class="d3-tray big br-yard">' + opts.map(function(o){ return tile(o.zh, 'w:' + o.zh, ' br-board'); }).join('') + '</div><p class="d3-tip">把对的木板放进桥的缺口，小熊就能过河</p></section>';
}

function cloudRound(w, c){
  var S = sentenceOf(c, G.i); G.S = S; G.moves = 0;
  var ids = S.chunks.map(function(x, i){ return { t: x, k: i }; }), order = mix(ids), tries = 0;
  while (ids.length > 1 && order.every(function(x, i){ return x.k === i; }) && tries++ < 8) order = mix(ids);
  w.innerHTML = '<section class="d3-stage d3-sky">' + hud() + '<div class="d3-card d3-listen"><div class="d3-dir">云朵排序 · LISTEN &amp; ORDER</div>' +
    '<button type="button" class="d3-q" data-d3-say aria-label="听整句"><span class="d3-q-ico">🔊</span><span>点我听整句</span></button><button type="button" class="d3-slow" data-d3-slow aria-label="慢速再听">🐢 慢一点</button>' +
    '<div class="d3-answer" hidden></div></div>' +
    '<div class="d3-clouds" role="list">' + order.map(function(x){ var py = pyOf(x.t); return '<button type="button" role="listitem" class="d3-cloud' + (x.t === c.zh ? ' key' : '') + '" data-d3-cloud="' + x.k + '" aria-label="云朵：' + esc(x.t) + '"><b>' + esc(x.t) + '</b>' + (py ? '<small>' + esc(py) + '</small>' : '') + '</button>'; }).join('') + '</div>' +
    '<p class="d3-tip">点云朵听读音 · 按住云朵左右拖动换位置 · 排对了会自动通过</p></section>';
  setTimeout(function(){ if (G && G.c === c && !G.done) say(S.zh); }, 450);
}
/* 🔑 配对开锁: three locks (the word, or its picture when the card has one), pinyin keys + one tone look-alike */
function lockRound(w, set){
  var keys = set.map(function(c){ return { t: c.py, k: 'k:' + c.id }; }), decoy = null;
  set.some(function(c){ var sy = c.py.split(/\s+/), i = sy.length - 1, t = tone(sy[i]); if (!t) return false; sy[i] = t; var d = sy.join(' '); if (set.some(function(o){ return o.py === d; })) return false; decoy = d; return true; });
  if (decoy) keys.push({ t: decoy, k: 'x:decoy' });
  keys = mix(keys);
  w.innerHTML = '<section class="d3-stage lk-stage">' + hud() + '<div class="d3-card lk-card"><div class="d3-dir">配对开锁 · UNLOCK</div><p class="lk-tip">把拼音钥匙拖到对应的锁上 · 也可以先点钥匙再点锁</p>' +
    '<div class="lk-locks">' + set.map(function(c, i){ var pic = c.img && i % 2 === 1;
      return '<button type="button" class="d3-slot lk-lock" data-d3-slot="' + i + '" data-lock="' + esc(c.id) + '" aria-label="锁：' + esc(pic ? '图片' : c.zh) + '"><span class="lk-shackle" aria-hidden="true"></span><span class="lk-body">' + (pic ? '<img src="' + esc(c.img) + '" alt="" draggable="false">' : '<b>' + esc(c.zh) + '</b>') + '<i class="lk-hole" aria-hidden="true"></i></span></button>'; }).join('') + '</div></div>' +
    '<div class="d3-tray lk-keys">' + keys.map(function(x){ return tile(x.t, x.k, ' lk-key'); }).join('') + '</div><p class="d3-tip">钥匙上是拼音：先自己读一读，再插进对应的锁</p></section>';
  G.lockSet = set;
}
function cloudOrder(){ var w = wrap(); return w ? [].map.call(w.querySelectorAll('.d3-cloud'), function(b){ return +b.getAttribute('data-d3-cloud'); }) : []; }
function cloudCheck(){
  if (!G || G.g !== 'cloud3' || G.won) return; G.moves++;
  var o = cloudOrder(), right = o.every(function(k, i){ return k === i; }) || o.map(function(k){ return G.S.chunks[k]; }).join('') === G.S.chunks.join('');
  if (!right) return;
  G.won = true; G.miss = Math.max(0, G.moves - G.S.chunks.length);   // a clean run: no more moves than clouds
  var w = wrap(), ans = w && w.querySelector('.d3-answer');
  [].forEach.call(w.querySelectorAll('.d3-cloud'), function(b, i){ b.classList.add('ok'); b.style.animationDelay = (i * 0.06) + 's'; });
  if (ans) { var py = G.S.chunks.map(pyOf).filter(Boolean).join(' '); ans.hidden = false; ans.innerHTML = '<p class="d3-sent">' + esc(G.S.zh) + '</p>' + (py ? '<p class="d3-hint">' + esc(py) + '</p>' : '') + enLine(G.S.en); }
  win(G.S.zh);
}

/* ---- 🎲 棋盘对战 (阶段六): every move is earned by a question — the Chinese word (read aloud) → its meaning (picture /
   English), or its pinyin when the list has neither. Tic-Tac-Toe and Snakes & Ladders, against the computer. ---- */
function hudBoard(title){ return '<div class="d3-hud"><button type="button" class="d3-back" data-d3-home>🏝 返回地图</button><b>' + title + '</b><span class="d3-xp">✓ ' + (G.right || 0) + ' / ' + (G.asked || 0) + '</span></div>'; }
function boardCards(){ return G.cx.cards.filter(function(c){ return han(c.zh); }); }
function cueKind(){ var cs = boardCards(), n = cs.filter(function(c){ return c.en || c.img; }).length; return n >= Math.min(3, cs.length) ? 'mean' : 'py'; }
function ask(card, done){
  var kind = G.qkind, key = function(c){ return kind === 'py' ? c.py : (c.en || (c.img ? 'img:' + c.img : '')); };
  var opts = [card], seen = {}; seen[key(card)] = 1;
  mix(boardCards().filter(function(o){ return o.id !== card.id && key(o); })).forEach(function(o){ if (opts.length < 3 && !seen[key(o)]) { seen[key(o)] = 1; opts.push(o); } });
  opts = mix(opts);
  var box = wrap().querySelector('[data-q4]');
  box.innerHTML = '<div class="q4-prompt"><b>' + esc(card.zh) + '</b><button type="button" class="q4-say" data-q4-say aria-label="再听一遍">🔊</button></div><p class="q4-ask">' + (kind === 'py' ? '它怎么读？' : '它是什么意思？') + '</p>' +
    '<div class="q4-opts">' + opts.map(function(o){ return '<button type="button" class="q4-opt" data-q4-opt="' + esc(o.id) + '">' + (kind === 'py' ? esc(o.py) : o.img && !o.en ? '<img src="' + esc(o.img) + '" alt="">' : esc(o.en)) + '</button>'; }).join('') + '</div>';
  box.hidden = false; say(card.zh, .8);
  box.querySelector('[data-q4-say]').onclick = function(){ say(card.zh, .8); };
  [].forEach.call(box.querySelectorAll('[data-q4-opt]'), function(b){ b.onclick = function(){
    var good = b.getAttribute('data-q4-opt') === card.id;
    [].forEach.call(box.querySelectorAll('[data-q4-opt]'), function(x){ x.disabled = true; if (x.getAttribute('data-q4-opt') === card.id) x.classList.add('ok'); });
    if (!good) b.classList.add('bad');
    sfx(good ? 'correct' : 'wrong'); G.asked = (G.asked || 0) + 1; if (good) G.right = (G.right || 0) + 1;
    setTimeout(function(){ box.hidden = true; done(good); }, good ? 650 : 1400);
  }; });
}
function boardFinish(title, stars){
  var cx = G.cx, k = JSON.stringify([cx.boardId, cx.col, G.g]), all = bestAll(), old = all[k] || {};
  G.xp = (G.right || 0) * 10 + stars * 10; G.done = true;
  all[k] = { stars: Math.max(old.stars || 0, stars), xp: Math.max(old.xp || 0, G.xp), at: Date.now() }; try { localStorage.setItem(KEY, JSON.stringify(all)); } catch(e){}
  sfx(stars > 1 ? 'win' : 'click');
  setTimeout(function(){ var w = wrap(); if (!w || !G || G.g === undefined) return;
    w.innerHTML = '<section class="d3-stage"><div class="d3-card d3-end-card"><div class="d3-big">' + G.meta[1] + '</div><h2>' + esc(title) + '</h2><div class="d3-stars">' + [1,2,3].map(function(i){ return i <= stars ? '★' : '☆'; }).join('') + '</div>' +
      '<p>✨ +' + G.xp + ' 积分 · 答对 ' + (G.right || 0) + ' / ' + (G.asked || 0) + ' 题</p><div class="d3-endb"><button type="button" class="d3-btn" data-d3-again>↻ 再玩一次</button><button type="button" class="d3-btn pri" data-d3-home>🏝 返回游戏地图</button></div></div></section>'; }, 1400);
}
function accStars(win){ var a = G.asked ? G.right / G.asked : 0; return win ? (a >= .85 ? 3 : a >= .6 ? 2 : 1) : 1; }

/* ⭕ 井字棋 */
var LINES = [[0,1,2],[3,4,5],[6,7,8],[0,3,6],[1,4,7],[2,5,8],[0,4,8],[2,4,6]];
function tttStart(w){
  var cs = mix(boardCards()), cells = cs.slice(); while (cells.length < 9) cells = cells.concat(mix(cs)); cells = cells.slice(0, 9);
  G.board = cells.map(function(c){ return { c: c, who: '' }; }); G.qkind = cueKind(); G.turn = 'me'; G.asked = 0; G.right = 0; G.busy = false;
  tttPaint('轮到你：点一个格子答题，答对就放上 ✕');
}
function lineOf(who){ for (var k = 0; k < LINES.length; k++) if (LINES[k].every(function(i){ return G.board[i].who === who; })) return LINES[k]; return null; }
function tttPaint(msg, hot){
  var w = wrap(); if (!w) return;
  w.innerHTML = '<section class="d3-stage">' + hudBoard('⭕ 井字棋 · Tic-Tac-Toe') + '<div class="d3-card ttt-card"><p class="ttt-msg">' + esc(msg) + '</p><div class="ttt-grid">' + G.board.map(function(x, i){
      return '<button type="button" class="ttt-cell' + (x.who ? ' ' + x.who : '') + (hot && hot.indexOf(i) >= 0 ? ' hot' : '') + '" data-ttt="' + i + '"' + (x.who || G.turn !== 'me' ? ' disabled' : '') + '>' +
        (x.who ? '<span class="ttt-mark">' + (x.who === 'me' ? '✕' : '◯') + '</span><small>' + esc(x.c.zh) + '</small>' : '<b>' + esc(x.c.zh) + '</b>') + '</button>'; }).join('') +
    '</div><p class="ttt-legend">你 ✕ · 电脑 ◯</p><div class="q4" data-q4 hidden></div></div></section>';
}
function cpuCell(){
  var b = G.board, free = b.map(function(x, i){ return x.who ? -1 : i; }).filter(function(i){ return i >= 0; });
  function two(who){ for (var k = 0; k < LINES.length; k++) { var l = LINES[k], f = l.filter(function(i){ return !b[i].who; }); if (f.length === 1 && l.filter(function(i){ return b[i].who === who; }).length === 2) return f[0]; } return -1; }
  var m = two('cpu'); if (m >= 0) return m;
  if (Math.random() < .7) { m = two('me'); if (m >= 0) return m; }   /* it blocks most of the time, not always */
  if (!b[4].who && Math.random() < .5) return 4;
  return free[Math.floor(Math.random() * free.length)];
}
function tttAfter(msg){
  var l = lineOf('me'); if (l) { tttPaint('三个 ✕ 连成一线！', l); return boardFinish('🎉 你赢了！', accStars(true)); }
  if (G.board.every(function(x){ return x.who; })) { tttPaint('九格下满了'); return boardFinish('🤝 平局！', Math.max(1, accStars(true) - 1)); }
  G.turn = 'cpu'; tttPaint(msg + ' · 电脑思考中…');
  setTimeout(function(){ if (!G || G.done || G.g !== 'ttt3') return;
    G.board[cpuCell()].who = 'cpu'; sfx('click');
    var l2 = lineOf('cpu'); if (l2) { G.turn = 'cpu'; tttPaint('电脑三连了', l2); return boardFinish('电脑赢了，再来一局！', accStars(false)); }
    if (G.board.every(function(x){ return x.who; })) { tttPaint('九格下满了'); return boardFinish('🤝 平局！', Math.max(1, accStars(true) - 1)); }
    G.turn = 'me'; tttPaint('电脑下了 ◯ · 轮到你：点一个格子答题');
  }, 900);
}
document.addEventListener('click', function(e){
  var c = e.target.closest && e.target.closest('#mn-templates [data-ttt]'); if (!c || !G || G.g !== 'ttt3' || G.done || G.turn !== 'me' || G.busy) return;
  e.stopPropagation(); var cell = G.board[+c.getAttribute('data-ttt')]; if (cell.who) return;
  G.busy = true; c.classList.add('pick'); sfx('click');
  ask(cell.c, function(good){ G.busy = false; if (good) cell.who = 'me'; tttAfter(good ? '答对了，✕ 放上去' : '没答对，这一格先空着'); });
}, true);

/* 🐍 蛇形棋: 30 squares, 4 ladders, 4 snakes; a right answer earns the dice */
var SK = { ladders: { 3: 11, 8: 16, 14: 25, 19: 28 }, snakes: { 17: 6, 22: 12, 27: 15, 29: 20 }, end: 30 };
var DICE = ['⚀','⚁','⚂','⚃','⚄','⚅'];
function sq(n){ var r = Math.floor((n - 1) / 6), c = (n - 1) % 6; if (r % 2) c = 5 - c; return { x: c * 100 + 50, y: (4 - r) * 100 + 50, col: c + 1, row: 5 - r }; }
function snakeStart(w){
  G.qkind = cueKind(); G.pos = { me: 1, cpu: 1 }; G.asked = 0; G.right = 0; G.turn = 'me'; G.busy = false; G.deck = mix(boardCards()); G.dk = 0;
  snakePaint('轮到你：答对就能掷骰子 🎲');
}
function tokenAt(who, n){ var p = sq(Math.min(SK.end, n)); return 'left:' + (p.x / 6) + '%;top:' + (p.y / 5) + '%'; }
function snakePaint(msg){
  var w = wrap(); if (!w) return; var cells = '', n;
  for (n = 1; n <= SK.end; n++) { var p = sq(n); cells += '<div class="sk-sq' + ((p.col + p.row) % 2 ? ' alt' : '') + '" style="grid-column:' + p.col + ';grid-row:' + p.row + '"><i>' + n + '</i>' + (n === SK.end ? '<em>🏆</em>' : n === 1 ? '<em>🚩</em>' : '') + '</div>'; }
  var svg = '<svg class="sk-lines" viewBox="0 0 600 500" preserveAspectRatio="none" aria-hidden="true">';
  Object.keys(SK.ladders).forEach(function(a){ var A = sq(+a), B = sq(SK.ladders[a]), dx = B.x - A.x, dy = B.y - A.y, L = Math.hypot(dx, dy), nx = -dy / L * 13, ny = dx / L * 13;
    svg += '<g class="sk-ladder"><line x1="' + (A.x + nx) + '" y1="' + (A.y + ny) + '" x2="' + (B.x + nx) + '" y2="' + (B.y + ny) + '"/><line x1="' + (A.x - nx) + '" y1="' + (A.y - ny) + '" x2="' + (B.x - nx) + '" y2="' + (B.y - ny) + '"/>';
    for (var t = .1; t < .95; t += .13) svg += '<line class="rung" x1="' + (A.x + dx * t + nx) + '" y1="' + (A.y + dy * t + ny) + '" x2="' + (A.x + dx * t - nx) + '" y2="' + (A.y + dy * t - ny) + '"/>';
    svg += '</g>'; });
  Object.keys(SK.snakes).forEach(function(a, i){ var A = sq(+a), B = sq(SK.snakes[a]), mx = (A.x + B.x) / 2 + (i % 2 ? 70 : -70), my = (A.y + B.y) / 2;
    svg += '<path class="sk-snake" d="M' + A.x + ' ' + A.y + ' Q' + mx + ' ' + my + ' ' + B.x + ' ' + B.y + '"/><path class="sk-snake-in" d="M' + A.x + ' ' + A.y + ' Q' + mx + ' ' + my + ' ' + B.x + ' ' + B.y + '"/><circle class="sk-head" cx="' + A.x + '" cy="' + A.y + '" r="15"/><circle cx="' + (A.x - 5) + '" cy="' + (A.y - 4) + '" r="3" fill="#fff"/><circle cx="' + (A.x + 5) + '" cy="' + (A.y - 4) + '" r="3" fill="#fff"/>'; });
  svg += '</svg>';
  w.innerHTML = '<section class="d3-stage">' + hudBoard('🐍 蛇形棋 · Snakes & Ladders') + '<div class="d3-card sk-card"><p class="ttt-msg" data-sk-msg>' + esc(msg) + '</p>' +
    '<div class="sk-board">' + cells + svg + '<span class="sk-token me" data-sk-tok="me" style="' + tokenAt('me', G.pos.me) + '">🐻</span><span class="sk-token cpu" data-sk-tok="cpu" style="' + tokenAt('cpu', G.pos.cpu) + '">🤖</span></div>' +
    '<div class="sk-bar"><span class="sk-who me">🐻 你 · ' + Math.min(SK.end, G.pos.me) + '</span><span class="sk-dice" data-sk-dice>🎲</span><span class="sk-who cpu">🤖 电脑 · ' + Math.min(SK.end, G.pos.cpu) + '</span></div>' +
    '<button type="button" class="sk-go" data-sk-go' + (G.turn === 'me' && !G.busy ? '' : ' disabled') + '>' + (G.turn === 'me' ? '📖 答题 → 🎲 掷骰子' : '🤖 电脑回合…') + '</button><div class="q4" data-q4 hidden></div></div></section>';
}
function skMsg(t){ var m = wrap() && wrap().querySelector('[data-sk-msg]'); if (m) m.textContent = t; }
function roll(who, done){
  var d = wrap().querySelector('[data-sk-dice]'), k = 0, v = 1 + Math.floor(Math.random() * 6);
  var t = setInterval(function(){ if (d) d.textContent = DICE[Math.floor(Math.random() * 6)]; if (++k >= 8) { clearInterval(t); if (d) { d.textContent = DICE[v - 1]; d.classList.add('rolled'); } sfx('click'); setTimeout(function(){ done(v); }, 350); } }, 70);
}
function walk(who, steps, done){
  var tok = wrap().querySelector('[data-sk-tok="' + who + '"]'), left = steps;
  var t = setInterval(function(){
    if (left <= 0 || G.pos[who] >= SK.end) { clearInterval(t);
      var n = G.pos[who], to = SK.ladders[n] || SK.snakes[n];
      if (to) { var up = !!SK.ladders[n]; setTimeout(function(){ G.pos[who] = to; if (tok) { tok.classList.add('slide'); tok.setAttribute('style', tokenAt(who, to)); } sfx(up ? 'streak' : 'wrong'); setTimeout(function(){ done(up ? 'ladder' : 'snake', n, to); }, 650); }, 250); }
      else done('', n, n);
      return; }
    G.pos[who] += 1; left--; if (tok) { tok.classList.remove('slide'); tok.setAttribute('style', tokenAt(who, G.pos[who])); } sfx('snap');
  }, 260);
}
function afterMove(who, how, from, to){
  var name = who === 'me' ? '你' : '电脑';
  if (G.pos[who] >= SK.end) { snakePaint(name + '到达终点 🏆'); return boardFinish(who === 'me' ? '🎉 你先到终点，赢了！' : '电脑先到终点，再来一局！', accStars(who === 'me')); }
  return how === 'ladder' ? name + '踩到梯子，从 ' + from + ' 爬到 ' + to + '！🪜' : how === 'snake' ? name + '碰到蛇，从 ' + from + ' 滑到 ' + to + ' 🐍' : '';
}
function cpuTurn(lead){
  G.turn = 'cpu'; snakePaint((lead ? lead + ' · ' : '') + '电脑掷骰子…');
  setTimeout(function(){ if (!G || G.done || G.g !== 'snake3') return;
    roll('cpu', function(v){ walk('cpu', v, function(how, from, to){ if (G.done) return; var note = afterMove('cpu', how, from, to); if (G.done) return;
      G.turn = 'me'; G.busy = false; snakePaint('电脑掷了 ' + v + (note ? ' · ' + note : '') + ' · 轮到你：答题掷骰子'); }); });
  }, 800);
}
document.addEventListener('click', function(e){
  var b = e.target.closest && e.target.closest('#mn-templates [data-sk-go]'); if (!b || !G || G.g !== 'snake3' || G.done || G.turn !== 'me' || G.busy) return;
  e.stopPropagation(); G.busy = true; b.disabled = true;
  var card = G.deck[G.dk++ % G.deck.length];
  ask(card, function(good){
    if (!good) { skMsg('没答对，这回合原地不动'); return setTimeout(function(){ cpuTurn('你没答对，原地不动'); }, 700); }
    skMsg('答对了！掷骰子…');
    roll('me', function(v){ walk('me', v, function(how, from, to){ if (G.done) return; var note = afterMove('me', how, from, to); if (G.done) return; cpuTurn('你掷了 ' + v + (note ? ' · ' + note : '')); }); });
  });
}, true);

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
    if (!wrongs.length) { [].forEach.call(slots, function(s){ s.classList.add('ok'); }); var tr = w.querySelector('[data-tr-track]'); if (tr) { sfx('streak'); setTimeout(function(){ tr.classList.add('go'); sfx('whoosh'); }, 450); } return win(G.S.zh); }
    G.miss++; sfx('wrong'); wrongs.forEach(function(s){ s.classList.add('bad'); var t = s.firstChild; setTimeout(function(){ s.classList.remove('bad'); if (t && t.parentNode === s) back(t); }, 650); });
    return;
  }
  if (G.g === 'lock3') {
    var want = slotEl.getAttribute('data-lock');
    if (k === 'k:' + want) {
      slotEl.classList.add('ok', 'open'); tileEl.classList.add('in'); slotEl.querySelector('.lk-body').appendChild(tileEl); sfx('correct');
      var card = G.lockSet.filter(function(c){ return c.id === want; })[0]; if (card) speak(card.zh);
      if ([].every.call(w.querySelectorAll('.lk-lock'), function(s){ return s.classList.contains('ok'); })) setTimeout(function(){ win(''); }, 500);
      return;
    }
    G.miss++; sfx('wrong'); bounce(tileEl, slotEl); return;
  }
  if (G.g === 'pinyin3') {
    if (tileEl.textContent === G.sy[idx]) { slotEl.appendChild(tileEl); tileEl.classList.add('in'); slotEl.classList.add('ok'); sfx('correct');
      if ([].every.call(w.querySelectorAll('.d3-slot'), function(s){ return s.classList.contains('ok'); })) win(G.c.zh); return; }
    G.miss++; sfx('wrong'); bounce(tileEl, slotEl); return;
  }
  if (tileEl.getAttribute('data-d3-tile') === 'w:' + G.c.zh) { slotEl.appendChild(tileEl); tileEl.classList.add('in'); slotEl.classList.add('ok'); var sc = w.querySelector('[data-br-scene]'); if (sc) setTimeout(function(){ sc.classList.add('cross'); sfx('streak'); }, 300); return win(G.S.zh); }
  G.miss++; sfx('wrong'); bounce(tileEl, slotEl);
}
function back(t){ var tray = wrap() && wrap().querySelector('.d3-tray'); if (tray && t) { t.classList.remove('in', 'sel'); tray.appendChild(t); } }
function bounce(t, s){ s.classList.add('bad'); t.classList.add('shake'); setTimeout(function(){ s.classList.remove('bad'); t.classList.remove('shake'); }, 500); }
function win(said){
  var clean = G.miss === 0; if (clean) G.first++; G.xp += clean ? 10 : 5; sfx(clean ? 'correct' : 'click'); if (said) speak(said);
  var w = wrap(), card = w && w.querySelector('.d3-card'); if (card) { card.classList.add('done'); card.insertAdjacentHTML('beforeend', '<div class="d3-yay">' + (clean ? '✨ 一次就对！+10' : '👍 完成 +5') + '</div>'); }
  var tray = w && w.querySelector('.d3-tray'); if (tray) tray.classList.add('off');
  setTimeout(function(){ if (!G || G.done) return; G.i++; next(); }, G.g === 'cloud3' ? 2600 : (G.g === 'cloze3' || G.g === 'sentence3') ? 2400 : 1300);
}
function finish(){
  var n = G.rounds.length, ratio = n ? G.first / n : 0, stars = ratio >= 0.85 ? 3 : ratio >= 0.6 ? 2 : 1, cx = G.cx, k = JSON.stringify([cx.boardId, cx.col, G.g]), all = bestAll(), old = all[k] || {};
  all[k] = { stars: Math.max(old.stars || 0, stars), xp: Math.max(old.xp || 0, G.xp), at: Date.now() }; try { localStorage.setItem(KEY, JSON.stringify(all)); } catch(e){}
  G.done = true; sfx('win');
  var w = wrap(); if (!w) return;
  w.innerHTML = '<section class="d3-stage"><div class="d3-card d3-end-card"><div class="d3-big">' + G.meta[1] + '</div><h2>LEVEL CLEARED · 关卡通关！</h2><div class="d3-stars">' + [1,2,3].map(function(i){ return i <= stars ? '★' : '☆'; }).join('') + '</div>' +
    '<p>✨ +' + G.xp + ' 积分 · 一次答对 ' + G.first + ' / ' + n + ' 轮</p><div class="d3-endb"><button type="button" class="d3-btn" data-d3-again>↻ 再玩一次</button><button type="button" class="d3-btn pri" data-d3-home>🏝 返回游戏地图</button></div></div></section>';
}

/* ---- clouds: tap = hear it; drag = move it left / right (live reorder); ←/→ on a focused cloud moves it too ---- */
var cd = null;
document.addEventListener('pointerdown', function(e){
  var t = e.target.closest && e.target.closest('#mn-templates .d3-cloud'); if (!t || !G || G.done || G.won) return;
  cd = { t: t, x: e.clientX, y: e.clientY, moved: false, id: e.pointerId, from: cloudOrder().join() };
}, true);
document.addEventListener('pointermove', function(e){
  if (!cd || e.pointerId !== cd.id) return; var dx = e.clientX - cd.x, dy = e.clientY - cd.y;
  if (!cd.moved && Math.abs(dx) + Math.abs(dy) < 8) return;
  if (!cd.moved) { cd.moved = true; var r = cd.t.getBoundingClientRect(); cd.ox = cd.x - r.left; cd.oy = cd.y - r.top; cd.ghost = cd.t.cloneNode(true); cd.ghost.classList.add('d3-cloud-ghost'); cd.ghost.style.width = r.width + 'px'; document.body.appendChild(cd.ghost); cd.t.classList.add('lift'); sfx('whoosh'); }
  e.preventDefault(); cd.ghost.style.left = (e.clientX - cd.ox) + 'px'; cd.ghost.style.top = (e.clientY - cd.oy) + 'px';
  var row = cd.t.parentNode, best = null, bd = 1e9, after = false;
  [].forEach.call(row.querySelectorAll('.d3-cloud'), function(b){ if (b === cd.t) return; var r = b.getBoundingClientRect(), cx = r.left + r.width / 2, cy = r.top + r.height / 2, d = Math.hypot(e.clientX - cx, (e.clientY - cy) * 1.6); if (d < bd) { bd = d; best = b; after = e.clientX > cx; } });
  if (best && bd < 140) { var ref = after ? best.nextSibling : best; if (ref !== cd.t && ref !== cd.t.nextSibling) row.insertBefore(cd.t, ref); }
}, { capture: true, passive: false });
document.addEventListener('pointerup', function(e){
  var d = cd; cd = null; if (!d || e.pointerId !== d.id) return;
  if (d.moved) { if (d.ghost) d.ghost.remove(); d.t.classList.remove('lift'); swallow(); if (cloudOrder().join() !== d.from) { sfx('snap'); cloudCheck(); } return; }
}, true);
document.addEventListener('pointercancel', function(){ if (cd) { if (cd.ghost) cd.ghost.remove(); cd.t.classList.remove('lift'); cd = null; } }, true);
document.addEventListener('click', function(e){
  var r = root(); if (!r || !G || G.g !== 'cloud3' || !r.contains(e.target)) return; var t;
  if ((t = e.target.closest('[data-d3-say]'))) { e.stopPropagation(); t.classList.remove('play'); void t.offsetWidth; t.classList.add('play'); say(G.S.zh); return; }
  if ((t = e.target.closest('[data-d3-slow]'))) { e.stopPropagation(); say(G.S.zh, 0.55); return; }
  if ((t = e.target.closest('.d3-cloud'))) { e.stopPropagation(); t.classList.remove('hop'); void t.offsetWidth; t.classList.add('hop'); say(t.querySelector('b').textContent, 0.8); return; }
}, true);
window.addEventListener('keydown', function(e){   /* on window, ahead of the Teaching shell's own arrow keys */
  var t = e.target.closest && e.target.closest('#mn-templates .d3-cloud'); if (!t || !G || G.won || (e.key !== 'ArrowLeft' && e.key !== 'ArrowRight')) return;
  e.preventDefault(); var row = t.parentNode; if (e.key === 'ArrowLeft' && t.previousElementSibling) row.insertBefore(t, t.previousElementSibling); else if (e.key === 'ArrowRight' && t.nextElementSibling) row.insertBefore(t.nextElementSibling, t); else return;
  e.stopPropagation(); t.focus(); sfx('snap'); cloudCheck();
}, true);

/* ---- dragging (pointer) + tap-tap + keyboard ------------------------------------------------------------------------------------- */
var drag = null;
document.addEventListener('pointerdown', function(e){
  var t = e.target.closest && e.target.closest('#mn-templates .d3-tile'); if (!t || !G || G.done) return;
  if (t.closest('.d3-slot.ok')) return;   /* a key already in an open lock stays there */
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
    if (t.closest('.d3-slot.ok')) return;
    if (t.parentNode && t.parentNode.classList.contains('d3-slot')) { if (!t.parentNode.classList.contains('ok')) { back(t); sfx('click'); } return; }   // tap a placed block: it comes back
    [].forEach.call(r.querySelectorAll('.d3-tile.sel'), function(x){ if (x !== t) x.classList.remove('sel'); }); t.classList.toggle('sel'); G.sel = t.classList.contains('sel') ? t : null; sfx('click'); return;
  }
  if ((t = e.target.closest('.d3-slot'))) { if (G.sel) { var s = G.sel; G.sel = null; s.classList.remove('sel'); place(s, t); } return; }
}, true);
document.addEventListener('keydown', function(e){ if (!G || G.done || e.key !== 'Escape') return; var s = G.sel; if (s) { s.classList.remove('sel'); G.sel = null; e.stopPropagation(); } }, true);

window.MinestDrag3 = { games: GAMES.map(function(g){ return g[0]; }), start: start, sentenceFor: sentenceFor, context: context, version: '1' };
})();

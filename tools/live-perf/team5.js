/* 👥 Team Games · 团队游戏 (iPhone 53.8241) — teacher side only, game screens only (no scores, no student devices)
   🔔 Quiz Bowl 团队抢答 · 🎨 Pictionary 你画我猜 · 🎭 Charades 你演我猜 · 🔍 Spot the Difference 找不同 · 🙆 Heads Up! 额头猜词.
   Words: a teaching word list, or a built-in theme pack (动物 · 运动 · 职业 · 日常动作).
   Pictionary, Charades and Heads Up! share one guessing screen: a timer, the secret word (held 👁 to peek, or shown big for
   Heads Up!), ⏭ next word. Entries: the Teaching templates header and the Live teacher panel (never in student mode).
*/
(function(){
'use strict';
if (window.MinestTeam5) return;

var GAMES = [
  { k: 'quiz', icon: '🔔', en: 'Quiz Bowl', zh: '团队抢答', tip: '听力 · 拼音 · 汉字 · 图片抢答' },
  { k: 'draw', icon: '🎨', en: 'Pictionary', zh: '你画我猜', tip: '画出来，不能写字' },
  { k: 'act', icon: '🎭', en: 'Charades', zh: '你演我猜', tip: '演出来，不能说话' },
  { k: 'spot', icon: '🔍', en: 'Spot the Difference', zh: '找不同', tip: '找不同，用中文说出来' },
  { k: 'heads', icon: '🙆', en: 'Heads Up!', zh: '额头猜词', tip: '队友描述，猜词者猜' },
  { k: 'bee', icon: '🐝', en: 'Spelling Bee', zh: '中文拼写', tip: '听词，拼出拼音或写出汉字' }
];
var THEMES = {
  animal: ['🐾 动物', [['猫','māo','cat','🐱'],['狗','gǒu','dog','🐶'],['兔子','tù zi','rabbit','🐰'],['猴子','hóu zi','monkey','🐵'],['大象','dà xiàng','elephant','🐘'],['老虎','lǎo hǔ','tiger','🐯'],['熊猫','xióng māo','panda','🐼'],['青蛙','qīng wā','frog','🐸'],['小鸟','xiǎo niǎo','bird','🐦'],['鱼','yú','fish','🐟'],['蛇','shé','snake','🐍'],['长颈鹿','cháng jǐng lù','giraffe','🦒']]],
  sport: ['⚽ 运动', [['游泳','yóu yǒng','swim','🏊'],['跑步','pǎo bù','run','🏃'],['踢足球','tī zú qiú','play soccer','⚽'],['打篮球','dǎ lán qiú','play basketball','🏀'],['跳绳','tiào shéng','jump rope','🪢'],['骑自行车','qí zì xíng chē','ride a bike','🚴'],['打乒乓球','dǎ pīng pāng qiú','play ping-pong','🏓'],['滑冰','huá bīng','skate','⛸️'],['跳舞','tiào wǔ','dance','💃'],['爬山','pá shān','climb a mountain','🧗'],['打网球','dǎ wǎng qiú','play tennis','🎾'],['滑雪','huá xuě','ski','⛷️']]],
  job: ['🧑‍⚕️ 职业', [['医生','yī shēng','doctor','🧑‍⚕️'],['老师','lǎo shī','teacher','🧑‍🏫'],['警察','jǐng chá','police officer','👮'],['厨师','chú shī','chef','🧑‍🍳'],['司机','sī jī','driver','🚕'],['画家','huà jiā','painter','🧑‍🎨'],['农民','nóng mín','farmer','🧑‍🌾'],['消防员','xiāo fáng yuán','firefighter','🧑‍🚒'],['歌手','gē shǒu','singer','🎤'],['宇航员','yǔ háng yuán','astronaut','🧑‍🚀'],['护士','hù shi','nurse','💉'],['邮递员','yóu dì yuán','mail carrier','📮']]],
  daily: ['🪥 日常动作', [['刷牙','shuā yá','brush teeth','🪥'],['洗脸','xǐ liǎn','wash your face','🧼'],['吃饭','chī fàn','eat','🍚'],['喝水','hē shuǐ','drink water','🥤'],['睡觉','shuì jiào','sleep','😴'],['看书','kàn shū','read','📖'],['写字','xiě zì','write','✍️'],['打电话','dǎ diàn huà','make a call','📞'],['洗手','xǐ shǒu','wash hands','🙌'],['开门','kāi mén','open the door','🚪'],['唱歌','chàng gē','sing','🎵'],['拍照','pāi zhào','take a photo','📷']]]
};
var TEAMS = [['红队', '#ff5a3c'], ['蓝队', '#00b8f0'], ['绿队', '#4bc22e'], ['黄队', '#ffa31e']];
var OPT_COLORS = ['#ff5a3c', '#00b8f0', '#4bc22e', '#ffa31e'];

/* ---- helpers ---------------------------------------------------------------------------------------------------------- */
function esc(s){ return String(s == null ? '' : s).replace(/[&<>"']/g, function(c){ return { '&':'&amp;', '<':'&lt;', '>':'&gt;', '"':'&quot;', "'":'&#39;' }[c]; }); }
function mix(a){ a = a.slice(); for (var i = a.length - 1; i > 0; i--) { var j = Math.floor(Math.random() * (i + 1)), t = a[i]; a[i] = a[j]; a[j] = t; } return a; }
function han(s){ return /[㐀-鿿]/.test(s || ''); }
function pyLike(v){ return /[āáǎàēéěèīíǐìōóǒòūúǔùǖǘǚǜü]/i.test(v || ''); }
function pyOf(t){ try { return (window.MinestTeachingAssets && MinestTeachingAssets.pinyin && MinestTeachingAssets.pinyin(t)) || ''; } catch(e){ return ''; } }
function canSpeak(){ return !!(window.speechSynthesis && window.SpeechSynthesisUtterance && !window.__mnNoVoice); }
function say(t){ try { if (!canSpeak() || !t) return; var u = new SpeechSynthesisUtterance(t); u.lang = 'zh-CN'; u.rate = 0.85; var v = (speechSynthesis.getVoices() || []).filter(function(x){ return /^(zh|cmn)/i.test(x.lang || ''); }); if (v.length) u.voice = v.filter(function(x){ return /CN|Hans/i.test(x.lang); })[0] || v[0]; speechSynthesis.cancel(); speechSynthesis.speak(u); } catch(e){} }
var actx = null;
function sfx(k){
  try { if (window.MinestTeachingTen && MinestTeachingTen.playSfx && (k === 'correct' || k === 'click')) { MinestTeachingTen.playSfx(k); return; } } catch(e){}
  try {
    actx = actx || new (window.AudioContext || window.webkitAudioContext)(); var t = actx.currentTime, o = actx.createOscillator(), g = actx.createGain();
    o.type = k === 'wrong' ? 'sawtooth' : 'square'; o.frequency.setValueAtTime(k === 'wrong' ? 170 : k === 'tick' ? 1200 : 740, t);
    if (k === 'buzz') o.frequency.setValueAtTime(980, t + 0.09);
    g.gain.setValueAtTime(k === 'tick' ? 0.03 : 0.08, t); g.gain.exponentialRampToValueAtTime(0.001, t + (k === 'buzz' ? 0.32 : k === 'tick' ? 0.05 : 0.25));
    o.connect(g); g.connect(actx.destination); o.start(t); o.stop(t + 0.4);
  } catch(e){}
}
function store(k, v){ try { if (v === undefined) return JSON.parse(localStorage.getItem('minest.team5.' + k) || 'null'); localStorage.setItem('minest.team5.' + k, JSON.stringify(v)); } catch(e){ return null; } }
function clock(ms){ var s = Math.ceil(Math.max(0, ms) / 1000); return Math.floor(s / 60) + ':' + ('0' + (s % 60)).slice(-2); }
function studentMode(){ try { return !!(window.isStudentMode && window.isStudentMode()); } catch(e){ return false; } }

/* ---- words: a teaching list, or a theme pack ----------------------------------------------------------------------------- */
function board(){ try { var b = window.MinestTeachingSets && MinestTeachingSets.read(); return b && Array.isArray(b.columns) ? b : null; } catch(e){ return null; } }
function listWords(colId){
  var b = board(), col = b && b.columns.filter(function(c){ return c.id === colId; })[0]; if (!col) return [];
  var mat = {}; try { mat = MinestTeachingAssets.forBoard(b.id) || {}; } catch(e){}
  var seen = {};
  return (col.cards || []).filter(function(c){ var t = String(c.title || '').trim(); if (!t || c.teachingArchived || seen[t]) return false; seen[t] = 1; return true; }).map(function(c){
    var a = mat[c.id] || {}, img = '';
    try { if (a.image) img = MinestTeachingAssets.resolve(a.image) || ''; } catch(e){}
    if (!img && c.cover && c.cover.type === 'image') img = c.cover.value || '';
    var py = String(typeof a.pinyin === 'string' && a.pinyin ? a.pinyin : c.pinyin || '').trim() || pyOf(c.title);
    var en = String(c.en || '').trim(), back = String(c.desc || '').trim(); if (!en && back && !han(back) && !pyLike(back)) en = back;
    return { zh: String(c.title).trim(), py: py, en: en, img: img, em: '', sent: String(c.sent || '').trim() };
  });
}
function themeWords(k){ return (k === 'all' ? Object.keys(THEMES) : [k]).reduce(function(o, t){ return o.concat(THEMES[t][1].map(function(w){ return { zh: w[0], py: w[1], en: w[2], em: w[3], img: '' }; })); }, []); }
function srcWords(src){ src = src || ''; return src.indexOf('list:') === 0 ? listWords(src.slice(5)) : themeWords(src.slice(6) || 'all'); }

/* ---- the overlay -------------------------------------------------------------------------------------------------------- */
var O = null, MAIN = null, S = { src: store('src') || 'theme:all', teams: store('teams') || 2, secs: store('secs') || 60 }, G = null, overflow = '';
function q(s){ return O.querySelector(s); }
function qa(s){ return Array.prototype.slice.call(O.querySelectorAll(s)); }
function build(){
  if (O && O.isConnected) return;
  O = document.createElement('section'); O.id = 'mn-team5'; O.className = 't5'; O.setAttribute('role', 'dialog'); O.setAttribute('aria-modal', 'true'); O.setAttribute('aria-label', 'Team Games 团队游戏');
  O.innerHTML = '<header class="t5-top"><button type="button" class="t5-x" data-t5-back hidden>← 游戏</button><div class="t5-brand" data-t5-title>👥 <b>Team Games</b><span>团队游戏</span></div><div class="t5-sp"></div><button type="button" class="t5-x" data-t5-close aria-label="关闭">✕</button></header><main class="t5-main" data-t5-main></main>';
  document.body.appendChild(O); MAIN = q('[data-t5-main]'); overflow = document.body.style.overflow; document.body.style.overflow = 'hidden';
  q('[data-t5-close]').onclick = close;
  q('[data-t5-back]').onclick = home;
  window.addEventListener('keydown', keys, true);
}
function close(){ stop(); window.removeEventListener('keydown', keys, true); if (O) O.remove(); O = null; document.body.style.overflow = overflow; }
function stop(){ if (!G) return; (G.stops || []).forEach(function(f){ try { f(); } catch(e){} }); G.stops = []; }
function keys(e){ if (!O) return; if (e.key === 'Escape') { e.preventDefault(); e.stopImmediatePropagation(); if (G) home(); else close(); return; } if (G && G.key && !(e.target && e.target.closest && e.target.closest('input,select,textarea'))) G.key(e); }
function title(g){ q('[data-t5-title]').innerHTML = g ? g.icon + ' <b>' + g.en + '</b><span>' + g.zh + '</span>' : '👥 <b>Team Games</b><span>团队游戏</span>'; q('[data-t5-back]').hidden = !g; }
function timer(secs, tick, end){
  var stopAt = Date.now() + secs * 1000, done = false, T = { left: function(){ return Math.max(0, stopAt - Date.now()); }, total: secs * 1000, reset: function(){ stopAt = Date.now() + secs * 1000; done = false; } };
  var id = setInterval(function(){ var l = T.left(); tick(l, T); if (!l && !done) { done = true; end(); } }, 200);
  tick(T.left(), T); G.stops.push(function(){ clearInterval(id); }); return T;
}

/* ---- home: words + the five games ---------------------------------------------------------------------------------------- */
function srcOptions(){
  var b = board(), cols = b ? b.columns.filter(function(c){ return (c.cards || []).length; }) : [];
  return (cols.length ? '<optgroup label="我的词表">' + cols.map(function(c){ return '<option value="list:' + esc(c.id) + '"' + (S.src === 'list:' + c.id ? ' selected' : '') + '>📚 ' + esc(c.title || '词表') + '</option>'; }).join('') + '</optgroup>' : '') +
    '<optgroup label="主题词包">' + [['all', '🎲 全部主题']].concat(Object.keys(THEMES).map(function(k){ return [k, THEMES[k][0]]; })).map(function(t){ return '<option value="theme:' + t[0] + '"' + (S.src === 'theme:' + t[0] ? ' selected' : '') + '>' + t[1] + '</option>'; }).join('') + '</optgroup>';
}
function home(){
  stop(); G = null; if (!O) return; title(null);
  if (S.src.indexOf('list:') === 0 && !srcWords(S.src).length) S.src = 'theme:all';
  var W = srcWords(S.src), zh = W.filter(function(w){ return han(w.zh); }).length;
  MAIN.innerHTML = '<div class="t5-home"><div class="t5-setup"><label>词库<select data-t5-src>' + srcOptions() + '</select></label><span class="t5-count">' + W.length + ' 个词</span></div>' +
    '<div class="t5-games">' + GAMES.map(function(g, i){ var off = g.k === 'quiz' ? zh < 4 : g.k === 'bee' ? beeWords(W).length < 1 : g.k !== 'spot' && W.length < 3; return '<button type="button" class="t5-game g' + i + '" data-t5-game="' + g.k + '"' + (off ? ' disabled' : '') + '><i>' + g.icon + '</i><b>' + g.en + '</b><span>' + g.zh + '</span><small>' + (off ? '这个词库的词不够' : g.tip) + '</small></button>'; }).join('') + '</div></div>';
  q('[data-t5-src]').onchange = function(){ S.src = this.value; store('src', S.src); home(); };
  qa('[data-t5-game]').forEach(function(b){ b.onclick = function(){ sfx('click'); start(this.dataset.t5Game); }; });
}
function start(k){
  stop(); var g = GAMES.filter(function(x){ return x.k === k; })[0];
  G = { k: k, W: srcWords(S.src), stops: [] }; title(g);
  if (k === 'quiz') quiz(); else if (k === 'spot') spot(); else if (k === 'bee') bee(); else guess(k);
}
function chips(name, vals, cur, fmt){ return '<div class="t5-chips">' + vals.map(function(v){ return '<button type="button" class="t5-chip' + (v === cur ? ' on' : '') + '" data-t5-' + name + '="' + v + '">' + fmt(v) + '</button>'; }).join('') + '</div>'; }

/* ======================================================================================================================== */
/* 🔔 Quiz Bowl: the question; a team buzzes (button or key 1–4); its answer time runs; tap the answer; ⏭ next */
function quiz(){
  var zh = G.W.filter(function(w){ return han(w.zh); }), deck = mix(zh), pool = zh.length >= 4 ? zh : zh.concat(themeWords('all')), i = -1, Q = null, buzzed = -1, T = null;
  function kinds(w){ return ['listen', 'py', 'zh', 'pic', 'en'].filter(function(k){ return k === 'listen' ? canSpeak() : k === 'py' || k === 'zh' ? !!w.py : k === 'pic' ? !!(w.img || w.em) : !!w.en; }); }
  function make(){
    var w = deck[i % deck.length], ks = kinds(w), kind = ks.length ? ks[Math.floor(Math.random() * ks.length)] : 'plain', key = kind === 'zh' ? 'py' : 'zh', opts = [w[key]];
    mix(pool).forEach(function(x){ if (opts.length < 4 && x[key] && opts.indexOf(x[key]) < 0) opts.push(x[key]); });
    opts = mix(opts); return { w: w, kind: kind, opts: opts, ans: opts.indexOf(w[key]) };
  }
  function prompt(){
    var w = Q.w;
    if (Q.kind === 'listen') return '<button type="button" class="t5-listen" data-t5-say>🔊</button><p>听一听，是哪个词？</p>';
    if (Q.kind === 'py') return '<div class="t5-big py">' + esc(w.py) + '</div><p>这个拼音是哪个词？</p>';
    if (Q.kind === 'zh') return '<div class="t5-big">' + esc(w.zh) + '</div><p>这个词怎么读？</p>';
    if (Q.kind === 'pic') return (w.img ? '<img class="t5-pic" src="' + esc(w.img) + '" alt="">' : '<div class="t5-emoji">' + w.em + '</div>') + '<p>图上是什么？</p>';
    if (Q.kind === 'en') return '<div class="t5-big en">' + esc(w.en) + '</div><p>用中文怎么说？</p>';
    return '<div class="t5-big">' + esc(w.zh) + '</div><p>找出这个词</p>';
  }
  function next(){
    stop(); i++; Q = make(); buzzed = -1; T = null;
    MAIN.innerHTML = '<div class="t5-play">' +
      '<div class="t5-card t5-q">' + prompt() + '</div>' +
      '<div class="t5-bar" data-t5-barwrap hidden><i data-t5-bar></i></div>' +
      '<div class="t5-optgrid" data-t5-opts>' + Q.opts.map(function(x, k){ return '<button type="button" class="t5-opt" data-t5-pick="' + k + '" style="--oc:' + OPT_COLORS[k] + '"><u>' + 'ABCD'[k] + '</u>' + esc(x) + '</button>'; }).join('') + '</div>' +
      '<div class="t5-buzzers" data-t5-buzzers>' + TEAMS.slice(0, S.teams).map(function(t, k){ return '<button type="button" class="t5-buzz" data-t5-buzz="' + k + '" style="--tc:' + t[1] + '">🔔 ' + t[0] + '<small>' + (k + 1) + '</small></button>'; }).join('') + '</div>' +
      '<div class="t5-row t5-foot">' + chips('teams', [2, 3, 4], S.teams, function(v){ return v + ' 队'; }) + '<button type="button" class="t5-btn alt" data-t5-reveal>👀 答案</button><button type="button" class="t5-btn" data-t5-next>下一题 ⏭</button></div></div>';
    if (Q.kind === 'listen') { q('[data-t5-say]').onclick = function(){ say(Q.w.zh); }; setTimeout(function(){ say(Q.w.zh); }, 350); }
    qa('[data-t5-buzz]').forEach(function(b){ b.onclick = function(){ buzz(+this.dataset.t5Buzz); }; });
    qa('[data-t5-pick]').forEach(function(b){ b.onclick = function(){ pick(+this.dataset.t5Pick); }; });
    qa('[data-t5-teams]').forEach(function(b){ b.onclick = function(){ S.teams = +this.dataset.t5Teams; store('teams', S.teams); i--; next(); }; });
    q('[data-t5-reveal]').onclick = function(){ reveal(); };
    q('[data-t5-next]').onclick = next;
  }
  function buzz(t){
    if (buzzed >= 0 || t >= S.teams) return; buzzed = t; sfx('buzz');
    qa('[data-t5-buzz]').forEach(function(b){ var k = +b.dataset.t5Buzz; b.classList.toggle('won', k === t); b.classList.toggle('dim', k !== t); });
    q('[data-t5-barwrap]').hidden = false;
    var bar = q('[data-t5-bar]'), last = 99;
    T = timer(8, function(l, X){ bar.style.width = (100 * l / X.total) + '%'; var s = Math.ceil(l / 1000); if (s <= 3 && s !== last && l > 0) { last = s; sfx('tick'); } }, function(){ sfx('wrong'); reopen(); });
  }
  function reopen(){ stop(); buzzed = -1; q('[data-t5-barwrap]').hidden = true; qa('[data-t5-buzz]').forEach(function(b){ b.classList.remove('won', 'dim'); }); }
  function pick(k){
    if (q('[data-t5-opts]').classList.contains('done')) return;
    var b = q('[data-t5-pick="' + k + '"]');
    if (k === Q.ans) { sfx('correct'); reveal(); } else { sfx('wrong'); b.classList.add('bad'); b.disabled = true; reopen(); }
  }
  function reveal(){
    stop(); var box = q('[data-t5-opts]'); box.classList.add('done'); q('[data-t5-barwrap]').hidden = true;
    qa('[data-t5-pick]').forEach(function(b){ var k = +b.dataset.t5Pick; b.classList.toggle('right', k === Q.ans); b.classList.toggle('dim', k !== Q.ans); });
    say(Q.w.zh);
  }
  G.key = function(e){ var n = +e.key, L = 'abcd'.indexOf(String(e.key).toLowerCase()); if (n >= 1 && n <= S.teams) { e.preventDefault(); buzz(n - 1); } else if (L >= 0 && e.key.length === 1) { e.preventDefault(); var b = q('[data-t5-pick="' + L + '"]'); if (b && !b.disabled) pick(L); } else if (e.key === 'ArrowRight') next(); };
  next();
}

/* ======================================================================================================================== */
/* 🎨 / 🎭 / 🙆 one guessing screen: a timer, the secret word, ⏭ next word */
function guess(k){
  var deck = mix(G.W), di = 0, w = null, T = null, padApi = null, hint = false;
  var how = { draw: '画手按住 👁 看词，只能画、不能写字 · 队友说出这个词', act: '表演者按住 👁 看词，只能做动作、不能说话 · 队友大声猜', heads: '猜词者背对屏幕 · 队友描述或做动作，不能说出这个词' }[k];
  function nextWord(){
    if (di >= deck.length) { deck = mix(G.W); di = 0; } w = deck[di++]; hint = false;
    if (padApi) padApi.set([]);
    paint();
  }
  function face(){ return '<div class="t5-word">' + (w.em ? '<i>' + w.em + '</i>' : w.img ? '<img src="' + esc(w.img) + '" alt="">' : '') + '<b>' + esc(w.zh) + '</b>' + (w.py ? '<small>' + esc(w.py) + '</small>' : '') + (w.en ? '<em>' + esc(w.en) + '</em>' : '') + '</div>'; }
  function paint(){
    var el = q('[data-t5-secret]'); if (!el) return;
    if (k === 'heads') { el.innerHTML = face(); return; }
    el.innerHTML = '<div class="t5-hidden">❓</div>' + (hint && w.py ? '<div class="t5-hintpy">💡 ' + esc(w.py) + '</div>' : '') +
      '<button type="button" class="t5-peek" data-t5-peek>👁 按住看词</button><div class="t5-peekcard" data-t5-peekcard hidden>' + face() + '</div>';
    var pk = q('[data-t5-peek]'), pc = q('[data-t5-peekcard]'), on = function(e){ e.preventDefault(); pc.hidden = false; }, off = function(){ pc.hidden = true; };
    pk.addEventListener('pointerdown', on); pk.addEventListener('pointerup', off); pk.addEventListener('pointerleave', off); pk.addEventListener('pointercancel', off); pk.addEventListener('contextmenu', function(e){ e.preventDefault(); });
  }
  function screen(){
    stop();
    MAIN.innerHTML = '<div class="t5-play t5-g-' + k + '"><div class="t5-clock"><div class="t5-bar"><i data-t5-bar></i></div><b data-t5-left></b><button type="button" class="t5-mini" data-t5-restart>↻ 重新计时</button></div>' +
      '<div class="t5-stage">' + (k === 'draw' ? '<div class="t5-board" data-t5-board></div>' : '') + '<div class="t5-card t5-secret' + (k === 'heads' ? ' open' : '') + '" data-t5-secret></div></div>' +
      '<p class="t5-how">' + how + '</p>' +
      '<div class="t5-row t5-foot">' + chips('secs', [30, 60, 90, 120], S.secs, function(v){ return v + ' 秒'; }) +
      (k === 'draw' ? '<button type="button" class="t5-btn alt" data-t5-hint>💡 拼音提示</button>' : '') +
      (k !== 'heads' ? '<button type="button" class="t5-btn alt" data-t5-show>👀 公布答案</button>' : '<button type="button" class="t5-btn alt" data-t5-fore>📱 额头模式</button>') +
      '<button type="button" class="t5-btn" data-t5-nextw>下一个词 ⏭</button></div></div>';
    if (k === 'draw') padApi = pad(q('[data-t5-board]'));
    nextWord();
    var bar = q('[data-t5-bar]'), left = q('[data-t5-left]'), last = 99;
    T = timer(S.secs, function(l, X){ bar.style.width = (100 * l / X.total) + '%'; left.textContent = l ? clock(l) : '⏰ 时间到'; var s = Math.ceil(l / 1000); if (s <= 5 && s !== last && l > 0) { last = s; sfx('tick'); } }, function(){ sfx('wrong'); });
    q('[data-t5-restart]').onclick = function(){ T.reset(); };
    q('[data-t5-nextw]').onclick = function(){ sfx('click'); nextWord(); };
    qa('[data-t5-secs]').forEach(function(b){ b.onclick = function(){ S.secs = +this.dataset.t5Secs; store('secs', S.secs); screen(); }; });
    var hb = q('[data-t5-hint]'); if (hb) hb.onclick = function(){ hint = true; paint(); };
    var sb = q('[data-t5-show]'); if (sb) sb.onclick = function(){ var el = q('[data-t5-secret]'); el.classList.add('open'); el.innerHTML = face(); say(w.zh); };
    var fb = q('[data-t5-fore]'); if (fb) fb.onclick = function(){ fore(); };
  }
  // 📱 forehead mode: the word fills the screen; tap anywhere = next word
  function fore(){
    var f = document.createElement('div'); f.className = 't5-fore';
    f.innerHTML = '<div class="t5-foreword" data-fw></div><div class="t5-foretime" data-ft></div><button type="button" class="t5-forex" data-fx>✕</button><small class="t5-foretip">点屏幕换下一个词</small>';
    O.appendChild(f);
    var draw = function(){ f.querySelector('[data-fw]').innerHTML = (w.em ? '<i>' + w.em + '</i>' : '') + '<b>' + esc(w.zh) + '</b>'; f.querySelector('[data-ft]').textContent = T ? clock(T.left()) : ''; };
    draw(); var iv = setInterval(draw, 250);
    var shut = function(){ clearInterval(iv); f.remove(); try { if (document.fullscreenElement) document.exitFullscreen(); } catch(e){} };
    G.stops.push(shut);
    f.onclick = function(e){ if (e.target.closest('[data-fx]')) { shut(); return; } sfx('click'); nextWord(); draw(); };
    try { if (f.requestFullscreen) f.requestFullscreen().catch(function(){}); } catch(e){}
  }
  G.key = function(e){ if (e.key === 'ArrowRight' || e.key === ' ') { e.preventDefault(); nextWord(); } };
  screen();
}

/* ---- a drawing board (pen colours, sizes, eraser, undo, clear) ------------------------------------------------------------ */
function pad(host){
  var COLORS = ['#1e1b4b', '#ef4444', '#f59e0b', '#22c55e', '#3b82f6', '#a855f7'], strokes = [], cur = null, color = COLORS[0], width = 8, erase = false;
  host.innerHTML = '<canvas></canvas><div class="t5-tools">' + COLORS.map(function(c, i){ return '<button type="button" class="t5-dot' + (i ? '' : ' on') + '" data-c="' + c + '" style="background:' + c + '" aria-label="颜色"></button>'; }).join('') +
    '<button type="button" class="t5-tool" data-w="5">细</button><button type="button" class="t5-tool on" data-w="8">中</button><button type="button" class="t5-tool" data-w="16">粗</button><button type="button" class="t5-tool" data-erase>🧽 橡皮</button><button type="button" class="t5-tool" data-undo>↶ 撤销</button><button type="button" class="t5-tool" data-clear>🗑 清空</button></div>';
  var cv = host.querySelector('canvas'), cx = cv.getContext('2d');
  function size(){ var r = cv.getBoundingClientRect(), d = window.devicePixelRatio || 1; cv.width = Math.max(1, r.width * d); cv.height = Math.max(1, r.height * d); paint(); }
  function paint(){
    cx.setTransform(1, 0, 0, 1, 0, 0); cx.fillStyle = '#fff'; cx.fillRect(0, 0, cv.width, cv.height);
    var sx = cv.width / 1000, sy = cv.height / 750; cx.lineCap = 'round'; cx.lineJoin = 'round';
    strokes.concat(cur ? [cur] : []).forEach(function(s){ var p = s.p; cx.strokeStyle = s.c; cx.lineWidth = s.w * sx; cx.beginPath(); cx.moveTo(p[0] * sx, p[1] * sy); if (p.length === 2) cx.lineTo(p[0] * sx + 0.1, p[1] * sy); for (var i = 2; i < p.length; i += 2) cx.lineTo(p[i] * sx, p[i + 1] * sy); cx.stroke(); });
  }
  function pt(e){ var r = cv.getBoundingClientRect(); return [Math.round(Math.min(1, Math.max(0, (e.clientX - r.left) / r.width)) * 1000), Math.round(Math.min(1, Math.max(0, (e.clientY - r.top) / r.height)) * 750)]; }
  cv.addEventListener('pointerdown', function(e){ e.preventDefault(); try { cv.setPointerCapture(e.pointerId); } catch(x){} cur = { c: erase ? '#ffffff' : color, w: erase ? 34 : width, p: pt(e) }; paint(); });
  cv.addEventListener('pointermove', function(e){ if (!cur) return; var p = pt(e), l = cur.p.length; if (Math.abs(p[0] - cur.p[l - 2]) + Math.abs(p[1] - cur.p[l - 1]) < 4) return; cur.p.push(p[0], p[1]); paint(); });
  var up = function(){ if (!cur) return; strokes.push(cur); cur = null; paint(); };
  cv.addEventListener('pointerup', up); cv.addEventListener('pointercancel', up);
  host.querySelectorAll('[data-c]').forEach(function(b){ b.onclick = function(){ color = this.dataset.c; erase = false; host.querySelectorAll('[data-c],[data-erase]').forEach(function(x){ x.classList.remove('on'); }); this.classList.add('on'); }; });
  host.querySelectorAll('[data-w]').forEach(function(b){ b.onclick = function(){ width = +this.dataset.w; host.querySelectorAll('[data-w]').forEach(function(x){ x.classList.remove('on'); }); this.classList.add('on'); }; });
  host.querySelector('[data-erase]').onclick = function(){ erase = !erase; this.classList.toggle('on', erase); };
  host.querySelector('[data-undo]').onclick = function(){ strokes.pop(); paint(); };
  host.querySelector('[data-clear]').onclick = function(){ strokes = []; paint(); };
  var ro = window.ResizeObserver ? new ResizeObserver(size) : null; if (ro) { ro.observe(cv); G.stops.push(function(){ ro.disconnect(); }); } else window.addEventListener('resize', size);
  setTimeout(size, 0);
  return { set: function(s){ strokes = s || []; paint(); } };
}

/* ======================================================================================================================== */
/* 🔍 Spot the Difference: two pictures (or two cards of sentences); tap a difference → it is circled and its sentence shows */
var ITEMS = [['猫','只','🐱'],['狗','只','🐶'],['小鸟','只','🐦'],['鱼','条','🐟'],['苹果','个','🍎'],['花','朵','🌸'],['树','棵','🌳'],['星星','颗','⭐'],['汽车','辆','🚗'],['蝴蝶','只','🦋'],['房子','座','🏠'],['香蕉','根','🍌'],['书','本','📚'],['帽子','顶','🎩']];
var HUES = [['红色','#ef4444'],['蓝色','#3b82f6'],['黄色','#facc15'],['绿色','#22c55e'],['紫色','#a855f7']];
var CN = ['零','一','两','三','四','五'];
function picScene(nDiff){
  var cells = mix([0,1,2,3,4,5,6,7,8,9,10,11]), used = cells.slice(0, 9), free = cells.slice(9), names = mix(ITEMS).slice(0, 7), L = {};
  used.forEach(function(c, i){
    if (i < 7) L[c] = { kind: 'em', it: names[i], n: i < 3 ? 2 + (i % 2) : 1, big: 1 };
    else L[c] = { kind: 'ball', name: i === 7 ? '气球' : '球', hue: HUES[Math.floor(Math.random() * HUES.length)], n: 1, big: 1 };
  });
  var R = JSON.parse(JSON.stringify(L)), diffs = [];
  function take(f){ var c = used.filter(function(x){ return L[x] && f(L[x]) && R[x] && !diffs.some(function(d){ return d.cells.indexOf(x) >= 0; }); }); return c.length ? c[Math.floor(Math.random() * c.length)] : null; }
  mix(['less', 'gone', 'more', 'color', 'big', 'move', 'color']).forEach(function(t){
    if (diffs.length >= nDiff) return; var c;
    if (t === 'less' && (c = take(function(x){ return x.kind === 'em' && x.n >= 2; })) != null) { R[c].n--; diffs.push({ cells: [c], say: '左边有' + CN[L[c].n] + L[c].it[1] + L[c].it[0] + '，右边只有' + CN[R[c].n] + L[c].it[1] + '。' }); }
    else if (t === 'gone' && (c = take(function(x){ return x.kind === 'em' && x.n === 1; })) != null) { delete R[c]; diffs.push({ cells: [c], say: '右边少了一' + L[c].it[1] + L[c].it[0] + '。' }); }
    else if (t === 'more' && free.length) { c = free.shift(); var it = ITEMS.filter(function(x){ return !names.some(function(y){ return y[0] === x[0]; }); })[0]; R[c] = { kind: 'em', it: it, n: 1, big: 1 }; diffs.push({ cells: [c], say: '右边多了一' + it[1] + it[0] + '。' }); }
    else if (t === 'color' && (c = take(function(x){ return x.kind === 'ball'; })) != null) { var h = HUES.filter(function(x){ return x[0] !== L[c].hue[0]; }); R[c].hue = h[Math.floor(Math.random() * h.length)]; diffs.push({ cells: [c], say: L[c].name + '从' + L[c].hue[0] + '变成了' + R[c].hue[0] + '。' }); }
    else if (t === 'big' && (c = take(function(x){ return x.kind === 'em' && x.n === 1; })) != null) { R[c].big = 1.55; diffs.push({ cells: [c], say: '右边的' + L[c].it[0] + '变大了。' }); }
    else if (t === 'move' && free.length && (c = take(function(x){ return x.kind === 'em' && x.n === 1; })) != null) { var to = free.shift(); R[to] = R[c]; delete R[c]; diffs.push({ cells: [c, to], say: L[c].it[0] + '换了位置。' }); }
  });
  return { kind: 'pic', L: L, R: R, diffs: diffs };
}
function cellXY(c){ return [(c % 4) * 100, Math.floor(c / 4) * 100]; }
function svgOf(side){
  var out = '<svg viewBox="0 0 400 300" class="t5-svg"><rect width="400" height="300" fill="#e0f2fe"/><rect y="190" width="400" height="110" fill="#bbf7d0"/>';
  Object.keys(side).forEach(function(k){
    var x = side[k], xy = cellXY(+k), cxp = xy[0] + 50, cyp = xy[1] + 52;
    if (x.kind === 'ball') out += x.name === '气球' ? '<g transform="translate(' + cxp + ' ' + (cyp - 6) + ')"><path d="M0 22 Q-4 36 3 46" stroke="#475569" stroke-width="2" fill="none"/><ellipse rx="19" ry="23" fill="' + x.hue[1] + '" stroke="rgba(0,0,0,.2)" stroke-width="2"/><ellipse cx="-6" cy="-8" rx="5" ry="7" fill="rgba(255,255,255,.55)"/></g>'
      : '<g transform="translate(' + cxp + ' ' + cyp + ')"><circle r="20" fill="' + x.hue[1] + '" stroke="rgba(0,0,0,.25)" stroke-width="2"/><path d="M-20 0 Q0 -10 20 0" stroke="#fff" stroke-width="3" fill="none"/></g>';
    else { var n = x.n, fs = 36 * x.big * (n > 1 ? 0.78 : 1); for (var i = 0; i < n; i++) { var dx = n === 1 ? 0 : (i - (n - 1) / 2) * 30, dy = n === 3 && i === 1 ? -12 : 0; out += '<text x="' + (cxp + dx) + '" y="' + (cyp + dy + fs * 0.35) + '" font-size="' + fs + '" text-anchor="middle">' + x.it[2] + '</text>'; } }
  });
  return out + '<g data-t5-marks></g></svg>';
}
var TXT = { num: ['一','两','三','四','五'], animal: ['猫','狗','小鸟','兔子','鸭子'], place: ['树下','河边','家里','学校','公园'], color: ['红色','蓝色','黄色','绿色','白色'],
  person: ['妈妈','爸爸','哥哥','姐姐','老师'], time: ['早上','中午','下午','晚上','今天'], adj: ['很大','很小','很高','很快','很开心'], food: ['苹果','面包','米饭','饺子','面条'] };
function textScene(nDiff){
  function one(a){ return a[Math.floor(Math.random() * a.length)]; }
  var lines = [
    [['num', one(TXT.num)], ['', '只'], ['animal', one(TXT.animal)], ['', '在'], ['place', one(TXT.place)]],
    [['', '我有'], ['num', one(TXT.num)], ['', '个'], ['color', one(TXT.color)], ['', '的气球']],
    [['person', one(TXT.person)], ['time', one(TXT.time)], ['', '去'], ['place', one(TXT.place)]],
    [['animal', one(TXT.animal)], ['adj', one(TXT.adj)]],
    [['person', one(TXT.person)], ['', '喜欢吃'], ['food', one(TXT.food)]]
  ];
  var R = JSON.parse(JSON.stringify(lines)), slots = [], diffs = [], usedLine = {};
  lines.forEach(function(l, i){ l.forEach(function(ch, j){ if (ch[0]) slots.push([i, j]); }); });
  mix(slots).forEach(function(s){
    if (diffs.length >= nDiff || usedLine[s[0]]) return; var ch = lines[s[0]][s[1]], nv = one(TXT[ch[0]].filter(function(x){ return x !== ch[1]; }));
    R[s[0]][s[1]] = [ch[0], nv]; usedLine[s[0]] = 1; diffs.push({ cells: [s[0] * 10 + s[1]], say: '左边是“' + ch[1] + '”，右边是“' + nv + '”。' });
  });
  return { kind: 'text', L: lines, R: R, diffs: diffs };
}
function textCard(lines){ return '<div class="t5-txt">' + lines.map(function(l, i){ return '<p>' + l.map(function(ch, j){ return '<span data-t5-chunk="' + (i * 10 + j) + '">' + esc(ch[1]) + '</span>'; }).join('') + '。</p>'; }).join('') + '</div>'; }
function spot(){
  var level = store('spot') || 'pic', sc = null, found = [];
  function scene(){
    stop(); sc = level === 'text' ? textScene(3) : picScene(4); found = [];
    MAIN.innerHTML = '<div class="t5-play t5-g-spot"><div class="t5-status">找出 <b data-t5-found>0</b> / ' + sc.diffs.length + ' 处不同 · 找到后用中文说一说</div>' +
      '<div class="t5-pair"><div class="t5-side"><span class="t5-tag">左边</span>' + (sc.kind === 'pic' ? svgOf(sc.L) : textCard(sc.L)) + '</div><div class="t5-side"><span class="t5-tag">右边</span>' + (sc.kind === 'pic' ? svgOf(sc.R) : textCard(sc.R)) + '</div></div>' +
      '<div class="t5-says" data-t5-says></div>' +
      '<div class="t5-row t5-foot"><div class="t5-chips"><button type="button" class="t5-chip' + (level === 'pic' ? ' on' : '') + '" data-t5-level="pic">🖼 图片</button><button type="button" class="t5-chip' + (level === 'text' ? ' on' : '') + '" data-t5-level="text">🔤 文字（较难）</button></div>' +
      '<button type="button" class="t5-btn alt" data-t5-all>👀 显示答案</button><button type="button" class="t5-btn" data-t5-nextsc>换一组 ⏭</button></div></div>';
    qa('.t5-side').forEach(function(sd){ sd.addEventListener('click', tap); });
    qa('[data-t5-level]').forEach(function(b){ b.onclick = function(){ level = this.dataset.t5Level; store('spot', level); scene(); }; });
    q('[data-t5-all]').onclick = function(){ sc.diffs.forEach(function(d, i){ if (found.indexOf(i) < 0) mark(i, false); }); };
    q('[data-t5-nextsc]').onclick = scene;
  }
  function tap(e){
    var i = -1, side = e.currentTarget;
    if (sc.kind === 'text') { var sp = e.target.closest('[data-t5-chunk]'); if (sp) { var id = +sp.dataset.t5Chunk; i = sc.diffs.findIndex(function(d){ return d.cells.indexOf(id) >= 0; }); } }
    else { var r = side.querySelector('svg').getBoundingClientRect(), x = (e.clientX - r.left) / r.width * 400, y = (e.clientY - r.top) / r.height * 300;
      i = sc.diffs.findIndex(function(d){ return d.cells.some(function(c){ var xy = cellXY(c); return x >= xy[0] - 6 && x <= xy[0] + 106 && y >= xy[1] - 6 && y <= xy[1] + 106; }); }); }
    if (i < 0) { sfx('wrong'); var c = document.createElement('div'); c.className = 't5-cross'; c.textContent = '✗'; c.style.left = e.clientX + 'px'; c.style.top = e.clientY + 'px'; O.appendChild(c); setTimeout(function(){ c.remove(); }, 700); return; }
    if (found.indexOf(i) < 0) { sfx('correct'); mark(i, true); }
  }
  function mark(i, byClass){
    var d = sc.diffs[i], color = byClass ? '#f59e0b' : '#94a3b8'; found.push(i);
    qa('.t5-side').forEach(function(sd){
      if (sc.kind === 'text') d.cells.forEach(function(c){ var sp = sd.querySelector('[data-t5-chunk="' + c + '"]'); if (sp) { sp.classList.add('found'); sp.style.setProperty('--mk', color); } });
      else { var g = sd.querySelector('[data-t5-marks]'); d.cells.forEach(function(c){ var xy = cellXY(c); g.insertAdjacentHTML('beforeend', '<circle cx="' + (xy[0] + 50) + '" cy="' + (xy[1] + 50) + '" r="46" fill="none" stroke="' + color + '" stroke-width="6" class="t5-ring"/>'); }); }
    });
    var says = q('[data-t5-says]'), n = found.length; says.insertAdjacentHTML('beforeend', '<button type="button" class="t5-say" data-t5-s="' + i + '"><b>' + n + '</b> <span class="t5-sayhide">🗣 说一说，再点我看句子</span><span class="t5-saytext">' + esc(d.say) + '</span></button>');
    var btn = says.lastChild; btn.onclick = function(){ btn.classList.add('open'); say(d.say); };
    if (!byClass) btn.classList.add('open');
    q('[data-t5-found]').textContent = found.length;
  }
  G.key = function(e){ if (e.key === 'ArrowRight') scene(); };
  scene();
}

/* ======================================================================================================================== */
/* 🐝 Spelling Bee: hear the word (and only hints), spell its pinyin with tones (jiang4 shui3 or jiàng shuǐ) or write the 汉字 */
var TONE = { 'ā':'a1','á':'a2','ǎ':'a3','à':'a4','ē':'e1','é':'e2','ě':'e3','è':'e4','ī':'i1','í':'i2','ǐ':'i3','ì':'i4','ō':'o1','ó':'o2','ǒ':'o3','ò':'o4','ū':'u1','ú':'u2','ǔ':'u3','ù':'u4','ǖ':'ü1','ǘ':'ü2','ǚ':'ü3','ǜ':'ü4' };
// letters (no tones, no spaces) + the tone numbers in order; a neutral tone adds no number
function pyKey(s){
  var letters = '', tones = '';
  String(s || '').toLowerCase().normalize('NFC').replace(/v/g, 'ü').replace(/u:/g, 'ü').split('').forEach(function(ch){
    if (TONE[ch]) { letters += TONE[ch][0]; tones += TONE[ch][1]; } else if (/[1-4]/.test(ch)) tones += ch; else if (/[a-zü]/.test(ch)) letters += ch;
  });
  return { letters: letters, tones: tones };
}
function beeWords(W){ return W.filter(function(w){ return han(w.zh) && w.py && pyKey(w.py).letters; }); }
function bee(){
  var deck = mix(beeWords(G.W)), di = 0, w = null, mode = store('bee') || 'py', shown = 0, padApi = null;
  function spell(){ return Array.from(w.py.normalize('NFC')); }
  function next(){
    stop(); if (di >= deck.length) { deck = mix(beeWords(G.W)); di = 0; } w = deck[di++]; shown = 0;
    var n = Array.from(w.zh).filter(han).length;
    MAIN.innerHTML = '<div class="t5-play t5-g-bee"><div class="t5-card t5-q t5-beeq">' +
      '<div class="t5-row"><button type="button" class="t5-listen" data-t5-say>🔊</button><button type="button" class="t5-btn alt" data-t5-slow>🐢 慢速再听</button></div>' +
      '<p>' + (mode === 'py' ? '听一听，拼出拼音（带声调）' : '听一听，写出汉字') + ' · <b>' + n + ' 个字</b></p>' +
      '<div class="t5-hints"><button type="button" class="t5-chip" data-t5-h="en"' + (w.en ? '' : ' hidden') + '>💡 英文</button><button type="button" class="t5-chip" data-t5-h="pic"' + (w.img || w.em ? '' : ' hidden') + '>🖼 图片</button><button type="button" class="t5-chip" data-t5-h="sent"' + (w.sent ? '' : ' hidden') + '>📝 例句</button></div>' +
      '<div class="t5-hintbox" data-t5-hintbox></div></div>' +
      (mode === 'py'
        ? '<div class="t5-spell" data-t5-spell>' + spell().map(function(ch){ return ch === ' ' ? '<i class="gap"></i>' : '<span>' + '</span>'; }).join('') + '</div>' +
          '<div class="t5-beein"><input data-t5-in autocomplete="off" autocapitalize="off" spellcheck="false" placeholder="例如 jiang4 shui3 或 jiàng shuǐ"><button type="button" class="t5-btn" data-t5-check>检查 ✓</button></div><p class="t5-beefb" data-t5-fb>声调用数字 1–4（轻声不写），v = ü</p>'
        : '<div class="t5-board" data-t5-board></div>') +
      '<div class="t5-card t5-beeans" data-t5-ans hidden></div>' +
      '<div class="t5-row t5-foot"><div class="t5-chips"><button type="button" class="t5-chip' + (mode === 'py' ? ' on' : '') + '" data-t5-mode="py">🔤 拼音拼写</button><button type="button" class="t5-chip' + (mode === 'zh' ? ' on' : '') + '" data-t5-mode="zh">✍️ 汉字书写</button></div>' +
      (mode === 'py' ? '<button type="button" class="t5-btn alt" data-t5-letter>🔤 揭晓一个字母</button>' : '') +
      '<button type="button" class="t5-btn alt" data-t5-show>👀 公布答案</button><button type="button" class="t5-btn" data-t5-next>下一个词 ⏭</button></div></div>';
    q('[data-t5-say]').onclick = function(){ say(w.zh); };
    q('[data-t5-slow]').onclick = function(){ try { var u = new SpeechSynthesisUtterance(w.zh); u.lang = 'zh-CN'; u.rate = 0.5; speechSynthesis.cancel(); speechSynthesis.speak(u); } catch(e){} };
    qa('[data-t5-h]').forEach(function(b){ b.onclick = function(){ var k = this.dataset.t5H, box = q('[data-t5-hintbox]'); this.classList.add('on');
      box.insertAdjacentHTML('beforeend', k === 'en' ? '<div class="t5-hint en">' + esc(w.en) + '</div>' : k === 'pic' ? (w.img ? '<img class="t5-pic sm" src="' + esc(w.img) + '" alt="">' : '<div class="t5-emoji sm">' + w.em + '</div>') : '<div class="t5-hint">' + esc(w.sent.split(w.zh).join('＿＿')) + '</div>'); this.disabled = true; }; });
    qa('[data-t5-mode]').forEach(function(b){ b.onclick = function(){ mode = this.dataset.t5Mode; store('bee', mode); di--; next(); }; });
    if (mode === 'zh') padApi = pad(q('[data-t5-board]'));
    var inp = q('[data-t5-in]');
    if (inp) { inp.onkeydown = function(e){ if (e.key === 'Enter') { e.preventDefault(); check(); } }; q('[data-t5-check]').onclick = check; setTimeout(function(){ inp.focus(); }, 50); }
    var lb = q('[data-t5-letter]'); if (lb) lb.onclick = letter;
    q('[data-t5-show]').onclick = answer;
    q('[data-t5-next]').onclick = next;
    setTimeout(function(){ say(w.zh); }, 350);
  }
  function letter(){
    var tiles = qa('[data-t5-spell] span'); if (shown >= tiles.length) return;
    var chars = spell().filter(function(ch){ return ch !== ' '; }); tiles[shown].textContent = chars[shown]; tiles[shown].classList.add('on'); shown++;
  }
  function check(){
    var inp = q('[data-t5-in]'), fb = q('[data-t5-fb]'), v = inp.value.trim(); if (!v) return;
    var a = pyKey(v), b = pyKey(w.py);
    if (a.letters === b.letters && a.tones === b.tones) { sfx('correct'); fb.innerHTML = '✅ 拼对了！'; fb.className = 't5-beefb ok'; answer(); }
    else { sfx('wrong'); fb.className = 't5-beefb no'; fb.innerHTML = a.letters !== b.letters ? '❌ 字母不对，再听一听' : '🎵 字母对了，声调不对！'; inp.select(); }
  }
  function answer(){
    var tiles = qa('[data-t5-spell] span'); while (shown < tiles.length) letter();
    var box = q('[data-t5-ans]'); box.hidden = false; box.innerHTML = '<div class="t5-word">' + (w.em ? '<i>' + w.em + '</i>' : '') + '<b>' + esc(w.zh) + '</b><small>' + esc(w.py) + '</small>' + (w.en ? '<em>' + esc(w.en) + '</em>' : '') + '</div>';
    say(w.zh);
  }
  G.key = function(e){ if (e.key === 'ArrowRight') next(); };
  next();
}

/* ---- entries: teacher screens only (Teaching templates header, the Live teacher panel) ------------------------------------ */
var queued = false;
function entries(){
  if (studentMode()) return;
  var r = document.getElementById('mn-templates');
  if (r && !r.classList.contains('tt-quest824') && !r.querySelector('[data-t5-entry]')) {
    var h = r.querySelector('header'); if (h) { var b = document.createElement('button'); b.type = 'button'; b.dataset.t5Entry = ''; b.textContent = '👥 Team Games'; b.onclick = function(){ open(); }; h.insertBefore(b, h.querySelector('[data-exit]')); }
  }
  var live = document.querySelector('.mlv');
  if (live && !live.querySelector('[data-t5-entry]') && live.querySelector('[data-host],[data-teaching-templates]')) {
    var top = live.querySelector('.mlv-top'); if (top) { var bl = document.createElement('button'); bl.type = 'button'; bl.className = 'mlv-btn alt'; bl.dataset.t5Entry = ''; bl.textContent = '👥 Team Games'; bl.onclick = function(){ open(); }; top.appendChild(bl); }
  }
}
new MutationObserver(function(){ if (queued) return; queued = true; requestAnimationFrame(function(){ queued = false; entries(); }); }).observe(document.documentElement, { childList: true, subtree: true });

function open(colId){
  if (studentMode()) return;
  if (colId && srcWords('list:' + colId).length) { S.src = 'list:' + colId; store('src', S.src); }
  build(); home();
}
window.MinestTeam5 = { open: open, close: close, games: GAMES.map(function(g){ return g.k; }), version: '1' };
})();

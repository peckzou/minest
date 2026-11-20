/* Minest · 3D 词卡作业 · 教师端 (2026-11-20, the user: an isolated 3D dynamic-card page for students' vocabulary,
   word lists assigned from the teacher side).
   A word list (a teaching word set, or lists of the board in view) becomes an assignment: a code and a link to the
   student page (vocab3d.html?code=CODE, /vocab). Students study the words as 3D cards; the teacher sees each student's
   progress live, can close the assignment (students may still look; nothing more is recorded) or delete it.
   Data: Firebase Realtime Database /minest-live/{CODE} (the same place Minest Live keeps a class game; an
   assignment's code starts with V): host = { kind: 'vocab3d', title, board, state: live | ended, created }, players/{pid}.
   Entry points: "3D 词卡" on each list in Word Lists (the Live teacher panel) and in 教师端 · 词表管理; MinestVocab3D.assign(board, o).
   window.MinestVocab3D = { assign, manage, pack } */
(function () {
  'use strict';
  if (window.MinestVocab3D) return;
  var DB = 'https://minest-33761-default-rtdb.firebaseio.com/minest-live/';
  var SITE = /vercel\.app$/.test(location.hostname) ? location.origin : 'https://minest-app.vercel.app';
  var MINE = 'minest.vocab3d.mine.v1';

  function db(path, method, body) {
    return fetch(DB + path + '.json', { method: method || 'GET', headers: body ? { 'Content-Type': 'application/json' } : undefined, body: body ? JSON.stringify(body) : undefined, cache: 'no-store' })
      .then(function (r) { if (!r.ok) throw new Error('网络错误（' + r.status + '）'); return r.json(); });
  }
  function esc(s) { return String(s == null ? '' : s).replace(/[&<>"']/g, function (c) { return { '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' }[c]; }); }
  function str(v, n) { v = v == null ? '' : String(v).replace(/<[^>]*>/g, ' ').replace(/[#*_>`]/g, '').replace(/\s+/g, ' ').trim(); return v.length > n ? v.slice(0, n - 1) + '…' : v; }
  function newCode() { var o = String(1 + Math.floor(Math.random() * 9)); for (var i = 0; i < 5; i++) o += Math.floor(Math.random() * 10); return o; }   // six digits, like a Live game's
  function mine() { try { return JSON.parse(localStorage.getItem(MINE) || '[]') || []; } catch (e) { return []; } }
  function saveMine(m) { try { localStorage.setItem(MINE, JSON.stringify(m.slice(0, 60))); } catch (e) {} }
  function link(code) { return SITE + '/iphone?play=' + code; }   // the one student entry: Live's join (the code opens this assignment)
  function page(code) { return (/^https?:$/.test(location.protocol) ? location.origin : SITE) + '/vocab3d.html?code=' + code; }
  function ago(t) { if (!t) return '—'; var s = Math.max(0, (Date.now() - t) / 1000); return s < 60 ? '刚刚' : s < 3600 ? Math.floor(s / 60) + ' 分钟前' : s < 86400 ? Math.floor(s / 3600) + ' 小时前' : new Date(t).toLocaleDateString(); }

  /* a card, as the student page needs it: words, meaning, sound, examples, roots — and a picture only when it is on the web
     (a picture kept on this device cannot reach a student's) */
  function imgOf(c) {
    var u = '';
    try { if (window.MinestImageViews && MinestImageViews.image) { var im = MinestImageViews.image(c) || {}; u = im.thumb || im.full || ''; } } catch (e) {}
    if (!u) u = c.image || c.img || (c.cover && (c.cover.url || c.cover.src)) || '';
    return /^https?:\/\//.test(u) ? u : '';
  }
  function pack(c) {
    var o = { id: String(c.id), title: str(c.title, 90) }, d = c.definitions || {};
    if (c.titleZh) o.titleZh = str(c.titleZh, 90);
    var pyLike = function (v) { return /[āáǎàēéěèīíǐìōóǒòūúǔùǖǘǚǜ]/i.test(String(v || '')); };   // a pinyin back is the sound, not the meaning
    var pr = c.pron; pr = typeof pr === 'string' ? pr : pr && (pr.ipa || pr.phonetic || pr.us || pr.text) || c.phonetic || c.py || c.pinyin || '';
    if (!pr && /[\u3400-\u9fff]/.test(c.title || '')) { try { pr = window.MinestTeachingAssets && MinestTeachingAssets.pinyin ? MinestTeachingAssets.pinyin(c.title) : ''; } catch (e) {} if (/[\u3400-\u9fff]/.test(pr || '')) pr = ''; }
    if (!pr && pyLike(c.desc || c.back)) pr = c.desc || c.back;
    if (pr) o.pron = str(pr, 60);
    var mean = [c.meaning, c.en, c.back, c.desc, c.description].filter(function (v) { return v && String(v).trim() && !pyLike(v); })[0] || '';
    if (mean) o.meaning = str(mean, 300);
    if (d.en || c.definitionEn) o.defEn = str(d.en || c.definitionEn, 300);
    if (d.zh || c.definitionZh) o.defZh = str(d.zh || c.definitionZh, 200);
    var ex = (Array.isArray(c.examples) ? c.examples : []).map(function (e) { return typeof e === 'string' ? e : e && e.text; }).filter(Boolean).slice(0, 3).map(function (e) { return str(e, 220); });
    if (ex.length) o.examples = ex;
    var rel = (Array.isArray(c.relatedWords) ? c.relatedWords : []).map(function (r) { return typeof r === 'string' ? r : r && (r.word || r.text); }).filter(Boolean).slice(0, 6).map(function (r) { return str(r, 40); });
    if (rel.length) o.related = rel;
    var ety = c.etymology || c.roots || c.wordRoot || c.origin; if (ety) o.ety = str(ety, 200);
    if (c.hint) o.hint = str(c.hint, 160);
    var im = imgOf(c); if (im) o.img = im;
    return o;
  }
  function packBoard(b, ids, title) {
    var cols = (b.columns || []).filter(function (c) { return !ids || ids.indexOf(c.id) >= 0; }).map(function (c) {
      var cards = (c.cards || []).filter(function (k) { return k && k.title && !k.teachingArchived; }).map(pack);
      return { id: String(c.id), title: str(c.title || '词表', 60), color: c.color || '', cards: cards };
    }).filter(function (c) { return c.cards.length; });
    return { id: String(b.id || 'board'), title: str(title || b.title || '3D 词卡', 80), columns: cols };
  }

  /* ---------------- the look ---------------- */
  var css = document.createElement('style');
  /* the look: Minest Live's (Blooket-like) — a purple room, white chunky cards, Titan One titles, buttons that press down */
  var INK = '#2f2a3d', MUTE = '#7a7090', PURP = '#7b2ff7', DEEP = '#4b11b8', TEAL = '#0bc2cf', GOLD = '#ffcc00';
  var TITLE = '"Titan One","Lilita One",Nunito,system-ui,sans-serif', BODY = 'Nunito,"Nunito Sans",ui-rounded,system-ui,sans-serif';
  var BTN = 'border:0;border-radius:14px;font-family:' + TITLE + ';font-weight:400;letter-spacing:.02em;color:#fff;text-shadow:0 2px 0 rgba(0,0,0,.18);box-shadow:inset 0 -6px 0 rgba(0,0,0,.22),0 4px 10px rgba(40,0,90,.2);padding:11px 18px 15px;cursor:pointer';
  if (!document.getElementById('mlv-toon-font')) { var fl = document.createElement('link'); fl.id = 'mlv-toon-font'; fl.rel = 'stylesheet'; fl.href = 'https://fonts.googleapis.com/css2?family=Titan+One&family=Nunito:wght@600;700;800;900&display=swap'; document.head.appendChild(fl); }
  css.textContent = [
    '#v3t{position:fixed;inset:0;z-index:2147483300;display:grid;place-items:center;padding:16px;background:repeating-linear-gradient(135deg,rgba(255,255,255,.045) 0 26px,transparent 26px 52px),linear-gradient(160deg,rgba(106,34,238,.92),rgba(123,47,247,.92) 45%,rgba(155,77,255,.92));font-family:' + BODY + ';font-weight:700;color:' + INK + '}',
    '#v3t .v3-m{width:min(600px,100%);max-height:min(90vh,880px);overflow:auto;border-radius:22px;background:#fff;box-shadow:inset 0 -7px 0 rgba(0,0,0,.09),0 14px 34px rgba(40,0,90,.35);padding:22px 22px 18px}',
    '#v3t h2{margin:0;font:400 24px/1.15 ' + TITLE + ';color:' + PURP + ';letter-spacing:.02em}#v3t .v3-sub{margin:6px 0 0;color:' + MUTE + ';font-size:14px;font-weight:700}',
    '#v3t .v3-hd{display:flex;align-items:flex-start;gap:12px;margin-bottom:16px}#v3t .v3-hd>div{flex:1}',
    '#v3t .v3-x{flex:none;width:38px;height:38px;border-radius:12px;border:0;background:#f1ebff;color:' + PURP + ';font:400 17px ' + TITLE + ';box-shadow:inset 0 -4px 0 rgba(0,0,0,.1);cursor:pointer}',
    '#v3t label.v3-f{display:block;margin:0 0 14px;font-size:13px;color:' + MUTE + ';font-weight:800}#v3t input[type=text]{display:block;width:100%;box-sizing:border-box;margin-top:6px;padding:11px 13px;border-radius:12px;border:3px solid #e4d9ff;background:#fff;color:' + INK + ';font:800 16px ' + BODY + ';outline:none}#v3t input[type=text]:focus{border-color:#9b4dff}',
    '#v3t .v3-lists{display:flex;flex-direction:column;gap:8px;margin:8px 0 16px;max-height:240px;overflow:auto;padding:2px}',
    '#v3t .v3-l{display:flex;align-items:center;gap:10px;padding:11px 14px;border-radius:14px;background:#f6f2ff;box-shadow:inset 0 -4px 0 rgba(0,0,0,.06);cursor:pointer;font-size:15px;font-weight:800}#v3t .v3-l input{accent-color:' + PURP + ';width:19px;height:19px}#v3t .v3-l small{margin-left:auto;color:' + MUTE + '}',
    '#v3t .v3-b{' + BTN + ';background:' + TEAL + ';font-size:15px}#v3t .v3-b:active{transform:translateY(3px);box-shadow:inset 0 -2px 0 rgba(0,0,0,.22)}#v3t .v3-b.pri{background:' + GOLD + ';color:' + INK + ';text-shadow:none}#v3t .v3-b.solo{background:#ff4f7b}#v3t .v3-b.warn{background:#fff;color:#e8505b;text-shadow:none;box-shadow:inset 0 -5px 0 rgba(0,0,0,.1),0 3px 8px rgba(40,0,90,.15)}#v3t .v3-b[disabled]{opacity:.5}',
    '#v3t .v3-row{display:flex;gap:10px;flex-wrap:wrap;align-items:center}#v3t .v3-msg{min-height:18px;margin:10px 0 0;font-size:14px;color:#e8505b}',
    '#v3t .v3-code{display:flex;align-items:center;justify-content:space-between;gap:12px;padding:16px 18px;border-radius:18px;background:' + PURP + ';color:#fff;box-shadow:inset 0 -6px 0 rgba(0,0,0,.2);margin-bottom:12px}',
    '#v3t .v3-code b{font:400 44px/1 ' + TITLE + ';letter-spacing:.12em;color:#fff;text-shadow:0 4px 0 rgba(0,0,0,.25)}#v3t .v3-code span{display:block;font-size:13px;color:rgba(255,255,255,.8);margin-bottom:6px}',
    '#v3t .v3-code .v3-b{background:#fff;color:' + PURP + ';text-shadow:none}',
    '#v3t .v3-link{display:flex;gap:8px;align-items:center;margin-bottom:6px}#v3t .v3-link code{flex:1;min-width:0;overflow:hidden;text-overflow:ellipsis;white-space:nowrap;padding:11px 12px;border-radius:12px;background:#f6f2ff;font:800 13px ' + BODY + ';color:' + PURP + '}',
    '#v3t .v3-hint{margin:0 0 14px;color:' + MUTE + ';font-size:13px}#v3t .v3-hint b{color:' + INK + '}',
    '#v3t table{width:100%;border-collapse:separate;border-spacing:0 6px;font-size:14.5px}#v3t th{text-align:left;color:' + MUTE + ';font-weight:800;font-size:12.5px;padding:2px 8px}#v3t td{padding:10px 8px;background:#f6f2ff}#v3t td:first-child{border-radius:12px 0 0 12px;font-weight:900}#v3t td:last-child{border-radius:0 12px 12px 0}',
    '#v3t .v3-bar{height:10px;border-radius:5px;background:#e4d9ff;overflow:hidden;min-width:70px}#v3t .v3-bar i{display:block;height:100%;background:' + TEAL + ';border-radius:5px}',
    '#v3t .v3-none{padding:20px;text-align:center;color:' + MUTE + ';font-size:14.5px;border:3px dashed #e4d9ff;border-radius:16px}',
    '#v3t .v3-mine{display:flex;flex-direction:column;gap:8px}#v3t .v3-mine button{display:flex;align-items:center;gap:10px;text-align:left;padding:12px 14px;border-radius:14px;border:0;background:#f6f2ff;box-shadow:inset 0 -4px 0 rgba(0,0,0,.06);color:' + INK + ';font:800 15px ' + BODY + ';cursor:pointer}#v3t .v3-mine b{font:400 16px ' + TITLE + ';color:' + PURP + ';letter-spacing:.06em}#v3t .v3-mine small{margin-left:auto;color:' + MUTE + '}',
    '#v3t h3{margin:18px 0 6px;font:400 18px ' + TITLE + ';color:' + INK + ';letter-spacing:.02em}',
    '#v3t .v3-views{display:grid;grid-template-columns:repeat(auto-fit,minmax(150px,1fr));gap:10px;margin:8px 0 18px}#v3t .v3-views label{position:relative;display:flex;flex-direction:column;gap:4px;padding:13px 12px 13px 38px;border-radius:16px;background:#f6f2ff;box-shadow:inset 0 -5px 0 rgba(0,0,0,.07);cursor:pointer}',
    '#v3t .v3-views input{position:absolute;left:13px;top:15px;accent-color:' + PURP + ';width:17px;height:17px}#v3t .v3-views b{font:400 16px ' + TITLE + ';letter-spacing:.02em}#v3t .v3-views small{font-size:12px;color:' + MUTE + '}#v3t .v3-views label:has(input:checked){background:' + PURP + ';color:#fff}#v3t .v3-views label:has(input:checked) small{color:rgba(255,255,255,.85)}',
    '#v3t .v3-sw{display:grid;grid-template-columns:repeat(3,1fr);gap:10px;margin:4px 0 6px}#v3t .v3-sw button{display:flex;flex-direction:column;align-items:center;gap:3px;padding:12px 8px 14px;border:0;border-radius:16px;background:#c9c2d8;color:#fff;cursor:pointer;box-shadow:inset 0 -6px 0 rgba(0,0,0,.14);font-family:' + BODY + '}',
    '#v3t .v3-sw button span{font-size:26px;filter:grayscale(1);opacity:.7}#v3t .v3-sw button b{font:400 15px ' + TITLE + ';letter-spacing:.02em}#v3t .v3-sw button i{font-style:normal;font:400 13px ' + TITLE + ';padding:2px 12px 4px;border-radius:9px;background:rgba(0,0,0,.18)}',
    '#v3t .v3-sw button.on{background:#22b35e;box-shadow:inset 0 -6px 0 rgba(0,0,0,.22)}#v3t .v3-sw button.on span{filter:none;opacity:1}#v3t .v3-sw button.on i{background:' + GOLD + ';color:' + INK + '}#v3t .v3-sw button:active{transform:translateY(3px)}',
    '#v3-solo{position:fixed;inset:0;z-index:2147483400;background:' + DEEP + '}#v3-solo iframe{position:absolute;left:0;right:0;bottom:0;top:calc(env(safe-area-inset-top,0px) + 52px);width:100%;height:calc(100% - env(safe-area-inset-top,0px) - 52px);border:0;background:#000}',
    '#v3-solo .v3s-bar{position:absolute;left:0;right:0;top:0;height:calc(env(safe-area-inset-top,0px) + 52px);padding:env(safe-area-inset-top,0px) 10px 0 18px;box-sizing:border-box;display:flex;align-items:center;gap:12px;background:' + DEEP + ';color:#fff;font-family:' + BODY + ';font-weight:800;box-shadow:0 4px 0 rgba(0,0,0,.18);white-space:nowrap}#v3-solo .v3s-bar button{margin-left:auto}',
    '#v3-solo .v3s-bar b{font:400 16px ' + TITLE + ';letter-spacing:.02em}#v3-solo .v3s-bar span{font-size:12.5px;opacity:.85}#v3-solo .v3s-bar button{width:36px;height:36px;border:0;border-radius:11px;background:#fff;color:' + PURP + ';font:400 16px ' + TITLE + ';box-shadow:inset 0 -4px 0 rgba(0,0,0,.12);cursor:pointer}',
    '.v3-entry{white-space:nowrap}'
  ].join('');
  document.head.appendChild(css);

  var MODES = [['cards', '🧊', '3D 词卡', '九种 3D 动态卡片 · 爆炸学习卡'], ['drive', '🚗', 'Knowledge Drive', '坐车沿路看词，每个词表一条路'], ['type', '⌨️', '3D Type', '拼音打字：跟打 + 四关闯关']];
  function modesOf(h) { if (h && h.modes) return h.modes; var o = {}; o[h && (h.view === 'drive' || h.view === 'type') ? h.view : 'cards'] = true; return o; }
  var M = null, poll = 0;
  function shut() { clearInterval(poll); poll = 0; if (M) { M.remove(); M = null; } document.removeEventListener('keydown', onKey, true); }
  function onKey(e) { if (e.key === 'Escape' && M) { e.stopPropagation(); shut(); } }
  function modal(html) {
    shut(); M = document.createElement('div'); M.id = 'v3t'; M.innerHTML = '<div class="v3-m" role="dialog" aria-modal="true">' + html + '</div>';
    M.addEventListener('click', function (e) { if (e.target === M) shut(); });
    ['pointerdown', 'touchstart', 'keydown', 'wheel'].forEach(function (t) { M.addEventListener(t, function (e) { e.stopPropagation(); }, { passive: true }); });
    document.body.appendChild(M); document.addEventListener('keydown', onKey, true);
    var x = M.querySelector('.v3-x'); if (x) x.onclick = shut;
    return M;
  }
  function hd(title, sub) { return '<div class="v3-hd"><div><h2>' + title + '</h2>' + (sub ? '<p class="v3-sub">' + sub + '</p>' : '') + '</div><button type="button" class="v3-x" aria-label="关闭">✕</button></div>'; }

  /* ---------------- assign ---------------- */
  function assign(board, o) {
    o = o || {}; if (!board || !(board.columns || []).length) { alert('没有可以布置的词表。'); return; }
    var cols = board.columns.filter(function (c) { return !c.teachingListArchived && (c.cards || []).some(function (k) { return k && k.title && !k.teachingArchived; }); });
    var pre = o.listIds || (cols.length === 1 ? [cols[0].id] : []);
    var title = o.title || (pre.length === 1 ? (cols.filter(function (c) { return c.id === pre[0]; })[0] || {}).title : board.title) || '3D 词卡';
    var m = modal(hd('布置给学生', '学生在 /iphone?play 输入课堂码，在关卡地图里玩你开放的游戏模式；你在这里随时开关模式、看每个人的进度。') +
      '<label class="v3-f">作业标题<input type="text" data-t maxlength="80" value="' + esc(title) + '"></label>' +
      '<div style="font-size:12.5px;color:#93a0b8;font-weight:600">选择词表</div><div class="v3-lists">' +
      cols.map(function (c) { var n = (c.cards || []).filter(function (k) { return k && k.title && !k.teachingArchived; }).length;
        return '<label class="v3-l"><input type="checkbox" value="' + esc(c.id) + '"' + (pre.indexOf(c.id) >= 0 ? ' checked' : '') + '>' + esc(c.title || '词表') + '<small>' + n + ' 个词</small></label>'; }).join('') +
      '</div><div style="font-size:13px;color:#7a7090;font-weight:800">游戏模式 · 学生在关卡地图里选（之后也能随时开关）</div><div class="v3-views">' +
      MODES.map(function (x) { return '<label><input type="checkbox" name="v3mode" value="' + x[0] + '" checked><b>' + x[1] + ' ' + x[2] + '</b><small>' + x[3] + '</small></label>'; }).join('') +
      '</div><div class="v3-row"><button type="button" class="v3-b pri" data-go>生成课堂码</button><button type="button" class="v3-b" data-mine>我布置的作业</button></div><p class="v3-msg" data-msg></p>');
    m.querySelector('[data-mine]').onclick = manage;
    m.querySelector('[data-go]').onclick = function () {
      var btn = this, msg = m.querySelector('[data-msg]'), ids = [].map.call(m.querySelectorAll('.v3-lists input:checked'), function (i) { return i.value; });
      if (!ids.length) { msg.textContent = '至少选一个词表。'; return; }
      var t = m.querySelector('[data-t]').value.trim() || '3D 词卡', pb = packBoard(board, ids, t), n = pb.columns.reduce(function (s, c) { return s + c.cards.length; }, 0);
      if (!n) { msg.textContent = '选中的词表里没有词。'; return; }
      if (![].some.call(m.querySelectorAll('input[name=v3mode]'), function (x) { return x.checked; })) { msg.textContent = '至少开一个游戏模式。'; return; }
      if (n > 400) { msg.textContent = '一次最多布置 400 个词（现在 ' + n + ' 个），请少选几个词表。'; return; }
      btn.disabled = true; msg.textContent = '';
      (function tryCode(k) {
        var code = newCode();
        return db(code).then(function (cur) {
          if (cur && k < 5) return tryCode(k + 1);
          if (cur) throw new Error('课堂码冲突，请再试一次。');
          var md = {}; [].forEach.call(m.querySelectorAll('input[name=v3mode]'), function (x) { md[x.value] = x.checked; });
          var vw = MODES.filter(function (x) { return md[x[0]]; }).map(function (x) { return x[0]; })[0] || 'cards';
          var host = { kind: 'vocab3d', v: 2, view: vw, modes: md, title: t, board: pb, state: 'live', created: { '.sv': 'timestamp' }, words: n };
          return db(code + '/host', 'PUT', host).then(function () {
            var all = mine().filter(function (x) { return x.code !== code; }); all.unshift({ code: code, title: t, at: Date.now(), words: n, modes: md }); saveMine(all);
            roster(code);
          });
        });
      })(0).catch(function (e) { btn.disabled = false; msg.textContent = '没有布置成功：' + (e.message || e); });
    };
  }

  /* ---------------- one assignment: code, link, students ---------------- */
  function roster(code) {
    var m = modal('<div data-head></div><div class="v3-code"><div><span>课堂码</span><b>' + esc(code) + '</b></div><button type="button" class="v3-b" data-copy-code>复制</button></div>' +
      '<div class="v3-link"><code>' + esc(link(code)) + '</code><button type="button" class="v3-b pri" data-copy>复制链接</button></div><p class="v3-hint">学生打开 <b>' + esc(SITE.replace(/^https?:\/\//, '')) + '/iphone?play</b>，输入课堂码和名字就能进入。</p>' +
      '<h3>游戏模式 · 点一下开关</h3><div class="v3-sw" data-sw></div>' +
      '<div data-body><div class="v3-none">正在读取…</div></div>' +
      '<div class="v3-row" style="margin-top:16px"><button type="button" class="v3-b solo" data-open-page>🕹 Solo 试玩</button><button type="button" class="v3-b" data-toggle></button><button type="button" class="v3-b warn" data-del>删除作业</button><button type="button" class="v3-b" data-mine style="margin-left:auto">全部作业</button></div><p class="v3-msg" data-msg></p>');
    var host = null, msg = m.querySelector('[data-msg]');
    function copy(t, b) { var done = function () { var o = b.textContent; b.textContent = '已复制 ✓'; setTimeout(function () { b.textContent = o; }, 1400); };
      try { navigator.clipboard.writeText(t).then(done, function () { prompt('复制这段：', t); }); } catch (e) { prompt('复制这段：', t); } }
    m.querySelector('[data-copy]').onclick = function () { copy(link(code), this); };
    m.querySelector('[data-copy-code]').onclick = function () { copy(code, this); };
    m.querySelector('[data-open-page]').onclick = function () { solo(code); };
    m.querySelector('[data-mine]').onclick = manage;
    m.querySelector('[data-toggle]').onclick = function () {
      if (!host) return; var b = this; b.disabled = true;
      db(code + '/host', 'PATCH', { state: host.state === 'ended' ? 'live' : 'ended' }).then(function (v) { host.state = v.state; paint(); }).catch(function (e) { msg.textContent = e.message; }).then(function () { b.disabled = false; });
    };
    m.querySelector('[data-del]').onclick = function () {
      if (!confirm('删除这个作业和所有学生的进度？删除后学生的链接也打不开了，无法恢复。')) return;
      db(code, 'DELETE').then(function () { saveMine(mine().filter(function (x) { return x.code !== code; })); manage(); }).catch(function (e) { msg.textContent = '没有删除成功：' + e.message; });
    };
    var players = {};
    function paint() {
      if (!M || M !== m) return;
      m.querySelector('[data-head]').innerHTML = hd(esc(host ? host.title : code), host ? MODES.filter(function (x) { return modesOf(host)[x[0]]; }).map(function (x) { return x[1]; }).join(' ') + ' · ' + (host.words || 0) + ' 个词 · 布置于 ' + new Date(host.created).toLocaleString() + (host.state !== 'ended' ? ' · <span style="color:#86efac">开放中</span>' : ' · <span style="color:#fca5a5">已结束</span>') : '');
      var x = m.querySelector('.v3-x'); if (x) x.onclick = shut;
      m.querySelector('[data-toggle]').textContent = host && host.state !== 'ended' ? '结束作业' : '重新开放';
      var md = modesOf(host), sw = m.querySelector('[data-sw]');
      sw.innerHTML = MODES.map(function (x) { return '<button type="button" class="' + (md[x[0]] ? 'on' : '') + '" data-mode="' + x[0] + '"><span>' + x[1] + '</span><b>' + x[2] + '</b><i>' + (md[x[0]] ? '开' : '关') + '</i></button>'; }).join('');
      [].forEach.call(sw.querySelectorAll('[data-mode]'), function (b) { b.onclick = function () {
        var nx = {}; MODES.forEach(function (x) { nx[x[0]] = !!md[x[0]]; }); nx[b.getAttribute('data-mode')] = !nx[b.getAttribute('data-mode')];
        if (!MODES.some(function (x) { return nx[x[0]]; })) { msg.textContent = '至少开一个游戏模式。'; return; }
        b.disabled = true; db(code + '/host', 'PATCH', { modes: nx }).then(function () { host.modes = nx; msg.textContent = ''; paint(); }).catch(function (e) { b.disabled = false; msg.textContent = '没有改成：' + e.message; });
      }; });
      var rows = Object.keys(players || {}).map(function (k) { return players[k]; }).filter(function (p) { return p && p.name; }).sort(function (a, b) { return (b.known || 0) - (a.known || 0) || (b.seen || 0) - (a.seen || 0); });
      var tot = host && host.words || 1;
      m.querySelector('[data-body]').innerHTML = '<h3>学生进度 · ' + rows.length + ' 人</h3>' + (rows.length ? '<table><tr><th>学生</th><th>看过</th><th>会了</th><th style="width:26%"></th>' + (modesOf(host).type ? '<th>闯关</th><th>字/分</th>' : '') + '<th>最近</th></tr>' + rows.map(function (p) {
        var k = Math.min(tot, p.known || 0), s = Math.min(tot, p.seen || 0);
        return '<tr><td>' + esc(p.name) + '</td><td>' + s + '/' + tot + '</td><td>' + k + '</td><td><div class="v3-bar"><i style="width:' + Math.round(k / tot * 100) + '%"></i></div></td>' + (modesOf(host).type ? '<td>' + typeCell(p.type) + '</td><td>' + (p.type && p.type.best ? p.type.best.cpm : '—') + '</td>' : '') + '<td style="color:#8190a8">' + ago(p.at) + '</td></tr>';
      }).join('') + '</table>' : '<div class="v3-none">还没有学生加入。把课堂码或链接发给学生。</div>');
    }
    function load() {
      return db(code).then(function (d) {
        if (!d || !d.host) { m.querySelector('[data-body]').innerHTML = '<div class="v3-none">这个作业已经不存在了。</div>'; clearInterval(poll); return; }
        host = d.host; players = d.players || {}; paint();
      }).catch(function (e) { msg.textContent = '读取失败：' + e.message; });
    }
    load(); poll = setInterval(function () { if (!document.hidden) load(); }, 4000);
  }

  function typeCell(t) {   // 3D Type: the highest level with a star, and its stars
    if (!t || !t.lv) return '—'; var top = 0; Object.keys(t.lv).forEach(function (n) { if (t.lv[n] > 0 && +n > top) top = +n; });
    return top ? '第 ' + top + ' 关 ' + '★★★'.slice(0, t.lv[top]) : '—';
  }

  /* Solo: what the students see, here, full screen (?preview: nothing goes into the progress) */
  function solo(code) {
    var o = document.createElement('div'); o.id = 'v3-solo';
    o.innerHTML = '<iframe title="Solo" allow="autoplay; fullscreen"></iframe><div class="v3s-bar"><b>🕹 Solo · 学生看到的样子</b><span>预览不计入进度</span><button type="button" aria-label="结束 Solo">✕</button></div>';
    o.querySelector('iframe').src = page(code) + '&preview=1';
    o.querySelector('button').onclick = function () { o.remove(); };
    ['pointerdown', 'keydown', 'wheel', 'touchstart'].forEach(function (t) { o.addEventListener(t, function (e) { e.stopPropagation(); }, { passive: true }); });
    document.body.appendChild(o);
  }

  /* ---------------- every assignment made on this device ---------------- */
  function manage() {
    var all = mine();
    var m = modal(hd('我布置的作业', '在这台设备上布置的作业；点开看学生进度。') + (all.length ? '<div class="v3-mine">' + all.map(function (x) {
      return '<button type="button" data-code="' + esc(x.code) + '"><b>' + esc(x.code) + '</b>' + (x.modes ? MODES.filter(function (q) { return x.modes[q[0]]; }).map(function (q) { return q[1]; }).join('') + ' ' : '') + esc(x.title) + '<small>' + (x.words || 0) + ' 词 · ' + new Date(x.at).toLocaleDateString() + '</small></button>';
    }).join('') + '</div>' : '<div class="v3-none">还没有布置过 3D 词卡作业。在词表旁点「3D 词卡」开始。</div>'));
    [].forEach.call(m.querySelectorAll('[data-code]'), function (b) { b.onclick = function () { roster(b.getAttribute('data-code')); }; });
  }

  /* ---------------- the entries: a "3D 词卡" button on each word list ---------------- */
  function sets() { try { return window.MinestTeachingSets && MinestTeachingSets.read ? MinestTeachingSets.read() : null; } catch (e) { return null; } }
  function entryBtn(cls, id) {
    var b = document.createElement('button'); b.type = 'button'; b.className = cls + ' v3-entry'; b.textContent = '🎓 布置给学生'; b.title = '把这个词表布置给学生：3D 词卡或 Knowledge Drive';
    b.addEventListener('click', function (e) { e.stopPropagation(); e.preventDefault(); var s = sets(); if (s) assign(s, { listIds: [id] }); }, true);
    return b;
  }
  function decorate() {
    if (window.isStudentMode && window.isStudentMode()) return;
    [].forEach.call(document.querySelectorAll('.tl-row[data-set-row]'), function (r) {
      if (r.querySelector('.v3-entry')) return; var id = r.getAttribute('data-set-row'), ed = r.querySelector('[data-set-edit]');
      var b = entryBtn(ed ? ed.className : 'mlv-btn alt', id); if (ed && ed.parentNode) ed.parentNode.insertBefore(b, ed.nextSibling); else r.appendChild(b);
    });
    [].forEach.call(document.querySelectorAll('.teacher-list-card'), function (c) {
      if (c.querySelector('.v3-entry')) return; var sel = c.querySelector('[data-tm-select]'); if (!sel) return;
      var b = entryBtn('teacher-btn teacher-btn-alt', sel.getAttribute('data-tm-select')); sel.parentNode.insertBefore(b, sel.nextSibling);
    });
  }
  var q = 0;
  new MutationObserver(function () { if (q) return; q = requestAnimationFrame(function () { q = 0; decorate(); }); }).observe(document.documentElement, { childList: true, subtree: true });

  window.MinestVocab3D = { assign: assign, manage: manage, pack: pack, roster: roster };
})();

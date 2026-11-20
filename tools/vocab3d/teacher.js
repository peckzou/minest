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
  function newCode() { var a = 'ABCDEFGHJKLMNPQRSTUVWXYZ23456789', o = 'V'; for (var i = 0; i < 5; i++) o += a[Math.floor(Math.random() * a.length)]; return o; }
  function mine() { try { return JSON.parse(localStorage.getItem(MINE) || '[]') || []; } catch (e) { return []; } }
  function saveMine(m) { try { localStorage.setItem(MINE, JSON.stringify(m.slice(0, 60))); } catch (e) {} }
  function link(code) { return SITE + '/vocab?code=' + code; }
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
  css.textContent = [
    '#v3t{position:fixed;inset:0;z-index:2147483300;display:grid;place-items:center;padding:16px;background:rgba(6,9,18,.55);-webkit-backdrop-filter:blur(10px);backdrop-filter:blur(10px);font-family:-apple-system,"SF Pro Text","PingFang SC",system-ui,sans-serif;color:#e8eefb}',
    '#v3t .v3-m{width:min(560px,100%);max-height:min(88vh,860px);overflow:auto;border-radius:24px;background:linear-gradient(180deg,rgba(30,34,46,.96),rgba(16,19,28,.97));border:1px solid rgba(255,255,255,.1);box-shadow:0 30px 80px -20px rgba(0,0,0,.7),inset 0 1px 0 rgba(255,255,255,.08);padding:20px 20px 18px}',
    '#v3t h2{margin:0;font:700 19px/1.2 inherit;letter-spacing:.01em}#v3t .v3-sub{margin:4px 0 0;color:#93a0b8;font-size:13px}',
    '#v3t .v3-hd{display:flex;align-items:flex-start;gap:12px;margin-bottom:16px}#v3t .v3-hd>div{flex:1}',
    '#v3t .v3-x{flex:none;width:34px;height:34px;border-radius:50%;border:0;background:rgba(255,255,255,.08);color:#cfd8ea;font-size:15px;cursor:pointer}',
    '#v3t label.v3-f{display:block;margin:0 0 14px;font-size:12.5px;color:#93a0b8;font-weight:600}#v3t input[type=text]{display:block;width:100%;box-sizing:border-box;margin-top:6px;padding:11px 13px;border-radius:12px;border:1px solid rgba(255,255,255,.12);background:rgba(255,255,255,.05);color:#fff;font:500 15px inherit;outline:none}',
    '#v3t .v3-lists{display:flex;flex-direction:column;gap:6px;margin:6px 0 14px;max-height:240px;overflow:auto}',
    '#v3t .v3-l{display:flex;align-items:center;gap:10px;padding:10px 12px;border-radius:12px;background:rgba(255,255,255,.04);border:1px solid rgba(255,255,255,.07);cursor:pointer;font-size:14px}#v3t .v3-l input{accent-color:#7dd3fc;width:17px;height:17px}#v3t .v3-l small{margin-left:auto;color:#8190a8}',
    '#v3t .v3-b{border:0;border-radius:13px;padding:11px 16px;font:650 14px inherit;cursor:pointer;background:rgba(255,255,255,.09);color:#e8eefb}#v3t .v3-b.pri{background:linear-gradient(180deg,#7dd3fc,#38bdf8);color:#04203a}#v3t .v3-b.warn{color:#fca5a5}#v3t .v3-b[disabled]{opacity:.5}',
    '#v3t .v3-row{display:flex;gap:8px;flex-wrap:wrap;align-items:center}#v3t .v3-msg{min-height:18px;margin:8px 0 0;font-size:13px;color:#fca5a5}',
    '#v3t .v3-code{display:flex;align-items:center;justify-content:space-between;gap:12px;padding:16px 18px;border-radius:18px;background:radial-gradient(120% 120% at 0 0,rgba(125,211,252,.18),rgba(255,255,255,.03));border:1px solid rgba(125,211,252,.25);margin-bottom:12px}',
    '#v3t .v3-code b{font:800 34px/1 ui-monospace,"SF Mono",Menlo,monospace;letter-spacing:.14em;color:#fff}#v3t .v3-code span{display:block;font-size:12px;color:#93a0b8;margin-bottom:6px}',
    '#v3t .v3-link{display:flex;gap:8px;align-items:center;margin-bottom:16px}#v3t .v3-link code{flex:1;min-width:0;overflow:hidden;text-overflow:ellipsis;white-space:nowrap;padding:10px 12px;border-radius:11px;background:rgba(255,255,255,.05);font:12.5px ui-monospace,Menlo,monospace;color:#bae6fd}',
    '#v3t table{width:100%;border-collapse:collapse;font-size:13.5px}#v3t th{text-align:left;color:#8190a8;font-weight:600;font-size:12px;padding:6px 6px;border-bottom:1px solid rgba(255,255,255,.08)}#v3t td{padding:9px 6px;border-bottom:1px solid rgba(255,255,255,.05)}',
    '#v3t .v3-bar{height:6px;border-radius:3px;background:rgba(255,255,255,.08);overflow:hidden;min-width:70px}#v3t .v3-bar i{display:block;height:100%;background:linear-gradient(90deg,#38bdf8,#a7f3d0)}',
    '#v3t .v3-none{padding:18px;text-align:center;color:#8190a8;font-size:13.5px;border:1px dashed rgba(255,255,255,.12);border-radius:14px}',
    '#v3t .v3-mine{display:flex;flex-direction:column;gap:6px}#v3t .v3-mine button{display:flex;align-items:center;gap:10px;text-align:left;padding:11px 12px;border-radius:12px;border:1px solid rgba(255,255,255,.07);background:rgba(255,255,255,.04);color:#e8eefb;font:500 14px inherit;cursor:pointer}#v3t .v3-mine b{font:700 13px ui-monospace,Menlo,monospace;color:#7dd3fc}#v3t .v3-mine small{margin-left:auto;color:#8190a8}',
    '#v3t h3{margin:18px 0 8px;font:650 14px inherit;color:#cbd5e1}',
    '#v3t .v3-views{display:grid;grid-template-columns:repeat(auto-fit,minmax(150px,1fr));gap:8px;margin:6px 0 16px}#v3t .v3-views label{position:relative;display:flex;flex-direction:column;gap:3px;padding:12px 12px 12px 36px;border-radius:14px;background:rgba(255,255,255,.04);border:1px solid rgba(255,255,255,.08);cursor:pointer}',
    '#v3t .v3-views input{position:absolute;left:12px;top:14px;accent-color:#7dd3fc}#v3t .v3-views b{font-size:14px}#v3t .v3-views small{font-size:11.5px;color:#8190a8}#v3t .v3-views label:has(input:checked){border-color:rgba(125,211,252,.55);background:rgba(125,211,252,.1)}',
    '.v3-entry{white-space:nowrap}'
  ].join('');
  document.head.appendChild(css);

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
    var m = modal(hd('布置给学生', '学生用课堂码打开一个只有这些词的学习页（3D 词卡或 Knowledge Drive），你在这里看到每个人的进度。') +
      '<label class="v3-f">作业标题<input type="text" data-t maxlength="80" value="' + esc(title) + '"></label>' +
      '<div style="font-size:12.5px;color:#93a0b8;font-weight:600">选择词表</div><div class="v3-lists">' +
      cols.map(function (c) { var n = (c.cards || []).filter(function (k) { return k && k.title && !k.teachingArchived; }).length;
        return '<label class="v3-l"><input type="checkbox" value="' + esc(c.id) + '"' + (pre.indexOf(c.id) >= 0 ? ' checked' : '') + '>' + esc(c.title || '词表') + '<small>' + n + ' 个词</small></label>'; }).join('') +
      '</div><div style="font-size:12.5px;color:#93a0b8;font-weight:600">呈现方式</div><div class="v3-views">' +
      '<label><input type="radio" name="v3view" value="cards"' + (o.view === 'drive' ? '' : ' checked') + '><b>🧊 3D 词卡</b><small>九种 3D 动态卡片 · 爆炸学习卡</small></label>' +
      '<label><input type="radio" name="v3view" value="drive"' + (o.view === 'drive' ? ' checked' : '') + '><b>🚗 Knowledge Drive</b><small>坐车沿路看词，每个词表一条路</small></label>' +
      '<label><input type="radio" name="v3view" value="type"' + (o.view === 'type' ? ' checked' : '') + '><b>⌨️ 3D Type</b><small>拼音打字：跟打 + 四关闯关</small></label>' +
      '</div><div class="v3-row"><button type="button" class="v3-b pri" data-go>生成课堂码</button><button type="button" class="v3-b" data-mine>我布置的作业</button></div><p class="v3-msg" data-msg></p>');
    m.querySelector('[data-mine]').onclick = manage;
    m.querySelector('[data-go]').onclick = function () {
      var btn = this, msg = m.querySelector('[data-msg]'), ids = [].map.call(m.querySelectorAll('.v3-lists input:checked'), function (i) { return i.value; });
      if (!ids.length) { msg.textContent = '至少选一个词表。'; return; }
      var t = m.querySelector('[data-t]').value.trim() || '3D 词卡', pb = packBoard(board, ids, t), n = pb.columns.reduce(function (s, c) { return s + c.cards.length; }, 0);
      if (!n) { msg.textContent = '选中的词表里没有词。'; return; }
      if (n > 400) { msg.textContent = '一次最多布置 400 个词（现在 ' + n + ' 个），请少选几个词表。'; return; }
      btn.disabled = true; msg.textContent = '';
      (function tryCode(k) {
        var code = newCode();
        return db(code).then(function (cur) {
          if (cur && k < 5) return tryCode(k + 1);
          if (cur) throw new Error('课堂码冲突，请再试一次。');
          var vw = (m.querySelector('input[name=v3view]:checked') || {}).value; vw = vw === 'drive' || vw === 'type' ? vw : 'cards';
          var host = { kind: 'vocab3d', v: 1, view: vw, title: t, board: pb, state: 'live', created: { '.sv': 'timestamp' }, words: n };
          return db(code + '/host', 'PUT', host).then(function () {
            var all = mine().filter(function (x) { return x.code !== code; }); all.unshift({ code: code, title: t, at: Date.now(), words: n, view: vw }); saveMine(all);
            roster(code);
          });
        });
      })(0).catch(function (e) { btn.disabled = false; msg.textContent = '没有布置成功：' + (e.message || e); });
    };
  }

  /* ---------------- one assignment: code, link, students ---------------- */
  function roster(code) {
    var m = modal('<div data-head></div><div class="v3-code"><div><span>课堂码</span><b>' + esc(code) + '</b></div><button type="button" class="v3-b" data-copy-code>复制</button></div>' +
      '<div class="v3-link"><code>' + esc(link(code)) + '</code><button type="button" class="v3-b pri" data-copy>复制链接</button></div>' +
      '<div data-body><div class="v3-none">正在读取…</div></div>' +
      '<div class="v3-row" style="margin-top:16px"><button type="button" class="v3-b" data-open-page>打开学生页</button><button type="button" class="v3-b" data-toggle></button><button type="button" class="v3-b warn" data-del>删除作业</button><button type="button" class="v3-b" data-mine style="margin-left:auto">全部作业</button></div><p class="v3-msg" data-msg></p>');
    var host = null, msg = m.querySelector('[data-msg]');
    function copy(t, b) { var done = function () { var o = b.textContent; b.textContent = '已复制 ✓'; setTimeout(function () { b.textContent = o; }, 1400); };
      try { navigator.clipboard.writeText(t).then(done, function () { prompt('复制这段：', t); }); } catch (e) { prompt('复制这段：', t); } }
    m.querySelector('[data-copy]').onclick = function () { copy(link(code), this); };
    m.querySelector('[data-copy-code]').onclick = function () { copy(code, this); };
    m.querySelector('[data-open-page]').onclick = function () { window.open(link(code) + '&preview=1', '_blank'); };
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
      m.querySelector('[data-head]').innerHTML = hd(esc(host ? host.title : code), host ? (host.view === 'drive' ? '🚗 Knowledge Drive · ' : host.view === 'type' ? '⌨️ 3D Type · ' : '🧊 3D 词卡 · ') + (host.words || 0) + ' 个词 · 布置于 ' + new Date(host.created).toLocaleString() + (host.state !== 'ended' ? ' · <span style="color:#86efac">开放中</span>' : ' · <span style="color:#fca5a5">已结束</span>') : '');
      var x = m.querySelector('.v3-x'); if (x) x.onclick = shut;
      m.querySelector('[data-toggle]').textContent = host && host.state !== 'ended' ? '结束作业' : '重新开放';
      var rows = Object.keys(players || {}).map(function (k) { return players[k]; }).filter(function (p) { return p && p.name; }).sort(function (a, b) { return (b.known || 0) - (a.known || 0) || (b.seen || 0) - (a.seen || 0); });
      var tot = host && host.words || 1;
      m.querySelector('[data-body]').innerHTML = '<h3>学生进度 · ' + rows.length + ' 人</h3>' + (rows.length ? '<table><tr><th>学生</th><th>看过</th><th>会了</th><th style="width:26%"></th>' + (host.view === 'type' ? '<th>闯关</th><th>字/分</th>' : '') + '<th>最近</th></tr>' + rows.map(function (p) {
        var k = Math.min(tot, p.known || 0), s = Math.min(tot, p.seen || 0);
        return '<tr><td>' + esc(p.name) + '</td><td>' + s + '/' + tot + '</td><td>' + k + '</td><td><div class="v3-bar"><i style="width:' + Math.round(k / tot * 100) + '%"></i></div></td>' + (host.view === 'type' ? '<td>' + typeCell(p.type) + '</td><td>' + (p.type && p.type.best ? p.type.best.cpm : '—') + '</td>' : '') + '<td style="color:#8190a8">' + ago(p.at) + '</td></tr>';
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

  /* ---------------- every assignment made on this device ---------------- */
  function manage() {
    var all = mine();
    var m = modal(hd('我布置的作业', '在这台设备上布置的作业；点开看学生进度。') + (all.length ? '<div class="v3-mine">' + all.map(function (x) {
      return '<button type="button" data-code="' + esc(x.code) + '"><b>' + esc(x.code) + '</b>' + esc(x.title) + '<small>' + (x.words || 0) + ' 词 · ' + new Date(x.at).toLocaleDateString() + '</small></button>';
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

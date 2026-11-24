/* Minest Living Knowledge · M1 — the page (living-knowledge/index.html).
   Pages, decisions, sources, conflicts and permissions over MinestLKStore; Markdown export.
   Signed in (Minest's own Google sign-in: the same Firebase project, kept by the browser per site, so signing in on
   Minest's own page is enough), everything is kept in this account's own documents (users/<uid>/lk_*) and on this device;
   signed out, on this device only ('guest'), and it can be brought into the account later. No AI in M1. */
(function () {
  'use strict';
  var M = window.MinestLKModel, S = window.MinestLKStore, IM = window.MinestLKImport;
  var BOARDS_KEY = 'focusboard_boards_v7_2';   // where Minest keeps the boards on this device (read only here)
  var FB_CFG = { apiKey: 'AIzaSyBH-SonlmNnTLRYUtvnZ9EEiFQSflo1cX8', authDomain: 'minest-33761.firebaseapp.com', projectId: 'minest-33761', storageBucket: 'minest-33761.firebasestorage.app' };
  var FB_SDK = ['app', 'auth', 'firestore'].map(function (n) { return 'https://www.gstatic.com/firebasejs/10.8.0/firebase-' + n + '-compat.js'; });
  var LAST_UID = 'minest.lk.lastUid', TAB_KEY = 'minest.lk.tab';
  var TYPE_NAMES = { concept: '概念', person: '人物', event: '事件', project: '项目', topic: '主题', howto: '方法', note: '笔记' };
  var STATE_NAMES = { Proposed: '提议中', Confirmed: '已确认', Superseded: '已被取代', Rejected: '已否决' };
  var MODULE_NAMES = { 'living-knowledge': '活知识本身', journal: 'Journal 日记', study: 'Study 学习', myworld: 'My World', routine: 'Routine 日程', agents: 'AI Agents', decisions: '设计 / 决策记录' };

  var $ = function (id) { return document.getElementById(id); };
  var main = $('lk-main');
  var store = null, ns = null, cloudOn = false, user = null, fb = null, unsubStore = null;
  var ui = { tab: 'home', sel: { pages: null, decisions: null, sources: null }, edit: false, draft: null, dirty: false, q: '', hist: null, showRev: null, imp: null, ingest: null, run: null, choice: {}, qa: null, qaHist: [], composing: null, link: null };
  // inside Minest's Knowledge page: ?embed=1 (no title link back), ?theme=light|dark (follows Knowledge's appearance)
  var EMBED = /[?&]embed=1\b/.test(location.search);
  if (EMBED) document.documentElement.classList.add('lk-embed');
  (function () { var t = (/[?&]theme=(light|dark)\b/.exec(location.search) || [])[1]; if (t) document.documentElement.setAttribute('data-theme', t); })();
  // always opens on 总览 (the five cards); TAB_KEY only remembers the last tab for later use

  function esc(s) { return String(s == null ? '' : s).replace(/[&<>"']/g, function (c) { return { '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' }[c]; }); }
  function when(t) { if (!t) return ''; var d = new Date(t); return d.toLocaleDateString('zh-CN', { month: 'numeric', day: 'numeric' }) + ' ' + d.toLocaleTimeString('zh-CN', { hour: '2-digit', minute: '2-digit' }); }
  var toastT = null;
  function toast(msg) { var el = $('lk-toast'); el.textContent = msg; el.hidden = false; clearTimeout(toastT); toastT = setTimeout(function () { el.hidden = true; }, 3800); }
  function lines(s) { return String(s || '').split('\n').map(function (x) { return x.trim(); }).filter(Boolean); }
  function words(s) { return String(s || '').split(/[,，、]/).map(function (x) { return x.trim(); }).filter(Boolean); }
  function lsGet(k) { try { return localStorage.getItem(k); } catch (e) { return null; } }
  function lsSet(k, v) { try { if (v == null) localStorage.removeItem(k); else localStorage.setItem(k, v); } catch (e) {} }
  function by(prop) { return function (a, b) { return (b[prop] || 0) - (a[prop] || 0); }; }
  function guard() { return !ui.dirty || confirm('还有没保存的修改，放弃吗？'); }

  // ================================================================== Markdown (a small, safe subset)
  function inline(s, pages) {
    var codes = [];
    s = esc(s).replace(/`([^`]+)`/g, function (a, c) { codes.push(c); return '\u0000' + (codes.length - 1) + '\u0000'; });
    s = s.replace(/\[\[([^\[\]|\n]+?)(?:\|([^\[\]\n]+?))?\]\]/g, function (a, t, label) {
      var raw = t.replace(/&amp;/g, '&').replace(/&lt;/g, '<').replace(/&gt;/g, '>').replace(/&quot;/g, '"').replace(/&#39;/g, "'").trim();
      var id = /^pg_/.test(raw) ? raw : M.pageId(raw), has = !!pages[id];
      return '<a href="#" class="wl' + (has ? '' : ' missing') + '" data-act="wiki" data-id="' + esc(id) + '" data-title="' + esc(raw) + '"' + (has ? '' : ' title="还没有这一页，点一下新建"') + '>' + (label || t) + '</a>';
    });
    s = s.replace(/\[([^\]\n]+)\]\((https?:\/\/[^)\s]+)\)/g, '<a href="$2" target="_blank" rel="noopener noreferrer">$1</a>');
    s = s.replace(/\*\*([^*]+)\*\*/g, '<strong>$1</strong>').replace(/(^|[^*])\*([^*\n]+)\*/g, '$1<em>$2</em>');
    return s.replace(/\u0000(\d+)\u0000/g, function (a, i) { return '<code>' + codes[+i] + '</code>'; });
  }
  function md(text, pages) {
    var out = [], ls = String(text || '').replace(/\r\n?/g, '\n').split('\n'), i = 0, para = [];
    function flush() { if (para.length) { out.push('<p>' + inline(para.join(' '), pages) + '</p>'); para = []; } }
    while (i < ls.length) {
      var l = ls[i], m;
      if (/^```/.test(l)) { flush(); var code = []; i++; while (i < ls.length && !/^```/.test(ls[i])) code.push(ls[i++]); i++; out.push('<pre><code>' + esc(code.join('\n')) + '</code></pre>'); continue; }
      if ((m = /^(#{1,6})\s+(.*)$/.exec(l))) { flush(); var n = Math.min(6, m[1].length + 1); out.push('<h' + n + '>' + inline(m[2], pages) + '</h' + n + '>'); i++; continue; }
      if (/^\s*([-*]|\d+\.)\s+/.test(l)) {
        flush(); var ordered = /^\s*\d+\./.test(l), items = [];
        while (i < ls.length && /^\s*([-*]|\d+\.)\s+/.test(ls[i])) items.push('<li>' + inline(ls[i++].replace(/^\s*([-*]|\d+\.)\s+/, ''), pages) + '</li>');
        out.push((ordered ? '<ol>' : '<ul>') + items.join('') + (ordered ? '</ol>' : '</ul>')); continue;
      }
      if (/^>\s?/.test(l)) { flush(); var q = []; while (i < ls.length && /^>\s?/.test(ls[i])) q.push(ls[i++].replace(/^>\s?/, '')); out.push('<blockquote>' + inline(q.join(' '), pages) + '</blockquote>'); continue; }
      if (!l.trim()) { flush(); i++; continue; }
      para.push(l); i++;
    }
    flush();
    return out.join('\n') || '<p class="lk-note">（这一页还是空的）</p>';
  }

  // ================================================================== store and account
  function openStore(name, cloud) {
    if (unsubStore) unsubStore();
    ns = name; cloudOn = !!cloud;
    store = S.createStore({ local: S.idbLocal('minest.lk.v1:' + name), cloud: cloud, userId: 'me' });
    unsubStore = store.onChange(function (what) { paintStatus(); sendGraph(); sendHolo(); postStats(); if (what && (what.pulled || what.conflict)) render(); });
    ui.sel = { pages: null, decisions: null, sources: null }; ui.edit = false; ui.draft = null; ui.dirty = false; ui.hist = null;
    return store.ready().then(function () { render(); paintStatus(); postStats(); if (cloud) store.pull().then(function (n) { if (n) render(); }); });
  }
  function paintStatus() {
    var el = $('lk-status'), s = store ? store.status() : null, cls = '', txt;
    if (!s) txt = '打开中…';
    else if (!cloudOn) { txt = ns === 'guest' ? '仅这台设备（未登录）' : '连接云端中 · 改动先存本机'; cls = 'warn'; }
    else if (s.conflicts) { txt = s.conflicts + ' 个冲突待处理'; cls = 'bad'; }
    else if (s.syncing) txt = '同步中…';
    else if (s.error) { txt = '离线 · ' + (s.pending ? s.pending + ' 条' : '改动') + '已存本机'; cls = 'warn'; }
    else if (s.pending) { txt = s.pending + ' 条待上传'; cls = 'warn'; }
    else { txt = '已同步' + (s.lastSync ? ' ' + when(s.lastSync).split(' ')[1] : ''); cls = 'ok'; }
    el.textContent = txt; el.className = 'lk-pill ' + cls; el.title = (s && s.error) || (user ? '账号：' + (user.email || user.uid) : '');
    var c = $('lk-ccount'); c.hidden = !(s && s.conflicts); c.textContent = s ? s.conflicts : '';
    $('lk-login').hidden = !!user || !fb;
    $('lk-sync').disabled = !cloudOn;
  }
  function loadScript(src) { return new Promise(function (ok, no) { var s = document.createElement('script'); s.src = src; s.async = false; s.onload = ok; s.onerror = no; document.head.appendChild(s); }); }
  function startFirebase() {
    var ready = window.firebase && window.firebase.firestore ? Promise.resolve() : FB_SDK.reduce(function (p, s) { return p.then(function () { return loadScript(s); }); }, Promise.resolve());
    return ready.then(function () {
      fb = window.firebase; if (!fb.apps.length) fb.initializeApp(FB_CFG);
      var db = fb.firestore();
      // the same transport choice as Minest itself: WebKit may hold back Firestore's streamed replies
      if (!db.__lkTransport) {
        db.__lkTransport = true;
        var ua = navigator.userAgent || '';
        var webkit = /iPad|iPhone|iPod/.test(ua) || (navigator.platform === 'MacIntel' && navigator.maxTouchPoints > 1) || (/Safari/.test(ua) && !/Chrome|Chromium|Edg|Android/.test(ua));
        if (webkit) { try { db.settings({ experimentalForceLongPolling: true, experimentalAutoDetectLongPolling: false, useFetchStreams: false, merge: true }); } catch (e) {} }
      }
      fb.auth().onAuthStateChanged(function (u) {
        user = u || null;
        if (u) {
          lsSet(LAST_UID, u.uid);
          if (ns !== u.uid || !cloudOn) openStore(u.uid, S.firestoreCloud(db, u.uid)).then(offerGuest);
        } else {
          lsSet(LAST_UID, null);
          if (ns !== 'guest') openStore('guest', null);
        }
        paintStatus();
      });
    }).catch(function () { fb = null; paintStatus(); toast('连不上登录服务（离线？）· 现在的改动先存在这台设备上'); });
  }
  function signIn() {
    if (!fb) return;
    var pr = new fb.auth.GoogleAuthProvider(); pr.setCustomParameters({ prompt: 'select_account' });
    fb.auth().signInWithPopup(pr).catch(function (e) {
      toast('这里登录没有成功（' + ((e && e.code) || '未知') + '）。请先在 Minest 主页登录，再回到这一页。');
    });
  }
  // what was written here while signed out, brought into the account (never overwriting what the account has)
  function offerGuest() {
    if (!user) return;
    var guest = S.createStore({ local: S.idbLocal('minest.lk.v1:guest'), cloud: null });
    Promise.all([guest.list('page'), guest.list('decision')]).then(function (r) {
      var items = r[0].map(function (d) { return ['page', d]; }).concat(r[1].map(function (d) { return ['decision', d]; }));
      var sig = items.map(function (x) { return x[1].id + '@' + x[1].rev; }).sort().join(',');
      var b = $('lk-banner');
      if (!items.length || lsGet('minest.lk.guestMerged.' + user.uid) === sig) { b.hidden = true; return; }
      b.innerHTML = '<p>未登录时在这台设备上写了 ' + items.length + ' 条内容。要并入当前账号吗？（账号里已有的同名内容不会被覆盖）</p>' +
        '<button type="button" class="lk-btn" data-act="guest-merge">并入账号</button><button type="button" class="lk-btn ghost" data-act="guest-later">以后再说</button>';
      b.hidden = false;
      b.onclick = function (e) {
        var a = e.target.closest('[data-act]'); if (!a) return;
        if (a.dataset.act === 'guest-later') { b.hidden = true; return; }
        a.disabled = true;
        var added = 0, kept = 0;
        items.reduce(function (p, x) {
          return p.then(function () { return store.get(x[0], x[1].id); }).then(function (cur) {
            if (cur) { kept++; return; }
            return store.put(x[0], x[1], { baseRev: 0, reason: '从未登录时的本机内容并入' }).then(function (res) { if (res.ok) added++; });
          });
        }, Promise.resolve()).then(function () {
          lsSet('minest.lk.guestMerged.' + user.uid, sig); b.hidden = true; render();
          toast('已并入 ' + added + ' 条' + (kept ? '；' + kept + ' 条账号里已有，保持不变' : ''));
        });
      };
    });
  }

  // ================================================================== tabs
  function setTab(t) {
    if (t === ui.tab || !guard()) return;
    ui.tab = t; ui.edit = false; ui.draft = null; ui.dirty = false; ui.hist = null; ui.q = ''; ui.imp = null;
    lsSet(TAB_KEY, t);
    document.querySelectorAll('.lk-tabs [data-tab]').forEach(function (b) { b.setAttribute('aria-selected', String(b.dataset.tab === t)); });
    render();
  }
  function render() {
    if (!store) return;
    document.querySelectorAll('.lk-tabs [data-tab]').forEach(function (b) { b.setAttribute('aria-selected', String(b.dataset.tab === ui.tab)); });
    paintReviewCount(); paintChips();
    var askBtn = $('lk-ask-ai'); if (askBtn) askBtn.textContent = isLocal() ? '问知识库' : '问 AI';
    document.body.classList.toggle('lk-on-graph', ui.tab === 'graph');
    var f = { home: renderHome, graph: renderGraph, pages: renderPages, decisions: renderDecisions, sources: renderSources, review: renderReview, conflicts: renderConflicts, perms: renderPerms }[ui.tab] || renderPages;
    return Promise.resolve(f()).then(function () {
      var t = main.querySelector('input.title[autofocus]');   // autofocus does not fire for HTML put in later
      if (t && document.activeElement !== t) { t.focus(); t.setSelectionRange(t.value.length, t.value.length); }
    });
  }
  function sideList(items, cur, placeholder, newLabel) {
    return '<aside class="lk-card lk-side"><div class="row"><input type="search" id="lk-q" placeholder="' + placeholder + '" value="' + esc(ui.q) + '" aria-label="搜索">' +
      (newLabel ? '<button type="button" class="lk-btn" data-act="new">' + newLabel + '</button>' : '') + '</div>' +
      '<ul class="lk-list" id="lk-list">' + (items.length ? items.map(function (x) {
        return '<li><button type="button" class="lk-item" data-act="open" data-id="' + esc(x.id) + '" aria-label="' + esc(x.title + '，' + x.sub) + '"' + (x.id === cur ? ' aria-current="true"' : '') + '><b>' + esc(x.title) + '</b><small>' + x.sub + '</small></button></li>';
      }).join('') : '<li class="lk-empty">' + (ui.q ? '没有找到' : '还没有内容') + '</li>') + '</ul></aside>';
  }
  function matches(q, parts) { if (!q) return true; q = q.toLowerCase(); return parts.some(function (p) { return String(p || '').toLowerCase().indexOf(q) >= 0; }); }
  function histHtml(kind, id, cur) {
    if (!ui.hist) return '<div class="lk-hist"><button type="button" class="lk-btn ghost" data-act="hist">版本历史</button></div>';
    return '<div class="lk-hist"><div class="lk-bar"><b>版本历史</b><span class="lk-note">恢复会把旧内容写成新的一版，历史不会被改写</span><span class="sp"></span><button type="button" class="lk-btn ghost" data-act="hist-close">收起</button></div><ol>' +
      ui.hist.map(function (v) {
        var open = ui.showRev === v.rev, snap = v.snapshot || {};
        var body = kind === 'page' ? snap.markdown : M.decisionToMarkdown(snap);
        return '<li><b>第 ' + v.rev + ' 版</b><span class="who">' + esc(when(v.at)) + ' · ' + esc(v.by) + ' · ' + esc(v.reason) + '</span>' +
          '<button type="button" class="lk-btn ghost" data-act="show-rev" data-rev="' + v.rev + '">' + (open ? '收起' : '查看') + '</button>' +
          (cur && v.rev !== cur.rev ? '<button type="button" class="lk-btn ghost" data-act="restore" data-rev="' + v.rev + '">恢复</button>' : '<span class="lk-badge">当前</span>') +
          (open ? '<pre>' + esc(body || '') + '</pre>' : '') + '</li>';
      }).join('') + '</ol></div>';
  }

  // ---------------------------------------------------------------- 总览: five cards, in the look of the Toolkit's "Five cards"
  var IC = {
    pages: '<path d="M4 19.5V5a2 2 0 0 1 2-2h12v18H6a2 2 0 0 1-2-1.5z"/><path d="M8 7h6M8 11h4"/>',
    sources: '<path d="M14 3H6a2 2 0 0 0-2 2v14a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V9z"/><path d="M14 3v6h6M8 13h8M8 17h5"/>',
    decisions: '<path d="M9 11l3 3 8-8"/><path d="M20 12v7a2 2 0 0 1-2 2H6a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h9"/>',
    review: '<path d="M12 3l1.9 5.1L19 10l-5.1 1.9L12 17l-1.9-5.1L5 10l5.1-1.9z"/>',
    graph: '<circle cx="6" cy="6" r="2.5"/><circle cx="18" cy="8" r="2.5"/><circle cx="10" cy="18" r="2.5"/><path d="M8.2 7.1l7.4.6M7 8.3l2.2 7.4M16.6 10l-5 6.3"/>'
  };
  function svg(d) { return '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true">' + d + '</svg>'; }
  function five(i, o) {
    return '<button type="button" class="lk-five" style="--cc:' + o.cc + ';--i:' + i + '" data-act="go" data-to="' + o.to + '"><span class="lk-num">0' + (i + 1) + '</span>' +
      '<span class="lk-ic">' + svg(o.ic) + '</span><span class="lk-names"><b>' + o.name + '</b><em>' + o.en + '</em></span><span class="lk-line">' + o.line + '</span>' +
      '<span class="lk-pv">' + o.pv + '</span><span class="lk-open">' + (o.open || '打开') + ' →</span></button>';
  }
  function tags(list) { return list.length ? '<span class="lk-tags">' + list.slice(0, 4).map(function (t) { return '<i>' + esc(t) + '</i>'; }).join('') + '</span>' : ''; }
  function renderHome() {
    return Promise.all([store.list('page'), store.list('source'), store.list('decision'), store.list('run'), store.list('relation')]).then(function (r) {
      var pages = r[0].sort(by('updatedAt')), srcs = r[1].sort(by('createdAt')), decs = r[2].sort(by('updatedAt')), runs = r[3], rels = r[4].filter(liveRel);
      cache.pages = {}; pages.forEach(function (p) { cache.pages[p.id] = p; });
      var claims = pages.reduce(function (n, p) { return n + (p.claims || []).length; }, 0);
      var conflicts = pages.reduce(function (n, p) { return n + (p.claims || []).filter(function (c) { return (c.conflictsWith || []).length; }).length; }, 0);
      var links = pages.reduce(function (n, p) { return n + (p.links || []).filter(function (id) { return cache.pages[id]; }).length; }, 0) + rels.length;
      var pend = AG ? AG.pendingCount(runs) : 0, last = runs.sort(by('startedAt'))[0];
      var conf = decs.filter(function (d) { return d.state === 'Confirmed'; }).length, prop = decs.filter(function (d) { return d.state === 'Proposed'; }).length;
      var cards = [
        { to: 'pages', cc: 'var(--c1)', ic: IC.pages, name: '知识页', en: 'Knowledge Pages', line: '用 [[双链]] 把概念连起来，每次修改都留一版。',
          pv: '<span class="big">' + pages.length + '<small>页</small> ' + claims + '<small>条说法</small></span>' + tags(pages.map(function (p) { return p.title; })) },
        { to: 'sources', cc: 'var(--c2)', ic: IC.sources, name: '来源', en: 'Raw Sources', line: '网页、笔记、Markdown、Minest 卡片。原文永不修改。',
          pv: '<span class="big">' + srcs.length + '<small>份</small></span>' + tags(srcs.map(function (s) { return s.title; })), open: srcs.length ? '打开' : '导入' },
        { to: 'decisions', cc: 'var(--c3)', ic: IC.decisions, name: '决策', en: 'Decision Memory', line: '需求、选项、决定、理由。已确认的只有你能改。',
          pv: '<span class="big">' + decs.length + '<small>个</small></span><span>' + conf + ' 已确认 · ' + prop + ' 提议中</span>' + tags(decs.map(function (d) { return d.title; })) },
        { to: 'review', cc: 'var(--c4)', ic: IC.review, name: '审核', en: 'Knowledge Agent', line: '整理来源只提建议；你决定留下什么。',
          pv: '<span class="big">' + pend + '<small>条待审核</small></span><span>' + (last ? '上次整理 ' + esc(when(last.startedAt)) : '还没有整理过') + '</span>' },
        { to: 'graph', cc: 'var(--c5)', ic: IC.graph, name: '知识图谱', en: 'Knowledge Graph', line: '页面之间的链接与关系，矛盾会被标出来。',
          pv: '<span class="big">' + pages.length + '<small>节点</small> ' + links + '<small>连接</small></span>' + (conflicts ? '<span style="color:var(--bad)">⚠️ ' + conflicts + ' 条说法有矛盾</span>' : '<span>没有矛盾</span>') }
      ];
      var recent = [].concat(
        pages.map(function (p) { return { t: p.updatedAt, kind: '知识页', title: p.title, to: 'pages', id: p.id }; }),
        decs.map(function (d) { return { t: d.updatedAt, kind: '决策 · ' + (STATE_NAMES[d.state] || d.state), title: d.title, to: 'decisions', id: d.id }; }),
        srcs.map(function (s) { return { t: s.createdAt, kind: '来源', title: s.title, to: 'sources', id: s.id }; })
      ).sort(function (a, b) { return b.t - a.t; }).slice(0, 8);
      main.innerHTML = '<div class="lk-home-h"><h2><small>Living Knowledge</small>我的知识库</h2><span class="lk-note">在一张卡里做的，其他卡里都看得到。</span></div>' +
        '<div class="lk-grid">' + cards.map(function (c, i) { return five(i, c); }).join('') + '</div>' +
        (DEMO && L ? '<section class="lk-card lk-block lk-demo"><div><h3>演示：用《独立宣言》跑一遍全流程</h3><p class="lk-note">导入原文 → 本机整理（切句、词频、概念、排序、说法、关系，每一步都画出来）→ 审核 → 知识页 → 提问。全程在这台设备上完成，不联网，不调用 AI。</p>' +
          (pages.length && srcs.some(function (x) { return x.title === DEMO.title; }) ? '<p class="lk-demo-q"><span class="lk-note">试着问：</span>' + DEMO.questions.map(function (q) { return '<button type="button" class="lk-chip" data-act="demo-ask" data-q="' + esc(q) + '">' + esc(q) + '</button>'; }).join('') + '</p>' : '') +
          '</div><button type="button" class="lk-btn" data-act="demo">' + (srcs.some(function (x) { return x.title === DEMO.title; }) ? '再看一遍整理过程' : '开始演示') + '</button></section>' : '') +
        '<section class="lk-card lk-block lk-recent"><h3>最近</h3>' + (recent.length ? '<ol>' + recent.map(function (x) {
          return '<li><button type="button" data-act="go" data-to="' + x.to + '" data-id="' + esc(x.id) + '"><span class="lk-badge">' + esc(x.kind) + '</span><span>' + esc(x.title) + '</span><small>' + esc(when(x.t)) + '</small></button></li>';
        }).join('') + '</ol>' : '<p class="lk-note">还没有内容。在上面输入一个词新建知识页，或者去“来源”导入一份资料。</p>') + '</section>';
    });
  }
  function paintChips() {
    if (!store) return;
    store.list('page').then(function (ps) {
      var el = $('lk-ask-chips');
      el.innerHTML = ps.sort(by('updatedAt')).slice(0, 6).map(function (p) { return '<button type="button" class="lk-chip" data-chip="' + esc(p.id) + '">' + esc(p.title) + '</button>'; }).join('');
    });
  }
  function ask(q) {
    q = String(q || '').trim(); if (!q || !guard()) return;
    store.list('page').then(function (ps) {
      var id = M.pageId(q), hit = ps.filter(function (p) { return p.id === id || (p.aliases || []).some(function (a) { return M.slug(a) === M.slug(q); }); })[0];
      ui.edit = false; ui.draft = null; ui.dirty = false; ui.hist = null; ui.imp = null;
      ui.tab = 'pages'; lsSet(TAB_KEY, 'pages');
      if (hit) { ui.q = ''; ui.sel.pages = hit.id; return render(); }
      var some = ps.filter(function (p) { return matches(q, [p.title, (p.aliases || []).join(' '), p.markdown]); });
      if (some.length) { ui.q = q; ui.sel.pages = some.length === 1 ? some[0].id : null; render(); return toast('找到 ' + some.length + ' 页相关的'); }
      ui.q = ''; ui.sel.pages = null; startPage(null, q);
    });
  }

  // ---------------------------------------------------------------- 知识图谱: the browse canvas (living-knowledge/graph/, built from tools/living-knowledge-graph/)
  // It only reads: this page sends it the data and tells it when anything changes; a double click on a node asks this page
  // to open the page (or start one, for a link not written yet), and "新增知识节点" starts a real page here.
  var graphFrame = null, holoFrame = null;
  var GVIEW_KEY = 'minest.lk.gview', HOLO_LAYOUT = 'minest.lk.holoLayout';
  function gview() { return lsGet(GVIEW_KEY) === '2d' ? '2d' : '3d'; }
  function renderGraph() {
    var v = gview();
    var bar = document.createElement('div'); bar.className = 'lk-viewsw';
    bar.innerHTML = '<div class="lk-seg" role="group" aria-label="图谱视图"><button type="button" data-act="gview" data-v="3d" aria-pressed="' + (v === '3d') + '">3D 全息星图</button>' +
      '<button type="button" data-act="gview" data-v="2d" aria-pressed="' + (v === '2d') + '">2D 平面</button></div>' +
      '<span class="lk-note">' + (v === '3d' ? '单指拖动旋转（甩一下会继续转）· 双指捏合缩放 · 双指拖动平移 · 轻点打开 · 双击聚焦 · 长按取出卡片 · 右下 ✋ 看全部手势' : '单击高亮相邻笔记 · 双击打开 · 右上 ⚙ 图谱设置') + '</span>';
    main.innerHTML = ''; main.appendChild(bar);
    if (v === '3d') {
      if (!holoFrame) {
        holoFrame = document.createElement('iframe');
        holoFrame.className = 'lk-graph lk-holo'; holoFrame.title = '知识图谱 · 3D 全息星图'; holoFrame.src = '../holo-lab-2/index.html';
        holoFrame.setAttribute('allow', 'fullscreen');
      }
      main.appendChild(holoFrame); sendHolo();
    } else {
      if (!graphFrame) {
        graphFrame = document.createElement('iframe');
        graphFrame.className = 'lk-graph'; graphFrame.title = '知识图谱 · 2D 平面'; graphFrame.src = 'graph/index.html';
        graphFrame.setAttribute('allow', 'fullscreen');
      }
      main.appendChild(graphFrame); sendGraph();
    }
  }
  /* 3D: Minest's 全息操作台 2.0 · 知识星图 (holo-lab-2/), with its own hand gestures. Each page is a star, grouped by type
     (概念, 人物, 事件 … 决策), and every [[link]] or accepted relation is a bright line between two stars. It sends back
     'open' (a tap on 打开原卡) — the page opens here; edits are made here, not in the projection. */
  var TYPE_GROUP = { concept: '概念', person: '人物', event: '事件', project: '项目', topic: '主题', howto: '方法', note: '笔记' };
  function holoContent() {
    return Promise.all([store.list('page'), store.list('decision'), store.list('relation')]).then(function (r) {
      r[2] = r[2].filter(liveRel);
      var have = {}; r[0].forEach(function (p) { have[p.id] = 1; }); r[1].forEach(function (d) { have[d.id] = 1; });
      // the console reads parents as a tree, so every link points from the newer page to the older one (never a cycle)
      var rank = {}; r[0].concat(r[1]).sort(function (x, y) { return (x.createdAt || 0) - (y.createdAt || 0) || (x.id < y.id ? -1 : 1); }).forEach(function (x, i) { rank[x.id] = i; });
      var parents = {};
      var add = function (a, b) {
        if (a === b || !have[a] || !have[b]) return;
        var child = rank[a] > rank[b] ? a : b, par = child === a ? b : a;
        (parents[child] = parents[child] || []).indexOf(par) < 0 && parents[child].push(par);
      };
      r[0].forEach(function (p) { (p.links || []).forEach(function (id) { add(p.id, id); }); });
      r[1].forEach(function (d) { M.parseLinks([d.requirement, d.decision].concat(d.reasons || []).join('\n')).forEach(function (l) { add(d.id, l.id); }); });
      r[2].forEach(function (x) { add(x.from, x.to); });
      var knowledge = r[0].sort(by('updatedAt')).map(function (p) {
        var claims = (p.claims || []).map(function (c) { return '· ' + c.text; }).join('\n');
        return { id: p.id, t: p.updatedAt, title: p.title, text: String(p.markdown || '').replace(/\[\[([^\]|]+)(\|[^\]]+)?\]\]/g, '$1').slice(0, 900) + (claims ? '\n\n' + claims : ''),
          tags: [], parents: parents[p.id] || [], board: TYPE_GROUP[p.type] || '笔记' };
      }).concat(r[1].map(function (d) {
        return { id: d.id, t: d.updatedAt, title: d.title, text: (STATE_NAMES[d.state] || d.state) + '\n\n' + (d.decision || d.requirement || ''), tags: [], parents: parents[d.id] || [], board: '决策' };
      }));
      var layout = null; try { layout = JSON.parse(lsGet(HOLO_LAYOUT) || 'null'); } catch (e) {}
      return { knowledge: knowledge, lk: true, layout: layout };
    });
  }
  function sendHolo() {
    if (!holoFrame || !holoFrame.isConnected || !holoFrame.contentWindow || !store) return;
    holoContent().then(function (data) {
      if (!data.knowledge.length) return;    // with nothing yet, the console shows its own example
      try { holoFrame.contentWindow.postMessage({ holo: 1, op: 'content', data: data }, location.origin); } catch (e) {}
    });
  }
  window.addEventListener('message', function (e) {
    if (!holoFrame || e.source !== holoFrame.contentWindow || e.origin !== location.origin) return;
    var m = e.data || {}; if (m.holo !== 1) return;
    if (m.op === 'ready') {
      // from Living Knowledge it opens straight on the star map: booted, without the console's other modes (words, rings, armor)
      try { var st = holoFrame.contentDocument.createElement('style'); st.textContent = '#modes{display:none!important}'; holoFrame.contentDocument.head.appendChild(st); } catch (x) {}
      sendHolo();
      try { holoFrame.contentWindow.postMessage({ holo: 1, op: 'boot' }, location.origin); } catch (x) {}
      return;
    }
    if (m.op === 'close') { ui.tab = 'home'; lsSet(TAB_KEY, 'home'); render(); return; }
    if (m.op === 'save' && m.layout) { lsSet(HOLO_LAYOUT, JSON.stringify(m.layout)); return; }
    var say = function (t) { try { holoFrame.contentWindow.postMessage({ holo: 1, op: 'toast', text: t }, location.origin); } catch (x) {} };
    if (m.op === 'edit') return say('请在活知识的知识页里编辑 · 这里只是投影');
    if (m.op === 'open' && m.kind === 'knowledge') {
      var id = String(m.id || '');
      if (!guard()) return;
      ui.edit = false; ui.draft = null; ui.dirty = false; ui.hist = null; ui.imp = null; ui.q = '';
      if (/^dc_/.test(id)) { ui.tab = 'decisions'; ui.sel.decisions = id; } else { ui.tab = 'pages'; ui.sel.pages = id; }
      render(); window.scrollTo({ top: 0, behavior: 'smooth' }); return;
    }
    if (m.op === 'open') return say('这一项在活知识里没有原页');
  });
  // only confirmed relations are lines in the graph and the projection; a suggested or rejected one is not a link yet
  function liveRel(r) { return M.relationStatus(r) === 'confirmed'; }
  // the graph labels a line with its first quote: for a link found by Semantic Linking that is its reason
  function graphRel(r) { return r.explanation ? Object.assign({}, r, { evidence: [{ sourceId: r.id, quote: r.explanation }] }) : r; }
  function sendGraph() {
    if (!graphFrame || !graphFrame.isConnected || !graphFrame.contentWindow || !store) return;
    Promise.all([store.list('page'), store.list('decision'), store.list('source'), store.list('relation')]).then(function (r) {
      try { graphFrame.contentWindow.postMessage({ type: 'lk-graph-data', data: { pages: r[0], decisions: r[1], sources: r[2], relations: r[3].filter(liveRel).map(graphRel) } }, location.origin); } catch (e) {}
    });
  }
  window.addEventListener('message', function (e) {
    if (!graphFrame || e.source !== graphFrame.contentWindow || e.origin !== location.origin) return;
    var m = e.data || {};
    if (m.type === 'lk-graph-ready') return sendGraph();
    if (m.type === 'lk-open' || m.type === 'lk-new') {
      if (!guard()) return;
      var id = String(m.id || ''), title = String(m.title || '').slice(0, 200);
      ui.edit = false; ui.draft = null; ui.dirty = false; ui.hist = null; ui.imp = null; ui.q = '';
      if (/^dc_/.test(id)) { ui.tab = 'decisions'; ui.sel.decisions = id; return render(); }
      ui.tab = 'pages';
      store.get('page', id || M.pageId(title)).then(function (p) {
        if (p && m.type === 'lk-open') { ui.sel.pages = p.id; render(); }
        else if (p) { ui.sel.pages = p.id; render(); toast('已经有“' + p.title + '”这一页了'); }
        else { ui.sel.pages = null; startPage(null, title || id.replace(/^pg_/, '')); }
      });
    }
  });

  // ---------------------------------------------------------------- pages
  var cache = { pages: {}, sources: {} };
  function renderPages() {
    return Promise.all([store.list('page'), store.list('source')]).then(function (r) {
      var pages = r[0];
      cache.pages = {}; pages.forEach(function (p) { cache.pages[p.id] = p; });
      cache.sources = {}; r[1].forEach(function (s) { cache.sources[s.id] = s; });
      var cur = ui.sel.pages && cache.pages[ui.sel.pages] || null;
      var items = pages.filter(function (p) { return matches(ui.q, [p.title, (p.aliases || []).join(' '), (p.tags || []).join(' '), p.markdown]); }).sort(by('updatedAt'))
        .map(function (p) { return { id: p.id, title: p.title, sub: (TYPE_NAMES[p.type] || '笔记') + ' · 第 ' + p.rev + ' 版 · ' + when(p.updatedAt) + (p.lockedBy === 'user' ? ' · 🔒' : '') }; });
      var right;
      if (ui.edit && ui.draft) right = pageEditor(cur);
      else if (cur) right = pageView(cur, pages);
      else right = '<section class="lk-card lk-ed"><p class="lk-empty">选一页，或者点“新建”。<br>用 <code>[[页面名]]</code> 把页面连起来；每次保存都会留下一版，可以随时恢复。</p></section>';
      main.innerHTML = '<div class="lk-split' + (cur || ui.edit ? ' editing' : '') + '">' + sideList(items, cur && cur.id, '搜索知识页', '新建') + right + '</div>';
    });
  }
  function pageView(p, pages) {
    var back = pages.filter(function (x) { return (x.links || []).indexOf(p.id) >= 0 && x.id !== p.id; });
    return '<section class="lk-card lk-ed"><div class="lk-bar"><button type="button" class="lk-btn ghost lk-only-narrow" data-act="back">‹ 列表</button>' +
      '<span class="lk-badge">' + esc(TYPE_NAMES[p.type] || '笔记') + '</span><span class="lk-note">第 ' + p.rev + ' 版 · ' + esc(when(p.updatedAt)) + ' · ' + esc(p.updatedBy) + '</span>' +
      (p.lockedBy === 'user' ? '<span class="lk-lock">🔒 已锁定：自动整理只能提建议</span>' : '') + '<span class="sp"></span>' + ((p.claims || []).length && p.lockedBy !== 'user' && AG ? '<button type="button" class="lk-btn ghost" data-act="compose"' + (ui.composing ? ' disabled' : '') + ' title="只用这一页已接受的说法写正文；先给你草稿，保存才生效">' + (ui.composing === p.id ? '正在起草…' : isLocal() ? '用说法排出正文' : 'AI 起草正文') + '</button>' : '') +
      '<button type="button" class="lk-btn" data-act="edit">编辑</button></div>' +
      '<h2 style="margin:0">' + esc(p.title) + '</h2>' +
      ((p.aliases || []).length || (p.tags || []).length ? '<div class="lk-note">' + ((p.aliases || []).length ? '别名：' + esc(p.aliases.join('、')) + '　' : '') + ((p.tags || []).length ? '标签：' + esc(p.tags.join('、')) : '') + '</div>' : '') +
      '<div class="lk-md">' + md(p.markdown, cache.pages) + '</div>' + claimsHtml(p) + sourceChips(p.sourceIds) +
      '<div class="lk-links"><span>链接到这里：</span>' + (back.length ? back.map(function (b) { return '<button type="button" data-act="open" data-id="' + esc(b.id) + '">' + esc(b.title) + '</button>'; }).join('') : '<span>（还没有）</span>') + '</div>' +
      histHtml('page', p.id, p) + '</section>';
  }
  function sourceChips(ids) {
    ids = ids || [];
    if (!ids.length) return '';
    return '<div class="lk-links"><span>来源：</span>' + ids.map(function (id) {
      var s = cache.sources[id];
      return '<button type="button" data-act="open-src" data-id="' + esc(id) + '">' + esc(s ? s.title || id : id + '（这台设备上没有）') + '</button>';
    }).join('') + '</div>';
  }
  function pageEditor(cur) {
    var d = ui.draft;
    return '<section class="lk-card lk-ed"><div class="head"><input class="title" type="text" data-f="title" value="' + esc(d.title) + '" placeholder="页面标题" aria-label="页面标题"' + (cur ? '' : ' autofocus') + '></div>' +
      '<div class="lk-meta"><label>类型<select data-f="type">' + M.PAGE_TYPES.map(function (t) { return '<option value="' + t + '"' + (t === d.type ? ' selected' : '') + '>' + TYPE_NAMES[t] + '</option>'; }).join('') + '</select></label>' +
      '<label>标签（逗号分隔）<input type="text" data-f="tags" value="' + esc(d.tags) + '"></label>' +
      '<label>别名（逗号分隔）<input type="text" data-f="aliases" value="' + esc(d.aliases) + '"></label></div>' +
      (d.aiNote ? '<p class="lk-note lk-ai-note">' + esc(d.aiNote) + '</p>' : '') +
      '<textarea class="md" data-f="markdown" placeholder="用 Markdown 写；[[另一页]] 建立双向链接" aria-label="正文">' + esc(d.markdown) + '</textarea>' +
      (d.sourceIds && d.sourceIds.length ? '<p class="lk-note">这一页引用了 ' + d.sourceIds.length + ' 个来源：' + esc(d.sourceIds.map(function (id) { return (cache.sources[id] || {}).title || id; }).join('、')) + '</p>' : '') +
      '<label class="lk-check"><input type="checkbox" data-f="locked"' + (d.locked ? ' checked' : '') + '> 锁定这一页（AI 以后只能提建议，不能直接改）</label>' +
      '<div class="lk-bar">' + (cur ? '<span class="lk-note">从第 ' + d.baseRev + ' 版改起</span>' : '<span class="lk-note">' + (d.title ? 'id：' + esc(M.pageId(d.title)) : '') + '</span>') +
      '<span class="sp"></span><button type="button" class="lk-btn ghost" data-act="cancel">取消</button><button type="button" class="lk-btn" data-act="save">保存</button></div></section>';
  }
  function startPage(cur, title, extra) {
    extra = extra || {};
    ui.edit = true; ui.dirty = !!(title || extra.markdown); ui.hist = null; ui.showRev = null;
    ui.draft = cur ? { title: cur.title, type: cur.type || 'note', tags: (cur.tags || []).join('，'), aliases: (cur.aliases || []).join('，'), markdown: cur.markdown || '', locked: cur.lockedBy === 'user', baseRev: cur.rev, sourceIds: (cur.sourceIds || []).slice() }
      : { title: title || '', type: extra.type || 'concept', tags: '', aliases: '', markdown: extra.markdown || '', locked: false, baseRev: 0, sourceIds: (extra.sourceIds || []).slice() };
    render();
  }
  function savePage() {
    var d = ui.draft, title = String(d.title || '').trim();
    if (!title) return toast('先写一个标题');
    var cur = ui.sel.pages && cache.pages[ui.sel.pages];
    var id = cur ? cur.id : M.pageId(title);
    if (!cur && cache.pages[id]) { ui.edit = false; ui.dirty = false; ui.sel.pages = id; render(); return toast('已经有这一页了（同名 = 同一页），已为你打开'); }
    var doc = Object.assign({}, cur || {}, { id: id, title: title, type: d.type, tags: words(d.tags), aliases: words(d.aliases), markdown: d.markdown, claims: (cur && cur.claims) || [] });
    if (d.locked) doc.lockedBy = 'user'; else delete doc.lockedBy;
    if (d.sourceIds && d.sourceIds.length) doc.sourceIds = d.sourceIds.slice(); else delete doc.sourceIds;
    store.put('page', doc, { baseRev: d.baseRev, reason: cur ? '编辑' : '新建' }).then(function (r) {
      if (!r.ok) return toast(r.code === 'conflict' ? '保存失败：' + r.error + '。你的文字还在编辑框里，复制后刷新再改。' : '保存失败：' + r.error);
      ui.edit = false; ui.dirty = false; ui.draft = null; ui.sel.pages = id; ui.hist = null;
      toast(r.noop ? '没有变化，不另存一版' : '已保存（第 ' + r.doc.rev + ' 版）');
      render();
    });
  }

  // ---------------------------------------------------------------- decisions
  var dcache = {};
  function renderDecisions() {
    return store.list('decision').then(function (ds) {
      dcache = {}; ds.forEach(function (d) { dcache[d.id] = d; });
      var cur = ui.sel.decisions && dcache[ui.sel.decisions] || null;
      var items = ds.filter(function (d) { return matches(ui.q, [d.title, d.requirement, d.decision]); }).sort(by('updatedAt'))
        .map(function (d) { return { id: d.id, title: d.title, sub: (STATE_NAMES[d.state] || d.state) + ' · 第 ' + d.rev + ' 版 · ' + when(d.updatedAt) }; });
      var right;
      if (ui.edit && ui.draft) right = decisionEditor(cur);
      else if (cur) right = decisionView(cur);
      else right = '<section class="lk-card lk-ed"><p class="lk-empty">记录一个决定：需求、选项、决定、理由、还没解决的问题。<br>“已确认”的决策只有你能改，AI 只能提出新的提议。</p></section>';
      main.innerHTML = '<div class="lk-split' + (cur || ui.edit ? ' editing' : '') + '">' + sideList(items, cur && cur.id, '搜索决策', '新建') + right + '</div>';
    });
  }
  function listHtml(a) { a = (a || []).filter(Boolean); return a.length ? '<ul>' + a.map(function (x) { return '<li>' + esc(typeof x === 'string' ? x : x.text) + '</li>'; }).join('') + '</ul>' : '<p class="lk-note">—</p>'; }
  function decisionView(d) {
    return '<section class="lk-card lk-ed"><div class="lk-bar"><button type="button" class="lk-btn ghost lk-only-narrow" data-act="back">‹ 列表</button>' +
      '<span class="lk-badge ' + esc(d.state) + '">' + esc(STATE_NAMES[d.state] || d.state) + '</span><span class="lk-note">第 ' + d.rev + ' 版 · ' + esc(when(d.updatedAt)) + '</span>' +
      (d.state === 'Confirmed' ? '<span class="lk-lock">🔒 已确认 ' + esc(when(d.confirmedAt)) + '：AI 不能修改</span>' : '') +
      '<span class="sp"></span><button type="button" class="lk-btn" data-act="edit">编辑</button></div>' +
      '<h2 style="margin:0">' + esc(d.title) + '</h2><div class="lk-md">' +
      '<h3>需求</h3><p>' + esc(d.requirement || '—') + '</p><h3>选项</h3>' + listHtml(d.options) + '<h3>决定</h3><p>' + esc(d.decision || '—') + '</p>' +
      '<h3>理由</h3>' + listHtml(d.reasons) + '<h3>还没解决的问题</h3>' + listHtml(d.openQuestions) +
      (d.supersededBy ? '<p class="lk-note">被取代：' + esc(d.supersededBy) + '</p>' : '') + '</div>' + histHtml('decision', d.id, d) + '</section>';
  }
  function decisionEditor(cur) {
    var d = ui.draft, ta = function (f, label, rows) { return '<label class="lk-field">' + label + '<textarea data-f="' + f + '" rows="' + (rows || 3) + '">' + esc(d[f]) + '</textarea></label>'; };
    return '<section class="lk-card lk-ed"><div class="head"><input class="title" type="text" data-f="title" value="' + esc(d.title) + '" placeholder="这个决定是关于什么的" aria-label="决策标题"' + (cur ? '' : ' autofocus') + '></div>' +
      '<div class="lk-meta"><label>状态<select data-f="state">' + M.DECISION_STATES.map(function (s) { return '<option value="' + s + '"' + (s === d.state ? ' selected' : '') + '>' + STATE_NAMES[s] + ' ' + s + '</option>'; }).join('') + '</select></label>' +
      '<label>被哪个决策取代（可选）<input type="text" data-f="supersededBy" value="' + esc(d.supersededBy) + '"></label></div>' +
      ta('requirement', '需求') + ta('options', '选项（每行一个）', 4) + ta('decision', '决定') + ta('reasons', '理由（每行一个）', 4) + ta('openQuestions', '还没解决的问题（每行一个）', 3) +
      '<div class="lk-bar"><span class="lk-note">' + (cur ? '从第 ' + d.baseRev + ' 版改起' : '') + '</span><span class="sp"></span><button type="button" class="lk-btn ghost" data-act="cancel">取消</button><button type="button" class="lk-btn" data-act="save">保存</button></div></section>';
  }
  function startDecision(cur) {
    ui.edit = true; ui.dirty = false; ui.hist = null; ui.showRev = null;
    ui.draft = cur ? { title: cur.title, state: cur.state, supersededBy: cur.supersededBy || '', requirement: cur.requirement || '', options: (cur.options || []).join('\n'), decision: cur.decision || '', reasons: (cur.reasons || []).join('\n'), openQuestions: (cur.openQuestions || []).join('\n'), baseRev: cur.rev }
      : { title: '', state: 'Proposed', supersededBy: '', requirement: '', options: '', decision: '', reasons: '', openQuestions: '', baseRev: 0 };
    render();
  }
  function saveDecision() {
    var d = ui.draft, title = String(d.title || '').trim();
    if (!title) return toast('先写一个标题');
    var cur = ui.sel.decisions && dcache[ui.sel.decisions];
    var id = cur ? cur.id : M.decisionId(title);
    if (!cur && dcache[id]) { ui.edit = false; ui.dirty = false; ui.sel.decisions = id; render(); return toast('已经有同名的决策了，已为你打开'); }
    var doc = Object.assign({}, cur || {}, { id: id, title: title, state: d.state, requirement: d.requirement.trim(), options: lines(d.options), decision: d.decision.trim(), reasons: lines(d.reasons), openQuestions: lines(d.openQuestions) });
    if (d.supersededBy.trim()) doc.supersededBy = d.supersededBy.trim(); else delete doc.supersededBy;
    if (cur && cur.state === 'Confirmed' && !confirm('这是已确认的决策。确定要修改吗？（会留下新的一版）')) return;
    store.put('decision', doc, { baseRev: d.baseRev, reason: cur ? (cur.state !== d.state ? '状态：' + STATE_NAMES[cur.state] + ' → ' + STATE_NAMES[d.state] : '编辑') : '新建' }).then(function (r) {
      if (!r.ok) return toast('保存失败：' + r.error);
      ui.edit = false; ui.dirty = false; ui.draft = null; ui.sel.decisions = id; ui.hist = null;
      toast(r.noop ? '没有变化，不另存一版' : '已保存（第 ' + r.doc.rev + ' 版）'); render();
    });
  }

  // ---------------------------------------------------------------- sources: import, read (never edited)
  var KIND_NAMES = { web: '网页', note: '笔记', markdown: 'Markdown', card: 'Minest 卡片', pdf: 'PDF', chat: '对话' };
  function renderSources() {
    return Promise.all([store.list('source'), store.list('page')]).then(function (r) {
      var ss = r[0], pages = r[1], byId = {};
      ss.forEach(function (s) { byId[s.id] = s; });
      cache.sources = byId;
      var cur = !ui.imp && ui.sel.sources && byId[ui.sel.sources];
      var items = ss.filter(function (s) { return matches(ui.q, [s.title, s.text, s.origin && s.origin.url]); }).sort(by('createdAt'))
        .map(function (s) { return { id: s.id, title: s.title || s.id, sub: (KIND_NAMES[s.kind] || s.kind) + ' · ' + when(s.createdAt) + (ss.some(function (x) { return x.supersedes === s.id; }) ? ' · 有新版本' : '') }; });
      var right;
      if (ui.imp) right = importPanel();
      else if (cur) right = sourceView(cur, byId, ss, pages);
      else right = '<section class="lk-card lk-ed"><p class="lk-empty">这里是导入的原始资料：网页、笔记、Markdown、Minest 卡片。<br>原文写入后永不修改；同样的内容再导入一次不会多出一份。<br>点“导入”开始。</p></section>';
      main.innerHTML = '<div class="lk-split' + (cur || ui.imp ? ' editing' : '') + '">' + sideList(items, cur && cur.id, '搜索来源', '导入') + right + '</div>';
    });
  }
  function sourceView(s, byId, all, pages) {
    var newer = all.filter(function (x) { return x.supersedes === s.id; });
    var older = s.supersedes && byId[s.supersedes];
    var using = pages.filter(function (p) { return (p.sourceIds || []).indexOf(s.id) >= 0 || (p.claims || []).some(function (c) { return (c.sources || []).some(function (x) { return x.sourceId === s.id; }); }); });
    var o = s.origin || {}, where = [];
    if (o.url) where.push('<a href="' + esc(o.url) + '" target="_blank" rel="noopener noreferrer">' + esc(o.url.length > 70 ? o.url.slice(0, 67) + '…' : o.url) + '</a>');
    if (o.fileName) where.push('文件 ' + esc(o.fileName));
    if (o.cardRef) where.push('卡片：' + esc((o.board || '') + ' › ' + (o.list || '') + ' › ' + s.title));
    return '<section class="lk-card lk-ed"><div class="lk-bar"><button type="button" class="lk-btn ghost lk-only-narrow" data-act="back">‹ 列表</button><span class="lk-badge">' + esc(KIND_NAMES[s.kind] || s.kind) + '</span>' +
      '<span class="lk-lock">原文只读，永不修改</span><span class="sp"></span><button type="button" class="lk-btn ghost" data-act="src-page">用它新建知识页</button><button type="button" class="lk-btn" data-act="ingest-plan">' + (isLocal() ? '整理这份来源' : '让 AI 整理') + '</button></div>' +
      ingestPanel(s) +
      '<h2 style="margin:0">' + esc(s.title || s.id) + '</h2>' +
      '<div class="lk-note">' + (where.length ? where.join(' · ') + '<br>' : '') + '导入于 ' + esc(when(s.createdAt)) + ' · ' + esc(s.id) + ' · ' + Math.round(M.byteSize(s.text) / 102.4) / 10 + ' KB</div>' +
      (older ? '<div class="lk-links"><span>这是新版本，之前的：</span><button type="button" data-act="open-src" data-id="' + esc(older.id) + '">' + esc(older.title) + ' · ' + esc(when(older.createdAt)) + '</button></div>' : '') +
      (newer.length ? '<div class="lk-links"><span>⚠️ 已有更新的版本：</span>' + newer.map(function (n) { return '<button type="button" data-act="open-src" data-id="' + esc(n.id) + '">' + esc(n.title) + ' · ' + esc(when(n.createdAt)) + '</button>'; }).join('') + '</div>' : '') +
      '<div class="lk-links"><span>引用它的知识页：</span>' + (using.length ? using.map(function (p) { return '<button type="button" data-act="open-page" data-id="' + esc(p.id) + '">' + esc(p.title) + '</button>'; }).join('') : '<span>（还没有）</span>') + '</div>' +
      '<pre style="white-space:pre-wrap;font:13px/1.6 var(--mono);margin:0;max-height:60vh;overflow:auto">' + esc(s.text) + '</pre></section>';
  }
  function importPanel() {
    var x = ui.imp, rep = x.report;
    var cardsHtml = '';
    if (x.cards) {
      var boards = {}; x.cards.forEach(function (c) { boards[c.bid] = c.board || c.bid; });
      var shown = x.cards.filter(function (c) { return (!x.bid || c.bid === x.bid) && matches(x.cq, [c.title, c.list]); });
      var picked = Object.keys(x.picked).filter(function (k) { return x.picked[k]; }).length;
      cardsHtml = !x.cards.length ? '<p class="lk-note">这台设备上没有找到 Minest 看板。先在这台设备上打开一次 Minest，或者从 Minest 里打开这一页。</p>' :
        '<div class="lk-meta"><label>看板<select data-imp="bid"><option value="">全部看板（' + x.cards.length + ' 张卡片）</option>' + Object.keys(boards).map(function (b) { return '<option value="' + esc(b) + '"' + (b === x.bid ? ' selected' : '') + '>' + esc(boards[b]) + '</option>'; }).join('') + '</select></label>' +
        '<label>搜索卡片<input type="search" data-imp="cq" value="' + esc(x.cq) + '"></label></div>' +
        '<div class="lk-cards" role="group" aria-label="卡片">' + shown.slice(0, 300).map(function (c) {
          var k = c.bid + '|' + c.cardId;
          return '<label class="lk-check"><input type="checkbox" data-card="' + esc(k) + '" aria-label="' + esc(c.title + '（' + c.list + '）') + '"' + (x.picked[k] ? ' checked' : '') + '> <span>' + esc(c.title) + ' <small class="lk-note">' + esc(c.list) + '</small></span></label>';
        }).join('') + (shown.length > 300 ? '<p class="lk-note">只显示前 300 张，请用搜索缩小范围</p>' : '') + (shown.length ? '' : '<p class="lk-note">没有符合的卡片</p>') + '</div>' +
        '<div class="lk-bar"><button type="button" class="lk-btn ghost" data-act="imp-all-shown">全选显示的</button><span class="sp"></span><button type="button" class="lk-btn" data-act="imp-cards"' + (picked ? '' : ' disabled') + '>导入所选 ' + picked + ' 张</button></div>';
    }
    return '<section class="lk-card lk-ed"><div class="lk-bar"><button type="button" class="lk-btn ghost" data-act="imp-close">‹ 返回</button><h2 style="margin:0;font-size:18px">导入原始资料</h2></div>' +
      '<p class="lk-note">只保存原文和它从哪里来，不会改动任何知识页。同样的内容再导入一次不会多出一份；同一网址或同一张卡片的新内容会另存一份，并标明它是新版本。</p>' +
      (rep ? reportHtml(rep) : '') +
      '<div class="lk-drop" id="lk-drop"><b>文件</b><span class="lk-note">.txt · .md · .html（可多选，也可以拖到这里）。从活知识导出的 .md 会还原成原来的页面和来源。</span>' +
      '<button type="button" class="lk-btn ghost" data-act="pick">选择文件</button><input type="file" id="lk-file" multiple hidden accept=".txt,.md,.markdown,.html,.htm,text/plain,text/markdown,text/html"></div>' +
      '<div class="lk-sub"><b>粘贴</b><div class="lk-meta"><label>标题（可不填）<input type="text" data-imp="title" value="' + esc(x.title) + '"></label><label>网址（可不填）<input type="text" inputmode="url" data-imp="url" value="' + esc(x.url) + '" placeholder="https://"></label></div>' +
      '<textarea data-imp="text" rows="6" placeholder="粘贴文字或网页内容" aria-label="粘贴的内容">' + esc(x.text) + '</textarea>' +
      '<div class="lk-bar"><span class="lk-note">现在不会去网上抓取网页：请把网页内容复制过来，或另存为 .html 再导入</span><span class="sp"></span><button type="button" class="lk-btn" data-act="imp-paste"' + (x.text.trim() ? '' : ' disabled') + '>导入粘贴的内容</button></div></div>' +
      '<div class="lk-sub"><b>Minest 卡片</b>' + (x.cards ? cardsHtml : '<div class="lk-bar"><span class="lk-note">读取这台设备上的看板（只读，不会改动卡片）</span><span class="sp"></span><button type="button" class="lk-btn ghost" data-act="imp-boards">读取看板</button></div>') + '</div></section>';
  }
  function reportHtml(r) {
    var rows = [];
    r.added.forEach(function (s) { rows.push('<li>✅ 新来源：<button type="button" data-act="open-src" data-id="' + esc(s.id) + '">' + esc(s.title) + '</button>' + (s.supersedes ? '（' + esc((cache.sources[s.supersedes] || {}).title || '旧版') + ' 的新版本）' : '') + '</li>'); });
    r.duplicates.forEach(function (d) { rows.push('<li>↺ 已经有了，没有重复保存：<button type="button" data-act="open-src" data-id="' + esc(d.source.id) + '">' + esc(d.source.title) + '</button></li>'); });
    r.pages.forEach(function (p) { rows.push('<li>' + (p.status === 'added' ? '📄 还原了知识页：' : p.status === 'unchanged' ? '📄 知识页已存在且相同：' : '📄 知识页已存在且不同，保留你现在的版本：') + '<button type="button" data-act="open-page" data-id="' + esc(p.page.id) + '">' + esc(p.page.title) + '</button></li>'); });
    (r.skipped || []).forEach(function (e) { rows.push('<li class="lk-note">— ' + esc(e) + '</li>'); });
    r.errors.forEach(function (e) { rows.push('<li style="color:var(--bad)">✕ ' + esc(e) + '</li>'); });
    return '<div class="lk-report" role="status"><b>导入结果：新增 ' + r.added.length + ' · 重复 ' + r.duplicates.length + (r.pages.length ? ' · 知识页 ' + r.pages.length : '') + (r.errors.length ? ' · 失败 ' + r.errors.length : '') + '</b><ul>' + rows.join('') + '</ul></div>';
  }
  function runImport(inputs, after) {
    if (!inputs.length) return;
    toast('导入中…');
    return IM.importAll(store, inputs, { via: 'living-knowledge' }).then(function (rep) {
      ui.imp.report = rep; if (after) after(rep);
      toast('新增 ' + rep.added.length + ' 个来源' + (rep.duplicates.length ? '，' + rep.duplicates.length + ' 个已存在' : '') + (rep.errors.length ? '，' + rep.errors.length + ' 个失败' : ''));
      return render().then(function () { var el = main.querySelector('.lk-report'); if (el) { el.scrollIntoView({ block: 'center', behavior: 'smooth' }); el.setAttribute('tabindex', '-1'); el.focus({ preventScroll: true }); } });
    }, function (e) { toast('导入失败：' + (e && e.message || e)); });
  }
  function readFiles(list) {
    var files = Array.prototype.slice.call(list || []).filter(function (f) { return /\.(txt|md|markdown|html?)$/i.test(f.name) || /^text\//.test(f.type); });
    if (!files.length) return toast('只能导入 .txt / .md / .html 文件');
    Promise.all(files.map(function (f) { return f.text().then(function (t) { return { name: f.name, content: t }; }); })).then(function (inputs) { runImport(inputs); });
  }
  // the boards: from Minest itself when this page was opened from it, else Minest's copy on this device
  function readBoards() {
    var ws = [];
    try { if (window.opener) ws.push(window.opener); } catch (e) {}
    try { if (window.parent && window.parent !== window) ws.push(window.parent); } catch (e) {}
    for (var i = 0; i < ws.length; i++) { try { var A = ws[i].MinestAI; if (A && A.boards) { var b = A.boards(); if (Array.isArray(b) && b.length) return JSON.parse(JSON.stringify(b)); } } catch (e) {} }
    try { var v = JSON.parse(localStorage.getItem(BOARDS_KEY) || 'null'); if (Array.isArray(v)) return v; } catch (e) {}
    return [];
  }

  // ---------------------------------------------------------------- conflicts
  function renderConflicts() {
    return store.conflicts().then(function (cs) {
      if (!cs.length) { main.innerHTML = '<section class="lk-card lk-block"><h2>没有冲突</h2><p class="lk-note">两台设备同时改了同一份内容时，云端那份不会被悄悄覆盖：两份都留在这里，由你选择。</p></section>'; return; }
      main.innerHTML = cs.map(function (c) {
        var show = function (d) { return !d ? '（云端没有这一份）' : c.kind === 'page' ? '# ' + d.title + '\n\n' + (d.markdown || '') : c.kind === 'decision' ? M.decisionToMarkdown(d) : JSON.stringify(d, null, 1); };
        var title = (c.mine && c.mine.title) || (c.theirs && c.theirs.title) || c.id;
        return '<section class="lk-card lk-block"><h2>' + esc(title) + ' <span class="lk-badge">' + (c.kind === 'page' ? '知识页' : c.kind === 'decision' ? '决策' : c.kind) + '</span></h2>' +
          '<p class="lk-note">你在这台设备上从第 ' + c.baseRev + ' 版改起，同时另一台设备已经保存了第 ' + ((c.theirs && c.theirs.rev) || '?') + ' 版。</p>' +
          '<div class="lk-two"><div><b>云端的（另一台设备）</b><pre>' + esc(show(c.theirs)) + '</pre></div><div><b>这台设备上的</b><pre>' + esc(show(c.mine)) + '</pre></div></div>' +
          '<div class="lk-bar"><span class="sp"></span><button type="button" class="lk-btn ghost" data-act="keep-theirs" data-kind="' + esc(c.kind) + '" data-id="' + esc(c.id) + '">保留云端的</button>' +
          '<button type="button" class="lk-btn" data-act="keep-mine" data-kind="' + esc(c.kind) + '" data-id="' + esc(c.id) + '">保留这台设备的</button></div></section>';
      }).join('');
    });
  }

  // ---------------------------------------------------------------- claims on a page
  var CLAIM_KINDS = { fact: '事实', definition: '定义', opinion: '观点', inference: '推断' };
  function claimsHtml(p) {
    var cs = p.claims || [];
    if (!cs.length) return '';
    var byId = {}; cs.forEach(function (c) { byId[c.id] = c; });
    return '<div class="lk-claims"><b>关键说法</b><ol>' + cs.map(function (c) {
      var srcs = (c.sources || []).map(function (s) {
        var src = cache.sources[s.sourceId];
        return '<button type="button" class="lk-q" data-act="open-src" data-id="' + esc(s.sourceId) + '" title="' + esc(s.quote || '') + '">' + esc(src ? src.title : '来源') + (s.quote ? '：“' + esc(s.quote.length > 60 ? s.quote.slice(0, 58) + '…' : s.quote) + '”' : '') + '</button>';
      }).join('');
      var against = (c.conflictsWith || []).map(function (id) { return byId[id]; }).filter(Boolean);
      return '<li id="claim-' + esc(c.id) + '"><span>' + esc(c.text) + '</span> <span class="lk-badge">' + esc(CLAIM_KINDS[c.kind] || c.kind || '') + '</span>' +
        (c.origin === 'ai_inferred' ? ' <span class="lk-badge ai">AI 推断 · 无出处</span>' : '') + (c.confidence != null ? ' <span class="lk-note">把握 ' + Math.round(c.confidence * 100) + '%</span>' : '') +
        (against.length ? '<div class="lk-conf">⚠️ 与这条说法矛盾：' + against.map(function (x) { return '“' + esc(x.text) + '”'; }).join('；') + '</div>' : '') +
        (srcs ? '<div class="lk-srcs">' + srcs + '</div>' : '') + '</li>';
    }).join('') + '</ol></div>';
  }

  // ---------------------------------------------------------------- AI: organise a source (M3)
  var AG = window.MinestLKAgent;
  function aiBase() {
    var o = lsGet('minest_lk_endpoint'); if (o) return o;                       // a test server, set by hand
    var e = lsGet('minest_ai_chat_endpoint');
    if (e && /\/ai-chat(-stream)?$/.test(e)) return e.replace(/ai-chat(-stream)?$/, '');
    if (location.hostname === 'minest-app.vercel.app') return '/api/minest/';
    return 'https://minest-app.vercel.app/api/minest/';
  }
  // the same way into Minest AI as the rest of Minest: this device's Minest token, else the Google sign-in
  function aiHeaders() {
    var t = lsGet('minest_ai_token');
    if (t) return { 'X-Minest-Token': t };
    if (user && user.getIdToken) return user.getIdToken().then(function (id) { return { 'X-Minest-Id-Token': id }; });
    return {};
  }
  var transport = AG ? AG.httpTransport({ base: aiBase(), headers: aiHeaders }) : null;

  // ---------------------------------------------------------------- 问 AI (M4): an answer from the library, every point with its pages
  var CONF_NAMES = { high: ['hi', '把握高'], medium: ['mid', '把握中等'], low: ['lo', '把握低'], none: ['lo', '知识库里没有'] };
  function askAI(q) {
    q = String(q || '').trim();
    if (!q) return toast('先写下你的问题');
    if (!AG || !store) return;
    if (ui.qa && ui.qa.ctl) try { ui.qa.ctl.abort(); } catch (e) {}
    var qa = ui.qa = { q: q, state: 'loading', ctl: typeof AbortController !== 'undefined' ? new AbortController() : null };
    paintAnswer();
    AG.ask(store, q, agentOpts({ signal: qa.ctl && qa.ctl.signal, history: ui.qaHist.slice(-4) })).then(function (a) {
      if (ui.qa !== qa) return;
      qa.state = 'done'; qa.a = a;
      if (a.status === 'answered' && a.summary) ui.qaHist.push({ q: q, a: a.summary });
      paintAnswer();
    }, function (e) {
      if (ui.qa !== qa) return;
      if (e && e.name === 'AbortError') { ui.qa = null; return paintAnswer(); }
      qa.state = e && e.code === 'ai-not-allowed' ? 'need-perm' : 'error'; qa.err = (e && e.message) || String(e);
      paintAnswer();
    });
  }
  function paintAnswer() {
    var el = $('lk-answer'), qa = ui.qa;
    if (!el) return;
    if (!qa) { el.hidden = true; el.innerHTML = ''; return; }
    var body;
    if (qa.state === 'loading') body = '<p class="lk-ans-wait" role="status">' + (isLocal() ? '正在你的知识库里找相关的说法…' : '正在你的知识库里找相关的页面，再请 AI 只根据它们回答…') + '</p><div class="lk-bar"><span class="sp"></span><button type="button" class="lk-btn ghost" data-ans="stop">停止</button></div>';
    else if (qa.state === 'need-perm') body = '<p class="lk-ans-sum">还没有允许把知识库内容发给 Minest AI。</p><p class="lk-note">打开后，提问时只会发送和问题相关的那几页的标题、摘要和说法。</p><div class="lk-bar"><span class="sp"></span><button type="button" class="lk-btn" data-ans="perms">去“权限”打开</button></div>';
    else if (qa.state === 'error') body = '<p class="lk-ans-sum" style="color:var(--bad)">没有回答成功：' + esc(qa.err) + '</p><div class="lk-bar"><span class="sp"></span><button type="button" class="lk-btn" data-ans="ask" data-q="' + esc(qa.q) + '">再试一次</button></div>';
    else {
      var a = qa.a;
      if (a.status === 'nothing') body = '<p class="lk-ans-sum">知识库里还没有和这个问题相关的内容。</p><p class="lk-note">' + (a.engine === 'local' ? '本机检索是按字面找词的：它不会翻译，也不认识同义词。换一个原文里出现过的词试试，或者先导入一份资料。' : '没有向 AI 发送任何东西。可以先导入一份资料，或者自己写一页。') + '</p>' +
        '<div class="lk-bar"><span class="sp"></span><button type="button" class="lk-btn ghost" data-ans="import">去导入来源</button>' + (a.suggestPage ? '<button type="button" class="lk-btn" data-ans="new" data-title="' + esc(a.suggestPage) + '">新建「' + esc(a.suggestPage) + '」</button>' : '') + '</div>';
      else {
        var conf = CONF_NAMES[a.confidence] || CONF_NAMES.low;
        body = (a.summary ? '<p class="lk-ans-sum">' + esc(a.summary) + '</p>' : '') +
          (a.points.length ? '<ol class="lk-ans-pts">' + a.points.map(function (p) {
            var refs = (p.pageIds || []).filter(function (id) { return a.titles[id]; }).map(function (id) {
              var mine = (p.claimIds || []).filter(function (c) { return a.claims[c] && a.claims[c].pageId === id; }).map(function (c) { return a.claims[c].text; });
              return '<button type="button" data-ans="page" data-id="' + esc(id) + '" title="' + esc(mine.join('\n') || '打开这一页') + '">' + esc(a.titles[id]) + '</button>';
            }).join('') + (p.decisionIds || []).filter(function (id) { return a.decisions[id]; }).map(function (id) { return '<button type="button" data-ans="decision" data-id="' + esc(id) + '">决策 · ' + esc(a.decisions[id]) + '</button>'; }).join('');
            return '<li' + (p.grounded ? '' : ' class="inf"') + '>' + esc(p.text) + '<div class="refs">' + (p.grounded ? '<span>依据</span>' + refs : '<span class="inf-tag">AI 推断</span><span>知识库里没有这一点的出处</span>') + '</div></li>';
          }).join('') + '</ol>' : '') +
          (a.gaps.length ? '<div class="lk-ans-more"><span>还缺：</span>' + a.gaps.map(function (g) { return '<i>' + esc(g) + '</i>'; }).join('') + '</div>' : '') +
          (a.followups.length ? '<div class="lk-ans-more"><span>接着问：</span>' + a.followups.map(function (f) { return '<button type="button" data-ans="ask" data-q="' + esc(f) + '">' + esc(f) + '</button>'; }).join('') + '</div>' : '') +
          '<p class="lk-ans-meta"><span class="' + conf[0] + '">' + conf[1] + '</span> · ' + (a.engine === 'local' ? '在这台设备上查了 ' : '发送了 ') + a.sent.pages + ' 页、' + a.sent.claims + ' 条说法' + (a.sent.decisions ? '、' + a.sent.decisions + ' 个决策' : '') + (a.engine === 'local' ? ' · 没有联网 · 每一点都是知识库里的原话' : '') +
          (a.usage ? ' · 约 ' + (a.usage.input + a.usage.output) + ' token' : '') + ' · 回答不会自动写入知识库</p>' +
          '<div class="lk-bar"><span class="sp"></span>' + (a.suggestPage && !cache.pages[M.pageId(a.suggestPage)] ? '<button type="button" class="lk-btn ghost" data-ans="new" data-title="' + esc(a.suggestPage) + '">新建「' + esc(a.suggestPage) + '」</button>' : '') +
          '<button type="button" class="lk-btn" data-ans="save">存成一页笔记</button></div>';
      }
    }
    el.innerHTML = '<div class="lk-ans-h"><span class="lk-badge">' + (qa.a && qa.a.engine === 'local' || (!qa.a && isLocal()) ? '本机检索' : '问 AI') + '</span><b>' + esc(qa.q) + '</b><button type="button" class="lk-ans-x" data-ans="close" aria-label="关闭回答">×</button></div>' + body;
    el.hidden = false;
  }
  function openPage(id) {
    ui.tab = 'pages'; lsSet(TAB_KEY, 'pages'); ui.sel.pages = id; ui.edit = false; ui.draft = null; ui.dirty = false; ui.hist = null; ui.imp = null; ui.q = '';
    return render();
  }
  function composePage() {
    var pg = cache.pages[ui.sel.pages];
    if (!pg || ui.composing || !AG) return;
    ui.composing = pg.id; render();
    AG.compose(store, pg.id, agentOpts()).then(function (d) {
      ui.composing = null;
      if (ui.tab !== 'pages' || ui.sel.pages !== d.pageId || ui.edit) { toast('草稿写好了，但你已经离开那一页；回到那一页再点一次'); return render(); }
      return store.get('page', d.pageId).then(function (cur) {
        startPage(cur);
        ui.draft.markdown = d.markdown; ui.dirty = true;
        ui.draft.aiNote = (isLocal() ? '本机草稿（只是把说法按类型排好，没有改写）' : 'AI 草稿') + '：用了这一页 ' + d.usedClaimIds.length + ' 条已接受的说法' + (d.unusedClaims ? '，' + d.unusedClaims + ' 条没用上' : '') + (d.leftOut ? '（' + d.leftOut + '）' : '') + '。请读一遍再保存；保存后成为新的一版，取消则什么都不变。';
        render();
      });
    }, function (e) {
      ui.composing = null;
      toast('没有起草成功：' + ((e && e.message) || e));
      if (e && e.code === 'ai-not-allowed') setTab('perms'); else render();
    });
  }
  // the numbers Minest's Knowledge page shows next to its own views (same origin only)
  function stats() {
    if (!store) return Promise.resolve(null);
    return Promise.all([store.list('page'), store.list('source'), store.list('decision'), store.list('run')]).then(function (r) {
      return { pages: r[0].length, claims: r[0].reduce(function (n, p) { return n + (p.claims || []).length; }, 0), sources: r[1].length, decisions: r[2].length,
        pending: AG ? AG.pendingCount(r[3]) : 0, conflicts: r[0].reduce(function (n, p) { return n + (p.claims || []).filter(function (c) { return (c.conflictsWith || []).length; }).length; }, 0),
        signedIn: !!user, tab: ui.tab };
    });
  }
  var statsT = null;
  function postStats() {
    if (!EMBED || window.parent === window) return;
    clearTimeout(statsT);
    statsT = setTimeout(function () { stats().then(function (st) { if (st) try { window.parent.postMessage({ type: 'lk-stats', stats: st }, location.origin); } catch (e) {} }); }, 120);
  }
  function ingestPanel(s) {
    var g = ui.ingest;
    if (!g || g.sourceId !== s.id) return '';
    if (g.local) return localPanel(g);
    var body;
    if (!g.perms.allowAI) body = '<p>还没有允许把来源文字发给 Minest AI。</p><div class="lk-bar"><span class="sp"></span><button type="button" class="lk-btn ghost" data-act="ingest-cancel">取消</button><button type="button" class="lk-btn" data-act="go-perms">去“权限”打开</button></div>';
    else if (g.running) body = '<p role="status">正在整理：第 ' + Math.min((g.progress ? g.progress.done : 0) + 1, g.est.allowed) + ' / ' + g.est.allowed + ' 段…</p><div class="lk-bar"><span class="lk-note">停止后，已经整理好的部分仍会留给你审核</span><span class="sp"></span><button type="button" class="lk-btn danger" data-act="ingest-stop">停止</button></div>';
    else if (g.result) {
      var r = g.result, n = AG.pendingCount([r]);
      body = '<p role="status">' + (r.status === 'review' ? '整理好了：有 ' + n + ' 条建议等你审核。' : r.status === 'empty' ? '没有新的内容：这份来源里的说法知识页里都已经有了。' : '没有整理成功。') +
        (r.limited ? ' 这次按上限只发了 ' + r.used.calls + ' 段，后面的没有整理。' : '') + (r.stopped ? ' 你中途停止了。' : '') + '</p>' +
        (r.errors && r.errors.length ? '<p class="lk-note" style="color:var(--bad)">' + r.errors.map(esc).join('<br>') + '</p>' : '') +
        '<div class="lk-bar"><span class="lk-note">发送了 ' + r.used.calls + ' 段' + (r.used.input ? ' · 约 ' + (r.used.input + r.used.output) + ' token' : '') + '</span><span class="sp"></span><button type="button" class="lk-btn ghost" data-act="ingest-cancel">关闭</button>' +
        (r.status === 'review' ? '<button type="button" class="lk-btn" data-act="open-run" data-id="' + esc(r.id) + '">去审核</button>' : '') + '</div>';
    } else body = '<p>会把这份来源分成 <b>' + g.est.calls + '</b> 段发给 Minest AI' + (g.est.over ? '，按你设的上限这次只发前 <b>' + g.est.allowed + '</b> 段' : '') + '，大约用 ' + g.est.approxTokens.toLocaleString() + ' token。</p>' +
      '<p class="lk-note">一起发送的还有知识页的标题和已有说法（用来找重复和矛盾）。AI 只提建议，什么都不会直接写入。</p>' +
      '<div class="lk-bar"><span class="sp"></span><button type="button" class="lk-btn ghost" data-act="ingest-cancel">取消</button><button type="button" class="lk-btn" data-act="ingest-start">开始整理（发送 ' + g.est.allowed + ' 段）</button></div>';
    return '<div class="lk-report lk-ingest"><b>让 AI 整理这份来源</b>' + body + '</div>';
  }
  function startIngest() {
    var g = ui.ingest; if (!g || g.running) return;
    g.running = true; g.ctl = typeof AbortController !== 'undefined' ? new AbortController() : null; g.progress = null; g.traces = []; g.result = null; clearTimeout(g.timer); render();
    AG.ingest(store, agentOpts({ sourceIds: [g.sourceId], signal: g.ctl && g.ctl.signal, onProgress: function (p) { g.progress = p; if (ui.tab === 'sources' && !g.local) render(); } }, !!g.local))
      .then(function (run) {
        g.running = false; g.result = run;
        if (!g.local) toast(run.status === 'review' ? '整理好了，去“审核”看看' : run.status === 'empty' ? '没有新的内容' : '没有整理成功');
        return render().then(function () { if (g.local && g.traces.length && ui.ingest === g) vizPlay(g, 0); });
      },
        function (e) { g.running = false; toast('没有开始：' + (e && e.message || e)); if (e && e.code === 'ai-not-allowed') g.perms.allowAI = false; render(); });
  }

  // ---------------------------------------------------------------- the on-device engine, and the picture of each of its steps
  var L = window.MinestLKLocal, DEMO = window.MinestLKDemo, ENGINE_KEY = 'minest.lk.engine';
  function isLocal() { return !!L && lsGet(ENGINE_KEY) !== 'cloud'; }
  var localTransport = L ? L.transport({ onTrace: function (t) { if (ui.ingest && ui.ingest.traces) ui.ingest.traces.push(t); } }) : null;
  function agentOpts(o, local) { o = o || {}; o.local = local == null ? isLocal() : !!local; o.transport = o.local ? localTransport : transport; return o; }
  var STAGES = ['切分句子', '数词频', '找概念', '句子排序', '选出说法', '连成关系', '比对出建议'];
  var KIND_CC = { fact: 'var(--c2)', definition: 'var(--c1)', opinion: 'var(--c4)' };
  function wordsRe(forms) {
    var latin = [], cjk = [];
    forms.slice().sort(function (a, b) { return b.length - a.length; }).forEach(function (f) {
      var e = f.replace(/[.*+?^${}()|[\]\\]/g, '\\$&').replace(/\s+/g, '\\s+');
      if (/[\u3400-\u9fff]/.test(f)) cjk.push(e); else latin.push(e);
    });
    var parts = [];
    if (latin.length) parts.push('\\b(?:' + latin.join('|') + ')\\b');
    if (cjk.length) parts.push('(?:' + cjk.join('|') + ')');
    return parts.length ? new RegExp(parts.join('|'), 'gi') : null;
  }
  function vizText(src, t, stage) {
    var text = src.text, out = [], at = t.offset, re = null;
    var scores = t.sentences.map(function (s) { return s.score; }), max = Math.max.apply(null, scores.concat([0.001])), min = Math.min.apply(null, scores.concat([max]));
    if (stage === 1) re = wordsRe(t.terms.slice(0, 12).reduce(function (l, x) { return l.concat(x.forms); }, []));
    if (stage === 2) re = wordsRe(t.concepts.reduce(function (l, c) { return l.concat(c.forms); }, []));
    t.sentences.forEach(function (s, i) {
      if (s.start > at) out.push(esc(text.slice(at, s.start)));
      var body = esc(text.slice(s.start, s.end)), cls = 's', style = '';
      if (re) body = body.replace(re, '<mark>$&</mark>');
      if (stage === 0) { body = '<sup>' + (i + 1) + '</sup>' + body; cls += i % 2 ? ' odd' : ' even'; }
      if (stage === 3) { cls += ' heat'; style = '--h:' + Math.round((s.score - min) / (max - min || 1) * 100) + '%'; }
      if (stage === 4 || stage === 6) { cls += s.pick ? ' pick' : ' dim'; if (s.pick) style = '--k:' + (KIND_CC[s.kind] || 'var(--c2)'); }
      if (stage === 5) cls += s.rel ? ' rel' : ' dim';
      out.push('<span class="' + cls + '"' + (style ? ' style="' + style + '"' : '') + '>' + body + '</span>');
      at = s.end;
    });
    out.push(esc(text.slice(at, t.offset + t.length)));
    return out.join('');
  }
  function vizGraph(t) {
    var W = 460, H = 260, cx = W / 2, cy = H / 2, ns = t.concepts, pos = {};
    var max = Math.max.apply(null, ns.map(function (c) { return c.weight; }).concat([1]));
    ns.forEach(function (c, i) { var a = -Math.PI / 2 + i * 2 * Math.PI / ns.length; pos[c.title] = { x: cx + 112 * Math.cos(a), y: cy + 92 * Math.sin(a), c: Math.cos(a), r: 5 + 7 * c.weight / max }; });
    var lines = t.relations.filter(function (r) { return pos[r.from] && pos[r.to]; }).map(function (r) {
      var a = pos[r.from], b = pos[r.to];
      return '<line x1="' + a.x.toFixed(1) + '" y1="' + a.y.toFixed(1) + '" x2="' + b.x.toFixed(1) + '" y2="' + b.y.toFixed(1) + '" stroke-width="' + Math.min(5, r.n + 0.5) + '"' + (r.type === 'related' ? '' : ' class="strong"') + '/>';
    }).join('');
    var dots = ns.map(function (c) {
      var p = pos[c.title], side = p.c > 0.3 ? 'start' : p.c < -0.3 ? 'end' : 'middle';
      var tx = p.x + (side === 'start' ? p.r + 5 : side === 'end' ? -p.r - 5 : 0), ty = p.y + (side === 'middle' ? (p.y < cy ? -p.r - 6 : p.r + 14) : 4);
      return '<circle cx="' + p.x.toFixed(1) + '" cy="' + p.y.toFixed(1) + '" r="' + p.r.toFixed(1) + '"/><text x="' + tx.toFixed(1) + '" y="' + ty.toFixed(1) + '" text-anchor="' + side + '">' + esc(c.title.length > 20 ? c.title.slice(0, 19) + '…' : c.title) + '</text>';
    }).join('');
    return '<svg class="lk-viz-graph" viewBox="0 0 ' + W + ' ' + H + '" role="img" aria-label="' + esc(ns.length + ' 个概念，' + t.relations.length + ' 条关系') + '">' + lines + dots + '</svg>';
  }
  function vizSide(g, src, t, stage) {
    var short = function (s, n) { s = String(s).replace(/\s+/g, ' '); return esc(s.length > n ? s.slice(0, n - 1) + '…' : s); };
    if (stage === 0) return '<div class="lk-viz-nums"><div><b>' + src.text.length.toLocaleString() + '</b><span>字</span></div><div><b>' + g.traces.length + '</b><span>段</span></div><div><b>' + t.sentences.length + '</b><span>句</span></div></div>' +
      '<p class="lk-note">按句号、分号、换行把原文切成句子，并记下每一句在原文里的位置。后面每一条说法的出处，就是这个位置。</p>';
    if (stage === 1) {
      var top = t.terms.slice(0, 12), mx = top.length ? top[0].count : 1;
      return '<ul class="lk-bars">' + top.map(function (x) { return '<li><span>' + esc(x.term) + '</span><i style="--w:' + Math.round(x.count / mx * 100) + '%"></i><b>' + x.count + '</b></li>'; }).join('') + '</ul>' +
        '<p class="lk-note">一共 ' + t.tokens + ' 个词，其中 ' + t.stops + ' 个虚词（the、of、的…）不计。同一个词的单数、复数算在一起。</p>';
    }
    if (stage === 2) {
      var mw = Math.max.apply(null, t.concepts.map(function (c) { return c.weight; }).concat([1]));
      return '<div class="lk-cons">' + t.concepts.map(function (c) { return '<span class="lk-con" style="--z:' + (13 + 9 * c.weight / mw).toFixed(1) + 'px">' + esc(c.title) + '<small>×' + c.count + (c.isNew ? '' : ' · 已有页面') + '</small></span>'; }).join('') + '</div>' +
        '<p class="lk-note">反复出现的词，和连在一起的大写专名，成为概念；出现越多越大。每个概念对应一页知识页。</p>';
    }
    if (stage === 3) {
      var best = t.sentences.map(function (s, i) { return { s: s, i: i }; }).sort(function (a, b) { return b.s.score - a.s.score; }).slice(0, 5), ms = best.length ? best[0].s.score : 1;
      return '<ol class="lk-rankl">' + best.map(function (x) { return '<li><i style="--w:' + Math.round(x.s.score / ms * 100) + '%"></i><span><b>第 ' + (x.i + 1) + ' 句</b> ' + short(src.text.slice(x.s.start, x.s.end), 96) + '</span></li>'; }).join('') + '</ol>' +
        '<p class="lk-note">TextRank：和越多别的句子用词相近的句子，越靠近全文的中心；提到的概念越重要，分数也越高。原文里颜色越深，分数越高。</p>';
    }
    if (stage === 4) return '<ul class="lk-cl">' + t.claims.map(function (c) {
        return '<li style="--k:' + (KIND_CC[c.kind] || 'var(--c2)') + '"><span><span class="lk-badge">' + esc(CLAIM_KINDS[c.kind] || c.kind) + '</span> ' + short(c.text, 110) + '</span><small>→ ' + esc(c.page) + ' · 把握 ' + Math.round(c.confidence * 100) + '%</small></li>';
      }).join('') + '</ul><p class="lk-note">排在前面的句子原封不动地成为说法，挂到它提到的概念上。类型只看句式（we hold、should → 观点；is a → 定义），不是理解出来的。' +
      (t.skipped.short + t.skipped.noConcept ? '另有 ' + t.skipped.short + ' 句太短、' + t.skipped.noConcept + ' 句没有提到任何概念，没有选。' : '') + '</p>';
    if (stage === 5) return vizGraph(t) + '<p class="lk-note">两个概念出现在同一句里，就连一条线；同句的次数越多线越粗。' + (t.relations.some(function (r) { return r.type !== 'related'; }) ? '深色的线是句子里有“来自 / 属于”这类字眼的关系。' : '') + '</p>';
    var r = g.result, n = { claim: 0, support: 0, relation: 0, page: 0 }, conflicts = 0, found = g.traces.reduce(function (k, x) { return k + x.claims.length; }, 0);
    r.proposals.forEach(function (p) { p.items.forEach(function (it) { n[it.type]++; if (it.conflict) conflicts++; }); });
    var fresh = r.proposals.filter(function (p) { return p.isNew; }).length;
    return '<div class="lk-viz-nums"><div><b>' + fresh + '</b><span>新页面</span></div><div><b>' + n.claim + '</b><span>新说法</span></div><div><b>' + n.relation + '</b><span>关系</span></div></div>' +
      '<p class="lk-note">和知识库里已有的内容比对：' + Math.max(0, found - n.claim - n.support) + ' 条已经有了，不重复提出' + (n.support ? '；' + n.support + ' 条只是给已有说法补充出处' : '') + (conflicts ? '；' + conflicts + ' 条和已有说法矛盾，会标出来' : '') + '。</p>' +
      '<p class="lk-note">这些只是建议。去“审核”里勾选，接受的才会写进知识页，并留下版本。</p>' +
      (AG.pendingCount([r]) ? '<div class="lk-bar"><span class="sp"></span><button type="button" class="lk-btn" data-act="open-run" data-id="' + esc(r.id) + '">去审核 ' + AG.pendingCount([r]) + ' 条建议</button></div>' : '');
  }
  function vizHtml(g) {
    var src = cache.sources[g.sourceId];
    if (!src || !g.traces || !g.traces.length) return '';
    var pi = Math.min(g.piece || 0, g.traces.length - 1), t = g.traces[pi], stage = Math.max(0, Math.min(STAGES.length - 1, g.stage || 0));
    return '<div class="lk-viz" id="lk-viz"><ol class="lk-steps" aria-label="整理的步骤">' + STAGES.map(function (name, i) {
        return '<li><button type="button" data-act="viz-stage" data-i="' + i + '"' + (i === stage ? ' aria-current="step"' : '') + (i < stage ? ' class="past"' : '') + '><b>' + (i + 1) + '</b>' + name + '</button></li>';
      }).join('') + '</ol>' +
      '<div class="lk-viz-body"><div class="lk-viz-text st' + stage + '" tabindex="0" aria-label="原文">' + vizText(src, t, stage) + '</div><div class="lk-viz-side" aria-live="polite"><h3>' + (stage + 1) + ' · ' + STAGES[stage] + '</h3>' + vizSide(g, src, t, stage) + '</div></div>' +
      '<div class="lk-bar">' + (g.traces.length > 1 ? '<button type="button" class="lk-btn ghost" data-act="viz-piece" data-d="-1"' + (pi ? '' : ' disabled') + '>‹</button><span class="lk-note">第 ' + (pi + 1) + ' / ' + g.traces.length + ' 段</span><button type="button" class="lk-btn ghost" data-act="viz-piece" data-d="1"' + (pi < g.traces.length - 1 ? '' : ' disabled') + '>›</button>' : '') +
      '<span class="sp"></span><button type="button" class="lk-btn ghost" data-act="viz-play">' + (g.playing ? '暂停' : '重播') + '</button><button type="button" class="lk-btn ghost" data-act="viz-stage" data-i="' + (stage - 1) + '"' + (stage ? '' : ' disabled') + '>上一步</button><button type="button" class="lk-btn ghost" data-act="viz-stage" data-i="' + (stage + 1) + '"' + (stage < STAGES.length - 1 ? '' : ' disabled') + '>下一步</button></div></div>';
  }
  function paintViz() { var el = $('lk-viz'), g = ui.ingest; if (el && g) el.outerHTML = vizHtml(g); }
  function vizPlay(g, from) {
    clearTimeout(g.timer); g.stage = from || 0; g.playing = true;
    if (window.matchMedia && window.matchMedia('(prefers-reduced-motion: reduce)').matches) { g.stage = STAGES.length - 1; g.playing = false; return paintViz(); }
    paintViz();
    (function tick() {
      g.timer = setTimeout(function () {
        if (ui.ingest !== g || !g.playing) return;
        if (g.stage >= STAGES.length - 1) { g.playing = false; return paintViz(); }
        g.stage++; paintViz(); tick();
      }, 1700);
    })();
  }
  function localPanel(g) {
    var body;
    if (g.running) body = '<p role="status">正在这台设备上整理…</p>';
    else if (g.result) {
      var r = g.result, n = AG.pendingCount([r]);
      body = '<p role="status">' + (r.status === 'review' ? '整理好了：有 ' + n + ' 条建议等你审核。下面是它一步一步怎么得出来的。' : r.status === 'empty' ? '没有新的内容：这份来源里的说法知识页里都已经有了。' : '没有整理成功。') + '</p>' +
        (r.errors && r.errors.length ? '<p class="lk-note" style="color:var(--bad)">' + r.errors.map(esc).join('<br>') + '</p>' : '') +
        '<div class="lk-bar"><span class="lk-note">全部在这台设备上完成 · 没有联网 · 同一份原文每次结果相同</span><span class="sp"></span><button type="button" class="lk-btn ghost" data-act="ingest-cancel">关闭</button>' +
        (r.status === 'review' ? '<button type="button" class="lk-btn" data-act="open-run" data-id="' + esc(r.id) + '">去审核</button>' : '') + '</div>';
    } else body = '<p>在这台设备上用算法整理这份来源（' + g.est.chars.toLocaleString() + ' 字，' + g.est.calls + ' 段）：' + STAGES.slice(0, 6).join(' → ') + '。</p>' +
      '<p class="lk-note">不联网，不调用 AI，不发送任何内容。它只会挑选和整理原文里已有的句子，不会改写，也不会推断；每一条都要你在“审核”里接受才会写入。</p>' +
      '<div class="lk-bar"><span class="sp"></span><button type="button" class="lk-btn ghost" data-act="ingest-cancel">取消</button><button type="button" class="lk-btn" data-act="ingest-start">开始整理</button></div>';
    return '<div class="lk-report lk-ingest"><b>本机整理这份来源</b>' + body + '</div>' + (g.result ? vizHtml(g) : '');
  }
  // the walk-through: the example source in, organised on the device, every step drawn
  function runDemo() {
    if (!DEMO || !L || !guard()) return;
    IM.importAll(store, [{ text: DEMO.text, title: DEMO.title, url: DEMO.url }], { via: 'living-knowledge' }).then(function (rep) {
      var s = rep.added[0] || (rep.duplicates[0] && rep.duplicates[0].source);
      if (!s) return toast('示例没有导入成功' + (rep.errors[0] ? '：' + rep.errors[0] : ''));
      ui.tab = 'sources'; lsSet(TAB_KEY, 'sources'); ui.sel.sources = s.id; ui.imp = null; ui.edit = false; ui.draft = null; ui.dirty = false; ui.q = '';
      return store.permissions().then(function (perms) {
        ui.ingest = { sourceId: s.id, perms: perms, est: AG.estimate([s], perms), local: true };
        return render();
      }).then(function () { window.scrollTo(0, 0); startIngest(); });
    }, function (e) { toast('示例没有导入成功：' + (e && e.message || e)); });
  }

  // ---------------------------------------------------------------- review: what was proposed
  var ITEM_NAMES = { claim: '新说法', support: '为已有说法补充出处', relation: '关系', page: '新页面' };
  var REL_NAMES = { related: '相关', part_of: '是…的一部分', person_event: '人物—事件', project_decision: '项目—决策', topic_point: '主题—要点', supports: '支持', contradicts: '反驳', derived_from: '来自', applied_to: '应用于', evolved_from: '演变自' };
  function paintReviewCount() {
    if (!store || !AG) return;
    Promise.all([store.list('run'), store.list('relation')]).then(function (r) { var n = AG.pendingCount(r[0]) + (KL ? KL.pendingCount(r[1]) : 0), b = $('lk-rcount'); b.hidden = !n; b.textContent = n; });
  }
  function defaultChoice(it) {
    if (it.type === 'claim') return it.claim.origin === 'verified';
    if (it.type === 'relation') return it.relation.origin === 'verified';
    return true;
  }
  function renderReview() {
    return Promise.all([store.list('run'), store.list('source'), store.list('page'), store.list('relation')]).then(function (r) {
      var rels = r[3], waiting = KL ? KL.pendingCount(rels) : 0;
      var runs = r[0].sort(function (a, b) { return (b.startedAt || 0) - (a.startedAt || 0); });
      cache.sources = {}; r[1].forEach(function (s) { cache.sources[s.id] = s; });
      cache.pages = {}; r[2].forEach(function (p) { cache.pages[p.id] = p; });
      // ui.run: null = not chosen yet (the first one with something to review opens), '' = the list on purpose
      var cur = ui.run && ui.run !== 'links' ? runs.filter(function (x) { return x.id === ui.run; })[0] || null : ui.run === null ? runs.filter(function (x) { return AG.pendingCount([x]); })[0] || null : null;
      if (cur && ui.run !== cur.id) { ui.run = cur.id; ui.choice = {}; }
      if (ui.run === null && !cur && waiting) ui.run = 'links';
      var links = KL && ui.run === 'links';
      var items = runs.filter(function (x) { return matches(ui.q, [x.scope.sourceIds.map(function (id) { return (cache.sources[id] || {}).title; }).join(' ')]); }).map(function (x) {
        var n = AG.pendingCount([x]);
        return { id: x.id, title: x.scope.sourceIds.map(function (id) { return (cache.sources[id] || {}).title || id; }).join('、'), sub: when(x.startedAt) + ' · ' + (n ? n + ' 条待审核' : x.status === 'done' ? '已审核' : x.status === 'empty' ? '没有新内容' : x.status === 'failed' ? '失败' : '已处理') };
      });
      if (KL) items.unshift({ id: 'links', title: '知识关联', sub: waiting ? waiting + ' 条待确认' : '找出页面之间的联系' });
      var right = links ? linkView(rels) : cur ? runView(cur) : '<section class="lk-card lk-ed"><p class="lk-empty">整理来源后，建议会出现在这里。<br>每一条都要你接受才会写进知识页；没接受的不会有任何影响。</p></section>';
      main.innerHTML = '<div class="lk-split' + (cur || links ? ' editing' : '') + '">' + sideList(items, links ? 'links' : cur && cur.id, '搜索整理记录', '') + right + '</div>';
    });
  }
  function runView(run) {
    var ch = ui.choice || (ui.choice = {});
    var pending = 0;
    var groups = run.proposals.map(function (g) {
      var rows = g.items.map(function (it) {
        var on = it.status === 'pending' ? (it.key in ch ? ch[it.key] : defaultChoice(it)) : null;
        if (it.status === 'pending') pending++;
        var what, ev = null;
        if (it.type === 'claim') { what = esc(it.claim.text) + ' <span class="lk-badge">' + esc(CLAIM_KINDS[it.claim.kind] || it.claim.kind) + '</span>' + (it.claim.origin === 'ai_inferred' ? ' <span class="lk-badge ai">AI 推断 · 无出处</span>' : '') + ' <span class="lk-note">把握 ' + Math.round((it.claim.confidence || 0) * 100) + '%</span>'; ev = it.claim.sources[0]; }
        else if (it.type === 'support') { what = '“' + esc(it.claimText) + '”'; ev = it.source; }
        else if (it.type === 'relation') { what = esc(it.relation.fromTitle) + ' —' + esc(REL_NAMES[it.relation.type] || it.relation.type) + '→ ' + esc(it.relation.toTitle) + (it.relation.origin === 'ai_inferred' ? ' <span class="lk-badge ai">AI 推断</span>' : ''); ev = it.relation.evidence[0]; }
        else what = '新建这一页' + (g.summary ? '：' + esc(g.summary) : '');
        var state = it.status === 'pending' ? '<input type="checkbox" data-pick="' + esc(it.key) + '"' + (on ? ' checked' : '') + ' aria-label="接受：' + esc(ITEM_NAMES[it.type]) + '">' : '<span class="lk-badge ' + (it.status === 'accepted' ? 'Confirmed' : 'Rejected') + '">' + (it.status === 'accepted' ? '已接受' : '已拒绝') + '</span>';
        return '<li class="lk-pi' + (it.status !== 'pending' ? ' done' : '') + '"><label>' + state + '<span><small class="lk-note">' + ITEM_NAMES[it.type] + '</small> ' + what +
          (it.conflict ? '<span class="lk-conf">⚠️ 与“' + esc(it.conflict.text) + '”矛盾' + (it.conflict.why ? '：' + esc(it.conflict.why) : '') + '。接受后两条都保留，并互相标出。</span>' : '') +
          (ev ? '<span class="lk-srcs"><button type="button" class="lk-q" data-act="open-src" data-id="' + esc(ev.sourceId) + '">原文：“' + esc(ev.quote) + '”</button></span>' : '') + '</span></label></li>';
      }).join('');
      return '<div class="lk-pg"><div class="lk-bar"><b>' + esc(g.title) + '</b><span class="lk-badge">' + (g.isNew ? '新页面' : '已有页面') + '</span>' +
        (!g.isNew && cache.pages[g.pageId] && cache.pages[g.pageId].lockedBy === 'user' ? '<span class="lk-lock">🔒 你锁定的页面：只有你接受的才会写入</span>' : '') + '</div><ul>' + rows + '</ul></div>';
    }).join('');
    return '<section class="lk-card lk-ed"><div class="lk-bar"><button type="button" class="lk-btn ghost lk-only-narrow" data-act="back">‹ 列表</button><b>' + (run.engine === 'local' ? '本机整理建议' : 'AI 整理建议') + '</b><span class="lk-note">' + esc(when(run.startedAt)) + ' · ' + (run.engine === 'local' ? '本机整理 ' : '发送 ') + run.used.calls + ' 段' +
      (run.used.input ? ' · 约 ' + (run.used.input + run.used.output) + ' token' : '') + (run.limited ? ' · 到了上限' : '') + (run.stopped ? ' · 中途停止' : '') + (run.truncated ? ' · 建议太多，已截短' : '') + '</span></div>' +
      (run.errors && run.errors.length ? '<p class="lk-note" style="color:var(--bad)">' + run.errors.map(esc).join('<br>') + '</p>' : '') +
      '<p class="lk-note">勾选的会以你的名义写进知识页（留下新版本，可以恢复）。' + (run.engine === 'local' ? '本机整理的每一条都是原文里的句子，点“原文”可以回到出处。' : '默认只勾了有原文出处的；“AI 推断”没有出处，要你自己判断。') + '</p>' +
      (groups || '<p class="lk-empty">没有建议</p>') +
      (pending ? '<div class="lk-bar lk-sticky"><span class="lk-note">还有 ' + pending + ' 条待审核</span><span class="sp"></span><button type="button" class="lk-btn ghost" data-act="review-reject-all">全部拒绝</button><button type="button" class="lk-btn ghost" data-act="review-accept">接受勾选的</button><button type="button" class="lk-btn" data-act="review-accept-close">接受勾选的，其余拒绝</button></div>' : '') + '</section>';
  }
  function submitReview(mode) {
    var run = ui.run; if (!run) return;
    store.get('run', run).then(function (r) {
      var choice = {};
      r.proposals.forEach(function (g) { g.items.forEach(function (it) {
        if (it.status !== 'pending') return;
        var on = mode === 'reject' ? false : (it.key in ui.choice ? ui.choice[it.key] : defaultChoice(it));
        if (on) choice[it.key] = true; else if (mode !== 'accept') choice[it.key] = false;
      }); });
      return AG.apply(store, run, choice);
    }).then(function (rep) {
      ui.choice = {};
      toast((rep.claims ? '新增 ' + rep.claims + ' 条说法 · ' : '') + (rep.supports ? rep.supports + ' 条补充出处 · ' : '') + (rep.pages ? rep.pages + ' 个新页面 · ' : '') + (rep.relations ? rep.relations + ' 个关系 · ' : '') + (rep.rejected ? '拒绝 ' + rep.rejected + ' 条' : '') + (rep.errors.length ? ' · ' + rep.errors.length + ' 条没写成：' + rep.errors[0] : ''));
      render();
    }, function (e) { toast('没有处理成功：' + (e && e.message || e)); });
  }

  // ---------------------------------------------------------------- semantic linking: links between pages, each with its reason
  var KL = window.MinestLKLink;
  function linkRow(r) {
    var st = M.relationStatus(r);
    var name = function (id) { var p = cache.pages[id]; return p ? '<button type="button" class="lk-q" data-act="open-page" data-id="' + esc(id) + '">' + esc(p.title) + '</button>' : '<span class="lk-q">' + esc(id) + '</span>'; };
    var badges = (st === 'suggested' ? '<span class="lk-badge ai">' + (r.engine === 'local' ? '本机发现' : 'AI 推断') + '</span>' : r.origin === 'ai_inferred' && st === 'confirmed' && r.explanation ? '<span class="lk-badge Confirmed">你确认的</span>' : '') +
      (r.confidence != null ? '<span class="lk-note">把握 ' + Math.round(r.confidence * 100) + '%</span>' : '') +
      (r.downgraded ? '<span class="lk-note">页面里没有说明是哪一种关系，所以只标为“相关”</span>' : '');
    var quotes = (r.evidence || []).map(function (e) {
      return e.pageId ? '<button type="button" class="lk-q" data-act="open-page" data-id="' + esc(e.pageId) + '">' + esc((cache.pages[e.pageId] || {}).title || '') + '：“' + esc(e.quote) + '”</button>'
        : e.sourceId ? '<button type="button" class="lk-q" data-act="open-src" data-id="' + esc(e.sourceId) + '">原文：“' + esc(e.quote) + '”</button>' : '';
    }).join('');
    var id = ' data-id="' + esc(r.id) + '"';
    var buttons = st === 'suggested' ? '<button type="button" class="lk-btn ghost" data-act="link-reject"' + id + '>否决</button><button type="button" class="lk-btn" data-act="link-confirm"' + id + '>确认</button>'
      : st === 'confirmed' ? '<button type="button" class="lk-btn ghost" data-act="link-reject"' + id + '>改为否决</button>'
      : '<button type="button" class="lk-btn ghost" data-act="link-restore"' + id + '>恢复为待确认</button>';
    return '<li class="lk-lk ' + st + '"><div class="lk-bar">' + name(r.from) + '<span class="lk-rel">' + esc(REL_NAMES[r.type] || r.type) + ' →</span>' + name(r.to) + badges + '</div>' +
      (r.explanation ? '<p>' + esc(r.explanation) + '</p>' : '') + (quotes ? '<span class="lk-srcs">' + quotes + '</span>' : (st === 'suggested' ? '<p class="lk-note">没有可以逐字核对的出处，需要你自己判断。</p>' : '')) +
      '<div class="lk-bar"><span class="sp"></span>' + buttons + '</div></li>';
  }
  function linkView(rels) {
    var g = ui.link, by = { suggested: [], confirmed: [], rejected: [] };
    rels.forEach(function (r) { by[M.relationStatus(r)].push(r); });
    by.suggested.sort(function (a, b) { return (b.confidence || 0) - (a.confidence || 0); });
    by.confirmed.sort(function (a, b) { return (b.updatedAt || 0) - (a.updatedAt || 0); }); by.rejected.sort(function (a, b) { return (b.updatedAt || 0) - (a.updatedAt || 0); });
    var status = '';
    if (g && g.running) status = '<p role="status"><span id="lk-link-prog">' + (g.local ? '正在这台设备上比较页面…' : '正在请 Minest AI 判断…') + '</span> <button type="button" class="lk-btn ghost" data-act="link-stop">停止</button></p>';
    else if (g && g.error) status = '<p role="status" style="color:var(--bad)">' + esc(g.error.message || g.error) + '</p>' + (g.error.code === 'ai-not-allowed' ? '<div class="lk-bar"><button type="button" class="lk-btn ghost" data-act="go-perms">去“权限”</button></div>' : '');
    else if (g && g.rep) {
      var p = g.rep;
      status = '<p role="status">' + (p.status === 'review' ? '找到 ' + p.suggested.length + ' 条可能的关联，在下面等你确认。' : p.status === 'stopped' ? '已停止。' : p.status === 'failed' ? '没有查找成功。' : !p.candidates ? '没有新的候选：在还没有关联的页面之间，没找到互相提到、共有少见的词或来自同一份来源的。' : '比较了 ' + p.judged + ' 对页面，没有发现值得保留的关联。') +
        ' <span class="lk-note">' + (p.engine === 'local' ? '本机 · 没有联网' : '发送 ' + p.calls + ' 次' + (p.used.input ? ' · 约 ' + (p.used.input + p.used.output) + ' token' : '')) + ' · 候选 ' + p.candidates + ' 对' + (p.none ? ' · ' + p.none + ' 对判断为没有关联（页面不变就不再比较）' : '') + '</span></p>' +
        (p.errors.length ? '<p class="lk-note" style="color:var(--bad)">' + p.errors.map(esc).join('<br>') + '</p>' : '');
    }
    var list = function (title, rows, note, open) {
      return rows.length ? '<details class="lk-lks"' + (open ? ' open' : '') + '><summary><b>' + title + '</b> <span class="lk-note">' + rows.length + ' 条' + (note ? ' · ' + note : '') + '</span></summary><ul>' + rows.slice(0, 100).map(linkRow).join('') + '</ul>' + (rows.length > 100 ? '<p class="lk-note">只显示最近 100 条</p>' : '') + '</details>' : '';
    };
    var busy = g && g.running ? ' disabled' : '';
    return '<section class="lk-card lk-ed"><div class="lk-bar"><button type="button" class="lk-btn ghost lk-only-narrow" data-act="back">‹ 列表</button><b>知识关联</b><span class="sp"></span>' +
      '<button type="button" class="lk-btn ghost" data-act="link-run" data-engine="local"' + busy + '>在本机查找</button><button type="button" class="lk-btn" data-act="link-run" data-engine="cloud"' + busy + '>用 Minest AI 查找</button></div>' +
      '<p class="lk-note">先在这台设备上挑出可能有关的页面（互相提到、共有少见的词、同一份来源），这一步不联网。“在本机查找”只提出能逐字指给你看的关联；“用 Minest AI 查找”把每一对的标题、开头和几条说法发给 Minest AI，由它判断关系的类型并写出理由。' +
      '每一页最多 ' + KL.PER_NODE + ' 条待确认的建议。确认之前，它们不会出现在图谱里。</p>' + status +
      (list('待确认', by.suggested, '', true) + list('已确认', by.confirmed, '', !by.suggested.length) + list('已否决', by.rejected, '保留在这里，不会再被提出', false) ||
        '<p class="lk-empty">还没有关联。<br>有两页以上的知识页后，点上面的按钮查找。</p>') + '</section>';
  }
  function startLink(local) {
    if (!KL || (ui.link && ui.link.running)) return;
    var g = ui.link = { running: true, local: local, ctl: new AbortController() };
    render();
    KL.suggest(store, { transport: transport, local: local, signal: g.ctl.signal, onProgress: function (p) { var el = $('lk-link-prog'); if (el) el.textContent = (local ? '正在这台设备上比较页面… ' : '正在请 Minest AI 判断… ') + p.done + ' / ' + p.total + ' 对'; } })
      .then(function (rep) { g.rep = rep; }, function (e) { g.error = e; })
      .then(function () { g.running = false; paintReviewCount(); if (ui.tab === 'review' && ui.run === 'links') render(); });
  }
  function decideLink(id, to) {
    KL.decide(store, id, to).then(function (w) {
      if (!w.ok) toast('没有保存：' + w.error); else toast(to === 'confirmed' ? '已确认，现在是图谱里的一条线' : to === 'rejected' ? '已否决，不会再被提出' : '已恢复为待确认');
      paintReviewCount(); render();
    }, function (e) { toast('没有保存：' + (e && e.message || e)); });
  }

  // ---------------------------------------------------------------- permissions
  function renderPerms() {
    return store.permissions().then(function (p) {
      main.innerHTML = '<section class="lk-card lk-block"><h2>谁可以读写活知识</h2><p class="lk-note">Minest 的其他部分以后通过同一个接口读取或写入。除了活知识本身，其他模块写入时都按“AI / 自动”对待：不能改已确认的决策、不能改锁定的页面、不能改原始来源。</p>' +
        '<table class="lk-perm"><thead><tr><th>模块</th><th class="c">读取</th><th class="c">写入</th></tr></thead><tbody>' +
        M.MODULES.map(function (m) {
          var x = (p.modules || {})[m] || {}, self = m === 'living-knowledge';
          return '<tr><td>' + esc(MODULE_NAMES[m] || m) + '</td><td class="c"><input type="checkbox" data-perm="' + m + '" data-a="read"' + (x.read ? ' checked' : '') + (self ? ' disabled' : '') + ' aria-label="' + esc(MODULE_NAMES[m]) + ' 读取"></td>' +
            '<td class="c"><input type="checkbox" data-perm="' + m + '" data-a="write"' + (x.write ? ' checked' : '') + (self ? ' disabled' : '') + ' aria-label="' + esc(MODULE_NAMES[m]) + ' 写入"></td></tr>';
        }).join('') + '</tbody></table>' +
        '<h2 style="margin-top:8px">整理 · 问答 · 起草：用哪种引擎</h2>' +
        '<label class="lk-check"><input type="radio" name="lk-engine" value="local"' + (isLocal() ? ' checked' : '') + '> <span><b>本机算法（默认）</b>：全部在这台设备上完成，不联网，不发送任何内容。只挑选和整理原文里的句子，不会改写、归纳或翻译。</span></label>' +
        '<label class="lk-check"><input type="radio" name="lk-engine" value="cloud"' + (isLocal() ? '' : ' checked') + '> <span><b>Minest AI（云端模型）</b>：能改写、归纳和跨语言，但要把内容发出去，需要下面的许可。</span></label>' +
        '<h2 style="margin-top:8px">Minest AI 的许可（只在选了云端模型时用到）</h2>' +
        '<label class="lk-check"><input type="checkbox" id="lk-allow-ai"' + (p.allowAI ? ' checked' : '') + '> 允许把我选中的内容发给 Minest AI：整理来源、回答问题（问 AI）、起草页面正文</label>' +
        '<p class="lk-note">整理：只在你点“让 AI 整理”时发送那一份来源（分段）和知识页的标题、已有说法的列表；每一条建议都要你在“审核”里接受才会写入。问 AI：相关的页面先在这台设备上找出来，只发送那几页的标题、摘要和说法；回答不会自动写入。起草正文：只发送那一页的说法和其他页面的标题；得到的是草稿，你保存才成为新的一版。Minest AI 用的是你在 Vercel 上配置的模型服务。</p>' +
        '<div class="lk-meta"><label>每次整理最多发送几段（每段约 6 000 字）<input type="number" id="lk-max-calls" min="1" max="60" value="' + esc(p.maxCallsPerRun || 12) + '"></label>' +
        '<label>每段回答最多多少 token<input type="number" id="lk-max-tokens" min="500" max="6000" step="500" value="' + esc(p.maxTokensPerCall || 3000) + '"></label></div>' +
        '<div class="lk-bar"><span class="lk-note">' + (p.rev ? '第 ' + p.rev + ' 版 · ' + esc(when(p.updatedAt)) : '默认：只有活知识本身可以读写；AI 整理关闭') + '</span><span class="sp"></span><button type="button" class="lk-btn" data-act="save-perms">保存权限</button></div></section>';
    });
  }

  // ================================================================== events
  document.querySelector('.lk-tabs').addEventListener('click', function (e) { var b = e.target.closest('[data-tab]'); if (b) setTab(b.dataset.tab); });
  main.addEventListener('input', function (e) {
    var t = e.target;
    if (t.id === 'lk-q') { ui.q = t.value; var pos = t.selectionStart; render().then(function () { var q = $('lk-q'); if (q) { q.focus(); try { q.setSelectionRange(pos, pos); } catch (x) {} } }); return; }
    if (t.dataset.imp && ui.imp && t.dataset.imp !== 'bid') {
      ui.imp[t.dataset.imp] = t.value;
      if (t.dataset.imp === 'text') { var pb = main.querySelector('[data-act="imp-paste"]'); if (pb) pb.disabled = !t.value.trim(); }
      if (t.dataset.imp === 'cq') { var pos2 = t.selectionStart; render().then(function () { var q2 = main.querySelector('[data-imp="cq"]'); if (q2) { q2.focus(); try { q2.setSelectionRange(pos2, pos2); } catch (x) {} } }); }
      return;
    }
    if (t.dataset.f && ui.draft) { ui.draft[t.dataset.f] = t.type === 'checkbox' ? t.checked : t.value; ui.dirty = true; if (t.dataset.f === 'title' && !ui.draft.baseRev) { var n = t.closest('.lk-ed').querySelector('.lk-bar .lk-note'); if (n) n.textContent = t.value.trim() ? 'id：' + M.pageId(t.value) : ''; } }
  });
  main.addEventListener('change', function (e) {
    var t = e.target;
    if (t.dataset.f && ui.draft && t.type === 'checkbox') { ui.draft[t.dataset.f] = t.checked; ui.dirty = true; }
    if (t.id === 'lk-file') { readFiles(t.files); t.value = ''; }
    if (t.dataset.card && ui.imp) { ui.imp.picked[t.dataset.card] = t.checked; var n = Object.keys(ui.imp.picked).filter(function (k) { return ui.imp.picked[k]; }).length, b = main.querySelector('[data-act="imp-cards"]'); if (b) { b.disabled = !n; b.textContent = '导入所选 ' + n + ' 张'; } }
    if (t.dataset.imp === 'bid' && ui.imp) { ui.imp.bid = t.value; render(); }
    if (t.dataset.pick) { ui.choice[t.dataset.pick] = t.checked; }
  });
  // files dropped anywhere on the import panel
  main.addEventListener('dragover', function (e) { if (ui.imp && e.dataTransfer && Array.prototype.indexOf.call(e.dataTransfer.types || [], 'Files') >= 0) { e.preventDefault(); var d = $('lk-drop'); if (d) d.classList.add('over'); } });
  main.addEventListener('dragleave', function (e) { var d = $('lk-drop'); if (d && !main.contains(e.relatedTarget)) d.classList.remove('over'); });
  main.addEventListener('drop', function (e) { if (!ui.imp) return; e.preventDefault(); var d = $('lk-drop'); if (d) d.classList.remove('over'); readFiles(e.dataTransfer && e.dataTransfer.files); });
  main.addEventListener('click', function (e) {
    var a = e.target.closest('[data-act]'); if (!a) return;
    var act = a.dataset.act, tab = ui.tab, key = tab === 'pages' ? 'pages' : tab === 'decisions' ? 'decisions' : 'sources';
    if (act === 'wiki') {
      e.preventDefault(); if (!guard()) return;
      var id = a.dataset.id; ui.tab = 'pages'; ui.edit = false; ui.draft = null; ui.dirty = false; ui.hist = null;
      if (cache.pages[id]) { ui.sel.pages = id; render(); } else { ui.sel.pages = null; startPage(null, a.dataset.title); }
      return;
    }
    if (act === 'gview') { lsSet(GVIEW_KEY, a.dataset.v); render(); return; }
    if (act === 'go') {
      if (!guard()) return;
      var dest = a.dataset.to; ui.tab = dest; lsSet(TAB_KEY, dest); ui.edit = false; ui.draft = null; ui.dirty = false; ui.hist = null; ui.imp = null; ui.q = '';
      if (a.dataset.id) ui.sel[dest] = a.dataset.id;
      if (dest === 'review') ui.run = null;
      render(); window.scrollTo({ top: 0, behavior: 'smooth' }); return;
    }
    if (act === 'open' && tab === 'review') { ui.run = a.dataset.id; ui.choice = {}; render(); return; }
    if (act === 'back' && tab === 'review') { ui.run = ''; render(); return; }
    if (act === 'ingest-plan') {
      var sid = ui.sel.sources;
      store.permissions().then(function (perms) { ui.ingest = { sourceId: sid, perms: perms, est: AG.estimate([cache.sources[sid]], perms), local: isLocal() }; render(); });
      return;
    }
    if (act === 'ingest-start') { startIngest(); return; }
    if (act === 'ingest-stop') { if (ui.ingest && ui.ingest.ctl) ui.ingest.ctl.abort(); return; }
    if (act === 'ingest-cancel') { if (ui.ingest && ui.ingest.running) return; if (ui.ingest) clearTimeout(ui.ingest.timer); ui.ingest = null; render(); return; }
    if (act === 'demo') { runDemo(); return; }
    if (act === 'demo-ask') { $('lk-ask-q').value = a.dataset.q; askAI(a.dataset.q); window.scrollTo({ top: 0, behavior: 'smooth' }); return; }
    if (act === 'viz-stage' || act === 'viz-piece' || act === 'viz-play') {
      var vg = ui.ingest; if (!vg || !vg.traces) return;
      if (act === 'viz-play') { if (vg.playing) { vg.playing = false; clearTimeout(vg.timer); paintViz(); } else vizPlay(vg, vg.stage >= STAGES.length - 1 ? 0 : vg.stage); }
      else { vg.playing = false; clearTimeout(vg.timer); if (act === 'viz-stage') vg.stage = +a.dataset.i; else vg.piece = Math.max(0, Math.min(vg.traces.length - 1, (vg.piece || 0) + (+a.dataset.d))); paintViz(); }
      var vb = main.querySelector(act === 'viz-play' ? '#lk-viz [data-act="viz-play"]' : '#lk-viz .lk-steps [aria-current="step"]'); if (vb) vb.focus({ preventScroll: true });
      return;
    }
    if (act === 'go-perms') { ui.ingest = null; setTab('perms'); return; }
    if (act === 'open-run') { if (ui.ingest) clearTimeout(ui.ingest.timer); ui.ingest = null; ui.run = a.dataset.id; ui.choice = {}; setTab('review'); return; }
    if (act === 'link-run') { startLink(a.dataset.engine === 'local'); return; }
    if (act === 'link-stop') { if (ui.link && ui.link.ctl) ui.link.ctl.abort(); return; }
    if (act === 'link-confirm' || act === 'link-reject' || act === 'link-restore') { decideLink(a.dataset.id, act === 'link-confirm' ? 'confirmed' : act === 'link-reject' ? 'rejected' : 'suggested'); return; }
    if (act === 'review-accept' || act === 'review-accept-close') { submitReview(act === 'review-accept' ? 'accept' : 'close'); return; }
    if (act === 'review-reject-all') { if (confirm('拒绝这次整理里所有还没处理的建议？')) submitReview('reject'); return; }
    if (act === 'open') { if (!guard()) return; ui.sel[key] = a.dataset.id; ui.edit = false; ui.draft = null; ui.dirty = false; ui.hist = null; ui.showRev = null; ui.imp = null; render(); return; }
    if (act === 'back') { ui.sel[key] = null; ui.hist = null; ui.imp = null; render(); return; }
    if (act === 'new') {
      if (!guard()) return;
      if (tab === 'sources') { ui.imp = ui.imp || { title: '', url: '', text: '', cards: null, bid: '', cq: '', picked: {}, report: null }; render(); return; }
      ui.sel[key] = null; if (tab === 'pages') startPage(null); else startDecision(null); return;
    }
    if (act === 'open-src' || act === 'open-page') {
      if (!guard()) return;
      var to = act === 'open-src' ? 'sources' : 'pages';
      ui.tab = to; lsSet(TAB_KEY, to); ui.sel[to] = a.dataset.id; ui.imp = null; ui.edit = false; ui.draft = null; ui.dirty = false; ui.hist = null; ui.q = '';
      render(); return;
    }
    if (act === 'src-page') {
      var src = cache.sources[ui.sel.sources]; if (!src) return;
      var dr = IM.pageDraftFromSource(src), pid = M.pageId(dr.title);
      ui.tab = 'pages'; lsSet(TAB_KEY, 'pages'); ui.q = '';
      store.get('page', pid).then(function (ex) {
        if (ex) { ui.sel.pages = pid; ui.edit = false; render(); toast('已经有“' + ex.title + '”这一页了，已为你打开；可以编辑它，把这份来源的内容加进去'); return; }
        ui.sel.pages = null; startPage(null, dr.title, dr);
      });
      return;
    }
    if (act === 'imp-close') { ui.imp = null; render(); return; }
    if (act === 'pick') { var fi = $('lk-file'); if (fi) fi.click(); return; }
    if (act === 'imp-paste') {
      var x = ui.imp; if (!x.text.trim()) return;
      runImport([{ text: x.text, title: x.title.trim(), url: x.url.trim() }], function (rep) { if (!rep.errors.length) { x.text = ''; x.title = ''; x.url = ''; } });
      return;
    }
    if (act === 'imp-boards') { ui.imp.cards = IM.listCards(readBoards()); render(); return; }
    if (act === 'imp-all-shown') {
      var y = ui.imp; y.cards.filter(function (c) { return (!y.bid || c.bid === y.bid) && matches(y.cq, [c.title, c.list]); }).slice(0, 300).forEach(function (c) { y.picked[c.bid + '|' + c.cardId] = true; });
      render(); return;
    }
    if (act === 'imp-cards') {
      var z = ui.imp, chosen = z.cards.filter(function (c) { return z.picked[c.bid + '|' + c.cardId]; });
      runImport(chosen.map(IM.cardInput), function () { z.picked = {}; });
      return;
    }
    if (act === 'compose') { composePage(); return; }
    if (act === 'edit') { if (tab === 'pages') startPage(cache.pages[ui.sel.pages]); else startDecision(dcache[ui.sel.decisions]); return; }
    if (act === 'cancel') { if (!guard()) return; ui.edit = false; ui.draft = null; ui.dirty = false; render(); return; }
    if (act === 'save') { if (tab === 'pages') savePage(); else saveDecision(); return; }
    if (act === 'hist' || act === 'hist-close') {
      if (act === 'hist-close') { ui.hist = null; render(); return; }
      var k = tab === 'pages' ? 'page' : 'decision';
      store.versions(k, ui.sel[key]).then(function (vs) { ui.hist = vs; ui.showRev = null; render(); });
      return;
    }
    if (act === 'show-rev') { var r = +a.dataset.rev; ui.showRev = ui.showRev === r ? null : r; render(); return; }
    if (act === 'restore') {
      var rev = +a.dataset.rev, kind = tab === 'pages' ? 'page' : 'decision';
      if (!confirm('把第 ' + rev + ' 版的内容写成新的一版？现在的内容也会留在历史里。')) return;
      store.restore(kind, ui.sel[key], rev).then(function (res) {
        if (!res.ok) return toast('恢复失败：' + res.error);
        toast(res.noop ? '内容和现在一样，不需要恢复' : '已恢复为第 ' + res.doc.rev + ' 版');
        return store.versions(kind, ui.sel[key]).then(function (vs) { ui.hist = vs; ui.showRev = null; render(); });
      });
      return;
    }
    if (act === 'keep-mine' || act === 'keep-theirs') {
      store.resolve(a.dataset.kind, a.dataset.id, act === 'keep-mine' ? 'mine' : 'theirs').then(function (res) { if (res && res.ok === false) toast('没处理成功：' + res.error); else toast('已处理'); render(); paintStatus(); });
      return;
    }
    if (act === 'save-perms') {
      store.permissions().then(function (p) {
        p = M.clone(p);
        main.querySelectorAll('[data-perm]').forEach(function (c) { var m = c.dataset.perm; p.modules[m] = p.modules[m] || {}; p.modules[m][c.dataset.a] = c.checked; });
        p.allowAI = $('lk-allow-ai').checked;
        var eng = main.querySelector('input[name="lk-engine"]:checked'); lsSet(ENGINE_KEY, eng && eng.value === 'cloud' ? 'cloud' : null);
        p.maxCallsPerRun = Math.max(1, Math.min(60, Math.round(+$('lk-max-calls').value || 12)));
        p.maxTokensPerCall = Math.max(500, Math.min(6000, Math.round(+$('lk-max-tokens').value || 3000)));
        return store.savePermissions(p);
      }).then(function (res) { toast(res.ok ? (res.noop ? '已保存' : '权限已保存') : '保存失败：' + res.error); render(); });
    }
  });
  $('lk-ask').addEventListener('submit', function (e) { e.preventDefault(); var i = $('lk-ask-q'); ask(i.value); i.value = ''; i.blur(); });
  $('lk-ask-ai').addEventListener('click', function () { var i = $('lk-ask-q'); askAI(i.value); });
  $('lk-answer').addEventListener('click', function (e) {
    var b = e.target.closest('[data-ans]'); if (!b) return;
    var k = b.dataset.ans, qa = ui.qa;
    if (k === 'close') { if (qa && qa.ctl) try { qa.ctl.abort(); } catch (x) {} ui.qa = null; return paintAnswer(); }
    if (k === 'stop') { if (qa && qa.ctl) qa.ctl.abort(); else { ui.qa = null; paintAnswer(); } return; }
    if (k === 'ask') { $('lk-ask-q').value = b.dataset.q; return askAI(b.dataset.q); }
    if (!guard()) return;
    if (k === 'perms') { ui.dirty = false; return setTab('perms'); }
    if (k === 'page') return openPage(b.dataset.id);
    if (k === 'decision') { ui.tab = 'decisions'; ui.sel.decisions = b.dataset.id; ui.edit = false; ui.draft = null; ui.dirty = false; ui.hist = null; return render(); }
    if (k === 'import') { ui.dirty = false; ui.tab = 'sources'; ui.edit = false; ui.draft = null; ui.imp = { title: '', url: '', text: '', cards: null, bid: '', cq: '', picked: {}, report: null }; return render(); }
    if (k === 'new' || k === 'save') {
      ui.tab = 'pages'; lsSet(TAB_KEY, 'pages'); ui.sel.pages = null; ui.q = ''; ui.imp = null;
      if (k === 'new') return startPage(null, b.dataset.title);
      return startPage(null, qa.q.replace(/[?？。.!！]+$/, '').slice(0, 80), { type: 'note', markdown: AG.answerMarkdown(qa.a) });
    }
  });
  $('lk-ask-chips').addEventListener('click', function (e) {
    var b = e.target.closest('[data-chip]'); if (!b || !guard()) return;
    ui.tab = 'pages'; lsSet(TAB_KEY, 'pages'); ui.sel.pages = b.dataset.chip; ui.edit = false; ui.draft = null; ui.dirty = false; ui.hist = null; ui.imp = null; ui.q = '';
    render();
  });
  $('lk-sync').addEventListener('click', function () { if (!store) return; store.pull().then(function (n) { render(); toast(n ? '从云端取回 ' + n + ' 处更新' : '已和云端核对'); }); });
  $('lk-login').addEventListener('click', signIn);
  $('lk-export').addEventListener('click', function () {
    if (!store) return;
    store.exportZip().then(function (bytes) {
      var d = new Date(), name = 'living-knowledge-' + d.getFullYear() + ('0' + (d.getMonth() + 1)).slice(-2) + ('0' + d.getDate()).slice(-2) + '.zip';
      var url = URL.createObjectURL(new Blob([bytes], { type: 'application/zip' })), a = document.createElement('a');
      a.href = url; a.download = name; document.body.appendChild(a); a.click(); a.remove();
      setTimeout(function () { URL.revokeObjectURL(url); }, 4000);
      toast('已导出 ' + name);
    }, function (e) { toast('导出失败：' + (e && e.message || e)); });
  });
  window.addEventListener('beforeunload', function (e) { if (ui.dirty) { e.preventDefault(); e.returnValue = ''; } });
  window.addEventListener('online', function () { if (store && cloudOn) store.pull().then(function (n) { if (n) render(); }); });
  document.addEventListener('visibilitychange', function () { if (document.visibilityState === 'visible' && store && cloudOn && !ui.edit) store.pull().then(function (n) { if (n) render(); }); });

  // ================================================================== start: this device's last account first (works offline), then the sign-in
  openStore(lsGet(LAST_UID) || 'guest', null).then(startFirebase);
  window.MinestLivingKnowledge = { store: function () { return store; }, access: function (module) { return store && store.access(module); },
    // for Minest's Knowledge page, which shows this page inside itself
    go: function (tab) { if (!store || !guard()) return false; ui.dirty = false; if (ui.tab === tab) { ui.edit = false; ui.draft = null; render(); } else setTab(tab); window.scrollTo(0, 0); return true; },
    canLeave: function () { return guard(); },
    find: ask, ask: function (q) { $('lk-ask-q').value = q; askAI(q); window.scrollTo(0, 0); },
    stats: stats, setTheme: function (t) { if (t === 'light' || t === 'dark') document.documentElement.setAttribute('data-theme', t); else document.documentElement.removeAttribute('data-theme'); } };
})();

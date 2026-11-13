/* Minest · Spatial Home — Mochi and the EC–6 day (Living Objects, Phase 3).
   Mochi on the desk follows the day you already have. Every step is read from data that exists; nothing is made up:
     1 Morning Drive        GPT Study (minest.gptstudy.v1): a card was shown today (seenAt) — CarPlay, the phone or the widget
     2 ChatGPT report       GPT Study: a word got a mark from a pasted MINEST REPORT today (gptAt)
     3 Today's Big Three    the EC–6 board: today's three cards in your Kanban list, how many are complete
     4 Typing Worlds        Minest Knowledge (minest.knowledge.v1): a Typing Worlds entry saved today
                            ('typingworlds:entry:*', or the Type Workshop's 'mtw:item:*' where that build has it)
     5 Anchor Charts        the EC–6 board: today's five charts opened or crossed off
   How Mochi reminds you — gently:
     · no pop-ups, no sound, no timers on the screen: Mochi's own label in the room says the next step in a few words
       (and only for a step whose time has come: the report after 7:30, typing after 9:00 …);
     · tap Mochi: today's flow with what is done, one button for the next step, "稍后" (quiet for two hours) and
       "今天不提醒" (quiet until tomorrow); Liquid Routine's day card is still one tap away;
     · when everything is done, Mochi just says so. */
(function (root) {
  'use strict';
  var KEY = 'minest.mochi.v1';
  function pad(n) { return (n < 10 ? '0' : '') + n; }
  function today() { var d = new Date(); return d.getFullYear() + '-' + pad(d.getMonth() + 1) + '-' + pad(d.getDate()); }
  function dayStart() { var d = new Date(); d.setHours(0, 0, 0, 0); return d.getTime(); }
  function ls(k) { try { return JSON.parse(localStorage.getItem(k) || 'null'); } catch (e) { return null; } }
  function esc(s) { return String(s == null ? '' : s).replace(/[&<>"]/g, function (c) { return { '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;' }[c]; }); }
  function st() { var s = ls(KEY); if (!s || s.day !== today()) s = { day: today(), snooze: {}, quiet: false }; return s; }
  function put(s) { try { localStorage.setItem(KEY, JSON.stringify(s)); } catch (e) {} }
  function minutes() { var d = new Date(); return d.getHours() * 60 + d.getMinutes(); }

  /* ---------------------------------------------------------------- what the data says about today */
  function gptToday() {
    var g = ls('minest.gptstudy.v1'), t0 = dayStart(), seen = 0, report = 0;
    if (g && g.lists) Object.keys(g.lists).forEach(function (k) {
      var C = g.lists[k].cards || {};
      Object.keys(C).forEach(function (id) { var c = C[id]; if ((c.seenAt || 0) >= t0) seen++; if ((c.gptAt || 0) >= t0) report++; });
    });
    return { seen: seen, report: report };
  }
  function typedToday() {
    var k = ls('minest.knowledge.v1'), t0 = dayStart(), n = 0;
    var x = k && k.x; if (!x) return 0;
    Object.keys(x).forEach(function (key) {
      if (!/^typingworlds:entry:|^mtw:item:/.test(key)) return;
      var v = x[key] && (x[key].v || x[key]); if (!v || v.deleted) return;
      if ((v.createdAt || v.at || x[key].at || 0) >= t0) n++;
    });
    return n;
  }
  function board() { var E = root.SpatialEC6; return E && E._ ? E._ : null; }
  function steps() {
    var G = gptToday(), b = board(), B3 = b ? b.big3() : [], have = B3.filter(function (r) { return r.card; }).length,
      done3 = B3.filter(function (r) { return r.card && r.card.complete; }).length, charts = b ? chartsDone(b) : 0, typed = typedToday();
    return [
      { id: 'drive', icon: '🚗', label: 'Morning Drive · CarPlay 单词', done: G.seen > 0, info: G.seen ? '今天看过 ' + G.seen + ' 张' : '今天还没有看过', from: 0, until: 11 * 60, go: null },
      { id: 'report', icon: '📥', label: '导入 ChatGPT 学习报告', done: G.report > 0, info: G.report ? '已导入（' + G.report + ' 个词有标记）' : '还没有导入', from: 7 * 60 + 30, go: { feature: 'report' }, nudge: '导入今天的学习报告？' },
      { id: 'big3', icon: '✅', label: "Today's Big Three", done: have >= 3 && done3 >= 3, info: have ? done3 + ' / ' + have + ' 完成' + (have < 3 ? ' · 还可以再写 ' + (3 - have) + ' 件' : '') : '还没有写下今天的三件事', from: 7 * 60, go: { board: true },
        nudge: have < 3 ? (have ? 'Big Three 还差 ' + (3 - have) + ' 件' : '写下今天的 Big Three？') : '还有 ' + (3 - done3) + ' 件 Big Three' },
      { id: 'typing', icon: '⌨️', label: 'Typing Worlds', done: typed > 0, info: typed ? '今天录入了 ' + typed + ' 个' : '今天还没有打字', from: 9 * 60, go: { feature: 'typingworlds' }, nudge: '去 Typing Worlds 打几个词？' },
      { id: 'charts', icon: '📌', label: 'Anchor Charts', done: charts >= 5, info: charts + ' / 5 今天看过或已掌握', from: 9 * 60, go: { board: true }, nudge: charts ? '还有 ' + (5 - charts) + ' 张 Anchor Chart' : '看一张今天的 Anchor Chart？' }
    ];
  }
  function chartsDone(b) {
    var S = b.S(), d = today(), n = 0;
    ['ela', 'math', 'sci', 'ss', 'other'].forEach(function (s) { var id = S.picks[d] && S.picks[d][s]; if (id && (S.opened[d] && S.opened[d][id] || S.mastered.some(function (m) { return m.id === id && !m.undone; }))) n++; });
    return n;
  }
  /* the step to suggest now: the first one not done whose time has come, not snoozed; the drive is never nagged about */
  function next(all) {
    var s = st(), m = minutes(), now = Date.now();
    if (s.quiet) return null;
    return (all || steps()).filter(function (x) { return x.nudge && !x.done && m >= x.from && !(s.snooze[x.id] > now); })[0] || null;
  }
  function snooze(id, ms) { var s = st(); s.snooze[id] = Date.now() + (ms || 2 * 3600e3); put(s); }
  function quietToday() { var s = st(); s.quiet = true; put(s); }

  /* ---------------------------------------------------------------- Mochi's card (shown by the room) */
  function card() {
    var all = steps(), n = next(all), done = all.filter(function (x) { return x.done; }).length;
    var rows = all.map(function (x) {
      return '<div style="display:flex;gap:8px;align-items:baseline;padding:3px 0;' + (x.done ? 'opacity:.6' : '') + '"><span style="width:16px">' + (x.done ? '✓' : (n && n.id === x.id ? '›' : '·')) + '</span>' +
        '<span style="flex:1">' + x.icon + ' ' + esc(x.label) + '<br><small style="opacity:.7">' + esc(x.info) + '</small></span></div>';
    }).join('');
    var head = n ? '下一步：<b>' + esc(n.label) + '</b>' : (done === all.length ? '今天的流程都完成了 🎉' : '现在没有要提醒的。');
    var buttons = [];
    if (n) buttons.push({ label: n.icon + ' ' + n.label, cls: 'pri', go: n.go, step: n.id });
    buttons.push({ label: '🫧 今天的日程（Liquid Routine）', go: { routineCard: true } });
    if (n) buttons.push({ label: '稍后提醒（2 小时）', run: function () { snooze(n.id); refresh(); } });
    if (n) buttons.push({ label: '今天不再提醒', run: function () { quietToday(); refresh(); } });
    buttons.push({ label: '回到房间', cls: 'ghost' });
    return { title: '🫧 Mochi · EC–6 的一天', text: head + '<div style="margin-top:8px;font-size:13px">' + rows + '</div>', buttons: buttons };
  }

  /* ---------------------------------------------------------------- the nudge on Mochi's label in the room */
  var mochiObj = null, timer = 0;
  function refresh() {
    if (!mochiObj || !mochiObj.lab) return;
    var n = next(), L = mochiObj.lab;
    L.classList.toggle('nudge', !!n);
    L.innerHTML = '<i>' + mochiObj.icon + '</i>' + esc(n ? n.nudge : mochiObj.name);
    L.title = n ? 'Mochi：' + n.label : 'Mochi';
  }
  function attach(o) {
    mochiObj = o;
    o.dayCard = card;
    clearInterval(timer); timer = setInterval(refresh, 60000);
    setTimeout(refresh, 400);
  }
  root.addEventListener('storage', function () { setTimeout(refresh, 50); });

  root.SpatialMochiDay = { attach: attach, refresh: refresh, steps: steps, next: next, snooze: snooze, quietToday: quietToday, card: card };
})(window);

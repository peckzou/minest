/* Minest Dream Workshop · 梦工坊 — learning while you play (Phase 8).
 * Knowledge cards: in the guest view, tapping a thing that has a card (its kind's `fact`, or one the builder wrote on
 * it: `o.fact`) shows the card, reads it aloud when the thing has no line of its own, and stamps the passport.
 * The passport (📔) keeps every card found on this device, and its quiz asks about the cards already collected.
 * Also the apprentice missions shown in the easy panel. Load after dw-app.js. */
(function (root) {
  'use strict';
  var E = root.DWEngine, MK = root.DWModels.KINDS, App = root.DWApp, doc = root.document;
  if (!E || !App || !doc) return;
  var $ = function (s) { return doc.querySelector(s); };
  var esc = function (s) { return String(s == null ? '' : s).replace(/[&<>"']/g, function (c) { return { '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' }[c]; }); };
  function lget(k, d) { try { var v = JSON.parse(root.localStorage.getItem(k) || 'null'); return v == null ? d : v; } catch (e) { return d; } }
  function lset(k, v) { try { root.localStorage.setItem(k, JSON.stringify(v)); } catch (e) {} }
  var CATS = [['landmark', '🗺 世界地标'], ['people', '📜 历史人物'], ['animal', '🐼 动物朋友'], ['vehicle', '🚂 交通与探索'], ['other', '✨ 乐园里的知识']];

  function cardOf(o) {
    if (!o) return null; var K = MK[o.kind] || {};
    if (o.fact && String(o.fact).trim()) return { key: 'o:' + o.id, icon: K.icon || '✨', title: o.name || K.name, where: '小 Imagineer 写的知识卡', text: String(o.fact).trim().slice(0, 300) };
    if (K.fact) return { key: o.kind, icon: K.icon, title: K.name, where: K.fact.where, text: K.fact.text, q: K.fact.q };
    return null;
  }
  function passport() { return lget('dw.passport', {}); }
  function builtIns() { return Object.keys(MK).filter(function (k) { return MK[k].fact; }); }
  function gotCount() { var p = passport(); return builtIns().filter(function (k) { return p[k]; }).length; }
  function worldCards(w) { var seen = {}, out = []; ((w && w.objects) || []).forEach(function (o) { var c = cardOf(o); if (c && !seen[c.key]) { seen[c.key] = 1; out.push(c); } }); return out; }
  function worldGot(w) { var p = passport(); return worldCards(w).filter(function (c) { return p[c.key]; }).length; }
  function stamp(key) { var p = passport(); if (p[key]) return false; p[key] = Date.now(); lset('dw.passport', p); return true; }

  /* ---------------------------------------------------------------- the card over the guest view */
  var stage = $('.dw-stage'), kc = doc.createElement('div'), kT = 0;
  kc.id = 'dw-kcard'; kc.hidden = true; kc.setAttribute('role', 'status'); kc.setAttribute('aria-live', 'polite'); stage.appendChild(kc);
  function hideCard() { kc.hidden = true; clearTimeout(kT); }
  function showCard(c, isNew, spoken) {
    var w = App.work(), n = worldCards(w).length, k = worldGot(w);
    kc.innerHTML = '<button type="button" class="dw-kx" aria-label="关闭">✕</button>' +
      '<div class="dw-khd"><span>' + (c.icon || '✨') + '</span><div><b>' + esc(c.title) + '</b><small>' + esc(c.where || '') + '</small></div></div>' +
      '<p>' + esc(c.text) + '</p>' +
      '<div class="dw-kft">' + (isNew ? '<em>🆕 新印章！已盖进护照</em>' : '<em>已在护照里</em>') + '<span>这个世界 ' + k + ' / ' + n + '</span></div>';
    kc.hidden = false; clearTimeout(kT); kT = setTimeout(hideCard, 14000);
    if (!spoken) E.speak(c.text, { lang: 'zh-CN', rate: 1, pitch: 1.05 });
    updateBtn();
    if (isNew && n > 1 && k === n) setTimeout(function () { if (E.inGuest()) { E.launchFireworks(5); if (E.on.guest) E.on.guest('🎉 这个世界的 ' + n + ' 张知识卡全部找到啦！'); } }, 900);
  }
  kc.addEventListener('click', function (e) { if (e.target.closest('.dw-kx')) hideCard(); });

  var tap0 = E.guestTap;
  E.guestTap = function (cx, cy) {
    var h = E.inGuest() ? E.pick(cx, cy) : null, r = tap0(cx, cy);
    if (h && h.type === 'obj' && r && !r.far) {
      var w = App.work(), o = w && w.objects.filter(function (q) { return q.id === h.id; })[0], c = cardOf(o);
      if (c && E.isShown(o.id)) { E.unlock(); showCard(c, stamp(c.key), !!r.text); }
    }
    return r;
  };
  var end0 = E.on.rideEnd;
  E.on.rideEnd = function () {
    if (end0) end0();
    var w = App.work(), n = worldCards(w).length, k = worldGot(w);
    if (n && E.on.guest) setTimeout(function () { E.on.guest(k >= n ? '🎉 到站啦！知识卡全部找到了' : '到站啦！这一路有 ' + n + ' 张知识卡，你找到了 ' + k + ' 张'); }, 1800);
  };

  /* ---------------------------------------------------------------- the passport and its quiz */
  var gbtn = doc.createElement('button'); gbtn.type = 'button'; gbtn.className = 'dw-gbtn'; gbtn.id = 'dw-gpass';
  var ga = $('.dw-gacts'); ga.insertBefore(gbtn, ga.firstChild);
  var tbtn = doc.createElement('button'); tbtn.type = 'button'; tbtn.className = 'dw-tb'; tbtn.id = 'dw-passbtn'; tbtn.title = '我收集到的知识卡';
  var wk = $('#dw-works'); wk.parentNode.insertBefore(tbtn, wk);
  function updateBtn() {
    var w = App.work(), n = worldCards(w).length;
    gbtn.textContent = '📔 知识卡 ' + (n ? worldGot(w) + '/' + n : gotCount());
    tbtn.innerHTML = '📔<span class="dw-lbl"> 护照 ' + gotCount() + '/' + builtIns().length + '</span>';
  }
  var ov = doc.createElement('div'); ov.id = 'dw-pass'; ov.hidden = true;
  ov.innerHTML = '<div class="dw-passin" role="dialog" aria-modal="true" aria-label="Imagineer 护照"><div class="dw-sheethd"><b>📔 我的 Imagineer 护照</b><button class="dw-x" type="button" data-pclose aria-label="关闭">✕</button></div><div id="dw-pbody"></div></div>';
  doc.body.appendChild(ov);
  var quiz = null, detail = null;
  function renderPass() {
    var p = passport(), all = builtIns(), got = all.filter(function (k) { return p[k]; }), stars = lget('dw.stars', 0), h = '';
    var mine = Object.keys(p).filter(function (k) { return k.indexOf('o:') === 0; }).length;
    h += '<div class="dw-pstat"><div><b>' + got.length + ' / ' + all.length + '</b><small>知识印章</small></div><div><b>⭐ ' + stars + '</b><small>问答星星</small></div><div><b>' + mine + '</b><small>伙伴写的卡</small></div></div>';
    h += '<button type="button" class="dw-btn dw-main" data-quiz' + (got.length < 3 ? ' disabled' : '') + '>🎓 ' + (got.length < 3 ? '再收集 ' + (3 - got.length) + ' 张就能挑战小问答' : '挑战知识小问答') + '</button>';
    if (detail && MK[detail]) { var f = MK[detail].fact; h += '<div class="dw-pdetail"><b>' + MK[detail].icon + ' ' + esc(MK[detail].name) + '</b><small>' + esc(f.where) + '</small><p>' + esc(f.text) + '</p></div>'; }
    CATS.forEach(function (c) {
      var ks = all.filter(function (k) { var kc2 = MK[k].kidCat; return c[0] === 'other' ? !CATS.some(function (x) { return x[0] === kc2; }) : kc2 === c[0]; });
      if (!ks.length) return;
      h += '<h3>' + c[1] + ' <small>' + ks.filter(function (k) { return p[k]; }).length + '/' + ks.length + '</small></h3><div class="dw-stamps">' + ks.map(function (k) {
        return '<button type="button" class="dw-stamp' + (p[k] ? ' got' : '') + (detail === k ? ' cur' : '') + '" data-stamp="' + k + '"><span>' + MK[k].icon + '</span>' + esc(MK[k].name) + '</button>';
      }).join('') + '</div>';
    });
    h += '<p class="dw-muted">把模型摆进你的世界，再「走进世界」点一点它，就能盖上印章。灰色的是还没找到的。印章保存在这台设备上。</p>';
    $('#dw-pbody').innerHTML = h;
  }
  function shuffle(a) { a = a.slice(); for (var i = a.length - 1; i > 0; i--) { var j = Math.floor(Math.random() * (i + 1)), t = a[i]; a[i] = a[j]; a[j] = t; } return a; }
  function startQuiz() {
    var p = passport(), ks = shuffle(builtIns().filter(function (k) { return p[k] && MK[k].fact.q; })).slice(0, 5);
    quiz = { ks: ks, i: 0, score: 0, picked: null, opts: null }; renderQuiz();
  }
  function renderQuiz() {
    var q = quiz, h = '';
    if (q.i >= q.ks.length) {
      var perfect = q.score === q.ks.length;
      h = '<div class="dw-quiz"><div class="dw-qbig">' + (perfect ? '🏆' : '🌟') + '</div><h3>答对 ' + q.score + ' / ' + q.ks.length + ' 题</h3><p>' + (perfect ? '全对！你是知识小博士！' : '很棒！再去世界里看看知识卡，下次一定全对。') + '</p><p>获得 ⭐ × ' + q.score + '</p>' +
        '<button type="button" class="dw-btn dw-main" data-quiz>再来一轮</button><button type="button" class="dw-btn" data-qback style="width:100%">回到护照</button></div>';
      $('#dw-pbody').innerHTML = h; return;
    }
    var K = MK[q.ks[q.i]], f = K.fact, right = f.q[1][f.q[2]];
    if (!q.opts) q.opts = shuffle(f.q[1]);
    h = '<div class="dw-quiz"><small>第 ' + (q.i + 1) + ' / ' + q.ks.length + ' 题 · ' + K.icon + ' ' + esc(K.name) + '</small><h3>' + esc(f.q[0]) + '</h3>' +
      q.opts.map(function (a) {
        var cls = q.picked == null ? '' : a === right ? ' right' : a === q.picked ? ' wrong' : '';
        return '<button type="button" class="dw-qopt' + cls + '" data-ans="' + esc(a) + '"' + (q.picked != null ? ' disabled' : '') + '>' + esc(a) + '</button>';
      }).join('');
    if (q.picked != null) h += '<p class="dw-qfb">' + (q.picked === right ? '✅ 答对了！' : '💡 正确答案是「' + esc(right) + '」。') + ' ' + esc(f.text) + '</p><button type="button" class="dw-btn dw-main" data-qnext>' + (q.i + 1 >= q.ks.length ? '看成绩' : '下一题') + '</button>';
    $('#dw-pbody').innerHTML = h + '</div>';
  }
  function openPass() { quiz = null; detail = null; renderPass(); ov.hidden = false; }
  ov.addEventListener('click', function (e) {
    if (e.target === ov || e.target.closest('[data-pclose]')) { ov.hidden = true; updateBtn(); return; }
    var b = e.target.closest('button'); if (!b) return; var d = b.dataset;
    if (d.quiz != null) return startQuiz();
    if (d.qback != null) { quiz = null; return renderPass(); }
    if (d.stamp) { if (!passport()[d.stamp]) return; detail = detail === d.stamp ? null : d.stamp; renderPass(); if (detail) $('#dw-pbody').scrollTop = 0; return; }
    if (d.ans != null && quiz && quiz.picked == null) {
      var f = MK[quiz.ks[quiz.i]].fact; quiz.picked = d.ans; if (d.ans === f.q[1][f.q[2]]) quiz.score++; return renderQuiz();
    }
    if (d.qnext != null && quiz) {
      quiz.i++; quiz.picked = null; quiz.opts = null;
      if (quiz.i >= quiz.ks.length) { lset('dw.stars', lget('dw.stars', 0) + quiz.score); if (quiz.score === quiz.ks.length) { E.unlock(); E.launchFireworks(5); } }
      return renderQuiz();
    }
  });
  gbtn.onclick = openPass; tbtn.onclick = openPass;
  updateBtn(); setInterval(updateBtn, 1500);

  /* ---------------------------------------------------------------- apprentice missions (the easy panel shows them) */
  var MISSIONS = [
    ['放一座世界地标', function (w) { return w.objects.some(function (o) { return (MK[o.kind] || {}).kidCat === 'landmark'; }); }],
    ['请来一位会说话的伙伴', function (w) { return w.objects.some(function (o) { return root.DWModels.isFigure(o.kind) && o.life && o.life.on; }); }],
    ['给一个模型写一张自己的知识卡', function (w) { return w.objects.some(function (o) { return o.fact && String(o.fact).trim(); }); }],
    ['加上天气、烟花或音乐', function (w) { return w.timeline.clips.some(function (c) { return c.track === 'music' || c.op === 'snow' || c.op === 'rain' || c.op === 'fireworks'; }); }],
    ['走进世界看一看', function (w) { return !!w.previewed; }],
    ['收集 3 张知识卡', function () { return Object.keys(passport()).length >= 3; }]
  ];
  function missions(w) {
    if (!w) return '';
    var done = MISSIONS.map(function (m) { try { return !!m[1](w); } catch (e) { return false; } }), n = done.filter(Boolean).length, next = done.indexOf(false);
    return '<div class="dw-missions"><div class="dw-mhd"><b>🎓 小 Imagineer 学徒任务</b><span>' + n + ' / ' + MISSIONS.length + '</span></div>' +
      '<div class="dw-mdots">' + MISSIONS.map(function (m, i) { return '<i class="' + (done[i] ? 'ok' : i === next ? 'cur' : '') + '" title="' + esc(m[0]) + '">' + (done[i] ? '✓' : i + 1) + '</i>'; }).join('') + '</div>' +
      '<p>' + (next < 0 ? '🎉 全部完成！你已经是一名小小 Imagineer 了。' : '下一步：' + esc(MISSIONS[next][0])) + '</p></div>';
  }

  root.DWLearn = { cardOf: cardOf, missions: missions, open: openPass, worldCards: worldCards };
})(window);

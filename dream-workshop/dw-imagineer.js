/* Minest Dream Workshop · 梦工坊 — the AI Imagineer (Phase 3).
 * Describe an idea in a sentence; the Imagineer (POST /api/minest/ai-imagineer, Minest's own AI service) answers with a
 * first plan: things on the table, who says what, trigger zones, the guest route and the show timeline. Every value is
 * checked here before it becomes a work, and the director edits everything afterwards (AI lowers the threshold; the
 * director keeps the last word). Without the AI (signed out, offline), a local first draft is made from the templates,
 * and the panel says so. */
(function (root) {
  'use strict';
  var MK = root.DWModels.KINDS, canLive = root.DWModels.canLive, TP = root.DWTemplates, E = root.DWEngine, uid = TP.uid;
  var $ = function (s) { return document.querySelector(s); };
  var esc = function (s) { return String(s == null ? '' : s).replace(/[&<>"']/g, function (c) { return { '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' }[c]; }); };
  var ACTIONS = ['raiseHand', 'turnHead', 'nod', 'openArms', 'point', 'bow', 'smile', 'surprise', 'wink', 'stroll', 'open', 'close', 'turnPage', 'spin', 'timeTravel', 'grow', 'wilt', 'appear', 'vanish', 'startShow'];
  var LIGHTS = ['up', 'down', 'toDay', 'toDusk', 'toNight', 'toTheatre', 'rain', 'snow', 'clear'];
  var MUSIC = ['pad', 'fanfare', 'drum', 'chime'], LANGS = ['zh-CN', 'en-US', 'en-GB', 'zh-HK', 'ja-JP'];
  var EXAMPLES = [
    '我想做一个林肯在葛底斯堡演讲的微型场景，观众坐在长椅上，走近时开始演讲。',
    '一座会讲故事的森林小屋：老奶奶坐在门口，观众走近时她讲一个关于月亮的故事，点她一下她会挥手。',
    '夜晚的博物馆里，一幅达·芬奇风格的画像会对观众眨眼，还会讲画里的秘密。',
    '坐小船游览一条运河，经过风车村、灯笼桥和一座小城堡，每一站都有人讲一句话。'
  ];

  /* ---------------------------------------------------------------- asking the AI */
  function endpoint(op) {
    var h = location.hostname;
    return (/^minest-app\.vercel\.app$/.test(h) ? '/api/minest/' : 'https://minest-app.vercel.app/api/minest/') + (op || 'ai-imagineer');
  }
  function headers() {
    var ws = [root.parent, root.top, root];
    for (var i = 0; i < ws.length; i++) { try { if (ws[i] && typeof ws[i].minestAIHeaders === 'function') return Promise.resolve(ws[i].minestAIHeaders()); } catch (e) {} }
    var h = { 'Content-Type': 'application/json' };
    try { var t = localStorage.getItem('minest_ai_token'); if (t) h['X-Minest-Token'] = t; } catch (e) {}
    var fb = root.firebase, u = null; try { u = fb && fb.apps && fb.apps.length && fb.auth().currentUser; } catch (e) {}
    if (!u) return Promise.resolve(h);
    return u.getIdToken().then(function (tk) { h['X-Minest-Id-Token'] = tk; return h; }).catch(function () { return h; });
  }
  function request(op, body) {
    return headers().then(function (h) {
      var ctl = root.AbortController ? new AbortController() : null, to = setTimeout(function () { if (ctl) ctl.abort(); }, 90000);
      return fetch(endpoint(op), { method: 'POST', headers: h, body: JSON.stringify(body), signal: ctl ? ctl.signal : undefined })
        .then(function (r) { clearTimeout(to); return r.json().catch(function () { return {}; }).then(function (d) { if (!r.ok) throw new Error(r.status === 401 || r.status === 403 ? '需要先登录 Minest 才能用 AI Imagineer' : (d.error || ('AI 服务出错（' + r.status + '）'))); return d; }); });
    });
  }
  function ask(idea) { return request('ai-imagineer', { prompt: idea, history: [] }).then(function (d) { if (!d.plan) throw new Error('AI 没有给出方案'); return d.plan; }); }

  /* ---------------------------------------------------------------- a plan → a work (every value checked) */
  function n(v, a, b, d) { v = +v; if (!isFinite(v)) v = d; return Math.max(a, Math.min(b, v)); }
  function inTable(x, z) { var d = Math.hypot(x, z), m = 14.5; return d > m ? { x: x / d * m, z: z / d * m } : { x: x, z: z }; }
  function toWork(plan, idea) {
    var keyId = {}, objects = [];
    (plan.objects || []).slice(0, 40).forEach(function (p) {
      if (!p || !MK[p.kind]) return;
      var c = inTable(n(p.x, -15, 15, 0), n(p.z, -15, 15, 0));
      var o = { id: uid(), kind: p.kind, name: String(p.name || MK[p.kind].name).slice(0, 30), x: +c.x.toFixed(2), y: 0, z: +c.z.toFixed(2), ry: n(p.facing, -720, 720, 0) * Math.PI / 180, s: 1 };
      if (MK[p.kind].color) o.color = /^#[0-9a-f]{6}$/i.test(p.color || '') ? p.color : MK[p.kind].color;
      if (MK[p.kind].text != null || p.kind === 'sign') o.text = String(p.text || MK[p.kind].text || '').replace(/\\n/g, '\n').slice(0, 60);
      if (p.kind === 'star') o.lift = 1.5;
      if (canLive(p.kind)) {
        var lang = LANGS.indexOf(p.lang) >= 0 ? p.lang : 'zh-CN';
        o.life = { on: !!p.alive, voice: { text: String(p.voice || '').slice(0, 1500), lang: lang, rate: 1, pitch: p.kind === 'portrait' ? 1.1 : 1 }, lookAtGuest: true, lipSync: true, idle: true };
        if (p.tap_text || p.tap_action) o.life.tap = { text: String(p.tap_text || '').slice(0, 300), op: ACTIONS.indexOf(p.tap_action) >= 0 ? p.tap_action : '' };
      }
      if (p.key) keyId[String(p.key)] = o.id; objects.push(o);
    });
    if (!objects.length) throw new Error('方案里没有可以摆出来的东西');
    var objOf = function (id) { return objects.filter(function (o) { return o.id === id; })[0]; };
    var len = n(plan.length, 10, 300, 30), clips = [];
    (plan.clips || []).slice(0, 80).forEach(function (c) {
      if (!c) return; var t0 = n(c.start, 0, len, 0), t1 = n(c.end, 0, len, t0 + 4), tg = keyId[String(c.target || '')] || null, o = tg && objOf(tg), x = { id: uid('c'), track: c.track, op: c.op, t0: +t0.toFixed(1), t1: 0, target: null };
      if (c.track === 'light' && LIGHTS.indexOf(c.op) >= 0) x.t1 = Math.max(t0 + 0.5, t1);
      else if (c.track === 'action' && (c.op === 'appear' || c.op === 'vanish') && o) { x.t1 = Math.max(t0 + 0.5, t1); x.target = tg; }
      else if (c.track === 'music' && MUSIC.indexOf(c.op) >= 0) { x.t1 = Math.max(t0 + 1, t1); if (o) x.target = tg; }
      else if (c.track === 'action' && ACTIONS.indexOf(c.op) >= 0 && o && canLive(o.kind)) { x.t1 = Math.max(t0 + 1, t1); x.target = tg; }
      else if (c.track === 'voice' && o && o.life && o.life.voice.text) { x.op = 'speak'; x.target = tg; x.t1 = t0 + E.sayTime(o.life.voice); }
      else return;
      x.t1 = +x.t1.toFixed(1); clips.push(x);
    });
    clips.forEach(function (c) { if (c.t1 > len) len = Math.ceil(c.t1 + 2); });
    var zones = (plan.zones || []).slice(0, 8).map(function (z, i) {
      var c = inTable(n(z.x, -15, 15, 0), n(z.z, -15, 15, 2)), from = +z.from, to = +z.to;
      return { id: uid('z'), name: String(z.name || '触发区 ' + (i + 1)).slice(0, 20), x: +c.x.toFixed(2), z: +c.z.toFixed(2), r: n(z.r, 0.8, 8, 2.5), enter: 'play',
        exit: ['fade', 'stop', 'none'].indexOf(z.exit) >= 0 ? z.exit : 'fade', cue: isFinite(from) && from >= 0 ? { t0: Math.min(from, len), t1: isFinite(to) && to > from ? Math.min(to, len) : null } : null };
    });
    var route = (plan.route || []).slice(0, 12).map(function (p) { var c = inTable(n(p.x, -15, 15, 0), n(p.z, -15, 15, 0)); return { x: +c.x.toFixed(2), z: +c.z.toFixed(2) }; });
    return {
      title: String(plan.title || '新的体验').slice(0, 40), template: 'imagineer', env: { mood: ['theatre', 'day', 'dusk', 'night'].indexOf(plan.mood) >= 0 ? plan.mood : 'theatre' },
      objects: objects, zones: zones, route: route, ride: plan.ride === 'boat' ? { mode: 'boat', speed: 1.3 } : { mode: 'walk', speed: 1.3 },
      timeline: { len: len, clips: clips }, imagineer: { idea: idea, summary: String(plan.summary || '').slice(0, 600), by: 'ai' }
    };
  }
  /* no AI: the nearest template, the idea kept as the main character's first line so there is something to edit */
  function localDraft(idea) {
    var id = /画像|肖像|画中|portrait|painting/i.test(idea) ? 'portrait' : /船|游船|运河|漂流|水道|boat|canal|ride/i.test(idea) ? 'boat' : /林肯|演讲|葛底斯堡|lincoln|speech/i.test(idea) ? 'lincoln' : 'blank';
    var t = TP.list.filter(function (x) { return x.id === id; })[0], w = t.make();
    if (id === 'blank') {
      var g = { id: uid(), kind: 'guide', name: '讲述人', x: 0, y: 0.6, z: -3.8, ry: 0, s: 1, color: MK.guide.color, life: { on: true, voice: { text: idea, lang: /[㐀-鿿]/.test(idea) ? 'zh-CN' : 'en-US', rate: 1, pitch: 1 }, lookAtGuest: true, lipSync: true, idle: true } };
      w.objects.push(g); w.timeline.clips.push({ id: uid('c'), track: 'voice', op: 'speak', t0: 2, t1: 2 + E.sayTime(g.life.voice), target: g.id });
      w.timeline.len = Math.max(w.timeline.len, Math.ceil(2 + E.sayTime(g.life.voice) + 3));
    }
    w.title = (t.id === 'blank' ? '' : t.name + ' · ') + idea.slice(0, 16);
    w.imagineer = { idea: idea, summary: 'AI 没连上，先用「' + t.name + '」模板起了一个草稿' + (id === 'blank' ? '，你的想法放成了讲述人的第一句台词' : '') + '。登录 Minest 后可以再让 Imagineer 生成一次。', by: 'local' };
    return w;
  }

  /* ---------------------------------------------------------------- the panel */
  var plan = null, mode = 'edit', lastEdit = null;
  var EDITS = ['这个舞台太空了，加两排观众席，把灯光调得更温暖。', '让林肯的声音在观众距离三米时开始播放，离开五米后逐渐减弱。', '变成夜晚，再加两盏灯笼。', '让林肯说：“谢谢你们来听我的演讲。”'];
  function renderEdit(state, msg) {
    var b = $('#dw-ibody'), w = root.DWApp.work(), h = modes();
    h += '<p class="dw-muted">直接告诉 Imagineer 想怎么改「' + esc(w ? w.title : '') + '」。它用固定的编辑工具改动沙盘里的东西、触发区、声音、灯光和时间轴，不会重做整个世界；改完可以一步撤销。</p>';
    h += '<label class="dw-f">对 Imagineer 说<textarea id="dw-cmd" rows="3" maxlength="800" placeholder="例如：' + esc(EDITS[0]) + '"></textarea></label>';
    h += '<div class="dw-chips">' + EDITS.map(function (x, i) { return '<button type="button" class="dw-chip" data-cx="' + i + '">' + esc(x.slice(0, 13)) + '…</button>'; }).join('') + '</div>';
    h += '<button type="button" class="dw-btn dw-main" id="dw-cgo"' + (state === 'busy' ? ' disabled' : '') + '>' + (state === 'busy' ? '✨ Imagineer 正在修改…' : '✨ 照这样改') + '</button>';
    if (msg) h += '<p class="dw-ierr">' + esc(msg) + '</p>';
    if (lastEdit) h += '<div class="dw-iplan"><h3>' + (lastEdit.by === 'ai' ? '✨ Imagineer 改好了' : '📝 本地理解，已经改好') + '</h3>' + (lastEdit.reply ? '<p>' + esc(lastEdit.reply) + '</p>' : '') + '<ul>' + lastEdit.done.map(function (d) { return '<li>' + esc(d) + '</li>'; }).join('') + '</ul><div class="dw-row"><button type="button" class="dw-btn" id="dw-cundo">↶ 撤销这次修改</button><button type="button" class="dw-btn" id="dw-cplay">▶ 成为观众试试</button></div></div>';
    b.innerHTML = h; var ta = $('#dw-cmd'); if (ta && renderEdit.text) ta.value = renderEdit.text;
  }
  function modes() { return '<div class="dw-tabs2"><button type="button" data-mode2="edit" aria-pressed="' + (mode === 'edit') + '">✏️ 修改这件作品</button><button type="button" data-mode2="new" aria-pressed="' + (mode === 'new') + '">✨ 新作品</button></div>'; }
  function runEdit() {
    var text = ($('#dw-cmd').value || '').trim(); renderEdit.text = text; if (!text) return renderEdit('', '先说说想怎么改');
    var w = root.DWApp.work(); renderEdit('busy');
    var finish = function (ops, by, reply, note) {
      var done = []; root.DWApp.edit(function (wk) { done = root.DWEdit.apply(wk, ops); });
      if (!done.length) { root.DWApp.undo(true); lastEdit = null; return renderEdit('', (note ? note + '。' : '') + '没找到可以照着改的地方，换个说法试试（比如：加两排观众席、灯光暖一点、三米内开始演讲）。'); }
      lastEdit = { by: by, done: done, reply: reply }; renderEdit('', note);
    };
    root.DWEdit.ask(text, w).then(function (d) { finish(d.ops, 'ai', d.reply || ''); })
      .catch(function (e) { var ops = root.DWEdit.local(text, w); if (ops) finish(ops, 'local', '', (e && e.message) || 'AI 没有连上'); else renderEdit('', ((e && e.message) || 'AI 没有连上') + '，本地也没读懂这句话。试试：加两排观众席、灯光暖一点、变成夜晚、三米内开始演讲。'); });
  }
  function render(state, msg) {
    if (mode === 'edit' && root.DWApp.work()) return renderEdit(state, msg);
    var b = $('#dw-ibody'), h = modes();
    h += '<p class="dw-muted">用一两句话描述你想做的体验：谁在哪里、说什么、观众怎样走近、什么时候开始。Imagineer 会生成一份可编辑的初始方案：人物、舞台、布景、动作、声音、灯光、触发区和演出时间轴。</p>';
    h += '<label class="dw-f">我的想法<textarea id="dw-idea" rows="4" maxlength="1200" placeholder="例如：' + esc(EXAMPLES[0]) + '"></textarea></label>';
    h += '<div class="dw-chips">' + EXAMPLES.map(function (x, i) { return '<button type="button" class="dw-chip" data-ex="' + i + '">' + esc(x.slice(0, 14)) + '…</button>'; }).join('') + '</div>';
    h += '<button type="button" class="dw-btn dw-main" id="dw-igo"' + (state === 'busy' ? ' disabled' : '') + '>' + (state === 'busy' ? '✨ Imagineer 正在构思…（约半分钟）' : '✨ 生成方案') + '</button>';
    if (msg) h += '<p class="dw-ierr">' + esc(msg) + '</p>';
    if (plan) {
      var w = plan, alive = w.objects.filter(function (o) { return o.life && o.life.on; });
      h += '<div class="dw-iplan"><h3>' + (w.imagineer.by === 'ai' ? '✨ ' : '📝 ') + esc(w.title) + '</h3><p>' + esc(w.imagineer.summary) + '</p>' +
        '<ul><li>' + w.objects.length + ' 样东西' + (alive.length ? '，其中会说话的：' + alive.map(function (o) { return esc(o.name); }).join('、') : '') + '</li>' +
        '<li>' + w.zones.length + ' 个触发区 · 观众路线 ' + w.route.length + ' 个点' + (w.ride && w.ride.mode === 'boat' ? ' · 乘船游览' : '') + '</li>' +
        '<li>演出 ' + Math.round(w.timeline.len) + ' 秒 · ' + w.timeline.clips.length + ' 段（灯光、动作、台词、音乐）</li></ul>' +
        '<button type="button" class="dw-btn dw-main" id="dw-iuse">用这个方案开始导演</button></div>';
    }
    b.innerHTML = h;
    var ta = $('#dw-idea'); if (ta && render.idea) ta.value = render.idea;
  }
  function go() {
    var idea = ($('#dw-idea').value || '').trim(); render.idea = idea;
    if (!idea) { render('', '先写下你的想法'); return; }
    plan = null; render('busy');
    ask(idea).then(function (p) { plan = toWork(p, idea); render(''); })
      .catch(function (e) { plan = localDraft(idea); render('', (e && e.name === 'AbortError' ? 'AI 太久没有回应' : (e && e.message) || 'AI 没有连上') + '。下面先给你一份本地草稿。'); });
  }
  function open(m) { if (m) mode = m; $('#dw-isheet').hidden = false; render(''); setTimeout(function () { var t = $('#dw-cmd') || $('#dw-idea'); if (t) t.focus(); }, 50); }
  function close() { $('#dw-isheet').hidden = true; }
  document.addEventListener('click', function (e) {
    var t = e.target; if (!t.closest) return;
    if (t.closest('#dw-imag')) return open();
    var md = t.closest('[data-mode2]'); if (md && t.closest('#dw-isheet')) { mode = md.dataset.mode2; return render(''); }
    var cx = t.closest('[data-cx]'); if (cx) { renderEdit.text = EDITS[+cx.dataset.cx]; $('#dw-cmd').value = renderEdit.text; return; }
    if (t.closest('#dw-cgo')) return runEdit();
    if (t.closest('#dw-cundo')) { root.DWApp.undo(); lastEdit = null; return renderEdit('', '已经撤销了这次修改'); }
    if (t.closest('#dw-cplay')) { close(); return root.DWApp.guest(); }
    if (!t.closest('#dw-isheet')) return;
    if (t === $('#dw-isheet') || t.closest('#dw-iclose')) return close();
    var ex = t.closest('[data-ex]'); if (ex) { render.idea = EXAMPLES[+ex.dataset.ex]; $('#dw-idea').value = render.idea; return; }
    if (t.closest('#dw-igo')) return go();
    if (t.closest('#dw-iuse') && plan) { root.DWApp.adopt(plan); plan = null; render.idea = ''; close(); }
  });
  root.DWImagineer = { open: open, toWork: toWork, localDraft: localDraft, request: request };
})(window);

/* Minest Dream Workshop · 梦工坊 — the AI Imagineer (Phase 3.1 · Fable edition).
 * Describe an idea in a sentence; the Imagineer (POST /api/minest/ai-imagineer, Minest's own AI service) answers with a
 * first plan: things on the table, who says what, trigger zones, the guest route and the show timeline. Every value is
 * checked here before it becomes a work, and the director edits everything afterwards (AI lowers the threshold; the
 * director keeps the last word). Without the AI (signed out, offline, timeout), a local first draft is made from the
 * templates, and the panel says so.
 *
 * 3.1 upgrade:
 *  - requests timeout, retry once on network / 5xx / 429, and turn every failure into a readable sentence;
 *  - the plan is normalised before it is used: bad items, dangling targets and empty clips are dropped with a note;
 *  - local drafts now pick from all 22 templates by keyword, not just four;
 *  - the panel remembers the last idea, submits with Ctrl/Cmd + Enter, offers a retry button and shows what was skipped;
 *  - the public surface stays the same: open, toWork, localDraft, request (DWEdit still uses request directly). */
(function (root) {
  'use strict';
  var MK = root.DWModels.KINDS, canLive = root.DWModels.canLive, TP = root.DWTemplates, E = root.DWEngine, uid = TP.uid;
  var $ = function (s) { return document.querySelector(s); };
  var esc = function (s) { return String(s == null ? '' : s).replace(/[&<>"']/g, function (c) { return { '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' }[c]; }); };
  var ACTIONS = ['raiseHand', 'turnHead', 'nod', 'openArms', 'point', 'bow', 'smile', 'surprise', 'wink', 'stroll', 'open', 'close', 'turnPage', 'spin', 'timeTravel', 'grow', 'wilt', 'appear', 'vanish', 'startShow'];
  var LIGHTS = ['up', 'down', 'toDay', 'toDusk', 'toNight', 'toTheatre', 'rain', 'snow', 'clear'];
  var MUSIC = ['pad', 'fanfare', 'drum', 'chime'], LANGS = ['zh-CN', 'en-US', 'en-GB', 'zh-HK', 'ja-JP'];
  var MOODS = ['theatre', 'day', 'dusk', 'night'];
  var EXITS = ['fade', 'stop', 'none'];
  var EXAMPLES = [
    '我想做一个林肯在葛底斯堡演讲的微型场景，观众坐在长椅上，走近时开始演讲。',
    '一座会讲故事的森林小屋：老奶奶坐在门口，观众走近时她讲一个关于月亮的故事，点她一下她会挥手。',
    '夜晚的博物馆里，一幅达·芬奇风格的画像会对观众眨眼，还会讲画里的秘密。',
    '坐小船游览一条运河，经过风车村、灯笼桥和一座小城堡，每一站都有人讲一句话。'
  ];
  var LIMITS = { objects: 40, clips: 80, zones: 8, route: 12, title: 40, name: 30, text: 60, voice: 1500, tap: 300, summary: 600, ideaMin: 2, ideaMax: 1200, editMax: 800, lenMin: 10, lenMax: 300, table: 14.5 };
  var STORE_IDEA = 'minest_imagineer_idea', STORE_EDIT = 'minest_imagineer_edit';

  /* ---------------------------------------------------------------- small helpers */
  function storeGet(k) { try { return root.localStorage ? (localStorage.getItem(k) || '') : ''; } catch (e) { return ''; } }
  function storeSet(k, v) { try { if (root.localStorage) localStorage.setItem(k, v); } catch (e) {} }
  function storeDel(k) { try { if (root.localStorage) localStorage.removeItem(k); } catch (e) {} }
  function errOf(msg, code, status) { var e = new Error(msg); e.code = code || 'ERR'; if (status) e.status = status; return e; }
  function delay(ms) { return new Promise(function (res) { setTimeout(res, ms); }); }
  function arr(x) { return Array.isArray(x) ? x : []; }
  function clamp(v, a, b, d) { v = +v; if (!isFinite(v)) v = d; v = Math.max(a, Math.min(b, v)); return isFinite(v) ? v : d; }
  function safeColor(c, d) { return /^#[0-9a-f]{6}$/i.test(String(c || '')) ? String(c) : (d || null); }
  function oneLine(s, max) { return String(s == null ? '' : s).replace(/\s+/g, ' ').trim().slice(0, max); }
  function minutes(len) { var m = Math.max(1, Math.round(len / 60)); return m + ' 分钟'; }

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
  function request(op, body, options) {
    options = options || {};
    var timeoutMs = options.timeout || 90000, retries = options.retries == null ? 1 : options.retries, attempt = 0;
    function once() {
      return headers().then(function (h) {
        var ctl = root.AbortController ? new root.AbortController() : null;
        var timer = setTimeout(function () { if (ctl) ctl.abort(); }, timeoutMs);
        return fetch(endpoint(op), { method: 'POST', headers: h, body: JSON.stringify(body || {}), signal: ctl ? ctl.signal : undefined })
          .then(function (r) {
            clearTimeout(timer);
            return r.text().then(function (raw) {
              var d = null; try { d = raw ? JSON.parse(raw) : {}; } catch (e) { d = { error: String(raw || '').slice(0, 200) }; }
              if (!r.ok) {
                var msg = r.status === 401 || r.status === 403 ? '需要先登录 Minest 才能用 AI Imagineer'
                  : r.status === 429 ? 'AI 现在有点忙，请稍后再试'
                    : (d && d.error) || ('AI 服务出错（' + r.status + '）');
                throw errOf(msg, 'HTTP', r.status);
              }
              if (!d || typeof d !== 'object' || Array.isArray(d)) throw errOf('AI 返回了无法识别的内容', 'BAD_RESPONSE');
              return d;
            });
          }, function (e) {
            clearTimeout(timer);
            if (e && (e.name === 'AbortError' || e.code === 'ABORT_ERR' || e.name === 'TimeoutError')) throw errOf('AI 在 ' + Math.round(timeoutMs / 1000) + ' 秒内没有回应', 'TIMEOUT');
            throw errOf('AI 没有连上，请检查网络后重试', 'NETWORK');
          });
      }).catch(function (e) {
        var retryable = e && (e.code === 'NETWORK' || e.code === 'TIMEOUT' || e.code === 'HTTP' && (e.status === 429 || (e.status >= 500 && e.status < 600)));
        if (retryable && attempt < retries) { attempt++; return delay(600 * attempt).then(once); }
        throw e;
      });
    }
    return once();
  }
  function normalizePlan(p) {
    if (!p || typeof p !== 'object' || Array.isArray(p)) throw errOf('AI 返回的方案格式不对', 'BAD_PLAN');
    var out = {
      title: p.title, summary: p.summary, mood: p.mood, ride: p.ride, length: p.length,
      objects: arr(p.objects), clips: arr(p.clips), zones: arr(p.zones), route: arr(p.route)
    };
    if (!out.objects.length) throw errOf('方案里没有可以摆出来的东西', 'EMPTY_PLAN');
    return out;
  }
  function ask(idea, history) {
    idea = String(idea == null ? '' : idea).trim();
    if (idea.length < LIMITS.ideaMin) return Promise.reject(errOf('先写下你的想法（至少两个字）', 'IDEA_EMPTY'));
    if (idea.length > LIMITS.ideaMax) idea = idea.slice(0, LIMITS.ideaMax);
    return request('ai-imagineer', { prompt: idea, history: Array.isArray(history) ? history.slice(-8) : [] }, { timeout: 90000, retries: 1 })
      .then(function (d) { if (!d || !d.plan) throw errOf((d && d.error) || 'AI 没有给出方案', 'NO_PLAN'); return normalizePlan(d.plan); });
  }

  /* ---------------------------------------------------------------- a plan → a work (every value checked) */
  function n(v, a, b, d) { return clamp(v, a, b, d); }
  function inTable(x, z) { var d = Math.hypot(x, z), m = LIMITS.table; return d > m ? { x: x / d * m, z: z / d * m } : { x: x, z: z }; }
  function toWork(plan, idea) {
    if (!plan || typeof plan !== 'object' || Array.isArray(plan)) throw errOf('方案格式不对，拿不到可以摆出来的东西', 'BAD_PLAN');
    var warnings = [], dropObj = 0, dropClip = 0, dropZone = 0, dropRoute = 0;
    var keyId = {}, objects = [];
    arr(plan.objects).slice(0, LIMITS.objects).forEach(function (p) {
      if (!p || !MK[p.kind]) { dropObj++; return; }
      var c = inTable(n(p.x, -15, 15, 0), n(p.z, -15, 15, 0));
      var o = { id: uid(), kind: p.kind, name: oneLine(p.name || MK[p.kind].name, LIMITS.name), x: +c.x.toFixed(2), y: 0, z: +c.z.toFixed(2), ry: n(p.facing, -720, 720, 0) * Math.PI / 180, s: n(p.scale, 0.4, 2.5, 1) };
      if (MK[p.kind].color) o.color = safeColor(p.color, MK[p.kind].color);
      if (MK[p.kind].text != null || p.kind === 'sign') o.text = String(p.text || MK[p.kind].text || '').replace(/\\n/g, '\n').slice(0, LIMITS.text);
      if (p.kind === 'star') o.lift = 1.5;
      if (canLive(p.kind)) {
        var lang = LANGS.indexOf(p.lang) >= 0 ? p.lang : 'zh-CN';
        o.life = {
          on: !!p.alive,
          voice: { text: oneLine(p.voice, LIMITS.voice), lang: lang, rate: n(p.rate, 0.5, 2, 1), pitch: n(p.pitch, 0.5, 2, p.kind === 'portrait' ? 1.1 : 1) },
          lookAtGuest: p.lookAtGuest !== false, lipSync: p.lipSync !== false, idle: true
        };
        var tapText = oneLine(p.tap_text, LIMITS.tap), tapOp = ACTIONS.indexOf(p.tap_action) >= 0 ? p.tap_action : '';
        if (tapText || tapOp) o.life.tap = { text: tapText, op: tapOp };
      }
      if (p.key != null) keyId[String(p.key)] = o.id;
      objects.push(o);
    });
    if (!objects.length) throw errOf('方案里没有可以摆出来的东西', 'EMPTY_PLAN');
    function objOf(id) { for (var i = 0; i < objects.length; i++) if (objects[i].id === id) return objects[i]; return null; }
    var len = n(plan.length, LIMITS.lenMin, LIMITS.lenMax, 30), clips = [];
    arr(plan.clips).slice(0, LIMITS.clips).forEach(function (c) {
      if (!c) { dropClip++; return; }
      var t0 = n(c.start, 0, len, 0), t1 = n(c.end, 0, len, t0 + 4);
      if (t1 <= t0) t1 = t0 + 1;
      var tg = c.target != null && keyId[String(c.target)] ? keyId[String(c.target)] : null;
      var o = tg ? objOf(tg) : null;
      var x = { id: uid('c'), track: c.track, op: c.op, t0: +t0.toFixed(1), t1: 0, target: null }, ok = false;
      if (c.track === 'light' && LIGHTS.indexOf(c.op) >= 0) { x.t1 = Math.max(t0 + 0.5, t1); ok = true; }
      else if (c.track === 'action' && (c.op === 'appear' || c.op === 'vanish') && o) { x.t1 = Math.max(t0 + 0.5, t1); x.target = tg; ok = true; }
      else if (c.track === 'music' && MUSIC.indexOf(c.op) >= 0) { x.t1 = Math.max(t0 + 1, t1); if (o) x.target = tg; ok = true; }
      else if (c.track === 'action' && ACTIONS.indexOf(c.op) >= 0 && o && canLive(o.kind)) { x.t1 = Math.max(t0 + 1, t1); x.target = tg; ok = true; }
      else if (c.track === 'voice' && o && o.life) {
        var text = oneLine(c.text || (o.life.voice && o.life.voice.text), 600);
        if (!text) { dropClip++; return; }
        x.op = 'speak'; x.target = tg; if (c.text) x.text = text;
        x.t1 = t0 + (E.sayTime ? E.sayTime({ text: text, rate: o.life.voice.rate }) : Math.max(1.5, text.length / 4));
        ok = true;
      }
      if (!ok) { dropClip++; return; }
      x.t1 = +x.t1.toFixed(1); clips.push(x);
    });
    clips.forEach(function (c) { if (c.t1 > len) len = Math.ceil(c.t1 + 2); });
    len = n(len, LIMITS.lenMin, LIMITS.lenMax, 30);
    var zones = [];
    arr(plan.zones).slice(0, LIMITS.zones).forEach(function (z, i) {
      if (!z) { dropZone++; return; }
      var c = inTable(n(z.x, -15, 15, 0), n(z.z, -15, 15, 2)), from = +z.from, to = +z.to;
      zones.push({
        id: uid('z'), name: oneLine(z.name || ('触发区 ' + (i + 1)), 20), x: +c.x.toFixed(2), z: +c.z.toFixed(2), r: n(z.r, 0.8, 8, 2.5), enter: 'play',
        exit: EXITS.indexOf(z.exit) >= 0 ? z.exit : 'fade',
        cue: isFinite(from) && from >= 0 ? { t0: Math.min(from, len), t1: isFinite(to) && to > from ? Math.min(to, len) : null } : null
      });
    });
    var route = [];
    arr(plan.route).slice(0, LIMITS.route).forEach(function (p) {
      if (!p) { dropRoute++; return; }
      var c = inTable(n(p.x, -15, 15, 0), n(p.z, -15, 15, 0));
      route.push({ x: +c.x.toFixed(2), z: +c.z.toFixed(2) });
    });
    if (!route.length) { route = [{ x: 0, z: 9.5 }, { x: 0, z: 1.8 }]; warnings.push('观众路线为空，已补上一条默认路线'); }
    if (dropObj) warnings.push('略过了 ' + dropObj + ' 个无法识别的东西');
    if (dropClip) warnings.push('略过了 ' + dropClip + ' 段对不上的演出');
    if (dropZone) warnings.push('略过了 ' + dropZone + ' 个无效的触发区');
    if (dropRoute) warnings.push('略过了 ' + dropRoute + ' 个无效的路线点');
    return {
      title: oneLine(plan.title || '新的体验', LIMITS.title), template: 'imagineer', env: { mood: MOODS.indexOf(plan.mood) >= 0 ? plan.mood : 'theatre' },
      objects: objects, zones: zones, route: route, ride: plan.ride === 'boat' ? { mode: 'boat', speed: 1.3 } : { mode: 'walk', speed: 1.3 },
      timeline: { len: len, clips: clips },
      imagineer: { idea: String(idea == null ? '' : idea).slice(0, LIMITS.ideaMax), summary: oneLine(plan.summary, LIMITS.summary), by: 'ai', version: '3.1', warnings: warnings }
    };
  }

  /* ---------------------------------------------------------------- no AI: the nearest template */
  var TEMPLATES = [
    ['portrait', /画像|肖像|画中|博物馆|美术馆|portrait|painting|museum|gallery/i],
    ['mirror', /镜子|魔镜|mirror/i],
    ['boat', /船|游船|运河|漂流|水道|boat|canal|cruise|ride/i],
    ['lincoln', /林肯|演讲|葛底斯堡|讲台|lincoln|speech|gettysburg/i],
    ['storybook', /故事书|绘本|翻页|童话|storybook|fairy ?tale|book/i],
    ['timemachine', /时间机器|时光机|时钟|年代|time ?machine|clock/i],
    ['musicbox', /音乐盒|舞者|华尔兹|music ?box|waltz|dancer/i],
    ['minute', /一分钟|讲解|解释|概念|minute|explain|concept/i],
    ['history', /历史|古代|朝代|战争|history|ancient/i],
    ['illusion', /幻象|视错觉|错视|illusion|perspective/i],
    ['shadow', /影子|皮影|剪影|shadow|silhouette/i],
    ['gears', /齿轮|机械|因果|原因|gear|machine|cause/i],
    ['weather', /天气|下雨|下雪|晴天|weather|rain|snow/i],
    ['door', /神秘之门|秘密|door|secret/i],
    ['living', /小村|村落|小镇|微缩|village|town|miniature/i],
    ['memory', /记忆|照片|回忆|memory|photo/i],
    ['changing', /变化|变形|书房|星空|change|transform/i],
    ['top', /陀螺|旋转|环|top|spin|ring/i],
    ['maze', /迷宫|问题|选择|maze|question|choose/i],
    ['stars', /星座|星星|夜空|constellation|stars/i],
    ['garden', /种子|生长|开花|植物|seed|grow|flower|plant/i]
  ];
  function findTemplate(id) { for (var i = 0; i < TP.list.length; i++) if (TP.list[i].id === id) return TP.list[i]; return null; }
  function pickTemplate(idea) {
    var s = String(idea || '');
    for (var i = 0; i < TEMPLATES.length; i++) if (TEMPLATES[i][1].test(s)) return TEMPLATES[i][0];
    return 'blank';
  }
  function localDraft(idea) {
    idea = String(idea == null ? '' : idea).trim();
    var id = pickTemplate(idea), t = findTemplate(id) || findTemplate('blank');
    var w;
    try { w = t.make(); } catch (e) { t = findTemplate('blank'); w = t.make(); id = 'blank'; }
    if (id === 'blank') {
      var g = { id: uid(), kind: 'guide', name: '讲述人', x: 0, y: 0.6, z: -3.8, ry: 0, s: 1, color: MK.guide.color, life: { on: true, voice: { text: idea, lang: /[㐀-鿿]/.test(idea) ? 'zh-CN' : 'en-US', rate: 1, pitch: 1 }, lookAtGuest: true, lipSync: true, idle: true } };
      var say = E.sayTime ? E.sayTime(g.life.voice) : Math.max(1.5, idea.length / 4);
      w.objects.push(g); w.timeline.clips.push({ id: uid('c'), track: 'voice', op: 'speak', t0: 2, t1: 2 + say, target: g.id });
      w.timeline.len = Math.max(w.timeline.len, Math.ceil(2 + say + 3));
    }
    w.title = ((t.id === 'blank' ? '' : t.name + ' · ') + (idea.slice(0, 16) || '新的体验')).slice(0, LIMITS.title);
    w.imagineer = { idea: idea.slice(0, LIMITS.ideaMax), summary: 'AI 没连上，先用「' + t.name + '」模板起了一个草稿' + (id === 'blank' ? '，你的想法放成了讲述人的第一句台词' : '') + '。登录 Minest 后可以再让 Imagineer 生成一次。', by: 'local', version: '3.1', warnings: [] };
    return w;
  }

  /* ---------------------------------------------------------------- the panel */
  var plan = null, mode = 'edit', lastEdit = null, busy = false;
  var EDITS = ['这个舞台太空了，加两排观众席，把灯光调得更温暖。', '让林肯的声音在观众距离三米时开始播放，离开五米后逐渐减弱。', '变成夜晚，再加两盏灯笼。', '让林肯说：“谢谢你们来听我的演讲。”'];
  function statusLine(msg, retry, label) {
    if (!msg) return '';
    return '<p class="dw-ierr" role="status" aria-live="polite">' + esc(msg) + (retry ? ' <button type="button" class="dw-btn" data-retry="' + retry + '">' + esc(label || '再试一次') + '</button>' : '') + '</p>';
  }
  function renderEdit(state, msg) {
    var b = $('#dw-ibody'), w = root.DWApp.work(), h = modes();
    h += '<p class="dw-muted">直接告诉 Imagineer 想怎么改「' + esc(w ? w.title : '') + '」。它用固定的编辑工具改动沙盘里的东西、触发区、声音、灯光和时间轴，不会重做整个世界；改完可以一步撤销。</p>';
    h += '<label class="dw-f">对 Imagineer 说<textarea id="dw-cmd" rows="3" maxlength="' + LIMITS.editMax + '" placeholder="例如：' + esc(EDITS[0]) + '"></textarea></label>';
    h += '<div class="dw-chips">' + EDITS.map(function (x, i) { return '<button type="button" class="dw-chip" data-cx="' + i + '">' + esc(x.slice(0, 13)) + '…</button>'; }).join('') + '</div>';
    h += '<button type="button" class="dw-btn dw-main" id="dw-cgo"' + (state === 'busy' || busy ? ' disabled' : '') + '>' + (state === 'busy' || busy ? '✨ Imagineer 正在修改…' : '✨ 照这样改') + '</button>';
    h += '<p class="dw-muted dw-hint">小提示：按 Ctrl / ⌘ + Enter 直接提交。</p>';
    if (msg) h += statusLine(msg, 'edit');
    if (lastEdit) h += '<div class="dw-iplan"><h3>' + (lastEdit.by === 'ai' ? '✨ Imagineer 改好了' : '📝 本地理解，已经改好') + '</h3>' + (lastEdit.reply ? '<p>' + esc(lastEdit.reply) + '</p>' : '') + '<ul>' + lastEdit.done.map(function (d) { return '<li>' + esc(d) + '</li>'; }).join('') + '</ul><div class="dw-row"><button type="button" class="dw-btn" id="dw-cundo">↶ 撤销这次修改</button><button type="button" class="dw-btn" id="dw-cplay">▶ 成为观众试试</button></div></div>';
    b.innerHTML = h; var ta = $('#dw-cmd'); if (ta && renderEdit.text) ta.value = renderEdit.text;
  }
  function modes() { return '<div class="dw-tabs2"><button type="button" data-mode2="edit" aria-pressed="' + (mode === 'edit') + '">✏️ 修改这件作品</button><button type="button" data-mode2="new" aria-pressed="' + (mode === 'new') + '">✨ 新作品</button></div>'; }
  function finishEdit(ops, by, reply, note) {
    var done = [];
    try { root.DWApp.edit(function (wk) { done = root.DWEdit.apply(wk, ops); }); }
    catch (e) { busy = false; return renderEdit('', '修改没有落下去：' + ((e && e.message) || '未知错误')); }
    if (!done.length) { try { root.DWApp.undo(true); } catch (e) {} lastEdit = null; busy = false; return renderEdit('', (note ? note + '。' : '') + '没找到可以照着改的地方，换个说法试试（比如：加两排观众席、灯光暖一点、三米内开始演讲）。'); }
    lastEdit = { by: by, done: done, reply: reply }; busy = false; renderEdit('', note);
  }
  function runEdit() {
    if (busy) return;
    var ta = $('#dw-cmd'), text = ta ? (ta.value || '').trim() : (renderEdit.text || '').trim();
    renderEdit.text = text; if (!text) return renderEdit('', '先说说想怎么改');
    storeSet(STORE_EDIT, text);
    var w = root.DWApp.work(); if (!w) return renderEdit('', '现在没有打开的作品');
    busy = true; renderEdit('busy');
    root.DWEdit.ask(text, w).then(function (d) { finishEdit(d.ops, 'ai', d.reply || ''); })
      .catch(function (e) {
        var ops = null; try { ops = root.DWEdit.local(text, w); } catch (err) {}
        if (ops) finishEdit(ops, 'local', '', (e && e.message) || 'AI 没有连上');
        else { busy = false; renderEdit('', ((e && e.message) || 'AI 没有连上') + '，本地也没读懂这句话。试试：加两排观众席、灯光暖一点、变成夜晚、三米内开始演讲。'); }
      });
  }
  function render(state, msg) {
    if (mode === 'edit' && root.DWApp.work()) return renderEdit(state, msg);
    var b = $('#dw-ibody'), h = modes();
    h += '<p class="dw-muted">用一两句话描述你想做的体验：谁在哪里、说什么、观众怎样走近、什么时候开始。Imagineer 会生成一份可编辑的初始方案：人物、舞台、布景、动作、声音、灯光、触发区和演出时间轴。</p>';
    h += '<label class="dw-f">我的想法<textarea id="dw-idea" rows="4" maxlength="' + LIMITS.ideaMax + '" placeholder="例如：' + esc(EXAMPLES[0]) + '"></textarea></label>';
    h += '<div class="dw-chips">' + EXAMPLES.map(function (x, i) { return '<button type="button" class="dw-chip" data-ex="' + i + '">' + esc(x.slice(0, 14)) + '…</button>'; }).join('') + '</div>';
    h += '<button type="button" class="dw-btn dw-main" id="dw-igo"' + (state === 'busy' || busy ? ' disabled' : '') + '>' + (state === 'busy' || busy ? '✨ Imagineer 正在构思…（约半分钟）' : '✨ 生成方案') + '</button>';
    h += '<p class="dw-muted dw-hint">小提示：按 Ctrl / ⌘ + Enter 直接提交。</p>';
    if (msg) h += statusLine(msg, 'new');
    if (plan) {
      var w = plan, alive = w.objects.filter(function (o) { return o.life && o.life.on; });
      var warn = (w.imagineer && w.imagineer.warnings) || [];
      h += '<div class="dw-iplan"><h3>' + (w.imagineer.by === 'ai' ? '✨ ' : '📝 ') + esc(w.title) + '</h3><p>' + esc(w.imagineer.summary) + '</p>' +
        '<ul><li>' + w.objects.length + ' 样东西' + (alive.length ? '，其中会说话的：' + alive.map(function (o) { return esc(o.name); }).join('、') : '') + '</li>' +
        '<li>' + w.zones.length + ' 个触发区 · 观众路线 ' + w.route.length + ' 个点' + (w.ride && w.ride.mode === 'boat' ? ' · 乘船游览' : '') + '</li>' +
        '<li>演出 ' + Math.round(w.timeline.len) + ' 秒（约 ' + minutes(w.timeline.len) + '） · ' + w.timeline.clips.length + ' 段（灯光、动作、台词、音乐）</li></ul>' +
        (warn.length ? '<ul class="dw-muted">' + warn.map(function (x) { return '<li>' + esc(x) + '</li>'; }).join('') + '</ul>' : '') +
        '<div class="dw-row"><button type="button" class="dw-btn dw-main" id="dw-iuse">用这个方案开始导演</button><button type="button" class="dw-btn" id="dw-iregen">↻ 再生成一版</button></div></div>';
    }
    b.innerHTML = h;
    var ta = $('#dw-idea'); if (ta && render.idea) ta.value = render.idea;
  }
  function go() {
    if (busy) return;
    var ta = $('#dw-idea'), idea = ta ? (ta.value || '').trim() : (render.idea || '').trim();
    if (!idea) { render('', '先写下你的想法'); return; }
    render.idea = idea; storeSet(STORE_IDEA, idea);
    if (idea.length > LIMITS.ideaMax) idea = idea.slice(0, LIMITS.ideaMax);
    plan = null; busy = true; render('busy');
    var note = '';
    ask(idea).then(function (p) { plan = toWork(p, idea); })
      .catch(function (e) {
        note = ((e && e.message) || 'AI 没有连上') + '。下面先用本地草稿，登录后可以再生成一次。';
        try { plan = localDraft(idea); } catch (err) { plan = null; note = ((e && e.message) || 'AI 没有连上') + '，本地草稿也没做出来。'; }
      })
      .then(function () { busy = false; render('', note); });
  }
  function open(m) { if (m) mode = m; $('#dw-isheet').hidden = false; render(''); setTimeout(function () { var t = $('#dw-cmd') || $('#dw-idea'); if (t) t.focus(); }, 50); }
  function close() { $('#dw-isheet').hidden = true; }
  document.addEventListener('click', function (e) {
    var t = e.target; if (!t.closest) return;
    if (t.closest('#dw-imag')) return open();
    var md = t.closest('[data-mode2]'); if (md && t.closest('#dw-isheet')) { mode = md.dataset.mode2; return render(''); }
    var cx = t.closest('[data-cx]'); if (cx) { renderEdit.text = EDITS[+cx.dataset.cx]; var c = $('#dw-cmd'); if (c) c.value = renderEdit.text; return; }
    if (t.closest('#dw-cgo')) return runEdit();
    var rt = t.closest('[data-retry]'); if (rt) { return rt.dataset.retry === 'edit' ? runEdit() : go(); }
    if (t.closest('#dw-cundo')) { root.DWApp.undo(); lastEdit = null; return renderEdit('', '已经撤销了这次修改'); }
    if (t.closest('#dw-cplay')) { close(); return root.DWApp.guest(); }
    if (!t.closest('#dw-isheet')) return;
    if (t === $('#dw-isheet') || t.closest('#dw-iclose')) return close();
    var ex = t.closest('[data-ex]'); if (ex) { render.idea = EXAMPLES[+ex.dataset.ex]; var i = $('#dw-idea'); if (i) i.value = render.idea; return; }
    if (t.closest('#dw-igo')) return go();
    if (t.closest('#dw-iregen')) return go();
    if (t.closest('#dw-iuse') && plan) {
      var w = plan;
      try { root.DWApp.adopt(w); plan = null; render.idea = ''; storeDel(STORE_IDEA); close(); }
      catch (err) { render('', '没能开始导演：' + ((err && err.message) || '未知错误')); }
    }
  });
  document.addEventListener('keydown', function (e) {
    var sheet = $('#dw-isheet'); if (!sheet || sheet.hidden) return;
    if (e.key === 'Escape') return close();
    if ((e.metaKey || e.ctrlKey) && e.key === 'Enter') {
      var t = e.target;
      if (t && t.id === 'dw-idea') { e.preventDefault(); return go(); }
      if (t && t.id === 'dw-cmd') { e.preventDefault(); return runEdit(); }
    }
  });
  render.idea = storeGet(STORE_IDEA);
  renderEdit.text = storeGet(STORE_EDIT);
  root.DWImagineer = { open: open, toWork: toWork, localDraft: localDraft, request: request, ask: ask, version: '3.1' };
})(window);

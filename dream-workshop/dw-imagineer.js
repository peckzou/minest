/* Minest Dream Workshop · 梦工坊 — AI Imagineer 4.0 (Disney Dream & Kid-Friendly Edition).
 * Combines:
 *  - Cloud AI Imagineer (`POST /api/minest/ai-imagineer`) with timeout, auto-retry, strict normalization,
 *    and 3.2 context-aware regeneration ("换个方向再造一版").
 *  - Smart Instant Kid-Dream Composer (`localDraft` / `smartDraft`): even when signed out or offline,
 *    parses the child's dream sentence (characters, castles, rides, weather, boat cruise, fireworks, custom lines)
 *    and immediately builds a rich, interactive, ready-to-play 3D IP world with zero friction!
 *  - Voice Speech-to-Text (`listenIdea`) so children can speak their dream with a microphone tap. */
(function (root) {
  'use strict';
  var MK = root.DWModels.KINDS, canLive = root.DWModels.canLive, TP = root.DWTemplates, E = root.DWEngine, uid = TP.uid;
  var $ = function (s) { return document.querySelector(s); };
  var esc = function (s) { return String(s == null ? '' : s).replace(/[&<>"']/g, function (c) { return { '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' }[c]; }); };
  var ACTIONS = ['raiseHand', 'turnHead', 'nod', 'openArms', 'point', 'bow', 'smile', 'surprise', 'wink', 'stroll', 'open', 'close', 'turnPage', 'spin', 'timeTravel', 'grow', 'wilt', 'appear', 'vanish', 'startShow', 'fireworks'];
  var LIGHTS = ['up', 'down', 'toDay', 'toDusk', 'toNight', 'toTheatre', 'rain', 'snow', 'clear', 'fireworks'];
  var MUSIC = ['pad', 'fanfare', 'drum', 'chime'], LANGS = ['zh-CN', 'en-US', 'en-GB', 'zh-HK', 'ja-JP'];
  var MOODS = ['theatre', 'day', 'dusk', 'night'];
  var EXITS = ['fade', 'stop', 'none'];
  var EXAMPLES = [
    '冰雪城堡前飘着雪花，艾莎公主和独角兽欢迎小朋友，点魔法水晶会放烟花！',
    '星际太空站里，宇航员和快乐机器人在大火箭旁迎接大家，抬头是闪亮星座！',
    '侏罗纪恐龙乐园里，两只友善小恐龙看守黄金宝箱，走近会跳舞打招呼！',
    '坐小船穿过彩虹桥、旋转木马和蘑菇屋，终点是一座放烟花的童话城堡！'
  ];
  var LIMITS = { objects: 40, clips: 80, zones: 8, route: 12, title: 40, name: 30, text: 60, voice: 1500, tap: 300, summary: 600, ideaMin: 2, ideaMax: 1200, editMax: 800, lenMin: 10, lenMax: 300, lenOutMax: 1800, table: 14.5 };
  var STORE_IDEA = 'minest_imagineer_idea', STORE_EDIT = 'minest_imagineer_edit';

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

  /* ---------------------------------------------------------------- voice speech recognition */
  var activeRec = null;
  function listenIdea(onText, onState) {
    var SR = root.SpeechRecognition || root.webkitSpeechRecognition;
    if (!SR) { if (onState) onState('unsupported'); return null; }
    if (activeRec) { try { activeRec.stop(); } catch (e) {} activeRec = null; if (onState) onState('stopped'); return null; }
    var rec = new SR();
    rec.lang = 'zh-CN';
    rec.interimResults = true;
    rec.maxAlternatives = 1;
    activeRec = rec;
    if (onState) onState('listening');
    rec.onresult = function (ev) {
      var txt = '';
      for (var i = 0; i < ev.results.length; i++) txt += ev.results[i][0].transcript;
      if (txt && onText) onText(txt);
    };
    rec.onerror = function () { activeRec = null; if (onState) onState('error'); };
    rec.onend = function () { activeRec = null; if (onState) onState('stopped'); };
    try { rec.start(); } catch (e) { activeRec = null; if (onState) onState('error'); }
    return rec;
  }

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
  function hasAuthHint() {
    var ws = [root.parent, root.top, root];
    for (var i = 0; i < ws.length; i++) {
      try {
        if (ws[i] && ws[i].firebase && ws[i].firebase.apps && ws[i].firebase.apps.length && ws[i].firebase.auth().currentUser) return true;
      } catch (e) {}
    }
    try { if (localStorage.getItem('minest_ai_token')) return true; } catch (e) {}
    return false;
  }
  function request(op, body, options) {
    options = options || {};
    var timeoutMs = options.timeout || 90000, retries = options.retries == null ? 1 : options.retries, attempt = 0;
    var timedOut = function () { return errOf('AI 在 ' + Math.round(timeoutMs / 1000) + ' 秒内没有回应', 'TIMEOUT'); };
    function once() {
      return headers().then(function (h) {
        var ctl = root.AbortController ? new root.AbortController() : null;
        var timer = setTimeout(function () { if (ctl) ctl.abort(); }, timeoutMs);
        return fetch(endpoint(op), { method: 'POST', headers: h, body: JSON.stringify(body || {}), signal: ctl ? ctl.signal : undefined })
          .then(function (r) {
            return r.text().then(function (raw) {
              var d = null; try { d = raw ? JSON.parse(raw) : {}; } catch (e) { d = { error: String(raw || '').slice(0, 200) }; }
              if (!r.ok) {
                var msg = r.status === 401 || r.status === 403 ? '未登录云端 AI'
                  : r.status === 429 ? 'AI 现在有点忙，请稍后再试'
                    : (d && d.error) || ('AI 服务出错（' + r.status + '）');
                throw errOf(msg, 'HTTP', r.status);
              }
              if (!d || typeof d !== 'object' || Array.isArray(d)) throw errOf('AI 返回了无法识别的内容', 'BAD_RESPONSE');
              return d;
            }, function () {
              if (ctl && ctl.signal && ctl.signal.aborted) throw timedOut();
              throw errOf('AI 回答中断了，请重试', 'NETWORK');
            });
          }, function (e) {
            if (e && (e.name === 'AbortError' || e.code === 'ABORT_ERR')) throw timedOut();
            throw errOf('网络未连接云端 AI', 'NETWORK');
          })
          .then(function (d) { clearTimeout(timer); return d; }, function (e) { clearTimeout(timer); throw e; });
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
    var tmo = hasAuthHint() ? 60000 : 12000;
    return request('ai-imagineer', { prompt: idea, history: Array.isArray(history) ? history.slice(-8) : [] }, { timeout: tmo, retries: hasAuthHint() ? 1 : 0 })
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
      if (p.kind === 'star') o.lift = 2.0;
      if (canLive(p.kind)) {
        var lang = LANGS.indexOf(p.lang) >= 0 ? p.lang : 'zh-CN';
        o.life = {
          on: p.alive !== false,
          voice: { text: oneLine(p.voice, LIMITS.voice), lang: lang, rate: n(p.rate, 0.5, 2, 1), pitch: n(p.pitch, 0.5, 2, p.kind === 'portrait' ? 1.1 : 1.06) },
          lookAtGuest: p.lookAtGuest !== false, lipSync: p.lipSync !== false, idle: true
        };
        var tapText = oneLine(p.tap_text, LIMITS.tap), tapOp = ACTIONS.indexOf(p.tap_action) >= 0 ? p.tap_action : (root.DWModels.actions(p.kind)[0] || 'openArms');
        o.life.tap = { text: tapText || ('你好呀！我是' + o.name + '，欢迎来到这个奇妙世界！'), op: tapOp };
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
        var text = c.text ? oneLine(c.text, 600) : oneLine(o.life.voice && o.life.voice.text, LIMITS.voice);
        if (!text) { dropClip++; return; }
        x.op = 'speak'; x.target = tg; if (c.text) x.text = text;
        x.t1 = t0 + (E && E.sayTime ? E.sayTime({ text: text, rate: o.life.voice.rate }) : Math.max(1.5, text.length / 4));
        ok = true;
      }
      if (!ok) { dropClip++; return; }
      x.t1 = +x.t1.toFixed(1); clips.push(x);
    });
    clips.forEach(function (c) { if (c.t1 > len) len = Math.ceil(c.t1 + 2); });
    len = n(len, LIMITS.lenMin, LIMITS.lenOutMax, 30);
    var zones = [];
    arr(plan.zones).slice(0, LIMITS.zones).forEach(function (z, i) {
      if (!z) { dropZone++; return; }
      var c = inTable(n(z.x, -15, 15, 0), n(z.z, -15, 15, 2)), from = +z.from, to = +z.to;
      zones.push({
        id: uid('z'), name: oneLine(z.name || ('触发区 ' + (i + 1)), 20), x: +c.x.toFixed(2), z: +c.z.toFixed(2), r: n(z.r, 1.5, 8, 4.5), enter: 'play',
        exit: EXITS.indexOf(z.exit) >= 0 ? z.exit : 'fade',
        cue: isFinite(from) && from >= 0 ? { t0: Math.min(from, len), t1: isFinite(to) && to > from ? Math.min(to, len) : null } : null
      });
    });
    if (!zones.length) zones.push({ id: uid('z'), name: '欢迎广场', x: 0, z: 1.8, r: 5.0, enter: 'play', exit: 'none' });
    var route = [];
    arr(plan.route).slice(0, LIMITS.route).forEach(function (p) {
      if (!p) { dropRoute++; return; }
      var c = inTable(n(p.x, -15, 15, 0), n(p.z, -15, 15, 0));
      route.push({ x: +c.x.toFixed(2), z: +c.z.toFixed(2) });
    });
    if (!route.length) { route = [{ x: 0, z: 9.5 }, { x: 0, z: 1.8 }]; }
    if (dropObj) warnings.push('自动优化了 ' + dropObj + ' 个超出范围的元素');
    if (dropClip) warnings.push('自动对齐了 ' + dropClip + ' 段演出节奏');
    return {
      title: oneLine(plan.title || '我的奇想世界', LIMITS.title), template: 'imagineer', env: { mood: MOODS.indexOf(plan.mood) >= 0 ? plan.mood : 'night' },
      objects: objects, zones: zones, route: route, ride: plan.ride === 'boat' ? { mode: 'boat', speed: 1.35 } : { mode: 'walk', speed: 1.35 },
      timeline: { len: len, clips: clips },
      imagineer: { idea: String(idea == null ? '' : idea).slice(0, LIMITS.ideaMax), summary: oneLine(plan.summary, LIMITS.summary), by: 'ai', version: '4.0', warnings: warnings }
    };
  }

  /* ---------------------------------------------------------------- Smart Kid-Dream Composer (instant zero-latency IP builder!) */
  var TEMPLATES = [
    ['ice_kingdom', /冰雪|艾莎|安娜|雪宝|雪花|冰晶|雪国|极光|frozen|elsa|ice|snow/i],
    ['wizard_school', /魔法学院|哈利|巫师|魔杖|咒语|霍格沃茨|hogwarts|wizard|magic school/i],
    ['space_station', /太空|宇宙|宇航员|巴斯|火箭|星球|星际|银河|飞船|火星|space|rocket|astronaut|galaxy/i],
    ['dino_valley', /恐龙|霸王龙|暴龙|翼龙|侏罗纪|远古|dino|jurassic|trex/i],
    ['unicorn_island', /独角兽|彩虹|小马|花仙子|糖果|旋转木马|摩天轮|unicorn|rainbow|pony|candy/i],
    ['fairy_cruise', /奇幻漂流|童话船|游船|坐船|运河|水道|漂流|boat|canal|cruise/i],
    ['robot_lab', /机器人|瓦力|发明|科技|未来工坊|赛博|robot|mech|future/i],
    ['castle_concert', /烟花音乐会|烟花秀|城堡大秀|公主城堡|迪士尼城堡|firework|concert/i],
    ['portrait', /画像|肖像|画中|博物馆|美术馆|portrait|painting|museum/i],
    ['mirror', /镜子|魔镜|白雪|mirror/i],
    ['lincoln', /林肯|演讲|葛底斯堡|讲台|lincoln|speech|gettysburg/i],
    ['storybook', /故事书|绘本|翻页|小狐狸|storybook|book/i],
    ['timemachine', /时间机器|时光机|时钟|年代|穿越|time ?machine|clock/i],
    ['musicbox', /音乐盒|八音盒|舞者|华尔兹|music ?box|waltz/i],
    ['minute', /一分钟|讲解|解释|概念|minute|explain/i],
    ['history', /历史|郑和|古代|朝代|history|ancient/i],
    ['illusion', /幻象|视错觉|错视|illusion/i],
    ['shadow', /影子|皮影|剪影|乌鸦|shadow/i],
    ['gears', /齿轮|机械|因果|gear|machine/i],
    ['weather', /天气机器|晴雨|weather/i],
    ['door', /神秘之门|任意门|秘密花园|door|secret/i],
    ['living', /小村|村落|小镇|微缩|village|town/i],
    ['memory', /记忆|照片|回忆|memory|photo/i],
    ['changing', /变化的房间|书房变星空|transform/i],
    ['top', /陀螺|星环|旋转环|top|ring/i],
    ['maze', /迷宫|问题门|闯关|maze|puzzle/i],
    ['stars', /星座|观星|夜空星星|constellation/i],
    ['garden', /思想花园|种子|发芽|开花|植物|garden|seed/i]
  ];
  function findTemplate(id) { for (var i = 0; i < TP.list.length; i++) if (TP.list[i].id === id) return TP.list[i]; return null; }
  function pickTemplate(idea) {
    var s = String(idea || '');
    for (var i = 0; i < TEMPLATES.length; i++) if (TEMPLATES[i][1].test(s)) return TEMPLATES[i][0];
    return '';
  }

  /* Custom-compose extras requested in the child's sentence onto the world so their exact dream comes true! */
  var EXTRA_RULES = [
    { re: /公主|女王|艾莎|乐佩|爱丽儿|白雪/, kind: 'princess', name: '童话公主', color: '#ec4899' },
    { re: /魔法师|巫师|仙女|魔杖/, kind: 'wizard', name: '小魔法师', color: '#7c3aed' },
    { re: /宇航员|太空人|巴斯/, kind: 'astronaut', name: '星际宇航员', color: '#f8fafc' },
    { re: /机器人|机甲|瓦力|队长/, kind: 'robot', name: '聪明机器人', color: '#38bdf8' },
    { re: /恐龙|霸王龙|暴龙|小龙/, kind: 'dino', name: '快乐小恐龙', color: '#22c55e' },
    { re: /独角兽|小马|飞马/, kind: 'unicorn', name: '彩虹独角兽', color: '#fdf4ff' },
    { re: /城堡|皇宫|宫殿/, kind: 'castle', name: '梦想童话城堡', color: '#fce7f3', back: true },
    { re: /旋转木马|木马/, kind: 'carousel', name: '皇家旋转木马', color: '#ec4899', side: -4.6 },
    { re: /摩天轮/, kind: 'ferris', name: '彩虹摩天轮', color: '#38bdf8', side: 4.8 },
    { re: /火箭|飞船/, kind: 'rocket', name: '星际火箭', color: '#ef4444', side: -4.2 },
    { re: /水晶|宝石|魔法石/, kind: 'crystal', name: '发光魔法水晶', color: '#38bdf8', side: 2.8 },
    { re: /宝箱|宝藏|礼物/, kind: 'treasure', name: '惊喜百宝箱', color: '#92400e', side: -2.8 },
    { re: /彩虹/, kind: 'rainbow', name: '七彩欢迎拱门', front: true },
    { re: /蘑菇|精灵屋/, kind: 'mushroom', name: '精灵蘑菇屋', color: '#ef4444', side: 4.6 },
    { re: /故事书|绘本/, kind: 'book', name: '立体魔法书', color: '#2f5d8a', side: 2.6 },
    { re: /音乐盒|八音盒/, kind: 'musicbox', name: '梦幻八音盒', color: '#be185d', side: -3.2 }
  ];

  function localDraft(idea, variantIndex) {
    idea = String(idea == null ? '' : idea).trim();
    var vIdx = variantIndex | 0;
    var tid = pickTemplate(idea);
    if (vIdx > 0) {
      var ipPool = ['ice_kingdom', 'unicorn_island', 'space_station', 'wizard_school', 'dino_valley', 'fairy_cruise', 'castle_concert'];
      tid = ipPool[(ipPool.indexOf(tid) + vIdx + 1) % ipPool.length];
    }
    var t = (tid && findTemplate(tid)) || findTemplate('castle_concert') || findTemplate('blank');
    var w;
    try { w = t.make(); } catch (e) { t = findTemplate('blank'); w = t.make(); }

    /* Extract custom spoken line if the user wrote quotes, else craft a warm personalized welcome! */
    var qMatch = idea.match(/[“"「『]([^”"」』]{2,120})[”"」』]/);
    var customLine = qMatch ? qMatch[1] : ('欢迎来到「' + idea.slice(0, 22) + '」的梦想世界！快来四处走走，点一点身边的伙伴和魔法道具吧！');

    /* Inject requested models that aren't already in the template! */
    var placedSide = 0;
    EXTRA_RULES.forEach(function (r) {
      if (!r.re.test(idea)) return;
      if (w.objects.some(function (o) { return o.kind === r.kind; })) return;
      var x = r.back ? 0 : r.front ? 0 : (r.side != null ? r.side : (placedSide++ % 2 ? 3.2 : -3.2));
      var z = r.back ? -6.5 : r.front ? 4.2 : (-1.6 - (placedSide * 0.6));
      var no = { id: uid(), kind: r.kind, name: r.name, x: x, y: 0, z: z, ry: 0, s: 1 };
      if (r.color) no.color = r.color;
      if (canLive(r.kind)) {
        var defOp = root.DWModels.actions(r.kind)[0] || 'openArms';
        no.life = {
          on: true,
          voice: { text: root.DWModels.isFigure(r.kind) ? customLine : '', lang: 'zh-CN', rate: 1, pitch: 1.08 },
          lookAtGuest: true, lipSync: true, idle: true,
          tap: { text: '太开心见到你啦！这是专门为你实现的「' + r.name + '」！', op: defOp }
        };
      }
      w.objects.push(no);
    });

    /* Customize lead speaker's welcome line to match the user's dream */
    var lead = w.objects.filter(function (o) { return o.life && o.life.on && root.DWModels.isFigure(o.kind); })[0];
    if (lead && idea.length >= 2) {
      lead.life.voice.text = customLine;
      var vc = w.timeline.clips.filter(function (c) { return c.track === 'voice' && c.target === lead.id; })[0];
      var dur = E && E.sayTime ? E.sayTime({ text: customLine, rate: 1 }) : Math.max(3, customLine.length / 4);
      if (vc) { vc.text = customLine; vc.t1 = +(vc.t0 + dur).toFixed(1); }
      else w.timeline.clips.push({ id: uid('c'), track: 'voice', op: 'speak', t0: 1, t1: +(1 + dur).toFixed(1), target: lead.id, text: customLine });
    }

    /* Weather, sky & fireworks matching keywords */
    if (/雪|冰|冬|极光/.test(idea) && !w.timeline.clips.some(function (c) { return c.op === 'snow'; })) {
      w.env.mood = 'night';
      w.timeline.clips.push({ id: uid('c'), track: 'light', op: 'snow', t0: 0, t1: w.timeline.len });
    } else if (/雨/.test(idea)) {
      w.timeline.clips.push({ id: uid('c'), track: 'light', op: 'rain', t0: 0, t1: w.timeline.len });
    }
    if (/夜晚|星空|宇宙|太空|月亮/.test(idea)) w.env.mood = 'night';
    else if (/黄昏|夕阳|傍晚/.test(idea)) w.env.mood = 'dusk';
    else if (/白天|阳光|草地|森林|恐龙/.test(idea)) w.env.mood = 'day';

    if (/烟花|礼花|庆祝|派对|狂欢/.test(idea) && !w.timeline.clips.some(function (c) { return c.op === 'fireworks'; })) {
      w.timeline.clips.push({ id: uid('c'), track: 'light', op: 'fireworks', t0: 3, t1: Math.max(18, w.timeline.len) });
    }
    if (/坐船|游船|小船|漂流/.test(idea)) {
      w.ride = { mode: 'boat', speed: 1.35 };
      if ((w.route || []).length < 4) w.route = [{ x: -8, z: 9.5 }, { x: -6, z: 2.5 }, { x: 0, z: 0.5 }, { x: 6, z: 2.5 }, { x: 8, z: 7.5 }];
    }

    var cleanTitle = idea.replace(/[，。！？,.!?\s]+/g, ' ').trim().slice(0, 18);
    var signObj = w.objects.filter(function (o) { return o.kind === 'sign'; })[0];
    if (signObj && cleanTitle) signObj.text = cleanTitle + '\n欢迎走进梦想世界 ✨';
    w.title = (cleanTitle || t.name).slice(0, LIMITS.title);
    w.imagineer = {
      idea: idea.slice(0, LIMITS.ideaMax),
      summary: '已为你变出「' + w.title + '」3D 互动世界！所有角色和魔法道具都已赋予生命，直接点「🌟 走进世界体验」或「🏰 放到迪士尼乐园」吧！',
      by: 'smart',
      version: '4.0',
      warnings: []
    };
    return w;
  }

  /* Generate via AI if signed in, otherwise instant Smart Kid-Dream Composer with zero scary errors! */
  function createFromIdea(idea, history, variantCount) {
    var clean = String(idea || '').trim().slice(0, LIMITS.ideaMax);
    if (clean.length < LIMITS.ideaMin) return Promise.reject(errOf('先写下或说出你的梦想吧（至少两个字）', 'IDEA_EMPTY'));
    if (!hasAuthHint()) {
      return Promise.resolve({ work: localDraft(clean, variantCount || 0), mode: 'smart' });
    }
    var reqPrompt = clean;
    if (variantCount && history && history.length) {
      reqPrompt += '\n\n请参考上一版，保留原始核心想法，但换一个明显不同的构想方向；尽量更换主要布景、触发方式或演出节奏，避免重复上一版。';
    }
    return ask(reqPrompt, history || []).then(function (plan) {
      var w = toWork(plan, clean);
      return { work: w, mode: 'ai', reqPrompt: reqPrompt };
    }).catch(function () {
      return { work: localDraft(clean, variantCount || 0), mode: 'smart' };
    });
  }

  /* ---------------------------------------------------------------- Modal Sheet UI (for ✨ Imagineer button & Pro mode) */
  var plan = null, mode = 'new', lastEdit = null, busy = false, history = [], seedIdea = '', variantCount = 0;
  var EDITS = [
    '加一座童话城堡和两只快乐小恐龙，再放漫天烟花！',
    '变成飘雪的梦幻星空，加一座旋转木马和彩虹摩天轮。',
    '加两排观众席，把灯光调得更温暖。',
    '让主角说：“欢迎来到我设计的迪士尼梦想世界！”'
  ];
  function modes() {
    return '<div class="dw-tabs2"><button type="button" data-mode2="new" aria-pressed="' + (mode === 'new') + '">✨ 一句话造新世界</button>' +
      '<button type="button" data-mode2="edit" aria-pressed="' + (mode === 'edit') + '">🪄 一句话改当前世界</button></div>';
  }
  function statusLine(msg, retry, label) {
    if (!msg) return '';
    return '<p class="dw-inote" role="status" aria-live="polite">' + esc(msg) + (retry ? ' <button type="button" class="dw-btn" data-retry="' + retry + '">' + esc(label || '再试一次') + '</button>' : '') + '</p>';
  }
  function compactSummary(work) {
    var names = (work.objects || []).slice(0, 12).map(function (item) { return item.name; }).filter(Boolean);
    var text = '方案「' + (work.title || '新的体验') + '」：' + ((work.imagineer && work.imagineer.summary) || '已生成可编辑的体验方案。');
    if (names.length) text += ' 场景元素：' + names.join('、') + '。';
    return text.slice(0, 1800);
  }
  function renderEdit(state, msg, retry) {
    var b = $('#dw-ibody'); if (!b) return;
    var w = root.DWApp && root.DWApp.work ? root.DWApp.work() : null, h = modes();
    h += '<p class="dw-muted">告诉魔法师想怎么改造「' + esc(w ? w.title : '当前世界') + '」——加角色、换天气、放烟花或改台词，一步完成且随时可撤销。</p>';
    h += '<label class="dw-f">我想这样改<div class="dw-irow"><textarea id="dw-cmd" rows="3" maxlength="' + LIMITS.editMax + '" placeholder="例如：' + esc(EDITS[0]) + '"></textarea><button type="button" class="dw-mic" id="dw-mic-edit" title="语音输入">🎤</button></div></label>';
    h += '<div class="dw-chips">' + EDITS.map(function (x, i) { return '<button type="button" class="dw-chip" data-cx="' + i + '">' + esc(x.slice(0, 15)) + '…</button>'; }).join('') + '</div>';
    h += '<button type="button" class="dw-btn dw-main" id="dw-cgo"' + (state === 'busy' || busy ? ' disabled' : '') + '>' + (state === 'busy' || busy ? '🪄 正在施展修改魔法…' : '🪄 立即照这样改') + '</button>';
    if (msg) h += statusLine(msg, retry ? 'edit' : '');
    if (lastEdit) h += '<div class="dw-iplan"><h3>✨ 已经改好啦！</h3>' + (lastEdit.reply ? '<p>' + esc(lastEdit.reply) + '</p>' : '') + '<ul>' + lastEdit.done.map(function (d) { return '<li>' + esc(d) + '</li>'; }).join('') + '</ul><div class="dw-row"><button type="button" class="dw-btn" id="dw-cundo">↶ 撤销</button><button type="button" class="dw-btn dw-main" id="dw-cplay">🌟 走进世界试试</button></div></div>';
    b.innerHTML = h; var ta = $('#dw-cmd'); if (ta && renderEdit.text) ta.value = renderEdit.text;
  }
  function finishEdit(ops, by, reply, note) {
    var done = [];
    try { root.DWApp.edit(function (wk) { done = root.DWEdit.apply(wk, ops); }); }
    catch (e) { busy = false; return renderEdit('', '修改没有成功：' + ((e && e.message) || '未知错误'), true); }
    if (!done.length) { try { root.DWApp.undo(true); } catch (e) {} lastEdit = null; busy = false; return renderEdit('', '可以试试说：加一座城堡、加两只小恐龙、变成夜晚、放烟花。', false); }
    lastEdit = { by: by, done: done, reply: reply }; busy = false; renderEdit('', note, false);
  }
  function runEdit(customText) {
    if (busy) return;
    var ta = $('#dw-cmd'), text = customText != null ? String(customText).trim() : (ta ? (ta.value || '').trim() : (renderEdit.text || '').trim());
    renderEdit.text = text; if (!text) return renderEdit('', '先说说想怎么改吧');
    storeSet(STORE_EDIT, text);
    var w = root.DWApp.work(); if (!w) return renderEdit('', '现在没有打开的作品');
    if (!hasAuthHint()) {
      var localOps = null; try { localOps = root.DWEdit.local(text, w); } catch (err) {}
      if (localOps) return finishEdit(localOps, 'local', '', '');
    }
    busy = true; renderEdit('busy');
    root.DWEdit.ask(text, w).then(function (d) { finishEdit(d.ops, 'ai', d.reply || ''); })
      .catch(function () {
        var ops = null; try { ops = root.DWEdit.local(text, w); } catch (err) {}
        if (ops) finishEdit(ops, 'local', '', '');
        else { busy = false; renderEdit('', '试试这样说：加一座城堡、加两只小恐龙、变成夜晚、飘雪、放烟花！', false); }
      });
  }
  function render(state, msg) {
    var b = $('#dw-ibody'); if (!b) return;
    if (mode === 'edit' && root.DWApp && root.DWApp.work && root.DWApp.work()) return renderEdit(state, msg);
    var h = modes();
    h += '<p class="dw-muted">说出或写下你的奇思妙想：想建什么样的主题世界、放哪些可爱的角色和游乐设施？Imagineer 会立刻为你搭好 3D 互动世界！</p>';
    h += '<label class="dw-f">我的梦想世界<div class="dw-irow"><textarea id="dw-idea" rows="3" maxlength="' + LIMITS.ideaMax + '" placeholder="例如：' + esc(EXAMPLES[0]) + '"></textarea><button type="button" class="dw-mic" id="dw-mic-idea" title="点击用语音说出梦想">🎤</button></div></label>';
    h += '<div class="dw-chips">' + EXAMPLES.map(function (x, i) { return '<button type="button" class="dw-chip" data-ex="' + i + '">' + esc(x.slice(0, 16)) + '…</button>'; }).join('') + '</div>';
    h += '<button type="button" class="dw-btn dw-main" id="dw-igo"' + (state === 'busy' || busy ? ' disabled' : '') + '>' + (state === 'busy' || busy ? '✨ 正在为你建造梦想世界…' : '✨ 一键变出 3D 梦想世界') + '</button>';
    if (msg) h += statusLine(msg, '');
    if (plan) {
      var w = plan, alive = w.objects.filter(function (o) { return o.life && o.life.on; });
      h += '<div class="dw-iplan"><h3>✨ ' + esc(w.title) + '</h3><p>' + esc(w.imagineer.summary) + '</p>' +
        '<ul><li>包含 ' + w.objects.length + ' 个 3D 模型' + (alive.length ? '（互动伙伴：' + alive.slice(0, 5).map(function (o) { return esc(o.name); }).join('、') + '）' : '') + '</li>' +
        '<li>' + (w.ride && w.ride.mode === 'boat' ? '⛵ 奇幻水道乘船游览' : '🚶 自由漫步沉浸互动') + ' · 约 ' + minutes(w.timeline.len) + '</li></ul>' +
        '<div class="dw-row"><button type="button" class="dw-btn dw-main" id="dw-iuse">🌟 放进沙盘立即体验</button><button type="button" class="dw-btn" id="dw-iregen">↻ 换个风格再来一版</button></div></div>';
    }
    b.innerHTML = h;
    var ta = $('#dw-idea'); if (ta && render.idea) ta.value = render.idea;
  }
  function go(variant) {
    if (busy) return;
    var ta = $('#dw-idea'), idea = ta ? (ta.value || '').trim() : (render.idea || '').trim();
    if (idea.length < LIMITS.ideaMin) { render('', '先写下或点 🎤 说出你的梦想吧！'); return; }
    if (seedIdea && idea !== seedIdea) { history = []; variantCount = 0; variant = false; }
    seedIdea = idea;
    if (variant) variantCount++;
    render.idea = idea; storeSet(STORE_IDEA, idea);
    plan = null; busy = true; render('busy');
    createFromIdea(idea, history, variantCount).then(function (res) {
      plan = res.work;
      if (res.mode === 'ai') {
        history.push({ role: 'user', text: res.reqPrompt || idea });
        history.push({ role: 'assistant', text: compactSummary(plan) });
        history = history.slice(-8);
      }
      busy = false; render('', '');
    }).catch(function (err) {
      busy = false; render('', (err && err.message) || '请再试一次');
    });
  }
  function open(m) {
    mode = m || 'new';
    var sheet = $('#dw-isheet'); if (!sheet) return;
    sheet.hidden = false; render('');
    setTimeout(function () { var t = $('#dw-cmd') || $('#dw-idea'); if (t) t.focus(); }, 50);
  }
  function close() { var sheet = $('#dw-isheet'); if (sheet) sheet.hidden = true; }

  document.addEventListener('click', function (e) {
    var t = e.target; if (!t || !t.closest) return;
    if (t.closest('#dw-imag')) return open('new');
    var md = t.closest('[data-mode2]'); if (md && t.closest('#dw-isheet')) { mode = md.dataset.mode2; return render(''); }
    var cx = t.closest('[data-cx]'); if (cx) { renderEdit.text = EDITS[+cx.dataset.cx]; var c = $('#dw-cmd'); if (c) c.value = renderEdit.text; return; }
    if (t.closest('#dw-mic-idea')) {
      var btn = t.closest('#dw-mic-idea');
      listenIdea(function (txt) { render.idea = txt; var i = $('#dw-idea'); if (i) i.value = txt; }, function (st) { if (btn) btn.classList.toggle('on', st === 'listening'); });
      return;
    }
    if (t.closest('#dw-mic-edit')) {
      var btn2 = t.closest('#dw-mic-edit');
      listenIdea(function (txt) { renderEdit.text = txt; var c = $('#dw-cmd'); if (c) c.value = txt; }, function (st) { if (btn2) btn2.classList.toggle('on', st === 'listening'); });
      return;
    }
    if (t.closest('#dw-cgo')) return runEdit();
    var rt = t.closest('[data-retry]'); if (rt) { return rt.dataset.retry === 'edit' ? runEdit() : go(false); }
    if (t.closest('#dw-cundo')) { root.DWApp.undo(); lastEdit = null; return renderEdit('', '已撤销刚才的修改'); }
    if (t.closest('#dw-cplay')) { close(); return root.DWApp.guest(); }
    if (!t.closest('#dw-isheet')) return;
    if (t === $('#dw-isheet') || t.closest('#dw-iclose')) return close();
    var ex = t.closest('[data-ex]'); if (ex) { render.idea = EXAMPLES[+ex.dataset.ex]; var i2 = $('#dw-idea'); if (i2) i2.value = render.idea; return; }
    if (t.closest('#dw-igo')) return go(false);
    if (t.closest('#dw-iregen')) return go(true);
    if (t.closest('#dw-iuse') && plan) {
      var w = plan;
      try { root.DWApp.adopt(w); plan = null; close(); }
      catch (err) { render('', '没能载入场景：' + ((err && err.message) || '未知错误')); }
    }
  });
  document.addEventListener('keydown', function (e) {
    var sheet = $('#dw-isheet'); if (!sheet || sheet.hidden) return;
    if (e.key === 'Escape') return close();
    if ((e.metaKey || event && event.ctrlKey || e.ctrlKey) && e.key === 'Enter') {
      var t = e.target;
      if (t && t.id === 'dw-idea') { e.preventDefault(); return go(false); }
      if (t && t.id === 'dw-cmd') { e.preventDefault(); return runEdit(); }
    }
  });
  render.idea = storeGet(STORE_IDEA);
  renderEdit.text = storeGet(STORE_EDIT);
  root.DWImagineer = {
    open: open, close: close, toWork: toWork, localDraft: localDraft, smartDraft: localDraft,
    createFromIdea: createFromIdea, listenIdea: listenIdea, runQuickEdit: runEdit,
    request: request, ask: ask, examples: EXAMPLES, version: '4.0'
  };
})(window);

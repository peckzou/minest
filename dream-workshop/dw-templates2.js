/* Minest Dream Workshop · 梦工坊 — the rest of the 20 experience templates (phase 5).
 * Each is a starting work to change: its things, who says what, its zones, route and show. Lines are original
 * (Aesop's fable and historical facts retold in our own words). Added to DWTemplates.list, before 空白小剧场. */
(function (root) {
  'use strict';
  var TP = root.DWTemplates, uid = TP.uid, PI = Math.PI;
  var say = function (text, rate) { var E = root.DWEngine; return E && E.sayTime ? E.sayTime({ text: text, rate: rate || 1 }) : text.length / 4 + 1; };
  function obj(kind, name, x, z, ry, extra) { return Object.assign({ id: uid(), kind: kind, name: name, x: x, y: 0, z: z, ry: ry || 0, s: 1 }, extra || {}); }
  function life(text, extra) { return Object.assign({ on: true, voice: { text: text || '', lang: 'zh-CN', rate: 1, pitch: 1 }, lookAtGuest: true, lipSync: true, idle: true }, extra || {}); }
  function clip(track, t0, t1, op, target, text) { var c = { id: uid('c'), track: track, t0: t0, t1: t1, op: op, target: target || null }; if (text) { c.text = text; c.t1 = +(t0 + say(text)).toFixed(1); } return c; }
  function zone(name, x, z, r, extra) { return Object.assign({ id: uid('z'), name: name, x: x, z: z, r: r, enter: 'play', exit: 'fade' }, extra || {}); }
  function sign(text, x, z, ry) { return obj('sign', '告示牌', x, z, ry || 0, { text: text }); }
  function spots() { return [obj('spot', '聚光灯', 3.8, 1.6, -PI * 0.8), obj('spot', '聚光灯', -3.8, 1.6, PI * 0.8)]; }
  function work(title, id, mood, objects, zones, route, len, clips, extra) { return Object.assign({ title: title, template: id, env: { mood: mood }, objects: objects, zones: zones, route: route, timeline: { len: len, clips: clips } }, extra || {}); }
  function lenOf(cs, min) { var m = min || 20; cs.forEach(function (c) { if (c.t1 + 2 > m) m = Math.ceil(c.t1 + 2); }); return m; }

  /* 02 一分钟思想剧场 — a presenter, a machine and three stars explain one idea in a minute */
  function minuteTheater() {
    var G = obj('guide', '思想讲解员', -2.2, -3.2, 0.35, { y: 0.6, color: '#2f7d6b', life: life('一分钟，讲清楚一个想法：什么是反馈？', { tap: { text: '记住：做一件事，看看结果，再调整一下。', op: 'nod' } }) });
    var A = obj('star', '行动', 0.2, -4.4, 0, { y: 0.6, text: '行动', lift: 1.2, color: '#ffb3e6' }), B = obj('star', '结果', 2.4, -4.6, 0, { y: 0.6, text: '结果', lift: 1.9, color: '#b3d4ff' }), C = obj('star', '调整', 1.3, -3.4, 0, { y: 0.6, text: '调整', lift: 0.6, color: '#c8ffb3' });
    A.link = B.id; B.link = C.id; C.link = A.id;
    var objects = [obj('stage', '小舞台', 0, -4, 0), obj('curtain', '幕布', 0, -6.3, 0, { color: '#1f3b5a' }), G, A, B, C].concat(spots(), [obj('bench', '长椅', 0, 2.2, PI), sign('一分钟思想剧场\n什么是反馈？', 2.4, 8.4, -0.3)]);
    var cs = [clip('light', 0, 2, 'up'), clip('voice', 1, 0, 'speak', G.id, '一分钟，讲清楚一个想法：什么是反馈？'), clip('action', 1, 4, 'openArms', G.id),
      clip('action', 7, 8, 'appear', A.id), clip('voice', 7.5, 0, 'speak', G.id, '第一步，你做了一件事——这是行动。'), clip('action', 8, 11, 'point', G.id),
      clip('action', 14, 15, 'appear', B.id), clip('voice', 14.5, 0, 'speak', G.id, '然后，世界给了你一个回应——这是结果。'),
      clip('action', 21, 22, 'appear', C.id), clip('voice', 21.5, 0, 'speak', G.id, '你根据结果改一改做法——这是调整。三步连起来，就成了一个圈。'),
      clip('action', 30, 36, 'spin', A.id), clip('action', 30, 36, 'spin', B.id), clip('action', 30, 36, 'spin', C.id), clip('music', 30, 38, 'chime', B.id),
      clip('voice', 31, 0, 'speak', G.id, '学骑车、学写字、学做人，都是这样一圈一圈变好的。'), clip('action', 41, 44, 'bow', G.id)];
    cs.push(clip('light', lenOf(cs) - 1, lenOf(cs) + 2, 'down'));
    return work('一分钟思想剧场 · 什么是反馈', 'minute', 'theatre', objects, [zone('观众席', 0, 1.2, 2.6)], [{ x: 0, z: 9.5 }, { x: 0, z: 1.8 }], lenOf(cs, 50), cs);
  }

  /* 04 微型历史舞台 — 1405, Zheng He's fleet sets out */
  function historyStage() {
    var N = obj('guide', '讲史人', -4.2, 0.2, 0.6, { color: '#7a4b2a', life: life('一四零五年，南京的江边，一支庞大的船队正准备出发。', { tap: { text: '郑和一共带领船队远航了七次。', op: 'nod' } }) });
    var Z = obj('figure', '郑和', 0, -3.6, 0, { y: 0.6, color: '#8c1f28', life: life('扬帆，出发！') });
    var S1 = obj('figure', '水手', -2.2, -4.4, 0.3, { y: 0.6, s: 0.9, color: '#2f5d8a', life: life('') }), S2 = obj('figure', '水手', 2.2, -4.6, -0.3, { y: 0.6, s: 0.9, color: '#2f5d8a', life: life('') });
    var SHIP = obj('boat', '宝船', 0, -7.4, PI / 2, { s: 3.2, color: '#7a3b22' });
    var objects = [obj('stage', '码头', 0, -4, 0, { color: '#6b4a2f' }), SHIP, Z, S1, S2, N,
      obj('flag', '船旗', -3, -6.2, 0, { y: 0.6 }), obj('flag', '船旗', 3, -6.2, 0, { y: 0.6 }), obj('house', '龙江船厂', -6.4, -4.6, 0.5), obj('house', '江边人家', 6.4, -4.2, -0.5, { color: '#f3d9c0' }),
      obj('lantern', '灯笼', -4.6, -1.8, 0), obj('lantern', '灯笼', 4.6, -1.8, PI)].concat(spots(), [obj('bench', '长椅', 0, 2.4, PI), sign('微型历史舞台\n一四零五 · 郑和下西洋', -2.4, 8.4, 0.3)]);
    var cs = [clip('light', 0, 2.5, 'up'), clip('music', 0, 9, 'pad'),
      clip('voice', 1.5, 0, 'speak', N.id, '一四零五年，南京的江边，一支庞大的船队正准备出发。'), clip('action', 2, 5, 'openArms', N.id),
      clip('action', 6, 16, 'stroll', S1.id), clip('action', 7, 17, 'stroll', S2.id),
      clip('voice', 10, 0, 'speak', N.id, '带领船队的，是航海家郑和。'), clip('action', 12, 15, 'turnHead', Z.id),
      clip('voice', 18, 0, 'speak', Z.id, '扬帆，出发！'), clip('action', 18, 22, 'raiseHand', Z.id), clip('music', 18.5, 26, 'fanfare', SHIP.id),
      clip('light', 24, 29, 'toDusk'),
      clip('voice', 26, 0, 'speak', N.id, '他们一共远航了七次，经过东南亚和印度洋，最远到达了非洲东岸。'),
      clip('light', 36, 40, 'toNight'), clip('voice', 40, 0, 'speak', N.id, '船上的灯一盏盏亮起来，故事还在海上继续。'), clip('action', 46, 49, 'bow', N.id)];
    return work('微型历史舞台 · 郑和下西洋', 'history', 'day', objects, [zone('江边', 0, 1.2, 2.8)], [{ x: 0, z: 9.5 }, { x: 0, z: 1.8 }], lenOf(cs, 52), cs);
  }

  /* 06 视角幻象 — stand on the left, then on the right: the installation shows something different from each spot */
  function viewIllusion() {
    var G = obj('guide', '幻象讲解员', 0, -1.2, 0, { color: '#4a3f8c', life: life('同一件装置，站的位置不同，看到的东西就不同。先去左边的圆圈站一站。') });
    var L1 = obj('word', '左边看到', -0.2, -4, 0.5, { text: '看见过去', color: '#ffb347' }), R1 = obj('word', '右边看到', 0.2, -4.1, -0.5, { text: '看见未来', color: '#5aa0ff' });
    var COL = [obj('column', '立柱', -2.2, -4.2, 0), obj('column', '立柱', 2.2, -4.2, 0)];
    var objects = [G, L1, R1].concat(COL, spots(), [sign('视角幻象\n换个位置再看一次', 2.6, 8.4, -0.3)]);
    var cs = [clip('light', 0, 2, 'up'), clip('voice', 0.5, 0, 'speak', G.id, '同一件装置，站的位置不同，看到的东西就不同。先去左边的圆圈站一站。'),
      clip('action', 10, 11, 'appear', L1.id), clip('action', 18, 19, 'vanish', L1.id), clip('voice', 11, 0, 'speak', G.id, '从左边看，它让你看见过去。'), clip('music', 10, 18, 'chime', L1.id),
      clip('action', 20, 21, 'appear', R1.id), clip('action', 28, 29, 'vanish', R1.id), clip('voice', 21, 0, 'speak', G.id, '从右边看，它让你看见未来。换一个角度，世界就换了一个样子。'), clip('music', 20, 28, 'pad', R1.id)];
    return work('视角幻象 · 换个位置再看', 'illusion', 'night', objects,
      [zone('入口', 0, 2.4, 1.8, { cue: { t0: 0, t1: 9 }, exit: 'none' }), zone('左边看', -3.6, -0.6, 1.5, { cue: { t0: 10, t1: 19 }, exit: 'none' }), zone('右边看', 3.6, -0.6, 1.5, { cue: { t0: 20, t1: 30 }, exit: 'none' })],
      [{ x: 0, z: 9.5 }, { x: 0, z: 2.4, wait: 8 }, { x: -3.6, z: -0.6, wait: 9 }, { x: 3.6, z: -0.6, wait: 10 }], 31, cs);
  }

  /* 07 影子剧场 — a lamp, a white screen and two figures between them: the fox and the crow, told in shadows */
  function shadowTheater() {
    var LAMP = obj('spot', '影子灯', 0, 4.2, PI, { shadow: true, tilt: 0.02, y: -1.3 });
    var FOX = obj('figure', '狐狸', -1, -0.4, 0.4, { y: 0.3, s: 0.85, color: '#d9772b', life: life('', { idle: true }) }), CROW = obj('figure', '乌鸦', 1.2, -1.4, -0.4, { s: 0.7, y: 0.3, color: '#1d1d22', life: life('') });
    var N = obj('guide', '讲故事的人', -4.4, 1.6, 0.7, { color: '#5a3f7a', life: life('很久以前，有一只乌鸦叼着一块肉，停在树枝上。', { tap: { text: '这个故事来自很古老的伊索寓言。', op: 'nod' } }) });
    var objects = [obj('wall', '白幕', 0, -3.8, 0, { color: '#f6f1e4', plain: true }), obj('stage', '影偶台', 0, -1.2, 0, { s: 0.5, color: '#3b2a1e' }), LAMP, FOX, CROW, obj('tree', '剪影树', 2.2, -2.2, 0, { s: 0.8 }), N, obj('bench', '长椅', -2.2, 6.4, PI), sign('影子剧场\n狐狸与乌鸦', 2.8, 9.6, -0.3)];
    var cs = [clip('light', 0, 3, 'up'),
      clip('voice', 1, 0, 'speak', N.id, '很久以前，有一只乌鸦叼着一块肉，停在树枝上。'), clip('action', 2, 6, 'turnHead', CROW.id),
      clip('voice', 8, 0, 'speak', N.id, '狐狸走过来，抬头说：乌鸦小姐，你的歌声一定是全森林最美的！'), clip('action', 8, 16, 'stroll', FOX.id), clip('action', 16, 19, 'point', FOX.id),
      clip('voice', 19, 0, 'speak', N.id, '乌鸦一高兴，张嘴就唱——肉掉了下去，狐狸叼起来就跑。'), clip('action', 19, 22, 'openArms', CROW.id), clip('action', 22, 30, 'stroll', FOX.id), clip('music', 19, 23, 'drum'),
      clip('voice', 30, 0, 'speak', N.id, '听好听的话之前，先想一想：他想要什么？'), clip('action', 36, 39, 'bow', N.id)];
    cs.push(clip('light', lenOf(cs) - 1, lenOf(cs) + 2, 'down'));
    return work('影子剧场 · 狐狸与乌鸦', 'shadow', 'night', objects, [zone('观众席', -1.6, 5.4, 2.6)], [{ x: -2.2, z: 11 }, { x: -2.2, z: 5.6 }], lenOf(cs, 42), cs);
  }

  /* 08 魔法镜子 — a silver mirror wakes up, talks to the guest and answers a tap */
  function magicMirror() {
    var M = obj('portrait', '魔镜', 0, -2.9, 0, { frame: 'silver', color: '#3f5a7a', hair: '#e8eef5', life: life('镜子镜子……咦？今天站在我面前的，是一位很会思考的人。', { lookAtGuest: true, tap: { text: '你问我谁最聪明？最聪明的人，是愿意一直提问的人。', op: 'wink' } }) });
    M.life.voice.pitch = 0.9;
    var objects = [obj('wall', '墙', 0, -3.2, 0, { color: '#2a2440' }), M, obj('lantern', '烛灯', -2, -2.6, 0, { color: '#ffd98a' }), obj('lantern', '烛灯', 2, -2.6, PI, { color: '#ffd98a' }),
      obj('column', '立柱', -3.3, -2.8, 0), obj('column', '立柱', 3.3, -2.8, 0), obj('spot', '聚光灯', 3, 1.8, -PI * 0.83), sign('魔法镜子\n走近它，问它一个问题', -2.4, 8.4, 0.3)];
    var cs = [clip('light', 0, 2.5, 'up'), clip('music', 0, 5, 'chime', M.id), clip('action', 1, 3, 'surprise', M.id),
      clip('voice', 2.5, 0, 'speak', M.id, '镜子镜子……咦？今天站在我面前的，是一位很会思考的人。'), clip('action', 3, 7, 'smile', M.id), clip('action', 9, 12, 'turnHead', M.id),
      clip('voice', 12, 0, 'speak', M.id, '点一点我的镜框，问我一个问题吧。'), clip('action', 15, 16.5, 'wink', M.id)];
    return work('魔法镜子 · 镜中人', 'mirror', 'night', objects, [zone('镜子前', 0, 0.4, 2.4)], [{ x: 0, z: 9.5 }, { x: 0, z: 1.4 }], lenOf(cs, 20), cs);
  }

  /* 10 思想机械仪 — gears that show how one cause turns into effects */
  function thoughtMachine() {
    var GE = obj('gears', '思想机械仪', 0, -2.6, 0, { life: life('', { tap: { text: '', op: 'spin' } }) });
    var G = obj('guide', '机械师', -3, -1.8, 0.5, { color: '#8a5a2b', life: life('看这台机器：转动第一个齿轮，后面的齿轮都会跟着转。', { tap: { text: '点一点机器，它会转得更快。', op: 'point' } }) });
    var C1 = obj('star', '原因', -1.4, -4.6, 0, { text: '一个原因', lift: 2.2, color: '#ffb347' }), C2 = obj('star', '结果', 1.6, -4.6, 0, { text: '很多结果', lift: 2.4, color: '#5aa0ff' }); C1.link = C2.id;
    var objects = [GE, G, C1, C2].concat(spots(), [obj('bench', '长椅', 0, 2.2, PI), sign('思想机械仪\n一个原因，很多结果', 2.4, 8.4, -0.3)]);
    var cs = [clip('light', 0, 2, 'up'), clip('voice', 1, 0, 'speak', G.id, '看这台机器：转动第一个齿轮，后面的齿轮都会跟着转。'), clip('action', 2, 12, 'spin', GE.id), clip('music', 2, 12, 'drum', GE.id),
      clip('action', 10, 11, 'appear', C1.id), clip('action', 15, 16, 'appear', C2.id),
      clip('voice', 13, 0, 'speak', G.id, '想法也一样：一个原因，会带出很多个结果。'), clip('action', 18, 24, 'spin', C1.id), clip('action', 18, 24, 'spin', C2.id),
      clip('voice', 22, 0, 'speak', G.id, '下次遇到问题，试着找找最前面的那个齿轮。'), clip('action', 28, 31, 'bow', G.id)];
    return work('思想机械仪 · 原因与结果', 'gears', 'theatre', objects, [zone('观众席', 0, 1.2, 2.6)], [{ x: 0, z: 9.5 }, { x: 0, z: 1.8 }], lenOf(cs, 33), cs);
  }

  /* 11 微型天气机器 — the machine turns, and the little village goes from sun to rain, to snow, to night */
  function weatherMachine() {
    var GE = obj('gears', '天气机器', 0, -1.4, 0, { s: 0.8, color: '#7fb3d5', life: life('', { tap: { text: '', op: 'startShow' } }) });
    var G = obj('guide', '天气管理员', -2.6, -0.6, 0.6, { color: '#2f6b8a', life: life('欢迎来到天气机器！点一下机器，天气就会变。') });
    var objects = [GE, G, obj('house', '小屋', -3.6, -5.6, 0.3), obj('house', '小屋', 0, -6.4, 0, { color: '#f3d9c0' }), obj('house', '小屋', 3.8, -5.4, -0.3, { color: '#dfe8f3' }), obj('windmill', '风车', 6.2, -7.4, -0.4),
      obj('tree', '树', -6, -3.2, 0), obj('tree', '树', 6.4, -2.6, 0), obj('lantern', '灯笼', -1.6, -3.6, 0), obj('lantern', '灯笼', 1.6, -3.6, PI), sign('微型天气机器\n点一下机器', 2.4, 8.4, -0.3)];
    var cs = [clip('light', 0, 2, 'toDay'), clip('voice', 0.5, 0, 'speak', G.id, '先来一个晴天，阳光照在小村子上。'), clip('action', 0.5, 6, 'spin', GE.id),
      clip('light', 8, 11, 'toDusk'), clip('light', 8, 11, 'rain'), clip('music', 8, 17, 'pad'), clip('voice', 8.5, 0, 'speak', G.id, '转一转——下雨了，云把太阳藏了起来。'), clip('action', 8, 12, 'spin', GE.id),
      clip('light', 18, 20, 'clear'), clip('light', 20, 23, 'toNight'), clip('light', 20, 23, 'snow'), clip('music', 20, 30, 'chime'), clip('voice', 20.5, 0, 'speak', G.id, '再转一转——天黑了，下起了雪。'), clip('action', 20, 24, 'spin', GE.id),
      clip('light', 31, 33, 'clear'), clip('light', 32, 36, 'toDay'), clip('voice', 33, 0, 'speak', G.id, '最后，雪停了，新的一天又开始了。'), clip('action', 38, 41, 'bow', G.id)];
    return work('微型天气机器', 'weather', 'day', objects, [zone('机器前', 0, 1.6, 2.6, { enter: 'none', exit: 'none' })], [{ x: 0, z: 9.5 }, { x: 0, z: 2.2 }], lenOf(cs, 43), cs);
  }

  /* 13 神秘之门 — the door opens, and a hidden garden appears behind it */
  function mysteryDoor() {
    var D = obj('door', '神秘之门', 0, -1.2, 0, { life: life('', { tap: { text: '', op: 'open' } }) });
    var K = obj('guide', '守门人', -2.4, 0, 0.5, { color: '#2f6b5a', life: life('这扇门后面，藏着一个花园。准备好了吗？', { tap: { text: '门只为好奇的人打开。', op: 'nod' } }) });
    var hid = [obj('sprout', '花', -1.6, -4.6, 0, { text: '好奇' }), obj('sprout', '花', 0.2, -5.6, 0, { text: '勇气' }), obj('sprout', '花', 2, -4.4, 0, { text: '耐心' }),
      obj('lantern', '萤火灯', -3, -6.6, 0, { color: '#c8ffb3' }), obj('lantern', '萤火灯', 3, -6.6, PI, { color: '#c8ffb3' }), obj('star', '星', 0, -7.4, 0, { text: '秘密花园', lift: 2.6 })];
    var objects = [obj('wall', '围墙', -3.8, -1.3, 0, { s: 0.75 }), obj('wall', '围墙', 3.8, -1.3, 0, { s: 0.75 }), D, K].concat(hid, [sign('神秘之门\n走近它', 2.4, 8.4, -0.3)]);
    var cs = [clip('light', 0, 2, 'up'), clip('voice', 0.5, 0, 'speak', K.id, '这扇门后面，藏着一个花园。准备好了吗？'), clip('action', 5, 8, 'open', D.id), clip('music', 5, 15, 'chime', D.id)];
    hid.forEach(function (o, i) { cs.push(clip('action', 7 + i * 0.6, 8 + i * 0.6, 'appear', o.id)); if (o.kind === 'sprout') cs.push(clip('action', 8 + i * 0.6, 12 + i * 0.6, 'grow', o.id)); });
    cs.push(clip('voice', 12, 0, 'speak', K.id, '走进去看看吧。每一朵花，都是一种值得带走的品质。'));
    return work('神秘之门 · 门后的花园', 'door', 'dusk', objects, [zone('门前', 0, 1.2, 2.2)], [{ x: 0, z: 9.5 }, { x: 0, z: 1.8 }, { x: 0, z: -1.2 }, { x: 0, z: -4 }], lenOf(cs, 22), cs);
  }

  /* 14 活的微缩世界 — a day in a little village: people walk about from morning to night */
  function livingMiniature() {
    var V = [obj('figure', '面包师', -3, -2.6, 0, { color: '#c49a6c', life: life('') }), obj('guide', '邮递员', 2.6, -1.8, 0, { color: '#2f5d8a', life: life('') }), obj('figure', '小朋友', 0, -4.6, 0, { s: 0.7, color: '#e86a8a', life: life('') })];
    var N = obj('guide', '村长', -4.4, 1.2, 0.6, { color: '#6b3f24', life: life('欢迎来到我们的小村子，看看这里的一天。', { tap: { text: '大家都在忙自己的事，这就是生活呀。', op: 'nod' } }) });
    var objects = [obj('house', '面包房', -4.6, -5.4, 0.4), obj('house', '邮局', 4.6, -5, -0.4, { color: '#dfe8f3' }), obj('house', '小屋', 0, -7.6, 0, { color: '#f3d9c0' }), obj('windmill', '风车', -7, -8, 0.3),
      obj('tree', '树', 6.6, -1.4, 0), obj('tree', '树', -6.6, -1.4, 0), obj('lantern', '路灯', -1.6, -1.6, 0, { color: '#ffd98a' }), obj('lantern', '路灯', 1.6, -3.4, PI, { color: '#ffd98a' }), N].concat(V, [sign('活的微缩世界\n小村的一天', 2.4, 8.4, -0.3)]);
    var cs = [clip('light', 0, 3, 'toDay'), clip('music', 0, 12, 'chime'), clip('voice', 1, 0, 'speak', N.id, '早上，面包师最先醒来，开始烤面包。'), clip('action', 2, 14, 'stroll', V[0].id),
      clip('voice', 12, 0, 'speak', N.id, '中午，邮递员挨家挨户送信。'), clip('action', 12, 24, 'stroll', V[1].id),
      clip('light', 22, 26, 'toDusk'), clip('voice', 23, 0, 'speak', N.id, '傍晚，小朋友放学了，在村子里跑来跑去。'), clip('action', 23, 35, 'stroll', V[2].id), clip('music', 24, 34, 'pad'),
      clip('light', 34, 38, 'toNight'), clip('voice', 36, 0, 'speak', N.id, '晚上，灯一盏盏亮起来。明天，又是新的一天。'), clip('action', 42, 45, 'bow', N.id)];
    return work('活的微缩世界 · 小村的一天', 'living', 'dusk', objects, [zone('村口', 0, 2.2, 2.8)], [{ x: 0, z: 9.5 }, { x: 0, z: 2.6 }], lenOf(cs, 47), cs);
  }

  /* 15 记忆房间 — three photographs on a wall; tap one and it tells its story */
  function memoryRoom() {
    var P = [['第一次骑自行车', '那天爸爸在后面扶着车。我以为他一直扶着，回头才发现，他早就松手了。'], ['外婆的厨房', '外婆的厨房总有葱油饼的香味。她说，好吃的秘诀，是耐心。'], ['搬家那天', '搬家那天下着小雨，我把最喜欢的玩具，留给了邻居家的弟弟。']].map(function (p, i) {
      return obj('picture', p[0], -2.4 + i * 2.4, -2.6, 0, { text: p[0], life: { on: true, voice: { text: '', lang: 'zh-CN', rate: 0.95, pitch: 1 }, tap: { text: p[1], op: '' } } });
    });
    var N = obj('guide', '记忆的主人', -4, -0.6, 0.6, { color: '#7a4b8c', life: life('这是我的记忆房间。点一点墙上的照片，它们会告诉你一个故事。') });
    var objects = [obj('wall', '墙', 0, -3.6, 0, { color: '#5a4a3a' })].concat(P, [N, obj('chair', '椅子', 0, 0.6, PI), obj('lamp', '落地灯', 3.6, -1.6, 0), sign('记忆房间\n点一点照片', 2.4, 8.4, -0.3)]);
    var cs = [clip('light', 0, 2.5, 'up'), clip('music', 0, 14, 'pad'), clip('voice', 1, 0, 'speak', N.id, '这是我的记忆房间。点一点墙上的照片，它们会告诉你一个故事。'), clip('action', 2, 5, 'point', N.id)];
    P.forEach(function (p, i) { cs.push(clip('action', 0.5 + i * 0.6, 1.5 + i * 0.6, 'appear', p.id)); });
    return work('记忆房间', 'memory', 'dusk', objects, [zone('房间里', 0, 0.4, 2.8)], [{ x: 0, z: 9.5 }, { x: 0, z: 1.4 }], lenOf(cs, 16), cs);
  }

  /* 16 变化的房间 — pull the lever: the study turns into a night of stars, then back */
  function changingRoom() {
    var SW = obj('gears', '变身装置', 2.6, -1.4, -0.5, { s: 0.55, life: life('', { tap: { text: '', op: 'startShow' } }) });
    var G = obj('guide', '房间主人', -2.6, -1, 0.5, { color: '#2f7d6b', life: life('这个房间会变魔术。去拉一下右边的装置试试。') });
    var day = [obj('chair', '书桌椅', -0.8, -3.2, 0), obj('picture', '地图', 0.6, -3.4, 0, { text: '世界地图' }), obj('column', '书架柱', -2, -4, 0)];
    var night = [obj('star', '星', -1.6, -4.4, 0, { text: '月亮', lift: 3, color: '#fff2a8' }), obj('star', '星', 1.4, -4.8, 0, { text: '银河', lift: 2.4, color: '#b3d4ff' }), obj('sprout', '夜花', 0, -3.2, 0, { text: '梦' }), obj('lantern', '萤火', 2.2, -4.2, PI, { color: '#c8ffb3' })];
    night[0].link = night[1].id;
    var objects = [obj('wall', '墙', 0, -5.2, 0, { color: '#40506a' }), SW, G].concat(day, night, [sign('变化的房间\n拉一下装置', 2.4, 8.4, -0.3)]);
    var cs = [clip('light', 0, 2, 'toDay'), clip('voice', 0.5, 0, 'speak', G.id, '变！'), clip('action', 0, 4, 'spin', SW.id), clip('light', 2, 6, 'toNight'), clip('music', 2, 16, 'chime')];
    day.forEach(function (o) { cs.push(clip('action', 3, 4, 'vanish', o.id), clip('action', 18, 19, 'appear', o.id)); });
    night.forEach(function (o, i) { cs.push(clip('action', 4 + i * 0.5, 5 + i * 0.5, 'appear', o.id), clip('action', 17, 18, 'vanish', o.id)); });
    cs.push(clip('action', 5, 9, 'grow', night[2].id), clip('voice', 7, 0, 'speak', G.id, '白天的书房，到了晚上，就变成了做梦的地方。'), clip('light', 16, 19, 'toDay'), clip('voice', 19, 0, 'speak', G.id, '天亮了，一切又回到原来的样子。'));
    return work('变化的房间', 'changing', 'day', objects, [zone('房间里', 0, 0.8, 2.6, { enter: 'none', exit: 'none' })], [{ x: 0, z: 9.5 }, { x: 0, z: 1.4 }], lenOf(cs, 24), cs);
  }

  /* 17 概念陀螺 — three rings of one idea spin, open out and close again */
  function conceptTop() {
    var TOP = obj('top', '概念陀螺', 0, -2.4, 0, { text: '看见\n想通\n做到', life: life('', { tap: { text: '', op: 'spin' } }) });
    var G = obj('guide', '陀螺师傅', -2.6, -1.4, 0.5, { color: '#a0522d', life: life('学习，就像一个陀螺，有三个环。') });
    var objects = [TOP, G].concat(spots(), [obj('bench', '长椅', 0, 2.2, PI), sign('概念陀螺\n学习的三个环', 2.4, 8.4, -0.3)]);
    var cs = [clip('light', 0, 2, 'up'), clip('voice', 0.5, 0, 'speak', G.id, '学习，就像一个陀螺，有三个环。'), clip('action', 2, 8, 'spin', TOP.id), clip('music', 2, 8, 'chime', TOP.id),
      clip('action', 8, 11, 'open', TOP.id), clip('voice', 10, 0, 'speak', G.id, '最下面一环，是看见：先注意到问题。'), clip('voice', 15, 0, 'speak', G.id, '中间一环，是想通：弄明白为什么。'), clip('voice', 20, 0, 'speak', G.id, '最上面一环，是做到：真的去试一试。'),
      clip('action', 25, 28, 'close', TOP.id), clip('action', 27, 34, 'spin', TOP.id), clip('voice', 28, 0, 'speak', G.id, '三个环一起转，陀螺才站得稳。'), clip('action', 33, 36, 'bow', G.id)];
    return work('概念陀螺 · 学习的三个环', 'top', 'theatre', objects, [zone('观众席', 0, 1.2, 2.6)], [{ x: 0, z: 9.5 }, { x: 0, z: 1.8 }], lenOf(cs, 38), cs);
  }

  /* 18 问题迷宫 — three doors along a corridor: answer each question and the next door opens */
  function questionMaze() {
    var Q = [['什么东西，越分享越多？', '答案是：知识。'], ['什么地方，你一直往前走，却永远走不到？', '答案是：地平线。'], ['怎样才能走出迷宫？', '带着问题，一直往前走。']];
    var objects = [], cs = [], zones = [];
    Q.forEach(function (q, i) {
      var z = 5 - i * 6, D = obj('door', '第' + (i + 1) + '道门', 0, z, 0), K = obj('guide', '守门人', -1.6, z + 1.2, 0.5, { color: ['#2f6b5a', '#6d3fa0', '#a0522d'][i], life: life(q[0]) });
      objects.push(obj('wall', '墙', -3.9, z, 0, { s: 0.9 }), obj('wall', '墙', 3.9, z, 0, { s: 0.9 }), D, K, obj('sign', '问题', 1.9, z + 1.6, -0.3, { text: '第' + (i + 1) + '题\n' + q[0].slice(0, 12) }));
      var t = i * 12;
      cs.push(clip('voice', t + 0.5, 0, 'speak', K.id, q[0]), clip('music', t + 4, t + 7, 'chime', D.id), clip('voice', t + 7, 0, 'speak', K.id, q[1]), clip('action', t + 9, t + 11, 'open', D.id));
      zones.push(zone('第' + (i + 1) + '题', 0, z + 2.2, 1.6, { cue: { t0: t, t1: t + 12 }, exit: 'none' }));
    });
    var END = obj('star', '出口之星', 0, -12, 0, { text: '你走出来了', lift: 2.4 });
    objects.push(END, sign('问题迷宫\n三道门', 2.4, 10.6, -0.3));
    cs.push(clip('action', 36.5, 37.5, 'appear', END.id), clip('music', 37, 44, 'fanfare', END.id), clip('action', 37, 43, 'spin', END.id));
    zones.push(zone('出口', 0, -10.4, 1.8, { cue: { t0: 36, t1: 45 }, exit: 'none' }));
    return work('问题迷宫 · 三道门', 'maze', 'dusk', objects, zones, [{ x: 0, z: 11.5 }, { x: 0, z: 7.2, wait: 11 }, { x: 0, z: 1.2, wait: 11 }, { x: 0, z: -4.8, wait: 11 }, { x: 0, z: -10.6 }], 46, cs);
  }

  /* 19 思想星座 — ideas as stars, appearing one by one and joined into a constellation */
  function constellation() {
    var words = [['好奇', -3, -4, 2.2], ['提问', -1.4, -6, 3.2], ['观察', 0.8, -5, 1.8], ['猜想', 2.6, -6.6, 3.6], ['试验', 3.6, -3.6, 2.4], ['发现', 1, -2.8, 3], ['分享', -1.8, -2.6, 1.4]];
    var S = words.map(function (w, i) { return obj('star', w[0], w[1], w[2], 0, { text: w[0], lift: w[3], color: ['#ffd86b', '#ffb3e6', '#b3d4ff', '#c8ffb3', '#ffcf9a', '#e0c8ff', '#9ff0ff'][i], life: life('', { tap: { text: '这颗星叫' + w[0] + '。', op: 'spin' } }) }); });
    S.forEach(function (s, i) { if (i < S.length - 1) s.link = S[i + 1].id; });
    var N = obj('guide', '观星人', -4.4, 0.6, 0.6, { color: '#3a3f8c', life: life('抬头看，这是一个叫“发现”的星座。') });
    var objects = S.concat([N, obj('bench', '长椅', 0, 1.8, PI), sign('思想星座\n点一点星星', 2.4, 8.4, -0.3)]);
    var cs = [clip('music', 0, 30, 'pad'), clip('voice', 0.5, 0, 'speak', N.id, '抬头看，这是一个叫“发现”的星座。每颗星，都是一个想法。')];
    S.forEach(function (s, i) { cs.push(clip('action', 6 + i * 2.5, 7 + i * 2.5, 'appear', s.id), clip('action', 7 + i * 2.5, 9 + i * 2.5, 'spin', s.id)); });
    cs.push(clip('voice', 24, 0, 'speak', N.id, '从好奇开始，到分享结束，再从新的好奇开始。'), clip('music', 24, 32, 'chime'));
    return work('思想星座 · 发现', 'stars', 'night', objects, [zone('观星处', 0, 1, 2.8)], [{ x: 0, z: 9.5 }, { x: 0, z: 1.6 }], lenOf(cs, 34), cs);
  }

  /* 20 思想花园 — ideas planted as seeds grow, branch and flower */
  function ideaGarden() {
    var ideas = [['如果', -3, -4], ['为什么', -1, -5.4], ['试试看', 1.2, -4.4], ['原来如此', 3.2, -5.6], ['下一步', 0.2, -2.6]];
    var P = ideas.map(function (d) { return obj('sprout', '想法', d[1], d[2], 0, { text: d[0], life: life('', { tap: { text: '这棵想法叫：' + d[0] + '。', op: 'grow' } }) }); });
    var GD = obj('guide', '园丁', -4.4, -1, 0.6, { color: '#4f7a3d', life: life('这是一座思想花园。每个想法，都从一颗小种子开始。') });
    var objects = P.concat([GD, obj('lantern', '花园灯', -5.4, -3.6, 0, { color: '#fff2a8' }), obj('lantern', '花园灯', 5.4, -3.6, PI, { color: '#fff2a8' }), obj('tree', '树', 6.4, -7, 0), obj('tree', '树', -6.4, -7, 0), obj('bench', '长椅', 0, 1.8, PI), sign('思想花园\n看想法长大', 2.4, 8.4, -0.3)]);
    var cs = [clip('light', 0, 3, 'toDay'), clip('voice', 0.5, 0, 'speak', GD.id, '这是一座思想花园。每个想法，都从一颗小种子开始。'), clip('music', 0, 30, 'pad')];
    P.forEach(function (p, i) { cs.push(clip('action', 5 + i * 3, 9 + i * 3, 'grow', p.id)); });
    cs.push(clip('voice', 12, 0, 'speak', GD.id, '你问一个问题，它就长出一片叶子；你试一次，它就开一朵花。'), clip('light', 22, 26, 'toDusk'), clip('action', 26, 30, 'openArms', GD.id), clip('voice', 26, 0, 'speak', GD.id, '想法要常常浇水，它们才会一直长。'));
    return work('思想花园', 'garden', 'day', objects, [zone('花园里', 0, 0.8, 2.8)], [{ x: 0, z: 9.5 }, { x: 0, z: 1.4 }], lenOf(cs, 33), cs);
  }

  var MORE = [
    { id: 'minute', name: '一分钟思想剧场', icon: '⏱️', note: '一位讲解员，一分钟讲清一个概念', make: minuteTheater },
    { id: 'history', name: '微型历史舞台', icon: '⛵', note: '用人物、船和天色导演一段历史', make: historyStage },
    { id: 'illusion', name: '视角幻象', icon: '👁️', note: '站在不同位置，看到不同的东西', make: viewIllusion },
    { id: 'shadow', name: '影子剧场', icon: '🌘', note: '一盏灯、一面白幕，用影子讲寓言', make: shadowTheater },
    { id: 'mirror', name: '魔法镜子', icon: '🪞', note: '银色魔镜会说话、眨眼，回答你的问题', make: magicMirror },
    { id: 'gears', name: '思想机械仪', icon: '⚙️', note: '齿轮转动，讲一个原因带出的结果', make: thoughtMachine },
    { id: 'weather', name: '微型天气机器', icon: '🌦️', note: '点一下机器：晴、雨、雪、昼夜轮换', make: weatherMachine },
    { id: 'door', name: '神秘之门', icon: '🚪', note: '门打开，后面的秘密花园长出来', make: mysteryDoor },
    { id: 'living', name: '活的微缩世界', icon: '🏘️', note: '小村的一天：人们走来走去，天色变化', make: livingMiniature },
    { id: 'memory', name: '记忆房间', icon: '🖼', note: '点一点照片，它讲一个自己的故事', make: memoryRoom },
    { id: 'changing', name: '变化的房间', icon: '🔄', note: '拉一下装置，书房变成星空', make: changingRoom },
    { id: 'top', name: '概念陀螺', icon: '🌀', note: '三个环旋转、展开、再合上', make: conceptTop },
    { id: 'maze', name: '问题迷宫', icon: '🧩', note: '三道门三个问题，答完门就开', make: questionMaze },
    { id: 'stars', name: '思想星座', icon: '✨', note: '想法变成星星，一颗颗连成星座', make: constellation },
    { id: 'garden', name: '思想花园', icon: '🌱', note: '想法从种子长成会开花的植物', make: ideaGarden }
  ];
  var i = TP.list.map(function (t) { return t.id; }).indexOf('blank');
  Array.prototype.splice.apply(TP.list, [i < 0 ? TP.list.length : i, 0].concat(MORE));
})(window);

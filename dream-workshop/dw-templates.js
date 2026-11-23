/* Minest Dream Workshop · 梦工坊 — starting works (Phase 1: the Lincoln speech theater, and a blank stage).
 * A work: objects on a sandbox table, trigger zones, a guest route and a show timeline (seconds).
 * The Gettysburg Address (1863) is in the public domain; the voice is the device's own speech synthesis. */
(function (root) {
  'use strict';
  var uid = function (p) { return (p || 'o') + Math.random().toString(36).slice(2, 8); };
  var GETTYSBURG = 'Four score and seven years ago our fathers brought forth on this continent, a new nation, conceived in Liberty, and dedicated to the proposition that all men are created equal. ' +
    'Now we are engaged in a great civil war, testing whether that nation, or any nation so conceived and so dedicated, can long endure. We are met on a great battle-field of that war. We have come to dedicate a portion of that field, as a final resting place for those who here gave their lives that that nation might live. It is altogether fitting and proper that we should do this. ' +
    'But, in a larger sense, we can not dedicate, we can not consecrate, we can not hallow this ground. The brave men, living and dead, who struggled here, have consecrated it, far above our poor power to add or detract. The world will little note, nor long remember what we say here, but it can never forget what they did here. ' +
    'It is for us the living, rather, to be dedicated here to the unfinished work which they who fought here have thus far so nobly advanced. It is rather for us to be here dedicated to the great task remaining before us, that from these honored dead we take increased devotion to that cause for which they gave the last full measure of devotion, that we here highly resolve that these dead shall not have died in vain, that this nation, under God, shall have a new birth of freedom, and that government of the people, by the people, for the people, shall not perish from the earth.';

  function obj(kind, name, x, z, ry, extra) { return Object.assign({ id: uid(), kind: kind, name: name, x: x, y: 0, z: z, ry: ry || 0, s: 1 }, extra || {}); }

  function lincoln() {
    var L = obj('lincoln', '林肯', 0, -4.35, 0, { y: 0.6, life: { on: true, voice: { text: GETTYSBURG, lang: 'en-US', rate: 0.92, pitch: 0.85 }, lookAtGuest: true, lipSync: true, idle: true, tap: { text: 'Thank you for coming. Government of the people, by the people, for the people.', op: 'nod' } } });
    var objects = [
      obj('stage', '舞台', 0, -4, 0),
      obj('curtain', '幕布', 0, -6.3, 0),
      L,
      obj('podium', '演讲台', 0.95, -3.75, -0.35, { y: 0.6 }),
      obj('flag', '旗帜', -3.1, -5.4, 0, { y: 0.6 }),
      obj('flag', '旗帜', 3.1, -5.4, 0, { y: 0.6 }),
      obj('spot', '左聚光灯', -4.6, 1.2, Math.PI * 0.8),
      obj('spot', '右聚光灯', 4.6, 1.2, -Math.PI * 0.8),
      obj('bench', '第一排 · 左', -1.45, 1.4, Math.PI), obj('bench', '第一排 · 右', 1.45, 1.4, Math.PI),
      obj('bench', '第二排 · 左', -1.45, 2.9, Math.PI), obj('bench', '第二排 · 右', 1.45, 2.9, Math.PI),
      obj('bench', '第三排 · 左', -1.45, 4.4, Math.PI), obj('bench', '第三排 · 右', 1.45, 4.4, Math.PI),
      obj('lamp', '入口路灯', -1.9, 9.2, 0), obj('lamp', '入口路灯', 1.9, 9.2, 0),
      obj('sign', '入口告示牌', 2.9, 10.6, -0.35, { text: '林肯演讲剧场\nGreat Moments with Mr. Lincoln' }),
      obj('tree', '树', -6.5, 6, 0), obj('tree', '树', 6.8, 5.2, 0), obj('tree', '树', -7, -1.5, 0), obj('tree', '树', 7.2, -2.2, 0),
      obj('column', '立柱', -5, -6.2, 0), obj('column', '立柱', 5, -6.2, 0)
    ];
    var c = function (track, t0, t1, op, target) { return { id: uid('c'), track: track, t0: t0, t1: t1, op: op, target: target || null }; };
    return {
      title: '林肯演讲剧场', template: 'lincoln', env: { mood: 'theatre' }, objects: objects,
      zones: [{ id: uid('z'), name: '观众席', x: 0, z: 2.9, r: 3.3, enter: 'play', exit: 'fade' }],
      route: [{ x: 0, z: 13 }, { x: 0, z: 9.5 }, { x: 0.3, z: 6.6 }, { x: 0, z: 5.4 }],
      timeline: { len: 135, end: 'dark', clips: [
        c('light', 0, 3.5, 'up'),
        c('music', 0, 9, 'pad'),
        c('voice', 4, 122, 'speak', L.id),
        c('action', 4, 11, 'turnHead', L.id),
        c('action', 19, 25, 'raiseHand', L.id),
        c('action', 40, 44, 'nod', L.id),
        c('action', 66, 74, 'openArms', L.id),
        c('action', 98, 104, 'raiseHand', L.id),
        c('action', 122, 126, 'bow', L.id),
        c('music', 123, 131, 'fanfare'),
        c('light', 130, 134, 'down')
      ] }
    };
  }
  function blank() {
    return {
      title: '我的小剧场', template: 'blank', env: { mood: 'theatre' },
      objects: [obj('stage', '舞台', 0, -4, 0), obj('spot', '聚光灯', 3.8, 1.5, -Math.PI * 0.82), obj('bench', '长椅', 0, 2, Math.PI)],
      zones: [{ id: uid('z'), name: '观众区', x: 0, z: 2.4, r: 2.8, enter: 'play', exit: 'fade' }],
      route: [{ x: 0, z: 9 }, { x: 0, z: 3.4 }],
      timeline: { len: 30, end: 'dark', clips: [{ id: uid('c'), track: 'light', t0: 0, t1: 3, op: 'up', target: null }] }
    };
  }
  /* 魔法画像 — the portrait follows the guest with its eyes, greets them, and answers a tap */
  function portrait() {
    var P = obj('portrait', '魔法画像 · 伯爵夫人', 0, -2.75, 0, { color: '#5b2a3a', life: { on: true, voice: { text: '哎呀，有客人来了！我在这幅画里已经住了两百年，很少有人走得这么近。你看，我的眼睛一直跟着你呢。要是你愿意，就点一点画框，我告诉你一个秘密。', lang: 'zh-CN', rate: 1, pitch: 1.15 }, lookAtGuest: true, lipSync: true, idle: true, tap: { text: '秘密就是：每一幅画，都在悄悄看着看画的人。下次经过的时候，记得跟我打个招呼！', op: 'wink' } } });
    var objects = [
      obj('wall', '画廊墙', 0, -3.05, 0),
      P,
      obj('portrait', '静止的画像 · 骑士', -2.1, -2.8, 0, { y: 0.5, s: 0.72, color: '#2f3f5e', hair: '#5a4632' }),
      obj('portrait', '静止的画像 · 学者', 2.1, -2.8, 0, { y: 0.5, s: 0.72, color: '#3e4a2e' }),
      obj('column', '立柱', -3.35, -2.6, 0, { color: '#d9d1bf' }), obj('column', '立柱', 3.35, -2.6, 0, { color: '#d9d1bf' }),
      obj('spot', '画像聚光灯', 3.2, 1.6, -Math.PI * 0.83),
      obj('bench', '观赏长椅', 0, 2.6, Math.PI),
      obj('lamp', '画廊门灯', -1.6, 7.6, 0), obj('lamp', '画廊门灯', 1.6, 7.6, 0),
      obj('sign', '入口告示牌', 2.6, 8.4, -0.3, { text: '魔法画像\n走近它，它会看着你' }),
      obj('tree', '树', -5.5, 4.5, 0), obj('tree', '树', 5.8, 4, 0)
    ];
    var c = function (track, t0, t1, op, target) { return { id: uid('c'), track: track, t0: t0, t1: t1, op: op, target: target || null }; };
    return {
      title: '魔法画像', template: 'portrait', env: { mood: 'night' }, objects: objects,
      zones: [{ id: uid('z'), name: '画像前', x: 0, z: 0.4, r: 2.6, enter: 'play', exit: 'fade' }],
      route: [{ x: 0, z: 9.5 }, { x: 0, z: 5 }, { x: 0, z: 1.6 }],
      timeline: { len: 24, clips: [
        c('light', 0, 2.5, 'up'),
        c('music', 0, 6, 'chime', P.id),
        c('action', 1.5, 3.5, 'surprise', P.id),
        c('action', 3.5, 8, 'smile', P.id),
        c('voice', 3, 20, 'speak', P.id),
        c('action', 9, 13, 'turnHead', P.id),
        c('action', 14, 15.5, 'wink', P.id),
        c('action', 17, 21, 'smile', P.id),
        c('light', 22, 24, 'down')
      ] }
    };
  }
  /* 微型小船游览 — the guest rides a boat; three scenes along the canal each play their own part as it passes */
  function boatRide() {
    var V = obj('guide', '风车村村民', -5.6, 0.2, -Math.PI / 2, { color: '#a0522d', life: { on: true, voice: { text: '欢迎来到风车村！听，风车转起来的时候，整个村子都在唱歌。', lang: 'zh-CN', rate: 1, pitch: 1.05 }, lookAtGuest: true, lipSync: true, idle: true, tap: { text: '你好呀！风车今天转得特别快。', op: 'raiseHand' } } });
    var B = obj('figure', '船夫', 3.5, -9, -0.3, { color: '#2f5d8a', life: { on: true, voice: { text: '小心低头，我们要从灯笼桥下穿过去了。每一盏灯笼，都是一个人的愿望。', lang: 'zh-CN', rate: 0.95, pitch: 0.9 }, lookAtGuest: true, lipSync: true, idle: true, tap: { text: '许个愿吧，灯笼会替你记住。', op: 'nod' } } });
    var K = obj('guide', '城堡讲解员', 11.6, 4.6, -Math.PI / 2, { y: 0.36, color: '#6d3fa0', life: { on: true, voice: { text: '旅程的终点到了！谢谢你乘坐梦工坊小船，下次再来看我们的新故事。', lang: 'zh-CN', rate: 1, pitch: 1.1 }, lookAtGuest: true, lipSync: true, idle: true, tap: { text: '再见啦，旅行愉快！', op: 'bow' } } });
    var mill = obj('windmill', '风车', -12, 0.2, Math.PI / 2), br = obj('bridge', '灯笼桥', 0, -6, Math.PI / 2), fl = obj('flag', '终点旗', 11.2, 7.4, 0);
    var objects = [
      mill, obj('house', '小屋', -12.2, 4.2, Math.PI / 2), obj('house', '小屋', -12, -3.6, Math.PI / 2, { color: '#f3d9c0' }), V,
      obj('tree', '树', -6.5, 5.2, 0), obj('tree', '树', -8.6, -5.6, 0, { color: '#5f8a45' }),
      br, obj('lantern', '灯笼', -1.9, -8.2, 0), obj('lantern', '灯笼', 1.9, -8.2, Math.PI), obj('lantern', '灯笼', -1.9, -2.7, 0, { color: '#ffb347' }), obj('lantern', '灯笼', 1.9, -2.7, Math.PI, { color: '#ffb347' }), B,
      obj('stage', '终点舞台', 12.6, 3.2, -Math.PI / 2, { s: 0.6 }), K, fl, obj('flag', '终点旗', 11.2, 0.1, 0),
      obj('spot', '终点聚光灯', 6.4, 8.6, 2.31), obj('spot', '终点聚光灯', 5.4, 0.4, 1.13),
      obj('house', '城堡小屋', 14.2, 6.3, -Math.PI / 2, { color: '#d8d2e8' }), obj('column', '立柱', 13.8, 0.6, 0), obj('column', '立柱', 13.8, 6, 0),
      obj('sign', '码头告示牌', -11.2, 10.8, 0.5, { text: '梦工坊小船\n请坐好，船要开了' }), obj('lamp', '码头路灯', -7, 11, 0)
    ];
    var c = function (track, t0, t1, op, target) { return { id: uid('c'), track: track, t0: t0, t1: t1, op: op, target: target || null }; };
    return {
      title: '微型小船游览', template: 'boat', env: { mood: 'dusk' }, objects: objects,
      ride: { mode: 'boat', speed: 1.35 },
      zones: [
        { id: uid('z'), name: '风车村', x: -9, z: 1.5, r: 3.4, enter: 'play', exit: 'none', cue: { t0: 0, t1: 12 } },
        { id: uid('z'), name: '灯笼桥', x: 0, z: -5.6, r: 3.4, enter: 'play', exit: 'none', cue: { t0: 12, t1: 24 } },
        { id: uid('z'), name: '城堡终点', x: 9, z: 4.6, r: 3.6, enter: 'play', exit: 'none', cue: { t0: 24, t1: 38 } }
      ],
      route: [{ x: -9, z: 10.5 }, { x: -9, z: 2 }, { x: -6.5, z: -3.2 }, { x: 0, z: -6 }, { x: 6.5, z: -3.2 }, { x: 9, z: 2 }, { x: 9, z: 6.2 }],
      timeline: { len: 38, clips: [
        c('music', 0, 11.5, 'chime', mill.id),
        c('voice', 0.8, 6.5, 'speak', V.id), c('action', 0.8, 4.5, 'openArms', V.id),
        c('music', 12, 23.5, 'drum', br.id),
        c('voice', 12.5, 19, 'speak', B.id), c('action', 13, 17, 'nod', B.id),
        c('light', 24, 26.5, 'up'),
        c('music', 25, 33, 'fanfare', fl.id),
        c('voice', 25.5, 31.5, 'speak', K.id), c('action', 25.5, 29.5, 'raiseHand', K.id), c('action', 32, 35.5, 'bow', K.id)
      ] }
    };
  }
  /* phase 4 ------------------------------------------------------------------------------------------------------- */
  var say = function (text, rate) { var E = root.DWEngine; return E && E.sayTime ? E.sayTime({ text: text, rate: rate || 1 }) : text.length / 4 + 1; };
  var clip = function (track, t0, t1, op, target, text) { var c = { id: uid('c'), track: track, t0: t0, t1: t1, op: op, target: target || null }; if (text) { c.text = text; c.t1 = +(t0 + say(text)).toFixed(1); } return c; };
  /* 立体故事书 — the book opens, pages turn, and the story stands up around it */
  function storybook() {
    var BK = obj('book', '立体故事书', 0, -2.6, 0, { text: '小狐狸找月亮', color: '#2f5d8a', life: { on: true, voice: { text: '', lang: 'zh-CN', rate: 1, pitch: 1 }, tap: { text: '', op: 'startShow' } } });
    var N = obj('guide', '讲故事的人', -2.9, -2.4, 0.45, { color: '#7a4b8c', life: { on: true, voice: { text: '很久很久以前，森林里住着一只小狐狸。', lang: 'zh-CN', rate: 0.95, pitch: 1.05 }, lookAtGuest: true, lipSync: true, idle: true, tap: { text: '想再听一遍吗？点一点那本书，故事就从头开始。', op: 'nod' } } });
    var FOX = obj('figure', '小狐狸', 2.6, -2.2, -0.5, { s: 0.6, color: '#d9772b' }), TREE = obj('tree', '森林', 3.6, -4.2, 0), HOUSE = obj('house', '老奶奶的小屋', -3.8, -5.2, 0.3), MOON = obj('lantern', '月亮', 1.2, -5.6, 0, { color: '#fff2a8' });
    var objects = [BK, N, FOX, TREE, HOUSE, MOON,
      obj('spot', '聚光灯', 3.6, 1.6, -Math.PI * 0.8), obj('spot', '聚光灯', -3.6, 1.6, Math.PI * 0.8),
      obj('bench', '长椅', -1.2, 2.4, Math.PI), obj('bench', '长椅', 1.2, 2.4, Math.PI),
      obj('tree', '树', -6, 3, 0), obj('tree', '树', 6, 2.5, 0), obj('lamp', '路灯', 2, 8, 0),
      obj('sign', '告示牌', -2.2, 8.6, 0.3, { text: '立体故事书\n小狐狸找月亮' })];
    var L1 = '很久很久以前，森林里住着一只小狐狸。', L2 = '有一天晚上，小狐狸抬头一看——月亮不见了！', L3 = '它跑去问小屋里的老奶奶。老奶奶说：月亮掉进了湖里，在等一个勇敢的朋友。', L4 = '小狐狸找到了湖边，月亮又回到了天上。从此，小狐狸每天晚上都和月亮说晚安。';
    return {
      title: '立体故事书 · 小狐狸找月亮', template: 'storybook', env: { mood: 'night' }, objects: objects,
      zones: [{ id: uid('z'), name: '故事角', x: 0, z: 0.9, r: 2.7, enter: 'play', exit: 'fade' }],
      route: [{ x: 0, z: 9.5 }, { x: 0, z: 4.5 }, { x: 0, z: 1.4 }],
      timeline: { len: 62, clips: [
        clip('light', 0, 2.5, 'up'), clip('music', 0, 10, 'pad'),
        clip('action', 1, 3.5, 'open', BK.id),
        clip('voice', 3.5, 0, 'speak', N.id, L1), clip('action', 3.5, 7, 'openArms', N.id),
        clip('action', 9, 10.5, 'turnPage', BK.id), clip('action', 10, 11, 'appear', FOX.id), clip('action', 10.4, 11.4, 'appear', TREE.id),
        clip('voice', 11.5, 0, 'speak', N.id, L2), clip('action', 12, 14, 'point', N.id),
        clip('action', 18.5, 20, 'turnPage', BK.id), clip('action', 19.5, 20.5, 'appear', HOUSE.id),
        clip('voice', 21, 0, 'speak', N.id, L3),
        clip('action', 31, 32.5, 'turnPage', BK.id), clip('action', 32, 33, 'appear', MOON.id), clip('music', 32, 42, 'chime', MOON.id),
        clip('voice', 33.5, 0, 'speak', N.id, L4), clip('action', 34, 38, 'raiseHand', N.id),
        clip('action', 47, 50, 'bow', N.id), clip('action', 51, 54, 'close', BK.id), clip('light', 57, 60, 'down')
      ] }
    };
  }
  /* 时间机器 — pull the lever: the clock races, and three ages appear one after another */
  function timeMachine() {
    var CL = obj('clock', '时间机器', 0, -2.4, 0, { s: 1.25, life: { on: true, voice: { text: '欢迎来到时间机器！', lang: 'zh-CN', rate: 1, pitch: 0.9 }, tap: { text: '', op: 'startShow' } } });
    var SO = obj('figure', '苏格拉底', -3, -5, 0.4, { color: '#e8e2d4', life: { on: true, voice: { text: '我是苏格拉底。我唯一知道的，就是我一无所知。', lang: 'zh-CN', rate: 0.92, pitch: 0.85 }, lookAtGuest: true, lipSync: true, idle: true } });
    var C1 = obj('column', '雅典立柱', -4.6, -6.2, 0), C2 = obj('column', '雅典立柱', -1.6, -6.6, 0), C3 = obj('column', '雅典立柱', 1.4, -6.6, 0);
    var MILL = obj('windmill', '风车', 3.6, -6.4, 0), HS = obj('house', '风车村小屋', 5.8, -4, -0.6);
    var VI = obj('guide', '风车村村民', 2.8, -4.6, -0.4, { color: '#a0522d', life: { on: true, voice: { text: '这里是三百年前的风车村，人们靠风来磨麦子。', lang: 'zh-CN', rate: 1, pitch: 1.05 }, lookAtGuest: true, lipSync: true, idle: true } });
    var ST = obj('stage', '演讲台座', 0, -7.6, 0, { s: 0.55 }), LI = obj('lincoln', '林肯', 0, -7.4, 0, { y: 0.33, life: { on: true, voice: { text: '民有、民治、民享的政府，永远不会从地球上消失。', lang: 'zh-CN', rate: 0.9, pitch: 0.8 }, lookAtGuest: true, lipSync: true, idle: true } });
    var FL = obj('flag', '旗帜', 1.6, -7.8, 0, { y: 0.33 });
    var era = [C1, C2, C3, SO], era2 = [MILL, HS, VI], era3 = [ST, LI, FL];
    var objects = [CL].concat(era, era2, era3, [obj('spot', '聚光灯', 3.8, 1.2, -Math.PI * 0.82), obj('spot', '聚光灯', -3.8, 1.2, Math.PI * 0.82), obj('lamp', '路灯', -2, 8, 0), obj('sign', '告示牌', 2.2, 8.6, -0.3, { text: '时间机器\n点一下它，出发' })]);
    var c = [clip('light', 0, 2.5, 'up'),
      clip('voice', 0.5, 0, 'speak', CL.id, '欢迎乘坐时间机器！第一站：两千四百年前的雅典。'),
      clip('action', 4, 8, 'timeTravel', CL.id), clip('music', 4, 8, 'drum')];
    era.forEach(function (o, i) { c.push(clip('action', 8 + i * 0.3, 9 + i * 0.3, 'appear', o.id)); c.push(clip('action', 21, 22, 'vanish', o.id)); });
    c.push(clip('voice', 10, 0, 'speak', SO.id, '我是苏格拉底。我唯一知道的，就是我一无所知。'), clip('action', 10, 14, 'openArms', SO.id));
    c.push(clip('voice', 22, 0, 'speak', CL.id, '下一站：三百年前的风车村。'), clip('action', 24, 28, 'timeTravel', CL.id), clip('music', 24, 28, 'drum'));
    era2.forEach(function (o, i) { c.push(clip('action', 28 + i * 0.3, 29 + i * 0.3, 'appear', o.id)); c.push(clip('action', 40, 41, 'vanish', o.id)); });
    c.push(clip('voice', 30, 0, 'speak', VI.id, '这里是三百年前的风车村，人们靠风来磨麦子。'), clip('music', 29, 39, 'chime', MILL.id), clip('action', 30, 33, 'raiseHand', VI.id));
    c.push(clip('voice', 41, 0, 'speak', CL.id, '最后一站：一八六三年的美国。'), clip('action', 43, 47, 'timeTravel', CL.id), clip('music', 43, 47, 'drum'));
    era3.forEach(function (o, i) { c.push(clip('action', 47 + i * 0.3, 48 + i * 0.3, 'appear', o.id)); });
    c.push(clip('voice', 49, 0, 'speak', LI.id, '民有、民治、民享的政府，永远不会从地球上消失。'), clip('action', 49.5, 54, 'raiseHand', LI.id), clip('music', 56, 63, 'fanfare', FL.id));
    c.push(clip('voice', 58, 0, 'speak', CL.id, '旅行结束，欢迎回到现在！'));
    return {
      title: '时间机器 · 三个年代', template: 'timemachine', env: { mood: 'dusk' }, objects: objects,
      zones: [{ id: uid('z'), name: '时间机器前', x: 0, z: 1.2, r: 2.8, enter: 'none', exit: 'none' }],
      route: [{ x: 0, z: 9.5 }, { x: 0, z: 1.8 }],
      timeline: { len: 66, clips: c }
    };
  }
  /* 音乐盒世界 — the lid opens, the little stage turns, the dancers waltz */
  function musicBox() {
    var MB = obj('musicbox', '音乐盒', 0, -2.2, 0, { s: 1.4, life: { on: true, voice: { text: '', lang: 'zh-CN', rate: 1, pitch: 1 }, tap: { text: '', op: 'spin' } } });
    var SP = obj('guide', '音乐盒精灵', -2.8, -1.6, 0.5, { color: '#6d3fa0', life: { on: true, voice: { text: '嘘——音乐盒要醒来了。', lang: 'zh-CN', rate: 0.95, pitch: 1.2 }, lookAtGuest: true, lipSync: true, idle: true, tap: { text: '再听一遍吗？点一点音乐盒，它就会转起来。', op: 'nod' } } });
    var objects = [MB, SP,
      obj('lantern', '灯笼', -3.5, -4.5, 0, { color: '#ffb3e6' }), obj('lantern', '灯笼', 3.5, -4.5, Math.PI, { color: '#b3d4ff' }), obj('lantern', '灯笼', -4.2, 0.5, 0, { color: '#fff2a8' }), obj('lantern', '灯笼', 4.2, 0.5, Math.PI, { color: '#c8ffb3' }),
      obj('spot', '聚光灯', 3.2, 2, -Math.PI * 0.8), obj('spot', '聚光灯', -3.2, 2, Math.PI * 0.8),
      obj('chair', '座椅', -0.9, 2.4, Math.PI), obj('chair', '座椅', 0.9, 2.4, Math.PI),
      obj('sign', '告示牌', 2.2, 8.4, -0.3, { text: '音乐盒世界\n点一下音乐盒' })];
    return {
      title: '音乐盒世界', template: 'musicbox', env: { mood: 'night' }, objects: objects,
      zones: [{ id: uid('z'), name: '音乐盒前', x: 0, z: 1.2, r: 2.6, enter: 'play', exit: 'fade' }],
      route: [{ x: 0, z: 9.5 }, { x: 0, z: 1.8 }],
      timeline: { len: 32, clips: [
        clip('light', 0, 2, 'up'), clip('voice', 1, 0, 'speak', SP.id, '嘘——音乐盒要醒来了。'), clip('action', 1, 4, 'turnHead', SP.id),
        clip('action', 3, 5, 'open', MB.id), clip('music', 4.5, 27, 'chime', MB.id), clip('music', 6, 26, 'pad'),
        clip('action', 5, 26, 'spin', MB.id), clip('action', 14, 18, 'openArms', SP.id),
        clip('voice', 22, 0, 'speak', SP.id, '晚安，小舞者们。'), clip('action', 26, 28, 'close', MB.id), clip('light', 28, 31, 'down')
      ] }
    };
  }
  root.DWTemplates = {
    list: [
      { id: 'lincoln', name: '林肯演讲剧场', icon: '🎩', note: '人物说话、舞台演出、观众走近触发', make: lincoln },
      { id: 'portrait', name: '魔法画像', icon: '🖼️', note: '视线跟随、眨眼和表情，点一点画框它会回应', make: portrait },
      { id: 'boat', name: '微型小船游览', icon: '⛵', note: '坐船沿水道漂过三个场景，声音随距离变化', make: boatRide },
      { id: 'storybook', name: '立体故事书', icon: '📖', note: '书本打开、翻页，故事一页页立起来', make: storybook },
      { id: 'timemachine', name: '时间机器', icon: '🕰️', note: '点一下它，时钟飞转，三个年代依次出现', make: timeMachine },
      { id: 'musicbox', name: '音乐盒世界', icon: '🎶', note: '盖子打开，小舞台旋转，舞者跳起华尔兹', make: musicBox },
      { id: 'blank', name: '空白小剧场', icon: '🎭', note: '一座舞台、一盏灯和一张长椅，从头导演', make: blank }
    ],
    uid: uid
  };
})(window);

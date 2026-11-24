/* Minest Dream Workshop · 梦工坊 — Kid-Loved Immersive IP Worlds (Phase 7).
 * Ready-to-play & 1-click editable Disney-style IP worlds that children can experience immediately
 * or place directly onto My World's Disney World (theme-park-island) as living 3D portals! */
(function (root) {
  'use strict';
  var TP = root.DWTemplates, uid = TP.uid, PI = Math.PI;
  function obj(kind, name, x, z, ry, extra) { return Object.assign({ id: uid(), kind: kind, name: name, x: x, y: 0, z: z, ry: ry || 0, s: 1 }, extra || {}); }
  function life(text, tapText, tapOp, pitch) {
    return {
      on: true,
      voice: { text: text || '', lang: 'zh-CN', rate: 1, pitch: pitch || 1.08 },
      lookAtGuest: true, lipSync: true, idle: true,
      tap: { text: tapText || '你好呀小梦想家！祝你在乐园里玩得开心！', op: tapOp || 'openArms' }
    };
  }
  function sayLen(s) { var E = root.DWEngine; return E && E.sayTime ? E.sayTime({ text: s, rate: 1 }) : Math.max(2, s.length / 4 + 1); }
  function clip(tr, t0, t1, op, target, text) {
    var c = { id: uid('c'), track: tr, t0: t0, t1: t1, op: op, target: target || null };
    if (text) { c.text = text; c.t1 = +(t0 + sayLen(text)).toFixed(1); }
    return c;
  }
  function zone(name, x, z, r, exit) { return { id: uid('z'), name: name, x: x, z: z, r: r || 4.2, enter: 'play', exit: exit || 'fade' }; }

  /* 1. ❄️ 冰雪奇缘魔法王国 */
  function iceKingdom() {
    var P = obj('princess', '冰雪女王艾莎', 0, -2.2, 0, { color: '#38bdf8', life: life('欢迎来到冰雪魔法城堡！你看，天空飘起了晶莹的雪花，点一点旁边的冰雪水晶，还能召唤漫天烟花呢！', '愿冰雪魔法带给你勇气与快乐！快去点点魔法水晶吧！', 'openArms', 1.16) });
    var C1 = obj('crystal', '极光魔法水晶', -2.8, -1.5, 0, { color: '#38bdf8', life: life('', '叮！冰雪极光与礼花为你绽放啦！', 'fireworks') });
    var C2 = obj('crystal', '星辰冰晶', 2.8, -1.5, 0, { color: '#a855f7', life: life('', '晶莹的魔法正在旋转发光！', 'spin') });
    var U = obj('unicorn', '雪国独角兽', 3.4, 1.2, -0.6, { color: '#e0f2fe', life: life('', '咴咴～我是守护冰雪森林的独角兽，很高兴认识你！', 'nod', 1.2) });
    var objects = [
      obj('castle', '冰雪水晶宫殿', 0, -6.2, 0, { color: '#dbeafe', s: 1.15 }),
      P, C1, C2, U,
      obj('rainbow', '极光冰虹桥', 0, 4.2, 0, { s: 0.95 }),
      obj('firework', '冰雪礼花台', -4.6, -4.5, 0, { color: '#38bdf8' }),
      obj('firework', '冰雪礼花台', 4.6, -4.5, 0, { color: '#a855f7' }),
      obj('lantern', '冰晶灯', -2.4, 6.2, 0, { color: '#7dd3fc' }),
      obj('lantern', '冰晶灯', 2.4, 6.2, PI, { color: '#c4b5fd' }),
      obj('tree', '雪松', -6.2, -2.5, 0, { color: '#7dd3fc', s: 1.2 }),
      obj('tree', '雪松', 6.2, -2.5, 0, { color: '#7dd3fc', s: 1.2 }),
      obj('sign', '欢迎牌', 2.6, 8.2, -0.25, { text: '冰雪魔法王国\n点水晶放烟花 ✨' })
    ];
    var cs = [
      clip('light', 0, 2.5, 'up'),
      clip('light', 0, 3, 'snow'),
      clip('music', 0, 28, 'chime', C1.id),
      clip('music', 0, 28, 'pad'),
      clip('voice', 1, 0, 'speak', P.id, '欢迎来到冰雪魔法城堡！你看，天空飘起了晶莹的雪花！'),
      clip('action', 1, 5, 'openArms', P.id),
      clip('action', 5, 11, 'spin', C1.id),
      clip('action', 6, 12, 'spin', C2.id),
      clip('voice', 10, 0, 'speak', P.id, '走近点一点发光的魔法水晶，或者跟我打个招呼吧！'),
      clip('light', 15, 22, 'fireworks'),
      clip('action', 16, 20, 'bow', P.id)
    ];
    return {
      title: '冰雪奇缘魔法王国', template: 'ice_kingdom', ipTheme: { badge: '冰雪童话 IP', color: '#38bdf8', icon: '❄️' },
      env: { mood: 'night', warmth: 0.25 }, objects: objects,
      zones: [zone('冰雪广场', 0, 1.8, 5.2, 'none')],
      route: [{ x: 0, z: 9.5 }, { x: 0, z: 4.2 }, { x: 0, z: 1.2 }],
      timeline: { len: 30, clips: cs }
    };
  }

  /* 2. 🪄 奇幻魔法学院大礼堂 */
  function wizardSchool() {
    var W = obj('wizard', '小魔法师哈利', -1.8, -2.2, 0.25, { color: '#6d28d9', life: life('欢迎来到奇幻魔法学院！挥动魔杖，立体魔法书会自动翻开，墙上的画像也会开口说话哦！', '荧光闪烁！你今天想学哪一种快乐咒语？', 'raiseHand', 1.1) });
    var PT = obj('portrait', '学院守护画像', 0, -5.6, 0, { color: '#7c2d12', life: life('口令正确！欢迎新来的小巫师进入大礼堂！', '嘘——秘密通道就在神秘之门后面，点一下那扇门试试！', 'wink', 0.95) });
    var BK = obj('book', '咒语立体魔法书', 2.2, -1.8, -0.35, { color: '#581c87', text: '奇妙魔法书', life: life('', '魔法书翻开了新的一页！', 'open') });
    var DR = obj('door', '有求必应神秘门', 4.4, -4.4, -0.4, { color: '#4c1d95', life: life('', '咔哒！神秘之门为你敞开啦！', 'open') });
    var S1 = obj('star', '漂浮星火', -3.2, -3.5, 0, { color: '#fde047', text: '勇气', lift: 2.2, life: life('', '勇气之星闪闪发光！', 'spin') });
    var S2 = obj('star', '漂浮星火', 3.2, -3.5, 0, { color: '#38bdf8', text: '智慧', lift: 2.4, link: S1.id, life: life('', '智慧之星为你点亮！', 'spin') });
    var objects = [
      obj('wall', '礼堂石墙', 0, -5.9, 0, { color: '#312e81' }),
      PT, W, BK, DR, S1, S2,
      obj('column', '魔法石柱', -4.2, -5.6, 0, { color: '#cbd5e1' }),
      obj('column', '魔法石柱', 4.2, -5.6, 0, { color: '#cbd5e1' }),
      obj('treasure', '学院百宝箱', -3.8, -0.8, 0.5, { life: life('', '哇！宝箱里装满了金色幸运星！', 'open') }),
      obj('spot', '温暖烛光灯', -4.2, 2.2, PI * 0.8),
      obj('spot', '温暖烛光灯', 4.2, 2.2, -PI * 0.8),
      obj('sign', '欢迎牌', 2.5, 8.2, -0.25, { text: '奇幻魔法学院\n点魔法书与宝箱 🪄' })
    ];
    var cs = [
      clip('light', 0, 2, 'up'),
      clip('music', 0, 28, 'chime', BK.id),
      clip('voice', 0.8, 0, 'speak', W.id, '欢迎来到奇幻魔法学院！挥动魔杖，看看会发生什么奇迹吧！'),
      clip('action', 1, 4, 'raiseHand', W.id),
      clip('action', 3, 6, 'open', BK.id),
      clip('action', 6.5, 8.5, 'turnPage', BK.id),
      clip('voice', 9, 0, 'speak', PT.id, '口令正确！欢迎新来的小巫师，快点一点宝箱和魔法门探险吧！'),
      clip('action', 9, 13, 'smile', PT.id),
      clip('light', 17, 23, 'fireworks')
    ];
    return {
      title: '奇幻魔法学院', template: 'wizard_school', ipTheme: { badge: '魔法奇幻 IP', color: '#a855f7', icon: '🪄' },
      env: { mood: 'theatre', warmth: 0.85 }, objects: objects,
      zones: [zone('礼堂中央', 0, 1.5, 5.0, 'none')],
      route: [{ x: 0, z: 9.2 }, { x: 0, z: 1.8 }],
      timeline: { len: 28, clips: cs }
    };
  }

  /* 3. 🚀 星际玩具太空站 */
  function spaceStation() {
    var A = obj('astronaut', '星际队长巴斯', -1.8, -1.8, 0.2, { color: '#f8fafc', life: life('呼叫小宇航员！欢迎登上星际玩具太空站！点一点身后的星际火箭，我们一起飞向浩瀚银河！', '飞向宇宙，浩瀚无垠！准备点火升空！', 'raiseHand', 0.98) });
    var R = obj('robot', '机器伙伴瓦力', 2.0, -1.6, -0.25, { color: '#38bdf8', life: life('哔哔！检测到满满的快乐能量！', '哔哔啵啵！我是你的太空好朋友，我们一起看星星吧！', 'openArms', 1.25) });
    var RK = obj('rocket', '银河探索号火箭', 0, -5.2, 0, { color: '#ef4444', s: 1.25, life: life('', '三、二、一，星际火箭点火升空啦！', 'spin') });
    var TP1 = obj('top', '行星轨道仪', -4.2, -3.2, 0, { text: '地球\n月球\n火星', life: life('', '行星轨道正在高速旋转！', 'open') });
    var S1 = obj('star', '北极星', -3.5, -5.8, 0, { color: '#38bdf8', text: '猎户座', lift: 2.6, life: life('', '欢迎来到璀璨星海！', 'spin') });
    var S2 = obj('star', '超新星', 3.5, -5.8, 0, { color: '#f472b6', text: '仙女座', lift: 2.8, link: S1.id, life: life('', '星际航线已连接！', 'spin') });
    var objects = [
      RK, A, R, TP1, S1, S2,
      obj('word', '太空霓虹牌', 0, -7.8, 0, { text: 'SPACE DREAM', color: '#38bdf8' }),
      obj('crystal', '能量核心', 4.2, -2.8, 0, { color: '#22d3ee', life: life('', '太空站能量满格，发射庆祝烟花！', 'fireworks') }),
      obj('firework', '星际礼花炮', -4.8, 0.8, 0, { color: '#0ea5e9' }),
      obj('firework', '星际礼花炮', 4.8, 0.8, 0, { color: '#f43f5e' }),
      obj('sign', '登舱牌', 2.6, 8.2, -0.25, { text: '星际玩具太空站\n点火箭点火升空 🚀' })
    ];
    var cs = [
      clip('light', 0, 2, 'up'),
      clip('music', 0, 26, 'fanfare', RK.id),
      clip('voice', 0.8, 0, 'speak', A.id, '呼叫小宇航员！欢迎登上星际玩具太空站，飞向宇宙，浩瀚无垠！'),
      clip('action', 1, 4.5, 'raiseHand', A.id),
      clip('action', 5, 11, 'spin', RK.id),
      clip('voice', 9.5, 0, 'speak', R.id, '哔哔！快点一点红色星际火箭和能量水晶，亲自操控太空站吧！'),
      clip('action', 9.5, 13, 'openArms', R.id),
      clip('light', 15, 22, 'fireworks')
    ];
    return {
      title: '星际玩具太空站', template: 'space_station', ipTheme: { badge: '科幻太空 IP', color: '#0ea5e9', icon: '🚀' },
      env: { mood: 'night', warmth: 0.2 }, objects: objects,
      zones: [zone('太空舱甲板', 0, 1.8, 5.2, 'none')],
      route: [{ x: 0, z: 9.5 }, { x: 0, z: 2.0 }],
      timeline: { len: 26, clips: cs }
    };
  }

  /* 4. 🦕 侏罗纪恐龙欢乐谷 */
  function dinoValley() {
    var D1 = obj('dino', '小暴龙雷克斯', -1.8, -2.2, 0.25, { color: '#22c55e', s: 1.25, life: life('嗷呜～别害怕，我是最爱交朋友的小暴龙雷克斯！欢迎来到恐龙欢乐谷！', '嗷呜！给你表演一个恐龙开心点头舞！', 'nod', 0.88) });
    var D2 = obj('dino', '橙色小龙波波', 2.2, -2.6, -0.3, { color: '#f97316', s: 0.95, life: life('嗨！树林后面藏着一个神秘的黄金宝箱，快去打开看看吧！', '太棒啦！我们一起在草地上散步吧！', 'stroll', 1.18) });
    var G = obj('guide', '恐龙探险家', -4.2, 0.6, 0.5, { color: '#ca8a04', life: life('欢迎小探险家！这里的每一只小恐龙都可以点击互动哦！', '快去摸摸雷克斯，或者打开恐龙蛋宝箱吧！', 'point', 1.02) });
    var TR = obj('treasure', '远古黄金宝箱', 0.2, -4.6, 0, { s: 1.2, life: life('', '哇！你发现了恐龙谷的闪亮宝石与礼花！', 'fireworks') });
    var SP = obj('sprout', '远古巨型奇花', 4.4, -1.2, 0, { text: '奇幻森林', color: '#10b981', life: life('', '远古奇花越长越高啦！', 'grow') });
    var objects = [
      D1, D2, G, TR, SP,
      obj('mushroom', '彩色巨型蘑菇', -4.8, -4.2, 0.3, { color: '#ef4444' }),
      obj('mushroom', '荧光蓝蘑菇', 4.8, -4.6, -0.3, { color: '#3b82f6', s: 0.85 }),
      obj('bridge', '探险木石桥', 0, 4.4, 0),
      obj('tree', '热带雨林树', -6.4, -2.0, 0, { color: '#15803d', s: 1.35 }),
      obj('tree', '热带雨林树', 6.4, -2.4, 0, { color: '#16a34a', s: 1.3 }),
      obj('tree', '热带雨林树', -5.5, 3.6, 0, { color: '#22c55e', s: 1.1 }),
      obj('sign', '探险牌', 2.8, 8.6, -0.25, { text: '侏罗纪恐龙欢乐谷\n点小恐龙一起玩 🦕' })
    ];
    var cs = [
      clip('light', 0, 2, 'toDay'),
      clip('music', 0, 26, 'drum', D1.id),
      clip('voice', 0.8, 0, 'speak', D1.id, '嗷呜～我是最爱交朋友的小暴龙雷克斯！欢迎来到恐龙欢乐谷！'),
      clip('action', 1, 5, 'nod', D1.id),
      clip('voice', 8.5, 0, 'speak', D2.id, '嗨！我们身后藏着远古黄金宝箱，快走过来点一点打开它吧！'),
      clip('action', 9, 14, 'open', TR.id),
      clip('action', 10, 16, 'grow', SP.id)
    ];
    return {
      title: '侏罗纪恐龙欢乐谷', template: 'dino_valley', ipTheme: { badge: '恐龙探险 IP', color: '#22c55e', icon: '🦕' },
      env: { mood: 'day', warmth: 0.7 }, objects: objects,
      zones: [zone('恐龙谷草坪', 0, 1.6, 5.2, 'none')],
      route: [{ x: 0, z: 9.8 }, { x: 0, z: 4.4 }, { x: 0, z: 1.2 }],
      timeline: { len: 26, clips: cs }
    };
  }

  /* 5. 🦄 独角兽彩虹梦幻岛 */
  function unicornIsland() {
    var U = obj('unicorn', '彩虹独角兽星宝', -1.6, -1.6, 0.3, { color: '#fdf4ff', s: 1.15, life: life('欢迎来到云端彩虹岛！穿过七彩拱门，旋转木马和摩天轮都已经为你转起来啦！', '祝你每天都像彩虹一样绚丽开心！', 'nod', 1.2) });
    var P = obj('princess', '花仙子公主', 1.8, -1.8, -0.25, { color: '#f472b6', life: life('点一点旋转木马、八音盒或者精灵蘑菇屋，到处都藏着好听的音乐和烟花哦！', '送你一朵盛开的魔法鲜花与满天星光！', 'openArms', 1.18) });
    var CR = obj('carousel', '皇家童话旋转木马', -4.2, -4.5, 0, { color: '#ec4899', life: life('', '旋转木马加速欢快转起来啦！', 'spin') });
    var FW = obj('ferris', '云端彩虹摩天轮', 4.4, -4.8, 0, { color: '#38bdf8', life: life('', '摩天轮带着梦想升向彩虹云端！', 'spin') });
    var MB = obj('musicbox', '梦幻八音盒', 0, -5.2, 0, { color: '#db2777', life: life('', '八音盒舞者跳起了快乐华尔兹！', 'open') });
    var objects = [
      U, P, CR, FW, MB,
      obj('rainbow', '七彩迎宾拱门', 0, 3.6, 0, { s: 1.1 }),
      obj('mushroom', '糖果精灵屋', -5.6, 1.2, 0.4, { color: '#f43f5e' }),
      obj('mushroom', '薄荷精灵屋', 5.6, 1.2, -0.4, { color: '#a855f7' }),
      obj('firework', '彩虹烟花台', 0, -7.8, 0, { color: '#f472b6' }),
      obj('sign', '欢迎牌', 2.8, 8.4, -0.25, { text: '独角兽彩虹梦幻岛\n旋转木马与摩天轮 🦄' })
    ];
    var cs = [
      clip('light', 0, 2, 'up'),
      clip('music', 0, 28, 'chime', CR.id),
      clip('action', 0.5, 26, 'open', MB.id),
      clip('action', 1, 26, 'spin', CR.id),
      clip('action', 1, 26, 'spin', FW.id),
      clip('voice', 1, 0, 'speak', U.id, '欢迎来到云端彩虹岛！旋转木马和摩天轮都已经为你转起来啦！'),
      clip('voice', 9, 0, 'speak', P.id, '穿过七彩拱门，点一点每一件游乐设施体验惊喜吧！'),
      clip('action', 9, 13, 'openArms', P.id),
      clip('light', 15, 24, 'fireworks')
    ];
    return {
      title: '独角兽彩虹梦幻岛', template: 'unicorn_island', ipTheme: { badge: '梦幻童话 IP', color: '#f472b6', icon: '🦄' },
      env: { mood: 'dusk', warmth: 0.78 }, objects: objects,
      zones: [zone('彩虹花园', 0, 1.4, 5.4, 'none')],
      route: [{ x: 0, z: 9.5 }, { x: 0, z: 3.6 }, { x: 0, z: 1.0 }],
      timeline: { len: 28, clips: cs }
    };
  }

  /* 6. ⛵ 童话王国奇幻漂流（乘船游览） */
  function fairyCruise() {
    var G1 = obj('dino', '迎宾小恐龙', -5.4, 2.2, -PI / 2, { color: '#34d399', life: life('欢迎乘坐童话奇幻游船！第一站是精灵蘑菇湾！', '祝你一路顺风！', 'nod', 1.1) });
    var G2 = obj('wizard', '彩虹桥魔法师', 0, -9.2, 0, { color: '#8b5cf6', life: life('小船正在穿过七彩彩虹桥，抬头看看旋转的许愿星吧！', '星光护佑你的旅途！', 'raiseHand', 1.05) });
    var G3 = obj('princess', '星光城堡公主', 11.8, 4.4, -PI / 2, { color: '#ec4899', life: life('欢迎抵达终点星光童话城堡！为你点燃盛大的庆典烟花！', '太开心见到你啦，欢迎再坐一次游船！', 'openArms', 1.16) });
    var CR = obj('carousel', '河畔旋转木马', -12.4, -2.2, 0, { color: '#f472b6', life: life('', '', 'spin') });
    var CS = obj('castle', '终点星光城堡', 12.8, 0.2, -PI / 2, { s: 0.85, color: '#fce7f3' });
    var objects = [
      obj('mushroom', '精灵蘑菇屋', -12.2, 4.8, PI / 2, { color: '#ef4444' }),
      CR, G1,
      obj('rainbow', '水道彩虹门', 0, -6.0, PI / 2, { s: 1.05 }),
      obj('star', '许愿星', -2.2, -8.5, 0, { color: '#fde047', text: '快乐', lift: 2.5, life: life('', '', 'spin') }),
      obj('star', '许愿星', 2.2, -8.5, 0, { color: '#38bdf8', text: '梦想', lift: 2.5, life: life('', '', 'spin') }),
      G2,
      CS, G3,
      obj('firework', '城堡烟花台', 12.2, 7.6, 0, { color: '#fbbf24' }),
      obj('lantern', '河岸花灯', -6.2, -5.8, 0, { color: '#fb7185' }),
      obj('lantern', '河岸花灯', 6.2, -5.8, PI, { color: '#38bdf8' }),
      obj('sign', '游船码头', -11.2, 10.8, 0.45, { text: '童话奇幻漂流\n点「开船」出发 ⛵' })
    ];
    var cs = [
      clip('music', 0, 12, 'chime', CR.id),
      clip('action', 0, 12, 'spin', CR.id),
      clip('voice', 0.8, 0, 'speak', G1.id, '欢迎乘坐童话奇幻游船！第一站是欢乐的精灵蘑菇湾！'),
      clip('music', 12, 24, 'pad'),
      clip('voice', 13, 0, 'speak', G2.id, '小船正在穿过七彩彩虹桥，许下你的心愿吧！'),
      clip('action', 13, 17, 'raiseHand', G2.id),
      clip('light', 24, 36, 'fireworks'),
      clip('music', 24, 36, 'fanfare', CS.id),
      clip('voice', 25, 0, 'speak', G3.id, '欢迎抵达终点星光童话城堡！看，满天烟花都在为你欢呼！'),
      clip('action', 25, 30, 'openArms', G3.id)
    ];
    return {
      title: '童话王国奇幻漂流', template: 'fairy_cruise', ipTheme: { badge: '游船暗骑 IP', color: '#fbbf24', icon: '⛵' },
      env: { mood: 'night', warmth: 0.65 }, objects: objects,
      ride: { mode: 'boat', speed: 1.4 },
      zones: [
        { id: uid('z'), name: '精灵蘑菇湾', x: -9, z: 1.5, r: 3.8, enter: 'play', exit: 'none', cue: { t0: 0, t1: 12 } },
        { id: uid('z'), name: '彩虹许愿桥', x: 0, z: -5.8, r: 3.8, enter: 'play', exit: 'none', cue: { t0: 12, t1: 24 } },
        { id: uid('z'), name: '星光城堡港', x: 9, z: 4.2, r: 4.0, enter: 'play', exit: 'none', cue: { t0: 24, t1: 37 } }
      ],
      route: [{ x: -9, z: 10.5 }, { x: -9, z: 2 }, { x: -6.5, z: -3.2 }, { x: 0, z: -6 }, { x: 6.5, z: -3.2 }, { x: 9, z: 2 }, { x: 9, z: 6.0 }],
      timeline: { len: 37, clips: cs }
    };
  }

  /* 7. 🤖 未来机器人发明工坊 */
  function robotLab() {
    var R1 = obj('robot', '发明家小蓝', -1.6, -2.0, 0.25, { color: '#38bdf8', life: life('欢迎来到未来机器人发明工坊！每个大胆的想法，都能在这里变成现实！', '叮咚！你的奇思妙想指数是一百分！', 'raiseHand', 1.2) });
    var R2 = obj('robot', '音乐机器人小黄', 2.0, -2.0, -0.25, { color: '#facc15', life: life('点一点奇妙齿轮机和时光钟，看看未来科技怎么运转吧！', '哔哔～给你来一段快乐机械舞！', 'openArms', 1.3) });
    var GR = obj('gears', '超级发明齿轮机', -3.8, -4.4, 0.2, { life: life('', '发明齿轮机全速运转中！', 'spin') });
    var CL = obj('clock', '未来穿梭时光钟', 3.8, -4.4, -0.2, { life: life('', '时光穿梭启动，飞向未来世界！', 'timeTravel') });
    var objects = [
      R1, R2, GR, CL,
      obj('rocket', '试验小火箭', 0, -5.6, 0, { color: '#8b5cf6', life: life('', '试验火箭悬浮升空啦！', 'spin') }),
      obj('word', '工坊霓虹字', 0, -8.2, 0, { text: 'FUTURE LAB', color: '#22d3ee' }),
      obj('crystal', '量子水晶', 0, 0.6, 0, { s: 0.75, color: '#34d399', life: life('', '量子礼花绽放！', 'fireworks') }),
      obj('sign', '欢迎牌', 2.6, 8.2, -0.25, { text: '未来机器人发明工坊\n点机器人与齿轮机 🤖' })
    ];
    var cs = [
      clip('light', 0, 2, 'up'),
      clip('music', 0, 24, 'pad'),
      clip('action', 0, 22, 'spin', GR.id),
      clip('voice', 0.8, 0, 'speak', R1.id, '欢迎来到未来机器人发明工坊！每个大胆的想法，都能在这里变成现实！'),
      clip('action', 1, 4, 'raiseHand', R1.id),
      clip('voice', 8.5, 0, 'speak', R2.id, '点一点齿轮机、时光钟和小火箭，亲手启动你的科学发明吧！'),
      clip('action', 9, 14, 'timeTravel', CL.id)
    ];
    return {
      title: '未来机器人发明工坊', template: 'robot_lab', ipTheme: { badge: '科创未来 IP', color: '#22d3ee', icon: '🤖' },
      env: { mood: 'theatre', warmth: 0.35 }, objects: objects,
      zones: [zone('发明试验台', 0, 1.8, 5.0, 'none')],
      route: [{ x: 0, z: 9.2 }, { x: 0, z: 2.2 }],
      timeline: { len: 25, clips: cs }
    };
  }

  /* 8. 🎆 星光城堡烟花音乐会 */
  function castleConcert() {
    var P = obj('princess', '星光公主乐佩', -1.4, -2.6, 0.15, { y: 0.6, color: '#f472b6', life: life('欢迎来到星光城堡烟花音乐会！当音乐响起，整座夜空都会为你点亮！', '愿你的每一个梦想都能像烟花一样闪耀！', 'openArms', 1.18) });
    var W = obj('wizard', '烟花指挥家米奇风导师', 1.4, -2.6, -0.15, { y: 0.6, color: '#ef4444', life: life('准备好倒数了吗？三、二、一，漫天星光烟花秀正式开始！', '再来一轮超级礼花！看天空！', 'fireworks', 1.06) });
    var objects = [
      obj('castle', '星光童话大城堡', 0, -7.2, 0, { s: 1.25, color: '#fce7f3' }),
      obj('stage', '皇家音乐舞台', 0, -3.2, 0),
      P, W,
      obj('firework', '左礼花炮台', -5.2, -4.8, 0, { color: '#fbbf24' }),
      obj('firework', '右礼花炮台', 5.2, -4.8, 0, { color: '#38bdf8' }),
      obj('carousel', '广场旋转木马', -6.2, 1.5, 0, { s: 0.8, life: life('', '', 'spin') }),
      obj('ferris', '星空摩天轮', 6.4, 1.5, 0, { s: 0.85, life: life('', '', 'spin') }),
      obj('spot', '金色追光灯', -4.4, 2.4, PI * 0.82),
      obj('spot', '金色追光灯', 4.4, 2.4, -PI * 0.82),
      obj('bench', '贵宾长椅', -1.5, 3.2, PI),
      obj('bench', '贵宾长椅', 1.5, 3.2, PI),
      obj('sign', '节目单', 2.8, 8.6, -0.25, { text: '星光城堡烟花音乐会\n走近舞台开启大秀 🎆' })
    ];
    var cs = [
      clip('light', 0, 2.5, 'up'),
      clip('music', 0, 28, 'fanfare'),
      clip('voice', 0.8, 0, 'speak', P.id, '欢迎来到星光城堡烟花音乐会！当音乐响起，整座夜空都会为你点亮！'),
      clip('action', 1, 5, 'openArms', P.id),
      clip('voice', 8.5, 0, 'speak', W.id, '三、二、一，漫天星光烟花秀正式开始！'),
      clip('action', 8.5, 12, 'raiseHand', W.id),
      clip('light', 9.5, 27, 'fireworks'),
      clip('music', 12, 28, 'chime')
    ];
    return {
      title: '星光城堡烟花音乐会', template: 'castle_concert', ipTheme: { badge: '城堡大秀 IP', color: '#fbbf24', icon: '🎆' },
      env: { mood: 'night', warmth: 0.8 }, objects: objects,
      zones: [zone('城堡观众席', 0, 2.6, 5.4, 'none')],
      route: [{ x: 0, z: 10.2 }, { x: 0, z: 3.6 }],
      timeline: { len: 30, clips: cs }
    };
  }

  var IP_LIST = [
    { id: 'ice_kingdom', ip: true, badge: '❄️ 冰雪奇缘风', color: '#38bdf8', name: '冰雪奇缘魔法王国', icon: '❄️', note: '飘雪水晶宫殿、冰雪女王迎宾、点水晶放极光烟花', make: iceKingdom },
    { id: 'wizard_school', ip: true, badge: '🪄 魔法学院风', color: '#a855f7', name: '奇幻魔法学院', icon: '🪄', note: '会说话的画像、立体咒语书、漂浮星火与神秘门', make: wizardSchool },
    { id: 'space_station', ip: true, badge: '🚀 星际玩具风', color: '#0ea5e9', name: '星际玩具太空站', icon: '🚀', note: '宇航员与机器人伙伴、可点火升空的星际火箭', make: spaceStation },
    { id: 'dino_valley', ip: true, badge: '🦕 恐龙探险风', color: '#22c55e', name: '侏罗纪恐龙欢乐谷', icon: '🦕', note: '友善小暴龙互动、远古黄金宝箱与会生长的奇花', make: dinoValley },
    { id: 'unicorn_island', ip: true, badge: '🦄 梦幻童话风', color: '#f472b6', name: '独角兽彩虹梦幻岛', icon: '🦄', note: '七彩拱门、旋转木马、彩虹摩天轮与精灵蘑菇屋', make: unicornIsland },
    { id: 'fairy_cruise', ip: true, badge: '⛵ 奇幻漂流船', color: '#fbbf24', name: '童话王国奇幻漂流', icon: '⛵', note: '坐小船穿过精灵湾与彩虹桥，直达烟花城堡终点', make: fairyCruise },
    { id: 'robot_lab', ip: true, badge: '🤖 未来科创风', color: '#22d3ee', name: '未来机器人发明工坊', icon: '🤖', note: '双机器人互动、超级齿轮机、穿梭时光钟与火箭', make: robotLab },
    { id: 'castle_concert', ip: true, badge: '🎆 城堡烟花秀', color: '#fb7185', name: '星光城堡烟花音乐会', icon: '🎆', note: '童话大城堡、公主与魔法指挥家、盛大夜空烟花秀', make: castleConcert }
  ];

  Array.prototype.unshift.apply(TP.list, IP_LIST);
  root.DWIPWorlds = { list: IP_LIST };
})(window);

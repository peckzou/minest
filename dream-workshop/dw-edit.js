/* Minest Dream Workshop · 梦工坊 — the Imagineer edits the open work with fixed scene-editing tools.
 * "这个舞台太空了，加两排观众席，把灯光调得更温暖" becomes a short list of operations (add_rows, warmth …) that this file checks
 * and applies one by one — the world is never regenerated, so everything else stays exactly as the director left it,
 * and the whole change is one undo step. The operations come from Minest's AI (POST /api/minest/ai-imagineer-edit) or,
 * without it, from a small local reader of common phrasings (the panel says which). */
(function (root) {
  'use strict';
  var MK = root.DWModels.KINDS, canLive = root.DWModels.canLive, E = root.DWEngine, uid = root.DWTemplates.uid, PI = Math.PI;
  var ACTIONS = ['raiseHand', 'turnHead', 'nod', 'openArms', 'point', 'bow', 'smile', 'surprise', 'wink', 'stroll', 'open', 'close', 'turnPage', 'spin', 'timeTravel', 'grow', 'wilt', 'appear', 'vanish', 'startShow', 'fireworks'];
  var LIGHTS = ['up', 'down', 'toDay', 'toDusk', 'toNight', 'toTheatre', 'rain', 'snow', 'clear', 'fireworks'], MUSIC = ['pad', 'fanfare', 'drum', 'chime'];
  var MOODS = { theatre: '剧场', day: '白天', dusk: '黄昏', night: '夜晚' };
  function n(v, a, b, d) { v = +v; if (!isFinite(v)) v = d; return Math.max(a, Math.min(b, v)); }
  function inTable(x, z) { var d = Math.hypot(x, z), m = 14.5; return d > m ? { x: x / d * m, z: z / d * m } : { x: x, z: z }; }

  /* what the AI is told about the open work (ids are what its operations refer to) */
  function summary(w) {
    return {
      title: w.title, mood: (w.env || {}).mood || 'theatre', warmth: (w.env || {}).warmth == null ? 0.5 : w.env.warmth, audio: E.audioRange(), length: w.timeline.len, ride: (w.ride || {}).mode || 'walk',
      objects: w.objects.slice(0, 60).map(function (o) { return { id: o.id, kind: o.kind, name: o.name, x: +o.x.toFixed(1), z: +o.z.toFixed(1), facing: Math.round((o.ry || 0) * 180 / PI), alive: !!(o.life && o.life.on), script: o.life && o.life.voice ? String(o.life.voice.text || '').slice(0, 80) : '' }; }),
      zones: (w.zones || []).map(function (z) { return { id: z.id, name: z.name, x: z.x, z: z.z, r: z.r, exit: z.exit }; }),
      clips: w.timeline.clips.slice(0, 80).map(function (c) { return { id: c.id, track: c.track, op: c.op, target: c.target || '', start: c.t0, end: c.t1, text: c.text ? c.text.slice(0, 60) : '' }; })
    };
  }

  /* ---------------------------------------------------------------- applying operations (each one checked) */
  function find(w, t) {
    if (!t) return null; t = String(t);
    return w.objects.filter(function (o) { return o.id === t; })[0] || w.objects.filter(function (o) { return o.name === t; })[0] ||
      w.objects.filter(function (o) { return o.name && (o.name.indexOf(t) >= 0 || t.indexOf(o.name) >= 0); })[0] || w.objects.filter(function (o) { return o.kind === t; })[0] || null;
  }
  function findZone(w, t) { var zs = w.zones || []; if (!t) return zs.filter(function (z) { return z.enter === 'play'; })[0] || zs[0] || null; return zs.filter(function (z) { return z.id === t || z.name === t || (z.name || '').indexOf(t) >= 0; })[0] || null; }
  function place(w, kind, name, x, z, facing, extra) {
    var K = MK[kind]; if (!K) return null; var c = inTable(n(x, -15, 15, 0), n(z, -15, 15, 0));
    var o = Object.assign({ id: uid(), kind: kind, name: String(name || K.name).slice(0, 30), x: +c.x.toFixed(2), y: 0, z: +c.z.toFixed(2), ry: n(facing, -720, 720, 0) * PI / 180, s: 1 }, extra || {});
    if (K.color && !o.color) o.color = K.color; if (K.text != null && o.text == null) o.text = K.text;
    if (canLive(kind) && !o.life) o.life = { on: false, voice: { text: '', lang: 'zh-CN', rate: 1, pitch: 1 }, lookAtGuest: true, lipSync: true, idle: true };
    if (kind !== 'portrait') o.y = E.surfaceY(o.x, o.z, o.id);
    w.objects.push(o); return o;
  }
  function apply(w, ops) {
    var done = [], t = E.state().t;
    (ops || []).slice(0, 40).forEach(function (p) {
      if (!p || !p.action) return; var o = find(w, p.target), a = p.action;
      if (a === 'add' && MK[p.kind]) {
        var k = Math.max(1, Math.min(12, p.count | 0 || 1));
        for (var i = 0; i < k; i++) place(w, p.kind, p.name, n(p.x, -15, 15, 0) + i * 1.6, p.z, p.facing, p.text ? { text: String(p.text).slice(0, 60) } : null);
        done.push('加了 ' + k + ' 个「' + (p.name || MK[p.kind].name) + '」');
      } else if (a === 'add_rows') {
        var kind = MK[p.kind] ? p.kind : 'bench', rows = Math.max(1, Math.min(6, p.count | 0 || 1)), gap = n(p.value, 1.2, 4, kind === 'bench' ? 1.5 : 1.1);
        var same = w.objects.filter(function (q) { return q.kind === kind; }), z0 = same.length ? Math.max.apply(null, same.map(function (q) { return q.z; })) : (find(w, 'stage') ? find(w, 'stage').z + 5 : 1.5);
        var xs = same.length ? same.filter(function (q) { return Math.abs(q.z - z0) < 0.3; }).map(function (q) { return q.x; }) : (kind === 'bench' ? [-1.45, 1.45] : [-0.9, 0, 0.9]);
        if (!xs.length) xs = [0];
        for (var r = 1; r <= rows; r++) xs.forEach(function (x) { place(w, kind, MK[kind].name + ' · 新的第' + r + '排', x, z0 + gap * r, 180); });
        done.push('在观众席后面加了 ' + rows + ' 排' + MK[kind].name + '（每排 ' + xs.length + ' 张）');
      } else if (a === 'move' && o) { var c = inTable(n(p.x, -15, 15, o.x), n(p.z, -15, 15, o.z)); o.x = +c.x.toFixed(2); o.z = +c.z.toFixed(2); if (o.kind !== 'portrait') o.y = E.surfaceY(o.x, o.z, o.id); done.push('把「' + o.name + '」挪到了新位置'); }
      else if (a === 'turn' && o) { o.ry = n(p.facing, -720, 720, 0) * PI / 180; done.push('「' + o.name + '」转了方向'); }
      else if (a === 'scale' && o) { o.s = n(p.value, 0.3, 3, 1); done.push('「' + o.name + '」大小改成 ' + o.s.toFixed(2) + '×'); }
      else if (a === 'remove' && o) { w.objects = w.objects.filter(function (q) { return q.id !== o.id; }); w.timeline.clips = w.timeline.clips.filter(function (c) { return c.target !== o.id; }); done.push('移除了「' + o.name + '」'); }
      else if (a === 'rename' && o && p.name) { done.push('「' + o.name + '」改名为「' + String(p.name).slice(0, 30) + '」'); o.name = String(p.name).slice(0, 30); }
      else if (a === 'set_text' && o && MK[o.kind].text != null) { o.text = String(p.text || '').slice(0, 60); done.push('改了「' + o.name + '」上的字'); }
      else if (a === 'set_color' && o && /^#[0-9a-f]{6}$/i.test(p.text || '')) { o.color = p.text; done.push('「' + o.name + '」换了颜色'); }
      else if (a === 'life' && o && canLive(o.kind)) { o.life = o.life || { voice: { lang: 'zh-CN', rate: 1, pitch: 1 } }; o.life.on = true; if (p.text) o.life.voice.text = String(p.text).slice(0, 1500); done.push('「' + o.name + '」活过来了' + (p.text ? '，有了台词' : '')); }
      else if (a === 'tap' && o && canLive(o.kind)) { o.life = o.life || { voice: { text: '', lang: 'zh-CN', rate: 1, pitch: 1 } }; o.life.on = true; o.life.tap = { text: String(p.text || '').slice(0, 300), op: ACTIONS.indexOf(p.op) >= 0 ? p.op : '' }; done.push('观众点「' + o.name + '」时，它会回应'); }
      else if (a === 'zone_add') { var zc = inTable(n(p.x, -15, 15, 0), n(p.z, -15, 15, 2)); w.zones.push({ id: uid('z'), name: String(p.name || '触发区').slice(0, 20), x: +zc.x.toFixed(2), z: +zc.z.toFixed(2), r: n(p.value, 0.8, 8, 2.5), enter: 'play', exit: 'fade' }); done.push('画了一个触发区「' + (p.name || '触发区') + '」'); }
      else if (a === 'zone_radius') { var z = findZone(w, p.target); if (z) { z.r = n(p.value, 0.8, 8, z.r); done.push('「' + z.name + '」的触发距离改成 ' + z.r.toFixed(1) + ' 米'); } }
      else if (a === 'zone_exit') { var z2 = findZone(w, p.target); if (z2 && ['fade', 'stop', 'none'].indexOf(p.op) >= 0) { z2.exit = p.op; done.push('离开「' + z2.name + '」时：' + ({ fade: '声音和灯光淡出', stop: '立即停止', none: '继续演完' })[p.op]); } }
      else if (a === 'audio') { var near = n(p.value, 0.5, 30, 2.2), far = n(p.value2, near + 0.5, 60, near + 8); w.audio = { near: near, far: far }; done.push('声音距离：' + near + ' 米以内音量不变，越远越轻，到 ' + far + ' 米几乎听不见'); }
      else if (a === 'warmth') { w.env.warmth = n(p.value, 0, 1, 0.5); done.push('灯光调得' + (w.env.warmth > 0.6 ? '更温暖了' : w.env.warmth < 0.4 ? '更清冷了' : '回到了中性')); }
      else if (a === 'mood' && MOODS[p.text]) { w.env.mood = p.text; done.push('整体氛围换成了' + MOODS[p.text]); }
      else if (a === 'length') { w.timeline.len = n(p.value, 5, 600, w.timeline.len); done.push('演出时长改成 ' + Math.round(w.timeline.len) + ' 秒'); }
      else if (a === 'clip_add') {
        var s0 = p.start == null || p.start < 0 ? t : n(p.start, 0, 600, t), c2 = { id: uid('c'), track: p.track, op: p.op, t0: +s0.toFixed(1), t1: 0, target: null }, ok = false;
        if (p.track === 'light' && LIGHTS.indexOf(p.op) >= 0) { c2.t1 = s0 + n(p.end - p.start, 0.5, 60, /^to/.test(p.op) ? 4 : 3); ok = true; }
        else if (p.track === 'music' && MUSIC.indexOf(p.op) >= 0) { c2.t1 = s0 + n(p.end - p.start, 1, 120, 8); if (o) c2.target = o.id; ok = true; }
        else if (p.track === 'action' && ACTIONS.indexOf(p.op) >= 0 && o && (canLive(o.kind) || p.op === 'appear' || p.op === 'vanish')) { c2.t1 = s0 + n(p.end - p.start, 0.5, 60, 4); c2.target = o.id; ok = true; }
        else if (p.track === 'voice' && o && canLive(o.kind) && (p.text || (o.life && o.life.voice && o.life.voice.text))) {
          o.life = o.life || { voice: { lang: 'zh-CN', rate: 1, pitch: 1 } }; o.life.on = true; c2.op = 'speak'; c2.target = o.id; if (p.text) c2.text = String(p.text).slice(0, 600);
          c2.t1 = s0 + E.sayTime({ text: c2.text || o.life.voice.text, rate: o.life.voice.rate }); ok = true;
        }
        if (ok) { c2.t1 = +c2.t1.toFixed(1); w.timeline.clips.push(c2); if (c2.t1 > w.timeline.len) w.timeline.len = Math.ceil(c2.t1 + 2); done.push('在 ' + c2.t0 + ' 秒加了「' + (root.DWApp.opName(c2.op)) + '」' + (o ? '（' + o.name + '）' : '')); }
      }
      else if (a === 'clip_remove') { var before = w.timeline.clips.length; w.timeline.clips = w.timeline.clips.filter(function (c) { return c.id !== p.target; }); if (w.timeline.clips.length < before) done.push('删掉了时间轴上的一段'); }
      else if (a === 'clip_move') { var cm = w.timeline.clips.filter(function (c) { return c.id === p.target; })[0]; if (cm) { var dd = cm.t1 - cm.t0; cm.t0 = +n(p.start, 0, w.timeline.len, cm.t0).toFixed(1); cm.t1 = +(cm.t0 + dd).toFixed(1); done.push('把一段挪到了 ' + cm.t0 + ' 秒'); } }
      else if (a === 'route_add') { var rc = inTable(n(p.x, -15, 15, 0), n(p.z, -15, 15, 0)); w.route.push({ x: +rc.x.toFixed(2), z: +rc.z.toFixed(2) }); done.push('观众路线多了一个点'); }
    });
    return done;
  }

  /* ---------------------------------------------------------------- the local reader (no AI): common phrasings */
  var CN = { 一: 1, 两: 2, 二: 2, 三: 3, 四: 4, 五: 5, 六: 6, 七: 7, 八: 8, 九: 9, 十: 10, 半: 0.5 };
  function num(s) { if (s == null) return null; s = String(s); if (/^\d+(\.\d+)?$/.test(s)) return +s; if (s === '十') return 10; if (/^十.$/.test(s)) return 10 + (CN[s[1]] || 0); if (/^.十$/.test(s)) return (CN[s[0]] || 1) * 10; if (/^.十.$/.test(s)) return (CN[s[0]] || 1) * 10 + (CN[s[2]] || 0); return CN[s] != null ? CN[s] : null; }
  var N = '(\\d+(?:\\.\\d+)?|[一两二三四五六七八九十半]+)';
  var THINGS = { 公主: 'princess', 女王: 'princess', 艾莎: 'princess', 魔法师: 'wizard', 巫师: 'wizard', 宇航员: 'astronaut', 太空人: 'astronaut', 机器人: 'robot', 恐龙: 'dino', 霸王龙: 'dino', 独角兽: 'unicorn', 小马: 'unicorn', 城堡: 'castle', 皇宫: 'castle', 旋转木马: 'carousel', 木马: 'carousel', 摩天轮: 'ferris', 火箭: 'rocket', 飞船: 'rocket', 水晶: 'crystal', 宝石: 'crystal', 宝箱: 'treasure', 彩虹: 'rainbow', 蘑菇屋: 'mushroom', 蘑菇: 'mushroom', 烟花台: 'firework', 礼花: 'firework', 故事书: 'book', 音乐盒: 'musicbox', 八音盒: 'musicbox', 树: 'tree', 灯笼: 'lantern', 路灯: 'lamp', 聚光灯: 'spot', 旗帜: 'flag', 旗: 'flag', 立柱: 'column', 柱子: 'column', 长椅: 'bench', 椅子: 'chair', 座椅: 'chair', 小屋: 'house', 房子: 'house', 风车: 'windmill', 星星: 'star', 花: 'sprout', 告示牌: 'sign', 欢迎牌: 'sign', 演讲台: 'podium', 讲解员: 'guide', 向导: 'guide', 人: 'figure' };
  function local(text, w) {
    var s = String(text || ''), ops = [], m;
    if ((m = s.match(new RegExp('[加添多再]\\s*' + N + '?\\s*排\\s*(观众席|长椅|座位|座椅|椅子)')))) ops.push({ action: 'add_rows', kind: /椅子|座椅|座位/.test(m[2]) ? 'chair' : 'bench', count: num(m[1]) || 1 });
    if (/更?温暖|暖一点|暖一些|暖色|暖暖|暖和/.test(s)) ops.push({ action: 'warmth', value: 0.9 });
    else if (/冷一点|冷一些|冷色|清冷|冷冷|冰雪/.test(s)) ops.push({ action: 'warmth', value: 0.15 });
    var near = s.match(new RegExp(N + '\\s*米[^，。,；;]*?(开始|触发|亮|播放|演讲|说话)')), far = s.match(new RegExp('离开\\s*' + N + '\\s*米[^，。,；;]*?(减弱|变小|变轻|淡出|变弱|消失)'));
    if (near) { ops.push({ action: 'zone_radius', value: num(near[1]) }); if (far) ops.push({ action: 'zone_exit', op: 'none' }); }
    if (far) { var fv = num(far[1]); ops.push({ action: 'audio', value: fv, value2: fv + 7 }); }
    var md = s.match(/(变成?|换成?|调成?)\s*(白天|黄昏|傍晚|晚上|夜晚|夜里|星空|剧场)/); if (md) ops.push({ action: 'mood', text: { 白天: 'day', 黄昏: 'dusk', 傍晚: 'dusk', 晚上: 'night', 夜晚: 'night', 夜里: 'night', 星空: 'night', 剧场: 'theatre' }[md[2]] });
    if (/下雨/.test(s)) ops.push({ action: 'clip_add', track: 'light', op: 'rain', start: 0, end: 25 }); if (/下雪|飘雪/.test(s)) ops.push({ action: 'clip_add', track: 'light', op: 'snow', start: 0, end: 25 }); if (/放晴|雨停|雪停/.test(s)) ops.push({ action: 'clip_add', track: 'light', op: 'clear', start: -1, end: 2 });
    if (/放烟花|烟花秀|点燃烟花/.test(s)) ops.push({ action: 'clip_add', track: 'light', op: 'fireworks', start: 0, end: Math.max(15, w.timeline.len || 25) });
    var re = new RegExp('[加添放摆造]\\s*' + N + '?\\s*[棵盏个张面根座位朵颗只匹架艘台本顶道]?\\s*[小大]?\\s*(' + Object.keys(THINGS).sort(function (a, b) { return b.length - a.length; }).join('|') + ')', 'g');
    while ((m = re.exec(s))) { if (/排/.test(s.slice(Math.max(0, m.index - 1), m.index + m[0].length + 1))) continue; var k = THINGS[m[2]], cnt = num(m[1]) || 1, st = w.objects.filter(function (o) { return o.kind === 'stage'; })[0], bx = st ? st.x : 0, bz = st ? st.z + 2 : 0;
      for (var i = 0; i < Math.min(cnt, 8); i++) { var side = i % 2 ? 1 : -1, row = Math.floor(i / 2); ops.push({ action: 'add', kind: k, x: bx + side * (4.6 + row * 1.4), z: bz + row * 1.6, facing: k === 'spot' ? side * -145 : 0, count: 1 }); } }
    var rm = s.match(/(删掉|删除|去掉|拿走|移除)\s*([^\s，。,]+)/); if (rm) ops.push({ action: 'remove', target: rm[2].replace(/^(那个|这个|一个)/, '') });
    var ln = s.match(new RegExp('演出\\s*(长度|时长|时间)?\\s*(改成|设成|设为|为)?\\s*' + N + '\\s*秒')); if (ln) ops.push({ action: 'length', value: num(ln[3]) });
    var sp = s.match(/让?\s*([^\s，。,：:“"]{1,8})\s*(说|讲)\s*[：:]?\s*[“"]([^”"]+)[”"]/); if (sp) ops.push({ action: 'clip_add', track: 'voice', op: 'speak', target: sp[1], start: -1, end: 0, text: sp[3] });
    var lvl = s.match(/(让|使)?\s*([^\s，。,]{1,8}?)\s*(活过来|有生命)/); if (lvl) ops.push({ action: 'life', target: lvl[2] });
    return ops.length ? ops : null;
  }

  /* ---------------------------------------------------------------- asking the AI for operations */
  function ask(text, w) {
    var I = root.DWImagineer;
    return I.request('ai-imagineer-edit', { prompt: String(text).slice(0, 800), scene: summary(w) }).then(function (d) { if (!d.ops) throw new Error('AI 没有给出修改'); return d; });
  }
  root.DWEdit = { summary: summary, apply: apply, local: local, ask: ask };
})(window);

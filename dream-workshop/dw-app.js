/* Minest Dream Workshop · 奇想造梦工坊 (Imagineer 4.0).
 * Dual-mode workbench:
 *  - Default 🎈 Easy Kid Mode ("三步轻松造梦"):
 *      1. 🌈 选主题 / 一句话造梦 (8 flagship IP worlds + inline AI/Voice Dream Box)
 *      2. 🧸 放模型 (categorized visual toybox; every placed character/prop is AUTOMATICALLY alive & interactive!)
 *      3. 🪄 加魔法 (1-click sky, snow/rain/fireworks, boat cruise vs walk, music, and natural-language quick edit)
 *    + Floating 3D Quick Action Bar (`#dw-quickbar`) right on the canvas for effortless rotate, scale, color, duplicate & delete!
 *    + 1-click 「🏰 放到迪士尼乐园」 directly sends the world into My World's Disney World (`theme-park-island`)!
 *  - Optional 🎛 Pro Director Mode: preserves all 5 studios, 8 steps, trigger zones, and 4-track timeline. */
(function (root) {
  'use strict';
  var E = root.DWEngine, MK = root.DWModels.KINDS, TP = root.DWTemplates, uid = TP.uid, alive = root.DWModels.canLive;
  var $ = function (s, r) { return (r || document).querySelector(s); };
  var esc = function (s) { return String(s == null ? '' : s).replace(/[&<>"']/g, function (c) { return { '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' }[c]; }); };
  var PFX = 'sh:dw:work:';
  var OPS = { up: '灯光渐亮', down: '灯光渐暗', raiseHand: '挥手打招呼', turnHead: '转头张望', nod: '开心点头', openArms: '张开双臂欢迎', point: '指向前方', bow: '优雅鞠躬', speak: '说话', pad: '梦幻星空曲', fanfare: '皇家庆典号角', drum: '欢快探险鼓', chime: '八音盒铃声', smile: '微笑', surprise: '惊喜表情', wink: '调皮眨眼', open: '打开', close: '合上', turnPage: '翻页', spin: '欢乐旋转', timeTravel: '时光飞转', appear: '魔法出现', vanish: '魔法消失', startShow: '从头开演', toDay: '变白天', toDusk: '变黄昏', toNight: '变夜晚', toTheatre: '变剧场', rain: '下雨', snow: '飘雪', clear: '放晴', fireworks: '放烟花', grow: '开花生长', wilt: '枯萎', stroll: '快乐散步' };
  var ACTS = root.DWModels.actions, isProp = root.DWModels.isProp;
  var TRACKS = [{ id: 'light', name: '灯光特效' }, { id: 'action', name: '角色动作' }, { id: 'voice', name: '角色配音' }, { id: 'music', name: '背景音乐' }];
  var work = null, sel = null, tab = 'model', etab = 'ip', easy = true, toyCat = 'all', mode = 'select', undo = [], selClip = null, saveT = 0;
  var inlineIdea = '', inlineBusy = false;

  /* ---------------------------------------------------------------- storage */
  var S = root.MinestHomeStore;
  function sget(k) { if (S) return S.get(k); try { return JSON.parse(localStorage.getItem(k) || 'null'); } catch (e) { return null; } }
  function sset(k, v) { if (S) return S.set(k, v); try { localStorage.setItem(k, JSON.stringify(v)); } catch (e) {} }
  function skeys() { if (S) return S.keys(PFX); var o = []; try { for (var i = 0; i < localStorage.length; i++) { var k = localStorage.key(i); if (k.indexOf(PFX) === 0) o.push(k); } } catch (e) {} return o; }
  function works() { return skeys().map(function (k) { return sget(k); }).filter(function (w) { return w && w.id && !w.deleted; }).sort(function (a, b) { return (b.updated || 0) - (a.updated || 0); }); }
  function lsGet(k) { try { return localStorage.getItem(k); } catch (e) { return null; } }
  function lsSet(k, v) { try { localStorage.setItem(k, v); } catch (e) {} }
  function save(now) {
    clearTimeout(saveT); if (!work) return;
    var go = function () { saveT = 0; work.updated = Date.now(); sset(PFX + work.id, work); status(); };
    if (now) go(); else { work.updated = Date.now(); saveT = setTimeout(go, 450); }
  }
  function status() { var el = $('#dw-sync'); if (!el) return; el.textContent = S ? S.status().text : '已自动保存在本机'; }

  /* ---------------------------------------------------------------- history */
  function begin() { undo.push(JSON.stringify(work)); if (undo.length > 80) undo.shift(); $('#dw-undo').disabled = false; }
  function changed(soft) { E.sync(); save(); renderQuickBar(); if (!soft) renderPanel(); renderTimeline(); }
  function undoOnce(silent) {
    var s = undo.pop(); if (!s) return; var keep = work.id; work = JSON.parse(s); work.id = keep; work.updated = Date.now();
    if (sel && sel.type === 'obj' && !objOf(sel.id)) sel = null; E.setWork(work); E.select(sel); changed(); save(true); $('#dw-undo').disabled = !undo.length; shelfState(); if (silent !== true) toast('已撤销上一步');
  }

  /* ---------------------------------------------------------------- works & Disney Park bridge */
  function open(w) {
    E.exitGuest(); work = w; undo = []; sel = null; selClip = null; mode = 'select';
    work.timeline = work.timeline || { len: 30, clips: [] }; work.zones = work.zones || []; work.route = work.route || []; work.env = work.env || { mood: 'night' };
    lsSet('dw.last', w.id); E.setWork(work); E.resetView(); $('#dw-title').value = work.title || ''; $('#dw-undo').disabled = true; shelfState();
    renderQuickBar(); renderPanel(); renderTimeline(); status();
  }
  function shelfState() {
    var b = $('#dw-shelf'); if (!b || !work) return;
    b.setAttribute('aria-pressed', work.shelf ? 'true' : 'false');
  }
  $('#dw-shelf').onclick = function () {
    begin(); work.shelf = !work.shelf; save(true); shelfState();
    toast(work.shelf ? '已放入背包 · 可在乐园与房间中摆放' : '已从背包收起');
  };

  /* 🏰 放到迪士尼乐园！— Save & send straight to Disney World (theme-park-island) for 1-click placement! */
  function sendToDisneyPark() {
    if (!work) return;
    E.hush();
    work.shelf = true;
    save(true);
    shelfState();
    /* 1. Opened inside Disney World overlay (`MinestPavilion` / `MinestImagineerPark`) */
    try {
      if (root.parent && root.parent !== root) {
        if (root.parent.MinestImagineerPark && root.parent.MinestImagineerPark.placeDreamWork) {
          if (root.parent.MinestPavilion) root.parent.MinestPavilion.close();
          root.parent.MinestImagineerPark.placeDreamWork(work);
          return;
        }
        root.parent.postMessage({ type: 'minest-place-in-park', workId: work.id, work: work }, '*');
        if (root.parent.MinestPavilion) {
          root.parent.MinestPavilion.close();
          return;
        }
      }
    } catch (e) {}
    /* 2. Opened inside Minest Toolkit Host: switch straight to Theme Park with ?place=<id> */
    try {
      var topW = root.top || root.parent || root;
      if (topW && topW.MinestToolkitHost) {
        lsSet('tp.pendingPlaceWork', work.id);
        if (topW.MinestToolkitHost.themepark) { topW.MinestToolkitHost.themepark(work.id); return; }
      }
    } catch (e2) {}
    /* 3. Standalone page: jump directly to theme-park.html?place=<id> */
    lsSet('tp.pendingPlaceWork', work.id);
    location.href = '../theme-park-island/theme-park.html?place=' + encodeURIComponent(work.id);
  }
  $('#dw-place-park').onclick = sendToDisneyPark;
  /* 🏛 WED 工作坊 (wed-studio/, built from tools/wed-studio): the 1954 studio, with this work built on its model table */
  $('#dw-wed').onclick = function () {
    if (!work) return;
    E.hush(); save(true);
    location.href = 'wed-studio/index.html?work=' + encodeURIComponent(work.id);
  };
  $('#dw-gpark').onclick = sendToDisneyPark;

  function adopt(w) {
    w.id = uid('w'); w.created = Date.now(); w.shelf = true; open(w);
    w.objects.forEach(function (o) { if (o.kind !== 'portrait') o.y = E.surfaceY(o.x, o.z, o.id); });
    E.sync(); save(true);
    if (easy) setEasyTab('toys'); else setTab(w.objects.some(function (o) { return o.life && o.life.on; }) ? 'behavior' : 'model');
    var f = w.objects.filter(function (o) { return o.life && o.life.on; })[0]; if (f) { sel = { type: 'obj', id: f.id }; E.select(sel); renderQuickBar(); renderPanel(); }
    toast('✨ 梦想世界搭好啦！点右上角「🌟 走进世界」或「🏰 放到迪士尼乐园」');
  }
  function create(tid) { var t = TP.list.filter(function (x) { return x.id === tid; })[0] || TP.list[0], w = t.make(); w.id = uid('w'); w.created = Date.now(); w.shelf = true; open(w); save(true); }
  function objOf(id) { return work && work.objects.filter(function (o) { return o.id === id; })[0]; }

  /* ---------------------------------------------------------------- Easy vs Pro mode toggle */
  function setProMode(pro) {
    easy = !pro;
    document.body.classList.toggle('dw-easy', easy);
    E.showHelpers(!easy);
    var btn = $('#dw-pro-toggle');
    if (btn) {
      btn.setAttribute('aria-pressed', pro ? 'true' : 'false');
      btn.innerHTML = pro ? '🎈<span class="dw-lbl"> 切回轻松模式</span>' : '🎛<span class="dw-lbl"> 专业导演台</span>';
    }
    if (!easy) setTimeout(renderTimeline, 20);
    renderPanel();
  }
  $('#dw-pro-toggle').onclick = function () { setProMode(easy); };

  function setEasyTab(t) {
    etab = t;
    [].forEach.call(document.querySelectorAll('[data-etab]'), function (b) {
      b.setAttribute('aria-selected', b.dataset.etab === t ? 'true' : 'false');
    });
    renderPanel();
  }
  [].forEach.call(document.querySelectorAll('[data-etab]'), function (b) {
    b.onclick = function () { setEasyTab(b.dataset.etab); };
  });

  /* ---------------------------------------------------------------- Floating 3D Quick Action Bar */
  function renderQuickBar() {
    var qb = $('#dw-quickbar'); if (!qb) return;
    var o = sel && sel.type === 'obj' ? objOf(sel.id) : null;
    if (!o || E.inGuest()) { qb.hidden = true; return; }
    var K = MK[o.kind] || { icon: '✨', name: '物体' };
    qb.hidden = false;
    qb.innerHTML = '<b>' + K.icon + ' ' + esc(o.name) + '</b>' +
      '<button type="button" data-qrot="-1" title="向左转">↺ 左转</button>' +
      '<button type="button" data-qrot="1" title="向右转">↻ 右转</button>' +
      '<button type="button" data-qscale="1.15" title="放大">＋ 变大</button>' +
      '<button type="button" data-qscale="0.87" title="缩小">－ 变小</button>' +
      (K.color ? '<input type="color" data-qcol value="' + esc(o.color || K.color) + '" title="换颜色">' : '') +
      '<button type="button" data-qdup title="复制一个">⧉ 复制</button>' +
      '<button type="button" class="danger" data-qdel title="删除">🗑 移除</button>';
  }
  $('#dw-quickbar').addEventListener('click', function (e) {
    var b = e.target.closest('button'); if (!b || !sel || sel.type !== 'obj') return;
    var o = objOf(sel.id); if (!o) return;
    if (b.dataset.qrot) { begin(); o.ry = (o.ry || 0) + (+b.dataset.qrot) * Math.PI / 8; changed(true); }
    else if (b.dataset.qscale) { begin(); o.s = Math.max(0.4, Math.min(2.8, +((o.s || 1) * (+b.dataset.qscale)).toFixed(2))); if (o.kind !== 'portrait') o.y = E.surfaceY(o.x, o.z, o.id); changed(false); }
    else if (b.dataset.qdup != null) { var cp = JSON.parse(JSON.stringify(o)); begin(); cp.id = uid(); cp.x += 1.3; cp.z += 0.6; var cc = E.clampToTable(cp.x, cp.z); cp.x = cc.x; cp.z = cc.z; cp.y = E.surfaceY(cp.x, cp.z, cp.id); work.objects.push(cp); sel = { type: 'obj', id: cp.id }; E.sync(); E.select(sel); changed(); toast('已复制一个「' + cp.name + '」'); }
    else if (b.dataset.qdel != null) removeSel();
  });
  $('#dw-quickbar').addEventListener('input', function (e) {
    if (e.target.dataset.qcol != null && sel && sel.type === 'obj') {
      var o = objOf(sel.id); if (!o) return;
      if (!e.target._began) { begin(); e.target._began = true; e.target.addEventListener('change', function () { e.target._began = false; }, { once: true }); }
      o.color = e.target.value; E.sync(); save();
    }
  });

  /* ---------------------------------------------------------------- imports: Type Workshop works and My World things */
  var GAS = { neon: '#ff5a3c', argon: '#5aa0ff', helium: '#ffb3e6', krypton: '#dfe8ff', xenon: '#8a7dff', mercury: '#5affd2' };
  function hostWin(name) { var ws = [root.parent, root.top, root]; for (var i = 0; i < ws.length; i++) { try { if (ws[i] && ws[i][name]) return ws[i]; } catch (e) {} } return null; }
  function typeWorks() {
    var K = S && S.kn ? S.kn() : null; if (!K || !K.keys) return [];
    try { return K.keys('mtw:item:').map(function (k) { return K.get(k); }).filter(function (it) { return it && it.id && !it.deleted && it.word; }).slice(0, 16); } catch (e) { return []; }
  }
  function myThings() {
    var w = hostWin('MinestAI'), out = []; if (!w || !w.MinestAI.boards) return out;
    try { (w.MinestAI.boards() || []).forEach(function (b) { (b.columns || []).forEach(function (c) { (c.cards || []).forEach(function (k) { (k && k.stack || []).forEach(function (t) { if (t && t.id && t.title && out.length < 16) { var cv = t.cover; out.push({ id: t.id, title: String(t.title).slice(0, 40), list: String(k.title || c.title || ''), img: cv && cv.type !== 'color' ? (cv.value || cv.url || '') : '' }); } }); }); }); }); } catch (e) {}
    return out;
  }
  function importPanel() {
    var ws = typeWorks(), ts = myThings(), h = '<h3>导入我的作品</h3>';
    if (!ws.length && !ts.length) return '';
    if (ws.length) h += '<p class="dw-muted">文字工坊霓虹字</p><div class="dw-chips">' + ws.map(function (it) { return '<button class="dw-chip" data-imp="word:' + esc(it.id) + '">✨ ' + esc(String(it.word).slice(0, 14)) + '</button>'; }).join('') + '</div>';
    if (ts.length) h += '<p class="dw-muted">My World 收藏</p><div class="dw-chips">' + ts.map(function (t) { return '<button class="dw-chip" data-imp="pic:' + esc(t.id) + '">🖼 ' + esc(t.title.slice(0, 14)) + '</button>'; }).join('') + '</div>';
    return h;
  }
  function importThing(spec) {
    var kind = spec.split(':')[0], id = spec.slice(kind.length + 1), o;
    if (kind === 'word') { var it = typeWorks().filter(function (x) { return x.id === id; })[0]; if (!it) return; o = { kind: 'word', name: '霓虹字 · ' + String(it.word).slice(0, 10), text: String(it.word).slice(0, 24), color: GAS[it.gas] || MK.word.color, ref: { mtw: it.id } }; }
    else { var t = myThings().filter(function (x) { return x.id === id; })[0]; if (!t) return; o = { kind: 'picture', name: t.title.slice(0, 20), text: t.title, img: t.img || '', ref: { sid: t.id } }; }
    begin(); var c = E.clampToTable((Math.random() - 0.5) * 4, 2 + Math.random() * 2);
    Object.assign(o, { id: uid(), x: c.x, y: 0, z: c.z, ry: 0, s: 1 }); o.y = E.surfaceY(o.x, o.z, o.id);
    work.objects.push(o); sel = { type: 'obj', id: o.id }; E.sync(); E.select(sel); changed(); toast('导入了「' + o.name + '」');
  }

  /* ---------------------------------------------------------------- Selected Object Easy Card */
  function selectedEasyCard(o) {
    if (!o) return '';
    var K = MK[o.kind] || { icon: '✨', name: '模型' };
    var TXT = { sign: '欢迎牌上的字', book: '魔法书封面标题', word: '发光霓虹文字', picture: '画框文字', top: '星环上的字（每行一个）', star: '许愿星名字', sprout: '花朵心愿' };
    var h = '<div class="dw-selcard"><h4><span>' + K.icon + ' 正在装扮：' + esc(o.name) + '</span></h4>';
    h += '<label class="dw-f">名字<input data-o="name" value="' + esc(o.name) + '"></label>';
    if (TXT[o.kind]) h += '<label class="dw-f">' + TXT[o.kind] + '<textarea data-o="text" rows="2">' + esc(o.text || '') + '</textarea></label>';
    if (alive(o.kind)) {
      o.life = o.life || { on: true, voice: { text: '', lang: 'zh-CN', rate: 1, pitch: 1.08 }, lookAtGuest: true, lipSync: true, idle: true, tap: { text: '', op: ACTS(o.kind)[0] || 'openArms' } };
      var tp = o.life.tap || {};
      if (root.DWModels.isFigure(o.kind) || o.kind === 'portrait') {
        h += '<label class="dw-f">🗣 观众走近时，它说什么欢迎词？<textarea data-easyvoice rows="2" placeholder="例如：欢迎来到我的梦幻城堡！">' + esc((o.life.voice && o.life.voice.text) || '') + '</textarea></label>';
      }
      h += '<label class="dw-f">👆 小朋友点击它时，回应哪句话？<input data-tap="text" value="' + esc(tp.text || '') + '" placeholder="例如：祝你天天开心！"></label>';
      var acts = ACTS(o.kind).concat(['fireworks', 'startShow']);
      var seen = {}; acts = acts.filter(function (k) { if (seen[k] || !OPS[k]) return false; seen[k] = 1; return true; });
      h += '<label class="dw-f">✨ 点击它时的魔法动作<select data-tap="op">' + acts.map(function (k) { return '<option value="' + k + '"' + (tp.op === k ? ' selected' : '') + '>' + OPS[k] + '</option>'; }).join('') + '</select></label>';
      if (o.life.voice && o.life.voice.text) h += '<button type="button" class="dw-btn" data-listen>🔊 试听它的声音</button>';
    }
    h += '</div>';
    return h;
  }

  /* ---------------------------------------------------------------- Easy Mode Panel Renderer */
  var TOY_CATS = [
    ['all', '🌟 全部模型'],
    ['character', '👑 角色伙伴'],
    ['castle', '🏰 城堡建筑'],
    ['ride', '🎠 游乐设施'],
    ['magic', '✨ 魔法道具'],
    ['nature', '🌳 花园装饰']
  ];
  function currentWeather() {
    var cs = (work.timeline && work.timeline.clips) || [];
    if (cs.some(function (c) { return c.op === 'snow'; })) return 'snow';
    if (cs.some(function (c) { return c.op === 'rain'; })) return 'rain';
    return 'clear';
  }
  function hasFireworks() {
    return ((work.timeline && work.timeline.clips) || []).some(function (c) { return c.op === 'fireworks'; });
  }
  function currentMusic() {
    var m = ((work.timeline && work.timeline.clips) || []).filter(function (c) { return c.track === 'music'; })[0];
    return m ? m.op : 'none';
  }
  function renderEasyPanel() {
    var p = $('#dw-body'), o = sel && sel.type === 'obj' ? objOf(sel.id) : null, h = '';
    if (etab === 'ip') {
      h += '<div class="dw-dreambox"><h4>🪄 一句话变出你的梦想世界</h4>';
      h += '<div class="dw-irow"><textarea id="dw-easy-idea" rows="2" placeholder="说出或写下想法，例如：冰雪城堡前艾莎和独角兽放烟花！">' + esc(inlineIdea) + '</textarea><button type="button" class="dw-mic" id="dw-easy-mic" title="点击说话输入">🎤</button></div>';
      h += '<div class="dw-chips">' + [
        '冰雪城堡与独角兽飘雪放烟花',
        '太空宇航员与机器人在火箭旁开派对',
        '两只小恐龙在森林守护黄金宝箱',
        '坐小船穿过彩虹桥和旋转木马去城堡'
      ].map(function (s) { return '<button type="button" class="dw-chip" data-easyex="' + esc(s) + '">✨ ' + esc(s) + '</button>'; }).join('') + '</div>';
      h += '<button type="button" class="dw-btn dw-main" id="dw-easy-go"' + (inlineBusy ? ' disabled' : '') + '>' + (inlineBusy ? '✨ 正在为你变出 3D 世界…' : '✨ 立即变出这个世界！') + '</button></div>';

      var ips = (root.DWIPWorlds && root.DWIPWorlds.list) || TP.list.slice(0, 8);
      h += '<h3>🏰 一键选择热门 IP 主题世界 <small>点一下直接换装</small></h3><div class="dw-ipgrid">' +
        ips.map(function (t) {
          var on = work && work.template === t.id;
          return '<button type="button" class="dw-ipcard' + (on ? ' cur' : '') + '" data-picktpl="' + t.id + '">' +
            '<div class="top"><span class="ic">' + t.icon + '</span><span class="bdg" style="color:' + (t.color || '#fde68a') + '">' + esc(t.badge || '主题世界') + '</span></div>' +
            '<b>' + esc(t.name) + '</b><small>' + esc(t.note) + '</small></button>';
        }).join('') + '</div>';
      h += '<button type="button" class="dw-btn" id="dw-more-tpl" style="width:100%;margin-top:10px">📚 查看全部 30 种创意世界与我的存档…</button>';
    } else if (etab === 'toys') {
      h += selectedEasyCard(o);
      h += '<h3>🧸 点一下或拖进场景摆放 <small>自动赋予生命与互动</small></h3>';
      h += '<div class="dw-catpills">' + TOY_CATS.map(function (c) {
        return '<button type="button" class="' + (toyCat === c[0] ? 'on' : '') + '" data-toycat="' + c[0] + '">' + c[1] + '</button>';
      }).join('') + '</div>';
      var keys = Object.keys(MK).filter(function (k) { return toyCat === 'all' || MK[k].kidCat === toyCat; });
      h += '<div class="dw-shelf">' + keys.map(function (k) {
        return '<button type="button" class="dw-thing" data-add="' + k + '"><span>' + MK[k].icon + '</span>' + esc(MK[k].name) + '</button>';
      }).join('') + '</div>';
      h += importPanel();
    } else {
      h += selectedEasyCard(o);
      h += '<h3>🌅 天空与时间氛围</h3><div class="dw-magicgrid">' +
        [['day', '☀️ 晴朗白天'], ['dusk', '🌇 彩虹黄昏'], ['night', '🌙 璀璨星空'], ['theatre', '🎭 舞台追光']].map(function (m) {
          return '<button type="button" class="dw-mcard' + (work.env.mood === m[0] ? ' on' : '') + '" data-mood="' + m[0] + '">' + m[1] + '</button>';
        }).join('') + '</div>';

      var wt = currentWeather(), fw = hasFireworks();
      h += '<h3>❄️ 魔法天气与烟花秀</h3><div class="dw-magicgrid">' +
        '<button type="button" class="dw-mcard' + (wt === 'clear' ? ' on' : '') + '" data-easywt="clear">🌤 晴空万里</button>' +
        '<button type="button" class="dw-mcard' + (wt === 'snow' ? ' on' : '') + '" data-easywt="snow">❄️ 漫天飘雪</button>' +
        '<button type="button" class="dw-mcard' + (wt === 'rain' ? ' on' : '') + '" data-easywt="rain">🌧 奇幻细雨</button>' +
        '<button type="button" class="dw-mcard' + (fw ? ' on' : '') + '" data-easyfw>🎆 ' + (fw ? '烟花已开启' : '开启庆典烟花') + '</button>' +
        '</div>';

      var isBoat = work.ride && work.ride.mode === 'boat';
      h += '<h3>⛵ 小朋友怎样游览这个世界？</h3><div class="dw-magicgrid">' +
        '<button type="button" class="dw-mcard' + (!isBoat ? ' on' : '') + '" data-easyride="walk">🚶 自由漫步探索</button>' +
        '<button type="button" class="dw-mcard' + (isBoat ? ' on' : '') + '" data-easyride="boat">⛵ 乘小船奇幻漂流</button>' +
        '</div>';

      var mu = currentMusic();
      h += '<h3>🎵 乐园背景音乐</h3><div class="dw-magicgrid">' +
        [['chime', '🎶 八音盒铃声'], ['fanfare', '🎺 王国庆典号角'], ['pad', '🎹 温柔星空曲'], ['drum', '🥁 欢乐探险鼓'], ['none', '🔕 安静无配乐']].map(function (m) {
          return '<button type="button" class="dw-mcard' + (mu === m[0] ? ' on' : '') + '" data-easymusic="' + m[0] + '">' + m[1] + '</button>';
        }).join('') + '</div>';

      h += '<h3>🪄 一句话施展场景魔法</h3><div class="dw-irow"><input id="dw-quick-cmd" placeholder="如：加两只小恐龙、灯光暖一点" style="flex:1;background:#0f172a;border:1px solid var(--line);border-radius:10px;padding:8px 10px;color:#fff"><button type="button" class="dw-btn" id="dw-quick-cmd-go" style="margin:0">施法</button></div>';
    }
    h += '<div class="dw-row" style="margin-top:14px">' +
      '<button type="button" class="dw-btn dw-main" data-guest style="margin:0">🌟 走进世界沉浸体验</button>' +
      '<button type="button" class="dw-btn dw-parkbtn" id="dw-body-park" style="margin:0">🏰 放到迪士尼乐园</button></div>';
    p.innerHTML = h;
  }

  /* ---------------------------------------------------------------- Pro Mode Panel Renderer */
  function setTab(t) { tab = t; [].forEach.call(document.querySelectorAll('[data-tab]'), function (b) { b.setAttribute('aria-selected', b.dataset.tab === t ? 'true' : 'false'); }); if (t !== 'experience' && mode !== 'select') setMode('select'); renderPanel(); }
  function setMode(m) { mode = m; document.body.dataset.mode = m; var h = $('#dw-hint'); h.textContent = m === 'zone' ? '在地面上点一下，放下触发区' : m === 'route' ? '在地面上依次点出观众路线（从入口开始），完成后点「完成路线」' : ''; h.hidden = m === 'select'; renderPanel(); }
  function figureChips() {
    var fs = work.objects.filter(function (o) { return MK[o.kind] && alive(o.kind); });
    return fs.length ? '<div class="dw-chips">' + fs.map(function (o) { return '<button class="dw-chip" data-pick="' + o.id + '">' + (MK[o.kind].icon) + ' ' + esc(o.name) + '</button>'; }).join('') + '</div>' : '<p class="dw-muted">桌上还没有人物或魔法道具。去「造物」放一个。</p>';
  }
  function renderPanel() {
    if (!work) return;
    if (easy) { renderEasyPanel(); return; }
    var p = $('#dw-body'), o = sel && sel.type === 'obj' ? objOf(sel.id) : null, z = sel && sel.type === 'zone' ? (work.zones.filter(function (q) { return q.id === sel.id; })[0]) : null, h = '';
    if (tab === 'model') {
      h += '<h3>角色与道具</h3><div class="dw-shelf">' + Object.keys(MK).map(function (k) { return '<button class="dw-thing" data-add="' + k + '"><span>' + MK[k].icon + '</span>' + esc(MK[k].name) + '</button>'; }).join('') + '</div>';
      h += '<p class="dw-muted">点一下放到沙盘上，再在场景里拖到想要的位置。</p>' + importPanel();
      if (o) {
        h += '<h3>' + MK[o.kind].icon + ' ' + esc(o.name) + '</h3>';
        h += '<label class="dw-f">名字<input data-o="name" value="' + esc(o.name) + '"></label>';
        if (MK[o.kind].color) h += '<label class="dw-f">颜色<input type="color" data-o="color" value="' + esc(o.color || MK[o.kind].color) + '"></label>';
        var TXT = { sign: '牌子上的字（换行分成两行）', book: '封面上的书名', word: '霓虹字', picture: '画框里的字', top: '三个环上的字（每行一个）', star: '这颗星的名字', sprout: '这个想法' };
        if (TXT[o.kind]) h += '<label class="dw-f">' + TXT[o.kind] + '<textarea data-o="text" rows="' + (o.kind === 'top' ? 3 : 2) + '">' + esc(o.text || '') + '</textarea></label>';
        if (o.kind === 'star') {
          h += '<label class="dw-f">离地高度 <b>' + (o.lift == null ? 1.5 : +o.lift).toFixed(1) + ' 米</b><input type="range" min="0" max="5" step="0.1" data-o="lift" value="' + (o.lift == null ? 1.5 : o.lift) + '"></label>';
          h += '<label class="dw-f">连到另一颗星<select data-o="link"><option value="">不连</option>' + work.objects.filter(function (q) { return q.kind === 'star' && q.id !== o.id; }).map(function (q) { return '<option value="' + q.id + '"' + (o.link === q.id ? ' selected' : '') + '>' + esc(q.text || q.name) + '</option>'; }).join('') + '</select></label>';
        }
        if (o.kind === 'portrait') h += '<label class="dw-f">画框<select data-o="frame"><option value="">镀金画框</option><option value="silver"' + (o.frame === 'silver' ? ' selected' : '') + '>银色魔镜</option></select></label>';
        if (o.kind === 'spot') h += '<label class="dw-check"><input type="checkbox" data-o="shadow"' + (o.shadow ? ' checked' : '') + '> 🌘 投下影子（影子剧场用）</label><label class="dw-f">往下照的角度 <b>' + Math.round((o.tilt == null ? 0.55 : +o.tilt) * 57.3) + '°</b><input type="range" min="0" max="1.2" step="0.02" data-o="tilt" value="' + (o.tilt == null ? 0.55 : o.tilt) + '"></label>';
        h += '<label class="dw-f">大小 <b>' + (o.s || 1).toFixed(2) + '×</b><input type="range" min="0.5" max="2.5" step="0.05" data-o="s" value="' + (o.s || 1) + '"></label>';
        if (alive(o.kind)) h += '<button class="dw-btn dw-main" data-go="behavior">✨ 调整语音与动作 · Behavior</button>';
      }
    } else if (tab === 'story') {
      var im = work.imagineer || {};
      h += '<h3>构想</h3><label class="dw-f">一句话说说这件作品想让观众经历什么<textarea data-wi="idea" rows="2" placeholder="例如：观众走近时，冰雪公主欢迎大家并放烟花">' + esc(im.idea || '') + '</textarea></label>';
      var beats = work.timeline.clips.filter(function (c) { return c.track === 'voice' || (c.track === 'light' && c.op !== 'clear') || (c.track === 'action' && (c.op === 'appear' || c.op === 'open' || c.op === 'timeTravel')); }).sort(function (a, b) { return a.t0 - b.t0; });
      var L = work.timeline.len, part = function (t) { return t < L * 0.2 ? '开场' : t > L * 0.8 ? '结尾' : '展开'; }, last = '';
      h += '<h3>故事节拍 <small>' + beats.length + ' 个 · 共 ' + Math.round(L) + ' 秒</small></h3>';
      if (!beats.length) h += '<p class="dw-muted">还没有台词或灯光变化。去「赋能」给角色加台词，或在「导演」里加灯光。</p>';
      h += beats.map(function (c) {
        var o2 = c.target && objOf(c.target), pt = part(c.t0), head2 = pt !== last ? '<div class="dw-beatpart">' + pt + '</div>' : ''; last = pt;
        var line = c.track === 'voice' ? (c.text || (o2 && o2.life && o2.life.voice && o2.life.voice.text) || '') : '';
        return head2 + '<div class="dw-beat"><input type="number" min="0" step="0.5" data-ct0="' + c.id + '" value="' + c.t0 + '" aria-label="开始时间（秒）"><div class="dw-beatbody"><b>' + (c.track === 'voice' ? '🗣 ' + esc(o2 ? o2.name : '') : (c.track === 'light' ? '💡 ' : '✨ ') + (OPS[c.op] || c.op) + (o2 ? ' · ' + esc(o2.name) : '')) + '</b>' +
          (c.track === 'voice' ? '<textarea data-ctext="' + c.id + '" rows="2">' + esc(line) + '</textarea>' : '') + '</div></div>';
      }).join('');
    } else if (tab === 'behavior') {
      if (!o || !alive(o.kind)) {
        h += '<h3>选一个角色或互动道具</h3>' + figureChips();
      } else {
        var L2 = o.life || {}, v = L2.voice || {};
        h += '<h3>' + MK[o.kind].icon + ' ' + esc(o.name) + '</h3>';
        h += '<button class="dw-btn ' + (L2.on ? 'dw-on' : 'dw-main') + '" data-life>' + (L2.on ? '✨ 已经活了 · 点这里让它静止' : '✨ Bring to Life · 给它生命') + '</button>';
        if (L2.on) {
          h += '<h3>声音</h3><label class="dw-f">台词 / 欢迎词<textarea data-v="text" rows="4" placeholder="输入角色要说的话">' + esc(v.text || '') + '</textarea></label>';
          h += '<div class="dw-row"><label class="dw-f">语言<select data-v="lang">' + [['zh-CN', '中文'], ['en-US', 'English (US)'], ['en-GB', 'English (UK)'], ['zh-HK', '粤语'], ['ja-JP', '日本語']].map(function (l) { return '<option value="' + l[0] + '"' + ((v.lang || 'zh-CN') === l[0] ? ' selected' : '') + '>' + l[1] + '</option>'; }).join('') + '</select></label>';
          h += '<label class="dw-f">语速 <b>' + (v.rate || 1).toFixed(2) + '</b><input type="range" min="0.6" max="1.4" step="0.02" data-v="rate" value="' + (v.rate || 1) + '"></label>';
          h += '<label class="dw-f">音高 <b>' + (v.pitch == null ? 1 : v.pitch).toFixed(2) + '</b><input type="range" min="0.5" max="1.5" step="0.05" data-v="pitch" value="' + (v.pitch == null ? 1 : v.pitch) + '"></label></div>';
          h += '<div class="dw-row"><button class="dw-btn" data-listen>🔊 试听</button><button class="dw-btn" data-hush>⏹ 停</button></div>';
          if (!isProp(o.kind)) h += '<h3>表现</h3>' + [['lookAtGuest', '👀 视线跟随观众'], ['lipSync', '👄 说话时口型同步'], ['idle', '🫁 待机时轻轻呼吸']].map(function (q) { return '<label class="dw-check"><input type="checkbox" data-l="' + q[0] + '"' + (L2[q[0]] !== false ? ' checked' : '') + '> ' + q[1] + '</label>'; }).join('');
          h += '<h3>加到时间轴 <small>在 ' + E.state().t.toFixed(1) + ' 秒</small></h3><div class="dw-chips">' +
            (v.text ? '<button class="dw-chip dw-voice" data-clip="voice:speak">🗣 说上面的台词</button>' : '') + ACTS(o.kind).map(function (k) { return '<button class="dw-chip dw-act" data-clip="action:' + k + '">' + (OPS[k] || k) + '</button>'; }).join('') + '</div>';
          h += '<label class="dw-f">或者，单独说一句<textarea id="dw-line" rows="2" placeholder="例如：看，天上放烟花了！"></textarea></label><button class="dw-btn" data-clip="voice:line">🗣 把这一句加到 ' + E.state().t.toFixed(1) + ' 秒</button>';
          var tp = L2.tap || {};
          h += '<h3>观众点击它时</h3><label class="dw-f">回应台词<textarea data-tap="text" rows="2">' + esc(tp.text || '') + '</textarea></label>';
          h += '<label class="dw-f">同时做的动作<select data-tap="op"><option value="">不做动作</option>' + ACTS(o.kind).concat(['fireworks', 'startShow']).map(function (k) { return '<option value="' + k + '"' + (tp.op === k ? ' selected' : '') + '>' + (OPS[k] || k) + '</option>'; }).join('') + '</select></label>';
          var mine = work.timeline.clips.filter(function (c) { return c.target === o.id; }).sort(function (a, b) { return a.t0 - b.t0; });
          if (mine.length) h += '<ul class="dw-list">' + mine.map(function (c) { return '<li><button class="dw-link" data-seekclip="' + c.id + '">' + c.t0.toFixed(1) + 's · ' + (OPS[c.op] || c.op) + (c.text ? '：' + esc(c.text.slice(0, 18)) : '') + '</button><button class="dw-x" data-delclip="' + c.id + '" aria-label="删除">✕</button></li>'; }).join('') + '</ul>';
        }
      }
    } else if (tab === 'scene') {
      h += '<label class="dw-check"><input type="checkbox" data-snap' + (snapOn() ? ' checked' : '') + '> 📐 拖动时对齐网格（每 0.5 米）</label>';
      h += '<h3>灯光冷暖</h3><input type="range" min="0" max="1" step="0.05" data-warm value="' + (work.env.warmth == null ? 0.5 : work.env.warmth) + '">';
      h += '<h3>氛围</h3><div class="dw-chips">' + [['theatre', '🎭 剧场'], ['day', '☀️ 白天'], ['dusk', '🌇 黄昏'], ['night', '🌙 夜晚']].map(function (m) { return '<button class="dw-chip' + (work.env.mood === m[0] ? ' dw-sel' : '') + '" data-mood="' + m[0] + '">' + m[1] + '</button>'; }).join('') + '</div>';
      if (o) {
        h += '<h3>' + MK[o.kind].icon + ' ' + esc(o.name) + '</h3>';
        h += '<div class="dw-row"><button class="dw-btn" data-rot="-1">↺ 左转</button><button class="dw-btn" data-rot="1">↻ 右转</button><button class="dw-btn" data-face>🎯 面向观众</button></div>';
        h += '<div class="dw-row"><button class="dw-btn" data-dup>⧉ 复制</button><button class="dw-btn dw-danger" data-del>🗑 移除</button></div>';
        h += '<h3>在演出里 <small>' + E.state().t.toFixed(1) + ' 秒</small></h3><div class="dw-chips"><button class="dw-chip dw-act" data-clip="action:appear">✨ 魔法出现</button><button class="dw-chip dw-act" data-clip="action:vanish">💨 魔法消失</button></div>';
      }
      h += '<h3>场景里的全部模型 <small>' + work.objects.length + '</small></h3><ul class="dw-list">' + work.objects.map(function (q) { return '<li' + (o && o.id === q.id ? ' class="dw-cur"' : '') + '><button class="dw-link" data-pick="' + q.id + '">' + (MK[q.kind] ? MK[q.kind].icon : '✨') + ' ' + esc(q.name) + '</button></li>'; }).join('') + '</ul>';
    } else {
      h += '<div class="dw-journey">' + ['远处看见', '好奇', '走近', '触发演出', '互动', '离开'].map(function (s) { return '<span>' + s + '</span>'; }).join('<i>→</i>') + '</div>';
      h += '<h3>触发区</h3>';
      h += work.zones.map(function (q) {
        var on = z && z.id === q.id;
        return '<div class="dw-zone' + (on ? ' dw-cur' : '') + '"><div class="dw-row"><button class="dw-link" data-zone="' + q.id + '">⚡ ' + esc(q.name) + '</button><button class="dw-x" data-delzone="' + q.id + '">✕</button></div>' +
          (on ? '<label class="dw-f">名字<input data-z="name" value="' + esc(q.name) + '"></label><label class="dw-f">范围 <b>' + q.r.toFixed(1) + ' 米</b><input type="range" min="0.8" max="8" step="0.1" data-z="r" value="' + q.r + '"></label>' +
            '<div class="dw-row"><label class="dw-f">演第几秒起<input type="number" min="0" step="0.5" data-z="cue0" placeholder="从头" value="' + (q.cue && q.cue.t0 != null ? q.cue.t0 : '') + '"></label><label class="dw-f">到第几秒<input type="number" min="0" step="0.5" data-z="cue1" placeholder="演完" value="' + (q.cue && q.cue.t1 != null ? q.cue.t1 : '') + '"></label></div>' +
            '<div class="dw-row"><label class="dw-f">观众走进来<select data-z="enter"><option value="play"' + (q.enter === 'play' ? ' selected' : '') + '>演出开始</option><option value="none"' + (q.enter !== 'play' ? ' selected' : '') + '>不触发</option></select></label>' +
            '<label class="dw-f">观众离开<select data-z="exit"><option value="fade"' + (q.exit === 'fade' ? ' selected' : '') + '>淡出</option><option value="stop"' + (q.exit === 'stop' ? ' selected' : '') + '>停止</option><option value="none"' + (q.exit === 'none' ? ' selected' : '') + '>继续演完</option></select></label></div>' : '') + '</div>';
      }).join('');
      h += '<button class="dw-btn" data-mode="zone">' + (mode === 'zone' ? '… 在地面上点一下' : '＋ 画一个触发区') + '</button>';
      h += '<h3>观众路线 <small>' + work.route.length + ' 个点</small></h3><div class="dw-row"><button class="dw-btn' + (mode === 'route' ? ' dw-on' : '') + '" data-mode="route">' + (mode === 'route' ? '✓ 完成路线' : '✏️ 画路线') + '</button><button class="dw-btn" data-clearroute' + (work.route.length ? '' : ' disabled') + '>清除</button></div>';
      var rd = work.ride || { mode: 'walk', speed: 1.3 };
      h += '<div class="dw-row"><label class="dw-f">游览方式<select data-ride="mode"><option value="walk"' + (rd.mode !== 'boat' ? ' selected' : '') + '>🚶 步行</option><option value="boat"' + (rd.mode === 'boat' ? ' selected' : '') + '>⛵ 乘船游览</option></select></label>' +
        (rd.mode === 'boat' ? '<label class="dw-f">船速 <b>' + (rd.speed || 1.3).toFixed(1) + ' 米/秒</b><input type="range" min="0.6" max="3" step="0.1" data-ride="speed" value="' + (rd.speed || 1.3) + '"></label>' : '') + '</div>';
      h += '<h3>演出特效与配乐</h3><div class="dw-row"><label class="dw-f">时长（秒）<input type="number" min="5" max="600" step="1" data-len value="' + Math.round(work.timeline.len) + '"></label></div>';
      h += '<div class="dw-chips"><button class="dw-chip dw-light" data-clip="light:up">💡 灯光渐亮</button><button class="dw-chip dw-light" data-clip="light:down">🌑 灯光渐暗</button>' +
        '<button class="dw-chip dw-light" data-clip="light:fireworks">🎆 庆典烟花</button>' +
        '<button class="dw-chip dw-light" data-clip="light:toDay">☀️ 变白天</button><button class="dw-chip dw-light" data-clip="light:toDusk">🌇 变黄昏</button><button class="dw-chip dw-light" data-clip="light:toNight">🌙 变夜晚</button>' +
        '<button class="dw-chip dw-light" data-clip="light:rain">🌧 下雨</button><button class="dw-chip dw-light" data-clip="light:snow">❄️ 飘雪</button><button class="dw-chip dw-light" data-clip="light:clear">🌤 放晴</button>' +
        ['pad', 'fanfare', 'drum', 'chime'].map(function (k) { return '<button class="dw-chip dw-music" data-clip="music:' + k + '">🎵 ' + OPS[k] + '</button>'; }).join('') + '</div>';
      h += '<button class="dw-btn dw-main dw-big" data-guest>🌟 走进世界沉浸体验</button>';
    }
    p.innerHTML = h;
    steps();
  }

  var STEPS = [['dream', '构想', 'Dream'], ['story', '故事', 'Story'], ['model', '造物', 'Model'], ['scene', '布景', 'Scene'], ['behavior', '赋能', 'Behavior'], ['experience', '导演', 'Direction'], ['preview', '体验', 'Preview'], ['place', '放入乐园', 'Place']];
  function steps() {
    var el = $('#dw-steps'); if (!el || !work) return;
    var tl = work.timeline.clips, ok = {
      dream: !!(work.imagineer && work.imagineer.idea) || !!work.template, story: tl.some(function (c) { return c.track === 'voice'; }), model: work.objects.length > 0, scene: work.objects.length > 2,
      behavior: work.objects.some(function (o) { return o.life && o.life.on; }), experience: (work.zones || []).length > 0 && (work.route || []).length > 1, preview: !!work.previewed, place: !!work.shelf
    };
    el.innerHTML = STEPS.map(function (s, i) { return '<button type="button" data-step="' + s[0] + '" class="' + (ok[s[0]] ? 'ok' : '') + (tab === s[0] ? ' cur' : '') + '"><i>' + (ok[s[0]] ? '✓' : i + 1) + '</i>' + s[1] + '<small>' + s[2] + '</small></button>'; }).join('<span aria-hidden="true">›</span>');
  }

  /* ---------------------------------------------------------------- Automatic Bring-to-Life on Model Add! */
  function addThing(kind, at) {
    begin();
    var K = MK[kind]; if (!K) return;
    var c = at ? E.clampToTable(at.x, at.z) : E.clampToTable(sel && sel.type === 'obj' && objOf(sel.id) ? objOf(sel.id).x + 1.8 : (Math.random() - 0.5) * 4, sel && sel.type === 'obj' && objOf(sel.id) ? objOf(sel.id).z + 0.6 : -1 + Math.random() * 2.5);
    var o = { id: uid(), kind: kind, name: K.name, x: +c.x.toFixed(2), y: 0, z: +c.z.toFixed(2), ry: K.cat === 'set' && kind === 'bench' ? Math.PI : 0, s: 1 };
    if (K.color) o.color = K.color; if (K.text) o.text = K.text;
    if (alive(kind)) {
      var isChar = root.DWModels.isFigure(kind) || kind === 'portrait';
      var defHello = isChar ? ('嗨！欢迎来到我的世界，我是' + K.name + '！') : '';
      var defAct = ACTS(kind)[0] || 'openArms';
      o.life = {
        on: true,
        voice: { text: defHello, lang: 'zh-CN', rate: 1, pitch: kind === 'dino' ? 0.9 : 1.08 },
        lookAtGuest: true, lipSync: true, idle: true,
        tap: { text: isChar ? ('你好呀小梦想家！我是' + K.name + '，祝你玩得开心！') : ('✨ 你触发了「' + K.name + '」的奇妙魔法！'), op: defAct }
      };
      if (isChar && !work.timeline.clips.some(function (cl) { return cl.track === 'voice'; })) {
        var dur = E.sayTime(o.life.voice);
        work.timeline.clips.push({ id: uid('c'), track: 'voice', op: 'speak', t0: 1, t1: +(1 + dur).toFixed(1), target: o.id });
        work.timeline.clips.push({ id: uid('c'), track: 'action', op: defAct, t0: 1, t1: 4.5, target: o.id });
      } else if (kind === 'carousel' || kind === 'ferris' || kind === 'gears') {
        work.timeline.clips.push({ id: uid('c'), track: 'action', op: 'spin', t0: 0, t1: work.timeline.len, target: o.id });
      }
    }
    if (!work.zones || !work.zones.length) work.zones = [{ id: uid('z'), name: '欢迎区', x: 0, z: 2, r: 5.0, enter: 'play', exit: 'none' }];
    if (!work.route || work.route.length < 2) work.route = [{ x: 0, z: 9.2 }, { x: 0, z: 2.0 }];
    o.y = E.surfaceY(o.x, o.z, o.id);
    work.objects.push(o); sel = { type: 'obj', id: o.id };
    E.sync(); E.select(sel); changed();
    toast('✨ 放好了「' + K.name + '」· 可直接在画布上拖动或改台词！');
  }

  function addClip(spec) {
    var tr = spec.split(':')[0], op = spec.split(':')[1], t = E.state().t, o = sel && sel.type === 'obj' ? objOf(sel.id) : null, c = { id: uid('c'), track: tr, op: op, t0: +t.toFixed(1), target: null };
    var anyThing = tr === 'action' && (op === 'appear' || op === 'vanish');
    if (anyThing) { if (!o) return toast('先在场景里选中一个东西'); c.target = o.id; }
    else if (tr === 'voice' || tr === 'action') { if (!o || !alive(o.kind)) return toast('先选一个角色或互动道具'); c.target = o.id; }
    if (tr === 'music' && o) c.target = o.id;
    if (tr === 'voice') {
      var v = (o.life || {}).voice || {}, line = op === 'line' ? (($('#dw-line') || {}).value || '').trim() : '';
      if (op === 'line' && !line) return toast('先写下这一句'); if (op !== 'line' && !v.text) return toast('先写台词');
      c.op = 'speak'; if (line) c.text = line.slice(0, 600); c.t1 = c.t0 + E.sayTime({ text: line || v.text, rate: v.rate });
    }
    else c.t1 = c.t0 + (tr === 'action' ? ({ turnHead: 6, wink: 1.5, appear: 1, vanish: 1, turnPage: 1.5, open: 2, close: 2, spin: 6, timeTravel: 4, grow: 4, wilt: 3, stroll: 10 })[op] || 4 : tr === 'light' ? (op === 'fireworks' ? 12 : /^to/.test(op) ? 4 : 3) : 8);
    begin(); work.timeline.clips.push(c);
    if (c.t1 > work.timeline.len) work.timeline.len = Math.ceil(c.t1 + 2);
    selClip = c.id; changed(); toast('已加入效果：' + (OPS[c.op] || c.op));
  }

  /* ---------------------------------------------------------------- Easy Magic 1-Click Helpers */
  function setEasyWeather(wt) {
    begin();
    work.timeline.clips = work.timeline.clips.filter(function (c) { return !(c.track === 'light' && (c.op === 'snow' || c.op === 'rain' || c.op === 'clear')); });
    if (wt === 'snow' || wt === 'rain') work.timeline.clips.push({ id: uid('c'), track: 'light', op: wt, t0: 0, t1: work.timeline.len });
    changed();
    toast(wt === 'snow' ? '❄️ 天空开始飘雪啦！' : wt === 'rain' ? '🌧 下起奇幻细雨啦！' : '🌤 天空放晴啦！');
  }
  function toggleEasyFireworks() {
    begin();
    var had = hasFireworks();
    work.timeline.clips = work.timeline.clips.filter(function (c) { return c.op !== 'fireworks'; });
    if (!had) {
      work.timeline.clips.push({ id: uid('c'), track: 'light', op: 'fireworks', t0: 0.5, t1: work.timeline.len });
      E.launchFireworks(6);
      toast('🎆 盛大烟花秀已开启！');
    } else toast('已关闭自动烟花');
    changed();
  }
  function setEasyMusic(op) {
    begin();
    work.timeline.clips = work.timeline.clips.filter(function (c) { return c.track !== 'music'; });
    if (op !== 'none') work.timeline.clips.push({ id: uid('c'), track: 'music', op: op, t0: 0, t1: work.timeline.len, target: null });
    changed();
    toast(op === 'none' ? '已设为安静无配乐' : '🎵 已切换配乐：' + OPS[op]);
  }
  function setEasyRide(rm) {
    begin();
    work.ride = { mode: rm, speed: 1.35 };
    if (rm === 'boat' && (work.route || []).length < 4) {
      work.route = [{ x: -8.5, z: 9.8 }, { x: -7, z: 2.5 }, { x: 0, z: 0.8 }, { x: 7, z: 2.5 }, { x: 8.5, z: 8.0 }];
    }
    changed();
    toast(rm === 'boat' ? '⛵ 已变成水道游船世界！走进世界即可坐船游览' : '🚶 已切换为自由漫步模式');
  }

  document.addEventListener('click', function (e) {
    var b = e.target.closest('button'); if (!b || !b.closest('#dw-app')) return;
    var d = b.dataset;
    if (b.id === 'dw-body-park') return sendToDisneyPark();
    if (b.id === 'dw-more-tpl') { renderWorks(); $('#dw-sheet').hidden = false; return; }
    if (b.id === 'dw-easy-mic') {
      root.DWImagineer.listenIdea(function (txt) { inlineIdea = txt; var ta = $('#dw-easy-idea'); if (ta) ta.value = txt; }, function (st) { b.classList.toggle('on', st === 'listening'); });
      return;
    }
    if (d.easyex) { inlineIdea = d.easyex; var ta2 = $('#dw-easy-idea'); if (ta2) ta2.value = inlineIdea; return; }
    if (b.id === 'dw-easy-go') {
      var ta3 = $('#dw-easy-idea'); inlineIdea = ta3 ? ta3.value.trim() : inlineIdea;
      if (inlineIdea.length < 2) return toast('先写下或点 🎤 说出你的梦想世界吧！');
      inlineBusy = true; renderPanel();
      root.DWImagineer.createFromIdea(inlineIdea, [], 0).then(function (res) {
        inlineBusy = false; adopt(res.work);
      }).catch(function (err) { inlineBusy = false; renderPanel(); toast((err && err.message) || '请再试一次'); });
      return;
    }
    if (b.id === 'dw-quick-cmd-go') {
      var inp = $('#dw-quick-cmd'), cmd = inp ? inp.value.trim() : '';
      if (!cmd) return toast('先输入想施展的魔法，如：加两只小恐龙');
      var ops = root.DWEdit.local(cmd, work);
      if (ops) {
        var done = []; edit(function (wk) { done = root.DWEdit.apply(wk, ops); });
        if (done.length) toast('🪄 ' + done.join('；')); else root.DWImagineer.open('edit');
      } else { root.DWImagineer.open('edit'); setTimeout(function () { var c = $('#dw-cmd'); if (c) c.value = cmd; }, 60); }
      return;
    }
    if (d.picktpl) { create(d.picktpl); toast('🌈 已切换到「' + work.title + '」'); return; }
    if (d.toycat) { toyCat = d.toycat; renderPanel(); return; }
    if (d.easywt) return setEasyWeather(d.easywt);
    if (d.easyfw != null) return toggleEasyFireworks();
    if (d.easymusic) return setEasyMusic(d.easymusic);
    if (d.easyride) return setEasyRide(d.easyride);
    if (d.tab) return setTab(d.tab);
    if (d.step) { var st = d.step; if (st === 'dream') return root.DWImagineer.open('new'); if (st === 'preview') return guestOn(); if (st === 'place') return sendToDisneyPark(); return setTab(st); }
    if (d.add) { if (dragged) { dragged = false; return; } return addThing(d.add); }
    if (d.imp) return importThing(d.imp);
    if (d.go) return setTab(d.go);
    if (d.pick) { sel = { type: 'obj', id: d.pick }; E.select(sel); var po = objOf(d.pick); if (po) E.focus(po.x, po.z); renderQuickBar(); return renderPanel(); }
    if (d.life != null) { var o = objOf(sel.id); begin(); o.life = o.life || { voice: { text: '', lang: 'zh-CN', rate: 1, pitch: 1 } }; o.life.on = !o.life.on; changed(); if (o.life.on) toast('「' + o.name + '」活过来了'); return; }
    if (d.listen != null) { var lo = objOf(sel.id), v = lo.life.voice; E.unlock(); if (!E.speak(String(v.text || '').slice(0, 240), v)) toast('这台设备暂不支持语音朗读'); return; }
    if (d.hush != null) return E.hush();
    if (d.clip) return addClip(d.clip);
    if (d.seekclip) { var sc = work.timeline.clips.filter(function (c) { return c.id === d.seekclip; })[0]; if (sc) { E.seek(sc.t0); selClip = sc.id; renderTimeline(); } return; }
    if (d.delclip) { begin(); work.timeline.clips = work.timeline.clips.filter(function (c) { return c.id !== d.delclip; }); changed(); return; }
    if (d.mood) { begin(); work.env.mood = d.mood; changed(); return; }
    if (d.rot) { var ro = objOf(sel.id); begin(); ro.ry = (ro.ry || 0) + (+d.rot) * Math.PI / 12; changed(true); return; }
    if (d.face != null) { var fo = objOf(sel.id), zz = work.zones[0] || { x: 0, z: 6 }; begin(); fo.ry = Math.atan2(zz.x - fo.x, zz.z - fo.z); changed(true); return; }
    if (d.dup != null) { var src = objOf(sel.id), cp = JSON.parse(JSON.stringify(src)); begin(); cp.id = uid(); cp.x += 1.2; cp.z += 0.6; var cc = E.clampToTable(cp.x, cp.z); cp.x = cc.x; cp.z = cc.z; cp.y = E.surfaceY(cp.x, cp.z, cp.id); work.objects.push(cp); sel = { type: 'obj', id: cp.id }; E.sync(); E.select(sel); changed(); return; }
    if (d.del != null) return removeSel();
    if (d.zone) { sel = { type: 'zone', id: d.zone }; E.select(sel); return renderPanel(); }
    if (d.delzone) { begin(); work.zones = work.zones.filter(function (q) { return q.id !== d.delzone; }); if (sel && sel.id === d.delzone) sel = null; E.select(sel); changed(); return; }
    if (d.mode) return setMode(mode === d.mode ? 'select' : d.mode);
    if (d.clearroute != null) { begin(); work.route = []; changed(); return; }
    if (d.guest != null) return guestOn();
  });

  /* drag a thing from the shelf straight onto the sandbox */
  var dragged = false;
  (function shelfDrag() {
    var dr = null, ghost = null;
    document.addEventListener('pointerdown', function (e) { var b = e.target.closest && e.target.closest('.dw-thing[data-add]'); if (!b) return; dr = { kind: b.dataset.add, x: e.clientX, y: e.clientY, id: e.pointerId }; dragged = false; });
    document.addEventListener('pointermove', function (e) {
      if (!dr || e.pointerId !== dr.id) return;
      if (!ghost && Math.hypot(e.clientX - dr.x, e.clientY - dr.y) > 8) { ghost = document.createElement('div'); ghost.className = 'dw-ghost'; ghost.textContent = MK[dr.kind].icon + ' ' + MK[dr.kind].name; document.body.appendChild(ghost); }
      if (ghost) { ghost.style.transform = 'translate(' + (e.clientX + 10) + 'px,' + (e.clientY + 10) + 'px)'; var r = $('#dw-cv').getBoundingClientRect(); ghost.classList.toggle('in', e.clientX > r.left && e.clientX < r.right && e.clientY > r.top && e.clientY < r.bottom); }
    });
    document.addEventListener('pointerup', function (e) {
      if (!dr || e.pointerId !== dr.id) return; var k = dr.kind; dr = null;
      if (!ghost) return; ghost.remove(); ghost = null; dragged = true;
      var r = $('#dw-cv').getBoundingClientRect(); if (e.clientX < r.left || e.clientX > r.right || e.clientY < r.top || e.clientY > r.bottom) return;
      var g = E.groundAt(e.clientX, e.clientY); if (g) addThing(k, { x: snapV(g.x), z: snapV(g.z) });
    });
  })();
  function snapOn() { return lsGet('dw.snap') === '1'; }
  function snapV(v) { return snapOn() ? Math.round(v * 2) / 2 : v; }
  function removeSel() {
    if (!sel) return;
    begin();
    if (sel.type === 'obj') { var o = objOf(sel.id); work.objects = work.objects.filter(function (q) { return q.id !== sel.id; }); work.timeline.clips = work.timeline.clips.filter(function (c) { return c.target !== sel.id; }); toast('移除了「' + (o ? o.name : '') + '」', true); }
    else if (sel.type === 'zone') work.zones = work.zones.filter(function (q) { return q.id !== sel.id; });
    sel = null; E.select(null); changed();
  }
  document.addEventListener('input', function (e) {
    var t = e.target; if (!t.closest('#dw-body')) return;
    if (t.id === 'dw-easy-idea') { inlineIdea = t.value; return; }
    if (t.id === 'dw-quick-cmd') return;
    var d = t.dataset, v = t.type === 'range' || t.type === 'number' ? +t.value : t.type === 'checkbox' ? t.checked : t.value;
    var o = sel && sel.type === 'obj' ? objOf(sel.id) : null, z = sel && sel.type === 'zone' ? work.zones.filter(function (q) { return q.id === sel.id; })[0] : null;
    if (!t._began) { begin(); t._began = true; t.addEventListener('change', function () { t._began = false; }, { once: true }); }
    if (d.easyvoice != null && o) {
      o.life = o.life || { on: true, voice: { lang: 'zh-CN', rate: 1, pitch: 1.08 } };
      o.life.on = true; o.life.voice.text = v;
      var vc = work.timeline.clips.filter(function (c) { return c.track === 'voice' && c.target === o.id; })[0];
      var dur = E.sayTime(o.life.voice);
      if (v.trim()) {
        if (vc) { delete vc.text; vc.t1 = +(vc.t0 + dur).toFixed(1); }
        else work.timeline.clips.push({ id: uid('c'), track: 'voice', op: 'speak', t0: 1, t1: +(1 + dur).toFixed(1), target: o.id });
      }
      if (dur + 2 > work.timeline.len) work.timeline.len = Math.ceil(dur + 3);
      save(); renderTimeline(); return;
    }
    if (d.o && o) { if (d.o === 'link' || d.o === 'frame') { if (v) o[d.o] = v; else delete o[d.o]; E.sync(); E.select(sel); save(); return; } o[d.o] = v; if (d.o === 's') { if (o.kind !== 'portrait') o.y = E.surfaceY(o.x, o.z, o.id); t.previousElementSibling && (t.previousElementSibling.textContent = v.toFixed(2) + '×'); } E.sync(); E.select(sel); save(); renderQuickBar(); if (d.o === 'name') renderTimeline(); return; }
    if (d.v && o) { o.life.voice[d.v] = v; if (t.type === 'range') t.previousElementSibling.textContent = v.toFixed(2); syncVoiceClips(o); save(); renderTimeline(); return; }
    if (d.l && o) { o.life[d.l] = v; save(); return; }
    if (d.tap && o) { o.life.tap = o.life.tap || {}; o.life.tap[d.tap] = v; save(); return; }
    if (d.ride) { work.ride = work.ride || { mode: 'walk', speed: 1.3 }; work.ride[d.ride] = v; if (t.type === 'range') t.previousElementSibling.textContent = v.toFixed(1) + ' 米/秒'; E.sync(); save(); if (d.ride === 'mode') renderPanel(); return; }
    if ((d.z === 'cue0' || d.z === 'cue1') && z) { var raw = t.value.trim(), n = raw === '' ? null : Math.max(0, +raw); z.cue = z.cue || { t0: null, t1: null }; z.cue[d.z === 'cue0' ? 't0' : 't1'] = n; if (z.cue.t0 == null && z.cue.t1 == null) z.cue = null; else if (z.cue.t0 == null) z.cue.t0 = 0; save(); return; }
    if (d.z && z) { z[d.z] = v; if (t.type === 'range') t.previousElementSibling.textContent = v.toFixed(1) + ' 米'; E.sync(); save(); return; }
    if (d.snap != null) { lsSet('dw.snap', t.checked ? '1' : '0'); return; }
    if (d.warm != null) { work.env.warmth = v; save(); return; }
    if (d.wi) { work.imagineer = work.imagineer || {}; work.imagineer[d.wi] = v; save(); steps(); return; }
    if (d.ctext) { var cc = work.timeline.clips.filter(function (c) { return c.id === d.ctext; })[0]; if (cc) { var so = objOf(cc.target); cc.text = String(v).slice(0, 600); cc.t1 = +(cc.t0 + E.sayTime({ text: cc.text, rate: so && so.life && so.life.voice ? so.life.voice.rate : 1 })).toFixed(1); if (cc.t1 > work.timeline.len) work.timeline.len = Math.ceil(cc.t1 + 2); save(); renderTimeline(); } return; }
    if (d.ct0) { var c0 = work.timeline.clips.filter(function (c) { return c.id === d.ct0; })[0]; if (c0 && isFinite(v)) { var du = c0.t1 - c0.t0; c0.t0 = Math.max(0, +v); c0.t1 = +(c0.t0 + du).toFixed(1); if (c0.t1 > work.timeline.len) work.timeline.len = Math.ceil(c0.t1 + 2); save(); renderTimeline(); } return; }
    if (d.len != null) { work.timeline.len = Math.max(5, Math.min(600, v || 30)); save(); renderTimeline(); return; }
  });
  function syncVoiceClips(o) { work.timeline.clips.forEach(function (c) { if (c.track === 'voice' && c.target === o.id && !c.text) { c.t1 = c.t0 + E.sayTime(o.life.voice); if (c.t1 > work.timeline.len) work.timeline.len = Math.ceil(c.t1 + 2); } }); }

  /* ---------------------------------------------------------------- the timeline */
  var PPS = 10;
  function renderTimeline() {
    if (!work || easy) return;
    var tl = work.timeline, area = $('#dw-tracks'), W = Math.max(200, $('#dw-tlscroll').clientWidth - 2);
    PPS = Math.max(W / tl.len, 9); var full = tl.len * PPS;
    var ruler = '<div class="dw-ruler" style="width:' + full + 'px">'; var step = tl.len > 240 ? 30 : tl.len > 90 ? 15 : tl.len > 40 ? 5 : 2;
    for (var s = 0; s <= tl.len; s += step) ruler += '<span style="left:' + (s * PPS) + 'px">' + s + 's</span>';
    ruler += '</div>';
    var rows = TRACKS.map(function (tr) {
      return '<div class="dw-track" data-track="' + tr.id + '" style="width:' + full + 'px">' + tl.clips.filter(function (c) { return c.track === tr.id; }).map(function (c) {
        var o = c.target && objOf(c.target), lbl = (OPS[c.op] || c.op) + (o ? (c.track === 'music' ? ' · 📍' : ' · ') + o.name : '') + (c.text ? '：' + c.text : '');
        return '<div class="dw-clip dw-c-' + tr.id + (selClip === c.id ? ' dw-sel' : '') + '" data-cid="' + c.id + '" style="left:' + (c.t0 * PPS) + 'px;width:' + Math.max(8, (c.t1 - c.t0) * PPS) + 'px" title="' + esc(lbl) + '"><span>' + esc(lbl) + '</span><i class="dw-grip"></i></div>';
      }).join('') + '</div>';
    }).join('');
    area.innerHTML = ruler + rows + '<div class="dw-head" id="dw-head"></div>';
    $('#dw-labels').innerHTML = '<div class="dw-lruler"></div>' + TRACKS.map(function (t) { return '<div class="dw-ltrack">' + t.name + '</div>'; }).join('');
    $('#dw-clipdel').disabled = !selClip;
    head();
  }
  function head() {
    var st = E.state(), h = $('#dw-head'); if (h) h.style.left = (st.t * PPS) + 'px';
    $('#dw-time').textContent = st.t.toFixed(1) + ' / ' + Math.round(st.len) + ' 秒';
    $('#dw-play').textContent = st.playing ? '❚❚' : '▶';
    if (st.playing && !easy) { var sc = $('#dw-tlscroll'), x = st.t * PPS; if (x > sc.scrollLeft + sc.clientWidth - 40 || x < sc.scrollLeft) sc.scrollLeft = Math.max(0, x - 60); }
  }
  (function timelineInput() {
    var drag = null;
    $('#dw-tracks').addEventListener('pointerdown', function (e) {
      var cl = e.target.closest('.dw-clip');
      if (cl) {
        var c = work.timeline.clips.filter(function (q) { return q.id === cl.dataset.cid; })[0]; if (!c) return;
        selClip = c.id; [].forEach.call(document.querySelectorAll('.dw-clip.dw-sel'), function (x) { x.classList.remove('dw-sel'); }); cl.classList.add('dw-sel'); $('#dw-clipdel').disabled = false;
        drag = { c: c, el: cl, x: e.clientX, t0: c.t0, t1: c.t1, resize: !!e.target.closest('.dw-grip'), began: false };
        cl.setPointerCapture(e.pointerId); e.preventDefault(); return;
      }
      var r = $('#dw-tracks').getBoundingClientRect(); E.seek((e.clientX - r.left) / PPS); drag = { seek: true };
      $('#dw-tracks').setPointerCapture(e.pointerId);
    });
    $('#dw-tracks').addEventListener('pointermove', function (e) {
      if (!drag) return;
      if (drag.seek) { var r = $('#dw-tracks').getBoundingClientRect(); E.seek((e.clientX - r.left) / PPS); return; }
      var dt = (e.clientX - drag.x) / PPS; if (!drag.began && Math.abs(e.clientX - drag.x) < 3) return;
      if (!drag.began) { begin(); drag.began = true; }
      var c = drag.c, len = work.timeline.len, snap = function (v) { return Math.round(v * 10) / 10; };
      if (drag.resize) c.t1 = snap(Math.max(c.t0 + 0.5, Math.min(len, drag.t1 + dt)));
      else { var d = drag.t1 - drag.t0; c.t0 = snap(Math.max(0, Math.min(len - d, drag.t0 + dt))); c.t1 = +(c.t0 + d).toFixed(2); }
      drag.el.style.left = (c.t0 * PPS) + 'px'; drag.el.style.width = Math.max(8, (c.t1 - c.t0) * PPS) + 'px';
    });
    var up = function () { if (drag && drag.began) { save(); renderTimeline(); if (tab === 'behavior') renderPanel(); } drag = null; };
    $('#dw-tracks').addEventListener('pointerup', up); $('#dw-tracks').addEventListener('pointercancel', up);
  })();
  $('#dw-play').onclick = function () { E.unlock(); var st = E.state(); if (st.playing) E.pause(); else E.play(); };
  $('#dw-rew').onclick = function () { E.stop(); };
  $('#dw-back1').onclick = function () { E.seek(E.state().t - 1); };
  $('#dw-fwd1').onclick = function () { E.seek(E.state().t + 1); };
  $('#dw-clipdel').onclick = function () { if (!selClip) return; begin(); work.timeline.clips = work.timeline.clips.filter(function (c) { return c.id !== selClip; }); selClip = null; changed(); };
  $('#dw-tltoggle').onclick = function () { document.body.classList.toggle('dw-tlopen'); setTimeout(renderTimeline, 30); };
  E.on.tick = function () { head(); };
  E.on.ended = function () { head(); if (E.inGuest()) guestMsg('🎉 演出完成！点角色可继续互动，或点「🎆 放烟花」庆祝！'); };

  /* ---------------------------------------------------------------- the sandbox: pointer */
  (function sandboxInput() {
    var cv = $('#dw-cv'), pts = {}, act = null;
    cv.addEventListener('contextmenu', function (e) { e.preventDefault(); });
    cv.addEventListener('pointerdown', function (e) {
      cv.setPointerCapture(e.pointerId); pts[e.pointerId] = { x: e.clientX, y: e.clientY };
      var n = Object.keys(pts).length;
      if (E.inGuest()) { act = { look: true, x: e.clientX, y: e.clientY }; return; }
      if (n === 2) { var p = Object.keys(pts).map(function (k) { return pts[k]; }); act = { pinch: true, d: Math.hypot(p[0].x - p[1].x, p[0].y - p[1].y), mx: (p[0].x + p[1].x) / 2, my: (p[0].y + p[1].y) / 2 }; return; }
      if (mode === 'zone' || mode === 'route') { act = { place: true, x: e.clientX, y: e.clientY }; return; }
      var h = E.pick(e.clientX, e.clientY);
      if (h && h.type === 'obj') {
        var o = objOf(h.id), g = E.groundAt(e.clientX, e.clientY, o.y || 0);
        sel = { type: 'obj', id: h.id }; E.select(sel); renderQuickBar();
        if (easy && etab === 'ip') setEasyTab('toys');
        else if (!easy && tab === 'experience') setTab('scene');
        else renderPanel();
        act = { obj: o, ox: g ? o.x - g.x : 0, oz: g ? o.z - g.z : 0, x: e.clientX, y: e.clientY, moved: false }; return;
      }
      if (!easy && h && h.type === 'zone') { var z = work.zones.filter(function (q) { return q.id === h.id; })[0]; sel = { type: 'zone', id: h.id }; E.select(sel); if (tab !== 'experience') setTab('experience'); else renderPanel(); act = { zone: z, ox: z.x - h.point.x, oz: z.z - h.point.z, x: e.clientX, y: e.clientY, moved: false }; return; }
      if (!easy && h && h.type === 'route') { act = { route: h.index, x: e.clientX, y: e.clientY, moved: false }; return; }
      act = { orbit: true, pan: e.button === 2 || e.shiftKey, x: e.clientX, y: e.clientY, moved: false };
    });
    cv.addEventListener('pointermove', function (e) {
      if (!pts[e.pointerId]) return; var last = pts[e.pointerId]; pts[e.pointerId] = { x: e.clientX, y: e.clientY };
      if (!act) return;
      if (act.look) { if (Math.hypot(e.clientX - act.x, e.clientY - act.y) > 6) act.moved = true; E.guestLook(e.clientX - last.x, e.clientY - last.y); return; }
      if (act.pinch) { var p = Object.keys(pts).map(function (k) { return pts[k]; }); if (p.length < 2) return; var d = Math.hypot(p[0].x - p[1].x, p[0].y - p[1].y), mx = (p[0].x + p[1].x) / 2, my = (p[0].y + p[1].y) / 2; if (act.d) E.zoom(act.d / d); E.pan(mx - act.mx, my - act.my); act.d = d; act.mx = mx; act.my = my; return; }
      var far = Math.hypot(e.clientX - act.x, e.clientY - act.y) > 4;
      if (act.obj) { if (!far && !act.moved) return; if (!act.moved) { begin(); act.moved = true; } var g = E.groundAt(e.clientX, e.clientY, act.obj.y || 0); if (!g) return; var c = E.clampToTable(snapV(g.x + act.ox), snapV(g.z + act.oz)); act.obj.x = +c.x.toFixed(2); act.obj.z = +c.z.toFixed(2); if (act.obj.kind !== 'portrait') act.obj.y = E.surfaceY(act.obj.x, act.obj.z, act.obj.id); E.sync(); return; }
      if (act.zone) { if (!far && !act.moved) return; if (!act.moved) { begin(); act.moved = true; } var gz = E.groundAt(e.clientX, e.clientY); if (!gz) return; var cz = E.clampToTable(gz.x + act.ox, gz.z + act.oz); act.zone.x = +cz.x.toFixed(2); act.zone.z = +cz.z.toFixed(2); E.sync(); return; }
      if (act.route != null) { if (!far && !act.moved) return; if (!act.moved) { begin(); act.moved = true; } var gr = E.groundAt(e.clientX, e.clientY); if (!gr) return; var cr = E.clampToTable(gr.x, gr.z); work.route[act.route] = Object.assign({}, work.route[act.route], { x: +cr.x.toFixed(2), z: +cr.z.toFixed(2) }); E.sync(); return; }
      if (act.orbit) { if (far) act.moved = true; if (act.pan) E.pan(e.clientX - last.x, e.clientY - last.y); else E.orbit(e.clientX - last.x, e.clientY - last.y); }
    });
    var end = function (e) {
      delete pts[e.pointerId];
      if (!act) return; var a = act; act = null;
      if (a.look) {
        if (!a.moved) {
          var r = E.guestTap(e.clientX, e.clientY);
          if (r) guestMsg(r.ok ? ('✨ ' + r.name + (r.text ? '：“' + r.text + '”' : ' 回应了你！')) : r.far ? ('再走近一点点就能和「' + r.name + '」互动啦！') : ('这是「' + r.name + '」'));
        }
        return;
      }
      if (a.place) {
        var g = E.groundAt(e.clientX, e.clientY); if (!g) return; var c = E.clampToTable(g.x, g.z);
        begin();
        if (mode === 'zone') { var z = { id: uid('z'), name: '触发区 ' + (work.zones.length + 1), x: +c.x.toFixed(2), z: +c.z.toFixed(2), r: 3.5, enter: 'play', exit: 'fade' }; work.zones.push(z); sel = { type: 'zone', id: z.id }; E.select(sel); setMode('select'); changed(); toast('触发区放好了'); }
        else { work.route.push({ x: +c.x.toFixed(2), z: +c.z.toFixed(2) }); changed(); }
        return;
      }
      if (a.moved) { save(); renderQuickBar(); renderPanel(); renderTimeline(); return; }
      if (a.orbit && !a.moved) { sel = null; E.select(null); renderQuickBar(); renderPanel(); }
    };
    cv.addEventListener('pointerup', end); cv.addEventListener('pointercancel', end);
    cv.addEventListener('wheel', function (e) { e.preventDefault(); if (!E.inGuest()) E.zoom(e.deltaY > 0 ? 1.08 : 0.93); }, { passive: false });
    root.addEventListener('keydown', function (e) {
      if (/INPUT|TEXTAREA|SELECT/.test((e.target || {}).tagName || '')) return;
      if ((e.metaKey || e.ctrlKey) && e.key === 'z') { e.preventDefault(); return undoOnce(); }
      if (E.inGuest()) { if (e.key === 'Escape') guestOff(); return; }
      if (e.key === 'Delete' || e.key === 'Backspace') { if (selClip && !easy) $('#dw-clipdel').click(); else removeSel(); e.preventDefault(); }
      if (e.key === ' ') { e.preventDefault(); $('#dw-play').click(); }
      if ((e.key === 'r' || e.key === 'R') && sel && sel.type === 'obj') { var o = objOf(sel.id); begin(); o.ry = (o.ry || 0) + (e.shiftKey ? -1 : 1) * Math.PI / 12; changed(true); }
      if (e.key === 'Escape' && mode !== 'select') setMode('select');
    });
  })();

  /* ---------------------------------------------------------------- guest preview */
  var openedDirectPlay = false;
  function guestOn() {
    if (work && !work.previewed) { work.previewed = true; save(); }
    setMode('select'); document.body.classList.add('dw-guest'); E.enterGuest();
    var rd = E.riding(); document.body.classList.toggle('dw-ride', rd);
    $('#dw-gwalk').textContent = rd ? '⛵ 开船出发' : '🚶 自动游览';
    /* Auto-start boat or gentle walk forward if entering from Disney Park portal! */
    if (openedDirectPlay) {
      $('#dw-gback').textContent = '✏️ 装扮这个世界';
      if (rd) setTimeout(function () { if (E.inGuest()) E.guestAuto(true); }, 600);
    } else {
      $('#dw-gback').textContent = '← 继续装扮世界';
    }
  }
  function guestOff() { openedDirectPlay = false; E.exitGuest(); document.body.classList.remove('dw-guest', 'dw-ride'); renderQuickBar(); renderTimeline(); }
  E.on.rideEnd = function () { $('#dw-gwalk').textContent = '⛵ 再坐一次游船'; };
  var gT = 0;
  function guestMsg(t) { var m = $('#dw-gmsg'); m.textContent = t; m.classList.add('on'); clearTimeout(gT); gT = setTimeout(function () { m.classList.remove('on'); }, 3600); }
  E.on.guest = guestMsg;
  $('#dw-gback').onclick = guestOff;
  $('#dw-gwalk').onclick = function () { E.unlock(); E.guestAuto(true); if (E.riding()) $('#dw-gwalk').textContent = '⛵ 从头再坐'; };
  $('#dw-gfirework').onclick = function () { E.unlock(); E.launchFireworks(6.5); guestMsg('🎆 哇！漫天星光烟花绽放啦！'); };
  (function joystick() {
    var pad = $('#dw-joy'), knob = $('#dw-knob'), id = null, c = null;
    pad.addEventListener('pointerdown', function (e) { id = e.pointerId; pad.setPointerCapture(id); var r = pad.getBoundingClientRect(); c = { x: r.left + r.width / 2, y: r.top + r.height / 2, R: r.width / 2 }; mv(e); });
    function mv(e) { if (e.pointerId !== id) return; var dx = e.clientX - c.x, dy = e.clientY - c.y, d = Math.hypot(dx, dy), k = d > c.R ? c.R / d : 1; dx *= k; dy *= k; knob.style.transform = 'translate(' + dx + 'px,' + dy + 'px)'; E.guestJoy(dx / c.R, -dy / c.R); }
    pad.addEventListener('pointermove', mv);
    var end = function (e) { if (e.pointerId !== id) return; id = null; knob.style.transform = ''; E.guestJoy(0, 0); };
    pad.addEventListener('pointerup', end); pad.addEventListener('pointercancel', end);
  })();

  /* ---------------------------------------------------------------- works sheet */
  function toast(t, withUndo) {
    var el = $('#dw-toast'); el.innerHTML = esc(t) + (withUndo ? ' <button type="button" id="dw-tundo">撤销</button>' : ''); el.classList.add('on');
    var u = $('#dw-tundo'); if (u) u.onclick = function () { undoOnce(); el.classList.remove('on'); };
    clearTimeout(toast.t); toast.t = setTimeout(function () { el.classList.remove('on'); }, withUndo ? 5000 : 3200);
  }
  function renderWorks() {
    var ws = works(), d = function (t) { var x = new Date(t || 0); return (x.getMonth() + 1) + '/' + x.getDate() + ' ' + x.toTimeString().slice(0, 5); };
    $('#dw-wbody').innerHTML = '<h3>我的作品存档 <small>' + ws.length + '</small></h3>' +
      (ws.length ? '<ul class="dw-list">' + ws.map(function (w) { return '<li' + (work && w.id === work.id ? ' class="dw-cur"' : '') + '><button class="dw-link" data-openw="' + w.id + '">🎬 ' + esc(w.title || '未命名') + ' <small>' + d(w.updated) + '</small></button><button class="dw-x" data-delw="' + w.id + '" aria-label="删除作品">✕</button></li>'; }).join('') + '</ul>' : '<p class="dw-muted">还没有保存其他作品，选择一个模板立即开始吧！</p>') +
      '<h3>全部 30 种主题世界与创意模板</h3><div class="dw-tpls">' + TP.list.map(function (t) { return '<button class="dw-tpl" data-tpl="' + t.id + '"><span>' + t.icon + '</span><b>' + esc(t.name) + '</b><small>' + esc(t.note) + '</small></button>'; }).join('') + '</div>' +
      '<p class="dw-muted" id="dw-sync2"></p>';
    $('#dw-sync2').textContent = S ? S.status().text : '';
  }
  $('#dw-works').onclick = function () { renderWorks(); $('#dw-sheet').hidden = false; };
  $('#dw-sheet').addEventListener('click', function (e) {
    if (e.target === $('#dw-sheet') || e.target.closest('#dw-wclose')) { $('#dw-sheet').hidden = true; return; }
    var b = e.target.closest('button'); if (!b) return;
    if (b.dataset.tpl) { create(b.dataset.tpl); $('#dw-sheet').hidden = true; toast('🌈 新作品：' + work.title); }
    if (b.dataset.openw) { var w = sget(PFX + b.dataset.openw); if (w) open(w); $('#dw-sheet').hidden = true; }
    if (b.dataset.delw) { var x = sget(PFX + b.dataset.delw); if (x && confirm('删除「' + (x.title || '未命名') + '」？')) { x.deleted = true; x.updated = Date.now(); sset(PFX + x.id, x); if (work && work.id === x.id) { var left = works(); if (left.length) open(left[0]); else create('ice_kingdom'); } renderWorks(); } }
  });
  $('#dw-title').addEventListener('input', function () { work.title = this.value; save(); });
  $('#dw-undo').onclick = undoOnce;
  $('#dw-guestbtn').onclick = guestOn;
  [].forEach.call(document.querySelectorAll('[data-tab]'), function (b) { b.onclick = function () { setTab(b.dataset.tab); }; });

  if (S && S.onChange) S.onChange(function () {
    status(); if (!work || saveT) return; var r = sget(PFX + work.id);
    if (r && (r.updated || 0) > (work.updated || 0) + 50 && !E.inGuest()) { var s = sel; work = r; E.setWork(work); sel = s && (s.type !== 'obj' || objOf(s.id)) ? s : null; E.select(sel); renderQuickBar(); renderPanel(); renderTimeline(); toast('已同步另一台设备上的修改'); }
  });

  function edit(fn) {
    begin(); fn(work); E.sync();
    work.objects.forEach(function (o) { if (o.kind !== 'portrait' && o.y == null) o.y = E.surfaceY(o.x, o.z, o.id); });
    changed(); save(true);
  }

  /* ---------------------------------------------------------------- start */
  try {
    var PV = root.parent !== root && root.parent.MinestPavilion;
    if (PV) {
      $('#dw-exit').hidden = false;
      $('#dw-exit').onclick = function () { E.hush(); PV.close(); };
    }
  } catch (e) {}
  E.init($('#dw-cv'));
  E.showHelpers(false); /* clean magical look in Easy Mode; toggled on in Pro mode */
  if (root.speechSynthesis && speechSynthesis.onvoiceschanged !== undefined) speechSynthesis.onvoiceschanged = function () {};
  setTimeout(function () {
    var qs = {}; location.search.replace(/[?&]([a-zA-Z]+)=([A-Za-z0-9_-]+)/g, function (m, k, v) { qs[k] = v; });
    if (qs.from === 'wed') {
      $('#dw-exit').hidden = false;
      $('#dw-exit').innerHTML = '🏛<span class="dw-lbl"> 回 WED 工作坊</span>';
      $('#dw-exit').onclick = function () { E.hush(); save(true); location.href = 'wed-studio/index.html' + (work ? '?work=' + encodeURIComponent(work.id) : ''); };
    }
    if (qs.from === 'park') {
      $('#dw-exit').hidden = false;
      $('#dw-exit').onclick = function () {
        E.hush();
        try { if (root.parent !== root && root.parent.MinestPavilion) { root.parent.MinestPavilion.close(); return; } } catch (e) {}
        location.href = '../theme-park-island/theme-park.html';
      };
    }
    var want = qs.play || qs.open;
    var pw = want && sget(PFX + want);
    if (want && !pw && TP.list.some(function (t) { return t.id === want; })) {
      /* Support ?play=ice_kingdom or ?open=dino_valley directly for built-in IP worlds! */
      var bt = TP.list.filter(function (t) { return t.id === want; })[0];
      pw = bt.make(); pw.id = want; pw.created = Date.now(); pw.shelf = true;
      sset(PFX + pw.id, pw);
    }
    var last = lsGet('dw.last'), w = pw && !pw.deleted ? pw : last && sget(PFX + last);
    if (w && !w.deleted) open(w); else { var ws = works(); if (ws.length) open(ws[0]); else create('ice_kingdom'); }
    status();
    if (qs.play && work) { openedDirectPlay = true; guestOn(); }
  }, S ? 180 : 0);
  root.addEventListener('resize', function () { renderTimeline(); });
  setInterval(status, 4000);

  root.DWApp = {
    work: function () { return work; }, open: open, create: create, adopt: adopt,
    opName: function (op) { return OPS[op] || op; }, guest: guestOn,
    sendToDisneyPark: sendToDisneyPark,
    undo: function (silent) { undoOnce(silent); },
    edit: edit,
    select: function (id) { sel = { type: 'obj', id: id }; E.select(sel); renderQuickBar(); renderPanel(); }
  };
})(window);

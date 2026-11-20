/* Minest · Exploded Learning Card (2026-11-19). Tap the card in front in a 3D Cover mode (or in the holo console's
   projection) and it comes apart in space into its layers — the word, 中文, 构词 (roots and affixes), the English
   definition, examples, a recall question and its result — fanned in depth. Tap a layer to bring it forward; Close
   brings them back together. Everything shown comes from the card itself (title, titleZh, meaning / desc, the
   definitions / examples / relatedWords the AI fill adds, pron, its picture); a layer with nothing to show is left out.
   构词 is a breakdown by common Latin / Greek roots and affixes, labelled as such — not an etymology — unless the card
   carries its own (etymology / roots). The recall question takes its wrong answers from the other cards in view. */
(function () {
  'use strict';
  if (window.MinestExplode) return;
  function esc(s) { return String(s == null ? '' : s).replace(/[&<>"']/g, function (c) { return { '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' }[c]; }); }
  function plain(s) { return String(s || '').replace(/<[^>]*>/g, ' ').replace(/!\[[^\]]*\]\([^)]*\)/g, '').replace(/\[([^\]]*)\]\([^)]*\)/g, '$1').replace(/[#*_`>|~]+/g, ' ').replace(/\s+/g, ' ').trim(); }
  function cjk(s) { return /[㐀-鿿]/.test(s || ''); }
  function clip(s, n) { s = plain(s); return s.length > n ? s.slice(0, n - 1) + '…' : s; }

  /* ---------------- 构词: common roots and affixes (meanings in Chinese) ---------------- */
  var PRE = [['contra', '反对'], ['counter', '反、对抗'], ['extra', '超出'], ['inter', '在…之间'], ['intra', '在内'], ['trans', '跨越'], ['super', '在上、超'], ['ultra', '极端'], ['under', '在下、不足'], ['over', '过度、在上'], ['anti', '反对'], ['auto', '自己'], ['semi', '半'], ['fore', '预先'], ['mis', '错误'], ['non', '非'], ['post', '在后'], ['pre', '在前、预先'], ['pro', '向前、支持'], ['sub', '在下'], ['sur', '在上、超'], ['tele', '远'], ['para', '旁、类似'], ['circum', '环绕'], ['dis', '不、分开'], ['com', '共同'], ['con', '共同'], ['col', '共同'], ['cor', '共同'], ['ab', '离开'], ['ac', '朝向（ad-）'], ['ad', '朝向'], ['af', '朝向（ad-）'], ['ag', '朝向（ad-）'], ['al', '朝向（ad-）'], ['ap', '朝向（ad-）'], ['as', '朝向（ad-）'], ['at', '朝向（ad-）'], ['de', '向下、去除'], ['ex', '向外'], ['en', '使…'], ['em', '使…'], ['il', '不、向内'], ['im', '不、向内'], ['in', '不、向内'], ['ir', '不'], ['ob', '逆、对'], ['per', '贯穿'], ['re', '再、回'], ['un', '不'], ['bi', '二'], ['tri', '三'], ['uni', '一'], ['co', '共同']];
  var SUF = [['ically', '副词'], ['ated', '-ate 使… + -ed 过去分词'], ['ized', '-ize 使…化 + -ed'], ['ating', '-ate 使… + -ing'], ['ation', '名词：行为、状态'], ['ition', '名词：行为、状态'], ['ative', '形容词：有…倾向'], ['ement', '名词：结果、状态'], ['ness', '名词：性质'], ['ment', '名词：结果、行为'], ['tion', '名词：行为、状态'], ['sion', '名词：行为、状态'], ['ible', '形容词：能…的'], ['able', '形容词：能…的'], ['ance', '名词：状态'], ['ence', '名词：状态'], ['ious', '形容词：充满…的'], ['eous', '形容词：具有…的'], ['ous', '形容词：充满…的'], ['ship', '名词：身份、关系'], ['hood', '名词：身份、时期'], ['less', '形容词：没有…的'], ['ful', '形容词：充满…的'], ['ive', '形容词：有…性质的'], ['ical', '形容词：…的'], ['ic', '形容词：…的'], ['ism', '名词：主义、行为'], ['ist', '名词：…的人'], ['ity', '名词：性质'], ['ize', '动词：使…化'], ['ise', '动词：使…化'], ['ify', '动词：使…'], ['ate', '动词：使…'], ['ant', '形容词 / 名词：…的（人）'], ['ent', '形容词 / 名词：…的（人）'], ['ary', '形容词 / 名词：与…有关'], ['ory', '形容词 / 名词：与…有关'], ['ure', '名词：行为、结果'], ['al', '形容词：…的'], ['er', '名词：…的人 / 比较级'], ['or', '名词：…的人、物'], ['ly', '副词'], ['ing', '动名词 / 现在分词'], ['ed', '过去式 / 过去分词'], ['ward', '方向'], ['y', '形容词：有…的'], ['es', '复数'], ['s', '复数']];
  var ROOT = [['struct', '建造'], ['struc', '建造'], ['script', '写'], ['scrib', '写'], ['spect', '看'], ['spec', '看'], ['dict', '说'], ['duct', '引导'], ['duc', '引导'], ['ject', '投、掷'], ['tract', '拉'], ['port', '携带'], ['rupt', '断裂'], ['vert', '转'], ['vers', '转'], ['vis', '看'], ['vid', '看'], ['voc', '声音、喊'], ['vok', '喊'], ['ven', '来'], ['vent', '来'], ['mit', '送'], ['miss', '送'], ['mot', '动'], ['mov', '动'], ['mob', '动'], ['pend', '悬挂'], ['pens', '悬挂、付'], ['pos', '放置'], ['pon', '放置'], ['cept', '拿、取'], ['cap', '拿、取'], ['ceive', '拿、取'], ['cede', '走'], ['ced', '走'], ['cess', '走'], ['ceed', '走'], ['cred', '相信'], ['chron', '时间'], ['graph', '写、画'], ['gram', '写、记录'], ['phon', '声音'], ['phone', '声音'], ['morph', '形态'], ['log', '言、学'], ['logy', '学科'], ['bio', '生命'], ['geo', '地'], ['aud', '听'], ['bene', '好'], ['fact', '做'], ['fect', '做'], ['fac', '做'], ['fer', '携带'], ['form', '形状'], ['jud', '判断'], ['nat', '出生'], ['path', '感情、疾病'], ['ped', '脚'], ['sens', '感觉'], ['sent', '感觉'], ['sect', '切'], ['tend', '伸展'], ['tens', '伸展'], ['terr', '土地'], ['cent', '唱（cantus）/ 百'], ['cant', '唱'], ['don', '给'], ['dom', '统治'], ['fin', '结束'], ['flex', '弯曲'], ['fort', '强'], ['grat', '感激、愉悦'], ['lect', '选、读'], ['leg', '读、法'], ['loc', '地方'], ['lum', '光'], ['man', '手'], ['mem', '记忆'], ['ment', '心智'], ['min', '小'], ['mon', '提醒'], ['mor', '死 / 习俗'], ['mut', '变'], ['nov', '新'], ['pel', '推'], ['puls', '推'], ['ple', '满'], ['quer', '问、寻'], ['quest', '问、寻'], ['rect', '直'], ['rog', '问'], ['sign', '标记'], ['sist', '站立'], ['stat', '站立'], ['tain', '保持'], ['ten', '保持'], ['tort', '扭'], ['band', '捆绑'], ['venture', '冒险（来）'], ['ven', '来'], ['wrath', '古英语 wrāþ，愤怒']];
  function parts(word) {
    var w = String(word || '').toLowerCase().replace(/[^a-z]/g, ''); if (w.length < 5) return null;
    var out = [], rest = w, i, pre = null, sufs = [];
    for (i = 0; i < PRE.length; i++) if (rest.indexOf(PRE[i][0]) === 0 && rest.length - PRE[i][0].length >= 4) { pre = PRE[i]; rest = rest.slice(pre[0].length); break; }
    for (var round = 0; round < 2; round++) {
      var hit = null; for (i = 0; i < SUF.length; i++) { var s = SUF[i][0]; if (rest.length - s.length >= 3 && rest.slice(-s.length) === s) { hit = SUF[i]; break; } }
      if (!hit) break; sufs.unshift(hit); rest = rest.slice(0, -hit[0].length);
    }
    var root = null; for (i = 0; i < ROOT.length; i++) if (ROOT[i][0].length >= 3 && rest.indexOf(ROOT[i][0]) === 0) { root = ROOT[i]; break; }   // only a root that starts the stem
    if (pre && !root) { rest = pre[0] + rest; pre = null; }   // no known root under it: the prefix is not split off either (too often wrong)
    if (pre) out.push({ p: pre[0] + '-', m: pre[1], k: 'pre' });
    out.push({ p: rest, m: root ? root[1] + (root[0] !== rest ? '（' + root[0] + '）' : '') : '词干', k: 'root' });
    sufs.forEach(function (s) { out.push({ p: '-' + s[0], m: s[1], k: 'suf' }); });
    return (pre || sufs.length || root) ? out : null;
  }

  /* ---------------- what a card has to show ---------------- */
  function facts(c, it) {
    c = c || {}; var d = c.definitions || {}, title = plain(c.title || (it && it.title) || '');
    var zh = plain(c.titleZh || ''), mean = plain(c.meaning || c.desc || ''), defEn = plain(d.en || c.definitionEn || (!cjk(mean) ? mean : '')), defZh = plain(d.zh || c.definitionZh || (cjk(mean) ? mean : ''));
    var pron = c.pron; pron = typeof pron === 'string' ? pron : pron && (pron.ipa || pron.phonetic || pron.us || pron.text) || c.phonetic || '';
    var ex = (Array.isArray(c.examples) ? c.examples : []).map(function (e) { return typeof e === 'string' ? { text: e } : e; }).filter(function (e) { return e && e.text; }).slice(0, 3);
    var rel = (Array.isArray(c.relatedWords) ? c.relatedWords : []).map(function (r) { return typeof r === 'string' ? r : r && (r.word || r.text) || ''; }).filter(Boolean).slice(0, 6);
    var ety = plain(c.etymology || c.roots || c.wordRoot || c.origin || '');
    var head = title.split(/\s+(?:vs\.?|and|&)\s+|\s*[·/]\s*/i)[0].split(/\s+/).sort(function (a, b) { return b.length - a.length; })[0] || title;
    return { title: title, zh: zh, defEn: defEn, defZh: defZh, pron: plain(pron), ex: ex, rel: rel, ety: ety, parts: ety ? null : parts(head), head: head,
      hint: plain(c.hint || ''), note: plain(c.note || ''), col: plain((it && it.sub) || ''), src: (it && it.src) || '', color: (it && it.color) || '' };
  }
  function answerOf(f) { return f.zh || (f.defZh ? clip(f.defZh, 40) : '') || (f.defEn ? clip(f.defEn, 60) : ''); }

  /* ---------------- the look ---------------- */
  var css = document.createElement('style');
  css.textContent = [
    '#xl{position:absolute;inset:0;z-index:2000;overflow:hidden;font-family:-apple-system,"SF Pro Display","PingFang SC",system-ui,sans-serif;color:#eaf2ff;touch-action:none;user-select:none;-webkit-user-select:none}',
    '#xl .xl-bg{position:absolute;inset:0;background:radial-gradient(70% 60% at 50% 45%,rgba(26,44,120,.9),rgba(5,8,26,.97) 78%);opacity:0;-webkit-backdrop-filter:blur(8px);backdrop-filter:blur(8px)}',
    '#xl.holo .xl-bg{background:radial-gradient(70% 60% at 50% 45%,rgba(20,90,140,.35),rgba(2,10,20,.55) 75%)}',
    '#xl .xl-stage{position:absolute;left:50%;top:47%;width:0;height:0;perspective:1600px;transform-style:preserve-3d}',
    '#xl .xl-c{position:absolute;left:0;top:0;box-sizing:border-box;border-radius:22px;padding:16px 16px 14px;display:flex;flex-direction:column;overflow:hidden;cursor:pointer;',
    '  background:radial-gradient(120% 70% at 25% 0%,rgba(110,150,255,.5),rgba(34,52,150,.78) 45%,rgba(10,18,62,.94) 100%);border:1.5px solid rgba(150,200,255,.85);',
    '  box-shadow:0 0 0 1px rgba(110,170,255,.3),0 0 34px rgba(80,140,255,.5),0 30px 60px -20px rgba(0,0,0,.7),inset 0 1px 0 rgba(255,255,255,.55),inset 0 0 32px rgba(120,170,255,.22)}',
    '#xl.holo .xl-c{background:linear-gradient(160deg,rgba(90,210,255,.2),rgba(30,120,200,.1) 60%,rgba(120,230,255,.14));border-color:rgba(130,230,255,.8);box-shadow:0 0 22px rgba(80,200,255,.45),inset 0 0 26px rgba(80,200,255,.18)}',
    '#xl .xl-c::after{content:"";position:absolute;inset:0;border-radius:inherit;pointer-events:none;background:linear-gradient(115deg,transparent 30%,rgba(255,255,255,.12) 45%,transparent 60%),linear-gradient(180deg,rgba(255,255,255,.14),transparent 22%)}',
    '#xl .xl-h{display:flex;align-items:baseline;gap:8px;font:600 15px/1.1 -apple-system,"SF Pro Display","PingFang SC",system-ui,sans-serif;color:#dbe8ff;margin-bottom:10px;letter-spacing:.01em}',
    '#xl .xl-h i{font-style:normal;font:700 13px/1 ui-monospace,Menlo,monospace;color:#9fc3ff;background:rgba(120,170,255,.18);border:1px solid rgba(150,200,255,.45);border-radius:7px;padding:3px 6px}',
    '#xl .xl-w{font:800 30px/1.05 -apple-system,"SF Pro Display","PingFang SC",system-ui,sans-serif;letter-spacing:-.02em;color:#fff;text-shadow:0 0 16px rgba(140,190,255,.6);margin:2px 0 4px;word-break:break-word}',
    '#xl .xl-ph{font:500 14px/1.2 "Lucida Grande",Georgia,serif;color:#b9d0ff;margin-bottom:10px}',
    '#xl .xl-img{flex:1;min-height:80px;border-radius:14px;background:center/cover no-repeat;box-shadow:inset 0 0 0 1px rgba(160,210,255,.35);margin:4px 0 10px;position:relative;overflow:hidden}',
    '#xl .xl-img.no{display:flex;align-items:center;justify-content:center;font:800 76px/1 Georgia,serif;color:rgba(255,255,255,.75);background:radial-gradient(circle at 40% 30%,rgba(150,190,255,.55),rgba(40,70,170,.5))}',
    '#xl .xl-pill{align-self:center;display:inline-block;max-width:100%;padding:6px 14px;border-radius:999px;background:rgba(60,110,255,.55);border:1px solid rgba(160,210,255,.85);color:#fff;font:700 14px/1.2 -apple-system,"SF Pro Display","PingFang SC",system-ui,sans-serif;box-shadow:0 0 14px rgba(90,150,255,.5);white-space:nowrap;overflow:hidden;text-overflow:ellipsis}',
    '#xl .xl-star{color:#ffd45a;text-shadow:0 0 10px rgba(255,200,80,.8)}',
    '#xl .xl-top{display:flex;justify-content:space-between;align-items:center;font:600 13px/1 -apple-system,"SF Pro Display","PingFang SC",system-ui,sans-serif;color:#cfe0ff;margin-bottom:6px;gap:6px}#xl .xl-top span{white-space:nowrap;overflow:hidden;text-overflow:ellipsis}',
    '#xl .xl-say{flex:none;border:0;background:rgba(150,200,255,.18);color:#fff;border-radius:50%;width:30px;height:30px;font-size:15px;cursor:pointer;box-shadow:inset 0 0 0 1px rgba(160,210,255,.5)}',
    '#xl .xl-big{font:700 26px/1.25 -apple-system,"SF Pro Display","PingFang SC",system-ui,sans-serif;color:#fff;margin:6px 0 10px;text-shadow:0 0 14px rgba(140,190,255,.5)}',
    '#xl .xl-p{font:400 14.5px/1.5 -apple-system,"SF Pro Display","PingFang SC",system-ui,sans-serif;color:#dbe7ff;overflow:auto}',
    '#xl .xl-parts{display:flex;flex-wrap:wrap;gap:6px;align-items:stretch;margin:4px 0 10px}#xl .xl-parts b{font-weight:400;color:#9fc3ff;align-self:center}',
    '#xl .xl-pt{flex:1 1 70px;min-width:64px;border-radius:12px;padding:8px 8px 7px;text-align:center;background:rgba(120,170,255,.14);border:1px solid rgba(160,210,255,.45)}',
    '#xl .xl-pt u{display:block;text-decoration:none;font:800 18px/1.1 ui-monospace,Menlo,monospace;color:#fff;margin-bottom:4px}#xl .xl-pt small{display:block;font:500 11.5px/1.3 -apple-system,"SF Pro Display","PingFang SC",system-ui,sans-serif;color:#c4d6ff}',
    '#xl .xl-pt.pre{background:rgba(255,190,90,.14);border-color:rgba(255,200,110,.55)}#xl .xl-pt.suf{background:rgba(120,230,190,.12);border-color:rgba(130,230,190,.5)}',
    '#xl .xl-note{margin-top:auto;font:500 11px/1.35 -apple-system,"SF Pro Display","PingFang SC",system-ui,sans-serif;color:#8fa8d8}',
    '#xl .xl-ex{margin:0 0 9px;padding:9px 11px;border-radius:12px;background:rgba(120,170,255,.12);border:1px solid rgba(160,210,255,.3);font:400 14px/1.45 Georgia,serif;color:#eef4ff}#xl .xl-ex b{color:#fff;font-weight:700;text-shadow:0 0 10px rgba(160,210,255,.8)}',
    '#xl .xl-chips{display:flex;flex-wrap:wrap;gap:6px;margin-top:10px}#xl .xl-chips span{padding:4px 10px;border-radius:99px;background:rgba(120,170,255,.16);border:1px solid rgba(160,210,255,.4);font:600 12px/1.2 -apple-system,"SF Pro Display","PingFang SC",system-ui,sans-serif;color:#dbe8ff}',
    '#xl .xl-q{width:56px;height:56px;margin:6px auto 10px;border-radius:50%;display:flex;align-items:center;justify-content:center;font:800 30px/1 -apple-system,"SF Pro Display","PingFang SC",system-ui,sans-serif;color:#fff;background:radial-gradient(circle at 40% 35%,#6aa8ff,#2f5fd6);box-shadow:0 0 24px rgba(90,150,255,.8)}',
    '#xl .xl-ask{text-align:center;font:700 16px/1.35 -apple-system,"SF Pro Display","PingFang SC",system-ui,sans-serif;color:#fff;margin-bottom:12px}',
    '#xl .xl-opt{display:block;width:100%;margin:0 0 8px;padding:10px 12px;border-radius:999px;border:1px solid rgba(160,210,255,.5);background:rgba(40,70,170,.45);color:#eaf2ff;font:600 14px/1.25 -apple-system,"SF Pro Display","PingFang SC",system-ui,sans-serif;cursor:pointer;text-align:center;white-space:nowrap;overflow:hidden;text-overflow:ellipsis}',
    '#xl .xl-opt.ok{background:rgba(60,120,255,.75);border-color:#cfe2ff;box-shadow:0 0 18px rgba(110,170,255,.8)}#xl .xl-opt.no{background:rgba(200,60,90,.45);border-color:rgba(255,150,170,.7)}#xl .xl-opt[disabled]{cursor:default}',
    '#xl .xl-res{text-align:center;display:flex;flex-direction:column;align-items:center;justify-content:center;flex:1}',
    '#xl .xl-burst{font-size:64px;line-height:1;margin:4px 0 8px;filter:drop-shadow(0 0 18px rgba(255,200,80,.9))}',
    '#xl .xl-res h4{margin:0 0 8px;font:800 24px/1.1 -apple-system,"SF Pro Display","PingFang SC",system-ui,sans-serif;color:#9ff0b8}#xl .xl-res h4.no{color:#ffb3c2}#xl .xl-res p{margin:0 0 14px;font:500 14px/1.45 -apple-system,"SF Pro Display","PingFang SC",system-ui,sans-serif;color:#e5eeff}',
    '#xl .xl-btn{border:1px solid rgba(160,210,255,.7);background:rgba(60,110,255,.5);color:#fff;border-radius:999px;padding:9px 16px;font:700 14px/1 -apple-system,"SF Pro Display","PingFang SC",system-ui,sans-serif;cursor:pointer;box-shadow:0 0 14px rgba(90,150,255,.45)}',
    '#xl .xl-res.wait{opacity:.55}',
    '#xl .xl-bar{position:absolute;left:50%;bottom:calc(env(safe-area-inset-bottom,0px) + 96px);transform:translateX(-50%);display:flex;gap:8px;align-items:center;z-index:5;opacity:0}',
    'html.mn-dock-v #xl .xl-bar{bottom:calc(env(safe-area-inset-bottom,0px) + 22px)}#xl.holo .xl-bar{bottom:calc(env(safe-area-inset-bottom,0px) + 22px)}',
    '#xl .xl-hint{font:500 12px/1 -apple-system,"SF Pro Display","PingFang SC",system-ui,sans-serif;color:#a9bfe8;margin-right:4px;white-space:nowrap}',
    '#xl .xl-title{position:absolute;left:50%;top:calc(env(safe-area-inset-top,0px) + 18px);transform:translateX(-50%);font:700 13px/1 ui-monospace,Menlo,monospace;letter-spacing:.14em;color:#9fc3ff;text-transform:uppercase;opacity:0;white-space:nowrap}'
  ].join('\n');
  document.head.appendChild(css);

  /* ---------------- the layers ---------------- */
  function layersOf(f, list, it) {
    var L = [];
    var img = f.src ? '<div class="xl-img" style="background-image:url(&quot;' + esc(f.src) + '&quot;)"></div>' : '<div class="xl-img no">' + esc((f.title.charAt(0) || '').toUpperCase()) + '</div>';
    L.push({ k: 'word', n: '01', t: 'Word', html: '<div class="xl-top"><span><span class="xl-star">★</span> ' + esc(f.col || 'Minest') + '</span><button class="xl-say" type="button" data-say="1" title="朗读">🔊</button></div>' +
      '<div class="xl-w">' + esc(f.title) + '</div>' + (f.pron ? '<div class="xl-ph">' + esc(f.pron) + '</div>' : '') + img + (f.zh || f.defZh ? '<span class="xl-pill">' + esc(clip(f.zh || f.defZh, 26)) + '</span>' : '') });
    if (f.zh || f.defZh) L.push({ k: 'zh', t: '中文', html: '<div class="xl-big">' + esc(f.zh || clip(f.defZh, 30)) + '</div>' + (f.defZh && f.defZh !== f.zh ? '<div class="xl-p">' + esc(clip(f.defZh, 260)) + '</div>' : '') });
    if (f.ety) L.push({ k: 'ety', t: '词根词源', html: '<div class="xl-p">' + esc(clip(f.ety, 320)) + '</div>' });
    else if (f.parts) L.push({ k: 'ety', t: '词根词缀', html: '<div class="xl-big" style="font-size:22px">' + esc(f.head) + '</div><div class="xl-parts">' +
      f.parts.map(function (p) { return '<div class="xl-pt ' + p.k + '"><u>' + esc(p.p) + '</u><small>' + esc(p.m) + '</small></div>'; }).join('<b>+</b>') + '</div>' +
      '<div class="xl-note">按常见拉丁 / 希腊词根词缀拆解，帮助记忆；不是权威词源。</div>' });
    if (f.defEn) L.push({ k: 'en', t: 'English', html: '<div class="xl-p" style="font:400 16px/1.55 Georgia,serif;color:#f1f5ff">' + esc(clip(f.defEn, 360)) + '</div>' +
      (f.rel.length ? '<div class="xl-chips">' + f.rel.map(function (r) { return '<span>' + esc(r) + '</span>'; }).join('') + '</div>' : '') });
    if (f.ex.length) L.push({ k: 'ex', t: 'Examples', html: f.ex.map(function (e) {
      var tx = esc(clip(e.text, 200)), tg = e.target || f.head; if (tg) { var re = new RegExp('(' + String(tg).replace(/[.*+?^${}()|[\]\\]/g, '\\$&') + ')', 'i'); tx = tx.replace(re, '<b>$1</b>'); } return '<div class="xl-ex">' + tx + '</div>'; }).join('') });
    /* recall: the right answer and two from the other cards */
    var ans = answerOf(f), q = null;
    if (ans) {
      var others = []; (list || []).forEach(function (o) { if (!o || o.id === (it && it.id)) return; var a = answerOf(facts(o.raw, o)); if (a && a !== ans && others.indexOf(a) < 0) others.push(a); });
      if (others.length >= 2) { others.sort(function () { return Math.random() - 0.5; }); var opts = [ans, others[0], others[1]].sort(function () { return Math.random() - 0.5; }); q = { ask: '「' + f.title + '」是什么意思？', opts: opts, ans: ans }; }
    }
    if (!q && f.defEn) {
      var ws = []; (list || []).forEach(function (o) { if (o && o.id !== (it && it.id) && o.title && ws.indexOf(o.title) < 0) ws.push(o.title); });
      if (ws.length >= 2) { ws.sort(function () { return Math.random() - 0.5; }); q = { ask: clip(f.defEn, 110), opts: [f.title, ws[0], ws[1]].sort(function () { return Math.random() - 0.5; }), ans: f.title }; }
    }
    if (q) {
      L.push({ k: 'recall', t: 'Recall', q: q, html: '<div class="xl-q">?</div><div class="xl-ask">' + esc(q.ask) + '</div>' + q.opts.map(function (o, i) { return '<button type="button" class="xl-opt" data-opt="' + i + '">' + esc(o) + '</button>'; }).join('') });
      L.push({ k: 'result', t: 'Result', html: '<div class="xl-res wait"><div class="xl-burst">☆</div><h4>先作答</h4><p>在 Recall 里选一个答案。</p><button type="button" class="xl-btn" data-next="1">Next Card →</button></div>' });
    }
    L.forEach(function (l, i) { l.n = (i + 1 < 10 ? '0' : '') + (i + 1); });
    return L;
  }

  /* ---------------- the stage ---------------- */
  var cur = null;
  function open(it, list, opt) {
    close(true); opt = opt || {};
    var host = opt.container || document.body, f = facts(it && it.raw, it), L = layersOf(f, list, it);
    var el = document.createElement('div'); el.id = 'xl'; if (opt.holo) el.className = 'holo';
    el.innerHTML = '<div class="xl-bg"></div><div class="xl-title">Exploded Learning Card · ' + esc(f.title) + '</div><div class="xl-stage"></div>' +
      '<div class="xl-bar"><span class="xl-hint">点任意一层放大</span>' + (opt.onOpenCard ? '<button type="button" class="xl-btn" data-a="card">打开原卡</button>' : '') + '<button type="button" class="xl-btn" data-a="close">Close</button></div>';
    host.appendChild(el);
    ['pointerdown', 'touchstart', 'wheel', 'keydown'].forEach(function (t) { el.addEventListener(t, function (e) { e.stopPropagation(); }, { passive: true }); });
    var stage = el.querySelector('.xl-stage'), bg = el.querySelector('.xl-bg'), bar = el.querySelector('.xl-bar'), ttl = el.querySelector('.xl-title');
    var cards = L.map(function (l, i) {
      var c = document.createElement('div'); c.className = 'xl-c'; c.innerHTML = '<div class="xl-h"><i>' + l.n + '</i>' + esc(l.t) + '</div>' + l.html; stage.appendChild(c);
      c.addEventListener('click', function (e) {
        var t = e.target;
        if (t.closest('[data-say]')) { e.stopPropagation(); say(f.head || f.title); return; }
        if (t.closest('[data-next]')) { e.stopPropagation(); if (opt.onNext) { close(false, opt.onNext); } return; }
        var o = t.closest('[data-opt]'); if (o && l.q && !o.disabled) { e.stopPropagation(); answer(l, o); return; }
        focus = focus === i ? -1 : i;
      });
      return { el: c, s: { x: 0, y: 0, z: -i * 2, ry: 0, rx: 0, sc: 0.96, o: 0 }, t: null };
    });
    var res = L.filter(function (l) { return l.k === 'result'; })[0];
    function answer(l, btn) {
      var i = +btn.getAttribute('data-opt'), ok = l.q.opts[i] === l.q.ans, bs = btn.parentNode.querySelectorAll('[data-opt]');
      [].forEach.call(bs, function (b, j) { b.disabled = true; if (l.q.opts[j] === l.q.ans) b.classList.add('ok'); });
      if (!ok) btn.classList.add('no');
      try { if (window.MinestNative && MinestNative.haptic) MinestNative.haptic(ok ? 'success' : 'warning'); } catch (e) {}
      var ri = L.indexOf(res), r = ri >= 0 ? cards[ri].el.querySelector('.xl-res') : null;
      if (r) { r.classList.remove('wait'); r.innerHTML = '<div class="xl-burst">' + (ok ? '⭐' : '💭') + '</div><h4' + (ok ? '' : ' class="no"') + '>' + (ok ? '✓ Correct!' : '再想想') + '</h4><p>' + esc(f.title) + ' — ' + esc(l.q.ans) + '</p><button type="button" class="xl-btn" data-next="1">Next Card →</button>'; }
      setTimeout(function () { if (cur && ri >= 0) focus = ri; }, 650);
    }
    var W = 0, H = 0, lw = 250, lh = 330, focus = -1, phase = 'open', t0 = performance.now(), dead = false;
    function size() {
      W = el.clientWidth || 390; H = el.clientHeight || 700;
      lh = Math.min(380, H * 0.56); lw = Math.min(300, lh * 0.78, W * 0.62);
      cards.forEach(function (c) { c.el.style.width = lw + 'px'; c.el.style.height = lh + 'px'; c.el.style.marginLeft = (-lw / 2) + 'px'; c.el.style.marginTop = (-lh / 2) + 'px'; });
    }
    size(); var onR = function () { size(); }; window.addEventListener('resize', onR);
    function targets() {
      var n = cards.length, gap = n > 1 ? Math.min(lw * 0.8, (W * 0.92 - lw) / (n - 1)) : 0;
      return cards.map(function (c, i) {
        if (phase === 'close') return { x: 0, y: 0, z: -i * 2, ry: 0, rx: 0, sc: 0.9, o: 0 };
        if (phase === 'open' && performance.now() - t0 < 120 + i * 70) return { x: 0, y: 0, z: -i * 2, ry: 0, rx: 0, sc: 1, o: 1 };
        var x = (i - (n - 1) / 2) * gap, base = { x: x, y: -i * 5, z: -i * 34, ry: -20, rx: 4, sc: 1, o: 1 };
        if (focus >= 0) {
          if (i === focus) return { x: 0, y: -8, z: 220, ry: 0, rx: 0, sc: Math.min(1.25, (W * 0.86) / lw, (H * 0.8) / lh), o: 1 };
          return { x: x * 1.15 + (i < focus ? -lw * 0.4 : lw * 0.4), y: -i * 4 + 20, z: -160, ry: -24, rx: 4, sc: 0.86, o: 0.32 };
        }
        return base;
      });
    }
    function frame(now) {
      if (dead) return; requestAnimationFrame(frame);
      var T = targets(), k = 0.16, settled = true;
      cards.forEach(function (c, i) {
        var s = c.s, t = T[i];
        ['x', 'y', 'z', 'ry', 'rx', 'sc', 'o'].forEach(function (q) { var d = t[q] - s[q]; if (Math.abs(d) > 0.002) settled = false; s[q] += d * k; });
        c.el.style.transform = 'translate3d(' + s.x.toFixed(1) + 'px,' + s.y.toFixed(1) + 'px,' + s.z.toFixed(1) + 'px) rotateY(' + s.ry.toFixed(2) + 'deg) rotateX(' + s.rx.toFixed(2) + 'deg) scale(' + s.sc.toFixed(3) + ')';
        c.el.style.opacity = s.o.toFixed(3); c.el.style.zIndex = focus === i ? 100 : 50 - i;
        c.el.style.pointerEvents = s.o < 0.2 ? 'none' : '';
      });
      var vis = phase === 'close' ? 0 : 1, bo = +bg.style.opacity || 0; bo += (vis - bo) * 0.14; bg.style.opacity = bo.toFixed(3); bar.style.opacity = bo.toFixed(3); ttl.style.opacity = bo.toFixed(3);
      if (phase === 'close' && bo < 0.02 && settled) { dead = true; window.removeEventListener('resize', onR); el.remove(); var cb = cur && cur.after; cur = null; if (cb) cb(); }
    }
    requestAnimationFrame(frame);
    bar.addEventListener('click', function (e) { var a = e.target.closest('[data-a]'); if (!a) return; e.stopPropagation();
      if (a.getAttribute('data-a') === 'close') close(); else if (opt.onOpenCard) { close(true); opt.onOpenCard(it); } });
    el.addEventListener('click', function (e) { if (e.target === el || e.target === bg || e.target === stage) { if (focus >= 0) focus = -1; } });
    cur = { el: el, setPhase: function (p) { phase = p; }, kill: function () { dead = true; window.removeEventListener('resize', onR); el.remove(); }, focusOff: function () { focus = -1; }, hasFocus: function () { return focus >= 0; } };
    try { if (window.MinestNative && MinestNative.haptic) MinestNative.haptic('medium'); } catch (e) {}
    return cur;
  }
  function close(now, after) {
    if (!cur) return;
    if (now) { cur.kill(); cur = null; return; }
    cur.after = after || null; cur.setPhase('close');
  }
  function say(w) {
    try { var u = new SpeechSynthesisUtterance(String(w)); u.lang = 'en-US'; u.rate = 0.9; speechSynthesis.cancel(); speechSynthesis.speak(u); } catch (e) {}
  }
  document.addEventListener('keydown', function (e) { if (e.key === 'Escape' && cur) { e.stopPropagation(); if (cur.hasFocus()) cur.focusOff(); else close(); } }, true);
  window.MinestExplode = { open: open, close: close, isOpen: function () { return !!cur; }, facts: facts, parts: parts };
})();

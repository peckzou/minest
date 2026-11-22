/* Minest · Cognitive Toolkit — one-tap Chinese (window.MinestI18n)
   The page is written in English. With Chinese on, every text node, placeholder, title and aria-label whose text has a
   translation is shown in Chinese; turning it off puts the English back (the original is kept on the node).
   Sources: UI strings below + patterns for composed strings + data translations (i18n/zh.json: templates, models,
   experiments, framework texts) + names the data already has in Chinese (taxonomy places, framework names, concept
   labels with a zh label). User-written text is never machine-translated. Choice kept per device (minest.toolkit.lang). */
(function () {
  'use strict';
  var KEY = 'minest.toolkit.lang';
  var lang = 'en'; try { lang = localStorage.getItem(KEY) === 'zh' ? 'zh' : 'en'; } catch (e) {}
  var D = {};
  var UI = {
    // shell
    'Cognitive Toolkit': '认知工具箱', 'Lab': '实验版', 'Direction · Structure · Method · Experience · Connection — from one thought to your own knowledge system.': '方向 · 结构 · 方法 · 体验 · 连接——从一个想法出发，建立你自己的知识体系。',
    'Lab · saved in this browser only · not synced': '实验版 · 仅保存在本浏览器 · 未同步', 'A word, a question, a thought or a real problem': '一个词、一个问题、一个想法，或一个现实问题', 'Explore': '探索',
    'Recent:': '最近：', 'Type something above. Five cards open on it — and everything you make in one card is there in the others.': '在上面输入内容，五张卡片会围绕它展开——在一张卡里做的任何东西，其他卡里都能看到。',
    'Import a knowledge object (JSON)': '导入知识对象（JSON）', 'New thought': '新想法', 'Export JSON': '导出 JSON', 'Delete': '删除', 'Five cards': '五卡入口', 'Open →': '打开 →',
    'Question': '疑问', 'Goal': '目标', 'Hypothesis': '假设', 'Opinion': '观点', 'Concept / term': '概念 / 词汇', 'Statement / event': '陈述 / 事件', 'Input': '输入',
    'confirmed by you': '已由你确认', 'suggested': '建议', 'Not placed yet': '尚未定位', 'Confirmed': '已确认', 'Suggested': '建议', 'Not placed yet — place it yourself': '尚未定位——请自行定位',
    // card names + lines
    'Thought Compass': '思想罗盘', 'Framework Card': '知识框架卡', 'Thinking Models': '思维模型卡', 'Thinking Lab': '思维实验室', 'Knowledge Graph': '知识图谱卡',
    'Find where a thought sits and which way to think next.': '找到想法所在的位置，以及下一步往哪里想。', 'Organise ideas into a structure you can edit.': '把想法组织成可编辑的结构。',
    'Analyse the question step by step with a method.': '用一种方法一步步分析问题。', 'Make an idea visible and try it with your own hands.': '让想法看得见，亲手试一试。', 'See and edit how everything connects.': '查看并编辑一切如何相互连接。',
    // compass
    'Where this sits': '它在哪里', 'Why the suggestion': '为什么这样建议', 'Primary place': '主要位置', '— not placed —': '— 未定位 —', 'Confirm placement': '确认定位', 'Save placement': '保存定位',
    'Confirmed by you': '已由你确认', 'Suggested · uncertain': '建议 · 不确定', 'Primary': '设为主要', '+ Also': '+ 也属于', 'Places in this domain — set one as primary or add it as another place.': '这个领域里的位置——设为主要位置，或添加为另一个位置。',
    'Thinking models for this angle': '适合这个角度的思维模型', 'Experiments': '实验', 'Belongs to': '属于', 'Contains': '包含', 'Open in Framework': '在框架卡中打开', 'Show in Graph': '在图谱中显示',
    'No concepts yet': '还没有概念', 'Concepts appear here when you add them in the Framework Card or the Graph.': '在框架卡或图谱中添加概念后，会出现在这里。', 'Open Framework Card': '打开框架卡',
    'Go on with this thought': '继续这个想法', 'Drag a ring · tap a segment · ← → turns the active ring': '拖动圆环 · 点按分区 · ← → 转动当前圆环', 'Not placed. Choose a place below — or leave it unplaced.': '未定位。可以在下面选择位置，也可以不定位。',
    'Primary place set': '已设为主要位置', 'Added as another place': '已添加为另一个位置', 'Removed': '已移除', 'Placement saved': '定位已保存',
    'Define': '定义', 'Compare': '比较', 'Cause': '原因', 'Value': '价值', 'System': '系统', 'Experience': '体验',
    // framework
    'Frameworks': '框架', '+ New framework': '+ 新建框架', 'Notes from other cards': '来自其他卡片的笔记', 'No framework yet.': '还没有框架。', 'Understandings saved in the Lab or Models appear here.': '在实验室或思维模型中保存的理解会出现在这里。',
    'Add to framework': '加入框架', 'Choose a framework template': '选择框架模板', 'Each template is a starting structure — every node can be renamed, moved or deleted. Philosophy templates say what they are and what they are not.': '每个模板只是一个起点——所有节点都可以重命名、移动或删除。哲学模板会说明它是什么、不是什么。',
    'fits': '适合', 'review pending': '待审核', 'reviewed': '已审核', 'Mark reviewed': '标为已审核', 'Mark pending': '标为待审核', 'Cancel': '取消', 'Outline': '大纲', 'Tree': '树', 'Levels': '分层', 'Cards': '卡片', 'Delete framework': '删除框架',
    'Topic': '主题', 'Minest': 'Minest', 'Concept': '概念', 'Philosopher': '哲学家', 'Theory': '理论', 'Case': '案例', 'Note': '笔记', 'Model analysis': '模型分析', 'Experiment': '实验',
    'Enter: new item · Tab / Shift-Tab: indent · drag ⋮⋮ to move (drop on the right half of a row to put it inside) · items under a section become concepts shared with every card.': '回车：新建 · Tab / Shift-Tab：缩进 · 拖动 ⋮⋮ 移动（放到某行右半边即放入其内）· 栏目下的条目会成为所有卡片共享的概念。',
    'Add link': '添加链接', 'My view': '我的观点', 'Evidence': '证据', 'Quotation (with source)': '引文（需注明出处）', 'My question': '我的问题', 'Add a note…': '添加笔记…', 'Source (needed for a quotation or evidence)': '出处（引文或证据必填）', 'Add note': '添加笔记',
    'Scholarly interpretation': '研究者解释', 'Minest summary': 'Minest 摘要', 'AI / engine suggestion': 'AI / 引擎建议', 'Open question': '开放问题',
    'Add the source for a quotation or evidence': '引文或证据需要注明出处', 'Marked as reviewed by you': '已由你标为已审核', 'Marked as review pending': '已标为待审核', 'Can’t move it there': '不能移到那里',
    // models
    'Suggested for this question': '适合这个问题', 'All models': '全部模型', 'Saved analyses': '已保存的分析', 'None yet.': '还没有。', 'No suggestion — pick any model.': '暂无建议——任选一个模型。',
    'Save analysis': '保存分析', 'Save changes': '保存修改', 'Start a fresh one': '重新开始', 'Add': '添加', 'Add and press Enter': '输入后按回车添加', 'Connect': '连接', '+ (same direction)': '+（同向）', '− (opposite)': '−（反向）',
    'Add case': '添加案例', 'Result': '结果', 'Compare analyses': '比较分析', 'The same question through different models. What does each one make you notice?': '同一个问题，经过不同模型。每个模型让你注意到了什么？', '← Back': '← 返回',
    'Add at least two parts in the step above first.': '请先在上一步添加至少两个部分。', 'Add rows in the step above first.': '请先在上一步添加行。', 'No closed loop yet': '还没有闭合的环',
    'Saved — it now appears in the Graph.': '已保存——现在可以在图谱中看到。', 'Pick two different parts': '请选择两个不同的部分',
    // lab
    'Each experiment is a model that helps you understand — none of them proves a philosophical theory.': '每个实验都是帮助理解的模型——没有一个能证明哪种哲学理论。', 'fits this question': '适合这个问题', '▶ Start': '▶ 开始', 'Done for this object': '这个对象已完成的实验', 'Nothing yet.': '还没有。', 'completed': '已完成', 'partial': '未完成',
    'Back': '上一步', 'Next': '下一步', 'Done': '完成', 'Save first': '先保存', 'Close': '关闭', 'tap to turn over': '点按翻开', 'Use this': '使用', 'Use this case': '使用这个案例', 'Use this example': '使用这个例子',
    'What I understood': '我的理解', 'A question I still have': '我还有的疑问', 'In my own words…': '用我自己的话…', 'Save to my knowledge': '保存到我的知识', 'Save to my knowledge log': '保存到我的知识记录', 'Your judgment': '你的判断', 'Your example': '你的例子', 'Your case': '你的案例',
    'What you tried': '你试过的', 'Situations tried': '试过的情况', 'Saved to this knowledge object. You can see it in the Framework and the Graph.': '已保存到这个知识对象，可以在框架卡和图谱中看到。', '(optional)': '（选填）', '(changed)': '（已改变）',
    'Fill in the fields that are not optional.': '请填写非选填的项目。', 'I’ve watched the wall': '我看过墙了', 'He wakes up →': '他醒来了 →', 'He wakes and wants to stay': '他醒来，想留下',
    'Fire height': '火的高度', 'Puppet: nearer the wall ↔ nearer the fire': '木偶：靠近墙 ↔ 靠近火', 'Face the wall': '面向墙', 'Turn around': '转过身', 'Go outside': '走出洞穴', 'Things tried': '试过的', 'try at least 3': '至少试 3 种', 'try at least 2': '至少试 2 个',
    'low wall': '矮墙', 'What the prisoner sees: the wall': '囚徒看到的：墙', 'Turned around: the fire and the puppets': '转过身：火光和木偶', 'Outside: the real horse, in sunlight': '洞外：阳光下真实的马',
    'Correct': '正确', 'something': '某物', 'pure being': '纯有', 'Features left': '剩下的特征', 'No feature left — no ‘what’ at all.': '没有剩下任何特征——没有任何“是什么”。', 'Being': '有', 'Nothing': '无', 'Becoming': '变易',
    'ceasing-to-be': '消逝', 'coming-to-be': '生成', 'How does pure being differ from pure nothing? Try one:': '纯有和纯无有什么不同？试一个：', 'Watch the two': '观察二者', 'Watch again': '再看一次', 'Differences tried': '试过的区别',
    'Does what he wants': '做他想做的', 'Could do otherwise': '能够做别的选择', '🔓 Unlock the door': '🔓 打开门锁', '🔒 Lock the door': '🔒 锁上门', 'Make him want to leave': '让他想离开', 'Make him want to stay': '让他想留下', 'He knows about the lock': '让他知道门锁着', 'He doesn’t know about the lock': '让他不知道门锁着',
    'Yes, A caused B': '是，A 导致了 B', 'No': '否', 'Not sure': '不确定', 'Press A yourself': '亲手按 A', 'Lift the curtain': '掀开幕布', 'Stop the timer': '停下定时器', 'Restart the timer': '重启定时器', 'The lamps': '两盏灯', 'The house': '房子', 'The ship': '船',
    'Look at the three parts in any order you like.': '按你喜欢的任意顺序看这三个部分。', 'Follow the ship. Tap where you see it — try another order too.': '跟着船看。点你看到它的位置——也试试别的顺序。', 'Roof': '屋顶', 'Window': '窗户', 'Door': '门', 'Upstream': '上游', 'Midstream': '中游', 'Downstream': '下游', 'downstream →': '下游 →',
    'Intervene on A': '干预 A', 'Look behind the curtain': '看看幕布后面', 'Look over the house': '看完房子', 'Follow the ship': '跟随船', 'What came first (A)': '先发生的（A）', 'What came after (B)': '后发生的（B）', 'Check it like the lamps': '像检查灯那样检查', 'Why (optional)': '原因（选填）',
    'A situation from your life': '你生活中的一个情境', 'Do you do it because you want to?': '你这样做是因为你想这样做吗？', 'Could you do otherwise if you wanted?': '如果你想，你能做别的选择吗？', 'Yes': '是',
    // graph
    'Show': '显示', 'Made by': '由谁建立', 'Everyone': '所有', 'Only me': '只看我的', 'Minest library & suggestions': 'Minest 资料库和建议', 'Include links from my other objects': '包含我其他对象中的连接', 'Link': '连接', 'Type': '类型',
    'Save link': '保存连接', 'Reverse': '反转方向', 'Connect to…': '连接到…', 'Center': '居中', 'Expand': '展开', 'In Framework': '在框架卡中', 'Remove from this object': '从这个对象中移除', 'How to use': '使用方法',
    'Tap a node to see and edit its links. Drag nodes to arrange; drag the background to pan; pinch or wheel to zoom. “Connect to…” makes a new link of the type you choose.': '点按节点查看和编辑它的连接。拖动节点整理位置；拖动背景平移；双指或滚轮缩放。“连接到…”可以建立你选定类型的新连接。',
    'Export this object (JSON)': '导出这个对象（JSON）', 'Fit': '适应窗口', '+ Concept': '+ 概念', 'Re-arrange': '重新排列', 'New link': '新连接', 'Note (optional)': '备注（选填）', 'Create link': '建立连接', 'Name': '名称', 'Link created': '连接已建立', 'Link saved': '连接已保存', 'Renamed everywhere': '已在所有地方重命名',
    'Belongs to ': '属于', 'Related to': '相关', 'Supports': '支持', 'Refutes': '反驳', 'Influences': '影响', 'Applies to': '应用于', 'Illustrates': '例示', 'Leads to (my judgment)': '导致（我的判断）',
    'Supported by': '被支持', 'Refuted by': '被反驳', 'Influenced by': '受影响于', 'Applied by': '被应用', 'Illustrated by': '被例示', 'Follows from (my judgment)': '由…导致（我的判断）',
    'You': '你', 'Suggested (local rules)': '建议（本地规则）', 'Suggested by AI': 'AI 建议', 'AI suggestion you accepted': '你采纳的 AI 建议', 'Minest library': 'Minest 资料库', 'Made in the Graph': '在图谱中建立', 'Topic of this object': '这个对象的主题', 'Suggested / library (dashed)': '建议 / 资料库（虚线）',
    'Mind the mapping: the lamps belong to layer ② (experience and method). The house and the ship are Kant’s own example for layer ③.': '注意对应关系：灯的实验对应第 ② 层（经验与方法）；房子与船才是康德本人用来说明第 ③ 层的例子。',
    'nodes ·': '个节点 ·', 'links': '条连接', 'Untitled': '未命名', 'Switch to English': 'Switch to English', '一键切换中文': '一键切换中文',
    'Cloud sync: off — this browser only': '云同步：关闭——仅在本浏览器', 'Connecting…': '正在连接…', 'Sign in with Google to sync': '用 Google 登录以同步', 'Syncing…': '正在同步…', 'Synced': '已同步', 'Sync problem': '同步出错',
    'Too large to sync': '数据太大，无法同步', 'The cloud refused to save (permission denied)': '云端拒绝保存（没有权限）', 'The cloud refused to read (permission denied)': '云端拒绝读取（没有权限）', 'Try again?': '要重试吗？',
    'Turn cloud sync off on this device? Your records stay here and in the cloud.': '要在这台设备上关闭云同步吗？你的记录会保留在本机和云端。',
    '中文': '中文'
  };
  var PAT = [
    [/^also (.+)$/, function (m) { return '也属于 ' + m[1].split(', ').map(t).join('、'); }],
    [/^(\d+) steps: (.+)$/, function (m) { return m[1] + ' 步：' + m[2].split(' · ').map(t).join(' · '); }],
    [/^(\d+) nodes · (\d+) links$/, function (m) { return m[1] + ' 个节点 · ' + m[2] + ' 条连接'; }],
    [/^Rounds watched: (\d+)( \(watch at least 3\))?$/, function (m) { return '已看轮数：' + m[1] + (m[2] ? '（至少看 3 轮）' : ''); }],
    [/^Situations tried: (\d+) of 4( \(try at least 3\))?$/, function (m) { return '试过的情况：' + m[1] + ' / 4' + (m[2] ? '（至少试 3 种）' : ''); }],
    [/^(\d+) of (\d+) steps · built only from what you entered$/, function (m) { return '已完成 ' + m[1] + ' / ' + m[2] + ' 步 · 只根据你填写的内容生成'; }],
    [/^Synced · (.+)$/, function (m) { return '已同步 · ' + m[1]; }],
    [/^(\d+) items?( · review pending)?$/, function (m) { return m[1] + ' 个条目' + (m[2] ? ' · 待审核' : ''); }],
    [/^(\d+) frameworks? · (\d+) items$/, function (m) { return m[1] + ' 个框架 · ' + m[2] + ' 个条目'; }],
    [/^(\d+) analys[ie]s saved$/, function (m) { return '已保存 ' + m[1] + ' 个分析'; }],
    [/^(\d+) done for this object$/, function (m) { return '这个对象已完成 ' + m[1] + ' 个'; }],
    [/^(\d+) experiments ready$/, function (m) { return '已有 ' + m[1] + ' 个实验'; }],
    [/^Compare selected \((\d+)\)$/, function (m) { return '比较所选（' + m[1] + '）'; }],
    [/^Links \((\d+)\)$/, function (m) { return '连接（' + m[1] + '）'; }],
    [/^All (\d+) concepts in this object$/, function (m) { return '这个对象中的全部 ' + m[1] + ' 个概念'; }],
    [/^Starter structure ready: (.+)$/, function (m) { return '入门结构已备好：' + t(m[1]); }],
    [/^Start from a template$/, function () { return '从模板开始'; }],
    [/^Fits: (.*?)( ·)?$/, function (m) { return '适用：' + m[1].split(', ').map(t).join('、') + (m[2] ? ' ·' : ''); }],
    // the local engine's reasons
    [/^(“.+”|Your earlier correction|A framework you named) → (.+)$/, function (m) { return (m[1] === 'Your earlier correction' ? '你之前的纠正' : m[1] === 'A framework you named' ? '你提到的框架' : m[1]) + ' → ' + t(m[2]); }],
    [/^(.+) is usually discussed with (.+) \(a “see also” link in the taxonomy\)$/, function (m) { return t(m[1]) + '常与「' + t(m[2]) + '」一起讨论（分类表中的“另见”）'; }],
    [/^Also mentions (.+) → (.+)$/, function (m) { return '也提到 ' + m[1] + ' → ' + t(m[2]); }],
    [/^You placed a similar thought under (.+?)( with (.+))? before$/, function (m) { return '你之前把类似的想法归到「' + t(m[1]) + '」' + (m[3] ? '，框架选了「' + t(m[3]) + '」' : ''); }],
    [/^(.+) is almost as likely — the placement is uncertain$/, function (m) { return '「' + t(m[1]) + '」也差不多可能——定位不确定'; }],
    [/^Few cues — the placement is uncertain$/, function () { return '线索不多——定位不确定'; }],
    [/^No clear cues — please choose a place yourself$/, function () { return '没有明确线索——请你自己选择位置'; }],
    [/^Phrased as a cause-and-effect claim \((.+)\) — the topic words become a related place$/, function (m) { return '句子是因果主张的说法（' + m[1] + '）——话题词作为相关位置'; }],
    [/^local-rules\/0\.1 · knowledge can sit in more than one place$/, function () { return '本地规则 0.1 · 知识可以属于不止一个位置'; }],
    [/^Limits:$/, function () { return '局限：'; }],
    [/^Limits: (.+)$/, function (m) { return '局限：' + t(m[1]); }],
    [/^Source: (.+)$/, function (m) { return '出处：' + m[1]; }],
    [/^In the experiment: (.+)$/, function (m) { return '实验中对应：' + t(m[1]); }],
    [/^from (.+)$/, function (m) { return '来自 ' + t(m[1]); }],
    [/^Fits because: (.+)$/, function (m) { return '适合原因：' + m[1]; }],
    [/^Kind: (.+?) · made by: (.+)$/, function (m) { return '内容类型：' + t(m[1]) + ' · 建立者：' + t(m[2]); }],
    [/^Answer: (.+)$/, function (m) { return '回答：' + m[1]; }],
    [/^Things tried: (\d+) \/ 4(.*)$/, function (m) { return '试过的：' + m[1] + ' / 4' + (m[2] ? '——至少试 3 种' : ''); }],
    [/^Differences tried: (\d+) \/ (\d+)(.*)$/, function (m) { return '试过的区别：' + m[1] + ' / ' + m[2] + (m[3] ? '——至少试 2 个' : ''); }],
    [/^Correct: (\d) \/ 4$/, function (m) { return '正确：' + m[1] + ' / 4'; }],
    [/^Features left: (\d+)$/, function (m) { return '剩下的特征：' + m[1]; }],
    [/^“(.+)” created$/, function (m) { return '已创建“' + t(m[1]) + '”'; }],
    [/^Saved to “(.+)” — see it in the Framework and the Graph$/, function (m) { return '已保存到“' + m[1] + '”——可在框架卡和图谱中查看'; }],
    [/^(\S.*? › .+)$/, function (m) { return m[1].split(' › ').map(t).join(' › '); }]   // a bare place path, last so sentences match first
  ];
  function t(s) {
    if (s == null) return s; var k = String(s); if (lang !== 'zh') return k;
    if (D[k] != null) return D[k];
    var tr = k.trim(); if (D[tr] != null) return k.replace(tr, D[tr]);
    for (var i = 0; i < PAT.length; i++) { var m = tr.match(PAT[i][0]); if (m) return k.replace(tr, PAT[i][1](m)); }
    return k;
  }
  function add(map) { Object.keys(map || {}).forEach(function (k) { if (map[k]) D[k] = map[k]; }); }
  add(UI);

  // ---------------------------------------------------------------- DOM: translate in place, remember the English
  var SKIP = { SCRIPT: 1, STYLE: 1, TEXTAREA: 1 };
  function doText(n) {
    if (n.__en == null) { if (!/[A-Za-z]/.test(n.nodeValue)) return; n.__en = n.nodeValue; }
    var v = lang === 'zh' ? t(n.__en) : n.__en; if (n.nodeValue !== v) { busy = true; n.nodeValue = v; busy = false; }
  }
  function doAttr(el) {
    ['placeholder', 'title', 'aria-label'].forEach(function (a) {
      if (!el.hasAttribute(a)) return; var key = '__en_' + a;
      if (el[key] == null) el[key] = el.getAttribute(a);
      var v = lang === 'zh' ? t(el[key]) : el[key]; if (el.getAttribute(a) !== v) { busy = true; el.setAttribute(a, v); busy = false; }
    });
  }
  function walk(root) {
    if (!root) return;
    if (root.nodeType === 3) { if (!root.parentNode || !SKIP[root.parentNode.nodeName]) doText(root); return; }
    if (root.nodeType !== 1 || SKIP[root.nodeName] || (root.closest && root.closest('[data-noi18n]'))) return;
    doAttr(root);
    var tw = document.createTreeWalker(root, NodeFilter.SHOW_TEXT | NodeFilter.SHOW_ELEMENT, null), x;
    while ((x = tw.nextNode())) {
      if (x.nodeType === 1) { if (SKIP[x.nodeName] || x.hasAttribute('data-noi18n')) continue; doAttr(x); }
      else if (!SKIP[x.parentNode.nodeName]) doText(x);
    }
  }
  var busy = false, obs = null;
  function observe() {
    if (obs || !window.MutationObserver) return;
    obs = new MutationObserver(function (list) {
      if (busy) return;
      list.forEach(function (m) {
        if (m.type === 'characterData') { if (m.target.__en != null && m.target.nodeValue !== t(m.target.__en)) m.target.__en = m.target.nodeValue; doText(m.target); }
        else if (m.type === 'attributes') doAttr(m.target);
        else m.addedNodes.forEach(walk);
      });
    });
    obs.observe(document.body, { childList: true, subtree: true, characterData: true, attributes: true, attributeFilter: ['placeholder', 'title', 'aria-label'] });
  }
  function set(l) {
    lang = l === 'zh' ? 'zh' : 'en'; try { localStorage.setItem(KEY, lang); } catch (e) {}
    document.documentElement.lang = lang === 'zh' ? 'zh-CN' : 'en';
    document.documentElement.classList.toggle('lang-zh', lang === 'zh');
    walk(document.body); paintBtn();
    (api.listeners || []).forEach(function (f) { try { f(lang); } catch (e) {} });
  }
  function paintBtn() { var b = document.getElementById('tk-lang'); if (!b) return; b.setAttribute('aria-pressed', lang === 'zh'); b.classList.toggle('on', lang === 'zh'); b.querySelector('b').textContent = lang === 'zh' ? 'EN' : '中'; b.__en_title = b.title = lang === 'zh' ? 'Switch to English' : '一键切换中文'; }
  var api = { t: t, add: add, set: set, lang: function () { return lang; }, listeners: [], onChange: function (f) { api.listeners.push(f); },
    start: function () { observe(); set(lang); var b = document.getElementById('tk-lang'); if (b) b.onclick = function () { set(lang === 'zh' ? 'en' : 'zh'); }; } };
  window.MinestI18n = api;
})();

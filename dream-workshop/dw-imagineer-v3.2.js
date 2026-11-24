/* Minest Dream Workshop — Imagineer 3.2 add-on.
 * Adds context-aware regeneration to the new-work panel without replacing 3.1.
 * Load after dw-imagineer.js, dw-edit.js, and dw-app.js.
 */
(function (root) {
  'use strict';
  var base = root.DWImagineer, doc = root.document;
  if (!base || !root.DWApp || !doc) return;

  var originalOpen = base.open;
  var activeNew = false, busy = false, result = null, note = '';
  var idea = '';
  var seedIdea = '';
  var history = [];
  var examples = [
    '一座会讲故事的森林小屋：老奶奶坐在门口，观众走近时她讲一个关于月亮的故事。',
    '夜晚的博物馆里，一幅会说话的画像讲述画里的秘密，观众点它时会眨眼。',
    '乘小船经过风车村、灯笼桥和一座小城堡，每一站都有自己的故事。',
    '做一个思想花园：观众种下一颗问题的种子，看它长成一棵会回答问题的树。'
  ];
  try { idea = root.localStorage.getItem('minest_imagineer_idea') || ''; } catch (e) {}

  function $(selector) { return doc.querySelector(selector); }
  function esc(value) {
    return String(value == null ? '' : value).replace(/[&<>"']/g, function (ch) {
      return { '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' }[ch];
    });
  }
  function stop(event) {
    event.preventDefault();
    event.stopPropagation();
    if (event.stopImmediatePropagation) event.stopImmediatePropagation();
  }
  function modes() {
    return '<div class="dw-tabs2"><button type="button" data-mode2="edit" aria-pressed="false">✏️ 修改这件作品</button>' +
      '<button type="button" data-mode2="new" aria-pressed="true">✨ 新作品</button></div>';
  }
  function status(message, retry) {
    if (!message) return '';
    return '<p class="dw-ierr" role="status" aria-live="polite">' + esc(message) +
      (retry ? ' <button type="button" class="dw-btn" data-retry="new">再试一次</button>' : '') + '</p>';
  }
  function render(focus) {
    var body = $('#dw-ibody');
    if (!body || !activeNew) return;
    var html = modes() +
      '<p class="dw-muted">描述你想做的体验。Imagineer 会生成一份可编辑的初始方案；再生成时会参考上一版，换一个构想方向。</p>' +
      '<label class="dw-f">我的想法<textarea id="dw-idea" rows="4" maxlength="1200" placeholder="例如：观众走近森林小屋时，老奶奶开始讲月亮的故事。"></textarea></label>' +
      '<div class="dw-chips">' + examples.map(function (item, index) {
        return '<button type="button" class="dw-chip" data-v32-ex="' + index + '">' + esc(item.slice(0, 15)) + '…</button>';
      }).join('') + '</div>' +
      '<button type="button" class="dw-btn dw-main" id="dw-igo"' + (busy ? ' disabled' : '') + '>' +
        (busy ? '✨ Imagineer 正在构思…' : '✨ 生成方案') + '</button>' +
      '<p class="dw-muted dw-hint">按 Ctrl / ⌘ + Enter 提交。想法改变后会自动开始新的构想，不会沿用上一轮。</p>' +
      (history.length ? '<p class="dw-muted" role="status">已保留最近几轮的构想上下文。</p>' : '') +
      status(note, !!note);
    if (busy) html += '<p class="dw-muted" role="status" aria-live="polite">正在整理场景、路线和演出节奏…</p>';
    if (result) {
      var alive = (result.objects || []).filter(function (item) { return item.life && item.life.on; });
      var warnings = result.imagineer && result.imagineer.warnings || [];
      html += '<div class="dw-iplan"><h3>✨ ' + esc(result.title) + '</h3>' +
        '<p>' + esc(result.imagineer && result.imagineer.summary || '') + '</p>' +
        '<ul><li>' + (result.objects || []).length + ' 样东西' +
        (alive.length ? '，会说话的：' + alive.map(function (item) { return esc(item.name); }).join('、') : '') + '</li>' +
        '<li>' + (result.zones || []).length + ' 个触发区 · 观众路线 ' + (result.route || []).length + ' 个点' +
        (result.ride && result.ride.mode === 'boat' ? ' · 乘船游览' : '') + '</li>' +
        '<li>演出 ' + Math.round(result.timeline && result.timeline.len || 0) + ' 秒 · ' +
        (result.timeline && result.timeline.clips || []).length + ' 段灯光、动作、台词或音乐</li></ul>' +
        (warnings.length ? '<ul class="dw-muted">' + warnings.map(function (item) { return '<li>' + esc(item) + '</li>'; }).join('') + '</ul>' : '') +
        '<div class="dw-row"><button type="button" class="dw-btn dw-main" id="dw-iuse">用这个方案开始导演</button>' +
        '<button type="button" class="dw-btn" id="dw-iregen">↻ ' +
        (history.length ? '参考上一版，换个方向' : '再生成一版') + '</button></div></div>';
    }
    body.innerHTML = html;
    var input = $('#dw-idea');
    if (input) {
      input.value = idea;
      if (focus) input.focus();
    }
  }
  function compactSummary(work) {
    var names = (work.objects || []).slice(0, 12).map(function (item) { return item.name; }).filter(Boolean);
    var text = '方案「' + (work.title || '新的体验') + '」：' +
      ((work.imagineer && work.imagineer.summary) || '已生成可编辑的体验方案。');
    if (names.length) text += ' 场景元素：' + names.join('、') + '。';
    return text.slice(0, 1800);
  }
  function generate(variant) {
    if (busy) return;
    var input = $('#dw-idea');
    var current = String(input ? input.value : idea || '').trim().slice(0, 1200);
    if (current.length < 2) { note = '先写下你的想法（至少两个字）'; result = null; render(true); return; }
    if (seedIdea && current !== seedIdea) {
      history = [];
      result = null;
      variant = false;
    }
    seedIdea = current;
    idea = current;
    try { root.localStorage.setItem('minest_imagineer_idea', current); } catch (e) {}
    var requestIdea = current;
    if (variant && history.length) {
      requestIdea += '\n\n请参考上一版，保留原始核心想法，但换一个明显不同的构想方向；尽量更换主要布景、触发方式或演出节奏，避免重复上一版。';
    }
    var context = history.slice(-8);
    busy = true;
    note = '';
    result = null;
    render(false);
    base.ask(requestIdea, context).then(function (plan) {
      result = base.toWork(plan, current);
      if (result.imagineer) result.imagineer.version = '3.2';
      history.push({ role: 'user', text: requestIdea });
      history.push({ role: 'assistant', text: compactSummary(result) });
      history = history.slice(-8);
    }).catch(function (error) {
      var message = error && error.message || 'AI 没有连上';
      try {
        result = base.localDraft(current);
        if (result.imagineer) result.imagineer.version = '3.2';
        note = message + '。先为你准备了本地草稿；可以重试 AI 生成。';
      } catch (localError) {
        result = null;
        note = message + '，本地草稿也没能生成。';
      }
    }).then(function () {
      busy = false;
      render(false);
    });
  }
  function adopt() {
    if (!result) return;
    try {
      root.DWApp.adopt(result);
      result = null;
      history = [];
      seedIdea = '';
      activeNew = false;
      var sheet = $('#dw-isheet');
      if (sheet) sheet.hidden = true;
    } catch (error) {
      note = '没能开始导演：' + (error && error.message || '未知错误');
      render(false);
    }
  }
  base.open = function (mode) {
    var target = mode || (root.DWApp.work() ? 'edit' : 'new');
    activeNew = target === 'new' || !root.DWApp.work();
    var output = originalOpen.call(base, target);
    if (activeNew) setTimeout(function () { render(true); }, 0);
    return output;
  };
  base.version = '3.2';

  doc.addEventListener('click', function (event) {
    var target = event.target;
    if (!target || !target.closest) return;
    if (target.closest('#dw-imag')) {
      stop(event);
      base.open(root.DWApp.work() ? 'edit' : 'new');
      return;
    }
    var sheet = $('#dw-isheet');
    if (!sheet) return;
    if (target.closest('#dw-iclose') || target === sheet) { activeNew = false; return; }
    if (!sheet.contains(target)) return;
    if (target.closest('[data-mode2="new"]')) { stop(event); base.open('new'); return; }
    if (target.closest('[data-mode2="edit"]')) { stop(event); activeNew = false; base.open('edit'); return; }
    if (!activeNew) return;
    var example = target.closest('[data-v32-ex]');
    if (example) {
      stop(event);
      idea = examples[+example.dataset.v32Ex] || '';
      if (seedIdea && idea !== seedIdea) { history = []; result = null; seedIdea = ''; }
      render(false);
      return;
    }
    if (target.closest('#dw-igo')) { stop(event); generate(false); return; }
    if (target.closest('#dw-iregen')) { stop(event); generate(true); return; }
    var retry = target.closest('[data-retry="new"]');
    if (retry) { stop(event); generate(false); return; }
    if (target.closest('#dw-iuse')) { stop(event); adopt(); }
  }, true);
  doc.addEventListener('keydown', function (event) {
    var sheet = $('#dw-isheet');
    if (!activeNew || !sheet || sheet.hidden) return;
    if ((event.metaKey || event.ctrlKey) && event.key === 'Enter' && event.target && event.target.id === 'dw-idea') {
      stop(event);
      generate(false);
    }
  }, true);
})(window);

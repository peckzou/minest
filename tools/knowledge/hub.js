/* Minest Knowledge · the one Dock icon for every knowledge view, plus JSON import.
   Contents · Outline · Knowledge Map · Timeline · Learning Map · Wiki (next), Import JSON…, the samples, Undo import.
   The sheet opens out of the Dock icon; picking a view opens it on the current board. */
(function () {
  if (window.MinestKnowledgeHub) return;
  var I = function (d) { return '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">' + d + '</svg>'; };
  var ICON = I('<path d="M4 19.5V5a2 2 0 0 1 2-2h12v18H6a2 2 0 0 1-2-1.5z"/><path d="M8 7h6M8 11h4"/><circle cx="16.5" cy="15.5" r="2.5"/>');
  // minimal line icons, each on a small liquid-glass disc tinted per mode
  var G = function (d) { return '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.9" stroke-linecap="round" stroke-linejoin="round">' + d + '</svg>'; };
  var MODES = [
    ['contents', 'Contents', '#5e9cff', G('<path d="M8 6h12M8 12h12M8 18h12"/><circle cx="4" cy="6" r="1"/><circle cx="4" cy="12" r="1"/><circle cx="4" cy="18" r="1"/>'), function () { return window.MinestContents; }],
    ['outline', 'Outline', '#a78bfa', G('<path d="M4 5h16M8 10h12M8 15h12M12 20h8"/>'), function () { return window.MinestEndless; }],
    ['kmap', 'Knowledge Map', '#34c3a0', G('<circle cx="12" cy="12" r="3"/><circle cx="5" cy="6" r="2"/><circle cx="19" cy="6" r="2"/><circle cx="12" cy="20" r="2"/><path d="m6.6 7.3 3.2 2.6M17.4 7.3l-3.2 2.6M12 15v3"/>'), function () { return window.MinestMap; }],
    ['timeline', 'Timeline', '#f5a524', G('<path d="M3 12h18"/><circle cx="7" cy="12" r="2"/><circle cx="17" cy="12" r="2"/><path d="M7 10V5M17 14v5"/>'), function () { return window.MinestTimeline; }],
    ['lmap', 'Learning Map', '#ff6b8a', G('<path d="M9 4 3 6v14l6-2 6 2 6-2V4l-6 2z"/><path d="M9 4v14M15 6v14"/>'), function () { return window.MinestLearnMap; }],
    ['wiki', 'Portal', '#38bdf8', G('<rect x="3" y="3" width="7.5" height="7.5" rx="2"/><rect x="13.5" y="3" width="7.5" height="7.5" rx="2"/><rect x="3" y="13.5" width="7.5" height="7.5" rx="2"/><rect x="13.5" y="13.5" width="7.5" height="7.5" rx="2"/>'), function () { return window.MinestWiki; }]
  ];
  var CSS = [
    '.kh{position:fixed;left:50%;bottom:calc(env(safe-area-inset-bottom,0px) + 12px);transform:translateX(-50%);z-index:2147482500;width:min(440px,calc(100vw - 20px));max-height:calc(100dvh - 40px);overflow:auto;padding:16px;border-radius:28px;color:#fff;font:15px -apple-system,BlinkMacSystemFont,system-ui,sans-serif;' +
      'background:linear-gradient(180deg,rgba(66,76,92,.94),rgba(28,34,46,.97));-webkit-backdrop-filter:blur(30px) saturate(170%);backdrop-filter:blur(30px) saturate(170%);border:1px solid rgba(255,255,255,.14);box-shadow:inset 0 1px 0 rgba(255,255,255,.2),0 30px 80px rgba(0,0,0,.5)}',
    '.kh h3{margin:2px 4px 12px;font-size:22px;font-weight:750;letter-spacing:-.3px}',
    '.kh-grid{display:grid;grid-template-columns:1fr 1fr;gap:8px}',
    '.kh-m{display:flex;align-items:center;gap:10px;padding:10px 12px;border-radius:18px;border:1px solid rgba(255,255,255,.08);background:rgba(255,255,255,.06);color:#fff;text-align:left;cursor:pointer;font:inherit;min-height:56px;transition:transform .15s}',
    '.kh-m:active{background:rgba(255,255,255,.13);transform:scale(.97)}',
    '.kh-m b{font-size:15px;font-weight:650;letter-spacing:-.1px;min-width:0}',
    '.kh-m i{flex:none;width:34px;height:34px;border-radius:50%;display:grid;place-items:center;color:#fff;' +
      'background:radial-gradient(120% 80% at 30% 15%,rgba(255,255,255,.55),rgba(255,255,255,0) 50%),linear-gradient(160deg,color-mix(in srgb,var(--c) 85%,#fff),color-mix(in srgb,var(--c) 70%,#000));' +
      'border:1px solid rgba(255,255,255,.45);box-shadow:inset 0 1px 0 rgba(255,255,255,.6),0 4px 12px color-mix(in srgb,var(--c) 40%,transparent)}',
    '.kh-m i svg{width:18px;height:18px}',
    '.kh-lom{width:100%;margin-top:8px;flex-direction:row}',
    '.kh-lom small{margin-left:auto;font-size:12px;opacity:.55}',
    '.kh-m[disabled]{opacity:.45;cursor:default}',
    '.kh h4{margin:16px 4px 8px;font-size:12px;font-weight:600;letter-spacing:.06em;text-transform:uppercase;opacity:.55}',
    '.kh-row{display:flex;gap:8px;flex-wrap:wrap}',
    '.kh-row button{height:40px;padding:0 14px;border-radius:999px;border:1px solid rgba(255,255,255,.14);background:rgba(255,255,255,.08);color:#fff;font:600 14px -apple-system,system-ui,sans-serif;cursor:pointer}',
    '.kh-row button.pri{background:#0a84ff;border-color:#0a84ff}',
    '.kh-msg{margin:10px 4px 0;font-size:13px;line-height:1.45;white-space:pre-wrap}',
    '.kh-msg.err{color:#ff8a80}',
    '.kh-bd{position:fixed;inset:0;z-index:2147482499;background:rgba(0,0,0,.25)}'
  ].join('\n');
  var el = null, bd = null, origin = '50% 100%';
  var lastTap = null, reduce = false; try { reduce = matchMedia('(prefers-reduced-motion: reduce)').matches; } catch (e) {}
  document.addEventListener('pointerdown', function (e) { var b = e.target && e.target.closest && e.target.closest('button,[role="button"],a,.ios-tab-item'); if (b && !b.closest('.kh')) lastTap = { r: b.getBoundingClientRect(), t: Date.now() }; }, true);
  function originOf(box) { var r = box.getBoundingClientRect(); if (lastTap && Date.now() - lastTap.t < 2000) { var o = lastTap.r; return Math.round(o.left + o.width / 2 - r.left) + 'px ' + Math.round(o.top + o.height / 2 - r.top) + 'px'; } return '50% 100%'; }
  function css() { if (document.getElementById('kh-css')) return; var s = document.createElement('style'); s.id = 'kh-css'; s.textContent = CSS; document.head.appendChild(s); }
  function esc(s) { return String(s == null ? '' : s).replace(/[&<>"]/g, function (c) { return { '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;' }[c]; }); }
  function close() {
    var e0 = el, b0 = bd; el = null; bd = null;
    if (b0) { if (b0.animate && !reduce) { var fb = b0.animate([{ opacity: 1 }, { opacity: 0 }], { duration: 240, fill: 'forwards' }); fb.onfinish = function () { b0.remove(); }; } else b0.remove(); }
    if (!e0) return;
    if (!e0.animate || reduce) return e0.remove();
    e0.style.pointerEvents = 'none'; e0.style.transformOrigin = origin;   // shrink back into the button it came from
    var a = e0.animate([{ scale: '1', opacity: 1, filter: 'blur(0px)' }, { scale: '.2', opacity: 0, filter: 'blur(5px)' }], { duration: 260, easing: 'cubic-bezier(.4,0,.6,1)', fill: 'forwards' });
    a.onfinish = a.oncancel = function () { e0.remove(); };
  }
  function open() {
    if (el) return close();
    css(); if (window.MinestKnowledge && MinestKnowledge.applyLook) MinestKnowledge.applyLook();
    var samples = (window.MinestKJ && MinestKJ.samples()) || {}, undo = window.MinestKJ ? MinestKJ.undoList() : [];
    bd = document.createElement('div'); bd.className = 'kh-bd'; bd.addEventListener('pointerdown', function (e) { e.stopPropagation(); close(); });
    el = document.createElement('div'); el.className = 'kh'; el.setAttribute('role', 'dialog'); el.setAttribute('aria-label', 'Knowledge');
    el.innerHTML = '<h3>Knowledge</h3><div class="kh-grid">' + MODES.map(function (m) { var ok = !!m[4](); return '<button type="button" class="kh-m" data-mode="' + m[0] + '" style="--c:' + m[2] + '"' + (ok ? '' : ' disabled') + '><i>' + m[3] + '</i><b>' + m[1] + '</b></button>'; }).join('') + '</div>' +
      (window.MinestCapture ? '<button type="button" class="kh-m kh-lom" data-cap style="--c:#0a84ff"><i>' + G('<path d="M12 5v14M5 12h14"/>') + '</i><b>Add to My World</b><small>Type, paste, photo, import</small></button>' : '') +
      (window.MinestWorld ? '<button type="button" class="kh-m kh-lom" data-lom style="--c:#7c8cff"><i>' + G('<rect x="3" y="4" width="7" height="16" rx="2"/><rect x="14" y="4" width="7" height="10" rx="2"/><path d="M14 18h7"/>') + '</i><b>List of Mine</b><small>My world, my lists</small></button>' : '') +
      '<h4>Appearance</h4><div class="kh-row">' + [['auto', '◐ Auto'], ['light', '☀︎ Light'], ['dark', '☾ Dark']].map(function (x) { var cur = window.MinestKnowledge ? MinestKnowledge.look() : 'auto'; return '<button type="button" data-look="' + x[0] + '"' + (cur === x[0] ? ' class="on"' : '') + '>' + x[1] + '</button>'; }).join('') + '</div>' +
      '<h4>Import</h4><div class="kh-row"><button type="button" class="pri" data-file>Import JSON…</button>' + (undo.length ? '<button type="button" data-undo>Undo “' + esc(undo[0].title) + '”</button>' : '') + '</div>' +
      // (the samples stay in MinestKJ.samples(); the sheet no longer lists them)
      '<div class="kh-msg"></div><input type="file" accept=".json,application/json" hidden>';
    document.body.appendChild(bd); document.body.appendChild(el);
    origin = originOf(el);
    if (el.animate && !reduce) {   // Apple Music: it grows out of the button, a touch past full size, and settles
      el.style.transformOrigin = origin;
      el.animate([{ scale: '.2', opacity: 0, filter: 'blur(6px)' }, { scale: '1.025', opacity: 1, filter: 'blur(0px)', offset: .68 }, { scale: '1', opacity: 1, filter: 'blur(0px)' }], { duration: 460, easing: 'cubic-bezier(.2,.85,.25,1)' });
      bd.animate([{ opacity: 0 }, { opacity: 1 }], { duration: 300 });
    }
    ['pointerdown', 'touchstart'].forEach(function (ev) { el.addEventListener(ev, function (e) { e.stopPropagation(); }, { passive: true }); });
    var msg = el.querySelector('.kh-msg'), file = el.querySelector('input[type=file]');
    function report(r) {
      var lines = ['✓ ' + (r.isNew ? 'Created' : 'Updated') + ' “' + r.title + '” — ' + r.added + ' added' + (r.isNew ? '' : ', ' + r.updated + ' updated') + '.'];
      if (r.gone.length) lines.push('Not in this JSON any more (kept): ' + r.gone.slice(0, 6).join(', ') + (r.gone.length > 6 ? '…' : ''));
      if (r.warnings.length) lines.push('⚠ ' + r.warnings.slice(0, 6).join('\n⚠ ') + (r.warnings.length > 6 ? '\n…' : ''));
      return lines.join('\n');
    }
    function run(json) {
      msg.className = 'kh-msg';
      try {
        var r = MinestKJ.importJSON(json);
        msg.textContent = report(r);
        setTimeout(function () {
          close();
          if (r.template === 'course' && window.MinestWiki) return setTimeout(function () { MinestWiki.openCourse(r.courseId); }, 250);
          var V = r.template === 'wiki' ? window.MinestWiki : window.MinestLearnMap; if (V) { if (V.isOpen()) V.close(); setTimeout(function () { V.open(r.boardId); }, 250); }
        }, r.warnings.length || r.gone.length ? 2600 : 900);
      } catch (e) { msg.className = 'kh-msg err'; msg.textContent = '✗ ' + e.message; }
    }
    file.addEventListener('change', function () {
      var f = file.files && file.files[0]; if (!f) return;
      var rd = new FileReader();
      rd.onload = function () { var j; try { j = JSON.parse(rd.result); } catch (e) { msg.className = 'kh-msg err'; msg.textContent = '✗ This file is not valid JSON: ' + e.message; return; } run(j); };
      rd.readAsText(f); file.value = '';
    });
    el.addEventListener('click', function (e) {
      var m = e.target.closest('[data-mode]');
      if (m) { var mod = MODES.filter(function (x) { return x[0] === m.getAttribute('data-mode'); })[0], api = mod && mod[4](); close(); if (api && api.open) setTimeout(function () { api.open(); }, 120); return; }
      if (e.target.closest('[data-cap]')) { close(); setTimeout(function () { MinestCapture.open(); }, 160); return; }
      if (e.target.closest('[data-lom]')) { close(); setTimeout(function () { MinestWorld.open(); }, 160); return; }
      var lk = e.target.closest('[data-look]'); if (lk) { MinestKnowledge.setLook(lk.getAttribute('data-look')); el.querySelectorAll('[data-look]').forEach(function (x) { x.classList.toggle('on', x === lk); }); return; }
      if (e.target.closest('[data-file]')) return file.click();
      var s = e.target.closest('[data-sample]'); if (s) return run(JSON.parse(JSON.stringify(samples[s.getAttribute('data-sample')])));
      if (e.target.closest('[data-undo]')) { var u = MinestKJ.undo(); msg.className = 'kh-msg'; msg.textContent = u ? '↺ Undid the import of “' + u.title + '”.' : 'Nothing to undo.'; e.target.closest('[data-undo]').remove(); return; }
    });
  }
  function trigger() {
    if (document.getElementById('mn-knowledge-trigger') || !document.body) return;
    var b = document.createElement('button'); b.type = 'button'; b.id = 'mn-knowledge-trigger'; b.title = 'Knowledge'; b.setAttribute('aria-label', 'Knowledge');
    b.style.display = 'none'; b.innerHTML = ICON;
    b.addEventListener('click', open);
    document.body.appendChild(b);
  }
  if (document.body) trigger(); else document.addEventListener('DOMContentLoaded', trigger);
  window.MinestKnowledgeHub = { open: open, close: close, icon: ICON };
})();

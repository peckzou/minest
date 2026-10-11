/* Minest Knowledge · the one Dock icon for every knowledge view, plus JSON import.
   Contents · Outline · Knowledge Map · Timeline · Learning Map · Wiki (next), Import JSON…, the samples, Undo import.
   The sheet opens out of the Dock icon; picking a view opens it on the current board. */
(function () {
  if (window.MinestKnowledgeHub) return;
  var I = function (d) { return '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">' + d + '</svg>'; };
  var ICON = I('<path d="M4 19.5V5a2 2 0 0 1 2-2h12v18H6a2 2 0 0 1-2-1.5z"/><path d="M8 7h6M8 11h4"/><circle cx="16.5" cy="15.5" r="2.5"/>');
  var MODES = [
    ['contents', 'Contents', 'Chapters at a glance', '📑', function () { return window.MinestContents; }],
    ['outline', 'Outline', 'Read and edit top to bottom', '🧾', function () { return window.MinestEndless; }],
    ['kmap', 'Knowledge Map', 'Zoom through ideas', '🫧', function () { return window.MinestMap; }],
    ['timeline', 'Timeline', 'Events in time order', '⏳', function () { return window.MinestTimeline; }],
    ['lmap', 'Learning Map', 'Stages, route, progress', '🗺', function () { return window.MinestLearnMap; }],
    ['wiki', 'Wiki Portal', 'Portal and categories', '📚', function () { return window.MinestWiki; }]
  ];
  var CSS = [
    '.kh{position:fixed;left:50%;bottom:calc(env(safe-area-inset-bottom,0px) + 12px);transform:translateX(-50%);z-index:2147482500;width:min(440px,calc(100vw - 20px));max-height:calc(100dvh - 40px);overflow:auto;padding:16px;border-radius:28px;color:#fff;font:15px -apple-system,BlinkMacSystemFont,system-ui,sans-serif;' +
      'background:linear-gradient(180deg,rgba(66,76,92,.94),rgba(28,34,46,.97));-webkit-backdrop-filter:blur(30px) saturate(170%);backdrop-filter:blur(30px) saturate(170%);border:1px solid rgba(255,255,255,.14);box-shadow:inset 0 1px 0 rgba(255,255,255,.2),0 30px 80px rgba(0,0,0,.5)}',
    '.kh h3{margin:2px 4px 12px;font-size:22px;font-weight:750;letter-spacing:-.3px}',
    '.kh-grid{display:grid;grid-template-columns:1fr 1fr;gap:8px}',
    '.kh-m{display:flex;flex-direction:column;align-items:flex-start;gap:2px;padding:12px;border-radius:18px;border:0;background:rgba(255,255,255,.07);color:#fff;text-align:left;cursor:pointer;font:inherit}',
    '.kh-m:active{background:rgba(255,255,255,.14)}',
    '.kh-m b{font-size:15px}.kh-m i{font-size:22px;font-style:normal}.kh-m small{font-size:11.5px;opacity:.55}',
    '.kh-m[disabled]{opacity:.45;cursor:default}',
    '.kh h4{margin:16px 4px 8px;font-size:12px;font-weight:600;letter-spacing:.06em;text-transform:uppercase;opacity:.55}',
    '.kh-row{display:flex;gap:8px;flex-wrap:wrap}',
    '.kh-row button{height:40px;padding:0 14px;border-radius:999px;border:1px solid rgba(255,255,255,.14);background:rgba(255,255,255,.08);color:#fff;font:600 14px -apple-system,system-ui,sans-serif;cursor:pointer}',
    '.kh-row button.pri{background:#0a84ff;border-color:#0a84ff}',
    '.kh-msg{margin:10px 4px 0;font-size:13px;line-height:1.45;white-space:pre-wrap}',
    '.kh-msg.err{color:#ff8a80}',
    '.kh-bd{position:fixed;inset:0;z-index:2147482499;background:rgba(0,0,0,.25)}'
  ].join('\n');
  var el = null, bd = null;
  function css() { if (document.getElementById('kh-css')) return; var s = document.createElement('style'); s.id = 'kh-css'; s.textContent = CSS; document.head.appendChild(s); }
  function esc(s) { return String(s == null ? '' : s).replace(/[&<>"]/g, function (c) { return { '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;' }[c]; }); }
  function close() { if (el) { el.remove(); el = null; } if (bd) { bd.remove(); bd = null; } }
  function open() {
    if (el) return close();
    css();
    var samples = (window.MinestKJ && MinestKJ.samples()) || {}, undo = window.MinestKJ ? MinestKJ.undoList() : [];
    bd = document.createElement('div'); bd.className = 'kh-bd'; bd.addEventListener('pointerdown', function (e) { e.stopPropagation(); close(); });
    el = document.createElement('div'); el.className = 'kh'; el.setAttribute('role', 'dialog'); el.setAttribute('aria-label', 'Knowledge');
    el.innerHTML = '<h3>Knowledge</h3><div class="kh-grid">' + MODES.map(function (m) { var ok = !!m[4](); return '<button type="button" class="kh-m" data-mode="' + m[0] + '"' + (ok ? '' : ' disabled') + '><i>' + m[3] + '</i><b>' + m[1] + '</b><small>' + m[2] + '</small></button>'; }).join('') + '</div>' +
      '<h4>Import</h4><div class="kh-row"><button type="button" class="pri" data-file>Import JSON…</button>' + (undo.length ? '<button type="button" data-undo>Undo “' + esc(undo[0].title) + '”</button>' : '') + '</div>' +
      (Object.keys(samples).length ? '<h4>Samples</h4><div class="kh-row">' + Object.keys(samples).map(function (k) { return '<button type="button" data-sample="' + esc(k) + '">' + esc(samples[k].subject || k) + '</button>'; }).join('') + '</div>' : '') +
      '<div class="kh-msg"></div><input type="file" accept=".json,application/json" hidden>';
    document.body.appendChild(bd); document.body.appendChild(el);
    if (el.animate) el.animate([{ opacity: 0, scale: '.9', translate: '0 30px' }, { opacity: 1, scale: '1', translate: '0 0' }], { duration: 320, easing: 'cubic-bezier(.2,.85,.25,1.05)' });
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
        setTimeout(function () { close(); var V = r.template === 'wiki' ? window.MinestWiki : window.MinestLearnMap; if (V) { if (V.isOpen()) V.close(); setTimeout(function () { V.open(r.boardId); }, 250); } }, r.warnings.length || r.gone.length ? 2600 : 900);
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

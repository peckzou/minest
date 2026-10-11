/* Minest · List of Mine — My Skills (Phase D)
   The skills of a skills world (made from "My Academic Skills" or "My Life & Future Skills"), grade by grade and area by
   area: what I want to learn, what I'm learning, what I can do.
   Two kinds of state, never mixed:
     · mine — Want to learn → Learning → Can do (and a self-rated proficiency), kept in the skill record 'sk:<card>'
       (synced; written by the template engine with the skill's subject, grades, group and standard references);
     · the system's — what the Learning Path actually recorded for the skill's card (MinestLearn.cardStatus): viewed,
       in progress, mastered, needs review. Opening a skill only ever makes it "viewed".
   Every skill is an ordinary card, so ▶ Study runs the Learning Path on its list, and the Kanban, Portal, Contents …
   show the same skills. */
(function () {
  if (window.MinestSkills) return;
  var A = function () { return window.MinestAI || {}; };
  var KN = function () { return window.MinestKnowledge; };
  var ST_KEY = 'minest.skills.v1';
  var S = (function () { try { return JSON.parse(localStorage.getItem(ST_KEY) || 'null') || {}; } catch (e) { return {}; } })();
  function stSave() { try { localStorage.setItem(ST_KEY, JSON.stringify(S)); } catch (e) {} }
  function esc(s) { return String(s == null ? '' : s).replace(/[&<>"]/g, function (c) { return { '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;' }[c]; }); }
  function toast(m) { try { if (window.GlassUI && GlassUI.toast) GlassUI.toast(m); } catch (e) {} }
  function boardById(id) { try { return (A().boards() || []).filter(function (b) { return b.id === id; })[0] || null; } catch (e) { return null; } }
  var MINE = ['', 'want', 'learning', 'can'];
  var MINE_T = { '': 'Add', want: 'Want to learn', learning: 'Learning', can: 'Can do' };
  var PROF = ['', 'beginner', 'intermediate', 'advanced', 'expert'];
  var PROF_T = { '': 'Not rated', beginner: 'Beginner', intermediate: 'Intermediate', advanced: 'Advanced', expert: 'Expert' };

  // ================================================================== the skills of a board
  function sysState(card, col) {
    var s = null; try { if (window.MinestLearn && MinestLearn.cardStatus) s = MinestLearn.cardStatus(card, col); } catch (e) {}
    if (s && s.studied && s.due) return 'review';
    if (s && s.mastered) return 'mastered';
    if (s && s.studied) return 'progress';
    if (KN().seenAt && KN().seenAt(card.id)) return 'viewed';
    return '';
  }
  var SYS_T = { '': '', viewed: 'Viewed', progress: 'In progress', mastered: 'Mastered', review: 'Needs review' };
  function model(b) {
    var stageOf = ((KN().get('lm:cfg:' + b.id) || {}).stageOf) || {};
    return (b.columns || []).map(function (col) {
      var area = { id: col.id, title: col.title, color: col.color, col: col, groups: [], grade: null }, secs = {}, cur = null, loose = null;
      (col.cards || []).forEach(function (c) {
        if (!c || !c.id) return;
        if (KN().isHeading(c.id)) { cur = secs[c.id] = { title: c.title, skills: [] }; area.groups.push(cur); return; }
        var rec = KN().get('sk:' + c.id); if (!rec) return;   // only skill cards
        var into = (stageOf[c.id] && secs[stageOf[c.id]]) || cur;
        if (!into) { if (!loose) { loose = { title: 'Skills', skills: [] }; area.groups.unshift(loose); } into = loose; }
        if (rec.grades && rec.grades[0] && !area.grade) area.grade = rec.grades[0];
        into.skills.push({ card: c, col: col, rec: rec, mine: rec.st || '', sys: sysState(c, col) });
      });
      area.groups = area.groups.filter(function (g) { return g.skills.length; });
      return area;
    }).filter(function (a) { return a.groups.length; });
  }

  // ================================================================== UI
  var CSS = [
    '.sk{position:fixed;inset:0;z-index:2147482001;display:flex;flex-direction:column;color:#f3f5f8;font:15px/1.4 -apple-system,BlinkMacSystemFont,"SF Pro Text",system-ui,sans-serif;-webkit-font-smoothing:antialiased;' +
      'background:linear-gradient(180deg,rgba(22,27,40,.9),rgba(10,13,22,.96));-webkit-backdrop-filter:blur(40px) saturate(180%);backdrop-filter:blur(40px) saturate(180%)}',
    '.sk.away{visibility:hidden}',
    '.sk-head{padding:calc(env(safe-area-inset-top,0px) + 10px) 14px 6px}',
    '.sk-top{display:flex;align-items:center;gap:8px}',
    '.sk-top h2{flex:1;min-width:0;margin:0;font-size:24px;font-weight:800;letter-spacing:-.4px;white-space:nowrap;overflow:hidden;text-overflow:ellipsis}',
    '.sk-b{flex:none;width:36px;height:36px;border-radius:50%;display:grid;place-items:center;padding:0;cursor:pointer;color:inherit;background:linear-gradient(180deg,rgba(255,255,255,.18),rgba(255,255,255,.06));border:1px solid rgba(255,255,255,.24);box-shadow:inset 0 1px 0 rgba(255,255,255,.35),0 6px 16px rgba(0,0,0,.25)}',
    '.sk-b svg{width:16px;height:16px}',
    '.sk-strip{display:flex;gap:6px;overflow-x:auto;scrollbar-width:none;margin-top:8px;padding-bottom:2px}',
    '.sk-strip::-webkit-scrollbar{display:none}',
    '.sk-chip{flex:none;height:32px;padding:0 12px;border-radius:999px;border:1px solid rgba(255,255,255,.16);background:rgba(255,255,255,.07);color:inherit;font:600 13px -apple-system,system-ui,sans-serif;cursor:pointer;white-space:nowrap}',
    '.sk-chip.on{background:rgba(255,255,255,.24);border-color:rgba(255,255,255,.42)}',
    '.sk-chip b{font-variant-numeric:tabular-nums;margin-left:4px;opacity:.75}',
    '.sk-body{flex:1;overflow-y:auto;-webkit-overflow-scrolling:touch;padding:6px 12px calc(env(safe-area-inset-bottom,0px) + 40px)}',
    '.sk-area{margin-bottom:10px;border-radius:20px;background:linear-gradient(180deg,rgba(255,255,255,.1),rgba(255,255,255,.04));border:1px solid rgba(255,255,255,.12);overflow:hidden}',
    '.sk-ah{display:flex;align-items:center;gap:10px;padding:12px;cursor:pointer}',
    '.sk-ah .dot{flex:none;width:12px;height:12px;border-radius:50%;background:var(--c);box-shadow:0 0 0 3px color-mix(in srgb,var(--c) 30%,transparent)}',
    '.sk-ah b{flex:1;min-width:0;font-size:15.5px;font-weight:700}',
    '.sk-ah em{flex:none;font-style:normal;font-size:12px;opacity:.65;font-variant-numeric:tabular-nums}',
    '.sk-play{flex:none;height:30px;padding:0 12px;border-radius:999px;border:1px solid rgba(255,255,255,.25);background:linear-gradient(180deg,#3d9bff,#0a7aff);color:#fff;font:700 12.5px -apple-system,system-ui,sans-serif;cursor:pointer}',
    '.sk-bar{height:4px;margin:0 12px 10px;border-radius:2px;background:rgba(255,255,255,.1);overflow:hidden;display:flex}',
    '.sk-bar i{display:block;height:100%}.sk-bar .c{background:#34c759}.sk-bar .l{background:#0a84ff}.sk-bar .w{background:#bf5af2}',
    '.sk-area.fold .sk-in{display:none}',
    '.sk-g{padding:2px 12px 4px;font-size:11.5px;font-weight:650;letter-spacing:.06em;text-transform:uppercase;opacity:.5}',
    '.sk-row{display:flex;align-items:center;gap:10px;padding:9px 12px;border-top:1px solid rgba(255,255,255,.06);cursor:pointer}',
    '.sk-row:active{background:rgba(255,255,255,.05)}',
    '.sk-row .tx{flex:1;min-width:0}',
    '.sk-row .tx b{display:block;font-size:14.5px;font-weight:600;line-height:1.3}',
    '.sk-row .tx small{display:flex;flex-wrap:wrap;gap:4px 8px;margin-top:3px;font-size:11.5px;opacity:.85}',
    '.sk-std{opacity:.55;font-variant-numeric:tabular-nums}',
    '.sk-sys{font-weight:650}.sk-sys.viewed{color:rgba(235,238,245,.55)}.sk-sys.progress{color:#64a8ff}.sk-sys.mastered{color:#30d158}.sk-sys.review{color:#ff6b6b}',
    '.sk-pill{flex:none;min-width:84px;height:30px;padding:0 10px;border-radius:999px;border:1px dashed rgba(255,255,255,.28);background:none;color:rgba(255,255,255,.7);font:650 12px -apple-system,system-ui,sans-serif;cursor:pointer;transition:transform .12s}',
    '.sk-pill:active{transform:scale(.94)}',
    '.sk-pill.want{border:1px solid #bf5af2;background:rgba(191,90,242,.2);color:#e3b5ff}',
    '.sk-pill.learning{border:1px solid #0a84ff;background:rgba(10,132,255,.22);color:#9ecbff}',
    '.sk-pill.can{border:1px solid #30d158;background:rgba(48,209,88,.22);color:#9af0b2}',
    '.sk-empty{padding:30px 10px;text-align:center;opacity:.6}',
    // light
    'html.kn-light .sk{color:#1d1f23;background:linear-gradient(180deg,rgba(244,246,250,.92),rgba(232,236,243,.96))}',
    'html.kn-light .sk-b,html.kn-light .sk-chip,html.kn-light .sk-area{background:rgba(255,255,255,.82);border-color:rgba(255,255,255,.95);box-shadow:inset 0 1px 0 #fff,0 6px 18px rgba(30,40,60,.07)}',
    'html.kn-light .sk-chip.on{background:#fff;border-color:#0a84ff;color:#0a6cdf}',
    'html.kn-light .sk-row{border-color:rgba(0,0,0,.06)}html.kn-light .sk-bar{background:rgba(0,0,0,.07)}',
    'html.kn-light .sk-pill{border-color:rgba(0,0,0,.2);color:rgba(0,0,0,.55)}',
    'html.kn-light .sk-pill.want{color:#8a2bb5}html.kn-light .sk-pill.learning{color:#0a5bd6}html.kn-light .sk-pill.can{color:#1a7f3a}',
    'html.kn-light .sk-sys.viewed{color:#8c9096}html.kn-light .sk-sys.progress{color:#0a5bd6}html.kn-light .sk-sys.mastered{color:#1a7f3a}html.kn-light .sk-sys.review{color:#d33}'
  ].join('\n');
  function css() { if (document.getElementById('sk-css')) return; var s = document.createElement('style'); s.id = 'sk-css'; s.textContent = CSS; document.head.appendChild(s); }
  var X = '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.4" stroke-linecap="round"><path d="M6 6l12 12M18 6 6 18"/></svg>';

  var ui = { open: false };
  function st() { return S[ui.bid] = S[ui.bid] || { filter: 'all', grade: 'all', fold: {}, scroll: 0 }; }
  function render() {
    var b = boardById(ui.bid); if (!b) return;
    var areas = model(b), s = st(), all = [], grades = [];
    areas.forEach(function (a) { if (a.grade && grades.indexOf(a.grade) < 0) grades.push(a.grade); a.groups.forEach(function (g) { g.skills.forEach(function (x) { all.push(x); }); }); });
    var cnt = { all: all.length, want: 0, learning: 0, can: 0, mastered: 0 };
    all.forEach(function (x) { if (x.mine) cnt[x.mine]++; if (x.sys === 'mastered') cnt.mastered++; });
    ui.title.textContent = b.title;
    ui.strip.innerHTML = [['all', 'All'], ['want', 'Want to learn'], ['learning', 'Learning'], ['can', 'Can do'], ['mastered', 'Mastered']].map(function (f) { return '<button type="button" class="sk-chip' + (s.filter === f[0] ? ' on' : '') + '" data-f="' + f[0] + '">' + f[1] + '<b>' + cnt[f[0]] + '</b></button>'; }).join('');
    ui.grades.innerHTML = grades.length > 1 ? ['all'].concat(grades).map(function (g) { return '<button type="button" class="sk-chip' + (s.grade === g ? ' on' : '') + '" data-g="' + g + '">' + (g === 'all' ? 'All grades' : g === 'K' ? 'Kindergarten' : 'Grade ' + g) + '</button>'; }).join('') : '';
    ui.grades.style.display = grades.length > 1 ? '' : 'none';
    var keep = function (x) { return s.filter === 'all' || (s.filter === 'mastered' ? x.sys === 'mastered' : x.mine === s.filter); };
    var html = areas.filter(function (a) { return s.grade === 'all' || a.grade === s.grade; }).map(function (a) {
      var flat = []; a.groups.forEach(function (g) { g.skills.forEach(function (x) { flat.push(x); }); });
      var shown = a.groups.map(function (g) { return { title: g.title, skills: g.skills.filter(keep) }; }).filter(function (g) { return g.skills.length; });
      if (!shown.length) return '';
      var n = flat.length, c = flat.filter(function (x) { return x.mine === 'can'; }).length, l = flat.filter(function (x) { return x.mine === 'learning'; }).length, w = flat.filter(function (x) { return x.mine === 'want'; }).length;
      var pc = function (v) { return (v / Math.max(1, n) * 100).toFixed(1) + '%'; };
      return '<div class="sk-area' + (s.fold[a.id] ? ' fold' : '') + '" style="--c:' + esc(a.color || '#7c8cff') + '"><div class="sk-ah" data-fold="' + esc(a.id) + '"><span class="dot"></span><b>' + esc(a.title) + '</b><em>' + c + '/' + n + ' can do</em><button type="button" class="sk-play" data-study="' + esc(a.id) + '">▶ Study</button></div>' +
        '<div class="sk-bar"><i class="c" style="width:' + pc(c) + '"></i><i class="l" style="width:' + pc(l) + '"></i><i class="w" style="width:' + pc(w) + '"></i></div><div class="sk-in">' +
        shown.map(function (g) {
          return '<div class="sk-g">' + esc(g.title) + '</div>' + g.skills.map(function (x) {
            var std = (x.rec.std || []).map(function (r) { return '<span class="sk-std">' + esc(r.framework + ' ' + r.id) + '</span>'; }).join('');
            return '<div class="sk-row" data-skill="' + esc(x.card.id) + '"><div class="tx"><b>' + esc(x.card.title) + '</b>' + (x.sys || std ? '<small>' + (x.sys ? '<span class="sk-sys ' + x.sys + '">' + (x.sys === 'mastered' ? '✓ ' : '') + SYS_T[x.sys] + '</span>' : '') + std + '</small>' : '') + '</div>' +
              '<button type="button" class="sk-pill' + (x.mine ? ' ' + x.mine : '') + '" data-mine="' + esc(x.card.id) + '">' + (x.mine === 'can' ? '✓ ' : x.mine ? '' : '＋ ') + MINE_T[x.mine] + '</button></div>';
          }).join('');
        }).join('') + '</div></div>';
    }).join('');
    ui.body.innerHTML = html || '<div class="sk-empty">' + (all.length ? 'Nothing here yet — mark a skill as Want to learn, Learning or Can do.' : 'No skills in this board.') + '</div>';
    ui.model = areas;
  }
  function find(id) { var hit = null; (ui.model || []).forEach(function (a) { a.groups.forEach(function (g) { g.skills.forEach(function (x) { if (x.card.id === id) hit = x; }); }); }); return hit; }
  function setRec(id, patch) { var r = Object.assign({}, KN().get('sk:' + id) || {}, patch, { at: Date.now() }); KN().set('sk:' + id, r, true); }
  function cycle(id) { var x = find(id); if (!x) return; var next = MINE[(MINE.indexOf(x.mine) + 1) % MINE.length]; setRec(id, { st: next || null }); keepRender(); }
  function keepRender() { var y = ui.body.scrollTop; render(); ui.body.scrollTop = y; }
  function detail(id) {
    var x = find(id); if (!x || !window.MinestKEdit) return;
    if (KN().markSeen) KN().markSeen(id);
    var std = (x.rec.std || []).map(function (r) { return r.framework + ' ' + r.id; }).join(' · ');
    var where = [x.rec.area, x.rec.group].filter(Boolean).join(' › ');
    MinestKEdit.sheet({ title: x.card.title, text: where + (std ? '\nStandards: ' + std : '') + (x.sys ? '\nLearning Path: ' + SYS_T[x.sys] : '\nLearning Path: not studied yet'), ok: 'Save', fields: [
      { key: 'st', label: 'My status', type: 'select', value: x.mine || '', options: MINE.map(function (k) { return [k, k ? MINE_T[k] : '—']; }) },
      { key: 'pf', label: 'How good am I? (my own rating)', type: 'select', value: x.rec.pf || '', options: PROF.map(function (k) { return [k, PROF_T[k]]; }) },
      { key: 'desc', label: 'Note', type: 'note', value: x.card.desc || '' }
    ] }).then(function (v) {
      if (!v) return keepRender();
      setRec(id, { st: v.st || null, pf: v.pf || null });
      var done = (v.desc || '') !== (x.card.desc || '') ? MinestKEdit.ops.update({ bid: ui.bid, kind: 'card', id: id }, { desc: v.desc }) : Promise.resolve();
      return done.then(keepRender);
    });
  }
  function study(colId) {
    var L = window.MinestLearn; if (!L || !L.start) return toast('Studying is not available here.');
    var bid = ui.bid; close();
    setTimeout(function () { try { L.start({ boardId: bid, listId: colId }); } catch (e) { toast('Could not start studying.'); } }, 260);
  }
  function open(bid) {
    if (ui.open) close();
    css(); if (KN() && KN().applyLook) KN().applyLook();
    var a = A().board && A().board(); ui.bid = bid || (a && a.id); if (!ui.bid) return;
    var el = document.createElement('div'); el.className = 'sk'; el.setAttribute('role', 'dialog'); el.setAttribute('aria-label', 'My Skills');
    el.innerHTML = '<div class="sk-head"><div class="sk-top"><h2></h2>' + (window.MinestKEdit ? MinestKEdit.fullBtnHtml('sk-b') : '') + '<button type="button" class="sk-b" data-x aria-label="Close">' + X + '</button></div>' +
      '<div class="sk-strip sk-f"></div><div class="sk-strip sk-gr"></div></div><div class="sk-body"></div>';
    ['pointerdown', 'touchstart', 'touchmove', 'wheel'].forEach(function (ev) { el.addEventListener(ev, function (e) { e.stopPropagation(); }, { passive: true }); });
    ui.el = el; ui.title = el.querySelector('h2'); ui.strip = el.querySelector('.sk-f'); ui.grades = el.querySelector('.sk-gr'); ui.body = el.querySelector('.sk-body'); ui.open = true;
    document.body.appendChild(el); document.documentElement.classList.add('kn-open');
    if (window.MinestKEdit) MinestKEdit.fullscreen('skills', el, ['.sk-head']);
    render(); ui.body.scrollTop = st().scroll || 0;
    if (el.animate) el.animate([{ opacity: 0, scale: '.97' }, { opacity: 1, scale: '1' }], { duration: 280, easing: 'cubic-bezier(.2,.85,.25,1)' });
    el.addEventListener('click', function (e) {
      var t = e.target;
      if (t.closest('[data-x]')) return close();
      var f = t.closest('[data-f]'); if (f) { st().filter = f.getAttribute('data-f'); stSave(); ui.body.scrollTop = 0; return render(); }
      var g = t.closest('[data-g]'); if (g) { st().grade = g.getAttribute('data-g'); stSave(); ui.body.scrollTop = 0; return render(); }
      var sd = t.closest('[data-study]'); if (sd) { e.stopPropagation(); return study(sd.getAttribute('data-study')); }
      var mi = t.closest('[data-mine]'); if (mi) return cycle(mi.getAttribute('data-mine'));
      var fo = t.closest('[data-fold]'); if (fo) { var id = fo.getAttribute('data-fold'); st().fold[id] = !st().fold[id]; stSave(); fo.parentNode.classList.toggle('fold', !!st().fold[id]); return; }
      var row = t.closest('[data-skill]'); if (row) return detail(row.getAttribute('data-skill'));
    });
  }
  function close() {
    if (!ui.open) return;
    st().scroll = ui.body.scrollTop; stSave();
    var el = ui.el; ui.open = false; ui.el = null; document.documentElement.classList.remove('kn-open');
    if (el.animate) { var an = el.animate([{ opacity: 1 }, { opacity: 0 }], { duration: 180, fill: 'forwards' }); an.onfinish = function () { el.remove(); }; } else el.remove();
  }
  // learning anywhere shows up here when you come back
  ['minest:learn', 'minest:study-activity', 'minest:mastery-manual', 'minest:kedit', 'focus'].forEach(function (ev) { window.addEventListener(ev, function () { if (ui.open && ui.el) setTimeout(keepRender, 300); }); });

  window.MinestSkills = { open: open, close: close, isOpen: function () { return ui.open; }, _model: function () { var b = boardById(ui.bid); return b ? model(b) : null; } };
})();

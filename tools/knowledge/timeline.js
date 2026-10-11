/* Minest Knowledge · Phase 4 — Timeline (chronological learning)
   The board's cards and stacked cards that have a date, in time order, down one clear line:
     big years on the rail · several events in one year together · spans (1861 – 1865) · BCE / CE ·
     a "· 87 years later ·" note across long gaps (readable rather than to scale).
   Dates are knowledge metadata (MinestKnowledge.setDate, synced in `knowledge.t`): only what was entered —
   a year alone stays a year; nothing is filled in. A year in a card's title is offered as a suggestion, never applied
   by itself. Tap an event: its notes, ⓘ details (the Kanban's sheet), Edit date, On the board (and back here).
   Jump: the century / decade strip and "Go to year". The place on the line and the open event are kept per board
   on this device (minest.timeline.v1). */
(function () {
  if (window.MinestTimeline) return;
  var KN = function () { return window.MinestKnowledge; };
  var A = function () { return window.MinestAI || {}; };
  var ST_KEY = 'minest.timeline.v1';
  var S = (function () { try { var v = JSON.parse(localStorage.getItem(ST_KEY) || 'null'); if (v && v.scroll) return v; } catch (e) {} return { scroll: {}, open: {}, list: {} }; })();
  function stSave() { try { localStorage.setItem(ST_KEY, JSON.stringify(S)); } catch (e) {} }
  function boards() { try { return (A().boards && A().boards()) || []; } catch (e) { return []; } }
  function boardById(id) { return boards().filter(function (b) { return b.id === id; })[0] || null; }

  // ================================================================== dates
  var MON = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'];
  function yr(y) { return y < 0 ? (-y) + ' BCE' : String(y); }
  function one(y, m, d) { return (m ? MON[m - 1] + ' ' + (d ? d + ', ' : '') : '') + yr(y); }
  function label(t) {
    var a = one(t.y, t.m, t.d);
    if (typeof t.y2 !== 'number') return a;
    if (t.y2 === t.y && !t.m && !t.m2) return a;
    return a + ' – ' + one(t.y2, t.m2, t.d2);
  }
  function key(t) { return t.y * 10000 + (t.m || 0) * 100 + (t.d || 0); }
  // a year in the title, offered (not applied): "1776 — Declaration", "Battle of Hastings (1066)", "500 BC"
  function guess(title) {
    var m = /(^|[^\d])(\d{3,4})\s*(BCE|BC|B\.C\.|CE|AD|A\.D\.)?(?![\d])/i.exec(String(title || ''));
    if (!m) return null;
    var y = +m[2]; if (y < 100 || y > 2200) return null;
    return /^B/i.test(m[3] || '') ? -y : y;
  }

  // ================================================================== events of a board
  function events(b) {
    var dated = [], undated = [];
    (b.columns || []).forEach(function (col) {
      (col.cards || []).forEach(function (c) {
        if (!c || !c.id) return;
        push(c, null);
        (Array.isArray(c.stack) ? c.stack : []).forEach(function (s) { if (s && s.id) push(s, c); });
        function push(x, parent) {
          var t = KN().dateOf(x.id);
          var ev = { id: x.id, title: x.title || 'Untitled', note: x.desc || '', done: !!x.complete, col: col, parent: parent, t: t };
          if (t) dated.push(ev); else if (!parent) undated.push(ev);   // undated stacked cards stay out of the list below (too many)
        }
      });
    });
    dated.sort(function (a, b) { return key(a.t) - key(b.t) || a.title.localeCompare(b.title); });
    return { dated: dated, undated: undated };
  }

  // ================================================================== UI
  var ui = { open: false };
  var I = function (d) { return '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">' + d + '</svg>'; };
  var ICON = { tl: I('<path d="M12 3v18"/><circle cx="12" cy="7" r="2"/><circle cx="12" cy="17" r="2"/><path d="M14 7h6M4 17h6"/>') };
  var CSS = [
    '.tl{position:fixed;inset:0;z-index:2147482000;display:flex;flex-direction:column;color:#eef1f6;font:16px/1.4 -apple-system,BlinkMacSystemFont,"SF Pro Text",system-ui,sans-serif;-webkit-font-smoothing:antialiased;' +
      'background:linear-gradient(180deg,#1c202c,#0c0e14)}',
    '.tl.away{visibility:hidden}',
    '.tl-head{position:relative;padding:calc(env(safe-area-inset-top,0px) + 14px) 16px 8px;border-bottom:1px solid rgba(255,255,255,.07)}',
    '.tl-tb{display:block;border:0;background:none;color:inherit;text-align:left;padding:0 48px 0 0;cursor:pointer;font:inherit;max-width:100%}',
    '.tl-tb small{display:block;font-size:12px;font-weight:600;letter-spacing:.06em;text-transform:uppercase;opacity:.5}',
    '.tl-tb b{display:block;font-size:28px;line-height:1.15;font-weight:750;letter-spacing:-.5px;white-space:nowrap;overflow:hidden;text-overflow:ellipsis}',
    '.tl-tb b:after{content:" ⌄";font-size:18px;opacity:.45}',
    '.tl-x{position:absolute;right:16px;top:calc(env(safe-area-inset-top,0px) + 18px);width:34px;height:34px;border-radius:50%;border:1px solid rgba(255,255,255,.14);background:rgba(255,255,255,.1);color:#fff;display:grid;place-items:center;cursor:pointer}',
    '.tl-row{display:flex;gap:6px;margin-top:10px;overflow-x:auto;scrollbar-width:none;padding-bottom:2px}',
    '.tl-row::-webkit-scrollbar{display:none}',
    '.tl-chip{flex:none;height:30px;padding:0 11px;border-radius:999px;border:1px solid rgba(255,255,255,.12);background:rgba(255,255,255,.06);color:#fff;font:600 12.5px -apple-system,system-ui,sans-serif;cursor:pointer;display:inline-flex;align-items:center;gap:6px;white-space:nowrap}',
    '.tl-chip.on{background:rgba(10,132,255,.32);border-color:rgba(10,132,255,.65)}',
    '.tl-chip i{width:8px;height:8px;border-radius:50%;background:var(--c)}',
    '.tl-body{flex:1;overflow-y:auto;-webkit-overflow-scrolling:touch;padding:6px 14px calc(env(safe-area-inset-bottom,0px) + 40px);position:relative}',
    '.tl-line{position:relative;padding-left:78px}',
    '.tl-line:before{content:"";position:absolute;left:66px;top:0;bottom:0;width:2px;background:linear-gradient(180deg,rgba(255,255,255,.05),rgba(255,255,255,.18) 40px,rgba(255,255,255,.18) calc(100% - 40px),rgba(255,255,255,.05))}',
    '.tl-year{position:relative;padding:14px 0 4px}',
    '.tl-y{position:absolute;left:-78px;top:16px;width:58px;text-align:right;font-weight:800;font-size:17px;letter-spacing:-.3px;font-variant-numeric:tabular-nums;line-height:1.1}',
    '.tl-y small{display:block;font-size:10px;font-weight:700;opacity:.55;letter-spacing:.04em}',
    '.tl-ev{position:relative;margin:0 0 10px;padding:11px 13px;border-radius:16px;background:rgba(255,255,255,.065);border:1px solid rgba(255,255,255,.07);cursor:pointer;transition:background .2s}',
    '.tl-ev:before{content:"";position:absolute;left:-17px;top:17px;width:10px;height:10px;border-radius:50%;background:var(--c,#9aa4b2);box-shadow:0 0 0 3px rgba(18,22,32,1)}',
    '.tl-ev.span:after{content:"";position:absolute;left:-14px;top:30px;bottom:-12px;width:4px;border-radius:2px;background:var(--c,#9aa4b2);opacity:.45}',
    '.tl-ev:active{background:rgba(255,255,255,.1)}',
    '.tl-ev.open{background:rgba(255,255,255,.1);border-color:rgba(255,255,255,.16)}',
    '.tl-ev.hit{animation:tlHit 1.6s ease-out}',
    '@keyframes tlHit{0%,40%{box-shadow:0 0 0 3px rgba(10,132,255,.9)}100%{box-shadow:0 0 0 0 rgba(10,132,255,0)}}',
    '.tl-d{font-size:12.5px;font-weight:700;color:var(--c,#9aa4b2);filter:brightness(1.35);letter-spacing:.01em}',
    '.tl-t{font-size:16px;font-weight:650;margin-top:2px}',
    '.tl-ev.done .tl-t{text-decoration:line-through;opacity:.55}',
    '.tl-c{font-size:12px;opacity:.5;margin-top:3px}',
    '.tl-n{font-size:14px;opacity:.75;margin-top:6px;display:-webkit-box;-webkit-line-clamp:2;-webkit-box-orient:vertical;overflow:hidden}',
    '.tl-ev.open .tl-n{-webkit-line-clamp:unset;display:block;white-space:pre-wrap}',
    '.tl-acts{display:none;gap:6px;margin-top:10px;flex-wrap:wrap}',
    '.tl-ev.open .tl-acts{display:flex}',
    '.tl-acts button{height:32px;padding:0 12px;border-radius:999px;border:1px solid rgba(255,255,255,.14);background:rgba(255,255,255,.08);color:#fff;font:600 13px -apple-system,system-ui,sans-serif;cursor:pointer}',
    '.tl-gap{position:relative;margin:2px 0 6px -78px;width:calc(100% + 78px);text-align:center;font-size:12px;opacity:.45;font-style:italic;padding:6px 0}',
    '.tl-empty{padding:34px 10px 20px;text-align:center;opacity:.6;font-size:15px}',
    '.tl-und{margin-top:26px;border-top:1px solid rgba(255,255,255,.08);padding-top:12px}',
    '.tl-und h3{margin:0 0 6px;font-size:12px;font-weight:600;letter-spacing:.06em;text-transform:uppercase;opacity:.5;cursor:pointer}',
    '.tl-u{display:flex;align-items:center;gap:8px;min-height:44px;border-bottom:1px solid rgba(255,255,255,.05)}',
    '.tl-u span{flex:1;min-width:0;overflow:hidden;text-overflow:ellipsis;white-space:nowrap;font-size:15px;opacity:.85}',
    '.tl-u button{flex:none;height:30px;padding:0 10px;border-radius:999px;border:1px solid rgba(255,255,255,.12);background:rgba(255,255,255,.06);color:#fff;font:600 12.5px -apple-system,system-ui,sans-serif;cursor:pointer}',
    '.tl-u button.sug{border-color:rgba(255,214,10,.5);color:#ffd60a}',
    // date sheet
    '.tl-sheet{position:fixed;left:50%;bottom:calc(env(safe-area-inset-bottom,0px) + 12px);transform:translateX(-50%);z-index:2147482003;width:min(420px,calc(100vw - 20px));padding:16px;border-radius:24px;' +
      'background:linear-gradient(180deg,rgba(70,80,96,.96),rgba(34,40,52,.98));border:1px solid rgba(255,255,255,.14);box-shadow:inset 0 1px 0 rgba(255,255,255,.2),0 24px 60px rgba(0,0,0,.5);color:#fff;font:15px -apple-system,system-ui,sans-serif}',
    '.tl-sheet h4{margin:0 0 2px;font-size:17px}',
    '.tl-sheet p{margin:0 0 12px;font-size:13px;opacity:.6;overflow:hidden;text-overflow:ellipsis;white-space:nowrap}',
    '.tl-f{display:grid;grid-template-columns:62px 1fr 1fr 1fr 74px;gap:6px;align-items:center;margin-bottom:8px}',
    '.tl-f label{font-size:12px;font-weight:600;opacity:.6}',
    '.tl-f input,.tl-f select{width:100%;min-width:0;height:40px;border-radius:12px;border:1px solid rgba(255,255,255,.12);background:rgba(255,255,255,.08);color:#fff;font:15px -apple-system,system-ui,sans-serif;padding:0 8px;box-sizing:border-box}',
    '.tl-f select option{color:#000}',
    '.tl-sb{display:flex;gap:8px;margin-top:12px}',
    '.tl-sb button{flex:1;height:42px;border-radius:999px;border:0;font:600 15px -apple-system,system-ui,sans-serif;cursor:pointer;background:rgba(255,255,255,.1);color:#fff}',
    '.tl-sb .save{background:#0a84ff}',
    '.tl-sb .rm{color:#ff6b6b;flex:.7}',
    '.tl-err{color:#ff8a80;font-size:13px;min-height:16px}',
    'html.kn-open #minest-mini-pet-p0,html.kn-open .mpet-menu,html.kn-open .mpet-say,html.kn-open .mpet-tip{display:none!important}'
  ].join('\n');
  function ensureCss() { if (document.getElementById('tl-css')) return; var s = document.createElement('style'); s.id = 'tl-css'; s.textContent = CSS; document.head.appendChild(s); }
  function esc(s) { return String(s == null ? '' : s).replace(/[&<>"]/g, function (c) { return { '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;' }[c]; }); }
  function toast(m) { try { if (window.GlassUI && GlassUI.toast) GlassUI.toast(m); } catch (e) {} }

  var E = null, groups = [];
  function render() {
    if (!ui.el) return;
    var b = boardById(ui.bid); if (!b) return;
    ui.title.textContent = b.title || 'Board';
    E = events(b);
    var only = S.list[ui.bid] || null;
    var ev = E.dated.filter(function (e) { return !only || e.col.id === only; });
    // lists that have events: filter chips
    var cols = []; E.dated.forEach(function (e) { if (cols.indexOf(e.col) < 0) cols.push(e.col); });
    var chips = cols.length > 1 ? '<button type="button" class="tl-chip' + (!only ? ' on' : '') + '" data-list="">All</button>' + cols.map(function (c) { return '<button type="button" class="tl-chip' + (only === c.id ? ' on' : '') + '" data-list="' + esc(c.id) + '" style="--c:' + esc(c.color || '#9aa4b2') + '"><i></i>' + esc(c.title || 'List') + '</button>'; }).join('') : '';
    // jump strip: centuries for long spans, decades for short ones
    var jumps = '';
    if (ev.length > 1) {
      var y0 = ev[0].t.y, y1 = ev[ev.length - 1].t.y, step = y1 - y0 > 300 ? 100 : y1 - y0 > 40 ? 10 : 1, seen = {};
      // BCE counts down: 490 BCE is in the 400s BCE; the chip jumps to the first event of its period
      ev.forEach(function (e) {
        var y = e.t.y, bk = y < 0 ? Math.floor(-y / step) * step : Math.floor(y / step) * step, k = (y < 0 ? 'b' : 'c') + bk;
        if (seen[k]) return; seen[k] = 1;
        var name = step === 1 ? yr(y) : bk === 0 ? (y < 0 ? '1–' + (step - 1) + ' BCE' : '1–' + (step - 1)) : bk + 's' + (y < 0 ? ' BCE' : '');
        jumps += '<button type="button" class="tl-chip" data-jump="' + y + '">' + name + '</button>';
      });
    }
    ui.nav.innerHTML = '<button type="button" class="tl-chip" data-goto>Go to year…</button>' + jumps;
    ui.lists.innerHTML = chips; ui.lists.style.display = chips ? '' : 'none';
    // the line: one block per year
    groups = [];
    ev.forEach(function (e) { var g = groups[groups.length - 1]; if (!g || g.y !== e.t.y) groups.push(g = { y: e.t.y, evs: [] }); g.evs.push(e); });
    var html = '';
    groups.forEach(function (g, i) {
      if (i) { var gap = g.y - groups[i - 1].y - (groups[i - 1].y < 0 && g.y > 0 ? 1 : 0); if (gap >= 10) html += '<div class="tl-gap">· ' + gap + ' years later ·</div>'; }
      html += '<div class="tl-year" data-y="' + g.y + '"><div class="tl-y">' + (g.y < 0 ? (-g.y) + '<small>BCE</small>' : g.y) + '</div>' +
        g.evs.map(function (e) {
          var span = typeof e.t.y2 === 'number' && key({ y: e.t.y2, m: e.t.m2, d: e.t.d2 }) > key(e.t);
          return '<div class="tl-ev' + (span ? ' span' : '') + (e.done ? ' done' : '') + (S.open[ui.bid] === e.id ? ' open' : '') + '" data-id="' + esc(e.id) + '" style="--c:' + esc(e.col.color || '#9aa4b2') + '">' +
            '<div class="tl-d">' + esc(label(e.t)) + '</div><div class="tl-t">' + esc(e.title) + '</div>' +
            '<div class="tl-c">' + esc(e.col.title || '') + (e.parent ? ' · ' + esc(e.parent.title) : '') + '</div>' +
            (e.note ? '<div class="tl-n">' + esc(e.note) + '</div>' : '') +
            '<div class="tl-acts"><button type="button" data-a="details">ⓘ Details</button><button type="button" data-a="date">Edit date</button><button type="button" data-a="board">On the board</button></div></div>';
        }).join('') + '</div>';
    });
    if (!ev.length) html = '<div class="tl-empty">' + (E.dated.length ? 'No events in this list.' : 'No dated events yet.<br><span style="font-size:13px;opacity:.8">Give a card a date below — a year is enough.</span>') + '</div>';
    var und = E.undated.filter(function (e) { return !only || e.col.id === only; });
    if (und.length) {
      var openU = S.und !== false;
      html += '<div class="tl-und"><h3 data-und>' + (openU ? '▾' : '▸') + ' Not on the timeline (' + und.length + ')</h3>' + (openU ? und.map(function (e) {
        var gy = guess(e.title);
        return '<div class="tl-u" data-id="' + esc(e.id) + '"><span>' + esc(e.title) + '</span>' + (gy != null ? '<button type="button" class="sug" data-sug="' + gy + '">' + esc(yr(gy)) + '?</button>' : '') + '<button type="button" data-a="date">＋ Date</button></div>';
      }).join('') : '') + '</div>';
    }
    ui.list.innerHTML = '<div class="tl-line">' + html + '</div>';
  }
  // smooth, and certain: if the smooth scroll did not happen (a hidden tab, an interrupted gesture), land there anyway
  function glide(top) {
    top = Math.max(0, Math.min(top, ui.list.scrollHeight - ui.list.clientHeight));
    ui.list.scrollTo({ top: top, behavior: 'smooth' });
    var L = ui.list; setTimeout(function () { if (L.isConnected && Math.abs(L.scrollTop - top) > 4) L.scrollTop = top; }, 650);
  }
  function evById(id) { return E ? E.dated.concat(E.undated).filter(function (e) { return e.id === id; })[0] : null; }
  function scrollToYear(y) {
    var best = null;
    ui.list.querySelectorAll('.tl-year').forEach(function (g) { if (best == null && +g.getAttribute('data-y') >= y) best = g; });
    if (!best) { var all = ui.list.querySelectorAll('.tl-year'); best = all[all.length - 1]; }
    if (best) glide(best.offsetTop - 8);
  }
  function hit(id) {
    var el = ui.list.querySelector('.tl-ev[data-id="' + cssEsc(id) + '"]'); if (!el) return;
    var lr = ui.list.getBoundingClientRect(), r = el.getBoundingClientRect();
    if (r.top < lr.top || r.bottom > lr.bottom) glide(ui.list.scrollTop + r.top - lr.top - lr.height / 3);
    el.classList.remove('hit'); void el.offsetWidth; el.classList.add('hit');
  }
  function cssEsc(s) { return window.CSS && CSS.escape ? CSS.escape(s) : String(s).replace(/"/g, '\\"'); }

  // ---------------------------------------------------------------- the date sheet
  var sheet = null;
  function closeSheet() { if (sheet) { sheet.remove(); sheet = null; } }
  function dateSheet(e, preset) {
    closeSheet();
    var t = preset || e.t || {};
    var era = function (y) { return y != null && y < 0 ? 'BCE' : 'CE'; };
    var row = function (lbl, p, y, m, d) {
      return '<div class="tl-f"><label>' + lbl + '</label><input inputmode="numeric" placeholder="Year" data-' + p + 'y value="' + (y != null ? Math.abs(y) : '') + '">' +
        '<select data-' + p + 'm><option value="">Month</option>' + MON.map(function (mn, i) { return '<option value="' + (i + 1) + '"' + (m === i + 1 ? ' selected' : '') + '>' + mn + '</option>'; }).join('') + '</select>' +
        '<input inputmode="numeric" placeholder="Day" data-' + p + 'd value="' + (d || '') + '">' +
        '<select data-' + p + 'e><option' + (era(y) === 'CE' ? ' selected' : '') + '>CE</option><option' + (era(y) === 'BCE' ? ' selected' : '') + '>BCE</option></select></div>';
    };
    sheet = document.createElement('div'); sheet.className = 'tl-sheet';
    sheet.innerHTML = '<h4>Date</h4><p>' + esc(e.title) + '</p>' + row('Starts', 's', t.y, t.m, t.d) + row('Ends', 'e', t.y2, t.m2, t.d2) +
      '<div class="tl-err"></div><div class="tl-sb">' + (e.t ? '<button type="button" class="rm" data-s="rm">Remove</button>' : '') + '<button type="button" data-s="no">Cancel</button><button type="button" class="save" data-s="ok">Save</button></div>';
    document.body.appendChild(sheet);
    if (sheet.animate) sheet.animate([{ opacity: 0, translate: '0 30px' }, { opacity: 1, translate: '0 0' }], { duration: 260, easing: 'cubic-bezier(.2,.85,.25,1)' });
    ['pointerdown', 'touchstart'].forEach(function (ev) { sheet.addEventListener(ev, function (x) { x.stopPropagation(); }, { passive: true }); });
    var v = function (sel) { return sheet.querySelector(sel).value.trim(); };
    sheet.addEventListener('click', function (x) {
      var b = x.target.closest('[data-s]'); if (!b) return;
      var a = b.getAttribute('data-s');
      if (a === 'no') return closeSheet();
      if (a === 'rm') { KN().setDate(e.id, null); closeSheet(); render(); return; }
      var err = sheet.querySelector('.tl-err');
      function part(p) {
        var Y = v('[data-' + p + 'y]'), M = v('[data-' + p + 'm]'), D = v('[data-' + p + 'd]'), Er = v('[data-' + p + 'e]');
        if (!Y) { if (M || D) throw new Error('Add the year.'); return null; }
        if (!/^\d{1,4}$/.test(Y) || +Y < 1) throw new Error('The year must be a number like 1776.');
        if (D && !M) throw new Error('Pick the month for that day.');
        var o = { y: Er === 'BCE' ? -(+Y) : +Y };
        if (M) o.m = +M;
        if (D) { if (!/^\d{1,2}$/.test(D) || +D < 1 || +D > new Date(Math.max(1, Math.abs(o.y)), o.m, 0).getDate()) throw new Error('That day is not in ' + MON[o.m - 1] + '.'); o.d = +D; }
        return o;
      }
      try {
        var s = part('s'), en = part('e');
        if (!s) throw new Error('Add at least the year it starts.');
        var dt = { y: s.y, m: s.m, d: s.d };
        if (en) { if (key(en) < key(s)) throw new Error('It cannot end before it starts.'); dt.y2 = en.y; dt.m2 = en.m; dt.d2 = en.d; }
        KN().setDate(e.id, dt); closeSheet(); S.open[ui.bid] = e.id; stSave(); render(); setTimeout(function () { hit(e.id); }, 60);
      } catch (ex) { err.textContent = ex.message; }
    });
  }
  function yearSheet() {
    closeSheet();
    sheet = document.createElement('div'); sheet.className = 'tl-sheet';
    sheet.innerHTML = '<h4>Go to year</h4><p>The first event on or after it</p><div class="tl-f" style="grid-template-columns:1fr 90px"><input inputmode="numeric" placeholder="e.g. 1803" data-gy><select data-ge><option>CE</option><option>BCE</option></select></div><div class="tl-sb"><button type="button" data-s="no">Cancel</button><button type="button" class="save" data-s="go">Go</button></div>';
    document.body.appendChild(sheet);
    ['pointerdown', 'touchstart'].forEach(function (ev) { sheet.addEventListener(ev, function (x) { x.stopPropagation(); }, { passive: true }); });
    var inp = sheet.querySelector('[data-gy]'); setTimeout(function () { try { inp.focus(); } catch (e) {} }, 50);
    var go = function () { var y = parseInt(inp.value, 10); if (!isFinite(y)) return; if (sheet.querySelector('[data-ge]').value === 'BCE') y = -y; closeSheet(); scrollToYear(y); };
    inp.addEventListener('keydown', function (e) { if (e.key === 'Enter') go(); });
    sheet.addEventListener('click', function (x) { var b = x.target.closest('[data-s]'); if (!b) return; if (b.getAttribute('data-s') === 'go') go(); else closeSheet(); });
  }

  // ---------------------------------------------------------------- details / board (and back to the same place)
  function away(n) {
    keep(); ui.el.classList.add('away');
    var col = n.col.id;
    A().openCardIn(ui.bid, col, n.id);
    var t0 = Date.now(), seen = false, gone = 0;
    var modal = function () { return document.querySelector('.mn-dm, .mn-cardsheet, .fixed.inset-0.z-50 .rounded-3xl'); };
    var iv = setInterval(function () {
      if (modal()) { seen = true; gone = 0; return; }
      if (seen) gone++;
      if ((seen && gone >= 2) || (!seen && Date.now() - t0 > 2500)) { clearInterval(iv); if (!ui.el) return; ui.el.classList.remove('away'); render(); ui.list.scrollTop = S.scroll[ui.bid] || 0; }
    }, 250);
  }
  function keep() { if (ui.list && ui.bid) { S.scroll[ui.bid] = ui.list.scrollTop; stSave(); } }

  // ---------------------------------------------------------------- open / close
  function open(boardId) {
    if (ui.open) return;
    ensureCss();
    var a = A().board && A().board();
    ui.bid = boardId || (a && a.id) || (boards()[0] || {}).id;
    if (!ui.bid) return toast('No board yet.');
    var el = document.createElement('div'); el.className = 'tl'; el.setAttribute('role', 'dialog'); el.setAttribute('aria-label', 'Timeline');
    el.innerHTML = '<div class="tl-head"><button type="button" class="tl-tb" data-boards><small>Timeline</small><b></b></button>' +
      '<button type="button" class="tl-x" data-x aria-label="Close"><svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.8" stroke-linecap="round"><path d="M6 6l12 12M18 6 6 18"/></svg></button>' +
      '<div class="tl-row tl-nav"></div><div class="tl-row tl-lists"></div></div><div class="tl-body"></div>';
    ui.el = el; ui.list = el.querySelector('.tl-body'); ui.title = el.querySelector('.tl-tb b'); ui.nav = el.querySelector('.tl-nav'); ui.lists = el.querySelector('.tl-lists'); ui.open = true;
    document.body.appendChild(el); document.documentElement.classList.add('kn-open');
    render(); ui.list.scrollTop = S.scroll[ui.bid] || 0;
    if (el.animate) el.animate([{ opacity: 0, scale: '.96' }, { opacity: 1, scale: '1' }], { duration: 300, easing: 'cubic-bezier(.2,.85,.25,1)' });
    wire(el);
  }
  function close() {
    if (!ui.open) return;
    keep(); closeSheet();
    var el = ui.el; ui.open = false; ui.el = null; document.documentElement.classList.remove('kn-open');
    var m = document.querySelector('.tl-menu'); if (m) m.remove();
    if (el.animate) { var an = el.animate([{ opacity: 1 }, { opacity: 0 }], { duration: 180, fill: 'forwards' }); an.onfinish = function () { el.remove(); }; } else el.remove();
  }
  function boardMenu(anchor) {
    var old = document.querySelector('.tl-menu'); if (old) { old.remove(); return; }
    var m = document.createElement('div'); m.className = 'en-menu tl-menu';
    m.innerHTML = boards().filter(function (b) { return !b.archived; }).map(function (b) { return '<button type="button" data-b="' + esc(b.id) + '"' + (b.id === ui.bid ? ' class="on"' : '') + '>' + esc(b.title || 'Board') + '</button>'; }).join('');
    document.body.appendChild(m);
    var r = anchor.getBoundingClientRect(); m.style.left = Math.max(10, r.left) + 'px'; m.style.top = (r.bottom + 8) + 'px';
    m.addEventListener('pointerdown', function (e) { e.stopPropagation(); });
    m.addEventListener('click', function (e) { var b = e.target.closest('[data-b]'); if (!b) return; m.remove(); keep(); ui.bid = b.getAttribute('data-b'); render(); ui.list.scrollTop = S.scroll[ui.bid] || 0; });
  }
  function wire(el) {
    ['pointerdown', 'touchstart', 'touchmove', 'wheel'].forEach(function (ev) { el.addEventListener(ev, function (e) { e.stopPropagation(); }, { passive: true }); });
    el.addEventListener('pointerdown', function (e) { if (sheet && !sheet.contains(e.target)) closeSheet(); var m = document.querySelector('.tl-menu'); if (m && !m.contains(e.target) && !e.target.closest('[data-boards]')) m.remove(); });
    el.addEventListener('click', function (e) {
      if (e.target.closest('[data-x]')) return close();
      if (e.target.closest('[data-boards]')) return boardMenu(e.target.closest('[data-boards]'));
      if (e.target.closest('[data-goto]')) return yearSheet();
      var j = e.target.closest('[data-jump]'); if (j) return scrollToYear(+j.getAttribute('data-jump'));
      var l = e.target.closest('[data-list]'); if (l) { S.list[ui.bid] = l.getAttribute('data-list') || null; stSave(); render(); return; }
      if (e.target.closest('[data-und]')) { S.und = S.und === false; stSave(); render(); return; }
      var row = e.target.closest('[data-id]'); if (!row) return;
      var n = evById(row.getAttribute('data-id')); if (!n) return;
      var sug = e.target.closest('[data-sug]'); if (sug) return dateSheet(n, { y: +sug.getAttribute('data-sug') });
      var act = e.target.closest('[data-a]');
      if (act) {
        var a = act.getAttribute('data-a');
        if (a === 'date') return dateSheet(n);
        if (a === 'details') return away(n);
        if (a === 'board') { keep(); var to = { b: ui.bid, l: n.col.id, c: n.id, p: n.parent ? n.parent.id : null }; close(); if (window.MinestContents && MinestContents.goTo) MinestContents.goTo(to, { label: 'Timeline', open: function () { open(to.b); setTimeout(function () { hit(n.id); }, 120); } }); return; }
        return;
      }
      if (row.classList.contains('tl-ev')) {
        var was = S.open[ui.bid] === n.id;
        ui.list.querySelectorAll('.tl-ev.open').forEach(function (x) { x.classList.remove('open'); });
        if (!was) row.classList.add('open');
        S.open[ui.bid] = was ? null : n.id; stSave();
      }
    });
  }
  if (KN() && KN().onChange) KN().onChange(function () { if (ui.open && !ui.el.classList.contains('away') && !sheet) { var st = ui.list.scrollTop; render(); ui.list.scrollTop = st; } });

  function trigger() {
    if (document.getElementById('mn-timeline-trigger') || !document.body) return;
    var b = document.createElement('button'); b.type = 'button'; b.id = 'mn-timeline-trigger'; b.title = 'Timeline'; b.setAttribute('aria-label', 'Timeline');
    b.style.display = 'none'; b.innerHTML = ICON.tl;
    b.addEventListener('click', function () { if (ui.open) close(); else open(); });
    document.body.appendChild(b);
  }
  if (document.body) trigger(); else document.addEventListener('DOMContentLoaded', trigger);

  window.MinestTimeline = { open: open, close: close, toggle: function () { if (ui.open) close(); else open(); }, isOpen: function () { return ui.open; }, icon: ICON.tl,
    _events: function () { return E ? E.dated.map(function (e) { return label(e.t) + ' | ' + e.title; }) : []; }, _label: label, _guess: guess, _scrollToYear: scrollToYear, _hit: hit };
})();

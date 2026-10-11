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
          var ev = { id: x.id, title: x.title || 'Untitled', note: x.desc || '', done: !!x.complete, col: col, parent: parent, t: t, img: x.cover && x.cover.type === 'image' && x.cover.url ? x.cover.url : '' };
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
    'html.kn-open #minest-mini-pet-p0,html.kn-open .mpet-menu,html.kn-open .mpet-say,html.kn-open .mpet-tip{display:none!important}',
    '.tl-seg{display:inline-flex;padding:3px;border-radius:999px;background:rgba(127,127,127,.14);gap:2px}',
    '.tl-seg button{height:28px;padding:0 12px;border-radius:999px;border:0;background:none;color:inherit;opacity:.7;font:600 12.5px -apple-system,system-ui,sans-serif;cursor:pointer}',
    '.tl-seg button.on{background:rgba(127,127,127,.28);opacity:1}',
    // horizontal: a light, editorial page
    '.tl.h{background:#f3f3f1;color:#1d1d1d}',
    '.tl.h .tl-head{border-color:#e2e2df}',
    '.tl.h .tl-chip{background:#fff;border-color:#ddd;color:#222}',
    '.tl.h .tl-chip.on{background:#1d1d1d;color:#fff;border-color:#1d1d1d}',
    '.tl.h .tl-x{background:#fff;border-color:#ddd;color:#222}',
    '.tl.h .tl-body{overflow:auto;padding:0}',
    '.tl-canvas{position:relative}',
    '.tl-ax{position:absolute;left:0;height:1px;background:#8d8d8d}',
    '.tl-tick{position:absolute;width:1px;height:10px;background:#8d8d8d}',
    '.tl-dec{position:absolute;font:400 46px/1 "Didot","Bodoni 72","Iowan Old Style",Georgia,serif;color:#1d1d1d;letter-spacing:-.5px;white-space:nowrap}',
    '.tl-dec small{font-size:18px}',
    '.tl-brk{position:absolute;width:18px;height:18px;line-height:18px;text-align:center;background:#f3f3f1;color:#8d8d8d;font:600 16px -apple-system,system-ui,sans-serif}',
    '.tl-brkt{position:absolute;width:120px;text-align:center;font:italic 12px "Iowan Old Style",Georgia,serif;color:#8d8d8d}',
    '.tl-hl{position:absolute;width:1px;background:#9a9a9a}',
    '.tl-hd{position:absolute;width:16px;height:16px;border-radius:50%;border:0;padding:0;cursor:pointer;box-shadow:0 0 0 3px #f3f3f1}',
    '.tl-hb{position:absolute;display:flex;gap:14px;cursor:pointer;overflow:hidden;border-radius:2px}',
    '.tl-hb.u{align-items:flex-end}',
    '.tl-hb img{flex:none;width:130px;height:96px;object-fit:cover;filter:grayscale(.15) contrast(1.05);box-shadow:0 1px 3px rgba(0,0,0,.18)}',
    '.tl-hb.u img{align-self:flex-end}.tl-hb.d img{align-self:flex-start}',
    '.tl-hb .tx{min-width:0;flex:1}',
    '.tl-hb .d{font:400 17px/1.2 "Didot","Bodoni 72","Iowan Old Style",Georgia,serif;color:#1d1d1d;margin-bottom:6px}',
    '.tl-hb .n{font:500 12.5px/1.4 -apple-system,"Helvetica Neue",system-ui,sans-serif;color:#222}',
    '.tl-hb .m{font:400 12px/1.4 -apple-system,"Helvetica Neue",system-ui,sans-serif;color:#555;margin-top:4px;display:-webkit-box;-webkit-line-clamp:4;-webkit-box-orient:vertical;overflow:hidden}',
    '.tl-hb.done .n{text-decoration:line-through;opacity:.6}',
    '.tl-hb.hit{animation:tlHit 1.6s ease-out}',
    '.tl-leg{position:absolute;left:24px;top:22px;display:flex;flex-direction:column;gap:8px;font:400 12px/1.25 -apple-system,"Helvetica Neue",system-ui,sans-serif;color:#333;max-width:190px}',
    '.tl-leg div{display:flex;gap:9px;align-items:flex-start}',
    '.tl-leg i{flex:none;width:13px;height:13px;border-radius:50%;margin-top:1px}'
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
    var H = S.view === 'h';
    ui.el.classList.toggle('h', H);
    ui.el.querySelectorAll('[data-view]').forEach(function (x) { x.classList.toggle('on', (x.getAttribute('data-view') === 'h') === H); });
    ui.list.innerHTML = H ? renderH(ev, und ? und.length : 0) : '<div class="tl-line">' + html + '</div>';
  }

  // ---------------------------------------------------------------- the horizontal axis (an editorial timeline)
  // dots on one line, each event joined by a thin line to its block above or below (two tiers a side, placed so
  // nothing overlaps); big serif decade / century marks under the line; long empty stretches drawn shorter, marked.
  var HL = { PX: 46, MAXGAP: 240, MIN: 34, TIER: 160, BOX: 145 };
  function pos(t) { var v = t.y + ((t.m || 1) - 1) / 12 + ((t.d || 1) - 1) / 365; return v < 0 ? v + 1 : v; }   // no year 0
  function renderH(ev, undCount) {
    if (!ev.length) return '<div class="tl-empty" style="padding-top:80px">No dated events yet' + (undCount ? ' — switch to ↕ Vertical to give cards a date.' : '.') + '</div>';
    // scale from the typical gap between events: ~140 px for it; only stretches far longer than that are drawn shorter
    var ds = []; for (var q0 = 1; q0 < ev.length; q0++) { var dd = pos(ev[q0].t) - pos(ev[q0 - 1].t); if (dd > 0) ds.push(dd); }
    ds.sort(function (a, b) { return a - b; });
    var med = ds.length ? ds[Math.floor(ds.length / 2)] : 1, PX = Math.max(3, Math.min(160, 140 / Math.max(med, .2))), MAXGAP = 420;
    var xs = [], gaps = [], x = 150;
    ev.forEach(function (e, i) {
      if (i) { var dy = pos(e.t) - pos(ev[i - 1].t), raw = dy * PX; if (raw > MAXGAP) { gaps.push({ a: x, b: x + MAXGAP, years: Math.round(dy) }); raw = MAXGAP; } x += Math.max(raw, HL.MIN); }
      xs.push(x);
    });
    // blocks: up / down, two tiers each; a block that would overlap moves its dot (and the ones after) along
    // an outer block's line must not cross an inner block on its side, and an inner block must not cover an outer line
    var right = { u0: -1e9, u1: -1e9, d0: -1e9, d1: -1e9 }, inner = { u: [], d: [] }, lines = { u: [], d: [] }, place = [];
    function fits(slot, x0, w) {
      var sd = slot[0], t = +slot[1], L = x0 - 16, R = L + w;
      if (right[slot] >= L - 18) return false;
      if (t === 1) return !inner[sd].some(function (iv) { return x0 >= iv[0] - 6 && x0 <= iv[1] + 6; });
      return !lines[sd].some(function (lx) { return lx >= L - 6 && lx <= R + 6; });
    }
    ev.forEach(function (e, i) {
      var w = e.img ? 300 : 186, pref = i % 2 ? ['d', 'u'] : ['u', 'd'], got = null, guard = 0;
      while (!got && guard++ < 60) {
        for (var t = 0; t < 2 && !got; t++) pref.forEach(function (sd) { if (!got && fits(sd + t, xs[i], w)) got = sd + t; });
        if (!got) for (var j = i; j < xs.length; j++) xs[j] += 24;   // no room yet: move this dot (and the rest) along
      }
      right[got] = xs[i] - 16 + w;
      if (got[1] === '0') inner[got[0]].push([xs[i] - 16, xs[i] - 16 + w]); else lines[got[0]].push(xs[i]);
      place.push({ side: got[0], tier: +got[1], w: w });
    });
    var upT = Math.max(0, Math.max.apply(0, place.map(function (p) { return p.side === 'u' ? p.tier : -1; }))), dnT = Math.max(0, Math.max.apply(0, place.map(function (p) { return p.side === 'd' ? p.tier : -1; })));
    var A = 96 + HL.BOX + upT * HL.TIER + 46;
    var width = xs[xs.length - 1] + 360, height = A + 108 + (dnT + 1) * HL.TIER + 10, out = '';
    // the line, the breaks, the marks
    out += '<div class="tl-ax" style="top:' + A + 'px;width:' + width + 'px"></div>';
    gaps.forEach(function (g) { var m = (g.a + g.b) / 2; out += '<div class="tl-brk" style="left:' + (m - 9) + 'px;top:' + (A - 9) + 'px">≈</div><div class="tl-brkt" style="left:' + (m - 60) + 'px;top:' + (A + 10) + 'px">' + g.years + ' years</div>'; });
    var y0 = ev[0].t.y, y1 = ev[ev.length - 1].t.y, span = Math.max(1, y1 - y0), step = span <= 12 ? 1 : span <= 150 ? 10 : span <= 600 ? 50 : span <= 1500 ? 100 : 1000, lastX = -1e9;
    var pts = ev.map(function (e, i) { return [pos(e.t), xs[i]]; });
    for (var T = Math.ceil(y0 / step) * step; T <= y1; T += step) {
      if (T === 0) continue;
      var p = T < 0 ? T + 1 : T, xi = null;
      // inside a shortened stretch the spacing is not to scale: no mark there
      for (var q = 1; q < pts.length; q++) if (p >= pts[q - 1][0] && p <= pts[q][0]) { var d = pts[q][0] - pts[q - 1][0]; if (d * PX > MAXGAP && p > pts[q - 1][0] && p < pts[q][0]) break; xi = pts[q - 1][1] + (d ? (p - pts[q - 1][0]) / d : 0) * (pts[q][1] - pts[q - 1][1]); break; }
      if (xi == null && p === pts[0][0]) xi = pts[0][1];
      if (xi == null || xi - lastX < 150) continue;   // marks never crowd
      lastX = xi;
      out += '<div class="tl-tick" style="left:' + xi + 'px;top:' + (A - 5) + 'px"></div><div class="tl-dec" style="left:' + (xi - 6) + 'px;top:' + (A + 22) + 'px">' + (T < 0 ? (-T) + '<small> BCE</small>' : T) + '</div>';
    }
    // the legend
    var cols = []; ev.forEach(function (e) { if (cols.indexOf(e.col) < 0) cols.push(e.col); });
    out += '<div class="tl-leg">' + cols.map(function (c) { return '<div><i style="background:' + esc(c.color || '#d6336c') + '"></i>' + esc(c.title || 'List') + '</div>'; }).join('') + '</div>';
    // dots, lines, blocks
    ev.forEach(function (e, i) {
      var pl = place[i], c = esc(e.col.color || '#d6336c'), bx = xs[i] - 16, top, lineTop, lineH;
      if (pl.side === 'u') { var bottom = A - 46 - pl.tier * HL.TIER; top = bottom - HL.BOX; lineTop = bottom; lineH = A - bottom; }
      else { top = A + 108 + pl.tier * HL.TIER; lineTop = A; lineH = top - A; }
      out += '<div class="tl-hl" style="left:' + (xs[i] - .5) + 'px;top:' + lineTop + 'px;height:' + lineH + 'px"></div>';
      out += '<button type="button" class="tl-hd" data-id="' + esc(e.id) + '" style="left:' + (xs[i] - 8) + 'px;top:' + (A - 8) + 'px;background:' + c + '" aria-label="' + esc(e.title) + '"></button>';
      out += '<div class="tl-hb ' + pl.side + (e.done ? ' done' : '') + '" data-id="' + esc(e.id) + '" style="left:' + bx + 'px;top:' + top + 'px;width:' + pl.w + 'px;height:' + HL.BOX + 'px">' +
        (e.img ? '<img alt="" src="' + esc(e.img) + '">' : '') + '<div class="tx"><div class="d">' + esc(label(e.t)) + '</div><div class="n">' + esc(e.title) + '</div>' + (e.note ? '<div class="m">' + esc(e.note) + '</div>' : '') + '</div></div>';
    });
    return '<div class="tl-canvas" style="width:' + width + 'px;height:' + height + 'px">' + out + '</div>';
  }
  // the event's actions, from the horizontal axis
  function evSheet(n) {
    closeSheet();
    sheet = document.createElement('div'); sheet.className = 'tl-sheet';
    sheet.innerHTML = '<h4>' + esc(n.title) + '</h4><p style="white-space:normal">' + esc(label(n.t)) + ' · ' + esc(n.col.title || '') + '</p>' + (n.note ? '<div style="font-size:14px;opacity:.85;line-height:1.45;max-height:30vh;overflow:auto;margin-bottom:6px">' + esc(n.note) + '</div>' : '') +
      '<div class="tl-sb"><button type="button" data-ha="details">ⓘ Details</button><button type="button" data-ha="date">Edit date</button><button type="button" class="save" data-ha="board">On the board</button></div>';
    document.body.appendChild(sheet);
    if (sheet.animate) sheet.animate([{ opacity: 0, translate: '0 30px' }, { opacity: 1, translate: '0 0' }], { duration: 240, easing: 'cubic-bezier(.2,.85,.25,1)' });
    ['pointerdown', 'touchstart'].forEach(function (ev) { sheet.addEventListener(ev, function (x) { x.stopPropagation(); }, { passive: true }); });
    sheet.addEventListener('click', function (x) {
      var b = x.target.closest('[data-ha]'); if (!b) return;
      var a = b.getAttribute('data-ha'); closeSheet();
      if (a === 'details') return away(n);
      if (a === 'date') return dateSheet(n);
      keep(); var to = { b: ui.bid, l: n.col.id, c: n.id, p: n.parent ? n.parent.id : null }; close();
      if (window.MinestContents && MinestContents.goTo) MinestContents.goTo(to, { label: 'Timeline', open: function () { open(to.b); setTimeout(function () { hit(n.id); }, 120); } });
    });
  }
  // smooth, and certain: if the smooth scroll did not happen (a hidden tab, an interrupted gesture), land there anyway
  function glide(top) {
    top = Math.max(0, Math.min(top, ui.list.scrollHeight - ui.list.clientHeight));
    ui.list.scrollTo({ top: top, behavior: 'smooth' });
    var L = ui.list; setTimeout(function () { if (L.isConnected && Math.abs(L.scrollTop - top) > 4) L.scrollTop = top; }, 650);
  }
  function evById(id) { return E ? E.dated.concat(E.undated).filter(function (e) { return e.id === id; })[0] : null; }
  function scrollToYear(y) {
    if (S.view === 'h') {
      var hb = [].slice.call(ui.list.querySelectorAll('.tl-hd')).filter(function (d) { var n = evById(d.getAttribute('data-id')); return n && n.t.y >= y; })[0] || ui.list.querySelector('.tl-hd:last-of-type');
      if (hb) { var L = ui.list, left = Math.max(0, hb.offsetLeft - 60); L.scrollTo({ left: left, behavior: 'smooth' }); setTimeout(function () { if (Math.abs(L.scrollLeft - left) > 4) L.scrollLeft = left; }, 650); }
      return;
    }
    var best = null;
    ui.list.querySelectorAll('.tl-year').forEach(function (g) { if (best == null && +g.getAttribute('data-y') >= y) best = g; });
    if (!best) { var all = ui.list.querySelectorAll('.tl-year'); best = all[all.length - 1]; }
    if (best) glide(best.offsetTop - 8);
  }
  function hit(id) {
    if (S.view === 'h') { var hb = ui.list.querySelector('.tl-hb[data-id="' + cssEsc(id) + '"]'); if (!hb) return; ui.list.scrollLeft = Math.max(0, hb.offsetLeft - 60); ui.list.scrollTop = Math.max(0, hb.offsetTop - 120); hb.classList.remove('hit'); void hb.offsetWidth; hb.classList.add('hit'); return; }
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
      if ((seen && gone >= 2) || (!seen && Date.now() - t0 > 2500)) { clearInterval(iv); if (!ui.el) return; ui.el.classList.remove('away'); render(); restore(); }
    }, 250);
  }
  function keep() { if (ui.list && ui.bid) { S.scroll[ui.bid] = ui.list.scrollTop; S.scrollX = S.scrollX || {}; S.scrollX[ui.bid] = ui.list.scrollLeft; stSave(); } }
  function restore() { ui.list.scrollTop = S.scroll[ui.bid] || 0; ui.list.scrollLeft = (S.scrollX || {})[ui.bid] || 0; }

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
      '<div class="tl-row"><span class="tl-seg"><button type="button" data-view="v" title="Vertical">↕ Vertical</button><button type="button" data-view="h" title="Horizontal">↔ Horizontal</button></span></div>' +
      '<div class="tl-row tl-nav"></div><div class="tl-row tl-lists"></div></div><div class="tl-body"></div>';
    ui.el = el; ui.list = el.querySelector('.tl-body'); ui.title = el.querySelector('.tl-tb b'); ui.nav = el.querySelector('.tl-nav'); ui.lists = el.querySelector('.tl-lists'); ui.open = true;
    document.body.appendChild(el); document.documentElement.classList.add('kn-open');
    render(); restore();
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
    m.addEventListener('click', function (e) { var b = e.target.closest('[data-b]'); if (!b) return; m.remove(); keep(); ui.bid = b.getAttribute('data-b'); render(); restore(); });
  }
  function wire(el) {
    ['pointerdown', 'touchstart', 'touchmove', 'wheel'].forEach(function (ev) { el.addEventListener(ev, function (e) { e.stopPropagation(); }, { passive: true }); });
    el.addEventListener('pointerdown', function (e) { if (sheet && !sheet.contains(e.target)) closeSheet(); var m = document.querySelector('.tl-menu'); if (m && !m.contains(e.target) && !e.target.closest('[data-boards]')) m.remove(); });
    el.addEventListener('click', function (e) {
      if (e.target.closest('[data-x]')) return close();
      if (e.target.closest('[data-boards]')) return boardMenu(e.target.closest('[data-boards]'));
      var vw = e.target.closest('[data-view]'); if (vw) { keep(); S.view = vw.getAttribute('data-view'); stSave(); render(); restore(); return; }
      var hb = e.target.closest('.tl-hb, .tl-hd'); if (hb) { var hn = evById(hb.getAttribute('data-id')); if (hn) evSheet(hn); return; }
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

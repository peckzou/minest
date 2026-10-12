/* Minest · Golden Framework Library (window.MinestFrameworks)
   My Lists — What I Have · My Frameworks — How I Understand · My World — How Everything Connects.
   Three layers, kept apart:
     Original Framework — read-only definitions (tools/knowledge/frameworks/<collection>.json → window.__MINEST_FRAMEWORKS,
                          format minest.framework/1, schema in frameworks/schema). Nothing here ever edits them.
     My Interpretation  — the user's own layer in MinestKnowledge (synced):
                          'fx:saved:<fw>' {at} · 'fx:my:<fw>' {notes, examples, questions, adaptations, at} · 'fx:recent' [fw…]
                          'fx:link:<fw>:<concept>' [{bid, id, title, list}] — links to existing cards / stacked cards (never copies)
                          'fx:ses:<id>' {id, fw, title, steps|ratings, notes, at, updatedAt} — OODA sessions, well-being check-ins
     Apply to My World  — links above; the world templates a framework points to open in My World's own preview.
   One engine draws eight structure types: hierarchy · network · matrix · nested · cycle · timeline · levels · dimensions;
   the six reference frameworks (Propædia, Syntopicon, Periodic Table, Bronfenbrenner, OODA, OECD) get their own touches. */
(function () {
  if (window.MinestFrameworks) return;
  var KN = function () { return window.MinestKnowledge; };
  var A = function () { return window.MinestAI || {}; };
  var ALL = window.__MINEST_FRAMEWORKS || [];
  var BY = {}; ALL.forEach(function (f) { BY[f.id] = f; });
  var reduce = window.matchMedia && matchMedia('(prefers-reduced-motion: reduce)').matches;
  function esc(s) { return String(s == null ? '' : s).replace(/[&<>"]/g, function (c) { return { '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;' }[c]; }); }
  function toast(m) { try { if (window.GlassUI && GlassUI.toast) return GlassUI.toast(m); } catch (e) {} }
  function rid() { return Date.now().toString(36) + Math.random().toString(36).slice(2, 6); }
  function day(t) { try { return new Date(t).toLocaleDateString(undefined, { year: 'numeric', month: 'short', day: 'numeric' }); } catch (e) { return ''; } }
  function boards() { try { return (A().boards && A().boards()) || []; } catch (e) { return []; } }
  function cid(c) { return c.id; }
  var COL = { philosophy: ['Philosophy', '#9b5de5'], knowledge: ['Knowledge & Encyclopedia', '#5e9cff'], nature: ['Nature & Science', '#30b45a'], psychology: ['Human Development & Psychology', '#f08c3a'],
    society: ['Society & Civilization', '#00a6a6'], systems: ['Systems & Thinking', '#e8566c'], life: ['Life & Organization', '#c9a227'] };
  var ORDER = ['philosophy', 'knowledge', 'nature', 'psychology', 'society', 'systems', 'life'];
  var TYPE = { hierarchy: 'Hierarchy', network: 'Network', matrix: 'Matrix', nested: 'Nested systems', cycle: 'Cycle', timeline: 'Timeline', levels: 'Levels', dimensions: 'Dimensions' };

  // ================================================================== the user's layer
  function saved(id) { return !!(KN() && KN().get('fx:saved:' + id)); }
  function setSaved(id, on) { KN().set('fx:saved:' + id, on ? { at: Date.now() } : null, true); }
  function savedIds() { return (KN() ? KN().keys('fx:saved:') : []).map(function (k) { return [k.slice(9), (KN().get(k) || {}).at || 0]; }).filter(function (x) { return BY[x[0]]; }).sort(function (a, b) { return b[1] - a[1]; }).map(function (x) { return x[0]; }); }
  function recent() { return ((KN() && KN().get('fx:recent')) || []).filter(function (id) { return BY[id]; }); }
  function touch(id) { var r = recent().filter(function (x) { return x !== id; }); r.unshift(id); KN().set('fx:recent', r.slice(0, 8), true); }
  function mine(id) { return (KN() && KN().get('fx:my:' + id)) || {}; }
  function links(fw, c) { return (KN() && KN().get('fx:link:' + fw + ':' + c)) || []; }
  function setLinks(fw, c, arr) { KN().set('fx:link:' + fw + ':' + c, arr && arr.length ? arr : null, true); }
  function allLinks(fw) { var out = []; (KN() ? KN().keys('fx:link:' + fw + ':') : []).forEach(function (k) { (KN().get(k) || []).forEach(function (r) { out.push(Object.assign({ concept: k.slice(('fx:link:' + fw + ':').length) }, r)); }); }); return out; }
  function sessions(fw) { return (KN() ? KN().keys('fx:ses:') : []).map(function (k) { return KN().get(k); }).filter(function (s) { return s && s.fw === fw; }).sort(function (a, b) { return b.at - a.at; }); }

  // every card and stacked card on the boards (what can be linked): one entry each, never copied
  function everything() {
    var out = [];
    boards().forEach(function (b) { (b.columns || []).forEach(function (col) { (col.cards || []).forEach(function (k) {
      if (!k || !k.id || (KN() && KN().isHeading && KN().isHeading(k.id))) return;
      out.push({ bid: b.id, id: k.id, title: k.title || 'Untitled', list: col.title, board: b.title });
      (k.stack || []).forEach(function (s) { if (s && s.id) out.push({ bid: b.id, id: s.id, title: s.title || 'Untitled', list: k.title, board: b.title, parent: k.id }); });
    }); }); });
    return out;
  }
  function stillThere(r) { return everything().some(function (x) { return x.id === r.id; }); }
  function openRef(r) {
    var b = boards().filter(function (x) { return x.id === r.bid; })[0]; if (!b) return toast('That card is not there any more.');
    var hit = null; (b.columns || []).forEach(function (col) { (col.cards || []).forEach(function (k) { if (k.id === r.id) hit = { col: col.id, card: k.id }; (k.stack || []).forEach(function (s) { if (s.id === r.id) hit = { col: col.id, card: k.id, sid: s.id }; }); }); });
    if (!hit) return toast('That card is not there any more.');
    close(); setTimeout(function () {
      try { if (hit.sid && window.MinestStarter && MinestStarter.openItem && MinestStarter.has && MinestStarter.has(r.bid)) MinestStarter.openItem(r.bid, hit.sid); else A().openCardIn(r.bid, hit.col, hit.card); } catch (e) {}
    }, 200);
  }

  // ================================================================== look
  var I = function (d, w) { return '<svg viewBox="0 0 24 24" width="' + (w || 19) + '" height="' + (w || 19) + '" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">' + d + '</svg>'; };
  var ICON = { x: I('<path d="M6 6l12 12M18 6 6 18"/>'), back: I('<path d="m15 6-6 6 6 6"/>'), search: I('<circle cx="11" cy="11" r="6.5"/><path d="m20 20-4.2-4.2"/>', 17), chev: I('<path d="m9 6 6 6-6 6"/>', 16),
    star: I('<path d="m12 3 2.7 5.6 6.1.9-4.4 4.3 1 6.1L12 17l-5.4 2.9 1-6.1-4.4-4.3 6.1-.9z"/>', 18), link: I('<path d="M10 14a4 4 0 0 0 5.7 0l3-3a4 4 0 0 0-5.7-5.7l-1 1M14 10a4 4 0 0 0-5.7 0l-3 3a4 4 0 0 0 5.7 5.7l1-1"/>', 15), plus: I('<path d="M12 5v14M5 12h14"/>', 16) };
  // a small picture of each structure type (cards, chips)
  function preview(type, c, w) {
    w = w || 64; var h = Math.round(w * .62), S = '<svg viewBox="0 0 64 40" width="' + w + '" height="' + h + '" fill="none" stroke="' + c + '" stroke-width="2" stroke-linecap="round">', E = '</svg>', F = 'fill="' + c + '" stroke="none"';
    switch (type) {
      case 'hierarchy': return S + '<rect x="26" y="3" width="12" height="7" rx="2" ' + F + '/><path d="M32 10v5M14 15h36M14 15v4M32 15v4M50 15v4"/><rect x="8" y="20" width="12" height="7" rx="2" ' + F + ' opacity=".7"/><rect x="26" y="20" width="12" height="7" rx="2" ' + F + ' opacity=".7"/><rect x="44" y="20" width="12" height="7" rx="2" ' + F + ' opacity=".7"/><path d="M14 27v4M8 31h12" opacity=".5"/>' + E;
      case 'network': return S + '<path d="M14 10 32 20 50 8M32 20 20 32M32 20l16 12M14 10l6 22" opacity=".6"/><circle cx="32" cy="20" r="5" ' + F + '/><circle cx="14" cy="10" r="3.5" ' + F + '/><circle cx="50" cy="8" r="3.5" ' + F + '/><circle cx="20" cy="32" r="3.5" ' + F + '/><circle cx="48" cy="32" r="3.5" ' + F + '/>' + E;
      case 'matrix': var r = ''; for (var y = 0; y < 4; y++) for (var x = 0; x < 7; x++) if (!(y === 0 && x > 0 && x < 6)) r += '<rect x="' + (6 + x * 7.5) + '" y="' + (5 + y * 7.5) + '" width="6" height="6" rx="1.2" ' + F + ' opacity="' + (.35 + ((x + y) % 3) * .25) + '"/>'; return S + r + E;
      case 'nested': return S + '<circle cx="32" cy="20" r="17" opacity=".35"/><circle cx="32" cy="20" r="12" opacity=".6"/><circle cx="32" cy="20" r="7"/><circle cx="32" cy="20" r="3" ' + F + '/>' + E;
      case 'cycle': return S + '<path d="M32 5a15 15 0 0 1 14.6 11.5M46 26a15 15 0 0 1-12 9M28 35a15 15 0 0 1-12.5-10M17 15A15 15 0 0 1 28 5.5"/><circle cx="32" cy="5" r="3" ' + F + '/><circle cx="47" cy="20" r="3" ' + F + '/><circle cx="32" cy="35" r="3" ' + F + '/><circle cx="17" cy="20" r="3" ' + F + '/>' + E;
      case 'timeline': return S + '<path d="M6 20h52"/><circle cx="12" cy="20" r="3" ' + F + '/><circle cx="26" cy="20" r="3" ' + F + '/><circle cx="40" cy="20" r="3" ' + F + '/><circle cx="54" cy="20" r="3" ' + F + '/><path d="M12 14V9M26 26v5M40 14V9M54 26v5" opacity=".6"/>' + E;
      case 'levels': return S + '<rect x="24" y="4" width="16" height="6" rx="2" ' + F + '/><rect x="18" y="12" width="28" height="6" rx="2" ' + F + ' opacity=".8"/><rect x="12" y="20" width="40" height="6" rx="2" ' + F + ' opacity=".6"/><rect x="6" y="28" width="52" height="6" rx="2" ' + F + ' opacity=".4"/>' + E;
      case 'dimensions': return S + '<rect x="6" y="5" width="15" height="13" rx="3" ' + F + '/><rect x="24.5" y="5" width="15" height="13" rx="3" ' + F + ' opacity=".7"/><rect x="43" y="5" width="15" height="13" rx="3" ' + F + ' opacity=".5"/><rect x="6" y="22" width="15" height="13" rx="3" ' + F + ' opacity=".6"/><rect x="24.5" y="22" width="15" height="13" rx="3" ' + F + ' opacity=".4"/><rect x="43" y="22" width="15" height="13" rx="3" ' + F + ' opacity=".8"/>' + E;
    }
    return '';
  }
  var CSS = [
    '.fw{position:fixed;inset:0;z-index:2147482006;display:flex;flex-direction:column;color:var(--fw-ink);font:15px/1.45 -apple-system,BlinkMacSystemFont,"SF Pro Text",system-ui,sans-serif;-webkit-font-smoothing:antialiased;background:var(--fw-bg);',
    '--fw-ink:#f4f5f8;--fw-sub:rgba(244,245,248,.62);--fw-bg:linear-gradient(180deg,#141821,#0b0d13);--fw-card:rgba(255,255,255,.06);--fw-line:rgba(255,255,255,.1);--fw-fill:rgba(255,255,255,.08);--fw-blue:#0a84ff;--fw-sheet:#1d212c}',
    'html.kn-light .fw{--fw-ink:#15171c;--fw-sub:rgba(21,23,28,.6);--fw-bg:linear-gradient(180deg,#f6f7fa,#eceef3);--fw-card:#fff;--fw-line:rgba(0,0,0,.08);--fw-fill:rgba(0,0,0,.05);--fw-blue:#007aff;--fw-sheet:#fff}',
    '.fw-head{display:flex;align-items:center;gap:8px;padding:calc(env(safe-area-inset-top,0px) + 14px) 16px 6px}',
    '.fw-head .ti{flex:1;min-width:0}.fw-head h1{margin:0;font-size:30px;font-weight:800;letter-spacing:-.7px;line-height:1.05}.fw-head p{margin:3px 0 0;font-size:14px;color:var(--fw-sub)}',
    '.fw-head h1{font-size:27px!important}.fw-head h2{flex:1;min-width:0;margin:0;font-size:21px;font-weight:800;letter-spacing:-.4px;white-space:nowrap;overflow:hidden;text-overflow:ellipsis}',
    '.fw-b{flex:none;width:38px;height:38px;border-radius:50%;display:grid;place-items:center;padding:0;cursor:pointer;color:inherit;background:var(--fw-fill);border:0}',
    '.fw-b.on{color:#ffcc00}',
    '.fw-body{flex:1;overflow-y:auto;-webkit-overflow-scrolling:touch;padding:6px 16px calc(env(safe-area-inset-bottom,0px) + 40px)}',
    '.fw-search{display:flex;align-items:center;gap:8px;height:42px;padding:0 12px;border-radius:13px;background:var(--fw-fill);margin:4px 0 10px;color:var(--fw-sub)}',
    '.fw-search input{flex:1;min-width:0;border:0;background:none;outline:none;color:var(--fw-ink);font:16px -apple-system,system-ui,sans-serif}',
    '.fw-chips{display:flex;gap:6px;overflow-x:auto;scrollbar-width:none;margin:0 -16px 6px;padding:0 16px 4px}.fw-chips::-webkit-scrollbar{display:none}',
    '.fw-chip{flex:none;height:32px;padding:0 13px;border-radius:999px;border:1px solid var(--fw-line);background:none;color:inherit;font:600 13px -apple-system,system-ui,sans-serif;cursor:pointer;white-space:nowrap}',
    '.fw-chip.on{background:var(--fw-ink);color:var(--fw-bg-solid,#111);border-color:transparent}html.kn-light .fw-chip.on{color:#fff}.fw .fw-chip.on{color:#111}html.kn-light .fw .fw-chip.on{color:#fff}',
    '.fw-h{display:flex;align-items:baseline;justify-content:space-between;margin:18px 2px 8px}.fw-h b{font-size:19px;font-weight:800;letter-spacing:-.3px}.fw-h small{color:var(--fw-sub);font-size:13px}',
    '.fw-grid{display:grid;grid-template-columns:repeat(auto-fill,minmax(158px,1fr));gap:10px}',
    '.fw-row{display:flex;gap:10px;overflow-x:auto;scrollbar-width:none;margin:0 -16px;padding:0 16px 4px;scroll-snap-type:x mandatory}.fw-row::-webkit-scrollbar{display:none}.fw-row .fw-card{flex:0 0 200px;scroll-snap-align:start}',
    '.fw-card{position:relative;display:flex;flex-direction:column;text-align:left;border-radius:18px;overflow:hidden;background:var(--fw-card);border:1px solid var(--fw-line);cursor:pointer;color:inherit;font:inherit;padding:0}',
    '.fw-card:active{transform:scale(.98)}',
    '.fw-card .pv{height:82px;display:grid;place-items:center;background:linear-gradient(150deg,color-mix(in srgb,var(--c) 30%,transparent),color-mix(in srgb,var(--c) 10%,transparent))}',
    '.fw-card .tx{padding:9px 11px 11px;display:flex;flex-direction:column;gap:2px;min-width:0}',
    '.fw-card b{font-size:14.5px;line-height:1.25;letter-spacing:-.1px}.fw-card .my{font-size:12.5px;font-weight:650;color:var(--c)}',
    '.fw-card .by{font-size:12px;color:var(--fw-sub);white-space:nowrap;overflow:hidden;text-overflow:ellipsis}',
    '.fw-card .sm{font-size:12.5px;color:var(--fw-sub);display:-webkit-box;-webkit-line-clamp:2;-webkit-box-orient:vertical;overflow:hidden;margin-top:2px}',
    '.fw-card .ty{position:absolute;left:8px;top:8px;font-size:10.5px;font-weight:700;letter-spacing:.04em;text-transform:uppercase;padding:2px 7px;border-radius:999px;background:rgba(0,0,0,.35);color:#fff}',
    '.fw-card .sv{position:absolute;right:6px;top:6px;width:32px;height:32px;border-radius:50%;border:0;display:grid;place-items:center;background:rgba(0,0,0,.3);color:#fff;cursor:pointer}.fw-card .sv.on{color:#ffcc00}',
    '.fw-card .ref{font-size:11px;font-weight:700;color:var(--c);margin-top:4px}',
    '.fw-empty{color:var(--fw-sub);text-align:center;padding:24px 8px}',
    // detail
    '.fw-hero{display:flex;gap:12px;align-items:center;padding:12px;border-radius:18px;background:linear-gradient(150deg,color-mix(in srgb,var(--c) 26%,transparent),color-mix(in srgb,var(--c) 6%,transparent));border:1px solid var(--fw-line)}',
    '.fw-hero .tx{min-width:0}.fw-hero b{display:block;font-size:18px;line-height:1.2;letter-spacing:-.2px}.fw-hero .my{font-size:14px;font-weight:700;color:var(--c)}.fw-hero small{display:block;font-size:12.5px;color:var(--fw-sub);margin-top:3px}',
    '.fw-tabs{display:flex;gap:4px;padding:3px;border-radius:12px;background:var(--fw-fill);margin:12px 0 12px;overflow-x:auto;scrollbar-width:none}.fw-tabs::-webkit-scrollbar{display:none}',
    '.fw-tabs button{flex:1 0 auto;height:34px;padding:0 10px;border:0;border-radius:9px;background:none;color:inherit;font:600 13px -apple-system,system-ui,sans-serif;cursor:pointer;white-space:nowrap}.fw-tabs button.on{background:var(--fw-card);box-shadow:0 1px 4px rgba(0,0,0,.15)}',
    '.fw-p{margin:0 2px 10px;font-size:15px}.fw-k{font-size:12px;font-weight:700;letter-spacing:.06em;text-transform:uppercase;color:var(--fw-sub);margin:16px 2px 6px}',
    '.fw-note{padding:10px 12px;border-radius:14px;background:var(--fw-fill);font-size:13.5px;color:var(--fw-sub);margin:8px 0}.fw-note.warn{background:color-mix(in srgb,#ff9f0a 14%,transparent);color:inherit}',
    '.fw-go{display:inline-flex;align-items:center;gap:6px;height:38px;padding:0 14px;border-radius:12px;border:0;background:var(--fw-blue);color:#fff;font:650 14px -apple-system,system-ui,sans-serif;cursor:pointer;margin:4px 6px 4px 0}',
    '.fw-go.sec{background:var(--fw-fill);color:inherit}',
    '.fw-mini{display:inline-flex;align-items:center;gap:4px;height:28px;padding:0 10px;border-radius:999px;border:1px solid var(--fw-line);background:none;color:inherit;font:600 12.5px -apple-system,system-ui,sans-serif;cursor:pointer;margin:3px 4px 3px 0}',
    '.fw-mini.on{background:var(--fw-blue);border-color:transparent;color:#fff}',
    // hierarchy
    '.fw-tree{display:flex;flex-direction:column;gap:2px}.fw-node{border-radius:12px}.fw-nh{display:flex;align-items:center;gap:8px;width:100%;text-align:left;padding:9px 10px;border:0;border-radius:12px;background:none;color:inherit;font:inherit;cursor:pointer}',
    '.fw-nh:hover{background:var(--fw-fill)}.fw-nh .tw{flex:none;width:16px;opacity:.6;transition:transform .15s}.fw-node.open>.fw-nh .tw{transform:rotate(90deg)}',
    '.fw-nh .nm{flex:1;min-width:0}.fw-nh .nm small{display:block;color:var(--c);font-weight:650;font-size:12.5px}.fw-nh em{font-style:normal;font-size:12px;color:var(--fw-sub)}',
    '.fw-kids{margin-left:18px;border-left:1px solid var(--fw-line);padding-left:6px}',
    '.fw-nd{padding:4px 10px 10px 34px;font-size:13.5px;color:var(--fw-sub)}',
    '.fw-node.hit>.fw-nh{background:color-mix(in srgb,var(--c) 22%,transparent)}',
    // concept panel (shared)
    '.fw-panel{margin:12px 0;padding:14px;border-radius:18px;background:var(--fw-card);border:1px solid var(--fw-line)}',
    '.fw-panel h3{margin:0 0 2px;font-size:19px;letter-spacing:-.2px}.fw-panel .my{color:var(--c);font-weight:700;font-size:13.5px}.fw-panel p{margin:6px 0;font-size:14.5px}',
    '.fw-links{display:flex;flex-direction:column;gap:6px;margin-top:6px}.fw-lk{display:flex;align-items:center;gap:8px;padding:8px 10px;border-radius:12px;background:var(--fw-fill);cursor:pointer;font-size:14px}',
    '.fw-lk small{color:var(--fw-sub);font-size:12px;margin-left:auto;white-space:nowrap;overflow:hidden;text-overflow:ellipsis;max-width:45%}.fw-lk .rm{border:0;background:none;color:var(--fw-sub);cursor:pointer;font-size:16px;padding:0 2px}',
    // network
    '.fw-net{position:relative;width:100%;aspect-ratio:1/0.82;max-height:380px;border-radius:18px;background:var(--fw-card);border:1px solid var(--fw-line);overflow:hidden}',
    '.fw-net svg{position:absolute;inset:0;width:100%;height:100%}.fw-net button{position:absolute;transform:translate(-50%,-50%);max-width:34%;padding:5px 10px;border-radius:999px;border:1px solid var(--fw-line);background:var(--fw-sheet);color:inherit;font:600 12.5px -apple-system,system-ui,sans-serif;cursor:pointer;line-height:1.2;text-align:center}',
    '.fw-net button.ce{padding:9px 14px;font-size:15px;background:var(--c);color:#fff;border-color:transparent;max-width:44%;z-index:2}',
    '.fw-idx{display:flex;flex-wrap:wrap;gap:5px}.fw-idx button{border:0;border-radius:999px;padding:4px 10px;background:var(--fw-fill);color:inherit;font:500 13px -apple-system,system-ui,sans-serif;cursor:pointer}.fw-idx button.on{background:var(--c);color:#fff}',
    '.fw-gl{display:inline-flex;align-items:center;gap:5px;font-size:12px;color:var(--fw-sub);margin:0 10px 4px 0}.fw-gl i{width:9px;height:9px;border-radius:50%}',
    // matrix
    '.fw-mx{overflow-x:auto;margin:0 -16px;padding:4px 16px 8px}.fw-mxg{display:grid;grid-template-columns:repeat(18,34px);grid-template-rows:repeat(7,40px) 12px repeat(2,40px);gap:3px;width:max-content}',
    '.fw-el{border:0;border-radius:6px;padding:2px 0 0;color:#111;cursor:pointer;display:flex;flex-direction:column;align-items:center;justify-content:center;line-height:1;font:700 13px -apple-system,system-ui,sans-serif}',
    '.fw-el small{font-size:8.5px;font-weight:600;opacity:.75;margin-bottom:2px}.fw-el.dim{opacity:.18}.fw-el.ph{background:none!important;color:var(--fw-sub);font-size:8px;border:1px dashed var(--fw-line)}',
    '.fw-el.sel{outline:2px solid var(--fw-ink);outline-offset:1px}',
    '.fw-big{display:flex;align-items:center;gap:14px}.fw-big .sy{width:74px;height:74px;border-radius:14px;display:flex;flex-direction:column;align-items:center;justify-content:center;color:#111;font:800 30px -apple-system,system-ui,sans-serif}.fw-big .sy small{font-size:12px;font-weight:700}',
    // nested
    '.fw-nest{position:relative;width:100%;max-width:380px;margin:0 auto;aspect-ratio:100/105}.fw-nest svg{width:100%;height:100%}.fw-nest .rg{cursor:pointer;transition:opacity .15s}.fw-nest .rg.sel circle{stroke-width:3}',
    // cycle
    '.fw-cyc{position:relative;width:100%;max-width:340px;margin:0 auto;aspect-ratio:1}.fw-cyc svg{position:absolute;inset:0;width:100%;height:100%}',
    '.fw-cyc button{position:absolute;transform:translate(-50%,-50%);width:96px;min-height:58px;padding:6px;border-radius:16px;border:1px solid var(--fw-line);background:var(--fw-sheet);color:inherit;font:700 14px -apple-system,system-ui,sans-serif;cursor:pointer;line-height:1.15}',
    '.fw-cyc button small{display:block;font-weight:500;font-size:11px;color:var(--fw-sub);margin-top:2px}.fw-cyc button.sel{background:var(--c);color:#fff;border-color:transparent}.fw-cyc button.sel small{color:rgba(255,255,255,.85)}',
    '.fw-ta{width:100%;box-sizing:border-box;min-height:74px;padding:10px 12px;border-radius:12px;border:1px solid var(--fw-line);background:var(--fw-fill);color:inherit;font:15px -apple-system,system-ui,sans-serif;resize:vertical;outline:none}',
    '.fw-in{width:100%;box-sizing:border-box;height:42px;padding:0 12px;border-radius:12px;border:1px solid var(--fw-line);background:var(--fw-fill);color:inherit;font:15px -apple-system,system-ui,sans-serif;outline:none}',
    '.fw-ses{display:flex;align-items:center;gap:10px;width:100%;text-align:left;padding:11px 12px;margin-bottom:6px;border-radius:14px;border:1px solid var(--fw-line);background:var(--fw-card);color:inherit;font:inherit;cursor:pointer}',
    '.fw-ses div{flex:1;min-width:0}.fw-ses b{display:block;font-size:14.5px}.fw-ses small{color:var(--fw-sub);font-size:12px}',
    // timeline / levels / dimensions
    '.fw-tl{position:relative;padding-left:22px}.fw-tl:before{content:"";position:absolute;left:7px;top:6px;bottom:6px;width:2px;background:var(--fw-line)}',
    '.fw-ti{position:relative;margin-bottom:10px;cursor:pointer}.fw-ti:before{content:"";position:absolute;left:-19px;top:5px;width:10px;height:10px;border-radius:50%;background:var(--c)}',
    '.fw-ti small{display:block;color:var(--c);font-weight:700;font-size:12px}.fw-ti b{font-size:15px}.fw-ti p{margin:2px 0 0;font-size:13.5px;color:var(--fw-sub)}',
    '.fw-lv{display:flex;flex-direction:column-reverse;align-items:center;gap:4px}.fw-lvi{border:0;border-radius:10px;padding:9px 10px;color:#fff;font:650 14px -apple-system,system-ui,sans-serif;cursor:pointer;text-align:center;line-height:1.2}',
    '.fw-lvi small{display:block;font-weight:500;font-size:11.5px;opacity:.85}',
    '.fw-dm{display:grid;grid-template-columns:repeat(auto-fill,minmax(148px,1fr));gap:8px}',
    '.fw-dmi{position:relative;text-align:left;padding:12px;border-radius:14px;border:1px solid var(--fw-line);background:var(--fw-card);color:inherit;font:inherit;cursor:pointer;min-height:64px}',
    '.fw-dmi b{display:block;font-size:14px;line-height:1.25}.fw-dmi small{display:block;color:var(--c);font-weight:650;font-size:12px;margin-top:2px}.fw-dmi.sel{border-color:var(--c);box-shadow:0 0 0 1px var(--c) inset}',
    '.fw-dmi .rt{position:absolute;right:9px;top:9px;font-size:11px;color:var(--fw-sub)}.fw-dmi .dots{display:flex;gap:3px;margin-top:6px}.fw-dmi .dots i{width:7px;height:7px;border-radius:50%;background:var(--fw-line)}.fw-dmi .dots i.on{background:var(--c)}',
    '.fw-rate{display:flex;gap:6px;margin:6px 0}.fw-rate button{width:38px;height:38px;border-radius:50%;border:1px solid var(--fw-line);background:none;color:inherit;font:700 14px -apple-system,system-ui,sans-serif;cursor:pointer}.fw-rate button.on{background:var(--c);color:#fff;border-color:transparent}',
    '.fw-cmp{font-size:13px;margin-top:4px}.fw-cmp .up{color:#30b45a}.fw-cmp .dn{color:#ff9f0a}',
    // link picker
    '.fw-pick{position:absolute;inset:0;z-index:5;display:flex;flex-direction:column;background:var(--fw-bg)}',
    '.fw-pick .ls{flex:1;overflow-y:auto;padding:0 16px 30px}.fw-pi{display:flex;align-items:center;gap:10px;width:100%;text-align:left;padding:10px 12px;border-radius:12px;border:0;background:none;color:inherit;font:inherit;cursor:pointer}',
    '.fw-pi:hover{background:var(--fw-fill)}.fw-pi div{flex:1;min-width:0}.fw-pi small{display:block;color:var(--fw-sub);font-size:12px}.fw-pi i{flex:none;width:22px;height:22px;border-radius:50%;border:1.5px solid var(--fw-line);display:grid;place-items:center;font-style:normal;font-size:13px}.fw-pi.on i{background:var(--fw-blue);border-color:transparent;color:#fff}',
    '@media (prefers-reduced-motion: reduce){.fw *{transition:none!important}}'
  ].join('\n');
  function css() { if (document.getElementById('fw-css')) return; var s = document.createElement('style'); s.id = 'fw-css'; s.textContent = CSS; document.head.appendChild(s); }

  // ================================================================== shell
  var ui = { open: false };
  function shell() {
    if (ui.open) return; css(); if (KN() && KN().applyLook) KN().applyLook();
    var el = document.createElement('div'); el.className = 'fw'; el.setAttribute('role', 'dialog'); el.setAttribute('aria-label', 'Frameworks');
    el.innerHTML = '<div class="fw-head"></div><div class="fw-body"></div>';
    ['pointerdown', 'touchstart', 'touchmove', 'wheel', 'keydown'].forEach(function (ev) { el.addEventListener(ev, function (e) { e.stopPropagation(); }, { passive: ev !== 'keydown' }); });
    ui.el = el; ui.head = el.querySelector('.fw-head'); ui.body = el.querySelector('.fw-body'); ui.open = true;
    document.body.appendChild(el); document.documentElement.classList.add('kn-open');
    if (el.animate && !reduce) el.animate([{ opacity: 0, transform: 'scale(.985)' }, { opacity: 1, transform: 'none' }], { duration: 240, easing: 'cubic-bezier(.2,.85,.25,1)' });
    el.addEventListener('click', onClick);
    el.addEventListener('input', onInput);
    el.addEventListener('keydown', function (e) { if (e.key === 'Escape') { if (ui.pick) closePick(); else back(); } });
  }
  function close() {
    if (!ui.open) return; var el = ui.el; ui.open = false; ui.el = null; ui.pick = null;
    if (!document.querySelector('.mw,.lw,.sk,.wk,.pk,.wc,.dv,.bd,.st')) document.documentElement.classList.remove('kn-open');
    if (el.animate && !reduce) { var an = el.animate([{ opacity: 1 }, { opacity: 0 }], { duration: 160, fill: 'forwards' }); an.onfinish = function () { el.remove(); }; } else el.remove();
    if (ui.onClose) { var f = ui.onClose; ui.onClose = null; setTimeout(f, 60); }
  }
  function head(title, backTo, extra) { ui.head.innerHTML = (backTo ? '<button type="button" class="fw-b" data-back="' + esc(backTo) + '" aria-label="Back">' + ICON.back + '</button>' : '') + title + (extra || '') + '<button type="button" class="fw-b" data-x aria-label="Close">' + ICON.x + '</button>'; }
  function back() { var b = ui.head.querySelector('[data-back]'); if (b) b.click(); else close(); }

  // ================================================================== library (home)
  function card(f) {
    var c = COL[f.collection][1], sv = saved(f.id);
    return '<div class="fw-card" role="button" tabindex="0" data-open="' + esc(f.id) + '" style="--c:' + c + '"><span class="pv">' + preview(f.structureType, c, 74) + '</span><span class="ty">' + TYPE[f.structureType] + '</span>' +
      '<button type="button" class="sv' + (sv ? ' on' : '') + '" data-save="' + esc(f.id) + '" aria-label="' + (sv ? 'Remove from My Frameworks' : 'Save to My Frameworks') + '" aria-pressed="' + sv + '">' + ICON.star + '</button>' +
      '<span class="tx">' + (f.myName ? '<span class="my">' + esc(f.myName) + '</span>' : '') + '<b>' + esc(f.name) + '</b><span class="by">' + esc(f.author || '') + '</span><span class="sm">' + esc(f.summary || '') + '</span>' + (f.reference ? '<span class="ref">● Interactive</span>' : '') + '</span></div>';
  }
  function home() {
    shell(); ui.view = 'home'; ui.fw = null;
    head('<div class="ti"><h1>Explore Frameworks</h1><p>Discover ways to understand the world.</p></div>', 'myworld');
    var q = String(ui.q || '').trim().toLowerCase(), colf = ui.col || '';
    var h = '<label class="fw-search">' + ICON.search + '<input data-fq placeholder="Search frameworks, thinkers, ideas" autocomplete="off" value="' + esc(ui.q || '') + '"></label>' +
      '<div class="fw-chips"><button type="button" class="fw-chip' + (!colf ? ' on' : '') + '" data-col="">All</button>' + ORDER.map(function (k) { return '<button type="button" class="fw-chip' + (colf === k ? ' on' : '') + '" data-col="' + k + '">' + COL[k][0] + '</button>'; }).join('') + '</div>';
    if (q || colf) {
      var hits = ALL.filter(function (f) { return (!colf || f.collection === colf) && (!q || [f.name, f.myName, f.author, f.summary, (f.concepts || []).map(function (c) { return c.name; }).join(' ')].join(' ').toLowerCase().indexOf(q) >= 0); });
      h += '<div class="fw-h"><b>' + (colf ? esc(COL[colf][0]) : 'Results') + '</b><small>' + hits.length + '</small></div>' + (hits.length ? '<div class="fw-grid">' + hits.map(card).join('') + '</div>' : '<div class="fw-empty">No framework matches “' + esc(ui.q) + '”.</div>');
    } else {
      var feat = ALL.filter(function (f) { return f.featured; }), sv = savedIds().map(function (id) { return BY[id]; }), rc = recent().map(function (id) { return BY[id]; });
      h += '<div class="fw-h"><b>Featured</b><small>Interactive</small></div><div class="fw-row">' + feat.map(card).join('') + '</div>';
      if (sv.length) h += '<div class="fw-h"><b>My Saved Frameworks</b><small>' + sv.length + '</small></div><div class="fw-row">' + sv.map(card).join('') + '</div>';
      if (rc.length) h += '<div class="fw-h"><b>Recently Explored</b></div><div class="fw-row">' + rc.map(card).join('') + '</div>';
      ORDER.forEach(function (k) { var fs = ALL.filter(function (f) { return f.collection === k; }); h += '<div class="fw-h"><b>' + esc(COL[k][0]) + '</b><small>' + fs.length + '</small></div><div class="fw-grid">' + fs.map(card).join('') + '</div>'; });
    }
    ui.body.innerHTML = h;
    ui.body.scrollTop = ui.homeY || 0;
  }

  // ================================================================== a framework
  var TABS = [['overview', 'Overview'], ['structure', 'Structure'], ['mine', 'My Interpretation'], ['apply', 'Apply'], ['templates', 'Templates']];
  function detail(id, tab) {
    var f = BY[id]; if (!f) return home(); shell();
    if (ui.view === 'home') ui.homeY = ui.body.scrollTop;
    ui.view = 'detail'; if (ui.fw !== id) { ui.sel = null; ui.focus = null; ui.ses = null; ui.tq = ''; ui.open2 = {}; }
    ui.fw = id; ui.tab = tab || ui.tab || 'overview'; touch(id);
    var c = COL[f.collection][1], sv = saved(id);
    head('<h2>' + esc(f.myName || f.name) + '</h2>', 'home', '<button type="button" class="fw-b' + (sv ? ' on' : '') + '" data-save="' + esc(id) + '" aria-label="' + (sv ? 'Saved' : 'Save') + '">' + ICON.star + '</button>');
    var src = f.source || {}, sl = [src.organization, src.work, src.edition, src.year].filter(function (x, i, a) { return x && a.indexOf(x) === i; }).join(' · ');
    ui.el.style.setProperty('--c', c);
    ui.body.innerHTML = '<div class="fw-hero" style="--c:' + c + '"><span>' + preview(f.structureType, c, 70) + '</span><div class="tx">' + (f.myName ? '<span class="my">' + esc(f.myName) + '</span>' : '') + '<b>' + esc(f.name) + '</b><small>' + esc(f.author || '') + '</small><small>' + esc(TYPE[f.structureType] + ' · ' + COL[f.collection][0] + ' · v' + f.version) + '</small></div></div>' +
      '<div class="fw-tabs" role="tablist">' + TABS.map(function (t) { return '<button type="button" role="tab" data-tab="' + t[0] + '"' + (ui.tab === t[0] ? ' class="on" aria-selected="true"' : '') + '>' + t[1] + '</button>'; }).join('') + '</div><div data-pane></div>';
    drawPane();
    ui.body.scrollTop = 0;
  }
  function pane() { return ui.body.querySelector('[data-pane]'); }
  function drawPane() {
    var f = BY[ui.fw], p = pane(); if (!f || !p) return;
    if (ui.tab === 'overview') p.innerHTML = overview(f);
    else if (ui.tab === 'structure') structure(f, p);
    else if (ui.tab === 'mine') p.innerHTML = myLayer(f);
    else if (ui.tab === 'apply') p.innerHTML = applyPane(f);
    else p.innerHTML = templatesPane(f);
  }
  function overview(f) {
    var src = f.source || {};
    return '<p class="fw-p" style="font-size:17px;font-weight:600">' + esc(f.summary) + '</p>' + (f.about ? '<p class="fw-p">' + esc(f.about) + '</p>' : '') +
      (f.scope ? '<div class="fw-k">Good for</div><p class="fw-p">' + esc(f.scope) + '</p>' : '') +
      (f.limits ? '<div class="fw-note warn"><b>Limits · </b>' + esc(f.limits) + '</div>' : '') +
      '<div class="fw-k">Original source</div><p class="fw-p" style="font-size:14px">' + esc([f.author, src.work, src.organization].filter(Boolean).join(' — ')) + (src.year ? ' (' + esc(src.year) + ')' : '') + (src.edition ? '<br><span style="color:var(--fw-sub)">' + esc(src.edition) + '</span>' : '') + '</p>' +
      '<div class="fw-k">At a glance</div><p class="fw-p" style="font-size:14px">' + (f.concepts || []).filter(function (c) { return !c.parent; }).slice(0, 14).map(function (c) { return esc(c.myName ? c.name + ' (' + c.myName + ')' : c.name); }).join(' · ') + ((f.concepts || []).filter(function (c) { return !c.parent; }).length > 14 ? ' …' : '') + '</p>' +
      '<div style="margin-top:10px"><button type="button" class="fw-go" data-tab="structure">Explore the structure</button>' + (f.discoveryTool ? '<button type="button" class="fw-go sec" data-tool="' + esc(f.discoveryTool) + '">Open its Discover tool</button>' : '') + '</div>' +
      '<p class="fw-note">' + esc(f.notice || '') + ' The original is read-only — your notes and links live in My Interpretation.</p>';
  }
  function templatesPane(f) {
    var ts = (f.relatedTemplates || []).map(function (id) { return window.MinestWorld && MinestWorld.templates ? MinestWorld.templates().filter(function (t) { return t.id === id; })[0] : null; }).filter(Boolean);
    if (!ts.length) return '<div class="fw-empty">This framework is a way of looking — it has no world template.<br>Use it with Structure and My Interpretation.</div>';
    return '<p class="fw-p">Make it part of My World. You will see a preview first — nothing is created until you choose.</p>' + ts.map(function (t) {
      return '<button type="button" class="fw-ses" data-tpl="' + esc(t.id) + '"><span style="width:12px;height:12px;border-radius:50%;background:' + esc(t.color || '#888') + '"></span><div><b>' + esc(t.name) + '</b><small>' + esc(t.tagline || t.description || '') + '</small></div>' + ICON.chev + '</button>'; }).join('');
  }
  function myLayer(f) {
    var m = mine(f.id), fields = [['notes', 'My Notes', 'What I make of it…'], ['examples', 'My Examples', 'Where I see it in my life…'], ['questions', 'My Questions', 'What I still wonder…'], ['adaptations', 'My Adaptations', 'How I would change it for me…']];
    var ls = allLinks(f.id);
    return '<p class="fw-note">Yours only — the original framework is never changed. Everything saves as you type.</p>' + fields.map(function (x) {
      return '<div class="fw-k">' + x[1] + '</div><textarea class="fw-ta" data-my="' + x[0] + '" placeholder="' + esc(x[2]) + '">' + esc(m[x[0]] || '') + '</textarea>'; }).join('') +
      '<div class="fw-k">My Connections</div>' + (ls.length ? '<div class="fw-links">' + ls.map(function (r) { var c = conceptOf(f, r.concept); return linkRow(r, c ? c.name : '', r.concept); }).join('') + '</div>' : '<p class="fw-p" style="color:var(--fw-sub);font-size:14px">Link your cards to parts of this framework in Structure.</p>');
  }
  function applyPane(f) {
    var ls = allLinks(f.id), byC = {};
    ls.forEach(function (r) { (byC[r.concept] = byC[r.concept] || []).push(r); });
    return '<p class="fw-p">Use this framework on what you already have: open a part in <b>Structure</b> and link existing cards to it. A card can sit in many frameworks at once — nothing is copied or moved.</p>' +
      (Object.keys(byC).length ? '<div class="fw-k">Linked so far</div>' + Object.keys(byC).map(function (k) { var c = conceptOf(f, k); return '<div class="fw-panel" style="padding:10px 12px;margin:6px 0"><b>' + esc(c ? c.name : k) + '</b><div class="fw-links">' + byC[k].map(function (r) { return linkRow(r, '', k); }).join('') + '</div></div>'; }).join('')
        : '<div class="fw-empty">Nothing linked yet.</div>') +
      '<p class="fw-note">Coming next: suggested mapping for many items at once, with a preview before anything is saved and Undo.</p>';
  }
  function conceptOf(f, id) { return (f.concepts || []).filter(function (c) { return c.id === id; })[0] || null; }
  function linkRow(r, sub, concept) { var ok = stillThere(r); return '<div class="fw-lk" data-ref="' + esc(r.bid + '|' + r.id) + '">' + ICON.link + '<span>' + esc(r.title) + '</span><small>' + esc(sub || r.list || '') + (ok ? '' : ' · gone') + '</small><button type="button" class="rm" data-unlink="' + esc(concept + '|' + r.id) + '" aria-label="Unlink">×</button></div>'; }

  // the concept panel used by every structure: summary, examples, linked cards, link more
  function panel(f, c, extra) {
    if (!c) return '';
    var ls = links(f.id, c.id), d = c.data || {};
    return '<div class="fw-panel" data-concept="' + esc(c.id) + '"><h3>' + esc(c.name) + '</h3>' + (c.myName ? '<div class="my">' + esc(c.myName) + '</div>' : '') + (c.when ? '<div class="my">' + esc(c.when) + '</div>' : '') +
      (c.summary ? '<p>' + esc(c.summary) + '</p>' : '') + (c.group && f.id !== 'periodic-table' ? '<p style="font-size:12.5px;color:var(--fw-sub)">' + esc(c.group) + '</p>' : '') +
      (d.examples ? '<div>' + d.examples.map(function (x) { return '<span class="fw-mini" style="cursor:default">' + esc(x) + '</span>'; }).join('') + '</div>' : '') + (extra || '') +
      '<div class="fw-k" style="margin-top:12px">Linked from My World</div>' + (ls.length ? '<div class="fw-links">' + ls.map(function (r) { return linkRow(r, '', c.id); }).join('') + '</div>' : '') +
      '<button type="button" class="fw-mini" data-link="' + esc(c.id) + '">' + ICON.plus + ' Link existing cards</button>' + suggestHtml(f, c, ls) + '</div>';
  }
  // cards whose names mention the concept (or its examples): one tap links them
  function suggestHtml(f, c, ls) {
    var words = [c.name].concat((c.data && c.data.examples) || []).concat(c.myName ? [c.myName] : []).map(function (w) { return String(w).toLowerCase().replace(/^my\s+/, '').replace(/[^a-z0-9 ]/g, ' ').trim(); }).filter(function (w) { return w.length >= 4; });
    if (!words.length) return '';
    var have = {}; ls.forEach(function (r) { have[r.id] = 1; });
    var hits = everything().filter(function (x) { if (have[x.id]) return false; var t = x.title.toLowerCase(); return words.some(function (w) { return t.indexOf(w) >= 0 || (w.split(' ').length === 1 && t.split(/\W+/).indexOf(w.replace(/s$/, '')) >= 0); }); }).slice(0, 5);
    if (!hits.length) return '';
    return '<div class="fw-k">Maybe from your lists</div>' + hits.map(function (x) { return '<button type="button" class="fw-mini" data-quick="' + esc(c.id + '|' + x.bid + '|' + x.id) + '">＋ ' + esc(x.title) + '</button>'; }).join('');
  }

  // ================================================================== structures
  function structure(f, p) {
    var t = f.structureType;
    if (f.id === 'periodic-table') return periodic(f, p);
    if (t === 'hierarchy') return hierarchy(f, p);
    if (t === 'network') return network(f, p);
    if (t === 'matrix') return matrixGeneric(f, p);
    if (t === 'nested') return nested(f, p);
    if (t === 'cycle') return cycle(f, p);
    if (t === 'timeline') return timeline(f, p);
    if (t === 'levels') return levels(f, p);
    return dimensions(f, p);
  }
  // ---- hierarchy: fold / unfold, search the structure, link cards to any node
  function hierarchy(f, p) {
    var q = String(ui.tq || '').toLowerCase(), cs = f.concepts, kids = {}, hit = {};
    cs.forEach(function (c) { (kids[c.parent || ''] = kids[c.parent || ''] || []).push(c); });
    if (q) cs.forEach(function (c) { if ((c.name + ' ' + (c.myName || '') + ' ' + (c.summary || '')).toLowerCase().indexOf(q) >= 0) { hit[c.id] = 1; var x = c; while (x && x.parent) { ui.open2[x.parent] = 1; x = conceptOf(f, x.parent); } } });
    function node(c) {
      var ks = kids[c.id] || [], op = !!ui.open2[c.id], n = links(f.id, c.id).length, sel = ui.sel === c.id;
      return '<div class="fw-node' + (op ? ' open' : '') + (hit[c.id] ? ' hit' : '') + '"><button type="button" class="fw-nh" data-node="' + esc(c.id) + '"><span class="tw">' + (ks.length ? '▸' : '•') + '</span><span class="nm">' + esc(c.name) + (c.myName ? '<small>' + esc(c.myName) + '</small>' : '') + '</span>' +
        (ks.length ? '<em>' + ks.length + '</em>' : '') + (n ? '<em>🔗' + n + '</em>' : '') + '</button>' + (sel ? panel(f, c) : '') + (ks.length && op ? '<div class="fw-kids">' + ks.map(node).join('') + '</div>' : '') + '</div>';
    }
    p.innerHTML = '<label class="fw-search">' + ICON.search + '<input data-tq placeholder="Search this structure" autocomplete="off" value="' + esc(ui.tq || '') + '"></label>' +
      '<div style="margin:-2px 0 8px"><button type="button" class="fw-mini" data-all="1">Expand all</button><button type="button" class="fw-mini" data-all="0">Collapse all</button>' +
      ((f.relatedTemplates || []).length ? '<button type="button" class="fw-mini" data-tpl="' + esc(f.relatedTemplates[0]) + '">' + (f.id === 'britannica-propaedia' ? 'Create My Knowledge Template' : 'Use as a world template') + '</button>' : '') + '</div>' +
      '<div class="fw-tree">' + (kids[''] || []).map(node).join('') + '</div>';
  }
  // ---- network: one idea in the middle, its neighbours around; the whole index below
  function network(f, p) {
    var cs = f.concepts, rel = f.relationships || [], nb = {};
    rel.forEach(function (r) { (nb[r.from] = nb[r.from] || []).push(r.to); (nb[r.to] = nb[r.to] || []).push(r.from); });
    var focus = ui.focus && conceptOf(f, ui.focus) ? ui.focus : cs.slice().sort(function (a, b) { return (nb[b.id] || []).length - (nb[a.id] || []).length; })[0].id;
    ui.focus = focus;
    var c = conceptOf(f, focus), around = (nb[focus] || []).filter(function (x, i, a) { return a.indexOf(x) === i; }).slice(0, 10), groups = [];
    cs.forEach(function (x) { if (x.group && groups.indexOf(x.group) < 0) groups.push(x.group); });
    var PALG = ['#5e9cff', '#9b5de5', '#f08c3a', '#30b45a', '#e8566c', '#00a6a6', '#c9a227', '#e774bb'], gc = function (g) { return PALG[Math.max(0, groups.indexOf(g)) % PALG.length]; };
    var W = 100, H = 82, lines = '', btns = '<button type="button" class="ce" style="left:50%;top:50%;background:' + gc(c.group) + '" data-focus="' + esc(c.id) + '">' + esc(c.name) + '</button>';
    around.forEach(function (id, i) {
      var a = -Math.PI / 2 + i * 2 * Math.PI / around.length, x = 50 + 37 * Math.cos(a), y = 50 + 38 * Math.sin(a), o = conceptOf(f, id);
      lines += '<line x1="50" y1="50" x2="' + x.toFixed(1) + '" y2="' + y.toFixed(1) + '" stroke="' + gc(o.group) + '" stroke-opacity=".5" stroke-width=".5"/>';
      btns += '<button type="button" style="left:' + x.toFixed(1) + '%;top:' + y.toFixed(1) + '%;border-color:' + gc(o.group) + '" data-focus="' + esc(id) + '">' + esc(o.name) + '</button>';
    });
    var q = String(ui.tq || '').toLowerCase();
    p.innerHTML = '<div class="fw-net"><svg viewBox="0 0 100 100" preserveAspectRatio="none">' + lines + '</svg>' + btns + '</div>' +
      '<div style="margin:6px 2px 0">' + groups.map(function (g) { return '<span class="fw-gl"><i style="background:' + gc(g) + '"></i>' + esc(g) + '</span>'; }).join('') + '</div>' +
      panel(f, c, around.length ? '<p style="font-size:13px;color:var(--fw-sub)">Connected to ' + around.length + ' idea' + (around.length === 1 ? '' : 's') + ' — tap one to move there.</p>' : '') + relatedKinds(f, c) +
      '<div class="fw-k">All ' + cs.length + ' ' + (f.id === 'syntopicon' ? 'great ideas' : 'concepts') + '</div><label class="fw-search">' + ICON.search + '<input data-tq placeholder="Find an idea" autocomplete="off" value="' + esc(ui.tq || '') + '"></label>' +
      '<div class="fw-idx">' + cs.filter(function (x) { return !q || x.name.toLowerCase().indexOf(q) >= 0; }).map(function (x) { return '<button type="button"' + (x.id === focus ? ' class="on"' : '') + ' data-focus="' + esc(x.id) + '">' + esc(x.name) + '</button>'; }).join('') + '</div>';
  }
  // Syntopicon: what is linked, sorted the way the spec asks (books · people · notes · other)
  function relatedKinds(f, c) {
    if (f.id !== 'syntopicon') return '';
    var ls = links(f.id, c.id); if (!ls.length) return '';
    var K = [['Related Books', /book|read|novel|library/i], ['Related People', /people|person|thinker|author|artist|hero|friend|scientist/i], ['Related Notes', /note|idea|thought|question|journal/i]], used = {}, h = '';
    K.forEach(function (k) { var xs = ls.filter(function (r) { return !used[r.id] && k[1].test(r.list || ''); }); xs.forEach(function (r) { used[r.id] = 1; }); if (xs.length) h += '<div class="fw-k">' + k[0] + '</div><div class="fw-links">' + xs.map(function (r) { return linkRow(r, '', c.id); }).join('') + '</div>'; });
    return h;
  }
  // ---- matrix (periodic table): the classic layout, colour by category, element detail, add to My World
  var ECOL = { 'Alkali metal': '#ff8a80', 'Alkaline earth metal': '#ffcc80', 'Transition metal': '#ffe082', 'Post-transition metal': '#b0bec5', 'Metalloid': '#a5d6a7', 'Reactive nonmetal': '#80deea', 'Halogen': '#81d4fa',
    'Noble gas': '#ce93d8', 'Lanthanide': '#f48fb1', 'Actinide': '#ef9a9a', 'Unknown properties': '#cfd8dc' };
  function periodic(f, p) {
    var cs = f.concepts, cat = ui.cat || '', sel = ui.sel && conceptOf(f, ui.sel), cells = '';
    cs.forEach(function (c) { var d = c.data; cells += '<button type="button" class="fw-el' + (cat && c.group !== cat ? ' dim' : '') + (sel && sel.id === c.id ? ' sel' : '') + '" style="grid-row:' + c.row + ';grid-column:' + c.col + ';background:' + ECOL[c.group] + '" data-sel="' + c.id + '" title="' + esc(c.name) + '"><small>' + d.number + '</small>' + esc(d.symbol) + '</button>'; });
    cells += '<span class="fw-el ph" style="grid-row:6;grid-column:3">57–71</span><span class="fw-el ph" style="grid-row:7;grid-column:3">89–103</span>';
    var det = '';
    if (sel) { var d = sel.data; det = panel(f, sel, '<div class="fw-big"><span class="sy" style="background:' + ECOL[sel.group] + '"><small>' + d.number + '</small>' + esc(d.symbol) + '</span><div><div style="font-size:14px">' + esc(sel.group) + '</div><div style="font-size:13px;color:var(--fw-sub)">Period ' + d.period + (d.group ? ' · Group ' + d.group : '') + ' · ' + d.block + '-block</div></div></div>' +
      '<div style="margin-top:8px"><button type="button" class="fw-go" data-addk="' + sel.id + '">Add to My Knowledge</button></div>'); }
    p.innerHTML = '<div class="fw-chips"><button type="button" class="fw-chip' + (!cat ? ' on' : '') + '" data-cat="">All</button>' + Object.keys(ECOL).map(function (k) { return '<button type="button" class="fw-chip' + (cat === k ? ' on' : '') + '" data-cat="' + esc(k) + '" style="border-color:' + ECOL[k] + '">' + esc(k) + '</button>'; }).join('') + '</div>' +
      '<div class="fw-mx"><div class="fw-mxg">' + cells + '</div></div>' + (det || '<p class="fw-note">Tap an element to see it. Rows are periods, columns are groups; the two lower rows are the lanthanides and actinides.</p>');
  }
  function matrixGeneric(f, p) { var sel = ui.sel && conceptOf(f, ui.sel); p.innerHTML = '<div class="fw-dm">' + f.concepts.map(function (c) { return '<button type="button" class="fw-dmi' + (sel && sel.id === c.id ? ' sel' : '') + '" data-sel="' + esc(c.id) + '"><b>' + esc(c.name) + '</b></button>'; }).join('') + '</div>' + (sel ? panel(f, sel) : ''); }
  // ---- nested systems (Bronfenbrenner): rings you can tap, from Me outwards
  function nested(f, p) {
    var rings = f.concepts.slice().sort(function (a, b) { return a.order - b.order; }), sel = conceptOf(f, ui.sel || rings[1].id) || rings[0], n = rings.length;
    var PAL = ['#ff9f0a', '#30b45a', '#5e9cff', '#9b5de5', '#e8566c', '#8590a2'], svg = '';
    for (var i = n - 1; i >= 0; i--) {
      var r = 7 + i * (37 / (n - 1)), c = rings[i], col = PAL[i % PAL.length], on = sel.id === c.id, chrono = c.id === 'chrono';
      svg += '<g class="rg' + (on ? ' sel' : '') + '" data-sel="' + c.id + '"><circle cx="50" cy="50" r="' + r.toFixed(1) + '" fill="' + col + '" fill-opacity="' + (on ? .55 : .2) + '" stroke="' + col + '" stroke-width="' + (on ? 1.2 : .5) + '"' + (chrono ? ' stroke-dasharray="2 1.5"' : '') + '/>' +
        '<text x="50" y="' + (i === 0 ? 51.5 : (50 - r + 4.2).toFixed(1)) + '" text-anchor="middle" font-size="' + (i === 0 ? 4.4 : 3.3) + '" font-weight="700" fill="currentColor">' + esc(i === 0 ? (c.myName || c.name) : c.name.replace('system', '')) + '</text></g>';
    }
     svg += '<path d="M8 98h84" stroke="#8590a2" stroke-width=".6" marker-end="url(#fwar)"/><text x="50" y="103" text-anchor="middle" font-size="3" fill="currentColor" opacity=".7">time (Chronosystem)</text>';
    p.innerHTML = '<div class="fw-nest"><svg viewBox="0 0 100 105"><defs><marker id="fwar" markerWidth="4" markerHeight="4" refX="3" refY="2" orient="auto"><path d="M0 0 4 2 0 4z" fill="#8590a2"/></marker></defs>' + svg + '</svg></div>' +
      '<div class="fw-chips" style="justify-content:center;flex-wrap:wrap;margin:6px 0">' + rings.map(function (c) { return '<button type="button" class="fw-chip' + (sel.id === c.id ? ' on' : '') + '" data-sel="' + c.id + '">' + esc(c.myName || c.name) + '</button>'; }).join('') + '</div>' + panel(f, sel);
  }
  // ---- cycle: the steps round a circle; sessions where the framework is a thinking tool (OODA, Design Thinking, GTD…)
  function cycle(f, p) {
    var steps = f.concepts.slice().sort(function (a, b) { return a.order - b.order; }), n = steps.length, sel = ui.sel && conceptOf(f, ui.sel), canSes = f.reference || (f.recommendedViews || []).indexOf('session') >= 0;
    if (ui.ses) return sessionForm(f, p, steps);
    var btns = '', arcs = '';
    steps.forEach(function (c, i) { var a = -Math.PI / 2 + i * 2 * Math.PI / n, x = 50 + 36 * Math.cos(a), y = 50 + 36 * Math.sin(a);
      btns += '<button type="button" class="' + (sel && sel.id === c.id ? 'sel' : '') + '" style="left:' + x.toFixed(1) + '%;top:' + y.toFixed(1) + '%" data-sel="' + esc(c.id) + '">' + esc(c.name) + (c.myName ? '<small>' + esc(c.myName) + '</small>' : '') + '</button>'; });
    arcs = '<circle cx="50" cy="50" r="36" stroke="var(--c)" stroke-opacity=".45" stroke-width="1.2" fill="none" stroke-dasharray="3 2"/>';
    var ss = canSes ? sessions(f.id) : [];
    p.innerHTML = '<div class="fw-cyc"><svg viewBox="0 0 100 100">' + arcs + '<text x="50" y="52" text-anchor="middle" font-size="5" fill="currentColor" opacity=".55">↻</text></svg>' + btns + '</div>' + (sel ? panel(f, sel) : '') +
      (canSes ? '<div class="fw-k">My ' + (f.id === 'ooda' ? 'decisions' : 'sessions') + '</div><button type="button" class="fw-go" data-newses>' + ICON.plus + ' New ' + (f.id === 'ooda' ? 'decision' : 'session') + '</button>' +
        (ss.length ? ss.map(function (s) { var done = steps.filter(function (c) { return (s.steps || {})[c.id]; }).length; return '<button type="button" class="fw-ses" data-ses="' + esc(s.id) + '"><div><b>' + esc(s.title || 'Untitled') + '</b><small>' + esc(day(s.updatedAt || s.at)) + ' · ' + done + '/' + n + ' steps</small></div>' + ICON.chev + '</button>'; }).join('') : '<p class="fw-p" style="color:var(--fw-sub);font-size:14px;margin-top:8px">Your history will be kept here.</p>') : '');
  }
  function sessionForm(f, p, steps) {
    var s = ui.ses === 'new' ? { id: null, title: '', steps: {} } : (KN().get('fx:ses:' + ui.ses) || { steps: {} });
    p.innerHTML = '<div class="fw-k">What is it about?</div><input class="fw-in" data-sf="title" maxlength="90" placeholder="e.g. Which club to join this term" value="' + esc(s.title || '') + '">' +
      steps.map(function (c) { return '<div class="fw-k">' + esc(c.name) + (c.myName ? ' · ' + esc(c.myName) : '') + '</div><textarea class="fw-ta" data-sf="' + esc(c.id) + '" placeholder="' + esc(c.summary || '') + '">' + esc((s.steps || {})[c.id] || '') + '</textarea>'; }).join('') +
      '<div style="margin-top:12px"><button type="button" class="fw-go" data-sessave>Save</button><button type="button" class="fw-go sec" data-sescancel>Cancel</button>' + (s.id ? '<button type="button" class="fw-go sec" data-sesdel style="color:#ff6b6b">Delete</button>' : '') + '</div>' +
      (s.id && s.history && s.history.length ? '<div class="fw-k">Earlier versions</div>' + s.history.slice().reverse().map(function (h) { return '<div class="fw-note">' + esc(day(h.at)) + ' — ' + esc(steps.map(function (c) { return (h.steps || {})[c.id] ? c.name + ': ' + h.steps[c.id] : ''; }).filter(Boolean).join(' · ').slice(0, 220)) + '</div>'; }).join('') : '');
  }
  function saveSession() {
    var f = BY[ui.fw], s = ui.ses === 'new' ? { id: rid(), fw: f.id, at: Date.now(), steps: {} } : JSON.parse(JSON.stringify(KN().get('fx:ses:' + ui.ses) || {}));
    var next = {}; ui.body.querySelectorAll('[data-sf]').forEach(function (e) { var k = e.getAttribute('data-sf'); if (k !== 'title') next[k] = String(e.value || '').trim().slice(0, 4000); });
    var title = String((ui.body.querySelector('[data-sf="title"]') || {}).value || '').trim().slice(0, 90);
    if (!title && !Object.keys(next).some(function (k) { return next[k]; })) return toast('Write something first.');
    if (s.steps && Object.keys(s.steps).length && JSON.stringify(s.steps) !== JSON.stringify(next)) s.history = (s.history || []).concat([{ at: s.updatedAt || s.at, steps: s.steps }]).slice(-12);   // keep what it said before
    s.steps = next; s.title = title || 'Untitled'; s.updatedAt = Date.now();
    KN().set('fx:ses:' + s.id, s, true); ui.ses = null; toast('Saved'); drawPane();
  }
  // ---- timeline
  function timeline(f, p) {
    var sel = ui.sel && conceptOf(f, ui.sel), cs = f.concepts.slice().sort(function (a, b) { return (a.order || 0) - (b.order || 0); }), lastG = null;
    p.innerHTML = '<div class="fw-tl">' + cs.map(function (c) { var g = c.group && c.group !== lastG ? '<div class="fw-k" style="margin:10px 0 6px -20px">' + esc(c.group) + '</div>' : ''; lastG = c.group;
      return g + '<div class="fw-ti" data-sel="' + esc(c.id) + '">' + (c.when ? '<small>' + esc(c.when) + '</small>' : '') + '<b>' + esc(c.name) + '</b>' + (c.summary ? '<p>' + esc(c.summary) + '</p>' : '') + (sel && sel.id === c.id ? panel(f, c) : '') + '</div>'; }).join('') + '</div>';
  }
  // ---- levels: bottom to top (the first level at the base)
  function levels(f, p) {
    var cs = f.concepts.slice().sort(function (a, b) { return a.order - b.order; }), n = cs.length, sel = ui.sel && conceptOf(f, ui.sel), base = getComputedStyle(ui.el).getPropertyValue('--c') || '#5e9cff';
    p.innerHTML = '<p class="fw-note">Read from the bottom up: ' + esc(cs[0].name) + ' → ' + esc(cs[n - 1].name) + '.</p><div class="fw-lv">' + cs.map(function (c, i) {
      var w = 100 - (i * (55 / Math.max(1, n - 1)));
      return '<button type="button" class="fw-lvi" style="width:' + w.toFixed(0) + '%;background:color-mix(in srgb,var(--c) ' + (45 + i * (50 / n)).toFixed(0) + '%,#222)' + (sel && sel.id === c.id ? ';outline:2px solid var(--fw-ink)' : '') + '" data-sel="' + esc(c.id) + '">' + (i + 1) + ' · ' + esc(c.name) + (c.myName ? '<small>' + esc(c.myName) + '</small>' : '') + '</button>'; }).join('') + '</div>' + (sel ? panel(f, sel) : '');
  }
  // ---- dimensions: tiles; for well-being style frameworks a private, optional check-in with history
  function dimensions(f, p) {
    var cs = f.concepts.slice().sort(function (a, b) { return (a.order || 0) - (b.order || 0); }), sel = ui.sel && conceptOf(f, ui.sel), canSes = (f.recommendedViews || []).indexOf('session') >= 0;
    if (ui.ses) return checkin(f, p, cs);
    var ss = canSes ? sessions(f.id) : [], last = ss[0], prev = ss[1], groups = [];
    cs.forEach(function (c) { if (groups.indexOf(c.group || '') < 0) groups.push(c.group || ''); });
    var h = groups.map(function (g) { return (g ? '<div class="fw-k">' + esc(g) + '</div>' : '') + '<div class="fw-dm">' + cs.filter(function (c) { return (c.group || '') === g; }).map(function (c) {
      var r = last && last.ratings && last.ratings[c.id];
      return '<button type="button" class="fw-dmi' + (sel && sel.id === c.id ? ' sel' : '') + '" data-sel="' + esc(c.id) + '">' + (links(f.id, c.id).length ? '<span class="rt">🔗' + links(f.id, c.id).length + '</span>' : '') + '<b>' + esc(c.name) + '</b>' + (c.myName ? '<small>' + esc(c.myName) + '</small>' : '') +
        (r ? '<span class="dots">' + [1, 2, 3, 4, 5].map(function (k) { return '<i' + (k <= r ? ' class="on"' : '') + '></i>'; }).join('') + '</span>' : '') + '</button>'; }).join('') + '</div>'; }).join('');
    if (sel) h += panel(f, sel, compareLine(sel, last, prev));
    if (canSes) {
      h += '<div class="fw-k">My check-ins</div><p class="fw-note">Optional and private. Notice how each area feels — nothing is scored, judged or diagnosed.</p><button type="button" class="fw-go" data-newses>' + ICON.plus + ' New check-in</button>';
      h += ss.map(function (s) { var n = Object.keys(s.ratings || {}).length; return '<button type="button" class="fw-ses" data-ses="' + esc(s.id) + '"><div><b>' + esc(day(s.at)) + '</b><small>' + n + ' area' + (n === 1 ? '' : 's') + (s.notes && Object.keys(s.notes).some(function (k) { return s.notes[k]; }) ? ' · with notes' : '') + '</small></div>' + ICON.chev + '</button>'; }).join('');
      if (last && prev) h += '<div class="fw-k">Since ' + esc(day(prev.at)) + '</div><div class="fw-panel">' + cs.map(function (c) { return compareLine(c, last, prev, true); }).filter(Boolean).join('') + '</div>';
    }
    p.innerHTML = h;
  }
  function compareLine(c, last, prev, named) {
    var a = last && last.ratings && last.ratings[c.id], b = prev && prev.ratings && prev.ratings[c.id]; if (!a || !b) return '';
    var d = a - b; return '<div class="fw-cmp">' + (named ? '<b>' + esc(c.name) + '</b> ' : 'Compared with last time: ') + (d > 0 ? '<span class="up">↑ ' + b + ' → ' + a + '</span>' : d < 0 ? '<span class="dn">↓ ' + b + ' → ' + a + '</span>' : '= ' + a) + '</div>';
  }
  function checkin(f, p, cs) {
    var s = ui.ses === 'new' ? { ratings: {}, notes: {} } : (KN().get('fx:ses:' + ui.ses) || { ratings: {}, notes: {} });
    ui.draft = ui.draft || JSON.parse(JSON.stringify({ ratings: s.ratings || {}, notes: s.notes || {} }));
    var dr = ui.draft;
    p.innerHTML = '<p class="fw-note">Skip any area. 1 = not going well for me right now · 5 = going really well. Only you see this.</p>' + cs.filter(function (c) { return !/^capital-/.test(c.id); }).map(function (c) {
      return '<div class="fw-panel" style="padding:12px;margin:8px 0"><b>' + esc(c.name) + '</b>' + (c.myName ? ' <span style="color:var(--c);font-size:13px;font-weight:650">' + esc(c.myName) + '</span>' : '') +
        '<div class="fw-rate">' + [1, 2, 3, 4, 5].map(function (k) { return '<button type="button" data-rate="' + esc(c.id) + '|' + k + '"' + (dr.ratings[c.id] === k ? ' class="on"' : '') + '>' + k + '</button>'; }).join('') + '</div>' +
        '<input class="fw-in" data-rnote="' + esc(c.id) + '" placeholder="A note (optional)" value="' + esc(dr.notes[c.id] || '') + '"></div>'; }).join('') +
      '<div style="margin-top:12px"><button type="button" class="fw-go" data-cisave>Save check-in</button><button type="button" class="fw-go sec" data-sescancel>Cancel</button>' + (s.id ? '<button type="button" class="fw-go sec" data-sesdel style="color:#ff6b6b">Delete</button>' : '') + '</div>';
  }
  function saveCheckin() {
    var f = BY[ui.fw], dr = ui.draft || { ratings: {}, notes: {} };
    ui.body.querySelectorAll('[data-rnote]').forEach(function (e) { var v = String(e.value || '').trim(); if (v) dr.notes[e.getAttribute('data-rnote')] = v.slice(0, 600); else delete dr.notes[e.getAttribute('data-rnote')]; });
    if (!Object.keys(dr.ratings).length && !Object.keys(dr.notes).length) return toast('Pick or write something first — or Cancel.');
    var s = ui.ses === 'new' ? { id: rid(), fw: f.id, at: Date.now() } : KN().get('fx:ses:' + ui.ses);
    s = Object.assign({}, s, { ratings: dr.ratings, notes: dr.notes, updatedAt: Date.now() });
    KN().set('fx:ses:' + s.id, s, true); ui.ses = null; ui.draft = null; toast('Check-in saved — private to you'); drawPane();
  }

  // ================================================================== link existing cards (picker)
  function openPick(conceptId) {
    var f = BY[ui.fw], c = conceptOf(f, conceptId); if (!c) return;
    ui.pick = { c: conceptId, q: '' };
    var el = document.createElement('div'); el.className = 'fw-pick';
    el.innerHTML = '<div class="fw-head"><button type="button" class="fw-b" data-pickx aria-label="Done">' + ICON.back + '</button><h2>Link to “' + esc(c.name) + '”</h2></div><div style="padding:0 16px"><label class="fw-search">' + ICON.search + '<input data-pq placeholder="Search your cards and lists" autocomplete="off"></label></div><div class="ls"></div>';
    ui.el.appendChild(el); ui.pickEl = el; drawPick();
    setTimeout(function () { var i = el.querySelector('[data-pq]'); if (i) i.focus(); }, 60);
  }
  function drawPick() {
    var f = BY[ui.fw], P = ui.pick, have = {}; links(f.id, P.c).forEach(function (r) { have[r.id] = 1; });
    var q = P.q.toLowerCase(), xs = everything().filter(function (x) { return !q || (x.title + ' ' + x.list + ' ' + x.board).toLowerCase().indexOf(q) >= 0; });
    xs.sort(function (a, b) { return (have[b.id] ? 1 : 0) - (have[a.id] ? 1 : 0); });
    ui.pickEl.querySelector('.ls').innerHTML = xs.slice(0, 120).map(function (x) { return '<button type="button" class="fw-pi' + (have[x.id] ? ' on' : '') + '" data-pi="' + esc(x.bid + '|' + x.id) + '"><div><b>' + esc(x.title) + '</b><small>' + esc(x.list + ' · ' + x.board) + '</small></div><i>' + (have[x.id] ? '✓' : '') + '</i></button>'; }).join('') +
      (xs.length > 120 ? '<p class="fw-empty">Showing 120 — search to narrow.</p>' : '') + (!xs.length ? '<p class="fw-empty">Nothing found.</p>' : '');
  }
  function togglePick(bid, id) {
    var f = BY[ui.fw], P = ui.pick, ls = links(f.id, P.c), k = ls.findIndex(function (r) { return r.id === id; });
    if (k >= 0) ls.splice(k, 1); else { var x = everything().filter(function (e) { return e.id === id && e.bid === bid; })[0]; if (x) ls.push({ bid: bid, id: id, title: x.title, list: x.list, at: Date.now() }); }
    setLinks(f.id, P.c, ls); drawPick();
  }
  function closePick() { if (ui.pickEl) ui.pickEl.remove(); ui.pickEl = null; ui.pick = null; drawPane(); }

  // ================================================================== clicks
  function onInput(e) {
    var t = e.target;
    if (t.matches('[data-fq]')) { ui.q = t.value; var pos = t.selectionStart; home(); var n = ui.body.querySelector('[data-fq]'); if (n) { n.focus(); try { n.setSelectionRange(pos, pos); } catch (x) {} } return; }
    if (t.matches('[data-tq]')) { ui.tq = t.value; var p2 = t.selectionStart, y = ui.body.scrollTop; drawPane(); ui.body.scrollTop = y; var m = pane().querySelector('[data-tq]'); if (m) { m.focus(); try { m.setSelectionRange(p2, p2); } catch (x) {} } return; }
    if (t.matches('[data-pq]')) { ui.pick.q = t.value; drawPick(); return; }
    if (t.matches('[data-my]')) { clearTimeout(ui.myT); ui.myT = setTimeout(function () { var o = Object.assign({}, mine(ui.fw)); o[t.getAttribute('data-my')] = String(t.value || '').slice(0, 8000); o.at = Date.now(); KN().set('fx:my:' + ui.fw, o, true); }, 350); }
  }
  function onClick(e) {
    var t = e.target, g;
    if (t.closest('[data-x]')) return close();
    if (ui.pick) {
      if (t.closest('[data-pickx]')) return closePick();
      if ((g = t.closest('[data-pi]'))) { var pr = g.getAttribute('data-pi').split('|'); return togglePick(pr[0], pr[1]); }
      return;
    }
    if ((g = t.closest('[data-back]'))) { var bk = g.getAttribute('data-back'); if (bk === 'home') { ui.ses = null; ui.draft = null; return home(); } if (bk === 'myworld') { close(); return; } return home(); }
    if ((g = t.closest('[data-save]'))) { e.stopPropagation(); var sid = g.getAttribute('data-save'), on = !saved(sid); setSaved(sid, on); toast(on ? 'Saved to My Frameworks' : 'Removed from My Frameworks'); var y = ui.body.scrollTop; if (ui.view === 'home') home(); else detail(ui.fw, ui.tab); ui.body.scrollTop = y; return; }
    if ((g = t.closest('[data-open]'))) return detail(g.getAttribute('data-open'), 'overview');
    if ((g = t.closest('[data-col]'))) { ui.col = g.getAttribute('data-col'); ui.homeY = 0; return home(); }
    if ((g = t.closest('[data-tab]'))) { ui.tab = g.getAttribute('data-tab'); ui.ses = null; ui.draft = null; ui.body.querySelectorAll('.fw-tabs [data-tab]').forEach(function (b) { b.classList.toggle('on', b.getAttribute('data-tab') === ui.tab); }); drawPane(); return; }
    if ((g = t.closest('[data-tpl]'))) { var tid = g.getAttribute('data-tpl'); close(); setTimeout(function () { if (window.MinestMyWorld && MinestMyWorld.template) MinestMyWorld.template(tid); }, 200); return; }
    if ((g = t.closest('[data-tool]'))) { var tool = g.getAttribute('data-tool'); close(); setTimeout(function () { if (!window.MinestDiscover) return; MinestDiscover.open(); setTimeout(function () { var b = document.querySelector('.dv [data-philo="' + tool + '"]'); if (b) b.click(); }, 120); }, 200); return; }
    if ((g = t.closest('[data-unlink]'))) { e.stopPropagation(); var u = g.getAttribute('data-unlink').split('|'); setLinks(ui.fw, u[0], links(ui.fw, u[0]).filter(function (r) { return r.id !== u[1]; })); toast('Unlinked — the card itself is unchanged'); var y2 = ui.body.scrollTop; drawPane(); ui.body.scrollTop = y2; return; }
    if ((g = t.closest('[data-ref]'))) { var rr = g.getAttribute('data-ref').split('|'); return openRef({ bid: rr[0], id: rr[1] }); }
    if ((g = t.closest('[data-link]'))) return openPick(g.getAttribute('data-link'));
    if ((g = t.closest('[data-quick]'))) { var qq = g.getAttribute('data-quick').split('|'), x = everything().filter(function (z) { return z.id === qq[2]; })[0]; if (x) { var ls = links(ui.fw, qq[0]); ls.push({ bid: x.bid, id: x.id, title: x.title, list: x.list, at: Date.now() }); setLinks(ui.fw, qq[0], ls); toast('Linked “' + x.title + '”'); } var y3 = ui.body.scrollTop; drawPane(); ui.body.scrollTop = y3; return; }
    // structures
    var y4 = ui.body.scrollTop;
    if ((g = t.closest('[data-node]'))) { var nid = g.getAttribute('data-node'), f = BY[ui.fw], hasKids = f.concepts.some(function (c) { return c.parent === nid; }); if (hasKids) ui.open2[nid] = !ui.open2[nid]; ui.sel = ui.sel === nid && !hasKids ? null : nid; drawPane(); ui.body.scrollTop = y4; return; }
    if ((g = t.closest('[data-all]'))) { var on2 = g.getAttribute('data-all') === '1'; ui.open2 = {}; if (on2) BY[ui.fw].concepts.forEach(function (c) { ui.open2[c.id] = 1; }); drawPane(); return; }
    if ((g = t.closest('[data-focus]'))) { ui.focus = g.getAttribute('data-focus'); drawPane(); var net = pane().querySelector('.fw-net'); if (net && net.getBoundingClientRect().top < 0) net.scrollIntoView({ block: 'start' }); else ui.body.scrollTop = y4; return; }
    if ((g = t.closest('[data-cat]'))) { ui.cat = g.getAttribute('data-cat'); drawPane(); ui.body.scrollTop = y4; return; }
    if ((g = t.closest('[data-sel]'))) { if (t.closest('.fw-panel')) return; var s2 = g.getAttribute('data-sel'); ui.sel = ui.sel === s2 && BY[ui.fw].structureType !== 'nested' ? null : s2; drawPane(); ui.body.scrollTop = y4; var pn = pane().querySelector('.fw-panel'); if (pn && BY[ui.fw].id === 'periodic-table') pn.scrollIntoView({ block: 'nearest', behavior: reduce ? 'auto' : 'smooth' }); return; }
    if ((g = t.closest('[data-addk]'))) { addKnowledge(BY[ui.fw], conceptOf(BY[ui.fw], g.getAttribute('data-addk'))); return; }
    if (t.closest('[data-newses]')) { ui.ses = 'new'; ui.draft = null; drawPane(); ui.body.scrollTop = pane().offsetTop - 10; return; }
    if ((g = t.closest('[data-ses]'))) { ui.ses = g.getAttribute('data-ses'); ui.draft = null; drawPane(); ui.body.scrollTop = pane().offsetTop - 10; return; }
    if (t.closest('[data-sessave]')) return saveSession();
    if (t.closest('[data-cisave]')) return saveCheckin();
    if (t.closest('[data-sescancel]')) { ui.ses = null; ui.draft = null; return drawPane(); }
    if (t.closest('[data-sesdel]')) { var ask = window.MinestKEdit ? MinestKEdit.confirm('Delete this record? It cannot be undone.', 'Delete') : Promise.resolve(confirm('Delete this record?')); ask.then(function (ok) { if (!ok) return; KN().set('fx:ses:' + ui.ses, null, true); ui.ses = null; ui.draft = null; toast('Deleted'); drawPane(); }); return; }
    if ((g = t.closest('[data-rate]'))) { var rp = g.getAttribute('data-rate').split('|'); ui.body.querySelectorAll('[data-rnote]').forEach(function (n) { var v = String(n.value || '').trim(); if (v) ui.draft.notes[n.getAttribute('data-rnote')] = v; }); if (ui.draft.ratings[rp[0]] === +rp[1]) delete ui.draft.ratings[rp[0]]; else ui.draft.ratings[rp[0]] = +rp[1]; drawPane(); ui.body.scrollTop = y4; return; }
  }
  // "Add to My Knowledge": into the My World Inbox (sorted later, like any other thing)
  function addKnowledge(f, c) {
    if (!c) return; var d = c.data || {};
    var text = c.name + (d.symbol ? ' (' + d.symbol + ', ' + d.number + ')' : '') + ' — ' + (c.group || f.name);
    var ws = window.MinestWorld ? MinestWorld.worlds() : []; if (!ws.length || !window.MinestCapture) return toast('Make a world in My World first — then things can go to its Inbox.');
    var wb = (A().board && A().board() && ws.some(function (x) { return x.b.id === A().board().id; })) ? A().board().id : ws[0].b.id, it = MinestCapture.makeItem(text, 'framework');
    it.title = c.name + (d.symbol ? ' (' + d.symbol + ')' : '');
    MinestCapture.organize([{ item: it, to: [] }], wb, 'framework', 'add').then(function (log) {
      var st = log && log.stacks && log.stacks[0]; if (st) { var ls = links(f.id, c.id); ls.push({ bid: st.bid, id: st.id, title: it.title, list: 'My Inbox', at: Date.now() }); setLinks(f.id, c.id, ls); }
      toast('Added to your Inbox — and linked here'); var y = ui.body.scrollTop; drawPane(); ui.body.scrollTop = y;
    });
  }

  function open(o) { o = o || {}; shell(); ui.onClose = o.onClose || null; if (o.id && BY[o.id]) return detail(o.id, o.tab || 'overview'); home(); }
  window.MinestFrameworks = { open: open, close: close, isOpen: function () { return ui.open; }, list: function () { return ALL.slice(); }, get: function (id) { return BY[id] || null; },
    saved: savedIds, links: allLinks, _detail: detail, _home: home };
})();

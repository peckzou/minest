/* Minest Knowledge · My World — UI V2 prototype (window.MinestMyWorld)
   Visual First, List Always Available. Four pages on top of what already works — nothing here owns data:
     My World home      — header (search, settings), + Add and Discover, Apple Photos-style world cards (cover, title,
                          a few keywords, real item count, +N new), Recent Changes below
     Template gallery   — visual cards with My-first names, one line, "inspired by", grouped
     Structure preview  — cover, depth (Simple / Standard / Complete), areas → categories → lists to switch off, where
                          (new world or an existing one), real counts, Use This Template
     Welcome            — Your World Is Ready: real counts, Start Adding, Explore My World
   Reuses: MinestWorld (templates, plan, generate, art), MinestStarter (home, quick add, install), MinestBuilder
   (customize, open in the chosen view), MinestCapture (Add, recent changes, +N), MinestDiscover. Covers: the user's own
   upload ('wa:<board>'), else a picture from the world's own items, else the template's drawn cover — never third-party images. */
(function () {
  if (window.MinestMyWorld) return;
  var A = function () { return window.MinestAI || {}; };
  var KN = function () { return window.MinestKnowledge; };
  var W = function () { return window.MinestWorld; };
  function esc(s) { return String(s == null ? '' : s).replace(/[&<>"]/g, function (c) { return { '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;' }[c]; }); }
  function toast(m) { try { if (window.GlassUI && GlassUI.toast) GlassUI.toast(m); } catch (e) {} }
  function hap(t) { try { if (window.MinestNative && MinestNative.haptic) MinestNative.haptic(t || 'selection'); } catch (e) {} }
  function boards() { try { return (A().boards && A().boards()) || []; } catch (e) { return []; } }
  function boardById(id) { return boards().filter(function (b) { return b.id === id; })[0] || null; }
  function tpls() { return W() ? W().templates() : []; }
  function tplById(id) { return tpls().filter(function (t) { return t.id === id; })[0] || null; }
  var reduce = false; try { reduce = matchMedia('(prefers-reduced-motion: reduce)').matches; } catch (e) {}
  function ago(t) { var s = (Date.now() - t) / 1000; return s < 60 ? 'just now' : s < 3600 ? Math.round(s / 60) + ' min ago' : s < 86400 ? Math.round(s / 3600) + ' h ago' : Math.round(s / 86400) + ' d ago'; }

  // ================================================================== what the pages show (all read from the real data)
  // the My-first names and sources shown in the gallery (the template files keep their own names)
  var NAMES = { 'my-life': ['My Modern Life', 'modern everyday life'], britannica: ['My Knowledge Atlas', 'Encyclopaedia Britannica’s Propædia'], 'whole-earth': ['My Whole Earth', 'the Whole Earth Catalog'],
    dewey: ['My Library Shelves', 'the Dewey Decimal Classification'], encyclopedie: ['My Tree of Knowledge', 'Diderot & d’Alembert’s Encyclopédie'], bacon: ['My Three Faculties', 'Francis Bacon'],
    'my-museum': ['My Museum', 'the halls of a museum'], 'my-academic-skills': ['My Academic Skills', 'IXL-style skill lists · CCSS · NGSS'], 'my-life-skills': ['My Life & Future Skills', 'P21 · OECD Learning Compass'] };
  function nameOf(t) { return (NAMES[t.id] || [])[0] || t.name; }
  function sourceOf(t) { return t.philosopher ? 'Inspired by ' + t.philosopher : (NAMES[t.id] || [])[1] ? 'Inspired by ' + NAMES[t.id][1] : t.family === 'everyday' ? 'Everyday starter world' : t.family === 'society' && t.framework && window.__MINEST_FRAMEWORK_NAMES && __MINEST_FRAMEWORK_NAMES[t.framework] ? 'Built on ' + __MINEST_FRAMEWORK_NAMES[t.framework] : t.mine ? 'My template' : ''; }
  var GROUPS = [
    ['Featured', function (t) { return ['my-life', 'britannica', 'whole-earth', 'my-academic-skills', 'my-museum'].indexOf(t.id) >= 0; }],
    ['Everyday Worlds', function (t) { return t.family === 'everyday' && ['my-life', 'whole-earth', 'my-museum'].indexOf(t.id) < 0; }],
    ['Skills', function (t) { return t.id === 'my-life-skills'; }],
    ['Knowledge & Ideas', function (t) { return ['dewey', 'encyclopedie', 'bacon'].indexOf(t.id) >= 0; }],
    ['Life & Society', function (t) { return t.family === 'society'; }],
    ['Philosophical Worlds', function (t) { return t.family === 'advanced-philosophy'; }],
    ['My Templates', function (t) { return !!t.mine; }]
  ];
  function worldInfo(x) {
    var b = x.b, w = x.w || {}, wa = (KN() && KN().get('wa:' + b.id)) || {}, tk = Object.keys(w.templates || {})[0], t = tk ? tplById(tk) : null;
    var lists = 0, items = 0, pic = '';
    (b.columns || []).forEach(function (c) { (c.cards || []).forEach(function (k) { if (!k || KN().isHeading(k.id)) return; lists++; items += (k.stack || []).length; if (!pic) { var hit = (k.stack || []).filter(function (s) { return s.cover && (s.cover.value || s.cover.url); })[0]; if (hit) pic = hit.cover.value || hit.cover.url; } }); });
    var words = (b.columns || []).slice(0, 3).map(function (c) { return String(c.title).replace(/^My\s+/i, ''); }).join(' · ');
    var fresh = window.MinestCapture && MinestCapture.newCount ? MinestCapture.newCount(b.id) : 0;
    return { b: b, t: t, title: b.title, sub: wa.subtitle || words, lists: lists, items: items, cover: wa.cover || pic, color: wa.color || (t && t.color) || '#5e5ce6', fresh: fresh };
  }
  function coverHtml(info, cls) {
    if (info.cover) return '<span class="' + cls + '" style="background-image:url(&quot;' + esc(info.cover) + '&quot;)"></span>';
    var art = ''; try { art = info.t && W()._art ? W()._art(info.t) : ''; } catch (e) {}
    return '<span class="' + cls + ' drawn" style="--c:' + esc(info.color) + '">' + (art || '<svg viewBox="0 0 24 24" width="40" height="40" fill="none" stroke="#fff" stroke-width="1.6"><circle cx="12" cy="12" r="8"/><path d="M4 12h16M12 4c2.5 3 2.5 13 0 16M12 4c-2.5 3-2.5 13 0 16"/></svg>') + '</span>';
  }

  // ================================================================== UI
  var I = function (d) { return '<svg viewBox="0 0 24 24" width="19" height="19" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">' + d + '</svg>'; };
  var ICON = { x: I('<path d="M6 6l12 12M18 6 6 18"/>'), back: I('<path d="m15 6-6 6 6 6"/>'), search: I('<circle cx="11" cy="11" r="6.5"/><path d="m20 20-4.2-4.2"/>'), gear: I('<circle cx="12" cy="12" r="3"/><path d="M19.4 15a1.7 1.7 0 0 0 .3 1.8l.1.1a2 2 0 1 1-2.8 2.8l-.1-.1a1.7 1.7 0 0 0-1.8-.3 1.7 1.7 0 0 0-1 1.5V21a2 2 0 1 1-4 0v-.1a1.7 1.7 0 0 0-1.1-1.5 1.7 1.7 0 0 0-1.8.3l-.1.1a2 2 0 1 1-2.8-2.8l.1-.1a1.7 1.7 0 0 0 .3-1.8 1.7 1.7 0 0 0-1.5-1H3a2 2 0 1 1 0-4h.1a1.7 1.7 0 0 0 1.5-1.1 1.7 1.7 0 0 0-.3-1.8l-.1-.1a2 2 0 1 1 2.8-2.8l.1.1a1.7 1.7 0 0 0 1.8.3H9a1.7 1.7 0 0 0 1-1.5V3a2 2 0 1 1 4 0v.1a1.7 1.7 0 0 0 1 1.5 1.7 1.7 0 0 0 1.8-.3l.1-.1a2 2 0 1 1 2.8 2.8l-.1.1a1.7 1.7 0 0 0-.3 1.8V9a1.7 1.7 0 0 0 1.5 1H21a2 2 0 1 1 0 4h-.1a1.7 1.7 0 0 0-1.5 1z"/>'),
    plus: I('<path d="M12 5v14M5 12h14"/>'), spark: I('<path d="M12 3l1.8 5.2L19 10l-5.2 1.8L12 17l-1.8-5.2L5 10l5.2-1.8z"/>'), more: I('<circle cx="5" cy="12" r="1.6"/><circle cx="12" cy="12" r="1.6"/><circle cx="19" cy="12" r="1.6"/>'), chev: I('<path d="m9 6 6 6-6 6"/>'), check: I('<path d="M5 12.5l4.5 4.5L19 7.5"/>') };
  var CSS = [
    '.mw{position:fixed;inset:0;z-index:2147482004;display:flex;flex-direction:column;color:var(--mw-ink);font:15px/1.4 -apple-system,BlinkMacSystemFont,"SF Pro Text",system-ui,sans-serif;-webkit-font-smoothing:antialiased;background:var(--mw-bg);--mw-ink:#f4f5f8;--mw-sub:rgba(244,245,248,.62);--mw-bg:linear-gradient(180deg,#141821,#0b0d13);--mw-card:rgba(255,255,255,.06);--mw-line:rgba(255,255,255,.1);--mw-fill:rgba(255,255,255,.08);--mw-blue:#0a84ff;--mw-sheet:#1d212c}',
    'html.kn-light .mw{--mw-ink:#15171c;--mw-sub:rgba(21,23,28,.6);--mw-bg:linear-gradient(180deg,#f6f7fa,#eceef3);--mw-card:#fff;--mw-line:rgba(0,0,0,.08);--mw-fill:rgba(0,0,0,.05);--mw-blue:#007aff;--mw-sheet:#fff}',
    '.mw-head{display:flex;align-items:center;gap:8px;padding:calc(env(safe-area-inset-top,0px) + 14px) 16px 4px}',
    '.mw-head .ti{flex:1;min-width:0}.mw-head h1{margin:0;font-size:32px;font-weight:800;letter-spacing:-.8px;line-height:1.05}.mw-head p{margin:3px 0 0;font-size:14px;color:var(--mw-sub)}',
    '.mw-head h2{flex:1;min-width:0;margin:0;font-size:22px;font-weight:800;letter-spacing:-.4px;white-space:nowrap;overflow:hidden;text-overflow:ellipsis}',
    '.mw-b{flex:none;width:38px;height:38px;border-radius:50%;display:grid;place-items:center;padding:0;cursor:pointer;color:inherit;background:var(--mw-fill);border:0}',
    '.mw-body{flex:1;overflow-y:auto;-webkit-overflow-scrolling:touch;padding:8px 16px calc(env(safe-area-inset-bottom,0px) + 110px)}',
    '.mw-foot{position:absolute;left:0;right:0;bottom:0;padding:24px 16px calc(env(safe-area-inset-bottom,0px) + 14px);background:linear-gradient(180deg,transparent,var(--mw-fade,rgba(11,13,19,.97)) 22px);display:flex;gap:10px}',
    'html.kn-light .mw-foot{--mw-fade:rgba(236,238,243,.97)}',
    '.mw-foot{flex-wrap:wrap}.mw-sum{width:100%;text-align:center;font-size:12.5px;color:var(--mw-sub);margin-bottom:-2px}',
    '.mw-go{flex:1;height:52px;border-radius:16px;border:0;background:var(--mw-blue);color:#fff;font:700 16px -apple-system,system-ui,sans-serif;cursor:pointer;display:inline-flex;align-items:center;justify-content:center;gap:6px}.mw-go.sec{background:var(--mw-fill);color:inherit;flex:0 0 auto;padding:0 18px}.mw-go:disabled{opacity:.4}',
    '.mw-actions{display:grid;grid-template-columns:1fr 1fr;gap:10px;margin:10px 0 18px}',
    '.mw-act{height:54px;border-radius:16px;border:0;cursor:pointer;font:700 16px -apple-system,system-ui,sans-serif;display:flex;align-items:center;justify-content:center;gap:8px;color:#fff;background:var(--mw-blue)}.mw-act.d{background:var(--mw-card);color:inherit;box-shadow:inset 0 0 0 1px var(--mw-line)}',
    '.mw-act:active,.mw-wc:active,.mw-tc:active{transform:scale(.98)}',
    '.mw-h{display:flex;align-items:baseline;gap:8px;margin:22px 2px 10px}.mw-h b{font-size:20px;font-weight:800;letter-spacing:-.3px}.mw-h button{margin-left:auto;border:0;background:none;color:var(--mw-blue);font:600 14px -apple-system,system-ui,sans-serif;cursor:pointer}',
    // Apple Photos-style world cards: one cover ratio, title + a few words, real counts
    '.mw-grid{display:grid;grid-template-columns:repeat(2,minmax(0,1fr));gap:16px 12px}',
    '@media (min-width:700px){.mw-grid{grid-template-columns:repeat(3,minmax(0,1fr))}}@media (min-width:1050px){.mw-grid{grid-template-columns:repeat(4,minmax(0,1fr))}}',
    '.mw-wc{position:relative;display:flex;flex-direction:column;gap:6px;text-align:left;padding:0;border:0;background:none;color:inherit;font:inherit;cursor:pointer;transition:transform .15s}',
    '.mw-cv{display:block;aspect-ratio:1/1;border-radius:14px;background-size:cover;background-position:center;background-color:var(--mw-fill);box-shadow:0 1px 0 var(--mw-line) inset}',
    '.mw-cv.drawn{background:radial-gradient(120% 90% at 20% 0%,rgba(255,255,255,.3),rgba(255,255,255,0) 55%),linear-gradient(150deg,color-mix(in srgb,var(--c) 92%,#fff),color-mix(in srgb,var(--c) 55%,#000));display:grid;place-items:center;overflow:hidden}.mw-cv.drawn svg{width:100%;height:100%}',
    '.mw-wc .t{display:flex;align-items:center;gap:6px}.mw-wc .t b{flex:1;min-width:0;font-size:16px;font-weight:700;letter-spacing:-.2px;white-space:nowrap;overflow:hidden;text-overflow:ellipsis}',
    '.mw-wc small{display:block;font-size:13px;color:var(--mw-sub);white-space:nowrap;overflow:hidden;text-overflow:ellipsis;margin-top:-4px}',
    '.mw-new{flex:none;min-width:20px;height:20px;padding:0 6px;border-radius:999px;background:var(--mw-blue);color:#fff;font:700 11.5px -apple-system,system-ui,sans-serif;display:inline-grid;place-items:center}',
    '.mw-more{position:absolute;top:8px;right:8px;width:32px;height:32px;border-radius:50%;border:0;display:grid;place-items:center;color:#fff;background:rgba(0,0,0,.35);-webkit-backdrop-filter:blur(8px);backdrop-filter:blur(8px);cursor:pointer}',
    '.mw-wc.hi .mw-cv{box-shadow:0 0 0 3px var(--mw-blue)}',
    '.mw-empty{text-align:center;padding:30px 10px}.mw-empty svg{display:block;margin:0 auto}.mw-empty b{display:block;font-size:22px;font-weight:800;margin:14px 0 6px}.mw-empty p{color:var(--mw-sub);margin:0 0 18px}',
    '.mw-row{display:flex;align-items:center;gap:12px;width:100%;text-align:left;padding:11px 12px;border-radius:14px;border:0;background:var(--mw-card);color:inherit;font:inherit;cursor:pointer;margin-bottom:6px;box-shadow:inset 0 0 0 1px var(--mw-line)}',
    '.mw-row div{flex:1;min-width:0}.mw-row b{display:block;font-size:14.5px;font-weight:600;white-space:nowrap;overflow:hidden;text-overflow:ellipsis}.mw-row small{display:block;font-size:12.5px;color:var(--mw-sub);white-space:nowrap;overflow:hidden;text-overflow:ellipsis}',
    '.mw-search{display:flex;align-items:center;gap:8px;height:42px;padding:0 12px;border-radius:12px;background:var(--mw-fill);margin:6px 0 10px}.mw-search input{flex:1;min-width:0;border:0;background:none;color:inherit;font:inherit;outline:none}',
    // template gallery
    '.mw-tg{display:grid;grid-template-columns:repeat(2,minmax(0,1fr));gap:16px 12px}@media (min-width:700px){.mw-tg{grid-template-columns:repeat(3,minmax(0,1fr))}}@media (min-width:1050px){.mw-tg{grid-template-columns:repeat(4,minmax(0,1fr))}}',
    '.mw-tc{display:flex;flex-direction:column;gap:5px;text-align:left;padding:0;border:0;background:none;color:inherit;font:inherit;cursor:pointer;transition:transform .15s}',
    '.mw-tc .mw-cv{aspect-ratio:4/3}.mw-tc b{font-size:15.5px;font-weight:700;letter-spacing:-.2px}.mw-tc span{font-size:13px;line-height:1.3;color:var(--mw-sub)}.mw-tc em{font-style:normal;font-size:11.5px;color:var(--mw-sub);opacity:.85}',
    // preview
    '.mw-hero{margin:0 -16px 14px;height:150px}.mw-hero .mw-cv{height:100%;aspect-ratio:auto;border-radius:0}',
    '.mw-ib{margin:0 0 16px;border-radius:18px;background:var(--mw-card);border:1px solid var(--mw-line,rgba(255,255,255,.1));overflow:hidden}',
    '.mw-ibh{display:flex;align-items:center;gap:10px;width:100%;padding:12px 14px 6px;border:0;background:none;color:inherit;font:inherit;cursor:pointer;text-align:left}.mw-ibh .ic{font-size:20px}.mw-ibh b{font-size:16px}.mw-ibh em{margin-left:auto;font-style:normal;font-size:13px;opacity:.6}.mw-ibh svg{opacity:.45;width:16px;height:16px}',
    '.mw-ibf{display:flex;gap:6px;padding:6px 10px 10px}.mw-ibf input{flex:1;min-width:0;height:40px;padding:0 12px;border-radius:12px;border:1px solid var(--mw-line,rgba(255,255,255,.12));background:var(--mw-fill);color:inherit;font:15px -apple-system,system-ui,sans-serif;outline:none}',
    '.mw-ibf button{height:40px;padding:0 12px;border-radius:12px;border:0;cursor:pointer;font:600 14px -apple-system,system-ui,sans-serif;color:inherit;background:var(--mw-fill)}.mw-ibf button.go{background:var(--mw-blue,#0a84ff);color:#fff}',
    '.mw-ibi{margin:10px 0;padding:10px 12px;border-radius:16px;background:var(--mw-card);border:1px solid var(--mw-line,rgba(255,255,255,.1))}',
    '.mw-ibi .r{display:flex;align-items:center;gap:10px}.mw-ibi img,.mw-ibi .nb{flex:none;width:44px;height:44px;border-radius:10px;object-fit:cover;display:grid;place-items:center;background:var(--mw-fill);font-size:18px}',
    '.mw-ibi .tx{flex:1;min-width:0}.mw-ibi b{display:block;font-size:15px;line-height:1.3;overflow:hidden;text-overflow:ellipsis;display:-webkit-box;-webkit-line-clamp:2;-webkit-box-orient:vertical}.mw-ibi small{display:block;font-size:12px;opacity:.55;margin-top:2px;white-space:nowrap;overflow:hidden;text-overflow:ellipsis}',
    '.mw-ibi .sg{display:flex;flex-wrap:wrap;gap:6px;margin-top:9px}.mw-ibi .sg button{height:32px;padding:0 11px;border-radius:999px;border:1px solid var(--mw-line,rgba(255,255,255,.14));background:none;color:inherit;font:500 13px -apple-system,system-ui,sans-serif;cursor:pointer}',
    '.mw-ibi .sg button.top{background:var(--mw-blue,#0a84ff);border-color:transparent;color:#fff;font-weight:650}.mw-ibi .sg button small{opacity:.7;margin-left:5px;font-weight:500}.mw-ibi .sg button.pick{border-style:dashed;opacity:.8}',
    '.mw-ibi .sg button.gh,.mw-row.gh{border-style:dashed}.mw-row.gh{border:1px dashed var(--mw-line,rgba(255,255,255,.2));background:none}',
    '.mw-iball{display:flex;align-items:center;gap:12px;padding:11px 12px;margin-bottom:6px;border-radius:14px;background:var(--mw-card);cursor:pointer}.mw-iball input{width:20px;height:20px;flex:none}.mw-iball b{display:block;font-size:14.5px}.mw-iball small{display:block;font-size:12.5px;opacity:.6}',
    '.mw-portal{display:flex;align-items:center;gap:12px;width:100%;text-align:left;padding:11px 14px;margin:0 0 10px;border-radius:16px;border:1px solid var(--mw-line,rgba(255,255,255,.1));background:var(--mw-card);color:inherit;font:inherit;cursor:pointer}',
    '.mw-portal>span{font-size:22px}.mw-portal div{flex:1;min-width:0}.mw-portal b{display:block;font-size:15px}.mw-portal small{display:block;font-size:12.5px;opacity:.6;margin-top:1px}.mw-portal svg{opacity:.45;width:16px;height:16px}',
    '.mw-seg{display:flex;padding:3px;border-radius:12px;background:var(--mw-fill);margin:6px 0 4px}.mw-seg button{flex:1;height:34px;border:0;border-radius:9px;background:none;color:inherit;font:600 14px -apple-system,system-ui,sans-serif;cursor:pointer}.mw-seg button.on{background:var(--mw-card);box-shadow:0 1px 4px rgba(0,0,0,.15)}',
    '.mw-note{font-size:13px;color:var(--mw-sub);margin:6px 2px}',
    '.mw-area{border-radius:16px;background:var(--mw-card);box-shadow:inset 0 0 0 1px var(--mw-line);margin-bottom:10px;overflow:hidden}',
    '.mw-ar{display:flex;align-items:center;gap:10px;padding:12px;cursor:pointer}.mw-ar .dot{width:12px;height:12px;border-radius:50%;background:var(--c);flex:none}.mw-ar b{flex:1;min-width:0;font-size:16px;font-weight:700}.mw-ar em{font-style:normal;font-size:12.5px;color:var(--mw-sub)}',
    '.mw-ar .cv{color:var(--mw-sub);transition:transform .2s}.mw-area.open .mw-ar .cv{transform:rotate(90deg)}.mw-area.off{opacity:.5}',
    '.mw-in{display:none;padding:0 12px 12px 34px}.mw-area.open .mw-in{display:block}',
    '.mw-cat{padding:8px 0;border-top:1px solid var(--mw-line);display:flex;align-items:flex-start;gap:10px}.mw-cat.off{opacity:.45}.mw-cat .c{flex:1;min-width:0}.mw-cat .c b{font-size:14px;font-weight:650}',
    '.mw-ls{display:flex;flex-wrap:wrap;gap:6px;margin-top:6px}.mw-li{border:0;border-radius:999px;padding:5px 10px;background:var(--mw-fill);color:inherit;font:500 12.5px -apple-system,system-ui,sans-serif;cursor:pointer}.mw-li.off{opacity:.45;text-decoration:line-through}.mw-li.sub{font-size:11.5px;opacity:.8}',
    '.mw-sw{flex:none;width:46px;height:28px;border-radius:999px;border:0;padding:0;cursor:pointer;background:var(--mw-fill);position:relative}.mw-sw:after{content:"";position:absolute;left:3px;top:3px;width:22px;height:22px;border-radius:50%;background:#fff;box-shadow:0 1px 3px rgba(0,0,0,.3);transition:transform .2s}.mw-sw.on{background:#30d158}.mw-sw.on:after{transform:translateX(18px)}',
    '.mw-where{display:flex;gap:8px;overflow-x:auto;scrollbar-width:none;padding-bottom:2px}.mw-where button{flex:none;height:34px;padding:0 12px;border-radius:999px;border:0;background:var(--mw-fill);color:inherit;font:600 13px -apple-system,system-ui,sans-serif;cursor:pointer}.mw-where button.on{background:var(--mw-blue);color:#fff}',
    '.mw-about{margin:10px 0;padding:12px 14px;border-radius:14px;background:var(--mw-card);box-shadow:inset 0 0 0 1px var(--mw-line);font-size:14px}.mw-about summary{cursor:pointer;font-weight:650}.mw-about p{margin:8px 0 0;color:var(--mw-sub);white-space:pre-line}',
    // welcome
    '.mw-ready{text-align:center;padding:16px 0 4px}.mw-ready b{display:block;font-size:30px;font-weight:850;letter-spacing:-.6px}.mw-ready span{color:var(--mw-sub)}',
    '.mw-stats{display:grid;grid-template-columns:repeat(3,1fr);gap:10px;margin:18px 0}.mw-stats div{padding:14px 8px;border-radius:16px;background:var(--mw-card);box-shadow:inset 0 0 0 1px var(--mw-line);text-align:center}.mw-stats b{display:block;font-size:26px;font-weight:800}.mw-stats span{font-size:12.5px;color:var(--mw-sub)}',
    '.mw-dim{position:absolute;inset:0;z-index:8;background:rgba(0,0,0,.35)}',
    '.mw-menu{position:absolute;left:12px;right:12px;bottom:calc(env(safe-area-inset-bottom,0px) + 12px);z-index:9;padding:8px;border-radius:20px;background:var(--mw-sheet);box-shadow:0 20px 50px rgba(0,0,0,.4),inset 0 0 0 1px var(--mw-line)}.mw-menu h4{margin:8px 12px 4px;font-size:13px;font-weight:600;color:var(--mw-sub)}.mw-menu button{display:block;width:100%;text-align:left;padding:13px 12px;border:0;border-radius:12px;background:none;color:inherit;font:inherit;cursor:pointer}.mw-menu button:hover{background:var(--mw-fill)}',
    '@media (min-width:700px){.mw-menu{left:50%;right:auto;width:400px;transform:translateX(-50%)}}',
    '.mw-seg button[data-wmoreviews]{flex:0 0 44px;display:grid;place-items:center}',
    '.mw-lh{margin:10px 8px 4px;font-size:11.5px;font-weight:700;letter-spacing:.06em;text-transform:uppercase;color:var(--mw-sub)}',
    '.mw-l{border-radius:12px}.mw-l.in{margin-left:6px}.mw-lr{display:flex;align-items:center;gap:8px;width:100%;min-height:44px;padding:8px;border:0;background:none;color:inherit;font:inherit;text-align:left;cursor:pointer}',
    '.mw-lr .cv{color:var(--mw-sub);transition:transform .2s;flex:none}.mw-l.open .mw-lr .cv{transform:rotate(90deg)}.mw-lr b{flex:1;min-width:0;font-size:15px;font-weight:600;white-space:nowrap;overflow:hidden;text-overflow:ellipsis}.mw-lr em{font-style:normal;font-size:13px;color:var(--mw-sub)}',
    '.mw-dot{width:8px;height:8px;border-radius:50%;background:var(--mw-blue);flex:none}',
    '.mw-items{padding:0 6px 8px 30px}.mw-it{display:flex;align-items:center;gap:10px;width:100%;min-height:40px;padding:4px 6px;border:0;border-radius:10px;background:none;color:inherit;font:inherit;text-align:left;cursor:pointer}.mw-it:hover{background:var(--mw-fill)}',
    '.mw-it img,.mw-it .nb{width:32px;height:32px;border-radius:7px;object-fit:cover;flex:none;background:var(--mw-fill)}.mw-it span:last-child{flex:1;min-width:0;white-space:nowrap;overflow:hidden;text-overflow:ellipsis}',
    '.mw-la{display:flex;gap:6px;flex-wrap:wrap;margin-top:6px}.mw-la button{height:32px;padding:0 12px;border-radius:999px;border:0;background:var(--mw-fill);color:inherit;font:600 13px -apple-system,system-ui,sans-serif;cursor:pointer;display:inline-flex;align-items:center;gap:4px}.mw-la svg{width:15px;height:15px}',
    '.mw-gal{display:grid;grid-template-columns:repeat(3,minmax(0,1fr));gap:12px 8px}@media (min-width:700px){.mw-gal{grid-template-columns:repeat(4,minmax(0,1fr))}}@media (min-width:1050px){.mw-gal{grid-template-columns:repeat(6,minmax(0,1fr))}}',
    '.mw-gi{position:relative;display:flex;flex-direction:column;gap:3px;padding:0;border:0;background:none;color:inherit;font:inherit;text-align:left;cursor:pointer;min-width:0}',
    '.mw-gi img,.mw-gi .ph{width:100%;aspect-ratio:1;object-fit:cover;border-radius:12px;background:var(--mw-fill)}.mw-gi .ph{display:flex;align-items:flex-end;padding:7px;box-sizing:border-box;color:#fff;font:700 12px/1.15 -apple-system,system-ui,sans-serif;background:linear-gradient(155deg,hsl(var(--h,220) 50% 50%),hsl(calc(var(--h,220) + 50) 55% 28%));overflow:hidden}',
    '.mw-gi b{font-size:12.5px;font-weight:600;white-space:nowrap;overflow:hidden;text-overflow:ellipsis}.mw-gi small{font-size:11.5px;color:var(--mw-sub);white-space:nowrap;overflow:hidden;text-overflow:ellipsis;margin-top:-2px}',
    '.mw-gi .ok{position:absolute;top:6px;right:6px;width:22px;height:22px;border-radius:50%;display:grid;place-items:center;background:#30d158;color:#fff}.mw-gi .ok svg{width:13px;height:13px}',
    '.fl img,.fl .ph,.mw-it.fl{box-shadow:0 0 0 2px var(--mw-blue)}.mw-it.fl{background:color-mix(in srgb,var(--mw-blue) 12%,transparent)}',
    '@media (prefers-reduced-motion: reduce){.mw-act,.mw-wc,.mw-tc,.mw-sw:after{transition:none}}'
  ].join('\n');
  function css() { if (document.getElementById('mw-css')) return; var s = document.createElement('style'); s.id = 'mw-css'; s.textContent = CSS; document.head.appendChild(s); }

  var ui = { open: false, scroll: {} };
  function shell() {
    if (ui.open) return; css(); if (KN() && KN().applyLook) KN().applyLook();
    var el = document.createElement('div'); el.className = 'mw'; el.setAttribute('role', 'dialog'); el.setAttribute('aria-label', 'My World');
    el.innerHTML = '<div class="mw-head"></div><div class="mw-body"></div><div class="mw-foot" hidden></div><input type="file" accept="image/*" hidden>';
    ['pointerdown', 'touchstart', 'touchmove', 'wheel', 'keydown'].forEach(function (ev) { el.addEventListener(ev, function (e) { e.stopPropagation(); }, { passive: ev !== 'keydown' }); });
    ui.el = el; ui.head = el.querySelector('.mw-head'); ui.body = el.querySelector('.mw-body'); ui.foot = el.querySelector('.mw-foot'); ui.file = el.querySelector('input[type=file]'); ui.open = true;
    document.body.appendChild(el); document.documentElement.classList.add('kn-open');
    if (el.animate && !reduce) el.animate([{ opacity: 0, transform: 'scale(.985)' }, { opacity: 1, transform: 'none' }], { duration: 260, easing: 'cubic-bezier(.2,.85,.25,1)' });
    el.addEventListener('click', onClick);
    el.addEventListener('input', function (e) { if (e.target.matches('[data-q]')) { ui.q = e.target.value; drawResults(); } if (e.target.matches('[data-wq]')) { ui.ws.q = e.target.value; stSave(ui.wb, ui.ws); var pos = e.target.selectionStart; drawWorld(true); var f = ui.body.querySelector('[data-wq]'); if (f) { f.focus(); try { f.setSelectionRange(pos, pos); } catch (x) {} } } });
    el.addEventListener('keydown', function (e) { if (e.key === 'Escape') { if (ui.menu) closeMenu(); else if (ui.view === 'home') close(); else home(); } });
    ui.file.addEventListener('change', function () { var f = ui.file.files && ui.file.files[0]; ui.file.value = ''; if (!f || !ui.coverFor) return; var bid = ui.coverFor; shrink(f, 1200, function (d) { if (!d) return toast('This picture could not be read.'); KN().set('wa:' + bid, Object.assign({}, KN().get('wa:' + bid) || {}, { cover: d, at: Date.now() })); toast('Cover changed'); home(); }); });
  }
  function shrink(f, max, cb) { var rd = new FileReader(); rd.onload = function () { var im = new Image(); im.onload = function () { var k = Math.min(1, max / Math.max(im.naturalWidth, im.naturalHeight)); try { var c = document.createElement('canvas'); c.width = Math.round(im.naturalWidth * k); c.height = Math.round(im.naturalHeight * k); c.getContext('2d').drawImage(im, 0, 0, c.width, c.height); cb(c.toDataURL('image/jpeg', .82)); } catch (e) { cb(null); } }; im.onerror = function () { cb(null); }; im.src = rd.result; }; rd.readAsDataURL(f); }
  function close() { if (!ui.open) return; keepScroll(); var el = ui.el; ui.open = false; ui.el = null; ui.menu = null; if (!document.querySelector('.lw,.sk,.wk,.pk,.wc,.dv,.st,.bd')) document.documentElement.classList.remove('kn-open'); if (el.animate && !reduce) { var an = el.animate([{ opacity: 1 }, { opacity: 0 }], { duration: 160, fill: 'forwards' }); an.onfinish = function () { el.remove(); }; } else el.remove(); }
  function keepScroll() { if (ui.view && ui.body) ui.scroll[ui.view] = ui.body.scrollTop; if (ui.view === 'world') saveWorldState(); }
  function go(view, fn) { keepScroll(); closeMenu(); ui.view = view; ui.foot.hidden = true; ui.foot.innerHTML = ''; fn(); }
  function headSmall(title, back) { ui.head.innerHTML = (back ? '<button type="button" class="mw-b" data-back="' + esc(back) + '" aria-label="Back">' + ICON.back + '</button>' : '') + '<h2>' + esc(title) + '</h2><button type="button" class="mw-b" data-x aria-label="Close">' + ICON.x + '</button>'; }
  function foot(h) { ui.foot.hidden = !h; ui.foot.innerHTML = h || ''; }
  function closeMenu() { if (ui.menu) { ui.menu.remove(); ui.menu = null; } if (ui.dim) { ui.dim.remove(); ui.dim = null; } }
  function menu(title, items) { closeMenu(); var m = document.createElement('div'); m.className = 'mw-menu'; m.innerHTML = '<h4>' + esc(title) + '</h4>' + items.map(function (x, i) { return '<button type="button" data-mi="' + i + '">' + esc(x[0]) + '</button>'; }).join('') + '<button type="button" data-mx>Cancel</button>'; var d = document.createElement('div'); d.className = 'mw-dim'; ui.el.appendChild(d); ui.dim = d; ui.el.appendChild(m); ui.menu = m; ui.menuItems = items; if (m.animate && !reduce) m.animate([{ opacity: 0, translate: '0 16px' }, { opacity: 1, translate: '0 0' }], { duration: 200, easing: 'cubic-bezier(.2,.85,.25,1)' }); }

  // ---------------------------------------------------------------- 1 · My World home
  function home(o) {
    shell(); go('home', function () {
      ui.head.innerHTML = '<div class="ti"><h1>My World</h1><p>A little universe of mine.</p></div><button type="button" class="mw-b" data-search aria-label="Search">' + ICON.search + '</button><button type="button" class="mw-b" data-settings aria-label="Settings">' + ICON.gear + '</button><button type="button" class="mw-b" data-x aria-label="Close">' + ICON.x + '</button>';
      var ws = (W() ? W().worlds() : []).map(worldInfo);
      var h = '<div class="mw-actions"><button type="button" class="mw-act" data-add>' + ICON.plus + 'Add</button><button type="button" class="mw-act d" data-discover>' + ICON.spark + 'Discover</button></div>';
      if (ws.length && window.MinestCapture) { var ibn = inboxItems().length;
        h += '<div class="mw-ib"><button type="button" class="mw-ibh" data-inbox><span class="ic">📥</span><b>Inbox</b><em>' + (ibn ? ibn + ' to sort' : 'all sorted') + '</em>' + ICON.chev + '</button>' + dropHtml() + '</div>'; }
      if (window.MinestFrameworks) h += '<button type="button" class="mw-portal" data-frameworks><span>🧭</span><div><b>Frameworks</b><small>How I understand · ' + MinestFrameworks.list().length + ' ways of seeing the world' + (MinestFrameworks.saved().length ? ' · ' + MinestFrameworks.saved().length + ' saved' : '') + '</small></div>' + ICON.chev + '</button>';
      if (!ws.length) h += '<div class="mw-empty"><svg viewBox="0 0 24 24" width="64" height="64" fill="none" stroke="currentColor" stroke-width="1.2" opacity=".5"><circle cx="12" cy="12" r="9"/><path d="M3 12h18M12 3c3 3.2 3 14.8 0 18M12 3c-3 3.2-3 14.8 0 18"/></svg><b>Build your world</b><p>Start from a template — you can change everything later.</p><button type="button" class="mw-go" style="width:100%" data-gallery>Choose My World</button></div>';
      else {
        h += '<div class="mw-h"><b>My Worlds</b><button type="button" data-gallery>＋ New World</button></div><div class="mw-grid">' + ws.map(function (x) {
          return '<div class="mw-wc' + (o && o.highlight === x.b.id ? ' hi' : '') + '" role="button" tabindex="0" data-world="' + esc(x.b.id) + '">' + coverHtml(x, 'mw-cv') + '<button type="button" class="mw-more" data-wmore="' + esc(x.b.id) + '" aria-label="World options">' + ICON.more + '</button>' +
            '<span class="t"><b>' + esc(x.title) + '</b>' + (x.fresh ? '<i class="mw-new">+' + x.fresh + '</i>' : '') + '</span><small>' + esc(x.sub) + '</small><small>' + x.items + ' item' + (x.items === 1 ? '' : 's') + ' · ' + x.lists + ' list' + (x.lists === 1 ? '' : 's') + '</small></div>';
        }).join('') + '</div>';
      }
      var logs = window.MinestCapture && MinestCapture.logs ? MinestCapture.logs().filter(function (l) { return !l.undone; }).slice(0, 4) : [];
      if (logs.length) h += '<div class="mw-h"><b>Recent Changes</b><button type="button" data-recent>See all</button></div>' + logs.map(function (l) { var n = (l.items || []).length, to = Object.keys(l.lists || {}).length; return '<button type="button" class="mw-row" data-log="' + esc(l.id) + '"><div><b>' + esc(l.kind === 'organize' ? l.note : n === 1 ? l.items[0].title : n + ' items added') + '</b><small>' + esc(ago(l.at) + (to ? ' · into ' + to + ' list' + (to === 1 ? '' : 's') : '')) + '</small></div>' + ICON.chev + '</button>'; }).join('');
      ui.body.innerHTML = h; ui.body.scrollTop = (o && o.top) ? 0 : (ui.scroll.home || 0);
      if (o && o.highlight) setTimeout(function () { var c = ui.body.querySelector('[data-world="' + o.highlight + '"]'); if (c) c.scrollIntoView({ block: 'center', behavior: reduce ? 'auto' : 'smooth' }); }, 60);
    });
  }
  function openWorldCard(bid) {
    hap('selection'); close();
    setTimeout(function () { if (window.MinestBuilder && MinestBuilder.openIn) MinestBuilder.openIn(bid); else if (window.MinestStarter && MinestStarter.has(bid)) MinestStarter.home(bid); else if (W()._openWorld) W()._openWorld(bid); }, 180);
  }
  // search across worlds: worlds, lists and items
  function search() {
    go('search', function () { headSmall('Search', 'home'); ui.body.innerHTML = '<label class="mw-search">' + ICON.search + '<input data-q placeholder="Worlds, lists, things…" autocomplete="off" value="' + esc(ui.q || '') + '"></label><div data-resbox></div>'; drawResults(); setTimeout(function () { var f = ui.body.querySelector('[data-q]'); if (f) f.focus(); }, 60); });
  }
  function drawResults() {
    var box = ui.body.querySelector('[data-resbox]'); if (!box) return; var q = String(ui.q || '').toLowerCase().trim(); if (!q) { box.innerHTML = '<p class="mw-note">Type to search everything in your worlds.</p>'; return; }
    var out = []; (W() ? W().worlds() : []).forEach(function (x) { var b = x.b; if (b.title.toLowerCase().indexOf(q) >= 0) out.push({ k: 'w', b: b, t: b.title, s: 'World' }); (b.columns || []).forEach(function (c) { (c.cards || []).forEach(function (k) { if (KN().isHeading(k.id)) return; if (k.title.toLowerCase().indexOf(q) >= 0) out.push({ k: 'l', b: b, c: c, card: k, t: k.title, s: 'List · ' + c.title + ' · ' + b.title }); (k.stack || []).forEach(function (s) { if (String(s.title + ' ' + (s.desc || '')).toLowerCase().indexOf(q) >= 0) out.push({ k: 'i', b: b, c: c, card: k, t: s.title, s: k.title + ' · ' + b.title }); }); }); }); });
    ui.res = out.slice(0, 60);
    box.innerHTML = ui.res.map(function (r, i) { return '<button type="button" class="mw-row" data-res="' + i + '"><div><b>' + esc(r.t) + '</b><small>' + esc(r.s) + '</small></div>' + ICON.chev + '</button>'; }).join('') || '<p class="mw-note">Nothing found.</p>';
  }
  function settings() {
    var cur = KN() && KN().look ? KN().look() : 'auto';
    go('settings', function () {
      headSmall('Settings', 'home');
      ui.body.innerHTML = '<div class="mw-h"><b>Appearance</b></div><div class="mw-seg">' + [['auto', 'Auto'], ['light', 'Light'], ['dark', 'Dark']].map(function (x) { return '<button type="button" data-look="' + x[0] + '"' + (cur === x[0] ? ' class="on"' : '') + '>' + x[1] + '</button>'; }).join('') + '</div>' +
        '<div class="mw-h"><b>Build</b></div>' +
        '<button type="button" class="mw-row" data-gallery><div><b>Choose My World</b><small>Template gallery</small></div>' + ICON.chev + '</button>' +
        (window.MinestBuilder ? '<button type="button" class="mw-row" data-mix><div><b>Mix &amp; Match</b><small>Areas and lists from several templates</small></div>' + ICON.chev + '</button><button type="button" class="mw-row" data-scratch><div><b>Start from Scratch</b><small>A blank world</small></div>' + ICON.chev + '</button>' : '') +
        '<button type="button" class="mw-row" data-classic><div><b>Classic template list</b><small>The earlier List of Mine screen</small></div>' + ICON.chev + '</button>';
    });
  }

  // ---------------------------------------------------------------- 2 · template gallery
  function gallery() {
    shell(); go('gallery', function () {
      headSmall('Choose My World', 'home');
      var ts = tpls().filter(function (t) { return !t.hidden && t.domains; }), used = {};
      ui.body.innerHTML = '<p class="mw-note" style="margin:0 2px 6px">Each world is a starting point. Look inside first — you can switch off anything and change it all later.</p>' +
        GROUPS.map(function (g) { var xs = ts.filter(function (t) { return !used[t.id] && g[1](t); }); xs.forEach(function (t) { used[t.id] = 1; }); if (!xs.length) return '';
          return '<div class="mw-h"><b>' + esc(g[0]) + '</b></div><div class="mw-tg">' + xs.map(function (t) { var info = { t: t, color: t.color || '#5e5ce6', cover: '' };
            return '<button type="button" class="mw-tc" data-tpl="' + esc(t.id) + '">' + coverHtml(info, 'mw-cv') + '<b>' + esc(nameOf(t)) + '</b><span>' + esc(t.tagline || t.description || '') + '</span>' + (sourceOf(t) ? '<em>' + esc(sourceOf(t)) + '</em>' : '') + '</button>'; }).join('') + '</div>'; }).join('');
      ui.body.scrollTop = ui.scroll.gallery || 0;
    });
  }

  // ---------------------------------------------------------------- 3 · structure preview
  function depthsOf(t) {
    var flat = t.domains.every(function (d) { return d.lists && !d.categories; });
    var hasSub = t.domains.some(function (d) { return (d.categories || [{ lists: d.lists || [] }]).some(function (c) { return (c.lists || []).some(function (l) { return (l.lists || []).length; }); }); });
    if (t.depths && t.depths.length) return t.depths.slice();
    return flat ? (hasSub ? ['standard', 'complete'] : ['standard']) : (hasSub ? ['simple', 'standard', 'complete'] : ['simple', 'standard']);
  }
  function preview(t) {
    ui.pv = { t: t, off: {}, keep: {}, start: 'grow', open: {}, depth: t.defaultDepth && depthsOf(t).indexOf(t.defaultDepth) >= 0 ? t.defaultDepth : (depthsOf(t).indexOf('standard') >= 0 ? 'standard' : depthsOf(t)[0]), into: null };
    if (t.groups) (t.domains || []).forEach(function (d) { if ((t.defaultGroups || []).length && t.defaultGroups.indexOf(d.group) < 0) ui.pv.off[d.id] = 1; });   // e.g. skills: only the default grade on
    go('preview', drawPreview);
  }
  function autoOff(t) {   // Start small: every list after the first in each part (and all sub-lists) waits
    var o = {};
    t.domains.forEach(function (d) { (d.lists && !d.categories ? [{ id: d.id, lists: d.lists }] : (d.categories || [])).forEach(function (g) { (g.lists || []).forEach(function (l, i) { var lk = 'l:' + g.id + '/' + l.id; if (i) o[lk] = 1; (l.lists || []).forEach(function (x) { o[lk + '/' + x.id] = 1; }); }); }); });
    return o;
  }
  function effOff() { var P = ui.pv; if (P.start !== 'grow') return P.off; var o = autoOff(P.t); Object.keys(P.keep).forEach(function (k) { delete o[k]; }); return Object.assign(o, P.off); }
  function effDepth() { var P = ui.pv, ds = depthsOf(P.t); return P.start === 'grow' ? (ds.indexOf('standard') >= 0 ? 'standard' : ds[0]) : P.depth; }
  function counts() {
    var P = ui.pv, t = P.t, bid = P.into || 'preview', p = W().plan(t, bid, { off: effOff(), depth: effDepth() }), have = {}, n = { areas: 0, cats: 0, lists: 0 };
    var b = P.into ? boardById(P.into) : null; if (b) (b.columns || []).forEach(function (c) { have[c.id] = 1; (c.cards || []).forEach(function (k) { have[k.id] = 1; }); });
    p.lists.forEach(function (L) { if (!have[L.id]) n.areas++; L.items.forEach(function (H) { if (!H.flat && !have[H.id]) { if (H.asCard) n.lists++; else n.cats++; } H.lists.forEach(function (x) { if (!have[x.id]) n.lists++; }); }); });
    return n;
  }
  function drawPreview() {
    var P = ui.pv, t = P.t, ds = depthsOf(t), OFF = effOff(), DEP = effDepth(), DT = { simple: ['Simple', 'Main categories only.'], standard: ['Standard', 'The everyday lists of each category.'], complete: ['Complete', 'The full tree, with the detailed sub-lists.'] };
    headSmall(nameOf(t), 'gallery');
    var ws = W().worlds(), n = counts(), total = n.areas + n.cats + n.lists;
    ui.body.innerHTML = '<div class="mw-hero">' + coverHtml({ t: t, color: t.color || '#5e5ce6', cover: '' }, 'mw-cv') + '</div>' +
      '<p style="margin:0 2px 4px;font-size:16px">' + esc(t.description || t.tagline || '') + '</p>' + (sourceOf(t) ? '<p class="mw-note" style="margin-top:0">' + esc(sourceOf(t)) + '</p>' : '') +
      (t.inspiration || (t.philosophy && t.philosophy.original) ? '<details class="mw-about"><summary>About this template</summary><p>' + esc(t.philosophy ? t.philosophy.original + '\n\n' + t.philosophy.adaptation : t.inspiration) + '</p></details>' : '') +
      '<div class="mw-h"><b>How to start</b></div><div class="mw-seg"><button type="button" data-startmode="grow"' + (P.start === 'grow' ? ' class="on"' : '') + '>🌱 Start small</button><button type="button" data-startmode="whole"' + (P.start === 'grow' ? '' : ' class="on"') + '>🌍 The whole world</button></div>' +
      '<p class="mw-note">' + (P.start === 'grow' ? 'A first list in each part. The rest waits in the Portal’s “Grow next” — add it when you need it.' : 'Everything at once — see the whole map and switch off what you don’t need.') + '</p>' +
      (ds.length > 1 && P.start !== 'grow' ? '<div class="mw-h"><b>How much</b></div><div class="mw-seg">' + ds.map(function (d) { return '<button type="button" data-depth="' + d + '"' + (P.depth === d ? ' class="on"' : '') + '>' + DT[d][0] + '</button>'; }).join('') + '</div><p class="mw-note">' + DT[P.depth][1] + ' You can always add more later.</p>' : '') +
      (ws.length ? '<div class="mw-h"><b>Where</b></div><div class="mw-where"><button type="button" data-into=""' + (P.into ? '' : ' class="on"') + '>A new world</button>' + ws.map(function (x) { return '<button type="button" data-into="' + esc(x.b.id) + '"' + (P.into === x.b.id ? ' class="on"' : '') + '>Add to ' + esc(x.b.title) + '</button>'; }).join('') + '</div>' + (P.into ? '<p class="mw-note">Only what is missing is added. Areas with a name you already have are kept separate — nothing you made is changed or merged.</p>' : '') : '') +
      '<div class="mw-h"><b>Inside</b></div>' + t.domains.map(function (d, i) {
        var dOff = !!OFF[d.id], groups = d.lists && !d.categories ? [{ id: d.id, title: null, lists: d.lists }] : (d.categories || []);
        var nl = groups.reduce(function (a, g) { return a + (g.lists || []).length; }, 0);
        return '<div class="mw-area' + (dOff ? ' off' : '') + (P.open[d.id] ? ' open' : '') + '" style="--c:' + esc(d.color || '#888') + '"><div class="mw-ar" data-open="' + esc(d.id) + '"><span class="cv">' + ICON.chev + '</span><span class="dot"></span><b>' + esc(d.title) + '</b><em>' + nl + ' list' + (nl === 1 ? '' : 's') + '</em><button type="button" class="mw-sw' + (dOff ? '' : ' on') + '" data-off="' + esc(d.id) + '" aria-label="Include ' + esc(d.title) + '"></button></div><div class="mw-in">' +
          groups.map(function (g) { var cOff = dOff || (g.title && !!OFF[g.id]);
            var ls = DEP === 'simple' && g.title ? '' : '<div class="mw-ls">' + (g.lists || []).map(function (l) { var lk = 'l:' + g.id + '/' + l.id, lOff = cOff || !!OFF[lk]; return '<button type="button" class="mw-li' + (lOff ? ' off' : '') + '" data-off="' + esc(lk) + '"' + (cOff ? ' disabled' : '') + '>' + esc(l.title) + '</button>' + (DEP === 'complete' ? (l.lists || []).map(function (x) { return '<button type="button" class="mw-li sub' + (lOff || OFF[lk + '/' + x.id] ? ' off' : '') + '" data-off="' + esc(lk + '/' + x.id) + '"' + (lOff ? ' disabled' : '') + '>↳ ' + esc(x.title) + '</button>'; }).join('') : ''); }).join('') + '</div>';
            return '<div class="mw-cat' + (cOff ? ' off' : '') + '"><div class="c">' + (g.title ? '<b>' + esc(g.title) + '</b>' : '') + ls + '</div>' + (g.title ? '<button type="button" class="mw-sw' + (cOff ? '' : ' on') + '" data-off="' + esc(g.id) + '"' + (dOff ? ' disabled' : '') + ' aria-label="Include ' + esc(g.title) + '"></button>' : '') + '</div>';
          }).join('') + '</div></div>';
      }).join('');
    foot('<div class="mw-sum">' + (total ? (P.into ? 'Adds ' : 'Creates ') + n.areas + ' area' + (n.areas === 1 ? '' : 's') + (n.cats ? ' · ' + n.cats + ' categor' + (n.cats === 1 ? 'y' : 'ies') : '') + ' · ' + n.lists + ' list' + (n.lists === 1 ? '' : 's') + ' — empty until you add your things' : 'Everything here is already in that world') + '</div><button type="button" class="mw-go" data-use' + (total ? '' : ' disabled') + '>' + (P.into ? (total ? 'Add ' + total + ' to my world' : 'Nothing new to add') : 'Use This Template') + '</button>');
    ui.foot.insertAdjacentHTML('afterbegin', '');
  }
  function use() {
    var P = ui.pv, t = P.t, btn = ui.foot.querySelector('[data-use]'); if (btn) btn.disabled = true;
    var n = counts(), r;
    try { r = W().generate(t, { off: effOff(), depth: effDepth() }, P.into || undefined); if (!P.into && KN()) KN().set('wa:' + r.bid, Object.assign({}, KN().get('wa:' + r.bid) || {}, { portal: P.start === 'grow' ? 'grow' : 'whole' }), true); } catch (e) { toast('✗ ' + e.message); if (btn) btn.disabled = false; return; }
    var t0 = Date.now();
    (function wait() { if (boardById(r.bid) || Date.now() - t0 > 3000) { var done = t.starterPack && window.MinestStarter ? MinestStarter.install(r.bid, t) : Promise.resolve(); done.then(function () { hap('success'); welcome(r.bid, n, !r.isNew); }); } else setTimeout(wait, 80); })();
  }

  // ---------------------------------------------------------------- 4 · welcome
  function welcome(bid, made, added) {
    shell(); ui.newBid = bid;
    go('welcome', function () {
      var b = boardById(bid), info = worldInfo({ b: b, w: KN().get('lom:world:' + bid) }), ws = W().worlds().length;
      ui.head.innerHTML = '<div class="ti"></div><button type="button" class="mw-b" data-x aria-label="Close">' + ICON.x + '</button>';
      ui.body.innerHTML = '<div style="max-width:420px;margin:0 auto"><div class="mw-wc" style="pointer-events:none;width:min(62vw,240px);margin:6px auto 0">' + coverHtml(info, 'mw-cv') + '</div>' +
        '<div class="mw-ready"><b>' + (added ? 'Added to Your World.' : 'Your World Is Ready.') + '</b><span>' + esc(b.title) + '</span></div>' +
        '<div class="mw-stats"><div><b>' + ws + '</b><span>World' + (ws === 1 ? '' : 's') + '</span></div><div><b>' + info.lists + '</b><span>Lists</span></div><div><b>' + info.items + '</b><span>Items</span></div></div>' +
        '<p class="mw-note" style="text-align:center">Your lists are empty until you add your own things — that’s where it starts.</p></div>';
      foot('<button type="button" class="mw-go sec" data-explore>' + (window.MinestWiki ? 'Open the Portal' : 'Explore My World') + '</button><button type="button" class="mw-go" data-start>Start Adding</button>');
    });
  }

  // ---------------------------------------------------------------- 5 · inside a world: List ↔ Gallery ↔ Kanban (one set of items)
  // per world, kept on this device: the view, open lists, the area filter, the search and each view's scroll
  var SKEY = 'minest.myworld.v1';
  function stAll() { try { return JSON.parse(localStorage.getItem(SKEY) || '{}'); } catch (e) { return {}; } }
  function st(bid) { var a = stAll(); return Object.assign({ view: 'list', open: {}, area: '', q: '', scroll: {} }, a[bid] || {}); }
  function stSave(bid, s) { try { var a = stAll(); a[bid] = s; localStorage.setItem(SKEY, JSON.stringify(a)); } catch (e) {} }
  function itemsOfList(k) { return (k.stack || []); }
  function picOf(s) { return s && s.cover && (s.cover.value || s.cover.url) || ''; }
  function isNewList(cid) { var w = KN() && KN().get('wn:' + cid); return w ? (w.n || 0) + (w.isNew && !w.n ? 1 : 0) : 0; }
  function worldView(bid, o) {
    o = o || {}; var b = boardById(bid); if (!b) return home();
    shell(); var S = st(bid); if (o.view) S.view = o.view; if (o.open) o.open.forEach(function (c) { S.open[c] = 1; }); if (o.area != null) S.area = o.area;
    ui.wb = bid; ui.ws = S; ui.flash = o.flash || {};
    if (o.open && KN()) { var seen = {}; o.open.forEach(function (c) { if (KN().get('wn:' + c)) seen['wn:' + c] = null; }); if (Object.keys(seen).length) KN().setMany(seen); }   // landing on new items = they are seen
    go('world', function () { drawWorld(o.keepScroll === false); });
  }
  function drawWorld(top) {
    var bid = ui.wb, S = ui.ws, b = boardById(bid); if (!b) return home();
    var info = worldInfo({ b: b, w: KN().get('lom:world:' + bid) });
    ui.head.innerHTML = '<button type="button" class="mw-b" data-back="home" aria-label="My World">' + ICON.back + '</button><h2>' + esc(b.title) + '</h2><button type="button" class="mw-b" data-wadd aria-label="Add">' + ICON.plus + '</button><button type="button" class="mw-b" data-x aria-label="Close">' + ICON.x + '</button>';
    var more = [['contents', 'Contents', window.MinestContents], ['portal', 'Portal', window.MinestWiki], ['timeline', 'Timeline', window.MinestTimeline], ['map', 'Map', window.MinestMap], ['learnmap', 'Learning Map', window.MinestLearnMap]].filter(function (x) { return x[2]; });
    var q = String(S.q || '').toLowerCase(), area = S.area;
    var gm = ((KN().get('wa:' + bid) || {}).portal) || 'grow', gn = 0; try { gn = W().ghosts ? W().ghosts(bid).length : 0; } catch (x) {}
    var h = (window.MinestWiki ? '<button type="button" class="mw-portal" data-wportal><span>' + (gm === 'grow' ? '🌱' : '🌍') + '</span><div><b>Portal</b><small>The guide to this world · ' + (gm === 'grow' ? 'Grow' : 'Whole World') + (gn ? ' · ' + gn + ' more to grow' : '') + '</small></div>' + ICON.chev + '</button>' : '') +
      '<div class="mw-seg" style="margin:2px 0 10px">' + [['list', 'List'], ['gallery', 'Gallery'], ['kanban', 'Kanban']].map(function (v) { return '<button type="button" data-wview="' + v[0] + '"' + (S.view === v[0] ? ' class="on"' : '') + '>' + v[1] + '</button>'; }).join('') + (more.length ? '<button type="button" data-wmoreviews aria-label="More views">' + ICON.more + '</button>' : '') + '</div>' +
      '<label class="mw-search" style="margin-top:0">' + ICON.search + '<input data-wq placeholder="Search in ' + esc(b.title) + '" autocomplete="off" value="' + esc(S.q || '') + '"></label>' +
      '<div class="mw-where" style="margin-bottom:10px"><button type="button" data-warea=""' + (!area ? ' class="on"' : '') + '>All</button>' + (b.columns || []).map(function (c) { return '<button type="button" data-warea="' + esc(c.id) + '"' + (area === c.id ? ' class="on"' : '') + '>' + esc(c.title) + '</button>'; }).join('') + '</div>';
    var cols = (b.columns || []).filter(function (c) { return !area || c.id === area; });
    var match = function (s) { return !q || String(s.title + ' ' + (s.desc || '')).toLowerCase().indexOf(q) >= 0; };
    if (S.view === 'gallery') {
      var all = []; cols.forEach(function (c) { (c.cards || []).forEach(function (k) { if (KN().isHeading(k.id)) return; itemsOfList(k).forEach(function (s) { if (match(s) || (q && k.title.toLowerCase().indexOf(q) >= 0)) all.push({ s: s, k: k, c: c }); }); }); });
      h += all.length ? '<div class="mw-gal">' + all.map(function (x) { var p = picOf(x.s), done = (x.s.mastery || 0) >= 4 || x.s.complete;
        return '<button type="button" class="mw-gi' + (ui.flash[x.s.id] ? ' fl' : '') + '" data-witem="' + esc(x.s.id) + '">' + (p ? '<img loading="lazy" alt="" src="' + esc(p) + '" onerror="this.replaceWith(Object.assign(document.createElement(\'span\'),{className:\'ph\',textContent:\'' + esc(x.s.title).replace(/'/g, '') + '\'}))">' : '<span class="ph" style="--h:' + (hashOf(x.s.title) % 360) + '">' + esc(x.s.title) + '</span>') + (done ? '<i class="ok" title="Done">' + ICON.check + '</i>' : '') + '<b>' + esc(x.s.title) + '</b><small>' + esc(x.k.title) + '</small></button>'; }).join('') + '</div>'
        : '<div class="mw-empty" style="padding:20px 0"><p>' + (q ? 'Nothing matches “' + esc(S.q) + '”.' : 'No items yet — they will show here as pictures.') + '</p></div>';
    } else {
      h += cols.map(function (c) {
        var rows = '', inHead = false, any = false;
        (c.cards || []).forEach(function (k) {
          if (KN().isHeading(k.id)) { rows += '<div class="mw-lh">' + esc(k.title) + '</div>'; inHead = true; return; }
          var its = itemsOfList(k).filter(match); if (q && !its.length && k.title.toLowerCase().indexOf(q) < 0) return; any = true;
          var open = !!S.open[k.id] || (q && its.length), nw = isNewList(k.id);
          rows += '<div class="mw-l' + (open ? ' open' : '') + (inHead ? ' in' : '') + '"><button type="button" class="mw-lr" data-wlist="' + esc(k.id) + '"><span class="cv">' + ICON.chev + '</span><b>' + esc(k.title) + '</b>' + (nw ? '<i class="mw-dot" title="New"></i>' : '') + '<em>' + itemsOfList(k).length + '</em></button>' +
            (open ? '<div class="mw-items">' + (its.length ? its.map(function (s) { var p = picOf(s); return '<button type="button" class="mw-it' + (ui.flash[s.id] ? ' fl' : '') + '" data-witem="' + esc(s.id) + '">' + (p ? '<img loading="lazy" alt="" src="' + esc(p) + '">' : '<span class="nb"></span>') + '<span>' + esc(s.title) + '</span></button>'; }).join('') : '<p class="mw-note" style="margin:4px 4px 8px">Empty for now.</p>') +
              '<div class="mw-la"><button type="button" data-waddto="' + esc(k.id) + '">' + ICON.plus + 'Add</button>' + (window.MinestPicker && MinestPicker.catalogFor && MinestPicker.catalogFor(k.title) ? '<button type="button" data-wpick="' + esc(k.id) + '">Pick</button>' : '') + (window.MinestDiscover && itemsOfList(k).length >= 2 ? '<button type="button" data-wplay="' + esc(k.id) + '">' + ICON.spark + 'Discover</button>' : '') + '</div></div>' : '') + '</div>';
        });
        return any || !q ? '<div class="mw-area" style="--c:' + esc(c.color || '#888') + '"><div class="mw-ar" style="cursor:default"><span class="dot"></span><b>' + esc(c.title) + '</b></div><div style="padding:0 6px 6px">' + (rows || '<p class="mw-note" style="margin:0 8px 8px">No lists yet.</p>') + '</div></div>' : '';
      }).join('') || '<div class="mw-empty" style="padding:20px 0"><p>Nothing matches “' + esc(S.q) + '”.</p></div>';
    }
    ui.body.innerHTML = h;
    ui.body.scrollTop = top ? 0 : ((S.scroll || {})[S.view] || 0);
    var f = Object.keys(ui.flash || {})[0]; if (f) setTimeout(function () { var el = ui.body.querySelector('[data-witem="' + f + '"]'); if (el) el.scrollIntoView({ block: 'center', behavior: reduce ? 'auto' : 'smooth' }); ui.flash = {}; }, 80);
  }
  function hashOf(s) { var h = 0; s = String(s); for (var i = 0; i < s.length; i++) h = (h * 31 + s.charCodeAt(i)) >>> 0; return h; }
  function saveWorldState() { if (!ui.wb || !ui.ws) return; ui.ws.scroll = ui.ws.scroll || {}; if (ui.view === 'world') ui.ws.scroll[ui.ws.view] = ui.body.scrollTop; stSave(ui.wb, ui.ws); }
  function locateItem(b, sid) { var hit = null; (b.columns || []).forEach(function (c) { (c.cards || []).forEach(function (k) { (k.stack || []).forEach(function (s) { if (s.id === sid) hit = { c: c, k: k, s: s }; }); }); }); return hit; }
  // a Recent Changes entry: go to the world and the lists it touched, with the new items lit
  function openLog(l) {
    var lists = Object.keys(l.lists || {}), b = null; boards().forEach(function (x) { (x.columns || []).forEach(function (c) { (c.cards || []).forEach(function (k) { if (lists.indexOf(k.id) >= 0 && !b) b = x; }); }); });
    if (!b) { close(); setTimeout(function () { if (window.MinestCapture) MinestCapture.open(); }, 180); return; }
    var flash = {}; (l.stacks || []).forEach(function (s) { flash[s.id] = 1; });
    worldView(b.id, { view: 'list', open: lists, area: '', flash: flash, keepScroll: false });
  }

  // ================================================================== clicks
  // ================================================================== My World Inbox — collect first, sort later
  // The Inbox is every world's "My Inbox" list (Quick Capture puts anything without a list there). Things wait there
  // until the user files them: a suggestion is only a suggestion; filing = one tap on it (with Undo). The item is not
  // copied — a captured item keeps its one record ('ki:cap:…'), only its link moves; a plain card moves as it is.
  function isInbox(b, k) { return k.id === b.id + '-l-mine-inbox' || /^my inbox$/i.test(String(k.title || '').trim()); }
  function inboxItems() {
    var out = [];
    (W() ? W().worlds() : []).forEach(function (x) { (x.b.columns || []).forEach(function (c) { (c.cards || []).forEach(function (k) { if (isInbox(x.b, k)) (k.stack || []).forEach(function (s) { var key = KN().get('pk:' + s.id), rec = key ? KN().get(key) || {} : {}; out.push({ s: s, k: k, c: c, b: x.b, key: key, rec: rec, at: rec.at || 0 }); }); }); }); });
    return out.sort(function (a, b) { return b.at - a.at; });
  }
  function dropHtml() { return '<div class="mw-ibf"><input data-ibq placeholder="Drop anything — sort it later" autocomplete="off" enterkeyhint="done"><button type="button" class="ph" data-ibphoto aria-label="Add a photo">📷</button><button type="button" class="go" data-ibsave>Save</button></div>'; }
  function dropWorld() { var ws = W().worlds(); if (ui.wb && boardById(ui.wb)) return ui.wb; var a = A().board && A().board(); return a && ws.some(function (x) { return x.b.id === a.id; }) ? a.id : ws[0] && ws[0].b.id; }
  function drop(text, img) {
    var wb = dropWorld(); if (!wb || !window.MinestCapture) return;
    var t = String(text || '').trim(), it = t ? MinestCapture.makeItem(t, 'inbox') : { id: Date.now().toString(36) + Math.random().toString(36).slice(2, 6), text: '', title: 'Photo', type: 'image', src: 'inbox', at: Date.now() };
    if (!it) return; if (img) { it.img = img; if (!t) it.type = 'image'; }
    MinestCapture.organize([{ item: it, to: [] }], wb, 'inbox', 'add').then(function () { hap('success'); toast('In your Inbox — sort it any time'); if (ui.view === 'home') home(); else if (ui.view === 'inbox') inbox(); });
  }
  function photo() {
    var f = document.createElement('input'); f.type = 'file'; f.accept = 'image/*';
    f.onchange = function () { var file = f.files && f.files[0]; if (!file) return; var rd = new FileReader(); rd.onload = function () { var im = new Image(); im.onload = function () { var k = Math.min(1, 900 / Math.max(im.naturalWidth, im.naturalHeight)), c = document.createElement('canvas'); c.width = Math.round(im.naturalWidth * k); c.height = Math.round(im.naturalHeight * k); c.getContext('2d').drawImage(im, 0, 0, c.width, c.height); var q = ui.body.querySelector('[data-ibq]'); drop(q ? q.value : '', c.toDataURL('image/jpeg', .82)); if (q) q.value = ''; }; im.src = rd.result; }; rd.readAsDataURL(file); };
    f.click();
  }
  // lists the world's template still holds (the Portal's "Grow next"): a thing can grow one and go straight in
  function wstem(w) { w = w.toLowerCase(); return w.length > 4 ? w.replace(/(ings?|es|ed|s)$/, '').replace(/e$/, '') : w; }
  var GSTOP = { my: 1, the: 1, and: 1, of: 1, for: 1, with: 1, near: 1, want: 1, try: 1, ideas: 1, things: 1, list: 1, lists: 1 };
  function allGhosts() { var out = []; (W() && W().ghosts ? W().worlds() : []).forEach(function (w) { try { W().ghosts(w.b.id).forEach(function (g) { if (g.kind === 'list' || g.kind === 'sub') out.push(Object.assign({ bid: w.b.id, board: w.b.title }, g)); }); } catch (e) {} }); return out; }
  function ghostSug(text, gs) {
    var ws = {}; (String(text).match(/[a-z]{3,}/gi) || []).forEach(function (w) { if (!GSTOP[w.toLowerCase()]) ws[wstem(w)] = 1; });
    return gs.filter(function (g) { return (String(g.title).match(/[a-z]{3,}/gi) || []).some(function (w) { return !GSTOP[w.toLowerCase()] && ws[wstem(w)]; }); }).slice(0, 2);
  }
  function textOf(x) { return x.s.title + ' ' + (x.rec.text || x.s.desc || '') + ' ' + (x.rec.link || ''); }
  function sugOf(x) { try { var r = MinestCapture.suggest(textOf(x)); return { top: r.top.slice(0, 3), rel: r.rel.slice(0, 2) }; } catch (e) { return { top: [], rel: [] }; } }
  function inbox() {
    shell(); go('inbox', function () {
      headSmall('Inbox', 'home');
      var xs = inboxItems(), many = W().worlds().length > 1, sure = 0, GS = allGhosts();
      var h = '<p class="mw-note" style="margin:0 2px 10px">Collect first, sort later. Tap a suggestion to file a thing — or leave it here.</p>' + dropHtml();
      h += xs.length ? xs.map(function (x) {
        var sg = sugOf(x), gsg = sg.top.length ? [] : ghostSug(textOf(x), GS), pic = x.rec.img || (x.s.cover && (x.s.cover.value || x.s.cover.url)) || '', sub = String(x.rec.text && x.rec.text !== x.s.title ? x.rec.text : x.rec.link || x.s.desc || '').split('\n')[0];
        if (sg.top.length) sure++;
        return '<div class="mw-ibi"><div class="r">' + (pic ? '<img alt="" src="' + esc(pic) + '">' : '<span class="nb">' + (x.rec.type === 'link' ? '🔗' : '✎') + '</span>') + '<div class="tx"><b>' + esc(x.s.title) + '</b><small>' + esc([sub && sub !== x.s.title ? sub.slice(0, 80) : '', x.at ? ago(x.at) : '', many ? x.b.title : ''].filter(Boolean).join(' · ')) + '</small></div>' +
          '<button type="button" class="mw-b" data-ibmore="' + esc(x.s.id) + '" aria-label="More">' + ICON.more + '</button></div>' +
          '<div class="sg">' + sg.top.map(function (c) { return '<button type="button" class="top" data-ibto="' + esc(x.s.id) + '|' + esc(c.id) + '">→ ' + esc(c.title) + (many ? '<small>' + esc(c.board) + '</small>' : '') + '</button>'; }).join('') +
            sg.rel.map(function (c) { return '<button type="button" data-ibto="' + esc(x.s.id) + '|' + esc(c.id) + '">' + esc(c.title) + '</button>'; }).join('') +
            gsg.map(function (g) { return '<button type="button" class="gh" data-ibgrow="' + esc(x.s.id) + '|' + esc(g.bid) + '|' + esc(g.id) + '" title="Grow this list from the template and file it there">＋ ' + esc(g.title) + '</button>'; }).join('') +
            '<button type="button" class="pick" data-ibpick="' + esc(x.s.id) + '">Choose a list…</button></div></div>';
      }).join('') : '<div class="mw-empty" style="padding:26px 0"><b>All sorted</b><p>Anything you drop here waits until you’re ready.</p></div>';
      ui.body.innerHTML = h;
      if (sure > 1) foot('<button type="button" class="mw-go" data-iball>Sort ' + sure + ' with their first suggestion…</button>');
    });
  }
  function findIb(sid) { return inboxItems().filter(function (x) { return x.s.id === sid; })[0] || null; }
  function listInfo(cid) { var hit = null; boards().forEach(function (b) { (b.columns || []).forEach(function (c) { (c.cards || []).forEach(function (k) { if (k.id === cid) hit = { b: b, c: c, k: k }; }); }); }); return hit; }
  function settle(ms) { return new Promise(function (r) { setTimeout(r, ms || 260); }); }
  // file one thing: its link moves from the Inbox to the list (one item, never a copy)
  function file(x, cid) {
    var L = listInfo(cid); if (!L) return Promise.reject(new Error('That list is not there any more.'));
    try { MinestCapture.learnFrom(textOf(x), cid); } catch (e) {}
    function takeOut() { A().updateBoard(x.b.id, function (b) { return Object.assign({}, b, { columns: (b.columns || []).map(function (c) { return Object.assign({}, c, { cards: (c.cards || []).map(function (k) { if (k.id !== x.k.id) return k; var st = (k.stack || []).filter(function (s) { return s.id !== x.s.id; }); return Object.assign({}, k, { stack: st, hasStack: st.length > 0 }); }) }); }) }); }); }
    if (x.key && /^ki:/.test(x.key)) {
      var it = { id: String(x.key).replace(/^ki:[^:]+:/, ''), title: x.s.title, text: x.rec.text || '', link: x.rec.link || '', type: x.rec.type || 'text', src: x.rec.src || 'inbox', at: x.rec.at || Date.now() }; if (x.rec.img) it.img = x.rec.img;
      return MinestCapture.organize([{ item: it, key: x.key, to: [cid] }], L.b.id, 'inbox', 'organize').then(function (log) { takeOut(); var m = {}; m['pk:' + x.s.id] = null; KN().setMany(m); return settle().then(function () { return { log: log, x: x, cid: cid }; }); });
    }
    // a plain card in the Inbox: it moves itself (same card, same id)
    takeOut(); A().updateBoard(L.b.id, function (b) { return Object.assign({}, b, { columns: (b.columns || []).map(function (c) { return Object.assign({}, c, { cards: (c.cards || []).map(function (k) { return k.id === cid ? Object.assign({}, k, { stack: (k.stack || []).concat([x.s]), hasStack: true }) : k; }) }); }) }); });
    return settle().then(function () { return { x: x, cid: cid, plain: true }; });
  }
  function unfile(r) {
    var L = listInfo(r.cid);
    if (r.plain) {
      if (L) A().updateBoard(L.b.id, function (b) { return Object.assign({}, b, { columns: (b.columns || []).map(function (c) { return Object.assign({}, c, { cards: (c.cards || []).map(function (k) { if (k.id !== r.cid) return k; var st = (k.stack || []).filter(function (s) { return s.id !== r.x.s.id; }); return Object.assign({}, k, { stack: st, hasStack: st.length > 0 }); }) }); }) }); });
    } else if (r.log) MinestCapture.undo(r.log.id);
    // back into its Inbox, as it was
    A().updateBoard(r.x.b.id, function (b) { return Object.assign({}, b, { columns: (b.columns || []).map(function (c) { return Object.assign({}, c, { cards: (c.cards || []).map(function (k) { return k.id === r.x.k.id && !(k.stack || []).some(function (s) { return s.id === r.x.s.id; }) ? Object.assign({}, k, { stack: (k.stack || []).concat([r.x.s]), hasStack: true }) : k; }) }); }) }); });
    if (r.x.key) KN().set('pk:' + r.x.s.id, r.x.key, true);
    return settle();
  }
  function undoToast(msg, rs) {
    var el = null; try { el = GlassUI.toast(msg, { duration: 6000 }); } catch (e) {}
    if (!el || !el.appendChild) return;
    var u = document.createElement('button'); u.type = 'button'; u.textContent = 'Undo'; u.style.cssText = 'margin-left:10px;font-weight:700;color:#5ac8fa;background:none;border:0;padding:0 2px;cursor:pointer;white-space:nowrap;flex:none';
    u.addEventListener('click', function (e) { e.stopPropagation(); el.click(); rs.reduce(function (p, r) { return p.then(function () { return unfile(r); }); }, Promise.resolve()).then(function () { toast('Back in your Inbox'); if (ui.open && (ui.view === 'inbox' || ui.view === 'home')) (ui.view === 'inbox' ? inbox : home)(); }); });
    el.appendChild(u);
  }
  function fileOne(sid, cid) {
    var x = findIb(sid); if (!x) return; var L = listInfo(cid);
    file(x, cid).then(function (r) { hap('success'); undoToast('Filed in ' + (L ? L.k.title : 'the list'), [r]); var y = ui.body.scrollTop; inbox(); ui.body.scrollTop = y; }).catch(function (e) { toast('✗ ' + e.message); });
  }
  function growAndFile(sid, bid, gid) {
    var gh = allGhosts().filter(function (z) { return z.bid === bid && z.id === gid; })[0]; if (!gh) return toast('That list is not in the template any more.');
    W().grow(bid, gh.tid, gh.key).then(function () {
      var t0 = Date.now(); (function wait() { if (listInfo(gid)) fileOne(sid, gid); else if (Date.now() - t0 < 2000) setTimeout(wait, 80); else toast('✗ The new list did not appear — try again.'); })();
    }).catch(function (e) { toast('✗ ' + e.message); });
  }
  // every list in every world, to file by hand
  function pickFor(sid) {
    var x = findIb(sid); if (!x) return inbox(); ui.ibSid = sid;
    go('inbox-pick', function () {
      headSmall('File “' + (x.s.title.length > 24 ? x.s.title.slice(0, 22) + '…' : x.s.title) + '”', 'inbox');
      var q = String(ui.ibq || '').toLowerCase(), h = '<label class="mw-search" style="margin-top:0">' + ICON.search + '<input data-ibpq placeholder="Find a list" autocomplete="off" value="' + esc(ui.ibq || '') + '"></label>';
      W().worlds().forEach(function (w) {
        var rows = ''; (w.b.columns || []).forEach(function (c) { (c.cards || []).forEach(function (k) { if (KN().isHeading(k.id) || isInbox(w.b, k)) return; if (q && String(k.title + ' ' + c.title).toLowerCase().indexOf(q) < 0) return; rows += '<button type="button" class="mw-row" data-ibto="' + esc(sid) + '|' + esc(k.id) + '"><div><b>' + esc(k.title) + '</b><small>' + esc(c.title) + ' · ' + (k.stack || []).length + '</small></div>' + ICON.chev + '</button>'; }); });
        if (rows) h += '<div class="mw-h"><b>' + esc(w.b.title) + '</b></div>' + rows;
      });
      var gs = allGhosts().filter(function (g) { return !q || String(g.title).toLowerCase().indexOf(q) >= 0; });
      if (gs.length) h += '<div class="mw-h"><b>Grow a new list</b></div><p class="mw-note" style="margin:-4px 2px 6px">Waiting in your world’s template — it is added when you file something in it.</p>' +
        gs.slice(0, q ? 40 : 12).map(function (g) { return '<button type="button" class="mw-row gh" data-ibgrow="' + esc(sid) + '|' + esc(g.bid) + '|' + esc(g.id) + '"><div><b>＋ ' + esc(g.title) + '</b><small>' + esc(g.board) + '</small></div>' + ICON.chev + '</button>'; }).join('');
      if (!h.match(/data-ibto|data-ibgrow/)) h += '<p class="mw-note">No list matches “' + esc(ui.ibq || '') + '”.</p>';
      ui.body.innerHTML = h;
    });
  }
  // sort many at once: each with its first suggestion, checked; the user unchecks what is wrong
  function sortAll() {
    var xs = inboxItems().map(function (x) { return { x: x, c: sugOf(x).top[0] }; }).filter(function (r) { return r.c; });
    ui.ibAll = xs.map(function (r) { return { sid: r.x.s.id, cid: r.c.id, on: true }; });
    go('inbox-all', function () {
      headSmall('Sort with suggestions', 'inbox');
      ui.body.innerHTML = '<p class="mw-note" style="margin:0 2px 10px">Uncheck anything that should stay in the Inbox.</p>' + xs.map(function (r, i) { return '<label class="mw-iball"><input type="checkbox" data-ibchk="' + i + '" checked><div><b>' + esc(r.x.s.title) + '</b><small>→ ' + esc(r.c.title) + ' · ' + esc(r.c.board) + '</small></div></label>'; }).join('');
      foot('<button type="button" class="mw-go" data-ibapply>File ' + xs.length + '</button>');
    });
  }
  function applyAll() {
    var go2 = (ui.ibAll || []).filter(function (r) { return r.on; }), done = [];
    go2.reduce(function (p, r) { return p.then(function () { var x = findIb(r.sid); return x ? file(x, r.cid).then(function (res) { done.push(res); }) : null; }); }, Promise.resolve())
      .then(function () { hap('success'); undoToast('Filed ' + done.length + ' thing' + (done.length === 1 ? '' : 's'), done.slice().reverse()); inbox(); }).catch(function (e) { toast('✗ ' + e.message); inbox(); });
  }
  function inboxClick(t) {
    var g;
    if (t.closest('[data-inbox]')) { inbox(); return true; }
    if (t.closest('[data-ibsave]')) { var q = ui.body.querySelector('[data-ibq]'); if (q && q.value.trim()) { drop(q.value); q.value = ''; } else if (q) q.focus(); return true; }
    if (t.closest('[data-ibphoto]')) { photo(); return true; }
    if ((g = t.closest('[data-ibto]'))) { var pr = g.getAttribute('data-ibto').split('|'); fileOne(pr[0], pr[1]); return true; }
    if ((g = t.closest('[data-ibgrow]'))) { var gp = g.getAttribute('data-ibgrow').split('|'); growAndFile(gp[0], gp[1], gp[2]); return true; }
    if ((g = t.closest('[data-ibpick]'))) { ui.ibq = ''; pickFor(g.getAttribute('data-ibpick')); return true; }
    if (t.closest('[data-iball]')) { sortAll(); return true; }
    if ((g = t.closest('[data-ibchk]'))) { var r = (ui.ibAll || [])[+g.getAttribute('data-ibchk')]; if (r) { r.on = g.checked; var n = ui.ibAll.filter(function (z) { return z.on; }).length, b = ui.foot.querySelector('[data-ibapply]'); if (b) { b.textContent = 'File ' + n; b.disabled = !n; } } return false; }
    if (t.closest('[data-ibapply]')) { applyAll(); return true; }
    if ((g = t.closest('[data-ibmore]'))) {
      var x = findIb(g.getAttribute('data-ibmore')); if (!x) return true;
      menu(x.s.title, [['Choose a list…', function () { ui.ibq = ''; pickFor(x.s.id); }], ['Open details', function () { close(); setTimeout(function () { try { if (window.MinestStarter && MinestStarter.openItem) MinestStarter.openItem(x.b.id, x.s.id); else A().openCardIn(x.b.id, x.c.id, x.k.id); } catch (e) {} }, 180); }],
        ['Remove from Inbox…', function () { var ask = window.MinestKEdit ? MinestKEdit.confirm('Remove “' + x.s.title + '” from your Inbox? It is not kept anywhere else.', 'Remove') : Promise.resolve(confirm('Remove it?')); ask.then(function (ok) { if (!ok) return;
          A().updateBoard(x.b.id, function (b) { return Object.assign({}, b, { columns: (b.columns || []).map(function (c) { return Object.assign({}, c, { cards: (c.cards || []).map(function (k) { if (k.id !== x.k.id) return k; var st = (k.stack || []).filter(function (s) { return s.id !== x.s.id; }); return Object.assign({}, k, { stack: st, hasStack: st.length > 0 }); }) }); }) }); });
          var m = {}; m['pk:' + x.s.id] = null; if (x.key && /^ki:cap:/.test(x.key) && !KN().keys('pk:').some(function (k) { return k !== 'pk:' + x.s.id && KN().get(k) === x.key; })) m[x.key] = null; KN().setMany(m);
          toast('Removed'); setTimeout(inbox, 260); }); }]]);
      return true;
    }
    return false;
  }
  document.addEventListener('keydown', function (e) { if (e.key === 'Enter' && e.target && e.target.matches && e.target.matches('.mw [data-ibq]') && !e.isComposing) { e.preventDefault(); var v = e.target.value; if (v.trim()) { drop(v); e.target.value = ''; } } }, true);
  document.addEventListener('input', function (e) { if (e.target && e.target.matches && e.target.matches('.mw [data-ibpq]') && ui.ibSid) { ui.ibq = e.target.value; var pos = e.target.selectionStart; pickFor(ui.ibSid); var n = ui.body.querySelector('[data-ibpq]'); if (n) { n.focus(); try { n.setSelectionRange(pos, pos); } catch (er) {} } } }, true);

  // the Portal (Wiki) is each world's guide: Grow or Whole World
  function openPortal(bid) { close(); setTimeout(function () { try { A().selectBoard(bid); } catch (x) {} setTimeout(function () { if (window.MinestWiki) MinestWiki.open(bid); }, 250); }, 180); }
  function onClick(e) {
    var t = e.target, g;
    if (ui.menu) { var mi = t.closest('[data-mi]'); if (mi) { var it = ui.menuItems[+mi.getAttribute('data-mi')]; closeMenu(); it[1](); return; } closeMenu(); return; }
    if (t.closest('[data-x]')) return close();
    if ((g = t.closest('[data-back]'))) { var bk = g.getAttribute('data-back'); if (bk === 'gallery') return gallery(); if (bk === 'inbox') return inbox(); if (bk === 'world' && ui.wb) return worldView(ui.wb); return home(); }
    if (t.closest('[data-search]')) return search();
    if (inboxClick(t)) return;
    if (t.closest('[data-frameworks]')) return launch(function () { MinestFrameworks.open(); }, function () { return MinestFrameworks.isOpen(); });
    if (t.closest('[data-settings]')) return settings();
    if (t.closest('[data-gallery]')) return gallery();
    if ((g = t.closest('[data-res]'))) { var r = ui.res[+g.getAttribute('data-res')]; if (!r) return; if (r.k === 'w') return openWorldCard(r.b.id); close(); setTimeout(function () { try { A().openCardIn(r.b.id, r.c.id, r.card.id); } catch (x) {} }, 200); return; }
    if ((g = t.closest('[data-look]'))) { KN().setLook(g.getAttribute('data-look')); return settings(); }
    if (t.closest('[data-mix]')) { close(); setTimeout(function () { MinestBuilder.mix(); }, 180); return; }
    if (t.closest('[data-scratch]')) { close(); setTimeout(function () { MinestBuilder.scratch(); }, 180); return; }
    if (t.closest('[data-classic]')) { close(); setTimeout(function () { W().open(); }, 180); return; }
    if (t.closest('[data-add]')) return addMenu(null);
    if (t.closest('[data-discover]')) return launch(function () { MinestDiscover.open(); }, function () { return MinestDiscover.isOpen(); });
    if ((g = t.closest('[data-log]'))) { var lg = KN().get('wl:' + g.getAttribute('data-log')); if (lg) return openLog(lg); }
    if (t.closest('[data-recent]')) return launch(function () { MinestCapture.open(); }, function () { return MinestCapture.isOpen(); });
    if ((g = t.closest('[data-wmore]'))) { e.stopPropagation(); var bid = g.getAttribute('data-wmore'), b = boardById(bid);
      return menu(b ? b.title : 'World', [['Open', function () { worldView(bid); }], ['Open in its home view', function () { openWorldCard(bid); }], ['Change cover', function () { ui.coverFor = bid; ui.file.click(); }], ['Use the default cover', function () { KN().set('wa:' + bid, Object.assign({}, KN().get('wa:' + bid) || {}, { cover: '' })); home(); }]].concat(window.MinestBuilder ? [['Customize', function () { close(); setTimeout(function () { MinestBuilder.open(bid); }, 180); }]] : []).concat(window.MinestCapture ? [['Add to this world', function () { addMenu(bid); }]] : [])); }
    if ((g = t.closest('[data-world]'))) { hap('selection'); return worldView(g.getAttribute('data-world')); }
    if (ui.view === 'world') {
      var S = ui.ws, wb = ui.wb, keep = function (fn) { var y0 = ui.body.scrollTop; fn(); ui.body.scrollTop = y0; };
      if ((g = t.closest('[data-wview]'))) { var v = g.getAttribute('data-wview'); saveWorldState(); if (v === 'kanban') { S.view = S.view === 'kanban' ? 'list' : S.view; stSave(wb, S); close(); setTimeout(function () { try { if (A().selectBoard) A().selectBoard(wb); } catch (x) {} }, 180); return; } S.view = v; stSave(wb, S); hap('selection'); return drawWorld(); }
      if (t.closest('[data-wmoreviews]')) { var mv = [['Contents', function () { close(); setTimeout(function () { try { A().selectBoard(wb); } catch (x) {} setTimeout(function () { MinestContents.open(); }, 250); }, 180); }], ['Portal', function () { close(); setTimeout(function () { try { A().selectBoard(wb); } catch (x) {} setTimeout(function () { MinestWiki.open(wb); }, 250); }, 180); }], ['Timeline', function () { close(); setTimeout(function () { try { A().selectBoard(wb); } catch (x) {} setTimeout(function () { MinestTimeline.open(wb); }, 250); }, 180); }]].concat(window.MinestMap ? [['Map', function () { close(); setTimeout(function () { try { A().selectBoard(wb); } catch (x) {} setTimeout(function () { MinestMap.open(wb); }, 250); }, 180); }]] : []); saveWorldState(); return menu('More views', mv); }
      if ((g = t.closest('[data-warea]'))) { S.area = g.getAttribute('data-warea'); stSave(wb, S); return drawWorld(true); }
      if ((g = t.closest('[data-wlist]'))) { var lid = g.getAttribute('data-wlist'); if (S.open[lid]) delete S.open[lid]; else { S.open[lid] = 1; if (KN().get('wn:' + lid)) KN().set('wn:' + lid, null, true); } stSave(wb, S); return keep(drawWorld); }
      if ((g = t.closest('[data-witem]'))) { saveWorldState(); var sid = g.getAttribute('data-witem'); if (window.MinestStarter && MinestStarter.openItem) { MinestStarter.openItem(wb, sid); watchBack(); } return; }
      if ((g = t.closest('[data-waddto]'))) { saveWorldState(); var cid = g.getAttribute('data-waddto'); if (window.MinestStarter && MinestStarter.addTo) { MinestStarter.addTo(wb, cid); watchBack(); } return; }
      if ((g = t.closest('[data-wpick]'))) { saveWorldState(); var pc = g.getAttribute('data-wpick'); return launch(function () { MinestPicker.open({ bid: wb, cardId: pc }); }, function () { return MinestPicker.isOpen(); }); }
      if ((g = t.closest('[data-wplay]'))) { saveWorldState(); var pl = g.getAttribute('data-wplay'); return launch(function () { MinestDiscover.open({ bid: wb, cardId: pl }); }, function () { return MinestDiscover.isOpen(); }); }
      if (t.closest('[data-wadd]')) { saveWorldState(); return addMenu(wb); }
    }
    if ((g = t.closest('[data-tpl]'))) { var tp = tplById(g.getAttribute('data-tpl')); if (tp) preview(tp); return; }
    // preview
    if (ui.view === 'preview') {
      var y = function (fn) { var s = ui.body.scrollTop; fn(); ui.body.scrollTop = s; };
      if ((g = t.closest('[data-startmode]'))) { ui.pv.start = g.getAttribute('data-startmode'); hap('selection'); return y(drawPreview); }
      if ((g = t.closest('[data-off]'))) { e.stopPropagation(); var k = g.getAttribute('data-off');
        if (ui.pv.start === 'grow' && autoOff(ui.pv.t)[k] && !ui.pv.off[k]) { if (ui.pv.keep[k]) delete ui.pv.keep[k]; else ui.pv.keep[k] = 1; }   // a list that waits: take it now (or let it wait again)
        else if (ui.pv.off[k]) delete ui.pv.off[k]; else ui.pv.off[k] = 1;
        hap('selection'); return y(drawPreview); }
      if ((g = t.closest('[data-open]'))) { var d = g.getAttribute('data-open'); ui.pv.open[d] = !ui.pv.open[d]; g.parentNode.classList.toggle('open', !!ui.pv.open[d]); return; }
      if ((g = t.closest('[data-depth]'))) { ui.pv.depth = g.getAttribute('data-depth'); return y(drawPreview); }
      if ((g = t.closest('[data-into]'))) { ui.pv.into = g.getAttribute('data-into') || null; return y(drawPreview); }
      if (t.closest('[data-use]')) return use();
    }
    // welcome
    if (t.closest('[data-start]')) { var nb = ui.newBid; close(); setTimeout(function () { if (window.MinestStarter && MinestStarter.has(nb)) MinestStarter.open({ bid: nb, add: true }); else if (window.MinestCapture) MinestCapture.open({ wbid: nb }); }, 180); return; }
    if (t.closest('[data-explore]')) { if (window.MinestWiki) return openPortal(ui.newBid); return home({ highlight: ui.newBid, top: true }); }
    if ((g = t.closest('[data-wportal]'))) { saveWorldState(); return openPortal(ui.wb); }
  }

  function watchBack() { var t0 = Date.now(); (function w() { if (!ui.open || ui.view !== 'world') return; if (window.MinestStarter && MinestStarter.isOpen()) { setTimeout(w, 250); return; } if (Date.now() - t0 > 400) { var y = ui.body.scrollTop; drawWorld(); ui.body.scrollTop = y; } })(); setTimeout(function w2() { if (window.MinestStarter && MinestStarter.isOpen()) return setTimeout(w2, 250); if (ui.open && ui.view === 'world') { var y = ui.body.scrollTop; drawWorld(); ui.body.scrollTop = y; } }, 300); }
  // ---------------------------------------------------------------- tools opened from My World come back to the same place
  function anyOverlay() { return !!document.querySelector('.lw,.sk,.wk,.pk,.wc,.dv,.st,.bd,.mw,.tl,.en,.km,.lm,.fw'); }
  function launch(fn, isOpen) {
    var ret = { view: ui.view, wb: ui.wb }; close();
    setTimeout(function () {
      try { fn(); } catch (e) { return; }
      var t0 = Date.now(), seen = false;
      (function poll() { var o = false; try { o = isOpen(); } catch (e) {} if (o) seen = true;
        if (seen && !o) { setTimeout(function () { if (!anyOverlay()) { if (ret.view === 'world' && ret.wb && boardById(ret.wb)) worldView(ret.wb); else home(); } }, 120); return; }
        if (!seen && Date.now() - t0 > 4000) return; setTimeout(poll, 300); })();
    }, 180);
  }
  function chooseWorld(wb, cb) { if (wb) return cb(wb); var ws = W() ? W().worlds() : []; if (!ws.length) return gallery(); if (ws.length === 1) return cb(ws[0].b.id); menu('Which world?', ws.map(function (x) { return [x.b.title, function () { cb(x.b.id); }]; })); }
  function addMenu(wb) {
    var items = [['Add anything — type, paste, a link or a photo', function () { launch(function () { MinestCapture.open(wb ? { wbid: wb } : {}); }, function () { return MinestCapture.isOpen(); }); }]];
    if (wb && window.MinestStarter) { var fd = KN().get('fd:' + wb); var qa = fd && Object.keys(fd.packs || {}).map(function (k) { return fd.packs[k].quickAdd; }).filter(Boolean)[0]; if (qa) items.unshift([qa.label, function () { launch(function () { MinestStarter.open({ bid: wb, add: true }); }, function () { return MinestStarter.isOpen(); }); }]); }
    if (window.MinestPicker) items.push(['Pick favourites — pictures, bubbles, step by step', function () { chooseWorld(wb, function (bid) { launch(function () { MinestPicker.home(bid); }, function () { return MinestPicker.isOpen(); }); }); }]);
    if (window.MinestVisualLibrary) items.push(['Visual Library — search & collect', function () { var start = function (bid) { launch(function () { MinestVisualLibrary.open(bid ? { bid: bid } : {}); }, function () { return MinestVisualLibrary.isOpen(); }); }; if (!wb && !W().worlds().length) start(); else chooseWorld(wb, start); }]);
    if (window.MinestCapture) items.push(['Import text or JSON', function () { launch(function () { MinestCapture.open(wb ? { wbid: wb, import: true } : { import: true }); }, function () { return MinestCapture.isOpen(); }); }]);
    menu(wb ? 'Add to ' + (boardById(wb) || {}).title : 'Add to My World', items);
  }
  window.MinestMyWorld = { world: function (bid, o) { worldView(bid, o); }, template: function (id) { var t = W() && W().templates().filter(function (x) { return x.id === id; })[0]; if (!t) return home(); shell(); preview(t); }, open: function () { home(); }, gallery: function () { shell(); gallery(); }, close: close, isOpen: function () { return ui.open; }, _welcome: welcome };
})();

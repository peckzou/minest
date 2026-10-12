/* Minest Knowledge · Everyday Worlds Starter Packs — window.MinestStarter
   A template's starterPack (tools/knowledge/templates/*.json) makes a new world useful at once:
     Your World Is Ready → Explore / Add My First Thing / Customize; a world home with its Quick Add, more adds,
     pickers, a gallery and the Discover tools that fit.
   Data (kept apart, never inside the template):
     'fd:<board>' = { packs: { <template id>: { fields: {id: def}, quickAdd, more, pickers, gallery, discovery, explore } },
                     lists: { <card id>: { tpl, fields: [ids] } } }      ← field definitions per world
     'fv:<stacked card>' = { <field id>: value }                           ← the values of one item
   An item is an ordinary stacked card in the chosen list (title, a readable summary in its note, its photo as cover);
   a date field marked timeline also goes on the Timeline (MinestKnowledge.setDate). Reference fields (people, places)
   keep stable ids of other items — nothing is copied. Memories, people and family data stay private. */
(function () {
  if (window.MinestStarter) return;
  var A = function () { return window.MinestAI || {}; };
  var KN = function () { return window.MinestKnowledge; };
  function esc(s) { return String(s == null ? '' : s).replace(/[&<>"]/g, function (c) { return { '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;' }[c]; }); }
  function slug(s) { return String(s || '').toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/^-|-$/g, '').slice(0, 40) || 'x'; }
  function rid() { return Date.now().toString(36) + Math.random().toString(36).slice(2, 6); }
  function toast(m) { try { if (window.GlassUI && GlassUI.toast) GlassUI.toast(m); } catch (e) {} }
  function boards() { try { return (A().boards && A().boards()) || []; } catch (e) { return []; } }
  function boardById(id) { return boards().filter(function (b) { return b.id === id; })[0] || null; }
  function tpls() { return (window.MinestWorld && MinestWorld.templates) ? MinestWorld.templates() : []; }
  function tplById(id) { return tpls().filter(function (t) { return t.id === id; })[0] || null; }
  function hash(s) { var h = 2166136261; s = String(s); for (var i = 0; i < s.length; i++) { h ^= s.charCodeAt(i); h = Math.imul(h, 16777619); } return h >>> 0; }

  // ================================================================== field definitions per world
  // the card id the engine gives a template list (world.js plan): <board>-l-<tpl>-<domain or category>-<list>
  function listCards(bid, t, pattern) {
    var out = [], tid = slug(t.id), p = String(pattern).split('/'), b = boardById(bid); if (!b) return out;
    var have = {}; (b.columns || []).forEach(function (c) { (c.cards || []).forEach(function (k) { have[k.id] = k; }); });
    t.domains.forEach(function (d) {
      var groups = d.lists && !d.categories ? [{ id: d.id, lists: d.lists }] : (d.categories || []);
      groups.forEach(function (g) { if (p[0] !== '*' && p[0] !== g.id && p[0] !== d.id) return; (g.lists || []).forEach(function (l) {
        if (p[1] && p[1] !== '*' && p[1] !== l.id) return; if (!p[1] && p[0] !== '*' && p[0] === d.id && g.id !== d.id) {}
        var cid = bid + '-l-' + tid + '-' + slug(g.id) + '-' + slug(l.id), al = KN().get('lom:alias:' + cid); if (have[cid]) out.push(cid); else if (al && have[al] && out.indexOf(al) < 0) out.push(al);
      }); });
    });
    return out;
  }
  // (a new board shows up in boards() a moment after it is made: wait for it, then map the lists)
  function install(bid, t, tries) {
    var sp = t.starterPack; if (!sp) return Promise.resolve();
    if (!boardById(bid) || !listCards(bid, t, '*/*').length) { if ((tries || 0) > 30) return Promise.resolve(); return new Promise(function (r) { setTimeout(function () { install(bid, t, (tries || 0) + 1).then(r); }, 100); }); }
    var fd = Object.assign({ packs: {}, lists: {} }, KN().get('fd:' + bid) || {}); fd.packs = Object.assign({}, fd.packs); fd.lists = Object.assign({}, fd.lists);
    var F = {}; (sp.fields || []).forEach(function (f) { F[f.id] = f; });
    fd.packs[t.id] = { fields: F, quickAdd: sp.quickAdd || null, more: sp.more || [], pickers: sp.pickers || [], gallery: sp.gallery || null, discovery: sp.discoveryTools || [], explore: sp.explore || 'portal', private: !!sp.private, name: t.name, cover: sp.cover || {}, at: Date.now() };
    // (a list you already had keeps its fields and gains the new ones)
    Object.keys(sp.listFields || {}).forEach(function (pat) { listCards(bid, t, pat).forEach(function (cid) { var was = fd.lists[cid]; if (was && (was.custom || was.tpl !== t.id)) { var u = was.fields.slice(); sp.listFields[pat].forEach(function (x) { if (u.indexOf(x) < 0) u.push(x); }); fd.lists[cid] = Object.assign({}, was, { fields: u }); return; } fd.lists[cid] = { tpl: t.id, fields: sp.listFields[pat].slice() }; }); });
    KN().set('fd:' + bid, fd);
    return Promise.resolve();
  }
  function fdOf(bid) { return KN() && KN().get('fd:' + bid); }
  function has(bid) { var f = fdOf(bid); return !!(f && f.packs && Object.keys(f.packs).length && boardById(bid)); }
  function packOf(bid) { var f = fdOf(bid); if (!f) return null; var k = Object.keys(f.packs || {})[0]; return k ? Object.assign({ id: k }, f.packs[k]) : null; }
  function fieldDef(f, tpl, id) { var P = (f.packs || {})[tpl] || {}; if (P.fields && P.fields[id]) return P.fields[id]; var hit = null; Object.keys(f.packs || {}).forEach(function (k) { if (!hit && f.packs[k].fields && f.packs[k].fields[id]) hit = f.packs[k].fields[id]; }); return hit; }
  function fieldsFor(bid, cardId) { var f = fdOf(bid), L = f && f.lists[cardId]; if (!L) return []; return L.fields.map(function (id) { return fieldDef(f, L.tpl, id); }).filter(Boolean); }
  function targets(bid, pack, pats) { var t = tplById(pack.id); if (!t) return []; var out = []; (pats || []).forEach(function (p) { listCards(bid, t, p).forEach(function (c) { if (out.indexOf(c) < 0) out.push(c); }); }); return out; }

  // ================================================================== items
  function locate(b, id) { var hit = null; (b.columns || []).forEach(function (col) { (col.cards || []).forEach(function (c) { if (c && c.id === id) hit = { col: col, card: c }; (c && c.stack || []).forEach(function (s) { if (s.id === id) hit = { col: col, card: c, item: s }; }); }); }); return hit; }
  function itemsOf(bid, cardId) { var b = boardById(bid), L = b && locate(b, cardId); return L ? (L.card.stack || []) : []; }
  function dateText(v) { if (!v || !v.y) return ''; var M = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec']; return (v.d ? v.d + ' ' : '') + (v.m ? M[v.m - 1] + ' ' : '') + v.y; }
  function refTitle(bid, r) { var b = boardById(bid), L = b && locate(b, r.id); return L ? (L.item || L.card).title : r.title || '(removed)'; }
  // the readable note on the card (the values themselves live in fv:)
  function summary(bid, defs, v) {
    var out = [];
    defs.forEach(function (f) {
      var x = v[f.id]; if (x == null || x === '' || (Array.isArray(x) && !x.length) || f.type === 'image') return;
      if (f.type === 'text' && f.multiline) { var lines = String(x).split('\n').map(function (l) { return l.trim(); }).filter(Boolean); if (!lines.length) return; out.push(f.label + ':\n' + (f.id === 'steps' ? lines.map(function (l, i) { return (i + 1) + '. ' + l.replace(/^\d+[.)]\s*/, ''); }) : f.id === 'ingredients' ? lines.map(function (l) { return '• ' + l.replace(/^[-•*]\s*/, ''); }) : lines).join('\n')); return; }
      if (f.type === 'date') return out.push(f.label + ': ' + dateText(x));
      if (f.type === 'boolean') return x ? out.push(f.label) : null;
      if (f.type === 'multiselect') return out.push(f.label + ': ' + x.join(', '));
      if (f.type === 'ref') return out.push(f.label + ': ' + x.map(function (r) { return refTitle(bid, r); }).join(', '));
      out.push(f.label + ': ' + x);
    });
    return out.join('\n\n');
  }
  function written(before) { var t0 = Date.now(); return new Promise(function (done) { (function w() { if (A().boards() !== before || Date.now() - t0 > 900) done(); else requestAnimationFrame(w); })(); }); }
  // create (no sid) or update an item; returns its id
  function saveItem(bid, cardId, sid, title, v) {
    var b0 = boardById(bid); if (!b0) return Promise.reject(new Error('This world is not here any more.'));
    var b = JSON.parse(JSON.stringify(b0)), defs = fieldsFor(bid, cardId), imgF = imageField(defs), photo = (imgF && v[imgF]) || v.photo || '';
    var isNew = !sid, target = sid ? locate(b, sid) : locate(b, cardId); if (!target) return Promise.reject(new Error('The list is not here any more.'));
    var desc = summary(bid, defs, v);
    if (sid) { var it = target.item; it.title = title; it.desc = desc; if (photo) it.cover = { type: 'image', value: photo, url: photo, title: '', size: 'banner' }; else delete it.cover; }
    else { sid = cardId + '~' + slug(title) + '-' + rid().slice(-5); var st = { id: sid, title: title, desc: desc, labels: [], complete: false, mastery: 1 }; if (photo) st.cover = { type: 'image', value: photo, url: photo, title: '', size: 'banner' }; target.card.stack = (target.card.stack || []).concat([st]); target.card.hasStack = true; }
    var before = A().boards(); A().updateBoard(bid, function () { return b; });
    var keep = Object.assign({}, v); delete keep.photo; if (imgF) delete keep[imgF];   // the picture lives once, on the card's cover
    KN().set('fv:' + sid, keep, true);
    defs.forEach(function (f) { if (f.type === 'date' && f.timeline) KN().setDate(sid, v[f.id] && v[f.id].y ? v[f.id] : null); });
    var ws = KN().get('wn:' + cardId); KN().set('wn:' + cardId, Object.assign({ n: 0, since: Date.now() }, ws || {}, { n: ((ws && ws.n) || 0) + (isNew ? 1 : 0) }), true);
    return written(before).then(function () { try { window.dispatchEvent(new CustomEvent('minest:kedit', { detail: { bid: bid } })); } catch (e) {} return sid; });
  }
  function imageField(defs) { var f = (defs || []).filter(function (x) { return x.type === 'image'; })[0]; return f ? f.id : null; }
  function valuesOf(bid, sid) { var v = Object.assign({}, KN().get('fv:' + sid) || {}), b = boardById(bid), L = b && locate(b, sid); if (L && L.item && L.item.cover && (L.item.cover.value || L.item.cover.url)) { var src = L.item.cover.value || L.item.cover.url, f = imageField(fieldsFor(bid, L.card.id)); v[f || 'photo'] = src; if (!f) v.photo = src; } return v; }
  // which items point at this one (e.g. the memories a person or a place is in)
  function mentions(bid, sid) {
    var out = [], b = boardById(bid); if (!b) return out;
    (b.columns || []).forEach(function (col) { (col.cards || []).forEach(function (c) { (c.stack || []).forEach(function (s) { var v = KN().get('fv:' + s.id); if (!v) return; Object.keys(v).forEach(function (k) { if (Array.isArray(v[k]) && v[k].some(function (r) { return r && r.id === sid; })) out.push({ id: s.id, title: s.title, card: c.id }); }); }); }); });
    return out;
  }
  // a recipe pasted as text: the first line is the name; "Ingredients" and "Steps / Directions / Method" sections
  function parseRecipe(text) {
    var lines = String(text || '').replace(/\r/g, '').split('\n').map(function (l) { return l.trim(); }), out = { title: '', ingredients: [], steps: [], source: '' }, mode = '';
    lines.forEach(function (l) {
      if (!l) return; var u = (l.match(/https?:\/\/\S+/) || [])[0]; if (u && !out.source) { out.source = u; if (l === u) return; }
      if (/^(ingredients?|you will need|what you need)\s*:?$/i.test(l)) { mode = 'i'; return; }
      if (/^(steps?|directions?|method|instructions?|how to make( it)?)\s*:?$/i.test(l)) { mode = 's'; return; }
      if (!out.title) { out.title = l.replace(/^#+\s*/, '').slice(0, 90); return; }
      if (mode === 'i' || (!mode && /^[-•*]|^\d+\s*(g|kg|ml|l|cups?|tbsp|tsp|oz|lb)\b|^\d+(\/\d+)?\s/i.test(l))) { out.ingredients.push(l.replace(/^[-•*]\s*/, '')); if (!mode) mode = 'i'; return; }
      out.steps.push(l.replace(/^\d+[.)]\s*/, '')); if (mode === 'i' && !/^[-•*]/.test(l) && /[.!]$/.test(l)) mode = 's';
    });
    return out;
  }

  // ================================================================== UI
  var I = function (d) { return '<svg viewBox="0 0 24 24" width="18" height="18" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">' + d + '</svg>'; };
  var ICON = { x: I('<path d="M6 6l12 12M18 6 6 18"/>'), back: I('<path d="m15 6-6 6 6 6"/>'), chev: I('<path d="m9 6 6 6-6 6"/>'), plus: I('<path d="M12 5v14M5 12h14"/>'), photo: I('<rect x="3" y="5" width="18" height="14" rx="3"/><circle cx="9" cy="11" r="2"/><path d="m21 16-5-5-8 8"/>'), edit: I('<path d="M4 20h4L19 9l-4-4L4 16z"/>') };
  var CSS = [
    '.st{position:fixed;inset:0;z-index:2147482007;display:flex;flex-direction:column;color:#f3f5f8;font:15px/1.4 -apple-system,BlinkMacSystemFont,"SF Pro Text",system-ui,sans-serif;-webkit-font-smoothing:antialiased;background:linear-gradient(180deg,rgba(20,24,36,.94),rgba(8,10,18,.98));-webkit-backdrop-filter:blur(40px) saturate(180%);backdrop-filter:blur(40px) saturate(180%)}',
    '.st-head{display:flex;align-items:center;gap:10px;padding:calc(env(safe-area-inset-top,0px) + 12px) 14px 6px}.st-head h2{flex:1;min-width:0;margin:0;font-size:24px;font-weight:800;letter-spacing:-.4px;white-space:nowrap;overflow:hidden;text-overflow:ellipsis}',
    '.st-b{flex:none;width:36px;height:36px;border-radius:50%;display:grid;place-items:center;padding:0;cursor:pointer;color:inherit;background:linear-gradient(180deg,rgba(255,255,255,.18),rgba(255,255,255,.06));border:1px solid rgba(255,255,255,.24)}',
    '.st-body{flex:1;overflow-y:auto;-webkit-overflow-scrolling:touch;padding:4px 14px calc(env(safe-area-inset-bottom,0px) + 110px)}',
    '.st-foot{position:absolute;left:0;right:0;bottom:0;padding:26px 14px calc(env(safe-area-inset-bottom,0px) + 14px);background:linear-gradient(180deg,rgba(8,10,18,0),rgba(8,10,18,.97) 22px);display:flex;gap:10px}',
    '.st-go{flex:1;height:50px;border-radius:999px;border:1px solid rgba(255,255,255,.25);background:linear-gradient(180deg,color-mix(in srgb,var(--c,#0a7aff) 78%,#fff),var(--c,#0a7aff));color:#fff;font:700 16px -apple-system,system-ui,sans-serif;cursor:pointer;display:inline-flex;align-items:center;justify-content:center;gap:6px;white-space:nowrap}',
    '.st-go:disabled{opacity:.4}.st-go.sec{flex:0 0 auto;padding:0 18px;background:rgba(255,255,255,.1)}',
    '.st-h{margin:18px 2px 8px;font-size:12px;font-weight:650;letter-spacing:.06em;text-transform:uppercase;opacity:.55}',
    '.st-sub{margin:0 2px 12px;font-size:14px;opacity:.65}',
    '.st-cover{margin:0 -14px 12px;height:120px;display:grid;place-items:center;background:radial-gradient(120% 90% at 20% 0%,rgba(255,255,255,.3),rgba(255,255,255,0) 55%),linear-gradient(150deg,color-mix(in srgb,var(--c) 92%,#fff),color-mix(in srgb,var(--c) 55%,#000))}',
    '.st-cover svg{width:100%;height:100%;max-width:420px}',
    '.st-ready{text-align:center;padding:10px 0 6px}.st-ready b{display:block;font-size:28px;font-weight:850;letter-spacing:-.5px}.st-ready span{opacity:.65}',
    '.st-big{display:flex;flex-direction:column;gap:10px;margin-top:16px}.st-big .st-go{flex:none}',
    '.st-row{display:flex;align-items:center;gap:12px;width:100%;text-align:left;padding:12px;margin-bottom:6px;border-radius:16px;cursor:pointer;color:inherit;font:inherit;background:rgba(255,255,255,.07);border:1px solid rgba(255,255,255,.12)}',
    '.st-row div{flex:1;min-width:0}.st-row b{display:block;font-size:15px;white-space:nowrap;overflow:hidden;text-overflow:ellipsis}.st-row small{display:block;font-size:12.5px;opacity:.6;white-space:nowrap;overflow:hidden;text-overflow:ellipsis}.st-row em{flex:none;font-style:normal;font-size:12.5px;opacity:.55}',
    '.st-row .dot{width:10px;height:10px;border-radius:50%;flex:none;background:var(--c)}',
    '.st-chips{display:flex;flex-wrap:wrap;gap:8px}',
    '.st-chip{min-height:34px;padding:6px 12px;border-radius:999px;border:1px solid rgba(255,255,255,.18);background:rgba(255,255,255,.08);color:inherit;font:600 13.5px -apple-system,system-ui,sans-serif;cursor:pointer;display:inline-flex;align-items:center;gap:6px}',
    '.st-chip.on{background:linear-gradient(180deg,color-mix(in srgb,var(--c,#0a7aff) 78%,#fff),var(--c,#0a7aff));border-color:rgba(255,255,255,.4);color:#fff}',
    '.st-f{margin-bottom:14px}.st-f label{display:block;font-size:12.5px;font-weight:650;opacity:.7;margin:0 2px 6px}.st-f small{font-weight:500;opacity:.8}',
    '.st-in{width:100%;box-sizing:border-box;height:44px;padding:0 12px;border-radius:12px;border:1px solid rgba(255,255,255,.16);background:rgba(255,255,255,.07);color:inherit;font:inherit;outline:none}',
    'textarea.st-in{height:auto;min-height:92px;padding:10px 12px;resize:vertical;line-height:1.45}',
    '.st-date{display:flex;gap:8px}.st-date .st-in{flex:1}.st-date .st-in.y{flex:1.3}',
    '.st-sw{width:50px;height:30px;border-radius:999px;border:0;padding:0;cursor:pointer;background:rgba(255,255,255,.2);position:relative}.st-sw:after{content:"";position:absolute;left:3px;top:3px;width:24px;height:24px;border-radius:50%;background:#fff;transition:transform .2s}.st-sw.on{background:#30d158}.st-sw.on:after{transform:translateX(20px)}',
    '.st-photo{display:flex;align-items:center;gap:10px}.st-photo img{width:84px;height:84px;object-fit:cover;border-radius:14px}',
    '.st-grid{display:grid;grid-template-columns:repeat(auto-fill,minmax(104px,1fr));gap:12px 10px}',
    '.st-tile{cursor:pointer;min-width:0}.st-tile .art{aspect-ratio:1;border-radius:14px;background-size:cover;background-position:center;display:flex;align-items:flex-end;padding:8px;box-sizing:border-box;box-shadow:0 8px 20px rgba(0,0,0,.3)}',
    '.st-tile .art b{font:800 13px/1.15 Georgia,serif;color:#fff;text-shadow:0 1px 6px rgba(0,0,0,.4);display:-webkit-box;-webkit-line-clamp:3;-webkit-box-orient:vertical;overflow:hidden}',
    '.st-tile p{margin:5px 2px 0;font-size:12px;font-weight:600;line-height:1.2;display:-webkit-box;-webkit-line-clamp:2;-webkit-box-orient:vertical;overflow:hidden}',
    '.st-det img{width:100%;max-height:260px;object-fit:cover;border-radius:16px;margin-bottom:10px}',
    '.st-det h3{margin:0 0 4px;font-size:24px;font-weight:800}.st-kv{margin:12px 0;padding:12px 14px;border-radius:14px;background:rgba(255,255,255,.06)}.st-kv b{display:block;font-size:12px;letter-spacing:.04em;text-transform:uppercase;opacity:.55;margin-bottom:4px}.st-kv div{white-space:pre-line}',
    '.st-kv ol,.st-kv ul{margin:0;padding-left:20px}.st-kv li{margin:3px 0}',
    '.st-note{font-size:12.5px;opacity:.6;margin:8px 2px}',
    'html.kn-light .st{color:#1d1f23;background:linear-gradient(180deg,rgba(244,246,250,.95),rgba(232,236,243,.98))}html.kn-light .st-b,html.kn-light .st-row,html.kn-light .st-chip,html.kn-light .st-in,html.kn-light .st-kv{background:rgba(255,255,255,.85);border-color:rgba(0,0,0,.1)}html.kn-light .st-chip.on{color:#fff}html.kn-light .st-foot{background:linear-gradient(180deg,rgba(236,239,245,0),rgba(236,239,245,.97) 22px)}html.kn-light .st-go.sec{background:rgba(0,0,0,.06);color:#1d1f23}'
  ].join('\n');
  function css() { if (document.getElementById('st-css')) return; var s = document.createElement('style'); s.id = 'st-css'; s.textContent = CSS; document.head.appendChild(s); }
  var ui = { open: false };
  function shell() {
    if (ui.open) return; css(); if (KN() && KN().applyLook) KN().applyLook();
    var el = document.createElement('div'); el.className = 'st'; el.setAttribute('role', 'dialog');
    el.innerHTML = '<div class="st-head"></div><div class="st-body"></div><div class="st-foot" hidden></div><input type="file" accept="image/*" hidden>';
    ['pointerdown', 'touchstart', 'touchmove', 'wheel', 'keydown'].forEach(function (ev) { el.addEventListener(ev, function (e) { e.stopPropagation(); }, { passive: ev !== 'keydown' }); });
    ui.el = el; ui.head = el.querySelector('.st-head'); ui.body = el.querySelector('.st-body'); ui.foot = el.querySelector('.st-foot'); ui.file = el.querySelector('input[type=file]'); ui.open = true;
    document.body.appendChild(el); document.documentElement.classList.add('kn-open');
    if (el.animate) el.animate([{ opacity: 0, translate: '0 24px' }, { opacity: 1, translate: '0 0' }], { duration: 280, easing: 'cubic-bezier(.2,.85,.25,1)' });
    el.addEventListener('click', onClick);
    el.addEventListener('keydown', function (e) { if (e.key === 'Escape') close(); });
    ui.file.addEventListener('change', function () { var f = ui.file.files && ui.file.files[0]; ui.file.value = ''; if (!f) return; shrink(f, 1000, function (d) { if (!d) return toast('This picture could not be read.'); keepForm(); ui.form.v[ui.form.imgKey || 'photo'] = d; drawForm(); }); });
  }
  function close() { if (!ui.open) return; var el = ui.el; ui.open = false; ui.el = null; if (!document.querySelector('.lw,.sk,.wk,.pk,.wc,.dv')) document.documentElement.classList.remove('kn-open'); if (el.animate) { var an = el.animate([{ opacity: 1 }, { opacity: 0 }], { duration: 180, fill: 'forwards' }); an.onfinish = function () { el.remove(); }; } else el.remove(); }
  function head(title, back) { ui.head.innerHTML = (back ? '<button type="button" class="st-b" data-back="' + esc(back) + '" aria-label="Back">' + ICON.back + '</button>' : '') + '<h2>' + esc(title) + '</h2><button type="button" class="st-b" data-x aria-label="Close">' + ICON.x + '</button>'; ui.foot.hidden = true; ui.foot.innerHTML = ''; ui.body.scrollTop = 0; }
  function foot(h) { ui.foot.hidden = !h; ui.foot.innerHTML = h || ''; }
  function shrink(f, max, cb) { var rd = new FileReader(); rd.onload = function () { var im = new Image(); im.onload = function () { var k = Math.min(1, max / Math.max(im.naturalWidth, im.naturalHeight)), w = Math.round(im.naturalWidth * k), h = Math.round(im.naturalHeight * k); try { var c = document.createElement('canvas'); c.width = w; c.height = h; c.getContext('2d').drawImage(im, 0, 0, w, h); cb(c.toDataURL('image/jpeg', .8)); } catch (e) { cb(null); } }; im.onerror = function () { cb(null); }; im.src = rd.result; }; rd.readAsDataURL(f); }
  function colorOf(bid) { var wa = KN().get('wa:' + bid), p = packOf(bid), t = p && tplById(p.id); return (wa && wa.color) || (t && t.color) || '#0a7aff'; }
  function cover(bid) { var p = packOf(bid), t = p && tplById(p.id); var art = ''; try { art = (window.MinestWorld && MinestWorld._art && t) ? MinestWorld._art(t) : ''; } catch (e) {} var wa = KN().get('wa:' + bid) || {}; if (wa.cover) return '<div class="st-cover" style="--c:' + esc(colorOf(bid)) + ';background:url(&quot;' + esc(wa.cover) + '&quot;) center/cover"></div>' + (wa.subtitle ? '<p class="st-sub">' + esc(wa.subtitle) + '</p>' : ''); return '<div class="st-cover" style="--c:' + esc(colorOf(bid)) + '">' + art + '</div>' + (wa.subtitle ? '<p class="st-sub">' + esc(wa.subtitle) + '</p>' : ''); }
  function cardTitle(bid, cid) { var b = boardById(bid), L = b && locate(b, cid); return L ? L.card.title : ''; }

  // ---------------------------------------------------------------- Your World Is Ready
  function welcome(bid, tplId) {
    shell(); ui.bid = bid; ui.view = 'welcome'; var p = packOf(bid), b = boardById(bid);
    ui.el.style.setProperty('--c', colorOf(bid)); head(b ? b.title : 'My World', null);
    ui.body.innerHTML = cover(bid) + '<div class="st-ready"><b>Your World Is Ready.</b><span>' + esc(b ? b.title : '') + ' — start small; add more whenever you like.</span></div>' +
      '<div class="st-big"><button type="button" class="st-go" data-explore>Explore My World</button><button type="button" class="st-go" style="background:rgba(255,255,255,.1)" data-add>' + ICON.plus + esc(p && p.quickAdd ? p.quickAdd.label : 'Add My First Thing') + '</button><button type="button" class="st-go" style="background:rgba(255,255,255,.1)" data-customize>Customize My World</button></div>';
  }
  // ---------------------------------------------------------------- the world home (its starter pack)
  function home(bid) {
    shell(); ui.bid = bid; ui.view = 'home'; var p = packOf(bid), b = boardById(bid); if (!b || !p) { close(); return toast('This world is not here any more.'); }
    ui.el.style.setProperty('--c', colorOf(bid)); head(b.title, null);
    var lists = []; (b.columns || []).forEach(function (c) { (c.cards || []).forEach(function (k) { if (k && k.id && !KN().isHeading(k.id)) lists.push(k.id); }); });
    var gal = p.gallery ? galleryItems(bid).length : 0;
    var tools = (p.discovery || []).filter(function (id) { return window.MinestDiscover && (['this-or-that', 'tier-list', 'tournament'].indexOf(id) >= 0 || (MinestDiscover._x && id === 'desert-island') || (id === 'connect-my-world' && window.MinestPhilo)); });
    var TN = { 'this-or-that': 'This or That', 'tier-list': 'Tier List', tournament: 'Tournament', 'desert-island': 'My Desert Island', 'connect-my-world': 'Connect My World' };
    ui.body.innerHTML = cover(bid) +
      (p.quickAdd ? '<button type="button" class="st-go" style="width:100%;margin-bottom:8px" data-add>' + ICON.plus + esc(p.quickAdd.label) + '</button>' : '') +
      '<div class="st-chips">' + (p.more || []).map(function (m, i) { return '<button type="button" class="st-chip" data-more="' + i + '">' + ICON.plus + esc(m.label) + '</button>'; }).join('') +
      (p.quickAdd && p.quickAdd.importText ? '<button type="button" class="st-chip" data-paste>Paste a recipe</button>' : '') +
      (p.pickers || []).map(function (k, i) { return '<button type="button" class="st-chip" data-pick="' + i + '">' + esc(k.label) + '</button>'; }).join('') + '</div>' +
      (p.gallery ? '<button type="button" class="st-row" style="margin-top:14px" data-gallery><div><b>' + esc(p.gallery.label) + '</b><small>' + gal + ' item' + (gal === 1 ? '' : 's') + ' with pictures and details</small></div><span>' + ICON.chev + '</span></button>' : '') +
      '<div class="st-h">My lists</div>' + lists.map(function (cid) { var n = itemsOf(bid, cid).length, L = locate(b, cid); return '<button type="button" class="st-row" data-list="' + esc(cid) + '" style="--c:' + esc(L.col.color || '#888') + '"><span class="dot"></span><div><b>' + esc(L.card.title) + '</b><small>' + esc(L.col.title) + '</small></div><em>' + (n || '') + '</em></button>'; }).join('') +
      (tools.length ? '<div class="st-h">Try with it</div><div class="st-chips">' + tools.map(function (id) { return '<button type="button" class="st-chip" data-tool="' + id + '">' + esc(TN[id]) + '</button>'; }).join('') + '</div><p class="st-note">These only record your choices — they never change your cards.</p>' : '') +
      '<div class="st-h">More</div><div class="st-chips"><button type="button" class="st-chip" data-explore>Explore My World</button><button type="button" class="st-chip" data-customize>Customize</button></div>' +
      (p.private ? '<p class="st-note">This world is private: its memories and people are never shared, and exports leave them out unless you confirm.</p>' : '');
  }
  function galleryItems(bid) {
    var p = packOf(bid), t = tplById(p.id), out = [], cids = [];
    ((p.gallery && p.gallery.lists) || []).forEach(function (pat) { (t ? listCards(bid, t, pat) : []).forEach(function (c) { if (cids.indexOf(c) < 0) cids.push(c); }); });
    cids.forEach(function (cid) { itemsOf(bid, cid).forEach(function (s) { out.push({ s: s, cid: cid }); }); });
    return out;
  }
  function tile(bid, s, cid) { var img = s.cover && (s.cover.value || s.cover.url), h = hash(s.title), a = h % 360; return '<div class="st-tile" data-item="' + esc(s.id) + '" data-in="' + esc(cid) + '"><div class="art" style="' + (img ? 'background-image:url(&quot;' + esc(img) + '&quot;)' : 'background:linear-gradient(155deg,hsl(' + a + ' 55% 48%),hsl(' + ((a + 60) % 360) + ' 60% 26%))') + '">' + (img ? '' : '<b>' + esc(s.title) + '</b>') + '</div>' + (img ? '<p>' + esc(s.title) + '</p>' : '') + '</div>'; }
  function gallery(bid) {
    shell(); ui.bid = bid; ui.view = 'gallery'; var p = packOf(bid); head(p.gallery.label, 'home');
    var all = galleryItems(bid);
    ui.body.innerHTML = all.length ? '<div class="st-grid">' + all.map(function (x) { return tile(bid, x.s, x.cid); }).join('') + '</div>' : '<p class="st-sub" style="margin-top:20px">Nothing here yet — add your first one.</p>';
    foot(p.quickAdd ? '<button type="button" class="st-go" data-add>' + ICON.plus + esc(p.quickAdd.label) + '</button>' : '');
  }
  function listView(bid, cid) {
    shell(); ui.bid = bid; ui.view = 'list'; ui.cid = cid; head(cardTitle(bid, cid), 'home');
    var its = itemsOf(bid, cid);
    ui.body.innerHTML = its.length ? '<div class="st-grid">' + its.map(function (s) { return tile(bid, s, cid); }).join('') + '</div>' : '<p class="st-sub" style="margin-top:20px">Empty for now.</p>';
    foot('<button type="button" class="st-go" data-addto="' + esc(cid) + '">' + ICON.plus + 'Add</button>');
  }
  // ---------------------------------------------------------------- the form (all field types)
  function openForm(o) {
    shell(); var bid = o.bid; var t = targetsFor(o); if (!t.length) return toast('No list for this in your world any more.');
    ui.form = { bid: bid, cids: t, cid: o.cid && t.indexOf(o.cid) >= 0 ? o.cid : t[0], sid: o.sid || null, title: o.title || '', v: o.v || {}, label: o.label || 'Add', titleLabel: o.titleLabel || 'Title', back: o.back || 'home' };
    drawForm();
  }
  function targetsFor(o) { if (o.cid && !o.pats) return [o.cid]; var p = packOf(o.bid); return p ? targets(o.bid, p, o.pats || []) : []; }
  function drawForm() {
    var F = ui.form, defs = fieldsFor(F.bid, F.cid); ui.view = 'form'; head(F.sid ? 'Edit' : F.label, F.back);
    var h = '<div class="st-f"><label>' + esc(F.titleLabel) + '</label><input class="st-in" data-ft value="' + esc(F.title) + '" maxlength="120" autocomplete="off"></div>';
    if (F.cids.length > 1 && !F.sid) h += '<div class="st-f"><label>Which list</label><div class="st-chips">' + F.cids.map(function (c) { return '<button type="button" class="st-chip' + (c === F.cid ? ' on' : '') + '" data-fcid="' + esc(c) + '">' + esc(cardTitle(F.bid, c)) + '</button>'; }).join('') + '</div></div>';
    defs.forEach(function (f) { h += fieldHtml(f, F.v[f.id]); });
    if (!defs.length) h += '<div class="st-f"><label>Note</label><textarea class="st-in" data-fv="note">' + esc(F.v.note || '') + '</textarea></div>';
    ui.body.innerHTML = h;
    foot((F.sid ? '' : '') + '<button type="button" class="st-go" data-fsave>' + (F.sid ? 'Save' : 'Add') + '</button>');
  }
  function fieldHtml(f, v) {
    var lab = '<label>' + esc(f.label) + (f.hint ? ' <small>· ' + esc(f.hint) + '</small>' : '') + '</label>', k = esc(f.id);
    switch (f.type) {
      case 'image': return '<div class="st-f">' + lab + '<div class="st-photo">' + (v ? '<img alt="" src="' + esc(v) + '">' : '') + '<button type="button" class="st-chip" data-fphoto="' + k + '">' + ICON.photo + (v ? 'Change' : 'Add a picture') + '</button>' + (v ? '<button type="button" class="st-chip" data-fnophoto="' + k + '">Remove</button>' : '') + '</div></div>';
      case 'number': return '<div class="st-f">' + lab + '<input class="st-in" data-fv="' + k + '" inputmode="decimal" value="' + esc(v == null ? '' : v) + '"></div>';
      case 'url': return '<div class="st-f">' + lab + '<input class="st-in" data-fv="' + k + '" type="url" placeholder="https://…" value="' + esc(v || '') + '"></div>';
      case 'date': v = v || {}; return '<div class="st-f">' + lab + '<div class="st-date"><input class="st-in y" data-fdy="' + k + '" inputmode="numeric" placeholder="Year" value="' + esc(v.y || '') + '"><input class="st-in" data-fdm="' + k + '" inputmode="numeric" placeholder="Month" value="' + esc(v.m || '') + '"><input class="st-in" data-fdd="' + k + '" inputmode="numeric" placeholder="Day" value="' + esc(v.d || '') + '"></div></div>';
      case 'boolean': return '<div class="st-f" style="display:flex;align-items:center;justify-content:space-between">' + lab.replace('<label>', '<label style="margin:0">') + '<button type="button" class="st-sw' + (v ? ' on' : '') + '" data-fbool="' + k + '" aria-pressed="' + !!v + '"></button></div>';
      case 'select': return '<div class="st-f">' + lab + '<div class="st-chips">' + (f.options || []).map(function (o) { return '<button type="button" class="st-chip' + (v === o ? ' on' : '') + '" data-fsel="' + k + '" data-o="' + esc(o) + '">' + esc(o) + '</button>'; }).join('') + '</div></div>';
      case 'multiselect': v = v || []; return '<div class="st-f">' + lab + '<div class="st-chips">' + (f.options || []).map(function (o) { return '<button type="button" class="st-chip' + (v.indexOf(o) >= 0 ? ' on' : '') + '" data-fmul="' + k + '" data-o="' + esc(o) + '">' + esc(o) + '</button>'; }).join('') + '</div></div>';
      case 'ref': v = v || []; return '<div class="st-f">' + lab + '<div class="st-chips">' + v.map(function (r, i) { return '<button type="button" class="st-chip on" data-fref="' + k + '" data-i="' + i + '">' + esc(refTitle(ui.form.bid, r)) + ' ×</button>'; }).join('') + '<button type="button" class="st-chip" data-fadd="' + k + '">' + ICON.plus + 'Add</button></div></div>';
      default: return '<div class="st-f">' + lab + (f.multiline ? '<textarea class="st-in" data-fv="' + k + '">' + esc(v || '') + '</textarea>' : '<input class="st-in" data-fv="' + k + '" value="' + esc(v || '') + '">') + '</div>';
    }
  }
  function keepForm() {
    var F = ui.form; if (!F || !ui.body) return; var t = ui.body.querySelector('[data-ft]'); if (t) F.title = t.value;
    ui.body.querySelectorAll('[data-fv]').forEach(function (e) { var id = e.getAttribute('data-fv'), def = fieldsFor(F.bid, F.cid).filter(function (f) { return f.id === id; })[0]; F.v[id] = def && def.type === 'number' ? (e.value.trim() === '' ? null : Number(e.value)) : e.value; });
    ui.body.querySelectorAll('[data-fdy]').forEach(function (e) { var id = e.getAttribute('data-fdy'), y = parseInt(e.value, 10), m = parseInt(ui.body.querySelector('[data-fdm="' + id + '"]').value, 10), d = parseInt(ui.body.querySelector('[data-fdd="' + id + '"]').value, 10); F.v[id] = isFinite(y) && y > 0 ? { y: y, m: m >= 1 && m <= 12 ? m : undefined, d: m >= 1 && m <= 12 && d >= 1 && d <= 31 ? d : undefined } : null; if (F.v[id]) { if (!F.v[id].m) delete F.v[id].m; if (!F.v[id].d) delete F.v[id].d; } });
  }
  function submit() {
    keepForm(); var F = ui.form, title = String(F.title || '').replace(/\s+/g, ' ').trim();
    if (!title) { toast('Give it a name first.'); var t = ui.body.querySelector('[data-ft]'); if (t) t.focus(); return; }
    var v = {}; Object.keys(F.v).forEach(function (k) { var x = F.v[k]; if (x == null || x === '' || (Array.isArray(x) && !x.length)) return; v[k] = typeof x === 'string' ? x.trim() : x; });
    var btn = ui.foot.querySelector('[data-fsave]'); if (btn) btn.disabled = true;
    saveItem(F.bid, F.cid, F.sid, title, v).then(function (sid) { toast(F.sid ? 'Saved' : 'Added to ' + cardTitle(F.bid, F.cid)); var back = F.back; ui.form = null; detail(F.bid, sid, back === 'home' ? 'home' : back); }).catch(function (e) { toast('✗ ' + e.message); if (btn) btn.disabled = false; });
  }
  // a reference field: pick from its lists, or add a new one there
  function refPicker(fid) {
    keepForm(); var F = ui.form, def = fieldsFor(F.bid, F.cid).filter(function (f) { return f.id === fid; })[0], f0 = fdOf(F.bid), L0 = f0 && f0.lists[F.cid], t = tplById((L0 && L0.tpl) || (packOf(F.bid) || {}).id);
    var cids = []; if (t) (def.refLists || []).forEach(function (pat) { listCards(F.bid, t, pat).forEach(function (c) { if (cids.indexOf(c) < 0) cids.push(c); }); });
    if (!cids.length) { var bb = boardById(F.bid); (bb.columns || []).forEach(function (c) { (c.cards || []).forEach(function (k) { if (!KN().isHeading(k.id) && k.id !== F.cid) cids.push(k.id); }); }); }
    var newIn = def.newIn && t ? listCards(F.bid, t, def.newIn)[0] || cids[0] : cids[0];
    ui.ref = { fid: fid, cids: cids, newIn: newIn }; ui.view = 'ref'; head(def.label, 'form');
    var cur = (F.v[fid] || []).map(function (r) { return r.id; });
    ui.body.innerHTML = '<div class="st-f"><label>New</label><div style="display:flex;gap:8px"><input class="st-in" data-rnew placeholder="A name…" maxlength="80"><button type="button" class="st-chip on" data-rmake>Add</button></div>' +
      (cids.length > 1 ? '<div class="st-chips" style="margin-top:8px">' + cids.map(function (c) { return '<button type="button" class="st-chip' + (c === newIn ? ' on' : '') + '" data-rin="' + esc(c) + '">' + esc(cardTitle(F.bid, c)) + '</button>'; }).join('') + '</div>' : '') + '</div>' +
      cids.map(function (c) { var its = itemsOf(F.bid, c); return its.length ? '<div class="st-h">' + esc(cardTitle(F.bid, c)) + '</div><div class="st-chips">' + its.map(function (s) { return '<button type="button" class="st-chip' + (cur.indexOf(s.id) >= 0 ? ' on' : '') + '" data-rpick="' + esc(s.id) + '">' + esc(s.title) + '</button>'; }).join('') + '</div>' : ''; }).join('');
    foot('<button type="button" class="st-go" data-rdone>Done</button>');
  }
  // ---------------------------------------------------------------- one item
  function detail(bid, sid, back) {
    shell(); ui.bid = bid; ui.view = 'detail'; ui.sid = sid; ui.detBack = back || 'home';
    var b = boardById(bid), L = b && locate(b, sid); if (!L) return home(bid);
    var s = L.item, v = valuesOf(bid, sid), defs = fieldsFor(bid, L.card.id), pic = v[imageField(defs) || 'photo'] || v.photo; head(s.title, ui.detBack);
    var h = '<div class="st-det">' + (pic ? '<img alt="" src="' + esc(pic) + '">' : '') + '<h3>' + esc(s.title) + '</h3><p class="st-sub">' + esc(L.card.title + ' · ' + L.col.title) + '</p>';
    defs.forEach(function (f) {
      var x = v[f.id]; if (f.type === 'image' || x == null || x === '' || (Array.isArray(x) && !x.length)) return;
      var body;
      if (f.type === 'text' && f.multiline) { var ls = String(x).split('\n').map(function (l) { return l.trim(); }).filter(Boolean); body = f.id === 'steps' ? '<ol>' + ls.map(function (l) { return '<li>' + esc(l.replace(/^\d+[.)]\s*/, '')) + '</li>'; }).join('') + '</ol>' : f.id === 'ingredients' ? '<ul>' + ls.map(function (l) { return '<li>' + esc(l.replace(/^[-•*]\s*/, '')) + '</li>'; }).join('') + '</ul>' : '<div>' + esc(x) + '</div>'; }
      else if (f.type === 'date') body = '<div>' + esc(dateText(x)) + '</div>';
      else if (f.type === 'boolean') body = '<div>Yes</div>';
      else if (f.type === 'multiselect') body = '<div>' + esc(x.join(', ')) + '</div>';
      else if (f.type === 'url') body = '<div><a href="' + esc(x) + '" target="_blank" rel="noopener" style="color:#64d2ff;word-break:break-all">' + esc(x) + '</a></div>';
      else if (f.type === 'ref') body = '<div class="st-chips">' + x.map(function (r) { return '<button type="button" class="st-chip" data-goitem="' + esc(r.id) + '">' + esc(refTitle(bid, r)) + '</button>'; }).join('') + '</div>';
      else body = '<div>' + esc(x) + '</div>';
      h += '<div class="st-kv"><b>' + esc(f.label) + '</b>' + body + '</div>';
    });
    var ms = mentions(bid, sid); if (ms.length) h += '<div class="st-kv"><b>In</b><div class="st-chips">' + ms.map(function (m) { return '<button type="button" class="st-chip" data-goitem="' + esc(m.id) + '">' + esc(m.title) + '</button>'; }).join('') + '</div></div>';
    if (!defs.length && s.desc) h += '<div class="st-kv"><div>' + esc(s.desc) + '</div></div>';
    ui.body.innerHTML = h + '</div>';
    foot('<button type="button" class="st-go sec" data-opencard>Open the card</button><button type="button" class="st-go" data-edit>' + ICON.edit + 'Edit</button>');
  }

  // ================================================================== clicks
  function onClick(e) {
    var t = e.target, g, F = ui.form;
    if (t.closest('[data-x]')) return close();
    if ((g = t.closest('[data-back]'))) { var bk = g.getAttribute('data-back'); if (bk === 'home') return home(ui.bid); if (bk === 'gallery') return gallery(ui.bid); if (bk === 'form') return drawForm(); if (/^list:/.test(bk)) return listView(ui.bid, bk.slice(5)); if (/^item:/.test(bk)) return detail(ui.bid, bk.slice(5), 'home'); return home(ui.bid); }
    if (t.closest('[data-explore]')) { var bid = ui.bid, p = packOf(bid); close(); setTimeout(function () { try { if (A().selectBoard) A().selectBoard(bid); } catch (x) {} setTimeout(function () { var ex = p && p.explore; if (ex === 'timeline' && window.MinestTimeline) MinestTimeline.open(bid); else if (ex === 'contents' && window.MinestContents) MinestContents.open(); else if (ex === 'map' && window.MinestMap) MinestMap.open(bid); else if (ex === 'kanban') {} else if (window.MinestWiki) MinestWiki.open(bid); }, 250); }, 200); return; }
    if (t.closest('[data-customize]')) { var bid2 = ui.bid; close(); setTimeout(function () { if (window.MinestBuilder && MinestBuilder.open) MinestBuilder.open(bid2); else { try { if (A().selectBoard) A().selectBoard(bid2); } catch (x) {} setTimeout(function () { if (window.MinestEndless) MinestEndless.open(bid2); }, 250); } }, 200); return; }
    if (t.closest('[data-add]')) { var p1 = packOf(ui.bid); return openForm({ bid: ui.bid, pats: p1.quickAdd.targets, label: p1.quickAdd.label, titleLabel: p1.quickAdd.titleLabel, back: ui.view === 'gallery' ? 'gallery' : 'home' }); }
    if ((g = t.closest('[data-more]'))) { var m = packOf(ui.bid).more[+g.getAttribute('data-more')]; return openForm({ bid: ui.bid, pats: m.targets, label: m.label, titleLabel: m.titleLabel }); }
    if ((g = t.closest('[data-addto]'))) return openForm({ bid: ui.bid, cid: g.getAttribute('data-addto'), label: 'Add to ' + cardTitle(ui.bid, g.getAttribute('data-addto')), back: 'list:' + g.getAttribute('data-addto') });
    if (t.closest('[data-paste]')) return pasteRecipe();
    if ((g = t.closest('[data-pick]'))) { var k = packOf(ui.bid).pickers[+g.getAttribute('data-pick')], tp = tplById(packOf(ui.bid).id), cid = tp && listCards(ui.bid, tp, k.target)[0]; if (!cid || !window.MinestPicker) return; var bb = ui.bid; close(); setTimeout(function () { MinestPicker.open({ bid: bb, cardId: cid, catalog: k.catalog }); }, 200); return; }
    if (t.closest('[data-gallery]')) return gallery(ui.bid);
    if ((g = t.closest('[data-list]'))) return listView(ui.bid, g.getAttribute('data-list'));
    if ((g = t.closest('[data-tool]')) && g.getAttribute('data-tool') === 'connect-my-world') { close(); setTimeout(function () { MinestPhilo.open('connect-my-world'); }, 200); return; }
    if ((g = t.closest('[data-tool]'))) { var tool = g.getAttribute('data-tool'), b3 = ui.bid, gi = galleryItems(b3), first = gi[0]; close(); setTimeout(function () { if (window.MinestDiscover) MinestDiscover.open(first ? { bid: b3, cardId: first.cid, tool: tool } : {}); }, 200); return; }
    if ((g = t.closest('[data-item]'))) return detail(ui.bid, g.getAttribute('data-item'), ui.view === 'gallery' ? 'gallery' : ui.view === 'list' ? 'list:' + ui.cid : 'home');
    if ((g = t.closest('[data-goitem]'))) return detail(ui.bid, g.getAttribute('data-goitem'), 'item:' + ui.sid);
    if (t.closest('[data-edit]')) { var b4 = boardById(ui.bid), L = locate(b4, ui.sid); return openForm({ bid: ui.bid, cid: L.card.id, sid: ui.sid, title: L.item.title, v: valuesOf(ui.bid, ui.sid), label: 'Edit', back: 'item:' + ui.sid }); }
    if (t.closest('[data-opencard]')) { var b5 = boardById(ui.bid), L5 = locate(b5, ui.sid), bid5 = ui.bid; close(); setTimeout(function () { try { A().openCardIn(bid5, L5.col.id, L5.card.id); } catch (x) {} }, 220); return; }
    // the form
    if (ui.view === 'form') {
      if ((g = t.closest('[data-fcid]'))) { keepForm(); F.cid = g.getAttribute('data-fcid'); return drawForm(); }
      if ((g = t.closest('[data-fphoto]'))) { F.imgKey = g.getAttribute('data-fphoto') || 'photo'; return ui.file.click(); }
      if ((g = t.closest('[data-fnophoto]'))) { keepForm(); delete F.v[g.getAttribute('data-fnophoto') || 'photo']; return drawForm(); }
      if ((g = t.closest('[data-fbool]'))) { keepForm(); var id = g.getAttribute('data-fbool'); F.v[id] = !F.v[id]; return keepScroll(drawForm); }
      if ((g = t.closest('[data-fsel]'))) { keepForm(); var id2 = g.getAttribute('data-fsel'), o = g.getAttribute('data-o'); F.v[id2] = F.v[id2] === o ? null : o; return keepScroll(drawForm); }
      if ((g = t.closest('[data-fmul]'))) { keepForm(); var id3 = g.getAttribute('data-fmul'), o3 = g.getAttribute('data-o'), arr = (F.v[id3] || []).slice(), at = arr.indexOf(o3); if (at >= 0) arr.splice(at, 1); else arr.push(o3); F.v[id3] = arr; return keepScroll(drawForm); }
      if ((g = t.closest('[data-fref]'))) { keepForm(); var id4 = g.getAttribute('data-fref'); F.v[id4] = (F.v[id4] || []).filter(function (x, i) { return i !== +g.getAttribute('data-i'); }); return keepScroll(drawForm); }
      if ((g = t.closest('[data-fadd]'))) return refPicker(g.getAttribute('data-fadd'));
      if (t.closest('[data-fsave]')) return submit();
    }
    if (ui.view === 'ref') {
      var R = ui.ref;
      if ((g = t.closest('[data-rin]'))) { R.newIn = g.getAttribute('data-rin'); ui.body.querySelectorAll('[data-rin]').forEach(function (x) { x.classList.toggle('on', x === g); }); return; }
      if ((g = t.closest('[data-rpick]'))) { var sid = g.getAttribute('data-rpick'), arr2 = (F.v[R.fid] || []).slice(), at2 = arr2.findIndex(function (x) { return x.id === sid; }); if (at2 >= 0) arr2.splice(at2, 1); else arr2.push({ id: sid, title: g.textContent }); F.v[R.fid] = arr2; g.classList.toggle('on'); return; }
      if (t.closest('[data-rmake]')) {
        var inp = ui.body.querySelector('[data-rnew]'), name = String(inp.value || '').trim(); if (!name || !R.newIn) return;
        var dup = itemsOf(F.bid, R.newIn).filter(function (s) { return s.title.toLowerCase() === name.toLowerCase(); })[0];
        var go = dup ? Promise.resolve(dup.id) : saveItem(F.bid, R.newIn, null, name, {});
        go.then(function (nid) { F.v[R.fid] = (F.v[R.fid] || []).concat([{ id: nid, title: name }]); toast(dup ? 'Already there — added' : 'Added ' + name + ' to ' + cardTitle(F.bid, R.newIn)); refPicker(R.fid); });
        return;
      }
      if (t.closest('[data-rdone]')) return drawForm();
    }
    if (ui.view === 'paste' && t.closest('[data-pdo]')) {
      var txt = ui.body.querySelector('[data-ptext]').value, r = parseRecipe(txt); if (!r.title) return toast('Paste a recipe first.');
      var p2 = packOf(ui.bid); return openForm({ bid: ui.bid, pats: p2.quickAdd.targets, label: p2.quickAdd.label, titleLabel: p2.quickAdd.titleLabel, title: r.title, v: { ingredients: r.ingredients.join('\n'), steps: r.steps.join('\n'), source: r.source } });
    }
  }
  function keepScroll(fn) { var y = ui.body.scrollTop; fn(); ui.body.scrollTop = y; }
  function pasteRecipe() {
    ui.view = 'paste'; head('Paste a recipe', 'home');
    ui.body.innerHTML = '<p class="st-sub">Paste the text of a recipe — the name first, then the ingredients and the steps. You check everything before it is saved. (Links are kept as the source; nothing is fetched from the web.)</p><textarea class="st-in" data-ptext style="min-height:46vh" placeholder="Pancakes&#10;&#10;Ingredients&#10;- 1 cup flour&#10;- 1 egg&#10;&#10;Steps&#10;1. Mix&#10;2. Cook"></textarea>';
    foot('<button type="button" class="st-go" data-pdo>Read it</button>');
  }

  // open a starter world at its home when a world with a pack is opened
  window.MinestStarter = { install: install, has: has, home: function (bid) { home(bid); }, welcome: function (bid) { welcome(bid); }, open: function (o) { o = o || {}; if (o.add) openForm({ bid: o.bid, pats: packOf(o.bid).quickAdd.targets, label: packOf(o.bid).quickAdd.label, titleLabel: packOf(o.bid).quickAdd.titleLabel }); else home(o.bid); }, close: close, isOpen: function () { return ui.open; },
    fieldsFor: fieldsFor, valuesOf: valuesOf, saveItem: saveItem, parseRecipe: parseRecipe, mentions: mentions, listCards: listCards, _detail: detail, _gallery: gallery };
})();

/* Card 02 · Framework Card — structure.
   An editable outline that organises the object's knowledge. Built from a template (tools/toolkit/data/templates.json),
   optionally pre-filled with Minest's starter content for well-known concepts (data/seeds.json, review pending).
   Every item under a concept section IS a concept of the shared store (found by name, never duplicated), and its place
   in the outline is a typed relation (the section says which: belongs-to, applies-to, influences, refutes …), tagged
   source_ref 'fwi:<framework>:<node>' so the Graph can say where a link came from. Moving a node re-types its link;
   deleting it removes only the links this framework made. Views: Outline (edit) · Tree · Levels · Cards. */
(function () {
  'use strict';
  var TK = window.MinestToolkit, esc = TK.esc;
  function rid() { return Date.now().toString(36) + Math.random().toString(36).slice(2, 6); }

  function tpl(id) { return TK.data.templates.filter(function (t) { return t.id === id; })[0]; }
  function kids(fi, pid) { return fi.nodes.filter(function (n) { return n.parent === pid; }).sort(function (a, b) { return a.order - b.order; }); }
  function node(fi, id) { return fi.nodes.filter(function (n) { return n.id === id; })[0]; }
  function rootOf(fi) { return fi.nodes.filter(function (n) { return n.role === 'root'; })[0]; }
  function sectionOf(fi, n) { var p = n; while (p && p.role !== 'section') { p = node(fi, p.parent); } return p || null; }
  function descendants(fi, id) { var out = []; kids(fi, id).forEach(function (k) { out.push(k); out = out.concat(descendants(fi, k.id)); }); return out; }
  function depth(fi, n) { var d = 0, p = n; while (p && p.parent) { d++; p = node(fi, p.parent); } return d; }
  function isConceptNode(fi, n) { if (n.role !== 'item') return false; var s = sectionOf(fi, n); return !s || s.kind !== 'text'; }

  // ------------------------------------------------------------------ concept + relation sync for one node
  function sync(fi, n) {
    if (n.role !== 'item') return;   // the root keeps its topic concept; sections are structure only
    var ks = TK.ks, src = 'fwi:' + fi.id + ':' + n.id;
    ks.relations({ source: src }).forEach(function (r) { if (r.source_ref === src || r.source_ref.indexOf(src + ':') === 0) ks.unrelate(r.id); });
    if (!isConceptNode(fi, n)) { if (n.concept_id) { var old = n.concept_id; n.concept_id = null; ks.maybeDrop(fi.ko, old); } return; }
    var sec = sectionOf(fi, n), kind = (sec && sec.kind && sec.kind !== 'text') ? sec.kind : 'concept';
    if (!n.label.trim()) return;
    var prev = n.concept_id, cid = ks.concept(n.label.trim(), { kind: kind, provenance: n.provenance || 'user', review: n.review || null });
    n.concept_id = cid; ks.addToObject(fi.ko, cid);
    var parent = node(fi, n.parent), root = rootOf(fi), rootC = root && root.concept_id;
    var rel = null, from = 'cc:' + cid, to = null;
    if (parent && parent.role === 'item' && parent.concept_id) { rel = 'belongs-to'; to = 'cc:' + parent.concept_id; }
    else if (parent && parent.role === 'section' && rootC) { rel = parent.rel || 'related'; to = 'cc:' + rootC; if (parent.dir === 'root-item') { var t = from; from = to; to = t; } }
    else if (rootC) { rel = 'related'; to = 'cc:' + rootC; }
    if (rel && to) ks.relate(from, to, rel, { ko: fi.ko, provenance: n.provenance || 'user', review: n.review || null, source_ref: src, note: sec ? 'In ‘' + fi.title + '’ › ' + sec.label : 'In ‘' + fi.title + '’' });
    (n.refs || []).forEach(function (r) { if (r !== cid) ks.relate('cc:' + cid, 'cc:' + r, 'related', { ko: fi.ko, provenance: 'user', source_ref: src + ':ref', note: 'Cross-reference in ‘' + fi.title + '’' }); });
    if (prev && prev !== cid) ks.maybeDrop(fi.ko, prev);
  }

  // ------------------------------------------------------------------ build an instance from a template (+ seed)
  function build(ko, t, useSeed) {
    var ks = TK.ks, seed = useSeed ? TK.data.seeds.filter(function (s) { return s.id === ko.seed && s.template === t.id; })[0] : null;
    var fi = { id: rid(), ko: ko.id, template_id: t.id, title: t.title, view: 'outline', nodes: [] };
    var rootC = ko.root_concept || ks.concept(TK.rootLabel(ko), { kind: 'concept' });
    if (!ko.root_concept) ks.updateObject(ko.id, { root_concept: rootC });
    ks.addToObject(ko.id, rootC);
    var root = { id: rid(), role: 'root', label: ks.label(rootC), concept_id: rootC, parent: null, order: 0 };
    fi.nodes.push(root);
    t.sections.forEach(function (s, i) {
      var sec = { id: rid(), role: 'section', label: s.label, key: s.key, kind: s.kind, rel: s.rel, dir: s.dir, hint: s.hint || '', parent: root.id, order: i };
      fi.nodes.push(sec);
      var fill = seed && seed.fill[s.key];
      (fill || []).forEach(function (f, k) {
        var lab = typeof f === 'string' ? f : (f.en || f.zh);
        var n = { id: rid(), role: 'item', label: lab, parent: sec.id, order: k, provenance: 'library', review: seed.review || null };
        fi.nodes.push(n);
        if (typeof f === 'object' && f.zh && s.kind !== 'text') n.zh = f.zh;
      });
    });
    TK.silently(function () {
      ks.saveFramework(fi);
      fi.nodes.forEach(function (n) { if (n.zh) { n.concept_id = ks.concept({ en: n.label, zh: n.zh }, { kind: (sectionOf(fi, n) || {}).kind || 'concept', provenance: 'library', review: n.review }); } sync(fi, n); });
      if (seed) (seed.relations || []).forEach(function (r) {
        var a = ks.findConcept(r[0]), b = ks.findConcept(r[2]);
        if (a && b) ks.relate('cc:' + a.id, 'cc:' + b.id, r[1], { ko: ko.id, provenance: 'library', review: seed.review || null, source_ref: 'fwi:' + fi.id + ':seed', note: 'Minest starter content' });
      });
      ks.saveFramework(fi);
    });
    return fi;
  }

  TK.frameworkOps = { build: build, sync: sync, kids: kids, rootOf: rootOf };   // for tests and future hosts
  TK.card({
    id: 'framework', en: 'Framework Card', zh: '知识框架卡', color: '#5e9cff', line: 'Organise ideas into a structure you can edit.',
    icon: TK.icon('<rect x="9" y="3" width="6" height="4" rx="1"/><rect x="3" y="17" width="6" height="4" rx="1"/><rect x="15" y="17" width="6" height="4" rx="1"/><path d="M12 7v5M6 17v-2.5h12V17"/>'),
    preview: function (ko) {
      var fs = TK.ks.frameworksOf(ko.id);
      if (!fs.length) { var sd = ko.seed && TK.data.seeds.filter(function (s) { return s.id === ko.seed; })[0]; return '<span class="dim">' + (sd ? 'Starter structure ready: ' + esc(tpl(sd.template).title) : 'Start from a template') + '</span>'; }
      var f = fs[0], secs = kids(f, rootOf(f).id).slice(0, 4);
      return '<span class="pv-list">' + secs.map(function (s) { return '<i>' + esc(s.label.split(' — ')[0]) + ' <small>' + kids(f, s.id).length + '</small></i>'; }).join('') + '</span><span class="dim">' + fs.length + ' framework' + (fs.length > 1 ? 's' : '') + ' · ' + f.nodes.filter(function (n) { return n.role === 'item'; }).length + ' items</span>';
    },
    mount: function (el, ko, opts) {
      var ks = TK.ks, fi = null, sel = null, collapsed = {};
      el.innerHTML = '<div class="fw-wrap"><aside class="fw-side"><h3>Frameworks</h3><div class="fw-list"></div><button type="button" class="primary" data-new>+ New framework</button>' +
        '<h3>Notes from other cards</h3><div class="fw-notes"></div></aside><section class="fw-main"></section></div><div class="fw-modal" hidden></div>';
      var list = el.querySelector('.fw-list'), main = el.querySelector('.fw-main'), notes = el.querySelector('.fw-notes'), modal = el.querySelector('.fw-modal');

      function load() {
        var fs = ks.frameworksOf(ko.id);
        if (!fi || !ks.framework(fi.id)) fi = fs[0] || null; else fi = ks.framework(fi.id);
        list.innerHTML = fs.map(function (f) { var t = tpl(f.template_id); return '<button type="button" class="fw-li' + (fi && f.id === fi.id ? ' on' : '') + '" data-fi="' + f.id + '"><b>' + esc(f.title) + '</b><small>' + f.nodes.filter(function (n) { return n.role === 'item'; }).length + ' items' + (t && t.review ? ' · review pending' : '') + '</small></button>'; }).join('') || '<p class="dim">No framework yet.</p>';
        var ns = (ks.object(ko.id).notes || []);
        notes.innerHTML = ns.length ? ns.slice().reverse().map(function (n) { return '<div class="fw-note"><p>' + esc(n.text) + '</p><small class="dim">from ' + esc(n.from) + '</small>' + (fi ? '<button type="button" class="small" data-notein="' + n.id + '">Add to framework</button>' : '') + '</div>'; }).join('') : '<p class="dim">Understandings saved in the Lab or Models appear here.</p>';
        if (!fi) return chooser(true);
        paint();
      }
      function save() { TK.silently(function () { ks.saveFramework(fi); }); }   // this card repaints itself; other cards read the store when shown

      // ---------------------------------------------------------------- template chooser
      function chooser(inline) {
        var seed = ko.seed && TK.data.seeds.filter(function (s) { return s.id === ko.seed; })[0];
        var h = '<div class="fw-choose"><h3>Choose a framework template</h3><p class="dim">Each template is a starting structure — every node can be renamed, moved or deleted. Philosophy templates say what they are and what they are not.</p>' +
          (seed ? '<label class="fw-seed"><input type="checkbox" checked data-useseed> Start with Minest’s starter content for “' + esc(TK.rootLabel(ks.object(ko.id))) + '” <span class="pill sug">review pending</span></label>' : '') +
          '<div class="fw-tpls">' + TK.data.templates.map(function (t) {
            var rec = seed && seed.template === t.id;
            return '<button type="button" class="fw-tpl' + (rec ? ' rec' : '') + '" data-tpl="' + t.id + '"><b>' + esc(t.title) + (rec ? ' <span class="pill ok">fits</span>' : '') + (t.review ? ' <span class="pill sug">review pending</span>' : '') + '</b><span>' + esc(t.scope) + '</span><em>' + esc(t.caution) + '</em>' + (t.source ? '<small>' + esc(t.source) + '</small>' : '') + '</button>';
          }).join('') + '</div>' + (inline ? '' : '<button type="button" data-close>Cancel</button>') + '</div>';
        if (inline) { main.innerHTML = h; } else { modal.innerHTML = '<div class="fw-modal-card">' + h + '</div>'; modal.hidden = false; }
      }
      function pick(id, host) {
        var t = tpl(id), useSeed = !!(host.querySelector('[data-useseed]') && host.querySelector('[data-useseed]').checked);
        fi = build(ks.object(ko.id), t, useSeed); modal.hidden = true; TK.toast('“' + t.title + '” created'); load();
      }

      // ---------------------------------------------------------------- views
      function paint() {
        var t = tpl(fi.template_id) || {};
        main.innerHTML = '<header class="fw-hd"><input class="fw-title" value="' + esc(fi.title) + '" aria-label="Framework name"><div class="fw-views">' +
          [['outline', 'Outline'], ['tree', 'Tree'], ['levels', 'Levels'], ['cards', 'Cards']].map(function (v) { return '<button type="button" data-view="' + v[0] + '" class="' + (fi.view === v[0] ? 'on' : '') + '">' + v[1] + '</button>'; }).join('') +
          '</div><button type="button" class="ghost small" data-delfw>Delete framework</button></header>' +
          (t.caution ? '<p class="fw-caution">' + (t.review ? '<span class="pill sug">review pending</span> ' : '') + esc(t.caution) + (t.source ? ' <span class="dim">· ' + esc(t.source) + '</span>' : '') + '</p>' : '') +
          '<div class="fw-body"></div>';
        var body = main.querySelector('.fw-body');
        if (fi.view === 'tree') tree(body); else if (fi.view === 'levels') levels(body); else if (fi.view === 'cards') cards(body); else outline(body);
        if (opts && opts.concept) { var hit = fi.nodes.filter(function (n) { return n.concept_id === opts.concept; })[0]; opts.concept = null; if (hit) { sel = hit.id; focusRow(hit.id); } }
      }
      function badge(n) {
        if (n.role === 'root') return '<span class="fw-k k-root">Topic</span>';
        if (n.role === 'section') return '';
        var s = sectionOf(fi, n), k = s && s.kind !== 'text' ? s.kind : (s ? 'text' : 'concept');
        return (k === 'text' ? '' : '<span class="fw-k k-' + k + '">' + esc(ks.KINDS[k] || k) + '</span>') + (n.provenance === 'library' ? '<span class="fw-k k-lib" title="Minest starter content — review pending">Minest</span>' : '');
      }
      function outline(body) {
        var rows = [];
        (function walk(pid, d) { kids(fi, pid).forEach(function (n) { rows.push([n, d]); if (!collapsed[n.id]) walk(n.id, d + 1); }); })(null, 0);
        body.innerHTML = '<div class="fw-outline" role="tree">' + rows.map(function (x) {
          var n = x[0], d = x[1], has = kids(fi, n.id).length, refs = (n.refs || []).map(function (r) { return '<span class="fw-ref">↗ ' + esc(ks.label(r)) + '</span>'; }).join('');
          return '<div class="fw-row r-' + n.role + (sel === n.id ? ' sel' : '') + '" data-id="' + n.id + '" style="--d:' + d + '" role="treeitem" aria-expanded="' + (has ? !collapsed[n.id] : '') + '">' +
            (n.role === 'root' ? '<span class="fw-h"></span>' : '<span class="fw-h" data-drag title="Drag to move">⋮⋮</span>') +
            '<button type="button" class="fw-tg" data-tg' + (has ? '' : ' disabled') + '>' + (has ? (collapsed[n.id] ? '▸' : '▾') : '·') + '</button>' +
            '<input class="fw-in" value="' + esc(n.label) + '" placeholder="' + esc(n.role === 'section' ? 'Section' : (n.hint || 'Type…')) + '" aria-label="Node">' + badge(n) + refs +
            '<span class="fw-act"><button type="button" title="Add inside" data-add>＋</button>' + (n.role !== 'root' ? '<button type="button" title="Link to another concept" data-ref>↗</button><button type="button" title="Move up" data-up>↑</button><button type="button" title="Move down" data-down>↓</button><button type="button" title="Indent" data-in>→</button><button type="button" title="Outdent" data-out>←</button><button type="button" title="Delete" data-del>✕</button>' : '') + '</span></div>';
        }).join('') + '</div><p class="dim fw-tip">Enter: new item · Tab / Shift-Tab: indent · drag ⋮⋮ to move (drop on the right half of a row to put it inside) · items under a section become concepts shared with every card.</p>';
      }
      function tree(body) {
        var W = 0, rows = 0, pos = {};
        (function lay(n, d) { var ch = kids(fi, n.id); if (!ch.length || collapsed[n.id]) { pos[n.id] = [d, rows++]; } else { ch.forEach(function (c) { lay(c, d + 1); }); var ys = ch.map(function (c) { return pos[c.id][1]; }); pos[n.id] = [d, (Math.min.apply(0, ys) + Math.max.apply(0, ys)) / 2]; } W = Math.max(W, d); })(rootOf(fi), 0);
        var cw = 210, rh = 30, s = '';
        fi.nodes.forEach(function (n) { if (!pos[n.id] || !n.parent || !pos[n.parent]) return; var a = pos[n.parent], b = pos[n.id]; s += '<path class="fw-edge" d="M' + (a[0] * cw + 170) + ' ' + (a[1] * rh + 15) + ' C' + (a[0] * cw + 190) + ' ' + (a[1] * rh + 15) + ' ' + (b[0] * cw - 10) + ' ' + (b[1] * rh + 15) + ' ' + (b[0] * cw) + ' ' + (b[1] * rh + 15) + '"/>'; });
        fi.nodes.forEach(function (n) { var p = pos[n.id]; if (!p) return; s += '<g class="fw-tn r-' + n.role + '" data-id="' + n.id + '" transform="translate(' + p[0] * cw + ' ' + p[1] * rh + ')"><rect width="170" height="24" rx="8"/><text x="10" y="16">' + esc(n.label.length > 24 ? n.label.slice(0, 23) + '…' : n.label || '…') + '</text></g>'; });
        body.innerHTML = '<div class="fw-treebox"><svg class="fw-tree" viewBox="-10 -10 ' + ((W + 1) * cw + 20) + ' ' + (rows * rh + 20) + '" style="width:' + ((W + 1) * cw + 20) + 'px">' + s + '</svg></div>';
      }
      function levels(body) {
        var by = {}; fi.nodes.forEach(function (n) { var d = depth(fi, n); (by[d] = by[d] || []).push(n); });
        body.innerHTML = '<div class="fw-levels">' + Object.keys(by).map(function (d) { return '<div class="fw-col"><h4>Level ' + (+d + 1) + '</h4>' + by[d].map(function (n) { return '<button type="button" class="fw-chip r-' + n.role + '" data-id="' + n.id + '">' + esc(n.label || '…') + (n.parent && +d > 1 ? '<small>' + esc(node(fi, n.parent).label) + '</small>' : '') + '</button>'; }).join('') + '</div>'; }).join('') + '</div>';
      }
      function cards(body) {
        var root = rootOf(fi);
        body.innerHTML = '<div class="fw-cards">' + kids(fi, root.id).map(function (s) { return '<article class="fw-c" data-id="' + s.id + '"><h4>' + esc(s.label) + '</h4><ul>' + descendants(fi, s.id).map(function (n) { return '<li style="--d:' + (depth(fi, n) - 2) + '" data-id="' + n.id + '">' + esc(n.label || '…') + '</li>'; }).join('') + '</ul></article>'; }).join('') + '</div>';
      }
      var ps = 0; function paintSoon() { clearTimeout(ps); ps = setTimeout(function () { if (!main.contains(document.activeElement) || !document.activeElement.matches('.fw-in')) paint(); }, 200); }
      function focusRow(id) { setTimeout(function () { var r = main.querySelector('.fw-row[data-id="' + id + '"] .fw-in'); if (r) { r.focus(); r.scrollIntoView({ block: 'nearest' }); } }, 20); }

      // ---------------------------------------------------------------- edits
      function addChild(pid, label) { var n = { id: rid(), role: 'item', label: label || '', parent: pid, order: kids(fi, pid).length, provenance: 'user' }; fi.nodes.push(n); collapsed[pid] = false; return n; }
      function addAfter(n) { var sibs = kids(fi, n.parent); sibs.forEach(function (s) { if (s.order > n.order) s.order++; }); var m = { id: rid(), role: 'item', label: '', parent: n.parent, order: n.order + 1, provenance: 'user' }; fi.nodes.push(m); return m; }
      function renumber(pid) { kids(fi, pid).forEach(function (s, i) { s.order = i; }); }
      function move(n, newParent, order) {
        if (n.role === 'root' || newParent === n.id || descendants(fi, n.id).some(function (d) { return d.id === newParent; })) return false;
        var np = node(fi, newParent); if (!np) return false;
        if (n.role === 'section' && np.role !== 'root') return false;
        var old = n.parent; n.parent = newParent;
        kids(fi, newParent).forEach(function (s) { if (s.id !== n.id && s.order >= order) s.order++; }); n.order = order;
        renumber(old); renumber(newParent);
        TK.silently(function () { [n].concat(descendants(fi, n.id)).forEach(function (x) { sync(fi, x); }); });
        return true;
      }
      function del(n) {
        var all = [n].concat(descendants(fi, n.id)), ids = all.map(function (x) { return x.id; });
        fi.nodes = fi.nodes.filter(function (x) { return ids.indexOf(x.id) < 0; });
        TK.silently(function () { all.forEach(function (x) { var src = 'fwi:' + fi.id + ':' + x.id; ks.relations({ source: src }).forEach(function (r) { ks.unrelate(r.id); }); if (x.concept_id) ks.maybeDrop(fi.ko, x.concept_id); }); });
        renumber(n.parent);
      }
      function commit(n, keepFocus) { TK.silently(function () { sync(fi, n); ks.saveFramework(fi); }); paint(); if (keepFocus) focusRow(keepFocus); }

      el.addEventListener('click', function (e) {
        var b = e.target.closest('button, .fw-tn, .fw-chip, .fw-c li, .fw-c h4'); if (!b) return;
        if (b.hasAttribute('data-new')) return chooser(false);
        if (b.hasAttribute('data-close')) { modal.hidden = true; return; }
        if (b.hasAttribute('data-tpl')) return pick(b.getAttribute('data-tpl'), b.closest('.fw-choose'));
        if (b.hasAttribute('data-fi')) { fi = ks.framework(b.getAttribute('data-fi')); return load(); }
        if (b.hasAttribute('data-view')) { fi.view = b.getAttribute('data-view'); save(true); return paint(); }
        if (b.hasAttribute('data-delfw')) { if (confirm('Delete the framework “' + fi.title + '”? Its links are removed; concepts used elsewhere stay.')) { var id = fi.id; fi = null; ks.removeFramework(id); load(); } return; }
        if (b.hasAttribute('data-notein')) { var nt = (ks.object(ko.id).notes || []).filter(function (x) { return x.id === b.getAttribute('data-notein'); })[0]; var mine = fi.nodes.filter(function (x) { return x.role === 'section' && x.kind === 'text' && /understanding|mine/i.test(x.label + x.key); })[0] || rootOf(fi); var nn = addChild(mine.id, nt.text); nn.from_note = nt.id; return commit(nn); }
        var row = b.closest('[data-id]'); if (!row) return; var n = node(fi, row.getAttribute('data-id')); if (!n) return;
        sel = n.id;
        if (!b.closest('.fw-outline')) { fi.view = 'outline'; save(true); paint(); return focusRow(n.id); }
        if (b.hasAttribute('data-tg')) { collapsed[n.id] = !collapsed[n.id]; return paint(); }
        if (b.hasAttribute('data-add')) { var c = addChild(n.id, ''); save(true); paint(); return focusRow(c.id); }
        if (b.hasAttribute('data-up') || b.hasAttribute('data-down')) { var sibs = kids(fi, n.parent), i = sibs.indexOf(n), j = i + (b.hasAttribute('data-up') ? -1 : 1); if (j < 0 || j >= sibs.length) return; var o = sibs[j].order; sibs[j].order = n.order; n.order = o; save(); return paint(); }
        if (b.hasAttribute('data-in')) { var s2 = kids(fi, n.parent), k = s2.indexOf(n); if (k > 0 && move(n, s2[k - 1].id, kids(fi, s2[k - 1].id).length)) { save(); paint(); } return; }
        if (b.hasAttribute('data-out')) { var p = node(fi, n.parent); if (p && p.parent && move(n, p.parent, p.order + 1)) { save(); paint(); } return; }
        if (b.hasAttribute('data-del')) { if (kids(fi, n.id).length && !confirm('Delete “' + (n.label || 'this node') + '” and everything inside it?')) return; del(n); save(); return paint(); }
        if (b.hasAttribute('data-ref')) return refPicker(n, row);
      });
      main.addEventListener('change', function (e) {
        if (e.target.matches('.fw-title')) { fi.title = e.target.value.trim() || fi.title; save(); return; }
      });
      main.addEventListener('focusout', function (e) { if (e.target.matches('.fw-in')) commitInput(e.target); });
      // save what was typed in a node; called on blur and before Enter / Tab / Backspace change the structure
      function commitInput(t) {
        var row = t.closest('[data-id]'), n = row && node(fi, row.getAttribute('data-id')); if (!n) return;
        var v = t.value.trim(); if (v === n.label) return;
        n.label = v; if (n.provenance === 'library') n.provenance = 'user';
        if (n.role === 'root' && n.concept_id) { renameRoot(n, v); }
        TK.silently(function () { sync(fi, n); descendants(fi, n.id).forEach(function (d) { if (d.role === 'item') sync(fi, d); }); ks.saveFramework(fi); });
        var badgeHost = row.querySelector('.fw-k'); if (!badgeHost && isConceptNode(fi, n)) paintSoon();
      }
      function renameRoot(n, v) {
        var c = ks.findConcept(v);
        if (c && c.id !== n.concept_id) { n.concept_id = c.id; ks.updateObject(ko.id, { root_concept: c.id }); ks.addToObject(ko.id, c.id); }
        else { var cc = ks.getConcept(n.concept_id), lab = cc.labels; if (/[㐀-鿿]/.test(v)) lab.zh = v; else lab.en = v; ks.updateConcept(n.concept_id, { labels: lab }); }
        TK.silently(function () { fi.nodes.forEach(function (x) { if (x.role === 'item') sync(fi, x); }); });
      }
      main.addEventListener('keydown', function (e) {
        if (!e.target.matches('.fw-in')) return; var row = e.target.closest('[data-id]'), n = node(fi, row.getAttribute('data-id'));
        if (e.key === 'Enter' || e.key === 'Tab') commitInput(e.target);
        if (e.key === 'Enter') { e.preventDefault(); e.target.blur(); var m = n.role === 'item' ? addAfter(n) : addChild(n.id, ''); save(true); paint(); focusRow(m.id); }
        else if (e.key === 'Tab' && n.role === 'item') { e.preventDefault(); e.target.blur(); var s = kids(fi, n.parent), k = s.indexOf(n); if (e.shiftKey) { var p = node(fi, n.parent); if (p && p.parent) move(n, p.parent, p.order + 1); } else if (k > 0) move(n, s[k - 1].id, kids(fi, s[k - 1].id).length); save(); paint(); focusRow(n.id); }
        else if (e.key === 'Backspace' && !e.target.value && n.role === 'item' && !kids(fi, n.id).length) { e.preventDefault(); var sibs = kids(fi, n.parent), prev = sibs[sibs.indexOf(n) - 1]; del(n); save(); paint(); focusRow(prev ? prev.id : n.parent); }
      });

      // drag to move: drop on a row's left half → after it (same level); right half → inside it
      var dg = null;
      main.addEventListener('pointerdown', function (e) {
        var h = e.target.closest('[data-drag]'); if (!h) return; var row = h.closest('.fw-row');
        dg = { id: row.getAttribute('data-id'), row: row, ghost: null, target: null, mode: null }; row.classList.add('dragging'); try { h.setPointerCapture(e.pointerId); } catch (x) {} e.preventDefault();
      });
      main.addEventListener('pointermove', function (e) {
        if (!dg) return; var over = document.elementFromPoint(e.clientX, e.clientY), row = over && over.closest('.fw-row');
        main.querySelectorAll('.fw-row.drop-in, .fw-row.drop-after').forEach(function (r) { r.classList.remove('drop-in', 'drop-after'); });
        if (!row || row === dg.row) { dg.target = null; return; }
        var b = row.getBoundingClientRect(), inside = e.clientX > b.left + b.width * 0.5;
        dg.target = row.getAttribute('data-id'); dg.mode = inside ? 'in' : 'after'; row.classList.add(inside ? 'drop-in' : 'drop-after');
      });
      function endDrag() {
        if (!dg) return; var d = dg; dg = null; d.row.classList.remove('dragging');
        if (!d.target) return paint();
        var n = node(fi, d.id), t = node(fi, d.target), ok = false;
        if (d.mode === 'in' || t.role === 'root') ok = move(n, t.id, 0); else ok = move(n, t.parent, t.order + 1);
        if (!ok) TK.toast('Can’t move it there'); save(); paint();
      }
      main.addEventListener('pointerup', endDrag); main.addEventListener('pointercancel', endDrag);

      function refPicker(n, row) {
        var cs = ks.conceptsOf(ko.id).filter(function (c) { return c.id !== n.concept_id; });
        var pop = document.createElement('div'); pop.className = 'fw-pop';
        pop.innerHTML = '<label>Link “' + esc(n.label || 'this node') + '” to<select>' + cs.map(function (c) { return '<option value="' + c.id + '">' + esc(ks.label(c)) + '</option>'; }).join('') + '</select></label><div class="row"><button type="button" class="primary" data-ok>Add link</button><button type="button" data-x>Cancel</button></div>' +
          ((n.refs || []).length ? '<p class="dim">Current links: ' + n.refs.map(function (r) { return esc(ks.label(r)) + ' <button type="button" class="small" data-rm="' + r + '">remove</button>'; }).join(' ') + '</p>' : '');
        row.after(pop);
        pop.onclick = function (e) {
          var b = e.target.closest('button'); if (!b) return;
          if (b.hasAttribute('data-ok')) { var v = pop.querySelector('select').value; if (v) { n.refs = (n.refs || []).concat([v]).filter(function (x, i, a) { return a.indexOf(x) === i; }); commit(n); } }
          else if (b.hasAttribute('data-rm')) { n.refs = n.refs.filter(function (x) { return x !== b.getAttribute('data-rm'); }); commit(n); }
          else pop.remove();
        };
      }

      load();
      return { refresh: function () { ko = TK.ko; load(); } };
    }
  });
})();

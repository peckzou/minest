  /* ── 53.88 · My World — 3D Vocabulary & Concept Display: every card that is a word, phrase or concept can stand in the
     world as a miniature object you can pull out, flip and study. "From afar a world, up close a collection, tap it and it is
     knowledge." No second vocabulary store: the words ARE the Kanban cards (refs 'list id/card id'); a display only keeps its
     kind (p.k), the words' form (p.wf, per word p.wfi[ref]) and the order of its refs — all in the island's synced layout.
     8 space displays (scene pieces: the block builders of shelves, walls, tables… reused — never a model per word):
       wlib Word Library · wwall Word Wall · wcab Vocabulary Cabinet · wtable Flashcard Table  (the four done fully)
       wtree Knowledge Tree · wblocks Word Block Shelf · wgallery Concept Gallery · wgarden Vocabulary Garden
     12 item forms (+ the default Word Tile): CSS 3D on shared elements, the word as live text (sharp at any size, no texture per
     word); the cabinet's drawers fill only when opened, shelves and rows use content-visibility, so 100+ words stay light.
     Pull Out & Flip: tap a word — it slides out of its shelf / drawer and a reading card flips over to its meaning (the card's
     meaning · titleZh · note), then ⟶ Open card (the Item level) or Put back. Placing words never changes the Kanban lists. */
  var VOCAB = null;
  (function () {
    var BASE = { wlib: 'books', wwall: 'wall', wcab: 'grid', wtable: 'table', wtree: 'ktree', wblocks: 'shelf', wgallery: 'gallery', wgarden: 'garden' };
    var DISPLAYS = [
      ['wlib', '📚 Word Library', 'words become small books on shelves, by list'],
      ['wwall', '🧱 Word Wall', 'tiles in neat rows'],
      ['wcab', '🗄 Vocabulary Cabinet', 'a drawer for each stack — pull one open'],
      ['wtable', '🃏 Flashcard Table', 'draw, flip, review'],
      ['wtree', '🌳 Knowledge Tree', 'concepts and the ones under them'],
      ['wblocks', '🧊 Word Block Shelf', 'stack, sort and group blocks'],
      ['wgallery', '🏛 Concept Gallery', 'key words big, in 3D, under lights'],
      ['wgarden', '🌷 Vocabulary Garden', 'words growing in a little garden']];
    var FORMS = [['tile', '🔤 Word Tile'], ['type3d', '🅰 3D Typography'], ['float', '🎈 Floating Word'], ['plate', '🏷 Nameplate'], ['sign', '🪧 Sign'], ['card', '🗂 Vocabulary Card'],
      ['index', '📇 Index Tile'], ['letters', '🔠 Letter Tiles'], ['block', '🧊 Word Block'], ['coin', '🪙 Word Coin'], ['crystal', '💎 Concept Crystal'], ['pedestal', '🏛 Word Pedestal'], ['drawer', '🗄 Word Drawer']];
    var DEF_FORM = { wlib: 'tile', wwall: 'tile', wcab: 'index', wtable: 'card', wtree: 'tile', wblocks: 'block', wgallery: 'type3d', wgarden: 'sign' };
    DISPLAYS.forEach(function (d) {   // the scene pieces: a vocabulary kind of an existing display (its blocks, its slots)
      var b = K[BASE[d[0]]] ? BASE[d[0]] : 'shelf'; if (!K[b] || K[d[0]]) return;
      K[d[0]] = Object.assign({}, K[b], { n: d[1].replace(/^\S+\s/, ''), use: d[2], vocab: 1, decor: 0 }); BUILD[d[0]] = BUILD[b];
    });
    function isVocab(p) { return !!(p && K[p.k] && K[p.k].vocab); }
    function formOf(p, ref) { return (p && p.wfi && p.wfi[ref]) || (p && p.wf) || DEF_FORM[p && p.k] || 'tile'; }
    function plain(s) { var d = document.createElement('div'); d.innerHTML = String(s || ''); return (d.textContent || '').replace(/\s+/g, ' ').trim(); }
    function meaningOf(s) { return String(s.meaning || '').trim() || String(s.titleZh || '').trim() || plain(s.desc).slice(0, 220) || ''; }
    // the count decides what is recommended (only a suggestion): few → standalone pieces, some → shelves / wall / table, many → library / cabinet
    function recommend(n) {
      return n <= 10 ? [['wgallery', 'pedestal'], ['wgallery', 'crystal'], ['wwall', 'card'], ['wgarden', 'sign']]
        : n <= 40 ? [['wwall', 'tile'], ['wtable', 'card'], ['wblocks', 'block'], ['wlib', 'tile']]
        : [['wlib', 'tile'], ['wcab', 'index'], ['wwall', 'tile'], ['wtree', 'tile']];
    }
    var VRE = /vocab|word|term|concept|glossar|spelling|phonic|definition|idiom|phrase|lexic|词|单词|词汇|概念|术语/i;
    function like() {   // does this world hold words? (cards with a meaning, a Chinese title, or a list / board named for words)
      var b = board(V.bid), hit = VRE.test((b && b.title) || '');
      lists(b).forEach(function (L) { if (hit) return; if (VRE.test(L.k.title || '') || VRE.test((L.col && L.col.title) || '')) hit = true; (L.k.stack || []).some(function (s) { if (s && (String(s.meaning || '').trim() || String(s.titleZh || '').trim())) { hit = true; return true; } }); });
      return hit;
    }

    // ---------------------------------------------------------------- one word, in its form
    function face(w, form) {
      if (form === 'letters') return '<b class="lt">' + Array.from(w).slice(0, 16).map(function (c) { return c === ' ' ? '<i class="sp"></i>' : '<i>' + esc(c) + '</i>'; }).join('') + '</b>';
      return '<b>' + esc(w) + '</b>';
    }
    function wordEl(p, ref, i, form, cls) {
      var t = thing(ref); if (!t) return ''; var w = String(t.s.title || '').trim() || '…';
      return '<div class="wv-w f-' + form + (cls ? ' ' + cls : '') + '" role="button" tabindex="0" data-wvi="' + i + '" style="--h:' + (hash(w) % 360) + ';--n:' + Math.min(24, w.length) + '" title="' + esc(w) + '"><span class="fr">' + face(w, form) + '</span></div>';
    }
    function preview(w, form) { return '<div class="wv-w f-' + form + ' wv-pre" style="--h:' + (hash(w) % 360) + ';--n:' + Math.min(24, w.length) + '"><span class="fr">' + face(w, form) + '</span></div>'; }
    function byList(refs) { var G = {}, order = []; refs.forEach(function (r, i) { var t = thing(r); if (!t) return; var id = t.k.id; if (!G[id]) { G[id] = { n: t.k.title || 'List', items: [] }; order.push(id); } G[id].items.push([r, i]); }); return order.map(function (id) { return G[id]; }); }

    // ---------------------------------------------------------------- the eight displays, opened (the Display Fixture level)
    var FC = {}, SORT = {}, OPEN = {};
    function body(p, refs) {
      var k = p.k, idx = function (r) { return refs.indexOf(r); };
      var head = '<div class="wv-head"><b>' + esc(K[k].n) + '</b><small>' + refs.length + ' word' + (refs.length === 1 ? '' : 's') + ' · tap one to pull it out and flip it</small></div>';
      if (!refs.length) return '<div class="wv wv-' + k + '">' + head + '<p class="wv-empty">No words here yet — 🎒 Bag or ✨ Smart Display in the console.</p></div>';
      if (k === 'wlib') return '<div class="wv wv-wlib">' + head + byList(refs).map(function (g) {
          return '<section class="wv-shelf"><h5>' + esc(g.n) + ' · ' + g.items.length + '</h5><div class="books">' + g.items.map(function (x) { return wordEl(p, x[0], x[1], 'spine'); }).join('') + '</div><i class="board"></i></section>'; }).join('') + '</div>';
      if (k === 'wwall') return '<div class="wv wv-wwall">' + head + '<div class="rows">' + refs.map(function (r, i) { return wordEl(p, r, i, formOf(p, r)); }).join('') + '</div></div>';
      if (k === 'wcab') return '<div class="wv wv-wcab">' + head + '<div class="cab">' + byList(refs).map(function (g, gi) { var key = p.id + ':' + gi, on = OPEN[key];
          return '<div class="wv-drawer' + (on ? ' open' : '') + '" data-wvd="' + gi + '"><button type="button" class="front" data-wvdo="' + gi + '"><b>' + esc(g.n) + '</b><small>' + g.items.length + ' cards</small><i class="handle"></i></button><div class="inside">' + (on ? g.items.map(function (x) { return wordEl(p, x[0], x[1], formOf(p, x[0])); }).join('') : '') + '</div></div>'; }).join('') + '</div></div>';
      if (k === 'wtable') return '<div class="wv wv-wtable">' + head + '<div class="table">' + fcHtml(p, refs) + '</div></div>';
      if (k === 'wblocks') { var s = SORT[p.id] || 'list', R = refs.slice(), nm = function (r) { return String((thing(r) || { s: {} }).s.title || '').toLowerCase(); };
        if (s === 'az') R.sort(function (a, b) { return nm(a) < nm(b) ? -1 : 1; }); else if (s === 'len') R.sort(function (a, b) { return nm(a).length - nm(b).length || (nm(a) < nm(b) ? -1 : 1); }); else if (s === 'mix') { for (var j = R.length - 1; j > 0; j--) { var q = Math.floor(Math.random() * (j + 1)), x = R[j]; R[j] = R[q]; R[q] = x; } }
        var groups = s === 'list' ? byList(R) : [{ n: { az: 'A → Z', len: 'Short to long', mix: 'A fresh mix' }[s], items: R.map(function (r) { return [r, idx(r)]; }) }];
        return '<div class="wv wv-wblocks">' + head + '<div class="wv-sort">' + [['list', 'By list'], ['az', 'A → Z'], ['len', 'Length'], ['mix', 'Mix']].map(function (o) { return '<button type="button" data-wvsort="' + o[0] + '"' + (o[0] === s ? ' class="on"' : '') + '>' + o[1] + '</button>'; }).join('') + '<small>only how they stand here — your lists stay as they are</small></div>' +
          groups.map(function (g) { return '<section class="wv-shelf"><h5>' + esc(g.n) + '</h5><div class="stack">' + g.items.map(function (x) { return wordEl(p, x[0], x[1], formOf(p, x[0])); }).join('') + '</div><i class="board"></i></section>'; }).join('') + '</div>';
      }
      if (k === 'wgallery') return '<div class="wv wv-wgallery">' + head + '<div class="hall">' + refs.map(function (r, i) { return '<div class="spot"><i class="lamp"></i>' + wordEl(p, r, i, formOf(p, r)) + '<i class="plinth"></i></div>'; }).join('') + '</div></div>';
      if (k === 'wgarden') return '<div class="wv wv-wgarden">' + head + '<div class="bed">' + refs.map(function (r, i) { return '<div class="plant" style="--d:' + (i % 5) + '">' + wordEl(p, r, i, formOf(p, r)) + '<i class="stem"></i><i class="leaf"></i></div>'; }).join('') + '</div><i class="grass"></i></div>';
      if (k === 'wtree') { var roots = refs.filter(function (r) { var pr = parentRef(r); return !pr || refs.indexOf(pr) < 0; });
        return '<div class="wv wv-wtree">' + head + '<div class="crown">' + roots.map(function (r) { var kids = refs.filter(function (c) { return parentRef(c) === r; });
          return '<div class="branch">' + wordEl(p, r, idx(r), formOf(p, r), 'root') + (kids.length ? '<div class="twigs">' + kids.map(function (c) { return wordEl(p, c, idx(c), formOf(p, c), 'kid'); }).join('') + '</div>' : '') + '</div>'; }).join('') + '</div><i class="trunk"></i></div>'; }
      return '';
    }
    // 🃏 the flashcard table: a deck, one card up, flip, know / again (this session only — the cards are not changed)
    function fcOf(p, refs) { var f = FC[p.id]; if (!f || f.n !== refs.length) f = FC[p.id] = { n: refs.length, order: refs.map(function (r, i) { return i; }), at: 0, flip: false, known: {}, again: {} }; return f; }
    function fcHtml(p, refs) {
      var f = fcOf(p, refs), i = f.order[f.at], r = refs[i], t = thing(r); if (!t) return '';
      var w = String(t.s.title || ''), m = meaningOf(t.s), k = Object.keys(f.known).length, a = Object.keys(f.again).length;
      return '<div class="deck" aria-hidden="true">' + new Array(Math.min(6, Math.max(1, refs.length - f.at - 1))).join('<i></i>') + '<i></i></div>' +
        '<div class="fc' + (f.flip ? ' flip' : '') + '" data-wvflip><div class="in"><div class="side a" style="--h:' + (hash(w) % 360) + '"><small>' + esc(t.k.title || '') + '</small><b>' + esc(w) + '</b><em>tap to flip</em></div>' +
        '<div class="side b"><b>' + esc(w) + '</b><p>' + (m ? esc(m) : '<span class="dim">No meaning on this card yet</span>') + '</p></div></div></div>' +
        '<div class="ctl"><button type="button" data-wvfc="prev"' + (f.at ? '' : ' disabled') + '>‹</button><span>' + (f.at + 1) + ' / ' + refs.length + '</span><button type="button" data-wvfc="next"' + (f.at < refs.length - 1 ? '' : ' disabled') + '>›</button>' +
        '<button type="button" class="again" data-wvfc="again">↺ Again</button><button type="button" class="know" data-wvfc="know">✓ Know it</button><button type="button" data-wvfc="mix">🔀</button><button type="button" data-pvgo="' + i + '">Open card ›</button></div>' +
        '<p class="score">✓ ' + k + ' known · ↺ ' + a + ' again' + (f.at === refs.length - 1 ? ' · last card — 🔀 for another round' : '') + '</p>';
    }
    // ---------------------------------------------------------------- Pull Out & Flip (a 3D slide in place, then a 2D card to read)
    function peek(i) {
      if (!pv) return; var r = pv.refs[i], t = thing(r); if (!t) return; var el0 = pv.el.querySelector('[data-wvi="' + i + '"]'), old = pv.el.querySelector('.wv-peek');
      pv.el.querySelectorAll('.wv-w.out').forEach(function (x) { x.classList.remove('out'); });
      if (old) old.remove(); if (el0) { el0.classList.add('out'); }
      var p = pieceOf(pv.pc), w = String(t.s.title || ''), m = meaningOf(t.s), d = document.createElement('div'); d.className = 'wv-peek'; d.setAttribute('role', 'dialog'); d.setAttribute('aria-label', w);
      var cl = t.s.checklist || t.s.checklists, n = Array.isArray(cl) ? cl.length : 0;
      d.innerHTML = '<div class="card"><div class="in"><div class="side a">' + preview(w, formOf(p, r)) + '<small>' + esc(t.k.title || '') + '</small><em>tap to flip</em></div>' +
        '<div class="side b"><h4>' + esc(w) + '</h4>' + (t.s.titleZh && t.s.titleZh !== m ? '<p class="zh">' + esc(t.s.titleZh) + '</p>' : '') + '<p>' + (m ? esc(m) : '<span class="dim">No meaning yet — open the card to add one.</span>') + '</p>' + (n ? '<small>☑ ' + n + ' checklist item' + (n === 1 ? '' : 's') + '</small>' : '') + '</div></div></div>' +
        '<div class="acts"><button type="button" data-wvback>⤓ Put back</button><button type="button" class="go" data-pvgo="' + i + '">Open card ›</button></div>';
      pv.el.appendChild(d); setTimeout(function () { d.classList.add('on'); }, 20); setTimeout(function () { d.classList.add('flip'); }, 520); try { hap('light'); } catch (e) {}
    }
    function putBack() { if (!pv) return; var d = pv.el.querySelector('.wv-peek'); if (d) d.remove(); pv.el.querySelectorAll('.wv-w.out').forEach(function (x) { x.classList.remove('out'); }); }
    document.addEventListener('click', function (e) {
      if (!pv || !e.target.closest || !pv.el.contains(e.target)) return; var g, p = pieceOf(pv.pc); if (!isVocab(p)) return;
      if (e.target.closest('[data-pvgo]')) { putBack(); return; }   // the piece view opens the card (the Item level)
      if (e.target.closest('[data-wvback]') || e.target.classList.contains('wv-peek')) { e.stopPropagation(); return putBack(); }
      if ((g = e.target.closest('.wv-peek .card'))) { e.stopPropagation(); g.parentNode.classList.toggle('flip'); return; }
      if ((g = e.target.closest('[data-wvdo]'))) { e.stopPropagation(); var gi = +g.getAttribute('data-wvdo'), key = p.id + ':' + gi, dr = g.parentNode; OPEN[key] = !OPEN[key]; dr.classList.toggle('open', !!OPEN[key]);
        var L = byList(pv.refs)[gi]; dr.querySelector('.inside').innerHTML = OPEN[key] && L ? L.items.map(function (x) { return wordEl(p, x[0], x[1], formOf(p, x[0])); }).join('') : ''; return; }   // a drawer fills only when it is pulled open
      if ((g = e.target.closest('[data-wvsort]'))) { e.stopPropagation(); SORT[p.id] = g.getAttribute('data-wvsort'); var b = pv.el.querySelector('.pv-body'); if (b) b.innerHTML = body(p, pv.refs); return; }
      if ((g = e.target.closest('[data-wvfc]')) || (g = e.target.closest('[data-wvflip]'))) { e.stopPropagation(); var f = fcOf(p, pv.refs), a = g.getAttribute('data-wvfc'), cur = f.order[f.at];
        if (!a) f.flip = !f.flip; else if (a === 'next' && f.at < f.n - 1) { f.at++; f.flip = false; } else if (a === 'prev' && f.at) { f.at--; f.flip = false; }
        else if (a === 'know' || a === 'again') { f[a === 'know' ? 'known' : 'again'][cur] = 1; delete f[a === 'know' ? 'again' : 'known'][cur]; if (f.at < f.n - 1) { f.at++; f.flip = false; } }
        else if (a === 'mix') { for (var j = f.order.length - 1; j > 0; j--) { var q = Math.floor(Math.random() * (j + 1)), x = f.order[j]; f.order[j] = f.order[q]; f.order[q] = x; } f.at = 0; f.flip = false; }
        var tb = pv.el.querySelector('.wv-wtable .table'); if (tb) tb.innerHTML = fcHtml(p, pv.refs); return; }
      if ((g = e.target.closest('[data-wvi]'))) { e.stopPropagation(); var i = +g.getAttribute('data-wvi'); if (g.classList.contains('out')) return putBack(); return peek(i); }
    }, true);
    // the piece view draws these displays; a thing opened from one shows its meaning too
    var pb0 = pvBody; pvBody = function (p, refs) { return isVocab(p) ? body(p, refs) : pb0.apply(null, arguments); };
    var po0 = pvOrder; pvOrder = function (p) { return p && p.k === 'wtree' ? byParent((p.it || []).filter(thing)) : po0.apply(null, arguments); };
    var pd0 = pvDetail; pvDetail = function (i) { putBack(); var o = pd0.apply(null, arguments); try { var p = pv && pieceOf(pv.pc); if (isVocab(p) && pv.at >= 0) { var t = thing(pv.refs[pv.at]), h = pv.el.querySelector('.pv-sheet .txt h3'); if (t && h && !pv.el.querySelector('.wv-mean')) { var m = String(t.s.meaning || '').trim(), z = String(t.s.titleZh || '').trim(); if (m || z) h.insertAdjacentHTML('afterend', '<p class="wv-mean">' + (z ? '<b>' + esc(z) + '</b> ' : '') + esc(m) + '</p>'); } } } catch (e) {} return o; };

    // ---------------------------------------------------------------- generators (used by the Display tools' Smart / Suggest, world_fold.js)
    function bigList(onlyFree) {   // the list with the most words to show (not yet out, else all of them)
      index(); var on = placed(), best = null; lists(board(V.bid)).forEach(function (L) { var refs = (L.k.stack || []).filter(function (s) { return s && s.id; }).map(function (s) { return L.k.id + '/' + s.id; }), free = refs.filter(function (r) { return !on[r]; });
        var n = onlyFree ? free.length : refs.length; if (n && (!best || n > best.n)) best = { L: L, refs: onlyFree ? free : refs, n: n }; });
      return best;
    }
    function fill(p, refs) { var n = 0; refs.forEach(function (r) { if ((p.it || []).indexOf(r) >= 0) return; if (putOnPiece(p, r)) n++; }); return n; }
    function place(i, B) {   // a room: one list → the display its size suggests (another each time), its words in it
      var g = bigList(true) || bigList(false); if (!g) return 'no words to show — add cards to a list first';
      var R0 = recommend(g.refs.length), pick = R0[i % R0.length], kind = K[pick[0]] ? pick[0] : 'wwall', left = g.refs.slice(), made = 0, n = 0, first = null;
      while (left.length && made < 4) { var q = sbPlace(kind); if (!q) break; made++; if (!first) first = q; q.label = String(g.L.k.title || '').replace(/^my\s+/i, '') + (made > 1 ? ' ' + made : ''); q.wf = pick[1] || DEF_FORM[kind]; var put = fill(q, left); n += put; left = left.slice(put); if (!put) break; }   // a big list: a zoned display (up to four)
      return made ? DISPLAYS.filter(function (d) { return d[0] === kind; })[0][1] + ' for “' + String(g.L.k.title || '') + '” — ' + n + ' word' + (n === 1 ? '' : 's') + (made > 1 ? ' in ' + made + ' zones' : '') + ' · ' + FORMS.filter(function (f) { return f[0] === (pick[1] || DEF_FORM[kind]); })[0][1] : 'no room for another display here';
    }
    function switchKind(p, i) {   // the open display becomes another word display (its words stay)
      if (!p) return ''; var n = (p.it || []).filter(thing).length, R0 = recommend(n).concat(DISPLAYS.map(function (d) { return [d[0], DEF_FORM[d[0]]]; })).filter(function (x, j, a) { return x[0] !== p.k && a.map(function (y) { return y[0]; }).indexOf(x[0]) === j; }), pick = R0[i % R0.length];
      p.k = pick[0]; p.wf = pick[1]; p.s = p.s || 1; while (capOf(p) < n && p.s < 2.5) p.s = Math.round((p.s + .25) * 100) / 100; if (!fits(p)) settle(p, p.x, p.y);
      return 'as a ' + DISPLAYS.filter(function (d) { return d[0] === pick[0]; })[0][1];
    }
    function cycleForm(p, i) { if (!p) return ''; var cur = p.wf || DEF_FORM[p.k] || 'tile', ix = FORMS.map(function (f) { return f[0]; }).indexOf(cur), f = FORMS[(ix + 1 + i) % FORMS.length]; p.wf = f[0]; if (p.wfi) delete p.wfi; return 'every word as a ' + f[1]; }
    function setForm(p, form, ref) { if (!p) return; if (ref) { p.wfi = Object.assign({}, p.wfi || {}); if (form === (p.wf || DEF_FORM[p.k])) delete p.wfi[ref]; else p.wfi[ref] = form; } else { p.wf = form; delete p.wfi; } }
    VOCAB = { displays: DISPLAYS, forms: FORMS, isVocab: isVocab, formOf: formOf, like: like, recommend: recommend, place: place, switchKind: switchKind, cycleForm: cycleForm, setForm: setForm, preview: preview, meaningOf: meaningOf, bigList: bigList };
  })();

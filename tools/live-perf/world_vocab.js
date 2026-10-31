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
    // 53.89 · Item 实体化: the 14 carriers of world_items.js lead the forms (Crystal Award and Cardstock take over the old crystal and card),
    // its 16 displays (Orb Archive, Ranking Podium, Cube Wall, Bulletin Board…) join the word displays
    var MI = window.MinestItems;
    if (MI) {
      FORMS = MI.carriers.map(function (c) { return [c[0], c[1]]; }).concat(FORMS.filter(function (f) { return !MI.has(f[0]); }));
      MI.kinds.forEach(function (k) { DISPLAYS.push([k[0], k[1], MI.use[k[0]] + ' · ' + k[2]]); BASE[k[0]] = k[4]; DEF_FORM[k[0]] = k[3]; });
    }
    function itemInfo(ref) {   // what the Item Generator reads from a card (live, never copied)
      var t = thing(ref); if (!t) return { id: ref, title: '' }; var u = null; try { u = picOf(t.s); } catch (e) {} var b = board(V.bid);
      return { id: ref, title: String(t.s.title || '').trim(), zh: String(t.s.titleZh || '').trim(), mean: meaningOf(t.s), img: u ? S(u) : '', list: t.k.title || '',
        board: ((b && b.title) || '') + ' ' + ((t.col && t.col.title) || ''), labels: (t.s.labels || []).map(function (l) { return typeof l === 'string' ? l : (l && (l.name || l.title)) || ''; }), type: t.s.type || '' };
    }
    // 53.89 · each collection gets its own fixture in the scene (not a borrowed wooden shelf): the apothecary cabinet of drawers, a dark
    // orb archive with a glowing orb in every cubby, a podium, a white cube wall, a felt pin board, a walnut block shelf, a plaque wall,
    // marble plinths under spotlights, glass figure cases, lanterns on a beam, a sculpture lawn… Same slots API, so capacity follows.
    var XB = {
      wcab: function (p, its, B) {   // the apothecary cabinet: walnut, rows of little drawers, a brass pull and a label on each
        var W = wOf(p, 3, 2, 6), H = 4, i = 0; B.box(0, W, 0, .9, 0, .25, 'dark', 'dark'); B.box(-.05, W + .05, 0, .95, H * .62 + .25, H * .62 + .4, 'dark', 'dark');
        for (var k = H - 1; k >= 0; k--) for (var c = 0; c < W * 2; c++) { var u = c * .5, z = .25 + k * .62; B.box(u + .02, u + .48, .05, .9, z + .02, z + .6, 'dark', 'spruce'); B.box(u + .2, u + .3, .9, .97, z + .22, z + .3, 'gold', 'gold'); B.bb(u + .25, .96, z + .4, its[i++], .14, { slot: 1 }); }
        B.lantern(W - .3, .45, H * .62 + .4, .6); return { W: W, D: 1 };
      },
      xorbs: function (p, its, B) {   // a dark archive: cubbies with a brass stand, an orb glowing on each, a lamp on top
        var W = wOf(p, 3, 2, 7), H = 3, i = 0; B.box(0, W, 0, .12, 0, H + .12, 'blackstone', 'blackstone');
        for (var k = 0; k <= H; k++) B.box(0, W, 0, .95, k, k + .1, 'dark', 'dark'); for (var c = 0; c <= W; c++) B.box(c - .05, c + .05, .1, .95, 0, H, 'dark', 'dark');
        for (k = H - 1; k >= 0; k--) for (c = 0; c < W; c++) { B.box(c + .38, c + .62, .4, .64, k + .1, k + .2, 'gold', 'gold'); B.bb(c + .5, .55, k + .22, its[i++], .55, { slot: 1, glow: 1 }); }
        B.lantern(.5, .5, H + .12, .8); B.lantern(W - .5, .5, H + .12, .8); return { W: W, D: 1 };
      },
      xpodium: function (p, its, B) {   // a quartz podium with gold edges; first in the middle, highest
        var n = wOf(p, 3, 3, 7), mid = (n - 1) / 2, order = []; for (var c = 0; c < n; c++) order.push(c); order.sort(function (a, b) { return Math.abs(a - mid) - Math.abs(b - mid) || a - b; });
        order.forEach(function (c, rank) { var h = Math.max(.3, 1.3 - rank * .32); B.box(c + .03, c + .97, .05, .95, 0, h, 'quartz', 'quartz'); B.box(c, c + 1, 0, 1, h, h + .06, 'gold', 'gold'); B.bb(c + .5, .5, h + .1, its[rank], .62, { slot: 1, glow: rank < 3, float: 1 }); });
        B.lantern(mid + .5, .5, 2.6, .9); return { W: n, D: 1 };
      },
      xcubes: function (p, its, B) {   // a white gallery wall with glazed cubes standing out of it, a thing on each cube's face
        var W = wOf(p, 4, 2, 8), i = 0, T = ['concrete_red', 'concrete_blue', 'concrete_purple', 'wool_orange', 'wool_cyan', 'white', 'orange', 'cyan'];
        B.box(0, W, 0, .3, 0, 3.2, 'quartz', 'white');
        [2.3, 1.45, .6].forEach(function (z, row) { for (var c = 0; c < W; c++) { var t = T[hash(p.id + row + '|' + c) % T.length], dz = ((c + row) % 2) * .12; B.box(c + .18, c + .82, .3, .9, z + dz, z + dz + .64, t, t); B.bb(c + .5, .92, z + dz + .1, its[i++], .44, { slot: 1 }); } });
        return { W: W, D: 1 };
      },
      xpins: function (p, its, B) {   // a felt board in a dark frame, pins in neat rows
        var W = wOf(p, 3, 2, 7), i = 0; B.box(0, W, 0, .3, 0, 3, 'dark', 'dark'); B.box(.12, W - .12, .3, .34, .15, 2.85, 'wool_white', 'wool_white');
        [2.25, 1.55, .85, .2].forEach(function (z) { for (var c = 0; c < W * 2; c++) B.bb(.25 + c * .5 + .02, .38, z, its[i++], .38, { slot: 1 }); });
        return { W: W, D: 1 };
      },
      xblocks: function (p, its, B) {   // walnut shelves, a wooden word block in each place
        var W = wOf(p, 3, 2, 8), H = 3, i = 0; B.box(0, W, 0, .1, 0, H + .1, 'log', 'log'); B.box(0, .12, .1, 1, 0, H + .1, 'log', 'log'); B.box(W - .12, W, .1, 1, 0, H + .1, 'log', 'log');
        for (var k = 0; k <= H; k++) B.box(.12, W - .12, .1, 1, k, k + .1, 'log_top', 'log');
        for (k = H - 1; k >= 0; k--) for (var c = 0; c < W; c++) { B.box(c + .28, c + .72, .4, .84, k + .1, k + .54, 'oak', 'oak'); B.bb(c + .5, .86, k + .12, its[i++], .42, { slot: 1 }); }
        return { W: W, D: 1 };
      },
      xplaques: function (p, its, B) {   // a stone wall, walnut plaques hung in two rows
        var W = wOf(p, 3, 2, 7), i = 0; B.box(0, W * 1.5, 0, .4, 0, 3.2, 'stone_bricks', 'plaster');
        [2.05, .95].forEach(function (z) { for (var c = 0; c < W; c++) { var u = c * 1.5 + .2; B.box(u, u + 1.1, .4, .48, z, z + .75, 'spruce', 'spruce', { deco: 'frame', ref: its[i++], slot: 1 }); } });
        return { W: W * 1.5, D: 1 };
      },
      xsculpt: function (p, its, B) {   // marble plinths in a row, each under a spotlight
        var n = wOf(p, 3, 1, 6), W = 2 * n - 1; for (var s = 0; s < n; s++) { var u = 2 * s; B.box(u + .1, u + .9, .1, .9, 0, 1, 'quartz', 'quartz'); B.box(u + .05, u + .95, .05, .95, 1, 1.06, 'white', 'white'); B.bb(u + .5, .5, 1.1, its[s], .75, { slot: 1, glow: 1 }); B.lantern(u + .5, .5, 2.9, .9); }
        return { W: W, D: 1 };
      },
      xdolls: function (p, its, B) {   // glass figure cases on a white base
        var n = wOf(p, 3, 1, 6), i = 0; for (var s = 0; s < n; s++) { B.box(s + .05, s + .95, .05, .95, 0, .7, 'white', 'white'); B.bb(s + .5, .5, .74, its[i++], .55, { slot: 1 }); B.box(s + .08, s + .92, .08, .92, .7, 1.7, 'glass', 'glass', { glass: 1 }); B.box(s + .05, s + .95, .05, .95, 1.7, 1.76, 'white', 'white'); }
        return { W: n, D: 1 };
      },
      xlanterns: function (p, its, B) {   // a beam on two posts, glowing orbs hanging from it
        var W = wOf(p, 3, 2, 7), n = Math.round(W * 1.5), i = 0; B.box(0, .15, .4, .6, 0, 3, 'dark', 'dark'); B.box(W - .15, W, .4, .6, 0, 3, 'dark', 'dark'); B.box(0, W, .42, .58, 2.85, 3, 'dark', 'dark');
        for (var k = 0; k < n; k++) { var x = .3 + (W - .6) * (k + .5) / n, z = 1.5 + (hash(p.id + k) % 4) * .2; B.box(x - .01, x + .01, .49, .51, z + .5, 2.85, 'iron', 'iron'); B.bb(x, .5, z, its[i++], .5, { slot: 1, glow: 1, float: 1 }); }
        return { W: W, D: 1 };
      },
      xsgarden: function (p, its, B) {   // a lawn with stone plinths and a path
        var W = wOf(p, 3, 2, 7), i = 0; B.box(0, W, 0, 2, 0, .08, 'grass_top', 'dirt'); B.box(W / 2 - .3, W / 2 + .3, 0, 2, .08, .1, 'path', 'path');
        [.25, 1.25].forEach(function (t) { for (var c = 0; c < W; c++) { if (Math.abs(c + .5 - W / 2) < .4) continue; B.box(c + .2, c + .8, t + .1, t + .7, .08, .6, 'stone', 'stone'); B.bb(c + .5, t + .4, .62, its[i++], .55, { slot: 1 }); } });
        B.bush(.2, 1.9, .08); B.bush(W - .2, 1.9, .08); return { W: W, D: 2 };
      },
      xgames: function (p, its, B) {   // a dark display shelf of game boxes
        var W = wOf(p, 3, 2, 8), H = 3, i = 0; B.box(0, W, 0, .1, 0, H + .1, 'dark', 'dark');
        for (var k = 0; k <= H; k++) B.box(0, W, .1, .9, k, k + .08, 'iron', 'iron');
        for (k = H - 1; k >= 0; k--) for (var c = 0; c < W * 2; c++) B.bb(.25 + c * .5, .55, k + .08, its[i++], .44, { slot: 1 });
        return { W: W, D: 1 };
      },
      xposters: function (p, its, B) {   // a dark wall of tall framed posters
        var W = wOf(p, 3, 2, 7), i = 0; B.box(0, W * 1.2, 0, .4, 0, 3.3, 'dark', 'dark');
        for (var c = 0; c < W; c++) { var u = c * 1.2 + .15; B.box(u, u + .9, .4, .46, .5, 2.9, 'dark', 'dark', { deco: 'painting', ref: its[i++], slot: 1 }); }
        return { W: W * 1.2, D: 1 };
      }
    };
    var XBASE = { xboard: 'board', xrecords: 'records', xbooks: 'books', xtable: 'table' };   // these already have the right fixture
    DISPLAYS.forEach(function (d) {   // the scene pieces: a vocabulary kind of an existing display (its blocks, its slots)
      var b = K[BASE[d[0]]] ? BASE[d[0]] : 'shelf'; if (!K[b] || K[d[0]]) return;
      K[d[0]] = Object.assign({}, K[XBASE[d[0]] || b] || K[b], { n: d[1].replace(/^\S+\s/, ''), use: d[2], vocab: 1, decor: 0 }); BUILD[d[0]] = XB[d[0]] || BUILD[XBASE[d[0]]] || BUILD[b];
    });
    function isVocab(p) { return !!(p && K[p.k] && K[p.k].vocab); }
    function varOf(p, ref) { return (p && p.wvi && p.wvi[ref]) || (p && p.wv) || ''; }   // a carrier's finish (card stock, stone, plastic): per thing, else the display's, else by the word
    function formOf(p, ref) { return (p && p.wfi && p.wfi[ref]) || (p && p.wf) || DEF_FORM[p && p.k] || 'tile'; }
    function plain(s) { var d = document.createElement('div'); d.innerHTML = String(s || ''); return (d.textContent || '').replace(/\s+/g, ' ').trim(); }
    function meaningOf(s) { return String(s.meaning || '').trim() || String(s.titleZh || '').trim() || plain(s.desc).slice(0, 220) || ''; }
    // the count decides what is recommended (only a suggestion): few → standalone pieces, some → shelves / wall / table, many → library / cabinet
    function recommend(n, refs) {
      var R1 = MI && refs && refs.length ? MI.smartList(refs.map(itemInfo)).slice(0, 4) : [];
      return R1.concat(recommend0(n)).filter(function (x, j, a) { return a.map(function (y) { return y[0]; }).indexOf(x[0]) === j; });
    }
    function recommend0(n) {
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
      if (MI && MI.has(form)) return '<div class="wv-w f-item' + (cls ? ' ' + cls : '') + '" role="button" tabindex="0" data-wvi="' + i + '" title="' + esc(w) + '">' + MI.html(itemInfo(ref), form, { v: varOf(p, ref) }) + '</div>';
      return '<div class="wv-w f-' + form + (cls ? ' ' + cls : '') + '" role="button" tabindex="0" data-wvi="' + i + '" style="--h:' + (hash(w) % 360) + ';--n:' + Math.min(24, w.length) + '" title="' + esc(w) + '"><span class="fr">' + face(w, form) + '</span></div>';
    }
    function preview(w, form) { if (MI && MI.has(form)) return '<div class="wv-w f-item wv-pre">' + MI.html({ id: w, title: w, list: 'Words' }, form, { size: 4.2 }) + '</div>'; return '<div class="wv-w f-' + form + ' wv-pre" style="--h:' + (hash(w) % 360) + ';--n:' + Math.min(24, w.length) + '"><span class="fr">' + face(w, form) + '</span></div>'; }
    function cabGroups(refs) {   // a drawer per list (stack); one big list is split A–Z into drawers of about six
      var G = byList(refs); if (G.length !== 1 || G[0].items.length <= 8) return G;
      var nm = function (x) { var t = thing(x[0]); return String(t ? t.s.title : '').trim(); }, it = G[0].items.slice().sort(function (a, b) { return nm(a).toLowerCase() < nm(b).toLowerCase() ? -1 : 1; }), per = Math.ceil(it.length / Math.ceil(it.length / 6)), out = [];
      for (var i = 0; i < it.length; i += per) { var ch = it.slice(i, i + per), a = (nm(ch[0])[0] || '?').toUpperCase(), z = (nm(ch[ch.length - 1])[0] || '?').toUpperCase(); out.push({ n: G[0].n + ' · ' + (a === z ? a : a + '–' + z), items: ch }); }
      return out;
    }
    function byList(refs) { var G = {}, order = []; refs.forEach(function (r, i) { var t = thing(r); if (!t) return; var id = t.k.id; if (!G[id]) { G[id] = { n: t.k.title || 'List', items: [] }; order.push(id); } G[id].items.push([r, i]); }); return order.map(function (id) { return G[id]; }); }

    // ---------------------------------------------------------------- the eight displays, opened (the Display Fixture level)
    var FC = {}, SORT = {}, OPEN = {};
    function body(p, refs) {
      var k = p.k, idx = function (r) { return refs.indexOf(r); };
      var head = '<div class="wv-head"><b>' + esc(K[k].n) + '</b><small>' + refs.length + ' word' + (refs.length === 1 ? '' : 's') + ' · tap one to pull it out and flip it</small>' + '<span class="wv-hbtns"><button type="button" class="wv-stbtn dk" data-wvdk>🗄 展架 · Display</button>' + (k !== 'wcab' && k !== 'wtable' && refs.length ? '<button type="button" class="wv-stbtn" data-wvst>🎨 形态 · Style</button>' : '') + '</span></div>';
      if (!refs.length) return '<div class="wv wv-' + k + '">' + head + '<p class="wv-empty">No words here yet — 🎒 Bag or ✨ Smart Display in the console.</p></div>';
      if (k === 'wlib') return '<div class="wv wv-wlib">' + head + byList(refs).map(function (g) {
          return '<section class="wv-shelf"><h5>' + esc(g.n) + ' · ' + g.items.length + '</h5><div class="books">' + g.items.map(function (x) { var f = formOf(p, x[0]); return wordEl(p, x[0], x[1], f === 'tile' ? 'spine' : f); }).join('')   /* books by default; a chosen form stands on the shelf as itself */ + '</div><i class="board"></i></section>'; }).join('') + '</div>';
      if (k === 'wwall') return '<div class="wv wv-wwall">' + head + '<div class="rows">' + refs.map(function (r, i) { return wordEl(p, r, i, formOf(p, r)); }).join('') + '</div></div>';
      if (k === 'wcab') return cabHtml(p, refs, head);
      if (MI && MI.isDisplay(k)) return '<div class="wv wv-x">' + MI.display(k, refs.map(function (r, i) { return { info: itemInfo(r), html: wordEl(p, r, i, formOf(p, r)) }; }), { head: head }) + '</div>';   // the Exhibition Generator
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
    // 🗄 the Cabinet of Knowledge (after Codex's 格物致知 prototype): a walnut apothecary cabinet — a drawer per stack, brass
    // plate and cup handle. Pull one and it opens like a real file drawer: hanging folders on the left, one per first letter
    // (open G and the G cards stand in the drawer on the right), index cards standing on edge, the one you are at lifted, the
    // ones behind showing their top edge. Riffle them with a finger (drag up / down or sideways — they follow the finger, then
    // settle on a card), or the wheel, ↑ ↓ / ← →. Tap a card and it slides out to read (flip, Open card, Put back). Smart
    // Arrange (A–Z, length) with undo. Only how the cards stand is kept (this device); the Kanban cards are never touched.
    var CAB = {}, CABKEY = 'minest.wcab.v1';
    function cabState(p) { if (!CAB[p.id]) { var sv = {}; try { sv = (JSON.parse(localStorage.getItem(CABKEY) || '{}') || {})[p.id] || {}; } catch (e) {} CAB[p.id] = { g: null, mode: sv.mode === 'folders' ? 'folders' : 'catalog', fold: sv.fold || {}, pos: sv.pos || {}, ar: sv.ar || {}, undo: null }; } return CAB[p.id]; }
    function cabSave(p) { var c = CAB[p.id]; try { var a = JSON.parse(localStorage.getItem(CABKEY) || '{}') || {}; a[p.id] = { mode: c.mode, fold: c.fold, pos: c.pos, ar: c.ar }; localStorage.setItem(CABKEY, JSON.stringify(a)); } catch (e) {} }
    function cabItems(p, refs, gi) {   // the drawer's cards in the arrangement chosen for it
      var g = cabGroups(refs)[gi]; if (!g) return null; var c = cabState(p), mode = c.ar[gi] || 'list', it = g.items.slice(), nm = function (x) { var t = thing(x[0]); return String(t ? t.s.title : '').toLowerCase(); };
      if (mode === 'az') it.sort(function (a, b) { return nm(a) < nm(b) ? -1 : 1; }); else if (mode === 'len') it.sort(function (a, b) { return nm(a).length - nm(b).length || (nm(a) < nm(b) ? -1 : 1); });
      return { n: g.n, items: it, ar: mode };
    }
    function letterOf(x) { var t = thing(x[0]), ch = String(t ? t.s.title : '').trim().charAt(0).toUpperCase(); return /[A-Z]/.test(ch) ? ch : (ch ? '#' : '?'); }
    function cabFolders(D) { var F = {}, order = []; D.items.forEach(function (x) { var L = letterOf(x); if (!F[L]) { F[L] = []; order.push(L); } F[L].push(x); }); order.sort(); return order.map(function (L) { return { L: L, items: F[L] }; }); }
    function cabCur(p, c, D) { var F = cabFolders(D); if (c.mode !== 'folders') return { F: F, f: { L: '', items: D.items }, key: c.g + '|*' }; var L = c.fold[c.g], f = L ? F.filter(function (x) { return x.L === L; })[0] : null; if (!f) return { F: F, f: null, list: true, key: c.g + '|folders' }; return { F: F, f: f, key: c.g + '|' + f.L }; }   // folders: the row of folders until one is opened
    var CY = 128;   // where the card you are at stands in the drawer (px from the top of the bay)
    function cardTf(d, sp) {   // d = this card's place − the place you are at (≥ 0 stands behind you, a little higher); sp 0…1 = how fast the finger riffles (the cards fan out)
      sp = sp || 0;
      if (d >= 0) { var gap = 31 + sp * 12, near = Math.max(0, 1 - d);   // the next card leans a touch toward the finger as it comes up
        return { t: 'translateY(' + (CY - 18 - d * gap - Math.min(d, 1) * 10).toFixed(1) + 'px) rotateX(' + (-4 - Math.min(d, 1) * 7 + (d > 0 && d < 1 ? (1 - d) * d * 14 : 0) - sp * 5).toFixed(1) + 'deg) scale(' + (1 - Math.min(d, 6) * .018).toFixed(3) + ')', o: d > 6.5 ? 0 : 1, z: 200 - Math.round(d * 10) }; }
      if (d > -1) { var k = -d, tip = Math.min(k / .5, 1), drop = Math.max(0, (k - .3) / .7);   // flicked past: it tips back on its bottom edge, then slips down behind the lip
        return { t: 'translateY(' + (CY - 18 - tip * 16 + drop * drop * 175).toFixed(1) + 'px) rotateX(' + (-4 - tip * 36 + drop * 14).toFixed(1) + 'deg)', o: (1 - drop * .9).toFixed(2), z: 210 }; }
      return { t: 'translateY(' + (CY + 160) + 'px) rotateX(-30deg)', o: 0, z: 1 };
    }
    function cabHtml(p, refs, head) {
      var c = cabState(p), G = cabGroups(refs);
      if (c.g == null || !G[c.g]) {
        return '<div class="wv wv-wcab">' + head + '<div class="cab-wrap"><div class="cab">' + G.map(function (g, gi) {
          return '<button type="button" class="wv-drawer" data-wvdo="' + gi + '"><small>' + ('0' + (gi + 1)).slice(-2) + ' / STACK</small><span class="plate"><span>' + esc(g.n.replace(/^.*? · /, '') === g.n ? g.n : g.n.replace(/^.*? · /, '')) + '</span></span><em>' + g.items.length + ' cards</em><i class="handle"></i></button>'; }).join('') + '</div><i class="cab-foot"></i></div></div>';
      }
      var D = cabItems(p, refs, c.g), C = cabCur(p, c, D), f = C.f, fol = c.mode === 'folders', row = fol && C.list, n = row ? C.F.length : f ? f.items.length : 0, pos = Math.max(0, Math.min(n - 1, Math.round(c.pos[C.key] || 0)));
      var items = row ? C.F.map(function (x, j) { var T = cardTf(j - pos);   // the hanging folders, standing in the drawer, each with its letter on a tab
          return '<button type="button" class="ix hfold" data-wvfo="' + esc(x.L) + '" data-ci="' + j + '" style="--j:' + j + ';transform:' + T.t + ';opacity:' + T.o + ';z-index:' + T.z + '"><i class="ftab">' + esc(x.L) + '</i><span class="r1"><b>' + esc(x.L) + '</b><span class="no">' + x.items.length + ' paper' + (x.items.length === 1 ? '' : 's') + '</span></span><small>' + esc(x.items.slice(0, 3).map(function (y) { var ty = thing(y[0]); return ty ? ty.s.title : ''; }).join(' · ')) + (x.items.length > 3 ? ' …' : '') + '</small></button>'; }).join('')
        : f ? f.items.map(function (x, j) { var ty = thing(x[0]), zh = ty ? String(ty.s.titleZh || '').trim() : '', T = cardTf(j - pos), L = letterOf(x), first = !fol && (j === 0 || letterOf(f.items[j - 1]) !== L);
          return '<button type="button" class="ix' + (fol ? ' paper' : '') + (first ? ' first' : '') + '" data-wvi="' + x[1] + '" data-ci="' + j + '" style="transform:' + T.t + ';opacity:' + T.o + ';z-index:' + T.z + '">' + (first ? '<i class="guide">' + esc(L) + '</i>' : '') +
            '<span class="r1"><b>' + esc(ty ? ty.s.title : '') + '</b><span class="no">' + esc(fol ? f.L + ' · p.' + (j + 1) : L + '·' + ('0' + (j + 1)).slice(-2)) + '</span></span>' + (zh ? '<small>' + esc(zh) + '</small>' : '') + '<i class="rule"></i></button>'; }).join('') : '';
      var openF = fol && !row && f;
      return '<div class="wv wv-wcab open ' + c.mode + '"><div class="tray"><div class="tray-head"><div><small>' + ('0' + (c.g + 1)).slice(-2) + ' · STACK</small><h4>' + esc(D.n) + (openF ? ' · <span class="fname">' + esc(f.L) + '</span>' : '') + '</h4></div>' +
          '<div class="tray-tools"><button type="button" data-wvca title="Smart Arrange">✧ ' + { list: 'As listed', az: 'A → Z', len: 'Short → long' }[D.ar] + '</button>' + (c.undo ? '<button type="button" data-wvcu>↶ Undo</button>' : '') + '<button type="button" class="x" data-wvcx aria-label="Close the drawer">✕</button></div></div>' +
        '<div class="modes" role="tablist"><button type="button" data-wvcm="catalog"' + (fol ? '' : ' class="on"') + '>📇 索引卡柜 · Card Catalog</button><button type="button" data-wvcm="folders"' + (fol ? ' class="on"' : '') + '>🗂 悬挂文件夹 · Hanging Files</button></div>' +
        '<div class="drawer2 solo"><div class="bayside"><div class="bay' + (openF ? ' folder' : row ? ' rail' : '') + '" data-wvbay data-n="' + n + '" data-pos="' + pos + '">' + (openF ? '<i class="fback"><b>' + esc(f.L) + '</b></i>' : '') + (row ? '<i class="hrail"></i>' : '') + items +
            (openF ? '<i class="ffront"><b>' + esc(f.L) + '</b><small>' + n + ' paper' + (n === 1 ? '' : 's') + '</small></i>' : '<i class="lip"></i>') + '</div>' +
          '<div class="nav">' + (openF ? '<button type="button" class="back" data-wvfx>← 文件夹 · Folders</button>' : '<button type="button" data-wvcn="-1" aria-label="Previous">↑</button>') + '<span class="cnt">' + (openF ? esc(f.L) + ' · ' : row ? 'Folder ' : '') + '<b>' + ('0' + (pos + 1)).slice(-2) + '</b> / ' + ('0' + n).slice(-2) + '</span>' +
            (openF ? '<span class="arrows"><button type="button" data-wvcn="-1" aria-label="Previous">↑</button><button type="button" data-wvcn="1" aria-label="Next">↓</button></span>' : '<button type="button" data-wvcn="1" aria-label="Next">↓</button>') + '</div></div></div>' +
        '<div class="tray-foot"><span>手指上下拨动 · Riffle with a finger</span><span>' + (row ? '点文件夹打开 · Tap a folder to open it' : '点一张抽出来看 · Tap one to pull it out') + '</span></div></div></div>';
    }
    function cabRedraw(p) { var b = pv && pv.el.querySelector('.pv-body'); if (b) b.innerHTML = body(p, pv.refs); }
    function cabLay(bay, pos, live, sp) {   // put every card where pos says (live: while the finger moves — a short follow, no spring)
      bay.classList.toggle('live', !!live); bay.setAttribute('data-pos', pos);
      [].forEach.call(bay.querySelectorAll('.ix'), function (el) { var T = cardTf(+el.getAttribute('data-ci') - pos, sp); el.style.transform = T.t; el.style.opacity = T.o; el.style.zIndex = T.z; });
      var n = +bay.getAttribute('data-n'), cnt = bay.parentNode.querySelector('.cnt b'); if (cnt) cnt.textContent = ('0' + (Math.max(0, Math.min(n - 1, Math.round(pos))) + 1)).slice(-2);
    }
    function cabGo(p, to) {   // settle on a card (a flick, a step, the wheel)
      var c = cabState(p), bay = pv && pv.el.querySelector('.wv-wcab [data-wvbay]'); if (!bay) return; var n = +bay.getAttribute('data-n'); if (!n) return;
      var D = cabItems(p, pv.refs, c.g), C = cabCur(p, c, D), t = Math.max(0, Math.min(n - 1, Math.round(to))), was = Math.round(+bay.getAttribute('data-pos'));
      c.pos[C.key] = t; cabSave(p); cabLay(bay, t, false); if (t !== was) try { hap('light'); } catch (e) {}
    }
    function cabAct(p, a, v) {
      var c = cabState(p), D = c.g != null ? cabItems(p, pv.refs, c.g) : null;
      if (a === 'open') { c.g = v; c.undo = null; }
      else if (a === 'close') { c.g = null; c.undo = null; }
      else if (a === 'folder') { c.fold[c.g] = v; }
      else if (a === 'mode') { c.mode = v === 'folders' ? 'folders' : 'catalog'; }
      else if (a === 'unfold') { c.fold[c.g] = null; }
      else if (a === 'step' && D) { var bay = pv.el.querySelector('.wv-wcab [data-wvbay]'); return cabGo(p, (bay ? +bay.getAttribute('data-pos') : 0) + v); }
      else if (a === 'arrange' && D) { var C0 = cabCur(p, c, D), held = C0.f && C0.f.items[Math.round(c.pos[C0.key] || 0)], cur = c.ar[c.g] || 'list', nx = { list: 'az', az: 'len', len: 'list' }[cur]; c.undo = { ar: cur, pos: c.pos[C0.key] || 0 }; c.ar[c.g] = nx;
        var C1 = cabCur(p, c, cabItems(p, pv.refs, c.g)); c.pos[C1.key] = Math.max(0, C1.f ? C1.f.items.map(function (y) { return y[0]; }).indexOf(held && held[0]) : 0); }   // keeps the card you are at
      else if (a === 'undo' && c.undo) { var C2 = cabCur(p, c, D); c.ar[c.g] = c.undo.ar; c.pos[C2.key] = c.undo.pos; c.undo = null; }
      cabSave(p); cabRedraw(p); try { hap('light'); } catch (e) {}
    }
    // ✋ riffling: the cards follow the finger (up / down or sideways, whichever it moves along), then settle; a short tap pulls one out
    var cabSw = null, RF = null;
    document.addEventListener('pointerdown', function (e) {
      var bay = e.target.closest && e.target.closest('.wv-wcab [data-wvbay]'); cabSw = null; RF = null; if (!bay || !pv || (e.button && e.button > 0)) return;
      RF = { bay: bay, x: e.clientX, y: e.clientY, p0: +bay.getAttribute('data-pos') || 0, n: +bay.getAttribute('data-n') || 0, moved: false, v: 0, t: performance.now(), last: +bay.getAttribute('data-pos') || 0, tick: Math.round(+bay.getAttribute('data-pos') || 0) };
    }, true);
    document.addEventListener('pointermove', function (e) {
      if (!RF) return; var dx = e.clientX - RF.x, dy = e.clientY - RF.y; if (!RF.moved && Math.abs(dx) + Math.abs(dy) < 8) return; RF.moved = true;
      var d = Math.abs(dy) >= Math.abs(dx) ? dy : -dx, pos = Math.max(-.35, Math.min(RF.n - .65, RF.p0 + d / 46)), now = performance.now();
      RF.v = RF.v * .6 + ((pos - RF.last) / Math.max(8, now - RF.t) * 1000) * .4; RF.last = pos; RF.t = now; cabLay(RF.bay, pos, true, Math.min(1, Math.abs(RF.v) / 14));
      var k = Math.round(pos); if (k !== RF.tick) { RF.tick = k; try { hap('selection'); } catch (x) {} }
    }, true);
    document.addEventListener('pointerup', function () {
      var r = RF; RF = null; if (!r || !r.moved || !pv) return; cabSw = 'swiped'; var p = pieceOf(pv.pc); if (!p || p.k !== 'wcab') return;
      cabGo(p, r.last + Math.max(-3, Math.min(3, r.v * .18)));   // a flick carries on a little
    }, true);
    document.addEventListener('pointercancel', function () { if (RF && pv) { var p = pieceOf(pv.pc); if (p) cabGo(p, RF.last); } RF = null; }, true);
    var wheelT = 0;
    document.addEventListener('wheel', function (e) {
      var bay = e.target.closest && e.target.closest('.wv-wcab [data-wvbay]'); if (!bay || !pv) return; e.preventDefault(); e.stopPropagation();
      var pos = Math.max(0, Math.min(+bay.getAttribute('data-n') - 1, (+bay.getAttribute('data-pos') || 0) + (e.deltaY || e.deltaX) / 70)); cabLay(bay, pos, true);
      clearTimeout(wheelT); wheelT = setTimeout(function () { var p = pv && pieceOf(pv.pc); if (p) cabGo(p, pos); }, 140);
    }, { capture: true, passive: false });
    document.addEventListener('keydown', function (e) {
      if (!pv || !pv.el.querySelector('.wv-wcab.open') || /input|textarea|select/i.test((e.target && e.target.tagName) || '')) return; var p = pieceOf(pv.pc); if (!p || p.k !== 'wcab') return;
      if (pv.el.querySelector('.wv-peek')) return;
      if (/^Arrow(Right|Down|Left|Up)$/.test(e.key)) { e.preventDefault(); e.stopPropagation(); cabAct(p, 'step', /Right|Down/.test(e.key) ? 1 : -1); }
      else if (e.key === ' ' || e.key === 'Enter') { var bay = pv.el.querySelector('.wv-wcab [data-wvbay]'), el = bay && bay.querySelector('.ix[data-ci="' + Math.round(+bay.getAttribute('data-pos')) + '"]'); if (el) { e.preventDefault(); e.stopPropagation(); if (el.hasAttribute('data-wvfo')) cabAct(p, 'folder', el.getAttribute('data-wvfo')); else peek(+el.getAttribute('data-wvi')); } }
      else if (e.key === 'Escape') { e.preventDefault(); e.stopPropagation(); var c9 = cabState(p); cabAct(p, c9.mode === 'folders' && c9.fold[c9.g] ? 'unfold' : 'close'); }
    }, true);
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
      pv.el.querySelectorAll('.wv-w.out, .ix.out').forEach(function (x) { x.classList.remove('out'); });
      if (old) old.remove(); var cabEl = el0 && el0.classList.contains('ix') ? el0 : null, r0 = cabEl ? cabEl.getBoundingClientRect() : null, base0 = cabEl ? cabEl.style.transform : '';
      if (el0 && !cabEl) { el0.classList.add('out'); }
      var p = pieceOf(pv.pc), w = String(t.s.title || ''), m = meaningOf(t.s), d = document.createElement('div'); d.className = 'wv-peek' + (p && p.k === 'wcab' ? ' cab' + (cabState(p).mode === 'folders' ? ' paper' : '') : ''); d.setAttribute('role', 'dialog'); d.setAttribute('aria-label', w);
      var cl = t.s.checklist || t.s.checklists, n = Array.isArray(cl) ? cl.length : 0;
      d.innerHTML = '<div class="card"><div class="in"><div class="side a">' + preview(w, formOf(p, r)) + '<small>' + esc(t.k.title || '') + '</small>' + (p.k === 'wcab' ? '<h4>' + esc(w) + '</h4>' + (t.s.titleZh ? '<p class="zh">' + esc(t.s.titleZh) + '</p>' : '') : '') + '<em>tap to flip</em></div>' +
        '<div class="side b"><h4>' + esc(w) + '</h4>' + (t.s.titleZh && t.s.titleZh !== m ? '<p class="zh">' + esc(t.s.titleZh) + '</p>' : '') + '<p>' + (m ? esc(m) : '<span class="dim">No meaning yet — open the card to add one.</span>') + '</p>' + (n ? '<small>☑ ' + n + ' checklist item' + (n === 1 ? '' : 's') + '</small>' : '') + '</div></div></div>' +
        '<div class="acts"><button type="button" data-wvback>⤓ Put back</button>' + (p.k !== 'wcab' && p.k !== 'wtable' ? '<button type="button" data-wvst="' + i + '">🎨 换形态 · Style</button>' : '') + '<button type="button" class="go" data-pvgo="' + i + '">Open card ›</button></div>';
      if (cabEl && cabEl.animate) {   // 🗄 lift it out of the drawer first, then it flies to you and turns over
        var lift = cabEl.animate([{ transform: base0 }, { transform: base0 + ' translateY(-80px) rotateX(4deg)' }], { duration: 200, easing: 'cubic-bezier(.3,.6,.35,1)', fill: 'forwards' });
        d.classList.add('cab-in'); pv.el.appendChild(d); try { hap('light'); } catch (e) {}
        setTimeout(function () {
          if (!d.isConnected) return; var c2 = d.querySelector('.card'), r1 = c2.getBoundingClientRect(), rl = cabEl.getBoundingClientRect(); cabEl.classList.add('out'); try { lift.cancel(); } catch (x) {}
          var dx = (rl.left + rl.width / 2) - (r1.left + r1.width / 2), dy = (rl.top + rl.height / 2) - (r1.top + r1.height / 2);
          d.classList.add('on'); d.classList.remove('cab-in');
          c2.animate([{ transform: 'translate(' + dx + 'px,' + dy + 'px) scale(' + (rl.width / r1.width).toFixed(3) + ',' + (rl.height / r1.height).toFixed(3) + ') rotate(-1.5deg)', opacity: 1 },
            { transform: 'translate(' + (dx * .3) + 'px,' + (dy * .3 - 30) + 'px) scale(.9) rotate(1.5deg)', opacity: 1, offset: .55 }, { transform: 'none', opacity: 1 }], { duration: 480, easing: 'cubic-bezier(.22,.8,.3,1)' });
          setTimeout(function () { if (d.isConnected) d.classList.add('flip'); }, 560);
        }, 190);
        return;
      }
      pv.el.appendChild(d); setTimeout(function () { d.classList.add('on'); }, 20); setTimeout(function () { d.classList.add('flip'); }, 520); try { hap('light'); } catch (e) {}
    }
    function putBackSoft() {   // 🗄 back into its place: it flies over its slot, then slides down into the drawer and settles
      var d = pv && pv.el.querySelector('.wv-peek.cab'), el = pv && pv.el.querySelector('.ix.out'), c2 = d && d.querySelector('.card'); if (!d || !el || !c2 || !c2.animate) return putBack();
      d.classList.remove('flip'); var base = el.style.transform;
      setTimeout(function () {
        if (!d.isConnected) return; var r1 = c2.getBoundingClientRect(); el.classList.remove('out'); el.style.visibility = 'hidden'; var rl = el.getBoundingClientRect();
        var dx = (rl.left + rl.width / 2) - (r1.left + r1.width / 2), dy = (rl.top - 80 + rl.height / 2) - (r1.top + r1.height / 2);
        d.classList.remove('on');
        var a = c2.animate([{ transform: 'none' }, { transform: 'translate(' + dx + 'px,' + dy + 'px) scale(' + (rl.width / r1.width).toFixed(3) + ',' + (rl.height / r1.height).toFixed(3) + ') rotate(1deg)' }], { duration: 330, easing: 'cubic-bezier(.5,0,.3,1)', fill: 'forwards' });
        a.onfinish = function () { d.remove(); el.style.visibility = ''; try { hap('light'); } catch (x) {}
          el.animate([{ transform: base + ' translateY(-80px)' }, { transform: base + ' translateY(5px)', offset: .75 }, { transform: base + ' translateY(-2px)', offset: .9 }, { transform: base }], { duration: 340, easing: 'cubic-bezier(.45,0,.6,1)' }); };
      }, 240);
    }
    function putBack() { if (!pv) return; var d = pv.el.querySelector('.wv-peek'); if (d) d.remove(); pv.el.querySelectorAll('.wv-w.out, .ix.out').forEach(function (x) { x.classList.remove('out'); }); }
    // ✋ 格物致知 for the eight collections: take a thing off its display and hold it — each carrier is handled the way the real
    // object would be: a memory orb lights up and shows its meaning inside, a crystal turns and catches the light, a typography
    // cube or a word block is a whole cube you turn with a finger, a card / pin / plaque turns over to its back, a sculpture
    // turns on its turntable under a spotlight. It lifts off its place, comes to you, and goes back with the right landing
    // (a block drops and bounces, a plaque swings on its hook, a pinned card is pushed back on). Long-press and drag a thing
    // onto another to swap their places on the display (only the display's order — the Kanban lists never change).
    var LIFT = { orb: [{ transform: 'none', filter: 'none' }, { transform: 'translateY(-14px) scale(1.06)', filter: 'brightness(1.5)' }], crystal: [{ transform: 'none' }, { transform: 'translateY(-20px)' }],
      cube: [{ transform: 'none' }, { transform: 'translateY(-4px) scale(1.14)' }], card: [{ transform: 'none' }, { transform: 'translateY(-12px) rotate(0deg) scale(1.05)' }], pin: [{ transform: 'none' }, { transform: 'translateY(-8px) rotate(-10deg)' }],
      wblock: [{ transform: 'none' }, { transform: 'translateY(-22px) rotate(-8deg)' }], plaque: [{ transform: 'none' }, { transform: 'translateY(-14px) rotate(3deg)' }], sculpt: [{ transform: 'none' }, { transform: 'translateY(-6px) scale(1.05)' }] };
    var LAND = { orb: [{ transform: 'translateY(-16px)', filter: 'brightness(1.6)' }, { transform: 'translateY(2px)', filter: 'brightness(1.2)', offset: .7 }, { transform: 'none', filter: 'none' }],
      crystal: [{ transform: 'translateY(-18px)' }, { transform: 'translateY(2px)', offset: .75 }, { transform: 'none' }], cube: [{ transform: 'scale(1.16)' }, { transform: 'scale(.96)', offset: .7 }, { transform: 'none' }],
      card: [{ transform: 'scale(1.07)' }, { transform: 'scale(.96)', offset: .6 }, { transform: 'none' }], pin: [{ transform: 'scale(1.12)' }, { transform: 'scale(.94)', offset: .55 }, { transform: 'none' }],
      wblock: [{ transform: 'translateY(-42px) rotate(-6deg)' }, { transform: 'translateY(3px) rotate(0deg)', offset: .55 }, { transform: 'translateY(-9px)', offset: .75 }, { transform: 'translateY(1px)', offset: .9 }, { transform: 'none' }],
      plaque: [{ transform: 'rotate(8deg)' }, { transform: 'rotate(-5deg)', offset: .35 }, { transform: 'rotate(3deg)', offset: .6 }, { transform: 'rotate(-1deg)', offset: .82 }, { transform: 'none' }],
      sculpt: [{ transform: 'translateY(-10px)' }, { transform: 'none' }] };
    var MS = null;   // the thing in your hand: { i, el, stage, rot, kind, carrier, rx, ry }
    function msSize(carrier) { var dm = (MI && MI.dim[carrier]) || [12, 12], W = pv.el.clientWidth || innerWidth, H = pv.el.clientHeight || innerHeight; return Math.max(8, Math.min(Math.min(W * .74, 400) / dm[0], Math.min(H * .46, 360) / dm[1])); }
    function msApply(ease) {
      if (!MS) return; MS.rot.style.transition = ease ? 'transform .55s cubic-bezier(.2,.9,.3,1.12)' : 'none';
      MS.rot.style.transform = 'rotateX(' + MS.rx.toFixed(1) + 'deg) rotateY(' + MS.ry.toFixed(1) + 'deg)';
      MS.stage.style.setProperty('--sh', (((MS.ry % 360) + 360) % 360 / 360).toFixed(3)); MS.stage.style.setProperty('--tx', (MS.ry / 40).toFixed(2)); MS.stage.style.setProperty('--ty', (MS.rx / 40).toFixed(2));
    }
    function msTurn() {   // a tap: turn it over / light it / roll it to the next face
      if (!MS) return; try { hap('light'); } catch (e) {}
      if (MS.kind === 'glow') { MS.stage.classList.toggle('lit'); return; }
      if (MS.kind === 'solid') { MS.ry = Math.round((MS.ry + 18) / 90) * 90 - 90 - 18; MS.rx = -12; }
      else if (MS.kind === 'turn') { MS.rot.animate([{ transform: 'rotateY(0)' }, { transform: 'rotateY(-32deg)', offset: .3 }, { transform: 'rotateY(26deg)', offset: .65 }, { transform: 'rotateY(0)' }], { duration: 1200, easing: 'ease-in-out' }); return; }
      else { MS.ry = Math.round(MS.ry / 180) * 180 + 180; MS.rx = 0; }
      msApply(true);
    }
    function msSnap() {
      if (!MS) return; var k = MS.kind;
      if (k === 'solid') { var up = Math.abs(MS.rx) > 45; MS.ry = Math.round((MS.ry + 18) / 90) * 90 - (up ? 0 : 18); MS.rx = up ? (MS.rx > 0 ? 90 : -90) : -12; }
      else if (k === 'flip') { MS.ry = Math.round(MS.ry / 180) * 180; MS.rx = 0; }
      else if (k === 'glow') { MS.ry = 0; MS.rx = 0; }
      else { MS.rx = 0; MS.ry = 0; }   // a sculpture swings back to face you on its stand
      msApply(true);
    }
    function stageOpen(i) {
      if (!pv) return; var r = pv.refs[i], t = thing(r), p = pieceOf(pv.pc); if (!t || !p || !MI) return; putBack(); stageClose(true); var stS = pv.el.querySelector('.wv-style'); if (stS) stS.remove();
      var carrier = formOf(p, r); if (!MI.has(carrier)) return peek(i);
      var el = pv.el.querySelector('[data-wvi="' + i + '"]'), info = itemInfo(r), kind = MI.handle[carrier] || 'flip', size = msSize(carrier), v = varOf(p, r), opt = { size: size, v: v };
      var obj = kind === 'solid' ? MI.solid(info, carrier, opt) : '<div class="ms-face front">' + MI.html(info, carrier, opt) + '</div>' + (kind === 'turn' ? '' : '<div class="ms-face back">' + MI.back(info, carrier, opt) + '</div>');
      var mean = meaningOf(t.s), zh = String(t.s.titleZh || '').trim(), hint = { glow: 'tap the orb to light it · drag to tilt', flip: 'drag to turn it · tap to turn it over', solid: 'drag to roll the cube · tap for the next side', turn: 'drag to turn it on its stand' }[kind];
      var d = document.createElement('div'); d.className = 'mx-stage h-' + kind + ' c-' + carrier; d.setAttribute('role', 'dialog'); d.setAttribute('aria-label', String(t.s.title || ''));
      d.innerHTML = '<i class="ms-spot"></i><div class="ms-obj"><div class="ms-rot">' + obj + '</div><i class="ms-shadow"></i></div>' +
        '<div class="ms-cap"><b>' + esc(t.s.title || '') + '</b>' + (zh ? '<small>' + esc(zh) + '</small>' : '') + (kind === 'turn' && mean ? '<p>' + esc(mean) + '</p>' : '') + '<em>' + hint + '</em></div>' +
        '<div class="ms-acts"><button type="button" data-msback>⤓ Put back</button><button type="button" data-msturn>↻ ' + (kind === 'glow' ? 'Light' : kind === 'solid' ? 'Roll' : 'Turn') + '</button><button type="button" data-wvst="' + i + '">🎨 换形态</button><button type="button" class="go" data-pvgo="' + i + '">Open card ›</button></div>';
      pv.el.appendChild(d); MS = { i: i, el: el, stage: d, rot: d.querySelector('.ms-rot'), kind: kind, carrier: carrier, rx: kind === 'solid' ? -12 : 0, ry: kind === 'solid' ? -18 : 0 }; msApply(false);
      var o = d.querySelector('.ms-obj'), r0 = el && el.getBoundingClientRect();
      if (el && el.animate && r0 && r0.width) {   // it lifts off its place, then comes to you
        var lift = el.animate(LIFT[carrier] || LIFT.card, { duration: 200, easing: 'cubic-bezier(.3,.6,.35,1)', fill: 'forwards' });
        d.classList.add('arrive');
        setTimeout(function () { if (!MS || MS.stage !== d) return; var r1 = o.getBoundingClientRect(), rl = el.getBoundingClientRect(); el.classList.add('ms-out'); try { lift.cancel(); } catch (x) {}
          var dx = (rl.left + rl.width / 2) - (r1.left + r1.width / 2), dy = (rl.top + rl.height / 2) - (r1.top + r1.height / 2), sc = Math.max(.08, Math.min(rl.width / r1.width, rl.height / r1.height));
          d.classList.remove('arrive'); d.classList.add('on');
          o.animate([{ transform: 'translate(' + dx + 'px,' + dy + 'px) scale(' + sc.toFixed(3) + ')' }, { transform: 'translate(' + (dx * .3) + 'px,' + (dy * .3 - 34) + 'px) scale(' + ((sc + 1) / 2 * .92).toFixed(3) + ')', offset: .55 }, { transform: 'none' }], { duration: 500, easing: 'cubic-bezier(.22,.8,.3,1)' });
        }, 190);
      } else d.classList.add('on');
      try { hap('light'); } catch (e) {}
      // handling: drag to turn / tilt, tap to turn over (the finger is the hand)
      var G = null;
      o.addEventListener('pointerdown', function (e) { if (e.button && e.button > 0) return; e.stopPropagation(); G = { x: e.clientX, y: e.clientY, rx: MS.rx, ry: MS.ry, moved: false, v: 0, t: performance.now(), lx: e.clientX }; try { o.setPointerCapture(e.pointerId); } catch (x) {} });
      o.addEventListener('pointermove', function (e) {
        if (!G || !MS) return; var dx = e.clientX - G.x, dy = e.clientY - G.y; if (!G.moved && Math.abs(dx) + Math.abs(dy) < 7) return; G.moved = true;
        var lim = MS.kind === 'solid' ? 100 : MS.kind === 'turn' ? 0 : 28, now = performance.now();
        MS.ry = G.ry + dx * (MS.kind === 'glow' ? .25 : .55); if (MS.kind === 'glow') MS.ry = Math.max(-28, Math.min(28, MS.ry)); if (MS.kind === 'turn') MS.ry = Math.max(-42, Math.min(42, MS.ry)); MS.rx = Math.max(-lim, Math.min(lim, G.rx - dy * .45));
        G.v = G.v * .5 + ((e.clientX - G.lx) / Math.max(8, now - G.t)) * .5; G.lx = e.clientX; G.t = now; msApply(false);
      });
      o.addEventListener('pointerup', function (e) {
        var g = G; G = null; if (!g || !MS) return; e.stopPropagation(); if (!g.moved) { MS.tapT = Date.now(); return msTurn(); }
        MS.tapT = Date.now(); if (MS.kind === 'solid' || MS.kind === 'flip') MS.ry += Math.max(-180, Math.min(180, g.v * 160));   // a flick spins it on
        msSnap();
      });
      d.addEventListener('click', function (e) {
        if (e.target.closest('[data-pvgo]')) { stageClose(true); return; }   // the piece view opens the card
        if (e.target.closest('[data-wvst]')) { var si = +e.target.closest('[data-wvst]').getAttribute('data-wvst'); e.stopPropagation(); stageClose(true); return stOpen(si); }
        e.stopPropagation();
        if (e.target.closest('[data-msturn]')) return msTurn();
        if (e.target.closest('[data-msback]') || (e.target === d && !(MS && MS.tapT && Date.now() - MS.tapT < 300))) return stageClose(false);
      });
    }
    function stageClose(now) {   // back to its place: it turns to the front, flies over its spot, and lands the way that thing lands
      var m = MS; if (!m) return; MS = null; var d = m.stage, el = m.el;
      if (now || !el || !el.animate || !d.isConnected) { d.remove(); if (el) el.classList.remove('ms-out'); return; }
      m.rx = 0; m.ry = Math.round(m.ry / 360) * 360; MS = m; msApply(true); MS = null; d.classList.remove('lit');
      setTimeout(function () {
        if (!d.isConnected) return; var o = d.querySelector('.ms-obj'), r1 = o.getBoundingClientRect(); el.classList.remove('ms-out'); el.style.visibility = 'hidden'; var rl = el.getBoundingClientRect();
        var dx = (rl.left + rl.width / 2) - (r1.left + r1.width / 2), dy = (rl.top + rl.height / 2 - 30) - (r1.top + r1.height / 2), sc = Math.max(.08, Math.min(rl.width / r1.width, rl.height / r1.height));
        d.classList.remove('on'); d.classList.add('leave');
        var a = o.animate([{ transform: 'none' }, { transform: 'translate(' + dx + 'px,' + dy + 'px) scale(' + sc.toFixed(3) + ')' }], { duration: 360, easing: 'cubic-bezier(.5,0,.3,1)', fill: 'forwards' });
        a.onfinish = function () { d.remove(); el.style.visibility = ''; try { hap('light'); } catch (x) {} el.animate(LAND[m.carrier] || LAND.card, { duration: m.carrier === 'plaque' ? 900 : m.carrier === 'wblock' ? 520 : 380, easing: 'ease-out' }); };
      }, 260);
    }
    // ✊ long-press a thing on one of these displays, drag it onto another: they swap places (the display's order only)
    var HOLD = null, holdSkip = 0;
    document.addEventListener('pointerdown', function (e) {
      var c = e.target.closest && e.target.closest('.mn-pv .mx .mx-c'); HOLD = null; if (!c || MS || !pv || (e.button && e.button > 0)) return; var w = c.querySelector('[data-wvi]'); if (!w) return;
      HOLD = { c: c, i: +w.getAttribute('data-wvi'), x: e.clientX, y: e.clientY, on: false, t: setTimeout(function () {
        if (!HOLD) return; HOLD.on = true; try { hap('medium'); } catch (x) {} c.classList.add('ms-held'); var r = c.getBoundingClientRect(), g = c.cloneNode(true); g.className = 'mx-c ms-ghost'; g.style.cssText = 'position:fixed;left:' + r.left + 'px;top:' + r.top + 'px;width:' + r.width + 'px;height:' + r.height + 'px;margin:0;z-index:2147483600;pointer-events:none;';
        document.body.appendChild(g); HOLD.g = g; HOLD.ox = HOLD.x - r.left; HOLD.oy = HOLD.y - r.top; }, 380) };
    }, true);
    document.addEventListener('pointermove', function (e) {
      if (!HOLD) return; if (!HOLD.on) { if (Math.abs(e.clientX - HOLD.x) + Math.abs(e.clientY - HOLD.y) > 10) { clearTimeout(HOLD.t); HOLD = null; } return; }
      e.preventDefault(); HOLD.g.style.left = (e.clientX - HOLD.ox) + 'px'; HOLD.g.style.top = (e.clientY - HOLD.oy) + 'px';
      var under = document.elementFromPoint(e.clientX, e.clientY), tc = under && under.closest && under.closest('.mn-pv .mx .mx-c'); pv.el.querySelectorAll('.mx-c.ms-drop').forEach(function (x) { x.classList.remove('ms-drop'); }); if (tc && tc !== HOLD.c) tc.classList.add('ms-drop');
    }, { capture: true, passive: false });
    document.addEventListener('touchmove', function (e) { if (HOLD && HOLD.on) e.preventDefault(); }, { capture: true, passive: false });
    document.addEventListener('pointerup', function (e) {
      var h = HOLD; HOLD = null; if (!h) return; clearTimeout(h.t); if (!h.on) return; holdSkip = Date.now(); if (h.g) h.g.remove(); h.c.classList.remove('ms-held');
      var tgt = pv && pv.el.querySelector('.mx-c.ms-drop'); if (pv) pv.el.querySelectorAll('.mx-c.ms-drop').forEach(function (x) { x.classList.remove('ms-drop'); }); var p = pv && pieceOf(pv.pc); if (!tgt || !p) return;
      var w2 = tgt.querySelector('[data-wvi]'), a = pv.refs[h.i], b = w2 && pv.refs[+w2.getAttribute('data-wvi')], it = (p.it || []).slice(), ia = it.indexOf(a), ib = it.indexOf(b); if (ia < 0 || ib < 0) return;
      it[ia] = b; it[ib] = a; p.it = it; save(); pv.refs = pvOrder(p); var bd = pv.el.querySelector('.pv-body'); if (bd) bd.innerHTML = body(p, pv.refs);
      [a, b].forEach(function (r) { var x = pv.el.querySelector('[data-wvi="' + pv.refs.indexOf(r) + '"]'); if (x && x.animate) x.animate([{ transform: 'scale(1.12)' }, { transform: 'scale(.96)', offset: .6 }, { transform: 'none' }], { duration: 360, easing: 'ease-out' }); });
      try { hap('success'); } catch (x) {}
    }, true);
    document.addEventListener('keydown', function (e) {
      if (!MS) return; if (e.key === 'Escape') { e.preventDefault(); e.stopPropagation(); stageClose(false); }
      else if (e.key === ' ' || e.key === 'Enter') { e.preventDefault(); e.stopPropagation(); msTurn(); }
      else if (/^Arrow/.test(e.key)) { e.preventDefault(); e.stopPropagation(); if (e.key === 'ArrowLeft') MS.ry -= MS.kind === 'solid' ? 90 : 180; if (e.key === 'ArrowRight') MS.ry += MS.kind === 'solid' ? 90 : 180; if (e.key === 'ArrowUp' && MS.kind === 'solid') MS.rx = 90; if (e.key === 'ArrowDown' && MS.kind === 'solid') MS.rx = MS.rx > 0 ? 0 : -90; if (MS.kind === 'glow') { MS.stage.classList.toggle('lit'); return; } msSnap(); }
    }, true);
    // 🎨 换形态 · Style: one thing (from its pulled-out card) or the whole display (from its head) — every carrier and form,
    // drawn with this word, and the finishes of the chosen one; it changes live, ✓ 完成 keeps it (it is the island's layout, synced)
    var ST = null;   // { i: thing index or -1, scope: 'one' | 'all' }
    function stHtml(p) {
      var ref = ST.i >= 0 ? pv.refs[ST.i] : null, t = thing(ref || pv.refs[0]), w = String((t && t.s.title) || 'Word').trim(), one = ST.scope === 'one' && ref;
      var cur = one ? formOf(p, ref) : (p.wf || DEF_FORM[p.k] || 'tile'), vcur = one ? varOf(p, ref) : (p.wv || ''), V2 = MI && MI.variants[cur];
      var big = MI && MI.has(cur) ? '<div class="wv-w f-item wv-pre">' + MI.html(ref ? itemInfo(ref) : { id: w, title: w }, cur, { v: vcur, size: 7 }) + '</div>' : preview(w, cur);
      return '<div class="st-card"><div class="st-head"><b>🎨 换形态 · Style</b><button type="button" class="x" data-wvsx aria-label="Close">✕</button></div>' +
        (ref ? '<div class="st-scope"><button type="button" data-wvss="one"' + (one ? ' class="on"' : '') + '>只改「' + esc(w) + '」</button><button type="button" data-wvss="all"' + (one ? '' : ' class="on"') + '>整个展架 · ' + pv.refs.length + '</button></div>' : '<p class="st-note">整个展架 · ' + pv.refs.length + ' 个 · 单个的样式在点开它后改</p>') +
        '<div class="st-prev">' + big + '</div>' +
        (V2 ? '<h5>材质 · Finish</h5><div class="st-vars"><button type="button" data-wvsv=""' + (vcur ? '' : ' class="on"') + '>✨ 混搭 Mix</button>' + V2.map(function (v) { return '<button type="button" data-wvsv="' + v + '"' + (vcur === v ? ' class="on"' : '') + '>' + v + '</button>'; }).join('') + '</div>' : '') +
        '<h5>形态 · Form</h5><div class="st-grid">' + FORMS.map(function (f) { return '<button type="button" data-wvsf="' + f[0] + '"' + (f[0] === cur ? ' class="on"' : '') + '><span class="pv">' + (MI && MI.has(f[0]) ? '<div class="wv-w f-item wv-pre">' + MI.html({ id: w, title: w, list: t ? t.k.title : '' }, f[0], { size: 3.2 }) + '</div>' : preview(w, f[0])) + '</span><small>' + esc(f[1]) + '</small></button>'; }).join('') + '</div>' +
        '<div class="st-foot">' + (one && ((p.wfi && p.wfi[ref]) || (p.wvi && p.wvi[ref])) ? '<button type="button" data-wvsreset>↺ 跟随展架</button>' : '<span></span>') + '<button type="button" class="go" data-wvsx>✓ 完成</button></div></div>';
    }
    // 🗄 展架 · Display: change this display to another fixture (its things stay on it), grouped by the seven kinds
    var CAT = { wlib: 'Shelf', wwall: 'Wall', wcab: 'Cabinet', wtable: 'Tabletop', wtree: 'Outdoor', wblocks: 'Shelf', wgallery: 'Pedestal', wgarden: 'Outdoor' }, CATS = ['Wall', 'Shelf', 'Cabinet', 'Tabletop', 'Pedestal', 'Hanging', 'Outdoor'];
    var CATZH = { Wall: '墙面', Shelf: '书架', Cabinet: '柜子', Tabletop: '桌面', Pedestal: '展台', Hanging: '悬挂', Outdoor: '户外' };
    function dkOpen() {
      if (!pv) return; putBack(); stageClose(true); var p = pieceOf(pv.pc); if (!p) return; var old = pv.el.querySelector('.wv-style'); if (old) old.remove();
      var cat = function (d) { var k = MI && MI.kindOf(d[0]); return k ? k[2] : CAT[d[0]] || 'Shelf'; }, smart = recommend((p.it || []).filter(thing).length, (p.it || []).filter(thing)).map(function (x) { return x[0]; }).slice(0, 3);
      var d = document.createElement('div'); d.className = 'wv-style dk'; d.setAttribute('role', 'dialog'); d.setAttribute('aria-label', 'Display');
      d.innerHTML = '<div class="st-card"><div class="st-head"><b>🗄 展架 · Display</b><button type="button" class="x" data-wvdx aria-label="Close">✕</button></div><p class="st-note">换一个展架，上面的东西不变 · its things stay on it · ✨ = Smart picks for these cards</p>' +
        CATS.map(function (c) { var L = DISPLAYS.filter(function (x) { return cat(x) === c; }); if (!L.length) return '';
          return '<h5>' + CATZH[c] + ' · ' + c + '</h5><div class="dk-grid">' + L.map(function (x) { return '<button type="button" data-wvdk2="' + x[0] + '"' + (x[0] === p.k ? ' class="on"' : '') + '><b>' + esc(x[1]) + (smart.indexOf(x[0]) >= 0 ? ' ✨' : '') + '</b><small>' + esc(String(x[2]).replace(/ · \w+$/, '')) + '</small></button>'; }).join('') + '</div>'; }).join('') + '</div>';
      pv.el.appendChild(d);
      d.addEventListener('click', function (e) {
        e.stopPropagation(); var g = e.target.closest('[data-wvdk2]');
        if (e.target.closest('[data-wvdx]') || e.target === d) return d.remove();
        if (!g) return; var k = g.getAttribute('data-wvdk2'), q = pieceOf(pv.pc); if (!q || k === q.k) return d.remove();
        var n = (q.it || []).filter(thing).length; q.k = k; q.wf = DEF_FORM[k] || q.wf; delete q.wfi; delete q.wv; delete q.wvi; q.s = q.s || 1; while (capOf(q) < n && q.s < 2.5) q.s = Math.round((q.s + .25) * 100) / 100; if (!fits(q)) settle(q, q.x, q.y);
        save(); render(); d.remove(); var pc = q.id; try { openPiece(pc); } catch (x) {} try { hap('success'); } catch (x) {}
      });
    }
    function stOpen(i) { putBack(); stageClose(true); var p = pieceOf(pv.pc); if (!p) return; ST = { i: i, scope: i >= 0 ? 'one' : 'all' }; var d = pv.el.querySelector('.wv-style'); if (!d) { d = document.createElement('div'); d.className = 'wv-style'; d.setAttribute('role', 'dialog'); d.setAttribute('aria-label', 'Style'); pv.el.appendChild(d); } d.innerHTML = stHtml(p); }
    function stDraw() { var d = pv && pv.el.querySelector('.wv-style'), p = pv && pieceOf(pv.pc); if (!d || !p) return; var sc = d.querySelector('.st-grid') ? d.querySelector('.st-grid').scrollTop : 0; d.innerHTML = stHtml(p); var g2 = d.querySelector('.st-grid'); if (g2) g2.scrollTop = sc; var b = pv.el.querySelector('.pv-body'); if (b) b.innerHTML = body(p, pv.refs); }
    function stClose() { var d = pv && pv.el.querySelector('.wv-style'); if (d) d.remove(); ST = null; }
    function stAct(p, e) {
      var g, ref = ST.i >= 0 ? pv.refs[ST.i] : null, one = ST.scope === 'one' && ref;
      if (e.target.closest('[data-wvsx]') || e.target.classList.contains('wv-style')) { stClose(); save(); render(); return true; }
      if ((g = e.target.closest('[data-wvss]'))) { ST.scope = g.getAttribute('data-wvss'); stDraw(); return true; }
      if ((g = e.target.closest('[data-wvsf]'))) { var f = g.getAttribute('data-wvsf');
        if (one) setForm(p, f, ref); else { setForm(p, f); delete p.wvi; if (!(MI && MI.variants[f])) delete p.wv; }
        save(); stDraw(); try { hap('light'); } catch (x) {} return true; }
      if ((g = e.target.closest('[data-wvsv]'))) { var v = g.getAttribute('data-wvsv');
        if (one) { p.wvi = Object.assign({}, p.wvi || {}); if (v) p.wvi[ref] = v; else delete p.wvi[ref]; } else { if (v) p.wv = v; else delete p.wv; delete p.wvi; }
        save(); stDraw(); return true; }
      if (e.target.closest('[data-wvsreset]') && ref) { if (p.wfi) delete p.wfi[ref]; if (p.wvi) delete p.wvi[ref]; save(); stDraw(); return true; }
      return true;
    }
    document.addEventListener('click', function (e) {
      if (!pv || !e.target.closest || !pv.el.contains(e.target)) return; var g, p = pieceOf(pv.pc); if (!isVocab(p)) return;
      if (ST && e.target.closest('.wv-style')) { e.stopPropagation(); return stAct(p, e); }
      if ((g = e.target.closest('[data-wvst]'))) { e.stopPropagation(); var si = g.getAttribute('data-wvst'); return stOpen(si === '' ? -1 : +si); }
      if (e.target.closest('[data-wvdk]')) { e.stopPropagation(); return dkOpen(); }
      if (e.target.closest('[data-pvgo]')) { putBack(); stageClose(true); return; }   // the piece view opens the card (the Item level)
      if (e.target.closest('[data-wvback]') || e.target.classList.contains('wv-peek')) { e.stopPropagation(); return p.k === 'wcab' ? putBackSoft() : putBack(); }
      if ((g = e.target.closest('.wv-peek .card'))) { e.stopPropagation(); g.parentNode.classList.toggle('flip'); return; }
      if (p.k === 'wcab') {
        if (cabSw === 'swiped') { cabSw = null; if (e.target.closest('[data-wvbay]')) { e.stopPropagation(); return; } }
        if ((g = e.target.closest('[data-wvdo]'))) { e.stopPropagation(); return cabAct(p, 'open', +g.getAttribute('data-wvdo')); }
        if (e.target.closest('[data-wvcx]')) { e.stopPropagation(); return cabAct(p, 'close'); }
        if ((g = e.target.closest('[data-wvfo]'))) { e.stopPropagation(); return cabAct(p, 'folder', g.getAttribute('data-wvfo')); }
        if ((g = e.target.closest('[data-wvcm]'))) { e.stopPropagation(); return cabAct(p, 'mode', g.getAttribute('data-wvcm')); }
        if (e.target.closest('[data-wvfx]')) { e.stopPropagation(); return cabAct(p, 'unfold'); }
        if ((g = e.target.closest('[data-wvcn]'))) { e.stopPropagation(); return cabAct(p, 'step', +g.getAttribute('data-wvcn')); }
        if (e.target.closest('[data-wvca]')) { e.stopPropagation(); return cabAct(p, 'arrange'); }
        if (e.target.closest('[data-wvcu]')) { e.stopPropagation(); return cabAct(p, 'undo'); }
        if (!e.target.closest('button') && e.target.closest('.wv-wcab.open.folders') && pv.el.querySelector('.wv-wcab .bay.folder')) { e.stopPropagation(); return cabAct(p, 'unfold'); }   // the open folder: a tap beside the papers puts it back on the rail
        if ((g = e.target.closest('.ix[data-ci]'))) { var bay = g.parentNode, ci = +g.getAttribute('data-ci'); if (Math.round(+bay.getAttribute('data-pos')) !== ci) { e.stopPropagation(); return cabGo(p, ci); } }   // a card behind: bring it up first; the one you are at slides out
      }
      if ((g = e.target.closest('[data-wvsort]'))) { e.stopPropagation(); SORT[p.id] = g.getAttribute('data-wvsort'); var b = pv.el.querySelector('.pv-body'); if (b) b.innerHTML = body(p, pv.refs); return; }
      if ((g = e.target.closest('[data-wvfc]')) || (g = e.target.closest('[data-wvflip]'))) { e.stopPropagation(); var f = fcOf(p, pv.refs), a = g.getAttribute('data-wvfc'), cur = f.order[f.at];
        if (!a) f.flip = !f.flip; else if (a === 'next' && f.at < f.n - 1) { f.at++; f.flip = false; } else if (a === 'prev' && f.at) { f.at--; f.flip = false; }
        else if (a === 'know' || a === 'again') { f[a === 'know' ? 'known' : 'again'][cur] = 1; delete f[a === 'know' ? 'again' : 'known'][cur]; if (f.at < f.n - 1) { f.at++; f.flip = false; } }
        else if (a === 'mix') { for (var j = f.order.length - 1; j > 0; j--) { var q = Math.floor(Math.random() * (j + 1)), x = f.order[j]; f.order[j] = f.order[q]; f.order[q] = x; } f.at = 0; f.flip = false; }
        var tb = pv.el.querySelector('.wv-wtable .table'); if (tb) tb.innerHTML = fcHtml(p, pv.refs); return; }
      if ((g = e.target.closest('[data-wvi]'))) { e.stopPropagation(); if (Date.now() - holdSkip < 400) return; var i = +g.getAttribute('data-wvi'); if (g.classList.contains('out')) return putBack(); return MI && MI.isDisplay(p.k) && !g.classList.contains('ix') ? stageOpen(i) : peek(i); }
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
      var R0 = recommend(g.refs.length, g.refs), pick = R0[i % R0.length], kind = K[pick[0]] ? pick[0] : 'wwall', left = g.refs.slice(), made = 0, n = 0, first = null;
      while (left.length && made < 4) { var q = sbPlace(kind); if (!q) break; made++; if (!first) first = q; q.label = String(g.L.k.title || '').replace(/^my\s+/i, '') + (made > 1 ? ' ' + made : ''); q.wf = pick[1] || DEF_FORM[kind]; var put = fill(q, left); n += put; left = left.slice(put); if (!put) break; }   // a big list: a zoned display (up to four)
      return made ? DISPLAYS.filter(function (d) { return d[0] === kind; })[0][1] + ' for “' + String(g.L.k.title || '') + '” — ' + n + ' word' + (n === 1 ? '' : 's') + (made > 1 ? ' in ' + made + ' zones' : '') + ' · ' + FORMS.filter(function (f) { return f[0] === (pick[1] || DEF_FORM[kind]); })[0][1] : 'no room for another display here';
    }
    function switchKind(p, i) {   // the open display becomes another word display (its words stay)
      if (!p) return ''; var n = (p.it || []).filter(thing).length, R0 = recommend(n, (p.it || []).filter(thing)).concat(DISPLAYS.map(function (d) { return [d[0], DEF_FORM[d[0]]]; })).filter(function (x, j, a) { return x[0] !== p.k && a.map(function (y) { return y[0]; }).indexOf(x[0]) === j; }), pick = R0[i % R0.length];
      p.k = pick[0]; p.wf = pick[1]; p.s = p.s || 1; while (capOf(p) < n && p.s < 2.5) p.s = Math.round((p.s + .25) * 100) / 100; if (!fits(p)) settle(p, p.x, p.y);
      return 'as a ' + DISPLAYS.filter(function (d) { return d[0] === pick[0]; })[0][1];
    }
    function cycleForm(p, i) { if (!p) return ''; var cur = p.wf || DEF_FORM[p.k] || 'tile', ix = FORMS.map(function (f) { return f[0]; }).indexOf(cur), f = FORMS[(ix + 1 + i) % FORMS.length]; p.wf = f[0]; if (p.wfi) delete p.wfi; return 'every word as a ' + f[1]; }
    function setForm(p, form, ref) { if (!p) return; if (ref) { p.wfi = Object.assign({}, p.wfi || {}); if (form === (p.wf || DEF_FORM[p.k])) delete p.wfi[ref]; else p.wfi[ref] = form; } else { p.wf = form; delete p.wfi; } }
    VOCAB = { style: function (i) { if (pv) stOpen(i == null ? -1 : i); }, varOf: varOf, displays: DISPLAYS, forms: FORMS, isVocab: isVocab, formOf: formOf, like: like, recommend: recommend, place: place, switchKind: switchKind, cycleForm: cycleForm, setForm: setForm, preview: preview, meaningOf: meaningOf, bigList: bigList };
  })();

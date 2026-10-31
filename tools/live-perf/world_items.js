  /* ── 53.89 · My World — Item 实体化: the Universal Item Generator + the Exhibition Generator (window.MinestItems)
     Card → 3D Item → Display Fixture → Room / Building → Island. No model per card: each Item is a classic shape built from
     shared CSS parts (glass, crystal, ceramic, card stock, enamel, walnut, marble, resin…), the card's own words as live text
     and its own picture, so one word can be a glowing memory orb, an engraved crystal, a typography cube or a walnut plaque.
     9 universal carriers   orb · crystal · cube · card (6 stocks) · pin · wblock · plaque · sculpt (3 stones) · print (2 plastics)
     5 content carriers     vinyl (Music) · poster (Movies) · book (Books) · game (Video Games) · doll (People)
     16 displays in 7 kinds Wall · Shelf · Cabinet · Tabletop · Pedestal · Hanging · Outdoor (the 8 chosen pairings first)
     Smart reads the cards (list / board names, labels, pictures, length of the words) and picks a carrier and a display;
     Suggest walks through the others. Everything refers to the Kanban card (refs) — nothing is copied, no list changes. */
  window.MinestItems = window.MinestItems || (function () {
    function esc(s) { return String(s == null ? '' : s).replace(/[&<>"']/g, function (c) { return { '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' }[c]; }); }
    function hash(s) { s = String(s || ''); var h = 2166136261 >>> 0; for (var i = 0; i < s.length; i++) { h ^= s.charCodeAt(i); h = Math.imul(h, 16777619); } return h >>> 0; }
    var CARRIERS = [
      ['orb', '🔮 Memory Orb', 'smoked glass globe, the word glowing inside'], ['crystal', '💠 Crystal Award', 'a round crystal, the word engraved'],
      ['cube', '🧊 Typography Cube', 'a glazed ceramic cube, the word on its face'], ['card', '🗂 Cardstock', 'laminated, die-cut, layered, matte, acrylic, clipped'],
      ['pin', '📍 Enamel Pin', 'gold rim, coloured enamel, a ribbon'], ['wblock', '🪵 Word Block', 'a walnut block, the word carved on three sides'],
      ['plaque', '🪧 Walnut Plaque', 'carved letters, a quote or a meaning'], ['sculpt', '🗿 Sculpture', 'marble, bronze or low-poly on a plinth'],
      ['print', '🖨 3D Print', 'the word printed in resin or PLA'],
      ['vinyl', '💿 Vinyl Record', 'for music'], ['poster', '🎬 Movie Poster', 'for films'], ['book', '📕 Book', 'for books'], ['game', '🎮 Game Box', 'for video games'], ['doll', '🧸 Figure', 'for people']];
    var VARIANTS = { card: ['laminated', 'diecut', 'layered', 'matte', 'acrylic', 'clip'], sculpt: ['marble', 'bronze', 'lowpoly'], print: ['resin', 'pla'] };
    var KINDS = [   // [id, name, kind of display, carrier it is made for, the scene piece it borrows on the island]
      ['xorbs', '🔮 Orb Archive', 'Cabinet', 'orb', 'grid'], ['xpodium', '🏆 Ranking Podium', 'Pedestal', 'crystal', 'gallery'], ['xcubes', '🧊 Cube Wall', 'Wall', 'cube', 'wall'],
      ['xboard', '📌 Bulletin Board', 'Wall', 'card', 'wall'], ['xpins', '📍 Pin Wall', 'Wall', 'pin', 'wall'], ['xblocks', '🪵 Walnut Block Shelf', 'Shelf', 'wblock', 'shelf'],
      ['xplaques', '🪧 Plaque Wall', 'Wall', 'plaque', 'wall'], ['xsculpt', '🗿 Sculpture Gallery', 'Pedestal', 'sculpt', 'gallery'],
      ['xrecords', '💿 Record Rack', 'Shelf', 'vinyl', 'shelf'], ['xposters', '🎬 Poster Wall', 'Wall', 'poster', 'wall'], ['xbooks', '📕 Bookcase', 'Shelf', 'book', 'books'],
      ['xgames', '🎮 Game Shelf', 'Shelf', 'game', 'shelf'], ['xdolls', '🧸 Figure Shelf', 'Cabinet', 'doll', 'shelf'], ['xlanterns', '🏮 Hanging Lanterns', 'Hanging', 'orb', 'gallery'],
      ['xsgarden', '🌳 Sculpture Garden', 'Outdoor', 'sculpt', 'garden'], ['xtable', '🧱 Block Table', 'Tabletop', 'wblock', 'table']];
    var USE = { xorbs: 'glowing memory orbs in a dark archive', xpodium: 'crystal awards ranked on a podium', xcubes: 'ceramic word cubes on a white wall', xboard: 'cards of every stock pinned to cork',
      xpins: 'enamel pins on a felt board', xblocks: 'walnut word blocks on shelves', xplaques: 'carved plaques on a wall', xsculpt: 'sculptures on lit plinths', xrecords: 'records in a rack',
      xposters: 'film posters in frames', xbooks: 'books face out', xgames: 'game boxes on shelves', xdolls: 'figures in a glass case', xlanterns: 'glowing orbs hanging on cords',
      xsgarden: 'sculptures on a lawn', xtable: 'blocks laid out on a table' };

    // ---------------------------------------------------------------- what a card is: content kind and text shape
    var RE = { music: /music|song|album|singer|band|playlist|vinyl|音乐|歌|专辑|乐队/i, movie: /movie|film|cinema|电影|影片|片单/i, book: /\bbooks?\b|novel|reading|library|书|小说|阅读|读物/i,
      game: /\bgames?\b|video ?game|nintendo|switch|playstation|xbox|游戏/i, people: /people|person|scientist|author|artist|hero|名人|人物|科学家|作家/i };
    function contentOf(info) {
      var t = String(info.type || ''); if (/person|portrait|people/i.test(t)) return 'people';
      var hay = [info.list, info.board, (info.labels || []).join(' ')].join(' ');
      for (var k in RE) if (RE[k].test(hay)) return k;
      return '';
    }
    var FOR = { music: 'vinyl', movie: 'poster', book: 'book', game: 'game', people: 'doll' };
    function words(s) { return String(s || '').trim().split(/\s+/).filter(Boolean).length; }
    function smartCarrier(info) {   // one card on its own
      var c = contentOf(info); if (c) return FOR[c];
      var w = String(info.title || ''), n = words(w), h = hash(info.id || w);
      if (n >= 4 || w.length > 22) return 'plaque';
      if (info.img) return ['card', 'pin'][h % 2];
      if (n === 1 && w.length <= 10) return ['cube', 'wblock', 'orb'][h % 3];
      return ['card', 'orb', 'crystal'][h % 3];
    }
    function smartList(infos) {   // a list: one carrier and one display for all of it, then the other good pairings
      var cnt = {}, pics = 0, long = 0, one = 0; infos.forEach(function (x) { var c = contentOf(x); if (c) cnt[c] = (cnt[c] || 0) + 1; if (x.img) pics++; var n = words(x.title); if (n >= 4) long++; if (n === 1) one++; });
      var top = Object.keys(cnt).sort(function (a, b) { return cnt[b] - cnt[a]; })[0], N = infos.length || 1, out = [];
      if (top && cnt[top] >= N / 2) out.push(kindFor(FOR[top]));
      if (long >= N / 2) out.push('xplaques');
      if (pics >= N / 2) out.push('xboard', 'xpins');
      if (one >= N / 2) out.push(N <= 12 ? 'xcubes' : 'xblocks', 'xorbs');
      out.push(N <= 8 ? 'xpodium' : 'xboard', 'xorbs', 'xcubes', 'xsculpt', 'xplaques', 'xlanterns', 'xtable', 'xsgarden');
      return out.filter(function (k, i) { return k && out.indexOf(k) === i; }).map(function (k) { return [k, kindOf(k)[3]]; });
    }
    function kindFor(carrier) { for (var i = 0; i < KINDS.length; i++) if (KINDS[i][3] === carrier) return KINDS[i][0]; return null; }
    function kindOf(id) { for (var i = 0; i < KINDS.length; i++) if (KINDS[i][0] === id) return KINDS[i]; return null; }
    function variantOf(carrier, info, v) { var L = VARIANTS[carrier]; if (!L) return ''; if (v && L.indexOf(v) >= 0) return v; return L[hash((info.id || '') + info.title) % L.length]; }

    // ---------------------------------------------------------------- the Universal Item Generator
    function fit(w, max, line) { var n = line ? String(w).length : Math.max.apply(null, String(w).split(/\s+/).map(function (x) { return x.length; }).concat([1])); return n <= max ? 1 : Math.max(.28, max / n); }   // by its longest word: words shrink, they never break   // a scale for the word so it stays inside its face
    var PAT = ['stripes', 'dots', 'plain', 'check', 'swirl', 'zig'];
    function html(info, carrier, opt) {
      opt = opt || {}; carrier = carrier || smartCarrier(info);
      var w = String(info.title || '').trim() || '…', h = hash(info.id || w), hue = (opt.hue != null ? opt.hue : h % 360), v = variantOf(carrier, info, opt.v), img = info.img ? esc(info.img) : '';
      var sub = String(info.zh || '').trim(), mean = String(info.mean || '').trim(), list = String(info.list || '').trim();
      var FIT = { orb: 9, crystal: 9, cube: 4.4, wblock: 4.8, card: 7.5, pin: 9, plaque: 14, sculpt: 9, print: 8, vinyl: 10, poster: 7, book: 10, game: 10, doll: 11 }, st = '--h:' + hue + ';--f:' + fit(w, FIT[carrier] || 10, /^(orb|pin|doll|print)$/.test(carrier)).toFixed(2) + (opt.size ? ';--mi:' + opt.size + 'px' : '');
      var A = function (inner, cls) { return '<span class="mi mi-' + carrier + (v ? ' m-' + v : '') + (cls ? ' ' + cls : '') + '" style="' + st + '" title="' + esc(w) + '">' + inner + '</span>'; };
      var ini = esc(w.charAt(0).toUpperCase());
      switch (carrier) {
        case 'orb': return A('<i class="glass"></i><i class="base"></i><b class="neon">' + esc(w) + '</b><b class="neon refl" aria-hidden="true">' + esc(w) + '</b><i class="shine"></i>');
        case 'crystal': return A('<i class="edge"></i><i class="disc"><i class="etch" aria-hidden="true">' + ini + '</i><b>' + esc(w) + '</b>' + (sub || list ? '<small>' + esc(sub || 'awarded · ' + list) + '</small>' : '') + '</i><i class="floor"></i>');
        case 'cube': var pt = PAT[h % PAT.length], pt2 = PAT[(h >> 3) % PAT.length];
          return A('<i class="cb"><i class="fc front p-' + (pt === 'plain' ? 'plain' : 'plain') + '"><b>' + esc(w) + '</b></i><i class="fc right p-' + pt + '"></i><i class="fc top p-' + pt2 + '"></i></i>');
        case 'card': var tag = esc(list || 'Word');
          if (v === 'layered') return A('<i class="band">' + tag + '</i><b>' + esc(w) + '</b>' + (mean ? '<small>' + esc(mean.slice(0, 60)) + '</small>' : ''));
          if (v === 'clip') return A('<i class="clip"></i>' + (img ? '<img alt="" loading="lazy" src="' + img + '">' : '<i class="sprig"></i>') + '<b>' + esc(w) + '</b><small>N°' + ((h % 9) + 1) + '</small>');
          if (v === 'matte') return A('<i class="pin"></i>' + (img ? '<img alt="" loading="lazy" src="' + img + '">' : '') + '<b>' + esc(w) + '</b>' + (sub ? '<small>' + esc(sub) + '</small>' : ''));
          if (v === 'acrylic') return A('<b>' + esc(w) + '</b>');
          if (v === 'diecut') return A('<b>' + esc(w) + '</b>', 'cut' + (h % 3));
          return A('<i class="peg"></i>' + (img ? '<img alt="" loading="lazy" src="' + img + '">' : '') + '<b>' + esc(w) + '</b>' + (sub ? '<small>' + esc(sub) + '</small>' : '') + '<i class="gloss"></i>');
        case 'pin': return A('<i class="rim"></i><i class="enamel">' + (img ? '<img alt="" loading="lazy" src="' + img + '">' : '<i class="art">' + ini + '</i>') + '<i class="heart"></i></i><i class="ribbon"><b>' + esc(w) + '</b></i><i class="tails"></i>');
        case 'wblock': return A('<i class="cb"><i class="fc front"><b>' + esc(w) + '</b></i><i class="fc right"><b>' + esc(w) + '</b></i><i class="fc top"><b>' + esc(w) + '</b></i></i>');
        case 'plaque': return A('<b>' + esc(mean && words(w) < 4 ? w : '“' + w + '”') + '</b>' + (mean && words(w) < 4 ? '<small>' + esc(mean.slice(0, 90)) + '</small>' : '') + '<em>— ' + esc(sub || list || 'Minest') + '</em>');
        case 'sculpt': return A('<i class="fig"><i class="head"></i><i class="neck"></i><i class="bust"></i></i><i class="plinth"><b>' + esc(w) + '</b></i>');
        case 'print': return A('<b class="ex">' + esc(w) + '</b><i class="plate"></i>');
        case 'vinyl': return A('<i class="disc"><i class="lbl"></i></i><i class="sleeve">' + (img ? '<img alt="" loading="lazy" src="' + img + '">' : '<i class="art"></i>') + '<b>' + esc(w) + '</b>' + (list ? '<small>' + esc(list) + '</small>' : '') + '</i>');
        case 'poster': return A('<i class="art">' + (img ? '<img alt="" loading="lazy" src="' + img + '">' : '') + '</i><i class="fade"></i><small class="tag">' + esc(sub || 'A Minest Picture') + '</small><b>' + esc(w) + '</b><i class="credits"></i>');
        case 'book': return A('<i class="pages"></i><i class="spine"><b>' + esc(w) + '</b></i><i class="cover">' + (img ? '<img alt="" loading="lazy" src="' + img + '">' : '') + '<b>' + esc(w) + '</b>' + (sub ? '<small>' + esc(sub) + '</small>' : '') + '</i>');
        case 'game': return A('<i class="case"><i class="band"><i class="logo"></i></i><i class="art">' + (img ? '<img alt="" loading="lazy" src="' + img + '">' : '<i class="ini">' + ini + '</i>') + '</i><b>' + esc(w) + '</b><i class="age">E</i></i>');
        case 'doll': return A('<i class="body"></i><i class="head">' + (img ? '<img alt="" loading="lazy" src="' + img + '">' : '<i class="face"></i><i class="hair"></i>') + '</i><i class="stand"><b>' + esc(w) + '</b></i>');
      }
      return A('<b>' + esc(w) + '</b>');
    }

    // ---------------------------------------------------------------- the Exhibition Generator: cells (already-made items) into a display
    // cells: [{ html, info }]  →  the display's scene, in the order given
    function display(kind, cells, opt) {
      opt = opt || {}; var K0 = kindOf(kind); if (!K0) return '';
      var head = opt.head || '', wrap = function (inner, cls) { return '<div class="mx mx-' + kind + (cls ? ' ' + cls : '') + '">' + head + inner + '</div>'; };
      var cell = function (c, i, extra) { return '<div class="mx-c" style="--i:' + i + ';--r:' + (((hash((c.info && c.info.id) || i) % 9) - 4) * .9).toFixed(1) + 'deg' + (extra || '') + '">' + c.html + '</div>'; };
      switch (kind) {
        case 'xorbs': return wrap('<div class="cab"><div class="grid">' + cells.map(function (c, i) { return '<div class="slot">' + cell(c, i) + '<i class="tag">' + esc(c.info.title) + '</i></div>'; }).join('') + '</div></div>');
        case 'xpodium': var top3 = cells.slice(0, 3), rest = cells.slice(3), ord = [1, 0, 2].filter(function (j) { return top3[j]; });
          return wrap('<i class="spot"></i><div class="steps">' + ord.map(function (j) { return '<div class="step s' + (j + 1) + '">' + cell(top3[j], j) + '<i class="blk"><b>' + (j + 1) + '</b></i></div>'; }).join('') + '</div>' + (rest.length ? '<div class="mx-row">' + rest.map(function (c, i) { return cell(c, i + 3); }).join('') + '</div>' : ''));
        case 'xcubes': return wrap('<div class="wall">' + cells.map(function (c, i) { return cell(c, i, ';--dx:' + ((hash(i + 'x') % 5) - 2) * 4 + 'px;--dy:' + ((hash(i + 'y') % 5) - 2) * 4 + 'px'); }).join('') + '</div>');
        case 'xboard': return wrap('<div class="frame"><div class="cork">' + cells.map(function (c, i) { return cell(c, i); }).join('') + '</div></div>');
        case 'xpins': return wrap('<div class="felt">' + cells.map(function (c, i) { return cell(c, i); }).join('') + '</div>');
        case 'xblocks': case 'xbooks': case 'xgames': case 'xrecords':
          var per = { xblocks: 5, xbooks: 5, xgames: 6, xrecords: 6 }[kind], rows = []; for (var i = 0; i < cells.length; i += per) rows.push(cells.slice(i, i + per));
          return wrap(rows.map(function (r, ri) { return '<div class="shelf">' + r.map(function (c, j) { return cell(c, ri * per + j); }).join('') + '<i class="board"></i></div>'; }).join(''));
        case 'xdolls': return wrap('<div class="case"><div class="grid">' + cells.map(function (c, i) { return cell(c, i); }).join('') + '</div><i class="glass"></i></div>');
        case 'xplaques': return wrap('<div class="wall">' + cells.map(function (c, i) { return cell(c, i); }).join('') + '</div>');
        case 'xposters': return wrap('<div class="wall">' + cells.map(function (c, i) { return cell(c, i); }).join('') + '</div>');
        case 'xsculpt': return wrap('<div class="hall">' + cells.map(function (c, i) { return '<div class="spotc"><i class="lamp"></i>' + cell(c, i) + '</div>'; }).join('') + '</div>');
        case 'xlanterns': return wrap('<div class="sky">' + cells.map(function (c, i) { return cell(c, i, ';--len:' + (30 + (hash(c.info.id || i) % 5) * 22) + 'px;--sw:' + (hash(i + 's') % 4) + 's'); }).join('') + '</div>');
        case 'xsgarden': return wrap('<div class="lawn">' + cells.map(function (c, i) { return cell(c, i); }).join('') + '<i class="path"></i></div>');
        case 'xtable': return wrap('<div class="top">' + cells.map(function (c, i) { return cell(c, i, ';--tx:' + ((hash(i + 't') % 7) - 3) * 3 + 'px'); }).join('') + '</div><i class="legs"></i>');
      }
      return wrap(cells.map(function (c, i) { return cell(c, i); }).join(''));
    }
    // ---------------------------------------------------------------- held in the hand: each carrier's other side, and the solid cubes
    var DIM = { orb: [12, 12.4], crystal: [12, 12.6], cube: [10, 10], card: [12, 9], pin: [11, 12], wblock: [10, 10], plaque: [18, 11], sculpt: [9, 15], print: [14, 8], vinyl: [15, 11], poster: [10, 15], book: [10, 14], game: [10, 15.6], doll: [9, 14] };
    var KIND = { orb: 'glow', crystal: 'flip', cube: 'solid', card: 'flip', pin: 'flip', wblock: 'solid', plaque: 'flip', sculpt: 'turn', print: 'flip', vinyl: 'flip', poster: 'flip', book: 'flip', game: 'flip', doll: 'turn' };   // how it is handled
    function styleOf(info, carrier, opt) { var w = String(info.title || '').trim() || '…', h = hash(info.id || w); return '--h:' + (opt && opt.hue != null ? opt.hue : h % 360) + ';--f:1' + (opt && opt.size ? ';--mi:' + opt.size + 'px' : ''); }
    function back(info, carrier, opt) {   // the reverse: where the meaning is (engraved, glowing, written, carved…)
      var w = String(info.title || '').trim() || '…', sub = String(info.zh || '').trim(), mean = String(info.mean || '').trim() || sub || 'No meaning yet — open the card to add one.', list = String(info.list || '').trim(), v = variantOf(carrier, info, opt && opt.v);
      var A = function (inner, cls) { return '<span class="mi mi-' + carrier + ' mi-back' + (v ? ' m-' + v : '') + (cls ? ' ' + cls : '') + '" style="' + styleOf(info, carrier, opt) + '">' + inner + '</span>'; }, long = mean.length > 90 ? ' long' : '';
      switch (carrier) {
        case 'orb': return A('<i class="glass"></i><i class="base"></i><b class="neon mean' + long + '">' + esc(mean) + '</b><i class="shine"></i>');
        case 'crystal': return A('<i class="edge"></i><i class="disc"><small>' + esc(w) + (sub ? ' · ' + esc(sub) : '') + '</small><p class="' + long + '">' + esc(mean) + '</p></i><i class="floor"></i>');
        case 'card': return A('<i class="lines"></i><small>' + esc(w) + '</small><p class="' + long + '">' + esc(mean) + '</p><em>' + esc(list) + '</em>');
        case 'pin': return A('<i class="metal"><i class="clutch"></i><p class="' + long + '">' + esc(mean) + '</p><small>© ' + esc(list || 'Minest') + '</small></i>');
        case 'plaque': return A('<i class="wire"></i><small>' + esc(w) + '</small><p class="' + long + '">' + esc(mean) + '</p>');
        default: return A('<i class="lines"></i><small>' + esc(w) + '</small><p class="' + long + '">' + esc(mean) + '</p><em>' + esc(list) + '</em>', 'paperback');
      }
    }
    function solid(info, carrier, opt) {   // a whole cube to turn in the hand: the word, its Chinese, its meaning, its list, and two patterned sides
      var w = String(info.title || '').trim() || '…', sub = String(info.zh || '').trim(), mean = String(info.mean || '').trim(), list = String(info.list || '').trim(), h = hash(info.id || w), pt = PAT[h % PAT.length], pt2 = PAT[(h >> 3) % PAT.length];
      var face = function (cls, html) { return '<i class="fc ' + cls + '">' + html + '</i>'; }, cube = carrier === 'cube';
      return '<span class="mi mi-' + carrier + ' mi-solid" style="' + styleOf(info, carrier, opt) + ';--f:' + fit(w, cube ? 4.4 : 4.8).toFixed(2) + '"><i class="cb6">' +
        face('front', '<b>' + esc(w) + '</b>') + face('right', '<b class="zh">' + esc(sub || w.charAt(0).toUpperCase()) + '</b>') + face('back', '<p>' + esc(mean || sub || w) + '</p>') + face('left', '<small>' + esc(list || 'Minest') + '</small>') +
        face('top' + (cube ? ' p-' + pt : ''), cube ? '' : '<b>' + esc(w.charAt(0).toUpperCase()) + '</b>') + face('bottom' + (cube ? ' p-' + pt2 : ''), '') + '</i></span>';
    }
    function has(carrier) { return CARRIERS.some(function (c) { return c[0] === carrier; }); }
    function isDisplay(id) { return !!kindOf(id); }
    return { dim: DIM, handle: KIND, back: back, solid: solid, carriers: CARRIERS, variants: VARIANTS, kinds: KINDS, use: USE, html: html, display: display, has: has, isDisplay: isDisplay, kindOf: kindOf, kindFor: kindFor,
      smartCarrier: smartCarrier, smartList: smartList, contentOf: contentOf, variantOf: variantOf };
  })();

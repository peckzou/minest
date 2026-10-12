/* Minest · Discovery & Inspiration Engine V1.0 — one engine, several ways in.
   Inspire → Discover → Collect → Suggest → Explore → Grow.
   window.MinestDiscovery  (engine)
     suggest(entity, {signal})  → {groups: [{id: similar|related|explore, title, reason, items[≤12]}]} — real data only:
         movies / TV  TMDB via /api/library/related (recommendations · same director · same cast; needs the server token)
         music        ListenBrainz similar artists (+ iTunes to make them collectable) · iTunes albums / songs
         books        Open Library same author · same subject
         anything else → no groups (hidden), never padded with guesses
     inspiration: daily() · another() · skip() · answer() · favorite() · contextual() · prompts()
     grow()  → explainable suggestions, each previewed, confirmed and undoable
   window.MinestInspire (UI) — Daily Inspiration card (My World 3.0 home), Inspiration Library + Grow (overlay .ins),
     Smart Suggestions panel inside the Visual Library, an "Inspired for you" row in Discover.
   Data (MinestKnowledge, synced) — prompts are never the same as answers, and nothing is saved before a tap:
     'ins:day' {date, id, skipped, ctx}  ·  'ins:ans:<prompt>' [{at, text, inbox}]  ·  'ins:fav:<prompt>' {at}  ·  'ins:log' [{at, id, kind}]
   Privacy: only the picked entity's public ids / names go to public catalogues; notes and answers never leave Minest. */
(function () {
  if (window.MinestDiscovery) return;
  // where /api/library lives: the same site on the web; the Minest server inside the iOS app (pages load from the bundle)
  window.minestLibraryBase = window.minestLibraryBase || function () { return /^https?:$/.test(location.protocol) ? '' : 'https://minest-app.vercel.app'; };
  var KN = function () { return window.MinestKnowledge; };
  var A = function () { return window.MinestAI || {}; };
  var VL = function () { return window.MinestVisualLibrary; };
  var LIB = window.__MINEST_INSPIRATIONS || { categories: [], prompts: [] };
  var reduce = window.matchMedia && matchMedia('(prefers-reduced-motion: reduce)').matches;
  function esc(s) { return String(s == null ? '' : s).replace(/[&<>"]/g, function (c) { return { '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;' }[c]; }); }
  function toast(m, o) { try { if (window.GlassUI && GlassUI.toast) return GlassUI.toast(m, o); } catch (e) {} return null; }
  function hashOf(s) { var h = 2166136261; s = String(s); for (var i = 0; i < s.length; i++) { h ^= s.charCodeAt(i); h = Math.imul(h, 16777619) >>> 0; } return h; }
  function boards() { try { return (A().boards && A().boards()) || []; } catch (e) { return []; } }
  function worlds() { return window.MinestWorld ? MinestWorld.worlds() : []; }
  function isHead(id) { return !!(KN() && KN().isHeading && KN().isHeading(id)); }

  // ================================================================== polite fetching (per host spacing, abort, cache)
  var GAP = { 'musicbrainz.org': 1100, 'labs.api.listenbrainz.org': 400, 'itunes.apple.com': 300, 'openlibrary.org': 250 }, last = {};
  function host(u) { try { return new URL(u, location.href).host; } catch (e) { return ''; } }
  function wait(ms, signal) { return new Promise(function (res, rej) { var t = setTimeout(res, ms); if (signal) signal.addEventListener('abort', function () { clearTimeout(t); rej(new DOMException('Cancelled', 'AbortError')); }, { once: true }); }); }
  function getJSON(url, signal, headers) {
    var h = host(url), gap = GAP[h] || 0, now = Date.now(), at = Math.max(now, (last[h] || 0) + gap); last[h] = at;
    return wait(at - now, signal).then(function () {
      return fetch(url, { signal: signal, headers: headers || {}, credentials: url.charAt(0) === '/' ? 'same-origin' : 'omit', mode: 'cors', referrerPolicy: 'no-referrer' });
    }).then(function (r) { if (!r.ok) { var e = new Error('HTTP ' + r.status); e.status = r.status; throw e; } return r.json(); });
  }
  function minestHeaders() { var h = {}; try { h = typeof minestAIHeaders === 'function' ? minestAIHeaders() : {}; } catch (e) {} delete h['Content-Type']; return h; }
  var cache = new Map(), inflight = new Map();
  try { JSON.parse(sessionStorage.getItem('mn.ds.cache') || '[]').forEach(function (x) { cache.set(x[0], x[1]); }); } catch (e) {}
  function keep() { try { sessionStorage.setItem('mn.ds.cache', JSON.stringify(Array.from(cache.entries()).slice(-40))); } catch (e) {} }

  // ================================================================== normalizers (the Visual Library's own entity shape)
  function itunes(x, forced) {
    var type = forced || (x.wrapperType === 'artist' ? 'artist' : x.wrapperType === 'collection' ? 'album' : x.kind === 'song' ? 'song' : '');
    var id = type === 'artist' ? x.artistId : type === 'album' ? x.collectionId : x.trackId, title = type === 'artist' ? x.artistName : type === 'album' ? x.collectionName : x.trackName;
    if (!type || !id || !title) return null;
    var url = type === 'artist' ? x.artistLinkUrl || x.artistViewUrl : type === 'album' ? x.collectionViewUrl : x.trackViewUrl, art = type === 'artist' ? '' : String(x.artworkUrl100 || '').replace(/^http:/, 'https:');
    return { entityId: 'itunes:' + type + ':' + id, entityType: type, title: String(title), subtitle: type === 'artist' ? 'Artist · iTunes Store' : [x.artistName, type === 'song' ? x.collectionName : ''].filter(Boolean).join(' · '),
      source: { provider: 'itunes', externalId: String(id), url: url || '' }, image: { url: art, sourceUrl: url || '', attribution: art ? 'Album artwork via iTunes Store · rights belong to the respective owners.' : '', license: null, promoOnly: !!art },
      metadata: { category: 'music', artist: x.artistName, artistId: x.artistId ? String(x.artistId) : null, album: type === 'artist' ? null : x.collectionName || null, albumId: x.collectionId ? String(x.collectionId) : null, year: type === 'artist' ? null : String(x.releaseDate || '').slice(0, 4) || null, genre: x.primaryGenreName || null } };
  }
  function olWork(w) {   // a subject / author listing → the Visual Library's book shape (via its own normalizer when present)
    var d = { key: w.key, title: w.title, author_name: w.author_name || (w.authors || []).map(function (a) { return a.name; }), first_publish_year: w.first_publish_year, cover_i: w.cover_i || w.cover_id, isbn: [] };
    if (VL() && VL().normalizeBook) return VL().normalizeBook(d);
    var m = String(d.key || '').match(/(OL\d+W)$/); if (!m) return null;
    return { entityId: 'openlibrary:work:' + m[1], entityType: 'book', title: d.title, subtitle: (d.author_name || []).join(', '), source: { provider: 'openlibrary', externalId: m[1], url: 'https://openlibrary.org/works/' + m[1] }, image: { url: d.cover_i ? 'https://covers.openlibrary.org/b/id/' + d.cover_i + '-M.jpg?default=false' : '' }, metadata: { year: d.first_publish_year || null, authors: d.author_name || [] } };
  }
  function group(id, title, reason, items, self) {
    var seen = {}; if (self) seen[self.entityId] = 1; if (self) seen['t:' + String(self.title).toLowerCase()] = 1;
    items = (items || []).filter(function (x) { if (!x || seen[x.entityId] || seen['t:' + String(x.title).toLowerCase()]) return false; seen[x.entityId] = seen['t:' + String(x.title).toLowerCase()] = 1; return true; }).slice(0, 12);
    return items.length ? { id: id, title: title, reason: reason, items: items } : null;
  }
  function settled(ps) { return Promise.all(ps.map(function (p) { return p.then(function (v) { return v; }, function (e) { if (e && e.name === 'AbortError') throw e; return null; }); })); }

  // ================================================================== strategies
  function movies(x, signal) {
    var media = x.entityType === 'tv' ? 'tv' : 'movie', id = x.source.externalId, H = minestHeaders();
    var details = (x.metadata && x.metadata.directors) ? Promise.resolve(x) : getJSON(minestLibraryBase() + '/api/library/tmdb?' + new URLSearchParams({ action: 'details', media: media, id: id }), signal, H).then(function (d) { return d.item; });
    var rec = getJSON(minestLibraryBase() + '/api/library/related?' + new URLSearchParams({ kind: 'recommendations', media: media, id: id }), signal, H).then(function (d) { return group('similar', 'Similar ' + (media === 'tv' ? 'shows' : 'movies'), 'Viewers of ' + x.title + ' also watched these · TMDB', d.items, x); });
    return details.then(function (d) {
      var m = (d && d.metadata) || {}, dir = (m.directors || m.creators || [])[0], star = (m.cast || [])[0];
      var byDir = dir ? getJSON(minestLibraryBase() + '/api/library/related?' + new URLSearchParams({ kind: 'person', id: String(dir.id).split(':').pop(), job: 'Director' }), signal, H).then(function (r) { return group('related', 'Same director · ' + dir.name, 'Also directed by ' + dir.name + ' · TMDB', r.items, x); }) : Promise.resolve(null);
      var byCast = star ? getJSON(minestLibraryBase() + '/api/library/related?' + new URLSearchParams({ kind: 'person', id: String(star.id).split(':').pop(), job: 'Acting' }), signal, H).then(function (r) { return group('explore', 'More with ' + star.name, star.name + ' also appears in these · TMDB', r.items, x); }) : Promise.resolve(null);
      return settled([rec, byDir, byCast]);
    }, function (e) { if (e && e.name === 'AbortError') throw e; return settled([rec]); });
  }
  function artistOf(x) { return x.entityType === 'artist' ? { id: x.source.externalId, name: x.title } : { id: x.metadata && x.metadata.artistId, name: x.metadata && x.metadata.artist }; }
  function music(x, signal) {
    var a = artistOf(x); if (!a.id || !a.name) return Promise.resolve([]);
    var albums = getJSON('https://itunes.apple.com/lookup?' + new URLSearchParams({ id: a.id, entity: 'album', limit: 14 }), signal).then(function (d) {
      return group('related', x.entityType === 'artist' ? 'Albums by ' + a.name : 'More by ' + a.name, 'From ' + a.name + '’s catalogue · iTunes Store', (d.results || []).filter(function (r) { return r.wrapperType === 'collection'; }).map(function (r) { return itunes(r, 'album'); }), x);
    });
    var similar = getJSON('https://musicbrainz.org/ws/2/artist?' + new URLSearchParams({ query: 'artist:"' + a.name.replace(/"/g, '') + '"', limit: 3, fmt: 'json' }), signal).then(function (d) {
      var hit = (d.artists || []).filter(function (r) { return String(r.name).toLowerCase() === a.name.toLowerCase(); })[0] || ((d.artists || [])[0] && d.artists[0].score >= 95 ? d.artists[0] : null);
      if (!hit) return null;
      return getJSON('https://labs.api.listenbrainz.org/similar-artists/json?' + new URLSearchParams({ artist_mbids: hit.id, algorithm: 'session_based_days_7500_session_300_contribution_5_threshold_10_limit_100_filter_True_skip_30' }), signal).then(function (sim) {
        var names = (Array.isArray(sim) ? sim : []).filter(function (s) { return s && s.name && s.artist_mbid !== hit.id; }).slice(0, 6).map(function (s) { return s.name; });
        // each one becomes a collectable iTunes artist (only exact name matches; others are left out rather than guessed)
        return names.reduce(function (p, n) { return p.then(function (acc) { return getJSON('https://itunes.apple.com/search?' + new URLSearchParams({ term: n, entity: 'musicArtist', limit: 3 }), signal).then(function (r) { var m = (r.results || []).filter(function (z) { return String(z.artistName).toLowerCase() === n.toLowerCase(); })[0]; if (m) acc.push(itunes(m, 'artist')); return acc; }, function () { return acc; }); }); }, Promise.resolve([]))
          .then(function (items) { return group('similar', 'Similar artists', 'Listeners of ' + a.name + ' also play these · ListenBrainz', items, x); });
      });
    });
    var songs = getJSON('https://itunes.apple.com/lookup?' + new URLSearchParams(x.entityType === 'album' ? { id: x.source.externalId, entity: 'song', limit: 13 } : { id: a.id, entity: 'song', limit: 10 }), signal).then(function (d) {
      return group('explore', x.entityType === 'album' ? 'Songs on ' + x.title : 'Popular songs', x.entityType === 'album' ? 'Tracks from this album · iTunes Store' : 'Songs by ' + a.name + ' · iTunes Store', (d.results || []).filter(function (r) { return r.wrapperType === 'track' && (x.entityType === 'album' || String(r.artistId) === String(a.id)); }).map(function (r) { return itunes(r, 'song'); }), x);
    });
    return settled([similar, albums, songs]);
  }
  var GENERIC = /^(fiction|accessible book|protected daisy|in library|large type books|internet archive wishlist|lending library|open library staff picks|reading level|juvenile (fiction|literature)|english language|literature|american literature|english literature|novels?|ficción|novela|roman|history and criticism)$/i;
  var NOISE = /nyt:|award:|new york times|bestseller|translations?|lectures|reviewed|accessible|protected|large type|in library|staff picks|\(|,|:|\d{4}/i;
  var GENRES = /science.?fiction|fantasy|myster|detective|thriller|romance|horror|adventure|historical|biograph|memoir|philosoph|poetry|psycholog|self-help|business|economics|cooking|travel|art|music|science|nature|religion|politic|war|humor|children|young adult|dystop|classic/i;
  function bestSubject(subs) {
    var clean = (subs || []).map(function (z) { return String(z).trim(); }).filter(function (z) { return z.length > 2 && z.length < 40 && !GENERIC.test(z) && !NOISE.test(z); });
    return clean.filter(function (z) { return GENRES.test(z); })[0] || clean[0] || null;
  }
  function books(x, signal) {
    var author = ((x.metadata && x.metadata.authors) || [])[0] || String(x.subtitle || '').split(',')[0].trim();
    var byAuthor = author ? getJSON('https://openlibrary.org/search.json?' + new URLSearchParams({ author: author, fields: 'key,title,author_name,first_publish_year,cover_i', limit: 20, sort: 'editions' }), signal).then(function (d) {
      var al = author.toLowerCase();   // the search is fuzzy: keep only books whose author really is this author
      return group('related', 'Same author · ' + author, 'Also by ' + author + ' · Open Library', (d.docs || []).filter(function (w) { return (w.author_name || []).some(function (n) { return String(n).toLowerCase() === al; }); }).map(olWork), x);
    }) : Promise.resolve(null);
    var workId = x.source.provider === 'openlibrary' ? x.source.externalId : null;
    function bySearch() { return getJSON('https://openlibrary.org/search.json?' + new URLSearchParams({ title: x.title, author: author, fields: 'subject', limit: 1 }), signal).then(function (d) { return ((d.docs || [])[0] || {}).subject || []; }); }
    var bySubject = (workId ? getJSON('https://openlibrary.org/works/' + workId + '.json', signal).then(function (w) { return (w.subjects || []).length ? w.subjects : bySearch(); }) : bySearch())
      .then(function (subs) {
        var s = bestSubject(subs); if (!s) return null;
        return getJSON('https://openlibrary.org/subjects/' + encodeURIComponent(String(s).toLowerCase().replace(/\s+/g, '_')) + '.json?limit=14', signal).then(function (d) {
          return group('similar', 'Similar subject · ' + s, 'Other books about ' + s.toLowerCase() + ' · Open Library', (d.works || []).map(olWork), x);
        });
      });
    return settled([bySubject, byAuthor]);
  }
  function suggest(x, o) {
    o = o || {}; if (!x || !x.entityId || !x.source) return Promise.resolve({ groups: [] });
    var key = x.entityId; if (cache.has(key) && !o.refresh) return Promise.resolve(cache.get(key));
    if (inflight.has(key) && !o.refresh) return inflight.get(key);
    var p = x.source.provider, run = p === 'tmdb' ? movies : p === 'itunes' || (p === 'musicbrainz' && x.metadata && x.metadata.artistId) ? music : p === 'openlibrary' || p === 'googlebooks' ? books : null;
    if (!run) return Promise.resolve({ groups: [] });
    var pr = run(x, o.signal).then(function (gs) {
      var out = { groups: (gs || []).filter(Boolean).slice(0, 3), at: Date.now() };
      cache.set(key, out); keep(); return out;
    });
    inflight.set(key, pr); pr.then(function () { inflight.delete(key); }, function () { inflight.delete(key); });
    return pr;
  }

  // ================================================================== inspiration (daily · contextual · answers)
  function today() { var d = new Date(); return d.getFullYear() + '-' + String(d.getMonth() + 1).padStart(2, '0') + '-' + String(d.getDate()).padStart(2, '0'); }
  function prompt(id) { return LIB.prompts.filter(function (p) { return p.id === id; })[0] || null; }
  function answers(id) { return (KN() && KN().get('ins:ans:' + id)) || []; }
  function fav(id) { return !!(KN() && KN().get('ins:fav:' + id)); }
  function log(id, kind) { var l = ((KN() && KN().get('ins:log')) || []).slice(-60); l.push({ at: Date.now(), id: id, kind: kind }); KN().set('ins:log', l, true); }
  // what the user already has → a prompt that fits it, with the reason in plain words (nothing is invented)
  var CTX = [[/movie|film|watch/, 'cult-08', 'movies'], [/book|read/, 'cult-02', 'books'], [/music|song|album|artist|singer/, 'cult-01', 'music'], [/plant|garden|flower|tree/, 'natu-02', 'plants'],
    [/place|travel|trip|visit|countr/, 'natu-06', 'places'], [/bak|recipe|cook|food|dish/, 'life-02', 'recipes'], [/game/, 'cult-07', 'games'], [/skill|learn/, 'skil-03', 'skills'], [/memor|moment/, 'life-01', 'memories']];
  function contextual() {
    var out = [];
    worlds().forEach(function (w) { (w.b.columns || []).forEach(function (c) { (c.cards || []).forEach(function (k) {
      if (!k || isHead(k.id) || /inbox/i.test(k.title || '')) return; var n = (k.stack || []).length; if (n < 3) return;
      CTX.forEach(function (r) {
        if (!r[0].test(String(k.title).toLowerCase())) return;
        var p = LIB.prompts.filter(function (q) { return q.id.indexOf(r[1] + '-') === 0; })[0]; if (!p) return;
        out.push({ prompt: p, n: n, reason: 'Because you have ' + n + ' ' + r[2] + ' in ' + k.title, bid: w.b.id, card: k.id, list: k.title });
      });
    }); }); });
    return out.sort(function (a, b) { return b.n - a.n; });
  }
  function pickFor(date, skip) {
    var recent = {}; LIB.prompts.forEach(function (p) { var a = answers(p.id); if (a.length && Date.now() - a[a.length - 1].at < 30 * 864e5) recent[p.id] = 1; });
    (skip || []).forEach(function (id) { recent[id] = 1; });
    var ctx = contextual().filter(function (c) { return !recent[c.prompt.id]; });
    var h = hashOf(date + (skip || []).join(','));
    if (ctx.length && h % 3 === 0) { var c = ctx[h % ctx.length]; return { id: c.prompt.id, ctx: { reason: c.reason, bid: c.bid, card: c.card, list: c.list } }; }
    var pool = LIB.prompts.filter(function (p) { return !recent[p.id]; }); if (!pool.length) pool = LIB.prompts;
    return { id: pool[h % pool.length].id, ctx: null };
  }
  // one stable prompt per local day; "Another" and "Skip" are remembered for that day only
  function daily() {
    if (!KN() || !LIB.prompts.length) return null;
    var d = KN().get('ins:day'), t = today();
    if (!d || d.date !== t) { var pk = pickFor(t); d = { date: t, id: pk.id, ctx: pk.ctx, skipped: false, seen: [pk.id] }; KN().set('ins:day', d, true); }
    return d.skipped ? null : { prompt: prompt(d.id), ctx: d.ctx, date: t };
  }
  function another() { var d = KN().get('ins:day') || { date: today(), seen: [] }, pk = pickFor(today(), d.seen || []); d = Object.assign({}, d, { id: pk.id, ctx: pk.ctx, skipped: false, seen: (d.seen || []).concat([pk.id]).slice(-30) }); KN().set('ins:day', d, true); return daily(); }
  function skip() { var d = Object.assign({}, KN().get('ins:day') || {}, { date: today(), skipped: true }); KN().set('ins:day', d, true); log(d.id, 'skip'); }
  function unskip() { var d = Object.assign({}, KN().get('ins:day') || {}, { skipped: false }); KN().set('ins:day', d, true); }
  // an answer is the user's own words: kept with the prompt; only copied into My World (the Inbox) when they ask
  function answer(id, text, o) {
    o = o || {}; text = String(text || '').trim().slice(0, 4000); if (!text) return Promise.resolve(null);
    var entry = { at: Date.now(), text: text, inbox: !!o.inbox };
    KN().set('ins:ans:' + id, answers(id).concat([entry]).slice(-50), true); log(id, 'answer');
    if (!o.inbox || !window.MinestCapture || !worlds().length) return Promise.resolve({ entry: entry });
    var p = prompt(id), it = MinestCapture.makeItem(text, 'inspiration'); it.title = text.length > 80 ? text.slice(0, 77) + '…' : text; it.text = text + (p ? '\n\n— ' + p.text : '');
    var a = A().board && A().board(), wb = a && worlds().some(function (x) { return x.b.id === a.id; }) ? a.id : worlds()[0].b.id;
    return MinestCapture.organize([{ item: it, to: [] }], wb, 'inspiration', 'add').then(function (lg) { entry.log = lg && lg.id; return { entry: entry, log: lg }; });
  }
  function unanswer(id, at) { KN().set('ins:ans:' + id, answers(id).filter(function (a) { return a.at !== at; }), true); }
  function favorite(id, on) { KN().set('ins:fav:' + id, on ? { at: Date.now() } : null, true); }

  // ================================================================== grow (explainable, previewed, confirmed, undoable)
  function listsAll() { var out = []; worlds().forEach(function (w) { (w.b.columns || []).forEach(function (c) { (c.cards || []).forEach(function (k) { if (k && k.id && !isHead(k.id)) out.push({ bid: w.b.id, world: w.b.title, col: c.id, area: c.title, k: k }); }); }); }); return out; }
  function grow() {
    var out = [], ls = listsAll(), inbox = ls.filter(function (l) { return /inbox/i.test(l.k.title || ''); });
    // 1 · Inbox things that clearly belong to one existing list
    var by = {};
    inbox.forEach(function (ib) { (ib.k.stack || []).forEach(function (s) { if (!window.MinestCapture) return; var sg = MinestCapture.suggest(s.title + ' ' + (s.desc || '')); var t = sg && sg.top && sg.top[0]; if (t) (by[t.id] = by[t.id] || { to: t, items: [] }).items.push({ s: s, from: ib }); }); });
    Object.keys(by).forEach(function (k) { var g = by[k]; if (g.items.length < 2) return; out.push({ id: 'inbox-' + k, kind: 'move', title: 'Move ' + g.items.length + ' things into ' + g.to.title, reason: 'They are waiting in your Inbox and all match ' + g.to.title + '.', preview: g.items.map(function (x) { return x.s.title; }), data: g }); });
    // 2 · collected things of one kind with no list of their own (e.g. artists saved from the Visual Library)
    var KINDS = [['artist', 'My Favorite Artists', /artist|singer|band|musician/], ['movie', 'My Favorite Movies', /movie|film/], ['book', 'My Favorite Books', /book|read/]];
    KINDS.forEach(function (kd) {
      if (ls.some(function (l) { return kd[2].test(String(l.k.title).toLowerCase()); })) return;
      var found = [];
      ls.forEach(function (l) { (l.k.stack || []).forEach(function (s) { var key = KN().get('pk:' + s.id), rec = key && KN().get(key); if (rec && (rec.type === kd[0] || rec.entityType === kd[0] || (rec.entity && rec.entity.entityType === kd[0]))) found.push({ s: s, key: key, rec: rec, l: l }); }); });
      if (found.length >= 3) out.push({ id: 'create-' + kd[0], kind: 'create', title: 'Create ' + kd[1], reason: 'You have collected ' + found.length + ' ' + kd[0] + 's but no list for them yet.', preview: found.map(function (f) { return f.s.title; }), data: { title: kd[1], found: found } });
    });
    // 3 · a long list → rank it (reuses Discover; nothing is changed)
    ls.filter(function (l) { return (l.k.stack || []).length >= 8 && !/inbox/i.test(l.k.title); }).slice(0, 2).forEach(function (l) {
      out.push({ id: 'rank-' + l.k.id, kind: 'discover', title: 'Rank ' + l.k.title + ' with a Tier List', reason: l.k.title + ' has ' + l.k.stack.length + ' things — a quick ranking shows your favourites.', preview: l.k.stack.slice(0, 6).map(function (s) { return s.title; }), data: { bid: l.bid, card: l.k.id, tool: 'tier-list' } });
    });
    var dismissed = (KN() && KN().get('ins:growoff')) || {};
    return out.filter(function (g) { return !dismissed[g.id]; });
  }
  function applyGrow(g) {
    if (g.kind === 'discover') { if (window.MinestDiscover) MinestDiscover.open({ bid: g.data.bid, cardId: g.data.card, tool: g.data.tool }); return Promise.resolve(null); }
    if (g.kind === 'move') {
      // the same cards move (pk links follow them). Everything is worked out from the boards first; each update is then
      // a pure remove / add, so nothing can be lost between two boards. Undo puts each card back where it was.
      var to = g.data.to, moves = g.data.items, bidTo = to.bid;
      if (!boards().some(function (b) { return b.id === bidTo; })) return Promise.reject(new Error('That list is not there any more.'));
      var cards = {}, from = {};   // sid → the card object as it is now · sid → {bid, list}
      moves.forEach(function (m) { var b = boards().filter(function (x) { return x.id === m.from.bid; })[0]; (b && b.columns || []).forEach(function (c) { (c.cards || []).forEach(function (k) { (k.stack || []).forEach(function (st) { if (st.id === m.s.id) { cards[st.id] = JSON.parse(JSON.stringify(st)); from[st.id] = { bid: b.id, list: k.id }; } }); }); }); });
      var ids = Object.keys(cards); if (!ids.length) return Promise.reject(new Error('Those things have already moved.'));
      function edit(bid, fn) { A().updateBoard(bid, function (bd) { bd = JSON.parse(JSON.stringify(bd)); (bd.columns || []).forEach(function (c) { (c.cards || []).forEach(fn); }); return bd; }); }
      function remove(bid, listId, set) { edit(bid, function (k) { if (listId && k.id !== listId) return; if (!k.stack) return; k.stack = k.stack.filter(function (st) { return !set[st.id]; }); k.hasStack = k.stack.length > 0; }); }
      function add(bid, listId, list) { edit(bid, function (k) { if (k.id !== listId) return; var have = {}; (k.stack || []).forEach(function (st) { have[st.id] = 1; }); k.stack = (k.stack || []).concat(list.filter(function (st) { return !have[st.id]; })); k.hasStack = true; }); }
      var bySrc = {}; ids.forEach(function (id) { var f = from[id]; (bySrc[f.bid + '|' + f.list] = bySrc[f.bid + '|' + f.list] || []).push(id); });
      add(bidTo, to.id, ids.map(function (id) { return cards[id]; }));   // add first, then take out — never a moment with the card nowhere
      Object.keys(bySrc).forEach(function (k) { var p = k.split('|'), set = {}; bySrc[k].forEach(function (id) { set[id] = 1; }); remove(p[0], p[1], set); });
      return Promise.resolve({ undo: function () {
        Object.keys(bySrc).forEach(function (k) { var p = k.split('|'); add(p[0], p[1], bySrc[k].map(function (id) { return cards[id]; })); });
        var all = {}; ids.forEach(function (id) { all[id] = 1; }); remove(bidTo, to.id, all);
      } });
    }
    if (g.kind === 'create' && window.MinestCapture) {
      var f = g.data.found, wb = f[0].l.bid, plan = [{ item: { id: 'grow-' + Date.now().toString(36), title: '·' }, to: [] }];
      plan = f.map(function (x) { return { item: { id: String(x.key).replace(/^ki:[^:]+:/, ''), title: x.s.title, text: x.rec.text || '', link: x.rec.link || '', type: x.rec.type || 'text', img: x.rec.img || '', at: x.rec.at }, key: x.key, newLists: [g.data.title.replace(/^My\s+/, '')] }; });
      return MinestCapture.organize(plan, wb, 'grow', 'organize').then(function (lg) { return { undo: function () { return MinestCapture.undo(lg.id); }, log: lg }; });
    }
    return Promise.resolve(null);
  }

  window.MinestDiscovery = { suggest: suggest, inspiration: { daily: daily, another: another, skip: skip, unskip: unskip, answer: answer, unanswer: unanswer, favorite: favorite, isFavorite: fav, answers: answers, contextual: contextual, prompts: function () { return LIB.prompts.slice(); }, categories: function () { return LIB.categories.slice(); }, prompt: prompt, today: today },
    grow: grow, applyGrow: applyGrow, _cache: cache };

  // ================================================================== UI
  var CSS = [
    // the Daily Inspiration card (on My World's home) — quiet, one line of choices
    '.ins-card{position:relative;margin:4px 0 14px;padding:14px 14px 12px;border-radius:20px;background:linear-gradient(150deg,rgba(255,214,130,.16),rgba(255,255,255,.05));border:1px solid var(--uv-line,rgba(255,255,255,.12));-webkit-backdrop-filter:blur(18px);backdrop-filter:blur(18px)}',
    '.ins-card .k{font-size:11.5px;font-weight:750;letter-spacing:.08em;text-transform:uppercase;color:#f5c66b}.ins-card .why{font-size:12px;color:var(--uv-sub,rgba(255,255,255,.6));margin-top:2px}',
    '.ins-card .q{font-size:18px;font-weight:700;line-height:1.3;margin:6px 0 2px;letter-spacing:-.2px}.ins-card .f{font-size:13px;color:var(--uv-sub,rgba(255,255,255,.6))}',
    '.ins-acts{display:flex;gap:6px;flex-wrap:wrap;margin-top:10px}.ins-acts button{height:34px;padding:0 13px;border-radius:999px;border:1px solid var(--uv-line,rgba(255,255,255,.14));background:var(--uv-fill,rgba(255,255,255,.08));color:inherit;font:650 13.5px -apple-system,system-ui,sans-serif;cursor:pointer}',
    '.ins-acts button.pri{background:#f5c66b;color:#2a1d00;border-color:transparent}.ins-x{position:absolute;right:8px;top:8px;width:30px;height:30px;border:0;border-radius:50%;background:none;color:var(--uv-sub,rgba(255,255,255,.6));font-size:18px;cursor:pointer}',
    '.ins-ta{width:100%;box-sizing:border-box;min-height:76px;margin-top:10px;padding:10px 12px;border-radius:14px;border:1px solid var(--uv-line,rgba(255,255,255,.14));background:var(--uv-fill,rgba(255,255,255,.08));color:inherit;font:15px -apple-system,system-ui,sans-serif;outline:none;resize:vertical}',
    '.ins-chk{display:flex;align-items:center;gap:8px;font-size:13px;margin-top:8px;color:var(--uv-sub,rgba(255,255,255,.7))}',
    'html.kn-light .ins-card{background:linear-gradient(150deg,rgba(255,200,90,.22),rgba(255,255,255,.7))}html.kn-light .ins-card .k{color:#a86a00}',
    // the Inspiration Library / Grow overlay
    '.ins{position:fixed;inset:0;z-index:2147482008;display:flex;flex-direction:column;background:linear-gradient(180deg,#1b1a24,#0e0d14);color:#f5f3fb;font:15px/1.45 -apple-system,BlinkMacSystemFont,system-ui,sans-serif}',
    'html.kn-light .ins{background:linear-gradient(180deg,#fbf8f1,#efe9dc);color:#1d1a12}',
    '.ins-head{display:flex;align-items:center;gap:8px;padding:calc(env(safe-area-inset-top,0px) + 14px) 16px 6px}.ins-head h2{flex:1;margin:0;font-size:24px;font-weight:800;letter-spacing:-.4px}',
    '.ins-b{width:38px;height:38px;border-radius:50%;border:0;background:rgba(127,127,127,.16);color:inherit;display:grid;place-items:center;cursor:pointer;font-size:18px}',
    '.ins-body{flex:1;overflow-y:auto;-webkit-overflow-scrolling:touch;padding:4px 16px calc(env(safe-area-inset-bottom,0px) + 40px)}',
    '.ins-tabs,.ins-chips{display:flex;gap:6px;overflow-x:auto;scrollbar-width:none;margin:4px 0 10px}.ins-tabs button,.ins-chips button{flex:none;height:32px;padding:0 13px;border-radius:999px;border:1px solid rgba(127,127,127,.3);background:none;color:inherit;font:600 13px -apple-system,system-ui,sans-serif;cursor:pointer}',
    '.ins-tabs button.on,.ins-chips button.on{background:#f5c66b;color:#2a1d00;border-color:transparent}',
    '.ins-search{display:flex;align-items:center;height:42px;padding:0 12px;border-radius:13px;background:rgba(127,127,127,.14);margin:4px 0 10px}.ins-search input{flex:1;border:0;background:none;outline:none;color:inherit;font:16px -apple-system,system-ui,sans-serif}',
    '.ins-row{display:flex;align-items:center;gap:10px;width:100%;text-align:left;padding:12px;margin-bottom:6px;border-radius:16px;border:1px solid rgba(127,127,127,.2);background:rgba(127,127,127,.07);color:inherit;font:inherit;cursor:pointer}',
    '.ins-row div{flex:1;min-width:0}.ins-row b{display:block;font-size:15px;font-weight:600}.ins-row small{display:block;font-size:12px;opacity:.6;margin-top:2px}.ins-row i{font-style:normal;opacity:.7}',
    '.ins-d{padding:4px 2px}.ins-d .q{font-size:22px;font-weight:750;line-height:1.3;letter-spacing:-.3px}.ins-d .f{opacity:.65;margin:6px 0}',
    '.ins-ans{padding:10px 12px;border-radius:14px;background:rgba(127,127,127,.1);margin:6px 0;font-size:14.5px;white-space:pre-wrap}.ins-ans small{display:block;opacity:.55;font-size:11.5px;margin-bottom:3px}',
    '.ins-go{height:44px;padding:0 18px;border-radius:14px;border:0;background:#f5c66b;color:#2a1d00;font:700 15px -apple-system,system-ui,sans-serif;cursor:pointer;margin:6px 6px 0 0}.ins-go.sec{background:rgba(127,127,127,.18);color:inherit}',
    '.ins-g{padding:14px;border-radius:18px;border:1px solid rgba(127,127,127,.22);background:rgba(127,127,127,.07);margin-bottom:10px}.ins-g b{font-size:16px}.ins-g p{margin:4px 0 8px;font-size:13.5px;opacity:.7}.ins-g ul{margin:0 0 8px;padding-left:18px;font-size:13.5px}',
    // the Smart Suggestions panel inside the Visual Library
    '.ds-panel{margin:8px 0 14px;padding:12px;border-radius:18px;border:1px solid rgba(127,127,127,.25);background:rgba(127,127,127,.08)}',
    '.ds-top{display:flex;align-items:center;gap:6px}.ds-top b{flex:1;font-size:14px}.ds-top button{border:0;background:none;color:inherit;opacity:.7;cursor:pointer;font:600 12.5px -apple-system,system-ui,sans-serif;padding:4px 6px}',
    '.ds-g{margin-top:10px}.ds-g h4{margin:0;font-size:13.5px;font-weight:700}.ds-g small{display:block;font-size:11.5px;opacity:.6;margin:1px 0 6px}',
    '.ds-row{display:flex;gap:8px;overflow-x:auto;scrollbar-width:none;padding-bottom:2px}.ds-row::-webkit-scrollbar{display:none}',
    '.ds-it{flex:0 0 96px;position:relative}.ds-it .im{display:block;width:96px;height:132px;border-radius:10px;object-fit:cover;background:rgba(127,127,127,.2);border:0;padding:0;cursor:pointer;overflow:hidden;color:inherit}',
    '.ds-it .im img{width:100%;height:100%;object-fit:cover;display:block}.ds-it .im span{display:grid;place-items:center;height:100%;font:800 26px -apple-system,system-ui,sans-serif;opacity:.6}',
    '.ds-it p{margin:4px 0 0;font-size:12px;line-height:1.2;display:-webkit-box;-webkit-line-clamp:2;-webkit-box-orient:vertical;overflow:hidden}',
    '.ds-add{position:absolute;right:4px;top:4px;width:28px;height:28px;border-radius:50%;border:2px solid #fff;background:rgba(0,0,0,.45);color:#fff;font:800 15px -apple-system,system-ui,sans-serif;cursor:pointer;display:grid;place-items:center}.ds-add.on{background:#30b45a}',
    '.ds-load{font-size:13px;opacity:.65;padding:8px 2px}',
    '.ds-tabs{display:flex;gap:6px;overflow-x:auto;scrollbar-width:none;margin:8px 0 0}.ds-tabs button{flex:none;height:28px;padding:0 11px;border-radius:999px;border:1px solid rgba(127,127,127,.3);background:none;color:inherit;font:600 12.5px -apple-system,system-ui,sans-serif;cursor:pointer}.ds-tabs button.on{background:rgba(127,127,127,.25)}',
    // Discover: inspired activities
    '.ins-dv{margin:0 0 14px}'
  ].join('\n');
  function css() { if (document.getElementById('ins-css')) return; var s = document.createElement('style'); s.id = 'ins-css'; s.textContent = CSS; document.head.appendChild(s); }

  // ---------------------------------------------------------------- the Daily Inspiration card (rendered by My World 3.0)
  var card = { answering: false };
  function cardHtml() {
    css(); var d = daily(); if (!d || !d.prompt) return '';
    var p = d.prompt;
    return '<section class="ins-card" data-ins-card="' + esc(p.id) + '"><button type="button" class="ins-x" data-ins="skip" aria-label="Skip today">×</button><div class="k">Daily Inspiration</div>' + (d.ctx ? '<div class="why">' + esc(d.ctx.reason) + '</div>' : '') +
      '<div class="q">' + esc(p.text) + '</div>' + (p.followUp ? '<div class="f">' + esc(p.followUp) + '</div>' : '') +
      (card.answering ? '<textarea class="ins-ta" data-ins-text placeholder="A word, a sentence — or nothing at all"></textarea><label class="ins-chk"><input type="checkbox" data-ins-inbox> Also add it to My World (Inbox)</label><div class="ins-acts"><button type="button" class="pri" data-ins="save">Save</button><button type="button" data-ins="cancel">Cancel</button></div>'
        : '<div class="ins-acts"><button type="button" class="pri" data-ins="answer">Answer</button>' + (p.action && p.action.type !== 'capture' ? '<button type="button" data-ins="explore">Explore</button>' : '') + '<button type="button" data-ins="later">' + (fav(p.id) ? '★ Saved' : 'Save for later') + '</button><button type="button" data-ins="another">Another</button><button type="button" data-ins="library">Library</button></div>') + '</section>';
  }
  function rerender() { try { if (window.MinestUniverse && MinestUniverse.isOpen()) MinestUniverse.refresh(); } catch (e) {} }
  function explore(p, ctx) {
    var a = p.action || {}, t = a.target;
    if (a.type === 'vl' && VL()) return VL().open({ category: t });
    if (a.type === 'discover' && window.MinestDiscover) {
      if (ctx && ctx.bid && ctx.card) return MinestDiscover.open({ bid: ctx.bid, cardId: ctx.card, tool: t });
      MinestDiscover.open(); setTimeout(function () { var b = document.querySelector('.dv [data-tool="' + t + '"]') || document.querySelector('.dv [data-philo="' + t + '"]'); if (b) b.click(); }, 150); return;
    }
    if (a.type === 'frameworks' && window.MinestFrameworks) return MinestFrameworks.open({ id: t, tab: 'structure' });
    if (a.type === 'world' && window.MinestMyWorld) return MinestMyWorld.gallery();
    if (window.MinestCapture) return MinestCapture.open();
  }
  document.addEventListener('click', function (e) {
    var b = e.target.closest && e.target.closest('[data-ins]'); if (!b || !b.closest('.ins-card')) return;
    e.stopPropagation();
    var a = b.getAttribute('data-ins'), d = daily(), p = d && d.prompt; if (!p) return;
    if (a === 'answer') { card.answering = true; rerender(); setTimeout(function () { var t = document.querySelector('.ins-card [data-ins-text]'); if (t) t.focus(); }, 60); return; }
    if (a === 'cancel') { card.answering = false; return rerender(); }
    if (a === 'save') {
      var box = b.closest('.ins-card'), txt = box.querySelector('[data-ins-text]').value, inbox = box.querySelector('[data-ins-inbox]').checked;
      if (!String(txt).trim()) return toast('Write a word or two — or Cancel.');
      answer(p.id, txt, { inbox: inbox }).then(function (r) {
        card.answering = false; rerender();
        var el = toast(inbox ? 'Saved to your Inspiration journal and your Inbox' : 'Saved to your Inspiration journal', { duration: 6000 });
        if (el && el.appendChild && r) { var u = document.createElement('button'); u.type = 'button'; u.textContent = 'Undo'; u.style.cssText = 'margin-left:10px;font-weight:700;color:#5ac8fa;background:none;border:0;cursor:pointer;white-space:nowrap;flex:none'; u.addEventListener('click', function (ev) { ev.stopPropagation(); el.click(); unanswer(p.id, r.entry.at); if (r.log && window.MinestCapture) MinestCapture.undo(r.log.id); toast('Undone'); rerender(); }); el.appendChild(u); }
      }); return;
    }
    if (a === 'explore') { log(p.id, 'explore'); return explore(p, d.ctx); }
    if (a === 'later') { var on = !fav(p.id); favorite(p.id, on); toast(on ? 'Saved for later — it’s in the Library' : 'Removed from Saved'); return rerender(); }
    if (a === 'another') { another(); return rerender(); }
    if (a === 'library') return library();
    if (a === 'skip') { skip(); rerender(); var el2 = toast('Skipped for today — see you tomorrow', { duration: 5000 }); if (el2 && el2.appendChild) { var u2 = document.createElement('button'); u2.type = 'button'; u2.textContent = 'Undo'; u2.style.cssText = 'margin-left:10px;font-weight:700;color:#5ac8fa;background:none;border:0;cursor:pointer'; u2.addEventListener('click', function (ev) { ev.stopPropagation(); el2.click(); unskip(); rerender(); }); el2.appendChild(u2); } }
  }, true);

  // ---------------------------------------------------------------- the Inspiration Library · Grow (one overlay)
  var L = { open: false };
  function shell() {
    css(); if (L.open) return;
    var el = document.createElement('div'); el.className = 'ins'; el.setAttribute('role', 'dialog'); el.setAttribute('aria-label', 'Inspiration');
    el.innerHTML = '<div class="ins-head"></div><div class="ins-body"></div>';
    ['pointerdown', 'touchstart', 'touchmove', 'wheel', 'keydown'].forEach(function (ev) { el.addEventListener(ev, function (e) { e.stopPropagation(); }, { passive: ev !== 'keydown' }); });
    el.addEventListener('click', onLib); el.addEventListener('input', function (e) { if (e.target.matches('[data-lq]')) { L.q = e.target.value; var pos = e.target.selectionStart; draw(); var i = L.body.querySelector('[data-lq]'); if (i) { i.focus(); try { i.setSelectionRange(pos, pos); } catch (x) {} } } });
    el.addEventListener('keydown', function (e) { if (e.key === 'Escape') { var b = L.head.querySelector('[data-back]'); if (b) b.click(); else closeLib(); } });
    document.body.appendChild(el); L.el = el; L.head = el.querySelector('.ins-head'); L.body = el.querySelector('.ins-body'); L.open = true;
    if (!reduce && el.animate) el.animate([{ opacity: 0, transform: 'translateY(16px)' }, { opacity: 1, transform: 'none' }], { duration: 240, easing: 'cubic-bezier(.2,.85,.25,1)' });
  }
  function closeLib() { if (!L.open) return; var el = L.el; L.open = false; L.el = null; el.remove(); rerender(); }
  function library(tab) { shell(); L.view = 'list'; L.tab = tab || L.tab || 'all'; L.cat = L.cat || ''; draw(); }
  function growView() { shell(); L.view = 'grow'; draw(); }
  function head(title, back) { L.head.innerHTML = (back ? '<button type="button" class="ins-b" data-back aria-label="Back">‹</button>' : '') + '<h2>' + esc(title) + '</h2><button type="button" class="ins-b" data-x aria-label="Close">×</button>'; }
  function draw() {
    if (L.view === 'grow') return drawGrow();
    if (L.view === 'detail') return drawDetail();
    head('Inspiration', false);
    var q = String(L.q || '').toLowerCase(), ps = LIB.prompts.filter(function (p) {
      if (L.tab === 'saved' && !fav(p.id)) return false; if (L.tab === 'answered' && !answers(p.id).length) return false;
      if (L.cat && p.category !== L.cat) return false; return !q || (p.text + ' ' + (p.followUp || '')).toLowerCase().indexOf(q) >= 0; });
    var ctx = L.tab === 'all' && !q && !L.cat ? contextual().slice(0, 3) : [];
    L.body.innerHTML = '<div class="ins-tabs">' + [['all', 'All'], ['saved', 'Saved'], ['answered', 'My answers']].map(function (t) { return '<button type="button" data-tab="' + t[0] + '"' + (L.tab === t[0] ? ' class="on"' : '') + '>' + t[1] + '</button>'; }).join('') + '<button type="button" data-grow>🌱 Grow My World</button></div>' +
      '<label class="ins-search"><input data-lq placeholder="Search prompts" value="' + esc(L.q || '') + '" autocomplete="off"></label>' +
      '<div class="ins-chips"><button type="button" data-cat=""' + (!L.cat ? ' class="on"' : '') + '>All topics</button>' + LIB.categories.map(function (c) { return '<button type="button" data-cat="' + c.id + '"' + (L.cat === c.id ? ' class="on"' : '') + '>' + esc(c.title) + '</button>'; }).join('') + '</div>' +
      (ctx.length ? '<div style="font-size:12px;font-weight:750;letter-spacing:.07em;text-transform:uppercase;opacity:.6;margin:6px 2px 8px">For you</div>' + ctx.map(function (c) { return row(c.prompt, c.reason, c); }).join('') + '<div style="font-size:12px;font-weight:750;letter-spacing:.07em;text-transform:uppercase;opacity:.6;margin:14px 2px 8px">All prompts</div>' : '') +
      (ps.length ? ps.map(function (p) { return row(p); }).join('') : '<p style="opacity:.6;text-align:center;padding:20px">Nothing here yet.</p>');
  }
  var ICONS = { capture: '✍️', vl: '🖼️', discover: '✨', frameworks: '🧭', world: '🌍' };
  function row(p, why, ctx) { var n = answers(p.id).length; return '<button type="button" class="ins-row" data-open="' + esc(p.id) + '"' + (ctx ? ' data-ctx="' + esc(JSON.stringify({ bid: ctx.bid, card: ctx.card, reason: ctx.reason })) + '"' : '') + '><i>' + (ICONS[(p.action || {}).type] || '✍️') + '</i><div><b>' + esc(p.text) + '</b><small>' + esc(why || ((LIB.categories.filter(function (c) { return c.id === p.category; })[0] || {}).title || '')) + (n ? ' · answered ' + n + '×' : '') + (fav(p.id) ? ' · ★' : '') + '</small></div></button>'; }
  function drawDetail() {
    var p = prompt(L.pid); if (!p) { L.view = 'list'; return draw(); }
    head('', true); var as = answers(p.id).slice().reverse();
    L.body.innerHTML = '<div class="ins-d"><div class="q">' + esc(p.text) + '</div>' + (L.ctx && L.ctx.reason ? '<div class="f">' + esc(L.ctx.reason) + '</div>' : '') + (p.followUp ? '<div class="f">' + esc(p.followUp) + '</div>' : '') +
      '<textarea class="ins-ta" data-dtext placeholder="Your answer — a word, a sentence, or nothing at all"></textarea><label class="ins-chk"><input type="checkbox" data-dinbox> Also add it to My World (Inbox)</label>' +
      '<div><button type="button" class="ins-go" data-dsave>Save answer</button>' + (p.action && p.action.type !== 'capture' ? '<button type="button" class="ins-go sec" data-dexplore>Explore</button>' : '') + '<button type="button" class="ins-go sec" data-dfav>' + (fav(p.id) ? '★ Saved' : 'Save for later') + '</button></div>' +
      (as.length ? '<div style="font-size:12px;font-weight:750;letter-spacing:.07em;text-transform:uppercase;opacity:.6;margin:18px 2px 6px">My answers</div>' + as.map(function (a) { return '<div class="ins-ans"><small>' + esc(new Date(a.at).toLocaleDateString()) + (a.inbox ? ' · also in My World' : '') + '</small>' + esc(a.text) + '<button type="button" class="ins-go sec" style="height:28px;font-size:12px;margin-top:6px;padding:0 10px" data-dela="' + a.at + '">Delete</button></div>'; }).join('') : '') + '</div>';
  }
  function drawGrow() {
    head('Grow My World', true); var gs = grow();
    L.body.innerHTML = '<p style="opacity:.7;margin:2px 2px 12px;font-size:14px">Small ideas from what you already have. Nothing changes until you choose — and every step can be undone.</p>' + (gs.length ? gs.map(function (g, i) {
      return '<div class="ins-g"><b>' + esc(g.title) + '</b><p>' + esc(g.reason) + '</p><ul>' + g.preview.slice(0, 6).map(function (t) { return '<li>' + esc(t) + '</li>'; }).join('') + (g.preview.length > 6 ? '<li>…and ' + (g.preview.length - 6) + ' more</li>' : '') + '</ul><button type="button" class="ins-go" data-gapply="' + i + '">' + (g.kind === 'discover' ? 'Open' : 'Do it') + '</button><button type="button" class="ins-go sec" data-goff="' + esc(g.id) + '">Not now</button></div>'; }).join('')
      : '<p style="opacity:.6;text-align:center;padding:24px">Nothing to suggest yet — keep collecting, and ideas will appear here.</p>');
    L.grow = gs;
  }
  function onLib(e) {
    var t = e.target, g;
    if (t.closest('[data-x]')) return closeLib();
    if (t.closest('[data-back]')) { L.view = 'list'; L.ctx = null; return draw(); }
    if ((g = t.closest('[data-tab]'))) { L.tab = g.getAttribute('data-tab'); return draw(); }
    if (t.closest('[data-grow]')) { L.view = 'grow'; return draw(); }
    if ((g = t.closest('[data-cat]'))) { L.cat = g.getAttribute('data-cat'); return draw(); }
    if ((g = t.closest('[data-open]'))) { L.pid = g.getAttribute('data-open'); try { L.ctx = JSON.parse(g.getAttribute('data-ctx') || 'null'); } catch (x) { L.ctx = null; } L.view = 'detail'; return draw(); }
    if (t.closest('[data-dsave]')) { var tx = L.body.querySelector('[data-dtext]').value, ib = L.body.querySelector('[data-dinbox]').checked; if (!String(tx).trim()) return toast('Write a word or two first.'); answer(L.pid, tx, { inbox: ib }).then(function () { toast(ib ? 'Saved — also in your Inbox' : 'Saved to your Inspiration journal'); draw(); }); return; }
    if (t.closest('[data-dexplore]')) { var p = prompt(L.pid), c = L.ctx; closeLib(); log(L.pid, 'explore'); setTimeout(function () { explore(p, c); }, 150); return; }
    if (t.closest('[data-dfav]')) { favorite(L.pid, !fav(L.pid)); return draw(); }
    if ((g = t.closest('[data-dela]'))) { unanswer(L.pid, +g.getAttribute('data-dela')); toast('Answer deleted'); return draw(); }
    if ((g = t.closest('[data-goff]'))) { var off = Object.assign({}, KN().get('ins:growoff') || {}); off[g.getAttribute('data-goff')] = Date.now(); KN().set('ins:growoff', off, true); return draw(); }
    if ((g = t.closest('[data-gapply]'))) {
      var item = L.grow[+g.getAttribute('data-gapply')]; if (!item) return;
      if (item.kind === 'discover') { closeLib(); setTimeout(function () { applyGrow(item); }, 150); return; }
      applyGrow(item).then(function (r) {
        log(item.id, 'grow'); draw();
        var el = toast('Done — ' + item.title.replace(/^Create |^Move /, '').toLowerCase(), { duration: 7000 });
        if (el && el.appendChild && r && r.undo) { var u = document.createElement('button'); u.type = 'button'; u.textContent = 'Undo'; u.style.cssText = 'margin-left:10px;font-weight:700;color:#5ac8fa;background:none;border:0;cursor:pointer'; u.addEventListener('click', function (ev) { ev.stopPropagation(); el.click(); Promise.resolve(r.undo()).then(function () { toast('Undone'); if (L.open) draw(); }); }); el.appendChild(u); }
      }).catch(function (er) { toast('✗ ' + er.message); });
    }
  }

  // ---------------------------------------------------------------- Smart Suggestions inside the Visual Library
  var S = { entity: null, groups: null, loading: false, off: false, more: {}, ctrl: null, timer: 0 };
  function vlRoot() { return document.querySelector('.vl'); }
  function selectedIds() { try { return (VL().selected ? VL().selected() : []).map(function (x) { return x.entityId; }); } catch (e) { return []; } }
  function panelHtml() {
    if (!S.entity || S.off) return '';
    var on = {}; selectedIds().forEach(function (id) { on[id] = 1; });
    var h = '<section class="ds-panel" aria-label="Suggestions"><div class="ds-top"><b>Because you picked ' + esc(S.entity.title) + '</b><button type="button" data-ds="refresh">Refresh</button><button type="button" data-ds="dismiss" aria-label="Dismiss">✕</button></div>';
    if (S.loading) return h + '<div class="ds-load">Finding related things…</div></section>';
    if (!S.groups || !S.groups.length) return h + '<div class="ds-load">No reliable suggestions for this one — that’s fine.</div></section>';
    var gi = Math.min(S.gi || 0, S.groups.length - 1);
    if (S.groups.length > 1) h += '<div class="ds-tabs">' + S.groups.map(function (g, i) { return '<button type="button" data-ds-tab="' + i + '"' + (i === gi ? ' class="on"' : '') + '>' + esc(g.title.split(' · ')[0]) + '</button>'; }).join('') + '</div>';
    [S.groups[gi]].forEach(function (g) {
      var all = g.items, show = S.more[g.id] ? all : all.slice(0, 6);
      h += '<div class="ds-g"><small>' + esc(g.title.indexOf(' · ') > 0 ? g.title.split(' · ')[1] + ' — ' : '') + esc(g.reason) + '</small><div class="ds-row">' + show.map(function (x) {
        var im = x.image && x.image.url;
        return '<div class="ds-it"><button type="button" class="im" data-ds-pv="' + esc(x.entityId) + '" aria-label="Preview ' + esc(x.title) + '">' + (im ? '<img loading="lazy" alt="" src="' + esc(im) + '">' : '<span>' + esc(String(x.title).charAt(0)) + '</span>') + '</button>' +
          '<button type="button" class="ds-add' + (on[x.entityId] ? ' on' : '') + '" data-ds-add="' + esc(x.entityId) + '" aria-label="' + (on[x.entityId] ? 'Selected' : 'Add') + ' ' + esc(x.title) + '">' + (on[x.entityId] ? '✓' : '+') + '</button><p>' + esc(x.title) + '</p></div>'; }).join('') + '</div>' +
        (all.length > 6 && !S.more[g.id] ? '<button type="button" class="ds-top" style="border:0;background:none;color:inherit;opacity:.7;font:600 12.5px -apple-system,system-ui,sans-serif;cursor:pointer;padding:4px 0" data-ds-more="' + g.id + '">See more</button>' : '') + '</div>';
    });
    return h + '</section>';
  }
  function place() {
    var root = vlRoot(); if (!root) return; css();
    var old = root.querySelector('.ds-panel'); if (old) old.remove();
    var html = panelHtml(); if (!html) return;
    var body = root.querySelector('.pk-body') || root.querySelector('[class*="body"]'); if (!body || body.querySelector('.vl-detail')) return;
    var anchor = body.querySelector('.vl-toolbar');
    var tmp = document.createElement('div'); tmp.innerHTML = html; var panel = tmp.firstChild;
    if (anchor && anchor.nextSibling) body.insertBefore(panel, anchor.nextSibling); else body.insertBefore(panel, body.firstChild);
  }
  function load(x, refresh) {
    if (S.ctrl) S.ctrl.abort(); S.ctrl = new AbortController(); var my = S.ctrl;
    S.entity = x; S.groups = null; S.loading = true; S.off = false; S.more = {}; S.gi = 0; place();
    suggest(x, { signal: my.signal, refresh: refresh }).then(function (r) { if (S.ctrl !== my) return; S.loading = false; S.groups = r.groups; place(); }, function (e) { if (S.ctrl !== my || (e && e.name === 'AbortError')) return; S.loading = false; S.groups = []; place(); });
  }
  document.addEventListener('minest:vl-select', function (e) {
    var d = e.detail || {}; if (!d.on || !d.entity || S.fromPanel) return;   // picks made from the panel keep the panel as it is
    clearTimeout(S.timer); S.timer = setTimeout(function () { load(d.entity); }, 450);   // only the latest pick, after a short pause
  });
  document.addEventListener('minest:vl-render', function () { if (S.entity) place(); });
  function findEntity(id) { var out = null; (S.groups || []).forEach(function (g) { g.items.forEach(function (x) { if (x.entityId === id) out = x; }); }); return out; }
  document.addEventListener('click', function (e) {
    var b = e.target.closest && e.target.closest('.ds-panel [data-ds],.ds-panel [data-ds-add],.ds-panel [data-ds-pv],.ds-panel [data-ds-more],.ds-panel [data-ds-tab]'); if (!b) return;
    e.stopPropagation(); e.preventDefault();
    if (b.hasAttribute('data-ds-tab')) { S.gi = +b.getAttribute('data-ds-tab'); place(); return; }
    if (b.hasAttribute('data-ds')) { var a = b.getAttribute('data-ds'); if (a === 'dismiss') { S.off = true; place(); } else if (S.entity) load(S.entity, true); return; }
    if (b.hasAttribute('data-ds-more')) { S.more[b.getAttribute('data-ds-more')] = 1; place(); return; }
    var x = findEntity(b.getAttribute('data-ds-add') || b.getAttribute('data-ds-pv')); if (!x || !VL()) return;
    if (b.hasAttribute('data-ds-add')) { S.fromPanel = true; try { if (VL().selectEntity) VL().selectEntity(x, selectedIds().indexOf(x.entityId) < 0); } finally { S.fromPanel = false; } place(); }
    else if (VL().previewEntity) VL().previewEntity(x);
  }, true);

  // ---------------------------------------------------------------- Discover: activities led by an inspiration
  function inspiredRow() {
    var dv = document.querySelector('.dv'); if (!dv || dv.querySelector('.ins-dv')) return;
    var body = dv.querySelector('.dv-body'), sub = body && body.querySelector('.dv-sub'); if (!sub || !body.querySelector('.dv-tools')) return;
    var ctx = contextual().filter(function (c) { return c.prompt.discoverTool; }), d = daily(), list = [];
    ctx.slice(0, 1).forEach(function (c) { list.push({ p: c.prompt, why: c.reason, ctx: c }); });
    if (d && d.prompt && d.prompt.discoverTool && !list.some(function (x) { return x.p.id === d.prompt.id; })) list.push({ p: d.prompt, why: 'Today’s inspiration', ctx: d.ctx });
    LIB.prompts.filter(function (p) { return p.discoverTool; }).slice(hashOf(today()) % 5, hashOf(today()) % 5 + 1).forEach(function (p) { if (list.length < 2 && !list.some(function (x) { return x.p.id === p.id; })) list.push({ p: p, why: 'An idea to try', ctx: null }); });
    if (!list.length) return; css();
    var el = document.createElement('div'); el.className = 'ins-dv';
    el.innerHTML = '<div class="dv-h">Inspired for you</div>' + list.map(function (x, i) { return '<button type="button" class="dv-row" data-insdv="' + i + '"><div><b>' + esc(x.p.text) + '</b><small>' + esc(x.why) + '</small></div><span class="cv">›</span></button>'; }).join('');
    el.addEventListener('click', function (e) { var b = e.target.closest('[data-insdv]'); if (!b) return; e.stopPropagation(); var x = list[+b.getAttribute('data-insdv')]; log(x.p.id, 'discover'); var a = x.p.action || {}; if (x.ctx && x.ctx.bid && x.ctx.card) { MinestDiscover.close(); setTimeout(function () { MinestDiscover.open({ bid: x.ctx.bid, cardId: x.ctx.card, tool: a.target }); }, 120); } else { var t = document.querySelector('.dv [data-tool="' + a.target + '"]') || document.querySelector('.dv [data-philo="' + a.target + '"]'); if (t) t.click(); } }, true);
    sub.insertAdjacentElement('afterend', el);
  }
  var mo = new MutationObserver(function () { if (document.querySelector('.dv .dv-tools') && !document.querySelector('.dv .ins-dv')) inspiredRow(); });
  function watch() { if (!document.body) return setTimeout(watch, 200); mo.observe(document.body, { childList: true, subtree: true }); }
  watch();

  window.MinestInspire = { cardHtml: cardHtml, library: library, grow: growView, close: closeLib, isOpen: function () { return L.open; } };
})();

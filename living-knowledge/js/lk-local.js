/* Minest Living Knowledge · the on-device engine (window.MinestLKLocal; also a Node module for the tests).
   The three things the cloud model does — organise a source, answer from the library, draft a page — done here with
   plain algorithms, so nothing leaves the device and the same text always gives the same result:
     extract  sentences → word counts → key concepts → sentence ranking (TextRank) → claims → relations
     answer   the claims that share the most (rare) words with the question, each one cited
     compose  a page body laid out from its accepted claims
   It only ever selects and arranges words that are in the source: every claim is a sentence of the source with its
   exact position, and it never infers anything. It does not understand meaning, so it cannot paraphrase, translate,
   or match a question to text in another language.
   extract() also returns `trace`: what each step produced, which the page draws. */
(function (root, factory) {
  var L = factory();
  if (typeof module === 'object' && module.exports) module.exports = L; else root.MinestLKLocal = L;
})(typeof window !== 'undefined' ? window : this, function () {
  'use strict';

  function set(s) { var o = {}; s.split(/\s+/).forEach(function (w) { if (w) o[w] = 1; }); return o; }
  var STOP = set('a about above after again against all also am among amongst an and any are as at be because been before being below between both but by can cannot could did do does doing down during each either else ever every few for from further get gets got had has hath have having he her here hers him his how however i if in indeed into is it its itself just let may me might more most much must my neither no nor not now of off on once one only or other ought our ours out over own same shall she should so some such than that the their theirs them themselves then there therefore these they this those through thus to too under until up upon us very was we were what when whenever where which while who whom whose why will with within without would yet you your');
  // too general to be a page of their own
  var WEAK = set('thing way part case time kind number lot form many new good great long full first second last another different several various whole general certain present former necessary free example use make take give become come say well even still less year day end fact point object world history cause');
  var CJK_STOP = '的了是在和与及或也都就而但这那之以于对被把将很更最没我你他她它们个着过地得所并且吗呢啊吧其为';
  var CJK = /[\u3400-\u9fff]/;
  var NEG_EN = /\b(not|no|never|cannot|neither|nor|without)\b|n't\b/gi, NEG_ZH = /[不没無无非未]/g;

  function norm(s) { return String(s || '').normalize('NFKC').toLowerCase().replace(/\s+/g, ' ').trim(); }
  function clip(s, n) { return String(s == null ? '' : s).replace(/\s+/g, ' ').trim().slice(0, n); }
  function escRe(s) { return s.replace(/[.*+?^${}()|[\]\\]/g, '\\$&'); }
  function cap(s) { return s ? s.charAt(0).toUpperCase() + s.slice(1) : s; }
  function stem(w) {
    if (w.length > 4 && /ies$/.test(w)) return w.slice(0, -3) + 'y';
    if (w.length > 4 && /(ch|sh|ss|x|z)es$/.test(w)) return w.slice(0, -2);
    if (w.length > 3 && /s$/.test(w) && !/(ss|us|is)$/.test(w)) return w.slice(0, -1);
    return w;
  }

  // ---------------------------------------------------------------- 1 · sentences, each with its place in the text
  var ABBR = /(?:^|[\s(])(?:[A-Za-z]|mr|mrs|ms|dr|st|vs|etc|no|fig|e\.g|i\.e)$/i;
  function sentences(text) {
    var out = [], last = 0, m, re = /[。！？!?；;]+["”’」』）)]*|\.+["”’)]*(?=\s|$|--)|\n+|--+|——+/g;
    function push(a, b) {
      while (a < b && /\s/.test(text[a])) a++;
      while (b > a && /\s/.test(text[b - 1])) b--;
      if (b - a >= 2 && /[A-Za-z0-9\u3400-\u9fff]/.test(text.slice(a, b))) out.push({ start: a, end: b, text: text.slice(a, b) });
    }
    while ((m = re.exec(text))) {
      var d = m[0];
      if (d[0] === '.') {
        if (ABBR.test(text.slice(Math.max(0, m.index - 6), m.index))) continue;
        var next = /^\s*(\S)/.exec(text.slice(m.index + d.length));
        if (next && /[a-z]/.test(next[1])) continue;
      }
      var keep = /^(\n|-|—)/.test(d) ? 0 : d.length;
      push(last, m.index + keep);
      last = m.index + d.length;
    }
    push(last, text.length);
    out.forEach(function (s, i) { s.i = i; });
    return out;
  }

  // the words of a sentence: latin words (with stem, and whether capitalised inside the sentence) and CJK pairs
  function readWords(s) {
    var words = [], terms = {}, m, re = /[A-Za-z]+(?:['’][A-Za-z]+)?|\d{3,4}/g, n = 0, stops = 0;
    while ((m = re.exec(s.text))) {
      var raw = m[0].replace(/['’]s$/i, ''), lower = raw.toLowerCase(), first = n++ === 0;
      if (STOP[lower] || lower.length < 3) { stops++; words.push({ raw: raw, lower: lower, stop: true, at: m.index }); continue; }
      var st = stem(lower);
      words.push({ raw: raw, lower: lower, stem: st, cap: /^[A-Z]/.test(raw) && !first, at: m.index });
      terms[st] = (terms[st] || 0) + 1;
    }
    (s.text.match(/[\u3400-\u9fff]+/g) || []).forEach(function (run) {
      for (var i = 0; i < run.length - 1; i++) {
        var g = run.slice(i, i + 2);
        if (CJK_STOP.indexOf(g[0]) >= 0 || CJK_STOP.indexOf(g[1]) >= 0) { stops++; continue; }
        terms[g] = (terms[g] || 0) + 1;
      }
    });
    s.words = words; s.terms = terms; s.stops = stops;
    return s;
  }
  function termsOf(text) { return Object.keys(readWords({ text: String(text || '') }).terms); }
  function overlap(a, b) {
    var x = {}, inter = 0, n = 0;
    a.forEach(function (t) { x[t] = 1; n++; });
    b.forEach(function (t) { if (x[t]) inter++; else n++; });
    return n ? inter / n : 0;
  }
  function negations(s) { return ((s.match(NEG_EN) || []).length + (s.match(NEG_ZH) || []).length) % 2; }

  // ---------------------------------------------------------------- 2 · key concepts
  function capPhrases(s) {
    var out = [], m, re = /[A-Z][A-Za-z'’]*(?:(?:\s+(?:of the|of|and|by))?\s+[A-Z][A-Za-z'’]*){1,3}/g;
    while ((m = re.exec(s.text))) {
      var seg = [], segs = [seg], toks = m[0].split(/\s+/);
      toks.forEach(function (t, i) {
        var isCap = /^[A-Z]/.test(t);
        if (isCap && STOP[t.toLowerCase()]) { seg = []; segs.push(seg); return; }
        if (isCap && m.index === 0 && i === 0 && STOP[t.toLowerCase()]) return;
        seg.push(t);
      });
      segs.forEach(function (g) {
        while (g.length && !/^[A-Z]/.test(g[0])) g.shift();
        while (g.length && !/^[A-Z]/.test(g[g.length - 1])) g.pop();
        if (g.filter(function (t) { return /^[A-Z]/.test(t); }).length < 2) return;
        out.push(g.join(' '));
        // the capitalised words standing together inside it are a name too ("King of Great Britain" → "Great Britain")
        var run = [];
        g.concat(['']).forEach(function (t) {
          if (/^[A-Z]/.test(t)) { run.push(t); return; }
          if (run.length >= 2 && run.length < g.length) out.push(run.join(' '));
          run = [];
        });
      });
    }
    return out;
  }
  function concepts(sents, title) {
    var flat = sents.map(function (s) { return s.text; }).join(' \n ').replace(/[ \t]+/g, ' ');
    var small = sents.length <= 12, cands = [];
    var uni = {};
    sents.forEach(function (s) {
      s.words.forEach(function (w) {
        if (w.stop || /^\d/.test(w.raw)) return;
        var u = uni[w.stem] || (uni[w.stem] = { stem: w.stem, count: 0, cap: 0, forms: {}, capForms: {}, first: s.i });
        u.count++; u.forms[w.lower] = (u.forms[w.lower] || 0) + 1;
        if (w.cap) { u.cap++; u.capForms[w.lower] = (u.capForms[w.lower] || 0) + 1; }
      });
    });
    // capitalised names of two or more words
    var seen = {};
    sents.forEach(function (s) {
      capPhrases(s).forEach(function (p) {
        var key = p.toLowerCase();
        if (seen[key]) return; seen[key] = 1;
        var re = new RegExp('\\b' + key.split(' ').map(escRe).join('\\s+') + '\\b', 'gi'), hits = flat.match(re) || [];
        if (hits.length < (small ? 1 : 2)) return;
        var surface = p, before = [], m, re2 = new RegExp('([A-Za-z]+)\\s+' + key.split(' ').map(escRe).join('\\s+') + '\\b', 'gi');
        while ((m = re2.exec(flat))) before.push(m[1].toLowerCase());
        // the same describing word in front every time belongs to the name ("united States of America")
        if (hits.length >= 2 && before.length === hits.length && !STOP[before[0]] && before.every(function (b) { return b === before[0]; })) { surface = cap(before[0]) + ' ' + p; key = surface.toLowerCase(); }
        var stems = key.split(' ').filter(function (w) { return !STOP[w]; }).map(stem);
        cands.push({ title: surface, key: key, phrase: true, stems: stems, count: hits.length, weight: hits.length * 1.6 * 1.3, first: s.i, aliases: [],
          re: new RegExp('\\b' + key.split(' ').map(escRe).join('\\s+') + '\\b', 'i') });
      });
    });
    // of two names where one is inside the other, the stronger one stays
    cands.sort(function (a, b) { return b.weight * Math.sqrt(b.stems.length) - a.weight * Math.sqrt(a.stems.length); });
    var phrases = [];
    cands.forEach(function (c) { if (!phrases.some(function (k) { return k.key.indexOf(c.key) >= 0 || c.key.indexOf(k.key) >= 0; })) phrases.push(c); });
    // single words that come back
    var words = [];
    Object.keys(uni).forEach(function (st) {
      var u = uni[st];
      if (u.count < (sents.length > 60 ? 3 : 2) || st.length < 4 || WEAK[st]) return;
      var forms = Object.keys(u.cap ? u.capForms : u.forms).sort(function (a, b) { return ((u.cap ? u.capForms : u.forms)[b] - (u.cap ? u.capForms : u.forms)[a]) || a.length - b.length; });
      if (/(ed|ly|ive|ous|able|ible|ical|less|ful|ing)$/.test(forms[0])) return;
      var inside = phrases.filter(function (p) { return p.stems.indexOf(st) >= 0; }).reduce(function (n, p) { return n + p.count; }, 0);
      if (inside && u.count - inside < 3) return;
      words.push({ title: cap(forms[0]), key: st, stem: st, stems: [st], count: u.count, weight: u.count * (u.cap ? 1.3 : 1), first: u.first,
        aliases: Object.keys(u.forms).filter(function (f) { return f !== forms[0]; }).map(cap).slice(0, 4) });
    });
    // Chinese: strings of 2–6 characters that come back, the longest form of each
    var zh = {}, zhChars = 0;
    sents.forEach(function (s) {
      (s.text.match(/[\u3400-\u9fff]+/g) || []).forEach(function (run) {
        zhChars += run.length;
        run.split(new RegExp('[' + CJK_STOP + ']')).forEach(function (seg) {
          for (var n = 2; n <= 6; n++) for (var i = 0; i + n <= seg.length; i++) {
            var g = seg.slice(i, i + n), z = zh[g] || (zh[g] = { g: g, count: 0, first: s.i });
            z.count++;
          }
        });
      });
    });
    var zhList = Object.keys(zh).map(function (g) { return zh[g]; }).filter(function (z) { return z.count >= (zhChars > 3000 ? 3 : 2); })
      .sort(function (a, b) { return b.g.length - a.g.length || b.count - a.count || a.first - b.first; });
    var zhKept = [];
    zhList.forEach(function (z) {
      var clash = zhKept.some(function (k) {
        if (k.g.indexOf(z.g) >= 0) return z.count <= k.count + 1;
        if (k.count !== z.count) return false;
        for (var i = 0; i < z.g.length - 1; i++) if (k.g.indexOf(z.g.slice(i, i + 2)) >= 0) return true;
        return false;
      });
      if (!clash) zhKept.push(z);
    });
    zhKept.forEach(function (z) { words.push({ title: z.g, key: z.g, zh: true, stems: [z.g], count: z.count, weight: z.count * Math.sqrt(z.g.length), first: z.first, aliases: [] }); });

    var tn = norm(title);
    var all = phrases.concat(words);
    all.forEach(function (c) { if (tn && tn.indexOf(c.zh ? c.key : c.title.toLowerCase()) >= 0) c.weight *= 1.2; });
    all.sort(function (a, b) { return b.weight - a.weight || a.first - b.first; });
    var k = Math.max(5, Math.min(12, Math.round(sents.length / 2.2)));
    all = all.slice(0, k);
    all.forEach(function (c) {
      c.type = /^(King|Queen|President|Prince|Princess|Mr|Mrs|Dr)\b/.test(c.title) ? 'person' : /(War|Revolution|Battle|Treaty)$|(战争|革命|运动|会议|事件|起义)$/.test(c.title) ? 'event' : 'concept';
      c.mentions = sents.filter(function (s) { return mentions(c, s); }).map(function (s) { return s.i; });
    });
    return all.filter(function (c) { return c.mentions.length; });
  }
  function mentions(c, s) {
    if (c.zh) return s.text.indexOf(c.key) >= 0;
    if (c.phrase) return c.re.test(s.text);
    return !!s.terms[c.stem];
  }

  // ---------------------------------------------------------------- 3 · which sentences carry the most (TextRank)
  function rank(sents, cons) {
    var n = sents.length, keys = sents.map(function (s) { return Object.keys(s.terms); });
    var sim = [], sum = [];
    for (var i = 0; i < n; i++) { sim.push(new Array(n).fill(0)); sum.push(0); }
    for (i = 0; i < n; i++) for (var j = i + 1; j < n; j++) {
      if (keys[i].length < 2 || keys[j].length < 2) continue;
      var common = 0; keys[i].forEach(function (t) { if (sents[j].terms[t]) common++; });
      if (!common) continue;
      var v = common / (Math.log(keys[i].length + 1) + Math.log(keys[j].length + 1));
      sim[i][j] = sim[j][i] = v; sum[i] += v; sum[j] += v;
    }
    var pr = new Array(n).fill(1);
    for (var it = 0; it < 24; it++) {
      var nx = new Array(n).fill(0.15);
      for (i = 0; i < n; i++) { if (!sum[i]) continue; for (j = 0; j < n; j++) if (sim[i][j]) nx[j] += 0.85 * pr[i] * sim[i][j] / sum[i]; }
      pr = nx;
    }
    var maxPr = Math.max.apply(null, pr.concat([1e-9]));
    var cw = sents.map(function (s) { return cons.reduce(function (t, c) { return t + (c.mentions.indexOf(s.i) >= 0 ? c.weight : 0); }, 0); });
    var maxCw = Math.max.apply(null, cw.concat([1e-9]));
    sents.forEach(function (s, k) {
      var early = n > 4 && k < Math.max(2, n * 0.15) ? 1 : 0;
      s.score = Math.round((0.5 * pr[k] / maxPr + 0.38 * cw[k] / maxCw + 0.12 * early) * 1000) / 1000;
    });
  }

  // ---------------------------------------------------------------- 4 · claims: the strongest sentences, word for word
  var OPINION = /\b(we hold|we believe|i believe|i think|in (my|our) (view|opinion)|should|ought|must|duty|it is the right)\b|认为|应该|应当|必须|主张|我觉得/i;
  var DEFINITION = /\b(is|are|was|were) (a|an|the|defined as|called|known as)\b|\b(means|refers to|is defined)\b|是指|指的是|是一种|定义为|称为|叫做/i;
  function claimText(t) {
    t = clip(t, 500).replace(/[,;:，；：]+$/, '');
    if (/^[a-z]/.test(t)) t = cap(t);
    if (!/[.!?。！？”"’)）]$/.test(t)) t += CJK.test(t) ? '。' : '.';
    return t;
  }
  function pickClaims(sents, cons) {
    var skipped = { short: 0, noConcept: 0 };
    var ok = sents.filter(function (s) {
      var zh = CJK.test(s.text), len = s.text.length;
      if (len < (zh ? 10 : 30) || Object.keys(s.terms).length < 3) { skipped.short++; return false; }
      if (!cons.some(function (c) { return c.mentions.indexOf(s.i) >= 0; })) { skipped.noConcept++; return false; }
      return true;
    });
    var take = Math.min(25, Math.max(5, Math.round(ok.length * 0.55)));
    var sorted = ok.slice().sort(function (a, b) { return b.score - a.score || a.i - b.i; });
    var top = sorted.slice(0, take), load = {}, owner = {};
    var has = function (c, s) { return c.mentions.indexOf(s.i) >= 0; };
    // a sentence goes to the strongest concept it names; a concept that has nothing yet goes first, so pages fill evenly
    var want = function (c) { return load[c.title] ? c.weight / (1 + load[c.title] * 0.45) : c.weight * 4; };
    top.forEach(function (s) {
      var c = cons.filter(function (x) { return has(x, s); }).sort(function (x, y) { return want(y) - want(x); })[0];
      owner[s.i] = c; load[c.title] = (load[c.title] || 0) + 1;
    });
    // every concept keeps at least its own best sentence, so no page starts empty
    cons.forEach(function (c) {
      if (load[c.title] || top.length >= 25) return;
      var s = sorted.filter(function (x) { return has(c, x) && !owner[x.i]; })[0];
      if (s) { top.push(s); owner[s.i] = c; load[c.title] = 1; }
    });
    var best = top.length ? top[0].score : 1;
    var claims = top.map(function (s) {
      var c = owner[s.i];
      s.pick = true; s.concept = c.title; s.kind = OPINION.test(s.text) ? 'opinion' : DEFINITION.test(s.text) ? 'definition' : 'fact';
      return { s: s.i, page: c.title, text: claimText(s.text), kind: s.kind, confidence: Math.round((0.6 + 0.35 * s.score / best) * 100) / 100, quote: s.text.slice(0, 200), start: s.start };
    }).sort(function (a, b) { return a.s - b.s; });
    return { claims: claims, skipped: skipped, load: load };
  }

  // ---------------------------------------------------------------- 5 · relations: concepts named in the same sentence
  function relate(sents, cons) {
    var pairs = {};
    sents.forEach(function (s) {
      var here = cons.filter(function (c) { return c.mentions.indexOf(s.i) >= 0; });
      for (var i = 0; i < here.length; i++) for (var j = i + 1; j < here.length; j++) {
        var a = here[i], b = here[j];
        if (a.key.indexOf(b.key) >= 0 || b.key.indexOf(a.key) >= 0) continue;
        var k = a.title < b.title ? a.title + '\u0001' + b.title : b.title + '\u0001' + a.title;
        var p = pairs[k] || (pairs[k] = { a: a, b: b, n: 0, best: s });
        p.n++; if (s.score > p.best.score) p.best = s;
      }
    });
    return Object.keys(pairs).map(function (k) { return pairs[k]; })
      .sort(function (x, y) { return y.n * Math.min(y.a.weight, y.b.weight) - x.n * Math.min(x.a.weight, x.b.weight); }).slice(0, 15)
      .map(function (p) {
        var t = p.best.text, type = /\b(part of|belongs? to|consists? of|includ\w+)\b|包括|属于|组成/i.test(t) ? 'part_of' : /\bderiv\w+\b|来自|源于|产生于/i.test(t) ? 'derived_from' : 'related';
        p.best.rel = true;
        return { from: p.a.title, to: p.b.title, type: type, n: p.n, s: p.best.i, quote: p.best.text.slice(0, 200), start: p.best.start };
      });
  }

  function analyze(text, title) {
    var sents = sentences(text).map(readWords);
    var cons = concepts(sents, title);
    rank(sents, cons);
    var picked = pickClaims(sents, cons);
    // a concept none of whose sentences could be kept would be an empty page: it is left out
    cons = cons.filter(function (c) { return picked.load[c.title]; });
    var counts = {}, forms = {};
    sents.forEach(function (s) {
      s.words.forEach(function (w) { if (!w.stop) { counts[w.stem] = (counts[w.stem] || 0) + 1; (forms[w.stem] = forms[w.stem] || {})[w.lower] = 1; } });
    });
    cons.forEach(function (c) { if (c.zh) { counts[c.key] = c.count; forms[c.key] = {}; forms[c.key][c.key] = 1; } });
    var terms = Object.keys(counts).map(function (t) { return { term: t, count: counts[t], forms: Object.keys(forms[t]) }; })
      .sort(function (a, b) { return b.count - a.count || (a.term < b.term ? -1 : 1); });
    return { sentences: sents, concepts: cons, claims: picked.claims, skipped: picked.skipped, relations: relate(sents, cons), terms: terms,
      tokens: sents.reduce(function (n, s) { return n + s.words.length; }, 0), stops: sents.reduce(function (n, s) { return n + s.stops; }, 0) };
  }

  /* The same answer as /api/minest/lk-extract, made on the device.
     input: { text, offset, title, pages: [{ id, title, aliases }], claims: [{ id, page, text }] } */
  function extract(input) {
    input = input || {};
    var text = String(input.text || ''), offset = Math.max(0, Math.floor(Number(input.offset) || 0));
    if (text.trim().length < 20) throw new Error('这段文字太短，整理不出内容');
    var a = analyze(text, input.title);
    var known = {};
    (Array.isArray(input.pages) ? input.pages : []).forEach(function (p) {
      if (!p || !/^pg_/.test(p.id || '')) return;
      [p.title].concat(p.aliases || []).forEach(function (t) { var k = norm(t); if (k && !known[k]) known[k] = p; });
    });
    var pageOf = {};
    var outConcepts = a.concepts.map(function (c) {
      var hit = [c.title].concat(c.aliases).map(function (t) { return known[norm(t)]; }).filter(Boolean)[0] || null;
      var bestS = c.mentions.map(function (i) { return a.sentences[i]; }).sort(function (x, y) { return y.score - x.score; })[0];
      pageOf[c.title] = hit ? hit.id : '';
      return { title: hit ? hit.title : c.title, type: c.type, aliases: c.aliases.slice(0, 8), summary: bestS ? claimText(clip(bestS.text, 400)) : '', matchPageId: hit ? hit.id : '' };
    });
    var titleOf = {}; a.concepts.forEach(function (c, i) { titleOf[c.title] = outConcepts[i].title; });
    var old = (Array.isArray(input.claims) ? input.claims : []).filter(function (c) { return c && /^cl_/.test(c.id || ''); })
      .map(function (c) { return { id: c.id, text: String(c.text || ''), terms: termsOf(c.text), neg: negations(String(c.text || '')) }; });
    var outClaims = a.claims.map(function (c) {
      var ts = termsOf(c.text), neg = negations(c.text), same = '', against = '';
      old.forEach(function (o) {
        var v = overlap(ts, o.terms);
        if (v >= 0.85 && o.neg === neg && !same) same = o.id;
        else if (v >= 0.55 && o.neg !== neg && !against) against = o.id;
      });
      return { page: titleOf[c.page], pageId: pageOf[c.page], text: c.text, kind: c.kind, confidence: c.confidence,
        evidence: { start: offset + c.start, end: offset + c.start + c.quote.length, quote: c.quote },
        sameAsClaimId: same, contradictsClaimId: against, why: against ? '两句话说的几乎是同一件事，但一句肯定、一句否定' : '' };
    });
    var outRelations = a.relations.map(function (r) {
      return { from: titleOf[r.from], fromPageId: pageOf[r.from], to: titleOf[r.to], toPageId: pageOf[r.to], type: r.type,
        evidence: { start: offset + r.start, end: offset + r.start + r.quote.length, quote: r.quote } };
    });
    var trace = { offset: offset, length: text.length, tokens: a.tokens, stops: a.stops, skipped: a.skipped,
      sentences: a.sentences.map(function (s) { return { start: offset + s.start, end: offset + s.end, score: s.score, pick: !!s.pick, rel: !!s.rel, concept: s.concept ? titleOf[s.concept] : '', kind: s.kind || '' }; }),
      terms: a.terms.slice(0, 14),
      concepts: a.concepts.map(function (c, i) { return { title: outConcepts[i].title, count: c.count, weight: Math.round(c.weight * 10) / 10, type: c.type, isNew: !outConcepts[i].matchPageId,
        forms: c.zh ? [c.key] : c.phrase ? [c.key] : Object.keys(a.terms.filter(function (t) { return t.term === c.stem; }).reduce(function (o, t) { t.forms.forEach(function (f) { o[f] = 1; }); return o; }, {})) }; }),
      claims: a.claims.map(function (c) { return { s: c.s, page: titleOf[c.page], kind: c.kind, confidence: c.confidence, text: c.text }; }),
      relations: a.relations.map(function (r) { return { from: titleOf[r.from], to: titleOf[r.to], type: r.type, n: r.n, s: r.s }; }) };
    return { concepts: outConcepts, claims: outClaims, relations: outRelations, dropped: { concepts: 0, claims: 0, relations: 0, unverifiedQuotes: 0, unknownIds: 0 },
      model: 'local', usage: null, trace: trace };
  }

  // ---------------------------------------------------------------- answer: the claims closest to the question
  /* input: { question, pages: [{ id, title, type, summary, claims: [{ id, text, kind, origin, disputed }] }], decisions: [{ id, title, state, decision, why }] } */
  function answer(input) {
    input = input || {};
    var q = clip(input.question, 600);
    if (q.length < 2) throw new Error('先写下你的问题');
    var qs = readWords({ text: q }), qt = Object.keys(qs.terms);
    var pages = Array.isArray(input.pages) ? input.pages : [], decisions = Array.isArray(input.decisions) ? input.decisions : [];
    var items = [];
    pages.forEach(function (p) {
      (p.claims || []).forEach(function (c) { items.push({ kind: 'claim', id: c.id, pageId: p.id, title: p.title, text: String(c.text || ''), disputed: !!c.disputed, inferred: c.origin === 'ai_inferred' }); });
      if (p.summary) items.push({ kind: 'page', pageId: p.id, title: p.title, text: clip(p.summary, 300) });
    });
    decisions.forEach(function (d) { items.push({ kind: 'decision', id: d.id, title: d.title, text: clip('决策「' + d.title + '」' + (d.decision ? '：' + d.decision : '') + (d.why ? '（理由：' + d.why + '）' : ''), 500) }); });
    var df = {};
    items.forEach(function (it) { it.terms = readWords({ text: it.title + ' ' + it.text }).terms; Object.keys(it.terms).forEach(function (t) { df[t] = (df[t] || 0) + 1; }); });
    var found = {};
    items.forEach(function (it) {
      var hit = qt.filter(function (t) { return it.terms[t]; });
      hit.forEach(function (t) { found[t] = 1; });
      it.cover = qt.length ? hit.length / qt.length : 0;
      it.score = hit.reduce(function (n, t) { return n + Math.log(1 + items.length / df[t]); }, 0) * (it.kind === 'page' ? 0.6 : 1);
    });
    var ranked = items.filter(function (it) { return it.score > 0; }).sort(function (a, b) { return b.score - a.score; });
    var points = [], used = [];
    ranked.forEach(function (it) {
      if (points.length >= 5 || it.score < ranked[0].score * 0.34) return;
      var ts = Object.keys(it.terms);
      if (used.some(function (u) { return overlap(u, ts) >= 0.8; })) return;
      used.push(ts);
      points.push({ text: it.text + (it.disputed ? '（这条说法在知识库里有矛盾）' : '') + (it.inferred ? '（未核实的推断）' : ''),
        claimIds: it.kind === 'claim' ? [it.id] : [], pageIds: it.pageId ? [it.pageId] : [], decisionIds: it.kind === 'decision' ? [it.id] : [], grounded: true, cover: it.cover });
    });
    var top = ranked[0];
    var confidence = !top ? 'none' : top.cover >= 0.6 && top.kind !== 'page' ? 'high' : top.cover >= 0.3 ? 'medium' : 'low';
    var missing = qs.words.filter(function (w) { return !w.stop && !found[w.stem]; }).map(function (w) { return w.raw; }).filter(function (w, i, l) { return l.indexOf(w) === i; }).slice(0, 5);
    var usedPages = {}; points.forEach(function (p) { p.pageIds.forEach(function (id) { usedPages[id] = 1; }); delete p.cover; });
    // the points are the answer, word for word; the summary only says where they were found
    return { summary: top ? '找到 ' + points.length + ' 条相关的原话' + (top.title ? '，最相关的' + (top.kind === 'decision' ? '是决策' : '在') + '「' + top.title + '」' + (top.kind === 'decision' ? '' : '这一页') : '') + '。' : '知识库里找到了相关的页面，但没有哪一条说法直接回答这个问题。',
      points: points, confidence: confidence, grounded: points.length,
      gaps: missing.length ? ['知识库里没有提到：' + missing.join('、')] : [],
      followups: pages.filter(function (p) { return !usedPages[p.id]; }).concat(pages.filter(function (p) { return usedPages[p.id]; })).map(function (p) { return p.title; }).filter(function (t) { return norm(t) !== norm(q); }).slice(0, 3),
      suggestPage: '', dropped: { unknownIds: 0, points: 0 }, model: 'local', usage: null };
  }

  // ---------------------------------------------------------------- compose: a page body laid out from its claims
  /* input: { title, type, markdown, claims: [{ id, text, kind, origin, disputed }], pages: [{ id, title }] } */
  function compose(input) {
    input = input || {};
    var title = clip(input.title, 160);
    if (!title) throw new Error('这一页没有标题');
    var claims = (Array.isArray(input.claims) ? input.claims : []).filter(function (c) { return c && clip(c.text, 500); }).map(function (c) {
      return { id: c.id, text: clip(c.text, 500), kind: c.kind, inferred: c.origin === 'ai_inferred' || c.kind === 'inference', disputed: !!c.disputed };
    });
    if (!claims.length) throw new Error('这一页还没有说法可以用来写正文');
    var zh = claims.filter(function (c) { return CJK.test(c.text); }).length * 2 >= claims.length;
    var H = zh ? { def: '定义', fact: '要点', opinion: '观点', inf: '推断（未核实）', open: '待澄清：互相矛盾的说法' } : { def: 'Definition', fact: 'Key points', opinion: 'Views', inf: 'Inferences (unverified)', open: 'Open questions: claims that disagree' };
    var cur = String(input.markdown || '').replace(/\r\n?/g, '\n').trim();
    var intro = cur.split(/\n\s*\n|\n(?=#)/)[0].trim();
    if (/^#|^\s*[-*]\s/.test(intro)) intro = '';
    var leftOut = cur && cur !== intro ? '原来正文里第一段之后的内容没有保留；需要的话可以从版本历史里找回' : '';
    var lead = intro ? null : claims.filter(function (c) { return c.kind === 'definition' && !c.disputed; })[0] || claims.filter(function (c) { return !c.disputed && !c.inferred; })[0] || claims[0];
    if (lead) intro = lead.text;
    var introTerms = termsOf(intro);
    var rest = claims.filter(function (c) { return c !== lead && overlap(termsOf(c.text), introTerms) < 0.85; });
    var groups = [
      [H.open, rest.filter(function (c) { return c.disputed; })],
      [H.def, rest.filter(function (c) { return !c.disputed && !c.inferred && c.kind === 'definition'; })],
      [H.fact, rest.filter(function (c) { return !c.disputed && !c.inferred && c.kind !== 'definition' && c.kind !== 'opinion'; })],
      [H.opinion, rest.filter(function (c) { return !c.disputed && !c.inferred && c.kind === 'opinion'; })],
      [H.inf, rest.filter(function (c) { return !c.disputed && c.inferred; })]
    ];
    var order = [groups[1], groups[2], groups[3], groups[4], groups[0]].filter(function (g) { return g[1].length; });
    // other pages named in the text become [[links]], once each
    var others = (Array.isArray(input.pages) ? input.pages : []).map(function (p) { return clip(p && p.title, 120); })
      .filter(function (t) { return t && t.length >= 2 && norm(t) !== norm(title); }).sort(function (a, b) { return b.length - a.length; });
    var linked = {};
    function link(line) {
      var holds = [];
      others.forEach(function (t) {
        if (linked[t]) return;
        var re = CJK.test(t) ? new RegExp(escRe(t)) : new RegExp('\\b' + escRe(t).replace(/\s+/g, '\\s+') + '(?:s|es)?\\b', 'i');
        line = line.replace(re, function (m) { linked[t] = 1; holds.push(m === t ? '[[' + t + ']]' : '[[' + t + '|' + m + ']]'); return '\u0000' + (holds.length - 1) + '\u0000'; });
      });
      return line.replace(/\u0000(\d+)\u0000/g, function (x, i) { return holds[+i]; });
    }
    var out = [link(intro)];
    order.forEach(function (g) { out.push('', '## ' + g[0], ''); g[1].forEach(function (c) { out.push('- ' + link(c.text)); }); });
    return { markdown: out.join('\n').trim().slice(0, 12000), usedClaimIds: claims.map(function (c) { return c.id; }), unusedClaims: 0, leftOut: leftOut, unlinked: 0, model: 'local', usage: null };
  }

  /* The same call shape as the agent's HTTP transport, answered here. opts.onTrace(trace, body) gets each piece's steps. */
  function transport(opts) {
    opts = opts || {};
    return function (op, body) {
      try {
        var r = op === 'lk-extract' ? extract(body) : op === 'lk-ask' ? answer(body) : op === 'lk-compose' ? compose(body) : null;
        if (!r) throw new Error('本机引擎不支持：' + op);
        if (r.trace) { if (opts.onTrace) opts.onTrace(r.trace, body); delete r.trace; }
        return Promise.resolve(r);
      } catch (e) { return Promise.reject(e); }
    };
  }

  return { sentences: sentences, analyze: analyze, extract: extract, answer: answer, compose: compose, transport: transport, termsOf: termsOf };
});

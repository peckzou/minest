/* 53.830 · Minest GPT Study — study progress for the car flashcard panel (carflash.js uses it).
   GPT teaches in the official ChatGPT app; Minest shows the card (phone, Lock Screen, CarPlay widget) and keeps the record.
   The learner moves on: a card stays until Next — no timer.

   Progress lives in this page's localStorage ('minest.gptstudy.v1', where all Minest data lives), one record per list,
   keyed by the list ('b:<board>:<list>' or 't:<list>') and by stable card IDs, never by position:
     cards[cardId]  = { seen, seenAt, seenCount, learned, learnedAt }
       seen    — Minest made it the current card (phone / Live Activity / widget asked to show it). That is what the
                 system can confirm; whether anyone actually looked at it cannot be known, and is not claimed.
       learned — only when the learner says so (✓ Mark Learned). Explaining a word does not make it learned.
     rounds[]       = { n, start, passed: { cardId: time } } — a card is "passed" in a round when Next moves on from it.
                      Restart Round adds a round; earlier rounds and all history stay.
     current        = the card on show; history[] = the last 400 events (start / next / prev / widget / learned …).
   Resume: the current card again if it was not passed yet, else the first card after it (in today's list order, wrapping)
   that this round has not passed — so added cards are reached, deleted ones are ignored, reordering skips nothing.
   Next taps made on the CarPlay widget / Siri while the page is asleep come back as numbered events (native seq) and are
   applied once each.
   53.831: cards[cardId] also keeps  star (★ on the widget or the phone: "I want to study this more"),
   need = { pron, meaning } (from ChatGPT's MINEST REPORT: which words need pronunciation / meaning work) and gptAt;
   ★ Focus review walks the starred and the needs-work cards; duration(word) is how long a card stays in ⏱ Auto. */
(function(){'use strict';
if (window.MinestGPTStudy) return;
var KEY = 'minest.gptstudy.v1', HMAX = 400;

function load(){ try { var d = JSON.parse(localStorage.getItem(KEY) || 'null'); if (d && d.lists) return d; } catch(e){} return { version: 1, lists: {} }; }
function save(d){ try { localStorage.setItem(KEY, JSON.stringify(d)); return true; } catch(e){ return false; } }
function now(){ return Date.now(); }

/* one list's record; created on first use */
function rec(d, key, name){
  var L = d.lists[key];
  if (!L) L = d.lists[key] = { name: name || '', round: 1, rounds: [{ n: 1, start: now(), passed: {} }], cards: {}, current: null, last: 0, history: [], nativeSeq: 0, mode: 'continue' };
  if (name) L.name = name;
  return L;
}
function round(L){ var r = L.rounds[L.rounds.length - 1]; if (!r) { r = { n: 1, start: now(), passed: {} }; L.rounds.push(r); } return r; }
function log(L, ev, id){ L.history.push({ at: now(), ev: ev, id: id, round: L.round }); if (L.history.length > HMAX) L.history.splice(0, L.history.length - HMAX); L.last = now(); }

/* make `id` the current card; a card that is already current is not counted again */
function present(L, id, ev){
  if (!id) return;
  if (L.current === id) return;
  var c = L.cards[id] || (L.cards[id] = {});
  c.seen = 1; c.seenAt = now(); c.seenCount = (c.seenCount || 0) + 1;
  L.current = id;
  log(L, ev || 'show', id);
}

/* items = [{id, word}] in today's list order */
function posOf(items, id){ for (var i = 0; i < items.length; i++) if (items[i].id === id) return i; return -1; }
function nextUnpassed(L, items, fromId){
  var r = round(L), n = items.length, i0 = posOf(items, fromId);
  for (var k = 1; k <= n; k++) {   /* after the card, wrapping; from the top when the card is gone from the list */
    var it = items[i0 < 0 ? k - 1 : (i0 + k) % n];
    if (it.id !== fromId && !r.passed[it.id]) return it.id;
  }
  return null;
}
function focusOf(c){ return !!c && !c.learned && (c.star || (c.need && (c.need.pron || c.need.meaning))); }
function nextFocus(L, items, fromId){ var i0 = posOf(items, fromId); for (var i = i0 + 1; i < items.length; i++) if (focusOf(L.cards[items[i].id])) return items[i].id; return null; }
function nextSeen(L, items, fromId){
  var i0 = posOf(items, fromId);
  for (var i = i0 + 1; i < items.length; i++) { var c = L.cards[items[i].id]; if (c && c.seen) return items[i].id; }
  return null;
}
/* where Continue Study starts */
function resumeId(L, items){
  var r = round(L);
  if (L.current && posOf(items, L.current) >= 0 && !r.passed[L.current]) return L.current;
  return nextUnpassed(L, items, L.current);
}
/* the queue the native side (widget / Siri Next) walks: the current card, then what comes after it in this mode */
function queue(L, items, max){
  var out = [], id = L.current, r = round(L), guard = 0;
  if (!id) return out;
  out.push(id);
  if (L.mode === 'review') { while (out.length < max && (id = nextSeen(L, items, id))) out.push(id); return out; }
  if (L.mode === 'focus') { while (out.length < max && (id = nextFocus(L, items, id))) out.push(id); return out; }
  var seen = {}; seen[id] = 1;
  var i0 = posOf(items, id), n = items.length;
  for (var k = 1; k < n && out.length < max; k++) { var it = items[(i0 + k) % n]; if (!r.passed[it.id] && !seen[it.id]) { out.push(it.id); seen[it.id] = 1; } }
  return out;
}

function stats(L, items){
  var r = round(L), seen = 0, learned = 0, remaining = 0, starred = 0, pron = 0, meaning = 0, focus = 0;
  items.forEach(function(it){ var c = L.cards[it.id]; if (c && c.seen) seen++; if (c && c.learned) learned++; if (!r.passed[it.id]) remaining++;
    if (c && c.star) starred++; if (c && c.need && c.need.pron && !c.learned) pron++; if (c && c.need && c.need.meaning && !c.learned) meaning++; if (focusOf(c)) focus++; });
  return { total: items.length, seen: seen, learned: learned, remaining: remaining, starred: starred, pron: pron, meaning: meaning, focus: focus, round: L.round, last: L.last, position: L.current ? posOf(items, L.current) + 1 : 0 };
}

/* ---- actions (each returns the new current id, or null when the round / review is finished) ---- */
function act(key, name, items, what){
  var d = load(), L = rec(d, key, name), r = round(L), out = L.current;
  if (what === 'continue') { L.mode = 'continue'; out = resumeId(L, items); if (out) present(L, out, 'continue'); }
  else if (what === 'review') {
    L.mode = 'review';
    var first = null; for (var i = 0; i < items.length; i++) { var c = L.cards[items[i].id]; if (c && c.seen) { first = items[i].id; break; } }
    out = first; if (out) { L.current = null; present(L, out, 'review'); }
  }
  else if (what === 'focus') {
    L.mode = 'focus'; var f0 = null; for (var j = 0; j < items.length; j++) if (focusOf(L.cards[items[j].id])) { f0 = items[j].id; break; }
    out = f0; if (out) { L.current = null; present(L, out, 'focus'); }
  }
  else if (what === 'star') { if (L.current) { var cs = L.cards[L.current] || (L.cards[L.current] = {}); cs.star = cs.star ? 0 : 1; cs.starAt = now(); log(L, cs.star ? 'star' : 'unstar', L.current); } }
  else if (what === 'restart') { L.round += 1; L.rounds.push({ n: L.round, start: now(), passed: {} }); L.mode = 'continue'; log(L, 'restart', null); L.current = null; out = resumeId(L, items); if (out) present(L, out, 'continue'); }
  else if (what === 'next') {
    if (L.mode === 'review') { out = nextSeen(L, items, L.current); if (out) present(L, out, 'next'); }
    else if (L.mode === 'focus') { out = nextFocus(L, items, L.current); if (out) present(L, out, 'next'); }
    else { if (L.current) r.passed[L.current] = now(); out = nextUnpassed(L, items, L.current); if (out) present(L, out, 'next'); }
  }
  else if (what === 'prev') { var p = posOf(items, L.current); if (p > 0) { out = items[p - 1].id; present(L, out, 'prev'); } }
  else if (what === 'learned') { var cc = L.cards[L.current]; if (cc) { cc.learned = cc.learned ? 0 : 1; cc.learnedAt = cc.learned ? now() : null; log(L, cc.learned ? 'learned' : 'unlearned', L.current); } }
  save(d);
  return { id: out, L: L };
}

/* Next taps made on the widget / Siri (native seq) — applied once each, in order */
function applyNative(key, name, items, events, seq, gpt){   /* events: [seq, cardId, kind] — kind 'next' (default), 'star', 'unstar' */
  var d = load(), L = d.lists[key] || (gpt === false ? rec(d, key, name) : null); if (!L) return false;
  var done = false, from = L.nativeSeq || 0;
  (events || []).forEach(function(e){
    var n = +e[0], id = String(e[1]), kind = e[2] || 'next'; if (!(n > from)) return;
    if (kind === 'star' || kind === 'unstar') { if (posOf(items, id) >= 0) { var c = L.cards[id] || (L.cards[id] = {}); c.star = kind === 'star' ? 1 : 0; c.starAt = now(); log(L, kind, id); } }
    else if (gpt !== false) { if (L.mode !== 'review' && L.mode !== 'focus' && L.current) round(L).passed[L.current] = now(); if (posOf(items, id) >= 0) present(L, id, 'widget'); }
    from = n; done = true;
  });
  if (from !== L.nativeSeq) { L.nativeSeq = from; save(d); }
  return done;
}
function resetNativeSeq(key){ var d = load(); if (d.lists[key]) { d.lists[key].nativeSeq = 0; save(d); } }
function get(key){ return load().lists[key] || null; }

/* ---- Share Study Session (plain text for the official ChatGPT app) ---- */
function shareText(key, name, items, scope, batch, size){
  var L = get(key) || rec(load(), key, name), r = round(L), s = stats(L, items);
  var cur = L.current && posOf(items, L.current) >= 0 ? L.current : resumeId(L, items);
  var pool = scope === 'all' ? items.slice() : items.filter(function(it, i){ return !r.passed[it.id] && (posOf(items, cur) < 0 || i >= posOf(items, cur)); });
  if (scope !== 'all' && cur) { /* cards this round has not passed that sit before the current one come after it (wrapping) */
    var before = items.filter(function(it, i){ return !r.passed[it.id] && i < posOf(items, cur); }); pool = pool.concat(before);
  }
  size = size === 'all' ? Math.max(1, pool.length) : (size || 25); var pages = Math.max(1, Math.ceil(pool.length / size)); batch = Math.min(Math.max(1, batch || 1), pages);
  var part = pool.slice((batch - 1) * size, batch * size);
  var curItem = items[posOf(items, cur)], stars = items.filter(function(it){ var c = L.cards[it.id]; return c && c.star; }).map(function(it){ return it.word; });
  var lines = [
    'Minest GPT Study Session',
    'List: ' + (name || L.name),
    'Current Position: ' + (curItem ? posOf(items, cur) + 1 : 0) + ' / ' + items.length,
    'Current Word: ' + (curItem ? curItem.word : '—'),
    'Study Progress: Seen ' + s.seen + ' · Learned ' + s.learned + ' · Remaining this round ' + s.remaining + ' (round ' + L.round + ')',
    '',
    (scope === 'all' ? 'Word List' : 'Remaining Words') + (pages > 1 ? ' (part ' + batch + ' of ' + pages + ')' : '') + ':'
  ].concat(part.map(function(it){ return (posOf(items, it.id) + 1) + '. ' + it.word; })).concat([
    '',
    'How to help me (please follow this exactly):',
    '- You are my quiet study partner, not my teacher. I am driving: keep every reply very short — a few words.',
    '- Do not teach, explain, quiz me or give examples unless I ask. Do not talk between cards.',
    '- I read each card aloud. If I read it right, say nothing (or just "OK") and wait for me.',
    '- Only if I mispronounce or misread it: say the word slowly once, then let me try again.',
    '- If I ask (the meaning, a Chinese translation, an example, how to say it), answer in one short sentence, then stop.',
    '- Never move on by yourself. I move to the next card in Minest; I may say the next word or "Next".',
    '- Follow the original word order. Start with: ' + (curItem ? curItem.word : (part[0] ? part[0].word : '')) + '.',
    '- Quietly keep a record of every word: mastered (I read it right and did not need help), needs pronunciation (you',
    '  corrected how I said it), needs meaning (I asked what it means or used it wrongly). A word can be in two groups.',
    '- When I say "Minest report", reply with ONLY this block, words exactly as written in the list, nothing else:',
    'MINEST REPORT',
    'mastered: word; word',
    'pronunciation: word; word',
    'meaning: word; word'
  ].concat(stars.length ? ['', 'Words I starred to study more (pay a little more attention to them): ' + stars.join('; ')] : []));
  if (pages > 1 && batch < pages) lines.push('(When we finish these, I will share the next part from Minest.)');
  return { text: lines.join('\n'), batch: batch, pages: pages, count: part.length };
}

/* ---- ChatGPT's MINEST REPORT, pasted back: mastered → Learned; pronunciation / meaning → needs work (shown on the cards) ---- */
function norm(s){ return String(s || '').toLowerCase().replace(/^[\s\d.)#*-]+/, '').replace(/[“”"'’.,!?;:]+$/g, '').replace(/\s+/g, ' ').trim(); }
function importReport(key, name, items, text){
  var d = load(), L = rec(d, key, name), by = {}, out = { mastered: 0, pron: 0, meaning: 0, unknown: [] };
  items.forEach(function(it){ by[norm(it.word)] = it.id; });
  var body = String(text || ''), at = body.search(/minest\s+report/i); if (at >= 0) body = body.slice(at);
  body.split(/\n/).forEach(function(line){
    var m = line.match(/^\s*[*-]?\s*(mastered|learned|掌握|已掌握|pronunciation|pron|发音|meaning|意思|词义)\s*[:：]\s*(.*)$/i); if (!m) return;
    var kind = /^(mastered|learned|掌握|已掌握)$/i.test(m[1]) ? 'mastered' : /^(pronunciation|pron|发音)$/i.test(m[1]) ? 'pron' : 'meaning';
    m[2].split(/[;；,，]/).map(norm).filter(Boolean).forEach(function(w){
      if (/^(none|n\/a|—|-|无)$/.test(w)) return; var id = by[w]; if (!id) { if (out.unknown.indexOf(w) < 0) out.unknown.push(w); return; }
      var c = L.cards[id] || (L.cards[id] = {}); c.gptAt = now(); c.need = c.need || {};
      if (kind === 'mastered') { c.learned = 1; c.learnedAt = now(); c.need = {}; } else { c.need[kind] = 1; if (c.learned) { c.learned = 0; c.learnedAt = null; } }
      out[kind]++;
    });
  });
  if (out.mastered + out.pron + out.meaning) { log(L, 'gpt-report', null); save(d); }
  return out;
}
/* ⏱ Auto: how long a card stays — about the time to read it aloud at a normal pace (each English word ≈ 0.25 s + 0.045 s a
   letter, each Chinese character ≈ 0.28 s), + 2 s because the learner reads slower than normal, + the learner's own
   − / + (adj, seconds); never under 2 s */
function duration(word, adj){
  var w = String(word || ''), han = (w.match(/[㐀-鿿]/g) || []).length, latin = w.replace(/[㐀-鿿]/g, ' ').split(/\s+/).filter(function(x){ return /[A-Za-z0-9]/.test(x); });
  var read = latin.reduce(function(s, x){ return s + 0.25 + x.replace(/[^A-Za-z0-9]/g, '').length * 0.045; }, 0) + han * 0.28;
  return Math.round(Math.max(2, Math.max(0.6, read) + 2 + (+adj || 0)) * 10) / 10;
}
function tags(key, items){ var L = get(key); return items.map(function(it){ var c = L && L.cards[it.id]; return c ? [c.need && c.need.pron && !c.learned ? 'pron' : '', c.need && c.need.meaning && !c.learned ? 'meaning' : ''].filter(Boolean).join(' ') : ''; }); }
function starred(key){ var L = get(key); return L ? Object.keys(L.cards).filter(function(id){ return L.cards[id].star; }) : []; }

window.MinestGPTStudy = { importReport: importReport, duration: duration, tags: tags, starred: starred, act: act, stats: function(key, name, items){ var L = get(key) || rec(load(), key, name); return stats(L, items); }, get: get, queue: function(key, items, max){ var L = get(key); return L ? queue(L, items, max || 300) : []; },
  applyNative: applyNative, resetNativeSeq: resetNativeSeq, shareText: shareText, posOf: posOf, version: '53.831' };
})();

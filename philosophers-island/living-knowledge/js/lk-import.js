/* Minest Living Knowledge · M2 — bringing raw material in (window.MinestLKImport; also a Node module for the tests).
   What can come in (no AI, no server, nothing fetched from the web):
     · a file: .txt (note), .md / .markdown (markdown; a page exported by Living Knowledge itself comes back as that page),
       .html / .htm (web: the readable text of the page, its title and its address)
     · pasted text, with an optional title and address (pasted HTML is read like an .html file)
     · Minest cards (title, description, checklist, stacked cards), read from the boards on this device
   Every piece becomes one Source: id = src_ + sha256 of its normalized text, so the same material imported again — today,
   next week, from another device — is recognised and never stored twice. A changed version of the same web address or the
   same card is a new Source that names the one it follows ("supersedes"); the old one is never changed.
   A page that comes back from a Markdown export is added only if it is not there yet; an existing page is never overwritten. */
(function (root, factory) {
  var M = (typeof module === 'object' && module.exports) ? require('./lk-model.js') : root.MinestLKModel;
  var I = factory(M);
  if (typeof module === 'object' && module.exports) module.exports = I; else root.MinestLKImport = I;
})(typeof window !== 'undefined' ? window : this, function (M) {
  'use strict';

  var MAX_TEXT_BYTES = 800000;
  var ENT = { amp: '&', lt: '<', gt: '>', quot: '"', apos: "'", nbsp: ' ', ndash: '–', mdash: '—', hellip: '…', lsquo: '‘', rsquo: '’', ldquo: '“', rdquo: '”', middot: '·', copy: '©', reg: '®', trade: '™', laquo: '«', raquo: '»', bull: '•', times: '×', deg: '°' };
  function decode(s) {
    return String(s).replace(/&(#x[0-9a-f]+|#\d+|[a-z]+);/gi, function (all, e) {
      if (e[0] === '#') { var n = e[1] === 'x' || e[1] === 'X' ? parseInt(e.slice(2), 16) : parseInt(e.slice(1), 10); try { return n > 0 && n < 0x110000 ? String.fromCodePoint(n) : all; } catch (x) { return all; } }
      var v = ENT[e.toLowerCase()]; return v != null ? v : all;
    });
  }
  function attr(tag, name) { var m = new RegExp('\\b' + name + '\\s*=\\s*("([^"]*)"|\'([^\']*)\'|([^\\s>]+))', 'i').exec(tag); return m ? decode(m[2] || m[3] || m[4] || '') : ''; }

  // the readable text of a web page: headings as "#", list items as "-", one block per paragraph; scripts, styles,
  // navigation, headers, footers and asides left out; the <article> or <main> when the page has one
  function htmlToText(html) {
    html = String(html || '');
    var title = '', url = '', m;
    if ((m = /<title[^>]*>([\s\S]*?)<\/title>/i.exec(html))) title = decode(m[1].replace(/<[^>]+>/g, '')).replace(/\s+/g, ' ').trim();
    var metas = html.match(/<(meta|link)\b[^>]*>/gi) || [];
    metas.forEach(function (t) {
      if (!url && /^<link/i.test(t) && /\brel\s*=\s*["']?canonical/i.test(t)) url = attr(t, 'href');
      if (!url && /property\s*=\s*["']og:url/i.test(t)) url = attr(t, 'content');
      if (!title && /property\s*=\s*["']og:title/i.test(t)) title = attr(t, 'content');
    });
    var body = html.replace(/<!--[\s\S]*?-->/g, '')
      .replace(/<(script|style|noscript|svg|template|iframe|head|nav|footer|aside|form|button|select)\b[\s\S]*?<\/\1\s*>/gi, ' ');
    var main = /<article\b[\s\S]*?<\/article\s*>/i.exec(body) || /<main\b[\s\S]*?<\/main\s*>/i.exec(body);
    if (main && main[0].replace(/<[^>]+>/g, '').trim().length > 200) body = main[0];
    else body = body.replace(/<header\b[\s\S]*?<\/header\s*>/gi, ' ');
    var text = body
      .replace(/<pre\b[^>]*>([\s\S]*?)<\/pre\s*>/gi, function (a, c) { return '\n\n```\n' + c.replace(/<[^>]+>/g, '') + '\n```\n\n'; })
      .replace(/<h([1-6])\b[^>]*>([\s\S]*?)<\/h\1\s*>/gi, function (a, n, c) { return '\n\n' + '######'.slice(0, +n) + ' ' + c.replace(/<[^>]+>/g, ' ').replace(/\s+/g, ' ').trim() + '\n\n'; })
      .replace(/<li\b[^>]*>/gi, '\n- ')
      .replace(/<br\s*\/?>/gi, '\n')
      .replace(/<\/(p|div|section|ul|ol|blockquote|tr|table|dl|dd|dt|figure|figcaption|article|main|header)\s*>/gi, '\n\n')
      .replace(/<(td|th)\b[^>]*>/gi, ' | ')
      .replace(/<[^>]+>/g, '');
    text = decode(text).replace(/[ \t\u00a0]+/g, ' ').replace(/ *\n */g, '\n').replace(/\n- *\n/g, '\n').replace(/\n{3,}/g, '\n\n').trim();
    return { title: title, url: url, text: text };
  }

  function ext(name) { var m = /\.([a-z0-9]+)$/i.exec(String(name || '')); return m ? m[1].toLowerCase() : ''; }
  function looksHtml(s) { return /^\s*(<!doctype html|<html[\s>])/i.test(s) || /<(body|article|p|div)\b[^>]*>[\s\S]*<\/(body|article|p|div)>/i.test(String(s).slice(0, 20000)); }
  function firstHeading(md) { var m = /^#{1,3}\s+(.+)$/m.exec(md); return m ? m[1].trim() : ''; }
  function baseName(name) { return String(name || '').replace(/\.[a-z0-9]+$/i, '').trim(); }
  function firstLine(t) { return String(t || '').split('\n').map(function (x) { return x.replace(/^#+\s*/, '').trim(); }).filter(Boolean)[0] || ''; }

  /* one input → { kind, title, text, origin, page? } or { error }
     input: { name, content } (a file's text) · { text, title?, url? } (pasted) · { card } (from cardsToInputs) */
  function prepare(input) {
    input = input || {};
    if (input.prepared) return input.prepared;
    var name = input.name || '', e = ext(name), content = input.content != null ? String(input.content) : String(input.text || '');
    var out = { kind: 'note', title: '', text: '', origin: {} };
    if (name) out.origin.fileName = String(name).slice(0, 200);
    if (input.url) out.origin.url = String(input.url).trim().slice(0, 2000);
    if (e === 'html' || e === 'htm' || (!/^(md|markdown|txt)$/.test(e) && looksHtml(content))) {
      var h = htmlToText(content);
      out.kind = 'web'; out.title = h.title; out.text = h.text;
      if (h.url && !out.origin.url) out.origin.url = h.url;
    } else if (e === 'md' || e === 'markdown') {
      var p = M.parseMarkdown(content), mid = typeof p.meta.id === 'string' ? p.meta.id : '';
      // the export's own index and log are not material
      if (/^# (Minest Living Knowledge|修改记录 Log)\n/.test(p.body.replace(/^\s+/, '')) && !mid) return { skip: true, error: name + '：导出时生成的目录 / 记录，不需要导入' };
      // a page that Living Knowledge exported comes back as that page — not as a new source
      if (/^pg_/.test(mid) && p.meta.title) {
        var body = p.body.replace(/^\s*#\s+.*\n+/, '');
        var cut = body.search(/\n## (关键说法 Claims|来源 Sources)\n/);
        if (cut >= 0) body = body.slice(0, cut);
        return { pageOnly: true, title: String(p.meta.title), page: { id: mid, title: String(p.meta.title), type: M.PAGE_TYPES.indexOf(p.meta.type) >= 0 ? p.meta.type : 'note',
          tags: Array.isArray(p.meta.tags) ? p.meta.tags.map(String) : [], aliases: Array.isArray(p.meta.aliases) ? p.meta.aliases.map(String) : [],
          sourceIds: Array.isArray(p.meta.sources) ? p.meta.sources.filter(function (s) { return /^src_/.test(s); }) : [], markdown: body.trim() } };
      }
      // a source that Living Knowledge exported comes back as that same source (same text → same id)
      if (/^src_/.test(mid) && M.SOURCE_KINDS.indexOf(p.meta.kind) >= 0) {
        out.kind = p.meta.kind; out.title = String(p.meta.title || ''); out.text = p.body.replace(/^\s*#\s+.*\n+/, '');
        if (typeof p.meta.url === 'string') out.origin.url = p.meta.url;
        delete out.origin.fileName;
        if (typeof p.meta.file === 'string') out.origin.fileName = p.meta.file;
      } else {
        out.kind = 'markdown'; out.text = content; out.title = (typeof p.meta.title === 'string' && p.meta.title) || firstHeading(p.body);
      }
    } else {
      out.kind = 'note'; out.text = content;
    }
    if (input.title) out.title = String(input.title).trim();
    out.title = (out.title || baseName(name) || firstLine(out.text) || '未命名来源').slice(0, 200);
    out.text = M.normalizeText(out.text);
    if (!out.text) return { error: (name || out.title) + '：没有可读的文字' };
    if (M.byteSize(out.text) > MAX_TEXT_BYTES) return { error: (name || out.title) + '：文字超过 800 KB，现在还不能导入（以后会分块保存）' };
    if (!out.origin.fileName) delete out.origin.fileName;
    return out;
  }

  // Minest boards → one input per card: the card's own words; where it lives is kept as its origin
  function cardText(c) {
    var parts = ['# ' + String(c.title || '').trim()];
    var d = c.description || c.desc || c.notes || '';
    if (d) parts.push(String(d).trim());
    (c.checklists || []).forEach(function (cl) { var items = (cl.items || []).map(function (i) { return '- [' + (i.done || i.complete || i.checked ? 'x' : ' ') + '] ' + (i.text || i.title || ''); }); if (items.length) parts.push((cl.title ? '**' + cl.title + '**\n' : '') + items.join('\n')); });
    (c.checklist || []).forEach(function (i) { parts.push('- [' + (i.done || i.complete || i.checked ? 'x' : ' ') + '] ' + (i.text || i.title || '')); });
    var st = (c.stack || []).filter(function (s) { return s && s.title; });
    if (st.length) parts.push(st.map(function (s) { return '- ' + s.title + (s.description ? '：' + String(s.description).replace(/\s+/g, ' ').slice(0, 300) : ''); }).join('\n'));
    return parts.join('\n\n');
  }
  function listCards(boards) {
    var out = [];
    (boards || []).forEach(function (b) {
      if (!b || !b.id) return;
      (b.columns || []).forEach(function (col) {
        (col.cards || []).forEach(function (c) {
          if (!c || !c.id || !c.title) return;
          out.push({ bid: b.id, board: b.title || '', listId: col.id, list: col.title || '', cardId: c.id, title: String(c.title), card: c });
        });
      });
    });
    return out;
  }
  function cardInput(x) {
    return { prepared: (function () {
      var text = M.normalizeText(cardText(x.card));
      if (M.byteSize(text) > MAX_TEXT_BYTES) return { error: x.title + '：卡片文字超过 800 KB' };
      return { kind: 'card', title: x.title.slice(0, 200), text: text, origin: { cardRef: { bid: x.bid, listId: x.listId, cardId: x.cardId }, board: x.board, list: x.list } };
    })() };
  }

  function sameOrigin(a, b) {
    if (!a || !b) return false;
    if (a.url && b.url) return a.url.replace(/[#?].*$/, '').replace(/\/$/, '') === b.url.replace(/[#?].*$/, '').replace(/\/$/, '');
    if (a.cardRef && b.cardRef) return a.cardRef.cardId === b.cardRef.cardId && a.cardRef.bid === b.cardRef.bid;
    return false;
  }

  /* inputs → stored Sources (and returning exported pages); one at a time, so two copies in one batch are found too.
     → { added: [source], duplicates: [{ source, as }], pages: [{ page, status: 'added'|'unchanged'|'kept' }], errors: [text] } */
  function importAll(store, inputs, opts) {
    opts = opts || {};
    var report = { added: [], duplicates: [], pages: [], errors: [] };
    return (inputs || []).reduce(function (p, input) {
      return p.then(function () {
        var x = prepare(input);
        if (x.skip) { report.skipped = (report.skipped || []).concat([x.error]); return; }
        if (x.error) { report.errors.push(x.error); return; }
        if (x.pageOnly) return restorePage(x.page);
        return M.sha256Hex(x.text).then(function (h) {
          var id = 'src_' + h.slice(0, 20);
          return store.get('source', id).then(function (existing) {
            if (existing) { report.duplicates.push({ source: existing, as: x.title }); return existing; }
            return store.list('source').then(function (all) {
              var prev = all.filter(function (s) { return sameOrigin(s.origin, x.origin); }).sort(function (a, b) { return (b.createdAt || 0) - (a.createdAt || 0); })[0];
              var doc = { id: id, kind: x.kind, title: x.title, text: x.text, contentHash: h, origin: x.origin, importedVia: opts.via || 'import' };
              if (prev) doc.supersedes = prev.id;
              return store.put('source', doc, { baseRev: 0, reason: '导入' + (prev ? '（' + (prev.title || prev.id) + ' 的新版本）' : '') }).then(function (r) {
                if (!r.ok) { report.errors.push(x.title + '：' + r.error); return null; }
                if (r.noop) report.duplicates.push({ source: r.doc, as: x.title }); else report.added.push(r.doc);
                return r.doc;
              });
            });
          });
        });
      });
    }, Promise.resolve()).then(function () { return report; });

    function restorePage(pg) {
      return store.get('page', pg.id).then(function (cur) {
        if (cur) {
          var same = String(cur.markdown || '').trim() === pg.markdown && cur.title === pg.title;
          report.pages.push({ page: cur, status: same ? 'unchanged' : 'kept' });      // never overwritten
          return;
        }
        return store.put('page', Object.assign({}, pg, { claims: [] }), { baseRev: 0, reason: '从 Markdown 导入' }).then(function (r) {
          if (r.ok) report.pages.push({ page: r.doc, status: 'added' }); else report.errors.push(pg.title + '：' + r.error);
        });
      });
    }
  }

  // a first page from one source, written by the user (M3 will let the AI do the extracting)
  function pageDraftFromSource(src) {
    var text = String(src.text || '');
    if (src.kind === 'markdown') text = M.parseMarkdown(text).body.replace(/^\s*#\s+.*\n+/, '');
    else if (src.kind === 'card') text = text.replace(/^#\s+.*\n+/, '');
    return { title: src.title || '', type: 'note', markdown: text.trim(), sourceIds: [src.id] };
  }

  return { MAX_TEXT_BYTES: MAX_TEXT_BYTES, htmlToText: htmlToText, prepare: prepare, cardText: cardText, listCards: listCards, cardInput: cardInput,
    sameOrigin: sameOrigin, importAll: importAll, pageDraftFromSource: pageDraftFromSource };
});

/* Minest · Wikipedia → knowledge map (window.MinestWikiMap) — data only; Holo Lab's 知识星图 draws it.
   A first look at a concept: its Wikipedia article sorted into a bubble map — the concept in the middle, each part
   of the article (Definition, History, Etymology …) as a cluster, and the ideas each part links to most as stars.
   Source: the public MediaWiki API (no key, CORS via origin=*). A map is kept 7 days in this browser
   (minest.wiki.v2:*) — a local cache, not sync. Text is Wikipedia's (CC BY-SA 4.0); the views link back to it. */
(function () {
  'use strict';
  var root = typeof window !== 'undefined' ? window : globalThis;

  // ---------------------------------------------------------------- pure helpers (tested in node)
  var SKIP = /^(参见|參見|参看|參看|参考文献|參考文獻|参考资料|參考資料|参考来源|參考來源|参考|參考|注释|註釋|注解|脚注|腳註|外部链接|外部連結|延伸阅读|延伸閱讀|扩展阅读|擴展閱讀|来源|來源|引用|相关条目|相關條目|书目|書目|see also|references|notes|external links|further reading|bibliography|sources|citations|footnotes|notes and references|works cited)$/i;
  var SEE = /^(参见|參見|参看|參看|相关条目|相關條目|see also)$/i;
  var PAL = ['#5ee7ff', '#a78bfa', '#f472b6', '#34d399', '#fbbf24', '#60a5fa', '#fb923c', '#2dd4bf'];   // one colour per part of the article

  function isZh(s) { return /[㐀-鿿]/.test(s || ''); }
  function cleanQuery(q) {
    q = String(q || '').trim().replace(/[？?！!。．.\s]+$/, '');
    q = q.replace(/^(请问|請問)?\s*(什么是|什麼是|何谓|何謂|何为|何為|啥是|谈谈|談談|关于|關於)\s*/, '').replace(/\s*(是什么|是什麼|是啥|的意思|的定义|的定義|是什么意思|吗|嗎|呢)$/, '');
    q = q.replace(/^(what\s+(is|are|was|were)|who\s+(is|was)|define|definition of|meaning of|tell me about)\s+/i, '').replace(/^(a|an|the)\s+/i, '');
    return q.trim();
  }
  function sentences(text, n, max) {
    text = String(text || '').replace(/\[\s*(\d+|注\s*\d+|note\s*\d+|來源請求|来源请求|citation needed|[a-z])\s*\]/gi, '').replace(/\s+/g, ' ').trim();
    if (!text) return '';
    var parts = text.replace(/([。！？])/g, '$1\u0001').replace(/([.!?])\s+(?=[A-Z"“(㐀-鿿])/g, '$1\u0001').split('\u0001').map(function (s) { return s.trim(); }).filter(Boolean);
    var out = parts.slice(0, n || 2).join(isZh(text) ? '' : ' ');
    if (max && out.length > max) out = out.slice(0, max - 1).replace(/[\s,，、;；]+$/, '') + '…';
    return out;
  }
  // ---------------------------------------------------------------- Wikipedia
  function api(lang, p) {
    p.format = 'json'; p.formatversion = '2'; p.origin = '*'; if (lang === 'zh') p.variant = 'zh-cn';
    var qs = Object.keys(p).map(function (k) { return k + '=' + encodeURIComponent(p[k]); }).join('&');
    return fetch('https://' + lang + '.wikipedia.org/w/api.php?' + qs).then(function (r) { if (!r.ok) throw new Error('HTTP ' + r.status); return r.json(); });
  }
  function parsePage(lang, title) {
    return api(lang, { action: 'parse', page: title, prop: 'text|langlinks|properties', redirects: 1, disableeditsection: 1, disabletoc: 1 })
      .then(function (j) { if (j.error) { var e = new Error(j.error.info); e.code = j.error.code; throw e; } return j.parse; });
  }
  function search(lang, q) {
    return api(lang, { action: 'query', list: 'search', srsearch: q, srlimit: 1, srprop: '' })
      .then(function (j) { var h = j.query && j.query.search && j.query.search[0]; if (!h) { var e = new Error('No article found'); e.code = 'notfound'; throw e; } return h.title; });
  }
  function toMap(lang, p) {
    var doc = new DOMParser().parseFromString('<div>' + p.text + '</div>', 'text/html'), out = doc.querySelector('.mw-parser-output') || doc.body.firstChild;
    out.querySelectorAll('style,link,sup,table,figure,math,.hatnote,.sidebar,.navbox,.infobox,.side-box,.mw-empty-elt,.mw-editsection,.reference,.metadata,.thumb,.gallery,.noprint,.mwe-math-element,.shortdescription').forEach(function (e) { e.remove(); });
    // a short article (fewer than 5 real sections) is split at its sub-headings too, so each part gets its own cluster
    function lvl(el) { var m = el.className && String(el.className).match(/mw-heading([2-6])/); if (m) return +m[1]; m = el.tagName.match(/^H([2-6])$/); return m ? +m[1] : 0; }
    var kids = [].slice.call(out.children), h2 = kids.filter(function (el) { return lvl(el) === 2 && !SKIP.test(el.textContent.trim()); }).length, split = h2 < 5 ? 3 : 2;
    var secs = [{ name: '', els: [] }], under = false;
    kids.forEach(function (el) {
      var L = lvl(el), h = L ? (el.querySelector('h2,h3,h4,h5,h6') || el) : null;
      if (L === 2) under = SKIP.test(h.textContent.trim()) && !SEE.test(h.textContent.trim());
      if (L && L <= split && !(L > 2 && under)) secs.push({ name: h.textContent.trim(), id: h.id || '', els: [] });
      else if (!L || L > split) secs[secs.length - 1].els.push(el);
    });
    var self = p.title, used = {}; used[self] = 1;
    function text(els) { return els.filter(function (e) { return e.tagName === 'P'; }).map(function (e) { return e.textContent; }).join(' '); }
    function linksOf(els, max, onlyLists) {
      var c = {}, order = [];
      els.forEach(function (e) {
        if (e.classList && e.classList.contains('mw-heading')) return;
        if (onlyLists && !/^(UL|OL|DIV|DL)$/.test(e.tagName)) return;
        e.querySelectorAll('a[href]').forEach(function (a) {
          var m = a.getAttribute('href').match(/^\/(?:wiki|zh(?:-[a-z]+)?)\/([^#?]+)/); if (!m || a.classList.contains('new')) return;
          var t = (a.getAttribute('title') || decodeURIComponent(m[1]).replace(/_/g, ' ')).trim();
          if (!t || /:/.test(t) || used[t] || /^\d+年?$/.test(t)) return;
          var lb = a.textContent.trim(); if (!lb || lb.length > 16 || /^\d+$/.test(lb)) lb = t;
          if (!c[t]) { c[t] = { title: t, label: lb, n: 0, i: order.length }; order.push(t); }
          c[t].n++;
        });
      });
      var top = order.map(function (t) { return c[t]; }).sort(function (a, b) { return b.n - a.n || a.i - b.i; }).slice(0, max);
      top.forEach(function (x) { used[x.title] = 1; });
      return top.map(function (x) { return { title: x.title, label: x.label }; });
    }
    var intro = secs[0], zh = lang === 'zh', lim = zh ? 150 : 300;
    var map = { lang: lang, title: p.title, def: sentences(text(intro.els), 2, zh ? 180 : 360), aspects: [], langlinks: {}, url: 'https://' + lang + '.wikipedia.org/wiki/' + encodeURIComponent(p.title.replace(/ /g, '_')), disamb: !!(p.properties && (p.properties.disambiguation != null || (p.properties.some && p.properties.some(function (x) { return x.name === 'disambiguation'; })))), at: Date.now() };
    (p.langlinks || []).forEach(function (l) { map.langlinks[l.lang] = l.title; });
    function introRest() { var t = text(intro.els), all = sentences(t, 8, 0), two = sentences(t, 2, 0); return all.indexOf(two) === 0 ? sentences(all.slice(two.length), 2, lim) : ''; }   // the intro after the definition
    var overview = linksOf(intro.els, 5);
    if (overview.length >= 2) map.aspects.push({ name: zh ? '概述' : 'Overview', id: '', gist: introRest(), links: overview });
    var see = null;
    secs.slice(1).forEach(function (s) {
      if (SEE.test(s.name)) { see = s; return; }
      if (SKIP.test(s.name)) return;
      var a = { name: s.name, id: s.id, gist: sentences(text(s.els), 2, lim), links: linksOf(s.els, 5) };
      if (a.gist || a.links.length) map.aspects.push(a);
    });
    map.aspects = map.aspects.slice(0, see ? 7 : 8);
    if (see) { var sl = linksOf(see.els, 6, true); if (sl.length) map.aspects.push({ name: see.name, id: see.id, gist: '', links: sl, see: true }); }
    return map;
  }
  var CK = 'minest.wiki.v2:', DAY = 864e5;
  function cacheGet(k) { try { var v = JSON.parse(localStorage.getItem(CK + k) || 'null'); return v && Date.now() - v.at < 7 * DAY ? v : null; } catch (e) { return null; } }
  function cachePut(k, v) {
    try {
      localStorage.setItem(CK + k, JSON.stringify(v));
      var keys = []; for (var i = 0; i < localStorage.length; i++) { var x = localStorage.key(i); if (x.indexOf(CK) === 0) keys.push(x); }
      if (keys.length > 40) keys.map(function (x) { var o; try { o = JSON.parse(localStorage.getItem(x)); } catch (e) {} return [x, o && o.at || 0]; }).sort(function (a, b) { return a[1] - b[1]; }).slice(0, keys.length - 40).forEach(function (x) { localStorage.removeItem(x[0]); });
    } catch (e) {}
  }
  function fetchMap(lang, q) {
    var key = lang + ':' + q, hit = cacheGet(key); if (hit) return Promise.resolve(hit);
    return parsePage(lang, q).catch(function (e) { if (e.code === 'missingtitle' || e.code === 'invalidtitle') return search(lang, q).then(function (t) { return parsePage(lang, t); }); throw e; })
      .then(function (p) { var m = toMap(lang, p); cachePut(key, m); if (m.title !== q) cachePut(lang + ':' + m.title, m); return m; });
  }
  var sumCache = {};
  function summary(lang, title) {
    var k = lang + ':' + title; if (sumCache[k]) return sumCache[k];
    return (sumCache[k] = api(lang, { action: 'query', prop: 'extracts', exintro: 1, explaintext: 1, exsentences: 3, titles: title, redirects: 1 }).then(function (j) {
      var pg = j.query && j.query.pages && j.query.pages[0]; if (!pg || pg.missing) throw new Error('missing');
      return { title: pg.title, text: sentences(pg.extract, 3, lang === 'zh' ? 170 : 340) };
    }).catch(function (e) { delete sumCache[k]; throw e; }));
  }

  function load(topic, lang) { var q = cleanQuery(topic) || String(topic || '').trim(); lang = lang === 'zh' || lang === 'en' ? lang : (isZh(q) ? 'zh' : 'en'); return fetchMap(lang, q); }
  function url(lang, title, anchor) { return 'https://' + lang + '.wikipedia.org/wiki/' + encodeURIComponent(String(title).replace(/ /g, '_')) + (anchor ? '#' + encodeURIComponent(anchor) : ''); }
  var API = { load: load, summary: summary, url: url, toMap: toMap, cleanQuery: cleanQuery, sentences: sentences, isZh: isZh, PAL: PAL, SKIP: SKIP };
  root.MinestWikiMap = API;
  if (typeof module === 'object' && module.exports) module.exports = API;
})();

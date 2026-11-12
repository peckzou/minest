/* My World in English — a display layer over My World's own UI (the console, the 2D island, the voxel world, Santorini,
   the walk-in, the Dollhouse and display views, the Type Workshop entrance). Chinese UI text and hints (title, aria-label,
   placeholder) are shown in English as they appear; the code underneath is untouched (some strings are also keys).
   A text is replaced only when ALL of its Chinese is known UI wording — anything else (your own card titles, notes,
   board names) is left exactly as written. window.MinestWorldEN.missing() lists UI text not translated yet. */
(function () {
  if (window.MinestWorldEN) return;
  var D = __MW_EN_DICT__;
  var CJK = /[㐀-鿿]/;
  var keys = Object.keys(D).filter(function (k) { return CJK.test(k); }).sort(function (a, b) { return b.length - a.length; });
  if (!keys.length) return;
  var RE = new RegExp(keys.map(function (k) { return k.replace(/[.*+?^${}()|[\]\\]/g, '\\$&'); }).join('|'), 'g');
  var ROOTS = 'aside.wf, #vx62, .mn-dsp, .uv, #oia-root, .mn-walk, .mn-mtw, .mn-mtw-chip, .mn-nsp, .mn-bv, .mn-pv, .mn-world-3d-overlay, .wf-venice, .world-picker, .mn-blank-setup';
  var ATTRS = ['title', 'aria-label', 'placeholder'];
  var missing = new Set();
  function tr(s) {
    if (!s || !CJK.test(s)) return null;
    var out = s.replace(RE, function (m, off, all) {
      var en = D[m], prev = all.charAt(off - 1), next = all.charAt(off + m.length);
      if (en && /[0-9A-Za-z)\]]/.test(prev) && /^[A-Za-z0-9(]/.test(en)) en = ' ' + en;   // "共3个" → "3 rooms", not "3rooms"
      if (en && /[0-9A-Za-z(]/.test(next) && /[A-Za-z0-9)]$/.test(en)) en = en + ' ';
      return en;
    });
    if (CJK.test(out)) { if (missing.size < 400) missing.add(s.trim().slice(0, 80)); return null; }   // not all UI wording: leave it
    return out.replace(/ {2,}/g, ' ');
  }
  function skip(el) { return !el || el.closest('input, textarea, select, [contenteditable=""], [contenteditable="true"], .mn-en-keep'); }
  function doText(n) { var p = n.parentElement; if (!p || /^(SCRIPT|STYLE)$/.test(p.tagName) || skip(p) || !p.closest(ROOTS)) return; var t = tr(n.nodeValue); if (t !== null && t !== n.nodeValue) n.nodeValue = t; }
  function doAttrs(el) { if (!el.closest || skip(el) || !el.closest(ROOTS)) return; ATTRS.forEach(function (a) { var v = el.getAttribute && el.getAttribute(a); if (v && CJK.test(v)) { var t = tr(v); if (t !== null) el.setAttribute(a, t); } }); }
  function walk(root) {
    if (!root) return;
    if (root.nodeType === 3) return doText(root);
    if (root.nodeType !== 1) return;
    doAttrs(root);
    var w = document.createTreeWalker(root, 5, null), n;   // elements + text
    while ((n = w.nextNode())) { if (n.nodeType === 3) { if (CJK.test(n.nodeValue)) doText(n); } else { doAttrs(n); if (n.tagName === 'IFRAME') hookFrame(n); } }
    if (root.tagName === 'IFRAME') hookFrame(root);
  }
  var queued = new Set(), raf = 0;
  function flush() { raf = 0; var q = Array.from(queued); queued.clear(); q.forEach(function (n) { if (n.isConnected) walk(n); }); }
  function q(n) { queued.add(n); if (!raf) raf = requestAnimationFrame(flush); }
  var mo = new MutationObserver(function (list) {
    for (var i = 0; i < list.length; i++) {
      var r = list[i];
      if (r.type === 'childList') { for (var j = 0; j < r.addedNodes.length; j++) { var a = r.addedNodes[j]; if (a.nodeType === 3 ? CJK.test(a.nodeValue) : a.nodeType === 1) q(a); } }
      else if (r.type === 'characterData') { if (CJK.test(r.target.nodeValue)) q(r.target); }
      else if (r.type === 'attributes') { var v = r.target.getAttribute(r.attributeName); if (v && CJK.test(v)) q(r.target); }
    }
  });
  /* the standalone 3D worlds (Venice, Hobbiton, the Alps …) open as same-origin pages in an iframe inside My World:
     the whole page is world UI, so all of it is shown in English, and kept so as it changes */
  var frames = new WeakSet();
  function frameDoc(fr) { try { return fr.contentDocument; } catch (e) { return null; } }
  function inFrame(doc) {
    if (!doc || !doc.body || frames.has(doc)) return; frames.add(doc);
    var each = function (root) {
      if (!root) return;
      if (root.nodeType === 3) { var t = tr(root.nodeValue); if (t !== null && t !== root.nodeValue) root.nodeValue = t; return; }
      if (root.nodeType !== 1) return;
      var w = doc.createTreeWalker(root, 5, null), n = root;
      do {
        if (n.nodeType === 3) { var pe = n.parentElement; if (pe && /^(SCRIPT|STYLE|TEXTAREA)$/.test(pe.tagName)) continue; if (CJK.test(n.nodeValue)) { var t2 = tr(n.nodeValue); if (t2 !== null) n.nodeValue = t2; } }
        else if (!(n.closest && n.closest('input, textarea, [contenteditable="true"]'))) ATTRS.forEach(function (a) { var v = n.getAttribute && n.getAttribute(a); if (v && CJK.test(v)) { var t3 = tr(v); if (t3 !== null) n.setAttribute(a, t3); } });
      } while ((n = w.nextNode()));
    };
    each(doc.body); if (doc.title && CJK.test(doc.title)) { var tt = tr(doc.title); if (tt !== null) doc.title = tt; }
    new MutationObserver(function (list) { list.forEach(function (r) {
      if (r.type === 'childList') r.addedNodes.forEach(each); else if (r.type === 'characterData') each(r.target); else each(r.target);
    }); }).observe(doc.body, { subtree: true, childList: true, characterData: true, attributes: true, attributeFilter: ATTRS });
  }
  function hookFrame(fr) {
    if (fr.__mwEN || !fr.closest || !fr.closest(ROOTS)) return; fr.__mwEN = 1;   // only My World's own world pages
    var go = function () { var d = frameDoc(fr); if (d && d.readyState !== 'loading') inFrame(d); };
    fr.addEventListener('load', function () { frames.delete && frameDoc(fr) && frames.delete(frameDoc(fr)); go(); }); go();
  }
  function start() { mo.observe(document.body, { subtree: true, childList: true, characterData: true, attributes: true, attributeFilter: ATTRS }); document.querySelectorAll(ROOTS).forEach(walk); }
  if (document.body) start(); else document.addEventListener('DOMContentLoaded', start);
  window.MinestWorldEN = { tr: tr, missing: function () { return Array.from(missing); }, size: keys.length, version: '1.0' };
})();

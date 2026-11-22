/* Minest · Cognitive Toolkit — the host side inside the Minest app (window.MinestToolkitHost)
   Injected into the phone / iPad / web pages by tools/toolkit/apply.py. It:
     · puts a “Cognitive Toolkit” entry on the My World home, next to Frameworks;
     · opens the toolkit (toolkit.html, built by tools/toolkit/build.py) full screen in an iframe;
     · answers the toolkit over postMessage (works whether or not the frame counts as same-origin, e.g. file:// in the app):
         items          → the things in the user's worlds (titles only), to think about one of them
         capture        → closes the toolkit and opens My World's own Quick Capture with the text (the user confirms
                          where it goes — nothing is written to a board without that)
         cloud-*        → reads / writes users/{uid}/focusboard/toolkit with the app's signed-in Firebase user, and relays
                          remote changes; no other document is touched
   Entry from code: MinestToolkitHost.open({ input, card, objectId, lab, model }). */
(function () {
  'use strict';
  if (window.MinestToolkitHost) return;
  var ov = null, frame = null, unsub = null, PAGE = 'toolkit.html';
  function esc(s) { return String(s == null ? '' : s).replace(/[&<>"]/g, function (c) { return { '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;' }[c]; }); }

  function open(o) {
    o = o || {};
    if (ov) close();
    var h = ['embed=1'];
    if (o.objectId) h.push('ko=' + encodeURIComponent(o.objectId));
    if (o.card) h.push('card=' + encodeURIComponent(o.card));
    if (o.lab) h.push('lab=' + encodeURIComponent(o.lab));
    if (o.model) h.push('model=' + encodeURIComponent(o.model));
    if (o.input) h.push('input=' + encodeURIComponent(o.input));
    if (o.nebula) h.push('nebula=1');
    if (o.only) h.push('only=1');
    ov = document.createElement('div'); ov.className = 'mn-tk-ov'; ov.setAttribute('role', 'dialog'); ov.setAttribute('aria-label', 'Cognitive Toolkit');
    ov.innerHTML = '<iframe title="Cognitive Toolkit" src="' + PAGE + '#' + h.join('&') + '"></iframe><button type="button" class="mn-tk-x" aria-label="Close">×</button>';
    var from = o.from || { x: window.innerWidth / 2, y: window.innerHeight / 2 };
    from = { x: Math.max(0, Math.min(window.innerWidth, from.x)), y: Math.max(0, Math.min(window.innerHeight, from.y)) };   // the workbench unfolds from here (the watch, when summoned)
    ov.style.setProperty('--ox', Math.round(from.x) + 'px'); ov.style.setProperty('--oy', Math.round(from.y) + 'px'); if (o.from) ov.classList.add('from-watch');
    document.body.appendChild(ov); frame = ov.querySelector('iframe');
    ov.querySelector('.mn-tk-x').onclick = close;
    document.addEventListener('keydown', key, true);
    requestAnimationFrame(function () { ov.classList.add('on'); });
  }
  // the workbench lives in Holo Lab's 知识星图 (spatial-home/js/holo-lab.js); the toolkit's own nebula is only a fallback
  function holo() {
    var H = window.SpatialHoloLab;
    if (H) H.open(function (r) { try { if (window.MinestUniverse && window.MinestUniverse.close) window.MinestUniverse.close(); } catch (e) {} if (r && r.after && window.MinestAI) setTimeout(function () { r.after(window); }, 200); }, { mode: 'stars' });
    else open({ nebula: true });
  }
  function close() {
    if (!ov) return; var o = ov; ov = null; frame = null; if (unsub) { unsub(); unsub = null; } document.removeEventListener('keydown', key, true);
    o.classList.remove('on'); setTimeout(function () { o.remove(); try { window.dispatchEvent(new CustomEvent('minest:toolkit-closed')); } catch (e) {} }, o.classList.contains('from-watch') ? 560 : 220);   // folds back into the watch
  }
  function key(e) { if (e.key === 'Escape' && ov) { e.stopPropagation(); close(); } }

  // ---------------------------------------------------------------- the toolkit asks, the host answers
  function reply(src, id, data) { try { src.postMessage({ type: 'minest-toolkit-reply', id: id, data: data }, '*'); } catch (e) {} }
  function user() { try { var fb = window.firebase; return fb && fb.auth && fb.auth().currentUser; } catch (e) { return null; } }
  function doc(u) { return window.firebase.firestore().collection('users').doc(u.uid).collection('focusboard').doc('toolkit'); }
  function items() {
    var out = [];
    try {
      var W = window.MinestWorld, ws = W && W.worlds ? W.worlds() : [], K = window.MinestKnowledge;
      ws.forEach(function (x) { var b = x.b || x; (b.columns || []).forEach(function (col) { (col.cards || []).forEach(function (c) {
        if (!c || !c.title || (K && K.isHeading && K.isHeading(c.id))) return;
        out.push({ id: c.id, title: c.title, world: b.title, list: col.title });
        (c.stack || []).forEach(function (s) { if (s && s.title) out.push({ id: s.id, title: s.title, world: b.title, list: c.title }); });
      }); }); });
    } catch (e) {}
    return out.slice(0, 600);
  }
  window.addEventListener('message', function (e) {
    var m = e.data; if (!m || m.type !== 'minest-toolkit' || !frame || e.source !== frame.contentWindow) return;
    var src = e.source, u;
    if (m.action === 'hello') return reply(src, m.id, { host: 'minest', user: user() ? { email: user().email || '' } : null, worlds: !!window.MinestWorld });
    if (m.action === 'items') return reply(src, m.id, items());
    if (m.action === 'close') return close();
    if (m.action === 'holo') { close(); setTimeout(holo, 260); return reply(src, m.id, { ok: !!window.SpatialHoloLab }); }
    if (m.action === 'capture') {
      close();
      setTimeout(function () { try { if (window.MinestCapture) window.MinestCapture.open({ text: String(m.text || '') }); } catch (x) {} }, 260);
      return reply(src, m.id, { ok: !!window.MinestCapture });
    }
    if (m.action === 'cloud-get') {
      u = user(); if (!u || !window.firebase.firestore) return reply(src, m.id, { error: 'signed-out' });
      doc(u).get().then(function (d) { reply(src, m.id, { x: d.exists ? (d.data().x || {}) : {}, email: u.email || '' }); }).catch(function (x) { reply(src, m.id, { error: x && x.code || String(x) }); });
      return;
    }
    if (m.action === 'cloud-set') {
      u = user(); if (!u) return reply(src, m.id, { error: 'signed-out' });
      doc(u).set({ x: m.x || {}, updatedAt: window.firebase.firestore.FieldValue.serverTimestamp(), writer: 'cognitive-toolkit' }, { merge: true })
        .then(function () { reply(src, m.id, { ok: true }); }).catch(function (x) { reply(src, m.id, { error: x && x.code || String(x) }); });
      return;
    }
    if (m.action === 'cloud-listen') {
      u = user(); if (!u) return reply(src, m.id, { error: 'signed-out' });
      if (unsub) unsub();
      unsub = doc(u).onSnapshot(function (d) { try { src.postMessage({ type: 'minest-toolkit-remote', x: d.exists ? (d.data().x || {}) : {} }, '*'); } catch (x) {} }, function () {});
      return reply(src, m.id, { ok: true });
    }
  });

  // ---------------------------------------------------------------- the entry on the My World home (next to Frameworks)
  function addEntry(root) {
    var fw = (root || document).querySelector('.mw-portal[data-frameworks]'); if (!fw || fw.parentNode.querySelector('.mw-portal[data-toolkit]')) return;
    var b = document.createElement('button'); b.type = 'button'; b.className = 'mw-portal'; b.setAttribute('data-toolkit', '');
    b.innerHTML = '<span>🧠</span><div><b>Cognitive Toolkit</b><small>Think it through · Compass · Framework · Models · Lab · Graph</small></div><svg viewBox="0 0 24 24" width="19" height="19" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="m9 6 6 6-6 6"/></svg>';
    b.onclick = function (e) { e.stopPropagation(); open({}); };
    fw.after(b);
    var nb = document.createElement('button'); nb.type = 'button'; nb.className = 'mw-portal'; nb.setAttribute('data-nebula', '');
    nb.innerHTML = '<span>🌌</span><div><b>Knowledge Constellation</b><small>知识星图 · Holographic workbench · rotate, open, focus, pull out, connect</small></div><svg viewBox="0 0 24 24" width="19" height="19" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="m9 6 6 6-6 6"/></svg>';
    nb.onclick = function (e) { e.stopPropagation(); holo(); };
    b.after(nb);
  }
  function watch() {
    addEntry();
    if (!window.MutationObserver) return;
    var t = 0; new MutationObserver(function () { clearTimeout(t); t = setTimeout(addEntry, 40); }).observe(document.body, { childList: true, subtree: true });
  }
  if (document.body) watch(); else document.addEventListener('DOMContentLoaded', watch);

  var css = document.createElement('style'); css.id = 'mn-tk-host';
  css.textContent = '.mn-tk-ov{position:fixed;inset:0;z-index:2147483600;background:rgba(10,8,24,.55);opacity:0;transition:opacity .2s}.mn-tk-ov.on{opacity:1}' +
    '.mn-tk-ov.from-watch{opacity:1;clip-path:circle(0 at var(--ox) var(--oy));transition:clip-path .55s cubic-bezier(.3,.7,.2,1)}.mn-tk-ov.from-watch.on{clip-path:circle(150% at var(--ox) var(--oy))}' +
    '@media (prefers-reduced-motion:reduce){.mn-tk-ov.from-watch{transition:none}}' +
    '.mn-tk-ov iframe{position:absolute;inset:0;width:100%;height:100%;border:0;background:#14121f}' +
    '.mn-tk-x{position:absolute;top:calc(env(safe-area-inset-top,0px) + 10px);right:12px;width:36px;height:36px;border-radius:50%;border:0;background:rgba(255,255,255,.9);color:#1d1838;font:600 22px/1 system-ui;box-shadow:0 4px 14px rgba(0,0,0,.3);cursor:pointer}' +
    'html.student-mode .mw-portal[data-toolkit],html.student-mode .mw-portal[data-nebula]{display:none}';
  (document.head || document.documentElement).appendChild(css);

  window.MinestToolkitHost = { open: open, close: close, constellation: holo, isOpen: function () { return !!ov; }, items: items };
})();

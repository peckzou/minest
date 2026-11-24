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
  function holo(wiki) {
    var H = window.SpatialHoloLab;
    if (H) H.open(function (r) { try { if (window.MinestUniverse && window.MinestUniverse.close) window.MinestUniverse.close(); } catch (e) {} if (r && r.after && window.MinestAI) setTimeout(function () { r.after(window); }, 200); }, { mode: 'stars', wiki: wiki && typeof wiki === 'object' ? wiki : null });
    else open({ nebula: true });
  }
  /* 哲学交互模型 (philosophy/models/): one full screen over everything, the toolkit stays where it was underneath.
     Only file names of the form minest_*.html are opened; on the web from this site, in the app from minest-app. */
  var phEl = null, SITE = /^https?:$/.test(location.protocol) ? '' : 'https://minest-app.vercel.app/';
  function phil(file, title) { full(SITE + 'philosophy/models/' + file, title || '哲学交互模型'); }
  /* 哲学家小岛 Philosophers' Island (philosophers-island/, Antigravity): the voxel island of 20 philosophers, full screen */
  function island() { full(SITE + 'philosophers-island/philosophers.html', '哲学家小岛 · Philosophers’ Island'); }
  /* 教堂小岛 Cathedrals' Island (cathedrals-island/, Antigravity): the second built-in island, next to the philosophers' */
  function cathedrals() { full(SITE + 'cathedrals-island/cathedrals.html', '教堂小岛 · Cathedrals’ Island'); }
  /* 奇想主题乐园 Theme Park (theme-park-island/, Antigravity): the third built-in island */
  function themepark(placeId) {
    var q = placeId && /^[A-Za-z0-9_-]{1,40}$/.test(String(placeId)) ? '?place=' + placeId : '';
    full(SITE + 'theme-park-island/theme-park.html' + q, '奇想主题乐园 · Disney Imagineering Park');
  }
  /* 梦工坊 Dream Workshop (dream-workshop/): direct an experience — characters, voices, triggers, a show timeline, then walk in as a guest */
  function workshop(id, play) {   /* (id, true): walk straight into that work as its guest — a placed experience in a room or on an island */
    var q = id && /^[A-Za-z0-9_-]{1,40}$/.test(String(id)) ? '?' + (play ? 'play=' : 'open=') + id : '';
    full(SITE + 'dream-workshop/index.html' + q, '梦工坊 · Dream Workshop');
  }
  function full(url, title) {
    if (phEl) phEl.remove();
    var o = phEl = document.createElement('div'); o.className = 'mn-phil';
    o.style.cssText = 'position:fixed;inset:0;z-index:2147483646;background:#0b0f14;opacity:0;transition:opacity .25s';
    o.innerHTML = '<div style="height:calc(env(safe-area-inset-top,0px) + 34px);box-sizing:border-box;padding:calc(env(safe-area-inset-top,0px) + 4px) 10px 4px;display:flex;align-items:center;gap:10px;background:#0b0f14;border-bottom:1px solid rgba(255,255,255,.08);font:13px/1 -apple-system,BlinkMacSystemFont,\'PingFang SC\',sans-serif;color:#cfd8e3">' +
      '<button type="button" style="border:1px solid rgba(255,255,255,.22);background:rgba(255,255,255,.06);color:#fff;border-radius:999px;padding:5px 11px;font:inherit;cursor:pointer">✕ 返回 Minest</button><b style="font-weight:600;opacity:.85;white-space:nowrap;overflow:hidden;text-overflow:ellipsis"></b></div>' +
      '<iframe title="" style="border:0;width:100%;height:calc(100% - env(safe-area-inset-top,0px) - 34px);display:block" allow="fullscreen"></iframe>';   // a bar of its own: nothing inside the model is covered
    o.querySelector('b').textContent = title;
    o.querySelector('iframe').title = title; o.querySelector('iframe').src = url;
    ['pointerdown', 'touchstart', 'wheel', 'keydown'].forEach(function (t) { o.addEventListener(t, function (e) { e.stopPropagation(); }, { passive: true }); });
    var shut = function () { if (!phEl) return; var x = phEl; phEl = null; document.removeEventListener('keydown', esc, true); x.style.opacity = '0'; setTimeout(function () { x.remove(); }, 260); };
    var esc = function (e) { if (e.key === 'Escape') { e.stopPropagation(); e.preventDefault(); shut(); } };
    o.querySelector('button').onclick = shut; document.addEventListener('keydown', esc, true);
    document.body.appendChild(o); requestAnimationFrame(function () { o.style.opacity = '1'; });
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
    var m = e.data; if (!m || m.type !== 'minest-toolkit') return;
    var mine = frame && e.source === frame.contentWindow, other = adopted.filter(function (f) { return f.contentWindow === e.source; })[0];   // the full-screen frame, or My World's input panel
    if (!mine && !other) return;
    if (other && (m.action === 'close' || m.action === 'capture' || m.action === 'holo' || m.action === 'ready')) { try { other.dispatchEvent(new CustomEvent('tk-' + m.action, { detail: m })); } catch (x) {} if (m.action === 'holo') reply(e.source, m.id, { ok: !!window.SpatialHoloLab }); if (m.action !== 'capture') return; }
    var src = e.source, u;
    if (m.action === 'hello') return reply(src, m.id, { host: 'minest', user: user() ? { email: user().email || '' } : null, worlds: !!window.MinestWorld });
    if (m.action === 'items') return reply(src, m.id, items());
    if (m.action === 'close') return close();
    if (m.action === 'ready') return;
    if (m.action === 'island') { if (m.which === 'cathedrals') cathedrals(); else if (m.which === 'themepark') themepark(); else if (m.which === 'workshop') workshop(); else island(); return reply(src, m.id, { ok: true }); }
    if (m.action === 'phil') { var okp = typeof m.file === 'string' && /^minest_[a-z_]+\.html$/.test(m.file); if (okp) phil(m.file, String(m.title || '').slice(0, 60)); return reply(src, m.id, { ok: okp }); }
    if (m.action === 'holo') { close(); setTimeout(function () { holo(m.wiki); }, 260); return reply(src, m.id, { ok: !!window.SpatialHoloLab }); }
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
    b.onclick = function (e) { e.stopPropagation(); if (window.MinestOmni) MinestOmni.open(); else open({}); };   // the five cards live with My World's input
    fw.after(b);
    var nb = document.createElement('button'); nb.type = 'button'; nb.className = 'mw-portal'; nb.setAttribute('data-nebula', '');
    nb.innerHTML = '<span>🌌</span><div><b>Knowledge Constellation</b><small>知识星图 · Holographic workbench · rotate, open, focus, pull out, connect</small></div><svg viewBox="0 0 24 24" width="19" height="19" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="m9 6 6 6-6 6"/></svg>';
    nb.onclick = function (e) { e.stopPropagation(); holo(); };
    b.after(nb);
  }
  function addIsland() {
    var cs = document.querySelector('[data-centerstyle]');   // My World's overview sheet (it sits outside .uv)
    if (cs && !cs.parentNode.querySelector('[data-philisland]')) {
      var r = document.createElement('button'); r.type = 'button'; r.className = 'uv-row'; r.setAttribute('data-philisland', '');
      r.innerHTML = '<i>🏛️</i><div><b>哲学家小岛 · Philosophers’ Island</b><small>20 位哲学家的家 · 漫游、罗盘传送、思想实验</small></div>';
      r.addEventListener('click', function (e) { e.stopPropagation(); island(); }, true);
      cs.parentNode.insertBefore(r, cs);
    }
    if (cs && !cs.parentNode.querySelector('[data-cathisland]')) {
      var rc = document.createElement('button'); rc.type = 'button'; rc.className = 'uv-row'; rc.setAttribute('data-cathisland', '');
      rc.innerHTML = '<i>⛪</i><div class="mn-en-keep"><b>教堂小岛 · Cathedrals’ Island</b><small>世界 20 座圣殿教堂 · 漫游、罗盘传送、走进教堂</small></div>';
      rc.addEventListener('click', function (e) { e.stopPropagation(); cathedrals(); }, true);
      var pr = cs.parentNode.querySelector('[data-philisland]'); cs.parentNode.insertBefore(rc, pr ? pr.nextSibling : cs);
    }
    if (cs && !cs.parentNode.querySelector('[data-parkisland]')) {
      var rp = document.createElement('button'); rp.type = 'button'; rp.className = 'uv-row'; rp.setAttribute('data-parkisland', '');
      rp.innerHTML = '<i>🎡</i><div class="mn-en-keep"><b>奇想主题乐园 · Theme Park</b><small>9 大主题园区 · 乘坐游乐设施、城堡烟花秀</small></div>';
      rp.addEventListener('click', function (e) { e.stopPropagation(); themepark(); }, true);
      var cr = cs.parentNode.querySelector('[data-cathisland]'); cs.parentNode.insertBefore(rp, cr ? cr.nextSibling : cs);
    }
    if (cs && !cs.parentNode.querySelector('[data-dreamws]')) {
      var rw = document.createElement('button'); rw.type = 'button'; rw.className = 'uv-row'; rw.setAttribute('data-dreamws', '');
      rw.innerHTML = '<i>🎬</i><div class="mn-en-keep"><b>梦工坊 · Dream Workshop</b><small>造物 · 赋能 · 布景 · 导演 · 让作品活起来，再走进去当观众</small></div>';
      rw.addEventListener('click', function (e) { e.stopPropagation(); workshop(); }, true);
      var pk = cs.parentNode.querySelector('[data-parkisland]'); cs.parentNode.insertBefore(rw, pk ? pk.nextSibling : cs);
    }
    // the centre island's hexagon menu (mn-island-game-script): one more hexagon, in the free bottom-left slot
    var m = document.querySelector('.mn-island-actions[aria-label="My World actions"]'), b4 = m && m.querySelector('.mn-island-action-4');
    if (m && b4 && !m.querySelector('[data-philisland]')) {
      var t4 = m.querySelector('.mn-action-tip-4'), hb = document.createElement('button'), n = m.querySelectorAll('.mn-island-action').length;
      hb.type = 'button'; hb.className = 'mn-island-action mn-island-action-' + n; hb.setAttribute('data-philisland', ''); hb.setAttribute('role', 'menuitem'); hb.setAttribute('aria-label', '哲学家小岛 Philosophers’ Island'); hb.title = '哲学家小岛 · Philosophers’ Island';
      hb.innerHTML = '<span class="mn-action-icon" aria-hidden="true" style="font-size:22px;line-height:1">🏛️</span>';
      var top = m.offsetHeight - b4.offsetTop - b4.offsetHeight;
      hb.style.cssText = 'position:absolute;left:' + b4.offsetLeft + 'px;top:' + top + 'px;right:auto;bottom:auto;--g:conic-gradient(from 30deg,#f7e3a6 0 60deg,#f0d27a 60deg 120deg,#d9ab3a 120deg 180deg,#b88a22 180deg 240deg,#e2bb52 240deg 300deg,#f4dc95 300deg)';
      hb.addEventListener('click', function (e) { e.stopPropagation(); m.remove(); [].forEach.call(document.querySelectorAll('.mn-island-selected'), function (x) { x.classList.remove('mn-island-selected'); x.setAttribute('aria-expanded', 'false'); }); island(); });
      m.appendChild(hb);
      if (t4) { var tp = document.createElement('span'); tp.className = t4.className.replace(/mn-action-tip-4/, 'mn-action-tip-' + n); tp.setAttribute('aria-hidden', 'true'); tp.textContent = 'Philosophers’ Island';
        tp.style.cssText = 'position:absolute;left:' + (t4.offsetLeft) + 'px;top:' + (top + (t4.offsetTop - b4.offsetTop)) + 'px;right:auto;bottom:auto'; m.appendChild(tp); }
    }
    // the second built-in island beside it: the bottom-right slot, the philosophers' hexagon mirrored left to right
    var ph = m && m.querySelector('.mn-island-action[data-philisland]');
    if (m && ph && !m.querySelector('[data-cathisland]')) {
      var n2 = m.querySelectorAll('.mn-island-action').length, cb = document.createElement('button'), cl = m.offsetWidth - ph.offsetLeft - ph.offsetWidth;
      cb.type = 'button'; cb.className = 'mn-island-action mn-island-action-' + n2; cb.setAttribute('data-cathisland', ''); cb.setAttribute('role', 'menuitem'); cb.setAttribute('aria-label', '教堂小岛 Cathedrals’ Island'); cb.title = '教堂小岛 · Cathedrals’ Island';
      cb.innerHTML = '<span class="mn-action-icon" aria-hidden="true" style="font-size:22px;line-height:1">⛪</span>';
      cb.style.cssText = 'position:absolute;left:' + cl + 'px;top:' + ph.offsetTop + 'px;right:auto;bottom:auto;--g:conic-gradient(from 30deg,#dbeafe 0 60deg,#bfdbfe 60deg 120deg,#7aa7e0 120deg 180deg,#4f7fc4 180deg 240deg,#93b8eb 240deg 300deg,#cfe0fb 300deg)';
      cb.addEventListener('click', function (e) { e.stopPropagation(); m.remove(); [].forEach.call(document.querySelectorAll('.mn-island-selected'), function (x) { x.classList.remove('mn-island-selected'); x.setAttribute('aria-expanded', 'false'); }); cathedrals(); });
      m.appendChild(cb);
      var pt = [].filter.call(m.children, function (x) { return /mn-action-tip-/.test(x.className) && x.textContent === 'Philosophers’ Island'; })[0];
      if (pt) { var ct = document.createElement('span'); ct.className = pt.className.replace(/mn-action-tip-\d+/, 'mn-action-tip-' + n2); ct.setAttribute('aria-hidden', 'true'); ct.textContent = 'Cathedrals’ Island'; m.appendChild(ct);
        ct.style.cssText = 'position:absolute;top:' + pt.style.top + ';right:auto;bottom:auto;left:' + (cl + ph.offsetWidth / 2) + 'px;transform:translateX(-50%)'; }
    }
    // the third built-in island: one row further down, under the bottom hexagon, between the other two islands
    var b2 = m && m.querySelector('.mn-island-action-2');
    if (m && ph && b2 && !m.querySelector('[data-parkisland]')) {
      var n3 = m.querySelectorAll('.mn-island-action').length, pb = document.createElement('button'), pTop = b2.offsetTop + b2.offsetHeight + 22;
      pb.type = 'button'; pb.className = 'mn-island-action mn-island-action-' + n3; pb.setAttribute('data-parkisland', ''); pb.setAttribute('role', 'menuitem'); pb.setAttribute('aria-label', '奇想主题乐园 Theme Park'); pb.title = '奇想主题乐园 · Theme Park';
      pb.innerHTML = '<span class="mn-action-icon" aria-hidden="true" style="font-size:22px;line-height:1">🎡</span>';
      pb.style.cssText = 'position:absolute;left:' + b2.offsetLeft + 'px;top:' + pTop + 'px;right:auto;bottom:auto;--g:conic-gradient(from 30deg,#fbcfe8 0 60deg,#f9a8d4 60deg 120deg,#ec4899 120deg 180deg,#be185d 180deg 240deg,#f472b6 240deg 300deg,#fbcfe8 300deg)';
      pb.addEventListener('click', function (e) { e.stopPropagation(); m.remove(); [].forEach.call(document.querySelectorAll('.mn-island-selected'), function (x) { x.classList.remove('mn-island-selected'); x.setAttribute('aria-expanded', 'false'); }); themepark(); });
      m.appendChild(pb);
      var pt2 = [].filter.call(m.children, function (x) { return /mn-action-tip-/.test(x.className) && x.textContent === 'Philosophers’ Island'; })[0];
      if (pt2) { var kt = document.createElement('span'); kt.className = pt2.className.replace(/mn-action-tip-\d+/, 'mn-action-tip-' + n3); kt.setAttribute('aria-hidden', 'true'); kt.textContent = 'Theme Park'; m.appendChild(kt);
        kt.style.cssText = 'position:absolute;top:' + (pTop + parseFloat(pt2.style.top) - ph.offsetTop) + 'px;right:auto;bottom:auto;left:' + (b2.offsetLeft + b2.offsetWidth / 2) + 'px;transform:translateX(-50%)'; }
    }
  }
  function watch() {
    addEntry(); addIsland();
    if (!window.MutationObserver) return;
    // a throttle, not a debounce: the live 3D home changes the page all the time, so a debounce could wait for ever
    var t = 0; new MutationObserver(function () { if (t) return; t = setTimeout(function () { t = 0; addEntry(); addIsland(); }, 60); }).observe(document.body, { childList: true, subtree: true });
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

  var adopted = [];   // other toolkit frames this page answers (My World's input, tools/toolkit/omni.js)
  window.MinestToolkitHost = { island: island, cathedrals: cathedrals, themepark: themepark, workshop: workshop, adopt: function (f) { if (adopted.indexOf(f) < 0) adopted.push(f); }, open: open, close: close, constellation: holo, isOpen: function () { return !!ov; }, items: items };
})();

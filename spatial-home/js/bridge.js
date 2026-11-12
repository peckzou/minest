/* Minest · Spatial Home — the bridge to the features that already exist.
   Nothing is re-made here. The Minest app (index.html, the same build the user already has) runs in one frame that
   stays loaded behind the room; a thing in the room calls that app's own entry function and shows the frame. Leaving
   only hides the frame, so whatever was open keeps its state.
   A target is { id, label, kind: 'host' | 'page', … }:
     host: test(w) → the entry exists in this build · open(w) · isOpen(w) · close(w)
     page: url (a page of this repo, shown in a second frame)
   Entries were read from the code, not guessed:
     MinestHermes / MinestKeyflow / MinestTypingWorlds / MinestRoutine  (main branch builds; not in the duo-v1 build)
     MinestPetRaising.open  ·  MinestUniverse.open/close/isOpen  ·  MinestOpenWorldsModal  ·  Kanban = the app itself */
(function (root) {
  'use strict';
  var APP_KEY = 'minest.spatialHome.app';

  function has(w, name, fn) { try { return !!(w[name] && typeof w[name][fn || 'open'] === 'function'); } catch (e) { return false; } }
  function mod(name, label, note) {
    return {
      id: name, label: label, kind: 'host', entry: 'window.' + name + '.open()', note: note,
      test: function (w) { return has(w, name); }, open: function (w) { w[name].open(); },
      isOpen: function (w) { return has(w, name, 'isOpen') ? !!w[name].isOpen() : true; },
      close: function (w) { if (has(w, name, 'close')) w[name].close(); }
    };
  }
  var PET_OV = 'minest-pet-raising-overlay', WORLDS_OV = 'mn-worlds-modal-69';
  /* Rings opens from the board's own button (React); a hidden copy still answers .click() */
  function ringsBtn(w) { try { var a = [].slice.call(w.document.querySelectorAll('button[aria-label="Activity Rings & Badges"]')); return a.filter(function (b) { return b.offsetWidth; })[0] || a[0] || null; } catch (e) { return null; } }

  var FEATURES = {
    /* entry update: the typewriter is the classic typewriter only (Hermes 3000); 3D typing moved to the quill */
    type: { title: 'Typewriter', targets: [mod('MinestHermes', 'Hermes 3000 经典打字机')],
      missing: '这个构建里没有经典打字机（window.MinestHermes）。' },
    /* the quill: Minest's 3D Type (window.MinestType3D, tools/type3d/patch_type3d.py) = the type3d/ worlds — Filament (the Westworld
       machine), Firework, Topiary, Saber, Quill, Neon, Book. A build without the module still gets the same page: next to the app
       when it ships type3d/, otherwise the live one (exactly what MinestType3D itself falls back to). Not Typing Worlds. */
    type3d: { title: '3D Type', targets: [mod('MinestType3D', '3D Type · 立体打字'),
      { id: 'type3d', label: '3D Type · 立体打字', kind: 'page', url: '../type3d/index.html', web: 'type3d/index.html', flat: 'https://minest-app.vercel.app/type3d/index.html', entry: 'type3d/index.html' },   // the iOS bundle has no type3d/: the live page
      { id: 'type3d-live', label: '3D Type · 立体打字', kind: 'page', abs: 'https://minest-app.vercel.app/type3d/index.html', fallback: true, entry: 'https://minest-app.vercel.app/type3d/index.html' }],
      missing: '没有找到 3D Type（window.MinestType3D 或 type3d/ 页面）。' },
    drive: { title: 'Knowledge Drive', targets: [{
      id: 'MinestDrive', label: 'Knowledge Drive', kind: 'host', entry: "window.MinestDrive.open({ source: { type: 'workspace' } })",
      test: function (w) { return has(w, 'MinestDrive'); },
      open: function (w) { if (!w.document.querySelector('.kd-root')) w.MinestDrive.open({ source: { type: 'workspace' } }); },
      isOpen: function (w) { return !!w.document.querySelector('.kd-root'); }, close: function (w) { w.MinestDrive.close(); }
    }], missing: '这个构建里没有 Knowledge Drive（window.MinestDrive）。' },
    rings: { title: 'Rings', targets: [{
      id: 'Rings', label: 'Activity Rings & Badges', kind: 'host', entry: 'the app\'s own “Activity Rings & Badges” button',
      test: function (w) { return !!ringsBtn(w); },
      open: function (w) { if (!w.document.querySelector('.minest-activity-modal-shell')) ringsBtn(w).click(); },
      isOpen: function (w) { return !!w.document.querySelector('.minest-activity-modal-shell'); },
      close: function (w) { var m = w.document.querySelector('.minest-activity-modal-shell'), c = m && m.querySelector('button[aria-label="Close"]'); if (c) c.click(); }
    }], missing: '没有找到 Rings（“Activity Rings & Badges” 按钮）。' },
    knowledge: { title: 'Knowledge', targets: [{
      id: 'MinestKnowledgeHub', label: 'Knowledge 知识', kind: 'host', entry: 'window.MinestKnowledgeHub.open()',
      test: function (w) { return has(w, 'MinestKnowledgeHub'); },
      open: function (w) { if (!w.document.querySelector('.kh-bd')) w.MinestKnowledgeHub.open(); },
      isOpen: function (w) { return !!w.document.querySelector('.kh-bd'); }, close: function (w) { if (w.document.querySelector('.kh-bd')) w.MinestKnowledgeHub.close(); }
    }], missing: '这个构建里没有 Knowledge（window.MinestKnowledgeHub）。' },
    carplay: { title: 'CarPlay', targets: [{
      id: 'MinestCarFlash', label: '车载闪卡 · CarPlay', kind: 'host', entry: 'window.MinestCarFlash.open()',
      test: function (w) { return has(w, 'MinestCarFlash'); }, open: function (w) { if (!w.document.querySelector('.cf-ov')) w.MinestCarFlash.open(); },
      isOpen: function (w) { return !!w.document.querySelector('.cf-ov'); }, close: function (w) { w.MinestCarFlash.close(); }
    }], missing: '这个构建里没有车载闪卡（window.MinestCarFlash）。' },
    routine: { title: 'Liquid Routine', targets: [mod('MinestRoutine', 'Liquid Routine 日程')],
      missing: '这个构建里没有 Liquid Routine（window.MinestRoutine 只在 main 分支的构建里）。' },
    pet: { title: 'Pet Raising', targets: [{
      id: 'MinestPetRaising', label: '宠物养成', kind: 'host', entry: 'window.MinestPetRaising.open()',
      test: function (w) { return has(w, 'MinestPetRaising'); }, open: function (w) { w.MinestPetRaising.open(); },
      isOpen: function (w) { return !!w.document.getElementById(PET_OV); },
      close: function (w) { var o = w.document.getElementById(PET_OV); if (o) o.remove(); w.document.documentElement.classList.remove('pet-raising-open'); }
    }], missing: '这个构建里没有 MinestPetRaising。' },
    kanban: { title: 'Kanban', targets: [{
      id: 'Kanban', label: 'Kanban 看板', kind: 'host', entry: 'the app itself (#root), every overlay closed', base: true,
      test: function (w) { return !!w.document.getElementById('root'); }, open: function () {}, isOpen: function () { return true; }, close: function () {}
    }], missing: '没有找到看板（#root）。' },
    lists: { title: 'Lists', targets: [{
      id: 'MinestUniverse', label: 'My World · 清单总览', kind: 'host', entry: 'window.MinestUniverse.open()',
      test: function (w) { return has(w, 'MinestUniverse'); }, open: function (w) { w.MinestUniverse.open(); },
      isOpen: function (w) { return !!w.MinestUniverse.isOpen(); }, close: function (w) { w.MinestUniverse.close(); }
    }], missing: '这个构建里没有 MinestUniverse。' },
    holo: { title: 'Hologram', targets: [
      { id: 'hologram', label: '全息展示（独立原型）', kind: 'page', url: '../hologram/index.html', web: 'hologram/index.html', flat: 'https://minest-app.vercel.app/hologram/index.html', entry: 'hologram/index.html' }   // the iOS bundle: the live page
    ], missing: '没有找到 hologram/ 原型。' },
    portal: { title: 'Worlds', targets: [{
      id: 'MinestOpenWorldsModal', label: '主题世界 · 传送门', kind: 'host', entry: 'window.MinestOpenWorldsModal()',
      test: function (w) { return typeof w.MinestOpenWorldsModal === 'function'; },
      open: function (w) { if (!w.document.getElementById(WORLDS_OV)) w.MinestOpenWorldsModal(); },
      sticky: true,   // a world opened from the modal replaces it; only ⌂ Home leaves
      isOpen: function (w) { return !!w.document.getElementById(WORLDS_OV); },
      close: function (w) { var o = w.document.getElementById(WORLDS_OV); if (o) o.remove(); }
    }, { id: 'worlds', label: '世界大厅 worlds.html', kind: 'page', url: '../worlds.html', web: 'worlds.html', flat: 'worlds.html', entry: 'worlds.html' }],
      missing: '没有找到世界入口。' }
  };

  /* Two ways to run:
     · embedded (inside the Minest page, put in by tools/spatial-home/patch_spatial_home.py): the app IS this window;
       a host target opens right here, Spatial Home hides itself over it, ⌂ Home brings it back.
     · standalone (spatial-home/index.html): the app is loaded once into a frame behind the room. */
  var EMBED = !!root.__SPATIAL_HOME_EMBEDDED__;
  var wrap, hostFrame, pageFrame, pill, hostState = EMBED ? 'ready' : 'idle', waiters = [], current = null, poll = 0, seenOpen = false, onLeave = null, onShow = null;

  function appUrl() {
    if (EMBED) return location.href.split('#')[0];
    var u = '../index.html';
    try { var q = new URLSearchParams(location.search).get('app') || localStorage.getItem(APP_KEY); if (q) u = q; } catch (e) {}
    try { var abs = new URL(u, location.href); if (abs.origin !== location.origin) return new URL('../index.html', location.href).href; return abs.href; } catch (e) { return '../index.html'; }
  }
  function hw() { if (EMBED) return root; try { return hostFrame && hostFrame.contentWindow; } catch (e) { return null; } }
  function hostReady() { var w = hw(); try { return !!(w && w.document && w.document.readyState === 'complete' && w.document.getElementById('root')); } catch (e) { return false; } }
  /* a page target's address: next to the app page on the web; the iOS bundle is flat (hologram.html, worlds.html) */
  function pageUrl(t) {
    if (t.abs) return t.abs;
    if (!EMBED) return new URL(t.url, location.href).href;
    var web = /^https?:$/.test(location.protocol);
    return new URL(web ? t.web : t.flat, location.href).href;
  }

  function init(o) {
    wrap = o.wrap; pill = o.pill; onLeave = o.onLeave; onShow = o.onShow;
    pill.addEventListener('click', function (e) { e.stopPropagation(); leave('home'); });
    pill.addEventListener('mouseenter', function () { pill.textContent = '⌂ Home'; });
    pill.addEventListener('mouseleave', function () { if (pill.classList.contains('mini')) pill.textContent = '⌂'; });
  }
  /* load the app once (standalone only); resolve with its window (or null if it never comes up) */
  function load() {
    if (hostState === 'ready') return Promise.resolve(hw());
    return new Promise(function (res) {
      waiters.push(res);
      if (hostState === 'loading') return;
      hostState = 'loading';
      hostFrame = document.createElement('iframe'); hostFrame.className = 'sh-frame'; hostFrame.title = 'Minest'; hostFrame.setAttribute('allow', 'camera; microphone; fullscreen; autoplay; clipboard-write');
      hostFrame.src = appUrl(); wrap.appendChild(hostFrame);
      var t0 = Date.now(), iv = setInterval(function () {
        var ok = hostReady();
        if (ok || Date.now() - t0 > 45000) {
          clearInterval(iv); hostState = ok ? 'ready' : 'failed';
          var w = ok ? hw() : null; waiters.splice(0).forEach(function (f) { f(w); });
          if (!ok) { hostFrame.remove(); hostFrame = null; hostState = 'idle'; }
          root.dispatchEvent(new CustomEvent('spatialhome:host', { detail: { ready: ok } }));
        }
      }, 200);
    });
  }
  function state() { return hostState; }
  /* which targets of a feature exist in this build (needs the app loaded for host targets) */
  function available(feature) {
    var f = FEATURES[feature], w = hostState === 'ready' ? hw() : null;
    var ok = f.targets.filter(function (t) { if (t.kind === 'page') return pageOK(t); try { return !!(w && t.test(w)); } catch (e) { return false; } });
    var first = ok.filter(function (t) { return !t.fallback; });
    if (feature === 'type3d') return (first.length ? first : ok).slice(0, 1);        // one way in: the module, else its page
    return first.length ? first : ok;
  }
  /* a page target counts once the page is known to be there (a build may not ship it, e.g. hologram/ is not on main) */
  var probed = {};
  function pageOK(t) {
    if (t.abs) return true;                                           // another site: nothing to ask, it is the last resort
    var u = pageUrl(t);
    if (!/^https?:$/.test(location.protocol)) return true;          // the app bundle: no way to ask, the file list decides
    if (probed[u] === undefined) {
      probed[u] = null;
      try { fetch(u, { method: 'HEAD', cache: 'no-store' }).then(function (r) { probed[u] = r.ok; }, function () { probed[u] = false; }).then(function () { root.dispatchEvent(new CustomEvent('spatialhome:host', { detail: { ready: true } })); }); } catch (e) { probed[u] = false; }
    }
    return probed[u] !== false;
  }
  function needsHost(feature) { return !EMBED && FEATURES[feature].targets.some(function (t) { return t.kind === 'host'; }); }

  function allHost() { var a = []; Object.keys(FEATURES).forEach(function (k) { FEATURES[k].targets.forEach(function (t) { if (t.kind === 'host' && !t.base) a.push(t); }); }); return a; }
  function closeOthers(keep) {
    var w = hw(); if (!w) return;
    allHost().forEach(function (t) { if (t === keep) return; try { if (t.test(w) && t.isOpen(w) && (t.id !== 'MinestUniverse' || !keep || keep.id !== 'MinestUniverse')) t.close(w); } catch (e) {} });
    try { if (w.MinestOia && w.MinestOia.isOpen && w.MinestOia.isOpen() && (!keep || keep.id !== 'MinestOpenWorldsModal')) w.MinestOia.close(); } catch (e) {}
  }
  /* Duo build, outer-screen size: the app starts under its Glance page (.duo-gl), which would cover the feature.
     Its own "完整 App ›" button (.duo-full) is pressed, as a user would. */
  function clearGlance(w) {
    try { var g = w.document.querySelector('.duo-gl'); if (g && !g.hidden && w.getComputedStyle(g).display !== 'none') { var b = g.querySelector('.duo-full'); if (b) b.click(); } } catch (e) {}
  }
  /* show a target. Returns false if it could not be opened. */
  function show(t) {
    var w = hw();
    if (t.kind === 'host') {
      if (!w) return false;
      try { clearGlance(w); closeOthers(t); if (!t.isOpen(w) || t.base) t.open(w); } catch (e) { if (root.console) console.warn('Spatial Home: entry failed', t.id, e); return false; }
      if (pageFrame) pageFrame.classList.remove('on');
      if (EMBED) wrap.classList.remove('on');
      else { hostFrame.classList.add('on'); wrap.classList.add('on'); try { hostFrame.focus(); w.focus(); } catch (e2) {} }
    } else {
      if (!pageFrame) { pageFrame = document.createElement('iframe'); pageFrame.className = 'sh-frame'; pageFrame.setAttribute('allow', 'camera; microphone; fullscreen; autoplay; xr-spatial-tracking; accelerometer; gyroscope'); wrap.appendChild(pageFrame); }
      var abs = pageUrl(t);
      if (pageFrame.dataset.url !== abs) { pageFrame.dataset.url = abs; pageFrame.src = abs; }
      pageFrame.classList.add('on'); if (hostFrame) hostFrame.classList.remove('on'); wrap.classList.add('on');
    }
    current = t; seenOpen = false; pill.hidden = false; pill.classList.remove('mini'); pill.textContent = '⌂ Home';
    clearTimeout(pill._mini); pill._mini = setTimeout(function () { if (!pill.hidden) { pill.classList.add('mini'); pill.textContent = '⌂'; } }, 2500);
    if (onShow) onShow(t);
    clearInterval(poll);
    if (t.kind === 'host' && !t.base && !t.sticky) poll = setInterval(function () {          // the feature's own ✕ brings you home
      var open = false; try { open = t.isOpen(hw()); } catch (e) {}
      if (open) seenOpen = true; else if (seenOpen) leave('closed');
    }, 250);
    return true;
  }
  function isLive(t) { if (t.kind !== 'host' || t.base) return false; try { var w = hw(); return !!(w && t.test(w) && t.isOpen(w)); } catch (e) { return false; } }
  function leave(why) { if (!current) return; clearInterval(poll); var t = current; current = null; if (onLeave) onLeave(t, why); }
  function hide() { clearTimeout(pill._mini); pill.hidden = true; wrap.classList.remove('on'); if (hostFrame) hostFrame.classList.remove('on'); if (pageFrame) pageFrame.classList.remove('on'); }
  /* leave Spatial Home for the plain app (the board): what the room opened is put away the feature's own way */
  function release() { clearInterval(poll); current = null; closeOthers(null); hide(); }

  root.SpatialBridge = { FEATURES: FEATURES, EMBED: EMBED, init: init, load: load, state: state, available: available, isLive: isLive, needsHost: needsHost, show: show, hide: hide, leave: leave, release: release, appUrl: appUrl, current: function () { return current; }, hostWindow: hw };
})(window);

/* Stand Mode V1.0 — Octo Clock + My Collection Showcase. A desk display laid over the page (stand.css); it only reads
   what Minest already has: the Octo model Pet Raising and the Mini Pet load, the shared outfit (MinestCosmetics), the Mini
   Pet's mirrored state, board cards and their covers, Visual Library records (MinestKnowledge 'ki:cap:entity:…'), the 3D
   asset thumbnails My World caches (MinestAssets3D.thumb). Nothing is copied into new content storage — the settings,
   the rendered Octo poses and an opt-in StandBy snapshot are all it keeps.
   Open: MinestStand.open() · location hash #stand · Settings Studio ▸ 🕰 Stand. */
(function () {
  'use strict';
  if (window.MinestStand) return;
  var KEY = 'minest.stand.v1', root = null, stage = null, timers = [], slide = 0, items = [], idleT = 0, authUid;
  var D = { mode: 'both', clock: 'minimal', fmt: 'auto', extra: 'greeting', show: 'museum', src: { type: 'recent' }, rotate: 30, dim: 0, theme: 'auto', standby: false };
  function prefs() { var p = {}; try { p = JSON.parse(localStorage.getItem(KEY) || '{}') || {}; } catch (e) {} return Object.assign({}, D, p, { src: Object.assign({}, D.src, p.src || {}) }); }
  function setPref(k, v) { var p = prefs(); p[k] = v; try { localStorage.setItem(KEY, JSON.stringify(p)); } catch (e) {} }
  function esc(v) { return String(v == null ? '' : v).replace(/[&<>"']/g, function (c) { return { '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' }[c]; }); }
  function zh() { return /^zh/i.test(navigator.language || ''); }
  function later(fn, ms) { var t = setTimeout(fn, ms); timers.push(t); return t; }
  function clearTimers() { timers.forEach(clearTimeout); timers = []; }

  /* ---------- small IndexedDB cache (rendered Octo poses, the StandBy snapshot) ---------- */
  var dbP = null;
  function db() {
    if (!dbP) dbP = new Promise(function (res) { try { var r = indexedDB.open('minest-stand', 1); r.onupgradeneeded = function () { r.result.createObjectStore('kv'); }; r.onsuccess = function () { res(r.result); }; r.onerror = function () { res(null); }; } catch (e) { res(null); } });
    return dbP;
  }
  function idbGet(k) { return db().then(function (d) { return d ? new Promise(function (res) { var q = d.transaction('kv').objectStore('kv').get(k); q.onsuccess = function () { res(q.result); }; q.onerror = function () { res(null); }; }) : null; }); }
  function idbSet(k, v) { return db().then(function (d) { if (!d) return; var t = d.transaction('kv', 'readwrite'); if (v == null) t.objectStore('kv').delete(k); else t.objectStore('kv').put(v, k); }); }

  /* ---------- time ---------- */
  function hour12() { var f = prefs().fmt; return f === '12' ? true : f === '24' ? false : undefined; }   // auto: the locale decides
  function timeParts(d) {
    var parts = new Intl.DateTimeFormat(undefined, { hour: 'numeric', minute: '2-digit', hour12: hour12() }).formatToParts(d), t = '', ap = '';
    parts.forEach(function (p) { if (p.type === 'dayPeriod') ap = p.value; else t += p.value; });
    return { t: t.trim(), ap: ap.trim() };
  }
  function dateText(d) { return new Intl.DateTimeFormat(undefined, { weekday: 'long', month: 'long', day: 'numeric' }).format(d); }
  function greeting(d) {
    var h = d.getHours(), z = zh();
    if (h < 5) return z ? '夜深了，早点休息' : 'Late night — rest soon';
    if (h < 12) return z ? '早上好' : 'Good morning';
    if (h < 18) return z ? '下午好' : 'Good afternoon';
    return z ? '晚上好' : 'Good evening';
  }
  function timeHtml(d) { var p = timeParts(d); return '<div class="mst-time">' + esc(p.t) + (p.ap ? '<span class="ap">' + esc(p.ap) + '</span>' : '') + '</div>'; }

  /* the next study word: the list GPT Study / the car flashcards are on (read only) */
  function nextWord() {
    try {
      var CF = window.MinestCarFlash; if (!CF || !CF.sources) return null;
      var src = CF.sources(); if (!src.length) return null;
      var rec = null; try { rec = JSON.parse(localStorage.getItem('minest.gptstudy.v1') || 'null'); } catch (e) {}
      var best = null, at = -1;
      src.forEach(function (s) { var L = rec && rec.lists && rec.lists[s.id], t = L ? (L.last || 0) : -1; if (t > at) { at = t; best = s; } });
      var s = best || src[0], list = CF.itemsOf(s, 'auto'); if (!list.length) return null;
      var L = rec && rec.lists && rec.lists[s.id], it = null;
      if (L && L.current) list.some(function (x) { if (x.id === L.current) { it = x; return true; } return false; });
      return { word: (it || list[0]).word, list: s.title };
    } catch (e) { return null; }
  }
  function extraHtml(d) {
    var x = prefs().extra;
    if (x === 'greeting') return '<div class="mst-greet">' + esc(greeting(d)) + '</div>';
    if (x === 'word') { var w = nextWord(); return w ? '<div class="mst-word"><small>' + (zh() ? '下一个词' : 'Next word') + '</small><b>' + esc(w.word) + '</b></div>' : ''; }
    return '';
  }

  /* ---------- Octo: still poses rendered from the same model and outfit as the Mini Pet (one frame each, then cached) ---------- */
  var POSES = { happy: { clip: 'happy', at: .45 }, sleeping: { clip: 'idle', at: 0, tilt: true }, curious: { clip: 'look', at: .5 }, relaxing: { clip: 'idle', at: .3 } };
  function poseNow(d) {
    var base = null; try { base = (JSON.parse(localStorage.getItem('minest.octo.mirror.v1') || 'null') || {}).base; } catch (e) {}
    var h = d.getHours();
    if (base === 'sleep_float' || h >= 22 || h < 6) return 'sleeping';
    if (h < 11) return 'happy';
    if (h < 17) return 'curious';
    return 'relaxing';
  }
  var octoMem = {}, octoJobs = {}, model = null;
  function asset(p) { return window.minestPetAsset ? window.minestPetAsset(p) : p; }
  function loadModel() {
    if (model) return model;
    model = new Promise(function (res) {
      var tries = 0;
      (function wait() {
        if (!(window.THREE && THREE.GLTFLoader)) { if (++tries > 80) return res(null); return setTimeout(wait, 100); }
        var urls = [asset('octopus-pet-raising-v6/models/avatar_web_rigged_v23j.glb'), asset('octopus-pet-raising-v6/models/avatar_web_rigged_v23.glb'), asset('avatar_web_rigged_v23.glb')];
        (function next(i) { if (i >= urls.length) return res(null); new THREE.GLTFLoader().load(urls[i], function (g) { res(g); }, undefined, function () { next(i + 1); }); })(0);
      })();
    });
    return model;
  }
  function outfitKey() { try { var st = window.MinestCosmetics && MinestCosmetics.getState(); return JSON.stringify((st && st.equippedBySlot) || {}).replace(/[^a-z0-9_]/gi, '').slice(0, 60); } catch (e) { return ''; } }
  // one pose at a time: they share the one model, and a model sits in one scene at a time
  var renderQ = Promise.resolve();
  function renderPose(pose) { var job = renderQ.then(function () { return renderPose1(pose); }); renderQ = job.catch(function () {}); return job; }
  function renderPose1(pose) {
    return loadModel().then(function (gltf) {
      if (!gltf) return null;
      var T = window.THREE, P = POSES[pose] || POSES.happy, S = 360;
      var canvas = document.createElement('canvas'), r;
      try { r = new T.WebGLRenderer({ canvas: canvas, alpha: true, antialias: true, preserveDrawingBuffer: true, powerPreference: 'low-power' }); } catch (e) { return null; }
      r.setPixelRatio(1); r.setSize(S, S, false); r.setClearColor(0, 0); r.outputColorSpace = T.SRGBColorSpace;   // as the Mini Pet sets it (same look) r.toneMapping = T.ACESFilmicToneMapping; r.toneMappingExposure = 1.28;
      var scene = new T.Scene(), cam = new T.PerspectiveCamera(30, 1, .01, 100);
      scene.add(new T.HemisphereLight(0xfff5f8, 0xe8d9f5, .85)); scene.add(new T.AmbientLight(0xffffff, .85));
      [[0xfff9f2, 2.6, 2.8, 3.5, 3.2], [0xf5eaff, .85, -3, 1.2, 2], [0xffffff, 2, 0, 2.8, -3.2], [0xfff0f6, .75, 0, -3, 1]].forEach(function (l) { var L = new T.DirectionalLight(l[0], l[1]); L.position.set(l[2], l[3], l[4]); scene.add(L); });
      var av = (T.SkeletonUtils && T.SkeletonUtils.clone) ? T.SkeletonUtils.clone(gltf.scene) : gltf.scene;
      scene.add(av);
      var clips = {}; (gltf.animations || []).forEach(function (c) { clips[c.name] = c; });
      var clip = clips[P.clip] || clips.idle || (gltf.animations || [])[0];
      if (clip) { var mx = new T.AnimationMixer(av), a = mx.clipAction(clip); a.play(); mx.setTime(clip.duration * P.at); }
      if (P.tilt) { av.rotation.z = .22; av.rotation.x = .12; }
      var done = function () {
        av.updateMatrixWorld(true);
        var box = new T.Box3().setFromObject(av), c = box.getCenter(new T.Vector3()), s = box.getSize(new T.Vector3()), m = Math.max(s.x, s.y, s.z) || 1;
        cam.position.set(c.x, c.y + m * .04, c.z + m * 1.95); cam.lookAt(c);
        r.render(scene, cam);
        var url = ''; try { url = canvas.toDataURL('image/png'); } catch (e) {}
        r.dispose(); if (av !== gltf.scene) scene.remove(av); else { scene.remove(av); av.rotation.set(0, 0, 0); }
        return url || null;
      };
      // the shared outfit (crown…) goes on first, as the Mini Pet wears it
      if (window.MinestCosmetics && MinestCosmetics.watchModel && !av.__mstDressed) { av.__mstDressed = true; try { MinestCosmetics.watchModel(av, T); } catch (e) {} return new Promise(function (res) { setTimeout(function () { res(done()); }, 700); }); }
      return done();
    });
  }
  function octoImg(pose) {
    var k = 'octo:' + pose + ':' + outfitKey();
    if (octoMem[k]) return Promise.resolve(octoMem[k]);
    if (octoJobs[k]) return octoJobs[k];
    octoJobs[k] = idbGet(k).then(function (u) {
      if (u) return u;
      return renderPose(pose).then(function (url) { if (url) idbSet(k, url); return url; });
    }).then(function (u) { if (u) octoMem[k] = u; delete octoJobs[k]; return u; });
    return octoJobs[k];
  }
  function octoHtml(pose) {
    return '<div class="mst-octo" data-pose="' + pose + '"><span class="ph">🐙</span>' + (pose === 'sleeping' ? '<span class="mst-zz">z z</span>' : '') + '</div>';
  }
  function fillOcto(scope) {
    [].forEach.call(scope.querySelectorAll('.mst-octo'), function (o) {
      var pose = o.getAttribute('data-pose');
      octoImg(pose).then(function (u) { if (!u || !o.isConnected) return; var ph = o.querySelector('.ph'); if (ph) ph.remove(); if (!o.querySelector('img')) { var im = new Image(); im.alt = ''; im.src = u; im.className = 'mst-fade'; o.insertBefore(im, o.firstChild); } });
    });
  }

  /* ---------- low-poly pieces (SVG) ---------- */
  var SV = {
    floor: '<svg class="floor" viewBox="0 0 400 120" preserveAspectRatio="none"><polygon points="0,60 60,40 120,58 190,36 260,56 330,38 400,54 400,120 0,120" fill="#c9b58a"/><polygon points="0,78 70,62 150,80 230,64 310,82 400,70 400,120 0,120" fill="#b39c6f"/><polygon points="40,62 58,8 74,60" fill="#3f8f6a"/><polygon points="58,60 70,22 84,60" fill="#2f7656"/><polygon points="300,58 318,14 332,58" fill="#3f8f6a"/><polygon points="230,70 262,48 292,70 270,82 240,80" fill="#8b8f99"/><polygon points="262,48 292,70 270,82" fill="#6f737c"/></svg>',
    desk: '<svg class="desk" viewBox="0 0 400 140" preserveAspectRatio="none"><polygon points="0,30 400,18 400,140 0,140" fill="#7a5238"/><polygon points="0,30 400,18 400,34 0,46" fill="#9a6a48"/><polygon points="0,46 400,34 400,40 0,52" fill="#5e3e2a"/></svg>',
    lamp: '<svg class="lamp" viewBox="0 0 80 140"><polygon points="10,48 40,8 70,48" fill="#e9b25d"/><polygon points="40,8 70,48 52,48" fill="#c98f3c"/><rect x="37" y="48" width="6" height="74" fill="#3a2a22"/><polygon points="18,122 62,122 54,134 26,134" fill="#3a2a22"/><ellipse cx="40" cy="52" rx="26" ry="5" fill="#ffd590" opacity=".55"/></svg>',
    shelf: '<svg class="board" viewBox="0 0 400 40" preserveAspectRatio="none"><polygon points="0,0 400,0 392,14 8,14" fill="#a0724c"/><polygon points="8,14 392,14 392,22 8,22" fill="#6e4b31"/><polygon points="40,22 52,22 46,40" fill="#4f3624"/><polygon points="348,22 360,22 354,40" fill="#4f3624"/></svg>',
    plinth: '<svg class="plinth" viewBox="0 0 200 60"><polygon points="20,0 180,0 196,14 4,14" fill="#d9d4cb"/><polygon points="4,14 196,14 188,52 12,52" fill="#bdb6aa"/><polygon points="100,14 196,14 188,52 100,52" fill="#a59e92"/><polygon points="12,52 188,52 184,60 16,60" fill="#8a8377"/></svg>'
  };
  function bubbles() { var h = ''; [[14, 18, 9], [20, 30, 6], [12, 40, 5], [34, 22, 5], [42, 36, 4]].forEach(function (b) { h += '<i class="bub" style="left:' + b[0] + '%;top:' + b[1] + '%;width:' + b[2] + 'px;height:' + b[2] + 'px"></i>'; }); return h; }

  /* ---------- Octo Clock ---------- */
  function clockHtml() {
    var d = new Date(), st = prefs().clock, pose = poseNow(d);
    if (st === 'aquarium') return '<div class="mst-cl-aq"><div class="mst-tank"><div class="rays"></div>' + SV.floor + bubbles() + octoHtml(pose) +
      '<div class="face">' + timeHtml(d) + '<div class="mst-date">' + esc(dateText(d)) + '</div>' + extraHtml(d) + '</div><div class="glass"></div></div></div>';
    if (st === 'cozy') return '<div class="mst-cl-cozy"><div class="notes">' + extraHtml(d) + '</div>' + SV.lamp + SV.desk + octoHtml(pose) +
      '<div class="mst-clockface">' + timeHtml(d) + '<div class="mst-date">' + esc(dateText(d)) + '</div></div></div>';
    return '<div class="mst-cl-min">' + timeHtml(d) + '<div class="mst-meta"><div class="mst-date">' + esc(dateText(d)) + '</div>' + extraHtml(d) + '</div>' + octoHtml(pose) + '</div>';
  }
  function drawClock() {
    var c = root && root.querySelector('.mst-clock'); if (!c) return;
    c.innerHTML = clockHtml(); fillOcto(c);
  }
  // the minute changes: redraw right on it (no seconds shown, so no per-second work)
  function tick() { drawClock(); var n = new Date(); later(tick, (60 - n.getSeconds()) * 1000 - n.getMilliseconds() + 30); }

  /* ---------- My Collection: what Minest already saved ---------- */
  function KN() { return window.MinestKnowledge; }
  function coverOf(c) { var cv = c && c.cover; return cv && (cv.value || cv.url) && (!cv.type || cv.type === 'image') ? (cv.value || cv.url) : ''; }
  function okUrl(u) { if (!u) return ''; if (/^https:/i.test(u)) return u; if (/^blob:/i.test(u) && window.MinestVisualImages && MinestVisualImages.owns && MinestVisualImages.owns(u)) return u; if (/^data:image\//i.test(u)) return u; return ''; }
  function boardsAll() { try { return (window.MinestAI && MinestAI.boards && MinestAI.boards()) || []; } catch (e) { return []; } }
  function allItems() {
    var out = [], K = KN();
    boardsAll().forEach(function (b) {
      (b.columns || []).forEach(function (col) {
        (col.cards || []).forEach(function (c) {
          var one = function (s, parent) {
            if (!s || !s.id) return;
            var key = K && K.get('pk:' + s.id), rec = key ? K.get(key) : null, img = coverOf(s);
            if (rec) img = img || rec.img || (window.MinestVisualImages ? MinestVisualImages.url(rec.userImage || rec.image || {}) : '');
            var sub = rec && rec.providerDisplay && rec.providerDisplay.text ? String(rec.providerDisplay.text) : (parent ? parent.title : col.title);
            out.push({ id: s.id, parent: parent ? parent.id : null, bid: b.id, board: b.title, col: col.id, colTitle: col.title, title: s.title || (rec && rec.title) || '', sub: sub || '',
              img: okUrl(img), type: (rec && rec.entityType) || (parent ? 'item' : 'card'), at: s.createdAt || (rec && rec.at) || c.createdAt || 0, fav: favCol(col) || (parent && favTitle(parent.title)) });
          };
          if (c.stack && c.stack.length) { one(c, null); c.stack.forEach(function (s) { one(s, c); }); } else one(c, null);
        });
      });
    });
    return out;
  }
  // Minest has no favourite flag on cards; its "My Favorites" lists (quick lists and the Visual Library preset) are the favourites
  function favTitle(t) { return /favou?rites?|收藏|最爱|喜欢/i.test(String(t || '')); }
  function favCol(col) { return /-d-quick-favorites$/.test(col.id) || favTitle(col.title); }
  function source(p) {
    var all = allItems(), s = p.src || {}, list;
    if (s.type === 'list') list = all.filter(function (x) { return x.bid === s.bid && x.col === s.col; });
    else if (s.type === 'board') list = all.filter(function (x) { return x.bid === s.bid; });
    else if (s.type === 'fav') list = all.filter(function (x) { return x.fav; });
    else if (s.type === 'manual') { var ids = s.ids || []; list = ids.map(function (id) { return all.find(function (x) { return x.id === id; }); }).filter(Boolean); }
    else {   // pictures first; when there are few, the newest cards fill in as typeset pieces
      var byNew = function (a, b) { return (b.at || 0) - (a.at || 0); }, pics = all.filter(function (x) { return x.img; }).sort(byNew).slice(0, 18);
      list = pics.length >= 12 ? pics : pics.concat(all.filter(function (x) { return !x.img && x.title && !x.parent; }).sort(byNew).slice(0, 12 - pics.length));
    }
    // list cards that only hold others (a stack's own top card) stay out when their pieces are shown
    var parents = {}; list.forEach(function (x) { if (x.parent) parents[x.parent] = 1; });
    list = list.filter(function (x) { return !parents[x.id]; });
    // pieces with a picture first; text-only ones still show (as a typeset card)
    return list.filter(function (x) { return x.img; }).concat(list.filter(function (x) { return !x.img && x.title; })).slice(0, 24);
  }
  function artHtml(x, i) {
    return '<span class="mst-art">' + (x.img ? '<img alt="" loading="lazy" decoding="async" src="' + esc(x.img) + '" data-mst-i="' + i + '">' : txtHtml(x)) + '</span>';
  }
  function txtHtml(x) { return '<span class="txt"><i>' + esc(x.colTitle || x.board) + '</i><b>' + esc(x.title) + '</b></span>'; }
  function plaque(x) { return '<div class="mst-plaque"><b>' + esc(x.title) + '</b><span>' + esc([x.sub, x.board].filter(Boolean).join(' · ')) + '</span></div>'; }
  function itemBtn(x, i, extra) { return '<button type="button" class="mst-item" data-mst-open="' + i + '"' + (extra || '') + ' aria-label="' + esc(x.title) + '">' + artHtml(x, i) + '</button>'; }
  function arFor(x) { return /album|song|artist|music|image|photo/.test(x.type) ? '1/1' : '3/4'; }
  function showHtml() {
    var p = prefs();
    if (!items.length) return '<div class="mst-empty"><div><b>' + (zh() ? '这里还没有展品' : 'Nothing on show yet') + '</b>' +
      (zh() ? '在 ⚙ 里选一个 list、看板或几张卡片，或者先用 Visual Library 收藏一些海报、书和专辑。' : 'Pick a list, a board or a few cards in ⚙ — or save posters, books and albums with Visual Library first.') + '</div></div>';
    var n = items.length, at = slide % n, pick = function (k) { var o = []; for (var j = 0; j < Math.min(k, n); j++) o.push((at + j) % n); return o; };
    if (p.show === 'shelf') {
      var idx = pick(n >= 5 ? 5 : Math.max(3, Math.min(n, 4))), hs = [.78, .94, .86, 1, .82];
      return '<div class="mst-sh-shelf"><div class="mst-shelf-row" style="--n:' + idx.length + '">' + idx.map(function (i, j) { var ar = arFor(items[i]); return itemBtn(items[i], i, ' style="--ar:' + ar + ';--arw:' + (ar === '1/1' ? 1 : .75) + ';--hf:' + hs[j % 5] + '"'); }).join('') + '</div>' + SV.shelf + plaque(items[idx[Math.floor(idx.length / 2)]]) + '</div>';
    }
    if (p.show === 'wall') {
      var w = pick(Math.min(5, n));
      return '<div class="mst-sh-wall"><div class="mst-wall" data-n="' + w.length + '">' + w.map(function (i) { return itemBtn(items[i], i); }).join('') + '</div></div>';
    }
    var x = items[at];
    if (p.show === 'mini') return '<div class="mst-sh-mini"><div class="mst-diorama"><div class="mst-dome">' + itemBtn(x, at, ' style="--ar:' + (x.img ? arFor(x) : '3/4') + '" data-mst-3d="' + at + '"') + '</div>' + SV.plinth + '</div>' + plaque(x) + '</div>';
    return '<div class="mst-sh-museum">' + itemBtn(x, at, ' style="--ar:' + arFor(x) + '"') + plaque(x) + '</div>';
  }
  // Miniature Display: the piece's own low-poly object when My World has one cached (its list's or island's skin)
  function mini3d(scope) {
    var b = scope.querySelector('[data-mst-3d]'); if (!b || !window.MinestUniverse || !MinestUniverse.assets || !MinestUniverse.skins) return;
    var x = items[+b.getAttribute('data-mst-3d')]; if (!x) return;
    var aid = null; try { var parent = null; boardsAll().some(function (bd) { return bd.id === x.bid && (bd.columns || []).some(function (c) { return (c.cards || []).some(function (cd) { if (cd.id === (x.parent || x.id)) { parent = cd; return true; } return false; }); }); });
      aid = (parent && MinestUniverse.skins.list && MinestUniverse.skins.list(parent)) || (MinestUniverse.skins.world && MinestUniverse.skins.world(x.bid)); } catch (e) {}
    if (!aid) return;
    MinestUniverse.assets().then(function (A) { return A && A.thumb ? A.thumb(aid) : ''; }).then(function (u) {
      if (!u || !b.isConnected) return;
      var art = b.querySelector('.mst-art'); art.innerHTML = '<img alt="" src="' + esc(u) + '" style="object-fit:contain;background:transparent">'; b.style.setProperty('--ar', '1'); b.style.boxShadow = 'none'; b.style.transform = 'none';
    }).catch(function () {});
  }
  function drawShow() {
    var s = root && root.querySelector('.mst-show'); if (!s) return;
    s.innerHTML = showHtml(); mini3d(s);
    // a picture that fails to load turns into the typeset card instead of a broken-image icon
    [].forEach.call(s.querySelectorAll('img[data-mst-i]'), function (im) { im.addEventListener('error', function () { var x = items[+im.getAttribute('data-mst-i')]; var sp = im.parentNode; if (sp && x) sp.innerHTML = txtHtml(x); }); });
    dots();
  }
  function dots() {
    var d = root.querySelector('.mst-dots'); if (!d) return; var n = Math.min(items.length, 12), p = prefs();
    d.innerHTML = p.mode !== 'clock' && n > 1 && (p.show === 'museum' || p.show === 'mini') ? Array.apply(null, Array(n)).map(function (_, i) { return '<i class="' + (i === slide % items.length ? 'on' : '') + '"></i>'; }).join('') : '';
  }
  function rotate() {
    var r = +prefs().rotate; if (!r || items.length < 2 || prefs().mode === 'clock') return;
    later(function () { if (document.hidden) return rotate(); slide = (slide + 1) % items.length; drawShow(); rotate(); }, r * 1000);
  }
  function loadItems() { items = source(prefs()); slide = 0; }

  /* ---------- the display ---------- */
  function theme() { var t = prefs().theme; if (t === 'auto') return matchMedia && matchMedia('(prefers-color-scheme: light)').matches ? 'light' : 'dark'; return t; }
  function build() {
    var p = prefs();
    root.setAttribute('data-theme', theme());
    root.innerHTML = '<div class="mst-stage" data-mode="' + p.mode + '">' + (p.mode !== 'show' ? '<div class="mst-pane mst-clock"></div>' : '') + (p.mode !== 'clock' ? '<div class="mst-pane mst-show"></div>' : '') + '</div>' +
      '<div class="mst-dots"></div><div class="mst-dim" style="opacity:' + (+p.dim || 0) + '"></div>' +
      '<div class="mst-ui"><button type="button" data-mst="set" aria-label="Stand settings">⚙︎</button><button type="button" data-mst="close" aria-label="Close Stand Mode">✕</button></div>' +
      '<div class="mst-set" aria-hidden="true"></div>';
    clearTimers(); loadItems(); tick(); drawShow(); rotate(); wake();
    // Visual Library pictures of this device come back from IndexedDB a moment after load: pick them up once
    later(function () { if (items.some(function (x) { return !x.img; })) { var had = items.length; loadItems(); if (items.length || had) drawShow(); } }, 1600);
  }
  function wake() { if (!root) return; root.classList.remove('idle'); clearTimeout(idleT); idleT = setTimeout(function () { if (root && !root.querySelector('.mst-set.on')) root.classList.add('idle'); }, 4000); }
  function open(opts) {
    if (root) return;
    if (opts && typeof opts === 'object') Object.keys(opts).forEach(function (k) { setPref(k, opts[k]); });
    root = document.createElement('div'); root.className = 'mst'; root.setAttribute('role', 'dialog'); root.setAttribute('aria-label', 'Stand Mode');
    document.body.appendChild(root); document.documentElement.classList.add('mst-on');
    root.addEventListener('click', onClick); root.addEventListener('pointerdown', wake); root.addEventListener('change', onChange); root.addEventListener('input', onInput);
    build(); snapshot();
  }
  function close() {
    if (!root) return; clearTimers(); clearTimeout(idleT); root.remove(); root = null; document.documentElement.classList.remove('mst-on');
    if (location.hash === '#stand') try { history.replaceState(null, '', location.pathname + location.search); } catch (e) {}
  }
  function openItem(x) {
    close();
    try { if (window.MinestAI && MinestAI.openCard && (MinestAI.openCard(x.id) || (x.parent && MinestAI.openCard(x.parent)))) return; } catch (e) {}
    try { if (window.MinestAI && MinestAI.showList) MinestAI.showList(x.bid, x.col); } catch (e) {}
  }
  function onClick(e) {
    var b = e.target.closest('[data-mst]'), it = e.target.closest('[data-mst-open]');
    if (b) {
      var w = b.getAttribute('data-mst');
      if (w === 'close') return close();
      if (w === 'set') return settings(true);
      if (w === 'set-x') return settings(false);
      if (w === 'seg') { var k = b.getAttribute('data-k'), v = b.getAttribute('data-v'); setPref(k, /^\d+(\.\d+)?$/.test(v) ? +v : v === 'true' ? true : v === 'false' ? false : v); if (k === 'standby') snapshot(); build(); settings(true); return; }
      if (w === 'src') { var t = b.getAttribute('data-v'), s = prefs().src; s.type = t; setPref('src', s); build(); settings(true); return; }
      if (w === 'pick') { var id = b.getAttribute('data-id'), s2 = prefs().src, ids = (s2.ids || []).slice(), i = ids.indexOf(id); if (i >= 0) ids.splice(i, 1); else if (ids.length < 12) ids.push(id); s2.ids = ids; s2.type = 'manual'; setPref('src', s2); b.classList.toggle('on', ids.indexOf(id) >= 0); loadItems(); drawShow(); snapshot(); return; }
      return;
    }
    if (it && !e.target.closest('.mst-set')) { var x = items[+it.getAttribute('data-mst-open')]; if (x) openItem(x); return; }
    if (!e.target.closest('.mst-set')) settings(false);
  }
  function onChange(e) {
    var t = e.target;
    if (t.matches('[data-mst-board]')) { var s = prefs().src; s.bid = t.value; s.col = null; setPref('src', s); build(); settings(true); }
    if (t.matches('[data-mst-list]')) { var v = t.value.split('\u0001'), s2 = prefs().src; s2.bid = v[0]; s2.col = v[1]; setPref('src', s2); build(); settings(true); }
    if (t.matches('[data-mst-standby]')) { setPref('standby', !!t.checked); snapshot(); }
  }
  function onInput(e) { if (e.target.matches('[data-mst-dim]')) { var v = +e.target.value / 100; setPref('dim', v); var d = root.querySelector('.mst-dim'); if (d) d.style.opacity = v; } }

  /* settings: what is shown, how it looks, where the pieces come from, and whether the system StandBy widget may show them */
  function seg(k, opts) { var cur = String(prefs()[k]); return '<div class="mst-seg">' + opts.map(function (o) { return '<button type="button" data-mst="seg" data-k="' + k + '" data-v="' + o[0] + '" class="' + (String(o[0]) === cur ? 'on' : '') + '">' + esc(o[1]) + '</button>'; }).join('') + '</div>'; }
  function settings(on) {
    var s = root && root.querySelector('.mst-set'); if (!s) return;
    if (!on) { s.classList.remove('on'); s.setAttribute('aria-hidden', 'true'); wake(); return; }
    var p = prefs(), z = zh(), src = p.src || {}, B = boardsAll();
    var srcOpts = [['recent', z ? '最近收藏' : 'Recent'], ['fav', z ? '收藏夹' : 'Favorites'], ['list', 'List'], ['board', z ? '看板' : 'Board'], ['manual', z ? '手选' : 'Pick']];
    var h = '<h3>' + (z ? '桌面模式' : 'Stand Mode') + '<button type="button" data-mst="set-x" aria-label="Close">✕</button></h3>' +
      '<h4>' + (z ? '显示' : 'Display') + '</h4>' + seg('mode', [['clock', z ? '只有时钟' : 'Clock'], ['show', z ? '只有收藏' : 'Collection'], ['both', z ? '时钟 + 收藏' : 'Clock + Collection']]) +
      '<h4>' + (z ? '时钟样式' : 'Clock style') + '</h4>' + seg('clock', [['minimal', z ? '极简' : 'Minimal'], ['aquarium', z ? '水族箱' : 'Aquarium'], ['cozy', z ? '书桌' : 'Cozy Desk']]) +
      '<h4>' + (z ? '时间格式' : 'Time format') + '</h4>' + seg('fmt', [['auto', z ? '跟随系统' : 'System'], ['12', '12h'], ['24', '24h']]) +
      '<h4>' + (z ? '附加信息' : 'Secondary') + '</h4>' + seg('extra', [['greeting', z ? '问候' : 'Greeting'], ['word', z ? '下一个词' : 'Next word'], ['none', z ? '无' : 'None']]) +
      '<h4>' + (z ? '展示样式' : 'Showcase style') + '</h4>' + seg('show', [['museum', z ? '博物馆' : 'Museum'], ['shelf', z ? '收藏架' : 'Shelf'], ['wall', z ? '画廊墙' : 'Gallery Wall'], ['mini', z ? '微缩展台' : 'Miniature']]) +
      '<h4>' + (z ? '展品来源' : 'Collection') + '</h4><div class="mst-seg">' + srcOpts.map(function (o) { return '<button type="button" data-mst="src" data-v="' + o[0] + '" class="' + (src.type === o[0] ? 'on' : '') + '">' + o[1] + '</button>'; }).join('') + '</div>';
    if (src.type === 'board') h += '<select data-mst-board><option value="">' + (z ? '选择看板…' : 'Choose a board…') + '</option>' + B.map(function (b) { return '<option value="' + esc(b.id) + '"' + (b.id === src.bid ? ' selected' : '') + '>' + esc(b.title) + '</option>'; }).join('') + '</select>';
    if (src.type === 'list') h += '<select data-mst-list><option value="">' + (z ? '选择 list…' : 'Choose a list…') + '</option>' + B.map(function (b) { return '<optgroup label="' + esc(b.title) + '">' + (b.columns || []).map(function (c) { return '<option value="' + esc(b.id + '\u0001' + c.id) + '"' + (b.id === src.bid && c.id === src.col ? ' selected' : '') + '>' + esc(c.title) + '</option>'; }).join('') + '</optgroup>'; }).join('') + '</select>';
    if (src.type === 'fav') h += '<p class="note">' + (z ? '卡片没有单独的收藏标记：这里展示名字叫 “My Favorites / 收藏” 的 list 里的内容。' : 'Cards have no favourite flag: this shows what is in your “My Favorites” lists.') + '</p>';
    if (src.type === 'manual') { var ids = src.ids || [], pool = allItems().filter(function (x) { return x.img; }).sort(function (a, b) { return (b.at || 0) - (a.at || 0); }).slice(0, 60);
      h += '<p class="note">' + (z ? '最多选 12 件（' + ids.length + '/12）' : 'Up to 12 pieces (' + ids.length + '/12)') + '</p><div class="mst-pick">' + pool.map(function (x) { return '<button type="button" data-mst="pick" data-id="' + esc(x.id) + '" class="' + (ids.indexOf(x.id) >= 0 ? 'on' : '') + '" aria-label="' + esc(x.title) + '"><span class="mst-art"><img alt="" loading="lazy" src="' + esc(x.img) + '"></span></button>'; }).join('') + '</div>'; }
    h += '<h4>' + (z ? '轮换' : 'Rotation') + '</h4>' + seg('rotate', [[0, z ? '关' : 'Off'], [15, '15s'], [30, '30s'], [60, '1 min'], [300, '5 min']]) +
      '<h4>' + (z ? '外观' : 'Appearance') + '</h4>' + seg('theme', [['auto', z ? '跟随系统' : 'System'], ['dark', z ? '深色' : 'Dark'], ['light', z ? '浅色' : 'Light']]) +
      '<h4>' + (z ? '调暗' : 'Dim') + '</h4><input type="range" min="0" max="70" step="5" value="' + Math.round((+p.dim || 0) * 100) + '" data-mst-dim aria-label="Dim">' +
      '<h4>' + (z ? '系统待机显示 (StandBy)' : 'System StandBy') + '</h4><label class="tog"><input type="checkbox" data-mst-standby' + (p.standby ? ' checked' : '') + '><span>' +
      (z ? '允许 Minest 的待机小组件显示这里选中的展品（锁屏时别人也能看到）。不勾选时小组件只显示 Octo 时钟。' : 'Let Minest’s StandBy widget show the pieces chosen here (visible while the phone is locked). Off: the widget shows the Octo Clock only.') + '</span></label>' +
      '<p class="note">' + (z ? '屏幕常亮由系统控制；这里的调暗只作用于这个页面。' : 'Always-on behaviour is up to the system; Dim only affects this page.') + '</p>';
    s.innerHTML = h; s.classList.add('on'); s.setAttribute('aria-hidden', 'false'); root.classList.remove('idle');
  }

  /* ---------- StandBy snapshot (opt-in): a few small pictures + titles for the native widgets, never auth data ---------- */
  function shrink(url, max) {
    return new Promise(function (res) {
      if (!url) return res('');
      var im = new Image(); if (/^https:/i.test(url)) im.crossOrigin = 'anonymous';
      im.onload = function () { try { var k = Math.min(1, max / Math.max(im.naturalWidth, im.naturalHeight)), c = document.createElement('canvas'); c.width = Math.round(im.naturalWidth * k); c.height = Math.round(im.naturalHeight * k); c.getContext('2d').drawImage(im, 0, 0, c.width, c.height); res(c.toDataURL('image/jpeg', .82)); } catch (e) { res(''); } };
      im.onerror = function () { res(''); }; im.src = url;
    });
  }
  var snapT = 0;
  function snapshot() {
    clearTimeout(snapT);
    snapT = setTimeout(function () {
      var p = prefs(), d = new Date(), pose = poseNow(d);
      var poses = ['happy', 'sleeping', 'curious', 'relaxing'];
      Promise.all(poses.map(function (q) { return octoImg(q).then(function (u) { return shrink(u, 220); }); })).then(function (oct) {
        var base = { v: 1, at: Date.now(), clock: p.clock, fmt: p.fmt, extra: p.extra, word: (nextWord() || {}).word || '', pose: pose, octo: {} };
        poses.forEach(function (q, i) { if (oct[i]) base.octo[q] = oct[i]; });
        if (!p.standby) return base;   // personal pieces only after an explicit yes
        var pick = source(p).slice(0, 6);
        return Promise.all(pick.map(function (x) { return shrink(x.img, 360); })).then(function (imgs) {
          base.show = p.show; base.items = pick.map(function (x, i) { return { id: x.id, title: x.title, sub: x.sub || x.board, img: imgs[i] || '', link: 'minest://card/' + encodeURIComponent(x.id) }; });
          return base;
        });
      }).then(function (snap) {
        idbSet('snapshot', snap);
        try { if (window.webkit && webkit.messageHandlers && webkit.messageHandlers.minestBridge) webkit.messageHandlers.minestBridge.postMessage({ action: 'standSnapshot', snapshot: JSON.stringify(snap) }); } catch (e) {}
      });
    }, 800);
  }
  function clearPrivate() {
    var p = prefs(); if (p.src && p.src.ids) { p.src.ids = []; setPref('src', p.src); }
    setPref('standby', false); idbSet('snapshot', null); octoMem = {};
    try { if (window.webkit && webkit.messageHandlers && webkit.messageHandlers.minestBridge) webkit.messageHandlers.minestBridge.postMessage({ action: 'standSnapshot', snapshot: '' }); } catch (e) {}
    if (root) build();
  }
  // sign-out or another account: the chosen pieces and the StandBy snapshot go (Minest has no sign-out event of its own)
  (function watchAuth(tries) {
    try {
      if (window.firebase && firebase.apps && firebase.apps.length && firebase.auth) {
        firebase.auth().onAuthStateChanged(function (u) {
          var uid = u ? u.uid : null, was = authUid; authUid = uid;
          if (was === undefined) { try { var last = localStorage.getItem('minest.stand.uid'); if (last && last !== String(uid)) clearPrivate(); } catch (e) {} }
          else if (was !== uid) clearPrivate();
          try { localStorage.setItem('minest.stand.uid', String(uid)); } catch (e) {}
        });
        return;
      }
    } catch (e) {}
    if (tries < 60) setTimeout(function () { watchAuth(tries + 1); }, 1000);
  })(0);

  /* ---------- entries ---------- */
  document.addEventListener('visibilitychange', function () { if (!root) return; if (document.hidden) clearTimers(); else { tick(); rotate(); } });
  window.addEventListener('hashchange', function () { if (location.hash === '#stand') open(); });
  if (location.hash === '#stand') setTimeout(function () { open(); }, 1200);
  // the native app opens it from a StandBy widget (minest://stand) or a card link (minest://card/<id>)
  window.addEventListener('minest:stand', function (e) { var d = e.detail || {}; if (d.card) { var x = allItems().find(function (y) { return y.id === d.card; }); if (x) return openItem(x); } open(); });
  // Settings Studio gets a 🕰 Stand button under its tabs (next to the Duo's Lists / Wallpaper when those are there)
  function settingsEntry() {
    var tab = [].find.call(document.querySelectorAll('button'), function (b) { return b.textContent.trim() === 'Labels & Filters'; }), bar = tab && tab.parentElement && tab.parentElement.parentElement;
    if (!bar || bar.parentNode.querySelector('[data-mst-entry]')) return;
    var row = bar.nextElementSibling && bar.nextElementSibling.classList.contains('duo-set-tools') ? bar.nextElementSibling : null;
    var btn = document.createElement('button'); btn.type = 'button'; btn.setAttribute('data-mst-entry', ''); btn.innerHTML = '<span>🕰</span>Stand';
    btn.addEventListener('click', function () { var x = [].find.call(document.querySelectorAll('button'), function (y) { return y.textContent.trim() === 'Cancel'; }); if (x) x.click(); setTimeout(function () { open(); }, 260); });
    if (!row) { row = document.createElement('div'); row.className = 'duo-set-tools mst-set-tools'; bar.parentNode.insertBefore(row, bar.nextSibling); }
    row.appendChild(btn);
  }
  document.addEventListener('click', function (e) { var b = e.target.closest && e.target.closest('button[aria-label^="Board settings"]'); if (b) [300, 700, 1400].forEach(function (t) { setTimeout(settingsEntry, t); }); }, true);

  window.MinestStand = { open: open, close: close, isOpen: function () { return !!root; }, items: function () { return source(prefs()); }, snapshot: snapshot, renderPose: octoImg, clearPrivate: clearPrivate };
})();

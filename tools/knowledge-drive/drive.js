/* Minest My World — Knowledge Drive V1.0 (independent module, prototype stage)
   A first-person, low-poly drive through a Board's knowledge.
   Workspace = road network · Board = region · List = a named road ("Ecology Road") · Stack = a road section · Card = a billboard.
   Billboards only hold card refs ({bid, col, id, parent}); every read goes back to the live board through the provider, so cards
   are never copied and the Kanban data is never written. Auto drive is path following plus camera easing — no physics.
   Uses the page's three.js (r128 global). Open with MinestDrive.open({ source, provider }). */
(function () {
  'use strict';
  if (window.MinestDrive && window.MinestDrive.version) return;
  var VERSION = '1.0-proto.1', STORE = 'minest.drive.v1';
  var LEAD = 70, SP = 46, TAIL = 70, LANE = 1.9, ROAD_W = 4, BB_LAT = 9.5, VIEW = 340, BEHIND = 40, CHUNK = 50, NEAR_LOD = 125;
  var SPEEDS = [[7, '🐢', 'Slow'], [11, '🚗', 'Cruise'], [16, '🚀', 'Fast']];
  var PAL = ['#3d8bfd', '#22b07d', '#f08c2e', '#a46bf0', '#e8505b', '#14a3b8', '#d9a51c', '#5c7cfa'];

  // ---------------------------------------------------------------- small helpers
  function hash(s) { s = String(s); var h = 2166136261 >>> 0; for (var i = 0; i < s.length; i++) { h ^= s.charCodeAt(i); h = Math.imul(h, 16777619); } return h >>> 0; }
  function rng(seed) { var a = seed >>> 0; return function () { a = (a + 0x6D2B79F5) >>> 0; var t = a; t = Math.imul(t ^ (t >>> 15), t | 1); t ^= t + Math.imul(t ^ (t >>> 7), t | 61); return ((t ^ (t >>> 14)) >>> 0) / 4294967296; }; }
  function clamp(x, a, b) { return x < a ? a : x > b ? b : x; }
  function lerp(a, b, t) { return a + (b - a) * t; }
  function ease(t) { return t < .5 ? 2 * t * t : 1 - Math.pow(-2 * t + 2, 2) / 2; }
  function esc(s) { return String(s == null ? '' : s).replace(/[&<>"']/g, function (c) { return { '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' }[c]; }); }
  function load() { try { return JSON.parse(localStorage.getItem(STORE) || '{}') || {}; } catch (e) { return {}; } }
  function save(key, v) { try { var all = load(); all[key] = v; localStorage.setItem(STORE, JSON.stringify(all)); } catch (e) {} }
  function firstLine(s) { s = String(s || '').replace(/<[^>]+>/g, ' ').trim(); return s.split(/\n|。|\. /)[0].slice(0, 90); }

  // ---------------------------------------------------------------- data: the live board, read through a provider
  function defaultProvider() {
    return {
      boards: function () { try { return (window.MinestAI && MinestAI.boards && MinestAI.boards()) || []; } catch (e) { return []; } },
      openCard: window.MinestAI && MinestAI.openCard ? function (ref) { try { return MinestAI.openCard(ref.id); } catch (e) { return false; } } : null
    };
  }
  function findCard(P, ref) {   // live lookup each time (a card may have been edited, moved or stacked since)
    var hit = null;
    P.boards().some(function (b) {
      if (b.id !== ref.bid) return false;
      var cols = b.columns || [], own = cols.filter(function (c) { return c.id === ref.col; }).concat(cols.filter(function (c) { return c.id !== ref.col; }));
      return own.some(function (col) {
        return (col.cards || []).some(function (c) {
          if (c.id === ref.id) { hit = { card: c, list: col, board: b, parent: null }; return true; }
          return (c.stack || []).some(function (s) { if (s.id === ref.id) { hit = { card: s, list: col, board: b, parent: c }; return true; } return false; });
        });
      });
    });
    return hit;
  }
  function knowledge(id) { try { var K = window.MinestKnowledge, k = K && K.get('pk:' + id); return k ? K.get(k) : null; } catch (e) { return null; } }
  function okUrl(u) { if (!u) return ''; if (/^(https:|data:image\/|blob:)/i.test(u)) return u; if (/^\/|^\.\//.test(u)) return u; return ''; }
  function cardImage(c, rec) {
    var cv = c && c.cover, u = cv && (cv.value || cv.url) && (!cv.type || cv.type === 'image') ? (cv.value || cv.url) : '';
    if (!u && c && c.image) u = c.image;
    if (!u && rec) { u = rec.img || ''; try { if (!u && window.MinestVisualImages) u = MinestVisualImages.url(rec.userImage || rec.image || {}); } catch (e) {} }
    return okUrl(u);
  }
  function cardType(c, list, rec, img) {
    var t = String((rec && rec.entityType) || c.entityType || c.kind || c.type || '').toLowerCase(), L = String(list && list.title || '').toLowerCase();
    if (/book|novel/.test(t) || /\bbooks?\b|书/.test(L)) return 'book';
    if (/movie|film|tv|show|series/.test(t) || /movie|film|电影|影/.test(L)) return 'poster';
    if (/album|music|song|track/.test(t) || /album|music|音乐|专辑/.test(L)) return 'album';
    if (/person|people|artist|author|actor|portrait/.test(t) || /people|person|人物/.test(L)) return 'portrait';
    return img ? 'image' : 'typography';
  }
  function info(P, ref) {   // what a billboard / the reader shows, resolved now
    var h = findCard(P, ref); if (!h) return null;
    var c = h.card, rec = knowledge(c.id), img = cardImage(c, rec), back = c.back || c.meaning || '';
    return {
      ref: ref, card: c, list: h.list, board: h.board, parent: h.parent, img: img, type: cardType(c, h.list, rec, img),
      title: c.title || (rec && rec.title) || 'Untitled', zh: c.titleZh || '', sub: c.titleZh || firstLine(back) || firstLine(c.desc) || (rec && rec.providerDisplay && rec.providerDisplay.text) || '',
      back: back, desc: c.desc || '', notes: c.notes || c.note || '', checklist: c.checklistItems || [], labels: c.labels || [], emoji: c.emoji || '',
      sig: hash([c.title, c.titleZh, back, img, c.updatedAt || ''].join('|'))
    };
  }
  function roadName(t) {
    t = String(t || 'Untitled').replace(/\s*[(（]\s*\d+\s*[)）]\s*$/, '').trim() || 'Untitled';
    if (/\b(road|rd|street|st|avenue|ave|lane|way|drive|highway|boulevard)\.?$/i.test(t) || /(路|街|道)$/.test(t)) return t;
    return /[㐀-鿿]$/.test(t) ? t + '路' : t + ' Road';
  }
  function plan(P, src) {
    var boards = P.boards(), pick = src.type === 'workspace' ? boards : boards.filter(function (b) { return b.id === src.bid; }), roads = [];
    pick.forEach(function (b) {
      (b.columns || []).forEach(function (col) {
        if (col.archived) return;
        var items = [];
        (col.cards || []).forEach(function (c) {
          if (!c || c.archived) return;
          if (c.stack && c.stack.length) {
            items.push({ ref: { bid: b.id, col: col.id, id: c.id }, section: c.title || 'Section', sectionStart: 1 });
            c.stack.forEach(function (s) { if (s && s.id) items.push({ ref: { bid: b.id, col: col.id, id: s.id, parent: c.id }, section: c.title || 'Section' }); });
          } else items.push({ ref: { bid: b.id, col: col.id, id: c.id } });
        });
        if (items.length) roads.push({ id: b.id + '/' + col.id, bid: b.id, col: col.id, title: col.title || 'Untitled', name: roadName(col.title), region: b.title || 'Board', items: items, color: PAL[roads.length % PAL.length] });
      });
    });
    var start = 0;
    if (src.type === 'list') roads.forEach(function (r, i) { if (r.col === src.col && r.bid === src.bid) start = i; });
    return { key: src.type + ':' + (src.bid || '*') + (src.type === 'list' ? '/' + src.col : ''), roads: roads, start: start, title: src.type === 'workspace' ? 'Workspace' : (pick[0] && pick[0].title) || 'Board' };
  }

  // ---------------------------------------------------------------- landscapes
  var STYLES = [
    { id: 'countryside', name: 'Countryside', icon: '🌾', sky: ['#33508f', '#8a7fb3', '#f4a26b'], fog: '#e7a27c', ground: '#7f9b55', road: '#4a4d55', shoulder: '#8c8a7c', line: '#f3eddc',
      sun: ['#ffd9a0', 1.05, [-.6, .32, -.75]], hemi: ['#b9c4ff', '#6b5a3c', .75], sunDisc: '#ffe1a8' },
    { id: 'coastal', name: 'Coastal', icon: '🌊', sky: ['#2a7bd0', '#7fc3ef', '#fde3b8'], fog: '#cfe6f2', ground: '#e3cf9a', road: '#55585f', shoulder: '#d8cfb4', line: '#ffffff',
      sun: ['#fff1d6', 1.15, [.5, .55, -.65]], hemi: ['#d7f0ff', '#c7a971', .8], sunDisc: '#fff4d8' },
    { id: 'forest', name: 'Forest', icon: '🌲', sky: ['#3f6c7a', '#8fb5a8', '#d7e3c4'], fog: '#a9bfa6', ground: '#4f6b3a', road: '#45474c', shoulder: '#6d6a55', line: '#efe9cf',
      sun: ['#fff2c8', .95, [.3, .6, -.7]], hemi: ['#cfe8d8', '#3b4a2a', .8], sunDisc: '#fff6d8' },
    { id: 'city', name: 'City', icon: '🏙', sky: ['#1d2550', '#5b4d8a', '#f09a7a'], fog: '#9c7f99', ground: '#6d7078', road: '#3b3d44', shoulder: '#a6a7ad', line: '#f6e7b0',
      sun: ['#ffc9a0', .9, [-.5, .3, -.8]], hemi: ['#a9b2ff', '#4a4250', .8], sunDisc: '#ffd2b0', walk: 1 },
    // Road Trips: real drives, each with its route shield
    { id: 'ca1', name: 'California 1 · Big Sur', icon: '🌊', trip: ['CA 1', 'Big Sur · Pacific Coast Hwy', '#1f6f4a'], sky: ['#3a7bd5', '#9fd0f2', '#ffe7c2'], fog: '#d7e6ee', ground: '#b9a35e', road: '#4d5058', shoulder: '#b8ab86', line: '#f3d04a',
      sun: ['#fff0d0', 1.15, [-.7, .35, -.6]], hemi: ['#d9efff', '#9a8350', .8], sunDisc: '#fff2d6' },
    { id: 'colorado', name: 'Colorado · Million Dollar Hwy', icon: '🏔', trip: ['US 550', 'San Juan Skyway · Colorado', '#2b4c8c'], sky: ['#2c5fa8', '#8fbbe6', '#e8f1fb'], fog: '#c8d8e8', ground: '#6f7f4c', road: '#46494f', shoulder: '#8b8576', line: '#f3d04a',
      sun: ['#fff6e2', 1.1, [.4, .6, -.7]], hemi: ['#e2efff', '#4d5a36', .85], sunDisc: '#fffaf0' },
    { id: 'utah', name: 'Utah · Monument Valley', icon: '🏜', trip: ['US 163', 'Monument Valley · Utah', '#8a3b1e'], sky: ['#2f6fc0', '#8cc4ea', '#f8d9b0'], fog: '#e9c9a4', ground: '#c2643a', road: '#4a4446', shoulder: '#b8714a', line: '#f3d04a',
      sun: ['#ffe2b8', 1.2, [-.6, .45, -.65]], hemi: ['#ffe9d0', '#8a3b1e', .8], sunDisc: '#ffe9c8' },
    { id: 'route66', name: 'Route 66 · Arizona', icon: '🌵', trip: ['66', 'Historic Route 66 · Arizona', '#5a3a1a'], sky: ['#3a5fb0', '#e7a46b', '#ffd59a'], fog: '#e9b98a', ground: '#c9a46a', road: '#3f3d41', shoulder: '#b49466', line: '#f3e5b0',
      sun: ['#ffcc8a', 1.05, [-.8, .22, -.55]], hemi: ['#ffd9b0', '#7a5a34', .8], sunDisc: '#ffd8a0' },
    { id: 'keys', name: 'Florida Keys · Overseas Hwy', icon: '🏝', trip: ['US 1', 'Overseas Highway · Florida Keys', '#1f6f4a'], sky: ['#1e88d6', '#7fd0f2', '#fff1d0'], fog: '#cdeefa', ground: '#2bb7c2', road: '#55585f', shoulder: '#d8d2bf', line: '#ffffff',
      sun: ['#fff6e0', 1.2, [.5, .6, -.6]], hemi: ['#e0f7ff', '#2a9aa8', .85], sunDisc: '#fffbe8' },
    { id: 'blueridge', name: 'Blue Ridge Parkway · Autumn', icon: '🍁', trip: ['BRP', 'Blue Ridge Parkway · Virginia', '#6b4a2b'], sky: ['#4a6fae', '#a9c3e4', '#f5dcc0'], fog: '#b9c8de', ground: '#7a7a3e', road: '#47484c', shoulder: '#8a8263', line: '#f3e5b0',
      sun: ['#ffe2c0', 1.0, [-.5, .38, -.7]], hemi: ['#dbe6ff', '#5a4a2a', .8], sunDisc: '#ffe9d0' }
  ];
  function styleById(id) { return STYLES.filter(function (s) { return s.id === id; })[0] || STYLES[0]; }

  // geometry kit (built once, shared by every chunk; never disposed with a chunk)
  var KIT = null;
  function colored(parts) {   // merge simple geometries into one non-indexed, vertex-coloured geometry
    var pos = [], col = [], c = new THREE.Color();
    parts.forEach(function (p) {
      var g = p[0].index ? p[0].toNonIndexed() : p[0]; if (p[2]) g.applyMatrix4(p[2]);
      var a = g.attributes.position.array; c.set(p[1]);
      for (var i = 0; i < a.length; i += 3) { pos.push(a[i], a[i + 1], a[i + 2]); col.push(c.r, c.g, c.b); }
    });
    var out = new THREE.BufferGeometry(); out.setAttribute('position', new THREE.Float32BufferAttribute(pos, 3)); out.setAttribute('color', new THREE.Float32BufferAttribute(col, 3)); out.computeVertexNormals(); return out;
  }
  function M4(x, y, z, sx, sy, sz, rx, rz) { var m = new THREE.Matrix4(), q = new THREE.Quaternion().setFromEuler(new THREE.Euler(rx || 0, 0, rz || 0)); return m.compose(new THREE.Vector3(x, y, z), q, new THREE.Vector3(sx || 1, sy || 1, sz || 1)); }
  function kit() {
    if (KIT) return KIT;
    var flat = new THREE.MeshStandardMaterial({ vertexColors: true, flatShading: true, roughness: 1, metalness: 0 });
    var win = document.createElement('canvas'); win.width = 64; win.height = 128; var w = win.getContext('2d'); w.fillStyle = '#c9c4cf'; w.fillRect(0, 0, 64, 128);
    var wr = rng(7); for (var y = 4; y < 128; y += 8) for (var x = 4; x < 64; x += 10) { w.fillStyle = wr() < .45 ? '#ffd98a' : '#59607a'; w.fillRect(x, y, 6, 5); }
    var wt = new THREE.CanvasTexture(win);
    var bmat = new THREE.MeshStandardMaterial({ map: wt, flatShading: true, roughness: 1, emissive: '#ffffff', emissiveMap: wt, emissiveIntensity: .35 });
    var lampMat = new THREE.MeshBasicMaterial({ color: '#ffe6a6' });
    var G = THREE;
    KIT = {
      round: { mat: flat, geo: colored([[new G.CylinderGeometry(.22, .3, 2.4, 5), '#6b4b32', M4(0, 1.2, 0)], [new G.IcosahedronGeometry(1.9, 0), '#4f8a3c', M4(0, 3.6, 0, 1, 1.05, 1)], [new G.IcosahedronGeometry(1.2, 0), '#5f9a44', M4(.7, 4.6, .3)]]) },
      pine: { mat: flat, geo: colored([[new G.CylinderGeometry(.2, .28, 1.6, 5), '#5a3f2a', M4(0, .8, 0)], [new G.ConeGeometry(2.2, 3.4, 7), '#2f6a3b', M4(0, 2.8, 0)], [new G.ConeGeometry(1.7, 2.8, 7), '#367a43', M4(0, 4.4, 0)], [new G.ConeGeometry(1.1, 2.2, 7), '#3e8a4b', M4(0, 5.9, 0)]]) },
      palm: { mat: flat, geo: colored([[new G.CylinderGeometry(.16, .24, 3, 5), '#8a6a45', M4(0, 1.5, 0, 1, 1, 1, 0, .12)], [new G.CylinderGeometry(.13, .16, 3, 5), '#93734b', M4(.3, 4.3, 0, 1, 1, 1, 0, .22)], [new G.ConeGeometry(2.6, 1.2, 6), '#3f9a52', M4(.6, 6, 0, 1, .55, 1)], [new G.ConeGeometry(1.6, .9, 6), '#4fb062', M4(.6, 6.5, 0, 1, .6, 1)]]) },
      bush: { mat: flat, geo: colored([[new G.IcosahedronGeometry(1, 0), '#5d8f43', M4(0, .6, 0, 1.3, .8, 1.1)]]) },
      rock: { mat: flat, geo: colored([[new G.DodecahedronGeometry(1, 0), '#8f8a82', M4(0, .4, 0, 1.3, .7, 1)]]) },
      hill: { mat: flat, geo: colored([[new G.ConeGeometry(1, 1, 7), '#ffffff', M4(0, .5, 0)]]) },
      field: { mat: flat, geo: colored([[new G.BoxGeometry(1, .04, 1), '#d9b860', M4(0, .08, 0)]]) },
      house: { mat: flat, geo: colored([[new G.BoxGeometry(4, 3, 5), '#efe3cf', M4(0, 1.5, 0)], [new G.ConeGeometry(3.6, 2, 4), '#b5533c', M4(0, 4, 0, 1, 1, 1.25, 0, 0)]]) },
      bldg: { mat: bmat, geo: (function () { var b = new G.BoxGeometry(1, 1, 1); b.translate(0, .5, 0); return b; })() },
      pole: { mat: flat, geo: colored([[new G.CylinderGeometry(.09, .12, 6, 5), '#3d4048', M4(0, 3, 0)], [new G.BoxGeometry(1.6, .12, .14), '#3d4048', M4(-.75, 6, 0)]]) },
      lamp: { mat: lampMat, geo: new G.BoxGeometry(.6, .16, .36) },
      cypress: { mat: flat, geo: colored([[new G.CylinderGeometry(.22, .34, 3, 5), '#5a4030', M4(0, 1.5, 0, 1, 1, 1, 0, .25)], [new G.IcosahedronGeometry(1.6, 0), '#2f5a3a', M4(.9, 3.6, 0, 1.9, .55, 1.3)], [new G.IcosahedronGeometry(1.1, 0), '#386a44', M4(1.9, 3.3, .3, 1.5, .5, 1)]]) },
      aspen: { mat: flat, geo: colored([[new G.CylinderGeometry(.11, .15, 3.6, 5), '#e8e4da', M4(0, 1.8, 0)], [new G.IcosahedronGeometry(1.1, 0), '#ffffff', M4(0, 4.0, 0, .9, 1.4, .9)]]) },
      peak: { mat: flat, geo: colored([[new G.ConeGeometry(1, 1, 6), '#6c7280', M4(0, .5, 0)], [new G.ConeGeometry(.36, .36, 6), '#f4f6f8', M4(0, .82, 0)]]) },
      butte: { mat: flat, geo: colored([[new G.CylinderGeometry(.62, 1, .22, 7), '#a8532c', M4(0, .11, 0)], [new G.CylinderGeometry(.5, .56, .78, 7), '#b55e33', M4(0, .61, 0)], [new G.CylinderGeometry(.5, .5, .04, 7), '#c9784a', M4(0, 1.01, 0)]]) },
      cactus: { mat: flat, geo: colored([[new G.CylinderGeometry(.22, .26, 4, 6), '#4f7a3c', M4(0, 2, 0)], [new G.CylinderGeometry(.15, .15, 1.4, 6), '#4f7a3c', M4(.55, 2.3, 0)], [new G.CylinderGeometry(.14, .14, .6, 6), '#4f7a3c', M4(.32, 1.7, 0, 1, 1, 1, 0, 1.57)], [new G.CylinderGeometry(.14, .14, 1.1, 6), '#4f7a3c', M4(-.5, 2.8, 0)], [new G.CylinderGeometry(.13, .13, .5, 6), '#4f7a3c', M4(-.3, 2.3, 0, 1, 1, 1, 0, 1.57)]]) },
      tpole: { mat: flat, geo: colored([[new G.CylinderGeometry(.1, .13, 7, 5), '#5a4632', M4(0, 3.5, 0)], [new G.BoxGeometry(1.8, .12, .12), '#5a4632', M4(0, 6.6, 0)]]) },
      roadsign: { mat: flat, geo: colored([[new G.CylinderGeometry(.12, .12, 5, 5), '#4a4a4a', M4(-1.4, 2.5, 0)], [new G.CylinderGeometry(.12, .12, 5, 5), '#4a4a4a', M4(1.4, 2.5, 0)], [new G.BoxGeometry(3.6, 2, .2), '#c8102e', M4(0, 5.6, 0)], [new G.BoxGeometry(3.2, .5, .22), '#f5d142', M4(0, 5.2, 0)], [new G.BoxGeometry(3.2, .3, .22), '#ffffff', M4(0, 6.1, 0)]]) },
      sand: { mat: flat, geo: colored([[new G.CylinderGeometry(1, 1.1, .3, 9), '#efe2b8', M4(0, .1, 0)]]) },
      cloud: { mat: new THREE.MeshBasicMaterial({ color: '#ffffff', transparent: true, opacity: .55, fog: false }), geo: colored([[new G.IcosahedronGeometry(1, 0), '#fff', M4(0, 0, 0, 1.6, .55, .9)], [new G.IcosahedronGeometry(.8, 0), '#fff', M4(1.3, .1, 0, 1.2, .5, .8)], [new G.IcosahedronGeometry(.7, 0), '#fff', M4(-1.3, -.05, .2, 1.1, .45, .8)]]) }
    };
    return KIT;
  }

  // ---------------------------------------------------------------- billboard art (canvas)
  var IMG = new Map();
  function loadImg(u) {
    if (!u) return Promise.resolve(null);
    if (IMG.has(u)) return IMG.get(u);
    var p = new Promise(function (res) { var im = new Image(); if (/^https?:/i.test(u)) im.crossOrigin = 'anonymous'; im.decoding = 'async'; im.onload = function () { res(im); }; im.onerror = function () { res(null); }; im.src = u; });
    IMG.set(u, p); if (IMG.size > 220) IMG.delete(IMG.keys().next().value); return p;
  }
  function wrap(ctx, text, x, y, maxW, lh, maxLines, center) {
    var words = String(text || '').split(/(\s+)/), lines = [], cur = '';
    if (!/\s/.test(text) && /[　-鿿]/.test(text)) words = String(text).split('');
    words.forEach(function (w) { var t = cur + w; if (ctx.measureText(t).width > maxW && cur.trim()) { lines.push(cur.trim()); cur = w.trim(); } else cur = t; });
    if (cur.trim()) lines.push(cur.trim());
    if (lines.length > maxLines) { lines = lines.slice(0, maxLines); lines[maxLines - 1] = lines[maxLines - 1].replace(/.{2}$/, '') + '…'; }
    lines.forEach(function (l, i) { ctx.fillText(l, center ? x : x, y + i * lh); });
    return lines.length;
  }
  function cover(ctx, im, x, y, w, h) { var r = Math.max(w / im.width, h / im.height), iw = im.width * r, ih = im.height * r; ctx.save(); ctx.beginPath(); ctx.rect(x, y, w, h); ctx.clip(); ctx.drawImage(im, x + (w - iw) / 2, y + (h - ih) / 2, iw, ih); ctx.restore(); }
  function rr(ctx, x, y, w, h, r) { ctx.beginPath(); ctx.moveTo(x + r, y); ctx.arcTo(x + w, y, x + w, y + h, r); ctx.arcTo(x + w, y + h, x, y + h, r); ctx.arcTo(x, y + h, x, y, r); ctx.arcTo(x, y, x + w, y, r); ctx.closePath(); }
  var FONT = '-apple-system, "SF Pro Display", "PingFang SC", "Helvetica Neue", sans-serif', SERIF = '"New York", Georgia, "Songti SC", serif';
  function shade(hex, k) { var c = new THREE.Color(hex); if (k < 0) c.lerp(new THREE.Color('#000'), -k); else c.lerp(new THREE.Color('#fff'), k); return '#' + c.getHexString(); }
  function drawBoard(I, lod, im, color) {
    var near = lod === 'near', W = near ? 640 : 256, H = near ? 400 : 160, cv = document.createElement('canvas'); cv.width = W; cv.height = H;
    var x = cv.getContext('2d'), u = W / 640, t = I.type, title = I.title;
    var g = x.createLinearGradient(0, 0, W, H); g.addColorStop(0, shade(color, .15)); g.addColorStop(1, shade(color, -.35)); x.fillStyle = g; x.fillRect(0, 0, W, H);
    x.textBaseline = 'top'; x.fillStyle = '#fff';
    function band(h) { var gg = x.createLinearGradient(0, H - h, 0, H); gg.addColorStop(0, 'rgba(0,0,0,0)'); gg.addColorStop(1, 'rgba(0,0,0,.78)'); x.fillStyle = gg; x.fillRect(0, H - h, W, h); x.fillStyle = '#fff'; }
    if (t === 'book') {
      x.fillStyle = shade(color, -.55); x.fillRect(0, 0, W, H);
      var bw = H * .64, bx = W * .08, by = H * .1, bh = H * .8;
      x.fillStyle = shade(color, -.1); x.fillRect(bx, by, bw, bh); if (im) cover(x, im, bx, by, bw, bh);
      x.fillStyle = 'rgba(0,0,0,.28)'; x.fillRect(bx, by, bw * .07, bh);
      if (!im) { x.fillStyle = '#fff'; x.font = '700 ' + 34 * u + 'px ' + SERIF; wrap(x, title, bx + bw * .14, by + bh * .18, bw * .78, 40 * u, 4); }
      if (near) { x.fillStyle = '#f6efe2'; x.font = '700 ' + 46 * u + 'px ' + SERIF; var n = wrap(x, title, bx + bw + 34 * u, H * .2, W - bx - bw - 60 * u, 54 * u, 3); x.font = '400 ' + 26 * u + 'px ' + FONT; x.fillStyle = 'rgba(246,239,226,.75)'; wrap(x, I.sub || 'Book', bx + bw + 34 * u, H * .2 + n * 54 * u + 14 * u, W - bx - bw - 60 * u, 32 * u, 3); }
    } else if (t === 'poster') {
      x.fillStyle = '#121218'; x.fillRect(0, 0, W, H);
      var pw = H * .68, px = (W - pw) / 2; if (im) cover(x, im, near ? W * .06 : px, 0, near ? pw : pw, H); else { x.fillStyle = shade(color, -.2); x.fillRect(px, 0, pw, H); }
      if (near) { x.fillStyle = '#ffcf5a'; x.font = '800 ' + 18 * u + 'px ' + FONT; x.fillText('NOW SHOWING', W * .06 + pw + 30 * u, H * .14); x.fillStyle = '#fff'; x.font = '800 ' + 48 * u + 'px ' + FONT; var m = wrap(x, title.toUpperCase(), W * .06 + pw + 30 * u, H * .24, W - pw - W * .06 - 50 * u, 54 * u, 3); x.font = '400 ' + 24 * u + 'px ' + FONT; x.fillStyle = 'rgba(255,255,255,.7)'; wrap(x, I.sub, W * .06 + pw + 30 * u, H * .24 + m * 54 * u + 12 * u, W - pw - W * .06 - 50 * u, 30 * u, 3); }
    } else if (t === 'album') {
      x.fillStyle = '#16141b'; x.fillRect(0, 0, W, H);
      var s = H * .8, ax = near ? W * .07 : (W - s) / 2, ay = H * .1;
      x.fillStyle = '#0b0b0d'; x.beginPath(); x.arc(ax + s * .78, ay + s / 2, s * .46, 0, 7); x.fill(); x.strokeStyle = 'rgba(255,255,255,.08)'; for (var k = 1; k < 6; k++) { x.beginPath(); x.arc(ax + s * .78, ay + s / 2, s * .46 * k / 6, 0, 7); x.stroke(); }
      x.fillStyle = shade(color, 0); x.fillRect(ax, ay, s, s); if (im) cover(x, im, ax, ay, s, s);
      if (near) { var tx = ax + s * 1.3 + 10 * u; x.fillStyle = '#fff'; x.font = '700 ' + 42 * u + 'px ' + FONT; var m2 = wrap(x, title, tx, H * .26, W - tx - 30 * u, 48 * u, 3); x.fillStyle = 'rgba(255,255,255,.66)'; x.font = '400 ' + 24 * u + 'px ' + FONT; wrap(x, I.sub || 'Album', tx, H * .26 + m2 * 48 * u + 10 * u, W - tx - 30 * u, 30 * u, 2); }
    } else if (t === 'portrait') {
      var r = H * .36, cx = near ? W * .26 : W / 2, cy = H / 2;
      x.fillStyle = shade(color, -.45); x.fillRect(0, 0, W, H);
      x.save(); x.beginPath(); x.arc(cx, cy, r, 0, 7); x.clip(); x.fillStyle = shade(color, .2); x.fillRect(cx - r, cy - r, 2 * r, 2 * r); if (im) cover(x, im, cx - r, cy - r, 2 * r, 2 * r); else { x.fillStyle = '#fff'; x.font = '700 ' + r + 'px ' + FONT; x.textAlign = 'center'; x.fillText(title.slice(0, 1).toUpperCase(), cx, cy - r * .55); x.textAlign = 'left'; } x.restore();
      x.strokeStyle = '#f5e6c8'; x.lineWidth = 6 * u; x.beginPath(); x.arc(cx, cy, r + 4 * u, 0, 7); x.stroke();
      if (near) { var nx = cx + r + 40 * u; x.fillStyle = '#f5e6c8'; x.font = '700 ' + 44 * u + 'px ' + SERIF; var m3 = wrap(x, title, nx, H * .3, W - nx - 30 * u, 50 * u, 2); x.font = '400 ' + 24 * u + 'px ' + FONT; x.fillStyle = 'rgba(245,230,200,.75)'; wrap(x, I.sub, nx, H * .3 + m3 * 50 * u + 10 * u, W - nx - 30 * u, 30 * u, 3); }
    } else if (im) {   // image
      cover(x, im, 0, 0, W, H);
      if (near) { band(H * .5); x.font = '800 ' + 52 * u + 'px ' + FONT; var m4 = wrap(x, title, 34 * u, H - 34 * u - 56 * u * Math.min(2, Math.ceil(x.measureText(title).width / (W - 68 * u))) - (I.sub ? 34 * u : 0), W - 68 * u, 56 * u, 2); if (I.sub) { x.font = '500 ' + 26 * u + 'px ' + FONT; x.fillStyle = 'rgba(255,255,255,.82)'; wrap(x, I.sub, 34 * u, H - 34 * u - 30 * u, W - 68 * u, 30 * u, 1); } }
    } else {   // typography: the word is the picture
      x.fillStyle = 'rgba(255,255,255,.1)'; x.beginPath(); x.arc(W * .86, H * .1, H * .55, 0, 7); x.fill();
      x.fillStyle = '#fff';
      if (near) { x.font = '800 ' + (title.length > 18 ? 54 : 72) * u + 'px ' + FONT; var m5 = wrap(x, title, 40 * u, 52 * u, W - 80 * u, (title.length > 18 ? 60 : 80) * u, 3); if (I.sub) { x.font = '500 ' + 28 * u + 'px ' + FONT; x.fillStyle = 'rgba(255,255,255,.85)'; wrap(x, I.sub, 40 * u, 52 * u + m5 * (title.length > 18 ? 60 : 80) * u + 18 * u, W - 80 * u, 36 * u, 2); } }
      else { x.font = '800 ' + 120 * u + 'px ' + FONT; x.globalAlpha = .9; x.fillText(I.emoji || title.slice(0, 1).toUpperCase(), 30 * u, 40 * u); x.globalAlpha = 1; x.fillStyle = 'rgba(255,255,255,.55)'; for (var j = 0; j < 3; j++) { rr(x, 40 * u, (H * .62) + j * 32 * u, (W * .55) - j * 90 * u, 14 * u, 7 * u); x.fill(); } }
    }
    var tex = new THREE.CanvasTexture(cv); tex.anisotropy = 4; tex.minFilter = THREE.LinearMipmapLinearFilter; return tex;
  }
  function plain(md) {   // card text without markdown / html: no image links, no headings, no bold marks
    return String(md || '').replace(/<[^>]+>/g, ' ').replace(/\[!\[[^\]]*\]\([^)]*\)\]\([^)]*\)/g, '').replace(/!\[[^\]]*\]\([^)]*\)/g, '').replace(/\[([^\]]*)\]\([^)]*\)/g, '$1')
      .replace(/^\s*(#{1,6}|>|[-*]\s)\s*/gm, '').replace(/[*_`]{1,3}/g, '').replace(/^.*(点击全屏|Open High-Res).*$/gm, '').replace(/🔍/g, '').replace(/\n{2,}/g, '\n').replace(/[ \t]+/g, ' ').trim();
  }
  function drawBack(I, color) {
    var W = 640, H = 400, cv = document.createElement('canvas'); cv.width = W; cv.height = H; var x = cv.getContext('2d');
    x.fillStyle = '#f7f2e8'; x.fillRect(0, 0, W, H); x.fillStyle = color; x.fillRect(0, 0, 12, H);
    x.textBaseline = 'top'; x.fillStyle = '#1d1f24'; x.font = '800 34px ' + FONT; var y = 26 + wrap(x, I.title + (I.zh ? '  ' + I.zh : ''), 36, 26, W - 70, 40, 2) * 40 + 10;
    var body = plain(I.back) || plain(I.desc);
    if (body) { x.font = '500 ' + (body.length > 90 ? 23 : 31) + 'px ' + FONT; x.fillStyle = '#2b2f37'; var lh = body.length > 90 ? 30 : 40; y += wrap(x, body, 36, y, W - 70, lh, body.length > 90 ? 6 : 4) * lh + 12; }
    if (I.notes && y < H - 60) { x.font = '400 19px ' + FONT; x.fillStyle = '#5b616c'; y += wrap(x, 'Notes · ' + I.notes, 36, y, W - 70, 25, 2) * 25 + 10; }
    (I.checklist || []).filter(function (c) { return c && c.text; }).slice(0, 5).forEach(function (c) {
      if (y > H - 34) return; x.strokeStyle = c.done ? '#22b07d' : '#9aa0a9'; x.lineWidth = 2.5; rr(x, 36, y + 2, 20, 20, 5); if (c.done) { x.fillStyle = '#22b07d'; x.fill(); } else x.stroke();
      x.font = '500 20px ' + FONT; x.fillStyle = c.done ? '#8a909a' : '#2b2f37'; var ct = plain(c.text); if (x.measureText(ct).width > W - 100) { while (ct.length > 4 && x.measureText(ct + '…').width > W - 100) ct = ct.slice(0, -1); ct += '…'; } x.fillText(ct, 68, y + 1); y += 30;
    });
    if (!body && !I.notes && !(I.checklist || []).length) { x.font = '500 22px ' + FONT; x.fillStyle = '#9aa0a9'; x.fillText('This card has no back yet.', 36, y); }
    var t = new THREE.CanvasTexture(cv); t.anisotropy = 4; return t;
  }
  function signTex(lines, bg, fg, w, h) {
    var cv = document.createElement('canvas'); cv.width = w || 512; cv.height = h || 160; var x = cv.getContext('2d'), W = cv.width, H = cv.height;
    x.fillStyle = bg; x.fillRect(0, 0, W, H); x.strokeStyle = fg; x.lineWidth = 6; rr(x, 8, 8, W - 16, H - 16, 14); x.stroke();
    x.fillStyle = fg; x.textBaseline = 'middle'; x.textAlign = 'center';
    lines.forEach(function (l, i) { x.font = (i ? '500 ' + Math.round(H * .17) : '800 ' + Math.round(H * (lines.length > 1 ? .3 : .36))) + 'px ' + FONT; var ty = lines.length > 1 ? (i ? H * .74 : H * .4) : H / 2; var s = l; while (x.measureText(s).width > W - 40 && s.length > 3) s = s.slice(0, -2); if (s !== l) s += '…'; x.fillText(s, W / 2, ty); });
    var t = new THREE.CanvasTexture(cv); t.anisotropy = 4; return t;
  }

  // ---------------------------------------------------------------- the drive
  var CUR = null;
  function Drive(opts) {
    var T = THREE, self = this, P = opts.provider || defaultProvider(), src = opts.source || { type: 'workspace' };
    var PL = plan(P, src);
    if (!PL.roads.length) throw new Error('Nothing to drive: this source has no cards');
    var saved = load()[PL.key] || {};
    var seed = opts.seed != null ? opts.seed : (saved.seed != null ? saved.seed : hash(PL.key) % 100000);
    var CARS = window.MinestCars, carId = opts.car || (function () { try { return localStorage.getItem('minest.drive.car'); } catch (e) { return null; } })() || 'luce';
    var st = { style: opts.style || saved.style || 'countryside', styleHist: [], speed: saved.speed != null ? saved.speed : 1, playing: true, v: 0, mode: 'drive', visited: {} };
    var UP = new T.Vector3(0, 1, 0);

    // DOM
    var root = document.createElement('div'); root.className = 'kd-root'; root.setAttribute('role', 'application'); root.setAttribute('aria-label', 'Knowledge Drive');
    root.innerHTML =
      '<canvas class="kd-gl"></canvas>' +
      '<div class="kd-top"><div class="kd-road"><i class="kd-dot"></i><span><b class="kd-rn"></b><small class="kd-rs"></small></span></div><span class="kd-tr"><button type="button" class="kd-btn kd-car" data-kd="garage" aria-label="Garage" title="Change car">🚘</button><button type="button" class="kd-btn kd-exit" data-kd="exit" aria-label="Exit">✕</button></span></div>' +
      '<div class="kd-intro" hidden><div class="kd-fade"></div><div class="kd-cap"><b></b><small>Tap to skip</small></div><button type="button" class="kd-ign" tabindex="-1"><span>ENGINE</span><b>START</b><span>STOP</span></button></div>' +
      '<div class="kd-garage" hidden><div class="kd-gcard"><div class="kd-ghead"><b>🚘 Garage</b><button type="button" class="kd-btn" data-kd="garage">✕</button></div><div class="kd-glist"></div></div></div>' +
      '<div class="kd-toast" aria-live="polite"></div>' +
      '<div class="kd-dash"><div class="kd-wheelgap"></div>' +
        '<div class="kd-ctl"><button type="button" class="kd-btn" data-kd="prev" aria-label="Previous stop">⏮</button><button type="button" class="kd-btn kd-play" data-kd="play" aria-label="Stop">⏸</button><button type="button" class="kd-btn kd-brake" aria-label="Brake (hold)" title="Hold to brake (B)">🛑</button><button type="button" class="kd-btn" data-kd="next" aria-label="Next stop">⏭</button></div>' +
        '<div class="kd-nav"><canvas class="kd-map"></canvas><button type="button" class="kd-next" data-kd="focusnext"><small>Next stop</small><b></b><i></i></button></div>' +
        '<div class="kd-ctl kd-ctl2"><button type="button" class="kd-btn kd-sp" data-kd="speed"></button><button type="button" class="kd-btn kd-sg" data-kd="suggest" title="Suggest a landscape"></button><button type="button" class="kd-btn" data-kd="prevstyle" title="Previous landscape" aria-label="Previous landscape">↺</button></div>' +
      '</div>' +
      '';
    (opts.container || document.body).appendChild(root);
    var $ = function (s) { return root.querySelector(s); }, cvs = $('.kd-gl'), mapC = $('.kd-map');

    // renderer, scenes
    var dpr = Math.min(window.devicePixelRatio || 1, 2);
    var R = new T.WebGLRenderer({ canvas: cvs, antialias: dpr < 2, powerPreference: 'high-performance' }); R.setPixelRatio(dpr);
    var scene = new T.Scene(), cam = new T.PerspectiveCamera(62, 1, .2, 620);
    var hemi = new T.HemisphereLight('#fff', '#888', .8), sun = new T.DirectionalLight('#fff', 1); scene.add(hemi, sun, sun.target);
    var skyGeo = new T.SphereGeometry(520, 18, 12), sky = new T.Mesh(skyGeo, new T.MeshBasicMaterial({ vertexColors: true, side: T.BackSide, fog: false, depthWrite: false }));
    sky.renderOrder = -10; scene.add(sky);
    var sunDisc = new T.Mesh(new T.CircleGeometry(22, 12), new T.MeshBasicMaterial({ color: '#fff', fog: false, depthWrite: false })); sunDisc.renderOrder = -9; scene.add(sunDisc);
    var ground = new T.Mesh(new T.PlaneGeometry(1400, 1400), new T.MeshStandardMaterial({ color: '#7f9b55', roughness: 1 })); ground.rotation.x = -Math.PI / 2; scene.add(ground);
    var clouds = null;
    var world = new T.Group(); scene.add(world);
    // cockpit: its own camera, so focusing (FOV change) never moves the dashboard
    var cock = new T.Scene(), ccam = new T.PerspectiveCamera(50, 1, .05, 10), cockG = new T.Group(); cock.add(cockG);
    cock.add(new T.HemisphereLight('#c9d3ff', '#3a3230', .9)); var cl = new T.DirectionalLight('#ffd9b0', .7); cl.position.set(.3, 1, -1); cock.add(cl);
    var dashM = new T.MeshStandardMaterial({ color: '#262a31', flatShading: true, roughness: .95 }), trimM = new T.MeshStandardMaterial({ color: '#363b44', flatShading: true, roughness: .8 }), darkM = new T.MeshStandardMaterial({ color: '#16181c', flatShading: true, roughness: 1 });
    var dash = new T.Mesh(new T.BoxGeometry(1, 1, .3), dashM), lip = new T.Mesh(new T.CylinderGeometry(1, 1, 1, 6), trimM), hood = new T.Mesh(new T.CylinderGeometry(1, 1, 1, 8, 1, false, 0, Math.PI), darkM);
    var wheel = new T.Group(), rim = new T.Mesh(new T.TorusGeometry(1, .085, 5, 22), darkM); wheel.add(rim);
    [[-.5, -.1, .2, .9, .13], [.5, -.1, -.2, .9, .13], [0, -.52, 0, .14, .9]].forEach(function (a) { var sp = new T.Mesh(new T.BoxGeometry(a[3], a[4], .06), trimM); sp.position.set(a[0], a[1], 0); sp.rotation.z = a[2]; wheel.add(sp); });
    var hub = new T.Mesh(new T.CylinderGeometry(.24, .26, .12, 8), trimM); hub.rotation.x = Math.PI / 2; wheel.add(hub);
    var pillL = new T.Mesh(new T.BoxGeometry(1, 1, .02), darkM), pillR = pillL.clone(), roof = new T.Mesh(new T.BoxGeometry(1, 1, .02), darkM);
    cockG.add(dash, lip, hood, wheel, pillL, pillR, roof);
    var wheelBase = { x: 0, y: 0 }, steer = 0, R0c = .1;
    // the car's instruments: a cluster in the binnacle and a floating centre screen (canvas, redrawn with the speed)
    var clusterCv = document.createElement('canvas'); clusterCv.width = 512; clusterCv.height = 256;
    var screenCv = document.createElement('canvas'); screenCv.width = 512; screenCv.height = 320;
    var clusterTex = new T.CanvasTexture(clusterCv), screenTex = new T.CanvasTexture(screenCv);
    var cluster = new T.Mesh(new T.PlaneGeometry(1, .5), new T.MeshBasicMaterial({ map: clusterTex, toneMapped: false }));
    var screen = new T.Mesh(new T.PlaneGeometry(1, .62), new T.MeshBasicMaterial({ map: screenTex, toneMapped: false }));
    var screenFrame = new T.Mesh(new T.BoxGeometry(1.06, .68, .04), new T.MeshStandardMaterial({ color: '#0d0e10', roughness: .4, metalness: .3 }));
    var ambient = new T.Mesh(new T.BoxGeometry(1, 1, 1), new T.MeshBasicMaterial({ color: '#ffffff', transparent: true, opacity: 0 }));
    var vent = new T.Mesh(new T.TorusGeometry(1, .22, 8, 24), new T.MeshStandardMaterial({ color: '#9aa0a6', roughness: .3, metalness: .8 }));
    cockG.add(cluster, screenFrame, screen, ambient, vent);
    var inst = { on: 1, sweep: null, boot: 0, t: 0 }, carNow = null;
    function starTex() {
      var c = document.createElement('canvas'); c.width = 512; c.height = 64; var x = c.getContext('2d'); x.fillStyle = '#07080c'; x.fillRect(0, 0, 512, 64);
      var r = rng(11); for (var i = 0; i < 260; i++) { x.fillStyle = 'rgba(220,230,255,' + (.3 + r() * .7) + ')'; var sz = r() < .1 ? 2 : 1; x.fillRect(r() * 512, r() * 64, sz, sz); }
      return new T.CanvasTexture(c);
    }
    function setCockpitCar(c) {
      carNow = c;
      dashM.color.set(c.wood || c.dash); trimM.color.set(c.trim); darkM.color.set(c.dash);
      lip.material = new T.MeshStandardMaterial({ color: c.wood ? c.wood : c.leather, roughness: .7, flatShading: true });
      while (wheel.children.length) wheel.remove(wheel.children[0]);
      wheel.add(CARS.wheel(T, c));
      ambient.material.color.set(c.ambient);
      vent.material.color.set(c.trim);
      if (c.stars) { roof.material = new T.MeshBasicMaterial({ map: starTex() }); } else roof.material = darkM;
      screen.visible = screenFrame.visible = c.screen !== 'none' && !narrowNow;
      instruments(true);
    }
    var narrowNow = false;
    function instruments(force) {
      if (!carNow) return;
      CARS.drawCluster(clusterCv, carNow, st.v * 12, inst.sweep, inst.on); clusterTex.needsUpdate = true;
      if (force || inst.boot || (inst.t += 1) % 8 === 0) { CARS.drawScreen(screenCv, carNow, inst.on, inst.boot > 0 && inst.boot < 1 ? 'boot' : null); screenTex.needsUpdate = true; }
    }

    function layoutCockpit(w, h, fold) {   // fold: the Duo half folded — the lower screen is the dashboard, the 3D keeps only a lip and the wheel
      ccam.aspect = w / h; ccam.updateProjectionMatrix();
      var d = 1, vh = 2 * d * Math.tan(T.MathUtils.degToRad(ccam.fov / 2)), vw = vh * ccam.aspect, dashPx = fold ? clamp(h * .1, 34, 64) : w / h < .85 ? clamp(h * .25, 176, 226) : clamp(h * .19, 92, 168), top = -vh / 2 + vh * dashPx / h;
      dash3d = dashPx; if (!fold) root.style.setProperty('--kd-dash', dashPx + 'px');
      dash.scale.set(vw * 1.3, (top + vh / 2) + .05, 1); dash.position.set(0, (top - vh / 2 - .05) / 2, -d - .15);
      lip.scale.set(.03, vw * 1.3, .03); lip.rotation.z = Math.PI / 2; lip.position.set(0, top, -d);
      var narrow = w / h < .85 && !fold, R0 = vh * (fold ? .16 : narrow ? .11 : .135); wheelBase.x = -vw * (narrow ? .3 : .29); wheelBase.y = fold ? top - R0 * .55 : top - R0 * .25;
      hood.scale.set(R0 * .7, R0 * .55, R0 * .55); hood.rotation.z = Math.PI / 2; hood.rotation.y = Math.PI / 2; hood.position.set(wheelBase.x, top, -d - .1);
      wheel.scale.setScalar(R0); wheel.position.set(wheelBase.x, wheelBase.y, -d + .12); wheel.rotation.x = -.35;
      root.style.setProperty('--kd-wheel', ((wheelBase.x + vw / 2 + R0 * .6) / vw * 100).toFixed(1) + '%');
      var pw = vw * .035; pillL.scale.set(pw, vh * 1.1, 1); pillL.position.set(-vw / 2 + pw * .2, 0, -d + .05); pillL.rotation.z = -.12; pillR.scale.copy(pillL.scale); pillR.position.set(vw / 2 - pw * .2, 0, -d + .05); pillR.rotation.z = .12;
      pillL.visible = pillR.visible = !narrow; roof.scale.set(vw * 1.2, vh * .045, 1); roof.position.set(0, vh / 2 - vh * .012, -d + .05);
      R0c = R0; narrowNow = narrow;
      var hoodFront = -d - .1 + R0 * .55;
      cluster.scale.set(R0 * 1.9, R0 * 1.9, 1); cluster.position.set(wheelBase.x, top + R0 * .5, hoodFront + .004);
      hood.scale.set(R0 * 1.05, R0 * 1.0, R0 * .55);
      var sx = Math.min(vw / 2 - R0 * .95, wheelBase.x + R0 * 2.55);
      screen.scale.set(R0 * 1.35, R0 * 1.35, 1); screen.position.set(sx, top + R0 * .42, -d + .03);
      screenFrame.scale.copy(screen.scale); screenFrame.position.set(sx, top + R0 * .42, -d + .005);
      screen.visible = screenFrame.visible = !!carNow && carNow.screen !== 'none' && !narrow;
      ambient.scale.set(vw * 1.3, .004, .004); ambient.position.set(0, top - .006, -d + .012);
      vent.scale.setScalar(R0 * .22); vent.position.set(wheelBase.x - R0 * 1.55, top - R0 * .3, -d + .02); vent.visible = !narrow;
    }

    // ---------------- style
    var mats = { road: new T.MeshStandardMaterial({ color: '#4a4d55', roughness: .95, polygonOffset: true, polygonOffsetFactor: -2 }), shoulder: new T.MeshStandardMaterial({ color: '#8c8a7c', roughness: 1, polygonOffset: true, polygonOffsetFactor: -1 }), line: new T.MeshBasicMaterial({ color: '#fff', polygonOffset: true, polygonOffsetFactor: -4 }), water: new T.MeshStandardMaterial({ color: '#2f8fc4', roughness: .3, metalness: .1, flatShading: true }), rail: new T.MeshStandardMaterial({ color: '#e8e6df', roughness: .8, side: T.DoubleSide }) };
    function applyStyle() {
      var S = styleById(st.style), c0 = new T.Color(S.sky[0]), c1 = new T.Color(S.sky[1]), c2 = new T.Color(S.sky[2]), pos = skyGeo.attributes.position, col = [];
      for (var i = 0; i < pos.count; i++) { var y = pos.getY(i) / 520, c = new T.Color(); if (y < 0) c.copy(c2); else if (y < .28) c.copy(c2).lerp(c1, y / .28); else c.copy(c1).lerp(c0, Math.min(1, (y - .28) / .5)); col.push(c.r, c.g, c.b); }
      skyGeo.setAttribute('color', new T.Float32BufferAttribute(col, 3));
      scene.fog = new T.Fog(S.fog, 70, VIEW + 20); scene.background = new T.Color(S.fog);
      hemi.color.set(S.hemi[0]); hemi.groundColor.set(S.hemi[1]); hemi.intensity = S.hemi[2];
      sun.color.set(S.sun[0]); sun.intensity = S.sun[1]; sun.userData.dir = new T.Vector3().fromArray(S.sun[2]).normalize();
      sunDisc.material.color.set(S.sunDisc);
      mats.water.color.set(S.id === 'keys' ? '#2fc2c9' : S.id === 'ca1' ? '#1f6fa8' : '#2f8fc4');
      ground.material.color.set(S.ground); mats.road.color.set(S.road); mats.shoulder.color.set(S.shoulder); mats.line.color.set(S.line);
      var sg = $('.kd-sg'); sg.innerHTML = S.icon + '<span>Suggest</span>'; sg.title = S.name + ' · tap for another landscape';
      if (!clouds) { var K = kit(); clouds = new T.InstancedMesh(K.cloud.geo, K.cloud.mat, 10); var r = rng(seed + 3), m = new T.Matrix4(); for (var j = 0; j < 10; j++) { var a = r() * Math.PI * 2, d = 330 + r() * 120; m.compose(new T.Vector3(Math.cos(a) * d, 95 + r() * 60, Math.sin(a) * d), new T.Quaternion().setFromAxisAngle(UP, r() * 3), new T.Vector3(1.6, .7, 1).multiplyScalar(12 + r() * 12)); clouds.setMatrixAt(j, m); } clouds.frustumCulled = false; scene.add(clouds); }
      clouds.visible = st.style !== 'city';
    }

    // ---------------- road segments (one per List road; rebuilt deterministically from seed + road + index)
    var segs = [], segN = 0;
    function makeSeg(roadIdx, start, dir, turn, g0) {
      var road = PL.roads[roadIdx], k = segN++, r = rng(hash(seed + ':' + road.id + ':' + k)), pts = [start.clone()], d = dir.clone().setY(0).normalize(), p = start.clone();
      if (turn) {   // swing onto the side road of the last intersection
        var side = d.clone().applyAxisAngle(UP, turn === 'left' ? Math.PI / 2 : -Math.PI / 2);
        pts.push(p.clone().addScaledVector(d, 7).addScaledVector(side, 1.2), p.clone().addScaledVector(d, 13).addScaledVector(side, 7), p.clone().addScaledVector(d, 15).addScaledVector(side, 20));
        p = pts[pts.length - 1].clone(); d = side;
      } else { p.addScaledVector(d, 14); pts.push(p.clone()); }
      var need = LEAD + road.items.length * SP + TAIL, h0 = Math.atan2(d.x, d.z), h = h0, got = 30;
      while (got < need + 40) {
        h = clamp(h + (r() - .5) * .62, h0 - .95, h0 + .95);
        var step = 34 + r() * 14; p = p.clone().add(new T.Vector3(Math.sin(h), 0, Math.cos(h)).multiplyScalar(step)); pts.push(p); got += step;
      }
      var curve = new T.CatmullRomCurve3(pts, false, 'centripetal'); curve.arcLengthDivisions = pts.length * 24;
      var len = curve.getLength(), endS = Math.min(len - 4, need);
      var seg = { k: k, road: roadIdx, curve: curve, len: endS, g0: g0, group: new T.Group(), chunks: {}, stops: [], signs: [], choice: 'straight', opts: null, poly: [], disposed: false };
      road.items.forEach(function (it, i) { seg.stops.push({ ref: it.ref, i: i, s: LEAD + i * SP, side: i % 2 ? 1 : -1, section: it.section, sectionStart: it.sectionStart, seg: seg, bb: null }); });
      for (var s = 0; s <= endS; s += 8) { var q = curve.getPointAt(s / len); seg.poly.push(q.x, q.z); }
      seg.lenAll = len; seg.opts = routeOptions(seg);
      buildRoad(seg); world.add(seg.group); segs.push(seg); st.visited[roadIdx] = 1;
      return seg;
    }
    function frame(seg, s, out) {   // position, tangent, left at arc length s
      var u = clamp(s / seg.lenAll, 0, 1); out = out || {}; out.p = seg.curve.getPointAt(u, out.p || new T.Vector3()); out.t = seg.curve.getTangentAt(u, out.t || new T.Vector3()).setY(0).normalize();
      out.l = (out.l || new T.Vector3()).set(out.t.z, 0, -out.t.x); return out;
    }
    function ribbon(seg, s0, s1, a, b, y, step) {   // a strip between lateral offsets a..b (left positive)
      var n = Math.max(1, Math.ceil((s1 - s0) / step)), pos = [], idx = [], F = {};
      for (var i = 0; i <= n; i++) { frame(seg, s0 + (s1 - s0) * i / n, F); var A = F.p.clone().addScaledVector(F.l, a), B = F.p.clone().addScaledVector(F.l, b); pos.push(A.x, y, A.z, B.x, y, B.z); if (i) { var o = (i - 1) * 2; idx.push(o, o + 2, o + 1, o + 1, o + 2, o + 3); } }
      var g = new T.BufferGeometry(); g.setAttribute('position', new T.Float32BufferAttribute(pos, 3)); g.setIndex(idx); g.computeVertexNormals();
      if (g.attributes.normal.getY(0) < 0) { idx.reverse(); g.setIndex(idx); g.computeVertexNormals(); }
      return g;
    }
    function crossRibbon(E, dirv, a, b, w, y) {   // a straight strip at the intersection
      var g = new T.PlaneGeometry(b - a, w); g.rotateX(-Math.PI / 2); g.translate((a + b) / 2, y, 0); var m = new T.Mesh(g); m.rotation.y = Math.atan2(dirv.x, dirv.z); m.position.copy(E); return m;
    }
    function buildRoad(seg) {
      var S = styleById(st.style), L = seg.lenAll, end = seg.len + 30, walk = S.walk ? 3 : 0;
      seg.group.add(new T.Mesh(ribbon(seg, 0, Math.min(L, end), -ROAD_W - 1.4 - walk, ROAD_W + 1.4 + walk, .02, 4), mats.shoulder));
      seg.group.add(new T.Mesh(ribbon(seg, 0, Math.min(L, end), -ROAD_W, ROAD_W, .04, 4), mats.road));
      for (var s = 2; s < Math.min(L, end) - 4; s += 9) seg.group.add(new T.Mesh(ribbon(seg, s, s + 4, -.1, .1, .06, 4), mats.line));
      seg.group.add(new T.Mesh(ribbon(seg, 0, Math.min(L, end), ROAD_W - .35, ROAD_W - .2, .06, 4), mats.line));
      seg.group.add(new T.Mesh(ribbon(seg, 0, Math.min(L, end), -ROAD_W + .2, -ROAD_W + .35, .06, 4), mats.line));
      // intersection at the end: a cross road both ways
      var F = frame(seg, seg.len, {}), cr = crossRibbon(F.p, F.t, -60, 60, ROAD_W * 2, .045); cr.material = mats.road; seg.group.add(cr);
      var cs = crossRibbon(F.p, F.t, -60, 60, ROAD_W * 2 + 2.8, .025); cs.material = mats.shoulder; seg.group.add(cs);
      seg.endP = F.p.clone(); seg.endT = F.t.clone();
      signs(seg);
    }
    function routeOptions(seg) {   // Smart Route: deterministic; straight = the next road not yet driven
      var n = PL.roads.length, cur = seg.road, order = [], o = {};
      for (var i = 1; i <= n; i++) order.push((cur + i) % n);
      var fresh = order.filter(function (x) { return !st.visited[x] && x !== cur; }), rest = order.filter(function (x) { return fresh.indexOf(x) < 0; });
      var seq = fresh.concat(rest).filter(function (x, i, a) { return a.indexOf(x) === i; });
      o.straight = seq[0] != null ? seq[0] : cur;
      var r = rng(hash(seed + ':x:' + seg.k)), alt = seq.slice(1).filter(function (x) { return x !== o.straight; });
      if (alt.length) o[r() < .5 ? 'left' : 'right'] = alt[0];
      if (alt.length > 1) o[o.left == null ? 'left' : 'right'] = alt[1];
      return o;
    }
    function panel(tex, w, h) { var m = new T.Mesh(new T.PlaneGeometry(w, h), new T.MeshBasicMaterial({ map: tex, toneMapped: false })); return m; }
    function post(h, x, z, g, c) { var m = new T.Mesh(new T.BoxGeometry(.22, h, .22), new T.MeshStandardMaterial({ color: c || '#5b6068', flatShading: true })); m.position.set(x, h / 2, z); g.add(m); return m; }
    function place(obj, seg, s, lat, faceBack) {
      var F = frame(seg, s, {}); obj.position.copy(F.p).addScaledVector(F.l, lat);
      var look = obj.position.clone().addScaledVector(F.t, -1); if (faceBack) look.addScaledVector(F.l, faceBack); obj.lookAt(look.x, obj.position.y, look.z); return F;
    }
    function signs(seg) {
      var road = PL.roads[seg.road];
      // the road's name, overhead
      var g = new T.Group(), tex = signTex([road.name, road.region + ' · ' + road.items.length + ' stops'], '#1f6f4a', '#ffffff', 768, 200), pn = panel(tex, 8.4, 2.2);
      pn.position.set(0, 6.6, 0); g.add(pn); post(7.8, -ROAD_W - 1.6, 0, g); post(7.8, ROAD_W + 1.6, 0, g);
      var beam = new T.Mesh(new T.BoxGeometry(ROAD_W * 2 + 3.4, .3, .3), new T.MeshStandardMaterial({ color: '#5b6068' })); beam.position.y = 7.7; g.add(beam);
      place(g, seg, 26, 0); seg.group.add(g); seg.signs.push(tex);
      var TS = styleById(st.style);
      if (TS.trip) {
        var tt = signTex([TS.trip[0], TS.trip[1]], TS.trip[2], '#ffffff', 512, 220), sq = new T.Group(), ps = panel(tt, 2.8, 1.2); ps.position.set(0, 2.6, 0); sq.add(ps); post(2.6, 0, -.05, sq);
        place(sq, seg, 44, ROAD_W + 2.4); seg.group.add(sq); seg.signs.push(tt);
      }
      // stack = a road section
      seg.stops.forEach(function (sp) {
        if (!sp.sectionStart) return;
        var t2 = signTex(['▸ ' + sp.section, 'Section · ' + road.title], '#2d5ea8', '#ffffff', 512, 170), q = new T.Group(), pq = panel(t2, 3.4, 1.13); pq.position.set(0, 3.1, 0); q.add(pq); post(3.2, 0, -.05, q);
        place(q, seg, Math.max(8, sp.s - 16), -ROAD_W - 2.2); seg.group.add(q); seg.signs.push(t2);
      });
      // the intersection gantry: where each way goes (tap to choose)
      var gy = new T.Group(), dirs = [['left', '←'], ['straight', '↑'], ['right', '→']], o = seg.opts, w = 3.6, xs = { left: -w - .2, straight: 0, right: w + .2 };
      seg.route = {};
      dirs.forEach(function (dd) {
        if (o[dd[0]] == null) return;
        var rr2 = PL.roads[o[dd[0]]], t3 = signTex([dd[1] + ' ' + rr2.name, rr2.region + ' · ' + rr2.items.length + ' stops'], '#1f6f4a', '#ffffff', 512, 170), pg = panel(t3, w, 1.2);
        pg.position.set(xs[dd[0]], 6.4, 0); pg.userData = { kind: 'route', seg: seg, choice: dd[0] }; gy.add(pg); seg.signs.push(t3); seg.route[dd[0]] = pg;
      });
      post(7.6, -ROAD_W - 1.8, 0, gy); post(7.6, ROAD_W + 1.8, 0, gy);
      var bm = new T.Mesh(new T.BoxGeometry(w * 3 + 1.2, .3, .3), new T.MeshStandardMaterial({ color: '#5b6068' })); bm.position.y = 7.4; gy.add(bm);
      place(gy, seg, seg.len - 32, 0); seg.group.add(gy); markRoute(seg);
    }
    function markRoute(seg) { Object.keys(seg.route || {}).forEach(function (k) { var m = seg.route[k].material; m.color.set(k === seg.choice ? '#ffffff' : '#9aa3a0'); }); }
    function disposeSeg(seg) {
      seg.disposed = true; Object.keys(seg.chunks).forEach(function (k) { dropChunk(seg, k); });
      seg.stops.forEach(function (sp) { if (sp.bb) release(sp); });
      seg.group.traverse(function (o) { if (o.isMesh) { if (o.geometry && !o.geometry.userData.shared) o.geometry.dispose(); if (o.material && !o.material.userData.shared && Object.values(mats).indexOf(o.material) < 0) o.material.dispose(); } });
      seg.signs.forEach(function (t) { t.dispose(); }); world.remove(seg.group);
      var i = segs.indexOf(seg); if (i >= 0) segs.splice(i, 1);
    }

    // ---------------- scenery chunks (instanced, only near the car)
    function scatter(seg, ci) {
      var S = styleById(st.style), K = kit(), r = rng(hash(seed + ':c:' + seg.k + ':' + ci + ':' + S.id)), s0 = ci * CHUNK, s1 = Math.min(seg.lenAll, s0 + CHUNK), items = {}, F = {};
      function add(kind, s, lat, sc, tint, sy) {
        if (s > seg.len - 40 && s < seg.len + 25 && Math.abs(lat) < 70) return;  // keep the intersection clear
        if (s < 12 && Math.abs(lat) < 70 || s < 18 && Math.abs(lat) < 20) return;
        frame(seg, s, F); var p = F.p.clone().addScaledVector(F.l, lat); (items[kind] = items[kind] || []).push([p.x, p.z, sc, r() * 6.28, tint, sy || 1, Math.atan2(F.t.x, F.t.z)]);
      }
      var sd = function () { return r() < .5 ? -1 : 1; };
      for (var s = s0; s < s1; s += 6) {
        if (S.id === 'countryside') {
          if (s % 12 < 6) { [-1, 1].forEach(function (sg) { if (r() < .85) add('round', s + r() * 3, sg * (13 + r() * 3), .9 + r() * .5, r() < .25 ? '#e0b060' : r() < .5 ? '#9fc46a' : null); }); }
          if (r() < .35) add('field', s, sd() * (24 + r() * 40), 0, ['#d9b860', '#9fbf5a', '#c99b5a', '#b9c96a'][(r() * 4) | 0], 1);
          if (r() < .3) add('round', s, sd() * (30 + r() * 60), .8 + r() * .6);
          if (r() < .05) add('house', s, sd() * (26 + r() * 30), .9 + r() * .3);
          if (r() < .06) add('hill', s, sd() * (130 + r() * 110), 30 + r() * 40, ['#6f8c4a', '#7c9550', '#5f7a45'][(r() * 3) | 0], .45 + r() * .35);
        } else if (S.id === 'coastal') {
          if (r() < .6) add('palm', s, -(12 + r() * 4), .9 + r() * .4);
          if (r() < .4) add('palm', s, 13 + r() * 10, .8 + r() * .5);
          if (r() < .35) add('rock', s, -(24 + r() * 8), .7 + r() * 1.4);
          if (r() < .25) add('bush', s, 14 + r() * 30, .8 + r() * .7, '#8fb36a');
          if (r() < .05) add('hill', s, 120 + r() * 100, 30 + r() * 40, '#d8c58f', .3 + r() * .25);
        } else if (S.id === 'forest') {
          [-1, 1].forEach(function (sg) { add('pine', s + r() * 4, sg * (11 + r() * 4), .9 + r() * .7); if (r() < .9) add('pine', s + r() * 4, sg * (17 + r() * 22), .9 + r() * .9); if (r() < .6) add('pine', s, sg * (40 + r() * 40), 1 + r()); });
          if (r() < .2) add('rock', s, sd() * (10.5 + r() * 2), .4 + r() * .5);
          if (r() < .08) add('hill', s, sd() * (130 + r() * 100), 40 + r() * 40, '#3e5a34', .5 + r() * .4);
        } else if (S.id === 'ca1') {                 // ocean and sea stacks on the left, golden hills and cypress on the right
          if (r() < .45) add('rock', s, -(11 + r() * 3), .8 + r() * 1.2, '#8a8070');
          if (r() < .12) add('rock', s, -(40 + r() * 90), 4 + r() * 6, '#77705f');
          if (r() < .35) add('cypress', s, 12 + r() * 14, .9 + r() * .5);
          if (r() < .3) add('bush', s, 12 + r() * 30, .8 + r() * .6, '#9a9a52');
          if (r() < .08) add('hill', s, 60 + r() * 120, 26 + r() * 30, ['#c9a75a', '#b8994e', '#d4b46a'][(r() * 3) | 0], .45 + r() * .3);
        } else if (S.id === 'colorado') {            // pines, golden aspens, snow peaks
          [-1, 1].forEach(function (sg) { if (r() < .7) add(r() < .5 ? 'aspen' : 'pine', s + r() * 4, sg * (11 + r() * 6), .9 + r() * .6, r() < .5 ? ['#f2c230', '#e8a925', '#f7d74a'][(r() * 3) | 0] : null); if (r() < .6) add('pine', s, sg * (20 + r() * 40), 1 + r() * .8); });
          if (r() < .14) { var ps = 35 + r() * 35; add('peak', s, sd() * (ps + 50 + r() * 120), ps, null, 1.3 + r() * .6); }
          if (r() < .15) add('rock', s, sd() * (11 + r() * 4), .6 + r() * .8);
        } else if (S.id === 'utah') {                // red buttes and mesas on the desert floor
          if (r() < .45) add('bush', s, sd() * (11 + r() * 40), .45 + r() * .4, '#9aa36a');
          if (r() < .2) add('rock', s, sd() * (12 + r() * 30), .6 + r() * 1.4, '#b4562e');
          if (r() < .13) { var bs = 9 + r() * 14; add('butte', s, sd() * (bs * 1.6 + 30 + r() * 110), bs, null, 1.6 + r() * 2.2); }
        } else if (S.id === 'route66') {             // saguaros, telegraph poles, the old signs
          if (r() < .28) add('cactus', s, sd() * (12 + r() * 50), .8 + r() * .5);
          if (s % 30 < 6) add('tpole', s, ROAD_W + 4.5, 1);
          if (s % 132 < 6) add('roadsign', s, ROAD_W + 9, 1);
          if (r() < .35) add('bush', s, sd() * (11 + r() * 50), .4 + r() * .3, '#a3a06a');
          if (r() < .05) { var bs2 = 12 + r() * 12; add('butte', s, sd() * (bs2 * 1.6 + 150 + r() * 100), bs2, '#a0704a', 1 + r()); }
        } else if (S.id === 'keys') {                // open water both sides, little palm islets
          if (r() < .08) { var lt = sd() * (34 + r() * 60); add('sand', s, lt, 6 + r() * 6); add('palm', s, lt, 1 + r() * .4); if (r() < .6) add('palm', s + 3, lt + 3, .8 + r() * .3); }
        } else if (S.id === 'blueridge') {           // autumn trees and layered blue ridges
          [-1, 1].forEach(function (sg) { if (r() < .85) add(r() < .8 ? 'aspen' : 'round', s + r() * 3, sg * (11 + r() * 8), 1.1 + r() * .6, ['#e8641e', '#f2b52a', '#d43a1c', '#e98a2a', '#c9b23a'][(r() * 5) | 0]); if (r() < .55) add('aspen', s, sg * (22 + r() * 30), 1.2 + r() * .5, ['#e8641e', '#f2b52a', '#d43a1c'][(r() * 3) | 0]); });
          if (r() < .12) add('hill', s, sd() * (110 + r() * 60), 40 + r() * 30, '#5a7398', .35 + r() * .2);
          if (r() < .1) add('hill', s, sd() * (190 + r() * 90), 60 + r() * 40, '#7d93b8', .3 + r() * .2);
        } else {
          if (s % 12 < 6) [-1, 1].forEach(function (sg) { add('bldg', s + 3, sg * (17 + r() * 4), 0, ['#c9c4cf', '#b8c3d6', '#d8c9b5', '#a9b1c2'][(r() * 4) | 0], 1); if (r() < .8) add('bldg', s + 3, sg * (34 + r() * 18), 0, ['#9aa4bb', '#c0b3c8', '#8e98ad'][(r() * 3) | 0], 2); });
          if (s % 30 < 6) [-1, 1].forEach(function (sg) { add('pole', s, sg * (ROAD_W + 1.9), 1, null, sg); });
          if (r() < .2) add('round', s, sd() * (ROAD_W + 4.6), .55);
        }
      }
      var g = new T.Group(), m = new T.Matrix4(), q = new T.Quaternion(), v = new T.Vector3(), sc = new T.Vector3(), c = new T.Color();
      Object.keys(items).forEach(function (kind) {
        var list = items[kind], k = K[kind], im = new T.InstancedMesh(k.geo, k.mat, list.length); im.userData.shared = 1;
        var lamp = kind === 'pole' ? new T.InstancedMesh(K.lamp.geo, K.lamp.mat, list.length) : null;
        list.forEach(function (it, i) {
          if (kind === 'bldg') { var big = it[5] === 2, w = big ? 12 + r() * 10 : 8 + r() * 6, hgt = big ? 18 + r() * 34 : 8 + r() * 18; sc.set(w, hgt, w * (.8 + r() * .4)); q.setFromAxisAngle(UP, it[6]); }
          else if (kind === 'field') { sc.set(14 + r() * 22, 1, 10 + r() * 18); q.setFromAxisAngle(UP, it[3]); }
          else if (kind === 'hill') { sc.set(it[2] * 2, it[2] * it[5], it[2] * 2); q.setFromAxisAngle(UP, it[3]); }
          else if (kind === 'peak' || kind === 'butte') { sc.set(it[2] * (kind === 'butte' ? 1.4 : 1), it[2] * it[5] * (kind === 'butte' ? .5 : 1), it[2] * (kind === 'butte' ? 1.1 : 1)); q.setFromAxisAngle(UP, it[3]); }
          else if (kind === 'pole') { sc.set(1, 1, 1); q.setFromAxisAngle(UP, it[5] < 0 ? 0 : Math.PI); }
          else { sc.setScalar(it[2]); q.setFromAxisAngle(UP, it[3]); }
          if (kind === 'pole') q.setFromAxisAngle(UP, it[6] + (it[5] < 0 ? Math.PI : 0));
          v.set(it[0], 0, it[1]); m.compose(v, q, sc); im.setMatrixAt(i, m);
          if (lamp) { var off = new T.Vector3(-1.5, 5.9, 0).applyQuaternion(q); m.compose(v.clone().add(off), q, new T.Vector3(1, 1, 1)); lamp.setMatrixAt(i, m); }
          if (it[4] || kind !== 'bldg') { c.set(it[4] || '#ffffff'); if (!it[4]) c.offsetHSL(0, 0, (r() - .5) * .08); im.setColorAt(i, c); }
        });
        if (im.instanceColor) im.instanceColor.needsUpdate = true;
        g.add(im); if (lamp) { lamp.userData.shared = 1; g.add(lamp); }
      });
      if (S.id === 'ca1') { g.add(new T.Mesh(ribbon(seg, Math.max(0, s0 - 2), s1 + 2, -16, -360, .03, 10), mats.water)); }
      if (S.id === 'keys') {
        [[-ROAD_W - 1.5, -380], [ROAD_W + 1.5, 380]].forEach(function (ab) { g.add(new T.Mesh(ribbon(seg, Math.max(0, s0 - 2), s1 + 2, ab[0], ab[1], .03, 10), mats.water)); });
        [-1, 1].forEach(function (sg) { g.add(new T.Mesh(ribbon(seg, Math.max(0, s0 - 2), s1 + 2, sg * (ROAD_W + 1.1), sg * (ROAD_W + 1.35), .75, 6), mats.rail)); });
      }
      if (S.id === 'coastal') { var wm = new T.Mesh(ribbon(seg, Math.max(0, s0 - 2), s1 + 2, -30, -340, .03, 10), mats.water); g.add(wm); var sand = new T.Mesh(ribbon(seg, Math.max(0, s0 - 2), s1 + 2, -24, -31, .028, 10), mats.shoulder); g.add(sand); }
      return g;
    }
    function dropChunk(seg, k) { var g = seg.chunks[k]; if (!g) return; g.traverse(function (o) { if (o.isInstancedMesh) o.dispose && o.dispose(); else if (o.isMesh && o.geometry) o.geometry.dispose(); }); world.remove(g); delete seg.chunks[k]; }
    function manageChunks(g) {
      segs.forEach(function (seg) {
        var a = g - seg.g0 - BEHIND - CHUNK, b = g - seg.g0 + VIEW, n = Math.ceil(seg.lenAll / CHUNK);
        for (var ci = 0; ci < n; ci++) { var s0 = ci * CHUNK, want = s0 + CHUNK > a && s0 < b && s0 < seg.len + 40; if (want && !seg.chunks[ci]) { seg.chunks[ci] = scatter(seg, ci); world.add(seg.chunks[ci]); } else if (!want && seg.chunks[ci]) dropChunk(seg, ci); }
      });
    }
    function rebuildScenery() { segs.forEach(function (seg) { Object.keys(seg.chunks).forEach(function (k) { dropChunk(seg, k); }); }); }

    // ---------------- billboards: pooled, LOD textures, cached art
    var pool = [], picks = [], texCache = new Map(), bbGeo = { frame: new T.BoxGeometry(5.9, 3.85, .32), panel: new T.PlaneGeometry(5.5, 3.44), post: new T.BoxGeometry(.28, 1, .28) };
    Object.keys(bbGeo).forEach(function (k) { bbGeo[k].userData.shared = 1; });
    var frameM = new T.MeshStandardMaterial({ color: '#e9e4da', flatShading: true, roughness: .8 }), postM = new T.MeshStandardMaterial({ color: '#4e535b', flatShading: true }); frameM.userData.shared = postM.userData.shared = 1;
    function makeBB() {
      var g = new T.Group(), face = new T.Group(), f = new T.Mesh(bbGeo.frame, frameM), p = new T.Mesh(bbGeo.panel, new T.MeshBasicMaterial({ color: '#ffffff', toneMapped: false })), q = new T.Mesh(bbGeo.panel, new T.MeshBasicMaterial({ color: '#f6f1e6', toneMapped: false })), a = new T.Mesh(bbGeo.post, postM), b = a.clone();
      face.position.y = 5.2; p.position.z = .17; q.position.z = -.17; q.rotation.y = Math.PI; a.scale.y = b.scale.y = 3.4; a.position.set(-1.8, 1.7, 0); b.position.set(1.8, 1.7, 0);
      face.add(f, p, q); g.add(face, a, b); g.userData.panel = p; g.userData.backPanel = q; g.userData.face = face; p.userData.kind = q.userData.kind = 'stop'; return g;
    }
    function texFor(sp, I, lod) {
      var color = PL.roads[sp.seg.road].color, key = I.ref.id + ':' + lod + ':' + I.sig, hit = texCache.get(key);
      if (hit) { texCache.delete(key); texCache.set(key, hit); return Promise.resolve(hit); }
      return loadImg(I.img).then(function (im) {
        var t = drawBoard(I, lod, im, color); texCache.set(key, t);
        while (texCache.size > 40) { var k0 = texCache.keys().next().value, t0 = texCache.get(k0); if (!inUse(t0)) t0.dispose(); texCache.delete(k0); }
        return t;
      });
    }
    function inUse(t) { return segs.some(function (s) { return s.stops.some(function (sp) { return sp.bb && sp.bb.userData.panel.material.map === t; }); }); }
    function attach(sp) {
      var bb = pool.pop() || makeBB(); sp.bb = bb; bb.userData.panel.userData.stop = bb.userData.backPanel.userData.stop = sp; bb.userData.face.rotation.y = 0; sp.flip = 0; bb.visible = true; bb.scale.setScalar(1);
      place(bb, sp.seg, sp.s, sp.side * BB_LAT, -sp.side * .45); world.add(bb); picks.push(bb.userData.panel, bb.userData.backPanel);
      sp.lod = null; sp.I = null; bb.userData.panel.material.color.set(PL.roads[sp.seg.road].color);   // until its art is ready
    }
    function release(sp) { var bb = sp.bb; if (!bb) return; world.remove(bb); [bb.userData.panel, bb.userData.backPanel].forEach(function (o) { var i = picks.indexOf(o); if (i >= 0) picks.splice(i, 1); }); var bm = bb.userData.backPanel.material; if (bm.map) { bm.map.dispose(); bm.map = null; bm.needsUpdate = true; } bb.userData.panel.material.map = null; bb.userData.panel.material.needsUpdate = true; pool.push(bb); sp.bb = null; }
    function manageBoards(g) {
      segs.forEach(function (seg) {
        seg.stops.forEach(function (sp) {
          var d = seg.g0 + sp.s - g, want = d > -BEHIND && d < VIEW - 10;
          if (want && !sp.bb) attach(sp); else if (!want && sp.bb && sp !== st.focus) release(sp);
          if (!sp.bb) return;
          var lod = d < NEAR_LOD ? 'near' : 'far';
          if (lod !== sp.lod) {
            sp.lod = lod; var I = info(P, sp.ref); sp.I = I;
            if (!I) { sp.bb.visible = false; return; }
            texFor(sp, I, lod).then(function (t) { if (sp.bb && sp.lod === lod) { var m = sp.bb.userData.panel.material; m.map = t; m.color.set('#ffffff'); m.needsUpdate = true; } });
          }
        });
      });
    }

    // ---------------- route state
    var car = { seg: null, s: 0 }, F = {}, look = new T.Vector3(), lookTo = new T.Vector3(), fov = 62, baseFov = 62;
    function gNow() { return car.seg.g0 + car.s; }
    function segAt(g) { for (var i = 0; i < segs.length; i++) { var s = segs[i]; if (g >= s.g0 && g < s.g0 + s.len) return s; } return segs[segs.length - 1]; }
    function nextSeg(seg) { var i = segs.indexOf(seg); return segs[i + 1] || null; }
    function ensureAhead() {
      var last = segs[segs.length - 1];
      if (gNow() + VIEW + 40 > last.g0 + last.len) makeSeg(last.opts[last.choice] != null ? last.opts[last.choice] : last.opts.straight, last.endP, last.endT, last.choice === 'straight' ? null : last.choice, last.g0 + last.len);
      while (segs.length > 1 && segs[0] !== car.seg && segs[0].g0 + segs[0].len < gNow() - 80) disposeSeg(segs[0]);
    }
    function choose(seg, choice) {
      if (seg.opts[choice] == null || seg.choice === choice) return;
      if (car.seg === seg && car.s > seg.len - 10) return toast('Too late to turn here');
      seg.choice = choice; markRoute(seg);
      var nx = nextSeg(seg); if (nx) { var after = segs.slice(segs.indexOf(nx)); after.forEach(disposeSeg); }
      ensureAhead(); hap();
      toast((choice === 'left' ? '← ' : choice === 'right' ? '→ ' : '↑ ') + 'Next: ' + PL.roads[seg.opts[choice]].name);
    }

    // ---------------- HUD
    var toastT = 0;
    function toast(t) { var e = $('.kd-toast'); e.textContent = t; e.classList.add('on'); clearTimeout(toastT); toastT = setTimeout(function () { e.classList.remove('on'); }, 1800); }
    function hap() { try { window.webkit && webkit.messageHandlers && webkit.messageHandlers.minest && webkit.messageHandlers.minest.postMessage({ action: 'haptic', data: { style: 'selection' } }); } catch (e) {} }
    function speedLabel() { var S = SPEEDS[st.speed], b = $('.kd-sp'); b.innerHTML = S[1] + '<span>' + S[2] + '</span>'; b.title = 'Speed: ' + S[2]; }
    function playLabel() { var b = $('.kd-play'); b.textContent = st.playing ? '⏸' : '▶'; b.setAttribute('aria-label', st.playing ? 'Stop' : 'Drive'); b.title = st.playing ? 'Stop (Space)' : 'Drive (Space)'; }
    function upcoming(min) { var g = gNow(), best = null; segs.forEach(function (seg) { seg.stops.forEach(function (sp) { var d = seg.g0 + sp.s - g; if (d > (min || 4) && (!best || d < best.d)) best = { sp: sp, d: d }; }); }); return best; }
    var hudT = 0, lastRoad = -1;
    function hud(force) {
      var road = PL.roads[car.seg.road];
      if (road !== lastRoad || force) { lastRoad = road; $('.kd-rn').textContent = road.name; $('.kd-dot').style.background = road.color; }
      var passed = car.seg.stops.filter(function (sp) { return sp.s < car.s + 4; }).length;
      $('.kd-rs').textContent = road.region + ' · ' + passed + '/' + road.items.length;
      var u = upcoming(), nb = $('.kd-next b'), ni = $('.kd-next i');
      if (u) { var I = u.sp.I || info(P, u.sp.ref); nb.textContent = I ? I.title : '—'; ni.textContent = Math.round(u.d) + ' m'; } else { nb.textContent = '—'; ni.textContent = ''; }
      drawMap();
    }
    function drawMap() {
      var w = mapC.clientWidth, h = mapC.clientHeight; if (!w || !h) return;
      var nextSp = (upcoming() || {}).sp, d = Math.min(dpr, 2); if (mapC.width !== Math.round(w * d)) { mapC.width = Math.round(w * d); mapC.height = Math.round(h * d); }
      var x = mapC.getContext('2d'); x.setTransform(d, 0, 0, d, 0, 0); x.clearRect(0, 0, w, h);
      frame(car.seg, car.s, F); var hd = Math.atan2(F.t.x, F.t.z), sc = Math.min(w, h) / 380, cx = w / 2, cy = h * .64;
      function tp(px, pz) { var dx = px - F.p.x, dz = pz - F.p.z, c = Math.cos(-hd), s = Math.sin(-hd), rx = dx * c + dz * s, rz = -dx * s + dz * c; return [cx - rx * sc, cy - rz * sc]; }
      segs.forEach(function (seg) {
        x.lineCap = x.lineJoin = 'round'; x.strokeStyle = seg === car.seg ? PL.roads[seg.road].color : 'rgba(255,255,255,.35)'; x.lineWidth = seg === car.seg ? 4 : 3; x.beginPath();
        for (var i = 0; i < seg.poly.length; i += 2) { var q = tp(seg.poly[i], seg.poly[i + 1]); if (i) x.lineTo(q[0], q[1]); else x.moveTo(q[0], q[1]); } x.stroke();
        var E = tp(seg.endP.x, seg.endP.z); x.fillStyle = '#fff'; x.beginPath(); x.arc(E[0], E[1], 3.5, 0, 7); x.fill();
        x.strokeStyle = 'rgba(255,255,255,.35)'; x.lineWidth = 2; var lx = seg.endP.clone().addScaledVector(new T.Vector3(seg.endT.z, 0, -seg.endT.x), 26), rx2 = seg.endP.clone().addScaledVector(new T.Vector3(seg.endT.z, 0, -seg.endT.x), -26), a = tp(lx.x, lx.z), b = tp(rx2.x, rx2.z); x.beginPath(); x.moveTo(a[0], a[1]); x.lineTo(b[0], b[1]); x.stroke();
        var g = gNow();
        seg.stops.forEach(function (sp) { var Q = frame(seg, sp.s, {}), q2 = tp(Q.p.x, Q.p.z), past = seg.g0 + sp.s < g; x.fillStyle = past ? 'rgba(255,255,255,.35)' : sp === nextSp ? '#ffd257' : PL.roads[seg.road].color; x.beginPath(); x.arc(q2[0], q2[1], past ? 2 : 2.8, 0, 7); x.fill(); });
      });
      x.fillStyle = '#fff'; x.beginPath(); x.moveTo(cx, cy - 7); x.lineTo(cx + 5, cy + 5); x.lineTo(cx, cy + 2.5); x.lineTo(cx - 5, cy + 5); x.closePath(); x.fill();
    }

    // ---------------- focus: tap a billboard → brake, stop, look, enlarge, read; Continue → drive on from the same place
    st.anim = null;
    function goTo(gTarget, dur, then) { st.anim = { from: gNow(), to: gTarget, t: 0, dur: dur, then: then }; }
    // focus: tap a billboard → the camera turns to it and frames it while the car drives on; it lets go once the board is
    // passed. Stopping is yours: hold 🛑 Brake (or B), or tap Stop. Tap the board in focus to flip it to the meaning.
    function focus(sp) {
      if (!sp || !sp.bb) return; if (st.focus && st.focus !== sp) unfocus();
      var I = info(P, sp.ref); if (!I) return;
      st.focus = sp; st.lastRead = sp; hap();
      if (sp.lod !== 'near') { sp.lod = 'near'; texFor(sp, I, 'near').then(function (t) { if (sp.bb) { var m = sp.bb.userData.panel.material; m.map = t; m.color.set('#ffffff'); m.needsUpdate = true; } }); }
      var bm = sp.bb.userData.backPanel.material; if (bm.map) bm.map.dispose(); bm.map = drawBack(I, PL.roads[sp.seg.road].color); bm.color.set('#ffffff'); bm.needsUpdate = true;
      toast('Tap the board to flip · 🛑 to stop');
    }
    function flipBoard() { var sp = st.focus; if (!sp || !sp.bb) return; sp.flip = sp.flip ? 0 : 1; hap(); }
    function unfocus() { var sp = st.focus; if (sp) sp.flip = 0; st.focus = null; }
    function nextStop(dir) {
      var g = gNow(), all = [];
      segs.forEach(function (seg) { seg.stops.forEach(function (sp) { all.push({ sp: sp, g: seg.g0 + sp.s - 15 }); }); });
      all.sort(function (a, b) { return a.g - b.g; });
      var t = dir > 0 ? all.filter(function (a) { return a.g > g + 2; })[0] : all.filter(function (a) { return a.g < g - 6 && a.g >= segs[0].g0; }).pop();
      if (!t) return toast(dir > 0 ? 'Last stop on this road' : 'Start of the road');
      if (t.g < car.seg.g0 && dir < 0) { car.seg = segAt(t.g); }
      goTo(t.g, clamp(Math.abs(t.g - g) / 22, .6, 2.6)); hap();
    }

    // ---------------- input
    var down = null, ray = new T.Raycaster(), ndc = new T.Vector2();
    function pickAt(cx, cy) {
      var r = cvs.getBoundingClientRect(); ndc.set((cx - r.left) / r.width * 2 - 1, -((cy - r.top) / r.height) * 2 + 1); ray.setFromCamera(ndc, cam);
      var targets = picks.slice(); segs.forEach(function (s) { Object.keys(s.route || {}).forEach(function (k) { targets.push(s.route[k]); }); });
      var hit = ray.intersectObjects(targets, false)[0]; return hit ? hit.object : null;
    }
    function onDown(e) { down = { x: e.clientX, y: e.clientY, t: performance.now() }; }
    function onUp(e) {
      if (!down) return; var moved = Math.hypot(e.clientX - down.x, e.clientY - down.y), dt = performance.now() - down.t; down = null;
      if (moved > 10 || dt > 600) return;
      var o = pickAt(e.clientX, e.clientY);
      if (!o) { if (st.focus) unfocus(); return; }
      if (o.userData.kind === 'stop' && o.userData.stop === st.focus) return flipBoard();
      if (o.userData.kind === 'route') choose(o.userData.seg, o.userData.choice);
      else if (o.userData.kind === 'stop') focus(o.userData.stop);
    }
    var hoverT = 0;
    function onMove(e) { if (e.pointerType !== 'mouse') return; var n = performance.now(); if (n - hoverT < 80) return; hoverT = n; cvs.style.cursor = pickAt(e.clientX, e.clientY) ? 'pointer' : ''; }
    cvs.addEventListener('pointerdown', onDown); cvs.addEventListener('pointerup', onUp); cvs.addEventListener('pointermove', onMove);
    function act(k) {
      if (k === 'exit') return self.close();
      if (k === 'garage') return garage();
      if (k === 'pickcar') return;
      if (k === 'play') { st.playing = !st.playing; playLabel(); hap(); }
      else if (k === 'prev' || k === 'next') { unfocus(); nextStop(k === 'next' ? 1 : -1); }
      else if (k === 'focusnext') { var u = upcoming(15); if (u) focus(u.sp); }
      else if (k === 'speed') { st.speed = (st.speed + 1) % SPEEDS.length; speedLabel(); hap(); }
      else if (k === 'suggest') { st.styleHist.push(st.style); var i = STYLES.findIndex(function (s) { return s.id === st.style; }); setStyle(STYLES[(i + 1) % STYLES.length].id); }
      else if (k === 'prevstyle') { if (!st.styleHist.length) return toast('No previous landscape'); setStyle(st.styleHist.pop()); }
      else if (k === 'flip') flipBoard();
      else if (k === 'open' && st.lastRead && P.openCard) P.openCard(st.lastRead.ref);
      persist();
    }
    root.addEventListener('click', function (e) {
      if (st.intro && e.target.closest('.kd-intro')) { e.preventDefault(); return skipIntro(); }
      var car2 = e.target.closest('[data-car]'); if (car2) { e.preventDefault(); $('.kd-garage').hidden = true; return setCar(car2.dataset.car, true); }
      var b = e.target.closest('[data-kd]'); if (b) { e.preventDefault(); act(b.dataset.kd); }
    });
    function onKey(e) {
      if (e.target && /input|textarea|select/i.test(e.target.tagName)) return;
      var k = e.key, m = { ' ': 'play', ArrowRight: 'next', ArrowLeft: 'prev', s: 'speed', S: 'speed', l: 'suggest', L: 'suggest' }[k];
      if (k === 'b' || k === 'B') { e.preventDefault(); brake(true); return; }
      if (st.focus && (k === 'f' || k === 'F')) { e.preventDefault(); return flipBoard(); }
      if (k === 'Escape') { e.preventDefault(); if (st.focus) return unfocus(); return self.close(); }
      if (k === 'Enter') { e.preventDefault(); return act('focusnext'); }
      if (k === 'ArrowUp' || k === 'ArrowDown') { e.preventDefault(); st.speed = clamp(st.speed + (k === 'ArrowUp' ? 1 : -1), 0, SPEEDS.length - 1); speedLabel(); return; }
      if (m) { e.preventDefault(); act(m); }
    }
    function onKeyUp(e) { if (e.key === 'b' || e.key === 'B') brake(false); }
    window.addEventListener('keydown', onKey); window.addEventListener('keyup', onKeyUp);
    // 🛑 brake pedal: hold to slow down and stop; let go and the car drives on (if it was driving)
    function brake(on) { if (st.braking === on) return; st.braking = on; root.classList.toggle('braking', on); if (on) hap(); }
    var bk = $('.kd-brake');
    bk.addEventListener('pointerdown', function (e) { e.preventDefault(); try { bk.setPointerCapture(e.pointerId); } catch (x) {} brake(true); });
    ['pointerup', 'pointercancel', 'lostpointercapture'].forEach(function (ev) { bk.addEventListener(ev, function () { brake(false); }); });
    function setStyle(id) { st.style = id; applyStyle(); rebuildScenery(); var TS = styleById(id); toast(TS.icon + ' ' + (TS.trip ? 'Road Trip · ' : '') + TS.name); persist(); }

    // ---------------- garage: six cars; picking one plays the start-up again
    function garage() {
      var g = $('.kd-garage'); if (!g.hidden) { g.hidden = true; return; }
      var list = $('.kd-glist'); list.innerHTML = '';
      CARS.list.forEach(function (c) {
        var b = document.createElement('button'); b.type = 'button'; b.dataset.car = c.id; b.className = 'kd-gcar' + (c.id === carNow.id ? ' on' : '');
        var cv = document.createElement('canvas'); cv.width = 360; cv.height = 150; CARS.drawPreview(cv, c);
        b.appendChild(cv); var t = document.createElement('span'); t.innerHTML = '<b>' + esc(c.name) + '</b><small>' + esc(c.tag) + '</small>'; b.appendChild(t);
        list.appendChild(b);
      });
      g.hidden = false;
    }
    function setCar(id, withIntro) {
      var c = CARS.byId(id); try { localStorage.setItem('minest.drive.car', c.id); } catch (e) {}
      setCockpitCar(c); hap();
      if (withIntro) startIntro(); else toast('🚘 ' + c.name);
    }
    // start-up: walk round the car parked on the road, climb in, press START — the dials sweep, the screen boots, off you go
    var exteriorG = null;
    function startIntro() {
      if (exteriorG) { scene.remove(exteriorG); exteriorG = null; }
      exteriorG = CARS.exterior(T, carNow); scene.add(exteriorG);
      st.intro = { t: 0, wasPlaying: st.intro ? st.intro.wasPlaying : st.playing, ign: false };
      st.playing = false; st.v = 0; inst.on = 0; inst.sweep = 0; inst.boot = 0; instruments(true);
      var ov = $('.kd-intro'); ov.hidden = false; ov.className = 'kd-intro'; $('.kd-cap b').textContent = carNow.name;
      root.classList.add('intro');
    }
    function endIntro() {
      if (!st.intro) return; var was = st.intro.wasPlaying; st.intro = null;
      if (exteriorG) { scene.remove(exteriorG); exteriorG.traverse(function (o) { if (o.geometry) o.geometry.dispose(); }); exteriorG = null; }
      inst.on = 1; inst.sweep = null; inst.boot = 0; ambient.material.opacity = .85; instruments(true);
      $('.kd-intro').hidden = true; root.classList.remove('intro', 'incab');
      st.playing = was !== false; playLabel();
    }
    function skipIntro() { if (st.intro) endIntro(); }
    var IC = new T.Vector3(), IP = new T.Vector3();
    function introStep(dt, eye) {
      var I = st.intro; I.t += dt; var t = I.t, ov = $('.kd-intro');
      // the car sits where the driver's seat is: centre a little to the right of the eye
      IC.copy(eye).addScaledVector(F.l, -.35).setY(0);
      exteriorG.position.copy(IC); exteriorG.rotation.y = Math.atan2(-F.t.z, F.t.x);
      if (t < 2.4) {   // walk round: front-left three-quarter → driver's side
        var k = ease(clamp(t / 2.4, 0, 1)), a = lerp(.55, 1.75, k), r = lerp(7.2, 5.4, k);
        IP.copy(IC).addScaledVector(F.t, Math.cos(a) * r).addScaledVector(F.l, Math.sin(a) * r); IP.y = lerp(1.9, 1.35, k);
        cam.position.copy(IP); look.copy(IC); look.y = .7; cam.lookAt(look);
        root.classList.remove('incab'); ov.classList.toggle('dark', false);
      } else if (t < 3.1) {   // to the door, into the seat
        var k2 = ease(clamp((t - 2.4) / .7, 0, 1));
        var door = IC.clone().addScaledVector(F.l, 1.9).addScaledVector(F.t, -.4); door.y = 1.25;
        cam.position.copy(door).lerp(eye, k2); look.copy(IC).lerp(eye.clone().addScaledVector(F.t, 20), k2); look.y = lerp(.8, 1.05, k2); cam.lookAt(look);
        ov.classList.toggle('dark', t > 2.75);
      } else {
        if (exteriorG.visible) exteriorG.visible = false;
        root.classList.add('incab'); ov.classList.toggle('dark', t < 3.35);
        cam.position.copy(eye); look.copy(eye).addScaledVector(F.t, 20); look.y = 1.05; cam.lookAt(look);
        if (t > 3.5 && !I.ign) { I.ign = true; ov.classList.add('ign'); hap(); }
        if (t > 3.6) {   // ignition: lights up, needles sweep to the stop and back, screen boots, ambient fades in
          var s2 = clamp((t - 3.6) / 1.5, 0, 1); inst.on = Math.min(1, s2 * 3); inst.sweep = Math.sin(s2 * Math.PI); inst.boot = s2;
          ambient.material.opacity = .85 * s2; instruments(true);
          cam.position.x += (Math.random() - .5) * .006 * (1 - s2); cam.position.y += (Math.random() - .5) * .006 * (1 - s2);
        }
        if (t > 5.3) return endIntro();
      }
    }

    // ---------------- loop
    var raf = 0, last = 0, mgT = 0, saveT = 0, alive = true, instT = 0;
    function step(now) {
      raf = 0; if (!alive) return; schedule();
      var dt = Math.min(.05, (now - (last || now)) / 1000); last = now;
      // motion
      if (st.anim) {
        var A = st.anim; A.t += dt; var k = clamp(A.t / A.dur, 0, 1), g = lerp(A.from, A.to, ease(k)), prevS = car.s;
        car.seg = segAt(g); car.s = g - car.seg.g0; st.v = Math.abs(car.s - prevS) / Math.max(dt, 1e-3);
        if (k >= 1) { st.anim = null; st.v = 0; if (A.then) A.then(); }
      } else {
        var target = st.playing && !st.braking ? SPEEDS[st.speed][0] : 0;
        st.v = lerp(st.v, target, 1 - Math.exp(-dt * (target > st.v ? .9 : st.braking ? 3.2 : 2.4))); if (st.v < .05 && !target) st.v = 0;
        car.s += st.v * dt;
        while (car.s > car.seg.len) { var nx = nextSeg(car.seg); if (!nx) { ensureAhead(); nx = nextSeg(car.seg); } if (!nx) { car.s = car.seg.len; break; } car.s -= car.seg.len; var was = PL.roads[car.seg.road].region; car.seg = nx; toast((PL.roads[nx.road].region !== was ? '🗺 ' + PL.roads[nx.road].region + ' · ' : '🛣 ') + PL.roads[nx.road].name); }
      }
      ensureAhead();
      // camera
      frame(car.seg, car.s, F);
      var eye = F.p.clone().addScaledVector(F.l, -LANE); eye.y = 1.3 + Math.sin(now / 260) * .012 * Math.min(1, st.v / 8);
      if (st.intro) { introStep(dt, eye); sky.position.copy(cam.position); ground.position.set(cam.position.x, 0, cam.position.z); var sd0 = sun.userData.dir; sunDisc.position.copy(cam.position).addScaledVector(sd0, 480); sunDisc.lookAt(cam.position); sun.position.copy(cam.position).addScaledVector(sd0, 100); sun.target.position.copy(cam.position); R.autoClear = true; R.render(scene, cam); if (root.classList.contains('incab')) { R.autoClear = false; R.clearDepth(); R.render(cock, ccam); R.autoClear = true; } return; }
      cam.position.copy(eye);
      var fsp = st.focus;
      if (fsp && fsp.bb) {   // let go of a board once it is beside / behind the car
        var to = fsp.bb.userData.panel.getWorldPosition(new T.Vector3()).sub(eye).setY(0); if (to.length() < 4 || to.normalize().dot(F.t) < .3) { unfocus(); fsp = null; }
      }
      if (fsp && fsp.bb) {
        fsp.bb.userData.panel.getWorldPosition(lookTo);
        var dist = eye.distanceTo(lookTo), sz = 1.15, vfit = 2 * Math.atan(3.85 * sz / .56 / 2 / dist), hfit = 2 * Math.atan(Math.tan(Math.atan(5.9 * sz / .86 / 2 / dist)) / cam.aspect);
        var want = clamp(T.MathUtils.radToDeg(Math.max(vfit, hfit)), 12, Math.max(baseFov, 98));
        fov = lerp(fov, want, 1 - Math.exp(-dt * 3)); fsp.bb.scale.setScalar(lerp(fsp.bb.scale.x, sz, 1 - Math.exp(-dt * 4)));
      } else {
        var ah = Math.min(car.s + 22, car.seg.lenAll), A2 = frame(car.seg, ah, {}); lookTo.copy(A2.p).addScaledVector(A2.l, -LANE * .7); lookTo.y = 1.05;
        fov = lerp(fov, baseFov, 1 - Math.exp(-dt * 2.5));
        segs.forEach(function (s) { s.stops.forEach(function (sp) { if (sp.bb && sp.bb.scale.x !== 1) { var v = lerp(sp.bb.scale.x, 1, 1 - Math.exp(-dt * 4)); sp.bb.scale.setScalar(Math.abs(v - 1) < .002 ? 1 : v); } }); });
      }
      look.lerp(lookTo, 1 - Math.exp(-dt * (fsp ? 3.2 : 5))); cam.lookAt(look);
      if (Math.abs(cam.fov - fov) > .01) { cam.fov = fov; cam.updateProjectionMatrix(); }
      // flip the board in focus (and turn back any board that is left flipped)
      segs.forEach(function (s) { s.stops.forEach(function (sp) { if (!sp.bb) return; var fc = sp.bb.userData.face, to = sp.flip ? Math.PI : 0; if (Math.abs(fc.rotation.y - to) > .001) fc.rotation.y = lerp(fc.rotation.y, to, 1 - Math.exp(-dt * 7)); }); });
      // reading view: the board sits centred in the windshield, above the dashboard
      var rd = !!fsp;
      var off = 0, offY = rd ? -dash3d / H / 2 : 0;
      st.off = lerp(st.off || 0, off, 1 - Math.exp(-dt * 3)); st.offY = lerp(st.offY || 0, offY, 1 - Math.exp(-dt * 3));
      if (Math.abs(st.off) > .002 || Math.abs(st.offY) > .002) cam.setViewOffset(W, H, -st.off * W, -st.offY * H, W, H); else if (cam.view && cam.view.enabled) cam.clearViewOffset();
      // steering wheel follows the road's bend
      var B = frame(car.seg, Math.min(car.s + 10, car.seg.lenAll), {}), bend = Math.atan2(F.t.x * B.t.z - F.t.z * B.t.x, F.t.x * B.t.x + F.t.z * B.t.z);
      steer = lerp(steer, clamp(-bend * 4, -1.2, 1.2), 1 - Math.exp(-dt * 3)); wheel.rotation.z = steer;
      // sky, sun, light follow the car
      sky.position.copy(eye); ground.position.set(eye.x, 0, eye.z); if (clouds) clouds.position.set(eye.x, 0, eye.z);
      var sd = sun.userData.dir; sunDisc.position.copy(eye).addScaledVector(sd, 480); sunDisc.lookAt(eye); sun.position.copy(eye).addScaledVector(sd, 100); sun.target.position.copy(eye);
      // world management a few times a second
      mgT += dt; if (mgT > .2) { mgT = 0; var gg = gNow(); manageChunks(gg); manageBoards(gg); }
      hudT += dt; if (hudT > .25) { hudT = 0; hud(); }
      instT += dt; if (instT > .12) { instT = 0; instruments(); }
      saveT += dt; if (saveT > 2) { saveT = 0; persist(); }
      R.autoClear = true; R.render(scene, cam); R.autoClear = false; R.clearDepth(); R.render(cock, ccam); R.autoClear = true;
    }
    function schedule() { if (!raf && alive && !document.hidden) raf = requestAnimationFrame(step); }
    function onVis() { if (document.hidden) { if (raf) cancelAnimationFrame(raf); raf = 0; persist(); } else { last = 0; schedule(); } }
    document.addEventListener('visibilitychange', onVis);
    var W = 1, H = 1, dash3d = 120;
    function halfFold() { var c = document.documentElement.classList; return c.contains('duo-halfopen') && c.contains('duo-tall'); }
    function resize() {
      var r = root.getBoundingClientRect(), fold = halfFold(), lower = fold ? Math.round(r.height / 2) : 0;
      root.classList.toggle('fold', fold); if (fold) root.style.setProperty('--kd-dash', lower + 'px');
      W = Math.max(1, r.width); H = Math.max(1, r.height - lower);
      R.setSize(W, H, false); cam.aspect = W / H;
      baseFov = clamp(2 * T.MathUtils.radToDeg(Math.atan(Math.tan(T.MathUtils.degToRad(78) / 2) / cam.aspect)), 55, 86); if (!st.focus) fov = baseFov;
      cam.fov = fov; cam.updateProjectionMatrix(); layoutCockpit(W, H, fold);
      root.classList.toggle('narrow', !fold && (W / H < .9 || W < 560)); hud(true);
    }
    var ro = window.ResizeObserver ? new ResizeObserver(resize) : null; if (ro) ro.observe(root); else window.addEventListener('resize', resize);
    // the Duo's hinge only changes classes on <html>: fold / unfold re-lays the cockpit
    var foldWas = null, mo = new MutationObserver(function () { var f = halfFold(); if (f !== foldWas) { foldWas = f; resize(); } }); mo.observe(document.documentElement, { attributes: true, attributeFilter: ['class'] });
    window.addEventListener('minest:hinge', resize);

    function persist() { if (!car.seg) return; save(PL.key, { road: PL.roads[car.seg.road].id, s: Math.round(car.s), seed: seed, style: st.style, speed: st.speed, at: Date.now() }); }

    // ---------------- start (resume the last drive of this source when there is one)
    var startRoad = PL.start, startS = 0;
    if (saved.road && !opts.fresh) { PL.roads.forEach(function (r, i) { if (r.id === saved.road) startRoad = i; }); startS = saved.s || 0; }
    applyStyle(); speedLabel(); playLabel();
    var first = makeSeg(startRoad, new T.Vector3(0, 0, 0), new T.Vector3(0, 0, -1), null, 0);
    car.seg = first; car.s = clamp(startS, 0, first.len - 5);
    frame(car.seg, car.s, F); look.copy(F.p).addScaledVector(F.t, 20); look.y = 1.05;
    resize(); ensureAhead(); manageChunks(gNow()); manageBoards(gNow()); hud(true);
    setCockpitCar(CARS.byId(carId)); ambient.material.opacity = .85;
    if (opts.intro !== false) startIntro();
    if (startS > 5) toast('Resuming · ' + PL.roads[startRoad].name); else toast('🛣 ' + PL.roads[startRoad].name);
    schedule();

    this.close = function () {
      if (!alive) return; persist(); alive = false; if (raf) cancelAnimationFrame(raf);
      window.removeEventListener('keydown', onKey); window.removeEventListener('keyup', onKeyUp); window.removeEventListener('minest:hinge', resize); mo.disconnect(); document.removeEventListener('visibilitychange', onVis); if (ro) ro.disconnect();
      segs.slice().forEach(disposeSeg); texCache.forEach(function (t) { t.dispose(); }); texCache.clear();
      R.dispose(); root.remove(); if (CUR === self) CUR = null; if (opts.onExit) try { opts.onExit(); } catch (e) {}
    };
    this.state = function () { return { road: PL.roads[car.seg.road].name, s: car.s, g: gNow(), braking: !!st.braking, focus: st.focus ? (st.focus.I || {}).title : null, playing: st.playing, style: st.style, speed: st.speed, segs: segs.length, boards: picks.length, chunks: segs.reduce(function (n, s) { return n + Object.keys(s.chunks).length; }, 0), tex: texCache.size, calls: R.info.render.calls, tris: R.info.render.triangles }; };
    this.setCar = setCar;
    this.focusNext = function () { act('focusnext'); };
    this.choose = function (c) { choose(car.seg, c); };
    this.act = act;
    this._dbg = function () { var g = gNow(), out = []; segs.forEach(function (seg) { seg.stops.forEach(function (sp) { if (sp.bb) out.push([Math.round(seg.g0 + sp.s - g), sp.lod, !!sp.bb.userData.panel.material.map, sp.bb.visible, sp.I && sp.I.title]); }); }); return out; };
    this._jump = function (d) { ensureAhead(); goTo(Math.min(gNow() + d, segs[segs.length - 1].g0 + segs[segs.length - 1].len - 1), .4); };   // testing
    // remember the card being read for "Card ↗"
  }

  window.MinestDrive = {
    version: VERSION,
    styles: STYLES.filter(function (s) { return !s.trip; }).map(function (s) { return { id: s.id, name: s.name, icon: s.icon }; }),
    trips: STYLES.filter(function (s) { return s.trip; }).map(function (s) { return { id: s.id, name: s.name, icon: s.icon }; }),
    cars: function () { return window.MinestCars ? MinestCars.list.map(function (c) { return { id: c.id, name: c.name }; }) : []; },
    plan: function (source, provider) { return plan(provider || defaultProvider(), source); },
    open: function (opts) { if (!window.THREE) throw new Error('three.js is not loaded'); if (CUR) CUR.close(); CUR = new Drive(opts || {}); return CUR; },
    close: function () { if (CUR) CUR.close(); },
    current: function () { return CUR; }
  };
})();

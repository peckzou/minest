/* Minest Image Views & Cover Flow Integration V1.0. Uses the host's React runtime. */
var MinestImageViews = (function() {
  'use strict';
  var states = new Map(), dimensions = new Map(), animation = null, flight = null, epoch = 0;
  var modes = ['board', 'coverflow', 'photos', 'pins'];
  var cloudAssets = new Map(), cloudURLs = new Map();
  function cloudUser() {
    var fb = window.firebase, user = fb && fb.apps && fb.apps.length && fb.auth && fb.auth().currentUser;
    if (!user || !fb.firestore) throw new Error('Sign in to Minest Cloud Sync before importing photos.');
    return { fb: fb, user: user, db: fb.firestore() };
  }
  function cloudAsset(ref, original) {
    if (!ref || ref.provider !== 'firestore') return Promise.resolve(null);
    var key = ref.path + (original ? ':full' : ':thumb');
    if (cloudAssets.has(key)) return cloudAssets.get(key);
    var promise = Promise.resolve().then(function() {
      var cloud = cloudUser();
      if (!ref.path.startsWith('users/' + cloud.user.uid + '/photoAssets/')) throw new Error('This photo belongs to a different cloud account.');
      return cloud.db.doc(ref.path + (original ? '/content/original' : '')).get();
    }).then(function(snapshot) {
      if (!snapshot.exists) throw new Error('The cloud image could not be found.');
      var data = snapshot.data(), bytes = data.image.toUint8Array();
      var url = URL.createObjectURL(new Blob([bytes], { type: data.mime || 'image/jpeg' }));
      cloudURLs.set(key,url);
      cloudAssets.set(key, Promise.resolve(url));
      window.dispatchEvent(new CustomEvent('minest:image-assets', { detail: { path: ref.path } }));
      return url;
    }).catch(function(error) { cloudAssets.delete(key); throw error; });
    cloudAssets.set(key, promise); return promise;
  }
  function encodePhoto(file, maxSize, maxBytes, quality) {
    return new Promise(function(resolve,reject) {
      var url = URL.createObjectURL(file), img = new Image();
      img.onerror = function() { URL.revokeObjectURL(url); reject(new Error('Cannot read ' + file.name + '. Use JPEG, PNG, HEIC supported by this device, or WebP.')); };
      img.onload = function() {
        try {
          var scale = Math.min(1, maxSize / Math.max(img.naturalWidth,img.naturalHeight));
          var canvas = document.createElement('canvas'); canvas.width=Math.max(1,Math.round(img.naturalWidth*scale)); canvas.height=Math.max(1,Math.round(img.naturalHeight*scale));
          var ctx=canvas.getContext('2d');ctx.fillStyle='#fff';ctx.fillRect(0,0,canvas.width,canvas.height);ctx.drawImage(img,0,0,canvas.width,canvas.height);
          var data=canvas.toDataURL('image/jpeg',quality), q=quality;
          while (data.length*.75>maxBytes && q>.32) { q-=.1; data=canvas.toDataURL('image/jpeg',q); }
          if(data.length*.75>maxBytes){var ratio=Math.sqrt(maxBytes/(data.length*.75))*.9;var small=document.createElement('canvas');small.width=Math.max(1,Math.round(canvas.width*ratio));small.height=Math.max(1,Math.round(canvas.height*ratio));small.getContext('2d').drawImage(canvas,0,0,small.width,small.height);canvas=small;data=canvas.toDataURL('image/jpeg',.7);}
          var binary=atob(data.split(',')[1]), bytes=new Uint8Array(binary.length);for(var i=0;i<binary.length;i++)bytes[i]=binary.charCodeAt(i);
          if(bytes.length>maxBytes)throw new Error('This image is too large after optimization. Please choose a smaller image.');
          resolve({data:data,bytes:bytes,width:canvas.width,height:canvas.height});
        }catch(e){reject(e);}finally{URL.revokeObjectURL(url);}
      }; img.src=url;
    });
  }
  async function uploadPhoto(file, boardId) {
    if (!file || (!file.type.startsWith('image/') && !/\.(heic|heif|jpe?g|png|webp|gif)$/i.test(file.name))) throw new Error('Choose an image file.');
    if(file.size>40*1024*1024)throw new Error('Choose an image smaller than 40 MB.');
    var cloud=cloudUser(), id='photo-'+Date.now().toString(36)+'-'+Math.random().toString(36).slice(2,10);
    var path='users/'+cloud.user.uid+'/photoAssets/'+id;
    var full=await encodePhoto(file,4096,720000,.9), thumb=await encodePhoto(file,480,35000,.8), preview=await encodePhoto(file,72,1800,.45);
    var batch=cloud.db.batch();
    batch.set(cloud.db.doc(path),{image:cloud.fb.firestore.Blob.fromUint8Array(thumb.bytes),mime:'image/jpeg',name:file.name,width:full.width,height:full.height,originalBytes:file.size,storedBytes:full.bytes.length,boardId:boardId,createdAt:cloud.fb.firestore.FieldValue.serverTimestamp()});
    batch.set(cloud.db.doc(path+'/content/original'),{image:cloud.fb.firestore.Blob.fromUint8Array(full.bytes),mime:'image/jpeg'});
    await batch.commit();
    var thumbUrl=URL.createObjectURL(new Blob([thumb.bytes],{type:'image/jpeg'}));cloudAssets.set(path+':thumb',Promise.resolve(thumbUrl));cloudURLs.set(path+':thumb',thumbUrl);
    return {type:'image',value:preview.data,width:full.width,height:full.height,asset:{provider:'firestore',path:path,name:file.name,width:full.width,height:full.height,bytes:full.bytes.length}};
  }
  function state(boardId) {
    if (!states.has(boardId)) {
      var prefs = {};
      try { prefs = JSON.parse(localStorage.getItem('minest.imageviews.v2:' + boardId) || '{}') || {}; } catch(e) {}
      states.set(boardId, { selected: null, scroll: {}, priorities: {}, photoSize: Math.max(52, Math.min(340, Number(prefs.photoSize) || ((window.innerWidth || 1200) < 600 ? 105 : 145))), albums: Array.isArray(prefs.albums) ? prefs.albums.filter(function(a) { return a && typeof a.id === 'string' && typeof a.title === 'string' && Array.isArray(a.cardIds); }) : [], activeAlbum: null });
    }
    return states.get(boardId);
  }
  function savePreferences(boardId) {
    var s = state(boardId);
    try { localStorage.setItem('minest.imageviews.v2:' + boardId, JSON.stringify({ photoSize: s.photoSize, albums: s.albums })); } catch(e) {}
  }
  function albumItems(list, album) {
    if (!album) return list;
    return list.filter(function(c) {
      if (album.kind === 'favorites') return !!c.favorite;
      if (album.kind === 'list') return String(c.columnId) === album.sourceId;
      if (album.kind === 'stack') return String(c.id) === album.sourceId || String(c.parentCardId) === album.sourceId;
      return album.cardIds.includes(String(c.id));
    });
  }
  function albums(board, list) {
    var result = [{ id: 'favorites', sourceId: '', kind: 'favorites', title: 'Favorites' }].concat((board.columns || []).map(function(col) { return { id: 'list:' + col.id, sourceId: String(col.id), kind: 'list', title: col.title || 'Untitled album' }; }));
    (board.columns || []).forEach(function(col) { (col.cards || []).forEach(function(c) { if (c.stack && c.stack.length) result.push({ id: 'stack:' + c.id, sourceId: String(c.id), kind: 'stack', title: c.title || 'Untitled stack' }); }); });
    result = result.concat(state(board.id).albums.map(function(a) { return Object.assign({}, a, { kind: 'custom' }); }));
    return result.map(function(a) { return Object.assign({}, a, { items: albumItems(list, a) }); });
  }
  function notifyCollection(boardId) { window.dispatchEvent(new CustomEvent('minest:image-filters', { detail: { boardId: boardId } })); }
  function select(boardId, id, source) {
    if (id != null) id = String(id);
    var s = state(boardId);
    if (s.selected === id) return;
    s.selected = id;
    window.dispatchEvent(new CustomEvent('minest:image-selection', { detail: { boardId: boardId, cardId: id, source: source } }));
  }
  function image(card) {
    var c = card.cover || {}, im = card.image;
    var src = (c.type === 'image' ? c.value : '') || (typeof im === 'string' ? im : im && (im.url || im.src)) || '';
    var originalImage = c.type === 'image' && /\.(webp|png|jpe?g|gif|avif)(?:[?#]|$)/i.test(c.originalUrl || '') ? c.originalUrl : '';
    var full = c.asset && cloudURLs.get(c.asset.path+':full') || c.fullUrl || c.originalImageUrl || originalImage || src;
    var thumb = c.asset && cloudURLs.get(c.asset.path+':thumb') || c.thumbnailUrl || card.thumbnailUrl || (im && im.thumbnailUrl) || src || full;
    // Link-cover originalUrl is a web page, never assume it is an image.
    return { full: full, thumb: thumb, asset: c.asset || null, width: c.width || card.imageWidth || 4, height: c.height || card.imageHeight || 3 };
  }
  function matches(card, board, search, priority) {
    if (search && ![card.title, card.desc, (card.labels || []).join(' ')].join(' ').toLowerCase().includes(search.toLowerCase())) return false;
    if (board.statusFilter === 'pending' && card.complete) return false;
    if (board.statusFilter === 'completed' && !card.complete) return false;
    if (board.activeLabelFilter && board.activeLabelFilter !== 'all' && !(card.labels || []).includes(board.activeLabelFilter)) return false;
    return [board.priorityFilter, priority].every(function(p) {
      return !p || p === 'all' || card.priority === p || (card.stack || []).some(function(c) { return c.priority === p; });
    });
  }
  function sorted(cards, sort) {
    var rank = { high: 1, medium: 2, low: 3 };
    function progress(c) { var x = c.checklistItems || []; return x.length ? x.filter(function(i) { return i.done; }).length / x.length : 0; }
    return cards.slice().sort(function(a, b) {
      if (sort === 'title') return (a.title || '').localeCompare(b.title || '');
      if (sort === 'priority') return (rank[a.priority] || 4) - (rank[b.priority] || 4);
      if (sort === 'mastery') return (a.mastery || 1) - (b.mastery || 1);
      if (sort === 'progress') return progress(b) - progress(a);
      return 0;
    });
  }
  function cards(board, filter, search, ignoreAlbum) {
    var result = [], priorities = state(board.id).priorities;
    (board.columns || []).forEach(function(col) {
      if (filter && filter !== 'all' && filter !== col.id) return;
      var roots = sorted((col.cards || []).filter(function(c) { return matches(c, board, search, priorities[col.id]); }), board.sortBy);
      roots.forEach(function(root) {
        // Preserve original objects and stack membership; this is only a view projection.
        function add(card, parent) {
          result.push(Object.assign({}, card, { columnId: col.id, columnTitle: col.title, columnColor: col.color || '#30d158', parentCardId: parent || null }));
        }
        add(root, null);
        sorted(root.stack || [], board.sortBy).filter(function(c) { return matches(c, board, search, priorities[col.id]); }).forEach(function(c) { add(c, root.id); });
      });
      // A matching child is reachable even when its parent's title does not match search/filter.
      (col.cards || []).filter(function(c) { return roots.indexOf(c) === -1; }).forEach(function(root) {
        sorted(root.stack || [], board.sortBy).filter(function(c) { return matches(c, board, search, priorities[col.id]); }).forEach(function(c) {
          result.push(Object.assign({}, c, { columnId: col.id, columnTitle: col.title, columnColor: col.color || '#30d158', parentCardId: root.id }));
        });
      });
    });
    var active = state(board.id).activeAlbum;
    return ignoreAlbum || !active ? result : albumItems(result, albums(board, result).find(function(a) { return a.id === active; }));
  }
  function node(id) {
    if (id == null) return null;
    return Array.from(document.querySelectorAll('main [data-card-id]')).find(function(el) {
      var r = el.getBoundingClientRect();
      return String(el.dataset.cardId) === String(id) && r.width > 0 && r.height > 0 && r.bottom > 0 && r.top < innerHeight;
    });
  }
  function cancel() {
    epoch++;
    if (animation) animation.cancel();
    if (flight) flight.remove();
    animation = flight = null;
  }
  function transition(boardId, commit) {
    cancel();
    var token = epoch, el = node(state(boardId).selected);
    var img = el && el.querySelector('img'), rect = img && img.getAttribute('src') && img.getBoundingClientRect();
    if (rect && !matchMedia('(prefers-reduced-motion: reduce)').matches) {
      flight = img.cloneNode(false);
      flight.setAttribute('data-miv-flight', 'true');
      flight.removeAttribute('id'); flight.removeAttribute('loading'); flight.setAttribute('aria-hidden', 'true');
      Object.assign(flight.style, { position: 'fixed', left: rect.left + 'px', top: rect.top + 'px', width: rect.width + 'px', height: rect.height + 'px', objectFit: 'cover', pointerEvents: 'none', zIndex: '2147483000', borderRadius: '12px' });
      document.body.appendChild(flight);
    }
    commit();
    var attempts = 0;
    function finish() {
      if (token !== epoch) return;
      var target = node(state(boardId).selected), to = target && target.getBoundingClientRect();
      if ((!to || target === el) && ++attempts < 12) { requestAnimationFrame(finish); return; }
      if (!flight || !to || !flight.animate) { cancel(); return; }
      animation = flight.animate([
        { transform: 'translate(0,0) scale(1)', opacity: 1 },
        { transform: 'translate(' + (to.left - rect.left) + 'px,' + (to.top - rect.top) + 'px) scale(' + (to.width / rect.width) + ',' + (to.height / rect.height) + ')', opacity: 0 }
      ], { duration: 240, easing: 'cubic-bezier(.2,.8,.2,1)', fill: 'forwards' });
      animation.finished.then(function() { if (token === epoch) cancel(); }).catch(function() {});
    }
    requestAnimationFrame(finish);
  }
  window.addEventListener('resize', cancel);
  window.addEventListener('pointerdown', function(e) { if (!e.target.closest('.miv-fan')) cancel(); }, { passive: true });
  window.addEventListener('wheel', cancel, { passive: true });

  // ---------- icons (SF-like line glyphs) ----------
  var ICONS = {
    board: '<rect x="3" y="4" width="5" height="16" rx="1.6"/><rect x="9.5" y="4" width="5" height="11" rx="1.6"/><rect x="16" y="4" width="5" height="13.5" rx="1.6"/>',
    coverflow: '<rect x="8" y="4.5" width="8" height="15" rx="1.6"/><path d="M5.2 6.6 2.5 7.8v8.4l2.7 1.2"/><path d="m18.8 6.6 2.7 1.2v8.4l-2.7 1.2"/>',
    photos: '<rect x="3" y="5" width="18" height="14" rx="2.6"/><circle cx="8.6" cy="10" r="1.7"/><path d="m21 15.5-4.6-4.6L7.5 19"/>',
    pins: '<rect x="3.5" y="3.5" width="7" height="10" rx="2.2"/><rect x="13.5" y="3.5" width="7" height="6" rx="2.2"/><rect x="3.5" y="16" width="7" height="4.5" rx="2"/><rect x="13.5" y="12" width="7" height="8.5" rx="2.2"/>',
    library: '<rect x="6.5" y="3" width="14.5" height="13" rx="2.2"/><path d="M3 7.5V19a2 2 0 0 0 2 2h11.5"/><path d="m6.5 13 3.6-3.6 3.4 3.4 2.1-2.1 5.4 5.3"/>',
    foryou: '<rect x="3.5" y="3.5" width="17" height="17" rx="4.2"/><path d="M12 16.6s-4.4-2.6-4.4-5.5a2.3 2.3 0 0 1 4.4-1 2.3 2.3 0 0 1 4.4 1c0 2.9-4.4 5.5-4.4 5.5z"/>',
    albums: '<rect x="3" y="8.5" width="18" height="12.5" rx="2.2"/><path d="M5.5 5.5h13M8 2.8h8"/>',
    search: '<circle cx="10.5" cy="10.5" r="6.3"/><path d="m20 20-4.9-4.9"/>',
    share: '<path d="M12 3.5v11.5M7.8 7.6 12 3.4l4.2 4.2"/><path d="M8.5 10.5H6.8a2 2 0 0 0-2 2v6.3a2 2 0 0 0 2 2h10.4a2 2 0 0 0 2-2v-6.3a2 2 0 0 0-2-2h-1.7"/>',
    heart: '<path d="M12 20.2s-7.6-4.6-7.6-10.1A4.3 4.3 0 0 1 12 7.6a4.3 4.3 0 0 1 7.6 2.5c0 5.5-7.6 10.1-7.6 10.1z"/>',
    info: '<circle cx="12" cy="12" r="8.8"/><path d="M12 10.8v6"/><circle cx="12" cy="7.7" r=".9" fill="currentColor" stroke="none"/>',
    trash: '<path d="M4 6.6h16M9.4 6.6V4.2h5.2v2.4M6.1 6.6l1 13.6h9.8l1-13.6M10 10.6v6M14 10.6v6"/>',
    more: '<circle cx="5.6" cy="12" r="1.5" fill="currentColor" stroke="none"/><circle cx="12" cy="12" r="1.5" fill="currentColor" stroke="none"/><circle cx="18.4" cy="12" r="1.5" fill="currentColor" stroke="none"/>',
    plus: '<path d="M12 5v14M5 12h14"/>',
    back: '<path d="m14.8 4.5-7.5 7.5 7.5 7.5"/>',
    check: '<path d="m6.5 12.5 3.7 3.7 7.3-8.2"/>',
    folder: '<path d="M3.5 7.5a2 2 0 0 1 2-2h4l2 2.2h7a2 2 0 0 1 2 2v7.8a2 2 0 0 1-2 2h-13a2 2 0 0 1-2-2z"/>'
  };
  function svg(name, cls) { return '<svg class="miv-ic' + (cls ? ' ' + cls : '') + '" viewBox="0 0 24 24" aria-hidden="true" fill="none" stroke="currentColor" stroke-width="1.8" stroke-linecap="round" stroke-linejoin="round">' + ICONS[name] + '</svg>'; }
  function icon(name, filled) {
    return (0, P.jsx)('svg', { className: 'miv-ic', viewBox: '0 0 24 24', 'aria-hidden': true, fill: filled ? 'currentColor' : 'none', stroke: 'currentColor', strokeWidth: 1.8, strokeLinecap: 'round', strokeLinejoin: 'round', dangerouslySetInnerHTML: { __html: ICONS[name] } });
  }

  // ---------- the view switcher: a macOS Dock "Fan" stack from the Dock's Views icon ----------
  var SWITCH = [['board', 'Board'], ['coverflow', '3D'], ['photos', 'Photos'], ['pins', 'Pins']];
  var TITLES = { board: 'Board (Kanban)', coverflow: '3D Cover Flow', photos: 'Photos', pins: 'Pins' };
  function currentMode() { var m = document.body && /(?:^|\s)mode-(\w+)/.exec(document.body.className); return m ? m[1] : null; }
  function studentMode() { try { return !!(window.isStudentMode && window.isStudentMode()); } catch(e) { return false; } }
  function requestMode(m) {
    var cur = currentMode();
    if (m === cur) return;
    var b = null; try { b = window.MinestAI && MinestAI.board && MinestAI.board(); } catch(e) {}
    function go() {
      if (window.SpatialFold && SpatialFold.request) SpatialFold.request(m);
      setTimeout(function() { if (currentMode() !== m) { if (window.__setViewMode) window.__setViewMode(m); else if (window.MinestAI && MinestAI.setViewMode) MinestAI.setViewMode(m); } }, 700);
    }
    if (b && (m === 'photos' || m === 'pins' || cur === 'photos' || cur === 'pins')) transition(b.id, go); else go();
  }
  // which Dock icon was just pressed (its button proxies the original Views button, so the anchor is the Dock icon)
  var lastDock = null, fan = null, fanAnchor = null, fanBlockUntil = 0, fanTimer = 0;
  document.addEventListener('click', function(e) { var b = e.target && e.target.closest && e.target.closest('.mn-bdock .mn-bapp'); if (b) lastDock = { el: b, t: Date.now() }; }, true);
  function visible(el) { if (!el || !el.isConnected) return null; var r = el.getBoundingClientRect(); return r.width > 2 && r.height > 2 && r.bottom > 0 && r.right > 0 && r.top < innerHeight && r.left < innerWidth ? r : null; }
  function dockViewBtn() {
    var all = document.querySelectorAll('.mn-bdock .mn-bapp');
    for (var i = 0; i < all.length; i++) if (/^(Views|Play Game)/.test(all[i].getAttribute('aria-label') || '')) return all[i];
    return null;
  }
  function fanDir(el, r) {
    var R = document.documentElement, dock = el && el.closest && el.closest('.mn-bdock');
    if (dock) {
      if (R.classList.contains('duo-dockpin')) return 'left';
      var p = R.getAttribute('data-mn-bd');
      if (p === 'right') return 'left'; if (p === 'left') return 'right'; if (p === 'bottom') return 'up';
      var d = dock.getBoundingClientRect();
      return d.height > d.width ? (d.left > innerWidth / 2 ? 'left' : 'right') : 'up';
    }
    if (r.left + r.width / 2 > innerWidth - 120) return 'left';
    return r.top + r.height / 2 < innerHeight / 2 ? 'down' : 'up';
  }
  function closeFan(now) {
    var el = fan; if (!el) return;
    fan = null; fanAnchor = null; clearTimeout(fanTimer);
    document.removeEventListener('pointerdown', fanOutside, true);
    document.removeEventListener('keydown', fanKeys, true);
    window.removeEventListener('resize', closeFanNow);
    var a = document.querySelector('[data-miv-fan-anchor]'); if (a) { a.removeAttribute('data-miv-fan-anchor'); a.setAttribute('aria-expanded', 'false'); }
    el.classList.remove('miv-fan-open'); el.classList.add('miv-fan-closing');
    if (now) el.remove(); else setTimeout(function() { el.remove(); }, 260);
  }
  function closeFanNow() { closeFan(true); }
  function fanOutside(e) {
    if (!fan || fan.contains(e.target)) return;
    // a press on the icon that opened it folds it (and its click must not reopen it)
    if (fanAnchor && (fanAnchor === e.target || fanAnchor.contains(e.target))) fanBlockUntil = Date.now() + 700;
    closeFan();
  }
  function fanKeys(e) {
    if (!fan) return;
    if (e.key === 'Escape') { e.preventDefault(); e.stopPropagation(); var a = fanAnchor; closeFan(); if (a && a.focus) a.focus({ preventScroll: true }); return; }
    var items = Array.from(fan.querySelectorAll('.miv-fan-item')), i = items.indexOf(document.activeElement);
    var fwd = { up: 'ArrowUp', down: 'ArrowDown', left: 'ArrowDown', right: 'ArrowDown' }[fan.dataset.dir], back = { up: 'ArrowDown', down: 'ArrowUp', left: 'ArrowUp', right: 'ArrowUp' }[fan.dataset.dir];
    var n = e.key === fwd || (e.key === 'Tab' && !e.shiftKey) ? i + 1 : e.key === back || (e.key === 'Tab' && e.shiftKey) ? i - 1 : e.key === 'Home' ? 0 : e.key === 'End' ? items.length - 1 : null;
    if (n == null) return;
    e.preventDefault(); e.stopPropagation(); items[(n + items.length) % items.length].focus({ preventScroll: true });
  }
  function openFan(anchorEl, r) {
    var dir = fanDir(anchorEl, r), cur = currentMode(), S = 46, GAP = 58;
    var cx = r.left + r.width / 2, cy = r.top + r.height / 2;
    var el = document.createElement('div');
    el.className = 'miv-fan'; el.dataset.dir = dir; el.setAttribute('role', 'menu'); el.setAttribute('aria-label', 'Views');
    el.style.setProperty('--ox', cx + 'px'); el.style.setProperty('--oy', cy + 'px');
    // the points of the stack: a gentle arc that bends away from the Dock as it rises
    var pts = SWITCH.map(function(v, i) {
      var k = i + 1, x, y, rot;
      if (dir === 'up' || dir === 'down') {
        var sg = dir === 'up' ? -1 : 1;
        y = cy + sg * (r.height / 2 + 10 + S / 2 + i * GAP);
        x = cx + 2.6 * k * k;   // the macOS fan's curve
        rot = sg * -1 * (1.2 * k);
      } else {
        var sx = dir === 'left' ? -1 : 1, mid = (SWITCH.length - 1) / 2;
        y = cy + (i - mid) * GAP;
        x = cx + sx * (r.width / 2 + 14 + S / 2 + 10 * (1 - Math.pow((i - mid) / (mid + .5), 2)));
        rot = sx * (i - mid) * 2.2;
      }
      return { x: x, y: y, rot: rot };
    });
    // keep the whole stack on screen (labels included)
    var minY = Math.min.apply(null, pts.map(function(p) { return p.y; })) - S / 2, maxY = Math.max.apply(null, pts.map(function(p) { return p.y; })) + S / 2;
    var shiftY = minY < 8 ? 8 - minY : maxY > innerHeight - 8 ? innerHeight - 8 - maxY : 0;
    var labelLeft = dir !== 'right', LW = 96;
    var minX = Math.min.apply(null, pts.map(function(p) { return p.x; })) - S / 2 - (labelLeft ? LW : 0), maxX = Math.max.apply(null, pts.map(function(p) { return p.x; })) + S / 2 + (labelLeft ? 0 : LW);
    var shiftX = minX < 8 ? 8 - minX : maxX > innerWidth - 8 ? innerWidth - 8 - maxX : 0;
    el.classList.toggle('miv-fan-lr', !labelLeft);
    SWITCH.forEach(function(v, i) {
      var p = pts[i], on = v[0] === cur;
      var b = document.createElement('button'); b.type = 'button'; b.className = 'miv-fan-item'; b.setAttribute('role', 'menuitemradio');
      b.setAttribute('aria-checked', String(on)); b.dataset.viewMode = v[0]; b.title = TITLES[v[0]];
      b.style.setProperty('--x', (p.x + shiftX) + 'px'); b.style.setProperty('--y', (p.y + shiftY) + 'px'); b.style.setProperty('--r', p.rot + 'deg');
      b.style.setProperty('--dx', (cx - p.x - shiftX) + 'px'); b.style.setProperty('--dy', (cy - p.y - shiftY) + 'px');
      b.style.setProperty('--d', (i * 38) + 'ms'); b.style.setProperty('--dc', ((SWITCH.length - 1 - i) * 22) + 'ms');
      b.innerHTML = '<span class="miv-fan-ic">' + svg(v[0]) + '</span><span class="miv-fan-label">' + v[1] + '</span>';
      b.addEventListener('click', function(e) {
        e.stopPropagation();
        try { if (window.MinestNative && window.MinestNative.haptic) window.MinestNative.haptic('light'); } catch(err) {}
        closeFan(); requestMode(v[0]);
      });
      el.appendChild(b);
    });
    document.body.appendChild(el); fan = el; fanAnchor = anchorEl;
    if (anchorEl && anchorEl.setAttribute) { anchorEl.setAttribute('data-miv-fan-anchor', ''); anchorEl.setAttribute('aria-expanded', 'true'); }
    void el.offsetWidth; el.classList.add('miv-fan-open');
    document.addEventListener('pointerdown', fanOutside, true);
    document.addEventListener('keydown', fanKeys, true);
    window.addEventListener('resize', closeFanNow);
    var first = el.querySelector('[aria-checked="true"]') || el.querySelector('.miv-fan-item');
    if (first) first.focus({ preventScroll: true });
  }
  // the original Views button and its Dock icon both land here: fan out (or fold back)
  function openSwitcher(anchor) {
    if (studentMode()) return;
    if (Date.now() < fanBlockUntil) { fanBlockUntil = 0; return; }
    if (fan) { closeFan(); return; }
    var a = lastDock && Date.now() - lastDock.t < 900 && visible(lastDock.el) ? lastDock.el : null;
    lastDock = null;
    if (!a) a = visible(anchor) ? anchor : null;
    if (!a) { var d = dockViewBtn(); a = visible(d) ? d : null; }
    var r = a ? a.getBoundingClientRect() : { left: innerWidth / 2 - 20, top: innerHeight - 70, width: 40, height: 40 };
    openFan(a, r);
  }
  // macOS: the Dock hides with the bars; the pointer resting on the Dock's screen edge brings it back (in every view,
  // Photos and Pins included, where the pinch belongs to the photo grid). Touch keeps the edge swipe.
  var edgeT = 0;
  document.addEventListener('mousemove', function(e) {
    var R = document.documentElement, p = R.getAttribute('data-mn-bd');
    if (!p || e.buttons || !window.MinestChrome || R.classList.contains('mn-chrome')) return;
    if (!(p === 'bottom' ? e.clientY >= innerHeight - 4 : p === 'left' ? e.clientX <= 3 : e.clientX >= innerWidth - 4)) return;
    var now = Date.now(); if (now - edgeT < 400) return; edgeT = now;
    MinestChrome.show();
  }, { passive: true });

  // ---------- small helpers ----------
  function cardTime(c) {
    var t = c.createdAt || c.addedAt || c.created, d = 0;
    if (t) d = typeof t === 'number' ? t : t.seconds ? t.seconds * 1000 : Date.parse(t);
    if (d > 0) return d;
    var m = /(?:^|\D)(1[2-9]\d{11})(?:\D|$)/.exec(String(c.id));
    if (m) return Number(m[1]);
    m = /^(?:image|photo|card)-([0-9a-z]{8,9})-/.exec(String(c.id));
    if (m) { var v = parseInt(m[1], 36); if (v > 1.2e12 && v < 4e12) return v; }
    return 0;
  }
  function byTime(rows) { return rows.map(function(c, i) { return { c: c, t: cardTime(c), i: i }; }).sort(function(a, b) { return (a.t - b.t) || (a.i - b.i); }).map(function(x) { return x.c; }); }
  function fmtDate(t, opts) { try { return new Date(t).toLocaleDateString(undefined, opts); } catch(e) { return ''; } }
  function dateRange(rows) {
    var ts = rows.map(cardTime).filter(Boolean);
    if (!ts.length) return '';
    var a = Math.min.apply(null, ts), b = Math.max.apply(null, ts), o = { month: 'short', day: 'numeric', year: 'numeric' };
    return fmtDate(a, o) === fmtDate(b, o) ? fmtDate(a, o) : fmtDate(a, o) + ' – ' + fmtDate(b, o);
  }
  function groupsOf(rows, kind) {
    var map = new Map(), out = [];
    rows.forEach(function(c) {
      var t = cardTime(c), key, label, sub = '';
      if (t) { var d = new Date(t); key = kind === 'years' ? 'y' + d.getFullYear() : 'm' + d.getFullYear() + '-' + d.getMonth(); label = kind === 'years' ? String(d.getFullYear()) : fmtDate(t, { month: 'long' }); sub = kind === 'years' ? '' : String(d.getFullYear()); }
      else if (kind === 'months') { key = 'l' + c.columnId; label = c.columnTitle || 'Undated'; sub = 'Undated'; }
      else { key = 'undated'; label = 'Undated'; }
      var g = map.get(key);
      if (!g) { g = { key: key, label: label, sub: sub, items: [] }; map.set(key, g); out.push(g); }
      g.items.push(c);
    });
    return out;
  }
  function keyPhoto(rows) { return rows.find(function(c) { return c.favorite && image(c).thumb; }) || rows[Math.floor(rows.length / 2)] || rows[0]; }
  function plain(text) { return String(text || '').replace(/!\[[^\]]*\]\([^)]*\)/g, '').replace(/\[([^\]]*)\]\([^)]*\)/g, '$1').replace(/[#*_>`]/g, '').replace(/https?:\/\/\S+/g, '').replace(/\s+/g, ' ').trim(); }
  function colSets(w) { return w < 600 ? [1, 3, 5, 9] : w < 1000 ? [2, 4, 6, 10] : [3, 5, 8, 12, 16]; }
  function useWidth(ref) {
    var w = (0, _.useState)(0);
    (0, _.useLayoutEffect)(function() {
      var el = ref.current; if (!el) return;
      w[1](el.clientWidth);
      if (!window.ResizeObserver) return;
      var ro = new ResizeObserver(function() { w[1](el.clientWidth); });
      ro.observe(el); return function() { ro.disconnect(); };
    }, []);
    return w[0];
  }
  function loadImage(img) {
    var src = img.getAttribute('data-miv-src') || img.getAttribute('src'), path = img.getAttribute('data-miv-asset');
    img.removeAttribute('data-miv-src'); img.removeAttribute('data-miv-asset');
    if (path) cloudAsset({ provider: 'firestore', path: path }, false).then(function(url) { if (img.isConnected) img.src = url; }).catch(function() { if (src && img.isConnected) img.src = src; });
    else if (src) img.src = src;
  }
  function useLazy(ref, deps) {
    (0, _.useEffect)(function() {
      var box = ref.current; if (!box) return;
      var pending = box.querySelectorAll('img[data-miv-src],img[data-miv-asset]');
      if (!window.IntersectionObserver) { pending.forEach(loadImage); return; }
      var observer = new IntersectionObserver(function(entries) {
        entries.forEach(function(entry) { if (entry.isIntersecting) { loadImage(entry.target); observer.unobserve(entry.target); } });
      }, { root: box, rootMargin: '700px 300px' });
      pending.forEach(function(img) { observer.observe(img); });
      return function() { observer.disconnect(); };
    }, deps);
  }
  function lazyImg(im, extra) {
    return (0, P.jsx)('img', Object.assign({ 'data-miv-src': im.thumb, 'data-miv-asset': im.asset && !cloudURLs.has(im.asset.path + ':thumb') ? im.asset.path : undefined, alt: '', decoding: 'async', draggable: false }, extra || {}));
  }

  // ---------- Photos tile (square crop) ----------
  function PhotoTile(props) {
    var failed = (0, _.useState)(false), im = props.im;
    (0, _.useEffect)(function() { failed[1](false); }, [im.thumb]);
    return (0, P.jsxs)('button', {
      type: 'button', className: 'miv-tile' + (props.chosen ? ' miv-selected' : '') + (props.selecting ? ' miv-selectable' : ''), 'data-card-id': props.card.id,
      'aria-label': props.card.title || 'Untitled image', 'aria-pressed': props.selecting ? !!props.chosen : undefined,
      onClick: props.onClick, onContextMenu: props.onInspect,
      children: [
        !im.thumb || failed[0] ? (0, P.jsx)('span', { className: 'miv-placeholder', children: failed[0] ? 'Unavailable' : '' }) : lazyImg(im, { onError: function() { failed[1](true); } }),
        props.card.favorite ? (0, P.jsx)('span', { className: 'miv-fav-badge', children: icon('heart', true) }) : null,
        props.selecting ? (0, P.jsx)('span', { className: 'miv-selection-check', 'aria-hidden': true, children: props.chosen ? icon('check') : null }) : null
      ]
    });
  }

  // ---------- Pinterest pin (natural aspect) ----------
  function Pin(props) {
    var im = props.im, failed = (0, _.useState)(false);
    var ratio = (0, _.useState)(dimensions.get(im.thumb) || im.width / im.height);
    (0, _.useEffect)(function() { failed[1](false); ratio[1](dimensions.get(im.thumb) || im.width / im.height); }, [im.thumb]);
    var hasImage = im.thumb && !failed[0];
    return (0, P.jsxs)('div', { className: 'miv-pin' + (props.selected ? ' miv-pin-selected' : ''), 'data-card-id': props.card.id, children: [
      (0, P.jsx)('button', { type: 'button', className: 'miv-pin-image', 'aria-label': props.card.title || 'Untitled pin', onClick: props.onOpen,
        style: hasImage ? { aspectRatio: String(ratio[0]) } : { background: props.card.columnColor || '#888' },
        children: hasImage ? lazyImg(im, {
          onLoad: function(e) { if (e.target.naturalWidth && e.target.naturalHeight) { var r = e.target.naturalWidth / e.target.naturalHeight; dimensions.set(im.thumb, r); ratio[1](r); } },
          onError: function() { failed[1](true); }
        }) : (0, P.jsx)('span', { className: 'miv-pin-text', children: props.card.title || 'Untitled' }) }),
      (0, P.jsxs)('div', { className: 'miv-pin-meta', children: [
        (0, P.jsx)('span', { className: 'miv-pin-title', children: props.card.title || 'Untitled' }),
        (0, P.jsx)('button', { type: 'button', className: 'miv-pin-more', 'aria-label': 'More options for ' + (props.card.title || 'pin'), onClick: props.onMore, children: icon('more') })
      ] })
    ] });
  }
  function Masonry(props) {
    var w = props.width || 0, phone = w < 600, gap = phone ? 8 : 16, pad = phone ? 8 : 16;
    var n = phone ? 2 : Math.max(2, Math.floor((w - pad * 2 + gap) / (236 + gap)));
    var colW = phone ? Math.max(60, (w - pad * 2 - gap) / 2) : n > 2 ? 236 : Math.min(295, (w - pad * 2 - gap) / 2);
    var cols = (0, _.useMemo)(function() {
      var out = [], h = [];
      for (var i = 0; i < n; i++) { out.push([]); h.push(0); }
      props.items.forEach(function(c) {
        var im = image(c), r = im.thumb ? (dimensions.get(im.thumb) || im.width / im.height) : 1.4;
        var k = h.indexOf(Math.min.apply(null, h)); out[k].push(c); h[k] += 1 / Math.max(.2, r) + .2;
      });
      return out;
    }, [props.items, n]);
    if (!w) return null;
    return (0, P.jsx)('div', { className: 'miv-masonry', style: { gap: gap + 'px', padding: '0 ' + pad + 'px' }, children: cols.map(function(col, i) {
      return (0, P.jsx)('div', { className: 'miv-masonry-col', style: { width: colW + 'px', gap: (phone ? 12 : 16) + 'px' }, children: col.map(function(c) {
        return (0, P.jsx)(Pin, { card: c, im: image(c), selected: props.selectedId === String(c.id), onOpen: function() { props.onOpen(c); }, onMore: function() { props.onMore(c); } }, c.id);
      }) }, i);
    }) });
  }

  // ---------- full-screen photo viewer (iOS) ----------
  function Viewer(props) {
    var ref=(0,_.useRef)(null), pan=(0,_.useRef)(null), strip=(0,_.useRef)(null), picture=(0,_.useRef)(null), opener=(0,_.useRef)(document.activeElement);
    var poseState=(0,_.useState)({scale:1,x:0,y:0}), pose=poseState[0], poseRef=(0,_.useRef)(pose);
    var chrome=(0,_.useState)(true), error=(0,_.useState)(''), assetRevision=(0,_.useState)(0), dragging=(0,_.useState)(false);
    var runtime=(0,_.useRef)(null), gesture=(0,_.useRef)(null), taps=(0,_.useRef)({at:0,timer:0}), scrub=(0,_.useRef)(null);
    var list=props.cards || [props.card], index=Math.max(0,list.findIndex(function(c){return String(c.id)===String(props.card.id);}));
    var im=image(props.card), t=cardTime(props.card);
    function bound(p) {
      var box=pan.current, img=picture.current;
      if(!box||!img)return p;
      var w=img.naturalWidth||im.width,h=img.naturalHeight||im.height,k=Math.min(box.clientWidth/w,box.clientHeight/h);
      var mx=Math.max(0,(w*k*p.scale-box.clientWidth)/2),my=Math.max(0,(h*k*p.scale-box.clientHeight)/2);
      return {scale:p.scale,x:Math.max(-mx,Math.min(mx,p.x)),y:Math.max(-my,Math.min(my,p.y))};
    }
    function dim(v){ if(ref.current) ref.current.style.setProperty('--miv-dim', String(v)); }
    function apply(p,clamp) { p=clamp===false?p:bound(p);poseRef.current=p;poseState[1](p); }
    function zoomTo(scale,x,y) {
      var old=poseRef.current,box=pan.current.getBoundingClientRect(),dx=(x==null?box.left+box.width/2:x)-box.left-box.width/2,dy=(y==null?box.top+box.height/2:y)-box.top-box.height/2;
      scale=Math.max(1,Math.min(6,scale));
      apply({scale:scale,x:dx-(dx-old.x)*scale/old.scale,y:dy-(dy-old.y)*scale/old.scale});
    }
    // Dragging down shrinks the photo and fades the background, like Photos.
    function dragPose(dx,dy,h){ var p=Math.min(1,Math.max(0,dy)/(h*.55)); dim(1-p*.85); return {scale:1-p*.42,x:dx,y:dy}; }
    function step(d) { if(d<0&&!props.canPrev||d>0&&!props.canNext)return;props.onStep(d); }
    runtime.current={apply:apply,zoom:zoomTo,step:step,close:props.onClose,pose:pose,bound:bound,card:props.card,dragPose:dragPose,dim:dim,dragging:dragging[1]};
    (0,_.useLayoutEffect)(function(){
      var before=document.body.style.overflow;document.body.style.overflow='hidden';ref.current.focus();
      document.body.classList.add('miv-viewer-open');
      return function(){document.body.style.overflow=before;document.body.classList.remove('miv-viewer-open');clearTimeout(taps.current.timer);if(opener.current&&opener.current.isConnected)opener.current.focus({preventScroll:true});};
    },[]);
    (0,_.useEffect)(function(){apply({scale:1,x:0,y:0});dim(1);error[1]('');var alive=true;
      if(im.asset)cloudAsset(im.asset,true).then(function(){if(alive)assetRevision[1](function(n){return n+1;});}).catch(function(e){if(alive)error[1](e.message);});
      return function(){alive=false;};
    },[props.card.id]);
    (0,_.useLayoutEffect)(function(){
      if(!strip.current||scrub.current)return;
      var el=strip.current.querySelector('[aria-current="true"]');if(el)strip.current.scrollLeft=el.offsetLeft-strip.current.clientWidth/2+el.offsetWidth/2;
    },[index]);
    (0,_.useEffect)(function(){
      var box=pan.current;
      function distance(t){return Math.hypot(t[0].clientX-t[1].clientX,t[0].clientY-t[1].clientY);}
      function midpoint(t){return {x:(t[0].clientX+t[1].clientX)/2,y:(t[0].clientY+t[1].clientY)/2};}
      function start(e){
        e.stopPropagation();var p=poseRef.current;
        if(e.touches.length===2){e.preventDefault();clearTimeout(taps.current.timer);gesture.current={kind:'pinch',distance:Math.max(1,distance(e.touches)),pose:Object.assign({},p),mid:midpoint(e.touches)};}
        else if(e.touches.length===1){var t=e.touches[0];gesture.current={kind:p.scale>1.01?'pan':'swipe',x:t.clientX,y:t.clientY,at:performance.now(),pose:Object.assign({},p),moved:false};}
      }
      function move(e){
        var g=gesture.current;if(!g)return;e.stopPropagation();
        if(e.touches.length===2){
          e.preventDefault();if(g.kind!=='pinch'){start(e);return;}var mid=midpoint(e.touches),r=box.getBoundingClientRect(),scale=Math.max(.65,Math.min(6,g.pose.scale*distance(e.touches)/g.distance));
          var ox=g.mid.x-r.left-r.width/2,oy=g.mid.y-r.top-r.height/2;
          if(scale<1)runtime.current.dim(Math.max(.2,1-(1-scale)*2.4));
          runtime.current.apply({scale:scale,x:mid.x-r.left-r.width/2-(ox-g.pose.x)*scale/g.pose.scale,y:mid.y-r.top-r.height/2-(oy-g.pose.y)*scale/g.pose.scale},scale<1?false:true);return;
        }
        if(e.touches.length!==1||g.kind==='pinch')return;
        var dx=e.touches[0].clientX-g.x,dy=e.touches[0].clientY-g.y;
        if(Math.hypot(dx,dy)>5&&!g.moved){g.moved=true;g.axis=Math.abs(dy)>Math.abs(dx)?'y':'x';clearTimeout(taps.current.timer);if(g.axis==='y'&&g.kind==='swipe')runtime.current.dragging(true);}
        if(g.moved)e.preventDefault();
        g.dx=dx;g.dy=dy;
        if(g.kind==='pan')runtime.current.apply({scale:g.pose.scale,x:g.pose.x+dx,y:g.pose.y+dy});
        else if(g.moved)runtime.current.apply(g.axis==='y'?runtime.current.dragPose(dx,dy,box.clientHeight):{scale:1,x:dx,y:0},false);
      }
      function end(e){
        var g=gesture.current;if(!g)return;e.stopPropagation();if(e.cancelable)e.preventDefault();gesture.current=null;runtime.current.dragging(false);
        if(g.kind==='pinch'){if(poseRef.current.scale<.8)runtime.current.close();else{runtime.current.dim(1);runtime.current.zoom(Math.max(1,poseRef.current.scale));}return;}
        if(g.kind==='pan'&&g.moved){runtime.current.apply(poseRef.current);return;}
        if(g.kind==='swipe'&&g.moved){
          var dx=g.dx||0,dy=g.dy||0,dt=Math.max(1,performance.now()-g.at);
          if(g.axis==='x'&&(Math.abs(dx)>45||Math.abs(dx)/dt>.4&&Math.abs(dx)>18))runtime.current.step(dx<0?1:-1);
          else if(g.axis==='y'&&(dy>90||dy/dt>.5&&dy>30)){runtime.current.close();return;}
          runtime.current.dim(1);runtime.current.apply({scale:1,x:0,y:0});return;
        }
        var now=performance.now();
        if(now-taps.current.at<300){clearTimeout(taps.current.timer);runtime.current.zoom(poseRef.current.scale>1.1?1:2.5,g.x,g.y);taps.current.at=0;}
        else{taps.current.at=now;taps.current.timer=setTimeout(function(){chrome[1](function(v){return !v;});},270);}
      }
      function cancel(){gesture.current=null;runtime.current.dragging(false);runtime.current.dim(1);runtime.current.apply({scale:Math.max(1,poseRef.current.scale),x:poseRef.current.x,y:poseRef.current.y});}
      var safari=null;
      function gs(e){e.preventDefault();e.stopPropagation();safari={scale:poseRef.current.scale};}
      function gc(e){e.preventDefault();e.stopPropagation();if(safari&&!gesture.current)runtime.current.zoom(safari.scale*e.scale,e.clientX,e.clientY);}
      function ge(e){e.preventDefault();safari=null;}
      box.addEventListener('touchstart',start,{passive:false});box.addEventListener('touchmove',move,{passive:false});box.addEventListener('touchend',end,{passive:false});box.addEventListener('touchcancel',cancel);
      box.addEventListener('gesturestart',gs,{passive:false});box.addEventListener('gesturechange',gc,{passive:false});box.addEventListener('gestureend',ge,{passive:false});
      return function(){box.removeEventListener('touchstart',start);box.removeEventListener('touchmove',move);box.removeEventListener('touchend',end);box.removeEventListener('touchcancel',cancel);box.removeEventListener('gesturestart',gs);box.removeEventListener('gesturechange',gc);box.removeEventListener('gestureend',ge);};
    },[]);
    var mouse=(0,_.useRef)(null);
    var title=t?fmtDate(t,{weekday:undefined,month:'long',day:'numeric',year:new Date(t).getFullYear()===new Date().getFullYear()?undefined:'numeric'}):(props.card.title||'Photo');
    var sub=t?[new Date(t).toLocaleTimeString(undefined,{hour:'numeric',minute:'2-digit'}),props.card.title].filter(Boolean).join(' · '):(props.card.columnTitle||((index+1)+' of '+list.length));
    var light=document.body.classList.contains('theme-white');
    var tools=[
      props.onShare||props.onOptions?(0,P.jsx)('button',{'aria-label':'Share and organize',title:'Share and organize',onClick:props.onShare||props.onOptions,children:icon('share')},'share'):null,
      props.onFavorite?(0,P.jsx)('button',{'aria-label':props.card.favorite?'Unfavorite':'Favorite',title:props.card.favorite?'Unfavorite':'Favorite','aria-pressed':!!props.card.favorite,className:props.card.favorite?'miv-fav-on':'',onClick:function(){props.onFavorite(props.card);},children:icon('heart',!!props.card.favorite)},'fav'):(0,P.jsx)('button',{'aria-label':pose.scale>1.1?'Fit photo':'Zoom photo',title:pose.scale>1.1?'Fit photo':'Zoom photo',onClick:function(){zoomTo(pose.scale>1.1?1:2.5);},children:icon(pose.scale>1.1?'back':'plus')},'zoom'),
      (0,P.jsx)('button',{'aria-label':'Card details',title:'Card details',onClick:props.onDetails,children:icon('info')},'info'),
      props.onRemove?(0,P.jsx)('button',{'aria-label':'Remove image (keep Card)',title:'Remove image (keep Card)',onClick:function(){props.onRemove(props.card);},children:icon('trash')},'trash'):null
    ].filter(Boolean);
    return (0,P.jsxs)('div',{ref:ref,tabIndex:-1,className:'miv-viewer overlay'+(!chrome[0]?' miv-immersive':'')+(light?' miv-viewer-light':'')+(dragging[0]?' miv-dragging':''),'data-image-scale':pose.scale.toFixed(2),role:'dialog','aria-modal':true,'aria-label':props.card.title||'Photo',
      onKeyDown:function(e){e.stopPropagation();if(e.key==='Escape'){e.preventDefault();props.onClose();}if(e.key==='ArrowRight'){e.preventDefault();step(1);}if(e.key==='ArrowLeft'){e.preventDefault();step(-1);}if(e.key==='+'||e.key==='=')zoomTo(pose.scale*1.4);if(e.key==='-')zoomTo(pose.scale/1.4);if(e.key===' '){e.preventDefault();chrome[1](!chrome[0]);}if(e.key==='Tab'){var buttons=Array.from(ref.current.querySelectorAll('button:not(:disabled)')).filter(function(b){return b.getClientRects().length&&getComputedStyle(b).visibility!=='hidden';});if(buttons.length){var i=buttons.indexOf(document.activeElement);e.preventDefault();buttons[(i+(e.shiftKey?-1:1)+buttons.length)%buttons.length].focus();}}},children:[
        (0,P.jsx)('div',{className:'miv-viewer-bg','aria-hidden':true}),
        (0,P.jsxs)('div',{className:'miv-viewer-bar',children:[
          (0,P.jsx)('button',{className:'miv-viewer-back','aria-label':'Close viewer',title:'Close (Esc)',onClick:props.onClose,children:icon('back')}),
          (0,P.jsxs)('div',{className:'miv-photo-heading',children:[(0,P.jsx)('strong',{children:title}),(0,P.jsx)('small',{children:sub})]}),
          (0,P.jsx)('button',{className:'miv-viewer-more','aria-label':'Photo options',title:'Photo options',onClick:props.onOptions||props.onDetails,children:icon('more')})
        ]}),
        (0,P.jsxs)('div',{className:'miv-viewer-pan',ref:pan,onDoubleClick:function(e){zoomTo(pose.scale>1.1?1:2.5,e.clientX,e.clientY);},
          onClick:function(e){if(e.currentTarget.dataset.dragged){delete e.currentTarget.dataset.dragged;return;}if(e.detail===1&&!mouse.current){var m=e.currentTarget;clearTimeout(taps.current.timer);taps.current.timer=setTimeout(function(){if(m.isConnected)chrome[1](function(v){return !v;});},260);}else if(e.detail>1)clearTimeout(taps.current.timer);},
          onPointerDown:function(e){if(e.pointerType==='touch')return;mouse.current={x:e.clientX,y:e.clientY,pose:poseRef.current,moved:false};e.currentTarget.setPointerCapture(e.pointerId);},
          onPointerMove:function(e){var m=mouse.current;if(!m)return;var dx=e.clientX-m.x,dy=e.clientY-m.y;if(Math.hypot(dx,dy)>5)m.moved=true;if(m.pose.scale>1.01)apply({scale:m.pose.scale,x:m.pose.x+dx,y:m.pose.y+dy});else if(m.moved&&dy>Math.abs(dx))apply(dragPose(dx,dy,pan.current.clientHeight),false);},
          onPointerUp:function(e){if(e.pointerType==='touch')return;var m=mouse.current;mouse.current=null;if(!m)return;var dx=e.clientX-m.x,dy=e.clientY-m.y;if(m.moved)e.currentTarget.dataset.dragged='1';if(m.pose.scale<=1.01&&Math.abs(dx)>45&&Math.abs(dx)>Math.abs(dy))step(dx<0?1:-1);else if(m.pose.scale<=1.01&&dy>90&&dy>Math.abs(dx)){props.onClose();return;}if(m.pose.scale<=1.01&&m.moved){dim(1);apply({scale:1,x:0,y:0});}},
          onWheel:function(e){if(e.ctrlKey||e.metaKey){e.preventDefault();zoomTo(pose.scale*Math.exp(-e.deltaY*.01),e.clientX,e.clientY);}},children:[
            (0,P.jsx)('img',{ref:picture,src:im.full,alt:props.card.title||'',draggable:false,decoding:'async',style:{transform:'translate3d('+pose.x+'px,'+pose.y+'px,0) scale('+pose.scale+')'},onError:function(){error[1]('Image unavailable');}}),
            error[0]?(0,P.jsx)('span',{role:'status',className:'miv-image-error',children:error[0]}):null
          ]}),
        (0,P.jsxs)('div',{className:'miv-viewer-bottom',children:[
          (0,P.jsx)('div',{ref:strip,className:'miv-filmstrip','aria-label':'Quick photo browsing',onPointerDown:function(e){scrub.current={x:e.clientX,index:index,left:strip.current.scrollLeft};e.currentTarget.setPointerCapture(e.pointerId);},onPointerMove:function(e){var g=scrub.current;if(!g||!props.onGo)return;var dx=e.clientX-g.x;if(Math.abs(dx)<8)return;g.moved=true;var n=Math.max(0,Math.min(list.length-1,g.index-Math.round(dx/22)));strip.current.scrollLeft=g.left-dx;props.onGo(n);},onPointerUp:function(e){var g=scrub.current;scrub.current=null;if(g&&!g.moved&&props.onGo){var el=document.elementFromPoint(e.clientX,e.clientY),button=el&&el.closest('[data-film-index]');if(button)props.onGo(Number(button.dataset.filmIndex));}},onPointerCancel:function(){scrub.current=null;},
            children:list.map(function(c,i){var near=Math.abs(i-index)<40;return (0,P.jsx)('button',{'aria-label':'View photo '+(i+1),'aria-current':i===index?'true':undefined,'data-film-index':i,onClick:function(){if(props.onGo)props.onGo(i);},children:near?(0,P.jsx)('img',{src:image(c).thumb,alt:'',loading:'lazy',decoding:'async',draggable:false}):null},c.id);})}),
          (0,P.jsx)('div',{className:'miv-viewer-actions',children:tools})
        ]})
      ]});
  }

  // ---------- action sheet ----------
  function Sheet(props) {
    return (0, P.jsx)('div', { className: 'miv-sheet-overlay overlay', onPointerDown: function(e) { if (e.target === e.currentTarget) props.onClose(); }, children: (0, P.jsxs)('section', { role: 'dialog', 'aria-modal': true, 'aria-label': props.title, className: 'miv-photo-sheet', onKeyDown: function(e) { e.stopPropagation(); if (e.key === 'Escape') props.onClose(); }, children: [
      (0, P.jsxs)('div', { className: 'miv-sheet-heading', key: 'heading', children: [(0, P.jsx)('strong', { children: props.title }), (0, P.jsx)('button', { 'aria-label': 'Close', autoFocus: true, onClick: props.onClose, children: '✕' })] })
    ].concat(props.children) }) });
  }

  // ---------- Photos (iOS 17) + Pins (Pinterest) ----------
  function View(props) {
    var board = props.board, mode = props.mode, s = state(board.id), ref = (0, _.useRef)(null), root = (0, _.useRef)(null), cuRef = (0, _.useRef)(null), scrollAnchor = (0, _.useRef)(null);
    var width = useWidth(root);
    var revision = (0, _.useState)(0), viewer = (0, _.useState)(false), notice = (0, _.useState)('');
    var tab = (0, _.useState)(s.activeAlbum ? 'albums' : 'library'), scale = (0, _.useState)('all');
    var colIdx = (0, _.useState)(typeof s.colIdx === 'number' ? s.colIdx : 1);
    var selectMode = (0, _.useState)(false), chosen = (0, _.useState)([]), sheet = (0, _.useState)(null), sheetCard = (0, _.useRef)(null);
    var albumName = (0, _.useState)(''), rename = (0, _.useState)('');
    var pinCat = (0, _.useState)(props.selectedColFilter || 'all'), closeup = (0, _.useState)(null);
    var uploadTarget=(0,_.useState)(props.selectedColFilter&&props.selectedColFilter!=='all'?props.selectedColFilter:(board.columns[0]&&board.columns[0].id||'')),uploadState=(0,_.useState)({busy:false,message:''}),uploadFiles=(0,_.useRef)(null),replaceFiles=(0,_.useRef)(null),uploadCancel=(0,_.useRef)(false);
    var selectDrag=(0,_.useRef)(null),ignoreClickUntil=(0,_.useRef)(0),zoomAnchor=(0,_.useRef)(null),zoomRuntime=(0,_.useRef)(null),jumpTo=(0,_.useRef)(null);
    var photos = mode === 'photos', sizeCls = (width >= 700 ? ' miv-wide' : '') + (width >= 900 ? ' miv-xwide' : '');
    var list = (0, _.useMemo)(function() {
      if (!photos) return cards(board, pinCat[0], props.searchTerm, true);
      return byTime(cards(board, props.selectedColFilter, props.searchTerm).filter(function(c) { return image(c).full; }));
    }, [board, mode, pinCat[0], props.selectedColFilter, props.searchTerm, revision[0]]);
    var all = (0, _.useMemo)(function() { return cards(board, props.selectedColFilter, props.searchTerm, true); }, [board, props.selectedColFilter, props.searchTerm, revision[0]]);
    var imagesAll = (0, _.useMemo)(function() { return byTime(all.filter(function(c) { return image(c).full; })); }, [all]);
    var albumList = albums(board, imagesAll), activeAlbum = albumList.find(function(a) { return a.id === s.activeAlbum; });
    var inAlbum = photos && tab[0] === 'albums' && !!activeAlbum;
    var gridShown = photos && ((tab[0] === 'library' && scale[0] === 'all') || inAlbum || (tab[0] === 'search' && !!props.searchTerm));
    var sets = colSets(width || innerWidth), cols = sets[Math.max(0, Math.min(sets.length - 1, colIdx[0]))];
    var selected = list.find(function(c) { return String(c.id) === s.selected; }) || (photos ? list[list.length - 1] : list[0]);
    var closeCard = closeup[0] && all.find(function(c) { return String(c.id) === closeup[0]; });
    var scrollKey = mode + ':' + tab[0] + ':' + scale[0] + ':' + (s.activeAlbum || 'all') + ':' + pinCat[0];

    function bump() { revision[1](function(n) { return n + 1; }); }
    function changeCollection(id) {
      s.activeAlbum = id; notice[1](''); scrollAnchor.current = null;
      selectMode[1](false); chosen[1]([]); sheet[1](null);
      var album = albums(board, all).find(function(a) { return a.id === id; }); if (album && album.kind === 'list') uploadTarget[1](album.sourceId);
      bump(); notifyCollection(board.id);
    }
    function goTab(t) {
      if (t === 'library' || t === 'foryou' || t === 'search') { if (s.activeAlbum) changeCollection(null); }
      if (t === 'albums' && tab[0] === 'albums' && s.activeAlbum) changeCollection(null);
      selectMode[1](false); chosen[1]([]); tab[1](t);
    }
    function setCols(next, point) {
      next = Math.max(0, Math.min(sets.length - 1, next));
      if (next === colIdx[0]) return;
      var box = ref.current, el = point && document.elementFromPoint(point.x, point.y);
      el = el && el.closest('.miv-tile');
      if (!el || !box.contains(el)) {
        var r = box.getBoundingClientRect();
        el = document.elementFromPoint(r.left + r.width / 2, r.top + r.height / 2); el = el && el.closest('.miv-tile');
      }
      if (el && box.contains(el)) zoomAnchor.current = { id: el.dataset.cardId, offset: el.getBoundingClientRect().top - box.getBoundingClientRect().top };
      s.colIdx = next; colIdx[1](next);
      try { var prefs = JSON.parse(localStorage.getItem('minest.imageviews.v2:' + board.id) || '{}') || {}; prefs.colIdx = next; prefs.albums = s.albums; localStorage.setItem('minest.imageviews.v2:' + board.id, JSON.stringify(prefs)); } catch(e) {}
    }
    zoomRuntime.current = { idx: colIdx[0], change: setCols, enabled: gridShown && !selectMode[0] && !viewer[0] };
    (0, _.useLayoutEffect)(function() {
      var anchor = zoomAnchor.current, box = ref.current;
      if (!anchor || !box) return;
      var el = box.querySelector('.miv-tile[data-card-id="' + CSS.escape(anchor.id) + '"]');
      if (el) box.scrollTop += el.getBoundingClientRect().top - box.getBoundingClientRect().top - anchor.offset;
      zoomAnchor.current = null;
    }, [colIdx[0]]);
    // Pinch, Ctrl/Cmd-wheel and Safari trackpad gestures snap between column counts.
    (0, _.useEffect)(function() {
      var box = ref.current, pinch = null, wheelAcc = 0, wheelAt = 0, safari = null;
      function distance(t) { return Math.hypot(t[0].clientX - t[1].clientX, t[0].clientY - t[1].clientY); }
      function stepBy(ratio, base, point) {
        if (ratio > 1.28) { zoomRuntime.current.change(zoomRuntime.current.idx - 1, point); return true; }
        if (ratio < .78) { zoomRuntime.current.change(zoomRuntime.current.idx + 1, point); return true; }
        return false;
      }
      function start(e) {
        if (!zoomRuntime.current.enabled || e.touches.length !== 2) return;
        e.preventDefault(); e.stopPropagation(); ignoreClickUntil.current = performance.now() + 700;
        pinch = { distance: Math.max(1, distance(e.touches)) };
      }
      function move(e) {
        if (!pinch || e.touches.length !== 2 || !zoomRuntime.current.enabled) return;
        e.preventDefault(); e.stopPropagation();
        var d = distance(e.touches), point = { x: (e.touches[0].clientX + e.touches[1].clientX) / 2, y: (e.touches[0].clientY + e.touches[1].clientY) / 2 };
        if (stepBy(d / pinch.distance, null, point)) pinch.distance = d;
      }
      function end() { if (pinch) ignoreClickUntil.current = performance.now() + 350; pinch = null; }
      function wheel(e) {
        if (!zoomRuntime.current.enabled || !(e.ctrlKey || e.metaKey)) return;
        e.preventDefault(); e.stopPropagation();
        var now = performance.now(); if (now - wheelAt > 400) wheelAcc = 0; wheelAt = now;
        wheelAcc += e.deltaY * (e.deltaMode === 1 ? 16 : 1);
        if (Math.abs(wheelAcc) > 36) { zoomRuntime.current.change(zoomRuntime.current.idx + (wheelAcc > 0 ? 1 : -1), { x: e.clientX, y: e.clientY }); wheelAcc = 0; wheelAt = now + 160; }
      }
      function gs(e) { if (!zoomRuntime.current.enabled) return; e.preventDefault(); e.stopPropagation(); safari = { base: 1 }; }
      function gc(e) { if (!safari || !zoomRuntime.current.enabled) return; e.preventDefault(); e.stopPropagation(); if (!pinch) { ignoreClickUntil.current = performance.now() + 400; if (stepBy(e.scale / safari.base, null, { x: e.clientX, y: e.clientY })) safari.base = e.scale; } }
      function ge(e) { if (safari) { e.preventDefault(); safari = null; ignoreClickUntil.current = performance.now() + 350; } }
      box.addEventListener('gesturestart', gs, { passive: false }); box.addEventListener('gesturechange', gc, { passive: false }); box.addEventListener('gestureend', ge, { passive: false });
      box.addEventListener('touchstart', start, { passive: false }); box.addEventListener('touchmove', move, { passive: false });
      box.addEventListener('touchend', end); box.addEventListener('touchcancel', end); box.addEventListener('wheel', wheel, { passive: false });
      return function() { box.removeEventListener('gesturestart', gs); box.removeEventListener('gesturechange', gc); box.removeEventListener('gestureend', ge); box.removeEventListener('touchstart', start); box.removeEventListener('touchmove', move); box.removeEventListener('touchend', end); box.removeEventListener('touchcancel', end); box.removeEventListener('wheel', wheel); };
    }, []);
    (0, _.useEffect)(function() {
      try { var prefs = JSON.parse(localStorage.getItem('minest.imageviews.v2:' + board.id) || '{}') || {}; if (typeof prefs.colIdx === 'number') { s.colIdx = prefs.colIdx; colIdx[1](prefs.colIdx); } } catch(e) {}
      notice[1](''); selectMode[1](false); chosen[1]([]); sheet[1](null); closeup[1](null); viewer[1](false);
      uploadTarget[1](board.columns[0] && board.columns[0].id || ''); pinCat[1]('all');
    }, [board.id]);
    useLazy(ref, [list, mode, tab[0], scale[0], s.activeAlbum, cols, width, props.searchTerm]);
    useLazy(cuRef, [closeup[0], list, width]);
    (0, _.useEffect)(function() {
      function refresh(e) { if (!e.detail || e.detail.boardId === board.id) bump(); }
      window.addEventListener('minest:image-selection', refresh);
      window.addEventListener('minest:image-filters', refresh);
      window.addEventListener('minest:image-assets', bump);
      return function() { window.removeEventListener('minest:image-selection', refresh); window.removeEventListener('minest:image-filters', refresh); window.removeEventListener('minest:image-assets', bump); };
    }, [board.id]);
    // Scroll: Photos opens at the newest (bottom); saved positions and the shared selection win.
    (0, _.useLayoutEffect)(function() {
      if (!selected) select(board.id, null, mode); else select(board.id, selected.id, mode);
      var box = ref.current; if (!box) return;
      var saved = s.scroll[scrollKey], el = selected && box.querySelector('[data-card-id="' + CSS.escape(String(selected.id)) + '"]');
      if (jumpTo.current) {
        var target = box.querySelector('[data-card-id="' + CSS.escape(jumpTo.current) + '"]'); jumpTo.current = null;
        if (target) { box.scrollTop = target.offsetTop - (photos ? box.clientHeight * .28 : 80); return; }
      }
      if (saved && selected && saved.cardId === String(selected.id)) { box.scrollTop = saved.top; scrollAnchor.current = !photos && el ? { id: String(selected.id), offset: saved.offset } : null; return; }
      if (photos && (tab[0] === 'library' || inAlbum)) {
        if (el && selected !== list[list.length - 1]) box.scrollTop = el.offsetTop - box.clientHeight / 2 + el.offsetHeight / 2;
        else box.scrollTop = box.scrollHeight;
      } else if (!photos && el && selected !== list[0]) box.scrollTop = el.offsetTop - box.clientHeight / 3;
      else box.scrollTop = 0;
      scrollAnchor.current = !photos && el ? { id: String(selected.id), offset: el.getBoundingClientRect().top - box.getBoundingClientRect().top } : null;
    }, [board.id, mode, scrollKey, props.searchTerm, props.selectedColFilter, board.sortBy, board.statusFilter, board.priorityFilter, board.activeLabelFilter, width > 0]);
    // Pins: late image sizes change column heights; hold the selected pin until the user scrolls.
    (0, _.useEffect)(function() {
      if (photos || !window.ResizeObserver) return;
      var box = ref.current, layout = box.querySelector('.miv-masonry');
      if (!layout) return;
      var observer = new ResizeObserver(function() {
        var anchor = scrollAnchor.current; if (!anchor || anchor.offset == null) return;
        var el = box.querySelector('[data-card-id="' + CSS.escape(anchor.id) + '"]');
        if (el) box.scrollTop += el.getBoundingClientRect().top - box.getBoundingClientRect().top - anchor.offset;
      });
      observer.observe(layout); return function() { observer.disconnect(); };
    }, [board.id, mode, list, width]);
    (0,_.useEffect)(function(){
      if(Array.isArray(board.photoAlbums)){
        var incoming=board.photoAlbums.filter(function(a){return a&&typeof a.id==='string'&&typeof a.title==='string'&&Array.isArray(a.cardIds);}).map(function(a){return {id:a.id,title:a.title,cardIds:a.cardIds.map(String)};});
        if(JSON.stringify(incoming)!==JSON.stringify(s.albums)){s.albums=incoming;savePreferences(board.id);bump();}
      }else if(s.albums.length&&props.onUpdateBoard){props.onUpdateBoard(function(b){return Object.assign({},b,{photoAlbums:s.albums.map(function(a){return Object.assign({},a,{cardIds:a.cardIds.slice()});})});});}
    },[board.id,board.photoAlbums]);
    (0,_.useEffect)(function(){if(!notice[0])return;var timer=setTimeout(function(){notice[1]('');},4500);return function(){clearTimeout(timer);};},[notice[0]]);
    (0,_.useEffect)(function(){ if(cuRef.current) cuRef.current.scrollTop=0; },[closeup[0]]);

    var uploadSignedIn=false;try{cloudUser();uploadSignedIn=true;}catch(e){}
    function pick(card) { select(board.id, card.id, mode); }
    function persistAlbums(){savePreferences(board.id);if(props.onUpdateBoard)props.onUpdateBoard(function(b){return Object.assign({},b,{photoAlbums:s.albums.map(function(a){return {id:a.id,title:a.title,cardIds:a.cardIds.slice()};})});});}
    function target(){ return sheetCard.current || null; }
    function selectedIds(){ if(sheetCard.current) return [String(sheetCard.current.id)]; return selectMode[0]?chosen[0]:(selected?[String(selected.id)]:[]); }
    function managedPhoto(){var ids=selectedIds();return ids.length===1?all.find(function(c){return String(c.id)===ids[0];}):null;}
    function details(card) { viewer[1](false); sheet[1](null); card=card||target()||managedPhoto()||selected; if(card&&props.onOpenCardModal)props.onOpenCardModal(card.columnId,card.id); }
    function editPhoto(card,patch){if(!card||!props.onUpdateBoard)return;props.onUpdateBoard(function(b){return Object.assign({},b,{columns:b.columns.map(function(col){if(col.id!==card.columnId)return col;return Object.assign({},col,{cards:col.cards.map(function(c){if(String(c.id)===String(card.id))return Object.assign({},c,patch);return Object.assign({},c,{stack:(c.stack||[]).map(function(s){return String(s.id)===String(card.id)?Object.assign({},s,patch):s;})});})});})});});}
    function toggleFavorite(card){ if(!card)return; editPhoto(card,{favorite:!card.favorite}); }
    function toggleChosen(card){var id=String(card.id);chosen[1](function(ids){return ids.includes(id)?ids.filter(function(x){return x!==id;}):ids.concat([id]);});}
    function openViewer(card){ pick(card); if(image(card).full) viewer[1](true); }
    function tapPhoto(card){if(performance.now()<ignoreClickUntil.current)return;if(selectMode[0]){toggleChosen(card);return;}openViewer(card);}
    function openSheet(kind, card){ sheetCard.current=card||null; var c=card||managedPhoto(); rename[1](c?c.title||'':''); sheet[1](kind); }
    function closeSheet(){ sheet[1](null); sheetCard.current=null; }
    function startSelection(e){
      if(!selectMode[0]||e.button!=null&&e.button!==0)return;var tile=e.target.closest('.miv-tile');if(!tile)return;
      var i=list.findIndex(function(c){return String(c.id)===tile.dataset.cardId;});if(i<0)return;
      selectDrag.current={start:i,base:chosen[0].slice(),add:!chosen[0].includes(String(list[i].id)),last:i,moved:false,x:e.clientX,y:e.clientY,pointer:e.pointerId};
    }
    function moveSelection(e){var g=selectDrag.current;if(!g)return;if(Math.hypot(e.clientX-g.x,e.clientY-g.y)<7&&!g.moved)return;if(!g.moved)e.currentTarget.setPointerCapture(e.pointerId);g.moved=true;var box=ref.current,r=box.getBoundingClientRect();
      var el=document.elementFromPoint(e.clientX,e.clientY),tile=el&&el.closest('.miv-tile');var i=tile?list.findIndex(function(c){return String(c.id)===tile.dataset.cardId;}):g.last;if(i<0)i=g.last;g.last=i;
      var range=list.slice(Math.min(i,g.start),Math.max(i,g.start)+1).map(function(c){return String(c.id);});chosen[1](g.add?Array.from(new Set(g.base.concat(range))):g.base.filter(function(id){return !range.includes(id);}));
      var delta=e.clientY>r.bottom-120?14:e.clientY<r.top+110?-14:0;if(delta)box.scrollTop+=delta;e.preventDefault();
    }
    function endSelection(){if(selectDrag.current&&selectDrag.current.moved)ignoreClickUntil.current=performance.now()+350;selectDrag.current=null;}
    async function importFiles(files,replacing){
      if(!files||!files.length)return;try{cloudUser();}catch(e){uploadState[1]({busy:false,message:e.message});sheet[1]('upload');return;}
      if(!props.onUpdateBoard){uploadState[1]({busy:false,message:'Photo saving is not available in this view.'});return;}
      uploadCancel.current=false;var done=0,items=Array.from(files),dest=replacing?replacing.columnId:uploadTarget[0];
      if(!dest){uploadState[1]({busy:false,message:'Choose a destination List first.'});return;}
      uploadState[1]({busy:true,message:'Uploading 0 of '+items.length});
      try{for(var i=0;i<items.length;i++){
        if(uploadCancel.current)break;
        uploadState[1]({busy:true,message:'Uploading '+(i+1)+' of '+items.length+'…'});
        var cover=await uploadPhoto(items[i],board.id);
        if(replacing){editPhoto(replacing,{cover:cover,image:null});done++;break;}
        var card={id:'image-'+Date.now().toString(36)+'-'+Math.random().toString(36).slice(2,8),title:items[i].name.replace(/\.[^.]+$/,''),cover:cover,complete:false,createdAt:Date.now(),labels:[],checklistItems:[]};
        (function(photo){props.onUpdateBoard(function(b){return Object.assign({},b,{columns:b.columns.map(function(col){return col.id===dest?Object.assign({},col,{cards:(col.cards||[]).concat([photo])}):col;})});});})(card);
        if(activeAlbum&&activeAlbum.kind==='custom'){var a=s.albums.find(function(a){return a.id===activeAlbum.id;});if(a){a.cardIds.push(card.id);persistAlbums();}}
        pick(card);done++;
      }
      uploadState[1]({busy:false,message:done+' photo'+(done===1?'':'s')+' saved to your cloud library'+(uploadCancel.current?' · stopped':'')});
      if(done){sheet[1](null);notice[1](done+' photos imported');}
      }catch(e){uploadState[1]({busy:false,message:(done?done+' photos saved. ':'')+(e.code==='permission-denied'?'Cloud access was denied. Check your Minest cloud account.':e.message||'Upload failed. Your original photos were not changed.')});}
      finally{if(uploadFiles.current)uploadFiles.current.value='';if(replaceFiles.current)replaceFiles.current.value='';}
    }
    function createAlbum(e) {
      e.preventDefault();
      var title = albumName[0].trim(); if (!title) return;
      var initial=selectMode[0]?chosen[0].slice():[];
      s.albums.push({ id: 'album:' + Date.now().toString(36) + Math.random().toString(36).slice(2,7), title: title.slice(0,80), cardIds: initial });
      persistAlbums(); albumName[1](''); selectMode[1](false); chosen[1]([]); closeSheet();
      notice[1](initial.length?'Album created with '+initial.length+' photos.':'Album created. Select photos, then tap Share › Add to Album.');
      bump();
    }
    function addToAlbum(id) {
      var album = s.albums.find(function(a) { return a.id === id; });
      var ids=selectedIds();if (!album || !ids.length) return;
      ids.forEach(function(id){if(!album.cardIds.includes(id))album.cardIds.push(id);});
      persistAlbums(); notice[1]('Added to ' + album.title); closeSheet(); selectMode[1](false); chosen[1]([]); bump(); notifyCollection(board.id);
    }
    function removeFromAlbum(){var a=activeAlbum&&s.albums.find(function(a){return a.id===activeAlbum.id;});var ids=selectedIds();if(a){a.cardIds=a.cardIds.filter(function(id){return !ids.includes(id);});persistAlbums();bump();notifyCollection(board.id);}closeSheet();selectMode[1](false);chosen[1]([]);}
    function removeImages(){var ids=selectedIds();if(!ids.length||!props.onUpdateBoard)return;props.onUpdateBoard(function(b){return Object.assign({},b,{columns:b.columns.map(function(col){return Object.assign({},col,{cards:col.cards.map(function(c){var next=ids.includes(String(c.id))?Object.assign({},c,{cover:null,image:null}):Object.assign({},c);if(c.stack)next.stack=c.stack.map(function(s){return ids.includes(String(s.id))?Object.assign({},s,{cover:null,image:null}):s;});return next;})});})});});closeSheet();viewer[1](false);chosen[1]([]);selectMode[1](false);notice[1]((ids.length>1?ids.length+' images':'Image')+' removed. The Cards are kept.');}
    function movePhotos(dest){var ids=selectedIds();if(!ids.length||!props.onUpdateBoard)return;props.onUpdateBoard(function(b){var moving=[];var cols=b.columns.map(function(col){var remaining=[];col.cards.forEach(function(c){if(ids.includes(String(c.id))){moving.push(c);return;}if(c.stack){var keep=[];c.stack.forEach(function(s){if(ids.includes(String(s.id)))moving.push(s);else keep.push(s);});remaining.push(Object.assign({},c,{stack:keep,hasStack:keep.length>0}));}else remaining.push(c);});return Object.assign({},col,{cards:remaining});});return Object.assign({},b,{columns:cols.map(function(col){return col.id===dest?Object.assign({},col,{cards:col.cards.concat(moving)}):col;})});});closeSheet();chosen[1]([]);selectMode[1](false);if(s.activeAlbum&&s.activeAlbum.indexOf('list:')===0)changeCollection(null);notice[1]('Moved to the selected List.');}
    function showUpload(){try{cloudUser();uploadState[1]({busy:false,message:''});}catch(e){uploadState[1]({busy:false,message:e.message});}if(activeAlbum&&activeAlbum.kind==='list')uploadTarget[1](activeAlbum.sourceId);sheetCard.current=null;sheet[1]('upload');}
    function openAlbum(id){ tab[1]('albums'); changeCollection(id); }

    // ----- render pieces -----
    function cover(c, cls) {
      var im = c && image(c);
      return (0, P.jsx)('span', { className: 'miv-cover ' + (cls || ''), children: im && im.thumb ? lazyImg(im) : (0, P.jsx)('span', { className: 'miv-cover-empty', children: icon('photos') }) });
    }
    function grid(rows) {
      if (!rows.length) return (0, P.jsxs)('div', { className: 'miv-empty', children: [(0, P.jsx)('strong', { children: inAlbum ? 'No Photos' : props.searchTerm ? 'No Results' : 'No Photos' }), (0, P.jsx)('span', { children: inAlbum && activeAlbum.kind === 'custom' ? 'Select photos in your Library and add them to this album.' : props.searchTerm ? 'No photos match “' + props.searchTerm + '”.' : 'Tap ••• › Import Photos to add images to this board.' })] });
      return (0, P.jsx)('div', { className: 'miv-photos', style: { gridTemplateColumns: 'repeat(' + cols + ',minmax(0,1fr))' }, 'data-cols': cols, children: rows.map(function(c) {
        return (0, P.jsx)(PhotoTile, { card: c, im: image(c), selecting: selectMode[0], chosen: selectMode[0] && chosen[0].includes(String(c.id)),
          onClick: function() { tapPhoto(c); }, onInspect: function(e) { e.preventDefault(); pick(c); openSheet('options', c); } }, c.id);
      }) });
    }
    function moments(kind) {
      var groups = groupsOf(list, kind);
      if (!groups.length) return grid(list);
      return (0, P.jsx)('div', { className: 'miv-moments miv-moments-' + kind, children: groups.map(function(g) {
        var k = keyPhoto(g.items);
        return (0, P.jsxs)('button', { type: 'button', className: 'miv-moment', 'data-card-id': k && k.id, 'aria-label': g.label + (g.sub ? ' ' + g.sub : '') + ', ' + g.items.length + ' photos',
          onClick: function() { jumpTo.current = String(g.items[0].id); scale[1]('all'); },
          children: [cover(k), (0, P.jsxs)('span', { className: 'miv-moment-label', children: [(0, P.jsx)('strong', { children: g.label }), (0, P.jsx)('small', { children: (g.sub ? g.sub + ' · ' : '') + g.items.length + ' Photos' })] })] }, g.key);
      }) });
    }
    function forYou() {
      var lists = (board.columns || []).map(function(col) { return { col: col, items: imagesAll.filter(function(c) { return String(c.columnId) === String(col.id); }) }; }).filter(function(x) { return x.items.length; });
      var featured = imagesAll.filter(function(c) { return c.favorite; });
      var stride = Math.max(1, Math.floor(imagesAll.length / 12));
      for (var i = 0; featured.length < 12 && i < imagesAll.length; i += stride) if (featured.indexOf(imagesAll[i]) < 0) featured.push(imagesAll[i]);
      if (!lists.length) return (0, P.jsxs)('div', { className: 'miv-empty', children: [(0, P.jsx)('strong', { children: 'No Memories Yet' }), (0, P.jsx)('span', { children: 'Memories appear when your Lists have photos.' })] });
      return (0, P.jsxs)('div', { className: 'miv-foryou', children: [
        (0, P.jsxs)('div', { className: 'miv-section-head', children: [(0, P.jsx)('h3', { children: 'Memories' }), (0, P.jsx)('span', { children: lists.length + ' Lists' })] }),
        (0, P.jsx)('div', { className: 'miv-memories', children: lists.map(function(x) {
          var k = keyPhoto(x.items), range = dateRange(x.items);
          return (0, P.jsxs)('button', { type: 'button', className: 'miv-memory', 'aria-label': (x.col.title || 'List') + ', ' + x.items.length + ' photos', onClick: function() { openAlbum('list:' + x.col.id); }, children: [
            cover(k), (0, P.jsxs)('span', { className: 'miv-memory-label', children: [(0, P.jsx)('strong', { children: x.col.title || 'Untitled List' }), (0, P.jsx)('small', { children: range || x.items.length + ' Photos' })] })
          ] }, x.col.id);
        }) }),
        (0, P.jsxs)('div', { className: 'miv-section-head', children: [(0, P.jsx)('h3', { children: 'Featured Photos' })] }),
        (0, P.jsx)('div', { className: 'miv-featured', children: featured.map(function(c) {
          return (0, P.jsx)('button', { type: 'button', className: 'miv-featured-item', 'data-card-id': c.id, 'aria-label': c.title || 'Photo', onClick: function() { openViewer(c); }, children: cover(c) }, c.id);
        }) })
      ] });
    }
    function albumTile(a) {
      var k = keyPhoto(a.items);
      return (0, P.jsxs)('button', { type: 'button', className: 'miv-album', 'data-album-id': a.id, 'aria-label': a.title + ', ' + a.items.length + ' photos', onClick: function() { openAlbum(a.id); }, children: [
        a.kind === 'favorites' && !a.items.length ? (0, P.jsx)('span', { className: 'miv-cover miv-cover-fav', children: icon('heart') }) : cover(k),
        (0, P.jsx)('span', { className: 'miv-album-title', children: a.title }),
        (0, P.jsx)('span', { className: 'miv-album-count', children: a.items.length })
      ] }, a.id);
    }
    function albumsPage() {
      var mine = albumList.filter(function(a) { return a.kind === 'favorites' || a.kind === 'custom'; });
      var listsA = albumList.filter(function(a) { return a.kind === 'list'; }), stacks = albumList.filter(function(a) { return a.kind === 'stack'; });
      function section(title, rows, extra) { return rows.length ? [(0, P.jsxs)('div', { className: 'miv-section-head', children: [(0, P.jsx)('h3', { children: title }), extra || (0, P.jsx)('span', { children: rows.length })] }, 'h' + title), (0, P.jsx)('div', { className: 'miv-albums-grid', children: rows.map(albumTile) }, 'g' + title)] : []; }
      return (0, P.jsx)('div', { className: 'miv-albums-page', children: [].concat(
        section('My Albums', mine, (0, P.jsx)('button', { type: 'button', className: 'miv-link', onClick: function() { openSheet('newalbum'); }, children: 'New Album' })),
        section('Lists', listsA), section('Stacks', stacks)) });
    }
    function searchPage() {
      if (props.searchTerm) return grid(list);
      var listsA = albumList.filter(function(a) { return a.kind === 'list' && a.items.length; });
      var mine = albumList.filter(function(a) { return (a.kind === 'custom' || a.kind === 'favorites') && a.items.length; });
      function rows(title, items) { return items.length ? [(0, P.jsx)('div', { className: 'miv-section-head', children: (0, P.jsx)('h3', { children: title }) }, 'h' + title), (0, P.jsx)('div', { className: 'miv-search-rows', children: items.map(function(a) {
        return (0, P.jsxs)('button', { type: 'button', className: 'miv-search-row', onClick: function() { openAlbum(a.id); }, children: [cover(keyPhoto(a.items)), (0, P.jsxs)('span', { children: [(0, P.jsx)('strong', { children: a.title }), (0, P.jsx)('small', { children: a.items.length + ' Photos' })] }), (0, P.jsx)('i', { 'aria-hidden': true, children: '›' })] }, a.id);
      }) }, 'r' + title)] : []; }
      return (0, P.jsx)('div', { className: 'miv-search-page', children: [].concat(rows('Lists', listsA), rows('Albums', mine)) });
    }
    function sheets() {
      var k = sheet[0]; if (!k) return null;
      var ids = selectedIds(), one = managedPhoto();
      if (k === 'upload') return (0, P.jsx)(Sheet, { title: 'Import Photos', onClose: closeSheet, children: [
        (0,P.jsx)('p',{children:'Personal cloud library › '+board.title},'a'),
        (0,P.jsx)('label',{htmlFor:'miv-upload-dest',children:'Destination List'},'b'),
        (0,P.jsx)('select',{id:'miv-upload-dest','aria-label':'Upload destination',value:uploadTarget[0],disabled:uploadState[0].busy,onChange:function(e){uploadTarget[1](e.target.value);},children:board.columns.map(function(col){return (0,P.jsx)('option',{value:col.id,children:col.title},col.id);})},'c'),
        activeAlbum?(0,P.jsx)('p',{children:'Album: '+activeAlbum.title},'d'):null,
        (0,P.jsx)('p',{className:'miv-upload-note',children:'Images are optimized and saved to your signed-in Minest account, so they can load on Mac and iPhone. Original Cards are retained.'},'e'),
        uploadState[0].message?(0,P.jsx)('p',{role:'status',children:uploadState[0].message},'f'):null,
        !uploadSignedIn?(0,P.jsx)('button',{onClick:function(){closeSheet();if(props.onOpenCloudSync)props.onOpenCloudSync();},children:'Sign in to Cloud Sync'},'g'):null,
        (0,P.jsx)('button',{className:'miv-sheet-primary',disabled:uploadState[0].busy||!uploadSignedIn,onClick:function(){uploadFiles.current.click();},children:'Choose Photos…'},'h'),
        uploadState[0].busy?(0,P.jsx)('button',{onClick:function(){uploadCancel.current=true;uploadState[1]({busy:true,message:'Stopping after the current photo…'});},children:'Stop after current photo'},'i'):null
      ] });
      if (k === 'newalbum') return (0, P.jsx)(Sheet, { title: 'New Album', onClose: closeSheet, children: [
        (0, P.jsxs)('form', { className: 'miv-album-form', onSubmit: createAlbum, children: [
          (0, P.jsx)('input', { autoFocus: true, maxLength: 80, value: albumName[0], 'aria-label': 'Album name', placeholder: 'Title', onChange: function(e) { albumName[1](e.target.value); } }),
          (0, P.jsx)('button', { type: 'submit', className: 'miv-sheet-primary', disabled: !albumName[0].trim(), children: selectMode[0] && chosen[0].length ? 'Save with ' + chosen[0].length + ' Photos' : 'Save' })
        ] }, 'f')
      ] });
      if (k === 'plus') return (0, P.jsx)(Sheet, { title: 'Add', onClose: closeSheet, children: [
        (0, P.jsx)('button', { onClick: function() { openSheet('newalbum'); }, children: 'New Album…' }, 'a'),
        (0, P.jsx)('button', { onClick: showUpload, children: 'Import Photos…' }, 'b')
      ] });
      if (k === 'remove') return (0, P.jsx)(Sheet, { title: ids.length > 1 ? 'Remove ' + ids.length + ' Images?' : 'Remove Image?', onClose: closeSheet, children: [
        (0, P.jsx)('p', { children: 'The image' + (ids.length > 1 ? 's are' : ' is') + ' removed from ' + (ids.length > 1 ? 'these Cards' : 'this Card') + '. The Card' + (ids.length > 1 ? 's' : '') + ', notes and checklists are kept.' }, 'p'),
        (0, P.jsx)('button', { className: 'miv-remove-photo', onClick: removeImages, children: 'Remove Image' + (ids.length > 1 ? 's' : '') }, 'r'),
        (0, P.jsx)('button', { onClick: closeSheet, children: 'Cancel' }, 'c')
      ] });
      if (k === 'pin') { var c = target(); return c ? (0, P.jsx)(Sheet, { title: c.title || 'Pin', onClose: closeSheet, children: [
        image(c).full ? (0, P.jsx)('button', { onClick: function() { closeSheet(); openViewer(c); }, children: 'View full image' }, 'v') : null,
        (0, P.jsx)('button', { onClick: function() { closeSheet(); pick(c); closeup[1](String(c.id)); }, children: 'Open Pin' }, 'o'),
        (0, P.jsx)('button', { onClick: function() { details(c); }, children: 'Card details' }, 'd'),
        props.onUpdateBoard ? (0, P.jsx)('button', { onClick: function() { toggleFavorite(c); closeSheet(); }, children: c.favorite ? 'Remove from Favorites' : 'Add to Favorites' }, 'f') : null
      ] }) : null; }
      var gridOk = gridShown;
      return (0, P.jsx)(Sheet, { title: ids.length > 1 ? ids.length + ' Photos' : one ? (one.title || 'Photo') : 'Library', onClose: closeSheet, children: [
        gridOk && !sheetCard.current ? (0,P.jsxs)('div',{className:'miv-sheet-zoom',children:[(0,P.jsx)('button',{'aria-label':'Larger photos',disabled:colIdx[0]<=0,onClick:function(){setCols(colIdx[0]-1);},children:'−'}),(0,P.jsx)('span',{children:cols+(cols===1?' column':' columns')}),(0,P.jsx)('button',{'aria-label':'Smaller photos',disabled:colIdx[0]>=sets.length-1,onClick:function(){setCols(colIdx[0]+1);},children:'+'})]},'z') : null,
        !sheetCard.current ? (0,P.jsx)('button',{onClick:showUpload,children:'Import Photos…'},'i') : null,
        (0,P.jsx)('button',{onClick:function(){openSheet('newalbum',sheetCard.current);},children:ids.length&&selectMode[0]?'New Album with Selection…':'New Album…'},'n'),
        s.albums.length&&ids.length?(0,P.jsx)('select',{value:'','aria-label':'Add to album',onChange:function(e){addToAlbum(e.target.value);},children:[(0,P.jsx)('option',{value:'',disabled:true,children:'Add to Album…'},'x')].concat(s.albums.map(function(a){return (0,P.jsx)('option',{value:a.id,children:a.title},a.id);}))},'a'):null,
        ids.length?(0,P.jsx)('select',{value:'','aria-label':'Move photos to List',onChange:function(e){movePhotos(e.target.value);},children:[(0,P.jsx)('option',{value:'',disabled:true,children:'Move to List…'},'x')].concat(board.columns.map(function(col){return (0,P.jsx)('option',{value:col.id,children:col.title},col.id);}))},'m'):null,
        one?(0,P.jsxs)('form',{className:'miv-photo-rename',onSubmit:function(e){e.preventDefault();if(rename[0].trim()){editPhoto(one,{title:rename[0].trim()});closeSheet();}},children:[(0,P.jsx)('input',{'aria-label':'Photo title',value:rename[0],onChange:function(e){rename[1](e.target.value);},maxLength:200}),(0,P.jsx)('button',{type:'submit',children:'Rename'})]},'r'):null,
        one&&props.onUpdateBoard?(0,P.jsx)('button',{onClick:function(){toggleFavorite(one);closeSheet();},children:one.favorite?'Unfavorite':'Favorite'},'f'):null,
        one?(0,P.jsx)('button',{onClick:function(){var c=one;closeSheet();sheetCard.current=c;replaceFiles.current.click();},children:'Replace Image…'},'p'):null,
        one?(0,P.jsx)('button',{onClick:function(){details(one);},children:'Card Details'},'d'):null,
        activeAlbum&&activeAlbum.kind==='custom'&&ids.length?(0,P.jsx)('button',{onClick:removeFromAlbum,children:'Remove from Album'},'ra'):null,
        ids.length?(0,P.jsx)('button',{className:'miv-remove-photo',onClick:function(){sheet[1]('remove');},children:'Remove Image'+(ids.length>1?'s':'')+'…'},'rm'):null
      ] });
    }

    var fileInputs = [
      (0,P.jsx)('input',{ref:uploadFiles,type:'file',accept:'image/*',multiple:true,hidden:true,'aria-label':'Choose photos to upload',onChange:function(e){importFiles(e.target.files,null);}},'up'),
      (0,P.jsx)('input',{ref:replaceFiles,type:'file',accept:'image/*',hidden:true,'aria-label':'Choose replacement photo',onChange:function(e){var c=sheetCard.current||managedPhoto();sheetCard.current=null;importFiles(e.target.files,c);}},'rp')
    ];
    var viewerEl = viewer[0] && selected ? (0, P.jsx)(Viewer, { card: selected, cards: list, onGo: function(i) { if (list[i]) pick(list[i]); },
      onOptions: function() { openSheet('options', selected); }, onShare: function() { openSheet('options', selected); },
      onFavorite: props.onUpdateBoard ? toggleFavorite : null, onRemove: props.onUpdateBoard ? function(c) { openSheet('remove', c); } : null,
      canPrev: list.indexOf(selected) > 0, canNext: list.indexOf(selected) < list.length - 1,
      onClose: function() { viewer[1](false); }, onDetails: function() { details(selected); },
      onStep: function(d) { var c = list[list.indexOf(selected) + d]; if (c) pick(c); } }, 'viewer') : null;
    var noticeEl = notice[0] ? (0, P.jsx)('p', { className: 'miv-notice', role: 'status', children: notice[0] }, 'notice') : null;

    // ===== Pins =====
    if (!photos) {
      var cats = [{ id: 'all', title: 'All' }].concat((board.columns || []).map(function(col) { return { id: col.id, title: col.title || 'Untitled' }; }));
      var more = closeCard ? all.filter(function(c) { return String(c.columnId) === String(closeCard.columnId) && String(c.id) !== String(closeCard.id); }) : [];
      var cim = closeCard && image(closeCard), desc = closeCard && plain(closeCard.desc || closeCard.meaning).slice(0, 280);
      var colCount = closeCard ? all.filter(function(c) { return String(c.columnId) === String(closeCard.columnId); }).length : 0;
      return (0, P.jsxs)('section', { ref: root, className: 'miv-view miv-pinterest' + sizeCls, 'aria-label': 'Pins', children: [
        (0, P.jsx)('nav', { className: 'miv-chips', 'aria-label': 'Lists', children: cats.map(function(c) {
          return (0, P.jsx)('button', { type: 'button', className: 'miv-chip', 'aria-pressed': pinCat[0] === c.id, onClick: function() { pinCat[1](c.id); closeup[1](null); }, children: c.title }, c.id);
        }) }, 'chips'),
        noticeEl,
        (0, P.jsx)('div', { ref: ref, className: 'miv-scroll', tabIndex: 0,
          onWheel: function() { scrollAnchor.current = null; }, onTouchStart: function() { scrollAnchor.current = null; }, onPointerDown: function() { scrollAnchor.current = null; },
          onScroll: function() { var box = ref.current, el = s.selected && box.querySelector('[data-card-id="' + CSS.escape(s.selected) + '"]'); s.scroll[scrollKey] = { top: box.scrollTop, cardId: s.selected, offset: el ? el.getBoundingClientRect().top - box.getBoundingClientRect().top : undefined }; },
          onKeyDown: function(e) { if (e.key === 'Enter' && selected && e.target === e.currentTarget) { e.preventDefault(); closeup[1](String(selected.id)); } },
          children: list.length ? (0, P.jsx)(Masonry, { items: list, width: width, selectedId: s.selected, onOpen: function(c) { pick(c); closeup[1](String(c.id)); }, onMore: function(c) { pick(c); openSheet('pin', c); } })
            : (0, P.jsxs)('div', { className: 'miv-empty', children: [(0, P.jsx)('strong', { children: 'Nothing here yet' }), (0, P.jsx)('span', { children: 'No cards match the current filters.' })] }) }, 'scroll'),
        closeCard ? (0, P.jsxs)('div', { ref: cuRef, className: 'miv-closeup', role: 'dialog', 'aria-label': closeCard.title || 'Pin', tabIndex: -1,
          onKeyDown: function(e) { if (e.key === 'Escape') { e.stopPropagation(); closeup[1](null); } }, children: [
          (0, P.jsx)('button', { type: 'button', className: 'miv-cu-back', 'aria-label': 'Back', title: 'Back (Esc)', autoFocus: true, onClick: function() { closeup[1](null); }, children: icon('back') }),
          (0, P.jsxs)('article', { className: 'miv-cu-card', children: [
            (0, P.jsx)('button', { type: 'button', className: 'miv-cu-image', 'aria-label': 'View full image', disabled: !cim.full, onClick: function() { openViewer(closeCard); }, children: cim.thumb ? (0, P.jsx)('img', { src: cim.full || cim.thumb, alt: closeCard.title || '', decoding: 'async', draggable: false, onError: function(e) { if (cim.thumb && e.target.src !== cim.thumb) e.target.src = cim.thumb; } }) : (0, P.jsx)('span', { className: 'miv-pin-text', style: { background: closeCard.columnColor }, children: closeCard.title }) }),
            (0, P.jsxs)('div', { className: 'miv-cu-info', children: [
              (0, P.jsxs)('div', { className: 'miv-cu-actions', children: [
                props.onUpdateBoard ? (0, P.jsx)('button', { type: 'button', className: 'miv-cu-icon' + (closeCard.favorite ? ' miv-fav-on' : ''), 'aria-label': closeCard.favorite ? 'Unfavorite' : 'Favorite', 'aria-pressed': !!closeCard.favorite, onClick: function() { toggleFavorite(closeCard); }, children: icon('heart', !!closeCard.favorite) }) : null,
                (0, P.jsx)('button', { type: 'button', className: 'miv-cu-icon', 'aria-label': 'More options', onClick: function() { openSheet('pin', closeCard); }, children: icon('more') }),
                (0, P.jsx)('span', { style: { flex: 1 } }),
                (0, P.jsx)('button', { type: 'button', className: 'miv-save', onClick: function() { details(closeCard); }, children: 'Save' })
              ] }),
              (0, P.jsx)('h2', { className: 'miv-cu-title', children: closeCard.title || 'Untitled' }),
              desc ? (0, P.jsx)('p', { className: 'miv-cu-desc', children: desc }) : null,
              (0, P.jsxs)('button', { type: 'button', className: 'miv-cu-owner', onClick: function() { pinCat[1](String(closeCard.columnId)); closeup[1](null); }, children: [
                (0, P.jsx)('span', { className: 'miv-cu-avatar', style: { background: closeCard.columnColor || '#888' }, children: plain(closeCard.columnTitle).replace(/^[^A-Za-z0-9一-鿿]+/, '').slice(0, 1) || 'L' }),
                (0, P.jsxs)('span', { children: [(0, P.jsx)('strong', { children: closeCard.columnTitle || 'List' }), (0, P.jsx)('small', { children: colCount + ' Pins' })] })
              ] })
            ] })
          ] }),
          more.length ? (0, P.jsx)('h3', { className: 'miv-cu-more', children: 'More to explore' }) : null,
          more.length ? (0, P.jsx)(Masonry, { items: more, width: width, onOpen: function(c) { pick(c); closeup[1](String(c.id)); }, onMore: function(c) { openSheet('pin', c); } }) : null
        ] }, 'closeup') : null,
        sheets(), viewerEl
      ] });
    }

    // ===== Photos =====
    var t0 = tab[0], onPhotos = (t0 === 'library') || inAlbum || (t0 === 'search' && props.searchTerm);
    var title = selectMode[0] ? (chosen[0].length ? chosen[0].length + ' Selected' : 'Select Items') : inAlbum ? activeAlbum.title : t0 === 'library' ? 'Library' : t0 === 'foryou' ? 'For You' : t0 === 'albums' ? 'Albums' : 'Search';
    var subtitle = (t0 === 'library' || inAlbum) ? [dateRange(list), list.length + (list.length === 1 ? ' Item' : ' Items')].filter(Boolean).join(' · ') : t0 === 'foryou' ? fmtDate(Date.now(), { weekday: 'long', month: 'long', day: 'numeric' }) : t0 === 'albums' ? albumList.length + ' Albums' : '';
    var body = t0 === 'library' ? (scale[0] === 'all' ? grid(list) : moments(scale[0])) : t0 === 'foryou' ? forYou() : t0 === 'albums' ? (inAlbum ? grid(list) : albumsPage()) : searchPage();
    var TABS = [['library', 'Library'], ['foryou', 'For You'], ['albums', 'Albums'], ['search', 'Search']];
    return (0, P.jsxs)('section', { ref: root, className: 'miv-view miv-photo-library miv-ios' + sizeCls + (selectMode[0] ? ' miv-select-mode' : '') + (onPhotos ? ' miv-on-photos' : '') + (t0 === 'search' ? ' miv-searching' : '') + (t0 === 'library' && !selectMode[0] ? ' miv-has-seg' : '') + (gridShown && t0 !== 'search' ? ' miv-grid-only' : ''), 'aria-label': 'Photos', children: [
      (0, P.jsx)('div', { ref: ref, className: 'miv-scroll', tabIndex: 0,
        onPointerDown: startSelection, onPointerMove: moveSelection, onPointerUp: endSelection, onPointerCancel: endSelection,
        onScroll: function() { var box = ref.current; s.scroll[scrollKey] = { top: box.scrollTop, cardId: s.selected }; },
        onKeyDown: function(e) { if (e.key === 'Enter' && e.target === e.currentTarget && gridShown && selected) { e.preventDefault(); openViewer(selected); } },
        children: (0, P.jsx)('div', { className: 'miv-layout', children: body }) }, 'scroll'),
      (0, P.jsxs)('header', { className: 'miv-ios-head', children: [
        (0, P.jsxs)('div', { className: 'miv-ios-row1', children: [
          (0, P.jsx)('div', { className: 'miv-row1-side', children: selectMode[0] ? (0, P.jsx)('button', { type: 'button', className: 'miv-glass miv-pill', onClick: function() { chosen[1](chosen[0].length === list.length ? [] : list.map(function(c) { return String(c.id); })); }, children: chosen[0].length === list.length && list.length ? 'Deselect All' : 'Select All' })
            : inAlbum ? (0, P.jsxs)('button', { type: 'button', className: 'miv-glass miv-pill miv-back', 'aria-label': 'Back to Albums', onClick: function() { changeCollection(null); }, children: [icon('back'), 'Albums'] })
            : t0 === 'albums' ? (0, P.jsx)('button', { type: 'button', className: 'miv-glass miv-round', 'aria-label': 'New album or import', title: 'New album or import', onClick: function() { openSheet('plus'); }, children: icon('plus') }) : null }),
          (0, P.jsx)('div', { className: 'miv-row1-side' })
        ] }),
        (0, P.jsxs)('div', { className: 'miv-ios-titlerow', children: [
          (0, P.jsxs)('div', { className: 'miv-ios-titles', children: [
            (0, P.jsx)('h2', { children: t0 === 'library' && !selectMode[0] ? (0, P.jsx)('button', { type: 'button', className: 'miv-library-title', title: 'Choose Board', onClick: function() { window.dispatchEvent(new CustomEvent('minest:open-boards', { detail: { view: 'switch' } })); }, children: title }) : title }),
            subtitle && !selectMode[0] ? (0, P.jsx)('small', { children: subtitle }) : null
          ] }),
          (0, P.jsx)('div', { className: 'miv-ios-actions', children: selectMode[0] ? [
            (0, P.jsx)('button', { type: 'button', className: 'miv-glass miv-pill', onClick: function() { selectMode[1](false); chosen[1]([]); }, children: 'Cancel' }, 'c')
          ] : [
            gridShown && list.length ? (0, P.jsx)('button', { type: 'button', className: 'miv-glass miv-pill', onClick: function() { selectMode[1](true); chosen[1]([]); }, children: 'Select' }, 's') : null,
            t0 !== 'search' ? (0, P.jsx)('button', { type: 'button', className: 'miv-glass miv-round', 'aria-label': 'Search photos', title: 'Search', onClick: function() { goTab('search'); }, children: icon('search') }, 'q') : null,
            (0, P.jsx)('button', { type: 'button', className: 'miv-glass miv-round', 'aria-label': 'Photo library options', title: 'More', onClick: function() { openSheet('options'); }, children: icon('more') }, 'm')
          ] })
        ] }),
        t0 === 'search' ? (0, P.jsxs)('label', { className: 'miv-ios-search', children: [icon('search'), (0, P.jsx)('input', { type: 'search', autoFocus: !props.searchTerm, 'aria-label': 'Search photos', placeholder: 'Photos, Lists, Albums', value: props.searchTerm || '', onChange: function(e) { if (props.onSearchChange) props.onSearchChange(e.target.value); } }),
          props.searchTerm ? (0, P.jsx)('button', { type: 'button', className: 'miv-search-clear', 'aria-label': 'Clear search', onClick: function() { if (props.onSearchChange) props.onSearchChange(''); }, children: '✕' }) : null] }) : null
      ] }, 'head'),
      noticeEl,
      t0 === 'library' && !selectMode[0] ? (0, P.jsx)('div', { className: 'miv-seg', role: 'tablist', 'aria-label': 'Library scale', children: [['years', 'Years'], ['months', 'Months'], ['all', 'All Photos']].map(function(x) {
        return (0, P.jsx)('button', { type: 'button', role: 'tab', 'aria-selected': scale[0] === x[0], onClick: function() { if (scale[0] !== x[0]) { if (x[0] === 'all' && selected) jumpTo.current = String(selected.id); scale[1](x[0]); } }, children: x[1] }, x[0]);
      }) }, 'seg') : null,
      selectMode[0] ? (0, P.jsxs)('nav', { className: 'miv-ios-toolbar', 'aria-label': 'Selection actions', children: [
        (0, P.jsx)('button', { type: 'button', 'aria-label': 'Share and organize selected photos', title: 'Add to Album, Move…', disabled: !chosen[0].length, onClick: function() { openSheet('options'); }, children: icon('share') }),
        (0, P.jsx)('span', { children: chosen[0].length ? chosen[0].length + (chosen[0].length === 1 ? ' Photo' : ' Photos') + ' Selected' : 'Select Items' }),
        (0, P.jsx)('button', { type: 'button', 'aria-label': 'Remove images from selected Cards', title: 'Remove images (keep Cards)', disabled: !chosen[0].length || !props.onUpdateBoard, onClick: function() { openSheet('remove'); }, children: icon('trash') })
      ] }, 'tools') : (0, P.jsx)('nav', { className: 'miv-ios-tabbar', 'aria-label': 'Photos', children: TABS.map(function(x) {
        var on = t0 === x[0];
        return (0, P.jsxs)('button', { type: 'button', 'aria-current': on ? 'page' : undefined, onClick: function() { goTab(x[0]); }, children: [icon(x[0], false), (0, P.jsx)('span', { children: x[1] })] }, x[0]);
      }) }, 'tabs'),
      fileInputs[0], fileInputs[1],
      sheets(), viewerEl
    ] });
  }
  return { state: state, select: select, image: image, cards: cards, albums: albums, albumItems: albumItems, matches: matches, sorted: sorted, transition: transition, cancel: cancel, openSwitcher: openSwitcher, closeSwitcher: function() { closeFan(); }, requestMode: requestMode, cardTime: cardTime, uploadPhoto: uploadPhoto, cloudAsset: cloudAsset, View: View, Viewer: Viewer };
})();
window.MinestImageViews = MinestImageViews;

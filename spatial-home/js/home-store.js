/* Minest · Spatial Home — where the room keeps what you set (2026-11-22).
   One synced store for the rooms' layouts ('bp:home:<room>') and the rooms' default things ('sh:def:<room>'), on every
   page that shows a room. It is Minest's own cloud channel, not a new one: Minest Knowledge (minest.knowledge.v1 →
   the cloud doc users/<uid>/focusboard/data, field `knowledge`, every key { v, t } merged by time).
     · host   — Minest itself is this page, or a same-origin window next to it (the opener, the page this frame is in,
                the app Spatial Home loaded): its MinestKnowledge is used as it is. Its own upload carries the keys.
     · bridge — a frame from another origin inside Minest (the iOS app is a file: page and shows Clun 2.0 from the live
                site): the keys go to the Minest page by postMessage and come back from it. That page answers below.
     · lite   — a page of its own (spatial-home/rooms.html, clun-2/ opened by itself): the same minest.knowledge.v1 in this
                origin's storage (on the website: the same one Minest uses), and the same cloud field, written the way
                Minest Knowledge writes it ({ knowledge: { x: { key: { v, t } } } }, merge). Sign-in is Minest's own
                (Firebase keeps it per site); signed out it stays on this device.
   Offline: every change is kept here first, with its time, in an outbox; it goes up when the network and the account
   are there, and the newer of two changes to one key wins (the same rule the rest of My World uses). After every read
   of the cloud, a key that is newer here than there is sent again (another device's full upload may have dropped it). */
(function (root) {
  'use strict';
  if (root.MinestHomeStore) return;
  var KN_KEY = 'minest.knowledge.v1', OUT_KEY = 'minest.homeStore.outbox.v1';
  var MINE = /^(bp:home:|sh:def:|sh:)/;                          // the keys this store (and a frame through the bridge) may write
  var SITE = 'https://minest-app.vercel.app';
  var FB_CFG = { apiKey: 'AIzaSyBH-SonlmNnTLRYUtvnZ9EEiFQSflo1cX8', authDomain: 'minest-33761.firebaseapp.com', databaseURL: 'https://minest-33761-default-rtdb.firebaseio.com', projectId: 'minest-33761', storageBucket: 'minest-33761.firebasestorage.app' };
  var FB_SDK = ['app', 'auth', 'firestore'].map(function (n) { return 'https://www.gstatic.com/firebasejs/10.8.0/firebase-' + n + '-compat.js'; });
  var listeners = [], st = { mode: 'lite', user: null, email: '', synced: 0, error: '', bridge: false };

  function lsGet(k) { try { return JSON.parse(root.localStorage.getItem(k) || 'null'); } catch (e) { return null; } }
  function lsSet(k, v) { try { root.localStorage.setItem(k, JSON.stringify(v)); return true; } catch (e) { return false; } }
  function emit(keys) { listeners.forEach(function (f) { try { f(keys || null); } catch (e) { if (root.console) console.warn('home store listener', e); } }); }
  function clone(v) { return v == null ? null : JSON.parse(JSON.stringify(v)); }

  /* ---------------------------------------------------------------- host: a Minest Knowledge we can reach */
  function knOf(w) { try { var K = w && w.MinestKnowledge; return K && typeof K.get === 'function' && typeof K._cloud === 'function' ? K : null; } catch (e) { return null; } }
  var hostSeen = null;
  function host() {
    var ws = [root];
    try { if (root.parent && root.parent !== root) ws.push(root.parent); } catch (e) {}
    try { if (root.top && root.top !== root) ws.push(root.top); } catch (e) {}
    try { if (root.opener) ws.push(root.opener); } catch (e) {}
    try { if (root.SpatialBridge && root.SpatialBridge.hostWindow) ws.push(root.SpatialBridge.hostWindow()); } catch (e) {}
    for (var i = 0; i < ws.length; i++) { var K = knOf(ws[i]); if (K) { if (hostSeen !== K) { hostSeen = K; hookHost(K, ws[i]); } return { K: K, w: ws[i] }; } }
    return null;
  }
  function hookHost(K, w) {
    st.mode = 'host';
    /* what was set here before Minest was there (the outbox): handed to it, the newer of each key wins */
    try {
      var x = kl().x, hx = K._cloud().x || {};
      var mine = outbox; outbox = {};
      Object.keys(mine).forEach(function (k) { var a = x[k], b = hx[k]; if (a && (!b || (b.t || 0) < (a.t || 0))) { K.set(k, a.v, true); outbox[k] = ((K._cloud().x || {})[k] || {}).t || Date.now(); } });
      outSave(); setTimeout(flush, 0);
    } catch (e) {}
    try { K.onChange(function () { emit(null); }); } catch (e) {}
    try { var fb = w.firebase; if (fb && fb.auth) fb.auth().onAuthStateChanged(function (u) { st.user = u ? u.uid : null; st.email = u ? (u.email || '') : ''; emit(null); }); } catch (e) {}
    emit(null);
  }

  /* ---------------------------------------------------------------- the local copy (lite and bridge) */
  var KL = null;
  function kLoad() { var v = lsGet(KN_KEY); if (!v || typeof v !== 'object') v = {}; ['h', 'off', 'o', 'm', 't', 'x'].forEach(function (m) { if (!v[m] || typeof v[m] !== 'object') v[m] = {}; }); return (KL = v); }
  function kl() { return KL || kLoad(); }
  root.addEventListener('storage', function (e) { if (e.key === KN_KEY) { KL = null; emit(null); } });
  function kWrite(key, rec) {                                         // re-read first: Minest may be open in another tab of this site
    var v = kLoad(); v.x[key] = rec; if (!lsSet(KN_KEY, v)) st.error = '本机存储已满'; KL = v;
  }
  var outbox = lsGet(OUT_KEY) || {};
  function outSave() { lsSet(OUT_KEY, outbox); }
  function pending() { return Object.keys(outbox).length; }
  /* records from the cloud (or from Minest through the bridge): the newer of each key wins */
  function mergeIn(R) {
    if (!R || typeof R !== 'object') return [];
    var v = kLoad(), changed = [];
    ['h', 'off', 'o', 'm', 't', 'x'].forEach(function (m) {
      var src = R[m] || {};
      Object.keys(src).forEach(function (id) { var a = v[m][id], b = src[id]; if (b && typeof b === 'object' && (!a || (b.t || 0) > (a.t || 0))) { v[m][id] = b; if (m === 'x') changed.push(id); } });
    });
    if (changed.length || Object.keys(R).length) { lsSet(KN_KEY, v); KL = v; }
    return changed;
  }
  /* after a read: a key of ours that is newer here than in what came back is sent again */
  function resend(cloudX) {
    var x = kl().x, n = 0;
    Object.keys(x).forEach(function (k) { if (!MINE.test(k)) return; var a = x[k], b = cloudX && cloudX[k]; if (a && (!b || (a.t || 0) > (b.t || 0)) && !outbox[k]) { outbox[k] = a.t || Date.now(); n++; } });
    if (n) outSave();
    return n;
  }

  /* ---------------------------------------------------------------- lite: Minest's own Firebase project and sign-in */
  var fb = null, db = null, unsub = null, flushing = false;
  function loadScript(src) { return new Promise(function (ok, no) { var s = document.createElement('script'); s.src = src; s.async = false; s.onload = ok; s.onerror = no; document.head.appendChild(s); }); }
  function b64bytes(b64) { var s = atob(b64), a = new Uint8Array(s.length); for (var i = 0; i < s.length; i++) a[i] = s.charCodeAt(i); return a; }
  function gunzip(b64) {
    if (typeof DecompressionStream === 'undefined') return Promise.resolve(null);
    var stream = new Blob([b64bytes(b64)]).stream().pipeThrough(new DecompressionStream('gzip'));
    return new Response(stream).text().then(function (t) { return JSON.parse(t); });
  }
  function cloudKnowledge(data) {                                       // the plain copy (older clients, and our own writes) and the compressed one, merged by time
    var parts = [data && data.knowledge ? Promise.resolve(data.knowledge) : null, data && typeof data.knowledgeGz === 'string' ? gunzip(data.knowledgeGz).catch(function () { return null; }) : null].filter(Boolean);
    return Promise.all(parts).then(function (rs) {
      var out = { x: {} };
      rs.forEach(function (R) { if (!R) return; ['h', 'off', 'o', 'm', 't', 'x'].forEach(function (m) { out[m] = out[m] || {}; Object.keys(R[m] || {}).forEach(function (id) { var a = out[m][id], b = R[m][id]; if (b && (!a || (b.t || 0) > (a.t || 0))) out[m][id] = b; }); }); });
      return out;
    });
  }
  function ref() { return db.collection('users').doc(st.user).collection('focusboard').doc('data'); }
  function take(doc) {
    var data = doc && doc.exists ? doc.data() : null;
    return cloudKnowledge(data).then(function (R) {
      var ch = mergeIn(R).filter(function (k) { return MINE.test(k) || /^mtw:item:/.test(k); });
      st.synced = Date.now(); st.error = '';
      var again = resend(R.x);
      if (ch.length) emit(ch); else emit(null);
      if (again) flush();
    });
  }
  function startLite() {
    if (fb || st.mode !== 'lite') return;
    var ready = root.firebase && root.firebase.firestore ? Promise.resolve() : FB_SDK.reduce(function (p, s) { return p.then(function () { return loadScript(s); }); }, Promise.resolve());
    ready.then(function () {
      fb = root.firebase; if (!fb.apps.length) fb.initializeApp(FB_CFG);
      db = fb.firestore();
      fb.auth().onAuthStateChanged(function (u) {
        if (unsub) { unsub(); unsub = null; }
        st.user = u ? u.uid : null; st.email = u ? (u.email || '') : ''; emit(null);
        if (!u) return;
        unsub = ref().onSnapshot(function (d) { if (!d.metadata || !d.metadata.hasPendingWrites) take(d).catch(function (e) { st.error = String(e && e.message || e); emit(null); }); }, function (e) { st.error = (e && e.code) || '读取云端失败'; emit(null); });
        flush();
      });
    }).catch(function () { st.error = '连不上云端（离线？）· 改动先存在本机'; emit(null); });
  }
  function hostFlush(h) {
    /* 2026-11-26 · Spatial Home sync repair (tools/spatial-home/patch_home_sync.py): on Minest's own page the keys go up
       with Minest's own cloud save (the sync transport, compressed, merged per key with what the cloud has). Before,
       they were written straight to the doc as a plain `knowledge` field with the Firestore SDK: on the iPhone and the
       iPad that write often never arrived, and the next full save dropped keys only that plain field had. A key leaves
       the outbox once Minest's save has taken everything up to the moment it was handed over. */
    if (!pending()) return;
    var x = h.K._cloud().x || {}, newest = 0;
    Object.keys(outbox).forEach(function (k) { if (!x[k]) delete outbox[k]; else newest = Math.max(newest, outbox[k] || 0); });
    var un = hostUnsynced(h);
    if (hostAsk && un === false) Object.keys(outbox).forEach(function (k) { if ((outbox[k] || 0) <= hostAsk) delete outbox[k]; });
    if (pending() && (!hostAsk || newest > hostAsk || un === false || un === null) && !(root.navigator && root.navigator.onLine === false)) {
      hostAsk = Math.max(Date.now(), newest);
      try { h.w.dispatchEvent(new h.w.CustomEvent('minest:cloud-dirty', { detail: { immediate: true, domain: 'spatialHome' } })); } catch (e) {}
      if (un === null) Object.keys(outbox).forEach(function (k) { if ((outbox[k] || 0) <= hostAsk) delete outbox[k]; });   // an older Minest: nothing to wait on
      clearTimeout(hostT); hostT = setTimeout(flush, 4000);
    }
    if (!pending()) { st.synced = Date.now(); st.error = ''; }
    outSave(); emit(null);
  }
  var hostAsk = 0, hostT = 0;
  /* Minest's own record of edits the cloud has not taken yet (its dirtyAt > ackAt); null when it has none */
  function hostUnsynced(h) {
    try {
      var S = h.w.MinestDurableStorage || h.w.localStorage, d = Number(S.getItem('minest.cloud.dirtyAt')), a = Number(S.getItem('minest.cloud.ackAt'));
      if (!d && !a && S.getItem('minest.cloud.dirtyAt') == null) return null;
      return (d || 0) > (a || 0);
    } catch (e) { return null; }
  }
  function flush() {
    if (st.mode === 'bridge') return bridgeFlush();
    var h = host(); if (h) return hostFlush(h);
    if (st.mode !== 'lite' || !db || !st.user || flushing || !pending()) return;
    if (root.navigator && root.navigator.onLine === false) return;
    var x = kl().x, send = {}, sent = {};
    Object.keys(outbox).forEach(function (k) { if (x[k]) { send[k] = x[k]; sent[k] = outbox[k]; } else delete outbox[k]; });
    if (!Object.keys(send).length) { outSave(); return; }
    flushing = true;
    ref().set({ knowledge: { x: send } }, { merge: true }).then(function () {
      Object.keys(sent).forEach(function (k) { if (outbox[k] === sent[k]) delete outbox[k]; });
      outSave(); flushing = false; st.synced = Date.now(); st.error = ''; emit(null);
      if (pending()) flush();
    }).catch(function (e) { flushing = false; st.error = (e && e.code) || '上传失败 · 稍后再试'; emit(null); });
  }
  root.addEventListener('online', function () { flush(); });
  setInterval(function () { if (pending()) flush(); }, 15000);

  /* ---------------------------------------------------------------- bridge: a frame of another origin inside Minest */
  var bseq = 0, bwait = {};
  function bpost(msg) { msg.mnHome = msg.mnHome || 'set'; try { root.parent.postMessage(msg, '*'); } catch (e) {} }
  function bridgeFlush() {
    if (!pending()) return;
    var x = kl().x, send = {}, id = ++bseq;
    Object.keys(outbox).forEach(function (k) { if (x[k]) send[k] = x[k]; else delete outbox[k]; });
    bwait[id] = clone(outbox); bpost({ mnHome: 'set', id: id, x: send });
  }
  root.addEventListener('message', function (e) {
    var m = e.data; if (!m || typeof m.mnHome !== 'string' || e.source !== root.parent || root.parent === root) return;
    if (m.mnHome === 'hi' || m.mnHome === 'push') {
      if (st.mode === 'lite' && !fb) st.mode = 'bridge';
      if (st.mode !== 'bridge') return;
      st.bridge = true; st.user = m.user || null; st.email = m.email || ''; st.synced = Date.now();
      var ch = mergeIn({ x: m.x || {} }); resend(m.x || {});
      emit(ch.length ? ch : null); bridgeFlush();
    } else if (m.mnHome === 'ok' && bwait[m.id]) {
      var w = bwait[m.id]; delete bwait[m.id];
      Object.keys(w).forEach(function (k) { if (outbox[k] === w[k]) delete outbox[k]; }); outSave(); emit(null);
    }
  });

  /* ---------------------------------------------------------------- the Minest side of the bridge (this page is Minest) */
  function frameOf(src) { var fs = document.getElementsByTagName('iframe'); for (var i = 0; i < fs.length; i++) if (fs[i].contentWindow === src) return true; return false; }
  var children = [], took = {};
  function ours() { var K = knOf(root); if (!K) return {}; var x = K._cloud().x || {}, o = {}; Object.keys(x).forEach(function (k) { if (MINE.test(k)) o[k] = x[k]; }); return o; }
  function who() { try { var u = root.firebase && root.firebase.auth && root.firebase.auth().currentUser; return u ? { user: u.uid, email: u.email || '' } : { user: null, email: '' }; } catch (e) { return { user: null, email: '' }; } }
  root.addEventListener('message', function (e) {
    var m = e.data, K = knOf(root); if (!m || typeof m.mnHome !== 'string' || !K || !frameOf(e.source)) return;
    if (!(e.origin === location.origin || e.origin === SITE || (root.__MN_HOME_TRUST__ || []).indexOf(e.origin) >= 0)) return;   // __MN_HOME_TRUST__: a test page's own list (another origin standing in for the live site)
    var src = e.source, w = who();
    if (m.mnHome === 'hello') {
      if (children.indexOf(src) < 0) children.push(src);
      src.postMessage({ mnHome: 'hi', x: ours(), user: w.user, email: w.email }, '*');
    } else if (m.mnHome === 'set' && m.x && typeof m.x === 'object') {
      var x = K._cloud().x || {}, ok = [];
      /* the newer wins; a value this page took from a frame carries this page's time, so it is compared by the frame's own */
      Object.keys(m.x).forEach(function (k) {
        var r = m.x[k]; if (!MINE.test(k) || !r || typeof r !== 'object') return;
        var a = x[k], fromFrame = a && took[k] && took[k].at === a.t;
        if (!a || (a.t || 0) < (r.t || 0) || (fromFrame && took[k].t < (r.t || 0))) { K.set(k, r.v == null ? null : r.v, true); var n = (K._cloud().x || {})[k]; took[k] = { t: r.t || 0, at: n ? n.t : 0 }; }
        ok.push(k);
      });
      src.postMessage({ mnHome: 'ok', id: m.id, keys: ok }, '*');
    }
  });
  function pushChildren() { if (!children.length) return; var w = who(), x = ours(); children = children.filter(function (c) { try { c.postMessage({ mnHome: 'push', x: x, user: w.user, email: w.email }, '*'); return true; } catch (e) { return false; } }); }
  (function watchHost() { var K = knOf(root); if (K) { try { K.onChange(pushChildren); } catch (e) {} } else setTimeout(watchHost, 1000); })();

  /* ---------------------------------------------------------------- the store */
  function liteK() {
    return {
      get: function (key) { var r = kl().x[key]; return r && r.v != null ? clone(r.v) : null; },
      set: function (key, v) { var t = Date.now(); kWrite(key, { v: v == null ? null : clone(v), t: t }); if (MINE.test(key)) { outbox[key] = t; outSave(); flush(); } },
      keys: function (prefix) { var x = kl().x; return Object.keys(x).filter(function (k) { return k.indexOf(prefix) === 0 && x[k] && x[k].v != null; }); }
    };
  }
  var LITE = liteK();
  var S = root.MinestHomeStore = {
    version: '1.0',
    /* the Minest Knowledge-shaped store the room uses (get / set / keys) */
    kn: function () { var h = host(); return h ? h.K : LITE; },
    get: function (key) { var h = host(); return h ? clone(h.K.get(key)) : LITE.get(key); },
    set: function (key, v) {
      var h = host(); if (!h) { LITE.set(key, v); return; }
      h.K.set(key, v, true);
      if (MINE.test(key)) { outbox[key] = ((h.K._cloud().x || {})[key] || {}).t || Date.now(); outSave(); flush(); }
    },
    keys: function (prefix) { return S.kn().keys(prefix); },
    time: function (key) { var h = host(), r = h ? (h.K._cloud().x || {})[key] : kl().x[key]; return r ? r.t || 0 : 0; },
    onChange: function (fn) { listeners.push(fn); },
    flush: flush,
    status: function () {
      var h = host(), on = !(root.navigator && root.navigator.onLine === false), mode = h ? 'host' : st.mode;
      var text = !on ? '离线 · 改动先存在本机，联网后自动上传' + (pending() ? '（' + pending() + ' 项待上传）' : '')
        : mode === 'host' ? (!st.user ? '跟着 Minest 存在本机（登录 Minest 后上云）' : pending() ? '正在上传 ' + pending() + ' 项…' : '已同步 · ' + st.email)
        : !st.user ? (mode === 'bridge' ? '跟着 Minest · 未登录，只在本机' : '未登录 · 只在本机（在同一浏览器里登录 Minest 就会同步）')
        : pending() ? '正在上传 ' + pending() + ' 项…' : '已同步 · ' + st.email;
      return { mode: mode, online: on, user: st.user, email: st.email, pending: pending(), synced: st.synced, error: st.error, text: st.error && on ? text + ' · ' + st.error : text };
    }
  };
  /* which kind of page this is: Minest (or next to it), a frame of another origin inside Minest, or a page of its own */
  function boot() {
    if (host()) return;
    var framed = false; try { framed = root.parent && root.parent !== root; } catch (e) { framed = true; }
    if (framed) {
      bpost({ mnHome: 'hello' });
      setTimeout(function () { if (!st.bridge && !host()) startLite(); }, 1500);   // nobody answered: on our own
    } else startLite();
  }
  if (document.readyState === 'loading') document.addEventListener('DOMContentLoaded', boot); else setTimeout(boot, 0);
})(window);

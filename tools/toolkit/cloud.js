/* Minest · Cognitive Toolkit — cloud sync (window.MinestToolkitCloud)
   Uses Minest's existing Firebase project and Google sign-in (the same public client config the app ships; nothing in
   the project, the rules or the API is changed). The toolkit's records live in their OWN document,
   users/{uid}/focusboard/toolkit — never inside the boards document, so they can't push the boards past Firestore's
   1 MB limit. Merge is per record by time (the newer write wins); deletions are kept as tombstones.
   Until the user turns sync on and is signed in, everything stays in this browser — and the status pill says so. */
(function () {
  'use strict';
  var CFG = { apiKey: 'AIzaSyBH-SonlmNnTLRYUtvnZ9EEiFQSflo1cX8', authDomain: 'minest-33761.firebaseapp.com', projectId: 'minest-33761', storageBucket: 'minest-33761.firebasestorage.app' };
  var SDK = ['firebase-app-compat.js', 'firebase-auth-compat.js', 'firebase-firestore-compat.js'].map(function (f) { return 'https://www.gstatic.com/firebasejs/10.8.0/' + f; });
  var ON_KEY = 'minest.toolkit.cloud', LIMIT = 900 * 1024;
  var st = { on: false, user: null, state: 'off', msg: '', at: 0 }, back = null, onRemote = null, unsub = null, timer = 0, loading = null;
  function tr(s) { return window.MinestI18n ? MinestI18n.t(s) : s; }
  function load(src) { return new Promise(function (ok, no) { var s = document.createElement('script'); s.src = src; s.onload = ok; s.onerror = function () { no(new Error('Could not load ' + src)); }; document.head.appendChild(s); }); }
  function sdk() { if (window.firebase && firebase.firestore) return Promise.resolve(); if (!loading) loading = SDK.reduce(function (p, u) { return p.then(function () { return load(u); }); }, Promise.resolve()); return loading; }
  function app() { if (!firebase.apps.length) firebase.initializeApp(CFG); return firebase; }
  function ref() { return app().firestore().collection('users').doc(st.user.uid).collection('focusboard').doc('toolkit'); }
  function set(state, msg) { st.state = state; st.msg = msg || ''; paint(); }

  function snapshotLocal() { var x = {}; back.allMeta().forEach(function (m) { x[m.k] = { v: back.get(m.k), t: m.t }; }); return x; }
  function merge(remote) {
    var changed = false;
    Object.keys(remote || {}).forEach(function (k) {
      var r = remote[k]; if (!r) return; var lt = back.metaOf(k);
      if ((r.t || 0) > lt) { back.applyRemote(k, r.v == null ? null : r.v, r.t); changed = true; }
    });
    if (changed && onRemote) onRemote();
    return changed;
  }
  function push() {
    if (!st.on || !st.user) return;
    var x = snapshotLocal(), size = JSON.stringify(x).length;
    if (size > LIMIT) return set('error', tr('Too large to sync') + ' (' + Math.round(size / 1024) + ' KB)');
    set('syncing');
    ref().set({ x: x, updatedAt: firebase.firestore.FieldValue.serverTimestamp(), writer: 'cognitive-toolkit' }, { merge: true })
      .then(function () { st.at = Date.now(); set('ok'); })
      .catch(function (e) { set('error', e && e.code === 'permission-denied' ? tr('The cloud refused to save (permission denied)') : (e && e.message || String(e))); });
  }
  function schedule() { if (!st.on || !st.user) return; clearTimeout(timer); timer = setTimeout(push, 1200); }
  function listen() {
    if (unsub) unsub();
    unsub = ref().onSnapshot(function (doc) { var d = doc.exists ? doc.data() : null; if (d && d.x && merge(d.x)) {} st.at = Date.now(); if (st.state !== 'error') set('ok'); }, function (e) { set('error', e && e.code === 'permission-denied' ? tr('The cloud refused to read (permission denied)') : (e && e.message || String(e))); });
  }
  function start() {
    st.on = true; try { localStorage.setItem(ON_KEY, '1'); } catch (e) {}
    set('connecting');
    return sdk().then(function () {
      app().auth().onAuthStateChanged(function (u) {
        st.user = u || null;
        if (!u) { if (unsub) { unsub(); unsub = null; } return set('signin'); }
        set('syncing');
        ref().get().then(function (doc) { var d = doc.exists ? doc.data() : null; if (d && d.x) merge(d.x); push(); listen(); })
          .catch(function (e) { set('error', e && e.code === 'permission-denied' ? tr('The cloud refused to read (permission denied)') : (e && e.message || String(e))); });
      });
    }).catch(function (e) { set('error', e.message); });
  }
  function signIn() {
    var p = new firebase.auth.GoogleAuthProvider(); p.setCustomParameters({ prompt: 'select_account' });
    return app().auth().signInWithPopup(p).catch(function (e) { set('error', e && e.message || String(e)); });
  }
  function stop() { st.on = false; try { localStorage.removeItem(ON_KEY); } catch (e) {} if (unsub) { unsub(); unsub = null; } set('off'); }

  // ---------------------------------------------------------------- the status pill
  function paint() {
    var b = document.getElementById('tk-cloud'); if (!b) return;
    var t = { off: 'Cloud sync: off — this browser only', connecting: 'Connecting…', signin: 'Sign in with Google to sync', syncing: 'Syncing…', ok: 'Synced', error: 'Sync problem' }[st.state];
    b.className = 'tk-cloud s-' + st.state;
    b.querySelector('span').textContent = tr(t) + (st.state === 'ok' && st.at ? ' · ' + new Date(st.at).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }) : '');
    b.title = st.msg || (st.user ? (st.user.email || '') : '');
    var badge = document.querySelector('.tk-topact .badge'); if (badge) badge.hidden = st.state === 'ok' || st.state === 'syncing';
  }
  function menu() {
    if (st.state === 'off' || (st.state === 'error' && !st.user)) return start();
    if (st.state === 'signin') return signIn();
    if (st.state === 'error') { if (confirm(st.msg + '\n\n' + tr('Try again?'))) push(); return; }
    if (confirm(tr('Turn cloud sync off on this device? Your records stay here and in the cloud.'))) stop();
  }

  window.MinestToolkitCloud = {
    init: function (backend, refresh) {
      back = backend; onRemote = refresh;
      var b = document.getElementById('tk-cloud'); if (b) b.onclick = menu;
      var on = false; try { on = localStorage.getItem(ON_KEY) === '1'; } catch (e) {}
      if (on) start(); else paint();
    },
    touch: schedule, status: function () { return Object.assign({}, st); }
  };
})();

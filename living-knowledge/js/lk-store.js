/* Minest Living Knowledge · M1 — where the knowledge is kept (window.MinestLKStore; also a Node module for the tests).
   Its own place, apart from the boards: the cloud doc users/<uid>/focusboard/data (boards + Minest Knowledge + Routine)
   must stay under Firestore's 1 MB, so nothing here is ever written into it.
     cloud   Firestore, one document per thing:  users/<uid>/lk_pages/<id>, lk_decisions, lk_sources, lk_relations, lk_runs,
             lk_meta (permissions, schema); every revision also as  …/<id>/versions/<rev, 8 digits>.
             (The project's rules already allow users/{uid}/{document=**} to that signed-in user only — nothing to change.)
     local   IndexedDB 'minest.lk.v1:<account>' (key → value): d|kind|id the current document, v|kind|id|rev its versions,
             o|seq the changes not yet in the cloud (the outbox), c|kind|id an unresolved conflict.
   Every write goes through MinestLKModel.planWrite (revisions, versions, guards), is kept here first, and goes up from the
   outbox in order. In the cloud each change is a transaction that only lands if the cloud is still at the revision the
   change started from; otherwise it becomes a conflict: the cloud's copy is shown, yours is kept beside it, and you choose.
   Nothing is deleted in M1; a restore writes the old content as a new revision. */
(function (root, factory) {
  var M = (typeof module === 'object' && module.exports) ? require('./lk-model.js') : root.MinestLKModel;
  var S = factory(M);
  if (typeof module === 'object' && module.exports) module.exports = S; else root.MinestLKStore = S;
})(typeof window !== 'undefined' ? window : this, function (M) {
  'use strict';

  var KIND_LIST = ['page', 'decision', 'source', 'relation', 'run', 'meta'];
  function pad(n, w) { n = String(n); while (n.length < w) n = '0' + n; return n; }
  var dkey = function (kind, id) { return 'd|' + kind + '|' + id; };
  var vkey = function (kind, id, rev) { return 'v|' + kind + '|' + id + '|' + pad(rev, 8); };
  var ckey = function (kind, id) { return 'c|' + kind + '|' + id; };
  function errText(e) { return String((e && (e.code || e.message)) || e || '未知错误'); }

  // ================================================================== local adapters (key → JSON value)
  function memoryLocal() {
    var m = new Map();
    return {
      get: function (k) { return Promise.resolve(m.has(k) ? M.clone(m.get(k)) : null); },
      set: function (k, v) { m.set(k, M.clone(v)); return Promise.resolve(); },
      del: function (k) { m.delete(k); return Promise.resolve(); },
      keys: function (prefix) { return Promise.resolve(Array.from(m.keys()).filter(function (k) { return k.indexOf(prefix) === 0; }).sort()); },
      _map: m
    };
  }
  function idbLocal(name, idb) {
    idb = idb || (typeof indexedDB !== 'undefined' ? indexedDB : null);
    var opened = null;
    function open() {
      if (opened) return opened;
      opened = new Promise(function (ok, no) {
        if (!idb) return no(new Error('这个浏览器不能使用 IndexedDB'));
        var r = idb.open(name, 1);
        r.onupgradeneeded = function () { if (!r.result.objectStoreNames.contains('kv')) r.result.createObjectStore('kv'); };
        r.onsuccess = function () { ok(r.result); };
        r.onerror = function () { opened = null; no(r.error || new Error('打不开本机数据库')); };
        r.onblocked = function () { opened = null; no(new Error('本机数据库被另一个页面占用')); };
      });
      return opened;
    }
    function tx(mode, fn) {
      return open().then(function (db) {
        return new Promise(function (ok, no) {
          var t = db.transaction('kv', mode), s = t.objectStore('kv'), out;
          fn(s, function (v) { out = v; });
          t.oncomplete = function () { ok(out); };            // resolved only once the transaction is on disk
          t.onerror = function () { no(t.error || new Error('本机保存失败')); };
          t.onabort = function () { no(t.error || new Error('本机保存被中止')); };
        });
      });
    }
    return {
      get: function (k) { return tx('readonly', function (s, out) { var q = s.get(k); q.onsuccess = function () { out(q.result === undefined ? null : q.result); }; }); },
      set: function (k, v) { return tx('readwrite', function (s) { s.put(M.clone(v), k); }); },
      del: function (k) { return tx('readwrite', function (s) { s.delete(k); }); },
      keys: function (prefix) {
        return tx('readonly', function (s, out) {
          var q = s.getAllKeys(IDBKeyRange.bound(prefix, prefix + '￿'));
          q.onsuccess = function () { out((q.result || []).map(String).sort()); };
        });
      }
    };
  }

  // ================================================================== cloud adapters
  function firestoreCloud(db, uid) {
    var col = function (kind) { return db.collection('users').doc(uid).collection(M.KINDS[kind].coll); };
    var clean = function (v) { return JSON.parse(JSON.stringify(v)); };   // Firestore refuses undefined
    return {
      uid: uid,
      commit: function (op) {
        var ref = col(op.kind).doc(op.id), vref = ref.collection('versions').doc(pad(op.version.rev, 8));
        return db.runTransaction(function (t) {
          return t.get(ref).then(function (snap) {
            var remote = snap.exists ? snap.data() : null, rr = remote ? (remote.rev || 0) : 0;
            if (rr !== op.baseRev) {
              if (remote && remote.rev === op.doc.rev && M.sameContent(remote, op.doc)) return { ok: true, already: true };
              return { conflict: true, remote: remote };
            }
            t.set(ref, clean(op.doc)); t.set(vref, clean(op.version));
            return { ok: true };
          });
        });
      },
      pull: function (kind) { return col(kind).get().then(function (q) { var out = []; q.forEach(function (d) { out.push(d.data()); }); return out; }); },
      versions: function (kind, id) {
        return col(kind).doc(id).collection('versions').get().then(function (q) { var out = []; q.forEach(function (d) { out.push(d.data()); }); return out; });
      }
    };
  }
  // the same behaviour in memory: for the tests, and to act as "another device" there
  function memoryCloud() {
    var docs = new Map(), vers = new Map(), self;
    var key = function (kind, id) { return kind + '|' + id; };
    self = {
      offline: false, commits: 0,
      commit: function (op) {
        if (self.offline) return Promise.reject(Object.assign(new Error('offline'), { code: 'unavailable' }));
        self.commits++;
        var k = key(op.kind, op.id), remote = docs.has(k) ? M.clone(docs.get(k)) : null, rr = remote ? remote.rev : 0;
        if (rr !== op.baseRev) {
          if (remote && remote.rev === op.doc.rev && M.sameContent(remote, op.doc)) return Promise.resolve({ ok: true, already: true });
          return Promise.resolve({ conflict: true, remote: remote });
        }
        docs.set(k, M.clone(op.doc)); vers.set(k + '|' + pad(op.version.rev, 8), M.clone(op.version));
        return Promise.resolve({ ok: true });
      },
      pull: function (kind) {
        if (self.offline) return Promise.reject(new Error('offline'));
        return Promise.resolve(Array.from(docs.entries()).filter(function (e) { return e[0].indexOf(kind + '|') === 0; }).map(function (e) { return M.clone(e[1]); }));
      },
      versions: function (kind, id) {
        if (self.offline) return Promise.reject(new Error('offline'));
        var p = key(kind, id) + '|';
        return Promise.resolve(Array.from(vers.entries()).filter(function (e) { return e[0].indexOf(p) === 0; }).map(function (e) { return M.clone(e[1]); }));
      },
      _docs: docs
    };
    return self;
  }

  // ================================================================== the store
  function createStore(o) {
    o = o || {};
    var local = o.local || memoryLocal();
    var cloud = o.cloud || null;
    var now = o.now || function () { return Date.now(); };
    var user = { type: 'user', id: o.userId || 'me' };
    var listeners = [];
    var st = { pending: 0, conflicts: 0, syncing: false, lastSync: 0, error: '', cloud: !!cloud };
    var chain = Promise.resolve(), seq = 0, flushing = null, retry = null;

    function emit(what) { listeners.forEach(function (f) { try { f(what || null, status()); } catch (e) {} }); }
    function status() { return Object.assign({}, st); }
    // one write at a time, in the order they were asked for
    function lock(fn) { var p = chain.then(fn, fn); chain = p.then(function () {}, function () {}); return p; }
    function counts() {
      return Promise.all([local.keys('o|'), local.keys('c|')]).then(function (r) { st.pending = r[0].length; st.conflicts = r[1].length; });
    }
    function nextSeq() {
      return local.keys('o|').then(function (ks) {
        var last = ks.length ? +ks[ks.length - 1].slice(2) : 0;
        seq = Math.max(seq, last, now()) + 1;
        return 'o|' + pad(seq, 15);
      });
    }

    function get(kind, id) { return local.get(dkey(kind, id)); }
    function list(kind) {
      return local.keys('d|' + kind + '|').then(function (ks) { return Promise.all(ks.map(function (k) { return local.get(k); })); })
        .then(function (a) { return a.filter(Boolean); });
    }
    function commitPlan(kind, current, plan) {
      var op = { kind: kind, id: plan.doc.id, baseRev: current ? current.rev : 0, doc: plan.doc, version: plan.version };
      return local.set(dkey(kind, plan.doc.id), plan.doc)
        .then(function () { return local.set(vkey(kind, plan.doc.id, plan.version.rev), plan.version); })
        .then(nextSeq).then(function (k) { return local.set(k, op); })
        .then(counts).then(function () { emit({ kind: kind, id: plan.doc.id }); schedule(0); return plan; });
    }
    /* opts: { actor, baseRev, reason } — baseRev: the revision the edit started from (an editor passes it, so an edit
       made while another device changed the same thing becomes a conflict instead of overwriting it) */
    function put(kind, next, opts) {
      opts = opts || {};
      return lock(function () {
        var id = next && next.id;
        if (!id) return { ok: false, code: 'invalid', error: '缺少 id' };
        return Promise.all([get(kind, id), local.get(ckey(kind, id))]).then(function (r) {
          var current = r[0];
          if (r[1] && !opts.resolving) return { ok: false, code: 'conflict', error: '这份内容有未解决的冲突，请先在“冲突”里处理', current: current };
          var plan = M.planWrite(kind, current, next, opts.actor || user, { baseRev: opts.baseRev, reason: opts.reason, now: now() });
          if (!plan.ok || plan.noop) return plan;
          return commitPlan(kind, current, plan);
        });
      });
    }
    function versions(kind, id) {
      return local.keys('v|' + kind + '|' + id + '|').then(function (ks) { return Promise.all(ks.map(function (k) { return local.get(k); })); }).then(function (mine) {
        var by = {}; mine.filter(Boolean).forEach(function (v) { by[v.rev] = v; });
        if (!cloud) return by;
        return cloud.versions(kind, id).then(function (theirs) {
          (theirs || []).forEach(function (v) { by[v.rev] = v; });      // the cloud is the record for the revisions it has
          // keep them here too, so the history is there offline
          return Promise.all((theirs || []).map(function (v) { return local.set(vkey(kind, id, v.rev), v); })).then(function () { return by; });
        }, function () { return by; });
      }).then(function (by) { return Object.keys(by).map(function (k) { return by[k]; }).sort(function (a, b) { return b.rev - a.rev; }); });
    }
    function restore(kind, id, rev, opts) {
      opts = opts || {};
      return versions(kind, id).then(function (vs) {
        var v = vs.filter(function (x) { return x.rev === rev; })[0];
        return lock(function () {
          return Promise.all([get(kind, id), local.get(ckey(kind, id))]).then(function (r) {
            if (r[1]) return { ok: false, code: 'conflict', error: '这份内容有未解决的冲突，请先处理' };
            var plan = M.planRestore(kind, r[0], v, opts.actor || user, { now: now() });
            if (!plan.ok || plan.noop) return plan;
            return commitPlan(kind, r[0], plan);
          });
        });
      });
    }

    // ---------------------------------------------------------------- to the cloud
    function schedule(ms) {
      if (!cloud) return;
      if (retry) clearTimeout(retry);
      if (o.autoFlush === false) return;
      retry = setTimeout(function () { retry = null; flush(); }, ms);
      if (retry && retry.unref) retry.unref();
    }
    function parkConflict(op, remote) {
      // the cloud's copy becomes the current one here; yours waits beside it; your versions after the shared one go with it
      var k = ckey(op.kind, op.id);
      return local.get(k).then(function (c) {
        c = c || { kind: op.kind, id: op.id, baseRev: op.baseRev, at: now() };
        c.mine = op.doc; c.theirs = remote || null; c.at = now();
        return local.set(k, c);
      }).then(function () { return local.keys('v|' + op.kind + '|' + op.id + '|'); }).then(function (ks) {
        return Promise.all(ks.filter(function (key) { return +key.slice(key.lastIndexOf('|') + 1) > op.baseRev; }).map(function (key) { return local.del(key); }));
      }).then(function () { return remote ? local.set(dkey(op.kind, op.id), remote) : null; });
    }
    function flush() {
      if (!cloud) return Promise.resolve(status());
      if (flushing) return flushing;
      st.syncing = true; emit();
      flushing = lock(function () {
        return local.keys('o|').then(function (ks) {
          var i = 0;
          function step() {
            if (i >= ks.length) return true;
            var k = ks[i++];
            return local.get(k).then(function (op) {
              if (!op) return step();
              return local.get(ckey(op.kind, op.id)).then(function (c) {
                if (c) return parkConflict(op, c.theirs).then(function () { return local.del(k); }).then(step);   // later edits join the conflict
                return cloud.commit(op).then(function (r) {
                  if (r && r.ok) return local.del(k).then(step);
                  return parkConflict(op, r && r.remote).then(function () { return local.del(k); }).then(function () { emit({ kind: op.kind, id: op.id, conflict: true }); return step(); });
                });
              });
            });
          }
          return step();
        }).then(function () { st.error = ''; st.lastSync = now(); }, function (e) { st.error = '暂时连不上云端（' + errText(e) + '）· 改动已存在本机，会自动再试'; schedule(30000); });
      }).then(counts).then(function () { st.syncing = false; flushing = null; emit(); return status(); });
      return flushing;
    }
    // what changed on other devices: taken when it is newer and nothing of ours is waiting for the same thing
    function pull() {
      if (!cloud) return Promise.resolve(status());
      return flush().then(function () {
        return lock(function () {
          return Promise.all([local.keys('o|'), local.keys('c|')]).then(function (r) {
            return Promise.all(r[0].map(function (k) { return local.get(k); })).then(function (ops) {
              var busy = {}; ops.filter(Boolean).forEach(function (op) { busy[op.kind + '|' + op.id] = 1; });
              r[1].forEach(function (k) { busy[k.slice(2)] = 1; });
              var changed = 0;
              return Promise.all(['page', 'decision', 'source', 'relation', 'meta'].map(function (kind) {
                return cloud.pull(kind).then(function (docs) {
                  return Promise.all(docs.map(function (d) {
                    if (!d || !d.id || busy[kind + '|' + d.id]) return null;
                    return get(kind, d.id).then(function (mine) { if (!mine || (d.rev || 0) > (mine.rev || 0)) { changed++; return local.set(dkey(kind, d.id), d); } });
                  }));
                });
              })).then(function () { st.error = ''; st.lastSync = now(); if (changed) emit({ pulled: changed }); return changed; });
            });
          });
        }).catch(function (e) { st.error = '暂时连不上云端（' + errText(e) + '）'; emit(); return 0; });
      });
    }

    // ---------------------------------------------------------------- conflicts
    function conflicts() { return local.keys('c|').then(function (ks) { return Promise.all(ks.map(function (k) { return local.get(k); })); }).then(function (a) { return a.filter(Boolean); }); }
    // keep: 'theirs' (the cloud's copy stays) or 'mine' (yours is written on top of it as a new revision)
    function resolve(kind, id, keep) {
      return local.get(ckey(kind, id)).then(function (c) {
        if (!c) return { ok: false, code: 'invalid', error: '没有这个冲突' };
        if (keep === 'theirs') return local.del(ckey(kind, id)).then(counts).then(function () { emit({ kind: kind, id: id }); return { ok: true }; });
        return get(kind, id).then(function (cur) {
          return put(kind, c.mine, { baseRev: cur ? cur.rev : 0, reason: '冲突：保留本机版本', resolving: true });
        }).then(function (r) {
          if (!r.ok) return r;
          return local.del(ckey(kind, id)).then(counts).then(function () { emit({ kind: kind, id: id }); return r; });
        });
      });
    }

    // ---------------------------------------------------------------- permissions: what another part of Minest may do here
    function permissions() { return get('meta', 'permissions').then(function (p) { return p || M.defaultPermissions(); }); }
    function savePermissions(p) {
      return get('meta', 'permissions').then(function (cur) { return put('meta', Object.assign(M.defaultPermissions(), p, { id: 'permissions', kind: 'meta' }), { baseRev: cur ? cur.rev : 0, reason: '修改权限' }); });
    }
    /* access('study') → { get, list, put } that check the permissions first; a module other than Living Knowledge itself
       writes as an agent, so the guards for agents apply (no Confirmed decision, no locked page, sources never change) */
    function access(module) {
      var actor = module === 'living-knowledge' ? user : { type: 'agent', id: module };
      var check = function (action) { return permissions().then(function (p) { if (!M.can(p, module, action)) throw Object.assign(new Error('“' + module + '”没有' + (action === 'write' ? '写入' : '读取') + ' Living Knowledge 的权限'), { code: 'permission-denied' }); }); };
      return {
        module: module,
        get: function (kind, id) { return check('read').then(function () { return get(kind, id); }); },
        list: function (kind) { return check('read').then(function () { return list(kind); }); },
        put: function (kind, doc, opts) { return check('write').then(function () { return put(kind, doc, Object.assign({}, opts, { actor: actor })); }); }
      };
    }

    // ---------------------------------------------------------------- Markdown export
    function exportData() {
      return Promise.all([list('page'), list('decision'), list('source'), list('relation'), local.keys('v|')]).then(function (r) {
        return Promise.all(r[4].map(function (k) { return local.get(k); })).then(function (vs) {
          var log = vs.filter(Boolean).map(function (v) { var s = v.snapshot || {}; return { at: v.at, kind: s.kind, id: s.id, title: s.title, rev: v.rev, by: v.by, reason: v.reason }; });
          return { pages: r[0], decisions: r[1], sources: r[2], relations: r[3], log: log };
        });
      });
    }
    function exportZip() { return exportData().then(function (d) { var t = now(); return M.zip(M.exportFiles(d, t), t); }); }

    var api = {
      get: get, list: list, put: put, versions: versions, restore: restore,
      flush: flush, pull: pull, conflicts: conflicts, resolve: resolve,
      permissions: permissions, savePermissions: savePermissions, access: access,
      exportData: exportData, exportZip: exportZip,
      status: status, ready: function () { return counts().then(status); },
      onChange: function (f) { listeners.push(f); return function () { listeners = listeners.filter(function (x) { return x !== f; }); }; }
    };
    return api;
  }

  return { createStore: createStore, memoryLocal: memoryLocal, idbLocal: idbLocal, firestoreCloud: firestoreCloud, memoryCloud: memoryCloud, KIND_LIST: KIND_LIST };
});

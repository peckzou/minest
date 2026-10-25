"""53.84 · Cloud sync that never loses an edit made on this device (applied in place to iPhone53.8241.html + copies).

Before: on every open the cloud copy simply replaced this device's boards. A list or card added just before the app went to
the background (the save waits 0.5 s, then gzips and uploads; iOS suspends the page first), added offline, or whose save
was rejected, was therefore wiped on the next open — and a rejected save said nothing (only "too large" had a toast).
Firestore's 1 MB cap was checked for the boards only, while Knowledge (My World islands, wiki …) rode along uncompressed.

Now:
- every local change of the boards marks dirtyAt; a save the cloud took marks ackAt (its clientUpdatedAt).
  dirtyAt > ackAt = edits the cloud has not got. Then the cloud copy is merged, never swapped in: the newer side wins
  where both have a board / list / card, and whatever only one side has is kept (minestMergeBoards); the result is saved.
- the echo of our own pending write is ignored; nothing is pushed before the first cloud copy was looked at, and only
  when there is something unsynced (signing in no longer pushes a stale device over newer cloud data).
- going to the background sends the waiting save at once; a failed save is said once and retried (30 s, and when online).
- the boards as the cloud last had them are kept (IndexedDB 'cloudBase'), so the merge is three-way per board / list /
  card: only-one-side changes win, both-sides changes take the newer side, adds stay, deletes stay deleted.
- Knowledge and the CarPlay study record (MinestGPTStudy) are gzipped next to the boards (knowledgeGz, gptstudyGz) and the
  size check covers the whole document. Older plain `knowledge` is still read.
"""
from pathlib import Path
import shutil

ROOT = Path('/Users/cece/Documents/minest')
SRC = ROOT / 'iPhone53.8241.html'
COPIES = ['iphone.html', 'index.html', 'ios/Minest/Minest/iphone.html', 'ios/MinestProject/MyApp/iphone.html', 'ios/Minest/Minest/iphone18.0.html']
s = SRC.read_text(encoding='utf-8')

def rep(a, b, n=1):
    global s
    if b in s: return
    assert s.count(a) == n, (a[:90], s.count(a)); s = s.replace(a, b)

# ---- payload: boards + knowledge + CarPlay record, all gzipped, one size check for the document
rep("""  try { if (window.MinestKnowledge && window.MinestKnowledge._cloud) base.knowledge = JSON.parse(JSON.stringify(window.MinestKnowledge._cloud())); } catch (e) {}   // Minest Knowledge
  if (!minestCanGzip()) return Promise.resolve(Object.assign(base, { boards: boards }));
  return minestGzipText(JSON.stringify(boards)).then(function(gz) {
    if (gz.length > MINEST_CLOUD_GZ_LIMIT) {
      var err = new Error('Boards are too large for cloud sync even when compressed (' + Math.round(gz.length / 1024) + ' KB).');
      err.tooLarge = true;
      throw err;
    }
    return Object.assign(base, { boardsGz: gz, gzUpdatedAt: now, boardsSchema: 2, boards: firebase.firestore.FieldValue.delete() });
  });
}""", """  var know = null, gpt = null;
  try { if (window.MinestKnowledge && window.MinestKnowledge._cloud) know = JSON.stringify(window.MinestKnowledge._cloud()); } catch (e) {}   // Minest Knowledge
  try { if (window.MinestGPTStudy && window.MinestGPTStudy._cloud) gpt = JSON.stringify(window.MinestGPTStudy._cloud()); } catch (e) {}   // 53.84: CarPlay study record
  if (!minestCanGzip()) { if (know) base.knowledge = JSON.parse(know); return Promise.resolve(Object.assign(base, { boards: boards })); }
  return Promise.all([minestGzipText(JSON.stringify(boards)), know ? minestGzipText(know) : null, gpt ? minestGzipText(gpt) : null]).then(function(g) {
    // 53.84: the whole document counts against Firestore's 1 MB, not just the boards
    var total = g[0].length + (g[1] || '').length + (g[2] || '').length + JSON.stringify(base.learning || null).length;
    if (total > MINEST_CLOUD_GZ_LIMIT) {
      var err = new Error('Boards are too large for cloud sync even when compressed (' + Math.round(total / 1024) + ' KB).');
      err.tooLarge = true;
      throw err;
    }
    if (g[1]) { base.knowledgeGz = g[1]; base.knowledge = firebase.firestore.FieldValue.delete(); }
    if (g[2]) base.gptstudyGz = g[2];
    return Object.assign(base, { boardsGz: g[0], gzUpdatedAt: now, boardsSchema: 2, boards: firebase.firestore.FieldValue.delete() });
  });
}
/* 53.84 · what else the cloud doc carries: Knowledge (compressed now, plain from older clients) and the CarPlay record */
function minestCloudExtras(data) {
  if (!data) return;
  try { if (data.knowledge && window.MinestKnowledge) window.MinestKnowledge._mergeCloud(data.knowledge); } catch (e) {}
  if (!minestCanGzip()) return;
  if (data.knowledgeGz && window.MinestKnowledge) minestGunzipText(data.knowledgeGz).then(function(t) { window.MinestKnowledge._mergeCloud(JSON.parse(t)); }).catch(function() {});
  if (data.gptstudyGz && window.MinestGPTStudy && window.MinestGPTStudy._mergeCloud) minestGunzipText(data.gptstudyGz).then(function(t) { window.MinestGPTStudy._mergeCloud(JSON.parse(t)); }).catch(function() {});
}
/* 53.84 · edits the cloud has not got yet. dirtyAt = the boards last changed here; ackAt = clientUpdatedAt of the last
   save the cloud took (or of the cloud copy taken in). dirtyAt > ackAt: the cloud copy must be merged, not swapped in. */
var MINEST_CLOUD_DIRTY = 'minest.cloud.dirtyAt', MINEST_CLOUD_ACK = 'minest.cloud.ackAt';
function minestCloudMark(k, v) { try { localStorage.setItem(k, String(v)); } catch (e) {} }
function minestCloudNum(k) { try { return Number(localStorage.getItem(k)) || 0; } catch (e) { return 0; } }
function minestCloudUnsynced() { return minestCloudNum(MINEST_CLOUD_DIRTY) > minestCloudNum(MINEST_CLOUD_ACK); }
/* primary's boards, lists and cards stay as they are; what only `extra` has is added in its place (a card already
   somewhere else on the board — moved — is not added again) */
function minestMergeBoards(primary, extra) {
  var out = JSON.parse(JSON.stringify(primary || [])), byId = {};
  out.forEach(function(b) { if (b && b.id) byId[b.id] = b; });
  (extra || []).forEach(function(eb) {
    if (!eb || !eb.id) return;
    var b = byId[eb.id];
    if (!b) { out.push(JSON.parse(JSON.stringify(eb))); return; }
    b.columns = b.columns || [];
    var cols = {}, cards = {};
    b.columns.forEach(function(c) { cols[c.id] = c; (c.cards || []).forEach(function(k) { if (k) cards[k.id] = 1; }); });
    (eb.columns || []).forEach(function(ec, ci) {
      if (!ec) return;
      var c = cols[ec.id];
      if (!c) { b.columns.splice(Math.min(ci, b.columns.length), 0, JSON.parse(JSON.stringify(ec))); (ec.cards || []).forEach(function(k) { if (k) cards[k.id] = 1; }); return; }
      c.cards = c.cards || [];
      (ec.cards || []).forEach(function(k, ki) { if (k && !cards[k.id]) { c.cards.splice(Math.min(ki, c.cards.length), 0, JSON.parse(JSON.stringify(k))); cards[k.id] = 1; } });
    });
  });
  return out;
}
/* 53.84 · the boards as the cloud last had them (IndexedDB 'cloudBase'): with it a merge can tell who changed what */
function minestCloudBaseSet(boards) {
  return openBoardsIdb().then(function(db) { return new Promise(function(res) {
    try { var tx = db.transaction(IDB_STORE_NAME, 'readwrite'); tx.objectStore(IDB_STORE_NAME).put(JSON.stringify(boards || []), 'cloudBase'); tx.oncomplete = res; tx.onerror = res; } catch (e) { res(); }
  }); }).catch(function() {});
}
function minestCloudBaseGet() {
  return openBoardsIdb().then(function(db) { return new Promise(function(res) {
    try { var q = db.transaction(IDB_STORE_NAME, 'readonly').objectStore(IDB_STORE_NAME).get('cloudBase'); q.onsuccess = function() { try { res(q.result ? JSON.parse(q.result) : null); } catch (e) { res(null); } }; q.onerror = function() { res(null); }; } catch (e) { res(null); }
  }); }).catch(function() { return null; });
}
function minestSame(a, b) { return JSON.stringify(a) === JSON.stringify(b); }
/* three-way merge of boards → lists → cards against `base`: a thing only one side changed takes that side; a thing both
   changed takes the newer side (mineNewer); added on either side is kept, deleted on one side is dropped only if the
   other side left it untouched; a card moved to another list follows the move */
function minestMerge3(base, local, remote, mineNewer) {
  var LEVELS = ['columns', 'cards'];
  function idx(a) { var m = {}; (a || []).forEach(function(x) { if (x && x.id != null) m[x.id] = x; }); return m; }
  function strip(x, key) { if (!key || !x) return x; var o = {}; Object.keys(x).forEach(function(k) { if (k !== key) o[k] = x[k]; }); return o; }
  function one(b, l, r, depth) {
    if (!l && !r) return null;
    if (!l) return b && minestSame(b, r) ? null : r;
    if (!r) return b && minestSame(b, l) ? null : l;
    if (minestSame(l, r)) return l;
    var key = LEVELS[depth];
    var lc = !b || !minestSame(strip(b, key), strip(l, key)), rc = !b || !minestSame(strip(b, key), strip(r, key));
    var own = (lc && !rc) ? l : (rc && !lc) ? r : (mineNewer ? l : r);
    if (!key) return own;
    var o = strip(own, key); o[key] = list(b && b[key], l[key], r[key], depth + 1); return o;
  }
  function list(bA, lA, rA, depth) {
    var B = idx(bA), L = idx(lA), out = [], have = {};
    (rA || []).forEach(function(r) { if (!r || r.id == null || have[r.id]) return; have[r.id] = 1; var v = one(B[r.id], L[r.id], r, depth); if (v) out.push(v); });
    (lA || []).forEach(function(l, i) {
      if (!l || l.id == null || have[l.id]) return; have[l.id] = 1;
      var v = one(B[l.id], l, null, depth); if (!v) return;
      var prev = i > 0 && lA[i - 1] ? lA[i - 1].id : null, at = prev == null ? 0 : out.length;
      for (var j = 0; prev != null && j < out.length; j++) if (out[j].id === prev) { at = j + 1; break; }
      out.splice(at, 0, v);
    });
    return out;
  }
  var res = list(base, local, remote, 0);
  res.forEach(function(bd) { var seen = {}; (bd.columns || []).forEach(function(c) { if (c && c.cards) c.cards = c.cards.filter(function(k) { if (!k || seen[k.id]) return false; seen[k.id] = 1; return true; }); }); });
  return res;
}""")
rep("""try { if (data && data.knowledge && window.MinestKnowledge) window.MinestKnowledge._mergeCloud(data.knowledge); } catch (e) {}""",
    """minestCloudExtras(data);""", n=2)

# ---- refs
rep("""  var saveDebounceRef = (0, _.useRef)(null);
""", """  var saveDebounceRef = (0, _.useRef)(null);
  var cloudFlushRef = (0, _.useRef)(null), cloudSeenRef = (0, _.useRef)(null), cloudLatestRef = (0, _.useRef)(null), cloudReadyRef = (0, _.useRef)(false);
  var cloudKickState = (0, _.useState)(0), cloudKick = cloudKickState[0], setCloudKick = cloudKickState[1];
""")

# ---- the listener: ignore our own echo; merge when this device has unsynced edits
rep("""        var unsubDoc = docRef.onSnapshot(function(doc) {
          if (doc.exists) {""", """        cloudReadyRef.current = false;
        var unsubDoc = docRef.onSnapshot(function(doc) {
          if (doc.metadata && doc.metadata.hasPendingWrites) return;   // 53.84: our own save on its way up
          if (doc.exists) {""")
rep("""            minestCloudBoards(data).then(function(remoteBoards) {
              if (remoteBoards && remoteBoards.length > 0) {
                isRemoteUpdateRef.current = true;""", """            minestCloudBoards(data).then(function(remoteBoards) {
              var rAt = Math.max(Number(data.clientUpdatedAt) || 0, Number(data.gzUpdatedAt) || 0);
              if (remoteBoards && remoteBoards.length > 0 && minestCloudUnsynced()) {
                // 53.84: this device has edits the cloud has not got — merge (the newer side wins where both have a thing,
                // nothing only one side has is dropped); the merged boards are a local change, so they are saved up
                var remote = sanitizeLoadedBoards(remoteBoards), mineNewer = minestCloudNum(MINEST_CLOUD_DIRTY) >= rAt;
                setSyncStatus("saving");
                minestCloudBaseGet().then(function(base) {
                  setBoards(function(local) { return base ? minestMerge3(base, local, remote, mineNewer) : mineNewer ? minestMergeBoards(local, remote) : minestMergeBoards(remote, local); });
                  cloudReadyRef.current = true;
                  setCloudKick(function(k) { return k + 1; });
                });
                return;
              }
              if (remoteBoards && remoteBoards.length > 0) {
                if (rAt > minestCloudNum(MINEST_CLOUD_ACK)) minestCloudMark(MINEST_CLOUD_ACK, rAt);
                minestCloudBaseSet(sanitizeLoadedBoards(remoteBoards));
                isRemoteUpdateRef.current = true;""")
rep("""                setTimeout(function() { isRemoteUpdateRef.current = false; }, 300);
              }
              setLastSyncTime(new Date());
              setSyncStatus("synced");
            });
          } else {
            setSyncStatus("saving");
            minestCloudPayload(boards, {""", """                setTimeout(function() { isRemoteUpdateRef.current = false; }, 300);
              }
              cloudReadyRef.current = true;
              setLastSyncTime(new Date());
              setSyncStatus("synced");
            });
          } else {
            cloudReadyRef.current = true;
            setSyncStatus("saving");
            minestCloudPayload((cloudLatestRef.current && cloudLatestRef.current.boards) || boards, {""")

# ---- the save: marks, waits for the first cloud copy, flushes on hide, retries, says a failure once
OLD_SAVE = """  // Firestore Debounced Save
  (0, _.useEffect)(function() {
    if (!isRemoteUpdateRef.current && firebaseUser && typeof firebase !== 'undefined' && firebase.apps && firebase.apps.length) {
      setSyncStatus("saving");
      if (saveDebounceRef.current) clearTimeout(saveDebounceRef.current);
      saveDebounceRef.current = setTimeout(function() {
        try {
          var db = firebase.firestore();
          minestCloudPayload(boards, {
            activeBoardId: activeBoardId,
            viewMode: viewMode,
            themeMode: themeMode,
            userEmail: firebaseUser.email
          }).then(function(payload) {
            return db.collection("users").doc(firebaseUser.uid).collection("focusboard").doc("data").set(payload, { merge: true });
          }).then(function() {
            setSyncStatus("synced");
            setLastSyncTime(new Date());
          }).catch(function(err) {
            setSyncStatus("error");
            if (err && err.tooLarge && !window.__minestCloudTooLargeWarned) {
              window.__minestCloudTooLargeWarned = true;
              GlassUI.toast("⚠️ " + err.message + " Changes are kept on this device.");
            }
          });
        } catch (e) {
          setSyncStatus("error");
        }
      }, 500);
    }
  }, [boards, activeBoardId, viewMode, themeMode, firebaseUser]);
"""
NEW_SAVE = """  // Firestore Debounced Save. 53.84: a local change of the boards is marked (dirtyAt) until the cloud has it (ackAt);
  // nothing goes up before the first cloud copy was looked at, or when there is nothing unsynced; going to the background
  // sends the waiting save at once; a failed save is said once and tried again.
  (0, _.useEffect)(function() {
    cloudLatestRef.current = { boards: boards, activeBoardId: activeBoardId, viewMode: viewMode, themeMode: themeMode };
    var edited = cloudSeenRef.current !== null && cloudSeenRef.current !== boards && !isRemoteUpdateRef.current;
    cloudSeenRef.current = boards;
    if (edited) minestCloudMark(MINEST_CLOUD_DIRTY, Date.now());
    if (isRemoteUpdateRef.current || !firebaseUser || typeof firebase === 'undefined' || !firebase.apps || !firebase.apps.length) return;
    if (!cloudReadyRef.current || !minestCloudUnsynced()) return;
    setSyncStatus("saving");
    if (saveDebounceRef.current) clearTimeout(saveDebounceRef.current);
    var user = firebaseUser;
    var fail = function(err) {
      setSyncStatus("error");
      if (err && err.tooLarge) {
        if (!window.__minestCloudTooLargeWarned) { window.__minestCloudTooLargeWarned = true; GlassUI.toast("⚠️ " + err.message + " Changes are kept on this device."); }
        return;
      }
      if (!window.__minestCloudFailWarned) { window.__minestCloudFailWarned = true; GlassUI.toast("☁️ Cloud sync did not go through (" + ((err && (err.code || err.message)) || 'offline') + "). Your changes are kept on this device and will be sent again."); }
      setTimeout(function() { setCloudKick(function(k) { return k + 1; }); }, 30000);
    };
    var run = function() {
      if (saveDebounceRef.current) clearTimeout(saveDebounceRef.current);
      saveDebounceRef.current = null; cloudFlushRef.current = null;
      var L = cloudLatestRef.current, sentAt = 0;
      try {
        var db = firebase.firestore();
        minestCloudPayload(L.boards, {
          activeBoardId: L.activeBoardId,
          viewMode: L.viewMode,
          themeMode: L.themeMode,
          userEmail: user.email
        }).then(function(payload) {
          sentAt = payload.clientUpdatedAt;
          return db.collection("users").doc(user.uid).collection("focusboard").doc("data").set(payload, { merge: true });
        }).then(function() {
          if (sentAt > minestCloudNum(MINEST_CLOUD_ACK)) minestCloudMark(MINEST_CLOUD_ACK, sentAt);
          minestCloudBaseSet(L.boards);
          window.__minestCloudFailWarned = false;
          setLastSyncTime(new Date());
          if (minestCloudUnsynced()) setCloudKick(function(k) { return k + 1; }); else setSyncStatus("synced");
        }).catch(fail);
      } catch (e) { fail(e); }
    };
    cloudFlushRef.current = run;
    saveDebounceRef.current = setTimeout(run, 500);
  }, [boards, activeBoardId, viewMode, themeMode, firebaseUser, cloudKick]);
  // 53.84: the app going to the background sends a waiting save now; back online tries again; the CarPlay study record
  // (MinestGPTStudy) changing asks for a save too, at most every 20 s
  (0, _.useEffect)(function() {
    var gptT = null;
    var kick = function() { setCloudKick(function(k) { return k + 1; }); };
    var gptNow = function() { if (!gptT) return; clearTimeout(gptT); gptT = null; minestCloudMark(MINEST_CLOUD_DIRTY, Date.now()); kick(); };
    var hide = function() { gptNow(); if (cloudFlushRef.current) cloudFlushRef.current(); };
    var vis = function() { if (document.visibilityState === 'hidden') hide(); };
    var gpt = function() { if (!gptT) gptT = setTimeout(gptNow, 20000); };
    document.addEventListener('visibilitychange', vis);
    window.addEventListener('pagehide', hide);
    window.addEventListener('online', kick);
    window.addEventListener('minest:cloud-dirty', gpt);
    return function() {
      document.removeEventListener('visibilitychange', vis); window.removeEventListener('pagehide', hide);
      window.removeEventListener('online', kick); window.removeEventListener('minest:cloud-dirty', gpt); if (gptT) clearTimeout(gptT);
    };
  }, []);
"""
rep(OLD_SAVE, NEW_SAVE)

# ---- ⬆ Force push counts as the cloud having it
rep("""      await db.collection("users").doc(firebaseUser.uid).collection("focusboard").doc("data").set(pushPayload, { merge: true });
      setSyncStatus("synced");""", """      await db.collection("users").doc(firebaseUser.uid).collection("focusboard").doc("data").set(pushPayload, { merge: true });
      minestCloudMark(MINEST_CLOUD_ACK, pushPayload.clientUpdatedAt); minestCloudBaseSet(boards);
      setSyncStatus("synced");""")
# ⬇ Force pull: what was pulled is what the cloud has
rep("""        var pulledBoards = await minestCloudBoards(data);
        if (pulledBoards && pulledBoards.length > 0) {
          isRemoteUpdateRef.current = true;""", """        var pulledBoards = await minestCloudBoards(data);
        if (pulledBoards && pulledBoards.length > 0) {
          minestCloudMark(MINEST_CLOUD_ACK, Math.max(Date.now(), minestCloudNum(MINEST_CLOUD_DIRTY))); minestCloudBaseSet(sanitizeLoadedBoards(pulledBoards));
          isRemoteUpdateRef.current = true;""")

SRC.write_text(s, encoding='utf-8')
for c in COPIES: shutil.copyfile(SRC, ROOT / c)
print('patched cloud sync')

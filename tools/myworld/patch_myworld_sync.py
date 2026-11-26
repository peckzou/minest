#!/usr/bin/env python3
"""My World sync repair (2026-11-26) — reproducible, idempotent patch of the live pages.

    python3 tools/myworld/patch_myworld_sync.py iPhoneDuo.html [more pages …]
    python3 tools/myworld/patch_myworld_sync.py --check iPhoneDuo.html

My World's own data (section headings, hidden boards, outline parents, map positions, timeline dates and every view
setting: window.MinestKnowledge, `minest.knowledge.v1`) used to be written straight to the cloud doc as a plain
`knowledge` field, outside the sync transport:
  - on the iPhone / iPad (WebKit) that SDK write often never arrived, and nothing marked the change as unsynced;
  - the next board save sent its compressed copy (knowledgeGz) and deleted the plain field, and the pre-commit merge
    read only the compressed copy, so a key only the plain field had was dropped from the cloud;
  - it lived in localStorage only, which iOS can clear.
Now a change marks the cloud copy unsynced and goes up with the next save (merged per key by reconcile.js), both cloud
copies count when merging, and the map is also kept in the durable (IndexedDB-backed) store.
"""
import sys
from pathlib import Path

ROOT = Path(__file__).resolve().parents[2]
RECONCILE = (ROOT / 'tools/cloud-transport/reconcile.js').read_text(encoding='utf8').rstrip('\n')
MARK = 'My World sync repair (tools/myworld/patch_myworld_sync.py)'

R = [
    ('''  function knSave() { try { localStorage.setItem(KN_KEY, JSON.stringify(K)); } catch (e) {} }
  function knPush() {
    // straight to the cloud doc (merge), so a heading reaches the other devices without waiting for a board edit
    try {
      var fb = window.firebase, u = fb && fb.auth && fb.auth().currentUser;
      if (!u || !fb.firestore) return;
      fb.firestore().collection('users').doc(u.uid).collection('focusboard').doc('data').set({ knowledge: JSON.parse(JSON.stringify(K)) }, { merge: true }).catch(function () {});
    } catch (e) {}
  }''',
     '''  /* 2026-11-26 · My World sync repair (tools/myworld/patch_myworld_sync.py): kept in the durable store too (localStorage
     alone can be cleared by iOS), and a change goes up with the next cloud save, which merges it per key with what the
     cloud has. Before, it was written straight to the doc outside the sync transport and never marked unsynced. */
  function knSave() { var s = JSON.stringify(K); try { localStorage.setItem(KN_KEY, s); } catch (e) {} try { if (window.MinestDurableStorage) window.MinestDurableStorage.setItem(KN_KEY, s); } catch (e) {} }
  var knTimer = 0;
  function knUp() { knTimer = 0; try { window.dispatchEvent(new CustomEvent('minest:cloud-dirty', { detail: { immediate: true, domain: 'myworld' } })); } catch (e) {} }
  function knPush() { if (knTimer) clearTimeout(knTimer); knTimer = setTimeout(knUp, 1200); }
  document.addEventListener('visibilitychange', function () { if (document.visibilityState === 'hidden' && knTimer) { clearTimeout(knTimer); knUp(); } });'''),
    ('''      if (changed) { knSave(); if (ui.open) render(); listeners.forEach(function (f) { try { f(); } catch (e) {} }); }
    }
  };
''',
     '''      if (changed) { knSave(); if (ui.open) render(); listeners.forEach(function (f) { try { f(); } catch (e) {} }); }
    }
  };
  /* the durable copy may hold keys localStorage lost: take them in, and send them up if the cloud may not have them */
  try {
    var DS = window.MinestDurableStorage;
    if (DS && DS.ready) DS.ready.then(function () {
      var v = null; try { v = JSON.parse(DS.getItem(KN_KEY) || 'null'); } catch (e) {}
      if (!v || typeof v !== 'object') return;
      var before = JSON.stringify(K); window.MinestKnowledge._mergeCloud(v);
      if (JSON.stringify(K) !== before) knPush();
    });
  } catch (e) {}
'''),
]

OLD_RECONCILE_START = '/* Reconcile the current server revision before a conditional commit. No local ACK here. */'
OLD_RECONCILE_END = "w.MinestSyncReconcile={prepare:prepare,merge:reconcile,applyAccepted:"


def patch(text):
    if MARK in text:
        return text, 'already'
    for old, new in R:
        n = text.count(old)
        if n != 1:
            return None, 'anchor found %d times: %r' % (n, old[:80])
        text = text.replace(old, new)
    i = text.find(OLD_RECONCILE_START)
    j = text.find(OLD_RECONCILE_END, i)
    if i < 0 or j < 0 or text.count(OLD_RECONCILE_START) != 1:
        return None, 'no head reconcile block'
    j = text.find('})(window);', j) + len('})(window);')
    text = text[:i] + RECONCILE + text[j:]
    return text, 'patched'


def main(argv):
    check = '--check' in argv
    files = [a for a in argv if a != '--check']
    if not files:
        raise SystemExit(__doc__)
    bad = 0
    for name in files:
        p = ROOT / name
        s = p.read_text(encoding='utf8')
        if check:
            ok = MARK in s and 'function knMerge(a,b)' in s
            print(('ok      ' if ok else 'MISSING ') + name); bad += not ok; continue
        out, why = patch(s)
        if out is None:
            print('skipped %s: %s' % (name, why)); bad += 1; continue
        if out != s:
            p.write_text(out, encoding='utf8')
        print(why, name)
    sys.exit(1 if bad and check else 0)


if __name__ == '__main__':
    main(sys.argv[1:])

#!/usr/bin/env python3
"""Sync repair for the other records in the cloud doc (2026-11-26) — reproducible, idempotent.

    python3 tools/cloud-transport/patch_other_sync.py iPhoneDuo.html [more pages …]
    python3 tools/cloud-transport/patch_other_sync.py --check iPhoneDuo.html

  · reconcile.js (the head copy is replaced with this folder's file): the study log (`learning`) and the CarPlay study
    record (`gptstudy`) are merged with the server's before a commit, by the rules their pages use when they take a
    cloud copy in; before, a device that had not seen another device's study yet overwrote it in the cloud.
  · the Learning Path's study log asks for a cloud save when it records something (it rode along with board saves
    only, so a study session reached the other devices only after the next board edit); taking a cloud copy in does not.
  · the Cognitive Toolkit's own doc (focusboard/toolkit) is read, watched and written through the sync transport, like
    the main doc; with the Firestore SDK directly, its reads and writes often never completed on the iPhone and the iPad.
"""
import sys
from pathlib import Path

ROOT = Path(__file__).resolve().parents[2]
RECONCILE = (Path(__file__).resolve().parent / 'reconcile.js').read_text(encoding='utf8').rstrip('\n')
MARK = 'other records sync repair (tools/cloud-transport/patch_other_sync.py)'
R = [
    ('''  function logSave(L) {
    Object.keys(L.devs).forEach(function (dv) {''',
     '''  /* 2026-11-26 · other records sync repair (tools/cloud-transport/patch_other_sync.py): what is recorded here asks for a
     cloud save (within 20 s, at once when the app goes to the background); a cloud copy taken in does not */
  var learnQuiet = false;
  function logSave(L) {
    Object.keys(L.devs).forEach(function (dv) {'''),
    ('''    if (changed) { L.sessions.sort(function (a, b) { return (a.at || 0) - (b.at || 0); }); logSave(L); }''',
     '''    if (changed) { L.sessions.sort(function (a, b) { return (a.at || 0) - (b.at || 0); }); learnQuiet = true; try { logSave(L); } finally { learnQuiet = false; } }'''),
    ('''    L.sessions = L.sessions.slice(-50);
    store(LKEY, L);
  }''',
     '''    L.sessions = L.sessions.slice(-50);
    store(LKEY, L);
    if (!learnQuiet) try { window.dispatchEvent(new CustomEvent('minest:cloud-dirty', { detail: { domain: 'learning' } })); } catch (e) {}
  }'''),
    ('''  function doc(u) { return window.firebase.firestore().collection('users').doc(u.uid).collection('focusboard').doc('toolkit'); }''',
     '''  /* 2026-11-26: through the sync transport (MinestSyncManagement.ref), like the main doc */
  function doc(u) { var r = window.firebase.firestore().collection('users').doc(u.uid).collection('focusboard').doc('toolkit'); return window.MinestSyncManagement && window.MinestSyncManagement.ref ? window.MinestSyncManagement.ref(r) : r; }'''),
]
RS = '/* Reconcile the current server revision before a conditional commit. No local ACK here. */'
RE = "w.MinestSyncReconcile={prepare:prepare,merge:reconcile,applyAccepted:"


def patch(s):
    i = s.find(RS); j = s.find(RE, i)
    if i < 0 or j < 0 or s.count(RS) != 1:
        return None, 'no head reconcile block'
    j = s.find('})(window);', j) + len('})(window);')
    s = s[:i] + RECONCILE + s[j:]
    if MARK in s:
        return s, 'already'
    for old, new in R:
        n = s.count(old)
        if n != 1:
            return None, 'anchor found %d times: %r' % (n, old[:80])
        s = s.replace(old, new)
    return s, 'patched'


def main(argv):
    check = '--check' in argv
    files = [a for a in argv if a != '--check']
    if not files:
        raise SystemExit(__doc__)
    bad = 0
    for name in files:
        p = ROOT / name; s = p.read_text(encoding='utf8')
        if check:
            ok = MARK in s and 'function learnMerge(r,l)' in s; print(('ok      ' if ok else 'MISSING ') + name); bad += not ok; continue
        out, why = patch(s)
        if out is None:
            print('skipped %s: %s' % (name, why)); bad += 1; continue
        if out != s:
            p.write_text(out, encoding='utf8')
        print(why, name)
    sys.exit(1 if bad and check else 0)


if __name__ == '__main__':
    main(sys.argv[1:])

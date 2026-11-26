#!/usr/bin/env python3
"""Board sync repair (2026-11-26) — reproducible, idempotent patch of the live pages.

    python3 tools/cloud-transport/patch_board_sync.py iPhoneDuo.html [more pages …]
    python3 tools/cloud-transport/patch_board_sync.py --check iPhoneDuo.html   # is it applied?

What it changes in each page (sources live next to this file):
  head  · MinestBoardMerge (board-merge.js): field-level, order-aware, move-aware three-way merge
        · MinestSyncReconcile (reconcile.js): built-in board edits merged per card on every commit
  app   · minestMerge3 uses MinestBoardMerge; built-in board helpers (board-app.js)
        · sanitizeLoadedBoards keeps fields it does not know (a card's ★ favourite and the like were dropped on
          every load and every cloud copy) and keeps a board it cannot read as it is instead of falling back to
          the default boards
        · the cloud listener waits for this device's own boards (IndexedDB) before it merges or takes a cloud
          copy, and the IndexedDB load no longer overwrites a newer state
        · a cloud copy taken in keeps this device's built-in boards and applies newer built-in edits; a local
          edit racing with an incoming copy is merged, not overwritten
        · after an upload the copy the server accepted (which may include other devices' edits) becomes the merge
          base and is taken in at once
        · the cloud payload carries builtinEdits; "pull from cloud" keeps built-in boards too
Pages whose code does not match (older bundles) are reported and left alone.
"""
import sys
from pathlib import Path

ROOT = Path(__file__).resolve().parents[2]
HERE = Path(__file__).resolve().parent
MARK = 'board sync repair (tools/cloud-transport/board-app.js'

OLD_MERGE_HEAD = None  # filled from git-free copy below
NEW_MERGE_HEAD = (HERE / 'board-merge.js').read_text(encoding='utf8').rstrip('\n')
NEW_RECONCILE = (HERE / 'reconcile.js').read_text(encoding='utf8').rstrip('\n')
APP = (HERE / 'board-app.js').read_text(encoding='utf8').rstrip('\n')

# the head block segments as they were before this repair
OLD_MERGE_START = '(function(root){function minestSame(a,b){return JSON.stringify(a)===JSON.stringify(b);}\nfunction minestMerge3(base, local, remote, mineNewer) {'
OLD_MERGE_END = 'root.MinestBoardMerge=minestMerge3;})(window);'
OLD_RECONCILE_START = '/* Reconcile the current server revision before a conditional commit. No local ACK here. */'
OLD_RECONCILE_END = "w.MinestSyncReconcile={prepare:prepare,merge:reconcile,applyAccepted:async function(p){var r=await unpack(p,'routine');if(r&&w.MinestRoutine&&w.MinestRoutine.confirm)w.MinestRoutine.confirm(r);}};})(window);"

R = []  # (old, new) exact, each must occur once


def rep(old, new):
    R.append((old, new))


# --- sanitizeLoadedBoards: keep unknown fields; a board it cannot read stays as it is ---
rep('''  try {
    return list.map(function(b, bIdx) {
      var lp = getBoardDisplayPrefs(b.id);''',
    '''  try {
    return list.filter(function(b) { return b && typeof b === 'object'; }).map(function(b, bIdx) { try {
      var lp = getBoardDisplayPrefs(b.id);''')
rep('''      return {
        id: typeof b.id === 'string' && b.id ? b.id : ("board-" + bIdx),''',
    '''      return Object.assign({}, b, {
        id: typeof b.id === 'string' && b.id ? b.id : ("board-" + bIdx),''')
rep('''        columns: Array.isArray(b.columns) ? b.columns.map(function(col, cIdx) {
          var colParts = splitBilingualTitle(col.title || "List");
          return {''',
    '''        columns: Array.isArray(b.columns) ? b.columns.filter(function(col) { return col && typeof col === 'object'; }).map(function(col, cIdx) {
          var colParts = splitBilingualTitle(col.title || "List");
          return Object.assign({}, col, {''')
rep('''            cards: Array.isArray(col.cards) ? col.cards.map(function(card, kIdx) {
              var cardParts = splitBilingualTitle(card.title || "Task");
              return {''',
    '''            cards: Array.isArray(col.cards) ? col.cards.filter(function(card) { return card && typeof card === 'object'; }).map(function(card, kIdx) {
              var cardParts = splitBilingualTitle(card.title || "Task");
              return Object.assign({}, card, {''')
rep('''                learn: card.learn && typeof card.learn === 'object' ? card.learn : null
              };
            }) : []
          };
        }) : []
      };
    });
  } catch (err) {
    return y;
  }
}''',
    '''                learn: card.learn && typeof card.learn === 'object' ? card.learn : null
              });
            }) : []
          });
        }) : []
      });
    } catch (e1) { return b; } });
  } catch (err) {
    return y;
  }
}''')

# --- boot: the cloud waits for this device's IndexedDB boards; that load never overwrites a newer state ---
rep('''function idbGetBoards() {''',
    '''/* 2026-11-26: settles once this device's own boards (IndexedDB) are loaded, at most 6 s after start */
var minestBoardsBootDone, minestBoardsBoot = new Promise(function(r) { minestBoardsBootDone = r; setTimeout(r, 6000); });
function idbGetBoards() {''')
rep('''    var cancelled = false;
    idbGetBoards().then(function(idbBoards) {''',
    '''    var cancelled = false, bootSeed = boards;
    idbGetBoards().then(function(idbBoards) {''')
rep('''      isRemoteUpdateRef.current = sanitized;
      setBoards(sanitized);''',
    '''      setBoards(function(cur) {
        /* something changed the boards since start (a quick edit, a tidy-up effect): keep that on top of the stored boards */
        var next = cur === bootSeed ? sanitized : minestKeepBuiltins(minestMerge3(minestNoBuiltins(bootSeed), minestNoBuiltins(sanitized), minestNoBuiltins(cur), true), sanitized);
        isRemoteUpdateRef.current = next; return next;
      });''')
rep('''    }).catch(function() {});
    return function() { cancelled = true; };
  }, []);''',
    '''    }).catch(function() {}).then(function() { minestBoardsBootDone(); });
    return function() { cancelled = true; };
  }, []);''')

# --- the cloud listener ---
rep('''            return minestCloudBoards(data).then(function(remoteBoards) {''',
    '''            return minestBoardsBoot.then(function() { return minestCloudBoards(data); }).then(function(remoteBoards) {''')
rep('''                  setBoards(function(local) { return base ? minestMerge3(base, local, remote, minestCloudNum(MINEST_CLOUD_DIRTY)>=rAt) : minestCloudNum(MINEST_CLOUD_DIRTY)>=rAt ? minestMergeBoards(local, remote) : minestMergeBoards(remote, local); });''',
    '''                  var todo = minestBuiltinIncoming(data.builtinEdits, cloudLatestRef.current && cloudLatestRef.current.boards);
                  setBoards(function(local) { return minestBuiltinPatchAll(minestKeepBuiltins(minestMerge3(minestNoBuiltins(base), minestNoBuiltins(local), minestNoBuiltins(remote), mineNewer), local), todo); });''')
rep('''                  var incoming = sanitizeLoadedBoards(remoteBoards);
                  isRemoteUpdateRef.current = incoming;
                  setBoards(incoming);''',
    '''                  var todoIn = minestBuiltinIncoming(data.builtinEdits, cloudLatestRef.current && cloudLatestRef.current.boards);
                  setBoards(function(cur) {
                    var incoming = minestBuiltinPatchAll(sanitizeLoadedBoards(minestKeepBuiltins(remoteBoards, cur)), todoIn);
                    /* a local edit the save effect has not seen yet: merge it instead of overwriting it */
                    if (cloudSeenRef.current && cur !== cloudSeenRef.current) return minestBuiltinPatchAll(minestKeepBuiltins(minestMerge3(minestNoBuiltins(cloudSeenRef.current), minestNoBuiltins(cur), minestNoBuiltins(incoming), true), cur), todoIn);
                    isRemoteUpdateRef.current = incoming; return incoming;
                  });''')

# --- the save: the accepted copy becomes the base and is taken in ---
rep('''.set(payload, { merge: true }).then(function() {
            // Acknowledge only the exact groups in this successful write; newer local edits stay pending.
            window.MinestWorkspaceCloud.merge(payload.workspaceGroups, true);
          });
        }).then(function() {
          uploadSucceeded = true;
          if (sentAt > minestCloudNum(MINEST_CLOUD_ACK)) minestCloudMark(MINEST_CLOUD_ACK, sentAt);
          minestCloudBaseSet(L.boards);''',
    '''.set(payload, { merge: true }).then(function(res) {
            // Acknowledge only the exact groups in this successful write; newer local edits stay pending.
            window.MinestWorkspaceCloud.merge(payload.workspaceGroups, true);
            return res;
          });
        }).then(function(res) {
          uploadSucceeded = true;
          if (sentAt > minestCloudNum(MINEST_CLOUD_ACK)) minestCloudMark(MINEST_CLOUD_ACK, sentAt);
          /* 2026-11-26: the server may now hold more than this device sent (the commit merged in other devices' edits).
             That accepted copy becomes the merge base and is taken in now, instead of a poll reverting edits later. */
          var accepted = res && res.payload;
          return (accepted ? minestCloudBoards(accepted) : Promise.resolve(null)).catch(function() { return null; }).then(function(acc) {
            var now = cloudLatestRef.current ? cloudLatestRef.current.boards : latest.boards;
            var todo = accepted ? minestBuiltinIncoming(accepted.builtinEdits, now) : {};
            if (!acc || !acc.length || minestSame(acc, minestNoBuiltins(L.boards))) {
              minestCloudBaseSet(L.boards);
              if (Object.keys(todo).length) setBoards(function(cur) { var next = minestBuiltinPatchAll(cur, todo); if (cur === latest.boards) isRemoteUpdateRef.current = next; return next; });
              return;
            }
            var acceptedBoards = sanitizeLoadedBoards(acc);
            minestCloudBaseSet(acceptedBoards);
            window.__minestTakenStamp = String(sentAt) + ':' + acc.length;
            setBoards(function(cur) {
              if (cur === latest.boards) { var next = minestBuiltinPatchAll(sanitizeLoadedBoards(minestKeepBuiltins(acc, cur)), todo); isRemoteUpdateRef.current = next; return next; }
              return minestBuiltinPatchAll(minestKeepBuiltins(minestMerge3(minestNoBuiltins(L.boards), minestNoBuiltins(cur), minestNoBuiltins(acceptedBoards), true), cur), todo);
            });
          });
        }).then(function() {''')

# --- payload: built-in edits ride along ---
rep('''async function minestCloudPayload(boards, extra) {
  if (Array.isArray(boards)) boards = boards.filter(function(b) { return !b || (b.id !== 'board-ec6-outline' && b.id !== 'board-ec6-glossary'); });''',
    '''async function minestCloudPayload(boards, extra) {
  var builtinEdits = null; try { builtinEdits = minestBuiltinEditsPayload(boards); } catch (e) {}
  if (Array.isArray(boards)) boards = boards.filter(function(b) { return !b || (b.id !== 'board-ec6-outline' && b.id !== 'board-ec6-glossary'); });''')
rep('''  base.workspaceGroups = window.MinestWorkspaceCloud.snapshot();
''',
    '''  base.workspaceGroups = window.MinestWorkspaceCloud.snapshot();
  if (builtinEdits) base.builtinEdits = builtinEdits;
''')
rep('''JSON.stringify(base.workspaceGroups).length;''',
    '''JSON.stringify(base.workspaceGroups).length + JSON.stringify(base.builtinEdits || null).length;''')

# --- pull from cloud keeps built-in boards ---
rep('''          var pulled = sanitizeLoadedBoards(pulledBoards);
          isRemoteUpdateRef.current = pulled;
          setBoards(pulled);''',
    '''          var pullTodo = minestBuiltinIncoming(data.builtinEdits, boards);
          setBoards(function(cur) { var pulled = minestBuiltinPatchAll(sanitizeLoadedBoards(minestKeepBuiltins(pulledBoards, cur)), pullTodo); isRemoteUpdateRef.current = pulled; return pulled; });''')


def cut(s, start, end):
    i = s.find(start)
    if i < 0 or s.count(start) != 1:
        return None
    j = s.find(end, i)
    if j < 0:
        return None
    return i, j + len(end)


def patch(text, name):
    if MARK in text:
        return text, 'already'
    # head block
    m = cut(text, OLD_MERGE_START, OLD_MERGE_END)
    r = cut(text, OLD_RECONCILE_START, OLD_RECONCILE_END)
    if not m or not r:
        return None, 'no head sync block'
    text = text[:m[0]] + NEW_MERGE_HEAD + text[m[1]:]
    r = cut(text, OLD_RECONCILE_START, OLD_RECONCILE_END)
    text = text[:r[0]] + NEW_RECONCILE + text[r[1]:]
    # app minestMerge3 → delegate + helpers
    a = cut(text, 'function minestMerge3(base, local, remote, mineNewer) {\n  var LEVELS', '\n// 31.7: Trello')
    if not a:
        return None, 'no app merge'
    text = text[:a[0]] + APP + '\n\n// 31.7: Trello' + text[a[1]:]
    for old, new in R:
        n = text.count(old)
        if n != 1:
            return None, 'anchor found %d times: %r' % (n, old[:90])
        text = text.replace(old, new)
    if '</script' in APP.lower() or '</script' in NEW_MERGE_HEAD.lower() or '</script' in NEW_RECONCILE.lower():
        raise SystemExit('source contains </script')
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
            ok = MARK in s
            print(('ok      ' if ok else 'MISSING ') + name)
            bad += not ok
            continue
        out, why = patch(s, name)
        if out is None:
            print('skipped %s: %s' % (name, why)); bad += 1; continue
        if out != s:
            p.write_text(out, encoding='utf8')
        print('%s %s' % (why, name))
    sys.exit(1 if bad and check else 0)


if __name__ == '__main__':
    main(sys.argv[1:])

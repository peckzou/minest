"""Apply the narrowly scoped sync fix to generated HTML copies, in this worktree only."""
from pathlib import Path
import re
ROOT = Path(__file__).resolve().parents[2]
FILES = ['iPhone53.8241.html','iphone.html','index.html','iPhoneDuo.html','ipad.html','ios/Minest/Minest/iphone.html','ios/Minest/Minest/iphone18.0.html','ios/Minest/Minest/ipad.html','ios/MinestProject/MyApp/iphone.html']
block = '<script id="mn-workspace-cloud-v2">\n' + (ROOT/'tools/live-perf/cloud_workspace_sync.js').read_text() + '\n</script>'
for name in FILES:
 p = ROOT/name
 t = p.read_text()
 if 'id="mn-workspace-cloud-v2"' in t:
  t = re.sub(r'<script id="mn-workspace-cloud-v2">[\s\S]*?</script>', lambda _: block, t)
  p.write_text(t)
  continue
 def sub(old, new, count=1):
  global t
  found=t.count(old)
  if found != count: raise ValueError(f'{name}: expected {count}, got {found}: {old[:100]}')
  t=t.replace(old,new)
 sub('<head>', '<head>\n'+block)
 sub("    setCustomWorkspaces(list);\n    try { localStorage.setItem('minest.customWorkspaces.v1', JSON.stringify(list)); } catch (e) {}", "    try { window.MinestWorkspaceCloud.save(list); setCustomWorkspaces(window.MinestWorkspaceCloud.names()); }\n    catch (e) { GlassUI.toast('Cannot save this group on this device. Check available storage; existing groups are kept.'); }")
 sub("  var activeWorkspaceState =", "  (0, _.useEffect)(function() {\n    var reload = function() { setCustomWorkspaces(window.MinestWorkspaceCloud.names()); };\n    reload(); window.addEventListener('minest:workspaces-changed', reload);\n    return function() { window.removeEventListener('minest:workspaces-changed', reload); };\n  }, []);\n\n  var activeWorkspaceState =")
 sub('  // 44.6 Learning Path: the study log', '  base.workspaceGroups = window.MinestWorkspaceCloud.snapshot();\n  // 44.6 Learning Path: the study log')
 sub('JSON.stringify(base.learning || null).length;', 'JSON.stringify(base.learning || null).length + JSON.stringify(base.workspaceGroups).length;')
 sub('function minestCloudUnsynced() { return minestCloudNum(MINEST_CLOUD_DIRTY) > minestCloudNum(MINEST_CLOUD_ACK); }', '''function minestCloudBoardsDirty() { return minestCloudNum(MINEST_CLOUD_DIRTY) > minestCloudNum(MINEST_CLOUD_ACK); }
function minestCloudUnsynced() { return minestCloudBoardsDirty() || window.MinestWorkspaceCloud.pending(); }
function minestCloudDirty() { minestCloudMark(MINEST_CLOUD_DIRTY, Math.max(Date.now(), minestCloudNum(MINEST_CLOUD_DIRTY) + 1, minestCloudNum(MINEST_CLOUD_ACK) + 1)); }''')
 sub('isRemoteUpdateRef.current = true;\n      setBoards(sanitized);', 'isRemoteUpdateRef.current = sanitized;\n      setBoards(sanitized);')
 sub('setTimeout(function() { isRemoteUpdateRef.current = false; }, 300);', '/* Remote updates are identified by their exact array, never by a timed edit lock. */',3)
 sub('var cloudFlushRef = (0, _.useRef)(null),', 'var cloudInFlightRef = (0, _.useRef)(null);\n  var cloudFlushRef = (0, _.useRef)(null),')
 sub('        cloudReadyRef.current = false;', '        cloudReadyRef.current = false;\n        window.MinestWorkspaceCloud.resetServer();\n        var stopped = false;')
 sub('        var takeDoc = function(doc) {', '        var takeDoc = function(doc) {\n          if (stopped || !fb.auth.currentUser || fb.auth.currentUser.uid !== user.uid) return Promise.resolve();')
 sub('            minestCloudBoards(data).then(function(remoteBoards) {', "            try { window.MinestWorkspaceCloud.merge(data.workspaceGroups, !(doc.metadata && doc.metadata.fromCache)); } catch (e) { setSyncStatus('error'); return Promise.reject(e); }\n            if (doc.metadata && doc.metadata.fromCache) { setSyncStatus(\"connecting\"); return Promise.resolve(); }\n            return minestCloudBoards(data).then(function(remoteBoards) {\n              if (stopped) return;")
 sub('remoteBoards.length > 0 && minestCloudUnsynced()', 'remoteBoards.length > 0 && minestCloudBoardsDirty()')
 sub('                minestCloudBaseGet().then(function(base) {', '                return minestCloudBaseGet().then(function(base) {\n                  if (stopped) return;')
 sub('                });\n                return;\n              }\n              if (remoteBoards', '                });\n              }\n              if (remoteBoards')
 sub('                isRemoteUpdateRef.current = true;\n                setBoards(sanitizeLoadedBoards(remoteBoards));', '                var incoming = sanitizeLoadedBoards(remoteBoards);\n                isRemoteUpdateRef.current = incoming;\n                setBoards(incoming);')
 sub('              setSyncStatus("synced");\n            });', '              setSyncStatus(minestCloudUnsynced() ? "saving" : "synced");\n              if (minestCloudUnsynced()) setCloudKick(function(k) { return k + 1; });\n            }).catch(function(err) { setSyncStatus("error"); throw err; });')
 sub('            minestCloudPayload((cloudLatestRef.current', '            return minestCloudPayload((cloudLatestRef.current')
 sub('        var unsubDoc = docRef.onSnapshot(takeDoc, function(err) {', '        var queue = Promise.resolve();\n        var acceptDoc = function(doc) { queue = queue.catch(function() {}).then(function() { return takeDoc(doc); }); return queue; };\n        var unsubDoc = docRef.onSnapshot({ includeMetadataChanges: true }, function(doc) { acceptDoc(doc).catch(function() { setSyncStatus("error"); }); }, function(err) {')
 sub("          if (cloudFlushRef.current) cloudFlushRef.current();   // a save that was waiting goes first\n          return docRef.get({ source: 'server' }).then(function(doc) {\n            takeDoc(doc);\n            setCloudKick(function(k) { return k + 1; });   // anything still unsynced here goes up\n            return true;\n          })", "          var flush = cloudFlushRef.current;\n          return Promise.resolve(flush ? flush() : cloudInFlightRef.current).then(function() {\n            return docRef.get({ source: 'server' });\n          }).then(acceptDoc).then(function() {\n            setCloudKick(function(k) { return k + 1; });\n            return !minestCloudUnsynced();\n          })")
 sub('return function() { unsubDoc(); if (window.minestCloudSyncNow)', 'return function() { stopped = true; cloudReadyRef.current = false; unsubDoc(); if (window.minestCloudSyncNow)')
 sub('window.minestCloudSyncNow().then(function() { GlassUI.toast("☁️ Synced with the cloud"); })', 'window.minestCloudSyncNow().then(function(done) { GlassUI.toast(done ? "☁️ Synced with the cloud" : "☁️ Changes queued — syncing with the cloud"); })')
 sub('    var edited = cloudSeenRef.current !== null && cloudSeenRef.current !== boards && !isRemoteUpdateRef.current;', '    var remoteApplied = isRemoteUpdateRef.current === boards;\n    var edited = cloudSeenRef.current !== null && cloudSeenRef.current !== boards && !remoteApplied;\n    if (remoteApplied) isRemoteUpdateRef.current = null;')
 sub('if (edited) minestCloudMark(MINEST_CLOUD_DIRTY, Date.now());', 'if (edited) minestCloudDirty();')
 sub("if (isRemoteUpdateRef.current || !firebaseUser", "if (!firebaseUser")
 sub('      var L = cloudLatestRef.current, sentAt = 0;', '''      if (cloudInFlightRef.current) return cloudInFlightRef.current;
      if (!firebase.auth().currentUser || firebase.auth().currentUser.uid !== user.uid) return Promise.resolve();
      var L = cloudLatestRef.current, sentAt = minestCloudNum(MINEST_CLOUD_DIRTY);''')
 sub('        minestCloudPayload(L.boards, {', '        cloudInFlightRef.current = minestCloudPayload(L.boards, {')
 sub('          sentAt = payload.clientUpdatedAt;', '          if (sentAt) { payload.clientUpdatedAt = sentAt; if (payload.boardsGz) payload.gzUpdatedAt = sentAt; }')
 sub('      } catch (e) { fail(e); }', '      } catch (e) { fail(e); return Promise.reject(e); }')
 sub('        }).catch(fail);', '''        }).catch(function(err) { fail(err); throw err; }).finally(function() {
          cloudInFlightRef.current = null;
        });
        return cloudInFlightRef.current;''')
 # Avoid an unhandled rejected timer/background promise; explicit Sync Now still sees failures.
 sub('saveDebounceRef.current = setTimeout(run, 500);', 'saveDebounceRef.current = setTimeout(function() { run().catch(function() {}); }, 500);')
 sub('var hide = function() { gptNow(); if (cloudFlushRef.current) cloudFlushRef.current(); };', 'var hide = function() { gptNow(); if (cloudFlushRef.current) { var p = cloudFlushRef.current(); if (p) p.catch(function() {}); } };')
 sub('minestCloudMark(MINEST_CLOUD_DIRTY, Date.now()); kick();', 'minestCloudDirty(); kick();')
 sub("    window.addEventListener('online', kick);", "    window.addEventListener('online', kick);\n    window.addEventListener('minest:workspaces-changed', kick);")
 sub("window.removeEventListener('online', kick);", "window.removeEventListener('online', kick); window.removeEventListener('minest:workspaces-changed', kick);")
 sub('      var pushPayload = await minestCloudPayload(boards, {', '      var pushedDirty = minestCloudNum(MINEST_CLOUD_DIRTY);\n      var pushPayload = await minestCloudPayload(boards, {')
 sub('      await db.collection("users").doc(firebaseUser.uid).collection("focusboard").doc("data").set(pushPayload, { merge: true });', '      if (pushedDirty) { pushPayload.clientUpdatedAt = pushedDirty; if (pushPayload.boardsGz) pushPayload.gzUpdatedAt = pushedDirty; }\n      await db.collection("users").doc(firebaseUser.uid).collection("focusboard").doc("data").set(pushPayload, { merge: true });')
 sub('minestCloudMark(MINEST_CLOUD_ACK, pushPayload.clientUpdatedAt);', 'minestCloudMark(MINEST_CLOUD_ACK, Math.max(pushedDirty, minestCloudNum(MINEST_CLOUD_ACK)));')
 sub('          isRemoteUpdateRef.current = true;\n          setBoards(sanitizeLoadedBoards(pulledBoards));', '          var pulled = sanitizeLoadedBoards(pulledBoards);\n          isRemoteUpdateRef.current = pulled;\n          setBoards(pulled);')
 sub('        var pulledBoards = await minestCloudBoards(data);', '        window.MinestWorkspaceCloud.merge(data.workspaceGroups, !(doc.metadata && doc.metadata.fromCache));\n        var pulledBoards = await minestCloudBoards(data);')
 sub("(dirty > ack ? 'Not sent yet ('", "((dirty > ack || (window.MinestWorkspaceCloud && window.MinestWorkspaceCloud.pending())) ? 'Not sent yet ('")
 p.write_text(t)
 print(name)

"""Safe server refresh plus a non-overlapping settings header. Worktree-local only."""
from pathlib import Path
ROOT=Path(__file__).resolve().parents[2]
FILES=['iPhone53.8241.html','iphone.html','index.html','iPhoneDuo.html','ipad.html','ios/Minest/Minest/iphone.html','ios/Minest/Minest/iphone18.0.html','ios/Minest/Minest/ipad.html','ios/MinestProject/MyApp/iphone.html']
for name in FILES:
 p=ROOT/name;t=p.read_text()
 if 'function minestCloudWait(' in t: continue
 def sub(old,new,count=1):
  global t
  if t.count(old)!=count:raise ValueError(f'{name}: {t.count(old)} matches for {old[:70]}')
  t=t.replace(old,new)
 sub('function minestCloudBoardsDirty()', '''function minestCloudWait(promise, ms) {
  return new Promise(function(resolve, reject) {
    var timer = setTimeout(function() { var e = new Error('Server connection timed out. Changes are kept on this device.'); e.code = 'sync/timeout'; reject(e); }, ms || 15000);
    Promise.resolve(promise).then(function(value) { clearTimeout(timer); resolve(value); }, function(error) { clearTimeout(timer); reject(error); });
  });
}
function minestCloudBoardsDirty()''')
 sub("          if (doc.exists) {\n            var data = doc.data();", "          if (!(doc.metadata && doc.metadata.fromCache)) setCloudReadError('');\n          if (doc.exists) {\n            var data = doc.data();")
 sub('  var isRemoteUpdateRef =', "  var cloudReadErrorState = (0, _.useState)(''), cloudReadError = cloudReadErrorState[0], setCloudReadError = cloudReadErrorState[1];\n  (0, _.useEffect)(function() { window.__minestCloudStatus = syncStatus; }, [syncStatus]);\n  var isRemoteUpdateRef =")
 start=t.index('        window.minestCloudSyncNow = function() {')
 end=t.index('\n      } else {\n        setFirebaseUser(null);',start)
 old=t[start:end]
 sub(old, '''        var refreshPromise = null;
        var refreshServer = function() {
          if (stopped) return Promise.resolve(false);
          if (refreshPromise) return refreshPromise;
          setCloudReadError('');
          if (!cloudReadyRef.current) setSyncStatus('connecting');
          refreshPromise = minestCloudWait(docRef.get({ source: 'server' })).then(acceptDoc).then(function() {
            if (stopped) return false;
            setCloudReadError('');
            setCloudKick(function(k) { return k + 1; });
            return cloudReadyRef.current && !minestCloudUnsynced();
          }).catch(function(err) {
            if (!stopped) { setSyncStatus(err.code === 'sync/timeout' ? 'offline' : 'error'); setCloudReadError((err.code || 'sync/error') + ': ' + (err.message || 'Server unavailable')); }
            throw err;
          }).finally(function() { refreshPromise = null; });
          return refreshPromise;
        };
        window.minestCloudSyncNow = function() {
          setSyncStatus('saving');
          var flush = cloudFlushRef.current;
          return minestCloudWait(flush ? flush() : cloudInFlightRef.current).then(refreshServer);
        };
        var wakeCloud = function() { if (!document.hidden) refreshServer().catch(function() {}); };
        window.addEventListener('online', wakeCloud);
        window.addEventListener('pageshow', wakeCloud);
        document.addEventListener('visibilitychange', wakeCloud);
        refreshServer().catch(function() {});
        return function() {
          stopped = true; cloudReadyRef.current = false; unsubDoc();
          window.removeEventListener('online', wakeCloud); window.removeEventListener('pageshow', wakeCloud); document.removeEventListener('visibilitychange', wakeCloud);
          if (window.minestCloudSyncNow) window.minestCloudSyncNow = null;
        };''')
 sub("  var authError = props.authError || \"\";", "  var authError = props.authError || \"\";\n  var syncError = props.syncError || '';\n  var syncNowState = (0, _.useState)(false), syncNowBusy = syncNowState[0], setSyncNowBusy = syncNowState[1];")
 sub("syncStatus === 'error' ? 'Sync error, check configuration' : syncStatus === 'unauthorized' ? 'Access restricted: unauthorized account' : 'Not signed in'", "syncStatus === 'error' ? 'Sync error — changes kept locally' : syncStatus === 'offline' ? 'Server unavailable — changes kept locally' : syncStatus === 'connecting' ? 'Connecting to cloud...' : syncStatus === 'unauthorized' ? 'Access restricted: unauthorized account' : firebaseUser ? 'Signed in — waiting for cloud' : 'Not signed in'")
 sub("            firebaseUser ? (0, P.jsxs)('div', {\n              className: \"space-y-4\",", """            firebaseUser ? (0, P.jsxs)('div', {
              className: "space-y-4",
              children: [
                (0, P.jsx)('button', {
                  type: 'button', disabled: syncNowBusy,
                  onClick: function() {
                    if (!window.minestCloudSyncNow) { GlassUI.toast('Cloud connection is starting. Try again shortly.'); return; }
                    setSyncNowBusy(true);
                    window.minestCloudSyncNow().then(function(done) { GlassUI.toast(done ? 'Cloud confirmed — up to date' : 'Changes queued — syncing safely'); }).catch(function(err) { GlassUI.toast(err.message || 'Cloud unavailable. Changes stay on this device.'); }).finally(function() { setSyncNowBusy(false); });
                  },
                  className: 'w-full py-3 px-4 rounded-xl bg-emerald-600 text-white font-semibold disabled:opacity-50',
                  children: syncNowBusy ? 'Connecting...' : '↻ Sync now · keep both devices’ changes'
                }),
                syncError ? (0, P.jsx)('p', {role:'status', className:'text-xs text-amber-400 break-words', children:syncError}) : null,
                /* EXISTING ACCOUNT CONTROLS */""")
 sub("                /* EXISTING ACCOUNT CONTROLS */\n              children: [", "                /* Existing account controls */")
 sub('        authError: firebaseAuthError,', '        authError: firebaseAuthError,\n        syncError: cloudReadError,')
 # Remove only the two duplicate quick controls in the settings header.
 a=t.index("            (0, P.jsx)('button', {\n              type: \"button\",\n              onClick: togglePureMode,")
 b=t.index("            (0, P.jsx)('button', {\n              type: \"button\",\n              onClick: onClose,",a)
 t=t[:a]+t[b:]
 sub("M + ' > .mn-set-head{position:relative!important}' + M + ' > .mn-set-head > :first-child{margin-right:150px}',", "M + ' > .mn-set-head{position:relative!important;display:grid!important;grid-template-columns:minmax(0,1fr) auto 32px;gap:12px!important;align-items:center!important}' + M + ' > .mn-set-head > :first-child{margin-right:0!important;min-width:0}' + M + ' > .mn-set-head > button:not(.mn-set-cloud){grid-column:3;grid-row:1}',")
 sub("M + ' > .mn-set-head > :first-child{margin-right:48px}", "M + ' > .mn-set-head{gap:8px!important}' + M + ' > .mn-set-head > :first-child{margin-right:0!important}")
 sub('position:absolute!important;right:58px!important;top:50%!important;transform:translateY(-50%);margin:0!important;', 'position:static!important;grid-column:2;grid-row:1;transform:none!important;margin:0!important;')
 sub('.mn-set-cloud:active{transform:translateY(-50%) scale(.96)}', '.mn-set-cloud:active{transform:scale(.96)}')
 sub(": '☁️ ' + ((dirty > ack", ": '☁️ ' + (/^(connecting|offline|error)$/.test(window.__minestCloudStatus || '') ? (window.__minestCloudStatus === 'connecting' ? 'Connecting to server' : 'Server unavailable — changes kept locally') : ((dirty > ack")
 sub("hm(dirty) + ')' : 'Up to date') + (info ?", "hm(dirty) + ')' : 'Up to date')) + (info ?")
 p.write_text(t)
 print(name)

"""☁️ Sync now (2026-10-27): a ↻ button in the board picker (Workspace) header pulls the cloud copy from the server right
away and merges it as a snapshot would (three-way when this device has unsynced edits, which are then pushed up).
The snapshot handler becomes a named takeDoc(doc) used by both the live listener and window.minestCloudSyncNow().
Re-runnable; applied to iPhone53.8241.html, then copied to the page copies. Run before patch_duo.py / patch_stand.py."""
from pathlib import Path
import shutil
HERE = Path(__file__).resolve().parent; ROOT = HERE.parents[1]
SRC = ROOT / 'iPhone53.8241.html'
COPIES = ['iphone.html', 'index.html', 'ios/Minest/Minest/iphone.html', 'ios/MinestProject/MyApp/iphone.html', 'ios/Minest/Minest/iphone18.0.html', 'ipad.html', 'ios/Minest/Minest/ipad.html']
s = SRC.read_text(encoding='utf-8')

if 'window.minestCloudSyncNow' not in s:
    a = "        var unsubDoc = docRef.onSnapshot(function(doc) {\n"
    assert s.count(a) == 1
    i = s.index(a)
    end = "        }, function(err) {\n          setSyncStatus(\"error\");\n        });\n"
    j = s.index(end, i)
    body = s[i + len(a):j]
    s = s[:i] + "        // 2026-10-27: one handler for the live listener and for ☁️ Sync now (a server read on demand)\n        var takeDoc = function(doc) {\n" + body + \
        "        };\n        var unsubDoc = docRef.onSnapshot(takeDoc, function(err) {\n          setSyncStatus(\"error\");\n        });\n" + \
        """        window.minestCloudSyncNow = function() {
          setSyncStatus("saving");
          if (cloudFlushRef.current) cloudFlushRef.current();   // a save that was waiting goes first
          return docRef.get({ source: 'server' }).then(function(doc) {
            takeDoc(doc);
            setCloudKick(function(k) { return k + 1; });   // anything still unsynced here goes up
            return true;
          }).catch(function(err) { setSyncStatus("error"); throw err; });
        };
""" + s[j + len(end):]
    s = s.replace("        return function() { unsubDoc(); };\n      } else {\n        setFirebaseUser(null);",
                  "        return function() { unsubDoc(); if (window.minestCloudSyncNow) window.minestCloudSyncNow = null; };\n      } else {\n        setFirebaseUser(null);", 1)

if 'mn-ws-sync' not in s:
    a = """          (0, P.jsx)('button', {
            type: "button",
            onClick: onClose,
            className: "p-1 rounded-full opacity-60 hover:opacity-100 hover:bg-white/10 transition-colors",
            children: (0, P.jsx)(Te, { className: "w-4 h-4" })
          })
        ]
      }),

      // Workspace Filter Tabs & New Folder Button"""
    assert s.count(a) == 1, s.count(a)
    b = """          (0, P.jsxs)('div', { className: "flex items-center gap-1", children: [
          // ☁️ Sync now: read the cloud copy from the server and merge it (and send up what this device has)
          (0, P.jsx)('button', {
            type: "button",
            title: "Sync with the cloud now",
            "aria-label": "Sync with the cloud now",
            onClick: function(e) {
              var btn = e.currentTarget;
              if (!window.minestCloudSyncNow) { GlassUI.toast("☁️ Sign in to Cloud Sync first"); return; }
              if (btn.classList.contains('mn-ws-sync-on')) return;
              btn.classList.add('mn-ws-sync-on'); SoundEngine.play('click');
              window.minestCloudSyncNow().then(function() { GlassUI.toast("☁️ Synced with the cloud"); })
                .catch(function(err) { GlassUI.toast("☁️ Sync did not go through (" + ((err && (err.code || err.message)) || 'offline') + ")"); })
                .then(function() { setTimeout(function() { btn.classList.remove('mn-ws-sync-on'); }, 400); });
            },
            className: "mn-ws-sync p-1 rounded-full opacity-70 hover:opacity-100 hover:bg-white/10 transition-colors",
            children: (0, P.jsx)('svg', { width: 16, height: 16, viewBox: "0 0 24 24", fill: "none", stroke: "currentColor", strokeWidth: 2, strokeLinecap: "round", strokeLinejoin: "round", children: [
              (0, P.jsx)('path', { d: "M21 12a9 9 0 0 1-15.5 6.3L3 16" }), (0, P.jsx)('path', { d: "M3 12a9 9 0 0 1 15.5-6.3L21 8" }), (0, P.jsx)('path', { d: "M21 3v5h-5" }), (0, P.jsx)('path', { d: "M3 21v-5h5" })
            ] })
          }),
          (0, P.jsx)('button', {
            type: "button",
            onClick: onClose,
            className: "p-1 rounded-full opacity-60 hover:opacity-100 hover:bg-white/10 transition-colors",
            children: (0, P.jsx)(Te, { className: "w-4 h-4" })
          })
          ] })
        ]
      }),

      // Workspace Filter Tabs & New Folder Button"""
    s = s.replace(a, b)
    css = "<style id=\"mn-ws-sync-css\">.mn-ws-sync-on svg{animation:mnWsSpin .8s linear infinite}@keyframes mnWsSpin{to{transform:rotate(360deg)}}</style>\n"
    k = s.rindex('</body>'); s = s[:k] + css + s[k:]

# who wrote the cloud copy last (app / browser), and a status line in the Workspace header
if 'function minestCloudWriter' not in s:
    a = "function minestCloudPayload(boards, extra) {\n  var now = Date.now();\n  var base = Object.assign({}, extra, { clientUpdatedAt: now, updatedAt: firebase.firestore.FieldValue.serverTimestamp() });"
    assert s.count(a) == 1
    s = s.replace(a, """/* 2026-10-27: which device wrote the cloud copy (shown in the Workspace header) */
function minestCloudWriter() {
  var ua = navigator.userAgent || '', app = !!(window.webkit && window.webkit.messageHandlers && window.webkit.messageHandlers.minestBridge);
  var dev = /iPad/.test(ua) ? 'iPad' : /iPhone/.test(ua) ? 'iPhone' : /Macintosh/.test(ua) ? (navigator.maxTouchPoints > 1 ? 'iPad' : 'Mac') : /Android/.test(ua) ? 'Android' : /Windows/.test(ua) ? 'Windows' : 'Web';
  var br = app ? 'app' : /Edg\\//.test(ua) ? 'Edge' : /Chrome\\//.test(ua) ? 'Chrome' : /Firefox\\//.test(ua) ? 'Firefox' : /Safari\\//.test(ua) ? 'Safari' : 'browser';
  if (window.__MINEST_DUO__ || document.documentElement.classList.contains('duo')) dev = 'iPhone Duo';
  return dev + ' ' + br;
}
function minestCloudPayload(boards, extra) {
  var now = Date.now();
  var base = Object.assign({}, extra, { clientUpdatedAt: now, writer: minestCloudWriter(), updatedAt: firebase.firestore.FieldValue.serverTimestamp() });""")
    # remember the cloud's writer and time whenever a cloud copy comes in
    a = "        var takeDoc = function(doc) {\n"
    assert s.count(a) == 1
    s = s.replace(a, a + "          try { if (doc.exists) { var w = doc.data(); window.__minestCloudInfo = { writer: w.writer || '', at: Math.max(Number(w.clientUpdatedAt) || 0, Number(w.gzUpdatedAt) || 0) }; } } catch (e) {}\n")
    # status line under the Workspace title
    a = """              (0, P.jsxs)('h3', { className: "mn-ws-title font-bold text-sm", children: ["Workspace", (0, P.jsx)('small', { className: "mn-ws-sub", children: visibleBoards.length + " boards" })] })"""
    assert s.count(a) == 1
    s = s.replace(a, a + """,
              (0, P.jsx)('span', { className: "mn-ws-cloud", ref: function(el) { if (el && window.minestCloudLine) window.minestCloudLine(el); } })""")
    css = "<style id=\"mn-ws-cloud-css\">.mn-ws-cloud{display:block;font-size:11px;font-weight:500;opacity:.6;margin-top:2px;white-space:nowrap;overflow:hidden;text-overflow:ellipsis;max-width:62vw}</style>\n"
    s = s.replace("<style id=\"mn-ws-sync-css\">", css + "<style id=\"mn-ws-sync-css\">", 1)
    js = """<script id="mn-ws-cloud-js">
/* the Workspace header says how cloud sync stands: this device's state, and who wrote the cloud copy last, when */
window.minestCloudLine = function (el) {
  function hm(t) { if (!t) return '—'; var d = new Date(t), now = new Date(); return (d.toDateString() === now.toDateString() ? '' : (d.getMonth() + 1) + '/' + d.getDate() + ' ') + d.toTimeString().slice(0, 5); }
  function draw() {
    if (!el.isConnected) return;
    var signed = typeof firebase !== 'undefined' && firebase.apps && firebase.apps.length && firebase.auth().currentUser, info = window.__minestCloudInfo, dirty = 0, ack = 0;
    try { dirty = +localStorage.getItem('minest.cloud.dirtyAt') || 0; ack = +localStorage.getItem('minest.cloud.ackAt') || 0; } catch (e) {}
    el.textContent = !signed ? '☁️ Not signed in to Cloud Sync — changes stay on this device'
      : '☁️ ' + (dirty > ack ? 'Not sent yet (' + hm(dirty) + ')' : 'Up to date') + (info ? ' · cloud: ' + (info.writer || 'unknown device') + ', ' + hm(info.at) : '');
    setTimeout(draw, 2000);
  }
  draw();
};
</script>
"""
    k = s.rindex('</body>'); s = s[:k] + js + s[k:]

SRC.write_text(s, encoding='utf-8')
for c in COPIES: shutil.copyfile(SRC, ROOT / c)
print('patched cloud sync now')

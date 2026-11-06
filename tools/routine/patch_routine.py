"""Liquid Routine (4.12, ~/Documents/liquid-routine) inside Minest — a module, not an iframe or a separate page.

- tools/routine/minest-routine.js is the app's embeddable build (`npm run build:embed` in ~/Documents/liquid-routine,
  then copy dist-embed/minest-routine.js here). It rides in the page as inert text (<script type="text/plain"
  id="mn-routine-src">) and runs on the first open; it mounts in a shadow root, so its styles and Minest's never meet.
- window.MinestRoutine = { open, close, isOpen, _cloud, _mergeCloud }: full screen over Minest, left by the routine's own ✕ (top right);
  closing unmounts it (no GPU work in the background). Entries: a tile in the right-side dock column and a tab in
  the bottom tab bar.
- The routine (tasks + execution records) is Minest's: kept in this page's localStorage (liquid-routine.v1, saved
  time liquid-routine.savedAt) and carried by Minest's cloud sync as routineGz (gzip, counted in the 1 MB check), next
  to boardsGz / knowledgeGz / gptstudyGz. Merging another device's copy: the task list of whichever side saved later
  (so a deleted activity stays deleted); execution records from both, each keeping the side with more progress; at
  most one running timer (the routine's own rule).
Patched into every copy; safe to re-run (each block is replaced with its current text)."""
import re
from pathlib import Path

HERE = Path(__file__).resolve().parent
ROOT = HERE.parents[1]
FILES = ['iPhone53.8241.html', 'iphone.html', 'index.html', 'ipad.html', 'iPhoneDuo.html', 'ios/Minest/Minest/iphone.html',
         'ios/Minest/Minest/iphone18.0.html', 'ios/Minest/Minest/ipad.html', 'ios/MinestProject/MyApp/iphone.html']
BUNDLE = (HERE / 'minest-routine.js').read_text(encoding='utf-8')
assert '</script' not in BUNDLE.lower()

CSS = """<style id="mn-routine-style">
.mn-routine { position:fixed; inset:0; z-index:2147483560; background:#F7F9FC; }
.mn-routine[hidden] { display:none; }
.mn-routine-host { position:absolute; inset:0; }
html.mn-routine-on #minest-mini-pet-p0 { visibility:hidden !important; }
</style>
"""

RUN = r"""<script id="mn-routine-run">
/* 💧 MinestRoutine — Liquid Routine as a Minest module (tools/routine/patch_routine.py) */
(function () {
  if (window.MinestRoutine) return;
  var KEY = 'liquid-routine.v1', AT = 'liquid-routine.savedAt', ov = null, booted = false, last = null;
  function get(k) { try { return localStorage.getItem(k); } catch (e) { return null; } }
  function put(k, v) { try { localStorage.setItem(k, v); } catch (e) {} }
  function dirty() { try { window.dispatchEvent(new Event('minest:cloud-dirty')); } catch (e) {} }   // Minest's cloud save picks it up
  var store = { get: function () { return get(KEY); }, set: function (raw) { if (raw === last) return; last = raw; put(KEY, raw); put(AT, String(Date.now())); dirty(); } };
  function boot() { if (booted) return; booted = true; var t = document.getElementById('mn-routine-src'), s = document.createElement('script'); s.textContent = t ? t.textContent : ''; document.body.appendChild(s); }
  function open() {
    boot(); if (!window.MinestRoutineApp) return;
    if (!ov) {
      ov = document.createElement('div'); ov.className = 'mn-routine'; ov.setAttribute('role', 'dialog'); ov.setAttribute('aria-label', 'Liquid Routine');
      // no button of Minest's own: the routine is full screen and its single ✕ (top right) leaves to Minest
      ov.innerHTML = '<div class="mn-routine-host"></div>';
      document.body.appendChild(ov);
      ['pointerdown', 'touchstart', 'wheel', 'keydown', 'click'].forEach(function (t) { ov.addEventListener(t, function (e) { e.stopPropagation(); }, { passive: true }); });   // Minest's own handlers stay out
    }
    ov.hidden = false; document.documentElement.classList.add('mn-routine-on'); last = get(KEY);
    MinestRoutineApp.mount(ov.querySelector('.mn-routine-host'), { store: store, onExit: close });
  }
  function close() { if (!ov || ov.hidden) return; try { MinestRoutineApp.unmount(); } catch (e) {} ov.hidden = true; document.documentElement.classList.remove('mn-routine-on'); }
  // ---- the cloud copy
  function rank(r) { return r ? ({ completed: 4, skipped: 3, running: 2, paused: 2, planned: 1 }[r.status] || 0) * 1e9 + (r.elapsed || 0) + (r.since ? 1 : 0) : -1; }
  function merge(local, lat, rem, rat) {
    if (!local || local.version !== 1) return rem; if (!rem || rem.version !== 1) return local;
    var newer = (rat || 0) > (lat || 0) ? rem : local, runs = {};
    [local.runs || {}, rem.runs || {}].forEach(function (R) { Object.keys(R).forEach(function (k) { var r = R[k]; if (r && typeof r.taskId === 'string' && typeof r.date === 'string' && Array.isArray(r.intervals) && rank(r) > rank(runs[k])) runs[k] = r; });   /* a malformed record never reaches the routine */ });
    var live = Object.keys(runs).filter(function (k) { return runs[k].since !== null; });
    if (live.length > 1) { var keep = live.filter(function (k) { return (newer.runs || {})[k] && newer.runs[k].since !== null; })[0] || live[0];   // one running timer: the newer side's
      live.forEach(function (k) { if (k !== keep) { var r = Object.assign({}, runs[k]); r.since = null; r.status = 'paused'; runs[k] = r; } }); }
    // the newer side's whole record (its tabs / routines and their modes ride along), with the merged runs
    return Object.assign({}, newer, { version: 1, tasks: newer.tasks, runs: runs, activeId: newer.activeId });
  }
  function cloud() { var raw = get(KEY); if (!raw) return null; try { return { v: 1, at: +get(AT) || 0, state: JSON.parse(raw) }; } catch (e) { return null; } }
  function mergeCloud(remote) {
    if (!remote || !remote.state) return; var raw = get(KEY), local = null; try { local = raw ? JSON.parse(raw) : null; } catch (e) {}
    var lat = +get(AT) || 0, merged = merge(local, lat, remote.state, remote.at), out = JSON.stringify(merged);
    if (out !== raw) {
      put(KEY, out); put(AT, String(Math.max(lat, remote.at || 0))); last = out;
      if (ov && !ov.hidden && window.MinestRoutineApp) { try { MinestRoutineApp.applyExternal(out); } catch (e) {} }
    }
    if (out !== JSON.stringify(remote.state)) dirty();   /* this device had something the cloud has not: send it back */
  }
  // ---- the ways in: an icon in the Dock (after Study Arcade) and a tab in the bottom tab bar
  var ICON = '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.8" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true"><path d="M12 3c3.5 4.2 6 7.3 6 10.4A6 6 0 0 1 6 13.4C6 10.3 8.5 7.2 12 3z"/><path d="M8.6 14.2c.9 1.5 2.2 2.3 3.9 2.3"/></svg>';
  function entries() {
    if (!document.getElementById('mn-routine-trigger')) {   // a hidden button the Dock presses (like My World's)
      var t = document.createElement('button'); t.type = 'button'; t.id = 'mn-routine-trigger'; t.title = 'Liquid Routine'; t.setAttribute('aria-label', 'Liquid Routine');
      t.style.display = 'none'; t.innerHTML = ICON; t.addEventListener('click', function () { if (ov && !ov.hidden) close(); else open(); }); document.body.appendChild(t);
    }
    var dock = document.querySelector('nav.ios-bottom-tab-bar');
    if (dock && !dock.querySelector('[data-routine-dock]')) {
      var b = document.createElement('button'); b.type = 'button'; b.className = 'ios-tab-item'; b.setAttribute('data-routine-dock', ''); b.title = 'Liquid Routine · 流体日程';
      b.innerHTML = '<span class="ios-tab-icon" aria-hidden="true">💧</span><span class="ios-tab-label">日程</span>'; b.onclick = open; dock.appendChild(b);
    }
  }
  var queued = false;
  new MutationObserver(function () { if (queued) return; queued = true; requestAnimationFrame(function () { queued = false; entries(); }); }).observe(document.body, { childList: true, subtree: true });
  entries();
  // 4.17.5 · in the iOS app Day Flow is the start screen: it opens once per launch (a reload keeps where you were);
  // its ✕ leaves to Minest. The web pages start in Minest as before.
  try {
    var mh = window.webkit && window.webkit.messageHandlers;
    if (mh && (mh.minestBridge || mh.minest) && !sessionStorage.getItem('mn-routine-home')) {
      sessionStorage.setItem('mn-routine-home', '1');
      var home = function () { setTimeout(function () { if (!ov || ov.hidden) open(); }, 250); };
      if (document.readyState === 'complete') home(); else window.addEventListener('load', home, { once: true });
    }
  } catch (e) {}
  window.MinestRoutine = { open: open, close: close, isOpen: function () { return !!(ov && !ov.hidden); }, _cloud: cloud, _mergeCloud: mergeCloud, _merge: merge, version: '4.17.7' };
})();
</script>
"""

EDITS = [
    ("    { k: 'arcade', m: /^Study Arcade/ },", "    { k: 'arcade', m: /^Study Arcade/ },\n    { k: 'routine', find: function () { return document.getElementById('mn-routine-trigger'); } },   /* Liquid Routine */"),
    # Minest's cloud sync carries the routine as routineGz (next to the CarPlay record)
    ("var know = null, gpt = null;", "var know = null, gpt = null, rtn = null;"),
    ("try { if (window.MinestGPTStudy && window.MinestGPTStudy._cloud) gpt = JSON.stringify(window.MinestGPTStudy._cloud()); } catch (e) {}   // 53.84: CarPlay study record",
     "try { if (window.MinestGPTStudy && window.MinestGPTStudy._cloud) gpt = JSON.stringify(window.MinestGPTStudy._cloud()); } catch (e) {}   // 53.84: CarPlay study record\n  try { if (window.MinestRoutine && window.MinestRoutine._cloud) { var rc = window.MinestRoutine._cloud(); if (rc) rtn = JSON.stringify(rc); } } catch (e) {}   // Liquid Routine"),
    ("Promise.all([minestGzipText(JSON.stringify(boards)), know ? minestGzipText(know) : null, gpt ? minestGzipText(gpt) : null])",
     "Promise.all([minestGzipText(JSON.stringify(boards)), know ? minestGzipText(know) : null, gpt ? minestGzipText(gpt) : null, rtn ? minestGzipText(rtn) : null])"),
    ("var total = g[0].length + (g[1] || '').length + (g[2] || '').length +", "var total = g[0].length + (g[1] || '').length + (g[2] || '').length + (g[3] || '').length +"),
    ("if (g[2]) base.gptstudyGz = g[2];", "if (g[2]) base.gptstudyGz = g[2]; if (g[3]) base.routineGz = g[3];"),
    ("if (data.gptstudyGz && window.MinestGPTStudy && window.MinestGPTStudy._mergeCloud) minestGunzipText(data.gptstudyGz).then(function(t) { window.MinestGPTStudy._mergeCloud(JSON.parse(t)); }).catch(function() {});",
     "if (data.gptstudyGz && window.MinestGPTStudy && window.MinestGPTStudy._mergeCloud) minestGunzipText(data.gptstudyGz).then(function(t) { window.MinestGPTStudy._mergeCloud(JSON.parse(t)); }).catch(function() {});\n  if (data.routineGz && window.MinestRoutine && window.MinestRoutine._mergeCloud) minestGunzipText(data.routineGz).then(function(t) { window.MinestRoutine._mergeCloud(JSON.parse(t)); }).catch(function() {});"),
]

SRC = '<script type="text/plain" id="mn-routine-src">\n' + BUNDLE + '\n</script>\n'
for f in FILES:
    p = ROOT / f
    s = p.read_text(encoding='utf-8')
    for pat in [r'<style id="mn-routine-style">.*?</style>\n', r'<script type="text/plain" id="mn-routine-src">.*?</script>\n', r'<script id="mn-routine-run">.*?</script>\n']:
        s = re.sub(pat, '', s, flags=re.S)
    s = s.replace('</head>', CSS + '</head>', 1)
    i = s.rindex('</body>'); s = s[:i] + SRC + RUN + s[i:]
    for a, b in EDITS:
        if b in s: continue
        assert s.count(a) == 1, (f, a[:60])
        s = s.replace(a, b)
    p.write_text(s, encoding='utf-8')
    print('patched', f)

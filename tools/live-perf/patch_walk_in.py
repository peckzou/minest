"""Walk in 2.0 (My World 🚶 first person, the Minecraft way): go into buildings and walk their rooms, sit on sofas /
chairs / benches, sleep in beds, people and animals that wander — tap to talk / pet. walk_in.js goes inside wkStart;
walk_in.css (+ world_wx.css) into <style id="mn-walkin-style">, world_wx.js (Minest Weather) as <script id="mn-wx-script">. Patched in place in every copy; safe to re-run (walk_in.js / .css are
replaced with their current text)."""
import re
from pathlib import Path

HERE = Path(__file__).resolve().parent
ROOT = HERE.parents[1]
FILES = ['iPhone53.8241.html', 'iphone.html', 'index.html', 'ipad.html', 'iPhoneDuo.html', 'ios/Minest/Minest/iphone.html',
         'ios/Minest/Minest/iphone18.0.html', 'ios/Minest/Minest/ipad.html', 'ios/MinestProject/MyApp/iphone.html']
JS = (HERE / 'walk_in.js').read_text(encoding='utf-8')
CSS = '<style id="mn-walkin-style">\n' + (HERE / 'walk_in.css').read_text(encoding='utf-8') + (HERE / 'world_wx.css').read_text(encoding='utf-8') + '</style>\n'
WX = '<script id="mn-wx-script">\n' + (HERE / 'world_wx.js').read_text(encoding='utf-8') + '</script>\n'   # Minest Weather (world_wx.js): its own script
START, END = '    /* ── Walk in 2.0 (patch_walk_in.py)', '    })();\n'

EDITS = [
    ("var WK = null;", "var WK = null, WKS = null, WKIN = null, WKNS = false;   // Walk in 2.0: where to stand next, the building you are in, no-collision build"),
    ("function solid(x0, x1, z0, z1, y0, y1) { var i = solids.length;", "function solid(x0, x1, z0, z1, y0, y1) { if (WKNS) return; var i = solids.length;"),
    ("} catch (e) { return; }   // birds and butterflies up in the air", "} catch (e) { return; } if (WKX.isMob(p)) { WKX.mob(p, b); return; }   // birds and butterflies up in the air; people and animals walk about"),
    ("      addPick(p, ext);\n    });", "      addPick(p, ext); WKX.note(p, ext);\n    });"),
    ("me.y = floorAt(me.x, me.z, 50); if (me.y < -1) me.y = 0;", "me.y = floorAt(me.x, me.z, 50); if (me.y < -1) me.y = 0;\n    if (WKS) { me.x = WKS.x; me.z = WKS.z; me.yaw = WKS.yaw; me.y = Math.max(0, floorAt(me.x, me.z, 50)); WKS = null; } WKX.spawn();"),
    ("e.stopPropagation(); var b = e.target.closest('[data-wk]');", "e.stopPropagation(); if (e.target.closest('.wk-x')) return; var b = e.target.closest('[data-wk]');"),
    ("if (!p) return; var ref = sdRef(p) || ((p.it || []).filter(thing)[0]); if (ref ||", "if (!p) return; if (WKX.tap(p)) return; var ref = sdRef(p) || ((p.it || []).filter(thing)[0]); if (ref ||"),
    ("if (p) lab.textContent = (t ? t.s.title", "if (p) lab.textContent = WKX.label(p) || (t ? t.s.title"),
    ("      R.render(S, cam);\n    }\n    size(); addEventListener('resize', size);", "      WKX.tick(dt, now);\n      R.render(S, cam);\n    }\n    size(); addEventListener('resize', size);"),
    ("WK = { ov: ov, stop: function () { cancelAnimationFrame(raf);", "WK = { ov: ov, stop: function () { cancelAnimationFrame(raf); WKX.stop();"),
    ("if (!room) for (var ci = 0; ci < 9; ci++) { var cg = new T.BoxGeometry(6 + (ci % 3) * 3, 1, 3 + (ci % 2) * 2), cm = new T.MeshBasicMaterial({ color: 0xffffff, transparent: true, opacity: .85 }), cl = new T.Mesh(cg, cm); cl.position.set(lb.x0 - 30 + (ci * 37) % 90, 22 + (ci % 3) * 3, lb.y0 - 30 + (ci * 53) % 90); S.add(cl); disp.push(cg, cm); }   // a few blocky clouds",
     "/* the clouds: walk_in.js makeClouds() (blocky clusters, high, tinted by the weather) */"),
    ("  function wkClose() {", "  var WKVIEW = false;   // 阅览 View: the walk's 3D island as a slow orbit, full screen, no tools (patch_walk_in.py)\n  function wkView() { if (WK || !V) return; WKVIEW = true; document.documentElement.classList.add('mn-wview'); wkOpen(); setTimeout(function () { if (!WK && WKVIEW) { WKVIEW = false; document.documentElement.classList.remove('mn-wview'); } }, 9000); }\n  function wkClose() {"),
    ("w.stop(); if (WKIN && V) {", "w.stop(); WKVIEW = false; document.documentElement.classList.remove('mn-wview'); if (WKIN && V) {"),
    ("ov.className = 'mn-walk'; el.appendChild(ov);", "ov.className = 'mn-walk' + (WKVIEW ? ' wk-view' : ''); el.appendChild(ov);"),
    ("function wkClose() { if (!WK) return; var w = WK; WK = null; w.stop();", "function wkClose() { if (!WK) return; var w = WK; WK = null; w.stop(); if (WKIN && V) { V.d = V.root || V.d; V.root = null; V.at = null; refreshLand(); WKIN = null; }"),
]
ANCHOR = "    // ---- the ground: the island's plots"

for f in FILES:
    p = ROOT / f
    s = p.read_text(encoding='utf-8')
    i = s.find(START)
    if i >= 0:
        j = s.index(END, s.index('    var WKX = (function () {', i)) + len(END)   # the IIFE's last line
        s = s[:i] + s[j:]
    assert s.count(ANCHOR) == 1, (f, 'anchor')
    s = s.replace(ANCHOR, JS + ANCHOR)
    for a, b in EDITS:
        if b in s: continue
        assert s.count(a) == 1, (f, a[:60])
        s = s.replace(a, b)
    s = re.sub(r'<style id="mn-walkin-style">.*?</style>\n', '', s, flags=re.S)
    s = s.replace('</head>', CSS + '</head>', 1)
    s = re.sub(r'<script id="mn-wx-script">.*?</script>\n', '', s, flags=re.S)
    i = s.rindex('</body>'); s = s[:i] + WX + s[i:]
    p.write_text(s, encoding='utf-8')
    print('patched', f)

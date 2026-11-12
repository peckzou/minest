#!/usr/bin/env python3
"""Copilot's 2026-11-12 changes, which were made straight in index.html of an old checkout, into every page of main.

    python3 tools/copilot/patch_copilot_1112.py           # apply (idempotent)
    python3 tools/copilot/patch_copilot_1112.py --check   # only say what would happen

It reads the hunks of tools/copilot/index-1112.diff (git diff -U3 of that index.html) and applies the ones that are
not the Typing Worlds embed: old text (context + removed lines) → new text (context + added lines), exactly once per
page; a page where a hunk does not match once is reported and left alone for that hunk.
  · 3D Display (My World capture, '◇ 3D'): opens voxel-factory/ with this world's things. Changed from the diff: the
    items go in the address (?kit=voxel-foundry&items=…) so it also works from the iOS bundle, which opens the live page.
  · Hot-air balloon look: envelope with gores and a crown, a basket with a burner, the 'balloons' display theme.
The 3D Display part is also in its source, tools/knowledge/capture.js. The balloon look lives only in the pages
(its module has no source file in the repo)."""
import re, sys
from pathlib import Path
ROOT = Path(__file__).resolve().parents[2]
PAGES = ['iPhoneDuo.html', 'iPhoneDuo69.html', 'iphone.html', 'iPhone53.8241.html', 'index.html', 'ipad.html',
         'ios/Minest/Minest/iPhoneDuo.html', 'ios/Minest/Minest/index.html', 'ios/Minest/Minest/ipad.html',
         'ios/Minest/Minest/iphone.html', 'ios/Minest/Minest/iphone18.0.html', 'ios/MinestProject/MyApp/iphone.html']
OPEN3D_OLD = """    try { localStorage.setItem('minest3d.handoff', JSON.stringify({ kit: 'voxel-foundry', items: items })); } catch (e) { return toast('Could not open 3D Display.'); }
    var f = document.createElement('div'); f.style.cssText = 'position:fixed;inset:0;z-index:2147483000;background:#cfe6f5';
    f.innerHTML = '<iframe src="voxel-factory/index.html" style="border:0;width:100%;height:100%" title="3D Display"></iframe>"""
OPEN3D_NEW = """    var base = /^https?:$/.test(location.protocol) ? 'voxel-factory/index.html' : 'https://minest-app.vercel.app/voxel-factory/index.html';   // the iOS bundle: the live page
    var src = base + '?kit=voxel-foundry&items=' + encodeURIComponent(items.join('\\n'));
    var f = document.createElement('div'); f.style.cssText = 'position:fixed;inset:0;z-index:2147483000;background:#cfe6f5';
    f.innerHTML = '<iframe src="' + src + '" style="border:0;width:100%;height:100%" title="3D Display"></iframe>"""


def hunks():
    d = (ROOT / 'tools/copilot/index-1112.diff').read_text(encoding='utf-8')
    out = []
    for h in re.split(r'\n(?=@@ )', d)[1:]:
        lines = h.split('\n')[1:]
        if any('typingworlds' in l or 'TypingWorlds' in l for l in lines): continue          # the Typing Worlds embed: not taken
        old = '\n'.join(l[1:] for l in lines if l[:1] in (' ', '-'))
        new = '\n'.join(l[1:] for l in lines if l[:1] in (' ', '+'))
        new = new.replace(OPEN3D_OLD, OPEN3D_NEW)
        out.append((old, new))
    return out


ENTRIES = [('mn-voxel-factory', 'tools/copilot/voxel-factory-entry.js'),   # 3D Display
           ('mn-typing-worlds-app', 'tools/copilot/typing-worlds-entry.js')]  # Typing Worlds (22 worlds + Word List)
def entry(s):
    """each entry module as one block before </body>, replaced when it is already there"""
    changed = False
    for sid, f in ENTRIES:
        code = (ROOT / f).read_text(encoding='utf-8'); assert '</script' not in code
        op = '<script id="%s">\n' % sid; blk = op + code + '</script>\n'; i = s.find(op)
        if i >= 0:
            j = s.index('</script>', i) + len('</script>\n')
            if s[i:j] != blk: s = s[:i] + blk + s[j:]; changed = True
        else:
            k = s.rindex('</body>'); s = s[:k] + blk + s[k:]; changed = True
    return s, changed


def main():
    check = '--check' in sys.argv
    H = hunks()
    for f in PAGES:
        p = ROOT / f
        if not p.exists(): print('  missing', f); continue
        s = p.read_text(encoding='utf-8'); done = skip = have = 0
        for old, new in H:
            if s.count(new) >= 1 and new != old: have += 1; continue
            if s.count(old) != 1: skip += 1; continue
            s = s.replace(old, new); done += 1
        s, vf = entry(s)
        if (done or vf) and not check: p.write_text(s, encoding='utf-8')
        print('  %-40s applied %d · already %d · not matching %d' % (f, done, have, skip))


if __name__ == '__main__':
    main()

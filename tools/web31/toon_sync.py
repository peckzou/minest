#!/usr/bin/env python3
"""web31.1.html / web31.1.play.html (Codex's pages, /play): the Arcade's canvas-game hooks (build.py: toon_patches)
and tools/web31/arcade-toon.js, kept in step with web31.0. Safe to run again: the script block is replaced."""
import importlib.util, os, re
HERE = os.path.dirname(os.path.abspath(__file__))
REPO = os.path.dirname(os.path.dirname(HERE))
spec = importlib.util.spec_from_file_location('web31_build', os.path.join(HERE, 'build.py'))
web31 = importlib.util.module_from_spec(spec); spec.loader.exec_module(web31)
js = open(os.path.join(HERE, 'arcade-toon.js'), encoding='utf-8').read()
block = '<script id="mn-arcade-toon-js">\n' + js + '\n</script>\n'
for f in ('web31.1.html', 'web31.1.play.html'):
    p = os.path.join(REPO, f); s = open(p, encoding='utf-8').read()
    s = web31.toon_patches(s)
    s = re.sub(r'<script id="mn-arcade-toon-js">.*?</script>\n', '', s, flags=re.S)
    tail = s.rindex('</body>'); s = s[:tail] + block + s[tail:]
    open(p, 'w', encoding='utf-8').write(s)
    print(f, 'ok')

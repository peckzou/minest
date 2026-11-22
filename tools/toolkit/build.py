#!/usr/bin/env python3
"""Cognitive Toolkit → one self-contained page, toolkit.html at the repo root (next to iphone.html), so the Minest app
can open it in a frame both on the web and inside the iOS bundle (no fetches: CSS, JS and every JSON it needs are
inlined as window.__TK_DATA). Source of truth stays tools/toolkit/index.html + its files."""
import json, os, re, glob
HERE = os.path.dirname(os.path.abspath(__file__)); REPO = os.path.dirname(os.path.dirname(HERE))

def read(rel):
    return open(os.path.normpath(os.path.join(HERE, rel)), encoding='utf-8').read()

def data():
    urls = ['../compass/taxonomy.json', '../compass/frameworks-ext.json', 'data/templates.json', 'data/seeds.json', 'data/models.json',
            '../compass/micro/kant-causality.json', 'labs/locke-room.json', 'labs/plato-cave.json', 'labs/aristotle-causes.json', 'labs/hegel-concept.json', 'i18n/zh.json']
    urls += ['../knowledge/frameworks/%s.json' % c for c in ('philosophy', 'knowledge', 'nature', 'psychology', 'society', 'systems', 'life')]
    return {u: json.loads(read(u)) for u in urls}

def build():
    page = read('index.html')
    page = re.sub(r'<link rel="stylesheet" href="([^"?]+)(\?[^"]*)?">', lambda m: '<style>\n' + read(m.group(1)) + '\n</style>', page)
    def js(m):
        return '<script>\n' + read(m.group(1)).replace('</script', '<\\/script') + '\n</script>'
    page = re.sub(r'<script src="([^"?]+)(\?[^"]*)?"></script>', js, page)
    blob = json.dumps(data(), ensure_ascii=False, separators=(',', ':')).replace('</', '<\\/')
    page = page.replace('<body class="tk">', '<body class="tk">\n<script>window.__TK_DATA = ' + blob + ';</script>', 1)
    assert 'src="' not in re.sub(r'<script>[\s\S]*?</script>', '', page), 'an external script is left'
    for out in (os.path.join(REPO, 'toolkit.html'), os.path.join(REPO, 'ios', 'Minest', 'Minest', 'toolkit.html')):   # web root + the iOS bundle
        open(out, 'w', encoding='utf-8').write(page)
    print('toolkit.html', round(len(page.encode('utf-8')) / 1024), 'KB')

if __name__ == '__main__':
    build()

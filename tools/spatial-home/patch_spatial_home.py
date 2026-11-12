#!/usr/bin/env python3
"""Minest · Spatial Home V1.0 into the Duo pages.

    python3 tools/spatial-home/patch_spatial_home.py            # patch index.html, then copy it to its mirrors
    python3 tools/spatial-home/patch_spatial_home.py --check    # only say what state the pages are in
    python3 tools/spatial-home/patch_spatial_home.py --remove   # take the blocks out again (and copy to the mirrors)
    python3 tools/spatial-home/patch_spatial_home.py --pages main --boot-default off
        # the main line: its pages are different variants, not mirrors — each one is patched on its own
        # (the same list tools/hermes/patch_hermes.py patches); the room does not open at start unless the user asks

What it does to index.html (the same convention as tools/santorini-69/patch_displays70.py, so either can run after
the other without undoing it):
1. puts spatial-home/home.css in as <style id="mn-spatial-home-css"> and spatial-home/js/{voxel,room,env-manhattan,env-alpine,env-train,objects,entries,backpack,bridge,app}.js
   in as one <script id="mn-spatial-home"> just before </body> (replaced when already there);
2. the script sets window.__SPATIAL_HOME_EMBEDDED__ first: the room then runs inside this page (no second copy of
   the app), is built only when first opened, adds a 🏛 房间 item to the Dock, and opens at start only when the user
   ticked "打开 Minest 时先进入这间房间" (or the address has ?home=1);
3. copies index.html over the mirrors that were byte-identical to it before the patch (the Duo pages and the iOS
   bundle). A mirror that differs is reported and left alone.
Nothing else in the page is changed."""
import hashlib, sys
from pathlib import Path

ROOT = Path(__file__).resolve().parents[2]
PAGE = ROOT / 'index.html'
MIRRORS = ['iPhoneDuo.html', 'iPhoneDuo69.html', 'iphone.html', 'ios/Minest/Minest/iPhoneDuo.html',
           'ios/Minest/Minest/index.html', 'ios/Minest/Minest/ipad.html', 'ios/Minest/Minest/iphone.html',
           'ios/Minest/Minest/iphone18.0.html']
# main: different pages, each patched by itself (as tools/hermes/patch_hermes.py does)
MAIN_PAGES = ['iPhoneDuo.html', 'iPhoneDuo69.html', 'iphone.html', 'iPhone53.8241.html', 'index.html', 'ipad.html',
              'ios/Minest/Minest/iPhoneDuo.html', 'ios/Minest/Minest/index.html', 'ios/Minest/Minest/ipad.html',
              'ios/Minest/Minest/iphone.html', 'ios/Minest/Minest/iphone18.0.html', 'ios/MinestProject/MyApp/iphone.html']
SRC = ROOT / 'spatial-home'
JS = ['voxel.js', 'room.js', 'env-manhattan.js', 'env-alpine.js', 'env-train.js', 'objects.js', 'entries.js', 'backpack.js', 'bridge.js', 'app.js']
CSS_OPEN, JS_OPEN = '<style id="mn-spatial-home-css">\n', '<script id="mn-spatial-home">\n'


def md5(b): return hashlib.md5(b).hexdigest()


def cut(s, opener, closer):
    """remove the block that starts with opener (and the newline after it); returns (s, found)"""
    i = s.find(opener)
    if i < 0: return s, False
    j = s.index(closer, i) + len(closer)
    if s[j:j + 1] == '\n': j += 1
    return s[:i] + s[j:], True


def blocks(boot_default=None):
    css = (SRC / 'home.css').read_text(encoding='utf-8')
    js = '\n'.join((SRC / 'js' / f).read_text(encoding='utf-8') for f in JS)
    for bad in ('</script', '</style'):
        assert bad not in js.lower() and bad not in css.lower(), 'a closing tag inside the code would end the block early'
    return (CSS_OPEN + css + '</style>\n' +
            JS_OPEN + 'window.__SPATIAL_HOME_EMBEDDED__ = true;\n' +
            ('' if boot_default is None else 'window.__SPATIAL_HOME_BOOT_DEFAULT__ = %s;\n' % ('true' if boot_default else 'false')) +
            js + '\n</script>\n')


def opt(args, name):
    return args[args.index(name) + 1] if name in args and args.index(name) + 1 < len(args) else None


def patched(s, remove, boot_default):
    s, _ = cut(s, CSS_OPEN, '</style>')
    s, _ = cut(s, JS_OPEN, '</script>')
    if not remove:
        k = s.rindex('</body>')
        s = s[:k] + blocks(boot_default) + s[k:]
    return s


def main():
    args = sys.argv[1:]
    remove = '--remove' in args
    bd = opt(args, '--boot-default'); boot_default = None if bd is None else bd == 'on'
    if opt(args, '--pages') == 'main':
        for f in MAIN_PAGES:
            p = ROOT / f
            if not p.exists(): print('  missing (skipped):', f); continue
            raw = p.read_bytes(); s = raw.decode('utf-8')
            if '--check' in args:
                print('%-40s %s' % (f, 'in' if JS_OPEN in s else 'not in')); continue
            out = patched(s, remove, boot_default).encode('utf-8')
            if out == raw: print('  up to date:', f); continue
            p.write_bytes(out); print('  patched:', f, len(out))
        return
    raw = PAGE.read_bytes(); before = md5(raw); s = raw.decode('utf-8')
    same = [m for m in MIRRORS if (ROOT / m).exists() and md5((ROOT / m).read_bytes()) == before]
    differ = [m for m in MIRRORS if m not in same]
    has = CSS_OPEN in s, JS_OPEN in s
    if '--check' in args:
        print('index.html: Spatial Home css %s, script %s' % ('in' if has[0] else 'not in', 'in' if has[1] else 'not in'))
        print('mirrors identical to index.html:', len(same), '/', len(MIRRORS))
        for m in differ: print('  differs:', m)
        return
    out = patched(s, remove, boot_default).encode('utf-8')
    if md5(out) == before:
        print('index.html already up to date'); return
    PAGE.write_bytes(out)
    for m in same: (ROOT / m).write_bytes(out)
    print('index.html %s Spatial Home (%d bytes); copied to %d mirrors' % ('without' if remove else 'with', len(out), len(same)))
    for m in differ: print('  left alone (it differed from index.html before):', m)


if __name__ == '__main__':
    main()

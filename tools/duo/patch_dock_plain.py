#!/usr/bin/env python3
"""Duo: the Minest Dock without the macOS swell and without pick-first — one tap opens an icon.
- iPhoneDuo.html (the Duo web page): the dock is plain outright.
- the iPhone pages the app bundles (iphone18.0.html is what the iOS app loads): plain at run time whenever the page
  marks itself as running on the Duo (html.duo-inner / html.duo-outer); other iPhones keep the swell.
Idempotent."""
import pathlib
ROOT = pathlib.Path(__file__).resolve().parents[2]
HEAD = "  function attach(box, o) {\n    ensureCss();\n    o = o || {};\n"
OUTRIGHT = ["iPhoneDuo.html", "ios/Minest/Minest/iPhoneDuo.html"]
RUNTIME = ["ios/Minest/Minest/iphone18.0.html", "ios/Minest/Minest/iphone.html", "iphone.html", "ios/MinestProject/MyApp/iphone.html"]
MARK = "/* duo-dock-plain */"
RMARK = "/* duo-dock-plain-runtime */"
EDITS = [
    (HEAD, HEAD + "    " + RMARK + " var duoPlain = function () { var c = document.documentElement.classList; return c.contains('duo-inner') || c.contains('duo-outer'); };\n"),
    # no swell on the Duo
    ("    function apply() {\n      raf = 0; sizes();\n", "    function apply() {\n      raf = 0; sizes();\n      if (duoPlain()) pos = null;\n"),
    # a tap goes straight through (no pick first)
    ("      bx.addEventListener('touchend', function (e) {\n        var s = scrub; scrub = null;\n        if (!s) return;\n",
     "      bx.addEventListener('touchend', function (e) {\n        var s = scrub; scrub = null;\n        if (!s) return;\n        if (duoPlain()) { leave(); return; }\n"),
    ("        if (!e.isTrusted || e.detail === 0) return;   // keyboard / scripted clicks open at once\n",
     "        if (!e.isTrusted || e.detail === 0) return;   // keyboard / scripted clicks open at once\n        if (duoPlain()) return;\n"),
]
for rel in OUTRIGHT:
    p = ROOT / rel
    if not p.exists(): continue
    s = p.read_text(encoding="utf-8")
    if MARK in s: print("already", rel); continue
    assert s.count(HEAD) == 1, rel
    p.write_text(s.replace(HEAD, HEAD + "    " + MARK + " return { refresh: function () {}, leave: function () {} };   // Duo: no swell, a tap opens at once\n"), encoding="utf-8")
    print("patched", rel)
for rel in RUNTIME:
    p = ROOT / rel
    if not p.exists(): continue
    s = p.read_text(encoding="utf-8")
    if RMARK in s: print("already", rel); continue
    if s.count(HEAD) != 1: print("no dock in", rel); continue
    for a, b in EDITS:
        assert s.count(a) == 1, (rel, a[:50])
        s = s.replace(a, b)
    p.write_text(s, encoding="utf-8")
    print("patched (runtime)", rel)

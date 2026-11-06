#!/usr/bin/env python3
"""Duo: the Minest Dock without the macOS swell (and without pick-first): one tap opens an icon.
Idempotent; patches the Duo pages only."""
import pathlib
ROOT = pathlib.Path(__file__).resolve().parents[2]
PAGES = ["iPhoneDuo.html", "ios/Minest/Minest/iPhoneDuo.html"]
OLD = "  function attach(box, o) {\n    ensureCss();\n    o = o || {};\n"
MARK = "/* duo-dock-plain */"
NEW = OLD + "    " + MARK + " return { refresh: function () {}, leave: function () {} };   // Duo: no swell, a tap opens at once\n"
for rel in PAGES:
    p = ROOT / rel
    if not p.exists():
        continue
    s = p.read_text(encoding="utf-8")
    if MARK in s:
        print("already", rel); continue
    assert s.count(OLD) == 1, rel
    p.write_text(s.replace(OLD, NEW), encoding="utf-8")
    print("patched", rel)

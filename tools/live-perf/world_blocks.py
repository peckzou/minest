"""The My World blocks that live inside the display script, in order, between "53.83 · Reorganize" and
window.MinestDisplay: world_reorg.js (🔀 Reorganize, House Sample) · world_land.js (⛰ lit in land mode) ·
world_lib4.js (Studio library 4 on the island) · world_smart.js (✨ Smart build) · world_duo.js (iPhone Fold: camera on fold, Kanban × Island). Every patch that changes one of them
calls assemble(), which writes all four again from their files — so re-running one never drops another."""
from pathlib import Path
HERE = Path(__file__).resolve().parent
PARTS = ['world_reorg.js', 'world_land.js', 'world_lib4.js', 'world_smart.js', 'world_duo.js']
A, B = '  /* ── 53.83 · Reorganize (step', '  window.MinestDisplay = {'
def assemble(s):
    body = ''.join((HERE / f).read_text(encoding='utf-8') for f in PARTS if (HERE / f).exists())
    assert '</script' not in body
    if A in s:
        i = s.index(A); j = s.index(B, i); return s[:i] + body + s[j:]
    assert s.count(B) == 1; return s.replace(B, body + B)

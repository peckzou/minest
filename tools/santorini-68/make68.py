"""Build iPhoneDuo68.html from the 63 + 64 + 65 + 66 stack (b68/s3.html): Santorini integration step 1 -
the Minecraft-style block tools (place / break / pick) are removed from the user interface.
The base iPhoneDuo.html is never written. Existing saved block edits (d.vox.edits) are still re-applied; only NEW per-block edits are gone."""
import sys
from pathlib import Path
src = Path(sys.argv[1]); out = Path(sys.argv[2])
s = src.read_text(encoding='utf-8')

def sub(a, b, n=1, first=False):
    global s
    c = s.count(a)
    assert c >= 1 and (first or c == n), (a[:70], c)
    s = s.replace(a, b, 1) if first else s.replace(a, b)

# --- Santorini (Oia) engine: it comes before the Alpine engine in the page, so first=True hits only Oia ---
sub("  function breakBlock() {\n    if (!target || target.y < 1) return;", "  function breakBlock() {   /* 68: no per-block tools in My World */\n    return;\n    if (!target || target.y < 1) return;", first=True)
sub("  function placeBlock() {\n    if (!target) return;", "  function placeBlock() {   /* 68 */\n    return;\n    if (!target) return;", first=True)
sub("  function pickBlock() {\n    if (!target) return;", "  function pickBlock() {   /* 68 */\n    return;\n    if (!target) return;", first=True)
sub("$('held').style.display = (m === 'walk' || m === 'fly') ? 'flex' : 'none';", "$('held').style.display = 'none';   /* 68: no held-block HUD */", first=True)
sub("if (e.code === 'KeyQ') cycleHeld(-1);\n    if (e.code === 'KeyE') cycleHeld(1);", "/* 68: Q/E block cycling removed */", first=True)
sub("(e) => { if (S.locked && (S.mode === 'walk' || S.mode === 'fly')) cycleHeld(e.deltaY > 0 ? 1 : -1); }", "(e) => { /* 68: wheel block cycling removed */ }", first=True)

# --- generic voxel layer 62: no ⛏ / 🧱 tools ---
sub("['build', '⛏', '方块'], ", "")
sub("  function setTool(t) {\n", "  function setTool(t) {\n    if (t === 'break' || t === 'place') t = 'look';   /* 68: no per-block tools */\n")
sub("if (e.code === 'KeyQ') setTool(R.tool === 'break' ? 'place' : 'break');", "/* 68: Q block tool removed */")
sub("<button data-t=\"break\">⛏ 挖掉</button><button data-t=\"place\">🧱 放方块</button><span class=\"lab\">点方块 · 1-9 选方块</span>", "<span class=\"lab\">整栋建筑、树木和家具请用 🧩 摆放 / 🏠 房间</span>")
out.write_text(s, encoding='utf-8')
print(out.name, len(s.encode()), 'bytes')

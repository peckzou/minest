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

# --- 3D walk: live sync with the board / console, and the anchor adapter (stable ids, room-local coordinates) ---
sub("    window.__oiaBind = function () { MinestOia.bind({",
 r"""    window.__mnSig = function () {   /* 68: what the 3D room shows, as one string: pieces, places, things, their titles and pictures */
      if (!V || !V.d) return ''; try { index(); } catch (e) {} var s = [];
      (V.d.pc || []).forEach(function (p) { s.push(p.id, p.k, p.x, p.y, p.f, p.s, p.wf || '', (p.it || []).map(function (r) { var t = thing(r); return r + ':' + (t ? t.s.title + ':' + ((t.s.cover && t.s.cover.value) || '') : '-'); }).join('|')); });
      s.push(V.d.floor, V.d.wall, V.d.ground); return s.join(',');
    };
    window.__mnAnchors = function () {   /* 68: where everything in the open room is, by stable ids and room-local coordinates (read only) */
      if (!V || !V.at || !V.at.room) return null;
      var R = V.root || V.d, bp = (R.pc || []).filter(function (q) { return q.id === V.at.pc; })[0], rm = bp && (bp.rooms || []).filter(function (q) { return q.id === V.at.room; })[0], d = V.d, lb = lbox();
      var out = { building: bp ? { id: bp.vox || null, piece: bp.id, label: bp.label || null } : null, room: rm ? { id: rm.id, kind: rm.k, name: rm.n } : null, bounds: { x0: lb.x0, y0: lb.y0, x1: lb.x1, y1: lb.y1 }, displays: [], problems: [] };
      try { index(); } catch (e) {}
      (d.pc || []).forEach(function (p) {
        if (!BUILD[p.k]) return; var its = (p.it || []).filter(thing), b = null; try { b = build(p, its, 0); } catch (e) { return; }
        var dm = dims(p), slots = [], r2 = function (v) { return Math.round(v * 100) / 100; };
        b.parts.forEach(function (q) {
          if (q.o && q.o.slot) slots.push({ x: r2(q.x0 != null ? (q.x0 + q.x1) / 2 : q.u), y: r2(q.y0 != null ? (q.y0 + q.y1) / 2 : q.tt), z: r2(q.z0 != null ? (q.z0 + q.z1) / 2 : q.z || 0), ref: (q.o && q.o.ref) || q.ref || null });
        });
        out.displays.push({ id: p.id, kind: p.k, local: { x: p.x, y: p.y, rot: (p.f || 0) * 90, size: p.s || 1, w: dm.W, d: dm.D }, capacity: dm.slots, items: (p.it || []).slice(), slots: slots });
        if (!K[p.k] || !K[p.k].decor) { if (p.x - dm.W / 2 < lb.x0 - .01 || p.y - dm.D / 2 < lb.y0 - .01 || p.x + dm.W / 2 > lb.x1 + .5 || p.y + dm.D / 2 > lb.y1 + .5) out.problems.push('out of bounds: ' + p.id); }
      });
      var A = out.displays; for (var i = 0; i < A.length; i++) for (var j = i + 1; j < A.length; j++) { var a = A[i].local, c = A[j].local, ka = K[A[i].kind], kc = K[A[j].kind]; if ((ka && ka.decor) || (kc && kc.decor)) continue; if (a.x - a.w / 2 < c.x + c.w / 2 - .05 && c.x - c.w / 2 < a.x + a.w / 2 - .05 && a.y - a.d / 2 < c.y + c.d / 2 - .05 && c.y - c.d / 2 < a.y + a.d / 2 - .05) out.problems.push('overlap: ' + A[i].id + ' / ' + A[j].id); }
      return out;
    };
    window.__oiaBind = function () { MinestOia.bind({""")
sub("    function frame(now) {\n      raf = requestAnimationFrame(frame);",
 "    var syncT = 0, syncSig = window.__mnSig ? window.__mnSig() : null;   /* 68: the room follows the board */\n    function frame(now) {\n      raf = requestAnimationFrame(frame);")
sub("      WKX.tick(dt, now);\n      R.render(S, cam);",
 "      WKX.tick(dt, now);\n      if (now - syncT > 1000) { syncT = now; var sg = window.__mnSig ? window.__mnSig() : null; if (sg !== syncSig && syncSig !== null && !document.querySelector('.mn-pv')) { WKX.reload({ x: me.x, z: me.z, yaw: me.yaw }); return; } if (syncSig === null) syncSig = sg; }\n      R.render(S, cam);")

sub("        spawn: function () { ui(); },", "        spawn: function () { ui(); },\n        reload: function (sp) { restart(sp); },   /* 68 */")

sub("    raf = requestAnimationFrame(frame); hap('success');\n  }\n  var WKVIEW = false;", "    raf = requestAnimationFrame(frame); hap('success');\n    window.__mnWalk = { me: me, cam: cam, scene: S, renderer: R, picks: picks };   /* 68: read access for tests and the anchor tools */\n  }\n  var WKVIEW = false;")

# --- whole-building editing: My World hands the Oia layer its island's building record, and the layer is added as the last script ---
sub("      label: function (bid) { if (!V) return null; var p = (islandD().pc || []).filter(function (q) { return q.vox === bid; })[0]; return p && p.label; },",
    "      bld: function () { var R = V && (V.root || V.d); return (R && R.vox && R.vox.bld) || null; },   /* 68: whole-building edits of this island */\n"
    "      bldSet: function (fn) { if (!V) return; var R = islandD(); R.vox = R.vox || { edits: [] }; R.vox.bld = R.vox.bld || { m: {}, a: [], n: 0 }; fn(R.vox.bld); clearTimeout(W.voxT); W.voxT = setTimeout(function () { save(); }, 400); },\n"
    "      label: function (bid) { if (!V) return null; var p = (islandD().pc || []).filter(function (q) { return q.vox === bid; })[0]; return p && p.label; },")
js = (Path(__file__).resolve().parent / 'oiabld68.js').read_text(encoding='utf-8')
assert '</script' not in js.lower()
assert s.count('</body>') == 1
s = s.replace('</body>', '<script id="mn-oia-bld-68">\n' + js + '\n</script>\n</body>')
out.write_text(s, encoding='utf-8')
print(out.name, len(s.encode()), 'bytes')

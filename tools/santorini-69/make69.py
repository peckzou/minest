#!/usr/bin/env python3
"""Build iPhoneDuo69.html from iPhoneDuo68.html:
Minest My World Santorini 3D Deep Integration — Version 69.4:
1. Complete removal of Minecraft per-block tools across all voxel engines:
   - No breakBlock, placeBlock, pickBlock
   - No single-block 1x1x1 raycast outline
   - No Q/E hotbar cycling, no held block HUD
2. Full Human Interaction & Drag-to-Look (No pointer lock required!):
   - Immediate 'walk' mode (no auto-flying tour blocking user control)
   - Left click / touch tap dispatches to Whole Building / Element / 3D Display selection
   - Mouse / Trackpad drag smoothly rotates camera look (like Google Earth / Three.js Orbit)
   - On-screen navigation controls (Virtual Joystick, D-Pad, Jump, Fly) always visible & clickable
3. Whole-Building, Element, and 3D Voxel Display System (oiabld69.js):
   - 3D Art Easels, Bookshelves, Glass Showcases, Whitewashed Art Walls rendered in Santorini scene
   - Real Minest board cards from board-ec6-art印制在 3D 画布上
   - Click display -> view original card details modal -> cycle cards -> move/rotate/delete
   - Level 3 Doorhouse (Dollhouse) architectural section with 2 floors & rooms
   - Level 4 Room & Level 5 Display anchors & Level 6 3D Room Walk
   - Doorstep return pill (回到门口) returns to doorstep
4. Prominent floating 3D Santorini entry button.
"""
import sys
from pathlib import Path

src_path = Path(sys.argv[1]) if len(sys.argv) > 1 else Path("iPhoneDuo68.html")
out_path = Path(sys.argv[2]) if len(sys.argv) > 2 else Path("iPhoneDuo69.html")

s = src_path.read_text(encoding="utf-8")

def sub(a, b, n=1, first=False):
    global s
    c = s.count(a)
    assert c >= 1 and (first or c == n), f"Target not matched properly: {a[:60]}... count={c}, expected={n}"
    s = s.replace(a, b, 1) if first else s.replace(a, b)

# 1. Default mode: start in 'walk' mode directly (not 'tour')
sub(
    "const S = { mode: 'tour', time: parseFloat(qs.get('t')) || 17.4,",
    "const S = { mode: 'walk', time: parseFloat(qs.get('t')) || 17.4, /* 69: start in walk */",
    first=True
)

# 2. Santorini Engine: seamless drag-to-look (no pointer lock required!) + click to select
mouse_target = """  let dragging = false;
  canvas.addEventListener('mousedown', (e) => {
    $('lmMenu').style.display = 'none';
    if (S.mode === 'tour') { setMode('fly'); requestLock(); return; }
    if (!S.locked) { requestLock(); dragging = true; return; }
    if (S.mode !== 'walk' && S.mode !== 'fly') return;
    if (e.button === 0) breakBlock(); else if (e.button === 2) placeBlock(); else if (e.button === 1) pickBlock();
  });
  __oiaL(window, 'mouseup', () => { dragging = false; });
  canvas.addEventListener('contextmenu', (e) => e.preventDefault());
  __oiaL(window, 'mousemove', (e) => {
    if (!(S.locked || dragging)) return;
    if (S.mode === 'tour') return;
    player.yaw -= (e.movementX || 0) * 0.0022;
    player.pitch = clamp(player.pitch - (e.movementY || 0) * 0.0022, -1.55, 1.55);
  });"""

mouse_replacement = """  /* 69: Smooth drag-to-look (no pointer lock required) & click-to-pick buildings/displays */
  let dragging = false, lastMx = 0, lastMy = 0, downX = 0, downY = 0;
  canvas.addEventListener('mousedown', (e) => {
    const lm = $('lmMenu'); if (lm) lm.style.display = 'none';
    if (S.mode === 'tour') setMode('walk');
    dragging = true;
    lastMx = e.clientX; lastMy = e.clientY;
    downX = e.clientX; downY = e.clientY;
    if (e.button === 0 && !isTouch && canvas.requestPointerLock) {
      try { canvas.requestPointerLock(); } catch (err) {}
    }
  });
  __oiaL(window, 'mouseup', (e) => {
    if (dragging) {
      dragging = false;
      var dist = Math.hypot(e.clientX - downX, e.clientY - downY);
      if (dist < 8 && e.button === 0) {
        if (window.MinestOiaClick) window.MinestOiaClick(e.clientX, e.clientY);
      }
    }
  });
  canvas.addEventListener('contextmenu', (e) => e.preventDefault());
  __oiaL(window, 'mousemove', (e) => {
    if (S.mode === 'tour') return;
    if (S.locked) {
      player.yaw -= (e.movementX || 0) * 0.0022;
      player.pitch = clamp(player.pitch - (e.movementY || 0) * 0.0022, -1.55, 1.55);
    } else if (dragging) {
      var dx = (e.movementX !== undefined && Math.abs(e.movementX) > 0) ? e.movementX : (e.clientX - lastMx);
      var dy = (e.movementY !== undefined && Math.abs(e.movementY) > 0) ? e.movementY : (e.clientY - lastMy);
      lastMx = e.clientX; lastMy = e.clientY;
      player.yaw -= dx * 0.003;
      player.pitch = clamp(player.pitch - dy * 0.003, -1.55, 1.55);
    }
  });"""

sub(mouse_target, mouse_replacement, first=True)

# 3. Touch tap -> pick building / display
sub(
    "if (performance.now() - lt0 < 220 && Math.hypot(t.clientX - ltx, t.clientY - lty) < 8 && (S.mode === 'walk' || S.mode === 'fly')) breakBlock();",
    "if (performance.now() - lt0 < 220 && Math.hypot(t.clientX - ltx, t.clientY - lty) < 8 && (S.mode === 'walk' || S.mode === 'fly')) { if (window.MinestOiaClick) window.MinestOiaClick(t.clientX, t.clientY); } /* 69 */",
    first=True
)

# 4. Eliminate single-block 1x1x1 outline
sub(
    "if (target) { outline.visible = true; outline.position.set(target.x + 0.5, target.y + 0.5, target.z + 0.5); } else outline.visible = false;",
    "outline.visible = false; /* 69: no Minecraft-style single block outline; whole building/element highlight only */",
    n=2
)

# 5. Generic Voxel Layer 62: strip single-block break & place
sub(
    "if (tool === 'break') { if (hit.y <= 0) return; vw.set(hit.x, hit.y, hit.z, 0); R.edits.push([hit.x, hit.y, hit.z, 0]); }\n    else {\n      var x = hit.x + hit.n[0], y = hit.y + hit.n[1], z = hit.z + hit.n[2], id = R.hot[R.held]; if (!id || !vw.in(x, y, z)) return;\n      var cur = vw.get(x, y, z); if (cur && REG.list[cur].kind !== 'water') return;\n      if (R.mode !== 'view' && x + 1 > p.x - D.hw && x < p.x + D.hw && z + 1 > p.z - D.hw && z < p.z + D.hw && y + 1 > p.y && y < p.y + D.h) return;\n      vw.set(x, y, z, id); R.edits.push([x, y, z, REG.list[id].key]);\n    }",
    "if (tool === 'break' || tool === 'place') return; /* 69: no single-block destruction or placement */"
)

sub(
    "act(pickAt(e.clientX, e.clientY), d.b === 2 ? 'place' : R.tool);",
    "/* 69: no tap block placing */"
)

# 6. Alpine Engine: strip block destruction & placement
sub(
    "if (e.button === 0) breakBlock(); else if (e.button === 2) { if (!interact(true)) placeBlock(); } else if (e.button === 1) pickBlock();",
    "/* 69: no alpine block break/place */"
)

sub(
    "if (performance.now() - lt0 < 220 && Math.hypot(t.clientX - ltx, t.clientY - lty) < 8 && (S.mode === 'walk' || S.mode === 'fly')) { if (!interact(true)) breakBlock(); }",
    "/* 69: no alpine touch block break */"
)

sub(
    "  function breakBlock() {\n    if (!target || target.y < 1) return;\n    if (window.__alpEdit) window.__alpEdit(target.x, target.y, target.z, 0, 0);",
    "  function breakBlock() { return; /* 69: no per-block tools */\n    if (!target || target.y < 1) return;\n    if (window.__alpEdit) window.__alpEdit(target.x, target.y, target.z, 0, 0);"
)

sub(
    "  function placeBlock() {\n    if (!target) return;\n    const x = target.x + target.nx,",
    "  function placeBlock() { return; /* 69 */\n    if (!target) return;\n    const x = target.x + target.nx,"
)



# 7. Replace oiabld68 with oiabld69
bld69_code = (Path(__file__).resolve().parent / "oiabld69.js").read_text(encoding="utf-8")
sub(
    '<script id="mn-oia-bld-68">',
    '<script id="mn-oia-bld-69">\n' + bld69_code + '\n</script>\n<!-- replaced 68 with 69 -->\n<script id="mn-disabled-68" type="text/plain">'
)

# 8. Prominent Floating Switch Button & On-Screen D-Pad / Move Controls for Santorini
entry_code = r"""<style id="mn-santorini-controls-style-69">
  #oia-root #oia-touch { display: block !important; }
  .oia-dpad {
    position: absolute;
    left: 20px;
    bottom: calc(88px + env(safe-area-inset-bottom));
    z-index: 55;
    display: grid;
    grid-template-columns: repeat(3, 44px);
    grid-template-rows: repeat(3, 44px);
    gap: 6px;
    pointer-events: auto;
    touch-action: none;
    user-select: none;
  }
  .oia-dpad button {
    background: rgba(15, 23, 42, 0.85);
    border: 2px solid rgba(148, 163, 184, 0.6);
    border-radius: 10px;
    color: #fff;
    font: bold 18px system-ui, sans-serif;
    display: flex;
    align-items: center;
    justify-content: center;
    cursor: pointer;
    box-shadow: 0 4px 10px rgba(0, 0, 0, 0.4);
    transition: transform 0.1s, background 0.1s;
  }
  .oia-dpad button:active {
    background: #007aff;
    transform: scale(0.92);
  }
  .oia-dpad button.u { grid-column: 2; grid-row: 1; }
  .oia-dpad button.l { grid-column: 1; grid-row: 2; }
  .oia-dpad button.m { grid-column: 2; grid-row: 2; font-size: 11px; background: rgba(30, 41, 59, 0.9); }
  .oia-dpad button.r { grid-column: 3; grid-row: 2; }
  .oia-dpad button.d { grid-column: 2; grid-row: 3; }
  .oia-quick-bar {
    position: absolute;
    left: 50%;
    transform: translateX(-50%);
    bottom: calc(18px + env(safe-area-inset-bottom));
    z-index: 55;
    display: flex;
    gap: 8px;
    background: rgba(15, 23, 42, 0.9);
    border: 1px solid rgba(255, 255, 255, 0.2);
    border-radius: 24px;
    padding: 6px 14px;
    box-shadow: 0 6px 20px rgba(0, 0, 0, 0.5);
    pointer-events: auto;
  }
  .oia-quick-btn {
    padding: 6px 12px;
    background: #1e293b;
    border: 1px solid #475569;
    border-radius: 16px;
    color: #f8fafc;
    font: bold 12px system-ui, sans-serif;
    cursor: pointer;
    display: flex;
    align-items: center;
    gap: 4px;
  }
  .oia-quick-btn:hover { background: #334155; }
  .oia-quick-btn.pri { background: #007aff; border-color: #60a5fa; color: #fff; }
</style>
<script id="mn-santorini-entry-69">
(function() {
  function enterSantorini() {
    var bid = (window.MinestDisplay && MinestDisplay.state && MinestDisplay.state() && MinestDisplay.state().bid) || 'board-ec6-art';
    try {
      if (window.MinestDisplay) {
        if (!MinestDisplay.isOpen || !MinestDisplay.isOpen()) {
          if (window.MinestUniverse && MinestUniverse.open) {
            try { MinestUniverse.open({ path: [{ t: 'home' }, { t: 'world', bid: bid }] }); } catch (e) {}
          }
          try { MinestDisplay.open({ bid: bid }); } catch (e) {}
        }
        var d = MinestDisplay.state && MinestDisplay.state();
        if (d && d.scape !== 'santorini') {
          d.scape = 'santorini';
          if (MinestDisplay.save) MinestDisplay.save();
        }
      }
    } catch (e) {}

    if (window.MinestOia) {
      MinestOia.open();
      setTimeout(function() {
        var s = window.__santorini;
        if (s) {
          if (s.setMode) s.setMode('walk');
          s.player.pos.set(18.5, 5.0, 24.5);
          s.player.yaw = 0; s.player.pitch = -0.05;
        }
        if (window.MinestOiaBld) {
          window.MinestOiaBld.toggle(true);
        }
        ensureControls();
      }, 400);
    }
  }
  window.MinestEnterSantorini3D = enterSantorini;

  function ensureControls() {
    var root = document.getElementById('oia-root');
    if (!root) return;

    if (!document.getElementById('oia-dpad-69')) {
      var dpad = document.createElement('div');
      dpad.id = 'oia-dpad-69';
      dpad.className = 'oia-dpad';
      dpad.innerHTML = '<button type="button" class="u" data-k="KeyW">▲</button>' +
        '<button type="button" class="l" data-k="KeyA">◀</button>' +
        '<button type="button" class="m" data-act="fly">🕊️</button>' +
        '<button type="button" class="r" data-k="KeyD">▶</button>' +
        '<button type="button" class="d" data-k="KeyS">▼</button>';

      var downKey = null, timer = null;
      function press(code) {
        window.dispatchEvent(new KeyboardEvent('keydown', { code: code, bubbles: true }));
      }
      function release(code) {
        window.dispatchEvent(new KeyboardEvent('keyup', { code: code, bubbles: true }));
      }

      dpad.addEventListener('pointerdown', function(e) {
        var btn = e.target.closest('button'); if (!btn) return;
        e.preventDefault(); e.stopPropagation();
        var act = btn.getAttribute('data-act'), k = btn.getAttribute('data-k');
        if (act === 'fly') {
          var s = window.__santorini;
          if (s && s.setMode) s.setMode(s.S.mode === 'fly' ? 'walk' : 'fly');
          btn.innerHTML = (s && s.S.mode === 'fly') ? '🚶' : '🕊️';
          return;
        }
        if (k) {
          downKey = k; press(k);
          timer = setInterval(function() { press(k); }, 80);
        }
      });

      var stop = function() {
        if (downKey) { release(downKey); downKey = null; }
        if (timer) { clearInterval(timer); timer = null; }
      };
      window.addEventListener('pointerup', stop);
      window.addEventListener('pointercancel', stop);

      root.appendChild(dpad);
    }

    if (!document.getElementById('oia-quick-69')) {
      var qbar = document.createElement('div');
      qbar.id = 'oia-quick-69';
      qbar.className = 'oia-quick-bar';
      qbar.innerHTML = '<button type="button" class="oia-quick-btn pri" id="oia-q-bld">🏛️ 建造面板</button>' +
        '<button type="button" class="oia-quick-btn" id="oia-q-disp">🎨 展架与卡片</button>' +
        '<button type="button" class="oia-quick-btn" id="oia-q-door">🏠 进入剖面 (Doorhouse)</button>' +
        '<button type="button" class="oia-quick-btn" id="oia-q-worlds">🌍 切换世界 (7大体素)</button>' +
        '<button type="button" class="oia-quick-btn" id="oia-q-exit">‹ 返回 2D</button>';

      qbar.addEventListener('click', function(e) {
        var b = e.target.closest('button'); if (!b) return;
        e.stopPropagation();
        if (b.id === 'oia-q-bld') {
          if (window.MinestOiaBld) MinestOiaBld.toggle();
        } else if (b.id === 'oia-q-disp') {
          if (window.MinestOiaBld) {
            MinestOiaBld.toggle(true);
            var tabBtn = document.querySelector('#mn-bld-p [data-tab="disp"]');
            if (tabBtn) tabBtn.click();
          }
        } else if (b.id === 'oia-q-door') {
          var sel = window.MinestOiaBld ? MinestOiaBld.selected() : null;
          if (!sel) {
            var blds = window.MinestOiaBld ? MinestOiaBld.buildings() : [];
            sel = (blds[0] && blds[0].id) || 'b7';
            if (window.MinestOiaBld) MinestOiaBld.select(sel);
          }
          if (window.MinestOiaBld) MinestOiaBld.enterDoorhouse(sel);
        } else if (b.id === 'oia-q-worlds') {
          openWorldsModal();
        } else if (b.id === 'oia-q-exit') {
          if (window.MinestOia) MinestOia.close();
        }
      });
      root.appendChild(qbar);
    }
  }

  function openWorldsModal() {
    var old = document.getElementById('mn-worlds-modal-69');
    if (old) { old.remove(); return; }
    var m = document.createElement('div');
    m.id = 'mn-worlds-modal-69';
    m.style.cssText = 'position:fixed;inset:0;z-index:9999999;background:rgba(11,15,25,.82);backdrop-filter:blur(12px);display:flex;align-items:center;justify-content:center;padding:16px;font-family:system-ui,-apple-system,sans-serif;color:#f8fafc;';
    m.innerHTML = '<div style="background:#161e2e;border:1px solid rgba(255,255,255,.15);border-radius:22px;box-shadow:0 24px 60px rgba(0,0,0,.6);width:min(680px,96vw);max-height:88vh;display:flex;flex-direction:column;overflow:hidden;position:relative;">' +
      '<div style="padding:18px 24px;border-bottom:1px solid rgba(255,255,255,.1);display:flex;align-items:center;justify-content:space-between;">' +
        '<div><h3 style="margin:0;font-size:19px;font-weight:800;background:linear-gradient(135deg,#60a5fa,#c084fc);-webkit-background-clip:text;-webkit-text-fill-color:transparent;">🌍 Minest 3D 体素世界大厅</h3><p style="margin:4px 0 0;font-size:12px;color:#94a3b8;">Kiro 与 AI Studio 最新精选 7 大高拟真体素世界</p></div>' +
        '<button type="button" id="mn-wm-close" style="background:rgba(255,255,255,.1);border:none;border-radius:50%;width:32px;height:32px;color:#fff;font-size:16px;cursor:pointer;">✕</button>' +
      '</div>' +
      '<div style="padding:16px 20px;overflow-y:auto;display:grid;grid-template-columns:repeat(auto-fill,minmax(280px,1fr));gap:12px;">' +
        '<a href="lauterbrunnen.html" style="text-decoration:none;color:inherit;background:rgba(255,255,255,.04);border:1px solid rgba(255,255,255,.08);border-radius:14px;padding:14px;display:flex;align-items:center;gap:12px;transition:all .15s;" onmouseover="this.style.background=\'rgba(37,99,235,.2)\';this.style.borderColor=\'#60a5fa\'" onmouseout="this.style.background=\'rgba(255,255,255,.04)\';this.style.borderColor=\'rgba(255,255,255,.08)\'">' +
          '<span style="font-size:32px;">🏔️</span><div><b style="font-size:15px;display:block;">劳特布龙嫩 Lauterbrunnen</b><small style="color:#94a3b8;font-size:12px;">瑞士 72 瀑布山谷 · 施陶巴赫悬崖木屋</small></div>' +
        '</a>' +
        '<a href="bibury.html" style="text-decoration:none;color:inherit;background:rgba(255,255,255,.04);border:1px solid rgba(255,255,255,.08);border-radius:14px;padding:14px;display:flex;align-items:center;gap:12px;transition:all .15s;" onmouseover="this.style.background=\'rgba(37,99,235,.2)\';this.style.borderColor=\'#60a5fa\'" onmouseout="this.style.background=\'rgba(255,255,255,.04)\';this.style.borderColor=\'rgba(255,255,255,.08)\'">' +
          '<span style="font-size:32px;">🏡</span><div><b style="font-size:15px;display:block;">拜伯里 Bibury</b><small style="color:#94a3b8;font-size:12px;">科茨沃尔德阿灵顿排屋 · 科恩河天鹅村</small></div>' +
        '</a>' +
        '<a href="downton.html" style="text-decoration:none;color:inherit;background:rgba(255,255,255,.04);border:1px solid rgba(255,255,255,.08);border-radius:14px;padding:14px;display:flex;align-items:center;gap:12px;transition:all .15s;" onmouseover="this.style.background=\'rgba(37,99,235,.2)\';this.style.borderColor=\'#60a5fa\'" onmouseout="this.style.background=\'rgba(255,255,255,.04)\';this.style.borderColor=\'rgba(255,255,255,.08)\'">' +
          '<span style="font-size:32px;">🏰</span><div><b style="font-size:15px;display:block;">唐顿庄园 Downton Abbey</b><small style="color:#94a3b8;font-size:12px;">海克利尔城堡 · 雅各宾大沙龙与图书室</small></div>' +
        '</a>' +
        '<a href="hallstatt.html" style="text-decoration:none;color:inherit;background:rgba(255,255,255,.04);border:1px solid rgba(255,255,255,.08);border-radius:14px;padding:14px;display:flex;align-items:center;gap:12px;transition:all .15s;" onmouseover="this.style.background=\'rgba(37,99,235,.2)\';this.style.borderColor=\'#60a5fa\'" onmouseout="this.style.background=\'rgba(255,255,255,.04)\';this.style.borderColor=\'rgba(255,255,255,.08)\'">' +
          '<span style="font-size:32px;">⛪</span><div><b style="font-size:15px;display:block;">哈尔施塔特 Hallstatt</b><small style="color:#94a3b8;font-size:12px;">奥地利最美湖畔 · 福音堂尖塔木屋群</small></div>' +
        '</a>' +
        '<a href="giethoorn.html" style="text-decoration:none;color:inherit;background:rgba(255,255,255,.04);border:1px solid rgba(255,255,255,.08);border-radius:14px;padding:14px;display:flex;align-items:center;gap:12px;transition:all .15s;" onmouseover="this.style.background=\'rgba(37,99,235,.2)\';this.style.borderColor=\'#60a5fa\'" onmouseout="this.style.background=\'rgba(255,255,255,.04)\';this.style.borderColor=\'rgba(255,255,255,.08)\'">' +
          '<span style="font-size:32px;">🛶</span><div><b style="font-size:15px;display:block;">羊角村 Giethoorn</b><small style="color:#94a3b8;font-size:12px;">荷兰绿色水乡 · 运河乘船与驼峰茅草屋</small></div>' +
        '</a>' +
        '<a href="neuschwanstein.html" style="text-decoration:none;color:inherit;background:rgba(255,255,255,.04);border:1px solid rgba(255,255,255,.08);border-radius:14px;padding:14px;display:flex;align-items:center;gap:12px;transition:all .15s;" onmouseover="this.style.background=\'rgba(37,99,235,.2)\';this.style.borderColor=\'#60a5fa\'" onmouseout="this.style.background=\'rgba(255,255,255,.04)\';this.style.borderColor=\'rgba(255,255,255,.08)\'">' +
          '<span style="font-size:32px;">👑</span><div><b style="font-size:15px;display:block;">新天鹅堡 Neuschwanstein</b><small style="color:#94a3b8;font-size:12px;">巴伐利亚梦幻城堡 · 王座厅与诗人殿</small></div>' +
        '</a>' +
        '<a href="javascript:void(0)" id="mn-wm-stay-oia" style="text-decoration:none;color:inherit;background:rgba(37,99,235,.15);border:1px solid #3b82f6;border-radius:14px;padding:14px;display:flex;align-items:center;gap:12px;">' +
          '<span style="font-size:32px;">🏛️</span><div><b style="font-size:15px;display:block;">圣托里尼 Santorini</b><small style="color:#93c5fd;font-size:12px;">当前所在世界 · 6 层全景联动建造</small></div>' +
        '</a>' +
      '</div>' +
      '<div style="padding:12px 20px;background:rgba(0,0,0,.2);display:flex;align-items:center;justify-content:space-between;">' +
        '<a href="worlds.html" style="color:#60a5fa;font-size:13px;font-weight:700;text-decoration:none;">打开 3D 世界全景大厅 (网页版) ›</a>' +
        '<span style="font-size:11px;color:#64748b;">Minest Voxel Worlds v69.5</span>' +
      '</div>' +
    '</div>';

    document.body.appendChild(m);
    document.getElementById('mn-wm-close').onclick = function() { m.remove(); };
    var oiaLink = document.getElementById('mn-wm-stay-oia');
    if (oiaLink) oiaLink.onclick = function() { m.remove(); enterSantorini(); };
  }
  window.MinestOpenWorldsModal = openWorldsModal;

  function injectBtn() {
    if (!document.body) return;
    if (!document.getElementById('mn-btn-santorini-3d')) {
      var b = document.createElement('button');
      b.id = 'mn-btn-santorini-3d';
      b.type = 'button';
      b.innerHTML = '🏛️ <b>3D 圣托里尼</b><small style="opacity:.85;font-size:10px;font-weight:600">体素世界 · 6层联动</small>';
      b.style.cssText = 'position:fixed;top:calc(12px + env(safe-area-inset-top));right:calc(12px + env(safe-area-inset-right));z-index:99999;display:flex;flex-direction:column;align-items:center;padding:7px 15px;background:linear-gradient(135deg,#007aff,#0051a8);color:#fff;border:2px solid #80bdff;border-radius:24px;font:800 13px/1.2 system-ui,-apple-system,sans-serif;box-shadow:0 6px 18px rgba(0,80,200,.45);cursor:pointer;pointer-events:auto;transition:transform .15s,box-shadow .15s;';
      b.addEventListener('mouseenter', function() { b.style.transform = 'scale(1.05)'; });
      b.addEventListener('mouseleave', function() { b.style.transform = 'scale(1)'; });
      b.addEventListener('click', function(e) { e.stopPropagation(); enterSantorini(); });
      document.body.appendChild(b);
    }

    if (!document.getElementById('mn-btn-worlds-portal-3d')) {
      var p = document.createElement('button');
      p.id = 'mn-btn-worlds-portal-3d';
      p.type = 'button';
      p.innerHTML = '🌍 <b>3D 探索大厅</b><small style="opacity:.85;font-size:10px;font-weight:600">劳特布龙嫩·拜伯里·7大世界</small>';
      p.style.cssText = 'position:fixed;top:calc(12px + env(safe-area-inset-top));right:calc(168px + env(safe-area-inset-right));z-index:99999;display:flex;flex-direction:column;align-items:center;padding:7px 15px;background:linear-gradient(135deg,#7c3aed,#4f46e5);color:#fff;border:2px solid #c084fc;border-radius:24px;font:800 13px/1.2 system-ui,-apple-system,sans-serif;box-shadow:0 6px 18px rgba(124,58,237,.45);cursor:pointer;pointer-events:auto;transition:transform .15s,box-shadow .15s;';
      p.addEventListener('mouseenter', function() { p.style.transform = 'scale(1.05)'; });
      p.addEventListener('mouseleave', function() { p.style.transform = 'scale(1)'; });
      p.addEventListener('click', function(e) { e.stopPropagation(); openWorldsModal(); });
      document.body.appendChild(p);
    }
  }

  if (document.readyState === 'loading') document.addEventListener('DOMContentLoaded', injectBtn);
  else injectBtn();
  setInterval(function() {
    injectBtn();
    if (window.__oiaOn && window.__santorini) ensureControls();
  }, 800);
})();
</script>
"""

assert s.count('</body>') >= 1
s = s.replace('</body>', entry_code + '\n</body>', 1)

out_path.write_text(s, encoding='utf-8')
print(f"Successfully generated {out_path} ({len(s.encode())} bytes)")

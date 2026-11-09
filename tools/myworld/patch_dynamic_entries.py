"""Patch 🚗 动态呈现 (Knowledge Drive) and 🏃 Run into:
1. 2D My World Levels Console (.wf .wf-acts)
2. Santorini 3D console (#oia-console left nav + idle pane + click handler)
"""
from pathlib import Path

HERE = Path(__file__).resolve().parent
ROOT = HERE.parents[1]

FILES = [
    'index.html',
    'iphone.html',
    'iPhoneDuo.html',
    'iPhone53.8241.html',
    'ipad.html',
    'ios/Minest/Minest/index.html',
    'ios/Minest/Minest/iphone.html',
    'ios/Minest/Minest/iPhoneDuo.html',
    'ios/Minest/Minest/ipad.html',
    'ios/Minest/Minest/iphone18.0.html',
]

def patch_file(p: Path):
    if not p.exists():
        print('missing', p)
        return
    s = p.read_text(encoding='utf-8')
    changed = False

    # 1. .wf .wf-acts
    t1 = ("  var original=document.getElementById('mn-btn-santorini-3d');\n"
          "  if(original&&!nav.querySelector('[data-console-santorini]')){var b=document.createElement('button');b.type='button';b.setAttribute('data-console-santorini','');b.innerHTML='<i>🏛️</i><span>圣托里尼</span>';b.onclick=function(){original.click();};nav.appendChild(b);}\n"
          " });")
    r1 = ("  var original=document.getElementById('mn-btn-santorini-3d');\n"
          "  if(original&&!nav.querySelector('[data-console-santorini]')){var b=document.createElement('button');b.type='button';b.setAttribute('data-console-santorini','');b.innerHTML='<i>🏛️</i><span>圣托里尼</span>';b.onclick=function(){original.click();};nav.appendChild(b);}\n"
          "  if(!nav.querySelector('[data-console-dynamic]')){var bd=document.createElement('button');bd.type='button';bd.setAttribute('data-console-dynamic','');bd.innerHTML='<i>🚗</i><span>动态呈现</span>';bd.onclick=function(){if(window.MinestDrive&&MinestDrive.gallery)MinestDrive.gallery();};nav.appendChild(bd);}\n"
          "  if(!nav.querySelector('[data-console-run]')){var br=document.createElement('button');br.type='button';br.setAttribute('data-console-run','');br.innerHTML='<i>🏃</i><span>Run</span>';br.onclick=function(){if(window.MinestWorldShell&&MinestWorldShell.open)MinestWorldShell.open('venice','run=1');else if(window.openWorldOverlay3D)openWorldOverlay3D('venice.html?run=1','威尼斯');};nav.appendChild(br);}\n"
          " });")
    if t1 in s:
        s = s.replace(t1, r1)
        changed = True

    # 2. #oia-console left nav
    t2 = '<nav aria-label="编辑工具"><button data-console="walk">🚶<br>Walk in</button><button data-console="view">🌐<br>视角</button><button data-console="map">🗺️<br>地图</button><button data-console="bld">🏛️<br>建筑</button><button data-console="elem">🌳<br>元素</button><button data-console="disp">🎨<br>陈列</button><button data-console="ai">✨<br>Smart</button></nav>'
    r2 = '<nav aria-label="编辑工具"><button data-console="walk">🚶<br>Walk in</button><button data-console="view">🌐<br>视角</button><button data-console="map">🗺️<br>地图</button><button data-console="bld">🏛️<br>建筑</button><button data-console="elem">🌳<br>元素</button><button data-console="disp">🎨<br>陈列</button><button data-console="ai">✨<br>Smart</button><button data-console="drive">🚗<br>动态呈现</button><button data-console="run">🏃<br>Run</button></nav>'
    if t2 in s:
        s = s.replace(t2, r2)
        changed = True

    # 3. #oia-idle-pane
    t3 = '<div><button data-console="walk">🚶 Walk in</button><button data-console="view">🌐 管理视角</button><button data-console="ai">✨ Smart</button></div>'
    r3 = '<div><button data-console="walk">🚶 Walk in</button><button data-console="view">🌐 管理视角</button><button data-console="ai">✨ Smart</button><button data-console="drive">🚗 动态呈现</button><button data-console="run">🏃 Run</button></div>'
    if t3 in s:
        s = s.replace(t3, r3)
        changed = True

    # 4. click handler
    t4 = "   if(a==='voxel'){open(false);return voxel();}\n   if(a==='return'){open(false);if(window.MinestOia)MinestOia.close();return;}"
    r4 = "   if(a==='drive'){if(window.MinestDrive&&MinestDrive.gallery)MinestDrive.gallery();return;}\n   if(a==='run'){open(false);if(window.MinestOia)MinestOia.close();if(window.MinestWorldShell&&MinestWorldShell.open)MinestWorldShell.open('venice','run=1');else if(window.openWorldOverlay3D)openWorldOverlay3D('venice.html?run=1','威尼斯');return;}\n   if(a==='voxel'){open(false);return voxel();}\n   if(a==='return'){open(false);if(window.MinestOia)MinestOia.close();return;}"
    if t4 in s:
        s = s.replace(t4, r4)
        changed = True

    if changed:
        p.write_text(s, encoding='utf-8')
        print('patched dynamic entries in', p.name)
    else:
        print('already patched or marker not found in', p.name)

for f in FILES:
    patch_file(ROOT / f)

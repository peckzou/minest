#!/usr/bin/env python3
"""Spatial Home: the room and its Home (the Clun opening) open fast and never sit on black (2026-11-26).

Root causes (measured in iPhone / iPad / desktop / Duo builds):
  1. The scanned rooms (EC-6 Victorian Study, 8.2 MB, 33 textures) asked for their model only after the whole room had
     been built and its first frames drawn: the model's request waited for the meshopt decoder <script> to fire `onload`,
     which queued behind ~3 s of main-thread work. Until the model arrived the screen was black with the desk things
     floating in it (the "black edges"), 5-6 s on a desktop, longer on a phone; in the iOS app the model also comes over
     the network.
  2. The Home (the Clun opening) started only after the window `load` event + 300 ms (all of the 20+ MB page), showed a
     flat blue frame until its own page arrived, gave up after 9 s if it had not said "ready" (and dropped you into the
     room), and when opened from the room the room kept rendering behind it whenever the room was busy.

What this does:
  · interiors-glb/assets/victorian_study_1k.glb: the Victorian Study with its 44 WebP textures at 1024² (8.2 MB → 3.7 MB);
    phones and tablets already cap every texture at 1024² (TEXCAP), so they now download and decode the small one.
  · env-glb.js: the model's bytes are requested the moment the room is built (or earlier: SpatialGLB.prefetch from the
    opening), parsed with GLTFLoader.parse as soon as the decoder is in; the env says `ready` (event spatialhome:envready).
  · app.js: a cover over the canvas while a scanned room's model is still on its way: last time's picture of this room
    (saved when you leave it, ~40 KB, per room and orientation) or a warm backdrop with a spinner; fades out when the model
    is drawn. Leaving the room for the Home always stops it rendering.
  · entries.js: the aquarium's Octo (a 3 MB rigged model) loads after the room's model instead of alongside it.
  · app.js: the opening starts at DOMContentLoaded; its frame shows the opening's own preview picture at the opening's own
    framing at once; the 9 s give-up waits longer once the frame has loaded; the room's model is fetched while it plays.

Usage: patch_fast_open.py FILE... [--check]   (FILE = spatial-home/js/env-glb.js, app.js, entries.js or a page)
"""
import sys

MARK = 'SpatialGLB = { prefetch'

GLB = [
    # 1. bytes prefetch helpers
    ("    return loaderP;\n  }\n",
     "    return loaderP;\n  }\n"
     "  /* 2026-11-26 打开快：模型的字节在房间一搭就开始下（或更早：开屏时 SpatialGLB.prefetch），不再等房间搭完、解码脚本 onload 之后 */\n"
     "  var GLB_BYTES = {}, GLB_DEFS = {};\n"
     "  function glbUrl(def) { return siteBase() + (def.lite && TEXCAP && TEXCAP <= 1024 ? def.lite : def.glb); }   // phones: the same model with its textures already at 1024² (a third of the bytes)\n"
     "  function glbBytes(def) {\n"
     "    var u = glbUrl(def); if (GLB_BYTES[u]) return GLB_BYTES[u];\n"
     "    var p = GLB_BYTES[u] = new Promise(function (res, rej) {\n"
     "      var x = new XMLHttpRequest(); x.open('GET', u, true); x.responseType = 'arraybuffer';\n"
     "      x.onload = function () { if ((x.status === 200 || x.status === 0) && x.response && x.response.byteLength) res(x.response); else rej(new Error('glb ' + x.status)); };\n"
     "      x.onerror = function () { rej(new Error('glb network')); }; x.send();\n"
     "    });\n"
     "    p.catch(function () { if (GLB_BYTES[u] === p) delete GLB_BYTES[u]; });\n"
     "    return p;\n"
     "  }\n"
     "  var GLB_PENDING = 0;\n"
     "  root.SpatialGLB = { prefetch: function (id) { var d = GLB_DEFS[id]; if (!d) return false; gltfLoader().catch(function () {}); glbBytes(d).catch(function () {}); return true; },\n"
     "    warm: function () { gltfLoader().catch(function () {}); }, has: function (id) { return !!GLB_DEFS[id]; }, pending: function () { return GLB_PENDING > 0; } };\n"),
    # 2. remember every model room
    ("  function makeEnv(def) {\n    registerMovable(def);\n",
     "  function makeEnv(def) {\n    registerMovable(def); GLB_DEFS[def.id] = def;\n"),
    # 3. load from the prefetched bytes
    ("      gltfLoader().then(function () {\n"
     "        var GL = new THREE.GLTFLoader(); if (root.MeshoptDecoder && GL.setMeshoptDecoder) GL.setMeshoptDecoder(root.MeshoptDecoder);\n"
     "        capDecode(GL);                                                  // phones: decode every texture at most 1024²\n"
     "        GL.load(siteBase() + def.glb, function (gl) {\n",
     "      var envObj = null, bytes = glbBytes(def), pend = true; GLB_PENDING++;   // the download starts now, while the room is still being built\n"
     "      function ready(ok) { if (pend) { pend = false; GLB_PENDING--; } if (!envObj || envObj.ready) return; envObj.ready = true; envObj.failed = !ok; try { root.dispatchEvent(new CustomEvent('spatialhome:envready', { detail: { env: def.id, ok: !!ok } })); } catch (er) {} }\n"
     "      function failed(e) { ready(false); if (root.console) console.warn('Spatial Home: ' + def.id + ' model could not load', e); }\n"
     "      Promise.all([gltfLoader(), bytes]).then(function (got) {\n"
     "        var GL = new THREE.GLTFLoader(); if (root.MeshoptDecoder && GL.setMeshoptDecoder) GL.setMeshoptDecoder(root.MeshoptDecoder);\n"
     "        capDecode(GL);                                                  // phones: decode every texture at most 1024²\n"
     "        var url = glbUrl(def); if (GLB_BYTES[url] === bytes) delete GLB_BYTES[url];   // parsed once: let the 8 MB go\n"
     "        GL.parse(got[1], url.replace(/[^/]*$/, ''), function (gl) {\n"),
    ("          if (def.movable) try { root.dispatchEvent(new CustomEvent('spatialhome:furnish', { detail: { env: def.id, items: furn } })); } catch (er) {}\n"
     "        }, undefined, function (e) { if (root.console) console.warn('Spatial Home: ' + def.id + ' model could not load', e); });\n"
     "      }, function () {});\n",
     "          if (def.movable) try { root.dispatchEvent(new CustomEvent('spatialhome:furnish', { detail: { env: def.id, items: furn } })); } catch (er) {}\n"
     "          ready(true);\n"
     "        }, failed);\n"
     "      }, failed);\n"),
    ("glb: 'interiors-glb/assets/victorian_study.glb', h: 6.5,",
     "glb: 'interiors-glb/assets/victorian_study.glb', lite: 'interiors-glb/assets/victorian_study_1k.glb', h: 6.5,"),
    ("      return {\n        id: def.id, name: def.name, group: g, holder: holder,",
     "      return (envObj = {\n        ready: false, id: def.id, name: def.name, group: g, holder: holder,"),
    ("        dispose: function () { if (fin && fin.dispose) fin.dispose(); SR.disposeTree(holder); scene.background = null; }\n      };\n    };\n",
     "        dispose: function () { if (fin && fin.dispose) fin.dispose(); SR.disposeTree(holder); scene.background = null; }\n      });\n    };\n"),
]

COVER_CSS = ("#sh-loadcover{position:absolute;inset:0;z-index:2;pointer-events:none;opacity:0;transition:opacity .45s ease;"
             "background:#24160f radial-gradient(130% 95% at 50% 62%,#7a4329 0%,#43271a 52%,#1d130d 100%) center/cover no-repeat}"
             "#sh-loadcover.on{opacity:1}#sh-loadcover.snap{background-color:#1d130d}"
             "#sh-loadcover b{position:absolute;left:50%;top:50%;width:30px;height:30px;margin:-15px 0 0 -15px;box-sizing:border-box;border-radius:50%;"
             "border:2.5px solid rgba(255,255,255,.26);border-top-color:rgba(255,255,255,.92);animation:shLoadSpin .9s linear infinite}"
             "#sh-loadcover.snap b{top:auto;bottom:calc(120px + env(safe-area-inset-bottom));width:22px;height:22px;margin:0 0 0 -11px;border-width:2px}"
             "@keyframes shLoadSpin{to{transform:rotate(360deg)}}@media (prefers-reduced-motion:reduce){#sh-loadcover b{animation-duration:2.6s}}")

ENTRIES = [
    # the aquarium's Octo (a 3 MB rigged model) waits until the room's own model is in, instead of parsing alongside it
    ("      afterBuild: function () { setTimeout(loadModel, 1200); }",
     "      afterBuild: function () {\n"
     "        var done = false; function go() { if (done) return; done = true; root.removeEventListener('spatialhome:envready', soon); loadModel(); }\n"
     "        function soon() { setTimeout(go, 500); }\n"
     "        if (root.SpatialGLB && root.SpatialGLB.pending()) { root.addEventListener('spatialhome:envready', soon); setTimeout(go, 12000); } else setTimeout(go, 1200);   // 2026-11-26\n"
     "      }"),
]

APP = [
    # the cover element, over the canvas, under the room's own buttons
    ("'<canvas id=\"sh-gl\" tabindex=\"0\" aria-label=\"Santorini Atelier\"></canvas>",
     "'<canvas id=\"sh-gl\" tabindex=\"0\" aria-label=\"Santorini Atelier\"></canvas><div id=\"sh-loadcover\" hidden aria-hidden=\"true\"><b></b></div>"),
    # leaving: a picture for next time; Home can always stop the room
    ("  function exitHome() { if (busy) return; if (window.SpatialMedia)",
     "  function exitHome(force) { if (busy && force !== true) return; snapSave(); if (window.SpatialMedia)"),
    # the cover logic, inside mount (room, renderer, scene, camera, body are in scope)
    ("  function open() {\n    if (inFeature) { B.leave('home'); return; }",
     "  /* 2026-11-26 打开慢 / 黑边：扫描房间（维多利亚书房等）的模型还在路上时，画面只有桌上几件东西浮在一片黑里。现在先盖上\n"
     "     上次离开这个房间时的画面（没有就用暖色底和转圈），模型画出来再淡掉；离开房间时存一张小图（每个房间、横竖屏各一张） */\n"
     "  var LC = $('loadcover'), lcT = 0;\n"
     "  if (!document.getElementById('sh-loadcover-css')) { var lcs = document.createElement('style'); lcs.id = 'sh-loadcover-css'; lcs.textContent = " + repr(COVER_CSS) + "; document.head.appendChild(lcs); }\n"
     "  function snapKey() { return 'minest.sh.snap.' + room.envId + (window.innerWidth > window.innerHeight ? '.l' : '.p'); }\n"
     "  function cover() {\n"
     "    if (!LC) return; clearTimeout(lcT);\n"
     "    if (!room || room.ready !== false) { LC.classList.remove('on'); LC.hidden = true; return; }\n"
     "    var img = null; try { img = localStorage.getItem(snapKey()); } catch (e) {}\n"
     "    LC.style.backgroundImage = img ? 'url(\"' + img + '\")' : ''; LC.classList.toggle('snap', !!img); LC.hidden = false; LC.classList.add('on');\n"
     "    lcT = setTimeout(uncover, 30000);                                       // never stay on: a model that never comes shows what there is\n"
     "  }\n"
     "  function uncover() { if (!LC || LC.hidden) return; clearTimeout(lcT); LC.classList.remove('on'); setTimeout(function () { if (!LC.classList.contains('on')) LC.hidden = true; }, 480); }\n"
     "  function snapSave() {\n"
     "    if (!room || room.ready !== true || body.hidden || paused) return;\n"
     "    try {\n"
     "      renderer.render(scene, camera);\n"
     "      var c = renderer.domElement, k = Math.min(1, 640 / Math.max(c.width, c.height, 1)), t = document.createElement('canvas');\n"
     "      t.width = Math.max(1, Math.round(c.width * k)); t.height = Math.max(1, Math.round(c.height * k)); t.getContext('2d').drawImage(c, 0, 0, t.width, t.height);\n"
     "      var url = t.toDataURL('image/jpeg', 0.62); if (url.length > 2000 && url.length < 400000) localStorage.setItem(snapKey(), url);\n"
     "    } catch (e) {}\n"
     "  }\n"
     "  window.addEventListener('spatialhome:envready', function (e) {\n"
     "    if (!e.detail || !room || e.detail.env !== room.envId) return;\n"
     "    if (!e.detail.ok) { uncover(); return; }\n"
     "    requestAnimationFrame(function () { requestAnimationFrame(function () { requestAnimationFrame(uncover); }); });   // the model is drawn first\n"
     "    setTimeout(function () { var k = snapKey(), has = null; try { has = localStorage.getItem(k); } catch (er) {} if (!has) snapSave(); }, 2000);   // a first picture\n"
     "  });\n"
     "  function open() {\n    if (inFeature) { B.leave('home'); return; }"),
    ("    body.hidden = false; paused = false; resize(); clock.getDelta(); markAvailability();\n",
     "    body.hidden = false; paused = false; resize(); clock.getDelta(); markAvailability(); cover();\n"),
    # an env switch to a scanned room: the same cover once the veil lifts
    ("      camAuto = true; autoPose(camera.position, camera.quaternion); S.env = room.envId; save();\n      return veilFade(0, 0.35);\n",
     "      camAuto = true; autoPose(camera.position, camera.quaternion); S.env = room.envId; save(); cover();\n      return veilFade(0, 0.35);\n"),
    ("    close: function () { if (API) API.close(); },\n",
     "    close: function (force) { if (API) API.close(force === true); },\n"),
    # the opening: poster at its own framing at once; patient when the frame has loaded; the room's model on the way
    ("    f.style.cssText = 'position:fixed;inset:0;width:100vw;height:100vh;max-width:none;max-height:none;margin:0;padding:0;border:0;z-index:2147483647;background:#cfe0ee;opacity:1';\n",
     "    f.style.cssText = 'position:fixed;inset:0;width:100vw;height:100vh;max-width:none;max-height:none;margin:0;padding:0;border:0;z-index:2147483647;background:#9cc3e6 no-repeat;opacity:1';\n"
     "    /* 2026-11-26：开屏页自己还没到之前，框里就先铺它的预览图，取景和开屏页一样（spatial-home/clun-2/index.html 的 fit），不再是一片空白 */\n"
     "    var PST = (location.protocol === 'file:' ? 'https://minest-app.vercel.app/' : '') + 'spatial-home/clun/art/plate-poster.jpg?v=2', loaded = false, t0 = Date.now();\n"
     "    if (!inside) f.style.backgroundImage = 'url(\"' + PST + '\")';\n"
     "    function poster(vw, vh) {\n"
     "      if (inside) return; var W = 2576, H = 1438, A = W / H, HOUSE = [860, 868], va = vw / vh, k, r;\n"
     "      k = !(navigator.maxTouchPoints > 0) ? 'normal' : (Math.min(vw, vh) >= 600 && Math.max(vw, vh) / Math.min(vw, vh) < 1.6) ? 'inner' : vw < vh ? 'outer' : 'normal';\n"
     "      if (k === 'outer') { var ho = Math.min(H, Math.max(1100, 640 / va)); r = { cx: HOUSE[0], cy: HOUSE[1] - 30, w: ho * va, h: ho }; }\n"
     "      else { var fw = va > A ? W : H * va; r = { cx: va > A ? W / 2 : (k === 'inner' ? 520 + fw / 2 : W / 2), cy: H / 2, w: fw, h: fw / va }; }\n"
     "      var w = Math.min(r.w, W, H * r.w / r.h), h = w * r.h / r.w, x = Math.max(0, Math.min(W - w, r.cx - w / 2)), y = Math.max(0, Math.min(H - h, r.cy - h / 2)), s = vw / w;\n"
     "      f.style.backgroundSize = (W * s).toFixed(1) + 'px ' + (H * s).toFixed(1) + 'px'; f.style.backgroundPosition = (-x * s).toFixed(1) + 'px ' + (-y * s).toFixed(1) + 'px';\n"
     "    }\n"
     "    f.addEventListener('load', function () { loaded = true; });\n"),
    ("      f.style.width = Math.round(w) + 'px'; f.style.height = Math.round(h) + 'px';\n    }\n",
     "      f.style.width = Math.round(w) + 'px'; f.style.height = Math.round(h) + 'px'; poster(w, h);\n    }\n"),
    ("    var to = setTimeout(function () { if (!ready) end(); }, 9000);           /* 9 秒还没加载好（离线等）：直接进房间 */\n",
     "    /* 9 秒还没加载好（离线等）：直接进房间。框里的页面已经到了、只是还在搭（手机慢、后台忙）就再等等，最多 30 秒 */\n"
     "    var to = 0; (function wait(ms) { to = setTimeout(function () { if (ready) return; if (loaded && Date.now() - t0 < 30000) { wait(1500); return; } end(); }, ms); })(9000);\n"),
    ("      if (e.data.clun === 'ready') { ready = true; clearTimeout(to); }\n",
     "      if (e.data.clun === 'ready') { ready = true; clearTimeout(to); prefetchRoom(); }\n"),
    ("  function boot() {\n    if (!bootsFirst()) return;\n    clunFirst(enterRoom);\n  }\n",
     "  /* 开屏放着的时候，把要进的房间的模型先下好（扫描房间 8 MB，iOS App 里走网络） */\n"
     "  function prefetchRoom() { try { var env = settings().env || 'victorian'; if (window.SpatialGLB) setTimeout(function () { SpatialGLB.prefetch(env); }, 600); } catch (e) {} }\n"
     "  function boot() {\n    if (!bootsFirst()) return;\n    clunFirst(enterRoom);\n  }\n"),
    ("    try { PUB.close(); } catch (e) {}\n    clunFirst(enterRoom, true);\n",
     "    try { PUB.close(true); } catch (e) {}                                    // the room stops rendering behind the opening, even mid-move\n    clunFirst(enterRoom, true);\n"),
    ("  PUB.house = function () { if (document.getElementById('mn-clun-splash')) return; try { PUB.close(); } catch (e) {}",
     "  PUB.house = function () { if (document.getElementById('mn-clun-splash')) return; try { PUB.close(true); } catch (e) {}"),
    ("  if (document.readyState === 'complete') setTimeout(boot, 300); else window.addEventListener('load', function () { setTimeout(boot, 300); }, { once: true });\n",
     "  /* 2026-11-26：开屏不再等整页（几十 MB）的 load 事件，DOM 好了就放；页面 load 之后在后台把模型解码脚本预热 */\n"
     "  if (document.readyState === 'loading') document.addEventListener('DOMContentLoaded', function () { setTimeout(boot, 0); }, { once: true }); else setTimeout(boot, 0);\n"
     "  (function () { function go() { setTimeout(function () { try { if (window.SpatialGLB) SpatialGLB.warm(); } catch (e) {} }, 2500); } if (document.readyState === 'complete') go(); else window.addEventListener('load', go, { once: true }); })();\n"),
]


def apply(src, edits, name):
    for old, new in edits:
        n = src.count(old)
        if n != 1:
            raise SystemExit('%s: anchor found %d times: %r' % (name, n, old[:90]))
        src = src.replace(old, new)
    return src


def main():
    args = [a for a in sys.argv[1:] if not a.startswith('--')]
    check = '--check' in sys.argv
    bad = 0
    for path in args:
        src = open(path, encoding='utf-8').read()
        done = (MARK in src) or (path.endswith('app.js') and "fastOpen: '" in src) or (path.endswith('entries.js') and 'SpatialGLB.pending()' in src)
        if check:
            print('%s: %s' % (path, 'patched' if done else 'NOT patched'))
            bad += not done
            continue
        if done:
            print('%s: already patched' % path)
            continue
        if path.endswith('env-glb.js'):
            out = apply(src, GLB, path)
        elif path.endswith('app.js'):
            out = apply(src, APP, path)
        elif path.endswith('entries.js'):
            out = apply(src, ENTRIES, path)
        else:
            out = apply(apply(apply(src, GLB, path), APP, path), ENTRIES, path)
        if path.endswith('app.js'):
            out = out.replace("  var PUB = {\n    version: '1.0',", "  var PUB = {\n    version: '1.0', fastOpen: '" + MARK + "',", 1)
        open(path, 'w', encoding='utf-8').write(out)
        print('%s: patched' % path)
    sys.exit(1 if bad else 0)


if __name__ == '__main__':
    main()

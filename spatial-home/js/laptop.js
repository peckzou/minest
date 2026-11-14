/* Minest · Spatial Home — the MacBook on the stone table (2026-11-14, the Alpine Meadow outdoor office).
   Tap the MacBook: its screen comes up over the meadow, about half the screen, the meadow still round it. On the screen,
   a desktop with the Magical Backpack as a grid — the apps (Minest's features) and the things in the backpack. Tap one and
   it opens on the screen itself: the Minest app runs in the screen (a frame of the app page, told which feature to open
   by ?mnLaptop=…, see bridge.js), so the work is done on the laptop, outdoors. ‹ 背包 goes back to the grid; ✕ or Esc
   (or a tap on the meadow round it) closes the lid. A thing that only lives in the room (the board, the window…) closes
   the laptop and is opened in the room as usual. */
(function (root) {
  'use strict';
  var el = null, kept = null, frame = null, frameFeature = null, view = 'grid';
  var APPS = [['kanban', '📋', 'Kanban 看板'], ['knowledge', '📚', 'Knowledge 知识'], ['drive', '🗂', 'Knowledge Drive'], ['routine', '🗓', 'Liquid Routine'],
    ['lists', '🌐', 'My World 清单'], ['type', '⌨️', 'Hermes 打字机'], ['type3d', '🪶', '3D Type 立体打字'], ['typingworlds', '🔤', 'Typing Worlds'],
    ['carplay', '🚗', '车载闪卡'], ['rings', '🏅', 'Rings 勋章'], ['pet', '🐾', '宠物养成'], ['portal', '🌆', '主题世界']];
  function B() { return root.SpatialBridge; }
  function api() { try { return root.MinestSpatialHome && root.MinestSpatialHome.api(); } catch (e) { return null; } }
  function esc(s) { return String(s == null ? '' : s).replace(/[&<>"]/g, function (c) { return { '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;' }[c]; }); }
  function clock() { var d = new Date(); return ['周日', '周一', '周二', '周三', '周四', '周五', '周六'][d.getDay()] + ' ' + d.getHours() + ':' + ('0' + d.getMinutes()).slice(-2); }
  function appUrl() { var b = B(), u = b && b.appUrl ? b.appUrl() : location.href; return u.split('#')[0]; }
  function withParam(u, k, v) { return u + (u.indexOf('?') >= 0 ? '&' : '?') + k + '=' + encodeURIComponent(v); }

  /* the screen opens where the MacBook stands, about a quarter of the screen; seen in first person, a third (⤢ swaps) */
  var anchor = null, big = null;
  function firstPerson() { var a = api(); try { return !a || a.state().view !== '3p'; } catch (e) { return true; } }
  function size() {
    var W = root.innerWidth, H = root.innerHeight, frac = (big == null ? firstPerson() : big) ? 1 / 3 : 1 / 4;
    var sw = Math.sqrt(frac * W * H * 1.6), sh = sw / 1.6;
    if (sw > W * 0.96) { sw = W * 0.96; sh = sw / 1.6; } if (sh > H * 0.8) { sh = H * 0.8; sw = sh * 1.6; }
    return { w: Math.round(sw), h: Math.round(sh) };
  }
  function place() {
    if (!el) return; var S = size(), mac = el.querySelector('.lp-mac'), W = root.innerWidth, H = root.innerHeight;
    mac.style.width = (S.w + 24) + 'px'; el.querySelector('.lp-scr').style.height = S.h + 'px';
    var tw = S.w + 24, th = S.h + 40, ax = anchor ? anchor.x : W / 2, ay = anchor ? anchor.y : H / 2;
    var l = Math.max(10, Math.min(W - tw - 10, ax - tw / 2)), t = Math.max(10, H - th - 12);   // across from the MacBook, down at the bottom: the view stays open above it
    mac.style.left = l + 'px'; mac.style.top = t + 'px'; mac.style.transformOrigin = (ax - l) + 'px ' + (ay - t) + 'px';
  }
  function css() {
    if (document.getElementById('sh-laptop-css')) return;
    var st = document.createElement('style'); st.id = 'sh-laptop-css';
    st.textContent = [
      '.lp-ov{position:fixed;inset:0;z-index:2147483640;display:block;background:rgba(10,14,20,.06);opacity:0;transition:opacity .35s ease;font-family:-apple-system,BlinkMacSystemFont,"SF Pro Text","PingFang SC",sans-serif}',
      '.lp-ov.on{opacity:1}',
      '.lp-mac{position:absolute;transform:scale(.18);transition:transform .5s cubic-bezier(.2,.9,.25,1)}',   // it grows out of the MacBook on the stone
      '.lp-ov.on .lp-mac{transform:none}',
      '.lp-lid{background:#0d0e10;border-radius:14px;padding:10px 10px 12px;box-shadow:0 30px 80px rgba(0,0,0,.45),inset 0 0 0 1.5px #3b3d42}',
      '.lp-notch{position:absolute;left:50%;top:10px;transform:translateX(-50%);width:84px;height:14px;background:#0d0e10;border-radius:0 0 10px 10px;z-index:3}',
      '.lp-scr{position:relative;overflow:hidden;border-radius:6px;background:linear-gradient(135deg,#2b5aa8,#7a4fb0 45%,#e0648a 75%,#f2a65a)}',
      '.lp-base{height:11px;margin:0 -18px;background:linear-gradient(#d7d9de,#a9adb4);border-radius:0 0 14px 14px;position:relative;box-shadow:0 18px 30px rgba(0,0,0,.35)}',
      '.lp-base:after{content:"";position:absolute;left:50%;top:0;transform:translateX(-50%);width:110px;height:6px;background:#9a9ea5;border-radius:0 0 8px 8px}',
      '.lp-bar{position:absolute;top:0;left:0;right:0;height:26px;display:flex;align-items:center;gap:14px;padding:0 14px 0 12px;color:#fff;font-size:12.5px;background:rgba(20,22,30,.35);backdrop-filter:blur(18px);-webkit-backdrop-filter:blur(18px);z-index:2}',
      '.lp-bar b{font-weight:700}.lp-bar .sp{flex:1}.lp-bar span{opacity:.9}',
      '.lp-bar button{background:none;border:0;color:#fff;font:inherit;padding:2px 6px;border-radius:6px;cursor:pointer}',
      '.lp-bar button:hover{background:rgba(255,255,255,.16)}',
      '.lp-body{position:absolute;top:26px;left:0;right:0;bottom:0;overflow:auto;-webkit-overflow-scrolling:touch}',
      '.lp-win{margin:16px;border-radius:12px;background:rgba(246,246,248,.88);backdrop-filter:blur(20px);-webkit-backdrop-filter:blur(20px);box-shadow:0 14px 40px rgba(0,0,0,.28);color:#1c1c1e;overflow:hidden}',
      '.lp-wh{display:flex;align-items:center;gap:8px;padding:9px 12px;border-bottom:1px solid rgba(0,0,0,.08);font-weight:600;font-size:13px}',
      '.lp-dots{display:flex;gap:6px;margin-right:6px}.lp-dots i{width:11px;height:11px;border-radius:6px;display:block}',
      '.lp-sec{padding:10px 14px 4px;font-size:11.5px;font-weight:600;color:#6e6e73;text-transform:none}',
      '.lp-grid{display:grid;grid-template-columns:repeat(auto-fill,minmax(74px,1fr));gap:4px;padding:4px 8px 12px}',
      '.lp-it{display:flex;flex-direction:column;align-items:center;gap:5px;padding:9px 4px;border-radius:10px;border:0;background:none;cursor:pointer;color:#1c1c1e;font:12px/1.25 inherit;text-align:center}',
      '.lp-it:hover{background:rgba(0,0,0,.06)}.lp-it:active{background:rgba(0,0,0,.12)}',
      '.lp-ic{width:52px;height:52px;border-radius:13px;display:flex;align-items:center;justify-content:center;font-size:27px;background:linear-gradient(160deg,#fff,#e9e9ee);box-shadow:0 2px 6px rgba(0,0,0,.14);overflow:hidden}',
      '.lp-ic img{width:100%;height:100%;object-fit:cover}',
      '.lp-it small{display:block;max-width:92px;overflow:hidden;text-overflow:ellipsis;white-space:nowrap}',
      '.lp-app{position:absolute;inset:26px 0 0 0;background:#fff;display:none}.lp-app.on{display:block}',
      '.lp-app iframe{border:0;width:100%;height:100%;display:block;background:#fff}',
      '.lp-load{position:absolute;inset:26px 0 0 0;display:none;align-items:center;justify-content:center;color:#fff;font-size:13px;background:rgba(20,22,30,.55)}',
      '.lp-load.on{display:flex}',
      '.lp-x{position:absolute;right:-14px;top:-14px;width:34px;height:34px;border-radius:17px;border:1px solid rgba(255,255,255,.35);background:rgba(20,22,30,.7);color:#fff;font-size:16px;cursor:pointer;z-index:4;backdrop-filter:blur(10px);-webkit-backdrop-filter:blur(10px)}',
      '.lp-note{padding:14px;font-size:13px;color:#3a3a3c;line-height:1.5}'
    ].join('\n');
    document.head.appendChild(st);
  }
  function items() {
    var a = api(), BP = root.MinestBackpack, cat = [];
    try { cat = a && a.backpack ? a.backpack() : (BP && BP.catalog ? BP.catalog(null) : []); } catch (e) { cat = []; }
    var F = (B() && B().FEATURES) || {}, apps = APPS.filter(function (q) { return F[q[0]]; });
    return {
      apps: apps.map(function (q) { return { key: 'app:' + q[0], icon: q[1], name: q[2], feature: q[0] }; }),
      tools: cat.filter(function (it) { return it.kind === 'function'; }).map(function (it) { return { key: it.key, icon: it.icon || '✦', name: it.name, fn: it.fn, feature: it.fn && it.fn.featureId }; }),
      mine: cat.filter(function (it) { return it.cat === 'creations' || it.cat === 'collections'; }).slice(0, 60).map(function (it) { return { key: it.key, icon: it.icon || '✦', name: it.name, item: it }; })
    };
  }
  function tile(t) { return '<button type="button" class="lp-it" data-k="' + esc(t.key) + '"><span class="lp-ic">' + esc(t.icon) + '</span><small>' + esc(t.name) + '</small></button>'; }
  function grid() {
    var I = items(), body = el.querySelector('.lp-body');
    body.innerHTML = '<div class="lp-win"><div class="lp-wh"><span class="lp-dots"><i style="background:#ff5f57"></i><i style="background:#febc2e"></i><i style="background:#28c840"></i></span>🎒 魔法背包</div>' +
      '<div class="lp-sec">应用 · 在这块屏幕上打开</div><div class="lp-grid">' + I.apps.map(tile).join('') + '</div>' +
      (I.tools.length ? '<div class="lp-sec">背包里的功能物件</div><div class="lp-grid">' + I.tools.map(tile).join('') + '</div>' : '') +
      (I.mine.length ? '<div class="lp-sec">作品与收藏</div><div class="lp-grid">' + I.mine.map(tile).join('') + '</div>' : '') + '</div>';
    el._items = [].concat(I.apps, I.tools, I.mine);
    showApp(false); setTitle('Finder');
  }
  function setTitle(t) { var b = el && el.querySelector('[data-title]'); if (b) b.textContent = t; var bk = el && el.querySelector('[data-back]'); if (bk) bk.style.visibility = view === 'app' ? 'visible' : 'hidden'; }
  function showApp(on) { view = on ? 'app' : 'grid'; var a = el.querySelector('.lp-app'); a.classList.toggle('on', !!on); el.querySelector('.lp-body').style.visibility = on ? 'hidden' : 'visible'; }
  function loading(on, text) { var l = el.querySelector('.lp-load'); l.classList.toggle('on', !!on); if (text) l.textContent = text; }
  /* open a feature on the screen: the app page in the screen's frame, told which feature (bridge.js answers ?mnLaptop / postMessage) */
  function openFeature(feature, name) {
    var host = el.querySelector('.lp-app');
    showApp(true); setTitle(name || feature);
    if (frame && frame._ready && frame.contentWindow) { try { frame.contentWindow.postMessage({ mnLaptop: feature }, '*'); } catch (e) {} frameFeature = feature; return; }
    if (!frame) {
      frame = document.createElement('iframe'); frame.setAttribute('allow', 'camera; microphone; fullscreen; autoplay; clipboard-write');
      frame.addEventListener('load', function () { frame._ready = true; loading(false); try { frame.contentWindow.postMessage({ mnLaptop: frameFeature }, '*'); } catch (e) {} });
      host.appendChild(frame);
    }
    frameFeature = feature; frame._ready = false; loading(true, '正在打开 ' + (name || feature) + '…');
    frame.src = withParam(withParam(appUrl(), 'home', '0'), 'mnLaptop', feature);
  }
  function openThing(it) {
    var body = el.querySelector('.lp-body'), x = it.item, pic = '';
    try { if (x && x.ref && x.ref.sid && root.MinestBackpack && root.MinestBackpack.thingPic) pic = root.MinestBackpack.thingPic(x.ref); } catch (e) {}
    body.innerHTML = '<div class="lp-win"><div class="lp-wh"><span class="lp-dots"><i style="background:#ff5f57"></i><i style="background:#febc2e"></i><i style="background:#28c840"></i></span>' + esc(it.name) + '</div>' +
      (pic ? '<img src="' + esc(pic) + '" style="display:block;max-width:100%;max-height:60vh;margin:12px auto;border-radius:8px">' : '<div style="font-size:64px;text-align:center;padding:18px 0 6px">' + esc(it.icon) + '</div>') +
      '<div class="lp-note"><b>' + esc(it.name) + '</b><br>' + esc((x && x.note) || '') + '</div></div>';
    view = 'app'; setTitle(it.name); el.querySelector('[data-back]').style.visibility = 'visible';
  }
  function pick(k) {
    var it = (el._items || []).filter(function (x) { return x.key === k; })[0]; if (!it) return;
    if (it.feature && B() && B().FEATURES && B().FEATURES[it.feature]) return openFeature(it.feature, it.name);
    if (it.fn) {                                                              // a thing that only lives in the room
      var A = api(); close(function () { if (A && A.activate) A.activate(it.fn.id); }); return;
    }
    if (it.item) return openThing(it);
  }
  function key(e) { if (e.key === 'Escape' && el) { e.stopPropagation(); close(); } }
  function open(opts) {
    anchor = (opts && opts.at) || null; big = null;
    if (el) return; css();
    var S = size();
    if (kept) {                                                               // the same laptop (the app in its frame keeps running)
      el = kept; kept = null; el.style.display = ''; root.addEventListener('keydown', key, true);
      el._clock = setInterval(function () { var c = el && el.querySelector('[data-clock]'); if (c) c.textContent = clock(); }, 15000);
      place(); if (view !== 'app' || !frame) grid(); requestAnimationFrame(function () { el.classList.add('on'); }); return;
    }
    el = document.createElement('div'); el.className = 'lp-ov';
    el.innerHTML = '<div class="lp-mac" style="width:' + (S.w + 24) + 'px"><button type="button" class="lp-x" data-x title="合上 MacBook">✕</button>' +
      '<div class="lp-lid"><div class="lp-notch"></div><div class="lp-scr" style="height:' + S.h + 'px">' +
      '<div class="lp-bar"><b></b><button type="button" data-back style="visibility:hidden">‹ 背包</button><b data-title>Finder</b><span>文件</span><span>编辑</span><span>显示</span><span class="sp"></span><button type="button" data-big title="放大 / 缩小屏幕">⤢</button><span data-clock>' + clock() + '</span></div>' +
      '<div class="lp-body"></div><div class="lp-app"></div><div class="lp-load">正在打开…</div></div></div><div class="lp-base"></div></div>';
    el.querySelector('.lp-bar b').textContent = '';
    document.body.appendChild(el);
    ['pointerdown', 'pointermove', 'wheel', 'touchstart', 'touchmove'].forEach(function (t) { el.addEventListener(t, function (e) { e.stopPropagation(); }, { passive: true }); });
    el.addEventListener('click', function (e) {
      if (e.target === el) return close();                                    // the meadow round it: close the lid
      var b = e.target.closest('button'); if (!b) return;
      if (b.dataset.x != null) return close();
      if (b.dataset.back != null) { grid(); return; }
      if (b.dataset.big != null) { big = !(big == null ? firstPerson() : big); place(); return; }
      if (b.dataset.k) pick(b.dataset.k);
    });
    root.addEventListener('keydown', key, true);
    el._clock = setInterval(function () { var c = el && el.querySelector('[data-clock]'); if (c) c.textContent = clock(); }, 15000);
    place(); grid(); requestAnimationFrame(function () { el.classList.add('on'); });
  }
  function close(after) {
    if (!el) return; var e0 = el; el = null; clearInterval(e0._clock); root.removeEventListener('keydown', key, true);
    e0.classList.remove('on'); setTimeout(function () { e0.style.display = 'none'; kept = e0; if (typeof after === 'function') after(); }, 380);   // kept, not removed: the app in its frame stays loaded
  }
  root.addEventListener('resize', function () { place(); });
  root.SpatialLaptop = { open: open, close: close, isOpen: function () { return !!el; } };
})(window);

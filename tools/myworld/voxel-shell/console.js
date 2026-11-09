/* The voxel-world console of My World (as in Santorini, by Codex), for a world running in its own engine page:
   one back pill, the title, ≡ and the console — Walk in / 视角 / 地图 / 地点, 一键世界 / 体素世界 / 返回小岛.
   The engine's own shell (intro hints, hotbar, touch buttons, joystick, landmark menu, model panel) stays hidden. */
(function () {
  'use strict';
  var me = document.currentScript, NAME = (me && me.getAttribute('data-name')) || '', ID = (me && me.getAttribute('data-world')) || '';
  var WORLDS = [['santorini', '圣托里尼'], ['alpchalet', '阿尔卑斯木屋'], ['admont', '阿德蒙特图书馆'], ['trinity', '三一学院'], ['study', '英式藏书室'],
    ['hobbiton', '霍比屯'], ['bibury', '拜伯里'], ['downton', '唐顿庄园'], ['giethoorn', '羊角村'], ['hallstatt', '哈尔施塔特'], ['lauterbrunnen', '劳特布龙嫩'], ['neuschwanstein', '新天鹅堡'], ['venice', '威尼斯']];
  window.__oiaOn = true;
  function engine() { return window.__voxel; }
  function toParent(msg) { try { if (window.parent && window.parent !== window) { window.parent.postMessage(msg, '*'); return true; } } catch (e) {} return false; }
  function leave() { if (!toParent({ action: 'closeMinest3DOverlay' })) history.back(); }
  function status(t) { var e = document.getElementById('oia-operation-status'); if (e) e.textContent = t; }
  function key(code) { [['keydown'], ['keyup']].forEach(function (k) { window.dispatchEvent(new KeyboardEvent(k[0], { code: code, key: code === 'KeyE' ? 'e' : code, bubbles: true })); }); }

  function proxy() { return window.__voxelProxy || null; }
  function places() {
    if (proxy()) return proxy().places().slice(0, 40);
    var s = engine(), L = (s && s.world && s.world.landmarks) || [];
    return L.filter(function (l) { return l && l.name; }).slice(0, 40);
  }
  function goPlace(i) {   // the editing camera over one landmark (the world itself is not touched)
    var l = places()[i], E = window.MinestOiaEditor; if (!l || !E) return;
    if (l.go) { l.go(); if (window.MinestOiaConsole) MinestOiaConsole.cancel(); status('已前往「' + l.name + '」'); return; }
    if (!E.active) E.explore('edit');
    var t = E.target; t.x = l.x; t.z = l.z; t.y = (l.top || 30) - 4;
    var want = Math.max(40, (l.r || 20) * 3.2); E.zoom(want / Math.max(1, E.distance));
    status('镜头已移到「' + l.name + '」');
  }

  function build() {
    if (document.getElementById('oia-console') || !document.body) return;
    document.body.id = 'oia-root';
    if (!document.getElementById('title')) {   // a world without the engine's title block gets Santorini's
      var tt = document.createElement('div'); tt.id = 'title'; tt.className = 'mc';
      tt.innerHTML = '<b>' + ((me && me.getAttribute('data-title')) || NAME) + '</b><span id="modeLabel"></span>'; document.body.appendChild(tt);
      setInterval(function () { var s = engine(), E = window.MinestOiaEditor, m = E && E.active ? '全局视角 · 拖动旋转、捏合缩放' : s && s.S.mode === 'fly' ? (proxy() && proxy().kind === 'react' ? '第一人称 · 在 Walk in 控制台操作' : '飞行探索 · 在 Walk in 控制台操作') : '步行探索 · 在 Walk in 控制台操作', el = document.getElementById('modeLabel'); if (el && el.textContent !== m) el.textContent = m; }, 300);
    }
    var back = document.createElement('button'); back.type = 'button'; back.id = 'oia-back'; back.className = 'mc'; back.textContent = '‹ 回到 My World (小岛)'; back.onclick = leave;
    var toggle = document.createElement('button'); toggle.type = 'button'; toggle.id = 'oia-console-toggle'; toggle.textContent = '≡'; toggle.setAttribute('aria-label', '打开 My World 控制台'); toggle.setAttribute('aria-expanded', 'false');
    var c = document.createElement('section'); c.id = 'oia-console'; c.hidden = true; c.setAttribute('aria-label', 'My World 控制台');
    c.innerHTML = '<header><b>🌴 World › ' + NAME + '</b><span>体素世界</span><button data-console="cancel" aria-label="取消当前工具" disabled>取消</button><button data-console="close" aria-label="收起控制台">×</button></header>' +
      '<div class="console-grid"><nav aria-label="浏览工具"><button data-console="walk"><i>🚶</i><span>Walk in</span></button><button data-console="view"><i>🌐</i><span>视角</span></button><button data-console="map"><i>🗺️</i><span>地图</span></button><button data-console="place"><i>📍</i><span>地点</span></button><button data-console="drive"><i>🚗</i><span>动态呈现</span></button>' + (window.MinestRun ? '<button data-console="run"><i>🏃</i><span>Run</span></button>' : '') + '</nav><main>' +
      '<section id="oia-idle-pane"><h3>选择一个工具</h3><p>再点一次已选按钮，或点「取消」，即可退出当前操作。</p><div><button data-console="walk">🚶 Walk in</button><button data-console="view">🌐 管理视角</button><button data-console="place">📍 地点</button><button data-console="drive">🚗 动态呈现</button>' + (window.MinestRun ? '<button data-console="run">🏃 Run</button>' : '') + '</div></section>' +
      '<div id="oia-navigation-pane" hidden></div>' +
      '<section id="oia-camera-pane" hidden><h3>全局视角</h3><p id="oia-camera-summary" role="status"></p><p id="oia-selection"></p><div class="camera-actions"><button data-camera="fit">看全世界</button><button data-camera="top">正上方俯视</button><button data-camera="light">编辑照明：明亮</button><button data-camera="gesture" id="oia-camera-gesture">当前：旋转</button><button data-camera="out">− 缩小</button><button data-camera="in">＋ 放大</button></div><label>镜头距离<input id="oia-camera-distance" type="range" min="12" max="3500" step="1" aria-label="镜头距离"></label><p class="camera-help">拖动旋转 · 双指捏合缩放并平移<br>切换「平移」后单指拖动平移</p><button data-console="walk">🚶 Walk in · 步行与飞行</button></section>' +
      '<section id="oia-map-pane" hidden><h3>世界地图</h3><p>轻点地图定位镜头 · 下方滑杆调整时间</p><div id="oia-console-map"></div></section>' +
      '<section id="oia-place-pane" class="o71-places" hidden><h3>地点</h3><p>轻点一个地点，镜头飞过去；想走进去就用 Walk in</p><div></div></section>' +
      (window.MinestRun ? MinestRun.markup() : '') + '<section id="oia-world-pane" hidden></section></main>' +
      '<nav aria-label="世界导航"><button data-console="door">🚪<br>开门互动</button><button data-console="worlds">🌍<br>一键世界</button><button data-console="voxel">🧊<br>体素世界</button><button data-console="return">‹<br>返回小岛</button></nav></div>' +
      '<footer><p id="oia-operation-status" role="status"></p><span id="oia-building-count"></span></footer>';
    var active = null;
    function chooseWorld() {
      var host = c.querySelector('#oia-world-pane'); if (host.querySelector('#oia-world-picker')) return;
      var pk = document.createElement('section'); pk.id = 'oia-world-picker'; pk.setAttribute('role', 'dialog'); pk.setAttribute('aria-label', '一键世界');
      pk.innerHTML = '<header><b>🌍 一键世界</b><button aria-label="关闭世界选择">×</button></header><div></div>';
      pk.querySelector('header button').onclick = function () { tab(null); };
      WORLDS.forEach(function (w) { var b = document.createElement('button'); b.textContent = w[1] + (w[0] === ID ? ' · 当前' : ''); b.disabled = w[0] === ID; b.onclick = function () { toParent({ action: 'minestOpenWorld', id: w[0] }); }; pk.querySelector('div').appendChild(b); });
      host.appendChild(pk);
    }
    function fillPlaces() {
      var box = c.querySelector('#oia-place-pane div'), L = places();
      box.innerHTML = L.length ? L.map(function (l, i) { return '<button data-place="' + i + '">' + l.name + (l.en ? '<small>' + l.en + '</small>' : '') + '</button>'; }).join('') : '<p>这个世界没有标出地点</p>';
    }
    function fillExtras() {   // the world's own light / season / view presets, where Santorini has its map
      var box = c.querySelector('#oia-console-map'), G = proxy().extras();
      box.innerHTML = G.map(function (g, gi) { return '<h4>' + g.name + '</h4><div class="o71-extras">' + g.items.map(function (it, ii) { return '<button data-extra="' + gi + ':' + ii + '">' + it.name + '</button>'; }).join('') + '</div>'; }).join('');
    }
    function tab(name) {
      var prev = active; active = name; c.dataset.tool = name || '';
      if (window.MinestWorldNavigation) MinestWorldNavigation.stop();
      if (prev === 'walk' && name !== 'walk' && window.MinestOiaEditor) MinestOiaEditor.explore('edit');
      var panes = { idle: null, navigation: 'walk', camera: 'view', map: 'map', place: 'place', world: 'worlds', run: 'run' };
      Object.keys(panes).forEach(function (k) { var pn = c.querySelector('#oia-' + k + '-pane'); if (pn) pn.hidden = name !== panes[k]; });
      if (window.MinestRun && MinestRun.active() && /^(walk|view|place)$/.test(name || '')) MinestRun.stop();   // those tools need the camera back
      if (name === 'run' && window.MinestRun) MinestRun.paint();
      if (name === 'worlds') chooseWorld();
      if (name === 'place') fillPlaces();
      if (name === 'map' && proxy()) fillExtras();
      if (name === 'walk' && window.MinestOiaEditor && MinestOiaEditor.active) MinestOiaEditor.explore('walk');
      c.querySelectorAll('[data-console]').forEach(function (b) { var on = !!name && b.getAttribute('data-console') === name; b.classList.toggle('on', on); if (/^(walk|view|map|place|worlds|run)$/.test(b.dataset.console)) b.setAttribute('aria-pressed', String(on)); });
      c.querySelector('[data-console="cancel"]').disabled = !name; c.querySelector('main').scrollTop = 0;
      status(name ? '再次点击已选工具可取消' : '已退出工具 · 可自由查看世界');
    }
    function open(on) { if (window.MinestWorldNavigation) MinestWorldNavigation.stop(); c.hidden = !on; toggle.setAttribute('aria-expanded', String(on)); tab(on ? active : null); }
    window.MinestOiaConsole = { open: function (n) { open(true); if (n) tab(n); }, cancel: function () { tab(null); }, active: function () { return active; } };
    toggle.onclick = function () { open(c.hidden); };
    c.addEventListener('click', function (e) {
      var x = e.target.closest('[data-extra]'); if (x) { e.stopPropagation(); var ij = x.getAttribute('data-extra').split(':'), g = proxy().extras()[+ij[0]], it = g && g.items[+ij[1]]; if (it) { it.go(); status('已切换：' + it.name); } return; }
      var p = e.target.closest('[data-place]'); if (p) { e.stopPropagation(); return goPlace(+p.getAttribute('data-place')); }
      var b = e.target.closest('[data-console]'); if (!b) return; e.stopPropagation(); var a = b.getAttribute('data-console');
      if (a === 'close') return open(false);
      if (a === 'cancel') return tab(null);
      if (a === 'return') return leave();
      if (a === 'drive') {
        if (!toParent({ action: 'minestOpenDynamic' })) {
          if (window.MinestDrive && MinestDrive.gallery) MinestDrive.gallery();
        }
        return;
      }
      if (a === 'voxel') return toParent({ action: 'minestOpenVoxel' });
      if (a === 'door') {
        var s = engine(), E = window.MinestOiaEditor;
        if (E && E.active) { tab('walk'); status('已进入 Walk in · 走到门前再点「开门互动」'); return; }
        if (proxy()) proxy().door(); else if (s && s.interact) s.interact(); else key('KeyE');
        return;
      }
      tab(active === a ? null : a);
    });
    if (window.MinestWorldNavigation) c.querySelector('#oia-navigation-pane').innerHTML = MinestWorldNavigation.markup('oia');
    if (proxy()) {   // what its modes are called there; no map: its light and season presets instead
      var px = proxy(), fly = c.querySelector('[data-nav-mode="fly"]'), ed = c.querySelector('[data-nav-mode="edit"]');
      if (px.kind === 'react' && fly) fly.textContent = '👁 第一人称';
      if (ed) ed.textContent = px.kind === 'react' ? '🌐 鸟瞰' : '🌐 全景';
      var mb = c.querySelector('nav [data-console="map"]'), mp = c.querySelector('#oia-map-pane');
      if (px.kind === 'react') { mb.innerHTML = '<i>🌅</i><span>光影</span>'; mp.querySelector('h3').textContent = '光影与季节'; mp.querySelector('p').textContent = '这个世界自带的时间、天气与季节'; }
      else mb.hidden = true;
      c.querySelectorAll('#oia-camera-pane .camera-actions, #oia-camera-pane label, #oia-camera-pane .camera-help').forEach(function (el) { el.hidden = true; });
      var cp = c.querySelector('#oia-camera-pane'); cp.querySelector('h3').textContent = '全局视角';
      var go = document.createElement('div'); go.className = 'camera-actions'; go.innerHTML = '<button data-proxy-view>' + (px.kind === 'react' ? '🌐 切到鸟瞰' : '🌐 切到全景') + '</button>'; cp.insertBefore(go, cp.querySelector('[data-console="walk"]'));
      go.querySelector('button').onclick = function () { window.MinestOiaEditor.explore('edit'); status('已切到全局视角'); };
    }
    document.body.appendChild(back); document.body.appendChild(toggle); document.body.appendChild(c);
    var info = c.querySelector('#oia-building-count'); setInterval(function () { var n = places().length, t = n ? n + ' 个地点 · ' + NAME : NAME; if (info.textContent !== t) info.textContent = t; var map = document.getElementById('mmWrap'), host = c.querySelector('#oia-console-map'); if (!proxy() && map && map.parentElement !== host) host.appendChild(map); }, 500);
    // the engine's own pointer lock and tour start stay out while the editing camera is on
    document.addEventListener('click', function (e) { if (window.MinestOiaEditor && MinestOiaEditor.active && e.target && e.target.id === 'gl') { e.preventDefault(); e.stopImmediatePropagation(); } }, true);
    document.addEventListener('keydown', function (e) { if (window.MinestOiaEditor && MinestOiaEditor.active && !/INPUT|TEXTAREA/.test((e.target && e.target.tagName) || '')) e.stopImmediatePropagation(); }, true);
    if (/[?&]run=1\b/.test(location.search)) {
      setTimeout(function () {
        open(true);
        tab('run');
        if (window.MinestRun && MinestRun.start) MinestRun.start(0);
      }, 700);
    }
  }
  if (document.body) build(); else document.addEventListener('DOMContentLoaded', build);
})();

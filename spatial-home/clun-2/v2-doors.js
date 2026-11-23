/* Clun 室内 2.0 · 通往更多房间的门（2026-11-23）。
   Rooms 2.0 的房间（../rooms.html：音乐工作室、会客室、前庭、后院、大教堂）以前没有入口。进屋走动时，右下「🪑 摆放」上面多一个
   「🏠 更多房间」：点开一张门牌表，点哪间就走进哪间（同一个画面里换页，带着 ?from=clun）；那边左上角的「🏡 回 Clun 小屋」回到屋里。 */
(function () {
  'use strict';
  var C = window.Clun; if (!C) return;
  var ROOMS = [
    ['yard', '🌷', '前庭', '花园与草坪，喷泉小径'], ['yard-back', '🏊', '后院', '泳池、露台与菜园'], ['living', '🛋', '会客室', '维多利亚客厅'],
    ['studio', '🎛', '音乐工作室', 'Studio · 音乐制作'], ['church', '⛪', '大教堂', '巴黎圣母院式的中殿与彩窗']
  ];
  function exploring() { var x = C._explore; return !!(x && x.st && x.st.last && performance.now() / 1000 - x.st.last < 2.5); }
  function go(id) { location.href = new URL('../rooms.html?room=' + encodeURIComponent(id) + '&from=clun', document.baseURI).href; }   /* 这页的 <base> 是 ../clun/ */
  var css = document.createElement('style');
  css.textContent = '#c2d-btn{position:fixed;z-index:40;right:max(14px,env(safe-area-inset-right));bottom:calc(max(12px,env(safe-area-inset-bottom)) + 104px);padding:7px 12px;border-radius:999px;border:1px solid rgba(255,255,255,.35);background:rgba(28,24,40,.72);color:#fff;font:600 13px/1 -apple-system,"PingFang SC",sans-serif;backdrop-filter:blur(8px);-webkit-backdrop-filter:blur(8px);cursor:pointer}' +
    '#c2d-sheet{position:fixed;inset:0;z-index:60;background:rgba(10,8,20,.45);display:flex;align-items:flex-end;justify-content:center}' +
    '#c2d-sheet[hidden]{display:none}' +
    '#c2d-in{width:min(460px,100%);background:#fbf7ef;color:#2b2233;border-radius:18px 18px 0 0;padding:14px 14px calc(16px + env(safe-area-inset-bottom));box-shadow:0 -10px 40px rgba(0,0,0,.3);font:14px/1.4 -apple-system,"PingFang SC",sans-serif}' +
    '#c2d-in h3{margin:2px 4px 10px;font-size:15px;display:flex;justify-content:space-between;align-items:center}' +
    '#c2d-in h3 button{border:0;background:#eee6da;border-radius:50%;width:30px;height:30px;font-size:15px;cursor:pointer}' +
    '#c2d-in .r{display:flex;align-items:center;gap:12px;width:100%;text-align:left;border:1px solid #e6dccd;background:#fff;border-radius:12px;padding:10px 12px;margin:6px 0;cursor:pointer;font:inherit;color:inherit}' +
    '#c2d-in .r i{font-style:normal;font-size:24px;width:30px;text-align:center}#c2d-in .r small{display:block;color:#8a7f72;font-size:12px}';
  document.head.appendChild(css);
  var btn = document.createElement('button'); btn.id = 'c2d-btn'; btn.type = 'button'; btn.textContent = '🏠 更多房间'; btn.hidden = true; btn.title = '前庭、后院、会客室、音乐工作室、大教堂';
  var sheet = document.createElement('div'); sheet.id = 'c2d-sheet'; sheet.hidden = true;
  sheet.innerHTML = '<div id="c2d-in" role="dialog" aria-label="更多房间"><h3>🏠 走到别的房间<button type="button" data-x aria-label="关闭">✕</button></h3>' +
    ROOMS.map(function (r) { return '<button type="button" class="r" data-room="' + r[0] + '"><i>' + r[1] + '</i><span><b>' + r[2] + '</b><small>' + r[3] + '</small></span></button>'; }).join('') + '</div>';
  function mount() { if (!document.body) return setTimeout(mount, 100); document.body.appendChild(btn); document.body.appendChild(sheet); }
  mount();
  ['pointerdown', 'touchstart', 'mousedown'].forEach(function (t) { btn.addEventListener(t, function (e) { e.stopPropagation(); }); sheet.addEventListener(t, function (e) { e.stopPropagation(); }); });
  btn.addEventListener('click', function (e) { e.stopPropagation(); sheet.hidden = false; });
  sheet.addEventListener('click', function (e) {
    e.stopPropagation(); var b = e.target.closest('button');
    if (e.target === sheet || (b && b.hasAttribute('data-x'))) { sheet.hidden = true; return; }
    if (b && b.dataset.room) go(b.dataset.room);
  });
  (function tick() { requestAnimationFrame(tick); var on = exploring(); btn.hidden = !on; if (!on && !sheet.hidden) sheet.hidden = true; })();
  C.V2 && (C.V2.doors = { rooms: ROOMS, go: go });
})();

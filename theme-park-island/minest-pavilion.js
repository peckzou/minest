/* 幻想工程展馆 Imagineering Pavilion & 奇想造梦工坊 Dream Workshop Portal inside Disney World (`theme-park-island`).
 * Supports:
 *  - Opening Imagineering Pavilion (`pavilion/index.html`)
 *  - Opening Dream Workshop (`../dream-workshop/index.html`) in Easy Builder mode (`?open=<id>&from=park`)
 *    OR direct first-person Immersive IP World Portal mode (`?play=<id>&from=park`) when stepping into a placed IP world in Disney World! */
(function () {
  'use strict';
  var ov = null;
  function open(which, query) {
    if (ov) close();
    var ws = which === 'workshop';
    var isPlay = ws && query && /play=/.test(query);
    try { if (document.pointerLockElement && document.exitPointerLock) document.exitPointerLock(); } catch (e) {}
    try { if (window.TPParkAPI) window.TPParkAPI.setUI(true); } catch (e) {}
    var x = document.getElementById('tp-close-guide'); if (x) x.click();
    ov = document.createElement('div'); ov.id = 'mn-pav';
    /* 梦工坊 is inside the building now: a work to edit or to walk into opens there, at the model table */
    if (ws && window.MinestImagineerBuilding) { var mm = /(open|play)=([A-Za-z0-9_-]+)/.exec(query || ''); window.MinestImagineerBuilding.enter(mm ? mm[2] : '', !!mm && mm[1] === 'play'); return; }
    var wsUrl = '../dream-workshop/index.html' + (query || '?from=park');
    ov.innerHTML = ws
      ? '<iframe src="' + wsUrl + '" title="奇想造梦工坊 Dream Workshop" allow="autoplay; fullscreen"></iframe>' +
        (isPlay ? '<button type="button" id="mn-pav-back">🏰 返回迪士尼乐园</button>' : '')
      : '<iframe src="pavilion/index.html" title="幻想工程展馆 Imagineering Pavilion" allow="autoplay; fullscreen"></iframe><button type="button" id="mn-pav-back">🏰 返回迪士尼乐园</button>';
    document.body.appendChild(ov);
    var backBtn = ov.querySelector('#mn-pav-back');
    if (backBtn) backBtn.onclick = close;
    var f = ov.querySelector('iframe');
    f.addEventListener('load', function () {
      try { f.contentWindow.addEventListener('keydown', function (e) { if (e.key === 'Escape' && !e.defaultPrevented && !ws) close(); }); } catch (e) {}
      try { f.contentWindow.focus(); } catch (e) {}
    });
  }
  function close() {
    if (!ov) return;
    ov.remove(); ov = null;
    try { if (window.TPParkAPI) window.TPParkAPI.setUI(false); } catch (e) {}
    try { window.dispatchEvent(new CustomEvent('tp:workshop-closed')); } catch (e) {}
    try { window.focus(); } catch (e) {}
  }
  document.addEventListener('keydown', function (e) { if (ov && e.key === 'Escape') { e.stopPropagation(); close(); } }, true);

  var css = document.createElement('style');
  css.textContent = '#mn-pav{position:fixed;inset:0;z-index:200;background:#0f172a;animation:mnPavIn .28s ease}' +
    '@keyframes mnPavIn{from{opacity:0;transform:scale(1.03)}to{opacity:1;transform:none}}' +
    '#mn-pav iframe{position:absolute;inset:0;width:100%;height:100%;border:0;display:block}' +
    '#mn-pav-back{position:absolute;left:50%;top:calc(env(safe-area-inset-top,0px) + 12px);transform:translateX(-50%);z-index:2;padding:9px 18px;border-radius:999px;border:1.5px solid rgba(251,191,36,.75);background:rgba(15,23,42,.92);color:#fde68a;font:800 13.5px/1 -apple-system,BlinkMacSystemFont,"PingFang SC",sans-serif;cursor:pointer;white-space:nowrap;box-shadow:0 6px 24px rgba(0,0,0,.45)}' +
    '@media (max-width:780px){#title{flex-direction:column;align-items:flex-start;gap:6px}#toast{top:96px!important}}' +
    '#mn-pav-btns{display:flex;gap:6px;flex-wrap:wrap;pointer-events:auto}' +
    '#mn-build-btn{box-shadow:0 4px 16px rgba(236,72,153,.45);padding:6px 14px;border-radius:999px;background:linear-gradient(135deg,#fbbf24,#ec4899,#8b5cf6);color:#fff;font-weight:900;font-size:12.5px;border:1px solid rgba(255,255,255,.35);cursor:pointer;text-shadow:0 1px 2px rgba(0,0,0,.35)}' +
    '#mn-dw-btn{box-shadow:0 2px 10px rgba(0,0,0,.35);padding:5px 12px;border-radius:999px;background:linear-gradient(135deg,#7c5cff,#38bdf8);color:#fff;font-weight:900;font-size:11.5px;border:none;cursor:pointer}' +
    '#mn-pav-btn{box-shadow:0 2px 10px rgba(0,0,0,.35);padding:5px 12px;border-radius:999px;background:linear-gradient(135deg,#e3b455,#ea6a52);color:#fff;font-weight:900;font-size:11.5px;border:none;cursor:pointer}';
  document.head.appendChild(css);

  function addEntries() {
    var g = document.getElementById('guide-top-btn'), card = document.getElementById('title-card');
    if (g && card && !document.getElementById('mn-pav-btn')) {
      var row = document.createElement('div'); row.id = 'mn-pav-btns';
      var buildBtn = document.createElement('button'); buildBtn.type = 'button'; buildBtn.id = 'mn-build-btn'; buildBtn.textContent = '✨ 放模型 · 造梦乐园';
      buildBtn.onclick = function (e) { e.stopPropagation(); if (window.MinestImagineerPark) window.MinestImagineerPark.toggleDrawer(); };
      var w = document.createElement('button'); w.type = 'button'; w.id = 'mn-dw-btn'; w.textContent = '🎬 造梦工坊'; w.style.display = 'none';
      w.onclick = function (e) { e.stopPropagation(); open('workshop', '?from=park'); };
      var b = document.createElement('button'); b.type = 'button'; b.id = 'mn-pav-btn'; b.textContent = '🏛️ 幻想展馆';
      b.onclick = function (e) { e.stopPropagation(); open(); };
      row.appendChild(buildBtn); row.appendChild(w); row.appendChild(b);
      card.parentNode.insertBefore(row, card.nextSibling);
    }
    var q = document.querySelector('.tp-quick-bar');
    if (q && !q.querySelector('[data-mn-pav]')) {
      var kb = document.createElement('button'); kb.type = 'button'; kb.className = 'tp-btn gold'; kb.setAttribute('data-mn-build', ''); kb.textContent = '✨ 在乐园放模型 / 建 IP 世界';
      kb.onclick = function (e) { e.stopPropagation(); var x2 = document.getElementById('tp-close-guide'); if (x2) x2.click(); if (window.MinestImagineerPark) window.MinestImagineerPark.openDrawer(); };
      q.insertBefore(kb, q.firstChild);
      var d = document.createElement('button'); d.type = 'button'; d.className = 'tp-btn cyan'; d.setAttribute('data-mn-dw', ''); d.textContent = '🏢 造梦大楼';
      d.onclick = function (e) { e.stopPropagation(); open('workshop', '?from=park'); };
      q.appendChild(d);
      var c = document.createElement('button'); c.type = 'button'; c.className = 'tp-btn pink'; c.setAttribute('data-mn-pav', ''); c.textContent = '🏛️ 幻想工程展馆';
      c.onclick = function (e) { e.stopPropagation(); open(); };
      q.appendChild(c);
    }
  }
  addEntries();
  new MutationObserver(function () { addEntries(); }).observe(document.body, { childList: true, subtree: true });
  window.MinestPavilion = {
    open: open,
    workshop: function (q) { open('workshop', q || '?from=park'); },
    playWorld: function (id) { open('workshop', '?play=' + encodeURIComponent(id) + '&from=park'); },
    editWorld: function (id) { open('workshop', '?open=' + encodeURIComponent(id) + '&from=park'); },
    close: close,
    isOpen: function () { return !!ov; }
  };
})();

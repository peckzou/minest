/* Typing Worlds (Copilot, 2026-11-12): 22 immersive 3D typing worlds with the Word List (every word you typed, copy all),
   built from tools/typing-worlds-app/ into typing-worlds/. window.MinestTypingWorldsApp.open() — and a ⌨ Typing Worlds
   button in the My World console's tool row. It keeps its own storage; the iOS bundle opens the live page. */
(function () {
  if (window.MinestTypingWorldsApp) return;
  function open() {
    if (document.getElementById('mn-tw-app')) return;
    var src = /^https?:$/.test(location.protocol) ? 'typing-worlds/index.html' : 'https://minest-app.vercel.app/typing-worlds/index.html';
    var f = document.createElement('div'); f.id = 'mn-tw-app'; f.style.cssText = 'position:fixed;inset:0;z-index:2147483560;background:#05060a';
    f.innerHTML = '<iframe src="' + src + '" style="border:0;width:100%;height:100%" title="Typing Worlds" allow="fullscreen; autoplay; clipboard-write"></iframe>' +
      '<button type="button" aria-label="Close Typing Worlds" style="position:absolute;right:12px;bottom:calc(96px + env(safe-area-inset-bottom));width:40px;height:40px;border-radius:12px;border:1px solid rgba(255,255,255,.3);background:rgba(10,12,20,.6);color:#fff;font:600 18px system-ui;backdrop-filter:blur(10px)">✕</button>';
    f.querySelector('button').onclick = function () { f.remove(); };
    document.body.appendChild(f);
    try { f.querySelector('iframe').focus(); } catch (e) {}
  }
  /* 2026-11-13: the Typing Worlds worlds now live in 3D Type (type3d/picker.js lists all of them) — no separate console
     button; anything that still calls MinestTypingWorldsApp.open() gets 3D Type with its world picker open. */
  function openViaType3D() { if (window.MinestType3D && window.MinestType3D.open) { window.MinestType3D.open('pick'); return; } open(); }
  window.MinestTypingWorldsApp = { open: openViaType3D, openDirect: open, isOpen: function () { return !!document.getElementById('mn-tw-app'); }, close: function () { var f = document.getElementById('mn-tw-app'); if (f) f.remove(); } };
})();

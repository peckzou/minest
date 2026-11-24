/* 3D Type · input methods (Chinese pinyin, handwriting, voice): the pages type from keydown and from a hidden field
   (#kb) that reports through beforeinput. An input method composes inside that field, so here
     · the field keeps the keyboard focus on a desktop too (an input method needs a text field to write into),
     · while a composition is open the page hears nothing; what the input method commits is typed as a whole,
     · the pinyin being composed shows in a small chip above the field,
     · Chinese characters wait for their stroke data (hanzi.js) before they reach the page.
   Loaded by the 3D Type pages after their #kb field (tools/type3d/patch_hanzi.py). */
(function () {
  'use strict';
  if (window.T3DIme) return;
  var kb = null, composing = false, passing = false, chip = null;
  var HAN = /[\u3007\u3400-\u9fff]|[\ud840-\ud87a][\udc00-\udfff]/;
  function field() { return kb || (kb = document.getElementById('kb')); }

  var st = document.createElement('style');
  st.textContent = '#kb{left:50%!important;bottom:72px!important}' +
    '.t3d-ime{position:fixed;left:50%;bottom:calc(env(safe-area-inset-bottom,0px) + 104px);transform:translateX(-50%);z-index:40;padding:6px 14px;border-radius:999px;' +
    'background:rgba(12,14,20,.72);color:#fff;font:500 15px/1.2 ui-sans-serif,system-ui,-apple-system,"PingFang SC","Microsoft YaHei",sans-serif;letter-spacing:.04em;' +
    'border:1px solid rgba(255,255,255,.18);-webkit-backdrop-filter:blur(10px);backdrop-filter:blur(10px);pointer-events:none;opacity:0;transition:opacity .12s}' +
    '.t3d-ime.on{opacity:1}';
  document.head.appendChild(st);
  function show(text) {
    if (!chip) { chip = document.createElement('div'); chip.className = 't3d-ime'; chip.setAttribute('aria-hidden', 'true'); document.body.appendChild(chip); }
    chip.textContent = text || ''; chip.classList.toggle('on', !!text);
  }

  function ready(text) { var H = window.T3DHanzi; if (!H) return true; return Array.from(text).every(function (c) { return !H.isHan(c) || H.has(c); }); }
  function send(text) {
    var k = field(); if (!k || !text) return;
    var go = function () {
      passing = true;
      try { k.dispatchEvent(new InputEvent('beforeinput', { data: text, inputType: 'insertText', bubbles: true, cancelable: true })); }
      finally { passing = false; }
      k.value = ' ';
    };
    var H = window.T3DHanzi;
    if (H && HAN.test(text) && !ready(text)) H.need(text).then(go, go); else go();
  }

  document.addEventListener('beforeinput', function (e) {
    if (e.target !== field() || passing) return;
    if (composing || e.isComposing || /Composition/.test(e.inputType || '')) { e.stopImmediatePropagation(); return; }   // still being composed
    if (e.data && HAN.test(e.data) && !ready(e.data)) { e.stopImmediatePropagation(); e.preventDefault(); send(e.data); }
  }, true);
  document.addEventListener('compositionstart', function (e) { if (e.target === field()) { composing = true; kb.value = ''; } }, true);
  document.addEventListener('compositionupdate', function (e) { if (e.target === field()) show(e.data); }, true);
  document.addEventListener('compositionend', function (e) {
    if (e.target !== field()) return;
    var text = e.data || '';
    show('');
    setTimeout(function () { composing = false; kb.value = ' '; send(text); }, 0);       // after the browser's own closing events
  }, true);
  document.addEventListener('keydown', function (e) {
    if (e.isComposing || e.keyCode === 229) e.stopImmediatePropagation();              // the key belongs to the input method
  }, true);

  function wantsFocus(t) { return !(t && t.closest && t.closest('a,button,input,select,textarea,[contenteditable],[role="button"]')); }
  function focus() { var k = field(); if (k && document.activeElement !== k) { try { k.focus({ preventScroll: true }); } catch (e) {} } }
  var fine = !(window.matchMedia && matchMedia('(pointer: coarse)').matches);
  if (fine) {
    addEventListener('load', focus);
    addEventListener('pointerup', function (e) { if (wantsFocus(e.target)) focus(); });
    addEventListener('focus', focus);
    document.addEventListener('keydown', function (e) { if (!e.metaKey && !e.ctrlKey && !e.altKey && document.activeElement === document.body) focus(); }, true);
  }
  addEventListener('load', function () { if (window.T3DHanzi) window.T3DHanzi.preload(); });   // the common characters, ahead of the first one typed
  window.T3DIme = { send: send, focus: focus };
})();

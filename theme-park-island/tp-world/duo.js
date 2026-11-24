/* The park on the iPhone Duo (the foldable) (2026-11-24). The same reading of the screen as Minest's own Duo page
 * (iPhoneDuo*.html): Viewport Segments / Device Posture / the native hinge report (window.__minestHinge) where there
 * is one, the measured sizes otherwise (outer 466 × 678 pt; inner 951 × 669 held sideways, a short side ≥ 600).
 *   html.duo-outer     the cover screen: a small HUD — smaller hearts, map, keys and joystick; the menu in one column
 *   html.duo-inner     the inner screen, flat: the full HUD (nothing of it lies on the hinge)
 *   html.duo-tall      the inner screen held upright
 *   html.duo-halfopen  half folded like a laptop, the hinge across: the world fills the upper half, and the lower
 *                      half is the controller — joystick, map, keys, the quest — on a dark deck
 * It follows the fold live (resize, posture and segment changes). ?duo=outer|inner|half forces one, to try it. */
(function (root) {
  'use strict';
  var R = document.documentElement, force = (/[?&]duo=(outer|inner|half)/.exec(location.search) || [])[1], API = null, last = '';
  function segs() { try { if (matchMedia('(vertical-viewport-segments: 2)').matches) return 'v'; if (matchMedia('(horizontal-viewport-segments: 2)').matches) return 'h'; } catch (e) {} return ''; }
  function posture() { var h = root.__minestHinge; if (h && h.status === 'partial') return 'folded'; try { return (navigator.devicePosture && navigator.devicePosture.type) || ''; } catch (e) { return ''; } }
  function read() {
    var w = innerWidth, h = innerHeight, mn = Math.min(w, h), mx = Math.max(w, h), touch = ('ontouchstart' in root) || navigator.maxTouchPoints > 0, s = segs();
    var inner = force === 'inner' || force === 'half' || (!force && (s || (touch && mn >= 600 && mx / mn < 1.6))), outer = force === 'outer' || (!force && !inner && touch && mn < 520 && mx < 760);
    var tall = h > w, half = force === 'half' || (!force && inner && (posture() === 'folded') && (tall || s === 'v'));
    return { inner: !!inner, outer: !!outer, tall: !!inner && tall, half: !!half, hingeV: s === 'h' && !half };
  }
  function fit() {   /* the world's picture: the whole screen, or its upper half */
    if (!API) return; var half = R.classList.contains('duo-halfopen'), w = innerWidth, h = half ? Math.round(innerHeight / 2) : innerHeight;
    try { API.renderer.setSize(w, h); API.camera.aspect = w / h; API.camera.updateProjectionMatrix(); API.canvas.style.height = h + 'px'; } catch (e) {}
  }
  function apply() {
    var k = read(), key = JSON.stringify(k) + innerWidth + 'x' + innerHeight; if (key === last) return; last = key;
    R.classList.toggle('duo-outer', k.outer); R.classList.toggle('duo-inner', k.inner); R.classList.toggle('duo-tall', k.tall); R.classList.toggle('duo-halfopen', k.half); R.classList.toggle('duo-hinge-v', k.hingeV);
    fit();
  }
  var css = document.createElement('style'), C = '#f3ecd6';
  css.textContent =
    /* the cover screen */
    'html.duo-outer #zl-hearts{font-size:14px;letter-spacing:1px;left:12px;top:calc(env(safe-area-inset-top,0px) + 10px);max-width:62vw}html.duo-outer #zl-quest{left:13px;top:calc(env(safe-area-inset-top,0px) + 50px);font-size:12.5px;max-width:70vw}html.duo-outer #zl-quest span{font-size:11px}html.duo-outer #zl-coin{right:12px;top:calc(env(safe-area-inset-top,0px) + 10px);font-size:14px}' +
    'html.duo-outer body.game-on:not(.ride-on):not(.savi-on):not(.swx-on):not(.cine-on) #mmWrap{width:92px!important;height:92px!important;right:12px!important;bottom:calc(env(safe-area-inset-bottom,0px) + 14px)!important}html.duo-outer body.game-on #mm{width:92px!important;height:92px!important}' +
    'html.duo-outer #zl-pad{width:112px;height:112px;right:8px;bottom:calc(env(safe-area-inset-bottom,0px) + 190px)!important}html.duo-outer #zl-pad .zl-k{width:36px;height:36px;line-height:34px;font-size:16px}html.duo-outer #zl-pad .u,html.duo-outer #zl-pad .d{left:38px}html.duo-outer #zl-pad .l,html.duo-outer #zl-pad .r{top:38px}html.duo-outer #zl-pad:before{left:48px;top:34px;width:14px;height:44px}html.duo-outer #zl-pad:after{left:34px;top:48px;width:44px;height:14px}' +
    'html.duo-outer #zl-plus{right:12px!important;bottom:calc(env(safe-area-inset-bottom,0px) + 116px)!important}html.duo-outer #zl-plus span{display:none}' +
    'html.duo-outer #mnt-joy{width:104px!important;height:104px!important;left:14px!important;bottom:calc(env(safe-area-inset-bottom,0px) + 18px)!important}html.duo-outer #mnt-joy i{left:29px!important;top:29px!important;width:46px!important;height:46px!important}' +
    'html.duo-outer body.game-on #mnt-btns{right:112px!important;bottom:calc(env(safe-area-inset-bottom,0px) + 18px)!important;grid-template-columns:repeat(2,42px)!important;gap:6px!important}html.duo-outer #mnt-btns button{width:42px!important;height:42px!important;font-size:13px!important}html.duo-outer #mnt-btns button.use{width:auto!important}' +
    'html.duo-outer body.game-on #toast{max-width:92vw;font-size:14px!important;padding:10px 16px!important;bottom:34%!important}html.duo-outer body.game-on #tp-action-prompt{top:58%!important;font-size:14px!important;max-width:86vw}' +
    'html.duo-outer #zm-tabs{gap:18px;font-size:13px;padding-top:calc(env(safe-area-inset-top,0px) + 14px)}html.duo-outer #zm-tabs u{display:none}html.duo-outer #zm-body{flex-direction:column;gap:10px;padding:14px 16px;top:60px}html.duo-outer #zm-list{width:auto;flex:1;min-height:0}html.duo-outer #zm-info{flex:none;max-width:none;border-left:none;border-top:1px solid rgba(243,236,214,.2);padding:10px 0 0;display:grid;grid-template-columns:54px 1fr;column-gap:12px;align-items:center}html.duo-outer #zm-info .big{font-size:40px;margin:0;grid-row:1/4}html.duo-outer #zm-info h2{font-size:17px}html.duo-outer #zm-info p{font-size:13px;margin:0}html.duo-outer #zm-info .st{margin-top:4px;justify-self:start}html.duo-outer #zm-grid{grid-template-columns:repeat(5,1fr);grid-auto-rows:64px}html.duo-outer .zm-slot{font-size:26px}html.duo-outer .zm-row{padding:9px 10px;font-size:14px}html.duo-outer #zm-foot{padding:0 14px;gap:14px;font-size:12px}' +
    'html.duo-outer #cine h1{font-size:38px}html.duo-outer #cine p{font-size:14px;padding:0 16px}html.duo-outer .gm-banner{padding:12px 24px!important;max-width:90vw}html.duo-outer .gm-banner b{font-size:17px}' +
    'html.duo-outer body.ride-on #tp-ride-bar{gap:6px!important;right:10px!important;bottom:calc(env(safe-area-inset-bottom,0px) + 10px)!important}html.duo-outer body.ride-on #tp-ride-bar .tp-btn{width:42px;height:42px;line-height:38px;font-size:17px}html.duo-outer body.ride-on #tp-ride-title{left:10px;bottom:calc(env(safe-area-inset-bottom,0px) + 62px);max-width:94vw;font-size:11px!important}' +
    'html.duo-outer #savi .top,html.duo-outer #swx .top{max-width:94vw;padding:6px 12px 8px}html.duo-outer #savi-ic{font-size:24px}html.duo-outer #savi-cap{font-size:15px}html.duo-outer #savi-act{width:72px;height:72px;font-size:32px;right:14px;bottom:24px}' +
    /* flat on the inner screen with the hinge down the middle: what was written in the middle goes to the left half */
    'html.duo-hinge-v body.game-on #toast{left:25%!important;max-width:44vw}html.duo-hinge-v body.game-on #tp-action-prompt,html.duo-hinge-v #mn-bld-prompt{left:27%!important}' +
    /* half folded, the hinge across: the world above, the controller below */
    'html.duo-halfopen #gl{height:50vh!important}html.duo-halfopen body{background:#0b0d10}' +
    'html.duo-halfopen body:after{content:"";position:fixed;left:0;right:0;top:50vh;bottom:0;z-index:5;background:linear-gradient(180deg,#14171c,#0b0d10);border-top:1px solid rgba(243,236,214,.25);pointer-events:none}' +
    'html.duo-halfopen #zl-hearts{max-width:60vw}html.duo-halfopen body.game-on #toast{bottom:calc(50vh + 16px)!important}html.duo-halfopen body.game-on #tp-action-prompt,html.duo-halfopen #mn-bld-prompt,html.duo-halfopen #mn-pb-boat{top:36vh!important}html.duo-halfopen .gm-banner{top:10vh}' +
    'html.duo-halfopen #zl-quest{left:50%;top:calc(50vh + 18px);transform:translateX(-50%);text-align:center;font-size:15px;white-space:nowrap}html.duo-halfopen #zl-quest span{margin-left:0;display:block}' +
    'html.duo-halfopen #mnt-joy{width:150px!important;height:150px!important;left:calc(env(safe-area-inset-left,0px) + 34px)!important;bottom:calc(25vh - 95px)!important}html.duo-halfopen #mnt-joy i{left:45px!important;top:45px!important;width:60px!important;height:60px!important}' +
    'html.duo-halfopen body.game-on:not(.ride-on):not(.savi-on):not(.swx-on):not(.cine-on) #mmWrap{left:50%!important;right:auto!important;margin-left:-78px;width:156px!important;height:156px!important;bottom:calc(25vh - 110px)!important}html.duo-halfopen body.game-on #mm{width:156px!important;height:156px!important}' +
    'html.duo-halfopen #zl-pad{right:calc(env(safe-area-inset-right,0px) + 30px)!important;bottom:calc(25vh + 40px)!important}html.duo-halfopen #zl-plus{right:auto!important;left:calc(env(safe-area-inset-left,0px) + 34px);bottom:calc(env(safe-area-inset-bottom,0px) + 18px)!important}' +
    'html.duo-halfopen body.game-on #mnt-btns{right:calc(env(safe-area-inset-right,0px) + 50px)!important;bottom:calc(env(safe-area-inset-bottom,0px) + 56px)!important}' +
    'html.duo-halfopen body.ride-on #tp-ride-bar{right:50%!important;transform:translateX(50%)!important;bottom:calc(25vh - 30px)!important;gap:16px!important}html.duo-halfopen body.ride-on #tp-ride-bar .tp-btn{width:60px;height:60px;line-height:56px;font-size:24px}html.duo-halfopen body.ride-on #tp-ride-title{left:50%;transform:translateX(-50%);bottom:calc(50vh - 44px);max-width:90vw}html.duo-halfopen body.ride-on #toast{bottom:calc(50vh + 14px)!important}' +
    'html.duo-halfopen #savi .top,html.duo-halfopen #swx .top{top:10px}html.duo-halfopen #savi-act{bottom:calc(25vh - 46px)}html.duo-halfopen #savi-ring,html.duo-halfopen #swx-ring{bottom:calc(50vh + 14px)}html.duo-halfopen #savi-dim,html.duo-halfopen #swx-dim{bottom:50vh}' +
    'html.duo-halfopen #cine{bottom:50vh}html.duo-halfopen #cine i.b{bottom:0}html.duo-halfopen #zm-body{top:74px;bottom:calc(50vh + 0px)}html.duo-halfopen #zm-foot{height:50vh;align-items:flex-start;padding-top:22px;font-size:15px;gap:40px;justify-content:center}html.duo-halfopen #zm-foot b{margin-right:0}html.duo-halfopen #zm-info .big{font-size:48px;margin:0 0 6px}';
  document.head.appendChild(css);
  function go(api) { API = api; last = ''; apply(); root.addEventListener('resize', function () { last = ''; setTimeout(apply, 0); }); setInterval(apply, 500);
    try { if (navigator.devicePosture) navigator.devicePosture.addEventListener('change', function () { last = ''; apply(); }); } catch (e) {} }
  apply(); if (root.TPParkAPI) go(root.TPParkAPI); else root.addEventListener('tp:park-ready', function (e) { go(e.detail || root.TPParkAPI); });
  root.TPDuo = { read: read, apply: function () { last = ''; apply(); } };
})(window);

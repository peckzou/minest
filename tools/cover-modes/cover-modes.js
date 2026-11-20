/* Minest 3D Cover display modes: 3D / Wall / Fan / Helix / Stack / Spiral / Orbit / Sphere / Wave — High-End 3D Physics & Motion */
(function () {
  'use strict';
  if (window.MinestCoverModes) return;
  var MODES = [
    ['flow', '3D'],
    ['wall', 'Wall'],
    ['fan', 'Fan'],
    ['helix', 'Helix'],
    ['stack', 'Stack'],
    ['spiral', 'Spiral'],
    ['orbit', 'Orbit'],
    ['sphere', 'Sphere'],
    ['wave', 'Wave']
  ];
  var shape = 'port'; try { shape = localStorage.getItem('minest.coverShape') === 'land' ? 'land' : 'port'; } catch (e) {}
  var KEY = 'minest.coverMode', mode = 'flow', playing = false, speed = 1, fanT = 0, ov = null, bar = null, eng = null, sig = '';
  try { mode = localStorage.getItem(KEY) || 'flow'; speed = parseFloat(localStorage.getItem('minest.coverSpeed')) || 1; } catch (e) {}

  /* the mode bar's icons (2026-11-20, the user: the bar took too much room and did not look refined) — one line each */
  var ICO = {
    flow: '<path d="M3 7.5l4-1.5v12l-4-1.5zM21 7.5l-4-1.5v12l4-1.5z"/><rect x="8.5" y="4.5" width="7" height="15" rx="1.4"/>',
    wall: '<rect x="3.5" y="4.5" width="7" height="6" rx="1.2"/><rect x="13.5" y="4.5" width="7" height="6" rx="1.2"/><rect x="3.5" y="13.5" width="7" height="6" rx="1.2"/><rect x="13.5" y="13.5" width="7" height="6" rx="1.2"/>',
    fan: '<rect x="9" y="4" width="6" height="11" rx="1.2"/><path d="M8 7.5l-4.2 1.2 2.4 9.4 4.4-1.2M16 7.5l4.2 1.2-2.4 9.4-4.4-1.2"/><path d="M8 20.5h8"/>',
    helix: '<path d="M8 3c8 3 8 6 0 9s-8 6 0 9M16 3c-8 3-8 6 0 9s8 6 0 9"/>',
    stack: '<rect x="5" y="11" width="14" height="9" rx="1.4"/><path d="M7 8h10M9 5h6"/>',
    spiral: '<path d="M12 12.5a1.5 1.5 0 1 1 1.6-1.5 3 3 0 0 1-3 3.3 4.5 4.5 0 0 1-4.6-4.6A6 6 0 0 1 12 3.8a7.6 7.6 0 0 1 7.8 7.8A9 9 0 0 1 11 20.5"/>',
    orbit: '<ellipse cx="12" cy="12" rx="9.5" ry="4.2"/><rect x="9.5" y="7" width="5" height="7" rx="1"/><circle cx="20" cy="13.6" r="1.1" fill="currentColor" stroke="none"/>',
    sphere: '<circle cx="12" cy="12" r="8.5"/><ellipse cx="12" cy="12" rx="3.6" ry="8.5"/><path d="M3.6 12h16.8"/>',
    wave: '<path d="M2.5 12c2.4-5 4.8-5 7.1 0s4.8 5 7.2 0 3.4-3.3 4.7-2"/><circle cx="9.6" cy="12" r="1" fill="currentColor" stroke="none"/>',
    play: '<path d="M8 5.5v13l10.5-6.5z" fill="currentColor" stroke="none"/>', pause: '<rect x="7" y="5.5" width="3.4" height="13" rx="1" fill="currentColor" stroke="none"/><rect x="13.6" y="5.5" width="3.4" height="13" rx="1" fill="currentColor" stroke="none"/>',
    port: '<rect x="7.5" y="3.5" width="9" height="17" rx="2"/>', land: '<rect x="3.5" y="7.5" width="17" height="9" rx="2"/>',
    style: '<path d="M12 3.5a8.5 8.5 0 1 0 0 17c1.2 0 1.6-.9 1.2-1.8-.5-1-.1-2.2 1.2-2.2H17a3.5 3.5 0 0 0 3.5-3.5c0-5.3-3.8-9.5-8.5-9.5z"/><circle cx="7.8" cy="11" r="1.1" fill="currentColor" stroke="none"/><circle cx="10.5" cy="7.4" r="1.1" fill="currentColor" stroke="none"/><circle cx="14.8" cy="7.6" r="1.1" fill="currentColor" stroke="none"/>',
    close: '<path d="M6 6l12 12M18 6L6 18"/>', lab: '<path d="M12 3l8 4.5v9L12 21l-8-4.5v-9z"/><path d="M12 12l8-4.5M12 12v9M12 12L4 7.5"/>'
  };
  var MZH = { flow: '3D 封面', wall: '卡片墙', fan: '扇形', helix: '螺旋', stack: '叠放', spiral: '旋涡', orbit: '轨道', sphere: '球体', wave: '波浪' };
  function ico(k) { return '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.6" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true">' + (ICO[k] || '') + '</svg>'; }
  function flashName(host, txt) { var n = host.querySelector('.cm-mname'); if (!n) { n = document.createElement('div'); n.className = 'cm-mname'; host.appendChild(n); } n.textContent = txt; n.classList.remove('show'); void n.offsetWidth; n.classList.add('show'); clearTimeout(n._t); n._t = setTimeout(function () { n.classList.remove('show'); }, 1300); }
  var calm = false; try { calm = matchMedia('(prefers-reduced-motion: reduce)').matches; } catch (e) {}
  /* a soft tick and a light tap when a card comes to the front (not while playing on its own) */
  var lastLand = 0;
  function land() { var n = Date.now(); if (n - lastLand < 90) return; lastLand = n; try { if (window.MinestNative && MinestNative.haptic) MinestNative.haptic('light'); } catch (e) {} try { if (window.SoundEngine && SoundEngine.play) SoundEngine.play('click'); } catch (e) {} }
  var clamp = function (x, a, b) { return Math.max(a, Math.min(b, x)); }, mix = function (a, b, k) { return a + (b - a) * k; };

  function catmull(p0, p1, p2, p3, t) {
    var t2 = t * t, t3 = t2 * t;
    return 0.5 * ((2 * p1) + (-p0 + p2) * t + (2 * p0 - 5 * p1 + 4 * p2 - p3) * t2 + (-p0 + 3 * p1 - 3 * p2 + p3) * t3);
  }

  var css = document.createElement('style');
  css.textContent =
    '#cm-bar{position:absolute;top:calc(env(safe-area-inset-top,0px) + 12px);left:50%;transform:translateX(-50%);z-index:2100;display:flex;align-items:center;gap:1px;max-width:94vw;overflow-x:auto;scrollbar-width:none;padding:3px;border-radius:14px;background:linear-gradient(180deg,rgba(28,31,40,.62),rgba(14,16,22,.62));border:1px solid rgba(255,255,255,.1);box-shadow:inset 0 1px 0 rgba(255,255,255,.08),0 10px 30px -8px rgba(0,0,0,.45);-webkit-backdrop-filter:blur(20px) saturate(160%);backdrop-filter:blur(20px) saturate(160%)}' +
    '#cm-bar::-webkit-scrollbar{display:none}' +
    '#cm-bar button,#cm-hbar button{flex:none;width:32px;height:30px;padding:0;border:0;border-radius:10px;background:none;color:rgba(232,236,245,.62);display:grid;place-items:center;cursor:pointer;transition:background .2s ease,color .2s ease}' +
    '#cm-bar button svg,#cm-hbar button svg{width:18px;height:18px;display:block}' +
    '#cm-bar button:hover{color:#fff}' +
    '#cm-bar button.on{background:linear-gradient(180deg,rgba(255,255,255,.2),rgba(255,255,255,.1));color:#fff;box-shadow:inset 0 1px 0 rgba(255,255,255,.28),0 2px 8px rgba(0,0,0,.25)}' +
    '#cm-bar .sep,#cm-hbar .sep{width:1px;height:16px;margin:0 4px;background:rgba(255,255,255,.14);flex:none}' +
    '#cm-bar .pl.on{color:#7dd3fc}' +
    '.cm-mname{position:absolute;left:50%;top:calc(100% + 8px);transform:translateX(-50%) translateY(-4px);padding:4px 10px;border-radius:8px;background:rgba(14,16,22,.7);color:#f1f5f9;font:600 11.5px -apple-system,system-ui,sans-serif;letter-spacing:.04em;white-space:nowrap;opacity:0;pointer-events:none;transition:opacity .25s ease,transform .25s ease}' +
    '.cm-mname.show{opacity:1;transform:translateX(-50%) translateY(0)}#cm-bar,#cm-hbar{overflow:visible}' +
    /* the other shape for each mode (each class is drawn in its own shape by default) */
    '#cm-ov.port .cm-wl{width:214px;height:292px;margin:-146px 0 0 -107px}#cm-ov.port .cm-hx{width:214px;height:296px;margin:-148px 0 0 -107px}' +
    '#cm-ov.port .cm-wl.wi .art,#cm-ov.port .cm-hx.wi .art{height:auto!important;bottom:78px}#cm-ov.port .cm-wl .wg,#cm-ov.port .cm-hx .wg{display:none}#cm-ov.port .cm-wl .wt,#cm-ov.port .cm-hx .wt{white-space:normal;display:-webkit-box;-webkit-line-clamp:2;-webkit-box-orient:vertical;bottom:30px;font-size:18px!important}' +
    '#cm-ov.land .cm-sp{width:330px;height:232px;margin:-116px 0 0 -165px}#cm-ov.land .cm-orb{width:244px;height:164px;margin:-82px 0 0 -122px}#cm-ov.land .cm-sph{width:204px;height:138px;margin:-69px 0 0 -102px}#cm-ov.land .cm-wav{width:244px;height:164px;margin:-82px 0 0 -122px}' +
    '#cm-ov.land .cm-fc{width:236px;height:162px;margin:-81px 0 0 -118px}#cm-ov.land .cm-fc .fa{bottom:58px}#cm-ov.land .cm-fc .fn{-webkit-line-clamp:1;bottom:22px}' +
    '#cm-ov .cm-hand{position:absolute;inset:0;z-index:1500;pointer-events:none}#cm-ov .cm-hand .cm-c{left:0;top:0;pointer-events:auto;touch-action:none;cursor:grab}' +
    '#cm-ov .cm-hand .cm-c.cm-held{box-shadow:0 30px 60px rgba(0,0,0,.45),0 0 0 1.5px rgba(255,255,255,.7),0 0 34px rgba(120,190,255,.55)!important}' +
    '#cm-ov .cm-hback{display:none;position:absolute;right:calc(env(safe-area-inset-right,0px) + 18px);bottom:calc(env(safe-area-inset-bottom,0px) + 100px);pointer-events:auto;border:1px solid rgba(255,255,255,.3);border-radius:99px;padding:8px 14px;background:rgba(20,24,34,.72);color:#fff;font:600 12.5px -apple-system,system-ui,sans-serif;-webkit-backdrop-filter:blur(10px);backdrop-filter:blur(10px)}' +
    '#cm-ov .cm-hand .cm-c.cm-held::after{content:"";position:absolute;inset:0;border-radius:inherit;pointer-events:none;z-index:20;background:linear-gradient(110deg,transparent calc(var(--hg,50%) - 22%),rgba(255,255,255,.28) var(--hg,50%),transparent calc(var(--hg,50%) + 18%));mix-blend-mode:screen!important}' +
    /* the group's joystick (2026-11-20, the user: not a long strip — a joystick): push the knob to lean the cards, the two small keys turn them, a double tap on the knob sets them straight */
    '#cm-ov .cm-gbar{position:absolute;z-index:1400;left:calc(env(safe-area-inset-left,0px) + 18px);bottom:calc(env(safe-area-inset-bottom,0px) + 100px);width:118px;height:92px;pointer-events:none}' +
    '#cm-ov .cm-gbar .js-ring{position:absolute;left:0;bottom:0;width:84px;height:84px;border-radius:50%;pointer-events:auto;touch-action:none;cursor:grab;background:radial-gradient(circle at 50% 38%,rgba(255,255,255,.12),rgba(22,26,36,.5) 72%);border:1px solid rgba(255,255,255,.16);box-shadow:inset 0 2px 12px rgba(0,0,0,.38),inset 0 -1px 0 rgba(255,255,255,.06),0 10px 26px -8px rgba(0,0,0,.55);-webkit-backdrop-filter:blur(14px) saturate(150%);backdrop-filter:blur(14px) saturate(150%);opacity:.82}' +
    '#cm-ov .cm-gbar .js-ring>svg{position:absolute;inset:0;width:100%;height:100%;color:rgba(230,238,250,.5);pointer-events:none}' +
    '#cm-ov .cm-gbar .js-knob{position:absolute;left:50%;top:50%;width:36px;height:36px;margin:-18px 0 0 -18px;border-radius:50%;pointer-events:none;background:radial-gradient(circle at 36% 30%,rgba(255,255,255,.62),rgba(175,210,255,.22) 58%,rgba(110,160,240,.14));border:1px solid rgba(255,255,255,.45);box-shadow:0 5px 14px rgba(0,0,0,.42),0 0 16px rgba(125,195,255,.32),inset 0 -3px 6px rgba(0,0,0,.18)}' +
    '#cm-ov .cm-gbar .js-dot{position:absolute;left:50%;top:50%;width:6px;height:6px;margin:-3px 0 0 -3px;border-radius:50%;background:#7dd3fc;box-shadow:0 0 8px #7dd3fc;opacity:0;pointer-events:none}' +
    '#cm-ov .cm-gbar.on .js-ring{opacity:1;cursor:grabbing}#cm-ov .cm-gbar.on .js-knob{transition:none}#cm-ov .cm-gbar.lean .js-dot{opacity:.95}#cm-ov .cm-gbar.lean .js-ring{opacity:1}' +
    '#cm-ov .cm-gbar .js-k{position:absolute;width:30px;height:30px;padding:0;border-radius:50%;pointer-events:auto;touch-action:none;display:grid;place-items:center;color:rgba(235,242,252,.85);background:rgba(22,26,36,.55);border:1px solid rgba(255,255,255,.16);box-shadow:0 6px 16px -6px rgba(0,0,0,.55);-webkit-backdrop-filter:blur(12px);backdrop-filter:blur(12px)}' +
    '#cm-ov .cm-gbar .js-k svg{width:15px;height:15px}#cm-ov .cm-gbar .js-k:active,#cm-ov .cm-gbar .js-k.hold{transform:scale(.9);background:rgba(125,195,255,.3)}' +
    '#cm-ov .cm-gbar .js-ccw{left:66px;top:-4px}#cm-ov .cm-gbar .js-cw{left:86px;top:34px}#cm-ov .cm-gbar .js-lv{left:4px;top:-30px;opacity:0;pointer-events:none;transform:scale(.7)}#cm-ov .cm-gbar.lean .js-lv{opacity:1;pointer-events:auto;transform:none;color:#7dd3fc}' +
    'html.mn-dock-v #cm-ov .cm-gbar{bottom:calc(env(safe-area-inset-bottom,0px) + 22px)}html.mn-sys-reading #cm-ov .cm-gbar{display:none}' +
    '#cm-ov .cm-hctl{position:absolute;left:0;top:0;width:300px;display:flex;gap:4px;justify-content:center;pointer-events:auto}#cm-ov .cm-hctl button{flex:none;min-width:34px;height:32px;padding:0 10px;border-radius:99px;border:1px solid rgba(255,255,255,.35);background:rgba(20,24,34,.78);color:#fff;font:600 13px -apple-system,system-ui,sans-serif;-webkit-backdrop-filter:blur(8px);backdrop-filter:blur(8px)}' +
    '#cm-ov .cm-hand.has .cm-hback{display:block}html.mn-dock-v #cm-ov .cm-hback{bottom:calc(env(safe-area-inset-bottom,0px) + 22px)}' +
    '#cm-bar input{display:none;width:56px;margin:0 6px 0 2px;accent-color:#7dd3fc;align-self:center;flex:none}#cm-bar.playing input{display:block}' +
    'body.cm-on .sf-slot[data-sf-view="coverflow"]>*:not(#cm-ov):not(#cm-bar):not(#xl){visibility:hidden!important}' +
    '#cm-ov{position:absolute;inset:0;z-index:50;overflow:hidden;touch-action:none;user-select:none;-webkit-user-select:none;background:radial-gradient(circle at 50% 42%,rgba(255,255,255,.55),transparent 68%),linear-gradient(155deg,#e2e8f0 0%,#f8fafc 50%,#cbd5e1 100%)}' +
    'body.theme-dark #cm-ov{background:radial-gradient(circle at 50% 38%,rgba(56,189,248,.14),transparent 62%),linear-gradient(160deg,#090d16 0%,#111827 52%,#0b1120 100%)!important}' +
    '#cm-ov.wall,#cm-ov.helix,#cm-ov.stack,#cm-ov.orbit,#cm-ov.sphere,#cm-ov.wave{background:radial-gradient(circle at 50% 38%,rgba(255,255,255,.72),transparent 64%),linear-gradient(160deg,#d8d6dc,#f4f3f7 55%,#dfdde4)}' +
    '#cm-fr{position:absolute;left:50%;top:50%;width:720px;height:720px;margin:-360px 0 0 -360px}' +
    '#cm-tilt{position:absolute;inset:0;perspective:1400px;transform-style:preserve-3d}' +
    '.cm-c{position:absolute;left:0;top:0;overflow:hidden;font-family:-apple-system,system-ui,sans-serif;border:1px solid rgba(255,255,255,.58);display:flex;contain:layout paint;align-items:center;justify-content:center;text-align:center;box-sizing:border-box;cursor:grab}' +
    '.cm-c .im{position:absolute;inset:0;background-size:cover;background-position:center;transition:transform .45s cubic-bezier(.22,1,.36,1)}' +
    '.cm-c:hover .im{transform:scale(1.06)}' +
    '.cm-c .sh{position:absolute;inset:0;pointer-events:none;z-index:3;background:linear-gradient(115deg,transparent 28%,rgba(255,255,255,.32) 46%,rgba(255,255,255,.04) 54%,transparent 70%);mix-blend-mode:overlay}' +
    '.cm-c .tt{position:relative;z-index:2;padding:0 16px;font:700 18px/1.22 -apple-system,system-ui,sans-serif;letter-spacing:-.01em;color:#1e293b;display:-webkit-box;-webkit-line-clamp:4;-webkit-box-orient:vertical;overflow:hidden;pointer-events:none}' +
    '.cm-c .cm-ini{position:absolute;right:10px;top:4px;font:800 64px/1 Georgia,serif;color:var(--cm-col,#64748b);opacity:.09;pointer-events:none;z-index:1}' +
    '.cm-c .cm-st{position:absolute;left:12px;right:12px;bottom:10px;z-index:2;font:600 9.5px/1.2 ui-monospace,monospace;letter-spacing:.1em;text-transform:uppercase;color:var(--cm-col,#64748b);white-space:nowrap;overflow:hidden;text-overflow:ellipsis;pointer-events:none}' +
    '.cm-c .cm-bd{position:absolute;left:0;right:0;top:0;height:5px;background:var(--cm-col,#64748b);opacity:.85;z-index:2}' +
    'body.theme-dark .cm-c .cm-st{filter:brightness(1.5)}.cm-c.hasim .cm-ini,.cm-c.hasim .cm-st,.cm-c.hasim .cm-bd{display:none}' +
    '.cm-c.hasim .tt{opacity:0}body.theme-dark .cm-c .tt{color:#fff}body.theme-dark .cm-c{border-color:rgba(255,255,255,.2)}' +
    '.cm-sp{width:242px;height:312px;margin:-156px 0 0 -121px;border-radius:26px;box-shadow:0 18px 42px rgba(15,23,42,.24)}' +
    '.cm-wl{width:300px;height:200px;margin:-100px 0 0 -150px;border-radius:24px;box-shadow:0 18px 40px rgba(15,23,42,.24);transition:box-shadow .25s ease}' +
    '.cm-wl:hover{box-shadow:0 28px 56px rgba(14,165,233,.32)}' +
    '.cm-wl.wi,.cm-hx.wi{border-radius:16px;box-shadow:0 18px 42px rgba(0,0,0,.3);background:#232429!important;border:0;backdrop-filter:none;-webkit-backdrop-filter:none;display:block;text-align:left}' +
    '.cm-wl .art,.cm-hx .art{position:absolute;left:10px;top:10px;right:10px;height:112px;border-radius:10px;background-size:cover;background-position:center;background-color:#33343a;overflow:hidden}' +
    '.cm-wl .art i,.cm-hx .art i{position:absolute;left:12px;right:40%;height:6px;border-radius:3px;background:rgba(255,255,255,.22)}' +
    '.cm-wl .wt,.cm-hx .wt{position:absolute;left:14px;right:14px;bottom:34px;font:700 21px/1.1 -apple-system,system-ui,sans-serif;color:#fff;white-space:nowrap;overflow:hidden;text-overflow:ellipsis;pointer-events:none}' +
    '.cm-wl .ws,.cm-hx .ws{position:absolute;left:14px;right:14px;bottom:14px;font:500 11px/1.2 -apple-system,system-ui,sans-serif;color:#9a9aa3;white-space:nowrap;overflow:hidden;text-overflow:ellipsis;pointer-events:none}' +
    '.cm-wl .wg,.cm-hx .wg{position:absolute;right:12px;bottom:12px;max-width:42%;font:700 8.5px ui-monospace,monospace;letter-spacing:.08em;color:#ff7a59;background:rgba(255,90,60,.16);padding:3px 6px;border-radius:5px;text-transform:uppercase;white-space:nowrap;overflow:hidden;text-overflow:ellipsis}' +
    '.cm-fn{width:178px;height:178px;margin:-89px 0 0 -89px;border-radius:32px;box-shadow:0 18px 42px rgba(15,23,42,.26)}.cm-fn .tt,.cm-hx .tt{font-size:17px}' +
    '.cm-orb{width:172px;height:220px;margin:-110px 0 0 -86px;border-radius:22px;box-shadow:0 18px 40px rgba(15,23,42,.26)}.cm-orb .tt{font-size:16px}' +
    '.cm-sph{width:152px;height:192px;margin:-96px 0 0 -76px;border-radius:20px;box-shadow:0 16px 36px rgba(15,23,42,.24)}.cm-sph .tt{font-size:15px}' +
    '.cm-wav{width:176px;height:224px;margin:-112px 0 0 -88px;border-radius:22px;box-shadow:0 18px 40px rgba(15,23,42,.25)}.cm-wav .tt{font-size:16px}' +
    '.cm-hx{backdrop-filter:none;-webkit-backdrop-filter:none;width:320px;height:212px;margin:-106px 0 0 -160px;border-radius:20px;box-shadow:0 20px 46px rgba(0,0,0,.28);backface-visibility:hidden;transition:box-shadow .25s ease}' +
    '.cm-c.act{box-shadow:0 30px 64px rgba(14,165,233,.34),0 20px 48px rgba(0,0,0,.38)}' +
    '.cm-hx .art,.cm-wl .art{animation:cmz 5.5s ease-in-out var(--cm-d,0s) infinite alternate}' +
    '.cm-hx .art i,.cm-wl .art i{animation:cmb 2s ease-in-out var(--cm-d,0s) infinite alternate}' +
    '.cm-hx .wg,.cm-wl .wg{animation:cmp 1.8s ease-in-out var(--cm-d,0s) infinite alternate}' +
    '@keyframes cmz{from{background-size:100% auto;background-position:50% 25%}to{background-size:118% auto;background-position:50% 75%}}' +
    '@keyframes cmb{from{transform:scaleX(.45);transform-origin:left}to{transform:scaleX(1);transform-origin:left}}' +
    '@keyframes cmp{from{opacity:.5}to{opacity:1}}' +
    '.cm-hx.wi .art{height:122px;left:11px;right:11px;top:11px}.cm-hx.wi .wt{font-size:21px;bottom:34px}.cm-hx.wi .ws{font-size:11px;bottom:14px}.cm-hx.wi .wg{font-size:8.5px;bottom:13px}' +
    '#cm-ov.stack .cm-c .tt{font-size:19px;-webkit-line-clamp:3}' +
    /* a picture card keeps its name: a caption over a soft shade at the foot of the picture */
    '.cm-c.hasim .tt{opacity:1;position:absolute;left:0;right:0;bottom:0;padding:34px 14px 12px;text-align:left;color:#fff!important;font-size:15px;-webkit-line-clamp:2;background:linear-gradient(180deg,transparent,rgba(8,10,16,.72));text-shadow:0 1px 2px rgba(0,0,0,.4)}' +
    '#cm-ov.spiral .cm-c.hasim .tt{font-size:19px;padding:44px 18px 16px}' +
    /* Fan (after the reference Codex built it from): a hand of cards — picture on top, name and column below */
    '.cm-fc{width:156px;height:204px;margin:-102px 0 0 -78px;border-radius:18px;background:#fff!important;border:0!important;display:block;text-align:left;box-shadow:0 14px 34px rgba(60,40,70,.22),0 2px 6px rgba(0,0,0,.08)}' +
    'body.theme-dark .cm-fc{background:#1d2230!important;box-shadow:0 18px 40px rgba(0,0,0,.45),inset 0 0 0 1px rgba(255,255,255,.06)}' +
    '.cm-fc .fa{position:absolute;left:9px;top:9px;right:9px;bottom:70px;border-radius:12px;background-size:cover;background-position:center;overflow:hidden}' +
    '.cm-fc .fa b{position:absolute;right:8px;bottom:2px;font:700 54px/1 Georgia,serif;color:#fff;opacity:.55}' +
    '.cm-fc .fn{position:absolute;left:12px;right:10px;bottom:24px;font:800 14.5px/1.12 -apple-system,system-ui,sans-serif;letter-spacing:-.01em;color:#16181d;display:-webkit-box;-webkit-line-clamp:2;-webkit-box-orient:vertical;overflow:hidden}' +
    'body.theme-dark .cm-fc .fn{color:#f1f3f7}' +
    '.cm-fc .fs{position:absolute;left:12px;right:10px;bottom:9px;font:500 10px/1.2 -apple-system,system-ui,sans-serif;color:#8a8790;white-space:nowrap;overflow:hidden;text-overflow:ellipsis}' +
    '.cm-fc.act{box-shadow:0 26px 54px rgba(60,40,70,.30),0 3px 10px rgba(0,0,0,.12)}body.theme-dark .cm-fc.act{box-shadow:0 26px 60px rgba(0,0,0,.6),0 0 0 1.5px var(--cm-col,#38bdf8)}' +
    '#cm-ov.fan{background:linear-gradient(135deg,#f6e6dc,#e9dff3 60%,#efe3d8)}' +
    '#cm-head,#cm-pills{display:none;position:absolute;z-index:1100;pointer-events:none}' +
    '#cm-ov.fan.wide #cm-head{display:block;right:6%;top:calc(env(safe-area-inset-top,0px) + 98px);width:min(300px,34%);text-align:left;font:500 26px/1.05 Georgia,"Times New Roman",serif;letter-spacing:-.01em;color:#1b1b1f;white-space:nowrap;overflow:hidden;text-overflow:ellipsis}' +
    '#cm-head i{display:block;font-style:normal;color:#a19ba3;font-size:20px;margin-top:2px;white-space:nowrap;overflow:hidden;text-overflow:ellipsis}' +
    'body.theme-dark #cm-ov.fan.wide #cm-head{color:#f3f4f7}' +
    '#cm-ov.fan #cm-pills{display:flex;left:50%;transform:translateX(-50%);bottom:calc(env(safe-area-inset-bottom,0px) + 92px);gap:3px;max-width:92%;overflow-x:auto;scrollbar-width:none;padding:4px;border-radius:99px;background:rgba(255,255,255,.55);pointer-events:auto;-webkit-backdrop-filter:blur(12px);backdrop-filter:blur(12px)}' +
    'body.theme-dark #cm-ov.fan #cm-pills{background:rgba(20,24,34,.6)}' +
    '#cm-pills::-webkit-scrollbar{display:none}#cm-pills button{flex:none;border:0;border-radius:99px;padding:6px 12px;background:none;font:600 11.5px -apple-system,system-ui,sans-serif;color:#6b6670;cursor:pointer;white-space:nowrap}' +
    'body.theme-dark #cm-pills button{color:#a3a9b8}#cm-pills button.on{background:#16181d;color:#fff}body.theme-dark #cm-pills button.on{background:#f1f3f7;color:#16181d}' +
    'html.mn-dock-v #cm-ov.fan #cm-pills{bottom:calc(env(safe-area-inset-bottom,0px) + 18px)}html.mn-sys-reading #cm-pills,html.mn-sys-reading #cm-head{display:none!important}' +
    /* the detail card stands beside the hand when there is room */
    '#cm-ov.fan #cm-det{background:#fff;border:0;box-shadow:0 18px 44px rgba(60,40,70,.22)}' +
    '#cm-ov.fan.wide #cm-det{left:auto;right:6%;top:50%;bottom:auto;transform:translateY(-42%);width:min(300px,34%);text-align:left;padding:14px 18px 18px;border-radius:20px}' +
    '#cm-det .dim{display:none;height:120px;margin:0 -6px 8px;border-radius:13px;background-size:cover;background-position:center}#cm-ov.fan.wide #cm-det .dim{display:block}#cm-det .dim.no{height:54px}' +
    '#cm-det .go{display:none;margin-top:14px;font:600 11px -apple-system,system-ui,sans-serif;color:#8a8790}#cm-ov.fan #cm-det .go{display:block}' +
    '#cm-ov.fan.wide #cm-det b{font-size:25px;line-height:1.08;margin:10px 0 10px;letter-spacing:-.02em}#cm-ov.fan #cm-det span{color:#d4623b}' +
    '#cm-det em{display:block;font-style:normal;margin-top:12px;font-size:12.5px;line-height:1.45;color:#5d5866}#cm-det em:empty{display:none}' +
    'body.theme-dark #cm-ov.fan #cm-det{background:#1d2230;box-shadow:0 18px 44px rgba(0,0,0,.45)}body.theme-dark #cm-det em{color:#a3a9b8}' +
    '#cm-ov.fan:not(.wide) #cm-det{bottom:calc(env(safe-area-inset-bottom,0px) + 142px)}html.mn-dock-v #cm-ov.fan:not(.wide) #cm-det{bottom:calc(env(safe-area-inset-bottom,0px) + 66px)}' +
    'html[data-card-style] #cm-ov .cm-c::before,html[data-card-style] #cm-ov .cm-c::after{mix-blend-mode:normal!important;filter:none!important}' +
    'html[data-card-style] #cm-ov .cm-c{-webkit-backdrop-filter:none!important;backdrop-filter:none!important}' +
    '#cm-ov.spiral #cm-trail{position:absolute;inset:0;pointer-events:none;overflow:visible}' +
    '#cm-det{position:absolute;left:50%;bottom:calc(env(safe-area-inset-bottom,0px) + 96px);width:min(340px,86%);transform:translateX(-50%);z-index:1200;background:rgba(255,255,255,.9);backdrop-filter:blur(20px);-webkit-backdrop-filter:blur(20px);border:1px solid rgba(255,255,255,.85);border-radius:22px;box-shadow:0 18px 44px rgba(15,23,42,.2);padding:14px 20px;text-align:center;box-sizing:border-box;font-family:-apple-system,system-ui,sans-serif;display:none;pointer-events:none}' +
    '#cm-ov.fan #cm-det,#cm-ov.orbit #cm-det,#cm-ov.wave #cm-det{display:block}html.mn-dock-v #cm-det{bottom:calc(env(safe-area-inset-bottom,0px) + 22px)}html.mn-sys-reading #cm-det{display:none!important}' +
    '#cm-det>*{display:block}' +
    'body.theme-dark #cm-det{background:rgba(30,36,50,.9);border-color:rgba(255,255,255,.14)}body.theme-dark #cm-det b{color:#fff}body.theme-dark #cm-det p{color:#94a3b8}#cm-det b{display:block;font:800 19px/1.18 -apple-system,system-ui,sans-serif;margin:5px 0 4px;color:#0f172a}#cm-det span{font:700 9.5px ui-monospace,monospace;color:#0284c7;letter-spacing:.12em}#cm-det p{margin:0;color:#475569;font-size:12px}';
  document.head.appendChild(css);

  function hue(s) { var h = 0; s = String(s); for (var i = 0; i < s.length; i++) h = (h * 31 + s.charCodeAt(i)) % 360; return h; }
  var itemsCache = null, itemsAt = 0, itemsKey = '';
  function items(fresh) {
    var b = null; try { b = window.MinestAI && MinestAI.board && MinestAI.board(); } catch (e) {}
    var key = b ? b.id + ':' + (b.columns || []).reduce(function (n, c) { return n + (c.cards || []).length; }, 0) : '';
    if (!fresh && itemsCache && key === itemsKey && Date.now() - itemsAt < 20000) return itemsCache;   // the same board, the same cards: not read again
    itemsAt = Date.now(); itemsKey = key; return (itemsCache = readItems());
  }
  function readItems() {
    var b = null; try { b = window.MinestAI && MinestAI.board && MinestAI.board(); } catch (e) {}
    if (!b || !window.MinestImageViews) return [];
    var list = MinestImageViews.cards(b, null, '');
    return list.map(function (c) {
      var im = MinestImageViews.image(c), src = im.thumb || im.full || '';
      var ds = String(c.description || c.desc || '').replace(/<[^>]*>/g, ' ').replace(/[#*_>`\[\]]/g, '').replace(/\s+/g, ' ').trim();
      return { raw: c, id: c.id, desc: ds.length > 150 ? ds.slice(0, 148) + '…' : ds, title: c.title || 'Untitled', sub: c.columnTitle || '', src: src, hue: hue(c.id || c.title), color: c.color || (c.background && c.background !== '#fbfaf7' ? c.background : '') || (c.columnColor || '') };
    });
  }

  var P = [[-170, 175, 1, -3], [-35, 110, .85, -2], [90, 75, .78, 1], [178, 40, .62, 4], [215, -35, .54, 8], [122, -145, .46, 14], [42, -165, .35, 18], [-13, -165, .3, 20], [-70, -145, .25, 22], [-114, -118, .21, 24], [-155, -90, .18, 26], [-198, -54, .15, 28], [-210, -18, .12, 30], [-212, 22, .095, 32], [-212, 55, .075, 34], [-212, 82, .058, 34], [-212, 104, .044, 34], [-212, 122, .033, 34], [-212, 136, .025, 34], [-212, 148, .019, 34], [-212, 156, .014, 34], [-212, 162, .01, 34]];

  /* the gyroscope (2026-11-19, the user: on the Duo, no buttons — and the gyroscope): tilting the phone leans the
     group (and a card in hand, a little) as if looking round a hologram through the screen. Measured from how you hold
     it — that slowly becomes 'straight' again when you keep still. iOS asks once, on the first touch. */
  var GY = { on: false, lr: 0, fb: 0, b0: null, x: 0, y: 0, asked: false };
  function gyroAsk() {
    if (GY.asked) return; GY.asked = true;
    try { if (window.DeviceOrientationEvent && typeof DeviceOrientationEvent.requestPermission === 'function') DeviceOrientationEvent.requestPermission().catch(function () {}); } catch (e) {}
  }
  window.addEventListener('deviceorientation', function (e) {
    if (e.beta == null || e.gamma == null) return;
    var ang = (screen.orientation && screen.orientation.angle != null) ? screen.orientation.angle : (window.orientation || 0), lr, fb;
    if (ang === 90) { lr = e.beta; fb = -e.gamma; } else if (ang === -90 || ang === 270) { lr = -e.beta; fb = e.gamma; } else if (ang === 180) { lr = -e.gamma; fb = -e.beta; } else { lr = e.gamma; fb = e.beta; }
    if (!GY.b0) GY.b0 = { lr: lr, fb: fb };
    GY.lr = lr; GY.fb = fb; GY.on = true;
  }, { passive: true });
  function gyroStep(dt) {   // degrees of lean now, eased; the rest pose drifts towards how the phone is held
    if (!GY.on || !GY.b0) return;
    var k = Math.min(1, dt * 0.35); GY.b0.lr += (GY.lr - GY.b0.lr) * k; GY.b0.fb += (GY.fb - GY.b0.fb) * k;
    var tx = clamp((GY.lr - GY.b0.lr) * 1.1, -28, 28), ty = clamp(-(GY.fb - GY.b0.fb) * 1.1, -24, 24), e = Math.min(1, dt * 8);
    GY.x += (tx - GY.x) * e; GY.y += (ty - GY.y) * e;
  }

  function Engine(box, list, m, onPick) {
    var N = list.length, fr = document.createElement('div'), tilt = document.createElement('div'), det = document.createElement('div');
    fr.id = 'cm-fr'; tilt.id = 'cm-tilt'; det.id = 'cm-det'; fr.appendChild(tilt); box.appendChild(fr); box.appendChild(det);
    var grx = 0, gry = 0, grz = 0, cgx = 0, cgy = 0, cgz = 0, gbar = null;
    var baseSc = 1, BW = 800, BH = 600, zoom = 1, aside = 0, asideT = 0, asideSide = -1, hand = [], ptrs = {}, pinch = null, lp = null, handEl = null;
    var AX = 1, PT = !box.classList.contains('land'), SX = 46, SY = -52, stepClock = 0, lastCur = null;
    var minCount = { spiral: 22, helix: 12, stack: 10, fan: 9, orbit: 12, sphere: 18, wave: 13 }[m] || N;
    var count = m === 'wall' ? Math.max(Math.ceil(Math.max(N, 20) / 5) + (Math.ceil(Math.max(N, 20) / 5) % 2), 4) * 5 : Math.max(N, minCount);
    var cards = [], time = 0, idle = 0, drag = false, vel = 0, t = 0, sel = 0, selF = 0, selV = 0, off = { x: 0, y: 0 }, ov2 = { x: 0, y: 0 }, sph = { rx: 0.18, ry: 0, vx: 0, vy: 0 }, goal = null, moved = 0, last = performance.now(), par = { x: 0, y: 0, tx: 0, ty: 0 }, hovIdx = -1, dead = false;
    var cls = { flow: 'cm-orb', spiral: 'cm-sp', wall: 'cm-wl', helix: 'cm-hx', stack: 'cm-hx', fan: 'cm-fn', orbit: 'cm-orb', sphere: 'cm-sph', wave: 'cm-wav' }[m];
    for (var i = 0; i < count; i++) {
      var it = list[i % N], el = document.createElement('div');
      el.className = 'cm-c ' + cls;
      var col = /^#[0-9a-f]{6}$/i.test(it.color) ? it.color : '#' + [0, 8, 16].map(function (o) { return ('0' + Math.round(128 + 90 * Math.sin(((it.hue + i * 23) + o * 15) * .0175)).toString(16)).slice(-2); }).join('');
      var dark = /theme-dark/.test(document.body.className);
      el.style.backgroundColor = dark ? '#161b24' : '#fbfaf7';
      el.style.backgroundImage = dark ? 'linear-gradient(135deg,' + col + '52 0%,' + col + '1e 50%,rgba(14,22,33,.88) 100%)' : 'linear-gradient(135deg,' + col + '3a 0%,' + col + '14 50%,rgba(255,255,255,.94) 100%)';
      el.style.borderColor = col + '77';
      el.innerHTML = (it.src ? '<div class="im" data-bg="' + String(it.src).replace(/"/g, '%22') + '"></div>' : '') + '<div class="cm-bd"></div><div class="cm-ini"></div><div class="sh"></div><div class="tt"></div><div class="cm-st"></div>';
      el.style.setProperty('--cm-col', col);
      if (m === 'fan') {
        el.removeAttribute('style'); el.className = 'cm-c cm-fc';
        el.style.setProperty('--cm-col', col);
        el.innerHTML = '<div class="fa"></div><div class="sh"></div><div class="fn"></div><div class="fs"></div>';
        var fa = el.querySelector('.fa');
        if (it.src) fa.setAttribute('data-bg', String(it.src).replace(/"/g, '%22'));
        else { fa.style.backgroundImage = 'linear-gradient(140deg,' + col + ',' + col + '99 55%,' + col + '55)'; fa.innerHTML = '<b></b>'; fa.firstChild.textContent = (String(it.title).trim().charAt(0) || '').toUpperCase(); }
        el.querySelector('.fn').textContent = it.title; el.querySelector('.fs').textContent = it.sub;
      } else if ((m === 'wall' || m === 'helix' || m === 'stack') && it.src) {
        el.removeAttribute('style'); el.classList.add('wi');
        el.innerHTML = '<div class="art"' + (it.src ? ' data-bg="' + String(it.src).replace(/"/g, '%22') + '"' : ' style="background-image:linear-gradient(135deg,' + col + '55,' + col + '14)"') + '>' + (it.src ? '' : '<i style="top:18px;width:46%"></i><i style="top:34px;width:30%"></i><i style="top:76px;width:38%;background:' + col + '"></i>') + '</div><div class="sh"></div><div class="wt"></div><div class="ws"></div><div class="wg"></div>';
        el.querySelector('.wt').textContent = it.title; el.querySelector('.ws').textContent = it.sub; el.querySelector('.wg').textContent = it.sub;
      } else {
        if (it.src) el.classList.add('hasim');
        el.querySelector('.tt').textContent = it.title;
        var ini = el.querySelector('.cm-ini'), st = el.querySelector('.cm-st'); if (ini) ini.textContent = (String(it.title).trim().charAt(0) || '').toUpperCase(); if (st) st.textContent = it.sub;
      }
      el.dataset.i = i % N;
      el.dataset.slot = i;
      el.style.setProperty('--cm-d', ((i % 9) * -0.68) + 's');
      (function (idx) {
        el.addEventListener('pointerenter', function () { hovIdx = idx; });
        el.addEventListener('pointerleave', function () { if (hovIdx === idx) hovIdx = -1; });
      })(i);
      tilt.appendChild(el); cards.push(el);
    }
    if (m === 'spiral' || m === 'helix' || m === 'stack' || m === 'orbit' || m === 'sphere' || m === 'wave') tilt.style.transformStyle = 'flat';
    if (m === 'sphere') tilt.style.perspective = 'none';   // the globe is drawn flat (see render)
    var head = null, pills = null, groups = [];
    if (m === 'fan') {
      head = document.createElement('div'); head.id = 'cm-head'; box.appendChild(head);
      var bt = ''; try { bt = (MinestAI.board() || {}).title || ''; } catch (e) {}
      head.textContent = bt || 'Minest'; var hi = document.createElement('i'); hi.textContent = N + ' cards'; head.appendChild(hi);
      list.forEach(function (it, k) { if (it.sub && !groups.some(function (g) { return g[0] === it.sub; })) groups.push([it.sub, k]); });
      if (groups.length > 1) {
        pills = document.createElement('div'); pills.id = 'cm-pills'; box.appendChild(pills);
        groups.slice(0, 9).forEach(function (g) { var b = document.createElement('button'); b.type = 'button'; b.textContent = g[0];
          b.addEventListener('pointerdown', function (e) { e.stopPropagation(); }); b.addEventListener('click', function (e) { e.stopPropagation(); sel = g[1]; land(); }); pills.appendChild(b); });
      }
    }
    if (m === 'spiral') {
      var tsv = document.createElementNS('http://www.w3.org/2000/svg', 'svg'); tsv.id = 'cm-trail'; tsv.setAttribute('viewBox', '0 0 720 720');
      var tp = document.createElementNS('http://www.w3.org/2000/svg', 'path'), pts = [];
      for (var q = 0; q <= (P.length - 1) * 4; q++) { var rr = sp(q / 4); pts.push((360 + SX + rr[0]).toFixed(1) + ',' + (360 + SY + rr[1]).toFixed(1)); }
      tp.setAttribute('d', 'M' + pts.join(' L')); tp.setAttribute('fill', 'none'); tp.setAttribute('stroke', 'rgba(148,163,184,.28)'); tp.setAttribute('stroke-width', '1.6'); tp.setAttribute('stroke-dasharray', '2 7'); tp.setAttribute('stroke-linecap', 'round');
      tsv.appendChild(tp); fr.insertBefore(tsv, tilt);
    }
    var detAge = 1, hxPath = null, hxPath2 = null, born = calm ? 1 : 0;
    if (m === 'helix' || m === 'orbit' || m === 'wave') {
      var sv = document.createElementNS('http://www.w3.org/2000/svg', 'svg');
      sv.setAttribute('viewBox', '0 0 720 720');
      sv.style.cssText = 'position:absolute;inset:0;pointer-events:none;overflow:visible';
      hxPath2 = document.createElementNS('http://www.w3.org/2000/svg', 'path');
      hxPath2.setAttribute('fill', 'none');
      hxPath2.setAttribute('stroke', 'rgba(56,189,248,.24)');
      hxPath2.setAttribute('stroke-width', '2.2');
      hxPath = document.createElementNS('http://www.w3.org/2000/svg', 'path');
      hxPath.setAttribute('fill', 'none');
      hxPath.setAttribute('stroke', 'rgba(60,50,60,.36)');
      hxPath.setAttribute('stroke-width', '1.4');
      hxPath.setAttribute('stroke-dasharray', '5 5');
      sv.appendChild(hxPath2);
      sv.appendChild(hxPath);
      fr.insertBefore(sv, tilt);
    }
    function fit() {
      var w = box.clientWidth || 390, h = box.clientHeight || 700; AX = clamp(w / Math.max(1, h), 1, 1.9);
      if (m === 'fan') box.classList.toggle('wide', w >= 600 && w / h > 1.05);
      var sc = m === 'wall' ? Math.max(w / 1000, h / 1100)
        : (m === 'helix' || m === 'stack') ? Math.min(w / 640, h / (PT ? 980 : 900))
        : m === 'sphere' ? Math.min((h - 96) / 640, w / 700)
        : m === 'orbit' ? Math.min((h - 220) / 390, w / (640 * AX))
        : m === 'wave' ? Math.min((h - 220) / 400, w / (720 * AX))
        : Math.min(w / 720, h / 740);
      if (box.parentNode && box.parentNode.id === 'cm-holo') sc *= 0.86;   // projected: a little smaller, so the console shows below
      baseSc = sc; BW = w; BH = h; applyFr();
    }
    /* the stage as a whole: its fitted size × the pinch zoom (the Sphere spreads: its radius grows faster than its cards)
       × 'aside' — with a card in your hand the rest shrinks and moves to one side */
    fr.style.perspective = '1600px';
    function applyFr() {
      var z = m === 'sphere' ? Math.sqrt(zoom) : zoom, k = 1 - aside * 0.6;
      fr.style.transform = 'translate(' + (aside * asideSide * BW * 0.36).toFixed(1) + 'px,' + (aside * BH * 0.06).toFixed(1) + 'px) scale(' + (baseSc * z * k).toFixed(4) + ')';
    }
    fit();

    function sp(d) {
      if (d < 0) {
        var k0 = clamp(-d, 0, 1.25), p = P[0];
        return [p[0] - k0 * 320, p[1] + k0 * 240, p[2] + k0 * .42, p[3] - k0 * 9, clamp(1 - k0 / .95, 0, 1)];
      }
      d = Math.min(d, P.length - 1.001);
      var a = Math.floor(d), k = d - a;
      var p0 = P[Math.max(0, a - 1)], p1 = P[a], p2 = P[Math.min(P.length - 1, a + 1)], p3 = P[Math.min(P.length - 1, a + 2)];
      return [
        catmull(p0[0], p1[0], p2[0], p3[0], k),
        catmull(p0[1], p1[1], p2[1], p3[1], k),
        Math.max(0.008, catmull(p0[2], p1[2], p2[2], p3[2], k)),
        catmull(p0[3], p1[3], p2[3], p3[3], k),
        1
      ];
    }

    /* Codex's rhythm for the trail: hold, then an eased glide of one place; each card a beat after the one before */
    var STEP = 0.9, HOLD = 0.5;
    function stepAt(tm) { var n = Math.floor(tm / STEP), f = clamp((tm - n * STEP - HOLD) / (STEP - HOLD), 0, 1); return n + (f < .5 ? 4 * f * f * f : 1 - Math.pow(-2 * f + 2, 3) / 2); }
    function updateDet(idx, tagPrefix) {
      var curIdx = ((Math.round(idx) % N) + N) % N, cur = list[curIdx];
      var key = tagPrefix + ':' + curIdx;
      if (det.dataset.k !== key) {
        det.dataset.k = key;
        det.innerHTML = (m === 'fan' ? '<div class="dim"></div>' : '') + '<span></span><b></b><p></p><em></em>' + (m === 'fan' ? '<div class="go">轻点卡片打开 ›</div>' : '');
        var dk = det.querySelector('.dim'); if (dk) { if (cur.src) dk.style.backgroundImage = 'url("' + String(cur.src).replace(/"/g, '%22') + '")'; else { var cc = (cards[curIdx] && cards[curIdx].style.getPropertyValue('--cm-col')) || '#94a3b8'; dk.className = 'dim no'; dk.style.backgroundImage = 'linear-gradient(140deg,' + cc + ',' + cc + '66)'; } }
        var tx = det.querySelectorAll('span,b,p,em');
        tx[0].textContent = tagPrefix + ' / ' + String(curIdx + 1).padStart(2, '0') + ' / ' + String(N).padStart(2, '0');
        tx[1].textContent = cur.title;
        tx[2].textContent = cur.sub;
        tx[3].textContent = m === 'fan' ? (cur.desc || '') : '';
        detAge = calm ? 1 : 0;
        if (!playing && det.dataset.k0) land();
        det.dataset.k0 = '1';
      }
    }

    /* a card that cannot be seen leaves the page's layers altogether (transparent cards still held a GPU layer each,
       and Sphere / Spiral with dozens of them ran a phone's web view out of memory) */
    function cull() {
      for (var i = 0; i < cards.length; i++) {
        var el = cards[i], o = el.style.opacity, off = !el._held && o !== '' && +o < 0.02;
        if (off !== (el.style.display === 'none')) el.style.display = off ? 'none' : '';
        if (!off && !el._bg) { el._bg = 1; var bgn = el.querySelector('[data-bg]'); if (bgn) bgn.style.backgroundImage = 'url("' + bgn.getAttribute('data-bg') + '")'; }
      }
    }
    function render() {
      var M = count;
      if (m === 'spiral') { var cu = Math.round(t); if (cu !== lastCur) { if (lastCur !== null && !playing) land(); lastCur = cu; } }
      if (m === 'spiral') {
        tilt.style.transform = 'rotateX(' + (-par.y * 4.2).toFixed(2) + 'deg) rotateY(' + (par.x * 4.2).toFixed(2) + 'deg)';
        cards.forEach(function (el, i) {
          var ti = (playing && !drag && goal === null) ? stepAt(stepClock - i * 0.055) : t;
          var d = (((i - ti) % M) + M) % M;
          if (d > M - 1.25) d -= M;
          var r = sp(d);
          var flt = Math.sin(time * 2.1 + i * 0.85) * (d < 4 ? 4.5 : 1.5);
          var breathe = 1 + Math.max(0, 1 - Math.abs(d)) * 0.045 * Math.sin(time * 2.4) + (hovIdx === i ? 0.05 : 0);
          var bankX = Math.sin(time * 1.5 + i) * 3.5 + (d < 0 ? d * 12 : 0);
          el.style.opacity = d > P.length - 1.2 ? 0 : r[4];
          el.style.pointerEvents = d > 6.5 ? 'none' : '';
          el.style.transform = 'translate3d(' + (360 + SX + r[0]).toFixed(1) + 'px,' + (360 + SY + r[1] + flt).toFixed(1) + 'px,0) rotateX(' + bankX.toFixed(2) + 'deg) rotateY(' + (-r[3] * .55).toFixed(2) + 'deg) rotateZ(' + (r[3] * .62).toFixed(2) + 'deg) scale(' + (r[2] * breathe).toFixed(3) + ')';
          el.style.zIndex = Math.round(1000 - d * 10);
        });
      } else if (m === 'wall') {
        tilt.style.transform = 'rotateX(' + (15 - par.y * 4.5).toFixed(2) + 'deg) rotateY(' + (11 + par.x * 5).toFixed(2) + 'deg) rotateZ(-13deg)';
        var cw = PT ? 238 : 330, ch = PT ? 318 : 238, cols = 5, rows = count / cols, W = cols * cw, H = rows * ch;
        cards.forEach(function (el, i) {
          var col = i % cols, row = Math.floor(i / cols), dir = row % 2 ? 1 : -1;
          var x = col * cw + dir * off.x + (row % 2) * 70;
          x = ((x % W) + W) % W - W / 2 - cw / 2;
          var y = ((row * ch + off.y) % H + H) % H - H / 2 - ch / 2;
          var bob = Math.sin(time * 1.65 + i * 0.78) * 9 + (hovIdx === i ? 24 : 0);
          var tiltCard = Math.cos(time * 1.3 + i * 0.6) * 2.2;
          var sc = hovIdx === i ? 1.06 : 1;
          el.style.transform = 'translate3d(' + (360 + x).toFixed(1) + 'px,' + (360 + y + bob * .35).toFixed(1) + 'px,' + bob.toFixed(1) + 'px) rotateX(' + tiltCard.toFixed(2) + 'deg) scale(' + sc + ')';
        });
      } else if (m === 'stack') {
        tilt.style.transform = 'rotateX(' + (-par.y * 3.2).toFixed(2) + 'deg) rotateY(' + (par.x * 3.8).toFixed(2) + 'deg)';
        cards.forEach(function (el, i) {
          var d = ((i - selF) % M + M) % M; if (d > M - 1.25) d -= M;
          var a = Math.max(d, 0), out = d < 0 ? -d : 0;
          var swayX = Math.sin(a * 0.5 - time * 1.3) * 10 * Math.min(a, 1);
          var fltY = Math.cos(time * 1.8 + i * 0.9) * 3;
          var sc = Math.max(0.62, 1.04 - a * 0.065 + out * 0.12 + (hovIdx === i ? 0.04 : 0));
          var pitch = Math.min(a, 1) * 5 - out * 14;
          el.style.opacity = d > 6.2 ? 0 : d < 0 ? clamp(1 - out * 1.15, 0, 1) : (a <= 3 ? 1 : clamp(1 - (a - 3) * 0.3, 0.05, 1));
          el.style.pointerEvents = d > 2.8 || d < -.5 ? 'none' : '';
          el.style.transform = 'translate3d(' + (360 + swayX).toFixed(1) + 'px,' + ((PT ? 470 : 500) - a * (PT ? 64 : 72) + out * 220 + fltY).toFixed(1) + 'px,0) perspective(1100px) rotateX(' + pitch.toFixed(2) + 'deg) scale(' + sc.toFixed(3) + ')';
          el.style.zIndex = Math.round(1000 - d * 20);
          el.classList.toggle('act', d > -.5 && d < .5);
        });
      } else if (m === 'helix') {
        var hxPts = [], hxPts2 = [];
        for (var hd = -2.5; hd <= 2.55; hd += 0.18) {
          var hth = hd * .82;
          hxPts.push((360 + Math.sin(hth) * (PT ? 205 : 245) * Math.min(AX, 1.5)).toFixed(1) + ',' + (360 - hd * (PT ? 232 : 195)).toFixed(1));
          hxPts2.push((360 + Math.sin(hth + 0.45) * (PT ? 180 : 215) * Math.min(AX, 1.5)).toFixed(1) + ',' + (360 - hd * (PT ? 232 : 195) + Math.cos(time * 1.4 + hd) * 8).toFixed(1));
        }
        if (hxPath) hxPath.setAttribute('d', 'M' + hxPts.join(' L'));
        if (hxPath2) hxPath2.setAttribute('d', 'M' + hxPts2.join(' L'));
        cards.forEach(function (el, i) {
          var d = ((i - selF) % M + M + M / 2) % M - M / 2, ad = Math.abs(d);
          var th = d * .82, R = PT ? 205 : 245;
          var bobY = Math.sin(time * 1.85 + i * 1.35) * 7;
          var bobRot = Math.cos(time * 1.35 + i * 0.95) * 2.6;
          var x = Math.sin(th) * R * Math.min(AX, 1.5) + par.x * 14 * (1 - Math.min(ad, 2) * .3);
          var y = 360 - d * (PT ? 232 : 195) + bobY + par.y * 10;
          var focus = clamp(1 - ad / .85, 0, 1);
          var rotY = Math.sin(th) * 26 * (1 - focus * .85) + par.x * 5;
          var rotZ = Math.cos(th) * d * -4 * (1 - focus * .9) + bobRot;
          var sc = 0.72 + focus * 0.34 - Math.max(0, ad - 1) * 0.06 + (hovIdx === i ? 0.04 : 0);
          el.style.opacity = ad > 2.45 ? 0 : clamp(1.18 - ad * .38, .08, 1);
          el.style.pointerEvents = ad > 2.1 ? 'none' : '';
          el.style.transform = 'translate3d(' + (360 + x).toFixed(1) + 'px,' + y.toFixed(1) + 'px,0) perspective(1100px) rotateY(' + rotY.toFixed(2) + 'deg) rotateZ(' + rotZ.toFixed(2) + 'deg) scale(' + sc.toFixed(3) + ')';
          el.style.zIndex = Math.round(1000 - ad * 100);
          el.classList.toggle('act', ad < .45);
        });
      } else if (m === 'orbit') {
        /* 6. 3D Planetary Halo Orbit Ring — card-centered perspective so cards never blow up over #cm-det */
        var oPts = [], oPts2 = [];
        for (var oa = 0; oa <= 6.32; oa += 0.16) {
          oPts.push((360 + Math.sin(oa) * 262 * AX).toFixed(1) + ',' + (268 + Math.cos(oa) * 82).toFixed(1));
          oPts2.push((360 + Math.sin(oa) * 276 * AX).toFixed(1) + ',' + (268 + Math.cos(oa) * 90 + Math.sin(oa * 3 + time * 2) * 3).toFixed(1));
        }
        if (hxPath) hxPath.setAttribute('d', 'M' + oPts.join(' L') + ' Z');
        if (hxPath2) hxPath2.setAttribute('d', 'M' + oPts2.join(' L') + ' Z');
        cards.forEach(function (el, i) {
          var d = ((i - selF) % M + M + M / 2) % M - M / 2;
          var RING = Math.min(M, 16), ang = (d / RING) * Math.PI * 2;
          if (Math.abs(d) > RING / 2) { el.style.opacity = 0; el.style.pointerEvents = 'none'; return; }
          var sinA = Math.sin(ang), cosA = Math.cos(ang);
          var flt = Math.sin(time * 2.1 + i * 0.9) * 5;
          var x = sinA * 262 * AX + par.x * 14 * cosA;
          var front = clamp((cosA + 1) * 0.5, 0, 1);
          var focus = Math.pow(front, 3.2), big = Math.pow(front, 24);   // big: only the card in front
          var y = 246 + cosA * 70 + big * 8 + flt - par.y * 10;
          var sc = 0.4 + front * 0.34 + big * 0.62 + (hovIdx === i ? 0.05 : 0);
          var rotY = -sinA * 42 * (1 - focus * 0.88) + par.x * 5;
          var rotZ = -sinA * 5.5 * (1 - focus);
          el.style.opacity = clamp(0.16 + front * 0.6 + big * 0.3, 0.16, 1).toFixed(3);
          el.style.pointerEvents = cosA < -0.15 ? 'none' : '';
          el.style.transform = 'translate3d(' + (360 + x).toFixed(1) + 'px,' + y.toFixed(1) + 'px,0) perspective(1000px) rotateY(' + rotY.toFixed(2) + 'deg) rotateZ(' + rotZ.toFixed(2) + 'deg) scale(' + sc.toFixed(3) + ')';
          el.style.zIndex = Math.round(500 + cosA * 400 + big * 200);
          el.classList.toggle('act', Math.abs(d) < 0.45);
        });
        updateDet(sel, 'ORBIT');
      } else if (m === 'sphere') {
        /* 7. 3D Fibonacci Knowledge Globe — card-centered perspective */
        var phi = Math.PI * (3 - Math.sqrt(5)), R = 292 * Math.sqrt(zoom), shrink = 0.92;   // pinched open, the globe grows round you and its cards spread
        var cosY = Math.cos(sph.ry + par.x * 0.25), sinY = Math.sin(sph.ry + par.x * 0.25);
        var cosX = Math.cos(sph.rx - par.y * 0.2), sinX = Math.sin(sph.rx - par.y * 0.2);
        var bestI = 0, bestZ = -1e9;
        cards.forEach(function (el, i) {
          var y0 = 1 - (i / Math.max(1, M - 1)) * 2;
          var r0 = Math.sqrt(Math.max(0, 1 - y0 * y0));
          var th = phi * i;
          var vx = Math.cos(th) * r0, vy = y0, vz = Math.sin(th) * r0;
          var x1 = vx * cosY + vz * sinY, z1 = -vx * sinY + vz * cosY;
          var y2 = vy * cosX - z1 * sinX, z2 = vy * sinX + z1 * cosX;
          if (z2 > bestZ) { bestZ = z2; bestI = i; }
          var breathe = 1 + Math.sin(time * 1.9 + i * 0.7) * 0.03;
          var px = x1 * R * breathe, py = y2 * R * breathe;
          var front = clamp((z2 + 1) * 0.5, 0, 1);
          var sc = (0.4 + Math.pow(front, 1.7) * 0.62) * mix(shrink, 1, Math.pow(front, 6)) + (hovIdx === i ? 0.06 : 0);
          var rotY = x1 * 38 * (1 - Math.pow(front, 4));
          var rotX = -y2 * 32 * (1 - Math.pow(front, 4));
          /* the far side is not drawn — with a margin, so a card at the rim does not flicker in and out (each time it
             came back its picture was decoded again) */
          if (el._far ? z2 > -0.2 : z2 < -0.34) el._far = !el._far;
          el.style.opacity = el._far ? 0 : clamp(0.14 + Math.pow(front, 1.4) * 0.9, 0.14, 1) * clamp((z2 + 0.34) / 0.3, 0.04, 1);
          el.style.pointerEvents = z2 < -0.05 ? 'none' : '';
          /* flat 2D: the globe's projection is worked out here, so the cards need no 3D layers of their own (dozens of
             3D layers ran a phone's web view out of memory); a slight lean and squash keep the roundness */
          el.style.transform = 'translate(' + (360 + px).toFixed(1) + 'px,' + (350 + py).toFixed(1) + 'px) rotate(' + (x1 * y2 * -10).toFixed(2) + 'deg) scale(' + (sc * (1 - Math.abs(x1) * 0.12 * (1 - front))).toFixed(3) + ',' + (sc * (1 - Math.abs(y2) * 0.12 * (1 - front))).toFixed(3) + ')';
          el.style.zIndex = Math.round(500 + z2 * 400);
        });
        cards.forEach(function (el, i) { el.classList.toggle('act', i === bestI); });
      } else if (m === 'wave') {
        /* 8. 3D Harmonic Sine Ribbon Wave — card-centered perspective */
        var wPts = [], wPts2 = [];
        for (var wd = -3.4; wd <= 3.45; wd += 0.16) {
          var ph = wd * 0.85 - time * 1.4;
          wPts.push((360 + wd * 98 * AX).toFixed(1) + ',' + (280 + Math.sin(ph) * 74).toFixed(1));
          wPts2.push((360 + wd * 98 * AX).toFixed(1) + ',' + (280 + Math.cos(ph) * 52).toFixed(1));
        }
        if (hxPath) hxPath.setAttribute('d', 'M' + wPts.join(' L'));
        if (hxPath2) hxPath2.setAttribute('d', 'M' + wPts2.join(' L'));
        cards.forEach(function (el, i) {
          var d = ((i - selF) % M + M + M / 2) % M - M / 2, ad = Math.abs(d);
          if (ad > 3.6) { el.style.opacity = 0; el.style.pointerEvents = 'none'; return; }
          el.style.pointerEvents = '';
          var ph = d * 0.85 - time * 1.4;
          var x = d * (PT ? 102 : 136) * AX + par.x * 14;
          var y = 278 + Math.sin(ph) * 72 * clamp(ad * 0.65, 0.15, 1) - par.y * 10;
          var focus = clamp(1 - ad / 0.85, 0, 1);
          var rotZ = Math.cos(ph) * 14 * (1 - focus * 0.85);
          var rotY = -d * 14 * (1 - focus * 0.85) + par.x * 5;
          var sc = 0.64 + focus * 0.4 - Math.max(0, ad - 1) * 0.06 + (hovIdx === i ? 0.05 : 0);
          el.style.opacity = clamp(3.6 - ad, 0, 1);
          el.style.transform = 'translate3d(' + (360 + x).toFixed(1) + 'px,' + y.toFixed(1) + 'px,0) perspective(1000px) rotateY(' + rotY.toFixed(2) + 'deg) rotateZ(' + rotZ.toFixed(2) + 'deg) scale(' + sc.toFixed(3) + ')';
          el.style.zIndex = Math.round(800 - ad * 100);
          el.classList.toggle('act', ad < 0.45);
        });
        updateDet(sel, 'WAVE');
      } else if (m === 'fan') {
        /* the hand: the chosen card lifted, flat and a little larger; the others tipped back and away, each a little turned */
        var wide = box.classList.contains('wide'), cx = wide ? 236 : 360, cy = wide ? 372 : 318;
        tilt.style.transform = 'rotateX(' + (-par.y * 3).toFixed(2) + 'deg) rotateY(' + (par.x * 4).toFixed(2) + 'deg)';
        cards.forEach(function (el, i) {
          var d = i - selF, a = Math.abs(d), s = d < 0 ? -1 : 1, k = Math.min(a, 1);
          if (a > 5.6) { el.style.opacity = 0; el.style.pointerEvents = 'none'; return; }
          el.style.pointerEvents = '';
          var x = (wide && d > 0 ? d * 46 + k * 74 : d * 74 + s * k * 50), z = -a * 58 - k * 92;
          var lift = -(1 - k) * 22 + Math.sin(time * 1.8 + i * .9) * (a < .5 ? 2.5 : 1.2);
          el.style.opacity = clamp(1.3 - a / 5, 0, 1).toFixed(3);
          el.style.transform = 'translate3d(' + (cx + x).toFixed(1) + 'px,' + (cy + k * 28 + lift).toFixed(1) + 'px,' + z.toFixed(1) + 'px) rotateY(' + (-s * k * 30).toFixed(2) + 'deg) rotateZ(' + (d * 1.8).toFixed(2) + 'deg) scale(' + (a < 1 ? 1.18 - a * .18 : 1).toFixed(3) + ')';
          el.style.zIndex = Math.round(1000 - a * 10);
          el.classList.toggle('act', a < .5);
        });
        updateDet(sel, 'CARD');
        if (pills) { var gi = 0, cs = ((Math.round(sel) % N) + N) % N; groups.forEach(function (g, j) { if (cs >= g[1]) gi = j; }); [].forEach.call(pills.children, function (b, j) { var on = j === gi; if (b.classList.contains('on') !== on) { b.classList.toggle('on', on); if (on && b.scrollIntoView) try { b.scrollIntoView({ block: 'nearest', inline: 'center' }); } catch (e) {} } }); }
      } else {
        tilt.style.transform = 'rotateX(' + (-par.y * 4.5).toFixed(2) + 'deg) rotateY(' + (par.x * 5).toFixed(2) + 'deg)';
        cards.forEach(function (el, i) {
          var d = i - selF, a = Math.abs(d), s = d < 0 ? -1 : 1, k = Math.min(a, 1);
          if (a > 4.3) { el.style.opacity = 0; el.style.pointerEvents = 'none'; return; }
          el.style.pointerEvents = '';
          el.style.opacity = clamp(4.3 - a, 0, 1);
          var flt = Math.sin(time * 2.2 + i * 0.9) * (a < 0.5 ? 6 : 3);
          var rotZ = clamp(d * 6.2, -20, 20);
          var rotY = clamp(-d * 10.5, -28, 28);
          var sc = (a < 1 ? 1.32 - a * .32 : Math.max(0.76, 1 - (a - 1) * 0.06)) + (hovIdx === i ? 0.05 : 0);
          el.style.transform = 'translate3d(' + (360 + d * 96 + s * k * 68).toFixed(1) + 'px,' + (288 + a * a * 5.5 + k * 8 + flt).toFixed(1) + 'px,' + (-a * 46).toFixed(1) + 'px) rotateY(' + rotY.toFixed(2) + 'deg) rotateZ(' + rotZ.toFixed(2) + 'deg) scale(' + sc.toFixed(3) + ')';
          el.style.zIndex = Math.round(1000 - a * 10);
        });
        updateDet(sel, 'COVER');
      }
    }

    /* ---- the hand: cards taken out of the layout ---- */
    function handOf(pid) { for (var i = 0; i < hand.length; i++) if (hand[i].ptr === pid) return hand[i]; return null; }
    function ensureHand() {
      if (handEl) return handEl;
      handEl = document.createElement('div'); handEl.className = 'cm-hand'; box.appendChild(handEl);
      var back = document.createElement('button'); back.type = 'button'; back.className = 'cm-hback'; back.textContent = '↺ 放回全部'; handEl.appendChild(back);
      var hp = {}, lastT = { el: null, t: 0 };
      handEl.addEventListener('pointerdown', function (e) {
        e.stopPropagation(); if (e.target.closest('.cm-hback')) { hp[e.pointerId] = { back: 1, x: e.clientX, y: e.clientY }; return; }
        var hb = e.target.closest('.cm-hctl button'); if (hb) { hp[e.pointerId] = { btn: hb, x: e.clientX, y: e.clientY }; return; }
        var el = e.target.closest('.cm-c'); if (!el || !el._hand) return; var it = el._hand;
        hp[e.pointerId] = { it: it, x: e.clientX, y: e.clientY, x0: e.clientX, y0: e.clientY, t: performance.now() };
        try { handEl.setPointerCapture(e.pointerId); } catch (x) {}
        var on = Object.keys(hp).map(function (k) { return hp[k]; }).filter(function (q) { return q.it === it; });
        if (on.length === 2) { var a = on[0], b = on[1]; it.pin = { d: Math.hypot(a.x - b.x, a.y - b.y) || 1, s: it.ts, r: it.r, ang: Math.atan2(b.y - a.y, b.x - a.x) }; }
        hand.splice(hand.indexOf(it), 1); hand.push(it);   // to the front
      });
      handEl.addEventListener('pointermove', function (e) {
        var q = hp[e.pointerId]; if (!q || q.back || q.btn) return; e.stopPropagation(); var it = q.it, dx = e.clientX - q.x, dy = e.clientY - q.y; q.x = e.clientX; q.y = e.clientY;
        var on = Object.keys(hp).map(function (k) { return hp[k]; }).filter(function (z) { return z.it === it; });
        if (on.length >= 2 && it.pin) { var a = on[0], b = on[1]; it.ts = clamp(it.pin.s * (Math.hypot(a.x - b.x, a.y - b.y) || 1) / it.pin.d, 0.5, 4); it.r = it.pin.r + (Math.atan2(b.y - a.y, b.x - a.x) - it.pin.ang) * 57.3; it.ry = clamp(it.ry + dx * 0.35, -75, 75); it.rx = clamp(it.rx - dy * 0.35, -75, 75); }
        else if (e.shiftKey) { it.ry = clamp(it.ry + dx * 0.5, -75, 75); it.rx = clamp(it.rx - dy * 0.5, -75, 75); }
        else { it.x += dx; it.y += dy; }
      });
      var endH = function (e) {
        var q = hp[e.pointerId]; if (!q) return; delete hp[e.pointerId]; e.stopPropagation();
        if (q.back) { if (Math.abs(e.clientX - q.x) + Math.abs(e.clientY - q.y) < 12) putAllBack(); return; }
        if (q.btn) { if (Math.abs(e.clientX - q.x) + Math.abs(e.clientY - q.y) < 12) { var hi = q.btn.parentNode._it, a = q.btn.getAttribute('data-h'); if (hi) { if (a === 'minus') hi.ts = clamp(hi.ts / 1.25, 0.5, 4); else if (a === 'plus') hi.ts = clamp(hi.ts * 1.25, 0.5, 4); else if (a === 'ccw') hi.r -= 15; else if (a === 'cw') hi.r += 15; else if (a === 'tilt') { hi.ry = hi.ry > 20 ? -35 : hi.ry < -20 ? 0 : 35; hi.rx = hi.ry ? 12 : 0; } else if (a === 'level') { hi.r = 0; hi.rx = 0; hi.ry = 0; } else putBack(hi); } } return; }
        var it = q.it; if (!Object.keys(hp).some(function (k) { return hp[k].it === it; })) { it.pin = null; if (Math.abs(q.x - q.x0) + Math.abs(q.y - q.y0) >= 10 && dropBack(it)) return; }
        if (Math.abs(q.x - q.x0) + Math.abs(q.y - q.y0) < 10 && performance.now() - q.t < 320) {
          var now = performance.now();
          if (lastT.el === it.el && now - lastT.t < 330) { lastT = { el: null, t: 0 }; putBack(it); }   // double tap: back into the layout
          else { lastT = { el: it.el, t: now }; var el0 = it.el; setTimeout(function () { if (lastT.el === el0 && onPick) { lastT = { el: null, t: 0 }; onPick(list[+el0.dataset.i]); } }, 340); }   // a tap: open it
        }
      };
      handEl.addEventListener('pointerup', endH); handEl.addEventListener('pointercancel', endH);
      handEl.addEventListener('wheel', function (e) { var el = e.target.closest('.cm-c'); if (!el || !el._hand) return; e.preventDefault(); e.stopPropagation(); if (e.shiftKey) el._hand.r += (e.deltaY || e.deltaX || 0) * 0.15; else el._hand.ts = clamp(el._hand.ts * Math.exp(-(e.deltaY || 0) * 0.0015), 0.5, 4); }, { passive: false });
      handEl.addEventListener('click', function (e) { e.stopPropagation(); });
      return handEl;
    }
    function pickUp(el, pid, x, y) {
      ensureHand();
      var r = el.getBoundingClientRect(), br = box.getBoundingClientRect(), w0 = el.offsetWidth || 1, s0 = Math.max(0.5, r.width / w0);
      el._held = true; el.classList.add('cm-held'); handEl.appendChild(el);
      var it = { el: el, x: r.left - br.left + r.width / 2, y: r.top - br.top + r.height / 2, s: s0, s0: Math.max(1, s0), ts: Math.max(1, s0) * 1.22, r: 0, rx: 0, ry: 0, crx: 0, cry: 0, cr: 0, ptr: pid, px: x, py: y };
      el._hand = it; hand.push(it);
      var ctl = document.createElement('div'); ctl.className = 'cm-hctl'; ctl.innerHTML = '<button type="button" data-h="minus" aria-label="缩小">−</button><button type="button" data-h="plus" aria-label="放大">＋</button><button type="button" data-h="ccw" aria-label="向左转">⟲</button><button type="button" data-h="cw" aria-label="向右转">⟳</button><button type="button" data-h="tilt" aria-label="翻转查看">3D</button><button type="button" data-h="level">摆正</button><button type="button" data-h="back">↩ 放回</button>'; ctl._it = it; handEl.appendChild(ctl); it.ctl = ctl;
      asideSide = it.x > BW / 2 ? -1 : 1; asideT = 1;   // the rest goes small, to the other side
      try { if (window.MinestNative && MinestNative.haptic) MinestNative.haptic('medium'); } catch (e) {}
      return it;
    }
    /* dropped onto the shrunk stage, a card goes back into the layout */
    function dropBack(it) {
      if (aside < 0.5) return false; var r = fr.getBoundingClientRect(), br = box.getBoundingClientRect(), x = it.x + br.left, y = it.y + br.top;
      if (x > r.left && x < r.right && y > r.top && y < r.bottom) { putBack(it); return true; } return false;
    }
    function putBack(it) {
      if (hand.indexOf(it) < 0) return; hand.splice(hand.indexOf(it), 1); it.el._held = false; it.el._hand = null; it.el.classList.remove('cm-held'); tilt.appendChild(it.el); if (it.ctl) it.ctl.remove();
      if (!hand.length) asideT = 0;
    }
    function putAllBack() { hand.slice().forEach(putBack); asideT = 0; }
    /* ---- the whole group's angle ---- */
    function groupLean(dt) {
      joyStep(dt); var k = Math.min(1, dt * 9); cgx += (grx - cgx) * k; cgy += (gry - cgy) * k; cgz += (grz - cgz) * k; gyroStep(dt);
      var ax = cgx + GY.y, ay = cgy + GY.x;   // your lean + the phone's
      if (Math.abs(ax) + Math.abs(ay) + Math.abs(cgz) > 0.05) tilt.style.transform = (tilt.style.transform || '') + ' rotateX(' + ax.toFixed(2) + 'deg) rotateY(' + ay.toFixed(2) + 'deg) rotateZ(' + cgz.toFixed(2) + 'deg)';
      if (gbar) gbar.classList.toggle('lean', Math.abs(grx) + Math.abs(gry) + Math.abs(grz) > 0.5);
    }
    gbar = document.createElement('div'); gbar.className = 'cm-gbar';
    var jsI = function (p) { return '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.8" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true">' + p + '</svg>'; };
    gbar.innerHTML = '<div class="js-ring" role="slider" aria-label="卡组角度 · 推动摇杆倾斜，双击摆正"><svg viewBox="0 0 84 84" aria-hidden="true"><path d="M38.5 10.5L42 7l3.5 3.5M38.5 73.5L42 77l3.5-3.5M10.5 38.5L7 42l3.5 3.5M73.5 38.5L77 42l-3.5 3.5" fill="none" stroke="currentColor" stroke-width="1.6" stroke-linecap="round" stroke-linejoin="round"/><circle cx="42" cy="42" r="25" fill="none" stroke="currentColor" stroke-width=".8" stroke-dasharray="1.5 4.2" opacity=".55"/></svg><i class="js-dot"></i><i class="js-knob"></i></div>' +
      '<button type="button" class="js-k js-ccw" data-g="ccw" aria-label="卡组 · 向左转">' + jsI('<path d="M4 12a8 8 0 1 0 2.4-5.7"/><path d="M4 4v4.5h4.5"/>') + '</button>' +
      '<button type="button" class="js-k js-cw" data-g="cw" aria-label="卡组 · 向右转">' + jsI('<path d="M20 12a8 8 0 1 1-2.4-5.7"/><path d="M20 4v4.5h-4.5"/>') + '</button>' +
      '<button type="button" class="js-k js-lv" data-g="lv" aria-label="卡组 · 摆正">' + jsI('<rect x="5" y="7" width="14" height="10" rx="2"/><path d="M2.5 12h2M19.5 12h2"/>') + '</button>';
    box.appendChild(gbar);
    var joy = { x: 0, y: 0, on: false, id: null, rot: 0, lastTap: 0 }, jRing = gbar.querySelector('.js-ring'), jKnob = gbar.querySelector('.js-knob'), jDot = gbar.querySelector('.js-dot');
    function level() { grx = gry = grz = 0; try { if (window.MinestNative && MinestNative.haptic) MinestNative.haptic('light'); } catch (e) {} }
    (function () {
      var R0 = 26, t0 = 0, moved = 0;
      function at(e) { var r = jRing.getBoundingClientRect(), dx = e.clientX - (r.left + r.width / 2), dy = e.clientY - (r.top + r.height / 2), d = Math.hypot(dx, dy); if (d > R0) { dx *= R0 / d; dy *= R0 / d; } joy.x = dx / R0; joy.y = dy / R0; moved = Math.max(moved, d); joy.kx = dx; joy.ky = dy; joy.back = 0; jKnob.style.transform = 'translate(' + dx.toFixed(1) + 'px,' + dy.toFixed(1) + 'px)'; }
      jRing.addEventListener('pointerdown', function (e) { e.stopPropagation(); e.preventDefault(); joy.on = true; joy.id = e.pointerId; t0 = performance.now(); moved = 0; try { jRing.setPointerCapture(e.pointerId); } catch (er) {} gbar.classList.add('on'); at(e); });
      jRing.addEventListener('pointermove', function (e) { e.stopPropagation(); if (joy.on && e.pointerId === joy.id) at(e); });
      function up(e) { e.stopPropagation(); if (!joy.on || e.pointerId !== joy.id) return; joy.on = false; joy.x = joy.y = 0; gbar.classList.remove('on'); joy.back = 1;
        var now = performance.now(); if (now - t0 < 260 && moved < 30) { if (now - joy.lastTap < 360) { level(); joy.lastTap = 0; } else joy.lastTap = now; } }
      jRing.addEventListener('pointerup', up); jRing.addEventListener('pointercancel', up);
      [].forEach.call(gbar.querySelectorAll('.js-k'), function (b) {
        var g = b.getAttribute('data-g'), dir = g === 'ccw' ? -1 : g === 'cw' ? 1 : 0;
        b.addEventListener('pointerdown', function (e) { e.stopPropagation(); e.preventDefault(); if (!dir) { level(); return; } try { b.setPointerCapture(e.pointerId); } catch (er) {} b.classList.add('hold'); grz += dir * 8; joy.rot = dir; joy.rotAt = performance.now(); });
        function stop(e) { e.stopPropagation(); b.classList.remove('hold'); if (joy.rot === dir) joy.rot = 0; }
        b.addEventListener('pointerup', stop); b.addEventListener('pointercancel', stop);
      });
      gbar.addEventListener('click', function (e) { e.stopPropagation(); });
    })();
    /* each frame: the knob's push leans the group (a held key turns it); the dot shows where the group leans now */
    function joyStep(dt) {
      if (joy.on) { gry = clamp(gry + joy.x * 95 * dt, -70, 70); grx = clamp(grx - joy.y * 75 * dt, -60, 60); }
      if (joy.back && (joy.kx || joy.ky)) { var q = Math.min(1, dt * 14); joy.kx -= joy.kx * q; joy.ky -= joy.ky * q; if (Math.abs(joy.kx) + Math.abs(joy.ky) < 0.3) { joy.kx = joy.ky = 0; joy.back = 0; } jKnob.style.transform = joy.kx || joy.ky ? 'translate(' + joy.kx.toFixed(1) + 'px,' + joy.ky.toFixed(1) + 'px)' : ''; }
      if (joy.rot && performance.now() - joy.rotAt > 260) grz += joy.rot * 70 * dt;
      jDot.style.transform = 'translate(' + (gry / 70 * 26).toFixed(1) + 'px,' + (-grx / 60 * 26).toFixed(1) + 'px)';
    }
    function handRender(dt) {
      if (Math.abs(asideT - aside) > 0.001) { aside += (asideT - aside) * Math.min(1, dt * 8); applyFr(); }
      if (handEl) handEl.classList.toggle('has', hand.length > 0);
      hand.forEach(function (it, z) {
        it.s += (it.ts - it.s) * Math.min(1, dt * 10);
        if (it.ptr == null) { var hx = Math.max(50, Math.min(BW - 50, it.x)), hy = Math.max(70, Math.min(BH - 70, it.y)); it.x += (hx - it.x) * Math.min(1, dt * 10); it.y += (hy - it.y) * Math.min(1, dt * 10); }   // let go off screen: it drifts back into view
        var el = it.el, st = el.style; st.display = ''; st.opacity = '1'; st.filter = ''; st.zIndex = String(3000 + z); st.pointerEvents = 'auto';
        var ek = Math.min(1, dt * 12), idle = it.ptr == null && !Object.keys(ptrs).length ? 1 : 0, tnow = performance.now() / 1000;
        it.crx += (it.rx + GY.y * 0.6 + idle * Math.sin(tnow * 0.9 + z) * 3 - it.crx) * ek; it.cry += (it.ry + GY.x * 0.6 + idle * Math.sin(tnow * 0.7 + z * 2) * 4 - it.cry) * ek; it.cr += (it.r - it.cr) * ek;
        st.transform = 'translate(' + it.x.toFixed(1) + 'px,' + it.y.toFixed(1) + 'px) perspective(900px) rotateX(' + it.crx.toFixed(2) + 'deg) rotateY(' + it.cry.toFixed(2) + 'deg) rotate(' + it.cr.toFixed(2) + 'deg) scale(' + it.s.toFixed(3) + ')' + (it.ptr != null ? ' translateZ(18px)' : '');
        st.boxShadow = (-it.cry * 0.5).toFixed(1) + 'px ' + (28 + it.crx * 0.5).toFixed(1) + 'px 60px rgba(0,0,0,.45),0 0 0 1.5px rgba(255,255,255,.65),0 0 34px rgba(120,190,255,.5)';
        st.setProperty('--hg', (50 + it.cry * 0.9 - it.crx * 0.4).toFixed(1) + '%');
        if (it.ctl) { var hh2 = (el.offsetHeight || 200) / 2 * it.s; it.ctl.style.transform = 'translate(' + (it.x - 150).toFixed(1) + 'px,' + Math.min(BH - 52, it.y + hh2 + 12).toFixed(1) + 'px)'; it.ctl.style.zIndex = String(3100 + z); }
      });
    }

    var rafId = 0;
    function tick() {
      if (dead) return;
      rafId = requestAnimationFrame(tick);
      var now = performance.now(), dt = Math.min(.05, (now - last) / 1000); last = now; if (!calm) time += dt;
      if (document.hidden) return;
      if (detAge < 1) { detAge = Math.min(1, detAge + dt / 0.32); var de = 1 - Math.pow(1 - detAge, 3); [].forEach.call(det.children, function (c) { c.style.opacity = de.toFixed(3); c.style.transform = 'translateY(' + ((1 - de) * 6).toFixed(1) + 'px)'; }); }
      if (born < 1) { born = Math.min(1, born + dt / 0.45); var e = 1 - Math.pow(1 - born, 3); tilt.style.translate = '0 ' + ((1 - e) * 22).toFixed(1) + 'px'; if (born >= 1) tilt.style.translate = ''; }   // a rise, no fade: fading the stage made the browser flatten and redraw every card
      par.x += (par.tx - par.x) * Math.min(1, dt * 8);
      par.y += (par.ty - par.y) * Math.min(1, dt * 8);
      if (!drag) {
        if (idle > 0) idle -= dt;
        if (m === 'sphere') {
          if (playing) { sph.ry += dt * speed * 0.55; sph.rx = 0.18 + Math.sin(time * 0.6) * 0.22; }
          sph.ry += sph.vy; sph.rx = clamp(sph.rx + sph.vx, -1.1, 1.1);
          sph.vy *= Math.pow(.12, dt); sph.vx *= Math.pow(.12, dt);
        } else if (playing && goal === null && m !== 'fan') {
          vel = 0;
          if (m === 'spiral') { stepClock += dt * speed; t = stepAt(stepClock); }
          else sel += dt * speed * .72;
        } else if (playing && m === 'fan') {
          fanT += dt * speed;
          if (fanT > 1.25) { fanT = 0; sel = sel >= count - 1 ? 0 : Math.round(sel) + 1; }
        } else if (m === 'spiral') {
          if (goal !== null) { t += (goal - t) * Math.min(1, dt * 9); if (Math.abs(goal - t) < .003) { t = goal; goal = null; } }
          else { vel *= Math.pow(.08, dt); t += vel * dt * 60; if (Math.abs(vel) < .004) t += (Math.round(t) - t) * Math.min(1, dt * 9); }
        } else if (m === 'helix' || m === 'stack' || m === 'orbit' || m === 'wave') {
          if (goal !== null) { sel += (goal - sel) * Math.min(1, dt * 9); if (Math.abs(goal - sel) < .003) { sel = goal; goal = null; } }
          else { vel *= Math.pow(.06, dt); sel += vel * dt * 60; if (Math.abs(vel) < .004) sel += (Math.round(sel) - sel) * Math.min(1, dt * 9); }
        }
        if (m === 'wall') {
          if (playing) { off.x += dt * speed * 48; off.y -= dt * speed * 22; }
          off.x += ov2.x; off.y += ov2.y; ov2.x *= Math.pow(.16, dt); ov2.y *= Math.pow(.16, dt);
        }
        if (m === 'fan') { selV += (sel - selF) * 260 * dt; selV *= Math.exp(-20 * dt); selF += selV * dt; }
        else if (m === 'helix' || m === 'stack' || m === 'orbit' || m === 'wave') { selV += (sel - selF) * 210 * dt; selV *= Math.exp(-18 * dt); selF += selV * dt; }
      } else if (m === 'fan' || m === 'helix' || m === 'stack' || m === 'orbit' || m === 'wave') {
        selF += (sel - selF) * Math.min(1, dt * 18); selV = 0;
      }
      tilt.style.transform = ''; render(); cull(); handRender(dt); groupLean(dt);
    }
    rafId = requestAnimationFrame(tick);

    function hoverMove(e) {
      var r = box.getBoundingClientRect();
      par.tx = clamp(((e.clientX - r.left) / (r.width || 1) - .5) * 2, -1, 1);
      par.ty = clamp(((e.clientY - r.top) / (r.height || 1) - .5) * 2, -1, 1);
    }
    box.addEventListener('pointermove', hoverMove);
    var px = 0, py = 0;
    box.addEventListener('pointerdown', down); box.addEventListener('pointermove', move); box.addEventListener('pointerup', up); box.addEventListener('pointercancel', up);
    function down(e) {
      gyroAsk();
      if (e.target.closest('#cm-bar') || e.target.closest('#cm-pills') || e.target.closest('.cm-hand') || e.target.closest('#xl')) return;
      var ce0 = e.target.closest && e.target.closest('.cm-c');
      ptrs[e.pointerId] = { x: e.clientX, y: e.clientY, card: ce0 && !ce0._held ? ce0 : null };
      var ids = Object.keys(ptrs);
      if (ids.length === 2 && ptrs[ids[0]].card && ptrs[ids[0]].card === ptrs[ids[1]].card) {   // two fingers on one card: take it out, and they scale it
        var pa = ptrs[ids[0]], pb = ptrs[ids[1]], it2 = pickUp(pa.card, null, (pa.x + pb.x) / 2, (pa.y + pb.y) / 2);
        pinch = { item: it2, d: Math.hypot(pa.x - pb.x, pa.y - pb.y) || 1, s: it2.ts }; drag = false; clearTimeout(lp); lp = null; return;
      }
      if (ids.length === 2) {   // two fingers: pinch the whole mode open or closed
        var a = ptrs[ids[0]], b = ptrs[ids[1]]; pinch = { d: Math.hypot(a.x - b.x, a.y - b.y) || 1, z: zoom, mx: (a.x + b.x) / 2, my: (a.y + b.y) / 2, ang: Math.atan2(b.y - a.y, b.x - a.x) }; drag = false; clearTimeout(lp); lp = null; return;
      }
      if (m === 'spiral' && playing) { t = stepAt(stepClock); } px = e.clientX; py = e.clientY; vel = 0; ov2.x = ov2.y = 0; sph.vx = sph.vy = 0; goal = null; moved = 0; drag = true; try { box.setPointerCapture(e.pointerId); } catch (x) {}
      /* press and hold a card: it comes out of the layout into your hand */
      var ce = e.target.closest && e.target.closest('.cm-c'), pid = e.pointerId;
      clearTimeout(lp); lp = ce && !ce._held && aside < 0.5 ? setTimeout(function () { lp = null; if (moved < 9) { drag = false; pickUp(ce, pid, px, py); } }, 380) : null;
    }
    function move(e) {
      if (ptrs[e.pointerId]) { ptrs[e.pointerId].x = e.clientX; ptrs[e.pointerId].y = e.clientY; }
      if (pinch) { var ids = Object.keys(ptrs); if (ids.length >= 2) { var a = ptrs[ids[0]], b = ptrs[ids[1]], dd = Math.hypot(a.x - b.x, a.y - b.y) || 1;
        if (pinch.item) { var br0 = box.getBoundingClientRect(); pinch.item.ts = clamp(pinch.s * dd / pinch.d, 0.5, 4); pinch.item.x = (a.x + b.x) / 2 - br0.left; pinch.item.y = (a.y + b.y) / 2 - br0.top; }
        else { zoom = clamp(pinch.z * dd / pinch.d, 0.55, 3.4); applyFr();
          var mx = (a.x + b.x) / 2, my = (a.y + b.y) / 2, an = Math.atan2(b.y - a.y, b.x - a.x), da = an - pinch.ang; if (da > Math.PI) da -= 2 * Math.PI; if (da < -Math.PI) da += 2 * Math.PI;
          gry = clamp(gry + (mx - pinch.mx) * 0.25, -70, 70); grx = clamp(grx - (my - pinch.my) * 0.25, -60, 60); grz += da * 57.3; pinch.mx = mx; pinch.my = my; pinch.ang = an; } } return; }
      var hh = handOf(e.pointerId); if (hh) { hh.x += e.clientX - hh.px; hh.y += e.clientY - hh.py; hh.px = e.clientX; hh.py = e.clientY; return; }
      if (!drag) return;
      var dx = e.clientX - px, dy = e.clientY - py; px = e.clientX; py = e.clientY; moved += Math.abs(dx) + Math.abs(dy);
      if (e.shiftKey) { gry = clamp(gry + dx * 0.3, -70, 70); grx = clamp(grx - dy * 0.3, -60, 60); return; }
      if (m === 'spiral') { var s = -(dx - dy) / 210; t += s; vel = s; }
      else if (m === 'wall') { off.x += dx; off.y += dy; ov2.x = dx; ov2.y = dy; }
      else if (m === 'sphere') { sph.ry += dx * 0.0065; sph.rx = clamp(sph.rx - dy * 0.0065, -1.1, 1.1); sph.vy = dx * 0.003; sph.vx = -dy * 0.003; }
      else if (m === 'helix') { var hs = (-dx + dy) / 72; sel += hs; vel = hs; }
      else if (m === 'stack') { var ss = (-dx + dy * .6) / 60; sel += ss; vel = ss; }
      else if (m === 'orbit' || m === 'wave') { var os = -dx / 68; sel += os; vel = os; }
      else sel = clamp(sel - dx / 70, 0, count - 1);
    }
    function up(e) {
      delete ptrs[e.pointerId]; clearTimeout(lp); lp = null;
      if (pinch) { if (Object.keys(ptrs).length < 2) { pinch = null; drag = false; } return; }
      var hh = handOf(e.pointerId); if (hh) { hh.ptr = null; if (!dropBack(hh)) hh.ts = Math.max(hh.ts, hh.s0 * 1.08); return; }   // let go: it stays where you put it (or goes back, dropped on the stage)
      if (!drag) return; drag = false;
      if (aside > 0.5 && moved < 6) { asideT = 0; return; }   // a tap on the shrunk stage brings it back
      if (m === 'fan') sel = Math.round(sel);
      if (moved < 6) {
        var c = document.elementFromPoint(e.clientX, e.clientY), el = c && c.closest && c.closest('.cm-c');
        if (!el) return;
        var slotIdx = +el.dataset.slot, itemIdx = +el.dataset.i, base = m === 'spiral' ? t : sel, cur = ((Math.round(base) % count) + count) % count;
        if (m === 'wall' || m === 'sphere' || slotIdx === cur) { if (onPick) onPick(list[itemIdx]); return; }
        if (m === 'fan') sel = slotIdx;
        else { var dd = (((slotIdx - base) % count) + count + count / 2) % count - count / 2; goal = base + dd; }
      }
    }
    function wheel(e) {
      e.preventDefault(); var dx = e.deltaX || 0, dy = e.deltaY || 0;
      if (e.ctrlKey) { zoom = clamp(zoom * Math.exp(-dy * 0.01), 0.55, 3.4); applyFr(); return; }   // a trackpad pinch
      if (m === 'wall') { off.x -= dx; off.y -= dy; return; }
      if (m === 'sphere') { sph.ry -= dx * 0.004; sph.rx = clamp(sph.rx + dy * 0.004, -1.1, 1.1); return; }
      var k = (Math.abs(dx) > Math.abs(dy) ? dx : dy);
      if (m === 'fan') sel = clamp(Math.round(sel) + (k > 0 ? 1 : -1), 0, count - 1);
      else if (m === 'spiral') { goal = Math.round(goal === null ? t : goal) + (k > 0 ? 1 : -1); }
      else goal = Math.round(goal === null ? sel : goal) + (k > 0 ? 1 : -1);
    }
    box.addEventListener('wheel', wheel, { passive: false });
    function key(e) {
      var k = e.key; if (!/^Arrow(Left|Right|Up|Down)$/.test(k) || /input|textarea|select/i.test((e.target && e.target.tagName) || '') || (e.target && e.target.isContentEditable)) return;
      e.preventDefault(); var f = (k === 'ArrowRight' || k === 'ArrowDown') ? 1 : -1;
      if (m === 'wall') { var a = k === 'ArrowLeft' || k === 'ArrowRight'; ov2.x += a ? -f * 14 : 0; ov2.y += a ? 0 : -f * 14; return; }
      if (m === 'sphere') { if (k === 'ArrowLeft' || k === 'ArrowRight') sph.vy += -f * 0.04; else sph.vx += f * 0.04; return; }
      if (m === 'fan') sel = clamp(Math.round(sel) + f, 0, count - 1);
      else if (m === 'spiral') goal = Math.round(goal === null ? t : goal) + f;
      else goal = Math.round(goal === null ? sel : goal) + f;
    }
    document.addEventListener('keydown', key);
    return { destroy: function () { dead = true; cancelAnimationFrame(rafId); box.removeEventListener('pointermove', hoverMove); box.removeEventListener('pointerdown', down); box.removeEventListener('pointermove', move); box.removeEventListener('pointerup', up); box.removeEventListener('pointercancel', up); box.removeEventListener('wheel', wheel); document.removeEventListener('keydown', key); fr.remove(); det.remove(); if (head) head.remove(); if (pills) pills.remove(); if (handEl) handEl.remove(); if (gbar) gbar.remove(); clearTimeout(lp); box.classList.remove('wide'); }, fit: fit };
  }

  function setMode(m) { if (window.MinestExplode && MinestExplode.isOpen()) MinestExplode.close(true); mode = m; document.body.classList.toggle('cm-on', m !== 'flow'); try { localStorage.setItem(KEY, m); } catch (e) {} sync(true); }
  /* the card in front, tapped: it comes apart into its layers (explode.js); 打开原卡 opens it in Minest as before */
  var lastList = [];
  function nextCard() { try { document.dispatchEvent(new KeyboardEvent('keydown', { key: 'ArrowRight', bubbles: true })); } catch (e) {} }
  function pick(it) {
    var slot = document.querySelector('.sf-slot[data-sf-view="coverflow"]');
    if (window.MinestExplode && slot) { lastPickId = it.id; MinestExplode.open(it, lastList, { container: slot, onOpenCard: openCard, onNext: nextCard }); return; }
    openCard(it);
  }
  function openCard(it) {
    lastPickId = it.id;
    try { var b = MinestAI.board(); MinestImageViews.select(b.id, it.id, 'coverflow'); } catch (e) {}
  }
  /* the mode bar, in the Dock (2026-11-20, the user: the right of the Dock holds what the page needs, the top bar moves
     there): mode (its icon; a tap opens the nine modes and the speed), play, portrait / landscape, card style */
  function dockKeys() {
    var g = document.createElement('div'); g.id = 'cm-dkeys'; g.className = 'mn-page'; g._dock = 1;
    function k(cls, label, fn) {
      var b = document.createElement('button'); b.type = 'button'; b.className = 'mn-bapp mn-page-key ' + cls; b.title = label; b.setAttribute('aria-label', label); b.setAttribute('data-spatial-home-dock', '');
      b.addEventListener('click', function (e) { e.stopPropagation(); e.preventDefault(); try { if (window.MinestNative && MinestNative.haptic) MinestNative.haptic('light'); } catch (er) {} fn(b); }, true);
      g.appendChild(b); return b;
    }
    var mk = k('cm-dk-mode', '模式', function (b) { if (pickEl) pickClose(); else pickOpen(b); });
    var pl = k('pl', '自动播放', function () { playing = !playing; paint(); if (pickEl) pickPaint(); });
    var shp = k('shp', '竖卡 / 横卡', function () { shape = shape === 'port' ? 'land' : 'port'; try { localStorage.setItem('minest.coverShape', shape); } catch (x) {} paint(); sync(true); });
    k('sty', '卡片风格', function () { pickClose(); if (window.MinestCardStyles) MinestCardStyles.open(); }).innerHTML = ico('style');
    function paint() {
      if (mk.dataset.m !== mode) { mk.dataset.m = mode; mk.innerHTML = ico(mode); var l = '模式 · ' + (MZH[mode] || mode); mk.title = l; mk.setAttribute('aria-label', l); }
      var pk = playing ? 'pause' : 'play'; if (pl.dataset.k !== pk) { pl.dataset.k = pk; pl.innerHTML = ico(pk); pl.title = playing ? '暂停' : '自动播放'; } pl.classList.toggle('on', playing);
      if (shp.dataset.k !== shape) { shp.dataset.k = shape; shp.innerHTML = ico(shape); shp.title = shape === 'port' ? '竖卡 · 点按换横卡' : '横卡 · 点按换竖卡'; }
    }
    g._paint = paint; paint(); return g;
  }
  var pickEl = null;
  var pcss = document.createElement('style');
  pcss.textContent =
    '#cm-pick{position:fixed;z-index:2147483630;padding:10px;border-radius:20px;background:linear-gradient(180deg,rgba(30,33,43,.82),rgba(14,16,22,.86));border:1px solid rgba(255,255,255,.12);box-shadow:inset 0 1px 0 rgba(255,255,255,.08),0 22px 50px -12px rgba(0,0,0,.6);-webkit-backdrop-filter:blur(24px) saturate(170%);backdrop-filter:blur(24px) saturate(170%);font-family:-apple-system,system-ui,sans-serif}' +
    '#cm-pick .g{display:grid;grid-template-columns:repeat(3,64px);gap:4px}' +
    '#cm-pick .g button{height:58px;border:0;border-radius:14px;background:none;color:rgba(232,236,245,.66);display:flex;flex-direction:column;align-items:center;justify-content:center;gap:5px;cursor:pointer;font:500 10.5px -apple-system,system-ui,sans-serif;letter-spacing:.04em}' +
    '#cm-pick .g button svg{width:22px;height:22px}#cm-pick .g button.on{background:linear-gradient(180deg,rgba(255,255,255,.18),rgba(255,255,255,.08));color:#fff;box-shadow:inset 0 1px 0 rgba(255,255,255,.25)}' +
    '#cm-pick .sp{display:flex;align-items:center;gap:8px;margin:8px 4px 0;padding-top:9px;border-top:1px solid rgba(255,255,255,.08);color:rgba(232,236,245,.6)}#cm-pick .sp svg{width:14px;height:14px;flex:none}#cm-pick .sp input{flex:1;accent-color:#7dd3fc;margin:0}' +
    'html.mn-sys-reading #cm-pick{display:none}';
  document.head.appendChild(pcss);
  function pickOpen(anchor) {
    pickClose();
    pickEl = document.createElement('div'); pickEl.id = 'cm-pick'; pickEl.setAttribute('role', 'menu');
    var gr = document.createElement('div'); gr.className = 'g';
    MODES.forEach(function (x) { var b = document.createElement('button'); b.type = 'button'; b.dataset.m = x[0]; b.innerHTML = ico(x[0]) + '<span>' + MZH[x[0]] + '</span>'; b.setAttribute('role', 'menuitemradio');
      b.addEventListener('click', function (e) { e.stopPropagation(); setMode(x[0]); pickPaint(); setTimeout(pickClose, 160); }); gr.appendChild(b); });
    pickEl.appendChild(gr);
    var sp = document.createElement('label'); sp.className = 'sp'; sp.title = '播放速度';
    sp.innerHTML = '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.8" stroke-linecap="round" aria-hidden="true"><path d="M4 18a8 8 0 1 1 16 0"/><path d="M12 18l4-5"/></svg>';
    var rg = document.createElement('input'); rg.type = 'range'; rg.min = .25; rg.max = 3; rg.step = .25; rg.value = speed; rg.setAttribute('aria-label', '播放速度');
    rg.oninput = function () { speed = parseFloat(rg.value); try { localStorage.setItem('minest.coverSpeed', speed); } catch (e) {} };
    sp.appendChild(rg); pickEl.appendChild(sp);
    ['pointerdown', 'click'].forEach(function (ev) { pickEl.addEventListener(ev, function (e) { e.stopPropagation(); }); });
    document.body.appendChild(pickEl); pickPaint();
    var r = anchor.getBoundingClientRect(), w = pickEl.offsetWidth, h = pickEl.offsetHeight, vert = document.documentElement.classList.contains('mn-dock-v');
    var x = vert ? r.left - w - 12 : Math.max(10, Math.min(innerWidth - w - 10, r.left + r.width / 2 - w / 2)), y = vert ? Math.max(10, Math.min(innerHeight - h - 10, r.top + r.height / 2 - h / 2)) : r.top - h - 12;
    if (!vert && document.documentElement.classList.contains('mn-dock-top')) y = r.bottom + 12;
    pickEl.style.left = x + 'px'; pickEl.style.top = Math.max(10, y) + 'px';
    (function rise(t0) { var el = pickEl; (function f() { if (!el.isConnected) return; var k = Math.min(1, (performance.now() - t0) / 200), e = 1 - Math.pow(1 - k, 3); el.style.opacity = e.toFixed(3); el.style.transform = 'translateY(' + ((1 - e) * 8).toFixed(1) + 'px) scale(' + (0.96 + e * 0.04).toFixed(3) + ')'; if (k < 1) requestAnimationFrame(f); })(); })(performance.now());   // the page pauses CSS transitions: the rise is drawn here
    setTimeout(function () { document.addEventListener('pointerdown', pickAway, true); }, 0);
  }
  function pickPaint() { if (pickEl) [].forEach.call(pickEl.querySelectorAll('button[data-m]'), function (b) { b.classList.toggle('on', b.dataset.m === mode); }); }
  function pickAway(e) { if (pickEl && !pickEl.contains(e.target) && !(e.target.closest && e.target.closest('.cm-dk-mode'))) pickClose(); }
  function pickClose() { document.removeEventListener('pointerdown', pickAway, true); if (pickEl) { pickEl.remove(); pickEl = null; } }
  document.addEventListener('keydown', function (e) { if (pickEl && e.key === 'Escape') { e.stopPropagation(); pickClose(); } }, true);
  function sync(force) {
    var slot = document.querySelector('.sf-slot[data-sf-view="coverflow"]'), on = slot && /(?:^|\s)mode-coverflow(?:\s|$)/.test(document.body.className) && slot.offsetWidth > 0;
    document.body.classList.toggle('cm-on', !!on && mode !== 'flow');
    var SB = window.MinestSystemBar && MinestSystemBar.page ? MinestSystemBar : null;
    if (!on) { if (eng) { eng.destroy(); eng = null; } if (ov) { ov.remove(); ov = null; } if (bar) { if (bar._dock && SB) SB.page(null); bar.remove(); bar = null; } pickClose(); sig = ''; return; }
    if (SB && (!bar || !bar._dock || bar._slot !== slot)) { if (bar) bar.remove(); bar = dockKeys(); bar._slot = slot; SB.page(bar); }
    else if (!SB && (!bar || bar.parentNode !== slot)) {
      if (bar) bar.remove();
      bar = document.createElement('div'); bar.id = 'cm-bar';
      MODES.forEach(function (x) { var b = document.createElement('button'); b.innerHTML = ico(x[0]); b.title = MZH[x[0]] + ' · ' + x[1]; b.setAttribute('aria-label', MZH[x[0]]); b.dataset.m = x[0]; b.onclick = function (e) { e.stopPropagation(); setMode(x[0]); flashName(bar, MZH[x[0]]); }; bar.appendChild(b); });
      var sep0 = document.createElement('i'); sep0.className = 'sep'; bar.appendChild(sep0);
      var pl = document.createElement('button'); pl.className = 'pl'; pl.innerHTML = ico(playing ? 'pause' : 'play'); pl.title = '自动播放';
      pl.onclick = function (e) { e.stopPropagation(); playing = !playing; pl.innerHTML = ico(playing ? 'pause' : 'play'); pl.classList.toggle('on', playing); bar.classList.toggle('playing', playing); };
      bar.classList.toggle('playing', playing);
      pl.classList.toggle('on', playing);
      var rg = document.createElement('input'); rg.type = 'range'; rg.min = .25; rg.max = 3; rg.step = .25; rg.value = speed; rg.title = 'Speed';
      rg.oninput = function () { speed = parseFloat(rg.value); try { localStorage.setItem('minest.coverSpeed', speed); } catch (e) {} };
      ['pointerdown', 'click'].forEach(function (ev) { rg.addEventListener(ev, function (e) { e.stopPropagation(); }); });
      var sty = document.createElement('button'); sty.className = 'sty'; sty.title = '卡片风格'; sty.innerHTML = ico('style');
      sty.onclick = function (e) { e.stopPropagation(); if (window.MinestCardStyles) MinestCardStyles.open(); };
      var shp = document.createElement('button'); shp.className = 'shp'; shp.title = '竖卡 / 横卡';
      var paintShp = function () { shp.innerHTML = ico(shape); shp.title = shape === 'port' ? '竖卡 · 点按换横卡' : '横卡 · 点按换竖卡'; };
      paintShp(); shp.onclick = function (e) { e.stopPropagation(); shape = shape === 'port' ? 'land' : 'port'; try { localStorage.setItem('minest.coverShape', shape); } catch (x) {} paintShp(); sync(true); };
      bar.appendChild(pl); bar.appendChild(rg); bar.appendChild(shp); bar.appendChild(sty);
      slot.appendChild(bar);
    }
    [].forEach.call(bar.querySelectorAll('button[data-m]'), function (b) { b.classList.toggle('on', b.dataset.m === mode); });
    if (bar._paint) bar._paint();
    if (mode === 'flow') { if (eng) { eng.destroy(); eng = null; } if (ov) { ov.remove(); ov = null; } sig = ''; return; }
    var all = items(), list = windowed(all), s = mode + '|' + shape + '|' + all.length + '|' + list.map(function (x) { return x.id + x.src; }).join(',');
    if (!force && eng && ov && ov.parentNode === slot && s === sig) return;
    if (eng) eng.destroy();
    if (ov) ov.remove();
    ov = document.createElement('div'); ov.id = 'cm-ov'; ov.className = mode + ' ' + shape; slot.insertBefore(ov, bar.parentNode === slot ? bar : slot.querySelector('#xl')); sig = s;
    lastList = list;
    eng = list.length ? Engine(ov, list, mode, pick) : null;
  }
  /* a big board: only a window of cards round the one in view is built (every card animated each frame, each with
     its picture and the card style's layers, was too much for a phone) */
  var CAP = { sphere: 30, spiral: 40, wall: 50 }, lastPickId = null;
  function windowed(list) {
    var cap = CAP[mode] || 64; if (list.length <= cap) return list;
    var at = 0; if (lastPickId) { for (var i = 0; i < list.length; i++) if (list[i].id === lastPickId) { at = i; break; } }
    var from = Math.max(0, Math.min(list.length - cap, at - Math.floor(cap / 3)));
    return list.slice(from, from + cap);
  }
  addEventListener('resize', function () { if (eng) eng.fit(); });
  window.addEventListener('minest:image-assets', function () { itemsAt = 0; sync(true); });
  setInterval(function () { try { sync(false); } catch (e) {} }, 700);

  /* ===== Holo Cards (2026-11-19): the same modes projected from Spatial Home's holo console — the room stays in view,
     the cards are light (cyan glass, scanlines, a glow), a beam runs from the console's emitter up into them ===== */
  var hcss = document.createElement('style');
  hcss.textContent =
    '#cm-holo{position:absolute;inset:0;z-index:40;pointer-events:none;font-family:-apple-system,system-ui,sans-serif}' +
    '#cm-holo #cm-ov{pointer-events:auto;background:transparent!important}' +
    '#cm-holo #cm-ov::before{content:"";position:absolute;inset:0;pointer-events:none;background:radial-gradient(55% 42% at 50% var(--cm-hy,40%),rgba(60,190,255,.14),transparent 72%),radial-gradient(ellipse 80% 75% at 50% 45%,transparent 40%,rgba(2,8,16,.5) 100%)}' +
    '#cm-holo #cm-ov:not(.wide) #cm-det{display:none!important}' +
    'html[data-card-style=\"default\"] #cm-holo .cm-c,html[data-card-style=\"default\"] #cm-holo .cm-c.wi,html[data-card-style=\"default\"] #cm-holo .cm-fc{background:linear-gradient(160deg,rgba(90,210,255,.16),rgba(40,140,220,.07) 60%,rgba(120,230,255,.12))!important;border:1px solid rgba(130,230,255,.75)!important;border-radius:14px!important;box-shadow:0 0 16px rgba(80,200,255,.38),inset 0 0 22px rgba(80,200,255,.16)!important;color:#c9f6ff!important;-webkit-backdrop-filter:none!important;backdrop-filter:none!important}' +
    'html[data-card-style=\"default\"] #cm-holo .cm-c.act{border-color:#d6fbff!important;box-shadow:0 0 0 1px rgba(214,251,255,.5),0 0 34px rgba(90,215,255,.7),inset 0 0 30px rgba(90,215,255,.25)!important}' +
    'html[data-card-style=\"default\"] #cm-holo .cm-c *{color:#c9f6ff!important;text-shadow:0 0 8px rgba(110,230,255,.85)!important}' +
    '#cm-holo .cm-c .cm-st,#cm-holo .cm-fc .fs,#cm-holo .cm-c .ws{color:#7fdcff!important}' +
    '#cm-holo .cm-c .cm-bd{background:rgba(160,240,255,.9)!important;height:2px}#cm-holo .cm-c .cm-ini{color:#8fe6ff!important;opacity:.12}' +
    'html[data-card-style=\"default\"] #cm-holo .cm-c .im,html[data-card-style=\"default\"] #cm-holo .cm-c .art,html[data-card-style=\"default\"] #cm-holo .cm-fc .fa{filter:grayscale(1) sepia(1) hue-rotate(155deg) saturate(2.4) brightness(1.05) contrast(1.15);opacity:.78;mix-blend-mode:screen}' +
    '#cm-holo .cm-c.hasim .tt{background:linear-gradient(180deg,transparent,rgba(0,40,70,.55))!important}' +
    'html[data-card-style=\"default\"] #cm-holo .cm-c::before{display:none!important}' +
    'html[data-card-style=\"default\"] #cm-holo .cm-c::after{content:""!important;position:absolute!important;inset:0!important;z-index:9!important;pointer-events:none!important;border-radius:inherit!important;mix-blend-mode:normal!important;filter:none!important;opacity:1!important;box-shadow:none!important;' +
      'background:repeating-linear-gradient(0deg,rgba(170,245,255,.09) 0 1px,transparent 1px 3px),linear-gradient(180deg,transparent calc(var(--cm-sweep,40%) - 8%),rgba(180,245,255,.22) var(--cm-sweep,40%),transparent calc(var(--cm-sweep,40%) + 6%))!important}' +
    '#cm-holo #cm-det,#cm-holo #cm-ov.fan #cm-det{background:rgba(10,40,60,.55)!important;border:1px solid rgba(130,230,255,.55)!important;box-shadow:0 0 24px rgba(80,200,255,.3)!important;color:#c9f6ff}' +
    '#cm-holo #cm-det b,#cm-holo #cm-det p,#cm-holo #cm-det em,#cm-holo #cm-det .go{color:#c9f6ff!important;text-shadow:0 0 8px rgba(110,230,255,.6)}#cm-holo #cm-det span{color:#7fdcff!important}' +
    '#cm-holo #cm-head{color:#c9f6ff!important;text-shadow:0 0 12px rgba(110,230,255,.7)}#cm-holo #cm-pills{background:rgba(10,40,60,.5)!important;border:1px solid rgba(130,230,255,.35)}#cm-holo #cm-pills button{color:#9fe6ff!important}#cm-holo #cm-pills button.on{background:rgba(160,240,255,.9)!important;color:#03202e!important}' +
    '#cm-holo .cm-hfx{position:absolute;left:0;top:0;z-index:1200;pointer-events:none}html.mn-sys-reading #cm-holo .cm-hfx{opacity:.6}' +
    '#cm-hbeam{position:absolute;inset:0;width:100%;height:100%;pointer-events:none;overflow:visible}' +
    '#cm-holo .cm-free .cm-c:not(.act){box-shadow:0 0 8px rgba(80,200,255,.3),inset 0 0 14px rgba(80,200,255,.12)!important}#cm-holo .cm-free .cm-c.act{box-shadow:0 0 0 1px rgba(214,251,255,.6),0 0 40px rgba(90,215,255,.8),0 24px 50px rgba(0,0,0,.45)!important}' +
    '#cm-hbar{position:absolute;top:calc(env(safe-area-inset-top,0px) + 12px);left:50%;transform:translateX(-50%);z-index:2100;pointer-events:auto;display:flex;align-items:center;gap:1px;max-width:94%;scrollbar-width:none;padding:3px;border-radius:14px;background:rgba(6,30,46,.6);border:1px solid rgba(130,230,255,.45);box-shadow:0 0 22px rgba(80,200,255,.25),inset 0 0 14px rgba(80,200,255,.12);-webkit-backdrop-filter:blur(10px);backdrop-filter:blur(10px)}' +
    '#cm-hbar::-webkit-scrollbar{display:none}#cm-hbar button{color:#9fe6ff}' +
    '#cm-hbar button.on{background:rgba(160,240,255,.22);color:#e8fdff;box-shadow:inset 0 1px 0 rgba(200,250,255,.35),0 0 12px rgba(140,235,255,.35)}' +
    '';
  document.head.appendChild(hcss);

  /* a tap read from the finger itself (in Spatial Home the room takes the touches, so 'click' may never come) */
  function tapOn(el, fn) {
    var d = null;
    el.addEventListener('pointerdown', function (e) { d = { x: e.clientX, y: e.clientY }; e.stopPropagation(); });
    el.addEventListener('pointerup', function (e) { if (!d) return; var m = Math.abs(e.clientX - d.x) + Math.abs(e.clientY - d.y); d = null; e.stopPropagation(); if (m <= 12) fn(e); });
    el.addEventListener('click', function (e) { e.stopPropagation(); });
  }

  /* ===== ✋ 操控 — the cards as things in the air (2026-11-19, the user: "like Iron Man: hold a card, make it bigger or
     smaller, push a pile of cards aside"). One finger picks a card up and carries it (let go and it glides on); two
     fingers on a card scale and turn it (the wheel scales it too); a finger drawn across empty space sweeps the cards
     in its way aside; two fingers on empty space zoom the whole field; a double tap opens the card as an Exploded
     Learning Card. Flat 2D transforms; a moving card leans with its speed. ===== */
  function FreeDeck(box, list, opt) {
    var N = Math.min(list.length, 28), cards = [], W = 0, H = 0, world = 1, ptrs = {}, sweep = null, wpinch = null, dead = false, last = performance.now(), lastTap = { i: -1, t: 0 }, order = [];
    var CW = shape === 'port' ? 190 : 260, CH = shape === 'port' ? 258 : 176;
    var layer = document.createElement('div'); layer.className = 'cm-free'; box.appendChild(layer);
    function size() { W = box.clientWidth || 800; H = box.clientHeight || 600; }
    size();
    function pileAt(c, k) { c.tx = (Math.random() - 0.5) * 60; c.ty = (Math.random() - 0.5) * 40 + 20; c.tr = (Math.random() - 0.5) * 12; c.ts = 0.86; c.glide = k * 0.035; }
    for (var i = 0; i < N; i++) {
      var it = list[i], el = document.createElement('div'), col = /^#[0-9a-f]{6}$/i.test(it.color) ? it.color : '#4fc8ff';
      el.className = 'cm-c cm-fc' + (it.src ? ' hasim' : '');
      el.style.cssText = 'width:' + CW + 'px;height:' + CH + 'px;margin:' + (-CH / 2) + 'px 0 0 ' + (-CW / 2) + 'px;left:50%;top:50%;touch-action:none';
      el.style.setProperty('--cm-col', col);
      el.innerHTML = '<div class="fa"' + (it.src ? ' data-bg="' + String(it.src).replace(/"/g, '%22') + '"' : ' style="background-image:linear-gradient(140deg,' + col + ',' + col + '55)"') + '>' + (it.src ? '' : '<b></b>') + '</div><div class="sh"></div><div class="fn"></div><div class="fs"></div>';
      if (!it.src) el.querySelector('.fa b').textContent = (String(it.title).trim().charAt(0) || '').toUpperCase();
      el.querySelector('.fn').textContent = it.title; el.querySelector('.fs').textContent = it.sub;
      var bgn = el.querySelector('[data-bg]'); if (bgn) bgn.style.backgroundImage = 'url("' + bgn.getAttribute('data-bg') + '")';
      layer.appendChild(el);
      var c = { el: el, it: it, i: i, x: 0, y: H * 0.6, r: 0, s: 0.6, vx: 0, vy: 0, vr: 0, tx: 0, ty: 0, tr: 0, ts: 1, held: false, glide: 0 };
      pileAt(c, i); el._c = c; cards.push(c); order.push(i);
    }
    function front(c) { order.splice(order.indexOf(c.i), 1); order.push(c.i); order.forEach(function (k, z) { cards[k].el.style.zIndex = 10 + z; }); }
    order.forEach(function (k, z) { cards[k].el.style.zIndex = 10 + z; });
    function tidy() { cards.forEach(function (c, k) { pileAt(c, (N - k) * 0.4); c.tx = c.tx; c.vx = c.vy = 0; c.mode = 'to'; }); }
    function spread() {
      var cols = Math.max(2, Math.round(Math.sqrt(N * (W / H)))), rows = Math.ceil(N / cols), gx = Math.min(CW * 1.15, (W * 0.92) / cols), gy = Math.min(CH * 1.12, (H * 0.74) / rows), sc = Math.min(1, gx / (CW * 1.1), gy / (CH * 1.08));
      cards.forEach(function (c, k) { var cx = k % cols, cy = Math.floor(k / cols); c.tx = (cx - (cols - 1) / 2) * gx; c.ty = (cy - (rows - 1) / 2) * gy + 20; c.tr = (Math.random() - 0.5) * 3; c.ts = sc; c.mode = 'to'; c.glide = k * 0.02; });
    }
    cards.forEach(function (c) { c.mode = 'to'; });
    function cardAt(t) { var e = t && t.closest ? t.closest('.cm-c') : null; return e && e._c ? e._c : null; }
    function onDown(e) {
      if (e.target.closest('#cm-hbar') || e.target.closest('#xl')) return;
      e.preventDefault(); try { box.setPointerCapture(e.pointerId); } catch (x) {}
      var c = cardAt(e.target), p = { id: e.pointerId, x: e.clientX, y: e.clientY, x0: e.clientX, y0: e.clientY, t: performance.now(), c: c };
      ptrs[e.pointerId] = p;
      var onCard = c ? Object.keys(ptrs).map(function (k) { return ptrs[k]; }).filter(function (q) { return q.c === c; }) : [];
      if (c) {
        front(c); c.held = true; c.mode = 'free'; c.vx = c.vy = c.vr = 0;
        if (onCard.length === 2) { var a = onCard[0], b = onCard[1]; c.pinch = { d: Math.hypot(a.x - b.x, a.y - b.y) || 1, ang: Math.atan2(b.y - a.y, b.x - a.x), s: c.s, r: c.r }; }
        try { if (window.MinestNative && MinestNative.haptic) MinestNative.haptic('light'); } catch (x) {}
      } else {
        var empties = Object.keys(ptrs).map(function (k) { return ptrs[k]; }).filter(function (q) { return !q.c; });
        if (empties.length === 2) { sweep = null; var a2 = empties[0], b2 = empties[1]; wpinch = { d: Math.hypot(a2.x - b2.x, a2.y - b2.y) || 1, w: world }; }
        else sweep = { x: e.clientX, y: e.clientY };
      }
    }
    function onMove(e) {
      var p = ptrs[e.pointerId]; if (!p) return;
      var dx = e.clientX - p.x, dy = e.clientY - p.y, now = performance.now(), dt = Math.max(1, now - (p.tm || p.t)); p.x = e.clientX; p.y = e.clientY; p.tm = now;
      var c = p.c;
      if (c) {
        var onCard = Object.keys(ptrs).map(function (k) { return ptrs[k]; }).filter(function (q) { return q.c === c; });
        if (onCard.length >= 2 && c.pinch) {
          var a = onCard[0], b = onCard[1], d = Math.hypot(a.x - b.x, a.y - b.y) || 1, ang = Math.atan2(b.y - a.y, b.x - a.x);
          c.s = clamp(c.pinch.s * d / c.pinch.d, 0.45, 3.2); c.r = c.pinch.r + (ang - c.pinch.ang) * 57.3;
          c.x += dx / 2 / world; c.y += dy / 2 / world;
        } else { c.x += dx / world; c.y += dy / world; c.vx = dx / dt * 16 / world; c.vy = dy / dt * 16 / world; c.vr = dx * 0.012; }
      } else if (wpinch) {
        var es = Object.keys(ptrs).map(function (k) { return ptrs[k]; }).filter(function (q) { return !q.c; });
        if (es.length >= 2) world = clamp(wpinch.w * (Math.hypot(es[0].x - es[1].x, es[0].y - es[1].y) || 1) / wpinch.d, 0.5, 2.2);
      } else if (sweep) {
        /* the sweep: every card near the finger's path is pushed along with it, those nearest the most */
        var r = box.getBoundingClientRect(), fx = (e.clientX - r.left - W / 2) / world, fy = (e.clientY - r.top - H / 2) / world, R = 170 / world;
        cards.forEach(function (q) { if (q.held) return; var ddx = q.x - fx, ddy = q.y - fy, dist = Math.hypot(ddx, ddy); if (dist < R) { var k = 1 - dist / R; q.mode = 'free'; q.x += dx / world * k * 1.1; q.y += dy / world * k * 1.1; q.vx = dx / dt * 16 / world * k; q.vy = dy / dt * 16 / world * k; q.vr = (dx - dy) * 0.006 * k; } });
      }
    }
    function onUp(e) {
      var p = ptrs[e.pointerId]; if (!p) return; delete ptrs[e.pointerId];
      var c = p.c, moved = Math.abs(p.x - p.x0) + Math.abs(p.y - p.y0), quick = performance.now() - p.t < 320;
      if (c) {
        var still = Object.keys(ptrs).some(function (k) { return ptrs[k].c === c; });
        if (!still) { c.held = false; c.pinch = null; }
        if (moved < 10 && quick) {
          var now = performance.now();
          if (lastTap.i === c.i && now - lastTap.t < 340) { lastTap = { i: -1, t: 0 }; if (opt.onOpen) opt.onOpen(c.it); }
          else { lastTap = { i: c.i, t: now }; c.mode = 'to'; c.tx = c.x; c.ty = c.y; c.ts = Math.max(c.s, 1.25); c.tr = 0; }   // a tap lifts it straight and a little larger
        }
      }
      if (!Object.keys(ptrs).some(function (k) { return !ptrs[k].c; })) { sweep = null; wpinch = null; }
    }
    function onWheel(e) {
      e.preventDefault(); var c = cardAt(e.target), k = Math.exp(-(e.deltaY || 0) * 0.0015);
      if (c) { front(c); c.mode = 'free'; c.s = clamp(c.s * k, 0.45, 3.2); } else world = clamp(world * k, 0.5, 2.2);
    }
    box.addEventListener('pointerdown', onDown); box.addEventListener('pointermove', onMove); box.addEventListener('pointerup', onUp); box.addEventListener('pointercancel', onUp);
    box.addEventListener('wheel', onWheel, { passive: false });
    var onR = function () { size(); }; addEventListener('resize', onR);
    function tick(now) {
      if (dead) return; requestAnimationFrame(tick);
      var dt = Math.min(0.05, (now - last) / 1000); last = now; if (document.hidden) return;
      var lx = W / 2 / world, ly = H / 2 / world;
      cards.forEach(function (c) {
        if (c.mode === 'to') {
          if (c.glide > 0) { c.glide -= dt; return; }
          var k = Math.min(1, dt * 7); c.x += (c.tx - c.x) * k; c.y += (c.ty - c.y) * k; c.r += (c.tr - c.r) * k; c.s += (c.ts - c.s) * k;
        } else if (!c.held) {
          c.x += c.vx * dt * 60; c.y += c.vy * dt * 60; c.r += c.vr * dt * 60;
          var f = Math.exp(-3.2 * dt); c.vx *= f; c.vy *= f; c.vr *= f;
          /* the edges give a soft push back, so a card thrown away stays in reach */
          var mx = lx - CW * c.s * 0.25, my = ly - CH * c.s * 0.25;
          if (c.x > mx) { c.x = mx; c.vx = -Math.abs(c.vx) * 0.4; } if (c.x < -mx) { c.x = -mx; c.vx = Math.abs(c.vx) * 0.4; }
          if (c.y > my) { c.y = my; c.vy = -Math.abs(c.vy) * 0.4; } if (c.y < -my + 40) { c.y = -my + 40; c.vy = Math.abs(c.vy) * 0.4; }
        }
        var lean = c.held || Math.abs(c.vx) + Math.abs(c.vy) > 0.4, rx = clamp(-c.vy * 2.2, -22, 22), ry = clamp(c.vx * 2.2, -22, 22);
        c.el.style.transform = 'translate(' + (c.x * world).toFixed(1) + 'px,' + (c.y * world).toFixed(1) + 'px)' + (lean ? ' perspective(900px) rotateX(' + rx.toFixed(1) + 'deg) rotateY(' + ry.toFixed(1) + 'deg)' : '') + ' rotate(' + c.r.toFixed(2) + 'deg) scale(' + (c.s * world * (c.held ? 1.06 : 1)).toFixed(3) + ')';
        c.el.classList.toggle('act', c.held);
      });
    }
    requestAnimationFrame(tick);
    return { destroy: function () { dead = true; removeEventListener('resize', onR); box.removeEventListener('pointerdown', onDown); box.removeEventListener('pointermove', onMove); box.removeEventListener('pointerup', onUp); box.removeEventListener('pointercancel', onUp); box.removeEventListener('wheel', onWheel); layer.remove(); },
      tidy: tidy, spread: spread, fit: size };
  }

  /* ── holo particles (2026-11-20, the user: polish the hologram's particles) ──
     One canvas over the projection, additive light: drifting motes (parallax with the phone's tilt and the group's
     lean), a thin stream rising from the console's emitter into the cards (in place of the cone), cards forming from
     light along their edges when a mode comes in, a burst when a card comes apart, and sparks trailing a card carried
     in the hand. Capped, paused while hidden, fewer with reduced motion. */
  function HoloFX(root) {
    var cv = document.createElement('canvas'); cv.className = 'cm-hfx'; root.appendChild(cv);
    var x = cv.getContext('2d'), dpr = Math.min(2, window.devicePixelRatio || 1), W = 1, H = 1, ps = [], dust = [], last = performance.now(), dead = false, anchor = null, mid = null;
    var calm = false; try { calm = matchMedia('(prefers-reduced-motion: reduce)').matches; } catch (e) {}
    var CAP = calm ? 120 : 420, NDUST = calm ? 30 : (window.innerWidth < 700 ? 60 : 110);
    function sprite(c1, c2) { var s = document.createElement('canvas'); s.width = s.height = 64; var g = s.getContext('2d'), gr = g.createRadialGradient(32, 32, 0, 32, 32, 32); gr.addColorStop(0, c1); gr.addColorStop(0.25, c2); gr.addColorStop(1, 'rgba(0,0,0,0)'); g.fillStyle = gr; g.fillRect(0, 0, 64, 64); return s; }
    var SP = [sprite('rgba(255,255,255,1)', 'rgba(120,230,255,.55)'), sprite('rgba(230,250,255,1)', 'rgba(80,170,255,.45)'), sprite('rgba(255,250,235,1)', 'rgba(170,220,255,.5)')];
    function size() { W = root.clientWidth || 1; H = root.clientHeight || 1; cv.width = Math.round(W * dpr); cv.height = Math.round(H * dpr); cv.style.width = W + 'px'; cv.style.height = H + 'px'; }
    size(); var onR = function () { size(); }; addEventListener('resize', onR);
    function mote(fresh) { return { x: Math.random() * W, y: fresh ? Math.random() * H : H + 10, z: 0.3 + Math.random() * 0.7, vy: -(6 + Math.random() * 16), ph: Math.random() * 6.28, s: 1.2 + Math.random() * 2.4, sp: (Math.random() * 3) | 0 }; }
    for (var i = 0; i < NDUST; i++) dust.push(mote(true));
    function add(px, py, vx, vy, life, sz, k) { if (ps.length >= CAP) ps.shift(); ps.push({ x: px, y: py, vx: vx, vy: vy, t: 0, life: life, s: sz, k: k || 0, sp: (Math.random() * 3) | 0 }); }
    /* cards forming from light: sparks along each visible card's edges, drawn in towards it */
    function form() {
      var cs = root.querySelectorAll('#cm-ov .cm-c'), br = root.getBoundingClientRect(), n = 0;
      for (var i = 0; i < cs.length && n < 26; i++) { var c = cs[i]; if (c.style.display === 'none' || +(c.style.opacity || 1) < 0.3) continue; var r = c.getBoundingClientRect(); if (r.width < 20) continue; n++;
        for (var j = 0; j < 12; j++) { var u = Math.random(), side = (Math.random() * 4) | 0, px = r.left - br.left + (side === 1 ? r.width : side === 3 ? 0 : u * r.width), py = r.top - br.top + (side === 0 ? 0 : side === 2 ? r.height : u * r.height);
          var cx = r.left - br.left + r.width / 2, cy = r.top - br.top + r.height / 2; add(px + (px - cx) * 0.25, py + (py - cy) * 0.25, (cx - px) * 0.6, (cy - py) * 0.6, 0.55 + Math.random() * 0.35, 1.8 + Math.random() * 1.6, 1); } }
    }
    function burst(cx, cy, n) { for (var i = 0; i < n; i++) { var a = Math.random() * 6.283, v = 60 + Math.random() * 220; add(cx, cy, Math.cos(a) * v, Math.sin(a) * v, 0.6 + Math.random() * 0.7, 1.5 + Math.random() * 2.5, 2); } }
    var trail = new WeakMap(), hadX = false;
    function frame(now) {
      if (dead) return; requestAnimationFrame(frame);
      var dt = Math.min(0.05, (now - last) / 1000); last = now; if (document.hidden) return;
      x.setTransform(dpr, 0, 0, dpr, 0, 0); x.clearRect(0, 0, W, H); x.globalCompositeOperation = 'lighter';
      var lx = (GY.x || 0) * 1.2, ly = (GY.y || 0) * -1.2, t = now / 1000;
      /* motes */
      dust.forEach(function (d, i) {
        d.y += d.vy * dt * d.z; d.x += Math.sin(t * 0.6 + d.ph) * 6 * dt * d.z; if (d.y < -10) dust[i] = mote(false);
        var tw = 0.35 + 0.65 * Math.abs(Math.sin(t * (0.8 + d.z) + d.ph)), sz = d.s * (0.6 + d.z * 0.8) * 4;
        x.globalAlpha = 0.22 * tw * d.z; x.drawImage(SP[d.sp], d.x + lx * d.z - sz / 2, d.y + ly * d.z - sz / 2, sz, sz);
      });
      /* the stream from the emitter towards the cards */
      if (anchor && mid && !calm) { var rate = 22 * dt + Math.random() * 0.6;
        for (var q = 0; q < rate; q++) { var tx = mid.x + (Math.random() - 0.5) * W * 0.5, ty = mid.y + (Math.random() - 0.5) * H * 0.18, life = 1.1 + Math.random() * 0.8;
          add(anchor.x + (Math.random() - 0.5) * 16, anchor.y, (tx - anchor.x) / life, (ty - anchor.y) / life, life, 1 + Math.random() * 1.6, 3); } }
      /* sparks off a card being carried */
      var held = root.querySelectorAll('.cm-hand .cm-held'), br = held.length ? root.getBoundingClientRect() : null;
      for (var h = 0; h < held.length; h++) { var r = held[h].getBoundingClientRect(), cx = r.left - br.left + r.width / 2, cy = r.top - br.top + r.height / 2, pv = trail.get(held[h]);
        if (pv) { var mv = Math.hypot(cx - pv.x, cy - pv.y); if (mv > 2) for (var k2 = 0; k2 < Math.min(8, mv / 4); k2++) add(cx + (Math.random() - 0.5) * r.width * 0.9, cy + (Math.random() - 0.5) * r.height * 0.9, (pv.x - cx) * 2 + (Math.random() - 0.5) * 40, (pv.y - cy) * 2 + (Math.random() - 0.5) * 40, 0.5 + Math.random() * 0.4, 1.4 + Math.random() * 1.8, 2); }
        trail.set(held[h], { x: cx, y: cy }); }
      /* a card coming apart */
      var hasX = !!root.querySelector('#xl'); if (hasX && !hadX) burst(W / 2, H * 0.45, calm ? 30 : 90); hadX = hasX;
      /* the sparks */
      for (var i2 = ps.length - 1; i2 >= 0; i2--) { var p = ps[i2]; p.t += dt; if (p.t >= p.life) { ps.splice(i2, 1); continue; }
        var f = p.k === 2 ? Math.exp(-dt * 2.6) : 1; p.vx *= f; p.vy *= f; p.x += p.vx * dt; p.y += p.vy * dt;
        var u = p.t / p.life, al = (p.k === 3 ? Math.sin(u * Math.PI) * 0.55 : (1 - u) * 0.9), sz2 = p.s * 4 * (p.k === 1 ? 1.2 - u * 0.6 : 1);
        x.globalAlpha = al; x.drawImage(SP[p.sp], p.x - sz2 / 2, p.y - sz2 / 2, sz2, sz2); }
      x.globalAlpha = 1; x.globalCompositeOperation = 'source-over';
    }
    requestAnimationFrame(frame);
    return { form: form, burst: burst, aim: function (a, m) { anchor = a; mid = m; }, destroy: function () { dead = true; removeEventListener('resize', onR); cv.remove(); } };
  }
  var holoEl = null, heng = null, hmode = 'sphere', hfx = null, hlist = null, hraf = 0;
  try { hmode = localStorage.getItem('minest.holoMode') || 'sphere'; if (hmode === 'free') hmode = 'sphere'; } catch (e) {}   // the hands work inside every mode now (pinch, press and hold, aside)
  function holo(container, opt) {
    opt = opt || {}; holoClose(true);
    var root = document.createElement('div'); root.id = 'cm-holo'; container.appendChild(root); holoEl = root;
    var NS = 'http://www.w3.org/2000/svg', sv = document.createElementNS(NS, 'svg'); sv.id = 'cm-hbeam';
    sv.innerHTML = '<defs><linearGradient id="cmhb" x1="0" y1="1" x2="0" y2="0"><stop offset="0" stop-color="#7fe3ff" stop-opacity=".55"/><stop offset=".55" stop-color="#4fc8ff" stop-opacity=".16"/><stop offset="1" stop-color="#4fc8ff" stop-opacity="0"/></linearGradient>' +
      '<radialGradient id="cmhg" cx=".5" cy=".5" r=".5"><stop offset="0" stop-color="#bff6ff" stop-opacity=".9"/><stop offset="1" stop-color="#4fc8ff" stop-opacity="0"/></radialGradient></defs>' +
      '<polygon id="cmhp" fill="url(#cmhb)"/><ellipse id="cmhe" fill="url(#cmhg)"/><ellipse id="cmhr" fill="none" stroke="#8fe9ff" stroke-opacity=".5" stroke-width="1.2" stroke-dasharray="3 6"/>';
    root.appendChild(sv);
    var bar = document.createElement('div'); bar.id = 'cm-hbar'; root.appendChild(bar);
    if (hfx) hfx.destroy(); hfx = HoloFX(root);
    var HM = [['flow', '3D']].concat(MODES.filter(function (x) { return x[0] !== 'flow'; }));
    HM.forEach(function (x) { var b = document.createElement('button'); b.type = 'button'; b.innerHTML = ico(x[0]); b.title = MZH[x[0]]; b.setAttribute('aria-label', MZH[x[0]]); b.dataset.m = x[0]; tapOn(b, function () { hmode = x[0]; try { localStorage.setItem('minest.holoMode', hmode); } catch (er) {} build(); flashName(bar, MZH[x[0]]); }); bar.appendChild(b); });
    var sep = document.createElement('i'); sep.className = 'sep'; bar.appendChild(sep);
    var shp = document.createElement('button'); shp.type = 'button'; bar.appendChild(shp);
    var paint = function () { shp.innerHTML = ico(shape); shp.title = shape === 'port' ? '竖卡' : '横卡'; [].forEach.call(bar.querySelectorAll('[data-m]'), function (b) { b.classList.toggle('on', b.dataset.m === hmode); }); [].forEach.call(bar.querySelectorAll('.fo'), function (b) { b.style.display = hmode === 'free' ? '' : 'none'; }); };
    tapOn(shp, function () { shape = shape === 'port' ? 'land' : 'port'; try { localStorage.setItem('minest.coverShape', shape); } catch (er) {} build(); });
    var sty = document.createElement('button'); sty.type = 'button'; sty.innerHTML = ico('style'); sty.title = '卡片风格'; tapOn(sty, function () { if (window.MinestCardStyles) MinestCardStyles.open(); }); bar.appendChild(sty);
    if (opt.onLab) { var lab = document.createElement('button'); lab.type = 'button'; lab.innerHTML = ico('lab'); lab.title = '全息文字实验室'; tapOn(lab, function () { holoClose(); opt.onLab(); }); bar.appendChild(lab); }
    var x = document.createElement('button'); x.type = 'button'; x.className = 'x'; x.innerHTML = ico('close'); root._close = function () { holoClose(); if (opt.onClose) opt.onClose(); }; x.title = '关闭全息卡片'; tapOn(x, function () { holoClose(); if (opt.onClose) opt.onClose(); }); bar.appendChild(x);
    ['pointerdown', 'touchstart', 'wheel', 'keydown', 'click'].forEach(function (t) { root.addEventListener(t, function (e) { e.stopPropagation(); }, { passive: true }); });
    var ov = null;
    function build() {
      if (window.MinestExplode && MinestExplode.isOpen()) MinestExplode.close(true);
      if (heng) { heng.destroy(); heng = null; } if (ov) ov.remove();
      ov = document.createElement('div'); ov.id = 'cm-ov'; ov.className = hmode + ' ' + shape; root.insertBefore(ov, bar);
      var all = items(true); hlist = all.length > 48 ? all.slice(0, 48) : all;
      var openX = function (it) { if (window.MinestExplode) MinestExplode.open(it, hlist, { container: root, holo: true, onNext: null, onOpenCard: function (x) { holoClose(); if (opt.onPick) opt.onPick(x); } }); };
      if (hmode === 'free') { heng = hlist.length ? FreeDeck(ov, hlist, { onOpen: openX }) : null; paint(); return; }
      var saved = mode; mode = hmode;   // the window (CAP) follows the mode in view
      heng = hlist.length ? Engine(ov, hlist, hmode, function (it) {
        if (window.MinestExplode) { MinestExplode.open(it, hlist, { container: root, holo: true, onNext: nextCard, onOpenCard: function (x) { holoClose(); if (opt.onPick) opt.onPick(x); } }); return; }
        holoClose(); if (opt.onPick) opt.onPick(it); }) : null;
      mode = saved; paint();
      setTimeout(function () { if (hfx) hfx.form(); }, 140);
    }
    build();
    /* the beam: from the console's emitter (projected into the screen each frame) up to the foot of the cards */
    var poly = sv.querySelector('#cmhp'), glow = sv.querySelector('#cmhe'), ring = sv.querySelector('#cmhr'), t0 = performance.now();
    function beam(now) {
      if (holoEl !== root) return; hraf = requestAnimationFrame(beam);
      var W = root.clientWidth || 1, H = root.clientHeight || 1, a = null;
      try { a = opt.anchor && opt.anchor(); } catch (e) {}
      if (!a || !(a.x >= 0 && a.x <= W && a.y >= H * 0.3 && a.y <= H * 1.05)) a = { x: W / 2, y: H * 0.96 };   // the console out of view: the beam rises from the foot of the screen
      /* the cards float above the console: the stage's middle a third of the screen above the emitter */
      var fr = root.querySelector('#cm-fr'), cy = Math.max(H * 0.3, Math.min(H * 0.46, a.y - H * 0.34));
      if (fr) fr.style.top = cy.toFixed(1) + 'px';
      root.style.setProperty('--cm-hy', (cy / H * 100).toFixed(1) + '%');
      var top = cy + H * 0.1, half = Math.min(W * 0.3, 420), cx = W / 2, nar = 12;
      if (hfx) hfx.aim({ x: a.x, y: a.y - 6 }, { x: cx, y: cy });
      poly.setAttribute('points', '');   // no beam cone: it stood in front of the cards (the user)
      glow.setAttribute('cx', a.x); glow.setAttribute('cy', a.y); glow.setAttribute('rx', 60); glow.setAttribute('ry', 16);
      ring.setAttribute('rx', 0); ring.setAttribute('cx', cx); ring.setAttribute('cy', Math.min(H * 0.86, cy + H * 0.3)); ring.setAttribute('rx', half * 0.9); ring.setAttribute('ry', 26); ring.setAttribute('transform', 'rotate(' + (((now - t0) / 60) % 360 * 0) + ')');
      ring.setAttribute('stroke-dashoffset', String(-((now - t0) / 40) % 9));
      root.style.setProperty('--cm-sweep', (((now - t0) / 2600) % 1 * 140 - 20).toFixed(1) + '%');
    }
    hraf = requestAnimationFrame(beam);
    return { close: holoClose };
  }
  function holoClose(silent) {
    if (window.MinestExplode && MinestExplode.isOpen()) MinestExplode.close(true);
    if (heng) { heng.destroy(); heng = null; }
    cancelAnimationFrame(hraf); if (hfx) { hfx.destroy(); hfx = null; }
    if (holoEl) { var e0 = holoEl; holoEl = null; e0.remove(); }
  }
  document.addEventListener('keydown', function (e) { if (e.key === 'Escape' && holoEl) { if (holoEl._close) holoEl._close(); } });
  window.MinestCoverModes = { holo: holo, holoClose: holoClose,  play: function (v) { playing = v === undefined ? !playing : !!v; if (bar && bar._paint) { bar._paint(); return; } var b = bar && bar.querySelector('.pl'); if (b) { b.innerHTML = ico(playing ? 'pause' : 'play'); b.classList.toggle('on', playing); bar.classList.toggle('playing', playing); } }, speed: function (v) { speed = v; }, set: setMode, get: function () { return mode; } };
})();

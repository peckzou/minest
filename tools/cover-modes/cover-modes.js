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
    '#cm-bar{position:absolute;top:44px;left:50%;transform:translateX(-50%);z-index:2100;display:flex;align-items:center;gap:2px;max-width:96vw;overflow-x:auto;scrollbar-width:none;padding:4px 6px;border-radius:99px;background:rgba(15,18,26,.8);border:1px solid rgba(255,255,255,.18);box-shadow:0 12px 32px rgba(0,0,0,.3);backdrop-filter:blur(18px);-webkit-backdrop-filter:blur(18px)}' +
    '#cm-bar::-webkit-scrollbar{display:none}' +
    '#cm-bar button{border:0;border-radius:99px;padding:6px 10px;background:none;color:#cbd5e1;font:600 11.5px -apple-system,system-ui,sans-serif;cursor:pointer;white-space:nowrap;flex:none;transition:background .18s ease,color .18s ease,transform .15s ease}' +
    '#cm-bar button:hover{color:#fff}' +
    '#cm-bar button.on{background:#fff;color:#0f172a;box-shadow:0 2px 10px rgba(255,255,255,.35)}' +
    '#cm-bar .pl{width:28px;padding:6px 0;margin-left:3px;background:rgba(255,255,255,.16);color:#fff}' +
    '#cm-bar .pl.on{background:#38bdf8;color:#0f172a}' +
    '#cm-bar .shp{display:flex;align-items:center;gap:6px;margin-left:2px;color:#fff;background:rgba(255,255,255,.1)}#cm-bar .shp i{display:block;border:1.6px solid currentColor;border-radius:2.5px}#cm-bar .shp i.port{width:8px;height:12px}#cm-bar .shp i.land{width:13px;height:8px}' +
    /* the other shape for each mode (each class is drawn in its own shape by default) */
    '#cm-ov.port .cm-wl{width:214px;height:292px;margin:-146px 0 0 -107px}#cm-ov.port .cm-hx{width:214px;height:296px;margin:-148px 0 0 -107px}' +
    '#cm-ov.port .cm-wl.wi .art,#cm-ov.port .cm-hx.wi .art{height:auto!important;bottom:78px}#cm-ov.port .cm-wl .wg,#cm-ov.port .cm-hx .wg{display:none}#cm-ov.port .cm-wl .wt,#cm-ov.port .cm-hx .wt{white-space:normal;display:-webkit-box;-webkit-line-clamp:2;-webkit-box-orient:vertical;bottom:30px;font-size:18px!important}' +
    '#cm-ov.land .cm-sp{width:330px;height:232px;margin:-116px 0 0 -165px}#cm-ov.land .cm-orb{width:244px;height:164px;margin:-82px 0 0 -122px}#cm-ov.land .cm-sph{width:204px;height:138px;margin:-69px 0 0 -102px}#cm-ov.land .cm-wav{width:244px;height:164px;margin:-82px 0 0 -122px}' +
    '#cm-ov.land .cm-fc{width:236px;height:162px;margin:-81px 0 0 -118px}#cm-ov.land .cm-fc .fa{bottom:58px}#cm-ov.land .cm-fc .fn{-webkit-line-clamp:1;bottom:22px}' +
    '#cm-ov .cm-hand{position:absolute;inset:0;z-index:1500;pointer-events:none}#cm-ov .cm-hand .cm-c{left:0;top:0;pointer-events:auto;touch-action:none;cursor:grab}' +
    '#cm-ov .cm-hand .cm-c.cm-held{box-shadow:0 30px 60px rgba(0,0,0,.45),0 0 0 1.5px rgba(255,255,255,.7),0 0 34px rgba(120,190,255,.55)!important}' +
    '#cm-ov .cm-hback{display:none;position:absolute;right:calc(env(safe-area-inset-right,0px) + 18px);bottom:calc(env(safe-area-inset-bottom,0px) + 100px);pointer-events:auto;border:1px solid rgba(255,255,255,.3);border-radius:99px;padding:8px 14px;background:rgba(20,24,34,.72);color:#fff;font:600 12.5px -apple-system,system-ui,sans-serif;-webkit-backdrop-filter:blur(10px);backdrop-filter:blur(10px)}' +
    '#cm-ov .cm-hand .cm-c.cm-held::after{content:"";position:absolute;inset:0;border-radius:inherit;pointer-events:none;z-index:20;background:linear-gradient(110deg,transparent calc(var(--hg,50%) - 22%),rgba(255,255,255,.28) var(--hg,50%),transparent calc(var(--hg,50%) + 18%));mix-blend-mode:screen!important}' +
    '#cm-ov .cm-gbar{position:absolute;z-index:1400;left:calc(env(safe-area-inset-left,0px) + 14px);bottom:calc(env(safe-area-inset-bottom,0px) + 96px);display:flex;align-items:center;gap:3px;padding:4px 5px 4px 10px;border-radius:99px;background:rgba(20,24,34,.62);border:1px solid rgba(255,255,255,.18);-webkit-backdrop-filter:blur(10px);backdrop-filter:blur(10px);opacity:.75}' +
    '#cm-ov .cm-gbar span{font:600 11px -apple-system,system-ui,sans-serif;color:#a9b3c7;margin-right:3px}#cm-ov .cm-gbar button{min-width:30px;height:28px;padding:0 7px;border:0;border-radius:99px;background:rgba(255,255,255,.08);color:#fff;font:600 12.5px -apple-system,system-ui,sans-serif}' +
    '#cm-ov .cm-gbar .lv{display:none}#cm-ov .cm-gbar.lean{opacity:1}#cm-ov .cm-gbar.lean .lv{display:inline-block;background:rgba(120,190,255,.35)}html.mn-dock-v #cm-ov .cm-gbar{bottom:calc(env(safe-area-inset-bottom,0px) + 18px)}html.mn-sys-reading #cm-ov .cm-gbar{display:none}' +
    '#cm-ov .cm-hctl{position:absolute;left:0;top:0;width:300px;display:flex;gap:4px;justify-content:center;pointer-events:auto}#cm-ov .cm-hctl button{flex:none;min-width:34px;height:32px;padding:0 10px;border-radius:99px;border:1px solid rgba(255,255,255,.35);background:rgba(20,24,34,.78);color:#fff;font:600 13px -apple-system,system-ui,sans-serif;-webkit-backdrop-filter:blur(8px);backdrop-filter:blur(8px)}' +
    '#cm-ov .cm-hand.has .cm-hback{display:block}html.mn-dock-v #cm-ov .cm-hback{bottom:calc(env(safe-area-inset-bottom,0px) + 22px)}' +
    '#cm-bar .sty{margin-left:2px;padding:6px 12px;background:linear-gradient(120deg,rgba(255,255,255,.18),rgba(255,255,255,.06));color:#fff;border:1px solid rgba(255,255,255,.22)}' +
    '#cm-bar input{width:60px;margin:0 6px 0 4px;accent-color:#38bdf8;align-self:center;flex:none}' +
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
      var k = Math.min(1, dt * 9); cgx += (grx - cgx) * k; cgy += (gry - cgy) * k; cgz += (grz - cgz) * k;
      if (Math.abs(cgx) + Math.abs(cgy) + Math.abs(cgz) > 0.05) tilt.style.transform = (tilt.style.transform || '') + ' rotateX(' + cgx.toFixed(2) + 'deg) rotateY(' + cgy.toFixed(2) + 'deg) rotateZ(' + cgz.toFixed(2) + 'deg)';
      if (gbar) gbar.classList.toggle('lean', Math.abs(grx) + Math.abs(gry) + Math.abs(grz) > 0.5);
    }
    gbar = document.createElement('div'); gbar.className = 'cm-gbar';
    gbar.innerHTML = '<span>卡组</span><button data-g="ccw" aria-label="向左转">⟲</button><button data-g="cw" aria-label="向右转">⟳</button><button data-g="yl" aria-label="向左侧转">左</button><button data-g="yr" aria-label="向右侧转">右</button><button data-g="up" aria-label="俯">俯</button><button data-g="dn" aria-label="仰">仰</button><button data-g="lv" class="lv">摆正</button>';
    box.appendChild(gbar);
    (function () { var gd = null;
      gbar.addEventListener('pointerdown', function (e) { e.stopPropagation(); gd = { x: e.clientX, y: e.clientY }; });
      gbar.addEventListener('pointerup', function (e) { e.stopPropagation(); if (!gd || Math.abs(e.clientX - gd.x) + Math.abs(e.clientY - gd.y) > 12) return; gd = null; var b = e.target.closest('[data-g]'); if (!b) return; var g = b.getAttribute('data-g');
        if (g === 'ccw') grz -= 10; else if (g === 'cw') grz += 10; else if (g === 'yl') gry = clamp(gry - 15, -70, 70); else if (g === 'yr') gry = clamp(gry + 15, -70, 70); else if (g === 'up') grx = clamp(grx + 10, -60, 60); else if (g === 'dn') grx = clamp(grx - 10, -60, 60); else { grx = gry = grz = 0; } });
      gbar.addEventListener('click', function (e) { e.stopPropagation(); });
    })();
    function handRender(dt) {
      if (Math.abs(asideT - aside) > 0.001) { aside += (asideT - aside) * Math.min(1, dt * 8); applyFr(); }
      if (handEl) handEl.classList.toggle('has', hand.length > 0);
      hand.forEach(function (it, z) {
        it.s += (it.ts - it.s) * Math.min(1, dt * 10);
        if (it.ptr == null) { var hx = Math.max(50, Math.min(BW - 50, it.x)), hy = Math.max(70, Math.min(BH - 70, it.y)); it.x += (hx - it.x) * Math.min(1, dt * 10); it.y += (hy - it.y) * Math.min(1, dt * 10); }   // let go off screen: it drifts back into view
        var el = it.el, st = el.style; st.display = ''; st.opacity = '1'; st.filter = ''; st.zIndex = String(3000 + z); st.pointerEvents = 'auto';
        var ek = Math.min(1, dt * 12), idle = it.ptr == null && !Object.keys(ptrs).length ? 1 : 0, tnow = performance.now() / 1000;
        it.crx += (it.rx + idle * Math.sin(tnow * 0.9 + z) * 3 - it.crx) * ek; it.cry += (it.ry + idle * Math.sin(tnow * 0.7 + z * 2) * 4 - it.cry) * ek; it.cr += (it.r - it.cr) * ek;
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
  function sync(force) {
    var slot = document.querySelector('.sf-slot[data-sf-view="coverflow"]'), on = slot && /(?:^|\s)mode-coverflow(?:\s|$)/.test(document.body.className) && slot.offsetWidth > 0;
    document.body.classList.toggle('cm-on', !!on && mode !== 'flow');
    if (!on) { if (eng) { eng.destroy(); eng = null; } if (ov) { ov.remove(); ov = null; } if (bar) { bar.remove(); bar = null; } sig = ''; return; }
    if (!bar || bar.parentNode !== slot) {
      if (bar) bar.remove();
      bar = document.createElement('div'); bar.id = 'cm-bar';
      MODES.forEach(function (x) { var b = document.createElement('button'); b.textContent = x[1]; b.dataset.m = x[0]; b.onclick = function (e) { e.stopPropagation(); setMode(x[0]); }; bar.appendChild(b); });
      var pl = document.createElement('button'); pl.className = 'pl'; pl.textContent = playing ? '❚❚' : '▶'; pl.title = 'Auto play';
      pl.onclick = function (e) { e.stopPropagation(); playing = !playing; pl.textContent = playing ? '❚❚' : '▶'; pl.classList.toggle('on', playing); };
      pl.classList.toggle('on', playing);
      var rg = document.createElement('input'); rg.type = 'range'; rg.min = .25; rg.max = 3; rg.step = .25; rg.value = speed; rg.title = 'Speed';
      rg.oninput = function () { speed = parseFloat(rg.value); try { localStorage.setItem('minest.coverSpeed', speed); } catch (e) {} };
      ['pointerdown', 'click'].forEach(function (ev) { rg.addEventListener(ev, function (e) { e.stopPropagation(); }); });
      var sty = document.createElement('button'); sty.className = 'sty'; sty.title = '卡片风格'; sty.textContent = '风格';
      sty.onclick = function (e) { e.stopPropagation(); if (window.MinestCardStyles) MinestCardStyles.open(); };
      var shp = document.createElement('button'); shp.className = 'shp'; shp.title = '竖卡 / 横卡';
      var paintShp = function () { shp.innerHTML = '<i class="' + shape + '"></i>' + (shape === 'port' ? '竖卡' : '横卡'); };
      paintShp(); shp.onclick = function (e) { e.stopPropagation(); shape = shape === 'port' ? 'land' : 'port'; try { localStorage.setItem('minest.coverShape', shape); } catch (x) {} paintShp(); sync(true); };
      bar.appendChild(pl); bar.appendChild(rg); bar.appendChild(shp); bar.appendChild(sty);
      slot.appendChild(bar);
    }
    [].forEach.call(bar.querySelectorAll('button[data-m]'), function (b) { b.classList.toggle('on', b.dataset.m === mode); });
    if (mode === 'flow') { if (eng) { eng.destroy(); eng = null; } if (ov) { ov.remove(); ov = null; } sig = ''; return; }
    var all = items(), list = windowed(all), s = mode + '|' + shape + '|' + all.length + '|' + list.map(function (x) { return x.id + x.src; }).join(',');
    if (!force && eng && ov && ov.parentNode === slot && s === sig) return;
    if (eng) eng.destroy();
    if (ov) ov.remove();
    ov = document.createElement('div'); ov.id = 'cm-ov'; ov.className = mode + ' ' + shape; slot.insertBefore(ov, bar); sig = s;
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
    '#cm-hbeam{position:absolute;inset:0;width:100%;height:100%;pointer-events:none;overflow:visible}' +
    '#cm-holo .cm-free .cm-c:not(.act){box-shadow:0 0 8px rgba(80,200,255,.3),inset 0 0 14px rgba(80,200,255,.12)!important}#cm-holo .cm-free .cm-c.act{box-shadow:0 0 0 1px rgba(214,251,255,.6),0 0 40px rgba(90,215,255,.8),0 24px 50px rgba(0,0,0,.45)!important}' +
    '#cm-hbar{position:absolute;top:calc(env(safe-area-inset-top,0px) + 12px);left:50%;transform:translateX(-50%);z-index:2100;pointer-events:auto;display:flex;align-items:center;gap:2px;max-width:94%;overflow-x:auto;scrollbar-width:none;padding:4px;border-radius:99px;background:rgba(6,30,46,.6);border:1px solid rgba(130,230,255,.45);box-shadow:0 0 22px rgba(80,200,255,.25),inset 0 0 14px rgba(80,200,255,.12);-webkit-backdrop-filter:blur(10px);backdrop-filter:blur(10px)}' +
    '#cm-hbar::-webkit-scrollbar{display:none}#cm-hbar button{flex:none;border:0;border-radius:99px;padding:6px 11px;background:none;color:#9fe6ff;font:600 11.5px ui-monospace,Menlo,monospace;letter-spacing:.06em;cursor:pointer;white-space:nowrap;text-shadow:0 0 6px rgba(110,230,255,.6)}' +
    '#cm-hbar button.on{background:rgba(160,240,255,.92);color:#03202e;text-shadow:none;box-shadow:0 0 14px rgba(140,235,255,.7)}#cm-hbar .sep{width:1px;height:18px;background:rgba(130,230,255,.35);margin:0 4px;flex:none}' +
    '#cm-hbar .x{width:30px;padding:6px 0;font-size:14px}';
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
  var holoEl = null, heng = null, hmode = 'sphere', hlist = null, hraf = 0;
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
    var HM = [['flow', '3D']].concat(MODES.filter(function (x) { return x[0] !== 'flow'; }));
    HM.forEach(function (x) { var b = document.createElement('button'); b.type = 'button'; b.textContent = x[1]; b.dataset.m = x[0]; tapOn(b, function () { hmode = x[0]; try { localStorage.setItem('minest.holoMode', hmode); } catch (er) {} build(); }); bar.appendChild(b); });
    var sep = document.createElement('i'); sep.className = 'sep'; bar.appendChild(sep);
    var shp = document.createElement('button'); shp.type = 'button'; bar.appendChild(shp);
    var paint = function () { shp.textContent = shape === 'port' ? '竖卡' : '横卡'; [].forEach.call(bar.querySelectorAll('[data-m]'), function (b) { b.classList.toggle('on', b.dataset.m === hmode); }); [].forEach.call(bar.querySelectorAll('.fo'), function (b) { b.style.display = hmode === 'free' ? '' : 'none'; }); };
    tapOn(shp, function () { shape = shape === 'port' ? 'land' : 'port'; try { localStorage.setItem('minest.coverShape', shape); } catch (er) {} build(); });
    var sty = document.createElement('button'); sty.type = 'button'; sty.textContent = '风格'; tapOn(sty, function () { if (window.MinestCardStyles) MinestCardStyles.open(); }); bar.appendChild(sty);
    if (opt.onLab) { var lab = document.createElement('button'); lab.type = 'button'; lab.textContent = '◈ 文字实验室'; tapOn(lab, function () { holoClose(); opt.onLab(); }); bar.appendChild(lab); }
    var x = document.createElement('button'); x.type = 'button'; x.className = 'x'; x.textContent = '✕'; x.title = '关闭全息卡片'; tapOn(x, function () { holoClose(); if (opt.onClose) opt.onClose(); }); bar.appendChild(x);
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
    cancelAnimationFrame(hraf);
    if (holoEl) { var e0 = holoEl; holoEl = null; e0.remove(); }
  }
  document.addEventListener('keydown', function (e) { if (e.key === 'Escape' && holoEl) { var b = holoEl.querySelector('#cm-hbar .x'); if (b) b.click(); } });
  window.MinestCoverModes = { holo: holo, holoClose: holoClose,  play: function (v) { playing = v === undefined ? !playing : !!v; var b = bar && bar.querySelector('.pl'); if (b) { b.textContent = playing ? '❚❚' : '▶'; b.classList.toggle('on', playing); } }, speed: function (v) { speed = v; }, set: setMode, get: function () { return mode; } };
})();

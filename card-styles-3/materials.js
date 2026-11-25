/* 卡片风格 3.0 — eight materials (from 2.0); also carried inside Minest's own pages (tools/v2-routes) —, written the way tools/cover-modes/card-styles.js writes its own (same
   selectors, same palette and light variables), so each can move into the app's script as it stands.
   Loaded after that script and before its gallery is built: the materials join its list. */
(function () {
  var CS = window.MinestCardStyles;
  if (!CS || window.MinestCardStyles2Materials) return;

  var NEW = [
    { id: 'ink-wash', cat: 'east', name: 'Ink Wash Landscape', zh: '水墨山水', desc: '宣纸上晕开的远山与一轮朱砂落日，一抹云雾随光在山腰游走；楷体墨字，朱砂印章标签。', accent: '#57534e' },
    { id: 'lacquer', cat: 'east', name: 'Lacquer & Gold Line', zh: '朱漆描金', desc: '层层髹涂的大漆镜面，描金回纹框与祥云；一道湿润的高光随角度滑过漆面。', accent: '#dc2626' },
    { id: 'titanium', cat: 'material', name: 'Brushed Titanium', zh: '拉丝钛', desc: '横向拉丝的钛合金板，倒角边缘与阳极氧化的淡彩；高光带跟着光横扫，文字像激光蚀刻。', accent: '#94a3b8' },
    { id: 'walnut', cat: 'material', name: 'Walnut Inlay', zh: '胡桃木镶嵌', desc: '深色胡桃木顺纹板，嵌一圈彩色树脂细线；雕刻凹字，黄铜铭牌标签，缎面清漆的柔光。', accent: '#92400e' },
    { id: 'terrazzo', cat: 'material', name: 'Terrazzo', zh: '水磨石', desc: '米白水泥底里嵌着赤陶、墨绿、沙黄的碎石，表面抛光；圆润粗体字，彩色胶囊标签。', accent: '#e07a5f' },
    { id: 'riso', cat: 'art', name: 'Risograph Print', zh: '孔版印刷', desc: '两色荧光油墨叠印出第三种颜色，套色微微错位，纸面留白边与油墨颗粒。', accent: '#ff5a8a' },
    { id: 'blueprint', cat: 'art', name: 'Blueprint', zh: '工程蓝图', desc: '晒图蓝底、粗细两级网格、白色制图线与尺寸标注；等宽字，虚线框标签。', accent: '#3b82f6' },
    { id: 'acrylic', cat: 'light', name: 'Edge-lit Acrylic', zh: '侧光亚克力', desc: '磨砂亚克力板，底边一条灯带把光导进板里：边缘发亮，刻字自带辉光。', accent: '#22d3ee' }
  ];

  function svgUri(svg) { return 'url("data:image/svg+xml,' + encodeURIComponent(svg) + '")'; }
  var GRAIN = svgUri('<svg xmlns="http://www.w3.org/2000/svg" width="160" height="160"><filter id="g"><feTurbulence type="fractalNoise" baseFrequency=".85" numOctaves="2" stitchTiles="stitch"/><feColorMatrix type="saturate" values="0"/></filter><rect width="160" height="160" filter="url(#g)" opacity=".16"/></svg>');
  var INK_SVG = svgUri('<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 240 320" preserveAspectRatio="none"><defs><linearGradient id="a" x1="0" y1="0" x2="0" y2="1"><stop offset="0" stop-color="#292524" stop-opacity=".46"/><stop offset=".8" stop-color="#292524" stop-opacity="0"/></linearGradient><linearGradient id="b" x1="0" y1="0" x2="0" y2="1"><stop offset="0" stop-color="#1c1917" stop-opacity=".82"/><stop offset=".72" stop-color="#1c1917" stop-opacity="0"/></linearGradient><filter id="f" x="-10%" y="-10%" width="120%" height="120%"><feGaussianBlur stdDeviation="1.4"/></filter></defs><circle cx="178" cy="62" r="17" fill="#c2331f" opacity=".86"/><path filter="url(#f)" fill="url(#a)" d="M-6 152 L30 112 L52 134 L88 78 L116 124 L146 96 L184 142 L212 116 L246 148 L246 300 L-6 300Z"/><path filter="url(#f)" fill="url(#b)" d="M-6 214 L26 176 L50 200 L84 150 L112 190 L140 168 L172 210 L202 186 L246 222 L246 320 L-6 320Z"/><g fill="none" stroke="#1c1917" stroke-width="1" stroke-linecap="round" opacity=".5"><path d="M40 50 q8 -7 16 0 M58 44 q7 -6 14 0"/></g></svg>');
  var LACQUER_SVG = svgUri('<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 240 320" preserveAspectRatio="none"><g fill="none" stroke="#e9c46a" stroke-linecap="round" stroke-linejoin="round"><rect x="9" y="9" width="222" height="302" rx="9" stroke-width="1.5"/><rect x="14.5" y="14.5" width="211" height="291" rx="5" stroke-width=".7" opacity=".8"/><g stroke-width="1.2" opacity=".9"><path d="M15 44 H34 V25 H24 V35"/><path d="M225 44 H206 V25 H216 V35"/></g><g stroke-width="1.5" opacity=".92"><path d="M108 104 h78 a13 13 0 1 0 -13 -13"/><path d="M173 91 a17 17 0 1 0 -32 -6"/><path d="M141 85 a13 13 0 1 0 -21 15"/><path d="M96 126 h56 a9 9 0 1 0 -9 -9"/><path d="M162 126 h34"/></g></g><g fill="#e9c46a" opacity=".85"><circle cx="120" cy="20" r="1.6"/><circle cx="120" cy="300" r="1.6"/></g></svg>');
  var BRUSH_SVG = svgUri('<svg xmlns="http://www.w3.org/2000/svg" width="320" height="320"><filter id="b" x="0" y="0" width="100%" height="100%"><feTurbulence type="fractalNoise" baseFrequency=".004 .9" numOctaves="2" seed="3"/><feColorMatrix type="saturate" values="0"/></filter><rect width="320" height="320" filter="url(#b)" opacity=".34"/></svg>');
  var WOOD_SVG = svgUri('<svg xmlns="http://www.w3.org/2000/svg" width="300" height="400"><filter id="w" x="0" y="0" width="100%" height="100%"><feTurbulence type="fractalNoise" baseFrequency=".11 .006" numOctaves="3" seed="11"/><feColorMatrix values="0 0 0 0 .13  0 0 0 0 .06  0 0 0 0 .02  0 0 0 -2.2 1.5"/></filter><rect width="300" height="400" filter="url(#w)"/></svg>');
  var CHIPS_SVG = svgUri('<svg xmlns="http://www.w3.org/2000/svg" width="160" height="160"><g fill="#e07a5f"><path d="M12 14l13-4 6 9-9 8-11-5z"/><path d="M96 38l10 2 2 9-9 4-7-7z"/><path d="M54 112l14-3 5 10-12 7-9-6z"/><path d="M132 126l9 5-3 10-11-2-1-8z"/></g><g fill="#3d405b"><path d="M58 22l8-5 9 6-4 9-11-1z"/><path d="M18 78l10-2 4 8-7 7-9-5z"/><path d="M118 82l12-3 6 9-8 8-11-4z"/><path d="M92 142l7-2 4 6-5 5-7-3z"/></g><g fill="#81b29a"><path d="M130 12l11 3 1 10-10 3-6-8z"/><path d="M72 66l9-6 9 5-2 10-12 1z"/><path d="M8 126l9 2 2 9-9 3-5-7z"/></g><g fill="#f2cc8f"><path d="M34 46l8-3 6 6-4 8-9-2z"/><path d="M142 52l8 4-2 9-9-1-2-7z"/><path d="M100 104l8-2 4 7-6 6-8-4z"/><path d="M36 146l10-3 5 7-7 6-9-3z"/></g><g fill="#a8a29e"><circle cx="84" cy="14" r="2.2"/><circle cx="46" cy="84" r="1.8"/><circle cx="150" cy="96" r="2.4"/><circle cx="70" cy="146" r="1.9"/><circle cx="112" cy="58" r="1.6"/><circle cx="14" cy="50" r="1.5"/></g></svg>');
  var BLUEPRINT_SVG = svgUri('<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 240 320" preserveAspectRatio="none"><g fill="none" stroke="#eaf2ff" stroke-width="1.1" opacity=".8"><circle cx="150" cy="96" r="46"/><circle cx="150" cy="96" r="22" stroke-dasharray="4 3"/><path d="M92 96h116M150 38v116" stroke-width=".7"/><path d="M104 160h92" stroke-width=".8"/><path d="M104 155v10M196 155v10"/><path d="M104 160l7 -3v6zM196 160l-7 -3v6z" fill="#eaf2ff"/><path d="M34 40v62h34" stroke-dasharray="6 4" stroke-width=".8"/><path d="M12 12h14M12 12v14M228 12h-14M228 12v14M12 308h14M12 308v-14M228 308h-14M228 308v-14" stroke-width="1.4"/></g></svg>');

  var TARGETS = '.coverflow-card-item .face-front, .coverflow-card-item .face-back, .cm-c, [data-card-id]:not(.coverflow-card-item)';
  function H(s) { return 'html[data-card-style="' + s + '"] '; }
  function rule(s, body) {
    return TARGETS.split(',').map(function (sel) { return H(s) + sel.trim(); }).concat('.cs-prev[data-s="' + s + '"]').join(',') + '{' + body + '}';
  }
  function focusRule(s, body) {
    return [H(s) + '.cm-c.act', H(s) + '.cm-c:hover', H(s) + '[data-card-id]:not(.coverflow-card-item):hover', H(s) + '[data-card-id]:not(.coverflow-card-item):focus-within',
      H(s) + '.coverflow-card-item.is-held-active .face-front', '.cs-opt:hover .cs-prev[data-s="' + s + '"]', '.cs-opt.on .cs-prev[data-s="' + s + '"]'].join(',') + '{' + body + '}';
  }
  function typo(s, body) {
    return TARGETS.split(',').map(function (sel) { var t = sel.trim(); return H(s) + t + ', ' + H(s) + t + ' *'; }).concat('.cs-prev[data-s="' + s + '"] span').join(',') + '{' + body + '}';
  }
  /* the small label: the app's tags and badges, and the pill on a gallery card */
  function label(s, body) {
    return [H(s) + '.cm-c .ws', H(s) + '.cm-c .wg', H(s) + '[data-card-id]:not(.coverflow-card-item) .card-label', H(s) + '[data-card-id]:not(.coverflow-card-item) span[class*="badge"]',
      H(s) + '[data-card-id]:not(.coverflow-card-item) span[class*="tag"]', '.cs-prev[data-s="' + s + '"] span.cs-pl'].join(',') + '{' + body + '}';
  }
  function before(s, body) {
    return TARGETS.split(',').map(function (sel) { return H(s) + sel.trim() + '::before'; }).concat('.cs-prev[data-s="' + s + '"]::before').join(',') + '{content:"";position:absolute;inset:0;pointer-events:none;border-radius:inherit;z-index:1;' + body + '}';
  }
  function after(s, body) {
    return TARGETS.split(',').map(function (sel) { return H(s) + sel.trim() + '::after'; }).concat('.cs-prev[data-s="' + s + '"]::after').join(',') + '{content:"";position:absolute;inset:0;pointer-events:none;border-radius:inherit;z-index:9;' + body + '}';
  }
  var INK2 = 'hsl(calc(var(--cs-hue) + 165deg) 88% 60%)';

  var css = document.createElement('style');
  css.id = 'cs2-materials';
  css.textContent = [
    /* 水墨山水 */
    rule('ink-wash', 'border-radius:6px!important;border:1px solid #d6cbb4!important;background:' + GRAIN + ' repeat,radial-gradient(70% 42% at 72% 22%,color-mix(in srgb,var(--cs-bd) 22%,transparent),transparent 72%),linear-gradient(180deg,#f8f3e8,#eee5d3)!important;color:#1c1917!important;box-shadow:0 18px 34px -14px rgba(41,37,36,.5),inset 0 0 0 1px rgba(255,255,255,.55)!important;'),
    focusRule('ink-wash', 'border-color:#44403c!important;box-shadow:0 0 0 1px #44403c,0 24px 44px -14px rgba(41,37,36,.6)!important;'),
    typo('ink-wash', 'font-family:"Kaiti SC","STKaiti","KaiTi","Songti SC","Palatino",serif!important;letter-spacing:.05em!important;color:#1c1917!important;text-shadow:0 0 1px rgba(28,25,23,.4)!important;'),
    label('ink-wash', 'border-radius:3px!important;background:#b91c1c!important;border:0!important;color:#fff7ed!important;font-weight:700!important;letter-spacing:.14em!important;text-shadow:none!important;'),
    before('ink-wash', 'background:' + INK_SVG + ' center/100% 100% no-repeat;'),
    after('ink-wash', 'background:radial-gradient(64% 20% at var(--cs-px) 58%,rgba(248,243,232,.85),transparent 72%);'),
    '.cs-prev[data-s="ink-wash"]{--cs-bd:#78716c}',

    /* 朱漆描金 */
    rule('lacquer', 'border-radius:14px!important;border:1px solid color-mix(in srgb,var(--cs-lip) 55%,#000)!important;background:radial-gradient(120% 70% at 30% 0%,color-mix(in srgb,var(--cs-lip) 86%,#fff) 0%,color-mix(in srgb,var(--cs-lip) 80%,#000) 48%,color-mix(in srgb,var(--cs-lt) 78%,#000) 100%)!important;color:#f3d98b!important;box-shadow:0 24px 44px -16px rgba(0,0,0,.7),inset 0 1px 0 rgba(255,255,255,.4),inset 0 -12px 26px rgba(0,0,0,.35)!important;'),
    focusRule('lacquer', 'box-shadow:0 0 0 1.5px #e9c46a,0 30px 54px -16px rgba(0,0,0,.75),0 0 30px color-mix(in srgb,var(--cs-lip) 50%,transparent)!important;'),
    typo('lacquer', 'font-family:"Songti SC","STSong","Noto Serif SC","Palatino",serif!important;font-weight:700!important;letter-spacing:.05em!important;color:#f3d98b!important;text-shadow:0 1px 0 rgba(0,0,0,.55)!important;'),
    label('lacquer', 'border-radius:2px!important;background:rgba(0,0,0,.18)!important;border:1px solid rgba(233,196,106,.75)!important;color:#f3d98b!important;letter-spacing:.16em!important;'),
    before('lacquer', 'background:' + LACQUER_SVG + ' center/100% 100% no-repeat;'),
    after('lacquer', 'background:linear-gradient(105deg,transparent calc(var(--cs-px) - 26%),rgba(255,255,255,.36) calc(var(--cs-px) - 4%),rgba(255,255,255,.07) calc(var(--cs-px) + 4%),transparent calc(var(--cs-px) + 22%)),radial-gradient(90% 26% at 50% 0%,rgba(255,255,255,.24),transparent 70%);mix-blend-mode:screen;'),
    '.cs-prev[data-s="lacquer"]{--cs-lip:#b3201a;--cs-lt:#4a0a08}',

    /* 拉丝钛 */
    rule('titanium', 'border-radius:14px!important;border:1px solid rgba(255,255,255,.6)!important;background:' + BRUSH_SVG + ' 0 0/100% 100%,linear-gradient(100deg,color-mix(in srgb,var(--cs-bd) 26%,#7d838c) 0%,color-mix(in srgb,var(--cs-bd) 14%,#c3c8d0) calc(var(--cs-px) - 20%),#f5f7fa var(--cs-px),color-mix(in srgb,var(--cs-bd) 16%,#a9afb8) calc(var(--cs-px) + 18%),color-mix(in srgb,var(--cs-bd) 30%,#6b717a) 100%)!important;color:#1b1e23!important;box-shadow:inset 0 1px 0 rgba(255,255,255,.9),inset 0 -1px 0 rgba(0,0,0,.35),0 22px 40px -14px rgba(0,0,0,.6)!important;'),
    focusRule('titanium', 'box-shadow:inset 0 1px 0 #fff,0 0 0 1.5px rgba(255,255,255,.9),0 28px 50px -14px rgba(0,0,0,.65),0 0 28px color-mix(in srgb,var(--cs-bd) 40%,transparent)!important;'),
    typo('titanium', 'font-family:"SF Pro Display","Helvetica Neue",-apple-system,"PingFang SC",sans-serif!important;font-weight:600!important;letter-spacing:.01em!important;color:#22262d!important;text-shadow:0 1px 0 rgba(255,255,255,.65)!important;'),
    label('titanium', 'border-radius:4px!important;background:rgba(20,23,28,.1)!important;border:1px solid rgba(20,23,28,.42)!important;color:#22262d!important;font-family:ui-monospace,"SF Mono",Menlo,monospace!important;letter-spacing:.14em!important;'),
    before('titanium', 'inset:5px;border-radius:9px;border:1px solid rgba(0,0,0,.16);box-shadow:inset 0 1px 0 rgba(255,255,255,.55);'),
    after('titanium', 'background:linear-gradient(var(--cs-ang),color-mix(in srgb,var(--cs-bd) 34%,transparent),transparent 42%,color-mix(in srgb,var(--cs-c2) 30%,transparent));mix-blend-mode:overlay;'),
    '.cs-prev[data-s="titanium"]{--cs-bd:#7aa2c8;--cs-c2:#e2e8f0}',

    /* 胡桃木镶嵌 */
    rule('walnut', 'border-radius:12px!important;border:1px solid #2b170b!important;background:' + WOOD_SVG + ' 0 0/100% 100%,linear-gradient(95deg,#80502f 0%,#5d361c 38%,#73472a 64%,#4c2a15 100%)!important;color:#f1e0c2!important;box-shadow:inset 0 1px 0 rgba(255,235,200,.3),inset 0 -2px 0 rgba(0,0,0,.4),0 24px 44px -16px rgba(0,0,0,.7)!important;'),
    focusRule('walnut', 'box-shadow:inset 0 1px 0 rgba(255,235,200,.4),0 0 0 1.5px #e9c97a,0 30px 52px -16px rgba(0,0,0,.75)!important;'),
    typo('walnut', 'font-family:"Iowan Old Style","Palatino","Songti SC",Georgia,serif!important;letter-spacing:.02em!important;color:#f1e0c2!important;text-shadow:0 -1px 0 rgba(0,0,0,.6),0 1px 0 rgba(255,235,200,.2)!important;'),
    label('walnut', 'border-radius:999px!important;background:linear-gradient(180deg,#ecd08a,#b8892f)!important;border:1px solid #7a5516!important;color:#3b2408!important;letter-spacing:.12em!important;text-shadow:0 1px 0 rgba(255,255,255,.4)!important;'),
    before('walnut', 'inset:8px;border-radius:6px;border:1.5px solid var(--cs-bd);box-shadow:0 0 0 1px rgba(0,0,0,.4),inset 0 0 0 1px rgba(0,0,0,.4);'),
    after('walnut', 'background:linear-gradient(100deg,transparent calc(var(--cs-px) - 32%),rgba(255,232,196,.26) var(--cs-px),transparent calc(var(--cs-px) + 32%));mix-blend-mode:screen;'),
    '.cs-prev[data-s="walnut"]{--cs-bd:#e9c46a}',

    /* 水磨石 */
    rule('terrazzo', 'border-radius:20px!important;border:1px solid color-mix(in srgb,var(--cs-bd) 35%,#d6d3d1)!important;background:' + CHIPS_SVG + ' 0 0/128px 128px,linear-gradient(160deg,color-mix(in srgb,var(--cs-c1) 60%,#f5f1ea),#ebe5da)!important;color:#292524!important;box-shadow:inset 0 1px 0 #fff,0 18px 34px -14px rgba(68,64,60,.5)!important;'),
    focusRule('terrazzo', 'border-color:var(--cs-lip)!important;box-shadow:inset 0 1px 0 #fff,0 0 0 2px color-mix(in srgb,var(--cs-lip) 45%,transparent),0 24px 44px -14px rgba(68,64,60,.55)!important;'),
    typo('terrazzo', 'font-family:"Avenir Next","Futura","PingFang SC",-apple-system,sans-serif!important;font-weight:700!important;letter-spacing:-.01em!important;color:#292524!important;text-shadow:0 1px 0 rgba(255,255,255,.75)!important;'),
    label('terrazzo', 'border-radius:999px!important;background:var(--cs-lip)!important;border:0!important;color:#fff!important;letter-spacing:.1em!important;text-shadow:none!important;'),
    before('terrazzo', 'background:linear-gradient(180deg,transparent 40%,rgba(245,241,234,.86) 76%);'),
    after('terrazzo', 'background:radial-gradient(circle at var(--cs-px) var(--cs-py),rgba(255,255,255,.6),transparent 40%);mix-blend-mode:soft-light;'),
    '.cs-prev[data-s="terrazzo"]{--cs-c1:#fef6e4;--cs-bd:#e07a5f;--cs-lip:#c8553d}',

    /* 孔版印刷 */
    rule('riso', 'border-radius:4px!important;border:0!important;background:' + GRAIN + ' repeat,radial-gradient(circle closest-side at 60% 30%,var(--cs-bd) 0 86%,transparent 87%),radial-gradient(circle closest-side at 40% 45%,' + INK2 + ' 0 84%,transparent 85%),repeating-linear-gradient(-45deg,' + INK2 + ' 0 2px,transparent 2px 8px) 0 100%/100% 9% no-repeat,#f5efe0!important;background-blend-mode:multiply!important;color:#1f2a7a!important;box-shadow:0 14px 26px -12px rgba(0,0,0,.5)!important;'),
    focusRule('riso', 'box-shadow:6px 6px 0 var(--cs-bd),0 20px 34px -12px rgba(0,0,0,.5)!important;'),
    typo('riso', 'font-family:"Futura","Avenir Next Condensed","Helvetica Neue","PingFang SC",sans-serif!important;font-weight:800!important;letter-spacing:-.01em!important;color:#1f2a7a!important;text-shadow:1.5px 1.5px 0 color-mix(in srgb,var(--cs-bd) 75%,transparent)!important;'),
    label('riso', 'border-radius:0!important;background:#1f2a7a!important;border:0!important;color:#f5efe0!important;letter-spacing:.14em!important;text-shadow:none!important;'),
    after('riso', 'box-shadow:inset 0 0 0 6px #f5efe0;'),
    '.cs-prev[data-s="riso"]{--cs-bd:#ff5a8a;--cs-hue:40deg}',

    /* 工程蓝图 */
    rule('blueprint', 'border-radius:8px!important;border:1px solid rgba(255,255,255,.55)!important;background:linear-gradient(rgba(255,255,255,.16) 1px,transparent 1px) 0 0/100% 40px,linear-gradient(90deg,rgba(255,255,255,.16) 1px,transparent 1px) 0 0/40px 100%,linear-gradient(rgba(255,255,255,.06) 1px,transparent 1px) 0 0/100% 8px,linear-gradient(90deg,rgba(255,255,255,.06) 1px,transparent 1px) 0 0/8px 100%,radial-gradient(120% 90% at var(--cs-px) var(--cs-py),color-mix(in srgb,var(--cs-lip) 55%,#1d4ed8),color-mix(in srgb,var(--cs-lt) 45%,#0b2a66))!important;color:#eaf2ff!important;box-shadow:0 20px 38px -14px rgba(5,20,60,.7)!important;'),
    focusRule('blueprint', 'border-color:#fff!important;box-shadow:0 0 0 1px rgba(255,255,255,.7),0 26px 46px -14px rgba(5,20,60,.8)!important;'),
    typo('blueprint', 'font-family:"SF Mono",ui-monospace,Menlo,"PingFang SC",monospace!important;font-weight:600!important;letter-spacing:.02em!important;color:#eaf2ff!important;text-shadow:none!important;'),
    label('blueprint', 'border-radius:0!important;background:transparent!important;border:1px dashed rgba(234,242,255,.75)!important;color:#eaf2ff!important;letter-spacing:.14em!important;'),
    before('blueprint', 'background:' + BLUEPRINT_SVG + ' center/100% 100% no-repeat;'),
    after('blueprint', 'box-shadow:inset 0 0 36px rgba(0,0,0,.3);'),
    '.cs-prev[data-s="blueprint"]{--cs-lip:#1d4ed8;--cs-lt:#0b2a66}',

    /* 侧光亚克力 */
    rule('acrylic', 'border-radius:16px!important;border:1.5px solid color-mix(in srgb,var(--cs-bd) 55%,#fff)!important;background:radial-gradient(130% 58% at 50% 112%,color-mix(in srgb,var(--cs-bd) 85%,transparent),transparent 70%),radial-gradient(60% 40% at var(--cs-px) 0%,rgba(255,255,255,.2),transparent 70%),linear-gradient(180deg,rgba(255,255,255,.1),rgba(255,255,255,.03)),rgba(14,17,26,.72)!important;-webkit-backdrop-filter:blur(10px)!important;backdrop-filter:blur(10px)!important;color:#fff!important;box-shadow:0 0 26px color-mix(in srgb,var(--cs-bd) 55%,transparent),inset 0 0 22px color-mix(in srgb,var(--cs-bd) 45%,transparent),inset 0 1px 0 rgba(255,255,255,.6),0 22px 40px -14px rgba(0,0,0,.6)!important;'),
    focusRule('acrylic', 'box-shadow:0 0 40px color-mix(in srgb,var(--cs-bd) 75%,transparent),inset 0 0 28px color-mix(in srgb,var(--cs-bd) 60%,transparent),inset 0 1px 0 rgba(255,255,255,.75),0 28px 50px -14px rgba(0,0,0,.65)!important;'),
    typo('acrylic', 'font-family:"SF Pro Rounded","SF Pro Display",-apple-system,"PingFang SC",sans-serif!important;font-weight:700!important;color:#fff!important;text-shadow:0 0 10px var(--cs-bd),0 0 22px color-mix(in srgb,var(--cs-bd) 70%,transparent)!important;'),
    label('acrylic', 'border-radius:999px!important;background:transparent!important;border:1px solid color-mix(in srgb,var(--cs-bd) 70%,#fff)!important;color:#fff!important;letter-spacing:.12em!important;box-shadow:0 0 10px color-mix(in srgb,var(--cs-bd) 60%,transparent)!important;'),
    before('acrylic', 'background:' + GRAIN + ' repeat;opacity:.55;'),
    after('acrylic', 'background:linear-gradient(115deg,transparent calc(var(--cs-px) - 14%),rgba(255,255,255,.22) var(--cs-px),transparent calc(var(--cs-px) + 10%));box-shadow:inset 0 0 0 1px rgba(255,255,255,.22),inset 0 -3px 0 color-mix(in srgb,var(--cs-bd) 90%,#fff);'),
    '.cs-prev[data-s="acrylic"]{--cs-bd:#22d3ee}'
  ].join('\n');
  document.head.appendChild(css);

  NEW.forEach(function (s) { if (!CS.styles.some(function (x) { return x.id === s.id; })) CS.styles.push(s); });
  window.MinestCardStyles2Materials = NEW.map(function (s) { return s.id; });
})();

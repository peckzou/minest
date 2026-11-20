/* Minest 15 Bespoke Tactile Card Styles — Appearance, Typography, Focus States, Multi-Layer SVGs & Colorful Palettes */
(function () {
  'use strict';
  if (window.MinestCardStyles) return;

  var KEY = 'minest.cardStyle';
  var STYLES = [
    { id: 'default', name: 'Classic Default', zh: '经典默认', desc: 'Minest 原生卡片质感，清爽简洁。', accent: '#64748b' },
    { id: '3d-cover', name: '3D Cover', zh: '立体封面', desc: '封面分层、景深、视差与轻微旋转，像真实的立体唱片封面。', accent: '#22d3ee' },
    { id: 'cartoon', name: 'Cartoon Card', zh: '卡通立体', desc: '圆润造型、鲜明色彩、柔和阴影，适合收藏、学习与个人内容。', accent: '#f472b6' },
    { id: 'hard-paper', name: 'Hard Paper Card', zh: '厚卡纸', desc: '厚卡纸、可见纸张切面、压印文字和真实纸张纹理，翻转时有实体卡片的重量感。', accent: '#b45309' },
    { id: 'liquid-glass', name: 'Liquid Glass', zh: '液态玻璃', desc: '半透明、折射、柔和高光，适合现代工具与信息界面。', accent: '#38bdf8' },
    { id: 'paper-cut', name: 'Paper Cut Card', zh: '多层剪纸', desc: '多层剪纸构成的微型场景，层与层之间产生真实阴影。', accent: '#ea580c' },
    { id: 'diorama', name: 'Diorama Card', zh: '微缩立体盒', desc: '卡片内部是一座微缩立体世界，可旋转、缩放、观察。', accent: '#a16207' },
    { id: 'leather-foil', name: 'Leather & Foil', zh: '皮革烫金', desc: '皮革、烫金、压纹，适合经典收藏和个人知识档案。', accent: '#d4af37' },
    { id: 'holographic', name: 'Holographic Card', zh: '彩虹镭射', desc: '彩虹镭射、动态反光、角度变化，适合特殊收藏与成就卡片。', accent: '#c084fc' },
    { id: 'cyber-neon', name: 'Cyber Neon HUD', zh: '赛博霓虹', desc: '切角机甲终端、双色霓虹扫描线与等宽科技字体，带高能聚焦锁定框。', accent: '#06b6d4' },
    { id: 'watercolor', name: 'Botanical Watercolor', zh: '水彩手绘', desc: '冷压水彩纸晕染、手绘植物叶脉与优雅手写衬线，温润艺术画布感。', accent: '#10b981' },
    { id: 'brutalist', name: 'Neo-Brutalist Pop', zh: '波普野兽派', desc: '粗黑几何描边、硬朗错位块面阴影、半调网点与张力波普大字。', accent: '#facc15' },
    { id: 'stained-glass', name: 'Stained Glass', zh: '彩绘琉璃', desc: '拱形哥特花窗、铅条镶嵌几何彩色玻璃与逆光神圣辉光。', accent: '#f59e0b' },
    { id: 'porcelain', name: 'Blue Porcelain', zh: '青花瓷韵', desc: '温润白瓷釉面、钴蓝回纹缠枝角花、宋体墨韵与朱砂印章标签。', accent: '#2563eb' },
    { id: 'velvet-theatre', name: 'Velvet & Brass', zh: '丝绒鎏金', desc: '深邃剧院天鹅绒光泽、Art Deco 鎏金放射几何线框与聚光灯焦点。', accent: '#e11d48' },
    { id: 'mother-of-pearl', name: 'Mother of Pearl', zh: '珍珠母贝', desc: '天然鲍贝螺钿虹彩层纹、温润珠光干涉色泽与银边镶嵌工艺。', accent: '#f9a8d4' },
    { id: 'kintsugi-jade', name: 'Kintsugi Celadon Jade', zh: '金缮青玉', desc: '宋代汝窑青玉温润冰裂釉面，以 24K 纯金修补裂纹的东方金缮美学。', accent: '#34d399' },
    { id: 'aurora-silk', name: 'Aurora Silk Brocade', zh: '流光云锦', desc: '细密斜纹真丝提花织物肌理、云纹暗花与随角度流动的丝绸光泽。', accent: '#f59e0b' }
  ];

  var PALETTES = [
    [0,   '#fff1f2', '#fecdd3', '#fb7185', '#e11d48', '#4c0519'],
    [32,  '#fff7ed', '#fed7aa', '#fb923c', '#ea580c', '#431407'],
    [55,  '#fefce8', '#fef08a', '#eab308', '#ca8a04', '#3f2e05'],
    [135, '#ecfdf5', '#a7f3d0', '#34d399', '#059669', '#064e3b'],
    [175, '#f0fdfa', '#99f6e4', '#2dd4bf', '#0d9488', '#134e4a'],
    [200, '#f0f9ff', '#bae6fd', '#38bdf8', '#0284c7', '#0c4a6e'],
    [235, '#eef2ff', '#c7d2fe', '#818cf8', '#4f46e5', '#1e1b4b'],
    [275, '#faf5ff', '#e9d5ff', '#c084fc', '#9333ea', '#3b0764'],
    [315, '#fdf2f8', '#fbcfe8', '#f472b6', '#db2777', '#500724'],
    [15,  '#fff5f5', '#fed7d7', '#f87171', '#dc2626', '#450a0a'],
    [100, '#f7fee7', '#d9f99d', '#84cc16', '#4d7c0f', '#1a2e05'],
    [190, '#ecfeff', '#a5f3fc', '#22d3ee', '#0891b2', '#083344']
  ];

  function svgUri(svg) {
    return 'url("data:image/svg+xml;utf8,' + encodeURIComponent(svg.replace(/\s+/g, ' ').trim()) + '")';
  }

  var PAPER_NOISE = svgUri('<svg xmlns="http://www.w3.org/2000/svg" width="180" height="180"><filter id="n"><feTurbulence type="fractalNoise" baseFrequency="0.92" numOctaves="4" stitchTiles="stitch"/><feColorMatrix type="saturate" values="0.15"/></filter><rect width="180" height="180" filter="url(#n)" opacity="0.11"/></svg>');
  var LEATHER_GRAIN = svgUri('<svg xmlns="http://www.w3.org/2000/svg" width="140" height="140"><filter id="l"><feTurbulence type="turbulence" baseFrequency="0.52" numOctaves="3" stitchTiles="stitch"/><feColorMatrix type="saturate" values="0"/></filter><rect width="140" height="140" filter="url(#l)" opacity="0.24"/></svg>');
  var GOLD_CORNERS = svgUri('<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 200 200" preserveAspectRatio="none"><g fill="none" stroke="#f5d061" stroke-width="1.4" stroke-opacity="0.85"><path d="M12 34 L12 12 L34 12 M17 26 Q17 17 26 17"/><path d="M166 12 L188 12 L188 34 M174 17 Q183 17 183 26"/><path d="M12 166 L12 188 L34 188 M17 174 Q17 183 26 183"/><path d="M166 188 L188 188 L188 166 M174 183 Q183 183 183 174"/></g><circle cx="12" cy="12" r="2.2" fill="#fde68a"/><circle cx="188" cy="12" r="2.2" fill="#fde68a"/><circle cx="12" cy="188" r="2.2" fill="#fde68a"/><circle cx="188" cy="188" r="2.2" fill="#fde68a"/></svg>');
  var PAPER_CUT_SVG = svgUri('<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 320 220" preserveAspectRatio="none"><defs><filter id="ds" x="-15%" y="-15%" width="130%" height="140%"><feDropShadow dx="0" dy="-3.5" stdDeviation="4" flood-color="#1c1008" flood-opacity="0.45"/></filter><linearGradient id="sky" x1="0" y1="0" x2="0" y2="1"><stop offset="0%" stop-color="#fbbf24"/><stop offset="45%" stop-color="#f97316"/><stop offset="100%" stop-color="#c2410c"/></linearGradient><radialGradient id="led" cx="50%" cy="0%" r="70%"><stop offset="0%" stop-color="#fffbeb" stop-opacity="0.7"/><stop offset="100%" stop-color="#fffbeb" stop-opacity="0"/></radialGradient></defs><rect width="320" height="220" fill="url(#sky)"/><rect width="320" height="90" fill="url(#led)"/><circle cx="228" cy="54" r="24" fill="#fef3c7" opacity="0.92"/><path d="M0 118 Q55 72 118 104 T245 86 L320 110 L320 220 L0 220 Z" fill="#64748b" filter="url(#ds)"/><path d="M0 142 Q78 102 155 134 T320 120 L320 220 L0 220 Z" fill="#334155" filter="url(#ds)"/><path d="M0 166 Q65 138 145 160 T270 148 L320 164 L320 220 L0 220 Z" fill="#1e3a5f" filter="url(#ds)"/><path d="M0 186 Q85 170 175 186 T320 178 L320 220 L0 220 Z" fill="#14532d" filter="url(#ds)"/><path d="M18 220 L28 158 L38 220 M42 220 L50 172 L58 220 M274 220 L284 162 L294 220" fill="#052e16" filter="url(#ds)"/></svg>');
  var DIORAMA_SVG = svgUri('<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 320 220" preserveAspectRatio="none"><defs><radialGradient id="aur" cx="56%" cy="20%" r="58%"><stop offset="0%" stop-color="#34d399" stop-opacity="0.52"/><stop offset="48%" stop-color="#38bdf8" stop-opacity="0.22"/><stop offset="100%" stop-color="#090f24" stop-opacity="0"/></radialGradient><radialGradient id="gl" cx="50%" cy="72%" r="44%"><stop offset="0%" stop-color="#fde68a" stop-opacity="0.82"/><stop offset="50%" stop-color="#f59e0b" stop-opacity="0.26"/><stop offset="100%" stop-color="#000" stop-opacity="0"/></radialGradient></defs><rect width="320" height="220" fill="#090f24"/><rect width="320" height="220" fill="url(#aur)"/><rect width="320" height="220" fill="url(#gl)"/><circle cx="48" cy="34" r="1.4" fill="#fff" opacity="0.85"/><circle cx="112" cy="22" r="1.1" fill="#fff" opacity="0.72"/><circle cx="255" cy="38" r="1.6" fill="#fef08a" opacity="0.9"/><circle cx="192" cy="28" r="1" fill="#fff" opacity="0.65"/><ellipse cx="210" cy="68" rx="34" ry="11" fill="#fef3c7" opacity="0.22"/><path d="M0 168 Q82 148 164 162 T320 154 L320 220 L0 220 Z" fill="#3f6212" opacity="0.94"/><path d="M0 184 Q92 172 190 182 T320 174 L320 220 L0 220 Z" fill="#365314"/><circle cx="160" cy="166" r="5" fill="#fef08a" opacity="0.95"/></svg>');
  var HOLO_PRISM = svgUri('<svg xmlns="http://www.w3.org/2000/svg" width="140" height="140"><g fill-opacity="0.22" stroke="#fff" stroke-opacity="0.28" stroke-width="0.65"><polygon points="0,0 52,18 24,62" fill="#f472b6"/><polygon points="52,18 110,0 86,54" fill="#38bdf8"/><polygon points="24,62 86,54 58,104" fill="#facc15"/><polygon points="86,54 140,36 122,96" fill="#4ade80"/><polygon points="0,78 58,104 20,140" fill="#c084fc"/><polygon points="58,104 122,96 102,140" fill="#2dd4bf"/><polygon points="110,0 140,0 140,36 86,54" fill="#fb7185"/></g><circle cx="34" cy="28" r="1.2" fill="#fff" opacity="0.9"/><circle cx="98" cy="42" r="1.4" fill="#fff" opacity="0.85"/><circle cx="62" cy="88" r="1.1" fill="#fff" opacity="0.9"/><circle cx="118" cy="112" r="1.3" fill="#fff" opacity="0.85"/></svg>');
  var CARTOON_SPARKLE = svgUri('<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 180 180" preserveAspectRatio="none"><circle cx="14" cy="14" r="4.5" fill="#fff" opacity="0.96"/><circle cx="166" cy="14" r="4.5" fill="#fff" opacity="0.96"/><circle cx="14" cy="166" r="4.5" fill="#fff" opacity="0.96"/><circle cx="166" cy="166" r="4.5" fill="#fff" opacity="0.96"/><path d="M28 18 L30.5 25 L37.5 27.5 L30.5 30 L28 37 L25.5 30 L18.5 27.5 L25.5 25 Z" fill="#fff" opacity="0.95"/><path d="M152 142 L154.5 149 L161.5 151.5 L154.5 154 L152 161 L149.5 154 L142.5 151.5 L149.5 149 Z" fill="#fff" opacity="0.95"/><path d="M152 22 C152 18.2 147.2 16.8 144.5 20 C141.8 16.8 137 18.2 137 22 C137 26.8 144.5 31.5 144.5 31.5 C144.5 31.5 152 26.8 152 22 Z" fill="#fda4af" opacity="0.9"/><circle cx="34" cy="150" r="3.2" fill="#fde047" opacity="0.92"/><circle cx="146" cy="38" r="2.4" fill="#a7f3d0" opacity="0.94"/></svg>');

  /* 6 New Bespoke Style SVGs */
  var CYBER_HUD_SVG = svgUri('<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 240 160" preserveAspectRatio="none"><g fill="none" stroke="#22d3ee" stroke-width="1.8" opacity="0.88"><path d="M8 28 L8 8 L28 8"/><path d="M212 8 L232 8 L232 28"/><path d="M8 132 L8 152 L28 152"/><path d="M212 152 L232 152 L232 132"/></g><g stroke="#f43f5e" stroke-width="1.2" opacity="0.75"><line x1="36" y1="8" x2="58" y2="8"/><line x1="182" y1="152" x2="204" y2="152"/></g><rect x="14" y="14" width="6" height="2" fill="#22d3ee" opacity="0.8"/><rect x="24" y="14" width="6" height="2" fill="#f43f5e" opacity="0.8"/></svg>');
  var WATERCOLOR_SVG = svgUri('<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 280 200" preserveAspectRatio="none"><defs><radialGradient id="w1" cx="22%" cy="24%" r="52%"><stop offset="0%" stop-color="#f472b6" stop-opacity="0.38"/><stop offset="60%" stop-color="#fbbf24" stop-opacity="0.16"/><stop offset="100%" stop-color="#fff" stop-opacity="0"/></radialGradient><radialGradient id="w2" cx="82%" cy="76%" r="56%"><stop offset="0%" stop-color="#34d399" stop-opacity="0.38"/><stop offset="55%" stop-color="#38bdf8" stop-opacity="0.18"/><stop offset="100%" stop-color="#fff" stop-opacity="0"/></radialGradient></defs><rect width="280" height="200" fill="#faf8f5"/><rect width="280" height="200" fill="url(#w1)"/><rect width="280" height="200" fill="url(#w2)"/><g fill="none" stroke="#0f766e" stroke-width="1.1" stroke-opacity="0.38"><path d="M18 188 Q42 142 78 122"/><path d="M40 156 Q28 142 48 134 Q54 148 40 156 Z" fill="#34d399" fill-opacity="0.22"/><path d="M58 138 Q50 124 68 118 Q72 132 58 138 Z" fill="#34d399" fill-opacity="0.22"/></g></svg>');
  var HALFTONE_SVG = svgUri('<svg xmlns="http://www.w3.org/2000/svg" width="24" height="24"><circle cx="4" cy="4" r="1.6" fill="#0f172a" fill-opacity="0.14"/><circle cx="16" cy="16" r="1.6" fill="#0f172a" fill-opacity="0.14"/></svg>');
  var STAINED_GLASS_SVG = svgUri('<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 240 180" preserveAspectRatio="none"><g stroke="#0f172a" stroke-width="2.2" stroke-opacity="0.72" fill-opacity="0.52"><polygon points="0,0 75,0 48,58 0,44" fill="#e11d48"/><polygon points="75,0 165,0 142,52 48,58" fill="#f59e0b"/><polygon points="165,0 240,0 240,48 142,52" fill="#0284c7"/><polygon points="0,44 48,58 32,126 0,118" fill="#7c3aed"/><polygon points="48,58 142,52 162,118 32,126" fill="#10b981"/><polygon points="142,52 240,48 240,122 162,118" fill="#f43f5e"/><polygon points="0,118 32,126 88,180 0,180" fill="#0284c7"/><polygon points="32,126 162,118 175,180 88,180" fill="#eab308"/><polygon points="162,118 240,122 240,180 175,180" fill="#8b5cf6"/></g></svg>');
  var PORCELAIN_SVG = svgUri('<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 220 220" preserveAspectRatio="none"><g fill="none" stroke="#1d4ed8" stroke-width="1.3" stroke-opacity="0.72"><rect x="7" y="7" width="206" height="206" rx="14"/><rect x="11" y="11" width="198" height="198" rx="11" stroke-width="0.7"/><path d="M11 28 L24 28 L24 18 L18 18 L18 23"/><path d="M209 28 L196 28 L196 18 L202 18 L202 23"/><path d="M11 192 L24 192 L24 202 L18 202 L18 197"/><path d="M209 192 L196 192 L196 202 L202 202 L202 197"/></g></svg>');
  var VELVET_DECO_SVG = svgUri('<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 240 180" preserveAspectRatio="none"><g fill="none" stroke="#facc15" stroke-width="1.15" stroke-opacity="0.78"><rect x="8" y="8" width="224" height="164" rx="10"/><path d="M8 32 L32 8 M8 44 L44 8 M208 8 L232 32 M196 8 L232 44 M8 148 L32 172 M8 136 L44 172 M208 172 L232 148 M196 172 L232 136"/><polygon points="120,12 126,18 120,24 114,18" fill="#facc15" fill-opacity="0.65"/></g></svg>');
  var PEARL_NACRE_SVG = svgUri('<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 240 180" preserveAspectRatio="none"><g fill="none" stroke="#fff" stroke-width="1.2" stroke-opacity="0.55"><path d="M-20 40 Q60 10 140 45 T260 30"/><path d="M-20 85 Q75 52 155 88 T260 75"/><path d="M-20 130 Q50 102 135 134 T260 122"/><path d="M-20 165 Q85 140 165 168 T260 158"/></g></svg>');
  var KINTSUGI_SVG = svgUri('<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 240 180" preserveAspectRatio="none"><g fill="none" stroke="#cbd5e1" stroke-width="0.7" stroke-opacity="0.45"><path d="M40 0 L68 52 L18 96 M190 0 L158 64 L240 108 M68 52 L134 112 L92 180"/></g><g fill="none" stroke="#facc15" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M0 36 L54 58 L96 42 L148 94 L212 72 L240 84"/><path d="M96 42 L114 0"/><path d="M148 94 L132 152 L164 180"/></g><g fill="#fef08a"><circle cx="54" cy="58" r="2"/><circle cx="96" cy="42" r="2.2"/><circle cx="148" cy="94" r="2.4"/><circle cx="132" cy="152" r="1.8"/></g></svg>');
  var SILK_WEAVE_SVG = svgUri('<svg xmlns="http://www.w3.org/2000/svg" width="32" height="32"><path d="M0 16 Q8 8 16 16 T32 16 M0 32 Q8 24 16 32 T32 32 M0 0 Q8 -8 16 0 T32 0" fill="none" stroke="#fff" stroke-width="0.9" stroke-opacity="0.24"/><path d="M8 8 C12 4 20 4 24 8 C20 12 12 12 8 8 Z" fill="#fde68a" fill-opacity="0.16"/></svg>');

  var cur = 'default';
  var seedSalt = Math.floor(Math.random() * 10000);
  try {
    var saved = localStorage.getItem(KEY);
    if (saved && STYLES.some(function (s) { return s.id === saved; })) cur = saved;
  } catch (e) {}

  var TARGETS = '.coverflow-card-item .face-front, .coverflow-card-item .face-back, .cm-c, [data-card-id]';
  function rule(s, body) {
    return TARGETS.split(',').map(function (sel) {
      return 'html[data-card-style="' + s + '"] ' + sel.trim();
    }).concat('.cs-prev[data-s="' + s + '"]').join(',') + '{' + body + '}';
  }
  function focusRule(s, body) {
    return [
      'html[data-card-style="' + s + '"] .cm-c.act',
      'html[data-card-style="' + s + '"] .cm-c:hover',
      'html[data-card-style="' + s + '"] [data-card-id]:hover',
      'html[data-card-style="' + s + '"] [data-card-id]:focus-within',
      'html[data-card-style="' + s + '"] .coverflow-card-item.is-held-active .face-front',
      '.cs-opt:hover .cs-prev[data-s="' + s + '"]',
      '.cs-opt.on .cs-prev[data-s="' + s + '"]'
    ].join(',') + '{' + body + '}';
  }
  function typo(s, body) {
    return TARGETS.split(',').map(function (sel) {
      var t = sel.trim();
      return 'html[data-card-style="' + s + '"] ' + t + ', html[data-card-style="' + s + '"] ' + t + ' *';
    }).concat('.cs-prev[data-s="' + s + '"] span').join(',') + '{' + body + '}';
  }
  function subTypo(s, body) {
    return [
      'html[data-card-style="' + s + '"] .cm-c .ws',
      'html[data-card-style="' + s + '"] .cm-c .wg',
      'html[data-card-style="' + s + '"] [data-card-id] .card-label',
      'html[data-card-style="' + s + '"] [data-card-id] span[class*="badge"]',
      'html[data-card-style="' + s + '"] [data-card-id] span[class*="tag"]'
    ].join(',') + '{' + body + '}';
  }
  function before(s, body) {
    return TARGETS.split(',').map(function (sel) {
      return 'html[data-card-style="' + s + '"] ' + sel.trim() + '::before';
    }).concat('.cs-prev[data-s="' + s + '"]::before').join(',') + '{content:"";position:absolute;inset:0;pointer-events:none;border-radius:inherit;z-index:1;' + body + '}';
  }
  function after(s, body) {
    return TARGETS.split(',').map(function (sel) {
      return 'html[data-card-style="' + s + '"] ' + sel.trim() + '::after';
    }).concat('.cs-prev[data-s="' + s + '"]::after').join(',') + '{content:"";position:absolute;inset:0;pointer-events:none;border-radius:inherit;z-index:9;' + body + '}';
  }

  var css = document.createElement('style');
  css.id = 'cs-style-sheet';
  css.textContent = [
    ':root{--cs-px:50%;--cs-py:50%;--cs-ang:125deg;--cs-hue:0deg;--cs-c1:#fff1f2;--cs-c2:#fecdd3;--cs-bd:#38bdf8;--cs-lip:#0284c9;--cs-lt:#1e1b4b}',

    /* Floating trigger pill */
    '#cs-btn{position:fixed;left:14px;bottom:88px;z-index:2147482000;display:flex;align-items:center;gap:7px;height:34px;padding:0 14px;border-radius:999px;border:1px solid rgba(255,255,255,.34);background:rgba(15,23,42,.88);color:#fff;font:600 12px/1 -apple-system,system-ui,sans-serif;cursor:pointer;backdrop-filter:blur(18px);-webkit-backdrop-filter:blur(18px);box-shadow:0 10px 28px rgba(0,0,0,.32),inset 0 1px 0 rgba(255,255,255,.22);transition:transform .18s cubic-bezier(.22,1,.36,1),background .16s ease}',
    '#cs-btn:hover{transform:translateY(-1px) scale(1.02);background:rgba(30,41,59,.96)}',
    '#cs-btn .cs-dot{width:9px;height:9px;border-radius:50%;flex:none;box-shadow:0 0 8px currentColor}',
    '@media (orientation:landscape){#cs-btn{bottom:16px}}',

    /* Modal overlay & 15-grid */
    '#cs-modal{position:fixed;inset:0;z-index:2147482500;display:none;align-items:center;justify-content:center;padding:18px;background:rgba(8,12,20,.72);backdrop-filter:blur(20px);-webkit-backdrop-filter:blur(20px);font-family:-apple-system,system-ui,sans-serif}',
    '#cs-modal.open{display:flex}',
    '#cs-panel{width:min(940px,96vw);max-height:88vh;overflow:auto;border-radius:26px;padding:22px;background:rgba(248,250,252,.97);color:#0f172a;box-shadow:0 36px 96px rgba(0,0,0,.48);border:1px solid rgba(255,255,255,.9)}',
    'body.theme-dark #cs-panel{background:rgba(16,22,34,.96);color:#f1f5f9;border-color:rgba(255,255,255,.14)}',
    '#cs-head{display:flex;align-items:center;justify-content:space-between;gap:10px;margin-bottom:16px}',
    '#cs-head h3{margin:0;font:800 18px/1.2 -apple-system,system-ui,sans-serif;letter-spacing:-.02em;flex:1}',
    '#cs-shuf{border:0;border-radius:999px;padding:7px 13px;background:rgba(14,165,233,.14);color:#0284c7;font:600 12px/1 -apple-system,system-ui,sans-serif;cursor:pointer;transition:transform .15s ease}',
    '#cs-shuf:active{transform:scale(.95)}',
    'body.theme-dark #cs-shuf{background:rgba(56,189,248,.18);color:#7dd3fc}',
    '#cs-close{width:32px;height:32px;border-radius:50%;border:0;background:rgba(100,116,139,.18);color:inherit;font:700 17px/1 sans-serif;cursor:pointer}',
    '#cs-grid{display:grid;grid-template-columns:repeat(3,minmax(0,1fr));gap:14px}',
    '@media (max-width:640px){#cs-grid{grid-template-columns:repeat(2,minmax(0,1fr));gap:10px}}',
    '.cs-opt{display:flex;flex-direction:column;text-align:left;padding:10px;border-radius:18px;border:2px solid transparent;background:rgba(148,163,184,.08);cursor:pointer;transition:transform .18s cubic-bezier(.22,1,.36,1),border-color .16s ease,background .16s ease;color:inherit}',
    '.cs-opt:hover{transform:translateY(-3px);background:rgba(148,163,184,.16)}',
    '.cs-opt.on{border-color:#0ea5e9;background:rgba(14,165,233,.12)}',
    '.cs-prev{position:relative;width:100%;height:106px;border-radius:14px;margin-bottom:9px;display:flex;align-items:center;justify-content:center;overflow:hidden;font:700 14px/1.2 -apple-system,system-ui,sans-serif;transition:all .22s cubic-bezier(.22,1,.36,1)}',
    '.cs-prev span{position:relative;z-index:10}',
    '.cs-opt-t{font:700 13px/1.25 -apple-system,system-ui,sans-serif;margin-bottom:3px}',
    '.cs-opt-d{font:400 11px/1.38 -apple-system,system-ui,sans-serif;opacity:.76;display:-webkit-box;-webkit-line-clamp:2;-webkit-box-orient:vertical;overflow:hidden}',

    'html:not([data-card-style="default"]) [data-card-id]{position:relative!important;overflow:hidden!important;transition:transform .22s cubic-bezier(.22,1,.36,1),box-shadow .22s ease,border-color .22s ease!important}',
    'html:not([data-card-style="default"]) [data-card-id]:hover{transform:translateY(-3px)!important}',

    /* 1. Default */
    '.cs-prev[data-s="default"]{background:linear-gradient(145deg,#ffffff,#e2e8f0);color:#1e293b;border:1px solid #cbd5e1}',

    /* 2. 3D Cover */
    rule('3d-cover', 'border-radius:18px!important;border:1.5px solid var(--cs-bd)!important;box-shadow:0 24px 48px -12px rgba(8,25,48,.58),0 0 20px color-mix(in srgb,var(--cs-bd) 42%,transparent)!important;'),
    focusRule('3d-cover', 'box-shadow:0 0 0 2px #fff,0 0 28px var(--cs-bd),0 28px 56px -10px rgba(8,25,48,.7)!important;'),
    typo('3d-cover', 'font-family:"SF Pro Display","Helvetica Neue",-apple-system,sans-serif!important;letter-spacing:-.025em!important;'),
    subTypo('3d-cover', 'text-transform:uppercase!important;letter-spacing:.12em!important;font-size:10px!important;border-radius:6px!important;'),
    after('3d-cover', 'background:radial-gradient(circle at var(--cs-px) var(--cs-py),color-mix(in srgb,var(--cs-bd) 44%,transparent),transparent 54%),linear-gradient(118deg,transparent 24%,rgba(255,255,255,.26) 40%,rgba(255,255,255,.04) 48%,transparent 62%);box-shadow:inset 0 1.5px 0 rgba(255,255,255,.78),inset 0 0 0 1px rgba(255,255,255,.28),inset 0 -16px 26px rgba(8,25,48,.32);'),
    '.cs-prev[data-s="3d-cover"]{background:radial-gradient(circle at 50% 42%,#f59e0b 0%,#0f766e 48%,#0f172a 100%);color:#e0f2fe;--cs-bd:#38bdf8;--cs-c2:#67e8f9;--cs-lip:#0284c7;text-shadow:0 2px 10px rgba(0,0,0,.6)}',

    /* 3. Cartoon Card */
    rule('cartoon', 'border-radius:30px!important;border:5px solid var(--cs-bd)!important;background:radial-gradient(circle at 20% 18%,rgba(255,255,255,.78),transparent 42%),linear-gradient(180deg,var(--cs-c1) 0%,var(--cs-c2) 100%)!important;box-shadow:0 7px 0 var(--cs-lip),0 18px 34px color-mix(in srgb,var(--cs-bd) 34%,rgba(15,23,42,.18))!important;color:#6d2856!important;'),
    focusRule('cartoon', 'box-shadow:0 0 0 3px #fff,0 9px 0 var(--cs-lip),0 22px 40px color-mix(in srgb,var(--cs-bd) 52%,transparent)!important;'),
    typo('cartoon', 'font-family:"Hiragino Maru Gothic ProN","Yuanti SC","PingFang SC","SF Pro Rounded","Chalkboard SE",ui-rounded,sans-serif!important;font-weight:800!important;letter-spacing:.03em!important;color:#6d2856!important;text-shadow:0 2px 0 #fff,0 -1px 0 #fff,1.5px 0 0 #fff,-1.5px 0 0 #fff,0 3px 6px rgba(190,24,93,.18)!important;'),
    subTypo('cartoon', 'border-radius:999px!important;padding:3px 9px!important;background:#fff!important;border:1.5px solid var(--cs-bd)!important;color:var(--cs-lip)!important;box-shadow:0 2px 0 color-mix(in srgb,var(--cs-bd) 45%,transparent)!important;text-shadow:none!important;'),
    after('cartoon', 'background:' + CARTOON_SPARKLE + ' center/100% 100% no-repeat,linear-gradient(180deg,rgba(255,255,255,.68) 0%,rgba(255,255,255,.16) 24%,transparent 40%);box-shadow:inset 0 0 0 4px rgba(255,251,235,.92),inset 0 5px 0 rgba(255,255,255,.98),inset 0 -5px 0 color-mix(in srgb,var(--cs-bd) 42%,transparent);'),
    'html[data-card-style="cartoon"] [data-card-id]:hover{transform:translateY(-3px) scale(1.015) rotate(-0.6deg)!important}',
    '.cs-prev[data-s="cartoon"]{--cs-c1:#fff7ed;--cs-c2:#fbcfe8;--cs-bd:#f472b6;--cs-lip:#db2777}',

    /* 4. Hard Paper Card */
    rule('hard-paper', 'border-radius:9px!important;border:1px solid var(--cs-c2)!important;background:linear-gradient(158deg,var(--cs-c1) 0%,color-mix(in srgb,var(--cs-c2) 52%,#f4ede0) 100%)!important;color:#292524!important;box-shadow:0 1.5px 0 #ebe4d6,0 3px 0 color-mix(in srgb,var(--cs-c2) 85%,#b5aa96),0 4.5px 0 color-mix(in srgb,var(--cs-bd) 42%,#a89d8a),0 6px 0 color-mix(in srgb,var(--cs-lip) 40%,#78716c),0 18px 34px rgba(38,30,22,.24)!important;'),
    focusRule('hard-paper', 'box-shadow:0 2px 0 #ebe4d6,0 4px 0 #d6cdbc,0 6px 0 var(--cs-bd),0 8px 0 var(--cs-lip),0 24px 44px rgba(38,30,22,.34)!important;'),
    typo('hard-paper', 'font-family:"Baskerville","Georgia","Songti SC","Noto Serif SC",serif!important;letter-spacing:.012em!important;color:#292524!important;text-shadow:0 1px 0 rgba(255,255,255,.92)!important;'),
    subTypo('hard-paper', 'font-family:"SF Mono",ui-monospace,monospace!important;font-size:10px!important;letter-spacing:.08em!important;border-radius:3px!important;border:1px solid rgba(120,100,70,.3)!important;background:rgba(255,255,255,.55)!important;color:#57534e!important;'),
    after('hard-paper', 'background:' + PAPER_NOISE + ' repeat,linear-gradient(135deg,rgba(255,255,255,.48),rgba(170,152,120,.12));box-shadow:inset 0 0 0 6px rgba(255,255,255,.45),inset 0 0 0 7px color-mix(in srgb,var(--cs-bd) 32%,transparent),inset 0 1px 0 #fff;'),
    '.cs-prev[data-s="hard-paper"]{--cs-c1:#fdfbf7;--cs-c2:#e7dec8;--cs-bd:#b45309;--cs-lip:#78350f}',

    /* 5. Liquid Glass */
    rule('liquid-glass', 'border-radius:22px!important;border:1px solid rgba(255,255,255,.88)!important;background:color-mix(in srgb,var(--cs-c2) 24%,rgba(255,255,255,.15))!important;backdrop-filter:blur(32px) saturate(220%) contrast(1.04)!important;-webkit-backdrop-filter:blur(32px) saturate(220%) contrast(1.04)!important;box-shadow:0 22px 48px rgba(15,23,42,.24)!important;'),
    focusRule('liquid-glass', 'border-color:#fff!important;box-shadow:0 0 26px rgba(255,255,255,.55),0 26px 54px rgba(14,165,233,.28)!important;'),
    typo('liquid-glass', 'font-family:"SF Pro Text",-apple-system,system-ui,sans-serif!important;letter-spacing:-.015em!important;'),
    subTypo('liquid-glass', 'border-radius:999px!important;background:rgba(255,255,255,.36)!important;backdrop-filter:blur(8px)!important;border:1px solid rgba(255,255,255,.55)!important;'),
    after('liquid-glass', 'background:radial-gradient(circle at var(--cs-px) var(--cs-py),rgba(255,255,255,.64),rgba(255,255,255,.04) 45%),linear-gradient(125deg,rgba(255,255,255,.48) 0%,transparent 34%,color-mix(in srgb,var(--cs-bd) 34%,transparent) 100%);box-shadow:inset 0 1.5px 1px rgba(255,255,255,.98),inset 1px 0 1px rgba(255,255,255,.45),inset 0 -1.5px 5px color-mix(in srgb,var(--cs-bd) 48%,transparent);'),
    '.cs-prev[data-s="liquid-glass"]{background:linear-gradient(135deg,#fda4af,#fcd34d,#67e8f9);color:#0f172a;--cs-bd:#38bdf8;--cs-c2:#bae6fd}',

    /* 6. Paper Cut Card */
    rule('paper-cut', 'border-radius:14px!important;border:8px solid #f7f2ea!important;box-shadow:0 18px 36px rgba(0,0,0,.3)!important;color:#fffbeb!important;'),
    focusRule('paper-cut', 'border-color:#fff!important;box-shadow:0 0 24px rgba(251,191,36,.45),0 24px 48px rgba(0,0,0,.38)!important;'),
    typo('paper-cut', 'font-family:"Optima","Avenir Next","PingFang SC",sans-serif!important;font-weight:700!important;letter-spacing:.02em!important;color:#fffbeb!important;text-shadow:0 2px 6px rgba(28,16,8,.55)!important;'),
    subTypo('paper-cut', 'border-radius:6px!important;background:rgba(255,251,235,.22)!important;border:1px solid rgba(255,251,235,.38)!important;color:#fffbeb!important;'),
    before('paper-cut', 'background:' + PAPER_CUT_SVG + ' center/cover no-repeat;opacity:.92;filter:hue-rotate(var(--cs-hue));'),
    after('paper-cut', 'box-shadow:inset 0 10px 22px rgba(255,244,214,.62),inset 0 -12px 20px rgba(0,0,0,.42),inset 0 0 0 1.5px rgba(180,150,110,.4);'),
    'html[data-card-style="paper-cut"] [data-card-id]::before{opacity:.38}',
    '.cs-prev[data-s="paper-cut"]{--cs-hue:0deg}',

    /* 7. Diorama Card */
    rule('diorama', 'border-radius:10px!important;border:7px solid #6b4222!important;outline:1.5px solid #3f2410;box-shadow:0 20px 40px rgba(0,0,0,.42)!important;color:#fef3c7!important;'),
    focusRule('diorama', 'border-color:#854d0e!important;box-shadow:0 0 26px rgba(250,204,21,.4),0 24px 48px rgba(0,0,0,.52)!important;'),
    typo('diorama', 'font-family:"Palatino","Georgia","Songti SC",serif!important;letter-spacing:.025em!important;color:#fef3c7!important;text-shadow:0 2px 8px rgba(0,0,0,.85)!important;'),
    subTypo('diorama', 'border-radius:4px!important;background:rgba(120,75,30,.55)!important;border:1px solid rgba(253,230,138,.42)!important;color:#fde68a!important;'),
    before('diorama', 'background:' + DIORAMA_SVG + ' center/cover no-repeat;opacity:.94;filter:hue-rotate(var(--cs-hue));'),
    after('diorama', 'box-shadow:inset 0 0 28px rgba(0,0,0,.86),inset 0 5px 14px rgba(255,220,140,.34),inset 0 0 0 2.5px rgba(180,120,60,.48);background:radial-gradient(circle at var(--cs-px) 26%,rgba(254,240,138,.26),transparent 48%);'),
    'html[data-card-style="diorama"] [data-card-id]::before{opacity:.42}',
    '.cs-prev[data-s="diorama"]{--cs-hue:0deg}',

    /* 8. Leather & Foil */
    rule('leather-foil', 'border-radius:14px!important;border:2px solid #d4af37!important;background:linear-gradient(145deg,color-mix(in srgb,var(--cs-lt) 88%,#fff) 0%,var(--cs-lt) 60%,#0a0806 100%)!important;color:#f7d774!important;box-shadow:0 20px 38px rgba(0,0,0,.48)!important;'),
    focusRule('leather-foil', 'border-color:#fde047!important;box-shadow:0 0 24px rgba(234,179,8,.45),0 24px 46px rgba(0,0,0,.6)!important;'),
    typo('leather-foil', 'font-family:"Didot","Bodoni MT","Palatino","Songti SC",serif!important;letter-spacing:.05em!important;color:#f7d774!important;text-shadow:0 1.5px 2px rgba(0,0,0,.95)!important;'),
    subTypo('leather-foil', 'border-radius:4px!important;border:1px solid rgba(212,175,55,.65)!important;background:rgba(212,175,55,.12)!important;color:#fde68a!important;letter-spacing:.12em!important;text-transform:uppercase!important;font-size:9.5px!important;'),
    before('leather-foil', 'background:' + LEATHER_GRAIN + ' repeat;opacity:.92;'),
    after('leather-foil', 'inset:5px;border-radius:9px;border:1px dashed rgba(212,175,55,.74);box-shadow:inset 0 0 0 1px rgba(255,235,170,.35),0 0 0 1px rgba(0,0,0,.62);background:' + GOLD_CORNERS + ' center/100% 100% no-repeat,linear-gradient(135deg,rgba(250,204,21,.22) 0%,transparent 38%,rgba(212,175,55,.16) 100%);'),
    '.cs-prev[data-s="leather-foil"]{--cs-lt:#2a1d16}',

    /* 9. Holographic Card */
    rule('holographic', 'border-radius:18px!important;border:2px solid rgba(255,255,255,.9)!important;background:linear-gradient(135deg,var(--cs-lt),var(--cs-lip))!important;color:#fff!important;box-shadow:0 0 28px color-mix(in srgb,var(--cs-bd) 52%,transparent),0 18px 34px rgba(15,23,42,.42)!important;'),
    focusRule('holographic', 'border-color:#fff!important;box-shadow:0 0 36px var(--cs-bd),0 0 16px rgba(255,255,255,.8),0 22px 44px rgba(15,23,42,.55)!important;'),
    typo('holographic', 'font-family:"SF Pro Display","Avenir Next",-apple-system,sans-serif!important;font-weight:800!important;letter-spacing:.01em!important;color:#fff!important;text-shadow:0 0 10px rgba(192,132,252,.78),0 2px 6px rgba(15,23,42,.82)!important;'),
    subTypo('holographic', 'font-family:"SF Mono",ui-monospace,monospace!important;font-size:9.5px!important;letter-spacing:.1em!important;border-radius:999px!important;border:1px solid rgba(255,255,255,.6)!important;background:rgba(255,255,255,.18)!important;color:#fff!important;'),
    before('holographic', 'background:' + HOLO_PRISM + ' repeat;opacity:.95;filter:hue-rotate(var(--cs-hue));'),
    after('holographic', 'background:linear-gradient(calc(var(--cs-ang) + var(--cs-hue)),rgba(255,0,128,.42),rgba(255,204,0,.34),rgba(0,255,200,.38),rgba(99,102,241,.44),rgba(236,72,153,.38)),radial-gradient(circle at var(--cs-px) var(--cs-py),rgba(255,255,255,.72),transparent 44%);mix-blend-mode:screen;box-shadow:inset 0 0 20px rgba(255,255,255,.48);'),
    '.cs-prev[data-s="holographic"]{--cs-lt:#1e1b4b;--cs-lip:#4f46e5;--cs-bd:#c084fc;--cs-hue:0deg}',

    /* 10. Cyber Neon HUD: chamfered corners + scanlines + HUD target brackets + monospace glow */
    rule('cyber-neon', 'border-radius:4px 20px 4px 20px!important;border:1.5px solid var(--cs-bd)!important;background:repeating-linear-gradient(0deg,rgba(34,211,238,.05) 0 2px,transparent 2px 4px),linear-gradient(135deg,#090d16 0%,color-mix(in srgb,var(--cs-lt) 75%,#090d16) 100%)!important;color:#ecfeff!important;box-shadow:0 0 20px color-mix(in srgb,var(--cs-bd) 48%,transparent),inset 0 0 18px color-mix(in srgb,var(--cs-bd) 22%,transparent)!important;'),
    focusRule('cyber-neon', 'border-color:#22d3ee!important;box-shadow:0 0 0 1px #22d3ee,0 0 32px #22d3ee,inset 0 0 24px rgba(244,63,94,.32)!important;'),
    typo('cyber-neon', 'font-family:"SF Mono","JetBrains Mono","Menlo",ui-monospace,monospace!important;letter-spacing:.04em!important;color:#ecfeff!important;text-shadow:0 0 8px var(--cs-bd)!important;'),
    subTypo('cyber-neon', 'border-radius:2px!important;border:1px solid #f43f5e!important;background:rgba(244,63,94,.18)!important;color:#fda4af!important;text-transform:uppercase!important;letter-spacing:.12em!important;'),
    after('cyber-neon', 'background:' + CYBER_HUD_SVG + ' center/100% 100% no-repeat,radial-gradient(circle at var(--cs-px) var(--cs-py),color-mix(in srgb,var(--cs-bd) 28%,transparent),transparent 52%);'),
    '.cs-prev[data-s="cyber-neon"]{--cs-bd:#22d3ee;--cs-lt:#0f172a}',

    /* 11. Botanical Watercolor: soft cold-press paper + pigment blooms + calligraphic serif */
    rule('watercolor', 'border-radius:18px!important;border:6px solid #faf8f5!important;background:linear-gradient(145deg,#faf8f5,var(--cs-c1))!important;color:#1e293b!important;box-shadow:0 14px 32px rgba(15,23,42,.16),inset 0 0 0 1px rgba(148,163,184,.25)!important;'),
    focusRule('watercolor', 'border-color:#fff!important;box-shadow:0 0 0 2px var(--cs-bd),0 22px 44px color-mix(in srgb,var(--cs-bd) 32%,transparent)!important;'),
    typo('watercolor', 'font-family:"Cochin","Baskerville","Kaiti SC","STKaiti","Georgia",serif!important;letter-spacing:.02em!important;color:#1e293b!important;text-shadow:0 1px 0 rgba(255,255,255,.85)!important;'),
    subTypo('watercolor', 'border-radius:999px!important;background:color-mix(in srgb,var(--cs-c2) 65%,#fff)!important;border:1px solid var(--cs-bd)!important;color:#0f172a!important;'),
    before('watercolor', 'background:' + WATERCOLOR_SVG + ' center/cover no-repeat;opacity:.92;filter:hue-rotate(var(--cs-hue));'),
    after('watercolor', 'background:' + PAPER_NOISE + ' repeat;box-shadow:inset 0 0 16px rgba(255,255,255,.75);'),
    '.cs-prev[data-s="watercolor"]{--cs-hue:0deg;--cs-c1:#f0fdf4;--cs-c2:#bbf7d0;--cs-bd:#34d399}',

    /* 12. Neo-Brutalist Pop: bold ink border + hard offset block shadow + halftone + heavy grotesque */
    rule('brutalist', 'border-radius:6px!important;border:3.5px solid #0f172a!important;background:linear-gradient(135deg,var(--cs-c2) 0%,var(--cs-c1) 100%)!important;color:#0f172a!important;box-shadow:6px 6px 0 #0f172a!important;'),
    focusRule('brutalist', 'transform:translate(-2px,-2px)!important;box-shadow:9px 9px 0 #0f172a,0 0 0 2px #facc15!important;'),
    typo('brutalist', 'font-family:"Futura","Impact","Arial Black","Heiti SC",-apple-system,sans-serif!important;font-weight:900!important;letter-spacing:-.01em!important;color:#0f172a!important;text-shadow:1.5px 1.5px 0 #fff!important;'),
    subTypo('brutalist', 'border-radius:3px!important;border:2px solid #0f172a!important;background:#facc15!important;color:#0f172a!important;box-shadow:2px 2px 0 #0f172a!important;font-weight:800!important;text-shadow:none!important;'),
    before('brutalist', 'background:' + HALFTONE_SVG + ' repeat;opacity:.75;'),
    after('brutalist', 'box-shadow:inset 0 0 0 2px rgba(255,255,255,.65);'),
    '.cs-prev[data-s="brutalist"]{--cs-c1:#fef08a;--cs-c2:#f472b6}',

    /* 13. Stained Glass Cathedral: arched window top + lead came mosaic + backlit radiance */
    rule('stained-glass', 'border-radius:28px 28px 10px 10px!important;border:3.5px solid #1e293b!important;background:#0f172a!important;color:#fef9c3!important;box-shadow:0 20px 42px rgba(0,0,0,.45),inset 0 0 24px rgba(254,240,138,.38)!important;'),
    focusRule('stained-glass', 'border-color:#facc15!important;box-shadow:0 0 30px rgba(250,204,21,.55),inset 0 0 32px rgba(254,240,138,.65)!important;'),
    typo('stained-glass', 'font-family:"Optima","Cinzel","Palatino","Songti SC",serif!important;font-weight:800!important;letter-spacing:.04em!important;color:#fef9c3!important;text-shadow:0 2px 4px #000,0 0 12px rgba(253,224,71,.65)!important;'),
    subTypo('stained-glass', 'border-radius:4px!important;border:1.5px solid #facc15!important;background:rgba(15,23,42,.78)!important;color:#fde047!important;'),
    before('stained-glass', 'background:' + STAINED_GLASS_SVG + ' center/cover no-repeat;opacity:.88;filter:hue-rotate(var(--cs-hue));'),
    after('stained-glass', 'background:radial-gradient(circle at var(--cs-px) var(--cs-py),rgba(254,249,195,.38),transparent 52%);box-shadow:inset 0 0 0 2px rgba(250,204,21,.42);'),
    'html[data-card-style="stained-glass"] [data-card-id]::before{opacity:.42}',
    '.cs-prev[data-s="stained-glass"]{--cs-hue:0deg}',

    /* 14. Blue & White Porcelain: jade-white ceramic glaze + cobalt fretwork + vermilion seal */
    rule('porcelain', 'border-radius:20px!important;border:2px solid #93c5fd!important;background:radial-gradient(circle at 30% 20%,#ffffff 0%,#f0f7ff 70%,#e0effe 100%)!important;color:#1e3a8a!important;box-shadow:0 16px 36px rgba(30,58,138,.18),inset 0 3px 6px #fff!important;'),
    focusRule('porcelain', 'border-color:#1d4ed8!important;box-shadow:0 0 0 2px #eff6ff,0 0 24px rgba(37,99,235,.4),0 20px 42px rgba(30,58,138,.28)!important;'),
    typo('porcelain', 'font-family:"Songti SC","STSong","Kaiti SC","Palatino","Georgia",serif!important;letter-spacing:.05em!important;color:#1e3a8a!important;text-shadow:0 1px 0 #fff!important;'),
    subTypo('porcelain', 'border-radius:2px!important;border:1.5px solid #dc2626!important;background:rgba(220,38,38,.08)!important;color:#dc2626!important;font-weight:700!important;letter-spacing:.08em!important;'),
    after('porcelain', 'background:' + PORCELAIN_SVG + ' center/100% 100% no-repeat,linear-gradient(125deg,rgba(255,255,255,.65) 0%,transparent 36%);'),
    '.cs-prev[data-s="porcelain"]{}',

    /* 15. Royal Velvet & Brass: crushed velvet nap + Art Deco brass geometry + spotlight focus */
    rule('velvet-theatre', 'border-radius:16px!important;border:2px solid #eab308!important;background:radial-gradient(circle at 50% 35%,color-mix(in srgb,var(--cs-lip) 65%,#581c87) 0%,var(--cs-lt) 75%,#09050d 100%)!important;color:#fef08a!important;box-shadow:0 20px 42px rgba(0,0,0,.48),inset 0 0 28px rgba(0,0,0,.65)!important;'),
    focusRule('velvet-theatre', 'border-color:#fde047!important;box-shadow:0 0 28px rgba(234,179,8,.52),0 24px 50px rgba(0,0,0,.62),inset 0 0 24px rgba(250,204,21,.24)!important;'),
    typo('velvet-theatre', 'font-family:"Didot","Copperplate","Avenir Next","Songti SC",serif!important;letter-spacing:.06em!important;color:#fef08a!important;text-shadow:0 2px 6px rgba(0,0,0,.9)!important;'),
    subTypo('velvet-theatre', 'border-radius:3px!important;border:1px solid #facc15!important;background:rgba(234,179,8,.16)!important;color:#fef08a!important;text-transform:uppercase!important;letter-spacing:.12em!important;'),
    after('velvet-theatre', 'background:' + VELVET_DECO_SVG + ' center/100% 100% no-repeat,radial-gradient(circle at var(--cs-px) var(--cs-py),rgba(254,240,138,.22),transparent 50%);'),
    '.cs-prev[data-s="velvet-theatre"]{--cs-lip:#be123c;--cs-lt:#4c0519}',

    /* 16. Mother of Pearl: iridescent nacre shell waves + pink-aqua-champagne interference sheen */
    rule('mother-of-pearl', 'border-radius:22px!important;border:2px solid rgba(255,255,255,.92)!important;background:linear-gradient(calc(var(--cs-ang) + var(--cs-hue)),#fdf4ff 0%,#ecfeff 32%,#fefce8 64%,#fce7f3 100%)!important;color:#334155!important;box-shadow:0 18px 40px rgba(148,163,184,.28),inset 0 2px 6px #fff,inset 0 -2px 8px rgba(244,114,182,.22)!important;'),
    focusRule('mother-of-pearl', 'border-color:#fff!important;box-shadow:0 0 0 2px #fbcfe8,0 0 28px rgba(165,243,252,.65),0 22px 46px rgba(148,163,184,.36)!important;'),
    typo('mother-of-pearl', 'font-family:"Didot","Baskerville","Songti SC","Georgia",serif!important;letter-spacing:.035em!important;color:#334155!important;text-shadow:0 1px 0 #fff!important;'),
    subTypo('mother-of-pearl', 'border-radius:999px!important;border:1px solid rgba(255,255,255,.9)!important;background:rgba(255,255,255,.68)!important;color:#475569!important;box-shadow:0 2px 6px rgba(0,0,0,.05)!important;'),
    before('mother-of-pearl', 'background:' + PEARL_NACRE_SVG + ' center/cover no-repeat;opacity:.85;'),
    after('mother-of-pearl', 'background:radial-gradient(circle at var(--cs-px) var(--cs-py),rgba(255,255,255,.78),rgba(244,114,182,.18) 38%,rgba(56,189,248,.16) 66%,transparent 85%);mix-blend-mode:soft-light;box-shadow:inset 0 0 0 4px rgba(255,255,255,.55);'),
    '.cs-prev[data-s="mother-of-pearl"]{--cs-hue:0deg}',

    /* 17. Kintsugi Celadon Jade: translucent Ru-ware jade glaze + 24K gold crackle repair veins */
    rule('kintsugi-jade', 'border-radius:18px!important;border:2px solid #a7f3d0!important;background:radial-gradient(circle at 30% 24%,#ecfdf5 0%,#d1fae5 52%,#99f6e4 100%)!important;color:#064e3b!important;box-shadow:0 18px 40px rgba(6,78,59,.22),inset 0 3px 10px rgba(255,255,255,.88),inset 0 -8px 20px rgba(13,148,136,.22)!important;'),
    focusRule('kintsugi-jade', 'border-color:#facc15!important;box-shadow:0 0 26px rgba(250,204,21,.48),0 22px 46px rgba(6,78,59,.32),inset 0 0 18px rgba(254,240,138,.45)!important;'),
    typo('kintsugi-jade', 'font-family:"Songti SC","STSong","Baskerville","Georgia",serif!important;letter-spacing:.04em!important;color:#064e3b!important;text-shadow:0 1px 0 rgba(255,255,255,.85)!important;'),
    subTypo('kintsugi-jade', 'border-radius:4px!important;border:1px solid #d97706!important;background:rgba(254,243,199,.78)!important;color:#92400e!important;font-weight:700!important;'),
    before('kintsugi-jade', 'background:' + KINTSUGI_SVG + ' center/cover no-repeat;opacity:.92;'),
    after('kintsugi-jade', 'background:radial-gradient(circle at var(--cs-px) var(--cs-py),rgba(254,240,138,.35),transparent 50%);box-shadow:inset 0 0 0 1px rgba(250,204,21,.4);'),
    '.cs-prev[data-s="kintsugi-jade"]{}',

    /* 18. Aurora Silk Brocade: woven silk twill + gold brocade clouds + anisotropic silk sheen */
    rule('aurora-silk', 'border-radius:20px!important;border:1.5px solid rgba(253,224,71,.65)!important;background:linear-gradient(135deg,var(--cs-c1) 0%,var(--cs-c2) 55%,color-mix(in srgb,var(--cs-bd) 45%,#fff) 100%)!important;color:#1e293b!important;box-shadow:0 18px 40px rgba(15,23,42,.2),inset 0 1px 4px rgba(255,255,255,.9)!important;'),
    focusRule('aurora-silk', 'border-color:#fde047!important;box-shadow:0 0 28px color-mix(in srgb,var(--cs-bd) 48%,transparent),0 22px 46px rgba(15,23,42,.28)!important;'),
    typo('aurora-silk', 'font-family:"Optima","Cochin","PingFang SC",serif!important;font-weight:700!important;letter-spacing:.03em!important;color:#1e293b!important;text-shadow:0 1px 0 rgba(255,255,255,.88)!important;'),
    subTypo('aurora-silk', 'border-radius:999px!important;border:1px solid rgba(234,179,8,.55)!important;background:rgba(255,255,255,.72)!important;color:#854d0e!important;'),
    before('aurora-silk', 'background:' + SILK_WEAVE_SVG + ' repeat;opacity:.9;'),
    after('aurora-silk', 'background:linear-gradient(calc(var(--cs-ang) + 35deg),transparent 18%,rgba(255,255,255,.62) 46%,rgba(253,224,71,.28) 54%,transparent 78%);box-shadow:inset 0 0 0 3px rgba(255,255,255,.5);'),
    '.cs-prev[data-s="aurora-silk"]{--cs-c1:#fff1f2;--cs-c2:#fde68a;--cs-bd:#f472b6}'
  ].join('\n');
  document.head.appendChild(css);

  function hashStr(s) {
    var h = 2166136261 ^ seedSalt;
    for (var i = 0; i < s.length; i++) {
      h ^= s.charCodeAt(i);
      h = Math.imul(h, 16777619);
    }
    return h >>> 0;
  }

  function colorizeCard(el, idx, force) {
    if (!force && el.dataset.csSalt === String(seedSalt)) return;
    var key = el.dataset.cardId || el.dataset.i || (el.textContent || '').slice(0, 24) || String(idx);
    var p = PALETTES[hashStr(String(key) + ':' + idx) % PALETTES.length];
    el.style.setProperty('--cs-hue', p[0] + 'deg');
    el.style.setProperty('--cs-c1', p[1]);
    el.style.setProperty('--cs-c2', p[2]);
    el.style.setProperty('--cs-bd', p[3]);
    el.style.setProperty('--cs-lip', p[4]);
    el.style.setProperty('--cs-lt', p[5]);
    el.dataset.csSalt = String(seedSalt);
  }

  function colorizeAll(force) {
    var nodes = document.querySelectorAll(TARGETS);
    for (var i = 0; i < nodes.length; i++) colorizeCard(nodes[i], i, force);
  }

  function shuffleColors() {
    seedSalt = Math.floor(Math.random() * 100000);
    colorizeAll(true);
  }

  function apply(id) {
    cur = STYLES.some(function (s) { return s.id === id; }) ? id : 'default';
    document.documentElement.dataset.cardStyle = cur;
    try { localStorage.setItem(KEY, cur); } catch (e) {}
    colorizeAll(false);
    var st = STYLES.find(function (s) { return s.id === cur; }) || STYLES[0];
    var btn = document.getElementById('cs-btn');
    if (btn) {
      btn.querySelector('.cs-dot').style.background = st.accent;
      btn.querySelector('.cs-lbl').textContent = '风格 · ' + st.zh;
    }
    var modal = document.getElementById('cs-modal');
    if (modal) {
      [].forEach.call(modal.querySelectorAll('.cs-opt'), function (el) {
        el.classList.toggle('on', el.dataset.id === cur);
      });
    }
  }

  function buildUI() {
    if (document.getElementById('cs-btn')) return;
    var btn = document.createElement('button');
    btn.id = 'cs-btn';
    btn.type = 'button';
    btn.innerHTML = '<span class="cs-dot"></span><span class="cs-lbl"></span>';
    btn.onclick = openModal;
    document.body.appendChild(btn);

    var modal = document.createElement('div');
    modal.id = 'cs-modal';
    modal.innerHTML =
      '<div id="cs-panel" role="dialog" aria-label="选择卡片风格">' +
        '<div id="cs-head"><h3>选择卡片风格（18 种）</h3><button id="cs-shuf" type="button">🎲 随机换色</button><button id="cs-close" type="button" aria-label="Close">×</button></div>' +
        '<div id="cs-grid"></div>' +
      '</div>';
    modal.onclick = function (e) { if (e.target === modal) closeModal(); };
    modal.querySelector('#cs-close').onclick = closeModal;
    modal.querySelector('#cs-shuf').onclick = function () { shuffleColors(); };

    var grid = modal.querySelector('#cs-grid');
    STYLES.forEach(function (s, idx) {
      var opt = document.createElement('button');
      opt.type = 'button';
      opt.className = 'cs-opt';
      opt.dataset.id = s.id;
      opt.innerHTML =
        '<div class="cs-prev" data-s="' + s.id + '"><span>' + s.zh + '</span></div>' +
        '<div class="cs-opt-t">' + (idx + 1) + '. ' + s.name + '</div>' +
        '<div class="cs-opt-d">' + s.desc + '</div>';
      opt.onclick = function () { apply(s.id); closeModal(); };
      grid.appendChild(opt);
    });
    document.body.appendChild(modal);
    apply(cur);

    var obsTimer = null;
    var obs = new MutationObserver(function () {
      if (obsTimer) return;
      obsTimer = setTimeout(function () { obsTimer = null; colorizeAll(false); }, 120);
    });
    obs.observe(document.body, { childList: true, subtree: true });
  }

  function openModal() {
    var m = document.getElementById('cs-modal');
    if (m) m.classList.add('open');
  }
  function closeModal() {
    var m = document.getElementById('cs-modal');
    if (m) m.classList.remove('open');
  }

  document.addEventListener('pointermove', function (e) {
    if (cur === 'default' || cur === 'cartoon' || cur === 'hard-paper' || cur === 'brutalist' || cur === 'porcelain') return;
    var w = window.innerWidth || 1, h = window.innerHeight || 1;
    var px = Math.max(0, Math.min(100, (e.clientX / w) * 100));
    var py = Math.max(0, Math.min(100, (e.clientY / h) * 100));
    var ang = Math.round(90 + (px - 50) * 1.6 + (py - 50) * 0.8);
    var r = document.documentElement.style;
    r.setProperty('--cs-px', px.toFixed(1) + '%');
    r.setProperty('--cs-py', py.toFixed(1) + '%');
    r.setProperty('--cs-ang', ang + 'deg');
  }, { passive: true });

  if (document.readyState === 'loading') document.addEventListener('DOMContentLoaded', buildUI);
  else buildUI();

  window.MinestCardStyles = { set: apply, get: function () { return cur; }, shuffle: shuffleColors, open: openModal, close: closeModal, styles: STYLES };
})();

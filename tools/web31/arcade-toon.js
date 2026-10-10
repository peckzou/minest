/* ---- Minest Live · the Arcade's games in Blooket style (web31 · 31.8) ----
   In a live game (and in Solo play) every Study Arcade game but Smash It gets the cartoon look of the Live room:
   a purple room, white chunky cards, Titan One / Nunito, Blooket's answer colours. Minest Live turns it on per level
   (window.__arToon = mode !== 'smash'); the Arcade's canvas games ask window.__arToonBg for their background
   (tools/web31/build.py: toon_patches) and draw solid fruit / rocks and white answer plates while it is on. */
(function () {
  if (window.__arToonBg) return;
  var INK = '#2e1065';

  function fonts() {
    if (document.getElementById('mlv-toon-font')) return;
    var l = document.createElement('link'); l.id = 'mlv-toon-font'; l.rel = 'stylesheet';
    l.href = 'https://fonts.googleapis.com/css2?family=Titan+One&family=Nunito:wght@600;700;800;900&display=swap';
    document.head.appendChild(l);
  }
  var CSS = [
    '.arcade.ar-toon{font-family:"Nunito","DM Sans",system-ui,sans-serif}',
    // the room: Blooket purple with a dot pattern (the background picker is off here)
    '.arcade.ar-toon .ar-bg{background:#6d3ee8}',
    '.arcade.ar-toon .ar-bg-img{background:radial-gradient(rgba(255,255,255,.12) 2.4px,transparent 3px) 0 0/30px 30px,radial-gradient(900px 600px at 15% -10%,#a78bfa,transparent 60%),linear-gradient(165deg,#8b5cf6,#6d28d9 55%,#5b21b6)!important;filter:none!important;transform:none!important}',
    '.arcade.ar-toon .ar-bg-dim{background:transparent!important}',
    '.arcade.ar-toon .ar-bgbtn{display:none!important}',
    // top bar
    '.arcade.ar-toon .ar-top{background:rgba(46,16,101,.32)}',
    '.arcade.ar-toon .ar-brand b{font-family:"Titan One","Nunito",sans-serif;font-weight:400;letter-spacing:.4px;color:#fff}',
    '.arcade.ar-toon .ar-logo{background:#fde047;color:' + INK + ';box-shadow:0 3px 0 rgba(0,0,0,.25)}',
    '.arcade.ar-toon .ar-mode-name{color:rgba(255,255,255,.85);font-weight:800}',
    '.arcade.ar-toon .ar-progress{color:#fff;font-weight:900}',
    '.arcade.ar-toon .ar-bar{height:10px;background:rgba(255,255,255,.25)}',
    '.arcade.ar-toon .ar-bar i{background:#fde047}',
    '.arcade.ar-toon .ar-chip{background:#fff;color:' + INK + ';border:0;font-weight:900;box-shadow:0 3px 0 rgba(0,0,0,.22)}',
    '.arcade.ar-toon .ar-chip.k{color:#15803d}.arcade.ar-toon .ar-chip.a{color:#c2410c}.arcade.ar-toon .ar-chip.l{color:#6d28d9}.arcade.ar-toon .ar-chip.s{color:#b45309}.arcade.ar-toon .ar-chip.c{color:#be123c}',
    '.arcade.ar-toon .ar-btn{background:#fff;color:' + INK + ';border:0;border-radius:14px;font-weight:900;box-shadow:0 4px 0 rgba(0,0,0,.25);-webkit-backdrop-filter:none;backdrop-filter:none}',
    '.arcade.ar-toon .ar-btn:hover{background:#f5f3ff}',
    '.arcade.ar-toon .ar-btn:active{transform:translateY(3px);box-shadow:0 1px 0 rgba(0,0,0,.25)}',
    '.arcade.ar-toon .ar-btn.primary{background:#22c55e;color:#fff}',
    '.arcade.ar-toon .ar-btn.know{background:#4bc22e;color:#fff}.arcade.ar-toon .ar-btn.again{background:#ff8a1e;color:#fff}',
    // the question
    '.arcade.ar-toon .ar-q,.arcade.ar-toon .ar-ms-head{background:#fff;border:0;border-radius:20px;color:' + INK + ';box-shadow:0 6px 0 rgba(46,16,101,.38),0 16px 30px rgba(0,0,0,.18);-webkit-backdrop-filter:none;backdrop-filter:none}',
    '.arcade.ar-toon .ar-q-k{color:#7c3aed;font-weight:900}',
    '.arcade.ar-toon .ar-q-t,.arcade.ar-toon .ar-ms-title{font-family:"Titan One","Nunito",sans-serif;font-weight:400;letter-spacing:.3px;color:' + INK + '}',
    '.arcade.ar-toon .ar-q-sub{color:#6b7280;font-weight:800}',
    '.arcade.ar-toon .ar-q-sub.k{color:#15803d}.arcade.ar-toon .ar-q-sub.a{color:#c2410c}.arcade.ar-toon .ar-q-sub.x{color:#dc2626}',
    '.arcade.ar-toon .ar-q-bar{height:6px;background:#ede9fe}.arcade.ar-toon .ar-q-bar i{background:#8b5cf6}',
    // pop-ups over the play field
    '.arcade.ar-toon .ar-float{font-family:"Titan One","Nunito",sans-serif;font-weight:400;font-size:20px;color:#fff;text-shadow:0 3px 0 ' + INK + ',0 0 4px ' + INK + '}',
    '.arcade.ar-toon .ar-float.k{color:#86efac}.arcade.ar-toon .ar-float.x{color:#fda4af}',
    '.arcade.ar-toon .ar-combo{font-family:"Titan One","Nunito",sans-serif;font-weight:400;font-style:normal;background:none;color:#fde047;-webkit-text-fill-color:#fde047;filter:none;text-shadow:0 5px 0 ' + INK + ',0 0 6px ' + INK + '}',
    '.arcade.ar-toon .ar-combo.hot{color:#fb7185;-webkit-text-fill-color:#fb7185}',
    '.arcade.ar-toon .ar-sx-hud,.arcade.ar-toon .ar-sx-prog{color:#fff;font-weight:900;text-shadow:0 2px 0 rgba(46,16,101,.6)}',
    '.arcade.ar-toon .ar-toast,.arcade.ar-toon .ar-banner{background:#fff;color:' + INK + ';border:0;box-shadow:0 5px 0 rgba(46,16,101,.38);font-weight:900;-webkit-backdrop-filter:none;backdrop-filter:none}',
    // cards: Card Flinger, Swipe Judgment, What's Missing
    '.arcade.ar-toon .ar-card .ar-face,.arcade.ar-toon .ar-sw-card,.arcade.ar-toon .ar-ms-face{background:#fff!important;color:' + INK + ';border:0!important;border-top:9px solid var(--c,#8b5cf6)!important;box-shadow:0 8px 0 rgba(46,16,101,.38),0 18px 34px rgba(0,0,0,.18)!important;-webkit-backdrop-filter:none!important;backdrop-filter:none!important}',
    '.arcade.ar-toon .ar-face::before,.arcade.ar-toon .ar-face::after,.arcade.ar-toon .ar-sw-card::before,.arcade.ar-toon .ar-sw-card::after{display:none!important}',
    '.arcade.ar-toon .ar-word{font-family:"Titan One","Nunito",sans-serif;font-weight:400;letter-spacing:.2px;color:' + INK + ';text-shadow:none}',
    '.arcade.ar-toon .ar-answer{color:#3b2a63;font-weight:700}.arcade.ar-toon .ar-answer.none{color:#8b7fb0}',
    '.arcade.ar-toon .ar-face-hint{color:#8b7fb0;font-weight:800}',
    '.arcade.ar-toon .ar-chip-list{background:#f3e8ff;color:#6d28d9;border:0;font-weight:900}',
    '.arcade.ar-toon .ar-sw-ans{background:#f5f3ff;border:0;-webkit-backdrop-filter:none;backdrop-filter:none}',
    '.arcade.ar-toon .ar-stamp{background:#fff}',
    '.arcade.ar-toon .ar-sw-legend .k{color:#bbf7d0}.arcade.ar-toon .ar-sw-legend .a{color:#fed7aa}.arcade.ar-toon .ar-sw-legend .mid{color:rgba(255,255,255,.75)}',
    '.arcade.ar-toon .ar-fl-hint{color:rgba(255,255,255,.85);font-weight:800}',
    '.arcade.ar-toon .ar-fl-timer{height:6px;background:rgba(255,255,255,.25)}.arcade.ar-toon .ar-fl-timer i{background:#fde047}',
    '.arcade.ar-toon .ar-deck-source,.arcade.ar-toon .ar-deck-source-plate{background:#a78bfa;border:3px solid #fff;box-shadow:0 4px 0 rgba(46,16,101,.4)}',
    '.arcade.ar-toon .ar-deck-source-cap{color:#fff;font-family:"Titan One","Nunito",sans-serif;font-weight:400;font-size:13px;text-shadow:0 2px 0 rgba(46,16,101,.5)}',
    '.arcade.ar-toon .ar-bin{border:3px dashed rgba(255,255,255,.6);background:rgba(255,255,255,.1)}',
    '.arcade.ar-toon .ar-bin.k{border-color:#86efac;background:rgba(74,222,128,.18)}.arcade.ar-toon .ar-bin.a{border-color:#fdba74;background:rgba(251,146,60,.18)}',
    '.arcade.ar-toon .ar-bin-card{background:#fff!important;border:0!important;border-top:4px solid var(--c,#8b5cf6)!important;box-shadow:0 3px 0 rgba(46,16,101,.35)!important}',
    '.arcade.ar-toon .ar-bin-cap{font-weight:900}.arcade.ar-toon .ar-bin.k .ar-bin-cap{color:#bbf7d0}.arcade.ar-toon .ar-bin.a .ar-bin-cap{color:#fed7aa}',
    '.arcade.ar-toon .ar-ms-back{background:repeating-linear-gradient(135deg,#a78bfa 0 10px,#8b5cf6 10px 20px)!important;border:4px solid #fff!important;box-shadow:0 6px 0 rgba(46,16,101,.38)!important}',
    '.arcade.ar-toon .ar-ms-slot{border:3px dashed rgba(255,255,255,.6);background:rgba(255,255,255,.08)}',
    '.arcade.ar-toon .ar-ms-card.found .ar-ms-face{box-shadow:0 0 0 4px #22c55e,0 8px 0 rgba(46,16,101,.38)!important}',
    '.arcade.ar-toon .ar-ms-card.missed .ar-ms-face{box-shadow:0 0 0 4px #f97316,0 8px 0 rgba(46,16,101,.38)!important}',
    // What's Missing: Blooket's four answer colours
    '.arcade.ar-toon .ar-ms-choice{border:0;color:#fff;font-weight:900;font-size:16px;text-shadow:0 2px 0 rgba(0,0,0,.18);box-shadow:0 5px 0 rgba(0,0,0,.25);-webkit-backdrop-filter:none;backdrop-filter:none}',
    '.arcade.ar-toon .ar-ms-choice:nth-child(4n+1){background:#ffa31e}.arcade.ar-toon .ar-ms-choice:nth-child(4n+2){background:#00b8f0}.arcade.ar-toon .ar-ms-choice:nth-child(4n+3){background:#4bc22e}.arcade.ar-toon .ar-ms-choice:nth-child(4n+4){background:#ff5a3c}',
    '.arcade.ar-toon .ar-ms-choice:active{transform:translateY(3px);box-shadow:0 2px 0 rgba(0,0,0,.25)}',
    '.arcade.ar-toon .ar-ms-choice-n{background:rgba(255,255,255,.3);border:0;color:#fff}',
    '.arcade.ar-toon .ar-ms-choice.ok{background:#16a34a!important;box-shadow:0 0 0 4px #fff,0 5px 0 rgba(0,0,0,.25)}',
    '.arcade.ar-toon .ar-ms-choice.bad{background:#9ca3af!important}',
    '.arcade.ar-toon .ar-ms-choice.reveal{box-shadow:0 0 0 4px #fde047,0 5px 0 rgba(0,0,0,.25)}',
    // the results
    '.arcade.ar-toon .ar-fin-panel{background:#fff;color:' + INK + ';border-radius:26px;padding:22px 18px 24px;box-shadow:0 8px 0 rgba(46,16,101,.38),0 20px 40px rgba(0,0,0,.2)}',
    '.arcade.ar-toon .ar-fin-title{font-family:"Titan One","Nunito",sans-serif;font-weight:400;letter-spacing:.3px;color:' + INK + '}',
    '.arcade.ar-toon .ar-stat span,.arcade.ar-toon .ar-fin-meta{color:#6b7280;font-weight:800}',
    '.arcade.ar-toon .ar-stat.k b{color:#16a34a}.arcade.ar-toon .ar-stat.a b{color:#ea580c}',
    '.arcade.ar-toon .ar-fin .ar-btn{background:#8b5cf6;color:#fff}',
    '.arcade.ar-toon .ar-mini{background:#fff;color:' + INK + ';border:0;border-top:6px solid var(--c,#8b5cf6);box-shadow:0 5px 0 rgba(46,16,101,.38)}'
  ].join('\n');
  function css() {
    if (document.getElementById('mn-arcade-toon')) return;
    var s = document.createElement('style'); s.id = 'mn-arcade-toon'; s.textContent = CSS; document.head.appendChild(s);
  }

  // ---------------------------------------------------------------- the canvas games' backgrounds
  function rr(g, x, y, w, h, r) { g.beginPath(); g.moveTo(x + r, y); g.arcTo(x + w, y, x + w, y + h, r); g.arcTo(x + w, y + h, x, y + h, r); g.arcTo(x, y + h, x, y, r); g.arcTo(x, y, x + w, y, r); g.closePath(); }
  function cloud(g, x, y, s, a) {
    g.save(); g.globalAlpha = a == null ? 1 : a; g.fillStyle = '#fff';
    g.beginPath(); g.arc(x, y, 22 * s, 0, 7); g.arc(x + 26 * s, y - 12 * s, 28 * s, 0, 7); g.arc(x + 58 * s, y - 2 * s, 22 * s, 0, 7); g.fill();
    rr(g, x - 6 * s, y - 4 * s, 76 * s, 26 * s, 13 * s); g.fill();
    g.fillStyle = 'rgba(167,139,250,.25)'; rr(g, x - 6 * s, y + 12 * s, 76 * s, 10 * s, 5 * s); g.fill();
    g.restore();
  }
  function sparkle(g, x, y, r, c) {
    g.fillStyle = c; g.beginPath(); g.moveTo(x, y - r); g.quadraticCurveTo(x, y, x + r, y); g.quadraticCurveTo(x, y, x, y + r); g.quadraticCurveTo(x, y, x - r, y); g.quadraticCurveTo(x, y, x, y - r); g.fill();
  }
  function dots(g, W, H, c, step) {
    g.fillStyle = c;
    for (var y = step / 2, row = 0; y < H; y += step, row++) for (var x = (row % 2 ? step / 2 : 0) + step / 4; x < W; x += step) { g.beginPath(); g.arc(x, y, 2.6, 0, 7); g.fill(); }
  }
  function hill(g, W, y0, amp, ph, fill, H) {
    g.beginPath(); g.moveTo(0, H);
    for (var x = 0; x <= W + 20; x += 20) g.lineTo(x, y0 - amp * (0.5 + 0.5 * Math.sin(x / W * 5.2 + ph)));
    g.lineTo(W, H); g.closePath(); g.fillStyle = fill; g.fill();
  }
  // a static layer per game and size, painted once
  var cache = {};
  function layer(mode, W, H, hz) {
    var k = Math.min(2, window.devicePixelRatio || 1), key = mode + ':' + Math.round(W) + 'x' + Math.round(H) + ':' + Math.round(hz || 0);
    if (cache[mode] && cache[mode].key === key) return cache[mode].cv;
    var cv = document.createElement('canvas'); cv.width = Math.max(1, Math.round(W * k)); cv.height = Math.max(1, Math.round(H * k));
    var g = cv.getContext('2d'); g.scale(k, k);
    var s = Math.max(0.7, Math.min(1.4, Math.min(W, H) / 700)), sky;
    if (mode === 'slice') {
      // Glass Fruit: a sunny purple fruit stand — sky, dots, rolling lavender hills, a striped awning at the bottom
      sky = g.createLinearGradient(0, 0, 0, H); sky.addColorStop(0, '#a78bfa'); sky.addColorStop(0.6, '#8b5cf6'); sky.addColorStop(1, '#7c3aed');
      g.fillStyle = sky; g.fillRect(0, 0, W, H);
      dots(g, W, H, 'rgba(255,255,255,.10)', 34);
      g.fillStyle = 'rgba(253,224,71,.9)'; g.beginPath(); g.arc(W * 0.86, H * 0.2, 46 * s, 0, 7); g.fill();
      g.fillStyle = 'rgba(253,224,71,.25)'; g.beginPath(); g.arc(W * 0.86, H * 0.2, 70 * s, 0, 7); g.fill();
      hill(g, W, H * 0.82, 50 * s, 0.6, '#c4b5fd', H);
      hill(g, W, H * 0.9, 34 * s, 2.4, '#ddd6fe', H);
      var stripe = 46 * s, ay = H - 26 * s;
      for (var i = 0, x = 0; x < W; x += stripe, i++) { g.fillStyle = i % 2 ? '#fff' : '#f472b6'; g.fillRect(x, ay, stripe, H - ay); }
      g.fillStyle = 'rgba(46,16,101,.18)'; g.fillRect(0, ay, W, 4 * s);
    } else if (mode === 'blast') {
      // Glass Blast: cartoon space — a violet sky, a ringed orange planet, a pink moon, sparkles
      sky = g.createLinearGradient(0, 0, 0, H); sky.addColorStop(0, '#3b0764'); sky.addColorStop(0.55, '#5b21b6'); sky.addColorStop(1, '#7c3aed');
      g.fillStyle = sky; g.fillRect(0, 0, W, H);
      dots(g, W, H, 'rgba(255,255,255,.07)', 40);
      for (var j = 0; j < 46; j++) { var sx = (Math.sin(j * 91.7) * 0.5 + 0.5) * W, sy = (Math.sin(j * 37.3 + 1) * 0.5 + 0.5) * H; sparkle(g, sx, sy, (j % 5 ? 3 : 7) * s, j % 3 ? 'rgba(255,255,255,.85)' : '#fde047'); }
      var px = W * 0.84, py = (hz || 0) + H * 0.14, pr = Math.min(W, H) * 0.13;
      g.save(); g.translate(px, py); g.rotate(-0.35);
      g.strokeStyle = '#fde047'; g.lineWidth = 9 * s; g.beginPath(); g.ellipse(0, 0, pr * 1.75, pr * 0.42, 0, Math.PI, Math.PI * 2); g.stroke();
      g.restore();
      g.fillStyle = '#fb923c'; g.beginPath(); g.arc(px, py, pr, 0, 7); g.fill();
      g.fillStyle = '#f97316'; g.beginPath(); g.arc(px + pr * 0.25, py + pr * 0.15, pr * 0.85, 0, 7); g.globalAlpha = 0.5; g.fill(); g.globalAlpha = 1;
      g.fillStyle = '#ea580c'; [[-0.35, -0.2, 0.18], [0.3, 0.35, 0.13], [0.1, -0.45, 0.09]].forEach(function (c) { g.beginPath(); g.arc(px + c[0] * pr, py + c[1] * pr, c[2] * pr, 0, 7); g.fill(); });
      g.fillStyle = 'rgba(255,255,255,.45)'; g.beginPath(); g.ellipse(px - pr * 0.4, py - pr * 0.45, pr * 0.25, pr * 0.12, -0.6, 0, 7); g.fill();
      g.save(); g.translate(px, py); g.rotate(-0.35);
      g.strokeStyle = '#fde047'; g.lineWidth = 9 * s; g.beginPath(); g.ellipse(0, 0, pr * 1.75, pr * 0.42, 0, 0, Math.PI); g.stroke();
      g.restore();
      var mx = W * 0.1, my = H * 0.72, mr = Math.min(W, H) * 0.06;
      g.fillStyle = '#f9a8d4'; g.beginPath(); g.arc(mx, my, mr, 0, 7); g.fill();
      g.fillStyle = '#f472b6'; g.beginPath(); g.arc(mx + mr * 0.3, my + mr * 0.2, mr * 0.28, 0, 7); g.arc(mx - mr * 0.35, my - mr * 0.25, mr * 0.18, 0, 7); g.fill();
    } else {
      // Whack-a-Term: a sunny meadow — blue-lilac sky, the sun, green hills, a striped lawn from the horizon
      var ly = hz || H * 0.4;
      sky = g.createLinearGradient(0, 0, 0, ly); sky.addColorStop(0, '#93c5fd'); sky.addColorStop(1, '#c4b5fd');
      g.fillStyle = sky; g.fillRect(0, 0, W, ly + 2);
      g.fillStyle = 'rgba(253,224,71,.35)'; g.beginPath(); g.arc(W * 0.9, ly * 0.62, 50 * s, 0, 7); g.fill();
      g.fillStyle = '#fde047'; g.beginPath(); g.arc(W * 0.9, ly * 0.62, 32 * s, 0, 7); g.fill();
      hill(g, W, ly + 4, 40 * s, 1.2, '#86efac', H);
      var lawn = g.createLinearGradient(0, ly, 0, H); lawn.addColorStop(0, '#4ade80'); lawn.addColorStop(1, '#22c55e');
      g.fillStyle = lawn; g.fillRect(0, ly, W, H - ly);
      for (var b = 0; b < 9; b++) { var y1 = ly + (H - ly) * Math.pow(b / 9, 1.5), y2 = ly + (H - ly) * Math.pow((b + 0.5) / 9, 1.5); g.fillStyle = 'rgba(255,255,255,.10)'; g.fillRect(0, y1, W, y2 - y1); }
      for (var f = 0; f < 26; f++) {
        var fx = (Math.sin(f * 51.3) * 0.5 + 0.5) * W, fy = ly + 10 + (Math.sin(f * 17.9 + 2) * 0.5 + 0.5) * (H - ly - 20), fr = 4 * s;
        g.fillStyle = ['#fff', '#fde047', '#f9a8d4'][f % 3];
        for (var p = 0; p < 5; p++) { g.beginPath(); g.arc(fx + Math.cos(p * 1.256) * fr, fy + Math.sin(p * 1.256) * fr, fr * 0.7, 0, 7); g.fill(); }
        g.fillStyle = '#f59e0b'; g.beginPath(); g.arc(fx, fy, fr * 0.55, 0, 7); g.fill();
      }
    }
    cache[mode] = { key: key, cv: cv };
    return cv;
  }
  window.__arToonBg = function (g, W, H, t, mode, hz) {
    if (!W || !H) return false;
    g.drawImage(layer(mode, W, H, hz), 0, 0, W, H);
    var s = 1.35 * Math.max(0.7, Math.min(1.4, Math.min(W, H) / 700));
    if (mode === 'slice') {
      cloud(g, ((t * 14) % (W + 260)) - 140, H * 0.16, s, 0.9);
      cloud(g, ((t * 9 + W * 0.55) % (W + 260)) - 140, H * 0.34, s * 0.7, 0.7);
    } else if (mode === 'blast') {
      for (var i = 0; i < 6; i++) { var a = 0.5 + 0.5 * Math.sin(t * 2.2 + i * 1.7); sparkle(g, (Math.sin(i * 12.9) * 0.5 + 0.5) * W, (Math.sin(i * 7.1 + 3) * 0.5 + 0.5) * H, (5 + 5 * a) * s, 'rgba(255,255,255,' + (0.4 + 0.6 * a).toFixed(2) + ')'); }
    } else {
      cloud(g, ((t * 12) % (W + 260)) - 140, (hz || H * 0.4) * 0.22, s * 0.9, 0.95);
      cloud(g, ((t * 7 + W * 0.6) % (W + 260)) - 140, (hz || H * 0.4) * 0.5, s * 0.65, 0.85);
    }
    return true;
  };

  // ---------------------------------------------------------------- on / off with the level Minest Live opens
  function mark() {
    var ar = document.querySelector('.arcade');
    if (ar) ar.classList.toggle('ar-toon', !!window.__arToon);
  }
  window.MinestArcadeToon = {
    on: function (mode) { window.__arToon = mode !== 'smash'; if (window.__arToon) { fonts(); css(); } mark(); },
    off: function () { window.__arToon = false; mark(); }
  };
  window.addEventListener('minest:arcade-closed', function () { window.__arToon = false; });
})();

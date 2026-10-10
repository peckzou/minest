  // ------------------------------------------------------------------ the cartoon skin (31.7, in the spirit of Blooket): a bright purple room
  // with soft stripes, white rounded cards with a thick bottom edge, chunky saturated buttons that press down, Titan One for
  // titles and buttons, Nunito for the rest. Laid over the base CSS above, so every screen and every older rule keeps working.
  // The students' side (.mlv-kid) gets bigger words and bigger targets.
  var TOON = (function () {
    var INK = '#2f2a3d', MUTE = '#7a7090', PURP = '#7b2ff7', DEEP = '#4b11b8', TEAL = '#0bc2cf', GOLD = '#ffcc00', PINK = '#ff4f7b', GREEN = '#22b35e';
    var TITLE = '"Titan One","Lilita One",Nunito,system-ui,sans-serif', BODY = 'Nunito,"Nunito Sans",ui-rounded,system-ui,sans-serif';
    var CARD = 'background:#fff;color:' + INK + ';border:0;box-shadow:inset 0 -6px 0 rgba(0,0,0,.09),0 8px 20px rgba(40,0,90,.22)';
    var BTN = 'border:0!important;border-radius:14px!important;font-family:' + TITLE + '!important;font-weight:400!important;letter-spacing:.02em;color:#fff!important;text-shadow:0 2px 0 rgba(0,0,0,.18);box-shadow:inset 0 -6px 0 rgba(0,0,0,.22),0 4px 10px rgba(40,0,90,.2)!important;padding-bottom:15px!important;transition:transform .08s,box-shadow .08s,filter .12s';
    return [
      // the room
      '.mlv{background:repeating-linear-gradient(135deg,rgba(255,255,255,.045) 0 26px,transparent 26px 52px),radial-gradient(1200px 700px at 15% -10%,#a46bff,transparent 60%),linear-gradient(160deg,#6a22ee 0%,' + PURP + ' 45%,#9b4dff 100%) fixed;color:#fff;font-family:' + BODY + ';font-weight:700}',
      '.mlv h2,.mlv h3,.mlv h4,.mlv-brand,.mlv-code,.mlv-cash,.mlv-stat strong,.mlv-res h2,.mlv-of .panel h2,.mlv-of .score-big,.mlv-pop,.mlv-open .tag{font-family:' + TITLE + ';font-weight:400!important;letter-spacing:.02em}',
      '.mlv-top{background:' + DEEP + ';border-bottom:0;box-shadow:0 4px 0 rgba(0,0,0,.18);backdrop-filter:none;-webkit-backdrop-filter:none}',
      '.mlv-brand{font-size:22px;color:#fff;text-shadow:0 3px 0 rgba(0,0,0,.25)}.mlv-brand i{background:' + GOLD + ';border-radius:14px;width:40px;height:40px;font-size:22px;box-shadow:inset 0 -4px 0 rgba(0,0,0,.2);transform:rotate(-6deg)}',
      '.mlv-ar-ic .wi{width:104px;height:104px;display:block;margin:0 auto 6px;animation:mlvBob 2.2s ease-in-out infinite;filter:drop-shadow(0 6px 0 rgba(0,0,0,.12))}',
      '.mlv-brand i .wi{width:40px;height:40px;display:block;filter:drop-shadow(0 2px 0 rgba(0,0,0,.18))}.mlv-brand i{overflow:visible;font-size:0}',
      '.mlv-x{background:#fff;color:' + PURP + ';border:0;border-radius:12px;font-family:' + TITLE + ';font-weight:400;box-shadow:inset 0 -4px 0 rgba(0,0,0,.12)}',
      '.mlv h2{font-size:26px}.mlv h3{font-size:19px}',
      '.mlv-body > h3,.mlv-body > h2{text-shadow:0 3px 0 rgba(0,0,0,.2)}.mlv-body > .mlv-note,.mlv-body > p{color:rgba(255,255,255,.88)!important}',
      // white cards: dark words inside
      '.mlv-card{' + CARD + ';border-radius:20px}',
      '.mlv-card .sub,.mlv-card .mlv-note,.mlv-card label.f,.mlv-card .mlv-link,.mlv-stat small,.mlv-lv small,.mlv-up .v,.mlv-lbk,.mlv-lb .a,.mlv-table th,.mlv-edh,.mlv-edr .n,.mlv-avatar-label,.mlv-locker h4,.mlv-trail{color:' + MUTE + '!important}',
      '.mlv select,.mlv input[type=text],.mlv textarea{background:#fff;color:' + INK + ';border:3px solid #e4d9ff;border-radius:12px;font-family:' + BODY + ';font-weight:800;box-shadow:none}.mlv input:focus,.mlv select:focus,.mlv textarea:focus{outline:none;border-color:#9b4dff}',
      '.mlv input::placeholder,.mlv textarea::placeholder{color:#b3a8cc}',
      '.mlv-chip{background:#f1ebff;color:' + PURP + ';border:0;box-shadow:inset 0 -4px 0 rgba(0,0,0,.08);font-weight:800}.mlv-chip.on{background:' + PURP + ';color:#fff;box-shadow:inset 0 -4px 0 rgba(0,0,0,.25)}',
      // chunky buttons that press down
      '.mlv-btn,.mlv-res .mlv-btn,.mlv-open .mlv-btn,.mlv-of .mlv-btn,.mlv-bp .mlv-btn,.mlv-album .mlv-btn{background:' + TEAL + '!important;' + BTN + '}',
      '.mlv-btn:not(:disabled):hover{filter:brightness(1.06)}.mlv-btn:not(:disabled):active{transform:translateY(3px);box-shadow:inset 0 -2px 0 rgba(0,0,0,.22)!important}',
      '.mlv-btn.alt,.mlv-res .mlv-btn.alt,.mlv-open .mlv-btn.alt,.mlv-of .mlv-btn.alt,.mlv-album .mlv-btn.alt{background:#fff!important;color:' + PURP + '!important;text-shadow:none;box-shadow:inset 0 -6px 0 rgba(0,0,0,.1),0 4px 10px rgba(40,0,90,.18)!important}',
      '.mlv-btn.warn{background:' + PINK + '!important}.mlv-btn.mlv-gkbtn{background:#ff9d00!important}.mlv-btn:disabled{opacity:.55;filter:grayscale(.4)}',
      '.mlv-gbtn{border:0;border-radius:14px;box-shadow:inset 0 -5px 0 rgba(0,0,0,.1),0 4px 10px rgba(40,0,90,.2);color:' + INK + ';font-weight:800}',
      '.mlv-link-btn{color:#fff}.mlv-card .mlv-link-btn{color:' + PURP + '}',
      // the code and the lobby
      '.mlv-code{background:none;-webkit-background-clip:border-box;background-clip:border-box;color:' + PURP + ';text-shadow:0 6px 0 #d9c6ff;letter-spacing:.12em}',
      '.mlv-players span{background:#f1ebff;border:0;color:' + PURP + ';box-shadow:inset 0 -3px 0 rgba(0,0,0,.08);font-weight:900}',
      // leaderboards
      '.mlv-lb .r{background:#f7f3ff;border:0;border-radius:14px;box-shadow:inset 0 -4px 0 rgba(0,0,0,.06)}.mlv-lb .r.up{background:#dcfce7}',
      '.mlv-lb .r:nth-child(1){background:#fff4c2}.mlv-lb .r:nth-child(2){background:#eef2f7}.mlv-lb .r:nth-child(3){background:#ffe6d2}',
      '.mlv-lb .m{color:' + GREEN + '}.mlv-lb .sx span{color:' + MUTE + '}.mlv-lb .sx span.on{color:' + GREEN + ';background:#dcfce7}.mlv-lb .hot{color:#f97316}.mlv-lb .gv{color:#2563eb}',
      '.mlv-top5 .row{border-radius:12px}.mlv-top5 .row.me{background:#fff4c2;outline:3px solid ' + GOLD + '}.mlv-top5 .row b{color:' + GREEN + '}',
      '.mlv-trail i{background:#f1ebff}.mlv-trail i.done{background:#bbf7d0}',
      '.mlv-stat strong{color:' + PURP + '}.mlv-bar{background:#f1ebff;height:14px}.mlv-bar i{background:linear-gradient(90deg,' + TEAL + ',' + GREEN + ')}',
      '.mlv-pod div{border:0;color:' + INK + ';box-shadow:inset 0 -6px 0 rgba(0,0,0,.12);background:' + GOLD + '}.mlv-pod div:nth-child(1){background:#dfe6ef}.mlv-pod div:nth-child(3){background:#ffb27a}.mlv-pod div small{color:' + DEEP + '}',
      '.mlv-feed div{background:#f7f3ff;color:' + INK + '}.mlv-feed .k-legendary{background:#fff4c2}.mlv-feed .k-mythic{background:#ffe0ec}.mlv-feed .k-epic{background:#efe4ff}',
      '.mlv-table td,.mlv-table th{border-bottom:2px solid #f1ebff}',
      // the student's top bar and the level map
      '.mlv-cash{color:' + GREEN + '}.mlv-pill{background:#f1ebff;color:' + PURP + ';font-weight:900;box-shadow:inset 0 -3px 0 rgba(0,0,0,.08)}.mlv-rank{background:' + GOLD + ';color:' + INK + '}',
      '.mlv-av{background:#f1ebff;border-radius:12px}',
      '.mlv-map::before{border-left:6px dashed rgba(255,255,255,.35)}',
      '.mlv-map h4{background:' + GOLD + ';border:0;color:' + INK + ';font-family:' + TITLE + ';font-weight:400;letter-spacing:.04em;box-shadow:inset 0 -4px 0 rgba(0,0,0,.15),0 4px 10px rgba(40,0,90,.2)}',
      '.mlv-lv{' + CARD + ';border-radius:20px}.mlv-lv,.mlv-lv.open{background:#fff!important}.mlv-lv b{font-family:' + TITLE + ';font-weight:400;letter-spacing:.02em}.mlv-lv.done{background:#effdf3!important}.mlv-lv.lock{background:#e9e2f7!important}',
      '.mlv-lv .ic{border-radius:16px;box-shadow:inset 0 -5px 0 rgba(0,0,0,.12);background:' + TEAL + '}.mlv-lv:nth-child(4n+2) .ic{background:' + PINK + '}.mlv-lv:nth-child(4n+3) .ic{background:' + GOLD + '}.mlv-lv:nth-child(4n) .ic{background:#9b4dff}',
      '.mlv-lv.open{outline:5px solid ' + GOLD + ';box-shadow:inset 0 -6px 0 rgba(0,0,0,.09),0 0 0 9px rgba(255,204,0,.25),0 10px 24px rgba(40,0,90,.3);animation:mlvToonBob 2.4s ease-in-out infinite}',
      '.mlv-lv.done .ic{background:' + GREEN + '}.mlv-lv.lock{opacity:.65;background:#e9e2f7;box-shadow:none}',
      '@keyframes mlvToonBob{50%{transform:translateY(-4px)}}',
      // shop, packs, collection
      '.mlv-up{' + CARD + ';border-radius:18px}.mlv-up .t{font-family:' + TITLE + ';font-weight:400}.mlv-up .lv i{background:#f1ebff;height:8px}.mlv-up .lv i.on{background:' + GREEN + '}',
      '.mlv-pkbtn{border:0;box-shadow:inset 0 -7px 0 rgba(0,0,0,.22),0 8px 20px rgba(40,0,90,.3);border-radius:20px}.mlv-pkbtn b{font-family:' + TITLE + ';font-weight:400;text-shadow:0 2px 0 rgba(0,0,0,.3)}.mlv-pkbtn .ol{color:#fff!important;opacity:.9}',
      '.mlv-mini{border:0;box-shadow:inset 0 -5px 0 rgba(0,0,0,.2),0 6px 14px rgba(40,0,90,.25);border-radius:16px}.mlv-mini.no{background:rgba(255,255,255,.18);border:3px dashed rgba(255,255,255,.4);box-shadow:none}.mlv-mini.eq{outline:4px solid ' + GOLD + '}',
      '.mlv-perks span{background:#fff;color:' + GREEN + ';border:0}',
      // waiting games: saturated tiles, white words
      '.mlv-waitg{grid-template-columns:repeat(3,minmax(0,1fr))}',
      '.mlv-waitg button{border:0;color:#fff;border-radius:18px;box-shadow:inset 0 -7px 0 rgba(0,0,0,.2),0 6px 14px rgba(40,0,90,.22);background:' + TEAL + '}',
      '.mlv-waitg button b{font-family:' + TITLE + ';font-weight:400;letter-spacing:.02em;text-shadow:0 2px 0 rgba(0,0,0,.2)}.mlv-waitg button small{color:rgba(255,255,255,.92)!important}',
      '.mlv-waitg button:nth-child(6n+2){background:' + PINK + '}.mlv-waitg button:nth-child(6n+3){background:#ff9d00}.mlv-waitg button:nth-child(6n+4){background:' + GREEN + '}.mlv-waitg button:nth-child(6n+5){background:#9b4dff}.mlv-waitg button:nth-child(6n){background:#3b82f6}',
      '.mlv-waitg button .i{display:block;line-height:0}.mlv-waitg .wi{width:64px;height:64px;display:block;margin:0 auto;filter:drop-shadow(0 4px 0 rgba(0,0,0,.16))}.mlv-kid .mlv-waitg .wi{width:76px;height:76px}',
      '.mlv-waitg button:active{transform:translateY(3px);box-shadow:inset 0 -3px 0 rgba(0,0,0,.2)}.mlv-gems b{color:#0e7490}',
      // avatars and the Locker
      '.mlv-avatar-choice,.mlv-lk{background:#f7f3ff!important;border:0!important;box-shadow:inset 0 -4px 0 rgba(0,0,0,.08)}.mlv-avatar-choice.on,.mlv-lk.on{background:#fff4c2!important;box-shadow:0 0 0 4px ' + GOLD + ',inset 0 -4px 0 rgba(0,0,0,.08)!important}',
      '.mlv-avatar-choice.lock,.mlv-lk.lock{background:#ece6f7!important}.mlv-avatar-choice .pr,.mlv-lk .pr{background:' + PURP + ';color:#fff}',
      '.mlv-lk-g{color:#0e7490}.mlv-endgem{background:#e0f7fa;color:#0e7490}',
      // inline light colours meant for the old dark theme, inside white cards
      '.mlv-card [style*="color:#86efac"],.mlv-res [style*="color:#86efac"],.mlv-lv [style*="color:#86efac"]{color:' + GREEN + '!important}',
      '.mlv-card [style*="color:#c4b5fd"],.mlv-res [style*="color:#c4b5fd"],.mlv-lv [style*="color:#c4b5fd"]{color:' + PURP + '!important}',
      '.mlv-card [style*="color:#fda4af"],.mlv-res [style*="color:#fda4af"]{color:#e11d48!important}.mlv-card [style*="color:#a9b0d6"],.mlv-card [style*="color:#c7cdf5"]{color:' + MUTE + '!important}',
      '.mlv-card [style*="color:#fde047"],.mlv-lv [style*="color:#fde047"],.mlv-res [style*="color:#fde047"]{color:#f5a400!important}.mlv-card [style*="color:#fde68a"]{color:#c27c00!important}.mlv-card .mlv-err,.mlv-err{color:#ff9fb6}.mlv-card .mlv-err{color:#e11d48}',
      // the level result, the money bar, the pops
      '.mlv-res{background:rgba(40,0,90,.5)}.mlv-res .box{' + CARD + ';border-radius:24px;font-family:' + BODY + ';font-weight:700}.mlv-res h2{color:' + PURP + '}',
      '.mlv-res p{color:' + MUTE + '}.mlv-res .stars i.on{color:' + GOLD + ';text-shadow:0 4px 0 #d18f00}',
      '.mlv-float{background:#fff;border:0;color:' + INK + ';box-shadow:inset 0 -4px 0 rgba(0,0,0,.1),0 6px 14px rgba(40,0,90,.3);font-family:' + BODY + '}.mlv-float .c{color:' + GREEN + '}.mlv-float .t{color:' + MUTE + '}.mlv-float.in{background:#f1ebff;box-shadow:none}',
      '.mlv-pop{color:#fff!important;text-shadow:0 3px 0 ' + DEEP + ',0 0 12px rgba(0,0,0,.35)}.mlv-pop.good{color:#7cffb0!important}.mlv-pop.bad{color:#ffb3c6!important}',
      // the mini-games: white panels over the reef, white HUD pills
      '.mlv-of .panel{' + CARD + ';border-radius:24px;backdrop-filter:none;-webkit-backdrop-filter:none;font-family:' + BODY + ';font-weight:700}.mlv-of .panel h2{color:' + PURP + '}',
      '.mlv-of .panel p,.mlv-of .tiny{color:' + MUTE + '}.mlv-of .score-big{color:' + PURP + ';text-shadow:0 5px 0 #d9c6ff}',
      '.mlv-of .hud span,.mlv-of .hud button{background:#fff;color:' + PURP + ';border:0;box-shadow:inset 0 -4px 0 rgba(0,0,0,.1),0 4px 10px rgba(0,0,0,.2);backdrop-filter:none;font-family:' + TITLE + ';font-weight:400}',
      '.mlv-er .qbox{background:#f1ebff!important;border:0!important;color:' + INK + '!important}.mlv-er .qbox h3{color:' + PURP + '!important}.mlv-er .feedback{color:' + MUTE + '}',
      '.mlv-er .answer{background:#fff!important;color:' + INK + '!important;border:3px solid #e4d9ff!important}.mlv-er .energybar{background:#f1ebff;border:0}',
      '.mlv-gkopts button{border:0;box-shadow:inset 0 -6px 0 rgba(0,0,0,.22);font-family:' + TITLE + ';font-weight:400;letter-spacing:.02em}.mlv-gkopts button:active{transform:translateY(3px)}',
      '.mlv-gkopts button:nth-child(1){background:' + TEAL + '}.mlv-gkopts button:nth-child(2){background:' + PINK + '}.mlv-gkopts button:nth-child(3){background:#ff9d00}.mlv-gkopts button:nth-child(4){background:#9b4dff}',
      '.mlv-of-lb{background:#fff;color:' + INK + ';border:0;box-shadow:inset 0 -4px 0 rgba(0,0,0,.08),0 6px 14px rgba(0,0,0,.25);backdrop-filter:none}.mlv-of-lb h5{color:' + PURP + ';font-family:' + TITLE + ';font-weight:400}.mlv-of-lb .r.me{color:' + GREEN + '}',
      '.mlv-bp .end{background:rgba(40,0,90,.5)}.mlv-bp .hud span{background:#fff;color:' + PURP + ';font-family:' + TITLE + ';font-weight:400}',
      '.mlv-open{font-family:' + BODY + '}.mlv-open .tag{color:' + GOLD + ';text-shadow:0 4px 0 #b06f00}',
      // the students' side, made for children: bigger words, bigger targets (52 px and up), a clear "play" button
      '.mlv-kid{font-size:17px}.mlv-kid h2{font-size:30px}.mlv-kid h3{font-size:21px}.mlv-kid .sub{font-size:16px}.mlv-kid .mlv-note{font-size:14px}',
      '.mlv-kid .mlv-btn{min-height:54px;padding:13px 26px;font-size:19px!important}.mlv-kid .mlv-btn.mlv-sm{min-height:44px;font-size:15px!important}',
      '.mlv-kid input[type=text]{font-size:20px;padding:14px 16px;min-height:58px}',
      '.mlv-kid .mlv-avatar-label{font-size:15px}.mlv-kid .mlv-avatar-picker{grid-template-columns:repeat(auto-fill,minmax(72px,1fr));gap:12px}',
      '.mlv-kid .mlv-lv{grid-template-columns:76px 1fr auto;padding:16px 18px;gap:16px}.mlv-kid .mlv-lv .ic{width:76px;height:76px;font-size:42px}',
      '.mlv-kid .mlv-lv b{font-size:21px}.mlv-kid .mlv-lv small{font-size:14px}.mlv-kid .mlv-lv .st{font-size:26px}',
      '.mlv-kid .mlv-lv.open .st{display:grid;place-items:center;width:56px;height:56px;border-radius:16px;background:' + GREEN + ';color:#fff;font-size:24px;box-shadow:inset 0 -5px 0 rgba(0,0,0,.22);animation:mlvToonPulse 1.4s ease-in-out infinite}',
      '@keyframes mlvToonPulse{50%{transform:scale(1.1)}}',
      '.mlv-kid .mlv-map h4{font-size:16px;padding:8px 20px}',
      '.mlv-kid .mlv-cash{font-size:36px}.mlv-kid .mlv-pill{font-size:15px;padding:8px 13px}.mlv-kid .mlv-hud .mlv-btn{min-height:46px;font-size:15px!important;padding:9px 15px 12px!important}',
      '.mlv-kid .mlv-top5 .row{font-size:16px;padding:8px 10px}.mlv-kid .mlv-top5 .row i{font-size:24px}',
      '.mlv-kid .mlv-waitg button{padding:16px 8px 20px;min-height:144px}.mlv-kid .mlv-waitg button .i{font-size:46px}.mlv-kid .mlv-waitg button b{font-size:18px}.mlv-kid .mlv-waitg button small{font-size:13px}',
      '.mlv-kid .mlv-up .t{font-size:18px}.mlv-kid .mlv-up .v{font-size:14px}.mlv-kid .mlv-stat strong{font-size:36px}.mlv-kid .mlv-stat small{font-size:13px}',
      '.mlv-kid .mlv-lk-grid{grid-template-columns:repeat(auto-fill,minmax(70px,1fr))}.mlv-kid .mlv-mini b{font-size:14px}',
      '@media(max-width:640px){.mlv-kid .mlv-waitg{grid-template-columns:repeat(2,minmax(0,1fr))}.mlv-kid .mlv-lv{grid-template-columns:62px 1fr auto}.mlv-kid .mlv-lv .ic{width:62px;height:62px;font-size:34px}}'
    ].join('\n');
  })();
  function ensureToon() {
    if (document.getElementById('mlv-toon')) return;
    if (!document.getElementById('mlv-toon-font')) { var l = document.createElement('link'); l.id = 'mlv-toon-font'; l.rel = 'stylesheet'; l.href = 'https://fonts.googleapis.com/css2?family=Titan+One&family=Nunito:wght@600;700;800;900&display=swap'; document.head.appendChild(l); }
    var st = document.createElement('style'); st.id = 'mlv-toon'; st.textContent = TOON; document.head.appendChild(st);
  }

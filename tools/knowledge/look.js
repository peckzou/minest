/* Minest Knowledge · light and dark for every knowledge view (html.kn-light — set by MinestKnowledge.applyLook from
   the one Auto / Light / Dark setting; Auto follows the board's own theme). The views are dark by default; these
   rules give each its light look. The horizontal timeline is the other way round: light by default, dark here. */
(function () {
  if (document.getElementById('kn-look-css')) return;
  var L = 'html.kn-light ', D = 'html:not(.kn-light) ';
  var INK = '#1d1f23', LINE = 'rgba(0,0,0,.08)', CHIP = 'background:#fff;border-color:rgba(0,0,0,.1);color:' + INK;
  var css = [
    // shared menus and sheets
    L + '.en-menu,' + L + '.kc-menu{background:#fff;color:' + INK + ';border-color:' + LINE + ';box-shadow:0 18px 50px rgba(0,0,0,.18);-webkit-backdrop-filter:none;backdrop-filter:none}',
    L + '.en-menu button,' + L + '.kc-menu button{color:' + INK + '}',
    L + '.en-menu button:active,' + L + '.kc-menu button:active{background:rgba(0,0,0,.06)}',
    L + '.en-menu button.on{color:#0a84ff}',
    L + '.en-menu .row button{background:rgba(0,0,0,.05)}',
    L + '.en-pal .none{background:rgba(0,0,0,.06)!important;color:#333}',
    L + '.en-pal button.on{border-color:#1d1f23}',
    // Contents
    L + '.kc{background:linear-gradient(180deg,#f7f8fa,#eef1f5);color:' + INK + '}',
    L + '.kc-head{border-color:' + LINE + '}',
    L + '.kc-x,' + L + '.kc-tool{' + CHIP + ';box-shadow:none}',
    L + '.kc-row + .kc-row:not(.d0)::before{background:rgba(0,0,0,.07)}',
    L + '.kc-chev{color:rgba(0,0,0,.4)}',
    L + '.kc-row.section .kc-t{color:#a87400}',
    L + '.kc-row.sel{background:rgba(10,132,255,.12)}',
    L + '.kc-back{background:rgba(255,255,255,.94);color:' + INK + ';border-color:' + LINE + ';box-shadow:0 10px 26px rgba(0,0,0,.15)}',
    // Knowledge Map
    L + '.km{background:radial-gradient(1200px 900px at 50% 40%,#ffffff,#e6ebf3 70%);color:' + INK + '}',
    L + '.km-lines path{stroke:rgba(30,40,60,.22)}',
    L + '.km-lines path.on{stroke:rgba(30,40,60,.6)}',
    L + '.km-b{background:rgba(255,255,255,.94);color:' + INK + ';border-color:' + LINE + ';box-shadow:0 6px 16px rgba(0,0,0,.12)}',
    L + '.km-path{background:rgba(255,255,255,.9)}',
    L + '.km-path button{color:rgba(0,0,0,.5)}' + L + '.km-path button:last-child{color:' + INK + '}',
    L + '.km-hint{background:rgba(255,255,255,.92);color:#333}',
    L + '.km-n.focus{box-shadow:0 0 0 4px rgba(10,132,255,.9),0 14px 32px rgba(0,0,0,.25)}',
    // Timeline (vertical)
    L + '.tl:not(.h){background:#f6f6f4;color:' + INK + '}',
    L + '.tl-head{border-color:' + LINE + '}',
    L + '.tl-x,' + L + '.tl-chip{' + CHIP + '}',
    L + '.tl-chip.on{background:rgba(10,132,255,.14);border-color:#0a84ff;color:#0a5bd6}',
    L + '.tl-seg{background:rgba(0,0,0,.06)}' + L + '.tl-seg button.on{background:#fff;box-shadow:0 1px 3px rgba(0,0,0,.12)}',
    L + '.tl-line:before{background:linear-gradient(180deg,rgba(0,0,0,.04),rgba(0,0,0,.16) 40px,rgba(0,0,0,.16) calc(100% - 40px),rgba(0,0,0,.04))}',
    L + '.tl-ev{background:#fff;border-color:rgba(0,0,0,.06);box-shadow:0 1px 3px rgba(0,0,0,.06)}',
    L + '.tl-ev:before{box-shadow:0 0 0 3px #f6f6f4}',
    L + '.tl-ev.open{background:#fff;border-color:rgba(0,0,0,.14)}',
    L + '.tl-d{filter:brightness(.78) saturate(1.2)}',
    L + '.tl-acts button,' + L + '.tl-u button{background:rgba(0,0,0,.05);border-color:' + LINE + ';color:' + INK + '}',
    L + '.tl-u button.sug{color:#a87400;border-color:rgba(168,116,0,.4)}',
    L + '.tl-und{border-color:' + LINE + '}' + L + '.tl-u{border-color:rgba(0,0,0,.05)}',
    L + '.tl-sheet{background:#fff;color:' + INK + ';border-color:' + LINE + ';box-shadow:0 24px 60px rgba(0,0,0,.2)}',
    L + '.tl-f input,' + L + '.tl-f select{background:rgba(0,0,0,.04);border-color:rgba(0,0,0,.12);color:' + INK + '}',
    L + '.tl-sb button{background:rgba(0,0,0,.06);color:' + INK + '}' + L + '.tl-sb .save{background:#0a84ff;color:#fff}',
    // Timeline (horizontal) in the dark
    D + '.tl.h{background:#161618;color:#ececee}',
    D + '.tl.h .tl-head{border-color:rgba(255,255,255,.08)}',
    D + '.tl.h .tl-chip,' + D + '.tl.h .tl-x{background:rgba(255,255,255,.06);border-color:rgba(255,255,255,.12);color:#fff}',
    D + '.tl.h .tl-chip.on{background:#fff;color:#161618;border-color:#fff}',
    D + '.tl-ax,' + D + '.tl-tick{background:#6b6b70}' + D + '.tl-hl{background:#77777c}',
    D + '.tl-dec{color:#ececee}' + D + '.tl-brk{background:#161618;color:#77777c}' + D + '.tl-brkt{color:#77777c}',
    D + '.tl-hd{box-shadow:0 0 0 3px #161618}',
    D + '.tl-hb .d{color:#f2f2f2}' + D + '.tl-hb .n{color:#e6e6e6}' + D + '.tl-hb .m{color:#a7a7ac}',
    D + '.tl-leg{color:#cfcfd4}',
    // Learning Map (its controls; the map keeps its own background style)
    L + '.lm-b2{background:rgba(255,255,255,.95);color:' + INK + ';border-color:' + LINE + ';box-shadow:0 6px 16px rgba(0,0,0,.14)}',
    L + '.lm-path{background:rgba(255,255,255,.92)}' + L + '.lm-path button{color:rgba(0,0,0,.5)}' + L + '.lm-path button:last-child{color:' + INK + '}',
    L + '.lm-legend,' + L + '.lm-note{background:rgba(255,255,255,.92);color:#333}',
    L + '.lm-sheet{background:#fff;color:' + INK + ';border-color:' + LINE + ';box-shadow:0 20px 50px rgba(0,0,0,.2)}',
    L + '.lm-row{border-color:rgba(0,0,0,.07)}' + L + '.lm-x{background:rgba(0,0,0,.06);color:' + INK + '}',
    L + '.lm-acts button{background:rgba(0,0,0,.05);border-color:' + LINE + ';color:' + INK + '}' + L + '.lm-acts button.on{background:#0a84ff;color:#fff}',
    // Wiki: Wikipedia's own colours
    L + '.wk{background:#fff;color:#202122}',
    L + '.wk-head{border-color:#eaecf0}',
    L + '.wk-x,' + L + '.wk-hb{background:#f8f9fa;border-color:#c8ccd1;color:#202122}',
    L + '.wk-hb.on{background:#36c;border-color:#36c;color:#fff}',
    L + '.wk-seg{background:#eaecf0}' + L + '.wk-seg button{color:#54595d}' + L + '.wk-seg button.on{background:#fff;color:#202122}',
    L + '.wk-tile{background:#f8f9fa;border-color:#eaecf0}' + L + '.wk-tile:active{background:#eaecf0}',
    L + '.wk-box{border-color:#a2a9b1;background:#fff}',
    L + '.wk-boxh{background:#ccf}' + L + '.wk-boxh button{color:#36c}',
    L + '.wk-g{border-color:#fdfdfd}' + L + '.wk-gt{background:#ddf;color:#202122}',
    L + '.wk-r{border-color:#fdfdfd}' + L + '.wk-st{background:#e6e6ff;color:#202122}',
    L + '.wk-it .wk-r{border-color:#eaecf0}',
    L + '.wk-gb > .wk-r:nth-child(even) > .wk-it{background:#f8f9fa}',
    L + '.wk-a{color:#36c}' + L + '.wk-a.hit{background:#36c;color:#fff}',
    L + '.wk-pv{background:#fff;color:#202122;border-color:#a2a9b1;box-shadow:0 30px 90px -20px rgba(0,0,0,.2),0 0 1px #a2a9b1}',
    L + '.wk-pv img{background:#eaecf0}',
    L + '.wk-pv .acts button{background:#f8f9fa;border-color:#c8ccd1;color:#202122}' + L + '.wk-pv .acts button.pri{background:#36c;border-color:#36c;color:#fff}',
    L + '.wk-sheet{background:#fff;color:#202122;border-color:#c8ccd1;box-shadow:0 24px 60px rgba(0,0,0,.2)}',
    L + '.wk-sheet input{background:#fff;border-color:#a2a9b1;color:#202122}' + L + '.wk-sheet label{border-color:#eaecf0}',
    L + '.wk-sheet .row button{background:#f8f9fa;color:#202122}' + L + '.wk-sheet .row button.pri{background:#36c;color:#fff}',
    L + '.wk-ed button,' + L + '.wk-tools button{background:#f8f9fa;border-color:#c8ccd1;color:#202122}',
    L + '.wk-band{background:linear-gradient(90deg,#f6b73c,#f59e0b)}',
    // the Knowledge sheet
    L + '.kh{background:rgba(255,255,255,.97);color:' + INK + ';border-color:' + LINE + ';box-shadow:0 30px 80px rgba(0,0,0,.2)}',
    L + '.kh-m{background:rgba(0,0,0,.04)}' + L + '.kh-m:active{background:rgba(0,0,0,.08)}',
    L + '.kh-row button{background:rgba(0,0,0,.05);border-color:' + LINE + ';color:' + INK + '}' + L + '.kh-row button.pri,' + L + '.kh-row button.on{background:#0a84ff;border-color:#0a84ff;color:#fff}',
    D + '.kh-row button.on{background:#0a84ff;border-color:#0a84ff;color:#fff}'
  ].join('\n');
  var st = document.createElement('style'); st.id = 'kn-look-css'; st.textContent = css;
  (document.head || document.documentElement).appendChild(st);
  if (window.MinestKnowledge && MinestKnowledge.applyLook) MinestKnowledge.applyLook();
})();

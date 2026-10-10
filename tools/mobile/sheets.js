/* Minest iPhone / iPad 46.8 · one look for every pop-up, with an Apple Music-style transition
   - Every pop-up (a list's ⋯ menu, Filter Columns, Switch or Manage Boards, the Invisible Ink and AI model menus,
     the Dock's menu, the cover / colour pickers, the alert / prompt dialogs) wears the card details' dark liquid
     glass: one panel (radius 26, frosted, bright rim), 44 pt rows, quiet dividers and section labels.
   - Opening, it grows out of the button that was tapped with a soft spring (scale from the button, fade, a short
     blur); closing, it shrinks back into that button. Only `scale` / `opacity` / `filter` animate, so the pop-ups'
     own positioning (left / right / translate) is untouched.
   - The card details sheet is laid out again: one quiet header (Cover pill, ✕ in a glass circle, a big title),
     grouped insets for List · Mastery · skills, tint and labels, chip-shaped labels, and a slim footer
     (Auto-saved · Archive · Delete · Done pill). It keeps its own morph from the tapped card.
   - No focus ring around the new-card field. */
(function () {
  if (window.__mnSheets) return;
  window.__mnSheets = true;
  var POP = '.column-menu-popover,.list-filter-popover,.board-picker-popover,.fbi-menu,.mai-menu,.mn-bd-menu,.cover-picker-popover,.color-picker-popover,.lg-dialog-card';
  var G = 'linear-gradient(180deg,rgba(66,76,92,.74),rgba(30,36,48,.84))';
  var RIM = 'inset 0 1px 0 rgba(255,255,255,.2),inset 0 -1px 0 rgba(255,255,255,.04)';
  var INSET = 'rgba(255,255,255,.065)';
  var css = [
    // ---- the pop-ups
    '.mn-sheet{background:' + G + '!important;-webkit-backdrop-filter:blur(30px) saturate(180%)!important;backdrop-filter:blur(30px) saturate(180%)!important;' +
      'border:1px solid rgba(255,255,255,.14)!important;border-radius:26px!important;box-shadow:' + RIM + ',0 28px 70px rgba(0,0,0,.45),0 4px 14px rgba(0,0,0,.2)!important;' +
      'color:#f5f7fa!important;padding:8px!important;animation:none!important;overflow:hidden}',
    '.mn-sheet > *{--tw-bg-opacity:1}',
    '.mn-sheet button.w-full,.mn-sheet [role="menuitem"],.mn-sheet .mn-bd-menu-item{min-height:44px!important;border-radius:14px!important;font-size:15px!important;font-weight:500!important;padding-left:14px!important;padding-right:14px!important;align-items:center!important}',
    '.mn-sheet button.w-full:hover,.mn-sheet button.w-full:active,.mn-sheet [role="menuitem"]:active{background:rgba(255,255,255,.09)!important}',
    '.mn-sheet button.w-full svg{width:18px!important;height:18px!important;opacity:.9}',
    '.mn-sheet [class*="h-[1px]"],.mn-sheet hr{background:rgba(255,255,255,.08)!important;border:0!important;height:1px!important;margin:6px 12px!important}',
    '.mn-sheet [class*="uppercase"]{font-size:12px!important;letter-spacing:.06em!important;opacity:.55!important;font-weight:600!important}',
    '.mn-sheet input:not([type="checkbox"]):not([type="radio"]):not([type="range"]):not([type="color"]){background:rgba(255,255,255,.08)!important;border:1px solid rgba(255,255,255,.1)!important;border-radius:14px!important;min-height:44px;font-size:15px!important;color:#fff!important}',
    '.mn-sheet [class*="border-b"],.mn-sheet [class*="border-t"]{border-color:rgba(255,255,255,.08)!important}',
    // Switch or Manage Boards: grouped rows
    '.board-picker-popover.mn-sheet [class*="rounded-2xl"][class*="border"],.board-picker-popover.mn-sheet [class*="rounded-xl"][class*="border"]:not(input):not(button){background:' + INSET + '!important;border-color:transparent!important;border-radius:18px!important}',
    // ---- the transition (set by script; these are fallbacks)
    '.mn-sheet-ghost{pointer-events:none!important}',
    // ---- card details
    '.mn-cardsheet{background:' + G + '!important;-webkit-backdrop-filter:blur(34px) saturate(180%)!important;backdrop-filter:blur(34px) saturate(180%)!important;border:1px solid rgba(255,255,255,.14)!important;border-radius:30px!important;' +
      'box-shadow:' + RIM + ',0 30px 80px rgba(0,0,0,.5)!important;color:#f5f7fa!important}',
    '.mn-cardsheet .liquid-glass-caustic{display:none!important}',
    '.mn-cs-head{border-bottom:0!important;padding:18px 18px 8px!important;gap:12px!important}',
    '.mn-cs-cover{height:30px!important;padding:0 12px!important;border-radius:999px!important;border:0!important;background:rgba(255,255,255,.09)!important;font-size:13px!important;font-weight:600!important}',
    '.mn-cs-head{position:relative}',
    '.mn-cs-head > :first-child{flex:1 1 auto;min-width:0;width:100%}',
    '.mn-cs-x{position:absolute!important;top:16px;right:16px;z-index:2;width:32px!important;height:32px!important;padding:0!important;border-radius:50%!important;display:grid!important;place-items:center;background:rgba(255,255,255,.1)!important;opacity:1!important}',
    '.mn-cs-x svg{width:16px!important;height:16px!important}',
    '.mn-cs-head [class*="border-b"]{border-bottom-color:transparent!important}',
    '.mn-cs-title{padding-right:44px!important;font-size:26px!important;line-height:1.2!important;font-weight:750!important;letter-spacing:-.4px!important;border-bottom-color:transparent!important;padding-bottom:2px!important}',
    '.mn-cardsheet .mn-cs-head textarea.mn-cs-title{border:0!important;box-shadow:none!important;outline:none!important;background:transparent!important}',
    // List · 🔊 🎤 · Mastery · skills as one grouped inset
    '.mn-cardsheet .mn-dm{background:' + INSET + ';border-radius:18px;padding:12px 14px;row-gap:10px!important;margin-top:10px!important}',
    '.mn-cardsheet .mn-dm-k{min-width:64px!important;font-size:12px!important;opacity:.55!important}',
    '.mn-cardsheet .mn-dm select{height:34px;background:rgba(255,255,255,.08)!important;border:0!important;border-radius:11px!important;font-size:14px!important;color:#fff!important;max-width:190px!important}',
    '.mn-cardsheet .mn-dm .mpron-detail-btn{width:40px!important;height:40px!important;border-radius:50%!important;background:rgba(255,255,255,.09)!important;border:1px solid rgba(255,255,255,.12)!important;box-shadow:' + RIM + '!important}',
    '.mn-cardsheet .mn-dm .mpron-detail-btn svg{width:19px!important;height:19px!important}',
    '.mn-cardsheet .mn-dm-btns{display:flex;gap:8px}',
    '.mn-cardsheet .mn-dm-mastery svg{width:20px!important;height:20px!important}',
    '.mn-cardsheet .mn-dm-skills{background:rgba(255,255,255,.05)!important;border-radius:14px!important;padding:10px 12px!important;margin-top:2px}',
    // body sections
    '.mn-cs-body{padding:12px 18px 18px!important}',
    '.mn-cs-body{scrollbar-width:none}.mn-cs-body::-webkit-scrollbar{display:none}',
    '.mn-cs-body > *{margin-top:0!important}',
    '.mn-cs-body > * + *{margin-top:18px!important}',
    '.mn-cs-body > .rounded-2xl.border{background:' + INSET + '!important;border:0!important;border-radius:18px!important;padding:12px 14px!important}',
    '.mn-cs-body [class*="uppercase"]{font-size:12px!important;letter-spacing:.06em!important;opacity:.55!important;font-weight:600!important}',
    '.mn-cs-body [class*="rounded-full"][style*="background"]{width:30px;height:30px}',
    '.mn-cs-body .flex.flex-wrap.gap-2 > button{border-radius:999px!important;padding:7px 14px!important;font-size:13px!important}',
    '.mn-cs-body select,.mn-cs-body textarea,.mn-cs-body input[type="text"]{background:' + INSET + '!important;border:0!important;border-radius:14px!important;color:#fff!important;font-size:14px!important}',
    '.mn-cs-body select{height:44px;padding:0 12px!important}',
    // footer
    '.mn-cs-foot{border-top:1px solid rgba(255,255,255,.08)!important;padding:10px 14px calc(10px + env(safe-area-inset-bottom,0px))!important;gap:8px!important}',
    '.mn-cs-foot > :first-child{white-space:nowrap;font-size:12px!important;opacity:.7!important;min-width:0;overflow:hidden;text-overflow:ellipsis}',
    '.mn-cs-foot > :last-child{gap:2px!important;flex:none}',
    '.mn-cs-foot > :last-child > button{font-size:14px!important;padding:8px 10px!important;text-decoration:none!important}',
    '.mn-cs-done{height:38px!important;padding:0 20px!important;border-radius:999px!important;background:#30d158!important;color:#fff!important;font-size:15px!important;font-weight:600!important;box-shadow:0 6px 16px rgba(48,209,88,.3)!important;margin-left:4px}',
    // ---- the new-card field: no focus ring
    '.card-composer-textarea,.card-composer-textarea:focus,.card-composer-textarea:focus-visible,.fb-composer textarea:focus-visible{outline:none!important;box-shadow:none!important}',
    '.card-gap-active-composer:focus-within{outline:none!important}'
  ].join('\n');
  var st = document.createElement('style'); st.id = 'mn-sheets'; st.textContent = css;
  (document.head || document.documentElement).appendChild(st);

  // ---------------------------------------------------------------- Apple Music-style open / close
  var reduce = false; try { reduce = matchMedia('(prefers-reduced-motion: reduce)').matches; } catch (e) {}
  var lastTap = null;
  document.addEventListener('pointerdown', function (e) {
    var b = e.target && e.target.closest && e.target.closest('button,[role="button"],a,.ios-tab-item');
    if (b && !b.closest('.mn-sheet')) lastTap = { r: b.getBoundingClientRect(), t: Date.now() };
  }, true);
  var live = new Map();   // sheet → { parent, origin }
  function originFor(el) {
    var r = el.getBoundingClientRect();
    if (lastTap && Date.now() - lastTap.t < 2000) {
      var o = lastTap.r;
      return Math.round(o.left + o.width / 2 - r.left) + 'px ' + Math.round(o.top + o.height / 2 - r.top) + 'px';
    }
    return '50% 0px';
  }
  function open(el) {
    if (live.has(el) || el.classList.contains('mn-sheet-ghost')) return;
    el.classList.add('mn-sheet');
    var origin = originFor(el);
    live.set(el, { parent: el.parentNode, origin: origin });
    if (reduce || !el.animate) return;
    el.style.transformOrigin = origin;
    el.animate([
      { scale: '.2', opacity: 0, filter: 'blur(6px)' },
      { scale: '1.025', opacity: 1, filter: 'blur(0px)', offset: 0.68 },
      { scale: '1', opacity: 1, filter: 'blur(0px)' }
    ], { duration: 460, easing: 'cubic-bezier(.2,.85,.25,1)' });
  }
  function close(el) {
    var rec = live.get(el); live.delete(el);
    if (!rec || reduce || !el.animate || !rec.parent || !rec.parent.isConnected) return;
    // put it back for a moment and shrink it into the button it came from
    el.classList.add('mn-sheet-ghost');
    el.style.transformOrigin = rec.origin;
    try { rec.parent.appendChild(el); } catch (e) { return; }
    var a = el.animate([
      { scale: '1', opacity: 1, filter: 'blur(0px)' },
      { scale: '.2', opacity: 0, filter: 'blur(5px)' }
    ], { duration: 260, easing: 'cubic-bezier(.4,0,.6,1)', fill: 'forwards' });
    a.onfinish = a.oncancel = function () { if (el.parentNode) el.parentNode.removeChild(el); };
  }
  function cardSheet(root) {
    var dm = root.querySelector ? root.querySelector('.mn-dm') : null;
    var panel = dm && dm.closest('.rounded-3xl');
    if (!panel || panel.classList.contains('mn-cardsheet')) return;
    panel.classList.add('mn-cardsheet');
    var head = dm.closest('.border-b') || dm.parentNode.parentNode; if (head) head.classList.add('mn-cs-head');
    if (head) {
      var btns = head.querySelectorAll('button');
      btns.forEach(function (b) { if (/^\s*Cover\s*$/.test(b.textContent)) b.classList.add('mn-cs-cover'); });
      var x = btns[btns.length - 1]; if (x && !x.textContent.trim()) x.classList.add('mn-cs-x');
      var ti = head.querySelector('textarea'); if (ti) ti.classList.add('mn-cs-title');
    }
    var body = panel.querySelector(':scope > .flex-1.overflow-y-auto'); if (body) body.classList.add('mn-cs-body');
    var kids = panel.children, foot = kids[kids.length - 1];
    if (foot && /auto-saved/i.test(foot.textContent)) {
      foot.classList.add('mn-cs-foot');
      var tw = document.createTreeWalker(foot, NodeFilter.SHOW_TEXT), tn;
      while ((tn = tw.nextNode())) if (/All changes auto-saved/i.test(tn.nodeValue)) tn.nodeValue = tn.nodeValue.replace(/All changes auto-saved/i, 'Auto-saved');
      foot.querySelectorAll('button').forEach(function (b) { if (/^\s*Done\s*$/.test(b.textContent)) b.classList.add('mn-cs-done'); });
    }
  }
  function scan(n) {
    if (n.nodeType !== 1) return;
    if (n.matches(POP)) open(n);
    else if (n.childElementCount && n.childElementCount < 400) n.querySelectorAll(POP).forEach(open);
    if (n.querySelector && (n.classList.contains('mn-dm') || n.querySelector('.mn-dm'))) cardSheet(n.classList.contains('mn-dm') ? n.parentNode : n);
  }
  new MutationObserver(function (list) {
    list.forEach(function (m) {
      m.addedNodes.forEach(scan);
      m.removedNodes.forEach(function (n) {
        if (n.nodeType !== 1 || !live.size) return;
        live.forEach(function (rec, el) { if (!el.isConnected && (el === n || n.contains(el))) close(el); });
      });
    });
  }).observe(document.body, { childList: true, subtree: true });
  document.querySelectorAll(POP).forEach(open);
})();

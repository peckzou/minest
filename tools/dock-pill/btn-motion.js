(function () {
  var ALL = ['mn-fx-scan','mn-anim-cross','mn-anim-bars','mn-anim-square','mn-anim-orbit','mn-anim-check','mn-anim-glide-r','mn-anim-glide-l','mn-anim-bell','mn-anim-star','mn-anim-pop'];
  function pickAnim(btn) {
    var txt = ((btn.getAttribute('aria-label') || '') + ' ' + (btn.title || '') + ' ' + (btn.textContent || '')).toLowerCase();
    if (/bell|notif|remind|提醒|通知|闹钟/.test(txt)) return 'mn-anim-bell';
    if (/star|fav|bookmark|award|badge|收藏|勋章/.test(txt)) return 'mn-anim-star';
    if (/check|done|complete|学会|完成|✓|✔/.test(txt)) return 'mn-anim-check';
    if (/sync|refresh|reload|looks|fx|light|dark|theme|外观|刷新|同步/.test(txt)) return 'mn-anim-orbit';
    if (/audio|voice|speak|read|sound|mic|朗读|语音|听/.test(txt)) return 'mn-anim-bars';
    if (/prev|back|left|上一|返回|‹|◀|←/.test(txt)) return 'mn-anim-glide-l';
    if (/next|forward|right|完整 app|开始|下一|›|▶|→/.test(txt)) return 'mn-anim-glide-r';
    if (/add|new|plus|close|menu|加|新建|\+|✕|×/.test(txt)) return 'mn-anim-cross';
    if (/board|kanban|list|card|wallet|grid|看板|列表|闪卡|书桌/.test(txt)) return 'mn-anim-square';
    return 'mn-anim-pop';
  }
  document.addEventListener('click', function (e) {
    var btn = e.target && e.target.closest && e.target.closest('button');
    if (!btn || btn.disabled || btn.classList.contains('miv-fan-item') || btn.closest('.mn-bdock')) return;   // the Dock draws its own (system-bar.js)
    var anim = pickAnim(btn);
    ALL.forEach(function (c) { btn.classList.remove(c); });
    void btn.offsetWidth;
    btn.classList.add(anim);
    // Add subtle horizontal scanner sweep to pill/solid buttons (skip tiny icon-only buttons < 56px)
    if (btn.offsetWidth >= 56 && getComputedStyle(btn).position !== 'static' || btn.classList.contains('mn-bapp')) {
      btn.classList.add('mn-fx-scan');
    }
    clearTimeout(btn._mnAnimT);
    btn._mnAnimT = setTimeout(function () {
      btn.classList.remove(anim);
      btn.classList.remove('mn-fx-scan');
    }, 680);
  }, true);
})();

(function () {
  var KEY = 'mn_dock_pill_v1';
  var PILL_ICON = '<svg class="miv-ic" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.9" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true"><rect x="2.5" y="7" width="19" height="10" rx="5"/><rect x="4.5" y="9" width="8" height="6" rx="3" fill="currentColor" stroke="none" opacity=".35"/><circle cx="16.5" cy="12" r="1.3" fill="currentColor" stroke="none"/></svg>';
  function isOn() {
    try { var v = localStorage.getItem(KEY); return v === null ? true : v === '1'; } catch (e) { return true; }
  }
  function apply(on) {
    document.documentElement.classList.toggle('mn-dock-pill', !!on);
    try { localStorage.setItem(KEY, on ? '1' : '0'); } catch (e) {}
    syncLabels();
    if (window.MinestChrome && window.MinestChrome.show) window.MinestChrome.show();
  }
  function shortLabel(btn) {
    var raw = (btn.getAttribute('aria-label') || btn.title || '').trim();
    if (!raw) return 'App';
    var clean = raw.split(/[·•|—\-:(]/)[0].trim();
    return clean.length > 10 ? clean.slice(0, 10) : clean;
  }
  function syncLabels() {
    var dock = document.querySelector('.mn-bdock');
    if (!dock) return;
    var btns = Array.from(dock.querySelectorAll('.mn-bapp')).filter(function (b) {
      return getComputedStyle(b).display !== 'none';
    });
    var hasOn = btns.some(function (b) { return b.classList.contains('on'); });
    var hasActive = btns.some(function (b) { return b.classList.contains('mn-pill-active'); });
    btns.forEach(function (b, idx) {
      var lbl = shortLabel(b);
      if (b.getAttribute('data-pill-label') !== lbl) b.setAttribute('data-pill-label', lbl);
      if (!b.dataset.mnPillBound) {
        b.dataset.mnPillBound = '1';
        b.addEventListener('click', function () {
          btns.forEach(function (x) { x.classList.remove('mn-pill-active'); });
          b.classList.add('mn-pill-active');
        }, true);
      }
      if (!hasOn && !hasActive && idx === 0) b.classList.add('mn-pill-active');
      if (hasOn) b.classList.remove('mn-pill-active');
    });
  }
  function injectIntoLooksFan(fan) {
    if (!fan || fan.querySelector('.mn-pill-fan-item')) return;
    var items = fan.querySelectorAll('.miv-fan-item');
    if (!items.length) return;
    var last = items[items.length - 1];
    var dir = fan.dataset.dir || 'up';
    var lx = parseFloat(last.style.getPropertyValue('--x')) || 0;
    var ly = parseFloat(last.style.getPropertyValue('--y')) || 0;
    var lr = parseFloat(last.style.getPropertyValue('--r')) || 0;
    var dx = parseFloat(last.style.getPropertyValue('--dx')) || 0;
    var dy = parseFloat(last.style.getPropertyValue('--dy')) || 0;
    var nx = dir === 'up' ? lx + 10 : lx;
    var ny = dir === 'up' ? Math.max(36, ly - 58) : Math.min(innerHeight - 36, ly + 58);
    var it = document.createElement('button');
    it.type = 'button';
    it.className = 'miv-fan-item mn-pill-fan-item';
    it.setAttribute('role', 'menuitem');
    it.title = 'Pill Dock · 液态玻璃胶囊 Dock';
    it.style.setProperty('--x', nx + 'px');
    it.style.setProperty('--y', ny + 'px');
    it.style.setProperty('--r', (lr + 1.2) + 'deg');
    it.style.setProperty('--dx', (dx - (nx - lx)) + 'px');
    it.style.setProperty('--dy', (dy - (ny - ly)) + 'px');
    it.style.setProperty('--d', (items.length * 38) + 'ms');
    it.style.setProperty('--dc', '0ms');
    it.innerHTML = '<span class="miv-fan-ic">' + PILL_ICON + '</span><span class="miv-fan-label">' + (isOn() ? '经典方块 Dock' : '胶囊玻璃 Dock') + '</span>';
    function handleToggle(e) {
      e.stopPropagation();
      e.preventDefault();
      apply(!isOn());
      fan.remove();
    }
    it.addEventListener('click', handleToggle);
    fan.appendChild(it);
  }
  window.MinestPillDock = { isOn: isOn, set: apply, toggle: function () { apply(!isOn()); } };
  apply(isOn());
  var raf = 0;
  new MutationObserver(function (muts) {
    for (var i = 0; i < muts.length; i++) {
      for (var j = 0; j < muts[i].addedNodes.length; j++) {
        var n = muts[i].addedNodes[j];
        if (n && n.nodeType === 1 && n.classList && n.classList.contains('mn-looks-fan')) {
          injectIntoLooksFan(n);
        }
      }
    }
    if (raf) return;
    raf = requestAnimationFrame(function () { raf = 0; syncLabels(); });
  }).observe(document.documentElement, { childList: true, subtree: true });
})();

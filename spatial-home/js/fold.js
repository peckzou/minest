/* Minest · Duo fold (2026-11-13) — the host side. The Duo script marks a half-open fold (html.duo-halfopen, from the
   native hinge). This turns it into a layout mode for everything new — Spatial Home, and the pages that open in frames
   (3D Type, Typing Worlds, Times Square, the Holo Lab):
     'top'  — held upright, the hinge runs across: the scene in the top half, controls / keyboard in the bottom half
     'book' — held sideways, the hinge runs down the middle: the scene on the left, controls on the right
   html gets mf-top / mf-book, a 'minest:fold' event fires, and every frame is told ({type:'minest:fold', mode}); a frame
   that loads later asks ({type:'minest:fold?'}). For trying it on a Mac: localStorage 'minest.fold.force' = top | book. */
(function (root) {
  'use strict';
  if (root.MinestFoldHost) return;
  var mode = null;
  function compute() {
    var f = null; try { f = localStorage.getItem('minest.fold.force'); } catch (e) {}
    if (f === 'top' || f === 'book') return f;
    if (!document.documentElement.classList.contains('duo-halfopen')) return null;
    return innerHeight > innerWidth ? 'top' : 'book';
  }
  function post(to) {
    var msg = { type: 'minest:fold', mode: mode };
    if (to) { try { to.postMessage(msg, '*'); } catch (e) {} return; }
    [].forEach.call(document.querySelectorAll('iframe'), function (f) { try { f.contentWindow.postMessage(msg, '*'); } catch (e) {} });
  }
  function apply() {
    var m = compute(); if (m === mode) return; mode = m;
    var R = document.documentElement; R.classList.toggle('mf-top', m === 'top'); R.classList.toggle('mf-book', m === 'book');
    post(); try { root.dispatchEvent(new CustomEvent('minest:fold', { detail: { mode: m } })); } catch (e) {}
  }
  new MutationObserver(apply).observe(document.documentElement, { attributes: true, attributeFilter: ['class'] });
  root.addEventListener('resize', apply);
  root.addEventListener('minest:hinge', function () { setTimeout(apply, 60); });
  root.addEventListener('message', function (e) { if (e.data && e.data.type === 'minest:fold?' && e.source) post(e.source); });
  apply();
  root.MinestFoldHost = { mode: function () { return mode; },
    force: function (m) { try { if (m) localStorage.setItem('minest.fold.force', m); else localStorage.removeItem('minest.fold.force'); } catch (e) {} apply(); } };
})(window);

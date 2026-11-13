/* Minest · Duo fold — the frame side (3D Type pages, Typing Worlds, Times Square, Holo Lab). The Minest page tells the
   frame how the Duo is folded ({type:'minest:fold', mode: 'top' | 'book' | null}, see spatial-home/js/fold.js):
   html gets mf-top / mf-book and a resize fires. A page with a three.js camera can call MinestFold.view(camera, w, h)
   in its resize: the picture is shifted (setViewOffset) so the scene sits in the top half / the left half and taps
   still hit what they show. ?fold=top|book forces a mode (for trying it on a computer). */
(function () {
  if (window.MinestFold) return;
  var mode = null, cbs = [];
  function set(m) {
    m = m === 'top' || m === 'book' ? m : null; if (m === mode) return; mode = m;
    var R = document.documentElement; R.classList.toggle('mf-top', m === 'top'); R.classList.toggle('mf-book', m === 'book');
    cbs.forEach(function (f) { try { f(m); } catch (e) {} });
    try { window.dispatchEvent(new Event('resize')); } catch (e) {}
  }
  window.addEventListener('message', function (e) { if (e.source === window.parent && e.data && e.data.type === 'minest:fold') set(e.data.mode); });
  try { var q = new URLSearchParams(location.search).get('fold'); if (q) set(q); } catch (e) {}
  if (window.parent !== window) try { window.parent.postMessage({ type: 'minest:fold?' }, '*'); } catch (e) {}
  window.MinestFold = {
    get mode() { return mode; },
    on: function (f) { cbs.push(f); },
    view: function (camera, w, h) {
      if (!camera || !camera.setViewOffset) return;
      if (mode === 'top') camera.setViewOffset(w, h, 0, h * 0.25, w, h);
      else if (mode === 'book') camera.setViewOffset(w, h, w * 0.25, 0, w, h);
      else if (camera.clearViewOffset) camera.clearViewOffset();
    }
  };
})();

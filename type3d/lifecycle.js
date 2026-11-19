/* Shared lifecycle for full-page 3D worlds, including embedded study-room entry. */
(function () {
  var leaving = false, frames = new Set(), disposers = [];
  var request = window.requestAnimationFrame.bind(window), cancel = window.cancelAnimationFrame.bind(window);
  window.requestAnimationFrame = function (fn) {
    if (leaving) return 0;
    var id = request(function (time) { frames.delete(id); if (!leaving) fn(time); }); frames.add(id); return id;
  };
  window.cancelAnimationFrame = function (id) { frames.delete(id); cancel(id); };
  function leave() {
    if (leaving) return; leaving = true;
    frames.forEach(cancel); frames.clear();
    disposers.forEach(function (fn) { try { fn(); } catch (e) { console.warn('3D Type cleanup', e); } });
    document.querySelectorAll('canvas#gl, canvas.tw-canvas').forEach(function (canvas) {
      var gl = canvas.getContext('webgl2') || canvas.getContext('webgl');
      if (gl && !gl.isContextLost()) { var ext = gl.getExtension('WEBGL_lose_context'); if (ext) ext.loseContext(); }
    });
  }
  window.T3DLifecycle = { register: function (fn) { disposers.push(fn); }, leave: leave };
  addEventListener('pagehide', leave);
  addEventListener('pageshow', function (e) { if (e.persisted && leaving) location.reload(); });
})();

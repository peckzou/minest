/* Clun 室内 2.0 · 走动时的东西（放在 1.0 的 app.js 后面）：炉火跳动、走进一个房间时报房间名、两盏跟着人走的灯。
   只读 1.0 进屋探索的状态（C._explore），不改它。 */
(function () {
  'use strict';
  var C = window.Clun, V2 = C && C.V2; if (!V2) return;
  var label = document.createElement('div'); label.id = 'clun2Room';
  label.style.cssText = 'position:fixed;left:50%;top:max(14px,env(safe-area-inset-top));transform:translateX(-50%);z-index:30;padding:7px 16px;border-radius:999px;background:rgba(30,26,20,.62);color:#fff7e6;font:600 14px/1.2 -apple-system,"PingFang SC","Noto Sans SC",sans-serif;letter-spacing:.04em;pointer-events:none;opacity:0;transition:opacity .45s;white-space:nowrap;backdrop-filter:blur(6px);-webkit-backdrop-filter:blur(6px)';
  document.body.appendChild(label);
  var cur = null, hideAt = 0, p = new THREE.Vector3(), tgt = [new THREE.Vector3(), new THREE.Vector3()], prev = performance.now();
  function show(r) { label.innerHTML = r.zh + ' <span style="opacity:.72;font-weight:500">· ' + r.en + '</span>'; label.style.opacity = 1; hideAt = performance.now() + 2600; }
  function tick(now) {
    requestAnimationFrame(tick);
    var t = now / 1000, dt = Math.min(0.05, (now - prev) / 1000); prev = now;
    if (V2.fire) { V2.fire.scale.z = 0.85 + 0.2 * Math.sin(t * 9.1) + 0.12 * Math.sin(t * 15.7 + 1.3); V2.fire.scale.y = 1 + 0.05 * Math.sin(t * 6.3); if (V2.fireGlow) V2.fireGlow.material.opacity = 0.42 + 0.14 * Math.sin(t * 7.7) + 0.06 * Math.sin(t * 13.1); }
    var X = C._explore, on = X && X.st && X.st.last && t - X.st.last < 0.4;
    if (!on) { if (cur) { cur = null; label.style.opacity = 0; } return; }
    p.copy(X.st.pos); X.house.worldToLocal(p);                                   /* → 工程坐标（p.z 是眼睛的高度） */
    var feetZ = X.house.worldToLocal(new THREE.Vector3(X.st.pos.x, X.st.floorY, X.st.pos.z)).z, r = V2.roomAt(p.x, p.y, feetZ);
    if (r && r !== cur) { cur = r; show(r); }
    if (hideAt && now > hideAt) { label.style.opacity = 0; hideAt = 0; }
    if (V2.rovers && V2.rovers.length) {                                         /* 两盏跟着人的灯：滑向离人最近的两处灯位 */
      var best = V2.spots.map(function (s) { return [Math.pow(s[0] - p.x, 2) + Math.pow(s[1] - p.y, 2) + Math.pow((s[2] - feetZ - 1.2) * 2.2, 2), s]; }).sort(function (a, b) { return a[0] - b[0]; });
      var a = best[0][1], b = best[1][1], l0 = V2.rovers[0], l1 = V2.rovers[1];
      if (l0.position.distanceToSquared(tgt[1].set(a[0], a[1], a[2])) < l0.position.distanceToSquared(tgt[0].set(b[0], b[1], b[2])) && l1.position.distanceToSquared(tgt[0]) < l1.position.distanceToSquared(tgt[1])) { var s = a; a = b; b = s; }   /* 已经在那里的那盏不动 */
      l0.position.lerp(tgt[0].set(a[0], a[1], a[2]), Math.min(1, dt * 3)); l1.position.lerp(tgt[1].set(b[0], b[1], b[2]), Math.min(1, dt * 3));
    }
  }
  requestAnimationFrame(tick);
  V2.currentRoom = function () { return cur; };
})();

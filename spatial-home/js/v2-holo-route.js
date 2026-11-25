/* Non-destructive 2.0 route for standalone Spatial Home (spatial-home/index.html & rooms.html):
 * Points the 🔮 全息投影仪 (`holo`) target at `hologram-2/` without modifying bridge.js.
 * Inside main Minest pages, tools/v2-routes/patch_v2_routes.py performs the same swap. */
(function (root) {
  'use strict';
  var B = root.SpatialBridge;
  var holo = B && B.FEATURES && B.FEATURES.holo && B.FEATURES.holo.targets && B.FEATURES.holo.targets[0];
  if (!holo) return;
  holo.url = '../hologram-2/index.html';
  holo.web = 'hologram-2/index.html';
  holo.flat = 'https://minest-app.vercel.app/hologram-2/index.html';
  holo.entry = 'hologram-2/index.html';
})(window);

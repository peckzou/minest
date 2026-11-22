/* Minest · Spatial Home · Rooms 2.0 — which room this page opens, and where it keeps its settings.
   Spatial Home (js/app.js, unchanged) keeps its settings under one localStorage key and always starts in the Victorian
   Study. This page is for the new rooms, which Spatial Home itself does not know, so:
   · its settings live in a key of their own — the first read starts from Spatial Home's (motion, view, audio …) and
     nothing here ever writes back to them, so the room you are in here never changes what Spatial Home opens;
   · the first room built is the one asked for: ?room=<id>, else the room you were last in on this page, else the
     first new room. The 🌐 switcher still offers every room. */
(function () {
  'use strict';
  var KEY = 'minest.spatialHome.v1', MINE = 'minest.spatialHome.rooms.v1', SR = window.SpatialRoom;
  if (!SR) return;
  var NEW = (window.SpatialRoomsNew = window.SpatialRoomsNew || []);
  var P = Storage.prototype, get = P.getItem, set = P.setItem, want = null;
  try { want = new URLSearchParams(location.search).get('room'); } catch (e) {}
  function parse(s) { try { var v = JSON.parse(s || 'null'); return v && typeof v === 'object' ? v : null; } catch (e) { return null; } }
  function known(id) { return !!id && SR.envs().some(function (e) { return e.id === id; }); }
  function target() {
    if (known(want)) return want;
    var mine = null; try { mine = parse(get.call(window.localStorage, MINE)); } catch (e) {}
    return mine && known(mine.env) ? mine.env : NEW[0];
  }
  P.getItem = function (k) {
    if (k !== KEY || this !== window.localStorage) return get.call(this, k);
    var s = parse(get.call(this, MINE)) || parse(get.call(this, KEY)) || {}, env = target();
    if (env && env !== s.env) { s.env = env; s.pose = null; }          // a saved view belongs to the room it was saved in
    return JSON.stringify(s);
  };
  P.setItem = function (k, v) { return set.call(this, k === KEY && this === window.localStorage ? MINE : k, v); };
  var build0 = SR.build, first = true;
  SR.build = function (scene, id) {
    if (first) { first = false; id = target() || id; }
    return build0.call(this, scene, id);
  };
})();

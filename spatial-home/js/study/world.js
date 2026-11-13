/* The Study - an English classical private library (a room to live and read in, not a showpiece).
 * Dimensions and layout, shared by scene.js (geometry) and app.js (collision, ladder, seats).
 * Units: metres. x = west(-)..east(+), z = north(-)..south(+), y up. The window is in the north wall,
 * the door in the south wall, the sliding ladder runs along the east shelves.
 *
 * Sizes are chosen for a country-house study (8 x 6.4 x 3.9 m): shelves 0.36 m deep and 3.3 m high with
 * a brass rail at 2.62 m; the desk is 1.9 x 0.85 m; a ladder 2.7 m long leaning 13 degrees.
 * Exposes StudyWorld = { create() }.
 */
(function (root) {
  'use strict';
  function create() {
    const X0 = -4, X1 = 4, Z0 = -3.2, Z1 = 3.2, H = 3.9;
    const SH = { depth: 0.36, height: 3.3, board: 0.03, plinth: 0.2, pitch: 0.44, rows: 7, margin: 0.06 };
    const win = { x0: -1.1, x1: 1.1, y0: 0.95, y1: 3.0 };
    const door = { x0: -0.55, x1: 0.55, h: 2.3 };
    // wall units that carry shelves: axis 'z' = a wall along z (west/east), 'x' = along x (north/south)
    const units = [
      { id: 'W', wall: 'west', axis: 'z', fix: X0, side: +1, a: Z0 + 0.02, b: Z1 - 0.02 },
      { id: 'E', wall: 'east', axis: 'z', fix: X1, side: -1, a: Z0 + 0.02, b: Z1 - 0.02 },
      { id: 'NW', wall: 'north', axis: 'x', fix: Z0, side: +1, a: X0 + SH.depth, b: win.x0 - 0.1 },
      { id: 'NE', wall: 'north', axis: 'x', fix: Z0, side: +1, a: win.x1 + 0.1, b: X1 - SH.depth },
      { id: 'SW', wall: 'south', axis: 'x', fix: Z1, side: -1, a: X0 + SH.depth, b: door.x0 - 0.12 },
      { id: 'SE', wall: 'south', axis: 'x', fix: Z1, side: -1, a: door.x1 + 0.12, b: X1 - SH.depth }
    ];
    const ladder = {
      railY: 2.62,            // brass rail, mounted on the east shelves
      baseX: 2.86,            // foot of the ladder (x) at the floor
      topX: 3.59,             // where it hangs on the rail
      zMin: -2.55, zMax: 2.55, // the rail runs between the corner posts
      half: 0.28,             // half width
      z: 0.9                  // where it stands at the start
    };
    const desk = { x: 0, z: -1.78, w: 1.9, d: 0.85, h: 0.76 };
    const seats = [
      { id: 'desk', label: '书桌椅', x: 0, y: 0, z: -2.62, yaw: Math.PI, eye: 1.18, read: { x: 0, y: 0.84, z: -1.78 } },
      { id: 'arm', label: '皮扶手椅', x: -2.55, y: 0, z: 1.95, yaw: -Math.PI / 2 + 0.55, eye: 1.05, read: null }
    ];
    return {
      X0, X1, Z0, Z1, H, SH, win, door, units, ladder, desk, seats,
      spawn: { x: 0.2, y: 0, z: 2.35, yaw: 0 },
      tour: { dur: 70,
        cam: [[0.3, 1.65, 2.7], [-1.4, 1.7, 1.2], [-2.6, 1.7, -0.2], [-1.0, 1.6, -0.9], [1.2, 1.7, 0.2], [2.0, 1.7, 1.8]],
        tgt: [[0, 1.3, -2.0], [-3.8, 1.8, -0.8], [-1.0, 1.0, -1.9], [3.6, 2.0, 0.6], [3.8, 1.8, 1.6], [0, 1.4, -2.2]] }
    };
  }
  root.StudyWorld = { create };
})(typeof window !== 'undefined' ? window : globalThis);

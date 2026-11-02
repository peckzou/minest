/* Admont Abbey Library - procedural data model (Option D: MESH, not voxel).
 * No DOM / no THREE dependency: plain data describing the hall at published proportions.
 * Exposes global AdmontWorld = { W, D, H, DOME_H, create(seed) }.
 *
 * The real library at Stift Admont (Josef Hueber, 1776) is the largest monastic library
 * hall in the world: about 70 m long, 14 m wide, 11 m high, laid out as three sections
 * with a tall central rotunda crowned by a dome. White stucco walls, gilt (gold) trim,
 * two tiers of bookcases, seven ceiling frescoes by Bartolomeo Altomonte, and sixteen
 * sculptures by Josef Stammel. This model keeps the three-section plan and exposes the
 * SAME field shapes the Alpine integration reads, so a later My World runtime can bind to it.
 *
 * Coordinates are in METRES. x runs along the 70 m length, z across the 14 m width,
 * y is up. The hall is centred on the origin: x in [-35, 35], z in [-7, 7], y in [0, 11].
 * buildings = three wings {id, kind, x0,z0,x1,z1 (metre bounds), y (floor level), floors, name, door:[dx,y,dz]}.
 */
(function (root) {
  'use strict';

  // ---- published proportions (metres) --------------------------------
  const W = 70;      // length  (x axis)
  const D = 14;      // width   (z axis)
  const H = 11;      // cornice / side-hall ceiling height
  const DOME_H = 12.7; // apex of the central dome (rises above H)

  // the hall is centred on the origin
  const X0 = -W / 2, X1 = W / 2;     // -35 .. 35
  const Z0 = -D / 2, Z1 = D / 2;     // -7 .. 7

  // the three sections split the 70 m length: north wing | central rotunda | south wing.
  // (the rotunda is the shorter middle bay under the dome.)
  const ROT_HALF = 9;                // the rotunda spans x in [-9, 9]  (18 m)
  const NORTH_X1 = -ROT_HALF;        // north wing: x in [-35, -9]
  const SOUTH_X0 = ROT_HALF;         // south wing: x in [ 9,  35]

  // ---- small deterministic rng (kept for parity with the Alpine model) --
  function mulberry32(a) {
    return function () {
      a |= 0; a = (a + 0x6D2B79F5) | 0;
      let t = Math.imul(a ^ (a >>> 15), 1 | a);
      t = (t + Math.imul(t ^ (t >>> 7), 61 | t)) ^ t;
      return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
    };
  }

  // ---- world creation -------------------------------------------------
  function create(seed) {
    seed = seed == null ? 1776 : seed;   // 1776: the year the hall was completed
    // (the mesh scene reads only the fields below; the rng is here for API parity)
    void mulberry32(seed);

    // ---- buildings: the three wings ----------------------------------
    // Each wing is a floor-plan rectangle in metre bounds with a threshold door.
    // kind: 'adm_wing' for the book halls, 'adm_rotunda' for the domed middle bay.
    const buildings = [
      {
        id: 'adm_north', kind: 'adm_wing',
        x0: X0, z0: Z0, x1: NORTH_X1, z1: Z1,
        y: 0, floors: 1, name: 'North Hall · 北厅',
        door: [NORTH_X1, 0, 0]              // threshold into the rotunda
      },
      {
        id: 'adm_rotunda', kind: 'adm_rotunda',
        x0: NORTH_X1, z0: Z0, x1: SOUTH_X0, z1: Z1,
        y: 0, floors: 1, name: 'Central Rotunda · 中央穹顶厅',
        door: [SOUTH_X0, 0, 0]              // threshold into the south wing
      },
      {
        id: 'adm_south', kind: 'adm_wing',
        x0: SOUTH_X0, z0: Z0, x1: X1, z1: Z1,
        y: 0, floors: 1, name: 'South Hall · 南厅',
        door: [X1 - 0.5, 0, 0]              // the main entrance at the far south end
      }
    ];

    // ---- doors: at the wing thresholds (same shape as Alpine's doors) --
    // x,y,z are the door anchor in metres; open:false by default; w/h describe the opening.
    const doors = [
      { id: 'd_north_rot', x: NORTH_X1, y: 0, z: 0, w: 2.2, h: 4.2, open: false, between: ['adm_north', 'adm_rotunda'] },
      { id: 'd_rot_south', x: SOUTH_X0, y: 0, z: 0, w: 2.2, h: 4.2, open: false, between: ['adm_rotunda', 'adm_south'] },
      { id: 'd_entrance', x: X1 - 0.25, y: 0, z: 0, w: 2.4, h: 4.6, open: false, between: ['adm_south', 'outside'] }
    ];

    // ---- seats: reading benches down the centre line (optional) -------
    const seats = [];
    for (const sx of [-24, -14, 14, 24]) {
      seats.push({ id: 's' + sx, x: sx, y: 0.5, z: 0, yaw: 0 });
    }

    // ---- landmarks: named viewpoints for teleport / banners ----------
    const landmarks = [
      { id: 'entrance', name: '大门入口', en: 'Main Entrance', x: X1 - 4, z: 0, top: 2, r: 8 },
      { id: 'south_hall', name: '南厅书墙', en: 'South Hall bookcases', x: 22, z: 0, top: 2, r: 10 },
      { id: 'rotunda', name: '中央穹顶', en: 'Central Rotunda', x: 0, z: 0, top: 2, r: 9 },
      { id: 'north_hall', name: '北厅书墙', en: 'North Hall bookcases', x: -22, z: 0, top: 2, r: 10 }
    ];

    // ---- a slow idle tour: a camera path and a look-at path ----------
    const tour = {
      cam: [
        [X1 - 2, 2.0, 0], [X1 - 2, 3.6, 4.5], [22, 2.0, 4.5], [10, 2.2, 3.0],
        [0, 3.0, 4.6], [0, 5.5, 0], [0, 3.0, -4.6], [-10, 2.2, -3.0],
        [-22, 2.0, -4.5], [X0 + 3, 2.0, 0]
      ],
      tgt: [
        [22, 3.0, 0], [10, 3.5, 0], [10, 3.5, -3], [0, 4.5, 0],
        [0, 7.0, 0], [0, 2.0, 0], [0, 7.0, 0], [-10, 3.5, 3],
        [-22, 3.0, 0], [0, 3.0, 0]
      ],
      dur: 120
    };

    // ---- spawn: just inside the main (south) entrance ----------------
    const spawn = { x: X1 - 3, y: 0, z: 0, yaw: Math.PI / 2 };   // facing -x, down the hall

    return {
      W, D, H, DOME_H,
      X0, X1, Z0, Z1, ROT_HALF, NORTH_X1, SOUTH_X0,
      buildings, doors, seats, landmarks, tour, spawn,
      lamps: [], chimneys: [], flags: []
    };
  }

  root.AdmontWorld = { W, D, H, DOME_H, create, mulberry32 };
  if (typeof module !== 'undefined') module.exports = root.AdmontWorld;
})(typeof window !== 'undefined' ? window : globalThis);

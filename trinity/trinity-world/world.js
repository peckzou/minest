/* Trinity College, Cambridge - data model (phase 1: Great Court block-out). No DOM, no THREE.
 * Exposes TrinityWorld = { create() }.
 *
 * Coordinates are METRES. x runs west -> east (east = Trinity Street), z runs north -> south, y is up.
 * The court's centre is the origin.
 *
 * SOURCES (what is known and what is estimated):
 *  - Known: Great Gate in the east range; Queen's Gate is the centrepiece of the south range; the Great Hall and
 *    the Master's Lodge are in the west range; the Chapel is on the north side and is 62.5 m long; the court has an
 *    octagonal fountain in the centre; a passage beside the Hall leads west to Nevile's Court; Wren Library closes
 *    Nevile's Court at its west end.
 *  - 19th-century survey: the court measures 1,202 feet (366 m) round. A 98 x 85 m rectangle gives that circuit, so
 *    COURT_X x COURT_Z below are an ESTIMATE that matches it. Replace them (and every ESTIMATE) with the RCHME 1959
 *    survey plan or OS / LiDAR data before the next stage.
 *  - Estimates: range depth, storey heights, Hall length, Lodge extent, tower heights, window spacing.
 */
(function (root) {
  'use strict';

  const COURT_X = 98;        // ESTIMATE east-west (inner faces)   circuit 2*(98+85)=366 m = 1,202 ft
  const COURT_Z = 85;        // ESTIMATE north-south (inner faces)
  const DEPTH = 9;           // ESTIMATE depth of each range
  const IX = COURT_X / 2, IZ = COURT_Z / 2;           // inner face: x = +-49, z = +-42.5
  const NEV_L = 52, NEV_W = 43.6;   // Nevile's Court 228x143 ft; L shortened a little from 69.5 so the Library fits the view budget

  function create() {
    const places = [
      { id: 'great_court', kind: 'tc_court', name: '大庭院 Great Court', x0: -IX, z0: -IZ, x1: IX, z1: IZ, door: [IX + 4, 0, 0] },
      { id: 'great_hall', kind: 'tc_hall', name: '大礼堂 Great Hall', x0: -IX - 12.2, z0: -22.5, x1: -IX, z1: 8, door: [-IX - 0.3, 0, 5.5], interior: 'hall' },
      { id: 'chapel', kind: 'tc_chapel', name: '礼拜堂 Chapel', x0: -31.25, z0: -IZ - DEPTH, x1: 31.25, z1: -IZ, door: [0, 0, -IZ] },
      { id: 'nevile', kind: 'tc_nevile', name: '尼维尔庭院 Nevile\'s Court', x0: -IX - 12.2 - NEV_L, z0: -NEV_W / 2, x1: -IX - 12.2, z1: NEV_W / 2, door: [-IX - 12.6, 0, 0] },
      { id: 'backs', kind: 'tc_backs', name: '后园与剑河 The Backs & River Cam', x0: -250, x1: -IX - 12.2 - NEV_L - 12, z0: -95, z1: 95, door: [-IX - 12.2 - NEV_L - 14, 0, 0] },
      { id: 'wren', kind: 'tc_wren', name: '雷恩图书馆 Wren Library', interior: 'wren', x0: -IX - 12.2 - NEV_L - 12, x1: -IX - 12.2 - NEV_L, z0: -22.5, z1: 22.5, door: [-IX - 12.2 - NEV_L, 0, 0] }
    ];
    return {
      COURT_X, COURT_Z, DEPTH, IX, IZ,
      places, buildings: places,
      // the Great Hall: 100 x 40 x 50 ft = 30.5 x 12.2 x 15.2 m (documented). Its long axis runs along z
      // (court side = the east wall, where the screens passage and gallery are); High Table and the dais are at the
      // north end (-z), under the portrait of Elizabeth I. The door from the court is in the east wall.
      hall: { W: 12.2, L: 30.5, H: 15.2, EAVE: 8.5, x: -IX - 6.1, z0: -22.5, z1: 8.0, doorZ: 5.5 },
      // Nevile's Court: 228 x 143 ft = 69.5 x 43.6 m (documented), cloister arcades N/S/E, the Wren Library closing the W end.
      // It opens off the screens-passage end of the Great Hall. Its long axis runs along -x (west toward the river).
      nevile: { L: NEV_L, W: NEV_W, x0: -IX - 12.2 - NEV_L, x1: -IX - 12.2, z0: -NEV_W / 2, z1: NEV_W / 2, cloisterH: 5.6 },
      // the Wren Library: a single first-floor room over the colonnade. 15 bays each side.
      // Interior ESTIMATE ~ 45 x 12 m x 12 m high (floor 6 m up); the diagonal black/white marble floor, 28 arched windows.
      // The Backs: the lawn west of the Library, the River Cam (flows along z), Trinity College Bridge (1764-5, three arches),
      // a lime avenue beyond. Sizes are ESTIMATES (river 14 m wide, lawn 34 m deep, bridge on the library's axis).
      backs: { x0: -250, x1: -IX - 12.2 - NEV_L - 12, riverE: -IX - 12.2 - NEV_L - 12 - 34, riverW: -IX - 12.2 - NEV_L - 12 - 48, zLawn: 95, bridgeZ: 0, bridgeW: 6 },
      wren: { x: -IX - 12.2 - NEV_L - 6, z0: -22.5, z1: 22.5, W: 12.0, H: 12.0, floorY: 6.0, bays: 15 },
      doors: [], seats: [],
      bounds: { x0: -246, x1: IX + DEPTH + 36, z0: -148, z1: 148 },   // west: past the Wren Library; east: the street, walled at both ends
      // outside on Trinity Street, looking west through the Great Gate
      spawn: { x: IX + DEPTH + 16, y: 0, z: 0, yaw: Math.PI / 2 },
      tour: {
        cam: [[IX + DEPTH + 18, 3.0, 4], [IX + 2, 2.2, 0], [20, 2.4, 6], [-8, 2.4, 12], [-26, 3.0, 4], [-8, 14, -6], [18, 16, 10], [IX + DEPTH + 18, 3.0, 4]],
        tgt: [[0, 3.5, 0], [-20, 4, 0], [-30, 5, -6], [-20, 5, -30], [0, 4, -30], [10, 3, 20], [-20, 6, 0], [0, 3.5, 0]],
        dur: 110
      },
      lamps: [], chimneys: [], flags: []
    };
  }

  root.TrinityWorld = { create, COURT_X, COURT_Z, DEPTH };
  if (typeof module !== 'undefined') module.exports = root.TrinityWorld;
})(typeof window !== 'undefined' ? window : globalThis);

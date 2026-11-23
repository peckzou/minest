import * as THREE from 'three';
import { IslandMetadata, IslandVariant } from '../../types/island';
import { createGlassMat } from './materials';

function mat(color: number | string, options: Partial<THREE.MeshStandardMaterialParameters> = {}) {
  return new THREE.MeshStandardMaterial({
    color,
    flatShading: true,
    roughness: 0.6,
    metalness: 0.15,
    ...options,
  });
}

// =========================================================================
// 1. INDOOR DECORATIVE OBJECTS BUILDER (OB-251 to OB-300)
// Pure Standalone Objects: Zero artificial display pedestals. Sits directly on the floor.
// =========================================================================
export function buildIndoorDecorScene(
  island: IslandMetadata,
  variant: IslandVariant
): THREE.Group {
  const g = new THREE.Group();

  const p0 = island.palette[0]?.hex || '#9A3412';
  const p1 = island.palette[1]?.hex || '#451A03';
  const p2 = island.palette[2]?.hex || '#1E293B';
  const p3 = island.palette[3]?.hex || '#D97706';

  const idNum = parseInt(island.id.replace('OB-', ''), 10);

  // -----------------------------------------------------------------------
  // Series A (OB-251 to OB-260): Living Room & Lounge Elegance
  // -----------------------------------------------------------------------
  if (idNum <= 260) {
    if (idNum === 251 || island.slug.includes('lounge-chair')) {
      // Bentwood Lounge Chair & Swivel Base
      const shell = new THREE.Mesh(new THREE.CylinderGeometry(0.5, 0.45, 0.4, 8, 1, false, 0, Math.PI), mat(p1));
      shell.rotation.z = Math.PI / 2;
      shell.rotation.y = -Math.PI / 2;
      shell.position.set(0, 0.45, 0);
      const seatPad = new THREE.Mesh(new THREE.BoxGeometry(0.55, 0.15, 0.5), mat(p0));
      seatPad.position.set(0, 0.35, 0.05);
      const backPad = new THREE.Mesh(new THREE.BoxGeometry(0.5, 0.45, 0.12), mat(p0));
      backPad.rotation.x = -0.25;
      backPad.position.set(0, 0.65, -0.15);
      // Swivel star base
      const starBase = new THREE.Mesh(new THREE.CylinderGeometry(0.04, 0.04, 0.25, 6), mat(p2, { metalness: 0.8 }));
      starBase.position.y = 0.125;
      for (let i = 0; i < 4; i++) {
        const leg = new THREE.Mesh(new THREE.BoxGeometry(0.4, 0.03, 0.06), mat(p2, { metalness: 0.8 }));
        leg.rotation.y = (i * Math.PI) / 2;
        leg.position.set(0, 0.02, 0);
        g.add(leg);
      }
      g.add(shell, seatPad, backPad, starBase);
    } else if (idNum === 252 || island.slug.includes('coffee-table')) {
      // Marble Slab Table on Intersecting Brass Blades
      const marble = new THREE.Mesh(new THREE.CylinderGeometry(0.65, 0.65, 0.06, 16), mat(p0, { roughness: 0.25 }));
      marble.position.y = 0.38;
      // Brass blade fins
      const blade1 = new THREE.Mesh(new THREE.BoxGeometry(0.85, 0.35, 0.04), mat(p2, { metalness: 0.8, roughness: 0.3 }));
      blade1.position.y = 0.175;
      const blade2 = new THREE.Mesh(new THREE.BoxGeometry(0.04, 0.35, 0.85), mat(p2, { metalness: 0.8, roughness: 0.3 }));
      blade2.position.y = 0.175;
      // Accent book or tray on table
      const tray = new THREE.Mesh(new THREE.CylinderGeometry(0.18, 0.18, 0.02, 10), mat(p3, { metalness: 0.8 }));
      tray.position.set(0.1, 0.42, 0.1);
      g.add(marble, blade1, blade2, tray);
    } else if (idNum === 253 || island.slug.includes('bookcase')) {
      // Staggered Architectural Bookcase with Volumes
      const frame = new THREE.Mesh(new THREE.BoxGeometry(1.2, 1.4, 0.3), mat(p1));
      frame.position.y = 0.7;
      // Niches & shelves
      [-0.35, 0, 0.35].forEach((sx) => {
        const divider = new THREE.Mesh(new THREE.BoxGeometry(0.03, 1.35, 0.32), mat(p0));
        divider.position.set(sx, 0.7, 0);
        g.add(divider);
      });
      // Book blocks
      [-0.2, 0.18, 0.55].forEach((sy, idx) => {
        const shelf = new THREE.Mesh(new THREE.BoxGeometry(1.15, 0.03, 0.32), mat(p0));
        shelf.position.set(0, sy + 0.35, 0);
        const bookBatch = new THREE.Mesh(new THREE.BoxGeometry(0.25, 0.22, 0.2), mat(idx % 2 === 0 ? p3 : '#DC2626'));
        bookBatch.position.set((idx - 1) * 0.3, sy + 0.47, 0);
        g.add(shelf, bookBatch);
      });
      g.add(frame);
    } else if (idNum === 254 || island.slug.includes('fireplace')) {
      // Suspended Cocoon Fireplace Pod with Radiant Fire
      const flue = new THREE.Mesh(new THREE.CylinderGeometry(0.06, 0.06, 0.8, 10), mat(p0, { metalness: 0.85 }));
      flue.position.y = 1.4;
      const pod = new THREE.Mesh(new THREE.SphereGeometry(0.38, 12, 10), mat(p0, { metalness: 0.85 }));
      pod.position.y = 0.75;
      pod.scale.set(1.0, 1.25, 0.85);
      // Flame opening cutout
      const opening = new THREE.Mesh(new THREE.CylinderGeometry(0.22, 0.22, 0.2, 10), mat('#0F172A'));
      opening.rotation.x = Math.PI / 2;
      opening.position.set(0, 0.72, 0.25);
      // Dancing fire flame
      const flame = new THREE.Mesh(new THREE.ConeGeometry(0.12, 0.28, 6), mat(p1, { emissive: p1, emissiveIntensity: 1.0 }));
      flame.position.set(0, 0.68, 0.15);
      // Ground spark plate
      const hearthPlate = new THREE.Mesh(new THREE.CylinderGeometry(0.55, 0.55, 0.02, 12), mat(p3));
      hearthPlate.position.y = 0.01;
      g.add(flue, pod, opening, flame, hearthPlate);
    } else if (idNum === 255 || island.slug.includes('tapestry')) {
      // Woven Tapestry with Hanging Dowel
      const dowel = new THREE.Mesh(new THREE.CylinderGeometry(0.025, 0.025, 0.9, 8), mat(p2));
      dowel.rotation.z = Math.PI / 2;
      dowel.position.set(0, 1.25, 0);
      const fabric = new THREE.Mesh(new THREE.BoxGeometry(0.75, 0.95, 0.02), mat(p0));
      fabric.position.set(0, 0.75, 0);
      // Geometric color bands
      const band = new THREE.Mesh(new THREE.BoxGeometry(0.76, 0.3, 0.025), mat(p1));
      band.position.set(0, 0.7, 0.005);
      // Fringe tassels
      for (let f = -0.32; f <= 0.32; f += 0.08) {
        const fringe = new THREE.Mesh(new THREE.CylinderGeometry(0.008, 0.012, 0.18, 4), mat(p3));
        fringe.position.set(f, 0.18, 0);
        g.add(fringe);
      }
      g.add(dowel, fabric, band);
    } else if (idNum === 256 || island.slug.includes('arc-floor-lamp')) {
      // Overarching Floor Lamp with Marble Base
      const stoneBase = new THREE.Mesh(new THREE.BoxGeometry(0.28, 0.35, 0.18), mat(p1));
      stoneBase.position.y = 0.175;
      // High Arch Stem
      const archCurve = new THREE.CatmullRomCurve3([
        new THREE.Vector3(0, 0.35, 0),
        new THREE.Vector3(0, 1.4, 0),
        new THREE.Vector3(0.4, 1.7, 0),
        new THREE.Vector3(0.9, 1.5, 0),
        new THREE.Vector3(1.05, 1.25, 0),
      ]);
      const archMesh = new THREE.Mesh(new THREE.TubeGeometry(archCurve, 16, 0.02, 6, false), mat(p0, { metalness: 0.9 }));
      // Spun metal shade dome
      const shade = new THREE.Mesh(new THREE.SphereGeometry(0.18, 10, 6, 0, Math.PI * 2, 0, Math.PI / 2), mat(p2, { metalness: 0.85 }));
      shade.rotation.x = Math.PI;
      shade.position.set(1.05, 1.25, 0);
      // Glowing bulb
      const bulb = new THREE.Mesh(new THREE.SphereGeometry(0.06, 8, 6), mat(p3, { emissive: p3, emissiveIntensity: 1.2 }));
      bulb.position.set(1.05, 1.18, 0);
      g.add(stoneBase, archMesh, shade, bulb);
    } else if (idNum === 257 || island.slug.includes('fluted-ceramic-planter')) {
      // Fluted Ceramic Planter with Monstera Leaves
      const pot = new THREE.Mesh(new THREE.CylinderGeometry(0.28, 0.22, 0.55, 16), mat(p0));
      pot.position.y = 0.38;
      // Wooden stool legs
      for (let l = 0; l < 3; l++) {
        const ang = (l * Math.PI * 2) / 3;
        const leg = new THREE.Mesh(new THREE.CylinderGeometry(0.025, 0.025, 0.25, 6), mat(p3));
        leg.position.set(Math.cos(ang) * 0.18, 0.125, Math.sin(ang) * 0.18);
        g.add(leg);
      }
      // Monstera leaves
      for (let i = 0; i < 5; i++) {
        const ang = (i * Math.PI * 2) / 5;
        const stem = new THREE.Mesh(new THREE.CylinderGeometry(0.015, 0.02, 0.45, 4), mat(p2));
        stem.rotation.z = Math.sin(ang) * 0.45;
        stem.rotation.x = Math.cos(ang) * 0.45;
        stem.position.set(Math.cos(ang) * 0.08, 0.75, Math.sin(ang) * 0.08);
        const leaf = new THREE.Mesh(new THREE.CylinderGeometry(0.22, 0.12, 0.01, 6), mat(p1));
        leaf.rotation.y = ang;
        leaf.rotation.z = 0.6;
        leaf.position.set(Math.cos(ang) * 0.28, 0.95, Math.sin(ang) * 0.28);
        g.add(stem, leaf);
      }
      g.add(pot);
    } else if (idNum === 258 || island.slug.includes('sculptural-bookends')) {
      // Stepped Travertine Arch Bookends
      [-0.28, 0.28].forEach((bx, idx) => {
        const arch = new THREE.Mesh(new THREE.BoxGeometry(0.12, 0.25, 0.18), mat(p0));
        arch.position.set(bx, 0.125, 0);
        const step = new THREE.Mesh(new THREE.BoxGeometry(0.08, 0.15, 0.18), mat(p0));
        step.position.set(bx + (idx === 0 ? -0.06 : 0.06), 0.075, 0);
        g.add(arch, step);
      });
      // Five cloth-bound books between them
      for (let b = -0.16; b <= 0.16; b += 0.08) {
        const book = new THREE.Mesh(new THREE.BoxGeometry(0.065, 0.22, 0.16), mat(b < 0 ? p2 : p3));
        book.position.set(b, 0.11, 0);
        g.add(book);
      }
    } else if (idNum === 259 || island.slug.includes('leather-storage-ottoman')) {
      // Round Leather Pouf / Ottoman
      const pouf = new THREE.Mesh(new THREE.CylinderGeometry(0.36, 0.38, 0.28, 12), mat(p0));
      pouf.position.y = 0.14;
      const topTuft = new THREE.Mesh(new THREE.SphereGeometry(0.36, 12, 6, 0, Math.PI * 2, 0, Math.PI / 3), mat(p0));
      topTuft.position.y = 0.28;
      const centerButton = new THREE.Mesh(new THREE.SphereGeometry(0.04, 8, 6), mat(p1));
      centerButton.position.y = 0.34;
      g.add(pouf, topTuft, centerButton);
    } else {
      // Mid-Century Teak Record Console & Vinyl
      const cabinet = new THREE.Mesh(new THREE.BoxGeometry(0.85, 0.35, 0.4), mat(p0));
      cabinet.position.y = 0.42;
      // Four tapered legs
      [[-0.35, -0.15], [0.35, -0.15], [-0.35, 0.15], [0.35, 0.15]].forEach(([lx, lz]) => {
        const leg = new THREE.Mesh(new THREE.CylinderGeometry(0.02, 0.035, 0.25, 6), mat(p1));
        leg.position.set(lx, 0.125, lz);
        g.add(leg);
      });
      // Turntable platter & tonearm
      const platter = new THREE.Mesh(new THREE.CylinderGeometry(0.12, 0.12, 0.02, 12), mat(p2, { metalness: 0.85 }));
      platter.position.set(-0.18, 0.61, 0);
      const tonearm = new THREE.Mesh(new THREE.BoxGeometry(0.15, 0.015, 0.015), mat(p2, { metalness: 0.9 }));
      tonearm.rotation.y = 0.4;
      tonearm.position.set(-0.08, 0.63, -0.05);
      // Vinyl records slotted vertically
      for (let v = 0.1; v <= 0.32; v += 0.05) {
        const sleeve = new THREE.Mesh(new THREE.BoxGeometry(0.02, 0.2, 0.2), mat(p3));
        sleeve.position.set(v, 0.7, 0);
        g.add(sleeve);
      }
      g.add(cabinet, platter, tonearm);
    }
  }

  // -----------------------------------------------------------------------
  // Series B (OB-261 to OB-270): Dining, Gourmet & Wine Decor
  // -----------------------------------------------------------------------
  else if (idNum <= 270) {
    if (idNum === 261 || island.slug.includes('decanter')) {
      // Crystal Swan-Neck Decanter & Stemware Set
      const decanter = new THREE.Mesh(new THREE.CylinderGeometry(0.05, 0.18, 0.25, 10), createGlassMat(p0, 0.65));
      decanter.position.y = 0.13;
      const liquid = new THREE.Mesh(new THREE.CylinderGeometry(0.04, 0.16, 0.12, 10), mat(p1, { roughness: 0.1 }));
      liquid.position.y = 0.07;
      const neck = new THREE.Mesh(new THREE.CylinderGeometry(0.03, 0.05, 0.18, 8), createGlassMat(p0, 0.7));
      neck.position.y = 0.32;
      // Twin wine glasses
      [-0.18, 0.18].forEach((gx) => {
        const stem = new THREE.Mesh(new THREE.CylinderGeometry(0.008, 0.01, 0.18, 6), createGlassMat(p0, 0.75));
        stem.position.set(gx, 0.09, 0.08);
        const bowl = new THREE.Mesh(new THREE.SphereGeometry(0.055, 8, 6), createGlassMat(p0, 0.6));
        bowl.position.set(gx, 0.22, 0.08);
        g.add(stem, bowl);
      });
      g.add(decanter, liquid, neck);
    } else if (idNum === 262 || island.slug.includes('candelabra')) {
      // Branching Centerpiece Candelabra with 5 Candles
      const base = new THREE.Mesh(new THREE.CylinderGeometry(0.08, 0.14, 0.06, 8), mat(p0, { metalness: 0.75 }));
      base.position.y = 0.03;
      const trunk = new THREE.Mesh(new THREE.CylinderGeometry(0.03, 0.04, 0.35, 6), mat(p0, { metalness: 0.75 }));
      trunk.position.y = 0.2;
      g.add(base, trunk);
      // 5 candle cups & tapers
      [0, -0.16, 0.16, -0.28, 0.28].forEach((cx, idx) => {
        const armH = idx === 0 ? 0.38 : idx < 3 ? 0.32 : 0.26;
        const arm = new THREE.Mesh(new THREE.BoxGeometry(0.02, 0.02, 0.02), mat(p0, { metalness: 0.75 }));
        arm.position.set(cx, armH, 0);
        const candle = new THREE.Mesh(new THREE.CylinderGeometry(0.015, 0.015, 0.18, 6), mat(p2));
        candle.position.set(cx, armH + 0.09, 0);
        const flame = new THREE.Mesh(new THREE.ConeGeometry(0.012, 0.035, 4), mat(p3, { emissive: p3, emissiveIntensity: 1.0 }));
        flame.position.set(cx, armH + 0.2, 0);
        g.add(arm, candle, flame);
      });
    } else if (idNum === 263 || island.slug.includes('bar-cart')) {
      // Art Deco Brass Bar Cart on Spoke Wheels
      const cartFrame = new THREE.Mesh(new THREE.BoxGeometry(0.65, 0.55, 0.4), mat(p0, { metalness: 0.85, wireframe: true }));
      cartFrame.position.y = 0.42;
      const shelfTop = new THREE.Mesh(new THREE.BoxGeometry(0.64, 0.02, 0.38), createGlassMat(p1, 0.6));
      shelfTop.position.y = 0.68;
      const shelfBot = new THREE.Mesh(new THREE.BoxGeometry(0.64, 0.02, 0.38), createGlassMat(p1, 0.6));
      shelfBot.position.y = 0.22;
      // Big wheels
      [-0.32, 0.32].forEach((wx) => {
        const wheel = new THREE.Mesh(new THREE.TorusGeometry(0.12, 0.018, 6, 12), mat(p0, { metalness: 0.85 }));
        wheel.position.set(wx, 0.12, 0.2);
        g.add(wheel);
      });
      // Shaker & bottles
      const shaker = new THREE.Mesh(new THREE.CylinderGeometry(0.035, 0.045, 0.14, 8), mat(p0, { metalness: 0.9 }));
      shaker.position.set(-0.15, 0.76, 0);
      const bottle1 = new THREE.Mesh(new THREE.CylinderGeometry(0.025, 0.03, 0.16, 6), mat(p3));
      bottle1.position.set(0.15, 0.76, 0.08);
      g.add(cartFrame, shelfTop, shelfBot, shaker, bottle1);
    } else if (idNum === 264 || island.slug.includes('fruit-compote')) {
      // Carved Travertine Compote with Mediterranean Fruit
      const ped = new THREE.Mesh(new THREE.CylinderGeometry(0.06, 0.12, 0.14, 10), mat(p0));
      ped.position.y = 0.07;
      const bowl = new THREE.Mesh(new THREE.CylinderGeometry(0.28, 0.15, 0.12, 12), mat(p0));
      bowl.position.y = 0.2;
      // Mound of fruits (figs, pears, lemons)
      for (let f = 0; f < 6; f++) {
        const ang = (f * Math.PI * 2) / 6;
        const fruit = new THREE.Mesh(new THREE.DodecahedronGeometry(0.055, 0), mat(f % 2 === 0 ? p1 : p2));
        fruit.position.set(Math.cos(ang) * 0.12, 0.27, Math.sin(ang) * 0.12);
        g.add(fruit);
      }
      const topFruit = new THREE.Mesh(new THREE.SphereGeometry(0.06, 8, 6), mat(p3));
      topFruit.position.set(0, 0.32, 0);
      g.add(ped, bowl, topFruit);
    } else if (idNum === 265 || island.slug.includes('murano-glass-vase')) {
      // Murano Sommerso Art Glass Vase & Calla Lily
      const vase = new THREE.Mesh(new THREE.CylinderGeometry(0.1, 0.08, 0.45, 8), createGlassMat(p2, 0.7));
      vase.position.y = 0.225;
      const innerCore = new THREE.Mesh(new THREE.CylinderGeometry(0.05, 0.04, 0.35, 6), mat(p0, { roughness: 0.2 }));
      innerCore.position.y = 0.18;
      // Calla lily stem & bloom
      const stem = new THREE.Mesh(new THREE.CylinderGeometry(0.008, 0.008, 0.5, 4), mat('#15803D'));
      stem.rotation.z = 0.15;
      stem.position.set(0.04, 0.45, 0);
      const bloom = new THREE.Mesh(new THREE.ConeGeometry(0.05, 0.14, 5), mat(p3));
      bloom.rotation.z = -0.3;
      bloom.position.set(0.1, 0.68, 0);
      g.add(vase, innerCore, stem, bloom);
    } else if (idNum === 266 || island.slug.includes('mobile')) {
      // Kinetic Brass Chandelier Mobile
      const centerWire = new THREE.Mesh(new THREE.CylinderGeometry(0.006, 0.006, 0.6, 4), mat(p2, { metalness: 0.9 }));
      centerWire.position.y = 0.9;
      // Cantilever arms & brass discs
      [-0.35, 0.35].forEach((ax, idx) => {
        const arm = new THREE.Mesh(new THREE.BoxGeometry(0.4, 0.01, 0.01), mat(p2, { metalness: 0.9 }));
        arm.position.set(ax, 0.7 - idx * 0.15, 0);
        const disc = new THREE.Mesh(new THREE.CylinderGeometry(0.1, 0.1, 0.008, 12), mat(p0, { metalness: 0.85 }));
        disc.position.set(ax * 1.5, 0.7 - idx * 0.15, 0);
        g.add(arm, disc);
      });
      g.add(centerWire);
    } else if (idNum === 267 || island.slug.includes('tetsubin')) {
      // Japanese Nambu Cast-Iron Teapot on Cypress Platter
      const tray = new THREE.Mesh(new THREE.CylinderGeometry(0.3, 0.3, 0.025, 12), mat(p1));
      tray.position.y = 0.0125;
      const pot = new THREE.Mesh(new THREE.SphereGeometry(0.14, 10, 8), mat(p0, { roughness: 0.85, metalness: 0.7 }));
      pot.scale.set(1.0, 0.7, 1.0);
      pot.position.set(-0.06, 0.12, 0);
      const spout = new THREE.Mesh(new THREE.ConeGeometry(0.03, 0.1, 6), mat(p0, { metalness: 0.7 }));
      spout.rotation.z = -Math.PI / 3;
      spout.position.set(0.08, 0.14, 0);
      const handle = new THREE.Mesh(new THREE.TorusGeometry(0.1, 0.015, 4, 10, Math.PI), mat(p0, { metalness: 0.7 }));
      handle.position.set(-0.06, 0.22, 0);
      // Twin tea cups
      [[-0.1, 0.14], [0.1, 0.14]].forEach(([cx, cz]) => {
        const cup = new THREE.Mesh(new THREE.CylinderGeometry(0.04, 0.03, 0.05, 8), mat('#292524'));
        cup.position.set(cx, 0.045, cz);
        g.add(cup);
      });
      g.add(tray, pot, spout, handle);
    } else if (idNum === 268 || island.slug.includes('wine-rack')) {
      // Architectural White Oak & Leather Wine Rack Column
      const pylon = new THREE.Mesh(new THREE.BoxGeometry(0.18, 1.35, 0.18), mat(p0));
      pylon.position.y = 0.675;
      const baseFoot = new THREE.Mesh(new THREE.BoxGeometry(0.4, 0.04, 0.4), mat(p0));
      baseFoot.position.y = 0.02;
      // Staggered horizontal wine bottles
      for (let w = 0; w < 6; w++) {
        const wy = 0.25 + w * 0.18;
        const bottle = new THREE.Mesh(new THREE.CylinderGeometry(0.035, 0.035, 0.32, 8), mat(p2));
        bottle.rotation.z = Math.PI / 2;
        bottle.position.set(w % 2 === 0 ? 0.12 : -0.12, wy, 0);
        const strap = new THREE.Mesh(new THREE.TorusGeometry(0.042, 0.01, 4, 8), mat(p1));
        strap.rotation.y = Math.PI / 2;
        strap.position.set(w % 2 === 0 ? 0.12 : -0.12, wy, 0);
        g.add(bottle, strap);
      }
      g.add(pylon, baseFoot);
    } else if (idNum === 269 || island.slug.includes('wall-plate')) {
      // Cluster of Artisanal Ceramic Wall Plates
      const wallBack = new THREE.Mesh(new THREE.BoxGeometry(0.85, 0.85, 0.02), mat('#F5F5F4'));
      wallBack.position.set(0, 0.55, -0.05);
      [
        [0, 0.55, 0.16, p0],
        [-0.22, 0.68, 0.12, p1],
        [0.22, 0.42, 0.11, p2],
        [-0.18, 0.38, 0.09, p3],
        [0.2, 0.72, 0.08, p0],
      ].forEach(([px, py, pr, pCol]) => {
        const dish = new THREE.Mesh(new THREE.CylinderGeometry(pr as number, (pr as number) * 0.8, 0.02, 12), mat(pCol as string));
        dish.rotation.x = Math.PI / 2;
        dish.position.set(px as number, py as number, 0.01);
        g.add(dish);
      });
      g.add(wallBack);
    } else {
      // Monolithic Granite Lazy Susan Serving Carousel
      const turntable = new THREE.Mesh(new THREE.CylinderGeometry(0.42, 0.44, 0.04, 16), mat(p0, { roughness: 0.3 }));
      turntable.position.y = 0.06;
      const baseBearing = new THREE.Mesh(new THREE.CylinderGeometry(0.25, 0.25, 0.04, 12), mat(p3, { metalness: 0.8 }));
      baseBearing.position.y = 0.02;
      // Olive wood cruets
      const cruet1 = new THREE.Mesh(new THREE.CylinderGeometry(0.03, 0.04, 0.14, 8), mat(p2));
      cruet1.position.set(0.12, 0.15, 0.05);
      const cruet2 = new THREE.Mesh(new THREE.CylinderGeometry(0.03, 0.04, 0.14, 8), mat(p2));
      cruet2.position.set(-0.12, 0.15, -0.05);
      g.add(turntable, baseBearing, cruet1, cruet2);
    }
  }

  // -----------------------------------------------------------------------
  // Series C (OB-271 to OB-280): Study, Library & Atelier Artefacts
  // -----------------------------------------------------------------------
  else if (idNum <= 280) {
    if (idNum === 271 || island.slug.includes('globe')) {
      // Grand Antique Terrestrial Floor Globe on Tripod Stand
      const globe = new THREE.Mesh(new THREE.SphereGeometry(0.24, 14, 10), mat(p0));
      globe.position.y = 0.75;
      // Brass meridian ring
      const meridian = new THREE.Mesh(new THREE.TorusGeometry(0.27, 0.02, 6, 16), mat(p1, { metalness: 0.85 }));
      meridian.rotation.y = Math.PI / 4;
      meridian.position.y = 0.75;
      // Tripod wooden stand
      const stem = new THREE.Mesh(new THREE.CylinderGeometry(0.04, 0.06, 0.45, 8), mat(p2));
      stem.position.y = 0.45;
      for (let l = 0; l < 3; l++) {
        const ang = (l * Math.PI * 2) / 3;
        const leg = new THREE.Mesh(new THREE.CylinderGeometry(0.02, 0.03, 0.35, 6), mat(p2));
        leg.position.set(Math.cos(ang) * 0.18, 0.15, Math.sin(ang) * 0.18);
        g.add(leg);
      }
      g.add(globe, meridian, stem);
    } else if (idNum === 272 || island.slug.includes('bankers-lamp')) {
      // Heritage Emerald Glass & Brass Banker's Lamp
      const foot = new THREE.Mesh(new THREE.CylinderGeometry(0.12, 0.14, 0.04, 10), mat(p1, { metalness: 0.85 }));
      foot.position.y = 0.02;
      const stem = new THREE.Mesh(new THREE.CylinderGeometry(0.018, 0.02, 0.32, 6), mat(p1, { metalness: 0.85 }));
      stem.position.y = 0.18;
      // Green glass visor shade
      const shade = new THREE.Mesh(new THREE.CylinderGeometry(0.08, 0.08, 0.22, 10, 1, false, 0, Math.PI), mat(p0, { roughness: 0.2 }));
      shade.rotation.z = Math.PI / 2;
      shade.rotation.y = Math.PI;
      shade.position.set(0, 0.35, 0);
      // Diffused reading bulb glow
      const bulbGlow = new THREE.Mesh(new THREE.BoxGeometry(0.18, 0.02, 0.08), mat(p2, { emissive: p2, emissiveIntensity: 1.0 }));
      bulbGlow.position.set(0, 0.33, 0.02);
      g.add(foot, stem, shade, bulbGlow);
    } else if (idNum === 273 || island.slug.includes('easel')) {
      // Tilting Atelier Artist's Easel & Stretched Canvas
      const mastL = new THREE.Mesh(new THREE.CylinderGeometry(0.025, 0.03, 1.5, 4), mat(p0));
      mastL.rotation.z = -0.15;
      mastL.position.set(-0.25, 0.75, 0);
      const mastR = new THREE.Mesh(new THREE.CylinderGeometry(0.025, 0.03, 1.5, 4), mat(p0));
      mastR.rotation.z = 0.15;
      mastR.position.set(0.25, 0.75, 0);
      const mastBack = new THREE.Mesh(new THREE.CylinderGeometry(0.025, 0.03, 1.5, 4), mat(p0));
      mastBack.rotation.x = 0.25;
      mastBack.position.set(0, 0.75, -0.25);
      // Canvas board
      const canvas = new THREE.Mesh(new THREE.BoxGeometry(0.65, 0.55, 0.03), mat(p1));
      canvas.position.set(0, 0.85, 0.05);
      // Shelf with palette & brush
      const shelf = new THREE.Mesh(new THREE.BoxGeometry(0.7, 0.04, 0.12), mat(p0));
      shelf.position.set(0, 0.55, 0.08);
      g.add(mastL, mastR, mastBack, canvas, shelf);
    } else if (idNum === 274 || island.slug.includes('calligraphy')) {
      // Scholar's Shexian Inkstone & Calligraphy Suite
      const tray = new THREE.Mesh(new THREE.BoxGeometry(0.55, 0.03, 0.35), mat(p2));
      tray.position.y = 0.015;
      const inkstone = new THREE.Mesh(new THREE.BoxGeometry(0.28, 0.04, 0.18), mat(p0));
      inkstone.position.set(-0.1, 0.05, 0);
      const inkWell = new THREE.Mesh(new THREE.CylinderGeometry(0.06, 0.06, 0.02, 10), mat('#000000'));
      inkWell.position.set(-0.16, 0.07, 0);
      const brushRest = new THREE.Mesh(new THREE.ConeGeometry(0.04, 0.08, 4), mat(p3));
      brushRest.rotation.z = Math.PI / 2;
      brushRest.position.set(0.15, 0.06, 0);
      const brush = new THREE.Mesh(new THREE.CylinderGeometry(0.008, 0.008, 0.28, 6), mat(p1));
      brush.rotation.x = Math.PI / 2;
      brush.position.set(0.15, 0.08, 0);
      g.add(tray, inkstone, inkWell, brushRest, brush);
    } else if (idNum === 275 || island.slug.includes('hourglass')) {
      // Hand-Blown Sand Hourglass in Turned Walnut Frame
      const topDisc = new THREE.Mesh(new THREE.CylinderGeometry(0.14, 0.14, 0.03, 12), mat(p2));
      topDisc.position.y = 0.44;
      const botDisc = new THREE.Mesh(new THREE.CylinderGeometry(0.14, 0.14, 0.03, 12), mat(p2));
      botDisc.position.y = 0.015;
      // Three spindles
      for (let s = 0; s < 3; s++) {
        const ang = (s * Math.PI * 2) / 3;
        const spindle = new THREE.Mesh(new THREE.CylinderGeometry(0.012, 0.012, 0.4, 6), mat(p2));
        spindle.position.set(Math.cos(ang) * 0.1, 0.22, Math.sin(ang) * 0.1);
        g.add(spindle);
      }
      // Hourglass glass bulbs
      const topBulb = new THREE.Mesh(new THREE.ConeGeometry(0.08, 0.18, 10), createGlassMat(p0, 0.65));
      topBulb.rotation.x = Math.PI;
      topBulb.position.y = 0.31;
      const botBulb = new THREE.Mesh(new THREE.ConeGeometry(0.08, 0.18, 10), createGlassMat(p0, 0.65));
      botBulb.position.y = 0.13;
      // Falling dark sand stream
      const sandCone = new THREE.Mesh(new THREE.ConeGeometry(0.06, 0.08, 8), mat(p1));
      sandCone.position.y = 0.07;
      g.add(topDisc, botDisc, topBulb, botBulb, sandCone);
    } else if (idNum === 276 || island.slug.includes('desk-pad')) {
      // Leather Desk Blotter & Gold Fountain Pen
      const pad = new THREE.Mesh(new THREE.BoxGeometry(0.65, 0.015, 0.4), mat(p0));
      pad.position.y = 0.0075;
      const penWell = new THREE.Mesh(new THREE.CylinderGeometry(0.04, 0.05, 0.03, 10), mat(p1, { metalness: 0.85 }));
      penWell.position.set(0.24, 0.025, -0.12);
      const pen = new THREE.Mesh(new THREE.CylinderGeometry(0.007, 0.009, 0.16, 6), mat(p2));
      pen.rotation.x = -0.4;
      pen.position.set(0.24, 0.08, -0.1);
      g.add(pad, penWell, pen);
    } else if (idNum === 277 || island.slug.includes('specimen-board') || island.slug.includes('herbarium')) {
      // Framed Herbarium Botanical Specimen Shadowbox
      const frame = new THREE.Mesh(new THREE.BoxGeometry(0.5, 0.65, 0.05), mat(p2));
      frame.position.set(0, 0.45, 0);
      const paper = new THREE.Mesh(new THREE.BoxGeometry(0.44, 0.58, 0.02), mat(p1));
      paper.position.set(0, 0.45, 0.02);
      // Pressed fern leaves
      const fernStem = new THREE.Mesh(new THREE.CylinderGeometry(0.006, 0.008, 0.4, 4), mat(p0));
      fernStem.position.set(0, 0.45, 0.035);
      for (let p = -0.12; p <= 0.12; p += 0.05) {
        const leaflet = new THREE.Mesh(new THREE.BoxGeometry(0.12, 0.015, 0.005), mat(p0));
        leaflet.position.set(0, 0.45 + p, 0.036);
        g.add(leaflet);
      }
      g.add(frame, paper, fernStem);
    } else if (idNum === 278 || island.slug.includes('microscope')) {
      // Victorian Brass Microscope on Horseshoe Base
      const base = new THREE.Mesh(new THREE.CylinderGeometry(0.1, 0.14, 0.05, 8, 1, false, 0, Math.PI * 1.5), mat(p1, { metalness: 0.8 }));
      base.position.y = 0.025;
      const pillar = new THREE.Mesh(new THREE.CylinderGeometry(0.025, 0.03, 0.25, 6), mat(p0, { metalness: 0.85 }));
      pillar.position.y = 0.17;
      const stage = new THREE.Mesh(new THREE.BoxGeometry(0.14, 0.015, 0.12), mat('#0F172A'));
      stage.position.set(0, 0.28, 0.04);
      const bodyTube = new THREE.Mesh(new THREE.CylinderGeometry(0.03, 0.035, 0.28, 8), mat(p0, { metalness: 0.85 }));
      bodyTube.position.set(0, 0.42, 0.04);
      const mirror = new THREE.Mesh(new THREE.CylinderGeometry(0.035, 0.035, 0.01, 8), mat(p2, { metalness: 0.9 }));
      mirror.rotation.x = Math.PI / 4;
      mirror.position.set(0, 0.14, 0.04);
      g.add(base, pillar, stage, bodyTube, mirror);
    } else if (idNum === 279 || island.slug.includes('blueprint')) {
      // Rolling Blueprint Utility Cart with Rolled Drawings
      const cart = new THREE.Mesh(new THREE.BoxGeometry(0.48, 0.6, 0.35), mat(p0, { wireframe: true }));
      cart.position.y = 0.36;
      // Rolled blueprints
      for (let r = 0; r < 5; r++) {
        const roll = new THREE.Mesh(new THREE.CylinderGeometry(0.035, 0.035, 0.65, 8), mat(r % 2 === 0 ? p1 : p2));
        roll.position.set((r - 2) * 0.08, 0.42, (r % 2) * 0.06);
        g.add(roll);
      }
      g.add(cart);
    } else {
      // Platonic Dodecahedron Brass Wireframe Sculpture
      const basePed = new THREE.Mesh(new THREE.BoxGeometry(0.24, 0.06, 0.24), mat(p2));
      basePed.position.y = 0.03;
      const dori = new THREE.Mesh(new THREE.DodecahedronGeometry(0.18, 0), mat(p0, { metalness: 0.85, wireframe: true }));
      dori.position.y = 0.28;
      const innerIco = new THREE.Mesh(new THREE.IcosahedronGeometry(0.09, 0), mat(p3, { metalness: 0.9 }));
      innerIco.position.y = 0.28;
      g.add(basePed, dori, innerIco);
    }
  }

  // -----------------------------------------------------------------------
  // Series D (OB-281 to OB-290): Bedroom, Vanity & Dressing Accents
  // -----------------------------------------------------------------------
  else if (idNum <= 290) {
    if (idNum === 281 || island.slug.includes('mirror')) {
      // Full-Length Arched Gilded Dressing Mirror
      const frameArch = new THREE.Mesh(new THREE.CylinderGeometry(0.38, 0.38, 0.04, 12, 1, false, 0, Math.PI), mat(p0, { metalness: 0.85 }));
      frameArch.rotation.z = Math.PI / 2;
      frameArch.position.set(0, 1.25, 0);
      const frameBody = new THREE.Mesh(new THREE.BoxGeometry(0.76, 1.1, 0.04), mat(p0, { metalness: 0.85 }));
      frameBody.position.set(0, 0.7, 0);
      // Mirror reflective pane
      const glass = new THREE.Mesh(new THREE.BoxGeometry(0.68, 1.45, 0.02), mat(p2, { roughness: 0.1, metalness: 0.9 }));
      glass.position.set(0, 0.82, 0.015);
      // Crown acanthus crest
      const crest = new THREE.Mesh(new THREE.ConeGeometry(0.08, 0.14, 5), mat(p0, { metalness: 0.85 }));
      crest.position.set(0, 1.48, 0.02);
      g.add(frameArch, frameBody, glass, crest);
    } else if (idNum === 282 || island.slug.includes('perfume')) {
      // Deco Perfume Bottle Trio on Mirrored Vanity Tray
      const tray = new THREE.Mesh(new THREE.CylinderGeometry(0.28, 0.28, 0.02, 12), mat(p3, { metalness: 0.9 }));
      tray.position.y = 0.01;
      // Octagonal crystal bottle with atomizer
      const bottle1 = new THREE.Mesh(new THREE.CylinderGeometry(0.05, 0.06, 0.12, 8), createGlassMat(p0, 0.7));
      bottle1.position.set(-0.1, 0.08, 0);
      const bulb = new THREE.Mesh(new THREE.SphereGeometry(0.035, 8, 6), mat(p2));
      bulb.position.set(-0.18, 0.08, 0);
      // Tall flacon with stopper
      const bottle2 = new THREE.Mesh(new THREE.BoxGeometry(0.07, 0.16, 0.07), createGlassMat(p1, 0.65));
      bottle2.position.set(0.08, 0.1, 0.04);
      const stopper = new THREE.Mesh(new THREE.OctahedronGeometry(0.03, 0), createGlassMat(p0, 0.6));
      stopper.position.set(0.08, 0.2, 0.04);
      g.add(tray, bottle1, bulb, bottle2, stopper);
    } else if (idNum === 283 || island.slug.includes('velvet-bench')) {
      // Channel-Tufted Velvet Bed-End Bench
      const benchPad = new THREE.Mesh(new THREE.BoxGeometry(1.1, 0.2, 0.42), mat(p0));
      benchPad.position.y = 0.38;
      // 4 tapered brass legs
      [[-0.45, -0.16], [0.45, -0.16], [-0.45, 0.16], [0.45, 0.16]].forEach(([lx, lz]) => {
        const leg = new THREE.Mesh(new THREE.CylinderGeometry(0.018, 0.028, 0.28, 6), mat(p2, { metalness: 0.85 }));
        leg.position.set(lx, 0.14, lz);
        g.add(leg);
      });
      g.add(benchPad);
    } else if (idNum === 284 || island.slug.includes('bedside-lamp')) {
      // Wabi-Sabi Ceramic Lamp with Pleated Shade
      const urn = new THREE.Mesh(new THREE.SphereGeometry(0.16, 10, 8), mat(p0));
      urn.position.y = 0.18;
      const shade = new THREE.Mesh(new THREE.ConeGeometry(0.24, 0.25, 16, 1, true), mat(p1));
      shade.position.y = 0.42;
      const glow = new THREE.Mesh(new THREE.SphereGeometry(0.05, 8, 6), mat(p3, { emissive: p3, emissiveIntensity: 1.2 }));
      glow.position.y = 0.38;
      g.add(urn, shade, glow);
    } else if (idNum === 285 || island.slug.includes('trinket-box') || island.slug.includes('malachite')) {
      // Malachite & Gilt-Bronze Antique Casket
      const box = new THREE.Mesh(new THREE.BoxGeometry(0.3, 0.14, 0.2), mat(p0));
      box.position.y = 0.1;
      const lid = new THREE.Mesh(new THREE.BoxGeometry(0.32, 0.04, 0.22), mat(p0));
      lid.position.y = 0.19;
      // Gilt feet
      [[-0.12, -0.08], [0.12, -0.08], [-0.12, 0.08], [0.12, 0.08]].forEach(([fx, fz]) => {
        const foot = new THREE.Mesh(new THREE.ConeGeometry(0.025, 0.04, 4), mat(p2, { metalness: 0.85 }));
        foot.position.set(fx, 0.02, fz);
        g.add(foot);
      });
      g.add(box, lid);
    } else if (idNum === 286 || island.slug.includes('mannequin')) {
      // Haute Couture Linen Dress Form Mannequin
      const stand = new THREE.Mesh(new THREE.CylinderGeometry(0.02, 0.03, 0.8, 6), mat(p1, { metalness: 0.8 }));
      stand.position.y = 0.4;
      // Tripod claw
      for (let l = 0; l < 3; l++) {
        const ang = (l * Math.PI * 2) / 3;
        const claw = new THREE.Mesh(new THREE.BoxGeometry(0.22, 0.025, 0.03), mat(p1, { metalness: 0.8 }));
        claw.rotation.y = ang;
        claw.position.set(Math.cos(ang) * 0.12, 0.02, Math.sin(ang) * 0.12);
        g.add(claw);
      }
      // Padded torso
      const hips = new THREE.Mesh(new THREE.CylinderGeometry(0.16, 0.18, 0.3, 8), mat(p0));
      hips.position.y = 0.95;
      const chest = new THREE.Mesh(new THREE.CylinderGeometry(0.2, 0.15, 0.35, 8), mat(p0));
      chest.position.y = 1.25;
      const neckCap = new THREE.Mesh(new THREE.CylinderGeometry(0.04, 0.05, 0.08, 6), mat(p2, { metalness: 0.85 }));
      neckCap.position.y = 1.46;
      g.add(stand, hips, chest, neckCap);
    } else if (idNum === 287 || island.slug.includes('candle-cluster')) {
      // Trio of Fluted Amber Glass Scented Candles
      const coaster = new THREE.Mesh(new THREE.CylinderGeometry(0.25, 0.25, 0.02, 12), mat(p3));
      coaster.position.y = 0.01;
      [
        [-0.08, 0.06, 0.18, 0.06],
        [0.08, 0.06, 0.14, 0.055],
        [0, -0.08, 0.22, 0.065],
      ].forEach(([cx, cz, ch, cr]) => {
        const jar = new THREE.Mesh(new THREE.CylinderGeometry(cr, cr, ch, 10), createGlassMat(p0, 0.7));
        jar.position.set(cx, ch / 2 + 0.02, cz);
        const wax = new THREE.Mesh(new THREE.CylinderGeometry(cr * 0.88, cr * 0.88, ch * 0.7, 8), mat(p1));
        wax.position.set(cx, (ch * 0.7) / 2 + 0.02, cz);
        const flame = new THREE.Mesh(new THREE.ConeGeometry(0.012, 0.03, 4), mat(p2, { emissive: p2, emissiveIntensity: 1.2 }));
        flame.position.set(cx, ch * 0.7 + 0.04, cz);
        g.add(jar, wax, flame);
      });
      g.add(coaster);
    } else if (idNum === 288 || island.slug.includes('macrame')) {
      // Hanging Macramé Plant Holder with Succulents
      const ring = new THREE.Mesh(new THREE.TorusGeometry(0.03, 0.008, 4, 8), mat(p0));
      ring.position.y = 1.35;
      // Cords
      for (let c = 0; c < 4; c++) {
        const ang = (c * Math.PI) / 2;
        const cord = new THREE.Mesh(new THREE.CylinderGeometry(0.006, 0.006, 0.7, 4), mat(p0));
        cord.position.set(Math.cos(ang) * 0.08, 0.95, Math.sin(ang) * 0.08);
        g.add(cord);
      }
      const pot = new THREE.Mesh(new THREE.CylinderGeometry(0.14, 0.1, 0.16, 10), mat(p1));
      pot.position.y = 0.6;
      // Trailing pearls
      const pearls = new THREE.Mesh(new THREE.SphereGeometry(0.15, 8, 6), mat(p2));
      pearls.position.y = 0.65;
      g.add(ring, pot, pearls);
    } else if (idNum === 289 || island.slug.includes('room-divider')) {
      // Three-Panel Cane Webbing Room Divider
      [-0.4, 0, 0.4].forEach((px, idx) => {
        const panel = new THREE.Mesh(new THREE.BoxGeometry(0.36, 1.3, 0.03), mat(p0));
        panel.rotation.y = idx === 1 ? -0.2 : 0.2;
        panel.position.set(px, 0.65, idx === 1 ? -0.06 : 0.06);
        const caneMesh = new THREE.Mesh(new THREE.BoxGeometry(0.3, 1.15, 0.01), mat(p1));
        caneMesh.rotation.y = panel.rotation.y;
        caneMesh.position.copy(panel.position);
        g.add(panel, caneMesh);
      });
    } else {
      // Hand-Woven Jute Blanket Basket & Cashmere Throw
      const basket = new THREE.Mesh(new THREE.CylinderGeometry(0.32, 0.28, 0.34, 12), mat(p0));
      basket.position.y = 0.17;
      const throwBlanket = new THREE.Mesh(new THREE.SphereGeometry(0.26, 10, 8), mat(p1));
      throwBlanket.position.set(0, 0.28, 0);
      const spillingHem = new THREE.Mesh(new THREE.BoxGeometry(0.2, 0.15, 0.08), mat(p1));
      spillingHem.rotation.x = 0.4;
      spillingHem.position.set(0, 0.22, 0.22);
      g.add(basket, throwBlanket, spillingHem);
    }
  }

  // -----------------------------------------------------------------------
  // Series E (OB-291 to OB-300): Indoor Botanicals & Zen Greenery
  // -----------------------------------------------------------------------
  else {
    if (idNum === 291 || island.slug.includes('fiddle-leaf-fig')) {
      // Architectural Fiddle-Leaf Fig in Terrazzo Pot
      const pot = new THREE.Mesh(new THREE.CylinderGeometry(0.26, 0.22, 0.45, 12), mat(p2));
      pot.position.y = 0.225;
      const trunk = new THREE.Mesh(new THREE.CylinderGeometry(0.03, 0.045, 1.2, 6), mat(p1));
      trunk.position.y = 0.85;
      // Broad violin leaves
      for (let l = 0; l < 8; l++) {
        const ly = 0.7 + l * 0.14;
        const lang = l * 1.6;
        const leaf = new THREE.Mesh(new THREE.CylinderGeometry(0.18, 0.08, 0.015, 6), mat(p0));
        leaf.rotation.y = lang;
        leaf.rotation.z = 0.4;
        leaf.position.set(Math.cos(lang) * 0.18, ly, Math.sin(lang) * 0.18);
        g.add(leaf);
      }
      g.add(pot, trunk);
    } else if (idNum === 292 || island.slug.includes('bonsai')) {
      // Ancient Shimpaku Juniper Bonsai on Burl Stand
      const pot = new THREE.Mesh(new THREE.BoxGeometry(0.42, 0.08, 0.28), mat(p3));
      pot.position.y = 0.04;
      // Contorted trunk
      const trunk1 = new THREE.Mesh(new THREE.CylinderGeometry(0.05, 0.07, 0.25, 6), mat(p2));
      trunk1.position.set(0, 0.15, 0);
      const trunk2 = new THREE.Mesh(new THREE.CylinderGeometry(0.03, 0.05, 0.3, 6), mat(p2));
      trunk2.rotation.z = 0.6;
      trunk2.position.set(0.1, 0.26, 0);
      // Deadwood Jin
      const jin = new THREE.Mesh(new THREE.ConeGeometry(0.02, 0.22, 4), mat(p1));
      jin.rotation.z = -0.4;
      jin.position.set(-0.06, 0.32, 0);
      // Needle cloud foliage pads
      [[0.24, 0.36, 0], [0.12, 0.42, 0.08], [0.32, 0.45, -0.06]].forEach(([px, py, pz]) => {
        const cloud = new THREE.Mesh(new THREE.SphereGeometry(0.11, 8, 6), mat(p0));
        cloud.scale.set(1.4, 0.4, 1.0);
        cloud.position.set(px, py, pz);
        g.add(cloud);
      });
      g.add(pot, trunk1, trunk2, jin);
    } else if (idNum === 293 || island.slug.includes('tiered-water-fountain')) {
      // Tiered Slate Water Fountain with Basin
      const basin = new THREE.Mesh(new THREE.CylinderGeometry(0.28, 0.3, 0.12, 10), mat(p0));
      basin.position.y = 0.06;
      [-0.08, 0.04, 0.16].forEach((sy, idx) => {
        const step = new THREE.Mesh(new THREE.BoxGeometry(0.24 - idx * 0.04, 0.03, 0.2 - idx * 0.03), mat(p0));
        step.position.set(idx * 0.04, 0.12 + idx * 0.1, 0);
        const waterSheet = new THREE.Mesh(new THREE.PlaneGeometry(0.16, 0.08), mat(p1, { roughness: 0.1 }));
        waterSheet.rotation.x = Math.PI / 2;
        waterSheet.position.set(idx * 0.04, 0.14 + idx * 0.1, 0);
        g.add(step, waterSheet);
      });
      g.add(basin);
    } else if (idNum === 294 || island.slug.includes('terrarium')) {
      // Faceted Glass Terrarium with Succulents
      const baseGlass = new THREE.Mesh(new THREE.DodecahedronGeometry(0.24, 0), createGlassMat(p0, 0.55));
      baseGlass.position.y = 0.24;
      // Soil stratum inside
      const soil = new THREE.Mesh(new THREE.CylinderGeometry(0.16, 0.18, 0.1, 8), mat(p3));
      soil.position.y = 0.14;
      // Succulent rosettes
      const succulent = new THREE.Mesh(new THREE.DodecahedronGeometry(0.09, 1), mat(p2));
      succulent.position.y = 0.24;
      g.add(baseGlass, soil, succulent);
    } else if (idNum === 295 || island.slug.includes('shishi-odoshi')) {
      // Japanese Shishi-Odoshi Bamboo Rocker & Anvil Stone
      const trough = new THREE.Mesh(new THREE.BoxGeometry(0.45, 0.12, 0.32), mat(p2));
      trough.position.y = 0.06;
      const anvilStone = new THREE.Mesh(new THREE.DodecahedronGeometry(0.08, 1), mat(p1));
      anvilStone.position.set(-0.1, 0.1, 0);
      const post = new THREE.Mesh(new THREE.CylinderGeometry(0.02, 0.02, 0.35, 6), mat(p0));
      post.position.set(0.08, 0.2, 0);
      const rocker = new THREE.Mesh(new THREE.CylinderGeometry(0.02, 0.025, 0.38, 6), mat(p0));
      rocker.rotation.z = -0.4;
      rocker.position.set(0.04, 0.28, 0);
      g.add(trough, anvilStone, post, rocker);
    } else if (idNum === 296 || island.slug.includes('fire-pit') || island.slug.includes('fire-table')) {
      // Monolithic Slate Bioethanol Fire Table
      const table = new THREE.Mesh(new THREE.BoxGeometry(0.95, 0.22, 0.55), mat(p0));
      table.position.y = 0.11;
      const burnerTrough = new THREE.Mesh(new THREE.BoxGeometry(0.65, 0.04, 0.18), mat(p2));
      burnerTrough.position.y = 0.22;
      const flame = new THREE.Mesh(new THREE.ConeGeometry(0.06, 0.18, 6), mat(p1, { emissive: p1, emissiveIntensity: 1.2 }));
      flame.scale.set(4.0, 1.0, 1.0);
      flame.position.set(0, 0.31, 0);
      g.add(table, burnerTrough, flame);
    } else if (idNum === 297 || island.slug.includes('kokedama')) {
      // Suspended Duo of Living Kokedama Moss Balls
      [[-0.14, 0.8, 0.14, p0], [0.14, 0.55, 0.11, p0]].forEach(([kx, ky, kr, kCol]) => {
        const wire = new THREE.Mesh(new THREE.CylinderGeometry(0.004, 0.004, 0.6, 4), mat('#A16207'));
        wire.position.set(kx as number, (ky as number) + 0.3, 0);
        const mossBall = new THREE.Mesh(new THREE.SphereGeometry(kr as number, 10, 8), mat(kCol as string));
        mossBall.position.set(kx as number, ky as number, 0);
        const fern = new THREE.Mesh(new THREE.ConeGeometry(0.12, 0.2, 5), mat(p2));
        fern.position.set(kx as number, (ky as number) + (kr as number) + 0.08, 0);
        g.add(wire, mossBall, fern);
      });
    } else if (idNum === 298 || island.slug.includes('bird-paradise')) {
      // Giant Bird of Paradise in Fluted Travertine Planter
      const urn = new THREE.Mesh(new THREE.CylinderGeometry(0.3, 0.24, 0.55, 12), mat(p3));
      urn.position.y = 0.275;
      for (let f = 0; f < 5; f++) {
        const ang = (f * Math.PI * 2) / 5;
        const stem = new THREE.Mesh(new THREE.CylinderGeometry(0.02, 0.03, 0.9, 4), mat(p0));
        stem.rotation.z = Math.sin(ang) * 0.3;
        stem.rotation.x = Math.cos(ang) * 0.3;
        stem.position.set(Math.cos(ang) * 0.1, 0.85, Math.sin(ang) * 0.1);
        const frond = new THREE.Mesh(new THREE.BoxGeometry(0.24, 0.5, 0.02), mat(p0));
        frond.rotation.y = ang;
        frond.rotation.z = 0.4;
        frond.position.set(Math.cos(ang) * 0.32, 1.25, Math.sin(ang) * 0.32);
        g.add(stem, frond);
      }
      const flower = new THREE.Mesh(new THREE.ConeGeometry(0.06, 0.22, 4), mat(p1));
      flower.position.set(0.12, 1.35, 0);
      g.add(urn, flower);
    } else if (idNum === 299 || island.slug.includes('moss-wall')) {
      // Reindeer Moss Wall Art Panel with Edge Light
      const frame = new THREE.Mesh(new THREE.BoxGeometry(0.85, 0.85, 0.06), mat(p2));
      frame.position.set(0, 0.55, 0);
      const mossRelief = new THREE.Mesh(new THREE.BoxGeometry(0.78, 0.78, 0.08), mat(p0));
      mossRelief.position.set(0, 0.55, 0.02);
      const halo = new THREE.Mesh(new THREE.BoxGeometry(0.82, 0.82, 0.01), mat(p3, { emissive: p3, emissiveIntensity: 0.8 }));
      halo.position.set(0, 0.55, -0.01);
      g.add(frame, mossRelief, halo);
    } else {
      // Modernist Hydroponic Glass Floating Herb Station
      const rail = new THREE.Mesh(new THREE.BoxGeometry(0.65, 0.06, 0.08), mat(p1, { metalness: 0.85 }));
      rail.position.set(0, 0.35, 0);
      for (let t = -0.25; t <= 0.25; t += 0.1) {
        const tube = new THREE.Mesh(new THREE.CylinderGeometry(0.025, 0.025, 0.26, 8), createGlassMat(p0, 0.7));
        tube.position.set(t, 0.3, 0);
        const herb = new THREE.Mesh(new THREE.SphereGeometry(0.045, 6, 4), mat(p2));
        herb.position.set(t, 0.46, 0);
        g.add(tube, herb);
      }
      g.add(rail);
    }
  }

  return g;
}

// =========================================================================
// 2. OUTDOOR DECORATIVE OBJECTS BUILDER (OB-301 to OB-350)
// Pure Standalone Objects: Zero artificial display pedestals. Sits directly on lawn/ground.
// =========================================================================
export function buildOutdoorDecorScene(
  island: IslandMetadata,
  variant: IslandVariant
): THREE.Group {
  const g = new THREE.Group();

  const p0 = island.palette[0]?.hex || '#E7E5E4';
  const p1 = island.palette[1]?.hex || '#CA8A04';
  const p2 = island.palette[2]?.hex || '#A8A29E';
  const p3 = island.palette[3]?.hex || '#1C1917';

  const idNum = parseInt(island.id.replace('OB-', ''), 10);

  // -----------------------------------------------------------------------
  // Series A (OB-301 to OB-310): Garden & Park Sculptural Accents
  // -----------------------------------------------------------------------
  if (idNum <= 310) {
    if (idNum === 301 || island.slug.includes('sundial')) {
      // Classical Carved Limestone Sundial on Fluted Pillar
      const colBase = new THREE.Mesh(new THREE.CylinderGeometry(0.24, 0.28, 0.16, 8), mat(p0));
      colBase.position.y = 0.08;
      const column = new THREE.Mesh(new THREE.CylinderGeometry(0.14, 0.16, 0.85, 12), mat(p0));
      column.position.y = 0.58;
      const dialPlate = new THREE.Mesh(new THREE.CylinderGeometry(0.26, 0.26, 0.06, 12), mat(p1, { metalness: 0.75 }));
      dialPlate.position.y = 1.03;
      // Triangular bronze gnomon
      const gnomon = new THREE.Mesh(new THREE.ConeGeometry(0.12, 0.18, 3), mat(p1, { metalness: 0.85 }));
      gnomon.rotation.z = -Math.PI / 4;
      gnomon.position.set(0.04, 1.12, 0);
      g.add(colBase, column, dialPlate, gnomon);
    } else if (idNum === 302 || island.slug.includes('lion-fountain')) {
      // Cast Stone Tiered Lion Fountain
      const lowerPool = new THREE.Mesh(new THREE.CylinderGeometry(0.65, 0.7, 0.22, 12), mat(p0));
      lowerPool.position.y = 0.11;
      const midStem = new THREE.Mesh(new THREE.CylinderGeometry(0.15, 0.2, 0.65, 8), mat(p0));
      midStem.position.y = 0.54;
      const upperBowl = new THREE.Mesh(new THREE.CylinderGeometry(0.38, 0.25, 0.18, 10), mat(p0));
      upperBowl.position.y = 0.95;
      const waterTop = new THREE.Mesh(new THREE.CylinderGeometry(0.36, 0.36, 0.02, 10), mat(p1, { roughness: 0.1 }));
      waterTop.position.y = 1.02;
      // 4 Lion masks
      for (let l = 0; l < 4; l++) {
        const ang = (l * Math.PI) / 2;
        const lion = new THREE.Mesh(new THREE.BoxGeometry(0.08, 0.1, 0.08), mat(p0));
        lion.position.set(Math.cos(ang) * 0.22, 0.92, Math.sin(ang) * 0.22);
        g.add(lion);
      }
      g.add(lowerPool, midStem, upperBowl, waterTop);
    } else if (idNum === 303 || island.slug.includes('rose-arbor')) {
      // Victorian Wrought-Iron Rose Arbor Gazebo Arch
      const archTop = new THREE.Mesh(new THREE.TorusGeometry(0.55, 0.04, 6, 12, Math.PI), mat(p0, { metalness: 0.8 }));
      archTop.position.set(0, 1.45, 0);
      [-0.55, 0.55].forEach((ax) => {
        const post = new THREE.Mesh(new THREE.CylinderGeometry(0.04, 0.04, 1.45, 6), mat(p0, { metalness: 0.8 }));
        post.position.set(ax, 0.725, 0);
        g.add(post);
      });
      // Climbing red roses & green vine clusters
      for (let r = 0; r < 8; r++) {
        const rx = -0.55 + (r / 7) * 1.1;
        const ry = 0.4 + Math.sin((r / 7) * Math.PI) * 1.1;
        const rose = new THREE.Mesh(new THREE.DodecahedronGeometry(0.065, 0), mat(p1));
        rose.position.set(rx, ry, (r % 2 === 0 ? 0.05 : -0.05));
        const leaf = new THREE.Mesh(new THREE.SphereGeometry(0.08, 6, 4), mat(p2));
        leaf.position.set(rx + 0.03, ry - 0.04, 0);
        g.add(rose, leaf);
      }
      g.add(archTop);
    } else if (idNum === 304 || island.slug.includes('birdbath')) {
      // Carved River Granite Birdbath with Bronze Sparrows
      const rockBase = new THREE.Mesh(new THREE.DodecahedronGeometry(0.38, 1), mat(p0));
      rockBase.scale.set(1.0, 1.4, 1.0);
      rockBase.position.y = 0.38;
      const bowl = new THREE.Mesh(new THREE.CylinderGeometry(0.35, 0.22, 0.12, 10), mat(p0));
      bowl.position.y = 0.75;
      const waterPool = new THREE.Mesh(new THREE.CylinderGeometry(0.32, 0.32, 0.02, 10), mat(p1, { roughness: 0.1 }));
      waterPool.position.y = 0.79;
      // Twin sparrows
      [0.25, -0.25].forEach((bx) => {
        const sparrow = new THREE.Mesh(new THREE.SphereGeometry(0.04, 6, 4), mat(p2, { metalness: 0.7 }));
        sparrow.position.set(bx, 0.84, 0);
        g.add(sparrow);
      });
      g.add(rockBase, bowl, waterPool);
    } else if (idNum === 305 || island.slug.includes('wind-spinner')) {
      // Double-Helix Kinetic Wind Spinner Sculpture
      const pole = new THREE.Mesh(new THREE.CylinderGeometry(0.025, 0.03, 1.8, 6), mat(p2, { metalness: 0.85 }));
      pole.position.y = 0.9;
      // Dual counter-rotating helix spiral vanes
      for (let s = 0; s < 10; s++) {
        const sy = 1.1 + s * 0.08;
        const ang = s * 0.6;
        const bladeL = new THREE.Mesh(new THREE.BoxGeometry(0.24, 0.03, 0.015), mat(p0, { metalness: 0.75 }));
        bladeL.rotation.y = ang;
        bladeL.position.set(0, sy, 0);
        const bladeR = new THREE.Mesh(new THREE.BoxGeometry(0.24, 0.03, 0.015), mat(p1, { metalness: 0.75 }));
        bladeR.rotation.y = -ang;
        bladeR.position.set(0, sy, 0);
        g.add(bladeL, bladeR);
      }
      g.add(pole);
    } else if (idNum === 306 || island.slug.includes('cranes')) {
      // Pair of Life-Sized Patinated Bronze Cranes
      // Crane 1: Standing tall, head raised
      const body1 = new THREE.Mesh(new THREE.ConeGeometry(0.12, 0.35, 6), mat(p0, { metalness: 0.7 }));
      body1.position.set(-0.2, 0.7, 0);
      const neck1 = new THREE.Mesh(new THREE.CylinderGeometry(0.02, 0.03, 0.45, 6), mat(p0, { metalness: 0.7 }));
      neck1.position.set(-0.16, 1.05, 0);
      const legs1 = new THREE.Mesh(new THREE.CylinderGeometry(0.012, 0.015, 0.6, 4), mat(p2));
      legs1.position.set(-0.2, 0.3, 0);
      // Crane 2: Bowing to preen
      const body2 = new THREE.Mesh(new THREE.ConeGeometry(0.12, 0.35, 6), mat(p1, { metalness: 0.7 }));
      body2.rotation.z = Math.PI / 4;
      body2.position.set(0.22, 0.58, 0);
      const legs2 = new THREE.Mesh(new THREE.CylinderGeometry(0.012, 0.015, 0.5, 4), mat(p2));
      legs2.position.set(0.22, 0.25, 0);
      g.add(body1, neck1, legs1, body2, legs2);
    } else if (idNum === 307 || island.slug.includes('park-bench')) {
      // Heritage Cast-Iron & Oak Slatted Park Bench
      [-0.55, 0.55].forEach((bx) => {
        const sideFrame = new THREE.Mesh(new THREE.BoxGeometry(0.06, 0.65, 0.5), mat(p0, { metalness: 0.85 }));
        sideFrame.position.set(bx, 0.325, 0);
        g.add(sideFrame);
      });
      // Contoured oak slats
      for (let s = 0; s < 5; s++) {
        const seatSlat = new THREE.Mesh(new THREE.BoxGeometry(1.15, 0.025, 0.06), mat(p1));
        seatSlat.position.set(0, 0.35, -0.15 + s * 0.08);
        g.add(seatSlat);
      }
      for (let b = 0; b < 4; b++) {
        const backSlat = new THREE.Mesh(new THREE.BoxGeometry(1.15, 0.05, 0.025), mat(p1));
        backSlat.position.set(0, 0.45 + b * 0.08, -0.2);
        g.add(backSlat);
      }
    } else if (idNum === 308 || island.slug.includes('grotto')) {
      // Rustic Fieldstone Grotto Water Basin with Lotus
      const stoneWall = new THREE.Mesh(new THREE.CylinderGeometry(0.55, 0.6, 0.28, 8), mat(p0));
      stoneWall.position.y = 0.14;
      const water = new THREE.Mesh(new THREE.CylinderGeometry(0.48, 0.48, 0.04, 8), mat(p1, { roughness: 0.1 }));
      water.position.y = 0.22;
      const lilyPad = new THREE.Mesh(new THREE.CylinderGeometry(0.12, 0.12, 0.01, 6), mat(p2));
      lilyPad.position.set(0.1, 0.24, 0.1);
      const lotus = new THREE.Mesh(new THREE.ConeGeometry(0.05, 0.08, 5), mat(p3));
      lotus.position.set(0.1, 0.28, 0.1);
      g.add(stoneWall, water, lilyPad, lotus);
    } else if (idNum === 309 || island.slug.includes('medici-urn') || island.slug.includes('garden-urn')) {
      // Fluted Medici Cast-Iron Urn with Cascading Ivy
      const ped = new THREE.Mesh(new THREE.BoxGeometry(0.36, 0.35, 0.36), mat(p0));
      ped.position.y = 0.175;
      const urnBody = new THREE.Mesh(new THREE.CylinderGeometry(0.38, 0.18, 0.45, 12), mat(p0, { metalness: 0.7 }));
      urnBody.position.y = 0.55;
      // Cascading ivy tendrils
      for (let i = 0; i < 6; i++) {
        const ang = (i * Math.PI * 2) / 6;
        const ivy = new THREE.Mesh(new THREE.CylinderGeometry(0.03, 0.01, 0.35, 4), mat(p1));
        ivy.rotation.z = Math.sin(ang) * 0.6;
        ivy.position.set(Math.cos(ang) * 0.32, 0.45, Math.sin(ang) * 0.32);
        g.add(ivy);
      }
      g.add(ped, urnBody);
    } else {
      // Formal Spiral Topiary Cypress in Tuscan Terracotta Urn
      const pot = new THREE.Mesh(new THREE.CylinderGeometry(0.26, 0.18, 0.38, 10), mat(p1));
      pot.position.y = 0.19;
      // Spiral topiary cone
      for (let t = 0; t < 12; t++) {
        const ty = 0.4 + t * 0.09;
        const tr = 0.22 * (1 - t / 13);
        const ang = t * 0.8;
        const spiralNode = new THREE.Mesh(new THREE.SphereGeometry(tr, 6, 4), mat(p0));
        spiralNode.position.set(Math.cos(ang) * 0.05, ty, Math.sin(ang) * 0.05);
        g.add(spiralNode);
      }
      g.add(pot);
    }
  }

  // -----------------------------------------------------------------------
  // Series B (OB-311 to OB-320): Courtyard, Patio & Terraces
  // -----------------------------------------------------------------------
  else if (idNum <= 320) {
    if (idNum === 311 || island.slug.includes('fire-pit')) {
      // Circular Architectural Concrete Fire Bowl
      const bowl = new THREE.Mesh(new THREE.CylinderGeometry(0.55, 0.45, 0.25, 14), mat(p0));
      bowl.position.y = 0.125;
      const lavaRock = new THREE.Mesh(new THREE.CylinderGeometry(0.45, 0.45, 0.06, 12), mat(p2));
      lavaRock.position.y = 0.22;
      // Flame ring
      for (let f = 0; f < 6; f++) {
        const ang = (f * Math.PI * 2) / 6;
        const flame = new THREE.Mesh(new THREE.ConeGeometry(0.05, 0.18, 5), mat(p1, { emissive: p1, emissiveIntensity: 1.2 }));
        flame.position.set(Math.cos(ang) * 0.24, 0.32, Math.sin(ang) * 0.24);
        g.add(flame);
      }
      g.add(bowl, lavaRock);
    } else if (idNum === 312 || island.slug.includes('adirondack')) {
      // Solid Teak Adirondack Lounger & Side Table
      const seat = new THREE.Mesh(new THREE.BoxGeometry(0.55, 0.04, 0.5), mat(p0));
      seat.rotation.x = -0.18;
      seat.position.set(0, 0.26, 0.05);
      const back = new THREE.Mesh(new THREE.BoxGeometry(0.5, 0.65, 0.04), mat(p0));
      back.rotation.x = -0.45;
      back.position.set(0, 0.58, -0.2);
      // Flat paddle arms
      [-0.32, 0.32].forEach((ax) => {
        const arm = new THREE.Mesh(new THREE.BoxGeometry(0.12, 0.03, 0.55), mat(p0));
        arm.position.set(ax, 0.42, 0);
        g.add(arm);
      });
      // Low companion side table
      const sideTable = new THREE.Mesh(new THREE.CylinderGeometry(0.18, 0.18, 0.28, 8), mat(p1));
      sideTable.position.set(0.55, 0.14, 0.1);
      g.add(seat, back, sideTable);
    } else if (idNum === 313 || island.slug.includes('umbrella')) {
      // Cantilevered Architectural Patio Umbrella
      const graniteBase = new THREE.Mesh(new THREE.BoxGeometry(0.55, 0.12, 0.55), mat(p2));
      graniteBase.position.set(-0.4, 0.06, 0);
      const mast = new THREE.Mesh(new THREE.CylinderGeometry(0.04, 0.04, 1.8, 8), mat(p1, { metalness: 0.85 }));
      mast.position.set(-0.4, 0.95, 0);
      const boom = new THREE.Mesh(new THREE.BoxGeometry(0.85, 0.04, 0.04), mat(p1, { metalness: 0.85 }));
      boom.position.set(0, 1.85, 0);
      // Octagonal canopy
      const canopy = new THREE.Mesh(new THREE.ConeGeometry(0.8, 0.25, 8), mat(p0));
      canopy.position.set(0.35, 1.72, 0);
      g.add(graniteBase, mast, boom, canopy);
    } else if (idNum === 314 || island.slug.includes('hammock')) {
      // Curved Timber Arc Stand with Rope Hammock
      const arcCurve = new THREE.CatmullRomCurve3([
        new THREE.Vector3(-0.75, 0.55, 0),
        new THREE.Vector3(0, 0.05, 0),
        new THREE.Vector3(0.75, 0.55, 0),
      ]);
      const arcMesh = new THREE.Mesh(new THREE.TubeGeometry(arcCurve, 16, 0.04, 6, false), mat(p0));
      // Cross feet
      [-0.45, 0.45].forEach((fx) => {
        const foot = new THREE.Mesh(new THREE.BoxGeometry(0.08, 0.04, 0.5), mat(p0));
        foot.position.set(fx, 0.02, 0);
        g.add(foot);
      });
      // Suspended hammock bed
      const hammockBed = new THREE.Mesh(new THREE.CylinderGeometry(0.28, 0.32, 0.95, 8, 1, true, 0, Math.PI), mat(p1));
      hammockBed.rotation.z = Math.PI / 2;
      hammockBed.position.set(0, 0.35, 0);
      g.add(arcMesh, hammockBed);
    } else if (idNum === 315 || island.slug.includes('daybed')) {
      // Teak Four-Poster Daybed with Sheer Curtains
      const bedBase = new THREE.Mesh(new THREE.BoxGeometry(1.1, 0.2, 0.85), mat(p0));
      bedBase.position.y = 0.2;
      const mattress = new THREE.Mesh(new THREE.BoxGeometry(1.05, 0.12, 0.8), mat(p2));
      mattress.position.y = 0.34;
      // 4 Posts & Canopy Frame
      [[-0.5, -0.38], [0.5, -0.38], [-0.5, 0.38], [0.5, 0.38]].forEach(([px, pz]) => {
        const post = new THREE.Mesh(new THREE.BoxGeometry(0.05, 1.4, 0.05), mat(p0));
        post.position.set(px, 0.7, pz);
        g.add(post);
      });
      const topFrame = new THREE.Mesh(new THREE.BoxGeometry(1.1, 0.04, 0.85), mat(p0, { wireframe: true }));
      topFrame.position.y = 1.4;
      g.add(bedBase, mattress, topFrame);
    } else if (idNum === 316 || island.slug.includes('pizza-oven')) {
      // Artisan Wood-Fired Stone Pizza Oven
      const plinth = new THREE.Mesh(new THREE.BoxGeometry(0.75, 0.45, 0.75), mat(p1));
      plinth.position.y = 0.225;
      const dome = new THREE.Mesh(new THREE.SphereGeometry(0.35, 12, 8, 0, Math.PI * 2, 0, Math.PI / 2), mat(p0));
      dome.position.y = 0.45;
      // Arch opening & red glowing hearth
      const arch = new THREE.Mesh(new THREE.TorusGeometry(0.14, 0.03, 6, 8, Math.PI), mat(p2));
      arch.position.set(0, 0.52, 0.34);
      const fireGlow = new THREE.Mesh(new THREE.SphereGeometry(0.08, 6, 4), mat(p3, { emissive: p3, emissiveIntensity: 1.2 }));
      fireGlow.position.set(0, 0.48, 0.18);
      // Chimney
      const flue = new THREE.Mesh(new THREE.CylinderGeometry(0.05, 0.05, 0.4, 8), mat('#334155', { metalness: 0.8 }));
      flue.position.set(0, 0.95, 0.18);
      g.add(plinth, dome, arch, fireGlow, flue);
    } else if (idNum === 317 || island.slug.includes('corten')) {
      // Corten Steel Monolithic Water Wall
      const wall = new THREE.Mesh(new THREE.BoxGeometry(0.75, 1.4, 0.12), mat(p0));
      wall.position.y = 0.7;
      const waterSheet = new THREE.Mesh(new THREE.PlaneGeometry(0.55, 1.2), mat(p1, { roughness: 0.15 }));
      waterSheet.position.set(0, 0.7, 0.065);
      const pebbleBasin = new THREE.Mesh(new THREE.BoxGeometry(0.85, 0.14, 0.35), mat(p2));
      pebbleBasin.position.set(0, 0.07, 0.1);
      g.add(wall, waterSheet, pebbleBasin);
    } else if (idNum === 318 || island.slug.includes('rattan-conversation-set')) {
      // Curved Modular Wicker Sofa & Round Coffee Table
      const curvedSofa = new THREE.Mesh(new THREE.CylinderGeometry(0.65, 0.7, 0.4, 12, 1, false, 0, Math.PI), mat(p0));
      curvedSofa.rotation.y = -Math.PI / 2;
      curvedSofa.position.set(0, 0.25, -0.15);
      const coffeeTable = new THREE.Mesh(new THREE.CylinderGeometry(0.28, 0.3, 0.22, 10), mat(p1));
      coffeeTable.position.set(0, 0.11, 0.2);
      g.add(curvedSofa, coffeeTable);
    } else if (idNum === 319 || island.slug.includes('lantern') || island.slug.includes('sconce')) {
      // Post-Mounted Brass Gaslight Lantern
      const post = new THREE.Mesh(new THREE.CylinderGeometry(0.05, 0.07, 1.3, 8), mat(p3));
      post.position.y = 0.65;
      const lanternHouse = new THREE.Mesh(new THREE.CylinderGeometry(0.16, 0.12, 0.28, 4), mat(p0, { metalness: 0.85, wireframe: true }));
      lanternHouse.rotation.y = Math.PI / 4;
      lanternHouse.position.y = 1.38;
      const gasFlame = new THREE.Mesh(new THREE.ConeGeometry(0.03, 0.09, 4), mat(p2, { emissive: p2, emissiveIntensity: 1.2 }));
      gasFlame.position.y = 1.36;
      g.add(post, lanternHouse, gasFlame);
    } else {
      // Tiered Cedar Kitchen Herb Planter Trough
      [0.15, 0.38, 0.62].forEach((ty, idx) => {
        const trough = new THREE.Mesh(new THREE.BoxGeometry(0.7, 0.12, 0.18), mat(p0));
        trough.position.set(0, ty, idx * 0.14 - 0.14);
        const herbFoliage = new THREE.Mesh(new THREE.BoxGeometry(0.64, 0.08, 0.14), mat(p1));
        herbFoliage.position.set(0, ty + 0.08, idx * 0.14 - 0.14);
        g.add(trough, herbFoliage);
      });
      // A-Frame legs
      [-0.36, 0.36].forEach((lx) => {
        const leg = new THREE.Mesh(new THREE.BoxGeometry(0.04, 0.75, 0.06), mat(p0));
        leg.position.set(lx, 0.375, 0);
        g.add(leg);
      });
    }
  }

  // -----------------------------------------------------------------------
  // Series C (OB-321 to OB-330): Pathways, Plaza & Urban Landscape
  // -----------------------------------------------------------------------
  else if (idNum <= 330) {
    if (idNum === 321 || island.slug.includes('parisian-lamp')) {
      // Parisian Belle Époque Double Cast-Iron Streetlamp
      const column = new THREE.Mesh(new THREE.CylinderGeometry(0.06, 0.1, 1.8, 10), mat(p0, { metalness: 0.75 }));
      column.position.y = 0.9;
      // Twin lyre arms
      [-0.32, 0.32].forEach((lx) => {
        const arm = new THREE.Mesh(new THREE.TorusGeometry(0.18, 0.02, 6, 8, Math.PI), mat(p0, { metalness: 0.75 }));
        arm.position.set(lx, 1.75, 0);
        const globe = new THREE.Mesh(new THREE.SphereGeometry(0.1, 10, 8), mat(p1, { emissive: p1, emissiveIntensity: 0.9 }));
        globe.position.set(lx * 1.5, 1.75, 0);
        g.add(arm, globe);
      });
      g.add(column);
    } else if (idNum === 322 || island.slug.includes('bollards')) {
      // Row of Architectural Concrete LED Bollards
      [-0.4, 0, 0.4].forEach((bx) => {
        const bollard = new THREE.Mesh(new THREE.BoxGeometry(0.14, 0.55, 0.14), mat(p0));
        bollard.position.set(bx, 0.275, 0);
        const louver = new THREE.Mesh(new THREE.BoxGeometry(0.12, 0.04, 0.02), mat(p1, { emissive: p1, emissiveIntensity: 1.0 }));
        louver.position.set(bx, 0.45, 0.075);
        g.add(bollard, louver);
      });
    } else if (idNum === 323 || island.slug.includes('plaza-sculpture') || island.slug.includes('monolith')) {
      // Stainless Steel Möbius Ribbon Plaza Sculpture on Granite Base
      const stoneDisc = new THREE.Mesh(new THREE.CylinderGeometry(0.65, 0.7, 0.14, 16), mat(p2));
      stoneDisc.position.y = 0.07;
      const mobius = new THREE.Mesh(new THREE.TorusKnotGeometry(0.42, 0.08, 32, 8, 2, 3), mat(p0, { metalness: 0.95, roughness: 0.1 }));
      mobius.position.y = 0.85;
      g.add(stoneDisc, mobius);
    } else if (idNum === 324 || island.slug.includes('steles')) {
      // Trio of Weathered Granite Monolithic Steles
      const gravelBed = new THREE.Mesh(new THREE.CylinderGeometry(0.6, 0.6, 0.02, 12), mat(p2));
      gravelBed.position.y = 0.01;
      [
        [-0.2, 0.6, 0.14, 1.2],
        [0.15, 0.45, 0.16, 0.9],
        [-0.02, 0.32, 0.12, 0.65],
      ].forEach(([sx, sy, sw, sh]) => {
        const stele = new THREE.Mesh(new THREE.BoxGeometry(sw, sh, sw * 0.7), mat(p0));
        stele.position.set(sx, sh / 2 + 0.02, (sx as number) * 0.3);
        g.add(stele);
      });
      g.add(gravelBed);
    } else if (idNum === 325 || island.slug.includes('tree-guard')) {
      // Radial Cast-Iron Tree Grate & Cage with Sapling
      const grate = new THREE.Mesh(new THREE.CylinderGeometry(0.55, 0.55, 0.02, 16), mat(p0, { metalness: 0.8 }));
      grate.position.y = 0.01;
      const cage = new THREE.Mesh(new THREE.CylinderGeometry(0.18, 0.22, 1.2, 8, 1, true), mat(p0, { metalness: 0.8, wireframe: true }));
      cage.position.y = 0.61;
      // Sapling tree trunk & crown
      const trunk = new THREE.Mesh(new THREE.CylinderGeometry(0.03, 0.04, 1.6, 6), mat(p2));
      trunk.position.y = 0.8;
      const crown = new THREE.Mesh(new THREE.SphereGeometry(0.28, 8, 6), mat(p1));
      crown.position.y = 1.7;
      g.add(grate, cage, trunk, crown);
    } else if (idNum === 326 || island.slug.includes('drinking-fountain')) {
      // Park Dual-Height Drinking Fountain
      const column = new THREE.Mesh(new THREE.CylinderGeometry(0.08, 0.1, 0.9, 8), mat(p0));
      column.position.y = 0.45;
      const adultBowl = new THREE.Mesh(new THREE.CylinderGeometry(0.14, 0.1, 0.08, 10), mat(p1, { metalness: 0.9 }));
      adultBowl.position.set(0, 0.9, 0.15);
      const childBowl = new THREE.Mesh(new THREE.CylinderGeometry(0.12, 0.08, 0.06, 10), mat(p1, { metalness: 0.9 }));
      childBowl.position.set(-0.2, 0.65, 0);
      g.add(column, adultBowl, childBowl);
    } else if (idNum === 327 || island.slug.includes('trail-sign') || island.slug.includes('signpost')) {
      // Cedar Trail Signpost with Directional Chevron Arms
      const post = new THREE.Mesh(new THREE.CylinderGeometry(0.06, 0.08, 1.6, 6), mat(p0));
      post.position.y = 0.8;
      // Staggered chevron arrows
      [
        [0.2, 1.4, 0.3, p1],
        [-0.2, 1.25, -0.3, p1],
        [0.2, 1.1, 0.8, p1],
      ].forEach(([ax, ay, aRot, aCol]) => {
        const arrow = new THREE.Mesh(new THREE.BoxGeometry(0.35, 0.08, 0.03), mat(aCol as string));
        arrow.rotation.y = aRot as number;
        arrow.position.set(ax as number, ay as number, 0);
        g.add(arrow);
      });
      g.add(post);
    } else if (idNum === 328 || island.slug.includes('planter-bench')) {
      // Circular Concrete Planter with Cantilevered Bench & Maple
      const planterTub = new THREE.Mesh(new THREE.CylinderGeometry(0.45, 0.45, 0.45, 12), mat(p0));
      planterTub.position.y = 0.225;
      const benchRing = new THREE.Mesh(new THREE.TorusGeometry(0.65, 0.12, 4, 16), mat(p1));
      benchRing.rotation.x = Math.PI / 2;
      benchRing.position.y = 0.35;
      // Japanese Maple
      const trunk = new THREE.Mesh(new THREE.CylinderGeometry(0.04, 0.06, 0.8, 6), mat(p3));
      trunk.position.y = 0.85;
      const foliage = new THREE.Mesh(new THREE.SphereGeometry(0.35, 8, 6), mat(p2));
      foliage.scale.set(1.4, 0.6, 1.4);
      foliage.position.y = 1.35;
      g.add(planterTub, benchRing, trunk, foliage);
    } else if (idNum === 329 || island.slug.includes('chess-table')) {
      // Public Park Concrete Chess Table Suite with Stools
      const tablePed = new THREE.Mesh(new THREE.CylinderGeometry(0.12, 0.18, 0.65, 8), mat(p0));
      tablePed.position.y = 0.325;
      const tableTop = new THREE.Mesh(new THREE.BoxGeometry(0.75, 0.06, 0.75), mat(p0));
      tableTop.position.y = 0.68;
      const chessGrid = new THREE.Mesh(new THREE.BoxGeometry(0.5, 0.01, 0.5), mat(p3));
      chessGrid.position.set(0, 0.715, 0);
      // Twin stools
      [-0.55, 0.55].forEach((sx) => {
        const stool = new THREE.Mesh(new THREE.CylinderGeometry(0.16, 0.18, 0.42, 8), mat(p0));
        stool.position.set(sx, 0.21, 0);
        g.add(stool);
      });
      g.add(tablePed, tableTop, chessGrid);
    } else {
      // Mirror Stainless Gazing Sphere on Chiseled Basalt Plinth
      const plinth = new THREE.Mesh(new THREE.BoxGeometry(0.36, 0.65, 0.36), mat(p2));
      plinth.position.y = 0.325;
      const sphere = new THREE.Mesh(new THREE.SphereGeometry(0.24, 16, 12), mat(p0, { metalness: 0.98, roughness: 0.05 }));
      sphere.position.y = 0.89;
      g.add(plinth, sphere);
    }
  }

  // -----------------------------------------------------------------------
  // Series D (OB-331 to OB-340): Waterfront, Poolside & Marina Accents
  // -----------------------------------------------------------------------
  else if (idNum <= 340) {
    if (idNum === 331 || island.slug.includes('harbor-bollard')) {
      // Cast-Iron Harbor Mooring Bollard & Coiled Manila Rope
      const bollardBase = new THREE.Mesh(new THREE.CylinderGeometry(0.25, 0.3, 0.12, 8), mat(p0, { metalness: 0.8 }));
      bollardBase.position.y = 0.06;
      const bollardPillar = new THREE.Mesh(new THREE.CylinderGeometry(0.15, 0.18, 0.4, 8), mat(p0, { metalness: 0.8 }));
      bollardPillar.position.y = 0.32;
      const bollardCap = new THREE.Mesh(new THREE.CylinderGeometry(0.22, 0.15, 0.12, 8), mat(p0, { metalness: 0.8 }));
      bollardCap.position.y = 0.58;
      // Coiled manila rope
      for (let r = 0; r < 3; r++) {
        const rope = new THREE.Mesh(new THREE.TorusGeometry(0.28 + r * 0.04, 0.025, 6, 12), mat(p1));
        rope.rotation.x = Math.PI / 2;
        rope.position.y = 0.06 + r * 0.03;
        g.add(rope);
      }
      g.add(bollardBase, bollardPillar, bollardCap);
    } else if (idNum === 332 || island.slug.includes('striped-cabana')) {
      // Riviera Striped Poolside Cabana
      const deck = new THREE.Mesh(new THREE.BoxGeometry(1.2, 0.06, 1.0), mat(p3));
      deck.position.y = 0.03;
      // 4 white posts
      [[-0.55, -0.45], [0.55, -0.45], [-0.55, 0.45], [0.55, 0.45]].forEach(([cx, cz]) => {
        const post = new THREE.Mesh(new THREE.CylinderGeometry(0.025, 0.025, 1.25, 6), mat('#FFFFFF'));
        post.position.set(cx, 0.655, cz);
        g.add(post);
      });
      // Striped pyramidal canopy
      const roof = new THREE.Mesh(new THREE.ConeGeometry(0.85, 0.35, 4), mat(p0));
      roof.rotation.y = Math.PI / 4;
      roof.position.y = 1.45;
      // Lounger inside
      const lounger = new THREE.Mesh(new THREE.BoxGeometry(0.8, 0.15, 0.35), mat('#FFFFFF'));
      lounger.position.set(0, 0.15, 0);
      g.add(deck, roof, lounger);
    } else if (idNum === 333 || island.slug.includes('ships-helm')) {
      // Teak & Brass Ship's Helm on Binnacle
      const binnacle = new THREE.Mesh(new THREE.CylinderGeometry(0.12, 0.16, 0.65, 8), mat(p0));
      binnacle.position.y = 0.325;
      const compassCap = new THREE.Mesh(new THREE.SphereGeometry(0.1, 8, 6, 0, Math.PI * 2, 0, Math.PI / 2), mat(p1, { metalness: 0.85 }));
      compassCap.position.y = 0.65;
      // 8-Spoke Wheel
      const wheelRim = new THREE.Mesh(new THREE.TorusGeometry(0.3, 0.025, 6, 16), mat(p0));
      wheelRim.position.set(0, 0.85, 0.12);
      for (let s = 0; s < 4; s++) {
        const spoke = new THREE.Mesh(new THREE.CylinderGeometry(0.015, 0.015, 0.68, 6), mat(p1, { metalness: 0.8 }));
        spoke.rotation.z = (s * Math.PI) / 4;
        spoke.position.set(0, 0.85, 0.12);
        g.add(spoke);
      }
      g.add(binnacle, compassCap, wheelRim);
    } else if (idNum === 334 || island.slug.includes('driftwood-stanchion')) {
      // Coastal Driftwood Pilings with Sagging Manila Rope
      [
        [-0.45, 0.55, 0.08],
        [-0.25, 0.45, 0.07],
        [0.35, 0.6, 0.09],
      ].forEach(([px, ph, pr]) => {
        const piling = new THREE.Mesh(new THREE.CylinderGeometry(pr as number, (pr as number) * 1.1, ph as number, 8), mat(p0));
        piling.position.set(px as number, (ph as number) / 2, 0);
        g.add(piling);
      });
      // Sagging rope catenary
      const ropeCurve = new THREE.CatmullRomCurve3([
        new THREE.Vector3(-0.45, 0.5, 0),
        new THREE.Vector3(-0.05, 0.3, 0),
        new THREE.Vector3(0.35, 0.55, 0),
      ]);
      const ropeMesh = new THREE.Mesh(new THREE.TubeGeometry(ropeCurve, 16, 0.025, 6, false), mat(p1));
      g.add(ropeMesh);
    } else if (idNum === 335 || island.slug.includes('water-lotus-lantern')) {
      // Floating Solar-Powered Water Lotus Lantern Suite
      [
        [-0.18, 0.12, p0],
        [0.18, 0.09, p1],
        [0.02, 0.14, p2],
      ].forEach(([lx, lr, lCol]) => {
        const pad = new THREE.Mesh(new THREE.CylinderGeometry(lr as number, lr as number, 0.01, 8), mat('#166534'));
        pad.position.set(lx as number, 0.01, (lx as number) * 0.4);
        const flower = new THREE.Mesh(new THREE.ConeGeometry((lr as number) * 0.7, 0.08, 6), mat(lCol as string, { emissive: lCol as string, emissiveIntensity: 0.6 }));
        flower.position.set(lx as number, 0.05, (lx as number) * 0.4);
        g.add(pad, flower);
      });
    } else if (idNum === 336 || island.slug.includes('waterfall')) {
      // Granite Pool Waterfall Weir Cascade
      const wall = new THREE.Mesh(new THREE.BoxGeometry(0.85, 0.9, 0.25), mat(p0));
      wall.position.y = 0.45;
      const spillway = new THREE.Mesh(new THREE.BoxGeometry(0.55, 0.04, 0.14), mat(p2, { metalness: 0.85 }));
      spillway.position.set(0, 0.75, 0.18);
      const waterCurtain = new THREE.Mesh(new THREE.PlaneGeometry(0.52, 0.7), mat(p1, { roughness: 0.1 }));
      waterCurtain.position.set(0, 0.38, 0.24);
      g.add(wall, spillway, waterCurtain);
    } else if (idNum === 337 || island.slug.includes('lifeguard')) {
      // Timber Lifeguard Observation Perch & Orange Ring
      // Four splayed legs
      [[-0.3, -0.3], [0.3, -0.3], [-0.3, 0.3], [0.3, 0.3]].forEach(([lx, lz]) => {
        const leg = new THREE.Mesh(new THREE.CylinderGeometry(0.025, 0.035, 1.4, 4), mat(p0));
        leg.position.set(lx, 0.7, lz);
        g.add(leg);
      });
      const platform = new THREE.Mesh(new THREE.BoxGeometry(0.65, 0.04, 0.65), mat(p0));
      platform.position.y = 1.35;
      const chair = new THREE.Mesh(new THREE.BoxGeometry(0.35, 0.3, 0.3), mat(p0));
      chair.position.set(0, 1.55, 0);
      // Lifebuoy ring
      const ring = new THREE.Mesh(new THREE.TorusGeometry(0.12, 0.035, 6, 12), mat(p1));
      ring.position.set(0.35, 0.9, 0);
      g.add(platform, chair, ring);
    } else if (idNum === 338 || island.slug.includes('buoy')) {
      // Navigational Marker Buoy with Solar Flasher
      const hull = new THREE.Mesh(new THREE.ConeGeometry(0.32, 0.75, 8), mat(p0));
      hull.rotation.x = Math.PI;
      hull.position.y = 0.45;
      const superstructure = new THREE.Mesh(new THREE.CylinderGeometry(0.12, 0.22, 0.5, 6, 1, true), mat(p0, { wireframe: true }));
      superstructure.position.y = 0.9;
      const flasher = new THREE.Mesh(new THREE.SphereGeometry(0.06, 8, 6), mat(p1, { emissive: p1, emissiveIntensity: 1.2 }));
      flasher.position.y = 1.22;
      g.add(hull, superstructure, flasher);
    } else if (idNum === 339 || island.slug.includes('tiki')) {
      // Polynesian Thatched Tiki Umbrella & Bamboo Bar
      const umbrellaPole = new THREE.Mesh(new THREE.CylinderGeometry(0.04, 0.05, 1.7, 6), mat(p1));
      umbrellaPole.position.y = 0.85;
      const thatchRoof = new THREE.Mesh(new THREE.ConeGeometry(0.75, 0.45, 8), mat(p0));
      thatchRoof.position.y = 1.6;
      const barCounter = new THREE.Mesh(new THREE.CylinderGeometry(0.42, 0.45, 0.4, 8, 1, false, 0, Math.PI), mat(p1));
      barCounter.position.set(0, 0.2, 0.1);
      g.add(umbrellaPole, thatchRoof, barCounter);
    } else {
      // Cast Bronze Leaping Dolphin Marine Fountain Spout
      const shellPed = new THREE.Mesh(new THREE.CylinderGeometry(0.35, 0.4, 0.18, 10), mat(p2));
      shellPed.position.y = 0.09;
      const dolphin1 = new THREE.Mesh(new THREE.TorusGeometry(0.24, 0.05, 6, 12, Math.PI), mat(p0, { metalness: 0.75 }));
      dolphin1.position.set(0, 0.42, 0);
      const jet = new THREE.Mesh(new THREE.CylinderGeometry(0.015, 0.02, 0.4, 4), mat(p1, { roughness: 0.1 }));
      jet.rotation.z = -Math.PI / 4;
      jet.position.set(0.25, 0.55, 0);
      g.add(shellPed, dolphin1, jet);
    }
  }

  // -----------------------------------------------------------------------
  // Series E (OB-341 to OB-350): Zen, Oriental & Ecological Nature Elements
  // -----------------------------------------------------------------------
  else {
    if (idNum === 341 || island.slug.includes('kasuga-stone-lantern')) {
      // Traditional Japanese Kasuga Granite Garden Lantern (Toro)
      const baseChurin = new THREE.Mesh(new THREE.CylinderGeometry(0.25, 0.3, 0.14, 6), mat(p0));
      baseChurin.position.y = 0.07;
      const saoStem = new THREE.Mesh(new THREE.CylinderGeometry(0.1, 0.12, 0.55, 8), mat(p0));
      saoStem.position.y = 0.4;
      const hibukuro = new THREE.Mesh(new THREE.CylinderGeometry(0.22, 0.22, 0.25, 6), mat(p0));
      hibukuro.position.y = 0.78;
      const candleGlow = new THREE.Mesh(new THREE.SphereGeometry(0.06, 6, 4), mat(p1, { emissive: p1, emissiveIntensity: 1.2 }));
      candleGlow.position.y = 0.78;
      const kasaRoof = new THREE.Mesh(new THREE.ConeGeometry(0.42, 0.18, 6), mat(p0));
      kasaRoof.position.y = 0.98;
      const jewel = new THREE.Mesh(new THREE.SphereGeometry(0.05, 6, 4), mat(p0));
      jewel.position.y = 1.1;
      g.add(baseChurin, saoStem, hibukuro, candleGlow, kasaRoof, jewel);
    } else if (idNum === 342 || island.slug.includes('tobi-ishi') || island.slug.includes('stepping-stones')) {
      // Natural Granite Tobi-ishi Stepping Stones Trail
      const mossBed = new THREE.Mesh(new THREE.BoxGeometry(1.2, 0.02, 0.6), mat(p1));
      mossBed.position.y = 0.01;
      [
        [-0.45, -0.05, 0.14],
        [-0.2, 0.1, 0.16],
        [0.05, -0.08, 0.15],
        [0.3, 0.08, 0.14],
        [0.5, -0.02, 0.12],
      ].forEach(([sx, sz, sr]) => {
        const stone = new THREE.Mesh(new THREE.CylinderGeometry(sr as number, (sr as number) * 1.1, 0.04, 8), mat(p0));
        stone.position.set(sx as number, 0.03, sz as number);
        g.add(stone);
      });
      g.add(mossBed);
    } else if (idNum === 343 || island.slug.includes('tsukubai')) {
      // Zen Tsukubai Stone Wash Basin with Bamboo Ladle
      const basinRock = new THREE.Mesh(new THREE.DodecahedronGeometry(0.28, 1), mat(p0));
      basinRock.scale.set(1.1, 0.7, 1.0);
      basinRock.position.y = 0.18;
      const water = new THREE.Mesh(new THREE.CylinderGeometry(0.18, 0.18, 0.02, 10), mat(p1, { roughness: 0.1 }));
      water.position.y = 0.28;
      // Bamboo Ladle (Hishaku)
      const ladleHandle = new THREE.Mesh(new THREE.CylinderGeometry(0.006, 0.006, 0.35, 4), mat(p2));
      ladleHandle.rotation.z = Math.PI / 2;
      ladleHandle.position.set(0, 0.32, 0);
      const ladleCup = new THREE.Mesh(new THREE.CylinderGeometry(0.025, 0.025, 0.04, 6), mat(p2));
      ladleCup.position.set(-0.16, 0.32, 0);
      g.add(basinRock, water, ladleHandle, ladleCup);
    } else if (idNum === 344 || island.slug.includes('karesansui') || island.slug.includes('dry-landscape')) {
      // Karesansui Dry-Landscape Raked Sand & Trinity Rocks
      const curb = new THREE.Mesh(new THREE.BoxGeometry(1.2, 0.05, 0.8), mat(p3));
      curb.position.y = 0.025;
      const sand = new THREE.Mesh(new THREE.BoxGeometry(1.14, 0.04, 0.74), mat(p0));
      sand.position.y = 0.035;
      // Three trinity rocks
      [
        [-0.2, 0.18, 0.12, 0.32],
        [0.15, 0.12, 0.09, 0.22],
        [0.32, 0.08, 0.07, 0.15],
      ].forEach(([rx, rz, rw, rh]) => {
        const rock = new THREE.Mesh(new THREE.ConeGeometry(rw as number, rh as number, 5), mat('#475569'));
        rock.position.set(rx as number, (rh as number) / 2 + 0.04, rz as number);
        g.add(rock);
      });
      g.add(curb, sand);
    } else if (idNum === 345 || island.slug.includes('torii')) {
      // Japanese Vermilion Torii Garden Gate Portal
      [-0.45, 0.45].forEach((px) => {
        const post = new THREE.Mesh(new THREE.CylinderGeometry(0.045, 0.05, 1.45, 8), mat(p0));
        post.position.set(px, 0.725, 0);
        const shoe = new THREE.Mesh(new THREE.CylinderGeometry(0.07, 0.07, 0.08, 8), mat(p2));
        shoe.position.set(px, 0.04, 0);
        g.add(post, shoe);
      });
      const tieBeam = new THREE.Mesh(new THREE.BoxGeometry(1.15, 0.05, 0.06), mat(p0));
      tieBeam.position.set(0, 1.25, 0);
      const topKasagi = new THREE.Mesh(new THREE.BoxGeometry(1.35, 0.07, 0.1), mat(p1));
      topKasagi.position.set(0, 1.48, 0);
      g.add(tieBeam, topKasagi);
    } else if (idNum === 346 || island.slug.includes('wind-chimes')) {
      // Natural Carved Bamboo Tuned Wind Chimes
      const coconutTop = new THREE.Mesh(new THREE.SphereGeometry(0.14, 8, 6, 0, Math.PI * 2, 0, Math.PI / 2), mat(p1));
      coconutTop.position.y = 1.1;
      // Staggered hollow bamboo pipes
      for (let c = 0; c < 6; c++) {
        const ang = (c * Math.PI * 2) / 6;
        const pipeH = 0.35 + (c / 5) * 0.3;
        const pipe = new THREE.Mesh(new THREE.CylinderGeometry(0.015, 0.018, pipeH, 6), mat(p0));
        pipe.position.set(Math.cos(ang) * 0.09, 1.0 - pipeH / 2, Math.sin(ang) * 0.09);
        g.add(pipe);
      }
      g.add(coconutTop);
    } else if (idNum === 347 || island.slug.includes('log-planter')) {
      // Hollowed Cedar Log Wildflower & Fern Planter
      const log = new THREE.Mesh(new THREE.CylinderGeometry(0.18, 0.2, 0.95, 8), mat(p0));
      log.rotation.z = Math.PI / 2;
      log.position.y = 0.16;
      // Flowers & ferns blooming from hollowed top
      for (let f = -0.35; f <= 0.35; f += 0.14) {
        const plant = new THREE.Mesh(new THREE.ConeGeometry(0.08, 0.18, 5), mat(f < 0 ? p1 : p2));
        plant.position.set(f, 0.35, 0);
        g.add(plant);
      }
      g.add(log);
    } else if (idNum === 348 || island.slug.includes('bird-feeder')) {
      // Craftsman Cedar Shingle Bird Feeder Pavilion
      const post = new THREE.Mesh(new THREE.CylinderGeometry(0.035, 0.045, 1.1, 6), mat(p0));
      post.position.y = 0.55;
      const feedTray = new THREE.Mesh(new THREE.BoxGeometry(0.42, 0.04, 0.42), mat(p0));
      feedTray.position.y = 1.12;
      // Miniature roof
      const roof = new THREE.Mesh(new THREE.ConeGeometry(0.34, 0.22, 4), mat(p1));
      roof.rotation.y = Math.PI / 4;
      roof.position.y = 1.45;
      g.add(post, feedTray, roof);
    } else if (idNum === 349 || island.slug.includes('fieldstone-wall') || island.slug.includes('boundary-wall')) {
      // Rustic Dry-Stacked Fieldstone Boundary Wall
      const wall = new THREE.Mesh(new THREE.BoxGeometry(1.15, 0.48, 0.3), mat(p0));
      wall.position.y = 0.24;
      const coping = new THREE.Mesh(new THREE.BoxGeometry(1.2, 0.06, 0.34), mat(p1));
      coping.position.y = 0.51;
      // Stonecrop moss tufts
      for (let t = -0.4; t <= 0.4; t += 0.2) {
        const tuft = new THREE.Mesh(new THREE.SphereGeometry(0.05, 6, 4), mat(p2));
        tuft.position.set(t, 0.54, 0);
        g.add(tuft);
      }
      g.add(wall, coping);
    } else {
      // Monumental Brass Equatorial Armillary Sphere Sundial
      const marblePed = new THREE.Mesh(new THREE.CylinderGeometry(0.15, 0.18, 0.65, 8), mat(p1));
      marblePed.position.y = 0.325;
      // Concentric brass rings
      for (let r = 0; r < 3; r++) {
        const ring = new THREE.Mesh(new THREE.TorusGeometry(0.24, 0.02, 6, 16), mat(p0, { metalness: 0.9 }));
        ring.rotation.x = r * (Math.PI / 3);
        ring.rotation.y = r * (Math.PI / 4);
        ring.position.y = 0.9;
        g.add(ring);
      }
      // Arrow gnomon
      const arrow = new THREE.Mesh(new THREE.CylinderGeometry(0.012, 0.012, 0.75, 6), mat(p0, { metalness: 0.95 }));
      arrow.rotation.z = Math.PI / 4;
      arrow.position.y = 0.9;
      g.add(marblePed, arrow);
    }
  }

  return g;
}

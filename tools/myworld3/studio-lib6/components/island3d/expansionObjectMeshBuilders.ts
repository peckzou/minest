import * as THREE from 'three';
import { IslandMetadata, IslandVariant } from '../../types/island';
import { createLowPolyMat, createGlassMat } from './materials';

/**
 * Procedural 3D builders for the 100 Standalone Low-Poly Objects (OB-001 to OB-100).
 * Strictly complies with the user directive and Level 3 constitution:
 * - NO display pedestals
 * - NO circular platforms
 * - NO terrain bases
 * - ZERO unnecessary supporting plinths
 * The geometry represents ONLY the standalone physical object itself.
 */
export function buildExpansionObjectScene(
  island: IslandMetadata,
  variant: IslandVariant
): THREE.Group {
  const g = new THREE.Group();

  const c1 = island.palette[0]?.hex || '#0284C7';
  const c2 = island.palette[1]?.hex || '#1E293B';
  const c3 = island.palette[2]?.hex || '#D4AF37';
  const c4 = island.palette[3]?.hex || '#DC2626';

  const mat1 = createLowPolyMat(c1);
  const mat2 = createLowPolyMat(c2);
  const mat3 = createLowPolyMat(c3);
  const mat4 = createLowPolyMat(c4);

  const slug = island.slug;

  // A. Sports (OB-001 to OB-010)
  if (slug === 'object-basketball-hoop') {
    const board = new THREE.Mesh(new THREE.BoxGeometry(2.4, 1.6, 0.1), createLowPolyMat(0xffffff));
    board.position.set(0, 1.8, 0);
    const rim = new THREE.Mesh(new THREE.TorusGeometry(0.55, 0.06, 6, 16), createLowPolyMat(0xea580c));
    rim.rotation.x = Math.PI / 2;
    rim.position.set(0, 1.4, 0.7);
    const pole = new THREE.Mesh(new THREE.CylinderGeometry(0.1, 0.1, 2.6, 8), createLowPolyMat(0x1e293b));
    pole.position.set(0, 0.7, -0.2);
    g.add(board, rim, pole);
  } else if (slug === 'object-baseball-bat') {
    const bat = new THREE.Mesh(new THREE.CylinderGeometry(0.22, 0.08, 2.8, 12), createLowPolyMat(0xd97706));
    bat.rotation.z = Math.PI / 4;
    bat.position.set(0, 1.0, 0);
    g.add(bat);
  } else if (slug === 'object-baseball-glove') {
    const mitt = new THREE.Mesh(new THREE.SphereGeometry(1.0, 8, 8, 0, Math.PI * 1.5, 0, Math.PI * 0.85), createLowPolyMat(0x92400e));
    mitt.position.set(0, 0.8, 0);
    const ball = new THREE.Mesh(new THREE.SphereGeometry(0.42, 10, 10), createLowPolyMat(0xffffff));
    ball.position.set(0.1, 0.85, 0.2);
    g.add(mitt, ball);
  } else if (slug === 'object-tennis-ball') {
    const ball = new THREE.Mesh(new THREE.SphereGeometry(1.0, 14, 14), createLowPolyMat(0xccff00));
    ball.position.set(0, 1.0, 0);
    g.add(ball);
  } else if (slug === 'object-golf-club') {
    const shaft = new THREE.Mesh(new THREE.CylinderGeometry(0.04, 0.04, 2.6, 6), createLowPolyMat(0x18181b));
    shaft.rotation.z = 0.3;
    shaft.position.set(-0.2, 1.3, 0);
    const head = new THREE.Mesh(new THREE.BoxGeometry(0.65, 0.45, 0.5), createLowPolyMat(0x475569, { metalness: 0.6 }));
    head.position.set(0.4, 0.25, 0);
    g.add(shaft, head);
  } else if (slug === 'object-boxing-gloves') {
    const glove1 = new THREE.Mesh(new THREE.SphereGeometry(0.85, 8, 8), createLowPolyMat(0xdc2626));
    glove1.position.set(-0.6, 0.9, 0);
    const glove2 = new THREE.Mesh(new THREE.SphereGeometry(0.85, 8, 8), createLowPolyMat(0xdc2626));
    glove2.position.set(0.6, 0.9, 0);
    g.add(glove1, glove2);
  } else if (slug === 'object-sports-helmet') {
    const helm = new THREE.Mesh(new THREE.SphereGeometry(1.1, 10, 8, 0, Math.PI * 2, 0, Math.PI * 0.65), createLowPolyMat(0x0284c7));
    helm.position.set(0, 1.0, 0);
    const visor = new THREE.Mesh(new THREE.BoxGeometry(1.4, 0.4, 0.3), createLowPolyMat(0x18181b));
    visor.position.set(0, 0.8, 0.9);
    g.add(helm, visor);
  } else if (slug === 'object-referee-whistle') {
    const whistle = new THREE.Mesh(new THREE.CylinderGeometry(0.45, 0.45, 1.2, 12), createLowPolyMat(0xe2e8f0, { metalness: 0.8 }));
    whistle.rotation.x = Math.PI / 2;
    whistle.position.set(0, 0.6, 0);
    g.add(whistle);
  } else if (slug === 'object-stopwatch') {
    const watch = new THREE.Mesh(new THREE.CylinderGeometry(1.1, 1.1, 0.35, 16), createLowPolyMat(0x94a3b8, { metalness: 0.7 }));
    watch.rotation.x = Math.PI / 4;
    watch.position.set(0, 0.9, 0);
    g.add(watch);
  } else if (slug === 'object-dumbbell') {
    const bar = new THREE.Mesh(new THREE.CylinderGeometry(0.08, 0.08, 2.2, 8), createLowPolyMat(0xe2e8f0, { metalness: 0.7 }));
    bar.rotation.z = Math.PI / 2;
    bar.position.set(0, 0.6, 0);
    const bell1 = new THREE.Mesh(new THREE.CylinderGeometry(0.6, 0.6, 0.45, 6), createLowPolyMat(0x1f2937));
    bell1.rotation.z = Math.PI / 2;
    bell1.position.set(-0.9, 0.6, 0);
    const bell2 = new THREE.Mesh(new THREE.CylinderGeometry(0.6, 0.6, 0.45, 6), createLowPolyMat(0x1f2937));
    bell2.rotation.z = Math.PI / 2;
    bell2.position.set(0.9, 0.6, 0);
    g.add(bar, bell1, bell2);
  }

  // B. Food (OB-011 to OB-020)
  else if (slug === 'object-croissant') {
    const torus = new THREE.Mesh(new THREE.TorusGeometry(1.0, 0.45, 8, 12, Math.PI * 1.2), createLowPolyMat(0xd97706));
    torus.rotation.x = Math.PI / 2;
    torus.position.set(0, 0.45, 0);
    g.add(torus);
  } else if (slug === 'object-donut') {
    const dough = new THREE.Mesh(new THREE.TorusGeometry(1.0, 0.5, 10, 16), createLowPolyMat(0xd97706));
    dough.rotation.x = Math.PI / 2;
    dough.position.set(0, 0.5, 0);
    const glaze = new THREE.Mesh(new THREE.TorusGeometry(1.0, 0.52, 10, 16, Math.PI * 1.9), createLowPolyMat(0xf472b6));
    glaze.rotation.x = Math.PI / 2;
    glaze.position.set(0, 0.55, 0);
    g.add(dough, glaze);
  } else if (slug === 'object-cupcake') {
    const cup = new THREE.Mesh(new THREE.CylinderGeometry(0.9, 0.65, 0.8, 12), createLowPolyMat(0xfef3c7));
    cup.position.set(0, 0.4, 0);
    const swirl = new THREE.Mesh(new THREE.ConeGeometry(0.95, 0.9, 8), createLowPolyMat(0xffffff));
    swirl.position.set(0, 1.2, 0);
    const cherry = new THREE.Mesh(new THREE.SphereGeometry(0.2, 8, 8), createLowPolyMat(0xdc2626));
    cherry.position.set(0, 1.7, 0);
    g.add(cup, swirl, cherry);
  } else if (slug === 'object-chocolate-bar') {
    const bar = new THREE.Mesh(new THREE.BoxGeometry(2.0, 0.3, 1.2), createLowPolyMat(0x451a03));
    bar.position.set(0, 0.2, 0);
    const foil = new THREE.Mesh(new THREE.BoxGeometry(1.1, 0.32, 1.25), createLowPolyMat(0xf59e0b, { metalness: 0.8 }));
    foil.position.set(0.5, 0.2, 0);
    g.add(bar, foil);
  } else if (slug === 'object-cheese-wheel') {
    const wheel = new THREE.Mesh(new THREE.CylinderGeometry(1.2, 1.2, 0.65, 16), createLowPolyMat(0xdc2626));
    wheel.position.set(0, 0.35, 0);
    const wedge = new THREE.Mesh(new THREE.ConeGeometry(0.7, 0.65, 4), createLowPolyMat(0xfacc15));
    wedge.rotation.x = Math.PI / 2;
    wedge.position.set(1.4, 0.35, 0.5);
    g.add(wheel, wedge);
  } else if (slug === 'object-avocado') {
    const body = new THREE.Mesh(new THREE.SphereGeometry(1.0, 10, 8), createLowPolyMat(0x84cc16));
    body.scale.set(0.75, 1.2, 0.5);
    body.position.set(0, 0.8, 0);
    const pit = new THREE.Mesh(new THREE.SphereGeometry(0.4, 8, 8), createLowPolyMat(0x78350f));
    pit.position.set(0, 0.6, 0.3);
    g.add(body, pit);
  } else if (slug === 'object-strawberry') {
    const berry = new THREE.Mesh(new THREE.ConeGeometry(0.9, 1.5, 8), createLowPolyMat(0xef4444));
    berry.rotation.x = Math.PI;
    berry.position.set(0, 0.9, 0);
    const leaf = new THREE.Mesh(new THREE.ConeGeometry(0.8, 0.3, 5), createLowPolyMat(0x15803d));
    leaf.position.set(0, 1.7, 0);
    g.add(berry, leaf);
  } else if (slug === 'object-ice-cream-cone') {
    const cone = new THREE.Mesh(new THREE.ConeGeometry(0.65, 1.8, 8), createLowPolyMat(0xd97706));
    cone.rotation.x = Math.PI;
    cone.position.set(0, 0.7, 0);
    const scoop1 = new THREE.Mesh(new THREE.SphereGeometry(0.75, 8, 8), createLowPolyMat(0x34d399));
    scoop1.position.set(0, 1.8, 0);
    const scoop2 = new THREE.Mesh(new THREE.SphereGeometry(0.65, 8, 8), createLowPolyMat(0xf472b6));
    scoop2.position.set(0, 2.5, 0);
    g.add(cone, scoop1, scoop2);
  } else if (slug === 'object-sushi-platter') {
    const board = new THREE.Mesh(new THREE.BoxGeometry(2.4, 0.2, 1.5), createLowPolyMat(0xb45309));
    board.position.set(0, 0.15, 0);
    const nigiri1 = new THREE.Mesh(new THREE.BoxGeometry(0.5, 0.3, 0.8), createLowPolyMat(0xf97316));
    nigiri1.position.set(-0.6, 0.4, 0);
    const nigiri2 = new THREE.Mesh(new THREE.BoxGeometry(0.5, 0.3, 0.8), createLowPolyMat(0xdc2626));
    nigiri2.position.set(0.6, 0.4, 0);
    g.add(board, nigiri1, nigiri2);
  } else if (slug === 'object-bread-loaf') {
    const loaf = new THREE.Mesh(new THREE.CylinderGeometry(0.65, 0.65, 2.2, 8), createLowPolyMat(0x92400e));
    loaf.rotation.z = Math.PI / 2;
    loaf.position.set(0, 0.5, 0);
    g.add(loaf);
  }

  // C. Fashion (OB-021 to OB-030)
  else if (slug === 'object-sneaker') {
    const sole = new THREE.Mesh(new THREE.BoxGeometry(2.4, 0.4, 1.1), createLowPolyMat(0xffffff));
    sole.position.set(0, 0.2, 0);
    const upper = new THREE.Mesh(new THREE.BoxGeometry(2.0, 0.9, 1.0), createLowPolyMat(0xdc2626));
    upper.position.set(-0.1, 0.8, 0);
    g.add(sole, upper);
  } else if (slug === 'object-high-heel') {
    const arch = new THREE.Mesh(new THREE.BoxGeometry(1.8, 0.2, 0.7), createLowPolyMat(0x18181b));
    arch.rotation.z = 0.3;
    arch.position.set(0, 0.8, 0);
    const stiletto = new THREE.Mesh(new THREE.CylinderGeometry(0.06, 0.04, 1.2, 6), createLowPolyMat(0xdc2626));
    stiletto.position.set(-0.7, 0.6, 0);
    g.add(arch, stiletto);
  } else if (slug === 'object-handbag') {
    const body = new THREE.Mesh(new THREE.BoxGeometry(1.8, 1.4, 0.9), createLowPolyMat(0xb45309));
    body.position.set(0, 0.7, 0);
    const handle = new THREE.Mesh(new THREE.TorusGeometry(0.6, 0.08, 6, 12, Math.PI), createLowPolyMat(0xd4af37));
    handle.position.set(0, 1.4, 0);
    g.add(body, handle);
  } else if (slug === 'object-sunglasses') {
    const frame = new THREE.Mesh(new THREE.BoxGeometry(2.2, 0.6, 0.1), createLowPolyMat(0x78350f));
    frame.position.set(0, 0.8, 0);
    const lensL = new THREE.Mesh(new THREE.BoxGeometry(0.8, 0.5, 0.12), createLowPolyMat(0x166534));
    lensL.position.set(-0.55, 0.8, 0);
    const lensR = new THREE.Mesh(new THREE.BoxGeometry(0.8, 0.5, 0.12), createLowPolyMat(0x166534));
    lensR.position.set(0.55, 0.8, 0);
    g.add(frame, lensL, lensR);
  } else if (slug === 'object-wristwatch') {
    const dial = new THREE.Mesh(new THREE.CylinderGeometry(0.9, 0.9, 0.25, 16), createLowPolyMat(0xe2e8f0, { metalness: 0.8 }));
    dial.position.set(0, 0.4, 0);
    const strap = new THREE.Mesh(new THREE.BoxGeometry(0.7, 0.1, 2.6), createLowPolyMat(0x78350f));
    strap.position.set(0, 0.3, 0);
    g.add(dial, strap);
  } else if (slug === 'object-sewing-machine') {
    const bed = new THREE.Mesh(new THREE.BoxGeometry(2.2, 0.25, 1.1), createLowPolyMat(0x18181b));
    bed.position.set(0, 0.15, 0);
    const arm = new THREE.Mesh(new THREE.BoxGeometry(1.8, 1.2, 0.6), createLowPolyMat(0x18181b));
    arm.position.set(-0.2, 0.8, 0);
    g.add(bed, arm);
  } else if (slug === 'object-mannequin') {
    const torso = new THREE.Mesh(new THREE.CylinderGeometry(0.5, 0.6, 1.6, 8), createLowPolyMat(0xfef3c7));
    torso.position.set(0, 1.4, 0);
    const pole = new THREE.Mesh(new THREE.CylinderGeometry(0.06, 0.06, 1.4, 6), createLowPolyMat(0x78350f));
    pole.position.set(0, 0.7, 0);
    g.add(torso, pole);
  } else if (slug === 'object-perfume-bottle') {
    const bottle = new THREE.Mesh(new THREE.BoxGeometry(1.2, 1.4, 0.8), createGlassMat(0xe0f2fe, 0.75));
    bottle.position.set(0, 0.8, 0);
    const stopper = new THREE.Mesh(new THREE.OctahedronGeometry(0.35, 0), createLowPolyMat(0xd4af37, { metalness: 0.8 }));
    stopper.position.set(0, 1.7, 0);
    g.add(bottle, stopper);
  } else if (slug === 'object-fedora-hat') {
    const brim = new THREE.Mesh(new THREE.CylinderGeometry(1.5, 1.5, 0.08, 16), createLowPolyMat(0x451a03));
    brim.position.set(0, 0.3, 0);
    const crown = new THREE.Mesh(new THREE.CylinderGeometry(0.8, 0.95, 0.8, 12), createLowPolyMat(0x451a03));
    crown.position.set(0, 0.7, 0);
    g.add(brim, crown);
  } else if (slug === 'object-fabric-spool') {
    const spool = new THREE.Mesh(new THREE.CylinderGeometry(0.65, 0.65, 1.4, 12), createLowPolyMat(0x0284c7));
    spool.position.set(0, 0.75, 0);
    const rim1 = new THREE.Mesh(new THREE.CylinderGeometry(0.8, 0.8, 0.15, 12), createLowPolyMat(0xb45309));
    rim1.position.set(0, 1.45, 0);
    const rim2 = new THREE.Mesh(new THREE.CylinderGeometry(0.8, 0.8, 0.15, 12), createLowPolyMat(0xb45309));
    rim2.position.set(0, 0.08, 0);
    g.add(spool, rim1, rim2);
  }

  // D. Transportation (OB-031 to OB-040)
  else if (slug === 'object-propeller-plane') {
    const fuse = new THREE.Mesh(new THREE.CylinderGeometry(0.3, 0.15, 2.2, 8), createLowPolyMat(0xdc2626));
    fuse.rotation.x = Math.PI / 2;
    fuse.position.set(0, 0.8, 0);
    const wings = new THREE.Mesh(new THREE.BoxGeometry(2.8, 0.08, 0.6), createLowPolyMat(0xfef3c7));
    wings.position.set(0, 0.95, 0);
    g.add(fuse, wings);
  } else if (slug === 'object-steam-locomotive') {
    const boiler = new THREE.Mesh(new THREE.CylinderGeometry(0.5, 0.5, 2.0, 10), createLowPolyMat(0x1e293b));
    boiler.rotation.z = Math.PI / 2;
    boiler.position.set(0, 0.7, 0);
    const cab = new THREE.Mesh(new THREE.BoxGeometry(0.9, 1.2, 1.1), createLowPolyMat(0x991b1b));
    cab.position.set(-0.8, 0.9, 0);
    g.add(boiler, cab);
  } else if (slug === 'object-electric-car') {
    const carBody = new THREE.Mesh(new THREE.BoxGeometry(2.4, 0.75, 1.2), createLowPolyMat(0x06b6d4));
    carBody.position.set(0, 0.55, 0);
    const cabin = new THREE.Mesh(new THREE.BoxGeometry(1.4, 0.6, 1.0), createLowPolyMat(0x0f172a));
    cabin.position.set(-0.2, 1.1, 0);
    g.add(carBody, cabin);
  } else if (slug === 'object-sailing-yacht') {
    const hull = new THREE.Mesh(new THREE.ConeGeometry(0.7, 2.4, 6), createLowPolyMat(0xffffff));
    hull.rotation.z = Math.PI / 2;
    hull.position.set(0, 0.4, 0);
    const mast = new THREE.Mesh(new THREE.CylinderGeometry(0.05, 0.05, 2.4, 6), createLowPolyMat(0x64748b));
    mast.position.set(0.2, 1.6, 0);
    const sail = new THREE.Mesh(new THREE.ConeGeometry(0.8, 1.8, 3), createLowPolyMat(0xffffff));
    sail.position.set(0.5, 1.6, 0);
    g.add(hull, mast, sail);
  } else if (slug === 'object-bicycle') {
    const frame = new THREE.Mesh(new THREE.TorusGeometry(0.7, 0.05, 4, 4), createLowPolyMat(0xeab308));
    frame.position.set(0, 0.9, 0);
    const wheel1 = new THREE.Mesh(new THREE.TorusGeometry(0.55, 0.06, 6, 16), createLowPolyMat(0x18181b));
    wheel1.position.set(-1.0, 0.6, 0);
    const wheel2 = new THREE.Mesh(new THREE.TorusGeometry(0.55, 0.06, 6, 16), createLowPolyMat(0x18181b));
    wheel2.position.set(1.0, 0.6, 0);
    g.add(frame, wheel1, wheel2);
  } else if (slug === 'object-hot-air-balloon') {
    const balloon = new THREE.Mesh(new THREE.SphereGeometry(1.2, 12, 10), createLowPolyMat(0xdc2626));
    balloon.scale.set(1.0, 1.3, 1.0);
    balloon.position.set(0, 1.8, 0);
    const basket = new THREE.Mesh(new THREE.BoxGeometry(0.5, 0.45, 0.5), createLowPolyMat(0x78350f));
    basket.position.set(0, 0.3, 0);
    g.add(balloon, basket);
  } else if (slug === 'object-scooter') {
    const deck = new THREE.Mesh(new THREE.BoxGeometry(1.8, 0.1, 0.4), createLowPolyMat(0x0284c7));
    deck.position.set(0, 0.2, 0);
    const tbar = new THREE.Mesh(new THREE.CylinderGeometry(0.04, 0.04, 1.8, 6), createLowPolyMat(0xe2e8f0));
    tbar.position.set(0.7, 1.0, 0);
    g.add(deck, tbar);
  } else if (slug === 'object-helicopter') {
    const body = new THREE.Mesh(new THREE.SphereGeometry(0.9, 8, 8), createLowPolyMat(0xea580c));
    body.position.set(0, 0.8, 0);
    const rotor = new THREE.Mesh(new THREE.BoxGeometry(2.8, 0.05, 0.2), createLowPolyMat(0x334155));
    rotor.position.set(0, 1.7, 0);
    g.add(body, rotor);
  } else if (slug === 'object-traffic-light') {
    const box = new THREE.Mesh(new THREE.BoxGeometry(0.7, 2.0, 0.5), createLowPolyMat(0xeab308));
    box.position.set(0, 1.1, 0);
    g.add(box);
  } else if (slug === 'object-shipping-container') {
    const box = new THREE.Mesh(new THREE.BoxGeometry(2.6, 1.2, 1.2), createLowPolyMat(0x0284c7));
    box.position.set(0, 0.6, 0);
    g.add(box);
  }

  // E. Technology & Electronics (OB-041 to OB-050)
  else if (slug === 'object-microchip') {
    const wafer = new THREE.Mesh(new THREE.BoxGeometry(2.0, 0.15, 2.0), createLowPolyMat(0x166534));
    wafer.position.set(0, 0.1, 0);
    const cap = new THREE.Mesh(new THREE.BoxGeometry(1.4, 0.12, 1.4), createLowPolyMat(0x94a3b8, { metalness: 0.8 }));
    cap.position.set(0, 0.22, 0);
    g.add(wafer, cap);
  } else if (slug === 'object-robotic-arm') {
    const arm1 = new THREE.Mesh(new THREE.CylinderGeometry(0.2, 0.2, 1.4, 8), createLowPolyMat(0xeab308));
    arm1.position.set(0, 0.7, 0);
    const arm2 = new THREE.Mesh(new THREE.CylinderGeometry(0.15, 0.15, 1.2, 8), createLowPolyMat(0xeab308));
    arm2.position.set(0.4, 1.6, 0);
    arm2.rotation.z = -0.5;
    g.add(arm1, arm2);
  } else if (slug === 'object-drone') {
    const center = new THREE.Mesh(new THREE.BoxGeometry(0.8, 0.3, 0.8), createLowPolyMat(0x64748b));
    center.position.set(0, 0.4, 0);
    const armX = new THREE.Mesh(new THREE.BoxGeometry(2.4, 0.08, 0.08), createLowPolyMat(0x18181b));
    armX.rotation.y = Math.PI / 4;
    armX.position.set(0, 0.45, 0);
    const armY = new THREE.Mesh(new THREE.BoxGeometry(2.4, 0.08, 0.08), createLowPolyMat(0x18181b));
    armY.rotation.y = -Math.PI / 4;
    armY.position.set(0, 0.45, 0);
    g.add(center, armX, armY);
  } else if (slug === 'object-vr-headset') {
    const visor = new THREE.Mesh(new THREE.BoxGeometry(1.6, 0.9, 1.1), createLowPolyMat(0xf8fafc));
    visor.position.set(0, 0.7, 0);
    const glass = new THREE.Mesh(new THREE.BoxGeometry(1.5, 0.8, 0.1), createLowPolyMat(0x0f172a));
    glass.position.set(0, 0.7, 0.56);
    g.add(visor, glass);
  } else if (slug === 'object-smartphone') {
    const phone = new THREE.Mesh(new THREE.BoxGeometry(1.1, 2.2, 0.12), createLowPolyMat(0x0f172a));
    phone.position.set(0, 1.1, 0);
    g.add(phone);
  } else if (slug === 'object-satellite') {
    const bus = new THREE.Mesh(new THREE.BoxGeometry(0.9, 0.9, 0.9), createLowPolyMat(0xf59e0b, { metalness: 0.8 }));
    bus.position.set(0, 1.0, 0);
    const wing1 = new THREE.Mesh(new THREE.BoxGeometry(1.4, 0.6, 0.06), createLowPolyMat(0x0284c7));
    wing1.position.set(-1.4, 1.0, 0);
    const wing2 = new THREE.Mesh(new THREE.BoxGeometry(1.4, 0.6, 0.06), createLowPolyMat(0x0284c7));
    wing2.position.set(1.4, 1.0, 0);
    g.add(bus, wing1, wing2);
  } else if (slug === 'object-solar-panel') {
    const panel = new THREE.Mesh(new THREE.BoxGeometry(2.2, 0.1, 1.4), createLowPolyMat(0x0284c7));
    panel.rotation.x = -0.4;
    panel.position.set(0, 0.7, 0);
    g.add(panel);
  } else if (slug === 'object-anemometer') {
    const mast = new THREE.Mesh(new THREE.CylinderGeometry(0.06, 0.06, 2.0, 6), createLowPolyMat(0x1e293b));
    mast.position.set(0, 1.0, 0);
    const cupRing = new THREE.Mesh(new THREE.TorusGeometry(0.7, 0.08, 4, 8), createLowPolyMat(0xe2e8f0));
    cupRing.rotation.x = Math.PI / 2;
    cupRing.position.set(0, 1.9, 0);
    g.add(mast, cupRing);
  } else if (slug === 'object-server-rack') {
    const rack = new THREE.Mesh(new THREE.BoxGeometry(1.2, 2.4, 1.0), createLowPolyMat(0x18181b));
    rack.position.set(0, 1.2, 0);
    g.add(rack);
  } else if (slug === 'object-battery-cell') {
    const cell = new THREE.Mesh(new THREE.CylinderGeometry(0.65, 0.65, 1.8, 16), createLowPolyMat(0x16a34a));
    cell.position.set(0, 0.9, 0);
    const cap = new THREE.Mesh(new THREE.CylinderGeometry(0.2, 0.2, 0.15, 12), createLowPolyMat(0xe2e8f0, { metalness: 0.8 }));
    cap.position.set(0, 1.85, 0);
    g.add(cell, cap);
  }

  // F. Architecture & Tools (OB-051 to OB-060)
  else if (slug === 'object-blueprint-scroll') {
    const paper = new THREE.Mesh(new THREE.BoxGeometry(2.2, 0.08, 1.6), createLowPolyMat(0x1d4ed8));
    paper.position.set(0, 0.1, 0);
    g.add(paper);
  } else if (slug === 'object-drafting-caliper') {
    const leg1 = new THREE.Mesh(new THREE.CylinderGeometry(0.04, 0.02, 2.0, 6), createLowPolyMat(0xd4af37));
    leg1.rotation.z = 0.2;
    leg1.position.set(-0.25, 1.0, 0);
    const leg2 = new THREE.Mesh(new THREE.CylinderGeometry(0.04, 0.02, 2.0, 6), createLowPolyMat(0xd4af37));
    leg2.rotation.z = -0.2;
    leg2.position.set(0.25, 1.0, 0);
    g.add(leg1, leg2);
  } else if (slug === 'object-drafting-table') {
    const board = new THREE.Mesh(new THREE.BoxGeometry(2.4, 0.1, 1.8), createLowPolyMat(0xb45309));
    board.rotation.x = -0.4;
    board.position.set(0, 1.0, 0);
    g.add(board);
  } else if (slug === 'object-crane-hook') {
    const block = new THREE.Mesh(new THREE.BoxGeometry(0.9, 1.2, 0.6), createLowPolyMat(0xeab308));
    block.position.set(0, 1.5, 0);
    const hook = new THREE.Mesh(new THREE.TorusGeometry(0.45, 0.12, 6, 12, Math.PI * 1.4), createLowPolyMat(0x334155, { metalness: 0.8 }));
    hook.position.set(0, 0.5, 0);
    g.add(block, hook);
  } else if (slug === 'object-hammer') {
    const handle = new THREE.Mesh(new THREE.CylinderGeometry(0.08, 0.08, 2.0, 8), createLowPolyMat(0xd97706));
    handle.position.set(0, 1.0, 0);
    const head = new THREE.Mesh(new THREE.BoxGeometry(0.8, 0.35, 0.3), createLowPolyMat(0x64748b, { metalness: 0.7 }));
    head.position.set(0.2, 1.9, 0);
    g.add(handle, head);
  } else if (slug === 'object-trowel') {
    const blade = new THREE.Mesh(new THREE.ConeGeometry(0.7, 1.6, 3), createLowPolyMat(0x94a3b8, { metalness: 0.6 }));
    blade.rotation.x = Math.PI / 2;
    blade.position.set(0, 0.25, 0);
    const handle = new THREE.Mesh(new THREE.CylinderGeometry(0.1, 0.1, 0.9, 8), createLowPolyMat(0xb45309));
    handle.position.set(0, 0.8, -0.6);
    g.add(blade, handle);
  } else if (slug === 'object-concrete-mixer') {
    const drum = new THREE.Mesh(new THREE.CylinderGeometry(0.9, 0.7, 1.6, 10), createLowPolyMat(0xea580c));
    drum.rotation.x = 0.5;
    drum.position.set(0, 1.0, 0);
    g.add(drum);
  } else if (slug === 'object-hard-hat') {
    const hat = new THREE.Mesh(new THREE.SphereGeometry(1.0, 10, 8, 0, Math.PI * 2, 0, Math.PI * 0.6), createLowPolyMat(0xfacc15));
    hat.position.set(0, 0.6, 0);
    g.add(hat);
  } else if (slug === 'object-toolbox') {
    const chest = new THREE.Mesh(new THREE.BoxGeometry(2.2, 1.1, 1.1), createLowPolyMat(0xdc2626));
    chest.position.set(0, 0.6, 0);
    g.add(chest);
  } else if (slug === 'object-traffic-cone') {
    const cone = new THREE.Mesh(new THREE.ConeGeometry(0.75, 2.2, 10), createLowPolyMat(0xea580c));
    cone.position.set(0, 1.1, 0);
    const base = new THREE.Mesh(new THREE.BoxGeometry(1.7, 0.12, 1.7), createLowPolyMat(0x18181b));
    base.position.set(0, 0.06, 0);
    g.add(cone, base);
  }

  // G. Hobbies & Music (OB-061 to OB-070)
  else if (slug === 'object-watercolor-box') {
    const box = new THREE.Mesh(new THREE.BoxGeometry(2.0, 0.2, 1.2), createLowPolyMat(0x1e293b));
    box.position.set(0, 0.1, 0);
    g.add(box);
  } else if (slug === 'object-acoustic-guitar') {
    const soundbox = new THREE.Mesh(new THREE.CylinderGeometry(0.9, 1.1, 0.45, 10), createLowPolyMat(0xd97706));
    soundbox.position.set(0, 0.8, 0);
    const neck = new THREE.Mesh(new THREE.BoxGeometry(0.2, 1.8, 0.15), createLowPolyMat(0x451a03));
    neck.position.set(0, 1.9, 0);
    g.add(soundbox, neck);
  } else if (slug === 'object-gramophone-horn') {
    const horn = new THREE.Mesh(new THREE.ConeGeometry(1.3, 2.2, 12, 1, true), createLowPolyMat(0xd4af37, { metalness: 0.8 }));
    horn.rotation.x = -Math.PI / 3;
    horn.position.set(0, 1.1, 0);
    g.add(horn);
  } else if (slug === 'object-twin-lens-camera') {
    const cam = new THREE.Mesh(new THREE.BoxGeometry(1.1, 1.8, 1.0), createLowPolyMat(0x18181b));
    cam.position.set(0, 0.9, 0);
    const l1 = new THREE.Mesh(new THREE.CylinderGeometry(0.3, 0.3, 0.2, 10), createLowPolyMat(0x0284c7));
    l1.rotation.x = Math.PI / 2;
    l1.position.set(0, 1.2, 0.55);
    const l2 = new THREE.Mesh(new THREE.CylinderGeometry(0.3, 0.3, 0.2, 10), createLowPolyMat(0x0284c7));
    l2.rotation.x = Math.PI / 2;
    l2.position.set(0, 0.6, 0.55);
    g.add(cam, l1, l2);
  } else if (slug === 'object-clapperboard') {
    const board = new THREE.Mesh(new THREE.BoxGeometry(1.8, 1.4, 0.1), createLowPolyMat(0x18181b));
    board.position.set(0, 0.7, 0);
    g.add(board);
  } else if (slug === 'object-paint-tube') {
    const tube = new THREE.Mesh(new THREE.CylinderGeometry(0.3, 0.4, 1.8, 8), createLowPolyMat(0x94a3b8));
    tube.rotation.z = Math.PI / 3;
    tube.position.set(0, 0.5, 0);
    g.add(tube);
  } else if (slug === 'object-studio-easel') {
    const canvas = new THREE.Mesh(new THREE.BoxGeometry(1.4, 1.8, 0.1), createLowPolyMat(0xffffff));
    canvas.position.set(0, 1.4, 0);
    g.add(canvas);
  } else if (slug === 'object-sculpting-chisel') {
    const chisel = new THREE.Mesh(new THREE.CylinderGeometry(0.08, 0.08, 1.6, 6), createLowPolyMat(0x64748b));
    chisel.position.set(-0.3, 0.8, 0);
    const mallet = new THREE.Mesh(new THREE.CylinderGeometry(0.35, 0.35, 0.8, 8), createLowPolyMat(0xb45309));
    mallet.position.set(0.4, 0.8, 0);
    g.add(chisel, mallet);
  } else if (slug === 'object-violin') {
    const body = new THREE.Mesh(new THREE.CylinderGeometry(0.65, 0.75, 0.3, 8), createLowPolyMat(0x9a3412));
    body.position.set(0, 0.7, 0);
    const neck = new THREE.Mesh(new THREE.BoxGeometry(0.12, 1.6, 0.12), createLowPolyMat(0x18181b));
    neck.position.set(0, 1.6, 0);
    g.add(body, neck);
  } else if (slug === 'object-microphone') {
    const head = new THREE.Mesh(new THREE.SphereGeometry(0.65, 10, 8), createLowPolyMat(0xe2e8f0, { metalness: 0.8 }));
    head.position.set(0, 1.2, 0);
    const pole = new THREE.Mesh(new THREE.CylinderGeometry(0.06, 0.06, 1.2, 6), createLowPolyMat(0x1e293b));
    pole.position.set(0, 0.6, 0);
    g.add(head, pole);
  }

  // H. Nature & Agriculture (OB-071 to OB-080)
  else if (slug === 'object-apple') {
    const apple = new THREE.Mesh(new THREE.SphereGeometry(1.0, 10, 8), createLowPolyMat(0xdc2626));
    apple.position.set(0, 0.9, 0);
    g.add(apple);
  } else if (slug === 'object-carrot') {
    const carrot = new THREE.Mesh(new THREE.ConeGeometry(0.5, 2.2, 8), createLowPolyMat(0xea580c));
    carrot.rotation.x = Math.PI;
    carrot.position.set(0, 1.0, 0);
    g.add(carrot);
  } else if (slug === 'object-sunflower') {
    const disc = new THREE.Mesh(new THREE.CylinderGeometry(0.6, 0.6, 0.15, 12), createLowPolyMat(0x451a03));
    disc.position.set(0, 1.6, 0);
    const stem = new THREE.Mesh(new THREE.CylinderGeometry(0.08, 0.08, 1.8, 6), createLowPolyMat(0x15803d));
    stem.position.set(0, 0.8, 0);
    g.add(disc, stem);
  } else if (slug === 'object-watering-can') {
    const body = new THREE.Mesh(new THREE.CylinderGeometry(0.7, 0.7, 1.1, 10), createLowPolyMat(0x94a3b8));
    body.position.set(-0.2, 0.6, 0);
    const spout = new THREE.Mesh(new THREE.CylinderGeometry(0.08, 0.15, 1.4, 6), createLowPolyMat(0x94a3b8));
    spout.rotation.z = -0.6;
    spout.position.set(0.6, 0.9, 0);
    g.add(body, spout);
  } else if (slug === 'object-garden-trowel') {
    const blade = new THREE.Mesh(new THREE.ConeGeometry(0.6, 1.4, 3), createLowPolyMat(0xe2e8f0));
    blade.rotation.x = Math.PI / 2;
    blade.position.set(0, 0.3, 0);
    g.add(blade);
  } else if (slug === 'object-seed-sack') {
    const sack = new THREE.Mesh(new THREE.SphereGeometry(0.9, 8, 8), createLowPolyMat(0xd97706));
    sack.scale.set(0.9, 1.3, 0.9);
    sack.position.set(0, 0.8, 0);
    g.add(sack);
  } else if (slug === 'object-wheat-sheaf') {
    const bundle = new THREE.Mesh(new THREE.CylinderGeometry(0.5, 0.7, 2.2, 8), createLowPolyMat(0xfacc15));
    bundle.position.set(0, 1.1, 0);
    g.add(bundle);
  } else if (slug === 'object-honey-jar') {
    const jar = new THREE.Mesh(new THREE.CylinderGeometry(0.75, 0.75, 1.2, 6), createLowPolyMat(0xf59e0b));
    jar.position.set(0, 0.6, 0);
    g.add(jar);
  } else if (slug === 'object-flower-pot') {
    const pot = new THREE.Mesh(new THREE.CylinderGeometry(0.85, 0.6, 1.2, 10), createLowPolyMat(0xc2410c));
    pot.position.set(0, 0.6, 0);
    const sprout = new THREE.Mesh(new THREE.BoxGeometry(0.4, 0.4, 0.1), createLowPolyMat(0x4ade80));
    sprout.position.set(0, 1.3, 0);
    g.add(pot, sprout);
  } else if (slug === 'object-wheelbarrow') {
    const box = new THREE.Mesh(new THREE.BoxGeometry(1.6, 0.6, 1.1), createLowPolyMat(0xb45309));
    box.position.set(0, 0.6, 0);
    g.add(box);
  }

  // I. Business & Commerce (OB-081 to OB-090)
  else if (slug === 'object-briefcase') {
    const caseObj = new THREE.Mesh(new THREE.BoxGeometry(2.0, 1.4, 0.5), createLowPolyMat(0x451a03));
    caseObj.position.set(0, 0.8, 0);
    g.add(caseObj);
  } else if (slug === 'object-barcode-scanner') {
    const scan = new THREE.Mesh(new THREE.BoxGeometry(0.6, 1.4, 0.9), createLowPolyMat(0x1e293b));
    scan.position.set(0, 0.8, 0);
    g.add(scan);
  } else if (slug === 'object-cash-register') {
    const till = new THREE.Mesh(new THREE.BoxGeometry(1.6, 1.4, 1.4), createLowPolyMat(0xd4af37, { metalness: 0.7 }));
    till.position.set(0, 0.7, 0);
    g.add(till);
  } else if (slug === 'object-shopping-cart') {
    const cart = new THREE.Mesh(new THREE.BoxGeometry(1.8, 1.2, 1.2), createLowPolyMat(0x94a3b8));
    cart.position.set(0, 0.9, 0);
    g.add(cart);
  } else if (slug === 'object-coin-stack') {
    for (let i = 0; i < 3; i++) {
      const col = new THREE.Mesh(new THREE.CylinderGeometry(0.5, 0.5, 0.6 + i * 0.4, 12), createLowPolyMat(0xfacc15, { metalness: 0.8 }));
      col.position.set(-0.6 + i * 0.6, (0.6 + i * 0.4) / 2, 0);
      g.add(col);
    }
  } else if (slug === 'object-vault-safe') {
    const safe = new THREE.Mesh(new THREE.BoxGeometry(1.4, 1.6, 1.3), createLowPolyMat(0x1e293b));
    safe.position.set(0, 0.8, 0);
    g.add(safe);
  } else if (slug === 'object-price-tag') {
    const tag = new THREE.Mesh(new THREE.BoxGeometry(1.2, 1.8, 0.08), createLowPolyMat(0xb45309));
    tag.position.set(0, 0.9, 0);
    g.add(tag);
  } else if (slug === 'object-calculator') {
    const calc = new THREE.Mesh(new THREE.BoxGeometry(1.2, 0.2, 1.8), createLowPolyMat(0x334155));
    calc.rotation.x = -0.2;
    calc.position.set(0, 0.4, 0);
    g.add(calc);
  } else if (slug === 'object-piggy-bank') {
    const pig = new THREE.Mesh(new THREE.SphereGeometry(0.9, 10, 8), createLowPolyMat(0xf472b6));
    pig.position.set(0, 0.8, 0);
    g.add(pig);
  } else if (slug === 'object-parcel') {
    const parcel = new THREE.Mesh(new THREE.BoxGeometry(1.6, 1.2, 1.2), createLowPolyMat(0xb45309));
    parcel.position.set(0, 0.6, 0);
    g.add(parcel);
  }

  // J. Energy & Science (OB-091 to OB-100)
  else if (slug === 'object-erlenmeyer-flask') {
    const flask = new THREE.Mesh(new THREE.ConeGeometry(0.9, 1.6, 10), createGlassMat(0xe0f2fe, 0.7));
    flask.position.set(0, 0.8, 0);
    g.add(flask);
  } else if (slug === 'object-atom-model') {
    const nucleus = new THREE.Mesh(new THREE.SphereGeometry(0.4, 8, 8), createLowPolyMat(0xdc2626));
    nucleus.position.set(0, 1.0, 0);
    const ring1 = new THREE.Mesh(new THREE.TorusGeometry(1.1, 0.05, 4, 16), createLowPolyMat(0xd4af37));
    ring1.rotation.x = Math.PI / 3;
    ring1.position.set(0, 1.0, 0);
    const ring2 = new THREE.Mesh(new THREE.TorusGeometry(1.1, 0.05, 4, 16), createLowPolyMat(0xd4af37));
    ring2.rotation.y = Math.PI / 3;
    ring2.position.set(0, 1.0, 0);
    g.add(nucleus, ring1, ring2);
  } else if (slug === 'object-spectroscope') {
    const prism = new THREE.Mesh(new THREE.ConeGeometry(0.8, 1.6, 3), createGlassMat(0xe0f2fe, 0.8));
    prism.position.set(0, 0.8, 0);
    g.add(prism);
  } else if (slug === 'object-horseshoe-magnet') {
    const magnet = new THREE.Mesh(new THREE.TorusGeometry(1.0, 0.28, 6, 12, Math.PI), createLowPolyMat(0xdc2626));
    magnet.position.set(0, 1.1, 0);
    g.add(magnet);
  } else if (slug === 'object-high-voltage-battery') {
    const batt = new THREE.Mesh(new THREE.BoxGeometry(1.8, 1.2, 1.2), createLowPolyMat(0x1e293b));
    batt.position.set(0, 0.6, 0);
    g.add(batt);
  } else if (slug === 'object-spark-generator') {
    const sphere = new THREE.Mesh(new THREE.SphereGeometry(0.8, 12, 10), createLowPolyMat(0xe2e8f0, { metalness: 0.9 }));
    sphere.position.set(0, 1.8, 0);
    const column = new THREE.Mesh(new THREE.CylinderGeometry(0.2, 0.2, 1.4, 8), createGlassMat(0xe0f2fe, 0.6));
    column.position.set(0, 0.8, 0);
    g.add(sphere, column);
  } else if (slug === 'object-test-tube-rack') {
    const rack = new THREE.Mesh(new THREE.BoxGeometry(2.0, 1.0, 0.6), createLowPolyMat(0xb45309));
    rack.position.set(0, 0.5, 0);
    g.add(rack);
  } else if (slug === 'object-refractor-telescope') {
    const tube = new THREE.Mesh(new THREE.CylinderGeometry(0.18, 0.12, 2.4, 8), createLowPolyMat(0xd4af37, { metalness: 0.8 }));
    tube.rotation.z = 0.5;
    tube.position.set(0, 1.4, 0);
    const legs = new THREE.Mesh(new THREE.ConeGeometry(0.8, 1.4, 3, 1, true), createLowPolyMat(0x78350f));
    legs.position.set(0, 0.7, 0);
    g.add(tube, legs);
  } else if (slug === 'object-geiger-counter') {
    const box = new THREE.Mesh(new THREE.BoxGeometry(1.6, 1.0, 1.2), createLowPolyMat(0xeab308));
    box.position.set(0, 0.5, 0);
    g.add(box);
  } else if (slug === 'object-dna-model') {
    for (let i = 0; i < 8; i++) {
      const rung = new THREE.Mesh(new THREE.CylinderGeometry(0.06, 0.06, 1.2, 6), createLowPolyMat(0x0284c7));
      rung.rotation.x = Math.PI / 2;
      rung.rotation.y = (i * Math.PI) / 4;
      rung.position.set(0, 0.3 + i * 0.28, 0);
      g.add(rung);
    }
  } else {
    // Default pure low-poly geometric cube
    const defaultObj = new THREE.Mesh(new THREE.BoxGeometry(1.2, 1.2, 1.2), mat1);
    defaultObj.position.set(0, 0.6, 0);
    g.add(defaultObj);
  }

  return g;
}

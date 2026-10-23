import * as THREE from 'three';
import { IslandMetadata, IslandVariant } from '../../types/island';
import { createGlassMat } from './materials';

function mat(color: number | string, options: Partial<THREE.MeshStandardMaterialParameters> = {}) {
  return new THREE.MeshStandardMaterial({
    color,
    flatShading: true,
    roughness: 0.62,
    metalness: 0.15,
    ...options,
  });
}

/**
 * 3D Builders for 50 Mega-Expo Exhibition Facilities & Racks (OB-151 to OB-200).
 * Pure Standalone Objects: Zero artificial platforms/pedestals.
 * Sits directly on the floor plane.
 */
export function buildExpoFacilityScene(
  island: IslandMetadata,
  variant: IslandVariant
): THREE.Group {
  const g = new THREE.Group();

  const p0 = island.palette[0]?.hex || '#F8FAFC';
  const p1 = island.palette[1]?.hex || '#0284C7';
  const p2 = island.palette[2]?.hex || '#0F172A';
  const p3 = island.palette[3]?.hex || '#38BDF8';

  // Determine sub-category by ID or slug
  const idNum = parseInt(island.id.replace('OB-', ''), 10);

  if (idNum <= 160 || island.slug.includes('podium') || island.slug.includes('stage') || island.slug.includes('island')) {
    // A. 大型博览会展台与模块化岛架 (Expo Exhibition Islands & Modular Podiums, OB-151 to 160)
    const baseDeck = new THREE.Mesh(new THREE.CylinderGeometry(1.2, 1.35, 0.22, 8), mat(p0));
    baseDeck.position.y = 0.11;
    // Illuminated edge rim
    const edgeHalo = new THREE.Mesh(new THREE.TorusGeometry(1.28, 0.04, 6, 16), mat(p1, { emissive: p1, emissiveIntensity: 0.8 }));
    edgeHalo.rotation.x = Math.PI / 2;
    edgeHalo.position.y = 0.11;
    // Central display fixture / riser
    const riser = new THREE.Mesh(new THREE.BoxGeometry(0.9, 0.35, 0.6), mat(p2));
    riser.position.y = 0.395;
    // Clear display acrylic cover
    const acrylic = new THREE.Mesh(new THREE.BoxGeometry(0.7, 0.3, 0.4), createGlassMat(p3, 0.6));
    acrylic.position.y = 0.72;
    g.add(baseDeck, edgeHalo, riser, acrylic);
  } else if (idNum <= 170 || island.slug.includes('truss') || island.slug.includes('gantry') || island.slug.includes('frame')) {
    // B. 重型桁架系统、悬挂门架与天顶灯光网格 (Structural Truss & Overhead Lighting, OB-161 to 170)
    [-0.75, 0.75].forEach((tx) => {
      const leg = new THREE.Mesh(new THREE.CylinderGeometry(0.04, 0.05, 1.8, 6), mat(p0, { metalness: 0.75 }));
      leg.position.set(tx, 0.9, 0);
      const foot = new THREE.Mesh(new THREE.BoxGeometry(0.25, 0.05, 0.25), mat(p2));
      foot.position.set(tx, 0.025, 0);
      g.add(leg, foot);
    });
    // Cross span truss beam
    const topBeam = new THREE.Mesh(new THREE.BoxGeometry(1.7, 0.15, 0.15), mat(p0, { metalness: 0.75 }));
    topBeam.position.set(0, 1.8, 0);
    // Suspended spotlights
    [-0.5, 0, 0.5].forEach((lx) => {
      const spot = new THREE.Mesh(new THREE.CylinderGeometry(0.04, 0.06, 0.14, 6), mat(p1, { emissive: p1 }));
      spot.position.set(lx, 1.68, 0);
      g.add(spot);
    });
    g.add(topBeam);
  } else if (idNum <= 180 || island.slug.includes('led') || island.slug.includes('media') || island.slug.includes('totem') || island.slug.includes('kiosk')) {
    // C. 沉浸式多媒体导览柱、曲面屏与互动数字展桩 (Digital Media Totems & LED Walls, OB-171 to 180)
    const basePlinth = new THREE.Mesh(new THREE.BoxGeometry(0.8, 0.1, 0.4), mat(p2));
    basePlinth.position.y = 0.05;
    // Curved/Angled LED media screen
    const screen = new THREE.Mesh(new THREE.BoxGeometry(0.65, 1.5, 0.08), mat(p1, { emissive: p1, emissiveIntensity: 0.4, roughness: 0.2 }));
    screen.position.set(0, 0.85, 0);
    screen.rotation.x = -0.08;
    // Backing shell
    const shell = new THREE.Mesh(new THREE.BoxGeometry(0.7, 1.52, 0.06), mat(p0));
    shell.position.set(0, 0.85, -0.06);
    shell.rotation.x = -0.08;
    g.add(basePlinth, screen, shell);
  } else if (idNum <= 190 || island.slug.includes('canopy') || island.slug.includes('pavilion') || island.slug.includes('wall') || island.slug.includes('partition')) {
    // D. 展区围合隔断、悬索膜结构与接待洽谈舱 (Acoustic Partitions, Tension Membranes & Booths, OB-181 to 190)
    const backWall = new THREE.Mesh(new THREE.BoxGeometry(1.8, 1.4, 0.08), mat(p0));
    backWall.position.set(0, 0.7, -0.4);
    // Angled fin dividers
    [-0.8, 0.8].forEach((wx) => {
      const fin = new THREE.Mesh(new THREE.BoxGeometry(0.08, 1.4, 0.6), mat(p2));
      fin.position.set(wx, 0.7, -0.1);
      g.add(fin);
    });
    // Reception counter
    const desk = new THREE.Mesh(new THREE.BoxGeometry(1.1, 0.55, 0.4), mat(p1));
    desk.position.set(0, 0.275, 0.2);
    g.add(backWall, desk);
  } else {
    // E. 工业设备重型展台、汽车展架与高空吊挂装置 (Heavy Industrial Rigs & Vehicle Launch Racks, OB-191 to 200)
    const rampBase = new THREE.Mesh(new THREE.BoxGeometry(1.6, 0.18, 1.1), mat(p2));
    rampBase.position.y = 0.09;
    // Incline display runners
    [-0.35, 0.35].forEach((rx) => {
      const runner = new THREE.Mesh(new THREE.BoxGeometry(0.24, 0.1, 1.2), mat(p0, { metalness: 0.8 }));
      runner.position.set(rx, 0.2, 0);
      g.add(runner);
    });
    // Safety barrier stanchions
    [-0.7, 0.7].forEach((bx) => {
      const post = new THREE.Mesh(new THREE.CylinderGeometry(0.03, 0.03, 0.6, 6), mat(p1, { metalness: 0.9 }));
      post.position.set(bx, 0.3, 0.5);
      g.add(post);
    });
    g.add(rampBase);
  }

  return g;
}

/**
 * 3D Builders for 50 Museum Exhibition Decorative Items & Artifacts (OB-201 to OB-250).
 * Authentic masterwork treasures, sculptures, relics, scientific instruments & decorative arts.
 * Pure Standalone Objects: Sits directly on the floor/surface plane.
 */
export function buildMuseumDecorScene(
  island: IslandMetadata,
  variant: IslandVariant
): THREE.Group {
  const g = new THREE.Group();

  const p0 = island.palette[0]?.hex || '#F8FAFC';
  const p1 = island.palette[1]?.hex || '#E2E8F0';
  const p2 = island.palette[2]?.hex || '#94A3B8';
  const p3 = island.palette[3]?.hex || '#D4AF37';

  const idNum = parseInt(island.id.replace('OB-', ''), 10);

  if (idNum <= 210 || island.slug.includes('bust') || island.slug.includes('sculpture') || island.slug.includes('nike') || island.slug.includes('venus') || island.slug.includes('statue')) {
    // A. 古典雕塑、神祇头像与大理石胸像 (Classical Sculptures & Busts, OB-201 to 210)
    // Socle / pedestal base
    const socle = new THREE.Mesh(new THREE.CylinderGeometry(0.25, 0.3, 0.22, 10), mat(p1));
    socle.position.y = 0.11;
    // Torso / body of sculpture
    const torso = new THREE.Mesh(new THREE.BoxGeometry(0.45, 0.7, 0.3), mat(p0));
    torso.position.y = 0.56;
    // Sculpted head / drapery
    const head = new THREE.Mesh(new THREE.DodecahedronGeometry(0.18, 1), mat(p0));
    head.position.y = 1.05;
    // Extended wings or arms
    const wingL = new THREE.Mesh(new THREE.ConeGeometry(0.2, 0.7, 4), mat(p1));
    wingL.rotation.z = 0.6;
    wingL.rotation.y = 0.3;
    wingL.position.set(-0.35, 0.85, -0.15);
    const wingR = new THREE.Mesh(new THREE.ConeGeometry(0.2, 0.7, 4), mat(p1));
    wingR.rotation.z = -0.6;
    wingR.rotation.y = -0.3;
    wingR.position.set(0.35, 0.85, -0.15);
    g.add(socle, torso, head, wingL, wingR);
  } else if (idNum <= 220 || island.slug.includes('vase') || island.slug.includes('urn') || island.slug.includes('amphora') || island.slug.includes('chalice') || island.slug.includes('vessel')) {
    // B. 古代陶瓷、希腊双耳细颈瓶与宫廷金银器皿 (Ceramics, Amphorae & Royal Vessels, OB-211 to 220)
    // Classical Amphora vase with handles
    const vaseFoot = new THREE.Mesh(new THREE.CylinderGeometry(0.18, 0.24, 0.1, 10), mat(p3, { metalness: 0.6 }));
    vaseFoot.position.y = 0.05;
    const vaseBody = new THREE.Mesh(new THREE.SphereGeometry(0.38, 12, 8), mat(p0));
    vaseBody.position.y = 0.45;
    vaseBody.scale.set(1.0, 1.3, 1.0);
    const vaseNeck = new THREE.Mesh(new THREE.CylinderGeometry(0.16, 0.22, 0.35, 10), mat(p0));
    vaseNeck.position.y = 0.95;
    const vaseLip = new THREE.Mesh(new THREE.TorusGeometry(0.18, 0.04, 6, 12), mat(p3, { metalness: 0.6 }));
    vaseLip.rotation.x = Math.PI / 2;
    vaseLip.position.y = 1.12;
    // Twin arching handles
    [-0.36, 0.36].forEach((hx) => {
      const handle = new THREE.Mesh(new THREE.TorusGeometry(0.2, 0.035, 6, 10, Math.PI), mat(p3, { metalness: 0.6 }));
      handle.rotation.z = hx > 0 ? -Math.PI / 2 : Math.PI / 2;
      handle.position.set(hx, 0.7, 0);
      g.add(handle);
    });
    g.add(vaseFoot, vaseBody, vaseNeck, vaseLip);
  } else if (idNum <= 230 || island.slug.includes('crown') || island.slug.includes('relic') || island.slug.includes('mask') || island.slug.includes('tomb') || island.slug.includes('gold')) {
    // C. 黄金宝藏、帝王王冠与宗教圣物箱 (Royal Regalia, Golden Reliquaries & Masks, OB-221 to 230)
    // Elaborate royal crown or reliquary
    const velvetCushion = new THREE.Mesh(new THREE.BoxGeometry(0.65, 0.18, 0.65), mat('#991B1B'));
    velvetCushion.position.y = 0.09;
    // Golden crown circlet
    const crownRing = new THREE.Mesh(new THREE.CylinderGeometry(0.26, 0.26, 0.22, 10, 1, true), mat(p3, { metalness: 0.85, roughness: 0.2 }));
    crownRing.position.y = 0.29;
    // Crown fleur-de-lis points
    for (let f = 0; f < 6; f++) {
      const ang = (f * Math.PI * 2) / 6;
      const point = new THREE.Mesh(new THREE.ConeGeometry(0.06, 0.18, 4), mat(p3, { metalness: 0.85 }));
      point.position.set(Math.cos(ang) * 0.26, 0.48, Math.sin(ang) * 0.26);
      g.add(point);
    }
    // Central glowing jewel
    const gem = new THREE.Mesh(new THREE.OctahedronGeometry(0.08, 0), mat('#DC2626', { roughness: 0.1, metalness: 0.3 }));
    gem.position.set(0, 0.35, 0);
    g.add(velvetCushion, crownRing, gem);
  } else if (idNum <= 240 || island.slug.includes('astrolabe') || island.slug.includes('fossil') || island.slug.includes('skull') || island.slug.includes('meteorite') || island.slug.includes('instrument')) {
    // D. 科学史珍品、古生物化石与黄铜航海天文仪器 (Scientific Instruments & Rare Fossils, OB-231 to 240)
    // Brass Astrolabe / Armillary rings
    const stand = new THREE.Mesh(new THREE.CylinderGeometry(0.05, 0.15, 0.5, 8), mat(p3, { metalness: 0.8 }));
    stand.position.y = 0.25;
    for (let r = 0; r < 3; r++) {
      const ring = new THREE.Mesh(new THREE.TorusGeometry(0.28, 0.025, 6, 16), mat(p3, { metalness: 0.85 }));
      ring.position.y = 0.65;
      ring.rotation.x = r * (Math.PI / 3);
      ring.rotation.y = r * (Math.PI / 4);
      g.add(ring);
    }
    const coreSun = new THREE.Mesh(new THREE.SphereGeometry(0.07, 8, 6), mat(p3, { metalness: 0.9 }));
    coreSun.position.y = 0.65;
    g.add(stand, coreSun);
  } else {
    // E. 东方艺术、青铜礼器与世界传统民族工艺 (Eastern Bronzes, Jade Treasures & Armor, OB-241 to 250)
    // Ancient Chinese Bronze Ding / Ritual vessel with three legs
    const dingBody = new THREE.Mesh(new THREE.CylinderGeometry(0.35, 0.3, 0.35, 10), mat('#0D9488', { metalness: 0.6 }));
    dingBody.position.y = 0.45;
    // Three tripod legs
    for (let l = 0; l < 3; l++) {
      const ang = (l * Math.PI * 2) / 3;
      const leg = new THREE.Mesh(new THREE.CylinderGeometry(0.05, 0.07, 0.3, 6), mat('#0D9488', { metalness: 0.6 }));
      leg.position.set(Math.cos(ang) * 0.25, 0.15, Math.sin(ang) * 0.25);
      g.add(leg);
    }
    // Two loop handles on rim
    [-0.32, 0.32].forEach((hx) => {
      const loop = new THREE.Mesh(new THREE.TorusGeometry(0.09, 0.025, 6, 8, Math.PI), mat('#0D9488', { metalness: 0.6 }));
      loop.rotation.z = Math.PI;
      loop.position.set(hx, 0.68, 0);
      g.add(loop);
    });
    g.add(dingBody);
  }

  return g;
}

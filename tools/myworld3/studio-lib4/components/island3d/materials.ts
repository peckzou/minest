import * as THREE from 'three';

// Low-poly material factory with consistent artistic lighting response
export function createLowPolyMat(
  color: string | number,
  options?: {
    roughness?: number;
    metalness?: number;
    transparent?: boolean;
    opacity?: number;
    emissive?: string | number;
    wireframe?: boolean;
  }
): THREE.MeshStandardMaterial {
  return new THREE.MeshStandardMaterial({
    color: new THREE.Color(color),
    flatShading: true,
    roughness: options?.roughness ?? 0.82,
    metalness: options?.metalness ?? 0.08,
    transparent: options?.transparent ?? false,
    opacity: options?.opacity ?? 1.0,
    emissive: options?.emissive ? new THREE.Color(options.emissive) : new THREE.Color(0x000000),
    wireframe: options?.wireframe ?? false,
  });
}

// Specialized material for translucent water with soft specular highlight
export function createWaterMat(color: string | number = 0x4fa8b8, opacity: number = 0.88): THREE.MeshStandardMaterial {
  return new THREE.MeshStandardMaterial({
    color: new THREE.Color(color),
    flatShading: true,
    roughness: 0.15,
    metalness: 0.12,
    transparent: true,
    opacity,
  });
}

// Specialized material for architectural glass windows and greenhouses
export function createGlassMat(color: string | number = 0xd7eef2, opacity: number = 0.65): THREE.MeshStandardMaterial {
  return new THREE.MeshStandardMaterial({
    color: new THREE.Color(color),
    flatShading: true,
    roughness: 0.1,
    metalness: 0.25,
    transparent: true,
    opacity,
  });
}

// Stylized Tree generator with distinctive species silhouettes
export function createTree(
  type: 'oak' | 'pine' | 'blossom' | 'cypress' | 'willow' | 'maple' | 'birch',
  position: [number, number, number],
  scale: number = 1
): THREE.Group {
  const group = new THREE.Group();
  group.position.set(...position);
  group.scale.set(scale, scale, scale);

  const trunkMat = createLowPolyMat(type === 'birch' ? 0xebe6dd : 0x5a3e28, { roughness: 0.88 });
  const darkWoodMat = createLowPolyMat(0x3e2716, { roughness: 0.9 });

  if (type === 'pine') {
    // Stepped layered conical alpine pine
    const trunk = new THREE.Mesh(new THREE.CylinderGeometry(0.09, 0.16, 1.3, 5), trunkMat);
    trunk.position.y = 0.65;
    trunk.castShadow = true;
    group.add(trunk);

    const foliageMat = createLowPolyMat(0x2f6b45, { roughness: 0.85 });
    const c1 = new THREE.Mesh(new THREE.ConeGeometry(0.9, 1.25, 6), foliageMat);
    c1.position.y = 1.35;
    c1.castShadow = true;
    const c2 = new THREE.Mesh(new THREE.ConeGeometry(0.72, 1.05, 6), foliageMat);
    c2.position.y = 1.95;
    c2.castShadow = true;
    const c3 = new THREE.Mesh(new THREE.ConeGeometry(0.5, 0.85, 6), foliageMat);
    c3.position.y = 2.5;
    c3.castShadow = true;
    group.add(c1, c2, c3);
  } else if (type === 'cypress') {
    // Slender Mediterranean columnar cypress
    const trunk = new THREE.Mesh(new THREE.CylinderGeometry(0.07, 0.12, 0.8, 5), trunkMat);
    trunk.position.y = 0.4;
    group.add(trunk);

    const foliageMat = createLowPolyMat(0x2d5a3c, { roughness: 0.85 });
    const cone = new THREE.Mesh(new THREE.ConeGeometry(0.42, 2.4, 6), foliageMat);
    cone.position.y = 1.6;
    cone.castShadow = true;
    const coneMid = new THREE.Mesh(new THREE.ConeGeometry(0.38, 1.5, 6), foliageMat);
    coneMid.position.y = 2.1;
    coneMid.castShadow = true;
    group.add(cone, coneMid);
  } else if (type === 'willow') {
    // Weeping willow with graceful draped low-poly canopy
    const trunk = new THREE.Mesh(new THREE.CylinderGeometry(0.14, 0.24, 1.4, 5), trunkMat);
    trunk.position.y = 0.7;
    trunk.rotation.z = -0.08;
    trunk.castShadow = true;
    group.add(trunk);

    const foliageMat = createLowPolyMat(0x739e56, { roughness: 0.82 });
    const head = new THREE.Mesh(new THREE.DodecahedronGeometry(0.85, 1), foliageMat);
    head.position.y = 1.7;
    head.castShadow = true;
    group.add(head);

    // Drapes
    for (let i = 0; i < 5; i++) {
      const angle = (i / 5) * Math.PI * 2;
      const drape = new THREE.Mesh(new THREE.ConeGeometry(0.3, 1.3, 4), foliageMat);
      drape.rotation.x = Math.PI;
      drape.position.set(Math.cos(angle) * 0.65, 1.3, Math.sin(angle) * 0.65);
      group.add(drape);
    }
  } else {
    // Oak, Blossom, Maple, or Birch
    const trunk = new THREE.Mesh(new THREE.CylinderGeometry(0.12, 0.22, 1.25, 5), trunkMat);
    trunk.position.y = 0.62;
    trunk.castShadow = true;
    group.add(trunk);

    let leafColor = 0x5fa356;
    if (type === 'blossom') leafColor = 0xf5a3b9;
    if (type === 'maple') leafColor = 0xd9653b;
    if (type === 'birch') leafColor = 0x88b75c;

    const foliageMat = createLowPolyMat(leafColor, { roughness: 0.85 });

    const f1 = new THREE.Mesh(new THREE.DodecahedronGeometry(0.82, 1), foliageMat);
    f1.position.set(0, 1.5, 0);
    f1.castShadow = true;

    const f2 = new THREE.Mesh(new THREE.DodecahedronGeometry(0.6, 1), foliageMat);
    f2.position.set(0.4, 1.75, 0.2);
    f2.castShadow = true;

    const f3 = new THREE.Mesh(new THREE.DodecahedronGeometry(0.55, 1), foliageMat);
    f3.position.set(-0.35, 1.65, -0.25);
    f3.castShadow = true;

    const f4 = new THREE.Mesh(new THREE.DodecahedronGeometry(0.48, 1), foliageMat);
    f4.position.set(0.1, 2.05, -0.15);
    f4.castShadow = true;

    group.add(f1, f2, f3, f4);
  }

  return group;
}

// Low-poly Bush & Shrubs
export function createBush(
  position: [number, number, number],
  scale: number = 0.5,
  color: string | number = 0x629c55
): THREE.Group {
  const g = new THREE.Group();
  g.position.set(...position);
  g.scale.set(scale, scale, scale);

  const mat = createLowPolyMat(color, { roughness: 0.85 });
  const m1 = new THREE.Mesh(new THREE.DodecahedronGeometry(0.65, 0), mat);
  m1.position.set(0, 0.35, 0);
  m1.castShadow = true;

  const m2 = new THREE.Mesh(new THREE.DodecahedronGeometry(0.45, 0), mat);
  m2.position.set(0.3, 0.25, 0.15);
  m2.castShadow = true;

  g.add(m1, m2);
  return g;
}

// Low-poly Flower patch
export function createFlowerPatch(
  position: [number, number, number],
  colors: number[] = [0xffffff, 0xf6d55c, 0xed553b, 0x9b5de5]
): THREE.Group {
  const g = new THREE.Group();
  g.position.set(...position);

  colors.forEach((col, idx) => {
    const mat = createLowPolyMat(col, { roughness: 0.7 });
    const petal = new THREE.Mesh(new THREE.OctahedronGeometry(0.12, 0), mat);
    const angle = (idx / colors.length) * Math.PI * 2;
    const r = 0.22 + (idx % 2) * 0.1;
    petal.position.set(Math.cos(angle) * r, 0.1, Math.sin(angle) * r);
    petal.scale.set(1, 0.5, 1);
    g.add(petal);
  });

  return g;
}

// Low-poly Fluffy Cloud Cluster
export function createCloudCluster(position: [number, number, number], scale: number = 1): THREE.Group {
  const group = new THREE.Group();
  group.position.set(...position);
  group.scale.set(scale, scale, scale);

  const cloudMat = createLowPolyMat(0xf8fafc, {
    roughness: 0.95,
    opacity: 0.94,
    transparent: true,
  });
  const puffGeo = new THREE.DodecahedronGeometry(0.8, 1);

  const p1 = new THREE.Mesh(puffGeo, cloudMat);
  p1.position.set(0, 0, 0);

  const p2 = new THREE.Mesh(puffGeo, cloudMat);
  p2.position.set(0.65, -0.1, 0.2);
  p2.scale.set(0.72, 0.72, 0.72);

  const p3 = new THREE.Mesh(puffGeo, cloudMat);
  p3.position.set(-0.65, -0.12, -0.1);
  p3.scale.set(0.75, 0.75, 0.75);

  const p4 = new THREE.Mesh(puffGeo, cloudMat);
  p4.position.set(0.15, 0.38, -0.15);
  p4.scale.set(0.62, 0.62, 0.62);

  group.add(p1, p2, p3, p4);
  return group;
}

// Low-poly Stepped Staircase
export function createStoneSteps(
  stepsCount: number,
  width: number,
  tread: number,
  riser: number,
  position: [number, number, number],
  rotationY: number = 0,
  color: string | number = 0xd5ccc2
): THREE.Group {
  const g = new THREE.Group();
  g.position.set(...position);
  g.rotation.y = rotationY;

  const mat = createLowPolyMat(color, { roughness: 0.88 });

  for (let i = 0; i < stepsCount; i++) {
    const step = new THREE.Mesh(new THREE.BoxGeometry(width, riser, tread), mat);
    step.position.set(0, (i + 0.5) * riser, i * tread);
    step.castShadow = true;
    step.receiveShadow = true;
    g.add(step);
  }

  return g;
}

// Low-poly Lantern / Street Lamp
export function createLanternPost(
  position: [number, number, number],
  lampColor: number = 0xffe082
): THREE.Group {
  const g = new THREE.Group();
  g.position.set(...position);

  const ironMat = createLowPolyMat(0x333b48, { roughness: 0.6, metalness: 0.4 });
  const post = new THREE.Mesh(new THREE.CylinderGeometry(0.04, 0.06, 1.4, 5), ironMat);
  post.position.y = 0.7;
  post.castShadow = true;

  const lampGlassMat = createLowPolyMat(lampColor, {
    roughness: 0.2,
    emissive: lampColor,
  });
  const lantern = new THREE.Mesh(new THREE.OctahedronGeometry(0.14, 0), lampGlassMat);
  lantern.position.y = 1.35;

  const cap = new THREE.Mesh(new THREE.ConeGeometry(0.18, 0.12, 4), ironMat);
  cap.position.y = 1.5;

  g.add(post, lantern, cap);
  return g;
}

// Low-poly Wooden Fence section
export function createWoodenFence(
  length: number,
  position: [number, number, number],
  rotationY: number = 0,
  woodColor: string | number = 0x825b39
): THREE.Group {
  const g = new THREE.Group();
  g.position.set(...position);
  g.rotation.y = rotationY;

  const woodMat = createLowPolyMat(woodColor, { roughness: 0.85 });
  const railGeo = new THREE.BoxGeometry(length, 0.06, 0.04);

  const rail1 = new THREE.Mesh(railGeo, woodMat);
  rail1.position.y = 0.25;
  const rail2 = new THREE.Mesh(railGeo, woodMat);
  rail2.position.y = 0.45;
  g.add(rail1, rail2);

  const posts = Math.max(2, Math.round(length / 0.8) + 1);
  for (let i = 0; i < posts; i++) {
    const post = new THREE.Mesh(new THREE.BoxGeometry(0.08, 0.6, 0.08), woodMat);
    const x = -length / 2 + (i / (posts - 1)) * length;
    post.position.set(x, 0.3, 0);
    post.castShadow = true;
    g.add(post);
  }

  return g;
}

// Stepped Waterfall Low-Poly Mesh
export function createWaterfallMesh(
  width: number,
  dropHeight: number,
  position: [number, number, number],
  waterColor: string | number = 0x58b4c7
): THREE.Group {
  const g = new THREE.Group();
  g.position.set(...position);

  const waterMat = createWaterMat(waterColor, 0.9);
  const foamMat = createLowPolyMat(0xffffff, { roughness: 0.95, opacity: 0.95 });

  // Fall sheet
  const sheet = new THREE.Mesh(new THREE.BoxGeometry(width, dropHeight, 0.14), waterMat);
  sheet.position.set(0, -dropHeight / 2, 0);
  sheet.castShadow = true;
  g.add(sheet);

  // Top lip spill
  const lip = new THREE.Mesh(new THREE.CylinderGeometry(width / 2, width / 2, 0.12, 6), foamMat);
  lip.rotation.z = Math.PI / 2;
  lip.position.set(0, 0, 0.05);
  g.add(lip);

  // Bottom splash / foam cluster
  for (let i = -1; i <= 1; i++) {
    const splash = new THREE.Mesh(new THREE.DodecahedronGeometry(0.22, 0), foamMat);
    splash.position.set((i * width) / 3, -dropHeight - 0.05, 0.1);
    g.add(splash);
  }

  return g;
}

// Low-Poly Cotton Smoke Puff (for chimneys / smithy)
export function createChimneySmoke(position: [number, number, number]): THREE.Group {
  const g = new THREE.Group();
  g.position.set(...position);

  const smokeMat = createLowPolyMat(0xeff3f6, { roughness: 0.95, opacity: 0.88, transparent: true });

  const p1 = new THREE.Mesh(new THREE.DodecahedronGeometry(0.16, 0), smokeMat);
  p1.position.set(0, 0.1, 0);

  const p2 = new THREE.Mesh(new THREE.DodecahedronGeometry(0.24, 0), smokeMat);
  p2.position.set(0.08, 0.38, 0.04);

  const p3 = new THREE.Mesh(new THREE.DodecahedronGeometry(0.32, 0), smokeMat);
  p3.position.set(-0.06, 0.72, 0.08);

  g.add(p1, p2, p3);
  return g;
}

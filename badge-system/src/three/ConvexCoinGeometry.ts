import * as THREE from 'three';

/**
 * High-Precision Apple Medallion Convex Coin Geometry (外凸曲面硬币/奖章基底)
 *
 * Implements Apple Fitness Award signature convex pebble-crowned medallion geometry:
 * - Group 0: Precision Mirror Bezel Side Wall (Material Index 0)
 * - Group 1: Continuous Outward Curved Convex Crown Front (Material Index 1, 外凸曲面)
 * - Group 2: Outward Curved Ceramic Laser-Engraved Backplate (Material Index 2)
 */
export function createConvexCoinGeometry(
  radius: number = 1.65,
  thickness: number = 0.16,
  domeHeight: number = 0.08,
  backDomeHeight: number = 0.03,
  radialSegments: number = 64,
  rings: number = 24
): THREE.BufferGeometry {
  const geo = new THREE.BufferGeometry();

  const positions: number[] = [];
  const normals: number[] = [];
  const uvs: number[] = [];
  const indices: number[] = [];

  const edgeHalfThickness = Math.max(0.015, thickness * 0.25); // Rim wall thickness (e.g. 0.04)

  // --------------------------------------------------------------------------
  // GROUP 0: Side Bezel Rim Wall (Material Index 0)
  // Connects top rim edge (y = +edgeHalfThickness) to bottom rim edge (y = -edgeHalfThickness)
  // --------------------------------------------------------------------------
  const sideIndexStart = indices.length;
  const sideVertexStart = positions.length / 3;

  for (let s = 0; s <= radialSegments; s++) {
    const theta = (s / radialSegments) * Math.PI * 2;
    const cosT = Math.cos(theta);
    const sinT = Math.sin(theta);
    const x = radius * cosT;
    const z = radius * sinT;

    // Top rim vertex
    positions.push(x, edgeHalfThickness, z);
    normals.push(cosT, 0, sinT);
    uvs.push(s / radialSegments, 1);

    // Bottom rim vertex
    positions.push(x, -edgeHalfThickness, z);
    normals.push(cosT, 0, sinT);
    uvs.push(s / radialSegments, 0);
  }

  for (let s = 0; s < radialSegments; s++) {
    const current = sideVertexStart + s * 2;
    const next = sideVertexStart + (s + 1) * 2;

    const tCurrent = current;
    const bCurrent = current + 1;
    const tNext = next;
    const bNext = next + 1;

    indices.push(tCurrent, bCurrent, bNext);
    indices.push(tCurrent, bNext, tNext);
  }
  const sideIndexCount = indices.length - sideIndexStart;

  // --------------------------------------------------------------------------
  // GROUP 1: Front Convex Outward Dome (Material Index 1) - 外凸弧面
  // Slopes upward from y = edgeHalfThickness at perimeter to y = edgeHalfThickness + domeHeight at center
  // --------------------------------------------------------------------------
  const frontIndexStart = indices.length;
  const frontVertexStart = positions.length / 3;

  // Apex center vertex
  positions.push(0, edgeHalfThickness + domeHeight, 0);
  normals.push(0, 1, 0);
  uvs.push(0.5, 0.5);

  // Concentric rings from center outwards
  for (let r = 1; r <= rings; r++) {
    const frac = r / rings;
    const curRadius = frac * radius;
    // Smooth parabolic crown: rises domeHeight at apex, blends to edgeHalfThickness at rim
    const curY = edgeHalfThickness + (1.0 - frac * frac) * domeHeight;

    // Analytical normal in cylindrical coords:
    // y = edgeHalfThickness + (1 - (r/R)^2) * domeHeight
    // dy/dr = -2 * domeHeight * r / R^2
    const slope = -2.0 * domeHeight * (curRadius / (radius * radius));
    const normalLen = Math.sqrt(slope * slope + 1.0);
    const nRadial = -slope / normalLen; // positive, pointing outwards
    const nY = 1.0 / normalLen;

    for (let s = 0; s < radialSegments; s++) {
      const theta = (s / radialSegments) * Math.PI * 2;
      const cosT = Math.cos(theta);
      const sinT = Math.sin(theta);
      const x = curRadius * cosT;
      const z = curRadius * sinT;

      positions.push(x, curY, z);
      normals.push(nRadial * cosT, nY, nRadial * sinT);

      // Local UV mapping
      uvs.push((x / radius) * 0.5 + 0.5, (z / radius) * 0.5 + 0.5);
    }
  }

  // Ring 0 (Center) to Ring 1 Triangles
  for (let s = 0; s < radialSegments; s++) {
    const next = (s + 1) % radialSegments;
    const vCenter = frontVertexStart;
    const v1 = frontVertexStart + 1 + s;
    const v2 = frontVertexStart + 1 + next;
    indices.push(vCenter, v2, v1);
  }

  // Intermediate Rings Triangles
  for (let r = 1; r < rings; r++) {
    const curRingStart = frontVertexStart + 1 + (r - 1) * radialSegments;
    const nextRingStart = frontVertexStart + 1 + r * radialSegments;

    for (let s = 0; s < radialSegments; s++) {
      const next = (s + 1) % radialSegments;
      const c1 = curRingStart + s;
      const c2 = curRingStart + next;
      const n1 = nextRingStart + s;
      const n2 = nextRingStart + next;

      indices.push(c1, c2, n2);
      indices.push(c1, n2, n1);
    }
  }
  const frontIndexCount = indices.length - frontIndexStart;

  // --------------------------------------------------------------------------
  // GROUP 2: Back Convex Outward Shell (Material Index 2) - 背面微凸弧面
  // Slopes downward from y = -edgeHalfThickness at rim to y = -edgeHalfThickness - backDomeHeight at center
  // --------------------------------------------------------------------------
  const backIndexStart = indices.length;
  const backVertexStart = positions.length / 3;

  // Apex center vertex on reverse
  positions.push(0, -edgeHalfThickness - backDomeHeight, 0);
  normals.push(0, -1, 0);
  uvs.push(0.5, 0.5);

  // Concentric rings from center outwards
  for (let r = 1; r <= rings; r++) {
    const frac = r / rings;
    const curRadius = frac * radius;
    const curY = -edgeHalfThickness - (1.0 - frac * frac) * backDomeHeight;

    const slope = 2.0 * backDomeHeight * (curRadius / (radius * radius));
    const normalLen = Math.sqrt(slope * slope + 1.0);
    const nRadial = slope / normalLen;
    const nY = -1.0 / normalLen;

    for (let s = 0; s < radialSegments; s++) {
      const theta = (s / radialSegments) * Math.PI * 2;
      const cosT = Math.cos(theta);
      const sinT = Math.sin(theta);
      const x = curRadius * cosT;
      const z = curRadius * sinT;

      positions.push(x, curY, z);
      normals.push(nRadial * cosT, nY, nRadial * sinT);

      // Back UV: -x mirrors horizontally so text reads correctly
      uvs.push(-(x / radius) * 0.5 + 0.5, (z / radius) * 0.5 + 0.5);
    }
  }

  // Ring 0 (Center) to Ring 1 Triangles
  for (let s = 0; s < radialSegments; s++) {
    const next = (s + 1) % radialSegments;
    const vCenter = backVertexStart;
    const v1 = backVertexStart + 1 + s;
    const v2 = backVertexStart + 1 + next;
    indices.push(vCenter, v1, v2);
  }

  // Intermediate Rings Triangles
  for (let r = 1; r < rings; r++) {
    const curRingStart = backVertexStart + 1 + (r - 1) * radialSegments;
    const nextRingStart = backVertexStart + 1 + r * radialSegments;

    for (let s = 0; s < radialSegments; s++) {
      const next = (s + 1) % radialSegments;
      const c1 = curRingStart + s;
      const c2 = curRingStart + next;
      const n1 = nextRingStart + s;
      const n2 = nextRingStart + next;

      indices.push(c1, n2, c2);
      indices.push(c1, n1, n2);
    }
  }
  const backIndexCount = indices.length - backIndexStart;

  // Set Attributes
  geo.setAttribute('position', new THREE.Float32BufferAttribute(positions, 3));
  geo.setAttribute('normal', new THREE.Float32BufferAttribute(normals, 3));
  geo.setAttribute('uv', new THREE.Float32BufferAttribute(uvs, 2));
  geo.setIndex(indices);

  // Define Material Groups (Group 0: Side, Group 1: Front, Group 2: Back)
  geo.addGroup(sideIndexStart, sideIndexCount, 0);
  geo.addGroup(frontIndexStart, frontIndexCount, 1);
  geo.addGroup(backIndexStart, backIndexCount, 2);

  return geo;
}

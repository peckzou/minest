import * as THREE from 'three';
import { IslandMetadata, IslandVariant } from '../../types/island';
import { createLowPolyMat, createGlassMat } from './materials';

/**
 * Builds independent 3D modular architecture scenes for the 50 Modular Buildings (BD-01 to BD-50).
 * Per project specifications:
 * - Buildings are NOT permanently attached to island terrain.
 * - Sits cleanly on an architectural slab/footprint.
 * - Reusable across Minest world archipelago compositions.
 */
export function buildModularBuildingScene(
  island: IslandMetadata,
  variant: IslandVariant
): THREE.Group {
  const master = new THREE.Group();

  // Architectural foundation plinth (thin paving slab footprint, no island terrain)
  const slabColor = island.palette[2]?.hex || '#E2E8F0';
  const slabMat = createLowPolyMat(slabColor, { roughness: 0.9 });
  const foundation = new THREE.Mesh(new THREE.BoxGeometry(4.2, 0.2, 4.2), slabMat);
  foundation.position.set(0, 0, 0);
  foundation.receiveShadow = true;
  master.add(foundation);

  const primaryColor = island.palette[0]?.hex || '#0284C7';
  const secondaryColor = island.palette[1]?.hex || '#1E293B';
  const accentColor = island.palette[3]?.hex || '#F59E0B';

  const primaryMat = createLowPolyMat(primaryColor, { roughness: 0.75 });
  const secondaryMat = createLowPolyMat(secondaryColor, { roughness: 0.8 });
  const accentMat = createLowPolyMat(accentColor, { roughness: 0.6 });
  const glassMat = createGlassMat(0x0284c7, 0.65);

  const bldgGroup = new THREE.Group();

  // Specific building typology forms based on slug
  const slug = island.slug;

  if (slug.includes('gym') || slug.includes('fitness') || slug.includes('aquatic') || slug.includes('rink')) {
    // Large sports hall structure with vaulted or curved roof
    const mainHall = new THREE.Mesh(new THREE.BoxGeometry(3.2, 1.6, 2.6), primaryMat);
    mainHall.position.set(0, 0.9, 0);
    mainHall.castShadow = true;
    bldgGroup.add(mainHall);

    const roofVault = new THREE.Mesh(
      new THREE.CylinderGeometry(1.65, 1.65, 3.25, 12, 1, false, 0, Math.PI),
      secondaryMat
    );
    roofVault.rotation.z = Math.PI / 2;
    roofVault.position.set(0, 1.7, 0);
    roofVault.castShadow = true;
    bldgGroup.add(roofVault);

    const entrance = new THREE.Mesh(new THREE.BoxGeometry(1.4, 0.9, 0.6), glassMat);
    entrance.position.set(0, 0.55, 1.4);
    bldgGroup.add(entrance);
  } else if (slug.includes('dojo') || slug.includes('temple')) {
    // Asian timber architecture with flared eaves
    const dojoBody = new THREE.Mesh(new THREE.BoxGeometry(2.4, 1.2, 2.4), secondaryMat);
    dojoBody.position.set(0, 0.7, 0);
    bldgGroup.add(dojoBody);

    const eave1 = new THREE.Mesh(new THREE.ConeGeometry(2.4, 0.8, 4), primaryMat);
    eave1.rotation.y = Math.PI / 4;
    eave1.position.set(0, 1.6, 0);
    eave1.castShadow = true;
    bldgGroup.add(eave1);
  } else if (slug.includes('pizzeria') || slug.includes('bakery') || slug.includes('dessert') || slug.includes('ice-cream') || slug.includes('shop') || slug.includes('boutique') || slug.includes('cafe')) {
    // Retail storefront with projecting awning and display bay
    const shopBody = new THREE.Mesh(new THREE.BoxGeometry(2.6, 1.6, 2.2), secondaryMat);
    shopBody.position.set(0, 0.9, -0.2);
    shopBody.castShadow = true;
    bldgGroup.add(shopBody);

    // Awning
    const awning = new THREE.Mesh(new THREE.BoxGeometry(2.6, 0.15, 0.9), primaryMat);
    awning.rotation.x = 0.25;
    awning.position.set(0, 1.2, 1.1);
    bldgGroup.add(awning);

    // Glass display window
    const windowBay = new THREE.Mesh(new THREE.BoxGeometry(2.2, 0.9, 0.1), glassMat);
    windowBay.position.set(0, 0.65, 0.92);
    bldgGroup.add(windowBay);

    // Signboard
    const sign = new THREE.Mesh(new THREE.BoxGeometry(1.8, 0.4, 0.15), accentMat);
    sign.position.set(0, 1.8, 0.95);
    bldgGroup.add(sign);
  } else if (slug.includes('silo') || slug.includes('mill') || slug.includes('factory') || slug.includes('brewery') || slug.includes('roastery')) {
    // Industrial processing facility with silos / chimneys
    const factoryHall = new THREE.Mesh(new THREE.BoxGeometry(2.6, 1.5, 2.0), primaryMat);
    factoryHall.position.set(-0.4, 0.85, 0);
    factoryHall.castShadow = true;
    bldgGroup.add(factoryHall);

    // Silo cylinder
    const silo = new THREE.Mesh(new THREE.CylinderGeometry(0.7, 0.7, 2.4, 12), createLowPolyMat(0x94a3b8, { metalness: 0.6 }));
    silo.position.set(1.2, 1.3, 0.2);
    silo.castShadow = true;
    bldgGroup.add(silo);

    // Chimney or flue
    const flue = new THREE.Mesh(new THREE.CylinderGeometry(0.18, 0.24, 2.2, 8), secondaryMat);
    flue.position.set(-1.1, 1.8, -0.6);
    bldgGroup.add(flue);
  } else if (slug.includes('hangar') || slug.includes('depot') || slug.includes('terminal') || slug.includes('logistics') || slug.includes('shipyard')) {
    // Broad span transit portal with large bay doors
    const hangarBody = new THREE.Mesh(new THREE.BoxGeometry(3.4, 1.6, 2.6), primaryMat);
    hangarBody.position.set(0, 0.9, 0);
    hangarBody.castShadow = true;
    bldgGroup.add(hangarBody);

    // Roll-up or sliding bay portal
    const bayDoor = new THREE.Mesh(new THREE.BoxGeometry(2.2, 1.1, 0.1), secondaryMat);
    bayDoor.position.set(0, 0.65, 1.32);
    bldgGroup.add(bayDoor);

    const roofGable = new THREE.Mesh(new THREE.ConeGeometry(2.5, 0.8, 4), accentMat);
    roofGable.rotation.y = Math.PI / 4;
    roofGable.position.set(0, 2.0, 0);
    bldgGroup.add(roofGable);
  } else if (slug.includes('solar') || slug.includes('turbine') || slug.includes('hydro') || slug.includes('battery') || slug.includes('semiconductor') || slug.includes('robotics')) {
    // High-tech modern facility with solar arrays or cleanroom volumes
    const techCube = new THREE.Mesh(new THREE.BoxGeometry(2.8, 1.4, 2.4), primaryMat);
    techCube.position.set(0, 0.8, 0);
    techCube.castShadow = true;
    bldgGroup.add(techCube);

    // Rooftop solar or antenna apparatus
    const solarBank = new THREE.Mesh(new THREE.BoxGeometry(2.0, 0.08, 1.4), createLowPolyMat(0x0284c7, { metalness: 0.5 }));
    solarBank.rotation.x = -0.3;
    solarBank.position.set(0, 1.7, 0);
    bldgGroup.add(solarBank);

    const antenna = new THREE.Mesh(new THREE.CylinderGeometry(0.04, 0.08, 1.8, 6), accentMat);
    antenna.position.set(1.0, 2.2, -0.8);
    bldgGroup.add(antenna);
  } else {
    // Standard modernist pavilion / showroom volume
    const mainVolume = new THREE.Mesh(new THREE.BoxGeometry(2.8, 1.6, 2.4), primaryMat);
    mainVolume.position.set(0, 0.9, 0);
    mainVolume.castShadow = true;
    bldgGroup.add(mainVolume);

    const glassAtrium = new THREE.Mesh(new THREE.BoxGeometry(2.0, 1.2, 0.3), glassMat);
    glassAtrium.position.set(0, 0.8, 1.22);
    bldgGroup.add(glassAtrium);

    const roofCap = new THREE.Mesh(new THREE.BoxGeometry(3.0, 0.2, 2.6), secondaryMat);
    roofCap.position.set(0, 1.8, 0);
    bldgGroup.add(roofCap);
  }

  master.add(bldgGroup);
  return master;
}

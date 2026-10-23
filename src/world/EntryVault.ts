import * as THREE from 'three';
import { MaterialFactory } from '../rendering/Materials.js';

export class EntryVault {
  public group = new THREE.Group();
  private mats: MaterialFactory;

  constructor() {
    this.mats = MaterialFactory.getInstance();
    this.buildVault();
  }

  private buildVault(): void {
    const corridorLength = 32;
    const corridorWidth = 8.4;
    const corridorHeight = 6.2;

    // 1. Floor Foundation
    const floorGeo = new THREE.BoxGeometry(corridorWidth, 0.6, corridorLength);
    const floorMesh = new THREE.Mesh(floorGeo, this.mats.concreteMaterial);
    floorMesh.position.set(0, -0.3, -4);
    floorMesh.receiveShadow = true;
    this.group.add(floorMesh);

    // Floor metal expansion seams
    const seamGeo = new THREE.BoxGeometry(corridorWidth, 0.05, 0.15);
    for (let z = 8; z >= -18; z -= 4) {
      const seam = new THREE.Mesh(seamGeo, this.mats.darkMetalMaterial);
      seam.position.set(0, 0.02, z);
      this.group.add(seam);
    }

    // 2. Heavy Ceiling Slabs & Industrial Beams
    const ceilingGeo = new THREE.BoxGeometry(corridorWidth, 0.8, corridorLength);
    const ceilingMesh = new THREE.Mesh(ceilingGeo, this.mats.concreteMaterial);
    ceilingMesh.position.set(0, corridorHeight + 0.4, -4);
    ceilingMesh.receiveShadow = true;
    this.group.add(ceilingMesh);

    // Transverse steel support beams across the ceiling
    const beamGeo = new THREE.BoxGeometry(corridorWidth - 0.4, 0.4, 0.35);
    for (let z = 8; z >= -18; z -= 4) {
      const beam = new THREE.Mesh(beamGeo, this.mats.darkMetalMaterial);
      beam.position.set(0, corridorHeight - 0.2, z);
      beam.castShadow = true;
      this.group.add(beam);
    }

    // Overhead central industrial cable tray
    const trayGeo = new THREE.BoxGeometry(0.8, 0.15, corridorLength - 2);
    const tray = new THREE.Mesh(trayGeo, this.mats.darkMetalMaterial);
    tray.position.set(0, corridorHeight - 0.45, -4);
    this.group.add(tray);

    // 3. Walls (Left & Right)
    const wallGeo = new THREE.BoxGeometry(0.8, corridorHeight, corridorLength);

    const leftWall = new THREE.Mesh(wallGeo, this.mats.concreteMaterial);
    leftWall.position.set(-corridorWidth / 2 - 0.4, corridorHeight / 2, -4);
    leftWall.receiveShadow = true;
    this.group.add(leftWall);

    const rightWall = new THREE.Mesh(wallGeo, this.mats.concreteMaterial);
    rightWall.position.set(corridorWidth / 2 + 0.4, corridorHeight / 2, -4);
    rightWall.receiveShadow = true;
    this.group.add(rightWall);

    // 4. Ribbed Brutalist Structural Pillars along walls
    const pillarGeo = new THREE.BoxGeometry(0.9, corridorHeight, 0.9);
    const pillarCapGeo = new THREE.BoxGeometry(1.2, 0.35, 1.2);

    const pillarZPositions = [8, 4, 0, -4, -8, -12];
    for (const z of pillarZPositions) {
      // Left pillar
      const lPillar = new THREE.Mesh(pillarGeo, this.mats.concreteMaterial);
      lPillar.position.set(-corridorWidth / 2 + 0.45, corridorHeight / 2, z);
      lPillar.castShadow = true;
      lPillar.receiveShadow = true;
      this.group.add(lPillar);

      const lCap = new THREE.Mesh(pillarCapGeo, this.mats.darkMetalMaterial);
      lCap.position.set(-corridorWidth / 2 + 0.45, corridorHeight - 0.17, z);
      this.group.add(lCap);

      // Right pillar
      const rPillar = new THREE.Mesh(pillarGeo, this.mats.concreteMaterial);
      rPillar.position.set(corridorWidth / 2 - 0.45, corridorHeight / 2, z);
      rPillar.castShadow = true;
      rPillar.receiveShadow = true;
      this.group.add(rPillar);

      const rCap = new THREE.Mesh(pillarCapGeo, this.mats.darkMetalMaterial);
      rCap.position.set(corridorWidth / 2 - 0.45, corridorHeight - 0.17, z);
      this.group.add(rCap);
    }

    // 5. Embedded Conduit Tracks with glowing Teal energy conduits along the walls
    const conduitGeo = new THREE.CylinderGeometry(0.06, 0.06, corridorLength - 4, 8);
    conduitGeo.rotateX(Math.PI / 2);

    const lConduit = new THREE.Mesh(conduitGeo, this.mats.darkMetalMaterial);
    lConduit.position.set(-corridorWidth / 2 + 0.15, 1.8, -4);
    this.group.add(lConduit);

    const rConduit = new THREE.Mesh(conduitGeo, this.mats.darkMetalMaterial);
    rConduit.position.set(corridorWidth / 2 - 0.15, 1.8, -4);
    this.group.add(rConduit);

    // 6. Central Shard Pedestal / Altar
    this.buildShardPedestal();

    // 7. Rear Entrance Archway (behind spawn)
    const archTopGeo = new THREE.BoxGeometry(corridorWidth, 2.0, 1.0);
    const archTop = new THREE.Mesh(archTopGeo, this.mats.concreteMaterial);
    archTop.position.set(0, corridorHeight - 1.0, 10);
    this.group.add(archTop);

    const archL = new THREE.Mesh(new THREE.BoxGeometry(2.0, corridorHeight, 1.0), this.mats.concreteMaterial);
    archL.position.set(-3.2, corridorHeight / 2, 10);
    this.group.add(archL);

    const archR = new THREE.Mesh(new THREE.BoxGeometry(2.0, corridorHeight, 1.0), this.mats.concreteMaterial);
    archR.position.set(3.2, corridorHeight / 2, 10);
    this.group.add(archR);
  }

  private buildShardPedestal(): void {
    // Stepped hexagonal/octagonal base
    const baseGeo = new THREE.CylinderGeometry(1.8, 2.2, 0.4, 8);
    const baseMesh = new THREE.Mesh(baseGeo, this.mats.concreteMaterial);
    baseMesh.position.set(0, 0.2, 0);
    baseMesh.receiveShadow = true;
    baseMesh.castShadow = true;
    this.group.add(baseMesh);

    // Upper metal containment ring
    const ringGeo = new THREE.TorusGeometry(1.4, 0.12, 8, 24);
    ringGeo.rotateX(Math.PI / 2);
    const ringMesh = new THREE.Mesh(ringGeo, this.mats.darkMetalMaterial);
    ringMesh.position.set(0, 0.45, 0);
    this.group.add(ringMesh);

    // Glowing ancient glyph disc in the pedestal center
    const glyphDiscGeo = new THREE.CircleGeometry(1.1, 24);
    glyphDiscGeo.rotateX(-Math.PI / 2);
    const glyphMesh = new THREE.Mesh(glyphDiscGeo, this.mats.glyphMaterial);
    glyphMesh.position.set(0, 0.46, 0);
    this.group.add(glyphMesh);

    // 4 Corner containment pylons
    const pylonGeo = new THREE.BoxGeometry(0.2, 0.9, 0.2);
    const angles = [Math.PI / 4, 3 * Math.PI / 4, 5 * Math.PI / 4, 7 * Math.PI / 4];
    for (const ang of angles) {
      const pylon = new THREE.Mesh(pylonGeo, this.mats.darkMetalMaterial);
      pylon.position.set(Math.cos(ang) * 1.5, 0.65, Math.sin(ang) * 1.5);
      pylon.castShadow = true;
      this.group.add(pylon);
    }
  }
}

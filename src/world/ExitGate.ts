import * as THREE from 'three';
import { MaterialFactory } from '../rendering/Materials.js';

export class ExitGate {
  public group = new THREE.Group();
  private mats: MaterialFactory;
  private beaconGlow!: THREE.Mesh;

  constructor() {
    this.mats = MaterialFactory.getInstance();
    this.buildGate();
  }

  private buildGate(): void {
    const gateZ = -15.2;
    const gateWidth = 5.2;
    const gateHeight = 4.8;
    const frameDepth = 0.8;

    // 1. Massive Blast Door Outer Frame (Heavy Brutalist Concrete & Iron)
    const topFrameGeo = new THREE.BoxGeometry(gateWidth + 1.6, 1.2, frameDepth);
    const topFrame = new THREE.Mesh(topFrameGeo, this.mats.darkMetalMaterial);
    topFrame.position.set(0, gateHeight + 0.6, gateZ);
    topFrame.castShadow = true;
    this.group.add(topFrame);

    const lFrameGeo = new THREE.BoxGeometry(0.8, gateHeight + 0.6, frameDepth);
    const lFrame = new THREE.Mesh(lFrameGeo, this.mats.darkMetalMaterial);
    lFrame.position.set(-gateWidth / 2 - 0.4, (gateHeight + 0.6) / 2, gateZ);
    lFrame.castShadow = true;
    this.group.add(lFrame);

    const rFrame = new THREE.Mesh(lFrameGeo, this.mats.darkMetalMaterial);
    rFrame.position.set(gateWidth / 2 + 0.4, (gateHeight + 0.6) / 2, gateZ);
    rFrame.castShadow = true;
    this.group.add(rFrame);

    // 2. Dual Interlocking Monolithic Blast Slabs (Left & Right)
    const slabWidth = gateWidth / 2 - 0.05;
    const slabGeo = new THREE.BoxGeometry(slabWidth, gateHeight, 0.45);

    const leftSlab = new THREE.Mesh(slabGeo, this.mats.gateCoreMaterial);
    leftSlab.position.set(-slabWidth / 2 - 0.02, gateHeight / 2, gateZ);
    leftSlab.castShadow = true;
    leftSlab.receiveShadow = true;
    this.group.add(leftSlab);

    const rightSlab = new THREE.Mesh(slabGeo, this.mats.gateCoreMaterial);
    rightSlab.position.set(slabWidth / 2 + 0.02, gateHeight / 2, gateZ);
    rightSlab.castShadow = true;
    rightSlab.receiveShadow = true;
    this.group.add(rightSlab);

    // 3. Vertical Center Seam & Reinforcement Brackets
    const seamGeo = new THREE.BoxGeometry(0.12, gateHeight, 0.55);
    const centerSeam = new THREE.Mesh(seamGeo, this.mats.darkMetalMaterial);
    centerSeam.position.set(0, gateHeight / 2, gateZ);
    this.group.add(centerSeam);

    // Horizontal reinforcement ridges across doors
    const ridgeGeo = new THREE.BoxGeometry(gateWidth - 0.2, 0.22, 0.52);
    for (const y of [1.2, 2.4, 3.6]) {
      const ridge = new THREE.Mesh(ridgeGeo, this.mats.darkMetalMaterial);
      ridge.position.set(0, y, gateZ);
      this.group.add(ridge);
    }

    // 4. Hydraulic Locking Pistons (Left & Right)
    const pistonGeo = new THREE.CylinderGeometry(0.12, 0.12, 1.0, 12);
    pistonGeo.rotateZ(Math.PI / 2);

    for (const y of [1.8, 3.2]) {
      const lPiston = new THREE.Mesh(pistonGeo, this.mats.darkMetalMaterial);
      lPiston.position.set(-gateWidth / 2 + 0.3, y, gateZ);
      this.group.add(lPiston);

      const rPiston = new THREE.Mesh(pistonGeo, this.mats.darkMetalMaterial);
      rPiston.position.set(gateWidth / 2 - 0.3, y, gateZ);
      this.group.add(rPiston);
    }

    // 5. Floor Hazard Warning Strip at Gate Threshold
    const hazardGeo = new THREE.BoxGeometry(gateWidth + 1.2, 0.04, 1.4);
    const hazardThreshold = new THREE.Mesh(hazardGeo, this.mats.hazardMaterial);
    hazardThreshold.position.set(0, 0.03, gateZ + 0.9);
    hazardThreshold.receiveShadow = true;
    this.group.add(hazardThreshold);

    // 6. Overhead Warning Beacon & Status Display
    const beaconBoxGeo = new THREE.BoxGeometry(1.6, 0.45, 0.3);
    const beaconBox = new THREE.Mesh(beaconBoxGeo, this.mats.darkMetalMaterial);
    beaconBox.position.set(0, gateHeight + 1.45, gateZ + 0.3);
    this.group.add(beaconBox);

    const beaconLightGeo = new THREE.BoxGeometry(1.2, 0.2, 0.1);
    const beaconMat = new THREE.MeshBasicMaterial({
      color: 0xff8800,
      transparent: true,
      opacity: 0.9
    });
    this.beaconGlow = new THREE.Mesh(beaconLightGeo, beaconMat);
    this.beaconGlow.position.set(0, gateHeight + 1.45, gateZ + 0.46);
    this.group.add(this.beaconGlow);

    // 7. Ancient Architectural Seal / Locking Keystone
    const keystoneGeo = new THREE.BoxGeometry(0.9, 0.9, 0.2);
    const keystone = new THREE.Mesh(keystoneGeo, this.mats.glyphMaterial);
    keystone.position.set(0, gateHeight / 2, gateZ + 0.26);
    this.group.add(keystone);
  }

  public update(timeSeconds: number): void {
    // Oscillating amber beacon glow intensity
    const alpha = 0.5 + Math.sin(timeSeconds * 3.0) * 0.45;
    if (this.beaconGlow.material instanceof THREE.MeshBasicMaterial) {
      this.beaconGlow.material.opacity = alpha;
    }
  }
}

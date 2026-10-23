import * as THREE from 'three';
import { MaterialFactory } from '../rendering/Materials.js';

export type GateState = 'locked' | 'opening' | 'open';

export class ExitGate {
  public group = new THREE.Group();
  public state: GateState = 'locked';

  private mats: MaterialFactory;
  private beaconGlow!: THREE.Mesh;
  private beaconMat!: THREE.MeshBasicMaterial;

  private leftSlab!: THREE.Mesh;
  private rightSlab!: THREE.Mesh;
  private centerSeam!: THREE.Mesh;

  private leftPistons: THREE.Mesh[] = [];
  private rightPistons: THREE.Mesh[] = [];

  private openProgress = 0;
  private leftSlabInitialX = 0;
  private rightSlabInitialX = 0;
  private slabSlideDistance = 2.4;

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

    this.leftSlabInitialX = -slabWidth / 2 - 0.02;
    this.leftSlab = new THREE.Mesh(slabGeo, this.mats.gateCoreMaterial);
    this.leftSlab.position.set(this.leftSlabInitialX, gateHeight / 2, gateZ);
    this.leftSlab.castShadow = true;
    this.leftSlab.receiveShadow = true;
    this.group.add(this.leftSlab);

    this.rightSlabInitialX = slabWidth / 2 + 0.02;
    this.rightSlab = new THREE.Mesh(slabGeo, this.mats.gateCoreMaterial);
    this.rightSlab.position.set(this.rightSlabInitialX, gateHeight / 2, gateZ);
    this.rightSlab.castShadow = true;
    this.rightSlab.receiveShadow = true;
    this.group.add(this.rightSlab);

    // 3. Vertical Center Seam & Reinforcement Brackets
    const seamGeo = new THREE.BoxGeometry(0.12, gateHeight, 0.55);
    this.centerSeam = new THREE.Mesh(seamGeo, this.mats.darkMetalMaterial);
    this.centerSeam.position.set(0, gateHeight / 2, gateZ);
    this.group.add(this.centerSeam);

    // Horizontal reinforcement ridges on left slab
    const ridgeLGeo = new THREE.BoxGeometry(slabWidth - 0.1, 0.22, 0.52);
    for (const y of [1.2, 2.4, 3.6]) {
      const ridge = new THREE.Mesh(ridgeLGeo, this.mats.darkMetalMaterial);
      ridge.position.set(0, y - gateHeight / 2, 0.04);
      this.leftSlab.add(ridge);

      const ridgeR = new THREE.Mesh(ridgeLGeo, this.mats.darkMetalMaterial);
      ridgeR.position.set(0, y - gateHeight / 2, 0.04);
      this.rightSlab.add(ridgeR);
    }

    // 4. Hydraulic Locking Pistons (Left & Right)
    const pistonGeo = new THREE.CylinderGeometry(0.12, 0.12, 0.9, 12);
    pistonGeo.rotateZ(Math.PI / 2);

    for (const y of [1.8, 3.2]) {
      const lPiston = new THREE.Mesh(pistonGeo, this.mats.darkMetalMaterial);
      lPiston.position.set(-gateWidth / 2 + 0.35, y, gateZ);
      this.group.add(lPiston);
      this.leftPistons.push(lPiston);

      const rPiston = new THREE.Mesh(pistonGeo, this.mats.darkMetalMaterial);
      rPiston.position.set(gateWidth / 2 - 0.35, y, gateZ);
      this.group.add(rPiston);
      this.rightPistons.push(rPiston);
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
    this.beaconMat = new THREE.MeshBasicMaterial({
      color: 0xff8800,
      transparent: true,
      opacity: 0.9
    });
    this.beaconGlow = new THREE.Mesh(beaconLightGeo, this.beaconMat);
    this.beaconGlow.position.set(0, gateHeight + 1.45, gateZ + 0.46);
    this.group.add(this.beaconGlow);

    // 7. Ancient Architectural Seal / Locking Keystone
    const keystoneGeo = new THREE.BoxGeometry(0.9, 0.9, 0.2);
    const keystone = new THREE.Mesh(keystoneGeo, this.mats.glyphMaterial);
    keystone.position.set(0, gateHeight / 2, gateZ + 0.26);
    this.group.add(keystone);
  }

  /** Trigger blast gate opening sequence */
  public openGate(): void {
    if (this.state !== 'locked') return;
    this.state = 'opening';
    this.openProgress = 0;

    // Switch beacon to active emerald/cyan
    this.beaconMat.color.setHex(0x00f0d2);
  }

  public update(timeSeconds: number, deltaSeconds: number = 0.016): void {
    if (this.state === 'locked') {
      // Oscillating amber beacon glow intensity
      const alpha = 0.5 + Math.sin(timeSeconds * 3.0) * 0.45;
      this.beaconMat.opacity = alpha;
      return;
    }

    if (this.state === 'opening') {
      this.openProgress += deltaSeconds * 0.5; // ~2.0s opening transition
      const t = Math.min(1.0, this.openProgress);

      // Smooth step easing
      const ease = t * t * (3 - 2 * t);

      // 1. First retract hydraulic pistons horizontally outward
      const pistonRetract = Math.min(1.0, t * 2.0) * 0.45;
      for (const p of this.leftPistons) {
        p.position.x = -5.2 / 2 + 0.35 - pistonRetract;
      }
      for (const p of this.rightPistons) {
        p.position.x = 5.2 / 2 - 0.35 + pistonRetract;
      }

      // 2. Slide blast slabs outward
      this.leftSlab.position.x = this.leftSlabInitialX - ease * this.slabSlideDistance;
      this.rightSlab.position.x = this.rightSlabInitialX + ease * this.slabSlideDistance;

      // 3. Fade out center seam
      if (t > 0.1) {
        this.centerSeam.visible = false;
      }

      // Beacon pulses fast cyan
      this.beaconMat.opacity = 0.7 + Math.sin(timeSeconds * 8.0) * 0.3;

      if (this.openProgress >= 1.0) {
        this.state = 'open';
      }
    }
  }
}

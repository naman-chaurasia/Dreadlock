import * as THREE from 'three';
import { MaterialFactory } from '../rendering/Materials.js';

export class EnergyShard {
  public group = new THREE.Group();
  private outerCrystal!: THREE.Mesh;
  private innerCore!: THREE.Mesh;
  private orbitRing1!: THREE.Mesh;
  private orbitRing2!: THREE.Mesh;
  private baseHeight = 2.1;

  constructor() {
    this.buildShard();
  }

  private buildShard(): void {
    const mats = MaterialFactory.getInstance();

    // 1. Outer Translucent Crystalline Shard (Icosahedron)
    const outerGeo = new THREE.IcosahedronGeometry(0.7, 0);
    this.outerCrystal = new THREE.Mesh(outerGeo, mats.shardMaterial);
    this.outerCrystal.castShadow = true;
    this.group.add(this.outerCrystal);

    // 2. Inner Supercharged Energy Core (Octahedron with high teal emissive)
    const innerGeo = new THREE.OctahedronGeometry(0.38, 0);
    const innerMat = new THREE.MeshBasicMaterial({
      color: 0x88ffff,
      wireframe: true
    });
    this.innerCore = new THREE.Mesh(innerGeo, innerMat);
    this.group.add(this.innerCore);

    // 3. Orbiting Containment Ring 1 (Thin Gyroscopic Hoop)
    const ring1Geo = new THREE.TorusGeometry(1.05, 0.03, 6, 32);
    this.orbitRing1 = new THREE.Mesh(ring1Geo, mats.darkMetalMaterial);
    this.group.add(this.orbitRing1);

    // 4. Orbiting Containment Ring 2 (Perpendicular Ring with glowing glyph node)
    const ring2Geo = new THREE.TorusGeometry(1.22, 0.025, 6, 32);
    this.orbitRing2 = new THREE.Mesh(ring2Geo, mats.darkMetalMaterial);
    this.group.add(this.orbitRing2);

    // 5. Vertical Energy Particles / Beams
    const beamGeo = new THREE.CylinderGeometry(0.04, 0.04, 1.8, 6);
    const beamMat = new THREE.MeshBasicMaterial({
      color: 0x00f0d2,
      transparent: true,
      opacity: 0.35
    });
    const verticalBeam = new THREE.Mesh(beamGeo, beamMat);
    this.group.add(verticalBeam);

    // Initial position hovering above the pedestal
    this.group.position.set(0, this.baseHeight, 0);
  }

  public update(timeSeconds: number): void {
    // Smooth vertical levitation / floating bob
    const bob = Math.sin(timeSeconds * 2.2) * 0.12;
    this.group.position.y = this.baseHeight + bob;

    // Complex supernatural tumbling rotation
    this.outerCrystal.rotation.x = timeSeconds * 0.6;
    this.outerCrystal.rotation.y = timeSeconds * 0.9;
    this.outerCrystal.rotation.z = timeSeconds * 0.3;

    // Inner core counter-rotates faster
    this.innerCore.rotation.x = -timeSeconds * 1.5;
    this.innerCore.rotation.y = -timeSeconds * 1.8;

    // Gyroscopic rings rotate on independent orbital planes
    this.orbitRing1.rotation.x = timeSeconds * 0.8;
    this.orbitRing1.rotation.y = timeSeconds * 0.5;

    this.orbitRing2.rotation.y = -timeSeconds * 0.7;
    this.orbitRing2.rotation.z = timeSeconds * 0.9;

    // Pulse scale slightly with supernatural rhythm
    const scalePulse = 1.0 + Math.sin(timeSeconds * 4.0) * 0.04;
    this.outerCrystal.scale.set(scalePulse, scalePulse, scalePulse);
  }
}

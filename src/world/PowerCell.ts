import * as THREE from 'three';
import { MaterialFactory } from '../rendering/Materials.js';

export type CellType = 'CELL_A' | 'CELL_B';

export class PowerCell {
  public group = new THREE.Group();
  public type: CellType;
  public isCollected = false;
  public isInserted = false;

  private innerCore!: THREE.Mesh;
  private glowLight!: THREE.PointLight;
  private baseHeight: number;
  private rotationSpeed = 1.2;

  constructor(type: CellType, position: THREE.Vector3) {
    this.type = type;
    this.baseHeight = position.y;
    this.group.position.copy(position);

    this.buildMesh();
  }

  private buildMesh(): void {
    const mats = MaterialFactory.getInstance();
    const isA = this.type === 'CELL_A';

    const coreColor = isA ? 0xffaa22 : 0x00f0d2;
    const accentColor = isA ? 0xff7700 : 0x00a896;

    // 1. Metal Top & Bottom Endcaps
    const capGeo = new THREE.CylinderGeometry(0.18, 0.18, 0.12, 16);
    const topCap = new THREE.Mesh(capGeo, mats.darkMetalMaterial);
    topCap.position.set(0, 0.35, 0);
    topCap.castShadow = true;
    this.group.add(topCap);

    const bottomCap = new THREE.Mesh(capGeo, mats.darkMetalMaterial);
    bottomCap.position.set(0, -0.35, 0);
    bottomCap.castShadow = true;
    this.group.add(bottomCap);

    // 2. Glass Containment Cylinder
    const glassGeo = new THREE.CylinderGeometry(0.16, 0.16, 0.62, 16);
    const glassMat = new THREE.MeshPhysicalMaterial({
      color: 0xffffff,
      transmission: 0.85,
      opacity: 0.9,
      transparent: true,
      roughness: 0.1,
      ior: 1.5
    });
    const glass = new THREE.Mesh(glassGeo, glassMat);
    this.group.add(glass);

    // 3. Glowing Plasma Core (Octahedron / Cylinder)
    const coreGeo = new THREE.OctahedronGeometry(0.1, 0);
    const coreMat = new THREE.MeshBasicMaterial({ color: coreColor });
    this.innerCore = new THREE.Mesh(coreGeo, coreMat);
    this.group.add(this.innerCore);

    // 4. Central Energy Beam
    const beamGeo = new THREE.CylinderGeometry(0.04, 0.04, 0.58, 8);
    const beamMat = new THREE.MeshBasicMaterial({ color: accentColor });
    const beam = new THREE.Mesh(beamGeo, beamMat);
    this.group.add(beam);

    // 5. Point Light
    this.glowLight = new THREE.PointLight(coreColor, 1.8, 6, 2.0);
    this.group.add(this.glowLight);
  }

  public collect(): void {
    if (this.isCollected) return;
    this.isCollected = true;
    this.group.visible = false;
    this.glowLight.intensity = 0;
  }

  public placeInSocket(socketPosition: THREE.Vector3): void {
    this.isInserted = true;
    this.group.visible = true;
    this.group.position.copy(socketPosition);
    this.group.scale.set(0.85, 0.85, 0.85);
    this.glowLight.intensity = 2.4;
  }

  public update(timeSeconds: number, deltaSeconds: number): void {
    if (this.isCollected && !this.isInserted) return;

    if (!this.isInserted) {
      // Hovering bob when in discovery cradle
      const bob = Math.sin(timeSeconds * 2.5 + (this.type === 'CELL_A' ? 0 : Math.PI)) * 0.06;
      this.group.position.y = this.baseHeight + bob;
    }

    // Continuous core rotation
    this.innerCore.rotation.y += deltaSeconds * this.rotationSpeed * 3.0;
    this.innerCore.rotation.x += deltaSeconds * this.rotationSpeed;
    this.group.rotation.y += deltaSeconds * this.rotationSpeed * 0.6;
  }
}

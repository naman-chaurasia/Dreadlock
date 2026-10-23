import * as THREE from 'three';
import { MaterialFactory } from '../rendering/Materials.js';

export class EntryRelay {
  public group = new THREE.Group();
  public socketAPosition = new THREE.Vector3();
  public socketBPosition = new THREE.Vector3();

  public isCellASeated = false;
  public isCellBSeated = false;
  public isActivated = false;

  private statusDisplay!: THREE.Mesh;
  private statusMat!: THREE.MeshBasicMaterial;
  private leverMesh!: THREE.Mesh;

  constructor(position: THREE.Vector3) {
    this.group.position.copy(position);
    this.buildRelay();
  }

  private buildRelay(): void {
    const mats = MaterialFactory.getInstance();

    // 1. Console Pedestal Base
    const baseGeo = new THREE.BoxGeometry(1.6, 0.85, 0.7);
    const base = new THREE.Mesh(baseGeo, mats.darkMetalMaterial);
    base.position.set(0, 0.425, 0);
    base.castShadow = true;
    base.receiveShadow = true;
    this.group.add(base);

    // 2. Slanted Console Panel Face
    const panelGeo = new THREE.BoxGeometry(1.5, 0.4, 0.6);
    panelGeo.rotateX(-Math.PI / 6);
    const panel = new THREE.Mesh(panelGeo, mats.concreteMaterial);
    panel.position.set(0, 0.95, 0);
    panel.castShadow = true;
    this.group.add(panel);

    // 3. Socket A (Left cylindrical receptacle)
    const socketGeo = new THREE.CylinderGeometry(0.22, 0.22, 0.2, 16);
    const socketA = new THREE.Mesh(socketGeo, mats.darkMetalMaterial);
    socketA.position.set(-0.45, 1.05, 0.05);
    this.group.add(socketA);
    this.socketAPosition.set(
      this.group.position.x - 0.45,
      this.group.position.y + 1.25,
      this.group.position.z + 0.05
    );

    // 4. Socket B (Right cylindrical receptacle)
    const socketB = new THREE.Mesh(socketGeo, mats.darkMetalMaterial);
    socketB.position.set(0.45, 1.05, 0.05);
    this.group.add(socketB);
    this.socketBPosition.set(
      this.group.position.x + 0.45,
      this.group.position.y + 1.25,
      this.group.position.z + 0.05
    );

    // 5. Status Warning Display Panel
    const displayGeo = new THREE.BoxGeometry(0.5, 0.16, 0.02);
    this.statusMat = new THREE.MeshBasicMaterial({ color: 0xff4422 });
    this.statusDisplay = new THREE.Mesh(displayGeo, this.statusMat);
    this.statusDisplay.position.set(0, 1.15, 0.15);
    this.statusDisplay.rotateX(-Math.PI / 6);
    this.group.add(this.statusDisplay);

    // 6. Master Override Breaker Lever
    const leverBaseGeo = new THREE.CylinderGeometry(0.06, 0.06, 0.1, 8);
    const leverBase = new THREE.Mesh(leverBaseGeo, mats.darkMetalMaterial);
    leverBase.position.set(0, 0.95, -0.15);
    this.group.add(leverBase);

    const handleGeo = new THREE.CylinderGeometry(0.03, 0.03, 0.35, 8);
    this.leverMesh = new THREE.Mesh(handleGeo, mats.hazardMaterial);
    this.leverMesh.position.set(0, 0.15, 0);
    this.leverMesh.rotation.z = -0.4;
    leverBase.add(this.leverMesh);
  }

  public seatCell(type: 'CELL_A' | 'CELL_B'): void {
    if (type === 'CELL_A') this.isCellASeated = true;
    if (type === 'CELL_B') this.isCellBSeated = true;

    if (this.isCellASeated && this.isCellBSeated) {
      // Both cells seated: terminal flashes ready cyan
      this.statusMat.color.setHex(0x00f0d2);
    } else {
      // One cell seated: amber standby
      this.statusMat.color.setHex(0xffaa22);
    }
  }

  public activate(): void {
    this.isActivated = true;
    this.leverMesh.rotation.z = 0.4; // Flip lever forward
    this.statusMat.color.setHex(0x22ff88); // Emerald green active
  }

  public update(timeSeconds: number): void {
    if (!this.isActivated) {
      if (this.isCellASeated && this.isCellBSeated) {
        // Fast cyan strobe indicating ready to pull lever
        const pulse = 0.6 + Math.sin(timeSeconds * 8.0) * 0.4;
        this.statusMat.opacity = pulse;
      } else {
        // Slow amber warning pulse
        const pulse = 0.5 + Math.sin(timeSeconds * 2.5) * 0.3;
        this.statusMat.opacity = pulse;
      }
    }
  }
}

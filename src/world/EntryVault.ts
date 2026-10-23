import * as THREE from 'three';
import { MaterialFactory } from '../rendering/Materials.js';
import { AssetLoader } from '../rendering/AssetLoader.js';

export class EntryVault {
  public group = new THREE.Group();
  private mats: MaterialFactory;

  // Segmented wall conduits for sequential power activation
  public conduitMaterials: THREE.MeshStandardMaterial[] = [];
  public conduitLights: THREE.PointLight[] = [];
  public conduitStep = 0;
  public totalConduitSteps = 5;

  // Key interactive prop positions in canonical Entry Vault
  public readonly cellAPosition = new THREE.Vector3(8.0, 0.8, -5.0);
  public readonly cellBPosition = new THREE.Vector3(-7.8, 0.8, 0.0);
  public readonly relayPosition = new THREE.Vector3(0, 0.45, -0.8);

  constructor() {
    this.mats = MaterialFactory.getInstance();
    this.buildVault();
  }

  private buildVault(): void {
    // 1. MAIN HALL
    this.buildMainHall();

    // 2. EAST MAINTENANCE BAY (Houses Power Cell A & Generator)
    this.buildEastMaintenanceBay();

    // 3. WEST ARCHIVE WING (Houses Power Cell B, Server Racks & Alternate Route)
    this.buildWestArchiveWing();

    // 4. CENTRAL ALTAR & PEDESTAL
    this.buildShardPedestal();

    // 5. SEQUENTIAL WALL CONDUITS
    this.buildSegmentedConduits();
  }

  /** Builds the central monumental corridor */
  private buildMainHall(): void {
    const corridorLength = 32;
    const corridorWidth = 8.4;
    const corridorHeight = 6.2;

    // Floor Foundation (Basalt Floor PBR)
    const floorGeo = new THREE.BoxGeometry(corridorWidth, 0.6, corridorLength);
    const floorMesh = new THREE.Mesh(floorGeo, this.mats.basaltFloorMaterial);
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

    // Heavy Ceiling Slabs & Industrial Beams
    const ceilingGeo = new THREE.BoxGeometry(corridorWidth, 0.8, corridorLength);
    const ceilingMesh = new THREE.Mesh(ceilingGeo, this.mats.concreteMaterial);
    ceilingMesh.position.set(0, corridorHeight + 0.4, -4);
    ceilingMesh.receiveShadow = true;
    this.group.add(ceilingMesh);

    // Transverse steel support beams across ceiling
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

    // --- SEGMENTED WALLS WITH DOORWAYS ---

    // RIGHT WALL (East): Opening at Z in [-6.0, -2.5] into East Bay
    // Segment South: Z in [-2.5, 12] (length 14.5m)
    const rightSouthGeo = new THREE.BoxGeometry(0.8, corridorHeight, 14.5);
    const rightSouth = new THREE.Mesh(rightSouthGeo, this.mats.concreteMaterial);
    rightSouth.position.set(corridorWidth / 2 + 0.4, corridorHeight / 2, 4.75);
    rightSouth.receiveShadow = true;
    this.group.add(rightSouth);

    // Doorway Lintel over East Bay entrance (Z in [-6.0, -2.5], height from 3.5 to 6.2)
    const eastLintelGeo = new THREE.BoxGeometry(0.8, corridorHeight - 3.5, 3.5);
    const eastLintel = new THREE.Mesh(eastLintelGeo, this.mats.concreteMaterial);
    eastLintel.position.set(corridorWidth / 2 + 0.4, 3.5 + (corridorHeight - 3.5) / 2, -4.25);
    this.group.add(eastLintel);

    // East Doorway Hazard Frame
    const eastArchTrimGeo = new THREE.BoxGeometry(0.2, 3.5, 0.25);
    const eastArchTrimL = new THREE.Mesh(eastArchTrimGeo, this.mats.hazardMaterial);
    eastArchTrimL.position.set(corridorWidth / 2 + 0.1, 1.75, -2.5);
    this.group.add(eastArchTrimL);
    const eastArchTrimR = new THREE.Mesh(eastArchTrimGeo, this.mats.hazardMaterial);
    eastArchTrimR.position.set(corridorWidth / 2 + 0.1, 1.75, -6.0);
    this.group.add(eastArchTrimR);

    // Segment North: Z in [-20, -6.0] (length 14m)
    const rightNorthGeo = new THREE.BoxGeometry(0.8, corridorHeight, 14.0);
    const rightNorth = new THREE.Mesh(rightNorthGeo, this.mats.concreteMaterial);
    rightNorth.position.set(corridorWidth / 2 + 0.4, corridorHeight / 2, -13.0);
    rightNorth.receiveShadow = true;
    this.group.add(rightNorth);

    // LEFT WALL (West): Two openings into West Archive:
    // Entrance 1 (South): Z in [3.5, 6.5]
    // Entrance 2 (North): Z in [-6.0, -2.5]

    // West South-most Segment: Z in [6.5, 12] (length 5.5m)
    const westSouthGeo = new THREE.BoxGeometry(0.8, corridorHeight, 5.5);
    const westSouth = new THREE.Mesh(westSouthGeo, this.mats.concreteMaterial);
    westSouth.position.set(-corridorWidth / 2 - 0.4, corridorHeight / 2, 9.25);
    westSouth.receiveShadow = true;
    this.group.add(westSouth);

    // West South Lintel (Z in [3.5, 6.5])
    const westSouthLintelGeo = new THREE.BoxGeometry(0.8, corridorHeight - 3.5, 3.0);
    const westSouthLintel = new THREE.Mesh(westSouthLintelGeo, this.mats.concreteMaterial);
    westSouthLintel.position.set(-corridorWidth / 2 - 0.4, 3.5 + (corridorHeight - 3.5) / 2, 5.0);
    this.group.add(westSouthLintel);

    // West Mid Segment: Z in [-2.5, 3.5] (length 6.0m)
    const westMidGeo = new THREE.BoxGeometry(0.8, corridorHeight, 6.0);
    const westMid = new THREE.Mesh(westMidGeo, this.mats.concreteMaterial);
    westMid.position.set(-corridorWidth / 2 - 0.4, corridorHeight / 2, 0.5);
    westMid.receiveShadow = true;
    this.group.add(westMid);

    // West North Lintel (Z in [-6.0, -2.5])
    const westNorthLintelGeo = new THREE.BoxGeometry(0.8, corridorHeight - 3.5, 3.5);
    const westNorthLintel = new THREE.Mesh(westNorthLintelGeo, this.mats.concreteMaterial);
    westNorthLintel.position.set(-corridorWidth / 2 - 0.4, 3.5 + (corridorHeight - 3.5) / 2, -4.25);
    this.group.add(westNorthLintel);

    // West North-most Segment: Z in [-20, -6.0] (length 14.0m)
    const westNorthGeo = new THREE.BoxGeometry(0.8, corridorHeight, 14.0);
    const westNorth = new THREE.Mesh(westNorthGeo, this.mats.concreteMaterial);
    westNorth.position.set(-corridorWidth / 2 - 0.4, corridorHeight / 2, -13.0);
    westNorth.receiveShadow = true;
    this.group.add(westNorth);

    // Ribbed Structural Pillars along Main Hall walls
    const pillarGeo = new THREE.BoxGeometry(0.9, corridorHeight, 0.9);
    const pillarCapGeo = new THREE.BoxGeometry(1.2, 0.35, 1.2);
    const pillarZPositions = [8, 0, -8, -12];

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

    // Rear Entrance Archway (behind spawn)
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

  /** Builds the East Maintenance Bay housing Power Cell A and the heavy generator */
  private buildEastMaintenanceBay(): void {
    const bayWidth = 7.2;   // X in [4.2, 11.4] (center at 7.8)
    const bayLength = 6.4;  // Z in [-8.0, -1.6] (center at -4.8)
    const bayHeight = 5.2;

    // 1. Floor
    const floorGeo = new THREE.BoxGeometry(bayWidth, 0.6, bayLength);
    const floor = new THREE.Mesh(floorGeo, this.mats.basaltFloorMaterial);
    floor.position.set(7.8, -0.3, -4.8);
    floor.receiveShadow = true;
    this.group.add(floor);

    // Metal floor grates
    const grateGeo = new THREE.BoxGeometry(2.4, 0.04, 3.6);
    const grate = new THREE.Mesh(grateGeo, this.mats.darkMetalMaterial);
    grate.position.set(7.8, 0.02, -4.8);
    this.group.add(grate);

    // 2. Ceiling
    const ceilingGeo = new THREE.BoxGeometry(bayWidth, 0.8, bayLength);
    const ceiling = new THREE.Mesh(ceilingGeo, this.mats.concreteMaterial);
    ceiling.position.set(7.8, bayHeight + 0.4, -4.8);
    this.group.add(ceiling);

    // 3. Perimeter Walls
    // North Wall (Z = -8.0)
    const northWallGeo = new THREE.BoxGeometry(bayWidth, bayHeight, 0.8);
    const northWall = new THREE.Mesh(northWallGeo, this.mats.concreteMaterial);
    northWall.position.set(7.8, bayHeight / 2, -8.0);
    northWall.receiveShadow = true;
    this.group.add(northWall);

    // South Wall (Z = -1.6)
    const southWallGeo = new THREE.BoxGeometry(bayWidth, bayHeight, 0.8);
    const southWall = new THREE.Mesh(southWallGeo, this.mats.concreteMaterial);
    southWall.position.set(7.8, bayHeight / 2, -1.6);
    southWall.receiveShadow = true;
    this.group.add(southWall);

    // East Outer Wall (X = 11.4)
    const eastWallGeo = new THREE.BoxGeometry(0.8, bayHeight, bayLength);
    const eastWall = new THREE.Mesh(eastWallGeo, this.mats.concreteMaterial);
    eastWall.position.set(11.4, bayHeight / 2, -4.8);
    eastWall.receiveShadow = true;
    this.group.add(eastWall);

    // 4. Heavy Industrial Generator Prop (At X = 9.8, Z = -3.5)
    this.buildGeneratorProp(new THREE.Vector3(9.8, 0, -3.5));

    // 5. Tool Storage Rack at Back Wall (X = 7.5, Z = -7.4)
    this.buildStorageRack(new THREE.Vector3(7.5, 0, -7.4));

    // 6. Pedestal for Power Cell A (At X = 8.0, Z = -5.0)
    this.buildCellPedestal(new THREE.Vector3(8.0, 0, -5.0), 0xffaa22);

    // 7. Warm Amber Industrial Cage Lamp
    const amberLight = new THREE.PointLight(0xff9900, 2.2, 9, 2.0);
    amberLight.position.set(8.0, 4.2, -5.0);
    this.group.add(amberLight);

    const cageGeo = new THREE.CylinderGeometry(0.2, 0.2, 0.4, 8);
    const cage = new THREE.Mesh(cageGeo, this.mats.darkMetalMaterial);
    cage.position.set(8.0, 4.4, -5.0);
    this.group.add(cage);
  }

  /** Builds the West Archive Wing housing Power Cell B and server rack banks */
  private buildWestArchiveWing(): void {
    const archiveWidth = 7.2;   // X in [-11.4, -4.2] (center at -7.8)
    const archiveLength = 15.0; // Z in [-8.0, 7.0] (center at -0.5)
    const archiveHeight = 5.2;

    // 1. Floor
    const floorGeo = new THREE.BoxGeometry(archiveWidth, 0.6, archiveLength);
    const floor = new THREE.Mesh(floorGeo, this.mats.basaltFloorMaterial);
    floor.position.set(-7.8, -0.3, -0.5);
    floor.receiveShadow = true;
    this.group.add(floor);

    // Floor seam strips
    const seamGeo = new THREE.BoxGeometry(archiveWidth, 0.04, 0.12);
    for (let z = 5; z >= -6; z -= 3) {
      const seam = new THREE.Mesh(seamGeo, this.mats.darkMetalMaterial);
      seam.position.set(-7.8, 0.02, z);
      this.group.add(seam);
    }

    // 2. Ceiling
    const ceilingGeo = new THREE.BoxGeometry(archiveWidth, 0.8, archiveLength);
    const ceiling = new THREE.Mesh(ceilingGeo, this.mats.concreteMaterial);
    ceiling.position.set(-7.8, archiveHeight + 0.4, -0.5);
    this.group.add(ceiling);

    // 3. Perimeter Walls
    // North Wall (Z = -8.0)
    const northWallGeo = new THREE.BoxGeometry(archiveWidth, archiveHeight, 0.8);
    const northWall = new THREE.Mesh(northWallGeo, this.mats.concreteMaterial);
    northWall.position.set(-7.8, archiveHeight / 2, -8.0);
    northWall.receiveShadow = true;
    this.group.add(northWall);

    // South Wall (Z = 7.0)
    const southWallGeo = new THREE.BoxGeometry(archiveWidth, archiveHeight, 0.8);
    const southWall = new THREE.Mesh(southWallGeo, this.mats.concreteMaterial);
    southWall.position.set(-7.8, archiveHeight / 2, 7.0);
    southWall.receiveShadow = true;
    this.group.add(southWall);

    // West Outer Wall (X = -11.4)
    const westWallGeo = new THREE.BoxGeometry(0.8, archiveHeight, archiveLength);
    const westWall = new THREE.Mesh(westWallGeo, this.mats.concreteMaterial);
    westWall.position.set(-11.4, archiveHeight / 2, -0.5);
    westWall.receiveShadow = true;
    this.group.add(westWall);

    // 4. Archive Server Racks Monoliths along West Wall
    const rackGeo = new THREE.BoxGeometry(0.7, 3.8, 1.8);
    const rackZPositions = [4.5, 1.5, -1.5, -4.5];
    for (const z of rackZPositions) {
      const rack = new THREE.Mesh(rackGeo, this.mats.darkMetalMaterial);
      rack.position.set(-10.5, 1.9, z);
      rack.castShadow = true;
      rack.receiveShadow = true;
      this.group.add(rack);

      // Server indicator lights (blinking green/cyan strips)
      const stripGeo = new THREE.BoxGeometry(0.04, 0.15, 1.4);
      const stripMat = new THREE.MeshBasicMaterial({ color: 0x00f0d2 });
      const strip = new THREE.Mesh(stripGeo, stripMat);
      strip.position.set(-10.12, 2.5, z);
      this.group.add(strip);
    }

    // 5. Central Partition Barrier (creating alternate winding route)
    const partitionGeo = new THREE.BoxGeometry(0.4, 3.2, 4.0);
    const partition = new THREE.Mesh(partitionGeo, this.mats.concreteMaterial);
    partition.position.set(-7.8, 1.6, 3.0);
    partition.castShadow = true;
    this.group.add(partition);

    // 6. Pedestal for Power Cell B (At X = -7.8, Z = 0.0)
    this.buildCellPedestal(new THREE.Vector3(-7.8, 0, 0.0), 0x00f0d2);

    // 7. Hazard Shortcut Warning Conduits & Pylons (At X = -6.0, Z in [-4.5, -2.5])
    const pylonGeo = new THREE.BoxGeometry(0.3, 1.8, 0.3);
    const pylon1 = new THREE.Mesh(pylonGeo, this.mats.hazardMaterial);
    pylon1.position.set(-6.0, 0.9, -4.5);
    this.group.add(pylon1);

    const pylon2 = new THREE.Mesh(pylonGeo, this.mats.hazardMaterial);
    pylon2.position.set(-6.0, 0.9, -2.5);
    this.group.add(pylon2);

    // 8. Cyan Overhead Archive Lamp
    const cyanLight = new THREE.PointLight(0x00f0d2, 2.2, 9, 2.0);
    cyanLight.position.set(-7.8, 4.2, 0.0);
    this.group.add(cyanLight);

    const archiveCageGeo = new THREE.CylinderGeometry(0.2, 0.2, 0.4, 8);
    const archiveCage = new THREE.Mesh(archiveCageGeo, this.mats.darkMetalMaterial);
    archiveCage.position.set(-7.8, 4.4, 0.0);
    this.group.add(archiveCage);
  }

  /** Heavy generator landmark prop in East Bay */
  private buildGeneratorProp(pos: THREE.Vector3): void {
    const genGroup = new THREE.Group();
    genGroup.position.copy(pos);

    // Generator Main Housing (Procedural base + Real GLB)
    const bodyGeo = new THREE.BoxGeometry(1.6, 0.4, 2.2);
    const body = new THREE.Mesh(bodyGeo, this.mats.darkMetalMaterial);
    body.position.set(0, 0.2, 0);
    body.castShadow = true;
    body.receiveShadow = true;
    genGroup.add(body);

    // Load real 3D generator model from Kenney kit
    AssetLoader.getInstance().loadModel('/assets/models/props/prop_generator.glb').then((gltf) => {
      if (gltf) {
        const model = gltf.scene;
        model.scale.set(1.4, 1.4, 1.4);
        model.position.set(0, 0.4, 0);
        genGroup.add(model);
      }
    });

    // Load real industrial containment barrels
    AssetLoader.getInstance().loadModel('/assets/models/props/prop_barrels.glb').then((gltf) => {
      if (gltf) {
        const barrels = gltf.scene;
        barrels.scale.set(1.2, 1.2, 1.2);
        barrels.position.set(-1.2, 0, 0.6);
        genGroup.add(barrels);
      }
    });

    // Amber status gauge
    const gaugeGeo = new THREE.BoxGeometry(0.3, 0.3, 0.05);
    const gaugeMat = new THREE.MeshBasicMaterial({ color: 0xffaa22 });
    const gauge = new THREE.Mesh(gaugeGeo, gaugeMat);
    gauge.position.set(-0.5, 1.2, 1.12);
    genGroup.add(gauge);

    this.group.add(genGroup);
  }

  /** Storage shelf in East Bay */
  private buildStorageRack(pos: THREE.Vector3): void {
    const rackGeo = new THREE.BoxGeometry(2.4, 2.4, 0.6);
    const rack = new THREE.Mesh(rackGeo, this.mats.darkMetalMaterial);
    rack.position.set(pos.x, 1.2, pos.z);
    rack.castShadow = true;
    rack.receiveShadow = true;
    this.group.add(rack);

    AssetLoader.getInstance().loadModel('/assets/models/props/prop-storage-shelf.glb').then((gltf) => {
      if (gltf) {
        const shelf = gltf.scene.clone();
        shelf.scale.set(1.4, 1.4, 1.4);
        shelf.position.set(pos.x, 0, pos.z);
        this.group.add(shelf);
        rack.visible = false;
      }
    });
  }


  /** Small stepped stone pedestal for Power Cells */
  private buildCellPedestal(pos: THREE.Vector3, accentColor: number): void {
    const baseGeo = new THREE.CylinderGeometry(0.65, 0.85, 0.5, 8);
    const base = new THREE.Mesh(baseGeo, this.mats.concreteMaterial);
    base.position.set(pos.x, 0.25, pos.z);
    base.castShadow = true;
    base.receiveShadow = true;
    this.group.add(base);

    const ringGeo = new THREE.TorusGeometry(0.5, 0.06, 6, 16);
    ringGeo.rotateX(Math.PI / 2);
    const ringMat = new THREE.MeshStandardMaterial({
      color: 0x11161b,
      emissive: accentColor,
      emissiveIntensity: 0.6,
      roughness: 0.2
    });
    const ring = new THREE.Mesh(ringGeo, ringMat);
    ring.position.set(pos.x, 0.52, pos.z);
    this.group.add(ring);
  }

  /** Segmented sequential conduits running from altar to blast gate */
  private buildSegmentedConduits(): void {
    const corridorWidth = 8.4;
    const segmentLength = 3.0;
    const zStarts = [0, -3, -6, -9, -12];

    for (let i = 0; i < zStarts.length; i++) {
      const zCenter = zStarts[i] - segmentLength / 2;

      const mat = new THREE.MeshStandardMaterial({
        color: 0x11161b,
        emissive: 0x002222,
        emissiveIntensity: 0.1,
        roughness: 0.3,
        metalness: 0.8
      });
      this.conduitMaterials.push(mat);

      const segGeo = new THREE.CylinderGeometry(0.065, 0.065, segmentLength - 0.1, 8);
      segGeo.rotateX(Math.PI / 2);

      const leftSeg = new THREE.Mesh(segGeo, mat);
      leftSeg.position.set(-corridorWidth / 2 + 0.15, 1.8, zCenter);
      this.group.add(leftSeg);

      const rightSeg = new THREE.Mesh(segGeo, mat);
      rightSeg.position.set(corridorWidth / 2 - 0.15, 1.8, zCenter);
      this.group.add(rightSeg);

      const light = new THREE.PointLight(0x00f0d2, 0.0, 6, 2.0);
      light.position.set(0, 1.8, zCenter);
      this.group.add(light);
      this.conduitLights.push(light);
    }
  }

  /** Powers up the next conduit segment along the corridor */
  public activateNextConduitStep(): { step: number; fullyPowered: boolean } {
    if (this.conduitStep < this.conduitMaterials.length) {
      const mat = this.conduitMaterials[this.conduitStep];
      mat.color.setHex(0x00f0d2);
      mat.emissive.setHex(0x00f0d2);
      mat.emissiveIntensity = 1.6;

      const light = this.conduitLights[this.conduitStep];
      light.intensity = 1.4;

      this.conduitStep++;
    }

    const fullyPowered = this.conduitStep >= this.conduitMaterials.length;
    return { step: this.conduitStep, fullyPowered };
  }

  public activateAllConduits(): void {
    for (let i = 0; i < this.conduitMaterials.length; i++) {
      this.conduitMaterials[i].color.setHex(0x00f0d2);
      this.conduitMaterials[i].emissive.setHex(0x00f0d2);
      this.conduitMaterials[i].emissiveIntensity = 1.6;
      this.conduitLights[i].intensity = 1.4;
    }
    this.conduitStep = this.conduitMaterials.length;
  }

  /** Central altar stepped pedestal where Entry Relay sits */
  private buildShardPedestal(): void {
    const baseGeo = new THREE.CylinderGeometry(2.0, 2.5, 0.4, 8);
    const baseMesh = new THREE.Mesh(baseGeo, this.mats.concreteMaterial);
    baseMesh.position.set(0, 0.2, 0);
    baseMesh.receiveShadow = true;
    baseMesh.castShadow = true;
    this.group.add(baseMesh);

    const ringGeo = new THREE.TorusGeometry(1.6, 0.12, 8, 24);
    ringGeo.rotateX(Math.PI / 2);
    const ringMesh = new THREE.Mesh(ringGeo, this.mats.darkMetalMaterial);
    ringMesh.position.set(0, 0.45, 0);
    this.group.add(ringMesh);

    const glyphDiscGeo = new THREE.CircleGeometry(1.3, 24);
    glyphDiscGeo.rotateX(-Math.PI / 2);
    const glyphMesh = new THREE.Mesh(glyphDiscGeo, this.mats.glyphMaterial);
    glyphMesh.position.set(0, 0.46, 0);
    this.group.add(glyphMesh);

    const pylonGeo = new THREE.BoxGeometry(0.2, 0.9, 0.2);
    const angles = [Math.PI / 4, 3 * Math.PI / 4, 5 * Math.PI / 4, 7 * Math.PI / 4];
    for (const ang of angles) {
      const pylon = new THREE.Mesh(pylonGeo, this.mats.darkMetalMaterial);
      pylon.position.set(Math.cos(ang) * 1.8, 0.65, Math.sin(ang) * 1.8);
      pylon.castShadow = true;
      this.group.add(pylon);
    }
  }
}

import * as THREE from 'three';
import { MaterialFactory } from '../rendering/Materials.js';
import { AssetLoader } from '../rendering/AssetLoader.js';

export interface FoundryNode {
  id: 'NODE_A' | 'NODE_B' | 'NODE_C';
  name: string;
  position: THREE.Vector3;
  isRestored: boolean;
  mesh: THREE.Group;
  indicatorLight: THREE.PointLight;
}

export class LivingFoundry {
  public group = new THREE.Group();
  private mats: MaterialFactory;

  // Key interactive positions
  public readonly spawnPosition = new THREE.Vector3(0, 0, 7.5);
  public readonly nodeAPosition = new THREE.Vector3(4.2, 1.2, 5.0);
  public readonly nodeBPosition = new THREE.Vector3(-6.0, 4.4, -1.0);
  public readonly nodeCPosition = new THREE.Vector3(5.5, 1.2, -9.0);
  public readonly liftConsolePosition = new THREE.Vector3(0, 0.45, -1.5);
  public readonly exitThresholdPosition = new THREE.Vector3(0, 0.2, -15.5);

  // Nodes
  public nodes: Record<string, FoundryNode> = {};

  // Service lift platform
  public liftPlatform!: THREE.Group;
  public liftConsoleGroup = new THREE.Group();
  public liftLeverMesh?: THREE.Mesh;
  public isLiftPowered = false;
  public isLiftActive = false;
  public liftProgress = 0; // 0 (docked at core) to 1 (docked at exit)

  // Exit seal door
  public exitDoorL!: THREE.Mesh;
  public exitDoorR!: THREE.Mesh;
  public isExitUnlocked = false;

  constructor() {
    this.mats = MaterialFactory.getInstance();
    this.buildFoundry();
  }

  private buildFoundry(): void {
    // 1. Main chamber shell & floor
    this.buildChamberShell();

    // 2. Colossal Biomechanical Rib Arches
    this.buildBiomechanicalRibs();

    // 3. Central Subterranean Energy Shaft & Molten Pit
    this.buildEnergyShaft();

    // 4. Elevated Assembly Walk (Catwalk) & Staircase
    this.buildAssemblyCatwalk();

    // 5. Pressure Chamber
    this.buildPressureChamber();

    // 6. Lower Intake & Maintenance Bypass
    this.buildMaintenanceBypass();

    // 7. Energy Nodes A, B, C
    this.buildEnergyNodes();

    // 8. Suspended Service Lift & Console
    this.buildServiceLift();

    // 9. North Exit Platform & Blast Seal
    this.buildExitPlatform();
  }

  /** Chamber floor, walls, and ceiling */
  private buildChamberShell(): void {
    const width = 16.0;   // X in [-8, 8]
    const length = 28.0;  // Z in [-18, 10]
    const height = 7.5;

    // Floor (Basalt PBR)
    const floorGeo = new THREE.BoxGeometry(width, 0.6, length);
    const floor = new THREE.Mesh(floorGeo, this.mats.basaltFloorMaterial);
    floor.position.set(0, -0.3, -4.0);
    floor.receiveShadow = true;
    this.group.add(floor);

    // Ceiling Slabs
    const ceilingGeo = new THREE.BoxGeometry(width, 0.8, length);
    const ceiling = new THREE.Mesh(ceilingGeo, this.mats.concreteMaterial);
    ceiling.position.set(0, height + 0.4, -4.0);
    ceiling.receiveShadow = true;
    this.group.add(ceiling);

    // Outer Perimeter Walls
    // South Wall (Z = 10.0)
    const southGeo = new THREE.BoxGeometry(width, height, 0.8);
    const south = new THREE.Mesh(southGeo, this.mats.concreteMaterial);
    south.position.set(0, height / 2, 10.4);
    south.receiveShadow = true;
    this.group.add(south);

    // North Wall (Z = -18.0)
    const northGeo = new THREE.BoxGeometry(width, height, 0.8);
    const north = new THREE.Mesh(northGeo, this.mats.concreteMaterial);
    north.position.set(0, height / 2, -18.4);
    north.receiveShadow = true;
    this.group.add(north);

    // West Wall (X = -8.0)
    const westGeo = new THREE.BoxGeometry(0.8, height, length);
    const west = new THREE.Mesh(westGeo, this.mats.concreteMaterial);
    west.position.set(-8.4, height / 2, -4.0);
    west.receiveShadow = true;
    this.group.add(west);

    // East Wall (X = +8.0)
    const eastGeo = new THREE.BoxGeometry(0.8, height, length);
    const east = new THREE.Mesh(eastGeo, this.mats.concreteMaterial);
    east.position.set(8.4, height / 2, -4.0);
    east.receiveShadow = true;
    this.group.add(east);
  }

  /** Biomechanical curved iron ribs spanning across the ceiling */
  private buildBiomechanicalRibs(): void {
    const ribZPositions = [6, 2, -2, -6, -10, -14];

    for (const z of ribZPositions) {
      const ribGroup = new THREE.Group();
      ribGroup.position.set(0, 0, z);

      // Left curved rib segment
      const archGeo = new THREE.TorusGeometry(8.0, 0.28, 8, 20, Math.PI);
      const arch = new THREE.Mesh(archGeo, this.mats.darkMetalMaterial);
      arch.position.set(0, 0, 0);
      arch.castShadow = true;
      ribGroup.add(arch);

      // Support bracket columns on walls
      const colGeo = new THREE.BoxGeometry(0.6, 7.5, 0.6);
      const colL = new THREE.Mesh(colGeo, this.mats.darkMetalMaterial);
      colL.position.set(-7.8, 3.75, 0);
      colL.castShadow = true;
      ribGroup.add(colL);

      const colR = new THREE.Mesh(colGeo, this.mats.darkMetalMaterial);
      colR.position.set(7.8, 3.75, 0);
      colR.castShadow = true;
      ribGroup.add(colR);

      // Glowing teal fluid conduit running through the rib vertebrae
      const conduitGeo = new THREE.CylinderGeometry(0.08, 0.08, 15.6, 12);
      conduitGeo.rotateZ(Math.PI / 2);
      const conduitMat = new THREE.MeshStandardMaterial({
        color: 0x00f0d2,
        emissive: 0x00f0d2,
        emissiveIntensity: 1.4,
        roughness: 0.2
      });
      const conduit = new THREE.Mesh(conduitGeo, conduitMat);
      conduit.position.set(0, 6.8, 0);
      ribGroup.add(conduit);

      this.group.add(ribGroup);
    }
  }

  /** Central subterranean abyss with radiant teal energy */
  private buildEnergyShaft(): void {
    const pitWidth = 6.4;
    const pitLength = 8.0;
    const pitZ = -4.0;

    // Recessed pit lining
    const pitLiningGeo = new THREE.BoxGeometry(pitWidth, 2.0, pitLength);
    const pitLining = new THREE.Mesh(pitLiningGeo, this.mats.darkMetalMaterial);
    pitLining.position.set(0, -1.0, pitZ);
    this.group.add(pitLining);

    // Glowing subterranean energy core plane
    const coreGeo = new THREE.PlaneGeometry(pitWidth - 0.4, pitLength - 0.4);
    coreGeo.rotateX(-Math.PI / 2);
    const coreMat = new THREE.MeshBasicMaterial({ color: 0x00f0d2 });
    const core = new THREE.Mesh(coreGeo, coreMat);
    core.position.set(0, -1.8, pitZ);
    this.group.add(core);

    // Radiant teal shaft light
    const shaftLight = new THREE.PointLight(0x00f0d2, 2.8, 14, 2.0);
    shaftLight.position.set(0, 0.5, pitZ);
    this.group.add(shaftLight);

    // Heavy iron floor grates across perimeter of shaft
    const grateGeo = new THREE.BoxGeometry(0.8, 0.06, pitLength);
    const grateL = new THREE.Mesh(grateGeo, this.mats.darkMetalMaterial);
    grateL.position.set(-pitWidth / 2 + 0.4, 0.02, pitZ);
    this.group.add(grateL);

    const grateR = new THREE.Mesh(grateGeo, this.mats.darkMetalMaterial);
    grateR.position.set(pitWidth / 2 - 0.4, 0.02, pitZ);
    this.group.add(grateR);
  }

  /** Elevated Assembly Walk (Catwalk) on the West side */
  private buildAssemblyCatwalk(): void {
    const catwalkWidth = 2.8;
    const catwalkLength = 11.0;
    const catwalkHeight = 3.2;

    const catwalkGroup = new THREE.Group();
    catwalkGroup.position.set(-6.2, catwalkHeight, -1.0);

    // Platform deck
    const deckGeo = new THREE.BoxGeometry(catwalkWidth, 0.25, catwalkLength);
    const deck = new THREE.Mesh(deckGeo, this.mats.darkMetalMaterial);
    deck.receiveShadow = true;
    catwalkGroup.add(deck);

    // Safety Railings along the inner edge (facing energy pit)
    const railPostGeo = new THREE.CylinderGeometry(0.04, 0.04, 1.0, 8);
    for (let z = -5.0; z <= 5.0; z += 2.0) {
      const post = new THREE.Mesh(railPostGeo, this.mats.darkMetalMaterial);
      post.position.set(catwalkWidth / 2 - 0.1, 0.5, z);
      catwalkGroup.add(post);
    }

    const handrailGeo = new THREE.CylinderGeometry(0.03, 0.03, catwalkLength, 8);
    handrailGeo.rotateX(Math.PI / 2);
    const handrail = new THREE.Mesh(handrailGeo, this.mats.darkMetalMaterial);
    handrail.position.set(catwalkWidth / 2 - 0.1, 1.0, 0);
    catwalkGroup.add(handrail);

    // Support pillars beneath catwalk
    for (let z = -4.5; z <= 4.5; z += 4.5) {
      const pillarGeo = new THREE.BoxGeometry(0.4, catwalkHeight, 0.4);
      const pillar = new THREE.Mesh(pillarGeo, this.mats.concreteMaterial);
      pillar.position.set(0, -catwalkHeight / 2, z);
      pillar.castShadow = true;
      catwalkGroup.add(pillar);
    }

    this.group.add(catwalkGroup);

    // Industrial Staircase leading up to Catwalk at South-West (Z = 5.0)
    AssetLoader.getInstance().loadModel('/assets/models/props/environment-staircase-segment.glb').then((gltf) => {
      if (gltf) {
        const stairs = gltf.scene.clone();
        stairs.scale.set(1.6, 1.85, 1.8);
        stairs.position.set(-6.2, 0, 4.8);
        stairs.rotation.y = Math.PI;
        this.group.add(stairs);
      }
    });
  }

  /** Pressure Chamber on the North-East */
  private buildPressureChamber(): void {
    const chamberGroup = new THREE.Group();
    chamberGroup.position.set(5.5, 0, -9.0);

    // Circular manifold base
    const baseGeo = new THREE.CylinderGeometry(2.4, 2.6, 0.5, 16);
    const base = new THREE.Mesh(baseGeo, this.mats.concreteMaterial);
    base.position.set(0, 0.25, 0);
    base.receiveShadow = true;
    chamberGroup.add(base);

    // Heavy pressure manifold column
    const colGeo = new THREE.CylinderGeometry(1.2, 1.2, 3.8, 16);
    const col = new THREE.Mesh(colGeo, this.mats.darkMetalMaterial);
    col.position.set(0, 2.15, 0);
    col.castShadow = true;
    chamberGroup.add(col);

    // Amber overhead warning light
    const amberLight = new THREE.PointLight(0xff9900, 2.2, 8, 2.0);
    amberLight.position.set(0, 4.4, 0);
    chamberGroup.add(amberLight);

    // Steam vents
    AssetLoader.getInstance().loadModel('/assets/models/props/trap-steam-vent.glb').then((gltf) => {
      if (gltf) {
        const vent1 = gltf.scene.clone();
        vent1.scale.set(1.4, 1.4, 1.4);
        vent1.position.set(1.5, 0.5, 0);
        chamberGroup.add(vent1);

        const vent2 = gltf.scene.clone();
        vent2.scale.set(1.4, 1.4, 1.4);
        vent2.position.set(-1.5, 0.5, 0);
        vent2.rotation.y = Math.PI;
        chamberGroup.add(vent2);
      }
    });

    this.group.add(chamberGroup);
  }

  /** Lower maintenance bypass with barrels and shelving */
  private buildMaintenanceBypass(): void {
    // Industrial storage shelf
    AssetLoader.getInstance().loadModel('/assets/models/props/prop-storage-shelf.glb').then((gltf) => {
      if (gltf) {
        const shelf = gltf.scene.clone();
        shelf.scale.set(1.4, 1.4, 1.4);
        shelf.position.set(7.2, 0, 1.0);
        this.group.add(shelf);
      }
    });

    // Metal containment barrels
    AssetLoader.getInstance().loadModel('/assets/models/props/prop-metal-barrel.glb').then((gltf) => {
      if (gltf) {
        const barrel1 = gltf.scene.clone();
        barrel1.scale.set(1.3, 1.3, 1.3);
        barrel1.position.set(6.8, 0, -1.2);
        this.group.add(barrel1);

        const barrel2 = gltf.scene.clone();
        barrel2.scale.set(1.3, 1.3, 1.3);
        barrel2.position.set(6.2, 0, -1.6);
        this.group.add(barrel2);
      }
    });
  }

  /** Builds the 3 interactive Energy Nodes (A, B, C) */
  private buildEnergyNodes(): void {
    const nodeDefs: Array<{ id: 'NODE_A' | 'NODE_B' | 'NODE_C'; name: string; pos: THREE.Vector3; color: number }> = [
      { id: 'NODE_A', name: 'NODE 01 // INTAKE CONDUIT', pos: this.nodeAPosition, color: 0xffaa22 },
      { id: 'NODE_B', name: 'NODE 02 // ASSEMBLY WALK', pos: this.nodeBPosition, color: 0x00f0d2 },
      { id: 'NODE_C', name: 'NODE 03 // PRESSURE VESSEL', pos: this.nodeCPosition, color: 0xff4422 }
    ];

    nodeDefs.forEach((def) => {
      const nodeGroup = new THREE.Group();
      nodeGroup.position.copy(def.pos);

      // Console pedestal
      const pedGeo = new THREE.CylinderGeometry(0.45, 0.55, 1.1, 12);
      const ped = new THREE.Mesh(pedGeo, this.mats.darkMetalMaterial);
      ped.position.set(0, -0.45, 0);
      ped.castShadow = true;
      nodeGroup.add(ped);

      // Levitating energy node core (Diamond octahedron)
      const coreGeo = new THREE.OctahedronGeometry(0.22, 0);
      const coreMat = new THREE.MeshStandardMaterial({
        color: 0x11161b,
        emissive: def.color,
        emissiveIntensity: 0.6,
        roughness: 0.2
      });
      const coreMesh = new THREE.Mesh(coreGeo, coreMat);
      coreMesh.position.set(0, 0.35, 0);
      nodeGroup.add(coreMesh);

      // Indicator status light
      const light = new THREE.PointLight(def.color, 0.8, 4.5, 2.0);
      light.position.set(0, 0.5, 0);
      nodeGroup.add(light);

      this.group.add(nodeGroup);

      this.nodes[def.id] = {
        id: def.id,
        name: def.name,
        position: def.pos.clone(),
        isRestored: false,
        mesh: nodeGroup,
        indicatorLight: light
      };
    });
  }

  /** Suspended Service Lift platform & control pedestal */
  private buildServiceLift(): void {
    this.liftPlatform = new THREE.Group();
    this.liftPlatform.position.set(0, 0.15, -4.0);

    // Platform deck
    const deckGeo = new THREE.BoxGeometry(3.4, 0.3, 3.4);
    const deck = new THREE.Mesh(deckGeo, this.mats.darkMetalMaterial);
    deck.receiveShadow = true;
    deck.castShadow = true;
    this.liftPlatform.add(deck);

    // Hazard striped edge border
    const stripeGeo = new THREE.BoxGeometry(3.4, 0.05, 0.2);
    const stripeF = new THREE.Mesh(stripeGeo, this.mats.hazardMaterial);
    stripeF.position.set(0, 0.16, 1.6);
    this.liftPlatform.add(stripeF);

    const stripeB = new THREE.Mesh(stripeGeo, this.mats.hazardMaterial);
    stripeB.position.set(0, 0.16, -1.6);
    this.liftPlatform.add(stripeB);

    // 4 Corner suspension cable anchor pylons
    const pylonGeo = new THREE.CylinderGeometry(0.06, 0.06, 1.4, 8);
    const cornerPositions = [
      [-1.5, 1.5],
      [1.5, 1.5],
      [-1.5, -1.5],
      [1.5, -1.5]
    ];

    cornerPositions.forEach(([x, z]) => {
      const pylon = new THREE.Mesh(pylonGeo, this.mats.darkMetalMaterial);
      pylon.position.set(x, 0.7, z);
      this.liftPlatform.add(pylon);

      // Cable running up to ceiling
      const cableGeo = new THREE.CylinderGeometry(0.02, 0.02, 6.0, 6);
      const cable = new THREE.Mesh(cableGeo, this.mats.darkMetalMaterial);
      cable.position.set(x, 3.7, z);
      this.liftPlatform.add(cable);
    });

    this.group.add(this.liftPlatform);

    // Service Lift Console Pedestal on the south landing
    this.liftConsoleGroup.position.copy(this.liftConsolePosition);

    const consoleBaseGeo = new THREE.BoxGeometry(1.4, 0.9, 0.6);
    const consoleBase = new THREE.Mesh(consoleBaseGeo, this.mats.darkMetalMaterial);
    consoleBase.position.set(0, 0.45, 0);
    consoleBase.castShadow = true;
    this.liftConsoleGroup.add(consoleBase);

    // Real control panel GLB
    AssetLoader.getInstance().loadModel('/assets/models/props/interactable-control-panel.glb').then((gltf) => {
      if (gltf) {
        const panel = gltf.scene.clone();
        panel.scale.set(1.2, 1.2, 1.2);
        panel.position.set(0, 0.9, 0);
        this.liftConsoleGroup.add(panel);
      }
    });

    this.group.add(this.liftConsoleGroup);
  }

  /** North Exit Platform & Blast Seal Threshold */
  private buildExitPlatform(): void {
    const exitGroup = new THREE.Group();
    exitGroup.position.copy(this.exitThresholdPosition);

    // Platform base
    const platGeo = new THREE.BoxGeometry(6.0, 0.4, 4.0);
    const plat = new THREE.Mesh(platGeo, this.mats.concreteMaterial);
    plat.receiveShadow = true;
    exitGroup.add(plat);

    // Blast door outer frame
    const frameGeo = new THREE.BoxGeometry(5.2, 4.5, 0.8);
    const frame = new THREE.Mesh(frameGeo, this.mats.darkMetalMaterial);
    frame.position.set(0, 2.25, -1.6);
    exitGroup.add(frame);

    // Dual blast slabs
    const slabGeo = new THREE.BoxGeometry(1.8, 3.8, 0.4);
    this.exitDoorL = new THREE.Mesh(slabGeo, this.mats.concreteMaterial);
    this.exitDoorL.position.set(-1.0, 2.0, -1.6);
    exitGroup.add(this.exitDoorL);

    this.exitDoorR = new THREE.Mesh(slabGeo, this.mats.concreteMaterial);
    this.exitDoorR.position.set(1.0, 2.0, -1.6);
    exitGroup.add(this.exitDoorR);

    // Keystone exit seal glyph disc
    const glyphGeo = new THREE.CircleGeometry(0.8, 24);
    const glyphMat = new THREE.MeshBasicMaterial({ color: 0x00f0d2 });
    const glyph = new THREE.Mesh(glyphGeo, glyphMat);
    glyph.position.set(0, 2.2, -1.35);
    exitGroup.add(glyph);

    this.group.add(exitGroup);
  }

  /** Restores an Energy Node */
  public restoreNode(nodeId: 'NODE_A' | 'NODE_B' | 'NODE_C'): boolean {
    const node = this.nodes[nodeId];
    if (!node || node.isRestored) return false;

    node.isRestored = true;
    node.indicatorLight.color.setHex(0x00f0d2);
    node.indicatorLight.intensity = 2.2;

    const allRestored = Object.values(this.nodes).every((n) => n.isRestored);
    if (allRestored) {
      this.isLiftPowered = true;
    }
    return allRestored;
  }

  /** Activates the service lift to traverse across the chasm */
  public activateServiceLift(): void {
    if (!this.isLiftPowered || this.isLiftActive) return;
    this.isLiftActive = true;
  }

  /** Frame update for moving lift, steam venting, and node rotations */
  public update(deltaSeconds: number): void {
    // 1. Rotate Node cores
    Object.values(this.nodes).forEach((n) => {
      n.mesh.children[1].rotation.y += deltaSeconds * 1.5;
      n.mesh.children[1].rotation.x += deltaSeconds * 0.8;
    });

    // 2. Animate Service Lift traversing to Exit Platform
    if (this.isLiftActive && this.liftProgress < 1.0) {
      this.liftProgress = Math.min(1.0, this.liftProgress + deltaSeconds * 0.22);
      // Lerp from Z = -4.0 to Z = -13.5
      const currentZ = THREE.MathUtils.lerp(-4.0, -13.5, this.liftProgress);
      this.liftPlatform.position.z = currentZ;

      if (this.liftProgress >= 1.0) {
        this.isExitUnlocked = true;
      }
    }

    // 3. Slide exit blast doors open when unlocked
    if (this.isExitUnlocked && this.exitDoorL.position.x > -2.2) {
      this.exitDoorL.position.x -= deltaSeconds * 1.5;
      this.exitDoorR.position.x += deltaSeconds * 1.5;
    }
  }
}

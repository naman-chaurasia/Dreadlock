import * as THREE from 'three';
import { MaterialFactory } from '../rendering/Materials.js';
import { AssetLoader } from '../rendering/AssetLoader.js';

export interface ObservatorySymbol {
  id: 'SYMBOL_A' | 'SYMBOL_B' | 'SYMBOL_C';
  name: string;
  position: THREE.Vector3;
  isAligned: boolean;
  mesh: THREE.Group;
  indicatorLight: THREE.PointLight;
  beamMesh?: THREE.Mesh;
}

export class Observatory {
  public group = new THREE.Group();
  private mats: MaterialFactory;

  // Key interactive positions
  public readonly spawnPosition = new THREE.Vector3(0, 0, 9.5);
  public readonly orreryCenter = new THREE.Vector3(0, 0.6, 0);
  public readonly symbolAPosition = new THREE.Vector3(-9.2, 0.9, 2.0);   // Lower Gallery (West)
  public readonly symbolBPosition = new THREE.Vector3(9.5, 0.9, -2.5);   // Across Rotating Bridge (East)
  public readonly symbolCPosition = new THREE.Vector3(7.2, 4.5, 6.0);    // Upper Ring Catwalk (South-East)
  public readonly sealConsolePosition = new THREE.Vector3(0, 0.8, 2.4);  // Central Orrery Dais (South side of Orrery)
  public readonly exitThresholdPosition = new THREE.Vector3(0, 0.2, -12.5); // North Void Portal

  // Symbols
  public symbols: Record<string, ObservatorySymbol> = {};

  // Central Orrery
  public orreryGroup = new THREE.Group();
  public orreryRings: THREE.Mesh[] = [];
  public orreryCore!: THREE.Mesh;
  public orreryCoreLight!: THREE.PointLight;
  public sealConsoleGroup = new THREE.Group();

  // Rotating Bridge
  public rotatingBridgeGroup = new THREE.Group();
  public bridgeAngle = 0;
  public isBridgeAligned = true;

  // Exit Portal
  public exitPortalGroup = new THREE.Group();
  public exitPortalAperture!: THREE.Mesh;
  public exitPortalLight!: THREE.PointLight;
  public isSealActivated = false;
  public isExitUnlocked = false;

  // Starfield
  private starParticles!: THREE.Points;
  private particlePositions!: Float32Array;

  constructor() {
    this.mats = MaterialFactory.getInstance();
    this.buildObservatory();
  }

  private buildObservatory(): void {
    // 1. Perimeter Basalt Chamber Shell & Dome
    this.buildChamberShell();

    // 2. Central Elevated Dais & Mechanical Orrery
    this.buildCentralOrrery();

    // 3. Lower Gallery & Symbol A (Astrolabe)
    this.buildLowerGallery();

    // 4. East Chasm, Rotating Bridge & Symbol B (Prism)
    this.buildRotatingBridgeAndEastPlatform();

    // 5. Upper Ring Catwalk, Staircase & Symbol C (Starlight Lens)
    this.buildUpperCatwalk();

    // 6. North Monumental Exit Seal Portal
    this.buildExitSealPortal();

    // 7. Constellation Starfield Ceiling
    this.buildStarfieldCeiling();

    // 8. Load Prop Models (Staircase, Consoles)
    this.loadPropModels();
  }

  /** Segmented circular chamber with monolithic basalt walls and starlight slits */
  private buildChamberShell(): void {
    const wallRadius = 14.0;
    const wallHeight = 9.5;
    const numSegments = 16;
    const segmentAngle = (Math.PI * 2) / numSegments;

    // Floor: Dark hexagonal/segmented stone floor
    const floorGeo = new THREE.CylinderGeometry(wallRadius + 0.5, wallRadius + 0.5, 0.4, numSegments);
    const floorMesh = new THREE.Mesh(floorGeo, this.mats.basaltFloorMaterial);
    floorMesh.position.y = -0.2;
    floorMesh.receiveShadow = true;
    this.group.add(floorMesh);

    // Ceiling dome / upper roof ring
    const ceilingGeo = new THREE.CylinderGeometry(wallRadius, wallRadius + 0.5, 0.4, numSegments);
    const ceilingMesh = new THREE.Mesh(ceilingGeo, this.mats.concreteMaterial);
    ceilingMesh.position.y = wallHeight;
    this.group.add(ceilingMesh);

    // Segmented perimeter walls with vertical starlight slits
    for (let i = 0; i < numSegments; i++) {
      const angle = i * segmentAngle;
      const x = Math.sin(angle) * wallRadius;
      const z = Math.cos(angle) * wallRadius;

      // Don't place a solid wall segment directly at the North exit portal (Z = -14)
      if (Math.abs(angle - Math.PI) < 0.25) continue;

      const wallGeo = new THREE.BoxGeometry(5.4, wallHeight, 0.8);
      const wallMesh = new THREE.Mesh(wallGeo, this.mats.concreteMaterial);
      wallMesh.position.set(x, wallHeight / 2, z);
      wallMesh.rotation.y = angle;
      wallMesh.receiveShadow = true;
      this.group.add(wallMesh);

      // Vertical Starlight Slit with cold indigo/cyan emissive backlight
      if (i % 2 === 0) {
        const slitGeo = new THREE.BoxGeometry(0.15, wallHeight * 0.7, 0.85);
        const slitMat = new THREE.MeshBasicMaterial({
          color: 0x4488ff,
          wireframe: false
        });
        const slitMesh = new THREE.Mesh(slitGeo, slitMat);
        slitMesh.position.set(x * 0.98, wallHeight / 2, z * 0.98);
        slitMesh.rotation.y = angle;
        this.group.add(slitMesh);
      }
    }

    // Atmospheric Cold Starlight Lighting
    const celestialAmbience = new THREE.AmbientLight(0x182442, 1.4);
    this.group.add(celestialAmbience);

    const downStarlight = new THREE.DirectionalLight(0x77aaff, 1.2);
    downStarlight.position.set(0, 12, 0);
    downStarlight.target.position.set(0, 0, 0);
    this.group.add(downStarlight);
    this.group.add(downStarlight.target);

    // Accent amber maintenance lights along outer rim
    const amberPositions = [
      new THREE.Vector3(-11, 2.5, 7),
      new THREE.Vector3(11, 2.5, 7),
      new THREE.Vector3(-11, 2.5, -7),
      new THREE.Vector3(11, 2.5, -7)
    ];
    for (const pos of amberPositions) {
      const light = new THREE.PointLight(0xff9922, 1.6, 9.0);
      light.position.copy(pos);
      this.group.add(light);

      // Light housing fixture
      const fixtureGeo = new THREE.CylinderGeometry(0.12, 0.18, 0.4, 8);
      const fixtureMesh = new THREE.Mesh(fixtureGeo, this.mats.hazardMaterial);
      fixtureMesh.position.copy(pos);
      this.group.add(fixtureMesh);
    }
  }

  /** Central elevated stone dais with multi-ring mechanical astronomical orrery */
  private buildCentralOrrery(): void {
    // 1. Circular Stepped Dais (Radius 4.0m, Height 0.6m)
    const daisGeo = new THREE.CylinderGeometry(4.0, 4.4, 0.6, 24);
    const daisMesh = new THREE.Mesh(daisGeo, this.mats.basaltFloorMaterial);
    daisMesh.position.set(0, 0.3, 0);
    daisMesh.receiveShadow = true;
    this.group.add(daisMesh);

    // Decorative brass inlay ring on dais
    const brassRingGeo = new THREE.TorusGeometry(3.6, 0.06, 8, 32);
    const brassMat = new THREE.MeshStandardMaterial({
      color: 0xd4af37,
      metalness: 0.85,
      roughness: 0.3
    });
    const brassRing = new THREE.Mesh(brassRingGeo, brassMat);
    brassRing.rotation.x = Math.PI / 2;
    brassRing.position.set(0, 0.61, 0);
    this.group.add(brassRing);

    // 2. Central Pedestal
    const baseGeo = new THREE.CylinderGeometry(1.2, 1.6, 0.8, 12);
    const baseMesh = new THREE.Mesh(baseGeo, this.mats.darkMetalMaterial);
    baseMesh.position.set(0, 0.8, 0);
    this.orreryGroup.add(baseMesh);

    // 3. Concentric Orrery Gyroscopic Rings
    const ringSpecs = [
      { radius: 2.6, tube: 0.05, rotX: 0.4, rotY: 0.2, color: 0x8899aa },
      { radius: 2.1, tube: 0.045, rotX: -0.6, rotY: 0.8, color: 0xd4af37 },
      { radius: 1.6, tube: 0.04, rotX: 1.1, rotY: -0.4, color: 0x44aacc }
    ];

    for (const spec of ringSpecs) {
      const ringGeo = new THREE.TorusGeometry(spec.radius, spec.tube, 8, 48);
      const ringMat = new THREE.MeshStandardMaterial({
        color: spec.color,
        metalness: 0.9,
        roughness: 0.25
      });
      const ringMesh = new THREE.Mesh(ringGeo, ringMat);
      ringMesh.rotation.set(spec.rotX, spec.rotY, 0);
      this.orreryRings.push(ringMesh);
      this.orreryGroup.add(ringMesh);
    }

    // 4. Inner Pulsating Celestial Energy Core (Icosahedron)
    const coreGeo = new THREE.IcosahedronGeometry(0.65, 1);
    const coreMat = new THREE.MeshStandardMaterial({
      color: 0x66ccff,
      emissive: new THREE.Color(0x3388ff),
      emissiveIntensity: 1.5,
      roughness: 0.1,
      metalness: 0.2,
      wireframe: true
    });
    this.orreryCore = new THREE.Mesh(coreGeo, coreMat);
    this.orreryCore.position.set(0, 2.2, 0);
    this.orreryGroup.add(this.orreryCore);

    this.orreryCoreLight = new THREE.PointLight(0x55aaff, 3.5, 12.0);
    this.orreryCoreLight.position.set(0, 2.2, 0);
    this.orreryGroup.add(this.orreryCoreLight);

    this.group.add(this.orreryGroup);

    // 5. Central Seal Console on South Dais
    this.buildSealConsole();
  }

  private buildSealConsole(): void {
    this.sealConsoleGroup.position.copy(this.sealConsolePosition);

    const consoleBaseGeo = new THREE.BoxGeometry(1.2, 0.8, 0.6);
    const consoleBaseMesh = new THREE.Mesh(consoleBaseGeo, this.mats.darkMetalMaterial);
    consoleBaseMesh.position.y = 0.4;
    this.sealConsoleGroup.add(consoleBaseMesh);

    // Tactile console panel face
    const panelGeo = new THREE.BoxGeometry(1.0, 0.04, 0.5);
    const panelMat = new THREE.MeshStandardMaterial({
      color: 0x223344,
      metalness: 0.8,
      roughness: 0.4
    });
    const panelMesh = new THREE.Mesh(panelGeo, panelMat);
    panelMesh.position.set(0, 0.82, 0);
    panelMesh.rotation.x = -0.3;
    this.sealConsoleGroup.add(panelMesh);

    // Status indicator light
    const sealLight = new THREE.PointLight(0xff4422, 1.2, 4.0);
    sealLight.position.set(0, 1.1, 0);
    this.sealConsoleGroup.add(sealLight);

    this.group.add(this.sealConsoleGroup);
  }

  /** Lower Gallery (West) and Symbol A (Alpha Astrolabe) */
  private buildLowerGallery(): void {
    // Gallery Floor Extension
    const galleryGeo = new THREE.BoxGeometry(6.0, 0.3, 7.0);
    const galleryMesh = new THREE.Mesh(galleryGeo, this.mats.basaltFloorMaterial);
    galleryMesh.position.set(-9.5, 0.15, 2.0);
    galleryMesh.receiveShadow = true;
    this.group.add(galleryMesh);

    // Guardrail along inner edge
    const railGeo = new THREE.BoxGeometry(0.12, 1.0, 6.8);
    const railMesh = new THREE.Mesh(railGeo, this.mats.darkMetalMaterial);
    railMesh.position.set(-6.6, 0.65, 2.0);
    this.group.add(railMesh);

    // Symbol A Pedestal
    const nodeGroup = new THREE.Group();
    nodeGroup.position.copy(this.symbolAPosition);

    const pedestalGeo = new THREE.CylinderGeometry(0.5, 0.65, 1.1, 8);
    const pedestalMesh = new THREE.Mesh(pedestalGeo, this.mats.darkMetalMaterial);
    pedestalMesh.position.y = 0.55;
    nodeGroup.add(pedestalMesh);

    // Rotating Astrolabe Ring
    const astrolabeGeo = new THREE.TorusGeometry(0.42, 0.035, 6, 24);
    const astrolabeMat = new THREE.MeshStandardMaterial({
      color: 0x33ccff,
      emissive: new THREE.Color(0x114488),
      metalness: 0.9,
      roughness: 0.2
    });
    const astrolabeMesh = new THREE.Mesh(astrolabeGeo, astrolabeMat);
    astrolabeMesh.position.set(0, 1.2, 0);
    astrolabeMesh.rotation.x = Math.PI / 4;
    nodeGroup.add(astrolabeMesh);

    const light = new THREE.PointLight(0x00d4ff, 1.8, 6.0);
    light.position.set(0, 1.4, 0);
    nodeGroup.add(light);

    this.group.add(nodeGroup);

    this.symbols.SYMBOL_A = {
      id: 'SYMBOL_A',
      name: 'SYMBOL ALPHA // LOWER ASTROLABE',
      position: this.symbolAPosition.clone(),
      isAligned: false,
      mesh: nodeGroup,
      indicatorLight: light
    };
  }

  /** East Chasm, Rotating Bridge & Symbol B (Beta Prism) */
  private buildRotatingBridgeAndEastPlatform(): void {
    // 1. East Chasm Void (a sunken dark floor pit beneath the bridge)
    const chasmGeo = new THREE.BoxGeometry(7.0, 4.0, 8.0);
    const chasmMat = new THREE.MeshBasicMaterial({ color: 0x04060c });
    const chasmMesh = new THREE.Mesh(chasmGeo, chasmMat);
    chasmMesh.position.set(6.0, -2.0, -2.5);
    this.group.add(chasmMesh);

    // 2. East Isolation Platform
    const platformGeo = new THREE.CylinderGeometry(3.2, 3.4, 0.5, 16);
    const platformMesh = new THREE.Mesh(platformGeo, this.mats.basaltFloorMaterial);
    platformMesh.position.set(9.5, 0.25, -2.5);
    platformMesh.receiveShadow = true;
    this.group.add(platformMesh);

    // 3. Rotating Bridge Segment
    // Pivot is at X = 3.6, Z = -2.5, spans length 5.6m towards East platform
    this.rotatingBridgeGroup.position.set(3.6, 0.35, -2.5);

    const bridgeDeckGeo = new THREE.BoxGeometry(5.2, 0.25, 2.0);
    const bridgeDeck = new THREE.Mesh(bridgeDeckGeo, this.mats.darkMetalMaterial);
    bridgeDeck.position.set(2.6, 0, 0); // centered along X extension
    bridgeDeck.receiveShadow = true;
    this.rotatingBridgeGroup.add(bridgeDeck);

    // Bridge Guardrails
    const railNorthGeo = new THREE.BoxGeometry(5.2, 0.9, 0.08);
    const railNorth = new THREE.Mesh(railNorthGeo, this.mats.hazardMaterial);
    railNorth.position.set(2.6, 0.55, 0.95);
    this.rotatingBridgeGroup.add(railNorth);

    const railSouthGeo = new THREE.BoxGeometry(5.2, 0.9, 0.08);
    const railSouth = new THREE.Mesh(railSouthGeo, this.mats.hazardMaterial);
    railSouth.position.set(2.6, 0.55, -0.95);
    this.rotatingBridgeGroup.add(railSouth);

    this.group.add(this.rotatingBridgeGroup);

    // 4. Symbol B Pedestal on East Platform
    const nodeGroup = new THREE.Group();
    nodeGroup.position.copy(this.symbolBPosition);

    const pedestalGeo = new THREE.CylinderGeometry(0.5, 0.65, 1.1, 8);
    const pedestalMesh = new THREE.Mesh(pedestalGeo, this.mats.darkMetalMaterial);
    pedestalMesh.position.y = 0.55;
    nodeGroup.add(pedestalMesh);

    // Astronomical Prism (Octahedron crystal)
    const prismGeo = new THREE.OctahedronGeometry(0.38, 0);
    const prismMat = new THREE.MeshStandardMaterial({
      color: 0x9944ff,
      emissive: new THREE.Color(0x441188),
      metalness: 0.8,
      roughness: 0.2
    });
    const prismMesh = new THREE.Mesh(prismGeo, prismMat);
    prismMesh.position.set(0, 1.3, 0);
    nodeGroup.add(prismMesh);

    const light = new THREE.PointLight(0xa355ff, 1.8, 6.0);
    light.position.set(0, 1.5, 0);
    nodeGroup.add(light);

    this.group.add(nodeGroup);

    this.symbols.SYMBOL_B = {
      id: 'SYMBOL_B',
      name: 'SYMBOL BETA // EAST PRISM',
      position: this.symbolBPosition.clone(),
      isAligned: false,
      mesh: nodeGroup,
      indicatorLight: light
    };
  }

  /** Upper Ring Catwalk, Staircase & Symbol C (Gamma Lens) */
  private buildUpperCatwalk(): void {
    // 1. Curved Elevated Catwalk at Y = 3.6m spanning South-East arc
    const catwalkGeo = new THREE.BoxGeometry(10.0, 0.25, 2.2);
    const catwalkMesh = new THREE.Mesh(catwalkGeo, this.mats.darkMetalMaterial);
    catwalkMesh.position.set(5.5, 3.6, 6.0);
    catwalkMesh.rotation.y = -Math.PI / 6;
    catwalkMesh.receiveShadow = true;
    this.group.add(catwalkMesh);

    // Catwalk support pillars from ground Y=0 to Y=3.6
    const pillarSpecs = [
      new THREE.Vector3(2.5, 1.8, 7.5),
      new THREE.Vector3(5.5, 1.8, 6.0),
      new THREE.Vector3(8.5, 1.8, 4.2)
    ];
    for (const spec of pillarSpecs) {
      const pGeo = new THREE.CylinderGeometry(0.2, 0.25, 3.6, 8);
      const pMesh = new THREE.Mesh(pGeo, this.mats.darkMetalMaterial);
      pMesh.position.copy(spec);
      this.group.add(pMesh);
    }

    // 2. Straight Staircase Segment from (0, 0, 8.5) to (2.5, 3.6, 7.5)
    const stairGeo = new THREE.BoxGeometry(1.8, 0.2, 0.45);
    const numSteps = 12;
    for (let i = 0; i < numSteps; i++) {
      const t = i / (numSteps - 1);
      const stepMesh = new THREE.Mesh(stairGeo, this.mats.darkMetalMaterial);
      stepMesh.position.set(
        THREE.MathUtils.lerp(0.5, 2.5, t),
        THREE.MathUtils.lerp(0.2, 3.5, t),
        THREE.MathUtils.lerp(8.8, 7.5, t)
      );
      stepMesh.rotation.y = -0.3;
      stepMesh.receiveShadow = true;
      this.group.add(stepMesh);
    }

    // 3. Symbol C Pedestal on Upper Catwalk
    const nodeGroup = new THREE.Group();
    nodeGroup.position.copy(this.symbolCPosition);

    const pedestalGeo = new THREE.CylinderGeometry(0.45, 0.55, 1.0, 8);
    const pedestalMesh = new THREE.Mesh(pedestalGeo, this.mats.darkMetalMaterial);
    pedestalMesh.position.y = 0.5;
    nodeGroup.add(pedestalMesh);

    // Telescopic Lens
    const lensGeo = new THREE.CylinderGeometry(0.25, 0.35, 0.6, 12);
    const lensMat = new THREE.MeshStandardMaterial({
      color: 0x44ffaa,
      emissive: new THREE.Color(0x116633),
      metalness: 0.8,
      roughness: 0.25
    });
    const lensMesh = new THREE.Mesh(lensGeo, lensMat);
    lensMesh.position.set(0, 1.15, 0);
    lensMesh.rotation.x = Math.PI / 4;
    lensMesh.rotation.y = -Math.PI / 3;
    nodeGroup.add(lensMesh);

    const light = new THREE.PointLight(0x44ffaa, 1.8, 6.0);
    light.position.set(0, 1.35, 0);
    nodeGroup.add(light);

    this.group.add(nodeGroup);

    this.symbols.SYMBOL_C = {
      id: 'SYMBOL_C',
      name: 'SYMBOL GAMMA // HIGH LENS',
      position: this.symbolCPosition.clone(),
      isAligned: false,
      mesh: nodeGroup,
      indicatorLight: light
    };
  }

  /** Monumental Exit Seal Portal at North perimeter */
  private buildExitSealPortal(): void {
    this.exitPortalGroup.position.set(0, 0, -12.5);

    // Portal Monumental Arch Columns (Left and Right)
    const colGeo = new THREE.BoxGeometry(1.2, 5.5, 1.2);
    const colL = new THREE.Mesh(colGeo, this.mats.concreteMaterial);
    colL.position.set(-2.4, 2.75, 0);
    this.exitPortalGroup.add(colL);

    const colR = new THREE.Mesh(colGeo, this.mats.concreteMaterial);
    colR.position.set(2.4, 2.75, 0);
    this.exitPortalGroup.add(colR);

    // Top Lintel with celestial runic engraving
    const lintelGeo = new THREE.BoxGeometry(6.0, 1.4, 1.4);
    const lintel = new THREE.Mesh(lintelGeo, this.mats.concreteMaterial);
    lintel.position.set(0, 5.5, 0);
    this.exitPortalGroup.add(lintel);

    // Outer Celestial Gyro Arch
    const gyroArchGeo = new THREE.TorusGeometry(2.2, 0.12, 8, 32);
    const gyroArchMat = new THREE.MeshStandardMaterial({
      color: 0xd4af37,
      metalness: 0.85,
      roughness: 0.3
    });
    const gyroArch = new THREE.Mesh(gyroArchGeo, gyroArchMat);
    gyroArch.position.set(0, 2.5, 0);
    this.exitPortalGroup.add(gyroArch);

    // Portal Aperture Membrane (Translucent celestial barrier that dissolves upon activation)
    const apertureGeo = new THREE.CircleGeometry(2.1, 24);
    const apertureMat = new THREE.MeshBasicMaterial({
      color: 0x3366cc,
      transparent: true,
      opacity: 0.65,
      side: THREE.DoubleSide
    });
    this.exitPortalAperture = new THREE.Mesh(apertureGeo, apertureMat);
    this.exitPortalAperture.position.set(0, 2.5, 0);
    this.exitPortalGroup.add(this.exitPortalAperture);

    this.exitPortalLight = new THREE.PointLight(0x3377ff, 2.5, 10.0);
    this.exitPortalLight.position.set(0, 2.5, 1.0);
    this.exitPortalGroup.add(this.exitPortalLight);

    this.group.add(this.exitPortalGroup);
  }

  /** Starfield Ceiling with 450 cold starlight particles */
  private buildStarfieldCeiling(): void {
    const starCount = 450;
    const geo = new THREE.BufferGeometry();
    this.particlePositions = new Float32Array(starCount * 3);

    for (let i = 0; i < starCount; i++) {
      // Distribute stars across the upper hemisphere/cylinder
      const angle = Math.random() * Math.PI * 2;
      const radius = Math.random() * 13.5;
      const x = Math.sin(angle) * radius;
      const z = Math.cos(angle) * radius;
      const y = 7.0 + Math.random() * 2.4;

      this.particlePositions[i * 3] = x;
      this.particlePositions[i * 3 + 1] = y;
      this.particlePositions[i * 3 + 2] = z;
    }

    geo.setAttribute('position', new THREE.BufferAttribute(this.particlePositions, 3));

    const starMat = new THREE.PointsMaterial({
      color: 0x88ccff,
      size: 0.12,
      transparent: true,
      opacity: 0.85
    });

    this.starParticles = new THREE.Points(geo, starMat);
    this.group.add(this.starParticles);
  }

  /** Load 3D props from Starter 3D Pack */
  private loadPropModels(): void {
    const loader = AssetLoader.getInstance();

    // 1. Control panel at Central Seal Console
    loader.loadModel('models/props/interactable-control-panel.glb').then((gltf) => {
      if (!gltf) return;
      const panel = gltf.scene.clone();
      panel.scale.set(0.7, 0.7, 0.7);
      panel.position.set(0, 0.45, 0.2);
      panel.rotation.y = Math.PI;
      this.sealConsoleGroup.add(panel);
    }).catch(() => {
      console.log('[Observatory] Using procedural seal console fallback');
    });

    // 2. Metal barrels & crates as route landmarks in Lower Gallery
    loader.loadModel('models/props/prop_barrels.glb').then((gltf) => {
      if (!gltf) return;
      const barrels = gltf.scene.clone();
      barrels.scale.set(0.65, 0.65, 0.65);
      barrels.position.set(-8.0, 0.2, 5.2);
      this.group.add(barrels);
    }).catch(() => {});

    loader.loadModel('models/props/prop-crate.glb').then((gltf) => {
      if (!gltf) return;
      const crate = gltf.scene.clone();
      crate.scale.set(0.8, 0.8, 0.8);
      crate.position.set(9.0, 0.3, -4.5);
      this.group.add(crate);
    }).catch(() => {});
  }

  /** Connect a vibrant celestial alignment beam between symbol console and central orrery */
  public alignSymbol(symbolId: 'SYMBOL_A' | 'SYMBOL_B' | 'SYMBOL_C'): void {
    const sym = this.symbols[symbolId];
    if (!sym || sym.isAligned) return;

    sym.isAligned = true;
    sym.indicatorLight.color.setHex(0xffcc00); // Shift from cold blue/purple to gold alignment
    sym.indicatorLight.intensity = 3.5;

    // Create celestial alignment laser beam to Orrery core
    const start = sym.position.clone().add(new THREE.Vector3(0, 1.2, 0));
    const end = this.orreryCenter.clone().add(new THREE.Vector3(0, 2.2, 0));
    const dist = start.distanceTo(end);

    const beamGeo = new THREE.CylinderGeometry(0.04, 0.04, dist, 8);
    const beamMat = new THREE.MeshBasicMaterial({
      color: 0x88ddff,
      transparent: true,
      opacity: 0.75
    });
    const beam = new THREE.Mesh(beamGeo, beamMat);

    // Align cylinder to vector
    const mid = start.clone().add(end).multiplyScalar(0.5);
    beam.position.copy(mid);
    beam.quaternion.setFromUnitVectors(new THREE.Vector3(0, 1, 0), end.clone().sub(start).normalize());

    this.group.add(beam);
    sym.beamMesh = beam;

    console.log(`[Observatory] ${sym.name} ALIGNED TO ORRERY.`);
  }

  /** Activate Central Exit Seal */
  public activateSeal(): void {
    this.isSealActivated = true;
    this.isExitUnlocked = true;

    // Supercharge Orrery Core
    this.orreryCoreLight.color.setHex(0x00ffff);
    this.orreryCoreLight.intensity = 6.0;

    // Dissolve Exit Portal Aperture & illuminate exit pathway
    this.exitPortalAperture.material = new THREE.MeshBasicMaterial({
      color: 0x00ffff,
      transparent: true,
      opacity: 0.25,
      wireframe: true
    });
    this.exitPortalLight.color.setHex(0x00ffcc);
    this.exitPortalLight.intensity = 5.0;

    console.log('[Observatory] CELESTIAL EXIT SEAL BREACHED // CONDUIT OPEN.');
  }

  /** Per-frame update loop */
  public update(deltaSeconds: number): void {
    // 1. Rotate Concentric Orrery Rings at independent astronomical speeds
    if (this.orreryRings[0]) this.orreryRings[0].rotation.z += deltaSeconds * 0.45;
    if (this.orreryRings[1]) this.orreryRings[1].rotation.x += deltaSeconds * 0.65;
    if (this.orreryRings[2]) this.orreryRings[2].rotation.y += deltaSeconds * 0.9;

    // 2. Pulse and spin Inner Core
    if (this.orreryCore) {
      this.orreryCore.rotation.x += deltaSeconds * 1.2;
      this.orreryCore.rotation.y += deltaSeconds * 1.6;
    }

    // 3. Gentle Sway of Rotating Bridge
    if (this.rotatingBridgeGroup) {
      this.bridgeAngle = Math.sin(Date.now() * 0.001) * 0.08;
      this.rotatingBridgeGroup.rotation.y = this.bridgeAngle;
    }

    // 4. Twinkle Starfield
    if (this.starParticles) {
      this.starParticles.rotation.y += deltaSeconds * 0.015;
    }

    // 5. Pulse Exit Portal Aperture if activated
    if (this.isSealActivated && this.exitPortalAperture) {
      this.exitPortalAperture.rotation.z += deltaSeconds * 2.0;
    }
  }
}

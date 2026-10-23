import * as THREE from 'three';
import { ArenaId, WardenAbilityType, WardenState } from '../shared/types.js';
import { NetworkManager } from '../network/NetworkManager.js';

export type CCTVCameraId = 'CAM_A' | 'CAM_B' | 'CAM_C' | 'CAM_D';

export interface CCTVFeed {
  id: CCTVCameraId;
  name: string;
  location: string;
  position: THREE.Vector3;
  target: THREE.Vector3;
  fov: number;
}

export class WardenController {
  public activeCameraId: CCTVCameraId = 'CAM_A';
  public isActive = false;

  private camera: THREE.PerspectiveCamera;
  private network: NetworkManager;

  // 4 Canonical CCTV Camera Surveillance Locations (per WORLD_AND_LEVELS.md)
  public feeds: Record<CCTVCameraId, CCTVFeed> = {
    CAM_A: {
      id: 'CAM_A',
      name: 'CAM 01 // CENTRAL ALTAR',
      location: 'SECTOR 01 • ENTRY RELAY & ALTAR',
      position: new THREE.Vector3(2.0, 4.4, 6.5),
      target: new THREE.Vector3(0, 0.8, -1.0),
      fov: 68
    },
    CAM_B: {
      id: 'CAM_B',
      name: 'CAM 02 // EAST MAINTENANCE',
      location: 'WING EAST • POWER CELL A & TURBINE',
      position: new THREE.Vector3(5.6, 3.8, -2.8),
      target: new THREE.Vector3(8.5, 0.8, -5.2),
      fov: 72
    },
    CAM_C: {
      id: 'CAM_C',
      name: 'CAM 03 // WEST ARCHIVE',
      location: 'WING WEST • POWER CELL B & DATA BANKS',
      position: new THREE.Vector3(-6.2, 4.0, 5.5),
      target: new THREE.Vector3(-7.8, 0.8, -0.5),
      fov: 72
    },
    CAM_D: {
      id: 'CAM_D',
      name: 'CAM 04 // BLAST GATE',
      location: 'SECTOR 01 • CONDUIT GRID & EXIT SLABS',
      position: new THREE.Vector3(1.6, 4.2, -9.0),
      target: new THREE.Vector3(0, 1.8, -15.5),
      fov: 65
    }
  };

  public readonly entryVaultFeeds: Record<CCTVCameraId, CCTVFeed> = { ...this.feeds };

  public readonly livingFoundryFeeds: Record<CCTVCameraId, CCTVFeed> = {
    CAM_A: {
      id: 'CAM_A',
      name: 'CAM 01 // CENTRAL CORE & LIFT',
      location: 'SECTOR 02 • SUSPENDED SERVICE LIFT',
      position: new THREE.Vector3(0, 5.8, 2.5),
      target: new THREE.Vector3(0, 0.8, -4.0),
      fov: 70
    },
    CAM_B: {
      id: 'CAM_B',
      name: 'CAM 02 // ASSEMBLY WALK',
      location: 'SECTOR 02 • ELEVATED CATWALK & NODE B',
      position: new THREE.Vector3(-3.2, 5.4, 3.5),
      target: new THREE.Vector3(-6.0, 3.2, -1.0),
      fov: 72
    },
    CAM_C: {
      id: 'CAM_C',
      name: 'CAM 03 // PRESSURE CHAMBER',
      location: 'SECTOR 02 • PRESSURE MANIFOLD & NODE C',
      position: new THREE.Vector3(2.5, 5.0, -4.5),
      target: new THREE.Vector3(5.5, 1.0, -9.0),
      fov: 72
    },
    CAM_D: {
      id: 'CAM_D',
      name: 'CAM 04 // INTAKE & BYPASS',
      location: 'SECTOR 02 • INTAKE NODE A & TUNNEL',
      position: new THREE.Vector3(2.8, 4.8, 8.2),
      target: new THREE.Vector3(4.2, 1.0, 4.5),
      fov: 70
    }
  };

  public readonly observatoryFeeds: Record<CCTVCameraId, CCTVFeed> = {
    CAM_A: {
      id: 'CAM_A',
      name: 'CAM 01 // CENTRAL ORRERY & SEAL',
      location: 'SECTOR 03 • CELESTIAL ORRERY & NORTH SEAL',
      position: new THREE.Vector3(0, 6.5, 6.0),
      target: new THREE.Vector3(0, 1.2, -6.0),
      fov: 75
    },
    CAM_B: {
      id: 'CAM_B',
      name: 'CAM 02 // ROTATING BRIDGE',
      location: 'SECTOR 03 • EAST CHASM & SYMBOL B PRISM',
      position: new THREE.Vector3(2.5, 5.2, 2.0),
      target: new THREE.Vector3(9.5, 1.0, -2.5),
      fov: 72
    },
    CAM_C: {
      id: 'CAM_C',
      name: 'CAM 03 // UPPER RING CATWALK',
      location: 'SECTOR 03 • HIGH ELEVATION & SYMBOL C LENS',
      position: new THREE.Vector3(0, 7.8, -2.0),
      target: new THREE.Vector3(7.2, 3.6, 6.0),
      fov: 72
    },
    CAM_D: {
      id: 'CAM_D',
      name: 'CAM 04 // LOWER GALLERY',
      location: 'SECTOR 03 • WEST GALLERY & SYMBOL A ASTROLABE',
      position: new THREE.Vector3(-2.0, 5.0, 7.0),
      target: new THREE.Vector3(-9.5, 0.8, 2.0),
      fov: 70
    }
  };

  public setArenaFeeds(arenaId: ArenaId): void {
    if (arenaId === 'LIVING_FOUNDRY') {
      this.feeds = this.livingFoundryFeeds;
    } else if (arenaId === 'OBSERVATORY') {
      this.feeds = this.observatoryFeeds;
    } else {
      this.feeds = this.entryVaultFeeds;
    }
    if (this.isActive) {
      this.switchCamera(this.activeCameraId);
    }
  }

  // Local Warden State Cache
  public state: WardenState = {
    energy: 100,
    maxEnergy: 100,
    blackoutCooldown: 0,
    lockdownCooldown: 0,
    hazardCooldown: 0,
    activeCamera: 'CAM_A'
  };

  // Motorized surveillance pan oscillation
  private panTime = 0;

  constructor(camera: THREE.PerspectiveCamera, network: NetworkManager) {
    this.camera = camera;
    this.network = network;

    this.bindDOM();
  }

  private bindDOM(): void {
    // Camera feed buttons
    document.getElementById('btn-cam-a')?.addEventListener('click', () => this.switchCamera('CAM_A'));
    document.getElementById('btn-cam-b')?.addEventListener('click', () => this.switchCamera('CAM_B'));
    document.getElementById('btn-cam-c')?.addEventListener('click', () => this.switchCamera('CAM_C'));
    document.getElementById('btn-cam-d')?.addEventListener('click', () => this.switchCamera('CAM_D'));

    // Sabotage ability buttons
    document.getElementById('btn-ability-blackout')?.addEventListener('click', () => this.triggerAbility('BLACKOUT'));
    document.getElementById('btn-ability-lockdown')?.addEventListener('click', () => this.triggerAbility('LOCKDOWN_BARRIER'));
    document.getElementById('btn-ability-hazard')?.addEventListener('click', () => this.triggerAbility('ARM_PULSE_HAZARD'));
  }

  public activate(): void {
    this.isActive = true;
    const wardenHUD = document.getElementById('warden-cctv-hud');
    if (wardenHUD) wardenHUD.style.display = 'block';

    const runnerHints = document.getElementById('runner-controls-hints');
    if (runnerHints) runnerHints.style.display = 'none';

    this.switchCamera(this.activeCameraId);
    console.log('[WardenController] Warden Tactical Surveillance Terminal active');
  }

  public deactivate(): void {
    this.isActive = false;
    const wardenHUD = document.getElementById('warden-cctv-hud');
    if (wardenHUD) wardenHUD.style.display = 'none';

    const runnerHints = document.getElementById('runner-controls-hints');
    if (runnerHints) runnerHints.style.display = 'block';
  }

  public switchCamera(id: CCTVCameraId): void {
    this.activeCameraId = id;
    this.state.activeCamera = id;
    const feed = this.feeds[id];

    this.camera.position.copy(feed.position);
    this.camera.fov = feed.fov;
    this.camera.updateProjectionMatrix();
    this.camera.lookAt(feed.target);

    // Update active button state
    ['a', 'b', 'c', 'd'].forEach((k) => {
      const btn = document.getElementById(`btn-cam-${k}`);
      if (btn) {
        if (`CAM_${k.toUpperCase()}` === id) {
          btn.classList.add('active');
        } else {
          btn.classList.remove('active');
        }
      }
    });

    const labelEl = document.getElementById('warden-cam-label');
    const locEl = document.getElementById('warden-cam-location');
    if (labelEl) labelEl.textContent = feed.name;
    if (locEl) locEl.textContent = feed.location;
  }

  public triggerAbility(ability: WardenAbilityType): void {
    if (!this.isActive) return;

    this.network.sendWardenAction(ability, (res) => {
      if (!res.success) {
        console.warn(`[WardenController] Ability ${ability} rejected:`, res.error);
      }
    });
  }

  public updateState(serverState: WardenState): void {
    this.state = serverState;
    this.updateHUD();
  }

  public update(deltaSeconds: number): void {
    if (!this.isActive) return;

    // 1. Motorized surveillance pan/tilt subtle oscillation
    this.panTime += deltaSeconds * 0.3;
    const feed = this.feeds[this.activeCameraId];
    const swayX = Math.sin(this.panTime) * 0.2;
    const swayY = Math.cos(this.panTime * 0.6) * 0.08;

    const currentTarget = feed.target.clone().add(new THREE.Vector3(swayX, swayY, 0));
    this.camera.lookAt(currentTarget);

    // 2. Client-side timer / energy bar tick
    if (this.state.energy < this.state.maxEnergy) {
      this.state.energy = Math.min(100, this.state.energy + 2.5 * deltaSeconds);
    }
    this.state.blackoutCooldown = Math.max(0, this.state.blackoutCooldown - deltaSeconds);
    this.state.lockdownCooldown = Math.max(0, this.state.lockdownCooldown - deltaSeconds);
    this.state.hazardCooldown = Math.max(0, this.state.hazardCooldown - deltaSeconds);

    this.updateHUD();
  }

  private updateHUD(): void {
    // Energy meter
    const energyBar = document.getElementById('warden-energy-fill');
    const energyVal = document.getElementById('warden-energy-val');
    if (energyBar) energyBar.style.width = `${Math.round(this.state.energy)}%`;
    if (energyVal) energyVal.textContent = `${Math.round(this.state.energy)} / 100`;

    // Ability Buttons Cooldowns
    const cdBlackout = document.getElementById('cd-blackout');
    const cdLockdown = document.getElementById('cd-lockdown');
    const cdHazard = document.getElementById('cd-hazard');

    const btnBlackout = document.getElementById('btn-ability-blackout') as HTMLButtonElement;
    const btnLockdown = document.getElementById('btn-ability-lockdown') as HTMLButtonElement;
    const btnHazard = document.getElementById('btn-ability-hazard') as HTMLButtonElement;

    if (cdBlackout && btnBlackout) {
      if (this.state.blackoutCooldown > 0) {
        cdBlackout.textContent = `${Math.ceil(this.state.blackoutCooldown)}s`;
        btnBlackout.disabled = true;
      } else {
        cdBlackout.textContent = 'READY [35 EN]';
        btnBlackout.disabled = this.state.energy < 35;
      }
    }

    if (cdLockdown && btnLockdown) {
      if (this.state.lockdownCooldown > 0) {
        cdLockdown.textContent = `${Math.ceil(this.state.lockdownCooldown)}s`;
        btnLockdown.disabled = true;
      } else {
        cdLockdown.textContent = 'READY [40 EN]';
        btnLockdown.disabled = this.state.energy < 40;
      }
    }

    if (cdHazard && btnHazard) {
      if (this.state.hazardCooldown > 0) {
        cdHazard.textContent = `${Math.ceil(this.state.hazardCooldown)}s`;
        btnHazard.disabled = true;
      } else {
        cdHazard.textContent = 'READY [30 EN]';
        btnHazard.disabled = this.state.energy < 30;
      }
    }

    // CCTV Timestamp string (e.g. REC 00:01:24.08)
    const timeEl = document.getElementById('warden-rec-timestamp');
    if (timeEl) {
      const d = new Date();
      timeEl.textContent = `REC ${d.toTimeString().split(' ')[0]}.${Math.floor(d.getMilliseconds() / 10).toString().padStart(2, '0')}`;
    }
  }
}

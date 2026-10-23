import * as THREE from 'three';
import { PerformanceMonitor } from './PerformanceMonitor.js';
import { LightingManager } from '../rendering/Lighting.js';
import { EntryVault } from '../world/EntryVault.js';
import { PowerCell } from '../world/PowerCell.js';
import { EntryRelay } from '../world/EntryRelay.js';
import { ExitGate } from '../world/ExitGate.js';
import { ArenaManager } from '../world/ArenaManager.js';
import { Ambience } from '../audio/Ambience.js';
import { CollisionSystem } from '../physics/CollisionSystem.js';
import { GuestCharacter } from '../character/GuestCharacter.js';
import { RemotePlayer } from '../character/RemotePlayer.js';
import { ThirdPersonCamera } from '../controls/ThirdPersonCamera.js';
import { ObjectiveManager } from '../gameplay/ObjectiveManager.js';
import { NetworkManager } from '../network/NetworkManager.js';
import { ArenaId, NetworkMatchState } from '../shared/types.js';
import { WardenController } from '../warden/WardenController.js';

export type QualityPreset = 'low' | 'med' | 'high';

export class Engine {
  public canvas: HTMLCanvasElement;
  public renderer: THREE.WebGLRenderer;
  public scene: THREE.Scene;
  public camera: THREE.PerspectiveCamera;

  public lighting!: LightingManager;
  public arenaManager!: ArenaManager;
  public vault!: EntryVault;
  public cellA!: PowerCell;
  public cellB!: PowerCell;
  public relay!: EntryRelay;
  public gate!: ExitGate;
  public ambience!: Ambience;
  public collision!: CollisionSystem;
  public player!: GuestCharacter;
  public tpCamera!: ThirdPersonCamera;
  public objectives!: ObjectiveManager;
  public perfMonitor!: PerformanceMonitor;
  public network!: NetworkManager;
  public warden!: WardenController;

  // Remote peer representation
  public remotePlayers = new Map<string, RemotePlayer>();

  private clock = new THREE.Clock();
  private isRunning = false;
  private currentPreset: QualityPreset = 'med';

  // Input states
  private keys: { [code: string]: boolean } = {};
  private interactPressed = false;

  private presetScales = {
    low: 0.75,
    med: 0.85,
    high: 1.0
  };

  constructor(canvasId: string) {
    const el = document.getElementById(canvasId);
    if (!el || !(el instanceof HTMLCanvasElement)) {
      throw new Error(`Canvas element with id "${canvasId}" not found`);
    }
    this.canvas = el;

    // 1. Scene Initialization
    this.scene = new THREE.Scene();
    this.scene.background = new THREE.Color(0x05070a);

    // 2. Camera Setup (65 deg FOV, ideal for atmospheric corridor claustrophobia)
    this.camera = new THREE.PerspectiveCamera(
      65,
      window.innerWidth / window.innerHeight,
      0.1,
      60
    );

    // 3. WebGLRenderer with low-overhead flags
    this.renderer = new THREE.WebGLRenderer({
      canvas: this.canvas,
      antialias: false,
      powerPreference: 'high-performance',
      stencil: false,
      depth: true,
      alpha: false
    });

    this.renderer.outputColorSpace = THREE.SRGBColorSpace;
    this.renderer.toneMapping = THREE.ACESFilmicToneMapping;
    this.renderer.toneMappingExposure = 1.1;

    // Setup Performance Diagnostics
    this.perfMonitor = new PerformanceMonitor(this.renderer);

    // Initialize Subsystems
    this.initSubsystems();

    // Set initial quality & sizing
    this.applyQualityPreset('med');
    this.applyTheme('light');
    this.initWindowListeners();
    this.initNetworkUI();
  }

  private initSubsystems(): void {
    // 1. Audio Engine & Ambience
    this.ambience = new Ambience();

    // 2. Physics & Collision System
    this.collision = new CollisionSystem();

    // 3. Lighting & Atmospheric Fog
    this.lighting = new LightingManager(this.scene);

    // 4. Stylized Captive Runner (Local Guest)
    this.player = new GuestCharacter(this.collision, this.ambience);
    this.scene.add(this.player.mesh);

    // 5. Smooth Third-Person Spring-Arm Follow Camera
    this.tpCamera = new ThirdPersonCamera(this.camera, this.canvas, this.collision);

    // 6. Multiplayer Network Manager
    this.network = new NetworkManager();

    // 7. Warden CCTV Tactical Surveillance Controller
    this.warden = new WardenController(this.camera, this.network);

    // 8. Multi-Arena Manager (Sector 01: Entry Vault & Sector 02: Living Foundry)
    this.arenaManager = new ArenaManager(
      this.scene,
      this.collision,
      this.warden,
      this.player
    );

    this.vault = this.arenaManager.entryVault;
    this.cellA = this.arenaManager.cellA;
    this.cellB = this.arenaManager.cellB;
    this.relay = this.arenaManager.entryRelay;
    this.gate = this.arenaManager.exitGate;

    // 9. Objective & Interaction Manager
    this.objectives = new ObjectiveManager(
      this.player,
      this.cellA,
      this.cellB,
      this.relay,
      this.vault,
      this.gate,
      this.collision,
      this.ambience,
      (action) => {
        this.network.sendAction(action);
      }
    );
    this.objectives.livingFoundry = this.arenaManager.livingFoundry;
    this.objectives.observatory = this.arenaManager.observatory;

    this.setupNetworkCallbacks();
  }

  private setupNetworkCallbacks(): void {
    this.network.onPlayerJoined = (player) => {
      if (player.id !== this.network.localPlayerId && !this.remotePlayers.has(player.id)) {
        console.log(`[DREADLOCK Engine] Spawning peer avatar for ${player.name} (${player.id})`);
        const remote = new RemotePlayer(player.id, player.name, player.position);
        this.remotePlayers.set(player.id, remote);
        this.scene.add(remote.mesh);
      }
    };

    this.network.onPlayerMoved = (data) => {
      const remote = this.remotePlayers.get(data.id);
      if (remote) {
        remote.setTargetTransform(data.position, data.rotationY, data.isMoving);
      }
    };

    this.network.onPlayerLeft = (playerId) => {
      const remote = this.remotePlayers.get(playerId);
      if (remote) {
        console.log(`[DREADLOCK Engine] Removing peer avatar for ${playerId}`);
        remote.dispose();
        this.remotePlayers.delete(playerId);
      }
    };

    this.network.onMatchStateSync = (state) => {
      this.syncMatchState(state);
    };

    this.network.onObjectiveUpdated = (objectives) => {
      this.objectives.applyRemoteObjectiveState(objectives);
    };

    this.network.onFacilityEvent = (event) => {
      if (event.type === 'BLACKOUT') {
        this.lighting.triggerBlackout(event.durationSeconds);
        this.ambience.playHydraulicReleaseSound();
      }
    };

    this.network.onWardenStateUpdated = (wState) => {
      this.warden.updateState(wState);
    };

    this.network.onServerMessage = (text, type) => {
      const alertEl = document.querySelector('.facility-alert') as HTMLElement;
      if (alertEl) {
        alertEl.textContent = text;
        if (type === 'alert') {
          alertEl.style.color = '#ffaa22';
          alertEl.style.borderColor = 'rgba(255, 170, 34, 0.8)';
        } else if (type === 'info') {
          alertEl.style.color = '#00f0d2';
          alertEl.style.borderColor = 'rgba(0, 240, 210, 0.8)';
        } else {
          alertEl.style.color = '#ff4444';
        }
      }
    };
  }

  private syncMatchState(state: NetworkMatchState): void {
    // 1. Synchronize remote players from state
    for (const [id, pState] of Object.entries(state.players)) {
      if (id !== this.network.localPlayerId && !this.remotePlayers.has(id)) {
        const remote = new RemotePlayer(id, pState.name, pState.position);
        this.remotePlayers.set(id, remote);
        this.scene.add(remote.mesh);
      }
    }

    // 2. Remove any cached remote players not in state
    for (const [id, remote] of this.remotePlayers.entries()) {
      if (!state.players[id]) {
        remote.dispose();
        this.remotePlayers.delete(id);
      }
    }

    // 3. Synchronize Arena if server switched sector
    if (state.arenaId && state.arenaId !== this.arenaManager.activeArenaId) {
      this.arenaManager.mountArena(state.arenaId);
      this.objectives.setArena(state.arenaId, this.arenaManager.livingFoundry, this.arenaManager.observatory);
    }

    // 4. Synchronize canonical objectives
    if (state.objectives) {
      this.objectives.applyRemoteObjectiveState(state.objectives);
    }

    // 4. Update HUD Elements
    const badgeEl = document.getElementById('net-status-badge');
    const displayCount = document.getElementById('display-player-count');
    const displayRole = document.getElementById('display-player-role');
    const displayCode = document.getElementById('display-room-code');
    const roomBox = document.getElementById('net-room-display');
    const lobbyControls = document.getElementById('net-lobby-controls');
    const alertEl = document.querySelector('.facility-alert') as HTMLElement;

    if (displayCode) displayCode.textContent = state.roomId;
    if (roomBox) roomBox.style.display = 'block';
    if (lobbyControls) lobbyControls.style.display = 'none';

    const playerCount = Object.keys(state.players).length;
    if (displayCount) displayCount.textContent = `${playerCount} / 2`;

    const myRole = state.players[this.network.localPlayerId || '']?.role || 'GUEST';
    if (displayRole) displayRole.textContent = myRole;

    // Toggle Warden Tactical Console vs Runner Third-Person Camera
    if (myRole === 'WARDEN') {
      if (!this.warden.isActive) {
        this.warden.activate();
        const diag = document.getElementById('diagnostics-panel');
        if (diag) diag.style.display = 'none';
      }
      if (state.wardenState) {
        this.warden.updateState(state.wardenState);
      }
    } else {
      if (this.warden.isActive) {
        this.warden.deactivate();
        const diag = document.getElementById('diagnostics-panel');
        if (diag) diag.style.display = 'block';
      }
    }

    if (state.phase === 'WAITING_FOR_PLAYERS') {
      if (badgeEl) {
        badgeEl.textContent = `ROOM: ${state.roomId} (1/2 WAITING)`;
        badgeEl.className = 'net-status-badge online';
      }
      if (alertEl) {
        alertEl.textContent = `COVENANT ENGINE: WAITING FOR SUBJECT 2 [ROOM ${state.roomId}]`;
      }
    } else if (state.phase === 'READY_COUNTDOWN') {
      const sec = Math.ceil(state.countdownRemaining);
      if (badgeEl) {
        badgeEl.textContent = `COUNTDOWN: ${sec}s (2/2)`;
        badgeEl.className = 'net-status-badge live';
      }
      if (alertEl) {
        alertEl.textContent = `TRIAL STARTING IN ${sec}s // BOTH SUBJECTS LINKED`;
      }
    } else if (state.phase === 'LIVE_ROUND') {
      const sec = Math.ceil(state.roundTimeRemaining);
      if (badgeEl) {
        badgeEl.textContent = `LIVE: ${sec}s [R${state.roundIndex}]`;
        badgeEl.className = 'net-status-badge live';
      }
      if (alertEl) {
        alertEl.textContent = `ROUND ${state.roundIndex} LIVE // ${sec}s REMAINING // ROLE: ${myRole}`;
      }
    } else if (state.phase === 'ROUND_RESOLVE') {
      if (badgeEl) {
        badgeEl.textContent = `RESOLVING ROUND`;
      }
    }
  }

  private initNetworkUI(): void {
    const btnCreate = document.getElementById('btn-create-room');
    const btnJoin = document.getElementById('btn-join-room');
    const inputName = document.getElementById('net-player-name') as HTMLInputElement;
    const inputCode = document.getElementById('net-room-code') as HTMLInputElement;

    btnCreate?.addEventListener('click', async () => {
      const name = inputName?.value.trim() || 'Subject-01';
      btnCreate.textContent = 'CREATING...';
      const res = await this.network.createRoom(name);
      if (res.success) {
        btnCreate.textContent = 'ROOM CREATED';
      } else {
        alert(`Failed to create room: ${res.error || 'Server unreachable'}`);
        btnCreate.textContent = 'HOST NEW ROOM';
      }
    });

    btnJoin?.addEventListener('click', async () => {
      const name = inputName?.value.trim() || 'Subject-02';
      const code = inputCode?.value.trim().toUpperCase() || '';
      if (!code) {
        alert('Please enter a 4-letter room code.');
        return;
      }

      btnJoin.textContent = 'JOINING...';
      const res = await this.network.joinRoom(code, name);
      if (res.success) {
        btnJoin.textContent = 'JOINED';
      } else {
        alert(`Failed to join room: ${res.error || 'Room not found'}`);
        btnJoin.textContent = 'JOIN';
      }
    });
  }

  public getCurrentPreset(): QualityPreset {
    return this.currentPreset;
  }

  public applyQualityPreset(preset: QualityPreset): void {
    this.currentPreset = preset;
    const scale = this.presetScales[preset];

    // Configure shadow map
    if (preset === 'low') {
      this.renderer.shadowMap.enabled = false;
      this.lighting.setShadowsEnabled(false);
    } else if (preset === 'med') {
      this.renderer.shadowMap.enabled = true;
      this.renderer.shadowMap.type = THREE.PCFShadowMap;
      this.lighting.setShadowsEnabled(true);
    } else {
      this.renderer.shadowMap.enabled = true;
      this.renderer.shadowMap.type = THREE.PCFSoftShadowMap;
      this.lighting.setShadowsEnabled(true);
    }

    // Set internal resolution scaling
    const pixelRatio = Math.min(window.devicePixelRatio, 1.25) * scale;
    this.renderer.setPixelRatio(pixelRatio);
    this.onWindowResize();

    // Update UI button states
    ['low', 'med', 'high'].forEach((p) => {
      const btn = document.getElementById(`btn-${p}`);
      if (btn) {
        if (p === preset) {
          btn.classList.add('active');
        } else {
          btn.classList.remove('active');
        }
      }
    });
  }

  public applyTheme(theme: 'light' | 'dark'): void {
    this.lighting.applyTheme(theme);

    if (theme === 'light') {
      document.body.classList.add('light-theme');
      document.body.classList.remove('dark-theme');
    } else {
      document.body.classList.add('dark-theme');
      document.body.classList.remove('light-theme');
    }

    const btnLight = document.getElementById('btn-theme-light');
    const btnDark = document.getElementById('btn-theme-dark');
    if (btnLight && btnDark) {
      if (theme === 'light') {
        btnLight.classList.add('active');
        btnDark.classList.remove('active');
      } else {
        btnDark.classList.add('active');
        btnLight.classList.remove('active');
      }
    }
  }

  public toggleTheme(): void {
    const nextTheme = this.lighting.currentTheme === 'light' ? 'dark' : 'light';
    this.applyTheme(nextTheme);
  }

  private initWindowListeners(): void {
    window.addEventListener('resize', () => this.onWindowResize(), { passive: true });

    // Hook preset buttons
    document.getElementById('btn-low')?.addEventListener('click', () => this.applyQualityPreset('low'));
    document.getElementById('btn-med')?.addEventListener('click', () => this.applyQualityPreset('med'));
    document.getElementById('btn-high')?.addEventListener('click', () => this.applyQualityPreset('high'));

    // Hook theme buttons
    document.getElementById('btn-theme-light')?.addEventListener('click', () => this.applyTheme('light'));
    document.getElementById('btn-theme-dark')?.addEventListener('click', () => this.applyTheme('dark'));

    // Hook Credits modal
    const creditsModal = document.getElementById('credits-modal');
    document.getElementById('btn-open-credits')?.addEventListener('click', () => {
      if (creditsModal) creditsModal.style.display = 'flex';
    });
    document.getElementById('btn-close-credits')?.addEventListener('click', () => {
      if (creditsModal) creditsModal.style.display = 'none';
    });

    // Keyboard event listeners
    window.addEventListener('keydown', (e) => {
      this.keys[e.code] = true;

      if (e.code === 'Escape') {
        const credits = document.getElementById('credits-modal');
        if (credits && credits.style.display !== 'none') {
          credits.style.display = 'none';
        }
      }

      if (e.code === 'KeyE') {
        this.interactPressed = true;
      }

      // Tab toggles diagnostics HUD overlay
      if (e.code === 'Tab') {
        e.preventDefault();
        const diag = document.getElementById('diagnostics-panel');
        if (diag) {
          diag.style.display = diag.style.display === 'none' ? 'block' : 'none';
        }
      }

      // T toggles light / dark theme
      if (e.code === 'KeyT') {
        this.toggleTheme();
      }

      // Y toggles between Sector 01 (Entry Vault), Sector 02 (Living Foundry), Sector 03 (Observatory)
      if (e.code === 'KeyY') {
        let nextArena: ArenaId = 'LIVING_FOUNDRY';
        if (this.arenaManager.activeArenaId === 'ENTRY_VAULT') nextArena = 'LIVING_FOUNDRY';
        else if (this.arenaManager.activeArenaId === 'LIVING_FOUNDRY') nextArena = 'OBSERVATORY';
        else nextArena = 'ENTRY_VAULT';

        this.arenaManager.mountArena(nextArena);
        this.objectives.setArena(nextArena, this.arenaManager.livingFoundry, this.arenaManager.observatory);
      }

      // Warden shortcut keys (Cameras 1-4, Abilities Q, W, E)
      if (this.warden.isActive) {
        if (e.code === 'Digit1') this.warden.switchCamera('CAM_A');
        if (e.code === 'Digit2') this.warden.switchCamera('CAM_B');
        if (e.code === 'Digit3') this.warden.switchCamera('CAM_C');
        if (e.code === 'Digit4') this.warden.switchCamera('CAM_D');
        if (e.code === 'KeyQ') this.warden.triggerAbility('BLACKOUT');
        if (e.code === 'KeyW') this.warden.triggerAbility('LOCKDOWN_BARRIER');
        if (e.code === 'KeyE') this.warden.triggerAbility('ARM_PULSE_HAZARD');
      }

      // M toggles ambience mute
      if (e.code === 'KeyM') {
        this.ambience.toggleMute();
      }
    });

    window.addEventListener('keyup', (e) => {
      this.keys[e.code] = false;
    });

    // Browsers block audio until a trusted gesture
    const unlockAudio = (): void => {
      this.ambience.start();
      this.ambience.resume();
    };
    window.addEventListener('pointerdown', unlockAudio);
    window.addEventListener('keydown', unlockAudio);
  }

  public onWindowResize(): void {
    const width = window.innerWidth;
    const height = window.innerHeight;

    this.camera.aspect = width / height;
    this.camera.updateProjectionMatrix();

    this.renderer.setSize(width, height, false);
  }

  public start(): void {
    if (this.isRunning) return;
    this.isRunning = true;
    this.clock.start();
    this.animate();
    console.log('[DREADLOCK Engine] Started render loop with Multiplayer Synchronization');
  }

  private animate = (): void => {
    if (!this.isRunning) return;
    requestAnimationFrame(this.animate);

    const delta = Math.min(this.clock.getDelta(), 0.05); // clamp delta
    const elapsed = this.clock.getElapsedTime();

    // 1. Gather movement input vector (X: strafe, Y: forward/back)
    const inputDir = new THREE.Vector2(0, 0);
    if (this.keys['KeyW'] || this.keys['ArrowUp']) inputDir.y += 1.0;
    if (this.keys['KeyS'] || this.keys['ArrowDown']) inputDir.y -= 1.0;
    if (this.keys['KeyD'] || this.keys['ArrowRight']) inputDir.x += 1.0;
    if (this.keys['KeyA'] || this.keys['ArrowLeft']) inputDir.x -= 1.0;

    const jumpRequested = Boolean(this.keys['Space']);
    const interactTriggered = this.interactPressed;
    this.interactPressed = false;

    const myRole = this.network.currentState?.players[this.network.localPlayerId || '']?.role || 'GUEST';

    if (myRole === 'WARDEN' && this.warden.isActive) {
      // 2. Update Warden CCTV Surveillance Feed
      this.warden.update(delta);
    } else {
      // 2. Update local player kinematic character controller
      this.player.update(delta, inputDir, this.tpCamera.yaw, jumpRequested);

      // 3. Send player movement over network if connected to a room
      if (this.network.isConnected && this.network.roomId) {
        const isMoving = this.player.velocity.lengthSq() > 0.05;
        this.network.sendMovement(
          this.player.position,
          this.player.headingAngle,
          isMoving,
          this.player.isGrounded
        );
      }

      // 5. Update Third-Person Follow Camera
      this.tpCamera.update(this.player.position, delta);
    }

    // 4. Update all remote peer avatars
    for (const remote of this.remotePlayers.values()) {
      remote.update(delta);
    }

    // 6. Update World Actors (Active Arena & Lighting)
    this.arenaManager.update(delta);
    this.lighting.update(elapsed, delta);

    // 7. Update Gameplay Objectives & Interaction Triggers
    if (myRole === 'GUEST') {
      this.objectives.update(delta, interactTriggered);
    }

    // 8. Render 3D Scene
    this.renderer.render(this.scene, this.camera);

    // 9. Update Performance Diagnostics
    this.perfMonitor.update();
  };

  public stop(): void {
    this.isRunning = false;
  }
}

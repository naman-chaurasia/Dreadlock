import * as THREE from 'three';
import { PerformanceMonitor } from './PerformanceMonitor.js';
import { LightingManager } from '../rendering/Lighting.js';
import { EntryVault } from '../world/EntryVault.js';
import { EnergyShard } from '../world/EnergyShard.js';
import { ExitGate } from '../world/ExitGate.js';
import { CameraController } from '../controls/CameraController.js';
import { Ambience } from '../audio/Ambience.js';

export type QualityPreset = 'low' | 'med' | 'high';

export class Engine {
  public canvas: HTMLCanvasElement;
  public renderer: THREE.WebGLRenderer;
  public scene: THREE.Scene;
  public camera: THREE.PerspectiveCamera;

  public lighting!: LightingManager;
  public vault!: EntryVault;
  public shard!: EnergyShard;
  public gate!: ExitGate;
  public controls!: CameraController;
  public perfMonitor!: PerformanceMonitor;
  public ambience!: Ambience;

  private clock = new THREE.Clock();
  private isRunning = false;
  private currentPreset: QualityPreset = 'med';

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
    this.initWindowListeners();
  }

  private initSubsystems(): void {
    // Lighting & Fog
    this.lighting = new LightingManager(this.scene);

    // World & Architecture
    this.vault = new EntryVault();
    this.scene.add(this.vault.group);

    // Supernatural Energy Shard
    this.shard = new EnergyShard();
    this.scene.add(this.shard.group);

    // Sealed Exit Gate
    this.gate = new ExitGate();
    this.scene.add(this.gate.group);

    // Interactive Camera Controls
    this.controls = new CameraController(this.camera, this.canvas);

    // Restrained procedural ambience (Web Audio, no external files)
    this.ambience = new Ambience();
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

    console.log(`[DREADLOCK Engine] Quality preset applied: ${preset.toUpperCase()} (Scale: ${scale}x, Shadows: ${this.renderer.shadowMap.enabled})`);
  }

  private initWindowListeners(): void {
    window.addEventListener('resize', () => this.onWindowResize(), { passive: true });

    // Hook preset buttons
    document.getElementById('btn-low')?.addEventListener('click', () => this.applyQualityPreset('low'));
    document.getElementById('btn-med')?.addEventListener('click', () => this.applyQualityPreset('med'));
    document.getElementById('btn-high')?.addEventListener('click', () => this.applyQualityPreset('high'));

    // Browsers block audio until a trusted gesture: start ambience on the
    // first click or keypress, and keep it resumed afterwards.
    const unlockAudio = (): void => {
      this.ambience.start();
      this.ambience.resume();
    };
    window.addEventListener('pointerdown', unlockAudio);
    window.addEventListener('keydown', unlockAudio);

    // M toggles ambience mute
    window.addEventListener('keydown', (e) => {
      if (e.code === 'KeyM') this.ambience.toggleMute();
    });
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
    console.log('[DREADLOCK Engine] Started render loop');
  }

  private animate = (): void => {
    if (!this.isRunning) return;
    requestAnimationFrame(this.animate);

    const delta = Math.min(this.clock.getDelta(), 0.1); // clamp delta to prevent giant jumps
    const elapsed = this.clock.getElapsedTime();

    // Subsystem frame updates
    this.controls.update(delta);
    this.shard.update(elapsed);
    this.gate.update(elapsed);
    this.lighting.update(elapsed);

    // Render 3D scene
    this.renderer.render(this.scene, this.camera);

    // Diagnostics update
    this.perfMonitor.update();
  };

  public stop(): void {
    this.isRunning = false;
  }
}

import * as THREE from 'three';

export class LightingManager {
  public scene: THREE.Scene;
  public ambientLight!: THREE.AmbientLight;
  public dirKeyLight!: THREE.DirectionalLight;
  public shardTealLight!: THREE.PointLight;
  public gateAmberLight!: THREE.PointLight;
  public ceilingStripLights: THREE.PointLight[] = [];

  public currentTheme: 'light' | 'dark' = 'light';

  private shardLightBaseIntensity = 2.8;
  private gateLightBaseIntensity = 2.2;

  constructor(scene: THREE.Scene) {
    this.scene = scene;
    this.setupFog();
    this.setupLights();
    this.applyTheme('light'); // Default to high-visibility light theme
  }

  private setupFog(): void {
    // Atmospheric exponential fog: deep charcoal-navy with subtle blue undertone
    this.scene.fog = new THREE.FogExp2(0x06090e, 0.055);
  }

  private setupLights(): void {
    // 1. Low-intensity ambient fill to keep silhouettes dark without absolute pitch black
    this.ambientLight = new THREE.AmbientLight(0x0a121a, 0.6);
    this.scene.add(this.ambientLight);

    // 2. Directional Key Light from vault ceiling grille
    this.dirKeyLight = new THREE.DirectionalLight(0xa5c4d4, 1.2);
    this.dirKeyLight.position.set(0, 12, 4);
    this.dirKeyLight.target.position.set(0, 0, -6);
    this.scene.add(this.dirKeyLight);
    this.scene.add(this.dirKeyLight.target);

    // Configure optional soft shadow map
    this.dirKeyLight.castShadow = true;
    this.dirKeyLight.shadow.mapSize.width = 1024;
    this.dirKeyLight.shadow.mapSize.height = 1024;
    this.dirKeyLight.shadow.camera.near = 1;
    this.dirKeyLight.shadow.camera.far = 28;
    this.dirKeyLight.shadow.camera.left = -8;
    this.dirKeyLight.shadow.camera.right = 8;
    this.dirKeyLight.shadow.camera.top = 16;
    this.dirKeyLight.shadow.camera.bottom = -16;
    this.dirKeyLight.shadow.bias = -0.001;

    // 3. Shard Accent Light (Intense mystical Teal/Cyan)
    this.shardTealLight = new THREE.PointLight(0x00f0d2, this.shardLightBaseIntensity, 14, 1.8);
    this.shardTealLight.position.set(0, 2.2, 0);
    this.scene.add(this.shardTealLight);

    // 4. Exit Gate Accent Light (Menacing Industrial Warning Amber)
    this.gateAmberLight = new THREE.PointLight(0xff8c00, this.gateLightBaseIntensity, 16, 1.6);
    this.gateAmberLight.position.set(0, 3.8, -14.5);
    this.scene.add(this.gateAmberLight);

    // 5. Corridor overhead amber emergency markers
    const stripZPositions = [6, -4, -10];
    for (const z of stripZPositions) {
      const pLight = new THREE.PointLight(0xffa834, 0.8, 8, 2.0);
      pLight.position.set(0, 4.6, z);
      this.scene.add(pLight);
      this.ceilingStripLights.push(pLight);
    }
  }

  public update(timeSeconds: number, deltaSeconds = 0.016): void {
    // Check active blackout countdown
    if (this.blackoutRemaining > 0) {
      this.blackoutRemaining -= deltaSeconds;
      if (this.blackoutRemaining <= 0) {
        this.applyTheme(this.currentTheme);
      }
    }

    // Subtle supernatural heartbeat oscillation on shard light
    const shardPulse = Math.sin(timeSeconds * 2.8) * 0.45 + Math.sin(timeSeconds * 5.2) * 0.15;
    this.shardTealLight.intensity = this.shardLightBaseIntensity + shardPulse;

    // Slow ominous breathing pulse on gate beacon
    const gatePulse = Math.sin(timeSeconds * 1.5) * 0.35;
    this.gateAmberLight.intensity = this.gateLightBaseIntensity + gatePulse;
  }

  public applyTheme(theme: 'light' | 'dark'): void {
    this.currentTheme = theme;
    if (theme === 'light') {
      // High-visibility bright inspection mode:
      // Neutral crisp slate background & gentle mist
      this.scene.background = new THREE.Color(0xb0c4de);
      this.scene.fog = new THREE.FogExp2(0xb0c4de, 0.009);

      // Bright neutral ambient fill (illuminates all corners & props)
      this.ambientLight.color.setHex(0xffffff);
      this.ambientLight.intensity = 2.0;

      // Bright directional key light
      this.dirKeyLight.color.setHex(0xffffff);
      this.dirKeyLight.intensity = 2.4;

      // Boost overhead strip markers
      for (const p of this.ceilingStripLights) {
        p.intensity = 2.0;
        p.color.setHex(0xffc56e);
      }
      this.shardLightBaseIntensity = 3.0;
      this.gateLightBaseIntensity = 2.4;
    } else {
      // Atmospheric dark horror mode
      this.scene.background = new THREE.Color(0x05070a);
      this.scene.fog = new THREE.FogExp2(0x06090e, 0.055);

      this.ambientLight.color.setHex(0x0a121a);
      this.ambientLight.intensity = 0.6;

      this.dirKeyLight.color.setHex(0xa5c4d4);
      this.dirKeyLight.intensity = 1.2;

      for (const p of this.ceilingStripLights) {
        p.intensity = 0.8;
        p.color.setHex(0xffa834);
      }
      this.shardLightBaseIntensity = 2.4;
      this.gateLightBaseIntensity = 1.8;
    }
  }

  public setShadowsEnabled(enabled: boolean): void {
    this.dirKeyLight.castShadow = enabled;
  }

  // Active Blackout state
  private blackoutRemaining = 0;

  public triggerBlackout(durationSeconds: number): void {
    this.blackoutRemaining = durationSeconds;
    this.ambientLight.intensity = 0.18;
    this.dirKeyLight.intensity = 0.25;
    for (const p of this.ceilingStripLights) {
      p.color.setHex(0xff2200);
      p.intensity = 1.8;
    }
  }
}
